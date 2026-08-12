import React, { useState } from 'react';
import { Filter, RotateCcw, Search, CheckSquare, X, ChevronDown, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function SidebarFilters({ 
  headers = [], 
  schema = {}, 
  stats = {}, 
  filters = {}, 
  onFilterChange, 
  onResetFilters,
  isMobileOpen,
  onCloseMobile
}) {
  const [categorySearch, setCategorySearch] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const categoricalHeaders = headers.filter(h => schema[h] === 'categorical');
  const numericHeaders = headers.filter(h => schema[h] === 'numeric');

  const toggleGroupCollapse = (header) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [header]: !prev[header]
    }));
  };

  // Calculate active filter count
  let activeFilterCount = 0;
  if (filters.search) activeFilterCount++;
  if (filters.categorical) {
    Object.values(filters.categorical).forEach(arr => {
      if (arr && arr.length > 0) activeFilterCount += arr.length;
    });
  }
  if (filters.numeric) {
    Object.keys(filters.numeric).forEach(h => {
      const range = filters.numeric[h];
      const stat = stats[h];
      if (range && stat && (range[0] !== stat.min || range[1] !== stat.max)) {
        activeFilterCount++;
      }
    });
  }

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header" style={{ paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
        <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-bright)' }}>
          <SlidersHorizontal size={18} className="text-blue-400" />
          <span>Filter Options</span>
          {activeFilterCount > 0 && (
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.2)', 
              color: '#fbbf24', 
              fontSize: '0.75rem', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '10px',
              fontWeight: 700 
            }}>
              {activeFilterCount} Active
            </span>
          )}
        </div>

        <div className="sidebar-header-actions" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {activeFilterCount > 0 && (
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-rose)', borderColor: 'rgba(239,68,68,0.3)' }} 
              onClick={onResetFilters}
              title="Reset all filter options"
            >
              <RotateCcw size={12} /> Clear All
            </button>
          )}
          {onCloseMobile && (
            <button
              className="btn btn-secondary mobile-filter-close-btn"
              onClick={onCloseMobile}
              title="Close filter panel"
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Global Text Search */}
      <div className="filter-group" style={{ marginBottom: '1.25rem' }}>
        <label className="filter-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
          Global Text Search
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="filter-input"
            placeholder="Search keywords across all rows..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          {filters.search && (
            <button 
              onClick={() => onFilterChange('search', '')}
              style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categorical Column Filters */}
      {categoricalHeaders.map(header => {
        const freqMap = stats[header]?.frequencies || {};
        const categories = Object.keys(freqMap);
        if (categories.length === 0 || categories.length > 50) return null;

        const isCollapsed = collapsedGroups[header];
        const selectedValues = filters.categorical?.[header] || [];
        const searchTerm = (categorySearch[header] || '').toLowerCase();

        const filteredCategories = categories.filter(cat => 
          cat.toLowerCase().includes(searchTerm)
        );

        return (
          <div className="filter-group" key={header} style={{ marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: '0.4rem' 
              }}
              onClick={() => toggleGroupCollapse(header)}
            >
              <label className="filter-label" style={{ cursor: 'pointer', margin: 0 }}>
                {header}
                {selectedValues.length > 0 && (
                  <span style={{ color: 'var(--accent-blue)', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                    ({selectedValues.length})
                  </span>
                )}
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {selectedValues.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFilterChange('categorical', {
                        ...filters.categorical,
                        [header]: []
                      });
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear
                  </button>
                )}
                {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              </div>
            </div>

            {!isCollapsed && (
              <>
                {categories.length > 6 && (
                  <input
                    type="text"
                    placeholder={`Filter ${header}...`}
                    value={categorySearch[header] || ''}
                    onChange={(e) => setCategorySearch({ ...categorySearch, [header]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-bright)',
                      marginBottom: '0.4rem'
                    }}
                  />
                )}

                <div className="checkbox-group" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                  {filteredCategories.map(cat => {
                    const isChecked = selectedValues.includes(cat);
                    return (
                      <label className="checkbox-label" key={cat} style={{ fontSize: '0.8rem', padding: '0.25rem 0' }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newCatValues = e.target.checked
                              ? [...selectedValues, cat]
                              : selectedValues.filter(val => val !== cat);
                            
                            onFilterChange('categorical', {
                              ...filters.categorical,
                              [header]: newCatValues
                            });
                          }}
                        />
                        <span style={{ color: isChecked ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: isChecked ? 600 : 400 }}>
                          {cat}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                          ({freqMap[cat]})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Numeric Range Filters with Level Presets */}
      {numericHeaders.map(header => {
        const stat = stats[header];
        if (!stat) return null;

        const isCollapsed = collapsedGroups[header];
        const currentRange = filters.numeric?.[header] || [stat.min, stat.max];
        const span = stat.max - stat.min;

        const lowMax = Math.round(stat.min + span * 0.33);
        const medMax = Math.round(stat.min + span * 0.67);

        const isLow = currentRange[0] === stat.min && currentRange[1] === lowMax;
        const isMed = currentRange[0] === lowMax && currentRange[1] === medMax;
        const isHigh = currentRange[0] === medMax && currentRange[1] === stat.max;
        const isAll = currentRange[0] === stat.min && currentRange[1] === stat.max;

        const setRange = (minVal, maxVal) => {
          onFilterChange('numeric', {
            ...filters.numeric,
            [header]: [minVal, maxVal]
          });
        };

        return (
          <div className="filter-group" key={header} style={{ marginBottom: '1.25rem' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.4rem' }}
              onClick={() => toggleGroupCollapse(header)}
            >
              <label className="filter-label" style={{ cursor: 'pointer', margin: 0 }}>
                {header} Range
                {!isAll && (
                  <span style={{ color: 'var(--accent-amber)', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                    (Filtered)
                  </span>
                )}
              </label>

              {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            </div>

            {!isCollapsed && (
              <>
                {/* Level Presets */}
                <div className="level-presets-flex" style={{ marginBottom: '0.6rem' }}>
                  <button
                    type="button"
                    className={`level-btn level-low ${isLow ? 'active' : ''}`}
                    onClick={() => setRange(stat.min, lowMax)}
                    title={`Low Range (${stat.min} - ${lowMax})`}
                  >
                    Low
                  </button>

                  <button
                    type="button"
                    className={`level-btn level-med ${isMed ? 'active' : ''}`}
                    onClick={() => setRange(lowMax, medMax)}
                    title={`Medium Range (${lowMax} - ${medMax})`}
                  >
                    Med
                  </button>

                  <button
                    type="button"
                    className={`level-btn level-high ${isHigh ? 'active' : ''}`}
                    onClick={() => setRange(medMax, stat.max)}
                    title={`High Range (${medMax} - ${stat.max})`}
                  >
                    High
                  </button>

                  <button
                    type="button"
                    className={`level-btn level-all ${isAll ? 'active' : ''}`}
                    onClick={() => setRange(stat.min, stat.max)}
                    title="Reset to full range"
                  >
                    All
                  </button>
                </div>

                <div className="range-inputs" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input 
                    type="number"
                    className="filter-input"
                    value={currentRange[0]}
                    min={stat.min}
                    max={stat.max}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRange(val, currentRange[1]);
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                  <input 
                    type="number"
                    className="filter-input"
                    value={currentRange[1]}
                    min={stat.min}
                    max={stat.max}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRange(currentRange[0], val);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </aside>
  );
}
