// TraumaHub.jsx
// Integrated Trauma Evaluation Hub
//
// Clinical basis:
//   - ATLS 10th Edition (ACS 2018) — primary/secondary survey
//   - CRASH-2 (Shakur 2010) — TXA within 3h reduces hemorrhagic death
//   - Permissive hypotension (Bickell 1994, Morrison 2011)
//   - Damage control resuscitation: 1:1:1 pRBC:FFP:Plt (Holcomb 2015 PROPPR)
//   - Shock Index = HR/SBP (Berger 1967, validated in trauma)
//   - Canadian CT Head Rule (Stiell 2001)
//   - NEXUS C-spine criteria (Hoffman 2000)
//
// Route: /TraumaHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("trauma-fonts")) return;
  const l = document.createElement("link");
  l.id = "trauma-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "trauma-css";
  s.textContent = `
    @keyframes tr-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .tr-in{animation:tr-in .18s ease forwards}
    @keyframes shimmer-tr{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-tr{background:linear-gradient(90deg,#f0f4ff 0%,#ff9f43 35%,#ff3d3d 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-tr 3.5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#0f0a06", panel:"#1a1208",
  txt:"#fff4e8", txt2:"#e0c8a0", txt3:"#b89060", txt4:"#7a5a30",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  amber:"#ffb347",
};

const TABS = [
  { id:"primary",  label:"Primary Survey",    icon:"🚨", color:T.red     },
  { id:"shock",    label:"Hemorrhagic Shock",  icon:"🩸", color:T.coral   },
  { id:"mtp",      label:"MTP / Hemostasis",   icon:"🔴", color:T.orange  },
  { id:"head",     label:"Head Injury",        icon:"🧠", color:T.purple  },
  { id:"injuries", label:"Specific Injuries",  icon:"⚡", color:T.amber   },
];

function Card({ color, title, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}08`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:7 }}>{title}</div>
      )}
      {children}
    </div>
  );
}

function Bullet({ text, sub, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.amber, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Check({ label, sub, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9,
        width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:"none", marginBottom:4,
        transition:"all .1s",
        background:checked ? `${color||T.amber}10` : "rgba(26,18,8,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.amber) : "rgba(100,60,20,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.amber) : "rgba(122,90,48,0.5)"}`,
        background:checked ? (color||T.amber) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#0f0a06", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.amber) : T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — ATLS PRIMARY SURVEY (ABCDE)
// ═══════════════════════════════════════════════════════════════════════════
const PRIMARY_STEPS = [
  {
    letter:"A",
    title:"Airway + C-Spine Protection",
    color:T.red,
    actions:[
      { text:"Assess: phonation, stridor, gurgling, facial/neck trauma", urgent:true },
      { text:"GCS ≤ 8 or inability to protect airway → RSI with c-spine inline stabilization" },
      { text:"RSI: ketamine 1.5 mg/kg IV + succinylcholine 1.5 mg/kg IV (or rocuronium 1.2 mg/kg)" },
      { text:"Surgical airway (cricothyrotomy) if: massive facial trauma, angioedema, failed RSI" },
      { text:"C-spine: maintain neutral alignment, hard collar not required if NEXUS criteria met" },
    ],
    nexus:[
      "No posterior midline c-spine tenderness",
      "No focal neurologic deficit",
      "Normal alertness (GCS 15, no intoxication, no distracting injury)",
      "No intoxication",
      "No distracting painful injury",
    ],
  },
  {
    letter:"B",
    title:"Breathing + Ventilation",
    color:T.orange,
    actions:[
      { text:"Assess: RR, SpO2, tracheal deviation, bilateral breath sounds, JVD", urgent:true },
      { text:"Tension PTX: absent breath sounds + tracheal deviation + hypotension → needle decompression NOW" },
      { text:"Needle decompression: 14g angiocath, 2nd ICS MCL or 4th/5th ICS AAL (more reliable)" },
      { text:"Open PTX: occlusive flutter valve dressing (3-sided) → chest tube" },
      { text:"Massive hemothorax: 32–36 Fr chest tube, 5th ICS AAL. Autotransfuse if large." },
      { text:"Flail chest: analgesic + positive pressure ventilation; splinting is NOT recommended" },
    ],
  },
  {
    letter:"C",
    title:"Circulation + Hemorrhage Control",
    color:T.coral,
    actions:[
      { text:"Assess: HR, BP, cap refill, skin color, Shock Index (HR/SBP)", urgent:true },
      { text:"External hemorrhage: direct pressure, tourniquet for extremity (place 2–3 inches proximal to wound)" },
      { text:"Pelvic fracture bleeding: pelvic binder or sheet, angioembolization or ORIF" },
      { text:"2 large-bore IVs or IO access — do NOT delay for central line" },
      { text:"Permissive hypotension: target SBP 80–90 (penetrating trauma) or 90–100 (blunt without TBI)" },
      { text:"Type and crossmatch + massive transfusion protocol activation if indicated" },
    ],
  },
  {
    letter:"D",
    title:"Disability (Neurologic Status)",
    color:T.purple,
    actions:[
      { text:"GCS — Eyes (4) + Verbal (5) + Motor (6). Document before sedation.", urgent:true },
      { text:"Pupils: size, symmetry, reactivity. Blown pupil (fixed dilated) = herniation until proven otherwise." },
      { text:"Lateralizing signs: unilateral weakness, asymmetric reflexes → urgent head CT" },
      { text:"GCS ≤ 8 = severe TBI — intubate, target PaO2 > 100, PaCO2 35–40 mmHg" },
      { text:"Avoid hypotension (SBP < 90 doubles TBI mortality) and hypoxia (SpO2 < 90)" },
    ],
  },
  {
    letter:"E",
    title:"Exposure + Environment",
    color:T.teal,
    actions:[
      { text:"Completely undress patient — log roll to inspect posterior, perineum, axillae", urgent:true },
      { text:"Hypothermia prevention: warm blankets, warmed IVF, warm environment (trauma triad of death)" },
      { text:"Trauma triad of death: Hypothermia + Acidosis + Coagulopathy — each worsens the others" },
      { text:"Log roll: maintain spinal alignment, inspect back, palpate spine, check rectal tone" },
      { text:"Temperature: cover with warm blankets as soon as secondary survey complete" },
    ],
  },
];

function PrimaryTab() {
  const [expanded, setExpanded] = useState("A");
  const [nexusItems, setNexusItems] = useState({});

  const nexusStep = PRIMARY_STEPS.find(s => s.letter === "A");
  const nexusNeg = nexusStep?.nexus.every((_, i) => nexusItems[i]);

  return (
    <div className="tr-in">
      {/* ABCDE accordion */}
      {PRIMARY_STEPS.map(step => (
        <div key={step.letter} style={{ marginBottom:6, borderRadius:11,
          overflow:"hidden",
          border:`1px solid ${expanded===step.letter ? step.color+"66" : step.color+"22"}` }}>
          <button onClick={() => setExpanded(expanded===step.letter ? null : step.letter)}
            style={{ display:"flex", alignItems:"center", gap:12,
              width:"100%", padding:"12px 14px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${step.color}12,rgba(26,18,8,0.96))` }}>
            <div style={{ width:34, height:34, borderRadius:"50%",
              background:step.color, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:18, color:"#0f0a06" }}>
              {step.letter}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:14, color:step.color }}>
                {step.title}
              </div>
              {expanded !== step.letter && (
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt4, marginTop:1 }}>
                  {step.actions[0].text.substring(0, 60)}…
                </div>
              )}
            </div>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {expanded===step.letter ? "▲" : "▼"}
            </span>
          </button>

          {expanded === step.letter && (
            <div style={{ padding:"10px 14px 12px",
              borderTop:`1px solid ${step.color}22` }}>
              {step.actions.map((a, i) => (
                <div key={i} style={{ display:"flex", gap:7,
                  alignItems:"flex-start", marginBottom:6,
                  padding:a.urgent ? "7px 10px" : "0",
                  borderRadius:a.urgent ? 7 : 0,
                  background:a.urgent ? `${step.color}0a` : "transparent",
                  border:a.urgent ? `1px solid ${step.color}28` : "none" }}>
                  <span style={{ color:step.color, fontSize:7,
                    marginTop:4, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11.5, color:a.urgent ? step.color : T.txt2,
                    fontWeight:a.urgent ? 600 : 400, lineHeight:1.6 }}>
                    {a.text}
                  </span>
                </div>
              ))}

              {/* NEXUS sub-section for A */}
              {step.letter === "A" && (
                <div style={{ marginTop:10, padding:"9px 11px",
                  borderRadius:8, background:"rgba(26,18,8,0.7)",
                  border:"1px solid rgba(100,60,20,0.4)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.teal, letterSpacing:1.5,
                    textTransform:"uppercase", marginBottom:6 }}>
                    NEXUS C-Spine Clearance — All 5 Required
                  </div>
                  {step.nexus.map((n, i) => (
                    <Check key={i} label={n}
                      checked={!!nexusItems[i]}
                      onToggle={() => setNexusItems(p => ({ ...p, [i]:!p[i] }))}
                      color={T.teal} />
                  ))}
                  {Object.keys(nexusItems).length > 0 && (
                    <div style={{ marginTop:6, padding:"7px 10px",
                      borderRadius:7, fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, lineHeight:1.55,
                      background:nexusNeg ? "rgba(0,212,180,0.08)" : "rgba(255,92,92,0.08)",
                      border:`1px solid ${nexusNeg ? "rgba(0,212,180,0.3)" : "rgba(255,92,92,0.3)"}`,
                      color:nexusNeg ? T.teal : T.coral }}>
                      {nexusNeg
                        ? "All 5 NEXUS criteria met — C-spine imaging not required. 99.6% sensitivity."
                        : "NEXUS criteria not met — C-spine imaging required (XR or CT based on mechanism)."}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — HEMORRHAGIC SHOCK
// ═══════════════════════════════════════════════════════════════════════════
const SHOCK_CLASSES = [
  { cls:"I",   color:T.teal,   vol:"< 750 mL",     pct:"< 15%",
    hr:"< 100", sbp:"Normal",  pp:"Normal",  rr:"14–20",
    ms:"Anxious", urine:"> 30 mL/hr",
    tx:"Crystalloid if needed — no blood products in most cases" },
  { cls:"II",  color:T.gold,   vol:"750–1,500 mL",  pct:"15–30%",
    hr:"100–120", sbp:"Normal", pp:"Decreased", rr:"20–30",
    ms:"Anxious/confused", urine:"20–30 mL/hr",
    tx:"Crystalloid ± pRBC. Reassess response." },
  { cls:"III", color:T.orange, vol:"1,500–2,000 mL",pct:"30–40%",
    hr:"120–140", sbp:"Decreased", pp:"Decreased", rr:"30–40",
    ms:"Confused/lethargic", urine:"5–15 mL/hr",
    tx:"pRBC + FFP — activate MTP protocol" },
  { cls:"IV",  color:T.coral,  vol:"> 2,000 mL",    pct:"> 40%",
    hr:"> 140", sbp:"Decreased", pp:"Decreased", rr:"> 35",
    ms:"Lethargic/unconscious", urine:"< 5 mL/hr",
    tx:"Immediate blood products 1:1:1. Damage control surgery." },
];

function ShockTab() {
  const [hr,  setHR]  = useState("");
  const [sbp, setSBP] = useState("");

  const si = (parseFloat(hr) && parseFloat(sbp))
    ? (parseFloat(hr) / parseFloat(sbp)).toFixed(2) : null;

  const siInterp = si === null ? null
    : parseFloat(si) < 0.6 ? { label:"Normal",            color:T.teal,  note:"SI < 0.6 — minimal shock" }
    : parseFloat(si) < 1.0 ? { label:"Mild Shock",         color:T.gold,  note:"SI 0.6–1.0 — 10–20% blood loss" }
    : parseFloat(si) < 1.4 ? { label:"Moderate Shock",     color:T.orange,note:"SI 1.0–1.4 — 20–40% blood loss" }
    : { label:"Severe / Impending Arrest", color:T.red,   note:"SI > 1.4 — massive hemorrhage, activate MTP" };

  return (
    <div className="tr-in">
      {/* Shock Index calculator */}
      <Card color={T.coral} title="Shock Index = HR / SBP">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:10, lineHeight:1.5 }}>
          SI > 1.0 indicates significant blood loss and predicts need for MTP.
          SI > 1.4 = massive hemorrhage / impending arrest.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          {[["Heart Rate (bpm)", hr, setHR, T.coral],
            ["SBP (mmHg)", sbp, setSBP, T.orange]].map(([label, val, set, color]) => (
            <div key={label}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:4 }}>{label}</div>
              <input type="number" value={val}
                onChange={e => set(e.target.value)}
                style={{ width:"100%", padding:"8px 10px",
                  background:"rgba(26,18,8,0.9)",
                  border:`1px solid ${val ? color+"55" : "rgba(100,60,20,0.4)"}`,
                  borderRadius:7, outline:"none",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:20, fontWeight:700, color }} />
            </div>
          ))}
        </div>
        {si && (
          <div style={{ display:"flex", alignItems:"center", gap:14,
            padding:"10px 13px", borderRadius:9,
            background:`${siInterp.color}0c`,
            border:`1px solid ${siInterp.color}40` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontSize:44, fontWeight:900, color:siInterp.color,
              lineHeight:1 }}>{si}</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:16, color:siInterp.color }}>
                {siInterp.label}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3, marginTop:2 }}>
                {siInterp.note}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Shock classification table */}
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:15, color:T.amber,
        margin:"4px 0 10px" }}>
        ATLS Hemorrhagic Shock Classification
      </div>
      {SHOCK_CLASSES.map(cls => (
        <div key={cls.cls} style={{ padding:"10px 13px", borderRadius:10,
          marginBottom:7, background:`${cls.color}08`,
          border:`1px solid ${cls.color}28` }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:10, marginBottom:7 }}>
            <div style={{ width:28, height:28, borderRadius:"50%",
              background:cls.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:14, color:"#0f0a06" }}>
              {cls.cls}
            </div>
            <div>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:13, color:cls.color }}>
                Class {cls.cls} — {cls.vol}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:cls.color,
                marginLeft:8 }}>{cls.pct} blood volume</span>
            </div>
          </div>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",
            gap:5, marginBottom:6 }}>
            {[
              ["HR", cls.hr], ["SBP", cls.sbp],
              ["Pulse Pressure", cls.pp], ["RR", cls.rr],
              ["Mental Status", cls.ms], ["Urine Output", cls.urine],
            ].map(([l, v]) => (
              <div key={l} style={{ padding:"5px 7px", borderRadius:6,
                background:"rgba(26,18,8,0.6)",
                border:"1px solid rgba(100,60,20,0.3)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:T.txt4, letterSpacing:1 }}>{l}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, fontWeight:700, color:cls.color }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
            color:T.txt3, lineHeight:1.5, fontStyle:"italic" }}>
            → {cls.tx}
          </div>
        </div>
      ))}

      <Card color={T.teal} title="Permissive Hypotension — Evidence-Based Targets">
        {[
          { label:"Penetrating trauma, no TBI", target:"SBP 80–90 mmHg", note:"Bickell 1994 — delayed resuscitation improved survival in penetrating torso trauma" },
          { label:"Blunt trauma, no TBI",        target:"SBP 80–90 mmHg", note:"Morrison 2011 — permissive hypotension safe for blunt without TBI" },
          { label:"Traumatic Brain Injury (TBI)", target:"SBP ≥ 110 mmHg (adults)", note:"BTF 2022 — hypotension doubles TBI mortality; higher target preserves CPP" },
          { label:"Elderly (> 65) + TBI",        target:"SBP ≥ 120 mmHg", note:"Older patients tolerate hypotension poorly — higher SBP target" },
        ].map((r, i) => (
          <div key={i} style={{ display:"flex", gap:10,
            alignItems:"flex-start", padding:"6px 0",
            borderBottom:i<3 ? "1px solid rgba(100,60,20,0.2)" : "none" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, color:T.txt2 }}>{r.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:1 }}>{r.note}</div>
            </div>
            <div style={{ padding:"3px 9px", borderRadius:6, flexShrink:0,
              background:"rgba(0,212,180,0.1)",
              border:"1px solid rgba(0,212,180,0.3)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:T.teal }}>
                {r.target}
              </span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — MTP / HEMOSTASIS
// ═══════════════════════════════════════════════════════════════════════════
function MTPTab() {
  const [weight, setWeight] = useState("");
  const wt = parseFloat(weight) || 0;
  const txa1 = wt > 0 ? Math.min(1000, Math.round(wt * 15)) : 1000;

  return (
    <div className="tr-in">
      {/* 1:1:1 ratio */}
      <Card color={T.orange} title="Massive Transfusion Protocol — 1:1:1 Ratio (PROPPR Trial)">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          PROPPR 2015 (Holcomb et al., JAMA): 1:1:1 pRBC:FFP:Platelets vs 1:1:2
          — 1:1:1 achieved better hemostasis at 24h and improved 30-day survival.
          Activate MTP when ≥ 10 units pRBC predicted in 24h.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
          {[
            { label:"pRBC", color:T.coral, note:"Packed Red Blood Cells", ratio:"1 unit" },
            { label:"FFP", color:T.orange, note:"Fresh Frozen Plasma", ratio:"1 unit" },
            { label:"Platelets", color:T.gold, note:"1 apheresis unit", ratio:"1 unit" },
          ].map(c => (
            <div key={c.label} style={{ padding:"10px", borderRadius:9,
              textAlign:"center", background:`${c.color}0a`,
              border:`1px solid ${c.color}30` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:20, fontWeight:900, color:c.color,
                marginBottom:3 }}>{c.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:9, color:T.txt4 }}>{c.note}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, color:c.color, marginTop:4 }}>{c.ratio}</div>
            </div>
          ))}
        </div>
        {[
          "MTP activation criteria: shock + ongoing bleeding requiring > 10 units pRBC/24h (or predicted to)",
          "Calcium replacement: 1g CaCl IV per 4 units pRBC — citrate in blood binds ionized calcium",
          "Cryoprecipitate: add for fibrinogen < 150 mg/dL (10 units or 2 pooled cryoprecipitate)",
          "Factor VIIa (rFVIIa): refractory coagulopathy — 90 mcg/kg IV; correct pH/temp/Ca first",
          "Goal-directed: use TEG/ROTEM to guide component therapy when available",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
      </Card>

      {/* TXA */}
      <Card color={T.red} title="Tranexamic Acid (TXA) — CRASH-2">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:10, lineHeight:1.55 }}>
          CRASH-2 (2010, NEJM): TXA within 3h reduces 28-day all-cause mortality
          by 9% (relative risk) in bleeding trauma patients. Benefit depends critically on timing.
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:4 }}>Patient Weight (kg) — for dose check</div>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            style={{ width:120, padding:"8px 10px",
              background:"rgba(26,18,8,0.9)",
              border:`1px solid ${weight ? T.red+"55" : "rgba(100,60,20,0.4)"}`,
              borderRadius:7, outline:"none",
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:18, fontWeight:700, color:T.red }} />
        </div>
        <div style={{ padding:"10px 12px", borderRadius:9,
          background:"rgba(255,61,61,0.08)",
          border:"1px solid rgba(255,61,61,0.3)",
          marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.red, letterSpacing:1, marginBottom:6 }}>
            STANDARD ADULT DOSE (fixed — not weight-based)
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:18, color:T.red, marginBottom:4 }}>
            1g IV over 10 minutes
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt2 }}>
            Then 1g IV over 8 hours (maintenance dose)
          </div>
        </div>
        {[
          { text:"TIMING IS CRITICAL — give within 3 hours of injury. After 3h, trend toward harm (CRASH-2).", color:T.red },
          { text:"Indication: any trauma patient with significant hemorrhage or at risk of significant hemorrhage.", color:T.amber },
          { text:"Prehospital TXA (10-TARN, MATTERs): increasing evidence — give in field if available.", color:T.amber },
          { text:"Contraindications: history of VTE, fibrinolysis inhibition not desired.", color:T.orange },
          { text:"Military TCCC protocol: TXA 2g IV push if in cardiac arrest or no IV access — non-standard.", color:T.txt3 },
        ].map((b, i) => <Bullet key={i} text={b.text} color={b.color} />)}
      </Card>

      {/* Damage control */}
      <Card color={T.purple} title="Damage Control Resuscitation vs Surgery">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { label:"Damage Control Resuscitation", color:T.purple, items:[
              "Minimize crystalloid — causes dilutional coagulopathy",
              "Early blood product transfusion (1:1:1)",
              "Permissive hypotension until hemorrhage controlled",
              "Correct hypothermia, acidosis, coagulopathy ('lethal triad')",
              "TXA within 3 hours",
            ]},
            { label:"Damage Control Surgery", color:T.coral, items:[
              "Abbreviated initial operation — control hemorrhage and contamination only",
              "Pack and close (temporary abdominal closure)",
              "ICU resuscitation to correct lethal triad",
              "Return to OR for definitive repair at 24–48h",
              "Indications: ongoing hemorrhage, coagulopathy, hypothermia, inability to close abdomen",
            ]},
          ].map(s => (
            <div key={s.label} style={{ padding:"9px 11px", borderRadius:9,
              background:`${s.color}08`,
              border:`1px solid ${s.color}28` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:s.color, letterSpacing:1.3,
                textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
              {s.items.map((item, i) => <Bullet key={i} text={item} color={s.color} />)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — HEAD INJURY
// ═══════════════════════════════════════════════════════════════════════════
const GCS_COMPONENTS = {
  eyes:[
    { score:4, label:"Spontaneous" },
    { score:3, label:"To voice" },
    { score:2, label:"To pain" },
    { score:1, label:"None" },
  ],
  verbal:[
    { score:5, label:"Oriented" },
    { score:4, label:"Confused" },
    { score:3, label:"Inappropriate words" },
    { score:2, label:"Incomprehensible sounds" },
    { score:1, label:"None" },
  ],
  motor:[
    { score:6, label:"Obeys commands" },
    { score:5, label:"Localizes pain" },
    { score:4, label:"Withdraws from pain" },
    { score:3, label:"Abnormal flexion (decorticate)" },
    { score:2, label:"Extension (decerebrate)" },
    { score:1, label:"None" },
  ],
};

const CANADIAN_CT = [
  { key:"gcs_fail", label:"GCS score < 15 at 2h after injury", high:true },
  { key:"skull_fx",  label:"Suspected open/depressed skull fracture", high:true },
  { key:"sign_base", label:"Signs of basal skull fracture (raccoon eyes, Battle sign, hemotympanum, CSF rhinorrhea/otorrhea)", high:true },
  { key:"vomit2",    label:"Vomiting ≥ 2 episodes", high:true },
  { key:"age65",     label:"Age ≥ 65 years", high:true },
  { key:"amnesia",   label:"Anterograde amnesia ≥ 30 minutes", medium:true },
  { key:"mech",      label:"Dangerous mechanism (pedestrian, MVC ejection, fall > 3 feet)", medium:true },
];

function HeadTab() {
  const [gcs, setGCS] = useState({ eyes:null, verbal:null, motor:null });
  const [ccHx, setCCHx] = useState({});

  const total = (gcs.eyes || 0) + (gcs.verbal || 0) + (gcs.motor || 0);
  const allSet = gcs.eyes && gcs.verbal && gcs.motor;

  const gcsStrata = !allSet ? null
    : total >= 13 ? { label:"Mild TBI",    color:T.teal,   note:"CT if Canadian CT Rule positive. Monitor, low threshold to admit." }
    : total >= 9  ? { label:"Moderate TBI",color:T.gold,   note:"CT head immediately. Neurosurgery consultation." }
    : { label:"Severe TBI",  color:T.coral,  note:"CT head immediately. Intubate if not done. Neurosurgery STAT." };

  const highRisk   = CANADIAN_CT.filter(c => c.high   && ccHx[c.key]).length > 0;
  const medRisk    = CANADIAN_CT.filter(c => c.medium && ccHx[c.key]).length > 0;
  const anyChecked = Object.keys(ccHx).length > 0;
  const ctResult   = anyChecked
    ? (highRisk || medRisk
      ? { label:"CT Head Required", color:T.coral, detail:highRisk ? "High-risk factor present" : "Medium-risk factor present" }
      : { label:"CT Not Required", color:T.teal, detail:"Canadian CT Head Rule negative — CT can be safely deferred in alert GCS 15 patients." })
    : null;

  return (
    <div className="tr-in">
      {/* GCS */}
      <Card color={T.purple} title="Glasgow Coma Scale">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4 }}>Document before sedation and intubation</div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:48, fontWeight:900,
            color:gcsStrata?.color || T.txt4, lineHeight:1 }}>
            {allSet ? total : "--"}
          </div>
        </div>
        {Object.entries(GCS_COMPONENTS).map(([comp, opts]) => (
          <div key={comp} style={{ marginBottom:10 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.purple, letterSpacing:1.3,
              textTransform:"uppercase", marginBottom:5 }}>
              {comp === "eyes" ? "Eyes (E)" : comp === "verbal" ? "Verbal (V)" : "Motor (M)"}
              {gcs[comp] !== null && (
                <span style={{ marginLeft:8, color:T.gold }}>= {gcs[comp]}</span>
              )}
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {opts.map(opt => (
                <button key={opt.score}
                  onClick={() => setGCS(p => ({ ...p, [comp]:opt.score }))}
                  style={{ padding:"5px 10px", borderRadius:7,
                    cursor:"pointer", transition:"all .1s",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:11,
                    border:`1px solid ${gcs[comp]===opt.score ? T.purple+"66" : "rgba(100,60,20,0.4)"}`,
                    background:gcs[comp]===opt.score ? "rgba(176,109,255,0.14)" : "transparent",
                    color:gcs[comp]===opt.score ? T.purple : T.txt4 }}>
                  {opt.score} — {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {gcsStrata && (
          <div style={{ padding:"9px 12px", borderRadius:8, marginTop:4,
            background:`${gcsStrata.color}09`,
            border:`1px solid ${gcsStrata.color}35` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:gcsStrata.color,
              marginBottom:3 }}>{gcsStrata.label} (GCS {total})</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3 }}>{gcsStrata.note}</div>
          </div>
        )}
      </Card>

      {/* Canadian CT Head Rule */}
      <Card color={T.blue} title="Canadian CT Head Rule — Alert Patients (GCS 13–15)">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8, lineHeight:1.5 }}>
          Stiell 2001 — 100% sensitivity for neurosurgical intervention.
          Apply only to GCS 13–15 patients with witnessed LOC, amnesia, or confusion.
          NOT for GCS ≤ 12, anticoagulated, or seizure patients.
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.coral, letterSpacing:1.3, marginBottom:5 }}>HIGH RISK (neurosurgical intervention)</div>
        {CANADIAN_CT.filter(c => c.high).map(c => (
          <Check key={c.key} label={c.label}
            checked={!!ccHx[c.key]}
            onToggle={() => setCCHx(p => ({ ...p, [c.key]:!p[c.key] }))}
            color={T.coral} />
        ))}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1.3, margin:"8px 0 5px" }}>
          MEDIUM RISK (brain injury on CT)
        </div>
        {CANADIAN_CT.filter(c => c.medium).map(c => (
          <Check key={c.key} label={c.label}
            checked={!!ccHx[c.key]}
            onToggle={() => setCCHx(p => ({ ...p, [c.key]:!p[c.key] }))}
            color={T.gold} />
        ))}
        {ctResult && (
          <div style={{ marginTop:8, padding:"9px 12px", borderRadius:8,
            background:`${ctResult.color}09`,
            border:`1px solid ${ctResult.color}35` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:ctResult.color,
              marginBottom:3 }}>{ctResult.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3 }}>{ctResult.detail}</div>
          </div>
        )}
      </Card>

      {/* ICP management */}
      <Card color={T.orange} title="Severe TBI — ICP Management">
        {[
          "Intubate: target PaO2 > 100 mmHg, PaCO2 35–40 mmHg. Avoid hypocapnia unless herniation.",
          "Head of bed 30°. Neutral head/neck positioning. Minimize stimulation.",
          "Hyperventilation (PaCO2 30–35): ONLY for acute herniation as bridge to definitive treatment.",
          "Hyperosmolar therapy: mannitol 0.5–1 g/kg IV OR hypertonic saline 3% 250 mL bolus.",
          "Avoid hypotension (SBP < 110 per BTF 2022). Maintain CPP > 60–70 mmHg.",
          "Seizure prophylaxis: levetiracetam 500–1000 mg IV BID × 7 days (BTF recommendation).",
          "Neurosurgery STAT for epidural hematoma, subdural ≥ 10 mm or > 5 mm midline shift, mass effect.",
          "Decompressive craniectomy: for refractory ICP > 20 mmHg despite maximal medical therapy.",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — SPECIFIC INJURIES
// ═══════════════════════════════════════════════════════════════════════════
const INJURY_PROTOCOLS = [
  {
    id:"tension",
    label:"Tension Pneumothorax",
    icon:"💨",
    color:T.orange,
    alert:"Clinical diagnosis — do NOT wait for CXR. Decompress immediately.",
    signs:["Absent or decreased breath sounds unilaterally","Tracheal deviation AWAY from affected side (late sign)","Hypotension + distended neck veins (JVD)","Hypoxia despite oxygen","Circulatory collapse"],
    tx:[
      "Needle decompression: 14g IV catheter, 2nd ICS MCL or 4th/5th ICS AAL (anterior axillary line — more reliable, less subcutaneous fat)",
      "Follow immediately with 28–32 Fr chest tube in 4th/5th ICS MAL",
      "In arrest: bilateral finger thoracostomies before defibrillation in traumatic PEA",
      "If decompression fails to improve: consider hemothorax, tension from other side, pericardial tamponade",
    ],
  },
  {
    id:"tamponade",
    label:"Cardiac Tamponade",
    icon:"❤️",
    color:T.coral,
    alert:"Beck's Triad: muffled heart sounds + hypotension + JVD. POCUS is diagnostic.",
    signs:["Beck's Triad (only 30% have all three)","Pulsus paradoxus > 10 mmHg (not reliable in rapid tamponade)","POCUS: pericardial effusion + RV diastolic collapse","Electrical alternans on EKG","Equalization of diastolic pressures"],
    tx:[
      "POCUS-guided pericardiocentesis: subxiphoid approach, 16–18g spinal needle toward left shoulder",
      "Even 10–20 mL drainage can restore hemodynamic stability",
      "ED thoracotomy for traumatic tamponade in cardiac arrest — create pericardial window",
      "Definitive: operative pericardial window or pericardiotomy",
    ],
  },
  {
    id:"aorta",
    label:"Traumatic Aortic Injury",
    icon:"⚡",
    color:T.red,
    alert:"Widened mediastinum (> 8 cm) on CXR = aortic injury until proven otherwise.",
    signs:["Widened mediastinum > 8 cm or mediastinum:chest ratio > 0.25","Loss of aortic knob contour","Tracheal deviation to the right","Left apical pleural cap","Depression of left mainstem bronchus","CXR has 90% sensitivity — negative CXR does NOT exclude"],
    tx:[
      "CT angiography chest — definitive diagnosis if hemodynamically stable",
      "Blood pressure control: target SBP 100–120 mmHg (labetalol or esmolol) to reduce aortic wall stress",
      "Vascular surgery or interventional radiology STAT",
      "TEVAR (thoracic endovascular aortic repair) now preferred over open surgery",
      "If unstable: direct to OR — no time for CTA",
    ],
  },
  {
    id:"pelvic",
    label:"Pelvic Fracture Hemorrhage",
    icon:"🦴",
    color:T.purple,
    alert:"Unstable pelvic fracture can cause exsanguinating hemorrhage from retroperitoneal venous plexus.",
    signs:["Pelvic instability on compression or distraction (examine ONCE only — do not repeat)","Perineal, scrotal, or labial hematoma","Blood at urethral meatus — urethral injury, do not place Foley until urology consulted","High-riding prostate on rectal exam (urethral disruption)","FAST: pelvic hematoma is retroperitoneal and will NOT show on FAST — do not be falsely reassured"],
    tx:[
      "Immediate pelvic binder or sheet: wrap at greater trochanters (NOT iliac crests)",
      "MTP activation — pelvic fractures can lose 4–6L into retroperitoneum",
      "CT pelvis with angiography if hemodynamically responds to resuscitation",
      "Angioembolization: for arterial bleeding (venous bleeding is more common — may not respond)",
      "REBOA (Zone 3): if angioembolization not immediately available",
      "Pre-peritoneal packing: direct surgical packing for refractory pelvic hemorrhage",
    ],
  },
];

function InjuriesTab() {
  const [expanded, setExpanded] = useState("tension");
  const proto = INJURY_PROTOCOLS.find(p => p.id === expanded);
  return (
    <div className="tr-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {INJURY_PROTOCOLS.map(p => (
          <button key={p.id} onClick={() => setExpanded(p.id)}
            style={{ display:"flex", alignItems:"center", gap:6,
              flex:1, padding:"8px 12px", borderRadius:9,
              cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${expanded===p.id ? p.color+"66" : p.color+"22"}`,
              background:expanded===p.id ? `${p.color}12` : "transparent",
              color:expanded===p.id ? p.color : T.txt4 }}>
            <span style={{ fontSize:14 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {proto && (
        <div>
          <div style={{ padding:"9px 13px", borderRadius:8, marginBottom:10,
            background:`${proto.color}0a`,
            border:`1px solid ${proto.color}35` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:proto.color, letterSpacing:1.5,
              textTransform:"uppercase", marginBottom:4 }}>⚡ Alert</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:12, fontWeight:600, color:proto.color }}>
              {proto.alert}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:proto.color, letterSpacing:1.3,
                textTransform:"uppercase", marginBottom:6 }}>
                Clinical Features
              </div>
              {proto.signs.map((s, i) => <Bullet key={i} text={s} color={proto.color} />)}
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.teal, letterSpacing:1.3,
                textTransform:"uppercase", marginBottom:6 }}>
                Management
              </div>
              {proto.tx.map((s, i) => <Bullet key={i} text={s} color={T.teal} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function TraumaHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("primary");

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh",
      color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                padding:"5px 14px", borderRadius:8,
                background:"rgba(15,10,6,0.8)",
                border:"1px solid rgba(100,60,20,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(15,10,6,0.95)",
                border:"1px solid rgba(100,60,20,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.amber, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>TRAUMA</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,61,61,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-tr"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Trauma Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              ATLS Primary Survey · Shock Classification · MTP 1:1:1 · TXA (CRASH-2)
              · GCS · Canadian CT Head Rule · NEXUS · Damage Control Resuscitation
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(26,18,8,0.85)",
          border:"1px solid rgba(100,60,20,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(100,60,20,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "primary"  && <PrimaryTab />}
        {tab === "shock"    && <ShockTab />}
        {tab === "mtp"      && <MTPTab />}
        {tab === "head"     && <HeadTab />}
        {tab === "injuries" && <InjuriesTab />}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA TRAUMA HUB · ATLS 10TH ED · CRASH-2 (SHAKUR 2010)
            · PROPPR (HOLCOMB 2015) · CANADIAN CT HEAD RULE (STIELL 2001)
            · NEXUS (HOFFMAN 2000) · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}