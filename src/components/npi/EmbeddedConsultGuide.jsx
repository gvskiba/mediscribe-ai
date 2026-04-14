// EmbeddedConsultGuide.jsx
// Full 16-specialty reference guide, embedded in NPI encounter flow.
// Strips standalone page chrome (no header, no nav, no footer).
// Shares CONSULT_SPECIALTIES data with ConsultHub standalone page.

import { useState, useMemo } from "react";
import { CONSULT_SPECIALTIES, CONSULT_CATS } from "@/components/npi/consultData";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── Primitives ───────────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function SectionGrid({ sp }) {
  return (
    <div style={{ padding:"12px 14px 10px",
      borderTop:"1px solid rgba(26,53,85,0.3)" }}>

      {/* Hook */}
      <div style={{ padding:"6px 10px", borderRadius:7, marginBottom:10,
        background:`${sp.color}0d`, border:`1px solid ${sp.color}25` }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:sp.color, letterSpacing:1, textTransform:"uppercase" }}>
          Hook: </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt2, fontStyle:"italic" }}>{sp.hook}</span>
      </div>

      {/* 6-section 2-col grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:9 }}>
        {sp.sections.map((sec, i) => (
          <div key={i} style={{ padding:"8px 10px",
            background:`${sec.col}09`, border:`1px solid ${sec.col}22`,
            borderRadius:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              fontWeight:700, color:sec.col, letterSpacing:1.3,
              textTransform:"uppercase", marginBottom:6,
              paddingBottom:4, borderBottom:`1px solid ${sec.col}25` }}>
              {sec.label}
            </div>
            {sec.items.map((item, j) => (
              <Bullet key={j} text={item} color={sec.col} />
            ))}
          </div>
        ))}
      </div>

      {/* Pearl */}
      <div style={{ padding:"7px 10px",
        background:`${T.gold}09`, border:`1px solid ${T.gold}22`,
        borderRadius:7 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
          💎 Pearl: </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt2, lineHeight:1.6 }}>{sp.pearl}</span>
      </div>
    </div>
  );
}

function SpecialtyCard({ sp, expanded, onToggle }) {
  return (
    <div style={{
      background:"rgba(8,22,40,0.75)",
      border:`1px solid ${expanded ? sp.color + "50" : "rgba(26,53,85,0.45)"}`,
      borderTop:`3px solid ${sp.color}`,
      borderRadius:10, overflow:"hidden",
      marginBottom:7, cursor:"pointer",
      transition:"border-color .15s" }}>

      {/* Header row */}
      <div onClick={onToggle}
        style={{ padding:"10px 13px",
          display:"flex", alignItems:"center", gap:10,
          background:`linear-gradient(135deg,${sp.color}09,rgba(8,22,40,0.92))` }}>
        <span style={{ fontSize:18, flexShrink:0 }}>{sp.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:sp.color }}>
            {sp.name}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {sp.hook}
          </div>
        </div>
        <span style={{ color:T.txt4, fontSize:10, flexShrink:0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && <SectionGrid sp={sp} />}
    </div>
  );
}

// ── Category strip ───────────────────────────────────────────────────────────
function CatStrip({ active, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {CONSULT_CATS.map(c => (
        <button key={c.id} onClick={() => onChange(c.id)}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"3px 10px", borderRadius:20,
            cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
            transition:"all .12s",
            border:`1px solid ${active===c.id ? c.color+"88" : c.color+"33"}`,
            background:active===c.id ? `${c.color}20` : "transparent",
            color:active===c.id ? c.color : T.txt4 }}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function EmbeddedConsultGuide() {
  const [cat,      setCat]      = useState("all");
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CONSULT_SPECIALTIES.filter(sp =>
      (cat === "all" || sp.cat === cat) &&
      (!q || sp.name.toLowerCase().includes(q) || sp.hook.toLowerCase().includes(q))
    );
  }, [cat, search]);

  const toggle = (id) => setExpanded(p => p === id ? null : id);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ padding:"10px 13px",
        background:"rgba(8,22,40,0.7)",
        border:"1px solid rgba(26,53,85,0.45)",
        borderRadius:10, marginBottom:8 }}>

        {/* Label row */}
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
            All 16 Specialties — Tap to Expand
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1 }}>
            {filtered.length} shown
          </div>
        </div>

        {/* Category filter */}
        <CatStrip active={cat} onChange={v => { setCat(v); setExpanded(null); }} />

        {/* Search */}
        <div style={{ marginTop:7 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search specialties..."
            style={{ width:"100%",
              background:"rgba(14,37,68,0.8)",
              border:`1px solid ${search ? "rgba(155,109,255,0.45)" : "rgba(42,79,122,0.3)"}`,
              borderRadius:20, padding:"5px 12px", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt, transition:"border-color .1s" }} />
        </div>
      </div>

      {/* Specialty cards */}
      <div>
        {filtered.map(sp => (
          <SpecialtyCard
            key={sp.id}
            sp={sp}
            expanded={expanded === sp.id}
            onToggle={() => toggle(sp.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding:"24px", textAlign:"center",
            background:"rgba(8,22,40,0.6)",
            border:"1px solid rgba(26,53,85,0.35)",
            borderRadius:10 }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🔍</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4 }}>
              No specialties match "{search}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}