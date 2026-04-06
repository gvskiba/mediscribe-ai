import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const PREFIX = "cri";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes ${PREFIX}glow  { 0%,100%{box-shadow:0 0 8px rgba(255,68,68,0.3)} 50%{box-shadow:0 0 20px rgba(255,68,68,0.7)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade .25s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-glow  { animation:${PREFIX}glow 2s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#ffffff 0%,#fff 25%,#ff4444 50%,#ff9f43 75%,#ffffff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 6s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#ffffff", txt2:"#d8ecff", txt3:"#a8ccee", txt4:"#7aaace",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.82)", border:"1px solid rgba(42,79,122,0.38)", borderRadius:14,
};

// ── MOCK CRITICAL RESULTS DB ──────────────────────────────────────────
const MOCK_RESULTS = [
  {
    id:"r1", patientName:"James Whitfield", mrn:"MRN-44821", room:"12A",
    provider:"Dr. Patel", resultType:"Lab", category:"critical",
    test:"Potassium", value:"6.8", unit:"mEq/L", referenceRange:"3.5–5.0 mEq/L",
    interpretation:"CRITICAL HIGH — Hyperkalemia. Risk of cardiac arrhythmia.",
    receivedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    status:"unread", priority:"critical",
    guidance:"Obtain 12-lead ECG immediately. Consider calcium gluconate, insulin/dextrose, sodium bicarbonate. Repeat potassium in 1h. Nephrology consult if persistent.",
    source:"LabCorp", orderedBy:"Dr. Patel",
  },
  {
    id:"r2", patientName:"Maria Gonzalez", mrn:"MRN-38291", room:"7B",
    provider:"Dr. Kim", resultType:"Lab", category:"critical",
    test:"Troponin I (hsTnI)", value:"4,820", unit:"ng/L", referenceRange:"< 52 ng/L",
    interpretation:"CRITICAL HIGH — Significant myocardial injury. Consistent with NSTEMI.",
    receivedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    status:"unread", priority:"critical",
    guidance:"Activate cardiology consult. Initiate ACS protocol: dual antiplatelet therapy, anticoagulation, continuous telemetry. Serial ECGs. Consider cath lab activation.",
    source:"In-house Lab", orderedBy:"Dr. Kim",
  },
  {
    id:"r3", patientName:"Robert Chen", mrn:"MRN-52017", room:"3C",
    provider:"Dr. Williams", resultType:"Lab", category:"critical",
    test:"INR", value:"9.2", unit:"", referenceRange:"0.9–1.1 (therapeutic 2.0–3.0)",
    interpretation:"CRITICAL HIGH — Supratherapeutic anticoagulation. Bleeding risk.",
    receivedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    status:"acknowledged", priority:"critical",
    acknowledgedBy:"Dr. Williams", acknowledgedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    guidance:"Hold warfarin. If active bleeding: 4-factor PCC (Kcentra) + Vitamin K 10mg IV slow infusion. If no active bleeding: Vitamin K 2.5–5mg PO/IV. Repeat INR in 6–12h.",
    source:"In-house Lab", orderedBy:"Dr. Williams",
  },
  {
    id:"r4", patientName:"Linda Okafor", mrn:"MRN-61133", room:"ER Bay 4",
    provider:"Dr. Skiba", resultType:"Imaging", category:"critical",
    test:"CT Head w/o Contrast", value:"N/A", unit:"",
    interpretation:"CRITICAL — Large right MCA territory ischemic stroke with hemorrhagic transformation. Midline shift 8mm. Neurosurgery emergent consult required.",
    receivedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    status:"unread", priority:"critical",
    guidance:"Neurosurgery emergent consult NOW. NPO. Reverse anticoagulation if applicable. Blood pressure management (target SBP < 180). ICU transfer. Family meeting.",
    source:"Radiology — Dr. Hassan", orderedBy:"Dr. Skiba",
  },
  {
    id:"r5", patientName:"Thomas Baker", mrn:"MRN-29944", room:"10D",
    provider:"Dr. Nguyen", resultType:"Lab", category:"panic",
    test:"Sodium", value:"118", unit:"mEq/L", referenceRange:"136–145 mEq/L",
    interpretation:"PANIC LOW — Severe hyponatremia. Risk of cerebral edema, seizure.",
    receivedAt: new Date(Date.now() - 62 * 60000).toISOString(),
    status:"unread", priority:"panic",
    guidance:"Determine acuity: acute (<48h) vs chronic. If symptomatic (seizure, AMS): 3% NaCl 150mL bolus IV over 20min, may repeat ×2. Target Na correction ≤ 1–2 mEq/L/hr (max 8–10 mEq/L in 24h). Endocrine consult.",
    source:"In-house Lab", orderedBy:"Dr. Nguyen",
  },
  {
    id:"r6", patientName:"Patricia Moore", mrn:"MRN-74821", room:"2A",
    provider:"Dr. Patel", resultType:"Lab", category:"panic",
    test:"Glucose", value:"32", unit:"mg/dL", referenceRange:"70–100 mg/dL",
    interpretation:"PANIC LOW — Severe hypoglycemia. Immediate intervention required.",
    receivedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    status:"closed", priority:"panic",
    acknowledgedBy:"Dr. Patel", acknowledgedAt: new Date(Date.now() - 6 * 60000).toISOString(),
    closedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    guidance:"If conscious and able to swallow: 15–20g oral glucose. If altered/unconscious: Dextrose 50% 25g (50mL) IV push or glucagon 1mg IM/SC. Repeat glucose in 15min. Identify and treat underlying cause.",
    source:"In-house Lab", orderedBy:"Dr. Patel",
  },
  {
    id:"r7", patientName:"Samuel Wright", mrn:"MRN-83300", room:"5B",
    provider:"Dr. Kim", resultType:"Lab", category:"abnormal",
    test:"WBC", value:"24,800", unit:"/µL", referenceRange:"4,500–11,000 /µL",
    interpretation:"HIGH — Leukocytosis. Consider infection, inflammation, malignancy.",
    receivedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    status:"acknowledged", priority:"abnormal",
    acknowledgedBy:"Dr. Kim", acknowledgedAt: new Date(Date.now() - 80 * 60000).toISOString(),
    guidance:"Review clinical context. Blood cultures x2 if febrile. Assess for left shift on differential. Consider CBC with manual diff. Treat underlying cause.",
    source:"In-house Lab", orderedBy:"Dr. Kim",
  },
  {
    id:"r8", patientName:"Dorothy Hall", mrn:"MRN-19503", room:"ICU 3",
    provider:"Dr. Williams", resultType:"Lab", category:"critical",
    test:"Lactate", value:"8.4", unit:"mmol/L", referenceRange:"0.5–2.2 mmol/L",
    interpretation:"CRITICAL HIGH — Severe lactic acidosis. Possible septic shock, mesenteric ischemia, or hepatic failure.",
    receivedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    status:"unread", priority:"critical",
    guidance:"Immediate bedside assessment. Identify and treat underlying cause (sepsis, ischemia, toxin). Aggressive IV fluid resuscitation. Serial lactate q2h. Vasopressors if MAP < 65 despite fluids. Surgery consult if ischemia suspected.",
    source:"In-house Lab", orderedBy:"Dr. Williams",
  },
];

const PRIORITY_CFG = {
  critical: { color:T.red,    label:"CRITICAL", icon:"🔴", bg:`${T.red}10`    },
  panic:    { color:T.orange, label:"PANIC",    icon:"🟠", bg:`${T.orange}10` },
  abnormal: { color:T.gold,   label:"ABNORMAL", icon:"🟡", bg:`${T.gold}0a`   },
  normal:   { color:T.green,  label:"NORMAL",   icon:"🟢", bg:`${T.green}08`  },
};

const STATUS_CFG = {
  unread:       { color:T.red,    label:"Unread",       icon:"●" },
  acknowledged: { color:T.gold,   label:"Acknowledged", icon:"◎" },
  closed:       { color:T.green,  label:"Closed",       icon:"✓" },
};

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"15%", r:300, c:"rgba(255,68,68,0.05)"    },
        { l:"88%", t:"10%", r:260, c:"rgba(255,159,67,0.045)"  },
        { l:"75%", t:"78%", r:340, c:"rgba(59,158,255,0.04)"   },
        { l:"20%", t:"78%", r:220, c:"rgba(245,200,66,0.04)"   },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)",
      borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans", fontWeight:600,
      fontSize:13, color:T.teal, zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function StatTile({ value, label, color, sub, pulse }) {
  return (
    <div style={{
      ...glass, padding:"10px 14px", borderRadius:12,
      borderLeft:`3px solid ${color}`,
      background:`${color}0a`,
    }}>
      <div style={{
        fontFamily:"JetBrains Mono", fontSize:22, fontWeight:700,
        color, lineHeight:1,
        ...(pulse ? { animation:`${PREFIX}pulse 1.5s ease-in-out infinite` } : {}),
      }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:10, color:T.txt, marginTop:3 }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function ResultCard({ result, onAcknowledge, onClose, onView, isSelected }) {
  const pc  = PRIORITY_CFG[result.priority]  || PRIORITY_CFG.normal;
  const sc  = STATUS_CFG[result.status]       || STATUS_CFG.unread;
  const age = timeAgo(result.receivedAt);
  const isCritical = result.priority === "critical";

  return (
    <div
      onClick={() => onView(result)}
      className={`${PREFIX}-fade`}
      style={{
        ...glass, padding:0, overflow:"hidden", cursor:"pointer",
        borderLeft:`4px solid ${pc.color}`,
        border: isSelected ? `1px solid ${pc.color}55` : "1px solid rgba(42,79,122,0.38)",
        borderLeft:`4px solid ${pc.color}`,
        background: isSelected
          ? `${pc.color}0d`
          : result.status === "unread"
          ? `linear-gradient(135deg,${pc.color}0a,rgba(8,22,40,0.82))`
          : "rgba(8,22,40,0.75)",
        opacity: result.status === "closed" ? 0.7 : 1,
        transition:"all .15s",
        ...(isCritical && result.status === "unread" ? { animation:`${PREFIX}glow 2.5s ease-in-out infinite` } : {}),
      }}
    >
      {/* Header row */}
      <div style={{ padding:"10px 12px 8px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:3 }}>
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
              padding:"2px 7px", borderRadius:20,
              background:`${pc.color}18`, border:`1px solid ${pc.color}40`, color:pc.color,
            }}>{pc.icon} {pc.label}</span>
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:8,
              padding:"1px 6px", borderRadius:20,
              background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.35)", color:T.txt4,
            }}>{result.resultType}</span>
            {result.status === "unread" && (
              <span style={{
                width:7, height:7, borderRadius:"50%",
                background:pc.color, display:"inline-block",
                animation:`${PREFIX}pulse 1.5s ease-in-out infinite`,
              }}/>
            )}
          </div>
          <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt, marginBottom:1 }}>
            {result.patientName}
          </div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
            {result.mrn} · Room {result.room} · {result.provider}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
            color: sc.color, letterSpacing:1,
          }}>{sc.icon} {sc.label}</div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>{age}</div>
        </div>
      </div>

      {/* Test + value */}
      <div style={{
        borderTop:"1px solid rgba(42,79,122,0.25)", padding:"7px 12px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div>
          <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt2 }}>{result.test}</div>
          <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:1 }}>{result.referenceRange}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:18, color:pc.color, lineHeight:1 }}>
            {result.value}
          </span>
          {result.unit && (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginLeft:4 }}>{result.unit}</span>
          )}
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ padding:"6px 12px 8px", fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.5 }}>
        {result.interpretation}
      </div>

      {/* Actions */}
      {result.status !== "closed" && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,0.2)", padding:"7px 10px", display:"flex", gap:6 }}>
          {result.status === "unread" && (
            <button onClick={e => { e.stopPropagation(); onAcknowledge(result.id); }} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"6px 8px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.gold}40`, background:`${T.gold}0e`, color:T.gold,
              transition:"all .12s",
            }}>✓ Acknowledge</button>
          )}
          {result.status === "acknowledged" && (
            <button onClick={e => { e.stopPropagation(); onClose(result.id); }} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"6px 8px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.green}40`, background:`${T.green}0e`, color:T.green,
              transition:"all .12s",
            }}>✓ Mark Complete</button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ result, onAcknowledge, onClose, onBack }) {
  if (!result) return (
    <div style={{
      ...glass, padding:"48px 24px", textAlign:"center",
      display:"flex", flexDirection:"column", alignItems:"center", gap:12,
    }}>
      <span style={{ fontSize:40 }}>📋</span>
      <div style={{ fontFamily:"Playfair Display", fontSize:18, fontWeight:700, color:T.txt }}>Select a Result</div>
      <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, maxWidth:260, lineHeight:1.6 }}>
        Click any result in the list to view details and clinical guidance.
      </div>
    </div>
  );

  const pc = PRIORITY_CFG[result.priority] || PRIORITY_CFG.normal;
  const sc = STATUS_CFG[result.status] || STATUS_CFG.unread;

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Patient header */}
      <div style={{
        ...glass, padding:"14px 16px",
        borderTop:`3px solid ${pc.color}`,
        background:`${pc.color}08`,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div>
            <div style={{ fontFamily:"Playfair Display", fontSize:20, fontWeight:700, color:T.txt, marginBottom:3 }}>
              {result.patientName}
            </div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginBottom:6 }}>
              {result.mrn} · Room {result.room} · Provider: {result.provider}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"2px 8px", borderRadius:20,
                background:`${pc.color}18`, border:`1px solid ${pc.color}40`, color:pc.color,
              }}>{pc.icon} {pc.label}</span>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"2px 8px", borderRadius:20,
                background:`${sc.color}14`, border:`1px solid ${sc.color}30`, color:sc.color,
              }}>{sc.icon} {sc.label}</span>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8,
                padding:"2px 8px", borderRadius:20,
                background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.35)", color:T.txt4,
              }}>{result.resultType}</span>
            </div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{timeAgo(result.receivedAt)}</div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>
              Ordered by {result.orderedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Result value */}
      <div style={{ ...glass, padding:"14px 16px" }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8,
        }}>Result</div>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:10 }}>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:16, color:T.txt, marginBottom:3 }}>{result.test}</div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
              Reference: {result.referenceRange} · Source: {result.source}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:28, color:pc.color, lineHeight:1 }}>
              {result.value}
            </div>
            {result.unit && (
              <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt4 }}>{result.unit}</div>
            )}
          </div>
        </div>
        <div style={{
          marginTop:10, padding:"8px 12px", borderRadius:9,
          background:`${pc.color}0c`, border:`1px solid ${pc.color}28`,
          fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:pc.color, lineHeight:1.5,
        }}>{result.interpretation}</div>
      </div>

      {/* Clinical Guidance */}
      <div style={{
        ...glass, padding:"14px 16px",
        borderLeft:`3px solid ${T.teal}`, background:`${T.teal}06`,
      }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8,
        }}>🩺 Clinical Guidance</div>
        <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, lineHeight:1.7 }}>
          {result.guidance}
        </div>
      </div>

      {/* Audit trail */}
      <div style={{ ...glass, padding:"12px 14px" }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8,
        }}>Audit Trail</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <AuditRow icon="📥" label="Result received" time={result.receivedAt} color={T.blue}/>
          {result.acknowledgedAt && (
            <AuditRow icon="✓" label={`Acknowledged by ${result.acknowledgedBy}`} time={result.acknowledgedAt} color={T.gold}/>
          )}
          {result.closedAt && (
            <AuditRow icon="✅" label="Marked complete" time={result.closedAt} color={T.green}/>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {result.status !== "closed" && (
        <div style={{ display:"flex", gap:8 }}>
          {result.status === "unread" && (
            <button onClick={() => onAcknowledge(result.id)} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:13,
              padding:"12px", borderRadius:10, cursor:"pointer",
              border:`1px solid ${T.gold}45`, background:`${T.gold}12`, color:T.gold,
            }}>✓ Acknowledge Result</button>
          )}
          {result.status === "acknowledged" && (
            <button onClick={() => onClose(result.id)} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:13,
              padding:"12px", borderRadius:10, cursor:"pointer",
              border:`1px solid ${T.green}45`, background:`${T.green}12`, color:T.green,
            }}>✅ Mark Complete</button>
          )}
        </div>
      )}
    </div>
  );
}

function AuditRow({ icon, label, time, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{
        width:24, height:24, borderRadius:"50%", flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
      }}>{icon}</div>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{label}</span>
      </div>
      <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, flexShrink:0 }}>
        {timeAgo(time)}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function CriticalResultsInbox({ onBack }) {
  const [results,       setResults]       = useState(MOCK_RESULTS);
  const [selected,      setSelected]      = useState(null);
  const [filter,        setFilter]        = useState("all");
  const [providerFilter,setProviderFilter]= useState("all");
  const [search,        setSearch]        = useState("");
  const [toast,         setToast]         = useState("");
  const [now,           setNow]           = useState(Date.now());

  // Refresh timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function acknowledge(id) {
    setResults(prev => prev.map(r => r.id === id
      ? { ...r, status:"acknowledged", acknowledgedBy:"Dr. (You)", acknowledgedAt: new Date().toISOString() }
      : r
    ));
    setSelected(prev => prev?.id === id
      ? { ...prev, status:"acknowledged", acknowledgedBy:"Dr. (You)", acknowledgedAt: new Date().toISOString() }
      : prev
    );
    showToast("Result acknowledged");
  }

  function closeResult(id) {
    setResults(prev => prev.map(r => r.id === id
      ? { ...r, status:"closed", closedAt: new Date().toISOString() }
      : r
    ));
    setSelected(prev => prev?.id === id
      ? { ...prev, status:"closed", closedAt: new Date().toISOString() }
      : prev
    );
    showToast("Result marked complete");
  }

  const providers = useMemo(() => ["all", ...Array.from(new Set(results.map(r => r.provider)))], [results]);

  const filtered = useMemo(() => {
    let list = results;
    if (filter === "unread")   list = list.filter(r => r.status === "unread");
    if (filter === "critical") list = list.filter(r => r.priority === "critical");
    if (filter === "panic")    list = list.filter(r => r.priority === "panic");
    if (filter === "pending")  list = list.filter(r => r.status !== "closed");
    if (providerFilter !== "all") list = list.filter(r => r.provider === providerFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.patientName.toLowerCase().includes(q) ||
        r.test.toLowerCase().includes(q) ||
        r.mrn.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q)
      );
    }
    // Sort: unread critical first
    return [...list].sort((a, b) => {
      const rank = { critical:0, panic:1, abnormal:2, normal:3 };
      const statusRank = { unread:0, acknowledged:1, closed:2 };
      const sr = statusRank[a.status] - statusRank[b.status];
      if (sr !== 0) return sr;
      return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
    });
  }, [results, filter, providerFilter, search]);

  const stats = useMemo(() => ({
    criticalUnread: results.filter(r => r.priority === "critical" && r.status === "unread").length,
    panicUnread:    results.filter(r => r.priority === "panic"    && r.status === "unread").length,
    totalUnread:    results.filter(r => r.status === "unread").length,
    totalPending:   results.filter(r => r.status !== "closed").length,
  }), [results]);

  const FILTERS = [
    { id:"all",      label:"All",           count: results.length },
    { id:"unread",   label:"Unread",        count: stats.totalUnread,    color:T.red    },
    { id:"pending",  label:"Pending",       count: stats.totalPending,   color:T.orange },
    { id:"critical", label:"Critical Only", count: results.filter(r => r.priority === "critical").length, color:T.red    },
    { id:"panic",    label:"Panic Only",    count: results.filter(r => r.priority === "panic").length,    color:T.orange },
  ];

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
            <div style={{
              backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
            }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>CRITICAL RESULTS</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,68,68,0.5),transparent)" }}/>
            {onBack && (
              <button onClick={onBack} style={{
                fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
                borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Hub</button>
            )}
          </div>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,36px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>Critical Results Inbox</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            Real-time critical & panic value alerts · Acknowledge · Track · Close · Clinical guidance included
          </p>
        </div>

        {/* Stats banner */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:14 }}>
          <StatTile value={stats.criticalUnread} label="Critical Unread" color={T.red}    sub="Immediate action"   pulse={stats.criticalUnread > 0}/>
          <StatTile value={stats.panicUnread}    label="Panic Unread"    color={T.orange} sub="Urgent attention"  />
          <StatTile value={stats.totalUnread}    label="Total Unread"    color={T.gold}   sub="Awaiting ack"      />
          <StatTile value={stats.totalPending}   label="Pending"         color={T.blue}   sub="Not yet closed"    />
          <StatTile value={results.filter(r=>r.status==="closed").length} label="Completed" color={T.green} sub="All clear" />
        </div>

        {/* Critical unread alert banner */}
        {stats.criticalUnread > 0 && (
          <div className={`${PREFIX}-glow`} style={{
            ...glass, padding:"9px 14px", marginBottom:12,
            border:"1px solid rgba(255,68,68,0.45)",
            borderLeft:`3px solid ${T.red}`,
            background:`${T.red}0c`,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span className={`${PREFIX}-pulse`} style={{ fontSize:16 }}>🚨</span>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.red }}>
              {stats.criticalUnread} critical result{stats.criticalUnread > 1 ? "s" : ""} require immediate attention
            </span>
          </div>
        )}

        {/* Filters + search */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"4px 10px", borderRadius:20, cursor:"pointer",
                textTransform:"uppercase", letterSpacing:1, transition:"all .12s",
                border:`1px solid ${filter===f.id ? (f.color||T.teal)+"66" : (f.color||T.teal)+"22"}`,
                background: filter===f.id ? `${(f.color||T.teal)}14` : `${(f.color||T.teal)}05`,
                color: filter===f.id ? (f.color||T.teal) : T.txt3,
              }}>{f.label} ({f.count})</button>
            ))}
          </div>
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            style={{
              background:"rgba(14,37,68,0.8)", border:"1px solid rgba(42,79,122,0.4)",
              borderRadius:8, padding:"6px 10px", fontFamily:"DM Sans", fontSize:11,
              color:T.txt, outline:"none", cursor:"pointer",
            }}
          >
            {providers.map(p => <option key={p} value={p}>{p === "all" ? "All Providers" : p}</option>)}
          </select>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, test, room..."
            style={{
              background:"rgba(14,37,68,0.8)", border:`1px solid ${search ? T.teal+"44" : "rgba(42,79,122,0.4)"}`,
              borderRadius:8, padding:"6px 11px", fontFamily:"DM Sans", fontSize:12,
              color:T.txt, outline:"none", width:200,
            }}
          />
        </div>

        {/* Main content */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:14, alignItems:"start", marginBottom:24 }}>
          {/* Results list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, marginBottom:4 }}>
              {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
            </div>
            {filtered.length === 0 ? (
              <div style={{ ...glass, padding:"32px", textAlign:"center", color:T.txt3, fontFamily:"DM Sans", fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
                No results match this filter
              </div>
            ) : filtered.map(r => (
              <ResultCard
                key={r.id}
                result={r}
                onAcknowledge={acknowledge}
                onClose={closeResult}
                onView={setSelected}
                isSelected={selected?.id === r.id}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div style={{ position:"sticky", top:16 }}>
            <DetailPanel
              result={selected}
              onAcknowledge={acknowledge}
              onClose={closeResult}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · CRITICAL RESULTS INBOX · ACKNOWLEDGE ALL CRITICAL VALUES PROMPTLY · JCAHO COMPLIANCE
          </span>
        </div>

      </div>
    </div>
  );
}