import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Wallet, 
  FileText, 
  Users, 
  Activity, 
  LogOut, 
  CheckCircle2, 
  Lock,
  ExternalLink 
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav style={{
      backgroundColor: '#0b1120',
      borderBottom: '1px solid #1e293b',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand */}
      <div 
        onClick={() => setCurrentView('dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)',
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Balance<span style={{ color: '#38bdf8' }}>Vault</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '-2px' }}>
            Auditable Account Ledger
          </div>
        </div>
      </div>

      {/* Nav Links */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`btn-secondary ${currentView === 'dashboard' ? 'active-nav' : ''}`}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: currentView === 'dashboard' ? '#1e293b' : 'transparent',
              borderColor: currentView === 'dashboard' ? '#38bdf8' : 'transparent',
            }}
          >
            <Wallet size={16} color={currentView === 'dashboard' ? '#38bdf8' : '#94a3b8'} />
            <span>My Account</span>
          </button>

          <button
            onClick={() => setCurrentView('onboarding')}
            className={`btn-secondary ${currentView === 'onboarding' ? 'active-nav' : ''}`}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: currentView === 'onboarding' ? '#1e293b' : 'transparent',
              borderColor: currentView === 'onboarding' ? '#38bdf8' : 'transparent',
            }}
          >
            <FileText size={16} color={currentView === 'onboarding' ? '#38bdf8' : '#94a3b8'} />
            <span>Onboarding</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setCurrentView('admin-users')}
                className={`btn-secondary ${currentView === 'admin-users' ? 'active-nav' : ''}`}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: currentView === 'admin-users' ? '#1e293b' : 'transparent',
                  borderColor: currentView === 'admin-users' ? '#38bdf8' : 'transparent',
                }}
              >
                <Users size={16} color={currentView === 'admin-users' ? '#38bdf8' : '#94a3b8'} />
                <span>Users & Review</span>
              </button>

              <button
                onClick={() => setCurrentView('admin-audit')}
                className={`btn-secondary ${currentView === 'admin-audit' ? 'active-nav' : ''}`}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: currentView === 'admin-audit' ? '#1e293b' : 'transparent',
                  borderColor: currentView === 'admin-audit' ? '#38bdf8' : 'transparent',
                }}
              >
                <Lock size={16} color={currentView === 'admin-audit' ? '#38bdf8' : '#94a3b8'} />
                <span>Audit Logs</span>
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentView('health')}
            className={`btn-secondary ${currentView === 'health' ? 'active-nav' : ''}`}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: currentView === 'health' ? '#1e293b' : 'transparent',
              borderColor: currentView === 'health' ? '#38bdf8' : 'transparent',
            }}
          >
            <Activity size={16} color={currentView === 'health' ? '#38bdf8' : '#94a3b8'} />
            <span>Health</span>
          </button>
        </div>
      )}

      {/* Right User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                {user.email}
              </div>
              <span className={`badge ${isAdmin ? 'badge-amber' : 'badge-blue'}`}>
                {user.role === 'ADMIN' ? 'Administrator' : 'Account Holder'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="btn-secondary"
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            >
              <LogOut size={16} color="#94a3b8" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentView('bootstrap')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <Lock size={14} /> Admin Bootstrap
            </button>
            <button
              onClick={() => setCurrentView('health')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <Activity size={14} /> System Health
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
