import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// FR-5: Visitor registers as an Account Holder
router.post(
  '/register',
  rateLimiter({ limit: 10, windowSeconds: 60, isSensitiveAuthRoute: true }),
  async (req: Request, res: Response) => {
    const { email, password, legalFullName } = req.body;

    if (!email || !password || password.length < 8) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'A valid email and password (minimum 8 characters) are required.',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        // FR-4: Do not leak detailed internal user enumeration
        res.status(400).json({
          error: 'REGISTRATION_FAILED',
          message: 'An account with this email cannot be registered.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: 'ACCOUNT_HOLDER',
          status: 'PENDING_ONBOARDING',
          onboarding: {
            create: {
              legalFullName: legalFullName?.trim() || cleanEmail.split('@')[0],
              entityType: 'INDIVIDUAL',
              jurisdiction: 'US',
              taxIdMasked: 'SYNTHETIC-XXX-0000',
              expectedAnnualVolume: '$10,000 - $50,000',
              status: 'DRAFT',
            },
          },
        },
        include: {
          onboarding: true,
        },
      });

      await recordAuditLog({
        req,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'AUTH_REGISTER',
        targetType: 'USER',
        targetId: user.id,
        outcome: 'SUCCESS',
        metadata: {
          status: user.status,
          onboardingStatus: user.onboarding?.status,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, status: user.status },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          onboardingStatus: user.onboarding?.status,
        },
        syntheticDataOnly: true,
      });
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Could not complete account registration.',
      });
    }
  }
);

// FR-1: Sign In
router.post(
  '/login',
  rateLimiter({ limit: 10, windowSeconds: 60, isSensitiveAuthRoute: true }),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          onboarding: true,
          account: true,
        },
      });

      if (!user) {
        await recordAuditLog({
          req,
          actorEmail: cleanEmail,
          actorRole: 'ANONYMOUS',
          action: 'AUTH_LOGIN',
          targetType: 'USER',
          targetId: cleanEmail,
          outcome: 'FAILURE',
          metadata: { reason: 'User not found' },
        });

        res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        await recordAuditLog({
          req,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'AUTH_LOGIN',
          targetType: 'USER',
          targetId: user.id,
          outcome: 'FAILURE',
          metadata: { reason: 'Password mismatch' },
        });

        res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
        return;
      }

      await recordAuditLog({
        req,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'AUTH_LOGIN',
        targetType: 'USER',
        targetId: user.id,
        outcome: 'SUCCESS',
        metadata: { role: user.role, status: user.status },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, status: user.status },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          onboardingStatus: user.onboarding?.status || null,
          accountNumber: user.account?.accountNumber || null,
        },
        syntheticDataOnly: true,
      });
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Sign in service encountered an error.',
      });
    }
  }
);

// Get Current User Profile & Status
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        onboarding: true,
        account: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User does not exist.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        onboarding: user.onboarding,
        account: user.account ? {
          id: user.account.id,
          accountNumber: user.account.accountNumber,
          currency: user.account.currency,
          balance: user.account.balance,
          status: user.account.status,
        } : null,
      },
      syntheticDataOnly: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

export default router;
