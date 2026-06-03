import { useState, useEffect } from "react";

/*
  LakonyxHeader.jsx  —  shared single-row top header for every Lakonyx page
  --------------------------------------------------------------------------
  Gold LAKONYX wordmark on the left, optional breadcrumb, the Search bar now
  inline in the nav row (left of center, just past the wordmark/breadcrumb), a
  passive patient-context chip in the center, and a right cluster (clock ·
  On-Shift). One row, ~58px — matches the Command Center TopBar height.

  Change vs prior: the Search affordance moved from the right cluster into the
  main nav row on the left, and reads as a "Search  ⌘K" bar rather than a bare
  icon. Behavior is unchanged (click or ⌘/Ctrl-K both fire onSearch).

  Props (all optional):
    pageName, patient, onSearch, showSearch, showClock, showShiftStatus,
    backLabel, onBack, onLogoClick, rightContent
*/

// ─── TOKENS (local — component has zero external deps) ────────────────────────
const C = {
  panel:"#081628", card:"#0b1e36", gold:"#f5c842", teal:"#00e5c0",
  txt:"#f2f7ff", txt3:"#82aece", txt4:"#5a82a8",
  red:"#ff4444", orange:"#ff9f43", green:"#3dffa0",
  border:"rgba(26,53,85,0.5)", borderHi:"rgba(26,53,85,0.8)",
};

const goTo      = (page) => { window.location.href = `/${page}`; };
const esiColor  = (n) => ({ 1:C.red, 2:C.orange, 3:C.gold, 4:C.green, 5:C.txt4 }[n] || C.txt4);

// ─── SELF-CONTAINED FONT INJECTION (guarded — runs once per document) ─────────
function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("lx-header-fonts")) return;
  const l = document.createElement("link");
  l.id = "lx-header-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
}

// ─── PASSIVE PATIENT-CONTEXT CHIP ─────────────────────────────────────────────
function PatientChip({ patient }) {
  if (!patient) return null;
  const ec = esiColor(patient.esi);
  return (
    <div
      title={patient.cc || ""}
      style={{ display:"inline-flex", alignItems:"center", gap:9, background:"rgba(0,229,192,0.05)", border:`1px solid ${C.teal}40`, borderRadius:8, padding:"5px 13px", cursor:"default", maxWidth:520, minWidth:0 }}
    >
      {patient.room && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.txt4, background:"rgba(26,53,85,0.6)", border:`1px solid ${C.borderHi}`, borderRadius:4, padding:"2px 6px", flexShrink:0 }}>
          {patient.room}
        </span>
      )}
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:C.txt, whiteSpace:"nowrap", flexShrink:0 }}>
        {patient.name}
      </span>
      {patient.esi != null && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:ec, background:`${ec}1f`, border:`1px solid ${ec}55`, borderRadius:4, padding:"1px 5px", flexShrink:0 }}>
          ESI {patient.esi}
        </span>
      )}
      {(patient.age != null || patient.sex) && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.txt4, flexShrink:0 }}>
          {patient.age}{patient.sex}
        </span>
      )}
      {patient.cc && (
        <>
          <span style={{ color:C.txt4, fontSize:9, flexShrink:0 }}>·</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:C.teal, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>
            {patient.cc}
          </span>
        </>
      )}
    </div>
  );
}

export default function LakonyxHeader({
  pageName        = null,
  patient         = null,
  onSearch        = null,
  showSearch      = true,
  showClock       = true,
  showShiftStatus = true,
  backLabel       = "Command Center",
  onBack          = null,
  onLogoClick     = null,
  rightContent    = null,
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => { ensureFonts(); }, []);

  useEffect(() => {
    if (!showClock) return;
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, [showClock]);

  const fireSearch = () => { onSearch ? onSearch() : goTo("CommandCenter"); };
  const fireBack   = () => { onBack   ? onBack()   : goTo("CommandCenter"); };
  const fireLogo   = () => { onLogoClick ? onLogoClick() : goTo("CommandCenter"); };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        fireSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSearch]);

  const hasPatient = !!patient;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0 24px", height:58, minHeight:58, background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>

      {/* ── LEFT: wordmark + breadcrumb ── */}
      <span
        onClick={fireLogo}
        style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:C.gold, letterSpacing:"0.06em", cursor:"pointer", userSelect:"none", flexShrink:0 }}
      >
        LAKONYX
      </span>

      {pageName && (
        <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
          <span onClick={fireBack} style={{ display:"inline-flex", alignItems:"center", color:C.txt4, cursor:"pointer" }} title={`Back to ${backLabel}`}>
            <span style={{ fontSize:14, lineHeight:1 }}>‹</span>
          </span>
          {!hasPatient && (
            <>
              <span onClick={fireBack} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.txt3, cursor:"pointer", whiteSpace:"nowrap" }}>
                {backLabel}
              </span>
              <span style={{ color:C.txt4, fontSize:10 }}>/</span>
            </>
          )}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:C.txt, whiteSpace:"nowrap" }}>
            {pageName}
          </span>
        </div>
      )}

      {/* ── SEARCH BAR: now inline in the nav row, left of center ── */}
      {showSearch && (
        <div
          onClick={fireSearch}
          style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, borderRadius:18, padding:"6px 14px", cursor:"pointer", transition:"border-color .15s", flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          title="Search (⌘K)"
        >
          <span style={{ fontSize:12, lineHeight:1 }}>🔍</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:C.txt4 }}>Search</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.txt4, letterSpacing:"0.04em", marginLeft:2 }}>⌘K</span>
        </div>
      )}

      {/* ── CENTER: passive patient chip (or empty space) ── */}
      <div style={{ flex:1, display:"flex", justifyContent:"center", minWidth:0 }}>
        <PatientChip patient={patient} />
      </div>

      {/* ── RIGHT: clock · shift · custom ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        {showClock && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:700, color:C.txt, letterSpacing:"0.04em", lineHeight:1 }}>
              {now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })}
            </div>
          </div>
        )}

        {showShiftStatus && (
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(0,229,192,0.08)", border:`1px solid ${C.teal}4d`, borderRadius:8, padding:"4px 11px" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.teal, display:"inline-block" }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal }}>On Shift</span>
          </div>
        )}

        {rightContent}
      </div>
    </div>
  );
}