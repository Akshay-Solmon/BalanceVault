import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { ShieldAlert, CheckCircle2, Lock, Key, ArrowRight, Database, Terminal } from 'lucide-react';

interface BootstrapPageProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const BootstrapPage: React.FC<BootstrapPageProps> = ({ onSuccess, onBackToLogin }) => {
  const [bootStatus, setBootStatus] = useState<{ isBootstrapped: boolean; adminCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('admin.master@balancevault.internal');
  const [password, setPassword] = useState('VaultAdmin2026!Secure');
  const [bootstrapToken, setBootstrapToken] = useState('bv_operator_secure_bootstrap_key_2026');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const res = await apiRequest<{ isBootstrapped: boolean; adminCount: number }>('/api/bootstrap/status');
    if (res.data) {
      setBootStatus(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const res = await apiRequest('/api/bootstrap/admin', {
      method: 'POST',
      body: JSON.stringify({ email, password, bootstrapToken }),
    });

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('First platform administrator successfully bootstrapped! You can now sign in.');
      fetchStatus();
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            padding: '0.625rem',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <Lock size={24} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              First-Administrator Bootstrap (M6 / M7)
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              FR-12: Controlled first admin initialization via restricted bootstrap operator role
            </p>
          </div>
        </div>

        {/* Database Status Alert */}
        <div style={{
          backgroundColor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
              Platform Bootstrap State:
            </span>
            {loading ? (
              <span className="badge badge-amber">Checking...</span>
            ) : bootStatus?.isBootstrapped ? (
              <span className="badge badge-green">
                <CheckCircle2 size={12} /> Bootstrapped ({bootStatus.adminCount} Admin)
              </span>
            ) : (
              <span className="badge badge-amber">
                <ShieldAlert size={12} /> Pending First Admin
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
            In managed PostgreSQL environments such as Neon, role administration is separated from schema ownership to prevent <code style={{ color: '#38bdf8' }}>SQLSTATE 42501</code>. The bootstrap channel can only be executed once.
          </p>
        </div>

        {bootStatus?.isBootstrapped ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1rem',
              color: '#6ee7b7',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto 0.5rem' }} />
              <strong>Bootstrap Complete!</strong> Platform administrator already exists. Subsequent administrators must be managed by authenticated admins.
            </div>
            <button onClick={onBackToLogin} className="btn-primary" style={{ margin: '0 auto' }}>
              Proceed to Sign In <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleBootstrap} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                padding: '0.75rem',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                padding: '0.75rem',
                borderRadius: '8px',
                color: '#6ee7b7',
                fontSize: '0.85rem',
              }}>
                {successMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Bootstrap Operator Token (Confidential Key)
              </label>
              <input
                type="text"
                required
                value={bootstrapToken}
                onChange={(e) => setBootstrapToken(e.target.value)}
                className="input-field font-mono"
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Authorized secret configured on server environment (<code style={{ color: '#94a3b8' }}>BOOTSTRAP_TOKEN</code>)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Root Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Root Administrator Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {submitting ? 'Executing Function...' : 'Execute Bootstrap Function'}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onBackToLogin}
                className="btn-secondary"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
