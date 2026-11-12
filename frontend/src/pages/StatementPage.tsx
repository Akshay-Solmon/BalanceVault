import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { formatPaise, floatToPaise } from '../utils/money';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, Column } from '../components/ui/Table';
import { LedgerChain3D, LedgerChainBlock } from '../components/3d/LedgerChain3D';
import { initialRefusedAttempts } from '../api/demoData';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Box, 
  Table as TableIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  XCircle, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface CombinedStatementRow {
  id: string;
  entryType: 'CREDIT' | 'DEBIT' | 'REFUSED';
  amountPaise: number;
  balanceAfterPaise: number;
  reference: string;
  counterpartyAccount?: string | null;
  notes: string;
  createdAt: string;
  initiator?: string;
  refusalReason?: string;
  hash?: string;
}

export const StatementPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<CombinedStatementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountNumber, setAccountNumber] = useState<string>('');

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'REFUSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'chain'>('table');

  const fetchStatement = async () => {
    setLoading(true);
    const res = await apiRequest<{ account: any }>('/api/accounts/me');
    if (res.data?.account) {
      const acc = res.data.account;
      setAccountNumber(acc.accountNumber);

      // Normal ledger postings
      const postings: CombinedStatementRow[] = (acc.ledgerEntries || []).map((e: any) => ({
        id: e.id,
        entryType: e.entryType as 'CREDIT' | 'DEBIT',
        amountPaise: floatToPaise(e.amount),
        balanceAfterPaise: floatToPaise(e.balanceAfter),
        reference: e.reference,
        counterpartyAccount: e.counterpartyAccount,
        notes: e.notes,
        createdAt: e.createdAt,
        initiator: user?.email,
      }));

      // Integrate refused attempts from demo log for comprehensive statement audit
      const refusedRows: CombinedStatementRow[] = initialRefusedAttempts.map((r) => ({
        id: r.id,
        entryType: 'REFUSED',
        amountPaise: r.amountPaise,
        balanceAfterPaise: postings.length > 0 ? postings[0].balanceAfterPaise : 0,
        reference: `REFUSED_${r.attemptType}`,
        counterpartyAccount: r.accountNumber,
        notes: `Policy Refusal: ${r.reason}`,
        createdAt: r.createdAt,
        initiator: r.initiatorEmail,
        refusalReason: r.reason,
      }));

      // Combine and order chronologically descending
      const combined = [...postings, ...refusedRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRows(combined);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  // Filtered rows
  const filteredRows = rows.filter((r) => {
    if (filterType !== 'ALL' && r.entryType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRef = r.reference.toLowerCase().includes(q);
      const matchNotes = r.notes.toLowerCase().includes(q);
      const matchCounterparty = r.counterpartyAccount?.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      if (!matchRef && !matchNotes && !matchCounterparty && !matchId) return false;
    }
    return true;
  });

  // CSV Export Handler
  const exportToCSV = () => {
    const headers = [
      'Entry_ID',
      'Timestamp',
      'Entry_Type',
      'Amount_Paise',
      'Amount_INR',
      'Post_Balance_INR',
      'Reference',
      'Counterparty_Account',
      'Initiator',
      'Notes',
    ];

    const csvLines = [headers.join(',')];

    filteredRows.forEach((r) => {
      const isRefused = r.entryType === 'REFUSED';
      const rowData = [
        `"${r.id}"`,
        `"${r.createdAt}"`,
        `"${r.entryType}"`,
        isRefused ? '0' : r.amountPaise,
        `"${formatPaise(r.amountPaise, { hideCurrency: true })}"`,
        `"${formatPaise(r.balanceAfterPaise, { hideCurrency: true })}"`,
        `"${r.reference}"`,
        `"${r.counterpartyAccount || ''}"`,
        `"${r.initiator || ''}"`,
        `"${r.notes.replace(/"/g, '""')}"`,
      ];
      csvLines.push(rowData.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balancevault-statement-${accountNumber || 'account'}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<CombinedStatementRow>[] = [
    {
      key: 'type',
      header: 'Direction / Status',
      width: '140px',
      render: (r) => {
        if (r.entryType === 'REFUSED') {
          return (
            <Badge variant="debit" icon={<XCircle size={13} />}>
              REFUSED
            </Badge>
          );
        }
        const isCredit = r.entryType === 'CREDIT';
        return (
          <Badge
            variant={isCredit ? 'credit' : 'debit'}
            icon={isCredit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
          >
            {r.entryType}
          </Badge>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference & Initiator',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.reference}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Initiator: {r.initiator || 'System'}
            {r.counterpartyAccount && ` • Counterparty: ${r.counterpartyAccount}`}
          </div>
          {r.refusalReason && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 500, marginTop: '0.1rem' }}>
              Reason: {r.refusalReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      width: '180px',
      render: (r) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      width: '140px',
      render: (r) => (
        <span
          className="tabular-nums font-mono"
          style={{
            fontWeight: 600,
            color:
              r.entryType === 'REFUSED'
                ? 'var(--color-danger)'
                : r.entryType === 'CREDIT'
                ? 'var(--color-secondary)'
                : 'var(--color-text-primary)',
          }}
        >
          {r.entryType === 'REFUSED' ? '—' : `${r.entryType === 'CREDIT' ? '+' : '-'}${formatPaise(r.amountPaise)}`}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Running Balance',
      align: 'right',
      width: '150px',
      render: (r) => (
        <span className="tabular-nums font-mono" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {formatPaise(r.balanceAfterPaise)}
        </span>
      ),
    },
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Per-Account Statement & Audit Ledger
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Account: <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>{accountNumber || 'Loading...'}</span> • Every posting, reversal, and refused attempt recorded append-only.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.2rem',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? 'var(--color-surface-elevated)' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <TableIcon size={14} />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('chain')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'chain' ? 'var(--color-surface-elevated)' : 'transparent',
                color: viewMode === 'chain' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <Box size={14} />
              <span>3D Chain View</span>
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={exportToCSV} leftIcon={<Download size={14} />}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchStatement} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Strip */}
      <Card variant="default" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Direction Badges Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['ALL', 'CREDIT', 'DEBIT', 'REFUSED'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: filterType === type ? '1px solid var(--color-primary)' : '1px solid var(--color-surface-border)',
                  backgroundColor: filterType === type ? 'rgba(79, 140, 255, 0.15)' : 'transparent',
                  color: filterType === type ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {type === 'ALL' ? 'All Records' : type === 'CREDIT' ? 'Credits Only' : type === 'DEBIT' ? 'Debits Only' : 'Refused Attempts'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ minWidth: '260px' }}>
            <Input
              placeholder="Search reference, notes, ID..."
              leftAddon={<Search size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      </Card>

      {/* Content: Table or 3D Chain View */}
      {viewMode === 'table' ? (
        <Card variant="default">
          <Table
            columns={columns}
            data={filteredRows}
            rowKey={(r) => r.id}
            isLoading={loading}
            emptyMessage="No statement rows match your current filter parameters."
          />
        </Card>
      ) : (
        <Card variant="default" style={{ padding: '1.5rem' }}>
          <LedgerChain3D
            entries={filteredRows.map((r) => ({
              id: r.id,
              entryType: r.entryType,
              amountPaise: r.amountPaise,
              balanceAfterPaise: r.balanceAfterPaise,
              reference: r.reference,
              notes: r.notes,
              counterpartyAccount: r.counterpartyAccount,
              createdAt: r.createdAt,
              initiator: r.initiator,
            }))}
            accountNumber={accountNumber}
          />
        </Card>
      )}
    </div>
  );
};
