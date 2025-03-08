// Mock Chrome Extension API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock URL API
global.URL = class URL {
  constructor(url) {
    this.url = url;
    this.searchParams = new URLSearchParams();
  }
  toString() {
    const params = this.searchParams.toString();
    return params ? `${this.url}?${params}` : this.url;
  }
};
