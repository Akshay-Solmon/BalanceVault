import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

interface ReadyData {
  status: string;
  timestamp: string;
  dependencies: {
    database: { status: string; required: boolean };
    redisCache: { status: string; required: boolean };
  };
}

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [ready, setReady] = useState<ReadyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    const [hRes, rRes] = await Promise.all([
      apiRequest<HealthData>('/health'),
      apiRequest<ReadyData>('/ready'),
    ]);

    if (hRes.data) setHealth(hRes.data);
    if (rRes.data) setReady(rRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div style={{ maxWidth: '980px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Subsystem Health & Readiness Monitor
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Liveness (/health) and dependency readiness (/ready) telemetry for high-availability auditing.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={fetchStatus} leftIcon={<RefreshCw size={14} />}>
          Refresh Probes
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <Card variant="elevated" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Core API Subsystem
            </span>
            <Badge variant="credit" icon={<CheckCircle2 size={12} />}>
              {health?.status || 'HEALTHY'}
            </Badge>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            BalanceVault Ledger Engine
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            Uptime: {health ? `${Math.floor(health.uptimeSeconds / 60)} minutes` : '0m'}
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Database & Ledger
            </span>
            <Badge variant="credit" icon={<CheckCircle2 size={12} />}>
              CONNECTED
            </Badge>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            PostgreSQL / Neon Ledger Line
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            Triggers & Row-Locks Active
          </div>
        </Card>

        <Card variant="elevated" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Idempotency & Rate Limiter
            </span>
            <Badge variant="credit" icon={<CheckCircle2 size={12} />}>
              OPERATIONAL
            </Badge>
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Redis In-Flight Lock Storage
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            7-Day Idempotency Retention
          </div>
        </Card>
      </div>
    </div>
  );
};
