import React, { useState } from 'react';
import { BarChart3, Upload, Download, Layers, LogIn, LogOut, ShieldCheck, Sun, Moon, ArrowLeft, Menu, X, Database, Filter, Radio } from 'lucide-react';

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
  onToggleTheme
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* Back button when in upload mode or history mode */}
        {(isUploadMode || isHistoryMode || !hasData) && hasPreviousDataset && (
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

        {hasData && !isUploadMode && !isHistoryMode && (
          <>


            {/* New Upload Button */}
            <button 
              className="btn btn-secondary btn-new-file-highlight" 
              onClick={() => {
                onResetData();
                closeMobileMenu();
              }} 
              title="Upload a New Dataset File"
            >
              <Upload size={16} />
              <span>Upload Dataset</span>
            </button>

            {/* Export CSV Button */}
            <button 
              className="btn btn-secondary btn-export-csv" 
              onClick={() => {
                onExportCSV();
                closeMobileMenu();
              }} 
              title="Export Filtered CSV Dataset"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            {/* Loaded Dataset Badge */}
            <span className="badge badge-blue header-dataset-badge">
              <Layers size={12} className="mr-1 inline flex-shrink-0" />
              <span className="truncate-text">{datasetName || 'Loaded Dataset'}</span>
            </span>

            {/* Load Demo Dataset Selector */}
            <select 
              className="sample-select" 
              onChange={(e) => {
                if (e.target.value) {
                  onLoadSample(e.target.value);
                  closeMobileMenu();
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Load Demo Dataset...</option>
              <option value="workforce">Workforce Intelligence (Demo)</option>
              <option value="sales">Sales & Revenue Analytics</option>
            </select>
          </>
        )}

        {!hasData && !isUploadMode && !isHistoryMode && !hasPreviousDataset && (
          <button 
            className="btn btn-primary btn-new-file-highlight" 
            onClick={() => {
              onUploadClick();
              closeMobileMenu();
            }}
          >
            <Upload size={16} />
            <span>Upload File</span>
          </button>
        )}

        {/* Live Users Counter & Dashboard Button */}
        <button 
          className={`btn ${isLiveUsersMode ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            borderColor: 'rgba(16, 185, 129, 0.4)',
            background: isLiveUsersMode ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(6, 78, 59, 0.4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            position: 'relative'
          }}
          onClick={() => {
            if (onLiveUsersClick) onLiveUsersClick();
            closeMobileMenu();
          }}
          title="Open Live Website Login & User Activity Counter Dashboard"
        >
          <Radio size={16} className="text-emerald animate-pulse" />
          <span>Live Users</span>
          <span style={{
            background: '#10b981',
            color: '#022c22',
            padding: '0.15rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            marginLeft: '0.2rem'
          }}>
            {liveUsersCount}
          </span>
        </button>

        {/* Theme Switcher */}
        <button 
          className="btn btn-secondary theme-toggle-btn"
          onClick={() => {
            onToggleTheme();
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} style={{ color: '#f59e0b' }} />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: '#6366f1' }} />
              <span>Dark</span>
            </>
          )}
        </button>

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
