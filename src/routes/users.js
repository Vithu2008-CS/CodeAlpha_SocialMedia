import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, ApiError } from '../lib/http.js';
import { authRequired, authOptional } from '../middleware/auth.js';
import { optionalString } from '../lib/validate.js';
import { publicUser } from '../lib/serialize.js';
import { paginate, likedSet, serializePost, postInclude } from '../lib/posts.js';

const router = Router();

async function findUserByUsername(username) {
  const user = await prisma.user.findUnique({
    where: { username: String(username).toLowerCase() },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

// PUT /api/users/me — update own profile.
// Declared before "/:username" routes so it can never be shadowed.
router.put(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const data = {};
    if ('displayName' in body) {
      const v = optionalString(body.displayName, 'displayName', { max: 60 });
      if (!v) throw new ApiError(400, 'displayName cannot be empty');
      data.displayName = v;
    }
    if ('bio' in body) data.bio = optionalString(body.bio, 'bio', { max: 300 });
    if ('avatarUrl' in body) data.avatarUrl = optionalString(body.avatarUrl, 'avatarUrl', { max: 500 });

    if (Object.keys(data).length === 0) throw new ApiError(400, 'No updatable fields provided');

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    res.json({ user: publicUser(user) });
  })
);

// GET /api/users/:username — profile + counts + isFollowing
router.get(
  '/:username',
  authOptional,
  asyncHandler(async (req, res) => {
    const user = await findUserByUsername(req.params.username);
    const [posts, followers, following, follow] = await Promise.all([
      prisma.post.count({ where: { authorId: user.id } }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      req.userId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
          })
        : null,
    ]);
    res.json({
      user: publicUser(user),
      counts: { posts, followers, following },
      isFollowing: Boolean(follow),
      isMe: req.userId === user.id,
    });
  })
);

// GET /api/users/:username/posts — that user's posts (paginated, newest first)
router.get(
  '/:username/posts',
  authOptional,
  asyncHandler(async (req, res) => {
    const user = await findUserByUsername(req.params.username);
    const { page, limit, skip, take } = paginate(req);
    const rows = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: take + 1,
      include: postInclude,
    });
    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const liked = await likedSet(req.userId, items.map((p) => p.id));
    res.json({ posts: items.map((p) => serializePost(p, liked)), page, limit, hasMore });
  })
);

// POST /api/users/:username/follow
router.post(
  '/:username/follow',
  authRequired,
  asyncHandler(async (req, res) => {
    const target = await findUserByUsername(req.params.username);
    if (target.id === req.userId) throw new ApiError(400, 'You cannot follow yourself');
    try {
      await prisma.follow.create({ data: { followerId: req.userId, followingId: target.id } });
    } catch (e) {
      if (e.code !== 'P2002') throw e; // already following -> idempotent
    }
    const followers = await prisma.follow.count({ where: { followingId: target.id } });
    res.json({ following: true, followersCount: followers });
  })
);

// DELETE /api/users/:username/follow
router.delete(
  '/:username/follow',
  authRequired,
  asyncHandler(async (req, res) => {
    const target = await findUserByUsername(req.params.username);
    await prisma.follow.deleteMany({ where: { followerId: req.userId, followingId: target.id } });
    const followers = await prisma.follow.count({ where: { followingId: target.id } });
    res.json({ following: false, followersCount: followers });
  })
);

// GET /api/users/:username/followers
router.get(
  '/:username/followers',
  asyncHandler(async (req, res) => {
    const user = await findUserByUsername(req.params.username);
    const rows = await prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });
    res.json({ users: rows.map((r) => publicUser(r.follower)) });
  })
);

// GET /api/users/:username/following
router.get(
  '/:username/following',
  asyncHandler(async (req, res) => {
    const user = await findUserByUsername(req.params.username);
    const rows = await prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { following: true },
    });
    res.json({ users: rows.map((r) => publicUser(r.following)) });
  })
);

export default router;
