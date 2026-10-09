import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.ticket.findFirst().then(console.log).finally(() => prisma.$disconnect());
