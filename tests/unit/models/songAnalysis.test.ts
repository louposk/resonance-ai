import { SongAnalysisModel } from '../../../src/models/SongAnalysis';
import { SongAnalysis } from '../../../src/types';

describe('SongAnalysisModel', () => {
  let songAnalysisModel: SongAnalysisModel;
  const mockDatabaseClient = {
    query: jest.fn(),
  };

  beforeEach(() => {
    songAnalysisModel = new SongAnalysisModel(mockDatabaseClient as any);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new song analysis and return it', async () => {
      const mockAnalysisData = {
        songId: 'song-123',
        meaning: 'This song is about self-reflection and identity...',
        writingProcess: 'Michael Jackson wrote this song in collaboration with Quincy Jones...',
        trivia: 'The song was recorded in one take...',
        themes: ['identity', 'self-reflection', 'fame']
      };

      const mockCreatedAnalysis: SongAnalysis = {
        id: 'analysis-123',
        ...mockAnalysisData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockCreatedAnalysis]
      });

      const result = await songAnalysisModel.create(mockAnalysisData);

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO song_analyses'),
        expect.arrayContaining([
          mockAnalysisData.songId,
          mockAnalysisData.meaning,
          mockAnalysisData.writingProcess,
          mockAnalysisData.trivia,
          JSON.stringify(mockAnalysisData.themes)
        ])
      );
      expect(result).toEqual(mockCreatedAnalysis);
    });

    it('should throw error if analysis creation fails', async () => {
      const mockAnalysisData = {
        songId: 'song-123',
        meaning: 'Test meaning',
        writingProcess: 'Test process',
        trivia: 'Test trivia',
        themes: ['test']
      };

      mockDatabaseClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(songAnalysisModel.create(mockAnalysisData)).rejects.toThrow('Database error');
    });
  });

  describe('findBySongId', () => {
    it('should return analysis if found', async () => {
      const mockAnalysis: SongAnalysis = {
        id: 'analysis-123',
        songId: 'song-123',
        meaning: 'Song meaning...',
        writingProcess: 'Writing process...',
        trivia: 'Interesting trivia...',
        themes: ['theme1', 'theme2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [{ ...mockAnalysis, themes: JSON.stringify(mockAnalysis.themes) }]
      });

      const result = await songAnalysisModel.findBySongId('song-123');

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM song_analyses WHERE song_id = $1'),
        ['song-123']
      );
      expect(result).toEqual(mockAnalysis);
    });

    it('should return null if analysis not found', async () => {
      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await songAnalysisModel.findBySongId('nonexistent');

      expect(result).toBeNull();
    });

    it('should parse themes JSON correctly', async () => {
      const mockAnalysis = {
        id: 'analysis-123',
        songId: 'song-123',
        meaning: 'Song meaning...',
        writingProcess: 'Writing process...',
        trivia: 'Interesting trivia...',
        themes: '["love", "heartbreak", "romance"]',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockAnalysis]
      });

      const result = await songAnalysisModel.findBySongId('song-123');

      expect(result?.themes).toEqual(['love', 'heartbreak', 'romance']);
    });
  });

  describe('update', () => {
    it('should update analysis and return updated version', async () => {
      const updateData = {
        meaning: 'Updated meaning...',
        trivia: 'Updated trivia...',
        themes: ['updated', 'themes']
      };

      const mockUpdatedAnalysis: SongAnalysis = {
        id: 'analysis-123',
        songId: 'song-123',
        writingProcess: 'Original writing process...',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [{ ...mockUpdatedAnalysis, themes: JSON.stringify(mockUpdatedAnalysis.themes) }]
      });

      const result = await songAnalysisModel.update('analysis-123', updateData);

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE song_analyses SET'),
        expect.arrayContaining(['analysis-123'])
      );
      expect(result).toEqual(mockUpdatedAnalysis);
    });
  });
});