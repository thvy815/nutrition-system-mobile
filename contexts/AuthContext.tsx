import React, { createContext, useContext, useEffect, useState } from 'react';
import { logout as authLogout } from '../services/auth';
import type { LoginUser } from '../types/auth';
import { getToken } from '../services/token';

interface AuthState {
  token: string | null;
  user: LoginUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  setAuth: (token: string, user: LoginUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        setState({
          token,
          user: null,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch {
      setState({
        token: null,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const setAuth = (token: string, user: LoginUser) => {
    setState({
      token,
      user,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = async () => {
    await authLogout();
    setState({
      token: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
