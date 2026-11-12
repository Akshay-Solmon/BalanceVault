import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isMonospace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftAddon, rightAddon, isMonospace, id, style, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{label}</span>
          </label>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-surface-elevated)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-surface-border)'}`,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
          className="input-wrapper"
        >
          {leftAddon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                color: 'var(--color-text-muted)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRight: '1px solid var(--color-surface-border)',
                fontSize: '0.875rem',
                userSelect: 'none',
              }}
            >
              {leftAddon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              fontFamily: isMonospace ? 'var(--font-mono)' : 'inherit',
              fontVariantNumeric: isMonospace ? 'tabular-nums' : 'normal',
              width: '100%',
              ...style,
            }}
            className={`input-field ${className}`}
            {...props}
          />

          {rightAddon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-danger)',
              fontWeight: 500,
            }}
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${inputId}-help`}
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
