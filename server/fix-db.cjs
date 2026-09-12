const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "RequesterUser" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`);
  console.log('Done');
}

main().finally(() => prisma.$disconnect());
