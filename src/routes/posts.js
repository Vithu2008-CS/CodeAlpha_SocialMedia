import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, ApiError } from '../lib/http.js';
import { authRequired, authOptional } from '../middleware/auth.js';
import { requireString, optionalString, parseId } from '../lib/validate.js';
import { serializeComment } from '../lib/serialize.js';
import { paginate, likedSet, serializePost, postInclude } from '../lib/posts.js';

const router = Router();

async function ensurePostExists(id) {
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) throw new ApiError(404, 'Post not found');
  return post;
}

// GET /api/posts — feed: posts from followed users + self, newest first, paginated.
router.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const { page, limit, skip, take } = paginate(req);
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const authorIds = [req.userId, ...following.map((f) => f.followingId)];

    const rows = await prisma.post.findMany({
      where: { authorId: { in: authorIds } },
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

// POST /api/posts — create a post.
router.post(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const content = requireString(body.content, 'content', { max: 1000 });
    const imageUrl = optionalString(body.imageUrl, 'imageUrl', { max: 500 });
    const post = await prisma.post.create({
      data: { authorId: req.userId, content, imageUrl },
      include: postInclude,
    });
    res.status(201).json({ post: serializePost(post, new Set()) });
  })
);

// GET /api/posts/:id — single post.
router.get(
  '/:id',
  authOptional,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!post) throw new ApiError(404, 'Post not found');
    const liked = await likedSet(req.userId, [post.id]);
    res.json({ post: serializePost(post, liked) });
  })
);

// DELETE /api/posts/:id — author only.
router.delete(
  '/:id',
  authRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const post = await ensurePostExists(id);
    if (post.authorId !== req.userId) throw new ApiError(403, 'You can only delete your own posts');
    await prisma.post.delete({ where: { id } });
    res.json({ ok: true });
  })
);

// GET /api/posts/:id/comments — full thread, oldest first.
router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await ensurePostExists(id);
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'asc' },
      include: { author: true },
    });
    res.json({ comments: comments.map(serializeComment) });
  })
);

// POST /api/posts/:id/comments — add a comment.
router.post(
  '/:id/comments',
  authRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const content = requireString(req.body?.content, 'content', { max: 500 });
    await ensurePostExists(id);
    const comment = await prisma.comment.create({
      data: { postId: id, authorId: req.userId, content },
      include: { author: true },
    });
    res.status(201).json({ comment: serializeComment(comment) });
  })
);

// POST /api/posts/:id/like — like (idempotent).
router.post(
  '/:id/like',
  authRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await ensurePostExists(id);
    try {
      await prisma.like.create({ data: { postId: id, userId: req.userId } });
    } catch (e) {
      if (e.code !== 'P2002') throw e; // already liked -> idempotent
    }
    const likeCount = await prisma.like.count({ where: { postId: id } });
    res.json({ liked: true, likeCount });
  })
);

// DELETE /api/posts/:id/like — unlike (idempotent).
router.delete(
  '/:id/like',
  authRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await prisma.like.deleteMany({ where: { postId: id, userId: req.userId } });
    const likeCount = await prisma.like.count({ where: { postId: id } });
    res.json({ liked: false, likeCount });
  })
);

export default router;
