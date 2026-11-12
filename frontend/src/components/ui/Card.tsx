import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  isHoverable = false,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-surface-border)',
          boxShadow: 'var(--shadow-card-elevated)',
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(19, 26, 46, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-surface-border)',
          boxShadow: 'var(--shadow-card)',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          boxShadow: 'var(--shadow-card)',
        };
    }
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        transition: 'transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal)',
        ...getVariantStyles(),
        ...(isHoverable ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      className={`card ${isHoverable ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
