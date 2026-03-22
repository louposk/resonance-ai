class SongDetector {
  constructor() {
    this.currentVideoId = null;
    this.currentSong = null;
    this.observers = [];
    this.init();
  }

  init() {
    // Detect initial video
    this.detectCurrentSong();

    // Set up URL change detection
    this.setupURLChangeDetection();

    // Set up DOM change observers
    this.setupDOMObservers();
  }

  setupURLChangeDetection() {
    // Watch for URL changes (for SPAs like YouTube)
    let lastUrl = window.location.href;

    const urlCheckInterval = setInterval(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        this.handleURLChange();
      }
    }, 1000);

    // Also listen to popstate events
    window.addEventListener('popstate', () => {
      this.handleURLChange();
    });
  }

  setupDOMObservers() {
    // Observe changes in the video title area
    const titleObserver = new MutationObserver(debounce(() => {
      this.detectCurrentSong();
    }, 2000));

    // Observe the main content area
    const contentSelector = '#page-manager, #content, ytd-watch-flexy';
    const contentElement = document.querySelector(contentSelector);

    if (contentElement) {
      titleObserver.observe(contentElement, {
        childList: true,
        subtree: true
      });
      this.observers.push(titleObserver);
    }
  }

  handleURLChange() {
    // Wait a moment for the page to update
    setTimeout(() => {
      this.detectCurrentSong();
    }, 2000);
  }

  async detectCurrentSong() {
    try {
      const videoId = getYouTubeVideoId();

      // If no video ID or same video, skip
      if (!videoId || videoId === this.currentVideoId) {
        return;
      }

      this.currentVideoId = videoId;

      // Clear previous song data
      this.currentSong = null;
      this.notifyUI('loading');

      // Get video metadata
      const title = getCurrentVideoTitle();
      const channelName = getCurrentChannelName();

      if (!title) {
        console.log('No video title found');
        this.notifyUI('no-title');
        return;
      }

      // Check if it's likely a music video
      if (!isLikelyMusicVideo(title, channelName || '')) {
        console.log('Video does not appear to be a music video');
        this.notifyUI('not-music');
        return;
      }

      // Extract song information
      const songInfo = extractSongInfo(title);

      if (!songInfo.song) {
        console.log('Could not extract song information from title');
        this.notifyUI('no-song-info');
        return;
      }

      console.log('Detected song:', songInfo);

      // Search for the song
      await this.searchAndAnalyzeSong(songInfo, title, channelName, videoId);

    } catch (error) {
      console.error('Error detecting song:', error);
      this.notifyUI('error', error.message);
    }
  }

  async searchAndAnalyzeSong(songInfo, originalTitle, channelName, videoId) {
    try {
      // First try searching with extracted info
      let query = songInfo.artist
        ? `${songInfo.artist} ${songInfo.song}`
        : songInfo.song;

      let searchResults = await sendMessage('searchSongs', {
        query,
        platform: 'all'
      });

      // If no results, try with original title
      if (!searchResults || searchResults.length === 0) {
        query = originalTitle.split('(')[0].trim(); // Remove anything in parentheses
        searchResults = await sendMessage('searchSongs', {
          query,
          platform: 'all'
        });
      }

      let song = null;
      let analysis = null;

      if (searchResults && searchResults.length > 0) {
        // Use the first result
        song = searchResults[0];

        try {
          // Get analysis for the found song
          const analysisData = await sendMessage('getSongAnalysis', {
            songId: song.id
          });
          analysis = analysisData.analysis;
        } catch (analysisError) {
          console.log('No existing analysis, creating new song entry');

          // If song analysis doesn't exist, create a new song entry
          try {
            const newSongData = {
              title: songInfo.song,
              artist: songInfo.artist || channelName || 'Unknown Artist',
              youtubeId: videoId
            };

            const createdResult = await sendMessage('createSong', {
              songData: newSongData
            });

            song = createdResult.song;
            analysis = createdResult.analysis;
          } catch (createError) {
            console.error('Error creating song:', createError);
            this.notifyUI('error', 'Failed to create song analysis');
            return;
          }
        }
      } else {
        // No search results, create new song
        try {
          const newSongData = {
            title: songInfo.song,
            artist: songInfo.artist || channelName || 'Unknown Artist',
            youtubeId: videoId
          };

          const createdResult = await sendMessage('createSong', {
            songData: newSongData
          });

          song = createdResult.song;
          analysis = createdResult.analysis;
        } catch (createError) {
          console.error('Error creating song:', createError);
          this.notifyUI('error', 'Failed to analyze song');
          return;
        }
      }

      // Store current song
      this.currentSong = { song, analysis };

      // Notify UI
      this.notifyUI('success', this.currentSong);

    } catch (error) {
      console.error('Error searching/analyzing song:', error);
      this.notifyUI('error', error.message);
    }
  }

  notifyUI(status, data = null) {
    // Dispatch custom event for UI components
    const event = new CustomEvent('resonanceDetection', {
      detail: { status, data, videoId: this.currentVideoId }
    });
    document.dispatchEvent(event);
  }

  getCurrentSong() {
    return this.currentSong;
  }

  destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize song detector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.songDetector = new SongDetector();
  });
} else {
  window.songDetector = new SongDetector();
}