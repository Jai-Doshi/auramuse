'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, User, ImageIcon, Check, X, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function StoryModePage() {
  const [stories, setStories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activePage, setActivePage] = useState(0);

  // Edit Story Modal States
  const [editStoryModal, setEditStoryModal] = useState(false);
  const [editStory, setEditStory] = useState({
    id: '',
    title: '',
    content: '',
    coverPosterUrl: '',
    coverPosterFile: null,
    coverPosterPreview: null,
    selectedActresses: [],
    selectedImages: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Toast & Custom Confirm Modal States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Touch Swipe States for Book Navigation
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const uploadImageFile = async (file, type = 'posters') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to upload cover poster file');
    }
    return await res.json(); // returns { url, filename }
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

      // Keep selected story updated if it is currently open
      if (selectedStory) {
        const updatedStory = storyData.find(s => s.id === selectedStory.id);
        if (updatedStory) {
          setSelectedStory(updatedStory);
        } else {
          setSelectedStory(null);
        }
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

  // Keyboard navigation for open book
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedStory) return;
      if (e.key === 'ArrowLeft') {
        prevPage();
      } else if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === 'Escape') {
        handleCloseStory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStory, activePage]);

  const handleOpenStory = (story) => {
    setSelectedStory(story);
    setActivePage(0);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setActivePage(0);
  };

  const nextPage = () => {
    if (!selectedStory) return;
    const totalSlides = (selectedStory.images?.length || 0) + 1; // cover slide (0) + images
    if (activePage < totalSlides - 1) {
      setActivePage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (activePage > 0) {
      setActivePage(prev => prev - 1);
    }
  };

  // Touch Swipe Handlers for mobile swipe transitions
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped Left -> Turn Page Next
      nextPage();
    }
    if (touchStart - touchEnd < -75) {
      // Swiped Right -> Turn Page Prev
      prevPage();
    }
  };

  const handleOpenEditModal = (story) => {
    setEditStory({
      id: story.id,
      title: story.title,
      content: story.content || '',
      coverPosterUrl: story.cover_poster || '',
      coverPosterFile: null,
      coverPosterPreview: null,
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

      // If we remove an actress, filter out images that belong ONLY to the removed actress
      return { ...prev, selectedActresses: selected };
    });
  };

  const toggleStoryImage = (img) => {
    setEditStory(prev => {
      const isSelected = prev.selectedImages.some(i => i.id === img.id);
      const selected = isSelected
        ? prev.selectedImages.filter(i => i.id !== img.id)
        : [...prev.selectedImages, { id: img.id, url: img.url, description: '' }];

      // If we remove the cover poster image, reset it
      let coverPoster = prev.coverPosterUrl;
      if (isSelected && prev.coverPosterUrl === img.url) {
        coverPoster = '';
      }
      return { ...prev, selectedImages: selected, coverPosterUrl: coverPoster };
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

      let coverPoster = editStory.coverPosterUrl;
      if (editStory.coverPosterFile) {
        const uploadRes = await uploadImageFile(editStory.coverPosterFile, 'posters');
        coverPoster = uploadRes.url;
      }

      // Fallback to the first image if no cover is selected
      if (!coverPoster && editStory.selectedImages.length > 0) {
        coverPoster = editStory.selectedImages[0].url;
      }

      const res = await fetch(`/api/db/stories/${editStory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editStory.title,
          content: editStory.content,
          actress_ids: editStory.selectedActresses,
          images: storyImages,
          cover_poster: coverPoster
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
      message: 'Are you sure you want to delete this story? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/stories/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            handleCloseStory();
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
        <div className="story-masonry-gallery">
          <div className="shimmer-card" style={{ height: '320px', borderRadius: '16px', marginBottom: '1.5rem' }}></div>
          <div className="shimmer-card" style={{ height: '400px', borderRadius: '16px', marginBottom: '1.5rem' }}></div>
          <div className="shimmer-card" style={{ height: '280px', borderRadius: '16px', marginBottom: '1.5rem' }}></div>
          <div className="shimmer-card" style={{ height: '360px', borderRadius: '16px', marginBottom: '1.5rem' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ position: 'relative', minHeight: '80vh' }}>
      <div className="section-header">
        <h1 className="section-title">Immersive Story Mode</h1>
      </div>

      {stories.length === 0 ? (
        <div className="glass-card story-empty-state" style={{ minHeight: '350px' }}>
          <BookOpen size={48} className="text-muted" />
          <h3>No stories created yet</h3>
          <p>Go to the Dashboard to write a new actress lore story.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Go to Dashboard
          </Link>
        </div>
      ) : (
        /* Masonry styled gallery of stories */
        <div className="story-masonry-gallery">
          {stories.map((story) => {
            const pageCount = story.images?.length || 0;
            const coverPoster = story.cover_poster || '/logo.png';

            return (
              <div
                key={story.id}
                className="story-masonry-card"
                onClick={() => handleOpenStory(story)}
              >
                {/* Story cover poster */}
                <img
                  src={coverPoster}
                  alt={story.title}
                  className="story-masonry-cover"
                  onError={(e) => {
                    e.target.src = '/logo.png'; // fallback if image fails
                  }}
                />

                {/* Top left corner: circles of actresses */}
                <div className="story-card-actresses">
                  {story.actresses?.slice(0, 4).map((actress, idx) => (
                    <img
                      key={actress.id}
                      src={actress.profile_picture || '/logo.svg'}
                      alt={actress.name}
                      className="story-card-actress-avatar"
                      style={{
                        marginLeft: idx === 0 ? '0' : '-10px',
                        zIndex: 10 - idx
                      }}
                      title={actress.name}
                    />
                  ))}
                  {story.actresses?.length > 4 && (
                    <div
                      className="story-card-actress-avatar"
                      style={{
                        marginLeft: '-10px',
                        zIndex: 5,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: '700'
                      }}
                    >
                      +{story.actresses.length - 4}
                    </div>
                  )}
                </div>

                {/* Top right corner: total page/images counter */}
                <div className="story-card-page-count">
                  <BookOpen size={12} style={{ color: 'var(--accent-purple)' }} />
                  <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Hover overlay showing title, description, and actions */}
                <div className="story-card-overlay">
                  <div className="story-card-overlay-content">
                    <h3 className="story-card-title">{story.title}</h3>

                    <p className="story-card-desc">
                      {story.content && story.content.length > 120
                        ? `${story.content.substring(0, 120)}...`
                        : story.content}
                    </p>

                    <div className="story-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenStory(story)}>
                        Read Story
                      </button>
                      <button className="btn-sm-icon" onClick={() => handleOpenEditModal(story)} title="Edit Story">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-sm-icon btn-danger" onClick={() => handleDeleteStory(story.id)} title="Delete Story">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- IMMERSIVE BOOK CAROUSEL VIEW MODAL --- */}
      {selectedStory && (
        <div className="book-overlay" style={{ display: 'flex' }}>
          <div className="book-overlay-backdrop" onClick={handleCloseStory}></div>

          <div className="book-viewer-container">
            {/* Top Toolbar */}
            <div className="book-viewer-header">
              <div className="book-title-area">
                <h2>{selectedStory.title}</h2>
              </div>
              <div className="book-actions-area">
                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(selectedStory)}>
                  Edit Story
                </button>
                <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDeleteStory(selectedStory.id)}>
                  Delete Story
                </button>
                <button className="book-close-btn" onClick={handleCloseStory}>
                  <X size={26} />
                </button>
              </div>
            </div>

            {/* Book Spine Frame */}
            <div
              className="book-frame"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="book-pages-wrapper">
                {activePage === 0 ? (
                  /* COVER / INTRO SLIDE */
                  <div className="book-slide fade-in-slide">
                    {/* Left Page: Cover Poster image */}
                    <div className="book-page book-page-left book-page-cover-img">
                      <img
                        src={selectedStory.cover_poster || (selectedStory.images?.[0]?.url || '/logo.png')}
                        alt="Story Cover"
                        className="book-cover-img"
                      />
                    </div>

                    {/* Crease Fold effect */}
                    <div className="book-crease"></div>

                    {/* Right Page: Book Title & narrative intro */}
                    <div className="book-page book-page-right">
                      <div className="book-content-container">
                        <span className="book-genre-tag">Actress Universe Lore</span>
                        <h1 className="book-title-display">{selectedStory.title}</h1>

                        <div className="book-featured-actresses">
                          <span className="book-sub-label">Featured Actresses</span>
                          <div className="book-actresses-row">
                            {selectedStory.actresses?.map(act => (
                              <div key={act.id} className="book-actress-chip">
                                <img src={act.profile_picture || '/logo.svg'} alt={act.name} className="book-actress-avatar" />
                                <span>{act.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="book-narrative-intro">
                          <p>{selectedStory.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STORY IMAGE DETAILS SLIDES */
                  (() => {
                    const imgIdx = activePage - 1;
                    const currentImg = selectedStory.images?.[imgIdx];
                    if (!currentImg) return null;
                    return (
                      <div className="book-slide fade-in-slide" key={currentImg.id}>
                        {/* Left Page: Image view */}
                        <div className="book-page book-page-left">
                          <div className="book-image-container">
                            <img src={currentImg.url} alt={`Illustration ${activePage}`} className="book-story-img" />
                          </div>
                        </div>

                        {/* Crease fold effect */}
                        <div className="book-crease"></div>

                        {/* Right Page: Image context description */}
                        <div className="book-page book-page-right">
                          <div className="book-content-container">
                            <div className="book-page-number">Illustration {activePage} of {selectedStory.images.length}</div>

                            <div className="book-illustration-caption">
                              <span className="book-caption-label">Illustration context</span>
                              <p className="book-caption-text">
                                {currentImg.description || "No context has been written for this frame yet. Add descriptions in Edit Mode to build out the details of this story scene."}
                              </p>
                            </div>

                            {currentImg.prompt && (
                              <div className="book-illustration-prompt">
                                <span className="book-prompt-label">AI Generation Prompt</span>
                                <p className="book-prompt-text">"{currentImg.prompt}"</p>
                              </div>
                            )}

                            {currentImg.actresses && currentImg.actresses.length > 0 && (
                              <div style={{ marginTop: '1.5rem' }}>
                                <span className="book-prompt-label">Featured in Graphic</span>
                                <div className="book-actresses-row" style={{ marginTop: '0.4rem' }}>
                                  {currentImg.actresses.map(act => (
                                    <div key={act.id} className="book-actress-chip">
                                      <img src={act.profile_picture || '/logo.svg'} alt={act.name} className="book-actress-avatar" />
                                      <span style={{ fontSize: '0.75rem' }}>{act.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Navigation Arrows inside book frame */}
              {activePage > 0 && (
                <button className="book-nav-btn book-nav-btn-left" onClick={prevPage} title="Previous Page">
                  <ChevronLeft size={24} />
                </button>
              )}

              {activePage < (selectedStory.images?.length || 0) && (
                <button className="book-nav-btn book-nav-btn-right" onClick={nextPage} title="Next Page">
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Bottom Page Indicator and dot navigation */}
            <div className="book-viewer-footer">
              <div className="book-page-indicator">
                Page {activePage + 1} of {(selectedStory.images?.length || 0) + 1}
              </div>
              <div className="book-dots-nav">
                <button
                  className={`book-dot-btn ${activePage === 0 ? 'active' : ''}`}
                  onClick={() => setActivePage(0)}
                  title="Cover"
                />
                {selectedStory.images?.map((_, idx) => (
                  <button
                    key={idx}
                    className={`book-dot-btn ${activePage === idx + 1 ? 'active' : ''}`}
                    onClick={() => setActivePage(idx + 1)}
                    title={`Illustration ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
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

              {/* Cover Poster Selector */}
              <div className="form-group">
                <label>Story Cover Poster</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Select from selected images */}
                  {editStory.selectedImages.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Choose from story graphics:
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--input-border)' }}>
                        {editStory.selectedImages.map(img => {
                          const isSelected = editStory.coverPosterUrl === img.url && !editStory.coverPosterFile;
                          return (
                            <div
                              key={img.id}
                              onClick={() => setEditStory(prev => ({ ...prev, coverPosterUrl: img.url, coverPosterFile: null, coverPosterPreview: null }))}
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
                              <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Story thumbnail" />
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

                  {/* Upload a custom cover */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Or upload a custom cover poster image:
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
                              setEditStory(prev => ({
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
                      {editStory.coverPosterPreview ? (
                        <img src={editStory.coverPosterPreview} alt="Cover preview" className="upload-preview" />
                      ) : editStory.coverPosterUrl ? (
                        <img src={editStory.coverPosterUrl} alt="Cover Selection preview" className="upload-preview" />
                      ) : (
                        <>
                          <UploadCloud className="upload-icon" size={24} />
                          <span style={{ fontSize: '0.8rem' }}>Upload custom cover poster</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
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

              {/* Associated Images Selection */}
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
