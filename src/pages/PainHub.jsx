// PainHub.jsx — Notrya Pain Management Hub
// 5 tabs: Pain Ladder · Opioids (MME calc) · Nerve Blocks (LAST) · Ketamine · Orders
// Keyboard-first · Weight-based dosing throughout · Copy order buttons
// No router · no localStorage · no form · no alert · straight quotes · <1600 lines

import { useState, useCallback, useRef } from "react";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";

// ── FONTS ─────────────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined" || document.getElementById("ph-fonts")) return;
  const l = document.createElement("link");
  l.id = "ph-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  border:"rgba(26,53,85,0.8)", borderHi:"rgba(42,79,122,0.9)",
};
const A = T.orange;
const glass = {
  background:"rgba(8,22,44,0.75)",
  border:"1px solid rgba(26,53,85,0.5)",
  borderRadius:12,
  backdropFilter:"blur(8px)",
  WebkitBackdropFilter:"blur(8px)",
};

// ── CLINICAL DATA ─────────────────────────────────────────────────────────────
const PAIN_TIERS = [
  {
    label:"Mild", range:"1-3", color:"#3dffa0",
    agents:[
      {name:"Acetaminophen", dose:"650-1000mg PO", route:"PO", note:"Max 4g/day; 2g/day with hepatic impairment"},
      {name:"Ibuprofen", dose:"400-800mg PO q6-8h", route:"PO", note:"With food; avoid CKD, active GIB, heart failure"},
      {name:"Ketorolac", dose:"15-30mg IV/IM", route:"IV/IM", note:"Max 5-day course; 15mg if age >65y, <50kg, or CrCl <30"},
      {name:"Acetaminophen IV", dose:"1000mg IV over 15 min", route:"IV", note:"Faster onset than PO; 650mg if <50kg; max 4g/day"},
    ],
    multimodal:"Combine acetaminophen + NSAID for synergistic multimodal effect. Avoid duplicating agents within same class.",
  },
  {
    label:"Moderate", range:"4-6", color:"#f5c842",
    agents:[
      {name:"Oxycodone", dose:"5-10mg PO q4-6h", route:"PO", note:"Onset 30-45 min; avoid in renal impairment"},
      {name:"Tramadol", dose:"50-100mg PO q6h", route:"PO", note:"Avoid: seizure Hx, MAOIs, SNRIs; lowers seizure threshold"},
      {name:"Morphine", dose:"2-4mg IV (0.05-0.1mg/kg)", route:"IV", note:"Titrate q15-20 min; histamine release; caution in renal Dz"},
      {name:"Ketamine SDK", dose:"0.1-0.3mg/kg IV", route:"IV", note:"Push over 15 min to reduce emergence rxn; opioid-sparing"},
    ],
    multimodal:"Layer opioid on existing non-opioid foundation. Ketamine SDK enables opioid-sparing strategy.",
  },
  {
    label:"Severe", range:"7-10", color:"#ff6b6b",
    agents:[
      {name:"Morphine", dose:"0.1mg/kg IV", route:"IV", note:"Titrate q15-20 min; max 15mg/dose; caution renal/elderly"},
      {name:"Hydromorphone", dose:"0.015mg/kg IV", route:"IV", note:"4x potency vs morphine; max 2mg/dose; preferred in renal Dz"},
      {name:"Fentanyl", dose:"1-2 mcg/kg IV", route:"IV", note:"Fastest onset; max 200mcg; ideal for hemodynamic instability"},
      {name:"Ketamine SDK", dose:"0.2-0.3mg/kg IV", route:"IV", note:"Opioid-sparing adjunct; push over 15 min"},
      {name:"Regional Block", dose:"See Nerve Blocks tab", route:"Regional", note:"Fascia iliaca (hip/femur); hematoma block (wrist fx); intercostal (ribs)"},
    ],
    multimodal:"Multimodal mandatory at this tier: IV opioid + acetaminophen + NSAID (if no CI) + ketamine SDK + regional anesthesia if applicable.",
  },
];

const OPIOIDS = [
  {name:"Morphine",    route:"IV",  wtDose:0.1,    maxDose:15,   unit:"mg/kg", freq:"q3-4h", mmeRatio:1,   renal:"Active metabolites (M6G) accumulate — use caution or avoid in CKD",   notes:"First-line IV opioid in ED; may cause histamine release; titrate slowly"},
  {name:"Hydromorph.", route:"IV",  wtDose:0.015,  maxDose:2,    unit:"mg/kg", freq:"q3-4h", mmeRatio:4,   renal:"Preferred opioid in CKD/ESRD (no active metabolites)",                 notes:"4x potency vs morphine; less histamine; ideal renally impaired patients"},
  {name:"Fentanyl",    route:"IV",  wtDose:0.001,  maxDose:0.2,  unit:"mg/kg", freq:"q1-2h", mmeRatio:100, renal:"Safe in CKD and ESRD — preferred in renal failure",                   notes:"mcg-based; fastest onset (1-2 min); preferred hemodynamic instability"},
  {name:"Oxycodone",   route:"PO",  wtDose:0.1,    maxDose:20,   unit:"mg/kg", freq:"q4-6h", mmeRatio:1.5, renal:"Avoid in CKD (active metabolites accumulate)",                         notes:"Standard oral moderate-severe pain; onset 30-45 min"},
  {name:"Hydrocodone", route:"PO",  wtDose:null,   maxDose:10,   unit:"fixed", freq:"q4-6h", mmeRatio:1,   renal:"Use with caution CKD",                                                 notes:"5-10mg PO; combo products; ceiling dose considerations"},
  {name:"Tramadol",    route:"PO",  wtDose:null,   maxDose:100,  unit:"fixed", freq:"q6h",   mmeRatio:0.2, renal:"Reduce dose CKD; max 50mg q12h in ESRD",                               notes:"Avoid: seizure Hx, MAOIs, SSRIs/SNRIs. Weak MOR agonist + NE/5-HT reuptake"},
];

const NERVE_BLOCKS = [
  {
    id:"fascia",name:"Fascia Iliaca Block",indication:"Hip/femur fracture, proximal hip pain",
    agent:"0.5% ropivacaine OR 0.5% bupivacaine",volume:"20-30 mL",onset:"10-15 min",duration:"6-12h",
    maxDose:"Ropivacaine: 3mg/kg (max 225mg) | Bupivacaine: 2mg/kg (max 175mg)",
    technique:"Identify inguinal ligament. Palpate or POCUS femoral artery (lateral = nerve). Insert needle lateral to femoral artery at 30-45 degrees. Pop through fascia lata then fascia iliaca — 2 LOR pops. Confirm position. Inject 20-30mL slowly.",
    pearls:["POCUS-guided preferred for accuracy","Aspirate before injection — confirm not in vessel","Blocks femoral + lateral femoral cutaneous + obturator nerves (3-in-1)","Fall precautions: quadriceps weakness expected","May supplement with femoral nerve block for complete femur coverage"],
    color:T.teal,
  },
  {
    id:"digital",name:"Digital Block",indication:"Finger/toe lacerations, I&D, nail procedures, paronychia",
    agent:"2% lidocaine (digital epi safe per RCT evidence)",volume:"2-3 mL per side",onset:"3-5 min",duration:"1-2h",
    maxDose:"Lidocaine plain: 4.5mg/kg (max 300mg)",
    technique:"Web space approach: insert needle 45 degrees dorsal web space toward flexor surface. 1-2mL per side. OR transthecal (1 injection): insert into flexor tendon sheath, 3-4mL total.",
    pearls:["Digital epinephrine safe — multiple RCTs demonstrate no ischemia","Buffered lidocaine (9:1 lido:NaHCO3) reduces injection pain by ~50%","Transthecal approach: single injection, less painful, equivalent efficacy","Avoid large volumes (>5mL total) — compartment pressure risk","Consider ring block for circumferential procedures"],
    color:T.teal,
  },
  {
    id:"hematoma",name:"Hematoma Block",indication:"Distal radius (Colles) fracture, distal ulna fractures",
    agent:"1-2% lidocaine plain",volume:"5-10 mL",onset:"5-10 min",duration:"1-2h",
    maxDose:"Lidocaine plain: 4.5mg/kg (max 300mg)",
    technique:"Palpate fracture site dorsally. Insert needle directly into fracture hematoma — blood aspiration confirms correct position. Inject 5-10mL slowly. Supplement 3-5mL on dorsal aspect for complete block.",
    pearls:["Aspiration of dark blood = correct position in hematoma","Equivalent to IV sedation for isolated distal radius fractures (multiple RCTs)","Supplement dorsally for dorsal periosteum coverage","Allow 10 min before manipulation for full effect","Contraindicated if open fracture or overlying infection"],
    color:T.teal,
  },
  {
    id:"femoral",name:"Femoral Nerve Block",indication:"Femur shaft fracture, knee, anterior thigh procedures",
    agent:"0.5% ropivacaine or 0.25-0.5% bupivacaine",volume:"15-20 mL",onset:"10-20 min",duration:"8-24h",
    maxDose:"Ropivacaine: 3mg/kg | Bupivacaine: 2mg/kg",
    technique:"POCUS-guided preferred. Patient supine. Identify femoral nerve (lateral to femoral artery, beneath fascia iliaca) below inguinal ligament. In-plane approach. Distribute agent circumferentially around nerve.",
    pearls:["POCUS mandatory for safe femoral nerve block","Do NOT inject intravascularly — aspirate, pulse check, use US","Motor block expected (quadriceps) — fall precautions, bed rest","Combine with lateral femoral cutaneous block for full femur coverage","Posterior compartment requires sciatic/obturator supplement for complete limb block"],
    color:T.teal,
  },
  {
    id:"intercostal",name:"Intercostal Block",indication:"Rib fractures (1-3 ribs), flail chest, post-thoracotomy pain",
    agent:"0.25-0.5% bupivacaine with epinephrine 1:200,000",volume:"3-5 mL per interspace",onset:"5-10 min",duration:"6-12h",
    maxDose:"Bupivacaine with epi: 3mg/kg (max 225mg total across ALL interspaces)",
    technique:"Patient seated or lateral. Identify posterior angle of rib (6-8cm from spinous process). Walk inferior off rib edge — feel loss of resistance at 2-4mm depth. Aspirate (pneumothorax check). Inject 3-5mL. Block one level above and below injured ribs.",
    pearls:["Highest systemic absorption of all nerve blocks — stay within max dose","Block one level above and below injured levels","Risk of bilateral pneumothorax with bilateral blocks","Consider serratus anterior plane block or ESPB as safer alternatives","Post-procedure CXR if >3 interspaces blocked"],
    color:T.teal,
  },
  {
    id:"LAST",name:"LAST Protocol",indication:"Local Anesthetic Systemic Toxicity — EMERGENCY",
    agent:"Intralipid 20%",volume:"1.5 mL/kg IV bolus then infusion",onset:"Immediate",duration:"Until stable",
    maxDose:"Intralipid 20% — max cumulative 12 mL/kg",
    technique:"STOP injection. Call for help. (1) Airway: 100% O2, BVM if needed. (2) Intralipid 20%: 1.5mL/kg IV bolus over 1 min. Then 0.25mL/kg/min x30 min. Repeat bolus x2 q5 min if instability. (3) Seizure: benzodiazepine. (4) Cardiac arrest: ACLS with modifications.",
    pearls:[
      "Symptoms: metallic taste, tinnitus, perioral numbness => seizure => cardiac arrest",
      "Bupivacaine LAST most severe — cardiac arrest may be refractory",
      "Intralipid acts as lipid sink for lipophilic local anesthetic",
      "AVOID in LAST: propofol (not substitute), vasopressin, CCBs, beta-blockers",
      "Modify ACLS: epinephrine dose reduced to 1 mcg/kg",
      "Continue resuscitation longer than standard — intralipid may take time to work",
      "Intralipid 20% should be stocked wherever nerve blocks are performed",
    ],
    color:T.coral, isProtocol:true,
  },
];

const KETAMINE_MODES = [
  {
    id:"sdk", name:"Sub-Dissociative Analgesia",shortName:"SDK",
    dose:"0.1-0.3 mg/kg IV", loFactor:0.1, hiFactor:0.3,
    timing:"Push over 15 min — slow push reduces emergence reaction",
    onset:"1-3 min", duration:"15-30 min",
    indication:"Opioid-sparing adjunct; moderate-severe pain; sickle cell; renal colic; MSK; burns",
    monitoring:"SpO2 + BP q5 min; observe 30 min post-dose",
    pearls:["No clinically significant respiratory depression at SDK doses","Reduce concurrent opioid dose 25-50% when using SDK","Benzo not routinely needed — give midazolam 1-2mg IV only if emergence Hx","Ideal: renal colic, MSK injuries, sickle cell crisis, trauma, opioid-tolerant","Can repeat once at 0.2mg/kg if initial dose insufficient"],
    ci:["Schizophrenia / active psychosis","Severe uncontrolled hypertension","Hyperthyroidism / thyrotoxicosis"],
    color:T.purple,
  },
  {
    id:"sedation", name:"Procedural Sedation",shortName:"Sedation",
    dose:"IV: 1-2 mg/kg | IM: 4-6 mg/kg | IN: 1-2 mg/kg",
    loFactor:1.5, hiFactor:2, imLoFactor:4, imHiFactor:6,
    timing:"IV: inject over 1-2 min | IM: onset 5-15 min | IN: onset 5-10 min",
    onset:"IV <1 min | IM 5-15 min", duration:"IV 10-20 min | IM 20-45 min",
    indication:"Fracture reduction; cardioversion; I&D; LP; joint dislocation reduction",
    monitoring:"Continuous SpO2; ETCO2 preferred; vital signs q5 min; airway equipment bedside",
    pearls:["Laryngeal reflexes preserved — aspiration risk lower than propofol","Redose: 0.5-1mg/kg IV or 2-4mg/kg IM PRN","Emergence: quiet dark room, minimize stimulation, midazolam 0.05mg/kg if needed","Glycopyrrolate 0.005mg/kg can reduce secretions (optional)","Avoid in active URI <2yr old; schizophrenia; thyrotoxicosis"],
    ci:["Active URI with significant secretions (<2yr)","Schizophrenia / active psychosis","Thyrotoxicosis","Age <3 months"],
    color:T.purple,
  },
  {
    id:"infusion", name:"Low-Dose Infusion",shortName:"Infusion",
    dose:"Load 0.2-0.3mg/kg over 15 min, then 0.1-0.3mg/kg/hr",
    loFactor:0.1, hiFactor:0.3,
    timing:"Load first, then start infusion; taper over 30 min before stopping",
    onset:"Minutes", duration:"Duration of infusion + 30-60 min after stopping",
    indication:"Ongoing severe pain; sickle cell crisis; opioid-tolerant; neuropathic pain flare",
    monitoring:"Q15 min vitals; dissociative symptoms check; BP monitoring (raises BP 20-30%)",
    pearls:["Ketamine raises BP 20-30% — caution in uncontrolled hypertension","Concurrent opioids require respiratory monitoring","Add midazolam 1-2mg to infusion bag to reduce emergence effects","Taper infusion — abrupt stop may cause recurrence","CONTRAINDICATED: active psychosis, uncontrolled HTN"],
    ci:["Severe hypertension (>180/110)","Active psychosis","Thyrotoxicosis"],
    color:T.purple,
  },
];

const ADJUNCTS = [
  {name:"Ketorolac",dose:"15-30mg IV/IM",note:"Max 5 days; 15mg if >65y, <50kg, CrCl <30; potent ED analgesic"},
  {name:"Ibuprofen",dose:"400-800mg PO q6-8h",note:"Max 3200mg/day; with food; avoid CKD, GIB, HF, ASA allergy"},
  {name:"Acetaminophen IV",dose:"1000mg IV over 15 min",note:"Faster onset than PO; 650mg if <50kg; max 4g/day; 2g/day with liver disease"},
  {name:"Methocarbamol",dose:"1.5g IV q8h or 750mg PO q6h",note:"Musculoskeletal spasm; sedating; avoid with CNS depressants"},
  {name:"Cyclobenzaprine",dose:"5-10mg PO q8h PRN",note:"MSK spasm; NOT for fibromyalgia; max 3 weeks; anticholinergic effects"},
  {name:"Lidocaine Infusion",dose:"1-1.5 mg/kg IV over 10-15 min",note:"Neuropathic/visceral pain; ECG monitoring required; caution cardiac disease"},
  {name:"Magnesium Sulfate",dose:"1-2g IV over 20-30 min",note:"Migraine; fibromyalgia; neuropathic pain; monitor DTRs and BP"},
  {name:"Dexamethasone",dose:"10mg IV x1",note:"Radiculopathy; migraine; post-op pain; single ED dose standard"},
  {name:"Gabapentin",dose:"300-600mg PO",note:"Neuropathic pain; sedating; dose-adjust CKD; not for acute nociceptive pain"},
  {name:"Ondansetron",dose:"4mg IV/PO q6h PRN",note:"Opioid-induced nausea; consider co-prescribing with any opioid initiation"},
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
const MME_RATIOS = {
  "Morphine IV":1,"Morphine PO":1,"Hydromorphone IV":4,"Hydromorphone PO":4,
  "Fentanyl IV":100,"Oxycodone PO":1.5,"Tramadol PO":0.2,"Hydrocodone PO":1,
};

function calcMME(drug, dose) {
  const ratio = MME_RATIOS[drug] || 1;
  return Math.round(dose * ratio * 10) / 10;
}

function calcOpioidDose(o, wt) {
  if (!wt || isNaN(wt) || wt <= 0) return null;
  if (!o.wtDose) return o.maxDose + "mg";
  const raw = o.wtDose * wt;
  const capped = Math.min(raw, o.maxDose);
  if (o.name === "Fentanyl") return Math.round(capped * 1000) + " mcg";
  return (Math.round(capped * 10) / 10) + " mg";
}

let cpTimer;
function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = useCallback((text, key) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (_e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(key);
    clearTimeout(cpTimer);
    cpTimer = setTimeout(() => setCopied(""), 2000);
  }, []);
  return [copied, copy];
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────
function SectionHead({children, color}) {
  return (
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:color||A,marginBottom:12,letterSpacing:0.3}}>
      {children}
    </div>
  );
}

function Badge({color, children}) {
  return (
    <span style={{background:color+"22",border:"1px solid "+color+"44",color,borderRadius:5,fontSize:10,fontWeight:700,padding:"2px 7px",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>
      {children}
    </span>
  );
}

function CopyBtn({text, label, copyKey, copied, copy}) {
  return (
    <button onClick={() => copy(text, copyKey)}
      style={{background:copied===copyKey?"rgba(61,255,160,0.12)":"rgba(255,159,67,0.1)",border:"1px solid "+(copied===copyKey?"rgba(61,255,160,0.4)":"rgba(255,159,67,0.3)"),color:copied===copyKey?T.green:A,borderRadius:6,padding:"4px 11px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
      {copied===copyKey ? "✓ copied" : (label || "📋 copy")}
    </button>
  );
}

function Pearl({text, color}) {
  return (
    <div style={{display:"flex",gap:6,fontSize:11,color:T.txt2,lineHeight:1.55}}>
      <span style={{color:color||T.teal,flexShrink:0,marginTop:1}}>▸</span>
      <span style={{fontFamily:"'DM Sans',sans-serif"}}>{text}</span>
    </div>
  );
}

// ── TAB 1: PAIN LADDER ─────────────────────────────────────────────────────────
function PainLadderTab() {
  const [tier, setTier] = useState(null);
  const [copied, copy] = useCopy();

  const buildTierOrder = (t) =>
    t.agents.map(a => "- " + a.name + ": " + a.dose + " [" + a.note + "]").join("\n") +
    "\n\nMultimodal note: " + t.multimodal;

  return (
    <div>
      <SectionHead>Multimodal Pain Ladder</SectionHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {PAIN_TIERS.map((t,i) => (
          <button key={i} onClick={() => setTier(tier===i ? null : i)}
            style={{...glass,padding:"14px 10px",cursor:"pointer",textAlign:"center",
              border:"1px solid "+(tier===i ? t.color+"77":"rgba(26,53,85,0.5)"),
              background:tier===i ? t.color+"16":"rgba(8,22,44,0.75)",
              transition:"all 0.2s",outline:"none"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:t.color,marginBottom:4}}>{t.label}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:t.color}}>{t.range}</div>
            <div style={{fontSize:10,color:T.txt4,marginTop:3}}>NRS score</div>
          </button>
        ))}
      </div>

      {tier !== null && (function() {
        const t = PAIN_TIERS[tier];
        return (
          <div style={{...glass,padding:16,border:"1px solid "+t.color+"44",background:t.color+"0a",marginBottom:14,animation:"phFadeIn 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:t.color}}>
                {t.label} Pain — NRS {t.range}
              </div>
              <CopyBtn text={buildTierOrder(t)} label="📋 Copy orders" copyKey={"tier"+tier} copied={copied} copy={copy} />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {t.agents.map((a,ai) => (
                <div key={ai} style={{padding:"10px 12px",background:"rgba(8,22,44,0.6)",borderRadius:8,border:"1px solid rgba(26,53,85,0.4)"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:T.txt}}>{a.name}</span>
                    <Badge color={t.color}>{a.route}</Badge>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:t.color}}>{a.dose}</span>
                  </div>
                  <div style={{fontSize:11,color:T.txt3,fontFamily:"'DM Sans',sans-serif"}}>{a.note}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"8px 12px",background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.2)",borderRadius:8,fontSize:11,color:T.txt2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.55}}>
              <span style={{color:A,fontWeight:600}}>Multimodal: </span>{t.multimodal}
            </div>
          </div>
        );
      })()}

      <div style={{...glass,padding:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:T.txt2,marginBottom:10}}>Non-Opioid Adjuncts</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {ADJUNCTS.map((a,i) => (
            <div key={i} style={{padding:"8px 10px",background:"rgba(8,22,44,0.5)",borderRadius:7,border:"1px solid rgba(26,53,85,0.4)"}}>
              <div style={{fontSize:12,fontWeight:600,color:T.txt,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{a.name}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:A,marginBottom:2}}>{a.dose}</div>
              <div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{a.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TAB 2: OPIOIDS ─────────────────────────────────────────────────────────────
function OpioidTab({wt, setWt}) {
  const [mmeDrug, setMmeDrug] = useState("Morphine IV");
  const [mmeDose, setMmeDose] = useState("");
  const numWt = parseFloat(wt);
  const mmeResult = mmeDose && !isNaN(mmeDose) ? calcMME(mmeDrug, parseFloat(mmeDose)) : null;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <SectionHead>Opioid Reference</SectionHead>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.txt3}}>Wt (kg):</span>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="kg"
            style={{width:64,background:"rgba(8,22,44,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:6,padding:"5px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}} />
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {OPIOIDS.map((o,i) => {
          const dose = calcOpioidDose(o, numWt);
          return (
            <div key={i} style={{...glass,padding:14}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:160}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.txt}}>{o.name}</span>
                    <Badge color={A}>{o.route}</Badge>
                    <Badge color={T.blue}>{o.freq}</Badge>
                    {o.mmeRatio >= 4 && <Badge color={T.coral}>HIGH POTENCY</Badge>}
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:A,marginBottom:3}}>
                    {o.wtDose ? o.wtDose+" mg/kg | max "+o.maxDose+"mg" : "Fixed: "+o.maxDose+"mg | max "+o.maxDose+"mg"}
                  </div>
                  <div style={{fontSize:11,color:T.txt2,marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}>{o.notes}</div>
                  <div style={{fontSize:10,color:T.coral,fontFamily:"'DM Sans',sans-serif"}}>⚠ {o.renal}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {dose !== null && (
                    <div style={{background:"rgba(255,159,67,0.12)",border:"1px solid rgba(255,159,67,0.3)",borderRadius:8,padding:"10px 14px",textAlign:"center",minWidth:88}}>
                      <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>For {wt}kg</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:A,lineHeight:1}}>{dose}</div>
                      <div style={{fontSize:9,color:T.txt4,marginTop:2}}>single dose</div>
                    </div>
                  )}
                  <div style={{background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:8,padding:"10px 12px",textAlign:"center",minWidth:68}}>
                    <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>MME</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:T.teal,lineHeight:1}}>{o.mmeRatio}x</div>
                    <div style={{fontSize:9,color:T.txt4,marginTop:2}}>per mg</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{...glass,padding:14,border:"1px solid rgba(59,158,255,0.3)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.blue,marginBottom:10}}>MME Calculator</div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
          <select value={mmeDrug} onChange={e => setMmeDrug(e.target.value)}
            style={{background:"rgba(8,22,44,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:6,padding:"6px 10px",color:T.txt,fontSize:12,outline:"none",fontFamily:"'DM Sans',sans-serif"}}>
            {Object.keys(MME_RATIOS).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input value={mmeDose} onChange={e => setMmeDose(e.target.value)} placeholder="dose (mg)"
            style={{width:100,background:"rgba(8,22,44,0.8)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:6,padding:"6px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}} />
          {mmeResult !== null && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:mmeResult>=90?T.coral:mmeResult>=50?T.gold:T.teal}}>= {mmeResult} MME</span>
              {mmeResult >= 90 && <Badge color={T.coral}>HIGH RISK &gt;90 MME</Badge>}
              {mmeResult >= 50 && mmeResult < 90 && <Badge color={T.gold}>CAUTION</Badge>}
            </div>
          )}
        </div>
        <div style={{fontSize:10,color:T.txt4,lineHeight:1.5}}>
          MME = morphine milligram equivalent. ≥90 MME/day associated with increased overdose risk.
          This calculator is for single ED dose reference — not chronic prescribing.
        </div>
      </div>
    </div>
  );
}

// ── TAB 3: NERVE BLOCKS ───────────────────────────────────────────────────────
function NerveBlockTab() {
  const [sel, setSel] = useState(null);
  const [copied, copy] = useCopy();
  const blk = sel !== null ? NERVE_BLOCKS[sel] : null;

  const buildBlockNote = (b) =>
    b.name + "\nIndication: " + b.indication +
    "\nAgent: " + b.agent +
    "\nVolume: " + b.volume +
    "\nOnset: " + b.onset + " | Duration: " + b.duration +
    "\nMax dose: " + b.maxDose +
    "\n\nTechnique: " + b.technique +
    "\n\nPearls:\n" + b.pearls.map(p => "- " + p).join("\n");

  return (
    <div>
      <SectionHead color={T.teal}>Regional Nerve Blocks</SectionHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
        {NERVE_BLOCKS.map((b,i) => (
          <button key={i} onClick={() => setSel(sel===i ? null : i)}
            style={{...glass,padding:"10px 12px",cursor:"pointer",textAlign:"left",
              border:"1px solid "+(b.isProtocol?"rgba(255,107,107,0.5)":sel===i?"rgba(0,229,192,0.5)":"rgba(26,53,85,0.5)"),
              background:sel===i?"rgba(0,229,192,0.08)":b.isProtocol?"rgba(255,107,107,0.07)":"rgba(8,22,44,0.75)",
              transition:"all 0.2s",outline:"none"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:b.isProtocol?T.coral:T.txt,marginBottom:3}}>
              {b.isProtocol ? "⚠ " : ""}{b.name}
            </div>
            <div style={{fontSize:10,color:T.txt3,lineHeight:1.4}}>{b.indication}</div>
            {!b.isProtocol && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.teal,marginTop:3}}>{b.volume} | {b.onset}</div>}
          </button>
        ))}
      </div>

      {blk && (
        <div key={sel} style={{...glass,padding:16,border:"1px solid "+(blk.isProtocol?"rgba(255,107,107,0.4)":"rgba(0,229,192,0.3)"),animation:"phFadeIn 0.2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:blk.isProtocol?T.coral:T.teal,marginBottom:2}}>{blk.name}</div>
              <div style={{fontSize:11,color:T.txt3}}>{blk.indication}</div>
            </div>
            {!blk.isProtocol && (
              <CopyBtn text={buildBlockNote(blk)} label="📋 Copy note" copyKey={"nb"+sel} copied={copied} copy={copy} />
            )}
          </div>

          {!blk.isProtocol && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[{l:"Agent",v:blk.agent},{l:"Volume",v:blk.volume},{l:"Onset / Duration",v:blk.onset+" | "+blk.duration}].map((r,i) => (
                <div key={i} style={{background:"rgba(8,22,44,0.6)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(26,53,85,0.4)"}}>
                  <div style={{fontSize:9,color:T.txt4,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{r.l}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.teal,lineHeight:1.5}}>{r.v}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:T.txt4,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>Technique</div>
            <div style={{fontSize:12,color:T.txt2,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{blk.technique}</div>
          </div>

          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:T.txt4,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Clinical Pearls</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {blk.pearls.map((p,i) => <Pearl key={i} text={p} color={blk.isProtocol?T.coral:T.teal} />)}
            </div>
          </div>

          <div style={{padding:"6px 10px",background:blk.isProtocol?"rgba(255,107,107,0.08)":"rgba(26,53,85,0.4)",border:"1px solid "+(blk.isProtocol?"rgba(255,107,107,0.3)":"rgba(26,53,85,0.5)"),borderRadius:6}}>
            <span style={{fontSize:10,color:T.txt4}}>Max dose: </span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:blk.isProtocol?T.coral:T.txt2}}>{blk.maxDose}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 4: KETAMINE ────────────────────────────────────────────────────────────
function KetamineTab({wt, setWt}) {
  const [mode, setMode] = useState(0);
  const [copied, copy] = useCopy();
  const km = KETAMINE_MODES[mode];
  const numWt = parseFloat(wt);

  const getCalc = () => {
    if (!numWt || numWt <= 0) return null;
    const lo = Math.round(km.loFactor * numWt * 10) / 10;
    const hi = Math.round(km.hiFactor * numWt * 10) / 10;
    if (mode === 1) {
      const imLo = Math.round((km.imLoFactor||4) * numWt);
      const imHi = Math.round((km.imHiFactor||6) * numWt);
      return {iv:{lo,hi},im:{lo:imLo,hi:imHi}};
    }
    return {lo,hi};
  };
  const calc = getCalc();

  const buildOrder = () => {
    const w = numWt || 70;
    if (mode===0) return "Ketamine SDK (sub-dissociative analgesia)\nDose: " + (km.loFactor*w).toFixed(1) + "-" + (km.hiFactor*w).toFixed(1) + "mg IV push SLOWLY over 15 min (0.1-0.3mg/kg)\nMonitoring: SpO2 + BP q5 min x30 min post-dose\nNote: Reduce concurrent opioid 25-50%\nIf emergence: Midazolam 1-2mg IV PRN";
    if (mode===1) return "Ketamine Procedural Sedation\nIV dose: " + (1.5*w).toFixed(0) + "mg IV over 1-2 min (1.5mg/kg range 1-2mg/kg)\nIM dose: " + (5*w).toFixed(0) + "mg IM (5mg/kg range 4-6mg/kg)\nContinuous SpO2, ETCO2 preferred\nAirway equipment at bedside\nEmergence: quiet room, minimize stimulation; Midazolam PRN";
    return "Ketamine Low-Dose Infusion\nLoad: " + (0.25*w).toFixed(1) + "mg IV over 15 min\nInfusion: " + (km.loFactor*w).toFixed(1) + "-" + (km.hiFactor*w).toFixed(1) + "mg/hr\nMonitor BP q15 min (ketamine raises BP 20-30%)\nTaper over 30 min before stopping";
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <SectionHead color={T.purple}>Ketamine Protocols</SectionHead>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.txt3}}>Wt (kg):</span>
          <input value={wt} onChange={e=>setWt(e.target.value)} placeholder="kg"
            style={{width:64,background:"rgba(8,22,44,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:6,padding:"5px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}} />
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {KETAMINE_MODES.map((m,i) => (
          <button key={i} onClick={()=>setMode(i)}
            style={{padding:"10px 8px",background:mode===i?"rgba(155,109,255,0.15)":"rgba(8,22,44,0.6)",border:"1px solid "+(mode===i?"rgba(155,109,255,0.6)":"rgba(26,53,85,0.5)"),borderRadius:8,cursor:"pointer",color:mode===i?T.purple:T.txt3,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s",outline:"none"}}>
            {m.shortName}
          </button>
        ))}
      </div>

      <div key={mode} style={{...glass,padding:16,border:"1px solid rgba(155,109,255,0.3)",marginBottom:14,animation:"phFadeIn 0.2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:T.purple}}>{km.name}</div>
          <CopyBtn text={buildOrder()} label="📋 Copy order" copyKey={"ket"+mode} copied={copied} copy={copy} />
        </div>

        <div style={{borderBottom:"1px solid rgba(26,53,85,0.4)",marginBottom:12,paddingBottom:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.purple,marginBottom:2}}>{km.dose}</div>
          <div style={{fontSize:11,color:T.txt3}}>{km.timing}</div>
        </div>

        {calc && (
          <div style={{padding:"10px 12px",background:"rgba(155,109,255,0.1)",border:"1px solid rgba(155,109,255,0.25)",borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:10,color:T.txt4,marginBottom:6}}>Calculated for {numWt}kg</div>
            {mode===0 && (
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div><div style={{fontSize:9,color:T.txt4}}>Low end</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:T.purple}}>{calc.lo}mg</div></div>
                <div style={{color:T.txt3,fontSize:14}}>—</div>
                <div><div style={{fontSize:9,color:T.txt4}}>High end</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:T.purple}}>{calc.hi}mg</div></div>
                <div style={{fontSize:10,color:T.txt3,marginLeft:8}}>IV over 15 min</div>
              </div>
            )}
            {mode===1 && calc.iv && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{padding:"8px 10px",background:"rgba(8,22,44,0.5)",borderRadius:6}}>
                  <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>IV route</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:T.purple}}>{calc.iv.lo}-{calc.iv.hi}mg</div>
                </div>
                <div style={{padding:"8px 10px",background:"rgba(8,22,44,0.5)",borderRadius:6}}>
                  <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>IM route</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:T.purple}}>{calc.im.lo}-{calc.im.hi}mg</div>
                </div>
              </div>
            )}
            {mode===2 && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{padding:"8px 10px",background:"rgba(8,22,44,0.5)",borderRadius:6}}>
                  <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>Load dose</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:T.purple}}>{(0.25*numWt).toFixed(1)}mg</div>
                  <div style={{fontSize:9,color:T.txt4}}>over 15 min</div>
                </div>
                <div style={{padding:"8px 10px",background:"rgba(8,22,44,0.5)",borderRadius:6}}>
                  <div style={{fontSize:9,color:T.txt4,marginBottom:2}}>Infusion rate</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:T.purple}}>{calc.lo}-{calc.hi}mg/hr</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:T.txt4,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>Indication</div>
          <div style={{fontSize:12,color:T.txt2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{km.indication}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:T.txt4,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Clinical Pearls</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {km.pearls.map((p,i) => <Pearl key={i} text={p} color={T.purple} />)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {km.ci.map((c,i) => (
            <span key={i} style={{background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.25)",color:T.coral,borderRadius:5,fontSize:10,padding:"3px 8px",fontFamily:"'DM Sans',sans-serif"}}>
              ⚠ {c}
            </span>
          ))}
        </div>
      </div>

      <div style={{...glass,padding:12,border:"1px solid rgba(0,229,192,0.25)"}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:T.teal,marginBottom:6}}>Monitoring: {km.monitoring}</div>
        <div style={{fontSize:10,color:T.txt3}}>Ketamine raises blood pressure ~20-30% — assess baseline BP before administration. Avoid in patients with SBP &gt;180 or uncontrolled hypertension.</div>
      </div>
    </div>
  );
}

// ── TAB 5: ORDER GENERATOR ─────────────────────────────────────────────────────
function OrdersTab({wt}) {
  const [copied, copy] = useCopy();
  const w = parseFloat(wt) || 70;

  const SETS = [
    {key:"mild",label:"Mild Pain Bundle",color:T.green,
     order:"PAIN ORDERS — Mild (NRS 1-3)\n- Acetaminophen 1000mg IV q6h (if NPO) OR 1000mg PO q6h\n- Ibuprofen 400-800mg PO q6-8h with food (if no renal/GI CI)\n- Ketorolac 30mg IV x1 dose (acute onset; if no CI)\nGoal: Non-opioid multimodal. Combine acetaminophen + NSAID."},
    {key:"moderate",label:"Moderate Pain Bundle",color:T.gold,
     order:"PAIN ORDERS — Moderate (NRS 4-6)\n- Acetaminophen 1000mg IV q6h\n- Ketorolac 30mg IV q6h PRN x2 doses\n- Oxycodone 5-10mg PO q4-6h PRN breakthrough pain\n- Consider: Ketamine SDK " + (0.2*w).toFixed(1) + "mg IV over 15 min x1 (opioid-sparing)\n- Ondansetron 4mg IV q6h PRN nausea\nGoal: Opioid-sparing multimodal."},
    {key:"severe",label:"Severe Pain Bundle",color:T.coral,
     order:"PAIN ORDERS — Severe (NRS 7-10) | Patient: " + (wt||"__") + "kg\n- Morphine " + (0.1*w).toFixed(1) + "mg IV q3-4h PRN (0.1mg/kg; max 15mg/dose)\n  OR Hydromorphone " + (0.015*w).toFixed(2) + "mg IV q3-4h PRN (0.015mg/kg; max 2mg)\n  OR Fentanyl " + Math.round(1*w) + "mcg IV q1-2h PRN (1mcg/kg; max 200mcg)\n- Acetaminophen 1000mg IV q6h (opioid-sparing)\n- Ketorolac 30mg IV q6h PRN x2 doses (if no CI)\n- Ketamine SDK " + (0.2*w).toFixed(1) + "-" + (0.3*w).toFixed(1) + "mg IV over 15 min x1 (opioid-sparing adjunct)\n- Ondansetron 4mg IV q6h PRN nausea"},
    {key:"sdk",label:"Ketamine SDK Order",color:T.purple,
     order:"KETAMINE SUB-DISSOCIATIVE ANALGESIA | " + (wt||"__") + "kg\n- Ketamine " + (0.2*w).toFixed(1) + "mg IV — push SLOWLY over 15 min (0.2mg/kg)\n  Acceptable range: " + (0.1*w).toFixed(1) + "-" + (0.3*w).toFixed(1) + "mg IV\n- Monitoring: SpO2 + BP q5 min for 30 min\n- If emergence reaction: Midazolam 1-2mg IV PRN\n- Reduce concurrent opioid dose by 25-50%\n- Caution: avoid if SBP >180, active psychosis, thyrotoxicosis"},
    {key:"sedation",label:"Ketamine Procedural Sedation",color:T.purple,
     order:"KETAMINE PROCEDURAL SEDATION | " + (wt||"__") + "kg\n- IV: Ketamine " + (1.5*w).toFixed(0) + "mg IV over 1-2 min (1.5mg/kg; range " + (1*w).toFixed(0) + "-" + (2*w).toFixed(0) + "mg)\n- IM: Ketamine " + (5*w).toFixed(0) + "mg IM (5mg/kg; range " + (4*w).toFixed(0) + "-" + (6*w).toFixed(0) + "mg)\n- Continuous SpO2 monitoring; ETCO2 preferred\n- Airway equipment at bedside (BVM, suction, intubation)\n- Recovery: quiet room, minimize stimulation\n- Redose: 0.5-1mg/kg IV PRN if dissociation wanes\n- Document: procedure, consent, response, recovery time"},
    {key:"fascia",label:"Fascia Iliaca Block",color:T.teal,
     order:"FASCIA ILIACA BLOCK (HIP / FEMUR FX) | " + (wt||"__") + "kg\n- Agent: 0.5% ropivacaine (preferred) — max dose: " + Math.min(225,(3*w)).toFixed(0) + "mg (3mg/kg)\n- Volume: 20-30mL (confirm weight-based max)\n- Technique: POCUS-guided, inferomedial approach below inguinal ligament\n- Onset: 10-15 min | Duration: 6-12 hours\n- Intralipid 20% at bedside (LAST protocol)\n- Fall precautions: quadriceps weakness expected\n- Document: agent, volume, technique, aspiration negative, patient response"},
    {key:"renal",label:"Renal Colic Protocol",color:A,
     order:"RENAL COLIC PROTOCOL | " + (wt||"__") + "kg\n- Ketorolac 30mg IV x1 (first-line if no CI — equivalent to opioid for ureteral colic)\n- Acetaminophen 1000mg IV q6h\n- Tamsulosin 0.4mg PO daily (MET — expedite stone passage up to 10mm)\n- Ondansetron 4mg IV PRN nausea\n- Ketamine SDK " + (0.2*w).toFixed(1) + "mg IV over 15 min (if opioid-sparing preferred)\n- If refractory/inadequate: Hydromorphone " + (0.015*w).toFixed(2) + "mg IV PRN\n- IVF: 0.9% NS 500mL IV (hydration)\n- Urology follow-up if stone >10mm, obstructing, or infection"},
    {key:"headache",label:"Migraine / Headache Protocol",color:T.blue,
     order:"MIGRAINE / SEVERE HEADACHE PROTOCOL\n- Prochlorperazine 10mg IV + Diphenhydramine 25mg IV (abortive; anti-dopaminergic)\n  OR Metoclopramide 10mg IV + Diphenhydramine 25mg IV\n- Ketorolac 30mg IV x1\n- Dexamethasone 10mg IV x1 (reduces 24h recurrence)\n- Magnesium Sulfate 2g IV over 20 min (if refractory)\n- NS 1L IV (dehydration common)\n- Quiet dark room; antiemetics before mobilization\n- Avoid: Opioids (rebound headache risk, poor evidence for migraine)\n- Discharge: Naproxen 500mg + Sumatriptan rescue if not given"},
  ];

  return (
    <div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
        <SectionHead>Copy-Ready Order Sets</SectionHead>
        {wt && <Badge color={T.teal}>Weight: {wt}kg</Badge>}
      </div>
      <div style={{fontSize:11,color:T.txt3,marginBottom:14}}>
        {wt ? "Doses auto-calculated for "+wt+"kg." : "Enter patient weight in Opioids or Ketamine tab for calculated dosing."} Click to copy.
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {SETS.map((s) => (
          <div key={s.key} style={{...glass,padding:14,borderLeft:"3px solid "+s.color,border:"1px solid "+s.color+"33",background:s.color+"0a"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:s.color}}>{s.label}</div>
              <CopyBtn text={s.order} label="📋 Copy" copyKey={s.key} copied={copied} copy={copy} />
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.txt3,lineHeight:1.75,whiteSpace:"pre-line"}}>{s.order}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
const TABS = [
  {key:"ladder",  label:"Pain Ladder", icon:"⚡"},
  {key:"opioids", label:"Opioids",     icon:"💉"},
  {key:"blocks",  label:"Nerve Blocks",icon:"🎯"},
  {key:"ketamine",label:"Ketamine",    icon:"⊕"},
  {key:"orders",  label:"Orders",      icon:"📋"},
];

function PainHub({embedded, onBack}) {
  const [tab, setTab] = useState("ladder");
  const [wt, setWt] = useState("");

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (typeof window !== "undefined") window.history.back();
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.txt}}>
      <style>{`
        @keyframes phFadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px}
        select option{background:#081628;color:#f2f7ff}
        button:focus-visible{outline:2px solid rgba(255,159,67,0.6)}
        input:focus{border-color:rgba(255,159,67,0.6) !important}
      `}</style>

      {/* Header */}
      <NotryaHubHeader
        hubName="Pain"
        category="Documentation"
        homeUrl="/hub"
        statusSlot={wt ? (
          <div style={{background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.3)",borderRadius:6,padding:"4px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#00e5c0"}}>
            ⚖ {wt} kg
          </div>
        ) : null}
      />

      {/* Tab Bar */}
      <div style={{background:"rgba(8,16,32,0.9)",borderBottom:"1px solid rgba(26,53,85,0.5)",padding:"0 20px",display:"flex",overflowX:"auto"}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t.key?A:"transparent"),color:tab===t.key?A:T.txt3,padding:"10px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5,outline:"none"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Weight prompt banner */}
      {!wt && (tab==="opioids"||tab==="ketamine"||tab==="orders") && (
        <div style={{background:"rgba(255,159,67,0.07)",borderBottom:"1px solid rgba(255,159,67,0.2)",padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:T.orange}}>⚖ Enter patient weight for weight-based dosing:</span>
          <input onChange={e => setWt(e.target.value)} placeholder="kg"
            style={{width:72,background:"rgba(8,22,44,0.9)",border:"1px solid rgba(255,159,67,0.4)",borderRadius:5,padding:"4px 8px",color:T.txt,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}} />
        </div>
      )}

      {/* Content */}
      <div style={{padding:20,maxWidth:880,margin:"0 auto",animation:"phFadeIn 0.25s ease"}} key={tab}>
        {tab==="ladder"   && <PainLadderTab wt={wt} />}
        {tab==="opioids"  && <OpioidTab wt={wt} setWt={setWt} />}
        {tab==="blocks"   && <NerveBlockTab />}
        {tab==="ketamine" && <KetamineTab wt={wt} setWt={setWt} />}
        {tab==="orders"   && <OrdersTab wt={wt} />}
      </div>

      <div style={{padding:"20px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:T.txt4,letterSpacing:1.5}}>
        NOTRYA PAIN HUB · CLINICAL DECISION SUPPORT ONLY · VERIFY WITH LOCAL FORMULARY AND CLINICAL JUDGMENT
      </div>
    </div>
  );
}

export default PainHub;