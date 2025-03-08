import { UmamiAPI, AuthenticationError, ConfigurationError, NetworkError } from '../src/api.js';

describe('UmamiAPI', () => {
  let api;
  const mockConfig = {
    baseUrl: 'https://analytics.example.com',
    token: 'test-token',
    websiteId: 'test-website-id',
    username: 'test-user',
    password: 'test-pass'
  };

  beforeEach(() => {
    jest.setTimeout(10000); // Increase timeout for all tests
    api = new UmamiAPI();
    api.serverType = 'self-hosted';
    api.baseUrl = mockConfig.baseUrl;
    api.token = mockConfig.token;
    api.websiteId = mockConfig.websiteId;
    api.username = mockConfig.username;
    api.password = mockConfig.password;
    fetch.mockReset();
    // Mock successful auth by default
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token' })
      })
    );
  });

  describe('init', () => {
    it('should initialize with valid configuration', async () => {
      const testApi = new UmamiAPI();
      testApi.serverType = 'self-hosted';
      testApi.baseUrl = mockConfig.baseUrl;
      testApi.token = mockConfig.token;
      testApi.websiteId = mockConfig.websiteId;
      testApi.username = mockConfig.username;
      testApi.password = mockConfig.password;
      await testApi.init();
      expect(testApi.baseUrl).toBe(mockConfig.baseUrl);
      expect(testApi.token).toBe(mockConfig.token);
      expect(testApi.websiteId).toBe(mockConfig.websiteId);
    });

    it('should throw error if configuration is missing', async () => {
      const testApi = new UmamiAPI();
      await expect(testApi.init()).rejects.toThrow('Missing required configuration');
    });
  });

  describe('makeRequest', () => {
    beforeEach(async () => {
      await api.init();
    });

    it('should make authenticated request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      await api.makeRequest('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          }
        })
      );
    });

    it('should handle 401 unauthorized error with custom error class', async () => {
      // Override the default mock for this test
      fetch.mockReset();
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        })
      );
      // Mock the authentication attempt to also fail
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        })
      );

      try {
        await api.makeRequest('/test-endpoint');
        fail('Expected makeRequest to throw UmamiError');
      } catch (error) {
        expect(error).toBeInstanceOf(UmamiError);
        expect(error.code).toBe('HTTP_401');
        expect(error.message).toContain('Authentication failed');
      }
    });

    it('should handle server errors with retry', async () => {

      jest.useFakeTimers();

      // First call returns 500
      fetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Server Error'
        }))
        // Second call succeeds
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }));

      const requestPromise = api.makeRequest('/test-endpoint');
      // Run all timers
      await jest.runAllTimersAsync();
      const result = await requestPromise;

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle rate limiting with exponential backoff', async () => {

      jest.useFakeTimers();

      // First two calls return 429 (rate limit)
      fetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        }))
        // Third call succeeds
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }));

      const requestPromise = api.makeRequest('/test-endpoint');
      // Run all timers
      await jest.runAllTimersAsync();
      const result = await requestPromise;

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it('should handle network errors with retry', async () => {

      jest.useFakeTimers();

      // First call throws network error
      fetch
        .mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
        // Second call succeeds
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }));

      const requestPromise = api.makeRequest('/test-endpoint');
      // Run all timers
      await jest.runAllTimersAsync();
      const result = await requestPromise;

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle configuration errors', async () => {
      const invalidApi = new UmamiAPI();
      await expect(invalidApi.init()).rejects.toThrow(ConfigurationError);
      await expect(invalidApi.init()).rejects.toHaveProperty('code', 'CONFIGURATION_ERROR');
    });
  });

  describe('getActiveUsers', () => {
    beforeEach(async () => {
      await api.init();
    });

    it('should return active users count', async () => {
      const mockResponse = { x: 42 };
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await api.getActiveUsers();
      expect(result).toBe(42);
      const expectedUrl = new URL(`${mockConfig.baseUrl}/api/websites/${mockConfig.websiteId}/active`);
      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.any(Object)
      );
    });
  });

  describe('getDailyStats', () => {
    let mockDate;

    beforeEach(async () => {
      await api.init();
      // Mock the Date constructor to return a fixed time
      mockDate = new Date('2025-03-08T01:05:34-08:00');
      const realDate = global.Date;
      jest.spyOn(global, 'Date').mockImplementation((arg) => {
        if (arg) {
          return new realDate(arg);
        }
        return mockDate;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch daily statistics with correct URL and parameters', async () => {
      // Reset fetch mock to ensure clean state
      fetch.mockReset();

      const mockResponse = {
        pageviews: { value: 100, prev: 90 },
        visitors: { value: 50, prev: 45 }
      };

      // Mock successful stats fetch
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await api.getDailyStats();

      // Verify response data
      expect(result).toEqual(mockResponse);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);

      // Get and verify the request URL
      const [[requestUrl]] = fetch.mock.calls;
      const url = new URL(requestUrl);
      expect(url.pathname).toBe(`/api/websites/${mockConfig.websiteId}/stats`);

      // Verify time parameters
      const startAt = Number(url.searchParams.get('startAt'));
      const endAt = Number(url.searchParams.get('endAt'));

      // Verify start time is midnight of the current day
      const expectedStartTime = new Date('2025-03-08T00:00:00-08:00').getTime();
      expect(startAt).toBe(expectedStartTime);

      // Verify end time is current time
      const expectedEndTime = mockDate.getTime();
      expect(endAt).toBe(expectedEndTime);

      // Verify time range is valid
      expect(startAt).toBeLessThan(endAt);
      expect(endAt - startAt).toBeLessThanOrEqual(24 * 60 * 60 * 1000); // Max 24 hours
    });

    it('should handle API errors gracefully', async () => {

      import { UmamiAPI } from '../src/api.js';

      describe('UmamiAPI', () => {
        let api;
        const mockConfig = {
          baseUrl: 'https://analytics.example.com',
          token: 'test-token',
          websiteId: 'test-website-id',
          username: 'test-user',
          password: 'test-pass'
        };

        beforeEach(() => {
          api = new UmamiAPI();
          api.serverType = 'self-hosted';
          api.baseUrl = mockConfig.baseUrl;
          api.token = mockConfig.token;
          api.websiteId = mockConfig.websiteId;
          api.username = mockConfig.username;
          api.password = mockConfig.password;
          fetch.mockReset();
          // Mock successful auth by default
          fetch.mockImplementation(() =>
            Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ token: 'test-token' })
            })
          );
        });

        describe('init', () => {
          it('should initialize with valid configuration', async () => {
            const testApi = new UmamiAPI();
            testApi.serverType = 'self-hosted';
            testApi.baseUrl = mockConfig.baseUrl;
            testApi.token = mockConfig.token;
            testApi.websiteId = mockConfig.websiteId;
            testApi.username = mockConfig.username;
            testApi.password = mockConfig.password;
            await testApi.init();
            expect(testApi.baseUrl).toBe(mockConfig.baseUrl);
            expect(testApi.token).toBe(mockConfig.token);
            expect(testApi.websiteId).toBe(mockConfig.websiteId);
          });

          it('should throw error if configuration is missing', async () => {
            const testApi = new UmamiAPI();
            await expect(testApi.init()).rejects.toThrow('Missing required configuration');
          });
        });

        describe('makeRequest', () => {
          beforeEach(async () => {
            await api.init();
          });

          it('should make authenticated request with correct headers', async () => {
            const mockResponse = { data: 'test' };
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
              })
            );

            await api.makeRequest('/test-endpoint');

            expect(fetch).toHaveBeenCalledWith(
              expect.any(URL),
              expect.objectContaining({
                headers: {
                  'Authorization': 'Bearer test-token',
                  'Accept': 'application/json'
                }
              })
            );
          });

          it('should handle 401 unauthorized error', async () => {
            // Override the default mock for this test
            fetch.mockReset();
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
              })
            );
            // Mock the authentication attempt to also fail
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
              })
            );

            await expect(api.makeRequest('/test-endpoint'))
              .rejects
              .toThrow('Authentication failed');
          });

          it('should handle general API errors', async () => {
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Server Error'
              })
            );

            await expect(api.makeRequest('/test-endpoint'))
              .rejects
              .toThrow('API request failed: Server Error');
          });
        });

        describe('getActiveUsers', () => {
          beforeEach(async () => {
            await api.init();
          });

          it('should return active users count', async () => {
            const mockResponse = { x: 42 };
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
              })
            );

            const result = await api.getActiveUsers();
            expect(result).toBe(42);
            const expectedUrl = new URL(`${mockConfig.baseUrl}/api/websites/${mockConfig.websiteId}/active`);
            expect(fetch).toHaveBeenCalledWith(
              expectedUrl,
              expect.any(Object)
            );
          });
        });

        describe('getDailyStats', () => {
          beforeEach(async () => {
            await api.init();
            // Mock the Date constructor to return a fixed time (1:05:34 AM PST on March 8, 2025)
            const mockDate = new Date('2025-03-08T01:05:34-08:00');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
          });

          afterEach(() => {
            jest.restoreAllMocks();
          });

          // TODO: Fix this test - URL comparison is failing, need to investigate how fetch mock
          // handles URL objects vs strings and ensure proper URL formatting for stats endpoint
          it('should fetch daily statistics with correct time range', async () => {
            const mockResponse = {
              pageviews: { value: 100, prev: 90 },
              visitors: { value: 50, prev: 45 }
            };
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
              })
            );

            const result = await api.getDailyStats();
            expect(result).toEqual(mockResponse);

            // Get the URL from the fetch call
            const [[url]] = fetch.mock.calls;

            // Compare the pathname part of the URL
            const expectedPathname = `/api/websites/${mockConfig.websiteId}/stats`;
            expect(url.pathname).toBe(expectedPathname);

            // Get the URL parameters
            const startAt = url.searchParams.get('startAt');
            const endAt = url.searchParams.get('endAt');

            // Start of day should be 12:00:00 AM PST on March 8, 2025
            const expectedStartTime = new Date('2025-03-08T00:00:00-08:00').getTime();
            // Current time should be 1:05:34 AM PST on March 8, 2025
            const expectedEndTime = new Date('2025-03-08T01:05:34-08:00').getTime();

            expect(Number(startAt)).toBe(expectedStartTime);
            expect(Number(endAt)).toBe(expectedEndTime);
            expect(Number(startAt)).toBeLessThan(Number(endAt));
          });
        });

        describe('verifyAuth', () => {
          beforeEach(async () => {
            await api.init();
          });

          it('should return true for valid authentication', async () => {
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: true,
                json: () => Promise.resolve({})
              })
            );

            const result = await api.verifyAuth();
            expect(result).toBe(true);
          });

          it('should return false for invalid authentication', async () => {
            // Override the default mock for this test
            fetch.mockReset();
            fetch.mockImplementationOnce(() =>
              Promise.resolve({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
              })
            );

            const result = await api.verifyAuth();
            expect(result).toBe(false);
          });
        });
      });
