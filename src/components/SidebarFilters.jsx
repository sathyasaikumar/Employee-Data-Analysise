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

      {/* Numeric Range Filters */}
      {numericHeaders.map(header => {
        const stat = stats[header];
        if (!stat) return null;

        const currentRange = filters.numeric?.[header] || [stat.min, stat.max];

        return (
          <div className="filter-group" key={header}>
            <label className="filter-label">{header} Range</label>
            <div className="range-inputs">
              <input 
                type="number"
                className="filter-input"
                value={currentRange[0]}
                min={stat.min}
                max={stat.max}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFilterChange('numeric', {
                    ...filters.numeric,
                    [header]: [val, currentRange[1]]
                  });
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
                  onFilterChange('numeric', {
                    ...filters.numeric,
                    [header]: [currentRange[0], val]
                  });
                }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
}
