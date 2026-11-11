import React, { useState, useRef } from 'react';
import { Shield, Copy, Check, Sparkles, CreditCard, Radio } from 'lucide-react';

interface Interactive3DCardProps {
  accountNumber: string;
  balance: number;
  currency?: string;
  cardHolderName?: string;
  status?: string;
}

export const Interactive3DCard: React.FC<Interactive3DCardProps> = ({
  accountNumber,
  balance,
  currency = 'USD',
  cardHolderName = 'SYNTHETIC ACCOUNT HOLDER',
  status = 'ACTIVE',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [copied, setCopied] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation limits (-15 deg to +15 deg)
    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotateX(rotX);
    setRotateY(rotY);

    // Specular glare position percentage
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((g) => ({ ...g, opacity: 0 }));
  };

  const copyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        perspective: '1200px',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: `
            ${-rotateY * 2}px ${rotateX * 2}px 30px rgba(0, 0, 0, 0.6),
            0 0 20px rgba(2, 132, 199, 0.25)
          `,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Dynamic Holographic Specular Glare */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, transparent 60%)`,
            pointerEvents: 'none',
            borderRadius: '16px',
            transition: 'background 0.05s ease',
            zIndex: 1,
          }}
        />

        {/* Micro-Circuit Background Texture */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Top Header of Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
            }}>
              <Shield size={16} color="#0f172a" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Balance<span style={{ color: '#38bdf8' }}>Vault</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Provable Ledger Card
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={14} color="#34d399" className="animate-pulse" />
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textTransform: 'uppercase',
            }}>
              {status}
            </span>
          </div>
        </div>

        {/* Middle: Metallic Chip and Contactless Symbol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 2, margin: '0.25rem 0' }}>
          {/* Metallic Gold Chip */}
          <div style={{
            width: '42px',
            height: '32px',
            background: 'linear-gradient(135deg, #fef08a 0%, #ca8a04 50%, #eab308 100%)',
            borderRadius: '6px',
            border: '1px solid #713f12',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.4)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: '#854d0e',
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '1px',
              backgroundColor: '#854d0e',
            }} />
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Balance
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-mono)',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}>
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', marginLeft: '0.35rem' }}>{currency}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Embossed Account Number & Holder */}
        <div style={{ zIndex: 2 }}>
          <div
            onClick={copyAccount}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.35rem',
            }}
          >
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              fontFamily: 'var(--font-mono)',
              color: '#f8fafc',
              textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.2)',
            }}>
              {accountNumber}
            </div>
            <button
              type="button"
              title="Copy Account Number"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 6px',
                color: copied ? '#34d399' : '#cbd5e1',
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                Account Holder
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                {cardHolderName}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                SYNTHETIC DEMO
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                VERIFIED LEDGER
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
        [ Hover/tilt for 3D holographic parallax & specular reflection ]
      </div>
    </div>
  );
};
