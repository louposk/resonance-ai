import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'music_info_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async createTables(): Promise<void> {
    const queries = [
      `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS songs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          artist VARCHAR(255) NOT NULL,
          album VARCHAR(255),
          duration INTEGER,
          release_year INTEGER,
          spotify_id VARCHAR(255),
          youtube_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(LOWER(title), LOWER(artist))
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS song_analyses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          meaning TEXT NOT NULL,
          writing_process TEXT NOT NULL,
          trivia TEXT NOT NULL,
          themes JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(song_id)
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS api_call_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service VARCHAR(50) NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          method VARCHAR(10) NOT NULL,
          tokens_used INTEGER,
          quota_units_used INTEGER,
          cost_usd DECIMAL(10, 6),
          response_time_ms INTEGER NOT NULL,
          status_code INTEGER NOT NULL,
          error_message TEXT,
          metadata JSONB,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS admin_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
      `
        CREATE TABLE IF NOT EXISTS cost_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          alert_type VARCHAR(50) NOT NULL,
          threshold_value DECIMAL(10, 2) NOT NULL,
          current_value DECIMAL(10, 2) NOT NULL,
          message TEXT NOT NULL,
          is_resolved BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP
        );
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_songs_title_artist ON songs(LOWER(title), LOWER(artist));
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_songs_youtube_id ON songs(youtube_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_song_analyses_song_id ON song_analyses(song_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_api_call_logs_service ON api_call_logs(service);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_api_call_logs_timestamp ON api_call_logs(timestamp);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_api_call_logs_service_timestamp ON api_call_logs(service, timestamp);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_cost_alerts_type ON cost_alerts(alert_type, is_resolved);
      `
    ];

    for (const query of queries) {
      await this.query(query);
    }
  }
}

export const database = new Database();