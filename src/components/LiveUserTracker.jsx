import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  LogIn, 
  Calendar, 
  Activity, 
  UserX, 
  Radio, 
  Search, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Layers, 
  BarChart3, 
  TrendingUp, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Trash
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { deleteLiveSessionApi, clearLiveSessionsApi } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LiveUserTracker({ liveStats, onManualRefresh, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [chartTimeframe, setChartTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onManualRefresh) {
      await onManualRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteSingleSession = async (sessionId, username) => {
    if (window.confirm(`Are you sure you want to delete the login session record for "${username || 'this user'}"?`)) {
      setIsRefreshing(true);
      await deleteLiveSessionApi(sessionId);
      if (onManualRefresh) await onManualRefresh();
      setIsRefreshing(false);
    }
  };

  const handleClearSessions = async (mode = 'offline') => {
    const confirmMsg = mode === 'offline' 
      ? 'Are you sure you want to delete all offline user session logs?' 
      : 'Are you sure you want to clear all user login activity logs?';
    
    if (window.confirm(confirmMsg)) {
      setIsRefreshing(true);
      await clearLiveSessionsApi(mode);
      if (onManualRefresh) await onManualRefresh();
      setIsRefreshing(false);
    }
  };

  // Safe fallback stats structure
  const stats = useMemo(() => {
    return liveStats || {
      totalUsers: 5,
      onlineNow: 2,
      liveUsers: 2,
      totalLogins: 104,
      todaysLogins: 12,
      activeUsers: 4,
      offlineUsers: 3,
      inactivityTimeoutMinutes: 5,
      recentLogs: [],
      charts: {
        daily: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [12, 19, 15, 22, 18, 25, 30] },
        weekly: { labels: ['3 Wks Ago', '2 Wks Ago', 'Last Wk', 'This Wk'], data: [85, 110, 145, 178] },
        monthly: { labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], data: [310, 420, 530, 680, 790, 920] }
      }
    };
  }, [liveStats]);

  // Filter recent activity logs based on search and status filter
  const filteredLogs = useMemo(() => {
    const logs = stats.recentLogs || [];
    return logs.filter(log => {
      const matchSearch = 
        !searchQuery ||
        log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userRole?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ONLINE' && log.status === 'Online') ||
        (statusFilter === 'OFFLINE' && log.status === 'Offline');

      return matchSearch && matchStatus;
    });
  }, [stats.recentLogs, searchQuery, statusFilter]);

  // Format ISO timestamps into user-friendly strings
  const formatTime = (isoString) => {
    if (!isoString) return 'Active Now';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch (e) {
      return isoString;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  // Chart data configuration
  const activeChartObj = stats.charts?.[chartTimeframe] || { labels: [], data: [] };

  const chartData = {
    labels: activeChartObj.labels,
    datasets: [
      {
        label: `${chartTimeframe.toUpperCase()} USER LOGINS`,
        data: activeChartObj.data,
        borderColor: '#10b981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const isLightTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        titleColor: isLightTheme ? '#0284c7' : '#38bdf8',
        bodyColor: isLightTheme ? '#1e293b' : '#e2e8f0',
        borderColor: isLightTheme ? '#cbd5e1' : 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { color: isLightTheme ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: isLightTheme ? '#475569' : '#94a3b8', font: { family: 'Inter, sans-serif', size: 12 } }
      },
      y: {
        grid: { color: isLightTheme ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: isLightTheme ? '#475569' : '#94a3b8', font: { family: 'Inter, sans-serif', size: 12 }, precision: 0 },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="live-user-tracker-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner Header */}
      <div className="tracker-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="tracker-header-icon-box">
            <Radio size={30} style={{ color: '#10b981' }} className="animate-pulse" />
            <span className="live-status-ping-dot" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 className="tracker-main-title">
                Live Website Login & User Activity Counter
              </h1>
              <span className="live-stream-active-chip">
                <span className="chip-dot" />
                SSE REAL-TIME STREAM ACTIVE
              </span>
            </div>
            <p className="tracker-main-subtitle">
              Real-time user session status backend database engine • Automatic multi-tab deduplication • 5-minute inactivity heartbeat cleanup
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary live-sync-btn"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Sync Live Engine'}
          </button>
        </div>
      </div>

      {/* MAIN FEATURE HIGHLIGHT CARD: LIVE USERS */}
      <div className="live-users-hero-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span className="hero-feature-badge">
              <Radio size={12} className="animate-pulse" />
              MAIN FEATURE CARD
            </span>
            <span className="hero-feature-subtag">• Backend Live State Sync</span>
          </div>

          <h2 className="hero-card-heading">
            LIVE USERS
          </h2>
          <p className="hero-card-desc">
            Total number of verified unique users currently logged in and actively browsing on the website.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem' }}>
            <div className="hero-pill-info">
              <ShieldCheck size={14} style={{ color: '#34d399' }} />
              <span>Multi-Tab Deduplicated</span>
            </div>
            <div className="hero-pill-info">
              <Clock size={14} style={{ color: '#38bdf8' }} />
              <span>Auto-Offline after {stats.inactivityTimeoutMinutes || 5} min inactivity</span>
            </div>
          </div>
        </div>

        <div className="live-users-hero-stat-box">
          <div className="hero-stat-top-bar" />

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="hero-stat-big-number">
              {stats.liveUsers}
            </span>
            <span className="hero-stat-label">Users Online</span>
          </div>

          <div className="hero-stat-bottom-status">
            <span className="green-pulse-dot" />
            <span>Updated live from backend websocket/SSE stream</span>
          </div>
        </div>
      </div>

      {/* 6 ADMIN DASHBOARD CARDS */}
      <h3 className="admin-metrics-section-title">
        <Layers size={20} style={{ color: '#38bdf8' }} />
        ADMIN DASHBOARD METRICS
      </h3>

      <div className="admin-metrics-grid">
        {/* Card 1: TOTAL USERS */}
        <div className="admin-metric-card border-blue">
          <div className="metric-card-header">
            <span className="metric-card-label">TOTAL USERS</span>
            <Users size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div className="metric-card-number">
            {stats.totalUsers}
          </div>
          <div className="metric-card-sub">
            Registered User Accounts
          </div>
        </div>

        {/* Card 2: ONLINE NOW */}
        <div className="admin-metric-card border-emerald bg-emerald-tint">
          <div className="metric-card-header">
            <span className="metric-card-label emerald-text">ONLINE NOW</span>
            <UserCheck size={20} style={{ color: '#10b981' }} />
          </div>
          <div className="metric-card-number emerald-number">
            {stats.onlineNow}
          </div>
          <div className="metric-card-sub">
            Active Real-Time Connections
          </div>
        </div>

        {/* Card 3: TOTAL LOGINS */}
        <div className="admin-metric-card border-purple">
          <div className="metric-card-header">
            <span className="metric-card-label">TOTAL LOGINS</span>
            <LogIn size={20} style={{ color: '#c084fc' }} />
          </div>
          <div className="metric-card-number">
            {stats.totalLogins}
          </div>
          <div className="metric-card-sub">
            Cumulative Login Events
          </div>
        </div>

        {/* Card 4: TODAY'S LOGINS */}
        <div className="admin-metric-card border-amber">
          <div className="metric-card-header">
            <span className="metric-card-label">TODAY'S LOGINS</span>
            <Calendar size={20} style={{ color: '#fb923c' }} />
          </div>
          <div className="metric-card-number">
            {stats.todaysLogins}
          </div>
          <div className="metric-card-sub">
            Sign-ins Since 00:00 Local
          </div>
        </div>

        {/* Card 5: ACTIVE USERS */}
        <div className="admin-metric-card border-cyan">
          <div className="metric-card-header">
            <span className="metric-card-label">ACTIVE USERS</span>
            <Activity size={20} style={{ color: '#22d3ee' }} />
          </div>
          <div className="metric-card-number">
            {stats.activeUsers}
          </div>
          <div className="metric-card-sub">
            Active In Last 24 Hours
          </div>
        </div>

        {/* Card 6: OFFLINE USERS */}
        <div className="admin-metric-card border-gray">
          <div className="metric-card-header">
            <span className="metric-card-label">OFFLINE USERS</span>
            <UserX size={20} style={{ color: '#94a3b8' }} />
          </div>
          <div className="metric-card-number">
            {stats.offlineUsers}
          </div>
          <div className="metric-card-sub">
            Registered Users Inactive
          </div>
        </div>
      </div>

      {/* LOGIN ACTIVITY CHARTS SECTION */}
      <div className="live-chart-container-box">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="section-card-heading">
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              Login Activity Trends & Analytics
            </h3>
            <p className="section-card-subheading">
              Visualizing daily, weekly, and monthly login count distributions
            </p>
          </div>

          <div className="chart-timeframe-toggle-wrap">
            {['daily', 'weekly', 'monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`chart-timeframe-btn ${chartTimeframe === tf ? 'active' : ''}`}
              >
                {tf} View
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* RECENT LOGIN ACTIVITY LOGS TABLE */}
      <div className="live-logs-container-box">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="section-card-heading">
              <Clock size={20} style={{ color: '#38bdf8' }} />
              Recent User Login & Activity Log
            </h3>
            <p className="section-card-subheading">
              Detailed audit trail of successful logins, logouts, active sessions, and last seen timestamps
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search user, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="live-logs-search-input"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="status-filter-pills-wrap">
              {['ALL', 'ONLINE', 'OFFLINE'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`status-pill-btn ${statusFilter === st ? 'active' : ''}`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Clear Logs Actions Button */}
            <button
              type="button"
              onClick={() => handleClearSessions('offline')}
              className="btn-clear-logs-action"
              title="Delete offline user login records"
            >
              <Trash size={15} />
              <span>Clear Offline Logs</span>
            </button>
            <button
              type="button"
              onClick={() => handleClearSessions('all')}
              className="btn-clear-all-logs-action"
              title="Clear all login activity records"
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="live-logs-table">
            <thead>
              <tr className="logs-table-header-tr">
                <th>USER / ACCOUNT</th>
                <th>LOGIN TIME</th>
                <th>LOGOUT TIME</th>
                <th>STATUS</th>
                <th>LAST ACTIVE</th>
                <th style={{ textAlign: 'center', width: '90px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-logs-td">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isOnline = log.status === 'Online';
                  return (
                    <tr key={log.id} className="logs-table-tr">
                      {/* User Column */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className={`user-avatar-circle ${isOnline ? 'online' : 'offline'}`}>
                            {log.avatar || 'US'}
                          </div>
                          <div>
                            <div className="user-log-name">{log.username}</div>
                            <div className="user-log-sub">{log.userRole} • {log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Login Time */}
                      <td className="log-time-cell">
                        <div>{formatTime(log.loginTime)}</div>
                        <div className="sub-date">{formatDate(log.loginTime)}</div>
                      </td>

                      {/* Logout Time */}
                      <td className={`log-logout-cell ${isOnline ? 'online' : ''}`}>
                        {isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Active Session
                          </span>
                        ) : (
                          <div>
                            <div>{formatTime(log.logoutTime)}</div>
                            <div className="sub-date">{formatDate(log.logoutTime)}</div>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`log-status-badge ${isOnline ? 'online' : 'offline'}`}>
                          <span className="status-dot-indicator" />
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>

                      {/* Last Active Time */}
                      <td className="log-last-active-cell">
                        {formatTime(log.lastActiveTime || log.loginTime)}
                      </td>

                      {/* Delete Option */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleSession(log.id, log.username)}
                          className="delete-log-row-btn"
                          title={`Delete session record for ${log.username}`}
                        >
                          <Trash2 size={15} />
                        </button>
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
  );
}

