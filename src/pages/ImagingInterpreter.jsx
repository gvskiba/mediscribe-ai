// ImagingInterpreter.jsx
// ED Imaging Interpreter — paste radiology reports or enter structured findings.
// Panels: CXR · CT Head · CT Chest / PE Protocol · CT Abdomen & Pelvis
// Features: paste-parse, AI interpretation, ED action items, don't-miss checklist

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("img-fonts")) return;
  const l = document.createElement("link");
  l.id = "img-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "img-css";
  s.textContent = `
    @keyframes img-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .img-fade{animation:img-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#3b9eff 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const PANELS = [
  {
    id:"cxr", label:"Chest X-Ray", icon:"🫁", color:T.blue,
    placeholder:`Paste radiology report here...

Example:
CHEST X-RAY PA AND LATERAL
Lungs: Patchy opacity in the right lower lobe. No pleural effusion.
Heart: Mildly enlarged cardiac silhouette.
Mediastinum: No widening.
Bones: No acute fracture.
IMPRESSION: Right lower lobe opacity, possibly representing pneumonia.`,
    systemPrompt:`You are an emergency medicine physician interpreting a chest X-ray radiology report for immediate ED management. Focus on findings that change management RIGHT NOW.

Respond ONLY in valid JSON, no markdown fences:
{
  "headline": "One sentence: the most important finding",
  "critical_findings": ["Any critical finding requiring immediate action — empty array if none"],
  "key_findings": [
    { "finding": "Specific finding", "significance": "ED significance", "severity": "normal|incidental|concerning|critical" }
  ],
  "dont_miss_checklist": {
    "pneumothorax": "present|absent|cannot exclude",
    "hemothorax": "present|absent|cannot exclude",
    "pneumonia": "present|absent|possible",
    "pulmonary_edema": "present|absent|possible",
    "pleural_effusion": "present|absent|small|moderate|large",
    "pneumomediastinum": "present|absent",
    "widened_mediastinum": "present|absent|borderline",
    "cardiomegaly": "present|absent|borderline",
    "free_air_under_diaphragm": "present|absent",
    "endotracheal_tube": "appropriate|high|low|absent",
    "lines_tubes": "note any malpositioned lines or tubes"
  },
  "immediate_actions": ["Specific action 1", "action 2"],
  "further_imaging": "Recommended further imaging if needed",
  "pearls": "Key ED-specific clinical pearl for this finding"
}`,
  },
  {
    id:"ct_head", label:"CT Head", icon:"🧠", color:T.purple,
    placeholder:`Paste CT head report here...

Example:
CT HEAD WITHOUT CONTRAST
Parenchyma: No acute intracranial hemorrhage identified.
No midline shift. No mass effect. Ventricles normal in size.
Sulci and fissures appropriate for age.
No hyperdense vessel sign.
Calvarium: No acute fracture.
Soft tissues: No significant scalp swelling.
IMPRESSION: No acute intracranial hemorrhage or mass effect.`,
    systemPrompt:`You are an emergency medicine physician interpreting a CT head report for immediate ED management. Focus on findings that change acute management.

Respond ONLY in valid JSON, no markdown fences:
{
  "headline": "One sentence: most important finding",
  "critical_findings": ["Critical findings requiring immediate action — empty if none"],
  "key_findings": [
    { "finding": "Specific finding", "significance": "ED significance", "severity": "normal|incidental|concerning|critical" }
  ],
  "dont_miss_checklist": {
    "intracranial_hemorrhage": "absent|SDH|EDH|SAH|IPH|IVH",
    "sdh_details": "if SDH: thickness, midline shift, bilateral",
    "edh_details": "if EDH: lenticular vs crescentic, herniation signs",
    "sah": "present|absent|note sulcal vs cistern",
    "stroke_early_changes": "absent|present — ASPECTS score if MCA territory",
    "hyperdense_mca": "present|absent — LVO sign",
    "mass_effect": "present|absent",
    "midline_shift": "none|shift in mm",
    "herniation": "none|uncal|tonsillar|subfalcine",
    "hydrocephalus": "present|absent",
    "skull_fracture": "present|absent|linear|depressed",
    "foreign_body": "present|absent"
  },
  "neurosurgery_consult": "emergent|urgent|routine|not indicated — reason",
  "immediate_actions": ["Specific action 1", "action 2"],
  "further_imaging": "CTA, MRI, or other imaging recommendations",
  "pearls": "Key ED pearl for this CT head finding"
}`,
  },
  {
    id:"ct_chest", label:"CT Chest / PE", icon:"💨", color:T.teal,
    placeholder:`Paste CT chest or CT-PE report here...

Example:
CT PULMONARY ANGIOGRAPHY
Pulmonary arteries: Filling defects in the right main and right lower lobe pulmonary arteries consistent with pulmonary embolism.
Right ventricle: Mild right ventricular enlargement. D-sign present.
Lungs: No consolidation or pleural effusion.
Mediastinum: No lymphadenopathy.
IMPRESSION: Bilateral pulmonary emboli with RV strain pattern.`,
    systemPrompt:`You are an emergency medicine physician interpreting a CT chest or CT pulmonary angiography report for immediate ED management.

Respond ONLY in valid JSON, no markdown fences:
{
  "headline": "One sentence: most important finding",
  "critical_findings": ["Critical findings requiring immediate action — empty if none"],
  "key_findings": [
    { "finding": "Specific finding", "significance": "ED significance", "severity": "normal|incidental|concerning|critical" }
  ],
  "dont_miss_checklist": {
    "pulmonary_embolism": "absent|present — note level (main/lobar/segmental)",
    "pe_burden": "none|low|submassive|massive",
    "rv_strain": "absent|present — note D-sign, RV:LV ratio",
    "pneumothorax": "absent|present|tension signs",
    "hemothorax": "absent|present|estimated size",
    "aortic_dissection": "absent|present — type A vs B",
    "pneumonia_consolidation": "absent|present — lobe",
    "pleural_effusion": "absent|small|moderate|large",
    "pericardial_effusion": "absent|present — tamponade signs",
    "pneumomediastinum": "absent|present",
    "esophageal_pathology": "absent|note if present",
    "incidental_findings": "note significant incidentals"
  },
  "pe_management": "if PE present: anticoagulation strategy, thrombolysis consideration, IR/CT surgery notification",
  "immediate_actions": ["Specific action 1", "action 2"],
  "further_imaging": "Additional imaging if needed",
  "pearls": "Key ED pearl for this finding"
}`,
  },
  {
    id:"ct_abd", label:"CT Abdomen & Pelvis", icon:"🫃", color:T.orange,
    placeholder:`Paste CT abdomen/pelvis report here...

Example:
CT ABDOMEN AND PELVIS WITH CONTRAST
Liver: No focal lesion. No biliary dilation.
Gallbladder: Gallstones identified. Pericholecystic fluid. Wall thickening 5mm.
Appendix: Normal caliber. No periappendiceal fat stranding.
Bowel: No obstruction. No free air.
Kidneys: No hydronephrosis. No calculi.
Pelvis: No free fluid.
IMPRESSION: Acute cholecystitis. No appendicitis.`,
    systemPrompt:`You are an emergency medicine physician interpreting a CT abdomen/pelvis report for immediate ED management.

Respond ONLY in valid JSON, no markdown fences:
{
  "headline": "One sentence: most important finding",
  "critical_findings": ["Critical findings requiring immediate action — empty if none"],
  "key_findings": [
    { "finding": "Specific finding", "significance": "ED significance", "severity": "normal|incidental|concerning|critical" }
  ],
  "dont_miss_checklist": {
    "free_air": "absent|present — perforation until proven otherwise",
    "appendicitis": "absent|present|perforated — diameter, fat stranding",
    "cholecystitis": "absent|present|gangrenous — wall thickness, pericholecystic fluid",
    "bowel_obstruction": "absent|small bowel|large bowel — transition point, ischemia signs",
    "aaa": "absent|present — diameter, rupture signs, retroperitoneal hematoma",
    "mesenteric_ischemia": "absent|concerning — pneumatosis, portal venous gas",
    "diverticulitis": "absent|present — microperforation, abscess, fistula",
    "urolithiasis": "absent|present — size, location, hydronephrosis degree",
    "gynecologic": "normal|ectopic|ovarian torsion|TOA|other",
    "aortic_dissection": "absent|present — extent",
    "solid_organ_injury": "absent|liver|spleen|kidney — grade",
    "ascites": "absent|small|moderate|large",
    "incidental_findings": "significant incidentals requiring follow-up"
  },
  "surgical_consult": "emergent|urgent|routine|not indicated — reason",
  "immediate_actions": ["Specific action 1", "action 2"],
  "further_imaging": "Additional imaging if needed",
  "pearls": "Key ED pearl for this CT finding"
}`,
  },
];

function buildPatientCtx(demo, vitals, cc, pmhSelected, medications) {
  const lines = [];
  if (demo?.age || demo?.sex)
    lines.push(`${demo?.age || ""}yo ${demo?.sex || ""}`.trim());
  if (cc?.text) lines.push(`CC: ${cc.text}`);
  const vs = [];
  if (vitals?.hr)   vs.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vs.push(`BP ${vitals.bp}`);
  if (vitals?.spo2) vs.push(`SpO2 ${vitals.spo2}%`);
  if (vitals?.temp) vs.push(`T ${vitals.temp}C`);
  if (vs.length)    lines.push(`Vitals: ${vs.join("  ")}`);
  const pmh = (pmhSelected || []).slice(0, 5);
  if (pmh.length) lines.push(`PMH: ${pmh.join(", ")}`);
  const meds = (medications || [])
    .map(m => typeof m === "string" ? m : m.name || "")
    .filter(Boolean).slice(0, 4);
  if (meds.length) lines.push(`Meds: ${meds.join(", ")}`);
  return lines.join("\n");
}

function sevColor(sev) {
  return sev === "critical"   ? T.red
    : sev === "concerning"    ? T.coral
    : sev === "incidental"    ? T.blue
    : T.teal;
}

function ImagingResult({ result, panel }) {
  if (!result) return null;
  const pc = panel.color;

  return (
    <div className="img-fade">

      <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:9,
        background:`${pc}0c`, border:`1px solid ${pc}33` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:pc, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:3 }}>Summary</div>
        <div style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:15, color:T.txt,
          lineHeight:1.4 }}>{result.headline}</div>
      </div>

      {result.critical_findings?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:9,
          background:"rgba(255,68,68,0.1)",
          border:"1px solid rgba(255,68,68,0.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.red, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:6 }}>{"🚨 Critical Findings"}</div>
          {result.critical_findings.map((f, i) => (
            <div key={i} style={{ display:"flex", gap:6,
              alignItems:"flex-start", marginBottom:3 }}>
              <span style={{ color:T.red, fontSize:7,
                marginTop:3, flexShrink:0 }}>{"▸"}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, fontWeight:600, color:T.txt2 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {result.key_findings?.length > 0 && (
        <div style={{ marginBottom:9 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:6 }}>Key Findings</div>
          {result.key_findings.map((f, i) => {
            const sc = sevColor(f.severity);
            return (
              <div key={i} style={{ padding:"7px 10px", borderRadius:7,
                marginBottom:4,
                background:`${sc}09`,
                border:`1px solid ${sc}28`,
                borderLeft:`3px solid ${sc}` }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:7, marginBottom:2 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontWeight:700, fontSize:12, color:T.txt }}>
                    {f.finding}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:7, fontWeight:700, color:sc,
                    letterSpacing:1, textTransform:"uppercase",
                    background:`${sc}15`, border:`1px solid ${sc}35`,
                    borderRadius:4, padding:"1px 6px" }}>
                    {f.severity}
                  </span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt3 }}>{f.significance}</div>
              </div>
            );
          })}
        </div>
      )}

      {result.dont_miss_checklist && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:9,
          background:"rgba(8,22,40,0.65)",
          border:"1px solid rgba(42,79,122,0.35)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.gold, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:8 }}>{"Don't Miss — Checklist"}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {Object.entries(result.dont_miss_checklist).map(([key, val]) => {
              if (!val) return null;
              const absent   = /absent|normal|none|no /i.test(String(val));
              const critical = /present|tension|yes|type a|rupture|perforation|torsion/i.test(String(val));
              const dot = absent ? T.green : critical ? T.red : T.gold;
              const label = key.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={key} style={{ display:"flex", alignItems:"flex-start",
                  gap:7, padding:"4px 7px", borderRadius:6,
                  background:critical ? "rgba(255,68,68,0.07)" : "transparent" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%",
                    background:dot, flexShrink:0, marginTop:3 }} />
                  <div style={{ flex:1 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
                      {label}{": "}
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:absent ? T.txt4 : critical ? T.coral : T.gold,
                      marginLeft:6 }}>{val}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.neurosurgery_consult && (
        <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:9,
          background:"rgba(155,109,255,0.08)",
          border:"1px solid rgba(155,109,255,0.3)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1.5, textTransform:"uppercase" }}>
            {"Neurosurgery: "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>{result.neurosurgery_consult}</span>
        </div>
      )}
      {result.pe_management && (
        <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:9,
          background:"rgba(0,229,192,0.07)",
          border:"1px solid rgba(0,229,192,0.3)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase" }}>
            {"PE Management: "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>{result.pe_management}</span>
        </div>
      )}
      {result.surgical_consult && (
        <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:9,
          background:"rgba(255,159,67,0.07)",
          border:"1px solid rgba(255,159,67,0.3)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.orange, letterSpacing:1.5, textTransform:"uppercase" }}>
            {"Surgical Consult: "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>{result.surgical_consult}</span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9,
        marginBottom:9 }}>
        {result.immediate_actions?.length > 0 && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(0,229,192,0.06)",
            border:"1px solid rgba(0,229,192,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>{"⚡ Immediate Actions"}</div>
            {result.immediate_actions.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:6,
                alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.teal, flexShrink:0, minWidth:16 }}>
                  {i+1}{"."}
                </span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:11, color:T.txt2, lineHeight:1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        )}
        {result.further_imaging && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(59,158,255,0.06)",
            border:"1px solid rgba(59,158,255,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.blue, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>Further Imaging</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt2, lineHeight:1.65 }}>
              {result.further_imaging}
            </div>
          </div>
        )}
      </div>

      {result.pearls && (
        <div style={{ padding:"8px 11px", borderRadius:8,
          background:"rgba(155,109,255,0.07)",
          border:"1px solid rgba(155,109,255,0.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1.5, textTransform:"uppercase" }}>
            {"💎 Pearl: "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2 }}>{result.pearls}</span>
        </div>
      )}
    </div>
  );
}

export default function ImagingInterpreter({
  embedded = false,
  demo, vitals, cc, pmhSelected, medications,
}) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("cxr");
  const [reports,     setReports]     = useState({});
  const [results,     setResults]     = useState({});
  const [busy,        setBusy]        = useState({});
  const [errors,      setErrors]      = useState({});
  const [copied,      setCopied]      = useState({});

  const panel = PANELS.find(p => p.id === activePanel);

  const setReport = useCallback((panelId, val) => {
    setReports(p => ({ ...p, [panelId]:val }));
    setResults(p => ({ ...p, [panelId]:null }));
    setErrors(p  => ({ ...p, [panelId]:null }));
  }, []);

  const patientCtx = useMemo(() =>
    buildPatientCtx(demo, vitals, cc, pmhSelected, medications),
    [demo, vitals, cc, pmhSelected, medications]
  );

  const handleInterpret = useCallback(async (panelId) => {
    const p      = PANELS.find(x => x.id === panelId);
    const report = reports[panelId]?.trim();
    if (!report || !p) return;

    setBusy(prev => ({ ...prev, [panelId]:true }));
    setErrors(prev => ({ ...prev, [panelId]:null }));
    setResults(prev => ({ ...prev, [panelId]:null }));

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `PATIENT CONTEXT:\n${patientCtx || "Not provided"}\n\nRADIOLOGY REPORT:\n${report}\n\nSYSTEM INSTRUCTIONS:\n${p.systemPrompt}`,
        response_json_schema: {
          type:"object",
          properties:{
            headline:            { type:"string" },
            critical_findings:   { type:"array", items:{ type:"string" } },
            key_findings:        { type:"array", items:{ type:"object" } },
            dont_miss_checklist: { type:"object" },
            neurosurgery_consult:{ type:"string" },
            pe_management:       { type:"string" },
            surgical_consult:    { type:"string" },
            immediate_actions:   { type:"array", items:{ type:"string" } },
            further_imaging:     { type:"string" },
            pearls:              { type:"string" },
          },
        },
      });
      setResults(prev => ({ ...prev, [panelId]:response }));
    } catch (e) {
      setErrors(prev => ({
        ...prev,
        [panelId]:"Error: " + (e.message || "Check API connectivity"),
      }));
    } finally {
      setBusy(prev => ({ ...prev, [panelId]:false }));
    }
  }, [reports, patientCtx]);

  const copyResult = useCallback((panelId) => {
    const r = results[panelId];
    if (!r) return;
    const lines = [
      `IMAGING INTERPRETATION — ${PANELS.find(p=>p.id===panelId)?.label}`,
      `${new Date().toLocaleString()}`,
      "",
      `Summary: ${r.headline}`,
      r.critical_findings?.length ? "\nCRITICAL:\n" + r.critical_findings.map(f=>`  - ${f}`).join("\n") : "",
      r.key_findings?.length ? "\nFINDINGS:\n" + r.key_findings.map(f=>`  - ${f.finding} [${f.severity}] — ${f.significance}`).join("\n") : "",
      r.immediate_actions?.length ? "\nACTIONS:\n" + r.immediate_actions.map((a,i)=>`  ${i+1}. ${a}`).join("\n") : "",
      r.further_imaging ? `\nFURTHER IMAGING: ${r.further_imaging}` : "",
      r.pearls ? `\nPEARL: ${r.pearls}` : "",
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(prev => ({ ...prev, [panelId]:true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [panelId]:false })), 2500);
    });
  }, [results]);

  const clearPanel = useCallback((panelId) => {
    setReports(p => ({ ...p, [panelId]:"" }));
    setResults(p => ({ ...p, [panelId]:null }));
    setErrors(p  => ({ ...p, [panelId]:null }));
  }, []);

  const hasResult = Boolean(results[activePanel]);
  const isBusy    = Boolean(busy[activePanel]);
  const hasReport = Boolean(reports[activePanel]?.trim());
  const hasError  = Boolean(errors[activePanel]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1200, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10,
                display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              {"← Back to Hub"}
            </button>
            <div style={{ display:"flex", alignItems:"center",
              gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>IMAGING</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Imaging Interpreter
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              CXR · CT Head · CT Chest/PE · CT Abdomen — Paste Report · AI Interpretation · {"Don't-Miss"} Checklist
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center",
            gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.teal }}>
              Imaging Interpreter
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,0.1)",
              border:"1px solid rgba(0,229,192,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              CXR · CT Head · CT Chest · CT Abd
            </span>
          </div>
        )}

        {/* Panel tab strip */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
          {PANELS.map(p => {
            const active = activePanel === p.id;
            const hasRes = Boolean(results[p.id]);
            return (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, padding:"7px 14px", borderRadius:9,
                  cursor:"pointer", transition:"all .15s",
                  border:`1px solid ${active ? p.color+"66" : "rgba(26,53,85,0.4)"}`,
                  background:active
                    ? `linear-gradient(135deg,${p.color}18,${p.color}06)`
                    : "rgba(8,22,40,0.5)",
                  color:active ? p.color : T.txt4 }}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
                {hasRes && (
                  <span style={{ width:6, height:6, borderRadius:"50%",
                    background:T.green, flexShrink:0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Main layout */}
        <div style={{ display:"grid",
          gridTemplateColumns: hasResult ? "1fr 1.2fr" : "1fr",
          gap:12, alignItems:"start" }}>

          {/* Left: report input */}
          <div>
            {patientCtx && (
              <div style={{ padding:"7px 11px", borderRadius:8, marginBottom:9,
                background:"rgba(0,229,192,0.06)",
                border:"1px solid rgba(0,229,192,0.2)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:3 }}>Patient Context — included in interpretation</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:T.txt4, whiteSpace:"pre-wrap" }}>{patientCtx}</div>
              </div>
            )}

            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:panel?.color, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:5 }}>
                {panel?.icon}{" Paste "}{panel?.label}{" Report"}
              </div>
              <textarea
                value={reports[activePanel] || ""}
                onChange={e => setReport(activePanel, e.target.value)}
                rows={12}
                placeholder={panel?.placeholder || "Paste radiology report here..."}
                style={{ width:"100%", resize:"vertical",
                  background:"rgba(14,37,68,0.75)",
                  border:`1px solid ${hasReport
                    ? (panel?.color || T.teal) + "44"
                    : "rgba(42,79,122,0.35)"}`,
                  borderRadius:9, padding:"11px 12px", outline:"none",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  color:T.txt3, lineHeight:1.65 }} />
            </div>

            <div style={{ display:"flex", gap:7, alignItems:"center",
              flexWrap:"wrap" }}>
              <button
                onClick={() => handleInterpret(activePanel)}
                disabled={isBusy || !hasReport}
                style={{ flex:1, padding:"10px 0", borderRadius:10,
                  cursor:isBusy||!hasReport ? "not-allowed" : "pointer",
                  border:`1px solid ${!hasReport
                    ? "rgba(42,79,122,0.3)"
                    : (panel?.color || T.teal) + "66"}`,
                  background:!hasReport
                    ? "rgba(42,79,122,0.15)"
                    : `linear-gradient(135deg,${panel?.color || T.teal}18,${panel?.color || T.teal}06)`,
                  color:!hasReport ? T.txt4 : (panel?.color || T.teal),
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:13, transition:"all .15s" }}>
                {isBusy ? "⚙ Interpreting..." : `🔬 Interpret ${panel?.label}`}
              </button>
              {hasResult && (
                <button onClick={() => copyResult(activePanel)}
                  style={{ padding:"10px 16px", borderRadius:10, cursor:"pointer",
                    transition:"all .15s",
                    border:`1px solid ${copied[activePanel] ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                    background:copied[activePanel]
                      ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                    color:copied[activePanel] ? T.green : T.txt3,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:12 }}>
                  {copied[activePanel] ? "✓ Copied" : "Copy"}
                </button>
              )}
              <button onClick={() => clearPanel(activePanel)}
                style={{ padding:"10px 12px", borderRadius:10, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.35)",
                  background:"transparent", color:T.txt4,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  letterSpacing:1, textTransform:"uppercase" }}>
                Clear
              </button>
            </div>

            {hasError && (
              <div style={{ padding:"8px 11px", borderRadius:8, marginTop:8,
                background:"rgba(255,107,107,0.08)",
                border:"1px solid rgba(255,107,107,0.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.coral }}>{errors[activePanel]}</div>
            )}

            {!hasReport && (
              <div style={{ marginTop:10, padding:"8px 11px", borderRadius:8,
                background:"rgba(42,79,122,0.08)",
                border:"1px solid rgba(42,79,122,0.25)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:5 }}>How to Use</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4, lineHeight:1.65 }}>
                  Paste the full radiology report text — findings and impression.
                  Include the impression section for best results.
                  The AI will generate an ED-specific interpretation with
                  {"don't-miss"} checklist, immediate actions, and clinical pearls.
                  Patient context from the encounter is automatically included.
                </div>
              </div>
            )}
          </div>

          {/* Right: AI result */}
          {hasResult && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:panel?.color, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:8 }}>
                {"ED Interpretation — "}{panel?.label}
              </div>
              <ImagingResult result={results[activePanel]} panel={panel} />
            </div>
          )}
        </div>

        {/* Status strip */}
        {PANELS.some(p => results[p.id]) && (
          <div style={{ display:"flex", gap:7, flexWrap:"wrap",
            marginTop:12, padding:"8px 12px", borderRadius:9,
            background:"rgba(8,22,40,0.6)",
            border:"1px solid rgba(26,53,85,0.35)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              alignSelf:"center" }}>
              Interpreted:
            </span>
            {PANELS.filter(p => results[p.id]).map(p => (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"3px 9px", borderRadius:6, cursor:"pointer",
                  border:`1px solid ${p.color}44`,
                  background:`${p.color}10`,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:p.color, letterSpacing:0.5 }}>
                <span style={{ width:6, height:6, borderRadius:"50%",
                  background:p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA IMAGING INTERPRETER · AI DECISION SUPPORT · ALWAYS CONFIRM WITH FORMAL RADIOLOGY READ · NOT A SUBSTITUTE FOR RADIOLOGIST INTERPRETATION
          </div>
        )}
      </div>
    </div>
  );
}