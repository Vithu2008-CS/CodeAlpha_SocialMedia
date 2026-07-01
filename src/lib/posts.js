import prisma from './prisma.js';
import { publicUser } from './serialize.js';

// Parse ?page & ?limit query params into safe pagination bounds.
export function paginate(req, defaultLimit = 10, maxLimit = 50) {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

// Return a Set of postIds that the given user has liked (empty when anonymous).
export async function likedSet(userId, postIds) {
  if (!userId || postIds.length === 0) return new Set();
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(likes.map((l) => l.postId));
}

// Shape a Post (with author + _count includes) into API JSON.
export function serializePost(post, liked = new Set()) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl ?? null,
    createdAt: post.createdAt,
    author: publicUser(post.author),
    likeCount: post._count?.likes ?? 0,
    commentCount: post._count?.comments ?? 0,
    likedByMe: liked.has(post.id),
  };
}

// Standard include used wherever we return posts.
export const postInclude = {
  author: true,
  _count: { select: { likes: true, comments: true } },
};
