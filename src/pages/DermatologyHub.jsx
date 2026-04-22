// DermatologyHub.jsx  v2
// Evidence-based upgrades (AAD / ACEP / Canadian ED guidelines / international literature):
//   1. LRINEC calculator with cannot-rule-out-NF warning (2024 Canadian ED guidelines)
//   2. Skin of color differential modifier — Fitzpatrick IV-VI (Australasian J Derm 2024)
//   3. BSA calculator + Nikolsky guide for SJS/TEN/SSSS differentiation
//   4. High-risk drug list for SJS/TEN/DRESS with timeline discriminator
//   5. NF 2024 antibiotic protocol (pip-tazo + clindamycin + vancomycin)
//   6. Topical steroid FTU + potency prescribing guide (AAD/AAAAI 2023)
//   7. Nodular + amelanotic melanoma alerts (AAD, European 2024 guidelines)
//   8. RMSF trigger when petechiae + fever + outdoor exposure
//   9. AAD-aligned referral urgency framework
//  10. Post-inflammatory hyperpigmentation counseling flag (Fitzpatrick III-VI)

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── STYLE INJECTION ──────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("derm2-css")) return;
  const s = document.createElement("style"); s.id = "derm2-css";
  s.textContent = `
    :root{
      --derm-bg:#050f1e;--derm-panel:#081628;--derm-card:#0b1e36;
      --derm-txt:#f2f7ff;--derm-txt2:#b8d4f0;--derm-txt3:#82aece;--derm-txt4:#6b9ec8;
      --derm-teal:#00e5c0;--derm-gold:#f5c842;--derm-coral:#ff6b6b;--derm-blue:#3b9eff;
      --derm-orange:#ff9f43;--derm-purple:#9b6dff;--derm-green:#3dffa0;--derm-red:#ff4444;
      --derm-bd:rgba(42,79,122,0.4);--derm-up:rgba(14,37,68,0.75);
    }
    @keyframes d2fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .d2-fade{animation:d2fade .2s ease both}
    @keyframes d2shim{0%{background-position:-200% center}100%{background-position:200% center}}
    .d2-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#00e5c0 50%,#3b9eff 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:d2shim 6s linear infinite
    }
    @keyframes d2pulse{0%,100%{opacity:.6}50%{opacity:1}}
    .d2-pulse{animation:d2pulse 1.4s ease-in-out infinite}
    .d2-opt{
      padding:5px 11px;border-radius:7px;cursor:pointer;transition:all .13s;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
      background:rgba(14,37,68,.6);border:1px solid rgba(42,79,122,.3);
      color:var(--derm-txt4);line-height:1.3;white-space:nowrap
    }
    .d2-opt.on{border-color:rgba(0,229,192,.5);background:rgba(0,229,192,.1);color:var(--derm-teal);font-weight:700}
    .d2-opt:focus{outline:2px solid var(--derm-teal);outline-offset:1px}
    .d2-opt:hover:not(.on){border-color:rgba(42,79,122,.6);color:var(--derm-txt3)}
    .d2-ti{
      background:var(--derm-up);border:1px solid var(--derm-bd);border-radius:8px;
      padding:8px 10px;color:var(--derm-txt);font-family:'DM Sans',sans-serif;
      font-size:11px;outline:none;width:100%;box-sizing:border-box;
      resize:vertical;transition:border-color .15s;line-height:1.6
    }
    .d2-ti:focus{border-color:rgba(0,229,192,.5)}
    .d2-num{
      background:var(--derm-up);border:1px solid var(--derm-bd);border-radius:7px;
      padding:6px 10px;color:var(--derm-txt);font-family:'JetBrains Mono',monospace;
      font-size:12px;outline:none;width:100%;box-sizing:border-box;transition:border-color .15s
    }
    .d2-num:focus{border-color:rgba(0,229,192,.5)}
    .d2-card-img{width:100%;height:140px;object-fit:cover;display:block;background:#000}
    .d2-tool-btn{
      padding:5px 12px;border-radius:7px;cursor:pointer;transition:all .13s;
      font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;
      text-transform:uppercase;background:transparent;border:1px solid var(--derm-bd);
      color:var(--derm-txt4)
    }
    .d2-tool-btn:hover{border-color:rgba(42,79,122,.7);color:var(--derm-txt3)}
    .d2-tool-btn.active{background:rgba(0,229,192,.09);border-color:rgba(0,229,192,.4);color:var(--derm-teal)}
    @media print{.no-print{display:none!important}body{background:#fff!important;color:#111!important}}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("derm2-fonts")) {
    const l = document.createElement("link"); l.id = "derm2-fonts"; l.rel = "stylesheet";
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
    "White / Hypopigmented","Depigmented — stark white","Yellow",
    "Violaceous / Dusky — may indicate erythema in darker skin",
    "Purple / Violaceous — non-inflammatory","Blue-gray",
    "Skin-colored","Multiple / Variegated colors",
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
  { n:6, label:"VI",  desc:"Dark brown — never burns",    color:"#3a1a08" },
];

// Rec 3 — BSA regions
const BSA_REGIONS = [
  { id:"head",       label:"Head / Neck",       pct:9  },
  { id:"ant_trunk",  label:"Anterior Trunk",    pct:18 },
  { id:"post_trunk", label:"Posterior Trunk",   pct:18 },
  { id:"r_arm",      label:"Right Arm",         pct:9  },
  { id:"l_arm",      label:"Left Arm",          pct:9  },
  { id:"r_leg",      label:"Right Leg",         pct:18 },
  { id:"l_leg",      label:"Left Leg",          pct:18 },
  { id:"perineum",   label:"Perineum",          pct:1  },
];

// Rec 6 — Topical steroid guide (AAD/AAAAI 2023)
const TCS_GUIDE = [
  { region:"Face / Eyelids",    potency:"LOW only",    max:"2 weeks", agents:"Hydrocortisone 1-2.5%, Desonide 0.05%",       caveat:"Never use high-potency on face" },
  { region:"Scalp",             potency:"Mid-High",    max:"4 weeks", agents:"Betamethasone valerate lotion, Fluocinonide",   caveat:"Use lotion/foam vehicle" },
  { region:"Genitalia / Folds", potency:"LOW only",    max:"2 weeks", agents:"Hydrocortisone 1-2.5%, Desonide",              caveat:"High absorption — use minimally" },
  { region:"Trunk / Limbs",     potency:"Mid",         max:"4 weeks", agents:"Triamcinolone 0.1%, Mometasone 0.1%",          caveat:"1.5-2 FTU per region" },
  { region:"Hands / Feet",      potency:"Mid-High",    max:"4 weeks", agents:"Betamethasone dipropionate, Fluocinonide",      caveat:"Thick stratum corneum" },
  { region:"Palms / Soles",     potency:"HIGH ok",     max:"4 weeks", agents:"Clobetasol 0.05%, Halobetasol 0.05%",          caveat:"Max potency acceptable here" },
  { region:"Children <12",      potency:"LOW only",    max:"1-2 wks", agents:"Hydrocortisone 1%, Desonide (short courses)",   caveat:"Avoid high-potency in children" },
];

// Rec 4 — Drug risk panels for SJS/TEN/DRESS
const DRUG_RISKS = {
  sjsten: [
    { drug:"Sulfonamides (TMP-SMX)",   risk:"Very High" },
    { drug:"Allopurinol",              risk:"Very High" },
    { drug:"Carbamazepine",            risk:"Very High" },
    { drug:"Lamotrigine",              risk:"Very High" },
    { drug:"Phenytoin / Phenobarbital",risk:"High" },
    { drug:"Nevirapine (HIV meds)",    risk:"High" },
    { drug:"Oxicam NSAIDs",            risk:"High" },
    { drug:"Penicillins / Cephalosporins", risk:"Moderate" },
  ],
  dress: [
    { drug:"Minocycline (esp. FST V-VI)",  risk:"Very High" },
    { drug:"Allopurinol",                  risk:"Very High" },
    { drug:"Carbamazepine / Phenytoin",    risk:"Very High" },
    { drug:"Vancomycin",                   risk:"High" },
    { drug:"Sulfasalazine / Dapsone",      risk:"High" },
    { drug:"Lamotrigine",                  risk:"High" },
    { drug:"Azathioprine",                 risk:"Moderate" },
  ],
};

// ─── AI SYSTEM PROMPT (Recs 2, 7, 8, 9, 10) ──────────────────────────────────
const DERM_SYS = `You are a board-certified dermatologist providing clinical decision support for emergency physicians. Using web search, search DermNet NZ (dermnet.com), AAD (aad.org), VisualDx (visualdx.com), and AOCD (aocd.org) for conditions matching the clinical characteristics provided.

SKIN OF COLOR (Rec 2): If Fitzpatrick type IV-VI is specified, adjust presentations accordingly. Erythema frequently appears VIOLACEOUS or dusky rather than red. Standard erythema-based criteria underestimate severity. Post-inflammatory hyperpigmentation (PIH) may mask active inflammation. DRESS is significantly more common with minocycline in FST V-VI. Autoimmune conditions (lupus, dermatomyositis) are 2-3x more prevalent and severe. Explicitly note these variations in key_features.

LIFE-THREATENING EMERGENCIES — always evaluate and flag any that apply:
TEN (>30% BSA, mortality 25-35%), SJS (<10% BSA, mortality 1-5%), overlap SJS/TEN (10-30%), DRESS (3-8 weeks post-drug, eosinophilia, systemic involvement), necrotizing fasciitis (pain disproportionate to exam — do NOT rely on LRINEC to rule out), meningococcemia (non-blanching petechiae, fever, sepsis), RMSF (peripheral petechiae + fever + tick/outdoor exposure — 60-75% initially misdiagnosed, doxycycline empirically), SSSS (Nikolsky+, mucous membranes SPARED unlike SJS/TEN), erythroderma (>90% BSA), pemphigus vulgaris (flaccid bullae, Nikolsky+, mucous membrane involvement).

MELANOMA ALERTS (Rec 7): Set abcde_concern=true for any suspicious pigmented lesion. CRITICAL: Nodular melanoma does NOT follow ABCDE — may be pink, red, or skin-colored, rapidly growing, frequently bleeding. Amelanotic melanoma most common on ear, nose, face — easily mistaken for pyogenic granuloma or BCC. Any rapidly growing new nodule warrants urgent evaluation. Dermoscopy recommended before ED biopsy per AAD guidelines.

RMSF (Rec 8): If petechiae/purpura + fever + recent outdoor/tick exposure are all present, flag Rocky Mountain spotted fever prominently in life_threatening. Include doxycycline as immediate treatment regardless of age. Note 60-75% given alternate diagnosis initially.

REFERRAL URGENCY STANDARDS (Rec 9 — AAD-aligned):
- emergent: TEN, NF, SJS with mucosal involvement, DRESS with organ failure, meningococcemia, RMSF, erythroderma with hemodynamic instability
- urgent: SJS <10% without organ failure, suspected pemphigus with blistering, melanoma with bleeding or ulceration — within 24-48h
- soon: Atypical pigmented lesions with multiple ABCDE features — within 2 weeks
- routine: Stable chronic eczema/psoriasis/contact dermatitis — primary care appropriate

PIH FLAG (Rec 10): If FST III-VI and inflammatory condition is in differential, include pih_note field: brief counseling note that PIH is more prominent and persistent in darker skin types, treating underlying inflammation is prevention.

Return ONLY valid JSON, no markdown fences:
{
  "differential":[{"name","icd10","likelihood","key_features","distinguishing_features","ed_management","referral_urgency","dermnet_url","aad_url","wiki_title"}],
  "life_threatening":[],"red_flags":[],"abcde_concern":false,
  "pearls":"","further_workup":[],"sources_searched":[],
  "pih_note":""
}`;

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
  if (freeText?.trim()) lines.push(`Additional notes: ${freeText.trim()}`);
  lines.push("\nSearch DermNet NZ, AAD, VisualDx for conditions matching these characteristics. Return structured differential JSON.");
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

// Rec 1 — LRINEC score calculation
function calcLRINEC(v) {
  const crp = parseFloat(v.crp)||0, wbc = parseFloat(v.wbc)||0;
  const hgb = parseFloat(v.hgb)||0, na  = parseFloat(v.na) ||0;
  const cr  = parseFloat(v.cr) ||0, glu = parseFloat(v.glu)||0;
  let score = 0;
  if (crp >= 150) score += 4;
  if (wbc > 25) score += 2; else if (wbc >= 15) score += 1;
  if (hgb < 11) score += 2; else if (hgb <= 13.5) score += 1;
  if (na < 135) score += 2;
  if (cr > 1.6) score += 2;
  if (glu > 180) score += 1;
  return score;
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
            <button key={fz.n} className={`d2-opt${fitzpatrick===fz.n?" on":""}`}
              onClick={() => onFitzpatrick(fitzpatrick===fz.n ? null : fz.n)} title={fz.desc}
              style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:7 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:fz.color,
                border:"1px solid rgba(255,255,255,.2)", flexShrink:0 }} />
              <span>{fz.label}</span>
            </button>
          ))}
        </div>
        {fitzpatrick >= 4 && (
          <div style={{ marginTop:6, padding:"5px 9px", borderRadius:6,
            background:"rgba(155,109,255,.08)", border:"1px solid rgba(155,109,255,.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-purple)", lineHeight:1.5 }}>
            FST {fitzpatrick}: Erythema may appear violaceous/dark purple. DRESS more common with minocycline. PIH more prominent.
          </div>
        )}
      </div>

      {/* Categories */}
      {CATS.map((cat, ci) => {
        const sel = selections[cat.id] || (cat.multi ? [] : null);
        const count = Array.isArray(sel) ? sel.length : (sel ? 1 : 0);
        const isActive = activeCat === cat.id;
        return (
          <div key={cat.id} id={`dc-${cat.id}`}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7, cursor:"pointer" }}
              onClick={() => onCatNav(cat.id)}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:isActive ? "var(--derm-teal)" : "var(--derm-txt4)",
                background:"rgba(42,79,122,.3)", borderRadius:4, padding:"1px 6px",
                border:`1px solid ${isActive ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.4)"}` }}>
                {cat.n}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:isActive ? "var(--derm-teal)" : "var(--derm-txt4)",
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
                    className={`d2-opt${on?" on":""}`}
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
        <textarea className="d2-ti" value={freeText} rows={3} onChange={e => onFreeText(e.target.value)}
          placeholder="Lesion size, duration, precipitants, associated symptoms, exposures..." />
      </div>
    </div>
  );
}

// ─── Rec 5 — LIFE-THREATENING ALERT (enhanced with NF protocol + RMSF) ────────
function LifeThreatAlert({ conditions, rmsfTrigger }) {
  if (!conditions?.length && !rmsfTrigger) return null;
  return (
    <div className="d2-fade" style={{ borderRadius:10, marginBottom:12,
      background:"rgba(255,68,68,.13)", border:"2px solid rgba(255,68,68,.55)" }}>
      <div style={{ padding:"10px 14px 6px" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          Exclude These Life-Threatening Conditions
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:7 }}>
          {conditions?.map((c, i) => (
            <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
              color:"var(--derm-txt2)", background:"rgba(255,68,68,.1)",
              border:"1px solid rgba(255,68,68,.3)", borderRadius:6, padding:"3px 10px" }}>{c}</span>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-coral)",
          lineHeight:1.55, marginBottom:8 }}>
          Check: mucosal surfaces · Nikolsky sign (lateral pressure normal skin) · skin tenderness ·
          extent/BSA involvement. If TEN/SJS: stop offending drug immediately, emergent derm + ophthalmology,
          ICU/burn unit.
        </div>
      </div>
      {/* Rec 5 — NF antibiotic protocol */}
      <div style={{ borderTop:"1px solid rgba(255,68,68,.3)", padding:"8px 14px 6px",
        background:"rgba(5,15,30,.3)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--derm-gold)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
          NF Antibiotic Protocol — 2024 Canadian ED Guidelines (Triple Therapy)
        </div>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:5 }}>
          {["Piperacillin-tazobactam","Clindamycin","Vancomycin"].map(drug => (
            <span key={drug} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
              color:"var(--derm-gold)", background:"rgba(245,200,66,.1)",
              border:"1px solid rgba(245,200,66,.3)", borderRadius:6, padding:"3px 10px" }}>{drug}</span>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-txt4)",
          lineHeight:1.5 }}>
          Do NOT use LRINEC score to rule out NF (sensitivity 36-77% — 2024 guidelines). CT has 88.5% sensitivity
          but do NOT delay surgical consult for imaging. Clinical suspicion = immediate surgical referral.
        </div>
      </div>
      {/* Rec 8 — RMSF trigger */}
      {rmsfTrigger && (
        <div style={{ borderTop:"1px solid rgba(255,68,68,.3)", padding:"8px 14px",
          background:"rgba(255,68,68,.06)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
            RMSF Alert — 60-75% Misdiagnosed at First Visit
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--derm-txt2)",
            lineHeight:1.6 }}>
            Classic triad: fever + headache + petechiae/purpura starting at wrists/ankles spreading centrally.
            Mortality 5-10% even with treatment; 20-25% without doxycycline.
            Treat empirically — do NOT wait for serology.
            <b style={{ color:"var(--derm-gold)" }}> Doxycycline 100mg IV/PO BID — first-line in all ages.</b>
            Also consider meningococcemia (ceftriaxone), ehrlichiosis/anaplasmosis.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rec 7 — ABCDE PANEL (enhanced: nodular + amelanotic) ────────────────────
function ABCDEPanel() {
  return (
    <div className="d2-fade" style={{ borderRadius:9, marginBottom:12,
      background:"rgba(155,109,255,.08)", border:"1px solid rgba(155,109,255,.35)" }}>
      <div style={{ padding:"10px 13px 6px" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--derm-purple)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          ABCDE Melanoma Checklist — Pigmented Lesion Alert
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:10 }}>
          {[
            { l:"A", t:"Asymmetry",  d:"One half doesn't match the other" },
            { l:"B", t:"Border",     d:"Irregular, ragged, or blurred edges" },
            { l:"C", t:"Color",      d:"Multiple shades — tan/brown/black/blue/red/white" },
            { l:"D", t:"Diameter",   d:">6mm (pencil eraser)" },
            { l:"E", t:"Evolution",  d:"Any CHANGE in size/shape/color or new bleeding — most critical criterion" },
          ].map(item => (
            <div key={item.l} style={{ padding:"7px 9px", borderRadius:7, textAlign:"center",
              background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.2)",
              borderTop:item.l==="E" ? "2px solid rgba(155,109,255,.6)" : undefined }}>
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
      {/* Nodular + amelanotic alert */}
      <div style={{ borderTop:"1px solid rgba(155,109,255,.25)", padding:"8px 13px",
        background:"rgba(5,15,30,.25)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--derm-orange)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
          ABCDE-Negative Melanoma Variants — Frequently Missed
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div style={{ padding:"6px 9px", borderRadius:7,
            background:"rgba(255,159,67,.08)", border:"1px solid rgba(255,159,67,.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-orange)", marginBottom:3 }}>Nodular Melanoma</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:"var(--derm-txt3)", lineHeight:1.5 }}>
              Does NOT follow ABCDE. Pink, red, or skin-colored rapidly growing nodule. Often bleeds.
              Common on trunk/head/neck. Any new fast-growing nodule in adult = urgent evaluation.
            </div>
          </div>
          <div style={{ padding:"6px 9px", borderRadius:7,
            background:"rgba(255,159,67,.08)", border:"1px solid rgba(255,159,67,.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-orange)", marginBottom:3 }}>Amelanotic Melanoma</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:"var(--derm-txt3)", lineHeight:1.5 }}>
              No dark pigment. Mimics pyogenic granuloma, BCC, or benign lesion. Especially
              common on ear, nose, face. Dermoscopy recommended per AAD before ED biopsy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DIAGNOSIS CARD ───────────────────────────────────────────────────────────
function DiagnosisCard({ dx, image, imgLoading }) {
  const [exp, setExp] = useState(false);
  const lc = dx.likelihood==="most_likely" ? "#ff9f43" : dx.likelihood==="likely" ? "#f5c842"
    : dx.likelihood==="possible" ? "#3b9eff" : "#6b9ec8";
  const rc = dx.referral_urgency==="emergent" ? "var(--derm-red)"
    : dx.referral_urgency==="urgent" ? "var(--derm-orange)"
    : dx.referral_urgency==="soon" ? "var(--derm-gold)" : "var(--derm-txt4)";
  const dermUrl = dx.dermnet_url || `https://dermnet.com/search?q=${encodeURIComponent(dx.name)}`;
  const aadUrl  = dx.aad_url    || `https://www.aad.org/search#q=${encodeURIComponent(dx.name)}`;
  return (
    <div className="d2-fade" style={{ borderRadius:11, overflow:"hidden",
      background:"rgba(8,22,40,.75)", border:`1px solid ${lc}33` }}>
      {/* Image */}
      <div style={{ position:"relative", background:"#000", height:140 }}>
        {imgLoading ? (
          <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(14,37,68,.8)" }}>
            <span className="d2-pulse" style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:"var(--derm-txt4)" }}>loading image...</span>
          </div>
        ) : image ? (
          <img src={image} alt={dx.name} className="d2-card-img"
            onError={e => { e.target.style.display="none"; }} />
        ) : (
          <div style={{ height:140, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            background:"rgba(14,37,68,.7)", gap:6 }}>
            <span style={{ fontSize:28 }}>🩺</span>
            <div style={{ display:"flex", gap:8 }}>
              <a href={dermUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-blue)", background:"rgba(59,158,255,.1)",
                  border:"1px solid rgba(59,158,255,.3)", borderRadius:5,
                  padding:"2px 8px", textDecoration:"none" }}>DermNet</a>
              <a href={aadUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--derm-purple)", background:"rgba(155,109,255,.1)",
                  border:"1px solid rgba(155,109,255,.3)", borderRadius:5,
                  padding:"2px 8px", textDecoration:"none" }}>AAD</a>
            </div>
          </div>
        )}
        <div style={{ position:"absolute", top:8, left:8,
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:lc,
          background:"rgba(5,15,30,.85)", border:`1px solid ${lc}55`,
          borderRadius:5, padding:"2px 8px", letterSpacing:.8, textTransform:"uppercase" }}>
          {dx.likelihood?.replace(/_/g," ")}
        </div>
        {dx.referral_urgency && dx.referral_urgency!=="not_indicated" && (
          <div style={{ position:"absolute", top:8, right:8,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:rc,
            background:"rgba(5,15,30,.85)", border:`1px solid ${rc}55`,
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
                borderRadius:4, padding:"1px 6px", letterSpacing:.5 }}>{dx.icd10}</span>
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
      {exp && (
        <div style={{ padding:"10px 13px 13px" }}>
          {dx.distinguishing_features && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--derm-txt4)", letterSpacing:1.4, textTransform:"uppercase", marginBottom:4 }}>
                Distinguishing Features</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--derm-txt3)", lineHeight:1.55 }}>{dx.distinguishing_features}</div>
            </div>
          )}
          {dx.ed_management && (
            <div style={{ marginBottom:8, padding:"7px 10px", borderRadius:7,
              background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--derm-teal)", letterSpacing:1.4, textTransform:"uppercase", marginBottom:3 }}>
                ED Management</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--derm-txt2)", lineHeight:1.55 }}>{dx.ed_management}</div>
            </div>
          )}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:8 }}>
            {[["DermNet NZ",dermUrl,"var(--derm-blue)"],
              ["AAD",aadUrl,"var(--derm-purple)"],
              ["VisualDx",`https://www.visualdx.com/visualdx/diagnosis?q=${encodeURIComponent(dx.name)}`,"var(--derm-gold)"]
            ].map(([lbl,href,c]) => (
              <a key={lbl} href={href} target="_blank" rel="noopener noreferrer"
                style={{ padding:"3px 10px", borderRadius:6,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  background:`${c.replace("var(--derm-","").replace(")","") === "gold" ? "rgba(245,200,66,.1)" : c.includes("blue") ? "rgba(59,158,255,.1)" : "rgba(155,109,255,.1)"}`,
                  border:`1px solid ${c.includes("gold") ? "rgba(245,200,66,.3)" : c.includes("blue") ? "rgba(59,158,255,.3)" : "rgba(155,109,255,.3)"}`,
                  color:c, textDecoration:"none", letterSpacing:.5 }}>{lbl}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rec 1 — LRINEC CALCULATOR ────────────────────────────────────────────────
function LRINECCalculator({ vals, onChange }) {
  const fields = [
    { k:"crp", label:"CRP (mg/L)",      hint:"≥150 = +4 pts" },
    { k:"wbc", label:"WBC (K/uL)",      hint:"15-25 = +1, >25 = +2" },
    { k:"hgb", label:"Hgb (g/dL)",      hint:"11-13.5 = +1, <11 = +2" },
    { k:"na",  label:"Sodium (mEq/L)",  hint:"<135 = +2 pts" },
    { k:"cr",  label:"Creatinine (mg/dL)", hint:">1.6 = +2 pts" },
    { k:"glu", label:"Glucose (mg/dL)", hint:">180 = +1 pt" },
  ];
  const score = calcLRINEC(vals);
  const tier = score < 6 ? ["Low risk","var(--derm-teal)"] : score <= 7 ? ["Intermediate","var(--derm-gold)"] : ["High risk","var(--derm-red)"];
  return (
    <div style={{ padding:"10px 12px", borderRadius:9,
      background:"rgba(8,22,40,.7)", border:"1px solid rgba(42,79,122,.4)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-gold)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
        LRINEC Calculator — Necrotizing Fasciitis Risk
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        {fields.map(f => (
          <div key={f.k}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt4)", marginBottom:3 }}>
              {f.label} <span style={{ color:"rgba(107,158,200,.6)", fontSize:7 }}>({f.hint})</span>
            </div>
            <input type="number" className="d2-num" value={vals[f.k]}
              onChange={e => onChange({ ...vals, [f.k]:e.target.value })}
              placeholder="0" />
          </div>
        ))}
      </div>
      {/* Score display */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
        borderRadius:8, background:"rgba(14,37,68,.6)", border:`1px solid ${tier[1]}44` }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
          fontSize:28, color:tier[1], lineHeight:1 }}>{score}</div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:tier[1], letterSpacing:.8 }}>{tier[0]}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:"var(--derm-txt4)", lineHeight:1.4 }}>
            {score < 6 ? "50-75% probability" : score <= 7 ? "50-75% probability" : ">75% probability"}
          </div>
        </div>
      </div>
      <div style={{ marginTop:8, padding:"7px 9px", borderRadius:7,
        background:"rgba(255,68,68,.09)", border:"1px solid rgba(255,68,68,.3)",
        fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-coral)", lineHeight:1.55 }}>
        LRINEC sensitivity 36-77% — a LOW score does NOT rule out NF (2024 Canadian ED guidelines,
        multiple systematic reviews). Clinical suspicion drives immediate surgical consultation.
        Do not delay OR for imaging.
      </div>
    </div>
  );
}

// ─── Rec 3 — BSA CALCULATOR ───────────────────────────────────────────────────
function BSACalculator({ selected, onToggle }) {
  const totalBSA = Array.from(selected).reduce((sum, id) => {
    const r = BSA_REGIONS.find(x => x.id===id); return sum + (r?.pct||0);
  }, 0);
  const tier = totalBSA < 10 ? ["SJS","var(--derm-gold)","Mortality 1-5%","< 10% BSA"]
    : totalBSA <= 30 ? ["SJS/TEN Overlap","var(--derm-orange)","Intermediate severity","10-30% BSA"]
    : ["TEN","var(--derm-red)","Mortality 25-35%","> 30% BSA"];
  return (
    <div style={{ padding:"10px 12px", borderRadius:9,
      background:"rgba(8,22,40,.7)", border:"1px solid rgba(255,68,68,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
        BSA Calculator — SJS / TEN Differentiation
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {BSA_REGIONS.map(r => (
          <button key={r.id} className={`d2-opt${selected.has(r.id)?" on":""}`}
            onClick={() => { const s=new Set(selected); s.has(r.id)?s.delete(r.id):s.add(r.id); onToggle(s); }}>
            {r.label} ({r.pct}%)
          </button>
        ))}
      </div>
      {totalBSA > 0 && (
        <div style={{ padding:"8px 10px", borderRadius:8,
          background:`${tier[1].replace("var(--derm-","").replace(")","") === "red" ? "rgba(255,68,68,.12)" : tier[1].includes("orange") ? "rgba(255,159,67,.1)" : "rgba(245,200,66,.09)"}`,
          border:`1px solid ${tier[1].replace("var","").replace("(","").replace(")","") === "--derm-red" ? "rgba(255,68,68,.45)" : tier[1].includes("orange") ? "rgba(255,159,67,.4)" : "rgba(245,200,66,.3)"}`,
          display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
            fontSize:24, color:tier[1], lineHeight:1 }}>{totalBSA}%</div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:tier[1], fontWeight:700 }}>{tier[0]}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:"var(--derm-txt4)" }}>{tier[2]} · {tier[3]}</div>
          </div>
        </div>
      )}
      <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:"var(--derm-txt4)", lineHeight:1.5 }}>
        Also check: Nikolsky sign (lateral pressure normal skin) · Mucous membrane involvement ·
        SSSS = mucous membranes spared (unlike SJS/TEN) · DRESS = eosinophilia + systemic involvement
      </div>
    </div>
  );
}

// ─── Rec 4 — DRUG RISK PANEL ──────────────────────────────────────────────────
function DrugRiskPanel() {
  const riskColor = r => r==="Very High" ? "var(--derm-red)" : r==="High" ? "var(--derm-coral)" : "var(--derm-gold)";
  return (
    <div style={{ padding:"10px 12px", borderRadius:9,
      background:"rgba(255,68,68,.07)", border:"1px solid rgba(255,68,68,.35)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-coral)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
        High-Risk Drugs — New Medication Detected
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-txt4)",
        marginBottom:8, lineHeight:1.5 }}>
        SJS/TEN onset: <b style={{ color:"var(--derm-txt3)" }}>1-3 weeks</b> after starting drug.
        DRESS onset: <b style={{ color:"var(--derm-txt3)" }}>3-8 weeks</b>.
        Stop ALL non-essential medications if drug reaction suspected.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[["SJS / TEN", DRUG_RISKS.sjsten],["DRESS", DRUG_RISKS.dress]].map(([lbl,list]) => (
          <div key={lbl}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-orange)", letterSpacing:1, textTransform:"uppercase",
              marginBottom:5 }}>{lbl}</div>
            {list.map(d => (
              <div key={d.drug} style={{ display:"flex", alignItems:"baseline",
                justifyContent:"space-between", marginBottom:3, gap:6 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--derm-txt3)", flex:1, lineHeight:1.3 }}>{d.drug}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:riskColor(d.risk), letterSpacing:.5, flexShrink:0 }}>{d.risk}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rec 6 — TOPICAL STEROID GUIDE ───────────────────────────────────────────
function TopicalSteroidGuide() {
  return (
    <div style={{ padding:"10px 12px", borderRadius:9,
      background:"rgba(0,229,192,.05)", border:"1px solid rgba(0,229,192,.3)" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:"var(--derm-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
        Topical Corticosteroid Prescribing Guide — AAD/AAAAI 2023
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--derm-txt4)",
        marginBottom:8, lineHeight:1.5 }}>
        1 Fingertip Unit (FTU) = 0.5g = covers 2% BSA (both adult hands, fingers together).
        Systemic HPA suppression risk: high-potency on &gt;20% BSA or &gt;4 weeks.
        Topical steroid withdrawal (TSW): do not abruptly stop chronic high-potency TCS.
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {TCS_GUIDE.map(row => (
          <div key={row.region} style={{ display:"grid",
            gridTemplateColumns:"1fr 80px 90px 1fr", gap:7, alignItems:"center",
            padding:"5px 8px", borderRadius:6, background:"rgba(14,37,68,.4)",
            border:"1px solid rgba(42,79,122,.25)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--derm-txt2)", fontWeight:600 }}>{row.region}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color: row.potency.includes("LOW") ? "var(--derm-teal)"
                : row.potency.includes("HIGH") ? "var(--derm-red)" : "var(--derm-gold)",
              letterSpacing:.5 }}>{row.potency}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt4)" }}>Max: {row.max}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
              color:"var(--derm-txt4)", lineHeight:1.35 }}>
              {row.agents}
              {row.caveat && <span style={{ color:"var(--derm-coral)" }}> · {row.caveat}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DermatologyHub({
  embedded = false,
  demo, vitals, cc, pmhSelected, medications,
}) {
  const navigate = useNavigate();
  const [selections,   setSelections]   = useState({});
  const [freeText,     setFreeText]     = useState("");
  const [fitzpatrick,  setFitzpatrick]  = useState(null);
  const [activeCat,    setActiveCat]    = useState("morphology");
  const [result,       setResult]       = useState(null);
  const [images,       setImages]       = useState({});
  const [imgLoading,   setImgLoading]   = useState(new Set());
  const [busy,         setBusy]         = useState(false);
  const [error,        setError]        = useState(null);
  const [copied,       setCopied]       = useState(false);
  // Tool toggles
  const [showLRINEC,   setShowLRINEC]   = useState(false);
  const [showBSA,      setShowBSA]      = useState(false);
  const [showTCS,      setShowTCS]      = useState(false);
  const [lrinecVals,   setLrinecVals]   = useState({ crp:"",wbc:"",hgb:"",na:"",cr:"",glu:"" });
  const [bsaSelected,  setBsaSelected]  = useState(new Set());
  const resultsRef = useRef(null);

  const patientCtx = useMemo(
    () => buildPatientCtx(demo, vitals, cc, pmhSelected, medications),
    [demo, vitals, cc, pmhSelected, medications]
  );

  // Rec 2 — skin of color awareness
  const socWarning = fitzpatrick >= 4;

  // Rec 4 — drug risk panel auto-show
  const showDrugPanel = useMemo(() =>
    (selections.patient||[]).some(p => p.includes("medication")),
    [selections.patient]
  );

  // Rec 8 — RMSF trigger
  const rmsfTrigger = useMemo(() => {
    const morph = selections.morphology || [];
    const symp  = selections.symptoms   || [];
    const pt    = selections.patient    || [];
    return morph.some(m => m.includes("Petechiae")) &&
      symp.some(s => s.includes("Fever")) &&
      pt.some(p => p.includes("outdoor") || p.includes("travel"));
  }, [selections]);

  // Rec 7 — ABCDE trigger
  const showABCDE = useMemo(() => {
    const colors = selections.color || [];
    return colors.some(c => c.includes("Dark Brown") || c.includes("Multiple") || c.includes("Variegated")) ||
      Boolean(result?.abcde_concern);
  }, [selections.color, result]);

  // Rec 10 — PIH flag
  const showPIH = fitzpatrick >= 3 && result?.differential?.length > 0;

  // Keyboard shortcuts
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
        setActiveCat(CATS[n-1].id);
        document.getElementById(`dc-${CATS[n-1].id}`)?.scrollIntoView({ behavior:"smooth", block:"nearest" });
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

  const loadImages = useCallback(async (diagnoses) => {
    const loading = new Set(diagnoses.map(d => d.name));
    setImgLoading(loading);
    await Promise.all(diagnoses.map(async dx => {
      const url = await fetchWikiImage(dx.wiki_title || dx.name);
      setImages(prev => ({ ...prev, [dx.name]:url }));
      setImgLoading(prev => { const n=new Set(prev); n.delete(dx.name); return n; });
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasSelections || busy) return;
    setBusy(true); setError(null); setResult(null); setImages({});
    setImgLoading(new Set()); setShowBSA(false);
    try {
      const query = composeQuery(selections, freeText, fitzpatrick, patientCtx);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:3000,
          system:DERM_SYS,
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
      if (parsed.life_threatening?.length) setShowBSA(true);
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
      ...(result.life_threatening?.length ? [`LIFE-THREATENING: ${result.life_threatening.join(", ")}`, ""] : []),
      "DIFFERENTIAL:",
      ...(result.differential||[]).map((dx,i) =>
        `  ${i+1}. ${dx.name} (${dx.icd10||""}) [${(dx.likelihood||"").replace(/_/g," ")}]\n     Features: ${(dx.key_features||[]).join("; ")}\n     ED Mgmt: ${dx.ed_management||"N/A"}\n     Referral: ${dx.referral_urgency||"N/A"}`
      ),
      "",
      result.red_flags?.length    ? `RED FLAGS: ${result.red_flags.join(", ")}` : "",
      result.further_workup?.length ? `WORKUP: ${result.further_workup.join(", ")}` : "",
      result.pearls               ? `CLINICAL PEARL: ${result.pearls}` : "",
      result.pih_note             ? `PIH NOTE: ${result.pih_note}` : "",
      result.sources_searched?.length ? `Sources: ${result.sources_searched.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [result]);

  const clearAll = useCallback(() => {
    setSelections({}); setFreeText(""); setFitzpatrick(null);
    setResult(null); setImages({}); setError(null);
    setImgLoading(new Set()); setShowBSA(false);
    setLrinecVals({ crp:"",wbc:"",hgb:"",na:"",cr:"",glu:"" });
    setBsaSelected(new Set());
  }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : "var(--derm-bg)",
      minHeight:embedded ? "auto" : "100vh", color:"var(--derm-txt)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {/* Standalone header */}
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
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
            </div>
            <h1 className="d2-shim" style={{ fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(24px,4vw,40px)", fontWeight:900,
              letterSpacing:-.5, lineHeight:1.1, margin:0 }}>
              Dermatology Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--derm-txt4)", marginTop:4, marginBottom:0 }}>
              AAD · ACEP · 2024 Canadian ED Guidelines · Skin of Color Equity · LRINEC · BSA · TCS Guide
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
              borderRadius:4, padding:"2px 7px" }}>v2 · AAD/ACEP Guidelines</span>
          </div>
        )}

        {/* Kbd hints */}
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          {["1-8 jump category","Cmd+Enter submit","C copy to chart"].map(h => (
            <span key={h} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--derm-txt4)", background:"rgba(42,79,122,.15)",
              borderRadius:5, padding:"2px 8px", border:"1px solid rgba(42,79,122,.3)" }}>{h}</span>
          ))}
          {/* Tool launch buttons */}
          <button className={`d2-tool-btn${showLRINEC?" active":""}`}
            onClick={() => setShowLRINEC(!showLRINEC)}>LRINEC Calc</button>
          <button className={`d2-tool-btn${showTCS?" active":""}`}
            onClick={() => setShowTCS(!showTCS)}>TCS Guide</button>
          <button className="d2-tool-btn"
            onClick={() => navigate("/derm-morphology")}
            style={{ borderColor:"rgba(0,229,192,.4)", color:"var(--dmr-teal, var(--derm-teal))" }}>
            Morphology Ref
          </button>
          {result?.life_threatening?.length > 0 && (
            <button className={`d2-tool-btn${showBSA?" active":""}`}
              onClick={() => setShowBSA(!showBSA)} style={{ borderColor:"rgba(255,68,68,.4)", color:"var(--derm-coral)" }}>
              BSA Calc
            </button>
          )}
        </div>

        {/* Patient context */}
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

        {/* Tool panels */}
        {showLRINEC && (
          <div style={{ marginBottom:12 }}>
            <LRINECCalculator vals={lrinecVals} onChange={setLrinecVals} />
          </div>
        )}
        {showTCS && (
          <div style={{ marginBottom:12 }}>
            <TopicalSteroidGuide />
          </div>
        )}

        {/* RMSF pre-search trigger alert */}
        {rmsfTrigger && !result && (
          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:12,
            background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.4)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--derm-coral)", lineHeight:1.55 }}>
            <b>RMSF Alert:</b> Petechiae + fever + outdoor/tick exposure selected.
            Rocky Mountain Spotted Fever must be excluded — 60-75% given alternate diagnosis initially.
            Empiric doxycycline is indicated. Do NOT wait for serology.
          </div>
        )}

        {/* Drug risk panel (auto-shown) */}
        {showDrugPanel && (
          <div style={{ marginBottom:12 }}><DrugRiskPanel /></div>
        )}

        {/* Main layout */}
        <div style={{ display:"grid",
          gridTemplateColumns: result ? (embedded ? "1fr" : "380px 1fr") : "1fr",
          gap:16, alignItems:"start" }}>

          {/* Left: selector */}
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

            {/* Submit */}
            <div style={{ marginTop:16, display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={handleSubmit} disabled={busy||!hasSelections}
                style={{ flex:1, padding:"11px 0", borderRadius:11, transition:"all .15s",
                  cursor:busy||!hasSelections ? "not-allowed" : "pointer",
                  border:`1px solid ${!hasSelections ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.55)"}`,
                  background:!hasSelections ? "rgba(42,79,122,.15)"
                    : busy ? "rgba(0,229,192,.06)"
                    : "linear-gradient(135deg,rgba(0,229,192,.16),rgba(0,229,192,.06))",
                  color:!hasSelections ? "var(--derm-txt4)" : "var(--derm-teal)",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13 }}>
                {busy ? <span className="d2-pulse">Searching DermNet · AAD · VisualDx...</span>
                  : "Search Dermatology References [Cmd+Enter]"}
              </button>
              {hasSelections && (
                <button onClick={clearAll}
                  style={{ padding:"11px 14px", borderRadius:11, cursor:"pointer",
                    border:"1px solid var(--derm-bd)", background:"transparent",
                    color:"var(--derm-txt4)", fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>Clear</button>
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
                  How to Use</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--derm-txt4)", lineHeight:1.65 }}>
                  Select characteristics across 8 categories. Keys <b style={{ color:"var(--derm-teal)",
                    fontFamily:"'JetBrains Mono',monospace" }}>1-8</b> jump categories.
                  Tools: LRINEC calculator, BSA/SJS-TEN differentiator, TCS prescribing guide.
                  Drug risk panel appears automatically when new medication is selected.
                  Skin of color guidance activates for Fitzpatrick IV-VI.
                </div>
              </div>
            )}
          </div>

          {/* Right: results */}
          {result && (
            <div ref={resultsRef}>
              {showABCDE && <ABCDEPanel />}
              <LifeThreatAlert conditions={result.life_threatening} rmsfTrigger={rmsfTrigger} />
              {showBSA && (
                <div style={{ marginBottom:12 }}>
                  <BSACalculator selected={bsaSelected} onToggle={setBsaSelected} />
                </div>
              )}

              {/* Results header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:12, flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--derm-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
                    Differential Diagnosis</div>
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

              {/* Diagnosis grid */}
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12, marginBottom:14 }}>
                {(result.differential||[]).map((dx, i) => (
                  <DiagnosisCard key={dx.name+i} dx={dx}
                    image={images[dx.name]} imgLoading={imgLoading.has(dx.name)} />
                ))}
              </div>

              {/* Red flags, workup, pearl */}
              {(result.red_flags?.length > 0 || result.further_workup?.length > 0 || result.pearls) && (
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10, marginBottom:12 }}>
                  {result.red_flags?.length > 0 && (
                    <div style={{ padding:"10px 12px", borderRadius:9,
                      background:"rgba(255,68,68,.06)", border:"1px solid rgba(255,68,68,.25)" }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--derm-red)", letterSpacing:1.5, textTransform:"uppercase",
                        marginBottom:7 }}>Red Flags</div>
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
                        color:"var(--derm-blue)", letterSpacing:1.5, textTransform:"uppercase",
                        marginBottom:7 }}>Further Workup</div>
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
                        color:"var(--derm-purple)", letterSpacing:1.5, textTransform:"uppercase",
                        marginBottom:5 }}>Clinical Pearl</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                        color:"var(--derm-txt2)", lineHeight:1.55 }}>{result.pearls}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Rec 10 — PIH counseling note */}
              {showPIH && result.pih_note && (
                <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:12,
                  background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.3)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--derm-purple)", letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:5 }}>Post-Inflammatory Hyperpigmentation — Patient Counseling</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--derm-txt2)", lineHeight:1.55 }}>{result.pih_note}</div>
                </div>
              )}
              {showPIH && !result.pih_note && (
                <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:12,
                  background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--derm-txt3)", lineHeight:1.55 }}>
                  <b style={{ color:"var(--derm-purple)", fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>PIH Note (FST {fitzpatrick}): </b>
                  Post-inflammatory hyperpigmentation is more prominent and persistent in Fitzpatrick III-VI.
                  Treating the underlying inflammatory condition is the most effective prevention.
                  Avoid high-potency steroids that may worsen pigment irregularity.
                </div>
              )}
            </div>
          )}
        </div>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--derm-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA DERMATOLOGY HUB v2 · AAD / ACEP / 2024 CANADIAN ED GUIDELINES ·
            AI CLINICAL DECISION SUPPORT · NOT A SUBSTITUTE FOR DERMATOLOGIST EVALUATION
          </div>
        )}
      </div>
    </div>
  );
}