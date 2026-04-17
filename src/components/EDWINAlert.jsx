// EDWINAlert.jsx
// App-level persistent crowding alert banner.
// Renders nothing when EDWIN < 4 (Busy is normal for an ED — no alert needed).
// Amber bar at Overcrowded (≥4), coral bar at Severe (≥6).
// Pulses once when tier escalates. Never dismissible.
//
// Mount once at the app root, above page content:
//   <EDWINAlert
//     patientFetcher={() => base44.query("encounters").where("status","active").get()}
//     attendingCount={3}
//     totalBays={20}
//     onViewBoard={() => navigate("/HuddleBoard")}
//   />
//
// Without patientFetcher the component renders nothing safely.
//
// Props:
//   patientFetcher  async ({ signal }) => { status, esiLevel }[]
//                   — same shape as useHuddleBoardData; only status+esiLevel are read
//   attendingCount  number  (default 3)
//   totalBays       number  (default 20)
//   onViewBoard     () => void — navigates to HuddleBoard
//   pollIntervalMs  number  (default 60_000 — 60 seconds)
//   fixed           bool    (default true — position:fixed top bar over all content)
//
// Exports: EDWINAlert (default), useEDWINScore (named, for use in dashboards)

import { useState, useEffect, useCallback, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  panel:"#081628", bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", orange:"#ff9f43",
};

// ── Tier config ───────────────────────────────────────────────────────────────
const TIERS = {
  severe:      { min:6, color:T.coral,  bg:"rgba(255,107,107,.13)", bd:"rgba(255,107,107,.55)", dot:"#ff6b6b",  label:"Severe",      implication:"Critical crowding \u2014 activate surge protocols" },
  overcrowded: { min:4, color:T.orange, bg:"rgba(255,159,67,.1)",   bd:"rgba(255,159,67,.5)",   dot:"#ff9f43",  label:"Overcrowded", implication:"Department overcrowded \u2014 consider diversion protocols" },
  busy:        { min:2, color:T.gold,   bg:"rgba(245,200,66,.08)",  bd:"rgba(245,200,66,.4)",   dot:"#f5c842",  label:"Busy",        implication:"Patient volume elevated \u2014 monitor wait times" },
  normal:      { min:0, color:T.teal,   bg:"transparent",           bd:"transparent",           dot:"#00e5c0",  label:"Not Busy",    implication:"" },
};

function getTier(score) {
  if (score === null) return null;
  if (score >= TIERS.severe.min)      return "severe";
  if (score >= TIERS.overcrowded.min) return "overcrowded";
  if (score >= TIERS.busy.min)        return "busy";
  return "normal";
}

// ── useEDWINScore hook ────────────────────────────────────────────────────────
// Lightweight — only reads status and esiLevel from each patient object.
// Compatible with the same patientFetcher used by useHuddleBoardData.
export function useEDWINScore({
  patientFetcher  = null,
  attendingCount  = 3,
  totalBays       = 20,
  pollIntervalMs  = 60_000,
} = {}) {
  const [score,       setScore]       = useState(null);
  const [isFetching,  setIsFetching]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const abortRef    = useRef(null);

  const compute = useCallback(async () => {
    if (!patientFetcher) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsFetching(true);
    try {
      const raw = await patientFetcher({ signal: ctrl.signal });
      if (ctrl.signal.aborted || !Array.isArray(raw)) return;

      const roomed   = raw.filter(p => p.status === "roomed");
      const boarders = raw.filter(p => p.status === "boarded").length;
      const avail    = totalBays - boarders;

      if (!attendingCount || avail <= 0) { setScore(null); return; }

      const numerator   = roomed.reduce((s, p) => s + (p.esiLevel || 3), 0);
      const denominator = attendingCount * avail;
      setScore(Math.round((numerator / denominator) * 10) / 10);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err?.name !== "AbortError") console.warn("[useEDWINScore]", err.message);
    } finally {
      setIsFetching(false);
    }
  }, [patientFetcher, attendingCount, totalBays]);

  // Mount: initial fetch + polling
  useEffect(() => {
    if (!patientFetcher) return;
    compute();
    intervalRef.current = setInterval(compute, pollIntervalMs);
    return () => { clearInterval(intervalRef.current); abortRef.current?.abort(); };
  }, [patientFetcher]); // eslint-disable-line

  // Re-fetch on tab visibility restore
  useEffect(() => {
    if (!patientFetcher) return;
    const handler = () => { if (!document.hidden) compute(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [patientFetcher, compute]);

  const tier = getTier(score);

  return {
    score,
    tier,
    tierConfig:    tier ? TIERS[tier] : null,
    isAlertActive: tier === "overcrowded" || tier === "severe",
    isFetching,
    lastUpdated,
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EDWINAlert({
  patientFetcher = null,
  attendingCount = 3,
  totalBays      = 20,
  onViewBoard    = null,
  pollIntervalMs = 60_000,
  fixed          = true,
}) {
  const { score, tier, tierConfig, isAlertActive, lastUpdated } = useEDWINScore({
    patientFetcher, attendingCount, totalBays, pollIntervalMs,
  });

  // ── Pulse once on tier escalation ─────────────────────────────────────────
  const prevTierRef  = useRef(null);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const prev = prevTierRef.current;
    const tierRank = { normal:0, busy:1, overcrowded:2, severe:3 };
    if (tier && prev && tierRank[tier] > tierRank[prev]) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 900);
    }
    prevTierRef.current = tier;
  }, [tier]);

  // Render nothing when: no fetcher, no score yet, or EDWIN below threshold
  if (!patientFetcher || !isAlertActive || score === null) return null;

  const cfg     = tierConfig;
  const agoMins = lastUpdated ? Math.round((Date.now() - lastUpdated) / 60000) : null;

  return (
    <>
      <style>{`
        @keyframes edwin-pulse {
          0%   { opacity:1; }
          20%  { opacity:.4; }
          40%  { opacity:1; }
          60%  { opacity:.55; }
          100% { opacity:1; }
        }
        @keyframes edwin-dot-beat {
          0%,100% { transform:scale(1);   opacity:.8; }
          50%     { transform:scale(1.5); opacity:1;  }
        }
      `}</style>

      <div style={{
        position:   fixed ? "fixed" : "relative",
        top:        fixed ? 0 : undefined,
        left:       fixed ? 0 : undefined,
        right:      fixed ? 0 : undefined,
        zIndex:     fixed ? 9990 : undefined,
        display:    "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap:        12,
        padding:    "7px 18px",
        background: cfg.bg,
        borderBottom: `2px solid ${cfg.bd}`,
        fontFamily: "'DM Sans',sans-serif",
        animation:  pulsing ? "edwin-pulse .9s ease-in-out" : "none",
        flexWrap:   "wrap",
      }}>

        {/* Left: score + label + implication */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>

          {/* Animated dot */}
          <div style={{
            width:9, height:9, borderRadius:"50%", flexShrink:0,
            background: cfg.dot,
            animation: "edwin-dot-beat 1.8s ease-in-out infinite",
          }} />

          {/* Score */}
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18,
              fontWeight:900, color:cfg.color, lineHeight:1 }}>
              {score}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:cfg.color, letterSpacing:"1px", textTransform:"uppercase",
              fontWeight:700 }}>
              EDWIN
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              fontWeight:700, color:cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {/* Separator */}
          <div style={{ width:1, height:14, background:cfg.bd }} />

          {/* Implication */}
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt, opacity:.85 }}>
            {cfg.implication}
          </span>

          {/* Last updated */}
          {agoMins !== null && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.txt4, marginLeft:4 }}>
              updated {agoMins === 0 ? "just now" : `${agoMins}m ago`}
            </span>
          )}
        </div>

        {/* Right: View Board link */}
        {onViewBoard && (
          <button onClick={onViewBoard}
            style={{ display:"flex", alignItems:"center", gap:5,
              padding:"4px 14px", borderRadius:6, cursor:"pointer",
              border:`1px solid ${cfg.bd}`, background:`${cfg.color}18`,
              color:cfg.color, fontFamily:"'DM Sans',sans-serif",
              fontSize:11, fontWeight:700, flexShrink:0,
              transition:"all .15s" }}>
            → View Board
          </button>
        )}
      </div>
    </>
  );
}