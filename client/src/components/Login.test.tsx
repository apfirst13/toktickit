import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { Login } from './Login';
import React from 'react';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

test('submits login form and calls onLoginSuccess on success', async () => {
  const onLoginSuccess = vi.fn();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ token: 'mock-token', user: { id: 1, email: 'staff1@toktickit.com', role: 'IT_STAFF', mustChangePassword: false } })
  });

  render(<Login onLoginSuccess={onLoginSuccess} />);
  
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'staff1@toktickit.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
  fireEvent.click(screen.getByRole('button', { name: /Login/i }));

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'staff1@toktickit.com', password: 'Password123!' })
    }));
    expect(onLoginSuccess).toHaveBeenCalledWith('mock-token', expect.objectContaining({ email: 'staff1@toktickit.com' }));
  });
});

test('shows error message on failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Invalid credentials' })
  });

  render(<Login onLoginSuccess={vi.fn()} />);
  
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: /Login/i }));

  await waitFor(() => {
    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });
});
