import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const SyntheticBanner: React.FC = () => {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #78350f 0%, #451a03 100%)',
      borderBottom: '1px solid #d97706',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      color: '#fef3c7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      fontWeight: 500,
      textAlign: 'center',
      zIndex: 50,
      position: 'relative'
    }}>
      <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
      <span>
        <strong>HACKATHON DEMONSTRATION BUILD:</strong> Synthetic data only. Not a production financial service and not for handling real funds.
      </span>
      <span style={{
        background: 'rgba(251, 191, 36, 0.2)',
        padding: '0.125rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: '1px solid rgba(251, 191, 36, 0.4)'
      }}>
        Ledger Proved
      </span>
    </div>
  );
};
