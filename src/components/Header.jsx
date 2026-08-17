import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3, Upload, Download, Layers, LogIn, LogOut, ShieldCheck, Sun, Moon,
  ArrowLeft, Menu, X, Database, Filter, Radio, Maximize2, Minimize2,
  Folder, ChevronDown, Sparkles, Cpu, Zap, Brain, BookOpen
} from 'lucide-react';

export default function Header({
  hasData,
  hasPreviousDataset,
  isUploadMode,
  isHistoryMode,
  isLiveUsersMode,
  isSidebarOpen = true,
  onToggleSidebar,
  isFiltered = false,
  datasetName,
  onUploadClick,
  onHistoryClick,
  onLiveUsersClick,
  savedDatasetsCount = 0,
  liveUsersCount = 0,
  onLoadSample,
  onResetData,
  onBackToDashboard,
  onExportCSV,
  currentUser,
  onOpenLogin,
  onOpenProfile,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  onOpenAutoML,
  onOpenDLExecutive,
  onOpenDLStudio
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppFullScreen, setIsAppFullScreen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const folderRef = useRef(null);

  // Sync fullscreen state with browser events (handles ESC key and browser toggles)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsAppFullScreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Close folder menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (folderRef.current && !folderRef.current.contains(event.target)) {
        setIsFolderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAppFullScreen = () => {
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFs) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch((err) => console.warn('Fullscreen request failed:', err));
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch((err) => console.warn('Exit fullscreen failed:', err));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('App Fullscreen error:', err.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <img src="/logo.png" alt="Sathya Logo" className="brand-gold-logo" />
        <div className="brand-text-container">
          <h1 className="brand-title">Corporate Access & Intelligence</h1>
          <p className="brand-subtitle">Enterprise Workforce & Data Analytics</p>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Back button when in upload mode, history mode, or live users mode */}
        {(isUploadMode || isHistoryMode || isLiveUsersMode || !hasData) && hasPreviousDataset && (
          <button
            type="button"
            className="btn btn-secondary btn-back-unique"
            onClick={() => {
              onBackToDashboard();
              closeMobileMenu();
            }}
            title="Return back to active dataset dashboard"
          >
            <ArrowLeft size={12} />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* Loaded Dataset Badge */}
        {hasData && !isUploadMode && !isHistoryMode && !isLiveUsersMode && (
          <div className="header-pill-item header-dataset-badge-container">
            <span className="badge badge-blue header-dataset-badge" title={datasetName || 'Loaded Dataset'}>
              <Layers size={13} className="folder-icon flex-shrink-0" />
              <span className="truncate-text">{(datasetName || 'Loaded Dataset').replace(/\.[^/.]+$/, '').toUpperCase()}</span>
            </span>
          </div>
        )}

        {/* UNIQUE ADVANCED FOLDER-LIKE AUTOML ENGINE BUTTON */}
        <div className="header-pill-item automl-folder-btn-container">
          <button
            id="header-btn-automl"
            type="button"
            className="btn header-folder-btn automl-header-folder-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenAutoML) onOpenAutoML();
              closeMobileMenu();
            }}
            title="Open AI-Powered AutoML Model Selection & Prediction Platform"
            aria-label="Open AI-Powered AutoML Model Selection & Prediction Platform"
          >
            <Folder size={13} className="folder-icon text-cyan-400" />
            <span>AutoML Engine</span>
            <span className="automl-folder-ai-pill">
              <Zap size={7.5} className="inline mr-0.5" /> AI
            </span>
          </button>
        </div>

        {/* UNIQUE ADVANCED FOLDER-LIKE DEEP LEARNING PROJECT ANALYSIS STUDIO BUTTON */}
        <div className="header-pill-item dl-studio-btn-container">
          <button
            id="header-btn-dl-studio"
            type="button"
            className="btn header-folder-btn dl-studio-header-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenDLStudio) onOpenDLStudio();
              closeMobileMenu();
            }}
            title="Open Deep Learning Project Analysis Studio (Real-Time Dataset Analysis, Training & Experimentation)"
            aria-label="Open Deep Learning Project Analysis Studio"
          >
            <Folder size={13} className="folder-icon text-violet-400" />
            <span>DL Studio</span>
            <span className="automl-folder-ai-pill dl-studio-ai-pill">
              <Brain size={7.5} className="inline mr-0.5 text-white" /> DEEP
            </span>
          </button>
        </div>

        {/* CONSOLIDATED TOOLS FOLDER DROPDOWN MENU NEAR LOGOUT */}
        <div className="header-pill-item folder-menu-container" ref={folderRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`btn header-folder-btn ${isFolderOpen ? 'active' : ''}`}
            onClick={() => setIsFolderOpen(prev => !prev)}
            title="Open System Tools & Actions Folder"
          >
            <Folder size={13} className="folder-icon" />
            <span>System Folder</span>
            <ChevronDown size={12} className={`folder-chevron ${isFolderOpen ? 'rotate' : ''}`} />
          </button>

          {/* Folder Dropdown Content */}
          {isFolderOpen && (
            <div className="folder-dropdown-menu">
              <div className="folder-dropdown-header">
                <div className="folder-header-title">
                  <Folder size={13} style={{ color: '#6366f1' }} />
                  <span>System Folder</span>
                </div>
                <span className="folder-header-sub">System Tools & Dataset Management</span>
              </div>

              {/* Data & Storage Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">DATASET MANAGEMENT</div>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    if (hasData) onResetData(); else onUploadClick();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Upload size={13} style={{ color: '#38bdf8' }} />
                  <div className="folder-item-text">
                    <span className="item-title">Upload Dataset</span>
                    <span className="item-desc">CSV, Excel, or JSON files</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`folder-item-btn ${isHistoryMode ? 'active' : ''}`}
                  onClick={() => {
                    if (onHistoryClick) onHistoryClick();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Database size={13} style={{ color: '#06b6d4' }} />
                  <div className="folder-item-text">
                    <span className="item-title">Dataset History</span>
                    <span className="item-desc">Stored server files</span>
                  </div>
                  {savedDatasetsCount > 0 && (
                    <span className="folder-item-badge">{savedDatasetsCount}</span>
                  )}
                </button>

                {hasData && (
                  <button
                    type="button"
                    className="folder-item-btn"
                    onClick={() => {
                      onExportCSV();
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <Download size={13} style={{ color: '#10b981' }} />
                    <div className="folder-item-text">
                      <span className="item-title">Export Filtered CSV</span>
                      <span className="item-desc">Download active processed data</span>
                    </div>
                  </button>
                )}

                <div className="folder-demo-selector-group">
                  <div className="demo-group-label">
                    <Sparkles size={11} style={{ color: '#fb923c' }} />
                    <span>Load Demo Dataset</span>
                  </div>
                  <div className="demo-btn-row">
                    <button
                      type="button"
                      className="demo-chip-btn"
                      onClick={() => {
                        onLoadSample('workforce');
                        setIsFolderOpen(false);
                        closeMobileMenu();
                      }}
                    >
                      Workforce Demo
                    </button>
                    <button
                      type="button"
                      className="demo-chip-btn"
                      onClick={() => {
                        onLoadSample('sales');
                        setIsFolderOpen(false);
                        closeMobileMenu();
                      }}
                    >
                      Sales Demo
                    </button>
                  </div>
                </div>
              </div>

              {/* System & Analytics Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">AI & DEEP LEARNING INTELLIGENCE</div>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    if (onOpenDLStudio) onOpenDLStudio();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Sparkles size={13} style={{ color: '#a855f7' }} />
                  <div className="folder-item-text">
                    <span className="item-title">DL Project Analysis Studio</span>
                    <span className="item-desc">Real-time deep learning pipeline & simulator</span>
                  </div>
                  <span className="folder-item-badge purple">PRO</span>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    if (onOpenDLExecutive) onOpenDLExecutive();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Brain size={13} style={{ color: '#c084fc' }} />
                  <div className="folder-item-text">
                    <span className="item-title">DL Architecture & Summary</span>
                    <span className="item-desc">Executive guide, matrix & checklists</span>
                  </div>
                  <span className="folder-item-badge purple">DOCS</span>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    if (onOpenAutoML) onOpenAutoML();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Cpu size={13} style={{ color: '#38bdf8' }} />
                  <div className="folder-item-text">
                    <span className="item-title">AutoML Studio</span>
                    <span className="item-desc">Interactive model training & SHAP</span>
                  </div>
                  <span className="folder-item-badge cyan">AI</span>
                </button>
              </div>

              {/* System & Monitoring Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">SYSTEM & MONITORING</div>

                <button
                  type="button"
                  className={`folder-item-btn ${isLiveUsersMode ? 'active' : ''}`}
                  onClick={() => {
                    if (onLiveUsersClick) onLiveUsersClick();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Radio size={13} style={{ color: '#10b981' }} className="animate-pulse" />
                  <div className="folder-item-text">
                    <span className="item-title">Live Website Users</span>
                    <span className="item-desc">Real-time active connections</span>
                  </div>
                  <span className="folder-item-badge green">{liveUsersCount}</span>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    onToggleTheme();
                    setIsFolderOpen(false);
                  }}
                >
                  {theme === 'dark' ? <Sun size={13} style={{ color: '#f59e0b' }} /> : <Moon size={13} style={{ color: '#6366f1' }} />}
                  <div className="folder-item-text">
                    <span className="item-title">Switch Theme</span>
                    <span className="item-desc">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    toggleAppFullScreen();
                    setIsFolderOpen(false);
                  }}
                >
                  {isAppFullScreen ? <Minimize2 size={13} style={{ color: '#10b981' }} /> : <Maximize2 size={13} style={{ color: '#10b981' }} />}
                  <div className="folder-item-text">
                    <span className="item-title">{isAppFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
                    <span className="item-desc">Toggle display mode</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="user-auth-wrapper">
          {currentUser ? (
            <div className="user-profile-badge" title="Click to View Personal Profile & Login Activity System">
              <div
                className="user-avatar-trigger"
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  closeMobileMenu();
                }}
              >
                <div className="user-avatar">
                  {currentUser.photo ? (
                    <img 
                      src={currentUser.photo} 
                      alt={currentUser.name} 
                      className="header-user-avatar-img" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.header-avatar-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="header-avatar-fallback"
                    style={{ 
                      display: currentUser.photo ? 'none' : 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {currentUser.avatar || 'US'}
                  </span>
                </div>

                <div className="user-info">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-role-badge">
                    <ShieldCheck size={12} className="inline mr-1 text-emerald" />
                    {currentUser.role || 'Authorized User'}
                  </span>
                </div>
              </div>

              <button
                className="logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                  closeMobileMenu();
                }}
                title="Logout of current session"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary login-trigger-btn"
              onClick={() => {
                onOpenLogin();
                closeMobileMenu();
              }}
            >
              <LogIn size={16} /> Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

