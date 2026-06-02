import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Unregister any stale service workers and clear caches to prevent duplicate
// React copies being served from cache (causes "Cannot read properties of null
// (reading 'useState')" errors).
async function clearSWAndRender() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hadSW = registrations.length > 0;
      await Promise.all(registrations.map(reg => reg.unregister()));
      if (window.caches) {
        const keys = await caches.keys();
        const hadCache = keys.length > 0;
        await Promise.all(keys.map(key => caches.delete(key)));
        if (hadSW || hadCache) {
          // Stale SW or cache found — force reload with fresh bundles
          window.location.reload();
          return;
        }
      }
    } catch (e) {
      console.warn('SW cleanup failed:', e);
    }
  }
  mount();
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#050f1e', color: '#ff6b6b', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 16 }}>App Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#82aece', marginTop: 16 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function mount() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

clearSWAndRender();