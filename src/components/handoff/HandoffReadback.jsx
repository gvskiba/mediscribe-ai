import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/*
  HandoffReadback.jsx  -  Lakonyx
  The I-PASS synthesis / read-back upgrade that closes the loop on the SBAR generator.
*/

/* ----------------------------------------------------------------- module scope */

const QLOG_KEY = "lakonyx_boarding_quality_log";

const C = {
  bg0: "#08111f", bg1: "#0c1a2e",
  panel: "rgba(18, 34, 58, 0.55)", border: "rgba(120, 160, 205, 0.20)",
  borderStrong: "rgba(120, 160, 205, 0.38)",
  teal: "#2dd4bf", tealDim: "rgba(45, 212, 191, 0.14)",
  gold: "#e0b84c", goldDim: "rgba(224, 184, 76, 0.14)",
  txt: "#eaf1f9", txt2: "#aebfd4", txt3: "#8398b6",
  ok: "#34d399", okDim: "rgba(52, 211, 153, 0.14)",
  warn: "#f5b942", warnDim: "rgba(245, 185, 66, 0.14)",
  crit: "#f06363", critDim: "rgba(240, 99, 99, 0.16)",
};
const FONT_HEAD = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

const G = { check: "✓", up: "▲", warn: "⚠", open: "○", dash: "—", ellipsis: "…" };

const SEVERITY = ["Stable", "Watcher", "Unstable"];

const READBACK = [
  { id: "severity",    label: "Illness severity stated and acknowledged" },
  { id: "actions",     label: "Action list reviewed item by item" },
  { id: "contingency", label: "Contingency / if-then plans understood" },
  { id: "allergies",   label: "Allergies confirmed" },
  { id: "code",        label: "Code status confirmed" },
  { id: "pending",     label: "Pending critical results acknowledged" },
  { id: "highAlert",   label: "High-alert medications confirmed (read back doses)" },
];

const RECEIVER_ROLES = ["Hospitalist", "Intensivist", "Admitting resident", "APP", "Charge RN", "Other"];

const SEV_TONE = { Stable: "ok", Watcher: "warn", Unstable: "crit" };

/* ----------------------------------------------------------------- helpers */

async function appendQualityEvent(evt) {
  const record = { ts: Date.now(), ...evt };
  try {
    if (window.storage && typeof window.storage.get === "function") {
      let existing = [];
      try {
        const raw = await window.storage.get(QLOG_KEY);
        if (raw && raw.value) existing = JSON.parse(raw.value);
      } catch (e) { existing = []; }
      existing.push(record);
      await window.storage.set(QLOG_KEY, JSON.stringify(existing));
    }
  } catch (e) { /* non-fatal */ }
  return record;
}

function normalizeDraft(draft) {
  const d = draft || {};
  const actions = Array.isArray(d.actionList)
    ? d.actionList.map((a, i) => (typeof a === "string"
        ? { id: "a" + i, text: a, ack: false }
        : { id: "a" + i, text: a.text || "", ack: false }))
    : [];
  return {
    illnessSeverity: SEVERITY.includes(cap(d.illnessSeverity)) ? cap(d.illnessSeverity) : "Watcher",
    patientSummary: d.patientSummary || (d.levelOfCare ? "Admitted to " + d.levelOfCare + ". " : ""),
    actions,
    contingency: d.contingency || d.situationContingency || "",
    vteLine: d.vte ? ("VTE: " + (d.vte.recommendation || "")) : "",
    source: d.source || "ClinicalNoteStudio",
  };
}

function cap(s) {
  if (!s || typeof s !== "string") return s;
  const m = { stable: "Stable", watcher: "Watcher", unstable: "Unstable" };
  return m[s.toLowerCase()] || (s.charAt(0).toUpperCase() + s.slice(1));
}

/* ----------------------------------------------------------------- primitives */

function Panel({ title, accent, hint, children, style }) {
  return (
    <div style={{
      background: C.panel, border: "1px solid " + (accent || C.border), borderRadius: 14,
      padding: 16, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", ...style,
    }}>
      {title ? (
        <div style={{ marginBottom: hint ? 4 : 12 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 17, color: C.txt, letterSpacing: 0.2 }}>{title}</div>
          {hint ? <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt2, marginTop: 4 }}>{hint}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Pill({ children, tone }) {
  const map = {
    ok:   [C.ok,   C.okDim],
    warn: [C.warn, C.warnDim],
    crit: [C.crit, C.critDim],
    teal: [C.teal, C.tealDim],
    gold: [C.gold, C.goldDim],
    mute: [C.txt2, "rgba(174,191,212,0.10)"],
  };
  const [fg, bg] = map[tone] || map.mute;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO, fontSize: 12,
      color: fg, background: bg, border: "1px solid " + fg + "55", borderRadius: 999,
      padding: "3px 10px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Btn({ children, onClick, kind, disabled }) {
  const base = {
    fontFamily: FONT_BODY, fontSize: 14, borderRadius: 10, padding: "10px 16px",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    border: "1px solid " + C.borderStrong, transition: "transform 0.12s ease",
  };
  const kinds = {
    primary: { background: C.teal,  color: "#04141a", border: "1px solid " + C.teal, fontWeight: 600 },
    gold:    { background: C.gold,  color: "#1c1402", border: "1px solid " + C.gold, fontWeight: 600 },
    ghost:   { background: "transparent", color: C.txt },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className="lk-btn"
      style={{ ...base, ...(kinds[kind] || kinds.ghost) }}>
      {children}
    </button>
  );
}

function Check({ on, label, onToggle }) {
  const fg = on ? C.teal : C.txt2;
  return (
    <div role="checkbox" aria-checked={on} tabIndex={0} onClick={onToggle}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
        cursor: "pointer", userSelect: "none",
        background: on ? C.tealDim : "transparent",
        border: "1px solid " + (on ? fg + "66" : C.border),
      }}>
      <span aria-hidden="true" style={{
        width: 18, height: 18, flexShrink: 0, borderRadius: 5, border: "2px solid " + fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: fg, fontSize: 13, fontWeight: 700, lineHeight: 1,
      }}>{on ? G.check : ""}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: on ? C.txt : C.txt2 }}>{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.5, color: C.txt3, textTransform: "uppercase" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

/* ----------------------------------------------------------------- main */

export default function HandoffReadback({ draft = null, sbarText = "", embedded = false, onComplete = null }) {
  const incoming = useMemo(() => {
    if (draft) return draft;
    try { if (window.__lakonyxHandoffDraft) return window.__lakonyxHandoffDraft; } catch (e) {}
    return null;
  }, [draft]);

  const init = useMemo(() => normalizeDraft(incoming), [incoming]);

  const [severity,     setSeverity]     = useState(init.illnessSeverity);
  const [summary,      setSummary]      = useState(init.patientSummary);
  const [actions,      setActions]      = useState(init.actions);
  const [contingency,  setContingency]  = useState(init.contingency);
  const [actionDraft,  setActionDraft]  = useState("");

  const [confirms,     setConfirms]     = useState({});
  const [synthesis,    setSynthesis]    = useState("");
  const [receiverRole, setReceiverRole] = useState(RECEIVER_ROLES[0]);

  const [busy,    setBusy]    = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const [imported, setImported] = useState(false);

  const synthRef = useRef(null);
  const rootRef  = useRef(null);

  const allConfirmed   = READBACK.every((r) => confirms[r.id]);
  const synthOk        = synthesis.trim().length >= 12;
  const closedLoop     = allConfirmed && synthOk;
  const confirmedCount = READBACK.filter((r) => confirms[r.id]).length;

  const toggleConfirm = (id) => setConfirms((s) => ({ ...s, [id]: !s[id] }));

  const addAction = () => {
    const v = actionDraft.trim();
    if (!v) return;
    setActions((a) => [...a, { id: "a" + Date.now(), text: v, ack: false }]);
    setActionDraft("");
  };

  const importFromSbar = useCallback(async () => {
    if (!sbarText) return;
    setBusy(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "Restructure this SBAR handoff into I-PASS fields. Do not invent clinical facts; " +
          "only reorganize what is present. SBAR:\n\n" + sbarText,
        response_json_schema: {
          type: "object",
          properties: {
            illnessSeverity: { type: "string", enum: ["Stable", "Watcher", "Unstable"] },
            patientSummary:  { type: "string" },
            actionList:      { type: "array", items: { type: "string" } },
            contingency:     { type: "string" },
          },
          required: ["illnessSeverity", "patientSummary", "actionList", "contingency"],
        },
      });
      if (res) {
        if (SEVERITY.includes(res.illnessSeverity)) setSeverity(res.illnessSeverity);
        if (res.patientSummary) setSummary(res.patientSummary);
        if (Array.isArray(res.actionList)) {
          setActions(res.actionList.map((t, i) => ({ id: "i" + i, text: t, ack: false })));
        }
        if (res.contingency) setContingency(res.contingency);
        setImported(true);
      }
    } catch (e) { /* leave manual fields intact */ }
    setBusy(false);
  }, [sbarText]);

  const suggestSynthesis = useCallback(async () => {
    setBusy(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "Write a 2-3 sentence receiver read-back that restates this handoff plan in plain language, " +
          "as the receiving clinician would say it back. Illness severity: " + severity +
          ". Summary: " + summary + ". Actions: " + actions.map((a) => a.text).join("; ") +
          ". Contingency: " + contingency + ".",
        response_json_schema: {
          type: "object",
          properties: { synthesis: { type: "string" } },
          required: ["synthesis"],
        },
      });
      if (res && res.synthesis) setSynthesis(res.synthesis);
    } catch (e) { /* manual entry */ }
    setBusy(false);
  }, [severity, summary, actions, contingency]);

  const closeLoop = useCallback(async () => {
    if (!closedLoop) return;
    const completion = {
      type: "handoff",
      closedLoop: true,
      illnessSeverity: severity,
      actionItemsCount: actions.length,
      actionItemsAcked: actions.filter((a) => a.ack).length,
      readbackConfirmed: true,
      synthesisProvided: true,
      receiverRole,
      importedFromSbar: imported,
      source: init.source,
    };
    await appendQualityEvent(completion);
    try { window.__lakonyxHandoffComplete = { ts: Date.now(), closedLoop: true }; } catch (e) {}
    if (typeof onComplete === "function") onComplete(completion);
    setDoneMsg("Handoff closed-loop complete " + G.dash + " receiver synthesis recorded at " + new Date().toLocaleTimeString());
  }, [closedLoop, severity, actions, receiverRole, imported, init.source, onComplete]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "g" && synthRef.current) { e.preventDefault(); synthRef.current.focus(); }
      else if (e.key.toLowerCase() === "c") { closeLoop(); }
    };
    const node = rootRef.current || window;
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [closeLoop]);

  const sevTone = SEV_TONE[severity] || "warn";

  const shell = (
    <div ref={rootRef} tabIndex={-1} style={{ outline: "none", fontFamily: FONT_BODY, color: C.txt }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;600&display=swap');
        .lk-ta,.lk-in{background:rgba(255,255,255,0.04);border:1px solid ${C.border};color:${C.txt};
          font-family:${FONT_BODY};font-size:14px;border-radius:8px;padding:9px 11px;outline:none;width:100%;box-sizing:border-box;}
        .lk-ta:focus,.lk-in:focus,.lk-sel:focus{border-color:${C.teal};box-shadow:0 0 0 2px ${C.tealDim};}
        .lk-sel{background:rgba(255,255,255,0.04);border:1px solid ${C.border};color:${C.txt};
          font-family:${FONT_BODY};font-size:14px;border-radius:8px;padding:9px 11px;outline:none;}
        .lk-btn:hover{transform:translateY(-1px);}
        .lk-btn:focus-visible{outline:2px solid ${C.teal};outline-offset:2px;}
        @media (prefers-reduced-motion: reduce){ .lk-btn{transition:none!important;} .lk-bar{transition:none!important;} }
        .lk-bar{transition:width 0.3s ease;}
      `}</style>

      {!embedded ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 26, letterSpacing: 0.3 }}>I-PASS Handoff</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2, marginTop: 4 }}>
            Structured sign-out with receiver read-back. Source: {init.source}.
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 14 }}>
        {/* Giver side: I-PASS structure */}
        <Panel
          title="I-PASS sign-out"
          hint="Restructured from the SBAR draft. Edit as needed before read-back."
          accent={C.border}
        >
          {sbarText ? (
            <div style={{ marginBottom: 12 }}>
              <Btn kind="ghost" onClick={importFromSbar} disabled={busy}>
                {busy ? "Working" + G.ellipsis : imported ? "Re-import from SBAR" : "Import from SBAR draft"}
              </Btn>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <Field label={"I " + G.dash + " Illness severity"}>
                <select className="lk-sel" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Pill tone={sevTone}>
                {severity === "Unstable" ? G.up : severity === "Watcher" ? G.warn : G.check} {severity}
              </Pill>
            </div>

            <Field label={"P " + G.dash + " Patient summary"}>
              <textarea className="lk-ta" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}
                placeholder="One-liner, relevant course, working impression" />
            </Field>

            <Field label={"A " + G.dash + " Action list"}>
              <div style={{ display: "grid", gap: 7 }}>
                {actions.length === 0 ? (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt3 }}>No action items.</div>
                ) : actions.map((a) => (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
                    border: "1px solid " + (a.ack ? C.ok + "55" : C.border),
                    background: a.ack ? C.okDim : "rgba(255,255,255,0.03)",
                  }}>
                    <span aria-hidden="true" style={{ color: a.ack ? C.ok : C.txt3 }}>{a.ack ? G.check : G.open}</span>
                    <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: C.txt }}>{a.text}</span>
                    <Btn kind="ghost" onClick={() => setActions((arr) => arr.map((x) => x.id === a.id ? { ...x, ack: !x.ack } : x))}>
                      {a.ack ? "Acked" : "Ack"}
                    </Btn>
                    <Btn kind="ghost" onClick={() => setActions((arr) => arr.filter((x) => x.id !== a.id))}>Remove</Btn>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="lk-in" placeholder="Add action item, then Enter" value={actionDraft}
                    onChange={(e) => setActionDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addAction(); }} />
                  <Btn kind="primary" onClick={addAction}>Add</Btn>
                </div>
              </div>
            </Field>

            <Field label={"S " + G.dash + " Situational awareness & contingency"}>
              <textarea className="lk-ta" rows={2} value={contingency} onChange={(e) => setContingency(e.target.value)}
                placeholder="If-then planning: if X happens, do Y" />
            </Field>
          </div>
        </Panel>

        {/* Receiver side: read-back + synthesis */}
        <Panel
          title={"S " + G.dash + " Synthesis by receiver"}
          hint="The receiver confirms critical items and restates the plan. This is what closes the loop."
          accent={closedLoop ? C.ok : C.gold}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div className="lk-bar" style={{
                  width: Math.round((confirmedCount / READBACK.length) * 100) + "%",
                  height: "100%",
                  background: allConfirmed ? C.ok : C.gold,
                }} />
              </div>
            </div>
            <Pill tone={allConfirmed ? "ok" : "gold"}>{confirmedCount}/{READBACK.length} confirmed</Pill>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8, marginBottom: 14 }}>
            {READBACK.map((r) => (
              <Check key={r.id} on={!!confirms[r.id]} label={r.label} onToggle={() => toggleConfirm(r.id)} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            <Field label="Receiver role">
              <select className="lk-sel" value={receiverRole} onChange={(e) => setReceiverRole(e.target.value)}>
                {RECEIVER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Btn kind="ghost" onClick={suggestSynthesis} disabled={busy}>
              {busy ? "Working" + G.ellipsis : "Suggest synthesis (verify before confirming)"}
            </Btn>
          </div>

          <Field label="Receiver read-back (restate the plan in your own words)">
            <textarea ref={synthRef} className="lk-ta" rows={3} value={synthesis}
              onChange={(e) => setSynthesis(e.target.value)}
              placeholder="e.g. Stable floor admit, continue home meds plus enoxaparin, will chase blood cultures and repeat troponin; call me if SBP < 90 or new chest pain." />
          </Field>
          {!synthOk && synthesis.length > 0 ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.warn, marginTop: 6 }}>
              Read-back is too short to count as a synthesis.
            </div>
          ) : null}
        </Panel>

        {/* Close the loop */}
        <Panel accent={closedLoop ? C.ok : C.border}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Btn kind={closedLoop ? "primary" : "ghost"} onClick={closeLoop} disabled={!closedLoop}>
              Confirm handoff &mdash; close loop &nbsp;<span style={{ opacity: 0.6 }}>(c)</span>
            </Btn>
            {!closedLoop ? (
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2 }}>
                Confirm all {READBACK.length} read-back items and enter a synthesis to enable.
              </span>
            ) : null}
            {doneMsg ? (
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.ok, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true">{G.check}</span>{doneMsg}
              </span>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );

  if (embedded) return <div style={{ padding: 4 }}>{shell}</div>;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(1200px 600px at 20% -10%, " + C.bg1 + " 0%, " + C.bg0 + " 60%)",
      padding: "28px 22px",
    }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>{shell}</div>
    </div>
  );
}