import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Group } from '../types';
import { api, setApiToken, getApiToken } from '../api';

interface AuthContextType {
  user: User | null;
  group: Group | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    phone: string;
    email: string;
    area: string;
    district: string;
    password: string;
  }) => Promise<{ message: string; user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [token, setToken] = useState<string | null>(getApiToken());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getApiToken()) {
        setUser(null);
        setGroup(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setGroup(data.group);
    } catch (err) {
      console.warn('Session expired or not authenticated:', err);
      setApiToken(null);
      setToken(null);
      setUser(null);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setApiToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setGroup(res.group);
    return res.user;
  };

  const register = async (data: {
    name: string;
    phone: string;
    email: string;
    area: string;
    district: string;
    password: string;
  }) => {
    return await api.register(data);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      setApiToken(null);
      setToken(null);
      setUser(null);
      setGroup(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        group,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
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
