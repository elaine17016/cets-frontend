import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VerifierPage from '../VerifierPage';

const controllerMock = vi.fn();

vi.mock('../verifier/useVerifierController', () => ({
  useVerifierController: () => controllerMock()
}));

describe('VerifierPage', () => {
  it('renders idle scanner UI', () => {
    controllerMock.mockReturnValue({
      videoRef: { current: null },
      state: {
        deviceId: 'scanner-A-01',
        error: '',
        manualPayload: '',
        result: null,
        scannerHint: '尚未啟動掃描',
        scanning: false
      },
      statusTone: 'idle',
      handleStartScan: vi.fn(),
      handleStopScan: vi.fn(),
      handleDeviceIdChange: vi.fn(),
      handleManualPayloadChange: vi.fn(),
      handleManualVerify: vi.fn()
    });

    render(<VerifierPage />);
    expect(screen.getByText('驗票端')).toBeInTheDocument();
    expect(screen.getByText('開啟相機掃描')).toBeInTheDocument();
    expect(screen.getByText('待命')).toBeInTheDocument();
  });

  it('renders success and error result panels', () => {
    controllerMock.mockReturnValue({
      videoRef: { current: null },
      state: {
        deviceId: 'scanner-A-01',
        error: '票券已核銷',
        manualPayload: 'payload',
        result: {
          ok: true,
          data: {
            ticket_id: 't-1',
            user_name: 'Alice',
            used_at: '2026-05-30'
          }
        },
        scannerHint: '核銷成功：可入場',
        scanning: true
      },
      statusTone: 'success',
      handleStartScan: vi.fn(),
      handleStopScan: vi.fn(),
      handleDeviceIdChange: vi.fn(),
      handleManualPayloadChange: vi.fn(),
      handleManualVerify: vi.fn()
    });

    render(<VerifierPage />);
    expect(screen.getByText('掃描中')).toBeInTheDocument();
    expect(screen.getByText('核銷成功')).toBeInTheDocument();
    expect(screen.getByText('票券已核銷')).toBeInTheDocument();
    expect(screen.getByText('停止掃描')).toBeInTheDocument();
  });
});
