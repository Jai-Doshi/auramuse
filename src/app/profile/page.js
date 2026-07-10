'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeContext';
import {
  User, Mail, Phone, Sparkles, FolderPlus, UserPlus,
  BookOpen, Sun, Moon, Edit2, Check, Crown, Heart,
  MessageCircle, Share2, Calendar, Lock, Award, Layers, Shield
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { theme, toggleTheme, user, updateUser, logout } = useTheme();

  // Database lists
  const [collection, setCollection] = useState([]);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'muses', 'analytics' / 'admin-controls', 'settings'

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  // Creation forms states
  const [newCat, setNewCat] = useState('');
  const [newAct, setNewAct] = useState({ name: '', bio: '', file: null, preview: null });
  const [submittingCat, setSubmittingCat] = useState(false);
  const [submittingAct, setSubmittingAct] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      const [imgsRes, catsRes, actsRes, storiesRes] = await Promise.all([
        fetch('/api/db/images'),
        fetch('/api/db/categories'),
        fetch('/api/db/actresses'),
        fetch('/api/db/stories')
      ]);

      const imgs = await imgsRes.json();
      const cats = await catsRes.json();
      const acts = await actsRes.json();
      const stories = await storiesRes.json();

      // Extract all image IDs used in stories
      const storyImageIds = new Set();
      stories.forEach(story => {
        story.images?.forEach(img => {
          storyImageIds.add(img.id);
        });
      });

      // Exclude story images for standard users
      const visibleImgs = user?.role === 'admin' ? imgs : imgs.filter(i => !storyImageIds.has(i.id));

      setImages(visibleImgs);
      setCategories(cats);
      setActresses(acts);

      // Fetch user collection if standard user
      if (user && user.role === 'user') {
        const collRes = await fetch('/api/user/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        if (collRes.ok) {
          const collData = await collRes.json();
          setCollection(collData.cards || []);
        }
      }

      // Fetch admin stats if user is admin
      if (user && user.role === 'admin') {
        const statsRes = await fetch('/api/db/admin-stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      }
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
    showToast('Profile updated successfully!', 'success');
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
  const uploadImageFile = async (file, type = 'actress') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
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
      showToast('Category created successfully!', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingCat(false);
    }
  };

  // Create Actress
  const handleCreateActress = async (e) => {
    e.preventDefault();
    if (!newAct.name.trim() || !newAct.file) {
      showToast('Please fill out Name and upload profile picture', 'error');
      return;
    }
    setSubmittingAct(true);
    try {
      const uploadRes = await uploadImageFile(newAct.file, 'actress');
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
      showToast('Actress registered successfully!', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingAct(false);
    }
  };

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied to clipboard!', 'success');
    }
  };

  // Computed properties
  const isPremium = user?.premium === true || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const getUnlockedActressesCount = () => {
    if (isAdmin) return actresses.length;
    const unlockedIds = new Set();
    collection.forEach(c => {
      if (c.image && c.image.actresses) {
        c.image.actresses.forEach(act => unlockedIds.add(act.id));
      }
    });
    return unlockedIds.size;
  };

  const getTotalCardsCount = () => {
    if (isAdmin) return images.length;
    return collection.reduce((acc, c) => acc + (c.count || 1), 0);
  };

  const getRareCardsCount = () => {
    if (isAdmin) return images.filter(img => img.favorite === true).length;
    return collection.filter(c => c.image && c.image.favorite === true).length;
  };

  const getPowerRating = () => {
    if (isAdmin) return images.length * 100;
    return collection.reduce((acc, c) => acc + (c.count || 1) * (c.image?.favorite ? 100 : 10), 0);
  };

  // Filter collected images
  const collectedImages = images.filter(img =>
    isAdmin || collection.some(uc => uc.image_id === img.id)
  );

  if (loading) {
    return (
      <div className="fade-in">
        <div className="shimmer-profile-layout">
          <div className="shimmer-card-el" style={{ height: '400px', borderRadius: '16px', alignItems: 'center', justifyContent: 'flex-start' }}>
            <div className="shimmer-card shimmer-circle" style={{ width: '100px', height: '100px', marginTop: '2rem', marginBottom: '1.5rem' }}></div>
            <div className="shimmer-card shimmer-title" style={{ width: '50%', height: '20px', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ width: '30%', height: '14px', marginBottom: '2rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const userAvatar = user?.avatar || '/logo.png';

  return (
    <div className="fade-in profile-container" style={{ position: 'relative' }}>
      {toast.show && (
        <div className={`toast toast-${toast.type} fade-in`} style={{ zIndex: 10000 }}>
          {toast.message}
        </div>
      )}

      {/* Social Media Style Banner Cover */}
      <div className={`profile-cover-banner ${isPremium ? 'premium-gradient-banner' : ''}`}></div>

      {/* Header Info Card */}
      <div className="glass-card profile-header-card">
        {/* Overlapping Avatar */}
        <div className={`profile-avatar-outer ${isPremium ? 'premium-avatar-border' : ''}`}>
          <img src={userAvatar} alt="User Avatar" className="profile-avatar-img" />
        </div>

        {/* User Info */}
        <h2 className="profile-name" style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '800' }}>
          {user?.name}
        </h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>@{user?.username}</span>

        {/* Badges */}
        <div className="profile-badge-row">
          {isAdmin ? (
            <span className="profile-badge badge-admin-user">
              <Shield size={13} /> System Administrator
            </span>
          ) : isPremium ? (
            <span className="profile-badge badge-premium-user">
              <Crown size={13} className="text-yellow" /> Premium Collector
            </span>
          ) : (
            <span className="profile-badge badge-standard-user">
              <Sparkles size={13} /> Aura Collector
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.4' }}>
          {isAdmin
            ? "Managing global database registries, categories, and immersive story mode acts."
            : "Active AuraMuse collector. Architecting parameters, claiming daily packs, and cataloging fine AI art."}
        </p>

        {/* Stat Counters Banner */}
        <div className="profile-counters-row">
          <div className="counter-item">
            <div className="counter-num">{getUnlockedActressesCount()}</div>
            <div className="counter-lbl">Muses Unlocked</div>
          </div>
          <div className="counter-item">
            <div className="counter-num">{getTotalCardsCount()}</div>
            <div className="counter-lbl">Cards Collection</div>
          </div>
          <div className="counter-item">
            <div className="counter-num">{getRareCardsCount()}</div>
            <div className="counter-lbl">Rare Artworks</div>
          </div>
          <div className="counter-item">
            <div className="counter-num">{getPowerRating()}</div>
            <div className="counter-lbl">Power Rating</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('settings')} style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Edit2 size={14} /> Edit Info
          </button>
          <button className="btn btn-outline" onClick={handleShareProfile} style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Share2 size={14} /> Share Profile
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-nav-tabs">
        <button className={`profile-nav-tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <Layers size={16} /> Prompt Feed
        </button>
        <button className={`profile-nav-tab-btn ${activeTab === 'muses' ? 'active' : ''}`} onClick={() => setActiveTab('muses')}>
          <User size={16} /> Unlocked Muses
        </button>
        {isAdmin ? (
          <button className={`profile-nav-tab-btn ${activeTab === 'admin-controls' ? 'active' : ''}`} onClick={() => setActiveTab('admin-controls')}>
            <Shield size={16} /> Admin Panel
          </button>
        ) : (
          <button className={`profile-nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <Sparkles size={16} /> Analytics
          </button>
        )}
        <button className={`profile-nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <BookOpen size={16} /> Preferences
        </button>
      </div>

      {/* Tab Panels */}
      <div style={{ marginTop: '1.5rem', minHeight: '300px' }}>

        {/* PANEL 1: PROMPT FEED (SOCIAL MEDIA STYLE LIST) */}
        {activeTab === 'feed' && (
          <div className="social-feed-container">
            {collectedImages.length === 0 ? (
              <div className="glass-card story-empty-state" style={{ padding: '3rem' }}>
                <Award size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                <h3>No collected graphics to showcase</h3>
                <p>Go unbox daily packs to build your prompt feed!</p>
              </div>
            ) : (
              collectedImages.slice(0, 2).map(img => {
                const isImgRare = img.favorite === true;
                return (
                  <div key={img.id} className="social-post-card">
                    {/* Header */}
                    <div className="social-post-header">
                      <img src={userAvatar} alt="Profile" className="post-author-avatar" />
                      <div className="post-author-info">
                        <span className="post-author-name">{user?.name}</span>
                        <span className="post-time">Cataloged on {new Date(img.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      {/* {isImgRare && (
                        <span className="badge-rare-unlock" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                          <Award size={12} /> RARE GRAPHIC
                        </span>
                      )} */}
                    </div>

                    {/* Image */}
                    <div className="social-post-image-box">
                      <img src={img.url} alt="Feed Graphic" className="social-post-image" />
                    </div>

                    {/* Content */}
                    <div className="social-post-content">
                      {isPremium ? (
                        <p className="social-post-caption">"{img.prompt}"</p>
                      ) : (
                        <div className="locked-prompt-warning glass-card" style={{ padding: '0.75rem', marginBottom: '1rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lock size={14} className="text-yellow" /> Prompt details locked (Premium Only)
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="social-post-tags">
                        {img.actresses?.map(actress => (
                          <span key={actress.id} className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                            #{actress.name.replace(/\s+/g, '')}
                          </span>
                        ))}
                        {img.categories?.map(cat => (
                          <span key={cat.id} className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                            {cat.name}
                          </span>
                        ))}
                      </div>

                      {/* Interactive Footer */}
                      <div className="social-post-actions">
                        <button className="post-action-btn" onClick={() => showToast('💖 You liked this generation!', 'success')}>
                          <Heart size={16} className="text-red" fill="#ef4444" style={{ color: '#ef4444' }} /> Liked
                        </button>
                        <span className="post-action-btn">
                          <MessageCircle size={16} /> Comments (0)
                        </span>
                        <button className="post-action-btn" onClick={() => {
                          navigator.clipboard.writeText(img.url);
                          showToast('Linked copied!', 'success');
                        }}>
                          <Share2 size={16} /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PANEL 2: UNLOCKED MUSES GRID */}
        {activeTab === 'muses' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Unlocked Dossiers</h3>
            {actresses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No actresses registered in system.</p>
            ) : (
              <div className="social-feed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                {actresses.map(actress => {
                  const unlocked = isAdmin || collection.some(c =>
                    c.image && c.image.actresses && c.image.actresses.some(act => act.id === actress.id)
                  );
                  return (
                    <div key={actress.id} className="glass-card" style={{ padding: '0.75rem', textAlign: 'center', opacity: unlocked ? 1 : 0.45, border: unlocked ? '1px solid var(--accent-purple)' : '1px solid var(--border-glass)' }}>
                      <img src={actress.profile_picture} alt={actress.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actress.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{unlocked ? 'Unlocked' : '🔒 Locked'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: ANALYTICS (USER) OR ADMIN CONTROLS (ADMIN) */}
        {activeTab === 'analytics' && !isAdmin && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} className="text-purple" /> Collection Completion Index
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Completion progress of your cards based on category genres:
            </p>
            <div className="category-stats-list">
              {categories.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No categories registered.</p>
              ) : (
                categories.map(cat => {
                  const ownedInCat = images.filter(img =>
                    img.categories?.some(c => c.id === cat.id) &&
                    collection.some(uc => uc.image_id === img.id)
                  ).length;
                  const totalInCat = images.filter(img =>
                    img.categories?.some(c => c.id === cat.id)
                  ).length;
                  const percent = totalInCat > 0 ? Math.round((ownedInCat / totalInCat) * 100) : 0;

                  return (
                    <div key={cat.id} className="cat-stat-item" style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: '500' }}>{cat.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{ownedInCat} / {totalInCat} ({percent}%)</span>
                      </div>
                      <div className="progress-container" style={{ margin: 0, height: '8px' }}>
                        <div className="progress-bar" style={{ width: `${percent}%`, background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))' }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin-controls' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* System Performance stats */}
            {adminStats && (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: '#fff' }}>Global Registry Metrics</h3>
                <div className="profile-counters-row" style={{ margin: 0, border: 'none', padding: 0 }}>
                  <div className="counter-item">
                    <div className="counter-num" style={{ color: 'var(--accent-purple)' }}>{adminStats.totalUsers}</div>
                    <div className="counter-lbl">Total Registered Collectors</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-num" style={{ color: '#f3c623' }}>{adminStats.premiumUsers}</div>
                    <div className="counter-lbl">Premium Members</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-num" style={{ color: 'var(--accent-blue)' }}>{adminStats.totalImages}</div>
                    <div className="counter-lbl">Graphics Database</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-num" style={{ color: '#22c55e' }}>{adminStats.totalActresses}</div>
                    <div className="counter-lbl">Registered Muses</div>
                  </div>
                </div>
              </div>
            )}

            {/* Creation Panels */}
            <div className="glass-card user-dashboard-grid" style={{ gap: '2rem', padding: '2rem' }}>
              {/* Create Category Panel */}
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                  <FolderPlus size={20} className="text-indigo" /> Add Category Genre
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

                <button type="submit" className={`btn btn-secondary ${submittingCat ? 'btn-disabled' : ''}`} disabled={submittingCat} style={{ cursor: 'pointer' }}>
                  {submittingCat ? 'Creating...' : 'Create Category'}
                </button>
              </form>

              {/* Create Actress Panel */}
              <form onSubmit={handleCreateActress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                  <UserPlus size={20} className="text-yellow" /> Register AI Actress Card
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
                  <label>Biography Backstory</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief backstory description"
                    value={newAct.bio}
                    onChange={(e) => setNewAct(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Profile Dossier Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    style={{ padding: '0.4rem 0.5rem' }}
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <button type="submit" className={`btn btn-secondary ${submittingAct ? 'btn-disabled' : ''}`} disabled={submittingAct} style={{ cursor: 'pointer' }}>
                  {submittingAct ? 'Registering...' : 'Register Actress'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PANEL 4: PREFERENCES & PROFILE EDIT */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Edit Info Form */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Personal Profile Info</h3>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem', cursor: 'pointer' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '0.4rem' }} /> Save Changes
                </button>
              </form>
            </div>

            {/* General Preferences */}
            <div className="glass-card settings-section" style={{ padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>System Config & Settings</h3>

              <div className="settings-toggle-row">
                <div className="toggle-label">
                  <span className="toggle-title">Private Profile Badge</span>
                  <span className="toggle-desc">Hide personal details from public search registries</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={user?.hideProfile || false}
                    onChange={handleHideToggle}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-toggle-row" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <div className="toggle-label">
                  <span className="toggle-title">System Theme Toggle</span>
                  <span className="toggle-desc">Toggle light or sleek glass-dark dashboard theme</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  {theme === 'dark' ? (
                    <><Sun size={16} className="text-yellow" /> Light Mode</>
                  ) : (
                    <><Moon size={16} className="text-indigo" /> Dark Mode</>
                  )}
                </button>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/story-mode" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} /> Open Story Mode
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-outline btn-danger"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  Sign Out Account Session
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
