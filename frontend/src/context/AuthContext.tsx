import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export type UserRole = 'ACCOUNT_HOLDER' | 'ADMIN' | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  onboardingStatus?: string | null;
  accountNumber?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAccountHolder: boolean;
  isAuditor: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bv_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Check if it's an auditor session stored locally
    const savedAuditor = localStorage.getItem('bv_demo_auditor');
    if (savedAuditor === 'true') {
      setUser({
        id: 'auditor-01',
        email: 'auditor.oversight@balancevault.internal',
        role: 'AUDITOR',
        status: 'ACTIVE',
      });
      setIsLoading(false);
      return;
    }

    const res = await apiRequest<{ user: User }>('/api/auth/me');
    if (res.data?.user) {
      setUser(res.data.user);
    } else {
      logout();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.removeItem('bv_demo_auditor');
    localStorage.setItem('bv_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_demo_auditor');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = (role: UserRole) => {
    if (role === 'AUDITOR') {
      localStorage.setItem('bv_demo_auditor', 'true');
      setUser({
        id: 'auditor-01',
        email: 'auditor.oversight@balancevault.internal',
        role: 'AUDITOR',
        status: 'ACTIVE',
      });
    } else if (role === 'ADMIN') {
      if (user) {
        setUser({ ...user, role: 'ADMIN' });
      }
    } else {
      if (user) {
        setUser({ ...user, role: 'ACCOUNT_HOLDER' });
      }
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAccountHolder = user?.role === 'ACCOUNT_HOLDER';
  const isAuditor = user?.role === 'AUDITOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isAccountHolder,
        isAuditor,
        login,
        logout,
        refreshUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
