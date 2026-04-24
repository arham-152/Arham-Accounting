// @ts-nocheck
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#0a0c10', 
          color: '#ef4444', 
          height: '100vh', 
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>System Critical Error</h1>
          <p style={{ color: '#64748b', maxWidth: '500px', marginBottom: '24px' }}>
            The application encountered a fatal exception. This might be due to corrupted local data or a connection failure.
          </p>
          <pre style={{ 
            backgroundColor: '#111318', 
            padding: '16px', 
            borderRadius: '12px', 
            fontSize: '12px',
            color: '#94a3b8',
            maxWidth: '90vw',
            overflowX: 'auto',
            marginBottom: '24px'
          }}>
            {error?.message || 'Unknown Error'}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ 
              backgroundColor: '#f0b429', 
              color: '#000', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Clear Data & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Service Worker disabled to prevent stale cache issues during rapid development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
