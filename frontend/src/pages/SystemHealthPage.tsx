import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Activity, Database, Server, Cpu, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

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
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Activity size={22} color="#38bdf8" />
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                Operational Health & Readiness Probes
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                FR-16 & FR-17: Continuous liveness and dependency readiness monitors
              </p>
            </div>
          </div>

          <button onClick={fetchStatus} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Probe Endpoints
          </button>
        </div>

        {/* Status Indicators Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Liveness Probe */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Liveness (/health)</span>
              </div>
              <span className={`badge ${health?.status === 'UP' ? 'badge-green' : 'badge-red'}`}>
                {health?.status || 'UNKNOWN'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Uptime: <code className="font-mono" style={{ color: '#38bdf8' }}>{health?.uptimeSeconds || 0}s</code>
            </div>
          </div>

          {/* Readiness Probe */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Readiness (/ready)</span>
              </div>
              <span className={`badge ${ready?.status === 'READY' ? 'badge-green' : 'badge-amber'}`}>
                {ready?.status || 'UNKNOWN'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Subsystems evaluated: <code className="font-mono">2 Services</code>
            </div>
          </div>

          {/* Database Dependency */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Postgres / Storage</span>
              </div>
              <span className={`badge ${ready?.dependencies?.database?.status === 'CONNECTED' ? 'badge-green' : 'badge-red'}`}>
                {ready?.dependencies?.database?.status || 'DISCONNECTED'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Primary relational store & migrations
            </div>
          </div>
        </div>

        {/* Detailed Dependency Breakdown */}
        <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem' }}>
            Subsystem Architecture & Rate Limiting Strategy
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>PostgreSQL Store:</strong> Enforces least-privilege role separation (owner vs app runtime vs bootstrap operator) and guarantees append-only audit trail immutability.
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Redis Rate Limiter & Fallback:</strong> Redis-backed sliding window limiter for auth/sensitive operations. Status: <code style={{ color: '#38bdf8' }}>{ready?.dependencies?.redisCache?.status || 'IN_MEMORY_FALLBACK'}</code>.
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Synthetic Demo Boundary:</strong> All money movements, balances, and account numbers are simulated synthetic test data for hackathon evaluation.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
