// PediatricHub.jsx
// Pediatric Emergency Hub
//
// Clinical basis:
//   - Broselow-Luten tape weight/length estimation (Luten 1992)
//   - PECARN Head CT Rule (Kuppermann 2009, Lancet) — both age arms
//   - Rochester Criteria for febrile infant < 60 days (Dagan 1985)
//   - Step-by-Step algorithm for febrile infant 29–90 days (Gomez 2016)
//   - Westley Croup Score (Westley 1978)
//   - Pediatric Shock Index (Nathan 2016)
//   - PALS 2020 drug dosing and defibrillation
//   - AAP/ACEP age-specific vital sign norms
//
// Route: /PediatricHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("peds-fonts")) return;
  const l = document.createElement("link");
  l.id = "peds-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "peds-css";
  s.textContent = `
    @keyframes peds-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .peds-in{animation:peds-in .18s ease forwards}
    @keyframes shimmer-peds{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-peds{background:linear-gradient(90deg,#f0f4ff 0%,#3dffa0 40%,#4da6ff 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-peds 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#030d0f", panel:"#061419",
  txt:"#e8fff8", txt2:"#9ed4c0", txt3:"#5aaa90", txt4:"#2d7060",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  mint:"#7fffcf", cyan:"#00c8d4",
};

const TABS = [
  { id:"vitals",   label:"Vitals + Weight",   icon:"📏", color:T.mint    },
  { id:"pecarn",   label:"PECARN Head CT",    icon:"🧠", color:T.blue    },
  { id:"fever",    label:"Fever Workup",      icon:"🌡️", color:T.coral   },
  { id:"resus",    label:"Resuscitation",     icon:"💊", color:T.green   },
  { id:"scoring",  label:"Peds Scoring",      icon:"📋", color:T.purple  },
];

// ── Shared ─────────────────────────────────────────────────────────────────
function Card({ color, title, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}07`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Bullet({ text, sub, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
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
        background:checked ? `${color||T.teal}10` : "rgba(6,20,25,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.teal) : "rgba(20,80,70,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.teal) : "rgba(45,112,96,0.5)"}`,
        background:checked ? (color||T.teal) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#030d0f", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.teal) : T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

function ResultBox({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:`${color}0c`, border:`1px solid ${color}44`, marginTop:10 }}>
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:18, color, marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{detail}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VITAL SIGNS + WEIGHT ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════

// Age-specific vital sign norms (AAP / PALS 2020)
const VITAL_NORMS = [
  { age:"Neonate (0–28d)",   hr:[100,160], sbp:[60,90],   rr:[30,60], wt:"2.5–4.5 kg" },
  { age:"1–3 months",        hr:[100,160], sbp:[70,100],  rr:[30,60], wt:"3.5–6 kg"   },
  { age:"3–6 months",        hr:[90,150],  sbp:[70,110],  rr:[25,45], wt:"5.5–8 kg"   },
  { age:"6–12 months",       hr:[80,140],  sbp:[80,115],  rr:[25,40], wt:"7–11 kg"    },
  { age:"1–2 years",         hr:[80,130],  sbp:[80,115],  rr:[20,35], wt:"10–14 kg"   },
  { age:"2–5 years",         hr:[75,120],  sbp:[80,115],  rr:[20,30], wt:"12–20 kg"   },
  { age:"6–10 years",        hr:[70,110],  sbp:[85,120],  rr:[16,24], wt:"20–35 kg"   },
  { age:"11–14 years",       hr:[60,105],  sbp:[90,130],  rr:[12,20], wt:"35–60 kg"   },
];

// Broselow zones (simplified — actual tape has more granularity)
const BROSELOW_ZONES = [
  { color:"Grey",   length:"46–55 cm",  weight:"3–5 kg",   zone:"GREY"   },
  { color:"Pink",   length:"55–67 cm",  weight:"6–7 kg",   zone:"PINK"   },
  { color:"Red",    length:"67–75 cm",  weight:"8–9 kg",   zone:"RED"    },
  { color:"Purple", length:"75–85 cm",  weight:"10–11 kg", zone:"PURPLE" },
  { color:"Yellow", length:"85–95 cm",  weight:"12–14 kg", zone:"YELLOW" },
  { color:"White",  length:"95–107 cm", weight:"15–18 kg", zone:"WHITE"  },
  { color:"Blue",   length:"107–122 cm",weight:"19–22 kg", zone:"BLUE"   },
  { color:"Orange", length:"122–137 cm",weight:"24–28 kg", zone:"ORANGE" },
  { color:"Green",  length:"137–152 cm",weight:"30–36 kg", zone:"GREEN"  },
];

const ZONE_COLOR = {
  GREY:"#9e9e9e", PINK:"#ff80ab", RED:"#ff5252", PURPLE:"#b06dff",
  YELLOW:"#f5c842", WHITE:"#e0e0e0", BLUE:"#4da6ff",
  ORANGE:"#ff9f43", GREEN:"#3dffa0",
};

function VitalsTab() {
  const [ageMonths, setAgeMonths] = useState("");
  const [heightCm, setHeightCm]  = useState("");
  const [hrVal,    setHRVal]     = useState("");
  const [sbpVal,   setSBPVal]    = useState("");

  const ageM = parseFloat(ageMonths) || 0;
  const ageY = ageM / 12;
  const ht   = parseFloat(heightCm) || 0;

  // Weight estimation by age
  const estWeight = useMemo(() => {
    if (!ageM) return null;
    if (ageM <= 3)  return { kg: 3 + (ageM * 0.5),           method:"Neonate formula" };
    if (ageM <= 12) return { kg: Math.round((ageM + 9) / 2),  method:"Infant formula: (age_months + 9) / 2" };
    if (ageY <= 5)  return { kg: Math.round(2 * ageY + 8),    method:"Young child: (2 × age_years) + 8" };
    if (ageY <= 10) return { kg: Math.round(3 * ageY + 7),    method:"School age: (3 × age_years) + 7" };
    return             { kg: Math.round(3.3 * ageY + 4),      method:"Adolescent approximation" };
  }, [ageM, ageY]);

  // Broselow zone by length
  const broselowZone = useMemo(() => {
    if (!ht) return null;
    return BROSELOW_ZONES.find(z => {
      const [lo, hi] = z.length.split("–").map(s => parseFloat(s));
      return ht >= lo && ht < hi;
    }) || (ht >= 152 ? BROSELOW_ZONES[BROSELOW_ZONES.length - 1] : null);
  }, [ht]);

  // Vital sign assessment
  const norm = useMemo(() => {
    if (!ageM) return null;
    if (ageM <= 1)   return VITAL_NORMS[0];
    if (ageM <= 3)   return VITAL_NORMS[1];
    if (ageM <= 6)   return VITAL_NORMS[2];
    if (ageM <= 12)  return VITAL_NORMS[3];
    if (ageY <= 2)   return VITAL_NORMS[4];
    if (ageY <= 5)   return VITAL_NORMS[5];
    if (ageY <= 10)  return VITAL_NORMS[6];
    return                  VITAL_NORMS[7];
  }, [ageM, ageY]);

  const hrStatus  = norm && hrVal  ? (parseFloat(hrVal) < norm.hr[0] ? "low" : parseFloat(hrVal) > norm.hr[1] ? "high" : "ok") : null;
  const sbpStatus = norm && sbpVal ? (parseFloat(sbpVal) < norm.sbp[0] ? "low" : parseFloat(sbpVal) > norm.sbp[1] ? "high" : "ok") : null;
  const statusColor = s => s === "ok" ? T.teal : s === "high" ? T.coral : T.orange;

  return (
    <div className="peds-in">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        {[
          ["Age (months)", ageMonths, setAgeMonths, T.mint],
          ["Height / Length (cm)", heightCm, setHeightCm, T.blue],
        ].map(([label, val, set, color]) => (
          <div key={label}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
            <input type="number" value={val} onChange={e => set(e.target.value)}
              style={{ width:"100%", padding:"9px 11px",
                background:"rgba(6,20,25,0.9)",
                border:`1px solid ${val ? color+"55" : "rgba(20,80,70,0.4)"}`,
                borderRadius:8, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:20, fontWeight:700, color }} />
          </div>
        ))}
      </div>

      {/* Weight estimate */}
      {estWeight && (
        <Card color={T.mint} title="Estimated Weight">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontSize:44, fontWeight:900, color:T.mint, lineHeight:1 }}>
              {estWeight.kg.toFixed(1)}<span style={{ fontSize:20 }}> kg</span>
            </div>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3 }}>{estWeight.method}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:3 }}>
                Age-based formula only — measure weight when possible.
                Broselow tape remains gold standard for drug dosing.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Broselow zone */}
      {broselowZone && (
        <Card color={ZONE_COLOR[broselowZone.zone] || T.teal} title="Broselow Zone">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:44, height:44, borderRadius:8,
              background:ZONE_COLOR[broselowZone.zone],
              flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:18,
                color:ZONE_COLOR[broselowZone.zone] }}>
                {broselowZone.color} Zone
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, color:T.txt3 }}>
                {broselowZone.length} · {broselowZone.weight}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:2 }}>
                Use Broselow color-coded drug cards for weight-appropriate dosing
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Vital sign checker */}
      {norm && (
        <Card color={T.cyan} title={`Normal Vitals for Age (${ageM < 24 ? ageM + " months" : (ageY).toFixed(1) + " years"})`}>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
            {[
              { label:"HR", range:`${norm.hr[0]}–${norm.hr[1]}`, unit:"bpm" },
              { label:"SBP", range:`${norm.sbp[0]}–${norm.sbp[1]}`, unit:"mmHg" },
              { label:"RR", range:`${norm.rr[0]}–${norm.rr[1]}`, unit:"/min" },
            ].map(v => (
              <div key={v.label} style={{ padding:"8px", borderRadius:8,
                textAlign:"center", background:"rgba(6,20,25,0.7)",
                border:"1px solid rgba(20,80,70,0.4)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4, letterSpacing:1 }}>{v.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:13, fontWeight:700, color:T.cyan }}>{v.range}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:T.txt4 }}>{v.unit}</div>
              </div>
            ))}
          </div>

          {/* Live vital input */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Patient HR", val:hrVal, set:setHRVal, status:hrStatus, norm:norm.hr },
              { label:"Patient SBP", val:sbpVal, set:setSBPVal, status:sbpStatus, norm:norm.sbp },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                  marginBottom:4 }}>{f.label}</div>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ width:"100%", padding:"7px 9px",
                    background:"rgba(6,20,25,0.9)",
                    border:`1px solid ${f.val ? statusColor(f.status)+"55" : "rgba(20,80,70,0.35)"}`,
                    borderRadius:6, outline:"none",
                    fontFamily:"'JetBrains Mono',monospace",
                    fontSize:16, fontWeight:700,
                    color:f.val ? statusColor(f.status) : T.txt4 }} />
                {f.status && f.status !== "ok" && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:9, color:statusColor(f.status), marginTop:2 }}>
                    {f.status === "high" ? `High (norm ${f.norm[0]}–${f.norm[1]})` : `Low (norm ${f.norm[0]}–${f.norm[1]})`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hypotensive threshold */}
          {ageM > 0 && (
            <div style={{ marginTop:8, padding:"6px 9px", borderRadius:7,
              background:"rgba(255,92,92,0.07)",
              border:"1px solid rgba(255,92,92,0.22)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.coral, letterSpacing:1 }}>
                PALS Hypotension Threshold:{" "}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:T.coral }}>
                SBP {"<"} {ageY <= 1 ? 70 : ageY <= 10 ? Math.round(70 + (2 * ageY)) : 90} mmHg
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:9, color:T.txt4, marginLeft:6 }}>
                {ageY <= 1 ? "(< 1 year: SBP < 70)" : `(1–10 years: SBP < ${Math.round(70 + (2 * ageY))} = 70 + 2×age)`}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Vital norms table */}
      <Card color={T.teal} title="Pediatric Vital Sign Reference Table">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse",
            fontFamily:"'JetBrains Mono',monospace", fontSize:9 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(20,80,70,0.4)" }}>
                {["Age Group","HR (bpm)","SBP (mmHg)","RR (/min)","Wt (kg)"].map(h => (
                  <th key={h} style={{ padding:"5px 8px", textAlign:"left",
                    color:T.txt4, fontWeight:700, letterSpacing:0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VITAL_NORMS.map((row, i) => (
                <tr key={i} style={{ borderBottom:"1px solid rgba(20,80,70,0.2)" }}>
                  <td style={{ padding:"5px 8px", color:T.teal, fontWeight:700 }}>{row.age}</td>
                  <td style={{ padding:"5px 8px", color:T.txt2 }}>{row.hr[0]}–{row.hr[1]}</td>
                  <td style={{ padding:"5px 8px", color:T.txt2 }}>{row.sbp[0]}–{row.sbp[1]}</td>
                  <td style={{ padding:"5px 8px", color:T.txt2 }}>{row.rr[0]}–{row.rr[1]}</td>
                  <td style={{ padding:"5px 8px", color:T.txt3 }}>{row.wt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PECARN HEAD CT RULE
// Kuppermann 2009, Lancet — both age arms
// ═══════════════════════════════════════════════════════════════════════════
const PECARN_UNDER2 = [
  { key:"gcs14a",  label:"GCS < 15",                      high:true, sub:"On initial ED evaluation" },
  { key:"palpfx",  label:"Palpable skull fracture",        high:true, sub:"On physical examination" },
  { key:"altsens", label:"Altered mental status",          high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"loca",    label:"Loss of consciousness ≥ 5 sec",  mod:true,  sub:"Parent-reported or witnessed" },
  { key:"nonfr",   label:"Non-frontal scalp hematoma",     mod:true,  sub:"Scalp hematoma other than frontal region" },
  { key:"sevmech", label:"Severe mechanism of injury",     mod:true,  sub:"MVC with ejection/rollover/pedestrian, fall >0.9m, head struck by high-impact object" },
  { key:"actbehav",label:"Acting abnormally per parent",   mod:true,  sub:"Behavior different from baseline per caregiver" },
];

const PECARN_2PLUS = [
  { key:"gcs14b",  label:"GCS < 15",                      high:true, sub:"On initial ED evaluation" },
  { key:"altsens2",label:"Altered mental status",          high:true, sub:"Agitation, somnolence, repetitive questioning, slow response" },
  { key:"signskull",label:"Signs of basilar skull fracture",high:true,sub:"Hemotympanum, Battle sign, raccoon eyes, CSF rhinorrhea/otorrhea" },
  { key:"locb",    label:"Loss of consciousness",          mod:true,  sub:"Any duration" },
  { key:"vomit",   label:"Vomiting",                       mod:true,  sub:"Any vomiting" },
  { key:"sevmech2",label:"Severe mechanism of injury",     mod:true,  sub:"MVC with ejection/rollover/pedestrian, fall >1.5m, head struck by high-impact object" },
  { key:"headache",label:"Severe headache",                mod:true,  sub:"Patient reports severe headache" },
];

function PECARNTab() {
  const [arm,    setArm]    = useState("under2");
  const [items,  setItems]  = useState({});
  const criteria = arm === "under2" ? PECARN_UNDER2 : PECARN_2PLUS;
  const toggle = k => setItems(p => ({ ...p, [k]:!p[k] }));

  const highRisk = criteria.filter(c => c.high && items[c.key]).length > 0;
  const modRisk  = criteria.filter(c => c.mod  && items[c.key]).length > 0;
  const anySet   = Object.keys(items).length > 0;

  const result = !anySet ? null
    : highRisk ? {
        label:"CT Recommended — High Risk",
        color:T.coral,
        detail:"High-risk factor present. CT head recommended immediately. cTBI risk > 4.4%.",
      }
    : modRisk ? {
        label:"CT vs Observation — Physician Decision",
        color:T.gold,
        detail:arm === "under2"
          ? "Intermediate-risk factors present in child < 2. CT vs 4–6h observation — consider isolated non-frontal hematoma (< 3 months has higher risk), other clinical factors, family preference."
          : "Intermediate-risk factors only. CT vs observation — consider # of factors, age, worsening symptoms, physician experience, parental preference.",
      }
    : {
        label:"CT Not Recommended",
        color:T.teal,
        detail:arm === "under2"
          ? "No high-risk or intermediate-risk factors in child < 2. Risk of cTBI < 0.02%. Observation for 4–6h if mechanism unclear. Discharge with return precautions."
          : "No risk factors. Risk of cTBI < 0.05%. Discharge with return precautions if reliable follow-up available.",
      };

  return (
    <div className="peds-in">
      <Card color={T.blue} title="PECARN Pediatric Head CT Rule — Kuppermann 2009">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:T.txt3, lineHeight:1.65, marginBottom:10 }}>
          Prospective validation in 42,412 children. Identifies clinically important TBI (cTBI)
          requiring neurosurgical intervention. Two separate algorithms by age.
          Sensitivity 99%+ for cTBI in both arms.
        </div>
        <div style={{ display:"flex", gap:7, marginBottom:14 }}>
          {[["under2","< 2 Years"],["2plus","≥ 2 Years"]].map(([v,l]) => (
            <button key={v} onClick={() => { setArm(v); setItems({}); }}
              style={{ flex:1, padding:"9px 0", borderRadius:9,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                fontWeight:600, fontSize:12, transition:"all .1s",
                border:`1px solid ${arm===v ? T.blue+"66" : "rgba(20,80,70,0.4)"}`,
                background:arm===v ? "rgba(77,166,255,0.12)" : "transparent",
                color:arm===v ? T.blue : T.txt4 }}>
              {l}
            </button>
          ))}
        </div>
      </Card>

      {/* High risk */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.coral, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:5 }}>
        High Risk (CT Recommended if Present)
      </div>
      {criteria.filter(c => c.high).map(c => (
        <Check key={c.key} label={c.label} sub={c.sub}
          checked={!!items[c.key]} onToggle={() => toggle(c.key)}
          color={T.coral} />
      ))}

      {/* Intermediate risk */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.gold, letterSpacing:1.5, textTransform:"uppercase",
        margin:"10px 0 5px" }}>
        Intermediate Risk (CT vs Observation — Clinical Judgment)
      </div>
      {criteria.filter(c => c.mod).map(c => (
        <Check key={c.key} label={c.label} sub={c.sub}
          checked={!!items[c.key]} onToggle={() => toggle(c.key)}
          color={T.gold} />
      ))}

      {result && <ResultBox label={result.label} color={result.color} detail={result.detail} />}

      {arm === "under2" && (
        <Card color={T.purple} title="Age < 3 Months — Additional Considerations">
          <Bullet text="Infants < 3 months have higher risk of intracranial injury even with low-energy mechanisms — lower threshold for CT" color={T.purple} />
          <Bullet text="Non-accidental trauma must be considered — examine for bruising, retinal hemorrhage, long bone fractures" color={T.purple} />
          <Bullet text="Bulging fontanelle = elevated ICP until proven otherwise" color={T.purple} />
          <Bullet text="PECARN most validated for ages 2 months to < 2 years — clinical judgment for neonates" color={T.purple} />
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PEDIATRIC FEVER WORKUP
// ═══════════════════════════════════════════════════════════════════════════
const ROCHESTER_LOW_RISK = [
  { key:"prev_healthy", label:"Previously healthy — no perinatal complications", sub:"Full-term, no NICU stay, no prior illness" },
  { key:"no_abx",       label:"No prior antibiotic treatment", sub:"No antibiotics in past 48h" },
  { key:"no_hosp",      label:"No hospitalization or medical problem", sub:"No underlying medical condition" },
  { key:"no_focus",     label:"No identifiable bacterial focus on exam", sub:"No otitis, soft tissue infection, bone/joint infection" },
  { key:"wbc_ok",       label:"WBC 5,000–15,000/µL",             sub:"And band:neutrophil ratio < 0.2" },
  { key:"ua_ok",        label:"Urinalysis: < 10 WBC/hpf, negative LE/nitrite", sub:"Clean catch or catheterized specimen" },
  { key:"stool_ok",     label:"If diarrhea: stool smear < 5 WBC/hpf", sub:"Only if diarrhea present" },
];

function FeverTab() {
  const [ageWeeks, setAgeWeeks] = useState("");
  const [rochester, setRochester] = useState({});
  const toggle = k => setRochester(p => ({ ...p, [k]:!p[k] }));

  const ageW = parseFloat(ageWeeks) || 0;
  const lowRiskAll = ROCHESTER_LOW_RISK.every(c => rochester[c.key]);

  return (
    <div className="peds-in">
      <div style={{ marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
          marginBottom:4 }}>Age (weeks)</div>
        <input type="number" value={ageWeeks} onChange={e => setAgeWeeks(e.target.value)}
          style={{ width:140, padding:"9px 11px",
            background:"rgba(6,20,25,0.9)",
            border:`1px solid ${ageWeeks ? T.coral+"55" : "rgba(20,80,70,0.4)"}`,
            borderRadius:8, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:20, fontWeight:700, color:T.coral }} />
      </div>

      {/* Age-stratified approach */}
      {[
        {
          range:"< 28 days (0–4 weeks)",
          color:T.red,
          active:ageW > 0 && ageW < 4,
          approach:[
            "FULL SEPSIS WORKUP: CBC + diff, CMP, UA + UC, blood culture, LP (CSF culture, cell count, glucose, protein)",
            "Empiric antibiotics: ampicillin 50 mg/kg IV q6h + gentamicin 4 mg/kg IV q24h",
            "Add acyclovir 20 mg/kg IV q8h if HSV risk (maternal lesions, ill-appearing, seizures, vesicles)",
            "Hospitalize ALL neonates with fever — no outpatient management",
            "Rectal temperature ≥ 38.0°C = fever in this age group",
          ],
        },
        {
          range:"29–60 days (4–8 weeks)",
          color:T.orange,
          active:ageW >= 4 && ageW <= 8.5,
          approach:[
            "Full sepsis workup: CBC, CMP, UA + urine culture, blood culture, LP strongly recommended",
            "Rochester Criteria (below): if met, may consider outpatient with close follow-up — only after LP",
            "If ill-appearing or high-risk: hospitalize + empiric antibiotics regardless of criteria",
            "Step-by-Step (Gomez 2016): new validated algorithm — sequential rule-out of SBI",
            "Rectal temperature ≥ 38.0°C = fever",
          ],
        },
        {
          range:"61–90 days (8–13 weeks)",
          color:T.gold,
          active:ageW > 8.5 && ageW <= 13,
          approach:[
            "Stratify risk: blood culture, UA + UC, procalcitonin",
            "LP: discretionary — not mandatory if low-risk criteria met and well-appearing",
            "Procalcitonin < 0.5 ng/mL + CRP < 20 mg/L + ANC < 5,200 + UA negative = low risk for SBI",
            "Low-risk well-appearing: consider outpatient with ceftriaxone 50 mg/kg IM + 24h return",
          ],
        },
        {
          range:"3–36 months",
          color:T.teal,
          active:ageW > 13 && ageW <= 156,
          approach:[
            "Fully vaccinated (Hib + PCV13): risk of SBI < 1% — targeted evaluation by symptoms",
            "UA + UC for any female < 24 months or uncircumcised male < 12 months with fever > 39°C",
            "Blood culture: fever > 39°C + WBC > 15,000 or ill-appearing",
            "Chest X-ray: if WBC > 20,000 even without respiratory symptoms",
            "Incompletely vaccinated or immunocompromised: full workup",
          ],
        },
      ].map((tier, i) => (
        <div key={i} style={{ marginBottom:7, padding:"10px 13px",
          borderRadius:10,
          background:tier.active ? `${tier.color}10` : `${tier.color}06`,
          border:`1px solid ${tier.active ? tier.color+"55" : tier.color+"22"}`,
          borderLeft:`4px solid ${tier.color}` }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:tier.color,
            marginBottom:tier.active ? 8 : 0 }}>
            {tier.range}
            {tier.active && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:tier.color, marginLeft:8,
                background:`${tier.color}18`, border:`1px solid ${tier.color}40`,
                borderRadius:4, padding:"1px 7px", letterSpacing:1 }}>
                ACTIVE
              </span>
            )}
          </div>
          {tier.active && tier.approach.map((a, j) => (
            <Bullet key={j} text={a} color={tier.color} />
          ))}
        </div>
      ))}

      {/* Rochester criteria */}
      {ageW >= 4 && ageW <= 8.5 && (
        <Card color={T.orange} title="Rochester Criteria — Low-Risk SBI (29–60 days)">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginBottom:8 }}>
            ALL criteria must be met for low-risk designation. Does NOT replace clinical judgment.
          </div>
          {ROCHESTER_LOW_RISK.map(c => (
            <Check key={c.key} label={c.label} sub={c.sub}
              checked={!!rochester[c.key]} onToggle={() => toggle(c.key)}
              color={T.orange} />
          ))}
          {Object.keys(rochester).length > 0 && (
            <div style={{ marginTop:8, padding:"9px 11px", borderRadius:8,
              background:lowRiskAll ? "rgba(255,159,67,0.08)" : "rgba(255,92,92,0.08)",
              border:`1px solid ${lowRiskAll ? "rgba(255,159,67,0.35)" : "rgba(255,92,92,0.3)"}` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:14,
                color:lowRiskAll ? T.orange : T.coral }}>
                {lowRiskAll ? "Low-Risk by Rochester Criteria" : "Does Not Meet Low-Risk Criteria"}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3, marginTop:3, lineHeight:1.55 }}>
                {lowRiskAll
                  ? "May consider outpatient management after LP with close follow-up in 24h. Cultures must be followed. Many centers still hospitalize all 1–2 month febrile infants."
                  : "High-risk features present — hospitalize and treat empirically."}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PEDS RESUSCITATION
// ═══════════════════════════════════════════════════════════════════════════
function ResusTab() {
  const [weight, setWeight] = useState("");
  const wt = parseFloat(weight) || 0;

  const drugs = wt > 0 ? [
    { name:"Epinephrine (cardiac arrest)",     dose:"0.01 mg/kg IV/IO",  calc:`${(wt * 0.01).toFixed(2)} mg`,  note:"Max 1 mg; q3–5 min. 1:10,000 solution = 0.1 mL/kg" },
    { name:"Atropine",                         dose:"0.02 mg/kg IV/IO",  calc:`${(wt * 0.02).toFixed(2)} mg`,  note:"Min 0.1 mg, max 0.5 mg/dose. For bradycardia with poor perfusion." },
    { name:"Adenosine (SVT)",                  dose:"0.1 mg/kg IV rapid",calc:`${(wt * 0.1).toFixed(2)} mg`,   note:"Max 6 mg. Flush rapidly. Double to 0.2 mg/kg if no response (max 12 mg)." },
    { name:"Amiodarone (VF/pVT)",              dose:"5 mg/kg IV/IO",     calc:`${(wt * 5).toFixed(0)} mg`,     note:"Max 300 mg. Infuse over 20–60 min (not in arrest). Repeat up to 3 doses." },
    { name:"Lidocaine (VF/pVT alt)",           dose:"1 mg/kg IV/IO",     calc:`${(wt * 1).toFixed(1)} mg`,     note:"Alternative to amiodarone. Max 100 mg bolus." },
    { name:"Calcium chloride",                 dose:"20 mg/kg IV/IO",    calc:`${(wt * 20).toFixed(0)} mg`,    note:"Max 2 g. For hypocalcemia, hyperkalemia, CCB toxicity. Give slowly." },
    { name:"Dextrose (D10W)",                  dose:"2–4 mL/kg IV",      calc:`${(wt * 2).toFixed(0)}–${(wt * 4).toFixed(0)} mL`,note:"D10W preferred in neonates; D25W for infants; D50W in adolescents" },
    { name:"Sodium bicarbonate",               dose:"1 mEq/kg IV",       calc:`${(wt * 1).toFixed(1)} mEq`,   note:"Dilute to 4.2% (0.5 mEq/mL) for neonates and infants" },
    { name:"Naloxone (opioid reversal)",       dose:"0.01 mg/kg IV/IM",  calc:`${(wt * 0.01).toFixed(3)} mg`, note:"Titrate to respirations. IN: 0.1 mg/kg (max 4 mg)" },
    { name:"Midazolam (seizure)",              dose:"0.2 mg/kg IN/IM",   calc:`${(wt * 0.2).toFixed(2)} mg`,  note:"Max 10 mg. IV 0.1 mg/kg (max 4 mg). IM/IN preferred out-of-hospital." },
    { name:"Lorazepam (seizure, IV)",          dose:"0.1 mg/kg IV",      calc:`${(wt * 0.1).toFixed(2)} mg`,  note:"Max 4 mg/dose. Repeat q5 min × 2 if no response." },
    { name:"Normal saline (fluid resus)",      dose:"20 mL/kg IV/IO",    calc:`${(wt * 20).toFixed(0)} mL`,   note:"Septic shock: 10–20 mL/kg aliquots. Max 60 mL/kg then reassess." },
    { name:"RSI: Ketamine",                    dose:"1–2 mg/kg IV",      calc:`${(wt * 1).toFixed(0)}–${(wt * 2).toFixed(0)} mg`, note:"Preferred induction for peds RSI. IM 4–5 mg/kg if no IV access." },
    { name:"RSI: Succinylcholine",             dose:"2 mg/kg IV (< 10 kg)",calc:`${(wt * 2).toFixed(0)} mg`, note:"< 10 kg use 2 mg/kg; > 10 kg use 1.5 mg/kg. Premedicate with atropine if < 1 year." },
    { name:"RSI: Rocuronium",                  dose:"1.2 mg/kg IV",      calc:`${(wt * 1.2).toFixed(0)} mg`,  note:"RSI dose. Suggest-dose reversal: sugammadex 16 mg/kg IV." },
  ] : [];

  const defibrillation = wt > 0 ? [
    { label:"Initial shock (VF/pVT)", dose:"2 J/kg", calc:`${(wt * 2).toFixed(0)} J` },
    { label:"Second shock",           dose:"4 J/kg", calc:`${(wt * 4).toFixed(0)} J` },
    { label:"Subsequent shocks",      dose:"4–10 J/kg", calc:`${(wt * 4).toFixed(0)}–${Math.min(wt * 10, 200).toFixed(0)} J (max 200 J)` },
    { label:"Synchronized cardioversion (SVT)", dose:"0.5–1 J/kg", calc:`${(wt * 0.5).toFixed(0)}–${(wt * 1).toFixed(0)} J` },
  ] : [];

  return (
    <div className="peds-in">
      <Card color={T.green} title="Patient Weight (kg) — All Doses Weight-Based">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="kg"
            style={{ width:120, padding:"10px 12px",
              background:"rgba(6,20,25,0.9)",
              border:`1px solid ${weight ? T.green+"55" : "rgba(20,80,70,0.4)"}`,
              borderRadius:8, outline:"none",
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:24, fontWeight:900, color:T.green }} />
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt4, lineHeight:1.6 }}>
            Enter weight from Broselow tape or age-based estimate.
            Doses calculated to one decimal place.
          </div>
        </div>
      </Card>

      {wt > 0 && (
        <>
          {/* Defibrillation */}
          <Card color={T.coral} title="Defibrillation / Cardioversion">
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:7 }}>
              {defibrillation.map(d => (
                <div key={d.label} style={{ padding:"8px 10px", borderRadius:8,
                  background:"rgba(255,92,92,0.07)",
                  border:"1px solid rgba(255,92,92,0.25)" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt3, marginBottom:3 }}>{d.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:14, fontWeight:700, color:T.coral }}>{d.calc}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4 }}>{d.dose}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Drug table */}
          <Card color={T.green} title="PALS Weight-Based Drug Dosing">
            {drugs.map((d, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start",
                gap:10, padding:"7px 0",
                borderBottom:i < drugs.length - 1 ? "1px solid rgba(20,80,70,0.25)" : "none" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:11.5, color:T.txt2 }}>{d.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt4, marginTop:1 }}>{d.note}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:13, fontWeight:700, color:T.green }}>
                    {d.calc}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.txt4 }}>{d.dose}</div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PEDIATRIC SCORING
// ═══════════════════════════════════════════════════════════════════════════
const WESTLEY_ITEMS = [
  { key:"stridor",    label:"Stridor",       opts:[{v:0,l:"None"},{v:1,l:"With agitation"},{v:2,l:"At rest"}] },
  { key:"retraction", label:"Retractions",   opts:[{v:0,l:"None"},{v:1,l:"Mild"},{v:2,l:"Moderate"},{v:3,l:"Severe"}] },
  { key:"air",        label:"Air Entry",     opts:[{v:0,l:"Normal"},{v:1,l:"Decreased"},{v:2,l:"Markedly decreased"}] },
  { key:"cyanosis",   label:"Cyanosis",      opts:[{v:0,l:"None"},{v:4,l:"With agitation"},{v:5,l:"At rest"}] },
  { key:"conscious",  label:"Consciousness", opts:[{v:0,l:"Normal"},{v:5,l:"Altered"}] },
];

function ScoringTab() {
  const [westley, setWestley] = useState({});

  const wsTotal = Object.values(westley).reduce((s, v) => s + (v||0), 0);
  const wsSet   = Object.keys(westley).length > 0;

  const wsStrata = wsTotal <= 2
    ? { label:"Mild Croup", color:T.teal, tx:"Dexamethasone 0.6 mg/kg PO (max 10 mg) — single dose. Cool mist air (unproven but harmless). Discharge with return precautions." }
    : wsTotal <= 5
    ? { label:"Moderate Croup", color:T.gold, tx:"Dexamethasone 0.6 mg/kg PO/IM/IV. Nebulized racemic epinephrine 0.5 mL of 2.25% in 3 mL NS. Observe 2–4h post-epinephrine for rebound." }
    : { label:"Severe Croup", color:T.coral, tx:"Nebulized racemic epinephrine NOW + dexamethasone. Heliox 70:30 if available. ICU. Prepare for intubation (smaller ETT than expected)." };

  return (
    <div className="peds-in">
      {/* Westley Croup Score */}
      <Card color={T.teal} title="Westley Croup Score">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4 }}>
            Total score 0–17. Validated for croup severity.
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:44, fontWeight:900,
            color:wsSet ? wsStrata.color : T.txt4, lineHeight:1 }}>
            {wsTotal}
          </div>
        </div>
        {WESTLEY_ITEMS.map(item => (
          <div key={item.key} style={{ marginBottom:10 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:5 }}>{item.label}</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {item.opts.map(opt => (
                <button key={opt.v}
                  onClick={() => setWestley(p => ({ ...p, [item.key]:opt.v }))}
                  style={{ padding:"5px 11px", borderRadius:7,
                    cursor:"pointer", transition:"all .1s",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${westley[item.key]===opt.v ? T.teal+"66" : "rgba(20,80,70,0.4)"}`,
                    background:westley[item.key]===opt.v ? "rgba(0,212,180,0.12)" : "transparent",
                    color:westley[item.key]===opt.v ? T.teal : T.txt4 }}>
                  {opt.v} — {opt.l}
                </button>
              ))}
            </div>
          </div>
        ))}
        {wsSet && (
          <div style={{ padding:"10px 13px", borderRadius:9,
            background:`${wsStrata.color}09`,
            border:`1px solid ${wsStrata.color}35` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:wsStrata.color, marginBottom:4 }}>
              {wsStrata.label} (Score {wsTotal})
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2, lineHeight:1.6 }}>{wsStrata.tx}</div>
          </div>
        )}
      </Card>

      {/* Peds Appendicitis Score */}
      <Card color={T.orange} title="Pediatric Appendicitis Score (PAS) — Samuel 2002">
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:6 }}>
          {[
            { label:"Nausea / vomiting", pts:1 },
            { label:"Anorexia",          pts:1 },
            { label:"Fever > 38°C",      pts:1 },
            { label:"Cough / hop / percussion RLQ tenderness", pts:2 },
            { label:"RLQ tenderness",    pts:2 },
            { label:"Migration of pain to RLQ", pts:1 },
            { label:"Leukocytosis > 10,000", pts:1 },
            { label:"Leukocyte shift to left (PMN > 75%)", pts:1 },
          ].map((item, i) => (
            <div key={i} style={{ padding:"7px 9px", borderRadius:7,
              background:"rgba(255,159,67,0.07)",
              border:"1px solid rgba(255,159,67,0.22)",
              display:"flex", justifyContent:"space-between",
              alignItems:"center" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10.5, color:T.txt2 }}>{item.label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, fontWeight:700, color:T.orange }}>+{item.pts}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7,
          background:"rgba(6,20,25,0.6)",
          border:"1px solid rgba(20,80,70,0.35)" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10.5, color:T.txt3, lineHeight:1.55 }}>
            <strong style={{ color:T.teal }}>≤ 3:</strong> Low risk — consider discharge with return precautions
            {" · "}
            <strong style={{ color:T.gold }}>4–6:</strong> US first — intermediate risk
            {" · "}
            <strong style={{ color:T.coral }}>≥ 7:</strong> Surgical consult — high risk (PPV ~72%)
          </div>
        </div>
      </Card>

      {/* Bronchiolitis severity */}
      <Card color={T.blue} title="Bronchiolitis Severity Assessment — AAP 2014">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
          {[
            { label:"Mild",     color:T.teal,  items:["SpO2 ≥ 95% on RA","Minimal retractions","Good air entry","Alert, tolerating feeds"] },
            { label:"Moderate", color:T.gold,  items:["SpO2 90–94% on RA","Moderate retractions","Decreased air entry","Mildly reduced PO intake"] },
            { label:"Severe",   color:T.coral, items:["SpO2 < 90% on RA","Severe retractions","Nasal flaring / grunting","Not tolerating PO"] },
          ].map(s => (
            <div key={s.label} style={{ padding:"8px 10px", borderRadius:8,
              background:`${s.color}08`, border:`1px solid ${s.color}28` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:s.color, marginBottom:5 }}>
                {s.label}
              </div>
              {s.items.map((item, i) => (
                <div key={i} style={{ display:"flex", gap:5,
                  marginBottom:3 }}>
                  <span style={{ color:s.color, fontSize:7, marginTop:3 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt3 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7,
          background:"rgba(77,166,255,0.07)",
          border:"1px solid rgba(77,166,255,0.25)" }}>
          <Bullet text="AAP 2014: High-flow NC oxygen, NG feeds — supportive care only for most" color={T.blue} />
          <Bullet text="Hypertonic saline 3% neb: modest benefit in inpatients, not clearly beneficial in ED" color={T.blue} />
          <Bullet text="Albuterol, epinephrine, steroids, antibiotics: NOT recommended routinely" color={T.blue} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function PedsHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("vitals");

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
                background:"rgba(3,13,15,0.8)",
                border:"1px solid rgba(20,80,70,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(3,13,15,0.95)",
                border:"1px solid rgba(20,80,70,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.mint, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>PEDS</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(61,255,160,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-peds"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Pediatric Emergency Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Broselow Weight Estimation · Age-Specific Vitals · PECARN Head CT ·
              Fever Workup · Rochester Criteria · PALS Drug Dosing · Westley Croup
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(6,20,25,0.85)",
          border:"1px solid rgba(20,80,70,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(20,80,70,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "vitals"  && <VitalsTab />}
        {tab === "pecarn"  && <PECARNTab />}
        {tab === "fever"   && <FeverTab />}
        {tab === "resus"   && <ResusTab />}
        {tab === "scoring" && <ScoringTab />}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA PEDIATRIC HUB · PECARN (KUPPERMANN 2009) · ROCHESTER CRITERIA
            · PALS 2020 · WESTLEY 1978 · AAP 2014 · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}