import { describe, expect, it } from 'vitest';
import {
  EVENT_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  ROLE_LABELS,
  SESSION_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  labelOr
} from '../labels';

describe('label maps', () => {
  it('exposes expected status labels', () => {
    expect(EVENT_STATUS_LABELS.PUBLISHED).toBe('已發布');
    expect(SESSION_STATUS_LABELS.LOTTERY_COMPLETED).toBe('抽籤已完成');
    expect(REGISTRATION_STATUS_LABELS.CONFIRMED).toBe('已確認');
    expect(TICKET_STATUS_LABELS.ISSUED).toBe('已發行');
    expect(ROLE_LABELS.ADMIN).toBe('管理員');
    expect(NOTIFICATION_TYPE_LABELS.EVENT_CANCELLED).toBe('活動取消');
  });

  it('returns mapped labels or sensible fallbacks', () => {
    expect(labelOr(EVENT_STATUS_LABELS, 'DRAFT', '未知')).toBe('草稿');
    expect(labelOr(EVENT_STATUS_LABELS, 'UNKNOWN', '未知')).toBe('未知');
    expect(labelOr(EVENT_STATUS_LABELS, 'UNKNOWN', null)).toBe('UNKNOWN');
    expect(labelOr(EVENT_STATUS_LABELS, null, '預設')).toBe('預設');
  });
});
