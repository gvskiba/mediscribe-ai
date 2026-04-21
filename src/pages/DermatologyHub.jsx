// DermatologyHub.jsx
// Notrya Clinical Dermatology — keyboard-first characteristic selection
// → Anthropic web search (DermNet / AAD / VisualDx) → Differential + Wikipedia images
// Features: Fitzpatrick scale · ABCDE melanoma checker · Life-threatening derm alert · Copy-to-chart

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── STYLE INJECTION ──────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("derm-css")) return;
  const s = document.createElement("style"); s.id = "derm-css";
  s.textContent = `
    :root{
      --derm-bg:#050f1e;--derm-panel:#081628;--derm-card:#0b1e36;
      --derm-txt:#f2f7ff;--derm-txt2:#b8d4f0;--derm-txt3:#82aece;--derm-txt4:#5a82a8;
      --derm-teal:#00e5c0;--derm-gold:#f5c842;--derm-coral:#ff6b6b;--derm-blue:#3b9eff;
      --derm-orange:#ff9f43;--derm-purple:#9b6dff;--derm-green:#3dffa0;--derm-red:#ff4444;
      --derm-bd:rgba(42,79,122,0.4);--derm-up:rgba(14,37,68,0.75);
    }
    @keyframes derm-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .derm-fade{animation:derm-fade .2s ease both}
    @keyframes derm-shim{0%{background-position:-200% center}100%{background-position:200% center}}
    .derm-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#00e5c0 50%,#3b9eff 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:derm-shim 6s linear infinite
    }
    @keyframes derm-pulse{0%,100%{opacity:.6}50%{opacity:1}}
    .derm-pulse{animation:derm-pulse 1.4s ease-in-out infinite}
    .derm-opt{
      padding:5px 11px;border-radius:7px;cursor:pointer;transition:all .13s;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
      background:rgba(14,37,68,.6);border:1px solid rgba(42,79,122,.3);
      color:var(--derm-txt4);line-height:1.3;white-space:nowrap
    }
    .derm-opt.on{
      border-color:rgba(0,229,192,.5);background:rgba(0,229,192,.1);
      color:var(--derm-teal);font-weight:700
    }
    .derm-opt:focus{outline:2px solid var(--derm-teal);outline-offset:1px}
    .derm-opt:hover:not(.on){border-color:rgba(42,79,122,.6);color:var(--derm-txt3)}
    .derm-ti{
      background:var(--derm-up);border:1px solid var(--derm-bd);border-radius:8px;
      padding:8px 10px;color:var(--derm-txt);font-family:'DM Sans',sans-serif;
      font-size:11px;outline:none;width:100%;box-sizing:border-box;
      resize:vertical;transition:border-color .15s;line-height:1.6
    }
    .derm-ti:focus{border-color:rgba(0,229,192,.5)}
    .derm-card-img{width:100%;height:140px;object-fit:cover;display:block;background:#000}
    @media print{
      .no-print{display:none!important}
      body{background:#fff!important;color:#111!important}
    }
  `;
  document.head.appendChild(s);
  if (!document.getElementById("derm-fonts")) {
    const l = document.createElement("link"); l.id = "derm-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── CHARACTERISTIC CATEGORIES ────────────────────────────────────────────────
const CATS = [
  { id:"morphology", n:1, icon:"⬡", label:"Primary Morphology", multi:true, opts:[
    "Macule — flat color change","Papule — raised <1cm","Plaque — raised >1cm",
    "Vesicle — blister <1cm","Bulla — blister >1cm","Pustule — pus-filled",
    "Nodule — deep solid","Wheal / Urticaria","Petechiae / Purpura — non-blanching",
    "Erosion","Ulcer","Atrophy","Comedone",
  ]},
  { id:"color", n:2, icon:"◈", label:"Color", multi:true, opts:[
    "Red / Erythematous","Pink / Salmon","Brown","Dark Brown / Black",
    "White / Hypopigmented","Depigmented — stark white","Yellow","Purple / Violaceous",
    "Blue-gray","Skin-colored","Multiple / Variegated colors",
  ]},
  { id:"surface", n:3, icon:"✦", label:"Surface & Scale", multi:true, opts:[
    "Smooth","Fine scale","Thick silvery scale","Crusted / honey-colored crust",
    "Verrucous / warty","Umbilicated","Lichenified","Keratotic","Weeping / moist","Shiny / atrophic",
  ]},
  { id:"configuration", n:4, icon:"◎", label:"Configuration", multi:true, opts:[
    "Discrete / isolated","Grouped / clustered","Confluent","Linear",
    "Annular / ring-shaped","Target / iris lesions","Dermatomal / zosteriform",
    "Reticular / net-like","Arcuate / serpiginous",
  ]},
  { id:"distribution", n:5, icon:"◉", label:"Distribution / Location", multi:true, opts:[
    "Face","Scalp","Neck","Trunk / torso","Upper extremities","Lower extremities",
    "Palms and/or soles","Flexural areas — folds","Extensor surfaces",
    "Generalized / widespread","Sun-exposed areas","Mucous membranes / oral",
    "Genital / perineal","Periungual / nails",
  ]},
  { id:"symptoms", n:6, icon:"⚡", label:"Symptoms", multi:true, opts:[
    "Pruritic (itchy)","Painful / tender","Burning sensation","Asymptomatic",
    "Bleeding","Fever / systemic symptoms","Rapidly spreading","Recurrent / episodic",
  ]},
  { id:"patient", n:7, icon:"👤", label:"Patient Context", multi:true, opts:[
    "Pediatric (<12 yrs)","Adolescent (12-18 yrs)","Adult (19-64 yrs)","Elderly (>65 yrs)",
    "Pregnant","Immunocompromised / HIV","Atopic history (eczema/asthma/allergies)",
    "New medication within 4 weeks","Recent travel / outdoor exposure","Occupational exposure",
    "Diabetic","Contact with infected person",
  ]},
  { id:"chronology", n:8, icon:"⏱", label:"Chronology", multi:false, opts:[
    "Acute — hours (<24h)","Subacute — days (1-7 days)",
    "Recent — weeks (1-4 weeks)","Chronic — months (>4 weeks)",
    "Chronic with acute flare","Recurrent / episodic",
  ]},
];

const FITZPATRICK = [
  { n:1, label:"I",   desc:"Very fair — always burns",    color:"#f5d5b8" },
  { n:2, label:"II",  desc:"Fair — usually burns",        color:"#e8b898" },
  { n:3, label:"III", desc:"Medium — sometimes burns",    color:"#c99070" },
  { n:4, label:"IV",  desc:"Olive — rarely burns",        color:"#a06840" },
  { n:5, label:"V",   desc:"Brown — very rarely burns",   color:"#7a4520" },
  { n:6, label:"VI",  desc:"Dark — never burns",          color:"#3a1a08" },
];

// ─── AI SYSTEM PROMPT ─────────────────────────────────────────────────────────
const DERM_SYS = `You are a board-certified dermatologist providing clinical decision support for emergency physicians. Using web search, search DermNet NZ (dermnet.com), the American Academy of Dermatology (aad.org), VisualDx (visualdx.com), and AOCD (aocd.org) for skin conditions matching the clinical characteristics provided.

Return ONLY valid JSON with no markdown fences:
{
  "differential": [
    {
      "name": "Full condition name",
      "icd10": "ICD-10 code",
      "likelihood": "most_likely|likely|possible|less_likely",
      "key_features": ["feature 1 matching presentation", "feature 2", "feature 3"],
      "distinguishing_features": "What sets this apart from look-alikes",
      "ed_management": "Immediate ED management — specific topical/systemic agent or disposition",
      "referral_urgency": "emergent|urgent|routine|not_indicated",
      "dermnet_url": "https://dermnet.com/full-url",
      "aad_url": "https://www.aad.org/public/diseases/a-z/full-url",
      "wiki_title": "Wikipedia article title for this condition (used for image lookup)"
    }
  ],
  "life_threatening": ["list any life-threatening conditions to exclude — TEN, SJS, DRESS, necrotizing fasciitis, meningococcemia, Kawasaki, etc. — empty array if none"],
  "red_flags": ["specific red flags from this presentation"],
  "abcde_concern": false,
  "pearls": "Single most important ED-specific clinical pearl",
  "further_workup": ["KOH prep", "Tzanck smear", "skin biopsy", "etc."],
  "sources_searched": ["DermNet NZ", "AAD", "VisualDx"]
}

Include 5-8 diagnoses ordered most-to-least likely. Set abcde_concern to true ONLY if a pigmented/melanocytic lesion concern is present. ALWAYS check for and flag life-threatening derm emergencies.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function composeQuery(selections, freeText, fitzpatrick, patientCtx) {
  const lines = [];
  if (patientCtx) lines.push(`PATIENT CONTEXT:\n${patientCtx}\n`);
  lines.push("CLINICAL CHARACTERISTICS:");
  CATS.forEach(cat => {
    const s = selections[cat.id];
    const vals = Array.isArray(s) ? s : (s ? [s] : []);
    if (vals.length) lines.push(`${cat.label}: ${vals.join(", ")}`);
  });
  if (fitzpatrick) lines.push(`Fitzpatrick Skin Type: ${FITZPATRICK[fitzpatrick-1]?.desc || fitzpatrick}`);
  if (freeText?.trim()) lines.push(`Additional clinical notes: ${freeText.trim()}`);
  lines.push("\nSearch DermNet NZ, AAD, VisualDx, and AOCD for conditions matching these characteristics. Return structured differential diagnosis JSON.");
  return lines.join("\n");
}

async function fetchWikiImage(title) {
  if (!title) return null;
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=480&format=json&origin=*`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.thumbnail?.source || null;
  } catch { return null; }
}

function parseDermResponse(raw) {
  const stripped = raw.replace(/```(?:json)?\s*/g,"").replace(/```/g,"").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

function buildPatientCtx(demo, vitals, cc, pmhSelected, medications) {
  const lines = [];
  if (demo?.age || demo?.sex) lines.push(`${demo?.age||""}yo ${demo?.sex||""}`.trim());
  if (cc?.text) lines.push(`CC: ${cc.text}`);
  if (vitals?.temp) lines.push(`Temp: ${vitals.temp}C`);
  const pmh = (pmhSelected||[]).slice(0,4);
  if (pmh.length) lines.push(`PMH: ${pmh.join(", ")}`);
  const meds = (medications||[]).map(m => typeof m==="string"?m:m.name||"").filter(Boolean).slice(0,3);
  if (meds.length) lines.push(`Meds: ${meds.join(", ")}`);
  return lines.join("\n");
}

// ─── CHARACTERISTIC SELECTOR ──────────────────────────────────────────────────
function CharSelector({ selections, onToggle, freeText, onFreeText, fitzpatrick, onFitzpatrick, activeCat, onCatNav }) {
  const refs = useRef({});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* Fitzpatrick */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--derm-txt4)",
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
          Fitzpatrick Skin Type
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {FITZPATRICK.map(fz => (
            <button key={fz.n}
              className={`derm-opt${fitzpatrick===fz.n?" on":""}`}
              onClick={() => onFitzpatrick(fitzpatrick===fz.n ? null : fz.n)}
              title={fz.desc}
              style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:7 }}>
              <span style={{ width:10, height:10, borderRadius:"50%",
                background:fz.color, border:"1px solid rgba(255,255,255,.2)", flexShrink:0 }} />
              <span>{fz.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {CATS.map((cat, ci) => {
        const sel = selections[cat.id] || (cat.multi ? [] : null);
        const count = Array.isArray(sel) ? sel.length : (sel ? 1 : 0);
        const isActive = activeCat === cat.id;
        return (
          <div key={cat.id} id={`derm-cat-${cat.id}`}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7,
              cursor:"pointer" }} onClick={() => onCatNav(cat.id)}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color: isActive ? "var(--derm-teal)" : "var(--derm-txt4)",
                background:"rgba(42,79,122,.3)", borderRadius:4,
                padding:"1px 6px", border:`1px solid ${isActive ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.4)"}` }}>
                {cat.n}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color: isActive ? "var(--derm-teal)" : "var(--derm-txt4)",
                letterSpacing:1.4, textTransform:"uppercase" }}>
                {cat.icon} {cat.label}
              </span>
              {count > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-teal)", background:"rgba(0,229,192,.1)",
                  borderRadius:9, padding:"0 7px", border:"1px solid rgba(0,229,192,.25)" }}>
                  {count}
                </span>
              )}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {cat.opts.map((opt, oi) => {
                const on = Array.isArray(sel) ? sel.includes(opt) : sel === opt;
                return (
                  <button key={opt}
                    ref={el => { refs.current[`${ci}-${oi}`] = el; }}
                    className={`derm-opt${on?" on":""}`}
                    onClick={() => onToggle(cat.id, opt, cat.multi !== false)}
                    onKeyDown={e => {
                      if (e.key==="ArrowRight"){ e.preventDefault(); refs.current[`${ci}-${oi+1}`]?.focus(); }
                      else if (e.key==="ArrowLeft"){ e.preventDefault(); refs.current[`${ci}-${oi-1}`]?.focus(); }
                      else if (e.key==="ArrowDown"||e.key==="Tab"){
                        const nc=CATS[ci+1]; if(nc){ e.preventDefault(); refs.current[`${ci+1}-0`]?.focus(); }
                      } else if (e.key==="ArrowUp"){
                        const pc=CATS[ci-1]; if(pc){ e.preventDefault(); refs.current[`${ci-1}-0`]?.focus(); }
                      }
                    }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Free text */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--derm-txt4)",
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          Additional Clinical Notes
        </div>
        <textarea className="derm-ti" value={freeText} rows={3}
          onChange={e => onFreeText(e.target.value)}
          placeholder="Lesion size, duration of change, precipitating factors, associated symptoms, recent exposures..." />
      </div>
    </div>
  );
}

// ─── LIFE-THREATENING ALERT ───────────────────────────────────────────────────
function LifeThreatAlert({ conditions }) {
  if (!conditions?.length) return null;
  return (
    <div className="derm-fade" style={{ padding:"11px 14px", borderRadius:10, marginBottom:12,
      background:"rgba(255,68,68,.13)", border:"2px solid rgba(255,68,68,.55)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
        Exclude These Life-Threatening Conditions
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {conditions.map((c, i) => (
          <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            fontWeight:700, color:"var(--derm-txt2)",
            background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.3)",
            borderRadius:6, padding:"3px 10px" }}>{c}</span>
        ))}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-coral)",
        marginTop:7, lineHeight:1.55 }}>
        Check mucosal surfaces, Nikolsky sign, skin tenderness, and extent of involvement.
        If TEN/SJS suspected: dermatology + ophthalmology emergent consult, admit, stop offending drug.
      </div>
    </div>
  );
}

// ─── ABCDE PANEL ──────────────────────────────────────────────────────────────
function ABCDEPanel() {
  const items = [
    { l:"A", t:"Asymmetry",  d:"One half does not match the other" },
    { l:"B", t:"Border",     d:"Irregular, ragged, notched, or blurred edges" },
    { l:"C", t:"Color",      d:"Multiple shades — tan, brown, black, blue, white, red" },
    { l:"D", t:"Diameter",   d:"Larger than 6mm (pencil eraser)" },
    { l:"E", t:"Evolution",  d:"Changes in size, shape, color, or new symptoms (bleeding)" },
  ];
  return (
    <div className="derm-fade" style={{ padding:"10px 13px", borderRadius:9, marginBottom:12,
      background:"rgba(155,109,255,.08)", border:"1px solid rgba(155,109,255,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-purple)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
        ABCDE Melanoma Checklist — Pigmented Lesion Alert
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
        {items.map(item => (
          <div key={item.l} style={{ padding:"7px 9px", borderRadius:7,
            background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.2)",
            textAlign:"center" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
              fontSize:18, color:"var(--derm-purple)", lineHeight:1 }}>{item.l}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt3)", marginTop:2 }}>{item.t}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:"var(--derm-txt4)", marginTop:3, lineHeight:1.4 }}>{item.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIAGNOSIS CARD ───────────────────────────────────────────────────────────
function DiagnosisCard({ dx, image, imgLoading }) {
  const [exp, setExp] = useState(false);
  const lc = dx.likelihood==="most_likely" ? "#ff9f43"
    : dx.likelihood==="likely"    ? "#f5c842"
    : dx.likelihood==="possible"  ? "#3b9eff"
    : "#5a82a8";
  const rc = dx.referral_urgency==="emergent" ? "var(--derm-red)"
    : dx.referral_urgency==="urgent" ? "var(--derm-orange)" : "var(--derm-txt4)";
  const dermUrl = dx.dermnet_url || `https://dermnet.com/search?q=${encodeURIComponent(dx.name)}`;
  const aadUrl  = dx.aad_url    || `https://www.aad.org/search#q=${encodeURIComponent(dx.name)}`;

  return (
    <div className="derm-fade" style={{ borderRadius:11, overflow:"hidden",
      background:"rgba(8,22,40,.75)", border:`1px solid ${lc}33`,
      transition:"border-color .2s" }}>

      {/* Image */}
      <div style={{ position:"relative", background:"#000", height:140 }}>
        {imgLoading ? (
          <div style={{ height:140, display:"flex", alignItems:"center",
            justifyContent:"center", background:"rgba(14,37,68,.8)" }}>
            <span className="derm-pulse" style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:"var(--derm-txt4)" }}>loading image...</span>
          </div>
        ) : image ? (
          <img src={image} alt={dx.name} className="derm-card-img"
            onError={e => { e.target.style.display="none"; }} />
        ) : (
          <div style={{ height:140, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            background:"rgba(14,37,68,.7)", gap:6 }}>
            <span style={{ fontSize:28 }}>🩺</span>
            <div style={{ display:"flex", gap:8 }}>
              <a href={dermUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-blue)", letterSpacing:.5,
                  background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.3)",
                  borderRadius:5, padding:"2px 8px", textDecoration:"none" }}>DermNet</a>
              <a href={aadUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-purple)", letterSpacing:.5,
                  background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.3)",
                  borderRadius:5, padding:"2px 8px", textDecoration:"none" }}>AAD</a>
            </div>
          </div>
        )}
        <div style={{ position:"absolute", top:8, left:8,
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:lc, background:"rgba(5,15,30,.85)", border:`1px solid ${lc}55`,
          borderRadius:5, padding:"2px 8px", letterSpacing:.8, textTransform:"uppercase" }}>
          {dx.likelihood?.replace(/_/g," ")}
        </div>
        {dx.referral_urgency && dx.referral_urgency!=="not_indicated" && (
          <div style={{ position:"absolute", top:8, right:8,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:rc, background:"rgba(5,15,30,.85)", border:`1px solid ${rc}55`,
            borderRadius:5, padding:"2px 8px", letterSpacing:.5 }}>
            {dx.referral_urgency} referral
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ padding:"10px 13px", cursor:"pointer",
        borderBottom:exp ? "1px solid rgba(42,79,122,.3)" : "none" }}
        onClick={() => setExp(!exp)}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:14, color:"var(--derm-txt)", lineHeight:1.2, marginBottom:3 }}>
              {dx.name}
            </div>
            {dx.icd10 && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--derm-txt4)", background:"rgba(42,79,122,.25)",
                borderRadius:4, padding:"1px 6px", letterSpacing:.5 }}>
                {dx.icd10}
              </span>
            )}
          </div>
          <span style={{ color:"var(--derm-txt4)", fontSize:10, flexShrink:0, paddingLeft:8 }}>
            {exp ? "▲" : "▼"}
          </span>
        </div>
        <div style={{ marginTop:8 }}>
          {(dx.key_features||[]).map((f, i) => (
            <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:3 }}>
              <span style={{ color:"var(--derm-teal)", fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"var(--derm-txt3)", lineHeight:1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded */}
      {exp && (
        <div style={{ padding:"10px 13px 13px" }}>
          {dx.distinguishing_features && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--derm-txt4)", letterSpacing:1.4, textTransform:"uppercase",
                marginBottom:4 }}>Distinguishing Features</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--derm-txt3)", lineHeight:1.55 }}>{dx.distinguishing_features}</div>
            </div>
          )}
          {dx.ed_management && (
            <div style={{ marginBottom:8, padding:"7px 10px", borderRadius:7,
              background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--derm-teal)", letterSpacing:1.4, textTransform:"uppercase",
                marginBottom:3 }}>ED Management</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--derm-txt2)", lineHeight:1.55 }}>{dx.ed_management}</div>
            </div>
          )}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:8 }}>
            <a href={dermUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding:"3px 10px", borderRadius:6,
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.3)",
                color:"var(--derm-blue)", textDecoration:"none", letterSpacing:.5 }}>
              DermNet NZ
            </a>
            <a href={aadUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding:"3px 10px", borderRadius:6,
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.3)",
                color:"var(--derm-purple)", textDecoration:"none", letterSpacing:.5 }}>
              AAD
            </a>
            <a href={`https://www.visualdx.com/visualdx/diagnosis?diagnosisId=0&moduleId=0&findingIdList=&ageId=0&sexId=0&skinToneId=0&q=${encodeURIComponent(dx.name)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding:"3px 10px", borderRadius:6,
                fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                background:"rgba(245,200,66,.1)", border:"1px solid rgba(245,200,66,.3)",
                color:"var(--derm-gold)", textDecoration:"none", letterSpacing:.5 }}>
              VisualDx
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DermatologyHub({
  embedded = false,
  demo, vitals, cc, pmhSelected, medications,
}) {
  const navigate = useNavigate();
  const [selections,  setSelections]  = useState({});
  const [freeText,    setFreeText]    = useState("");
  const [fitzpatrick, setFitzpatrick] = useState(null);
  const [activeCat,   setActiveCat]   = useState("morphology");
  const [result,      setResult]      = useState(null);
  const [images,      setImages]      = useState({});
  const [imgLoading,  setImgLoading]  = useState(new Set());
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState(null);
  const [copied,      setCopied]      = useState(false);
  const resultsRef = useRef(null);

  const patientCtx = useMemo(
    () => buildPatientCtx(demo, vitals, cc, pmhSelected, medications),
    [demo, vitals, cc, pmhSelected, medications]
  );

  useEffect(() => {
    const fn = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === "input" || tag === "textarea";
      if (inInput && (e.metaKey||e.ctrlKey) && e.key==="Enter") {
        e.preventDefault(); if (hasSelections && !busy) handleSubmit(); return;
      }
      if (inInput) return;
      const n = parseInt(e.key);
      if (!isNaN(n) && n>=1 && n<=CATS.length) {
        e.preventDefault();
        const cat = CATS[n-1];
        setActiveCat(cat.id);
        document.getElementById(`derm-cat-${cat.id}`)?.scrollIntoView({ behavior:"smooth", block:"nearest" });
        return;
      }
      if ((e.key==="c"||e.key==="C") && !e.ctrlKey && !e.metaKey && result) {
        e.preventDefault(); handleCopy();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const handleToggle = useCallback((catId, opt, multi) => {
    setSelections(prev => {
      if (multi) {
        const curr = prev[catId] || [];
        return { ...prev, [catId]: curr.includes(opt) ? curr.filter(x=>x!==opt) : [...curr, opt] };
      } else {
        return { ...prev, [catId]: prev[catId]===opt ? null : opt };
      }
    });
    setResult(null); setError(null);
  }, []);

  const hasSelections = useMemo(() =>
    CATS.some(cat => {
      const s = selections[cat.id];
      return Array.isArray(s) ? s.length>0 : Boolean(s);
    }) || Boolean(freeText?.trim()),
    [selections, freeText]
  );

  const showABCDE = useMemo(() => {
    const colors = selections.color || [];
    return colors.includes("Dark Brown / Black") || colors.includes("Multiple / Variegated colors") || Boolean(result?.abcde_concern);
  }, [selections.color, result]);

  const loadImages = useCallback(async (diagnoses) => {
    const loading = new Set(diagnoses.map(d => d.name));
    setImgLoading(loading);
    await Promise.all(diagnoses.map(async dx => {
      const url = await fetchWikiImage(dx.wiki_title || dx.name);
      setImages(prev => ({ ...prev, [dx.name]: url }));
      setImgLoading(prev => { const n = new Set(prev); n.delete(dx.name); return n; });
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasSelections || busy) return;
    setBusy(true); setError(null); setResult(null); setImages({});
    setImgLoading(new Set());
    try {
      const query = composeQuery(selections, freeText, fitzpatrick, patientCtx);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:3000,
          system: DERM_SYS,
          tools:[{ type:"web_search_20250305", name:"web_search" }],
          messages:[{ role:"user", content:query }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const fullText = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      const parsed = parseDermResponse(fullText);
      setResult(parsed);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
      if (parsed.differential?.length) loadImages(parsed.differential.slice(0, 6));
    } catch (e) {
      setError("Search error: " + (e.message||"Check connectivity"));
    } finally {
      setBusy(false);
    }
  }, [hasSelections, busy, selections, freeText, fitzpatrick, patientCtx, loadImages]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const lines = [
      "DERMATOLOGY DIFFERENTIAL DIAGNOSIS",
      new Date().toLocaleString(), "",
      ...(result.life_threatening?.length ? [`LIFE-THREATENING TO EXCLUDE: ${result.life_threatening.join(", ")}`, ""] : []),
      "DIFFERENTIAL:",
      ...(result.differential||[]).map((dx,i) =>
        `  ${i+1}. ${dx.name} (${dx.icd10||""}) [${(dx.likelihood||"").replace(/_/g," ")}]\n     Features: ${(dx.key_features||[]).join("; ")}\n     ED Mgmt: ${dx.ed_management||"N/A"}\n     Referral: ${dx.referral_urgency||"N/A"}`
      ),
      "",
      result.red_flags?.length    ? `RED FLAGS: ${result.red_flags.join(", ")}` : "",
      result.further_workup?.length ? `WORKUP: ${result.further_workup.join(", ")}` : "",
      result.pearls               ? `CLINICAL PEARL: ${result.pearls}` : "",
      result.sources_searched?.length ? `Sources: ${result.sources_searched.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [result]);

  const clearAll = useCallback(() => {
    setSelections({}); setFreeText(""); setFitzpatrick(null);
    setResult(null); setImages({}); setError(null); setImgLoading(new Set());
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : "var(--derm-bg)",
      minHeight:embedded ? "auto" : "100vh", color:"var(--derm-txt)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }} className="no-print">
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                borderRadius:8, padding:"5px 14px", color:"var(--derm-txt3)", cursor:"pointer" }}>
              Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,.9)", border:"1px solid rgba(42,79,122,.6)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--derm-teal)", letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:"var(--derm-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--derm-txt3)", letterSpacing:2 }}>DERM</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
            </div>
            <h1 className="derm-shim" style={{ fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(24px,4vw,40px)", fontWeight:900,
              letterSpacing:-.5, lineHeight:1.1, margin:0 }}>
              Dermatology Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--derm-txt4)", marginTop:4, marginBottom:0 }}>
              Characteristic Selection → AI Web Search (DermNet · AAD · VisualDx) → Differential + Clinical Images
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:15, color:"var(--derm-teal)" }}>Dermatology Hub</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt4)", letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)",
              borderRadius:4, padding:"2px 7px" }}>8 categories · Keys 1-8 · Cmd+Enter</span>
          </div>
        )}

        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          {["1-8 jump category","Cmd+Enter submit","C copy to chart"].map(h => (
            <span key={h} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt4)", background:"rgba(42,79,122,.15)",
              borderRadius:5, padding:"2px 8px", border:"1px solid rgba(42,79,122,.3)" }}>
              {h}
            </span>
          ))}
        </div>

        {patientCtx && (
          <div style={{ padding:"7px 11px", borderRadius:8, marginBottom:12,
            background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
              Patient Context
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--derm-txt4)", whiteSpace:"pre-wrap" }}>{patientCtx}</div>
          </div>
        )}

        <div style={{ display:"grid",
          gridTemplateColumns: result ? (embedded ? "1fr" : "380px 1fr") : "1fr",
          gap:16, alignItems:"start" }}>

          {/* Selector */}
          <div>
            <CharSelector
              selections={selections} onToggle={handleToggle}
              freeText={freeText} onFreeText={setFreeText}
              fitzpatrick={fitzpatrick} onFitzpatrick={setFitzpatrick}
              activeCat={activeCat} onCatNav={setActiveCat}
            />

            {showABCDE && !result && (
              <div style={{ marginTop:16 }}><ABCDEPanel /></div>
            )}

            <div style={{ marginTop:16, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <button onClick={handleSubmit} disabled={busy||!hasSelections}
                style={{ flex:1, padding:"11px 0", borderRadius:11, transition:"all .15s",
                  cursor:busy||!hasSelections ? "not-allowed" : "pointer",
                  border:`1px solid ${!hasSelections ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.55)"}`,
                  background:!hasSelections ? "rgba(42,79,122,.15)"
                    : busy ? "rgba(0,229,192,.06)"
                    : "linear-gradient(135deg,rgba(0,229,192,.16),rgba(0,229,192,.06))",
                  color:!hasSelections ? "var(--derm-txt4)" : "var(--derm-teal)",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13 }}>
                {busy
                  ? <span className="derm-pulse">Searching DermNet · AAD · VisualDx...</span>
                  : "Search Dermatology References [Cmd+Enter]"}
              </button>
              {hasSelections && (
                <button onClick={clearAll}
                  style={{ padding:"11px 14px", borderRadius:11, cursor:"pointer",
                    border:"1px solid var(--derm-bd)", background:"transparent",
                    color:"var(--derm-txt4)", fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>
                  Clear
                </button>
              )}
            </div>

            {error && (
              <div style={{ padding:"8px 11px", borderRadius:8, marginTop:8,
                background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--derm-coral)" }}>
                {error}
              </div>
            )}

            {!hasSelections && !busy && (
              <div style={{ marginTop:10, padding:"9px 12px", borderRadius:8,
                background:"rgba(42,79,122,.08)", border:"1px solid rgba(42,79,122,.25)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                  How to Use
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--derm-txt4)", lineHeight:1.65 }}>
                  Select clinical characteristics across any of the 8 categories.
                  Keys <b style={{ color:"var(--derm-teal)", fontFamily:"'JetBrains Mono',monospace" }}>1-8</b> jump to categories.
                  Arrow keys navigate options within a category.
                  The AI searches DermNet, AAD, and VisualDx for matching conditions
                  and returns a differential with clinical images.
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div ref={resultsRef}>
              {(showABCDE || result.abcde_concern) && <ABCDEPanel />}
              <LifeThreatAlert conditions={result.life_threatening} />

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--derm-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
                    Differential Diagnosis
                  </div>
                  {result.sources_searched?.length > 0 && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--derm-txt4)", letterSpacing:.5 }}>
                      Sources: {result.sources_searched.join(" · ")}
                    </div>
                  )}
                </div>
                <button onClick={handleCopy}
                  style={{ padding:"5px 13px", borderRadius:7, cursor:"pointer", transition:"all .15s",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "var(--derm-bd)"}`,
                    background:copied ? "rgba(61,255,160,.1)" : "transparent",
                    color:copied ? "var(--derm-green)" : "var(--derm-txt3)" }}>
                  {copied ? "Copied [C]" : "Copy to Chart [C]"}
                </button>
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12, marginBottom:14 }}>
                {(result.differential||[]).map((dx, i) => (
                  <DiagnosisCard key={dx.name+i} dx={dx}
                    image={images[dx.name]}
                    imgLoading={imgLoading.has(dx.name)} />
                ))}
              </div>

              {(result.red_flags?.length > 0 || result.further_workup?.length > 0 || result.pearls) && (
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
                  {result.red_flags?.length > 0 && (
                    <div style={{ padding:"10px 12px", borderRadius:9,
                      background:"rgba(255,68,68,.06)", border:"1px solid rgba(255,68,68,.25)" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
                        Red Flags
                      </div>
                      {result.red_flags.map((f, i) => (
                        <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:3 }}>
                          <span style={{ color:"var(--derm-red)", fontSize:7, marginTop:3 }}>▸</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                            color:"var(--derm-coral)", lineHeight:1.45 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.further_workup?.length > 0 && (
                    <div style={{ padding:"10px 12px", borderRadius:9,
                      background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.25)" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--derm-blue)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
                        Further Workup
                      </div>
                      {result.further_workup.map((w, i) => (
                        <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:3 }}>
                          <span style={{ color:"var(--derm-blue)", fontSize:7, marginTop:3 }}>▸</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                            color:"var(--derm-txt3)", lineHeight:1.45 }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.pearls && (
                    <div style={{ padding:"10px 12px", borderRadius:9,
                      background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.25)" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--derm-purple)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                        Clinical Pearl
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                        color:"var(--derm-txt2)", lineHeight:1.55 }}>{result.pearls}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--derm-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA DERMATOLOGY HUB · AI CLINICAL DECISION SUPPORT ·
            NOT A SUBSTITUTE FOR DERMATOLOGIST EVALUATION · ALWAYS CONFIRM WITH IN-PERSON EXAMINATION
          </div>
        )}
      </div>
    </div>
  );
}