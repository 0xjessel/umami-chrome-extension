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
      const expectedUrlPrefix = `${mockConfig.baseUrl}/api/websites/${mockConfig.websiteId}/stats`;
      const urlString = url.toString();
      expect(urlString.startsWith(expectedUrlPrefix)).toBe(true);
      
      // Get the URL parameters
      const urlObj = new URL(urlString);
      const startAt = urlObj.searchParams.get('startAt');
      const endAt = urlObj.searchParams.get('endAt');
      
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
