import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'DEV' | 'MAFER' | 'CLIENTE';
  cedula?: string;
  billingAddress?: string;
  billingPhone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    cedula: string,
    billingAddress: string,
    billingPhone: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setError(null);
  };

  const clearError = () => setError(null);

  const checkSession = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data && data.user) {
        setUser(data.user);
        closeLoginModal();
        return data.user;
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Credenciales inválidas';
      setError(msg);
      throw err;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    cedula: string,
    billingAddress: string,
    billingPhone: string
  ) => {
    setError(null);
    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        cedula,
        billingAddress,
        billingPhone,
      });
      // Autologin after registration
      return await login(email, password);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Error al registrar el usuario';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
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
