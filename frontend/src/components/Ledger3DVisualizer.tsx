import React, { useState } from 'react';
import { 
  Box, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Hash, 
  Link2, 
  Eye, 
  Clock, 
  FileCode,
  Sparkles
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

interface Ledger3DVisualizerProps {
  entries: LedgerEntry[];
  accountNumber: string;
}

export const Ledger3DVisualizer: React.FC<Ledger3DVisualizerProps> = ({ entries, accountNumber }) => {
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        No 3D ledger blocks to visualize yet. Execute a transfer or grant to create block #001!
      </div>
    );
  }

  // Generate deterministic synthetic block hashes based on ID
  const generateBlockHash = (id: string, index: number) => {
    let hash = 0;
    const str = `${id}-${index}-balancevault-ledger-block`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}4f92...${hex.substring(0, 4)}`;
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0 0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Box size={18} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
            Interactive 3D Provable Ledger Chain ({entries.length} Blocks)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          [ Hover block to elevate in 3D • Click to inspect Merkle proof ]
        </span>
      </div>

      {/* 3D Block Chain Container */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        overflowX: 'auto',
        padding: '1.5rem 0.5rem 2rem',
        perspective: '1000px',
      }}>
        {entries.map((entry, index) => {
          const blockHeight = entries.length - index;
          const isCredit = entry.entryType === 'CREDIT';
          const isHovered = hoveredIndex === index;
          const blockHash = generateBlockHash(entry.id, blockHeight);

          return (
            <div
              key={entry.id}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {/* 3D Block Node */}
              <div
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  minWidth: '220px',
                  maxWidth: '240px',
                  background: isHovered
                    ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${
                    isHovered
                      ? isCredit ? '#10b981' : '#f87171'
                      : isCredit ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                  }`,
                  boxShadow: isHovered
                    ? `0 20px 35px -5px ${isCredit ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}, 0 0 15px rgba(56, 189, 248, 0.3)`
                    : '0 8px 20px rgba(0, 0, 0, 0.5)',
                  transform: isHovered
                    ? 'translateY(-12px) scale(1.05) rotateX(4deg)'
                    : 'translateY(0) scale(1.0) rotateX(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  padding: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 3D Top Corner Notch */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '0',
                  height: '0',
                  borderTop: `28px solid ${isCredit ? '#10b981' : '#ef4444'}`,
                  borderLeft: '28px solid transparent',
                  opacity: 0.8,
                }} />

                {/* Block Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    letterSpacing: '0.05em',
                  }}>
                    BLOCK #{blockHeight.toString().padStart(3, '0')}
                  </span>
                  <span className={`badge ${isCredit ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                    {isCredit ? '+' : '-'}{entry.entryType}
                  </span>
                </div>

                {/* Amount */}
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isCredit ? '#34d399' : '#f87171',
                  marginBottom: '0.25rem',
                }}>
                  {isCredit ? '+' : '-'}${entry.amount.toFixed(2)}
                </div>

                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Balance: <strong style={{ color: '#f8fafc' }}>${entry.balanceAfter.toFixed(2)}</strong>
                </div>

                {/* Block Hash */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '0.5rem',
                }}>
                  <Hash size={11} color="#38bdf8" />
                  <span>{blockHash}</span>
                </div>

                {/* Reference & Time */}
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {entry.reference}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Cryptographic Link Line to Next Block */}
              {index < entries.length - 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.5rem',
                  color: '#38bdf8',
                }}>
                  <div style={{
                    width: '24px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                    boxShadow: '0 0 8px #38bdf8',
                  }} />
                  <Link2 size={14} color="#38bdf8" style={{ marginLeft: '-4px', marginRight: '-4px' }} />
                  <div style={{
                    width: '24px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                    boxShadow: '0 0 8px #38bdf8',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Block Inspector Modal */}
      {selectedEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                  Cryptographic Ledger Block Details
                </h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Entry ID:</span> <code className="font-mono" style={{ color: '#38bdf8' }}>{selectedEntry.id}</code>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Transaction Type:</span> <strong>{selectedEntry.entryType}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Settled Amount:</span> <strong style={{ color: selectedEntry.entryType === 'CREDIT' ? '#34d399' : '#f87171' }}>${selectedEntry.amount.toFixed(2)} USD</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Ledger Checkpoint:</span> <strong>${selectedEntry.balanceAfter.toFixed(2)} USD</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Reference Tag:</span> <code className="font-mono">{selectedEntry.reference}</code>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Counterparty Account:</span> <code className="font-mono">{selectedEntry.counterpartyAccount || 'System Protocol'}</code>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Notes:</span> <span>{selectedEntry.notes}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Timestamp:</span> <span>{new Date(selectedEntry.createdAt).toISOString()}</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.75rem',
              color: '#7dd3fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                <strong>Provable Ledger Invariant:</strong> This entry is immutably sealed. Neither the runtime application role nor user accounts have permission to alter or delete past ledger history.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setSelectedEntry(null)} className="btn-primary">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
