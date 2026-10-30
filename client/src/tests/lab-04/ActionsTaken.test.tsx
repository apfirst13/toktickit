import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ActionsTakenList } from '../../components/tickets/ActionsTakenList';

describe('ActionsTaken UI Component', () => {
  const mockActions = [
    {
      id: 1,
      actionDateTime: '2026-01-01T10:00:00Z',
      description: 'Checked logs',
      result: 'Found errors',
      followUpRequired: false,
      version: 1,
      performedBy: { id: 101, fullName: 'Staff One', role: 'IT_STAFF' }
    }
  ];

  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.setItem('token', 'fake-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders actions list correctly for IT Staff', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockActions
    });

    render(<ActionsTakenList ticketId={1} userRole="IT_STAFF" />);

    expect(await screen.findByText('Actions Taken')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Checked logs/i)).toBeDefined();
      expect(screen.getByText(/Found errors/i)).toBeDefined();
      expect(screen.getByText(/Staff One/i)).toBeDefined();
    });

    // Staff should see Add Action and Edit buttons
    expect(screen.getByText('+ Add Action')).toBeDefined();
    expect(screen.getByText('Edit')).toBeDefined();
  });

  it('hides Create/Edit buttons for Requester', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockActions
    });

    render(<ActionsTakenList ticketId={1} userRole="REQUESTER" />);

    await waitFor(() => {
      expect(screen.getByText(/Checked logs/i)).toBeDefined();
    });

    // Requester should NOT see Add Action or Edit
    expect(screen.queryByText('+ Add Action')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
  });

  it('validates followUpNote conditionally in the form', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [] // Empty list initially
    });

    render(<ActionsTakenList ticketId={1} userRole="IT_STAFF" />);

    // Click add action
    await waitFor(() => {
      expect(screen.getByText('+ Add Action')).toBeDefined();
    });
    fireEvent.click(screen.getByText('+ Add Action'));

    // Form should appear
    expect(screen.getByText('Add New Action Taken')).toBeDefined();

    // Fill in required basic fields
    fireEvent.change(screen.getByPlaceholderText('What did you do?'), { target: { value: 'Did something' } });
    fireEvent.change(screen.getByPlaceholderText('What was the outcome?'), { target: { value: 'Good' } });

    // Tick follow up
    const checkbox = screen.getByLabelText('Follow-up Required');
    fireEvent.click(checkbox);

    // Try to submit without followUpNote
    fireEvent.submit(screen.getByTestId('action-taken-form'));

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Follow-up note is required when follow-up is required')).toBeDefined();
    });

    // Fill followUpNote
    fireEvent.change(screen.getByPlaceholderText('Why is follow-up needed?'), { target: { value: 'Check tomorrow' } });
    
    // Mock the POST request
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2 })
    });
    // Mock the subsequent GET request
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockActions
    });

    // Submit again
    fireEvent.submit(screen.getByTestId('action-taken-form'));

    await waitFor(() => {
      expect(screen.queryByText('Follow-up note is required when follow-up is required')).toBeNull();
    });
  });

  it('submits new action successfully and asserts POST payload', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActions
      });

    render(<ActionsTakenList ticketId={1} userRole="IT_STAFF" />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Action')).toBeDefined();
    });
    fireEvent.click(screen.getByText('+ Add Action'));

    fireEvent.change(screen.getByPlaceholderText('What did you do?'), { target: { value: 'Inspected network switch' } });
    fireEvent.change(screen.getByPlaceholderText('What was the outcome?'), { target: { value: 'Port 4 reactivated' } });

    fireEvent.submit(screen.getByTestId('action-taken-form'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tickets/1/actions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer fake-token'
          }),
          body: expect.any(String)
        })
      );
    });

    const postCall = (global.fetch as any).mock.calls.find((call: any[]) => call[1]?.method === 'POST');
    const parsedBody = JSON.parse(postCall[1].body);
    expect(parsedBody.description).toBe('Inspected network switch');
    expect(parsedBody.result).toBe('Port 4 reactivated');
    expect(parsedBody.followUpRequired).toBe(false);
  });

  it('opens edit mode and submits update with PATCH', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...mockActions[0], description: 'Updated check' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...mockActions[0], description: 'Updated check' }]
      });

    render(<ActionsTakenList ticketId={1} userRole="IT_STAFF" />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByText('Edit Action Taken')).toBeDefined();
    const descInput = screen.getByPlaceholderText('What did you do?') as HTMLTextAreaElement;
    expect(descInput.value).toBe('Checked logs');

    fireEvent.change(descInput, { target: { value: 'Updated log inspection' } });
    fireEvent.submit(screen.getByTestId('action-taken-form'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tickets/1/actions/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
    });

    const patchCall = (global.fetch as any).mock.calls.find((call: any[]) => call[1]?.method === 'PATCH');
    const parsedBody = JSON.parse(patchCall[1].body);
    expect(parsedBody.description).toBe('Updated log inspection');
    expect(parsedBody.version).toBe(1);
  });

  it('displays error in UI when update fails with 409 Conflict', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActions
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Conflict: Action was modified by another user. Please reload.' })
      });

    render(<ActionsTakenList ticketId={1} userRole="IT_STAFF" />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Edit'));

    fireEvent.change(screen.getByPlaceholderText('What did you do?'), { target: { value: 'Conflicting update' } });
    fireEvent.submit(screen.getByTestId('action-taken-form'));

    await waitFor(() => {
      expect(screen.getByText('Conflict: Action was modified by another user. Please reload.')).toBeDefined();
    });
  });
});
