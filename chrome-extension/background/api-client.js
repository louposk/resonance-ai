class ResonanceAPIClient {
  constructor() {
    // Use production domain by default, can be overridden via storage
    this.baseURL = 'https://resonanceaimusic.com/api';
    this.apiKey = null;
    this.init();
  }

  async init() {
    const result = await chrome.storage.sync.get(['apiKey', 'baseURL']);
    this.apiKey = result.apiKey;
    // Allow override of base URL for development
    if (result.baseURL) {
      this.baseURL = result.baseURL;
    }
  }

  async setApiKey(apiKey) {
    this.apiKey = apiKey;
    await chrome.storage.sync.set({ apiKey });
  }

  async searchSongs(query, platform = 'all') {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = new URL(`${this.baseURL}/songs/search`);
    url.searchParams.set('q', query);
    if (platform !== 'all') {
      url.searchParams.set('platform', platform);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getSongAnalysis(songId) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/songs/${songId}/analysis`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        if (response.status === 404) {
          throw new Error('Song not found');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data.data;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  async createSong(songData) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/songs`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(songData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Song creation failed');
      }

      return data.data;
    } catch (error) {
      console.error('Create song error:', error);
      throw error;
    }
  }

  async isHealthy() {
    try {
      const healthURL = this.baseURL.replace('/api', '/health');
      const response = await fetch(healthURL);
      const data = await response.json();
      return data.success && data.status === 'healthy';
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
}

// Make API client available globally
if (typeof window !== 'undefined') {
  window.ResonanceAPIClient = ResonanceAPIClient;
} else {
  // For service worker context
  self.ResonanceAPIClient = ResonanceAPIClient;
}