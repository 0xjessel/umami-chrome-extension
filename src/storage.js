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
    badgeMetric: 'active',
    serverType: 'cloud',
    baseUrl: 'https://cloud.umami.is'
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
  static async setCredentials({ serverType, baseUrl, token, websiteId, apiKey, username, password }) {
    if (!serverType || !token || !websiteId) {
      throw new Error('Missing required credentials');
    }

    // For cloud, always use cloud URL
    if (serverType === 'cloud') {
      if (!apiKey) {
        throw new Error('API key is required for Umami Cloud');
      }
      baseUrl = 'https://cloud.umami.is';
    }

    // For self-hosted, require URL, username, and password
    if (serverType === 'self-hosted') {
      if (!baseUrl) {
        throw new Error('Server URL is required for self-hosted Umami');
      }
      if (!username || !password) {
        throw new Error('Username and password are required for self-hosted Umami');
      }
    }

    await chrome.storage.sync.set({
      serverType,
      baseUrl: baseUrl.trim(),
      token: token.trim(),
      websiteId: websiteId.trim(),
      apiKey: apiKey?.trim(),
      username: username?.trim(),
      password: password?.trim()
    });
  }

  /**
   * Clear all stored credentials
   */
  static async clearCredentials() {
    await chrome.storage.sync.remove([
      'serverType',
      'baseUrl',
      'token',
      'websiteId',
      'apiKey',
      'username',
      'password'
    ]);
  }

  /**
   * Check if all required credentials are set
   */
  static async hasCredentials() {
    const { serverType, baseUrl, token, websiteId, apiKey, username, password } = await chrome.storage.sync.get([
      'serverType',
      'baseUrl',
      'token',
      'websiteId',
      'apiKey',
      'username',
      'password'
    ]);

    const hasBaseCredentials = Boolean(baseUrl && token && websiteId);
    if (!hasBaseCredentials) return false;

    // Check additional credentials based on server type
    if (serverType === 'cloud') {
      return Boolean(apiKey);
    } else if (serverType === 'self-hosted') {
      return Boolean(username && password);
    }

    return false;
  }

  /**
   * Update UI preferences
   */
  static async updatePreferences({ 
    showActiveUsers,
    showPageViews,
    showVisitors,
    badgeMetric,
    pollingInterval
  }) {
    await chrome.storage.sync.set({
      showActiveUsers,
      showPageViews,
      showVisitors,
      badgeMetric,
      pollingInterval: pollingInterval ?? DEFAULT_POLLING_INTERVAL
    });
  }
}
