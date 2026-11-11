import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// Apply auth and admin RBAC check to ALL routes in this file (FR-2, FR-3, FR-15)
router.use(authenticate, requireRole('ADMIN'));

// FR-9: List all users with profiles and accounts
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        onboarding: true,
        account: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users, count: users.length, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Update User Status (Suspend / Reactivate)
router.patch('/users/:id/status', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED', 'PENDING_ONBOARDING'].includes(status)) {
    res.status(400).json({ error: 'INVALID_STATUS', message: 'Status must be ACTIVE, SUSPENDED, or PENDING_ONBOARDING.' });
    return;
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Target user does not exist.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      req,
      action: 'USER_STATUS_CHANGE',
      targetType: 'USER',
      targetId: id,
      outcome: 'SUCCESS',
      metadata: {
        previousStatus: targetUser.status,
        newStatus: status,
      },
    });

    res.json({ user: updated, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// FR-10: List all onboarding submissions (with status filter)
router.get('/onboarding', async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    const whereClause: any = {};
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const submissions = await prisma.onboardingProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, status: true, role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ submissions, count: submissions.length, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// FR-10 & FR-8: Review Onboarding Decision (Approve or Reject)
router.post('/onboarding/:id/decision', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { decision, notes } = req.body; // decision: 'APPROVE' | 'REJECT'

  if (!['APPROVE', 'REJECT'].includes(decision)) {
    res.status(400).json({ error: 'INVALID_DECISION', message: 'Decision must be APPROVE or REJECT.' });
    return;
  }

  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Onboarding submission not found.' });
      return;
    }

    const newProfileStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const now = new Date();

    if (decision === 'APPROVE') {
      // Execute atomic account provisioning and status activation (FR-8)
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update Onboarding Profile
        const updatedProfile = await tx.onboardingProfile.update({
          where: { id },
          data: {
            status: newProfileStatus,
            reviewedAt: now,
            reviewerId: req.user!.id,
            reviewerNotes: notes || 'Approved by system administrator.',
          },
        });

        // 2. Activate User
        await tx.user.update({
          where: { id: profile.userId },
          data: { status: 'ACTIVE' },
        });

        // 3. Create Account if not already existing
        const existingAccount = await tx.account.findUnique({
          where: { userId: profile.userId },
        });

        let account = existingAccount;
        if (!account) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const accountNumber = `BV-10${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;

          account = await tx.account.create({
            data: {
              userId: profile.userId,
              accountNumber,
              currency: 'USD',
              balance: 1000.0, // Synthetic initial balance grant
              status: 'ACTIVE',
            },
          });

          // 4. Initial Ledger Entry (Credit)
          await tx.ledgerEntry.create({
            data: {
              accountId: account.id,
              entryType: 'CREDIT',
              amount: 1000.0,
              balanceAfter: 1000.0,
              reference: 'INITIAL_DEMO_GRANT',
              notes: 'Initial synthetic demonstration balance grant',
            },
          });
        }

        return { updatedProfile, account };
      });

      await recordAuditLog({
        req,
        action: 'ONBOARDING_DECISION',
        targetType: 'ONBOARDING',
        targetId: id,
        outcome: 'SUCCESS',
        metadata: {
          decision: 'APPROVED',
          accountNumber: result.account.accountNumber,
          initialBalance: result.account.balance,
          notes,
        },
      });

      res.json({
        success: true,
        message: 'Onboarding approved. Account and ledger provisioned.',
        profile: result.updatedProfile,
        account: result.account,
        syntheticDataOnly: true,
      });
    } else {
      // Rejection path
      const updatedProfile = await prisma.onboardingProfile.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: now,
          reviewerId: req.user!.id,
          reviewerNotes: notes || 'Rejected by administrator.',
        },
      });

      await recordAuditLog({
        req,
        action: 'ONBOARDING_DECISION',
        targetType: 'ONBOARDING',
        targetId: id,
        outcome: 'SUCCESS',
        metadata: {
          decision: 'REJECTED',
          notes,
        },
      });

      res.json({
        success: true,
        message: 'Onboarding submission rejected.',
        profile: updatedProfile,
        syntheticDataOnly: true,
      });
    }
  } catch (err: any) {
    console.error('[Admin] Onboarding decision error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to process decision.' });
  }
});

// FR-11 & FR-15: View and Filter Audit Logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  const { action, actorEmail, outcome, limit } = req.query;

  try {
    const whereClause: any = {};
    if (action && typeof action === 'string') {
      whereClause.action = action;
    }
    if (actorEmail && typeof actorEmail === 'string') {
      whereClause.actorEmail = { contains: actorEmail.toLowerCase() };
    }
    if (outcome && typeof outcome === 'string') {
      whereClause.outcome = outcome;
    }

    const takeLimit = limit ? Math.min(parseInt(limit as string, 10), 200) : 100;

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: takeLimit,
    });

    res.json({ logs, count: logs.length, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

export default router;
