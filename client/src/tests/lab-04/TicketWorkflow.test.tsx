import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TicketDetail } from '../../components/TicketDetail';
import '@testing-library/jest-dom';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: []
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('TicketWorkflow (Lab 4)', () => {
  const staffUser = { id: 2, fullName: 'Staff User', role: 'IT_STAFF', email: 'staff@test.com' };
  const reqUser = { id: 1, fullName: 'Req User', role: 'REQUESTER', email: 'req@test.com' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockFetch = (status: string) => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/staff/users')) {
        return { ok: true, json: async () => [{ id: 2, fullName: 'Staff User' }] };
      }
      if (url.includes('/api/tickets/1/actions')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              actionDateTime: '2023-01-02T00:00:00Z',
              description: 'Mock Action Description 123',
              result: 'Action Success',
              version: 1,
              performedBy: { fullName: 'Staff User' }
            }
          ]
        };
      }
      return {
        ok: true,
        json: async () => ({
          id: 1,
          ticketNumber: 'TIK-001',
          summary: 'Test Workflow',
          description: 'Testing transitions',
          currentStatus: status,
          priority: 'NORMAL',
          requestedPriority: 'NORMAL',
          category: { id: 1, name: 'Software' },
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          requester: { fullName: 'Req User' },
          assignedStaff: { fullName: 'Staff User' },
          comments: [],
          internalNotes: [],
          attachments: [],
          actionsTaken: [
            {
              id: 1,
              actionDateTime: '2023-01-02T00:00:00Z',
              description: 'Mock Action Description 123',
              result: 'Action Success',
              version: 1,
              performedBy: { fullName: 'Staff User' }
            }
          ],
        })
      };
    }) as any;
  };

  Object.entries(ALLOWED_TRANSITIONS).forEach(([currentStatus, expectedTransitions]) => {
    it(`should render exact allowed transitions for ${currentStatus}`, async () => {
      mockFetch(currentStatus);
      render(
        <TicketDetail ticketId={1} onBack={() => {}} userRole="IT_STAFF" currentUser={staffUser} />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const select = screen.getByTestId('status-select') as HTMLSelectElement;
      
      // Expected options: currentStatus + all allowed transitions
      const expectedOptions = [currentStatus, ...expectedTransitions];
      
      const actualOptions = Array.from(select.options).map(opt => opt.value);
      expect(actualOptions).toEqual(expectedOptions);
      
      // Also verify action description is rendered
      expect(await screen.findByText('Mock Action Description 123')).toBeInTheDocument();
    });
  });

  it('should not show status-select for REQUESTER', async () => {
    mockFetch('OPEN');
    render(
      <TicketDetail ticketId={1} onBack={() => {}} userRole="REQUESTER" currentUser={reqUser} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('status-select')).not.toBeInTheDocument();
  });
});
