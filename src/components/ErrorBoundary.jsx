import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldCheck, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛡️ [React Crash Guard] Intercepted Component Tree Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndRecover = () => {
    try {
      sessionStorage.clear();
      // Keep user auth if valid, remove corrupted local temporary state
      localStorage.removeItem('current_dataset_state');
    } catch (_) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#f87171'
            }}>
              <AlertTriangle size={28} />
            </div>

            <span style={{
              display: 'inline-block',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              marginBottom: '0.75rem'
            }}>
              🛡️ CRASH-PROOF CLIENT GUARD
            </span>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ffffff' }}>
              Application Interface Recovered
            </h2>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              The resilience engine safely isolated an interface error and prevented the browser tab from freezing. Your datasets and session remain securely protected on the server.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                }}
              >
                <RefreshCw size={14} /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetAndRecover}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RotateCcw size={14} /> Reset State & Recover
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ fontSize: '0.70rem', color: '#64748b', cursor: 'pointer' }}>
                  Developer Diagnostics
                </summary>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.65rem',
                  color: '#fca5a5',
                  overflowX: 'auto',
                  marginTop: '0.5rem'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
