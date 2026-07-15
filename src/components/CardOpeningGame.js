'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Award, ChevronRight } from 'lucide-react';

export default function CardOpeningGame({ cards, onClose }) {
  const [revealed, setRevealed] = useState({});
  const [unlockedActresses, setUnlockedActresses] = useState([]);
  const [unlockedCard, setUnlockedCard] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor viewport size to determine responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log("CardOpeningGame loaded with cards:", cards);
  }, [cards]);

  const handleCardClick = (index) => {
    if (revealed[index]) return;

    setRevealed(prev => ({ ...prev, [index]: true }));

    const card = cards[index];
    console.log(`Card clicked index ${index}: count = ${card.count}, typeof count = ${typeof card.count}`);
    const isNewCard = card.count == 1;
    const isRare = card.isRare;

    if (isNewCard || isRare) {
      setTimeout(() => {
        setUnlockedCard(card);
      }, 800); // Wait for card flip animation to finish
    } else if (card.isNewActressUnlocked && card.newlyUnlockedActresses && card.newlyUnlockedActresses.length > 0) {
      setTimeout(() => {
        setUnlockedActresses(card.newlyUnlockedActresses);
      }, 800); // Wait for card flip animation to finish
    }
  };

  const handleContinueCardUnlock = () => {
    const card = unlockedCard;
    setUnlockedCard(null);
    if (card && card.isNewActressUnlocked && card.newlyUnlockedActresses && card.newlyUnlockedActresses.length > 0) {
      setTimeout(() => {
        setUnlockedActresses(card.newlyUnlockedActresses);
      }, 300);
    }
  };

  const handleNextClick = () => {
    if (activeIndex < cards.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const allRevealed = Object.keys(revealed).length === cards.length;

  return (
    <div className="game-overlay">
      <div className="game-ambient-lights">
        <div className="game-glow orb-purple"></div>
        <div className="game-glow orb-gold"></div>
      </div>

      <div className="game-header">
        <h2 className="game-title">
          <Sparkles className="text-yellow pulse-icon" style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Your Daily Pack
        </h2>
        <p className="game-subtitle">
          {isMobile ? (
            !showSummary 
              ? `Opening Card ${activeIndex + 1} of ${cards.length}. Click it to reveal!`
              : "Review your gorgeous new pulls below!"
          ) : (
            allRevealed 
              ? "Your pack is fully revealed! Add cards to your collection." 
              : "Click on each card to reveal the gorgeous contents inside"
          )}
        </p>
      </div>

      {isMobile ? (
        /* Sequential Active Card View for Mobile */
        !showSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '2rem', width: '100%' }}>
            {(() => {
              const card = cards[activeIndex];
              const isFlipped = !!revealed[activeIndex];
              const hasActress = card.actresses && card.actresses.length > 0;
              const actressName = hasActress ? card.actresses.map(a => a.name).join(', ') : 'Unknown';

              return (
                <div
                  className={`card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(activeIndex)}
                  style={{ transform: 'scale(1.15)', margin: '1rem 0' }}
                >
                  <div className="card-3d-inner">
                    {/* CARD FRONT (Face down) */}
                    <div className="card-3d-side card-3d-front">
                      <div className="card-back-design">
                        <div className="card-back-foil-sweep"></div>
                        <div className="card-back-border-glow"></div>
                        <div className="card-back-pattern"></div>
                        <div className="card-back-inner-frame">
                          <div className="card-back-emblem-glow"></div>
                          <img src="/logo.png" alt="Emblem" className="card-back-logo" />
                          <h3 className="card-back-brand">AURA</h3>
                          <div className="card-back-divider">
                            <p className="card-back-edition">PREMIUM COLLECTION</p>
                          </div>
                          <div className="card-back-corner-decor tl"></div>
                          <div className="card-back-corner-decor tr"></div>
                          <div className="card-back-corner-decor bl"></div>
                          <div className="card-back-corner-decor br"></div>
                        </div>
                      </div>
                    </div>

                    {/* CARD BACK (Face up) */}
                    <div className={`card-3d-side card-3d-back ${card.isRare ? 'rare-card-border' : ''}`}>
                      {isFlipped && (
                        card.isRare ? (
                          <div className="card-backlight-rare"></div>
                        ) : (
                          (card.isNewActressUnlocked || card.count == 1) && <div className="card-backlight"></div>
                        )
                      )}

                      <div className="card-face">
                        <img src={card.url} alt="Actress Card" className="card-face-img" />
                        <div className="card-face-overlay"></div>

                        {card.isRare && (
                          <span className="badge-rare-unlock">
                            <Award size={12} /> RARE ART
                          </span>
                        )}

                        {card.isNewActressUnlocked && !card.isRare && (
                          <span className="badge-new-unlock">
                            <Sparkles size={12} /> NEW UNLOCK
                          </span>
                        )}

                        {card.count == 1 && (
                          <span className="badge-new-card" style={card.isRare || card.isNewActressUnlocked ? { left: 'auto', right: '12px' } : {}}>
                            <Sparkles size={12} /> NEW CARD
                          </span>
                        )}

                        {card.count > 1 && (
                          <span className="card-count-badge">x{card.count}</span>
                        )}

                        <div className="card-face-details">
                          <h4 className="card-actress-name">{actressName}</h4>
                          <p className="card-prompt-snippet">"{card.prompt.slice(0, 55)}..."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action button to proceed */}
            {revealed[activeIndex] && (
              <button
                onClick={handleNextClick}
                className="btn btn-primary collect-btn fade-in"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', cursor: 'pointer' }}
              >
                <span>{activeIndex < cards.length - 1 ? 'Reveal Next Card' : 'View Pack Summary'}</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        ) : (
          /* Mobile Pack Summary Grid */
          <>
            <div className="card-deal-grid fade-in">
              {cards.map((card, idx) => {
                const hasActress = card.actresses && card.actresses.length > 0;
                const actressName = hasActress ? card.actresses.map(a => a.name).join(', ') : 'Unknown';

                return (
                  <div
                    key={idx}
                    className="card-3d-wrapper flipped"
                    style={{ cursor: 'default' }}
                  >
                    <div className="card-3d-inner">
                       <div className={`card-3d-side card-3d-back ${card.isRare ? 'rare-card-border' : ''}`}>
                        {card.isRare ? (
                          <div className="card-backlight-rare"></div>
                        ) : (
                          (card.isNewActressUnlocked || card.count == 1) && <div className="card-backlight"></div>
                        )}

                        <div className="card-face">
                          <img src={card.url} alt="Actress Card" className="card-face-img" />
                          <div className="card-face-overlay"></div>

                          {card.isRare && (
                            <span className="badge-rare-unlock">
                              <Award size={12} /> RARE ART
                            </span>
                          )}

                          {card.isNewActressUnlocked && !card.isRare && (
                            <span className="badge-new-unlock">
                              <Sparkles size={12} /> NEW UNLOCK
                            </span>
                          )}

                          {card.count == 1 && (
                            <span className="badge-new-card" style={card.isRare || card.isNewActressUnlocked ? { left: 'auto', right: '12px' } : {}}>
                              <Sparkles size={12} /> NEW CARD
                            </span>
                          )}

                          {card.count > 1 && (
                            <span className="card-count-badge">x{card.count}</span>
                          )}

                          <div className="card-face-details">
                            <h4 className="card-actress-name">{actressName}</h4>
                            <p className="card-prompt-snippet">"{card.prompt.slice(0, 55)}..."</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="game-footer">
              <button onClick={onClose} className="btn btn-primary collect-btn fade-in" style={{ cursor: 'pointer' }}>
                Add to My Collection
              </button>
            </div>
          </>
        )
      ) : (
        /* Original All-At-Once Grid View for Desktop */
        <>
          <div className="card-deal-grid fade-in">
            {cards.map((card, idx) => {
              const isFlipped = !!revealed[idx];
              const hasActress = card.actresses && card.actresses.length > 0;
              const actressName = hasActress ? card.actresses.map(a => a.name).join(', ') : 'Unknown';

              return (
                <div
                  key={idx}
                  className={`card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className="card-3d-inner">
                    {/* CARD FRONT (Face down) */}
                    <div className="card-3d-side card-3d-front">
                      <div className="card-back-design">
                        <div className="card-back-foil-sweep"></div>
                        <div className="card-back-border-glow"></div>
                        <div className="card-back-pattern"></div>
                        <div className="card-back-inner-frame">
                          <div className="card-back-emblem-glow"></div>
                          <img src="/logo.png" alt="Emblem" className="card-back-logo" />
                          <h3 className="card-back-brand">AURA</h3>
                          <div className="card-back-divider">
                            <p className="card-back-edition">PREMIUM COLLECTION</p>
                          </div>
                          <div className="card-back-corner-decor tl"></div>
                          <div className="card-back-corner-decor tr"></div>
                          <div className="card-back-corner-decor bl"></div>
                          <div className="card-back-corner-decor br"></div>
                        </div>
                      </div>
                    </div>

                    {/* CARD BACK (Face up) */}
                    <div className={`card-3d-side card-3d-back ${card.isRare ? 'rare-card-border' : ''}`}>
                      {isFlipped && (
                        card.isRare ? (
                          <div className="card-backlight-rare"></div>
                        ) : (
                          (card.isNewActressUnlocked || card.count == 1) && <div className="card-backlight"></div>
                        )
                      )}

                      <div className="card-face">
                        <img src={card.url} alt="Actress Card" className="card-face-img" />
                        <div className="card-face-overlay"></div>

                        {card.isRare && (
                          <span className="badge-rare-unlock">
                            <Award size={12} /> RARE ART
                          </span>
                        )}

                        {card.isNewActressUnlocked && !card.isRare && (
                          <span className="badge-new-unlock">
                            <Sparkles size={12} /> NEW UNLOCK
                          </span>
                        )}

                        {card.count == 1 && (
                          <span className="badge-new-card" style={card.isRare || card.isNewActressUnlocked ? { left: 'auto', right: '12px' } : {}}>
                            <Sparkles size={12} /> NEW CARD
                          </span>
                        )}

                        {card.count > 1 && (
                          <span className="card-count-badge">x{card.count}</span>
                        )}

                        <div className="card-face-details">
                          <h4 className="card-actress-name">{actressName}</h4>
                          <p className="card-prompt-snippet">"{card.prompt.slice(0, 55)}..."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="game-footer">
            {allRevealed ? (
              <button onClick={onClose} className="btn btn-primary collect-btn fade-in" style={{ cursor: 'pointer' }}>
                Add to My Collection
              </button>
            ) : (
              <span className="reveal-hint">Flipped {Object.keys(revealed).length} / {cards.length}</span>
            )}
          </div>
        </>
      )}

      {/* NEW CARD/RARE ART UNLOCKED POPUP */}
      {unlockedCard && (
        <div className="game-modal-overlay" onClick={handleContinueCardUnlock}>
          <div className="glass-card unlock-modal fade-in-up" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="unlock-badge-container">
              {unlockedCard.isRare ? (
                <Award className="unlock-award-icon text-yellow" size={48} />
              ) : (
                <Sparkles className="unlock-award-icon text-yellow" size={48} />
              )}
            </div>

            <h3 className="unlock-modal-title">
              {unlockedCard.isRare ? 'Rare Art Unlocked!' : 'New Card Unlocked!'}
            </h3>

            <div className="unlock-card-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={`card-3d-wrapper flipped ${unlockedCard.isRare ? 'rare-card-border' : ''}`} style={{ transform: 'scale(1.05)', cursor: 'default', pointerEvents: 'none' }}>
                <div className="card-3d-inner">
                  <div className="card-3d-side card-3d-back">
                    {unlockedCard.isRare ? (
                      <div className="card-backlight-rare"></div>
                    ) : (
                      <div className="card-backlight"></div>
                    )}
                    <div className="card-face">
                      <img src={unlockedCard.url} alt="Actress Card" className="card-face-img" />
                      <div className="card-face-overlay"></div>
                      {unlockedCard.isRare && (
                        <span className="badge-rare-unlock">
                          <Award size={12} /> RARE ART
                        </span>
                      )}
                      {!unlockedCard.isRare && unlockedCard.isNewActressUnlocked && (
                        <span className="badge-new-unlock">
                          <Sparkles size={12} /> NEW UNLOCK
                        </span>
                      )}
                      {unlockedCard.count == 1 && (
                        <span className="badge-new-card" style={unlockedCard.isRare || unlockedCard.isNewActressUnlocked ? { left: 'auto', right: '12px' } : {}}>
                          <Sparkles size={12} /> NEW CARD
                        </span>
                      )}
                      <div className="card-face-details">
                        <h4 className="card-actress-name">
                          {unlockedCard.actresses && unlockedCard.actresses.length > 0 
                            ? unlockedCard.actresses.map(a => a.name).join(', ') 
                            : 'Unknown'}
                        </h4>
                        <p className="card-prompt-snippet">"{unlockedCard.prompt ? unlockedCard.prompt.slice(0, 55) : ''}..."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: '0.5rem 0 0 0' }}>
                {unlockedCard.isRare 
                  ? 'A gorgeous piece of rare art has been added to your collection!' 
                  : 'A brand new unique card has been added to your binder!'}
              </p>
            </div>

            <button
              onClick={handleContinueCardUnlock}
              className="btn btn-primary"
              style={{ width: '100%', cursor: 'pointer' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* NEW ACTRESS UNLOCKED POPUP */}
      {unlockedActresses.length > 0 && (
        <div className="game-modal-overlay" onClick={() => setUnlockedActresses([])}>
          <div className="glass-card unlock-modal fade-in-up" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="unlock-badge-container">
              <Award className="unlock-award-icon text-yellow" size={48} />
            </div>

            <h3 className="unlock-modal-title">
              {unlockedActresses.length > 1 ? 'New Actresses Unlocked!' : 'New Actress Unlocked!'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {unlockedActresses.map(actress => (
                <div key={actress.id} className="unlock-actress-card">
                  <img
                    src={actress.profile_picture}
                    alt={actress.name}
                    className="unlock-actress-img"
                  />
                  <div className="unlock-actress-info">
                    <h4>{actress.name}</h4>
                    <p className="unlock-actress-bio">
                      {actress.bio || 'A mysterious new muse has joined your catalog.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setUnlockedActresses([])}
              className="btn btn-primary"
              style={{ width: '100%', cursor: 'pointer' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
