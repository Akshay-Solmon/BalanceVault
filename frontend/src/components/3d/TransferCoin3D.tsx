import React, { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../../utils/motion';
import { formatPaise } from '../../utils/money';

export interface TransferCoin3DProps {
  amountPaise: number | bigint;
  sourceLabel?: string;
  destinationLabel?: string;
  onAnimationComplete?: () => void;
}

export const TransferCoin3D: React.FC<TransferCoin3DProps> = ({
  amountPaise,
  sourceLabel = 'Your Account',
  destinationLabel = 'Recipient',
  onAnimationComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const isReducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (isReducedMotion) {
      // If user prefers reduced motion, complete immediately
      const timer = setTimeout(() => {
        onAnimationComplete && onAnimationComplete();
      }, 500);
      return () => clearTimeout(timer);
    }

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth animation

    let frameId: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      // Ease in-out cubic
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setProgress(eased);

      if (p < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          onAnimationComplete && onAnimationComplete();
        }, 300);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [isReducedMotion, onAnimationComplete]);

  // Coordinates along an arc
  const startX = 15; // percentage
  const endX = 85;
  const currentX = startX + (endX - startX) * progress;
  // Parabolic arc for vertical leap
  const heightArc = Math.sin(progress * Math.PI) * 45; // peak at mid-point
  const currentY = 50 - heightArc;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '140px',
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-surface-border)',
        overflow: 'hidden',
        margin: '1rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      {/* Background Arc Line */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M 60 70 Q 250 10 440 70"
          fill="none"
          stroke="rgba(79, 140, 255, 0.25)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Source Anchor */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 92, 122, 0.15)',
            border: '2px solid var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.35rem',
            boxShadow: 'var(--shadow-glow-danger)',
          }}
        >
          <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.85rem' }}>-₹</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {sourceLabel}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
          DEBIT
        </div>
      </div>

      {/* 3D Traveling Token */}
      <div
        style={{
          position: 'absolute',
          left: `${currentX}%`,
          top: `${currentY}%`,
          transform: `translate(-50%, -50%) rotateY(${progress * 720}deg) rotateZ(${progress * 180}deg)`,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #6BA0FF 0%, #4F8CFF 60%, #1A2340 100%)',
          border: '2px solid #22D3B7',
          boxShadow: '0 0 16px rgba(34, 211, 183, 0.6), 0 4px 10px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.9rem',
          zIndex: 5,
        }}
      >
        ₹
      </div>

      {/* Destination Anchor */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 211, 183, 0.15)',
            border: '2px solid var(--color-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.35rem',
            boxShadow: 'var(--shadow-glow-secondary)',
          }}
        >
          <span style={{ color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>+₹</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {destinationLabel}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
          CREDIT
        </div>
      </div>

      {/* Floating Transfer Amount Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(11, 16, 32, 0.9)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-full)',
          padding: '0.2rem 0.75rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-secondary)',
          letterSpacing: '0.02em',
        }}
      >
        Transferring {formatPaise(amountPaise)}
      </div>
    </div>
  );
};
