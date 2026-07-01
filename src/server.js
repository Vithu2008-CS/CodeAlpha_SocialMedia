import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import { ApiError } from './lib/http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ----- API -----
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'CodeAlpha Social Media API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// Any other /api/* path is a JSON 404 (never fall through to static HTML).
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// ----- Static frontend -----
app.use(express.static(publicDir));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// ----- Centralized error handler (consistent JSON shape: { error }) -----
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  // Prisma "record not found" on update/delete.
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CodeAlpha Social Media server running at http://localhost:${PORT}`);
});

export default app;
