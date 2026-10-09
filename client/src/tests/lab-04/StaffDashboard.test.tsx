import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffDashboard } from '../../components/dashboard/StaffDashboard';

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Lab 4 - Staff Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<StaffDashboard onNavigateToQueue={vi.fn()} onViewTicket={vi.fn()} userRole="IT_STAFF" />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('renders IT Staff dashboard metrics and navigates to correct filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: { new: 3, open: 2, inProgress: 4, waiting: 1, myAssigned: 5, urgent: 2 },
        recentlyUpdated: []
      })
    });

    const mockNavigate = vi.fn();
    render(<StaffDashboard onNavigateToQueue={mockNavigate} onViewTicket={vi.fn()} userRole="IT_STAFF" />);

    await waitFor(() => {
      expect(screen.getByTestId('metric-new')).toBeInTheDocument();
    });

    expect(screen.getByTestId('metric-new')).toHaveTextContent('3');
    expect(screen.getByTestId('metric-open')).toHaveTextContent('2');
    expect(screen.getByTestId('metric-in-progress')).toHaveTextContent('4');
    expect(screen.getByTestId('metric-waiting')).toHaveTextContent('1');
    expect(screen.getByTestId('metric-my-assigned')).toHaveTextContent('5');
    expect(screen.getByTestId('metric-urgent')).toHaveTextContent('2');

    // Test drill-down filters
    fireEvent.click(screen.getByTestId('metric-new'));
    expect(mockNavigate).toHaveBeenCalledWith({ status: 'NEW' });

    // Ensure Open card uses the correct multi-status string
    fireEvent.click(screen.getByTestId('metric-open'));
    expect(mockNavigate).toHaveBeenCalledWith({ status: 'OPEN,REOPENED' });

    fireEvent.click(screen.getByTestId('metric-my-assigned'));
    expect(mockNavigate).toHaveBeenCalledWith({ owner: 'me' });

    fireEvent.click(screen.getByTestId('metric-urgent'));
    expect(mockNavigate).toHaveBeenCalledWith({ isUrgent: true });
    
    // Total users should not be shown for IT_STAFF
    expect(screen.queryByTestId('admin-stats')).not.toBeInTheDocument();
  });

  it('renders Admin dashboard with total users metric', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: { new: 0, open: 0, inProgress: 0, waiting: 0, myAssigned: 0, urgent: 0, totalUsers: 42 },
        recentlyUpdated: []
      })
    });

    render(<StaffDashboard onNavigateToQueue={vi.fn()} onViewTicket={vi.fn()} userRole="ADMINISTRATOR" />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-stats')).toBeInTheDocument();
    });

    expect(screen.getByTestId('admin-stats')).toHaveTextContent('42');
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders recent tickets list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: { new: 0, open: 0, inProgress: 0, waiting: 0, myAssigned: 0, urgent: 0 },
        recentlyUpdated: [
          {
            id: 10,
            ticketNumber: 'T-010',
            summary: 'Broken printer',
            currentStatus: 'IN_PROGRESS',
            requestedPriority: 'HIGH',
            createdAt: '2026-09-28T00:00:00Z',
            updatedAt: '2026-09-28T00:00:00Z',
            category: { name: 'Hardware' }
          }
        ]
      })
    });

    const mockView = vi.fn();
    render(<StaffDashboard onNavigateToQueue={vi.fn()} onViewTicket={mockView} userRole="IT_STAFF" />);

    await waitFor(() => {
      expect(screen.getByTestId('recent-ticket-10')).toBeInTheDocument();
    });

    expect(screen.getByText('Broken printer')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('recent-ticket-10'));
    expect(mockView).toHaveBeenCalledWith(10);
  });
});
