import { describe, expect, it } from 'vitest';
import {
  eventDetailPageReducer,
  getDefaultTicketType,
  getTicketAudienceLabel,
  isAlreadyRegisteredError,
  registrationDialogReducer,
  registrationErrMsg,
  stripEligibilityMarkerFromDescription
} from '../EventDetail';

describe('EventDetail helpers', () => {
  it('formats registration errors', () => {
    expect(registrationErrMsg({ error: { message: '名額已滿' } })).toBe('名額已滿');
    expect(isAlreadyRegisteredError({ error: { code: 'ALREADY_REGISTERED' } })).toBe(true);
    expect(isAlreadyRegisteredError({ detail: '已報名此場次' })).toBe(true);
  });

  it('labels ticket audiences and picks defaults', () => {
    expect(getTicketAudienceLabel({ audience: 'EMPLOYEE', name: '成人票' })).toBe('成人');
    expect(getTicketAudienceLabel({ audience: 'DEPENDENT', name: '兒童票' })).toBe('兒童');
    expect(getDefaultTicketType([
      { id: 'child', name: '兒童票', audience: 'DEPENDENT' },
      { id: 'adult', name: '成人票', audience: 'EMPLOYEE' }
    ]).id).toBe('adult');
  });

  it('strips hidden eligibility markers from descriptions', () => {
    expect(stripEligibilityMarkerFromDescription('Hello <!--CETS_ELIGIBILITY:{}--> World')).toBe('Hello\nWorld');
    expect(stripEligibilityMarkerFromDescription('Plain text')).toBe('Plain text');
  });

  it('manages registration dialog reducer state', () => {
    const opened = registrationDialogReducer({
      open: false,
      registering: false,
      session: null,
      ticketType: null,
      ticketTypes: [],
      eligibilityConfirmed: false
    }, {
      type: 'open',
      session: { id: 'sess-1' },
      ticketTypes: [{ id: 'tt-1', name: '成人票', audience: 'EMPLOYEE' }],
      ticketType: { id: 'tt-1', name: '成人票', audience: 'EMPLOYEE' }
    });
    expect(opened.open).toBe(true);
    expect(opened.ticketType.id).toBe('tt-1');

    const confirmed = registrationDialogReducer(opened, { type: 'set_confirmed', value: true });
    expect(confirmed.eligibilityConfirmed).toBe(true);
    expect(registrationDialogReducer(confirmed, { type: 'close' }).open).toBe(false);
  });

  it('merges event detail page state patches', () => {
    expect(eventDetailPageReducer({ loading: false, error: '' }, { loading: true })).toMatchObject({
      loading: true,
      error: ''
    });
  });
});
