import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MobileBottomBar from '../MobileBottomBar';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'EMPLOYEE' } })
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 1 })
}));

describe('MobileBottomBar', () => {
  it('renders employee navigation links', () => {
    render(
      <MemoryRouter>
        <MobileBottomBar />
      </MemoryRouter>
    );
    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('通知')).toBeInTheDocument();
    expect(screen.getByText('票匣')).toBeInTheDocument();
  });
});
