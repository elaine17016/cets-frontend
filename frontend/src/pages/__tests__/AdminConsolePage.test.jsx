import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from 'antd';

const adminMocks = vi.hoisted(() => ({
  adminGetEvents: vi.fn(),
  adminGetDashboard: vi.fn(),
  adminGetRegistrations: vi.fn(),
  adminGetEvent: vi.fn(),
  adminExportSync: vi.fn(),
  adminRunLottery: vi.fn(),
  adminPublishEvent: vi.fn(),
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
    adminPublishEvent: adminMocks.adminPublishEvent,
    adminCancelEvent: vi.fn(),
    adminUpdateEvent: vi.fn(),
    adminRunLottery: adminMocks.adminRunLottery,
    adminExportSync: adminMocks.adminExportSync,
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
          title: '2026 Spring Family Day',
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
          name: 'Adult ticket',
          quota: 100,
          registered: 20,
          confirmed: 10,
          won: 15
        }],
        attendance: { total_confirmed: 10, checked_in: 4 },
        sessions_lottery: [{
          session_id: 'sess-1',
          title: 'Session 1',
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
          session_title: 'Session 1',
          ticket_type_name: 'Adult ticket',
          user: { employee_id: 'E001', name: 'Alice', department: 'IT' }
        }]
      }
    });
    adminMocks.adminGetEvent.mockResolvedValue({
      data: {
        id: 'evt-1',
        sessions: [{ id: 'sess-1', title: 'Session 1', lottery_at: '2026-06-05T10:00:00+08:00' }]
      }
    });
    adminMocks.adminExportSync.mockResolvedValue('id,name\n1,Alice');
    adminMocks.adminRunLottery.mockResolvedValue({
      data: { winners_count: 3, total_candidates: 5 }
    });
    adminMocks.adminPublishEvent.mockResolvedValue({ data: { id: 'draft-1', status: 'PUBLISHED' } });
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders admin hero and create form defaults', async () => {
    render(<AdminConsolePage />);
    expect(await screen.findByText('Admin console')).toBeInTheDocument();
    expect(screen.getByText('Control panel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026 Spring Family Day')).toBeInTheDocument();
    expect(screen.getByText('Basic info')).toBeInTheDocument();
  });

  it('loads dashboard tab with stats and registrations', async () => {
    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));

    await waitFor(() => {
      expect(adminMocks.adminGetDashboard).toHaveBeenCalled();
    });
    expect(await screen.findByText('Registration list')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Run lottery now')).toBeInTheDocument();
    expect(screen.getByText('Lottery by session')).toBeInTheDocument();
  });

  it('shows admin viewer warning when role is read-only', async () => {
    adminMocks.useAuthMock.mockReturnValue({ user: { role: 'ADMIN_VIEWER' } });

    render(<AdminConsolePage />);
    expect(await screen.findByText('You are signed in as ADMIN_VIEWER (read-only)')).toBeInTheDocument();
  });

  it('renders draft events tab when drafts exist', async () => {
    adminMocks.adminGetEvents.mockResolvedValue({
      data: {
        items: [{
          id: 'draft-1',
          title: 'Draft Family Day',
          status: 'DRAFT',
          allowed_sites: ['HSINCHU'],
          created_at: '2026-05-01T10:00:00+08:00'
        }]
      }
    });

    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: /Draft events/ }));

    expect(await screen.findByText('Draft Family Day')).toBeInTheDocument();
    expect(screen.getByText('Load for edit')).toBeInTheDocument();
  });

  it('exports registrations as CSV from the dashboard tab', async () => {
    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));
    await screen.findByText('Export CSV');

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(adminMocks.adminExportSync).toHaveBeenCalledWith('evt-1', { format: 'csv', mask_pii: true });
    });
  });

  it('runs session lottery after confirmation', async () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation(({ onOk }) => {
      Promise.resolve(onOk?.());
      return { destroy: vi.fn(), update: vi.fn() };
    });

    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));
    const lotteryButton = await screen.findByRole('button', { name: 'Run lottery' });
    fireEvent.click(lotteryButton);

    await waitFor(() => {
      expect(adminMocks.adminRunLottery).toHaveBeenCalledWith('sess-1');
    });
    confirmSpy.mockRestore();
  });

  it('loads a draft event into edit mode', async () => {
    adminMocks.adminGetEvents.mockResolvedValue({
      data: {
        items: [{
          id: 'draft-1',
          title: 'Draft Family Day',
          status: 'DRAFT',
          allowed_sites: ['HSINCHU'],
          created_at: '2026-05-01T10:00:00+08:00'
        }]
      }
    });
    adminMocks.adminGetEvent.mockResolvedValue({
      data: {
        id: 'draft-1',
        title: 'Draft Family Day',
        status: 'DRAFT',
        allowed_sites: ['HSINCHU'],
        sessions: []
      }
    });

    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: /Draft events/ }));
    fireEvent.click(await screen.findByText('Load for edit'));

    await waitFor(() => {
      expect(adminMocks.adminGetEvent).toHaveBeenCalledWith('draft-1');
    });
    expect(await screen.findByDisplayValue('Draft Family Day')).toBeInTheDocument();
  });

  it('publishes a draft event from the dashboard tab', async () => {
    adminMocks.adminGetEvents.mockResolvedValue({
      data: {
        items: [{
          id: 'draft-1',
          title: 'Draft Family Day',
          status: 'DRAFT',
          allowed_sites: ['HSINCHU'],
          created_at: '2026-05-01T10:00:00+08:00'
        }]
      }
    });

    render(<AdminConsolePage />);
    await screen.findByText('Admin console');
    fireEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Publish event' }));

    await waitFor(() => {
      expect(adminMocks.adminPublishEvent).toHaveBeenCalledWith('draft-1');
    });
  });
});
