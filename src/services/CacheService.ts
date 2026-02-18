import { createClient, RedisClientType } from 'redis';
import { Song, SongAnalysis } from '../types';

export class CacheService {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: 5000
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async getSong(title: string, artist: string): Promise<Song | null> {
    try {
      await this.connect();
      const key = this.generateSongKey(title, artist);
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache getSong error:', error);
      return null;
    }
  }

  async setSong(title: string, artist: string, song: Song): Promise<void> {
    try {
      await this.connect();
      const key = this.generateSongKey(title, artist);
      const ttl = 86400; // 24 hours

      await this.client.set(key, JSON.stringify(song), { EX: ttl });
    } catch (error) {
      console.error('Cache setSong error:', error);
    }
  }

  async getAnalysis(songId: string): Promise<SongAnalysis | null> {
    try {
      await this.connect();
      const key = `analysis:${songId}`;
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache getAnalysis error:', error);
      return null;
    }
  }

  async setAnalysis(songId: string, analysis: SongAnalysis): Promise<void> {
    try {
      await this.connect();
      const key = `analysis:${songId}`;
      const ttl = 86400; // 24 hours

      await this.client.set(key, JSON.stringify(analysis), { EX: ttl });
    } catch (error) {
      console.error('Cache setAnalysis error:', error);
    }
  }

  async deleteAnalysis(songId: string): Promise<void> {
    try {
      await this.connect();
      const key = `analysis:${songId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Cache deleteAnalysis error:', error);
    }
  }

  async getSearchResult(query: string): Promise<any[] | null> {
    try {
      await this.connect();
      const key = `search:${query}`;
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache getSearchResult error:', error);
      return null;
    }
  }

  async cacheSearchResult(query: string, results: any[]): Promise<void> {
    try {
      await this.connect();
      const key = `search:${query}`;
      const ttl = 1800; // 30 minutes

      await this.client.set(key, JSON.stringify(results), { EX: ttl });
    } catch (error) {
      console.error('Cache cacheSearchResult error:', error);
    }
  }

  async getUserSession(userId: string): Promise<any | null> {
    try {
      await this.connect();
      const key = `session:${userId}`;
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache getUserSession error:', error);
      return null;
    }
  }

  async setUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    try {
      await this.connect();
      const key = `session:${userId}`;

      await this.client.set(key, JSON.stringify(sessionData), { EX: ttl });
    } catch (error) {
      console.error('Cache setUserSession error:', error);
    }
  }

  async deleteUserSession(userId: string): Promise<void> {
    try {
      await this.connect();
      const key = `session:${userId}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Cache deleteUserSession error:', error);
    }
  }

  async cacheApiResponse(endpoint: string, params: any, response: any, ttl: number = 3600): Promise<void> {
    try {
      await this.connect();
      const paramString = JSON.stringify(params);
      const key = `api:${endpoint}:${Buffer.from(paramString).toString('base64')}`;

      await this.client.set(key, JSON.stringify(response), { EX: ttl });
    } catch (error) {
      console.error('Cache cacheApiResponse error:', error);
    }
  }

  async getCachedApiResponse(endpoint: string, params: any): Promise<any | null> {
    try {
      await this.connect();
      const paramString = JSON.stringify(params);
      const key = `api:${endpoint}:${Buffer.from(paramString).toString('base64')}`;
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache getCachedApiResponse error:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.connect();
      await this.client.flushAll();
    } catch (error) {
      console.error('Cache clearCache error:', error);
      throw error;
    }
  }

  async clearUserData(userId: string): Promise<void> {
    try {
      await this.connect();
      const keys = await this.client.keys(`*${userId}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache clearUserData error:', error);
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memory: any;
  }> {
    try {
      await this.connect();
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbSize();

      return {
        connected: this.connected,
        keyCount,
        memory: this.parseRedisInfo(info)
      };
    } catch (error) {
      return {
        connected: false,
        keyCount: 0,
        memory: {}
      };
    }
  }

  isConnected(): boolean {
    return this.connected && this.client.isOpen;
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  private generateSongKey(title: string, artist: string): string {
    return `song:${title.toLowerCase()}:${artist.toLowerCase()}`;
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const memoryInfo: any = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryInfo[key] = value;
      }
    });

    return memoryInfo;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}