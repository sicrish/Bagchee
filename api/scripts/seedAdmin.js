import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@bagchee.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

const prisma = new PrismaClient();

const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hash, role: 'admin', status: 1 },
    create: {
        email: ADMIN_EMAIL,
        password: hash,
        name: 'Admin',
        firstName: 'Admin',
        lastName: '',
        role: 'admin',
        status: 1,
    },
});

console.log(`Admin ready: ${user.email} (id=${user.id})`);
console.log(`Password: ${ADMIN_PASSWORD}`);
await prisma.$disconnect();
