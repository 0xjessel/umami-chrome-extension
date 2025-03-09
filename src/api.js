/**
 * Umami Analytics API Client
 * Handles all API interactions with self-hosted Umami server
 */
export class UmamiAPI {
  constructor() {
    this.baseUrl = '';
    this.token = '';
    this.websiteId = '';
    this.username = '';
    this.password = '';
  }

  /**
   * Initialize the API client with stored configuration
   */
  async init() {
    if (!this.baseUrl || !this.websiteId) {
      throw new Error('Missing required configuration. Please check extension settings.');
    }

    // Get a new token if we don't have one or the current one is invalid
    if (!this.token || !await this.verifyAuth()) {
      if (!this.username || !this.password) {
        throw new Error('Missing credentials for self-hosted server.');
      }
      await this.authenticate();
    }
  }

  /**
   * Authenticate with self-hosted Umami server
   */
  async authenticate() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Please check your credentials.');
      }

      const data = await response.json();
      this.token = data.token;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API request
   */
  async makeRequest(endpoint, params = {}, options = {}) {
    // Ensure endpoint starts with /api/
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;
    const url = new URL(`${this.baseUrl}${apiEndpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      // Convert all values to strings to ensure proper URL parameter encoding
      url.searchParams.append(key, value.toString());
    });

    try {
      const headers = {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to re-authenticate and retry the request
          await this.authenticate();
          return this.makeRequest(endpoint, params, options);
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get number of active users in last 5 minutes
   */
  async getActiveUsers() {
    const endpoint = `/api/websites/${this.websiteId}/active`;
    const data = await this.makeRequest(endpoint);
    
    // Handle all possible response formats in a robust way
    try {
      // Case 1: Direct number response
      if (typeof data === 'number') {
        return data;
      }
      
      // Case 2: String that can be parsed as number
      if (typeof data === 'string' && !isNaN(Number(data))) {
        return Number(data);
      }
      
      // Case 3: Object with a 'visitors' property (observed format)
      if (data && typeof data === 'object' && 'visitors' in data) {
        const visitors = data.visitors;
        if (typeof visitors === 'number') {
          return visitors;
        }
        if (typeof visitors === 'string' && !isNaN(Number(visitors))) {
          return Number(visitors);
        }
      }
      
      // Case 4: Object with an 'x' property (alternative format)
      if (data && typeof data === 'object' && 'x' in data) {
        const x = data.x;
        if (typeof x === 'number') {
          return x;
        }
        if (typeof x === 'string' && !isNaN(Number(x))) {
          return Number(x);
        }
      }
      
      // Case 5: Look for the first numeric property in the response
      if (data && typeof data === 'object') {
        for (const key in data) {
          const value = data[key];
          if (typeof value === 'number') {
            return value;
          }
          if (typeof value === 'string' && !isNaN(Number(value))) {
            return Number(value);
          }
        }
      }
      
      // Fallback for unexpected formats
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get daily statistics including pageviews, visitors, and sessions
   */
  async getDailyStats() {
    const now = new Date();
    // Create a date at local midnight for the current day
    const startOfDay = new Date(now.toLocaleDateString());

    return await this.makeRequest(`/api/websites/${this.websiteId}/stats`, {
      startAt: startOfDay.getTime(),
      endAt: now.getTime()
    });
  }

  /**
   * Verify if the current token is valid
   */
  async verifyAuth() {
    try {
      await this.makeRequest('/api/auth/verify');
      return true;
    } catch {
      return false;
    }
  }
}
