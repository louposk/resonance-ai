import request from 'supertest';
import { createApp } from '../../src/app';
import { SongModel } from '../../src/models/Song';
import { SongAnalysisModel } from '../../src/models/SongAnalysis';
import { CacheService } from '../../src/services/CacheService';
import { SpotifyService } from '../../src/services/SpotifyService';
import { YouTubeService } from '../../src/services/YouTubeService';
import { AIService } from '../../src/services/AIService';

jest.mock('../../src/models/Song');
jest.mock('../../src/models/SongAnalysis');
jest.mock('../../src/services/CacheService');
jest.mock('../../src/services/SpotifyService');
jest.mock('../../src/services/YouTubeService');
jest.mock('../../src/services/AIService');

describe('Song Routes', () => {
  let app: any;
  let mockSongModel: jest.Mocked<SongModel>;
  let mockAnalysisModel: jest.Mocked<SongAnalysisModel>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockSpotifyService: jest.Mocked<SpotifyService>;
  let mockYouTubeService: jest.Mocked<YouTubeService>;
  let mockAIService: jest.Mocked<AIService>;

  const validApiKey = 'test-api-key';
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    apiKey: validApiKey,
    isActive: true
  };

  beforeEach(() => {
    app = createApp();

    mockSongModel = new SongModel(null as any) as jest.Mocked<SongModel>;
    mockAnalysisModel = new SongAnalysisModel(null as any) as jest.Mocked<SongAnalysisModel>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockSpotifyService = new SpotifyService() as jest.Mocked<SpotifyService>;
    mockYouTubeService = new YouTubeService() as jest.Mocked<YouTubeService>;
    mockAIService = new AIService() as jest.Mocked<AIService>;

    // Mock authentication middleware to return valid user
    jest.doMock('../../src/middleware/auth', () => ({
      authenticateApiKey: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/songs/search', () => {
    it('should search for songs and return results', async () => {
      const mockSearchResults = [
        {
          id: 'song-1',
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          album: 'Thriller',
          spotifyId: 'spotify123'
        }
      ];

      mockCacheService.getSearchResult.mockResolvedValueOnce(null);
      mockSpotifyService.searchTrack.mockResolvedValueOnce(mockSearchResults[0]);
      mockCacheService.cacheSearchResult.mockResolvedValueOnce();

      const response = await request(app)
        .get('/api/songs/search')
        .query({ q: 'Billie Jean Michael Jackson' })
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSearchResults);
      expect(mockSpotifyService.searchTrack).toHaveBeenCalledWith('Billie Jean Michael Jackson');
    });

    it('should return cached search results if available', async () => {
      const cachedResults = [
        {
          id: 'song-1',
          title: 'Billie Jean',
          artist: 'Michael Jackson'
        }
      ];

      mockCacheService.getSearchResult.mockResolvedValueOnce(cachedResults);

      const response = await request(app)
        .get('/api/songs/search')
        .query({ q: 'Billie Jean' })
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(cachedResults);
      expect(mockSpotifyService.searchTrack).not.toHaveBeenCalled();
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/songs/search')
        .set('x-api-key', validApiKey)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('query parameter is required');
    });

    it('should require valid API key', async () => {
      const response = await request(app)
        .get('/api/songs/search')
        .query({ q: 'test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('API key required');
    });

    it('should handle search with platform filter', async () => {
      mockCacheService.getSearchResult.mockResolvedValueOnce(null);
      mockYouTubeService.searchVideo.mockResolvedValueOnce({
        id: 'youtube123',
        title: 'Billie Jean - Michael Jackson',
        artist: 'Michael Jackson',
        youtubeId: 'youtube123'
      });

      const response = await request(app)
        .get('/api/songs/search')
        .query({ q: 'Billie Jean', platform: 'youtube' })
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(mockYouTubeService.searchVideo).toHaveBeenCalledWith('Billie Jean');
      expect(mockSpotifyService.searchTrack).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/songs/:id/analysis', () => {
    const songId = 'song-123';
    const mockSong = {
      id: songId,
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      releaseYear: 1983,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return cached analysis if available', async () => {
      const mockAnalysis = {
        id: 'analysis-123',
        songId: songId,
        meaning: 'Song meaning...',
        writingProcess: 'Writing process...',
        trivia: 'Trivia...',
        themes: ['theme1', 'theme2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSongModel.findById.mockResolvedValueOnce(mockSong);
      mockCacheService.getAnalysis.mockResolvedValueOnce(mockAnalysis);

      const response = await request(app)
        .get(`/api/songs/${songId}/analysis`)
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        song: mockSong,
        analysis: mockAnalysis
      });
      expect(mockAIService.analyzeSong).not.toHaveBeenCalled();
    });

    it('should generate new analysis if not cached', async () => {
      const mockAnalysis = {
        meaning: 'AI generated meaning...',
        writingProcess: 'AI generated process...',
        trivia: 'AI generated trivia...',
        themes: ['ai', 'generated']
      };

      const mockSavedAnalysis = {
        id: 'analysis-456',
        songId: songId,
        ...mockAnalysis,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSongModel.findById.mockResolvedValueOnce(mockSong);
      mockCacheService.getAnalysis.mockResolvedValueOnce(null);
      mockAnalysisModel.findBySongId.mockResolvedValueOnce(null);
      mockAIService.analyzeSong.mockResolvedValueOnce(mockAnalysis);
      mockAnalysisModel.create.mockResolvedValueOnce(mockSavedAnalysis);
      mockCacheService.setAnalysis.mockResolvedValueOnce();

      const response = await request(app)
        .get(`/api/songs/${songId}/analysis`)
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toEqual(mockSavedAnalysis);
      expect(mockAIService.analyzeSong).toHaveBeenCalledWith(mockSong);
      expect(mockAnalysisModel.create).toHaveBeenCalledWith({
        songId: songId,
        ...mockAnalysis
      });
    });

    it('should return 404 if song not found', async () => {
      mockSongModel.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/songs/nonexistent/analysis')
        .set('x-api-key', validApiKey)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Song not found');
    });

    it('should handle AI service errors', async () => {
      mockSongModel.findById.mockResolvedValueOnce(mockSong);
      mockCacheService.getAnalysis.mockResolvedValueOnce(null);
      mockAnalysisModel.findBySongId.mockResolvedValueOnce(null);
      mockAIService.analyzeSong.mockRejectedValueOnce(new Error('AI service unavailable'));

      const response = await request(app)
        .get(`/api/songs/${songId}/analysis`)
        .set('x-api-key', validApiKey)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to generate analysis');
    });
  });

  describe('POST /api/songs', () => {
    it('should create new song with analysis', async () => {
      const newSongData = {
        title: 'Beat It',
        artist: 'Michael Jackson',
        album: 'Thriller',
        releaseYear: 1983
      };

      const mockCreatedSong = {
        id: 'song-456',
        ...newSongData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAnalysis = {
        meaning: 'Generated meaning...',
        writingProcess: 'Generated process...',
        trivia: 'Generated trivia...',
        themes: ['rock', 'unity']
      };

      const mockSavedAnalysis = {
        id: 'analysis-789',
        songId: 'song-456',
        ...mockAnalysis,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSongModel.findByTitleAndArtist.mockResolvedValueOnce(null);
      mockSongModel.create.mockResolvedValueOnce(mockCreatedSong);
      mockAIService.analyzeSong.mockResolvedValueOnce(mockAnalysis);
      mockAnalysisModel.create.mockResolvedValueOnce(mockSavedAnalysis);
      mockCacheService.setSong.mockResolvedValueOnce();
      mockCacheService.setAnalysis.mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/songs')
        .send(newSongData)
        .set('x-api-key', validApiKey)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.song).toEqual(mockCreatedSong);
      expect(response.body.data.analysis).toEqual(mockSavedAnalysis);
      expect(mockSongModel.create).toHaveBeenCalledWith(newSongData);
    });

    it('should return existing song if already exists', async () => {
      const existingSong = {
        id: 'existing-song',
        title: 'Beat It',
        artist: 'Michael Jackson',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSongModel.findByTitleAndArtist.mockResolvedValueOnce(existingSong);

      const response = await request(app)
        .post('/api/songs')
        .send({
          title: 'Beat It',
          artist: 'Michael Jackson'
        })
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.song).toEqual(existingSong);
      expect(mockSongModel.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/songs')
        .send({
          title: 'Song without artist'
        })
        .set('x-api-key', validApiKey)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('artist');
    });
  });
});