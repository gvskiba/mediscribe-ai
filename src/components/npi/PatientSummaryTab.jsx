import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function PatientSummaryTab({ demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx, rosState, rosSymptoms, peState,
  peFindings, esiLevel, registration, sdoh, consults, onAdvance }) {
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList     = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);
  const sdohPos     = Object.entries(sdoh || {}).filter(([,v]) => v === "2").map(([k]) => k);
  const rosPos      = Object.entries(rosState || {}).filter(([,v]) => v === "has-positives").map(([k]) => k);
  const pePos       = Object.entries(peState  || {}).filter(([,v]) => v==="abnormal"||v==="has-positives"||v==="mixed").map(([k]) => k);
  const sympList    = Array.isArray(rosSymptoms) ? rosSymptoms : Object.keys(rosSymptoms||{}).filter(k=>rosSymptoms[k]);
  const esiCol      = esiLevel<=2 ? "var(--npi-coral)" : esiLevel===3 ? "var(--npi-orange)" : "var(--npi-teal)";

  async function generateSummary() {
    setAiLoading(true);
    try {
      const prompt = [
        "Write a concise 2-3 sentence clinical handoff summary for a physician-to-physician handoff in an emergency department.",
        `Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}.`,
        `Chief complaint: ${cc.text||"not documented"}.`,
        `Vitals: BP ${vitals.bp||"-"} HR ${vitals.hr||"-"} RR ${vitals.rr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.`,
        `Allergies: ${allergies.length ? allergies.join(", ") : "NKDA"}.`,
        `Medications: ${medications.slice(0,5).join("; ")||"none documented"}.`,
        `PMH: ${pmhList.slice(0,5).join(", ")||"none"}.`,
        rosPos.length ? `ROS positives: ${rosPos.join(", ")}.` : "",
        pePos.length  ? `PE abnormals: ${pePos.join(", ")}.`   : "",
      ].filter(Boolean).join(" ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type:"object", properties:{ summary:{ type:"string" } } },
      });
      setAiSummary(res?.summary || "");
    } catch(_) { setAiSummary("AI summary unavailable — please enter manually."); }
    finally    { setAiLoading(false); }
  }

  function Card({ title, color, children }) {
    return (
      <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(14,37,68,0.7)",
        border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{title}</div>
        {children}
      </div>
    );
  }

  function Chip({ label, color }) {
    return (
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
        padding:"2px 8px", borderRadius:20, background:`${color}15`,
        border:`1px solid ${color}30`, color, whiteSpace:"nowrap" }}>{label}</span>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(26,53,85,0.4)",
        background:"rgba(5,15,30,0.6)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:17, color:"var(--npi-txt)" }}>{patientName}</span>
          {demo.age && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
            color:"var(--npi-txt3)" }}>{demo.age}y {demo.sex && `\xb7 ${demo.sex}`}</span>}
          {registration.mrn && <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, color:"var(--npi-txt4)" }}>MRN {registration.mrn}</span>}
          {registration.room && <Chip label={`Room ${registration.room}`} color="var(--npi-teal)" />}
          {esiLevel && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
              padding:"2px 8px", borderRadius:6, color:esiCol,
              background:`${esiCol}15`, border:`1px solid ${esiCol}40` }}>
              ESI {esiLevel}
            </span>
          )}
          {allergies.length > 0 && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
              color:"var(--npi-coral)", fontWeight:700 }}>
              &#x26A0; {allergies.join(", ")}
            </span>
          )}
        </div>
        {cc.text && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--npi-txt)", marginTop:4 }}>
            <strong>CC:</strong> {cc.text}
            {cc.onset    && ` \xb7 onset: ${cc.onset}`}
            {cc.severity && ` \xb7 severity ${cc.severity}/10`}
          </div>
        )}
      </div>

      <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10, paddingBottom:80 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Card title="Vital Signs" color="var(--npi-blue)">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {[{l:"BP",v:vitals.bp},{l:"HR",v:vitals.hr},{l:"RR",v:vitals.rr},
                {l:"SpO\u2082",v:vitals.spo2},{l:"Temp",v:vitals.temp},{l:"GCS",v:vitals.gcs}].map(r=>(
                <div key={r.l}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--npi-txt4)", letterSpacing:1 }}>{r.l}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13,
                    fontWeight:700, color:r.v?"var(--npi-txt)":"var(--npi-txt4)" }}>{r.v||"\u2014"}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Medications & Allergies" color="var(--npi-coral)">
            {allergies.length===0
              ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-green)", fontWeight:600 }}>&#x2713; NKDA</div>
              : allergies.map((a,i) => <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, color:"var(--npi-coral)" }}>&#x26A0; {a}</div>)
            }
            {medications.length > 0 && (
              <div style={{ marginTop:6, borderTop:"1px solid rgba(26,53,85,0.3)", paddingTop:6 }}>
                {medications.slice(0,5).map((m,i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                    color:"var(--npi-txt3)", lineHeight:1.5 }}>{m}</div>
                ))}
                {medications.length > 5 && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt4)" }}>+{medications.length-5} more</div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <Card title="Past Medical History" color="var(--npi-purple)">
            {pmhList.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>None documented</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {pmhList.slice(0,8).map(c=><Chip key={c} label={c} color="var(--npi-purple)" />)}
                  {pmhList.length>8 && <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:"var(--npi-txt4)" }}>+{pmhList.length-8}</span>}
                </div>
            }
            {(surgHx||famHx) && (
              <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)" }}>
                {surgHx && <div>Surg: {surgHx.slice(0,60)}{surgHx.length>60?"...":""}</div>}
                {famHx  && <div>FHx: {famHx.slice(0,60)}{famHx.length>60?"...":""}</div>}
              </div>
            )}
          </Card>
          <Card title="ROS — Positives" color="var(--npi-gold)">
            {rosPos.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>No positives</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {rosPos.map(s=><Chip key={s} label={s} color="var(--npi-gold)" />)}
                </div>
            }
            {sympList.length > 0 && (
              <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:"var(--npi-txt3)" }}>
                {sympList.slice(0,4).join(", ")}
              </div>
            )}
          </Card>
          <Card title="PE — Abnormal Findings" color="var(--npi-orange)">
            {pePos.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>No abnormals</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {pePos.map(s=><Chip key={s} label={s} color="var(--npi-orange)" />)}
                </div>
            }
          </Card>
        </div>

        {(sdohPos.length > 0 || consults.length > 0) && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {sdohPos.length > 0 && (
              <Card title="SDOH — Positive Screens" color="var(--npi-coral)">
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {sdohPos.map(d=><Chip key={d} label={d} color="var(--npi-coral)" />)}
                </div>
              </Card>
            )}
            {consults.length > 0 && (
              <Card title="Active Consults" color="var(--npi-teal)">
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {consults.map((c,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                        color:"var(--npi-txt)", fontWeight:600 }}>{c.service}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:c.status==="completed"?"var(--npi-green)":"var(--npi-gold)" }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        <div style={{ padding:"14px 16px", borderRadius:10,
          background:"rgba(59,158,255,0.05)", border:"1px solid rgba(59,158,255,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--npi-blue)", letterSpacing:1.5, textTransform:"uppercase" }}>
              AI Clinical Narrative
            </div>
            <button onClick={generateSummary} disabled={aiLoading}
              style={{ padding:"5px 14px", borderRadius:7,
                border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)",
                color:"var(--npi-blue)", fontFamily:"'DM Sans',sans-serif",
                fontSize:11, fontWeight:600, cursor:aiLoading?"default":"pointer" }}>
              {aiLoading ? "Generating\u2026" : "\u2728 Generate Summary"}
            </button>
          </div>
          {aiSummary
            ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                color:"var(--npi-txt2)", lineHeight:1.8 }}>{aiSummary}</div>
            : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--npi-txt4)", fontStyle:"italic" }}>
                Click Generate for an AI-composed one-glance clinical narrative of this encounter
              </div>
          }
        </div>

        {onAdvance && (
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={onAdvance}
              style={{ padding:"9px 22px", borderRadius:9,
                background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Continue to HPI &#9654;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}