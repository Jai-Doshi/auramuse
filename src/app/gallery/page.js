'use client';

import React, { useState, useEffect } from 'react';
import { Search, Heart, Copy, Check, X, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedActress, setSelectedActress] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'

  // Image Detail Modal State
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editImageModal, setEditImageModal] = useState(false);
  const [editImage, setEditImage] = useState({ id: '', prompt: '', categoryId: '', actressIds: [], preview: '' });
  const [submitting, setSubmitting] = useState(false);

  // Toast & Custom Confirm Modal States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      const [imgsRes, catsRes, actsRes] = await Promise.all([
        fetch('/api/db/images'),
        fetch('/api/db/categories'),
        fetch('/api/db/actresses')
      ]);

      const imgs = await imgsRes.ok ? await imgsRes.json() : [];
      const cats = await catsRes.ok ? await catsRes.json() : [];
      const acts = await actsRes.ok ? await actsRes.json() : [];

      setImages(imgs);
      setCategories(cats);
      setActresses(acts);
    } catch (e) {
      console.error('Error fetching gallery data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Favorites toggle
  const handleToggleFavorite = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/db/images/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const updatedImg = await res.json();
        // Update images list locally
        setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: updatedImg.favorite } : img));
        // If the updated image is currently selected in modal, update modal state
        if (selectedImage && selectedImage.id === id) {
          setSelectedImage(prev => ({ ...prev, favorite: updatedImg.favorite }));
        }
        showToast(updatedImg.favorite ? 'Added to Favorites!' : 'Removed from Favorites.', 'info');
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Copy prompt helper
  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEditModal = (img) => {
    setEditImage({
      id: img.id,
      prompt: img.prompt,
      categoryId: img.category_id || '',
      actressIds: img.actresses?.map(a => a.id) || [],
      preview: img.url
    });
    setEditImageModal(true);
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();
    if (!editImage.prompt.trim() || editImage.actressIds.length === 0) {
      showToast('Prompt and at least one actress selection are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/db/images/${editImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editImage.prompt,
          category_id: editImage.categoryId,
          actress_ids: editImage.actressIds
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update image details.');
      }
      setEditImageModal(false);
      setSelectedImage(null);
      await fetchData();
      showToast('AI Graphic updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete AI Graphic',
      message: 'Are you sure you want to delete this graphic from the gallery?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/images/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setSelectedImage(null);
            await fetchData();
            showToast('AI Graphic deleted successfully!', 'success');
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete image.', 'error');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Filtered Images computation
  const filteredImages = images.filter(img => {
    // 1. Search Query (match prompt text)
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Filter
    const matchesCategory = selectedCategory === '' || img.category_id === selectedCategory;

    // 3. Actress Filter (Checks many-to-many list)
    const matchesActress = selectedActress === '' || img.actresses?.some(a => a.id === selectedActress);

    // 4. Tab Filter (All vs Favorites)
    const matchesTab = activeTab === 'all' || img.favorite === true;

    return matchesSearch && matchesCategory && matchesActress && matchesTab;
  });

  if (loading) {
    return (
      <div className="fade-in">
        <div className="section-header">
          <div className="shimmer-card shimmer-title" style={{ width: '240px', height: '32px' }}></div>
        </div>
        <div className="shimmer-card" style={{ height: '60px', width: '100%', marginBottom: '2rem' }}></div>
        <div className="shimmer-gallery-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="shimmer-card shimmer-gallery-card"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">AI Graphics Gallery</h1>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card filter-bar">
        {/* Search */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search prompt keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Actress Filter */}
        <select
          className="form-select filter-select"
          value={selectedActress}
          onChange={(e) => setSelectedActress(e.target.value)}
        >
          <option value="">All Actresses</option>
          {actresses.map(act => (
            <option key={act.id} value={act.id}>{act.name}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          className="form-select filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Tabs: All vs Favorites */}
        <div className="gallery-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Graphics Grid */}
      {filteredImages.length === 0 ? (
        <div className="glass-card story-empty-state" style={{ minHeight: '300px' }}>
          <Sparkles size={48} className="text-muted" />
          <h3>No matching graphics found</h3>
          <p>Try modifying your filters or search keywords.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredImages.map((img) => {
            const actressNames = img.actresses?.map(a => a.name).join(', ') || 'N/A';
            return (
              <div
                key={img.id}
                className="gallery-card"
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.url} alt="AI Art" className="gallery-card-img" />
                <div className="gallery-card-overlay">
                  <p className="gallery-card-prompt">{img.prompt}</p>
                  <div className="gallery-card-meta">
                    <span className="gallery-card-actress">{actressNames}</span>
                    <button
                      className={`gallery-card-favorite-btn ${img.favorite ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(img.id, e)}
                      aria-label="Favorite image"
                    >
                      <Heart size={20} fill={img.favorite ? '#ef4444' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IMAGE DETAIL OVERLAY MODAL */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-container" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">AI Graphic Details</span>
              <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-modal-grid">
                {/* Image Showcase */}
                <div className="detail-img-box">
                  <img src={selectedImage.url} alt="AI Graphic Details" className="detail-img" />
                </div>

                {/* Metadata details */}
                <div className="detail-info">
                  <div>
                    {/* Tags for Featured Actresses */}
                    <div className="detail-meta-tags">
                      {selectedImage.actresses?.map(actress => (
                        <div key={actress.id} className="badge badge-purple">
                          <img src={actress.profile_picture} alt={actress.name} className="actress-badge-mini-avatar" />
                          <span>{actress.name}</span>
                        </div>
                      ))}
                      {selectedImage.category && (
                        <span className="badge badge-blue">
                          {selectedImage.category.name}
                        </span>
                      )}
                    </div>

                    {/* Details section */}
                    <h3 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>Prompt Parameters</h3>
                    <div className="prompt-viewer">
                      <p style={{ paddingRight: '2rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {selectedImage.prompt}
                      </p>
                      <button
                        className="prompt-copy-btn"
                        onClick={() => handleCopyPrompt(selectedImage.prompt)}
                        title="Copy prompt parameters"
                      >
                        {copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Generated on: {new Date(selectedImage.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions footer inside detail panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      className={`btn ${selectedImage.favorite ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', backgroundColor: selectedImage.favorite ? '#ef4444' : '' }}
                      onClick={() => handleToggleFavorite(selectedImage.id)}
                    >
                      <Heart size={18} fill={selectedImage.favorite ? 'white' : 'none'} />
                      {selectedImage.favorite ? 'Favorited' : 'Add to Favorites'}
                    </button>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1 }}
                        onClick={() => handleOpenEditModal(selectedImage)}
                      >
                        Edit Details
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                        onClick={() => handleDeleteImage(selectedImage.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT IMAGE MODAL --- */}
      {editImageModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleUpdateImage}>
            <div className="modal-header">
              <span className="modal-title">Edit AI Graphic Info</span>
              <button type="button" className="modal-close-btn" onClick={() => setEditImageModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Graphic Preview</label>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={editImage.preview} alt="Preview" style={{ maxHeight: '180px', borderRadius: '10px', objectFit: 'contain' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Prompt Parameters</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Masterpiece, photorealistic..." 
                  style={{ minHeight: '100px' }}
                  value={editImage.prompt} 
                  onChange={(e) => setEditImage(prev => ({ ...prev, prompt: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  className="form-select" 
                  value={editImage.categoryId} 
                  onChange={(e) => setEditImage(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Featured Actresses</label>
                <div className="actress-select-grid">
                  {actresses.map(actress => {
                    const isSelected = editImage.actressIds.includes(actress.id);
                    return (
                      <div 
                        key={actress.id} 
                        className={`actress-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setEditImage(prev => ({
                              ...prev,
                              actressIds: prev.actressIds.filter(aid => aid !== actress.id)
                            }));
                          } else {
                            setEditImage(prev => ({
                              ...prev,
                              actressIds: [...prev.actressIds, actress.id]
                            }));
                          }
                        }}
                      >
                        <img 
                          src={actress.profile_picture || '/logo.svg'} 
                          alt={actress.name} 
                          className="actress-select-avatar" 
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{actress.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditImageModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">{confirmModal.title}</span>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer" style={{ gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className="toast-container">
        <div className={`toast toast-${toast.type} ${toast.show ? 'show' : ''}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <Check size={18} style={{ color: '#22c55e' }} />}
            {toast.type === 'error' && <X size={18} style={{ color: '#ef4444' }} />}
            {toast.type === 'info' && <Sparkles size={18} style={{ color: '#3b82f6' }} />}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
