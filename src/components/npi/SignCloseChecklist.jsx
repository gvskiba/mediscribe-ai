// SignCloseChecklist.jsx
// Pre-sign validation modal — fires when the provider clicks "Sign & Save".
// Checks compliance items (SDOH, PHQ-2, AUDIT-C, Beers, CEDR, teach-back),
// billing completeness (MDM domain count, diagnosis documentation, ICD-10
// specificity), and documentation consistency (MDM complexity vs HPI/PE depth).
//
// Each check is either satisfied ✓, flagged with a one-click navigate-to-fix
// link, or overridable. Nothing is hard-blocking — the provider always has
// a "Sign Anyway" path with a single explicit click.
//
// Props:
//   open             boolean — controls modal visibility
//   onClose          () => void — dismiss without signing
//   onConfirm        () => void — sign the chart
//   onNavigate       (section: string) => void — jump to a tab to fix
//   demo, cc, vitals, medications, allergies, pmhSelected
//   rosState, peState, disposition, dispReason
//   sdoh, esiLevel, registration
//   mdmState, mdmDataElements
//   sepsisBundle, avpu
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useMemo, useState } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff",
};

// ── Beers drug list (minimal — common ED agents) ──────────────────────────────
const BEERS_TERMS = [
  "diphenhydramine","benadryl","hydroxyzine","diazepam","lorazepam","alprazolam",
  "clonazepam","zolpidem","ambien","temazepam","oxybutynin","promethazine",
  "methocarbamol","cyclobenzaprine","flexeril","carisoprodol","meperidine",
  "demerol","ketorolac","toradol","indomethacin","glyburide","haloperidol",
  "doxylamine","metoclopramide","reglan",
];
function isBeersDrug(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return BEERS_TERMS.some(t => n.includes(t));
}

// ── Tiers ─────────────────────────────────────────────────────────────────────
// compliance — regulatory / legal requirement
// billing    — affects reimbursement / audit risk
// advisory   — best practice, low stakes if missed
const TIER = {
  compliance: { label:"Compliance",  color:T.coral,  bg:"rgba(255,107,107,.08)",  bd:"rgba(255,107,107,.35)" },
  billing:    { label:"Billing",     color:T.gold,   bg:"rgba(245,200,66,.07)",   bd:"rgba(245,200,66,.3)"   },
  advisory:   { label:"Advisory",    color:T.blue,   bg:"rgba(59,158,255,.06)",   bd:"rgba(59,158,255,.2)"   },
};

// ── Build checks ──────────────────────────────────────────────────────────────
function buildChecks({
  demo, cc, vitals, medications, allergies,
  rosState, peState, disposition, dispReason,
  sdoh, esiLevel, mdmState, mdmDataElements,
  sepsisBundle, avpu, communicationEvents,
}) {
  const checks = [];

  // ── Derived ───────────────────────────────────────────────────────────────
  const age         = parseInt(demo?.age) || 0;
  const phq2Score   = parseInt(sdoh?.phq2q1||"0") + parseInt(sdoh?.phq2q2||"0");
  const phq2Pos     = Boolean(sdoh?.phq2q1 && sdoh?.phq2q2 && phq2Score >= 3);
  const auditcScore = parseInt(sdoh?.auditcq1||"0") + parseInt(sdoh?.auditcq2||"0") + parseInt(sdoh?.auditcq3||"0");
  const auditcThresh = (demo?.sex||"").toLowerCase().startsWith("f") ? 3 : 4;
  const auditcPos   = Boolean(sdoh?.auditcq1 && sdoh?.auditcq2 && sdoh?.auditcq3 && auditcScore >= auditcThresh);
  const transportRisk = sdoh?.transport === "2";
  const beersMeds   = (medications||[]).filter(m => isBeersDrug(typeof m === "string" ? m : m.name||""));
  const META_SKIP   = new Set(["_remainderNeg","_remainderNormal","_mode","_visual"]);
  const rosReviewed = Object.entries(rosState||{}).filter(([k]) => !META_SKIP.has(k)).length;
  const peAssessed  = Object.entries(peState||{}).filter(([k,v]) => !META_SKIP.has(k) && v).length;
  const mdmDomains  = [mdmState?.problems, mdmState?.data, mdmState?.risk].filter(Boolean).length;
  const mdmLevel    = mdmState?.level || mdmState?.complexity || 0;
  const mdmNarrative = mdmState?.narrative || mdmState?.mdmText || "";
  const hasDiagnosis = Boolean(cc?.text || (mdmDataElements||[]).length > 0 || mdmNarrative?.trim());

  // ── SBP / HR for shock index ──────────────────────────────────────────────
  const sbp = parseFloat((vitals?.bp||"").split("/")[0]) || 0;
  const hr  = parseFloat(vitals?.hr||"0") || 0;
  const si  = hr > 0 && sbp > 0 ? hr / sbp : 0;

  // qSOFA (needs two of three)
  const rrMet = parseFloat(vitals?.rr||"0") >= 22;
  const bpMet = sbp > 0 && sbp <= 100;
  const msMet = Boolean(avpu && avpu !== "Alert");
  const qsofa = (rrMet?1:0) + (bpMet?1:0) + (msMet?1:0);

  // ──────────────────────────────────────────────────────────────────────────
  // COMPLIANCE CHECKS
  // ──────────────────────────────────────────────────────────────────────────

  // 1. PHQ-2 positive — document behavioral health follow-up
  if (phq2Pos) {
    const fixed = Boolean(dispReason?.toLowerCase().match(/mental|psych|behav|mh|depress|anxiety|crisis|follow.?up/));
    checks.push({
      id:"phq2",
      tier:"compliance",
      icon:"\uD83E\uDDE0",
      title:`PHQ-2 Positive (${phq2Score}/6) — Document behavioral health plan`,
      detail:"Joint Commission and CMS require documentation of behavioral health follow-up or referral when PHQ-2 screens positive.",
      fixed,
      navTo:"discharge",
      navLabel:"Go to Discharge",
    });
  }

  // 2. AUDIT-C positive — document brief counseling
  if (auditcPos) {
    const fixed = Boolean(dispReason?.toLowerCase().match(/alcohol|audit|counsel|drink|substance|rehab|addiction/));
    checks.push({
      id:"auditc",
      tier:"compliance",
      icon:"\uD83C\uDF7A",
      title:`AUDIT-C Positive (${auditcScore}/12, \u2265${auditcThresh}) — Document alcohol counseling`,
      detail:"MIPS Measure #431 requires brief counseling or referral documentation for positive AUDIT-C screens. Affects quality reporting.",
      fixed,
      navTo:"discharge",
      navLabel:"Go to Discharge",
    });
  }

  // 3. Beers Criteria — age ≥65
  if (age >= 65 && beersMeds.length > 0) {
    const medNames = beersMeds.map(m => typeof m === "string" ? m : m.name||"").join(", ");
    const fixed = Boolean(dispReason?.toLowerCase().match(/beer|inappropr|alternative|rationale/)) || Boolean(mdmNarrative?.toLowerCase().includes("beer"));
    checks.push({
      id:"beers",
      tier:"compliance",
      icon:"\u26A0\uFE0F",
      title:`Beers Criteria Medication${beersMeds.length > 1 ? "s" : ""} — Document rationale`,
      detail:`${medNames} — potentially inappropriate for age \u226565 (AGS 2023). Document explicit rationale or therapeutic alternative in MDM or discharge note.`,
      fixed,
      navTo:"mdm",
      navLabel:"Go to MDM",
    });
  }

  // 4. Transport barrier — confirm discharge plan
  if (transportRisk && disposition === "discharge") {
    const fixed = Boolean(dispReason?.toLowerCase().match(/transport|ride|ambulance|uber|family|safe/));
    checks.push({
      id:"transport",
      tier:"compliance",
      icon:"\uD83D\uDE97",
      title:"Transportation barrier — confirm safe discharge plan",
      detail:"Patient screened positive for transportation access issue. Document how patient will safely get home before discharge.",
      fixed,
      navTo:"discharge",
      navLabel:"Go to Discharge",
    });
  }

  // 5. CEDR follow-up coordination
  if (disposition === "discharge") {
    const hasFollowUp = Boolean(dispReason) && dispReason.length > 10;
    checks.push({
      id:"cedr",
      tier:"compliance",
      icon:"\uD83D\uDCC5",
      title:"CEDR 2025 — Follow-up coordination documentation",
      detail:"CEDR requires provider name, timeframe, and communication method for the discharge coordination measure.",
      fixed:hasFollowUp,
      navTo:"discharge",
      navLabel:"Go to Discharge",
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BILLING CHECKS
  // ──────────────────────────────────────────────────────────────────────────

  // 6. No diagnosis documented
  if (!hasDiagnosis) {
    checks.push({
      id:"nodx",
      tier:"billing",
      icon:"\uD83C\uDFAF",
      title:"No working diagnosis documented",
      detail:"Every ED encounter requires a documented impression or working diagnosis for billing. Add primary diagnosis in Clinical Note Studio.",
      fixed:false,
      navTo:"chart",
      navLabel:"Go to Chart",
    });
  }

  // 7. MDM complexity not set
  if (!mdmLevel && !mdmNarrative?.trim()) {
    checks.push({
      id:"nomdm",
      tier:"billing",
      icon:"\u2696\uFE0F",
      title:"MDM complexity not documented",
      detail:"E/M level selection requires documented MDM complexity. Without it, the encounter defaults to lowest complexity on audit.",
      fixed:false,
      navTo:"mdm",
      navLabel:"Go to MDM",
    });
  }

  // 8. MDM level set but fewer than 2 domains documented
  if (mdmLevel && mdmDomains < 2) {
    checks.push({
      id:"mdmdomains",
      tier:"billing",
      icon:"\uD83D\uDCCB",
      title:`MDM complexity set but only ${mdmDomains}/3 domains documented`,
      detail:"AMA 2023 requires 2 of 3 domains (Problems, Data, Risk) to support the selected E/M level. An auditor will downcode without them.",
      fixed:false,
      navTo:"mdm",
      navLabel:"Complete MDM",
    });
  }

  // 9. High/Moderate MDM with minimal HPI
  const hpiLength = (cc?.hpi || cc?.text || "").length;
  if (mdmLevel >= 3 && hpiLength < 40) {
    checks.push({
      id:"hpishort",
      tier:"billing",
      icon:"\uD83D\uDCDD",
      title:"High MDM complexity with minimal HPI documentation",
      detail:"A high-complexity E/M level is more defensible when supported by a detailed HPI. Auditors look for OLDCARTS elements.",
      fixed:hpiLength >= 40,
      navTo:"hpi",
      navLabel:"Go to HPI",
    });
  }

  // 10. No disposition set
  if (!disposition) {
    checks.push({
      id:"nodisp",
      tier:"billing",
      icon:"\uD83C\uDFE5",
      title:"No disposition documented",
      detail:"Disposition (discharge, admit, observation, transfer) is required for ED billing and quality reporting.",
      fixed:false,
      navTo:"closeout",
      navLabel:"Set Disposition",
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADVISORY CHECKS
  // ──────────────────────────────────────────────────────────────────────────

  // 11. qSOFA ≥2 with incomplete sepsis bundle
  if (qsofa >= 2) {
    const bundleItems = ["lactateOrdered","abxOrdered","culturesDrawn","ivAccessObtained"];
    const bundleCount = bundleItems.filter(k => sepsisBundle?.[k]).length;
    const fixed = bundleCount >= 3;
    checks.push({
      id:"sepsis",
      tier:"advisory",
      icon:"\uD83E\uDDAB",
      title:`qSOFA ${qsofa}/3 — Sepsis bundle ${bundleCount}/${bundleItems.length} elements stamped`,
      detail:"CMS SEP-1 requires documentation of lactate, cultures, and antibiotics within 3 hours of sepsis recognition. Complete bundle timestamps before signing.",
      fixed,
      navTo:"sepsis",
      navLabel:"Go to Sepsis Hub",
    });
  }

  // 12. ROS not documented (if chart requires it)
  if (mdmLevel >= 2 && rosReviewed === 0) {
    checks.push({
      id:"noros",
      tier:"advisory",
      icon:"\uD83D\uDD0D",
      title:"ROS not documented",
      detail:"A complete or pertinent ROS supports higher E/M levels and demonstrates thoroughness. Click \u2713 Deny All to complete in one step.",
      fixed:false,
      navTo:"ros",
      navLabel:"Go to ROS",
    });
  }

  // 13. PE not documented
  if (mdmLevel >= 2 && peAssessed === 0) {
    checks.push({
      id:"nope",
      tier:"advisory",
      icon:"\uD83E\uDE7A",
      title:"Physical exam not documented",
      detail:"A documented physical exam strengthens the medical record and supports E/M level selection.",
      fixed:false,
      navTo:"pe",
      navLabel:"Go to PE",
    });
  }

  // 14. Advisory: shock index ≥0.9 with discharge disposition
  if (si >= 0.9 && disposition === "discharge") {
    checks.push({
      id:"si",
      tier:"advisory",
      icon:"\uD83D\uDCC9",
      title:`Shock index ${si.toFixed(2)} — Verify stability before discharge`,
      detail:"Shock index \u22650.9 carries elevated risk of deterioration. Confirm repeat vitals are stable and rationale for discharge is documented in MDM.",
      fixed: si < 0.9,
      navTo:"vit",
      navLabel:"Check Vitals",
    });
  }

  // 15. Advisory: discharge without any patient education logged
  if (disposition === "discharge") {
    const hasEducation = (communicationEvents||[]).some(e => e.type === "patient_education");
    checks.push({
      id:"education_logged",
      tier:"advisory",
      icon:"\uD83D\uDCDA",
      title:"Patient education not logged in Communication Log",
      detail:"Logging patient education with teach-back supports JCAHO EP.5 and CMS discharge education documentation. Takes under 60 seconds.",
      fixed:hasEducation,
      navTo:"comms",
      navLabel:"Open Comm Log",
    });
  }

  // 16. Advisory: PCP/specialist notification at discharge
  if (disposition === "discharge") {
    const hasProviderNotify = (communicationEvents||[]).some(e =>
      e.type === "pcp_notify" || e.type === "consult_callback"
    );
    checks.push({
      id:"provider_notify",
      tier:"advisory",
      icon:"\uD83C\uDFE5",
      title:"Outgoing provider notification not documented",
      detail:"Documenting PCP or specialist notification at discharge supports care coordination and reduces information loss between settings.",
      fixed:hasProviderNotify,
      navTo:"comms",
      navLabel:"Open Comm Log",
    });
  }

  return checks;
}

// ── CheckRow ──────────────────────────────────────────────────────────────────
function CheckRow({ check, onNavigate, onDismiss, dismissed }) {
  const tier = TIER[check.tier];
  if (check.fixed) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, background:"rgba(0,229,192,.05)", border:"1px solid rgba(0,229,192,.15)" }}>
        <div style={{ width:18, height:18, borderRadius:9, background:"rgba(0,229,192,.2)", border:"1px solid rgba(0,229,192,.45)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ color:T.teal, fontSize:11, fontWeight:900, lineHeight:1 }}>\u2713</span>
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, flex:1 }}>{check.title}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal, letterSpacing:"0.5px" }}>SATISFIED</span>
      </div>
    );
  }

  if (dismissed) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", borderRadius:8, background:"rgba(42,77,114,.15)", border:"1px solid rgba(42,77,114,.3)", opacity:.6 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, flex:1 }}>{check.title}</span>
        <button onClick={() => onDismiss(check.id, false)} style={{ background:"none", border:"none", color:T.txt4, fontSize:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Restore</button>
      </div>
    );
  }

  return (
    <div style={{ padding:"10px 12px", borderRadius:8, background:tier.bg, border:`1px solid ${tier.bd}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:14, lineHeight:1.2, flexShrink:0 }}>{check.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:tier.color }}>{check.title}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:tier.color, background:`${tier.color}18`, border:`1px solid ${tier.color}30`, borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px", flexShrink:0 }}>{tier.label.toUpperCase()}</span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.55, marginBottom:7 }}>{check.detail}</div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {check.navTo && onNavigate && (
              <button onClick={() => onNavigate(check.navTo)}
                style={{ padding:"3px 11px", borderRadius:5, border:`1px solid ${tier.color}55`, background:`${tier.color}12`, color:tier.color, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                {check.navLabel || "Go to section"} \u2192
              </button>
            )}
            <button onClick={() => onDismiss(check.id, true)}
              style={{ padding:"3px 9px", borderRadius:5, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:10, cursor:"pointer" }}>
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SignCloseChecklist({
  open, onClose, onConfirm, onNavigate,
  demo = {}, cc = {}, vitals = {}, medications = [], allergies = [],
  rosState = {}, peState = {}, disposition = "", dispReason = "",
  sdoh = {}, esiLevel = "", mdmState = {}, mdmDataElements = [],
  sepsisBundle = {}, avpu = "",
  communicationEvents = [],
}) {
  const [dismissed, setDismissed] = useState({});

  const checks = useMemo(() => buildChecks({
    demo, cc, vitals, medications, allergies,
    rosState, peState, disposition, dispReason,
    sdoh, esiLevel, mdmState, mdmDataElements,
    sepsisBundle, avpu, communicationEvents,
  }), [demo, cc, vitals, medications, allergies, rosState, peState,
       disposition, dispReason, sdoh, esiLevel, mdmState,
       mdmDataElements, sepsisBundle, avpu, communicationEvents]);

  const handleDismiss = (id, val) =>
    setDismissed(p => ({ ...p, [id]: val }));

  const handleNavigate = (section) => {
    onNavigate?.(section);
    onClose();
  };

  if (!open) return null;

  const openChecks   = checks.filter(c => !c.fixed);
  const fixedChecks  = checks.filter(c => c.fixed);
  const compliance   = openChecks.filter(c => c.tier === "compliance");
  const billing      = openChecks.filter(c => c.tier === "billing");
  const advisory     = openChecks.filter(c => c.tier === "advisory");

  const remainingCount = openChecks.filter(c => !dismissed[c.id]).length;
  const allClear       = openChecks.length === 0;

  // ── Metadata strip ─────────────────────────────────────────────────────────
  const patName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient";
  const mdmLevel = mdmState?.level || mdmState?.complexity;
  const mdmLevelLabels = ["","Straightforward","Low","Moderate","High"];
  const mdmDomains = [mdmState?.problems, mdmState?.data, mdmState?.risk].filter(Boolean).length;

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose}
        style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(3,8,16,.78)", backdropFilter:"blur(5px)" }} />

      {/* Modal */}
      <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, pointerEvents:"none" }}>
        <div onClick={e => e.stopPropagation()}
          style={{ width:"100%", maxWidth:640, maxHeight:"88vh", display:"flex", flexDirection:"column", background:T.panel, border:`1px solid ${allClear ? "rgba(0,229,192,.4)" : "rgba(26,53,85,.7)"}`, borderTop:`3px solid ${allClear ? T.teal : T.coral}`, borderRadius:14, boxShadow:"0 32px 96px rgba(0,0,0,.7)", overflow:"hidden", pointerEvents:"auto" }}>

          {/* Header */}
          <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:T.txt }}>
                  {allClear ? "\u2713 Ready to Sign" : "Pre-Sign Review"}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>
                  {patName}{demo.age ? ` \u00b7 ${demo.age}y` : ""}{cc.text ? ` \u00b7 ${cc.text}` : ""}
                  {esiLevel ? ` \u00b7 ESI ${esiLevel}` : ""}
                </div>
              </div>
              <button onClick={onClose}
                style={{ width:28, height:28, borderRadius:14, border:`1px solid ${T.bd}`, background:T.up, color:T.txt4, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                \u2715
              </button>
            </div>

            {/* E/M summary strip */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[
                {
                  lbl:"E/M Level",
                  val: mdmLevel ? mdmLevelLabels[mdmLevel] || `Level ${mdmLevel}` : "Not set",
                  col: mdmLevel ? (mdmLevel >= 3 ? T.gold : T.teal) : T.coral,
                },
                {
                  lbl:"MDM Domains",
                  val:`${mdmDomains}/3`,
                  col: mdmDomains >= 2 ? T.teal : T.coral,
                },
                {
                  lbl:"Disposition",
                  val: disposition || "Not set",
                  col: disposition ? T.teal : T.coral,
                },
                {
                  lbl:"ROS Systems",
                  val: (() => {
                    const META = new Set(["_remainderNeg","_remainderNormal","_mode","_visual"]);
                    return Object.entries(rosState||{}).filter(([k]) => !META.has(k)).length;
                  })(),
                  col: T.txt3,
                },
              ].map(item => (
                <div key={item.lbl} style={{ padding:"5px 11px", borderRadius:7, background:T.up, border:`1px solid ${T.bd}`, textAlign:"center" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>{item.lbl}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:item.col }}>{item.val}</div>
                </div>
              ))}
              {openChecks.length > 0 && (
                <div style={{ padding:"5px 11px", borderRadius:7, background: remainingCount > 0 ? "rgba(255,107,107,.1)" : "rgba(0,229,192,.08)", border:`1px solid ${remainingCount > 0 ? "rgba(255,107,107,.3)" : "rgba(0,229,192,.25)"}`, textAlign:"center", marginLeft:"auto" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>Open Items</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color: remainingCount > 0 ? T.coral : T.teal }}>{remainingCount}</div>
                </div>
              )}
            </div>
          </div>

          {/* Checklist body */}
          <div style={{ overflowY:"auto", flex:1, padding:"14px 20px" }}>

            {allClear && (
              <div style={{ padding:"20px 16px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                <div style={{ width:48, height:48, borderRadius:24, background:"rgba(0,229,192,.15)", border:"1px solid rgba(0,229,192,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                  \u2713
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.teal }}>All checks satisfied</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, maxWidth:340, lineHeight:1.6 }}>
                  Documentation is complete. Click Sign &amp; Save to finalize the chart.
                </div>
              </div>
            )}

            {compliance.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.coral, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:3, background:T.coral }} />
                  Compliance ({compliance.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {compliance.map(c => (
                    <CheckRow key={c.id} check={c} onNavigate={handleNavigate} onDismiss={handleDismiss} dismissed={dismissed[c.id]} />
                  ))}
                </div>
              </div>
            )}

            {billing.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:3, background:T.gold }} />
                  Billing ({billing.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {billing.map(c => (
                    <CheckRow key={c.id} check={c} onNavigate={handleNavigate} onDismiss={handleDismiss} dismissed={dismissed[c.id]} />
                  ))}
                </div>
              </div>
            )}

            {advisory.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.blue, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:3, background:T.blue }} />
                  Advisory ({advisory.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {advisory.map(c => (
                    <CheckRow key={c.id} check={c} onNavigate={handleNavigate} onDismiss={handleDismiss} dismissed={dismissed[c.id]} />
                  ))}
                </div>
              </div>
            )}

            {fixedChecks.length > 0 && (
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:3, background:T.teal }} />
                  Satisfied ({fixedChecks.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {fixedChecks.map(c => (
                    <CheckRow key={c.id} check={c} onNavigate={null} onDismiss={handleDismiss} dismissed={false} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ padding:"14px 20px", borderTop:`1px solid ${T.bd}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <button onClick={onClose}
              style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Go Back
            </button>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {remainingCount > 0 && !allClear && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
                  {remainingCount} item{remainingCount > 1 ? "s" : ""} unresolved
                </div>
              )}
              <button onClick={onConfirm}
                style={{ padding:"9px 22px", borderRadius:8, border:`1px solid ${allClear || remainingCount === 0 ? "none" : "rgba(59,158,255,.3)"}`, background: allClear || remainingCount === 0 ? "linear-gradient(135deg,#00e5c0,#00b4d8)" : "rgba(59,158,255,.12)", color: allClear || remainingCount === 0 ? "#050f1e" : T.blue, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .15s" }}>
                {allClear || remainingCount === 0 ? "\u270D Sign & Save" : "Sign Anyway \u2192"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}