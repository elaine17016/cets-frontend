import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppHeader from '../Header';

const logoutMock = vi.fn();
const startOIDCLoginMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'EMPLOYEE', name: 'Alice' },
    logout: logoutMock,
    startOIDCLogin: startOIDCLoginMock
  })
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 2, connected: true })
}));

vi.mock('../../context/UiPreferencesContext', () => ({
  useUiPreferences: () => ({
    colorMode: 'dark',
    textScale: 'large',
    setTextScale: vi.fn()
  })
}));

describe('Header', () => {
  it('renders employee navigation actions', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    );

    expect(screen.getByText('晶彩活動通')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('開啟帳號功能'));
    expect(screen.getByText('我的票匣')).toBeInTheDocument();
    expect(screen.getByText('通知中心')).toBeInTheDocument();
  });
});
