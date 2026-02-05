import { createContext, useState, useEffect, useContext } from 'react';
import {
  initCognito,
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  confirmSignUp as cognitoConfirmSignUp,
  signOut as cognitoSignOut,
  getCurrentSession,
  getIdToken,
} from '../services/cognito';
import { getCognitoConfig, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cognitoReady, setCognitoReady] = useState(false);

  // Initialize Cognito on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Fetch Cognito config from backend
      const configRes = await getCognitoConfig();
      const config = configRes.data;

      // Initialize the Cognito SDK with User Pool config
      initCognito(config);
      setCognitoReady(true);

      // Check if user already has a valid session (e.g. page refresh)
      const session = await getCurrentSession();
      if (session) {
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Get user info from our backend (validates token server-side)
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      // Token might be invalid on server side
      console.error('Failed to load user profile:', error);
      cognitoSignOut();
      setUser(null);
    }
  };

  const login = async (email, password) => {
    await cognitoSignIn(email, password);
    await loadUserProfile();
  };

  const signup = async (email, password, firstName, lastName) => {
    const result = await cognitoSignUp(email, password, firstName, lastName);
    return result;
  };

  const confirmSignup = async (email, code) => {
    const result = await cognitoConfirmSignUp(email, code);
    return result;
  };

  const logout = () => {
    cognitoSignOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const session = await getCurrentSession();
    if (session) {
      await loadUserProfile();
    } else {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    cognitoReady,
    login,
    signup,
    confirmSignup,
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
