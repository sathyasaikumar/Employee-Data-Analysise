import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Phone, Lock, KeyRound, CheckCircle, AlertCircle, Sparkles,
  Shield, ShieldCheck, ArrowRight, RefreshCw, User, Briefcase, UserPlus, LogIn,
  TrendingUp, BarChart2, Users, Settings, Eye, EyeOff, Sun, Moon, ArrowUpRight, X
} from 'lucide-react';
import {
  loginWithEmail, loginWithPhone, registerWithEmail,
  registerWithPhone, resetPassword, loginWithGoogle, loginWithMicrosoft,
  loginWithGitHub, loginWithSSO, DEMO_ACCOUNTS
} from '../utils/auth';
import OAuthPromptModal from './OAuthPromptModal';
import SathyaLogo from './SathyaLogo';

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' }
];

const ROLES = [
  'Senior Data Lead',
  'Workforce Manager',
  'Data Analyst',
  'Department Director',
  'Software Engineer',
  'Operations Lead',
  'Executive Specialist'
];

export default function LoginPage({ onLoginSuccess, onGuestAccess, theme = 'dark', onToggleTheme }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'phone'
  const [rememberMe, setRememberMe] = useState(true);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(ROLES[0]);

  // Phone form state
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotIsOtpSent, setForgotIsOtpSent] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [oauthPrompt, setOauthPrompt] = useState({ isOpen: false, provider: '', loginFn: null });

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Forgot OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpTimer]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      let user;
      if (authMode === 'login') {
        user = await loginWithEmail(email, password);
        setSuccessMessage('Welcome back! Logging you in...');
      } else {
        user = await registerWithEmail({ name: fullName, email, password, role });
        setSuccessMessage('Account registered successfully! Logging you in...');
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 5) {
      setError('Please enter a valid mobile number first.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const fullPhone = `${countryCode} ${phone.trim()}`;
      const clean = phone.replace(/[^0-9]/g, '');

      const mockOtp = clean === DEMO_ACCOUNTS.phone.number ? DEMO_ACCOUNTS.phone.otp : '654321';
      setOtp(mockOtp);
      setIsOtpSent(true);
      setOtpTimer(60);
      setSuccessMessage(`OTP sent to ${fullPhone}! Your verification code is: ${mockOtp}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isOtpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp || otp.trim().length === 0) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      let user;
      if (authMode === 'login') {
        user = await loginWithPhone(countryCode, phone, otp);
        setSuccessMessage('Mobile verified! Entering dashboard...');
      } else {
        user = await registerWithPhone({ name: fullName || `User ${phone.slice(-4)}`, countryCode, phone, role, otp });
        setSuccessMessage('Registration successful! Entering dashboard...');
      }

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 700);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotIdentifier(activeTab === 'email' ? email : phone);
    setForgotError('');
    setForgotSuccess('');
    setForgotOtp('');
    setForgotIsOtpSent(false);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  const handleSendForgotOtp = () => {
    if (!forgotIdentifier || forgotIdentifier.trim().length < 3) {
      setForgotError('Please enter your registered email address or mobile number.');
      return;
    }
    setForgotError('');
    const mockOtp = '654321';
    setForgotOtp(mockOtp);
    setForgotIsOtpSent(true);
    setForgotOtpTimer(60);
    setForgotSuccess(`Verification code dispatched to ${forgotIdentifier}! Code: ${mockOtp}`);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotIsOtpSent) {
      handleSendForgotOtp();
      return;
    }

    if (!forgotOtp || forgotOtp.trim().length === 0) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const user = await resetPassword({ identifier: forgotIdentifier, otp: forgotOtp, newPassword: forgotNewPassword });
      setForgotSuccess('Password updated successfully! Entering dashboard...');
      setTimeout(() => {
        setShowForgotPassword(false);
        if (onLoginSuccess) onLoginSuccess(user);
      }, 800);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please verify your details.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSocialClick = (provider, loginFn) => {
    setError('');
    setOauthPrompt({ isOpen: true, provider, loginFn });
  };

  const handleOAuthSuccess = (user) => {
    setSuccessMessage(`Connected with ${user.provider || user.authMethod || 'Provider'}! Redirecting...`);
    setTimeout(() => {
      if (onLoginSuccess) onLoginSuccess(user);
    }, 600);
  };

  const toggleAuthMode = () => {
    setError('');
    setSuccessMessage('');
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="apex-login-page">
      {/* Background Animated Glow Mesh & Neon Particle Waves */}
      <div className="apex-bg-glow apex-glow-1" />
      <div className="apex-bg-glow apex-glow-2" />
      <div className="apex-bg-curve-wave" />
      <div className="apex-neon-fiber-streaks">
        <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Flowing golden dotted wave matrix */}
          <g opacity="0.9">
            <path d="M -50 820 C 150 680, 320 880, 520 740 C 720 600, 850 780, 1100 660 C 1280 570, 1400 640, 1500 560" stroke="url(#goldStreak1)" strokeWidth="2.5" strokeDasharray="3 6" filter="url(#streakGlow)" />
            <path d="M -50 850 C 160 710, 340 910, 540 770 C 740 630, 870 810, 1120 690 C 1300 600, 1420 670, 1500 590" stroke="url(#goldStreak1)" strokeWidth="2" strokeDasharray="2 5" filter="url(#streakGlow)" />
            <path d="M -50 880 C 170 740, 360 940, 560 800 C 760 660, 890 840, 1140 720 C 1320 630, 1440 700, 1500 620" stroke="url(#goldStreak2)" strokeWidth="2" strokeDasharray="3 7" filter="url(#streakGlow)" />
            <path d="M -50 910 C 180 770, 380 970, 580 830 C 780 690, 910 870, 1160 750 C 1340 660, 1460 730, 1500 650" stroke="url(#goldStreak2)" strokeWidth="2" strokeDasharray="2 6" filter="url(#streakGlow)" />
            <path d="M -50 760 C 140 630, 300 830, 500 700 C 700 570, 830 740, 1080 630 C 1250 540, 1380 600, 1500 520" stroke="url(#goldStreak3)" strokeWidth="3" opacity="0.6" filter="url(#streakGlow)" />
          </g>
          <defs>
            <linearGradient id="goldStreak1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#d97706" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="goldStreak2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#fde047" stopOpacity="1" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="goldStreak3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400e" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
            </linearGradient>
            <filter id="streakGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Top Navbar Actions */}
      <header className="apex-top-navbar">
        <div className="apex-nav-brand-mobile">
          <img
            src="/gold_crest_logo.png"
            alt="Corporate Access & Intelligence"
            className="brand-gold-logo"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain' }}
          />
          <span className="apex-mobile-title">
            <span style={{ color: '#ffffff', fontWeight: 800 }}>Corporate </span>
            <span className="gold-accent-text">Access </span>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>&amp; Intelligence</span>
          </span>
        </div>

        <div className="apex-top-actions">
          <button
            className="apex-btn-ghost theme-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} style={{ color: '#f59e0b' }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} style={{ color: '#6366f1' }} />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: 3-Section Layout Matching Reference Image */}
      <main className="apex-main-layout">
        {/* Column 1: Brand Showcase & 4 Badges */}
        <section className="apex-showcase-column">
          {/* Brand Header */}
          <div className="apex-brand-header">
            <div className="gold-logo-box">
              <img
                src="/gold_crest_logo.png"
                alt="Corporate Access & Intelligence"
                className="gold-logo-img"
              />
            </div>
            <div>
              <h1 className="corporate-brand-name">Corporate Access &amp; Intelligence</h1>
              <p className="corporate-brand-tagline">Enterprise Workforce &amp; Data Analytics</p>
            </div>
          </div>

          {/* Hero Headlines */}
          <div className="apex-hero-headlines">
            <h2 className="apex-headline-text">
              <span className="headline-line-1">Smart Management.</span>
              <span className="headline-line-2">
                Better <span className="gold-accent-text" style={{ color: '#f59e0b' }}>Decisions.</span>
              </span>
            </h2>
            <div className="blue-horizon-glow-line" />
            <p className="apex-headline-desc">
              A powerful dashboard to manage users, projects, analytics, and system operations in one place.
            </p>
          </div>

          {/* 4 Feature Badges List */}
          <div className="apex-features-list">
            <div className="apex-feature-row">
              <div className="apex-feature-badge-box badge-gold-circle">
                <Shield size={26} />
              </div>
              <div>
                <h4 className="apex-feature-title">Secure &amp; Reliable</h4>
                <p className="apex-feature-subtitle">Enterprise-grade security for complete peace of mind.</p>
              </div>
            </div>

            <div className="apex-feature-row">
              <div className="apex-feature-badge-box badge-gold-circle">
                <BarChart2 size={26} />
              </div>
              <div>
                <h4 className="apex-feature-title">Analytics Overview</h4>
                <p className="apex-feature-subtitle">Real-time insights &amp; reports that drive performance.</p>
              </div>
            </div>

            <div className="apex-feature-row">
              <div className="apex-feature-badge-box badge-gold-circle">
                <User size={26} />
              </div>
              <div>
                <h4 className="apex-feature-title">User Management</h4>
                <p className="apex-feature-subtitle">Manage roles, permissions and team activities seamlessly.</p>
              </div>
            </div>

            <div className="apex-feature-row">
              <div className="apex-feature-badge-box badge-gold-circle">
                <Settings size={26} />
              </div>
              <div>
                <h4 className="apex-feature-title">System Control</h4>
                <p className="apex-feature-subtitle">Monitor and manage system operations efficiently.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Column 2: 3D Dashboard Mockup Card */}
        <section className="apex-mockup-column">
          <div className="apex-mockup-wrapper">
            <div className="apex-mockup-card gold-mockup-card">
              <div className="mockup-body-split">
                {/* Left Mini Sidebar */}
                <div className="mockup-mini-sidebar">
                  <div className="mockup-gold-crest">
                    <img src="/gold_crest_logo.png" alt="S" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                  </div>
                  <div className="mockup-side-icon-btn active-gold" title="Dashboard">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  </div>
                  <div className="mockup-side-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <div className="mockup-side-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                  </div>
                  <div className="mockup-side-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                  </div>
                  <div className="mockup-side-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  </div>
                  <div className="mockup-side-icon-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                </div>

                {/* Main Mini Dashboard Area */}
                <div className="mockup-main-area">
                  {/* Top Header */}
                  <div className="mockup-header-row">
                    <div className="mockup-title-tab">
                      <span>Dashboard</span>
                    </div>
                  </div>

                  {/* Row 1: Users & Projects Stats */}
                  <div className="mockup-cards-row">
                    <div className="mockup-stat-card">
                      <div className="mockup-stat-label">Total Users</div>
                      <div className="mockup-stat-val-row">
                        <span className="mockup-stat-num">1,248</span>
                        <span className="mockup-stat-badge">↑ 12.5%</span>
                      </div>
                      <div className="mockup-stat-sub">vs last month</div>
                    </div>

                    <div className="mockup-stat-card">
                      <div className="mockup-stat-label">Active Projects</div>
                      <div className="mockup-stat-val-row">
                        <span className="mockup-stat-num">86</span>
                        <span className="mockup-stat-badge">↑ 8.1%</span>
                      </div>
                      <div className="mockup-stat-sub">vs last month</div>
                    </div>
                  </div>

                  {/* Row 2: Analytics Overview Line Chart */}
                  <div className="mockup-analytics-box">
                    <div className="mockup-analytics-header">
                      <span>Analytics Overview</span>
                      <span className="mockup-timeframe-pill">This Month ▾</span>
                    </div>
                    <div className="mockup-chart-grid">
                      <div className="mockup-y-axis">
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                        <span>0</span>
                      </div>
                      <div className="mockup-chart-canvas">
                        <svg viewBox="0 0 240 75" className="mockup-wave-svg">
                          <defs>
                            <linearGradient id="goldGlowWave" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 10 65 L 45 52 L 80 58 L 115 38 L 150 48 L 185 24 L 230 30 L 230 75 L 10 75 Z" fill="url(#goldGlowWave)" />
                          <path d="M 10 65 L 45 52 L 80 58 L 115 38 L 150 48 L 185 24 L 230 30" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="10" cy="65" r="3" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="45" cy="52" r="3" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="80" cy="58" r="3" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="115" cy="38" r="3.5" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="150" cy="48" r="3" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="185" cy="24" r="4" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                          <circle cx="230" cy="30" r="3" fill="#fbbf24" stroke="#060914" strokeWidth="1" />
                        </svg>
                      </div>
                    </div>
                    <div className="mockup-x-axis">
                      <span>01</span>
                      <span>05</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>30</span>
                    </div>
                  </div>

                  {/* Row 3: Department Distribution Donut */}
                  <div className="mockup-donut-card-full">
                    <div className="mockup-donut-header">Department Distribution</div>
                    <div className="mockup-donut-body">
                      <div className="donut-chart-container">
                        <div className="donut-ring-multi">
                          <div className="donut-center-text">
                            <span className="donut-big-num">1,248</span>
                            <span className="donut-small-lbl">Total</span>
                          </div>
                        </div>
                      </div>
                      <div className="mockup-dept-list">
                        <div className="country-row"><span className="c-dot dot-blue"></span> Engineering <span className="c-pct">35% (437)</span></div>
                        <div className="country-row"><span className="c-dot dot-cyan"></span> Marketing <span className="c-pct">20% (250)</span></div>
                        <div className="country-row"><span className="c-dot dot-amber"></span> HR <span className="c-pct">15% (187)</span></div>
                        <div className="country-row"><span className="c-dot dot-purple"></span> Finance <span className="c-pct">15% (187)</span></div>
                        <div className="country-row"><span className="c-dot dot-pink"></span> Sales <span className="c-pct">15% (187)</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Recent Activity & System Status Side-by-Side */}
                  <div className="mockup-cards-row row-4-split">
                    <div className="mockup-activity-table">
                      <div className="mockup-activity-header">Recent Activity</div>
                      <div className="mockup-activity-row">
                        <div className="act-desc">
                          <span className="act-icon-dot bg-blue"></span>
                          <span>New user registered</span>
                        </div>
                        <span className="act-time">10:30 AM</span>
                      </div>
                      <div className="mockup-activity-row">
                        <div className="act-desc">
                          <span className="act-icon-dot bg-amber"></span>
                          <span>Project created</span>
                        </div>
                        <span className="act-time">09:15 AM</span>
                      </div>
                      <div className="mockup-activity-row">
                        <div className="act-desc">
                          <span className="act-icon-dot bg-purple"></span>
                          <span>Report generated</span>
                        </div>
                        <span className="act-time">Yesterday</span>
                      </div>
                      <div className="mockup-activity-row">
                        <div className="act-desc">
                          <span className="act-icon-dot bg-gold"></span>
                          <span>Backup completed</span>
                        </div>
                        <span className="act-time">2 days ago</span>
                      </div>
                    </div>

                    <div className="mockup-status-table">
                      <div className="mockup-status-header">System Status</div>
                      <div className="mockup-status-row">
                        <div className="status-name-group">
                          <span className="status-indicator-dot dot-green"></span>
                          <span>Server Status</span>
                        </div>
                        <span className="status-operational-badge">Operational</span>
                      </div>
                      <div className="mockup-status-row">
                        <div className="status-name-group">
                          <span className="status-indicator-dot dot-green"></span>
                          <span>Database</span>
                        </div>
                        <span className="status-operational-badge">Operational</span>
                      </div>
                      <div className="mockup-status-row">
                        <div className="status-name-group">
                          <span className="status-indicator-dot dot-green"></span>
                          <span>API Services</span>
                        </div>
                        <span className="status-operational-badge">Operational</span>
                      </div>
                      <div className="mockup-status-row">
                        <div className="status-name-group">
                          <span className="status-indicator-dot dot-green"></span>
                          <span>Backup System</span>
                        </div>
                        <span className="status-operational-badge">Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Column 3: The Luxury Gold & Blue Auth Card */}
        <section className="apex-auth-column">
          <div className="apex-auth-card gold-auth-card">
            {/* Glowing Top Center Gold Emblem on Card */}
            <div className="apex-auth-card-emblem gold-crest-emblem">
              <img
                src="/gold_emblem_card.png"
                alt="Corporate Access & Intelligence"
                className="apex-card-emblem-gold-img"
              />
            </div>

            <h2 className="apex-auth-title">
              {authMode === 'login' ? (
                <>
                  <span>Welcome </span>
                  <span className="gold-welcome-text" style={{ color: '#f59e0b', marginLeft: '4px' }}>Back!</span>
                </>
              ) : (
                <>
                  <span>Create </span>
                  <span className="gold-welcome-text" style={{ color: '#f59e0b', marginLeft: '4px' }}>Account</span>
                </>
              )}
            </h2>
            <p className="apex-auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to continue to your dashboard'
                : 'Enter your credentials to register a new account'}
            </p>

            {/* Email vs Phone Tab Selector */}
            <div className="apex-tabs-container">
              <button
                type="button"
                className={`apex-tab-button ${activeTab === 'email' ? 'active-gold' : ''}`}
                onClick={() => {
                  setActiveTab('email');
                  setError('');
                }}
              >
                <Mail size={15} />
                <span>Email Address</span>
              </button>

              <button
                type="button"
                className={`apex-tab-button ${activeTab === 'phone' ? 'active-gold' : ''}`}
                onClick={() => {
                  setActiveTab('phone');
                  setError('');
                }}
              >
                <Phone size={15} />
                <span>Mobile Number</span>
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="apex-alert apex-alert-error">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="apex-alert apex-alert-success">
                <CheckCircle size={17} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Login Form */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="apex-form">
                {authMode === 'register' && (
                  <div className="apex-fields-row-2">
                    <div className="apex-field">
                      <label className="apex-label">Full Name</label>
                      <div className="apex-input-box">
                        <User className="apex-icon-left" size={15} />
                        <input
                          type="text"
                          className="apex-input"
                          placeholder="Alex Morgan"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="apex-field">
                      <label className="apex-label">Corporate Role</label>
                      <div className="apex-input-box">
                        <Briefcase className="apex-icon-left" size={15} />
                        <select
                          className="apex-input apex-select"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="apex-field">
                  <label className="apex-label">Email Address</label>
                  <div className="apex-input-box">
                    <Mail className="apex-icon-left" size={17} />
                    <input
                      type="email"
                      className="apex-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="apex-field">
                  <label className="apex-label">Password</label>
                  <div className="apex-input-box">
                    <Lock className="apex-icon-left" size={17} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="apex-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="apex-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="apex-form-options">
                  <label className="apex-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="apex-checkbox"
                    />
                    <span className="apex-checkbox-text">
                      {authMode === 'register' ? 'I agree to Terms & Conditions' : 'Remember me'}
                    </span>
                  </label>

                  {authMode === 'login' && (
                    <button
                      type="button"
                      className="apex-forgot-btn"
                      onClick={handleForgotPassword}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <button type="submit" className="apex-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Login Form */}
            {activeTab === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="apex-form">
                {authMode === 'register' && (
                  <div className="apex-fields-row-2">
                    <div className="apex-field">
                      <label className="apex-label">Full Name</label>
                      <div className="apex-input-box">
                        <User className="apex-icon-left" size={15} />
                        <input
                          type="text"
                          className="apex-input"
                          placeholder="Sarah Jenkins"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="apex-field">
                      <label className="apex-label">Corporate Role</label>
                      <div className="apex-input-box">
                        <Briefcase className="apex-icon-left" size={15} />
                        <select
                          className="apex-input apex-select"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="apex-field">
                  <label className="apex-label">Phone Number</label>
                  <div className="apex-phone-group">
                    <select
                      className="apex-country-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>

                    <div className="apex-input-box flex-1">
                      <Phone className="apex-icon-left" size={17} />
                      <input
                        type="tel"
                        className="apex-input"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="apex-field">
                  <div className="apex-label-flex">
                    <label className="apex-label">Verification OTP</label>
                    <button
                      type="button"
                      className="apex-otp-resend"
                      onClick={handleSendOtp}
                      disabled={otpTimer > 0}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : isOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>

                  <div className="apex-input-box">
                    <KeyRound className="apex-icon-left" size={17} />
                    <input
                      type="text"
                      maxLength={6}
                      className="apex-input apex-otp-code-input"
                      placeholder="6-Digit OTP Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="apex-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Social Divider */}
            <div className="apex-divider">
              <span>or continue with</span>
            </div>

            {/* Social SSO Grid */}
            <div className="apex-social-grid">
              <button
                type="button"
                className="apex-social-card"
                onClick={() => handleSocialClick('Google', loginWithGoogle)}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="apex-social-card"
                onClick={() => handleSocialClick('Microsoft 365', loginWithMicrosoft)}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span>Continue with Microsoft</span>
              </button>
            </div>

            {/* Bottom Footer Switcher */}
            <div className="apex-auth-bottom">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" className="apex-accent-link" onClick={toggleAuthMode}>
                    Sign up here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" className="apex-accent-link" onClick={toggleAuthMode}>
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="apex-page-footer">
        <p>© 2026 Corporate Access &amp; Intelligence. All rights reserved.</p>
      </footer>

      {/* OAuth Prompt Modal */}
      <OAuthPromptModal
        isOpen={oauthPrompt.isOpen}
        provider={oauthPrompt.provider}
        loginFn={oauthPrompt.loginFn}
        onClose={() => setOauthPrompt({ isOpen: false, provider: '', loginFn: null })}
        onSuccess={handleOAuthSuccess}
      />

      {/* Forgot Password Recovery Modal */}
      {showForgotPassword && (
        <div className="oauth-prompt-backdrop" onClick={() => setShowForgotPassword(false)}>
          <div className="oauth-prompt-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="oauth-prompt-header">
              <div className="oauth-provider-badge">
                <KeyRound size={14} className="text-amber-400" />
                <span>Password Recovery</span>
              </div>
              <button
                type="button"
                className="auth-close-btn"
                onClick={() => setShowForgotPassword(false)}
                title="Close"
                style={{ width: '24px', height: '24px' }}
              >
                <X size={14} />
              </button>
            </div>

            <h3 className="oauth-prompt-title">Reset Your Password</h3>
            <p className="oauth-prompt-subtitle">
              Enter your registered email or mobile number to receive a verification code and reset your password.
            </p>

            {forgotError && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.45rem', borderRadius: '6px', fontSize: '0.65rem' }}>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="auth-alert auth-alert-success" style={{ marginBottom: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.45rem', borderRadius: '6px', fontSize: '0.65rem' }}>
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="oauth-prompt-form">
              <div className="custom-account-inputs" style={{ marginBottom: '0.65rem', padding: '0.6rem' }}>
                <div className="auth-field-group">
                  <label className="auth-label" style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Registered Email or Phone</label>
                  <div className="apex-input-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', height: '28px', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                    <Mail size={13} style={{ marginRight: '0.4rem', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="apex-input"
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: '#ffffff', fontSize: '0.68rem', width: '100%' }}
                      placeholder="e.g. admin@corporate.com or 9876543210"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-group" style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label className="auth-label" style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>6-Digit OTP Code</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: '0.60rem', cursor: 'pointer', fontWeight: 700 }}
                      onClick={handleSendForgotOtp}
                      disabled={forgotOtpTimer > 0}
                    >
                      {forgotOtpTimer > 0 ? `Resend in ${forgotOtpTimer}s` : forgotIsOtpSent ? 'Resend OTP' : 'Send Code'}
                    </button>
                  </div>
                  <div className="apex-input-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', height: '28px', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={13} style={{ marginRight: '0.4rem', color: '#94a3b8' }} />
                    <input
                      type="text"
                      maxLength={6}
                      className="apex-input"
                      style={{ border: 'none', background: 'transparent', outline: 'none', color: '#ffffff', fontSize: '0.68rem', width: '100%', letterSpacing: '2px' }}
                      placeholder="Enter 6-digit OTP code"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {forgotIsOtpSent && (
                  <>
                    <div className="auth-field-group" style={{ marginTop: '0.5rem' }}>
                      <label className="auth-label" style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>New Password</label>
                      <div className="apex-input-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', height: '28px', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <Lock size={13} style={{ marginRight: '0.4rem', color: '#94a3b8' }} />
                        <input
                          type="password"
                          className="apex-input"
                          style={{ border: 'none', background: 'transparent', outline: 'none', color: '#ffffff', fontSize: '0.68rem', width: '100%' }}
                          placeholder="At least 6 characters"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-group" style={{ marginTop: '0.5rem' }}>
                      <label className="auth-label" style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Confirm New Password</label>
                      <div className="apex-input-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', height: '28px', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <Lock size={13} style={{ marginRight: '0.4rem', color: '#94a3b8' }} />
                        <input
                          type="password"
                          className="apex-input"
                          style={{ border: 'none', background: 'transparent', outline: 'none', color: '#ffffff', fontSize: '0.68rem', width: '100%' }}
                          placeholder="Re-enter new password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="oauth-prompt-actions" style={{ marginTop: '0.65rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPassword(false)}>
                  Cancel
                </button>
                <button type="submit" className="auth-submit-btn" disabled={isForgotLoading}>
                  <span>{forgotIsOtpSent ? 'Update & Sign In' : 'Verify & Continue'}</span>
                  <ArrowRight size={13} strokeWidth={2.2} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌐 Interactive Google / Microsoft / Browser OAuth Handshake Modal */}
      {oauthPrompt.isOpen && (
        <OAuthPromptModal
          isOpen={oauthPrompt.isOpen}
          provider={oauthPrompt.provider}
          loginFn={oauthPrompt.loginFn}
          onClose={() => setOauthPrompt({ isOpen: false, provider: '', loginFn: null })}
          onSuccess={handleOAuthSuccess}
        />
      )}
    </div>
  );
}
