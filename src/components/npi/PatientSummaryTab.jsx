import { useState } from "react";
import { computeEMLevel, EM_LEVEL_MAP, SEPSIS_BUNDLE_ITEMS } from "@/components/npi/npiData";

export default function PatientSummaryTab({ demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx, rosState, rosSymptoms, peState,
  peFindings, esiLevel, registration, sdoh, consults, sepsisBundle, mdmState,
  isarState, pdmpState, onAdvance }) {
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList     = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);

  // ── sdohPos: exclude PHQ-2, AUDIT-C, and tobacco keys — they use different scoring ──
  const sdohPos = Object.entries(sdoh || {})
    .filter(([k, v]) => !k.startsWith("phq2") && !k.startsWith("auditc") && k !== "tobacco" && v === "2")
    .map(([k]) => k);

  const rosPos   = Object.entries(rosState || {}).filter(([,v]) => v === "has-positives").map(([k]) => k);
  const pePos    = Object.entries(peState  || {}).filter(([,v]) => v==="abnormal"||v==="has-positives"||v==="mixed").map(([k]) => k);
  const sympList = Array.isArray(rosSymptoms) ? rosSymptoms : Object.keys(rosSymptoms||{}).filter(k=>rosSymptoms[k]);
  const esiCol   = esiLevel<=2 ? "var(--npi-coral)" : esiLevel===3 ? "var(--npi-orange)" : "var(--npi-teal)";

  // ── Behavioral screens ────────────────────────────────────────────────────
  const phq2Score    = parseInt(sdoh?.phq2q1||"0") + parseInt(sdoh?.phq2q2||"0");
  const phq2Done     = sdoh?.phq2q1 !== "" && sdoh?.phq2q2 !== "" && sdoh?.phq2q1 !== undefined;
  const phq2Positive = phq2Done && phq2Score >= 3;
  const auditcScore  = parseInt(sdoh?.auditcq1||"0") + parseInt(sdoh?.auditcq2||"0") + parseInt(sdoh?.auditcq3||"0");
  const auditcDone   = sdoh?.auditcq1 !== "" && sdoh?.auditcq2 !== "" && sdoh?.auditcq3 !== "" && sdoh?.auditcq1 !== undefined;
  const sexLower     = (demo?.sex||"").toLowerCase();
  const auditcThresh = sexLower === "female" || sexLower === "f" ? 3 : 4;
  const auditcPos    = auditcDone && auditcScore >= auditcThresh;
  const anyBehavioralScreen = phq2Done || auditcDone;

  // ── Sepsis bundle ─────────────────────────────────────────────────────────
  const anySepisStamped = sepsisBundle && Object.values(sepsisBundle).some(Boolean);
  const lactateToAbx = (sepsisBundle?.lactateOrdered && sepsisBundle?.abxOrdered) ? (() => {
    const [lh,lm] = sepsisBundle.lactateOrdered.split(":").map(Number);
    const [ah,am] = sepsisBundle.abxOrdered.split(":").map(Number);
    const d = (ah*60+am) - (lh*60+lm);
    return d >= 0 && d <= 720 ? d : null;
  })() : null;
  const lac1 = parseFloat(sepsisBundle?.lactateValue||"0");
  const lac2 = parseFloat(sepsisBundle?.repeatLactateValue||"0");
  const clearancePct = lac1 > 0 && lac2 > 0 ? Math.round((lac1 - lac2) / lac1 * 100) : null;

  // ── MDM snapshot ─────────────────────────────────────────────────────────
  const mdmDone  = Boolean(mdmState?.copa || mdmState?.risk);
  const emRank   = mdmState ? computeEMLevel(mdmState.copa, mdmState.dataLevel, mdmState.risk) : 0;
  const emLevel  = emRank ? EM_LEVEL_MAP[emRank] : null;

  // ── ISAR fall risk ────────────────────────────────────────────────────────
  const isarScore    = isarState
    ? (isarState.q1===true?1:0)+(isarState.q2===true?1:0)+
      (isarState.q3===false?1:0)+(isarState.q4===true?1:0)+
      (isarState.q5===true?1:0)+(isarState.q6===true?1:0)
    : 0;
  const isarAnswered = isarState && Object.values(isarState).some(v => v !== null);
  const isarComplete = isarState && Object.values(isarState).every(v => v !== null);
  const isarHighRisk = isarComplete && isarScore >= 2;

  // ── PDMP status ───────────────────────────────────────────────────────────
  const CTRL_RE     = /morphine|oxycodone|hydrocodone|hydromorphone|fentanyl|codeine|tramadol|buprenorphine|methadone|lorazepam|diazepam|alprazolam|clonazepam|zolpidem|zaleplon|amphetamine|methylphenidate|carisoprodol/i;
  const hasCtrl     = (medications||[]).some(m => CTRL_RE.test(m));
  const pdmpChecked = Boolean(pdmpState?.checked);
  const pdmpRisk    = hasCtrl && !pdmpChecked;

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
        sdohPos.length ? `SDOH positive screens: ${sdohPos.join(", ")}.` : "",
        phq2Done  ? `PHQ-2: ${phq2Score}/6 — ${phq2Positive ? "positive" : "negative"}.` : "",
        auditcDone ? `AUDIT-C: ${auditcScore}/12 — ${auditcPos ? "positive" : "negative"}.` : "",
        anySepisStamped && sepsisBundle.abxOrdered ? `Sepsis bundle: ABX ordered ${sepsisBundle.abxOrdered}${lactateToAbx !== null ? ", door-to-ABX "+lactateToAbx+"m" : ""}.` : "",
        emLevel ? `MDM: ${emLevel.label} — ED code ${emLevel.ed}.` : "",
      ].filter(Boolean).join(" ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 300,
          system: "Write a concise 2-3 sentence clinical handoff summary for physician-to-physician ED handoff. Return ONLY valid JSON: {\"summary\":\"...\"}",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      setAiSummary(JSON.parse(raw)?.summary || "");
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
              \u26A0 {allergies.join(", ")}
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
                  color:"var(--npi-green)", fontWeight:600 }}>\u2713 NKDA</div>
              : allergies.map((a,i) => <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, color:"var(--npi-coral)" }}>\u26A0 {a}</div>)
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
          <Card title="ROS \u2014 Positives" color="var(--npi-gold)">
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
          <Card title="PE \u2014 Abnormal Findings" color="var(--npi-orange)">
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
              <Card title="SDOH \u2014 Positive Screens" color="var(--npi-coral)">
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

        {/* ── Behavioral Health Screens ── */}
        {anyBehavioralScreen && (
          <Card title="Behavioral Health Screens" color="#9b6dff">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {phq2Done && (
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    color:"var(--npi-txt4)", letterSpacing:.5 }}>PHQ-2</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15,
                    fontWeight:700, color: phq2Positive ? "#ff8a8a" : "var(--npi-teal)" }}>
                    {phq2Score}<span style={{ fontSize:10, fontWeight:400, color:"var(--npi-txt4)" }}>/6</span>
                  </span>
                  <Chip label={phq2Positive ? "\u26A0 Positive" : "\u2713 Negative"}
                    color={phq2Positive ? "#ff8a8a" : "var(--npi-teal)"} />
                </div>
              )}
              {phq2Done && auditcDone && (
                <div style={{ width:1, background:"rgba(42,77,114,0.4)", alignSelf:"stretch" }} />
              )}
              {auditcDone && (
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    color:"var(--npi-txt4)", letterSpacing:.5 }}>AUDIT-C</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15,
                    fontWeight:700, color: auditcPos ? "#ff9f43" : "var(--npi-teal)" }}>
                    {auditcScore}<span style={{ fontSize:10, fontWeight:400, color:"var(--npi-txt4)" }}>/12</span>
                  </span>
                  <Chip label={auditcPos ? "\u26A0 Positive" : "\u2713 Negative"}
                    color={auditcPos ? "#ff9f43" : "var(--npi-teal)"} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--npi-txt4)" }}>(threshold \u2265{auditcThresh})</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── ISAR Fall Risk ── */}
        {isarAnswered && (
          <Card title="ISAR-6 Fall Risk" color={isarHighRisk ? "#ff8a8a" : "var(--npi-teal)"}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ textAlign:"center", flexShrink:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:900,
                  color: isarHighRisk ? "#ff8a8a" : "var(--npi-teal)", lineHeight:1 }}>
                  {isarScore}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color: isarHighRisk ? "#ff8a8a" : "var(--npi-teal)", letterSpacing:1 }}>
                  / 6
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
                  color: isarHighRisk ? "#ff8a8a" : isarComplete ? "var(--npi-teal)" : "var(--npi-txt3)",
                  marginBottom:3 }}>
                  {isarHighRisk ? "\u26A0 High Risk" : isarComplete ? "\u2713 Low Risk" : "Partially completed"}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>
                  {isarComplete
                    ? `${isarScore}/6 \u2014 threshold \u22652 for high risk`
                    : `${Object.values(isarState).filter(v=>v!==null).length}/6 questions answered`}
                </div>
                {isarHighRisk && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#ff8a8a",
                    marginTop:5, lineHeight:1.55 }}>
                    Fall prevention order set \u00b7 PT/OT evaluation \u00b7 home safety assessment
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ── PDMP Status ── */}
        {(hasCtrl || pdmpChecked) && (
          <Card title="PDMP Documentation" color={pdmpRisk ? "var(--npi-coral)" : "var(--npi-teal)"}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                background: pdmpChecked ? "rgba(0,229,192,0.12)" : "rgba(255,107,107,0.1)",
                border:`2px solid ${pdmpChecked ? "var(--npi-teal)" : "var(--npi-coral)"}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                &#x1F4CB;
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
                  color: pdmpChecked ? "var(--npi-teal)" : "var(--npi-coral)", marginBottom:3 }}>
                  {pdmpChecked ? "\u2713 PDMP Checked" : "\u26A0 PDMP Not Documented"}
                </div>
                {pdmpChecked && (
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-txt4)" }}>
                    {pdmpState.timestamp}{pdmpState.method ? ` \u2014 ${pdmpState.method}` : ""}
                  </div>
                )}
                {!pdmpChecked && hasCtrl && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)" }}>
                    Controlled substance on medication list \u2014 document PDMP check in Meds tab before prescribing
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ── Sepsis Bundle ── */}
        {anySepisStamped && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {SEPSIS_BUNDLE_ITEMS.filter(i => sepsisBundle[i.key]).map(item => (
                <div key={item.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt3)", flex:1 }}>{item.label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                    color:"var(--npi-teal)", background:"rgba(0,229,192,0.08)",
                    border:"1px solid rgba(0,229,192,0.2)", borderRadius:5,
                    padding:"1px 7px" }}>{sepsisBundle[item.key]}</span>
                </div>
              ))}
              {(lactateToAbx !== null || clearancePct !== null) && (
                <div style={{ marginTop:4, paddingTop:6, borderTop:"1px solid rgba(26,53,85,0.35)",
                  display:"flex", gap:14, flexWrap:"wrap",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:.5 }}>
                  {lactateToAbx !== null && (
                    <span style={{ color: lactateToAbx <= 180 ? "var(--npi-teal)" : "#ff8a8a" }}>
                      Lactate \u2192 ABX: {lactateToAbx}m {lactateToAbx <= 180 ? "\u2713" : "\u26A0 >3h"}
                    </span>
                  )}
                  {clearancePct !== null && (
                    <span style={{ color: clearancePct >= 10 ? "var(--npi-teal)" : "#ff8a8a" }}>
                      Clearance: {clearancePct}% {clearancePct >= 10 ? "\u2713 \u226510%" : "\u26A0 <10%"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── MDM Snapshot ── */}
        {mdmDone && (
          <Card title="MDM Snapshot \u2014 AMA CPT 2023" color={emLevel?.color || "#f5c842"}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: mdmState.narrative ? 8 : 0 }}>
              {mdmState.copa && <Chip label={`COPA: ${mdmState.copa}`}
                color={["","#8892a4","#00e5c0","#f5c842","#ff6b6b"][["","minimal","low","moderate","high"].indexOf(mdmState.copa)] || "#f5c842"} />}
              {mdmState.dataLevel && <Chip label={`Data: ${mdmState.dataLevel}`}
                color={mdmState.dataLevel==="high"?"#ff6b6b":mdmState.dataLevel==="moderate"?"#f5c842":mdmState.dataLevel==="limited"?"#00e5c0":"#8892a4"} />}
              {mdmState.risk && <Chip label={`Risk: ${mdmState.risk}`}
                color={["","#8892a4","#00e5c0","#f5c842","#ff6b6b"][["","minimal","low","moderate","high"].indexOf(mdmState.risk)] || "#f5c842"} />}
              {emLevel && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  fontWeight:700, padding:"2px 9px", borderRadius:20,
                  background:`${emLevel.color}18`, border:`1px solid ${emLevel.color}44`,
                  color:emLevel.color }}>
                  {emLevel.ed} (ED)
                </span>
              )}
            </div>
            {mdmState.narrative && (
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", lineHeight:1.6, borderTop:"1px solid rgba(26,53,85,0.35)",
                paddingTop:6, whiteSpace:"pre-wrap" }}>
                {mdmState.narrative.slice(0, 280)}{mdmState.narrative.length > 280 ? "\u2026" : ""}
              </div>
            )}
          </Card>
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