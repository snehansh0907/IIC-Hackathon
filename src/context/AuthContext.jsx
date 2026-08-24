import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedDemo = localStorage.getItem('duesos_is_demo');
        const storedToken = localStorage.getItem('duesos_token');

        if (storedToken && storedDemo !== 'true') {
          // Verify user session with backend
          const meData = await api.getMe();
          if (meData?.business) {
            setUser(meData.user || { id: meData.business.id, email: meData.business.email });
            setBusiness(meData.business);
            setIsDemo(false);
            setLoading(false);
            return;
          }
        }

        if (storedDemo === 'true') {
          const demoData = await api.getDemoSession();
          if (demoData?.business) {
            setBusiness(demoData.business);
            setIsDemo(true);
            setUser(null);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Session restore notice:', err.message);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Enter Demo Account (Instant access for judges without login)
  const enterDemoMode = async () => {
    try {
      localStorage.setItem('duesos_is_demo', 'true');
      setIsDemo(true);
      const demoData = await api.getDemoSession();
      if (demoData?.business) {
        setBusiness(demoData.business);
      }
      return { success: true };
    } catch (err) {
      console.error('enterDemoMode error:', err);
      return { success: false, error: err.message };
    }
  };

  // Sign in real user
  const login = async ({ email, password }) => {
    try {
      const data = await api.login({ email, password });
      if (data?.token) {
        localStorage.setItem('duesos_token', data.token);
        localStorage.setItem('duesos_is_demo', 'false');
        setUser(data.user);
        setBusiness(data.business);
        setIsDemo(false);
        return { success: true };
      }
      throw new Error('No authentication token received.');
    } catch (err) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  // Create real user account
  const signup = async ({ name, email, password, businessName }) => {
    try {
      const data = await api.signup({ name, email, password, businessName });
      if (data?.token) {
        localStorage.setItem('duesos_token', data.token);
        localStorage.setItem('duesos_is_demo', 'false');
        setUser(data.user);
        setBusiness(data.business);
        setIsDemo(false);
        return { success: true };
      }
      throw new Error('No authentication token received.');
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed.' };
    }
  };

  // Switch to Demo Account (from profile dropdown)
  const switchToDemo = async () => {
    localStorage.setItem('duesos_is_demo', 'true');
    setIsDemo(true);
    const demoData = await api.getDemoSession();
    if (demoData?.business) {
      setBusiness(demoData.business);
    }
  };

  // Switch back to User Account (from profile dropdown)
  const switchToUser = async () => {
    const token = localStorage.getItem('duesos_token');
    if (token) {
      localStorage.setItem('duesos_is_demo', 'false');
      setIsDemo(false);
      const meData = await api.getMe();
      if (meData?.business) {
        setUser(meData.user || { id: meData.business.id, email: meData.business.email });
        setBusiness(meData.business);
      }
    } else {
      // Prompt user to log in if no token stored
      logout();
    }
  };

  // Exit demo mode or log out
  const logout = () => {
    localStorage.removeItem('duesos_token');
    localStorage.removeItem('duesos_is_demo');
    setUser(null);
    setBusiness(null);
    setIsDemo(false);
  };

  const value = {
    user,
    business,
    isDemo,
    isAuthenticated: Boolean(user || isDemo),
    hasUserAccount: Boolean(localStorage.getItem('duesos_token')),
    loading,
    login,
    signup,
    enterDemoMode,
    switchToDemo,
    switchToUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
