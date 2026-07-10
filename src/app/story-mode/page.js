'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, User, ImageIcon, Check, X, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, UploadCloud, Lock, Crown } from 'lucide-react';
import Link from 'next/link';
import ActressMultiSelect from '@/components/ActressMultiSelect';
import { useTheme } from '@/components/ThemeContext';

export default function StoryModePage() {
  const { user, updateUser } = useTheme();
  const [upgrading, setUpgrading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleUpgradeToPremium = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/user/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, premium: true })
      });
      if (!res.ok) throw new Error('Upgrade failed');
      const updated = await res.json();
      updateUser({ premium: true });
      showToast('🎉 Premium Mode Activated! All features unlocked.', 'success');
    } catch (e) {
      showToast('Upgrade failed. Please try again.', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const isPremium = user?.premium === true || user?.role === 'admin';

  if (!isPremium) {
    return (
      <div className="fade-in premium-upgrade-container" style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        {toast.show && (
          <div className={`toast toast-${toast.type} fade-in`} style={{ zIndex: 10000 }}>
            {toast.message}
          </div>
        )}
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="badge-rare-unlock" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Crown size={16} className="text-yellow" /> AURAMUSE PREMIUM
          </span>
          <br></br>
          <h1 className="section-title" style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '0.02em', background: 'linear-gradient(135deg, #fff 20%, #d4af37 70%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0.5rem 0' }}>
            Unlock the Full Creative Universe
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
            Upgrade today to read actress backstories, bookmark your absolute favorites, and inspect exact generation prompts.
          </p>
        </div>

        {/* Pricing Layout */}
        <div className="user-dashboard-grid" style={{ gap: '2rem', marginBottom: '3rem' }}>
          {/* Feature List Card */}
          <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <Sparkles size={20} className="text-yellow" /> Premium Member Perks
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Check size={18} className="text-green" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Immersive Story Mode</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Read all detailed chapter segments and backstory dossiers for every AI actress.</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Check size={18} className="text-green" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Prompt Engineer Details</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inspect the exact text description and style parameters used to generate any card graphic.</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Check size={18} className="text-green" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Personal Favorites Binder</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bookmark your absolute favorite graphics and filter them instantly under your private profile tab.</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Check size={18} className="text-green" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>High-Resolution full-size art views</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zero image blur for card details. Fully high-definition media downloads.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Pricing Selector Card */}
          <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.4)', background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(212,175,55,0.04))', boxShadow: '0 0 25px rgba(168,85,247,0.1)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', padding: '0.3rem 0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>BEST VALUE</span>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#fff' }}>Lifetime Access</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)', textDecoration: 'line-through' }}>$29.99</span>
              <span style={{ fontSize: '3rem', fontWeight: '900', color: '#fff' }}>$19.99</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>one-time</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
              Pay once and own premium status forever. All future story acts and content expansions included!
            </p>

            <button
              onClick={handleUpgradeToPremium}
              disabled={upgrading}
              className={`btn btn-primary`}
              style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #d4af37, #a855f7)', border: 'none', color: '#fff', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3)', borderRadius: '8px', cursor: 'pointer' }}
            >
              {upgrading ? 'Unlocking Perks...' : 'Upgrade to Premium'}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Secure Checkout Powered by Stripe Sandbox</span>
          </div>
        </div>
      </div>
    );
  }

  const [collection, setCollection] = useState([]);
  const [stories, setStories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  const isStoryUnlocked = (story) => {
    if (user?.role === 'admin') return true;
    if (!story.actresses || story.actresses.length === 0) return true;

    // Unlocked if user owns at least one actress card in the story
    return story.actresses.some(actress =>
      collection.some(uc =>
        uc.image && uc.image.actresses && uc.image.actresses.some(act => act.id === actress.id)
      )
    );
  };
  const [activePage, setActivePage] = useState(0);
  const [slideshowMode, setSlideshowMode] = useState(false);
  const [imageSelectorModalOpen, setImageSelectorModalOpen] = useState(false);

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

  // Custom Confirm Modal States
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Touch Swipe States for Book Navigation
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

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
    setSlideshowMode(false);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setActivePage(0);
    setSlideshowMode(false);
  };

  const nextPage = () => {
    if (!selectedStory) return;
    const totalSlides = (selectedStory.images?.length || 0) + 1; // cover slide (0) + images
    if (slideshowMode) {
      const totalImages = selectedStory.images?.length || 0;
      if (activePage < totalImages) {
        setActivePage(prev => prev + 1);
      }
    } else {
      if (activePage < totalSlides - 1) {
        setActivePage(prev => prev + 1);
      }
    }
  };

  const prevPage = () => {
    if (slideshowMode) {
      if (activePage > 1) {
        setActivePage(prev => prev - 1);
      }
    } else {
      if (activePage > 0) {
        setActivePage(prev => prev - 1);
      }
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
            const unlocked = isStoryUnlocked(story);
            const isAdmin = user?.role === 'admin';

            return (
              <div
                key={story.id}
                className={`story-masonry-card ${!unlocked ? 'locked-story-card' : ''}`}
                onClick={() => {
                  if (unlocked) {
                    handleOpenStory(story);
                  } else {
                    const actressList = story.actresses?.map(a => a.name).join(', ') || 'N/A';
                    showToast(`🔒 Story Locked! Collect cards of ${actressList} to unlock this lore.`, 'error');
                  }
                }}
              >
                {/* Story cover poster */}
                <img
                  src={coverPoster}
                  alt={story.title}
                  className={`story-masonry-cover ${!unlocked ? 'blur-locked-img' : ''}`}
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
                  <span className="page-count-full">{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                  <span className="page-count-mobile">{pageCount}</span>
                </div>

                {!unlocked ? (
                  <div className="locked-story-overlay">
                    <Lock size={32} className="text-muted" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>LOCKED STORY</span>
                  </div>
                ) : (
                  /* Hover overlay showing title, description, and actions */
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
                        {isAdmin && (
                          <>
                            <button className="btn-sm-icon" onClick={() => handleOpenEditModal(story)} title="Edit Story">
                              <Edit2 size={13} />
                            </button>
                            <button className="btn-sm-icon btn-danger" onClick={() => handleDeleteStory(story.id)} title="Delete Story">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- IMMERSIVE BOOK CAROUSEL VIEW MODAL --- */}
      {selectedStory && (
        <div className="book-overlay" style={{ display: 'flex' }}>
          <div className="book-overlay-backdrop" onClick={handleCloseStory}></div>

          <div className={`book-viewer-container ${slideshowMode ? 'slideshow-mode-active' : ''}`}>
            {/* Top Toolbar */}
            <div className="book-viewer-header">
              <div className="book-title-area">
                <h2>
                  {selectedStory.title}
                </h2>
              </div>
              <div className="book-actions-area">
                {user?.role === 'admin' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(selectedStory)}>
                      Edit Story
                    </button>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDeleteStory(selectedStory.id)}>
                      Delete Story
                    </button>
                  </>
                )}
                <button className="book-close-btn" onClick={handleCloseStory}>
                  <X size={26} />
                </button>
              </div>
            </div>
            {/* Book Spine Frame or Slideshow Viewer */}
            {slideshowMode ? (
              /* CLEAN SLIDESHOW VIEW */
              <div className="story-slideshow-fullscreen">
                <div className="story-slideshow-content" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  {(() => {
                    const imgIdx = activePage - 1;
                    const currentImg = selectedStory.images?.[imgIdx];
                    if (!currentImg) return <p style={{ color: 'var(--text-muted)' }}>No images available in this story.</p>;
                    return (
                      <div className="story-slideshow-image-wrapper">
                        <img src={currentImg.url} alt="Story Slide" className="story-slideshow-image" />
                      </div>
                    );
                  })()}

                  {/* Navigation Arrows inside slideshow */}
                  {activePage > 1 && (
                    <button className="book-nav-btn book-nav-btn-left" onClick={prevPage} title="Previous Image">
                      <ChevronLeft size={24} />
                    </button>
                  )}

                  {activePage < (selectedStory.images?.length || 0) && (
                    <button className="book-nav-btn book-nav-btn-right" onClick={nextPage} title="Next Image">
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Book Spine Frame */
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', width: '100%', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <h1 className="book-title-display" style={{ margin: 0 }}>{selectedStory.title}</h1>
                            {selectedStory.images && selectedStory.images.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-slideshow-toggle"
                                onClick={() => {
                                  setSlideshowMode(true);
                                  setActivePage(1);
                                }}
                                title="Play story images as slideshow"
                              >
                                <ImageIcon size={16} />
                                <span className="btn-text-label">Slideshow View</span>
                              </button>
                            )}
                          </div>

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
            )}

            {/* Bottom Page Indicator and dot navigation */}
            <div className="book-viewer-footer">
              <div className="book-page-indicator">
                {slideshowMode
                  ? `Image ${activePage} of ${selectedStory.images?.length || 0}`
                  : `Page ${activePage + 1} of ${(selectedStory.images?.length || 0) + 1}`
                }
              </div>
              <div className="book-dots-nav">
                <button
                  className={`book-dot-btn ${activePage === 0 ? 'active' : ''}`}
                  onClick={() => {
                    setSlideshowMode(false);
                    setActivePage(0);
                  }}
                  title="Cover"
                />
                {selectedStory.images?.map((_, idx) => (
                  <button
                    key={idx}
                    className={`book-dot-btn ${activePage === idx + 1 ? 'active' : ''}`}
                    onClick={() => {
                      if (slideshowMode && idx + 1 === 0) {
                        setSlideshowMode(false);
                      }
                      setActivePage(idx + 1);
                    }}
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

              {/* Actresses Selection with Dropdown */}
              <div className="form-group">
                <label>Featured AI Actresses (Multi-Select)</label>
                <ActressMultiSelect
                  actresses={actresses}
                  selectedIds={editStory.selectedActresses}
                  onChange={(ids) => setEditStory(prev => ({ ...prev, selectedActresses: ids }))}
                  placeholder="Select Featured Actresses"
                />
              </div>

              {/* Associated Images Selection via Modal Gallery */}
              <div className="form-group">
                <label>Story Graphics / Illustrations</label>
                {editStory.selectedActresses.length === 0 ? (
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
                      <span>Select Graphics from Gallery ({editStory.selectedImages.length} selected)</span>
                    </button>

                    {editStory.selectedImages.length > 0 && (
                      <div className="selected-graphics-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {editStory.selectedImages.map(selImg => (
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
              <button type="button" className="btn btn-secondary" onClick={() => setEditStoryModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
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
                  .filter(img => img.actresses?.some(a => editStory.selectedActresses.includes(a.id)))
                  .map(img => {
                    const isSelected = editStory.selectedImages.some(i => i.id === img.id);
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
                onClick={() => setEditStory(prev => ({ ...prev, selectedImages: [] }))}
              >
                Clear Selection
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  {editStory.selectedImages.length} Selected
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
