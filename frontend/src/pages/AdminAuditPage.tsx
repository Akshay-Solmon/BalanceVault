import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { 
  Lock, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileCode,
  Terminal
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actorId?: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress: string;
  userAgent: string;
  metadata: string;
}

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [actorEmailFilter, setActorEmailFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.append('action', actionFilter);
    if (outcomeFilter) params.append('outcome', outcomeFilter);
    if (actorEmailFilter) params.append('actorEmail', actorEmailFilter);
    params.append('limit', '100');

    const res = await apiRequest<{ logs: AuditLog[] }>(`/api/admin/audit-logs?${params.toString()}`);
    if (res.data?.logs) {
      setLogs(res.data.logs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, outcomeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Lock size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                Immutable Audit Trail Explorer
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              FR-11, FR-14, FR-15: Append-only cryptographically verifiable activity records. Restricted to administrators.
            </p>
          </div>

          <button onClick={fetchLogs} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearch} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 100px',
          gap: '0.75rem',
          background: '#090d16',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          marginBottom: '1.5rem',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="">All Actions</option>
              <option value="AUTH_LOGIN">AUTH_LOGIN</option>
              <option value="AUTH_REGISTER">AUTH_REGISTER</option>
              <option value="ADMIN_BOOTSTRAP">ADMIN_BOOTSTRAP</option>
              <option value="ONBOARDING_SUBMIT">ONBOARDING_SUBMIT</option>
              <option value="ONBOARDING_DECISION">ONBOARDING_DECISION</option>
              <option value="TRANSFER_EXECUTE">TRANSFER_EXECUTE</option>
              <option value="ACCESS_DENIED_ROLE_CHECK">ACCESS_DENIED_ROLE_CHECK</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              Outcome
            </label>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem' }}
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
              Actor Email
            </label>
            <input
              type="text"
              placeholder="Search by actor..."
              value={actorEmailFilter}
              onChange={(e) => setActorEmailFilter(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.625rem' }}
            >
              <Search size={14} /> Filter
            </button>
          </div>
        </form>

        {/* Audit Log Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Outcome</th>
                <th>Action</th>
                <th>Actor (Role)</th>
                <th>Target</th>
                <th>IP / Client</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No audit records matching the specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let parsedMeta: any = {};
                  try {
                    parsedMeta = JSON.parse(log.metadata);
                  } catch {
                    parsedMeta = { raw: log.metadata };
                  }
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${
                            log.outcome === 'SUCCESS' ? 'badge-green' :
                            log.outcome === 'DENIED' ? 'badge-amber' : 'badge-red'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                          {log.action}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                            {log.actorEmail}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.actorRole}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                          {log.targetType}:{log.targetId.substring(0, 10)}...
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {log.ipAddress}
                        </td>
                        <td>
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                          >
                            <FileCode size={12} /> {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ backgroundColor: '#090d16', padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                              <strong>Client User-Agent:</strong> {log.userAgent}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                              <strong>Target Details:</strong> Type: {log.targetType} | ID: {log.targetId}
                            </div>
                            <pre className="font-mono" style={{
                              background: '#040711',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: '#38bdf8',
                              overflowX: 'auto',
                              border: '1px solid #1e293b'
                            }}>
                              {JSON.stringify(parsedMeta, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
