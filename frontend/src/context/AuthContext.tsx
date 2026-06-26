'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'STUDENT' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithPassword: (emailOrPhone: string, password: string) => Promise<void>;
  requestOTPCode: (phoneOrEmail: string) => Promise<void>;
  verifyOTPCode: (phoneOrEmail: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload safely
const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = () => {
      const accessToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (accessToken && savedUser) {
        const decoded = parseJwt(accessToken);
        const isExpired = decoded ? decoded.exp * 1000 < Date.now() : true;

        if (!isExpired) {
          setUser(JSON.parse(savedUser));
        } else {
          // Token is expired, try to rely on axios interceptor for refresh on first API call
          // or just clear it if we want to be strict.
          // For initial client load, we keep the user state and let the request refresh.
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginWithPassword = async (emailOrPhone: string, password: string) => {
    setLoading(true);
    try {
      const isEmail = emailOrPhone.includes('@');
      const payload = isEmail 
        ? { email: emailOrPhone, password } 
        : { phone: emailOrPhone, password };

      const response = await api.post('/auth/login', payload);
      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      
      if (userData.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.message || 'Login failed. Please check credentials.';
    } finally {
      setLoading(false);
    }
  };

  const requestOTPCode = async (phoneOrEmail: string) => {
    try {
      await api.post('/auth/otp/request', { phoneOrEmail });
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to request verification code.';
    }
  };

  const verifyOTPCode = async (phoneOrEmail: string, code: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', { phoneOrEmail, code });
      const { accessToken, refreshToken, user: userData } = response.data;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      if (userData.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.message || 'Verification failed. Invalid OTP.';
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithPassword, requestOTPCode, verifyOTPCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
