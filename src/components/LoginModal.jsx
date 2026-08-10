import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Lock, KeyRound, X, CheckCircle, AlertCircle, Sparkles, Shield, ArrowRight, RefreshCw, User, Briefcase, UserPlus, LogIn } from 'lucide-react';
import { 
  loginWithEmail, loginWithPhone, registerWithEmail, 
  registerWithPhone, loginWithGoogle, loginWithMicrosoft, 
  loginWithGitHub, loginWithSSO, DEMO_ACCOUNTS 
} from '../utils/auth';

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

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
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

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

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
          onClose();
        }, 600);
      } else {
        const user = await loginWithEmail(email, password);
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
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
          onClose();
        }, 600);
      } else {
        const user = await loginWithPhone(countryCode, phone, otp);
        setSuccessMessage(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
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
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card unique-model-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="unique-sathya-badge">
            <img src="/logo.png" alt="Sathya Logo" className="unique-sathya-logo-img" />
            <span className="unique-badge-text">SATHYA ENTERPRISE SECURITY</span>
            <span className="unique-pulse-dot" title="Active Security Node"></span>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
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
      </div>
    </div>
  );
}
