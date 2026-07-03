'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeContext';
import { User, Mail, Phone, ShieldOff, Sparkles, FolderPlus, UserPlus, BookOpen, Sun, Moon, Edit2, Check } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { theme, toggleTheme, user, updateUser } = useTheme();

  // Database lists
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user.name, email: user.email, phone: user.phone });

  // Creation forms states
  const [newCat, setNewCat] = useState('');
  const [newAct, setNewAct] = useState({ name: '', bio: '', file: null, preview: null });
  const [submittingCat, setSubmittingCat] = useState(false);
  const [submittingAct, setSubmittingAct] = useState(false);

  const fetchData = async () => {
    try {
      const [imgsRes, catsRes, actsRes] = await Promise.all([
        fetch('/api/db/images'),
        fetch('/api/db/categories'),
        fetch('/api/db/actresses')
      ]);

      const imgs = await imgsRes.json();
      const cats = await catsRes.json();
      const acts = await actsRes.json();

      setImages(imgs);
      setCategories(cats);
      setActresses(acts);
    } catch (e) {
      console.error('Failed to load profile lists:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update user profile details
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone
    });
    setIsEditing(false);
  };

  // Toggle profile visibility
  const handleHideToggle = (e) => {
    updateUser({ hideProfile: e.target.checked });
  };

  // Handle local file preview for actress profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAct(prev => ({ ...prev, file, preview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload local image helper
  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload image file');
    }
    return await res.json();
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setSubmittingCat(true);
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCat })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }
      setNewCat('');
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingCat(false);
    }
  };

  // Create Actress
  const handleCreateActress = async (e) => {
    e.preventDefault();
    if (!newAct.name.trim() || !newAct.file) {
      alert('Please fill out Name and upload profile picture');
      return;
    }
    setSubmittingAct(true);
    try {
      const uploadRes = await uploadImageFile(newAct.file);
      const res = await fetch('/api/db/actresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAct.name,
          profile_picture: uploadRes.url,
          bio: newAct.bio
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create actress');
      }
      setNewAct({ name: '', bio: '', file: null, preview: null });
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAct(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="shimmer-profile-layout">
          <div className="shimmer-card-el" style={{ height: '450px', borderRadius: '16px', alignItems: 'center', justifyContent: 'flex-start' }}>
            <div className="shimmer-card shimmer-circle" style={{ width: '100px', height: '100px', marginTop: '2rem', marginBottom: '1.5rem' }}></div>
            <div className="shimmer-card shimmer-title" style={{ width: '50%', height: '20px', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ width: '30%', height: '14px', marginBottom: '2rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '30px', width: '80%', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '30px', width: '80%' }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="shimmer-card" style={{ height: '250px', borderRadius: '16px' }}></div>
            <div className="shimmer-card" style={{ height: '150px', borderRadius: '16px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Get user avatar image (if empty, default to generated vector profile)
  const userAvatar = user.avatar || '/logo.svg';

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">User Hub</h1>
      </div>

      <div className="profile-grid">
        {/* Left Column: User Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card profile-card">
            <div className="profile-avatar-container">
              <img src={userAvatar} alt="User Avatar" className="profile-avatar" />
            </div>

            {!isEditing ? (
              <>
                <h2 className="profile-name">{user.name}</h2>
                <div className="profile-role">Prompt Engineer</div>

                <div className="profile-details-list">
                  <div className="profile-detail-item">
                    <span className="profile-detail-lbl"><Mail size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} /> Email</span>
                    <span className="profile-detail-val">{user.email}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-lbl"><Phone size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} /> Phone</span>
                    <span className="profile-detail-val">{user.phone}</span>
                  </div>
                </div>

                <button className="btn btn-outline" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} /> Edit Profile Info
                </button>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} style={{ textAlign: 'left' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Check size={14} /> Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Settings / Preference panel */}
          <div className="glass-card settings-section">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Preferences</h3>

            {/* Hide Profile toggle */}
            <div className="settings-toggle-row">
              <div className="toggle-label">
                <span className="toggle-title">Private Profile</span>
                <span className="toggle-desc">Hide profile information from guest users</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.hideProfile}
                  onChange={handleHideToggle}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Theme selector */}
            <div className="settings-toggle-row">
              <div className="toggle-label">
                <span className="toggle-title">System Theme</span>
                <span className="toggle-desc">Toggle Light or Dark dashboard mode</span>
              </div>
              <button
                onClick={toggleTheme}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {theme === 'dark' ? (
                  <><Sun size={16} className="text-yellow" /> Light Mode</>
                ) : (
                  <><Moon size={16} className="text-indigo" /> Dark Mode</>
                )}
              </button>
            </div>

            {/* Immersive story mode link */}
            <Link href="/story-mode" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              <BookOpen size={18} /> Launch Story Mode
            </Link>
          </div>
        </div>

        {/* Right Column: Social feed + categories creation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Social media grid of user uploaded images */}
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Prompt Feed</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Images generated and cataloged by you.
            </p>
            {images.length === 0 ? (
              <div className="story-empty-state" style={{ minHeight: '150px' }}>
                <User size={32} className="text-muted" />
                <p>No uploaded graphics to showcase.</p>
              </div>
            ) : (
              <div className="social-feed-grid">
                {images.slice(0, 9).map(img => (
                  <Link href="/gallery" key={img.id} className="social-feed-item">
                    <img src={img.url} alt="User Graphic" className="social-feed-img" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Creation panel */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Create Category Panel */}
            <form onSubmit={handleCreateCategory} style={{ borderRight: '1px solid var(--border-glass)', paddingRight: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderPlus size={20} className="text-indigo" /> Add Category
              </h3>

              <div className="form-group">
                <label>Category Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cyberpunk, Unreal"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={`btn btn-secondary ${submittingCat ? 'btn-disabled' : ''}`} style={{ width: '100%' }} disabled={submittingCat}>
                {submittingCat ? 'Creating...' : 'Create Category'}
              </button>
            </form>

            {/* Create Actress Panel */}
            <form onSubmit={handleCreateActress}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} className="text-yellow" /> Create Actress
              </h3>

              <div className="form-group">
                <label>Actress Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lyra Vance"
                  value={newAct.name}
                  onChange={(e) => setNewAct(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Biography / Story Info</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Brief backstory description"
                  value={newAct.bio}
                  onChange={(e) => setNewAct(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  style={{ padding: '0.4rem 0.5rem' }}
                  onChange={handleFileChange}
                  required
                />
              </div>

              <button type="submit" className={`btn btn-secondary ${submittingAct ? 'btn-disabled' : ''}`} style={{ width: '100%' }} disabled={submittingAct}>
                {submittingAct ? 'Creating...' : 'Register Actress'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
