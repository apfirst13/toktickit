import { describe, it, expect } from 'vitest';
import { buildTicketWhereClause } from '../../src/utils/ticket-query.util';

describe('buildTicketWhereClause', () => {
  it('should handle basic filters', () => {
    const where = buildTicketWhereClause({
      requesterUserId: 1,
      status: 'OPEN'
    });
    expect(where).toEqual({
      requesterUserId: 1,
      currentStatus: { in: ['OPEN'] }
    });
  });

  it('should handle multiple status comma-separated', () => {
    const where = buildTicketWhereClause({
      status: 'OPEN,REOPENED'
    });
    expect(where).toEqual({
      currentStatus: { in: ['OPEN', 'REOPENED'] }
    });
  });

  it('should handle isUrgent with existing search (merging ORs into AND)', () => {
    const where = buildTicketWhereClause({
      search: 'login',
      isUrgent: true
    });
    
    expect(where.OR).toBeUndefined();
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toBeDefined(); // search OR
    expect(where.AND[1].OR).toBeDefined(); // urgent OR
  });

  it('should ignore priorities when isUrgent is true', () => {
    const where = buildTicketWhereClause({
      isUrgent: true,
      requestedPriority: 'LOW'
    });
    
    expect(where.requestedPriority).toBeUndefined();
    expect(where.OR).toBeDefined(); // urgent OR
  });
  
  it('should handle excludeStatus', () => {
    const where = buildTicketWhereClause({
      excludeStatus: ['CLOSED', 'CANCELLED']
    });
    expect(where).toEqual({
      currentStatus: { notIn: ['CLOSED', 'CANCELLED'] }
    });
  });
  
  it('should handle both status and excludeStatus', () => {
    const where = buildTicketWhereClause({
      status: 'IN_PROGRESS',
      excludeStatus: ['CLOSED']
    });
    expect(where).toEqual({
      currentStatus: { in: ['IN_PROGRESS'], notIn: ['CLOSED'] }
    });
  });
});
