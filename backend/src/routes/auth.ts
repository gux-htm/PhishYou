import { Router } from 'express';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { databaseService, verifyPassword, normalizeEmail, type StoredUser } from '../services/database.js';
import { emailService } from '../services/email.js';

export const authRouter = Router();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
const VERIFY_TTL_MS = 1000 * 60 * 60 * 24;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSecret(): string { return process.env.AUTH_SECRET || 'phishyou-dev-secret-change-me'; }
function signToken(payload: Record<string, unknown>): string { const body = Buffer.from(JSON.stringify(payload)).toString('base64url'); const signature = createHmac('sha256', getSecret()).update(body).digest('base64url'); return `${body}.${signature}`; }
function verifyToken(token: string): Record<string, unknown> | null {
  const [body, signature] = token.split('.'); if (!body || !signature) return null;
  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url'); const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>; if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null; return payload; } catch { return null; }
}
function issueToken(user: StoredUser): string { return signToken({ sub: user.id, email: user.email, name: user.name, organization: user.organization, role: user.role, exp: Date.now() + TOKEN_TTL_MS }); }
function publicUser(user: StoredUser) { return { id: user.id, email: user.email, name: user.name, organization: user.organization, role: user.role }; }
function readBearer(headers: Record<string, string | string[] | undefined>): string | null { const header = headers.authorization; const value = Array.isArray(header) ? header[0] : header; return value?.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : null; }
function hashVerificationToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
function getVerificationUrl(token: string, email: string): string { const base = process.env.APP_BASE_URL || 'http://localhost:5173'; return `${base}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`; }

async function issueVerification(user: StoredUser) {
  const token = randomBytes(32).toString('hex');
  await databaseService.updateUser(user.id, { emailVerifiedAt: undefined, emailVerificationHash: hashVerificationToken(token), emailVerificationExpiresAt: new Date(Date.now() + VERIFY_TTL_MS).toISOString() });
  const url = getVerificationUrl(token, user.email);
  const result = await emailService.sendEmail({
    to: user.email,
    subject: 'Verify your PhishYou operator account',
    text: `Verify your PhishYou operator account: ${url}`,
    html: `<p>Verify your PhishYou operator account.</p><p><a href="${url}">Verify email</a></p>`,
  });
  return { result, url };
}

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, role, consent } = req.body as { name?: string; email?: string; password?: string; organization?: string; role?: string; consent?: boolean };
    if (!name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'A valid work email is required.' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!organization?.trim()) return res.status(400).json({ error: 'Organization is required.' });
    if (!consent) return res.status(400).json({ error: 'You must accept the authorized-use agreement.' });
    const existing = await databaseService.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
    const user = await databaseService.createUser({ name: name.trim(), email: normalizeEmail(email), password, organization: organization.trim(), role: role?.trim() || 'Security Analyst' });

    // First-run accounts must be able to enter the product before SMTP or MFA is configured.
    // Email verification remains available as an optional, user-enabled security step.
    return res.status(201).json({ success: true, verificationRequired: false, email: user.email });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : 'Registration failed.' }); }
});

authRouter.post('/verify-email', async (req, res) => {
  const token = String((req.body as { token?: string }).token ?? '').trim();
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });
  const hash = hashVerificationToken(token);
  const users = await databaseService.listUsers();
  const user = users.find((candidate) => candidate.emailVerificationHash === hash);
  if (!user || !user.emailVerificationExpiresAt || Date.now() > Date.parse(user.emailVerificationExpiresAt)) return res.status(400).json({ error: 'Verification token is invalid or expired.' });
  await databaseService.updateUser(user.id, { emailVerifiedAt: new Date().toISOString(), emailVerificationHash: undefined, emailVerificationExpiresAt: undefined });
  return res.json({ success: true, email: user.email });
});

authRouter.post('/resend-verification', async (req, res) => {
  const email = normalizeEmail(String((req.body as { email?: string }).email ?? ''));
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  const user = await databaseService.findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  const { result, url } = await issueVerification(user);
  return res.json({ success: true, verificationRequired: true, email, ...(result.simulated || process.env.NODE_ENV !== 'production' ? { verificationUrl: url } : {}) });
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = await databaseService.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password.' });
    await databaseService.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    return res.json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : 'Login failed.' }); }
});

authRouter.get('/me', async (req, res) => {
  const token = readBearer(req.headers); if (!token) return res.status(401).json({ error: 'Missing bearer token.' });
  const payload = verifyToken(token); if (!payload || typeof payload.sub !== 'string') return res.status(401).json({ error: 'Invalid or expired token.' });
  const user = await databaseService.findUserById(payload.sub); if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
  return res.json({ user: publicUser(user) });
});
