import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { SyntheticBanner } from './components/SyntheticBanner';
import { Navbar } from './components/layout/Navbar';

// Pages
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { MoneyMovementsPage } from './pages/MoneyMovementsPage';
import { StatementPage } from './pages/StatementPage';
import { AdminConsolePage } from './pages/AdminConsolePage';
import { AuditorPage } from './pages/AuditorPage';
import { LedgerIntegrityPage } from './pages/LedgerIntegrityPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, isAdmin, isAuditor } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg-base)',
        }}
      >
        <Loader2 size={36} color="var(--color-primary)" className="animate-spin" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
          Initializing BalanceVault Secure Subsystem...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        transition: 'background-color var(--transition-normal)',
      }}
    >
      <SyntheticBanner />
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Unauthenticated View */}
        {!user && currentView !== 'bootstrap' && currentView !== 'health' && (
          <AuthPages onNavigateToBootstrap={() => setCurrentView('bootstrap')} />
        )}

        {/* Public Bootstrap Wizard */}
        {currentView === 'bootstrap' && (
          <BootstrapPage
            onSuccess={() => setCurrentView('dashboard')}
            onBackToLogin={() => setCurrentView('dashboard')}
          />
        )}

        {/* Health Probe Monitor */}
        {currentView === 'health' && <SystemHealthPage />}

        {/* Authenticated Pages */}
        {user && currentView === 'dashboard' && (
          <DashboardPage
            onNavigateToMoneyMovements={() => setCurrentView('money-movements')}
            onNavigateToStatement={() => setCurrentView('statement')}
            onNavigateToOnboarding={() => setCurrentView('onboarding')}
          />
        )}

        {user && currentView === 'money-movements' && !isAuditor && (
          <MoneyMovementsPage onNavigateToDashboard={() => setCurrentView('dashboard')} />
        )}

        {user && currentView === 'statement' && (
          <StatementPage />
        )}

        {user && currentView === 'ledger-integrity' && (
          <LedgerIntegrityPage />
        )}

        {user && currentView === 'onboarding' && (
          <OnboardingPage />
        )}

        {/* Protected Admin Console */}
        {user && isAdmin && currentView === 'admin-console' && (
          <AdminConsolePage />
        )}

        {/* Auditor View (Auditor or Admin) */}
        {user && (isAuditor || isAdmin) && currentView === 'auditor-view' && (
          <AuditorPage />
        )}
      </main>

      <ToastContainer />

      <footer
        style={{
          borderTop: '1px solid var(--color-surface-border)',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            BalanceVault v1.0 • Money movement with a ledger you can prove • LedgerLine Hackathon
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span
              onClick={() => setCurrentView('health')}
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
            >
              System Health
            </span>
            <span
              onClick={() => setCurrentView('ledger-integrity')}
              style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
            >
              Hash Chain Status
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
