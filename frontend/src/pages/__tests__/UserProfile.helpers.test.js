import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import {
  buildFallbackEventTitle,
  enrichRegistrationsFromNotifications,
  eventTitleFromNotification,
  formatQrCountdown,
  getQrSecondsRemaining,
  normalizeTicketTypeLabel,
  ticketQrModalReducer
} from '../UserProfile';

describe('UserProfile helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T10:00:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes ticket type labels', () => {
    expect(normalizeTicketTypeLabel('成人票')).toBe('成人');
    expect(normalizeTicketTypeLabel('兒童票')).toBe('兒童');
    expect(normalizeTicketTypeLabel('VIP', 'tt-1')).toBe('VIP');
    expect(normalizeTicketTypeLabel('', 'tt-2')).toBe('tt-2');
  });

  it('builds fallback event titles from registration metadata', () => {
    expect(buildFallbackEventTitle({ event_id: 'evt-1' })).toBe('活動 evt-1');
    expect(buildFallbackEventTitle({ session_id: 'sess-1' })).toBe('活動（場次 sess-1）');
    expect(buildFallbackEventTitle({})).toBe('活動資訊待同步');
  });

  it('formats QR countdown states', () => {
    const future = dayjs().add(90, 'second').toISOString();
    expect(getQrSecondsRemaining(future)).toBe(90);
    expect(getQrSecondsRemaining(null)).toBeNull();
    expect(formatQrCountdown(null)).toBe('倒數計算中');
    expect(formatQrCountdown(0)).toBe('更新中');
    expect(formatQrCountdown(125)).toBe('剩餘 2:05');
  });

  it('extracts event titles from notifications', () => {
    expect(eventTitleFromNotification({
      title: '活動取消 — 春季家庭日',
      payload: {}
    })).toBe('春季家庭日');
    expect(eventTitleFromNotification({
      title: '提醒',
      payload: { event_title: '  直接標題  ' }
    })).toBe('直接標題');
    expect(eventTitleFromNotification({ title: '單一標題' })).toBe('單一標題');
  });

  it('enriches registrations using notification payload titles', () => {
    const regs = [{
      id: 'reg-1',
      session_id: 'sess-1',
      created_at: '2026-05-01T10:00:00+08:00'
    }];
    const notifications = [{
      title: '報名成功 — 春季家庭日',
      created_at: '2026-05-01T10:05:00+08:00',
      payload: { registration_id: 'reg-1', session_id: 'sess-1' }
    }];

    const enriched = enrichRegistrationsFromNotifications(regs, notifications);
    expect(enriched[0].event_title).toBe('春季家庭日');
    expect(enrichRegistrationsFromNotifications([], notifications)).toEqual([]);
  });

  it('updates ticket QR modal reducer state', () => {
    const initial = {
      qrData: null,
      qrImageUrl: '',
      qrSecondsRemaining: null,
      fullscreen: false,
      copyingPayload: false
    };
    const loaded = ticketQrModalReducer(initial, {
      type: 'loaded',
      qrData: { qr_payload: 'p1' },
      qrImageUrl: 'data:image/png;base64,abc',
      qrSecondsRemaining: 30
    });
    expect(loaded.qrImageUrl).toContain('data:image');
    expect(ticketQrModalReducer(loaded, { type: 'fullscreenToggled' }).fullscreen).toBe(true);
    expect(ticketQrModalReducer(loaded, { type: 'reset' })).toEqual(initial);
  });
});
