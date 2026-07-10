'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize values from localStorage on mount
  useEffect(() => {
    // 1. Theme
    const savedTheme = localStorage.getItem('auramuse-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = 'dark';
    }

    // 2. User info (Remember Me)
    const savedUser = localStorage.getItem('auramuse-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user details', e);
      }
    }

    // 3. Splash Screen session flag (only show once per session)
    const sessionSplash = sessionStorage.getItem('auramuse-splash-shown');
    if (sessionSplash) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('auramuse-splash-shown', 'true');
      }, 2500); // 2.5 seconds splash
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync theme changes to HTML class
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('auramuse-theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  // Update user profile and handle Remember Me persistence
  const updateUser = (newDetails) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...newDetails } : { ...newDetails };
      if (updated.rememberMe) {
        localStorage.setItem('auramuse-user', JSON.stringify(updated));
      } else {
        localStorage.removeItem('auramuse-user');
      }
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auramuse-user');
  };

  // Register PWA service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      });
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      user,
      setUser,
      updateUser,
      logout,
      showSplash,
      setShowSplash
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
