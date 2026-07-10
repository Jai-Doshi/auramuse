'use client';

import React, { useState, useEffect } from 'react';
import { Search, Heart, Copy, Check, X, ExternalLink, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, LayoutGrid, Image as ImageIcon, Lock, Crown } from 'lucide-react';
import Link from 'next/link';
import ActressMultiSelect from '@/components/ActressMultiSelect';
import CategoryMultiSelect from '@/components/CategoryMultiSelect';
import { useTheme } from '@/components/ThemeContext';

export default function GalleryPage() {
  const { user } = useTheme();
  const [collection, setCollection] = useState([]);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [actresses, setActresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCardCollectionDetails = (imgId) => {
    const found = collection.find(c => c.image_id === imgId);
    return {
      owned: user?.role === 'admin' || !!found,
      count: found ? found.count : 0
    };
  };

  const isImgFavorite = (imgId) => {
    if (user?.role === 'admin') {
      const img = images.find(i => i.id === imgId);
      return img ? img.favorite === true : false;
    } else {
      const uc = collection.find(c => c.image_id === imgId);
      return uc ? uc.favorite === true : false;
    }
  };

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedActresses, setSelectedActresses] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Image Detail Modal State
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editImageModal, setEditImageModal] = useState(false);
  const [editImage, setEditImage] = useState({ id: '', prompt: '', categoryIds: [], actressIds: [], preview: '' });
  const [submitting, setSubmitting] = useState(false);

  // Toast & Custom Confirm Modal States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // View & Lightbox & Mobile Filter States
  const [viewMode, setViewMode] = useState('prompt'); // 'prompt' or 'gallery'
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    } catch (e) {
      console.error('Error fetching gallery data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedActresses, activeTab]);

  // Handle Favorites toggle
  const handleToggleFavorite = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      if (user?.role === 'user') {
        const res = await fetch('/api/user/favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, imageId: id })
        });
        if (res.ok) {
          const updatedCard = await res.json();
          // Update collection state
          setCollection(prev => prev.map(c => c.image_id === id ? { ...c, favorite: updatedCard.favorite } : c));
          showToast(updatedCard.favorite ? 'Added to Favorites!' : 'Removed from Favorites.', 'info');
        }
      } else {
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
      categoryIds: img.categories?.map(c => c.id) || [],
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
          category_ids: editImage.categoryIds,
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
  const ownedImageIds = new Set(collection.map(c => c.image_id));
  const visibleImages = user?.role === 'admin' ? images : images.filter(img => ownedImageIds.has(img.id));

  const filteredImages = visibleImages.filter(img => {
    // 1. Search Query (match prompt text)
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Filter (Matches if selectedCategories is empty, or if image belongs to ANY of the selected categories)
    const matchesCategory = selectedCategories.length === 0 || img.categories?.some(c => selectedCategories.includes(c.id));

    // 3. Actress Filter (Checks many-to-many list)
    const matchesActress = selectedActresses.length === 0 || img.actresses?.some(a => selectedActresses.includes(a.id));

    // 4. Tab Filter (All vs Favorites)
    const isFav = isImgFavorite(img.id);
    const matchesTab = activeTab === 'all' || isFav;

    return matchesSearch && matchesCategory && matchesActress && matchesTab;
  });

  // Pagination Constants & Logic
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedImages = filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('ellipsis1');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

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
        <div className="view-toggle-container">
          <button
            className={`view-toggle-btn ${viewMode === 'prompt' ? 'active' : ''}`}
            onClick={() => setViewMode('prompt')}
            aria-label="Switch to Prompt View"
          >
            <LayoutGrid size={16} />
            <span className="toggle-text-label">Prompt View</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewMode('gallery')}
            aria-label="Switch to Gallery View"
          >
            <ImageIcon size={16} />
            <span className="toggle-text-label">Gallery View</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card filter-bar-wrapper">
        <div className="filter-search-row">
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

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            className={`mobile-filter-toggle ${showMobileFilters ? 'active' : ''}`}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Filters Selects and Tabs */}
        <div className={`filter-options-panel ${showMobileFilters ? 'show-mobile' : ''}`}>
          {/* Actress Filter */}
          <ActressMultiSelect
            actresses={actresses}
            selectedIds={selectedActresses}
            onChange={setSelectedActresses}
            placeholder="All Actresses"
          />

          {/* Category Filter */}
          <CategoryMultiSelect
            categories={categories}
            selectedIds={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="All Categories"
          />

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
              onClick={() => {
                if (user?.premium === true || user?.role === 'admin') {
                  setActiveTab('favorites');
                } else {
                  showToast('🔒 Favorites tab is exclusive to Premium users! Upgrade to unlock.', 'error');
                }
              }}
            >
              {!(user?.premium === true || user?.role === 'admin') && <Crown size={12} className="text-yellow" style={{ marginRight: '0.25rem', display: 'inline' }} />}
              Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Graphics Grid */}
      {filteredImages.length === 0 ? (
        <div className="glass-card story-empty-state" style={{ minHeight: '300px' }}>
          <Sparkles size={48} className="text-muted" />
          <h3>No matching graphics found</h3>
          <p>Try modifying your filters or search keywords.</p>
        </div>
      ) : viewMode === 'gallery' ? (
        <div className="gallery-masonry">
          {paginatedImages.map((img, idx) => (
            <div
              key={img.id}
              className="gallery-masonry-item"
              onClick={() => setLightboxIndex(idx)}
            >
              <img src={img.url} alt={img.prompt || "AI Graphic"} loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="gallery-grid">
          {paginatedImages.map((img) => {
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
      {/* : viewMode === 'gallery' ? (
        <div className="gallery-masonry">
          {paginatedImages.map((img, idx) => {
            const { owned, count } = getCardCollectionDetails(img.id);
            return (
              <div
                key={img.id}
                className={`gallery-masonry-item ${!owned ? 'locked-masonry-item' : ''}`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.url} alt={img.prompt || "AI Graphic"} loading="lazy" className={!owned ? 'blur-locked-img' : ''} />
                {!owned && (
                  <div className="locked-masonry-overlay">
                    <Lock size={20} className="text-white" />
                  </div>
                )}
                {owned && count > 1 && (
                  <div className="masonry-count-badge">x{count}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="gallery-grid">
          {paginatedImages.map((img) => {
            const actressNames = img.actresses?.map(a => a.name).join(', ') || 'N/A';
            const { owned, count } = getCardCollectionDetails(img.id);
            return (
              <div
                key={img.id}
                className={`gallery-card ${!owned ? 'locked-card-el' : ''}`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.url} alt="AI Art" className={`gallery-card-img ${!owned ? 'blur-locked-img' : ''}`} />

                {!owned ? (
                  <div className="locked-card-overlay-el">
                    <Lock size={24} className="text-muted" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>LOCKED CARD</span>
                  </div>
                ) : (
                  <>
                    {count > 1 && <span className="card-count-badge-grid">x{count}</span>}
                    <div className="gallery-card-overlay">
                      <p className="gallery-card-prompt">
                        {(user?.premium === true || user?.role === 'admin') ? img.prompt : "🔒 Prompt details locked (Premium Only)"}
                      </p>
                      <div className="gallery-card-meta">
                        <span className="gallery-card-actress">{actressNames}</span>
                        {(user?.premium === true || user?.role === 'admin') ? (
                          <button
                            className={`gallery-card-favorite-btn ${isImgFavorite(img.id) ? 'favorited' : ''}`}
                            onClick={(e) => handleToggleFavorite(img.id, e)}
                            aria-label="Favorite image"
                          >
                            <Heart size={20} fill={isImgFavorite(img.id) ? '#ef4444' : 'none'} />
                          </button>
                        ) : (
                          <button
                            className="gallery-card-favorite-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast('🔒 Favorites are exclusive to Premium users! Upgrade to unlock.', 'error');
                            }}
                            aria-label="Favorite locked"
                          >
                            <Crown size={16} className="text-yellow" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )} */}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="pagination-container">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis1' || page === 'ellipsis2') {
                return (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="pagination-info">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredImages.length)} of {filteredImages.length} graphics
          </div>
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
                  <img src={selectedImage.url} alt="AI Graphic Details" className={`detail-img ${!getCardCollectionDetails(selectedImage.id).owned ? 'blur-locked-detail' : ''}`} />
                  {!getCardCollectionDetails(selectedImage.id).owned && (
                    <div className="detail-locked-overlay">
                      <Lock size={32} />
                      <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Card Locked</p>
                    </div>
                  )}
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
                      {selectedImage.categories && selectedImage.categories.map(cat => (
                        <span key={cat.id} className="badge badge-blue" style={{ marginRight: '0.25rem' }}>
                          {cat.name}
                        </span>
                      ))}
                    </div>

                    {/* Details section */}
                    {!getCardCollectionDetails(selectedImage.id).owned ? (
                      <div className="locked-prompt-warning glass-card" style={{ padding: '1rem', marginTop: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                          🔒 This card's prompt parameters are locked! Claim daily packs to collect this card and unlock details.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ marginTop: '1.25rem', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>Prompt Parameters</h3>
                        {(user?.premium === true || user?.role === 'admin') ? (
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
                        ) : (
                          <div className="locked-prompt-warning glass-card" style={{ padding: '1.25rem', marginTop: '0.5rem', border: '1px solid rgba(212, 175, 55, 0.3)', background: 'linear-gradient(135deg, rgba(168,85,247,0.03), rgba(212,175,55,0.02))' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'bold', color: '#d4af37' }}>
                                <Crown size={16} /> Premium Feature Locked
                              </span>
                              <span>Generation prompts are exclusive to Premium users. Upgrade to unlock!</span>
                              <Link href="/story-mode" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', marginTop: '0.5rem', background: 'linear-gradient(135deg, #d4af37, #a855f7)', border: 'none', color: '#fff' }} onClick={() => setSelectedImage(null)}>
                                Get Premium Status
                              </Link>
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0' }}>
                      Generated on: {new Date(selectedImage.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions footer inside detail panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                    {(user?.premium === true || user?.role === 'admin') ? (
                      <button
                        className={`btn ${isImgFavorite(selectedImage.id) ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%', backgroundColor: isImgFavorite(selectedImage.id) ? '#ef4444' : '' }}
                        onClick={() => handleToggleFavorite(selectedImage.id)}
                      >
                        <Heart size={18} fill={isImgFavorite(selectedImage.id) ? 'white' : 'none'} />
                        {isImgFavorite(selectedImage.id) ? 'Favorited' : 'Add to Favorites'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', opacity: 0.65 }}
                        onClick={() => {
                          showToast('🔒 Favorites are exclusive to Premium users! Upgrade to unlock.', 'error');
                        }}
                      >
                        <Crown size={18} className="text-yellow" style={{ marginRight: '0.4rem', display: 'inline', verticalAlign: 'middle' }} />
                        Add to Favorites (Premium Only)
                      </button>
                    )}

                    {user?.role === 'admin' && (
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
                    )}
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
                <label>Categories (Select Multiple)</label>
                <CategoryMultiSelect
                  categories={categories}
                  selectedIds={editImage.categoryIds}
                  onChange={(ids) => setEditImage(prev => ({ ...prev, categoryIds: ids }))}
                  placeholder="Select Categories"
                />
              </div>

              <div className="form-group">
                <label>Featured Actresses</label>
                <ActressMultiSelect
                  actresses={actresses}
                  selectedIds={editImage.actressIds}
                  onChange={(ids) => setEditImage(prev => ({ ...prev, actressIds: ids }))}
                  placeholder="Select Featured Actresses"
                />
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

      {/* GALLERY LIGHTBOX OVERLAY */}
      {lightboxIndex !== null && (
        <LightboxModal
          images={paginatedImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
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

// Highly polished, details-free, scrolling Lightbox Modal for Gallery View
function LightboxModal({ images, currentIndex, onClose, onNavigate }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < images.length - 1) {
          onNavigate(currentIndex + 1);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onNavigate, onClose]);

  useEffect(() => {
    const activeThumb = document.getElementById(`lightbox-thumb-${currentIndex}`);
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex]);

  const currentImg = images[currentIndex];
  if (!currentImg) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      {/* Close button */}
      <button className="lightbox-close-btn" onClick={onClose} aria-label="Close Lightbox">
        <X size={24} />
      </button>

      {/* Navigation Arrow Left */}
      {currentIndex > 0 && (
        <button
          className="lightbox-nav-btn lightbox-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          aria-label="Previous Image"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Main Image Container */}
      <div className="lightbox-content-container" onClick={(e) => e.stopPropagation()}>
        <img
          src={currentImg.url}
          alt={currentImg.prompt || "Gallery Image"}
          className="lightbox-main-img"
        />
      </div>

      {/* Navigation Arrow Right */}
      {currentIndex < images.length - 1 && (
        <button
          className="lightbox-nav-btn lightbox-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          aria-label="Next Image"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Bottom Thumbnail Strip */}
      <div className="lightbox-thumbnails-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-thumbnails-scroll">
          {images.map((img, idx) => (
            <div
              key={img.id}
              id={`lightbox-thumb-${idx}`}
              className={`lightbox-thumbnail-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => onNavigate(idx)}
            >
              <img src={img.url} alt={`Thumbnail ${idx}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
