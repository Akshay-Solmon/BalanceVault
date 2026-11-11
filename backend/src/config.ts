import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisFailClosedOnAuth: process.env.REDIS_FAIL_CLOSED_ON_AUTH === 'true',
  jwtSecret: process.env.JWT_SECRET || 'balancevault-default-demo-jwt-secret-key-32chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bootstrapToken: process.env.BOOTSTRAP_TOKEN || 'bv_operator_secure_bootstrap_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
