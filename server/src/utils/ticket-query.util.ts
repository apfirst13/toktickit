// ─── Dashboard Metric Status Constants (Single Source of Truth) ─────────────
// These constants define exactly which statuses map to each dashboard card.
// All three layers (backend dashboard, backend queue filter, frontend drill-down)
// must import from here. If a mapping changes, the test will fail automatically.

/** BR-METRIC-01: Requester "My Open" card */
export const REQUESTER_MY_OPEN_STATUSES = ['NEW', 'OPEN', 'REOPENED'] as const;

/** BR-METRIC-02: Requester "In Progress" card (staff actively working) */
export const REQUESTER_IN_PROGRESS_STATUSES = ['IN_PROGRESS'] as const;

/** BR-METRIC-03: Requester "Waiting for You" card (requester must act) */
export const REQUESTER_WAITING_STATUSES = ['WAITING_FOR_REQUESTER'] as const;

/** BR-METRIC-04: IT Staff "Open" card (REOPENED re-enters active queue) */
export const STAFF_OPEN_STATUSES = ['OPEN', 'REOPENED'] as const;

/** BR-METRIC-05: IT Staff "In Progress" card */
export const STAFF_IN_PROGRESS_STATUSES = ['IN_PROGRESS'] as const;

/** BR-METRIC-06: IT Staff "Waiting for Requester" card */
export const STAFF_WAITING_STATUSES = ['WAITING_FOR_REQUESTER'] as const;

// ─── Filters Interface ───────────────────────────────────────────────────────

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

// ─── All valid statuses (used for query parameter validation) ─────────────────
export const VALID_TICKET_STATUSES = [
  'NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER',
  'RESOLVED', 'CLOSED', 'CANCELLED', 'REOPENED'
] as const;

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
    const invalid = statuses.find(s => !(VALID_TICKET_STATUSES as readonly string[]).includes(s));
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

    if (!filters.status) {
      const terminalStatuses = ['RESOLVED', 'CLOSED', 'CANCELLED'];
      if (where.currentStatus?.notIn) {
        where.currentStatus.notIn = Array.from(new Set([...where.currentStatus.notIn, ...terminalStatuses]));
      } else {
        where.currentStatus = {
          ...(where.currentStatus || {}),
          notIn: terminalStatuses
        };
      }
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
