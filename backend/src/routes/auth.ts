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
import {
  databaseService,
  verifyPassword,
  normalizeEmail,
  hashVerificationCode,
  verifyVerificationCode,
  type StoredUser,
} from '../services/database.js';
import { emailService } from '../services/email.js';

export const authRouter = Router();

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 1000 * 60 * 10; // 10 minutes

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
  return { id: user.id, email: user.email, name: user.name, organization: user.organization, role: user.role, emailVerified: user.emailVerified };
}

function readBearer(headers: Record<string, string | string[] | undefined>): string | null {
  const header = headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || !value.toLowerCase().startsWith('bearer ')) return null;
  return value.slice(7).trim();
}

/** Generate a 6-digit code, persist its hash and send it through the email connector. */
async function sendVerificationCode(user: StoredUser): Promise<{ delivered: boolean; devCode?: string }> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await databaseService.updateUser(user.id, {
    verificationCodeHash: hashVerificationCode(user.email, code),
    verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    verificationSentAt: new Date().toISOString(),
  });

  const result = await emailService.sendEmail({
    to: user.email,
    subject: 'Your PhishYou verification code',
    text: [
      `Hi ${user.name},`,
      '',
      `Your PhishYou verification code is: ${code}`,
      '',
      'It expires in 10 minutes. If you did not create this account, ignore this email.',
      '',
      '— PhishYou Security',
    ].join('\n'),
  });

  // In simulated mode (no SMTP) the code never leaves the server, so surface it
  // in the response to keep the local/dev flow completable.
  return result.simulated ? { delivered: false, devCode: code } : { delivered: result.success };
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

    const verification = await sendVerificationCode(user);
    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      user: publicUser(user),
      ...(verification.devCode ? { devCode: verification.devCode } : {}),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Registration failed.' });
  }
});

// POST /api/v1/auth/verify-email
authRouter.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });

    const user = await databaseService.findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    if (user.emailVerified) {
      return res.json({ success: true, token: issueToken(user), user: publicUser(user) });
    }

    if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: 'No verification code is pending — request a new one.' });
    }
    if (Date.now() > new Date(user.verificationCodeExpiresAt).getTime()) {
      return res.status(400).json({ error: 'Verification code expired — request a new one.' });
    }
    if (!verifyVerificationCode(user.email, code, user.verificationCodeHash)) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    const verified = await databaseService.updateUser(user.id, {
      emailVerified: true,
      verificationCodeHash: undefined,
      verificationCodeExpiresAt: undefined,
    });

    const token = issueToken(verified ?? user);
    return res.json({ success: true, token, user: publicUser(verified ?? user) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Verification failed.' });
  }
});

// POST /api/v1/auth/resend-verification
authRouter.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await databaseService.findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    if (user.emailVerified) return res.json({ success: true, alreadyVerified: true });

    // Basic resend throttle: one code per minute.
    if (user.verificationSentAt && Date.now() - new Date(user.verificationSentAt).getTime() < 60_000) {
      return res.status(429).json({ error: 'A code was just sent — wait a minute before resending.' });
    }

    const verification = await sendVerificationCode(user);
    return res.json({ success: true, delivered: verification.delivered, ...(verification.devCode ? { devCode: verification.devCode } : {}) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Could not resend verification.' });
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

    if (!user.emailVerified) {
      // Re-issue a code so the user can complete verification from the login flow.
      const verification = await sendVerificationCode(user);
      return res.status(403).json({
        error: 'Email is not verified.',
        requiresVerification: true,
        email: user.email,
        ...(verification.devCode ? { devCode: verification.devCode } : {}),
      });
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
