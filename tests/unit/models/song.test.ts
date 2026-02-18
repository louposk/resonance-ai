import { SongModel } from '../../../src/models/Song';
import { Song } from '../../../src/types';

describe('SongModel', () => {
  let songModel: SongModel;
  const mockDatabaseClient = {
    query: jest.fn(),
  };

  beforeEach(() => {
    songModel = new SongModel(mockDatabaseClient as any);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new song and return it', async () => {
      const mockSong = {
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        duration: 294000,
        releaseYear: 1983,
        spotifyId: 'spotify123',
        youtubeId: 'youtube123'
      };

      const mockCreatedSong: Song = {
        id: 'song-123',
        ...mockSong,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockCreatedSong]
      });

      const result = await songModel.create(mockSong);

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO songs'),
        expect.arrayContaining([
          mockSong.title,
          mockSong.artist,
          mockSong.album,
          mockSong.duration,
          mockSong.releaseYear,
          mockSong.spotifyId,
          mockSong.youtubeId
        ])
      );
      expect(result).toEqual(mockCreatedSong);
    });

    it('should throw error if song creation fails', async () => {
      const mockSong = {
        title: 'Test Song',
        artist: 'Test Artist'
      };

      mockDatabaseClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(songModel.create(mockSong)).rejects.toThrow('Database error');
    });
  });

  describe('findByTitleAndArtist', () => {
    it('should return song if found', async () => {
      const mockSong: Song = {
        id: 'song-123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        album: 'Thriller',
        duration: 294000,
        releaseYear: 1983,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockSong]
      });

      const result = await songModel.findByTitleAndArtist('Billie Jean', 'Michael Jackson');

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM songs WHERE LOWER(title) = LOWER($1) AND LOWER(artist) = LOWER($2)'),
        ['Billie Jean', 'Michael Jackson']
      );
      expect(result).toEqual(mockSong);
    });

    it('should return null if song not found', async () => {
      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await songModel.findByTitleAndArtist('Unknown Song', 'Unknown Artist');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return song if found', async () => {
      const mockSong: Song = {
        id: 'song-123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockSong]
      });

      const result = await songModel.findById('song-123');

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM songs WHERE id = $1'),
        ['song-123']
      );
      expect(result).toEqual(mockSong);
    });

    it('should return null if song not found', async () => {
      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await songModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateSpotifyInfo', () => {
    it('should update song with Spotify information', async () => {
      const mockUpdatedSong: Song = {
        id: 'song-123',
        title: 'Billie Jean',
        artist: 'Michael Jackson',
        spotifyId: 'new-spotify-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDatabaseClient.query.mockResolvedValueOnce({
        rows: [mockUpdatedSong]
      });

      const result = await songModel.updateSpotifyInfo('song-123', 'new-spotify-id');

      expect(mockDatabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE songs SET spotify_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1'),
        ['song-123', 'new-spotify-id']
      );
      expect(result).toEqual(mockUpdatedSong);
    });
  });
});