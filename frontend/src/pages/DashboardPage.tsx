import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
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
  Clock
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
  const [copied, setCopied] = useState(false);

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

  const handleCopyAccount = () => {
    if (account?.accountNumber) {
      navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <p style={{ color: '#94a3b8' }}>Loading ledger state and account records...</p>
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
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Top Banner Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Balance Card */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Audited Ledger Balance
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                ${account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={{ fontSize: '1rem', color: '#38bdf8', marginLeft: '0.5rem', fontWeight: 500 }}>
                  {account?.currency || 'USD'}
                </span>
              </div>
            </div>
            <span className="badge badge-green">
              <ShieldCheck size={12} /> {account?.status || 'ACTIVE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Account:</span>
            <code className="font-mono" style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
              {account?.accountNumber}
            </code>
            <button
              onClick={handleCopyAccount}
              title="Copy Account Number"
              style={{ background: 'none', border: 'none', padding: '2px', color: '#94a3b8', cursor: 'pointer' }}
            >
              <Copy size={13} color={copied ? '#10b981' : '#94a3b8'} />
            </button>
            {copied && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Copied!</span>}
          </div>
        </div>

        {/* Transfer Funds Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Send size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              Send Synthetic Funds (P2P Transfer)
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

          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Recipient Acct (e.g. BV-4902-8811)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="input-field"
                style={{ fontSize: '0.8rem' }}
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount $"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="input-field"
                style={{ fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Reference Note (Optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.8rem' }}
              />
              <button
                type="submit"
                disabled={isTransferring}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              >
                {isTransferring ? 'Settling...' : 'Post Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ledger Table Section */}
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
          <button onClick={fetchAccount} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
            <RefreshCw size={13} /> Refresh Ledger
          </button>
        </div>

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
      </div>
    </div>
  );
};
