import { PrismaClient, Role, TicketStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Lab 3 data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Categories & Systems
  console.log('Seeding Categories...');
  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding Related Systems...');
  const systems = ['Email', 'Campus Wi-Fi', 'VPN', 'LEB2 App', 'Grade Submission App', 'Printer', 'Corporate Laptop'];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({ where: { name }, update: {}, create: { name } });
  }

  // 2. Seed Users
  console.log('Seeding Users (Requesters, IT Staff, Admins)...');
  const users = [
    // Requesters (4 active, 1 inactive)
    { email: 'req1@toktickit.com', fullName: 'Alice Requester', role: Role.REQUESTER, isActive: true },
    { email: 'req2@toktickit.com', fullName: 'Bob Requester', role: Role.REQUESTER, isActive: true },
    { email: 'req3@toktickit.com', fullName: 'Charlie Requester', role: Role.REQUESTER, isActive: true },
    { email: 'req4@toktickit.com', fullName: 'Diana Requester', role: Role.REQUESTER, isActive: true },
    { email: 'req5.inactive@toktickit.com', fullName: 'Eve Inactive', role: Role.REQUESTER, isActive: false },
    // IT Staff (3 active, 1 inactive)
    { email: 'staff1@toktickit.com', fullName: 'IT Steve', role: Role.IT_STAFF, isActive: true },
    { email: 'staff2@toktickit.com', fullName: 'IT Sarah', role: Role.IT_STAFF, isActive: true },
    { email: 'staff3@toktickit.com', fullName: 'IT Mike', role: Role.IT_STAFF, isActive: true },
    { email: 'staff4.inactive@toktickit.com', fullName: 'IT Inactive', role: Role.IT_STAFF, isActive: false },
    // Administrator (1 active)
    { email: 'admin@toktickit.com', fullName: 'Super Admin', role: Role.ADMINISTRATOR, isActive: true },
  ];

  let userCount = 0;
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, role: u.role, isActive: u.isActive, passwordHash },
      create: { ...u, passwordHash, mustChangePassword: false },
    });
    userCount++;
  }
  console.log(`Seeded ${userCount} users with secure hashed passwords.`);
  
  // 3. Seed Realistic Tickets
  console.log('Seeding Tickets, Comments, and Internal Notes...');
  const catHardware = await prisma.category.findUnique({ where: { name: 'Hardware' } });
  const catSoftware = await prisma.category.findUnique({ where: { name: 'Software' } });
  const catNetwork = await prisma.category.findUnique({ where: { name: 'Network' } });
  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: 'Corporate Laptop' } });
  const sysEmail = await prisma.relatedSystem.findUnique({ where: { name: 'Email' } });
  const sysVpn = await prisma.relatedSystem.findUnique({ where: { name: 'VPN' } });
  
  const alice = await prisma.user.findUnique({ where: { email: 'req1@toktickit.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'req2@toktickit.com' } });
  const staff1 = await prisma.user.findUnique({ where: { email: 'staff1@toktickit.com' } });
  const staff2 = await prisma.user.findUnique({ where: { email: 'staff2@toktickit.com' } });

  if (alice && bob && staff1 && staff2 && catHardware && catSoftware && catNetwork && sysLaptop && sysEmail && sysVpn) {
    const generateTicketNumber = () => `TIK-${Date.now().toString().slice(-6)}${crypto.randomInt(1000, 9999)}`;

    const tickets = [
      {
        ticketNumber: generateTicketNumber(),
        summary: 'Laptop screen flickering',
        description: 'Screen flickers when I open IDE.',
        requestedPriority: 'High',
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
        requesterUserId: alice.id,
        assignedStaffId: staff1.id,
        categoryId: catHardware.id,
        relatedSystemId: sysLaptop.id,
      },
      {
        ticketNumber: generateTicketNumber(),
        summary: 'Cannot connect to VPN',
        description: 'VPN client says authentication failed.',
        requestedPriority: 'Urgent',
        itPriority: Priority.URGENT,
        currentStatus: TicketStatus.NEW,
        requesterUserId: bob.id,
        assignedStaffId: null,
        categoryId: catNetwork.id,
        relatedSystemId: sysVpn.id,
      },
      {
        ticketNumber: generateTicketNumber(),
        summary: 'Email not syncing on mobile',
        description: 'Since yesterday, Outlook on iOS is stuck.',
        requestedPriority: 'Medium',
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.RESOLVED,
        requesterUserId: alice.id,
        assignedStaffId: staff2.id,
        categoryId: catSoftware.id,
        relatedSystemId: sysEmail.id,
      }
    ];

    let ticketCount = 0;
    for (const t of tickets) {
      const existing = await prisma.ticket.findFirst({ where: { summary: t.summary } });
      if (!existing) {
        const createdTicket = await prisma.ticket.create({ data: t });
        ticketCount++;
        
        await prisma.publicComment.create({
          data: {
            ticketId: createdTicket.id,
            authorId: t.requesterUserId,
            content: 'Please help as soon as possible, this blocks my work.',
          }
        });

        if (t.assignedStaffId) {
          await prisma.publicComment.create({
            data: {
              ticketId: createdTicket.id,
              authorId: t.assignedStaffId,
              content: 'I have received your request and am looking into it.',
            }
          });

          await prisma.internalNote.create({
            data: {
              ticketId: createdTicket.id,
              authorId: t.assignedStaffId,
              content: 'Checked system logs, seems to be a driver issue. Need to verify hardware.',
            }
          });
        }
      }
    }
    console.log(`Seeded ${ticketCount} new tickets with initial comments and notes.`);
  } else {
    console.warn('Skipped ticket seeding due to missing relations.');
  }

  console.log('✅ Lab 3 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });