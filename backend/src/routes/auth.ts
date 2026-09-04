/**
 * PhishYou — Authentication routes (registration + login)
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md (OAuth2 + REST, /api/v1)
 *       PHISHYOU_SPECS/12_COMPLIANCE/DATA_PROTECTION.md
 *
 * Accounts are persisted through `databaseService` (passwords hashed with scrypt).
 * Sessions use a dependency-free HMAC token; set AUTH_SECRET in the environment
 * for production. Tokens are returned to the client and held in memory there.
 */
import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { databaseService, verifyPassword, normalizeEmail, type StoredUser } from '../services/database.js';

export const authRouter = Router();

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSecret(): string {
  return process.env.AUTH_SECRET || 'phishyou-dev-secret-change-me';
}

function signToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token: string): Record<string, unknown> | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueToken(user: StoredUser): string {
  return signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    organization: user.organization,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  });
}

function publicUser(user: StoredUser) {
  return { id: user.id, email: user.email, name: user.name, organization: user.organization, role: user.role };
}

function readBearer(headers: Record<string, string | string[] | undefined>): string | null {
  const header = headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || !value.toLowerCase().startsWith('bearer ')) return null;
  return value.slice(7).trim();
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, role, consent } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      organization?: string;
      role?: string;
      consent?: boolean;
    };

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!email || !EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'A valid work email is required.' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!organization || !organization.trim()) return res.status(400).json({ error: 'Organization is required.' });
    if (!consent) return res.status(400).json({ error: 'You must accept the authorized-use agreement.' });

    const existing = await databaseService.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await databaseService.createUser({
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      organization: organization.trim(),
      role: role?.trim() || 'Security Analyst',
    });

    const token = issueToken(user);
    return res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Registration failed.' });
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await databaseService.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await databaseService.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    const token = issueToken(user);
    return res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Login failed.' });
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', async (req, res) => {
  const token = readBearer(req.headers);
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });
  const payload = verifyToken(token);
  if (!payload || typeof payload.sub !== 'string') return res.status(401).json({ error: 'Invalid or expired token.' });

  const user = await databaseService.findUserById(payload.sub);
  if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
  return res.json({ user: publicUser(user) });
});
