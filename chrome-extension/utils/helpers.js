// Utility functions for the extension

function extractSongInfo(title) {
  // Common patterns for YouTube music video titles
  const patterns = [
    // "Artist - Song" or "Artist: Song"
    /^(.+?)\s*[-:]\s*(.+?)(?:\s*\(.*\)|\s*\[.*\]|$)/,
    // "Song by Artist" or "Song - Artist"
    /^(.+?)\s+(?:by|ft\.?|feat\.?|featuring)\s+(.+?)(?:\s*\(.*\)|\s*\[.*\]|$)/i,
    // "Song (Official Music Video)" - extract just song
    /^(.+?)\s*\((?:official|music|video|mv|lyric|audio).*\)$/i,
    // Just the title if no clear pattern
    /^(.+?)$/
  ];

  let artist = '';
  let song = '';

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      if (pattern.source.includes('by|ft')) {
        // Pattern with "by" - first group is song, second is artist
        song = match[1].trim();
        artist = match[2].trim();
      } else if (match.length === 3) {
        // Pattern with separator - first group is artist, second is song
        artist = match[1].trim();
        song = match[2].trim();
      } else {
        // Single group - treat as song title
        song = match[1].trim();
      }
      break;
    }
  }

  // Clean up common suffixes
  const cleanSuffixes = [
    /\s*\(official\s*(music\s*)?video\)/i,
    /\s*\(music\s*video\)/i,
    /\s*\(official\)/i,
    /\s*\(lyric\s*video\)/i,
    /\s*\(audio\)/i,
    /\s*\[official\]/i,
    /\s*\[music\s*video\]/i,
    /\s*-\s*official/i
  ];

  cleanSuffixes.forEach(suffix => {
    song = song.replace(suffix, '');
    artist = artist.replace(suffix, '');
  });

  return {
    artist: artist.trim(),
    song: song.trim()
  };
}

function isLikelyMusicVideo(title, channelName) {
  const musicKeywords = [
    'official', 'music', 'video', 'song', 'audio', 'lyric', 'acoustic',
    'live', 'performance', 'cover', 'remix', 'feat', 'ft', 'featuring'
  ];

  const nonMusicKeywords = [
    'gameplay', 'review', 'reaction', 'tutorial', 'interview', 'podcast',
    'vlog', 'news', 'trailer', 'behind the scenes', 'making of'
  ];

  const titleLower = title.toLowerCase();
  const channelLower = channelName.toLowerCase();

  // Check for non-music keywords first
  if (nonMusicKeywords.some(keyword => titleLower.includes(keyword))) {
    return false;
  }

  // Check for music keywords
  if (musicKeywords.some(keyword => titleLower.includes(keyword))) {
    return true;
  }

  // Check channel indicators
  const musicChannelKeywords = [
    'records', 'music', 'entertainment', 'official', 'vevo'
  ];

  if (musicChannelKeywords.some(keyword => channelLower.includes(keyword))) {
    return true;
  }

  // Check for common music title patterns
  const musicPatterns = [
    /[-:]\s*[^()\[\]]+$/,  // "Artist - Song"
    /\(official/i,         // Contains "(official"
    /\[official/i,         // Contains "[official"
    /feat\.?\s+/i,         // Contains "feat"
    /ft\.?\s+/i            // Contains "ft"
  ];

  return musicPatterns.some(pattern => pattern.test(title));
}

function getYouTubeVideoId() {
  const url = window.location.href;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

function getCurrentVideoTitle() {
  // Try different selectors for video title
  const selectors = [
    'h1.ytd-video-primary-info-renderer',
    'h1.ytd-watch-metadata yt-formatted-string',
    '#container h1.title',
    '.title.style-scope.ytd-video-primary-info-renderer',
    'h1[class*="title"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim();
    }
  }

  return null;
}

function getCurrentChannelName() {
  // Try different selectors for channel name
  const selectors = [
    '#owner-name a',
    '.ytd-video-owner-renderer a',
    '#channel-name a',
    'a.yt-simple-endpoint.style-scope.yt-formatted-string',
    '[class*="channel"] a'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim();
    }
  }

  return null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Message passing helpers
function sendMessage(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response && response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || 'Unknown error'));
      }
    });
  });
}

// Make functions available globally
window.extractSongInfo = extractSongInfo;
window.isLikelyMusicVideo = isLikelyMusicVideo;
window.getYouTubeVideoId = getYouTubeVideoId;
window.getCurrentVideoTitle = getCurrentVideoTitle;
window.getCurrentChannelName = getCurrentChannelName;
window.debounce = debounce;
window.sanitizeHTML = sanitizeHTML;
window.sendMessage = sendMessage;