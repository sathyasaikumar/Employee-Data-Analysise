import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cookie, Shield, Check, Settings, X, Lock, Activity, HardDrive, Sparkles } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'corporate_cookie_consent_v1';

export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveCookieConsent(consentObj) {
  try {
    const data = {
      ...consentObj,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    return null;
  }
}

export default function CookieConsentBanner({ onOpenSettings }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    performance: true, // Memory worker & caching
    analytics: true, // Live session & traffic tracker
    functional: true // Local settings & theme
  });

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      // Delay entrance slightly for smooth visual animation
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsented = {
      essential: true,
      performance: true,
      analytics: true,
      functional: true,
      status: 'accepted_all'
    };
    saveCookieConsent(allConsented);
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    const essentialConsented = {
      essential: true,
      performance: false,
      analytics: false,
      functional: false,
      status: 'essential_only'
    };
    saveCookieConsent(essentialConsented);
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    const customConsented = {
      ...preferences,
      essential: true,
      status: 'customized'
    };
    saveCookieConsent(customConsented);
    setIsCustomizeOpen(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return createPortal(
    <>
      {/* Main Cookie Consent Floating Banner */}
      <div className="cookie-banner-container" role="dialog" aria-live="polite">
        <div className="cookie-banner-content">
          <div className="cookie-banner-left">
            <div className="cookie-icon-circle">
              <Cookie size={24} className="text-emerald" />
            </div>
            <div className="cookie-text-group">
              <div className="cookie-title-row">
                <h4 className="cookie-title">We Value Your Data Privacy & Performance</h4>
                <span className="cookie-badge">
                  <Shield size={11} /> GDPR & Enterprise Compliant
                </span>
              </div>
              <p className="cookie-description">
                We use high-speed browser memory workers, session tokens, and localized caching to deliver instant dataset processing for millions of concurrent users.
              </p>
            </div>
          </div>

          <div className="cookie-banner-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm cookie-btn-customize"
              onClick={() => setIsCustomizeOpen(true)}
            >
              <Settings size={14} /> Customize
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm cookie-btn-essential"
              onClick={handleAcceptEssential}
            >
              Essential Only
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm cookie-btn-accept-all"
              onClick={handleAcceptAll}
            >
              <Check size={14} /> Accept All Cookies
            </button>
          </div>
        </div>
      </div>

      {/* Customize Preferences Modal */}
      {isCustomizeOpen && (
        <div className="cookie-modal-overlay" onClick={() => setIsCustomizeOpen(false)}>
          <div className="cookie-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Cookie size={22} className="text-emerald" />
                <h3 className="modal-title">Cookie & Data Privacy Preferences</h3>
              </div>
              <button
                type="button"
                className="currency-zoom-close-btn"
                onClick={() => setIsCustomizeOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body cookie-modal-body">
              <p className="cookie-modal-intro">
                Customize your cookie settings below. Essential cookies are required to process multi-million row datasets safely in your browser.
              </p>

              <div className="cookie-options-list">
                {/* 1. Essential */}
                <div className="cookie-option-card locked">
                  <div className="option-header">
                    <div className="option-title-group">
                      <Lock size={16} className="text-emerald" />
                      <strong>Essential & Security Cookies</strong>
                    </div>
                    <span className="always-active-pill">Always Active</span>
                  </div>
                  <p className="option-desc">
                    Required for user authentication, encrypted session tokens, and local Web Worker dataset analysis.
                  </p>
                </div>

                {/* 2. Performance & Memory Caching */}
                <div className="cookie-option-card">
                  <div className="option-header">
                    <div className="option-title-group">
                      <HardDrive size={16} className="text-cyan" />
                      <strong>High-Performance Worker Caching</strong>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.performance}
                        onChange={(e) => setPreferences({ ...preferences, performance: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p className="option-desc">
                    Enables Web Worker multi-threading memory chunking to parse multi-million row datasets without loading lag.
                  </p>
                </div>

                {/* 3. Analytics & Live User Tracking */}
                <div className="cookie-option-card">
                  <div className="option-header">
                    <div className="option-title-group">
                      <Activity size={16} className="text-amber" />
                      <strong>Live Session & Traffic Analytics</strong>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p className="option-desc">
                    Powers the real-time live active user counter and session security tracking dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAcceptEssential}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm ml-auto"
                onClick={handleSaveCustom}
              >
                <Check size={14} /> Save My Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
