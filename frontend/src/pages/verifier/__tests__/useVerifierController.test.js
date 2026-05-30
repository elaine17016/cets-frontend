import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import {
  formatVerifyError,
  getScannerMissHint,
  isScannerMiss,
  useVerifierController,
  verifierReducer
} from '../useVerifierController';

const verifyTicketMock = vi.fn();

vi.mock('../../../api/client', () => ({
  apiClient: {
    verifyTicket: (...args) => verifyTicketMock(...args)
  }
}));

const decodeFromConstraintsMock = vi.fn();

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: vi.fn().mockImplementation(() => ({
    decodeFromConstraints: (...args) => decodeFromConstraintsMock(...args)
  }))
}));

const initialState = {
  scanning: false,
  result: null,
  error: '',
  deviceId: 'scanner-A-01',
  manualPayload: '',
  scannerHint: '尚未啟動掃描',
  lastDetectedText: '',
  lastDetectedAt: ''
};

describe('verifierReducer', () => {
  it('handles scan lifecycle transitions', () => {
    expect(verifierReducer(initialState, { type: 'scanStarting' })).toMatchObject({
      scanning: true,
      scannerHint: '正在初始化相機...'
    });
    expect(verifierReducer(initialState, { type: 'scanReady' })).toMatchObject({
      scanning: true,
      scannerHint: '相機已啟動，等待辨識 QR...'
    });
    expect(verifierReducer(initialState, { type: 'scanStopped' })).toMatchObject({
      scanning: false,
      scannerHint: '已停止掃描'
    });
    expect(verifierReducer(initialState, {
      type: 'scanFailed',
      error: '相機失敗',
      hint: '初始化失敗'
    })).toMatchObject({
      scanning: false,
      error: '相機失敗',
      scannerHint: '初始化失敗'
    });
  });

  it('handles verify success and failure states', () => {
    const detected = verifierReducer(initialState, {
      type: 'qrDetected',
      text: 'qr-1',
      detectedAt: '2026-01-01'
    });
    expect(detected.scannerHint).toBe('已辨識到 QR，送出核銷中...');

    const success = verifierReducer(detected, { type: 'verifySuccess', data: { ticket_id: 't1' } });
    expect(success.result).toEqual({ ok: true, data: { ticket_id: 't1' } });

    const failed = verifierReducer(detected, { type: 'verifyFailed', error: '票券無效' });
    expect(failed.error).toBe('票券無效');
  });

  it('updates device and manual payload fields', () => {
    expect(verifierReducer(initialState, { type: 'deviceIdChanged', value: 'dev-2' }).deviceId).toBe('dev-2');
    expect(verifierReducer(initialState, { type: 'manualPayloadChanged', value: 'payload' }).manualPayload).toBe('payload');
    expect(verifierReducer(initialState, { type: 'unknown' })).toEqual(initialState);
  });
});

describe('formatVerifyError', () => {
  it('formats API and plain errors', () => {
    expect(formatVerifyError({ error: { message: '票券已使用' } })).toBe('票券已使用');
    expect(formatVerifyError({ message: '網路錯誤' })).toBe('網路錯誤');
    expect(formatVerifyError({})).toBe('核銷失敗');
    expect(formatVerifyError({
      error: {
        message: '票券無效',
        details: { ticket_id: 't1', request_id: 'req-1', gate: 'A' }
      }
    })).toBe('票券無效（ticket_id: t1 · gate: A）');
  });
});

describe('scanner miss helpers', () => {
  it('classifies transient decode errors', () => {
    expect(isScannerMiss(NotFoundException.getNotFoundInstance())).toBe(true);
    expect(isScannerMiss(FormatException.getFormatInstance())).toBe(true);
    expect(isScannerMiss(ChecksumException.getChecksumInstance())).toBe(true);
    expect(isScannerMiss('No QR code found')).toBe(true);
    expect(isScannerMiss(new Error('camera denied'))).toBe(false);
  });

  it('returns actionable hints for scanner misses', () => {
    expect(getScannerMissHint(FormatException.getFormatInstance())).toContain('畫面不完整');
    expect(getScannerMissHint(NotFoundException.getNotFoundInstance())).toContain('尚未辨識到 QR');
  });
});

describe('useVerifierController', () => {
  beforeEach(() => {
    verifyTicketMock.mockReset();
    decodeFromConstraintsMock.mockReset();
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn() }
    });
  });

  it('verifies manual payload successfully', async () => {
    verifyTicketMock.mockResolvedValue({ data: { ticket_id: 't-100' } });
    const { result } = renderHook(() => useVerifierController());

    act(() => {
      result.current.handleDeviceIdChange('gate-A');
      result.current.handleManualPayloadChange('qr-payload-1');
    });

    await act(async () => {
      result.current.handleManualVerify();
    });

    await waitFor(() => {
      expect(result.current.state.result?.ok).toBe(true);
    });
    expect(verifyTicketMock).toHaveBeenCalledWith({
      qr_payload: 'qr-payload-1',
      device_id: 'gate-A'
    });
    expect(result.current.statusTone).toBe('success');
  });

  it('surfaces verify failures from the API', async () => {
    verifyTicketMock.mockRejectedValue({
      error: { message: '票券已核銷', details: { ticket_id: 't-1' } }
    });
    const { result } = renderHook(() => useVerifierController());

    act(() => {
      result.current.handleDeviceIdChange('gate-A');
      result.current.handleManualPayloadChange('qr-payload-2');
    });

    await act(async () => {
      result.current.handleManualVerify();
    });

    await waitFor(() => {
      expect(result.current.state.error).toContain('票券已核銷');
    });
    expect(result.current.statusTone).toBe('error');
  });

  it('rejects empty manual payload before calling API', async () => {
    const { result } = renderHook(() => useVerifierController());

    act(() => {
      result.current.handleDeviceIdChange('gate-A');
      result.current.handleManualPayloadChange('   ');
    });

    await act(async () => {
      result.current.handleManualVerify();
    });

    await waitFor(() => {
      expect(result.current.state.error).toContain('QR payload');
    });
    expect(verifyTicketMock).not.toHaveBeenCalled();
  });

  it('blocks scan start outside secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    const { result } = renderHook(() => useVerifierController());

    await act(async () => {
      await result.current.handleStartScan();
    });

    expect(result.current.state.error).toContain('HTTPS/localhost');
    expect(decodeFromConstraintsMock).not.toHaveBeenCalled();
  });

  it('starts and stops camera scanning', async () => {
    const stopMock = vi.fn();
    decodeFromConstraintsMock.mockResolvedValue({ stop: stopMock });
    const { result } = renderHook(() => useVerifierController());

    await act(async () => {
      await result.current.handleStartScan();
    });

    expect(result.current.state.scanning).toBe(true);
    expect(decodeFromConstraintsMock).toHaveBeenCalled();

    act(() => {
      result.current.handleStopScan();
    });

    expect(stopMock).toHaveBeenCalled();
    expect(result.current.state.scanning).toBe(false);
  });
});
