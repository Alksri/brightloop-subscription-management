import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('brightloop_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (error) {
        console.warn('Saved BrightLoop session could not be parsed; signing out.', error);
        localStorage.removeItem('brightloop_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((user) => {
    setCurrentUser(user);
    localStorage.setItem('brightloop_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('brightloop_user');
  }, []);

  const updateProfile = useCallback((updates) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('brightloop_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
