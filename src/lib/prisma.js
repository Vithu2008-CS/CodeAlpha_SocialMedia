import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient instance for the whole app.
// Reusing one client avoids exhausting the SQLite connection pool.
const prisma = new PrismaClient();

export default prisma;
