import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("dvt-fonts")) return;
  const l = document.createElement("link");
  l.id = "dvt-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dvt-css";
  s.textContent = `
    @keyframes dvt-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .dvt-in{animation:dvt-in .18s ease forwards}
    @keyframes shimmer-dvt{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-dvt{background:linear-gradient(90deg,#f0f4ff 0%,#4da6ff 40%,#00d4b4 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-dvt 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#030a12", panel:"#071422",
  txt:"#e8f4ff", txt2:"#a0c8e8", txt3:"#5a98cc", txt4:"#2d6090",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
};

const TABS = [
  { id:"wells",   label:"Wells DVT Score",    icon:"📐", color:T.blue   },
  { id:"doac",    label:"Anticoagulation",    icon:"💊", color:T.teal   },
  { id:"renal",   label:"Renal Dosing",       icon:"🔬", color:T.gold   },
  { id:"special", label:"Special Populations",icon:"⚠️", color:T.orange },
];

function Card({ color, title, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}07`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>{title}</div>}
      {children}
    </div>
  );
}

function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
        color:T.txt2, lineHeight:1.6 }}>{text}</span>
    </div>
  );
}

function Check({ label, pts, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9, width:"100%",
        padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
        border:"none", marginBottom:4, transition:"all .1s",
        background:checked ? `${color||T.blue}10` : "rgba(7,20,34,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.blue) : "rgba(20,60,100,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.blue) : "rgba(45,96,144,0.5)"}`,
        background:checked ? (color||T.blue) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#030a12", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div style={{ flex:1, fontFamily:"'DM Sans',sans-serif", fontWeight:600,
        fontSize:12, color:checked ? (color||T.blue) : T.txt2 }}>{label}</div>
      {pts !== undefined && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          fontWeight:700, color:color||T.blue, flexShrink:0 }}>
          {pts >= 0 ? "+" : ""}{pts}
        </span>
      )}
    </button>
  );
}

// ── Wells DVT ─────────────────────────────────────────────────────────────
const WELLS_ITEMS = [
  { key:"active_ca",  pts:1,  label:"Active cancer (treatment within 6 months or palliative)" },
  { key:"paralysis",  pts:1,  label:"Paralysis / paresis / plaster cast of lower extremity" },
  { key:"bedridden",  pts:1,  label:"Recently bedridden >3 days or major surgery within 4 weeks" },
  { key:"tenderness", pts:1,  label:"Localized tenderness along deep venous system" },
  { key:"swollen_leg",pts:1,  label:"Entire leg swollen" },
  { key:"calf_diff",  pts:1,  label:"Calf swelling >3 cm vs asymptomatic side (10 cm below tibial tuberosity)" },
  { key:"pitting",    pts:1,  label:"Pitting edema confined to symptomatic leg" },
  { key:"collateral", pts:1,  label:"Collateral superficial veins (non-varicose)" },
  { key:"prev_dvt",   pts:1,  label:"Previously documented DVT" },
  { key:"alt_dx",     pts:-2, label:"Alternative diagnosis at least as likely as DVT" },
];

function WellsTab() {
  const [items, setItems] = useState({});
  const toggle = k => setItems(p => ({ ...p, [k]:!p[k] }));
  const score = WELLS_ITEMS.reduce((s, i) => s + (items[i.key] ? i.pts : 0), 0);
  const anySet = Object.keys(items).length > 0;

  const strata = score <= 0
    ? { label:"Low Probability",      color:T.teal,  prev:"< 5%",
        rec:"D-dimer — negative rules out DVT. If positive or not available: bilateral proximal compression US." }
    : score <= 2
    ? { label:"Moderate Probability", color:T.gold,  prev:"17%",
        rec:"D-dimer — if negative, DVT excluded. If positive or unavailable: proximal compression ultrasound." }
    : { label:"High Probability",     color:T.coral, prev:"53%",
        rec:"Proceed directly to compression ultrasound. D-dimer not needed for diagnosis." };

  return (
    <div className="dvt-in">
      <Card color={T.blue} title="Wells DVT Score (Modified, 2003)">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
            Wells 1997, modified 2003. Validated in primary care and ED.
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52,
            fontWeight:900, color:anySet ? strata.color : T.txt4, lineHeight:1 }}>{score}</div>
        </div>
        {WELLS_ITEMS.map(item => (
          <Check key={item.key} label={item.label} pts={item.pts}
            checked={!!items[item.key]} onToggle={() => toggle(item.key)}
            color={item.pts < 0 ? T.coral : T.blue} />
        ))}
        {anySet && (
          <div style={{ marginTop:8, padding:"10px 13px", borderRadius:9,
            background:`${strata.color}0c`, border:`1px solid ${strata.color}44` }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:17, color:strata.color, marginBottom:4 }}>
              {strata.label} (DVT prevalence ~{strata.prev})
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{strata.rec}</div>
          </div>
        )}
      </Card>

      <Card color={T.teal} title="DVT Diagnosis by Type">
        {[
          { label:"Proximal DVT (popliteal, femoral, iliac)", color:T.coral,
            note:"Treat with anticoagulation. IVC filter only if anticoagulation absolutely contraindicated." },
          { label:"Distal DVT (calf veins)", color:T.gold,
            note:"Anticoagulate if symptomatic, bilateral, or risk factors for proximal extension. Otherwise serial US in 7 days." },
          { label:"Incidental DVT (found on CT/MRI)", color:T.blue,
            note:"Treat same as symptomatic if proximal. Distal: clinical judgment." },
          { label:"Upper extremity DVT", color:T.purple,
            note:"PE risk is real. Treat same as lower extremity — DOACs are reasonable." },
        ].map((item, i) => (
          <div key={i} style={{ padding:"8px 10px", borderRadius:8, marginBottom:6,
            background:`${item.color}09`, border:`1px solid ${item.color}28` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, color:item.color, marginBottom:3 }}>{item.label}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>{item.note}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Anticoagulation ───────────────────────────────────────────────────────
const DOAC_DATA = [
  {
    name:"Rivaroxaban", brand:"Xarelto", color:"#ff6b35",
    mechanism:"Direct Factor Xa inhibitor",
    vte:"15 mg BID × 21 days, then 20 mg QD with food. FDA approved.",
    halflife:"5–9h",
    renal:"Avoid if CrCl < 15 mL/min. Use with caution if CrCl 15–30.",
    reversal:"Andexanet alfa (approved). 4F-PCC off-label.",
    avoid:"CrCl < 15, significant hepatic impairment, pregnancy, antiphospholipid syndrome",
    pearls:"Most studied DOAC in VTE. Must be taken WITH food (20 mg dose especially). Single-drug approach — no parenteral bridging needed.",
  },
  {
    name:"Apixaban", brand:"Eliquis", color:"#4da6ff",
    mechanism:"Direct Factor Xa inhibitor",
    vte:"10 mg BID × 7 days, then 5 mg BID. FDA approved.",
    halflife:"12h",
    renal:"Avoid if CrCl < 15. Reduce to 2.5 mg BID if 2 of: age ≥80, wt ≤60 kg, Cr ≥1.5.",
    reversal:"Andexanet alfa (approved).",
    avoid:"CrCl < 15, significant hepatic impairment, pregnancy",
    pearls:"AMPLIFY trial. Fewest GI bleeds of all DOACs. Renal dosing less complex. Single-drug approach — no bridging.",
  },
  {
    name:"Dabigatran", brand:"Pradaxa", color:"#b06dff",
    mechanism:"Direct thrombin (Factor IIa) inhibitor",
    vte:"150 mg BID after 5–10 days of parenteral anticoagulation (bridging required).",
    halflife:"12–17h",
    renal:"Avoid if CrCl < 30 for VTE. 75 mg BID if CrCl 15–30 for AF.",
    reversal:"Idarucizumab (Praxbind) — specific reversal agent, approved.",
    avoid:"CrCl < 30 (VTE), mechanical heart valve, moderate-severe mitral stenosis",
    pearls:"Only DOAC with a specific reversal agent. Requires 5-day parenteral bridging. Higher GI bleed risk vs other DOACs.",
  },
  {
    name:"Edoxaban", brand:"Savaysa", color:"#3dffa0",
    mechanism:"Direct Factor Xa inhibitor",
    vte:"60 mg QD after 5–10 days parenteral anticoagulation. 30 mg QD if CrCl 15–50 or wt ≤60 kg.",
    halflife:"10–14h",
    renal:"Avoid if CrCl > 95 mL/min (paradoxically less effective). Avoid CrCl < 15.",
    reversal:"Andexanet alfa (approved). 4F-PCC off-label.",
    avoid:"CrCl > 95 (less effective), CrCl < 15, pregnancy",
    pearls:"HOKUSAI-VTE trial. Requires 5-day parenteral bridging. Unique CrCl >95 caveat makes it less practical in ED.",
  },
];

function AnticoagTab() {
  const [selected, setSelected] = useState("Apixaban");
  const doac = DOAC_DATA.find(d => d.name === selected);

  return (
    <div className="dvt-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {DOAC_DATA.map(d => (
          <button key={d.name} onClick={() => setSelected(d.name)}
            style={{ display:"flex", flexDirection:"column",
              padding:"9px 14px", borderRadius:9, cursor:"pointer", flex:1,
              transition:"all .12s",
              border:`1px solid ${selected===d.name ? d.color+"66" : d.color+"22"}`,
              background:selected===d.name ? `${d.color}12` : "transparent" }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:d.color }}>{d.name}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4 }}>{d.brand}</span>
          </button>
        ))}
      </div>

      {doac && (
        <div>
          {[
            { label:"VTE Treatment Dose",    val:doac.vte,       color:doac.color },
            { label:"Mechanism",             val:doac.mechanism, color:T.teal    },
            { label:"Half-life",             val:doac.halflife,  color:T.blue    },
            { label:"Renal Considerations",  val:doac.renal,     color:T.gold    },
            { label:"Reversal Agent",        val:doac.reversal,  color:T.purple  },
            { label:"Avoid In",              val:doac.avoid,     color:T.coral   },
          ].map(f => (
            <div key={f.label} style={{ padding:"8px 11px", borderRadius:8,
              marginBottom:6, background:`${f.color}08`,
              border:`1px solid ${f.color}25` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:f.color, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:4 }}>{f.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{f.val}</div>
            </div>
          ))}
          <div style={{ padding:"9px 12px", borderRadius:9,
            background:`${doac.color}09`, border:`1px solid ${doac.color}35` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:doac.color, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>💎 Pearl</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{doac.pearls}</div>
          </div>
        </div>
      )}

      <Card color={T.orange} title="LMWH — Enoxaparin (When DOAC Not Appropriate)">
        {[
          "Therapeutic dose: 1 mg/kg SQ q12h (or 1.5 mg/kg q24h for DVT without PE)",
          "CrCl < 30: reduce to 1 mg/kg q24h — check anti-Xa level",
          "Pregnancy: LMWH preferred throughout — DOACs cross the placenta",
          "Active cancer + VTE: LMWH OR DOAC (rivaroxaban/edoxaban) — comparable efficacy",
          "Obesity (>150 kg): weight-based dosing, anti-Xa monitoring recommended",
          "Reversal: protamine sulfate 1 mg per 1 mg enoxaparin (within 8h) — ~60% effective",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
      </Card>

      <Card color={T.blue} title="VTE Treatment Duration">
        {[
          { cause:"Provoked (transient risk — surgery, trauma, immobility)", dur:"3 months", color:T.teal },
          { cause:"Unprovoked first event (proximal DVT or PE)", dur:"3–6 months then reassess", color:T.gold },
          { cause:"Second unprovoked VTE", dur:"Long-term / indefinite", color:T.orange },
          { cause:"Active cancer (cancer-associated VTE)", dur:"Indefinite while cancer active", color:T.coral },
          { cause:"Antiphospholipid syndrome + VTE", dur:"Indefinite — warfarin preferred", color:T.red },
        ].map((d, i) => (
          <div key={i} style={{ display:"flex", gap:10, alignItems:"center",
            padding:"5px 0", borderBottom:i<4 ? "1px solid rgba(20,60,100,0.25)" : "none" }}>
            <div style={{ flex:1, fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3 }}>{d.cause}</div>
            <div style={{ padding:"3px 9px", borderRadius:6, flexShrink:0,
              background:`${d.color}12`, border:`1px solid ${d.color}35` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:d.color }}>{d.dur}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Renal Dosing ──────────────────────────────────────────────────────────
function RenalTab() {
  const [crcl, setCrCl] = useState("");
  const ccl = parseFloat(crcl) || 0;

  const recs = useMemo(() => {
    if (!ccl) return null;
    return [
      {
        drug:"Rivaroxaban", color:"#ff6b35",
        rec: ccl < 15 ? { status:"AVOID", note:"CrCl < 15 — avoid. No dose adjustment defined." }
          : ccl < 30  ? { status:"Caution", note:"CrCl 15–29: use with caution. Increased exposure. Monitor closely." }
          : { status:"Standard", note:"Standard dosing: 15 mg BID × 21d then 20 mg QD with food." },
      },
      {
        drug:"Apixaban", color:"#4da6ff",
        rec: ccl < 15 ? { status:"AVOID", note:"CrCl < 15 — avoid." }
          : { status:"Standard", note:"Standard dosing applies. Least renally eliminated DOAC (~27% renal clearance)." },
      },
      {
        drug:"Dabigatran", color:"#b06dff",
        rec: ccl < 30 ? { status:"AVOID (VTE)", note:"CrCl < 30: avoid for VTE treatment. For AF: 75 mg BID if CrCl 15–30." }
          : ccl < 50  ? { status:"Caution", note:"CrCl 30–50: use with caution. Higher dabigatran exposure. Most renally eliminated DOAC (~80%)." }
          : { status:"Standard", note:"Standard 150 mg BID." },
      },
      {
        drug:"Edoxaban", color:"#3dffa0",
        rec: ccl > 95 ? { status:"AVOID", note:"CrCl > 95 mL/min: AVOID — paradoxically less effective (increased clearance)." }
          : ccl < 15  ? { status:"AVOID", note:"CrCl < 15: avoid." }
          : ccl <= 50 ? { status:"Reduced", note:"CrCl 15–50: 30 mg QD (reduced from standard 60 mg QD)." }
          : { status:"Standard", note:"60 mg QD after 5–10 days LMWH bridging." },
      },
      {
        drug:"Enoxaparin (LMWH)", color:T.orange,
        rec: ccl < 30 ? { status:"Reduced", note:"CrCl < 30: 1 mg/kg SQ q24h. Check anti-Xa trough (target 0.5–1.0 IU/mL)." }
          : { status:"Standard", note:"1 mg/kg SQ q12h or 1.5 mg/kg q24h. No adjustment needed for CrCl ≥ 30." },
      },
    ];
  }, [ccl]);

  const statusColor = s =>
    s === "Standard" ? T.teal : s === "Reduced" ? T.gold
    : (s === "AVOID" || s === "AVOID (VTE)") ? T.red : T.orange;

  return (
    <div className="dvt-in">
      <Card color={T.gold} title="Enter CrCl (mL/min) — Cockcroft-Gault">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, marginBottom:8 }}>
          Use actual body weight (or adjusted if obese). CG: [(140−age) × wt(kg)] / [72 × Cr(mg/dL)] × 0.85 if female
        </div>
        <input type="number" value={crcl} onChange={e => setCrCl(e.target.value)}
          placeholder="mL/min"
          style={{ width:160, padding:"10px 12px",
            background:"rgba(7,20,34,0.9)",
            border:`1px solid ${crcl ? T.gold+"55" : "rgba(20,60,100,0.4)"}`,
            borderRadius:8, outline:"none",
            fontFamily:"'JetBrains Mono',monospace",
            fontSize:24, fontWeight:900, color:T.gold }} />
      </Card>

      {recs && recs.map(r => (
        <div key={r.drug} style={{ padding:"10px 12px", borderRadius:9,
          marginBottom:7, background:`${r.color}08`,
          border:`1px solid ${r.color}25` }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13, color:r.color }}>{r.drug}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, padding:"2px 9px", borderRadius:6,
              color:statusColor(r.rec.status),
              background:`${statusColor(r.rec.status)}12`,
              border:`1px solid ${statusColor(r.rec.status)}35` }}>
              {r.rec.status}
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt3, lineHeight:1.55 }}>{r.rec.note}</div>
        </div>
      ))}
    </div>
  );
}

// ── Special Populations ───────────────────────────────────────────────────
const POPULATIONS = [
  {
    label:"Pregnancy", icon:"🤰", color:T.purple,
    points:[
      "DOACs: CONTRAINDICATED in pregnancy — cross placenta, no safety data",
      "LMWH is the treatment of choice throughout pregnancy and postpartum",
      "Enoxaparin 1 mg/kg q12h. Anti-Xa monitoring q1–2 months (target peak 0.6–1.0 IU/mL)",
      "Warfarin: AVOID first trimester (teratogenic weeks 6–12) and near delivery. Safe in second trimester.",
      "Postpartum: warfarin or LMWH safe with breastfeeding. DOACs: limited data.",
      "IVC filter: only if anticoagulation truly contraindicated (e.g., peripartum hemorrhage)",
    ],
  },
  {
    label:"Active Cancer", icon:"🔬", color:T.orange,
    points:[
      "Cancer-associated VTE: DOAC (rivaroxaban or edoxaban) OR LMWH — comparable per SELECT-D and HOKUSAI-Cancer",
      "DOACs in cancer: slight increase in GI bleeds with rivaroxaban/edoxaban — caution in GI malignancy",
      "Apixaban: lower GI bleed signal — preferred for luminal GI cancer",
      "LMWH advantages: predictable absorption, no drug interactions, available if NPO",
      "Duration: indefinite while cancer active. Reassess annually.",
      "Thrombocytopenia: hold LMWH if platelets < 50,000. Reduce dose if 50,000–100,000.",
    ],
  },
  {
    label:"Antiphospholipid Syndrome", icon:"⚠️", color:T.red,
    points:[
      "TRAPS trial (2019): rivaroxaban inferior to warfarin in high-risk APS (triple positive)",
      "Warfarin is standard of care for APS — target INR 2–3",
      "DOACs should NOT be used in high-risk APS (triple positive or prior arterial thrombosis)",
      "Single-positive APS with first provoked VTE: discuss with hematology",
      "Catastrophic APS: anticoagulation + steroids + IVIG ± plasma exchange",
    ],
  },
  {
    label:"IVC Filter", icon:"🔧", color:T.blue,
    points:[
      "Absolute indication: acute VTE + absolute contraindication to anticoagulation",
      "Relative: recurrent VTE despite therapeutic anticoagulation; massive PE with right heart strain",
      "NOT indicated prophylactically without VTE diagnosis, or as supplement to anticoagulation",
      "Retrievable filters preferred — set plan for retrieval when anticoagulation resumable",
      "Resume anticoagulation as soon as safely possible — filter does NOT substitute for anticoagulation",
    ],
  },
  {
    label:"Bleeding / Reversal", icon:"🩸", color:T.coral,
    points:[
      "Major bleeding: life-threatening, >2g/dL Hgb drop, requires transfusion, or critical site (CNS, retroperitoneal)",
      "Stop anticoagulant. Supportive care (IVF, transfusion, interventional hemostasis).",
      "Rivaroxaban/apixaban/edoxaban: andexanet alfa 150 mg/min IV × 15–30 min + 120 mg/hr × 2h",
      "Dabigatran: idarucizumab 5g IV (two 2.5g vials) — immediate and complete reversal",
      "LMWH: protamine 1 mg per 1 mg enoxaparin (up to 50 mg), within 8h — partial (~60%) reversal",
      "4F-PCC 25–50 units/kg IV: useful when specific reversal not available or for warfarin",
    ],
  },
];

function SpecialTab() {
  const [active, setActive] = useState("Pregnancy");
  const pop = POPULATIONS.find(p => p.label === active);
  return (
    <div className="dvt-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {POPULATIONS.map(p => (
          <button key={p.label} onClick={() => setActive(p.label)}
            style={{ display:"flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:9, cursor:"pointer", flex:1,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${active===p.label ? p.color+"66" : p.color+"22"}`,
              background:active===p.label ? `${p.color}12` : "transparent",
              color:active===p.label ? p.color : T.txt4 }}>
            <span style={{ fontSize:12 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
      {pop && pop.points.map((pt, i) => (
        <Bullet key={i} text={pt} color={pop.color} />
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
export default function DVTHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("wells");
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7, fontFamily:"'DM Sans',sans-serif",
                fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:8,
                background:"rgba(3,10,18,0.8)",
                border:"1px solid rgba(20,60,100,0.5)",
                color:T.txt3, cursor:"pointer" }}>← Back to Hub</button>
            <h1 className="shimmer-dvt"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              DVT / VTE Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Wells DVT Score · DOAC Selection · Renal Dosing · Pregnancy
              · Cancer-Associated VTE · APS · IVC Filter · Reversal Agents
            </p>
          </div>
        )}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"6px",
          marginBottom:14, background:"rgba(7,20,34,0.85)",
          border:"1px solid rgba(20,60,100,0.4)", borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer", flex:1,
                justifyContent:"center", fontFamily:"'DM Sans',sans-serif",
                fontWeight:600, fontSize:12, transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(20,60,100,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {tab === "wells"   && <WellsTab />}
        {tab === "doac"    && <AnticoagTab />}
        {tab === "renal"   && <RenalTab />}
        {tab === "special" && <SpecialTab />}
        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DVT HUB · WELLS 2003 · 2023 ESC GUIDELINES
            · CLINICAL DECISION SUPPORT ONLY · INDIVIDUALIZE THERAPY
          </div>
        )}
      </div>
    </div>
  );
}