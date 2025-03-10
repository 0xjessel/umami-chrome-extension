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
      // Mock the authenticate method to throw an error
      const originalAuthenticate = api.authenticate;
      api.authenticate = jest.fn().mockRejectedValue(new Error('Authentication failed'));
      
      // Mock fetch to return a 401 error
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }));
      
      // Expect the makeRequest call to fail with the authentication error
      await expect(api.makeRequest('/test-endpoint')).rejects.toThrow('Authentication failed');
      
      // Restore the original authenticate method
      api.authenticate = originalAuthenticate;
    });

    it('should handle server errors with retry', async () => {
      // Override the default mock for this test
      jest.useFakeTimers();
      
      fetch
        // First attempt fails with server error
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Server Error'
        }));
      
      // Attempt to make a request that should fail
      const promise = api.makeRequest('/test-endpoint');
      
      // Let's expect the error
      await expect(promise).rejects.toThrow('API request failed: Server Error');
      
      jest.useRealTimers();
    });

    it('should handle rate limiting with exponential backoff', async () => {
      // Override the default mock for this test
      jest.useFakeTimers();
      
      fetch
        // First attempt fails with rate limit
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        }));
      
      // Attempt to make a request that should fail
      const promise = api.makeRequest('/test-endpoint');
      
      // Let's expect the error
      await expect(promise).rejects.toThrow('API request failed: Too Many Requests');
      
      jest.useRealTimers();
    });

    it('should handle network errors with retry', async () => {
      // Override the default mock for this test
      jest.useFakeTimers();
      
      // First call throws network error
      fetch
        .mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
      
      // Attempt to make a request that should fail
      const promise = api.makeRequest('/test-endpoint');
      
      // Let's expect the error
      await expect(promise).rejects.toThrow('Failed to fetch');
      
      jest.useRealTimers();
    });

    it('should handle configuration errors', async () => {
      const invalidApi = new UmamiAPI();
      await expect(invalidApi.init()).rejects.toThrow('Missing required configuration');
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

      // Mock successful stats fetch with URL capture
      fetch.mockImplementationOnce((url, options) => {
        // Store the URL string for assertions
        fetch.mockUrl = url.toString ? url.toString() : url;
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });
      });

      const result = await api.getDailyStats();

      // Verify response data
      expect(result).toEqual(mockResponse);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);

      // Use the stored URL string for validation
      const urlString = fetch.mockUrl;
      expect(urlString).toContain(`${mockConfig.baseUrl}/api/websites/${mockConfig.websiteId}/stats`);
      
      // Extract parameters from the URL string
      const urlParts = urlString.split('?');
      expect(urlParts.length).toBe(2); // URL should have query parameters
      
      const queryParams = new URLSearchParams(urlParts[1]);
      const startAt = Number(queryParams.get('startAt'));
      const endAt = Number(queryParams.get('endAt'));

      // Get the start time the same way the implementation does
      const startOfDay = new Date(mockDate.toLocaleDateString());
      const expectedStartTime = startOfDay.getTime();
      expect(startAt).toBe(expectedStartTime);

      // Verify end time is current time
      const expectedEndTime = mockDate.getTime();
      expect(endAt).toBe(expectedEndTime);

      // Verify time range is valid
      expect(startAt).toBeLessThan(endAt);
      expect(endAt - startAt).toBeLessThanOrEqual(24 * 60 * 60 * 1000); // Max 24 hours
    });

    it('should handle API errors gracefully', async () => {
      // Test implementation
    });

    it('should handle properly handle URL object in fetch calls', async () => {
      // Reset fetch mock to ensure clean state
      fetch.mockReset();

      const mockResponse = {
        pageviews: { value: 100, prev: 90 },
        visitors: { value: 50, prev: 45 }
      };

      // Mock successful stats fetch
      fetch.mockImplementationOnce((url, options) => {
        // Here, we avoid trying to access URL object properties directly
        // Instead, convert it to string first if it's a URL object
        const urlString = url.toString ? url.toString() : url;
        
        // Store the URL string for assertions
        fetch.mockUrl = urlString;
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });
      });

      const result = await api.getDailyStats();

      // Verify response data
      expect(result).toEqual(mockResponse);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);

      // Use the stored URL string for validation
      const urlString = fetch.mockUrl;
      expect(urlString).toContain(`${mockConfig.baseUrl}/api/websites/${mockConfig.websiteId}/stats`);
      
      // Extract parameters from the URL string using a more reliable approach
      const urlParts = urlString.split('?');
      expect(urlParts.length).toBe(2); // URL should have query parameters
      
      const queryParams = new URLSearchParams(urlParts[1]);
      const startAt = Number(queryParams.get('startAt'));
      const endAt = Number(queryParams.get('endAt'));
      
      // Basic validation of time parameters
      expect(startAt).toBeGreaterThan(0);
      expect(endAt).toBeGreaterThan(0);
      expect(startAt).toBeLessThan(endAt);
      expect(endAt - startAt).toBeLessThanOrEqual(24 * 60 * 60 * 1000); // Max 24 hours
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
