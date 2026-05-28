import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── CSS injection ─────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("lxnb-styles")) return;
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "lxnb-styles";
  s.textContent = `
    .lxnb-bar{
      position:fixed;top:0;left:0;right:0;height:52px;z-index:9999;
      background:rgba(5,15,30,0.97);border-bottom:1px solid rgba(26,53,85,0.7);
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      display:flex;align-items:center;gap:10px;padding:0 14px;
      font-family:'DM Sans',sans-serif;
    }
    .lxnb-page-shim{padding-top:52px!important;}

    /* Brand */
    .lxnb-brand{display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0;user-select:none;transition:opacity .15s}
    .lxnb-brand:hover{opacity:.8}
    .lxnb-mark{width:28px;height:28px;border-radius:7px;background:#0A1628;
      border:1px solid rgba(201,168,76,0.45);display:flex;align-items:center;
      justify-content:center;flex-shrink:0}
    .lxnb-wordmark{font-family:'Playfair Display',serif;font-size:13px;font-weight:900;
      letter-spacing:.12em;color:#f2f7ff}
    @media(max-width:520px){.lxnb-wordmark{display:none}}

    /* Search */
    .lxnb-search-wrap{position:relative;flex:1;min-width:0;max-width:360px}
    @media(max-width:520px){.lxnb-search-wrap{max-width:none}}
    .lxnb-input{width:100%;padding:7px 34px 7px 32px;border-radius:9px;
      background:rgba(11,30,54,0.85);border:1.5px solid rgba(26,53,85,0.7);
      color:#f2f7ff;font-family:'DM Sans',sans-serif;font-size:13px;
      outline:none;box-sizing:border-box;caret-color:#00e5c0;
      transition:border-color .18s,box-shadow .18s}
    .lxnb-input::placeholder{color:rgba(90,130,168,0.55)}
    .lxnb-input:focus{border-color:rgba(0,229,192,0.5)!important;
      box-shadow:0 0 0 3px rgba(0,229,192,0.07)!important}
    .lxnb-si{position:absolute;left:9px;top:50%;transform:translateY(-50%);
      font-size:13px;pointer-events:none;opacity:.45}
    .lxnb-kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);
      font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(90,130,168,0.5);
      background:rgba(26,53,85,0.5);border:1px solid rgba(42,79,122,0.4);
      padding:2px 6px;border-radius:4px;pointer-events:none}
    .lxnb-drop{position:absolute;top:calc(100% + 5px);left:0;right:0;
      background:rgba(6,12,25,0.99);border:1px solid rgba(0,229,192,0.18);
      border-radius:10px;z-index:10001;overflow:hidden;
      box-shadow:0 16px 48px rgba(0,0,0,.75);
      animation:lxnb-drop .15s ease both;backdrop-filter:blur(16px)}
    @keyframes lxnb-drop{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
    .lxnb-dr{display:flex;align-items:center;gap:10px;padding:9px 12px;
      cursor:pointer;border-bottom:1px solid rgba(26,53,85,0.3);transition:background .1s}
    .lxnb-dr:last-child{border-bottom:none}
    .lxnb-dr:hover,.lxnb-dr.lxnb-ac{background:rgba(0,229,192,0.07)}
    .lxnb-dr-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;
      justify-content:center;font-size:13px;flex-shrink:0}
    .lxnb-dr-name{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
      color:#f2f7ff;line-height:1.2}
    .lxnb-dr-cat{font-family:'JetBrains Mono',monospace;font-size:7.5px;
      color:rgba(130,174,206,0.6);margin-top:1px}
    .lxnb-dr-badge{font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;
      padding:2px 6px;border-radius:8px;flex-shrink:0;margin-left:auto;letter-spacing:.04em}
    .lxnb-empty{padding:14px;text-align:center;font-family:'JetBrains Mono',monospace;
      font-size:9.5px;color:rgba(90,130,168,0.5);letter-spacing:.08em}
    .lxnb-hints{display:flex;gap:10px;padding:5px 12px;border-top:1px solid rgba(26,53,85,0.4)}
    .lxnb-hint{font-family:'JetBrains Mono',monospace;font-size:7px;color:rgba(90,130,168,0.5)}

    /* Shift chip */
    .lxnb-chip{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:5px 10px;
      border-radius:8px;cursor:pointer;transition:all .17s;user-select:none;
      background:rgba(11,30,54,0.7);border:1px solid rgba(42,79,122,0.45)}
    .lxnb-chip:hover{border-color:rgba(0,229,192,0.35);background:rgba(0,229,192,0.06)}
    .lxnb-chip-dot{width:6px;height:6px;border-radius:50%;background:#00e5c0;
      box-shadow:0 0 5px #00e5c0;animation:lxnb-pulse 2.4s ease-in-out infinite;flex-shrink:0}
    @keyframes lxnb-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .lxnb-chip-txt{font-family:'JetBrains Mono',monospace;font-size:9px;
      color:rgba(130,174,206,0.75);white-space:nowrap;letter-spacing:.05em}
    @media(max-width:640px){.lxnb-chip-txt{display:none}}
  `;
  document.head.appendChild(s);
})();

// ── Token colors ──────────────────────────────────────────────────────────────
const T = {
  teal:"#00e5c0", gold:"#f5c842", blue:"#3b9eff", purple:"#9b6dff",
  orange:"#ff9f43", coral:"#ff6b6b", green:"#3dffa0", cyan:"#00d4ff",
};
const BRAND = { gold:"#C9A84C", teal:"#0ABFBF" };

// ── Hub search index ──────────────────────────────────────────────────────────
const HUB_INDEX = [
  { icon:"💓", name:"Chest Pain Hub",         cat:"Cardiac",      badge:"HEART·EDACS",  color:T.coral,  route:"CardiacRiskPage",    keys:["chest pain","acs","heart score","troponin","edacs","nstemi","stemi","mi"] },
  { icon:"📈", name:"ECG Hub",                cat:"Cardiac",      badge:"ACC/AHA",      color:T.cyan,   route:"ECGHub",             keys:["ecg","ekg","stemi","afib","atrial fibrillation","wide complex","av block","qtc","sgarbossa","wellens","brugada","lbbb"] },
  { icon:"⚡", name:"Resuscitation Hub",      cat:"Cardiac",      badge:"AHA 2020",     color:T.coral,  route:"ResusHub",           keys:["cpr","acls","cardiac arrest","vfib","pulseless","rosc","post-arrest","epinephrine","amiodarone"] },
  { icon:"🌬️", name:"Airway Hub",             cat:"Airway",       badge:"DAS 2022",     color:T.blue,   route:"AirwayHub",          keys:["airway","rsi","intubation","crash","cric","bvm","sgga","hfnc","bipap","cpap","ards","difficult airway","das","cico"] },
  { icon:"🫁", name:"Ventilator Hub",         cat:"Pulmonary",    badge:"ARDSNet",      color:T.blue,   route:"VentPage",           keys:["vent","ventilator","tidal volume","peep","ardsnet","plateau pressure","fio2","driving pressure"] },
  { icon:"🦠", name:"Sepsis Hub",             cat:"Critical Care",badge:"SSC 2021",     color:T.orange, route:"SepsisHub",          keys:["sepsis","septic shock","hour-1","bundle","antibiotics","norepinephrine","vasopressor","sofa","qsofa","lactate","cultures","sep-1"] },
  { icon:"💉", name:"Shock Hub",              cat:"Critical Care",badge:"UNIFIED",      color:T.orange, route:"ShockHub",           keys:["shock","hypotension","vasopressor","fluid resuscitation","distributive","obstructive","cardiogenic","hypovolemic","map","levophed"] },
  { icon:"🧠", name:"Stroke Hub",             cat:"Neurology",    badge:"AHA 2019",     color:T.purple, route:"StrokeHub",          keys:["stroke","tpa","alteplase","tnk","nihss","lvo","thrombectomy","door-to-needle","wake-up stroke","tia","dti"] },
  { icon:"⚡", name:"Seizure Hub",            cat:"Neurology",    badge:"AES 2022",     color:T.purple, route:"SeizureHub",         keys:["seizure","status epilepticus","lorazepam","levetiracetam","phenytoin","keppra","benzodiazepine","eclampsia"] },
  { icon:"🚑", name:"Trauma Hub",             cat:"Trauma",       badge:"ATLS 10e",     color:T.orange, route:"TraumaHub",          keys:["trauma","atls","massive transfusion","mtp","txa","tranexamic acid","abcde","primary survey","hemorrhage","penetrating"] },
  { icon:"🦴", name:"Ortho Hub",              cat:"Trauma",       badge:"ORTHO",        color:T.gold,   route:"OrthoHub",           keys:["fracture","splint","dislocation","reduction","nerve block","hematoma block","ortho","compartment","ottawa","nexus"] },
  { icon:"☠️", name:"Toxicology Hub",         cat:"Toxicology",   badge:"ACMT 2024",    color:T.green,  route:"ToxicologyHub",      keys:["tox","overdose","antidote","nac","acetaminophen","tylenol","fomepizole","naloxone","narcan","digoxin","opioid","xylazine","co","carbon monoxide"] },
  { icon:"📋", name:"New Patient Input",      cat:"Documentation",badge:"NPI",          color:T.teal,   route:"NewPatientInput",    keys:["npi","new patient","hpi","encounter","chief complaint","vitals","smartfill","mdm","documentation"] },
  { icon:"🤖", name:"AI MDM Builder",         cat:"Documentation",badge:"CMS 2024",     color:T.purple, route:"NewPatientInput",    keys:["mdm","medical decision making","cms","e&m","billing","cpt","complexity","data reviewed","risk","attestation","split shared"] },
  { icon:"📝", name:"Order Generator Hub",    cat:"Documentation",badge:"CPOE",         color:T.blue,   route:"OrderGeneratorHub",  keys:["orders","cpoe","order set","bundle","medications","labs","imaging","admit orders","discharge"] },
  { icon:"🖼️", name:"Imaging Interpreter",   cat:"Diagnostics",  badge:"AI·VISION",    color:T.cyan,   route:"ImagingInterpreter", keys:["imaging","radiology","ct","xray","mri","ultrasound","pe","pulmonary embolism","wells","pesi","pioped","critical findings"] },
  { icon:"🫀", name:"POCUS Hub",             cat:"Diagnostics",  badge:"ACEP",         color:T.cyan,   route:"POCUSHub",           keys:["pocus","point of care","ultrasound","fast","efast","rush","cardiac","lung","effusion","pneumothorax","aorta","ivc"] },
  { icon:"🔬", name:"Lab Interpreter",        cat:"Diagnostics",  badge:"AI·PASTE",     color:T.green,  route:"LabHub",             keys:["labs","bmp","cmp","cbc","lft","lactic","anion gap","critical values","abnormal","troponin","bnp","d-dimer"] },
  { icon:"⚗️", name:"Electrolyte Hub",        cat:"Metabolic",    badge:"ACID-BASE",    color:T.teal,   route:"ElectrolyteAcidBaseHub",keys:["electrolytes","sodium","potassium","calcium","magnesium","hyponatremia","hyperkalemia","acidosis","alkalosis","anion gap","bicarb","ph","vbg"] },
  { icon:"🧪", name:"Triage Hub",             cat:"Nursing",      badge:"ESI",          color:T.gold,   route:"TriageHub",          keys:["triage","esi","acuity","chief complaint","arrival","ems","priority"] },
  { icon:"🧬", name:"Derm Hub",               cat:"Dermatology",  badge:"LRINEC",       color:T.orange, route:"DermatologyHub",     keys:["derm","skin","rash","necrotizing fasciitis","cellulitis","lrinec","sts","sjs","ten","bsa","erythema","abscess"] },
  { icon:"🩺", name:"Rapid Assessment Hub",   cat:"Workflow",     badge:"RAPID",        color:T.teal,   route:"RapidAssessmentHub", keys:["rapid","quick look","assessment","vitals","chief complaint","sick","not sick"] },
  { icon:"🧠", name:"Psych Hub",              cat:"Psychiatry",   badge:"UNIFIED",      color:T.purple, route:"PsycheHub",          keys:["psych","psychiatric","suicidal","agitation","phq","columbia","haldol","ketamine","restraint","hold","baker act"] },
  { icon:"📊", name:"Autocoder Hub",          cat:"Billing",      badge:"ICD-10",       color:T.gold,   route:"AutocoderHub",       keys:["icd","billing","coding","diagnosis code","cpt","autocoder","revenue","charge capture"] },
  { icon:"🌐", name:"Anamnesis",              cat:"FHIR",         badge:"TEFCA",        color:T.cyan,   route:"AnamnesisPage",      keys:["fhir","carequality","commonwell","tefca","patient history","records","outside records","hie","interoperability"] },
  { icon:"💊", name:"ERx Hub",               cat:"Pharmacology", badge:"UNIFIED",      color:T.green,  route:"MedRecHub",          keys:["prescription","medications","discharge rx","opioid","controlled","drug interactions","pharmacy","dispense"] },
  { icon:"🏥", name:"New Patient Input",      cat:"Workflow",     badge:"NPI",          color:T.teal,   route:"NewPatientInput",    keys:["new patient","encounter","npi","start","admit","chief complaint","hpi","vitals"] },
  { icon:"⊞",  name:"Hub Page",              cat:"Workflow",     badge:"HOME",         color:T.gold,   route:"HubSelectorPage",    keys:["hub","home","menu","hubs","all hubs","command","navigate","dashboard"] },
  { icon:"⚡", name:"Command Center",         cat:"Workflow",     badge:"SHIFT",        color:T.teal,   route:"CommandCenter",      keys:["command center","shift","active","dashboard","patients","tracking","trackboard"] },
  { icon:"🩸", name:"Pediatric Hub",          cat:"Pediatrics",   badge:"PALS",         color:T.blue,   route:"PedsHub",            keys:["peds","pediatric","child","infant","weight","dose","pediatric","pals"] },
  { icon:"🫁", name:"Dyspnea Hub",            cat:"Pulmonary",    badge:"GUIDELINE",    color:T.blue,   route:"DyspneaHub",         keys:["dyspnea","shortness of breath","copd","asthma","chf","pulmonary","oxygen"] },
  { icon:"💊", name:"Pharmacology Hub",       cat:"Pharmacology", badge:"UNIFIED",      color:T.green,  route:"UnifiedPharmacologyHub", keys:["pharmacology","drug","medication","dose","formulary","antibiotic","vancomycin","fentanyl"] },
  { icon:"🤕", name:"Abdominal Pain Hub",     cat:"GI",           badge:"GUIDELINE",    color:T.coral,  route:"AbdominalPainHub",   keys:["abdominal","abdominal pain","appendicitis","bowel","gi","liver","gallbladder","pancreatitis"] },
  { icon:"🤕", name:"Headache Hub",           cat:"Neurology",    badge:"GUIDELINE",    color:T.purple, route:"HeadacheHub",        keys:["headache","migraine","thunder","sah","meningitis","icp","tension headache"] },
];

function searchHubs(q) {
  const lq = q.toLowerCase().trim();
  if (!lq) return [];
  return HUB_INDEX.filter(h =>
    h.name.toLowerCase().includes(lq) ||
    h.cat.toLowerCase().includes(lq) ||
    h.badge.toLowerCase().includes(lq) ||
    h.keys.some(k => k.includes(lq))
  ).slice(0, 8);
}

// ── LX monogram SVG ───────────────────────────────────────────────────────────
function LXMark() {
  return (
    <div className="lxnb-mark">
      <svg viewBox="0 0 500 500" width={18} height={18} xmlns="http://www.w3.org/2000/svg">
        <text x="106" y="305" fontFamily="'Playfair Display',Georgia,serif" fontSize="280" fontWeight="700" fill={BRAND.gold}>L</text>
        <text x="193" y="305" fontFamily="'Playfair Display',Georgia,serif" fontSize="280" fontWeight="700" fill={BRAND.teal}>X</text>
      </svg>
    </div>
  );
}

// ── Main NavBar component ─────────────────────────────────────────────────────
export default function LakonyxNavBar({ currentHub = "" }) {
  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const wrapRef    = useRef(null);

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [cursor,  setCursor]  = useState(-1);
  const [open,    setOpen]    = useState(false);
  const [shiftCtx,setShiftCtx]= useState(null);

  // Load shift context from storage
  useEffect(() => {
    (async () => {
      try {
        if (!window.storage) return;
        const r = await window.storage.get("shiftContext");
        if (r?.value) {
          const ctx = JSON.parse(r.value);
          if (ctx?.dept) setShiftCtx(ctx);
        }
      } catch(_) {}
    })();
  }, []);

  // Update results when query changes
  useEffect(() => {
    setResults(searchHubs(query));
    setCursor(-1);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const h = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // '/' key focuses search globally
  useEffect(() => {
    const h = e => {
      if (e.key === "/" && document.activeElement !== inputRef.current &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const goHub = useCallback((route) => {
    setQuery("");
    setOpen(false);
    navigate(`/${route}`);
    // persist recent
    try {
      if (window.storage) {
        window.storage.get("lxl_recent_hubs").then(r => {
          const prev = r?.value ? JSON.parse(r.value) : [];
          const updated = [route, ...prev.filter(x => x !== route)].slice(0, 5);
          window.storage.set("lxl_recent_hubs", JSON.stringify(updated));
        }).catch(() => {});
      }
    } catch(_) {}
  }, [navigate]);

  const handleKey = e => {
    if (!open) {
      if (e.key === "Enter" && query.trim()) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, -1)); }
    if (e.key === "Enter" && cursor >= 0 && results[cursor]) {
      e.preventDefault(); e.stopPropagation();
      goHub(results[cursor].route);
    }
    if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
  };

  const shiftLabel = shiftCtx
    ? [shiftCtx.facility, shiftCtx.dept].filter(Boolean).join(" · ")
    : null;

  const showDrop = open && query.length > 0;

  return (
    <nav className="lxnb-bar">
      {/* Brand */}
      <div className="lxnb-brand" onClick={() => navigate("/")}>
        <LXMark />
        <span className="lxnb-wordmark">LAKONYX</span>
      </div>

      {/* Search */}
      <div className="lxnb-search-wrap" ref={wrapRef}>
        <span className="lxnb-si">🔍</span>
        <input
          ref={inputRef}
          className="lxnb-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search hubs, protocols, calculators..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={handleKey}
        />
        {!query && <span className="lxnb-kbd">/</span>}

        {showDrop && (
          <div className="lxnb-drop">
            {results.length === 0 && (
              <div className="lxnb-empty">No hubs matched "{query}"</div>
            )}
            {results.map((h, i) => (
              <div
                key={h.route + h.name}
                className={`lxnb-dr${cursor === i ? " lxnb-ac" : ""}`}
                onMouseEnter={() => setCursor(i)}
                onMouseDown={e => { e.preventDefault(); goHub(h.route); }}
              >
                <div className="lxnb-dr-ico"
                  style={{ background: h.color + "18", border: `1px solid ${h.color}28` }}>
                  {h.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lxnb-dr-name">{h.name}</div>
                  <div className="lxnb-dr-cat">{h.cat}</div>
                </div>
                <span className="lxnb-dr-badge"
                  style={{ background: h.color + "18", border: `1px solid ${h.color}28`, color: h.color }}>
                  {h.badge}
                </span>
              </div>
            ))}
            {results.length > 0 && (
              <div className="lxnb-hints">
                <span className="lxnb-hint">↑↓ navigate</span>
                <span className="lxnb-hint">↵ open</span>
                <span className="lxnb-hint">Esc close</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shift context chip */}
      {shiftLabel && (
        <div className="lxnb-chip" onClick={() => navigate("/")}>
          <div className="lxnb-chip-dot" />
          <span className="lxnb-chip-txt">{shiftLabel}</span>
        </div>
      )}
    </nav>
  );
}