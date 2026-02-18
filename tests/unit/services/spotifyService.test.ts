import { SpotifyService } from '../../../src/services/SpotifyService';
import { SpotifyTrack } from '../../../src/types';

jest.mock('axios');
const mockAxios = require('axios');

describe('SpotifyService', () => {
  let spotifyService: SpotifyService;

  beforeEach(() => {
    spotifyService = new SpotifyService();
    jest.clearAllMocks();
  });

  describe('searchTrack', () => {
    it('should search for track and return formatted result', async () => {
      const mockSpotifyResponse = {
        data: {
          tracks: {
            items: [
              {
                id: 'spotify123',
                name: 'Billie Jean',
                artists: [{ name: 'Michael Jackson' }],
                album: {
                  name: 'Thriller',
                  release_date: '1983-01-01'
                },
                duration_ms: 294000
              }
            ]
          }
        }
      };

      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.get.mockResolvedValueOnce(mockSpotifyResponse);

      const result = await spotifyService.searchTrack('Billie Jean Michael Jackson');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic')
          }
        })
      );

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search',
        expect.objectContaining({
          params: {
            q: 'Billie Jean Michael Jackson',
            type: 'track',
            limit: 1
          },
          headers: {
            Authorization: 'Bearer mock-access-token'
          }
        })
      );

      expect(result).toEqual({
        id: 'spotify123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        duration: 294000,
        releaseYear: 1983,
        spotifyId: 'spotify123'
      });
    });

    it('should return null if no tracks found', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token'
        }
      };

      const mockSpotifyResponse = {
        data: {
          tracks: {
            items: []
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.get.mockResolvedValueOnce(mockSpotifyResponse);

      const result = await spotifyService.searchTrack('Unknown Song');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token'
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.get.mockRejectedValueOnce(new Error('Spotify API Error'));

      await expect(spotifyService.searchTrack('Test Song')).rejects.toThrow('Spotify API Error');
    });

    it('should handle token refresh failure', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Token request failed'));

      await expect(spotifyService.searchTrack('Test Song')).rejects.toThrow('Token request failed');
    });
  });

  describe('getTrackDetails', () => {
    it('should get detailed track information', async () => {
      const mockTokenResponse = {
        data: { access_token: 'mock-access-token' }
      };

      const mockTrackResponse = {
        data: {
          id: 'spotify123',
          name: 'Billie Jean',
          artists: [{ name: 'Michael Jackson' }],
          album: {
            name: 'Thriller',
            release_date: '1983-01-01'
          },
          duration_ms: 294000,
          popularity: 89,
          external_urls: {
            spotify: 'https://open.spotify.com/track/spotify123'
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.get.mockResolvedValueOnce(mockTrackResponse);

      const result = await spotifyService.getTrackDetails('spotify123');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/tracks/spotify123',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token'
          }
        })
      );

      expect(result).toEqual({
        id: 'spotify123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        duration: 294000,
        releaseYear: 1983,
        spotifyId: 'spotify123',
        popularity: 89,
        externalUrl: 'https://open.spotify.com/track/spotify123'
      });
    });

    it('should handle track not found', async () => {
      const mockTokenResponse = {
        data: { access_token: 'mock-access-token' }
      };

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: { message: 'Track not found' } }
        }
      });

      const result = await spotifyService.getTrackDetails('nonexistent');

      expect(result).toBeNull();
    });
  });
});