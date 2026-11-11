import { Request, Response, NextFunction } from 'express';
import { incrementRateLimit, isRedisConnected } from '../redis.js';
import { config } from '../config.js';

export interface RateLimiterOptions {
  limit?: number;
  windowSeconds?: number;
  isSensitiveAuthRoute?: boolean;
}

export function rateLimiter(options: RateLimiterOptions = {}) {
  const limit = options.limit || 30;
  const windowSeconds = options.windowSeconds || 60;
  const isSensitive = options.isSensitiveAuthRoute || false;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // If route is sensitive and fail-closed is configured and Redis is down:
    if (isSensitive && config.redisFailClosedOnAuth && !isRedisConnected) {
      res.status(503).json({
        error: 'SERVICE_DEGRADED',
        message: 'Security subsystem is in fail-closed mode due to cache partitioning. Sensitive operations temporarily unavailable.',
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${clientIp}`;

    try {
      const result = await incrementRateLimit(key, limit, windowSeconds);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - result.totalHits).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000).toString());

      if (!result.allowed) {
        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please throttle your requests.',
          retryAfterSeconds: Math.ceil((result.resetTimeMs - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (err) {
      // In case of unexpected error, if sensitive and fail closed, reject; else continue
      if (isSensitive && config.redisFailClosedOnAuth) {
        res.status(503).json({
          error: 'RATE_LIMIT_ERROR',
          message: 'Unable to evaluate security rate-limits.',
        });
        return;
      }
      next();
    }
  };
}
