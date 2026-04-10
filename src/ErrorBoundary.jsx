/**
 * src/ErrorBoundary.jsx
 *
 * React error boundary that catches component crashes and shows a recovery UI.
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          background: '#fafafa',
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            padding: '40px 32px',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Something went wrong</div>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
              The application encountered an unexpected error. Your data is safe.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#c62828',
                textAlign: 'left',
                overflow: 'auto',
                marginBottom: '20px',
                maxHeight: '120px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#1976d2',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
