import { PoolClient } from 'pg';
import { Song } from '../types';

export class SongModel {
  constructor(private client: PoolClient) {}

  async create(songData: {
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    releaseYear?: number;
    spotifyId?: string;
    youtubeId?: string;
  }): Promise<Song> {
    const query = `
      INSERT INTO songs (title, artist, album, duration, release_year, spotify_id, youtube_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      songData.title,
      songData.artist,
      songData.album || null,
      songData.duration || null,
      songData.releaseYear || null,
      songData.spotifyId || null,
      songData.youtubeId || null
    ];

    const result = await this.client.query(query, values);
    return this.mapRowToSong(result.rows[0]);
  }

  async findByTitleAndArtist(title: string, artist: string): Promise<Song | null> {
    const query = `
      SELECT * FROM songs
      WHERE LOWER(title) = LOWER($1) AND LOWER(artist) = LOWER($2)
      LIMIT 1
    `;

    const result = await this.client.query(query, [title, artist]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async findById(id: string): Promise<Song | null> {
    const query = `SELECT * FROM songs WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async findBySpotifyId(spotifyId: string): Promise<Song | null> {
    const query = `SELECT * FROM songs WHERE spotify_id = $1`;
    const result = await this.client.query(query, [spotifyId]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async findByYouTubeId(youtubeId: string): Promise<Song | null> {
    const query = `SELECT * FROM songs WHERE youtube_id = $1`;
    const result = await this.client.query(query, [youtubeId]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async updateSpotifyInfo(id: string, spotifyId: string): Promise<Song | null> {
    const query = `
      UPDATE songs
      SET spotify_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(query, [id, spotifyId]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async updateYouTubeInfo(id: string, youtubeId: string): Promise<Song | null> {
    const query = `
      UPDATE songs
      SET youtube_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(query, [id, youtubeId]);
    return result.rows.length > 0 ? this.mapRowToSong(result.rows[0]) : null;
  }

  async search(query: string, limit: number = 10): Promise<Song[]> {
    const searchQuery = `
      SELECT * FROM songs
      WHERE
        LOWER(title) LIKE LOWER($1) OR
        LOWER(artist) LIKE LOWER($1) OR
        LOWER(album) LIKE LOWER($1)
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.client.query(searchQuery, [`%${query}%`, limit]);
    return result.rows.map(row => this.mapRowToSong(row));
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM songs WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  private mapRowToSong(row: any): Song {
    return {
      id: row.id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      duration: row.duration,
      releaseYear: row.release_year,
      spotifyId: row.spotify_id,
      youtubeId: row.youtube_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}