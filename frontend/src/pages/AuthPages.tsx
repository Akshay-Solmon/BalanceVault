import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Shield, ArrowRight, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register';
  onNavigateToBootstrap: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ initialMode = 'login', onNavigateToBootstrap }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalFullName, setLegalFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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

  const fillDemoCreds = (demoType: 'admin' | 'user') => {
    if (demoType === 'admin') {
      setEmail('admin.master@balancevault.internal');
      setPassword('VaultAdmin2026!Secure');
    } else {
      setEmail('alice.holder@example.com');
      setPassword('password123');
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '3rem auto',
      padding: '0 1rem',
    }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            background: 'rgba(2, 132, 199, 0.15)',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            marginBottom: '0.75rem',
          }}>
            <Shield size={32} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
            {isLogin ? 'Sign In to BalanceVault' : 'Register Account'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {isLogin 
              ? 'Access your provable ledger and auditable operations'
              : 'Create a synthetic demo account to test onboarding & money movement'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#090d16',
          padding: '0.25rem',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          marginBottom: '1.5rem',
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              background: isLogin ? '#1e293b' : 'transparent',
              color: isLogin ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: 'none',
              background: !isLogin ? '#1e293b' : 'transparent',
              color: !isLogin ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <UserPlus size={14} /> Register
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Full Legal Name / Entity Name
              </label>
              <input
                type="text"
                required
                value={legalFullName}
                onChange={(e) => setLegalFullName(e.target.value)}
                placeholder="e.g. Jane Doe or Demo Corp"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast-Fill Helper */}
        {isLogin && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textAlign: 'center' }}>
              Quick Fill Hackathon Demo Accounts:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fillDemoCreds('user')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
              >
                Alice (Account Holder)
              </button>
              <button
                type="button"
                onClick={() => fillDemoCreds('admin')}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
              >
                Platform Admin
              </button>
            </div>
          </div>
        )}

        {/* First Admin Bootstrap Link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
          Need to configure the first administrator?{' '}
          <button
            type="button"
            onClick={onNavigateToBootstrap}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontWeight: 600,
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Open Admin Bootstrap Wizard
          </button>
        </div>
      </div>
    </div>
  );
};
