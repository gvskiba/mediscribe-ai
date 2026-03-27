import { useState } from "react";

const TNK_ABSOLUTE = [
  { id: "a1", label: "Any prior intracranial haemorrhage (ICH)" },
  { id: "a2", label: "Known structural cerebrovascular lesion (AVM / aneurysm)" },
  { id: "a3", label: "Known intracranial malignancy (primary or metastatic)" },
  { id: "a4", label: "Ischaemic stroke within 3 months" },
  { id: "a5", label: "Suspected aortic dissection" },
  { id: "a6", label: "Active bleeding / bleeding diathesis (excluding menses)" },
  { id: "a7", label: "Significant closed-head / facial trauma within 3 months" },
  { id: "a8", label: "Intracranial or intraspinal surgery within 2 months" },
  { id: "a9", label: "Severe uncontrolled HTN unresponsive to therapy (SBP > 180 / DBP > 110)" },
];
const TNK_RELATIVE = [
  { id: "r1",  label: "History of chronic, severe, poorly controlled hypertension" },
  { id: "r2",  label: "BP on presentation SBP > 180 or DBP > 110 (responding to Rx)" },
  { id: "r3",  label: "History of prior ischaemic stroke (> 3 months ago)" },
  { id: "r4",  label: "Dementia or known intracranial pathology not covered by absolute CIs" },
  { id: "r5",  label: "Traumatic or prolonged CPR (> 10 min) within 3 weeks" },
  { id: "r6",  label: "Major surgery within 3 weeks" },
  { id: "r7",  label: "Recent (2–4 weeks) internal bleeding (GI / GU)" },
  { id: "r8",  label: "Non-compressible vascular punctures" },
  { id: "r9",  label: "Active peptic ulcer disease" },
  { id: "r10", label: "Oral anticoagulant therapy (INR > 1.7 / therapeutic anticoagulation)" },
  { id: "r11", label: "Pregnancy" },
  { id: "r12", label: "Age > 75 years (dose-reduce: use 50% dose)" },
  { id: "r13", label: "Weight < 60 kg" },
];
const TNK_DOSING = [
  { weight: "< 60 kg",      dose: "30 mg", vol: "6 mL" },
  { weight: "60 – < 70 kg", dose: "35 mg", vol: "7 mL" },
  { weight: "70 – < 80 kg", dose: "40 mg", vol: "8 mL" },
  { weight: "80 – < 90 kg", dose: "45 mg", vol: "9 mL" },
  { weight: "≥ 90 kg",      dose: "50 mg", vol: "10 mL" },
];
const STEMI_WORKUP = [
  { icon: "⚡", time: "0 min",  label: "12-Lead ECG", detail: "Obtain & interpret within 10 min of arrival. Repeat if non-diagnostic. Right-sided (V3R–V4R) for RV MI; posterior (V7–V9) for posterior STEMI.", class1: true },
  { icon: "🧬", time: "0 min",  label: "High-Sensitivity Troponin (hs-cTn)", detail: "Draw at presentation + 1–3 h (ESC 0h/1h or 0h/2h rapid rule-out). Serial troponins if initial negative.", class1: true },
  { icon: "🩸", time: "0 min",  label: "Labs — STAT Panel", detail: "CBC, CMP, PT/INR, aPTT, BMP, LFTs, type & screen. BNP or NT-proBNP if HF concern.", class1: true },
  { icon: "📷", time: "0 min",  label: "Portable CXR", detail: "Assess for cardiomegaly, pulmonary oedema, widened mediastinum (r/o dissection). Do NOT delay reperfusion.", class1: true },
  { icon: "🔊", time: "ASAP",  label: "Bedside Echo (POCUS)", detail: "Assess LV function, wall-motion abnormalities, effusion, tamponade, or mechanical complications.", class1: false },
  { icon: "💉", time: "0 min",  label: "IV Access × 2 + Monitoring", detail: "Two large-bore IVs, continuous cardiac monitoring, pulse oximetry, BP every 5 min.", class1: true },
];
const STEMI_RX = [
  { cat: "Antiplatelet",    drug: "Aspirin (ASA)",           dose: "324 mg PO (chewed) loading dose — STAT",                              cor: "I",   loe: "A", note: "Give immediately unless true allergy." },
  { cat: "Antiplatelet",    drug: "Ticagrelor",              dose: "180 mg PO load → 90 mg BID maintenance",                              cor: "I",   loe: "B", note: "Preferred P2Y₁₂ inhibitor for STEMI (unless on OAC or high bleed risk)." },
  { cat: "Antiplatelet",    drug: "Prasugrel",               dose: "60 mg PO load → 10 mg daily (↓ to 5 mg if ≥ 75 y / < 60 kg)",        cor: "I",   loe: "B", note: "Do NOT use if prior TIA/stroke. Alternative to ticagrelor." },
  { cat: "Antiplatelet",    drug: "Clopidogrel",             dose: "600 mg PO load → 75 mg daily",                                        cor: "I",   loe: "B", note: "Use if ticagrelor/prasugrel unavailable or contraindicated." },
  { cat: "Anticoagulation", drug: "Unfractionated Heparin",  dose: "60 U/kg IV bolus (max 4,000 U) → 12 U/kg/h; goal aPTT 50–70 s",      cor: "I",   loe: "C", note: "Standard for primary PCI." },
  { cat: "Anticoagulation", drug: "Bivalirudin",             dose: "0.75 mg/kg IV bolus → 1.75 mg/kg/h",                                  cor: "IIa", loe: "A", note: "Reasonable alternative to UFH at PCI; lower bleeding risk." },
  { cat: "Anticoagulation", drug: "Enoxaparin",              dose: "1 mg/kg SQ BID (CrCl-based dosing if < 30 mL/min)",                   cor: "IIa", loe: "A", note: "Fibrinolysis adjunct or medical management." },
  { cat: "Reperfusion",     drug: "Primary PCI",             dose: "Door-to-Balloon ≤ 90 min (PCI-capable) / ≤ 120 min (transfer)",       cor: "I",   loe: "A", note: "Gold standard. Complete revascularisation recommended (Class I, 2025)." },
  { cat: "Reperfusion",     drug: "TNK (Tenecteplase)",      dose: "Weight-based IV bolus — see TNK calculator. Transfer to PCI centre within 3–24 h.", cor: "I", loe: "A", note: "If PCI unavailable within 120 min. Target door-to-needle ≤ 30 min." },
  { cat: "Adjunct",         drug: "β-Blocker (Metoprolol)",  dose: "25–50 mg PO q6–12h (avoid IV if HF/shock/HR < 60/PR > 0.24 s)",       cor: "I",   loe: "A", note: "Start within 24 h if no contraindications." },
  { cat: "Adjunct",         drug: "Statin (High-intensity)", dose: "Atorvastatin 80 mg PO or Rosuvastatin 40 mg PO — STAT",               cor: "I",   loe: "A", note: "Start regardless of baseline LDL. Target LDL < 55 mg/dL." },
  { cat: "Adjunct",         drug: "ACE-I / ARB",             dose: "Start within 24 h: Lisinopril 2.5–5 mg PO, titrate; EF < 40%",        cor: "I",   loe: "A", note: "Avoid in cardiogenic shock, CrCl < 30, K > 5.0." },
  { cat: "Adjunct",         drug: "Supplemental O₂",         dose: "Titrate to SpO₂ ≥ 94%. Do NOT give routinely if SpO₂ ≥ 94%.",         cor: "III", loe: "A", note: "Potential harm in normoxic patients (2025 guideline)." },
  { cat: "Adjunct",         drug: "Nitrates",                dose: "NTG 0.4 mg SL q5 min × 3 → IV drip if persistent pain",              cor: "IIa", loe: "C", note: "Symptom relief only. Avoid if SBP < 90, RV MI, or PDE5 use within 24–48 h." },
];
const NSTEMI_RX = [
  { cat: "Antiplatelet",    drug: "Aspirin",                 dose: "324 mg PO chewed — STAT",                                             cor: "I",   loe: "A", note: "" },
  { cat: "Antiplatelet",    drug: "Ticagrelor",              dose: "180 mg PO load → 90 mg BID",                                          cor: "I",   loe: "B", note: "Preferred unless OAC use or high HBR." },
  { cat: "Antiplatelet",    drug: "Clopidogrel",             dose: "600 mg PO load → 75 mg daily",                                        cor: "I",   loe: "B", note: "If ticagrelor unavailable." },
  { cat: "Anticoagulation", drug: "Enoxaparin",              dose: "1 mg/kg SQ BID; use 1 mg/kg daily if CrCl < 30",                      cor: "I",   loe: "A", note: "Preferred LMWH for NSTEMI." },
  { cat: "Anticoagulation", drug: "Fondaparinux",            dose: "2.5 mg SQ daily",                                                     cor: "I",   loe: "B", note: "Use if high bleeding risk. Do NOT use if CrCl < 20." },
  { cat: "Anticoagulation", drug: "UFH",                     dose: "60 U/kg IV bolus (max 4,000 U) → 12 U/kg/h",                          cor: "I",   loe: "C", note: "Use if invasive strategy planned soon." },
  { cat: "Reperfusion",     drug: "Urgent PCI (< 2 h)",     dose: "Refractory ischaemia, haemodynamic/electrical instability, cardiogenic shock", cor: "I", loe: "B", note: "IMMEDIATE — do not delay." },
  { cat: "Reperfusion",     drug: "Early Invasive (< 24 h)", dose: "GRACE score > 140, new STD, elevated hs-cTn",                         cor: "I",   loe: "A", note: "High-risk NSTEMI. Call cardiology immediately." },
  { cat: "Reperfusion",     drug: "Early Invasive (< 72 h)", dose: "GRACE 109–140 or any intermediate risk feature",                      cor: "IIa", loe: "B", note: "Can delay 24–72 h after initial stabilisation." },
  { cat: "Adjunct",         drug: "β-Blocker",               dose: "Metoprolol succinate 25–100 mg PO daily",                             cor: "I",   loe: "A", note: "Start early unless contraindicated." },
  { cat: "Adjunct",         drug: "High-Intensity Statin",   dose: "Atorvastatin 80 mg PO STAT",                                          cor: "I",   loe: "A", note: "Do not wait for lipid panel." },
  { cat: "Adjunct",         drug: "ACE-I / ARB",             dose: "Start before discharge; titrate to target",                           cor: "I",   loe: "A", note: "EF < 40%, DM, HTN, CKD." },
];
const COR_COLORS = {
  "I":   { bg: "rgba(0,229,192,.12)",   border: "rgba(0,229,192,.4)",   text: "var(--npi-teal,#00e5c0)" },
  "IIa": { bg: "rgba(59,158,255,.12)",  border: "rgba(59,158,255,.4)",  text: "var(--npi-blue,#3b9eff)" },
  "IIb": { bg: "rgba(245,200,66,.12)",  border: "rgba(245,200,66,.4)",  text: "var(--npi-gold,#f5c842)" },
  "III": { bg: "rgba(255,107,107,.12)", border: "rgba(255,107,107,.4)", text: "var(--npi-coral,#ff6b6b)" },
};

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bdhi: "#2a4f7a", blue: "#3b9eff", teal: "#00e5c0",
  gold: "#f5c842", coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

function CORBadge({ cor }) {
  const c = COR_COLORS[cor] || COR_COLORS["IIa"];
  return (
    <span style={{ fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"2px 7px",borderRadius:20,background:c.bg,border:`1px solid ${c.border}`,color:c.text,whiteSpace:"nowrap" }}>
      COR {cor}
    </span>
  );
}

function AlgorithmFlow({ acsType }) {
  const isSTEMI = acsType === "STEMI";
  const Arrow = () => (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
      <div style={{ width:2,height:14,background:T.bdhi }} />
      <div style={{ width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:`9px solid ${T.bdhi}` }} />
    </div>
  );
  const StartNode = ({ text, sub }) => (
    <div style={{ background:"rgba(155,109,255,.12)",border:"1px solid rgba(155,109,255,.35)",borderRadius:30,padding:"10px 28px",textAlign:"center",maxWidth:500 }}>
      <div style={{ fontSize:13,fontWeight:600,color:T.purple }}>{text}</div>
      <div style={{ fontSize:11,color:T.txt3,marginTop:3 }}>{sub}</div>
    </div>
  );
  const ActionNode = ({ text, items, badge, color }) => {
    const cc = color==="coral"?T.coral:color==="orange"?T.orange:T.blue;
    const bg = color==="coral"?"rgba(255,107,107,.07)":color==="orange"?"rgba(255,159,67,.07)":"rgba(59,158,255,.07)";
    const br = color==="coral"?"rgba(255,107,107,.3)":color==="orange"?"rgba(255,159,67,.3)":"rgba(59,158,255,.3)";
    return (
      <div style={{ background:bg,border:`1px solid ${br}`,borderRadius:10,padding:"11px 16px",maxWidth:500,width:"100%" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7 }}>
          <div style={{ fontSize:13,fontWeight:700,color:cc }}>{text}</div>
          {badge && <span style={{ fontSize:9,background:cc,color:"#000",borderRadius:20,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,whiteSpace:"nowrap" }}>{badge}</span>}
        </div>
        {items.map((it,j) => (
          <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:T.txt2,marginBottom:3 }}>
            <span style={{ color:cc,flexShrink:0,marginTop:1 }}>▸</span>{it}
          </div>
        ))}
      </div>
    );
  };
  const DecisionNode = ({ text, branches }) => (
    <div style={{ width:"100%",maxWidth:560 }}>
      <div style={{ background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.3)",borderRadius:10,padding:"9px 16px",textAlign:"center",marginBottom:8 }}>
        <div style={{ fontSize:12,fontWeight:700,color:T.gold }}>⬡ {text}</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:`repeat(${branches.length},1fr)`,gap:8 }}>
        {branches.map((b,j) => {
          const col = b.color==="coral"?T.coral:b.color==="orange"?T.orange:b.color==="teal"?T.teal:b.color==="gold"?T.gold:T.blue;
          const bg2 = b.color==="coral"?"rgba(255,107,107,.08)":b.color==="orange"?"rgba(255,159,67,.08)":b.color==="teal"?"rgba(0,229,192,.07)":b.color==="gold"?"rgba(245,200,66,.08)":"rgba(59,158,255,.08)";
          return (
            <div key={j} style={{ background:bg2,border:`1px solid ${col}40`,borderRadius:8,padding:"9px 10px",textAlign:"center" }}>
              {b.tag && <div style={{ fontSize:9,fontWeight:700,color:col,fontFamily:"'JetBrains Mono',monospace",marginBottom:4 }}>{b.tag}</div>}
              <div style={{ fontSize:11,color:T.txt2,lineHeight:1.45,whiteSpace:"pre-line" }}>{b.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
  const OutcomeNode = ({ text, sub, color }) => {
    const cc2 = color==="teal"?T.teal:T.blue;
    const bg4 = color==="teal"?"rgba(0,229,192,.08)":"rgba(59,158,255,.08)";
    const br4 = color==="teal"?"rgba(0,229,192,.3)":"rgba(59,158,255,.3)";
    return (
      <div style={{ background:bg4,border:`1px solid ${br4}`,borderRadius:10,padding:"10px 18px",maxWidth:500,width:"100%",textAlign:"center" }}>
        <div style={{ fontSize:13,fontWeight:700,color:cc2 }}>{text}</div>
        {sub && <div style={{ fontSize:11,color:T.txt3,marginTop:4,lineHeight:1.4 }}>{sub}</div>}
      </div>
    );
  };
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:0 }}>
      <StartNode text="Patient presents with chest pain / ACS symptoms" sub="Obtain history · Risk factors · Duration · Character" />
      <Arrow />
      <ActionNode text="Immediate Assessment" badge="0–10 min" color="blue" items={["12-lead ECG within 10 min","IV access × 2, O₂ monitoring","ASA 324 mg PO (if no allergy)","Vital signs, O₂ sat, pain scale"]} />
      <Arrow />
      <DecisionNode text="ECG Interpretation" branches={[
        { label:"ST Elevation ≥ 1 mm in ≥ 2 contiguous leads\nOR New LBBB", color:"coral", tag:"STEMI" },
        { label:"Normal / Non-diagnostic ECG\nSerial ECGs + hs-cTn", color:"blue", tag:"UA / Low Risk" },
        { label:"ST Depression / T-wave changes\nOR Transient STE", color:"orange", tag:"NSTE-ACS" },
      ]} />
      <Arrow />
      {isSTEMI ? <>
        <ActionNode text="STEMI Activation — Cath Lab Alert" badge="< 10 min from diagnosis" color="coral"
          items={["Activate STEMI protocol IMMEDIATELY","Cardiology consult STAT","ASA + P2Y₁₂ inhibitor loading doses","Anticoagulation (UFH or bivalirudin)","Continuous monitoring / defibrillator ready"]} />
        <Arrow />
        <DecisionNode text="PCI-capable centre available within 120 min?" branches={[
          { label:"Primary PCI\nDoor-to-balloon ≤ 90 min\n(≤ 120 min if transfer)", color:"teal", tag:"YES" },
          { label:"Fibrinolysis (TNK)\nDoor-to-needle ≤ 30 min\nTransfer to PCI centre 3–24 h", color:"gold", tag:"NO" },
        ]} />
        <Arrow />
        <OutcomeNode text="Complete Revascularisation (Class I — 2025)" sub="PCI of non-culprit arteries recommended (staged) — except cardiogenic shock" color="teal" />
      </> : <>
        <ActionNode text="NSTE-ACS Initial Management" badge="< 30 min" color="orange"
          items={["hs-cTn 0h + 1–3h serial","ASA + P2Y₁₂ inhibitor (ticagrelor preferred)","Anticoagulation (enoxaparin / fondaparinux / UFH)","GRACE / TIMI risk stratification","Continuous monitoring"]} />
        <Arrow />
        <DecisionNode text="Risk Stratification (GRACE Score)" branches={[
          { label:"HIGH RISK (GRACE > 140)\nUrgent / Early Invasive\n< 2–24 h catheterisation", color:"coral", tag:"HIGH" },
          { label:"LOW / INTER RISK\nSelective Invasive\nOptimise med therapy first", color:"blue", tag:"LOW/MED" },
        ]} />
        <Arrow />
        <OutcomeNode text="Angiography ± PCI / CABG" sub="Complete revascularisation recommended (Class I — 2025). Intracoronary imaging to guide PCI (Class I — 2025)." color="teal" />
      </>}
      <Arrow />
      <OutcomeNode text="Secondary Prevention & Discharge Planning" sub="DAPT ≥ 12 months · High-intensity statin · ACE-I/ARB · β-blocker · LDL < 55 mg/dL · Cardiac rehab referral" color="blue" />
      <div style={{ marginTop:12,alignSelf:"flex-end" }}>
        <span style={{ fontSize:9,color:T.txt4,fontFamily:"'JetBrains Mono',monospace" }}>Source: 2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline — Circulation. 2025;151(13):e771–e862</span>
      </div>
    </div>
  );
}

function MedTable({ rows }) {
  const cats = [...new Set(rows.map(r => r.cat))];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      {cats.map(cat => (
        <div key={cat}>
          <div style={{ fontSize:10,color:T.txt3,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700,marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${T.bd}` }}>{cat}</div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {rows.filter(r => r.cat===cat).map((rx,i) => (
              <div key={i} style={{ background:T.up,border:`1px solid ${T.bd}`,borderRadius:8,padding:"8px 12px",display:"grid",gridTemplateColumns:"160px 1fr auto",gap:10,alignItems:"start" }}>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:T.txt }}>{rx.drug}</div>
                  {rx.note && <div style={{ fontSize:10,color:T.txt3,marginTop:2 }}>{rx.note}</div>}
                </div>
                <div style={{ fontSize:12,color:T.txt2,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.4 }}>{rx.dose}</div>
                <CORBadge cor={rx.cor} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkupSection() {
  const [checked, setChecked] = useState({});
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
      {STEMI_WORKUP.map((w,i) => {
        const done = checked[w.icon+i];
        return (
          <div key={i} onClick={() => setChecked(p => ({...p,[w.icon+i]:!done}))}
            style={{ display:"grid",gridTemplateColumns:"32px 1fr auto",gap:10,alignItems:"center",background:done?"rgba(0,229,192,.05)":T.up,border:`1px solid ${done?"rgba(0,229,192,.3)":T.bd}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",transition:"all .2s" }}>
            <div style={{ width:28,height:28,borderRadius:8,background:done?"rgba(0,229,192,.15)":"rgba(59,158,255,.08)",border:`1px solid ${done?"rgba(0,229,192,.4)":"rgba(59,158,255,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>
              {done ? "✓" : w.icon}
            </div>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <span style={{ fontSize:12,fontWeight:600,color:done?T.teal:T.txt,textDecoration:done?"line-through":"none" }}>{w.label}</span>
                {w.class1 && <span style={{ fontSize:9,background:"rgba(0,229,192,.12)",color:T.teal,border:"1px solid rgba(0,229,192,.3)",borderRadius:20,padding:"1px 6px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700 }}>COR I</span>}
              </div>
              <div style={{ fontSize:11,color:T.txt3,marginTop:2 }}>{w.detail}</div>
            </div>
            <div style={{ fontSize:9,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap" }}>{w.time}</div>
          </div>
        );
      })}
    </div>
  );
}

function TNKChecker() {
  const [abs, setAbs] = useState({});
  const [rel, setRel] = useState({});
  const [weight, setWeight] = useState("");
  const [over75, setOver75] = useState(false);
  const [pciTime, setPciTime] = useState("");
  const absCount = Object.values(abs).filter(Boolean).length;
  const relCount = Object.values(rel).filter(Boolean).length;
  const pciMins  = parseInt(pciTime)||0;
  const pciDelay = pciMins > 120;
  const wt = parseFloat(weight);
  const doseRow = !isNaN(wt)&&wt>0 ? (wt<60?TNK_DOSING[0]:wt<70?TNK_DOSING[1]:wt<80?TNK_DOSING[2]:wt<90?TNK_DOSING[3]:TNK_DOSING[4]) : null;

  let rec="UNDETERMINED",recCol=T.txt3,recBg="rgba(74,106,138,.15)",recBr="rgba(74,106,138,.3)",recIcon="❓",recDetail="Complete the checklist and enter estimated PCI time to generate a recommendation.";
  if (absCount>0) { rec="CONTRAINDICATED";recCol=T.coral;recBg="rgba(255,107,107,.1)";recBr="rgba(255,107,107,.4)";recIcon="🚫";recDetail=`${absCount} absolute contraindication(s) present. TNK is CONTRAINDICATED. Pursue primary PCI regardless of availability time. Discuss with cardiology immediately.`; }
  else if (!pciTime) { rec="AWAITING DATA";recIcon="⏳";recDetail="Enter estimated minutes to PCI to complete recommendation."; }
  else if (!pciDelay) { rec="PCI PREFERRED";recCol=T.teal;recBg="rgba(0,229,192,.08)";recBr="rgba(0,229,192,.35)";recIcon="🏥";recDetail=`Estimated PCI time: ${pciMins} min (≤ 120 min). Primary PCI is PREFERRED. Do NOT administer TNK. Activate cath lab — door-to-balloon goal ≤ 90 min.`; }
  else if (relCount>=3) { rec="HIGH CAUTION";recCol=T.gold;recBg="rgba(245,200,66,.1)";recBr="rgba(245,200,66,.4)";recIcon="⚠️";recDetail=`PCI unavailable within 120 min AND ${relCount} relative contraindications. Weigh benefit vs. bleeding risk carefully. Senior physician / cardiology decision required. Document shared decision-making.`; }
  else { rec="TNK INDICATED";recCol=T.teal;recBg="rgba(0,229,192,.12)";recBr="rgba(0,229,192,.5)";recIcon="✅";const ds=doseRow?` Calculated dose: ${doseRow.dose} (${doseRow.vol}).${over75?" ⚠ Age > 75: consider 50% dose reduction — discuss with cardiology.":""}` : " Enter patient weight for dose calculation.";recDetail=`No absolute contraindications. PCI not available within 120 min (${pciMins} min). ${relCount>0?relCount+" relative CI(s) — document benefit/risk. ":""}TNK is INDICATED. Door-to-needle ≤ 30 min. Administer as IV bolus over 5–10 sec. Transfer to PCI centre within 3–24 h.${ds}`; }

  const inp = (val, set, ph, type="text", borderOverride) => (
    <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
      style={{ width:"100%",background:T.up,border:`1px solid ${borderOverride||T.bd}`,borderRadius:6,padding:"7px 10px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ background:recBg,border:`1.5px solid ${recBr}`,borderRadius:12,padding:"13px 16px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:7 }}>
          <span style={{ fontSize:22 }}>{recIcon}</span>
          <div>
            <div style={{ fontSize:10,color:T.txt3,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"'JetBrains Mono',monospace" }}>TNK Recommendation</div>
            <div style={{ fontSize:17,fontWeight:700,color:recCol,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".03em" }}>{rec}</div>
          </div>
        </div>
        <div style={{ fontSize:12,color:T.txt2,lineHeight:1.6 }}>{recDetail}</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Patient Weight (kg)</label>
          {inp(weight,setWeight,"Enter kg…","number")}
          {doseRow && <div style={{ marginTop:5,fontSize:11,color:T.teal,fontFamily:"'JetBrains Mono',monospace" }}>Dose: <strong>{doseRow.dose}</strong> ({doseRow.vol})</div>}
        </div>
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Est. Minutes to PCI</label>
          {inp(pciTime,setPciTime,"Enter minutes…","number",pciDelay&&pciTime?T.coral:undefined)}
          {pciTime && <div style={{ marginTop:5,fontSize:11,color:pciDelay?T.coral:T.teal,fontFamily:"'JetBrains Mono',monospace" }}>{pciDelay?"⚠ > 120 min — consider fibrinolysis":"✓ PCI preferred (≤ 120 min)"}</div>}
        </div>
        <div style={{ display:"flex",alignItems:"flex-end",paddingBottom:2 }}>
          <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:T.txt2 }}>
            <input type="checkbox" checked={over75} onChange={e=>setOver75(e.target.checked)} style={{ width:16,height:16,accentColor:T.teal,cursor:"pointer" }} />
            Age &gt; 75 years
          </label>
        </div>
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:T.txt2,marginBottom:6 }}>⚕ TNK Weight-Based Dosing <span style={{ fontSize:9,color:T.txt3,fontFamily:"'JetBrains Mono',monospace",marginLeft:6 }}>Single IV bolus over 5–10 sec</span></div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6 }}>
          {TNK_DOSING.map((d,i) => {
            const active = doseRow&&doseRow.dose===d.dose;
            return (
              <div key={i} style={{ background:active?"rgba(0,229,192,.12)":T.up,border:`1px solid ${active?"rgba(0,229,192,.5)":T.bd}`,borderRadius:8,padding:"8px 10px",textAlign:"center",transition:"all .2s" }}>
                <div style={{ fontSize:10,color:T.txt3,marginBottom:4 }}>{d.weight}</div>
                <div style={{ fontSize:14,fontWeight:700,color:active?T.teal:T.txt,fontFamily:"'JetBrains Mono',monospace" }}>{d.dose}</div>
                <div style={{ fontSize:10,color:T.txt3,marginTop:2 }}>{d.vol}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:6,fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace" }}>⚠ Age &gt; 75: consider 50% dose reduction · Reconstitute with sterile water only · Do NOT use dextrose-containing solutions</div>
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:T.coral,marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
          🚫 Absolute Contraindications <span style={{ fontSize:9,color:T.txt3,fontFamily:"'JetBrains Mono',monospace" }}>Any ONE = DO NOT give TNK</span>
          {absCount>0&&<span style={{ background:"rgba(255,107,107,.2)",color:T.coral,border:"1px solid rgba(255,107,107,.4)",borderRadius:20,padding:"1px 8px",fontSize:10,fontFamily:"'JetBrains Mono',monospace" }}>{absCount} present</span>}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {TNK_ABSOLUTE.map(c => {
            const on = abs[c.id];
            return (
              <label key={c.id} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?"rgba(255,107,107,.1)":T.up,border:`1px solid ${on?"rgba(255,107,107,.4)":T.bd}`,borderRadius:7,padding:"7px 12px",transition:"all .15s" }}>
                <input type="checkbox" checked={!!on} onChange={e=>setAbs(p=>({...p,[c.id]:e.target.checked}))} style={{ width:15,height:15,accentColor:T.coral,cursor:"pointer",flexShrink:0 }} />
                <span style={{ fontSize:12,color:on?T.coral:T.txt2 }}>{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize:11,fontWeight:700,color:T.gold,marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
          ⚠️ Relative Contraindications <span style={{ fontSize:9,color:T.txt3,fontFamily:"'JetBrains Mono',monospace" }}>Weigh risk vs. benefit — document discussion</span>
          {relCount>0&&<span style={{ background:"rgba(245,200,66,.15)",color:T.gold,border:"1px solid rgba(245,200,66,.4)",borderRadius:20,padding:"1px 8px",fontSize:10,fontFamily:"'JetBrains Mono',monospace" }}>{relCount} present</span>}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {TNK_RELATIVE.map(c => {
            const on = rel[c.id];
            return (
              <label key={c.id} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?"rgba(245,200,66,.08)":T.up,border:`1px solid ${on?"rgba(245,200,66,.35)":T.bd}`,borderRadius:7,padding:"7px 12px",transition:"all .15s" }}>
                <input type="checkbox" checked={!!on} onChange={e=>setRel(p=>({...p,[c.id]:e.target.checked}))} style={{ width:15,height:15,accentColor:T.gold,cursor:"pointer",flexShrink:0 }} />
                <span style={{ fontSize:12,color:on?T.gold:T.txt2 }}>{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div style={{ fontSize:10,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.6,padding:"10px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.bd}` }}>
        Reference: 2025 ACC/AHA/ACEP ACS Guideline · FDA TNKase Prescribing Information · AHA STEMI Guidelines COR I, LOE A<br/>
        ⚠ Clinical decision support only. Final prescribing decision rests with the treating physician.
      </div>
    </div>
  );
}

function CardiologyConsult() {
  const [consultTime, setConsultTime] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [cardiologist, setCardiologist] = useState("");
  const [consultMode, setConsultMode] = useState("phone");
  const [recommendation, setRecommendation] = useState("");
  const [plan, setPlan] = useState([{ id:1,text:"",done:false }]);
  const [saved, setSaved] = useState(false);
  const [disposition, setDisposition] = useState("");
  const [urgency, setUrgency] = useState("");
  const addItem = () => setPlan(p => [...p,{id:Date.now(),text:"",done:false}]);
  const removeItem = id => setPlan(p => p.filter(x=>x.id!==id));
  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
        {[
          { label:"Consult Time", value:consultTime||"—", icon:"📞", color:T.blue },
          { label:"Cardiologist", value:cardiologist||"—", icon:"🫀", color:T.teal },
          { label:"Urgency", value:urgency||"—", icon:"⚡", color:T.coral },
        ].map((s,i) => (
          <div key={i} style={{ background:T.up,border:`1px solid ${T.bd}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em" }}>{s.label}</div>
              <div style={{ fontSize:13,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        {[
          { label:"Time Cardiology Consulted", val:consultTime, set:setConsultTime },
          { label:"Time Cardiologist Called Back", val:callbackTime, set:setCallbackTime },
        ].map((f,i) => (
          <div key={i}>
            <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>{f.label}</label>
            <div style={{ display:"flex",gap:6 }}>
              <input type="time" value={f.val} onChange={e=>f.set(e.target.value)}
                style={{ flex:1,background:T.up,border:`1px solid ${T.bd}`,borderRadius:6,padding:"7px 10px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:13,outline:"none" }} />
              <button onClick={()=>f.set(nowTime())}
                style={{ background:"rgba(59,158,255,.15)",border:"1px solid rgba(59,158,255,.3)",borderRadius:6,padding:"0 10px",color:T.blue,fontSize:11,cursor:"pointer",whiteSpace:"nowrap" }}>Now</button>
            </div>
          </div>
        ))}
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Cardiologist Name</label>
          <input value={cardiologist} onChange={e=>setCardiologist(e.target.value)} placeholder="Dr. …"
            style={{ width:"100%",background:T.up,border:`1px solid ${T.bd}`,borderRadius:6,padding:"7px 10px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }} />
        </div>
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Consult Mode</label>
          <div style={{ display:"flex",gap:5 }}>
            {["phone","bedside","telemedicine"].map(m => (
              <button key={m} onClick={()=>setConsultMode(m)}
                style={{ flex:1,padding:"7px 0",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize",background:consultMode===m?"rgba(0,229,192,.15)":T.up,border:`1px solid ${consultMode===m?"rgba(0,229,192,.4)":T.bd}`,color:consultMode===m?T.teal:T.txt3,fontWeight:consultMode===m?700:400 }}>{m}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Urgency</label>
          <div style={{ display:"flex",gap:5 }}>
            {[{v:"STAT",c:T.coral,bg:"rgba(255,107,107,.15)",br:"rgba(255,107,107,.4)"},{v:"Urgent",c:T.gold,bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.3)"},{v:"Routine",c:T.blue,bg:"rgba(59,158,255,.12)",br:"rgba(59,158,255,.3)"}].map(({v,c,bg,br}) => (
              <button key={v} onClick={()=>setUrgency(v)}
                style={{ flex:1,padding:"7px 0",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,background:urgency===v?bg:T.up,border:`1px solid ${urgency===v?br:T.bd}`,color:urgency===v?c:T.txt3 }}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Recommended Disposition</label>
          <select value={disposition} onChange={e=>setDisposition(e.target.value)}
            style={{ width:"100%",background:T.up,border:`1px solid ${T.bd}`,borderRadius:6,padding:"7px 10px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none" }}>
            <option value="">— Select disposition —</option>
            <option>Cath lab — emergent</option>
            <option>CCU / Cardiac ICU admission</option>
            <option>Telemetry floor admission</option>
            <option>Transfer to PCI-capable centre</option>
            <option>Medical management / observation</option>
            <option>Discharge with outpatient follow-up</option>
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700,display:"block",marginBottom:4 }}>Cardiology Recommendations / Notes</label>
        <textarea value={recommendation} onChange={e=>setRecommendation(e.target.value)} rows={4} placeholder="Document cardiologist's recommendations verbatim or summarised…"
          style={{ width:"100%",background:T.up,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:T.txt,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",resize:"vertical",lineHeight:1.5 }} />
      </div>
      <div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
          <label style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700 }}>Action Plan Items</label>
          <button onClick={addItem} style={{ background:"rgba(0,229,192,.12)",border:"1px solid rgba(0,229,192,.3)",borderRadius:6,padding:"3px 10px",color:T.teal,fontSize:11,cursor:"pointer" }}>+ Add Item</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {plan.map((item,i) => (
            <div key={item.id} style={{ display:"flex",alignItems:"center",gap:8 }}>
              <input type="checkbox" checked={item.done} onChange={e=>setPlan(p=>p.map(x=>x.id===item.id?{...x,done:e.target.checked}:x))} style={{ width:16,height:16,accentColor:T.teal,cursor:"pointer",flexShrink:0 }} />
              <input value={item.text} placeholder={`Plan item ${i+1}…`} onChange={e=>setPlan(p=>p.map(x=>x.id===item.id?{...x,text:e.target.value}:x))}
                style={{ flex:1,background:T.up,border:`1px solid ${T.bd}`,borderRadius:6,padding:"6px 10px",color:item.done?T.txt3:T.txt,textDecoration:item.done?"line-through":"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none" }} />
              {plan.length>1&&<button onClick={()=>removeItem(item.id)} style={{ background:"none",border:"none",color:T.txt4,cursor:"pointer",fontSize:16,lineHeight:1 }}>×</button>}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleSave}
        style={{ background:saved?"rgba(0,229,192,.2)":T.teal,color:saved?T.teal:T.bg,border:`1px solid ${saved?"rgba(0,229,192,.5)":"transparent"}`,borderRadius:8,padding:"10px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .3s",width:"100%" }}>
        {saved ? "✓ Consult Saved" : "💾 Save Cardiology Consult"}
      </button>
    </div>
  );
}

function RiskScores() {
  const [timiFields, setTimiFields] = useState({ age65:false,cad3:false,asa7d:false,severe_angina:false,st_dev:false,elevated_markers:false,risk_factors:false });
  const [graceFields, setGraceFields] = useState({ age:"",hr:"",sbp:"",cr:"",cardiac_arrest:false,st_dev:false,elevated_markers:false,killip:"1" });
  const timiScore = Object.values(timiFields).filter(Boolean).length;
  const timiRisk  = timiScore<=2?{label:"LOW",color:T.teal}:timiScore<=4?{label:"INTERMEDIATE",color:T.gold}:{label:"HIGH",color:T.coral};
  const TIMI_ITEMS = [
    {k:"age65",label:"Age ≥ 65 years"},
    {k:"cad3",label:"≥ 3 CAD risk factors (FHx, HTN, hypercholesterolaemia, DM, active smoker)"},
    {k:"asa7d",label:"ASA use in past 7 days"},
    {k:"severe_angina",label:"≥ 2 anginal events in past 24 h"},
    {k:"st_dev",label:"ST deviation ≥ 0.5 mm on ECG"},
    {k:"elevated_markers",label:"Elevated cardiac markers (troponin / CK-MB)"},
    {k:"risk_factors",label:"Prior coronary stenosis ≥ 50% (known CAD)"},
  ];
  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
      <div style={{ background:T.up,border:`1px solid ${T.bd}`,borderRadius:10,padding:"14px 16px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:T.txt }}>TIMI Risk Score</div>
            <div style={{ fontSize:10,color:T.txt3 }}>For NSTE-ACS (UA / NSTEMI)</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28,fontWeight:700,color:timiRisk.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1 }}>{timiScore}</div>
            <div style={{ fontSize:9,color:timiRisk.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:700 }}>{timiRisk.label}</div>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
          {TIMI_ITEMS.map(({k,label}) => (
            <label key={k} style={{ display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer",fontSize:11,color:timiFields[k]?T.txt:T.txt3 }}>
              <input type="checkbox" checked={!!timiFields[k]} onChange={e=>setTimiFields(p=>({...p,[k]:e.target.checked}))} style={{ marginTop:2,accentColor:T.blue,cursor:"pointer",flexShrink:0 }} />
              {label}
            </label>
          ))}
        </div>
        <div style={{ marginTop:10,padding:"8px 10px",background:T.card,borderRadius:7,border:`1px solid ${T.bd}` }}>
          <div style={{ fontSize:10,color:T.txt3,fontFamily:"'JetBrains Mono',monospace" }}>0–2: Low (4.7%) · 3–4: Intermediate (13.2%) · 5–7: High (40.9%)</div>
        </div>
      </div>
      <div style={{ background:T.up,border:`1px solid ${T.bd}`,borderRadius:10,padding:"14px 16px" }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:13,fontWeight:700,color:T.txt }}>GRACE Risk Score</div>
          <div style={{ fontSize:10,color:T.txt3 }}>Key variables — full score via MDCalc</div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
          {[{k:"age",l:"Age (years)"},{k:"hr",l:"Heart Rate (bpm)"},{k:"sbp",l:"SBP (mmHg)"},{k:"cr",l:"Creatinine (mg/dL)"}].map(({k,l}) => (
            <div key={k}>
              <div style={{ fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3 }}>{l}</div>
              <input type="number" value={graceFields[k]} onChange={e=>setGraceFields(p=>({...p,[k]:e.target.value}))}
                style={{ width:"100%",background:T.card,border:`1px solid ${T.bd}`,borderRadius:5,padding:"5px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none" }} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:8 }}>
          {[{k:"cardiac_arrest",l:"Cardiac arrest at admission"},{k:"st_dev",l:"ST-segment deviation"},{k:"elevated_markers",l:"Elevated cardiac enzymes / markers"}].map(({k,l}) => (
            <label key={k} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:11,color:graceFields[k]?T.txt:T.txt3 }}>
              <input type="checkbox" checked={!!graceFields[k]} onChange={e=>setGraceFields(p=>({...p,[k]:e.target.checked}))} style={{ accentColor:T.blue,cursor:"pointer" }} />
              {l}
            </label>
          ))}
        </div>
        <div style={{ fontSize:10,color:T.txt3,marginBottom:5 }}>Killip Class</div>
        <div style={{ display:"flex",gap:5 }}>
          {["1","2","3","4"].map(k => (
            <button key={k} onClick={()=>setGraceFields(p=>({...p,killip:k}))}
              style={{ flex:1,padding:"5px 0",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",background:graceFields.killip===k?"rgba(59,158,255,.15)":T.card,border:`1px solid ${graceFields.killip===k?"rgba(59,158,255,.4)":T.bd}`,color:graceFields.killip===k?T.blue:T.txt3,fontWeight:graceFields.killip===k?700:400 }}>{k}</button>
          ))}
        </div>
        <div style={{ fontSize:9,color:T.txt4,fontFamily:"'JetBrains Mono',monospace",marginTop:4,marginBottom:10 }}>I=No HF · II=Rales/JVD · III=Pulm oedema · IV=Cardiogenic shock</div>
        <a href="https://www.mdcalc.com/calc/1099/grace-acs-risk-mortality-calculator" target="_blank" rel="noopener noreferrer"
          style={{ display:"block",textAlign:"center",fontSize:11,color:T.blue,textDecoration:"none",padding:"6px",background:"rgba(59,158,255,.08)",borderRadius:6,border:"1px solid rgba(59,158,255,.25)" }}>→ Open Full GRACE Calculator (MDCalc)</a>
      </div>
    </div>
  );
}

export default function ACSPage({ defaultSection } = {}) {
  const [acsType, setAcsType] = useState("STEMI");
  const [activeTab, setActiveTab] = useState("algorithm");
  const TABS = [
    {id:"algorithm",  label:"AHA Algorithm",      icon:"🔄"},
    {id:"workup",     label:"Workup Checklist",   icon:"✅"},
    {id:"treatment",  label:"Pharmacotherapy",    icon:"💊"},
    {id:"risk",       label:"Risk Scores",        icon:"📊"},
    {id:"tnk",        label:"TNK Decision Tool",  icon:"💉"},
    {id:"cardiology", label:"Cardiology Consult", icon:"📞"},
  ];
  const timeTargets = acsType==="STEMI"
    ? [{label:"Door-to-ECG",target:"≤ 10 min",icon:"📋",color:T.blue},{label:"Door-to-Balloon",target:"≤ 90 min",icon:"🏥",color:T.teal},{label:"Door-to-Needle",target:"≤ 30 min",icon:"💉",color:T.coral},{label:"FMC-to-Device",target:"≤ 120 min",icon:"⏱",color:T.gold}]
    : [{label:"Door-to-ECG",target:"≤ 10 min",icon:"📋",color:T.blue},{label:"Troponin Result",target:"≤ 60 min",icon:"🧬",color:T.purple},{label:"High-Risk PCI",target:"≤ 2 h",icon:"🏥",color:T.coral},{label:"Early Invasive",target:"≤ 24 h",icon:"⏱",color:T.gold}];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <style>{`@keyframes acs-ring{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:0;transform:scale(1.15)}}`}</style>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:T.panel,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 18px",borderLeft:`3px solid ${T.coral}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(255,107,107,.2),rgba(155,109,255,.15))",border:"1px solid rgba(255,107,107,.3)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0 }}>
            <span style={{ fontSize:22 }}>🫀</span>
            <span style={{ position:"absolute",inset:-4,borderRadius:16,border:"1.5px solid rgba(255,107,107,.3)",animation:"acs-ring 2.4s ease-in-out infinite" }} />
          </div>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.txt }}>Acute Coronary Syndrome</span>
              <span style={{ fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:"rgba(255,107,107,.12)",color:T.coral,border:"1px solid rgba(255,107,107,.3)",borderRadius:20,padding:"2px 9px",fontWeight:700 }}>2025 ACC/AHA</span>
            </div>
            <div style={{ fontSize:11,color:T.txt3,marginTop:2 }}>Evidence-based ACS management · ACEP · AHA · ACC · SCAI guidelines integrated</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ fontSize:10,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",fontFamily:"'JetBrains Mono',monospace" }}>ACS Type:</span>
          {[{v:"STEMI",color:T.coral,bg:"rgba(255,107,107,.15)",br:"rgba(255,107,107,.5)"},{v:"NSTEMI",color:T.orange,bg:"rgba(255,159,67,.12)",br:"rgba(255,159,67,.4)"},{v:"UA",color:T.gold,bg:"rgba(245,200,66,.12)",br:"rgba(245,200,66,.4)"}].map(({v,color,bg,br}) => (
            <button key={v} onClick={()=>setAcsType(v)}
              style={{ padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all .2s",background:acsType===v?bg:T.up,border:`1.5px solid ${acsType===v?br:T.bd}`,color:acsType===v?color:T.txt3 }}>{v}</button>
          ))}
        </div>
      </div>
      {/* Time targets */}
      <div style={{ display:"flex",gap:8 }}>
        {timeTargets.map((t,i) => (
          <div key={i} style={{ flex:1,background:T.up,border:`1px solid ${T.bd}`,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize:10,color:T.txt3 }}>{t.label}</div>
              <div style={{ fontSize:14,fontWeight:700,color:t.color,fontFamily:"'JetBrains Mono',monospace" }}>{t.target}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Tab bar */}
      <div style={{ display:"flex",gap:4,overflowX:"auto",background:T.panel,border:`1px solid ${T.bd}`,borderRadius:10,padding:4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:activeTab===t.id?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s",background:activeTab===t.id?"rgba(59,158,255,.12)":"transparent",border:activeTab===t.id?"1px solid rgba(59,158,255,.3)":"1px solid transparent",color:activeTab===t.id?T.blue:T.txt3 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ background:T.panel,border:`1px solid ${T.bd}`,borderRadius:12,padding:"18px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${T.bd}`,flexWrap:"wrap" }}>
          <span style={{ fontSize:18 }}>{TABS.find(t=>t.id===activeTab)?.icon}</span>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:T.txt }}>
              {activeTab==="algorithm"  && "AHA/ACC 2025 ACS Management Algorithm"}
              {activeTab==="workup"     && "ACS Workup Checklist"}
              {activeTab==="treatment"  && `${acsType==="STEMI"?"STEMI":"NSTEMI / UA"} Pharmacotherapy`}
              {activeTab==="risk"       && "Risk Stratification Tools"}
              {activeTab==="tnk"        && "TNK (Tenecteplase) Decision Tool"}
              {activeTab==="cardiology" && "Cardiology Consultation Log"}
            </div>
            <div style={{ fontSize:11,color:T.txt3 }}>
              {activeTab==="algorithm"  && `2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline — ${acsType} pathway active`}
              {activeTab==="workup"     && "Click to mark each item complete · COR I items per 2025 ACC/AHA guideline"}
              {activeTab==="treatment"  && "2025 ACC/AHA/ACEP guideline-concordant drug recommendations with COR / LOE"}
              {activeTab==="risk"       && "TIMI & GRACE scores to guide invasive strategy timing"}
              {activeTab==="tnk"        && "Contraindication checker · Weight-based dosing · Real-time recommendation · FDA-labelled"}
              {activeTab==="cardiology" && "Time-stamped consult documentation · Recommendations · Action plan"}
            </div>
          </div>
          <span style={{ marginLeft:"auto",fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"linear-gradient(90deg,rgba(0,229,192,.12),rgba(59,158,255,.12))",border:"1px solid rgba(0,229,192,.3)",color:T.teal }}>Guideline-Integrated</span>
        </div>
        {activeTab==="algorithm"  && <AlgorithmFlow acsType={acsType} />}
        {activeTab==="workup"     && <WorkupSection />}
        {activeTab==="treatment"  && <>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:14 }}>
            {Object.entries(COR_COLORS).map(([k,c]) => (
              <div key={k} style={{ display:"flex",alignItems:"center",gap:5,fontSize:10,color:c.text }}>
                <span style={{ width:10,height:10,borderRadius:2,background:c.bg,border:`1px solid ${c.border}` }} />
                COR {k}: {k==="I"?"Strong":k==="IIa"?"Moderate":k==="IIb"?"Weak":"Harm/No Benefit"}
              </div>
            ))}
          </div>
          <MedTable rows={acsType==="STEMI"?STEMI_RX:NSTEMI_RX} />
        </>}
        {activeTab==="risk"       && <RiskScores />}
        {activeTab==="tnk"        && <>
          {acsType!=="STEMI" && <div style={{ background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.3)",borderRadius:8,padding:"8px 14px",fontSize:11,color:T.gold,marginBottom:14 }}>⚠ TNK/fibrinolysis is indicated for STEMI only. Switch ACS Type to STEMI above.</div>}
          <TNKChecker />
        </>}
        {activeTab==="cardiology" && <CardiologyConsult />}
      </div>
    </div>
  );
}