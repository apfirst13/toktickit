import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TicketDetail } from '../../components/TicketDetail';
import React from 'react';

const mockStaffUser = { id: 1, fullName: 'Staff Det', role: 'IT_STAFF' };
const mockReqUser = { id: 2, fullName: 'Req Det', role: 'REQUESTER' };

const mockTicketData = {
  id: 100,
  ticketNumber: 'T-100',
  summary: 'Test Issue',
  description: 'It is broken',
  currentStatus: 'NEW',
  requestedPriority: 'LOW',
  itPriority: 'LOW',
  category: { name: 'Hardware' },
  relatedSystem: { name: 'Laptop' },
  createdAt: new Date().toISOString(),
  attachments: [],
  publicComments: [],
  appearsResolved: false,
  requesterUser: { fullName: 'Req Det' },
  assignedStaff: null,
  assignedStaffId: null
};

const mockStaffList = [
  { id: 1, fullName: 'Staff Det', role: 'IT_STAFF' },
  { id: 3, fullName: 'Admin Det', role: 'ADMINISTRATOR' }
];

global.fetch = vi.fn();

describe('StaffTicketDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => 'dummy-token');
  });

  it('should render staff controls when user is IT_STAFF', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) {
        if (url.endsWith('/notes')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicketData) });
      }
      if (url.includes('/api/staff/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<TicketDetail ticketId={100} currentUser={mockStaffUser} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('IT Operational Controls')).toBeInTheDocument();
    });

    expect(screen.getByText('Internal Operational Notes - IT Staff Only')).toBeInTheDocument();
  });

  it('should allow saving metadata as staff', async () => {
    (global.fetch as any).mockImplementation((url: string, opts: any) => {
      if (opts?.method === 'PATCH' && url.includes('/api/staff/tickets')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/tickets/')) {
        if (url.endsWith('/notes')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicketData) });
      }
      if (url.includes('/api/staff/users')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaffList) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<TicketDetail ticketId={100} currentUser={mockStaffUser} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('IT Operational Controls')).toBeInTheDocument();
    });

    const saveBtn = screen.getByText('Save Changes');
    expect(saveBtn).toBeDisabled(); // disabled because no changes yet

    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'OPEN' } });

    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/staff/tickets/100', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          itPriority: 'LOW',
          assignedStaffId: null,
          // BR-10: expectedStatus always sent to enable server-side optimistic locking
          expectedStatus: 'NEW',
          status: 'OPEN'
        })
      }));
    });
  });

  it('should not render staff controls for REQUESTER', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/tickets/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicketData) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<TicketDetail ticketId={100} currentUser={mockReqUser} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('detail-summary')).toBeInTheDocument();
    });

    expect(screen.queryByText('IT Operational Controls')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal Operational Notes - IT Staff Only')).not.toBeInTheDocument();
  });
});
