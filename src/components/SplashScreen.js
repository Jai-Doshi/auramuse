'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';

export default function SplashScreen() {
  const { showSplash } = useTheme();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate loader progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 800); // match CSS fade-out duration
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (!visible) return null;

  return (
    <div className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <img src="/logo.png" alt="AuraMuse Logo" className="splash-logo" />
        </div>
        <h1 className="splash-title">AURA MUSE</h1>
        <p className="splash-subtitle">AI Actress & Image Gallery</p>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">Loading Assets... {progress}%</span>
      </div>
    </div>
  );
}
