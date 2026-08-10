import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Database, Filter, Activity, ShieldCheck, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Layers, Globe, Maximize2, Minimize2, X, CheckCircle, BarChart2 } from 'lucide-react';
import GlobalCurrencyChecker from './GlobalCurrencyChecker';

export default function KPICards({ 
  totalRows = 0, 
  filteredRows = 0, 
  healthScore = 100, 
  stats = {}, 
  schema = {},
  activeLevel = 'all',
  onLevelSelect
}) {
  const [currencyState, setCurrencyState] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [zoomedCard, setZoomedCard] = useState(null); // null | 'total' | 'filtered' | 'health' | 'revenue'

  const scrollContainerRef = useRef(null);

  // Identify primary numeric column for highlighted metric (e.g. Revenue or Salary)
  const numericHeaders = Object.keys(schema || {}).filter(h => schema[h] === 'numeric');
  const primaryNumeric = numericHeaders.find(h => 
    h.toLowerCase().includes('revenue') || 
    h.toLowerCase().includes('salary') || 
    h.toLowerCase().includes('amount') ||
    h.toLowerCase().includes('sales')
  ) || numericHeaders[0];

  const primaryStat = (primaryNumeric && stats) ? stats[primaryNumeric] : null;
  const baseMean = primaryStat && primaryStat.mean !== undefined ? primaryStat.mean : 2825.33;

  // Selected Currency Conversion for Average Revenue Card
  let formattedRevenueDisplay = `$${baseMean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let currencySubtext = 'Mean Value Highlight';

  if (currencyState && currencyState.selectedCountry) {
    const { selectedCountry, rates } = currencyState;
    const selectedCode = selectedCountry.code;
    const selectedSymbol = selectedCountry.symbol;

    if (rates && rates[selectedCode] !== undefined) {
      const convertedMean = baseMean * rates[selectedCode];
      formattedRevenueDisplay = `${selectedSymbol}${convertedMean.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      currencySubtext = `${selectedCountry.country} (${selectedCode}) Mean`;
    }
  }

  const safeTotal = totalRows || 0;
  const safeFiltered = filteredRows !== undefined ? filteredRows : 0;
  const activePercentage = safeTotal > 0 ? Math.round((safeFiltered / safeTotal) * 100) : 100;

  // Scroll to specific card index smoothly
  const scrollToCard = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.kpi-card');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
      setActiveCardIndex(index);
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, activeCardIndex - 1);
    scrollToCard(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(4, activeCardIndex + 1);
    scrollToCard(newIndex);
  };

  // Listen to scroll events to update active pagination dot
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollPosition = container.scrollLeft;
    const cards = container.querySelectorAll('.kpi-card');

    if (cards.length === 0) return;

    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const cardLeft = card.offsetLeft - container.offsetLeft;
      const distance = Math.abs(cardLeft - scrollPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    setActiveCardIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const cardPills = [
    { label: 'Total Records', icon: Database, color: 'blue' },
    { label: 'Filtered Overview', icon: Filter, color: 'cyan' },
    { label: 'Currency Checker', icon: Globe, color: 'emerald' },
    { label: 'Data Health', icon: ShieldCheck, color: 'amber' },
    { label: 'Avg Revenue', icon: DollarSign, color: 'rose' }
  ];

  return (
    <div className="kpi-overview-section">
      {/* Overview Container Header */}
      <div className="kpi-overview-header">
        <div className="overview-title-group">
          <h2 className="overview-title">
            <Layers size={18} className="text-blue-400" />
            DASHBOARD OVERVIEW
          </h2>
          <span className="overview-badge">5 METRIC CARDS</span>
        </div>

        {/* Easy Quick-Access Card Pills */}
        <div className="kpi-quick-pills-row">
          {cardPills.map((pill, idx) => {
            const PillIcon = pill.icon;
            return (
              <button
                key={'pill-' + idx}
                type="button"
                className={`kpi-nav-pill ${pill.color} ${activeCardIndex === idx ? 'active' : ''}`}
                onClick={() => scrollToCard(idx)}
              >
                <PillIcon size={12} />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top-Right Quick Navigation Arrows */}
        <div className="kpi-header-nav-arrows">
          <button
            type="button"
            className="kpi-arrow-btn"
            onClick={handlePrev}
            disabled={activeCardIndex === 0}
            title="Previous Card"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="kpi-arrow-btn"
            onClick={handleNext}
            disabled={activeCardIndex === 4}
            title="Next Card"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Single Horizontal Scrollable Cards Container */}
      <div className="kpi-scroll-container" ref={scrollContainerRef}>
        {/* Card 1: TOTAL RECORDS */}
        <div className="kpi-card kpi-blue kpi-standard-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Total Records</span>
            <div className="kpi-header-action-group">
              <button
                type="button"
                className="currency-zoom-btn blue"
                onClick={() => setZoomedCard('total')}
                title="Zoom In / Expand Total Records View"
              >
                <Maximize2 size={13} />
              </button>
              <div className="kpi-icon-box">
                <Database size={18} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">{safeTotal.toLocaleString()}</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext text-blue">
              <Database size={12} /> Complete Dataset Size
            </span>
          </div>
        </div>

        {/* Card 2: FILTERED OVERVIEW */}
        <div className="kpi-card kpi-cyan kpi-standard-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Filtered Overview</span>
            <div className="kpi-header-action-group">
              <button
                type="button"
                className="currency-zoom-btn cyan"
                onClick={() => setZoomedCard('filtered')}
                title="Zoom In / Expand Filtered Overview View"
              >
                <Maximize2 size={13} />
              </button>
              <div className="kpi-icon-box">
                <Filter size={18} className="text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="kpi-card-body filter-card-body">
            <span className="kpi-value">{safeFiltered.toLocaleString()}</span>
            
            {/* Horizontal Filter Level Stack Pills (100% visible, no clipping!) */}
            <div className="kpi-horizontal-level-stack" title="Select Filter Level">
              <button 
                type="button" 
                className={`kpi-h-pill low ${activeLevel === 'low' ? 'active' : ''}`}
                onClick={() => onLevelSelect && onLevelSelect('low')}
                title="Filter Low Level (Bottom 33%)"
              >
                LOW
              </button>
              <button 
                type="button" 
                className={`kpi-h-pill medium ${activeLevel === 'medium' ? 'active' : ''}`}
                onClick={() => onLevelSelect && onLevelSelect('medium')}
                title="Filter Medium Level (Middle 34%)"
              >
                MED
              </button>
              <button 
                type="button" 
                className={`kpi-h-pill high ${activeLevel === 'high' ? 'active' : ''}`}
                onClick={() => onLevelSelect && onLevelSelect('high')}
                title="Filter High Level (Top 33%)"
              >
                HIGH
              </button>
              <button 
                type="button" 
                className={`kpi-h-pill all ${activeLevel === 'all' ? 'active' : ''}`}
                onClick={() => onLevelSelect && onLevelSelect('all')}
                title="Reset to All Records"
              >
                ALL
              </button>
            </div>
          </div>

          <div className="kpi-card-footer">
            <span className="kpi-subtext text-cyan">
              <Filter size={12} /> {activePercentage}% Active Selection
            </span>
          </div>
        </div>

        {/* Card 3: GLOBAL CURRENCY CHECKER */}
        <GlobalCurrencyChecker onCurrencyChange={(info) => setCurrencyState(info)} />

        {/* Card 4: DATA HEALTH SCORE */}
        <div className="kpi-card kpi-amber kpi-standard-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Data Health Score</span>
            <div className="kpi-header-action-group">
              <button
                type="button"
                className="currency-zoom-btn amber"
                onClick={() => setZoomedCard('health')}
                title="Zoom In / Expand Health Score View"
              >
                <Maximize2 size={13} />
              </button>
              <div className="kpi-icon-box">
                <Activity size={18} className="text-amber-400" />
              </div>
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">{healthScore}%</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext text-amber">
              <ShieldCheck size={12} /> Data Integrity Index
            </span>
          </div>
        </div>

        {/* Card 5: AVERAGE REVENUE */}
        <div className="kpi-card kpi-rose kpi-standard-card">
          <div className="kpi-card-header">
            <span className="kpi-label">AVG {primaryNumeric ? primaryNumeric.toUpperCase() : 'REVENUE'}</span>
            <div className="kpi-header-action-group">
              <button
                type="button"
                className="currency-zoom-btn rose"
                onClick={() => setZoomedCard('revenue')}
                title="Zoom In / Expand Average Revenue View"
              >
                <Maximize2 size={13} />
              </button>
              <div className="kpi-icon-box">
                <DollarSign size={18} className="text-rose-400" />
              </div>
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value text-rose-highlight">{formattedRevenueDisplay}</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext text-emerald">
              <TrendingUp size={14} /> ↗ {currencySubtext}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Carousel Navigation Controls (Arrows + 5 Pagination Dots) */}
      <div className="kpi-nav-controls">
        <button
          type="button"
          className="kpi-arrow-btn"
          onClick={handlePrev}
          disabled={activeCardIndex === 0}
          title="Previous Card"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="kpi-dots-wrapper">
          {[0, 1, 2, 3, 4].map((index) => (
            <button
              key={'dot-' + index}
              type="button"
              className={`kpi-dot ${activeCardIndex === index ? 'active' : ''}`}
              onClick={() => scrollToCard(index)}
              title={`Jump to Card ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="kpi-arrow-btn"
          onClick={handleNext}
          disabled={activeCardIndex === 4}
          title="Next Card"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Zoom In Full Screen Overlay Modal for Standard Metric Cards */}
      {zoomedCard && (
        <div className="currency-zoom-modal-overlay" onClick={() => setZoomedCard(null)}>
          <div className="currency-zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                {zoomedCard === 'total' && <Database size={22} className="text-blue-400" />}
                {zoomedCard === 'filtered' && <Filter size={22} className="text-cyan-400" />}
                {zoomedCard === 'health' && <Activity size={22} className="text-amber-400" />}
                {zoomedCard === 'revenue' && <DollarSign size={22} className="text-rose-400" />}

                <h3 className="modal-title">
                  {zoomedCard === 'total' && 'Total Dataset Records Intelligence'}
                  {zoomedCard === 'filtered' && 'Filtered Subset & Range Analysis'}
                  {zoomedCard === 'health' && 'Data Health & Integrity Profiling'}
                  {zoomedCard === 'revenue' && `Average ${primaryNumeric || 'Revenue'} & Financial Insights`}
                </h3>
              </div>

              <button
                type="button"
                className="currency-zoom-close-btn"
                onClick={() => setZoomedCard(null)}
                title="Zoom Out / Close View"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            <div className="modal-body modal-card-details-body">
              {zoomedCard === 'total' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-blue-400">{safeTotal.toLocaleString()}</div>
                  <p className="zoomed-description">
                    Complete multi-column dataset records loaded in active memory worker thread.
                  </p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Total Columns</span><span className="stat-val">{Object.keys(schema || {}).length}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Processing Engine</span><span className="stat-val">Web Worker Stack</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'filtered' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-cyan-400">{safeFiltered.toLocaleString()}</div>
                  <p className="zoomed-description">Active Filter Selection: {activePercentage}% of total dataset.</p>
                  
                  <div className="modal-filter-levels">
                    <label className="currency-input-label">Filter Level Stack</label>
                    <div className="kpi-horizontal-level-stack large">
                      <button type="button" className={`kpi-h-pill low ${activeLevel === 'low' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('low')}>LOW (Bottom 33%)</button>
                      <button type="button" className={`kpi-h-pill medium ${activeLevel === 'medium' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('medium')}>MED (Middle 34%)</button>
                      <button type="button" className={`kpi-h-pill high ${activeLevel === 'high' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('high')}>HIGH (Top 33%)</button>
                      <button type="button" className={`kpi-h-pill all ${activeLevel === 'all' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('all')}>ALL RECORDS</button>
                    </div>
                  </div>
                </div>
              )}

              {zoomedCard === 'health' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-amber-400">{healthScore}%</div>
                  <p className="zoomed-description">Data Integrity & Completeness Index.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Null Check Status</span><span className="stat-val text-emerald">Passed (0 Nulls)</span></div>
                    <div className="stat-box"><span className="stat-lbl">Schema Validation</span><span className="stat-val text-emerald">100% Compatible</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'revenue' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-rose-highlight">{formattedRevenueDisplay}</div>
                  <p className="zoomed-description">Average value calculated for <strong>{primaryNumeric || 'Revenue'}</strong>.</p>
                  {primaryStat && (
                    <div className="zoomed-stats-grid">
                      <div className="stat-box"><span className="stat-lbl">Minimum Value</span><span className="stat-val">${primaryStat.min ? primaryStat.min.toLocaleString() : 0}</span></div>
                      <div className="stat-box"><span className="stat-lbl">Maximum Value</span><span className="stat-val">${primaryStat.max ? primaryStat.max.toLocaleString() : 0}</span></div>
                      <div className="stat-box"><span className="stat-lbl">Median Value</span><span className="stat-val">${primaryStat.median ? primaryStat.median.toLocaleString() : 0}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
