import { SDOH_DOMAINS, TIER_COLORS, PHQ2_COLORS, PHQ2_OPTS, PHQ2_QUESTIONS, AUDITC_COLORS, AUDITC_QUESTIONS } from "@/components/npi/npiData";

export default function SDOHWidget({ sdoh, setSdoh, onAdvance, patientSex }) {
  // G0136 counts only the 6 CMS Gravity Protocol domains — tobacco is a separate CEDR measure
  const sdohScreenedCount = SDOH_DOMAINS.filter(d => sdoh[d.key]).length;
  const positiveCount     = SDOH_DOMAINS.filter(d => sdoh[d.key] === "2").length;
  const concernCount      = SDOH_DOMAINS.filter(d => sdoh[d.key] === "1").length;
  const g0136Eligible     = sdohScreenedCount >= 4;
  const tobaccoVal        = sdoh.tobacco || "";
  const tobaccoScreened   = Boolean(tobaccoVal);

  const TOBACCO_OPTS = ["Non-user", "Former user", "Current user"];
  const tobaccoCol = tobaccoVal === "2" ? "#ff6b6b" : tobaccoVal === "1" ? "#f5c842" : "#00e5c0";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--npi-txt)" }}>
            SDOH Screening
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", marginTop:2 }}>
            Social Determinants of Health — CMS Gravity Protocol
          </div>
        </div>
        {g0136Eligible && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5, textTransform:"uppercase",
            padding:"4px 10px", borderRadius:6, background:"rgba(0,229,192,0.1)",
            border:"1px solid rgba(0,229,192,0.35)", color:"var(--npi-teal)" }}>
            G0136 Billable
          </span>
        )}
      </div>

      {/* MDM positive-screen alert */}
      {positiveCount > 0 && (
        <div style={{ padding:"10px 14px", borderRadius:9, background:"rgba(255,107,107,0.07)",
          border:"1px solid rgba(255,107,107,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"#ff8a8a", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14 }}>&#x26A0;</span>
          <span><strong>{positiveCount}</strong> positive screen{positiveCount>1?"s":""} — document social risk in MDM (counts as Moderate Risk, AMA CPT 2023)</span>
        </div>
      )}

      {/* 6 SDOH domains */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {SDOH_DOMAINS.map(d => (
          <div key={d.key} style={{ padding:"10px 12px", borderRadius:9,
            background:"rgba(14,37,68,0.6)",
            border:`1px solid ${sdoh[d.key]==="2"?"rgba(255,107,107,0.35)":sdoh[d.key]==="1"?"rgba(245,200,66,0.3)":"rgba(26,53,85,0.5)"}`}}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)", display:"flex", alignItems:"center", gap:6 }}>
                {d.icon} {d.label}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>{d.q}</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {d.opts.map((opt, i) => {
                const active = sdoh[d.key] === String(i);
                const col = TIER_COLORS[String(i)];
                return (
                  <button key={i} onClick={() => setSdoh(p => ({ ...p, [d.key]: active ? "" : String(i) }))}
                    style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer", fontSize:11,
                      fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                      border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                      background: active ? col+"18" : "transparent",
                      color: active ? col : "var(--npi-txt4)", transition:"all .12s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SDOH footer */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1,
        display:"flex", gap:16, paddingTop:4 }}>
        <span>{sdohScreenedCount}/6 domains screened</span>
        {concernCount > 0  && <span style={{ color:"#f5c842" }}>{concernCount} at-risk</span>}
        {positiveCount > 0 && <span style={{ color:"#ff8a8a" }}>{positiveCount} positive</span>}
        {!g0136Eligible && sdohScreenedCount > 0 && <span>Screen {4-sdohScreenedCount} more for G0136</span>}
      </div>

      {/* ── Tobacco Use Screening (CEDR NQF-0028) ──────────────────────────── */}
      <div style={{ borderTop:"1px solid rgba(26,53,85,0.45)", paddingTop:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)" }}>
              &#x1F6AC; Tobacco Use Screening
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1, textTransform:"uppercase",
              padding:"2px 7px", borderRadius:4, background:"rgba(59,158,255,0.1)",
              border:"1px solid rgba(59,158,255,0.25)", color:"#3b9eff" }}>
              CEDR NQF-0028
            </span>
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>
            Current tobacco use status
          </span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {TOBACCO_OPTS.map((opt, i) => {
            const active = tobaccoVal === String(i);
            const col = TIER_COLORS[String(i)];
            return (
              <button key={i} onClick={() => setSdoh(p => ({ ...p, tobacco: active ? "" : String(i) }))}
                style={{ flex:1, padding:"7px 4px", borderRadius:7, cursor:"pointer", fontSize:11,
                  fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                  border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                  background: active ? col+"18" : "transparent",
                  color: active ? col : "var(--npi-txt4)", transition:"all .12s" }}>
                {opt}
              </button>
            );
          })}
        </div>
        {tobaccoVal === "2" && (
          <div style={{ marginTop:8, padding:"8px 11px", borderRadius:7,
            background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.55 }}>
            Current tobacco user — document cessation counseling or referral in the note to satisfy CEDR measure.
          </div>
        )}
        {tobaccoVal === "1" && (
          <div style={{ marginTop:8, padding:"8px 11px", borderRadius:7,
            background:"rgba(245,200,66,0.06)", border:"1px solid rgba(245,200,66,0.22)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f5c842", lineHeight:1.55 }}>
            Former tobacco user — document cessation history in social history.
          </div>
        )}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1, marginTop:8 }}>
          {tobaccoScreened ? "\u2713 Tobacco screen documented" : "Tobacco screen not yet documented"}
        </div>
      </div>

      {/* ── PHQ-2 Depression Screening (CMS eCQM #134 / NQF-0418) ────────────── */}
      {(() => {
        const q1val      = sdoh.phq2q1 || "";
        const q2val      = sdoh.phq2q2 || "";
        const phq2Score  = parseInt(q1val||"0") + parseInt(q2val||"0");
        const phq2Done   = q1val !== "" && q2val !== "";
        const phq2Pos    = phq2Done && phq2Score >= 3;
        const phq2Screen = q1val !== "" || q2val !== "";
        return (
          <div style={{ borderTop:"1px solid rgba(26,53,85,0.45)", paddingTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)" }}>
                  &#x1F9E0; PHQ-2 Depression Screening
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1, textTransform:"uppercase",
                  padding:"2px 7px", borderRadius:4, background:"rgba(155,109,255,0.1)",
                  border:"1px solid rgba(155,109,255,0.25)", color:"#9b6dff" }}>
                  CMS #134 / NQF-0418
                </span>
              </div>
              {phq2Done && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color: phq2Pos ? "#ff8a8a" : "var(--npi-teal)", letterSpacing:.5 }}>
                  Score {phq2Score}/6{phq2Pos ? " \u2014 Positive" : " \u2014 Negative"}
                </span>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {PHQ2_QUESTIONS.map(({ key, q }) => {
                const val = sdoh[key] || "";
                return (
                  <div key={key} style={{ padding:"10px 12px", borderRadius:9,
                    background:"rgba(14,37,68,0.6)",
                    border:`1px solid ${val==="3"?"rgba(255,107,107,0.35)":val==="2"?"rgba(255,159,67,0.3)":val==="1"?"rgba(245,200,66,0.25)":"rgba(26,53,85,0.5)"}`}}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", marginBottom:8, lineHeight:1.45 }}>
                      {q}
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      {PHQ2_OPTS.map((opt, i) => {
                        const active = val === String(i);
                        const col    = PHQ2_COLORS[String(i)];
                        return (
                          <button key={i} onClick={() => setSdoh(p => ({ ...p, [key]: active ? "" : String(i) }))}
                            style={{ flex:1, padding:"5px 3px", borderRadius:7, cursor:"pointer",
                              fontSize:10, fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                              border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                              background: active ? col+"18" : "transparent",
                              color: active ? col : "var(--npi-txt4)", transition:"all .12s",
                              lineHeight:1.3, textAlign:"center" }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {phq2Pos && (
              <div style={{ marginTop:9, padding:"9px 12px", borderRadius:8,
                background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.55 }}>
                <span style={{ fontWeight:700 }}>PHQ-2 positive (score {phq2Score}/6)</span> \u2014 consider PHQ-9 follow-up, safety assessment, and document behavioral health plan in MDM. Counts toward Moderate Risk (AMA CPT 2023 Table of Risk \u2014 psychiatric comorbidity affecting management).
              </div>
            )}
            {phq2Done && !phq2Pos && (
              <div style={{ marginTop:8, padding:"7px 11px", borderRadius:7,
                background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.18)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-teal)", lineHeight:1.5 }}>
                PHQ-2 negative \u2014 depression screen documented. No further action required for this measure.
              </div>
            )}

            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1, marginTop:8, display:"flex", gap:16 }}>
              {phq2Screen
                ? <span style={{ color: phq2Pos ? "#ff8a8a" : phq2Done ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
                    {phq2Done ? "\u2713 PHQ-2 documented" : "PHQ-2 partially documented"}
                  </span>
                : <span>PHQ-2 screen not yet documented</span>
              }
              {phq2Done && <span>Score: {phq2Score} / 6 (threshold \u22653)</span>}
            </div>
          </div>
        );
      })()}

      {/* ── AUDIT-C Alcohol Screening (MIPS #431 / USPSTF Grade B) ─────────── */}
      {(() => {
        const q1 = sdoh.auditcq1 || "";
        const q2 = sdoh.auditcq2 || "";
        const q3 = sdoh.auditcq3 || "";
        const auditcScore   = parseInt(q1||"0") + parseInt(q2||"0") + parseInt(q3||"0");
        const auditcDone    = q1 !== "" && q2 !== "" && q3 !== "";
        const auditcScreen  = q1 !== "" || q2 !== "" || q3 !== "";
        // USPSTF threshold: ≥3 women, ≥4 men; use sex if known, else ≥4 (conservative)
        const sexLower      = (patientSex||"").toLowerCase();
        const threshold     = sexLower === "female" || sexLower === "f" ? 3 : 4;
        const auditcPos     = auditcDone && auditcScore >= threshold;
        return (
          <div style={{ borderTop:"1px solid rgba(26,53,85,0.45)", paddingTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)" }}>
                  &#x1F37A; AUDIT-C Alcohol Screening
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1, textTransform:"uppercase",
                  padding:"2px 7px", borderRadius:4, background:"rgba(255,159,67,0.1)",
                  border:"1px solid rgba(255,159,67,0.25)", color:"#ff9f43" }}>
                  MIPS #431
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1, textTransform:"uppercase",
                  padding:"2px 7px", borderRadius:4, background:"rgba(59,158,255,0.08)",
                  border:"1px solid rgba(59,158,255,0.22)", color:"#3b9eff" }}>
                  USPSTF B
                </span>
              </div>
              {auditcDone && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color: auditcPos ? "#ff8a8a" : "var(--npi-teal)", letterSpacing:.5 }}>
                  Score {auditcScore}/12{auditcPos ? " \u2014 Positive" : " \u2014 Negative"}
                </span>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {AUDITC_QUESTIONS.map(({ key, q, opts }) => {
                const val = sdoh[key] || "";
                return (
                  <div key={key} style={{ padding:"10px 12px", borderRadius:9,
                    background:"rgba(14,37,68,0.6)",
                    border:`1px solid ${val==="4"?"rgba(255,107,107,0.35)":val==="3"?"rgba(255,159,67,0.3)":val==="2"?"rgba(245,200,66,0.25)":"rgba(26,53,85,0.5)"}`}}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", marginBottom:8, lineHeight:1.45 }}>
                      {q}
                    </div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {opts.map((opt, i) => {
                        const active = val === String(i);
                        const col    = AUDITC_COLORS[String(i)];
                        return (
                          <button key={i} onClick={() => setSdoh(p => ({ ...p, [key]: active ? "" : String(i) }))}
                            style={{ flex:"1 0 auto", minWidth:0, padding:"5px 3px", borderRadius:7, cursor:"pointer",
                              fontSize:10, fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                              border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                              background: active ? col+"18" : "transparent",
                              color: active ? col : "var(--npi-txt4)", transition:"all .12s",
                              lineHeight:1.3, textAlign:"center" }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {auditcPos && (
              <div style={{ marginTop:9, padding:"9px 12px", borderRadius:8,
                background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.55 }}>
                <span style={{ fontWeight:700 }}>AUDIT-C positive (score {auditcScore}/12, threshold \u2265{threshold})</span> \u2014 provide brief counseling intervention per USPSTF guidance or refer for further evaluation. Document counseling in the note to satisfy MIPS #431. Counts toward Moderate Risk in AMA CPT 2023 MDM (substance use management affecting care).
              </div>
            )}
            {auditcDone && !auditcPos && (
              <div style={{ marginTop:8, padding:"7px 11px", borderRadius:7,
                background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.18)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-teal)", lineHeight:1.5 }}>
                AUDIT-C negative \u2014 unhealthy alcohol use screen documented.
              </div>
            )}

            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1, marginTop:8, display:"flex", gap:16, flexWrap:"wrap" }}>
              <span style={{ color: auditcPos ? "#ff8a8a" : auditcDone ? "var(--npi-teal)" : auditcScreen ? "#f5c842" : "var(--npi-txt4)" }}>
                {auditcDone ? "\u2713 AUDIT-C documented" : auditcScreen ? "AUDIT-C partially documented" : "AUDIT-C screen not yet documented"}
              </span>
              {auditcDone && <span>Score: {auditcScore} / 12 (threshold \u2265{threshold}{!patientSex ? " — sex not set" : ""})</span>}
            </div>
          </div>
        );
      })()}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to HPI &#9654;
          </button>
        </div>
      )}
    </div>
  );
}