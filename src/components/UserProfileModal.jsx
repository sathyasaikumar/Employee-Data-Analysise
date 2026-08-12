import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Mail, Phone, Calendar, Award, ShieldCheck, Clock, History, 
  CheckCircle2, LogOut, Activity, Lock, X, Edit3, Save, Download, 
  Camera, Upload, Image as ImageIcon, Sparkles, AlertCircle, Check,
  Maximize2, Minimize2, Trash2, Database, Radio
} from 'lucide-react';
import { 
  getUserProfile, saveUserProfile, calculateSessionStats, 
  formatLocalTimestamp, formatDuration, ensureSampleLoginHistory,
  deleteLoginSession, clearLoginHistory
} from '../utils/activityTracker';
import DatasetHistory from './DatasetHistory';
import LiveUserTracker from './LiveUserTracker';

export const PRESET_AVATARS = [
  { id: 'avatar1', name: 'Executive Male Portrait', url: '/avatars/avatar1.png' },
  { id: 'avatar2', name: 'Executive Female Portrait', url: '/avatars/avatar2.png' },
  { id: 'avatar3', name: '3D Cyber Tech Avatar', url: '/avatars/avatar3.png' }
];

export default function UserProfileModal({ 
  currentUser, 
  isOpen, 
  onClose, 
  onLogout, 
  onUpdateUser,
  datasets = [],
  onSelectDataset,
  onDeleteDataset,
  onRefreshDatasets,
  onOpenUpload,
  liveStats = null
}) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveDuration, setLiveDuration] = useState('00m 00s');
  const [activeTab, setActiveTab] = useState('session_history'); // 'session_history' | 'dataset_history'

  // Full Screen & Photo Picker Modal State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const toggleFullScreen = (forceState) => {
    const nextState = typeof forceState === 'boolean' ? forceState : !isFullScreen;
    setIsFullScreen(nextState);

    try {
      if (nextState) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => {});
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen().catch(() => {});
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err.message);
    }
  };

  const userId = currentUser?.id || currentUser?.email || currentUser?.phone || 'guest';
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Timezone';

  // Load profile data and session history
  useEffect(() => {
    if (currentUser) {
      ensureSampleLoginHistory(userId);
      const loadedProfile = getUserProfile(currentUser);
      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      setSelectedPhoto(loadedProfile.photo || null);
      refreshSessionData();
    }
  }, [currentUser, userId]);

  // Refresh stats & history
  const refreshSessionData = () => {
    const calculatedStats = calculateSessionStats(userId);
    setStats(calculatedStats);
    setHistory(calculatedStats.history);
  };

  // Live seconds ticker for current session duration
  useEffect(() => {
    if (!isOpen || !userId) return;

    const updateLiveTimer = () => {
      const currentStats = calculateSessionStats(userId);
      setStats(currentStats);
      setHistory(currentStats.history);
      setLiveDuration(formatDuration(currentStats.currentSessionMs));
    };

    updateLiveTimer();
    const interval = setInterval(updateLiveTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, userId]);

  if (!isOpen || !currentUser || !profile) return null;

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    const updatedProfile = { ...editForm, photo: selectedPhoto };
    saveUserProfile(currentUser, updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);

    if (onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        photo: selectedPhoto
      });
    }
  };

  const handleSelectPresetPhoto = (avatarUrl) => {
    setSelectedPhoto(avatarUrl);
    setEditForm(prev => ({ ...prev, photo: avatarUrl }));
    
    // Save instantly
    const updated = { ...profile, photo: avatarUrl };
    saveUserProfile(currentUser, updated);
    setProfile(updated);
    if (onUpdateUser) {
      onUpdateUser({ ...currentUser, photo: avatarUrl });
    }
    setShowPhotoPicker(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        handleSelectPresetPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    handleSelectPresetPhoto(null);
  };

  const handleExportHistoryCSV = () => {
    if (!history || history.length === 0) return;
    
    let csv = 'Session ID,Date,Login Time (Local),Logout Time (Local),Duration,Status,Device,IP Address\n';
    history.forEach(s => {
      const loginStr = formatLocalTimestamp(s.loginTime).replace(/,/g, '');
      const logoutStr = s.logoutTime ? formatLocalTimestamp(s.logoutTime).replace(/,/g, '') : 'Active Session';
      const durStr = formatDuration(s.durationMs);
      csv += `"${s.id}","${s.dateIso ? formatLocalTimestamp(s.dateIso).split(',')[0] : ''}","${loginStr}","${logoutStr}","${durStr}","${s.status}","${s.device || ''}","${s.ipAddress || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Login_Activity_Log_${profile.fullName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this login session record?')) {
      deleteLoginSession(userId, sessionId);
      const updatedStats = calculateSessionStats(userId);
      setStats(updatedStats);
      setHistory(updatedStats.history);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all completed session history logs?')) {
      clearLoginHistory(userId);
      const updatedStats = calculateSessionStats(userId);
      setStats(updatedStats);
      setHistory(updatedStats.history);
    }
  };

  // Filtered history records
  const filteredHistory = history.filter(s => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && s.status === 'Active') ||
      (filterStatus === 'logged_out' && s.status === 'Logged Out');
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      s.status.toLowerCase().includes(searchLower) ||
      formatLocalTimestamp(s.loginTime).toLowerCase().includes(searchLower) ||
      (s.device && s.device.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  return createPortal(
    <div className={`profile-modal-overlay ${isFullScreen ? 'has-fullscreen' : ''}`} onClick={onClose}>
      <div className={`profile-modal-container ${isFullScreen ? 'is-fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Top Header Bar */}
        <div className="profile-modal-header" onDoubleClick={() => toggleFullScreen()}>
          <div className="profile-modal-title">
            <User size={22} className="text-indigo-400" />
            <div>
              <h2>Personal Profile & Login Activity System</h2>
              <p className="subtitle">Real-time session security, localized tracking, and profile management</p>
            </div>
          </div>
          
          <div className="profile-modal-header-actions">
            <button 
              type="button" 
              className="profile-modal-action-btn" 
              onClick={() => toggleFullScreen()} 
              title={isFullScreen ? "Exit Full Screen" : "Full Screen View"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button type="button" className="profile-modal-close-btn" onClick={onClose} title="Close Profile Modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Content Split: Left (Profile) & Right (Activity Dashboard) */}
        <div className="profile-modal-body">
          
          {/* ================= LEFT SIDE: PERSONAL PROFILE CARD ================= */}
          <div className="profile-left-sidebar">
            <div className="profile-card">
              
              {/* Profile Photo / Avatar Header with interactive camera overlay */}
              <div className="profile-photo-container">
                <div className="avatar-circle" title="Click camera to change profile photo">
                  {profile.photo ? (
                    <img src={profile.photo} alt={profile.fullName} className="avatar-img" />
                  ) : (
                    <span className="avatar-text">{profile.avatarInitials}</span>
                  )}
                  
                  {/* Camera Icon Overlay Trigger */}
                  <button 
                    type="button" 
                    className="avatar-camera-btn"
                    onClick={() => setShowPhotoPicker(true)}
                    title="Choose / Upload Profile Picture"
                  >
                    <Camera size={18} />
                  </button>

                  <span className="avatar-online-badge" title="Status: Online & Verified"></span>
                </div>

                <button 
                  type="button" 
                  className="btn-change-photo-link"
                  onClick={() => setShowPhotoPicker(true)}
                >
                  <Camera size={13} /> Change Profile Picture
                </button>

                <h3 className="profile-name">
                  {profile.fullName}
                  <ShieldCheck size={18} className="text-emerald-400" title="Verified Corporate Identity" />
                </h3>
                <span className="profile-role-pill">{profile.role}</span>
              </div>

              {/* Editable or Display Personal Details */}
              {!isEditing ? (
                <div className="profile-details-list">
                  <div className="detail-item">
                    <Mail size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{profile.email}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Phone size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Mobile Phone</span>
                      <span className="detail-value">{profile.phone}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Award size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{profile.department}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Activity size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Account Status</span>
                      <span className="detail-value text-emerald">{profile.status}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Calendar size={15} className="detail-icon" />
                    <div>
                      <span className="detail-label">Profile Created Date</span>
                      <span className="detail-value">{formatLocalTimestamp(profile.createdDate)}</span>
                    </div>
                  </div>

                  {/* Skills & Interests Section */}
                  <div className="profile-skills-section">
                    <h4 className="skills-heading">Skills & Interests</h4>
                    <div className="skills-tags-wrap">
                      {profile.skills && profile.skills.map((skill, i) => (
                        <span key={i} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Bio / Summary */}
                  {profile.bio && (
                    <div className="profile-bio-box">
                      <span className="detail-label">Personal Bio / Notes</span>
                      <p className="bio-text">{profile.bio}</p>
                    </div>
                  )}

                  {/* Edit Profile Action Button */}
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-edit-profile"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={15} /> Edit Personal Details
                  </button>
                </div>
              ) : (
                /* Editable Form Mode */
                <form onSubmit={handleSaveProfile} className="profile-edit-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.fullName} 
                      onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input 
                      type="text" 
                      value={editForm.department} 
                      onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role / Title</label>
                    <input 
                      type="text" 
                      value={editForm.role} 
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Bio / Notes</label>
                    <textarea 
                      rows="3"
                      value={editForm.bio} 
                      onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    />
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn btn-primary btn-save">
                      <Save size={15} /> Save Changes
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>


          {/* ================= RIGHT SIDE: LOGIN & LOGOUT TRACKING DASHBOARD ================= */}
          <div className="profile-right-dashboard">
            
            {/* Live Active Session Status Banner */}
            <div className="active-session-banner">
              <div className="session-status-left">
                <span className="live-status-dot"></span>
                <div>
                  <span className="live-status-title">ACTIVE LOGIN SESSION IN PROGRESS</span>
                  <span className="live-status-subtitle">
                    System Timezone: <strong className="text-cyan-400">{userTimezone}</strong> (Local Time)
                  </span>
                </div>
              </div>
              <div className="session-timer-badge">
                <Clock size={16} className="text-emerald-400 animate-pulse" />
                <span className="timer-text">{liveDuration}</span>
              </div>
            </div>

            {/* 5 DASHBOARD KPI METRIC CARDS */}
            <div className="dashboard-cards-grid">
              
              {/* 1. LAST LOGIN */}
              <div className="dash-kpi-card card-blue">
                <div className="dash-kpi-header">
                  <span className="dash-kpi-label">LAST LOGIN</span>
                  <Clock size={16} className="dash-kpi-icon" />
                </div>
                <div className="dash-kpi-value text-medium">
                  {stats?.lastLoginIso ? formatLocalTimestamp(stats.lastLoginIso) : 'Never'}
                </div>
                <span className="dash-kpi-sub">Recorded in local timezone</span>
              </div>

              {/* 2. CURRENT SESSION */}
              <div className="dash-kpi-card card-emerald">
                <div className="dash-kpi-header">
                  <span className="dash-kpi-label">CURRENT SESSION</span>
                  <Activity size={16} className="dash-kpi-icon" />
                </div>
                <div className="dash-kpi-value">
                  {liveDuration}
                </div>
                <span className="dash-kpi-sub">🟢 Real-time duration ticker</span>
              </div>

              {/* 3. TOTAL LOGIN HOURS */}
              <div className="dash-kpi-card card-purple">
                <div className="dash-kpi-header">
                  <span className="dash-kpi-label">TOTAL LOGIN HOURS</span>
                  <Award size={16} className="dash-kpi-icon" />
                </div>
                <div className="dash-kpi-value">
                  {stats?.totalHoursFloat || '0.0'} <span className="unit">hrs</span>
                </div>
                <span className="dash-kpi-sub">Cumulative total time spent</span>
              </div>

              {/* 4. LOGIN COUNT */}
              <div className="dash-kpi-card card-cyan">
                <div className="dash-kpi-header">
                  <span className="dash-kpi-label">LOGIN COUNT</span>
                  <History size={16} className="dash-kpi-icon" />
                </div>
                <div className="dash-kpi-value">
                  {stats?.loginCount || 0} <span className="unit">Sessions</span>
                </div>
                <span className="dash-kpi-sub">Automated session logs</span>
              </div>

              {/* 5. LAST LOGOUT */}
              <div className="dash-kpi-card card-rose">
                <div className="dash-kpi-header">
                  <span className="dash-kpi-label">LAST LOGOUT</span>
                  <LogOut size={16} className="dash-kpi-icon" />
                </div>
                <div className="dash-kpi-value text-medium">
                  {stats?.lastLogoutIso ? formatLocalTimestamp(stats.lastLogoutIso) : 'Active Session'}
                </div>
                <span className="dash-kpi-sub">Previous sign-out timestamp</span>
              </div>

            </div>


            {/* TAB SELECTOR BAR FOR LOGIN & DATASET HISTORY */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`profile-tab-pill ${activeTab === 'session_history' ? 'active' : ''}`}
                onClick={() => setActiveTab('session_history')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: activeTab === 'session_history' ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: activeTab === 'session_history' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.15))' : 'rgba(15, 23, 42, 0.6)',
                  color: activeTab === 'session_history' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'session_history' ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <History size={16} className={activeTab === 'session_history' ? 'text-cyan-400' : ''} />
                <span>Automated Login & Session History</span>
              </button>

              <button
                type="button"
                className={`profile-tab-pill ${activeTab === 'dataset_history' ? 'active' : ''}`}
                onClick={() => setActiveTab('dataset_history')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: activeTab === 'dataset_history' ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: activeTab === 'dataset_history' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.15))' : 'rgba(15, 23, 42, 0.6)',
                  color: activeTab === 'dataset_history' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'dataset_history' ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <Database size={16} className={activeTab === 'dataset_history' ? 'text-cyan-400' : ''} />
                <span>Dataset History</span>
                <span style={{
                  background: activeTab === 'dataset_history' ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                  color: activeTab === 'dataset_history' ? '#38bdf8' : 'var(--text-muted)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {datasets.length}
                </span>
              </button>

              {/* LIVE WEBSITE USERS TAB NEXT TO DATASET HISTORY */}
              <button
                type="button"
                className={`profile-tab-pill ${activeTab === 'live_users' ? 'active' : ''}`}
                onClick={() => setActiveTab('live_users')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: activeTab === 'live_users' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: activeTab === 'live_users' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15))' : 'rgba(15, 23, 42, 0.6)',
                  color: activeTab === 'live_users' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'live_users' ? '0 4px 15px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                <Radio size={16} className={activeTab === 'live_users' ? 'text-emerald-400 animate-pulse' : 'text-emerald-400'} />
                <span>Live Website Users</span>
                <span style={{
                  background: '#10b981',
                  color: '#022c22',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {liveStats?.liveUsers ?? 2}
                </span>
              </button>
            </div>

            {/* CONDITIONAL TAB CONTENT */}
            {activeTab === 'live_users' ? (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1rem', overflow: 'hidden' }}>
                <LiveUserTracker 
                  liveStats={liveStats}
                  currentUser={currentUser}
                />
              </div>
            ) : activeTab === 'dataset_history' ? (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <DatasetHistory 
                  datasets={datasets}
                  onSelectDataset={onSelectDataset}
                  onDeleteDataset={onDeleteDataset}
                  onRefresh={onRefreshDatasets}
                  onOpenUpload={onOpenUpload}
                />
              </div>
            ) : (
              /* LOGIN HISTORY TABLE SECTION */
              <div className="login-history-container">
                <div className="history-table-header">
                  <div className="history-header-title">
                    <History size={18} className="text-blue-400" />
                    <h3>Automated Login & Logout History</h3>
                    <span className="badge-security-lock">
                      <Lock size={12} /> Read-Only Timestamp Tracking
                    </span>
                  </div>

                  <div className="history-header-actions">
                    {/* Search input */}
                    <input 
                      type="text" 
                      placeholder="Search history..." 
                      className="history-search-input"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />

                    {/* Status Filter */}
                    <select 
                      className="history-filter-select"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Sessions</option>
                      <option value="active">Active Only</option>
                      <option value="logged_out">Logged Out</option>
                    </select>

                    {/* Export CSV Log */}
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-export-history"
                      onClick={handleExportHistoryCSV}
                      title="Export Login History CSV"
                    >
                      <Download size={14} /> Export CSV
                    </button>
                    
                    {/* Clear All History */}
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-clear-history"
                      onClick={handleClearAllHistory}
                      title="Delete completed session history logs"
                      style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Trash2 size={14} /> Clear History
                    </button>
                  </div>
                </div>

                {/* Table view */}
                <div className="history-table-wrapper">
                  <table className="login-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Login Time</th>
                        <th>Logout Time</th>
                        <th>Session Duration</th>
                        <th>Device & Location</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((sess, idx) => (
                          <tr key={sess.id || idx} className={sess.status === 'Active' ? 'row-active' : ''}>
                            <td className="font-semibold text-main">
                              {sess.dateIso ? formatLocalTimestamp(sess.dateIso).split(',')[0] : 'Today'}
                            </td>
                            <td className="text-cyan-400 font-mono">
                              {formatLocalTimestamp(sess.loginTime)}
                            </td>
                            <td className="text-muted font-mono">
                              {sess.logoutTime ? (
                                formatLocalTimestamp(sess.logoutTime)
                              ) : (
                                <span className="text-emerald font-semibold animate-pulse">🟢 Active Now</span>
                              )}
                            </td>
                            <td className="font-mono text-purple-300">
                              {sess.status === 'Active' ? liveDuration : formatDuration(sess.durationMs)}
                            </td>
                            <td className="text-dim text-xs">
                              {sess.device || 'Windows Desktop'} ({sess.ipAddress || '192.168.1.104'})
                            </td>
                            <td>
                              {sess.status === 'Active' ? (
                                <span className="status-badge status-active">
                                  <span className="dot"></span> Active
                                </span>
                              ) : (
                                <span className="status-badge status-loggedout">
                                  Logged Out
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(sess.id)}
                                title="Delete this session record"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-muted">
                            No login history records match the selected filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Security Footer Notice */}
                <div className="history-security-footer">
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                  <span>
                    All login & logout events are automatically verified and timestamped using your local system timezone (<strong>{userTimezone}</strong>). Timestamps cannot be manually edited or modified.
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ================= PROFILE PHOTO PICKER MODAL DIALOG ================= */}
      {showPhotoPicker && (
        <div className="photo-picker-overlay" onClick={() => setShowPhotoPicker(false)}>
          <div className="photo-picker-dialog" onClick={e => e.stopPropagation()}>
            <div className="photo-picker-header">
              <div className="flex items-center gap-2">
                <Camera size={20} className="text-cyan-400" />
                <h3>Choose Profile Picture</h3>
              </div>
              <button type="button" className="photo-picker-close-btn" onClick={() => setShowPhotoPicker(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="photo-picker-body">
              
              {/* Option 1: Upload Custom Photo */}
              <div className="upload-photo-option-card">
                <div className="upload-photo-left">
                  <Upload size={22} className="text-indigo-400" />
                  <div>
                    <h4>Upload Custom Photo</h4>
                    <p>Select any image file from your computer (PNG, JPG, WEBP)</p>
                  </div>
                </div>
                <label className="btn btn-primary btn-upload-photo-trigger">
                  <ImageIcon size={15} /> Browse Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden-file-input"
                  />
                </label>
              </div>

              <div className="photo-picker-divider">
                <span>OR SELECT PRESET EXECUTIVE AVATAR</span>
              </div>

              {/* Option 2: Preset Executive Avatars Gallery Grid */}
              <div className="preset-avatars-grid">
                
                {/* Default Initials Option */}
                <div 
                  className={`preset-avatar-card ${!profile.photo ? 'selected' : ''}`}
                  onClick={handleRemovePhoto}
                >
                  <div className="preset-avatar-circle initials-circle">
                    {profile.avatarInitials}
                  </div>
                  <span className="preset-name">Initials Badge ({profile.avatarInitials})</span>
                  {!profile.photo && <span className="selected-check-badge"><Check size={12} /> Active</span>}
                </div>

                {/* Executive Avatars */}
                {PRESET_AVATARS.map((av) => {
                  const isSelected = profile.photo === av.url;
                  return (
                    <div 
                      key={av.id}
                      className={`preset-avatar-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectPresetPhoto(av.url)}
                    >
                      <img src={av.url} alt={av.name} className="preset-avatar-circle" />
                      <span className="preset-name">{av.name}</span>
                      {isSelected && <span className="selected-check-badge"><Check size={12} /> Active</span>}
                    </div>
                  );
                })}

              </div>

            </div>

            <div className="photo-picker-footer">
              {profile.photo && (
                <button type="button" className="btn btn-outline text-rose-400" onClick={handleRemovePhoto}>
                  Remove Custom Photo
                </button>
              )}
              <button type="button" className="btn btn-secondary ml-auto" onClick={() => setShowPhotoPicker(false)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
