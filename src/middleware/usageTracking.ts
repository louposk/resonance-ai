import { MonitoringService, ApiCallLog } from '../services/MonitoringService';

export class UsageTracker {
  private static monitoringService = new MonitoringService();

  static trackOpenAICall(
    endpoint: string,
    model: 'gpt-4' | 'gpt-3.5-turbo',
    inputTokens: number,
    outputTokens: number,
    responseTimeMs: number,
    statusCode: number,
    errorMessage?: string
  ): void {
    const cost = this.calculateOpenAICost(model, inputTokens, outputTokens);

    const callLog: ApiCallLog = {
      service: 'openai',
      endpoint,
      method: 'POST',
      tokens_used: inputTokens + outputTokens,
      cost_usd: cost,
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      metadata: {
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens
      },
      timestamp: new Date()
    };

    this.monitoringService.logApiCall(callLog).catch(error => {
      console.error('Failed to track OpenAI call:', error);
    });
  }

  static trackSpotifyCall(
    endpoint: string,
    method: string,
    responseTimeMs: number,
    statusCode: number,
    errorMessage?: string
  ): void {
    const callLog: ApiCallLog = {
      service: 'spotify',
      endpoint,
      method,
      quota_units_used: 1, // Each Spotify API call uses 1 request unit
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      timestamp: new Date()
    };

    this.monitoringService.logApiCall(callLog).catch(error => {
      console.error('Failed to track Spotify call:', error);
    });
  }

  static trackYouTubeCall(
    endpoint: string,
    quotaUnitsUsed: number, // Search = 100 units, Videos = 1 unit
    responseTimeMs: number,
    statusCode: number,
    errorMessage?: string
  ): void {
    const callLog: ApiCallLog = {
      service: 'youtube',
      endpoint,
      method: 'GET',
      quota_units_used: quotaUnitsUsed,
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      timestamp: new Date()
    };

    this.monitoringService.logApiCall(callLog).catch(error => {
      console.error('Failed to track YouTube call:', error);
    });
  }

  static trackDatabaseCall(
    query: string,
    responseTimeMs: number,
    statusCode: number = 200,
    errorMessage?: string
  ): void {
    const callLog: ApiCallLog = {
      service: 'database',
      endpoint: this.sanitizeQuery(query),
      method: this.extractQueryType(query),
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      timestamp: new Date()
    };

    this.monitoringService.logApiCall(callLog).catch(error => {
      console.error('Failed to track database call:', error);
    });
  }

  static trackRedisCall(
    command: string,
    responseTimeMs: number,
    statusCode: number = 200,
    errorMessage?: string
  ): void {
    const callLog: ApiCallLog = {
      service: 'redis',
      endpoint: command.toLowerCase(),
      method: 'EXEC',
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      timestamp: new Date()
    };

    this.monitoringService.logApiCall(callLog).catch(error => {
      console.error('Failed to track Redis call:', error);
    });
  }

  private static calculateOpenAICost(
    model: 'gpt-4' | 'gpt-3.5-turbo',
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };

    const rates = pricing[model];
    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;

    return inputCost + outputCost;
  }

  private static sanitizeQuery(query: string): string {
    // Remove sensitive data from query for logging
    return query
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES (...)')
      .replace(/=\s*'[^']*'/gi, "= '***'")
      .replace(/=\s*"[^"]*"/gi, '= "***"')
      .substring(0, 100);
  }

  private static extractQueryType(query: string): string {
    const match = query.trim().match(/^(\w+)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }
}

// Enhanced service wrappers with automatic tracking
export class TrackedAIService {
  static async makeOpenAICall(
    originalCall: () => Promise<any>,
    model: 'gpt-4' | 'gpt-3.5-turbo',
    estimatedInputTokens: number
  ): Promise<any> {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;
    let outputTokens = 0;

    try {
      const response = await originalCall();

      // Estimate output tokens (roughly)
      if (response.data?.choices?.[0]?.message?.content) {
        const content = response.data.choices[0].message.content;
        outputTokens = Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
      }

      return response;
    } catch (error: any) {
      statusCode = error.response?.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      UsageTracker.trackOpenAICall(
        '/chat/completions',
        model,
        estimatedInputTokens,
        outputTokens,
        responseTime,
        statusCode,
        errorMessage
      );
    }
  }
}

export class TrackedSpotifyService {
  static async makeSpotifyCall(
    originalCall: () => Promise<any>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<any> {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      const response = await originalCall();
      return response;
    } catch (error: any) {
      statusCode = error.response?.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      UsageTracker.trackSpotifyCall(endpoint, method, responseTime, statusCode, errorMessage);
    }
  }
}

export class TrackedYouTubeService {
  static async makeYouTubeCall(
    originalCall: () => Promise<any>,
    endpoint: string,
    quotaUnits: number = 1
  ): Promise<any> {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      const response = await originalCall();
      return response;
    } catch (error: any) {
      statusCode = error.response?.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      UsageTracker.trackYouTubeCall(endpoint, quotaUnits, responseTime, statusCode, errorMessage);
    }
  }
}