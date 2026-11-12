import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '0.4rem 0.75rem', fontSize: '0.8125rem', gap: '0.375rem', borderRadius: 'var(--radius-sm)' },
    md: { padding: '0.625rem 1.125rem', fontSize: '0.875rem', gap: '0.5rem', borderRadius: 'var(--radius-md)' },
    lg: { padding: '0.8rem 1.5rem', fontSize: '1rem', gap: '0.625rem', borderRadius: 'var(--radius-md)' },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: 'var(--shadow-glow-primary)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: '#0B1020',
          fontWeight: 600,
          border: '1px solid transparent',
          boxShadow: 'var(--shadow-glow-secondary)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: '#ffffff',
          border: '1px solid transparent',
          boxShadow: 'var(--shadow-glow-danger)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-surface-border)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        };
    }
  };

  return (
    <button
      disabled={isDisabled}
      aria-busy={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
