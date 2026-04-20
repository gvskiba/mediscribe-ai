import { useState, useCallback, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// ─── MDM TAB ──────────────────────────────────────────────────────────────────
// AI-powered Medical Decision Making documentation for Emergency Medicine.
//
// Sections (all collapsible):
//   1. Orders Rationale  — labs/imaging/ECG entries with why-ordered + AI interpretation
//   2. ED Course         — intervention timeline + response to treatment
//   3. Impressions       — Initial & Final + AI evidence chip generation
//   4. MDM Complexity    — AMA 2023 E&M checklist + AI complexity assessment
//   5. MDM Note          — AI-generated full MDM narrative
//
// AI calls (all via base44.integrations.Core.InvokeLLM):
//   generateRationale    — per-order rationale from CC + DDx context
//   interpretResult      — clinical significance of entered result
//   generateEvidence     — chart-evidence chips for initial / final impression
//   assessComplexity     — AI E&M level + reasoning from encounter data
//   buildMDMNote         — full MDM narrative for the chart
//
// Props:
//   cc           { text, hpi }
//   vitals       { bp, hr, spo2, temp, rr }
//   patientAge   string
//   patientSex   string
//   pmhSelected  string[]
//   medications  string[]
//   allergies    string[]
//   ddx          { diagnosis, likelihood, supporting, against }[]  (from InlineHPITab)
//   onAdvance    () => void
//   showToast    (msg, type) => void
//
// Constraints: no form, no localStorage, no router, no alert, no sonner direct
//   import — uses showToast prop. straight quotes only. <1600 lines.

// ─── CSS ─────────────────────────────────────────────────────────────────────
const MDM_CSS = `
.mdm-root{display:flex;flex-direction:column;gap:0;height:100%;overflow-y:auto;padding:14px 14px 36px;background:transparent;}
.mdm-root::-webkit-scrollbar{width:4px;}
.mdm-root::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px;}

.mdm-section{background:rgba(8,22,40,0.72);border:1px solid rgba(26,53,85,0.7);border-radius:10px;margin-bottom:10px;overflow:hidden;backdrop-filter:blur(8px);}
.mdm-section-hdr{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(26,53,85,0.5);cursor:pointer;user-select:none;background:rgba(11,30,54,0.4);}
.mdm-section-hdr:hover{background:rgba(14,37,68,0.6);}
.mdm-section-icon{font-size:14px;width:22px;text-align:center;}
.mdm-section-title{font-family:"Playfair Display",serif;font-size:13px;font-weight:600;color:#b8d0f0;flex:1;}
.mdm-section-count{font-family:"JetBrains Mono",monospace;font-size:10px;color:#4a6a8a;padding:2px 7px;border:1px solid #1a3555;border-radius:20px;}
.mdm-section-count.d{color:#00e5c0;border-color:#00e5c022;background:#00e5c010;}
.mdm-section-chevron{color:#2e4a6a;font-size:11px;transition:transform 0.15s;}
.mdm-section-chevron.open{transform:rotate(90deg);}
.mdm-section-body{padding:14px;}

.mdm-order-list{display:flex;flex-direction:column;gap:10px;}
.mdm-order-card{background:rgba(11,30,54,0.5);border:1px solid rgba(26,53,85,0.6);border-radius:8px;overflow:hidden;}
.mdm-order-card.abnl{border-color:rgba(255,107,107,0.3);}
.mdm-order-top{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid rgba(26,53,85,0.4);}
.mdm-type-badge{font-family:"JetBrains Mono",monospace;font-size:9px;font-weight:600;padding:2px 7px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;}
.mdm-type-badge.lab{background:#3b9eff18;color:#3b9eff;border:1px solid #3b9eff28;}
.mdm-type-badge.imaging{background:#9b6dff18;color:#9b6dff;border:1px solid #9b6dff28;}
.mdm-type-badge.ecg{background:#ff6b6b18;color:#ff6b6b;border:1px solid #ff6b6b28;}
.mdm-type-badge.other{background:#f5c84218;color:#f5c842;border:1px solid #f5c84228;}
.mdm-order-name{font-size:13px;font-weight:500;color:#e8f0fe;flex:1;}
.mdm-abnl-tag{font-family:"JetBrains Mono",monospace;font-size:9px;color:#ff6b6b;border:1px solid #ff6b6b28;border-radius:3px;padding:1px 5px;}
.mdm-del-btn{background:none;border:none;color:#2e4a6a;cursor:pointer;font-size:13px;padding:2px 5px;border-radius:4px;line-height:1;}
.mdm-del-btn:hover{color:#ff6b6b;background:#ff6b6b12;}

.mdm-order-fields{padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
.mdm-fl{display:flex;flex-direction:column;gap:3px;}
.mdm-lbl{font-size:10px;font-weight:600;color:#4a6a8a;text-transform:uppercase;letter-spacing:0.6px;display:flex;align-items:center;gap:6px;}
.mdm-lbl .ai-tag{font-size:9px;color:#00e5c0;opacity:0.75;font-weight:500;text-transform:none;letter-spacing:0;}
.mdm-ta{width:100%;background:rgba(5,15,30,0.6);border:1px solid rgba(26,53,85,0.5);border-radius:6px;color:#c8dff8;font-family:"DM Sans",sans-serif;font-size:12px;line-height:1.55;padding:7px 10px;resize:none;outline:none;transition:border-color 0.15s,box-shadow 0.15s;min-height:46px;}
.mdm-ta:focus{border-color:rgba(59,158,255,0.4);box-shadow:0 0 0 2px rgba(59,158,255,0.08);}
.mdm-ta.ai{border-color:rgba(0,229,192,0.3);color:#d8f8f0;}
.mdm-in{width:100%;background:rgba(5,15,30,0.6);border:1px solid rgba(26,53,85,0.5);border-radius:6px;color:#c8dff8;font-family:"DM Sans",sans-serif;font-size:12px;padding:6px 10px;outline:none;transition:border-color 0.15s;}
.mdm-in:focus{border-color:rgba(59,158,255,0.4);}

.mdm-ai-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.2);border-radius:5px;color:#00e5c0;font-family:"DM Sans",sans-serif;font-size:10px;font-weight:600;padding:4px 10px;cursor:pointer;transition:background 0.12s,border-color 0.12s;white-space:nowrap;}
.mdm-ai-btn:hover:not(:disabled){background:rgba(0,229,192,0.16);border-color:rgba(0,229,192,0.35);}
.mdm-ai-btn:disabled{opacity:0.45;cursor:not-allowed;}
.mdm-ai-btn.busy{color:#8aaccc;border-color:rgba(138,172,204,0.2);background:rgba(138,172,204,0.06);}
.mdm-dot{width:6px;height:6px;border-radius:50%;background:#00e5c0;animation:mdm-pulse 1.2s ease-in-out infinite;}
@keyframes mdm-pulse{0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1.1);}}
.mdm-spin{width:10px;height:10px;border:2px solid rgba(0,229,192,0.2);border-top-color:#00e5c0;border-radius:50%;animation:mdm-rot 0.7s linear infinite;flex-shrink:0;}
@keyframes mdm-rot{to{transform:rotate(360deg);}}

.mdm-add-bar{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.mdm-add-type-btn{background:rgba(11,30,54,0.7);border:1px dashed rgba(42,79,122,0.5);border-radius:6px;color:#4a6a8a;font-family:"DM Sans",sans-serif;font-size:11px;padding:5px 12px;cursor:pointer;transition:color 0.12s,border-color 0.12s,background 0.12s;display:flex;align-items:center;gap:5px;}
.mdm-add-type-btn:hover{color:#8aaccc;border-color:#2a4f7a;background:rgba(14,37,68,0.5);}
.mdm-add-row{display:flex;gap:6px;margin-top:8px;align-items:center;}
.mdm-add-in{flex:1;background:rgba(5,15,30,0.7);border:1px solid #2a4f7a;border-radius:6px;color:#c8dff8;font-family:"DM Sans",sans-serif;font-size:12px;padding:6px 10px;outline:none;}
.mdm-add-in:focus{border-color:#3b9eff88;}
.mdm-add-btn{background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.3);border-radius:6px;color:#3b9eff;font-size:11px;font-family:"DM Sans",sans-serif;font-weight:600;padding:6px 12px;cursor:pointer;}
.mdm-add-btn:hover{background:rgba(59,158,255,0.2);}

.mdm-timeline{display:flex;flex-direction:column;gap:0;position:relative;}
.mdm-timeline::before{content:"";position:absolute;left:11px;top:20px;bottom:20px;width:1px;background:linear-gradient(to bottom,#1a3555,#1a3555 80%,transparent);}
.mdm-tl-item{display:flex;gap:12px;align-items:flex-start;padding:0 0 14px;position:relative;}
.mdm-tl-dot{width:22px;height:22px;border-radius:50%;background:rgba(14,37,68,0.9);border:1px solid #2a4f7a;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;z-index:1;margin-top:4px;}
.mdm-tl-dot.good{border-color:#3dffa060;background:#3dffa010;}
.mdm-tl-dot.partial{border-color:#f5c84260;background:#f5c84210;}
.mdm-tl-dot.poor{border-color:#ff6b6b60;background:#ff6b6b10;}
.mdm-tl-content{flex:1;}
.mdm-tl-row1{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.mdm-tl-time{font-family:"JetBrains Mono",monospace;font-size:10px;color:#4a6a8a;white-space:nowrap;}
.mdm-tl-action{font-size:12px;font-weight:500;color:#c8dff8;}
.mdm-resp-badge{font-size:9px;font-weight:600;padding:2px 7px;border-radius:10px;text-transform:uppercase;letter-spacing:0.4px;}
.mdm-resp-badge.good{background:#3dffa014;color:#3dffa0;border:1px solid #3dffa028;}
.mdm-resp-badge.partial{background:#f5c84214;color:#f5c842;border:1px solid #f5c84228;}
.mdm-resp-badge.poor{background:#ff6b6b14;color:#ff6b6b;border:1px solid #ff6b6b28;}

.mdm-imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.mdm-imp-card{background:rgba(11,30,54,0.5);border-radius:8px;padding:12px;}
.mdm-imp-card.ini{border:1px solid rgba(59,158,255,0.25);}
.mdm-imp-card.fin{border:1px solid rgba(61,255,160,0.25);}
.mdm-imp-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:6px;}
.mdm-imp-lbl.ini{color:#3b9eff88;}
.mdm-imp-lbl.fin{color:#3dffa088;}
.mdm-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;}
.mdm-chip{font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(155,109,255,0.1);border:1px solid rgba(155,109,255,0.2);color:#b899ff;cursor:pointer;}
.mdm-chip:hover{background:rgba(255,107,107,0.1);border-color:rgba(255,107,107,0.22);color:#ff8a8a;}

.mdm-cx-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;}
.mdm-cx-col{background:rgba(11,30,54,0.4);border:1px solid rgba(26,53,85,0.6);border-radius:8px;padding:10px 12px;}
.mdm-cx-col-ttl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a8a;margin-bottom:8px;}
.mdm-cx-item{display:flex;align-items:flex-start;gap:7px;margin-bottom:5px;cursor:pointer;}
.mdm-cx-box{width:14px;height:14px;border-radius:3px;border:1px solid #2a4f7a;background:rgba(5,15,30,0.5);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:9px;transition:background 0.1s,border-color 0.1s;}
.mdm-cx-box.on{background:#3b9eff22;border-color:#3b9eff60;color:#3b9eff;}
.mdm-cx-lbl{font-size:11px;color:#8aaccc;line-height:1.4;}
.mdm-level{display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(11,30,54,0.5);border-radius:8px;border:1px solid rgba(26,53,85,0.5);}
.mdm-level-val{font-family:"Playfair Display",serif;font-size:26px;font-weight:700;min-width:60px;}
.mdm-level-val.low{color:#3b9eff;}
.mdm-level-val.mod{color:#f5c842;}
.mdm-level-val.high{color:#ff9f43;}
.mdm-level-val.strf{color:#ff6b6b;}
.mdm-level-sub{font-size:11px;color:#8aaccc;}
.mdm-level-reasoning{font-size:11px;color:#8aaccc;margin-top:4px;font-style:italic;}
.mdm-level-code{font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:600;color:#00e5c0;margin-left:auto;}

.mdm-note-out{background:rgba(5,15,30,0.7);border:1px solid rgba(61,255,160,0.2);border-radius:8px;padding:14px;font-family:"JetBrains Mono",monospace;font-size:11px;line-height:1.75;color:#b8e8d8;white-space:pre-wrap;min-height:80px;}
.mdm-note-ph{color:#2e4a6a;font-family:"DM Sans",sans-serif;font-size:12px;font-style:italic;}
.mdm-note-acts{display:flex;gap:8px;margin-top:10px;}

.mdm-ghost{background:rgba(11,30,54,0.6);border:1px solid rgba(42,79,122,0.5);border-radius:6px;color:#8aaccc;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:500;padding:5px 12px;cursor:pointer;transition:color 0.12s,border-color 0.12s;}
.mdm-ghost:hover{color:#c8dff8;border-color:#2a4f7a;}
.mdm-primary{background:rgba(0,229,192,0.1);border:1px solid rgba(0,229,192,0.28);border-radius:6px;color:#00e5c0;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:700;padding:5px 14px;cursor:pointer;transition:background 0.12s;}
.mdm-primary:hover:not(:disabled){background:rgba(0,229,192,0.18);}
.mdm-primary:disabled{opacity:0.4;cursor:not-allowed;}
.mdm-advance-row{display:flex;justify-content:flex-end;margin-top:4px;}
.mdm-advance{background:rgba(59,158,255,0.12);border:1px solid rgba(59,158,255,0.3);border-radius:6px;color:#3b9eff;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:700;padding:6px 16px;cursor:pointer;transition:background 0.12s;}
.mdm-advance:hover{background:rgba(59,158,255,0.2);}
`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ORDER_TYPES = [
  { key: "lab",     label: "Lab",     icon: "🔬" },
  { key: "imaging", label: "Imaging", icon: "🩻" },
  { key: "ecg",     label: "ECG",     icon: "📈" },
  { key: "other",   label: "Other",   icon: "📋" },
];

const DX_OPTS = [
  { id: "undiag",       label: "Undiagnosed new problem, uncertain prognosis" },
  { id: "chronic-exac", label: "Chronic illness with exacerbation" },
  { id: "est-worse",    label: "Established problem — worsening" },
  { id: "new-workup",   label: "New problem — additional workup planned" },
  { id: "new-no-wk",    label: "New problem — no workup planned" },
  { id: "est-stable",   label: "Established problem — stable / improving" },
];

const DATA_OPTS = [
  { id: "lab-review",   label: "Review of external labs" },
  { id: "img-review",   label: "Independent interpretation of imaging" },
  { id: "ecg-review",   label: "Independent ECG interpretation" },
  { id: "rec-review",   label: "Review of external records or history" },
  { id: "ind-hist",     label: "Independent history from 3rd party" },
  { id: "discuss",      label: "Discussion with treating physician" },
];

const RISK_OPTS = [
  { id: "threat",     label: "Life-threatening or severely debilitating condition" },
  { id: "proc-major", label: "Major surgery or procedure planned" },
  { id: "hospital",   label: "Decision regarding hospitalization" },
  { id: "drug-high",  label: "Drug therapy requiring intensive monitoring" },
  { id: "dx-new-tx",  label: "New diagnosis with possible treatment" },
  { id: "rx-mgmt",    label: "Prescription drug management" },
  { id: "otc-rx",     label: "OTC drugs or minor prescription risk" },
];

const RESP_OPTS = [
  { key: "good",    label: "Good" },
  { key: "partial", label: "Partial" },
  { key: "poor",    label: "No response" },
  { key: "na",      label: "N/A" },
];

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────
const S_RATIONALE = {
  type: "object",
  properties: { rationale: { type: "string" } },
  required: ["rationale"],
};
const S_INTERP = {
  type: "object",
  properties: {
    interpretation: { type: "string" },
    abnormal: { type: "boolean" },
  },
  required: ["interpretation", "abnormal"],
};
const S_EVIDENCE = {
  type: "object",
  properties: { evidence: { type: "array", items: { type: "string" } } },
  required: ["evidence"],
};
const S_COMPLEXITY = {
  type: "object",
  properties: {
    level:     { type: "string", enum: ["low", "moderate", "high"] },
    cpt:       { type: "string" },
    reasoning: { type: "string" },
  },
  required: ["level", "cpt", "reasoning"],
};
const S_NOTE = {
  type: "object",
  properties: {
    note:       { type: "string" },
    cpt:        { type: "string" },
    complexity: { type: "string", enum: ["low", "moderate", "high"] },
  },
  required: ["note"],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function calcLevel(dx, data, risk) {
  const ds = dx.has("undiag") || dx.has("chronic-exac") || dx.has("est-worse") ? 3
    : dx.has("new-workup") ? 2
    : dx.size > 0 ? 1 : 0;
  const rs = risk.has("threat") || risk.has("proc-major") || risk.has("hospital") ? 3
    : risk.has("drug-high") || risk.has("rx-mgmt") || risk.has("dx-new-tx") ? 2
    : risk.size > 0 ? 1 : 0;
  const dts = data.size >= 3 ? 3 : data.size >= 1 ? 2 : 0;
  const score = Math.min(ds, Math.max(rs, dts));
  if (score >= 3) return { label: "High Complexity",          code: "99285", css: "strf" };
  if (score === 2) return { label: "Moderate Complexity",     code: "99284", css: "high" };
  if (score === 1) return { label: "Low Complexity",          code: "99283", css: "mod"  };
  return               { label: "Straightforward",            code: "99282", css: "low"  };
}

function buildCtx(cc, orders, course, imps, dx, data, risk, age, sex, vitals, pmh) {
  const v = vitals || {};
  const vl = [v.bp && "BP " + v.bp, v.hr && "HR " + v.hr, v.spo2 && "SpO2 " + v.spo2 + "%", v.temp && "T " + v.temp].filter(Boolean).join(" | ");
  const ol = orders.map(o => o.type.toUpperCase() + " " + o.name + ": rationale=" + (o.rationale || "none") + " result=" + (o.result || "pending") + " interp=" + (o.interpretation || "none")).join("\n");
  const cl = course.map(c => (c.time || "?") + " — " + c.action + " (resp:" + (c.response || "na") + ") " + (c.notes || "")).join("\n");
  return [
    "Patient: " + (age || "?") + " yo " + (sex || ""),
    "CC: " + (cc?.text || "Not specified"),
    vl && "Vitals: " + vl,
    "PMH: " + ((pmh || []).join(", ") || "None"),
    "\nOrders:\n" + (ol || "None"),
    "\nED Course:\n" + (cl || "None"),
    "Initial Impression: " + (imps.initial || "Not documented"),
    "Final Impression: " + (imps.final || "Not documented"),
    "Dx complexity: " + ([...dx].join(", ") || "none"),
    "Data reviewed: " + ([...data].join(", ") || "none"),
    "Risk factors: " + ([...risk].join(", ") || "none"),
  ].filter(Boolean).join("\n");
}

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
function OrderCard({ order, idx, cc, ddx, age, sex, vitals, onUpdate, onRemove, showToast }) {
  const [ratBusy, setRatBusy] = useState(false);
  const [intBusy, setIntBusy] = useState(false);

  const genRationale = useCallback(async () => {
    if (ratBusy) return;
    setRatBusy(true);
    try {
      const ddxList = (ddx || []).slice(0, 4).map(d => d.diagnosis || d.name || d).join(", ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: "You are an emergency physician. CC: \"" + (cc?.text || "unknown") + "\". Top differentials: [" + (ddxList || "unspecified") + "]. Write a concise 1-2 sentence clinical rationale for ordering: " + order.type.toUpperCase() + " — " + order.name + ". Be specific to the CC and differentials. Use clinical language.",
        response_json_schema: S_RATIONALE,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      onUpdate(idx, "rationale", p.rationale || "");
      onUpdate(idx, "rationaleAI", true);
    } catch (_) {
      showToast("Could not generate rationale.", "error");
    } finally {
      setRatBusy(false);
    }
  }, [ratBusy, cc, ddx, order, idx, onUpdate, showToast]);

  const genInterp = useCallback(async () => {
    if (intBusy || !order.result) return;
    setIntBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: "You are an emergency physician. Interpret this result in 2-3 sentences. Note abnormal findings and clinical significance. Be direct and clinical.\nOrder: " + order.type.toUpperCase() + " — " + order.name + "\nResult: " + order.result + "\nPatient: " + (age || "?") + " yo " + (sex || "") + ", CC: " + (cc?.text || "unknown"),
        response_json_schema: S_INTERP,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      onUpdate(idx, "interpretation", p.interpretation || "");
      onUpdate(idx, "interpAI", true);
      onUpdate(idx, "abnormal", p.abnormal || false);
    } catch (_) {
      showToast("Could not interpret result.", "error");
    } finally {
      setIntBusy(false);
    }
  }, [intBusy, order, cc, age, sex, idx, onUpdate, showToast]);

  return (
    <div className={"mdm-order-card" + (order.abnormal ? " abnl" : "")}>
      <div className="mdm-order-top">
        <span className={"mdm-type-badge " + order.type}>{order.type}</span>
        <span className="mdm-order-name">{order.name}</span>
        {order.abnormal && <span className="mdm-abnl-tag">ABNL</span>}
        <button className="mdm-del-btn" onClick={() => onRemove(idx)}>✕</button>
      </div>
      <div className="mdm-order-fields">
        <div className="mdm-fl">
          <div className="mdm-lbl">Why Ordered {order.rationaleAI && <span className="ai-tag">AI</span>}</div>
          <textarea className={"mdm-ta" + (order.rationaleAI ? " ai" : "")} rows={2}
            placeholder="Clinical rationale for ordering..."
            value={order.rationale || ""} onChange={e => onUpdate(idx, "rationale", e.target.value)} />
          <button className={"mdm-ai-btn" + (ratBusy ? " busy" : "")} onClick={genRationale} disabled={ratBusy}>
            {ratBusy ? <><div className="mdm-spin" />Generating...</> : <><div className="mdm-dot" />Generate Rationale</>}
          </button>
        </div>
        <div className="mdm-fl">
          <div className="mdm-lbl">Result / Findings</div>
          <textarea className="mdm-ta" rows={2}
            placeholder="Enter result or findings..."
            value={order.result || ""} onChange={e => onUpdate(idx, "result", e.target.value)} />
        </div>
        <div className="mdm-fl">
          <div className="mdm-lbl">Clinical Interpretation {order.interpAI && <span className="ai-tag">AI</span>}</div>
          <textarea className={"mdm-ta" + (order.interpAI ? " ai" : "")} rows={2}
            placeholder="Clinical significance of result..."
            value={order.interpretation || ""} onChange={e => onUpdate(idx, "interpretation", e.target.value)} />
          <button className={"mdm-ai-btn" + (intBusy ? " busy" : "")} onClick={genInterp}
            disabled={intBusy || !order.result} title={!order.result ? "Enter a result first" : ""}>
            {intBusy ? <><div className="mdm-spin" />Interpreting...</> : <><div className="mdm-dot" />Interpret Result</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function MDMTab({
  cc, vitals, patientAge, patientSex, pmhSelected,
  medications, allergies, ddx,
  onAdvance, showToast,
}) {
  const [open, setOpen] = useState({ orders: true, course: true, impressions: true, complexity: false, note: false });
  const tog = useCallback(k => setOpen(p => ({ ...p, [k]: !p[k] })), []);

  // orders
  const [orders, setOrders]       = useState([]);
  const [addType, setAddType]     = useState(null);
  const [addName, setAddName]     = useState("");
  const addRef                    = useRef(null);

  useEffect(() => { if (addType && addRef.current) setTimeout(() => addRef.current.focus(), 40); }, [addType]);

  const updateOrder = useCallback((i, f, v) => setOrders(p => p.map((o, j) => j === i ? { ...o, [f]: v } : o)), []);
  const removeOrder = useCallback(i => setOrders(p => p.filter((_, j) => j !== i)), []);
  const confirmAdd = useCallback(() => {
    if (!addType || !addName.trim()) return;
    setOrders(p => [...p, { type: addType, name: addName.trim(), rationale: "", result: "", interpretation: "", rationaleAI: false, interpAI: false, abnormal: false }]);
    setAddType(null); setAddName("");
  }, [addType, addName]);

  // ED course
  const [course, setCourse]       = useState([]);
  const [addCourse, setAddCourse] = useState(false);
  const [nAction, setNAction]     = useState("");
  const [nTime, setNTime]         = useState("");
  const [nResp, setNResp]         = useState("good");
  const [nNotes, setNNotes]       = useState("");
  const confirmCourse = useCallback(() => {
    if (!nAction.trim()) return;
    setCourse(p => [...p, { action: nAction.trim(), time: nTime.trim(), response: nResp, notes: nNotes.trim() }]);
    setNAction(""); setNTime(""); setNResp("good"); setNNotes(""); setAddCourse(false);
  }, [nAction, nTime, nResp, nNotes]);
  const removeCourse = useCallback(i => setCourse(p => p.filter((_, j) => j !== i)), []);

  // impressions
  const [imps, setImps]               = useState({ initial: "", final: "" });
  const [iniEv, setIniEv]             = useState([]);
  const [finEv, setFinEv]             = useState([]);
  const [evBusy, setEvBusy]           = useState({ initial: false, final: false });

  const genEvidence = useCallback(async (which) => {
    const imp = which === "initial" ? imps.initial : imps.final;
    if (!imp || evBusy[which]) return;
    setEvBusy(p => ({ ...p, [which]: true }));
    try {
      const ctx = buildCtx(cc, orders, course, imps, dxChecks, dataChecks, riskChecks, patientAge, patientSex, vitals, pmhSelected);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: "You are an emergency physician. List 4-6 specific evidence items (5-10 words each) from this chart that support the " + which + " impression: \"" + imp + "\". Cite specific findings: vitals, symptoms, labs, exam, treatment response.\n\nChart:\n" + ctx,
        response_json_schema: S_EVIDENCE,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      if (which === "initial") setIniEv(p.evidence || []);
      else setFinEv(p.evidence || []);
    } catch (_) {
      showToast("Could not generate evidence.", "error");
    } finally {
      setEvBusy(p => ({ ...p, [which]: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imps, evBusy, cc, orders, course, patientAge, patientSex, vitals, pmhSelected, showToast]);

  // complexity
  const [dxChecks, setDxChecks]     = useState(new Set());
  const [dataChecks, setDataChecks] = useState(new Set());
  const [riskChecks, setRiskChecks] = useState(new Set());
  const [cxBusy, setCxBusy]         = useState(false);
  const [cxAI, setCxAI]             = useState(null);

  const togCheck = useCallback((setter, id) => {
    setter(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const assessCx = useCallback(async () => {
    if (cxBusy) return;
    setCxBusy(true);
    try {
      const ctx = buildCtx(cc, orders, course, imps, dxChecks, dataChecks, riskChecks, patientAge, patientSex, vitals, pmhSelected);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: "You are a medical coding expert in emergency medicine (AMA 2023 E&M). Determine the MDM complexity level (low/moderate/high) and appropriate CPT code (99282-99285). Provide 1-2 sentence reasoning.\n\nEncounter:\n" + ctx,
        response_json_schema: S_COMPLEXITY,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setCxAI(p);
    } catch (_) {
      showToast("Could not assess complexity.", "error");
    } finally {
      setCxBusy(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cxBusy, cc, orders, course, imps, dxChecks, dataChecks, riskChecks, patientAge, patientSex, vitals, pmhSelected, showToast]);

  // note
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteOut, setNoteOut]   = useState("");

  const buildNote = useCallback(async () => {
    if (noteBusy) return;
    setNoteBusy(true);
    setOpen(p => ({ ...p, note: true }));
    try {
      const ctx = buildCtx(cc, orders, course, imps, dxChecks, dataChecks, riskChecks, patientAge, patientSex, vitals, pmhSelected);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: "You are an emergency physician completing a chart note. Write a complete, professional MDM section for the ED chart based on the data below. Include: (1) Diagnostic Workup — what was ordered and why, (2) Data Interpretation — key findings, (3) ED Course and Treatment Response, (4) Clinical Impressions initial and final, (5) MDM Complexity justification. Use standard clinical documentation language. Do not invent findings not present in the data.\n\nEncounter data:\n" + ctx,
        response_json_schema: S_NOTE,
      });
      const p = typeof res === "object" ? res : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setNoteOut(p.note || "");
      if (p.cpt && !cxAI) setCxAI({ cpt: p.cpt, level: p.complexity || "moderate", reasoning: "Derived from MDM note generation." });
    } catch (_) {
      showToast("Could not generate MDM note.", "error");
    } finally {
      setNoteBusy(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteBusy, cc, orders, course, imps, dxChecks, dataChecks, riskChecks, patientAge, patientSex, vitals, pmhSelected, cxAI, showToast]);

  // computed level
  const localLevel = calcLevel(dxChecks, dataChecks, riskChecks);
  const aiLevel = cxAI ? {
    label: cxAI.level === "high" ? "High Complexity" : cxAI.level === "moderate" ? "Moderate Complexity" : "Low Complexity",
    code: cxAI.cpt,
    css: cxAI.level === "high" ? "strf" : cxAI.level === "moderate" ? "high" : "mod",
    reasoning: cxAI.reasoning,
  } : null;
  const lvl = aiLevel || localLevel;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="mdm-root">
      <style>{MDM_CSS}</style>

      {/* ── 1. ORDERS ──────────────────────────────────────────────────── */}
      <div className="mdm-section">
        <div className="mdm-section-hdr" onClick={() => tog("orders")}>
          <span className="mdm-section-icon">🔬</span>
          <span className="mdm-section-title">Diagnostic Orders</span>
          <span className={"mdm-section-count" + (orders.length ? " d" : "")}>{orders.length}</span>
          <span className={"mdm-section-chevron" + (open.orders ? " open" : "")}>▶</span>
        </div>
        {open.orders && (
          <div className="mdm-section-body">
            {!orders.length && (
              <div style={{ color: "#2e4a6a", fontSize: 12, fontStyle: "italic", marginBottom: 10 }}>
                No orders added. Add labs, imaging, ECG, or other orders below.
              </div>
            )}
            <div className="mdm-order-list">
              {orders.map((o, i) => (
                <OrderCard key={i} order={o} idx={i} cc={cc} ddx={ddx}
                  age={patientAge} sex={patientSex} vitals={vitals}
                  onUpdate={updateOrder} onRemove={removeOrder} showToast={showToast} />
              ))}
            </div>
            {addType === null ? (
              <div className="mdm-add-bar">
                {ORDER_TYPES.map(t => (
                  <button key={t.key} className="mdm-add-type-btn" onClick={() => setAddType(t.key)}>
                    {t.icon} + {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "#4a6a8a", marginBottom: 5 }}>
                  Adding {ORDER_TYPES.find(t => t.key === addType)?.label}
                </div>
                <div className="mdm-add-row">
                  <input ref={addRef} className="mdm-add-in"
                    placeholder={addType === "lab" ? "e.g. BMP, CBC, Troponin" : addType === "imaging" ? "e.g. CXR, CT Head w/o contrast" : addType === "ecg" ? "12-lead ECG" : "Procedure or other order"}
                    value={addName} onChange={e => setAddName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") { setAddType(null); setAddName(""); } }} />
                  <button className="mdm-add-btn" onClick={confirmAdd}>Add</button>
                  <button className="mdm-ghost" onClick={() => { setAddType(null); setAddName(""); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. ED COURSE ───────────────────────────────────────────────── */}
      <div className="mdm-section">
        <div className="mdm-section-hdr" onClick={() => tog("course")}>
          <span className="mdm-section-icon">🏥</span>
          <span className="mdm-section-title">ED Course &amp; Treatment</span>
          <span className={"mdm-section-count" + (course.length ? " d" : "")}>{course.length}</span>
          <span className={"mdm-section-chevron" + (open.course ? " open" : "")}>▶</span>
        </div>
        {open.course && (
          <div className="mdm-section-body">
            {!course.length && (
              <div style={{ color: "#2e4a6a", fontSize: 12, fontStyle: "italic", marginBottom: 10 }}>
                No interventions documented.
              </div>
            )}
            {course.length > 0 && (
              <div className="mdm-timeline">
                {course.map((item, i) => (
                  <div key={i} className="mdm-tl-item">
                    <div className={"mdm-tl-dot " + (item.response || "na")}>
                      {item.response === "good" ? "✓" : item.response === "poor" ? "✕" : "~"}
                    </div>
                    <div className="mdm-tl-content">
                      <div className="mdm-tl-row1">
                        {item.time && <span className="mdm-tl-time">{item.time}</span>}
                        <span className="mdm-tl-action">{item.action}</span>
                        {item.response && item.response !== "na" && (
                          <span className={"mdm-resp-badge " + item.response}>
                            {item.response === "good" ? "Good response" : item.response === "partial" ? "Partial" : "No response"}
                          </span>
                        )}
                        <button className="mdm-del-btn" style={{ marginLeft: "auto" }} onClick={() => removeCourse(i)}>✕</button>
                      </div>
                      {item.notes && <div style={{ fontSize: 11, color: "#8aaccc", lineHeight: 1.4 }}>{item.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!addCourse ? (
              <button className="mdm-ghost" style={{ marginTop: 4 }} onClick={() => setAddCourse(true)}>
                + Add Intervention
              </button>
            ) : (
              <div style={{ background: "rgba(11,30,54,0.5)", border: "1px solid #1a3555", borderRadius: 8, padding: 12, marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 76 }}>
                    <div className="mdm-lbl" style={{ marginBottom: 3 }}>Time</div>
                    <input className="mdm-in" placeholder="HH:MM" value={nTime} onChange={e => setNTime(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mdm-lbl" style={{ marginBottom: 3 }}>Intervention / Action</div>
                    <input className="mdm-in" placeholder="e.g. IV NS 1L bolus, Morphine 4mg IV, O2 via NRB"
                      value={nAction} onChange={e => setNAction(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && confirmCourse()} />
                  </div>
                </div>
                <div>
                  <div className="mdm-lbl" style={{ marginBottom: 4 }}>Response to Treatment</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {RESP_OPTS.map(r => (
                      <button key={r.key} className="mdm-ghost"
                        style={nResp === r.key ? { borderColor: "#3b9eff60", color: "#3b9eff", background: "#3b9eff10" } : {}}
                        onClick={() => setNResp(r.key)}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mdm-lbl" style={{ marginBottom: 3 }}>Notes</div>
                  <input className="mdm-in" placeholder="Optional details..." value={nNotes} onChange={e => setNNotes(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="mdm-add-btn" onClick={confirmCourse}>Add</button>
                  <button className="mdm-ghost" onClick={() => { setAddCourse(false); setNAction(""); setNTime(""); setNNotes(""); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. IMPRESSIONS ─────────────────────────────────────────────── */}
      <div className="mdm-section">
        <div className="mdm-section-hdr" onClick={() => tog("impressions")}>
          <span className="mdm-section-icon">🎯</span>
          <span className="mdm-section-title">Clinical Impressions</span>
          <span className={"mdm-section-count" + ((imps.initial || imps.final) ? " d" : "")}>
            {[imps.initial, imps.final].filter(Boolean).length}/2
          </span>
          <span className={"mdm-section-chevron" + (open.impressions ? " open" : "")}>▶</span>
        </div>
        {open.impressions && (
          <div className="mdm-section-body">
            <div className="mdm-imp-grid">
              <div className="mdm-imp-card ini">
                <div className="mdm-imp-lbl ini">Initial Impression</div>
                <textarea className="mdm-ta" rows={2} placeholder="Working diagnosis on arrival..."
                  value={imps.initial} onChange={e => setImps(p => ({ ...p, initial: e.target.value }))} />
                {iniEv.length > 0 && (
                  <div className="mdm-chips">
                    {iniEv.map((ev, i) => (
                      <span key={i} className="mdm-chip" onClick={() => setIniEv(p => p.filter((_, j) => j !== i))} title="Click to remove">{ev}</span>
                    ))}
                  </div>
                )}
                <button className={"mdm-ai-btn" + (evBusy.initial ? " busy" : "")} style={{ marginTop: 8 }}
                  onClick={() => genEvidence("initial")} disabled={evBusy.initial || !imps.initial}
                  title={!imps.initial ? "Enter an impression first" : ""}>
                  {evBusy.initial ? <><div className="mdm-spin" />Finding Evidence...</> : <><div className="mdm-dot" />Find Supporting Evidence</>}
                </button>
              </div>
              <div className="mdm-imp-card fin">
                <div className="mdm-imp-lbl fin">Final Impression / Disposition</div>
                <textarea className="mdm-ta" rows={2} placeholder="Final diagnosis and disposition..."
                  value={imps.final} onChange={e => setImps(p => ({ ...p, final: e.target.value }))} />
                {finEv.length > 0 && (
                  <div className="mdm-chips">
                    {finEv.map((ev, i) => (
                      <span key={i} className="mdm-chip" onClick={() => setFinEv(p => p.filter((_, j) => j !== i))} title="Click to remove">{ev}</span>
                    ))}
                  </div>
                )}
                <button className={"mdm-ai-btn" + (evBusy.final ? " busy" : "")} style={{ marginTop: 8 }}
                  onClick={() => genEvidence("final")} disabled={evBusy.final || !imps.final}
                  title={!imps.final ? "Enter an impression first" : ""}>
                  {evBusy.final ? <><div className="mdm-spin" />Finding Evidence...</> : <><div className="mdm-dot" />Find Supporting Evidence</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. MDM COMPLEXITY ──────────────────────────────────────────── */}
      <div className="mdm-section">
        <div className="mdm-section-hdr" onClick={() => tog("complexity")}>
          <span className="mdm-section-icon">⚖️</span>
          <span className="mdm-section-title">MDM Complexity &amp; E/M Level</span>
          <span className={"mdm-section-count" + ((dxChecks.size + dataChecks.size + riskChecks.size) ? " d" : "")}>{lvl.code}</span>
          <span className={"mdm-section-chevron" + (open.complexity ? " open" : "")}>▶</span>
        </div>
        {open.complexity && (
          <div className="mdm-section-body">
            <div className="mdm-cx-grid">
              <div className="mdm-cx-col">
                <div className="mdm-cx-col-ttl">Number &amp; Complexity of Dx</div>
                {DX_OPTS.map(o => (
                  <div key={o.id} className="mdm-cx-item" onClick={() => togCheck(setDxChecks, o.id)}>
                    <div className={"mdm-cx-box" + (dxChecks.has(o.id) ? " on" : "")}>{dxChecks.has(o.id) ? "✓" : ""}</div>
                    <span className="mdm-cx-lbl">{o.label}</span>
                  </div>
                ))}
              </div>
              <div className="mdm-cx-col">
                <div className="mdm-cx-col-ttl">Amount / Complexity of Data</div>
                {DATA_OPTS.map(o => (
                  <div key={o.id} className="mdm-cx-item" onClick={() => togCheck(setDataChecks, o.id)}>
                    <div className={"mdm-cx-box" + (dataChecks.has(o.id) ? " on" : "")}>{dataChecks.has(o.id) ? "✓" : ""}</div>
                    <span className="mdm-cx-lbl">{o.label}</span>
                  </div>
                ))}
              </div>
              <div className="mdm-cx-col">
                <div className="mdm-cx-col-ttl">Risk of Complications</div>
                {RISK_OPTS.map(o => (
                  <div key={o.id} className="mdm-cx-item" onClick={() => togCheck(setRiskChecks, o.id)}>
                    <div className={"mdm-cx-box" + (riskChecks.has(o.id) ? " on" : "")}>{riskChecks.has(o.id) ? "✓" : ""}</div>
                    <span className="mdm-cx-lbl">{o.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mdm-level">
              <div>
                <div className={"mdm-level-val " + lvl.css}>{lvl.label}</div>
                <div className="mdm-level-sub">{aiLevel ? "AI-assessed" : "Calculated from checkboxes"}</div>
                {aiLevel?.reasoning && <div className="mdm-level-reasoning">{aiLevel.reasoning}</div>}
              </div>
              <div className="mdm-level-code">{lvl.code}</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className={"mdm-ai-btn" + (cxBusy ? " busy" : "")} onClick={assessCx} disabled={cxBusy}>
                {cxBusy ? <><div className="mdm-spin" />Assessing...</> : <><div className="mdm-dot" />AI Assess Complexity</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. MDM NOTE ────────────────────────────────────────────────── */}
      <div className="mdm-section">
        <div className="mdm-section-hdr" onClick={() => tog("note")}>
          <span className="mdm-section-icon">📝</span>
          <span className="mdm-section-title">MDM Note</span>
          <span className={"mdm-section-count" + (noteOut ? " d" : "")}>{noteOut ? "Ready" : "—"}</span>
          <span className={"mdm-section-chevron" + (open.note ? " open" : "")}>▶</span>
        </div>
        {open.note && (
          <div className="mdm-section-body">
            <div className="mdm-note-out">
              {noteOut
                ? noteOut
                : <span className="mdm-note-ph">MDM note will appear here. Fill in orders, ED course, and impressions above for best results.</span>
              }
            </div>
            <div className="mdm-note-acts">
              <button className="mdm-primary" onClick={buildNote} disabled={noteBusy}>
                {noteBusy ? "Generating..." : noteOut ? "Regenerate MDM Note" : "Generate MDM Note"}
              </button>
              {noteOut && (
                <button className="mdm-ghost"
                  onClick={() => navigator.clipboard.writeText(noteOut)
                    .then(() => showToast("MDM note copied.", "success"))
                    .catch(() => showToast("Copy failed.", "error"))
                  }>
                  Copy
                </button>
              )}
              {noteOut && <button className="mdm-ghost" onClick={() => setNoteOut("")}>Clear</button>}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      {onAdvance && (
        <div className="mdm-advance-row">
          <button className="mdm-advance" onClick={onAdvance}>
            Complete Encounter →
          </button>
        </div>
      )}
    </div>
  );
}