import { useEffect } from "react";

// ── 1. Category mapping from PMH → OrderGeneratorHub order categories ─────────
const PMH_TO_ORDER_CATEGORY = {
  labs:        'Labs',
  imaging:     'Imaging',
  consults:    'Consults',
  monitoring:  'Monitoring',
  medications: 'Medications',
  other:       'Other',
};

// ── 2. Hook: listen for pmhOrdersReady event ──────────────────────────────────
//
// Drop this hook inside OrderGeneratorHub's component body.
// It fires when PMHTab sends orders via CustomEvent or URL params.
//
// Usage:
//   usePMHOrderIngestion(setOrders, setActiveTab, onIngest);
//
export function usePMHOrderIngestion(setOrders, setActiveTab, onIngest) {
  useEffect(() => {
    const handler = (e) => {
      const incoming = e.detail?.orders || [];
      if (!incoming.length) return;

      const mapped = incoming.map(o => ({
        id:        `pmh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name:      o.name,
        category:  PMH_TO_ORDER_CATEGORY[o.category] || 'Other',
        priority:  o.priority,
        source:    'PMH AI',
        rationale: o.rationale,
        status:    'pending',
        addedAt:   new Date().toISOString(),
      }));

      setOrders(prev => {
        const existing = new Set(prev.map(o => o.name.toLowerCase()));
        return [...prev, ...mapped.filter(o => !existing.has(o.name.toLowerCase()))];
      });

      if (setActiveTab) setActiveTab('orders');
      if (onIngest) onIngest(mapped);
    };

    window.addEventListener('pmhOrdersReady', handler);
    return () => window.removeEventListener('pmhOrdersReady', handler);
  }, [setOrders, setActiveTab, onIngest]);
}

// ── 3. URL param receiver ─────────────────────────────────────────────────────
//
// Call once on mount inside OrderGeneratorHub.
// Reads ?pmhOrders=... from the URL and returns parsed orders.
//
export function readPMHOrdersFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw    = params.get('pmhOrders');
    if (!raw) return [];
    const orders = JSON.parse(decodeURIComponent(raw));
    window.history.replaceState(null, '', window.location.pathname);
    return Array.isArray(orders) ? orders : [];
  } catch { return []; }
}

// ── 4. Ingestion banner component ─────────────────────────────────────────────
export function PMHOrdersBanner({ orders, onDismiss, C = {} }) {
  if (!orders?.length) return null;

  const teal  = C.teal   || '#0d9488';
  const muted = C.muted  || '#94a3b8';

  const immediate = orders.filter(o => o.priority === 'Immediate').length;
  const urgent    = orders.filter(o => o.priority === 'Urgent').length;

  return (
    <div style={{
      background: 'rgba(13,148,136,0.12)', border: `1px solid ${teal}55`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 18 }}>✦</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: teal, marginBottom: 3 }}>
          PMH AI — {orders.length} order{orders.length !== 1 ? 's' : ''} received
        </div>
        <div style={{ fontSize: 12, color: muted }}>
          {immediate > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>{immediate} STAT&nbsp;&nbsp;</span>}
          {urgent    > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}>{urgent} URGENT&nbsp;&nbsp;</span>}
          Auto-staged from Patient History analysis. Review before signing.
        </div>
      </div>
      <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: muted, cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}