import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Lab 2 data...');

  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const systems = ['Email', 'Campus Wi-Fi', 'VPN', 'LEB2 App', 'Grade Submission App', 'Printer', 'Corporate Laptop'];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({ where: { name }, update: {}, create: { name } });
  }

  const requesters = [
    { email: 'jennifer.a@example.com', name: 'Jennifer Anderson', isActive: true },
    { email: 'michael.b@example.com', name: 'Michael Brown', isActive: true },
    { email: 'sarah.j@example.com', name: 'Sarah Johnson', isActive: true },
    { email: 'david.l@example.com', name: 'David Lee', isActive: true },
    { email: 'inactive.user@example.com', name: 'Inactive User', isActive: false },
  ];
  
  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {},
      create: req,
    });
  }

  console.log('Lab 2 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });