// useEncounterSummary.js
// Assembles a concise, structured clinical snapshot from encounter state and
// returns a buildPreamble() function that any AI call in the NPI workflow can
// prepend to its prompt.
//
// Usage:
//   import { useEncounterSummary } from "@/components/npi/useEncounterSummary";
//   const { buildPreamble } = useEncounterSummary(encounterState);
//   const prompt = buildPreamble() + "\n\n" + taskSpecificPrompt;
//
// Returned string is intentionally compact — aim for ~200 tokens maximum so it
// doesn't crowd out task-specific prompt content. Only clinically significant
// fields are included; empty values are silently omitted.
//
// acceptedOutputs — optional map of prior AI outputs the provider has accepted
// (not just generated — accepted). Keys match section IDs across the platform:
//   { hpi, mdm, assessment, pe, ros, discharge, handoff }
// Accepted outputs are included as one-line summaries so downstream calls know
// what was already decided, preventing contradictions.

import { useCallback, useMemo } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function flagVitals(vitals = {}) {
  const flags = [];
  const sbp = num((vitals.bp || "").split("/")[0]);
  const hr  = num(vitals.hr);
  const spo2 = num(vitals.spo2);
  const temp = num(vitals.temp);
  const rr   = num(vitals.rr);

  if (sbp !== null && sbp < 90)              flags.push(`hypotension (SBP ${sbp})`);
  if (sbp !== null && sbp > 180)             flags.push(`hypertension (SBP ${sbp})`);
  if (hr  !== null && hr  > 120)             flags.push(`tachycardia (HR ${hr})`);
  if (hr  !== null && hr  < 50)              flags.push(`bradycardia (HR ${hr})`);
  if (spo2 !== null && spo2 < 94)            flags.push(`hypoxia (SpO2 ${spo2}%)`);
  if (temp !== null && temp > 100.4)         flags.push(`fever (${temp}\u00b0F)`);
  if (temp !== null && temp < 96.8)          flags.push(`hypothermia (${temp}\u00b0F)`);
  if (rr  !== null && rr  >= 22)             flags.push(`tachypnea (RR ${rr})`);

  // Shock index
  if (hr !== null && sbp !== null && sbp > 0) {
    const si = hr / sbp;
    if (si >= 1.0) flags.push(`shock index ${si.toFixed(2)}`);
  }
  return flags;
}

function compactVitals(vitals = {}) {
  return [
    vitals.bp   && `BP ${vitals.bp}`,
    vitals.hr   && `HR ${vitals.hr}`,
    vitals.rr   && `RR ${vitals.rr}`,
    vitals.spo2 && `SpO2 ${vitals.spo2}%`,
    vitals.temp && `T ${vitals.temp}\u00b0F`,
  ].filter(Boolean).join("  ");
}

function rosPositives(rosState = {}) {
  const META = new Set(["_remainderNeg","_remainderNormal","_mode","_visual"]);
  return Object.entries(rosState)
    .filter(([k, v]) => !META.has(k) && v === "has-positives")
    .map(([k]) => k);
}

function peAbnormals(peState = {}, peFindings = {}) {
  const META = new Set(["_remainderNeg","_remainderNormal","_mode","_visual"]);
  return Object.entries(peState)
    .filter(([k, v]) => !META.has(k) && (v === "abnormal" || v === "mixed"))
    .map(([k]) => {
      const sf      = peFindings[k];
      const findings = sf
        ? Object.entries(sf.findings || {})
            .filter(([, v]) => v === "abnormal")
            .map(([f]) => f.replace(/-/g, " "))
            .join(", ")
        : "";
      const note = sf?.note?.trim() || "";
      return `${k}${findings ? ": " + findings : ""}${note ? " (" + note + ")" : ""}`;
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEncounterSummary({
  demo           = {},
  cc             = {},
  vitals         = {},
  medications    = [],
  allergies      = [],
  pmhSelected    = {},
  rosState       = {},
  peState        = {},
  peFindings     = {},
  sdoh           = {},
  disposition    = "",
  dispReason     = "",
  esiLevel       = "",
  registration   = {},
  providerName   = "",
  avpu           = "",
  acceptedOutputs = {},   // { hpi?, mdm?, assessment?, pe?, ros?, discharge?, handoff? }
} = {}) {

  // Derived values — recalculate only when inputs change
  const vitalFlags  = useMemo(() => flagVitals(vitals),             [vitals]);
  const vitalLine   = useMemo(() => compactVitals(vitals),          [vitals]);
  const rosPos      = useMemo(() => rosPositives(rosState),         [rosState]);
  const peAbn       = useMemo(() => peAbnormals(peState, peFindings),[peState, peFindings]);
  const pmhList     = useMemo(() =>
    Object.keys(pmhSelected).filter(k => pmhSelected[k]).slice(0, 6),
    [pmhSelected]
  );
  const medList     = useMemo(() =>
    (medications || [])
      .map(m => typeof m === "string" ? m : m.name || "")
      .filter(Boolean).slice(0, 6),
    [medications]
  );
  const allergyList = useMemo(() =>
    (allergies || [])
      .map(a => typeof a === "string" ? a : a.name || "")
      .filter(Boolean),
    [allergies]
  );
  const sdohFlags   = useMemo(() =>
    Object.entries(sdoh || {})
      .filter(([, v]) => v && v !== "unknown" && v !== false)
      .map(([k]) => k.replace(/_/g, " ")),
    [sdoh]
  );

  // ── buildPreamble ────────────────────────────────────────────────────────
  // Returns a compact plain-text block for prepending to any AI call prompt.
  // Omits empty fields so prompts stay lean regardless of encounter completeness.
  const buildPreamble = useCallback(() => {
    const lines = [];

    // ── Patient identity ──
    const patLine = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Unknown patient";
    const demoLine = [
      demo.age && `${demo.age}y`,
      demo.sex,
      registration.mrn && `MRN ${registration.mrn}`,
      registration.room && `Room ${registration.room}`,
    ].filter(Boolean).join(" \u00b7 ");

    lines.push(`PATIENT: ${patLine}${demoLine ? " | " + demoLine : ""}`);

    // ── Clinical context ──
    if (esiLevel)    lines.push(`ESI: ${esiLevel}`);
    if (cc.text)     lines.push(`CC: ${cc.text}`);
    if (cc.hpi?.trim()) lines.push(`HPI (brief): ${cc.hpi.slice(0, 200).trim()}${cc.hpi.length > 200 ? "..." : ""}`);

    // ── Vitals — always include if present, flag abnormals explicitly ──
    if (vitalLine) {
      lines.push(`VITALS: ${vitalLine}${avpu && avpu !== "Alert" ? `  AVPU: ${avpu}` : ""}`);
    }
    if (vitalFlags.length) {
      lines.push(`VITAL ALERTS: ${vitalFlags.join(", ")}`);
    }

    // ── Background ──
    if (pmhList.length)     lines.push(`PMH: ${pmhList.join(", ")}`);
    if (medList.length)     lines.push(`MEDS: ${medList.join(", ")}`);
    if (allergyList.length) lines.push(`ALLERGIES: ${allergyList.join(", ")}`);
    else                    lines.push("ALLERGIES: NKDA");

    // ── Findings — only pertinent positives ──
    if (rosPos.length) lines.push(`ROS POSITIVES: ${rosPos.join(", ")}`);
    if (peAbn.length)  lines.push(`PE ABNORMALS: ${peAbn.join("; ")}`);

    // ── Disposition ──
    if (disposition) {
      lines.push(`DISPOSITION: ${disposition}${dispReason ? " \u2014 " + dispReason : ""}`);
    }

    // ── SDOH (only if any positive screen) ──
    if (sdohFlags.length) lines.push(`SDOH SCREEN: ${sdohFlags.join(", ")}`);

    // ── Provider ──
    if (providerName) lines.push(`PROVIDER: ${providerName}`);

    // ── Prior accepted AI outputs — prevents contradictions ──
    // Only outputs the provider has explicitly accepted (not just generated)
    const ao = acceptedOutputs;
    const priorSections = [
      ao.assessment && `Assessment: ${ao.assessment.slice(0, 150).trim()}${ao.assessment.length > 150 ? "..." : ""}`,
      ao.mdm        && `MDM: ${ao.mdm.slice(0, 150).trim()}${ao.mdm.length > 150 ? "..." : ""}`,
      ao.hpi        && `HPI: ${ao.hpi.slice(0, 120).trim()}${ao.hpi.length > 120 ? "..." : ""}`,
      ao.disposition && `Discharge plan: ${ao.disposition.slice(0, 120).trim()}`,
    ].filter(Boolean);
    if (priorSections.length) {
      lines.push("PRIOR ACCEPTED AI OUTPUTS (do not contradict):");
      priorSections.forEach(s => lines.push(`  \u2014 ${s}`));
    }

    return lines.join("\n");
  }, [
    demo, cc, vitals, vitalLine, vitalFlags,
    pmhList, medList, allergyList, rosPos, peAbn,
    esiLevel, registration, avpu,
    disposition, dispReason, sdohFlags, providerName,
    acceptedOutputs,
  ]);

  // ── buildLabSummary ──────────────────────────────────────────────────────
  // Separate helper for ResultsViewer — builds a structured lab summary from
  // the entered lab values object with flag annotations. Available independently
  // so ResultsViewer can include it without building a full encounter preamble.
  const buildLabSummary = useCallback((labValues = {}, labPanels = []) => {
    const lines = labPanels.flatMap(p =>
      p.fields.filter(f => labValues[f.id]).map(f => {
        // Inline flag calculation — mirrors ResultsViewer's getFlag logic
        const n  = parseFloat(labValues[f.id]);
        let flag = "NORMAL";
        if (!isNaN(n)) {
          if ((f.clo !== null && n < f.clo) || (f.chi !== null && n > f.chi)) flag = "CRITICAL";
          else if ((f.lo !== null && n < f.lo) || (f.hi !== null && n > f.hi)) flag = "ABNORMAL";
        }
        return `${f.label}: ${labValues[f.id]}${f.unit ? " " + f.unit : ""} [${flag}]`;
      })
    );
    return lines.join("\n");
  }, []);

  return { buildPreamble, buildLabSummary };
}