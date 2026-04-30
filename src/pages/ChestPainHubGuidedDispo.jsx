// ChestPainHubGuidedDispo.jsx
// Extracted guided dispo step — fixes "useState inside conditional" hook violation
import { useState } from "react";

const T = {
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
};

// Inlined helpers (mirrors ChestPainHub.jsx)
function heartStrata(score) {
  if (score <= 3) return { label:"Low Risk",      color:T.teal,  mace:"0.9–1.7%", rec:"Consider early discharge with outpatient follow-up" };
  if (score <= 6) return { label:"Moderate Risk", color:"#f5c842", mace:"12–16.6%", rec:"Serial troponin, admission or observation for further evaluation" };
  return               { label:"High Risk",      color:T.coral, mace:"50–65%",   rec:"Cardiology consult, admit, likely invasive strategy" };
}
function edacsRisk(score, negTrop) {
  if (score < 16 && negTrop) return { label:"Low Risk", color:T.teal,
    rec:"EDACS < 16 with negative troponin — safe for early discharge protocol" };
  return { label:"Not Low Risk", color:T.coral,
    rec:"EDACS ≥ 16 or positive troponin — standard evaluation pathway" };
}
function dispositionRec(heartScore, tropInterp) {
  if (heartScore === null || tropInterp === null) return null;
  if (heartScore <= 3) {
    if (tropInterp === "normal")   return { dispo:"Safe Discharge", color:T.teal,   icon:"🏠", detail:"HEART ≤ 3 + negative troponin — 30-day MACE < 2%", plan:["Discharge with close outpatient follow-up within 72 hours","Stress test or coronary CTA within 2 weeks if intermediate pretest probability","Return precautions: chest pain, dyspnea, diaphoresis, palpitations, syncope","Aspirin 81 mg daily if no contraindication"] };
    if (tropInterp === "elevated") return { dispo:"Observation",    color:"#f5c842", icon:"👁", detail:"HEART ≤ 3 but troponin elevated — extended monitoring", plan:["Admit to observation for serial troponin (0h/3h/6h)","Repeat 12-lead EKG in 1–2 hours","Cardiology consultation if troponin rising or clinical deterioration"] };
    if (tropInterp === "acs")      return { dispo:"Admit — ACS",    color:T.coral,   icon:"🏥", detail:"HEART ≤ 3 but troponin rising — troponin overrides low HEART", plan:["Admit to cardiology / telemetry despite low HEART score","ACS protocol: antiplatelet + anticoagulation","Cardiology consult — rising troponin is the operative finding"] };
  }
  if (heartScore <= 6) {
    if (tropInterp === "acs") return { dispo:"Admit — ACS", color:T.coral, icon:"🏥", detail:"HEART 4–6 + troponin rising — NSTEMI/UA protocol", plan:["Admit to cardiology / telemetry","ACS protocol: antiplatelet + anticoagulation","Cardiology consult for timing of invasive strategy","Echocardiogram if EF unknown"] };
    return { dispo:"Observation / Admission", color:"#f5c842", icon:"👁", detail:"HEART 4–6 — moderate risk, serial evaluation", plan:["Observation or short-stay admission","Serial troponin (0h/3h/6h) and repeat EKG","Cardiology consultation","Functional testing or coronary imaging if troponin negative"] };
  }
  return { dispo:"Admit — High Risk", color:T.coral, icon:"🚨", detail:"HEART 7–10 — high risk, early invasive strategy", plan:["Admit to cardiology / CCU","ACS protocol: antiplatelet + anticoagulation immediately","Early invasive strategy within 24h (ischemia-guided within 48h)","Cardiology consult — bedside if hemodynamically unstable"] };
}

export function GuidedDispoStep({
  heartTotal, tropInterp, edacsScore, edacsNegTrop,
  tropResult, wellsScore, wellsInterResult, addrsScore, addrsResult,
  GuidedHeader, navBtn, setStep, onTabsSwitch, onReset,
}) {
  const [copied, setCopied] = useState(false);

  const rec = dispositionRec(heartTotal, tropInterp);
  const hs  = heartTotal !== null ? heartStrata(heartTotal) : null;
  const er  = edacsScore !== null ? edacsRisk(edacsScore, edacsNegTrop) : null;

  const generateNote = () => {
    const lines = ["CHEST PAIN EVALUATION — NOTRYA"];
    if (hs) lines.push(`HEART Score: ${heartTotal}/10 (${hs.label}) — 30-day MACE ${hs.mace}`);
    if (tropResult) {
      const fold = tropResult.fold ? ` (${tropResult.fold.toFixed(1)}× ULN)` : "";
      const t1s  = !isNaN(tropResult.v1) ? `, 3h: ${tropResult.v1}` : "";
      const t2s  = !isNaN(tropResult.v2) ? `, 6h: ${tropResult.v2}` : "";
      const trd  = tropResult.trend ? ` [${tropResult.trend.label}]` : "";
      lines.push(`Troponin 0h: ${tropResult.v0}${fold}${t1s}${t2s}${trd}`);
    }
    if (er) lines.push(`EDACS: ${edacsScore} — ${er.label}`);
    if (wellsScore > 0) lines.push(`Wells PE: ${wellsScore.toFixed(1)} — ${wellsInterResult?.label}`);
    if (addrsScore > 0) lines.push(`ADD-RS: ${addrsScore}/3 — ${addrsResult?.label}`);
    if (rec) {
      lines.push(`Disposition: ${rec.dispo}`);
      rec.plan.forEach((p, i) => lines.push(`  ${i+1}. ${p}`));
    }
    lines.push("** Clinical decision support only **");
    return lines.join("\n");
  };

  const handleCopy = () => {
    const text = generateNote();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="cph-fade">
      <GuidedHeader step={8} total={9}
        label="Disposition" color={rec ? rec.color : T.teal}
        onTabsSwitch={onTabsSwitch} />
      {!rec && (
        <div style={{ padding:"20px", borderRadius:12, marginBottom:14,
          background:"rgba(26,53,85,0.2)", border:"1px solid rgba(26,53,85,0.5)",
          textAlign:"center", fontFamily:"'DM Sans',sans-serif",
          fontSize:13, color:T.txt4, lineHeight:1.7 }}>
          {heartTotal === null
            ? "Complete HEART Score to generate disposition."
            : "Enter troponin values to complete the evaluation."}
        </div>
      )}
      {rec && (
        <div style={{ padding:"18px", borderRadius:13, marginBottom:14,
          background:`${rec.color}0d`, border:`2px solid ${rec.color}55` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <span style={{ fontSize:36 }}>{rec.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:24, color:rec.color }}>{rec.dispo}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginTop:3 }}>{rec.detail}</div>
            </div>
            <button onClick={handleCopy}
              style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                fontWeight:700, letterSpacing:0.5, flexShrink:0,
                border:`1px solid ${copied ? T.teal+"66" : rec.color+"44"}`,
                background:copied ? "rgba(0,229,192,0.1)" : `${rec.color}0a`,
                color:copied ? T.teal : rec.color }}>
              {copied ? "COPIED ✓" : "COPY NOTE"}
            </button>
          </div>
          {rec.plan.map((p, i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:rec.color,
                minWidth:20, marginTop:2, fontWeight:700 }}>{i+1}.</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        {[
          { label:"HEART", val:heartTotal !== null ? `${heartTotal}/10` : "--",
            color:hs ? hs.color : T.txt4, sub:hs ? hs.label : "incomplete" },
          { label:"Troponin", val:tropInterp || "--",
            color:tropInterp==="acs" ? T.coral : tropInterp==="elevated" ? T.gold
                : tropInterp==="normal" ? T.teal : T.txt4, sub:"" },
          { label:"EDACS", val:edacsScore !== null ? edacsScore : "--",
            color:er ? er.color : T.txt4, sub:er ? er.label : "skipped" },
        ].map(s => (
          <div key={s.label} style={{ padding:"11px 8px", borderRadius:10,
            textAlign:"center", background:"rgba(5,13,32,0.85)",
            border:"1px solid rgba(26,53,85,0.5)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15,
              fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
            {s.sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:8.5, color:T.txt4, marginTop:3 }}>{s.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => setStep(s => s - 1)}
          style={{ ...navBtn(true, T.txt3), flex:"0 0 100px" }}>
          ← Back
        </button>
        <button onClick={onTabsSwitch} style={navBtn(true, T.blue)}>
          Full Reference →
        </button>
      </div>
      <button onClick={onReset}
        style={{ width:"100%", marginTop:10, minHeight:44, borderRadius:10,
          cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
          border:"1px solid rgba(255,107,107,0.35)",
          background:"rgba(255,107,107,0.06)", color:T.coral }}>
        New Patient — Reset All
      </button>
    </div>
  );
}