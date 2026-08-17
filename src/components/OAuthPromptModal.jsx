import React, { useState } from 'react';
import { X, Mail, User, Shield, Check, ArrowRight, KeyRound } from 'lucide-react';

const PRESET_ACCOUNTS = {
  Google: [
    { name: 'Alex Morgan', email: 'alex.morgan@gmail.com', role: 'Senior Data Lead', avatar: 'AM' },
    { name: 'Sathya Sai Kumar', email: 'sathyasaikumar.dev@gmail.com', role: 'Executive Lead Developer', avatar: 'SK' },
    { name: 'Corporate Account', email: 'admin@corporate.com', role: 'Executive Admin', avatar: 'CA' },
    { name: 'Sarah Jenkins', email: 'sarah.jenkins@gmail.com', role: 'Department Director', avatar: 'SJ' },
    { name: 'Dev Lead', email: 'developer@workspace.org', role: 'Data Engineer', avatar: 'DL' }
  ],
  'Microsoft 365': [
    { name: 'Sarah Jenkins', email: 'sarah.jenkins@company.com', role: 'Department Director', avatar: 'SJ' },
    { name: 'Enterprise Admin', email: 'admin@corporate.com', role: 'Workforce Director', avatar: 'EA' }
  ],
  GitHub: [
    { name: 'David Chen', email: 'david.chen@github.com', role: 'Senior Software Engineer', avatar: 'DC' },
    { name: 'Analyst Dev', email: 'analyst@github.io', role: 'Data Specialist', avatar: 'AD' }
  ],
  'Enterprise SAML SSO': [
    { name: 'Corporate Executive', email: 'executive@enterprise.org', role: 'Department Director', avatar: 'CE' },
    { name: 'SSO Federated Lead', email: 'sso.admin@okta.domain', role: 'System Lead', avatar: 'SS' }
  ]
};

export default function OAuthPromptModal({ isOpen, provider, loginFn, onClose, onSuccess }) {
  const [selectedOption, setSelectedOption] = useState('preset-0'); // 'preset-0' | 'preset-1' | ... | 'custom'
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !provider) return null;

  const presets = PRESET_ACCOUNTS[provider] || [
    { name: 'Corporate Account', email: 'user@corporate.com', role: 'Authorized User', avatar: 'CU' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let accountToUse = null;

    if (selectedOption.startsWith('preset-')) {
      const idx = parseInt(selectedOption.split('-')[1], 10);
      accountToUse = presets[idx];
    } else {
      // Custom entry
      if (!customEmail || !customEmail.includes('@')) {
        setError(`Please enter a valid ${provider} account email address.`);
        return;
      }
      accountToUse = {
        email: customEmail.trim().toLowerCase(),
        name: customName.trim() || customEmail.split('@')[0],
        role: 'Verified Enterprise User'
      };
    }

    setIsSubmitting(true);

    try {
      const user = await loginFn(accountToUse);
      onSuccess(user, provider);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to authenticate with ${provider}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="oauth-prompt-backdrop" onClick={onClose}>
      <div className="oauth-prompt-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="oauth-prompt-header">
          <div className="oauth-prompt-brand">
            <img src="/logo.png" alt="Sathya Logo" className="modal-gold-logo" style={{ height: '18px', objectFit: 'contain' }} />
            <div className="oauth-provider-badge">
              {provider === 'Google' && (
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              {provider === 'Microsoft 365' && (
                <svg width="14" height="14" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
              )}
              {provider === 'GitHub' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              )}
              {provider === 'Enterprise SAML SSO' && <KeyRound size={14} className="text-accent-cyan" />}
              <span>{provider} Sign In</span>
            </div>
          </div>

          <button type="button" className="auth-close-btn" onClick={onClose} title="Close prompt" style={{ width: '24px', height: '24px' }}>
            <X size={14} />
          </button>
        </div>

        <h3 className="oauth-prompt-title">Choose an account to continue</h3>
        <p className="oauth-prompt-subtitle">
          Select your registered {provider} account or enter a custom account email.
        </p>

        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: '0.65rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="oauth-prompt-form">
          <div className="oauth-accounts-list">
            {presets.map((acc, index) => {
              const optKey = `preset-${index}`;
              const isSelected = selectedOption === optKey;
              return (
                <div
                  key={acc.email}
                  className={`oauth-account-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(optKey)}
                >
                  <div className="account-avatar">{acc.avatar}</div>
                  <div className="account-info">
                    <h4 className="account-name">{acc.name}</h4>
                    <p className="account-email">{acc.email}</p>
                  </div>
                  <div className="account-radio">
                    {isSelected && <Check size={14} className="text-accent-blue" strokeWidth={2.5} />}
                  </div>
                </div>
              );
            })}

            <div
              className={`oauth-account-card ${selectedOption === 'custom' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('custom')}
            >
              <div className="account-avatar custom-avatar">
                <Mail size={13} />
              </div>
              <div className="account-info">
                <h4 className="account-name">Use another account...</h4>
                <p className="account-email">Enter custom email address</p>
              </div>
              <div className="account-radio">
                {selectedOption === 'custom' && <Check size={14} className="text-accent-blue" strokeWidth={2.5} />}
              </div>
            </div>
          </div>

          {selectedOption === 'custom' && (
            <div className="custom-account-inputs animate-fadeIn">
              <div className="auth-field-group">
                <label className="auth-label">{provider} Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" size={14} />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder={`user@${provider.toLowerCase().replace(/\s+/g, '')}.com`}
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group" style={{ marginTop: '0.45rem' }}>
                <label className="auth-label">Account Name (Optional)</label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={14} />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Jordan Lee"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="oauth-prompt-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              <span>Continue to Workspace</span>
              <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
