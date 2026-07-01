import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { asyncHandler, ApiError } from '../lib/http.js';
import { authRequired } from '../middleware/auth.js';
import { signToken } from '../lib/tokens.js';
import { validateUsername, validateEmail, requireString, optionalString } from '../lib/validate.js';
import { publicUser } from '../lib/serialize.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const username = validateUsername(body.username);
    const email = validateEmail(body.email);
    const password = requireString(body.password, 'password', { min: 6, max: 100, trim: false });
    const displayName = optionalString(body.displayName, 'displayName', { max: 60 }) || username;
    const bio = optionalString(body.bio, 'bio', { max: 300 });
    const avatarUrl = optionalString(body.avatarUrl, 'avatarUrl', { max: 500 });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });
    if (existing) {
      if (existing.username === username) throw new ApiError(409, 'Username is already taken');
      throw new ApiError(409, 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, displayName, bio, avatarUrl },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  })
);

// POST /api/auth/login  (accepts username OR email in the "username" field)
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const identifier = requireString(
      body.username ?? body.email ?? body.identifier,
      'username or email'
    ).toLowerCase();
    const password = requireString(body.password, 'password', { trim: false });

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    // Always run a comparison-style failure path to avoid leaking which field was wrong.
    if (!user) throw new ApiError(401, 'Invalid username/email or password');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'Invalid username/email or password');

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ user: publicUser(user) });
  })
);

export default router;
