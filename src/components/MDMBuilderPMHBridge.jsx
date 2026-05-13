import { useEffect } from "react";

// ── 1. Hook: listen for pmhMDMReady event ────────────────────────────────────
//
// Drop this hook inside MDMBuilder / QuickNote's component body.
// Fires when PMHTab sends comorbidity data via CustomEvent.
//
// Usage:
//   usePMHMDMIngestion(onMDMDataReceived);
//
export function usePMHMDMIngestion(onReceive) {
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      if (!payload?.suggestedLevel) return;
      if (onReceive) onReceive(payload);
    };

    window.addEventListener('pmhMDMReady', handler);
    return () => window.removeEventListener('pmhMDMReady', handler);
  }, [onReceive]);
}

// ── 2. URL param receiver ─────────────────────────────────────────────────────
//
// Call once on mount. Reads ?pmhComorbidities=... from the URL.
//
export function readPMHMDMFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw    = params.get('pmhComorbidities');
    if (!raw) return null;
    const data = JSON.parse(decodeURIComponent(raw));
    window.history.replaceState(null, '', window.location.pathname);
    return data && data.suggestedLevel ? data : null;
  } catch { return null; }
}

// ── 3. MDM complexity color helper ───────────────────────────────────────────
export function getMDMLevelColor(level) {
  const map = { High: '#ef4444', Moderate: '#f59e0b', 'Low-Moderate': '#a78bfa', Low: '#64748b' };
  return map[level] || '#64748b';
}

// ── 4. PMH MDM Banner component ───────────────────────────────────────────────
//
// Renders a dismissible banner in MDMBuilder when PMH comorbidity data arrives.
//
export function PMHMDMBanner({ data, onDismiss, onApply, C = {} }) {
  if (!data?.suggestedLevel) return null;

  const teal  = C.teal  || '#0d9488';
  const muted = C.muted || '#94a3b8';
  const color = getMDMLevelColor(data.suggestedLevel);

  return (
    <div style={{
      background: `${color}12`, border: `1px solid ${color}55`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 18 }}>📋</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>
          PMH AI — {data.suggestedLevel} MDM Complexity suggested
        </div>
        <div style={{ fontSize: 12, color: muted }}>
          {data.highComplexity?.length > 0 &&
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{data.highComplexity.length} high-complexity · </span>}
          {data.moderateComplexity?.length > 0 &&
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{data.moderateComplexity.length} moderate · </span>}
          Based on {data.conditions?.length || 0} conditions from Patient History. Review and apply to MDM.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onApply && (
          <button onClick={() => onApply(data)} style={{
            padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
            fontSize: 12, fontWeight: 700, border: `1px solid ${color}66`,
            background: `${color}18`, color,
          }}>
            Apply to MDM
          </button>
        )}
        <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: muted, cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
      </div>
    </div>
  );
}

// ── 5. Comorbidity summary block (render inside MDM section) ──────────────────
export function PMHComorbiditySummary({ data, C = {} }) {
  if (!data?.conditions?.length) return null;

  const muted = C.muted || '#94a3b8';
  const text  = C.text  || '#e2e8f0';
  const color = getMDMLevelColor(data.suggestedLevel);

  return (
    <div style={{
      background: `${color}0a`, border: `1px solid ${color}33`,
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        PMH Comorbidity Context — {data.suggestedLevel} Complexity
      </div>
      {data.highComplexity?.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>High: </span>
          <span style={{ color: text }}>{data.highComplexity.join(', ')}</span>
        </div>
      )}
      {data.moderateComplexity?.length > 0 && (
        <div>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Moderate: </span>
          <span style={{ color: muted }}>{data.moderateComplexity.join(', ')}</span>
        </div>
      )}
    </div>
  );
}