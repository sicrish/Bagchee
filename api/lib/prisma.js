import { PrismaClient } from '@prisma/client';

// Singleton pattern — one PrismaClient instance for the whole app.
// In production (Vercel serverless), each function invocation is isolated
// so this is effectively a new client per invocation anyway.
// In local dev, this prevents "too many connections" from hot-reloads.

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!global._prisma) {
        global._prisma = new PrismaClient({
            log: ['warn', 'error'],
        });
    }
    prisma = global._prisma;
}

export default prisma;
