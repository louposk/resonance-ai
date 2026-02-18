import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
    },
    keyGenerator: options.keyGenerator || ((req: Request) => {
      return req.ip || 'unknown';
    }),
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

export const apiKeyBasedRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for API key users
  keyGenerator: (req: any) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
  },
  message: 'API rate limit exceeded. Please check your usage or upgrade your plan.'
});

export const searchRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  keyGenerator: (req: any) => {
    const apiKey = req.headers['x-api-key'];
    const userId = req.user?.id;
    return apiKey ? `search:apikey:${apiKey}` : userId ? `search:user:${userId}` : `search:ip:${req.ip}`;
  },
  message: 'Search rate limit exceeded. Please slow down your requests.'
});

export const analysisRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 analysis requests per 5 minutes
  keyGenerator: (req: any) => {
    const apiKey = req.headers['x-api-key'];
    const userId = req.user?.id;
    return apiKey ? `analysis:apikey:${apiKey}` : userId ? `analysis:user:${userId}` : `analysis:ip:${req.ip}`;
  },
  message: 'Analysis rate limit exceeded. AI analysis is resource-intensive, please wait before requesting more.'
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req: Request) => `auth:${req.ip}`,
  message: 'Too many authentication attempts, please try again later.'
});

export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes for general endpoints
  message: 'General rate limit exceeded.'
});