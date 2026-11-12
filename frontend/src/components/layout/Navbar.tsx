import React from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../ui/Badge';
import { 
  Shield, 
  Wallet, 
  ArrowLeftRight, 
  FileText, 
  ShieldAlert, 
  Eye, 
  Boxes, 
  Sun, 
  Moon, 
  LogOut,
  Lock,
  UserCheck
} from 'lucide-react';

export interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { user, isAdmin, isAuditor, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-surface-border)',
        padding: '0.625rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => setCurrentView('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #1A2340 100%)',
              border: '1px solid var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
              Balance<span style={{ color: 'var(--color-primary)' }}>Vault</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Provable Double-Entry Ledger
            </div>
          </div>
        </div>

        {/* Auditor Read-Only Banner / Badge */}
        {isAuditor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="readonly" icon={<Lock size={12} />}>
              Read-Only Auditor Mode
            </Badge>
          </div>
        )}

        {/* Navigation Tabs */}
        {user && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: 'var(--color-surface-elevated)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: currentView === 'dashboard' ? 'var(--color-surface)' : 'transparent',
                color: currentView === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: currentView === 'dashboard' ? 'var(--shadow-card)' : 'none',
              }}
            >
              <Wallet size={15} />
              <span>Dashboard</span>
            </button>

            {/* Money Movement Forms (Hide for Auditor) */}
            {!isAuditor && (
              <button
                onClick={() => setCurrentView('money-movements')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: currentView === 'money-movements' ? 'var(--color-surface)' : 'transparent',
                  color: currentView === 'money-movements' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: currentView === 'money-movements' ? 'var(--shadow-card)' : 'none',
                }}
              >
                <ArrowLeftRight size={15} />
                <span>Move Money</span>
              </button>
            )}

            {/* Per-Account Statement */}
            <button
              onClick={() => setCurrentView('statement')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: currentView === 'statement' ? 'var(--color-surface)' : 'transparent',
                color: currentView === 'statement' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: currentView === 'statement' ? 'var(--shadow-card)' : 'none',
              }}
            >
              <FileText size={15} />
              <span>Statement</span>
            </button>

            {/* Ledger Integrity Page */}
            <button
              onClick={() => setCurrentView('ledger-integrity')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: currentView === 'ledger-integrity' ? 'var(--color-surface)' : 'transparent',
                color: currentView === 'ledger-integrity' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: currentView === 'ledger-integrity' ? 'var(--shadow-card)' : 'none',
              }}
            >
              <Boxes size={15} />
              <span>Ledger Integrity</span>
            </button>

            {/* Admin Console */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin-console')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: currentView === 'admin-console' ? 'var(--color-surface)' : 'transparent',
                  color: currentView === 'admin-console' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: currentView === 'admin-console' ? 'var(--shadow-card)' : 'none',
                }}
              >
                <ShieldAlert size={15} />
                <span>Admin Console</span>
              </button>
            )}

            {/* Auditor View */}
            {(isAuditor || isAdmin) && (
              <button
                onClick={() => setCurrentView('auditor-view')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: currentView === 'auditor-view' ? 'var(--color-surface)' : 'transparent',
                  color: currentView === 'auditor-view' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: currentView === 'auditor-view' ? 'var(--shadow-card)' : 'none',
                }}
              >
                <Eye size={15} />
                <span>Auditor View</span>
              </button>
            )}
          </nav>
        )}

        {/* Right Section: Role quick-switcher, Theme Toggle, User info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Demo Persona Switcher */}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-surface-border)',
              }}
              title="Quick demo role switch for testing"
            >
              <button
                onClick={() => switchDemoRole('ACCOUNT_HOLDER')}
                style={{
                  border: 'none',
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: !isAdmin && !isAuditor ? 'var(--color-primary)' : 'transparent',
                  color: !isAdmin && !isAuditor ? '#ffffff' : 'var(--color-text-muted)',
                }}
              >
                Holder
              </button>
              <button
                onClick={() => switchDemoRole('ADMIN')}
                style={{
                  border: 'none',
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: isAdmin ? 'var(--color-primary)' : 'transparent',
                  color: isAdmin ? '#ffffff' : 'var(--color-text-muted)',
                }}
              >
                Admin
              </button>
              <button
                onClick={() => switchDemoRole('AUDITOR')}
                style={{
                  border: 'none',
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: isAuditor ? 'var(--color-warning)' : 'transparent',
                  color: isAuditor ? '#0B1020' : 'var(--color-text-muted)',
                  fontWeight: isAuditor ? 600 : 400,
                }}
              >
                Auditor
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark / Light theme"
            style={{
              background: 'none',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Email & Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ textAlign: 'right', display: 'none', minWidth: '80px' }} className="user-email-display">
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user.email.split('@')[0]}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
                style={{
                  background: 'none',
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
