import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, X, ChevronDown } from 'lucide-react';

export default function CategoryMultiSelect({ categories = [], selectedIds = [], onChange, placeholder = "Select Categories" }) {
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

  const handleToggleCategory = (id) => {
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

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredCategories.length > 0 && filteredCategories.every(category =>
    selectedIds.includes(category.id)
  );

  const handleSelectAll = () => {
    let newSelected;
    if (isAllSelected) {
      // Deselect all filtered categories
      const filteredIds = filteredCategories.map(c => c.id);
      newSelected = selectedIds.filter(id => !filteredIds.includes(id));
    } else {
      // Select all filtered categories
      const filteredIds = filteredCategories.map(c => c.id);
      newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
    }
    onChange(newSelected);
  };

  // Get selected category objects for the pill display
  const selectedCategories = categories.filter(category => selectedIds.includes(category.id));

  return (
    <div className="category-multiselect-container" ref={containerRef}>
      {/* Selected Pills / Trigger area */}
      <div 
        className={`category-multiselect-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCategories.length === 0 ? (
          <span className="multiselect-placeholder">{placeholder}</span>
        ) : (
          <div className="selected-categories-pills">
            {selectedCategories.map(cat => (
              <div 
                key={cat.id} 
                className="selected-category-pill"
                onClick={(e) => e.stopPropagation()} // Prevent toggling dropdown when clicking pill
              >
                <span className="pill-name">{cat.name}</span>
                <button 
                  type="button" 
                  className="pill-close-btn"
                  onClick={(e) => handleDeselect(e, cat.id)}
                  aria-label={`Deselect ${cat.name}`}
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
        <div className="category-multiselect-dropdown fade-in-slide">
          {/* Search box */}
          <div className="dropdown-search-box">
            <Search size={14} className="dropdown-search-icon" />
            <input
              type="text"
              className="dropdown-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Select All */}
          {filteredCategories.length > 0 && (
            <div 
              className="dropdown-select-all-row" 
              onClick={handleSelectAll}
            >
              <div className={`dropdown-square-checkbox ${isAllSelected ? 'checked' : ''}`}>
                {isAllSelected && <Check size={12} />}
              </div>
              <span className="select-all-text">Select all</span>
            </div>
          )}

          {/* List of categories */}
          <div className="dropdown-category-list">
            {filteredCategories.length === 0 ? (
              <div className="dropdown-empty-state">No categories found</div>
            ) : (
              filteredCategories.map(cat => {
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`dropdown-category-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleCategory(cat.id)}
                  >
                    <div className={`dropdown-square-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <span className="item-name">{cat.name}</span>
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
