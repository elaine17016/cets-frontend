import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetail from '../EventDetail';

const getEventMock = vi.fn();
const getMyRegistrationsMock = vi.fn();

vi.mock('../../api/client', () => ({
  apiClient: {
    getEvent: (...args) => getEventMock(...args),
    getMyRegistrations: (...args) => getMyRegistrationsMock(...args),
    getAccessToken: () => 'token'
  }
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'EMPLOYEE', id: 'u1' },
    loading: false
  })
}));

describe('EventDetail page', () => {
  beforeEach(() => {
    getEventMock.mockResolvedValue({
      data: {
        id: 'evt-1',
        title: '春季家庭日',
        description: '活動說明',
        status: 'PUBLISHED',
        allowed_sites: ['HSINCHU'],
        created_at: '2026-05-01T10:00:00+08:00',
        sessions: [{
          id: 'sess-1',
          title: '第一場',
          venue: '新竹廣場',
          starts_at: '2026-06-10T09:00:00+08:00',
          ends_at: '2026-06-10T18:00:00+08:00',
          registration_opens_at: '2026-05-01T00:00:00+08:00',
          registration_closes_at: '2026-12-31T23:59:59+08:00',
          confirmation_deadline_hours: 24,
          status: 'REGISTRATION_OPEN',
          ticket_types: [{ id: 'tt-1', name: '成人票', audience: 'EMPLOYEE', quota: 100 }]
        }]
      }
    });
    getMyRegistrationsMock.mockResolvedValue({ data: { items: [] } });
  });

  it('renders event detail after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/events/evt-1']}>
        <Routes>
          <Route path="/events/:eventId" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('春季家庭日')).toBeInTheDocument();
    expect(screen.getByText('場次與票種')).toBeInTheDocument();
    await waitFor(() => {
      expect(getEventMock).toHaveBeenCalledWith('evt-1');
    });
  });
});
