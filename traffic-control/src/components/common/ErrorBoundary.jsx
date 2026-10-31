import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--color-surface-0)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--color-critical-bg)',
              border: '1.5px solid var(--color-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '1rem',
            }}
          >
            ⚠️
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            {this.props.fallbackTitle || 'Component Encountered a Display Issue'}
          </h3>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '480px',
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button onClick={this.handleReset} className="btn btn-primary">
            <span>↺ Reload Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
