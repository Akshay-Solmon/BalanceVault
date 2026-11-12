import React, { useState, useRef } from 'react';
import { Shield, Copy, Check, Lock, Radio } from 'lucide-react';
import { formatPaise } from '../../utils/money';
import { prefersReducedMotion } from '../../utils/motion';

export interface AccountCard3DProps {
  accountNumber: string;
  balancePaise: number | bigint;
  currency?: string;
  cardHolderName?: string;
  status?: string;
}

export const AccountCard3D: React.FC<AccountCard3DProps> = ({
  accountNumber,
  balancePaise,
  currency = 'INR',
  cardHolderName = 'PRIMARY ACCOUNT HOLDER',
  status = 'ACTIVE',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [copied, setCopied] = useState(false);

  const isMotionReduced = prefersReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMotionReduced || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle tilt: max 8 degrees
    const rX = ((y - centerY) / centerY) * -8;
    const rY = ((x - centerX) / centerX) * 8;

    setRotateX(rX);
    setRotateY(rY);

    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    if (isMotionReduced) return;
    setRotateX(0);
    setRotateY(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFrozen = status === 'FROZEN';

  return (
    <div
      style={{
        perspective: '1000px',
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          minHeight: '230px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          position: 'relative',
          background: isFrozen
            ? 'linear-gradient(135deg, #1A1F2C 0%, #0F131D 100%)'
            : 'linear-gradient(135deg, #131A2E 0%, #1A2340 50%, #0B1020 100%)',
          border: `1px solid ${isFrozen ? 'rgba(245, 184, 75, 0.4)' : 'var(--color-surface-border)'}`,
          boxShadow: 'var(--shadow-card-elevated)',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: isMotionReduced
            ? 'none'
            : 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Specular Glare Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}) 0%, transparent 60%)`,
            transition: 'opacity 0.15s ease',
            borderRadius: 'inherit',
          }}
        />

        {/* Card Top: Branding & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(79, 140, 255, 0.15)',
                border: '1px solid rgba(79, 140, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} color="var(--color-primary)" />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-text-primary)' }}>
                BALANCE<span style={{ color: 'var(--color-primary)' }}>VAULT</span>
              </span>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Double-Entry Ledger Account
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isFrozen ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-warning)',
                  backgroundColor: 'rgba(245, 184, 75, 0.15)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(245, 184, 75, 0.3)',
                }}
              >
                <Lock size={12} /> FROZEN
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--color-secondary)',
                  backgroundColor: 'rgba(34, 211, 183, 0.15)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(34, 211, 183, 0.3)',
                }}
              >
                <Radio size={12} /> ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Card Middle: Balance in ₹ from integer paise */}
        <div style={{ margin: '1.25rem 0 0.75rem', zIndex: 1 }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
            Available Verified Ledger Balance
          </div>
          <div
            className="tabular-nums"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              marginTop: '0.25rem',
            }}
          >
            {formatPaise(balancePaise)}
          </div>
        </div>

        {/* Card Bottom: Account Number & Copy */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid var(--color-surface-border)',
            paddingTop: '0.875rem',
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Number
            </div>
            <div
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                letterSpacing: '0.08em',
                marginTop: '0.15rem',
              }}
            >
              {accountNumber}
            </div>
          </div>

          <button
            onClick={handleCopy}
            title="Copy Account Number"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.6rem',
              color: copied ? 'var(--color-secondary)' : 'var(--color-text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
