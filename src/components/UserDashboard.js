'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { Sparkles, Trophy, Zap, AlertCircle, RefreshCw, Layers, Users } from 'lucide-react';
import CardOpeningGame from './CardOpeningGame';

export default function UserDashboard() {
  const { user } = useTheme();

  // Database and stats states
  const [allImages, setAllImages] = useState([]);
  const [allActresses, setAllActresses] = useState([]);
  const [collection, setCollection] = useState([]);
  const [lastClaimDate, setLastClaimDate] = useState(null);
  const [claimsToday, setClaimsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // Daily pack opening states
  const [claimedCards, setClaimedCards] = useState(null);
  const [isOpeningPack, setIsOpeningPack] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Fetch all collection details
  const fetchDashboardData = async () => {
    try {
      const [imgsRes, actsRes, collRes, storiesRes] = await Promise.all([
        fetch('/api/db/images'),
        fetch('/api/db/actresses'),
        fetch('/api/user/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }),
        fetch('/api/db/stories')
      ]);

      const imgs = await imgsRes.json();
      const acts = await actsRes.json();
      const collData = await collRes.json();
      const stories = await storiesRes.json();

      // Extract all image IDs used in stories
      const storyImageIds = new Set();
      stories.forEach(story => {
        story.images?.forEach(img => {
          storyImageIds.add(img.id);
        });
      });

      // Filter out story cards from the total list for progression statistics
      const claimableImages = imgs.filter(i => !storyImageIds.has(i.id));

      setAllImages(claimableImages);
      setAllActresses(acts);
      setCollection(collData.cards || []);

      if (collData.claim) {
        const claimDate = new Date(collData.claim.last_claimed_at);
        const now = new Date();
        const isSameDay = claimDate.getFullYear() === now.getFullYear() &&
          claimDate.getMonth() === now.getMonth() &&
          claimDate.getDate() === now.getDate();

        setLastClaimDate(claimDate);
        setClaimsToday(isSameDay ? (collData.claim.claims_today || 0) : 0);
      } else {
        setLastClaimDate(null);
        setClaimsToday(0);
      }
    } catch (e) {
      console.error('Failed to load user dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  // Daily claim countdown timer
  useEffect(() => {
    if (!lastClaimDate || claimsToday < 10) {
      setTimeRemaining('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();

      // Countdown to next calendar day (midnight)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const lastClaimDay = lastClaimDate.getFullYear() === now.getFullYear() &&
        lastClaimDate.getMonth() === now.getMonth() &&
        lastClaimDate.getDate() === now.getDate();

      if (!lastClaimDay) {
        // Can claim!
        setTimeRemaining('');
        clearInterval(timer);
        return;
      }

      const diff = tomorrow - now;
      if (diff <= 0) {
        setTimeRemaining('');
        clearInterval(timer);
        fetchDashboardData(); // Refresh to allow claim
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [lastClaimDate, claimsToday]);

  // Daily claim countdown timer (Changed to 2 seconds cooldown)
  // useEffect(() => {
  //   if (!lastClaimDate) return;

  //   const timer = setInterval(() => {
  //     const now = new Date();

  //     // Calculate exactly 2 seconds after the last claim timestamp
  //     const unlockTime = new Date(lastClaimDate.getTime() + 10 * 1000);

  //     const diff = unlockTime - now;
  //     if (diff <= 0) {
  //       // Cooldown finished! Can claim again.
  //       setTimeRemaining('');
  //       clearInterval(timer);
  //       return;
  //     }

  //     // Format remaining seconds and milliseconds text
  //     const totalSeconds = Math.ceil(diff / 1000);
  //     setTimeRemaining(`00:00:${totalSeconds.toString().padStart(2, '0')}`);
  //   }, 250); // Run faster than 1000ms for accurate sub-second tracking

  //   return () => clearInterval(timer);
  // }, [lastClaimDate]);

  // Handle claiming the free daily pack
  const handleClaimPack = async () => {
    setClaimLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim daily pack');
      }

      setClaimedCards(data);
      setIsOpeningPack(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  // Clear claim timestamp debug endpoint
  const handleResetClaim = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/claim/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClose = () => {
    setIsOpeningPack(false);
    fetchDashboardData(); // Refresh data to update stats
  };

  // Collector Math & Stats
  const totalCardsCount = allImages.length;
  const ownedUniqueCardsCount = collection.length;
  const cardCompletenessPercent = totalCardsCount > 0 ? Math.round((ownedUniqueCardsCount / totalCardsCount) * 100) : 0;

  // Unlocked Actresses
  const totalActressesCount = allActresses.length;
  const ownedActressIds = new Set();
  collection.forEach(uc => {
    if (uc.image && uc.image.actresses) {
      uc.image.actresses.forEach(act => ownedActressIds.add(act.id));
    }
  });
  const ownedUniqueActressesCount = ownedActressIds.size;
  const actressCompletenessPercent = totalActressesCount > 0 ? Math.round((ownedUniqueActressesCount / totalActressesCount) * 100) : 0;

  // Collector Ranks
  let collectorRank = 'Novice Collector';
  let rankColor = '#6b7280'; // grey
  if (actressCompletenessPercent >= 80) {
    collectorRank = 'Aura Legend';
    rankColor = '#a855f7'; // purple
  } else if (actressCompletenessPercent >= 50) {
    collectorRank = 'Master Curator';
    rankColor = '#eab308'; // gold
  } else if (actressCompletenessPercent >= 20) {
    collectorRank = 'Skilled Gatherer';
    rankColor = '#3b82f6'; // blue
  }

  // Can user claim today?
  const canClaim = !timeRemaining && !claimLoading;

  if (loading) {
    return (
      <div className="fade-in">
        <div className="section-header">
          <h1 className="section-title">My Collection</h1>
        </div>
        <div className="shimmer-profile-layout">
          <div className="shimmer-card" style={{ height: '300px', borderRadius: '16px' }}></div>
          <div className="shimmer-card" style={{ height: '300px', borderRadius: '16px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in user-dashboard-container">
      {isOpeningPack && claimedCards ? (
        <CardOpeningGame cards={claimedCards} onClose={handleGameClose} />
      ) : (
        <>
          <div className="section-header">
            <div>
              <h1 className="section-title">Welcome Back, {user.name}!</h1>
              <br></br>
              <p className="section-subtitle">AuraMuse Collector Hub</p>
            </div>
            {/* Debug reset claim button */}
            <button
              onClick={handleResetClaim}
              className="btn btn-secondary debug-reset-btn"
              title="Developer Test: Reset daily claim claim timer"
            >
              <RefreshCw size={14} /> Debug: Reset Claim
            </button>
          </div>

          <div className="user-dashboard-grid">
            {/* LEFT COLUMN: DAILY PACK CLAIM WIDGET */}
            <div className="glass-card pack-claim-card">
              <h3 className="dashboard-card-title">
                <Zap size={20} className="text-purple" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Daily Free Pack
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Every day you get a pack of 3 randomized actress cards. Duplicate cards increase card power!
              </p>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Packs claimed today: <span style={{ color: 'var(--accent-purple)', fontSize: '1.1rem', fontWeight: '800' }}>{claimsToday}</span> / 10
              </div>

              <div className="pack-stage">
                {canClaim ? (
                  <div className="glowing-pack-wrapper pulse-glow-pack" onClick={handleClaimPack}>
                    <div className="card-back-design" style={{ width: '180px', height: '260px' }}>
                      <div className="card-back-foil-sweep"></div>
                      <div className="card-back-border-glow"></div>
                      <div className="card-back-pattern"></div>
                      <div className="card-back-inner-frame">
                        <div className="card-back-emblem-glow"></div>
                        <img src="/logo.png" alt="Emblem" className="card-back-logo" style={{ width: '48px', height: '48px' }} />
                        <h3 className="card-back-brand" style={{ fontSize: '1rem', marginTop: '0.6rem' }}>AURA</h3>
                        <div className="card-back-divider" style={{ width: '80%' }}>
                          <p className="card-back-edition" style={{ fontSize: '0.45rem' }}>CLAIM FREE PACK</p>
                        </div>
                        <div className="card-back-corner-decor tl"></div>
                        <div className="card-back-corner-decor tr"></div>
                        <div className="card-back-corner-decor bl"></div>
                        <div className="card-back-corner-decor br"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glowing-pack-wrapper pack-locked">
                    <div className="card-back-design pack-locked-back" style={{ width: '180px', height: '260px', opacity: 0.65 }}>
                      <div className="card-back-border-glow" style={{ borderColor: 'rgba(255,255,255,0.08)' }}></div>
                      <div className="card-back-pattern"></div>
                      <div className="card-back-inner-frame">
                        <img src="/logo.png" alt="Emblem" className="card-back-logo greyscale" style={{ width: '48px', height: '48px', filter: 'grayscale(1) opacity(0.3)' }} />
                        <div className="pack-timer-display" style={{ zIndex: 10, marginTop: '1rem' }}>
                          <span className="timer-text" style={{ fontSize: '1.1rem' }}>{timeRemaining || 'Claimed'}</span>
                          <span className="timer-lbl" style={{ fontSize: '0.55rem' }}>CHARGING PACK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="claim-error-message" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginTop: '1rem', color: '#f87171', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="pack-actions">
                <button
                  onClick={handleClaimPack}
                  disabled={!canClaim}
                  className={`btn btn-primary claim-action-btn ${!canClaim ? 'btn-disabled' : ''}`}
                  style={{ width: '100%' }}
                >
                  {claimLoading ? (
                    'Preparing Pack...'
                  ) : canClaim ? (
                    <>
                      <Sparkles size={18} /> Claim Pack {claimsToday + 1} / 10
                    </>
                  ) : (
                    'Daily Limit Reached'
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: STATS AND COLLECTOR LEVEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Rank & Rarity Stats */}
              <div className="glass-card stat-card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className="dashboard-card-title" style={{ margin: 0 }}>Collector Progression</h3>
                  <span className="badge-collector-rank" style={{ backgroundColor: `${rankColor}15`, color: rankColor, border: `1px solid ${rankColor}30`, padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    <Trophy size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                    {collectorRank}
                  </span>
                </div>

                <div className="progression-bars-stack">
                  {/* Card completeness progress */}
                  <div className="progression-bar-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Layers size={16} /> Cards Collected
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{ownedUniqueCardsCount} / {totalCardsCount} ({cardCompletenessPercent}%)</span>
                    </div>
                    <div className="progress-container" style={{ margin: 0, height: '10px' }}>
                      <div className="progress-bar" style={{ width: `${cardCompletenessPercent}%`, background: 'linear-gradient(90deg, #a855f7, #3b82f6)' }}></div>
                    </div>
                  </div>

                  {/* Actresses completeness progress */}
                  <div className="progression-bar-row" style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Users size={16} /> Actresses Unlocked
                      </span>
                      <span style={{ fontWeight: 'bold' }}>{ownedUniqueActressesCount} / {totalActressesCount} ({actressCompletenessPercent}%)</span>
                    </div>
                    <div className="progress-container" style={{ margin: 0, height: '10px' }}>
                      <div className="progress-bar" style={{ width: `${actressCompletenessPercent}%`, background: 'linear-gradient(90deg, #eab308, #a855f7)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent pulls panel */}
              <div className="glass-card" style={{ flex: 1 }}>
                <h3 className="dashboard-card-title">Recent Card Pulls</h3>
                {collection.length === 0 ? (
                  <div className="story-empty-state" style={{ minHeight: '150px' }}>
                    <Sparkles size={32} className="text-muted" />
                    <p style={{ marginTop: '0.5rem' }}>Your card binder is empty. Open your daily pack above!</p>
                  </div>
                ) : (
                  <div className="recent-pulls-grid">
                    {collection.slice(-4).reverse().map((item) => {
                      if (!item.image) return null;
                      const hasActress = item.image.actresses && item.image.actresses.length > 0;
                      const name = hasActress ? item.image.actresses.map(a => a.name).join(', ') : 'Unlocked card';
                      return (
                        <div key={item.image.id} className="recent-pull-item">
                          <img src={item.image.url} alt="card image" className="recent-pull-img" />
                          <div className="recent-pull-badge">x{item.count}</div>
                          <div className="recent-pull-name" title={name}>{name}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
