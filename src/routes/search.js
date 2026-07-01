import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { authOptional } from '../middleware/auth.js';
import { publicUser } from '../lib/serialize.js';

const router = Router();

// GET /api/search?q=<query> — search users by username or displayName (contains match).
router.get(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (q.length < 2) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users: users.map(publicUser) });
  })
);

export default router;
