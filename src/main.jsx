import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Unregister any stale service workers and clear caches to prevent duplicate
// React copies being served from cache (causes "Cannot read properties of null
// (reading 'useState')" errors).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    let unregistered = 0;
    registrations.forEach(reg => { reg.unregister(); unregistered++; });
    if (unregistered > 0 && window.caches) {
      // Stale SW found — clear all caches then force a hard reload so the
      // browser fetches fresh JS bundles instead of serving cached stale ones.
      caches.keys().then(keys =>
        Promise.all(keys.map(key => caches.delete(key)))
      ).then(() => window.location.reload());
    }
  });
  if (window.caches) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)