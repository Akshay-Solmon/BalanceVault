import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyntheticBanner } from './components/SyntheticBanner';
import { Navbar } from './components/Navbar';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { BootstrapPage } from './pages/BootstrapPage';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <RefreshCw size={32} color="#38bdf8" className="animate-spin" style={{ marginBottom: '1rem' }} />
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Initializing BalanceVault Secure Subsystem...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SyntheticBanner />
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* If user is not authenticated and not on special public pages like bootstrap/health */}
        {!user && currentView !== 'bootstrap' && currentView !== 'health' && (
          <AuthPages 
            onNavigateToBootstrap={() => setCurrentView('bootstrap')} 
          />
        )}

        {/* Public or Dedicated Bootstrap Wizard */}
        {currentView === 'bootstrap' && (
          <BootstrapPage
            onSuccess={() => setCurrentView('dashboard')}
            onBackToLogin={() => setCurrentView('dashboard')}
          />
        )}

        {/* Health Probe Monitor */}
        {currentView === 'health' && (
          <SystemHealthPage />
        )}

        {/* Authenticated Views */}
        {user && currentView === 'dashboard' && (
          <DashboardPage onNavigateToOnboarding={() => setCurrentView('onboarding')} />
        )}

        {user && currentView === 'onboarding' && (
          <OnboardingPage />
        )}

        {/* Protected Admin Views */}
        {user && isAdmin && currentView === 'admin-users' && (
          <AdminUsersPage />
        )}

        {user && isAdmin && currentView === 'admin-audit' && (
          <AdminAuditPage />
        )}
      </main>

      <footer style={{
        borderTop: '1px solid #1e293b',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#64748b',
        backgroundColor: '#090d16',
      }}>
        BalanceVault v0.1 | Money movement with a ledger you can prove | Hackathon Demonstration Build
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
