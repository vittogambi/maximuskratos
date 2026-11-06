export const REFRESH_COOKIE_NAME = 'mk_refresh';

/** The column is required. A session ends when it is revoked, not on this date. */
export const REFRESH_TOKEN_UNTIL = new Date('9999-12-31T00:00:00.000Z');

/** Chrome drops a persistent cookie after about 400 days. The refresh row still ends when it is revoked. */
export const REFRESH_COOKIE_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;

/** Access JWT lifetime. Matches the logout-all contract: issued tokens stay valid until they expire. */
export const ACCESS_TOKEN_TTL = '15m';
