import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagement } from '../../components/UserManagement';

global.fetch = vi.fn();

describe('UserManagement Component (UI-05)', () => {
  const mockAdminUser = { id: 1, role: 'ADMINISTRATOR', fullName: 'Admin User' };
  const mockNonAdminUser = { id: 2, role: 'IT_STAFF', fullName: 'Staff User' };

  beforeEach(() => {
    vi.clearAllMocks();
    Storage.prototype.getItem = vi.fn(() => 'mock-token');
  });

  it('should deny access to non-administrators', async () => {
    render(<UserManagement currentUser={mockNonAdminUser} />);
    expect(screen.getByTestId('forbidden-message')).toBeInTheDocument();
  });

  it('should render admin user list with status badges and edit actions', async () => {
    const mockUsers = [
      { id: 1, email: 'admin@test.com', fullName: 'Admin One', role: 'ADMINISTRATOR', isActive: true },
      { id: 2, email: 'staff@test.com', fullName: 'Staff One', role: 'IT_STAFF', isActive: false },
    ];
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    render(<UserManagement currentUser={mockAdminUser} />);

    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getByTestId('user-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-2')).toBeInTheDocument();
    });

    // Check data
    expect(screen.getByText('Admin One')).toBeInTheDocument();
    expect(screen.getByText('Staff One')).toBeInTheDocument();

    // Check badges
    expect(screen.getAllByText('Active')[1]).toBeInTheDocument();
    expect(screen.getAllByText('Inactive')[1]).toBeInTheDocument();
    expect(screen.getByText('ADMINISTRATOR')).toBeInTheDocument();
    expect(screen.getByText('IT STAFF')).toBeInTheDocument();

    // Check edit buttons
    expect(screen.getByTestId('edit-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('reset-btn-2')).toBeInTheDocument();
  });

  it('should open modal when clicking create user', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<UserManagement currentUser={mockAdminUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('create-user-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-user-btn'));

    expect(screen.getByText('Create User')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
  });
});