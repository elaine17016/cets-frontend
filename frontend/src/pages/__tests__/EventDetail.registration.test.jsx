import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const eventDetailMocks = vi.hoisted(() => ({
  getEvent: vi.fn(),
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn()
}));

vi.mock('../../api/client', () => ({
  apiClient: {
    getEvent: (...args) => eventDetailMocks.getEvent(...args),
    getMyRegistrations: (...args) => eventDetailMocks.getMyRegistrations(...args),
    createRegistration: (...args) => eventDetailMocks.createRegistration(...args),
    getAccessToken: () => 'token'
  }
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'EMPLOYEE', id: 'u1' },
    loading: false
  })
}));

import EventDetail from '../EventDetail';

describe('EventDetail registration flow', () => {
  beforeEach(() => {
    eventDetailMocks.getEvent.mockResolvedValue({
      data: {
        id: 'evt-1',
        title: 'Spring Family Day',
        description: 'Event description',
        status: 'PUBLISHED',
        allowed_sites: ['HSINCHU'],
        created_at: '2026-05-01T10:00:00+08:00',
        sessions: [{
          id: 'sess-1',
          title: 'Session 1',
          venue: 'Hsinchu plaza',
          starts_at: '2026-06-10T09:00:00+08:00',
          ends_at: '2026-06-10T18:00:00+08:00',
          registration_opens_at: '2026-05-01T00:00:00+08:00',
          registration_closes_at: '2026-12-31T23:59:59+08:00',
          confirmation_deadline_hours: 24,
          status: 'REGISTRATION_OPEN',
          ticket_types: [{ id: 'tt-1', name: 'Adult ticket', audience: 'EMPLOYEE', quota: 100 }]
        }]
      }
    });
    eventDetailMocks.getMyRegistrations.mockResolvedValue({ data: { items: [] } });
    eventDetailMocks.createRegistration.mockResolvedValue({ data: { id: 'reg-1' } });
  });

  it('opens registration dialog and submits registration', async () => {
    render(
      <MemoryRouter initialEntries={['/events/evt-1']}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Spring Family Day')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Register for this session'));

    expect(await screen.findByText('I confirm eligibility and register')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/I confirm that I meet this ticket type requirements/i));
    fireEvent.click(screen.getByRole('button', { name: 'I confirm eligibility and register' }));

    await waitFor(() => {
      expect(eventDetailMocks.createRegistration).toHaveBeenCalled();
    });
  });
});
