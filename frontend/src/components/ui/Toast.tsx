import React from 'react';
import { useToast, ToastType } from '../../context/ToastContext';
import { CheckCircle2, AlertOctagon, CopyCheck, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--color-secondary)" />;
      case 'refused':
        return <AlertOctagon size={18} color="var(--color-danger)" />;
      case 'duplicate':
        return <CopyCheck size={18} color="var(--color-warning)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--color-warning)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--color-primary)" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'var(--color-secondary)';
      case 'refused':
        return 'var(--color-danger)';
      case 'duplicate':
        return 'var(--color-warning)';
      case 'warning':
        return 'var(--color-warning)';
      case 'info':
      default:
        return 'var(--color-primary)';
    }
  };

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            backgroundColor: 'var(--color-surface)',
            borderLeft: `4px solid ${getBorderColor(toast.type)}`,
            borderTop: '1px solid var(--color-surface-border)',
            borderRight: '1px solid var(--color-surface-border)',
            borderBottom: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.125rem',
            boxShadow: 'var(--shadow-card-elevated)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <div style={{ marginTop: '0.125rem', flexShrink: 0 }}>
            {getToastIcon(toast.type)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {toast.title}
            </div>

            {toast.description && (
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.2rem',
                  lineHeight: 1.4,
                }}
              >
                {toast.description}
              </div>
            )}

            {toast.idempotencyKey && (
              <div
                style={{
                  marginTop: '0.375rem',
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.15rem 0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block',
                }}
              >
                Key: {toast.idempotencyKey}
              </div>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.125rem',
              display: 'flex',
              flexShrink: 0,
            }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
