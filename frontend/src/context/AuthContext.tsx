import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  userType: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
  patientId?: number | null;
  psychologistId?: number | null;
  hasTriage?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  registerUser: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data;
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        userType: userData.userType,
        patientId: userData.patient?.id || null,
        psychologistId: userData.psychologist?.id || null,
        hasTriage: !!userData.hasTriage,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    const u = res.data.user;
    setUser(u);
    return u;
  };

  const registerUser = async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        registerUser,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
