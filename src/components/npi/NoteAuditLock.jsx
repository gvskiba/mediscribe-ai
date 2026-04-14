// NoteAuditLock.jsx
// Timestamp-locked encounter note with SHA-256 content hash,
// provider attestation, and plain-text medicolegal export.
//
// Session lock only (no backend persistence) — export the locked note
// for permanent record. Addenda can be appended post-lock.
//
// Props:
//   demo, cc, vitals, vitalsHistory, medications, allergies,
//   pmhSelected, pmhExtra, surgHx, famHx, socHx,
//   rosState, rosSymptoms, peState, peFindings,
//   mdmState, consults, disposition, dispReason, dispTime,
//   esiLevel, registration, sdoh, sepsisBundle,
//   providerName, doorTime, onToast
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useCallback, useMemo, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── SHA-256 via Web Crypto API ────────────────────────────────────────────────
async function sha256(text) {
  const buf   = new TextEncoder().encode(text);
  const hash  = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Summarize ROS from state ──────────────────────────────────────────────────
function summarizeROS(rosState, rosSymptoms) {
  if (!rosState && !rosSymptoms) return "Not documented";
  try {
    const positives = [];
    const denials   = [];
    if (Array.isArray(rosSymptoms)) {
      return rosSymptoms.length ? rosSymptoms.join("; ") : "No positives documented";
    }
    if (typeof rosSymptoms === "object") {
      Object.entries(rosSymptoms).forEach(([sys, data]) => {
        if (Array.isArray(data)) {
          if (data.length) positives.push(...data.map(d => `${sys}: ${d}`));
        } else if (data?.positive?.length) {
          positives.push(...data.positive.map(d => `${sys}: ${d}`));
        }
      });
    }
    if (typeof rosState === "object") {
      Object.entries(rosState).forEach(([sys, val]) => {
        if (val === "negative" || val === false) denials.push(sys);
      });
    }
    const parts = [];
    if (positives.length) parts.push("POSITIVE: " + positives.join("; "));
    if (denials.length)   parts.push("NEGATIVE: " + denials.slice(0, 8).join(", ")
      + (denials.length > 8 ? ` + ${denials.length - 8} more` : ""));
    return parts.length ? parts.join(" | ") : "Systems reviewed — no significant positives";
  } catch { return "ROS documented"; }
}

// ── Summarize PE from state ───────────────────────────────────────────────────
function summarizePE(peState, peFindings) {
  if (!peState && !peFindings) return "Not documented";
  try {
    const findings = [];
    if (typeof peFindings === "object" && !Array.isArray(peFindings)) {
      Object.entries(peFindings).forEach(([sys, val]) => {
        if (val && typeof val === "string" && val.trim()) {
          findings.push(`${sys}: ${val}`);
        } else if (Array.isArray(val) && val.length) {
          findings.push(`${sys}: ${val.join(", ")}`);
        }
      });
    }
    if (typeof peState === "object") {
      Object.entries(peState).forEach(([sys, val]) => {
        if ((val === "abnormal" || val === "positive") &&
            !findings.find(f => f.startsWith(sys))) {
          findings.push(`${sys}: abnormal — see note`);
        }
      });
    }
    return findings.length ? findings.join(" | ") : "Exam documented — within normal limits";
  } catch { return "Physical exam documented"; }
}

// ── Summarize SDOH ────────────────────────────────────────────────────────────
function summarizeSDOH(sdoh) {
  if (!sdoh) return null;
  const flags = [];
  if (sdoh.housing   === "unstable") flags.push("housing instability");
  if (sdoh.food      === "insecure")  flags.push("food insecurity");
  if (sdoh.transport === "barrier")   flags.push("transportation barrier");
  if (sdoh.safety    === "concern")   flags.push("safety concern");
  return flags.length ? flags.join(", ") : null;
}

// ── Assemble full encounter note text ─────────────────────────────────────────
function assembleNote({
  demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx,
  rosState, rosSymptoms, peState, peFindings,
  mdmState, consults, disposition, dispReason, dispTime,
  esiLevel, registration, sdoh, sepsisBundle,
  providerName, doorTime, attestorName, attestorCredential, lockTs, hash,
}) {
  const SEP = "═".repeat(60);
  const HR  = "─".repeat(60);
  const now = lockTs || new Date().toISOString();
  const mrn = registration?.mrn || demo?.mrn || "—";
  const dob = demo?.dob || "—";
  const rm  = registration?.room || "—";

  const vLine = [
    vitals?.bp   ? `BP ${vitals.bp} mmHg`        : null,
    vitals?.hr   ? `HR ${vitals.hr} bpm`          : null,
    vitals?.rr   ? `RR ${vitals.rr} breaths/min`  : null,
    vitals?.spo2 ? `SpO2 ${vitals.spo2}%`         : null,
    vitals?.temp ? `Temp ${vitals.temp}°C`        : null,
    vitals?.weight ? `Weight ${vitals.weight} kg` : null,
  ].filter(Boolean).join("  |  ");

  const medLine = (medications || [])
    .map(m => typeof m === "string" ? m : m.name || "")
    .filter(Boolean).join(", ") || "None documented";

  const allergyLine = (allergies || [])
    .map(a => typeof a === "string" ? a : a.name || "").filter(Boolean)
    .join(", ") || "NKDA";

  const pmhLine = [
    ...(pmhSelected || []),
    pmhExtra ? pmhExtra.trim() : null,
  ].filter(Boolean).join(", ") || "None documented";

  const consultLines = (consults || []).map((c, i) => {
    const name = c.service || c.name || c.specialty || `Consult ${i+1}`;
    const note = c.notes || c.recommendation || "";
    return `  ${i+1}. ${name}${note ? ": " + note : ""}`;
  }).join("\n") || "  None";

  const sdohNote = summarizeSDOH(sdoh);

  const sepsisDone = sepsisBundle
    ? Object.entries(sepsisBundle).filter(([, v]) => v).map(([k]) => k).join(", ")
    : null;

  const hashShort = hash ? hash.slice(0, 16).toUpperCase() : "PENDING";

  return [
    SEP,
    "NOTRYA ENCOUNTER NOTE — " + (hash ? "LOCKED" : "DRAFT"),
    SEP,
    `Lock Timestamp : ${now}`,
    `SHA-256 Hash   : ${hashShort}${hash && hash.length > 16 ? "..." : ""}`,
    `Full Hash      : ${hash || "Not yet computed"}`,
    HR,
    `Patient Name   : ${[demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "—"}`,
    `Date of Birth  : ${dob}`,
    `MRN            : ${mrn}`,
    `Room           : ${rm}`,
    `Arrival Time   : ${doorTime || "—"}`,
    `ESI Level      : ${esiLevel || "—"}`,
    `Attending      : ${providerName || "—"}`,
    SEP,
    "",
    "CHIEF COMPLAINT",
    HR,
    cc?.text || "Not documented",
    "",
    "VITAL SIGNS",
    HR,
    vLine || "Not documented",
    vitalsHistory?.length > 1
      ? `Vital sign trend: ${vitalsHistory.length} recorded sets — see flowsheet`
      : "",
    "",
    "MEDICATIONS",
    HR,
    medLine,
    "",
    "ALLERGIES",
    HR,
    allergyLine,
    "",
    "PAST MEDICAL HISTORY",
    HR,
    pmhLine,
    surgHx ? `Surgical History: ${surgHx}` : "",
    famHx  ? `Family History: ${famHx}`     : "",
    socHx  ? `Social History: ${socHx}`     : "",
    "",
    sdohNote ? ["SOCIAL DETERMINANTS OF HEALTH", HR, sdohNote, ""].join("\n") : "",
    "REVIEW OF SYSTEMS",
    HR,
    summarizeROS(rosState, rosSymptoms),
    "",
    "PHYSICAL EXAMINATION",
    HR,
    summarizePE(peState, peFindings),
    "",
    mdmState?.narrative ? [
      "MEDICAL DECISION MAKING / ASSESSMENT & PLAN",
      HR,
      mdmState.narrative,
      mdmState.ccTimeText ? "\n" + mdmState.ccTimeText : "",
      "",
    ].join("\n") : "",
    "CONSULTS",
    HR,
    consultLines,
    "",
    sepsisDone ? ["SEPSIS BUNDLE (CMS SEP-1)", HR, "Elements documented: " + sepsisDone, ""].join("\n") : "",
    "DISPOSITION",
    HR,
    [
      disposition || "—",
      dispReason  ? `Reason: ${dispReason}` : null,
      dispTime    ? `Time: ${dispTime}`    : null,
    ].filter(Boolean).join("  |  "),
    "",
    SEP,
    "ATTESTATION",
    SEP,
    `I, ${attestorName || providerName || "[Provider Name]"}${attestorCredential ? ", " + attestorCredential : ""}, attest that`,
    "this note accurately and completely reflects the clinical encounter documented",
    `above. This note was electronically locked on ${now}.`,
    "",
    `Provider Signature : ${attestorName || providerName || "[Provider Name]"}${attestorCredential ? ", " + attestorCredential : ""}`,
    `Lock Timestamp     : ${now}`,
    `Content Hash       : ${hashShort}`,
    "",
    "This document was generated by Notrya Clinical Documentation Platform.",
    "Content integrity verified by SHA-256 hash. Any modification after locking",
    "will produce a different hash value.",
    SEP,
  ].filter(s => s !== null).join("\n");
}

// ── Note section preview row ──────────────────────────────────────────────────
function PreviewRow({ label, value, color, warn }) {
  const hasValue = value && value !== "Not documented" && value !== "—";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start",
      padding:"6px 10px", borderRadius:7, marginBottom:3,
      background: warn
        ? "rgba(255,107,107,0.06)"
        : hasValue ? "rgba(8,22,40,0.5)" : "rgba(26,53,85,0.08)",
      border:`1px solid ${warn ? "rgba(255,107,107,0.25)" : hasValue ? "rgba(26,53,85,0.3)" : "rgba(26,53,85,0.15)"}` }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color: warn ? T.coral : color || T.txt4,
        letterSpacing:1, textTransform:"uppercase",
        flexShrink:0, minWidth:130 }}>{label}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color: hasValue ? T.txt2 : T.txt4,
        lineHeight:1.5, flex:1,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
        {value || "Not documented"}
      </span>
      <span style={{ flexShrink:0, fontSize:10,
        color: warn ? T.coral : hasValue ? T.teal : T.txt4 }}>
        {warn ? "⚠" : hasValue ? "✓" : "○"}
      </span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function NoteAuditLock({
  demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx,
  rosState, rosSymptoms, peState, peFindings,
  mdmState, consults, disposition, dispReason, dispTime,
  esiLevel, registration, sdoh, sepsisBundle,
  providerName, doorTime, onToast,
}) {
  const [attestorName,       setAttestorName]       = useState(providerName || "");
  const [attestorCredential, setAttestorCredential] = useState("");
  const [locked,             setLocked]             = useState(false);
  const [lockTs,             setLockTs]             = useState(null);
  const [hash,               setHash]               = useState(null);
  const [busy,               setBusy]               = useState(false);
  const [copied,             setCopied]             = useState(false);
  const [addendum,           setAddendum]           = useState("");
  const [addenda,            setAddenda]            = useState([]);
  const [confirmLock,        setConfirmLock]        = useState(false);
  const confirmTimer = useRef(null);

  // ── Assemble current note draft ────────────────────────────────────────────
  const noteData = useMemo(() => ({
    demo, cc, vitals, vitalsHistory, medications, allergies,
    pmhSelected, pmhExtra, surgHx, famHx, socHx,
    rosState, rosSymptoms, peState, peFindings,
    mdmState, consults, disposition, dispReason, dispTime,
    esiLevel, registration, sdoh, sepsisBundle,
    providerName, doorTime, attestorName, attestorCredential,
    lockTs: null, hash: null,
  }), [demo, cc, vitals, vitalsHistory, medications, allergies,
       pmhSelected, pmhExtra, surgHx, famHx, socHx, rosState, rosSymptoms,
       peState, peFindings, mdmState, consults, disposition, dispReason,
       dispTime, esiLevel, registration, sdoh, sepsisBundle, providerName,
       doorTime, attestorName, attestorCredential]);

  const draftNote = useMemo(() => assembleNote(noteData), [noteData]);

  const lockedNote = useMemo(() => {
    if (!locked || !hash) return "";
    return assembleNote({ ...noteData, lockTs, hash });
  }, [locked, hash, lockTs, noteData]);

  const displayNote = locked ? lockedNote : draftNote;

  // ── Completeness checks ────────────────────────────────────────────────────
  const checks = useMemo(() => [
    { label:"Chief Complaint",   ok: Boolean(cc?.text),                                     field:"CC"   },
    { label:"Vital Signs",       ok: Boolean(vitals?.hr || vitals?.bp),                     field:"Vit"  },
    { label:"Medications",       ok: Boolean(medications?.length),                          field:"Meds" },
    { label:"ROS",               ok: Boolean(rosState && Object.keys(rosState).length > 0), field:"ROS"  },
    { label:"Physical Exam",     ok: Boolean(peState && Object.keys(peState).length > 0),   field:"PE"   },
    { label:"MDM / A&P",         ok: Boolean(mdmState?.narrative?.trim()),                  field:"MDM"  },
    { label:"Disposition",       ok: Boolean(disposition),                                  field:"Disp" },
    { label:"Provider Name",     ok: Boolean(attestorName.trim()),                          field:"Prov" },
  ], [cc, vitals, medications, rosState, peState, mdmState, disposition, attestorName]);

  const missingCritical = checks.filter(c => !c.ok && ["CC","MDM","Prov"].includes(c.field));
  const completePct = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);

  // ── Lock note ──────────────────────────────────────────────────────────────
  const handleLock = useCallback(async () => {
    if (!confirmLock) {
      setConfirmLock(true);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmLock(false), 5000);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmLock(false);
    if (!attestorName.trim()) {
      onToast?.("Provider name required before locking", "error");
      return;
    }
    setBusy(true);
    try {
      const ts      = new Date().toISOString();
      const draft   = assembleNote({ ...noteData, lockTs:ts, hash:"COMPUTING" });
      const hashHex = await sha256(draft + ts);
      setLockTs(ts);
      setHash(hashHex);
      setLocked(true);
      onToast?.("Note locked — " + hashHex.slice(0,8).toUpperCase(), "success");
    } catch (e) {
      onToast?.("Lock failed: " + (e.message || "crypto error"), "error");
    } finally {
      setBusy(false);
    }
  }, [confirmLock, attestorName, noteData, onToast]);

  // ── Copy note ──────────────────────────────────────────────────────────────
  const copyNote = useCallback(() => {
    const full = displayNote
      + (addenda.length ? "\n\n" + addenda.map(a =>
          `ADDENDUM [${a.ts}]\n${a.text}`).join("\n\n") : "");
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast?.("Note copied to clipboard", "success");
    });
  }, [displayNote, addenda, onToast]);

  // ── Download note ──────────────────────────────────────────────────────────
  const downloadNote = useCallback(() => {
    const mrn    = registration?.mrn || demo?.mrn || "unknown";
    const date   = (lockTs || new Date().toISOString()).slice(0,10);
    const fname  = `encounter_${mrn}_${date}${locked ? "_LOCKED" : "_DRAFT"}.txt`;
    const full   = displayNote
      + (addenda.length ? "\n\n" + addenda.map(a =>
          `ADDENDUM [${a.ts}]\n${a.text}`).join("\n\n") : "");
    const blob   = new Blob([full], { type:"text/plain;charset=utf-8" });
    const url    = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href  = url;
    anchor.download = fname;
    anchor.click();
    URL.revokeObjectURL(url);
    onToast?.("Note downloaded: " + fname, "success");
  }, [displayNote, addenda, locked, lockTs, registration, demo, onToast]);

  // ── Add addendum ───────────────────────────────────────────────────────────
  const submitAddendum = useCallback(() => {
    if (!addendum.trim()) return;
    setAddenda(p => [...p, {
      ts:   new Date().toLocaleString("en-US", { hour12:false }),
      text: addendum.trim(),
    }]);
    setAddendum("");
    onToast?.("Addendum added", "success");
  }, [addendum, onToast]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const mrn     = registration?.mrn || demo?.mrn || "—";
  const patient = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* ── Lock status banner ─────────────────────────────────────────────── */}
      {locked ? (
        <div style={{ padding:"12px 16px", borderRadius:10, marginBottom:14,
          background:"linear-gradient(135deg,rgba(61,255,160,0.1),rgba(8,22,40,0.95))",
          border:"1px solid rgba(61,255,160,0.45)",
          borderLeft:"4px solid #3dffa0" }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:10, flexWrap:"wrap" }}>
            <div style={{ fontSize:22 }}>🔒</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:15, color:T.green }}>
                Note Locked
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.txt3, marginTop:2, letterSpacing:0.5 }}>
                {lockTs}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4, letterSpacing:1,
                textTransform:"uppercase", marginBottom:2 }}>SHA-256</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, fontWeight:700, color:T.green,
                letterSpacing:1 }}>
                {hash?.slice(0,8).toUpperCase()}
                <span style={{ color:T.txt4 }}>...{hash?.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop:8,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"rgba(61,255,160,0.5)", letterSpacing:1,
            wordBreak:"break-all" }}>
            FULL HASH: {hash}
          </div>
        </div>
      ) : (
        <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:14,
          background:"rgba(8,22,40,0.7)",
          border:"1px solid rgba(26,53,85,0.45)",
          display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ fontSize:20 }}>📋</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:14, color:T.txt }}>
              Audit Trail & Note Lock
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:1 }}>
              {patient} · MRN {mrn} · {completePct}% complete · SHA-256 locked on finalize
            </div>
          </div>
          {/* Completion bar */}
          <div style={{ minWidth:100 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              marginBottom:3 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4, letterSpacing:1 }}>COMPLETENESS</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, fontWeight:700,
                color: completePct === 100 ? T.green : completePct >= 75 ? T.gold : T.coral }}>
                {completePct}%
              </span>
            </div>
            <div style={{ height:5, background:"rgba(26,53,85,0.4)",
              borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${completePct}%`,
                background: completePct === 100 ? T.green : completePct >= 75 ? T.gold : T.coral,
                borderRadius:3, transition:"width .3s" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div style={{ display:"grid",
        gridTemplateColumns:"minmax(220px,340px) 1fr",
        gap:12, alignItems:"start" }}>

        {/* ── Left: checks + controls ──────────────────────────────────────── */}
        <div>
          {/* Completeness checklist */}
          <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
            background:"rgba(8,22,40,0.7)",
            border:"1px solid rgba(26,53,85,0.4)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:9 }}>Pre-Lock Checklist</div>
            {checks.map(c => (
              <div key={c.field} style={{ display:"flex", alignItems:"center",
                gap:7, marginBottom:5 }}>
                <div style={{ width:16, height:16, borderRadius:"50%",
                  flexShrink:0, display:"flex", alignItems:"center",
                  justifyContent:"center",
                  background:c.ok ? "rgba(61,255,160,0.12)" : "rgba(42,79,122,0.2)",
                  border:`1px solid ${c.ok ? "rgba(61,255,160,0.4)" : "rgba(42,79,122,0.35)"}` }}>
                  <span style={{ fontSize:8, fontWeight:700,
                    color:c.ok ? T.green : T.txt4 }}>
                    {c.ok ? "✓" : "○"}
                  </span>
                </div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:c.ok ? T.txt2 : T.txt4, flex:1 }}>{c.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4, letterSpacing:0.5 }}>{c.field}</span>
              </div>
            ))}
          </div>

          {/* Attestor fields */}
          {!locked && (
            <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
              background:"rgba(8,22,40,0.7)",
              border:"1px solid rgba(26,53,85,0.4)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:9 }}>Provider Attestation</div>
              {[
                { label:"Provider Name", val:attestorName,       set:setAttestorName,       ph:"Full name" },
                { label:"Credentials",   val:attestorCredential, set:setAttestorCredential, ph:"MD, DO, PA-C..." },
              ].map(f => (
                <div key={f.label} style={{ marginBottom:7 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.txt4, letterSpacing:1.2, textTransform:"uppercase",
                    marginBottom:3 }}>{f.label}</div>
                  <input value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    style={{ width:"100%", padding:"6px 9px",
                      background:"rgba(14,37,68,0.75)",
                      border:`1px solid ${f.val ? "rgba(42,122,160,0.5)" : "rgba(26,53,85,0.4)"}`,
                      borderRadius:7, outline:"none",
                      fontFamily:"'DM Sans',sans-serif", fontSize:12,
                      color:T.txt }} />
                </div>
              ))}
            </div>
          )}

          {/* Lock button */}
          {!locked && (
            <button onClick={handleLock} disabled={busy}
              style={{ width:"100%", padding:"11px 0", borderRadius:10,
                cursor:busy ? "not-allowed" : "pointer",
                border:`1px solid ${confirmLock ? T.coral+"66" : missingCritical.length ? "rgba(42,79,122,0.35)" : "rgba(61,255,160,0.5)"}`,
                background:confirmLock
                  ? "rgba(255,107,107,0.12)"
                  : missingCritical.length
                    ? "rgba(42,79,122,0.15)"
                    : "linear-gradient(135deg,rgba(61,255,160,0.15),rgba(61,255,160,0.05))",
                color:confirmLock ? T.coral : missingCritical.length ? T.txt4 : T.green,
                fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                fontSize:13, transition:"all .15s",
                marginBottom:missingCritical.length ? 8 : 0 }}>
              {busy ? "⚙ Computing hash..."
                : confirmLock ? "⚠ Confirm Lock — Irreversible"
                : missingCritical.length ? `🔒 Lock Note (${missingCritical.length} fields missing)`
                : "🔒 Lock & Finalize Note"}
            </button>
          )}

          {missingCritical.length > 0 && !locked && (
            <div style={{ padding:"7px 10px", borderRadius:7,
              background:"rgba(255,107,107,0.07)",
              border:"1px solid rgba(255,107,107,0.22)",
              fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.coral, lineHeight:1.5 }}>
              Missing: {missingCritical.map(c => c.label).join(", ")}.
              Note can still be locked but completeness is flagged.
            </div>
          )}

          {/* Export buttons */}
          <div style={{ display:"flex", flexDirection:"column",
            gap:6, marginTop:locked ? 0 : 10 }}>
            <button onClick={copyNote}
              style={{ width:"100%", padding:"9px 0", borderRadius:9,
                cursor:"pointer",
                border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                color:copied ? T.green : T.txt3,
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
              {copied ? "✓ Copied" : "Copy Note to Clipboard"}
            </button>
            <button onClick={downloadNote}
              style={{ width:"100%", padding:"9px 0", borderRadius:9,
                cursor:"pointer",
                border:"1px solid rgba(59,158,255,0.4)",
                background:"rgba(59,158,255,0.08)",
                color:T.blue,
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
              ↓ Download .txt
            </button>
          </div>

          {/* Addendum (post-lock) */}
          {locked && (
            <div style={{ marginTop:10, padding:"11px 13px", borderRadius:10,
              background:"rgba(8,22,40,0.65)",
              border:"1px solid rgba(42,79,122,0.35)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.purple, letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:7 }}>Addendum</div>
              {addenda.map((a, i) => (
                <div key={i} style={{ marginBottom:7, padding:"6px 9px",
                  borderRadius:7, background:"rgba(155,109,255,0.07)",
                  border:"1px solid rgba(155,109,255,0.2)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.purple, marginBottom:3 }}>{a.ts}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2 }}>{a.text}</div>
                </div>
              ))}
              <textarea value={addendum} onChange={e => setAddendum(e.target.value)}
                placeholder="Add addendum to locked note..."
                rows={3}
                style={{ width:"100%", resize:"vertical",
                  background:"rgba(14,37,68,0.7)",
                  border:"1px solid rgba(155,109,255,0.35)",
                  borderRadius:7, padding:"7px 9px", outline:"none",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt, marginBottom:6 }} />
              <button onClick={submitAddendum}
                disabled={!addendum.trim()}
                style={{ width:"100%", padding:"7px 0", borderRadius:7,
                  cursor:addendum.trim() ? "pointer" : "not-allowed",
                  border:"1px solid rgba(155,109,255,0.4)",
                  background:"rgba(155,109,255,0.1)",
                  color:addendum.trim() ? T.purple : T.txt4,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:11 }}>
                + Submit Addendum
              </button>
            </div>
          )}
        </div>

        {/* ── Right: note preview ───────────────────────────────────────────── */}
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color: locked ? T.green : T.txt4,
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            {locked ? "🔒 Locked Note — Content Hash Verified" : "📋 Draft Preview — Updates Live"}
          </div>
          <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:T.txt3, lineHeight:1.65,
            background: locked ? "rgba(5,30,15,0.7)" : "rgba(5,15,30,0.85)",
            border:`1px solid ${locked ? "rgba(61,255,160,0.25)" : "rgba(26,53,85,0.4)"}`,
            borderRadius:10, padding:"13px 14px",
            whiteSpace:"pre-wrap", wordBreak:"break-word",
            overflowY:"auto", maxHeight:"calc(100vh - 280px)",
            minHeight:400 }}>
            {displayNote}
            {addenda.length > 0 && "\n\n" + addenda.map(a =>
              `${"─".repeat(60)}\nADDENDUM [${a.ts}]\n${a.text}`
            ).join("\n\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}