import React from 'react';
import { AlertTriangle, Lock, ShieldAlert, FileQuestion, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  status?: number | string;
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  status,
  title,
  message,
  onRetry,
}) => {
  const getIcon = () => {
    switch (status) {
      case 401:
        return <Lock size={28} color="var(--color-warning)" />;
      case 403:
        return <ShieldAlert size={28} color="var(--color-danger)" />;
      case 404:
        return <FileQuestion size={28} color="var(--color-primary)" />;
      default:
        return <AlertTriangle size={28} color="var(--color-danger)" />;
    }
  };

  const getDefaultTitle = () => {
    switch (status) {
      case 401:
        return 'Authentication Required';
      case 403:
        return 'Access Restricted by Authorization Policy';
      case 404:
        return 'Account or Ledger Resource Not Found';
      default:
        return 'Operation Refused or Failed';
    }
  };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-border)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '520px',
        margin: '2rem auto',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '0.875rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(255, 92, 122, 0.1)',
          marginBottom: '1rem',
        }}
      >
        {getIcon()}
      </div>

      <h4
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        {title || getDefaultTitle()}
      </h4>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          maxWidth: '420px',
          marginBottom: onRetry ? '1.5rem' : 0,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw size={14} />}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
