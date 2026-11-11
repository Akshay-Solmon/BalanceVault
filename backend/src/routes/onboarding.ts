import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// Get Onboarding Details for authenticated user
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No onboarding profile found.' });
      return;
    }

    res.json({ profile, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Update Onboarding Details (Draft)
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  const { legalFullName, entityType, jurisdiction, taxIdMasked, expectedAnnualVolume } = req.body;

  try {
    const existing = await prisma.onboardingProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (existing && ['APPROVED', 'SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      res.status(400).json({
        error: 'STATE_LOCKED',
        message: `Cannot edit profile while in ${existing.status} status.`,
      });
      return;
    }

    const updated = await prisma.onboardingProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        legalFullName: legalFullName || existing?.legalFullName || 'Synthetic Account Holder',
        entityType: entityType || 'INDIVIDUAL',
        jurisdiction: jurisdiction || 'US',
        taxIdMasked: taxIdMasked || 'SYN-XXX-1234',
        expectedAnnualVolume: expectedAnnualVolume || '$10,000 - $50,000',
      },
      create: {
        userId: req.user!.id,
        legalFullName: legalFullName || 'Synthetic Account Holder',
        entityType: entityType || 'INDIVIDUAL',
        jurisdiction: jurisdiction || 'US',
        taxIdMasked: taxIdMasked || 'SYN-XXX-1234',
        expectedAnnualVolume: expectedAnnualVolume || '$10,000 - $50,000',
        status: 'DRAFT',
      },
    });

    await recordAuditLog({
      req,
      action: 'ONBOARDING_DRAFT_UPDATE',
      targetType: 'ONBOARDING',
      targetId: updated.id,
      outcome: 'SUCCESS',
      metadata: { status: updated.status },
    });

    res.json({ profile: updated, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// FR-6 & FR-7: Submit Onboarding for Review
router.post('/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Please create an onboarding profile first.' });
      return;
    }

    if (profile.status === 'APPROVED') {
      res.status(400).json({ error: 'ALREADY_APPROVED', message: 'Account is already approved and active.' });
      return;
    }

    if (profile.status === 'SUBMITTED' || profile.status === 'UNDER_REVIEW') {
      res.status(400).json({ error: 'ALREADY_SUBMITTED', message: 'Onboarding is already submitted and pending review.' });
      return;
    }

    const updated = await prisma.onboardingProfile.update({
      where: { id: profile.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await recordAuditLog({
      req,
      action: 'ONBOARDING_SUBMIT',
      targetType: 'ONBOARDING',
      targetId: updated.id,
      outcome: 'SUCCESS',
      metadata: {
        previousStatus: profile.status,
        newStatus: 'SUBMITTED',
      },
    });

    res.json({
      message: 'Onboarding submission received. Awaiting administrator review.',
      profile: updated,
      syntheticDataOnly: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

export default router;
