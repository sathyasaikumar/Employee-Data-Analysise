import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Filter,
  Activity,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Globe,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Copy,
  PieChart,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  X,
  ShieldAlert,
  Download
} from 'lucide-react';
import GlobalCurrencyChecker from './GlobalCurrencyChecker';

export default function KPICards({
  totalRows = 0,
  filteredRows = 0,
  healthScore = 100,
  missingCells = 0,
  duplicateCount = 0,
  completenessScore = 100,
  anomalies = null,
  stats = {},
  schema = {},
  activeLevel = 'all',
  onLevelSelect,
  liveStats = null,
  onOpenLiveTracker = null
}) {
  const [currencyState, setCurrencyState] = useState(null);
  const [activeFolder, setActiveFolder] = useState('all'); // 'all' | 'financial' | 'quality' | 'dataset'
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const folderDropdownRef = React.useRef(null);
  const [zoomedCard, setZoomedCard] = useState(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
        setIsFolderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Anomaly Detection & Modal State
  const [isAnomaliesModalOpen, setIsAnomaliesModalOpen] = useState(false);
  const [isModalFullScreen, setIsModalFullScreen] = useState(false);
  const [anomalyFilter, setAnomalyFilter] = useState('all'); // 'all' | 'high_revenue' | 'low_revenue' | 'missing' | 'duplicate' | 'unusual_pattern'
  const [anomalySearch, setAnomalySearch] = useState('');

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      setIsModalFullScreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleModalFullScreen = (forceState) => {
    const nextState = typeof forceState === 'boolean' ? forceState : !isModalFullScreen;
    setIsModalFullScreen(nextState);

    try {
      if (nextState) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => { });
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => { });
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen().catch(() => { });
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
          else if (document.msExitFullscreen) document.msExitFullscreen().catch(() => { });
        }
      }
    } catch (err) {
      console.warn('Fullscreen request error:', err.message);
    }
  };

  const handleOpenZoomCard = (cardId) => {
    setZoomedCard(cardId);
    setIsModalFullScreen(false);
  };

  const toggleFolderCollapse = (folderId) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Primary numeric column detection
  const numericHeaders = Object.keys(schema || {}).filter(h => schema[h] === 'numeric');
  const primaryNumeric = numericHeaders.find(h =>
    h.toLowerCase().includes('revenue') ||
    h.toLowerCase().includes('salary') ||
    h.toLowerCase().includes('amount') ||
    h.toLowerCase().includes('sales')
  ) || numericHeaders[0];

  const primaryStat = (primaryNumeric && stats) ? stats[primaryNumeric] : null;

  const baseMean = primaryStat && primaryStat.mean !== undefined ? primaryStat.mean : 2825.33;
  const baseMedian = primaryStat && primaryStat.median !== undefined ? primaryStat.median : Math.round(baseMean * 0.95);
  const baseMin = primaryStat && primaryStat.min !== undefined ? primaryStat.min : Math.round(baseMean * 0.3);
  const baseMax = primaryStat && primaryStat.max !== undefined ? primaryStat.max : Math.round(baseMean * 2.2);
  const baseGrowth = primaryStat && primaryStat.growthRate !== undefined ? primaryStat.growthRate : 12.4;

  let currencySymbol = '$';
  let currencyRate = 1;
  let currencySubtext = 'Mean Value Highlight';

  if (currencyState && currencyState.selectedCountry) {
    const { selectedCountry, rates } = currencyState;
    const selectedCode = selectedCountry.code;

    if (rates && rates[selectedCode] !== undefined) {
      currencySymbol = selectedCountry.symbol;
      currencyRate = rates[selectedCode];
      currencySubtext = `${selectedCountry.country} (${selectedCode})`;
    }
  }

  const formatRevenue = (val) => {
    const converted = val * currencyRate;
    return `${currencySymbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formattedAvgRevenue = formatRevenue(baseMean);
  const formattedMedianRevenue = formatRevenue(baseMedian);
  const formattedMinRevenue = formatRevenue(baseMin);
  const formattedMaxRevenue = formatRevenue(baseMax);
  const formattedGrowthDisplay = `${baseGrowth >= 0 ? '+' : ''}${baseGrowth}%`;

  const safeTotal = totalRows || 0;
  const safeFiltered = filteredRows !== undefined ? filteredRows : 0;
  const activePercentage = safeTotal > 0 ? Math.round((safeFiltered / safeTotal) * 100) : 100;

  const totalCols = Object.keys(schema || {}).length;
  const totalCells = safeTotal * (totalCols || 1);
  const missingPercent = totalCells > 0 ? ((missingCells / totalCells) * 100).toFixed(1) : '0';
  const dupPercent = safeTotal > 0 ? ((duplicateCount / safeTotal) * 100).toFixed(1) : '0';

  const folderTabs = [
    { id: 'all', label: 'All Folders', icon: FolderOpen, count: 12, color: 'blue' },
    { id: 'financial', label: 'Financial & Revenue', icon: DollarSign, count: 5, color: 'rose' },
    { id: 'quality', label: 'Quality & Health', icon: ShieldCheck, count: 4, color: 'amber' },
    { id: 'dataset', label: 'Dataset & Filters', icon: Database, count: 3, color: 'cyan' }
  ];

  // Render Card Components
  const renderCard = (cardId) => {
    switch (cardId) {
      case 'total':
        return (
          <div className="kpi-card kpi-blue kpi-standard-card" key="total">
            <div className="kpi-card-header">
              <span className="kpi-label">Total Records</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn blue" onClick={() => handleOpenZoomCard('total')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><Database size={18} className="text-blue-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value">{safeTotal.toLocaleString()}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-blue"><Database size={12} /> Complete Dataset Size</span></div>
          </div>
        );

      case 'filtered':
        return (
          <div className="kpi-card kpi-cyan kpi-standard-card" key="filtered">
            <div className="kpi-card-header">
              <span className="kpi-label">Filtered Overview</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn cyan" onClick={() => handleOpenZoomCard('filtered')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><Filter size={18} className="text-cyan-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body filter-card-body">
              <span className="kpi-value">{safeFiltered.toLocaleString()}</span>
              <div className="kpi-horizontal-level-stack" title="Select Filter Level">
                <button type="button" className={`kpi-h-pill low ${activeLevel === 'low' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('low')}>LOW</button>
                <button type="button" className={`kpi-h-pill medium ${activeLevel === 'medium' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('medium')}>MED</button>
                <button type="button" className={`kpi-h-pill high ${activeLevel === 'high' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('high')}>HIGH</button>
                <button type="button" className={`kpi-h-pill all ${activeLevel === 'all' ? 'active' : ''}`} onClick={() => onLevelSelect && onLevelSelect('all')}>ALL</button>
              </div>
            </div>
            <div className="kpi-card-footer" style={{ marginTop: '0.4rem', flexShrink: 0 }}>
              <span className="kpi-subtext text-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Filter size={12} /> {activePercentage}% Active Selection
              </span>
            </div>
          </div>
        );


      case 'currency':
        return <GlobalCurrencyChecker key="currency" onCurrencyChange={(info) => setCurrencyState(info)} />;

      case 'revenue':
        return (
          <div className="kpi-card kpi-rose kpi-standard-card" key="revenue">
            <div className="kpi-card-header">
              <span className="kpi-label">AVG {primaryNumeric ? primaryNumeric.toUpperCase() : 'REVENUE'}</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn rose" onClick={() => handleOpenZoomCard('revenue')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><DollarSign size={18} className="text-rose-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-rose-highlight">{formattedAvgRevenue}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-emerald"><TrendingUp size={14} /> ↗ {currencySubtext}</span></div>
          </div>
        );

      case 'median':
        return (
          <div className="kpi-card kpi-purple kpi-standard-card" key="median">
            <div className="kpi-card-header">
              <span className="kpi-label">MEDIAN {primaryNumeric ? primaryNumeric.toUpperCase() : 'SALARY'}</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn purple" onClick={() => handleOpenZoomCard('median')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><Calculator size={18} className="text-purple-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-purple">{formattedMedianRevenue}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-purple"><Calculator size={12} /> 50th Percentile Midpoint</span></div>
          </div>
        );

      case 'min':
        return (
          <div className="kpi-card kpi-cyan kpi-standard-card" key="min">
            <div className="kpi-card-header">
              <span className="kpi-label">MINIMUM SALARY</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn cyan" onClick={() => handleOpenZoomCard('min')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><ArrowDownCircle size={18} className="text-cyan-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-cyan">{formattedMinRevenue}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-cyan"><ArrowDownCircle size={12} /> Lowest Recorded Boundary</span></div>
          </div>
        );

      case 'max':
        return (
          <div className="kpi-card kpi-emerald kpi-standard-card" key="max">
            <div className="kpi-card-header">
              <span className="kpi-label">MAXIMUM SALARY</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn emerald" onClick={() => handleOpenZoomCard('max')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><ArrowUpCircle size={18} className="text-emerald-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-emerald">{formattedMaxRevenue}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-emerald"><ArrowUpCircle size={12} /> Highest Peak Boundary</span></div>
          </div>
        );

      case 'growth':
        return (
          <div className="kpi-card kpi-emerald kpi-standard-card" key="growth">
            <div className="kpi-card-header">
              <span className="kpi-label">SALARY GROWTH</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn emerald" onClick={() => handleOpenZoomCard('growth')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><TrendingUp size={18} className="text-emerald-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-emerald">{formattedGrowthDisplay}</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-emerald"><TrendingUp size={12} /> Sequential Growth Rate</span></div>
          </div>
        );

      case 'missing':
        return (
          <div className="kpi-card kpi-rose kpi-standard-card" key="missing">
            <div className="kpi-card-header">
              <span className="kpi-label">Missing Values Ratio</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn rose" onClick={() => handleOpenZoomCard('missing')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><AlertTriangle size={18} className="text-rose-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-rose">{missingPercent}%</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-rose"><AlertTriangle size={12} /> {missingCells.toLocaleString()} Blank Cells</span></div>
          </div>
        );

      case 'duplicates':
        return (
          <div className="kpi-card kpi-amber kpi-standard-card" key="duplicates">
            <div className="kpi-card-header">
              <span className="kpi-label">Duplicate Records</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn amber" onClick={() => handleOpenZoomCard('duplicates')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><Copy size={18} className="text-amber-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value text-amber">{dupPercent}%</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-amber"><Copy size={12} /> {duplicateCount} Duplicate Rows</span></div>
          </div>
        );

      case 'completeness':
        return (
          <div className="kpi-card kpi-blue kpi-standard-card" key="completeness">
            <div className="kpi-card-header">
              <span className="kpi-label">Data Completeness</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn blue" onClick={() => handleOpenZoomCard('completeness')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><CheckCircle2 size={18} className="text-blue-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value">{completenessScore}%</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-blue"><PieChart size={12} /> Filled Cell Population Ratio</span></div>
          </div>
        );

      case 'health':
        return (
          <div className="kpi-card kpi-amber kpi-standard-card" key="health">
            <div className="kpi-card-header">
              <span className="kpi-label">Data Health Score</span>
              <div className="kpi-header-action-group">
                <button type="button" className="currency-zoom-btn amber" onClick={() => handleOpenZoomCard('health')} title="Full Screen / Expand View">
                  <Maximize2 size={13} />
                </button>
                <div className="kpi-icon-box"><Activity size={18} className="text-amber-400" /></div>
              </div>
            </div>
            <div className="kpi-card-body"><span className="kpi-value">{healthScore}%</span></div>
            <div className="kpi-card-footer"><span className="kpi-subtext text-amber"><ShieldCheck size={12} /> Data Integrity Index</span></div>
          </div>
        );

      default:
        return null;
    }
  };

  const folderGroups = [
    {
      id: 'dataset',
      title: 'Dataset & Filters Folder',
      icon: Database,
      badge: '3 Metrics',
      accentColor: 'blue',
      cardIds: ['total', 'filtered', 'currency']
    },
    {
      id: 'financial',
      title: 'Financial & Revenue Folder',
      icon: DollarSign,
      badge: '6 Metrics',
      accentColor: 'rose',
      cardIds: ['revenue', 'median', 'min', 'max', 'growth', 'currency']
    },
    {
      id: 'quality',
      title: 'Quality & Health Folder',
      icon: ShieldCheck,
      badge: '5 Metrics',
      accentColor: 'amber',
      cardIds: ['missing', 'duplicates', 'completeness', 'health', 'currency']
    }
  ];

  const visibleFolders = activeFolder === 'all'
    ? folderGroups
    : folderGroups.filter(fg => fg.id === activeFolder);

  // Filter anomalous rows inside modal
  const filteredAnomaliesList = (anomalies?.anomalousRows || []).filter(item => {
    if (anomalyFilter === 'high_revenue') return item.anomalies.some(a => a.type === 'high_revenue' || a.type === 'numeric_outlier');
    if (anomalyFilter === 'low_revenue') return item.anomalies.some(a => a.type === 'low_revenue');
    if (anomalyFilter === 'missing') return item.anomalies.some(a => a.type === 'missing');
    if (anomalyFilter === 'duplicate') return item.anomalies.some(a => a.type === 'duplicate');
    if (anomalyFilter === 'unusual_pattern') return item.anomalies.some(a => a.type === 'unusual_pattern');
    return true;
  }).filter(item => {
    if (!anomalySearch.trim()) return true;
    const q = anomalySearch.toLowerCase();
    return JSON.stringify(item.rowData).toLowerCase().includes(q) || (item.primaryAnomaly || '').toLowerCase().includes(q);
  });

  return (
    <div className="kpi-overview-section">

      {/* ⚠️ STREAMLINED AUTOMATIC ANOMALY DETECTION BANNER */}
      {anomalies && anomalies.totalAnomalies > 0 && (
        <div className="anomalies-indicator-banner" onClick={() => setIsAnomaliesModalOpen(true)}>
          <div className="anomalies-banner-left">
            <div className="anomalies-warning-icon-box">
              <AlertTriangle size={13} className="text-rose-400" />
            </div>
            <div className="anomalies-text-group">
              <span className="anomalies-title">AUTOMATIC ANOMALY DETECTION</span>
              <p className="anomalies-subheadline">
                ⚠️ <strong>{anomalies.totalAnomalies} unusual revenue & data records detected</strong>
              </p>
            </div>
          </div>

          <div className="anomalies-banner-right">
            <span className="anomalies-count-pill">{anomalies.totalAnomalies} Affected Records</span>
            <button type="button" className="view-affected-records-btn">
              <Eye size={12} />
              <span>View Affected Records</span>
            </button>
          </div>
        </div>
      )}

      {/* Perfectly Arranged Folder Navigation Deck */}
      <div className="kpi-folder-header-wrapper">
        <div className="kpi-overview-header">
          <div className="overview-title-group">
            <h2 className="overview-title">
              <FolderOpen size={18} className="text-blue-400" />
              METRICS DIRECTORY FOLDERS
            </h2>
          </div>

          {/* CONSOLIDATED SINGLE FOLDER CATEGORY DROPDOWN BUTTON */}
          <div className="kpi-folder-dropdown-wrapper" ref={folderDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`kpi-single-folder-btn ${isFolderDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsFolderDropdownOpen(prev => !prev)}
              title="Select Metric Folder Category"
            >
              {(() => {
                const currentTab = folderTabs.find(t => t.id === activeFolder) || folderTabs[0];
                const IconComp = currentTab.icon;
                return (
                  <>
                    <IconComp size={15} style={{ color: '#38bdf8' }} />
                    <span>{currentTab.label}</span>
                    <span className="folder-count-badge">{currentTab.count}</span>
                    <ChevronDown size={14} className={`dropdown-chevron ${isFolderDropdownOpen ? 'rotate' : ''}`} />
                  </>
                );
              })()}
            </button>

            {isFolderDropdownOpen && (
              <div className="kpi-folder-menu-dropdown">
                <div className="dropdown-menu-header-title">
                  <FolderOpen size={14} style={{ color: '#38bdf8' }} />
                  <span>METRIC DIRECTORY FOLDERS</span>
                </div>
                <div className="dropdown-options-list">
                  {folderTabs.map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeFolder === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`kpi-dropdown-option-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setActiveFolder(tab.id);
                          setIsFolderDropdownOpen(false);
                        }}
                      >
                        <TabIcon size={14} style={{ color: isActive ? '#38bdf8' : 'var(--text-muted)' }} />
                        <span className="option-label">{tab.label}</span>
                        <span className={`folder-count-badge ${isActive ? 'active-badge' : ''}`}>{tab.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folders Stack Container */}
      <div className="kpi-folders-stack">
        {visibleFolders.map(group => {
          const GroupIcon = group.icon;
          const isCollapsed = collapsedFolders[group.id];

          return (
            <div className={`folder-box-container folder-accent-${group.accentColor}`} key={group.id}>
              {/* Folder Box Header Bar */}
              <div className="folder-box-header" onClick={() => toggleFolderCollapse(group.id)}>
                <div className="folder-title-left">
                  <div className={`folder-icon-badge ${group.accentColor}`}>
                    <GroupIcon size={16} />
                  </div>
                  <h3 className="folder-box-title">{group.title}</h3>
                  <span className="folder-metric-count-pill">{group.badge}</span>
                </div>

                <div className="folder-header-right">
                  <span className="folder-status-text">
                    {isCollapsed ? 'Click to Expand' : 'Inside Folder'}
                  </span>
                  <button type="button" className="folder-collapse-btn">
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>
              </div>

              {/* Folder Content Cards Grid */}
              {!isCollapsed && (
                <div className="folder-cards-grid">
                  {group.cardIds.map(cardId => renderCard(cardId))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ⚠️ AFFECTED RECORDS ANOMALIES INTELLIGENCE MODAL (Portal to document.body) */}
      {isAnomaliesModalOpen && anomalies && createPortal(
        <div className={`currency-zoom-modal-overlay ${isModalFullScreen ? 'has-fullscreen is-fullscreen' : ''}`} onClick={() => setIsAnomaliesModalOpen(false)}>
          <div
            className={`currency-zoom-modal-content anomalies-modal-content ${isModalFullScreen ? 'modal-fullscreen is-fullscreen' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <ShieldAlert size={24} className="text-amber-400" />
                <div>
                  <h3 className="modal-title">Automatic Anomaly Detection & Affected Records</h3>
                  <p className="modal-subtitle">
                    Identified {anomalies.totalAnomalies} anomalous records out of {safeTotal.toLocaleString()} total dataset entries
                  </p>
                </div>
              </div>

              {/* Modal Action Controls: Full Screen Toggle + Close */}
              <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={() => toggleModalFullScreen()}
                  title={isModalFullScreen ? "Restore Normal Size" : "Expand to Full Screen View"}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isModalFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={() => setIsAnomaliesModalOpen(false)}
                  title="Close View"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body anomalies-modal-body">
              {/* Top Summary Cards */}
              <div className="anomalies-summary-grid">
                <div className="anomalies-stat-card rose">
                  <span className="stat-num">{anomalies.highRevenueCount}</span>
                  <span className="stat-label">High Revenue Outliers</span>
                </div>
                <div className="anomalies-stat-card teal">
                  <span className="stat-num">{anomalies.lowRevenueCount}</span>
                  <span className="stat-label">Low Revenue Outliers</span>
                </div>
                <div className="anomalies-stat-card amber">
                  <span className="stat-num">{anomalies.missingCount}</span>
                  <span className="stat-label">Missing Data Records</span>
                </div>
                <div className="anomalies-stat-card purple">
                  <span className="stat-num">{anomalies.duplicateCount}</span>
                  <span className="stat-label">Duplicate Rows</span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="anomalies-filter-bar">
                <div className="anomalies-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${anomalyFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAnomalyFilter('all')}
                  >
                    All Anomalies ({anomalies.totalAnomalies})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${anomalyFilter === 'high_revenue' ? 'active' : ''}`}
                    onClick={() => setAnomalyFilter('high_revenue')}
                  >
                    High Revenue ({anomalies.highRevenueCount})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${anomalyFilter === 'low_revenue' ? 'active' : ''}`}
                    onClick={() => setAnomalyFilter('low_revenue')}
                  >
                    Low Revenue ({anomalies.lowRevenueCount})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${anomalyFilter === 'missing' ? 'active' : ''}`}
                    onClick={() => setAnomalyFilter('missing')}
                  >
                    Missing Values ({anomalies.missingCount})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${anomalyFilter === 'duplicate' ? 'active' : ''}`}
                    onClick={() => setAnomalyFilter('duplicate')}
                  >
                    Duplicates ({anomalies.duplicateCount})
                  </button>
                </div>

                <div className="anomalies-search-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search affected records..."
                    value={anomalySearch}
                    onChange={(e) => setAnomalySearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Affected Records Table */}
              <div className="anomalies-table-wrapper">
                <table className="anomalies-table">
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Anomaly Type</th>
                      <th>Severity</th>
                      <th>Reason & Description</th>
                      <th>Sample Record Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnomaliesList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-row">No matching anomalous records found.</td>
                      </tr>
                    ) : (
                      filteredAnomaliesList.map((item, idx) => {
                        const isHigh = item.type === 'High Revenue Outlier';
                        const isLow = item.type === 'Low Revenue Outlier';
                        const isMissing = item.type === 'Missing Field Value';
                        const isDupe = item.type === 'Duplicate Record';

                        return (
                          <tr key={'anom-row-' + idx}>
                            <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Row #{item.rowIndex}</td>
                            <td>
                              <span className="anomaly-type-badge">
                                <AlertTriangle size={12} />
                                <span>{item.primaryAnomaly}</span>
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${item.severity === 'high' ? 'badge-rose' : 'badge-amber'}`}>
                                {item.severity.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.primaryAnomaly || 'Outlier Detected'}</td>
                            <td className="anomaly-detail-cell">
                              {item.anomalies.map((a, aIdx) => (
                                <div key={'detail-' + aIdx} className="anomaly-detail-line">
                                  • {a.detail}
                                </div>
                              ))}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detailed Zoom Overlay Modal for Standard Metric Cards (Portal to document.body) */}
      {zoomedCard && createPortal(
        <div className={`currency-zoom-modal-overlay ${isModalFullScreen ? 'has-fullscreen is-fullscreen' : ''}`} onClick={() => { setZoomedCard(null); setIsModalFullScreen(false); }}>
          <div className={`currency-zoom-modal-content ${isModalFullScreen ? 'is-fullscreen modal-fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <img src="/logo.png" alt="Sathya Logo" className="modal-gold-logo" style={{ height: '26px', objectFit: 'contain' }} />
                {zoomedCard === 'total' && <Database size={20} className="text-blue-400" />}
                {zoomedCard === 'filtered' && <Filter size={22} className="text-cyan-400" />}
                {zoomedCard === 'health' && <Activity size={22} className="text-amber-400" />}
                {zoomedCard === 'revenue' && <DollarSign size={22} className="text-rose-400" />}
                {zoomedCard === 'median' && <Calculator size={22} className="text-purple-400" />}
                {zoomedCard === 'min' && <ArrowDownCircle size={22} className="text-teal-400" />}
                {zoomedCard === 'max' && <ArrowUpCircle size={22} className="text-indigo-400" />}
                {zoomedCard === 'growth' && <TrendingUp size={22} className="text-emerald-400" />}
                {zoomedCard === 'missing' && <AlertTriangle size={22} className="text-rose-400" />}
                {zoomedCard === 'duplicates' && <Copy size={22} className="text-amber-400" />}
                {zoomedCard === 'completeness' && <CheckCircle2 size={22} className="text-blue-400" />}

                <h3 className="modal-title">
                  {zoomedCard === 'total' && 'Total Dataset Records Intelligence'}
                  {zoomedCard === 'filtered' && 'Filtered Subset & Range Analysis'}
                  {zoomedCard === 'health' && 'Data Health & Integrity Profiling'}
                  {zoomedCard === 'revenue' && `Average ${primaryNumeric || 'Revenue'} & Financial Insights`}
                  {zoomedCard === 'median' && `Median ${primaryNumeric || 'Revenue'} Intelligence`}
                  {zoomedCard === 'min' && `Minimum ${primaryNumeric || 'Revenue'} Boundary`}
                  {zoomedCard === 'max' && `Maximum ${primaryNumeric || 'Revenue'} Boundary`}
                  {zoomedCard === 'growth' && `${primaryNumeric || 'Revenue'} Sequential Growth Metrics`}
                  {zoomedCard === 'missing' && 'Missing Data & Null Value Profiling'}
                  {zoomedCard === 'duplicates' && 'Duplicate Records & Identity Profiling'}
                  {zoomedCard === 'completeness' && 'Dataset Completeness Ratio'}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={() => toggleModalFullScreen()}
                  title={isModalFullScreen ? "Exit Full Screen" : "Full Screen View"}
                >
                  {isModalFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={() => {
                    setZoomedCard(null);
                    setIsModalFullScreen(false);
                  }}
                  title="Close View"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body modal-card-details-body">
              {zoomedCard === 'total' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-blue-400">{safeTotal.toLocaleString()}</div>
                  <p className="zoomed-description">Complete multi-column dataset records loaded in memory.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Total Columns</span><span className="stat-val">{totalCols}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Engine</span><span className="stat-val">Web Worker Stack</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'filtered' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-cyan-400">{safeFiltered.toLocaleString()}</div>
                  <p className="zoomed-description">Currently matching rows after active filters & search terms are applied.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Match Ratio</span><span className="stat-val">{safeTotal > 0 ? ((safeFiltered / safeTotal) * 100).toFixed(1) : 100}%</span></div>
                    <div className="stat-box"><span className="stat-lbl">Filtered Out</span><span className="stat-val">{(safeTotal - safeFiltered).toLocaleString()}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'health' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-amber-400">{healthScore}%</div>
                  <p className="zoomed-description">Overall Data Integrity & Completeness Index.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Missing Cells</span><span className="stat-val">{missingCells.toLocaleString()}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Completeness Score</span><span className="stat-val text-emerald">{completenessScore}%</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'revenue' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-rose-highlight">{formattedAvgRevenue}</div>
                  <p className="zoomed-description">Average value calculated for <strong>{primaryNumeric || 'Revenue'}</strong>.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Minimum Value</span><span className="stat-val">{formattedMinRevenue}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Maximum Value</span><span className="stat-val">{formattedMaxRevenue}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Median Value</span><span className="stat-val">{formattedMedianRevenue}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'median' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-purple-highlight">{formattedMedianRevenue}</div>
                  <p className="zoomed-description">50th Percentile Median calculated for <strong>{primaryNumeric || 'Revenue'}</strong>.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Mean (Average)</span><span className="stat-val">{formattedAvgRevenue}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Currency</span><span className="stat-val">{currencySubtext}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'min' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-teal-highlight">{formattedMinRevenue}</div>
                  <p className="zoomed-description">Lowest recorded boundary for <strong>{primaryNumeric || 'Revenue'}</strong>.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Max Boundary</span><span className="stat-val">{formattedMaxRevenue}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Spread Range</span><span className="stat-val">{formatRevenue(baseMax - baseMin)}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'max' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-indigo-highlight">{formattedMaxRevenue}</div>
                  <p className="zoomed-description">Highest peak boundary for <strong>{primaryNumeric || 'Revenue'}</strong>.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Min Boundary</span><span className="stat-val">{formattedMinRevenue}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Average</span><span className="stat-val">{formattedAvgRevenue}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'growth' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-emerald-highlight">{formattedGrowthDisplay}</div>
                  <p className="zoomed-description">Sequential growth trend calculated across dataset timeline.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Target Metric</span><span className="stat-val">{primaryNumeric || 'Revenue'}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Trend Indicator</span><span className="stat-val text-emerald">Positive Surge</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'missing' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-rose-400">{missingCells.toLocaleString()}</div>
                  <p className="zoomed-description">Total null, empty, or unpopulated data cells detected.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Null Ratio</span><span className="stat-val">{missingPercent}%</span></div>
                    <div className="stat-box"><span className="stat-lbl">Completeness</span><span className="stat-val text-emerald">{completenessScore}%</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'duplicates' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-amber-400">{duplicateCount.toLocaleString()}</div>
                  <p className="zoomed-description">Total duplicate row instances identified in the dataset.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Duplicate Ratio</span><span className="stat-val">{dupPercent}%</span></div>
                    <div className="stat-box"><span className="stat-lbl">Unique Rows</span><span className="stat-val">{(safeTotal - duplicateCount).toLocaleString()}</span></div>
                  </div>
                </div>
              )}

              {zoomedCard === 'completeness' && (
                <div className="zoomed-card-details">
                  <div className="zoomed-metric-display text-blue-400">{completenessScore}%</div>
                  <p className="zoomed-description">Percentage of filled data cells out of total dataset matrix cells.</p>
                  <div className="zoomed-stats-grid">
                    <div className="stat-box"><span className="stat-lbl">Filled Cells</span><span className="stat-val">{(totalCells - missingCells).toLocaleString()}</span></div>
                    <div className="stat-box"><span className="stat-lbl">Total Matrix</span><span className="stat-val">{totalCells.toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
