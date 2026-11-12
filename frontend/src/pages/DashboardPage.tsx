import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { floatToPaise } from '../utils/money';
import { AccountCard3D } from '../components/3d/AccountCard3D';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { MoneyDisplay } from '../components/money/MoneyDisplay';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Wallet, 
  Clock, 
  FileText,
  Activity,
  Lock
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  reference: string;
  counterpartyAccount?: string | null;
  notes: string;
  createdAt: string;
}

interface AccountData {
  id: string;
  accountNumber: string;
  currency: string;
  balance: number;
  status: string;
  ledgerEntries: LedgerEntry[];
}

export interface DashboardPageProps {
  onNavigateToMoneyMovements?: () => void;
  onNavigateToStatement?: () => void;
  onNavigateToOnboarding?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToMoneyMovements,
  onNavigateToStatement,
  onNavigateToOnboarding,
}) => {
  const { user, isAuditor } = useAuth();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAccount = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    const res = await apiRequest<{ account: AccountData }>('/api/accounts/me');
    if (res.data?.account) {
      setAccount(res.data.account);
    } else if (res.status === 404) {
      setErrorStatus(404);
      setErrorMessage(res.error || 'No active ledger account provisioned. Onboarding approval required.');
    } else {
      setErrorStatus(res.status || 500);
      setErrorMessage(res.error || 'Failed to load ledger balance.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // Compute integer paise values
  const balancePaise = account ? floatToPaise(account.balance) : 0;
  const entries = account?.ledgerEntries || [];

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      render: (entry) => {
        const isCredit = entry.entryType === 'CREDIT';
        return (
          <Badge
            variant={isCredit ? 'credit' : 'debit'}
            icon={isCredit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
          >
            {entry.entryType}
          </Badge>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference & Counterparty',
      render: (entry) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{entry.reference}</div>
          {entry.counterpartyAccount && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Acc: {entry.counterpartyAccount}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      width: '180px',
      render: (entry) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date(entry.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      width: '140px',
      render: (entry) => (
        <MoneyDisplay
          paise={floatToPaise(entry.amount)}
          variant={entry.entryType === 'CREDIT' ? 'credit' : 'debit'}
          showSign
          size="sm"
        />
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Post Balance',
      align: 'right',
      width: '140px',
      render: (entry) => (
        <MoneyDisplay
          paise={floatToPaise(entry.balanceAfter)}
          variant="neutral"
          size="sm"
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: '1180px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Skeleton height="240px" borderRadius="var(--radius-lg)" />
          <Skeleton height="240px" borderRadius="var(--radius-lg)" />
        </div>
        <Skeleton height="320px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (errorStatus === 404 && onNavigateToOnboarding) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <Card variant="elevated" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 184, 75, 0.15)',
              border: '1px solid var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Clock size={28} color="var(--color-warning)" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Account Provisioning Pending
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your account requires onboarding approval before double-entry ledger accounts are activated. Administrators can approve pending profiles in the Admin Console.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Button variant="primary" onClick={onNavigateToOnboarding} leftIcon={<FileText size={16} />}>
              Review Onboarding Status
            </Button>
            <Button variant="secondary" onClick={fetchAccount} leftIcon={<RefreshCw size={16} />}>
              Check Status
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (errorMessage && !account) {
    return (
      <div style={{ maxWidth: '720px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <ErrorState
          status={errorStatus || 500}
          message={errorMessage}
          onRetry={fetchAccount}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Account Overview
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Real-time provable balance enforced by database locks and append-only cryptographic ledger.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" onClick={fetchAccount} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>

          {!isAuditor && onNavigateToMoneyMovements && (
            <Button variant="primary" size="sm" onClick={onNavigateToMoneyMovements} leftIcon={<ArrowLeftRight size={14} />}>
              Move Money
            </Button>
          )}
        </div>
      </div>

      {/* Top Grid: 3D Account Card + High-Level Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left: 3D Interactive Account Card */}
        <AccountCard3D
          accountNumber={account?.accountNumber || 'BV-UNASSIGNED'}
          balancePaise={balancePaise}
          cardHolderName={user?.email || 'SYNTHETIC ACCOUNT HOLDER'}
          status={account?.status || 'ACTIVE'}
        />

        {/* Right: Quick Ledger Security & Operations Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
          {/* Quick Metrics Card */}
          <Card variant="default" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Ledger Protection Status
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Balance Floor Rule</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary)', marginTop: '0.2rem' }}>
                  ₹0.00 Floor (Strict)
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Concurrency Lock</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                  SELECT FOR UPDATE
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Action Bar (Disabled if Auditor) */}
          <Card variant="elevated" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Quick Operations
              </span>
              {isAuditor && (
                <Badge variant="readonly" size="sm">
                  Write Actions Blocked
                </Badge>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={isAuditor}
                onClick={onNavigateToMoneyMovements}
                leftIcon={<ArrowDownLeft size={14} color="var(--color-secondary)" />}
              >
                Deposit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isAuditor}
                onClick={onNavigateToMoneyMovements}
                leftIcon={<ArrowUpRight size={14} color="var(--color-danger)" />}
              >
                Withdraw
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isAuditor}
                onClick={onNavigateToMoneyMovements}
                leftIcon={<ArrowLeftRight size={14} />}
              >
                Transfer
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table */}
      <Card variant="default">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-surface-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Recent Ledger Postings
            </h3>
          </div>

          {onNavigateToStatement && (
            <Button variant="ghost" size="sm" onClick={onNavigateToStatement} rightIcon={<FileText size={14} />}>
              View Full Statement
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          data={entries.slice(0, 8)}
          rowKey={(r) => r.id}
          emptyMessage="No ledger transactions have settled to this account yet."
        />
      </Card>
    </div>
  );
};
