import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3, Upload, Download, Layers, LogIn, LogOut, ShieldCheck, Sun, Moon,
  ArrowLeft, Menu, X, Database, Filter, Radio, Maximize2, Minimize2,
  Folder, ChevronDown, Sparkles, Cpu, Zap
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
  onOpenAutoML
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppFullScreen, setIsAppFullScreen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const folderRef = useRef(null);

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
    const nextState = !isAppFullScreen;
    setIsAppFullScreen(nextState);
    try {
      if (nextState) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => { });
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => { });
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen().catch(() => { });
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => { });
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
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* Loaded Dataset Badge */}
        {hasData && !isUploadMode && !isHistoryMode && !isLiveUsersMode && (
          <span className="badge badge-blue header-dataset-badge">
            <Layers size={12} className="mr-1 inline flex-shrink-0" />
            <span className="truncate-text">{datasetName || 'Loaded Dataset'}</span>
          </span>
        )}

        {/* UNIQUE ADVANCED FOLDER-LIKE AUTOML ENGINE BUTTON */}
        <div className="automl-folder-btn-container">
          <button
            type="button"
            className="btn header-folder-btn automl-header-folder-btn"
            onClick={() => {
              if (onOpenAutoML) onOpenAutoML();
              closeMobileMenu();
            }}
            title="Open AI-Powered AutoML Model Selection & Prediction Platform"
          >
            <Folder size={18} className="folder-icon text-cyan-400" />
            <span>AutoML Engine</span>
            <span className="automl-folder-ai-pill">
              <Zap size={9} className="inline mr-0.5" /> AI
            </span>
          </button>
        </div>

        {/* CONSOLIDATED TOOLS FOLDER DROPDOWN MENU NEAR LOGOUT */}
        <div className="folder-menu-container" ref={folderRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`btn header-folder-btn ${isFolderOpen ? 'active' : ''}`}
            onClick={() => setIsFolderOpen(prev => !prev)}
            title="Open System Tools & Actions Folder"
          >
            <Folder size={18} className="folder-icon" />
            <span>System Folder</span>
            <ChevronDown size={14} className={`folder-chevron ${isFolderOpen ? 'rotate' : ''}`} />
          </button>

          {/* Folder Dropdown Content */}
          {isFolderOpen && (
            <div className="folder-dropdown-menu">
              <div className="folder-dropdown-header">
                <div className="folder-header-title">
                  <Folder size={16} style={{ color: '#6366f1' }} />
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
                  <Upload size={16} style={{ color: '#38bdf8' }} />
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
                  <Database size={16} style={{ color: '#06b6d4' }} />
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
                    <Download size={16} style={{ color: '#10b981' }} />
                    <div className="folder-item-text">
                      <span className="item-title">Export Filtered CSV</span>
                      <span className="item-desc">Download active processed data</span>
                    </div>
                  </button>
                )}

                <div className="folder-demo-selector-group">
                  <div className="demo-group-label">
                    <Sparkles size={13} style={{ color: '#fb923c' }} />
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
                  <Radio size={16} style={{ color: '#10b981' }} className="animate-pulse" />
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
                  {theme === 'dark' ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
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
                  {isAppFullScreen ? <Minimize2 size={16} style={{ color: '#10b981' }} /> : <Maximize2 size={16} style={{ color: '#10b981' }} />}
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
                    <img src={currentUser.photo} alt={currentUser.name} className="header-user-avatar-img" />
                  ) : (
                    currentUser.avatar || 'US'
                  )}
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

