import { verifyToken } from '../lib/tokens.js';
import { ApiError } from '../lib/http.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

// Hard guard for write/protected routes: 401 when the token is missing or invalid.
export function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Soft guard for public-but-personalized routes (feed flags like isFollowing / likedByMe):
// attach req.userId when a valid token is present, otherwise continue anonymously.
export function authOptional(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.userId = null;
    return next();
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
  } catch {
    req.userId = null;
  }
  next();
}
