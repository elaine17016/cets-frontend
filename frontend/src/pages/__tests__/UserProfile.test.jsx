import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UserProfile from '../UserProfile';

const logoutMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'EMPLOYEE',
      employee_id: 'E001',
      department: 'IT',
      site: 'HSINCHU',
      status: 'ACTIVE'
    },
    logout: logoutMock
  })
}));

vi.mock('../../api/client', () => ({
  apiClient: {
    getMyRegistrations: vi.fn().mockResolvedValue({ data: { items: [] } }),
    getMyTickets: vi.fn().mockResolvedValue({ data: { items: [] } }),
    getNotifications: vi.fn().mockResolvedValue({ data: { items: [] } })
  }
}));

describe('UserProfile page', () => {
  it('renders profile header and tabs after loading', async () => {
    render(<UserProfile />);
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('員工資訊')).toBeInTheDocument();
    });
    expect(screen.getByText('我的報名')).toBeInTheDocument();
    expect(screen.getByText('我的票匣')).toBeInTheDocument();
  });
});
