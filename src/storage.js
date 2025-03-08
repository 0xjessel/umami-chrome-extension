import { DEFAULT_POLLING_INTERVAL } from './constants.js';

/**
 * Storage utility for managing extension configuration and preferences
 */
export class StorageManager {
  // Default configuration values
  static DEFAULT_CONFIG = {
    pollingInterval: DEFAULT_POLLING_INTERVAL,
    showActiveUsers: true,
    showPageViews: true,
    showVisitors: true,
    showVisits: true,
    showBounces: false,
    showTotalTime: false,
    badgeMetric: 'visits',
    serverType: 'self-hosted',
    displayName: '',
    cachedMetrics: {
      activeUsers: null,
      pageViews: { value: null, trend: null },
      visitors: { value: null, trend: null },
      visits: { value: null, trend: null },
      bounces: { value: null, trend: null },
      totalTime: { value: null, trend: null },
      lastUpdated: null
    }
  };

  /**
   * Get all configuration values
   */
  static async getConfig() {
    const config = await chrome.storage.sync.get(null);
    return { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Update configuration values
   */
  static async updateConfig(updates) {
    await chrome.storage.sync.set(updates);
    return this.getConfig();
  }

  /**
   * Set Umami credentials
   */
  static async setCredentials({ baseUrl, token, websiteId, username, password }) {
    if (!baseUrl || !token || !websiteId || !username || !password) {
      throw new Error('Missing required credentials');
    }

    // Format the display name from the URL
    const url = new URL(baseUrl.trim());
    const displayName = url.hostname.replace(/^www\./, '');

    await chrome.storage.sync.set({
      serverType: 'self-hosted',
      baseUrl: baseUrl.trim(),
      token: token.trim(),
      websiteId: websiteId.trim(),
      username: username.trim(),
      password: password.trim(),
      displayName
    });
  }

  /**
   * Clear all stored credentials
   */
  static async clearCredentials() {
    await chrome.storage.sync.remove([
      'baseUrl',
      'token',
      'websiteId',
      'username',
      'password'
    ]);
  }

  /**
   * Check if all required credentials are set
   */
  static async hasCredentials() {
    const { baseUrl, token, websiteId, username, password } = await chrome.storage.sync.get([
      'baseUrl',
      'token',
      'websiteId',
      'username',
      'password'
    ]);

    return Boolean(baseUrl && token && websiteId && username && password);
  }

  /**
   * Update UI preferences
   */
  static async updatePreferences({ 
    showActiveUsers,
    showPageViews,
    showVisitors,
    showVisits,
    showBounces,
    showTotalTime,
    badgeMetric,
    pollingInterval
  }) {
    await chrome.storage.sync.set({
      showActiveUsers,
      showPageViews,
      showVisitors,
      showVisits,
      showBounces,
      showTotalTime,
      badgeMetric,
      pollingInterval: pollingInterval ?? DEFAULT_POLLING_INTERVAL
    });
  }

  /**
   * Update cached metrics
   */
  static async updateCachedMetrics(metrics) {
    // Add timestamp to track when the cache was last updated
    const cachedMetrics = {
      ...metrics,
      lastUpdated: new Date().toISOString()
    };
    
    await chrome.storage.sync.set({ cachedMetrics });
    return cachedMetrics;
  }
}
