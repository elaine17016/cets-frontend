import { describe, expect, it, vi } from 'vitest';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } })
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 0 })
}));

vi.mock('../../api/client', () => ({
  apiClient: {}
}));

vi.mock('recharts', () => ({}));

import {
  adminStateReducer,
  createDefaultCreateValues,
  mergeDashboardSessionsLottery,
  normalizeCoverImageUrlForBackend,
  normalizeSessionsLotteryRows,
  resolveSessionTicketFields,
  stripEligibilityMarkerForBackend
} from '../AdminConsolePage';

describe('AdminConsole helpers', () => {
  it('normalizes dashboard lottery session rows', () => {
    expect(normalizeSessionsLotteryRows(null)).toEqual([]);
    expect(normalizeSessionsLotteryRows([
      { id: 'sess-1', title: '第一場', lottery_at: '2026-06-01', pending_count: 3 },
      { session_id: '', title: 'skip me' }
    ])).toEqual([
      {
        session_id: 'sess-1',
        title: '第一場',
        lottery_at: '2026-06-01',
        lottery_executed_at: null,
        registered_pending: 3
      }
    ]);
  });

  it('merges dashboard lottery rows from event detail when dashboard is sparse', () => {
    const fromDash = mergeDashboardSessionsLottery({
      sessions_lottery: [{ session_id: 's1', title: 'A' }]
    }, null);
    expect(fromDash).toHaveLength(1);

    const fromEvent = mergeDashboardSessionsLottery({}, {
      sessions: [{ id: 's2', title: 'B', lottery_at: '2026-06-02' }]
    });
    expect(fromEvent[0].session_id).toBe('s2');
  });

  it('creates default event form values', () => {
    const values = createDefaultCreateValues();
    expect(values.title).toContain('家庭日');
    expect(values.sessions).toHaveLength(1);
    expect(values.allowed_sites).toEqual(['HSINCHU']);
  });

  it('updates admin state through reducer', () => {
    const initial = { loading: false, events: [] };
    expect(adminStateReducer(initial, { type: 'set', key: 'loading', value: true }).loading).toBe(true);
    expect(adminStateReducer(initial, {
      type: 'set',
      key: 'events',
      value: (current) => [...current, { id: 'evt-1' }]
    }).events).toEqual([{ id: 'evt-1' }]);
  });

  it('normalizes cover image URLs and strips eligibility markers', () => {
    expect(normalizeCoverImageUrlForBackend(' /image/event_1.webp ')).toBe('/image/event_1.webp');
    expect(normalizeCoverImageUrlForBackend('   ')).toBeNull();
    expect(stripEligibilityMarkerForBackend('Hello <!--CETS_ELIGIBILITY:{}--> World')).toBe('Hello  World');
    expect(stripEligibilityMarkerForBackend('Plain description')).toBe('Plain description');
  });

  it('resolves adult and child ticket fields from session ticket types', () => {
    const resolved = resolveSessionTicketFields({
      ticket_types: [
        { name: '成人票', audience: 'EMPLOYEE', id: 'adult' },
        { name: '兒童票', audience: 'DEPENDENT', id: 'child' }
      ]
    });
    expect(resolved.adultTicket.id).toBe('adult');
    expect(resolved.childTicket.id).toBe('child');
  });
});
