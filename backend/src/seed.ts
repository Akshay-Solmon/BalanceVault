import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

async function seed() {
  console.log('[Seed] Seeding sample demonstration data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Sample Account Holder A (Approved with Account and Ledger)
  const userA = await prisma.user.upsert({
    where: { email: 'alice.holder@example.com' },
    update: {},
    create: {
      email: 'alice.holder@example.com',
      passwordHash,
      role: 'ACCOUNT_HOLDER',
      status: 'ACTIVE',
      onboarding: {
        create: {
          legalFullName: 'Alice Holder (Synthetic)',
          entityType: 'INDIVIDUAL',
          jurisdiction: 'US',
          taxIdMasked: 'SYN-884-1029',
          expectedAnnualVolume: '$25,000 - $100,000',
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerNotes: 'Auto-approved for demonstration environment',
        },
      },
      account: {
        create: {
          accountNumber: 'BV-4902-8811',
          currency: 'USD',
          balance: 2500.0,
          status: 'ACTIVE',
          ledgerEntries: {
            create: [
              {
                entryType: 'CREDIT',
                amount: 2500.0,
                balanceAfter: 2500.0,
                reference: 'INITIAL_DEMO_GRANT',
                notes: 'Welcome demonstration credit',
              },
            ],
          },
        },
      },
    },
  });

  // 2. Create Sample Account Holder B (Pending Onboarding Review)
  const userB = await prisma.user.upsert({
    where: { email: 'bob.applicant@example.com' },
    update: {},
    create: {
      email: 'bob.applicant@example.com',
      passwordHash,
      role: 'ACCOUNT_HOLDER',
      status: 'PENDING_ONBOARDING',
      onboarding: {
        create: {
          legalFullName: 'Bob Applicant (Synthetic Corp)',
          entityType: 'BUSINESS',
          jurisdiction: 'CA',
          taxIdMasked: 'SYN-441-9920',
          expectedAnnualVolume: '$100,000+',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      },
    },
  });

  // 3. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: userA.id,
      actorEmail: userA.email,
      actorRole: 'SYSTEM_SEED',
      action: 'ENVIRONMENT_SEEDED',
      targetType: 'SYSTEM',
      targetId: 'SEED_RUN',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
      metadata: JSON.stringify({
        sampleUsers: ['alice.holder@example.com', 'bob.applicant@example.com'],
      }),
    },
  });

  console.log('[Seed] Demonstration data successfully loaded!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
