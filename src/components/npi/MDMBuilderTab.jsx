import { useState, useEffect, useCallback } from "react";
import {
  MDM_COPA_LEVELS, MDM_DATA_CATS, MDM_RISK_LEVELS, EM_LEVEL_MAP,
  computeEMLevel, computeDataLevel, buildMDMNarrative,
} from "@/components/npi/npiData";

// MOI_KW at module scope — defined once per load, not recreated on every render
const MOI_KW = [
  "fall","fell","mva","motor vehicle","mvc","accident","assault","assaulted",
  "bike","bicycle","sports","trauma","traumatic","collision","crash",
  "pedestrian","rollover","struck","hit by","fight","ejected","stabbed",
  "gunshot","gsw","blunt","penetrating",
];

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

// ── UPGRADE ROADMAP ────────────────────────────────────────────────────────────
// v1 (complete): Cat1 unique CPT stepper · "considered but not ordered" · Cat2/Cat3 labels · time note
// v2 (complete): Critical care time documentation template — 99291/99292 narrative with minutes input
// v3 (complete): Differential diagnosis field — protects against discharge-diagnosis downcoding
// v4 (complete): Multiple low-severity problems aggregation prompt (AMA CPT 2023)
// MOI (complete): Mechanism-of-injury chip — High COPA for fall/MVA/trauma/assault (ACEP FAQ 2023)
// ──────────────────────────────────────────────────────────────────────────────
// v5 (complete): Split/Shared attestation toggle — "I personally made/approved the management plan
//                and take responsibility for the patient management." (CMS 2024 Final Rule)
//                Surfaces as a checkbox in the Narrative section when an APP is involved.
//                Appends required -FS modifier attestation language when checked.
//                Prevents silent 85% reimbursement on split/shared encounters.
// ──────────────────────────────────────────────────────────────────────────────
// v6 (complete): Comorbidity-to-encounter linkage — when copa = "moderate" from multiple
//                conditions, a textarea: "How did each comorbidity affect this encounter?"
//                Generates specific narrative language connecting the PMH to MDM complexity.
//                Addresses ACEP FAQ: "Simply listing the comorbidity does not satisfy CPT;
//                documentation must reflect how comorbidities impacted the MDM."
// ──────────────────────────────────────────────────────────────────────────────

function CountStepper({ label, sublabel, value, onChange, color }) {
  const c = color || "var(--npi-teal)";
  const active = value > 0;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"7px 10px", borderRadius:7,
      background: active ? "rgba(0,229,192,0.07)" : "rgba(8,22,40,0.4)",
      border:`1px solid ${active ? "rgba(0,229,192,0.25)" : "rgba(26,53,85,0.35)"}`,
      transition:"all .12s" }}>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color: active ? "var(--npi-txt)" : "var(--npi-txt3)" }}>{label}</div>
        {sublabel && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"var(--npi-txt4)", marginTop:1 }}>{sublabel}</div>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))}
          style={{ width:22, height:22, borderRadius:5, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:14, fontWeight:700, lineHeight:1,
            background: active ? "rgba(0,229,192,0.14)" : "rgba(26,53,85,0.35)",
            border:`1px solid ${active ? "rgba(0,229,192,0.3)" : "rgba(26,53,85,0.35)"}`,
            color: active ? c : "var(--npi-txt4)", cursor:"pointer" }}>
          \u2212
        </button>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700,
          color: active ? c : "var(--npi-txt4)", minWidth:18, textAlign:"center" }}>
          {value}
        </span>
        <button onClick={() => onChange(Math.min(15, value + 1))}
          style={{ width:22, height:22, borderRadius:5, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:14, fontWeight:700, lineHeight:1,
            background:"rgba(0,229,192,0.14)", border:"1px solid rgba(0,229,192,0.3)",
            color:c, cursor:"pointer" }}>
          +
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MDMBuilderTab({
  demo, cc, vitals, medications, pmhSelected, consults,
  sdoh, disposition, esiLevel, isarState,
  mdmState, setMdmState,
  mdmDataElements, setMdmDataElements,
  onToast,
  onAdvance,
}) {
  const [copied,    setCopied]    = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  // v2: critical care time documentation
  const [ccOpen,      setCcOpen]      = useState(false);
  const [ccMinutes,   setCcMinutes]   = useState(45);
  const [ccCondition, setCcCondition] = useState("");
  // v5: split/shared attestation
  const [splitShared, setSplitShared] = useState(false);
  const [ssAppRole,   setSsAppRole]   = useState("");

  const patientName = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "Patient";
  const patientCC   = cc?.text || "";

  // ── Derived values ─────────────────────────────────────────────────────────
  // effectiveCat1: expands lab/rad/considered steppers into individual CPT-code-level entries.
  // Per AMA CPT 2023 / ACEP FAQ: CBC + BMP + troponin = 3 separate Cat1 elements (unique CPT codes),
  // not 1. "Tests considered but not ordered" count identically to ordered tests.
  const effectiveCat1 = [
    ...(mdmState.dataChecks?.cat1 || []).filter(k => k !== "orderLab" && k !== "orderRad"),
    ...Array(Math.max(0, mdmState.dataChecks?.labCount || 0)).fill("orderLab"),
    ...Array(Math.max(0, mdmState.dataChecks?.radCount || 0)).fill("orderRad"),
    ...Array(Math.max(0, mdmState.dataChecks?.consideredCount || 0)).fill("orderLab"),
  ];
  const autoDataLevel = computeDataLevel(
    effectiveCat1,
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

  // ── v4: Multi-problem aggregation detection ────────────────────────────────
  // AMA CPT 2023: "Multiple problems of a lower severity may, in the aggregate,
  // create higher risk due to interaction." Surfaces when copa is low/minimal
  // but the encounter data shows 3+ PMH conditions or 2+ PMH with 3+ medications.
  const pmhCount  = Object.values(pmhSelected||{}).filter(Boolean).length;
  const medCount  = (medications||[]).length;
  const copaIsLow = mdmState.copa === "low" || mdmState.copa === "minimal" || !mdmState.copa;
  const aggSignal = pmhCount >= 3 || (pmhCount >= 2 && medCount >= 3);
  const showAggPrompt = copaIsLow && aggSignal && !mdmState.aggAccepted;
  const acceptAggregation = () =>
    setMdmState(p => ({
      ...p, copa:"moderate", aggAccepted:true,
      copaRationale:`${pmhCount} active conditions addressed at this encounter — multiple lower-severity problems may, in the aggregate, create higher complexity (AMA CPT 2023 E/M Guidelines). Upgraded to Moderate COPA.`,
    }));

  // ── MOI: Mechanism-of-injury chip ─────────────────────────────────────────
  // ACEP FAQ 2023: "ED presentations prompted by a fall, MVA, fight, bicycle accident,
  // or any other accident require evaluation of multiple organ systems or body areas
  // to identify or rule out injuries." This supports High COPA even when the discharge
  // diagnosis is benign (e.g. discharged with 'contusion' after MVA workup).
  const ccLower = (patientCC || "").toLowerCase();
  const hasMOI = MOI_KW.some(k => ccLower.includes(k));
  const showMOIPrompt = hasMOI && copaIsLow && !mdmState.moiAccepted;
  const acceptMOI = () =>
    setMdmState(p => ({
      ...p, copa:"high", moiAccepted:true,
      copaRationale:`High-complexity mechanism of injury: ${patientCC}. This ED presentation required evaluation of multiple organ systems to identify or rule out injuries — indicative of potentially extensive injury with multiple treatment options and risk of morbidity. Per ACEP FAQ / AMA CPT 2023, mechanism of injury supports High COPA regardless of final discharge diagnosis.`,
    }));
  const autoPopulate = useCallback(() => {
    const pmhCount     = Object.values(pmhSelected||{}).filter(Boolean).length;
    const consultsDone = (consults||[]).filter(c => c.status === "completed");
    const ccText       = cc?.text || "";
    // MOI detection (mirrors component-level hasMOI)
    const hasMOILocal  = MOI_KW.some(k => ccText.toLowerCase().includes(k));

    // COPA
    let copa = "low", copaRationale = "";
    if (esiNum <= 2) {
      copa = "high";
      copaRationale = `ESI ${esiNum} — acute condition posing threat to life or bodily function.`;
    } else if (disposition === "admit") {
      copa = "high";
      copaRationale = "Decision for hospital admission — high-acuity condition requiring inpatient-level care.";
    } else if (hasMOILocal) {
      copa = "high";
      copaRationale = `Mechanism of injury: ${ccText}. ED trauma presentation requiring evaluation of multiple organ systems to identify or rule out injuries — High COPA per ACEP/AMA CPT 2023.`;
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

    // Data — Category 1: use stepper counts rather than single checkbox keys.
    // Default to 2 labs (e.g. CBC + BMP) + 1 imaging — physician adjusts to actual orders.
    const cat1 = [];
    const labCount = (vitals?.bp || vitals?.hr) ? 2 : 0;
    const radCount = cc?.text ? 1 : 0;
    if ((consults||[]).length > 0) cat1.push("extRecords");
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
      dataChecks: { cat1, cat2:false, cat3, labCount, radCount, consideredCount:0, consideredNote:"" },
      risk, riskRationale, sdohRiskAccepted: sdohDomainPositive,
      // v3: seed presenting concern from chief complaint; preserve any existing differential entries
      diffDx: {
        presentingConcern: patientCC || p.diffDx?.presentingConcern || "",
        highRiskConsidered: p.diffDx?.highRiskConsidered || "",
        workingDx: p.diffDx?.workingDx || "",
      },
    }));
    onToast?.("MDM pre-populated from encounter data — review and adjust as needed.", "success");
  }, [pmhSelected, esiNum, esiLevel, disposition, consults, vitals, cc, medications, sdohDomainPositive, phq2Positive, phq2Score, auditcPositive, auditcScore, auditcThresh, isarHighRisk, isarScore, patientCC, setMdmState]);

  // ── Narrative ──────────────────────────────────────────────────────────────
  const handleBuildNarrative = () => {
    let text = buildMDMNarrative(
      { ...mdmState, dataLevel: autoDataLevel },
      mdmDataElements, patientName, patientCC
    );
    // v3: prepend differential diagnosis block — protective language against
    // payer downcoding based on discharge diagnosis (AMA CPT 2023)
    const diff = mdmState.diffDx || {};
    const hasDiff = diff.presentingConcern || diff.highRiskConsidered || diff.workingDx;
    if (hasDiff) {
      text = buildDiffNarrative(diff) + "\n\n" + text;
    }
    // v6: append comorbidity-to-encounter linkage paragraph
    // ACEP FAQ: "Simply listing comorbidities doesn't satisfy CPT — document
    // how they impacted the MDM for this encounter."
    const cLink = (mdmState.comorbidityLinkage || "").trim();
    if (cLink) {
      text += `\n\n${buildComorbidityNarrative(cLink)}`;
    }
    // v1: append "considered but not ordered" per AMA CPT 2023 / ACEP FAQ:
    // "Ordering a test may include those considered but not selected."
    const cc2 = mdmState.dataChecks?.consideredCount || 0;
    // "Ordering a test may include those considered but not selected."
    const cc2 = mdmState.dataChecks?.consideredCount || 0;
    const cnote = (mdmState.dataChecks?.consideredNote || "").trim();
    if (cc2 > 0 && cnote) {
      text += `\n\nTests/Studies Considered but Not Selected (${cc2}): ${cnote}`;
    }
    // v5: append split/shared attestation (CMS 2024 Final Rule)
    if (splitShared) {
      text += "\n\n" + "─".repeat(60) + "\n\n" + buildSplitSharedAttestation(ssAppRole);
    }
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

  // ── v6: Comorbidity-to-encounter linkage helper ───────────────────────────
  // ACEP FAQ 2023: documentation must reflect how each comorbidity impacted the
  // MDM for this encounter — listing them alone does not satisfy CPT definition.
  const buildComorbidityNarrative = (text) =>
    `Comorbidity impact on management complexity: ${text.trim()}`;

  // ── v5: Split/Shared attestation helper ──────────────────────────────────────
  // CMS 2024 Final Rule: the physician who performs the substantive portion of MDM
  // must document their approval of the management plan to bill under physician NPI.
  // Without this attestation, the encounter defaults to APP's NPI at 85% fee schedule.
  // Required language per ACEP Split/Shared FAQ and CMS-1784-F (CY 2024 Final Rule).
  const buildSplitSharedAttestation = (appRole) => {
    const roleStr = appRole.trim() || "advanced practice provider";
    return [
      "SPLIT/SHARED VISIT ATTESTATION — Modifier -FS Required",
      "",
      "I personally made and approved the management plan for this patient and take responsibility for the patient management, including its inherent risk of complications and/or morbidity or mortality of patient management. I performed the substantive portion of the medical decision making for this encounter.",
      "",
      `This encounter was shared with a ${roleStr}. The combined clinical documentation from both providers supports the E/M level and code assigned.`,
      "",
      "Billing: Append modifier -FS to the E/M code. Bill under the attending physician NPI when the physician performed the substantive portion of MDM. Per CMS 2024 Final Rule (CMS-1784-F), the substantive portion is the practitioner who made or approved the management plan and accepts responsibility for its inherent risks of patient management.",
    ].join("\n");
  };

  // ── v3: Differential diagnosis helpers ────────────────────────────────────
  // AMA CPT 2023: "The final diagnosis for a condition does not, in and of itself,
  // determine the complexity or risk." Documenting the differential insulates the
  // E/M level against payer downcoding on benign discharge diagnoses.
  const setDiffDx = (field, val) =>
    setMdmState(p => ({ ...p, diffDx: { ...(p.diffDx || {}), [field]: val } }));

  const buildDiffNarrative = (d) => {
    const parts = [];
    if (d.presentingConcern) parts.push(`Presenting concern: ${d.presentingConcern}.`);
    if (d.highRiskConsidered) parts.push(`High-risk conditions considered and evaluated in the differential: ${d.highRiskConsidered}.`);
    if (d.workingDx) parts.push(`Working/discharge diagnosis: ${d.workingDx}.`);
    parts.push("Per AMA CPT 2023 E/M guidelines, the level of medical decision-making reflects the complexity of problems addressed at this encounter. The final diagnosis does not in itself determine the complexity or risk — presenting symptoms that are likely to represent a highly morbid condition support the documented level of medical decision-making regardless of the ultimate diagnosis.");
    return parts.join(" ");
  };

  // ── v2: Critical care time helpers ────────────────────────────────────────
  const computeCCCodes = (min) => {
    if (min < 30) return [];
    const codes = ["99291"];
    if (min >= 75) {
      const addl = Math.floor((min - 75) / 30) + 1;
      for (let i = 0; i < addl; i++) codes.push("99292");
    }
    return codes;
  };

  const buildCCNarrative = (min, condition, codes) => {
    const codeStr = codes.join(" + ");
    const condStr = condition.trim() ? ` due to ${condition.trim()}` : "";
    const addlLine = codes.length > 1
      ? `(99291: first 30\u201374 min; 99292 \u00d7${codes.length - 1}: each additional 30 min beyond the initial 74 min)`
      : "(99291: first 30\u201374 min)";
    return [
      `CRITICAL CARE TIME DOCUMENTATION — ${codeStr}`,
      "",
      `Upon clinical evaluation, this patient demonstrated a high probability of imminent or life-threatening deterioration${condStr}, necessitating my direct personal management and intervention. The patient's condition acutely impaired one or more vital organ systems with risk of sudden, clinically significant deterioration.`,
      "",
      "Critical care services provided included: direct patient assessment and reassessment, interpretation of diagnostic studies and physiologic monitoring data, direction of therapeutic interventions, and coordination of care with consultants and clinical staff.",
      "",
      `I personally provided ${min} minutes of critical care time on this date of service, exclusive of time spent on separately reportable procedures. This time was not necessarily continuous but reflects total physician time engaged in critical care management of this patient.`,
      "",
      `Billing: ${codeStr}  ${addlLine}`,
    ].join("\n");
  };

  const injectCCNarrative = () => {
    const codes = computeCCCodes(ccMinutes);
    if (!codes.length) {
      onToast?.("Critical care requires \u226530 minutes of documented time to bill 99291.", "error");
      return;
    }
    const text = buildCCNarrative(ccMinutes, ccCondition, codes);
    setMdmState(p => ({
      ...p,
      narrative: p.narrative?.trim()
        ? `${p.narrative}\n\n${"─".repeat(60)}\n\n${text}`
        : text,
    }));
    onToast?.("Critical care time documentation injected into MDM narrative.", "success");
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
            AMA CPT 2023 — Medical Decision Making &middot; 2-of-3 column rule &middot;
            <span style={{ color:"rgba(255,159,67,0.75)" }}> ED E/M uses MDM only — time-based coding does not apply</span>
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
            {quickMode ? "\u26A1 Quick" : "\u229E Full grid"}
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

      {/* ── v2: Critical care advisory + documentation template ── */}
      {esiNum <= 2 && (
        <div style={{ borderRadius:9, background:"rgba(255,107,107,0.07)",
          border:"1px solid rgba(255,107,107,0.28)", borderLeft:"3px solid #ff6b6b",
          overflow:"hidden" }}>

          {/* Header row */}
          <div style={{ padding:"10px 14px", display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13 }}>&#x26A1;</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
                textTransform:"uppercase", color:"#ff8a8a" }}>
                ESI {esiNum} \u2014 Consider Critical Care Codes
              </span>
            </div>
            <button
              onClick={() => {
                if (!ccOpen && !ccCondition) setCcCondition(patientCC);
                setCcOpen(o => !o);
              }}
              style={{ padding:"5px 13px", borderRadius:6, cursor:"pointer",
                border:"1px solid rgba(255,107,107,0.35)",
                background: ccOpen ? "rgba(255,107,107,0.16)" : "rgba(255,107,107,0.07)",
                color:"#ff8a8a", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600 }}>
              {ccOpen ? "\u25b2 Collapse" : "\uD83D\uDCCB Document Critical Care Time"}
            </button>
          </div>

          {/* Advisory text */}
          <div style={{ padding:"0 14px 10px", fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:"#ffb3b3", lineHeight:1.6 }}>
            If high-complexity MDM was provided to a critically ill patient with a life-threatening
            condition, consider <strong>99291</strong> (first 30\u201374 min) and{" "}
            <strong>99292</strong> (each additional 30 min) in lieu of the ED E/M code.
            Critical care requires \u226530 minutes of documented time and qualifies when the
            patient has a critical illness impairing one or more vital organ systems.
          </div>

          {/* ── Expandable documentation form ── */}
          {ccOpen && (
            <div style={{ borderTop:"1px solid rgba(255,107,107,0.18)",
              background:"rgba(5,12,28,0.6)", padding:"14px" }}>

              {/* ── Minutes ── */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                  textTransform:"uppercase", color:"#ff8a8a", marginBottom:7 }}>
                  Critical Care Time (minutes) &mdash; minimum 30 min to bill 99291
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <input
                    type="number" min={0} max={480}
                    value={ccMinutes}
                    onChange={e => setCcMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width:70, height:38, background:"rgba(14,37,68,0.9)",
                      border:"1px solid rgba(255,107,107,0.35)", borderRadius:7,
                      padding:"0 10px", color:"#fff",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700,
                      textAlign:"center", outline:"none" }} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"rgba(255,107,107,0.6)" }}>min</span>
                </div>
                {/* Quick-pick */}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[30, 45, 60, 75, 90, 105, 120].map(m => (
                    <button key={m} onClick={() => setCcMinutes(m)}
                      style={{ padding:"5px 11px", borderRadius:5, cursor:"pointer",
                        fontSize:11, fontWeight: ccMinutes === m ? 700 : 400,
                        fontFamily:"'DM Sans',sans-serif",
                        border:`1px solid ${ccMinutes === m ? "rgba(255,107,107,0.55)" : "rgba(42,77,114,0.4)"}`,
                        background: ccMinutes === m ? "rgba(255,107,107,0.16)" : "rgba(8,22,40,0.5)",
                        color: ccMinutes === m ? "#ff8a8a" : "var(--npi-txt4)" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Codes display ── */}
              {ccMinutes > 0 && ccMinutes < 30 && (
                <div style={{ marginBottom:12, padding:"7px 11px", borderRadius:7,
                  background:"rgba(245,200,66,0.07)", border:"1px solid rgba(245,200,66,0.28)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#f5c842" }}>
                  &#x26A0; Minimum 30 minutes of documented time required to bill 99291.
                </div>
              )}
              {ccMinutes >= 30 && (() => {
                const codes = computeCCCodes(ccMinutes);
                return (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                      textTransform:"uppercase", color:"#ff8a8a", marginBottom:7 }}>
                      Computed Codes &mdash; {ccMinutes} min
                    </div>
                    <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                      {codes.map((code, i) => (
                        <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace",
                          fontSize:13, fontWeight:700, padding:"4px 12px", borderRadius:6,
                          background:"rgba(255,107,107,0.16)", border:"1px solid rgba(255,107,107,0.38)",
                          color:"#ff8a8a" }}>
                          {code}
                        </span>
                      ))}
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                        color:"rgba(255,107,107,0.55)", lineHeight:1.4 }}>
                        {codes.length > 1
                          ? `99291: first 30\u201374 min \u00b7 99292 \u00d7${codes.length - 1}: each add\u2019l 30 min`
                          : "99291: first 30\u201374 min"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ── Qualifying condition ── */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                  textTransform:"uppercase", color:"#ff8a8a", marginBottom:6 }}>
                  Critical Condition / Qualifying Illness
                </div>
                <input
                  value={ccCondition}
                  onChange={e => setCcCondition(e.target.value)}
                  placeholder="e.g. septic shock with multi-organ dysfunction, acute respiratory failure requiring intubation, STEMI with cardiogenic shock..."
                  style={{ width:"100%", height:38, background:"rgba(14,37,68,0.9)",
                    border:"1px solid rgba(255,107,107,0.25)", borderRadius:7,
                    padding:"0 11px", color:"var(--npi-txt)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                    boxSizing:"border-box" }} />
              </div>

              {/* ── Narrative preview ── */}
              {ccMinutes >= 30 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                    textTransform:"uppercase", color:"#ff8a8a", marginBottom:6 }}>
                    Documentation Preview &mdash; edit after injection
                  </div>
                  <textarea
                    readOnly
                    value={buildCCNarrative(ccMinutes, ccCondition, computeCCCodes(ccMinutes))}
                    rows={8}
                    style={{ width:"100%", background:"rgba(3,8,20,0.7)",
                      border:"1px solid rgba(42,77,114,0.4)", borderRadius:8,
                      padding:"10px 12px", color:"rgba(255,179,179,0.75)",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:10, lineHeight:1.7,
                      outline:"none", resize:"none", boxSizing:"border-box", cursor:"text" }} />
                </div>
              )}

              {/* ── Action row ── */}
              <div style={{ display:"flex", gap:8, alignItems:"stretch" }}>
                <button
                  onClick={injectCCNarrative}
                  disabled={ccMinutes < 30}
                  style={{ flex:1, padding:"10px 16px", borderRadius:9,
                    cursor: ccMinutes >= 30 ? "pointer" : "not-allowed",
                    background: ccMinutes >= 30
                      ? "linear-gradient(135deg,#ff6b6b,#cc3333)"
                      : "rgba(42,77,114,0.25)",
                    border:"none",
                    color: ccMinutes >= 30 ? "#fff" : "var(--npi-txt4)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700 }}>
                  &#x2193; Inject into MDM Narrative
                </button>
                <div style={{ padding:"10px 12px", borderRadius:9,
                  background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,77,114,0.3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)",
                  display:"flex", alignItems:"center", whiteSpace:"nowrap" }}>
                  Appends to existing narrative
                </div>
              </div>

              {/* Billing note */}
              <div style={{ marginTop:10, fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"rgba(255,107,107,0.45)", lineHeight:1.6 }}>
                Critical care codes (99291/99292) are typically billed <em>in lieu of</em> the ED
                E/M code (99281\u201385). Consult your billing team for payer-specific rules on
                same-day E/M + critical care billing and split/shared service scenarios.
              </div>
            </div>
          )}
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
                      setMdmState(p => {
                        // Ensure at least labCount=1 + radCount=1 so effectiveCat1.length >= 2 = Limited data.
                        // Preserve any higher counts already set (auto-populate or manual entry).
                        const otherCat1 = (p.dataChecks?.cat1 || []).filter(k => k !== "orderLab" && k !== "orderRad");
                        const curLab   = p.dataChecks?.labCount || 0;
                        const curRad   = p.dataChecks?.radCount || 0;
                        const curCons  = p.dataChecks?.consideredCount || 0;
                        const effectiveLen = otherCat1.length + curLab + curRad + curCons;
                        return {
                          ...p,
                          copa: opt.key, risk: opt.key,
                          copaRationale: p.copaRationale || opt.desc,
                          riskRationale: p.riskRationale || riskOpt?.examples || "",
                          dataChecks: {
                            ...p.dataChecks,
                            labCount: effectiveLen >= 2 ? curLab : Math.max(curLab, 1),
                            radCount: effectiveLen >= 2 ? curRad : Math.max(curRad, 1),
                          },
                        };
                      });
                      // FIX 1: removed auto-exit on "high" — user stays in Quick mode
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

            {/* Clinical linkage chips */}
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

            {/* v4: Multi-problem aggregation prompt */}
            {showAggPrompt && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(0,229,192,0.06)", border:"1px solid rgba(0,229,192,0.28)",
                borderLeft:"3px solid #00e5c0", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#80f0e0", lineHeight:1.45 }}>
                  <span style={{ fontWeight:700 }}>&#x2295; {pmhCount} active conditions</span>
                  {medCount >= 3 && <span style={{ fontWeight:400, opacity:.8 }}> &middot; {medCount} medications</span>}
                  {" "}&mdash; multiple lower-severity problems may, in the aggregate, create higher complexity
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    marginLeft:5, opacity:.65 }}>AMA CPT 2023</span>
                </div>
                <button onClick={acceptAggregation}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(0,229,192,0.4)", background:"rgba(0,229,192,0.12)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700,
                    color:"var(--npi-teal)" }}>
                  Accept \u2192 Moderate COPA
                </button>
              </div>
            )}

            {/* MOI: Mechanism-of-injury prompt */}
            {showMOIPrompt && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:8, padding:"7px 11px", borderRadius:8,
                background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
                borderLeft:"3px solid #ff6b6b", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.45 }}>
                  <span style={{ fontWeight:700 }}>&#x26A1; Mechanism of injury detected</span>
                  {" "}&mdash; fall, MVA, trauma, and assault presentations require multi-system evaluation
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    marginLeft:5, opacity:.65 }}>ACEP FAQ 2023</span>
                </div>
                <button onClick={acceptMOI}
                  style={{ padding:"4px 10px", borderRadius:5, cursor:"pointer",
                    border:"1px solid rgba(255,107,107,0.4)", background:"rgba(255,107,107,0.12)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:"#ff6b6b" }}>
                  Accept \u2192 High COPA
                </button>
              </div>
            )}
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

            {/* v6: comorbidity linkage — quick mode compact version */}
            {(mdmState.copa === "moderate" || mdmState.copa === "high") && pmhCount > 0 && (
              <div style={{ marginTop:2 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.1, textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:5, marginTop:8 }}>
                  Comorbidity Impact on Management
                  <span style={{ color:"rgba(61,255,160,0.5)", marginLeft:6, fontSize:7.5, textTransform:"none", letterSpacing:0, fontStyle:"italic" }}>ACEP FAQ: document how comorbidities affected this encounter</span>
                </div>
                <textarea
                  value={mdmState.comorbidityLinkage || ""}
                  onChange={e => setMdmState(p => ({ ...p, comorbidityLinkage:e.target.value }))}
                  placeholder="e.g. CKD required pre-hydration before contrast CT; diabetes complicated antibiotic selection; CAD elevated ACS pre-test probability expanding workup..."
                  rows={2}
                  style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                    border:`1px solid ${(mdmState.comorbidityLinkage||"").trim() ? "rgba(61,255,160,0.3)" : "rgba(26,53,85,0.55)"}`,
                    borderRadius:8, padding:"7px 10px", color:"var(--npi-txt)",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55,
                    outline:"none", resize:"none", boxSizing:"border-box" }} />
                {(mdmState.comorbidityLinkage||"").trim() && (
                  <div style={{ marginTop:4, fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"#3dffa0", letterSpacing:.7, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:"#3dffa0",
                      display:"inline-block", flexShrink:0 }} />
                    Will be included in MDM narrative on Build Narrative
                  </div>
                )}
              </div>
            )}
            {(mdmState.copa || mdmState.risk) && (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={handleBuildNarrative}
                  style={{ flex:1, padding:"9px 16px", borderRadius:9, cursor:"pointer",
                    background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
                    border:"none", color:"#050f1e",
                    fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700 }}>
                  &#x1F4DD; Build Narrative
                </button>
                {mdmState.narrative && (
                  <button onClick={handleCopy}
                    style={{ padding:"9px 14px", borderRadius:9, cursor:"pointer",
                      border:`1px solid ${copied ? "rgba(0,229,192,0.5)" : "rgba(42,77,114,0.45)"}`,
                      background: copied ? "rgba(0,229,192,0.09)" : "transparent",
                      fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                      color: copied ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
                    {copied ? "\u2713 Copied" : "\uD83D\uDCCB Copy"}
                  </button>
                )}
              </div>
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
        {/* v4: aggregation chip — surfaces for low/minimal copa with 3+ conditions or 2+ conditions + 3+ meds */}
        {showAggPrompt && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginTop:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(0,229,192,0.06)", border:"1px solid rgba(0,229,192,0.28)",
            borderLeft:"3px solid #00e5c0", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#80f0e0", lineHeight:1.5 }}>
              <span style={{ fontWeight:700 }}>&#x2295; {pmhCount} active conditions</span>
              {medCount >= 3 && <span style={{ opacity:.8 }}> &middot; {medCount} medications</span>}
              {" "}&mdash; multiple lower-severity problems may, in the aggregate, create higher complexity.
              <br />
              <span style={{ fontSize:10, color:"rgba(0,229,192,0.6)", fontStyle:"italic" }}>
                AMA CPT 2023: &ldquo;Multiple problems of a lower severity may, in the aggregate, create higher risk due to interaction.&rdquo;
              </span>
            </div>
            <button onClick={acceptAggregation}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(0,229,192,0.4)", background:"rgba(0,229,192,0.12)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
                color:"var(--npi-teal)" }}>
              Accept \u2192 Moderate COPA
            </button>
          </div>
        )}
        {/* MOI: mechanism-of-injury chip */}
        {showMOIPrompt && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginTop:10, padding:"8px 12px", borderRadius:8,
            background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
            borderLeft:"3px solid #ff6b6b", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.5 }}>
              <span style={{ fontWeight:700 }}>&#x26A1; Mechanism of injury: &ldquo;{patientCC}&rdquo;</span>
              <br />
              <span style={{ fontSize:10, color:"rgba(255,107,107,0.65)", fontStyle:"italic" }}>
                ACEP FAQ 2023: &ldquo;ED presentations prompted by a fall, MVA, fight, or accident require evaluation of multiple organ systems — High COPA regardless of final diagnosis.&rdquo;
              </span>
            </div>
            <button onClick={acceptMOI}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(255,107,107,0.4)", background:"rgba(255,107,107,0.12)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#ff6b6b" }}>
              Accept \u2192 High COPA
            </button>
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

        {/* v6: comorbidity-to-encounter linkage — full grid version */}
        {(mdmState.copa === "moderate" || mdmState.copa === "high") && pmhCount > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                textTransform:"uppercase", color:"#3dffa0" }}>
                Comorbidity Impact on Management
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"rgba(61,255,160,0.55)", fontStyle:"italic" }}>
                ACEP FAQ: &ldquo;Simply listing comorbidities does not satisfy CPT — document how they impacted the MDM for this encounter.&rdquo;
              </div>
            </div>
            <textarea
              value={mdmState.comorbidityLinkage || ""}
              onChange={e => setMdmState(p => ({ ...p, comorbidityLinkage:e.target.value }))}
              placeholder="How did each condition affect complexity? e.g. CKD → pre-hydration before CT; diabetes → complicated antibiotic selection; CAD → elevated ACS pre-test probability, expanding workup..."
              rows={4}
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:`1px solid ${(mdmState.comorbidityLinkage||"").trim() ? "rgba(61,255,160,0.3)" : "rgba(26,53,85,0.55)"}`,
                borderRadius:8, padding:"8px 11px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.6,
                outline:"none", resize:"vertical", boxSizing:"border-box",
                transition:"border-color .15s" }} />
            {(mdmState.comorbidityLinkage||"").trim() && (
              <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"#3dffa0", letterSpacing:.7, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#3dffa0",
                  display:"inline-block", flexShrink:0 }} />
                Will be included in MDM narrative on Build Narrative
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Column 2: Data ── */}
      <SectionCard title="2 — Amount & Complexity of Data Reviewed and Analyzed"
        badge={autoDataLevel ? autoDataLevel.charAt(0).toUpperCase()+autoDataLevel.slice(1) : "None"}
        badgeColor={autoDataLevel==="high"?"#ff6b6b":autoDataLevel==="moderate"?"#f5c842":autoDataLevel==="limited"?"#00e5c0":"#8892a4"}>

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
          textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:7 }}>
          Category 1 — Each unique CPT code = 1 element (≥2 for Limited · ≥3 for Moderate)
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {MDM_DATA_CATS.cat1Items.map(item => {
            // orderLab and orderRad use steppers — each unique CPT code = 1 Cat1 element
            // per AMA CPT 2023 / ACEP FAQ: "ordering CBC + BMP + troponin = 3 Cat1 elements"
            if (item.key === "orderLab") {
              return (
                <CountStepper key={item.key}
                  label="Labs / tests ordered"
                  sublabel="each unique CPT code (CBC, BMP, troponin…) = 1 element"
                  value={mdmState.dataChecks?.labCount || 0}
                  onChange={v => setMdmState(p => ({ ...p, dataChecks:{ ...p.dataChecks, labCount:v } }))} />
              );
            }
            if (item.key === "orderRad") {
              return (
                <CountStepper key={item.key}
                  label="Imaging ordered"
                  sublabel="each unique CPT code (CXR, CT, US…) = 1 element"
                  value={mdmState.dataChecks?.radCount || 0}
                  onChange={v => setMdmState(p => ({ ...p, dataChecks:{ ...p.dataChecks, radCount:v } }))} />
              );
            }
            // All other Cat1 items remain as checkboxes
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

          {/* ── "Considered but not ordered" — counts identically to ordered tests per AMA CPT 2023 ── */}
          {/* v1 upgrade: ACEP FAQ "Ordering a test may include those considered but not selected" */}
          <CountStepper
            label="Tests considered but not ordered"
            sublabel="PECARN, PERC, Wells, NEXUS etc. — same Cat1 credit as ordered; document reasoning below"
            value={mdmState.dataChecks?.consideredCount || 0}
            onChange={v => setMdmState(p => ({ ...p, dataChecks:{ ...p.dataChecks, consideredCount:v } }))}
            color="#9b6dff" />
          {(mdmState.dataChecks?.consideredCount || 0) > 0 && (
            <textarea
              value={mdmState.dataChecks?.consideredNote || ""}
              onChange={e => setMdmState(p => ({ ...p, dataChecks:{ ...p.dataChecks, consideredNote:e.target.value } }))}
              placeholder="Document clinical reasoning — e.g. 'CT head deferred per PECARN criteria (low risk pediatric head injury); CT-PA deferred, PERC negative with pre-test probability ≤2%'"
              rows={2}
              style={{ width:"100%", background:"rgba(155,109,255,0.05)",
                border:"1px solid rgba(155,109,255,0.25)", borderRadius:7,
                padding:"7px 10px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, lineHeight:1.55,
                outline:"none", resize:"none", boxSizing:"border-box" }} />
          )}
        </div>

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

        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          {[
            { key:"cat2", label:"Cat 2 — Independent interpretation (ECG, X-ray, CT, POCUS, cardiac monitor)", color:"#f5c842" },
            { key:"cat3", label:"Cat 3 — External discussion (specialist, case mgmt, social work, EMS, transfer)", color:"#ff9f43" },
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

        {/* Status line — reflects actual unique CPT code count */}
        {(() => {
          const labCt  = mdmState.dataChecks?.labCount || 0;
          const radCt  = mdmState.dataChecks?.radCount || 0;
          const consCt = mdmState.dataChecks?.consideredCount || 0;
          const otherCt = (mdmState.dataChecks?.cat1||[]).filter(k => k !== "orderLab" && k !== "orderRad").length;
          const total  = labCt + radCt + consCt + otherCt;
          const parts  = [
            labCt > 0  && `${labCt} lab${labCt !== 1 ? "s" : ""}`,
            radCt > 0  && `${radCt} imaging`,
            consCt > 0 && `${consCt} considered`,
            otherCt > 0 && `${otherCt} other`,
          ].filter(Boolean).join(" + ");
          return (
            <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--npi-txt4)", letterSpacing:.8 }}>
              {total > 0 ? `${parts} = ${total} Cat1 item${total !== 1 ? "s" : ""}` : "0 Cat1 items"}
              {mdmDataElements.length > 0 ? ` \u00b7 ${mdmDataElements.length} CDS (Cat 2)` : ""}
              {mdmState.dataChecks?.cat3 ? " \u00b7 Cat 3 \u2713" : ""}
              {autoDataLevel ? ` \u2192 ${autoDataLevel.charAt(0).toUpperCase()+autoDataLevel.slice(1)}` : ""}
            </div>
          );
        })()}
      </SectionCard>

      {/* ── Column 3: Risk ── */}
      <SectionCard title="3 — Risk of Complications and/or Morbidity or Mortality"
        badge={mdmState.risk ? MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.label : "Not set"}
        badgeColor={MDM_RISK_LEVELS.find(l=>l.key===mdmState.risk)?.color || "#3b9eff"}>

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
                ...p, risk:"moderate",
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
                ...p, risk:"moderate",
                riskRationale:`Mental health treatment — positive PHQ-2 screen (score ${phq2Score}/6); behavioral health management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(155,109,255,0.4)", background:"rgba(155,109,255,0.1)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#9b6dff" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

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
                ...p, risk:"moderate",
                riskRationale:`Unhealthy alcohol use — positive AUDIT-C screen (score ${auditcScore}/12, threshold \u2265${auditcThresh}); substance use management affecting medical decision making (AMA CPT 2023 Table of Risk, Moderate).`,
              }))}
              style={{ padding:"5px 12px", borderRadius:6, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(255,159,67,0.4)", background:"rgba(255,159,67,0.1)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#ff9f43" }}>
              Accept \u2192 Moderate Risk
            </button>
          </div>
        )}

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
                ...p, risk:"moderate",
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

      {/* ── v3: Differential & Presenting Concern ── */}
      {/* Protects documented E/M level against payer downcoding on benign discharge diagnoses */}
      <SectionCard title="Differential &amp; Presenting Concern" badge="Audit Protection" badgeColor="#3dffa0">

        {/* AMA CPT 2023 quote */}
        <div style={{ marginBottom:12, padding:"8px 11px", borderRadius:7,
          background:"rgba(61,255,160,0.05)", border:"1px solid rgba(61,255,160,0.18)" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:"rgba(61,255,160,0.75)", lineHeight:1.6 }}>
            <strong style={{ color:"#3dffa0" }}>AMA CPT 2023:</strong>{" "}
            &ldquo;The final diagnosis for a condition does not, in and of itself, determine the
            complexity or risk.&rdquo; Documenting your differential protects the E/M level
            against payer downcoding when the discharge diagnosis is benign.
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Presenting concern */}
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
              textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:5 }}>
              Presenting Concern / Symptom Complex
            </div>
            <input
              value={mdmState.diffDx?.presentingConcern || ""}
              onChange={e => setDiffDx("presentingConcern", e.target.value)}
              placeholder="e.g. chest pain with diaphoresis, sudden severe headache, acute abdominal pain..."
              style={{ width:"100%", height:36, background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
                padding:"0 11px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box" }} />
          </div>

          {/* High-risk conditions considered */}
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
              textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:5 }}>
              High-Risk Conditions Considered / Ruled Out
            </div>
            <textarea
              value={mdmState.diffDx?.highRiskConsidered || ""}
              onChange={e => setDiffDx("highRiskConsidered", e.target.value)}
              placeholder={
                "Chest pain: ACS, PE, aortic dissection\n" +
                "Headache: SAH, meningitis, hypertensive emergency, mass lesion\n" +
                "Abd pain: ruptured AAA, mesenteric ischemia, ectopic pregnancy\n" +
                "AMS: stroke, ICH, meningitis, septic encephalopathy"
              }
              rows={3}
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
                padding:"8px 11px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.55,
                outline:"none", resize:"none", boxSizing:"border-box" }} />
          </div>

          {/* Working / discharge diagnosis */}
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
              textTransform:"uppercase", color:"var(--npi-txt4)", marginBottom:5 }}>
              Working / Discharge Diagnosis
            </div>
            <input
              value={mdmState.diffDx?.workingDx || ""}
              onChange={e => setDiffDx("workingDx", e.target.value)}
              placeholder="e.g. GERD, tension headache, viral gastroenteritis, musculoskeletal chest pain..."
              style={{ width:"100%", height:36, background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.55)", borderRadius:8,
                padding:"0 11px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box" }} />
          </div>

        </div>

        {/* Active state indicator */}
        {(mdmState.diffDx?.presentingConcern || mdmState.diffDx?.highRiskConsidered || mdmState.diffDx?.workingDx) && (
          <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"#3dffa0", letterSpacing:.8, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#3dffa0",
              display:"inline-block", flexShrink:0, animation:"glow-dot 2s infinite" }} />
            Differential documented \u2014 will be prepended to narrative on Build Narrative
          </div>
        )}

      </SectionCard>

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

        {/* v5: Split/Shared attestation toggle — CMS 2024 Final Rule */}
        <div style={{ marginBottom:10, padding:"10px 12px", borderRadius:8,
          background: splitShared ? "rgba(59,158,255,0.07)" : "rgba(8,22,40,0.4)",
          border:`1px solid ${splitShared ? "rgba(59,158,255,0.35)" : "rgba(26,53,85,0.35)"}`,
          borderLeft:`3px solid ${splitShared ? "#3b9eff" : "rgba(26,53,85,0.4)"}`,
          transition:"all .15s" }}>

          {/* Toggle row */}
          <button onClick={() => setSplitShared(p => !p)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:9,
              background:"transparent", border:"none", cursor:"pointer",
              padding:0, textAlign:"left" }}>
            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background: splitShared ? "#3b9eff" : "transparent",
              border:`1.5px solid ${splitShared ? "#3b9eff" : "rgba(42,77,114,0.55)"}`,
              transition:"all .13s" }}>
              {splitShared && <span style={{ color:"#050f1e", fontSize:10, fontWeight:900, lineHeight:1 }}>&#x2713;</span>}
            </div>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight: splitShared ? 600 : 400,
                color: splitShared ? "#3b9eff" : "var(--npi-txt3)" }}>
                Split/shared encounter &mdash; APP involved
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"1px 7px", borderRadius:3,
                background: splitShared ? "rgba(59,158,255,0.14)" : "rgba(26,53,85,0.35)",
                color: splitShared ? "#3b9eff" : "var(--npi-txt4)",
                border:`1px solid ${splitShared ? "rgba(59,158,255,0.35)" : "rgba(26,53,85,0.4)"}` }}>
                -FS modifier required &middot; CMS 2024
              </span>
            </div>
          </button>

          {/* Expanded panel */}
          {splitShared && (
            <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
              <input
                value={ssAppRole}
                onChange={e => setSsAppRole(e.target.value)}
                placeholder="APP role — e.g. PA, NP, APRN (optional)"
                style={{ width:"100%", height:34, background:"rgba(8,24,48,0.8)",
                  border:"1px solid rgba(59,158,255,0.3)", borderRadius:7,
                  padding:"0 11px", color:"var(--npi-txt)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none",
                  boxSizing:"border-box" }} />
              <div style={{ padding:"9px 11px", borderRadius:7,
                background:"rgba(59,158,255,0.05)", border:"1px solid rgba(59,158,255,0.18)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.2,
                  textTransform:"uppercase", color:"#3b9eff", marginBottom:6 }}>
                  CMS 2024 Final Rule \u2014 Attestation Preview
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
                  color:"var(--npi-txt3)", lineHeight:1.7, fontStyle:"italic" }}>
                  &ldquo;I personally made and approved the management plan for this patient and take
                  responsibility for the patient management, including its inherent risk of
                  complications and/or morbidity or mortality of patient management. I performed
                  the substantive portion of the medical decision making for this encounter.&rdquo;
                  {ssAppRole.trim() && (
                    <span> This encounter was shared with a{" "}
                      <strong style={{ fontStyle:"normal", color:"var(--npi-txt)" }}>{ssAppRole.trim()}</strong>.
                    </span>
                  )}
                </div>
                <div style={{ marginTop:7, fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"rgba(59,158,255,0.65)" }}>
                  &#x2139; Full attestation block + -FS modifier reminder appended to narrative on
                  Build Narrative. Bill under attending physician NPI.
                </div>
              </div>
            </div>
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
              {emLevel && <span style={{ color:emLevel.color }}>\u2192 {emLevel.label} ({emLevel.outpatient}/{emLevel.established})</span>}
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