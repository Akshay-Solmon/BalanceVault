import React from 'react';

export type BadgeVariant = 'credit' | 'debit' | 'warning' | 'info' | 'neutral' | 'readonly';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'credit': // Teal #22D3B7
        return {
          backgroundColor: 'rgba(34, 211, 183, 0.12)',
          color: 'var(--color-secondary)',
          border: '1px solid rgba(34, 211, 183, 0.3)',
        };
      case 'debit': // Rose #FF5C7A
        return {
          backgroundColor: 'rgba(255, 92, 122, 0.12)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(255, 92, 122, 0.3)',
        };
      case 'warning': // Amber #F5B84B
        return {
          backgroundColor: 'rgba(245, 184, 75, 0.12)',
          color: 'var(--color-warning)',
          border: '1px solid rgba(245, 184, 75, 0.3)',
        };
      case 'info': // Blue #4F8CFF
        return {
          backgroundColor: 'rgba(79, 140, 255, 0.12)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(79, 140, 255, 0.3)',
        };
      case 'readonly': // Distinct badge for Auditor mode
        return {
          backgroundColor: 'rgba(138, 148, 178, 0.15)',
          color: '#E8ECF8',
          border: '1px solid #8A94B2',
          letterSpacing: '0.05em',
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'rgba(138, 148, 178, 0.1)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-surface-border)',
        };
    }
  };

  const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
    sm: { padding: '0.15rem 0.45rem', fontSize: '0.7rem', gap: '0.25rem' },
    md: { padding: '0.25rem 0.625rem', fontSize: '0.75rem', gap: '0.375rem' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: 1.2,
        userSelect: 'none',
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      className={`badge badge-${variant} ${className}`}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
