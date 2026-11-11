import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Filter, 
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  onboarding?: {
    id: string;
    legalFullName: string;
    entityType: string;
    jurisdiction: string;
    status: string;
  } | null;
  account?: {
    id: string;
    accountNumber: string;
    balance: number;
    currency: string;
    status: string;
  } | null;
}

interface OnboardingSubmission {
  id: string;
  userId: string;
  legalFullName: string;
  entityType: string;
  jurisdiction: string;
  taxIdMasked: string;
  expectedAnnualVolume: string;
  status: string;
  submittedAt?: string;
  user: {
    id: string;
    email: string;
    status: string;
    role: string;
  };
}

export const AdminUsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'onboarding'>('onboarding');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Decision Modal State
  const [selectedSub, setSelectedSub] = useState<OnboardingSubmission | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setActionMsg(null);

    const [usersRes, subRes] = await Promise.all([
      apiRequest<{ users: UserRecord[] }>('/api/admin/users'),
      apiRequest<{ submissions: OnboardingSubmission[] }>('/api/admin/onboarding'),
    ]);

    if (usersRes.data?.users) setUsers(usersRes.data.users);
    if (subRes.data?.submissions) setSubmissions(subRes.data.submissions);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedSub) return;
    setProcessingDecision(true);
    setActionMsg(null);

    const res = await apiRequest(`/api/admin/onboarding/${selectedSub.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        notes: decisionNotes,
      }),
    });

    if (res.error) {
      setActionMsg({ type: 'error', text: res.error });
    } else {
      setActionMsg({
        type: 'success',
        text: decision === 'APPROVE'
          ? `Application approved! Account ${res.data?.account?.accountNumber} provisioned.`
          : 'Application rejected.',
      });
      setSelectedSub(null);
      setDecisionNotes('');
      await fetchData();
    }
    setProcessingDecision(false);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const res = await apiRequest(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.error) {
      setActionMsg({ type: 'error', text: res.error });
    } else {
      setActionMsg({ type: 'success', text: `User status updated to ${newStatus}.` });
      await fetchData();
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW');

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header and Tab Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
            Administrator Operations Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            FR-9 & FR-10: User management, onboarding review queue, and ledger account provisioning
          </p>
        </div>

        <button onClick={fetchData} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {actionMsg && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          background: actionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${actionMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: actionMsg.type === 'success' ? '#34d399' : '#f87171',
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('onboarding')}
          className="btn-secondary"
          style={{
            backgroundColor: activeTab === 'onboarding' ? '#1e293b' : 'transparent',
            borderColor: activeTab === 'onboarding' ? '#38bdf8' : '#334155',
            color: activeTab === 'onboarding' ? '#38bdf8' : '#94a3b8',
          }}
        >
          <Clock size={16} />
          <span>Pending Onboarding Reviews</span>
          {pendingSubmissions.length > 0 && (
            <span style={{
              background: '#f59e0b',
              color: '#000',
              padding: '0.1rem 0.4rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}>
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className="btn-secondary"
          style={{
            backgroundColor: activeTab === 'users' ? '#1e293b' : 'transparent',
            borderColor: activeTab === 'users' ? '#38bdf8' : '#334155',
            color: activeTab === 'users' ? '#38bdf8' : '#94a3b8',
          }}
        >
          <Users size={16} />
          <span>All Platform Users ({users.length})</span>
        </button>
      </div>

      {/* Tab 1: Onboarding Reviews */}
      {activeTab === 'onboarding' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            Onboarding Applications Queue
          </h3>

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              No onboarding submissions recorded.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Applicant / Legal Name</th>
                    <th>Email</th>
                    <th>Jurisdiction</th>
                    <th>Volume Tier</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {sub.legalFullName}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.entityType}</div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {sub.user?.email}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{sub.jurisdiction}</td>
                      <td style={{ fontSize: '0.8rem' }}>{sub.expectedAnnualVolume}</td>
                      <td>
                        <span className={`badge ${
                          sub.status === 'APPROVED' ? 'badge-green' :
                          sub.status === 'SUBMITTED' ? 'badge-amber' :
                          sub.status === 'REJECTED' ? 'badge-red' : 'badge-blue'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}
                      </td>
                      <td>
                        {sub.status === 'SUBMITTED' || sub.status === 'UNDER_REVIEW' ? (
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            Platform Users Directory
          </h3>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email / Account</th>
                  <th>Role</th>
                  <th>User Status</th>
                  <th>Onboarding</th>
                  <th>Ledger Balance</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.email}</div>
                      {u.account?.accountNumber ? (
                        <code className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                          {u.account.accountNumber}
                        </code>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>No account provisioned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-amber' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {u.onboarding?.status || 'None'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {u.account ? `$${u.account.balance.toFixed(2)}` : '—'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        u.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#f87171' }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#34d399' }}
                          >
                            Reactivate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedSub && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
              Review Onboarding Application
            </h3>

            <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Applicant Name:</span> <strong>{selectedSub.legalFullName}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Entity Type:</span> <strong>{selectedSub.entityType}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Jurisdiction:</span> <strong>{selectedSub.jurisdiction}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Synthetic Tax ID:</span> <code className="font-mono">{selectedSub.taxIdMasked}</code>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Volume Tier:</span> <strong>{selectedSub.expectedAnnualVolume}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Reviewer Compliance Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add audit rationale or review details..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="input-field"
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingDecision}
                onClick={() => handleDecision('REJECT')}
                className="btn-secondary"
                style={{ color: '#f87171', borderColor: '#ef4444' }}
              >
                <X size={15} /> Reject
              </button>
              <button
                type="button"
                disabled={processingDecision}
                onClick={() => handleDecision('APPROVE')}
                className="btn-primary"
              >
                <Check size={15} /> Approve & Provision Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
