import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Categories
  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeding: ${categories.length} Categories done.`);

  // 2. Seed Related Systems
  const relatedSystems = [
    'Email',
    'Campus Wi-Fi',
    'VPN',
    'LEB2 App',
    'Grade Submission App',
    'Printer',
    'Corporate Laptop'
  ];
  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeding: ${relatedSystems.length} Related Systems done.`);

  // 3. Seed Requester Users
  const requesterUsers = [
    { name: 'Alice Smith', email: 'alice.smith@example.com', isActive: true },
    { name: 'Bob Johnson', email: 'bob.johnson@example.com', isActive: true },
    { name: 'Charlie Brown', email: 'charlie.brown@example.com', isActive: true },
    { name: 'Diana Prince', email: 'diana.prince@example.com', isActive: true },
    { name: 'Eve Adams', email: 'eve.adams@example.com', isActive: false },
  ];
  for (const user of requesterUsers) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: { isActive: user.isActive, name: user.name },
      create: user,
    });
  }
  console.log(`Seeding: ${requesterUsers.length} Requester Users done.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });