import React, { useState } from 'react';
import { BarChart3, Upload, Download, Layers, LogIn, LogOut, ShieldCheck, Sun, Moon, ArrowLeft, Menu, X } from 'lucide-react';

export default function Header({ 
  hasData, 
  hasPreviousDataset,
  isUploadMode,
  datasetName, 
  onUploadClick, 
  onLoadSample, 
  onResetData, 
  onBackToDashboard,
  onExportCSV,
  currentUser,
  onOpenLogin,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
        {/* ONE unique Back button on the left side when in upload mode */}
        {(isUploadMode || !hasData) && hasPreviousDataset && (
          <button 
            type="button"
            className="btn btn-secondary btn-back-unique"
            onClick={() => {
              onBackToDashboard();
              closeMobileMenu();
            }}
            title="Return back to your active dataset and dashboard"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}

        {hasData && !isUploadMode && (
          <>
            {/* 1. FIRST POSITION ON LEFT: New File Button */}
            <button 
              className="btn btn-primary btn-new-file-highlight" 
              onClick={() => {
                onResetData();
                closeMobileMenu();
              }} 
              title="Upload a New CSV File or Reset Dataset"
            >
              <Upload size={16} />
              <span>New File</span>
            </button>

            {/* 2. NEXT TO NEW FILE: Export CSV Button */}
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

            {/* 3. Loaded Dataset Badge */}
            <span className="badge badge-blue header-dataset-badge">
              <Layers size={12} className="mr-1 inline flex-shrink-0" />
              <span className="truncate-text">{datasetName || 'Loaded Dataset'}</span>
            </span>

            {/* 4. Load Sample Dataset Selector */}
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
              <option value="" disabled>Load Sample Dataset...</option>
              <option value="workforce">Workforce Intelligence (Demo)</option>
              <option value="sales">Sales & Revenue Analytics</option>
            </select>
          </>
        )}

        {!hasData && !isUploadMode && !hasPreviousDataset && (
          <button 
            className="btn btn-primary btn-new-file-highlight" 
            onClick={() => {
              onUploadClick();
              closeMobileMenu();
            }}
          >
            <Upload size={16} />
            <span>Upload CSV File</span>
          </button>
        )}

        {/* Theme Mode Switcher */}
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
              <span>Light Theme</span>
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: '#6366f1' }} />
              <span>Dark Theme</span>
            </>
          )}
        </button>

        {/* User Authentication & Profile Control */}
        <div className="user-auth-wrapper">
          {currentUser ? (
            <div className="user-profile-badge">
              <div 
                className="user-avatar"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="View user details"
              >
                {currentUser.avatar || 'US'}
              </div>

              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role-badge">
                  <ShieldCheck size={12} className="inline mr-1 text-emerald" />
                  {currentUser.role || 'Authorized User'}
                </span>
              </div>

              <button 
                className="logout-btn"
                onClick={() => {
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

