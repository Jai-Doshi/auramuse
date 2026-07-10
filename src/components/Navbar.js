'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Crown, Image as ImageIcon, Users, User, BookOpen, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, user, logout } = useTheme();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: isAdmin ? 'Dashboard' : 'Collection', path: '/', icon: Home },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'Actresses', path: '/actresses', icon: Users },
    { name: 'Story Mode', path: '/story-mode', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="AuraMuse logo" className="brand-logo" />
          <span className="brand-name">AuraMuse</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-text">{item.name}</span>
                {item.path === '/story-mode' && (
                  <span className="badge-crown">
                    <Crown size={18} className="text-yellow" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={20} className="text-yellow" /> : <Moon size={20} className="text-indigo" />}
            <span className="nav-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={logout} className="theme-toggle-btn logout-btn-sidebar" style={{ marginTop: '0.5rem', color: '#f87171' }} aria-label="Sign Out">
            <LogOut size={20} />
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="mobile-nav-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
