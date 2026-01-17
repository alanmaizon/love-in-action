import { createContext, useState, useEffect, useContext } from 'react';
import { getMe, login as loginApi, logout as logoutApi, getCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // First, get CSRF token to ensure cookie is set
      await getCsrfToken();
      // Then check if user is authenticated
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await loginApi(username, password);
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      await getCsrfToken();
      const response = await getMe();
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
