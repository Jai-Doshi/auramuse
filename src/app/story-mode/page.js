'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, User, ImageIcon, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function StoryModePage() {
  const [stories, setStories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  // Edit Story Modal States
  const [editStoryModal, setEditStoryModal] = useState(false);
  const [editStory, setEditStory] = useState({ id: '', title: '', content: '', selectedActresses: [], selectedImages: [] });
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
      const [storiesRes, actressesRes, imagesRes] = await Promise.all([
        fetch('/api/db/stories'),
        fetch('/api/db/actresses'),
        fetch('/api/db/images')
      ]);

      const storyData = storiesRes.ok ? await storiesRes.json() : [];
      const actressData = actressesRes.ok ? await actressesRes.json() : [];
      const imageData = imagesRes.ok ? await imagesRes.json() : [];

      setStories(storyData);
      setActresses(actressData);
      setImages(imageData);

      if (storyData.length > 0) {
        setSelectedStory(prev => {
          if (prev) {
            const found = storyData.find(s => s.id === prev.id);
            return found || storyData[0];
          }
          return storyData[0];
        });
      } else {
        setSelectedStory(null);
      }
    } catch (e) {
      console.error('Error fetching story-mode data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEditModal = (story) => {
    setEditStory({
      id: story.id,
      title: story.title,
      content: story.content || '',
      selectedActresses: story.actresses?.map(a => a.id) || [],
      selectedImages: story.images?.map(img => ({
        id: img.id,
        url: img.url,
        description: img.description || ''
      })) || []
    });
    setEditStoryModal(true);
  };

  const toggleStoryActress = (id) => {
    setEditStory(prev => {
      const selected = prev.selectedActresses.includes(id)
        ? prev.selectedActresses.filter(aId => aId !== id)
        : [...prev.selectedActresses, id];
      return { ...prev, selectedActresses: selected };
    });
  };

  const toggleStoryImage = (img) => {
    setEditStory(prev => {
      const isSelected = prev.selectedImages.some(i => i.id === img.id);
      const selected = isSelected
        ? prev.selectedImages.filter(i => i.id !== img.id)
        : [...prev.selectedImages, { id: img.id, url: img.url, description: '' }];
      return { ...prev, selectedImages: selected };
    });
  };

  const updateStoryImageDescription = (id, desc) => {
    setEditStory(prev => {
      const updated = prev.selectedImages.map(i => {
        if (i.id === id) {
          return { ...i, description: desc };
        }
        return i;
      });
      return { ...prev, selectedImages: updated };
    });
  };

  const handleUpdateStory = async (e) => {
    e.preventDefault();
    if (!editStory.title.trim() || editStory.selectedActresses.length === 0) {
      showToast('Please enter title and select at least one actress', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const storyImages = editStory.selectedImages.map(img => ({
        image_id: img.id,
        description: img.description || ''
      }));

      const res = await fetch(`/api/db/stories/${editStory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editStory.title,
          content: editStory.content,
          actress_ids: editStory.selectedActresses,
          images: storyImages
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save story changes');
      }

      setEditStoryModal(false);
      await fetchData();
      showToast('Story updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStory = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Story',
      message: 'Are you sure you want to delete this story?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/stories/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setSelectedStory(null);
            await fetchData();
            showToast('Story deleted successfully!', 'success');
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete story', 'error');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="section-header">
          <div className="shimmer-card shimmer-title" style={{ width: '280px', height: '32px' }}></div>
        </div>
        <div className="shimmer-story-layout">
          <div className="shimmer-card" style={{ height: '400px', borderRadius: '16px' }}></div>
          <div className="shimmer-card-el" style={{ height: '400px', borderRadius: '16px', justifyContent: 'flex-start' }}>
            <div className="shimmer-card shimmer-title" style={{ width: '60%', height: '28px', marginBottom: '1.5rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '20px', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '20px', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '20px', marginBottom: '1rem' }}></div>
            <div className="shimmer-card shimmer-text" style={{ height: '20px', width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Immersive Story Mode</h1>
      </div>

      {stories.length === 0 ? (
        <div className="glass-card story-empty-state" style={{ minHeight: '350px' }}>
          <BookOpen size={48} className="text-muted" />
          <h3>No stories created yet</h3>
          <p>Go to the Home Page or Profile Page to write a new actress lore story.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="story-layout">
          {/* Left Panel: Selector */}
          <div className="story-selector">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Story Files</h3>
            {stories.map((story) => {
              const isActive = selectedStory && selectedStory.id === story.id;
              const actressNames = story.actresses?.map(a => a.name).join(', ') || 'Unknown';
              return (
                <button 
                  key={story.id}
                  className={`story-selector-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="story-selector-title">{story.title}</div>
                  <div className="story-selector-actresses">Featuring: {actressNames}</div>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Immersive Content Viewport */}
          <div className="story-content-viewport">
            {selectedStory ? (
              <div className="glass-card" style={{ padding: '2.5rem' }}>
                {/* Header */}
                <div className="story-immersive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="story-immersive-title">{selectedStory.title}</h2>
                    
                    {/* Actress tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      {selectedStory.actresses?.map(actress => (
                        <Link 
                          key={actress.id} 
                          href="/actresses"
                          className="badge badge-purple"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <User size={12} />
                          {actress.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleOpenEditModal(selectedStory)}>
                      Edit Story
                    </button>
                    <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteStory(selectedStory.id)}>
                      Delete Story
                    </button>
                  </div>
                </div>

                {/* Narrative text content */}
                <div style={{ marginTop: '2rem' }}>
                  <p className="story-body-text">{selectedStory.content}</p>
                </div>

                {/* Linked images list */}
                {selectedStory.images && selectedStory.images.length > 0 && (
                  <div className="story-image-showcase">
                    <h3 style={{ fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                      Storyboard Graphics
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {selectedStory.images.map((img) => (
                        <div key={img.id} className="story-image-card">
                          <div className="story-image-wrapper">
                            <img src={img.url} className="story-image-el" alt="Story Graphic" />
                          </div>
                          {img.description && (
                            <div className="story-image-caption">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontStyle: 'normal', color: 'var(--accent-purple)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                <ImageIcon size={12} /> Illustration Context
                              </span>
                              <p>{img.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card story-empty-state">
                <BookOpen size={48} className="text-muted" />
                <h3>Select a story file from the index to begin.</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT STORY MODAL --- */}
      {editStoryModal && (
        <div className="modal-overlay">
          <form className="modal-container" style={{ maxWidth: '650px' }} onSubmit={handleUpdateStory}>
            <div className="modal-header">
              <span className="modal-title">Edit Actress Story / Lore</span>
              <button type="button" className="modal-close-btn" onClick={() => setEditStoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Story Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter story title"
                  value={editStory.title}
                  onChange={(e) => setEditStory(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Story Narrative Content</label>
                <textarea
                  className="form-textarea"
                  placeholder="Write the lore, script, or narrative details..."
                  style={{ minHeight: '140px' }}
                  value={editStory.content}
                  onChange={(e) => setEditStory(prev => ({ ...prev, content: e.target.value }))}
                  required
                />
              </div>

              {/* Actresses Selection with Profile Pictures */}
              <div className="form-group">
                <label>Featured AI Actresses (Multi-Select)</label>
                <div className="actress-select-grid">
                  {actresses.map(act => {
                    const isSelected = editStory.selectedActresses.includes(act.id);
                    return (
                      <div
                        key={act.id}
                        className={`actress-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleStoryActress(act.id)}
                      >
                        <img
                          src={act.profile_picture || '/logo.svg'}
                          alt={act.name}
                          className="actress-select-avatar"
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{act.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Associated Images Selection (Checks for image-actress intersections) */}
              <div className="form-group">
                <label>Select Graphics Used in this Story</label>
                {editStory.selectedActresses.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    *Select at least one actress to filter her images
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', background: 'var(--input-bg)', border: '1px solid var(--input-border)', padding: '0.5rem', borderRadius: '10px', marginBottom: '1rem' }}>
                      {images
                        .filter(img => img.actresses?.some(a => editStory.selectedActresses.includes(a.id)))
                        .map(img => {
                          const isSelected = editStory.selectedImages.some(i => i.id === img.id);
                          return (
                            <div
                              key={img.id}
                              className={`social-feed-item ${isSelected ? 'selected-border' : ''}`}
                              onClick={() => toggleStoryImage(img)}
                              style={{ border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-glass)', position: 'relative', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1/1' }}
                            >
                              <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Choice" />
                              {isSelected && (
                                <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent-purple)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={10} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    {editStory.selectedImages.map(selImg => (
                      <div key={selImg.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                        <img src={selImg.url} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="Mini thumbnail" />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          placeholder="Image caption/description for the story (optional)"
                          value={selImg.description || ''}
                          onChange={(e) => updateStoryImageDescription(selImg.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditStoryModal(false)}>Cancel</button>
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
