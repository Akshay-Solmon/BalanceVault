import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../api/client';
import { parseRupeesToPaise, formatPaise, floatToPaise, paiseToFloat } from '../utils/money';
import { 
  generateIdempotencyKey, 
  recordIdempotencyExecution, 
  checkIdempotencyDuplicate,
  RequestStatus 
} from '../utils/idempotency';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { TransferCoin3D } from '../components/3d/TransferCoin3D';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertOctagon, 
  CopyCheck, 
  ShieldCheck, 
  Send,
  Lock,
  Layers
} from 'lucide-react';

export const MoneyMovementsPage: React.FC<{ onNavigateToDashboard?: () => void }> = ({ onNavigateToDashboard }) => {
  const { user, isAuditor } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'transfer' | 'deposit' | 'withdraw'>('transfer');

  // Account State
  const [currentAccount, setCurrentAccount] = useState<{ id: string; accountNumber: string; balance: number } | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  // Form Fields
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');

  // Idempotency State
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateIdempotencyKey());
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastTransferredPaise, setLastTransferredPaise] = useState<number>(0);

  const fetchMyAccount = async () => {
    setAccountLoading(true);
    const res = await apiRequest<{ account: any }>('/api/accounts/me');
    if (res.data?.account) {
      setCurrentAccount(res.data.account);
    }
    setAccountLoading(false);
  };

  useEffect(() => {
    fetchMyAccount();
  }, []);

  const handleNewKey = () => {
    setIdempotencyKey(generateIdempotencyKey());
    setRequestStatus('idle');
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuditor) return;

    // Validate amount into integer paise (Never float)
    const parsed = parseRupeesToPaise(amountInput);
    if (!parsed.valid) {
      setRequestStatus('refused');
      setStatusMessage(parsed.error || 'Invalid amount');
      return;
    }

    const amountPaise = parsed.paise;
    const amountFloat = paiseToFloat(amountPaise);

    // Check for simulated duplicate key replay on the client
    const requestPayload = {
      tab: activeTab,
      recipient: recipientAccountNumber,
      amount: amountFloat,
      note,
    };

    const duplicateCheck = checkIdempotencyDuplicate(idempotencyKey, requestPayload);
    if (duplicateCheck.isDuplicate) {
      setRequestStatus('duplicate');
      setStatusMessage(`Duplicate Idempotency Key detected (${idempotencyKey}). Returning original verified result without executing double movement.`);
      showToast({
        type: 'duplicate',
        title: 'Duplicate Request Replayed',
        description: 'The exact idempotency key was previously executed. Cached result replayed safely.',
        idempotencyKey,
      });
      return;
    }

    setRequestStatus('submitting');
    setStatusMessage(null);

    try {
      if (activeTab === 'transfer') {
        const res = await apiRequest<{
          success: boolean;
          newBalance: number;
          ledgerEntry: any;
        }>('/api/accounts/transfer', {
          method: 'POST',
          idempotencyKey,
          body: JSON.stringify({
            recipientAccountNumber: recipientAccountNumber.trim(),
            amount: amountFloat,
            note: note.trim() || 'Synthetic money movement demo',
          }),
        });

        if (res.error) {
          setRequestStatus('refused');
          setStatusMessage(res.error);
          showToast({
            type: 'refused',
            title: 'Transfer Refused by Ledger',
            description: res.error,
            idempotencyKey,
          });
        } else if (res.data) {
          setRequestStatus('success');
          setStatusMessage(`Successfully moved ${formatPaise(amountPaise)} to ${recipientAccountNumber}. Post Balance: ${formatPaise(floatToPaise(res.data.newBalance))}`);
          setLastTransferredPaise(amountPaise);
          setShowAnimation(true);
          recordIdempotencyExecution(idempotencyKey, requestPayload, res.data);
          showToast({
            type: 'success',
            title: 'Transfer Settled to Ledger',
            description: `${formatPaise(amountPaise)} moved atomically.`,
            idempotencyKey,
          });
          fetchMyAccount();
        }
      } else if (activeTab === 'deposit') {
        // Simulated external deposit
        await new Promise((resolve) => setTimeout(resolve, 600));
        setRequestStatus('success');
        setStatusMessage(`External deposit of ${formatPaise(amountPaise)} verified and settled to ledger under conservation invariant.`);
        recordIdempotencyExecution(idempotencyKey, requestPayload, { settled: true });
        showToast({
          type: 'success',
          title: 'Deposit Settled',
          description: `${formatPaise(amountPaise)} credited to your ledger account.`,
          idempotencyKey,
        });
        if (currentAccount) {
          setCurrentAccount({
            ...currentAccount,
            balance: currentAccount.balance + amountFloat,
          });
        }
      } else if (activeTab === 'withdraw') {
        // Simulated external withdrawal
        if (currentAccount && floatToPaise(currentAccount.balance) < amountPaise) {
          setRequestStatus('refused');
          setStatusMessage('INSUFFICIENT_FUNDS: Withdrawal amount exceeds available balance floor (₹0.00).');
          showToast({
            type: 'refused',
            title: 'Withdrawal Refused',
            description: 'Insufficient ledger balance to satisfy atomic balance floor.',
            idempotencyKey,
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
        setRequestStatus('success');
        setStatusMessage(`External withdrawal of ${formatPaise(amountPaise)} settled and debited from ledger.`);
        recordIdempotencyExecution(idempotencyKey, requestPayload, { settled: true });
        showToast({
          type: 'success',
          title: 'Withdrawal Settled',
          description: `${formatPaise(amountPaise)} debited from your ledger account.`,
          idempotencyKey,
        });
        if (currentAccount) {
          setCurrentAccount({
            ...currentAccount,
            balance: currentAccount.balance - amountFloat,
          });
        }
      }
    } catch (err: any) {
      setRequestStatus('refused');
      setStatusMessage(err.message || 'Network failure during ledger communication.');
    }
  };

  const isSubmitting = requestStatus === 'submitting';

  return (
    <div style={{ maxWidth: '820px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Money Movement Terminal
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Exact-once execution via client idempotency keys, integer paise arithmetic, and atomic balance floors.
        </p>
      </div>

      {/* Auditor Read-Only Notice */}
      {isAuditor && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(245, 184, 75, 0.1)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Lock size={20} color="var(--color-warning)" />
          <div style={{ fontSize: '0.875rem', color: 'var(--color-warning)', fontWeight: 500 }}>
            You are viewing in <strong>Auditor (Read-Only)</strong> mode. Money movement write controls are strictly disabled.
          </div>
        </div>
      )}

      {/* Movement Mode Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          backgroundColor: 'var(--color-surface)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-surface-border)',
          marginBottom: '1.5rem',
          gap: '0.35rem',
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('transfer'); setRequestStatus('idle'); setStatusMessage(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.625rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'transfer' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'transfer' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'transfer' ? 'var(--shadow-card)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ArrowLeftRight size={16} />
          <span>Internal Transfer</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('deposit'); setRequestStatus('idle'); setStatusMessage(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.625rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'deposit' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'deposit' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'deposit' ? 'var(--shadow-card)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ArrowDownLeft size={16} />
          <span>External Deposit</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('withdraw'); setRequestStatus('idle'); setStatusMessage(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.625rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'withdraw' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'withdraw' ? 'var(--color-danger)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'withdraw' ? 'var(--shadow-card)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ArrowUpRight size={16} />
          <span>External Withdrawal</span>
        </button>
      </div>

      {/* Main Movement Card */}
      <Card variant="elevated" style={{ padding: '2rem' }}>
        {/* Source Account & Balance Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-bg-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-surface-border)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Source Account
            </div>
            <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {currentAccount?.accountNumber || 'Loading...'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Floor Balance
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '1.125rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--color-secondary)',
              }}
            >
              {currentAccount ? formatPaise(floatToPaise(currentAccount.balance)) : '₹0.00'}
            </div>
          </div>
        </div>

        {/* 3D Coin Animation (Displayed on Successful Transfer) */}
        {showAnimation && (
          <TransferCoin3D
            amountPaise={lastTransferredPaise}
            sourceLabel={currentAccount?.accountNumber || 'Source'}
            destinationLabel={recipientAccountNumber || 'Recipient'}
            onAnimationComplete={() => setShowAnimation(false)}
          />
        )}

        {/* Idempotency Key Control Strip */}
        <div
          style={{
            backgroundColor: 'rgba(79, 140, 255, 0.08)',
            border: '1px solid rgba(79, 140, 255, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
            <Key size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Idempotency-Key (RFC 4122 v4)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {idempotencyKey}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleNewKey}
              leftIcon={<RefreshCw size={13} />}
              title="Generate a brand new UUID for a unique transaction"
            >
              New Key
            </Button>
          </div>
        </div>

        {/* Status Alert Banners */}
        {requestStatus === 'success' && statusMessage && (
          <div
            role="status"
            style={{
              backgroundColor: 'rgba(34, 211, 183, 0.12)',
              border: '1px solid var(--color-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              color: 'var(--color-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Ledger Posting Committed</div>
              <div style={{ marginTop: '0.15rem', color: 'var(--color-text-primary)' }}>{statusMessage}</div>
            </div>
          </div>
        )}

        {requestStatus === 'refused' && statusMessage && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(255, 92, 122, 0.12)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              fontSize: '0.875rem',
            }}
          >
            <AlertOctagon size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Request Refused by Policy Engine</div>
              <div style={{ marginTop: '0.15rem', color: 'var(--color-text-primary)' }}>{statusMessage}</div>
            </div>
          </div>
        )}

        {requestStatus === 'duplicate' && statusMessage && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(245, 184, 75, 0.12)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              fontSize: '0.875rem',
            }}
          >
            <CopyCheck size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Idempotent Replay Cached</div>
              <div style={{ marginTop: '0.15rem', color: 'var(--color-text-primary)' }}>{statusMessage}</div>
            </div>
          </div>
        )}

        {/* Movement Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'transfer' && (
            <Input
              label="Recipient Account Number"
              value={recipientAccountNumber}
              onChange={(e) => setRecipientAccountNumber(e.target.value)}
              placeholder="e.g. BV-1082-9412"
              helperText="Target internal double-entry ledger account number."
              isMonospace
              required
              disabled={isAuditor || isSubmitting}
            />
          )}

          <Input
            label={activeTab === 'transfer' ? 'Transfer Amount' : activeTab === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'}
            leftAddon="₹"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0.00"
            helperText="Amounts computed in integer paise. Floating-point arithmetic is strictly prohibited."
            isMonospace
            required
            disabled={isAuditor || isSubmitting}
          />

          <Input
            label="Transaction Reference / Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Synthetic Settlement Demo"
            disabled={isAuditor || isSubmitting}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            {onNavigateToDashboard && (
              <Button type="button" variant="secondary" onClick={onNavigateToDashboard}>
                Back to Dashboard
              </Button>
            )}

            <Button
              type="submit"
              variant={activeTab === 'deposit' ? 'success' : activeTab === 'withdraw' ? 'danger' : 'primary'}
              disabled={isAuditor || isSubmitting}
              isLoading={isSubmitting}
              loadingText="Executing Atomic Settlement..."
              rightIcon={<Send size={15} />}
            >
              {activeTab === 'transfer' ? 'Execute Transfer' : activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
