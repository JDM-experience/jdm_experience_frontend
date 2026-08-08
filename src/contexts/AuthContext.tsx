import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '@/services/authService';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput, User } from '@/types/user';

const STORAGE_KEY = 'jdm_auth_user_v1';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — session simply won't persist across reloads.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const loggedInUser = await authService.login(input);
    setUser(loggedInUser);
    writeStoredUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => authService.register(input), []);

  const logout = useCallback(() => {
    setUser(null);
    writeStoredUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated.');
      const updated = await authService.updateProfile(user.id, input);
      setUser(updated);
      writeStoredUser(updated);
      return updated;
    },
    [user],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      if (!user) throw new Error('Not authenticated.');
      await authService.changePassword(user.id, input);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, isInitializing, login, register, logout, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
