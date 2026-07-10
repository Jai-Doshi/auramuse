'use client';

import React from 'react';
import { useTheme } from './ThemeContext';
import Navbar from './Navbar';
import LoginPage from './LoginPage';

export default function AppLayout({ children }) {
  const { user, showSplash } = useTheme();

  // During splash screen loading, just render children (which has the SplashScreen)
  if (showSplash) {
    return <div style={{ minHeight: '100vh' }}>{children}</div>;
  }

  // If not authenticated, render LoginPage fullscreen
  if (!user) {
    return <LoginPage />;
  }

  // If authenticated, render standard dashboard layout
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
