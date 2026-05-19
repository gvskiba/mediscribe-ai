// CommandKit.jsx — Notrya AI | Global Overlay Order Portal
// Mount ONCE in App.jsx — floats above every hub and page
//
// App.jsx integration:
//   import CommandKit from "@/components/CommandKit";
//   <CommandKit /> anywhere inside your root return, outside <Routes>
//
// Patient context is read automatically from the current URL params.
// Keyboard:  Ctrl+Space  — toggle open/close
//            Escape      — close
//            Ctrl+Space  (while open) — jump focus to weight field

import { useState, useEffect, useCallback, useRef } from "react";
import { useVoiceCommand } from "@/lib/useVoiceCommand";
import {
  MEDICATION_DB, SCENARIOS, IMAGING_DB, LAB_PANELS,
  HUB_LINKS, DRUG_CATEGORIES, calcDose, formatMedOrder,
  lbsToKg, kgToLbs, isPediatric,
} from "@/lib/commandkit_data";
import { REFERENCE_DB, REF_CATEGORIES } from "@/lib/commandkit_reference";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  navy:      "#060C19",
  surface:   "rgba(7,16,36,0.98)",
  glass:     "rgba(18,204,230,0.05)",
  border:    "rgba(18,204,230,0.14)",
  borderHi:  "rgba(18,204,230,0.38)",
  cyan:      "#12CCE6",
  cyanDim:   "rgba(18,204,230,0.13)",
  gold:      "#F0B429",
  goldDim:   "rgba(240,180,41,0.12)",
  text:      "#E8F3FF",
  muted:     "rgba(232,243,255,0.54)",
  dim:       "rgba(232,243,255,0.27)",
  panic:     "#FF4444",
  panicBg:   "rgba(255,68,68,0.09)",
  panicBord: "rgba(255,68,68,0.30)",
  amber:     "#F59E0B",
  amberBg:   "rgba(245,158,11,0.10)",
  green:     "#34D399",
  greenBg:   "rgba(52,211,153,0.11)",
  overlay:   "rgba(3,8,18,0.80)",
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
  body:    "'DM Sans', system-ui, sans-serif",
};

// ─── READ PATIENT CONTEXT FROM URL ───────────────────────────────────────────
function readPatientFromURL() {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      name:   p.get("name")   || "",
      mrn:    p.get("mrn")    || "",
      age:    p.get("age")    ? Number(p.get("age"))    : null,
      weight: p.get("weight") ? Number(p.get("weight")) : null,
    };
  } catch (_) {
    return { name: "", mrn: "", age: null, weight: null };
  }
}

// ─── COPY UTIL ───────────────────────────────────────────────────────────────
function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const cat = DRUG_CATEGORIES[category] || { label: category, color: T.muted };
  return (
    <span style={{
      fontSize: 9, fontFamily: F.mono, fontWeight: 700, flexShrink: 0,
      color: cat.color, background: cat.color + "1A",
      border: "1px solid " + cat.color + "40",
      borderRadius: 4, padding: "1px 6px",
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>{cat.label}</span>
  );
}

function ModalityBadge({ modality }) {
  const colors = { CT: "#60A5FA", XR: "#34D399", US: "#F59E0B", MRI: "#A78BFA", Echo: "#FB923C" };
  const c = colors[modality] || T.cyan;
  return (
    <span style={{
      fontSize: 9, fontFamily: F.mono, fontWeight: 700, flexShrink: 0,
      color: c, background: c + "1A", border: "1px solid " + c + "40",
      borderRadius: 4, padding: "1px 7px",
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>{modality === "XR" ? "X-RAY" : modality}</span>
  );
}

function CopyBtn({ text, id, copiedId, onCopy }) {
  const done = copiedId === id;
  return (
    <button onClick={() => onCopy(text, id)} style={{
      background: done ? T.greenBg : T.glass,
      border: "1px solid " + (done ? T.green : T.border),
      borderRadius: 6, color: done ? T.green : T.muted,
      fontSize: 9, fontFamily: F.mono, padding: "2px 9px",
      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
      transition: "all 0.14s",
    }}>{done ? "✓ Copied" : "Copy"}</button>
  );
}

function Empty({ msg }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", color: T.muted, fontFamily: F.body, fontSize: 13 }}>
      {msg}
    </div>
  );
}

function SectionHead({ label, count, color }) {
  return (
    <div style={{
      fontSize: 9, fontFamily: F.mono, fontWeight: 700, color,
      letterSpacing: "0.1em", textTransform: "uppercase",
      marginBottom: 10, paddingBottom: 5,
      borderBottom: "1px solid " + color + "26",
      display: "flex", gap: 8, alignItems: "center",
    }}>
      {label}
      {count != null && <span style={{ color: T.dim, fontWeight: 400 }}>({count})</span>}
    </div>
  );
}

// ─── PANIC BANNER ────────────────────────────────────────────────────────────
function PanicBanner({ reason }) {
  return (
    <div style={{
      background: T.panicBg, border: "1px solid " + T.panicBord,
      borderRadius: 8, padding: "7px 11px", marginBottom: 7,
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <span style={{ flexShrink: 0, fontSize: 14 }}>⚠️</span>
      <div>
        <div style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.panic, marginBottom: 2, letterSpacing: "0.08em" }}>
          CLINICAL CAUTION
        </div>
        <div style={{ fontSize: 10, fontFamily: F.body, color: "#FFC0C0", lineHeight: 1.5 }}>
          {reason}
        </div>
      </div>
    </div>
  );
}

// ─── DOSE ROW ────────────────────────────────────────────────────────────────
function DoseRow({ dose, weightKg }) {
  const hasWt = weightKg != null;
  const doseStr = hasWt && dose.calculatedDose != null
    ? dose.calculatedDose + " " + dose.calculatedUnit
    : dose.isWeightBased
      ? (dose.perKgDisplay || (dose.mgPerKg + " " + dose.unit + "/kg"))
      : dose.display || (dose.flatDose + " " + dose.unit);
  const perKg = hasWt && dose.isWeightBased && dose.perKgDisplay
    ? "(" + dose.perKgDisplay + ")" : "";

  return (
    <div style={{ padding: "5px 0", borderBottom: "1px solid rgba(18,204,230,0.07)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontFamily: F.body, color: T.muted, minWidth: 130, flexShrink: 0, paddingTop: 1 }}>
          {dose.label}
        </span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontFamily: F.mono, fontWeight: 600, color: dose.cappedAtMax ? T.gold : T.cyan }}>
              {doseStr}
            </span>
            {perKg && <span style={{ fontSize: 10, fontFamily: F.mono, color: T.dim }}>{perKg}</span>}
            {dose.cappedAtMax && (
              <span style={{ fontSize: 9, fontFamily: F.mono, color: T.gold, background: T.goldDim, borderRadius: 4, padding: "1px 5px" }}>
                MAX DOSE
              </span>
            )}
            {!hasWt && dose.isWeightBased && (
              <span style={{ fontSize: 9, fontFamily: F.mono, color: T.amber }}>enter weight ↑</span>
            )}
          </div>
          {dose.route && (
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
              {dose.route.map(r => (
                <span key={r} style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, background: "rgba(232,243,255,0.06)", borderRadius: 3, padding: "1px 5px" }}>{r}</span>
              ))}
              {dose.rate && <span style={{ fontSize: 9, fontFamily: F.mono, color: T.muted }}>— {dose.rate}</span>}
            </div>
          )}
          {dose.notes && (
            <div style={{ fontSize: 10, fontFamily: F.body, color: T.dim, marginTop: 3, lineHeight: 1.5 }}>{dose.notes}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MED CARD ────────────────────────────────────────────────────────────────
function MedCard({ drug, weightKg, ageYears, copiedId, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const peds  = isPediatric(ageYears, weightKg);
  const doses = calcDose(drug, weightKg, peds);
  const orderText = doses ? formatMedOrder(drug, doses, weightKg) : drug.name;
  const hasDetails = drug.warnings?.length || drug.contraindications?.length || drug.isPanic;

  return (
    <div style={{
      background: drug.isPanic ? T.panicBg : T.glass,
      border: "1px solid " + (drug.isPanic ? T.panicBord : T.border),
      borderRadius: 10, padding: "10px 12px", marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 600, color: T.text, flex: 1, minWidth: 100 }}>
          {drug.name}
          {drug.brandName && (
            <span style={{ fontSize: 10, color: T.dim, fontWeight: 400, marginLeft: 5 }}>({drug.brandName})</span>
          )}
        </span>
        <CategoryBadge category={drug.category} />
        {drug.isPanic && (
          <span style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.panic, background: T.panicBg, border: "1px solid " + T.panicBord, borderRadius: 4, padding: "1px 6px" }}>
            ⚠ CAUTION
          </span>
        )}
        {peds && weightKg && (
          <span style={{ fontSize: 9, fontFamily: F.mono, color: T.amber, background: T.amberBg, borderRadius: 4, padding: "1px 6px" }}>PEDS</span>
        )}
      </div>

      {drug.isPanic && expanded && <PanicBanner reason={drug.panicReason} />}

      {drug.preparation && (
        <div style={{ fontSize: 10, fontFamily: F.mono, color: T.gold, background: T.goldDim, border: "1px solid rgba(240,180,41,0.2)", borderRadius: 5, padding: "3px 8px", marginBottom: 7 }}>
          {"🧪"} Mix: {drug.preparation}
        </div>
      )}

      {doses?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {(expanded ? doses : doses.slice(0, 1)).map((d, i) => (
            <DoseRow key={i} dose={d} weightKg={weightKg} />
          ))}
          {!expanded && doses.length > 1 && (
            <button onClick={() => setExpanded(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.cyan, fontSize: 10, fontFamily: F.mono, padding: "4px 0" }}>
              + {doses.length - 1} more dose{doses.length > 2 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {expanded && drug.warnings?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {drug.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: F.body, color: T.amber, display: "flex", gap: 5, padding: "2px 0" }}>
              <span>⚠</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {expanded && drug.contraindications?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontFamily: F.mono, color: T.panic, marginBottom: 3, letterSpacing: "0.07em" }}>CONTRAINDICATIONS</div>
          {drug.contraindications.map((c, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: F.body, color: "#FFAAAA", padding: "1px 0" }}>• {c}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
        <CopyBtn text={orderText} id={drug.id} copiedId={copiedId} onCopy={onCopy} />
        {drug.hubLink && (
          <button onClick={() => { window.location.href = "/" + drug.hubLink; }} style={{ background: "none", border: "1px solid " + T.border, borderRadius: 5, color: T.muted, fontSize: 9, fontFamily: F.mono, padding: "2px 8px", cursor: "pointer" }}>
            {drug.hubLink} →
          </button>
        )}
        {hasDetails && (
          <button onClick={() => setExpanded(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, fontSize: 9, fontFamily: F.mono, padding: "2px 0", marginLeft: "auto" }}>
            {expanded ? "Less ▴" : "Details ▾"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MEDS TAB ────────────────────────────────────────────────────────────────
function MedsTab({ weightKg, ageYears, activeScenario, searchQuery, copiedId, onCopy }) {
  let drugs = Object.values(MEDICATION_DB);
  if (activeScenario) {
    const sc = SCENARIOS[activeScenario];
    if (sc) drugs = drugs.filter(d => sc.drugIds.includes(d.id));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    drugs = drugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.genericName || "").toLowerCase().includes(q) ||
      (d.brandName || "").toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  }
  if (!drugs.length) return <Empty msg="No medications match." />;

  const groups = {};
  drugs.forEach(d => { if (!groups[d.category]) groups[d.category] = []; groups[d.category].push(d); });

  return (
    <div>
      {Object.entries(groups).map(([cat, list]) => {
        const def = DRUG_CATEGORIES[cat] || { label: cat, color: T.muted };
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <SectionHead label={def.label} count={list.length} color={def.color} />
            {list.map(drug => (
              <MedCard key={drug.id} drug={drug} weightKg={weightKg} ageYears={ageYears} copiedId={copiedId} onCopy={onCopy} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── IMAGING CARD ────────────────────────────────────────────────────────────
function ImagingCard({ img, copiedId, onCopy }) {
  const [show, setShow] = useState(false);
  const cc = { "with": T.gold, "without": T.green, "with and without": T.cyan, "N/A": T.dim }[img.contrast] || T.muted;

  return (
    <div style={{ background: T.glass, border: "1px solid " + T.border, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <ModalityBadge modality={img.modality} />
        <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 600, color: T.text, flex: 1 }}>{img.name}</span>
        {img.stat && (
          <span style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.panic, background: T.panicBg, border: "1px solid " + T.panicBord, borderRadius: 4, padding: "1px 6px" }}>STAT</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontFamily: F.body, color: T.muted }}>{img.region}</span>
        <span style={{ fontSize: 10, fontFamily: F.mono, color: cc }}>
          {img.contrast === "N/A" ? "No contrast" : "Contrast: " + img.contrast}
        </span>
      </div>
      <div style={{ fontSize: 10, fontFamily: F.body, color: T.dim, marginBottom: 7, lineHeight: 1.55 }}>{img.indication}</div>
      {show && (
        <div style={{ background: "rgba(0,0,0,0.28)", borderRadius: 6, padding: "8px 10px", fontFamily: F.mono, fontSize: 10, color: T.muted, lineHeight: 1.7, marginBottom: 8, whiteSpace: "pre-line", border: "1px solid rgba(18,204,230,0.10)" }}>
          {img.orderText}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <CopyBtn text={img.orderText} id={img.id} copiedId={copiedId} onCopy={onCopy} />
        {img.hubLink && (
          <button onClick={() => { window.location.href = "/" + img.hubLink; }} style={{ background: "none", border: "1px solid " + T.border, borderRadius: 5, color: T.muted, fontSize: 9, fontFamily: F.mono, padding: "2px 8px", cursor: "pointer" }}>
            {img.hubLink} →
          </button>
        )}
        <button onClick={() => setShow(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, fontSize: 9, fontFamily: F.mono, marginLeft: "auto" }}>
          {show ? "Hide order ▴" : "View order ▾"}
        </button>
      </div>
    </div>
  );
}

// ─── IMAGING TAB ─────────────────────────────────────────────────────────────
function ImagingTab({ activeScenario, searchQuery, copiedId, onCopy }) {
  let images = Object.values(IMAGING_DB);
  if (activeScenario) {
    const sc = SCENARIOS[activeScenario];
    if (sc) images = images.filter(i => (sc.imagingIds || []).includes(i.id));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    images = images.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.modality.toLowerCase().includes(q) ||
      i.region.toLowerCase().includes(q) ||
      i.indication.toLowerCase().includes(q)
    );
  }
  if (!images.length) return <Empty msg="No imaging orders match." />;

  const modOrder = ["CT", "XR", "US", "MRI", "Echo"];
  const modColors = { CT: "#60A5FA", XR: "#34D399", US: "#F59E0B", MRI: "#A78BFA", Echo: "#FB923C" };
  const modLabels = { CT: "CT Scan", XR: "X-Ray", US: "Ultrasound / POCUS", MRI: "MRI", Echo: "Echo" };
  const groups = {};
  images.forEach(i => { if (!groups[i.modality]) groups[i.modality] = []; groups[i.modality].push(i); });

  return (
    <div>
      {modOrder.filter(m => groups[m]).map(mod => (
        <div key={mod} style={{ marginBottom: 18 }}>
          <SectionHead label={modLabels[mod] || mod} count={groups[mod].length} color={modColors[mod] || T.cyan} />
          {groups[mod].map(img => <ImagingCard key={img.id} img={img} copiedId={copiedId} onCopy={onCopy} />)}
        </div>
      ))}
    </div>
  );
}

// ─── LABS TAB ────────────────────────────────────────────────────────────────
function PanelCard({ panel, copiedId, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: T.glass, border: "1px solid " + T.border, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 600, color: T.text, flex: 1 }}>{panel.name}</span>
        <span style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, background: T.glass, border: "1px solid " + T.border, borderRadius: 4, padding: "1px 6px" }}>
          {panel.items.length} tests
        </span>
      </div>
      {expanded && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", marginBottom: 8 }}>
          {panel.items.map((item, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: F.body, color: T.muted, padding: "2px 0", display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ color: T.cyan, fontSize: 8, flexShrink: 0 }}>●</span>{item}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <CopyBtn text={panel.orderText} id={panel.id} copiedId={copiedId} onCopy={onCopy} />
        <button onClick={() => setExpanded(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, fontSize: 9, fontFamily: F.mono, marginLeft: "auto" }}>
          {expanded ? "Hide ▴" : "View tests ▾"}
        </button>
      </div>
    </div>
  );
}

function LabsTab({ activeScenario, searchQuery, copiedId, onCopy }) {
  let panels = Object.values(LAB_PANELS);
  if (activeScenario) panels = panels.filter(p => p.scenarios.includes(activeScenario));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    panels = panels.filter(p => p.name.toLowerCase().includes(q) || p.items.some(i => i.toLowerCase().includes(q)));
  }
  if (!panels.length) return <Empty msg="No lab panels match." />;
  return (
    <div>
      <SectionHead label="Lab Panels" count={panels.length} color={T.cyan} />
      {panels.map(p => <PanelCard key={p.id} panel={p} copiedId={copiedId} onCopy={onCopy} />)}
    </div>
  );
}

// ─── WEIGHT INPUT ────────────────────────────────────────────────────────────
function WeightInput({ weightKg, weightUnit, weightInput, weightSource, onChange, onToggle, inputRef }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: T.glass, border: "1px solid " + T.border, borderRadius: 8, padding: "3px 10px" }}>
      <span style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, flexShrink: 0 }}>Wt</span>
      <input
        ref={inputRef} type="number" value={weightInput}
        onChange={e => onChange(e.target.value)}
        placeholder={weightUnit === "kg" ? "kg" : "lbs"} min="1" max="400"
        style={{ background: "none", border: "none", outline: "none", color: T.text, fontFamily: F.mono, fontSize: 12, width: 52, textAlign: "right" }}
      />
      <button onClick={onToggle} style={{ background: "none", border: "1px solid " + T.border, borderRadius: 4, color: T.cyan, fontSize: 9, fontFamily: F.mono, padding: "1px 6px", cursor: "pointer", flexShrink: 0 }}>
        {weightUnit}
      </button>
      {weightSource === "patient" && (
        <span style={{ fontSize: 9, fontFamily: F.mono, color: T.green, flexShrink: 0 }}>✓ pt</span>
      )}
      {weightKg && (
        <span style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, flexShrink: 0 }}>{weightKg} kg</span>
      )}
    </div>
  );
}

// ─── SCENARIO BAR ────────────────────────────────────────────────────────────
function ScenChip({ label, icon, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? color + "1E" : "none", border: "1px solid " + (active ? color : T.border), borderRadius: 20, padding: "3px 12px", color: active ? color : T.muted, fontSize: 10, fontFamily: F.mono, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function ScenarioBar({ activeScenario, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 5, padding: "7px 14px", overflowX: "auto", borderBottom: "1px solid " + T.border, background: "rgba(4,10,22,0.5)", scrollbarWidth: "none", flexShrink: 0 }}>
      <ScenChip label="All" active={activeScenario === null} color={T.cyan} onClick={() => onSelect(null)} />
      {Object.values(SCENARIOS).map(sc => (
        <ScenChip key={sc.id} label={sc.label} icon={sc.icon} active={activeScenario === sc.id} color={sc.accentColor} onClick={() => onSelect(activeScenario === sc.id ? null : sc.id)} />
      ))}
    </div>
  );
}

// ─── TAB BAR ─────────────────────────────────────────────────────────────────
function TabBar({ activeTab, onTab, searchQuery, onSearch, searchRef }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "1px solid " + T.border, background: "rgba(4,10,22,0.35)", flexShrink: 0 }}>
      {[["meds", "Medications"], ["imaging", "Imaging"], ["labs", "Labs & Orders"], ["reference", "Reference 📖"]].map(([id, label]) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => onTab(id)} style={{ background: "none", border: "none", borderBottom: "2px solid " + (active ? T.cyan : "transparent"), color: active ? T.cyan : T.muted, fontSize: 11, fontFamily: F.mono, fontWeight: active ? 600 : 400, padding: "10px 13px", cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <input
        ref={searchRef} type="text" value={searchQuery}
        onChange={e => onSearch(e.target.value)} placeholder="Search..."
        style={{ background: T.glass, border: "1px solid " + T.border, borderRadius: 6, padding: "4px 10px", color: T.text, fontFamily: F.mono, fontSize: 11, outline: "none", width: 155, margin: "5px 0" }}
      />
    </div>
  );
}

// ─── HUB LINKS BAR ───────────────────────────────────────────────────────────
function HubLinksBar() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 14px", borderTop: "1px solid " + T.border, background: "rgba(4,10,22,0.85)", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, marginRight: 4, letterSpacing: "0.08em" }}>HUBS</span>
      {HUB_LINKS.map(hub => (
        <button key={hub.id} onClick={() => { if (hub.path) window.location.href = hub.path; }} style={{
          background: hub.id === "EDOrderHub" ? T.cyanDim : T.glass,
          border: "1px solid " + (hub.id === "EDOrderHub" ? T.borderHi : T.border),
          borderRadius: 6, padding: "3px 9px",
          color: hub.id === "EDOrderHub" ? T.cyan : T.muted,
          fontSize: 10, fontFamily: F.mono, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {hub.icon} {hub.label}
        </button>
      ))}
    </div>
  );
}

// ─── REF CARD ────────────────────────────────────────────────────────────────
function RefCard({ item, copiedId, onCopy }) {
  const [expanded, setExpanded] = useState(false);
  const catDef = REF_CATEGORIES[item.category] || { label: item.category, color: T.muted };
  const copyContent = [
    item.name,
    item.clinicalUse,
    "",
    ...(item.items || []).filter(i => !i.isHeader).map(i => i.points != null ? `${i.label} (+${i.points})` : `• ${i.label}`),
    ...(item.interpretation ? ["\nInterpretation:", ...item.interpretation.map(i => `${i.range}: ${i.label} — ${i.action}`)] : []),
    ...(item.pearl ? [`\nPearl: ${item.pearl}`] : []),
    `Source: ${item.source}`,
  ].join("\n");

  return (
    <div style={{ background: T.glass, border: "1px solid " + T.border, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 600, color: T.text, flex: 1 }}>{item.name}</span>
        <span style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: catDef.color, background: catDef.color + "1A", border: "1px solid " + catDef.color + "40", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {catDef.label}
        </span>
      </div>
      <div style={{ fontSize: 10, fontFamily: F.body, color: T.muted, marginBottom: 7, lineHeight: 1.5 }}>{item.clinicalUse}</div>

      {expanded && (
        <>
          {item.items?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {item.items.map((it, i) => (
                it.isHeader ? (
                  <div key={i} style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.cyan, letterSpacing: "0.07em", textTransform: "uppercase", margin: "8px 0 4px" }}>{it.label}</div>
                ) : (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" }}>
                    <span style={{ color: T.cyan, fontSize: 8, flexShrink: 0, paddingTop: 3 }}>●</span>
                    <span style={{ fontSize: 10, fontFamily: F.body, color: T.muted, flex: 1 }}>
                      {it.label}
                      {it.points != null && <span style={{ fontFamily: F.mono, color: T.cyan, marginLeft: 6 }}>+{it.points}</span>}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}

          {item.interpretation?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>INTERPRETATION</div>
              {item.interpretation.map((interp, i) => (
                <div key={i} style={{ background: interp.color + "0D", border: "1px solid " + interp.color + "30", borderRadius: 6, padding: "5px 9px", marginBottom: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontFamily: F.mono, color: interp.color, fontWeight: 600 }}>{interp.range}</span>
                    <span style={{ fontSize: 10, fontFamily: F.body, fontWeight: 600, color: T.text }}>{interp.label}</span>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: F.body, color: T.muted }}>{interp.action}</div>
                </div>
              ))}
            </div>
          )}

          {item.pearl && (
            <div style={{ background: T.goldDim, border: "1px solid rgba(240,180,41,0.2)", borderRadius: 6, padding: "5px 9px", marginBottom: 7 }}>
              <span style={{ fontSize: 9, fontFamily: F.mono, color: T.gold, fontWeight: 700, letterSpacing: "0.06em" }}>PEARL </span>
              <span style={{ fontSize: 10, fontFamily: F.body, color: "#FDE68A" }}>{item.pearl}</span>
            </div>
          )}

          <div style={{ fontSize: 9, fontFamily: F.mono, color: T.dim, marginBottom: 7 }}>📖 {item.source}</div>
        </>
      )}

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <CopyBtn text={copyContent} id={item.id} copiedId={copiedId} onCopy={onCopy} />
        {item.hubLink && (
          <button onClick={() => { window.location.href = "/" + item.hubLink; }} style={{ background: "none", border: "1px solid " + T.border, borderRadius: 5, color: T.muted, fontSize: 9, fontFamily: F.mono, padding: "2px 8px", cursor: "pointer" }}>
            {item.hubLink} →
          </button>
        )}
        <button onClick={() => setExpanded(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, fontSize: 9, fontFamily: F.mono, marginLeft: "auto" }}>
          {expanded ? "Collapse ▴" : "Expand ▾"}
        </button>
      </div>
    </div>
  );
}

// ─── REFERENCE TAB ───────────────────────────────────────────────────────────
function ReferenceTab({ activeScenario, searchQuery, copiedId, onCopy }) {
  let refs = Object.values(REFERENCE_DB);
  if (activeScenario) refs = refs.filter(r => !r.scenarios?.length || r.scenarios.includes(activeScenario));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    refs = refs.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.shortName || "").toLowerCase().includes(q) ||
      r.clinicalUse.toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  const groups = {};
  refs.forEach(r => { if (!groups[r.category]) groups[r.category] = []; groups[r.category].push(r); });

  if (!refs.length) return <Empty msg="No references match." />;

  return (
    <div>
      {Object.entries(groups).map(([cat, list]) => {
        const def = REF_CATEGORIES[cat] || { label: cat, color: T.muted };
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <SectionHead label={def.label} count={list.length} color={def.color} />
            {list.map(item => (
              <RefCard key={item.id} item={item} copiedId={copiedId} onCopy={onCopy} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────────
export default function CommandKit() {
  const [isOpen, setIsOpen]                 = useState(false);
  const [activeTab, setActiveTab]           = useState("meds");
  const [activeScenario, setActiveScenario] = useState(null);
  const [patient, setPatient]               = useState({ name: "", mrn: "", age: null, weight: null });
  const [weightKg, setWeightKg]             = useState(null);
  const [weightUnit, setWeightUnit]         = useState("kg");
  const [weightInput, setWeightInput]       = useState("");
  const [weightSource, setWeightSource]     = useState("manual");
  const [searchQuery, setSearchQuery]       = useState("");
  const [copiedId, setCopiedId]             = useState(null);

  const searchRef = useRef(null);
  const weightRef = useRef(null);

  const voice = useVoiceCommand({
    onOpen:     () => setIsOpen(true),
    onTab:      (t) => { setActiveTab(t); setSearchQuery(""); },
    onSearch:   (q) => setSearchQuery(q),
    onScenario: (id) => setActiveScenario(id),
    onWeight:   (val) => {
      setWeightInput(val);
      setWeightSource("manual");
      const n = parseFloat(val);
      setWeightKg(!isNaN(n) && n > 0 ? (weightUnit === "lbs" ? lbsToKg(n) : n) : null);
    },
  });

  // Re-read patient context from URL every time modal opens
  useEffect(() => {
    if (!isOpen) return;
    const ctx = readPatientFromURL();
    setPatient(ctx);
    if (ctx.weight) {
      setWeightKg(ctx.weight);
      setWeightInput(String(ctx.weight));
      setWeightSource("patient");
    }
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  // Clear search on close
  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.code === "Space") {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag === "textarea") return;
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          weightRef.current?.focus();
          weightRef.current?.select();
        }
      }
      if (e.key === "Escape" && isOpen) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleWeightChange = useCallback((val) => {
    setWeightInput(val);
    setWeightSource("manual");
    const n = parseFloat(val);
    setWeightKg(!isNaN(n) && n > 0 ? (weightUnit === "lbs" ? lbsToKg(n) : n) : null);
  }, [weightUnit]);

  const handleUnitToggle = useCallback(() => {
    setWeightUnit(prev => {
      const next = prev === "kg" ? "lbs" : "kg";
      if (weightKg) setWeightInput(String(next === "lbs" ? kgToLbs(weightKg) : weightKg));
      return next;
    });
  }, [weightKg]);

  const handleCopy = useCallback((text, id) => {
    copyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(p => p === id ? null : p), 1300);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchQuery("");
  }, []);

  const peds = isPediatric(patient.age, weightKg);

  // ── TRIGGER BUTTON ────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="CommandKit — Ctrl+Space"
        style={{
          position: "fixed", bottom: 22, right: 22, zIndex: 8900,
          width: 50, height: 50, borderRadius: "50%",
          background: "linear-gradient(140deg, #0B1A30 0%, #060C19 100%)",
          border: "1px solid " + T.borderHi,
          boxShadow: "0 0 22px rgba(18,204,230,0.28), 0 4px 18px rgba(0,0,0,0.65)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 21,
        }}
      >
        ⚡
      </button>
    );
  }

  // ── OVERLAY ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 9000, background: T.overlay, backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", zIndex: 9001,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(920px, 96vw)",
        height: "min(84vh, 780px)",
        background: T.surface,
        border: "1px solid " + T.borderHi,
        borderRadius: 18,
        boxShadow: "0 32px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(18,204,230,0.07)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        fontFamily: F.body,
      }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: "1px solid " + T.border, background: "rgba(4,10,22,0.70)", flexWrap: "wrap", flexShrink: 0 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 17 }}>⚡</span>
            <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: "0.03em" }}>
              CommandKit
            </span>
            <span style={{ fontSize: 8, fontFamily: F.mono, color: T.dim, background: T.glass, border: "1px solid " + T.border, borderRadius: 4, padding: "1px 5px" }}>
              Ctrl+Space
            </span>
          </div>

          {patient.name && (
            <div style={{ fontSize: 10, fontFamily: F.mono, color: T.muted, background: T.glass, border: "1px solid " + T.border, borderRadius: 6, padding: "3px 9px", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: T.cyan }}>●</span>
              {patient.name}
              {patient.mrn && <span style={{ color: T.dim }}>• #{patient.mrn}</span>}
              {patient.age && <span style={{ color: T.dim }}>• {patient.age}y</span>}
            </div>
          )}

          {peds && (
            <span style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: T.amber, background: T.amberBg, border: "1px solid " + T.amber + "40", borderRadius: 4, padding: "2px 7px" }}>
              PEDS DOSING ACTIVE
            </span>
          )}

          <div style={{ flex: 1 }} />

          <WeightInput
            weightKg={weightKg} weightUnit={weightUnit}
            weightInput={weightInput} weightSource={weightSource}
            onChange={handleWeightChange} onToggle={handleUnitToggle}
            inputRef={weightRef}
          />

          {voice.isSupported && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <button
                onClick={() => voice.listening ? voice.stop() : voice.start()}
                title={voice.listening ? "Listening… (click to stop)" : "Voice command (say: 'dose morphine', 'guideline HEART', 'sepsis')"}
                style={{
                  background: voice.listening ? "rgba(255,68,68,0.15)" : T.glass,
                  border: "1px solid " + (voice.listening ? "rgba(255,68,68,0.55)" : T.border),
                  borderRadius: 8, width: 34, height: 34,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 16, flexShrink: 0,
                  boxShadow: voice.listening ? "0 0 10px rgba(255,68,68,0.35)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {voice.listening ? "🔴" : "🎙️"}
              </button>
              {voice.lastCommand && !voice.listening && (
                <span style={{ fontSize: 8, fontFamily: F.mono, color: T.dim, maxWidth: 80, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {voice.lastCommand}
                </span>
              )}
              {voice.error && (
                <span style={{ fontSize: 8, fontFamily: F.mono, color: T.panic }}>{voice.error}</span>
              )}
            </div>
          )}

          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
            ✕
          </button>
        </div>

        {/* ── SCENARIO BAR ────────────────────────────────────────────────── */}
        <ScenarioBar activeScenario={activeScenario} onSelect={setActiveScenario} />

        {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
        <TabBar
          activeTab={activeTab} onTab={handleTabChange}
          searchQuery={searchQuery} onSearch={setSearchQuery}
          searchRef={searchRef}
        />

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", scrollbarWidth: "thin", scrollbarColor: T.border + " transparent" }}>
          {activeTab === "meds" && (
            <MedsTab weightKg={weightKg} ageYears={patient.age} activeScenario={activeScenario} searchQuery={searchQuery} copiedId={copiedId} onCopy={handleCopy} />
          )}
          {activeTab === "imaging" && (
            <ImagingTab activeScenario={activeScenario} searchQuery={searchQuery} copiedId={copiedId} onCopy={handleCopy} />
          )}
          {activeTab === "labs" && (
            <LabsTab activeScenario={activeScenario} searchQuery={searchQuery} copiedId={copiedId} onCopy={handleCopy} />
          )}
          {activeTab === "reference" && (
            <ReferenceTab activeScenario={activeScenario} searchQuery={searchQuery} copiedId={copiedId} onCopy={handleCopy} />
          )}
        </div>

        {/* ── HUB LINKS ───────────────────────────────────────────────────── */}
        <HubLinksBar />
      </div>
    </>
  );
}