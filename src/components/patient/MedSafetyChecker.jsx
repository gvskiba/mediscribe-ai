// MedSafetyChecker — Drug allergy + contraindication checker for PatientEncounter
// Searches DrugDosing entity for the entered drug, then flags:
//   1. Allergy matches (drug name vs patient.allergies)
//   2. Contraindication matches (drug.contraindications vs patient.pmhx)
//   3. Known interactions (drug.interactions_json vs patient.pmhx)

import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  red:"#ff4444", orange:"#ff9f43", green:"#3dffa0",
};
const BORDER = "1px solid rgba(26,53,85,0.5)";

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
}

// Check if two strings share a meaningful token overlap
function overlaps(a, b) {
  const ta = normalize(a).split(/\s+/).filter(t => t.length > 2);
  const tb = normalize(b).split(/\s+/).filter(t => t.length > 2);
  return ta.some(t => tb.some(u => u.includes(t) || t.includes(u)));
}

function runChecks(drug, allergies, pmhx) {
  const warnings = [];

  // 1. Allergy check — drug name / generic name vs patient allergy list
  const drugNames = [drug.name, drug.generic_name].filter(Boolean);
  for (const allergy of (allergies || [])) {
    for (const dn of drugNames) {
      if (overlaps(dn, allergy)) {
        warnings.push({
          type: "allergy",
          severity: "critical",
          title: "⚠️ Allergy Alert",
          detail: `Patient has a documented allergy to "${allergy}" — conflicts with ${dn}.`,
        });
      }
    }
  }

  // 2. Contraindications vs PMHx
  if (drug.contraindications) {
    for (const hx of (pmhx || [])) {
      if (overlaps(drug.contraindications, hx)) {
        warnings.push({
          type: "contraindication",
          severity: "critical",
          title: "🚫 Contraindicated",
          detail: `${drug.name} is contraindicated with "${hx}" (PMHx match).`,
        });
      }
    }
  }

  // 3. Known drug interactions vs PMHx / current conditions
  let interactions = [];
  try { interactions = JSON.parse(drug.interactions_json || "[]"); } catch {}
  for (const interaction of interactions) {
    for (const hx of (pmhx || [])) {
      if (overlaps(interaction, hx)) {
        warnings.push({
          type: "interaction",
          severity: "warn",
          title: "⚡ Interaction Risk",
          detail: `${drug.name} may interact with "${hx}": ${interaction}`,
        });
      }
    }
  }

  return warnings;
}

const SEV_STYLE = {
  critical: { border:`1px solid ${T.coral}55`, bg:`${T.coral}14`, color:T.coral },
  warn:     { border:`1px solid ${T.gold}55`,  bg:`${T.gold}12`,  color:T.gold  },
  info:     { border:`1px solid ${T.blue}55`,  bg:`${T.blue}12`,  color:T.blue  },
};

function WarningCard({ w, onDismiss }) {
  const s = SEV_STYLE[w.severity] || SEV_STYLE.info;
  return (
    <div style={{
      background:s.bg, border:s.border,
      borderRadius:8, padding:"10px 12px", marginBottom:8,
      position:"relative",
    }}>
      <div style={{
        fontFamily:"'DM Sans',sans-serif", fontWeight:700,
        fontSize:11, color:s.color, marginBottom:3,
      }}>
        {w.title}
      </div>
      <div style={{
        fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.5,
      }}>
        {w.detail}
      </div>
      <button
        onClick={onDismiss}
        style={{
          position:"absolute", top:6, right:8,
          background:"none", border:"none", cursor:"pointer",
          color:T.txt4, fontSize:14, lineHeight:1, padding:0,
        }}
        title="Dismiss"
      >×</button>
    </div>
  );
}

export default function MedSafetyChecker({ patient }) {
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [checked, setChecked]   = useState("");
  const [notFound, setNotFound] = useState(false);

  const allergies = patient?.allergies || [];
  const pmhx      = patient?.pmhx      || [];

  const handleCheck = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setWarnings([]);
    setChecked("");
    setNotFound(false);

    // Search DrugDosing for matching drug by name or generic_name
    const [byName, byGeneric] = await Promise.all([
      base44.entities.DrugDosing.filter({ name: q }, "-created_date", 5),
      base44.entities.DrugDosing.filter({ generic_name: q }, "-created_date", 5),
    ]);

    const results = [...byName, ...byGeneric];

    // Fuzzy fallback: list all and filter client-side if exact match fails
    let drug = results[0];
    if (!drug) {
      const all = await base44.entities.DrugDosing.list("-created_date", 200);
      drug = all.find(d =>
        overlaps(d.name, q) || overlaps(d.generic_name || "", q)
      );
    }

    setLoading(false);

    if (!drug) {
      setNotFound(true);
      return;
    }

    setChecked(drug.name);
    const found = runChecks(drug, allergies, pmhx);
    setWarnings(found);
  }, [query, allergies, pmhx]);

  const dismiss = (i) => setWarnings(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div style={{ marginBottom:14 }}>
      {/* Header */}
      <div style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
        letterSpacing:"0.12em", textTransform:"uppercase", color:T.txt4, marginBottom:8,
      }}>
        Med Safety Check
      </div>

      {/* Input row */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCheck()}
          placeholder="Enter drug name…"
          style={{
            flex:1, background:T.card, border:BORDER, borderRadius:6,
            color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:11,
            padding:"6px 10px", outline:"none",
          }}
        />
        <button
          onClick={handleCheck}
          disabled={loading || !query.trim()}
          style={{
            background: loading ? "transparent" : `${T.teal}1a`,
            border:`1px solid ${T.teal}55`, color:T.teal,
            fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
            borderRadius:6, padding:"6px 12px", cursor:"pointer", whiteSpace:"nowrap",
            opacity: !query.trim() ? 0.4 : 1,
          }}
        >
          {loading ? "…" : "Check"}
        </button>
      </div>

      {/* Results */}
      {notFound && (
        <div style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4,
          border:BORDER, borderRadius:7, padding:"8px 10px", background:T.card,
        }}>
          Drug not found in formulary.
        </div>
      )}

      {checked && !notFound && warnings.length === 0 && (
        <div style={{
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.green,
          border:`1px solid ${T.green}30`, borderRadius:7,
          padding:"8px 10px", background:`${T.green}0d`,
        }}>
          ✓ No allergy or contraindication flags for <strong>{checked}</strong> with this patient.
        </div>
      )}

      {warnings.map((w, i) => (
        <WarningCard key={i} w={w} onDismiss={() => dismiss(i)} />
      ))}
    </div>
  );
}