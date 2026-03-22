import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        console.log('⚠️ Redis not configured - using in-memory fallback');
        return;
      }

      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.connected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  async incrementBy(key: string, amount: number): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error(`Redis INCRBY error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.connected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushall(): Promise<boolean> {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis connection closed');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
      this.client = null;
      this.connected = false;
    }
  }

  // Utility method for monitoring-specific operations
  async getStats(): Promise<{ memoryUsage: number; connectedClients: number; }> {
    if (!this.client || !this.connected) {
      return { memoryUsage: 0, connectedClients: 0 };
    }

    try {
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        memoryUsage,
        connectedClients: 1 // Simple approximation
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      return { memoryUsage: 0, connectedClients: 0 };
    }
  }
}