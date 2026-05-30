import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminMocks = vi.hoisted(() => ({
  adminGetEvents: vi.fn(),
  adminGetDashboard: vi.fn(),
  adminGetRegistrations: vi.fn(),
  adminGetEvent: vi.fn(),
  useAuthMock: vi.fn(() => ({ user: { role: 'ADMIN', name: 'Admin' } }))
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => adminMocks.useAuthMock()
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ refreshList: vi.fn() })
}));

vi.mock('../../api/client', () => ({
  apiClient: {
    adminGetEvents: adminMocks.adminGetEvents,
    adminGetDashboard: adminMocks.adminGetDashboard,
    adminGetRegistrations: adminMocks.adminGetRegistrations,
    adminGetEvent: adminMocks.adminGetEvent,
    getEvents: vi.fn().mockResolvedValue({ data: { items: [] } }),
    getEvent: vi.fn().mockResolvedValue({ data: null }),
    adminCreateEvent: vi.fn(),
    adminCreateSession: vi.fn(),
    adminCreateTicketType: vi.fn(),
    adminPublishEvent: vi.fn(),
    adminCancelEvent: vi.fn(),
    adminUpdateEvent: vi.fn(),
    adminRunLottery: vi.fn(),
    adminExportSync: vi.fn(),
    adminDeleteDraft: vi.fn()
  }
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null
}));

import AdminConsolePage from '../AdminConsolePage';

describe('AdminConsolePage', () => {
  beforeEach(() => {
    adminMocks.useAuthMock.mockReturnValue({ user: { role: 'ADMIN', name: 'Admin' } });
    adminMocks.adminGetEvents.mockResolvedValue({
      data: {
        items: [{
          id: 'evt-1',
          title: '2026 春季家庭日',
          status: 'PUBLISHED',
          allowed_sites: ['HSINCHU'],
          created_at: '2026-05-01T10:00:00+08:00'
        }]
      }
    });
    adminMocks.adminGetDashboard.mockResolvedValue({
      data: {
        registration_timeline: [{ date: '2026-06-01', count: 12 }],
        site_distribution: [{ site: 'HSINCHU', count: 8 }],
        ticket_type_progress: [{
          ticket_type_id: 'tt-1',
          name: '成人票',
          quota: 100,
          registered: 20,
          confirmed: 10,
          won: 15
        }],
        attendance: { total_confirmed: 10, checked_in: 4 },
        sessions_lottery: [{
          session_id: 'sess-1',
          title: '第一場',
          lottery_at: '2026-06-05T10:00:00+08:00',
          registered_pending: 5
        }]
      }
    });
    adminMocks.adminGetRegistrations.mockResolvedValue({
      data: {
        items: [{
          id: 'reg-1',
          status: 'CONFIRMED',
          session_title: '第一場',
          ticket_type_name: '成人票',
          user: { employee_id: 'E001', name: 'Alice', department: 'IT' }
        }]
      }
    });
    adminMocks.adminGetEvent.mockResolvedValue({
      data: {
        id: 'evt-1',
        sessions: [{ id: 'sess-1', title: '第一場', lottery_at: '2026-06-05T10:00:00+08:00' }]
      }
    });
  });

  it('renders admin hero and create form defaults', async () => {
    render(<AdminConsolePage />);
    expect(await screen.findByText('管理後台')).toBeInTheDocument();
    expect(screen.getByText('主控台')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026 春季家庭日')).toBeInTheDocument();
    expect(screen.getByText('基本資料')).toBeInTheDocument();
  });

  it('loads dashboard tab with stats and registrations', async () => {
    render(<AdminConsolePage />);
    await screen.findByText('管理後台');
    fireEvent.click(screen.getByRole('tab', { name: '儀表板' }));

    await waitFor(() => {
      expect(adminMocks.adminGetDashboard).toHaveBeenCalled();
    });
    expect(await screen.findByText('報名清單')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('即時抽籤')).toBeInTheDocument();
    expect(screen.getByText('抽籤執行（依場次）')).toBeInTheDocument();
  });

  it('shows admin viewer warning when role is read-only', async () => {
    adminMocks.useAuthMock.mockReturnValue({ user: { role: 'ADMIN_VIEWER' } });

    render(<AdminConsolePage />);
    expect(await screen.findByText('你目前是 ADMIN_VIEWER（唯讀）')).toBeInTheDocument();
  });
});
