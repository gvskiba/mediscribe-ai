import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  MDM_COPA_LEVELS, MDM_DATA_CATS, MDM_RISK_LEVELS, EM_LEVEL_MAP,
  computeEMLevel, computeDataLevel, buildMDMNarrative,
} from "@/components/npi/npiData";

// ─── helpers ──────────────────────────────────────────────────────────────────
const RANK = { "":0, minimal:1, low:2, moderate:3, high:4 };

function LevelPicker({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {options.map(opt => {
        const active = value === opt.key;
        return (
          <button key={opt.key}
            onClick={() => onChange(active ? "" : opt.key)}
            style={{ flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: active ? 700 : 400,
              border:`1px solid ${active ? opt.color+"88" : "rgba(42,77,114,0.35)"}`,
              background: active ? opt.color+"1a" : "transparent",
              color: active ? opt.color : "var(--npi-txt4)",
              transition:"all .12s", textAlign:"center" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({ title, badge, badgeColor, children }) {
  return (
    <div style={{ padding:"14px 16px", borderRadius:11,
      background:"rgba(14,37,68,0.6)", border:"1px solid rgba(26,53,85,0.4)",
      borderTop:`2px solid ${badgeColor||"rgba(59,158,255,0.5)"}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
          textTransform:"uppercase", color: badgeColor||"#3b9eff" }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:.5,
            padding:"1px 6px", borderRadius:4,
            background:`${badgeColor||"#3b9eff"}18`,
            border:`1px solid ${badgeColor||"#3b9eff"}44`,
            color: badgeColor||"#3b9eff" }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MDMBuilderTab({
  demo, cc, vitals, medications, pmhSelected, consults,
  sdoh, disposition, esiLevel, isarState,
  mdmState, setMdmState,
  mdmDataElements, setMdmDataElements,
  onAdvance,
}) {
  const [copied,    setCopied]    = useState(false);
  const [quickMode, setQuickMode] = useState(true);

  const patientName = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "Patient";
  const patientCC   = cc?.text || "";

  // ── Derived values ─────────────────────────────────────────────────────────
  const autoDataLevel = computeDataLevel(
    mdmState.dataChecks?.cat1 || [],
    mdmState.dataChecks?.cat2 || mdmDataElements.length > 0,
    mdmState.dataChecks?.cat3 || false,
  );
  // Sync auto-computed dataLevel back into mdmState whenever inputs change
  useEffect(() => {
    if (autoDataLevel !== mdmState.dataLevel) {
      setMdmState(p => ({ ...p, dataLevel: autoDataLevel }));
    }
  }, [autoDataLevel]); // eslint-disable-line

  const emRank  = computeEMLevel(mdmState.copa, mdmState.dataLevel, mdmState.risk);
  const emLevel = EM_LEVEL_MAP[emRank];

  // ── SDOH / PHQ-2 / AUDIT-C detection ──────────────────────────────────────
  const sdohDomainPositive = Object.entries(sdoh||{})
    .filter(([k]) => !k.startsWith("phq2") && !k.startsWith("auditc") && k !== "tobacco")
    .some(([,v]) => v === "2");
  const phq2Score    = parseInt(sdoh?.phq2q1||"0") + parseInt(sdoh?.phq2q2||"0");
  const phq2Positive = Boolean(sdoh?.phq2q1 && sdoh?.phq2q2 && phq2Score >= 3);
  const auditcScore   = parseInt(sdoh?.auditcq1||"0") + parseInt(sdoh?.auditcq2||"0") + parseInt(sdoh?.auditcq3||"0");
  const auditcDone    = Boolean(sdoh?.auditcq1 !== "" && sdoh?.auditcq2 !== "" && sdoh?.auditcq3 !== "" && sdoh?.auditcq1 !== undefined);
  const sexLower      = (demo?.sex||"").toLowerCase();
  const auditcThresh  = sexLower === "female" || sexLower === "f" ? 3 : 4;
  const auditcPositive = auditcDone && auditcScore >= auditcThresh;
  const esiNum        = parseInt(esiLevel)||0;

  // ── ISAR-6 detection ───────────────────────────────────────────────────────
  const isarScore = isarState
    ? (isarState.q1===true?1:0)+(isarState.q2===true?1:0)+
      (isarState.q3===false?1:0)+(isarState.q4===true?1:0)+
      (isarState.q5===true?1:0)+(isarState.q6===true?1:0)
    : 0;
  const isarComplete  = isarState && Object.values(isarState).every(v => v !== null);
  const isarHighRisk  = isarComplete && isarScore >= 2;

  // ── Auto-populate from encounter data ──────────────────────────────────────
  const autoPopulate = useCallback(() => {
    const pmhCount     = Object.values(pmhSelected||{}).filter(Boolean).length;
    const consultsDone = (consults||[]).filter(c => c.status === "completed");

    // COPA
    let copa = "low", copaRationale = "";
    if (esiNum <= 2) {
      copa = "high";
      copaRationale = `ESI ${esiNum} — acute condition posing threat to life or bodily function.`;
    } else if (disposition === "admit") {
      copa = "high";
      copaRationale = "Decision for hospital admission — high-acuity condition requiring inpatient-level care.";
    } else if (pmhCount >= 2 || consultsDone.length > 0) {
      copa = "moderate";
      copaRationale = consultsDone.length > 0
        ? `Undiagnosed new problem with uncertain prognosis; specialist consultation obtained (${consultsDone.map(c=>c.service).join(", ")}).`
        : `${pmhCount} chronic conditions on problem list — evaluated for exacerbation or progression.`;
    } else if (pmhCount === 1) {
      copa = "low";
      copaRationale = "1 stable chronic condition managed in this encounter.";
    } else {
      copa = "low";
      copaRationale = patientCC ? `Acute uncomplicated illness/injury: ${patientCC}.` : "Acute uncomplicated illness/injury.";
    }

    // Data — Category 1 pre-checks
    const cat1 = [];
    if (vitals?.bp || vitals?.hr) cat1.push("orderLab");      // labs typically ordered with vital workup
    if (cc?.text)                  cat1.push("orderRad");      // imaging typically ordered for active CC
    if ((consults||[]).length > 0) cat1.push("extRecords");    // consult implies record review
    const cat3 = consultsDone.length > 0;

    // Risk
    let risk = "low", riskRationale = "";
    if (esiNum <= 2 || disposition === "admit") {
      risk = "high";
      riskRationale = disposition === "admit"
        ? "Decision for hospital admission — high-risk condition requiring inpatient-level care."
        : `ESI ${esiNum} — life-threatening condition requiring immediate intervention.`;
    } else if (sdohDomainPositive) {
      risk = "moderate";
      riskRationale = "Social determinants of health affecting management — positive SDOH screen documented (AMA CPT 2023 Table of Risk, Moderate complexity).";
    } else if (phq2Positive) {
      risk = "moderate";
      riskRationale = `Mental health treatment — positive PHQ-2 screen (score ${phq2Score}/6); behavioral health management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`;
    } else if (auditcPositive) {
      risk = "moderate";
      riskRationale = `Unhealthy alcohol use — positive AUDIT-C screen (score ${auditcScore}/12, threshold \u2265${auditcThresh}); substance use management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`;
    } else if (isarHighRisk) {
      risk = "moderate";
      riskRationale = `Geriatric fall risk — ISAR score ${isarScore}/6 (\u22652 = high risk); anticipated functional decline and complex disposition affecting management (AMA CPT 2023 Table of Risk, Moderate).`;
    } else if ((medications||[]).length > 0) {
      risk = "low";
      riskRationale = "Prescription drug management — new, adjusted, or continued medications.";
    } else {
      risk = "minimal";
      riskRationale = "Self-limited problem; over-the-counter medications or self-care instructions only.";
    }

    setMdmState(p => ({
      ...p, copa, copaRationale,
      dataChecks: { cat1, cat2:false, cat3 },
      risk, riskRationale, sdohRiskAccepted: sdohDomainPositive,
    }));
    toast.success("MDM pre-populated from encounter data — review and adjust as needed.");
  }, [pmhSelected, esiNum, esiLevel, disposition, consults, vitals, cc, medications, sdohDomainPositive, phq2Positive, phq2Score, auditcPositive, auditcScore, auditcThresh, isarHighRisk, isarScore, patientCC, setMdmState]);

  // ── Narrative ──────────────────────────────────────────────────────────────
  const handleBuildNarrative = () => {
    const text = buildMDMNarrative(
      { ...mdmState, dataLevel: autoDataLevel },
      mdmDataElements, patientName, patientCC
    );
    setMdmState(p => ({ ...p, narrative: text }));
  };

  const handleCopy = async () => {
    const text = mdmState.narrative || buildMDMNarrative(
      { ...mdmState, dataLevel: autoDataLevel }, mdmDataElements, patientName, patientCC
    );
    try { await navigator.clipboard.writeText(text); } catch(_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleCat1 = (key) => {
    setMdmState(p => {
      const current = p.dataChecks?.cat1 || [];
      const next = current.includes(key) ? current.filter(k => k!==key) : [...current, key];
      return { ...p, dataChecks: { ...p.dataChecks, cat1: next } };
    });
  };

  const rankColor = (rank) => {
    if (rank >= 4) return "#ff6b6b";
    if (rank >= 3) return "#f5c842";
    if (rank >= 2) return "#00e5c0";
    if (rank >= 1) return "#8892a4";
    return "rgba(42,77,114,0.5)";
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, paddingBottom:32 }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700,
            color:"var(--npi-txt)" }}>
            MDM Builder
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", marginTop:2 }}>
            AMA CPT 2023 — Medical Decision Making &middot; 2-of-3 column rule
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {emLevel && (
            <div style={{ padding:"6px 14px", borderRadius:8,
              background:`${emLevel.color}15`,
              border:`1px solid ${emLevel.color}44` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
                textTransform:"uppercase", color:emLevel.color, marginBottom:1 }}>
                E/M Level
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700,
                color:emLevel.color }}>
                {emLevel.ed}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:400,
                  opacity:.7, marginLeft:5 }}>(ED)</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:emLevel.color, opacity:.75, marginTop:1 }}>
                {emLevel.outpatient}/{emLevel.established} office &middot; {emLevel.label}
              </div>
            </div>
          )}
          <button onClick={autoPopulate}
            style={{ padding:"8px 16px", borderRadius:9, cursor:"pointer",
              border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.07)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              color:"#3b9eff", display:"flex", alignItems:"center", gap:6 }}>
            &#x26A1; Auto-populate
          </button>
          <button onClick={() => setQuickMode(q => !q)}
            style={{ padding:"8px 14px", borderRadius:9, cursor:"pointer",
              border:`1px solid ${quickMode ? "rgba(0,229,192,0.35)" : "rgba(42,77,114,0.4)"}`,
              background: quickMode ? "rgba(0,229,192,0.07)" : "transparent",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
              color: quickMode ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
            {quickMode ? "⚡ Quick" : "⊞ Full grid"}
          </button>
        </div>
      </div>

      {/* ── E/M level indicator bar ── */}
      <div style={{ display:"flex", gap:3, height:5, borderRadius:3, overflow:"hidden" }}>
        {[1,2,3,4].map(r => {
          const cols  = [RANK[mdmState.copa]||0, RANK[mdmState.dataLevel]||0, RANK[mdmState.risk]||0];
          const meetsTwo = cols.filter(v => v >= r).length >= 2;
          return (
            <div key={r} style={{ flex:1, borderRadius:2,
              background: meetsTwo ? rankColor(r) : "rgba(42,77,114,0.25)",
              transition:"background .2s" }} />
          );
        })}
      </div>
      {emLevel && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:emLevel.color,
          letterSpacing:1, textAlign:"center", marginTop:-8 }}>
          {emLevel.label} \u00b7 ED: {emLevel.ed} \u00b7 Office: {emLevel.outpatient} (new) / {emLevel.established} (est.)
        </div>
      )}

      {/* ── Critical care advisory ── */}
      {esiNum <= 2 && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
          borderLeft:"3px solid #ff6b6b" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
            <span style={{ fontSize:13 }}>&#x26A1;</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
              textTransform:"uppercase", color:"#ff8a8a" }}>
              ESI {esiNum} \u2014 Consider Critical Care Codes
            </span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ffb3b3", lineHeight:1.6 }}>
            If high-complexity MDM was provided to a critically ill patient with a life-threatening condition,
            consider <strong>99291</strong> (first 30\u201374 min) and <strong>99292</strong> (each additional 30 min)
            instead of or in addition to the ED E/M code. Critical care requires documented time and
            qualifies when the patient has a critical illness impairing one or more organ systems.
          </div>
        </div>
      )}

      {/* ── Quick MDM ─────────────────────────────────────────────────────── */}
      {quickMode && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ padding:"14px 16px", borderRadius:11,
            background:"rgba(14,37,68,0.6)", border:"1px solid rgba(26,53,85,0.4)",
            borderTop:"2px solid rgba(0,229,192,0.45)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
              textTransform:"uppercase", color:"var(--npi-teal)", marginBottom:12 }}>
              Select E/M Level — sets COPA + Risk together
            </div>

            {/* Level selector */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
              {MDM_COPA_LEVELS.map(opt => {
                const active = mdmState.copa === opt.key && mdmState.risk === opt.key;
                const riskOpt = MDM_RISK_LEVELS.find(l => l.key === opt.key);
                return (
                  <button key={opt.key}
                    onClick={() => {
                      setMdmState(p => ({
                        ...p,
                        copa: opt.key, risk: opt.key,
                        copaRationale: p.copaRationale || opt.desc,
                        riskRationale: p.riskRationale || riskOpt?.examples || "",
                      }));
                      if (opt.key === "high") setQuickMode(false);
                    }}
                    style={{ padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center",
                      border:`2px solid ${active ? opt.color : "rgba(42,77,114,0.35)"}`,
                      background: active ? opt.color+"1a" : "rgba(8,22,40,0.4)",
                      transition:"all .13s" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
                      color: active ? opt.color : "var(--npi-txt3)" }}>{opt.label}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color: active ? opt.color : "var(--npi-txt4)", marginTop:3, opacity:.85 }}>
                      {opt.emCodes}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected level description */}
            {mdmState.copa && mdmState.copa === mdmState.risk && (
              <div style={{ marginBottom:10, padding:"7px 10px", borderRadius:7,
                background:"rgba(8,22,40,0.5)", border:"1px solid rgba(26,53,85,0.4)" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--npi-txt4)", lineHeight:1.5 }}>
                  {MDM_COPA_LEVELS.find(l=>l.key===mdmState.copa)?.desc}
                </div>
              </div>
            )}

            {/* Clinical linkage chips — same as full grid */}
            {sdohDomainPositive && !mdmState.sdohRiskAccepted && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(245,200,66,0.07)", border:"1px solid rgba(245,200,66,0.28)",
                borderLeft:"3px solid #f5c842", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f5c842" }}>
                  <span style={{ fontWeight:700 }}>&#x26A0; SDOH positive</span> — Moderate Risk
                </div>
                <button onClick={() => setMdmState(p => ({ ...p, risk:"moderate",
                  riskRationale:"Social determinants of health affecting management (AMA CPT 2023 Table of Risk, Moderate).",
                  sdohRiskAccepted:true }))}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(245,200,66,0.4)", background:"rgba(245,200,66,0.1)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#f5c842" }}>
                  Accept \u2192 Moderate
                </button>
              </div>
            )}
            {phq2Positive && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(155,109,255,0.07)", border:"1px solid rgba(155,109,255,0.28)",
                borderLeft:"3px solid #9b6dff", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#c4a0ff" }}>
                  <span style={{ fontWeight:700 }}>&#x1F9E0; PHQ-2 positive ({phq2Score}/6)</span> — Moderate Risk
                </div>
                <button onClick={() => setMdmState(p => ({ ...p, risk:"moderate",
                  riskRationale:`Mental health treatment — positive PHQ-2 (score ${phq2Score}/6) affecting management (AMA CPT 2023 Table of Risk, Moderate).` }))}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(155,109,255,0.4)", background:"rgba(155,109,255,0.1)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#9b6dff" }}>
                  Accept \u2192 Moderate
                </button>
              </div>
            )}
            {auditcPositive && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(255,159,67,0.07)", border:"1px solid rgba(255,159,67,0.28)",
                borderLeft:"3px solid #ff9f43", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ffb870" }}>
                  <span style={{ fontWeight:700 }}>&#x1F37A; AUDIT-C positive ({auditcScore}/12)</span> — Moderate Risk
                </div>
                <button onClick={() => setMdmState(p => ({ ...p, risk:"moderate",
                  riskRationale:`Unhealthy alcohol use — positive AUDIT-C (score ${auditcScore}/12) affecting management (AMA CPT 2023 Table of Risk, Moderate).` }))}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(255,159,67,0.4)", background:"rgba(255,159,67,0.1)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#ff9f43" }}>
                  Accept \u2192 Moderate
                </button>
              </div>
            )}
            {isarHighRisk && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(126,203,255,0.07)", border:"1px solid rgba(126,203,255,0.25)",
                borderLeft:"3px solid #7ecbff", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#a8d8ff" }}>
                  <span style={{ fontWeight:700 }}>&#x1F9D3; ISAR \u22652 ({isarScore}/6)</span> — Moderate Risk
                </div>
                <button onClick={() => setMdmState(p => ({ ...p, risk:"moderate",
                  riskRationale:`Geriatric fall risk — ISAR score ${isarScore}/6; complex disposition (AMA CPT 2023 Table of Risk, Moderate).` }))}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(126,203,255,0.35)", background:"rgba(126,203,255,0.1)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#7ecbff" }}>
                  Accept \u2192 Moderate
                </button>
              </div>
            )}

            {/* Single rationale override */}
            {(mdmState.copa || mdmState.risk) && (
              <textarea
                value={mdmState.copaRationale}
                onChange={e => setMdmState(p => ({ ...p, copaRationale:e.target.value }))}
                placeholder="Optional rationale — describe specific clinical context..."
                rows={2}
                style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                  border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
                  padding:"7px 10px", color:"var(--npi-txt)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55,
                  outline:"none", resize:"none", boxSizing:"border-box" }} />
            )}

            {/* Summary row */}
            {emLevel && (
              <div style={{ marginTop:10, padding:"6px 10px", borderRadius:7,
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:`${emLevel.color}0d`, border:`1px solid ${emLevel.color}33` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:emLevel.color, fontWeight:700 }}>
                  {emLevel.ed} (ED) \u00b7 {emLevel.label}
                </span>
                <button onClick={() => setQuickMode(false)}
                  style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    background:"transparent", border:"none", color:"var(--npi-txt4)",
                    cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Need full documentation?
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Full grid (COPA / Data / Risk) ─────────────────────────────────── */}
      {!quickMode && (<>

      {/* ── Column 1: COPA ── */}
      <SectionCard title="1 — Number & Complexity of Problems Addressed (COPA)"
        badge={mdmState.copa ? MDM_COPA_LEVELS.find(l=>l.key===mdmState.copa)?.label : "Not set"}
        badgeColor={MDM_COPA_LEVELS.find(l=>l.key===mdmState.copa)?.color || "#3b9eff"}>
        <LevelPicker options={MDM_COPA_LEVELS} value={mdmState.copa}
          onChange={v => setMdmState(p => ({ ...p, copa:v }))} />
        {mdmState.copa && (
          <div style={{ marginTop:8, padding:"6px 10px", borderRadius:7,
            background:"rgba(8,22,40,0.5)", border:"1px solid rgba(26,53,85,0.4)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)",
              marginBottom:3 }}>
              {MDM_COPA_LEVELS.find(l=>l.key===mdmState.copa)?.desc}
            </div>
          </div>
        )}
        <textarea
          value={mdmState.copaRationale}
          onChange={e => setMdmState(p => ({ ...p, copaRationale:e.target.value }))}
          placeholder="Rationale — describe the specific problem(s) addressed this encounter..."
          rows={2}
          style={{ width:"100%", marginTop:9, background:"rgba(8,24,48,0.7)",
            border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
            padding:"7px 10px", color:"var(--npi-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55,
            outline:"none", resize:"vertical", boxSizing:"border-box" }} />
      </SectionCard>

      {/* ── Column 2: Data ── */}
      <SectionCard title="2 — Amount & Complexity of Data Reviewed and Analyzed"
        badge={autoDataLevel ? autoDataLevel.charAt(0).toUpperCase()+autoDataLevel.slice(1) : "None"}
        badgeColor={autoDataLevel==="high"?"#ff6b6b":autoDataLevel==="moderate"?"#f5c842":autoDataLevel==="limited"?"#00e5c0":"#8892a4"}>

        {/* Category 1 */}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
          textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:7 }}>
          Category 1 — Tests, Documents, Independent Historian (need ≥2 for Limited, ≥3 for Moderate)
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {MDM_DATA_CATS.cat1Items.map(item => {
            const checked = (mdmState.dataChecks?.cat1||[]).includes(item.key);
            return (
              <button key={item.key} onClick={() => toggleCat1(item.key)}
                style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"7px 10px", borderRadius:7, cursor:"pointer", textAlign:"left",
                  background: checked ? "rgba(0,229,192,0.07)" : "rgba(8,22,40,0.4)",
                  border:`1px solid ${checked ? "rgba(0,229,192,0.25)" : "rgba(26,53,85,0.35)"}`,
                  transition:"all .12s" }}>
                <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  background: checked ? "var(--npi-teal)" : "transparent",
                  border:`1.5px solid ${checked ? "var(--npi-teal)" : "rgba(42,77,114,0.5)"}` }}>
                  {checked && <span style={{ color:"#050f1e", fontSize:10, fontWeight:900, lineHeight:1 }}>&#x2713;</span>}
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color: checked ? "var(--npi-txt)" : "var(--npi-txt3)" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CDS data elements — Category 2 feed */}
        {mdmDataElements.length > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
              textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:7 }}>
              Category 2 — Clinical Decision Rules Applied (from CDS panel)
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {mdmDataElements.map(el => (
                <div key={el.id} style={{ display:"flex", alignItems:"flex-start", gap:9,
                  padding:"8px 11px", borderRadius:8,
                  background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.18)" }}>
                  <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:1,
                    background:"var(--npi-teal)", border:"1.5px solid var(--npi-teal)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:"#050f1e", fontSize:10, fontWeight:900, lineHeight:1 }}>&#x2713;</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      color:"var(--npi-teal)", marginBottom:2 }}>
                      {el.score}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:"var(--npi-txt4)", lineHeight:1.45,
                      overflow:"hidden", textOverflow:"ellipsis",
                      display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                      {el.phrase}
                    </div>
                  </div>
                  <button onClick={() => setMdmDataElements(prev => prev.filter(e => e.id !== el.id))}
                    style={{ background:"transparent", border:"none", color:"var(--npi-txt4)",
                      cursor:"pointer", fontSize:11, padding:"0 2px", lineHeight:1, flexShrink:0 }}>
                    &#x2715;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category 2 manual / Category 3 toggles */}
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          {[
            { key:"cat2", label:"Cat 2 — Independent interpretation", color:"#f5c842" },
            { key:"cat3", label:"Cat 3 — External specialist discussion", color:"#ff9f43" },
          ].map(({ key, label, color }) => {
            const active = mdmState.dataChecks?.[key] || false;
            return (
              <button key={key}
                onClick={() => setMdmState(p => ({ ...p, dataChecks:{ ...p.dataChecks, [key]:!active } }))}
                style={{ flex:1, padding:"7px 6px", borderRadius:7, cursor:"pointer",
                  border:`1px solid ${active ? color+"66" : "rgba(42,77,114,0.35)"}`,
                  background: active ? color+"12" : "transparent",
                  fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight: active ? 600 : 400,
                  color: active ? color : "var(--npi-txt4)", transition:"all .12s", textAlign:"center" }}>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--npi-txt4)", letterSpacing:.8 }}>
          {(mdmState.dataChecks?.cat1||[]).length} Cat 1 item{(mdmState.dataChecks?.cat1||[]).length!==1?"s":""} checked
          {mdmDataElements.length>0 ? ` \u00b7 ${mdmDataElements.length} CDS decision${mdmDataElements.length!==1?"s":""} (Cat 2)` : ""}
          {mdmState.dataChecks?.cat3 ? " \u00b7 Cat 3 checked" : ""}
          {autoDataLevel ? ` \u2192 ${autoDataLevel.charAt(0).toUpperCase()+autoDataLevel.slice(1)}` : ""}
        </div>
      </SectionCard>

      {/* ── Column 3: Risk ── */}
      <SectionCard title="3 — Risk of Complications and/or Morbidity or Mortality"
        badge={mdmState.risk ? MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.label : "Not set"}
        badgeColor={MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.color || "#3b9eff"}>

        {/* SDOH linkage chip */}
        {sdohDomainPositive && !mdmState.sdohRiskAccepted && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(245,200,66,0.07)", border:"1px solid rgba(245,200,66,0.3)",
            borderLeft:"3px solid #f5c842", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f5c842", lineHeight:1.45 }}>
              <span style={{ fontWeight:700 }}>&#x26A0; SDOH positive screen</span> — social determinants
              of health affecting management qualifies as Moderate Risk (AMA CPT 2023 Table of Risk).
            </div>
            <button onClick={() => setMdmState(p => ({
                ...p,
                risk:"moderate",
                riskRationale:"Social determinants of health affecting management — positive SDOH screen documented (AMA CPT 2023 Table of Risk, Moderate complexity).",
                sdohRiskAccepted:true,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(245,200,66,0.5)", background:"rgba(245,200,66,0.12)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#f5c842" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

        {/* PHQ-2 linkage chip */}
        {phq2Positive && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(155,109,255,0.07)", border:"1px solid rgba(155,109,255,0.3)",
            borderLeft:"3px solid #9b6dff", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#c4a0ff", lineHeight:1.45 }}>
              <span style={{ fontWeight:700 }}>&#x1F9E0; PHQ-2 positive (score {phq2Score}/6)</span> — mental
              health treatment affecting management qualifies as Moderate Risk.
            </div>
            <button onClick={() => setMdmState(p => ({
                ...p,
                risk:"moderate",
                riskRationale:`Mental health treatment — positive PHQ-2 screen (score ${phq2Score}/6); behavioral health management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(155,109,255,0.4)", background:"rgba(155,109,255,0.1)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9b6dff" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

        {/* AUDIT-C linkage chip */}
        {auditcPositive && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(255,159,67,0.07)", border:"1px solid rgba(255,159,67,0.3)",
            borderLeft:"3px solid #ff9f43", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ffb870", lineHeight:1.45 }}>
              <span style={{ fontWeight:700 }}>&#x1F37A; AUDIT-C positive (score {auditcScore}/12, threshold \u2265{auditcThresh})</span> — substance
              use management affecting care qualifies as Moderate Risk.
            </div>
            <button onClick={() => setMdmState(p => ({
                ...p,
                risk:"moderate",
                riskRationale:`Unhealthy alcohol use — positive AUDIT-C screen (score ${auditcScore}/12, threshold \u2265${auditcThresh}); substance use management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(255,159,67,0.4)", background:"rgba(255,159,67,0.1)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#ff9f43" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

        {/* ISAR-6 linkage chip */}
        {isarHighRisk && mdmState.risk !== "moderate" && mdmState.risk !== "high" && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(126,203,255,0.07)", border:"1px solid rgba(126,203,255,0.28)",
            borderLeft:"3px solid #7ecbff", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#a8d8ff", lineHeight:1.45 }}>
              <span style={{ fontWeight:700 }}>&#x1F9D3; ISAR-6 high risk (score {isarScore}/6)</span> — geriatric
              fall risk with anticipated functional decline and complex disposition qualifies as Moderate Risk
              (AMA CPT 2023 Table of Risk).
            </div>
            <button onClick={() => setMdmState(p => ({
                ...p,
                risk:"moderate",
                riskRationale:`Geriatric fall risk — ISAR score ${isarScore}/6 (\u22652 = high risk); anticipated functional decline and complex disposition affecting management (AMA CPT 2023 Table of Risk, Moderate).`,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(126,203,255,0.35)", background:"rgba(126,203,255,0.1)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#7ecbff" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

        <LevelPicker options={MDM_RISK_LEVELS} value={mdmState.risk}
          onChange={v => setMdmState(p => ({ ...p, risk:v }))} />
        {mdmState.risk && (
          <div style={{ marginTop:8, padding:"6px 10px", borderRadius:7,
            background:"rgba(8,22,40,0.5)", border:"1px solid rgba(26,53,85,0.4)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)" }}>
              {MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.examples}
            </div>
          </div>
        )}
        <textarea
          value={mdmState.riskRationale}
          onChange={e => setMdmState(p => ({ ...p, riskRationale:e.target.value }))}
          placeholder="Rationale — describe the specific risk element present in this encounter..."
          rows={2}
          style={{ width:"100%", marginTop:9, background:"rgba(8,24,48,0.7)",
            border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
            padding:"7px 10px", color:"var(--npi-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55,
            outline:"none", resize:"vertical", boxSizing:"border-box" }} />
      </SectionCard>

      </>)} {/* end !quickMode full grid */}

      {/* ── Narrative ── */}
      <SectionCard title="MDM Narrative" badge="AMA CPT 2023" badgeColor="#3b9eff">
        <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
          <button onClick={handleBuildNarrative}
            style={{ padding:"7px 16px", borderRadius:8, cursor:"pointer",
              background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700 }}>
            &#x1F4DD; Build Narrative
          </button>
          {mdmState.narrative && (
            <button onClick={handleCopy}
              style={{ padding:"7px 14px", borderRadius:8, cursor:"pointer",
                border:`1px solid ${copied ? "rgba(0,229,192,0.5)" : "rgba(42,77,114,0.45)"}`,
                background: copied ? "rgba(0,229,192,0.09)" : "transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                color: copied ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
              {copied ? "\u2713 Copied" : "\uD83D\uDCCB Copy"}
            </button>
          )}
          {mdmState.narrative && (
            <button onClick={() => setMdmState(p => ({ ...p, narrative:"" }))}
              style={{ padding:"7px 12px", borderRadius:8, cursor:"pointer",
                border:"1px solid rgba(42,77,114,0.35)", background:"transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt4)" }}>
              Clear
            </button>
          )}
        </div>

        {!mdmState.copa && !mdmState.risk && (
          <div style={{ padding:"16px", borderRadius:8, background:"rgba(8,22,40,0.4)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt4)",
            textAlign:"center", lineHeight:1.65 }}>
            Select COPA and Risk levels above, or click &#x26A1; Auto-populate to seed from encounter data.
            Then click Build Narrative to generate the MDM documentation block.
          </div>
        )}

        {(mdmState.copa || mdmState.risk) && (
          <div style={{ marginBottom:10, padding:"8px 11px", borderRadius:7,
            background:"rgba(8,22,40,0.4)", border:"1px solid rgba(26,53,85,0.35)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
              letterSpacing:.8, display:"flex", gap:16, flexWrap:"wrap" }}>
              <span>COPA: <span style={{ color:MDM_COPA_LEVELS.find(l=>l.key===mdmState.copa)?.color||"var(--npi-txt4)" }}>{mdmState.copa||"—"}</span></span>
              <span>Data: <span style={{ color:autoDataLevel==="high"?"#ff6b6b":autoDataLevel==="moderate"?"#f5c842":autoDataLevel==="limited"?"#00e5c0":"var(--npi-txt4)" }}>{autoDataLevel||"none"}</span></span>
              <span>Risk: <span style={{ color:MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.color||"var(--npi-txt4)" }}>{mdmState.risk||"—"}</span></span>
              {emLevel && <span style={{ color:emLevel.color }}>&#x2192; {emLevel.label} ({emLevel.outpatient}/{emLevel.established})</span>}
            </div>
          </div>
        )}

        <textarea
          value={mdmState.narrative}
          onChange={e => setMdmState(p => ({ ...p, narrative:e.target.value }))}
          placeholder="MDM narrative will appear here after clicking Build Narrative. You can also type or edit directly."
          rows={10}
          style={{ width:"100%", background:"rgba(8,24,48,0.75)",
            border:"1px solid rgba(26,53,85,0.6)", borderRadius:9,
            padding:"10px 12px", color:"var(--npi-txt)",
            fontFamily:"'JetBrains Mono',monospace", fontSize:11, lineHeight:1.65,
            outline:"none", resize:"vertical", boxSizing:"border-box" }} />
      </SectionCard>

      {/* ── Advance ── */}
      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9,
              background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", gap:6 }}>
            Continue to Timeline &#9654;
          </button>
        </div>
      )}
    </div>
  );
}