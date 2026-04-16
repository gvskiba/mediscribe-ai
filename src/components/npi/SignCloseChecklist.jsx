// SignCloseChecklist.jsx
// Pre-sign safety checklist for the NPI "closeout" section.
// Auto-evaluates encounter completeness and blocks signing until
// all critical (REQUIRED) items are resolved.
//
// Props:
//   demo, cc, vitals, medications, allergies
//   rosState, peState, esiLevel, disposition, dispReason
//   consults, mdmState, sepsisBundle, pdmpState
//   isarState, sdoh, reassessState, providerName
//   communicationEvents  — array from CommunicationLog (optional)
//   onSign()             — called when confirmed + all criticals pass
//   saving               — bool, disables sign button while in-flight
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useMemo, useState } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pass: { color:T.teal,   bg:"rgba(0,229,192,0.07)",   border:"rgba(0,229,192,0.28)",   icon:"\u2713" },
  warn: { color:T.gold,   bg:"rgba(245,200,66,0.07)",  border:"rgba(245,200,66,0.28)",  icon:"\u26a0" },
  fail: { color:T.coral,  bg:"rgba(255,107,107,0.07)", border:"rgba(255,107,107,0.28)", icon:"\u2717" },
};

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
      color:T.txt4, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:7 }}>
      {children}
    </div>
  );
}

// ── Single checklist row ──────────────────────────────────────────────────────
function CheckItem({ item }) {
  const s = STATUS_CFG[item.status] || STATUS_CFG.warn;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10,
      padding:"9px 12px", borderRadius:9, marginBottom:5,
      background:s.bg, border:`1px solid ${s.border}` }}>
      <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
        background:`${s.color}20`, border:`1px solid ${s.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
        color:s.color, marginTop:1 }}>
        {s.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:12.5, color:item.status === "fail" ? s.color : T.txt }}>
            {item.label}
          </span>
          {item.critical && item.status !== "pass" && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.coral, background:"rgba(255,107,107,0.12)",
              border:"1px solid rgba(255,107,107,0.3)",
              borderRadius:3, padding:"1px 5px", letterSpacing:"0.8px" }}>
              REQUIRED
            </span>
          )}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt4, marginTop:2, lineHeight:1.55 }}>
          {item.detail}
        </div>
      </div>
    </div>
  );
}

// ── Checklist item builder ────────────────────────────────────────────────────
function buildItems(props) {
  const {
    demo = {}, cc = {}, vitals = {}, medications = [], allergies = [],
    rosState = {}, peState = {}, esiLevel, disposition, dispReason,
    consults = [], mdmState = {}, sepsisBundle = {}, pdmpState = {},
    isarState = {}, sdoh = {}, reassessState = {},
    communicationEvents = [], providerName,
  } = props;

  const patientName  = [demo.firstName, demo.lastName].filter(Boolean).join(" ");
  const rosCount     = Object.keys(rosState).length;
  const peCount      = Object.keys(peState).length;
  const mdmComplete  = mdmState.copa && mdmState.risk;

  // PDMP — required if opioid/benzo detected in med list
  const opioidRx = /opioid|morphine|oxycodone|hydrocodone|fentanyl|benzo|diazepam|lorazepam|alprazolam|clonazepam|tramadol|codeine/i;
  const hasPdmpDrug = medications.some(m => opioidRx.test(m));

  // Sepsis bundle completeness
  const sepsisActive   = sepsisBundle.lactateOrdered || sepsisBundle.abxOrdered || sepsisBundle.fluidsStarted;
  const sepsisComplete = sepsisBundle.lactateOrdered && sepsisBundle.abxOrdered && sepsisBundle.fluidsStarted;

  // ISAR score
  const isarScore = [
    isarState.q1 === true, isarState.q2 === true, isarState.q3 === false,
    isarState.q4 === true, isarState.q5 === true, isarState.q6 === true,
  ].filter(Boolean).length;

  // SDOH risk flags
  const sdohRisk  = Object.entries(sdoh)
    .filter(([k]) => !k.startsWith("phq2") && !k.startsWith("auditc") && k !== "tobacco")
    .some(([, v]) => v === "2");
  const phq2Score = parseInt(sdoh.phq2q1 || "0") + parseInt(sdoh.phq2q2 || "0");

  // Patient education teach-back
  const hasEducation = communicationEvents.some(e => e.type === "patient_education");
  const hasTeachback = communicationEvents.some(e => e.type === "patient_education" && e.teachback);

  const items = [
    // ── PATIENT IDENTITY ─────────────────────────────────────────────────────
    {
      group:"Patient Identity", critical:true,
      label:"Patient name documented",
      detail: patientName
        ? `${patientName}${demo.age ? ", " + demo.age + "y" : ""}`
        : "Missing — enter demographics before signing",
      status: patientName ? "pass" : "fail",
    },
    {
      group:"Patient Identity", critical:false,
      label:"MRN / encounter identifier",
      detail: demo.mrn ? `MRN: ${demo.mrn}` : "Not entered — document MRN for chart matching",
      status: demo.mrn ? "pass" : "warn",
    },

    // ── CHIEF COMPLAINT & HPI ────────────────────────────────────────────────
    {
      group:"Chief Complaint & HPI", critical:true,
      label:"Chief complaint recorded",
      detail: cc.text ? `"${cc.text}"` : "No chief complaint entered",
      status: cc.text ? "pass" : "fail",
    },
    {
      group:"Chief Complaint & HPI", critical:false,
      label:"HPI narrative",
      detail: cc.hpi ? "HPI documented" : "HPI not entered — generate or type in HPI tab",
      status: cc.hpi ? "pass" : "warn",
    },

    // ── VITAL SIGNS ──────────────────────────────────────────────────────────
    {
      group:"Vital Signs", critical:true,
      label:"Vital signs recorded",
      detail: vitals.bp || vitals.hr
        ? `BP ${vitals.bp || "\u2014"}  HR ${vitals.hr || "\u2014"}  SpO2 ${vitals.spo2 || "\u2014"}  T ${vitals.temp || "\u2014"}`
        : "No vitals documented",
      status: vitals.bp || vitals.hr ? "pass" : "fail",
    },
    {
      group:"Vital Signs", critical:false,
      label:"ESI triage level",
      detail: esiLevel ? `ESI ${esiLevel} assigned` : "Triage level not set",
      status: esiLevel ? "pass" : "warn",
    },
    {
      group:"Vital Signs", critical:false,
      label:"Reassessment documented",
      detail: reassessState.condition
        ? `Condition at reassess: ${reassessState.condition}`
        : reassessState.note
        ? "Reassessment note present"
        : "No reassessment recorded — required for ESI 1\u20133",
      status: reassessState.condition || reassessState.note ? "pass" : "warn",
    },

    // ── ALLERGIES & MEDICATIONS ──────────────────────────────────────────────
    {
      group:"Allergies & Medications", critical:true,
      label:"Allergy status documented",
      detail: allergies.length
        ? `Allergies: ${allergies.slice(0, 4).join(", ")}${allergies.length > 4 ? "\u2026" : ""}`
        : "No allergies documented \u2014 confirm NKDA or list known allergies",
      status: allergies.length ? "pass" : "warn",
    },
    {
      group:"Allergies & Medications", critical:false,
      label:"Medication reconciliation",
      detail: medications.length
        ? `${medications.length} medication(s) listed`
        : "No medications entered \u2014 confirm no home meds or reconcile",
      status: medications.length ? "pass" : "warn",
    },
    ...(hasPdmpDrug ? [{
      group:"Allergies & Medications", critical:true,
      label:"PDMP check \u2014 controlled substance",
      detail: pdmpState.checked
        ? `Checked at ${pdmpState.timestamp || "time not recorded"}${pdmpState.method ? " via " + pdmpState.method : ""}`
        : "Opioid/controlled substance in med list \u2014 PDMP check required before signing",
      status: pdmpState.checked ? "pass" : "fail",
    }] : []),

    // ── CLINICAL DOCUMENTATION ───────────────────────────────────────────────
    {
      group:"Clinical Documentation", critical:false,
      label:"Review of Systems",
      detail: rosCount >= 4
        ? `${rosCount} systems reviewed`
        : rosCount > 0
        ? `${rosCount} system(s) \u2014 \u22654 recommended for moderate/high MDM`
        : "ROS not documented",
      status: rosCount >= 4 ? "pass" : "warn",
    },
    {
      group:"Clinical Documentation", critical:false,
      label:"Physical Examination",
      detail: peCount >= 3
        ? `${peCount} systems examined`
        : peCount > 0
        ? `${peCount} system(s) \u2014 \u22653 recommended`
        : "Physical exam not documented",
      status: peCount >= 3 ? "pass" : "warn",
    },

    // ── MEDICAL DECISION MAKING ──────────────────────────────────────────────
    {
      group:"Medical Decision Making", critical:false,
      label:"MDM complexity assigned",
      detail: mdmComplete
        ? `COPA: ${mdmState.copa}  |  Risk: ${mdmState.risk}`
        : "MDM not completed \u2014 required for AMA CPT 2023 E/M coding",
      status: mdmComplete ? "pass" : "warn",
    },
    {
      group:"Medical Decision Making", critical:false,
      label:"MDM narrative",
      detail: mdmState.narrative ? "Narrative generated" : "No MDM narrative \u2014 use MDM Builder tab",
      status: mdmState.narrative ? "pass" : "warn",
    },

    // ── CONSULTS ─────────────────────────────────────────────────────────────
    ...(consults.length > 0 ? [{
      group:"Consults", critical:false,
      label:"Consult status",
      detail: consults.map(c => `${c.service} \u2014 ${c.status || "pending"}`).join("; "),
      status: consults.every(c => c.status === "completed") ? "pass" : "warn",
    }] : []),

    // ── COMMUNICATION & PATIENT EDUCATION ────────────────────────────────────
    ...(hasEducation ? [{
      group:"Patient Education", critical:false,
      label:"Teach-back completed",
      detail: hasTeachback
        ? "Teach-back documented with patient verbalization"
        : "Patient education logged but no teach-back recorded (JCAHO EP.5)",
      status: hasTeachback ? "pass" : "warn",
    }] : []),

    // ── DISPOSITION ──────────────────────────────────────────────────────────
    {
      group:"Disposition", critical:true,
      label:"Disposition documented",
      detail: disposition
        ? `${disposition.toUpperCase()}${dispReason ? " \u2014 " + dispReason.slice(0, 80) : ""}`
        : "Disposition not set \u2014 required before signing",
      status: disposition ? "pass" : "fail",
    },

    // ── SEPSIS BUNDLE (if active) ─────────────────────────────────────────────
    ...(sepsisActive ? [{
      group:"Sepsis Bundle (CMS SEP-1)", critical:true,
      label:"Hour-1 bundle documentation",
      detail: sepsisComplete
        ? "Lactate, antibiotics, and fluids all documented"
        : `Incomplete \u2014 ${!sepsisBundle.lactateOrdered ? "lactate " : ""}${!sepsisBundle.abxOrdered ? "ABX " : ""}${!sepsisBundle.fluidsStarted ? "fluids " : ""}not documented`,
      status: sepsisComplete ? "pass" : "fail",
    }] : []),

    // ── SDOH / SOCIAL RISK ────────────────────────────────────────────────────
    ...(sdohRisk || phq2Score >= 3 ? [{
      group:"Social Risk", critical:false,
      label:"Social risk flagged \u2014 ensure plan addresses it",
      detail: [
        sdohRisk && "Social determinant concern identified",
        phq2Score >= 3 && `PHQ-2 positive (${phq2Score}/6)`,
      ].filter(Boolean).join(" \u00b7 "),
      status: "warn",
    }] : []),

    // ── GERIATRIC SAFETY ─────────────────────────────────────────────────────
    ...(isarScore >= 2 ? [{
      group:"Geriatric Safety", critical:false,
      label:`ISAR \u2265 2 \u2014 high-risk elder (score ${isarScore}/6)`,
      detail: "Ensure follow-up, care coordination, and caregiver education documented",
      status: "warn",
    }] : []),

    // ── SIGNING PROVIDER ─────────────────────────────────────────────────────
    {
      group:"Provider", critical:false,
      label:"Signing provider identified",
      detail: providerName && providerName !== "Provider"
        ? `Signing as: ${providerName}`
        : "Provider name not set \u2014 update profile",
      status: providerName && providerName !== "Provider" ? "pass" : "warn",
    },
  ];

  return items;
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SignCloseChecklist(props) {
  const { onSign, saving } = props;
  const [confirmed, setConfirmed] = useState(false);

  const items = useMemo(() => buildItems(props), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    props.demo?.firstName, props.demo?.lastName, props.demo?.mrn, props.demo?.age,
    props.cc?.text, props.cc?.hpi,
    props.vitals?.bp, props.vitals?.hr,
    props.esiLevel, props.disposition, props.dispReason,
    props.allergies?.length, props.medications?.length,
    props.pdmpState?.checked,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(props.rosState || {}).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(props.peState  || {}).length,
    props.mdmState?.copa, props.mdmState?.risk, props.mdmState?.narrative,
    props.consults?.length,
    props.reassessState?.condition, props.reassessState?.note,
    props.sepsisBundle?.abxOrdered, props.sepsisBundle?.lactateOrdered, props.sepsisBundle?.fluidsStarted,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(props.sdoh || {}).join(","),
    props.communicationEvents?.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (props.communicationEvents || []).filter(e => e.teachback).length,
    props.providerName,
  ]);

  const groups = useMemo(() => {
    const map = {};
    items.forEach(item => {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    });
    return map;
  }, [items]);

  const failCount = items.filter(i => i.status === "fail").length;
  const warnCount = items.filter(i => i.status === "warn").length;
  const passCount = items.filter(i => i.status === "pass").length;
  const critFails = items.filter(i => i.critical && i.status === "fail").length;
  const canSign   = critFails === 0;

  const summaryColor = critFails > 0 ? T.coral : warnCount > 0 ? T.gold : T.teal;
  const summaryLabel = critFails > 0
    ? `${critFails} required item${critFails > 1 ? "s" : ""} must be resolved before signing`
    : warnCount > 0
    ? `${warnCount} advisory item${warnCount > 1 ? "s" : ""} \u2014 review before signing`
    : "All required items complete \u2014 ready to sign";

  return (
    <div style={{ display:"flex", flexDirection:"column", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding:"16px 22px 14px", borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:T.txt, marginBottom:3 }}>
          Pre-Sign Checklist
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
          Verify encounter completeness before signing and saving the chart
        </div>
      </div>

      <div style={{ padding:"16px 22px 60px", display:"flex", flexDirection:"column", gap:0 }}>

        {/* ── Summary bar ── */}
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap",
          padding:"12px 16px", borderRadius:10, marginBottom:20,
          background:`${summaryColor}0a`, border:`1px solid ${summaryColor}44`,
          borderLeft:`4px solid ${summaryColor}` }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
            fontWeight:600, color:summaryColor, flex:1 }}>
            {summaryLabel}
          </div>
          <div style={{ display:"flex", gap:14, flexShrink:0 }}>
            {[
              { v:passCount,  label:"Pass",     c:T.teal  },
              { v:warnCount,  label:"Advisory", c:T.gold  },
              { v:failCount,  label:"Required", c:T.coral },
            ].map(b => (
              <div key={b.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif",
                  fontSize:22, fontWeight:900, color:b.c, lineHeight:1 }}>
                  {b.v}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4, textTransform:"uppercase",
                  letterSpacing:"0.8px", marginTop:2 }}>
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Grouped items ── */}
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group} style={{ marginBottom:18 }}>
            <SectionLabel>{group}</SectionLabel>
            {groupItems.map((item, i) => <CheckItem key={i} item={item} />)}
          </div>
        ))}

        {/* ── Confirm & Sign ── */}
        <div style={{ marginTop:8, padding:"16px", borderRadius:12,
          background:T.panel, border:`1px solid ${T.bd}`,
          borderTop:`2px solid ${canSign ? T.teal : T.coral}` }}>

          {/* Attestation checkbox */}
          <div onClick={() => canSign && setConfirmed(c => !c)}
            style={{ display:"flex", alignItems:"flex-start", gap:10,
              cursor: canSign ? "pointer" : "not-allowed", userSelect:"none",
              marginBottom:14 }}>
            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1,
              border:`2px solid ${confirmed ? T.teal : "rgba(42,79,122,0.5)"}`,
              background: confirmed ? T.teal : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .15s" }}>
              {confirmed && <span style={{ color:"#050f1e", fontWeight:900, fontSize:11 }}>\u2713</span>}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
              color: canSign ? T.txt2 : T.txt4, lineHeight:1.65 }}>
              I attest that I have reviewed this encounter, the information above is accurate to the best
              of my knowledge, and this chart is ready for signature.
            </div>
          </div>

          {/* Sign button */}
          <button
            onClick={() => confirmed && canSign && !saving && onSign?.()}
            disabled={!confirmed || !canSign || saving}
            style={{ width:"100%", padding:"13px", borderRadius:10,
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14,
              cursor: confirmed && canSign && !saving ? "pointer" : "not-allowed",
              border:"none", transition:"all .2s",
              background: confirmed && canSign
                ? "linear-gradient(135deg,#00e5c0,#00b4a0)"
                : "rgba(26,53,85,0.4)",
              color: confirmed && canSign ? "#050f1e" : T.txt4 }}>
            {saving ? "Signing\u2026"
              : critFails > 0 ? `Resolve ${critFails} Required Item${critFails > 1 ? "s" : ""} to Sign`
              : !confirmed ? "Check attestation box above to sign"
              : "\u270D Sign & Save Chart"}
          </button>

          {critFails > 0 && (
            <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"rgba(255,107,107,0.65)", textAlign:"center" }}>
              Complete all items marked REQUIRED before signing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}