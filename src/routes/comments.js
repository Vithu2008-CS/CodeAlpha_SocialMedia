import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, ApiError } from '../lib/http.js';
import { authRequired } from '../middleware/auth.js';
import { parseId } from '../lib/validate.js';

const router = Router();

// DELETE /api/comments/:id — author only.
router.delete(
  '/:id',
  authRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id }, select: { authorId: true } });
    if (!comment) throw new ApiError(404, 'Comment not found');
    if (comment.authorId !== req.userId) throw new ApiError(403, 'You can only delete your own comments');
    await prisma.comment.delete({ where: { id } });
    res.json({ ok: true });
  })
);

export default router;
