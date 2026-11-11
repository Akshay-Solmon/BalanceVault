import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { recordAuditLog } from '../middleware/audit.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Check if first-admin bootstrap is required or already completed
router.get('/status', async (req: Request, res: Response) => {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const isBootstrapped = adminCount > 0;
    res.json({
      isBootstrapped,
      adminCount,
      syntheticDataOnly: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
});

// FR-12: Controlled first-administrator bootstrap
router.post(
  '/admin',
  rateLimiter({ limit: 5, windowSeconds: 60, isSensitiveAuthRoute: true }),
  async (req: Request, res: Response) => {
    const { email, password, bootstrapToken } = req.body;

    // Verify bootstrap token (enforces bootstrap-operator identity)
    const tokenProvided = bootstrapToken || req.headers['x-bootstrap-token'];
    if (tokenProvided !== config.bootstrapToken) {
      await recordAuditLog({
        req,
        actorEmail: email || 'UNKNOWN',
        actorRole: 'BOOTSTRAP_OPERATOR',
        action: 'ADMIN_BOOTSTRAP_ATTEMPT',
        targetType: 'SYSTEM',
        targetId: 'BOOTSTRAP',
        outcome: 'DENIED',
        metadata: { reason: 'Invalid or missing bootstrap operator token' },
      });

      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Invalid bootstrap operator credentials. First-admin creation restricted.',
      });
      return;
    }

    if (!email || !password || password.length < 8) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Valid email and a secure password (at least 8 characters) are required.',
      });
      return;
    }

    try {
      // Check if an administrator already exists
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (existingAdmin) {
        await recordAuditLog({
          req,
          actorEmail: email,
          actorRole: 'BOOTSTRAP_OPERATOR',
          action: 'ADMIN_BOOTSTRAP_ATTEMPT',
          targetType: 'SYSTEM',
          targetId: 'BOOTSTRAP',
          outcome: 'FAILURE',
          metadata: { reason: 'System already bootstrapped. Secondary admin must be created by existing admin.' },
        });

        res.status(409).json({
          error: 'FIRST_ADMIN_ALREADY_EXISTS',
          message: 'The initial administrator has already been provisioned for BalanceVault.',
        });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const cleanEmail = email.toLowerCase().trim();

      // Create Admin User
      const adminUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      // Record system bootstrap state
      await prisma.systemBootstrap.create({
        data: {
          isBootstrapped: true,
          bootstrappedAt: new Date(),
          adminUserId: adminUser.id,
        },
      });

      // FR-13: Audit log record
      await recordAuditLog({
        req,
        actorId: adminUser.id,
        actorEmail: cleanEmail,
        actorRole: 'BOOTSTRAP_OPERATOR',
        action: 'ADMIN_BOOTSTRAP',
        targetType: 'USER',
        targetId: adminUser.id,
        outcome: 'SUCCESS',
        metadata: {
          message: 'First administrator successfully bootstrapped via secure operator channel',
        },
      });

      res.status(201).json({
        success: true,
        message: 'First administrator successfully bootstrapped.',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          status: adminUser.status,
        },
        syntheticDataOnly: true,
      });
    } catch (err: any) {
      console.error('[Bootstrap] Error bootstrapping admin:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to complete administrator bootstrap.',
      });
    }
  }
);

export default router;
