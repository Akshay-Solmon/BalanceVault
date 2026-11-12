import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { VaultHero3D } from '../components/3d/VaultHero3D';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ShieldAlert, CheckCircle2, Lock, Key, ArrowRight } from 'lucide-react';

export interface BootstrapPageProps {
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
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <VaultHero3D size={200} />
      </div>

      <Card variant="elevated" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(79, 140, 255, 0.1)', marginBottom: '0.5rem' }}>
            <Key size={24} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            One-Time Administrator Bootstrap
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            FR-1: Initializes the root administrator identity for fresh deployments.
          </p>
        </div>

        {bootStatus?.isBootstrapped ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <Badge variant="credit" icon={<CheckCircle2 size={14} />} size="md" style={{ marginBottom: '1rem' }}>
              System Already Bootstrapped
            </Badge>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              The initial administrator already exists. Bootstrap endpoints are permanently locked to prevent unauthorized privilege escalation.
            </p>
            <Button variant="primary" onClick={onBackToLogin}>
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleBootstrap} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', backgroundColor: 'rgba(255, 92, 122, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ color: 'var(--color-secondary)', fontSize: '0.8125rem', backgroundColor: 'rgba(34, 211, 183, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                {successMsg}
              </div>
            )}

            <Input
              label="Root Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Admin Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Secret Bootstrap Token"
              type="password"
              value={bootstrapToken}
              onChange={(e) => setBootstrapToken(e.target.value)}
              isMonospace
              required
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={onBackToLogin}>
                Back
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting} loadingText="Bootstrapping...">
                Execute Bootstrap
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
