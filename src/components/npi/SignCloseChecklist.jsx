// SignCloseChecklist.jsx
// Pre-sign safety checklist for the "closeout" tab in NPI.
// Reads encounter state and computes pass/warn/fail for each item.
// Calls props.onSign() when the provider confirms all critical items.
//
// Props:
//   demo, cc, vitals, medications, allergies, rosState, peState,
//   esiLevel, disposition, dispReason, consults, mdmState,
//   sepsisBundle, pdmpState, isarState, sdoh, reassessState,
//   nursingInterventions, attachments, providerName
//   onSign()   — called when checklist is confirmed and chart is signed
//   saving     — bool, disables sign button while saving

import { useMemo, useState } from "react";

const T = {
  bg:"#050f1e", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.7)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", green:"#3dffa0",
};

const STATUS = {
  pass:  { color:T.teal,   bg:"rgba(0,229,192,0.08)",  border:"rgba(0,229,192,0.3)",  icon:"✓" },
  warn:  { color:T.gold,   bg:"rgba(245,200,66,0.08)", border:"rgba(245,200,66,0.3)", icon:"⚠" },
  fail:  { color:T.coral,  bg:"rgba(255,107,107,0.08)",border:"rgba(255,107,107,0.3)",icon:"✗" },
  info:  { color:T.blue,   bg:"rgba(59,158,255,0.06)", border:"rgba(59,158,255,0.25)",icon:"ℹ" },
};

function buildItems(props) {
  const {
    demo, cc, vitals, medications, allergies,
    rosState, peState, esiLevel, disposition, dispReason,
    consults, mdmState, sepsisBundle, pdmpState,
    isarState, sdoh, reassessState,
    nursingInterventions, attachments, providerName,
  } = props;

  const patientName = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ");
  const rosCount = Object.keys(rosState || {}).length;
  const peCount  = Object.keys(peState  || {}).length;

  // PDMP required for any opioid/benzo in meds
  const opioidTerms = /opioid|morphine|oxycodone|hydrocodone|fentanyl|benzo|diazepam|lorazepam|alprazolam|clonazepam|tramadol|codeine/i;
  const hasPdmpDrug = (medications || []).some(m => opioidTerms.test(m));

  // Sepsis: any item stamped?
  const sepsisActive = (sepsisBundle?.lactateOrdered || sepsisBundle?.abxOrdered || sepsisBundle?.fluidsStarted);
  const sepsisComplete = sepsisBundle?.abxOrdered && sepsisBundle?.fluidsStarted && sepsisBundle?.lactateOrdered;

  // ISAR: score ≥ 2 = high risk
  const isarScore = isarState
    ? [isarState.q1===true,isarState.q2===true,isarState.q3===false,
       isarState.q4===true, isarState.q5===true, isarState.q6===true].filter(Boolean).length
    : 0;

  // SDOH positive flags
  const sdohPositive = Object.entries(sdoh || {})
    .filter(([k]) => !k.startsWith("phq2") && !k.startsWith("auditc") && k !== "tobacco")
    .some(([,v]) => v === "2");
  const phq2Score = parseInt(sdoh?.phq2q1 || "0") + parseInt(sdoh?.phq2q2 || "0");

  // MDM derived E/M level
  const mdmComplete = mdmState?.copa && mdmState?.risk;

  return [
    // ── PATIENT IDENTITY ──────────────────────────────────────────────────
    {
      group: "Patient Identity",
      critical: true,
      label: "Patient name documented",
      detail: patientName ? `${patientName}${demo?.age ? ", " + demo.age + "y" : ""}` : "Missing — enter demographics",
      status: patientName ? "pass" : "fail",
    },
    {
      group: "Patient Identity",
      critical: false,
      label: "MRN / identifier",
      detail: demo?.mrn ? `MRN: ${demo.mrn}` : "Not entered — document MRN for chart matching",
      status: demo?.mrn ? "pass" : "warn",
    },

    // ── CHIEF COMPLAINT & HPI ─────────────────────────────────────────────
    {
      group: "Chief Complaint & HPI",
      critical: true,
      label: "Chief complaint recorded",
      detail: cc?.text ? `"${cc.text}"` : "No chief complaint entered",
      status: cc?.text ? "pass" : "fail",
    },
    {
      group: "Chief Complaint & HPI",
      critical: false,
      label: "HPI narrative",
      detail: cc?.hpi ? "HPI present" : "HPI not documented — consider generating or entering",
      status: cc?.hpi ? "pass" : "warn",
    },

    // ── VITALS ────────────────────────────────────────────────────────────
    {
      group: "Vitals",
      critical: true,
      label: "Vital signs recorded",
      detail: (vitals?.bp || vitals?.hr)
        ? `BP ${vitals.bp || "—"}  HR ${vitals.hr || "—"}  SpO2 ${vitals.spo2 || "—"}  T ${vitals.temp || "—"}`
        : "No vitals documented",
      status: (vitals?.bp || vitals?.hr) ? "pass" : "fail",
    },
    {
      group: "Vitals",
      critical: false,
      label: "ESI triage level",
      detail: esiLevel ? `ESI ${esiLevel} assigned` : "Triage level not set",
      status: esiLevel ? "pass" : "warn",
    },
    {
      group: "Vitals",
      critical: false,
      label: "Reassessment documented",
      detail: reassessState?.condition
        ? `Condition: ${reassessState.condition}`
        : reassessState?.note
        ? "Reassessment note present"
        : "No reassessment recorded — required for ESI 1–3",
      status: reassessState?.condition || reassessState?.note ? "pass" : "warn",
    },

    // ── ALLERGIES & MEDICATIONS ───────────────────────────────────────────
    {
      group: "Allergies & Medications",
      critical: true,
      label: "Allergy status documented",
      detail: allergies?.length
        ? `Allergies: ${allergies.slice(0,4).join(", ")}${allergies.length > 4 ? "…" : ""}`
        : "No allergies entered — confirm NKDA or list allergies",
      status: allergies?.length ? "pass" : "warn",
    },
    {
      group: "Allergies & Medications",
      critical: false,
      label: "Medication reconciliation",
      detail: medications?.length
        ? `${medications.length} medication(s) listed`
        : "No medications recorded — confirm no home meds or reconcile",
      status: medications?.length ? "pass" : "warn",
    },
    ...(hasPdmpDrug ? [{
      group: "Allergies & Medications",
      critical: true,
      label: "PDMP check — controlled substance prescribing",
      detail: pdmpState?.checked
        ? `Checked at ${pdmpState.timestamp || "time not recorded"}${pdmpState.method ? " via " + pdmpState.method : ""}`
        : "Controlled substance/opioid detected in meds — PDMP check required",
      status: pdmpState?.checked ? "pass" : "fail",
    }] : []),

    // ── CLINICAL DOCUMENTATION ────────────────────────────────────────────
    {
      group: "Clinical Documentation",
      critical: false,
      label: "Review of Systems",
      detail: rosCount >= 4
        ? `${rosCount} systems reviewed`
        : rosCount > 0
        ? `${rosCount} system(s) documented — ≥4 recommended for moderate/high MDM`
        : "ROS not documented",
      status: rosCount >= 4 ? "pass" : rosCount > 0 ? "warn" : "warn",
    },
    {
      group: "Clinical Documentation",
      critical: false,
      label: "Physical Examination",
      detail: peCount >= 3
        ? `${peCount} systems examined`
        : peCount > 0
        ? `${peCount} system(s) — ≥3 systems recommended`
        : "Physical exam not documented",
      status: peCount >= 3 ? "pass" : peCount > 0 ? "warn" : "warn",
    },

    // ── MDM ───────────────────────────────────────────────────────────────
    {
      group: "Medical Decision Making",
      critical: false,
      label: "MDM complexity assigned",
      detail: mdmComplete
        ? `COPA: ${mdmState.copa} | Risk: ${mdmState.risk}`
        : "MDM not completed — required for AMA CPT 2023 E/M coding",
      status: mdmComplete ? "pass" : "warn",
    },
    {
      group: "Medical Decision Making",
      critical: false,
      label: "MDM narrative",
      detail: mdmState?.narrative
        ? "Narrative generated"
        : "No MDM narrative — generate from MDM Builder tab",
      status: mdmState?.narrative ? "pass" : "warn",
    },

    // ── CONSULTS ──────────────────────────────────────────────────────────
    ...(consults?.length > 0 ? [{
      group: "Consults",
      critical: false,
      label: "Consult documentation",
      detail: consults.map(c => `${c.service} — ${c.status || "pending"}`).join("; "),
      status: consults.every(c => c.status === "completed") ? "pass" : "warn",
    }] : []),

    // ── DISPOSITION ───────────────────────────────────────────────────────
    {
      group: "Disposition",
      critical: true,
      label: "Disposition documented",
      detail: disposition
        ? `${disposition.toUpperCase()}${dispReason ? " — " + dispReason.slice(0, 80) : ""}`
        : "Disposition not set — required before signing",
      status: disposition ? "pass" : "fail",
    },

    // ── SEPSIS BUNDLE (if active) ─────────────────────────────────────────
    ...(sepsisActive ? [{
      group: "Sepsis Bundle (CMS SEP-1)",
      critical: true,
      label: "Hour-1 bundle documentation",
      detail: sepsisComplete
        ? "Lactate, antibiotics, and fluids all documented"
        : `Incomplete — ${!sepsisBundle?.lactateOrdered ? "lactate " : ""}${!sepsisBundle?.abxOrdered ? "ABX " : ""}${!sepsisBundle?.fluidsStarted ? "fluids " : ""}not documented`,
      status: sepsisComplete ? "pass" : "fail",
    }] : []),

    // ── SDOH ──────────────────────────────────────────────────────────────
    ...(sdohPositive || phq2Score >= 3 ? [{
      group: "SDOH / Social Risk",
      critical: false,
      label: "Social risk flagged — document in plan",
      detail: [
        sdohPositive && "Social determinant concern identified",
        phq2Score >= 3 && `PHQ-2 positive (${phq2Score}/6)`,
      ].filter(Boolean).join(" · "),
      status: "warn",
    }] : []),

    // ── GERIATRIC (ISAR) ──────────────────────────────────────────────────
    ...(isarScore >= 2 ? [{
      group: "Geriatric Safety",
      critical: false,
      label: "ISAR ≥ 2 — high-risk elder discharge",
      detail: `ISAR score ${isarScore}/6 — ensure follow-up and care coordination documented`,
      status: "warn",
    }] : []),

    // ── PROVIDER ──────────────────────────────────────────────────────────
    {
      group: "Provider",
      critical: true,
      label: "Signing provider",
      detail: providerName && providerName !== "Provider"
        ? `Signing as: ${providerName}`
        : "Provider name not set — update in settings",
      status: providerName && providerName !== "Provider" ? "pass" : "warn",
    },
  ];
}

function Item({ item }) {
  const s = STATUS[item.status];
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10,
      padding:"9px 12px", borderRadius:9, marginBottom:5,
      background:s.bg, border:`1px solid ${s.border}` }}>
      <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
        background:`${s.color}22`, border:`1px solid ${s.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
        color:s.color }}>
        {s.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:12.5, color:item.status==="fail" ? s.color : T.txt }}>
            {item.label}
          </span>
          {item.critical && item.status !== "pass" && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.coral, background:"rgba(255,107,107,0.12)",
              border:"1px solid rgba(255,107,107,0.3)",
              borderRadius:3, padding:"1px 5px", letterSpacing:1 }}>
              REQUIRED
            </span>
          )}
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt4, marginTop:2, lineHeight:1.5 }}>
          {item.detail}
        </div>
      </div>
    </div>
  );
}

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
  const critFails  = items.filter(i => i.critical && i.status === "fail").length;
  const canSign    = critFails === 0;

  const summaryColor = critFails > 0 ? T.coral : warnCount > 0 ? T.gold : T.teal;
  const summaryLabel = critFails > 0
    ? `${critFails} critical item${critFails > 1 ? "s" : ""} must be resolved before signing`
    : warnCount > 0
    ? `${warnCount} advisory item${warnCount > 1 ? "s" : ""} — review before signing`
    : "All required items complete — ready to sign";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Summary bar */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
        padding:"12px 16px", borderRadius:10, marginBottom:18,
        background:`${summaryColor}0a`, border:`1px solid ${summaryColor}44`,
        borderLeft:`4px solid ${summaryColor}` }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:summaryColor }}>
          Pre-Sign Checklist
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:summaryColor, flex:1 }}>
          {summaryLabel}
        </div>
        <div style={{ display:"flex", gap:10, flexShrink:0 }}>
          {[
            { v:passCount, label:"Pass",    c:T.teal  },
            { v:warnCount, label:"Advisory", c:T.gold  },
            { v:failCount, label:"Required", c:T.coral },
          ].map(b => (
            <div key={b.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontSize:18, fontWeight:900, color:b.c, lineHeight:1 }}>
                {b.v}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4, textTransform:"uppercase",
                letterSpacing:1, marginTop:2 }}>
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped items */}
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group} style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:"1.5px", textTransform:"uppercase",
            marginBottom:7 }}>
            {group}
          </div>
          {groupItems.map((item, i) => <Item key={i} item={item} />)}
        </div>
      ))}

      {/* Confirm + Sign */}
      <div style={{ marginTop:20, padding:"14px 16px", borderRadius:10,
        background:T.card, border:`1px solid ${T.bd}` }}>
        <label style={{ display:"flex", alignItems:"flex-start", gap:10,
          cursor: canSign ? "pointer" : "not-allowed", userSelect:"none" }}>
          <div onClick={() => canSign && setConfirmed(c => !c)}
            style={{ width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1,
              border:`2px solid ${confirmed ? T.teal : "rgba(42,79,122,0.5)"}`,
              background: confirmed ? T.teal : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .15s" }}>
            {confirmed && <span style={{ color:"#050f1e", fontWeight:900, fontSize:11 }}>✓</span>}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
            color: canSign ? T.txt2 : T.txt4, lineHeight:1.6 }}>
            I confirm I have reviewed the patient encounter, verified the information above is accurate,
            and this chart is ready for signature.
          </div>
        </label>

        <button
          onClick={() => confirmed && canSign && !saving && onSign?.()}
          disabled={!confirmed || !canSign || saving}
          style={{ width:"100%", marginTop:14, padding:"12px",
            borderRadius:10, fontFamily:"'DM Sans',sans-serif",
            fontWeight:700, fontSize:14, cursor: (confirmed && canSign && !saving) ? "pointer" : "not-allowed",
            border:"none", transition:"all .2s",
            background: confirmed && canSign
              ? `linear-gradient(135deg,${T.teal},#00b4a0)`
              : "rgba(26,53,85,0.4)",
            color: confirmed && canSign ? "#050f1e" : T.txt4 }}>
          {saving ? "Signing…" : critFails > 0 ? `Resolve ${critFails} Required Item${critFails > 1 ? "s" : ""} to Sign` : "Sign & Save Chart"}
        </button>

        {!canSign && (
          <div style={{ marginTop:8, fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:"rgba(255,107,107,0.7)", textAlign:"center" }}>
            Complete all required items (marked REQUIRED) before signing
          </div>
        )}
      </div>
    </div>
  );
}