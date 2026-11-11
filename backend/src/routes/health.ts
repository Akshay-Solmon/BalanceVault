import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db.js';
import { checkRedisConnection } from '../redis.js';

const router = Router();
const startTime = Date.now();

// FR-16: Liveness Probe
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'BalanceVault API',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    syntheticDataOnly: true,
  });
});

// FR-17: Readiness Probe
router.get('/ready', async (req: Request, res: Response) => {
  const [dbOk, redisOk] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const allDependenciesReady = dbOk; // Postgres is required; Redis can operate in fallback mode for demo
  const statusCode = allDependenciesReady ? 200 : 503;

  res.status(statusCode).json({
    status: allDependenciesReady ? 'READY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: {
        status: dbOk ? 'CONNECTED' : 'DISCONNECTED',
        required: true,
      },
      redisCache: {
        status: redisOk ? 'CONNECTED' : 'IN_MEMORY_FALLBACK',
        required: false,
      },
    },
    syntheticDataOnly: true,
  });
});

export default router;
