import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleAuth } from '../services/googleAuth';
import { GoogleUser } from '../types';

interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clientId: string;
  login: () => Promise<void>;
  logout: () => void;
  setCustomClientId: (id: string) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(googleAuth.getUserProfile());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(googleAuth.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientIdState] = useState<string>(googleAuth.getClientId());

  useEffect(() => {
    const init = async () => {
      try {
        if (googleAuth.getClientId()) {
          await googleAuth.initClient();
          setIsAuthenticated(googleAuth.isAuthenticated());
          setUser(googleAuth.getUserProfile());
        }
      } catch (err: any) {
        console.warn('Google client init warning:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await googleAuth.login();
      setUser(profile);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.message || 'Google Sign-in failed. Please check popup blockers or configuration.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    googleAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const setCustomClientId = (id: string) => {
    googleAuth.setCustomClientId(id);
    setClientIdState(id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        clientId,
        login,
        logout,
        setCustomClientId,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
