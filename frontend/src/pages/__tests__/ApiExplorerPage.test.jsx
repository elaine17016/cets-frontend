import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ApiExplorerPage from '../ApiExplorerPage';

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getEvents: vi.fn(),
  getUnreadCount: vi.fn(),
  getNotifications: vi.fn(),
  getMyRegistrations: vi.fn(),
  getMyTickets: vi.fn(),
  getWsUrl: vi.fn(() => 'ws://localhost'),
  getAccessToken: vi.fn(() => 'token')
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN', name: 'Admin User' } })
}));

vi.mock('../../api/client', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
  apiClient: apiMocks
}));

describe('ApiExplorerPage', () => {
  beforeEach(() => {
    apiMocks.getMe.mockResolvedValue({ data: { id: 'u1', name: 'Admin User', role: 'ADMIN' } });
    apiMocks.getEvents.mockResolvedValue({ data: { items: [] } });
    apiMocks.getUnreadCount.mockResolvedValue({ data: { unread_count: 0 } });
    apiMocks.getNotifications.mockResolvedValue({ data: { items: [], unread_count: 0 } });
    apiMocks.getMyRegistrations.mockResolvedValue({ data: { items: [] } });
    apiMocks.getMyTickets.mockResolvedValue({ data: { items: [] } });
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    global.WebSocket = class {
      constructor() {
        this.readyState = 1;
        Promise.resolve().then(() => {
          if (this.onopen) this.onopen();
          if (this.onmessage) {
            this.onmessage({ data: JSON.stringify({ type: 'auth_ok' }) });
          }
        });
      }
      send() {}
      close() {}
    };
  });

  it('renders API endpoint groups and health check actions', () => {
    render(<ApiExplorerPage />);
    expect(screen.getByText('Auth / 身分驗證')).toBeInTheDocument();
    expect(screen.getByText('管理員')).toBeInTheDocument();
    expect(screen.getByText('一鍵執行整合檢查')).toBeInTheDocument();
  });

  it('runs integrated checks and shows report', async () => {
    render(<ApiExplorerPage />);
    fireEvent.click(screen.getByText('一鍵執行整合檢查'));

    await waitFor(() => {
      expect(apiMocks.getMe).toHaveBeenCalled();
    });
    expect(await screen.findByText('檢查結果')).toBeInTheDocument();
    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
  });
});
