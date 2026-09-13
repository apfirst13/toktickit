import { prisma } from '../prisma.js';

export async function validateTicketAssignment(staffId: number) {
  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  if (!staff || !['IT_STAFF', 'ADMINISTRATOR'].includes(staff.role)) {
    throw new Error('Only IT_STAFF or ADMINISTRATOR can be assigned tickets');
  }
  return staff;
}
