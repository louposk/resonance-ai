// Enhanced caching utilities for the extension
class ExtensionCache {
  constructor() {
    this.CACHE_PREFIX = 'resonance_cache_';
    this.EXPIRY_SUFFIX = '_expiry';
    this.DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
    this.MAX_CACHE_SIZE = 100; // Maximum number of cached items
  }

  // Generate cache key
  generateKey(type, identifier) {
    return `${this.CACHE_PREFIX}${type}_${identifier}`;
  }

  // Set cache item with TTL
  async set(type, identifier, data, ttl = this.DEFAULT_TTL) {
    try {
      const key = this.generateKey(type, identifier);
      const expiryKey = key + this.EXPIRY_SUFFIX;
      const expiryTime = Date.now() + ttl;

      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };

      await chrome.storage.local.set({
        [key]: cacheData,
        [expiryKey]: expiryTime
      });

      // Clean up old cache if needed
      await this.cleanup();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Get cache item
  async get(type, identifier) {
    try {
      const key = this.generateKey(type, identifier);
      const expiryKey = key + this.EXPIRY_SUFFIX;

      const result = await chrome.storage.local.get([key, expiryKey]);
      const cacheData = result[key];
      const expiryTime = result[expiryKey];

      if (!cacheData || !expiryTime) {
        return null;
      }

      // Check if expired
      if (Date.now() > expiryTime) {
        await this.remove(type, identifier);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Remove cache item
  async remove(type, identifier) {
    try {
      const key = this.generateKey(type, identifier);
      const expiryKey = key + this.EXPIRY_SUFFIX;

      await chrome.storage.local.remove([key, expiryKey]);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  // Clear all cache
  async clear() {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allData).filter(key =>
        key.startsWith(this.CACHE_PREFIX)
      );

      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheEntries = Object.entries(allData).filter(([key]) =>
        key.startsWith(this.CACHE_PREFIX) && !key.endsWith(this.EXPIRY_SUFFIX)
      );

      const stats = {
        totalItems: cacheEntries.length,
        totalSize: 0,
        itemsByType: {},
        oldestItem: null,
        newestItem: null
      };

      for (const [key, data] of cacheEntries) {
        if (data && data.timestamp) {
          stats.totalSize += JSON.stringify(data).length;

          // Extract type from key
          const type = key.replace(this.CACHE_PREFIX, '').split('_')[0];
          stats.itemsByType[type] = (stats.itemsByType[type] || 0) + 1;

          // Track oldest and newest
          if (!stats.oldestItem || data.timestamp < stats.oldestItem.timestamp) {
            stats.oldestItem = { key, timestamp: data.timestamp };
          }
          if (!stats.newestItem || data.timestamp > stats.newestItem.timestamp) {
            stats.newestItem = { key, timestamp: data.timestamp };
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  // Cleanup expired items and enforce size limits
  async cleanup() {
    try {
      const allData = await chrome.storage.local.get(null);
      const now = Date.now();
      const expiredKeys = [];
      const validEntries = [];

      // Find expired items
      for (const [key, value] of Object.entries(allData)) {
        if (key.endsWith(this.EXPIRY_SUFFIX)) {
          if (value < now) {
            // Expired
            expiredKeys.push(key);
            expiredKeys.push(key.replace(this.EXPIRY_SUFFIX, ''));
          }
        } else if (key.startsWith(this.CACHE_PREFIX) && !key.endsWith(this.EXPIRY_SUFFIX)) {
          const expiryKey = key + this.EXPIRY_SUFFIX;
          const expiryTime = allData[expiryKey];

          if (expiryTime && expiryTime >= now) {
            validEntries.push({
              key,
              timestamp: allData[key]?.timestamp || 0,
              data: allData[key]
            });
          }
        }
      }

      // Remove expired items
      if (expiredKeys.length > 0) {
        await chrome.storage.local.remove(expiredKeys);
      }

      // Enforce size limit
      if (validEntries.length > this.MAX_CACHE_SIZE) {
        // Sort by timestamp (oldest first)
        validEntries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest items
        const toRemove = validEntries.slice(0, validEntries.length - this.MAX_CACHE_SIZE);
        const keysToRemove = toRemove.flatMap(entry => [
          entry.key,
          entry.key + this.EXPIRY_SUFFIX
        ]);

        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Preload common searches
  async preloadSearch(query) {
    const cached = await this.get('search', query);
    if (!cached) {
      // This would be called from the background script
      return false;
    }
    return true;
  }

  // Cache song analysis
  async cacheSongAnalysis(songId, analysis) {
    await this.set('analysis', songId, analysis, this.DEFAULT_TTL * 2); // Cache analyses longer
  }

  // Cache search results
  async cacheSearchResults(query, results) {
    await this.set('search', query, results, this.DEFAULT_TTL / 2); // Cache searches shorter
  }

  // Cache song metadata
  async cacheSongMetadata(songId, metadata) {
    await this.set('song', songId, metadata, this.DEFAULT_TTL * 4); // Cache song data longest
  }

  // Get cached song analysis
  async getSongAnalysis(songId) {
    return await this.get('analysis', songId);
  }

  // Get cached search results
  async getSearchResults(query) {
    return await this.get('search', query);
  }

  // Get cached song metadata
  async getSongMetadata(songId) {
    return await this.get('song', songId);
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ExtensionCache = ExtensionCache;
} else {
  self.ExtensionCache = ExtensionCache;
}