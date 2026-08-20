import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldCheck, Copy, Check, Terminal, FileText, ArrowRight } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      errorTimestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorTimestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛡️ [React Crash Guard] Intercepted Component Tree Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleTryAgain = () => {
    // Isolated re-render without losing user state or resetting dataset
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndRecover = () => {
    try {
      sessionStorage.removeItem('active_dataset_snapshot');
      localStorage.removeItem('active_dataset_snapshot');
      localStorage.removeItem('active_dataset_id');
      localStorage.removeItem('current_dataset_state');
      // User auth is preserved
    } catch (_) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  extractComponentName = (stack) => {
    if (!stack) return 'React Component Tree';
    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/in\s+([A-Za-z0-9_]+)/);
      if (match && match[1] && match[1] !== 'ErrorBoundary') {
        return match[1];
      }
    }
    return 'React Component Tree';
  };

  handleCopyDiagnostics = () => {
    const { error, errorInfo, errorTimestamp } = this.state;
    const diagnosticReport = {
      timestamp: errorTimestamp || new Date().toISOString(),
      errorName: error?.name || 'Error',
      errorMessage: error?.message || String(error),
      affectedComponent: this.extractComponentName(errorInfo?.componentStack),
      componentStack: errorInfo?.componentStack || 'N/A',
      stackTrace: error?.stack || 'N/A',
      appUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticReport, null, 2))
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      })
      .catch(err => {
        console.warn('Clipboard write failed:', err);
      });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorTimestamp, copied } = this.state;
      const componentName = this.extractComponentName(errorInfo?.componentStack);
      const formattedTime = errorTimestamp ? new Date(errorTimestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

      return (
        <div style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: 'Inter, -apple-system, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '620px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.90)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '20px',
            padding: '2.2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(20px)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#f87171',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle size={30} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px'
              }}>
                <ShieldCheck size={12} /> CRASH-PROOF RESILIENCE GUARD
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.55rem',
                borderRadius: '999px'
              }}>
                {formattedTime}
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ffffff' }}>
              Interface Issue Isolated
            </h2>

            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 1.25rem' }}>
              An interface error was safely captured in <strong>&lt;{componentName} /&gt;</strong> without freezing the browser tab.
              Your user credentials and server datasets remain securely intact.
            </p>

            {/* Error Summary Banner */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <Terminal size={15} style={{ color: '#f87171', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {error?.name || 'Runtime Error'}:
                </div>
                <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600, wordBreak: 'break-word', marginTop: '2px' }}>
                  {error?.message || 'An unexpected rendering error occurred.'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleTryAgain}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.80rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <RefreshCw size={14} /> Try Again
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '9px',
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <RefreshCw size={14} /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetAndRecover}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '9px',
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
                title="Reset temporary UI filters while keeping user credentials intact"
              >
                <RotateCcw size={14} /> Restore Default State
              </button>
            </div>

            {/* Developer Diagnostics Section */}
            <div style={{ marginTop: '1.6rem', textAlign: 'left', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Developer Diagnostics
                </span>
                <button
                  type="button"
                  onClick={this.handleCopyDiagnostics}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: copied ? '#34d399' : '#94a3b8',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Diagnostic Report'}
                </button>
              </div>

              <details style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <summary style={{ fontSize: '0.72rem', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>
                  View Component Stack &amp; Trace
                </summary>
                
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Affected Component:</span>
                    <div style={{ fontSize: '0.72rem', color: '#f8fafc', fontWeight: 600 }}>&lt;{componentName} /&gt;</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Error Stack:</span>
                    <pre style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.64rem',
                      color: '#fca5a5',
                      overflowX: 'auto',
                      maxHeight: '140px',
                      margin: '0.3rem 0 0'
                    }}>
                      {error?.stack || String(error)}
                    </pre>
                  </div>

                  {errorInfo?.componentStack && (
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Component Hierarchy:</span>
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.64rem',
                        color: '#94a3b8',
                        overflowX: 'auto',
                        maxHeight: '100px',
                        margin: '0.3rem 0 0'
                      }}>
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
