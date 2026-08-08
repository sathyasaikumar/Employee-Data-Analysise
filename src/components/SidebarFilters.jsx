import React from 'react';
import { Filter, RotateCcw, Search, CheckSquare } from 'lucide-react';

export default function SidebarFilters({ 
  headers, 
  schema, 
  stats, 
  filters, 
  onFilterChange, 
  onResetFilters 
}) {
  const categoricalHeaders = headers.filter(h => schema[h] === 'categorical');
  const numericHeaders = headers.filter(h => schema[h] === 'numeric');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Filter size={18} className="text-blue-400" />
          <span>Interactive Filters</span>
        </div>
        <button 
          className="btn btn-outline" 
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
          onClick={onResetFilters}
          title="Reset all filters"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Global Search */}
      <div className="filter-group">
        <label className="filter-label">Global Text Search</label>
        <div style={{ position: 'relative' }}>
          <input 
            type="text"
            className="filter-input"
            placeholder="Search keywords..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Categorical Filters */}
      {categoricalHeaders.map(header => {
        const categories = stats[header]?.frequencies ? Object.keys(stats[header].frequencies) : [];
        if (categories.length === 0 || categories.length > 30) return null;

        const selectedValues = filters.categorical?.[header] || [];

        return (
          <div className="filter-group" key={header}>
            <label className="filter-label">{header}</label>
            <div className="checkbox-group">
              {categories.map(cat => {
                const isChecked = selectedValues.includes(cat);
                return (
                  <label className="checkbox-label" key={cat}>
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
                    <span>{cat}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      ({stats[header].frequencies[cat]})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Numeric Range Filters with Level Presets */}
      {numericHeaders.map(header => {
        const stat = stats[header];
        if (!stat) return null;

        const currentRange = filters.numeric?.[header] || [stat.min, stat.max];
        const span = stat.max - stat.min;

        // Calculate thresholds
        const lowMax = Math.round(stat.min + span * 0.33);
        const medMax = Math.round(stat.min + span * 0.67);

        // Helper to check active level
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
          <div className="filter-group" key={header}>
            <div className="filter-label-row">
              <label className="filter-label">{header} Range</label>
            </div>

            {/* Quick Level Presets (Low, Medium, High) */}
            <div className="level-presets-flex">
              <button
                type="button"
                className={`level-btn level-low ${isLow ? 'active' : ''}`}
                onClick={() => setRange(stat.min, lowMax)}
                title={`Filter Low Range (${stat.min} - ${lowMax})`}
              >
                Low
              </button>

              <button
                type="button"
                className={`level-btn level-med ${isMed ? 'active' : ''}`}
                onClick={() => setRange(lowMax, medMax)}
                title={`Filter Medium Range (${lowMax} - ${medMax})`}
              >
                Medium
              </button>

              <button
                type="button"
                className={`level-btn level-high ${isHigh ? 'active' : ''}`}
                onClick={() => setRange(medMax, stat.max)}
                title={`Filter High Range (${medMax} - ${stat.max})`}
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

            <div className="range-inputs">
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
          </div>
        );
      })}
    </aside>
  );
}
