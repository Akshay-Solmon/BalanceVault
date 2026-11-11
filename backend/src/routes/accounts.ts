import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// GET /api/accounts/me - Get Account & Ledger Entries for current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.account.findUnique({
      where: { userId: req.user!.id },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      res.status(404).json({
        error: 'ACCOUNT_NOT_PROVISIONED',
        message: 'No active ledger account found. Complete onboarding approval first.',
      });
      return;
    }

    res.json({ account, syntheticDataOnly: true });
  } catch (err: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// POST /api/accounts/transfer - Auditable Simulated Money Movement (Demo)
router.post('/transfer', authenticate, async (req: Request, res: Response) => {
  const { recipientAccountNumber, amount, note } = req.body;
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400).json({ error: 'INVALID_AMOUNT', message: 'Transfer amount must be a positive number.' });
    return;
  }

  try {
    const senderAccount = await prisma.account.findUnique({
      where: { userId: req.user!.id },
    });

    if (!senderAccount) {
      res.status(403).json({ error: 'NO_ACCOUNT', message: 'Sender does not have an active ledger account.' });
      return;
    }

    if (senderAccount.status !== 'ACTIVE') {
      res.status(403).json({ error: 'ACCOUNT_RESTRICTED', message: `Sender account status is ${senderAccount.status}.` });
      return;
    }

    if (senderAccount.balance < numericAmount) {
      await recordAuditLog({
        req,
        action: 'TRANSFER_ATTEMPT',
        targetType: 'ACCOUNT',
        targetId: senderAccount.id,
        outcome: 'FAILURE',
        metadata: {
          reason: 'INSUFFICIENT_FUNDS',
          requestedAmount: numericAmount,
          availableBalance: senderAccount.balance,
        },
      });

      res.status(400).json({ error: 'INSUFFICIENT_FUNDS', message: 'Insufficient ledger balance for this transfer.' });
      return;
    }

    const cleanRecipient = recipientAccountNumber?.trim();
    if (!cleanRecipient) {
      res.status(400).json({ error: 'INVALID_RECIPIENT', message: 'Recipient account number is required.' });
      return;
    }

    if (cleanRecipient === senderAccount.accountNumber) {
      res.status(400).json({ error: 'INVALID_RECIPIENT', message: 'Self-transfers are not permitted.' });
      return;
    }

    const recipientAccount = await prisma.account.findUnique({
      where: { accountNumber: cleanRecipient },
    });

    if (!recipientAccount) {
      res.status(404).json({ error: 'RECIPIENT_NOT_FOUND', message: 'Recipient account number not found.' });
      return;
    }

    // Execute atomic balance transfer & double-entry ledger update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Debit Sender
      const senderNewBalance = senderAccount.balance - numericAmount;
      await tx.account.update({
        where: { id: senderAccount.id },
        data: { balance: senderNewBalance },
      });

      const debitEntry = await tx.ledgerEntry.create({
        data: {
          accountId: senderAccount.id,
          entryType: 'DEBIT',
          amount: numericAmount,
          balanceAfter: senderNewBalance,
          reference: 'P2P_TRANSFER_OUT',
          counterpartyAccount: recipientAccount.accountNumber,
          notes: note || 'Synthetic money movement demo',
        },
      });

      // 2. Credit Recipient
      const recipientNewBalance = recipientAccount.balance + numericAmount;
      await tx.account.update({
        where: { id: recipientAccount.id },
        data: { balance: recipientNewBalance },
      });

      const creditEntry = await tx.ledgerEntry.create({
        data: {
          accountId: recipientAccount.id,
          entryType: 'CREDIT',
          amount: numericAmount,
          balanceAfter: recipientNewBalance,
          reference: 'P2P_TRANSFER_IN',
          counterpartyAccount: senderAccount.accountNumber,
          notes: note || 'Synthetic money movement demo',
        },
      });

      return { senderNewBalance, debitEntry };
    });

    // Record audit log for transfer
    await recordAuditLog({
      req,
      action: 'TRANSFER_EXECUTE',
      targetType: 'ACCOUNT',
      targetId: senderAccount.id,
      outcome: 'SUCCESS',
      metadata: {
        amount: numericAmount,
        recipient: recipientAccount.accountNumber,
        newBalance: result.senderNewBalance,
        ledgerEntryId: result.debitEntry.id,
      },
    });

    res.json({
      success: true,
      message: 'Transfer successfully settled to ledger.',
      newBalance: result.senderNewBalance,
      ledgerEntry: result.debitEntry,
      syntheticDataOnly: true,
    });
  } catch (err: any) {
    console.error('[Account] Transfer error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Transfer failed.' });
  }
});

export default router;
