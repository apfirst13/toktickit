import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketDetail } from '../../components/TicketDetail';

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

describe('TicketWorkflow', () => {
  it('should render the status workflow dropdown for IT_STAFF', async () => {
    // Mock fetch for ticket details
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/staff/users')) {
        return {
          ok: true,
          json: async () => [{ id: 2, fullName: 'Staff User' }]
        };
      }
      return {
        ok: true,
        json: async () => ({
          id: 1,
          ticketNumber: 'TIK-001',
          summary: 'Test Workflow',
          description: 'Testing',
          currentStatus: 'IN_PROGRESS',
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
          actionsTaken: [],
        })
      };
    }) as any;

    render(
      <TicketDetail 
        ticketId={1} 
        onBack={() => {}} 
        userRole="IT_STAFF" 
        currentUser={{ id: 2, fullName: 'Staff User', role: 'IT_STAFF', email: 'staff@test.com' }} 
      />
    );

    // Wait for the status dropdown or badge to appear
    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });
    
    // Status dropdown should be present for staff
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });
});
