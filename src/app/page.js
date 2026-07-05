'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Users,
  BookOpen,
  Heart,
  Plus,
  UploadCloud,
  X,
  FolderPlus,
  Sparkles,
  Check,
  Copy
} from 'lucide-react';
import ActressMultiSelect from '@/components/ActressMultiSelect';
import CategoryMultiSelect from '@/components/CategoryMultiSelect';

export default function HomePage() {
  // Database States
  const [stats, setStats] = useState({ images: 0, actresses: 0, stories: 0, favorites: 0 });
  const [actresses, setActresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState('');

  // Modal Visibility States
  const [actressModal, setActressModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [storyModal, setStoryModal] = useState(false);
  const [imageSelectorModalOpen, setImageSelectorModalOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  // Form Fields
  const [newActress, setNewActress] = useState({ name: '', bio: '', file: null, preview: null });
  const [newImage, setNewImage] = useState({ prompt: '', categoryIds: [], actressIds: [], file: null, preview: null });
  const [newStory, setNewStory] = useState({ title: '', content: '', selectedActresses: [], selectedImages: [], coverPosterUrl: '', coverPosterFile: null, coverPosterPreview: null }); // selectedImages is array of { id, url, description }
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Upload/Submit Loading
  const [submitting, setSubmitting] = useState(false);

  // Toast & Custom Confirm Modal States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      const [catsRes, actsRes, imgsRes, storiesRes] = await Promise.all([
        fetch('/api/db/categories'),
        fetch('/api/db/actresses'),
        fetch('/api/db/images'),
        fetch('/api/db/stories')
      ]);

      const cats = await catsRes.json();
      const acts = await actsRes.json();
      const imgs = await imgsRes.json();
      const stories = await storiesRes.json();

      setCategories(cats);
      setActresses(acts);
      setImages(imgs);

      // Calculate stats
      const favsCount = imgs.filter(i => i.favorite).length;
      setStats({
        images: imgs.length,
        actresses: acts.length,
        stories: stories.length,
        favorites: favsCount
      });

    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get stable daily prompt
  const getDailyPrompt = (imgsList) => {
    if (!imgsList || imgsList.length === 0) return null;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % imgsList.length;
    return imgsList[index];
  };

  const dailyPromptImage = getDailyPrompt(images);

  const handleCopyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedText(prompt);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Handle files preview
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'actress') {
          setNewActress(prev => ({ ...prev, file, preview: reader.result }));
        } else if (type === 'image') {
          setNewImage(prev => ({ ...prev, file, preview: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper: upload local image file
  const uploadImageFile = async (file, type = 'ai-images') => {
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
    return await res.json(); // returns { url, filename }
  };

  // 1. Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }
      setNewCategoryName('');
      setCategoryModal(false);
      await fetchData();
      showToast('Category created successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 1b. Update Category
  const handleUpdateCategory = async (id) => {
    if (!editingCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/db/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName })
      });
      if (res.ok) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        await fetchData();
        showToast('Category updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update category', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating category', 'error');
    }
  };

  // 1c. Delete Category
  const handleDeleteCategory = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Images in this category will become uncategorized.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/categories/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            await fetchData();
            showToast('Category deleted successfully!', 'success');
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed to delete category', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Error deleting category', 'error');
        }
      }
    });
  };

  // 2. Create Actress
  const handleCreateActress = async (e) => {
    e.preventDefault();
    if (!newActress.name.trim() || !newActress.file) {
      alert('Please fill out Name and upload a Profile Picture');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload profile pic
      const uploadRes = await uploadImageFile(newActress.file, 'actress');

      // 2. Create actress entry
      const res = await fetch('/api/db/actresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newActress.name,
          profile_picture: uploadRes.url,
          bio: newActress.bio
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save actress');
      }
      setNewActress({ name: '', bio: '', file: null, preview: null });
      setActressModal(false);
      await fetchData();
      showToast('AI Actress added successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Create Image (Multi-Actress Support)
  const handleCreateImage = async (e) => {
    e.preventDefault();
    if (!newImage.prompt.trim() || newImage.actressIds.length === 0 || !newImage.file) {
      alert('Please enter prompt, select at least one actress, and upload an image');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload image file
      const uploadRes = await uploadImageFile(newImage.file, 'ai-images');

      // 2. Create DB entry
      const res = await fetch('/api/db/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadRes.url,
          prompt: newImage.prompt,
          category_ids: newImage.categoryIds,
          actress_ids: newImage.actressIds
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save image');
      }
      setNewImage({ prompt: '', categoryIds: [], actressIds: [], file: null, preview: null });
      setImageModal(false);
      await fetchData();
      showToast('AI Graphic uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Create Story
  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!newStory.title.trim() || newStory.selectedActresses.length === 0) {
      alert('Please enter title and select at least one actress');
      return;
    }
    setSubmitting(true);
    try {
      const storyImages = newStory.selectedImages.map(img => ({
        image_id: img.id,
        description: img.description || ''
      }));

      let coverPoster = newStory.coverPosterUrl;
      if (newStory.coverPosterFile) {
        const uploadRes = await uploadImageFile(newStory.coverPosterFile, 'posters');
        coverPoster = uploadRes.url;
      }
      if (!coverPoster && newStory.selectedImages.length > 0) {
        coverPoster = newStory.selectedImages[0].url;
      }

      const res = await fetch('/api/db/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newStory.title,
          content: newStory.content,
          actress_ids: newStory.selectedActresses,
          images: storyImages,
          cover_poster: coverPoster
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create story');
      }

      setNewStory({ title: '', content: '', selectedActresses: [], selectedImages: [], coverPosterUrl: '', coverPosterFile: null, coverPosterPreview: null });
      setStoryModal(false);
      await fetchData();
      showToast('Story created successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper toggle story actress selection
  const toggleStoryActress = (id) => {
    setNewStory(prev => {
      const selected = prev.selectedActresses.includes(id)
        ? prev.selectedActresses.filter(aId => aId !== id)
        : [...prev.selectedActresses, id];
      return { ...prev, selectedActresses: selected };
    });
  };

  // Helper toggle story image selection
  const toggleStoryImage = (img) => {
    setNewStory(prev => {
      const isSelected = prev.selectedImages.some(i => i.id === img.id);
      const selected = isSelected
        ? prev.selectedImages.filter(i => i.id !== img.id)
        : [...prev.selectedImages, { id: img.id, url: img.url, description: '' }];
      return { ...prev, selectedImages: selected };
    });
  };

  // Helper update caption for story image
  const updateStoryImageDescription = (id, desc) => {
    setNewStory(prev => {
      const updated = prev.selectedImages.map(i => {
        if (i.id === id) {
          return { ...i, description: desc };
        }
        return i;
      });
      return { ...prev, selectedImages: updated };
    });
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="section-header">
          <div className="shimmer-card shimmer-title" style={{ width: '220px', height: '32px' }}></div>
        </div>
        <div className="dashboard-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="shimmer-card" style={{ height: '80px', borderRadius: '16px' }}></div>
            <div className="shimmer-card" style={{ height: '250px', borderRadius: '16px' }}></div>
            <div className="shimmer-card" style={{ height: '180px', borderRadius: '16px' }}></div>
          </div>
          <div className="shimmer-card" style={{ height: '400px', borderRadius: '16px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Page Title */}
      <div className="section-header">
        <h1 className="section-title">Dashboard</h1>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-box">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.images}</div>
            <div className="stat-label">AI Images</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-box">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.actresses}</div>
            <div className="stat-label">Actresses</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-box">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.stories}</div>
            <div className="stat-label">Stories</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-box">
            <Heart size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.favorites}</div>
            <div className="stat-label">Favorites</div>
          </div>
        </div>
      </div>

      {/* Main Home Layout */}
      <div className="home-sections">
        {/* Left Column: Daily Highlight Prompt */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Highlight Prompt of the Day</h2>
          </div>
          {!dailyPromptImage ? (
            <div className="glass-card story-empty-state">
              <Sparkles size={48} className="text-muted" />
              <h3>No AI graphics uploaded yet. Add some to see the daily prompt!</h3>
            </div>
          ) : (
            <div className="glass-card daily-prompt-card">
              <div className="daily-prompt-layout">
                <div className="daily-prompt-img-box">
                  <img src={dailyPromptImage.url} alt="Daily Highlight" className="daily-prompt-img" />
                </div>
                <div className="daily-prompt-details">
                  <div className="daily-prompt-header">
                    <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={12} /> Prompt of the Day
                    </span>
                    {dailyPromptImage.categories && dailyPromptImage.categories.map(cat => (
                      <span key={cat.id} className="badge badge-blue" style={{ marginRight: '0.25rem' }}>
                        {cat.name}
                      </span>
                    ))}
                  </div>

                  <div className="daily-prompt-text-container">
                    <p className="daily-prompt-text">"{dailyPromptImage.prompt}"</p>
                    <button
                      type="button"
                      className="prompt-copy-btn"
                      onClick={() => handleCopyPrompt(dailyPromptImage.prompt)}
                      title="Copy prompt"
                    >
                      {copiedText === dailyPromptImage.prompt ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />}
                    </button>
                  </div>

                  {dailyPromptImage.actresses && dailyPromptImage.actresses.length > 0 && (
                    <div className="daily-prompt-actresses">
                      <span className="sub-label">Featured Actresses</span>
                      <div className="actress-mini-list">
                        {dailyPromptImage.actresses.map(act => (
                          <div key={act.id} className="actress-mini-chip">
                            <img src={act.profile_picture} alt={act.name} className="actress-mini-avatar" />
                            <span>{act.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Operations */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setImageModal(true)}>
              <Plus size={18} /> Add New Image
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setActressModal(true)}>
              <Users size={18} /> Add New Actress
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setStoryModal(true)}>
              <BookOpen size={18} /> Add Actress Story
            </button>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setCategoryModal(true)}>
              <FolderPlus size={18} /> Create Category
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: ADD CATEGORY --- */}
      {categoryModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleCreateCategory}>
            <div className="modal-header">
              <span className="modal-title">Create Category</span>
              <button type="button" className="modal-close-btn" onClick={() => setCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fantasy, Cyberpunk, Cinematic"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
              </div>

              {/* Existing Categories List */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
                  Manage Existing Categories
                </label>
                {categories.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No categories created yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {categories.map(cat => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        {editingCategoryId === cat.id ? (
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            required
                          />
                        ) : (
                          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cat.name}</span>
                        )}

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {editingCategoryId === cat.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.35rem' }}
                                onClick={() => handleUpdateCategory(cat.id)}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem' }}
                                onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', height: 'auto' }}
                                onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.6rem', borderColor: '#ef4444', color: '#ef4444', fontSize: '0.75rem', height: 'auto' }}
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCategoryModal(false)}>Close</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL 2: ADD ACTRESS --- */}
      {actressModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleCreateActress}>
            <div className="modal-header">
              <span className="modal-title">Add New AI Actress</span>
              <button type="button" className="modal-close-btn" onClick={() => setActressModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Profile Picture</label>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, 'actress')}
                    required
                  />
                  {newActress.preview ? (
                    <img src={newActress.preview} alt="Profile preview" className="upload-preview" />
                  ) : (
                    <>
                      <UploadCloud className="upload-icon" size={32} />
                      <span style={{ fontSize: '0.85rem' }}>Click to upload profile photo</span>
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
                  value={newActress.name}
                  onChange={(e) => setNewActress(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Biography / Story Context</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe her background, universe, or specialties..."
                  value={newActress.bio}
                  onChange={(e) => setNewActress(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setActressModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Uploading...' : 'Add Actress'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL 3: ADD IMAGE (Multi-Actress Support) --- */}
      {imageModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={handleCreateImage}>
            <div className="modal-header">
              <span className="modal-title">Upload AI Graphic</span>
              <button type="button" className="modal-close-btn" onClick={() => setImageModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Graphic File</label>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, 'image')}
                    required
                  />
                  {newImage.preview ? (
                    <img src={newImage.preview} alt="Graphic preview" className="upload-preview" />
                  ) : (
                    <>
                      <UploadCloud className="upload-icon" size={32} />
                      <span style={{ fontSize: '0.85rem' }}>Upload AI Generated Image</span>
                    </>
                  )}
                </label>
              </div>

              {/* Multi-Actress Selection with Dropdown */}
              <div className="form-group">
                <label>Featured AI Actresses (Select all featured)</label>
                <ActressMultiSelect
                  actresses={actresses}
                  selectedIds={newImage.actressIds}
                  onChange={(ids) => setNewImage(prev => ({ ...prev, actressIds: ids }))}
                  placeholder="Select Featured Actresses"
                />
              </div>

              <div className="form-group">
                <label>Categories (Select Multiple)</label>
                <CategoryMultiSelect
                  categories={categories}
                  selectedIds={newImage.categoryIds}
                  onChange={(ids) => setNewImage(prev => ({ ...prev, categoryIds: ids }))}
                  placeholder="Select Categories"
                />
              </div>

              <div className="form-group">
                <label>Prompt Description used to generate image</label>
                <textarea
                  className="form-textarea"
                  placeholder="Masterpiece, photorealistic portrait, detailed eyes, cinematic lighting..."
                  value={newImage.prompt}
                  onChange={(e) => setNewImage(prev => ({ ...prev, prompt: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setImageModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Uploading...' : 'Save Graphic'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL 4: ADD STORY --- */}
      {storyModal && (
        <div className="modal-overlay">
          <form className="modal-container" style={{ maxWidth: '650px' }} onSubmit={handleCreateStory}>
            <div className="modal-header">
              <span className="modal-title">Create Actress Story / Lore</span>
              <button type="button" className="modal-close-btn" onClick={() => setStoryModal(false)}>
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
                  value={newStory.title}
                  onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Story Narrative Content</label>
                <textarea
                  className="form-textarea"
                  placeholder="Write the lore, script, or narrative details..."
                  style={{ minHeight: '140px' }}
                  value={newStory.content}
                  onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Story Cover Poster</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Option A: Select from story's selected images */}
                  {newStory.selectedImages.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Select from story illustrations:
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--input-border)' }}>
                        {newStory.selectedImages.map(img => {
                          const isSelected = newStory.coverPosterUrl === img.url && !newStory.coverPosterFile;
                          return (
                            <div
                              key={img.id}
                              onClick={() => setNewStory(prev => ({ ...prev, coverPosterUrl: img.url, coverPosterFile: null, coverPosterPreview: null }))}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                border: isSelected ? '2.5px solid var(--accent-purple)' : '1.5px solid transparent'
                              }}
                            >
                              <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Thumb" />
                              {isSelected && (
                                <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent-purple)', color: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={8} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Option B: Upload a custom cover poster */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Or upload a custom cover poster:
                    </span>
                    <label className="upload-dropzone" style={{ minHeight: '100px', padding: '1rem' }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStory(prev => ({
                                ...prev,
                                coverPosterFile: file,
                                coverPosterPreview: reader.result,
                                coverPosterUrl: ''
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {newStory.coverPosterPreview ? (
                        <img src={newStory.coverPosterPreview} alt="Cover preview" className="upload-preview" />
                      ) : newStory.coverPosterUrl ? (
                        <img src={newStory.coverPosterUrl} alt="Cover selection preview" className="upload-preview" />
                      ) : (
                        <>
                          <UploadCloud className="upload-icon" size={24} />
                          <span style={{ fontSize: '0.8rem' }}>Click to upload custom cover poster</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Actresses Selection with Dropdown */}
              <div className="form-group">
                <label>Featured AI Actresses (Multi-Select)</label>
                <ActressMultiSelect
                  actresses={actresses}
                  selectedIds={newStory.selectedActresses}
                  onChange={(ids) => setNewStory(prev => ({ ...prev, selectedActresses: ids }))}
                  placeholder="Select Featured Actresses"
                />
              </div>

              {/* Associated Images Selection via Modal Gallery */}
              <div className="form-group">
                <label>Story Graphics / Illustrations</label>
                {newStory.selectedActresses.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    *Select at least one actress first to select her images
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setImageSelectorModalOpen(true)}
                      style={{ width: '100%', marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                    >
                      <ImageIcon size={16} />
                      <span>Select Graphics from Gallery ({newStory.selectedImages.length} selected)</span>
                    </button>

                    {newStory.selectedImages.length > 0 && (
                      <div className="selected-graphics-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {newStory.selectedImages.map(selImg => (
                          <div key={selImg.id} className="selected-graphic-caption-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '0.6rem', borderRadius: '12px' }}>
                            <img src={selImg.url} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-glass)' }} alt="Mini thumbnail" />
                            <input
                              type="text"
                              className="form-input"
                              style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                              placeholder="Image caption/description for the story (optional)"
                              value={selImg.description || ''}
                              onChange={(e) => updateStoryImageDescription(selImg.id, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-sm-icon btn-danger"
                              onClick={() => toggleStoryImage(selImg)}
                              title="Deselect image"
                              style={{ padding: '0.5rem' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStoryModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Story'}
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

      {/* --- STORY IMAGE GALLERY SELECTOR SUB-MODAL --- */}
      {imageSelectorModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container" style={{ maxWidth: '750px', maxHeight: '80vh' }}>
            <div className="modal-header">
              <span className="modal-title">Select Story Graphics</span>
              <button type="button" className="modal-close-btn" onClick={() => setImageSelectorModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Select the graphics that you want to feature in this actress lore. (Filtered by the selected actresses).
              </p>

              <div className="story-image-selector-grid">
                {images
                  .filter(img => img.actresses?.some(a => newStory.selectedActresses.includes(a.id)))
                  .map(img => {
                    const isSelected = newStory.selectedImages.some(i => i.id === img.id);
                    return (
                      <div
                        key={img.id}
                        className={`story-image-selector-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleStoryImage(img)}
                      >
                        <img src={img.url} alt="Gallery graphic" className="selector-card-img" />
                        {isSelected && (
                          <div className="selector-checked-badge">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setNewStory(prev => ({ ...prev, selectedImages: [], coverPosterUrl: '' }))}
              >
                Clear Selection
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  {newStory.selectedImages.length} Selected
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setImageSelectorModalOpen(false)}
                >
                  Confirm Selection
                </button>
              </div>
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
