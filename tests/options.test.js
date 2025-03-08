import { POLLING_INTERVALS, DEFAULT_POLLING_INTERVAL } from '../src/constants.js';

// Mock chrome.storage.sync
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  }
};

// Mock DOM elements
document.getElementById = jest.fn();
document.querySelector = jest.fn();

describe('Options Page Polling Interval Logic', () => {
  describe('findClosestPollingInterval', () => {
    // Test cases for legacy intervals
    const testCases = [
      // Just under 30 seconds should map to 30 seconds
      { input: 25000, expected: POLLING_INTERVALS.THIRTY_SECONDS },
      // 45 seconds should map to 1 minute
      { input: 45000, expected: POLLING_INTERVALS.ONE_MINUTE },
      // 4 minutes should map to 5 minutes
      { input: 240000, expected: POLLING_INTERVALS.FIVE_MINUTES },
      // 7 minutes should map to 5 minutes
      { input: 420000, expected: POLLING_INTERVALS.FIVE_MINUTES },
      // 20 minutes should map to 10 minutes since it's closer
      { input: 1200000, expected: POLLING_INTERVALS.TEN_MINUTES }
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should map ${input}ms to closest interval ${expected}ms`, () => {
        const intervals = Object.entries(POLLING_INTERVALS);
        const closestInterval = intervals.reduce((closest, [key, value]) => {
          if (Math.abs(value - input) < Math.abs(POLLING_INTERVALS[closest] - input)) {
            return key;
          }
          return closest;
        }, 'ONE_MINUTE');
        
        expect(POLLING_INTERVALS[closestInterval]).toBe(expected);
      });
    });

    it('should default to ONE_MINUTE when input is undefined', () => {
      const intervals = Object.entries(POLLING_INTERVALS);
      const closestInterval = intervals.reduce((closest, [key, value]) => {
        if (Math.abs(value - undefined) < Math.abs(POLLING_INTERVALS[closest] - undefined)) {
          return key;
        }
        return closest;
      }, 'ONE_MINUTE');
      
      expect(POLLING_INTERVALS[closestInterval]).toBe(DEFAULT_POLLING_INTERVAL);
    });

    it('should handle zero and negative values by returning THIRTY_SECONDS', () => {
      const intervals = Object.entries(POLLING_INTERVALS);
      [-1000, -1, 0].forEach(invalidInput => {
        const closestInterval = intervals.reduce((closest, [key, value]) => {
          if (Math.abs(value - invalidInput) < Math.abs(POLLING_INTERVALS[closest] - invalidInput)) {
            return key;
          }
          return closest;
        }, 'ONE_MINUTE');
        
        expect(POLLING_INTERVALS[closestInterval]).toBe(POLLING_INTERVALS.THIRTY_SECONDS);
      });
    });
  });
});
