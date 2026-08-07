import React, { useState } from 'react';
import { BarChart3, Upload, Download, RefreshCw, Layers, LogIn, LogOut, User, Mail, Phone, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function Header({ 
  hasData, 
  datasetName, 
  onUploadClick, 
  onLoadSample, 
  onResetData, 
  onExportCSV,
  currentUser,
  onOpenLogin,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <BarChart3 className="w-6 h-6 text-white" size={24} />
        </div>
        <div>
          <h1 className="brand-title">Corporate Access & Intelligence System</h1>
          <p className="brand-subtitle">Enterprise Workforce & Data Analytics Platform</p>
        </div>
      </div>

      <div className="header-actions">
        {hasData && (
          <>
            <span className="badge badge-blue">
              <Layers size={12} className="mr-1 inline" /> {datasetName || 'Loaded Dataset'}
            </span>

            <select 
              className="sample-select" 
              onChange={(e) => {
                if (e.target.value) onLoadSample(e.target.value);
              }}
              defaultValue=""
            >
              <option value="" disabled>Load Sample Dataset...</option>
              <option value="workforce">Workforce Intelligence (Demo)</option>
              <option value="sales">Sales & Revenue Analytics</option>
            </select>

            <button className="btn btn-secondary" onClick={onExportCSV} title="Export Filtered CSV">
              <Download size={16} /> Export CSV
            </button>

            <button className="btn btn-outline" onClick={onResetData} title="Reset / Upload New File">
              <RefreshCw size={16} /> New File
            </button>
          </>
        )}

        {!hasData && (
          <button className="btn btn-primary" onClick={onUploadClick}>
            <Upload size={16} /> Upload CSV File
          </button>
        )}

        {/* Theme Mode Switcher */}
        <button 
          className="btn btn-secondary theme-toggle-btn"
          onClick={onToggleTheme}
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
                onClick={onLogout}
                title="Logout of current session"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-primary login-trigger-btn" onClick={onOpenLogin}>
              <LogIn size={16} /> Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

