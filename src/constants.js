/**
 * Polling intervals in milliseconds
 */
export const POLLING_INTERVALS = {
  THIRTY_SECONDS: 30 * 1000,
  ONE_MINUTE: 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000
};

/**
 * Default polling interval
 */
export const DEFAULT_POLLING_INTERVAL = POLLING_INTERVALS.ONE_MINUTE;
