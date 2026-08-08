import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as adminAuthService from '@/services/adminAuthService';
import type { AdminLoginInput, AdminUser } from '@/types/admin';

const STORAGE_KEY = 'jdm_admin_auth_v1';

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: AdminLoginInput) => Promise<AdminUser>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function readStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function writeStoredAdmin(admin: AdminUser | null): void {
  try {
    if (admin) localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — session simply won't persist across reloads.
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setAdmin(readStoredAdmin());
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (input: AdminLoginInput) => {
    const loggedInAdmin = await adminAuthService.adminLogin(input);
    setAdmin(loggedInAdmin);
    writeStoredAdmin(loggedInAdmin);
    return loggedInAdmin;
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    writeStoredAdmin(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ admin, isAuthenticated: admin !== null, isInitializing, login, logout }),
    [admin, isInitializing, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider.');
  return context;
}
