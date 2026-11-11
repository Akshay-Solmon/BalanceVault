import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Save, 
  RefreshCw 
} from 'lucide-react';

interface OnboardingProfile {
  id: string;
  legalFullName: string;
  entityType: string;
  jurisdiction: string;
  taxIdMasked: string;
  expectedAnnualVolume: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewerNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [legalFullName, setLegalFullName] = useState('');
  const [entityType, setEntityType] = useState('INDIVIDUAL');
  const [jurisdiction, setJurisdiction] = useState('US');
  const [taxIdMasked, setTaxIdMasked] = useState('SYN-XXX-9182');
  const [expectedAnnualVolume, setExpectedAnnualVolume] = useState('$10,000 - $50,000');

  const fetchProfile = async () => {
    setLoading(true);
    const res = await apiRequest<{ profile: OnboardingProfile }>('/api/onboarding/profile');
    if (res.data?.profile) {
      const p = res.data.profile;
      setProfile(p);
      setLegalFullName(p.legalFullName || '');
      setEntityType(p.entityType || 'INDIVIDUAL');
      setJurisdiction(p.jurisdiction || 'US');
      setTaxIdMasked(p.taxIdMasked || 'SYN-XXX-9182');
      setExpectedAnnualVolume(p.expectedAnnualVolume || '$10,000 - $50,000');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await apiRequest('/api/onboarding/profile', {
      method: 'PUT',
      body: JSON.stringify({
        legalFullName,
        entityType,
        jurisdiction,
        taxIdMasked,
        expectedAnnualVolume,
      }),
    });

    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      setMsg({ type: 'success', text: 'Onboarding draft saved successfully.' });
      await fetchProfile();
    }
    setSaving(false);
  };

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setMsg(null);

    // First save latest values
    await apiRequest('/api/onboarding/profile', {
      method: 'PUT',
      body: JSON.stringify({ legalFullName, entityType, jurisdiction, taxIdMasked, expectedAnnualVolume }),
    });

    // Then submit
    const res = await apiRequest('/api/onboarding/submit', {
      method: 'POST',
    });

    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      setMsg({ type: 'success', text: 'Onboarding submitted for compliance and admin review!' });
      await fetchProfile();
      await refreshUser();
    }
    setSubmitting(false);
  };

  const isLocked = profile?.status === 'SUBMITTED' || profile?.status === 'UNDER_REVIEW' || profile?.status === 'APPROVED';

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                Account Holder Onboarding
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              FR-6 & FR-7: Structured path from registration to an active, provable account
            </p>
          </div>

          <div>
            {profile?.status === 'APPROVED' && (
              <span className="badge badge-green"><CheckCircle2 size={13} /> APPROVED</span>
            )}
            {(profile?.status === 'SUBMITTED' || profile?.status === 'UNDER_REVIEW') && (
              <span className="badge badge-amber"><Clock size={13} /> PENDING REVIEW</span>
            )}
            {profile?.status === 'DRAFT' && (
              <span className="badge badge-blue">DRAFT</span>
            )}
            {profile?.status === 'REJECTED' && (
              <span className="badge badge-red"><XCircle size={13} /> REJECTED</span>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {msg && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: msg.type === 'success' ? '#34d399' : '#f87171',
          }}>
            {msg.text}
          </div>
        )}

        {/* Status Callout */}
        {profile?.status === 'APPROVED' && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '1rem',
            color: '#6ee7b7',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <ShieldCheck size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong>Onboarding Approved & Verified!</strong> Your active account and ledger have been provisioned. You can now execute auditable money movements.
            </div>
          </div>
        )}

        {(profile?.status === 'SUBMITTED' || profile?.status === 'UNDER_REVIEW') && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '1rem',
            color: '#fcd34d',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <Clock size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong>Application Under Administrator Review.</strong> Submitted on {profile?.submittedAt ? new Date(profile.submittedAt).toLocaleString() : 'recently'}. An administrator must inspect and approve this request.
            </div>
          </div>
        )}

        {profile?.status === 'REJECTED' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            color: '#fca5a5',
            marginBottom: '1.5rem',
          }}>
            <strong>Submission Rejected.</strong> Reviewer feedback: <em>{profile.reviewerNotes || 'Information requires correction.'}</em>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Legal Full Name / Business Name
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={legalFullName}
                onChange={(e) => setLegalFullName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Entity Classification
              </label>
              <select
                disabled={isLocked}
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="input-field"
              >
                <option value="INDIVIDUAL">Individual Account Holder</option>
                <option value="BUSINESS">Commercial / Business Entity</option>
                <option value="FINTECH_PARTNER">Institutional / Partner (Demo)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Jurisdiction / Country
              </label>
              <select
                disabled={isLocked}
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="input-field"
              >
                <option value="US">United States (USD)</option>
                <option value="CA">Canada (CAD)</option>
                <option value="GB">United Kingdom (GBP)</option>
                <option value="IN">India (INR)</option>
                <option value="EU">European Union (EUR)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Tax Identifier (Synthetic Demo Mask)
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={taxIdMasked}
                onChange={(e) => setTaxIdMasked(e.target.value)}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Expected Annual Volume Tier
            </label>
            <select
              disabled={isLocked}
              value={expectedAnnualVolume}
              onChange={(e) => setExpectedAnnualVolume(e.target.value)}
              className="input-field"
            >
              <option value="$1,000 - $10,000">$1,000 - $10,000 (Low tier)</option>
              <option value="$10,000 - $50,000">$10,000 - $50,000 (Standard tier)</option>
              <option value="$50,000 - $250,000">$50,000 - $250,000 (Commercial tier)</option>
              <option value="$250,000+">$250,000+ (High volume tier)</option>
            </select>
          </div>

          {!isLocked && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving || submitting}
                className="btn-secondary"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={saving || submitting}
                className="btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit for Administrator Review'}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
