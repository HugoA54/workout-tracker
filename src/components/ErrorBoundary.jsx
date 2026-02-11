import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            L'application a rencontré un problème inattendu.
          </p>
          <button
            onClick={this.handleReset}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
