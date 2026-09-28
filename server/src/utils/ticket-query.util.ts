export interface TicketFilters {
  requesterUserId?: number;
  assignedStaffId?: number | null | 'unassigned';
  search?: string;
  categoryName?: string;
  categoryId?: number;
  status?: string | string[];
  excludeStatus?: string[];
  requestedPriority?: string | string[];
  itPriority?: string | string[];
  isUrgent?: boolean;
}

export function buildTicketWhereClause(filters: TicketFilters): any {
  const where: any = {};

  if (filters.requesterUserId !== undefined) {
    where.requesterUserId = filters.requesterUserId;
  }

  if (filters.assignedStaffId !== undefined) {
    if (filters.assignedStaffId === 'unassigned') {
      where.assignedStaffId = null;
    } else {
      where.assignedStaffId = filters.assignedStaffId;
    }
  }

  if (filters.search && filters.search.trim() !== '') {
    where.OR = [
      { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      { summary: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.categoryName) {
    where.category = { name: { equals: filters.categoryName, mode: 'insensitive' } };
  }
  
  if (filters.categoryId !== undefined && !isNaN(filters.categoryId)) {
    where.categoryId = filters.categoryId;
  }

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : filters.status.split(',');
    const validStatuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'];
    const invalid = statuses.find(s => !validStatuses.includes(s));
    if (invalid) {
      throw new Error('INVALID_STATUS_FILTER');
    }
    where.currentStatus = { in: statuses };
  }

  if (filters.excludeStatus && filters.excludeStatus.length > 0) {
    where.currentStatus = {
      ...(where.currentStatus || {}),
      notIn: filters.excludeStatus
    };
  }

  if (filters.isUrgent) {
    const urgentOr = [
      { requestedPriority: { in: ['HIGH', 'URGENT'] } },
      { itPriority: { in: ['HIGH', 'URGENT'] } }
    ];
    
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: urgentOr }
      ];
      delete where.OR;
    } else {
      where.OR = urgentOr;
    }
  } else {
    if (filters.requestedPriority) {
      const rp = Array.isArray(filters.requestedPriority) ? filters.requestedPriority : filters.requestedPriority.split(',');
      where.requestedPriority = { in: rp };
    }
    if (filters.itPriority) {
      const ip = Array.isArray(filters.itPriority) ? filters.itPriority : filters.itPriority.split(',');
      where.itPriority = { in: ip };
    }
  }

  return where;
}
