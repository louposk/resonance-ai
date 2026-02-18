import { PoolClient } from 'pg';
import { SongAnalysis } from '../types';

export class SongAnalysisModel {
  constructor(private client: PoolClient) {}

  async create(analysisData: {
    songId: string;
    meaning: string;
    writingProcess: string;
    trivia: string;
    themes: string[];
  }): Promise<SongAnalysis> {
    const query = `
      INSERT INTO song_analyses (song_id, meaning, writing_process, trivia, themes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      analysisData.songId,
      analysisData.meaning,
      analysisData.writingProcess,
      analysisData.trivia,
      JSON.stringify(analysisData.themes)
    ];

    const result = await this.client.query(query, values);
    return this.mapRowToAnalysis(result.rows[0]);
  }

  async findBySongId(songId: string): Promise<SongAnalysis | null> {
    const query = `SELECT * FROM song_analyses WHERE song_id = $1`;
    const result = await this.client.query(query, [songId]);
    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  async findById(id: string): Promise<SongAnalysis | null> {
    const query = `SELECT * FROM song_analyses WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  async update(id: string, updates: {
    meaning?: string;
    writingProcess?: string;
    trivia?: string;
    themes?: string[];
  }): Promise<SongAnalysis | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (updates.meaning !== undefined) {
      setParts.push(`meaning = $${valueIndex++}`);
      values.push(updates.meaning);
    }

    if (updates.writingProcess !== undefined) {
      setParts.push(`writing_process = $${valueIndex++}`);
      values.push(updates.writingProcess);
    }

    if (updates.trivia !== undefined) {
      setParts.push(`trivia = $${valueIndex++}`);
      values.push(updates.trivia);
    }

    if (updates.themes !== undefined) {
      setParts.push(`themes = $${valueIndex++}`);
      values.push(JSON.stringify(updates.themes));
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    setParts.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE song_analyses
      SET ${setParts.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await this.client.query(query, values);
    return result.rows.length > 0 ? this.mapRowToAnalysis(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM song_analyses WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async deleteBySongId(songId: string): Promise<boolean> {
    const query = `DELETE FROM song_analyses WHERE song_id = $1`;
    const result = await this.client.query(query, [songId]);
    return (result.rowCount || 0) > 0;
  }

  async getAnalysisWithSong(songId: string): Promise<{ analysis: SongAnalysis; song: any } | null> {
    const query = `
      SELECT
        sa.*,
        s.title, s.artist, s.album, s.duration, s.release_year, s.spotify_id, s.youtube_id,
        s.created_at as song_created_at, s.updated_at as song_updated_at
      FROM song_analyses sa
      JOIN songs s ON sa.song_id = s.id
      WHERE sa.song_id = $1
    `;

    const result = await this.client.query(query, [songId]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      analysis: this.mapRowToAnalysis(row),
      song: {
        id: songId,
        title: row.title,
        artist: row.artist,
        album: row.album,
        duration: row.duration,
        releaseYear: row.release_year,
        spotifyId: row.spotify_id,
        youtubeId: row.youtube_id,
        createdAt: new Date(row.song_created_at),
        updatedAt: new Date(row.song_updated_at)
      }
    };
  }

  private mapRowToAnalysis(row: any): SongAnalysis {
    let themes: string[] = [];
    try {
      themes = typeof row.themes === 'string' ? JSON.parse(row.themes) : row.themes;
    } catch (error) {
      themes = [];
    }

    return {
      id: row.id,
      songId: row.song_id,
      meaning: row.meaning,
      writingProcess: row.writing_process,
      trivia: row.trivia,
      themes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}