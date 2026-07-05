import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, X, ChevronDown } from 'lucide-react';

export default function ActressMultiSelect({ actresses = [], selectedIds = [], onChange, placeholder = "Select Featured Actresses" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleActress = (id) => {
    const isSelected = selectedIds.includes(id);
    let newSelected;
    if (isSelected) {
      newSelected = selectedIds.filter(selectedId => selectedId !== id);
    } else {
      newSelected = [...selectedIds, id];
    }
    onChange(newSelected);
  };

  const handleDeselect = (e, id) => {
    e.stopPropagation();
    const newSelected = selectedIds.filter(selectedId => selectedId !== id);
    onChange(newSelected);
  };

  // Filter actresses based on search query
  const filteredActresses = actresses.filter(actress =>
    actress.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredActresses.length > 0 && filteredActresses.every(actress =>
    selectedIds.includes(actress.id)
  );

  const handleSelectAll = () => {
    let newSelected;
    if (isAllSelected) {
      // Deselect all filtered actresses
      const filteredIds = filteredActresses.map(a => a.id);
      newSelected = selectedIds.filter(id => !filteredIds.includes(id));
    } else {
      // Select all filtered actresses
      const filteredIds = filteredActresses.map(a => a.id);
      newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
    }
    onChange(newSelected);
  };

  // Get selected actress objects for the pill display
  const selectedActresses = actresses.filter(actress => selectedIds.includes(actress.id));

  return (
    <div className="actress-multiselect-container" ref={containerRef}>
      {/* Selected Pills / Trigger area */}
      <div 
        className={`actress-multiselect-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedActresses.length === 0 ? (
          <span className="multiselect-placeholder">{placeholder}</span>
        ) : (
          <div className="selected-actresses-pills">
            {selectedActresses.map(act => (
              <div 
                key={act.id} 
                className="selected-actress-pill"
                onClick={(e) => e.stopPropagation()} // Prevent toggling dropdown when clicking pill
              >
                <img 
                  src={act.profile_picture || '/logo.svg'} 
                  alt={act.name} 
                  className="pill-avatar" 
                />
                <span className="pill-name">{act.name}</span>
                <button 
                  type="button" 
                  className="pill-close-btn"
                  onClick={(e) => handleDeselect(e, act.id)}
                  aria-label={`Deselect ${act.name}`}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ChevronDown size={16} className={`trigger-chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="actress-multiselect-dropdown fade-in-slide">
          {/* Search box */}
          <div className="dropdown-search-box">
            <Search size={14} className="dropdown-search-icon" />
            <input
              type="text"
              className="dropdown-search-input"
              placeholder="Search Actresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Select All */}
          {filteredActresses.length > 0 && (
            <div 
              className="dropdown-select-all" 
              onClick={handleSelectAll}
            >
              <div className={`dropdown-checkbox ${isAllSelected ? 'checked' : ''}`}>
                {isAllSelected && <Check size={12} />}
              </div>
              <span className="select-all-text">Select All</span>
            </div>
          )}

          {/* List of actresses */}
          <div className="dropdown-actress-list">
            {filteredActresses.length === 0 ? (
              <div className="dropdown-empty-state">No actresses found</div>
            ) : (
              filteredActresses.map(actress => {
                const isSelected = selectedIds.includes(actress.id);
                return (
                  <div
                    key={actress.id}
                    className={`dropdown-actress-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleActress(actress.id)}
                  >
                    <img 
                      src={actress.profile_picture || '/logo.svg'} 
                      alt={actress.name} 
                      className="item-avatar" 
                    />
                    <span className="item-name">{actress.name}</span>
                    <div className={`dropdown-circle-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
