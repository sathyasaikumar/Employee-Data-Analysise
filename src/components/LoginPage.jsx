import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Phone, Lock, KeyRound, CheckCircle, AlertCircle, Sparkles, 
  Shield, ArrowRight, RefreshCw, User, Briefcase, UserPlus, LogIn, 
  BarChart3, Cpu, Database, Award, ShieldCheck, Sun, Moon, ArrowUpRight
} from 'lucide-react';
import { 
  loginWithEmail, loginWithPhone, registerWithEmail, 
  registerWithPhone, loginWithGoogle, loginWithMicrosoft, 
  loginWithGitHub, loginWithSSO, DEMO_ACCOUNTS 
} from '../utils/auth';
import OAuthPromptModal from './OAuthPromptModal';

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

  // Registration & Common fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(ROLES[0]);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Status & feedback
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // OAuth prompt modal state
  const [oauthPrompt, setOauthPrompt] = useState({ isOpen: false, provider: '', loginFn: null });

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSocialClick = (providerName, loginFn) => {
    setError('');
    setOauthPrompt({
      isOpen: true,
      provider: providerName,
      loginFn
    });
  };

  const handleOAuthSuccess = (user, providerName) => {
    setSuccessMessage(`Authenticated via ${user.provider || providerName}! Welcome, ${user.name}!`);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 600);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        const user = await registerWithEmail({ name: fullName, email, role, password });
        setSuccessMessage(`Account created! Welcome, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      } else {
        const user = await loginWithEmail(email, password);
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        const user = await registerWithPhone({ name: fullName, countryCode, phone, role, otp });
        setSuccessMessage(`Account created! Welcome, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      } else {
        const user = await loginWithPhone(countryCode, phone, otp);
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = () => {
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 7) {
      setError('Please enter a valid phone number before requesting OTP.');
      return;
    }

    setOtpSent(true);
    setOtpCountdown(30);

    if (clean === DEMO_ACCOUNTS.phone.number) {
      setOtp(DEMO_ACCOUNTS.phone.otp);
    } else {
      setOtp('123456');
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFillDemoEmail = () => {
    setAuthMode('login');
    setActiveTab('email');
    setEmail(DEMO_ACCOUNTS.email.identifier);
    setPassword(DEMO_ACCOUNTS.email.password);
    setError('');
  };

  const handleFillDemoPhone = () => {
    setAuthMode('login');
    setActiveTab('phone');
    setCountryCode(DEMO_ACCOUNTS.phone.countryCode);
    setPhone(DEMO_ACCOUNTS.phone.number);
    setOtp(DEMO_ACCOUNTS.phone.otp);
    setOtpSent(true);
    setError('');
  };

  const toggleAuthMode = () => {
    setError('');
    setSuccessMessage('');
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="full-login-page">
      {/* Background Animated Glow Orbs */}
      <div className="ambient-glow-orb ambient-orb-1" />
      <div className="ambient-glow-orb ambient-orb-2" />

      {/* Top Navbar */}
      <header className="full-login-navbar">
        <div className="full-login-brand">
          <div className="brand-icon-wrapper">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="brand-title">Corporate Access & Intelligence</h1>
            <p className="brand-subtitle">Enterprise Data System</p>
          </div>
        </div>

        <div className="full-login-nav-actions">
          {onGuestAccess && (
            <button 
              className="btn btn-secondary guest-mode-btn"
              onClick={onGuestAccess}
              title="Explore dataset dashboard as guest user"
            >
              <span>Explore Demo Dashboard</span>
              <ArrowUpRight size={16} />
            </button>
          )}

          <button 
            className="btn btn-secondary theme-toggle-btn"
            onClick={onToggleTheme}
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
        </div>
      </header>

      {/* Main Full Page Body Grid */}
      <main className="full-login-body">
        {/* Left Side: Enterprise Showcase Hero */}
        <section className="full-login-hero">
          <div className="hero-badge">
            <ShieldCheck size={16} className="text-accent-blue" />
            <span>Enterprise Security & Workforce Analytics v2.4</span>
          </div>

          <h1 className="hero-headline">
            Enterprise Workforce Metrics & Multi-Million Row Intelligence
          </h1>
          <p className="hero-description">
            Process massive datasets in real-time with browser-level multithreading, zero-trust enterprise security, and interactive statistical analytics.
          </p>

          {/* Feature Badges Grid */}
          <div className="hero-feature-grid">
            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Shield size={20} className="text-accent-blue" />
              </div>
              <div>
                <h4 className="feature-title">Zero-Trust Authentication</h4>
                <p className="feature-desc">Dual-factor email & SMS verification with role governance</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Cpu size={20} className="text-accent-cyan" />
              </div>
              <div>
                <h4 className="feature-title">High-Speed WebWorker Engine</h4>
                <p className="feature-desc">Chunk-based parsing for 5,000,000+ rows without UI blocking</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <BarChart3 size={20} className="text-accent-emerald" />
              </div>
              <div>
                <h4 className="feature-title">Custom Visual Studio</h4>
                <p className="feature-desc">Dynamic chart generator with multi-axis correlation graphs</p>
              </div>
            </div>

            <div className="hero-feature-card">
              <div className="feature-icon-box">
                <Database size={20} className="text-accent-amber" />
              </div>
              <div>
                <h4 className="feature-title">Automated Health Profiling</h4>
                <p className="feature-desc">Statistical anomaly detection, score calculation & data cleaning</p>
              </div>
            </div>
          </div>

          {/* Live System Metrics Bar */}
          <div className="hero-metrics-bar">
            <div className="metric-item">
              <span className="metric-value">50M+</span>
              <span className="metric-label">Records Processed</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">256-bit</span>
              <span className="metric-label">AES Encryption</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">99.99%</span>
              <span className="metric-label">System Uptime</span>
            </div>
          </div>
        </section>

        {/* Right Side: High-Tech Login Card */}
        <section className="full-login-card-container">
          <div className="auth-modal-card full-page-card">
            {/* Header */}
            <div className="auth-modal-header">
              <div className="auth-brand-badge">
                <Shield size={18} className="text-accent-blue" />
                <span>Corporate Security</span>
              </div>
            </div>

            <h2 className="auth-modal-title">
              {authMode === 'login' ? 'Sign In to Dashboard' : 'Create New Account'}
            </h2>
            <p className="auth-modal-subtitle">
              {authMode === 'login'
                ? 'Access enterprise workforce metrics & intelligence system'
                : 'Register for full corporate workforce & analytics access'}
            </p>

            {/* Tab Selection */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('email');
                  setError('');
                }}
              >
                <Mail size={16} />
                Email Address
              </button>

              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('phone');
                  setError('');
                }}
              >
                <Phone size={16} />
                Mobile Number
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="auth-alert auth-alert-success">
                <CheckCircle size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Form */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="auth-form">
                {authMode === 'register' && (
                  <>
                    <div className="auth-field-group">
                      <label className="auth-label">Full Name</label>
                      <div className="auth-input-wrapper">
                        <User className="auth-input-icon" size={18} />
                        <input
                          type="text"
                          className="auth-input"
                          placeholder="e.g. Alex Morgan"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-label">Corporate Role / Title</label>
                      <div className="auth-input-wrapper">
                        <Briefcase className="auth-input-icon" size={18} />
                        <select
                          className="auth-input auth-select"
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
                  </>
                )}

                <div className="auth-field-group">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="admin@corporate.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">
                    {authMode === 'register' ? 'Choose Password' : 'Password / Passcode'}
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Processing...
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <UserPlus size={18} /> Register & Sign In
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> Log In with Email
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Form */}
            {activeTab === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="auth-form">
                {authMode === 'register' && (
                  <>
                    <div className="auth-field-group">
                      <label className="auth-label">Full Name</label>
                      <div className="auth-input-wrapper">
                        <User className="auth-input-icon" size={18} />
                        <input
                          type="text"
                          className="auth-input"
                          placeholder="e.g. Sarah Jenkins"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-label">Corporate Role / Title</label>
                      <div className="auth-input-wrapper">
                        <Briefcase className="auth-input-icon" size={18} />
                        <select
                          className="auth-input auth-select"
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
                  </>
                )}

                <div className="auth-field-group">
                  <label className="auth-label">Mobile Phone Number</label>
                  <div className="auth-phone-row">
                    <select
                      className="auth-country-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>

                    <div className="auth-input-wrapper flex-1">
                      <Phone className="auth-input-icon" size={18} />
                      <input
                        type="tel"
                        className="auth-input"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-field-group">
                  <div className="auth-label-row">
                    <label className="auth-label">Verification OTP Code</label>
                    <button
                      type="button"
                      className="auth-otp-btn"
                      onClick={handleSendOTP}
                      disabled={otpCountdown > 0}
                    >
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>

                  <div className="auth-input-wrapper">
                    <KeyRound className="auth-input-icon" size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      className="auth-input auth-otp-input"
                      placeholder="6-Digit OTP Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Processing...
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <UserPlus size={18} /> Register & Sign In
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> Log In with Phone
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Toggle Login vs Register Footer Link */}
            <div className="auth-mode-toggle">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" className="auth-mode-link" onClick={toggleAuthMode}>
                    Register Now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" className="auth-mode-link" onClick={toggleAuthMode}>
                    Sign In
                  </button>
                </p>
              )}
            </div>

            {/* Social & OAuth Sign In Section */}
            <div className="auth-social-section">
              <div className="auth-divider">
                <span>OR SIGN IN WITH</span>
              </div>

              <button
                type="button"
                className="auth-social-btn auth-google-btn"
                onClick={() => handleSocialClick('Google', loginWithGoogle)}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="social-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="auth-social-grid">
                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleSocialClick('Microsoft 365', loginWithMicrosoft)}
                  disabled={isLoading}
                  title="Sign in with Microsoft 365 / Azure AD"
                >
                  <svg width="16" height="16" viewBox="0 0 23 23" className="social-icon">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H1z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>

                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleSocialClick('GitHub', loginWithGitHub)}
                  disabled={isLoading}
                  title="Sign in with GitHub Account"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </button>

                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={() => handleSocialClick('Enterprise SAML SSO', loginWithSSO)}
                  disabled={isLoading}
                  title="Sign in with Enterprise SAML / Okta SSO"
                >
                  <KeyRound size={16} className="text-accent-cyan social-icon" />
                  <span>SAML SSO</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Full Page Footer Compliance Badges */}
      <footer className="full-login-footer">
        <div className="footer-compliance">
          <span><Award size={14} className="inline mr-1 text-accent-blue" /> SOC2 Type II Certified</span>
          <span className="footer-dot">•</span>
          <span>ISO 27001 Security Standard</span>
          <span className="footer-dot">•</span>
          <span>GDPR Compliant Data Encryption</span>
        </div>
        <p className="footer-copy">© 2026 Enterprise Corporate Access Systems. All rights reserved.</p>
      </footer>

      {/* Interactive Provider Account Selector Modal */}
      <OAuthPromptModal 
        isOpen={oauthPrompt.isOpen}
        provider={oauthPrompt.provider}
        loginFn={oauthPrompt.loginFn}
        onClose={() => setOauthPrompt({ isOpen: false, provider: '', loginFn: null })}
        onSuccess={handleOAuthSuccess}
      />
    </div>
  );
}
