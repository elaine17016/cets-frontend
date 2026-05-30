import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfile from '../UserProfile';

const logoutMock = vi.fn();
const profileMocks = vi.hoisted(() => ({
  getMyRegistrations: vi.fn(),
  getMyTickets: vi.fn()
}));

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
    getMyRegistrations: profileMocks.getMyRegistrations,
    getMyTickets: profileMocks.getMyTickets,
    getNotifications: vi.fn().mockResolvedValue({ data: { items: [] } }),
    getEvent: vi.fn().mockResolvedValue({ data: null })
  }
}));

describe('UserProfile page', () => {
  beforeEach(() => {
    profileMocks.getMyRegistrations.mockResolvedValue({
      data: {
        items: [{
          id: 'reg-1',
          status: 'CONFIRMED',
          event_title: 'Spring Family Day',
          session_title: 'Session 1',
          ticket_type_name: 'Adult ticket'
        }]
      }
    });
    profileMocks.getMyTickets.mockResolvedValue({
      data: {
        items: [{
          id: 'ticket-1',
          registration_id: 'reg-1',
          status: 'ISSUED',
          issued_at: '2026-05-01T10:00:00+08:00',
          event_title: 'Spring Family Day',
          session_title: 'Session 1',
          ticket_type_name: 'Adult ticket'
        }]
      }
    });
  });

  it('renders profile header and tabs after loading', async () => {
    render(<UserProfile />);
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Employee info')).toBeInTheDocument();
    });
    expect(screen.getByText('My registrations')).toBeInTheDocument();
    expect(screen.getByText('My tickets')).toBeInTheDocument();
  });

  it('renders ticket cards in the default tickets tab', async () => {
    render(<UserProfile />);
    expect(await screen.findByText('Spring Family Day')).toBeInTheDocument();
    expect(screen.getByText('Forfeit ticket')).toBeInTheDocument();
    expect(screen.getByText('Issued')).toBeInTheDocument();
  });

  it('switches to registrations tab', async () => {
    render(<UserProfile />);
    await screen.findByText(/Alice/);
    fireEvent.click(screen.getByText('My registrations'));
    await waitFor(() => {
      expect(screen.getAllByText('Spring Family Day').length).toBeGreaterThan(0);
    });
  });
});
