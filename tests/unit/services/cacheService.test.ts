import { CacheService } from '../../../src/services/CacheService';
import { Song, SongAnalysis } from '../../../src/types';

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushAll: jest.fn(),
    isOpen: true
  }))
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedisClient: any;

  beforeEach(() => {
    cacheService = new CacheService();
    mockRedisClient = (cacheService as any).client;
    jest.clearAllMocks();
  });

  describe('getSong', () => {
    it('should return cached song if exists', async () => {
      const mockSong: Song = {
        id: 'song-123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockSong));

      const result = await cacheService.getSong('billie jean', 'michael jackson');

      expect(mockRedisClient.get).toHaveBeenCalledWith('song:billie jean:michael jackson');
      expect(result).toEqual(mockSong);
    });

    it('should return null if song not in cache', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cacheService.getSong('unknown', 'artist');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockRedisClient.get.mockResolvedValueOnce('invalid json');

      const result = await cacheService.getSong('test', 'artist');

      expect(result).toBeNull();
    });

    it('should normalize song keys to lowercase', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      await cacheService.getSong('BILLIE Jean', 'Michael JACKSON');

      expect(mockRedisClient.get).toHaveBeenCalledWith('song:billie jean:michael jackson');
    });
  });

  describe('setSong', () => {
    it('should cache song with TTL', async () => {
      const mockSong: Song = {
        id: 'song-123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedisClient.set.mockResolvedValueOnce('OK');

      await cacheService.setSong('billie jean', 'michael jackson', mockSong);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'song:billie jean:michael jackson',
        JSON.stringify(mockSong),
        { EX: 86400 } // 24 hours
      );
    });

    it('should handle set errors gracefully', async () => {
      const mockSong: Song = {
        id: 'song-123',
        title: 'Test',
        artist: 'Artist',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedisClient.set.mockRejectedValueOnce(new Error('Redis error'));

      await expect(cacheService.setSong('test', 'artist', mockSong)).resolves.not.toThrow();
    });
  });

  describe('getAnalysis', () => {
    it('should return cached analysis if exists', async () => {
      const mockAnalysis: SongAnalysis = {
        id: 'analysis-123',
        songId: 'song-123',
        meaning: 'Song meaning...',
        writingProcess: 'Writing process...',
        trivia: 'Trivia...',
        themes: ['theme1', 'theme2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockAnalysis));

      const result = await cacheService.getAnalysis('song-123');

      expect(mockRedisClient.get).toHaveBeenCalledWith('analysis:song-123');
      expect(result).toEqual(mockAnalysis);
    });

    it('should return null if analysis not in cache', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cacheService.getAnalysis('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('setAnalysis', () => {
    it('should cache analysis with TTL', async () => {
      const mockAnalysis: SongAnalysis = {
        id: 'analysis-123',
        songId: 'song-123',
        meaning: 'Meaning...',
        writingProcess: 'Process...',
        trivia: 'Trivia...',
        themes: ['theme'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedisClient.set.mockResolvedValueOnce('OK');

      await cacheService.setAnalysis('song-123', mockAnalysis);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'analysis:song-123',
        JSON.stringify(mockAnalysis),
        { EX: 86400 } // 24 hours
      );
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis from cache', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      await cacheService.deleteAnalysis('song-123');

      expect(mockRedisClient.del).toHaveBeenCalledWith('analysis:song-123');
    });

    it('should handle delete errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('Redis error'));

      await expect(cacheService.deleteAnalysis('song-123')).resolves.not.toThrow();
    });
  });

  describe('cacheSearchResult', () => {
    it('should cache search results with shorter TTL', async () => {
      const mockResults = [
        { id: 'song-1', title: 'Song 1', artist: 'Artist 1' },
        { id: 'song-2', title: 'Song 2', artist: 'Artist 2' }
      ];

      mockRedisClient.set.mockResolvedValueOnce('OK');

      await cacheService.cacheSearchResult('billie jean', mockResults);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'search:billie jean',
        JSON.stringify(mockResults),
        { EX: 1800 } // 30 minutes
      );
    });
  });

  describe('getSearchResult', () => {
    it('should return cached search results', async () => {
      const mockResults = [
        { id: 'song-1', title: 'Song 1', artist: 'Artist 1' }
      ];

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockResults));

      const result = await cacheService.getSearchResult('test query');

      expect(mockRedisClient.get).toHaveBeenCalledWith('search:test query');
      expect(result).toEqual(mockResults);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      mockRedisClient.flushAll.mockResolvedValueOnce('OK');

      await cacheService.clearCache();

      expect(mockRedisClient.flushAll).toHaveBeenCalled();
    });

    it('should handle clear cache errors', async () => {
      mockRedisClient.flushAll.mockRejectedValueOnce(new Error('Redis error'));

      await expect(cacheService.clearCache()).rejects.toThrow('Redis error');
    });
  });

  describe('isConnected', () => {
    it('should return true when client is connected', () => {
      mockRedisClient.isOpen = true;

      const result = cacheService.isConnected();

      expect(result).toBe(true);
    });

    it('should return false when client is not connected', () => {
      mockRedisClient.isOpen = false;

      const result = cacheService.isConnected();

      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      mockRedisClient.disconnect.mockResolvedValueOnce(undefined);

      await cacheService.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});