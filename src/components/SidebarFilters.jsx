import React, { useState } from 'react';
import { Filter, RotateCcw, Search, CheckSquare, X, ChevronDown, ChevronRight, SlidersHorizontal, Sparkles, Upload, Database, Check } from 'lucide-react';
import HDScreenshotButton from './HDScreenshotButton';

export default function SidebarFilters({ 
  headers = [], 
  schema = {}, 
  stats = {}, 
  filters = {}, 
  onFilterChange, 
  onResetFilters,
  isMobileOpen,
  onCloseMobile,
  datasetName = 'Dataset_Analytics',
  theme = 'dark',
  onUploadClick,
  totalRows = 0,
  hasData = true
}) {
  const [categorySearch, setCategorySearch] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    const initial = {};
    const catHeaders = headers.filter(h => schema[h] === 'categorical');
    catHeaders.forEach((h, idx) => {
      if (idx >= 2) {
        initial[h] = true;
      }
    });
    return initial;
  });

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
      {/* 📁 UPLOAD DATASET BUTTON */}
      <div className="sidebar-upload-container">
        <button
          type="button"
          className="sidebar-quick-upload-btn"
          onClick={onUploadClick}
          title="Upload CSV, Excel, or JSON Dataset"
        >
          <Upload size={13} className="sidebar-upload-icon" />
          <span className="upload-btn-label">Upload Dataset</span>
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="sidebar-header" style={{ paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
        <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-bright)', fontFamily: 'Arial, sans-serif' }}>
          <SlidersHorizontal size={15} className="text-blue-400" />
          <span>Filter Options</span>
          {activeFilterCount > 0 && (
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.2)', 
              color: '#fbbf24', 
              fontSize: '0.65rem', 
              padding: '0.1rem 0.4rem', 
              borderRadius: '8px',
              fontWeight: 800 
            }}>
              {activeFilterCount} Active
            </span>
          )}
        </div>

        <div className="sidebar-header-actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {/* HD Screenshot Option Near Filter Option */}
          <HDScreenshotButton
            compact={true}
            datasetName={datasetName}
            theme={theme}
          />

          {activeFilterCount > 0 && (
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', color: 'var(--accent-rose)', borderColor: 'rgba(239,68,68,0.3)', borderRadius: '4px' }} 
              onClick={onResetFilters}
              title="Reset all filter options"
            >
              <RotateCcw size={11} /> Clear
            </button>
          )}
          {onCloseMobile && (
            <button
              className="btn btn-secondary mobile-filter-close-btn"
              onClick={onCloseMobile}
              title="Close filter panel"
              aria-label="Close filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Global Text Search */}
      <div className="filter-group" style={{ marginBottom: '0.85rem' }}>
        <label className="filter-label" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem', display: 'block', fontFamily: 'Arial, sans-serif' }}>
          Global Text Search
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="filter-input"
            placeholder="Search keywords across all rows..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            style={{ paddingLeft: '1.9rem', fontSize: '0.72rem', height: '28px', borderRadius: '5px' }}
          />
          {filters.search && (
            <button 
              onClick={() => onFilterChange('search', '')}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={13} />
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
          <div className="filter-group" key={header} style={{ marginBottom: '0.85rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: '0.3rem' 
              }}
              onClick={() => toggleGroupCollapse(header)}
            >
              <label className="filter-label" style={{ cursor: 'pointer', margin: 0, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Arial, sans-serif' }}>
                {header}
                {selectedValues.length > 0 && (
                  <span style={{ color: 'var(--accent-blue)', marginLeft: '0.3rem', fontSize: '0.68rem' }}>
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
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    title={`Clear selections in ${header}`}
                  >
                    Clear
                  </button>
                )}
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
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
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.70rem',
                      height: '26px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '5px',
                      color: 'var(--text-bright)',
                      marginBottom: '0.35rem',
                      boxSizing: 'border-box'
                    }}
                  />
                )}

                <div className="checkbox-group" style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                  {/* Select All Checkbox Row */}
                  <label className="checkbox-label select-all-row" style={{ fontSize: '0.72rem', padding: '0.2rem 0', borderBottom: '1px dashed var(--border-color)', marginBottom: '0.2rem', fontWeight: 800, fontFamily: 'Arial, sans-serif' }}>
                    <input 
                      type="checkbox"
                      checked={selectedValues.length === categories.length && categories.length > 0}
                      onChange={(e) => {
                        onFilterChange('categorical', {
                          ...filters.categorical,
                          [header]: e.target.checked ? [...categories] : []
                        });
                      }}
                    />
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>Select All</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 'auto', fontWeight: 800 }}>
                      ({categories.length})
                    </span>
                  </label>

                  {filteredCategories.map(cat => {
                    const isChecked = selectedValues.includes(cat);
                    return (
                      <label className="checkbox-label" key={cat} style={{ fontSize: '0.72rem', padding: '0.2rem 0', fontFamily: 'Arial, sans-serif' }}>
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
                        <span style={{ color: isChecked ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: isChecked ? 700 : 400 }}>
                          {cat}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
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
          <div className="filter-group" key={header} style={{ marginBottom: '0.85rem' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.3rem' }}
              onClick={() => toggleGroupCollapse(header)}
            >
              <label className="filter-label" style={{ cursor: 'pointer', margin: 0, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Arial, sans-serif' }}>
                {header} Range
                {!isAll && (
                  <span style={{ color: 'var(--accent-amber)', marginLeft: '0.3rem', fontSize: '0.68rem' }}>
                    (Filtered)
                  </span>
                )}
              </label>

              {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </div>

            {!isCollapsed && (
              <>
                {/* Level Presets */}
                <div className="level-presets-flex" style={{ marginBottom: '0.45rem' }}>
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
                    style={{ fontSize: '0.72rem', height: '26px', padding: '0.2rem 0.45rem', borderRadius: '5px' }}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRange(val, currentRange[1]);
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>-</span>
                  <input 
                    type="number"
                    className="filter-input"
                    value={currentRange[1]}
                    min={stat.min}
                    max={stat.max}
                    style={{ fontSize: '0.72rem', height: '26px', padding: '0.2rem 0.45rem', borderRadius: '5px' }}
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
