import React from 'react';
import { formatPaise } from '../../utils/money';

export interface MoneyDisplayProps {
  paise: number | bigint;
  variant?: 'credit' | 'debit' | 'neutral' | 'warning';
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
  className?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  paise,
  variant = 'neutral',
  showSign = false,
  size = 'md',
  style,
  className = '',
}) => {
  const formatted = formatPaise(paise, { showSign });

  const getVariantColor = () => {
    switch (variant) {
      case 'credit':
        return 'var(--color-secondary)'; // Teal
      case 'debit':
        return 'var(--color-danger)'; // Rose
      case 'warning':
        return 'var(--color-warning)'; // Amber
      case 'neutral':
      default:
        return 'var(--color-text-primary)';
    }
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg' | 'xl', React.CSSProperties> = {
    sm: { fontSize: '0.875rem', fontWeight: 500 },
    md: { fontSize: '1rem', fontWeight: 600 },
    lg: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    xl: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em' },
  };

  return (
    <span
      className={`tabular-nums money-value ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontVariantNumeric: 'tabular-nums',
        color: getVariantColor(),
        ...sizeStyles[size],
        ...style,
      }}
    >
      {formatted}
    </span>
  );
};
