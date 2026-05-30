import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getNotificationsMock: vi.fn(),
  refreshListMock: vi.fn()
}));

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}));

vi.mock('../../api/client', () => ({
  apiClient: {
    getWsUrl: () => 'ws://localhost',
    getAccessToken: () => 'token',
    getRefreshToken: () => null,
    getNotifications: mocks.getNotificationsMock,
    getUnreadCount: vi.fn().mockResolvedValue({ data: { unread_count: 0 } }),
    markNotificationRead: vi.fn(),
    markAllRead: vi.fn(),
    refresh: vi.fn(),
    clearAuth: vi.fn()
  }
}));

import { NotificationProvider } from '../NotificationContext';

class MockWebSocket {
  static instances = [];

  constructor() {
    this.readyState = 1;
    MockWebSocket.instances.push(this);
    Promise.resolve().then(() => {
      if (this.onopen) this.onopen();
    });
  }

  send(d) {
    this.sent = this.sent || [];
    this.sent.push(d);
  }

  close() {
    this.readyState = 3;
  }
}

describe('NotificationContext websocket messages', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
    mocks.getNotificationsMock.mockResolvedValue({ data: { items: [], unread_count: 0 } });
    mocks.refreshListMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles notification and ping websocket messages', async () => {
    await act(async () => {
      render(
        <NotificationProvider>
          <div />
        </NotificationProvider>
      );
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      if (ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify({
            type: 'notification',
            data: { id: 'n2', title: 'Event cancelled', type: 'EVENT_CANCELLED' }
          })
        });
      }
    });

    await act(async () => {
      if (ws.onmessage) {
        ws.onmessage({ data: JSON.stringify({ type: 'ping' }) });
      }
    });

    expect(ws.sent.some((msg) => msg.includes('"type":"pong"'))).toBe(true);
    expect(mocks.getNotificationsMock).toHaveBeenCalled();
  });
});
