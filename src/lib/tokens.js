import jwt from 'jsonwebtoken';

const EXPIRES_IN = '7d';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set. Copy .env.example to .env.');
  return s;
}

// Sign a JWT for a user. Keep the payload minimal — just the id and username.
export function signToken(user) {
  return jwt.sign({ userId: user.id, username: user.username }, secret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}
