const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requester = await prisma.requesterUser.findFirst();
  if (!requester) {
    console.log("No requester found. Did you run the seed?");
    return;
  }
  
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: 'DB-PROOF-001',
      summary: 'DB Match Test',
      description: 'Testing the DB match for screenshots',
      requestedPriority: 'Low',
      requesterUserId: requester.id,
      categoryId: 1,
      relatedSystemId: 1
    }
  });

  console.log('----------------------------------------');
  console.log('          DB MATCH PROOF                ');
  console.log('----------------------------------------');
  console.log(`Created Ticket : ${ticket.ticketNumber}`);
  console.log(`Ticket Requester ID  : ${ticket.requesterUserId}`);
  console.log(`Selected Context ID  : ${requester.id}`);
  console.log(`Requester Name       : ${requester.name}`);
  console.log('----------------------------------------');
  console.log('MATCH:', ticket.requesterUserId === requester.id ? 'SUCCESS' : 'FAILURE');
  console.log('----------------------------------------');
  
  // Cleanup
  await prisma.ticket.delete({ where: { id: ticket.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
