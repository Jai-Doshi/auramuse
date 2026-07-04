'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, ImageIcon, Heart, Copy, Check, X, ArrowLeft, Sparkles, UploadCloud } from 'lucide-react';

export default function ActressesPage() {
  const [actresses, setActresses] = useState([]);
  const [images, setImages] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active View States
  const [selectedActress, setSelectedActress] = useState(null); // Actress object if detail view active
  const [selectedImage, setSelectedImage] = useState(null); // Image object for the image detail modal
  const [copied, setCopied] = useState(false);
  const [editActressModal, setEditActressModal] = useState(false);
  const [editActress, setEditActress] = useState({ id: '', name: '', bio: '', file: null, preview: null });
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
      const [actsRes, imgsRes, storiesRes] = await Promise.all([
        fetch('/api/db/actresses'),
        fetch('/api/db/images'),
        fetch('/api/db/stories')
      ]);

      const acts = await actsRes.ok ? await actsRes.json() : [];
      const imgs = await imgsRes.ok ? await imgsRes.json() : [];
      const stors = await storiesRes.ok ? await storiesRes.json() : [];

      setActresses(acts);
      setImages(imgs);
      setStories(stors);

      // If an actress was already selected, update her state to reflect any new counts/images
      if (selectedActress) {
        const updated = acts.find(a => a.id === selectedActress.id);
        if (updated) setSelectedActress(updated);
      }
    } catch (e) {
      console.error('Error loading actresses data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Favorites toggle for image modal
  const handleToggleFavorite = async (id) => {
    try {
      const res = await fetch('/api/db/images/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const updatedImg = await res.json();
        // Update images state
        setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: updatedImg.favorite } : img));
        // Update selected image in modal
        if (selectedImage && selectedImage.id === id) {
          setSelectedImage(prev => ({ ...prev, favorite: updatedImg.favorite }));
        }
        showToast(updatedImg.favorite ? 'Added to Favorites!' : 'Removed from Favorites.', 'info');
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEditModal = (actress) => {
    setEditActress({
      id: actress.id,
      name: actress.name,
      bio: actress.bio || '',
      file: null,
      preview: actress.profile_picture
    });
    setEditActressModal(true);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditActress(prev => ({ ...prev, file, preview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageFile = async (file, type = 'actress') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to upload image file');
    }
    return await res.json();
  };

  const handleUpdateActress = async (e) => {
    e.preventDefault();
    if (!editActress.name.trim()) {
      showToast('Please fill out Name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      let profile_picture = null;
      if (editActress.file) {
        const uploadRes = await uploadImageFile(editActress.file, 'actress');
        profile_picture = uploadRes.url;
      }

      const res = await fetch(`/api/db/actresses/${editActress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editActress.name,
          profile_picture,
          bio: editActress.bio
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save actress');
      }
      const updated = await res.json();
      setSelectedActress(prev => ({
        ...prev,
        name: updated.name,
        profile_picture: updated.profile_picture || prev.profile_picture,
        bio: updated.bio
      }));
      setEditActressModal(false);
      await fetchData();
      showToast('Actress profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActress = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Actress Dossier',
      message: 'Are you sure you want to delete this actress? This will also remove her associations from stories and graphics.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/actresses/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setSelectedActress(null);
            await fetchData();
            showToast('Actress dossier deleted successfully!', 'success');
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete actress', 'error');
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
          <div className="shimmer-card shimmer-title" style={{ width: '200px', height: '32px' }}></div>
        </div>
        <div className="shimmer-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shimmer-card-el">
              <div className="shimmer-card shimmer-title" style={{ width: '40%', height: '20px', marginBottom: '1.5rem' }}></div>
              <div className="shimmer-card shimmer-text" style={{ height: '80px', borderRadius: '8px', marginBottom: '1.5rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="shimmer-card shimmer-text" style={{ flex: 1, height: '30px', borderRadius: '6px' }}></div>
                <div className="shimmer-card shimmer-text" style={{ flex: 1, height: '30px', borderRadius: '6px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get images specific to the selected actress (Checks many-to-many list)
  const actressImages = images.filter(img => selectedActress && img.actresses?.some(a => a.id === selectedActress.id));
  // Get stories specific to the selected actress
  const actressStories = stories.filter(story =>
    selectedActress && story.actresses?.some(act => act.id === selectedActress.id)
  );

  return (
    <div className="fade-in">
      {!selectedActress ? (
        <>
          {/* Main Grid View */}
          <div className="section-header">
            <h1 className="section-title">AI Actresses</h1>
          </div>

          {actresses.length === 0 ? (
            <div className="glass-card story-empty-state" style={{ minHeight: '300px' }}>
              <Sparkles size={48} className="text-muted" />
              <h3>No actresses registered yet</h3>
              <p>Go to the Profile Page to add new AI Actress cards.</p>
            </div>
          ) : (
            <div className="actress-grid">
              {actresses.map((actress) => (
                <div
                  key={actress.id}
                  className="actress-card"
                  onClick={() => setSelectedActress(actress)}
                >
                  {/* Card Image Background (Full Bleed) */}
                  <img
                    src={actress.profile_picture || '/logo.png'}
                    alt={actress.name}
                    className="playing-card-bg-img"
                  />
                  {/* Card Shadow Gradient Overlay */}
                  <div className="playing-card-overlay"></div>

                  {/* Top-Left Circular Gem (Power Level / Image Count) */}
                  <div className="playing-card-gem-left">
                    <span>{actress.raw_image_count}</span>
                  </div>

                  {/* Top-Right Faction Crest (Muse Icon) */}
                  <div className="playing-card-crest-right">
                    <Sparkles size={14} />
                  </div>

                  {/* Card Core Content (Middle to Bottom) */}
                  <div className="playing-card-content">
                    <h3 className="playing-card-name">{actress.name}</h3>

                    {/* Tiny dividing line */}
                    <div className="playing-card-divider">
                      <span className="playing-card-subtitle">AI MUSE</span>
                    </div>

                    <p className="playing-card-bio">
                      {actress.bio || 'No biographical dossier available.'}
                    </p>
                  </div>

                  {/* Bottom Stats Crests */}
                  <div className="playing-card-footer">
                    {/* Bottom Left: Power (Graphics) */}
                    <div className="playing-card-stat-badge stat-badge-gold" title="Graphics count">
                      <span>{actress.raw_image_count}</span>
                    </div>

                    {/* Bottom Center Decorative Gem */}
                    <div className="playing-card-center-gem"></div>

                    {/* Bottom Right: Health (Stories/Lore) */}
                    <div className="playing-card-stat-badge stat-badge-red" title="Stories count">
                      <span>{actress.raw_story_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Expanded Profile Detail View */}
          <div className="section-header">
            <button className="btn btn-secondary" onClick={() => setSelectedActress(null)}>
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <h1 className="section-title">Actress File</h1>
          </div>

          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            {/* Header info */}
            <div className="actress-detail-top">
              <img
                src={selectedActress.profile_picture}
                alt={selectedActress.name}
                className="actress-detail-avatar"
              />
              <div className="actress-detail-meta" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="actress-detail-name">{selectedActress.name}</h2>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                      <ImageIcon size={16} className="text-indigo" />
                      <strong>{selectedActress.activity_stat}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                      <BookOpen size={16} className="text-yellow" />
                      <strong>{selectedActress.story_stat}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => handleOpenEditModal(selectedActress)}>
                    Edit Profile
                  </button>
                  <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteActress(selectedActress.id)}>
                    Delete dossier
                  </button>
                </div>
              </div>
            </div>

            {/* Biography */}
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Biographical Dossier</h3>
            <p className="actress-detail-bio">
              {selectedActress.bio || `${selectedActress.name} is a high-definition AI character profile.`}
            </p>

            {/* Stories List */}
            {actressStories.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Featured Stories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {actressStories.map(story => (
                    <div key={story.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{story.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineClamp: '1', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{story.content}</div>
                      </div>
                      <BookOpen size={18} className="text-yellow" style={{ flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Grid of the actress */}
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Generated Graphics Portfolio</h3>
            {actressImages.length === 0 ? (
              <div className="story-empty-state" style={{ minHeight: '150px' }}>
                <ImageIcon size={32} className="text-muted" />
                <p>No graphics uploaded for this actress yet.</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {actressImages.map((img) => {
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(img.id);
                            }}
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
          </div>
        </>
      )}

      {/* REUSABLE IMAGE DETAIL MODAL OVERLAY */}
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
                <div className="detail-img-box">
                  <img src={selectedImage.url} alt="AI Graphic Details" className="detail-img" />
                </div>

                <div className="detail-info">
                  <div>
                    {/* Render all actress badges for the selected image */}
                    <div className="detail-meta-tags">
                      {selectedImage.actresses?.map(actress => (
                        <span key={actress.id} className="badge badge-purple">
                          {actress.name}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>Prompt Parameters</h3>
                    <div className="prompt-viewer">
                      <p style={{ paddingRight: '2rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {selectedImage.prompt}
                      </p>
                      <button
                        className="prompt-copy-btn"
                        onClick={() => handleCopyPrompt(selectedImage.prompt)}
                      >
                        {copied ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Generated on: {new Date(selectedImage.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                    <button
                      className={`btn ${selectedImage.favorite ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, backgroundColor: selectedImage.favorite ? '#ef4444' : '' }}
                      onClick={() => handleToggleFavorite(selectedImage.id)}
                    >
                      <Heart size={18} fill={selectedImage.favorite ? 'white' : 'none'} />
                      {selectedImage.favorite ? 'Favorited' : 'Add to Favorites'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT ACTRESS MODAL --- */}
      {editActressModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleUpdateActress}>
            <div className="modal-header">
              <span className="modal-title">Edit AI Actress Profile</span>
              <button type="button" className="modal-close-btn" onClick={() => setEditActressModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Profile Picture (Leave empty to keep current)</label>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleEditFileChange}
                  />
                  {editActress.preview ? (
                    <img src={editActress.preview} alt="Profile preview" className="upload-preview" />
                  ) : (
                    <>
                      <UploadCloud className="upload-icon" size={32} />
                      <span style={{ fontSize: '0.85rem' }}>Click to upload new photo</span>
                    </>
                  )}
                </label>
              </div>

              <div className="form-group">
                <label>Actress Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter name"
                  value={editActress.name}
                  onChange={(e) => setEditActress(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Biography / Story Context</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe her background, universe, or specialties..."
                  style={{ minHeight: '120px' }}
                  value={editActress.bio}
                  onChange={(e) => setEditActress(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditActressModal(false)}>Cancel</button>
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
