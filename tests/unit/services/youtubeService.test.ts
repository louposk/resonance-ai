import { YouTubeService } from '../../../src/services/YouTubeService';

jest.mock('axios');
const mockAxios = require('axios');

describe('YouTubeService', () => {
  let youtubeService: YouTubeService;

  beforeEach(() => {
    youtubeService = new YouTubeService();
    jest.clearAllMocks();
  });

  describe('searchVideo', () => {
    it('should search for video and return formatted result', async () => {
      const mockYouTubeResponse = {
        data: {
          items: [
            {
              id: { videoId: 'youtube123' },
              snippet: {
                title: 'Michael Jackson - Billie Jean (Official Video)',
                channelTitle: 'Michael Jackson',
                publishedAt: '2009-10-05T03:26:41Z',
                description: 'Official video for Billie Jean...'
              }
            }
          ]
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockYouTubeResponse);

      const result = await youtubeService.searchVideo('Billie Jean Michael Jackson');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: {
            part: 'snippet',
            q: 'Billie Jean Michael Jackson',
            type: 'video',
            maxResults: 1,
            videoCategoryId: '10', // Music category
            key: expect.any(String)
          }
        })
      );

      expect(result).toEqual({
        id: 'youtube123',
        title: 'Michael Jackson - Billie Jean (Official Video)',
        artist: 'Michael Jackson',
        youtubeId: 'youtube123',
        publishedAt: '2009-10-05T03:26:41Z',
        description: 'Official video for Billie Jean...'
      });
    });

    it('should return null if no videos found', async () => {
      const mockYouTubeResponse = {
        data: {
          items: []
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockYouTubeResponse);

      const result = await youtubeService.searchVideo('Unknown Song');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('YouTube API Error'));

      await expect(youtubeService.searchVideo('Test Song')).rejects.toThrow('YouTube API Error');
    });

    it('should handle quota exceeded error', async () => {
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            error: {
              message: 'The request cannot be completed because you have exceeded your quota.'
            }
          }
        }
      });

      await expect(youtubeService.searchVideo('Test Song')).rejects.toThrow('YouTube API quota exceeded');
    });
  });

  describe('getVideoDetails', () => {
    it('should get detailed video information', async () => {
      const mockVideoResponse = {
        data: {
          items: [
            {
              id: 'youtube123',
              snippet: {
                title: 'Michael Jackson - Billie Jean (Official Video)',
                channelTitle: 'Michael Jackson',
                publishedAt: '2009-10-05T03:26:41Z',
                description: 'The official video for Billie Jean by Michael Jackson',
                tags: ['Michael Jackson', 'Billie Jean', 'Pop', 'Music']
              },
              contentDetails: {
                duration: 'PT4M54S' // ISO 8601 duration format
              },
              statistics: {
                viewCount: '500000000',
                likeCount: '2000000',
                commentCount: '100000'
              }
            }
          ]
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockVideoResponse);

      const result = await youtubeService.getVideoDetails('youtube123');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/videos',
        expect.objectContaining({
          params: {
            part: 'snippet,contentDetails,statistics',
            id: 'youtube123',
            key: expect.any(String)
          }
        })
      );

      expect(result).toEqual({
        id: 'youtube123',
        title: 'Michael Jackson - Billie Jean (Official Video)',
        artist: 'Michael Jackson',
        youtubeId: 'youtube123',
        publishedAt: '2009-10-05T03:26:41Z',
        description: 'The official video for Billie Jean by Michael Jackson',
        duration: 294, // converted from PT4M54S to seconds
        tags: ['Michael Jackson', 'Billie Jean', 'Pop', 'Music'],
        viewCount: 500000000,
        likeCount: 2000000,
        commentCount: 100000
      });
    });

    it('should handle video not found', async () => {
      const mockVideoResponse = {
        data: {
          items: []
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockVideoResponse);

      const result = await youtubeService.getVideoDetails('nonexistent');

      expect(result).toBeNull();
    });

    it('should parse ISO 8601 duration correctly', async () => {
      const mockVideoResponse = {
        data: {
          items: [{
            id: 'test123',
            snippet: {
              title: 'Test Video',
              channelTitle: 'Test Channel',
              publishedAt: '2020-01-01T00:00:00Z'
            },
            contentDetails: {
              duration: 'PT3M45S' // 3 minutes 45 seconds
            },
            statistics: {
              viewCount: '1000',
              likeCount: '10',
              commentCount: '5'
            }
          }]
        }
      };

      mockAxios.get.mockResolvedValueOnce(mockVideoResponse);

      const result = await youtubeService.getVideoDetails('test123');

      expect(result?.duration).toBe(225); // 3*60 + 45 = 225 seconds
    });
  });
});