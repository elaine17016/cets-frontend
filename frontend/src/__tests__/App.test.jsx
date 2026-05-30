import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../App';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../context/AuthContext';

describe('ProtectedRoute', () => {
  it('shows loader while auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute allowRoles={['EMPLOYEE']}>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(document.querySelector('.fullscreen-loader')).toBeTruthy();
  });

  it('renders children for allowed roles', () => {
    useAuth.mockReturnValue({ user: { role: 'EMPLOYEE' }, loading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute allowRoles={['EMPLOYEE']}>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects unauthorized roles away from protected content', () => {
    useAuth.mockReturnValue({ user: { role: 'VERIFIER' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/me']}>
        <ProtectedRoute allowRoles={['EMPLOYEE']}>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });
});
