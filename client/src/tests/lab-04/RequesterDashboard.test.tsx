import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequesterDashboard } from '../../components/dashboard/RequesterDashboard';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Lab 4 - Requester Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<RequesterDashboard onCreateTicket={vi.fn()} onNavigateToList={vi.fn()} onViewTicket={vi.fn()} />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders dashboard metrics and recent tickets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: { myOpen: 5, inProgress: 2, waiting: 1, resolved: 1, closed: 10 },
        recentlyUpdated: [
          {
            id: 1,
            ticketNumber: 'T-001',
            summary: 'Test ticket',
            currentStatus: 'NEW',
            createdAt: '2026-09-27T00:00:00Z',
            updatedAt: '2026-09-27T00:00:00Z',
            category: { name: 'Hardware' }
          }
        ]
      })
    });

    const mockNavigate = vi.fn();
    const mockView = vi.fn();

    render(<RequesterDashboard onCreateTicket={vi.fn()} onNavigateToList={mockNavigate} onViewTicket={mockView} />);

    await waitFor(() => {
      expect(screen.getByTestId('metric-my-open')).toBeInTheDocument();
    });

    // Check metric counts
    expect(screen.getByTestId('metric-my-open')).toHaveTextContent('5');
    expect(screen.getByTestId('metric-in-progress')).toHaveTextContent('2');
    
    // BR-METRIC-01: My Open drill-down must use NEW,OPEN,REOPENED
    fireEvent.click(screen.getByTestId('metric-my-open'));
    expect(mockNavigate).toHaveBeenCalledWith('NEW,OPEN,REOPENED');

    // Check recent tickets list
    expect(screen.getByTestId('recent-ticket-1')).toBeInTheDocument();
    expect(screen.getByText('Test ticket')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('recent-ticket-1'));
    expect(mockView).toHaveBeenCalledWith(1);
  });

  it('renders empty state when no recent tickets', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: { myOpen: 0, inProgress: 0, resolved: 0, closed: 0 },
        recentlyUpdated: []
      })
    });

    render(<RequesterDashboard onCreateTicket={vi.fn()} onNavigateToList={vi.fn()} onViewTicket={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-recent-tickets')).toBeInTheDocument();
    });
  });

  it('renders safe error alert when fetch fails due to network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

    render(<RequesterDashboard onCreateTicket={vi.fn()} onNavigateToList={vi.fn()} onViewTicket={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard: Network connection failed/i)).toBeInTheDocument();
    });
  });
});
