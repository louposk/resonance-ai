// Import API client and cache utilities
importScripts('api-client.js', '../utils/cache.js');

// Initialize API client and cache
const apiClient = new self.ResonanceAPIClient();
const cache = new self.ExtensionCache();

// Message handler for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'searchSongs':
        const searchResults = await handleSearchSongs(request.query, request.platform);
        sendResponse({ success: true, data: searchResults });
        break;

      case 'getSongAnalysis':
        const analysis = await handleGetSongAnalysis(request.songId);
        sendResponse({ success: true, data: analysis });
        break;

      case 'createSong':
        const newSong = await handleCreateSong(request.songData);
        sendResponse({ success: true, data: newSong });
        break;

      case 'setApiKey':
        await apiClient.setApiKey(request.apiKey);
        sendResponse({ success: true });
        break;

      case 'getApiKey':
        const result = await chrome.storage.sync.get(['apiKey']);
        sendResponse({ success: true, data: result.apiKey });
        break;

      case 'healthCheck':
        const isHealthy = await apiClient.isHealthy();
        sendResponse({ success: true, data: isHealthy });
        break;

      case 'clearCache':
        await cache.clear();
        sendResponse({ success: true });
        break;

      case 'getCacheStats':
        const stats = await cache.getStats();
        sendResponse({ success: true, data: stats });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Service worker error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSearchSongs(query, platform = 'all') {
  const cacheKey = `${query}:${platform}`;

  // Check cache first
  const cachedResult = await cache.getSearchResults(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Make API call
  const results = await apiClient.searchSongs(query, platform);

  // Cache results
  await cache.cacheSearchResults(cacheKey, results);

  return results;
}

async function handleGetSongAnalysis(songId) {
  // Check cache first
  const cachedResult = await cache.getSongAnalysis(songId);
  if (cachedResult) {
    return cachedResult;
  }

  // Make API call
  const analysis = await apiClient.getSongAnalysis(songId);

  // Cache analysis
  await cache.cacheSongAnalysis(songId, analysis);

  return analysis;
}

async function handleCreateSong(songData) {
  // Create song and get analysis
  const result = await apiClient.createSong(songData);

  // Cache the song and analysis if available
  if (result.song) {
    const searchKey = `${result.song.title} ${result.song.artist}:all`;
    await cache.cacheSearchResults(searchKey, [result.song]);

    // Cache song metadata
    await cache.cacheSongMetadata(result.song.id, result.song);

    if (result.analysis) {
      await cache.cacheSongAnalysis(result.song.id, { song: result.song, analysis: result.analysis });
    }
  }

  return result;
}

// Install and activate event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log('Resonance AI Extension installed');
  // Initialize cache cleanup on install
  cache.cleanup();
});

// Clean up cache periodically
setInterval(async () => {
  try {
    await cache.cleanup();
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}, 15 * 60 * 1000); // Clean every 15 minutes