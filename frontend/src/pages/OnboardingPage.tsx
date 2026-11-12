import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
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
  const { showToast } = useToast();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [legalFullName, setLegalFullName] = useState('');
  const [entityType, setEntityType] = useState('INDIVIDUAL');
  const [jurisdiction, setJurisdiction] = useState('IN');
  const [taxIdMasked, setTaxIdMasked] = useState('PAN-XXXXX-9182');
  const [expectedAnnualVolume, setExpectedAnnualVolume] = useState('₹1,00,000 - ₹10,00,000');

  const fetchProfile = async () => {
    setLoading(true);
    const res = await apiRequest<{ profile: OnboardingProfile }>('/api/onboarding/profile');
    if (res.data?.profile) {
      const p = res.data.profile;
      setProfile(p);
      setLegalFullName(p.legalFullName || '');
      setEntityType(p.entityType || 'INDIVIDUAL');
      setJurisdiction(p.jurisdiction || 'IN');
      setTaxIdMasked(p.taxIdMasked || 'PAN-XXXXX-9182');
      setExpectedAnnualVolume(p.expectedAnnualVolume || '₹1,00,000 - ₹10,00,000');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
      showToast({ type: 'refused', title: 'Could Not Save Draft', description: res.error });
    } else {
      showToast({ type: 'success', title: 'Draft Saved', description: 'Onboarding profile draft updated.' });
      await fetchProfile();
    }
    setSaving(false);
  };

  const handleSubmitReview = async () => {
    setSubmitting(true);

    await apiRequest('/api/onboarding/profile', {
      method: 'PUT',
      body: JSON.stringify({ legalFullName, entityType, jurisdiction, taxIdMasked, expectedAnnualVolume }),
    });

    const res = await apiRequest('/api/onboarding/submit', { method: 'POST' });

    if (res.error) {
      showToast({ type: 'refused', title: 'Submission Refused', description: res.error });
    } else {
      showToast({ type: 'success', title: 'Submitted for Review', description: 'Administrator will review your synthetic profile.' });
      await fetchProfile();
      await refreshUser();
    }
    setSubmitting(false);
  };

  const isLocked = profile?.status === 'SUBMITTED' || profile?.status === 'UNDER_REVIEW' || profile?.status === 'APPROVED';

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <FileText size={22} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Account Holder Onboarding & KYC
          </h1>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          FR-6: Required before double-entry ledger accounts are provisioned and balances unlocked.
        </p>
      </div>

      {/* Current Status Card */}
      {profile && (
        <Card variant="elevated" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Submission Status
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
              {profile.status}
            </div>
            {profile.reviewerNotes && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Note: {profile.reviewerNotes}
              </div>
            )}
          </div>

          <Badge
            variant={
              profile.status === 'APPROVED'
                ? 'credit'
                : profile.status === 'REJECTED'
                ? 'debit'
                : 'warning'
            }
          >
            {profile.status}
          </Badge>
        </Card>
      )}

      {/* Form Card */}
      <Card variant="default" style={{ padding: '2rem' }}>
        <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Legal Full Name"
            value={legalFullName}
            onChange={(e) => setLegalFullName(e.target.value)}
            disabled={isLocked}
            placeholder="e.g. Alice Smith"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Entity Type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              disabled={isLocked}
              placeholder="INDIVIDUAL or BUSINESS"
            />

            <Input
              label="Jurisdiction Code"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              disabled={isLocked}
              placeholder="IN, US, UK..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Masked Tax ID"
              value={taxIdMasked}
              onChange={(e) => setTaxIdMasked(e.target.value)}
              disabled={isLocked}
              isMonospace
              helperText="Synthetic demo data only."
            />

            <Input
              label="Expected Annual Movement"
              value={expectedAnnualVolume}
              onChange={(e) => setExpectedAnnualVolume(e.target.value)}
              disabled={isLocked}
            />
          </div>

          {!isLocked && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="submit" variant="secondary" isLoading={saving} leftIcon={<Save size={14} />}>
                Save Draft
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleSubmitReview}
                isLoading={submitting}
                rightIcon={<ArrowRight size={14} />}
              >
                Submit for Approval
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
