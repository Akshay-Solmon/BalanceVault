import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Interactive3DCard } from '../components/Interactive3DCard';
import { Vault3DScene } from '../components/Vault3DScene';
import { Ledger3DVisualizer } from '../components/Ledger3DVisualizer';
import { 
  Wallet, 
  Send, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Copy,
  ShieldCheck,
  Clock,
  Box,
  Table
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

export const DashboardPage: React.FC<{ onNavigateToOnboarding: () => void }> = ({ onNavigateToOnboarding }) => {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transfer Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // View mode for ledger: '3d' or 'table'
  const [ledgerViewMode, setLedgerViewMode] = useState<'3d' | 'table'>('3d');

  const fetchAccount = async () => {
    setLoading(true);
    setError(null);
    const res = await apiRequest<{ account: AccountData }>('/api/accounts/me');
    if (res.data?.account) {
      setAccount(res.data.account);
    } else if (res.status === 404) {
      setError('ONBOARDING_REQUIRED');
    } else {
      setError(res.error || 'Failed to load ledger account.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMsg(null);
    setIsTransferring(true);

    const res = await apiRequest('/api/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify({
        recipientAccountNumber: recipient,
        amount: parseFloat(amount),
        note,
      }),
    });

    if (res.error) {
      setTransferMsg({ type: 'error', text: res.error });
    } else {
      setTransferMsg({ type: 'success', text: 'Transfer successfully posted to ledger.' });
      setRecipient('');
      setAmount('');
      setNote('');
      await fetchAccount();
      await refreshUser();
    }
    setIsTransferring(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={32} color="#38bdf8" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#94a3b8' }}>Loading ledger state and 3D account models...</p>
      </div>
    );
  }

  // If user has not completed onboarding
  if (error === 'ONBOARDING_REQUIRED') {
    return (
      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            Ledger Account Pending Onboarding Review
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Under BalanceVault's auditable compliance model, accounts and ledger books are provisioned immediately upon administrator review of your onboarding profile.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
            <button onClick={onNavigateToOnboarding} className="btn-primary">
              View & Submit Onboarding
            </button>
            <button onClick={fetchAccount} className="btn-secondary">
              <RefreshCw size={14} /> Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* 3D Showcase Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        alignItems: 'stretch',
      }}>
        {/* Left: Interactive 3D Holographic Card */}
        <div>
          <Interactive3DCard
            accountNumber={account?.accountNumber || 'BV-0000-0000'}
            balance={account?.balance || 0}
            currency={account?.currency || 'USD'}
            cardHolderName={user?.email || 'SYNTHETIC ACCOUNT HOLDER'}
            status={account?.status || 'ACTIVE'}
          />
        </div>

        {/* Middle: Live 3D Vault Core WebGL Scene */}
        <div>
          <Vault3DScene
            status={account?.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED'}
            size="compact"
            interactive={true}
          />
        </div>

        {/* Right: Transfer Synthetic Funds Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Send size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Auditable P2P Money Movement
              </h3>
            </div>

            {transferMsg && (
              <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginBottom: '0.75rem',
                background: transferMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: transferMsg.type === 'success' ? '#34d399' : '#f87171',
                border: `1px solid ${transferMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
              }}>
                {transferMsg.text}
              </div>
            )}

            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Recipient Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BV-4902-8811"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="input-field font-mono"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Transfer Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="input-field font-mono"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Audit Reference Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Demonstration transfer"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isTransferring}
                className="btn-primary"
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                {isTransferring ? 'Settling to Ledger...' : 'Post Auditable Transfer'}
              </button>
            </form>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1rem', borderTop: '1px solid #1e293b', paddingTop: '0.5rem' }}>
            Atomic double-entry commit with cryptographic ledger update.
          </div>
        </div>
      </div>

      {/* Ledger Section with 3D / 2D Toggle */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <History size={20} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                Double-Entry Account Ledger
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Provable audit history. Entries cannot be altered or deleted.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* View Mode Toggle Button */}
            <div style={{
              display: 'flex',
              background: '#090d16',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid #1e293b',
            }}>
              <button
                type="button"
                onClick={() => setLedgerViewMode('3d')}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: ledgerViewMode === '3d' ? '#1e293b' : 'transparent',
                  color: ledgerViewMode === '3d' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Box size={13} /> 3D Block Chain
              </button>
              <button
                type="button"
                onClick={() => setLedgerViewMode('table')}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: ledgerViewMode === 'table' ? '#1e293b' : 'transparent',
                  color: ledgerViewMode === 'table' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Table size={13} /> 2D Table
              </button>
            </div>

            <button onClick={fetchAccount} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* 3D Ledger Block Explorer View */}
        {ledgerViewMode === '3d' ? (
          <Ledger3DVisualizer
            entries={account?.ledgerEntries || []}
            accountNumber={account?.accountNumber || ''}
          />
        ) : (
          /* 2D Table View */
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {!account?.ledgerEntries || account.ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  account.ledgerEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${entry.entryType === 'CREDIT' ? 'badge-green' : 'badge-red'}`}>
                          {entry.entryType === 'CREDIT' ? (
                            <><ArrowDownLeft size={11} /> CREDIT</>
                          ) : (
                            <><ArrowUpRight size={11} /> DEBIT</>
                          )}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {entry.reference}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {entry.counterpartyAccount || '—'}
                      </td>
                      <td style={{
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: entry.entryType === 'CREDIT' ? '#34d399' : '#f87171',
                      }}>
                        {entry.entryType === 'CREDIT' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
                        ${entry.balanceAfter.toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {entry.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
