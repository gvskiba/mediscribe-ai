// ConnectivityIndicator.jsx
// Persistent offline/sync status chip — always visible in the NPI top bar.
// Never a toast. Never dismissible. Surfaces connectivity and sync state so
// providers always know whether their documentation has reached the server.
//
// Works in three modes:
//   Standalone — connectivity only via navigator.onLine + window events.
//   With sync state — shows pending count, syncing status, last sync time.
//   With pending items — expandable list of exactly what is queued.
//
// Props (all optional):
//   pendingCount   number    — items awaiting sync (default 0)
//   pendingItems   array     — [{ id, label, section, modifiedAt }]
//   lastSyncAt     ms|null   — timestamp of last successful sync
//   isSyncing      bool      — sync in progress
//   syncError      string|null — error from last sync attempt
//   onSyncNow      () => void  — trigger manual sync
//
// States: offline (amber) · syncing (blue pulse) · error (coral) ·
//         pending (gold) · clean (teal)
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   border before borderTop/etc.

import { useState, useEffect, useCallback, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff", orange:"#ff9f43",
};

// ── Section labels for the pending item list ───────────────────────────────────
const SECTION_LABELS = {
  triage:"Triage", demo:"Demographics", cc:"Chief Complaint",
  vitals:"Vitals", hpi:"HPI", ros:"Review of Systems",
  pe:"Physical Exam", orders:"Orders", mdm:"MDM",
  sepsis:"Sepsis Bundle", handoff:"Handoff", comms:"Comm Log",
  discharge:"Discharge", chart:"Clinical Note", sdoh:"SDOH",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAgo(ms) {
  if (!ms) return null;
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1h ago" : `${hrs}h ago`;
}

function fmtTime(ms) {
  if (!ms) return null;
  return new Date(ms).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false });
}

// ── State resolution ──────────────────────────────────────────────────────────
function resolveState({ isOnline, isSyncing, syncError, pendingCount }) {
  if (!isOnline)                              return "offline";
  if (isSyncing)                              return "syncing";
  if (syncError && isOnline)                  return "error";
  if (pendingCount > 0)                       return "pending";
  return "clean";
}

const STATE_CONFIG = {
  offline: { color:T.gold,   bg:"rgba(245,200,66,.1)",   bd:"rgba(245,200,66,.38)", dot:"#f5c842",  label:"Offline",      icon:"\uD83D\uDCF5" },
  syncing: { color:T.blue,   bg:"rgba(59,158,255,.1)",   bd:"rgba(59,158,255,.35)", dot:"#3b9eff",  label:"Syncing",      icon:"\u21BA"       },
  error:   { color:T.coral,  bg:"rgba(255,107,107,.1)",  bd:"rgba(255,107,107,.38)",dot:"#ff6b6b",  label:"Sync failed",  icon:"\u26A0\uFE0F" },
  pending: { color:T.orange, bg:"rgba(255,159,67,.09)",  bd:"rgba(255,159,67,.35)", dot:"#ff9f43",  label:"Pending sync", icon:"\u2191"       },
  clean:   { color:T.teal,   bg:"rgba(0,229,192,.08)",   bd:"rgba(0,229,192,.25)",  dot:"#00e5c0",  label:"Synced",       icon:"\u2713"       },
};

// ── Main export ───────────────────────────────────────────────────────────────
export default function ConnectivityIndicator({
  pendingCount  = 0,
  pendingItems  = [],
  lastSyncAt    = null,
  isSyncing     = false,
  syncError     = null,
  onSyncNow,
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [expanded, setExpanded] = useState(false);
  const [tick,     setTick]     = useState(0);
  const popoverRef = useRef(null);

  // ── Connectivity listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── Tick every 30s to refresh "Nm ago" timestamps ─────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t+1), 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Close popover on outside click ────────────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const state  = resolveState({ isOnline, isSyncing, syncError, pendingCount });
  const cfg    = STATE_CONFIG[state];
  const agoStr = fmtAgo(lastSyncAt);

  const handleSyncNow = useCallback((e) => {
    e.stopPropagation();
    onSyncNow?.();
  }, [onSyncNow]);

  // ── Chip label ─────────────────────────────────────────────────────────────
  const chipLabel = (() => {
    if (state === "offline")  return `Offline${pendingCount > 0 ? ` \u00b7 ${pendingCount} pending` : ""}`;
    if (state === "syncing")  return "Syncing\u2026";
    if (state === "error")    return "Sync failed";
    if (state === "pending")  return `${pendingCount} pending`;
    if (state === "clean")    return agoStr ? `Synced ${agoStr}` : "Synced";
    return "";
  })();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={popoverRef} style={{ position:"relative", flexShrink:0 }}>

      {/* ── Persistent chip ── */}
      <button
        onClick={() => setExpanded(x => !x)}
        title="Click to see sync status details"
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"4px 10px", borderRadius:7,
          background:cfg.bg, border:`1px solid ${cfg.bd}`,
          cursor:"pointer", transition:"all .2s",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
          color:cfg.color, whiteSpace:"nowrap",
        }}
      >
        {/* Status dot — pulses when syncing */}
        <div style={{
          width:7, height:7, borderRadius:"50%", flexShrink:0,
          background:cfg.dot,
          animation: state === "syncing" ? "ci-pulse 1.2s ease-in-out infinite" : "none",
        }} />

        <span>{chipLabel}</span>

        {/* Offline warning indicator */}
        {state === "offline" && pendingCount > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            color:T.gold, letterSpacing:"0.5px" }}>
            !\u200B
          </span>
        )}

        <span style={{ fontSize:9, opacity:.6 }}>{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes ci-pulse {
          0%,100% { opacity:.4; transform:scale(.9); }
          50%      { opacity:1;  transform:scale(1.15); }
        }
      `}</style>

      {/* ── Expanded popover ── */}
      {expanded && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:600,
          width:310, background:T.panel,
          border:`1px solid ${cfg.bd}`, borderTop:`2px solid ${cfg.color}`,
          borderRadius:11, boxShadow:"0 16px 48px rgba(0,0,0,.55)",
          overflow:"hidden",
        }}>

          {/* Header */}
          <div style={{ padding:"12px 14px 10px", borderBottom:`1px solid ${T.bd}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:cfg.dot,
                  animation: state==="syncing" ? "ci-pulse 1.2s ease-in-out infinite" : "none",
                  flexShrink:0 }} />
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14,
                  fontWeight:700, color:cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              {/* Manual sync button — shown when online and not already syncing */}
              {isOnline && !isSyncing && onSyncNow && (
                <button onClick={handleSyncNow}
                  style={{ padding:"3px 11px", borderRadius:5, cursor:"pointer",
                    border:`1px solid ${T.bd}`, background:"transparent",
                    color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    fontWeight:600, transition:"all .15s" }}
                  onMouseEnter={e => { e.target.style.borderColor=T.teal; e.target.style.color=T.teal; }}
                  onMouseLeave={e => { e.target.style.borderColor=T.bd;   e.target.style.color=T.txt4;  }}>
                  \u21BA Sync now
                </button>
              )}
            </div>

            {/* Connection status line */}
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4,
              display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span>
                {isOnline
                  ? "\u2713 Network connected"
                  : "\u2715 No network connection"}
              </span>
              {lastSyncAt && (
                <span style={{ color: state === "error" ? T.coral : T.txt4 }}>
                  Last sync: {fmtTime(lastSyncAt)}
                  {agoStr ? ` (${agoStr})` : ""}
                </span>
              )}
              {!lastSyncAt && isOnline && (
                <span>Not yet synced this session</span>
              )}
            </div>
          </div>

          {/* Error detail */}
          {syncError && (
            <div style={{ padding:"9px 14px", borderBottom:`1px solid ${T.bd}`,
              background:"rgba(255,107,107,.06)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.coral, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                Sync Error
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral,
                lineHeight:1.55 }}>
                {syncError}
              </div>
              {isOnline && onSyncNow && (
                <button onClick={handleSyncNow}
                  style={{ marginTop:8, padding:"4px 14px", borderRadius:6, cursor:"pointer",
                    border:`1px solid rgba(255,107,107,.45)`,
                    background:"rgba(255,107,107,.1)", color:T.coral,
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700 }}>
                  Retry sync
                </button>
              )}
            </div>
          )}

          {/* Pending items */}
          {pendingCount > 0 ? (
            <div style={{ padding:"9px 14px" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
                letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:7 }}>
                {pendingCount} item{pendingCount > 1 ? "s" : ""} awaiting sync
                {!isOnline && (
                  <span style={{ color:T.gold, marginLeft:8 }}>
                    \u2014 will sync on reconnect
                  </span>
                )}
              </div>

              {pendingItems.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {pendingItems.map(item => (
                    <div key={item.id}
                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"5px 9px", borderRadius:7,
                        background:T.up, border:`1px solid ${T.bd}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:6, height:6, borderRadius:3, flexShrink:0,
                          background: state === "offline" ? T.gold
                                    : state === "error"   ? T.coral
                                    : T.orange }} />
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                          color:T.txt2, fontWeight:600 }}>
                          {SECTION_LABELS[item.section] || item.label || item.section}
                        </span>
                        {item.label && item.label !== item.section && (
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
                            {item.label}
                          </span>
                        )}
                      </div>
                      {item.modifiedAt && (
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          color:T.txt4, flexShrink:0 }}>
                          {fmtTime(item.modifiedAt)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // pendingCount provided but no item detail — show compact count
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {Array.from({ length: Math.min(pendingCount, 6) }).map((_, i) => (
                    <div key={i} style={{ height:28, borderRadius:7, background:T.up,
                      border:`1px solid ${T.bd}`, opacity: 1 - i * 0.12 }} />
                  ))}
                  {pendingCount > 6 && (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:T.txt4, textAlign:"center", paddingTop:2 }}>
                      +{pendingCount - 6} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Clean state body */
            <div style={{ padding:"12px 14px" }}>
              {state === "syncing" ? (
                <div style={{ display:"flex", alignItems:"center", gap:10,
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.blue }}>
                  <div style={{ width:14, height:14, borderRadius:"50%",
                    border:`2px solid ${T.blue}`, borderTopColor:"transparent",
                    animation:"ci-spin .8s linear infinite", flexShrink:0 }} />
                  Syncing documentation to server\u2026
                </div>
              ) : (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3,
                  lineHeight:1.6 }}>
                  {isOnline
                    ? "All documentation has been saved to the server. No pending items."
                    : "Working offline. Documentation is saved locally and will sync automatically when connectivity is restored."}
                </div>
              )}
            </div>
          )}

          {/* Offline guidance footer */}
          {!isOnline && (
            <div style={{ padding:"9px 14px", borderTop:`1px solid ${T.bd}`,
              background:"rgba(245,200,66,.05)" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.gold, lineHeight:1.6 }}>
                \uD83D\uDCF5 <strong>Offline mode active.</strong> AI features (HPI, MDM, discharge instructions, handoff) are unavailable until connectivity is restored. All other documentation continues to work normally.
              </div>
            </div>
          )}

          {/* Spin keyframe */}
          <style>{`@keyframes ci-spin { from { transform:rotate(0) } to { transform:rotate(360deg) } }`}</style>
        </div>
      )}
    </div>
  );
}