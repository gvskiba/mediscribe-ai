// useEncounterSummary.js
// Derives a structured plain-text summary of the current NPI encounter.
// Used by handoff, discharge, autocoder, and any module that needs a
// concise, AI-ready snapshot of everything entered so far.
//
// Returns:
//   summary       — full multi-line string (pass directly to an LLM)
//   hasContext    — boolean: true when at least minimal data is present
//   sections      — object with individual section strings (for selective use)

import { useMemo } from "react";

/**
 * @param {object} encounter  — spread of NPI state props
 */
export function useEncounterSummary({
  demo          = {},
  cc            = {},
  vitals        = {},
  vitalsHistory = [],
  medications   = [],
  allergies     = [],
  pmhSelected   = [],
  rosState      = {},
  peState       = {},
  peFindings    = {},
  mdmState      = null,
  consults      = [],
  disposition   = "",
  dispReason    = "",
  dispTime      = "",
  esiLevel      = "",
  doorTime      = "",
  providerName  = "",
  registration  = {},
  sdoh          = {},
  sepsisBundle  = {},
} = {}) {

  return useMemo(() => {

    // ── Demographics ──────────────────────────────────────────────────────
    const nameParts  = [demo?.firstName, demo?.lastName].filter(Boolean);
    const patName    = nameParts.join(" ") || "";
    const demoLine   = [
      demo?.age  ? `${demo.age}yo`   : "",
      demo?.sex  || "",
      demo?.dob  ? `DOB ${demo.dob}` : "",
    ].filter(Boolean).join(" ");
    const mrnLine    = registration?.mrn ? `MRN ${registration.mrn}` : "";

    const demographics = [
      patName   && `Patient: ${patName}`,
      demoLine  && `Demographics: ${demoLine}`,
      mrnLine,
      esiLevel  && `ESI Level: ${esiLevel}`,
      doorTime  && `Arrival: ${doorTime}`,
      providerName && `Provider: ${providerName}`,
    ].filter(Boolean).join("\n");

    // ── Chief Complaint ───────────────────────────────────────────────────
    const chiefComplaint = [
      cc?.text     && `CC: ${cc.text}`,
      cc?.onset    && `Onset: ${cc.onset}`,
      cc?.severity && `Severity: ${cc.severity}/10`,
      cc?.hpi      && `HPI: ${cc.hpi.slice(0, 400)}${cc.hpi.length > 400 ? "..." : ""}`,
    ].filter(Boolean).join("\n");

    // ── Vitals ────────────────────────────────────────────────────────────
    const vsItems = [
      vitals?.bp   && `BP ${vitals.bp}`,
      vitals?.hr   && `HR ${vitals.hr}`,
      vitals?.rr   && `RR ${vitals.rr}`,
      vitals?.spo2 && `SpO2 ${vitals.spo2}%`,
      vitals?.temp && `T ${vitals.temp}`,
      vitals?.wt   && `Wt ${vitals.wt}`,
      vitals?.pain !== undefined && vitals?.pain !== "" && `Pain ${vitals.pain}/10`,
    ].filter(Boolean);
    const vitalsSection = vsItems.length ? `Vitals: ${vsItems.join("  ")}` : "";

    // ── Meds / Allergies / PMH ────────────────────────────────────────────
    const medList = (medications || [])
      .map(m => typeof m === "string" ? m : (m?.name || m?.drug || ""))
      .filter(Boolean);
    const allergyList = (allergies || [])
      .map(a => typeof a === "string" ? a : (a?.name || a?.allergen || ""))
      .filter(Boolean);
    const pmhList = Array.isArray(pmhSelected)
      ? pmhSelected.slice(0, 10)
      : Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);

    const medsAllergiesPmh = [
      medList.length     ? `Medications: ${medList.join(", ")}`          : "Medications: None listed",
      allergyList.length ? `Allergies: ${allergyList.join(", ")}`        : "Allergies: NKDA",
      pmhList.length     ? `PMH: ${pmhList.slice(0, 8).join(", ")}`      : "",
    ].filter(Boolean).join("\n");

    // ── Review of Systems ─────────────────────────────────────────────────
    const rosLines = [];
    if (rosState && typeof rosState === "object") {
      Object.entries(rosState).forEach(([system, data]) => {
        if (!data) return;
        const pos = (data.positive || []).join(", ");
        const neg = (data.negative || []).join(", ");
        if (pos) rosLines.push(`  ${system} (+): ${pos}`);
        if (neg) rosLines.push(`  ${system} (-): ${neg}`);
        if (typeof data === "string" && data.trim())
          rosLines.push(`  ${system}: ${data.trim()}`);
      });
    }
    const rosSection = rosLines.length
      ? `Review of Systems:\n${rosLines.join("\n")}`
      : "";

    // ── Physical Exam ─────────────────────────────────────────────────────
    const peLines = [];
    if (peFindings && typeof peFindings === "object") {
      Object.entries(peFindings).forEach(([system, text]) => {
        if (text && typeof text === "string" && text.trim())
          peLines.push(`  ${system}: ${text.trim()}`);
      });
    }
    // Also check peState for abnormal findings
    if (peState && typeof peState === "object") {
      Object.entries(peState).forEach(([system, data]) => {
        if (!data || peLines.some(l => l.startsWith(`  ${system}`))) return;
        const abnormal = (data.findings || [])
          .filter(f => f.selected && !f.isNormal)
          .map(f => f.label);
        if (abnormal.length)
          peLines.push(`  ${system} (abnormal): ${abnormal.join(", ")}`);
      });
    }
    const peSection = peLines.length
      ? `Physical Exam:\n${peLines.join("\n")}`
      : "";

    // ── MDM / Assessment ──────────────────────────────────────────────────
    const mdmSection = mdmState?.narrative?.trim()
      ? `MDM/Assessment:\n${mdmState.narrative.slice(0, 800)}${mdmState.narrative.length > 800 ? "..." : ""}`
      : "";

    // ── Consults ──────────────────────────────────────────────────────────
    const consultList = (consults || [])
      .map(c => {
        const name = c.service || c.name || c.specialty || "";
        const status = c.status ? ` [${c.status}]` : "";
        return name ? `${name}${status}` : null;
      })
      .filter(Boolean);
    const consultsSection = consultList.length
      ? `Consults: ${consultList.join(", ")}`
      : "";

    // ── Disposition ───────────────────────────────────────────────────────
    const dispositionSection = disposition
      ? `Disposition: ${disposition}${dispReason ? " — " + dispReason : ""}${dispTime ? " at " + dispTime : ""}`
      : "";

    // ── SDOH ──────────────────────────────────────────────────────────────
    const sdohRisks = Object.entries(sdoh || {})
      .filter(([, v]) => v === 2 || v === "2" || v === "Unsafe / IPV concern"
        || v === "Insecure / hungry" || v === "Major barrier" || v === "Isolated")
      .map(([k]) => k);
    const sdohSection = sdohRisks.length
      ? `SDOH Risks: ${sdohRisks.join(", ")}`
      : "";

    // ── Sepsis bundle ─────────────────────────────────────────────────────
    const sepsisItems = Object.entries(sepsisBundle || {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    const sepsisSection = sepsisItems.length
      ? `Sepsis Bundle: ${sepsisItems.join(", ")}`
      : "";

    // ── Assemble sections object ──────────────────────────────────────────
    const sections = {
      demographics,
      chiefComplaint,
      vitals:       vitalsSection,
      medsAllergiesPmh,
      ros:          rosSection,
      pe:           peSection,
      mdm:          mdmSection,
      consults:     consultsSection,
      disposition:  dispositionSection,
      sdoh:         sdohSection,
      sepsis:       sepsisSection,
    };

    // ── Full summary string ───────────────────────────────────────────────
    const summary = Object.values(sections)
      .filter(Boolean)
      .join("\n\n");

    // ── hasContext ────────────────────────────────────────────────────────
    const hasContext = Boolean(
      cc?.text || demo?.age || demo?.firstName || vitalsSection || mdmSection
    );

    return { summary, hasContext, sections };

  }, [
    demo, cc, vitals, vitalsHistory, medications, allergies,
    pmhSelected, rosState, peState, peFindings,
    mdmState, consults, disposition, dispReason, dispTime,
    esiLevel, doorTime, providerName, registration, sdoh, sepsisBundle,
  ]);
}

export default useEncounterSummary;