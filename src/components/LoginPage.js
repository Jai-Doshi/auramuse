'use client';

import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import { Sparkles, User, Lock, Mail, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { theme, toggleTheme, updateUser } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    rememberMe: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? {
            username: formData.username,
            password: formData.password,
            name: formData.name,
            email: formData.email
          }
        : {
            username: formData.username,
            password: formData.password
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save credentials in state and localStorage/sessionStorage
      updateUser({
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email || '',
        role: data.role || 'user',
        avatar: data.avatar || '',
        rememberMe: formData.rememberMe
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-background-glows">
        <div className="glow-orb orb-purple"></div>
        <div className="glow-orb orb-blue"></div>
      </div>

      <div className="glass-card login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <img src="/logo.png" alt="AuraMuse Logo" className="login-logo" />
          </div>
          <h1 className="login-title">AURA MUSE</h1>
          <p className="login-subtitle">
            {isRegister ? 'Register your collector account' : 'Unlock your daily actress cards'}
          </p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label className="login-input-label">
                  <User size={16} /> Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input login-input"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="login-input-label">
                  <Mail size={16} /> Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input login-input"
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="login-input-label">
              <User size={16} /> Username
            </label>
            <input
              type="text"
              name="username"
              className="form-input login-input"
              placeholder="e.g. collector1"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="login-input-label">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              name="password"
              className="form-input login-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-options-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-inline"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <Sparkles size={18} /> {isRegister ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="login-toggle-btn"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
          <div className="login-demo-helper">
            <p>Demo Credentials:</p>
            <p>Admin: <span>admin</span> / <span>admin</span></p>
            <p>User: <span>user</span> / <span>user</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
