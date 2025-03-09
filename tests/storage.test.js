import { StorageManager } from '../src/storage.js';
import { POLLING_INTERVALS, DEFAULT_POLLING_INTERVAL } from '../src/constants.js';

describe('StorageManager', () => {
  beforeEach(() => {
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset();
    chrome.storage.sync.remove.mockReset();
  });

  describe('getConfig', () => {
    it('should return default config when storage is empty', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const config = await StorageManager.getConfig();
      expect(config).toEqual(StorageManager.DEFAULT_CONFIG);
    });

    it('should merge stored config with defaults', async () => {
      const storedConfig = {
        pollingInterval: POLLING_INTERVALS.TEN_MINUTES,
        showActiveUsers: false
      };
      chrome.storage.sync.get.mockResolvedValue(storedConfig);
      
      const config = await StorageManager.getConfig();
      expect(config).toEqual({
        ...StorageManager.DEFAULT_CONFIG,
        ...storedConfig
      });
    });
  });

  describe('updateConfig', () => {
    it('should update config and return merged result', async () => {
      const updates = {
        showActiveUsers: false,
        badgeMetric: 'views'
      };
      
      chrome.storage.sync.set.mockResolvedValue();
      chrome.storage.sync.get.mockResolvedValue(updates);

      const result = await StorageManager.updateConfig(updates);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(updates);
      expect(result).toEqual({
        ...StorageManager.DEFAULT_CONFIG,
        ...updates
      });
    });
  });

  describe('setCredentials', () => {
    const validCredentials = {
      baseUrl: 'https://analytics.example.com',
      token: 'test-token',
      websiteId: 'test-website-id',
      username: 'test-user',
      password: 'test-pass'
    };

    it('should store valid credentials', async () => {
      await StorageManager.setCredentials(validCredentials);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        serverType: 'self-hosted',
        baseUrl: validCredentials.baseUrl,
        token: validCredentials.token,
        websiteId: validCredentials.websiteId,
        username: validCredentials.username,
        password: validCredentials.password,
        displayName: 'analytics.example.com'
      });
    });

    it('should trim credential values', async () => {
      const untrimmedCredentials = {
        baseUrl: '  https://analytics.example.com  ',
        token: '  test-token  ',
        websiteId: '  test-website-id  ',
        username: '  test-user  ',
        password: '  test-pass  '
      };

      await StorageManager.setCredentials(untrimmedCredentials);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        serverType: 'self-hosted',
        baseUrl: untrimmedCredentials.baseUrl.trim(),
        token: untrimmedCredentials.token.trim(),
        websiteId: untrimmedCredentials.websiteId.trim(),
        username: untrimmedCredentials.username.trim(),
        password: untrimmedCredentials.password.trim(),
        displayName: 'analytics.example.com'
      });
    });

    it('should throw error for missing credentials', async () => {
      const invalidCredentials = {
        baseUrl: 'https://analytics.example.com',
        // missing token, websiteId, username, and password
      };

      await expect(StorageManager.setCredentials(invalidCredentials))
        .rejects
        .toThrow('Missing required credentials');
    });
  });

  describe('clearCredentials', () => {
    it('should remove all credentials from storage', async () => {
      await StorageManager.clearCredentials();
      
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith([
        'baseUrl',
        'token',
        'websiteId',
        'username',
        'password'
      ]);
    });
  });

  describe('hasCredentials', () => {
    it('should return true when all credentials exist', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        baseUrl: 'https://analytics.example.com',
        token: 'test-token',
        websiteId: 'test-website-id',
        username: 'test-user',
        password: 'test-pass'
      });

      const result = await StorageManager.hasCredentials();
      expect(result).toBe(true);
    });

    it('should return false when any credential is missing', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        baseUrl: 'https://analytics.example.com',
        token: 'test-token',
        websiteId: 'test-website-id',
        username: 'test-user'
        // missing password
      });

      const result = await StorageManager.hasCredentials();
      expect(result).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should update UI preferences', async () => {
      const preferences = {
        showActiveUsers: false,
        showPageViews: true,
        showVisitors: false,
        badgeMetric: 'views',
        pollingInterval: POLLING_INTERVALS.TEN_MINUTES
      };

      await StorageManager.updatePreferences(preferences);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(preferences);
    });

    it('should use default polling interval when not specified', async () => {
      const preferences = {
        showActiveUsers: false,
        showPageViews: true,
        showVisitors: false,
        badgeMetric: 'views',
        pollingInterval: undefined
      };

      await StorageManager.updatePreferences(preferences);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        ...preferences,
        pollingInterval: DEFAULT_POLLING_INTERVAL
      });
    });
  });

  describe('getConfig with polling intervals', () => {
    it('should use default polling interval when storage is empty', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const config = await StorageManager.getConfig();
      expect(config.pollingInterval).toBe(DEFAULT_POLLING_INTERVAL);
    });

    it('should accept any valid polling interval from storage', async () => {
      const storedConfig = {
        pollingInterval: POLLING_INTERVALS.THIRTY_SECONDS
      };
      chrome.storage.sync.get.mockResolvedValue(storedConfig);
      
      const config = await StorageManager.getConfig();
      expect(config.pollingInterval).toBe(POLLING_INTERVALS.THIRTY_SECONDS);
    });

    it('should preserve exact polling interval from storage', async () => {
      // Test with a non-standard interval that doesn't match our constants
      const customInterval = 123456; // Some arbitrary value
      const storedConfig = {
        pollingInterval: customInterval
      };
      chrome.storage.sync.get.mockResolvedValue(storedConfig);
      
      const config = await StorageManager.getConfig();
      expect(config.pollingInterval).toBe(customInterval);
    });
  });
});
