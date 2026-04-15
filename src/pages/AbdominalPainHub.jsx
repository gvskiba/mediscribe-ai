// AbdominalPainHub.jsx
// Integrated Abdominal Pain Evaluation Hub
//
// Clinical basis:
//   - Alvarado Score — appendicitis (Alvarado 1986, validated 2012 meta-analysis)
//   - BISAP Score — pancreatitis severity (Wu 2008, AJIM)
//   - Glasgow-Blatchford Score — upper GI bleed risk (Blatchford 2000)
//   - Rockall Score — post-endoscopy rebleed/mortality
//   - Tokyo Guidelines 2018 — cholangitis severity grading
//   - Reynolds' pentad, Charcot's triad, Murphy's sign
//   - ACEP must-not-miss: AAA, ectopic, mesenteric ischemia
//
// Route: /AbdominalPainHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("abd-fonts")) return;
  const l = document.createElement("link");
  l.id = "abd-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "abd-css";
  s.textContent = `
    @keyframes abd-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .abd-in{animation:abd-in .18s ease forwards}
    @keyframes shimmer-abd{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-abd{background:linear-gradient(90deg,#f0f4ff 0%,#ff9f43 40%,#ff6b6b 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-abd 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#060f0a", panel:"#0a160d",
  txt:"#eefff3", txt2:"#a8d4b4", txt3:"#6aaa80", txt4:"#3d7050",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  lime:"#a3ff6e",
};

const TABS = [
  { id:"danger",    label:"Danger Diagnoses", icon:"🚨", color:T.coral    },
  { id:"appendix",  label:"Appendicitis",     icon:"🔴", color:T.orange   },
  { id:"pancreas",  label:"Pancreatitis",     icon:"🟡", color:T.gold     },
  { id:"gibleed",   label:"GI Bleed",         icon:"🩸", color:T.red      },
  { id:"biliary",   label:"RUQ / Biliary",    icon:"🟢", color:T.teal     },
];

// ── Shared ─────────────────────────────────────────────────────────────────
function Card({ color, title, icon, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}07`,
      border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
          {icon && <span style={{ marginRight:5 }}>{icon}</span>}{title}
        </div>
      )}
      {children}
    </div>
  );
}

function Bullet({ text, sub, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7,
        marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && (
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function Check({ label, sub, pts, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9,
        width:"100%", padding:"8px 12px", borderRadius:8,
        cursor:"pointer", textAlign:"left", border:"none",
        marginBottom:4, transition:"all .1s",
        background:checked ? `${color||T.orange}10` : "rgba(10,22,13,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.orange) : "rgba(30,70,40,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.orange) : "rgba(61,112,80,0.5)"}`,
        background:checked ? (color||T.orange) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#060f0a", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.orange) : T.txt2 }}>
          {label}
        </div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
      {pts !== undefined && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:11, fontWeight:700, color:color||T.orange, flexShrink:0 }}>
          +{pts}
        </span>
      )}
    </button>
  );
}

function Result({ label, detail, color }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:`${color}0c`, border:`1px solid ${color}44`, marginTop:10 }}>
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:18, color, marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{detail}</div>
    </div>
  );
}

function NumIn({ label, value, onChange, color }) {
  return (
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
        marginBottom:4 }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", padding:"8px 10px",
          background:"rgba(10,22,13,0.9)",
          border:`1px solid ${value ? (color||T.orange)+"55" : "rgba(30,70,40,0.4)"}`,
          borderRadius:7, outline:"none",
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:18, fontWeight:700, color:color||T.orange }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — DANGER DIAGNOSES
// ═══════════════════════════════════════════════════════════════════════════
const QUADRANT_DX = {
  RUQ:  { color:T.teal,   dx:["Acute cholecystitis","Cholangitis","Hepatitis","Perforated duodenal ulcer","Liver abscess","Right lower lobe pneumonia","Budd-Chiari"] },
  LUQ:  { color:T.blue,   dx:["Splenic rupture","Splenic infarct","Gastric ulcer","Pancreatitis (tail)","Left lower lobe pneumonia","Rib fracture"] },
  RLQ:  { color:T.orange, dx:["Appendicitis","Ovarian torsion","Ectopic pregnancy","Meckel's diverticulum","Inguinal hernia","Psoas abscess","Crohn's disease","Cecal volvulus"] },
  LLQ:  { color:T.purple, dx:["Diverticulitis","Sigmoid volvulus","Ovarian torsion","Ectopic pregnancy","Inguinal hernia","Constipation","Ischemic colitis"] },
  DIFF: { color:T.coral,  dx:["AAA / aortic dissection","Mesenteric ischemia","Bowel obstruction","Perforated viscus","DKA","Bowel ischemia / volvulus","Peritonitis"] },
};

const MISS_DX = [
  { dx:"Ruptured AAA",            color:T.red,    icon:"💥",
    clue:"Triad: tearing back/flank pain + hypotension + pulsatile mass. Only 30% present with all three.",
    action:"Bedside POCUS for aortic diameter > 3 cm. Vascular surgery STAT. Do NOT delay for CT if unstable." },
  { dx:"Ectopic Pregnancy",       color:T.coral,  icon:"🤰",
    clue:"Any woman of reproductive age with abdominal/pelvic pain = quantitative beta-hCG + TVUS.",
    action:"Beta-hCG > 1500–2000 mIU/mL without IUP on TVUS = presumed ectopic. OB/GYN consult immediately." },
  { dx:"Mesenteric Ischemia",     color:T.orange, icon:"🩸",
    clue:"Pain out of proportion to exam. Risk: AF, aortic/valvular disease, hypercoagulable state, vasopressor use.",
    action:"CT angiography mesenteric vessels. Lactate (elevated late — do not use to rule out). Surgery/IR consult." },
  { dx:"Boerhaave Syndrome",      color:T.purple, icon:"⚡",
    clue:"Esophageal perforation — forceful vomiting + severe chest/epigastric pain. CXR: mediastinal air, pleural effusion.",
    action:"Upright CXR first. CT chest/abdomen with oral contrast. Thoracic surgery consult. NPO, broad-spectrum antibiotics." },
  { dx:"DKA with Abdominal Pain", color:T.gold,   icon:"🔬",
    clue:"Diffuse abdominal pain in DKA is often the DKA itself (pseudo-abdomen) — resolves with treatment.",
    action:"Check glucose, ketones, pH, anion gap first. Abdominal pain that persists after DKA treated = surgical evaluation." },
  { dx:"Adrenal Crisis",          color:T.blue,   icon:"⚠️",
    clue:"Vomiting, abdominal pain, hypotension + known Addison's, steroid withdrawal, or bilateral adrenal hemorrhage.",
    action:"Hydrocortisone 100 mg IV STAT. NS bolus. Check cortisol, ACTH (do not wait for results to treat)." },
];

function DangerTab() {
  const [quad, setQuad] = useState(null);

  return (
    <div className="abd-in">
      {/* Quadrant map */}
      <Card color={T.teal} title="Quadrant-Based Differential — Click to Expand">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          {[["RUQ","Right Upper"],["LUQ","Left Upper"],["RLQ","Right Lower"],["LLQ","Left Lower"]].map(([q,l]) => {
            const qd = QUADRANT_DX[q];
            return (
              <button key={q} onClick={() => setQuad(quad===q ? null : q)}
                style={{ padding:"10px 12px", borderRadius:9,
                  cursor:"pointer", textAlign:"left", border:"none",
                  transition:"all .12s",
                  background:quad===q ? `${qd.color}14` : "rgba(10,22,13,0.7)",
                  borderLeft:`4px solid ${qd.color}` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, fontWeight:700, color:qd.color,
                  marginBottom:5 }}>{l} ({q})</div>
                {quad === q
                  ? qd.dx.map((d, i) => (
                    <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:T.txt2, lineHeight:1.5,
                      display:"flex", gap:5, marginBottom:2 }}>
                      <span style={{ color:qd.color, fontSize:7,
                        marginTop:4 }}>▸</span>{d}
                    </div>
                  ))
                  : <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt4 }}>
                    {qd.dx.slice(0,3).join(" · ")}…
                  </div>
                }
              </button>
            );
          })}
        </div>
        <button onClick={() => setQuad(quad==="DIFF" ? null : "DIFF")}
          style={{ width:"100%", marginTop:7, padding:"10px 12px",
            borderRadius:9, cursor:"pointer", textAlign:"left", border:"none",
            background:quad==="DIFF" ? `${QUADRANT_DX.DIFF.color}12` : "rgba(10,22,13,0.7)",
            borderLeft:`4px solid ${QUADRANT_DX.DIFF.color}` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, fontWeight:700, color:T.coral,
            marginBottom:5 }}>Diffuse / Periumbilical / Poorly Localized</div>
          {quad === "DIFF"
            ? QUADRANT_DX.DIFF.dx.map((d,i) => (
              <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt2, lineHeight:1.5,
                display:"flex", gap:5, marginBottom:2 }}>
                <span style={{ color:T.coral, fontSize:7, marginTop:4 }}>▸</span>{d}
              </div>
            ))
            : <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10, color:T.txt4 }}>
              {QUADRANT_DX.DIFF.dx.slice(0,4).join(" · ")}…
            </div>
          }
        </button>
      </Card>

      {/* Must-not-miss */}
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:15, color:T.coral,
        margin:"4px 0 10px" }}>
        Must-Not-Miss Diagnoses
      </div>
      {MISS_DX.map((d, i) => (
        <div key={i} style={{ padding:"10px 13px", borderRadius:10,
          marginBottom:7, background:`${d.color}08`,
          border:`1px solid ${d.color}28` }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:5 }}>
            <span style={{ fontSize:16 }}>{d.icon}</span>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:d.color }}>
              {d.dx}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt3, lineHeight:1.55,
            marginBottom:4 }}>{d.clue}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:10.5, color:d.color, lineHeight:1.5,
            fontWeight:600 }}>→ {d.action}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — ALVARADO SCORE (appendicitis)
// ═══════════════════════════════════════════════════════════════════════════
const ALVARADO_ITEMS = [
  { key:"migration",  pts:1, label:"Migration of pain to RLQ",
    sub:"Patient reports pain starting periumbilical then moving to RLQ" },
  { key:"anorexia",   pts:1, label:"Anorexia",
    sub:"Loss of appetite since pain onset" },
  { key:"nausea",     pts:1, label:"Nausea or vomiting",
    sub:"Either nausea or vomiting present" },
  { key:"rlq_tender", pts:2, label:"Tenderness in RLQ",
    sub:"Right lower quadrant tenderness on palpation (+2 points)" },
  { key:"rebound",    pts:1, label:"Rebound tenderness",
    sub:"Increased pain on sudden release of pressure in RLQ" },
  { key:"temp",       pts:1, label:"Elevated temperature > 37.3°C (99.1°F)",
    sub:"Fever on initial assessment" },
  { key:"leuko",      pts:2, label:"Leukocytosis > 10,000 cells/µL",
    sub:"Elevated WBC on CBC (+2 points)" },
  { key:"shift",      pts:1, label:"Left shift (PMN > 75% or bands present)",
    sub:"Neutrophil predominance on differential" },
];

function AppendicitisTab() {
  const [items, setItems] = useState({});
  const [sex,   setSex]   = useState("M");
  const [age,   setAge]   = useState("");

  const score = ALVARADO_ITEMS.reduce((s, i) => s + (items[i.key] ? i.pts : 0), 0);
  const toggle = k => setItems(p => ({ ...p, [k]:!p[k] }));
  const checked = Object.keys(items).length > 0;

  const strata = score <= 4
    ? { label:"Low Risk (1–4)",         color:T.teal,   sens:"~80% sensitive",
        rec:"Appendicitis unlikely. Discharge with strict return precautions. Serial abdominal exams if borderline.",
        imaging:"CT not required if score ≤ 4 with low clinical suspicion. Observe and reassess." }
    : score <= 6
    ? { label:"Intermediate Risk (5–6)", color:T.gold,   sens:"~50% PPV",
        rec:"CT abdomen/pelvis with IV contrast (sensitivity 94%). Surgical consult.",
        imaging:"CT scan indicated. US first in pediatric females (radiation reduction)." }
    : { label:"High Risk (7–10)",         color:T.coral,  sens:"~93% PPV",
        rec:"Surgical consult immediately. CT confirms but should not delay surgery if peritoneal signs present.",
        imaging:"CT strongly positive predictive value. Proceed to OR without CT if clinical picture clear + unstable." };

  const ageNum = parseInt(age) || 0;
  const isFemale = sex === "F";
  const reprAge = isFemale && ageNum >= 15 && ageNum <= 50;

  return (
    <div className="abd-in">
      <Card color={T.orange} title="Alvarado Score (MANTRELS) — Appendicitis">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, lineHeight:1.5, maxWidth:320 }}>
            10-point score. Original 1986, validated in 2012 meta-analysis (24,000 patients).
            Sensitivity 72% and specificity 81% for score ≥ 7 in adults.
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:52, fontWeight:900, color:checked ? strata.color : T.txt4,
            lineHeight:1, minWidth:60, textAlign:"right" }}>
            {score}
          </div>
        </div>
        {ALVARADO_ITEMS.map(item => (
          <Check key={item.key} label={item.label} sub={item.sub} pts={item.pts}
            checked={!!items[item.key]} onToggle={() => toggle(item.key)}
            color={T.orange} />
        ))}
        {checked && <Result label={strata.label} color={strata.color}
          detail={`${strata.rec}\n\nImaging: ${strata.imaging}`} />}
      </Card>

      {/* Gynecologic considerations */}
      <Card color={T.purple} title="Patient-Specific Considerations">
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Sex</div>
            <div style={{ display:"flex", gap:5 }}>
              {[["M","Male"],["F","Female"]].map(([v,l]) => (
                <button key={v} onClick={() => setSex(v)}
                  style={{ flex:1, padding:"7px 0", borderRadius:7,
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    fontWeight:600, fontSize:11, transition:"all .1s",
                    border:`1px solid ${sex===v ? T.purple+"66" : "rgba(30,70,40,0.4)"}`,
                    background:sex===v ? "rgba(176,109,255,0.12)" : "transparent",
                    color:sex===v ? T.purple : T.txt4 }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <NumIn label="Age (years)" value={age}
              onChange={setAge} color={T.purple} />
          </div>
        </div>
        {reprAge && (
          <div style={{ padding:"8px 11px", borderRadius:8,
            background:"rgba(176,109,255,0.09)",
            border:"1px solid rgba(176,109,255,0.3)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:T.purple, marginBottom:5 }}>
              Female reproductive age — consider GYN pathology
            </div>
            <Bullet text="Quantitative beta-hCG to exclude ectopic pregnancy" color={T.purple} />
            <Bullet text="Pelvic US (TVUS preferred): ovarian torsion, tubo-ovarian abscess, ectopic" color={T.purple} />
            <Bullet text="Alvarado less reliable in females — CT or MRI preferred over clinical score alone" color={T.purple} />
            <Bullet text="MRI preferred in pregnant patients — no radiation" color={T.purple} />
          </div>
        )}
        {ageNum > 0 && ageNum < 15 && (
          <div style={{ padding:"8px 11px", borderRadius:8,
            background:"rgba(0,212,180,0.08)",
            border:"1px solid rgba(0,212,180,0.25)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:T.teal, marginBottom:5 }}>Pediatric Considerations</div>
            <Bullet text="PAS (Pediatric Appendicitis Score) may be preferred under 18" color={T.teal} />
            <Bullet text="US first (no radiation), CT if US non-diagnostic and high suspicion" color={T.teal} />
            <Bullet text="PECARN Low-Risk Criteria: no prior episodes, no tenderness at McBurney, no pain migration, no maximal tenderness — may avoid CT" color={T.teal} />
          </div>
        )}
        <div style={{ marginTop:8 }}>
          <Bullet text="Psoas sign: pain on passive extension of right hip — retrocecal appendix" color={T.orange} />
          <Bullet text="Obturator sign: pain on internal rotation of flexed right hip — pelvic appendix" color={T.orange} />
          <Bullet text="Rovsing sign: RLQ pain on palpation of LLQ — peritoneal irritation" color={T.orange} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — BISAP (pancreatitis)
// ═══════════════════════════════════════════════════════════════════════════
const SIRS_CRITERIA = [
  { key:"temp",  label:"Temp > 38°C or < 36°C" },
  { key:"hr",    label:"HR > 90 bpm" },
  { key:"rr",    label:"RR > 20 or PaCO2 < 32 mmHg" },
  { key:"wbc",   label:"WBC > 12,000 or < 4,000 or > 10% bands" },
];

const BISAP_ITEMS = [
  { key:"bun",      label:"BUN > 25 mg/dL",                sub:"On initial labs" },
  { key:"ams",      label:"Impaired mental status (GCS < 15)", sub:"Disorientation or altered mentation" },
  { key:"sirs",     label:"SIRS — 2 or more criteria",      sub:"See SIRS calculator below" },
  { key:"age60",    label:"Age > 60 years",                 sub:"" },
  { key:"pleural",  label:"Pleural effusion on imaging",    sub:"CXR or CT showing pleural fluid" },
];

function PancreatitisTab() {
  const [bisap, setBisap] = useState({});
  const [sirs,  setSirs]  = useState({});

  const sirsCount = Object.values(sirs).filter(Boolean).length;
  const sirsPos   = sirsCount >= 2;
  const toggleB   = k => setBisap(p => ({ ...p, [k]:!p[k] }));
  const toggleS   = k => setSirs(p => ({ ...p, [k]:!p[k] }));

  // Auto-sync SIRS into BISAP
  const bisapWithSirs = { ...bisap, sirs: sirsPos };
  const score = BISAP_ITEMS.reduce((s, i) => s + (bisapWithSirs[i.key] ? 1 : 0), 0);
  const checked = Object.keys(bisap).length > 0 || Object.keys(sirs).length > 0;

  const strata = score <= 2
    ? { label:"Low Severity (0–2)", color:T.teal,
        mort:"< 1%",
        rec:"Ward admission. IV fluids (Lactated Ringer preferred over NS). Analgesia. Diet advance as tolerated." }
    : score === 3
    ? { label:"Moderate Severity (3)", color:T.gold,
        mort:"5–8%",
        rec:"Step-down unit. Aggressive fluid resuscitation. Surgical/GI consult. NPO, NG if vomiting." }
    : { label:"High Severity (4–5)", color:T.coral,
        mort:"Up to 22%",
        rec:"ICU admission. Aggressive IVF (250–500 mL/hr LR). Early enteral nutrition (NJ tube > TPN). GI/surgery consult." };

  return (
    <div className="abd-in">
      {/* SIRS calculator */}
      <Card color={T.gold} title="SIRS Criteria — Required for BISAP">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8 }}>
          BISAP requires ≥ 2 SIRS criteria. SIRS positive = +1 BISAP point.
        </div>
        {SIRS_CRITERIA.map(c => (
          <Check key={c.key} label={c.label}
            checked={!!sirs[c.key]} onToggle={() => toggleS(c.key)}
            color={T.gold} />
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:8,
          marginTop:6, padding:"6px 10px", borderRadius:7,
          background:sirsPos ? "rgba(245,200,66,0.1)" : "rgba(10,22,13,0.5)",
          border:`1px solid ${sirsPos ? "rgba(245,200,66,0.35)" : "rgba(30,70,40,0.3)"}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:14, fontWeight:700,
            color:sirsPos ? T.gold : T.txt4 }}>
            {sirsCount}/4
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:sirsPos ? T.gold : T.txt4 }}>
            {sirsPos ? "SIRS positive — +1 BISAP point" : "SIRS negative (< 2 criteria)"}
          </span>
        </div>
      </Card>

      {/* BISAP */}
      <Card color={T.orange} title="BISAP Score — Pancreatitis Severity">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4 }}>
            Wu et al. 2008 — predicts in-hospital mortality.
            Comparable accuracy to Ranson criteria with fewer data points.
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:52, fontWeight:900,
            color:checked ? strata.color : T.txt4, lineHeight:1 }}>
            {score}
          </div>
        </div>
        {BISAP_ITEMS.map(item => (
          <div key={item.key}>
            {item.key === "sirs"
              ? (
                <div style={{ padding:"8px 12px", borderRadius:8,
                  marginBottom:4,
                  background:sirsPos ? "rgba(245,200,66,0.1)" : "rgba(10,22,13,0.7)",
                  borderLeft:`3px solid ${sirsPos ? T.gold : "rgba(30,70,40,0.4)"}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:17, height:17, borderRadius:4,
                      background:sirsPos ? T.gold : "transparent",
                      border:`2px solid ${sirsPos ? T.gold : "rgba(61,112,80,0.5)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {sirsPos && <span style={{ color:"#060f0a", fontSize:9, fontWeight:900 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                        fontSize:12, color:sirsPos ? T.gold : T.txt2 }}>
                        SIRS ≥ 2 criteria
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:10, color:T.txt4 }}>
                        {sirsPos ? `${sirsCount} criteria met (auto-populated from SIRS calculator above)` : "Set in SIRS calculator above"}
                      </div>
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:11, fontWeight:700, color:T.gold, marginLeft:"auto" }}>
                      +1
                    </span>
                  </div>
                </div>
              )
              : (
                <Check label={item.label} sub={item.sub} pts={1}
                  checked={!!bisap[item.key]} onToggle={() => toggleB(item.key)}
                  color={T.orange} />
              )}
          </div>
        ))}
        {checked && <Result label={`${strata.label} — ${strata.mort} mortality`}
          color={strata.color} detail={strata.rec} />}
      </Card>

      {/* Management */}
      <Card color={T.teal} title="Pancreatitis Management Protocol">
        {[
          { t:"IV Fluids", c:T.teal, steps:[
            "Lactated Ringer preferred over NS — reduced SIRS and organ failure (Di Caro 2011)",
            "250–500 mL/hr initially; target urine output > 0.5 mL/kg/hr",
            "Reassess q4–6h — avoid fluid overload in cardiac/renal compromise",
          ]},
          { t:"Nutrition", c:T.gold, steps:[
            "Early enteral nutrition (within 24–48h) via NG/NJ tube for moderate-severe pancreatitis",
            "NJ tube preferred over NG (bypasses pancreatic stimulation) — but both acceptable",
            "TPN only if enteral route truly not feasible",
            "Mild pancreatitis: advance diet as tolerated — no benefit from prolonged NPO",
          ]},
          { t:"Etiology Workup", c:T.orange, steps:[
            "ETOH: most common — ask specifically, consider CIWA",
            "Gallstones: RUQ US on all patients — ERCP within 24h if cholangitis suspected",
            "Triglycerides > 1000 mg/dL: insulin infusion, plasmapheresis for very high levels",
            "ERCP-induced: expectant unless cholangitis develops",
            "Drug-induced: discontinue offending agent",
          ]},
        ].map((s, i) => (
          <div key={i} style={{ padding:"9px 11px", borderRadius:9,
            marginBottom:7, background:`${s.c}07`,
            border:`1px solid ${s.c}22`, borderLeft:`3px solid ${s.c}` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:s.c, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:6 }}>{s.t}</div>
            {s.steps.map((st, j) => <Bullet key={j} text={st} color={s.c} />)}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — GI BLEED
// Glasgow-Blatchford + Rockall
// ═══════════════════════════════════════════════════════════════════════════
function GIBleedTab() {
  // Glasgow-Blatchford
  const [gbBUN,   setGbBUN]   = useState("");
  const [gbHgbM,  setGbHgbM]  = useState("");
  const [gbHgbF,  setGbHgbF]  = useState("");
  const [gbSBP,   setGbSBP]   = useState("");
  const [gbSex,   setGbSex]   = useState("M");
  const [gbHR,    setGbHR]    = useState(false);
  const [gbMel,   setGbMel]   = useState(false);
  const [gbSync,  setGbSync]  = useState(false);
  const [gbLiver, setGbLiver] = useState(false);
  const [gbHF,    setGbHF]    = useState(false);

  const gbScore = useMemo(() => {
    let s = 0;
    const bun = parseFloat(gbBUN);
    const sbp = parseFloat(gbSBP);
    const hgb = parseFloat(gbSex === "M" ? gbHgbM : gbHgbF);

    if (!isNaN(bun)) {
      if (bun >= 70) s += 6;
      else if (bun >= 29) s += 4;
      else if (bun >= 23) s += 3;
      else if (bun >= 18) s += 2;
    }
    if (!isNaN(hgb)) {
      if (gbSex === "M") {
        if (hgb < 10)        s += 6;
        else if (hgb < 12)   s += 3;
        else if (hgb < 13)   s += 1;
      } else {
        if (hgb < 10)        s += 6;
        else if (hgb < 12)   s += 1;
      }
    }
    if (!isNaN(sbp)) {
      if (sbp < 90)        s += 3;
      else if (sbp < 100)  s += 2;
      else if (sbp < 110)  s += 1;
    }
    if (gbHR)    s += 1;
    if (gbMel)   s += 1;
    if (gbSync)  s += 2;
    if (gbLiver) s += 2;
    if (gbHF)    s += 2;
    return s;
  }, [gbBUN, gbHgbM, gbHgbF, gbSBP, gbSex, gbHR, gbMel, gbSync, gbLiver, gbHF]);

  const gbStrata = gbScore === 0
    ? { label:"Score 0 — Very Low Risk", color:T.teal,
        rec:"May consider outpatient management. Very low risk of requiring intervention. Arrange expedited GI follow-up." }
    : gbScore <= 3
    ? { label:`Score ${gbScore} — Low Risk`, color:T.gold,
        rec:"Hospital admission. Endoscopy within 24h. Not requiring urgent intervention in most cases." }
    : { label:`Score ${gbScore} — High Risk`, color:T.coral,
        rec:"Urgent endoscopy within 12h. IV PPI infusion. GI consult. ICU if hemodynamically unstable." };

  return (
    <div className="abd-in">
      <Card color={T.red} title="Upper vs Lower GI Bleed — Differentiation">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { label:"Upper GI Bleed", color:T.coral, clues:[
              "Melena (black tarry stool)",
              "Hematemesis / 'coffee grounds' emesis",
              "BUN:Cr ratio > 30 (intestinal absorption of blood)",
              "Hx: PUD, varices, NSAID use, EtOH",
            ]},
            { label:"Lower GI Bleed", color:T.orange, clues:[
              "Hematochezia (bright red or maroon rectal bleeding)",
              "Fresh blood per rectum",
              "Hx: diverticulosis, AVMs, IBD, colon cancer, hemorrhoids",
              "Note: massive UGIB can present with hematochezia",
            ]},
          ].map(s => (
            <div key={s.label} style={{ padding:"9px 11px", borderRadius:9,
              background:`${s.color}08`,
              border:`1px solid ${s.color}28` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:s.color,
                letterSpacing:1, marginBottom:6 }}>{s.label}</div>
              {s.clues.map((c, j) => <Bullet key={j} text={c} color={s.color} />)}
            </div>
          ))}
        </div>
      </Card>

      {/* Glasgow-Blatchford */}
      <Card color={T.red} title="Glasgow-Blatchford Score — Pre-Endoscopy Risk">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:10, lineHeight:1.5 }}>
          Blatchford 2000. Identifies patients needing endoscopic intervention.
          Score 0 has 99% NPV for need for intervention.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10, marginBottom:10 }}>
          <NumIn label="BUN (mg/dL)" value={gbBUN} onChange={setGbBUN} color={T.red} />
          <NumIn label="SBP (mmHg)"  value={gbSBP} onChange={setGbSBP} color={T.red} />
        </div>
        <div style={{ display:"flex", gap:7, marginBottom:10, alignItems:"flex-end" }}>
          <div style={{ flex:0.4 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Sex</div>
            <div style={{ display:"flex", gap:5 }}>
              {[["M","M"],["F","F"]].map(([v,l]) => (
                <button key={v} onClick={() => setGbSex(v)}
                  style={{ flex:1, padding:"7px 0", borderRadius:7,
                    cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    fontWeight:700, fontSize:12,
                    border:`1px solid ${gbSex===v ? T.red+"66" : "rgba(30,70,40,0.4)"}`,
                    background:gbSex===v ? "rgba(255,61,61,0.12)" : "transparent",
                    color:gbSex===v ? T.red : T.txt4 }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <NumIn label={`Hemoglobin (${gbSex === "M" ? "Male" : "Female"}) g/dL`}
              value={gbSex === "M" ? gbHgbM : gbHgbF}
              onChange={gbSex === "M" ? setGbHgbM : setGbHgbF}
              color={T.red} />
          </div>
        </div>
        {[
          { label:"Heart rate ≥ 100 bpm",    pts:1, val:gbHR,    set:setGbHR    },
          { label:"Melena",                   pts:1, val:gbMel,   set:setGbMel   },
          { label:"Syncope",                  pts:2, val:gbSync,  set:setGbSync  },
          { label:"Liver disease",            pts:2, val:gbLiver, set:setGbLiver },
          { label:"Heart failure",            pts:2, val:gbHF,    set:setGbHF    },
        ].map(c => (
          <Check key={c.label} label={c.label} pts={c.pts}
            checked={c.val} onToggle={() => c.set(p => !p)}
            color={T.red} />
        ))}
        <Result label={gbStrata.label} color={gbStrata.color}
          detail={gbStrata.rec} />
      </Card>

      {/* UGIB management */}
      <Card color={T.orange} title="UGIB Initial Management">
        {[
          "IV access × 2, type and screen/crossmatch, CBC, CMP, coags, LFTs",
          "IV PPI: pantoprazole 80 mg bolus → 8 mg/hr infusion (pre-endoscopy — reduces stigmata, not mortality)",
          "Octreotide 50 mcg IV bolus → 50 mcg/hr infusion if variceal bleed suspected",
          "Erythromycin 250 mg IV 30 min pre-endoscopy — improves gastric visualization",
          "FFP + platelets if INR > 1.5 or platelets < 50k before endoscopy",
          "TXA 1g IV if coagulopathic or massive bleed — controversial evidence in UGIB (unlike trauma)",
          "Avoid NG lavage for diagnosis — does not change management",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
      </Card>

      {/* Variceal pearls */}
      <Card color={T.purple} title="Variceal Bleed Specifics">
        {[
          "Octreotide reduces portal pressure — start immediately if suspected, continue 3–5 days",
          "Prophylactic antibiotics: ceftriaxone 1g IV q24h × 7 days (reduces SBP and mortality)",
          "Target Hgb 7–8 g/dL — restrictive transfusion strategy superior (TRICC trial in cirrhosis)",
          "Avoid octreotide + vasopressin combination — no additive benefit, more side effects",
          "TIPS (transjugular intrahepatic portosystemic shunt) for refractory or recurrent variceal bleed",
          "Balloon tamponade (Blakemore tube) only as bridge to definitive therapy — high complication rate",
        ].map((b, i) => <Bullet key={i} text={b} color={T.purple} />)}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — RUQ / BILIARY
// Tokyo 2018, Charcot, Reynolds, Murphy
// ═══════════════════════════════════════════════════════════════════════════
const TOKYO_GRADES = [
  { grade:"Grade I — Mild",
    color:T.teal,
    criteria:[
      "No organ dysfunction",
      "Mild local inflammation",
      "Responds to initial medical management",
    ],
    management:[
      "IV antibiotics (empiric broad-spectrum)",
      "Reassess at 6–12h",
      "Biliary drainage (ERCP or percutaneous) within 24–48h if no improvement",
    ],
  },
  { grade:"Grade II — Moderate",
    color:T.gold,
    criteria:[
      "No organ dysfunction",
      "WBC > 12,000 or < 4,000",
      "Fever > 39°C",
      "Age > 75",
      "Bilirubin ≥ 5 mg/dL",
      "Albumin < 0.7 × lower limit of normal",
    ],
    management:[
      "Urgent biliary drainage (ERCP/EUS) within 24h",
      "Broad-spectrum IV antibiotics: pip-tazo or meropenem + vancomycin if MRSA risk",
      "ICU monitoring if any deterioration",
    ],
  },
  { grade:"Grade III — Severe",
    color:T.coral,
    criteria:[
      "ANY organ dysfunction:",
      "Cardiovascular: SBP < 90 or vasopressor requirement",
      "Neurologic: altered mental status",
      "Respiratory: PaO2/FiO2 < 300",
      "Renal: creatinine > 2.0 mg/dL",
      "Hepatic: INR > 1.5",
      "Hematologic: platelets < 100,000",
    ],
    management:[
      "Emergency biliary drainage — ERCP or percutaneous within hours",
      "ICU admission",
      "Broad-spectrum antibiotics — meropenem + vancomycin",
      "Reynolds' pentad (fever + jaundice + RUQ pain + septic shock + AMS) = Grade III",
    ],
  },
];

function BiliaryTab() {
  const [tokyoG, setTokyoG] = useState(null);

  return (
    <div className="abd-in">
      {/* Clinical signs */}
      <Card color={T.teal} title="Classic Clinical Signs — RUQ Pathology">
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
          gap:7 }}>
          {[
            { label:"Murphy Sign", color:T.teal,
              desc:"Inspiratory arrest on deep palpation of RUQ. 65% sensitive, 87% specific for acute cholecystitis. Absent in gangrenous cholecystitis (nerve death)." },
            { label:"Charcot Triad", color:T.gold,
              desc:"Fever + RUQ pain + jaundice. Classic for ascending cholangitis. 50–70% sensitive — absence does NOT rule out cholangitis." },
            { label:"Reynolds Pentad", color:T.coral,
              desc:"Charcot triad + hypotension + altered mental status. = Suppurative / toxic cholangitis. Septic shock — Grade III Tokyo." },
            { label:"Courvoisier Sign", color:T.purple,
              desc:"Painless jaundice + palpable gallbladder. Suggests malignant obstruction (pancreatic head cancer, cholangiocarcinoma)." },
          ].map(s => (
            <div key={s.label} style={{ padding:"9px 11px", borderRadius:9,
              background:`${s.color}08`,
              border:`1px solid ${s.color}28` }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:12, color:s.color,
                marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tokyo grading */}
      <div style={{ fontFamily:"'Playfair Display',serif",
        fontWeight:700, fontSize:15, color:T.gold,
        margin:"4px 0 10px" }}>
        Tokyo Guidelines 2018 — Cholangitis Severity
      </div>
      {TOKYO_GRADES.map((g, i) => (
        <div key={i} style={{ marginBottom:7, borderRadius:10,
          overflow:"hidden",
          border:`1px solid ${tokyoG===i ? g.color+"55" : g.color+"22"}` }}>
          <button onClick={() => setTokyoG(tokyoG===i ? null : i)}
            style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", width:"100%",
              padding:"10px 13px", cursor:"pointer",
              border:"none", textAlign:"left",
              background:`linear-gradient(135deg,${g.color}0c,rgba(10,22,13,0.95))` }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:g.color }}>
              {g.grade}
            </span>
            <span style={{ color:T.txt4, fontSize:10 }}>
              {tokyoG===i ? "▲" : "▼"}
            </span>
          </button>
          {tokyoG === i && (
            <div style={{ display:"grid",
              gridTemplateColumns:"1fr 1fr", gap:10,
              padding:"9px 13px 12px",
              borderTop:`1px solid ${g.color}22` }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:g.color, letterSpacing:1.3,
                  textTransform:"uppercase", marginBottom:5 }}>Criteria</div>
                {g.criteria.map((c, j) => <Bullet key={j} text={c} color={g.color} />)}
              </div>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.teal, letterSpacing:1.3,
                  textTransform:"uppercase", marginBottom:5 }}>Management</div>
                {g.management.map((m, j) => <Bullet key={j} text={m} color={T.teal} />)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Cholecystitis management */}
      <Card color={T.teal} title="Acute Cholecystitis — Management">
        {[
          "NPO + IV fluids + analgesia (ketorolac 30mg IV + morphine/hydromorphone prn)",
          "IV antibiotics if complicated/severe: pip-tazo 4.5g IV q8h OR ceftriaxone + metronidazole",
          "Mild uncomplicated: antibiotics may not be needed — cholecystectomy is curative",
          "Cholecystectomy: laparoscopic preferred, within 72h of symptom onset (better outcomes than delayed)",
          "ERCP if choledocholithiasis suspected (dilated CBD > 8mm, elevated bili/ALP/GGT)",
          "Percutaneous cholecystostomy if too high risk for surgery",
        ].map((b, i) => <Bullet key={i} text={b} color={T.teal} />)}
        <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7,
          background:"rgba(245,200,66,0.07)",
          border:"1px solid rgba(245,200,66,0.25)" }}>
          <Bullet text="HIDA scan if US equivocal — > 35% ejection fraction = normal. < 35% = cholecystitis (acalculous)." color={T.gold} />
          <Bullet text="Acalculous cholecystitis in ICU patients — higher mortality, percutaneous drainage often first-line" color={T.gold} />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function AbdominalPainHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("danger");

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
                background:"rgba(6,15,10,0.8)",
                border:"1px solid rgba(30,70,40,0.5)",
                color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(6,15,10,0.95)",
                border:"1px solid rgba(30,70,40,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.lime, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontSize:10,
                  fontFamily:"'JetBrains Mono',monospace" }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>ABD PAIN</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,159,67,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-abd"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Abdominal Pain Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Alvarado · BISAP · Glasgow-Blatchford · Tokyo 2018 · AAA / Ectopic
              · Mesenteric Ischemia · Cholecystitis · GI Bleed Management
            </p>
          </div>
        )}

        <div style={{ display:"flex", gap:5, flexWrap:"wrap",
          padding:"6px", marginBottom:14,
          background:"rgba(10,22,13,0.85)",
          border:"1px solid rgba(30,70,40,0.4)",
          borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(30,70,40,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "danger"   && <DangerTab />}
        {tab === "appendix" && <AppendicitisTab />}
        {tab === "pancreas" && <PancreatitisTab />}
        {tab === "gibleed"  && <GIBleedTab />}
        {tab === "biliary"  && <BiliaryTab />}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA ABD PAIN HUB · ALVARADO 1986 · BISAP (WU 2008) · BLATCHFORD 2000
            · TOKYO GUIDELINES 2018 · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}