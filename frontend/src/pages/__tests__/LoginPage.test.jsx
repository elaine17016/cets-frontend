import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../LoginPage';

const startOIDCLoginMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ startOIDCLogin: startOIDCLoginMock })
}));

describe('LoginPage', () => {
  it('renders enterprise login CTA and triggers OIDC login', async () => {
    startOIDCLoginMock.mockResolvedValue(undefined);
    render(<LoginPage />);

    expect(screen.getByText('台積電員工活動平台')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /企業登入/ }));
    expect(startOIDCLoginMock).toHaveBeenCalled();
  });

  it('shows an error message when OIDC login fails', async () => {
    startOIDCLoginMock.mockRejectedValue({ error: { message: '後端不可用' } });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /企業登入/ }));
    expect(await screen.findByText('後端不可用')).toBeInTheDocument();
  });
});
