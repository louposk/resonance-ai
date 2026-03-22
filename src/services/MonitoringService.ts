import { database } from '../config/database';
import { RedisService } from './RedisService';

export interface ApiCallLog {
  id?: string;
  service: 'openai' | 'spotify' | 'youtube' | 'database' | 'redis';
  endpoint: string;
  method: string;
  tokens_used?: number;
  quota_units_used?: number;
  cost_usd?: number;
  response_time_ms: number;
  status_code: number;
  error_message?: string;
  metadata?: any;
  timestamp: Date;
}

export interface UsageStats {
  openai: {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    dailyCost: number;
    monthlyCost: number;
    gpt4Calls: number;
    gpt35Calls: number;
  };
  spotify: {
    totalCalls: number;
    dailyCalls: number;
    hourlyCalls: number;
    remainingQuota: number;
    quotaResetTime: Date;
  };
  youtube: {
    totalCalls: number;
    dailyQuotaUsed: number;
    remainingQuota: number;
    quotaResetTime: Date;
  };
  database: {
    totalQueries: number;
    dailyQueries: number;
    estimatedStorageUsage: number;
    connectionPoolStats: any;
  };
  redis: {
    totalRequests: number;
    dailyRequests: number;
    memoryUsage: number;
    hitRate: number;
  };
}

export interface CostBreakdown {
  totalDailyCost: number;
  totalMonthlyCost: number;
  projectedMonthlyCost: number;
  breakdown: {
    openai: { cost: number; percentage: number; };
    infrastructure: { cost: number; percentage: number; };
  };
  alerts: string[];
}

export class MonitoringService {
  private redis: RedisService;
  private readonly PRICING = {
    openai: {
      gpt4: { input: 0.03, output: 0.06 }, // per 1K tokens
      gpt35: { input: 0.0015, output: 0.002 } // per 1K tokens
    },
    spotify: { free: true, rateLimit: 2000 }, // requests per hour
    youtube: { free: true, dailyQuota: 10000 }, // quota units per day
  };

  constructor() {
    this.redis = new RedisService();
  }

  async logApiCall(callLog: ApiCallLog): Promise<void> {
    try {
      // Store in database
      await this.storeApiCallInDB(callLog);

      // Update Redis counters for real-time tracking
      await this.updateRedisCounters(callLog);

      // Check for alerts
      await this.checkUsageAlerts(callLog);
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  private async storeApiCallInDB(callLog: ApiCallLog): Promise<void> {
    const query = `
      INSERT INTO api_call_logs (
        service, endpoint, method, tokens_used, quota_units_used,
        cost_usd, response_time_ms, status_code, error_message,
        metadata, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await database.query(query, [
      callLog.service,
      callLog.endpoint,
      callLog.method,
      callLog.tokens_used || null,
      callLog.quota_units_used || null,
      callLog.cost_usd || null,
      callLog.response_time_ms,
      callLog.status_code,
      callLog.error_message || null,
      callLog.metadata ? JSON.stringify(callLog.metadata) : null,
      callLog.timestamp
    ]);
  }

  private async updateRedisCounters(callLog: ApiCallLog): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    // Daily counters
    await this.redis.increment(`usage:${callLog.service}:daily:${today}`);

    if (callLog.tokens_used) {
      await this.redis.incrementBy(`tokens:${callLog.service}:daily:${today}`, callLog.tokens_used);
    }

    if (callLog.cost_usd) {
      await this.redis.incrementBy(`cost:${callLog.service}:daily:${today}`, Math.round(callLog.cost_usd * 10000)); // Store as cents * 100
    }

    // Hourly counters for rate limiting
    if (callLog.service === 'spotify') {
      await this.redis.increment(`usage:spotify:hourly:${today}:${hour}`);
      await this.redis.expire(`usage:spotify:hourly:${today}:${hour}`, 3600);
    }

    // Set expiration for daily counters
    await this.redis.expire(`usage:${callLog.service}:daily:${today}`, 86400 * 7); // 7 days
  }

  async getCurrentUsageStats(): Promise<UsageStats> {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    // Get OpenAI stats
    const openaiStats = await this.getOpenAIStats(today, thisMonth);

    // Get Spotify stats
    const spotifyStats = await this.getSpotifyStats(today);

    // Get YouTube stats
    const youtubeStats = await this.getYouTubeStats(today);

    // Get Database stats
    const databaseStats = await this.getDatabaseStats(today);

    // Get Redis stats
    const redisStats = await this.getRedisStats(today);

    return {
      openai: openaiStats,
      spotify: spotifyStats,
      youtube: youtubeStats,
      database: databaseStats,
      redis: redisStats
    };
  }

  private async getOpenAIStats(today: string, thisMonth: string): Promise<any> {
    const dailyTokens = parseInt((await this.redis.get(`tokens:openai:daily:${today}`)) || '0');
    const dailyCostRaw = parseInt((await this.redis.get(`cost:openai:daily:${today}`)) || '0');
    const dailyCost = dailyCostRaw / 10000;

    // Get monthly totals from database
    const monthlyQuery = `
      SELECT
        COUNT(*) as total_calls,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        SUM(CASE WHEN metadata->>'model' = 'gpt-4' THEN 1 ELSE 0 END) as gpt4_calls,
        SUM(CASE WHEN metadata->>'model' = 'gpt-3.5-turbo' THEN 1 ELSE 0 END) as gpt35_calls
      FROM api_call_logs
      WHERE service = 'openai'
      AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)
    `;

    const monthlyResult = await database.query(monthlyQuery);
    const monthlyData = monthlyResult.rows[0];

    return {
      totalCalls: parseInt(monthlyData.total_calls) || 0,
      totalTokens: parseInt(monthlyData.total_tokens) || 0,
      totalCost: parseFloat(monthlyData.total_cost) || 0,
      dailyCost: dailyCost,
      monthlyCost: parseFloat(monthlyData.total_cost) || 0,
      gpt4Calls: parseInt(monthlyData.gpt4_calls) || 0,
      gpt35Calls: parseInt(monthlyData.gpt35_calls) || 0
    };
  }

  private async getSpotifyStats(today: string): Promise<any> {
    const dailyCalls = parseInt((await this.redis.get(`usage:spotify:daily:${today}`)) || '0');
    const currentHour = new Date().getHours();
    const hourlyCalls = parseInt((await this.redis.get(`usage:spotify:hourly:${today}:${currentHour}`)) || '0');

    return {
      totalCalls: dailyCalls,
      dailyCalls: dailyCalls,
      hourlyCalls: hourlyCalls,
      remainingQuota: Math.max(0, this.PRICING.spotify.rateLimit - hourlyCalls),
      quotaResetTime: new Date(Date.now() + (60 - new Date().getMinutes()) * 60000)
    };
  }

  private async getYouTubeStats(today: string): Promise<any> {
    const dailyQuotaUsed = parseInt((await this.redis.get(`usage:youtube:daily:${today}`)) || '0');

    return {
      totalCalls: dailyQuotaUsed,
      dailyQuotaUsed: dailyQuotaUsed,
      remainingQuota: Math.max(0, this.PRICING.youtube.dailyQuota - dailyQuotaUsed),
      quotaResetTime: new Date(new Date().setHours(24, 0, 0, 0))
    };
  }

  private async getDatabaseStats(today: string): Promise<any> {
    const dailyQueries = parseInt((await this.redis.get(`usage:database:daily:${today}`)) || '0');

    // Get storage estimate
    const storageQuery = `
      SELECT
        pg_size_pretty(pg_database_size(current_database())) as size,
        COUNT(*) as total_tables
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const storageResult = await database.query(storageQuery);

    return {
      totalQueries: dailyQueries,
      dailyQueries: dailyQueries,
      estimatedStorageUsage: storageResult.rows[0]?.size || 'Unknown',
      connectionPoolStats: {
        // This would come from your PostgreSQL connection pool
        total: 20,
        idle: 15,
        waiting: 0
      }
    };
  }

  private async getRedisStats(today: string): Promise<any> {
    const dailyRequests = parseInt((await this.redis.get(`usage:redis:daily:${today}`)) || '0');

    return {
      totalRequests: dailyRequests,
      dailyRequests: dailyRequests,
      memoryUsage: 0, // Would get from Redis INFO command
      hitRate: 95.5 // Would calculate from hit/miss ratios
    };
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const stats = await this.getCurrentUsageStats();

    const dailyCost = stats.openai.dailyCost;
    const monthlyCost = stats.openai.monthlyCost;

    // Project monthly cost based on current daily average
    const daysInMonth = new Date().getDate();
    const projectedMonthlyCost = (dailyCost / daysInMonth) * 30;

    const alerts: string[] = [];

    // Generate alerts
    if (projectedMonthlyCost > 50) {
      alerts.push(`⚠️ Projected monthly cost: $${projectedMonthlyCost.toFixed(2)}`);
    }

    if (stats.spotify.hourlyCalls > this.PRICING.spotify.rateLimit * 0.8) {
      alerts.push('⚠️ Spotify API approaching hourly rate limit');
    }

    if (stats.youtube.dailyQuotaUsed > this.PRICING.youtube.dailyQuota * 0.8) {
      alerts.push('⚠️ YouTube API approaching daily quota limit');
    }

    return {
      totalDailyCost: dailyCost,
      totalMonthlyCost: monthlyCost,
      projectedMonthlyCost,
      breakdown: {
        openai: {
          cost: monthlyCost,
          percentage: 100 // All costs are OpenAI for now
        },
        infrastructure: {
          cost: 0,
          percentage: 0 // Free tiers
        }
      },
      alerts
    };
  }

  private async checkUsageAlerts(callLog: ApiCallLog): Promise<void> {
    // This method would check against configured thresholds and send notifications
    // Implementation would depend on notification preferences (email, webhook, etc.)
  }

  async getUsageHistory(days: number = 30): Promise<any[]> {
    const query = `
      SELECT
        DATE(timestamp) as date,
        service,
        COUNT(*) as calls,
        SUM(tokens_used) as tokens,
        SUM(cost_usd) as cost
      FROM api_call_logs
      WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(timestamp), service
      ORDER BY date DESC, service
    `;

    const result = await database.query(query);
    return result.rows;
  }
}