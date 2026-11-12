import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { VaultHero3D } from '../components/3d/VaultHero3D';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, ArrowRight, UserPlus, LogIn, Lock, CheckCircle2, ShieldAlert, Eye } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register';
  onNavigateToBootstrap?: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onNavigateToBootstrap,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalFullName, setLegalFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, switchDemoRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          login(res.data.token, res.data.user);
        }
      } else {
        const res = await apiRequest<{ token: string; user: any }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, legalFullName }),
        });

        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          login(res.data.token, res.data.user);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (type: 'admin' | 'user' | 'auditor') => {
    setError(null);
    if (type === 'admin') {
      setEmail('admin.master@balancevault.internal');
      setPassword('VaultAdmin2026!Secure');
      setIsLogin(true);
    } else if (type === 'user') {
      setEmail('alice.holder@example.com');
      setPassword('password123');
      setIsLogin(true);
    } else if (type === 'auditor') {
      switchDemoRole('AUDITOR');
    }
  };

  return (
    <div
      style={{
        maxWidth: '1080px',
        margin: '2rem auto',
        padding: '0 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center',
      }}
    >
      {/* Left Column: 3D Hero & PRD Value Proposition */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <VaultHero3D size={280} />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'rgba(79, 140, 255, 0.12)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(79, 140, 255, 0.3)',
            color: 'var(--color-primary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          <Shield size={14} /> Tamper-Proof Cryptographic Vault
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Money movement with a ledger you can prove.
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            maxWidth: '440px',
            margin: '0 auto 1.5rem',
          }}
        >
          Balance conservation on every route, zero-drift double-entry postings, and atomic balance floors backed by append-only hash chains.
        </p>

        {/* 1-Click Role Switcher Demo Helpers */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            maxWidth: '420px',
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Quick Demo Persona Fill:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemoCreds('user')}
            >
              Account Holder
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemoCreds('admin')}
            >
              Administrator
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fillDemoCreds('auditor')}
              leftIcon={<Eye size={13} color="var(--color-warning)" />}
            >
              Auditor (Read-Only)
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div>
        <Card variant="elevated" style={{ padding: '2rem', maxWidth: '440px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(79, 140, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLogin ? <LogIn size={16} color="var(--color-primary)" /> : <UserPlus size={16} color="var(--color-secondary)" />}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {isLogin ? 'Sign In to BalanceVault' : 'Register Demo Account'}
              </h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {isLogin
                ? 'Enter your credentials to access your verified ledger.'
                : 'Open an account holder demo identity for testing.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: 'var(--color-bg-base)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              style={{
                padding: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isLogin ? 'var(--color-surface)' : 'transparent',
                color: isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: isLogin ? 'var(--shadow-card)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              style={{
                padding: '0.45rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: !isLogin ? 'var(--color-surface)' : 'transparent',
                color: !isLogin ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                boxShadow: !isLogin ? 'var(--shadow-card)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(255, 92, 122, 0.1)',
                border: '1px solid var(--color-danger)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--color-danger)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <Lock size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <Input
                label="Legal Full Name"
                value={legalFullName}
                onChange={(e) => setLegalFullName(e.target.value)}
                placeholder="e.g. Alice Smith"
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              helperText={!isLogin ? 'Minimum 8 characters required' : undefined}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              loadingText={isLogin ? 'Verifying Credentials...' : 'Creating Account...'}
              rightIcon={<ArrowRight size={16} />}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {isLogin ? 'Sign In' : 'Create Demo Account'}
            </Button>
          </form>

          {/* Footer with Bootstrap Link */}
          {onNavigateToBootstrap && (
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--color-surface-border)',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
              }}
            >
              First time setup?{' '}
              <button
                type="button"
                onClick={onNavigateToBootstrap}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Bootstrap Initial Administrator
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
