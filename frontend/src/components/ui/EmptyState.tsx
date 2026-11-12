import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      {icon && (
        <div
          style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-surface-border)',
            color: 'var(--color-primary)',
            marginBottom: '1rem',
          }}
        >
          {icon}
        </div>
      )}
      <h4
        style={{
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '0.375rem',
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          marginBottom: action ? '1.5rem' : 0,
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
