import { describe, expect, it } from 'vitest';
import {
  extractCancellationReason,
  shouldShowCancellationReasonLine
} from '../notificationDisplay';

describe('notificationDisplay helpers', () => {
  it('extracts cancellation reason from common payload keys', () => {
    expect(extractCancellationReason({ payload: { reason: '  天候因素  ' } })).toBe('天候因素');
    expect(extractCancellationReason({ payload: { cancel_reason: '場地問題' } })).toBe('場地問題');
    expect(extractCancellationReason({ payload: { cancellation_reason: '延期' } })).toBe('延期');
    expect(extractCancellationReason({ payload: { revoke_reason: '撤銷' } })).toBe('撤銷');
    expect(extractCancellationReason({ payload: {} })).toBe('');
    expect(extractCancellationReason(null)).toBe('');
  });

  it('decides whether to show an extra cancellation reason line', () => {
    expect(shouldShowCancellationReasonLine({ type: 'REGISTRATION_CONFIRMED' })).toBe(false);
    expect(shouldShowCancellationReasonLine({ type: 'EVENT_CANCELLED', payload: {} })).toBe(false);
    expect(shouldShowCancellationReasonLine({
      type: 'EVENT_CANCELLED',
      payload: { reason: '颱風' },
      body: '活動已取消'
    })).toBe(true);
    expect(shouldShowCancellationReasonLine({
      type: 'EVENT_CANCELLED',
      payload: { reason: '颱風' },
      body: '活動已取消，原因：颱風'
    })).toBe(false);
  });
});
