import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StaffTicketQueue } from '../../components/StaffTicketQueue';

// Helper to mock fetch responses
function mockFetchResponses(overrides: Partial<{
  categoriesResponse: any[];
  queueResponse: { data: any[]; pagination: any };
  queueStatus: number;
}> = {}) {
  const {
    categoriesResponse = [{ id: 1, name: 'Hardware' }, { id: 2, name: 'Software' }],
    queueResponse = {
      data: [
        {
          id: 1, ticketNumber: 'T-001', summary: 'Broken laptop',
          currentStatus: 'NEW', requestedPriority: 'HIGH', itPriority: 'MEDIUM',
          createdAt: '2026-01-01T00:00:00Z',
          category: { name: 'Hardware' }, relatedSystem: { name: 'Inventory' },
          requesterUser: { fullName: 'Alice' }, assignedStaff: null
        },
        {
          id: 2, ticketNumber: 'T-002', summary: 'VPN issue',
          currentStatus: 'IN_PROGRESS', requestedPriority: 'MEDIUM', itPriority: 'HIGH',
          createdAt: '2026-01-02T00:00:00Z',
          category: { name: 'Software' }, relatedSystem: { name: 'Network' },
          requesterUser: { fullName: 'Bob' }, assignedStaff: { fullName: 'Staff1' }
        },
      ],
      pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 }
    },
    queueStatus = 200,
  } = overrides;

  return vi.fn((url: string) => {
    if (url.includes('/api/categories')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(categoriesResponse),
      });
    }
    if (url.includes('/api/staff/queue')) {
      return Promise.resolve({
        ok: queueStatus === 200,
        status: queueStatus,
        json: () => Promise.resolve(queueResponse),
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
}

describe('StaffTicketQueue Component', () => {
  const mockOnViewTicket = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('token', 'mock-jwt-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display queue table with ticket data on desktop', async () => {
    global.fetch = mockFetchResponses() as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-table')).toBeInTheDocument();
    });

    // Both desktop table and mobile cards render in the DOM (CSS hides one)
    // so use getAllByText to account for duplicates
    expect(screen.getAllByText('T-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Broken laptop').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('T-002').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('VPN issue').length).toBeGreaterThanOrEqual(1);
  });

  it('should display all filter controls', async () => {
    global.fetch = mockFetchResponses() as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-search')).toBeInTheDocument();
    });

    expect(screen.getByTestId('queue-status-filter')).toBeInTheDocument();
    expect(screen.getByTestId('queue-category-filter')).toBeInTheDocument();
    expect(screen.getByTestId('queue-req-priority-filter')).toBeInTheDocument();
    expect(screen.getByTestId('queue-it-priority-filter')).toBeInTheDocument();
    expect(screen.getByTestId('queue-owner-filter')).toBeInTheDocument();
    expect(screen.getByTestId('queue-sort-by')).toBeInTheDocument();
    expect(screen.getByTestId('queue-sort-order')).toBeInTheDocument();
  });

  it('should show loading spinner while fetching', () => {
    // Use a fetch that never resolves
    global.fetch = vi.fn(() => new Promise(() => {})) as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    expect(screen.getByTestId('queue-loading')).toBeInTheDocument();
  });

  it('should show empty state when no tickets exist and no filters active', async () => {
    global.fetch = mockFetchResponses({
      queueResponse: { data: [], pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 } }
    }) as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/no tickets in the system yet/i)).toBeInTheDocument();
  });

  it('should show no-results state with clear filters button when filters are active but no results', async () => {
    const fetchMock = mockFetchResponses({
      queueResponse: { data: [], pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 } }
    }) as any;
    global.fetch = fetchMock;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('queue-empty-state')).toBeInTheDocument();
    });

    // Type something in search to activate filters
    fireEvent.change(screen.getByTestId('queue-search'), { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByTestId('queue-no-results')).toBeInTheDocument();
    });

    expect(screen.getByText(/no tickets match your current filters/i)).toBeInTheDocument();
    expect(screen.getByTestId('queue-no-results-clear')).toBeInTheDocument();
  });

  it('should show forbidden message when API returns 403', async () => {
    global.fetch = mockFetchResponses({ queueStatus: 403 }) as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('forbidden-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  it('should call onViewTicket when View button is clicked', async () => {
    global.fetch = mockFetchResponses() as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('queue-view-1'));
    expect(mockOnViewTicket).toHaveBeenCalledWith(1);
  });

  it('should show pagination when totalPages > 1', async () => {
    global.fetch = mockFetchResponses({
      queueResponse: {
        data: [
          {
            id: 1, ticketNumber: 'T-001', summary: 'Test',
            currentStatus: 'NEW', requestedPriority: 'LOW', itPriority: 'LOW',
            createdAt: '2026-01-01T00:00:00Z',
            category: { name: 'HW' }, relatedSystem: null,
            requesterUser: { fullName: 'A' }, assignedStaff: null
          },
        ],
        pagination: { total: 25, page: 1, pageSize: 10, totalPages: 3 }
      }
    }) as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-pagination')).toBeInTheDocument();
    });

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByTestId('queue-prev-page')).toBeDisabled();
    expect(screen.getByTestId('queue-next-page')).not.toBeDisabled();
  });

  it('should pass search query to API fetch', async () => {
    const fetchMock = mockFetchResponses() as any;
    global.fetch = fetchMock;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-table')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('queue-search'), { target: { value: 'VPN' } });

    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter((c: any[]) => c[0].includes('/api/staff/queue'));
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toContain('search=VPN');
    });
  });

  it('should show error state on API failure (non-403)', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
    }) as any;

    render(<StaffTicketQueue userId={1} onViewTicket={mockOnViewTicket} />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});