import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import bootstrapRoutes from './routes/bootstrap.js';
import onboardingRoutes from './routes/onboarding.js';
import accountsRoutes from './routes/accounts.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security & Demo Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Synthetic-Data', 'true');
  res.setHeader('X-Application-Scope', 'Demonstration-Only-No-Real-Funds');
  next();
});

// Middleware
app.use(cors({
  origin: [
    config.corsOrigin,
    'https://balance-vault-three.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bootstrap', bootstrapRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/admin', adminRoutes);

// Root Index
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'BalanceVault Backend API',
    version: '0.1.0',
    status: 'OPERATIONAL',
    disclaimer: 'Hackathon demonstration build. Synthetic data only. Not for handling real funds.',
    endpoints: {
      health: '/health',
      readiness: '/ready',
      bootstrapStatus: '/api/bootstrap/status',
      auth: '/api/auth',
      onboarding: '/api/onboarding',
      accounts: '/api/accounts',
      admin: '/api/admin',
    },
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Resource '${req.method} ${req.path}' does not exist on BalanceVault API.`,
  });
});

// Global Error Handler (FR-4: Consistent, non-leaking errors)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ServerError]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: config.env === 'production'
      ? 'An unexpected error occurred. Please contact the administrator.'
      : (err.message || 'Server error'),
    syntheticDataOnly: true,
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`BalanceVault API is listening on port ${config.port}`);
    console.log(`Environment: ${config.env}`);
    console.log(`Synthetic Data Scope: Active (No real funds)`);
    console.log(`=======================================================`);
  });
}

export default app;
