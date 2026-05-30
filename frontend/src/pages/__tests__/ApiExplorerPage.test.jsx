import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ApiExplorerPage from '../ApiExplorerPage';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN', name: 'Admin User' } })
}));

vi.mock('../../api/client', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
  apiClient: {
    getMe: vi.fn().mockResolvedValue({ data: { id: 'u1' } })
  }
}));

describe('ApiExplorerPage', () => {
  it('renders API endpoint groups and health check actions', () => {
    render(<ApiExplorerPage />);
    expect(screen.getByText('Auth / 身分驗證')).toBeInTheDocument();
    expect(screen.getByText('管理員')).toBeInTheDocument();
    expect(screen.getByText('一鍵執行整合檢查')).toBeInTheDocument();
  });
});
