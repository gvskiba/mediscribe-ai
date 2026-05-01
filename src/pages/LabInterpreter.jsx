import { useState, useCallback, useMemo } from "react";
// FIX: removed `import { useNavigate } from "react-router-dom"`
// Notrya constraint: NO Router usage. useNavigate() requires a <Router> context
// and throws unconditionally when rendered outside one — the primary blank-page cause.
// Replaced with onBack prop (same pattern used across all Notrya components).

// ── Font injection ─────────────────────────────────────────────────────────────
// FIX: typeof document guard added — same fix applied to MedsTab & DDxEngine.
// Bare document.getElementById() at module parse time throws in non-browser
// environments, blocking the entire module from loading.
(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("lab-fonts")) return;
  const l = document.createElement("link");
  l.id = "lab-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "lab-css";
  s.textContent = `
    @keyframes lab-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .lab-fade{animation:lab-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  cyan:"#00d4ff",
};

// ── Reference ranges ──────────────────────────────────────────────────────────
const REF = {
  na:     { lo:136, hi:145, unit:"mEq/L",   label:"Sodium"         },
  k:      { lo:3.5, hi:5.0, unit:"mEq/L",   label:"Potassium"      },
  cl:     { lo:98,  hi:107, unit:"mEq/L",   label:"Chloride"       },
  co2:    { lo:22,  hi:29,  unit:"mEq/L",   label:"Bicarb (CO2)"   },
  bun:    { lo:7,   hi:20,  unit:"mg/dL",   label:"BUN"            },
  cr:     { lo:0.6, hi:1.2, unit:"mg/dL",   label:"Creatinine"     },
  glu:    { lo:70,  hi:100, unit:"mg/dL",   label:"Glucose"        },
  ca:     { lo:8.5, hi:10.2,unit:"mg/dL",   label:"Calcium"        },
  mg:     { lo:1.7, hi:2.2, unit:"mg/dL",   label:"Magnesium"      },
  phos:   { lo:2.5, hi:4.5, unit:"mg/dL",   label:"Phosphorus"     },
  wbc:    { lo:4.5, hi:11.0,unit:"K/uL",    label:"WBC"            },
  hgb:    { lo:12,  hi:17,  unit:"g/dL",    label:"Hemoglobin"     },
  hct:    { lo:36,  hi:50,  unit:"%",        label:"Hematocrit"     },
  plt:    { lo:150, hi:400, unit:"K/uL",    label:"Platelets"      },
  mcv:    { lo:80,  hi:100, unit:"fL",       label:"MCV"            },
  alt:    { lo:7,   hi:56,  unit:"U/L",     label:"ALT"            },
  ast:    { lo:10,  hi:40,  unit:"U/L",     label:"AST"            },
  alkp:   { lo:44,  hi:147, unit:"U/L",     label:"Alk Phos"       },
  tbili:  { lo:0.1, hi:1.2, unit:"mg/dL",   label:"Total Bili"     },
  dbili:  { lo:0,   hi:0.3, unit:"mg/dL",   label:"Direct Bili"    },
  albumin:{ lo:3.4, hi:5.4, unit:"g/dL",   label:"Albumin"        },
  pt:     { lo:11,  hi:13.5,unit:"sec",     label:"PT"             },
  inr:    { lo:0.8, hi:1.2, unit:"",        label:"INR"            },
  ptt:    { lo:25,  hi:35,  unit:"sec",     label:"PTT/aPTT"       },
  fibrinogen:{ lo:200, hi:400, unit:"mg/dL",label:"Fibrinogen"     },
  ddimer: { lo:0,   hi:0.5, unit:"mcg/mL FEU",label:"D-Dimer"     },
  pH:     { lo:7.35, hi:7.45, unit:"",      label:"pH"             },
  pco2:   { lo:35,  hi:45,  unit:"mmHg",   label:"pCO2"           },
  po2:    { lo:80,  hi:100, unit:"mmHg",   label:"pO2"            },
  hco3:   { lo:22,  hi:26,  unit:"mEq/L",  label:"HCO3"           },
  be:     { lo:-2,  hi:2,   unit:"mEq/L",  label:"Base Excess"    },
  sao2:   { lo:95,  hi:100, unit:"%",       label:"SaO2"           },
  lactate:{ lo:0.5, hi:2.0, unit:"mmol/L", label:"Lactate"        },
  // Cardiac biomarkers
  troponin: { lo:0,    hi:0.04,  unit:"ng/mL",     label:"Troponin I"       },
  bnp:      { lo:0,    hi:100,   unit:"pg/mL",      label:"BNP"              },
  ntprobnp: { lo:0,    hi:125,   unit:"pg/mL",      label:"NT-proBNP"        },
  ckmb:     { lo:0,    hi:3.6,   unit:"ng/mL",      label:"CK-MB"            },
  ck:       { lo:30,   hi:200,   unit:"U/L",        label:"CK (Total)"       },
  // Thyroid
  tsh:      { lo:0.4,  hi:4.0,   unit:"mIU/L",      label:"TSH"              },
  ft4:      { lo:0.8,  hi:1.8,   unit:"ng/dL",      label:"Free T4"          },
  ft3:      { lo:2.3,  hi:4.2,   unit:"pg/mL",      label:"Free T3"          },
  // Inflammatory / Sepsis
  crp:      { lo:0,    hi:1.0,   unit:"mg/dL",      label:"CRP"              },
  esr:      { lo:0,    hi:20,    unit:"mm/hr",      label:"ESR"              },
  ferritin: { lo:12,   hi:300,   unit:"ng/mL",      label:"Ferritin"         },
  procalc:  { lo:0,    hi:0.1,   unit:"ng/mL",      label:"Procalcitonin"    },
  ldh:      { lo:122,  hi:222,   unit:"U/L",        label:"LDH"              },
  // Tox / Osmolality
  apap:      { lo:0,   hi:20,    unit:"mcg/mL",     label:"Acetaminophen"    },
  salicylate:{ lo:0,   hi:30,    unit:"mg/dL",      label:"Salicylate"       },
  etoh:      { lo:0,   hi:80,    unit:"mg/dL",      label:"Ethanol"          },
  osm:       { lo:275, hi:295,   unit:"mOsm/kg",    label:"Serum Osm"        },
  lithium:   { lo:0.6, hi:1.2,   unit:"mEq/L",      label:"Lithium"          },
  // Pancreatic
  lipase:    { lo:0,   hi:160,   unit:"U/L",        label:"Lipase"           },
  amylase:   { lo:30,  hi:110,   unit:"U/L",        label:"Amylase"          },
};

// ── Panel definitions ─────────────────────────────────────────────────────────
const PANELS = [
  {
    id:"bmp", label:"BMP / CMP", color:T.teal, icon:"🧪",
    fields:["na","k","cl","co2","bun","cr","glu","ca","mg","phos"],
  },
  {
    id:"cbc", label:"CBC", color:T.red, icon:"🩸",
    fields:["wbc","hgb","hct","plt","mcv"],
  },
  {
    id:"lft", label:"LFT / Hepatic", color:T.orange, icon:"🫀",
    fields:["alt","ast","alkp","tbili","dbili","albumin"],
  },
  {
    id:"coag", label:"Coagulation", color:T.purple, icon:"🩹",
    fields:["pt","inr","ptt","fibrinogen","ddimer"],
  },
  {
    id:"abg", label:"ABG / VBG", color:T.blue, icon:"💨",
    fields:["pH","pco2","po2","hco3","be","sao2","lactate"],
  },
  {
    id:"cardiac", label:"Cardiac Markers", color:T.coral, icon:"💓",
    fields:["troponin","bnp","ntprobnp","ckmb","ck"],
  },
  {
    id:"thyroid", label:"Thyroid", color:T.purple, icon:"🦋",
    fields:["tsh","ft4","ft3"],
  },
  {
    id:"inflam", label:"Inflam / Sepsis", color:T.orange, icon:"🔥",
    fields:["procalc","crp","ferritin","esr","ldh"],
  },
  {
    id:"tox", label:"Tox / Osm", color:T.cyan, icon:"☠️",
    fields:["apap","salicylate","etoh","osm","lithium"],
  },
  {
    id:"panc", label:"Pancreatic", color:T.gold, icon:"🫁",
    fields:["lipase","amylase","tbili","alt","glu","ca"],
  },
];

// ── Critical thresholds ───────────────────────────────────────────────────────
const CRITICAL = {
  na:   { critLo:120,  critHi:160  },
  k:    { critLo:2.5,  critHi:6.5  },
  co2:  { critLo:10,   critHi:40   },
  bun:  { critLo:null, critHi:100  },
  cr:   { critLo:null, critHi:10   },
  glu:  { critLo:40,   critHi:500  },
  ca:   { critLo:6.5,  critHi:13   },
  hgb:  { critLo:7,    critHi:null },
  plt:  { critLo:50,   critHi:null },
  wbc:  { critLo:2,    critHi:30   },
  inr:  { critLo:null, critHi:5    },
  pH:   { critLo:7.1,  critHi:7.6  },
  pco2: { critLo:20,   critHi:70   },
  po2:  { critLo:50,   critHi:null },
  lactate:{ critLo:null, critHi:4  },
  fibrinogen:{ critLo:100, critHi:null },
  // Cardiac
  troponin:  { critLo:null, critHi:0.5    },
  bnp:       { critLo:null, critHi:500    },
  ntprobnp:  { critLo:null, critHi:5000   },
  // Thyroid
  tsh:       { critLo:0.01, critHi:20     },
  // Inflammatory
  procalc:   { critLo:null, critHi:10     },
  ferritin:  { critLo:null, critHi:10000  },
  // Tox
  apap:      { critLo:null, critHi:150    },
  salicylate:{ critLo:null, critHi:60     },
  osm:       { critLo:265,  critHi:320    },
  lithium:   { critLo:null, critHi:2.0    },
  // Pancreatic
  lipase:    { critLo:null, critHi:1000   },
};

// ── Flag helpers ──────────────────────────────────────────────────────────────
function flagValue(key, val) {
  const v = parseFloat(val);
  if (isNaN(v)) return "none";
  const r = REF[key];
  const c = CRITICAL[key] || {};
  if (c.critLo != null && v <= c.critLo) return "critical_low";
  if (c.critHi != null && v >= c.critHi) return "critical_high";
  if (r && v < r.lo) return "low";
  if (r && v > r.hi) return "high";
  return "normal";
}

function flagColor(flag) {
  return flag === "critical_low" || flag === "critical_high" ? T.red
    : flag === "low"  ? T.coral
    : flag === "high" ? T.orange
    : T.green;
}

function flagLabel(flag) {
  return flag === "critical_low"  ? "CRIT L"
    : flag === "critical_high" ? "CRIT H"
    : flag === "low"           ? "L"
    : flag === "high"          ? "H"
    : "—";
}

// ── Calculated values ─────────────────────────────────────────────────────────
function calcAnionGap(na, cl, co2) {
  const n=parseFloat(na), c=parseFloat(cl), b=parseFloat(co2);
  if (isNaN(n)||isNaN(c)||isNaN(b)) return null;
  return Math.round((n - c - b) * 10) / 10;
}

function calcBUN_Cr(bun, cr) {
  const b=parseFloat(bun), c=parseFloat(cr);
  if (isNaN(b)||isNaN(c)||c===0) return null;
  return Math.round(b/c * 10) / 10;
}

function calcOsmolGap(na, bun, glu, ethanol) {
  const n=parseFloat(na), b=parseFloat(bun), g=parseFloat(glu);
  if (isNaN(n)||isNaN(b)||isNaN(g)) return null;
  const calculated = 2*n + b/2.8 + g/18 + (parseFloat(ethanol||0)/4.6 || 0);
  return { calculated: Math.round(calculated) };
}

function calcPFRatio(po2, fio2) {
  const p=parseFloat(po2), f=parseFloat(fio2||21)/100;
  if (isNaN(p)||f===0) return null;
  return Math.round(p/f);
}

function calcAaDO2(pH, pco2, po2, fio2) {
  const pco2v=parseFloat(pco2), po2v=parseFloat(po2), f=parseFloat(fio2||21)/100;
  if (isNaN(pco2v)||isNaN(po2v)) return null;
  const pao2 = (f * 713) - (pco2v / 0.8);
  return Math.round(pao2 - po2v);
}

// ── Paste parser ──────────────────────────────────────────────────────────────
function parsePastedLabs(text, panelFields) {
  const result = {};
  const labelMap = {
    "sodium":"na","na":"na","na+":"na",
    "potassium":"k","k":"k","k+":"k",
    "chloride":"cl","cl":"cl","cl-":"cl",
    "bicarb":"co2","co2":"co2","hco3":"hco3","bicarbonate":"co2",
    "bun":"bun","urea nitrogen":"bun",
    "creatinine":"cr","cr":"cr","crea":"cr",
    "glucose":"glu","glu":"glu","gluc":"glu",
    "calcium":"ca","ca":"ca",
    "magnesium":"mg","mg":"mg",
    "phosphorus":"phos","phos":"phos","po4":"phos",
    "wbc":"wbc","white blood cell":"wbc",
    "hemoglobin":"hgb","hgb":"hgb","hb":"hgb",
    "hematocrit":"hct","hct":"hct",
    "platelets":"plt","plt":"plt","plts":"plt",
    "mcv":"mcv",
    "alt":"alt","sgpt":"alt",
    "ast":"ast","sgot":"ast",
    "alk phos":"alkp","alkaline phosphatase":"alkp","alkp":"alkp",
    "bilirubin":"tbili","total bilirubin":"tbili","tbili":"tbili","t bili":"tbili",
    "direct bilirubin":"dbili","dbili":"dbili",
    "albumin":"albumin",
    "pt":"pt","prothrombin":"pt",
    "inr":"inr",
    "ptt":"ptt","aptt":"ptt","ptt/aptt":"ptt",
    "fibrinogen":"fibrinogen",
    "d-dimer":"ddimer","ddimer":"ddimer",
    "ph":"pH",
    "pco2":"pco2","paco2":"pco2",
    "po2":"po2","pao2":"po2",
    "base excess":"be","be":"be",
    "sao2":"sao2","o2 sat":"sao2",
    "lactate":"lactate","lactic acid":"lactate",
    // Cardiac
    "troponin":"troponin","trop i":"troponin","trop":"troponin","trop t":"troponin","hstni":"troponin",
    "bnp":"bnp","brain natriuretic peptide":"bnp",
    "nt-probnp":"ntprobnp","ntprobnp":"ntprobnp","nt probnp":"ntprobnp","proBNP":"ntprobnp",
    "ck-mb":"ckmb","ckmb":"ckmb","ck mb":"ckmb",
    "ck":"ck","cpk":"ck","creatine kinase":"ck","total ck":"ck",
    // Thyroid
    "tsh":"tsh","thyroid stimulating hormone":"tsh","thyroid stim":"tsh",
    "free t4":"ft4","ft4":"ft4","free thyroxine":"ft4","f t4":"ft4",
    "free t3":"ft3","ft3":"ft3","free triiodothyronine":"ft3","f t3":"ft3",
    // Inflammatory
    "crp":"crp","c-reactive protein":"crp","c reactive protein":"crp",
    "esr":"esr","sed rate":"esr","sedimentation rate":"esr",
    "ferritin":"ferritin",
    "procalcitonin":"procalc","procalc":"procalc","pct":"procalc",
    "ldh":"ldh","lactate dehydrogenase":"ldh","lactic dehydrogenase":"ldh",
    // Tox
    "acetaminophen":"apap","apap":"apap","tylenol level":"apap","apap level":"apap",
    "salicylate":"salicylate","asa level":"salicylate","aspirin level":"salicylate","salicylates":"salicylate",
    "ethanol":"etoh","etoh":"etoh","alcohol level":"etoh","bac":"etoh","etoh level":"etoh",
    "osmolality":"osm","osm":"osm","serum osm":"osm","serum osmolality":"osm",
    "lithium":"lithium","li level":"lithium","lithium level":"lithium",
    // Pancreatic
    "lipase":"lipase","lip":"lipase",
    "amylase":"amylase","amy":"amylase",
  };

  // Normalize label key: lowercase, collapse spaces, strip parens/brackets
  const norm = s => s.trim().toLowerCase()
    .replace(/[()[\]]/g, "").replace(/\s+/g, " ").trim();

  // Strategy A: "Label: value" or "Label = value"
  // Strategy B: tab / wide-column EMR format ("SODIUM     138   136-145")
  // Strategy C: "Label value" with single space (no separator)
  // Apply all 3 to each segment; first hit wins per field
  const rawLines = text.split(/[\n;|]+/);
  rawLines.forEach(rawLine => {
    const segs = rawLine.split(/,+/);
    segs.forEach(seg => {
      const clean = seg.trim();
      if (!clean) return;
      // A — colon or equals separator
      let m = clean.match(/^([a-zA-Z][a-zA-Z0-9\s/()[\]+-]{0,35}?)\s*[:=]\s*([\d.]+)/);
      if (m) {
        const key = labelMap[norm(m[1])];
        if (key && panelFields.includes(key)) { result[key] = m[2]; return; }
      }
      // B — tabs or 2+ spaces as column separator (Epic/Cerner wide-report format)
      const cols = clean.split(/\t+|\s{2,}/);
      if (cols.length >= 2) {
        const key = labelMap[norm(cols[0])];
        const numCol = cols.slice(1).find(c => /^[\d.]+$/.test(c.trim()));
        if (key && panelFields.includes(key) && numCol) {
          result[key] = numCol.trim(); return;
        }
      }
      // C — single space, label then value (e.g. "Na 138" or "WBC 8.5")
      m = clean.match(/^([a-zA-Z][a-zA-Z0-9/()+-]{1,25})\s+([\d.]+)(?:\s|$)/);
      if (m) {
        const key = labelMap[norm(m[1])];
        if (key && panelFields.includes(key)) result[key] = m[2];
      }
    });
  });
  return result;
}

// ── Build AI prompt ───────────────────────────────────────────────────────────
function buildLabPrompt(panelId, values, patientCtx) {
  const panel = PANELS.find(p => p.id === panelId);
  const labLines = panel.fields
    .filter(f => values[f] !== undefined && values[f] !== "")
    .map(f => {
      const r   = REF[f];
      const flag = flagValue(f, values[f]);
      return `${r?.label || f}: ${values[f]} ${r?.unit || ""} ${flag !== "normal" ? "[" + flag.toUpperCase() + "]" : ""}`;
    }).join("\n");

  const calcs = [];
  if (panelId === "bmp") {
    const ag = calcAnionGap(values.na, values.cl, values.co2);
    const br = calcBUN_Cr(values.bun, values.cr);
    if (ag !== null) calcs.push(`Anion Gap: ${ag} mEq/L (${ag > 12 ? "ELEVATED — HAGMA" : "normal"})`);
    if (br !== null) calcs.push(`BUN/Cr ratio: ${br} (${br > 20 ? "pre-renal pattern" : "intrinsic renal / normal"})`);
  }
  if (panelId === "abg") {
    const pf = calcPFRatio(values.po2, 21);
    const aa = calcAaDO2(values.pH, values.pco2, values.po2, 21);
    if (pf !== null) calcs.push(`P/F ratio (on room air): ${pf} (${pf < 200 ? "ARDS range" : pf < 300 ? "mild impairment" : "normal"})`);
    if (aa !== null) calcs.push(`A-a gradient (room air): ${aa} mmHg (${aa > 15 ? "elevated" : "normal"})`);
  }
  if (panelId === "tox") {
    const etohV = parseFloat(values.etoh);
    const apapV = parseFloat(values.apap);
    const salV  = parseFloat(values.salicylate);
    if (!isNaN(etohV)) calcs.push(`EtOH osmole contribution: ~${Math.round(etohV/4.6)} mOsm/kg`);
    if (!isNaN(apapV) && apapV > 0) calcs.push(`Acetaminophen: ${apapV} mcg/mL — Rumack-Matthew treatment line at 4h = 150 mcg/mL${apapV >= 150 ? " [ABOVE TREATMENT LINE]" : apapV >= 66 ? " [in possible-risk zone — check ingestion time]" : " [below treatment threshold]"}`);
    if (!isNaN(salV) && salV > 0) calcs.push(`Salicylate: ${salV} mg/dL — ${salV >= 60 ? "SEVERE toxicity (>60)" : salV >= 40 ? "moderate toxicity (40-60), treat" : salV >= 30 ? "upper therapeutic / mild toxicity" : "therapeutic range"}`);
  }
  if (panelId === "panc") {
    const lipV = parseFloat(values.lipase);
    const altV = parseFloat(values.alt);
    if (!isNaN(lipV)) calcs.push(`Lipase: ${(lipV/160).toFixed(1)}x ULN${lipV >= 480 ? " — ≥3x ULN (AP diagnostic threshold)" : lipV >= 160 ? " — elevated" : " — normal"}`);
    if (!isNaN(altV) && altV > 150) calcs.push(`ALT >3x ULN (${altV} U/L) — ~95% PPV for gallstone pancreatitis (Ammori)`);
  }

  return `Interpret these ${panel.label} lab results for an emergency physician. Be specific, clinically actionable, and focused on ED management.

PATIENT CONTEXT:
${patientCtx || "No specific patient context provided"}

LAB VALUES:
${labLines}
${calcs.length ? "\nCALCULATED:\n" + calcs.join("\n") : ""}

Respond ONLY with valid JSON, no markdown fences:
{
  "overall_pattern": "One sentence: the dominant clinical pattern",
  "critical_values": ["list only truly critical values requiring immediate action — empty array if none"],
  "abnormal_findings": [
    {
      "finding": "Specific abnormal value or pattern",
      "significance": "Clinical significance in this ED context",
      "severity": "mild | moderate | severe | critical"
    }
  ],
  "differential": [
    {
      "diagnosis": "Specific diagnosis",
      "probability": "high | moderate | consider",
      "supporting_labs": "Which lab values support this"
    }
  ],
  "immediate_actions": ["Specific actionable step 1", "step 2", "step 3"],
  "watch_for": "What to monitor — repeat interval and triggers for escalation",
  "pearls": "One key clinical insight specific to this pattern"
}`;
}

// ── Value input cell ──────────────────────────────────────────────────────────
function ValCell({ fieldKey, values, onChange }) {
  const r    = REF[fieldKey];
  const val  = values[fieldKey] ?? "";
  const flag = val !== "" ? flagValue(fieldKey, val) : "none";
  const fc   = flagColor(flag);

  return (
    <div style={{ padding:"7px 9px", borderRadius:8,
      background: flag !== "none" && flag !== "normal"
        ? `${fc}0d` : "rgba(8,22,40,0.5)",
      border:`1px solid ${flag !== "none" && flag !== "normal" ? fc+"44" : "rgba(26,53,85,0.35)"}` }}>
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1, textTransform:"uppercase" }}>
          {r?.label || fieldKey}
        </span>
        {flag !== "none" && flag !== "normal" && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, color:fc, letterSpacing:1 }}>
            {flagLabel(flag)}
          </span>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <input
          type="number" value={val}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder="—"
          style={{ flex:1, minWidth:0, padding:"4px 6px",
            background:"rgba(14,37,68,0.75)",
            border:`1px solid ${val ? fc+"55" : "rgba(26,53,85,0.3)"}`,
            borderRadius:5, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:14, fontWeight:700,
            color: flag === "normal" ? T.teal
              : flag === "none" ? T.txt4
              : fc,
            textAlign:"right" }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color:T.txt4, flexShrink:0 }}>
          {r?.unit || ""}
        </span>
      </div>
      {r && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:T.txt4, marginTop:2 }}>
          {r.lo}–{r.hi}
        </div>
      )}
    </div>
  );
}

// ── AI result display ─────────────────────────────────────────────────────────
function LabResult({ result, panelColor }) {
  if (!result) return null;

  const severityColor = s =>
    s === "critical" ? T.red : s === "severe" ? T.coral :
    s === "moderate" ? T.orange : T.gold;

  const probColor = p =>
    p === "high" ? T.coral : p === "moderate" ? T.orange : T.blue;

  return (
    <div className="lab-fade">
      <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:10,
        background:`${panelColor}0c`,
        border:`1px solid ${panelColor}33` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:panelColor, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:4 }}>Overall Pattern</div>
        <div style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:15, color:T.txt,
          lineHeight:1.4 }}>{result.overall_pattern}</div>
      </div>

      {result.critical_values?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(255,68,68,0.1)",
          border:"1px solid rgba(255,68,68,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.red, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:6 }}>🚨 Critical Values — Immediate Action Required</div>
          {result.critical_values.map((v, i) => (
            <div key={i} style={{ display:"flex", gap:6,
              alignItems:"flex-start", marginBottom:3 }}>
              <span style={{ color:T.red, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt2, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {result.abnormal_findings?.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:7 }}>Abnormal Findings</div>
          {result.abnormal_findings.map((f, i) => {
            const sc = severityColor(f.severity);
            return (
              <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                marginBottom:4,
                background:`${sc}09`,
                border:`1px solid ${sc}30`,
                borderLeft:`3px solid ${sc}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, marginBottom:3 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontWeight:700, fontSize:12, color:T.txt }}>
                    {f.finding}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, fontWeight:700, color:sc,
                    letterSpacing:1, textTransform:"uppercase",
                    background:`${sc}15`, border:`1px solid ${sc}35`,
                    borderRadius:4, padding:"1px 6px" }}>
                    {f.severity}
                  </span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt3, lineHeight:1.5 }}>
                  {f.significance}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result.differential?.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:7 }}>Differential — Lab Pattern</div>
          {result.differential.map((d, i) => {
            const pc = probColor(d.probability);
            return (
              <div key={i} style={{ padding:"8px 10px", borderRadius:8,
                marginBottom:4,
                background:"rgba(8,22,40,0.55)",
                border:"1px solid rgba(26,53,85,0.35)" }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, flexWrap:"wrap", marginBottom:3 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif",
                    fontWeight:700, fontSize:12, color:T.txt }}>
                    {d.diagnosis}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, fontWeight:700, color:pc,
                    letterSpacing:1, textTransform:"uppercase",
                    background:`${pc}12`, border:`1px solid ${pc}33`,
                    borderRadius:4, padding:"1px 6px" }}>
                    {d.probability}
                  </span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt4 }}>
                  {d.supporting_labs}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:9, marginBottom:10 }}>
        {result.immediate_actions?.length > 0 && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(0,229,192,0.06)",
            border:"1px solid rgba(0,229,192,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>⚡ Immediate Actions</div>
            {result.immediate_actions.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:5,
                alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.teal, flexShrink:0,
                  minWidth:16 }}>{i+1}.</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt2, lineHeight:1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        )}
        {result.watch_for && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(245,200,66,0.06)",
            border:"1px solid rgba(245,200,66,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.gold, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>👁 Monitor For</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt2, lineHeight:1.65 }}>{result.watch_for}</div>
          </div>
        )}
      </div>

      {result.pearls && (
        <div style={{ padding:"8px 11px", borderRadius:8,
          background:"rgba(155,109,255,0.07)",
          border:"1px solid rgba(155,109,255,0.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1, textTransform:"uppercase" }}>
            💎 Pearl: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>{result.pearls}</span>
        </div>
      )}
    </div>
  );
}

// ── Calculated values display ─────────────────────────────────────────────────
function CalcValues({ panelId, values, fio2 }) {
  const items = [];

  if (panelId === "bmp") {
    const ag = calcAnionGap(values.na, values.cl, values.co2);
    const br = calcBUN_Cr(values.bun, values.cr);
    const og = calcOsmolGap(values.na, values.bun, values.glu, values.etoh);
    if (ag !== null) items.push({
      label:"Anion Gap", val:`${ag}`, unit:"mEq/L",
      detail: ag > 12 ? "Elevated — HAGMA (MUDPILES)" : "Normal (non-gap metabolic acidosis if acidotic)",
      color: ag > 12 ? T.coral : T.teal,
    });
    if (br !== null) items.push({
      label:"BUN/Cr Ratio", val:`${br}`, unit:"",
      detail: br > 20 ? "Pre-renal pattern (dehydration, GI bleed)" : br < 10 ? "Intrinsic renal or liver disease" : "Normal",
      color: br > 20 ? T.orange : br < 10 ? T.purple : T.teal,
    });
    if (og?.calculated) items.push({
      label:"Calculated Osm", val:`${og.calculated}`, unit:"mOsm/kg",
      detail:`Osmol gap = measured − ${og.calculated}. Gap >10 suggests toxic alcohol.`,
      color:T.blue,
    });
  }

  if (panelId === "abg") {
    const pf = calcPFRatio(values.po2, fio2 || 21);
    const aa = calcAaDO2(values.pH, values.pco2, values.po2, fio2 || 21);
    if (pf !== null) items.push({
      label:"P/F Ratio", val:`${pf}`, unit:"",
      detail: pf < 200 ? "ARDS (severe <100, moderate 100–200)" : pf < 300 ? "Mild ARDS / impaired oxygenation" : "Normal",
      color: pf < 200 ? T.red : pf < 300 ? T.coral : T.teal,
    });
    if (aa !== null) items.push({
      label:"A-a Gradient", val:`${aa}`, unit:"mmHg",
      detail: aa > 15 ? "Elevated — V/Q mismatch, diffusion defect, or shunt" : "Normal — suggests hypoventilation as cause",
      color: aa > 15 ? T.orange : T.teal,
    });

    const pH   = parseFloat(values.pH);
    const pco2 = parseFloat(values.pco2);
    const hco3 = parseFloat(values.hco3 || values.co2);
    if (!isNaN(pH) && !isNaN(pco2)) {
      let interp = "";
      if      (pH < 7.35 && pco2 > 45) interp = "Respiratory Acidosis";
      else if (pH < 7.35 && pco2 < 35) interp = "Metabolic Acidosis";
      else if (pH > 7.45 && pco2 < 35) interp = "Respiratory Alkalosis";
      else if (pH > 7.45 && pco2 > 45) interp = "Metabolic Alkalosis";
      else                              interp = "Normal pH (may have mixed disorder)";

      if (!isNaN(hco3)) {
        if (pH < 7.35 && pco2 > 45) {
          const expectedHCO3 = 24 + 0.1 * (pco2 - 40);
          interp += Math.abs(hco3 - expectedHCO3) < 3
            ? " — appropriate metabolic compensation"
            : " — metabolic component present";
        } else if (pH < 7.35 && hco3 < 22) {
          const expectedPCO2 = 1.5 * hco3 + 8;
          interp += Math.abs(pco2 - expectedPCO2) < 2
            ? " — appropriate respiratory compensation (Winter's)"
            : " — respiratory component also present";
        }
      }

      items.push({
        label:"Acid-Base", val:interp, unit:"",
        detail:"",
        color: (pH < 7.2 || pH > 7.55) ? T.red : (pH < 7.35 || pH > 7.45) ? T.coral : T.teal,
      });
    }
  }

  if (panelId === "tox") {
    const etohV = parseFloat(values.etoh);
    const apapV = parseFloat(values.apap);
    const salV  = parseFloat(values.salicylate);
    const osmV  = parseFloat(values.osm);
    if (!isNaN(etohV) && etohV > 0) items.push({
      label:"EtOH Osm Contrib", val:`~${Math.round(etohV/4.6)}`, unit:"mOsm/kg",
      detail:`Ethanol adds ~${Math.round(etohV/4.6)} mOsm/kg to measured osmolality (EtOH ÷ 4.6).`,
      color:T.blue,
    });
    if (!isNaN(apapV) && apapV > 0) {
      const apapColor = apapV >= 150 ? T.red : apapV >= 66 ? T.orange : T.teal;
      const apapRisk  = apapV >= 150 ? "ABOVE treatment line — NAC now" : apapV >= 66 ? "Possible risk zone — confirm ingestion time" : "Below treatment threshold";
      items.push({ label:"APAP Nomogram", val:apapV >= 150 ? "HIGH RISK" : apapV >= 66 ? "CHECK TIME" : "LOW RISK", unit:"", detail:apapRisk, color:apapColor });
    }
    if (!isNaN(salV) && salV > 0) {
      const salColor = salV >= 60 ? T.red : salV >= 40 ? T.coral : T.teal;
      const salRisk  = salV >= 60 ? "Severe — ICU, HD consult" : salV >= 40 ? "Moderate — alkalinize urine, admit" : salV >= 30 ? "Upper therapeutic / mild" : "Therapeutic";
      items.push({ label:"Salicylate", val:salRisk.split(" ")[0], unit:"", detail:salRisk, color:salColor });
    }
    if (!isNaN(osmV) && !isNaN(etohV)) items.push({
      label:"Measured Osm", val:`${osmV}`, unit:"mOsm/kg",
      detail:`Osmol gap = measured − calculated (need Na/BUN/Glu from BMP). EtOH accounts for ~${Math.round(etohV/4.6)} mOsm/kg.`,
      color: osmV > 310 ? T.coral : T.teal,
    });
  }

  if (panelId === "panc") {
    const lipV = parseFloat(values.lipase);
    const altV = parseFloat(values.alt);
    const caV  = parseFloat(values.ca);
    if (!isNaN(lipV) && lipV > 0) {
      const mult = Math.round(lipV/160*10)/10;
      items.push({
        label:"Lipase x ULN", val:`${mult}x`, unit:"",
        detail: lipV >= 480 ? "≥3x ULN — meets AP diagnostic threshold (Atlanta)" : lipV >= 160 ? "Elevated — below 3x ULN; correlate clinically" : "Normal",
        color: lipV >= 480 ? T.coral : lipV >= 160 ? T.orange : T.teal,
      });
    }
    if (!isNaN(altV) && altV > 150) items.push({
      label:"Gallstone AP Risk", val:"ALT >3x ULN", unit:"",
      detail:"ALT >150 U/L has ~95% PPV for gallstone pancreatitis (Ammori criteria) — urgent RUQUS.",
      color:T.gold,
    });
    if (!isNaN(caV) && caV < 8.0) items.push({
      label:"Ranson Ca", val:`${caV}`, unit:"mg/dL",
      detail:"Ca <8 mg/dL is a Ranson criterion (at 48h) — associated with severe pancreatitis.",
      color:T.coral,
    });
  }

  if (items.length === 0) return null;

  return (
    <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:10,
      background:"rgba(8,22,40,0.65)",
      border:"1px solid rgba(42,79,122,0.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:7 }}>Calculated Values</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {items.map(item => (
          <div key={item.label} style={{ display:"flex",
            alignItems:"flex-start", gap:10, padding:"6px 8px",
            borderRadius:7,
            background:`${item.color}09`,
            border:`1px solid ${item.color}25` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1,
              textTransform:"uppercase", flexShrink:0,
              minWidth:90 }}>{item.label}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:13, fontWeight:700, color:item.color,
              flexShrink:0 }}>
              {item.val} {item.unit}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10, color:T.txt4, flex:1,
              lineHeight:1.5 }}>{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
// FIX: removed useNavigate — replaced with onBack prop.
// useNavigate() requires a <Router> context. When this component is used
// as an NPI tab (embedded=true) or in any non-Router context, useNavigate()
// throws unconditionally at the top of the component — before any JSX is
// evaluated — causing the entire component to render nothing.
//
// Props:
//   embedded   — true when used as an NPI tab; hides the back button and
//                standalone page chrome (header, breadcrumb, footer disclaimer)
//   onBack     — callback for the ← Back button (only shown when !embedded)
//                Pass () => navigate('/hub') from the parent shell if needed.
//   demo, vitals, cc, medications, pmhSelected — NPI patient context (optional)
export default function LabInterpreter({
  embedded = false,
  onBack,
  demo, vitals, cc, medications, pmhSelected,
}) {
  // FIX: no useNavigate() call here

  const [activePanel, setActivePanel] = useState("bmp");
  const [values,      setValues]      = useState({});
  const [fio2,        setFio2]        = useState("21");
  const [pasteText,   setPasteText]   = useState("");
  const [showPaste,   setShowPaste]   = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);
  const [copied,      setCopied]      = useState(false);

  const panel = PANELS.find(p => p.id === activePanel);

  const setValue = useCallback((key, val) => {
    setValues(p => ({ ...p, [key]:val }));
    setResult(null);
  }, []);

  const handlePanelSwitch = useCallback((id) => {
    setActivePanel(id);
    setValues({});
    setResult(null);
    setError(null);
    setPasteText("");
  }, []);

  const handleParse = useCallback(() => {
    if (!pasteText.trim()) return;
    const parsed = parsePastedLabs(pasteText, panel.fields);
    setValues(parsed);
    setPasteText("");
    setShowPaste(false);
    setResult(null);
  }, [pasteText, panel.fields]);

  const handleMarkNormal = useCallback(() => {
    const filled = {};
    panel.fields.forEach(f => {
      const r = REF[f];
      if (!r) return;
      const mid = (r.lo + r.hi) / 2;
      // Infer decimal places from the reference bounds
      const dec = Math.max(
        String(r.lo).includes(".") ? String(r.lo).split(".")[1].length : 0,
        String(r.hi).includes(".") ? String(r.hi).split(".")[1].length : 0,
      );
      filled[f] = dec > 0 ? mid.toFixed(dec) : String(Math.round(mid));
    });
    setValues(filled);
    setResult(null);
  }, [panel.fields]);

  const enteredCount = panel.fields.filter(f => values[f] !== undefined && values[f] !== "").length;
  const flaggedCount = panel.fields.filter(f => {
    const fl = values[f] !== undefined ? flagValue(f, values[f]) : "none";
    return fl !== "normal" && fl !== "none";
  }).length;
  const critCount = panel.fields.filter(f => {
    const fl = values[f] !== undefined ? flagValue(f, values[f]) : "none";
    return fl === "critical_low" || fl === "critical_high";
  }).length;

  const patientCtx = useMemo(() => {
    const lines = [];
    if (demo?.age || demo?.sex) lines.push(`${demo?.age || ""}yo ${demo?.sex || ""}`.trim());
    if (cc?.text) lines.push(`CC: ${cc.text}`);
    const pmh = (pmhSelected || []).slice(0, 5);
    if (pmh.length) lines.push(`PMH: ${pmh.join(", ")}`);
    const meds = (medications || []).map(m => typeof m === "string" ? m : m.name || "").filter(Boolean).slice(0, 5);
    if (meds.length) lines.push(`Meds: ${meds.join(", ")}`);
    const vs = [];
    if (vitals?.hr)   vs.push(`HR ${vitals.hr}`);
    if (vitals?.bp)   vs.push(`BP ${vitals.bp}`);
    if (vitals?.spo2) vs.push(`SpO2 ${vitals.spo2}%`);
    if (vs.length)    lines.push(`Vitals: ${vs.join("  ")}`);
    return lines.join("\n");
  }, [demo, cc, pmhSelected, medications, vitals]);

  const handleInterpret = useCallback(async () => {
    if (enteredCount === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1600,
          system:"You are a senior emergency medicine physician interpreting lab results. Be specific, clinically precise, and focused on ED management decisions. Respond ONLY with valid JSON, no markdown fences.",
          messages:[{
            role:"user",
            content:buildLabPrompt(activePanel, values, patientCtx),
          }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw    = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch (e) {
      setError("Error: " + (e.message || "Check API connectivity"));
    } finally {
      setBusy(false);
    }
  }, [enteredCount, activePanel, values, patientCtx]);

  const copyResult = useCallback(() => {
    if (!result) return;
    const lines = [
      `LAB INTERPRETATION — ${panel?.label} — ${new Date().toLocaleString()}`,
      "",
      `Pattern: ${result.overall_pattern}`,
      result.critical_values?.length ? "\nCRITICAL:\n" + result.critical_values.map(v => `  • ${v}`).join("\n") : "",
      result.abnormal_findings?.length ? "\nFINDINGS:\n" + result.abnormal_findings.map(f => `  • ${f.finding} [${f.severity}] — ${f.significance}`).join("\n") : "",
      result.differential?.length ? "\nDIFFERENTIAL:\n" + result.differential.map(d => `  • ${d.diagnosis} (${d.probability})`).join("\n") : "",
      result.immediate_actions?.length ? "\nACTIONS:\n" + result.immediate_actions.map((a,i) => `  ${i+1}. ${a}`).join("\n") : "",
      result.watch_for ? `\nMONITOR: ${result.watch_for}` : "",
      result.pearls ? `\nPEARL: ${result.pearls}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [result, panel]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            {/* FIX: onBack?.() instead of navigate('/hub') */}
            {onBack && (
              <button onClick={onBack}
                style={{ marginBottom:10,
                  display:"inline-flex", alignItems:"center", gap:7,
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                  background:"rgba(14,37,68,0.7)",
                  border:"1px solid rgba(42,79,122,0.5)",
                  borderRadius:8, padding:"5px 14px",
                  color:T.txt3, cursor:"pointer" }}>
                ← Back to Hub
              </button>
            )}
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>LABS</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(59,158,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Critical Lab Interpreter
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              BMP · CBC · LFT · Coag · ABG · Cardiac · Thyroid · Inflam · Tox · Pancreatic — AI Interpretation · Action Items
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.blue }}>
              Lab Interpreter
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(59,158,255,0.1)",
              border:"1px solid rgba(59,158,255,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              BMP · CBC · LFT · Coag · ABG · Cardiac · Thyroid · Inflam · Tox · Panc
            </span>
          </div>
        )}

        {/* Panel tabs */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {PANELS.map(p => {
            const active = activePanel === p.id;
            return (
              <button key={p.id} onClick={() => handlePanelSwitch(p.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, padding:"7px 14px", borderRadius:9,
                  cursor:"pointer", transition:"all .15s",
                  border:`1px solid ${active ? p.color+"66" : "rgba(26,53,85,0.4)"}`,
                  background:active
                    ? `linear-gradient(135deg,${p.color}18,${p.color}06)`
                    : "rgba(8,22,40,0.5)",
                  color:active ? p.color : T.txt4 }}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display:"grid",
          gridTemplateColumns: result ? "1fr 1.2fr" : "1fr",
          gap:12, alignItems:"start" }}>

          {/* Left: input */}
          <div>
            {/* Stats strip */}
            <div style={{ display:"flex", gap:7, marginBottom:9, flexWrap:"wrap" }}>
              {[
                { label:"Entered", val:enteredCount, color:T.teal   },
                { label:"Flagged", val:flaggedCount, color:T.orange  },
                { label:"Critical",val:critCount,    color:critCount>0?T.red:T.txt4 },
              ].map(s => (
                <div key={s.label} style={{ padding:"5px 10px", borderRadius:7,
                  background:`${s.color}0d`,
                  border:`1px solid ${s.color}25` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:14, fontWeight:700, color:s.color }}>
                    {s.val}
                  </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:9, color:T.txt4, marginLeft:5 }}>
                    {s.label}
                  </span>
                </div>
              ))}
              <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
                <button onClick={handleMarkNormal}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    padding:"5px 12px", borderRadius:7, cursor:"pointer",
                    letterSpacing:1, textTransform:"uppercase",
                    border:`1px solid ${T.teal}44`,
                    background:`${T.teal}0a`,
                    color:T.teal }}>
                  ✓ All Normal
                </button>
                <button onClick={() => setShowPaste(p => !p)}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    padding:"5px 12px", borderRadius:7, cursor:"pointer",
                    letterSpacing:1, textTransform:"uppercase",
                    border:`1px solid ${showPaste ? panel.color+"55" : "rgba(42,79,122,0.4)"}`,
                    background:showPaste ? `${panel.color}12` : "transparent",
                    color:showPaste ? panel.color : T.txt4 }}>
                  📋 Paste Labs
                </button>
              </div>
            </div>

            {/* Paste area */}
            {showPaste && (
              <div style={{ marginBottom:9 }}>
                <textarea value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  rows={4}
                  placeholder={"Paste lab results in any format...\ne.g.: Na: 138, K: 4.2, Cl: 102, CO2: 24, BUN: 22, Cr: 1.1, Gluc: 95"}
                  style={{ width:"100%", resize:"vertical",
                    background:"rgba(14,37,68,0.75)",
                    border:`1px solid ${pasteText ? panel.color+"44" : "rgba(42,79,122,0.35)"}`,
                    borderRadius:8, padding:"9px 11px", outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                    color:T.txt, lineHeight:1.6, marginBottom:6 }} />
                <button onClick={handleParse}
                  disabled={!pasteText.trim()}
                  style={{ padding:"7px 16px", borderRadius:7,
                    cursor:pasteText.trim() ? "pointer" : "not-allowed",
                    border:`1px solid ${panel.color+"55"}`,
                    background:`${panel.color}10`,
                    color:pasteText.trim() ? panel.color : T.txt4,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    fontSize:12 }}>
                  Parse & Fill
                </button>
              </div>
            )}

            {/* ABG FiO2 */}
            {activePanel === "abg" && (
              <div style={{ marginBottom:8, display:"flex",
                alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.txt4, letterSpacing:1 }}>FiO2 (%)</span>
                <input type="number" value={fio2}
                  onChange={e => setFio2(e.target.value)}
                  min="21" max="100"
                  style={{ width:70, padding:"5px 8px",
                    background:"rgba(14,37,68,0.75)",
                    border:"1px solid rgba(42,79,122,0.4)",
                    borderRadius:6, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:13,
                    fontWeight:700, color:T.blue }} />
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt4 }}>
                  (21 = room air, 100 = 100% O2)
                </span>
              </div>
            )}

            {/* Value grid */}
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",
              gap:7, marginBottom:10 }}>
              {panel.fields.map(f => (
                <ValCell key={f} fieldKey={f} values={values} onChange={setValue} />
              ))}
            </div>

            <CalcValues panelId={activePanel} values={values} fio2={fio2} />

            {/* Action buttons */}
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <button onClick={handleInterpret}
                disabled={busy || enteredCount === 0}
                style={{ flex:1, padding:"11px 0", borderRadius:10,
                  cursor:busy||enteredCount===0 ? "not-allowed" : "pointer",
                  border:`1px solid ${enteredCount===0 ? "rgba(42,79,122,0.3)" : panel.color+"66"}`,
                  background:enteredCount===0
                    ? "rgba(42,79,122,0.15)"
                    : `linear-gradient(135deg,${panel.color}18,${panel.color}06)`,
                  color:enteredCount===0 ? T.txt4 : panel.color,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:13, transition:"all .15s" }}>
                {busy ? "⚙ Interpreting..." : `🔬 Interpret ${panel.label}`}
              </button>
              {result && (
                <button onClick={copyResult}
                  style={{ padding:"11px 16px", borderRadius:10,
                    cursor:"pointer", transition:"all .15s",
                    border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                    background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                    color:copied ? T.green : T.txt3,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:12 }}>
                  {copied ? "✓" : "Copy"}
                </button>
              )}
              <button onClick={() => { setValues({}); setResult(null); }}
                style={{ padding:"11px 12px", borderRadius:10,
                  cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.35)",
                  background:"transparent", color:T.txt4,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  letterSpacing:1, textTransform:"uppercase" }}>
                Clear
              </button>
            </div>

            {error && (
              <div style={{ padding:"8px 12px", borderRadius:8, marginTop:8,
                background:"rgba(255,107,107,0.08)",
                border:"1px solid rgba(255,107,107,0.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.coral }}>{error}</div>
            )}
          </div>

          {/* Right: AI result */}
          {result && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:panel.color, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8 }}>
                AI Interpretation — {panel.label}
              </div>
              <LabResult result={result} panelColor={panel.color} />
            </div>
          )}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA LAB INTERPRETER · AI CLINICAL DECISION SUPPORT · VERIFY ALL RESULTS WITH CLINICAL CONTEXT · NOT A SUBSTITUTE FOR PHYSICIAN JUDGMENT
          </div>
        )}
      </div>
    </div>
  );
}