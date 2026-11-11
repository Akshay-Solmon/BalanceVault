import Redis from 'ioredis';
import { config } from './config.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

// Fallback in-memory rate limit store for local dev or when Redis is not running
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop reconnecting after 3 tries if unavailable
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Connected successfully to Redis.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress spam in local demo if no Redis is running
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });

  // Attempt initial connect
  redisClient.connect().catch(() => {
    isRedisConnected = false;
    console.log('[Redis] Redis not reachable; rate-limiter running with in-memory fallback.');
  });
} catch (err) {
  isRedisConnected = false;
}

export async function checkRedisConnection(): Promise<boolean> {
  if (!redisClient || !isRedisConnected) return false;
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  totalHits: number;
  resetTimeMs: number;
  isFallback: boolean;
}

export async function incrementRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const fullKey = `bv:ratelimit:${key}`;
  const now = Date.now();

  if (isRedisConnected && redisClient) {
    try {
      const current = await redisClient.incr(fullKey);
      if (current === 1) {
        await redisClient.expire(fullKey, windowSeconds);
      }
      const ttl = await redisClient.ttl(fullKey);
      return {
        allowed: current <= limit,
        totalHits: current,
        resetTimeMs: now + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000),
        isFallback: false,
      };
    } catch (err) {
      isRedisConnected = false;
    }
  }

  // In-memory fallback
  const record = memoryStore.get(fullKey);
  if (!record || now > record.expiresAt) {
    const expiresAt = now + windowSeconds * 1000;
    memoryStore.set(fullKey, { count: 1, expiresAt });
    return {
      allowed: true,
      totalHits: 1,
      resetTimeMs: expiresAt,
      isFallback: true,
    };
  }

  record.count += 1;
  return {
    allowed: record.count <= limit,
    totalHits: record.count,
    resetTimeMs: record.expiresAt,
    isFallback: true,
  };
}

export { redisClient, isRedisConnected };
