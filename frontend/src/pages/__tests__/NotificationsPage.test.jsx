import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationsPage from '../NotificationsPage';

const refreshListMock = vi.fn().mockResolvedValue(undefined);
const markReadMock = vi.fn();
const markAllReadMock = vi.fn();

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    items: [{
      id: 'n1',
      title: '報名成功 — 春季家庭日',
      body: '您已成功報名',
      type: 'REGISTRATION_CONFIRMED',
      created_at: '2026-05-30T10:00:00+08:00'
    }],
    unreadCount: 1,
    refreshList: refreshListMock,
    markRead: markReadMock,
    markAllRead: markAllReadMock
  })
}));

describe('NotificationsPage', () => {
  it('renders notifications and supports mark-all-read', async () => {
    render(<NotificationsPage />);
    expect(screen.getByText('通知中心')).toBeInTheDocument();
    expect(await screen.findByText('報名成功 — 春季家庭日')).toBeInTheDocument();
    fireEvent.click(screen.getByText('全部已讀'));
    expect(markAllReadMock).toHaveBeenCalled();
  });
});
