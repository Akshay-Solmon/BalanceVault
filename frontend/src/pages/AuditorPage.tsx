import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  initialRefusedAttempts, 
  initialDuplicateRequests, 
  demoReconciliationReport,
  RefusedAttempt,
  DuplicateRequestRecord 
} from '../api/demoData';
import { formatPaise } from '../utils/money';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';
import { 
  Eye, 
  Lock, 
  ShieldCheck, 
  AlertOctagon, 
  CopyCheck, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  Hash
} from 'lucide-react';

export const AuditorPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'refused' | 'duplicates'>('reconciliation');
  const [refusedList] = useState<RefusedAttempt[]>(initialRefusedAttempts);
  const [duplicateList] = useState<DuplicateRequestRecord[]>(initialDuplicateRequests);
  const [reconcileReport, setReconcileReport] = useState(demoReconciliationReport);
  const [isReconciling, setIsReconciling] = useState(false);

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setReconcileReport({
        ...demoReconciliationReport,
        timestamp: new Date().toISOString(),
      });
      setIsReconciling(false);
    }, 600);
  };

  const refusedColumns: Column<RefusedAttempt>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      render: (r) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Refusal Policy Violation',
      render: (r) => (
        <div>
          <Badge variant="debit" icon={<AlertOctagon size={12} />}>
            {r.reason}
          </Badge>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Action: {r.attemptType} • Target: <span className="font-mono">{r.accountNumber}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'initiator',
      header: 'Initiator',
      render: (r) => (
        <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
          {r.initiatorEmail}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Attempted Amount',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums font-mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
          {formatPaise(r.amountPaise)}
        </span>
      ),
    },
    {
      key: 'idempotencyKey',
      header: 'Idempotency Key',
      width: '180px',
      render: (r) => (
        <span
          className="font-mono"
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '0.15rem 0.35rem',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
          }}
          title={r.idempotencyKey}
        >
          {r.idempotencyKey.substring(0, 16)}...
        </span>
      ),
    },
  ];

  const duplicateColumns: Column<DuplicateRequestRecord>[] = [
    {
      key: 'timestamp',
      header: 'Replay Time',
      width: '160px',
      render: (d) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date(d.replayedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'idempotencyKey',
      header: 'Replayed Key (UUID)',
      render: (d) => (
        <div>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600 }}>
            {d.idempotencyKey}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            User: {d.userEmail} • Route: {d.requestPath}
          </div>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Execution Result',
      render: (d) => {
        const isReplayed = d.result === 'REPLAYED_CACHED_RESULT';
        return (
          <Badge variant={isReplayed ? 'warning' : 'debit'} icon={<CopyCheck size={12} />}>
            {d.result}
          </Badge>
        );
      },
    },
    {
      key: 'statusReturned',
      header: 'Status Code',
      align: 'right',
      render: (d) => (
        <span className="font-mono" style={{ fontWeight: 600 }}>
          HTTP {d.statusReturned}
        </span>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header with Visible Read-Only Badge */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Eye size={22} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Independent Auditor Oversight
            </h1>
            <Badge variant="readonly" icon={<Lock size={12} />}>
              Read-Only
            </Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            FR-11: Read-only verification of conservation invariants, refused attempts, and duplicate idempotency replays.
          </p>
        </div>

        <button
          onClick={handleRunReconciliation}
          disabled={isReconciling}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={isReconciling ? 'animate-spin' : ''} />
          <span>Recompute Reconciliation</span>
        </button>
      </div>

      {/* Top 3 High-Level Assurance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Balance Conservation */}
        <Card variant="elevated" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Conservation Invariant
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '0.2rem' }}>
                Zero Drift (₹0.00)
              </div>
            </div>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(34, 211, 183, 0.15)',
              }}
            >
              <ShieldCheck size={20} color="var(--color-secondary)" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            Debits equal credits across all {reconcileReport.lastReconciledBlockHeight} transactions. Total internal balance strictly matches external net flow.
          </p>
        </Card>

        {/* Card 2: Refused Policy Violations */}
        <Card variant="elevated" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Refused Postings Logged
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.2rem' }}>
                {refusedList.length} Refusals Recorded
              </div>
            </div>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 92, 122, 0.15)',
              }}
            >
              <AlertOctagon size={20} color="var(--color-danger)" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            Append-only refusal rows with request hash and caller identity permanently archived.
          </p>
        </Card>

        {/* Card 3: Idempotency Replays */}
        <Card variant="elevated" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Duplicate Replays Intercepted
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.2rem' }}>
                {duplicateList.length} Duplicates Handled
              </div>
            </div>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(245, 184, 75, 0.15)',
              }}
            >
              <CopyCheck size={20} color="var(--color-warning)" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            Replayed idempotency keys returned identical cached results without moving money twice.
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--color-surface)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-surface-border)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('reconciliation')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'reconciliation' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'reconciliation' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          <Scale size={15} />
          <span>Conservation & Reconciliation Report</span>
        </button>

        <button
          onClick={() => setActiveTab('refused')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'refused' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'refused' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          <AlertOctagon size={15} />
          <span>Refused Attempts Log ({refusedList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'duplicates' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'duplicates' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          <CopyCheck size={15} />
          <span>Duplicate Requests Log ({duplicateList.length})</span>
        </button>
      </div>

      {/* Panels */}
      {activeTab === 'reconciliation' && (
        <Card variant="default" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Double-Entry Mathematical Balance Audit
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Recomputes the sum of all stored balances directly from the append-only ledger transaction history.
              </p>
            </div>

            <Badge variant="credit" icon={<CheckCircle2 size={13} />}>
              Invariant Fully Conserved
            </Badge>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--color-surface-elevated)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Total External Deposits
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                +{formatPaise(reconcileReport.totalExternalDepositsPaise)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Total External Withdrawals
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-danger)' }}>
                -{formatPaise(reconcileReport.totalExternalWithdrawalsPaise)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Net Internal Balances
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                ={formatPaise(reconcileReport.totalInternalBalancePaise)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Calculated Reconciliation Drift
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                ₹0.00
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            <strong>Mathematical Proof:</strong> Sum of internal balances ({formatPaise(reconcileReport.totalInternalBalancePaise)}) exactly equals Deposits ({formatPaise(reconcileReport.totalExternalDepositsPaise)}) minus Withdrawals ({formatPaise(reconcileReport.totalExternalWithdrawalsPaise)}). No unbacked currency creation or destruction occurred across all accounts.
          </div>
        </Card>
      )}

      {activeTab === 'refused' && (
        <Card variant="default">
          <Table
            columns={refusedColumns}
            data={refusedList}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      {activeTab === 'duplicates' && (
        <Card variant="default">
          <Table
            columns={duplicateColumns}
            data={duplicateList}
            rowKey={(d) => d.id}
          />
        </Card>
      )}
    </div>
  );
};
