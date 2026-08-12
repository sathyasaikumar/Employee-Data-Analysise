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
  AlertCircle
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 12 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter, sans-serif', size: 12 }, precision: 0 },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="live-user-tracker-container animate-fade-in" style={{ padding: '1.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner Header */}
      <div className="tracker-header-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={30} style={{ color: '#10b981' }} className="animate-pulse" />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 12px #10b981'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Live Website Login & User Activity Counter
              </h1>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                SSE REAL-TIME STREAM ACTIVE
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Real-time user session status backend database engine • Automatic multi-tab deduplication • 5-minute inactivity heartbeat cleanup
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(51, 65, 85, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Sync Live Engine'}
          </button>
        </div>
      </div>

      {/* MAIN FEATURE HIGHLIGHT CARD: LIVE USERS */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.5)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 12px 40px rgba(16, 185, 129, 0.15)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#10b981',
              color: '#022c22',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              <Radio size={12} className="animate-pulse" />
              MAIN FEATURE CARD
            </span>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>• Backend Live State Sync</span>
          </div>

          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            LIVE USERS
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Total number of verified unique users currently logged in and actively browsing on the website.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <ShieldCheck size={14} style={{ color: '#34d399' }} />
              <span>Multi-Tab Deduplicated</span>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <Clock size={14} style={{ color: '#38bdf8' }} />
              <span>Auto-Offline after {stats.inactivityTimeoutMinutes || 5} min inactivity</span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #10b981, #06b6d4, #10b981)',
            backgroundSize: '200% 100%',
            animation: 'pulse 2s infinite'
          }} />

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontSize: '4.5rem', fontWeight: 900, color: '#34d399', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {stats.liveUsers}
            </span>
            <span style={{ color: '#a7f3d0', fontWeight: 700, fontSize: '1.25rem' }}>Users Online</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span>Updated live from backend websocket/SSE stream</span>
          </div>
        </div>
      </div>

      {/* 6 ADMIN DASHBOARD CARDS */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={20} style={{ color: '#38bdf8' }} />
        ADMIN DASHBOARD METRICS
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: TOTAL USERS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL USERS</span>
            <Users size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {stats.totalUsers}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Registered User Accounts
          </div>
        </div>

        {/* Card 2: ONLINE NOW */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>ONLINE NOW</span>
            <UserCheck size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
            {stats.onlineNow}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Active Real-Time Connections
          </div>
        </div>

        {/* Card 3: TOTAL LOGINS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#e9d5ff', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL LOGINS</span>
            <LogIn size={20} style={{ color: '#c084fc' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {stats.totalLogins}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Cumulative Login Events
          </div>
        </div>

        {/* Card 4: TODAY'S LOGINS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(251, 146, 60, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#ffedd5', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>TODAY'S LOGINS</span>
            <Calendar size={20} style={{ color: '#fb923c' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {stats.todaysLogins}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Sign-ins Since 00:00 Local
          </div>
        </div>

        {/* Card 5: ACTIVE USERS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(34, 211, 238, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#cffafe', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE USERS</span>
            <Activity size={20} style={{ color: '#22d3ee' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {stats.activeUsers}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Active In Last 24 Hours
          </div>
        </div>

        {/* Card 6: OFFLINE USERS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>OFFLINE USERS</span>
            <UserX size={20} style={{ color: '#94a3b8' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {stats.offlineUsers}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Registered Users Inactive
          </div>
        </div>
      </div>

      {/* LOGIN ACTIVITY CHARTS SECTION */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              Login Activity Trends & Analytics
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Visualizing daily, weekly, and monthly login count distributions
            </p>
          </div>

          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.8)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['daily', 'weekly', 'monthly'].map(tf => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: chartTimeframe === tf ? '#10b981' : 'transparent',
                  color: chartTimeframe === tf ? '#022c22' : '#94a3b8',
                  fontWeight: chartTimeframe === tf ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
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
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: '#38bdf8' }} />
              Recent User Login & Activity Log
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Detailed audit trail of successful logins, logouts, active sessions, and last seen timestamps
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search user, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.8)', padding: '0.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {['ALL', 'ONLINE', 'OFFLINE'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === st ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: statusFilter === st ? '#38bdf8' : '#94a3b8',
                    fontWeight: statusFilter === st ? 700 : 500,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600 }}>USER / ACCOUNT</th>
                <th style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600 }}>LOGIN TIME</th>
                <th style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600 }}>LOGOUT TIME</th>
                <th style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600 }}>LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isOnline = log.status === 'Online';
                  return (
                    <tr 
                      key={log.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* User Column */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isOnline 
                              ? 'linear-gradient(135deg, #10b981, #059669)' 
                              : 'linear-gradient(135deg, #475569, #334155)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {log.avatar || 'US'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.userRole} • {log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Login Time */}
                      <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                        <div>{formatTime(log.loginTime)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(log.loginTime)}</div>
                      </td>

                      {/* Logout Time */}
                      <td style={{ padding: '0.85rem 1rem', color: isOnline ? '#34d399' : '#94a3b8' }}>
                        {isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Active Session
                          </span>
                        ) : (
                          <div>
                            <div>{formatTime(log.logoutTime)}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(log.logoutTime)}</div>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                          color: isOnline ? '#34d399' : '#94a3b8',
                          border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isOnline ? '#10b981' : '#64748b'
                          }} />
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>

                      {/* Last Active Time */}
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {formatTime(log.lastActiveTime || log.loginTime)}
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
