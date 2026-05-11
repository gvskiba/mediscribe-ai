// QuickNoteProgressDashboard — compact section completion summary strip
export default function QuickNoteProgressDashboard({
  cc, vitals, hpi, ros, exam,
  medsRaw, parsedMeds, parsedAllergies, allergiesRaw,
  labs, imaging, mdmResult, dispResult,
}) {
  const sections = [
    {
      label: "CC",
      done: Boolean(cc?.trim()),
      detail: cc?.trim() ? cc.slice(0, 28) + (cc.length > 28 ? "…" : "") : "missing",
    },
    {
      label: "Vitals",
      done: Boolean(vitals?.trim()),
      detail: vitals?.trim() ? "entered" : "missing",
    },
    {
      label: "HPI",
      done: Boolean(hpi?.trim() && hpi.trim().length >= 40),
      warn: Boolean(hpi?.trim() && hpi.trim().length < 40),
      detail: hpi?.trim()
        ? hpi.trim().length < 40 ? "too short" : `${hpi.trim().length} chars`
        : "missing",
    },
    {
      label: "ROS",
      done: Boolean(ros?.trim()),
      detail: ros?.trim() ? "entered" : "missing",
      optional: true,
    },
    {
      label: "Exam",
      done: Boolean(exam?.trim() && exam.trim().length >= 30),
      warn: Boolean(exam?.trim() && exam.trim().length < 30),
      detail: exam?.trim()
        ? exam.trim().length < 30 ? "too brief" : "entered"
        : "missing",
    },
    {
      label: "Meds",
      done: parsedMeds?.length > 0,
      warn: Boolean((medsRaw?.trim() || allergiesRaw?.trim()) && !parsedMeds?.length && !parsedAllergies?.length),
      detail: parsedMeds?.length
        ? `${parsedMeds.length} med${parsedMeds.length !== 1 ? "s" : ""}`
        : medsRaw?.trim() ? "not parsed" : "none entered",
      optional: true,
    },
    {
      label: "Allergies",
      done: parsedAllergies?.length > 0,
      detail: parsedAllergies?.length
        ? `${parsedAllergies.length} allerg${parsedAllergies.length !== 1 ? "ies" : "y"}`
        : allergiesRaw?.trim() ? "not parsed" : "none entered",
      optional: true,
    },
    {
      label: "MDM",
      done: Boolean(mdmResult),
      detail: mdmResult
        ? `${mdmResult.mdm_level || "done"} · ${mdmResult.working_diagnosis?.slice(0, 22) || ""}${(mdmResult.working_diagnosis?.length || 0) > 22 ? "…" : ""}`
        : "not generated",
    },
    {
      label: "Disposition",
      done: Boolean(dispResult),
      detail: dispResult ? (dispResult.disposition || "done") : "pending",
      optional: true,
    },
  ];

  const required = sections.filter(s => !s.optional);
  const doneCount = required.filter(s => s.done).length;
  const pct = Math.round((doneCount / required.length) * 100);
  const allDone = doneCount === required.length;
  const pending = sections.filter(s => !s.done && !s.warn && !s.optional);
  const warnings = sections.filter(s => s.warn);

  return (
    <div style={{
      marginBottom: 12,
      padding: "10px 14px",
      borderRadius: 10,
      background: "rgba(8,22,40,.55)",
      border: `1px solid ${allDone ? "rgba(61,255,160,.3)" : warnings.length ? "rgba(245,200,66,.25)" : "rgba(42,79,122,.35)"}`,
    }} className="no-print">
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
          color: allDone ? "var(--qn-green)" : "var(--qn-txt4)",
          letterSpacing: 1.2, textTransform: "uppercase",
        }}>
          {allDone ? "✓ Note Ready" : "Note Progress"}
        </span>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 4, background: "rgba(42,79,122,.35)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${pct}%`, transition: "width .4s ease",
            background: allDone
              ? "var(--qn-green)"
              : warnings.length
                ? "linear-gradient(90deg,var(--qn-teal),var(--qn-gold))"
                : "var(--qn-teal)",
          }} />
        </div>

        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
          color: allDone ? "var(--qn-green)" : "var(--qn-teal)",
        }}>{doneCount}/{required.length}</span>
      </div>

      {/* Section chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {sections.map(s => {
          const color = s.done
            ? "var(--qn-green)"
            : s.warn
              ? "var(--qn-gold)"
              : s.optional
                ? "var(--qn-txt4)"
                : "var(--qn-coral)";
          const bg = s.done
            ? "rgba(61,255,160,.07)"
            : s.warn
              ? "rgba(245,200,66,.07)"
              : s.optional
                ? "rgba(42,79,122,.2)"
                : "rgba(255,107,107,.07)";
          const border = s.done
            ? "rgba(61,255,160,.25)"
            : s.warn
              ? "rgba(245,200,66,.3)"
              : s.optional
                ? "rgba(42,79,122,.3)"
                : "rgba(255,107,107,.3)";
          const icon = s.done ? "✓" : s.warn ? "⚠" : s.optional ? "○" : "✗";

          return (
            <div key={s.label} title={`${s.label}: ${s.detail}`} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 5,
              background: bg, border: `1px solid ${border}`,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              color, letterSpacing: .3, cursor: "default",
              transition: "all .15s",
            }}>
              <span>{icon}</span>
              <span style={{ fontWeight: 700 }}>{s.label}</span>
              <span style={{ opacity: .65, fontWeight: 400, fontSize: 7 }}>{s.detail}</span>
            </div>
          );
        })}
      </div>

      {/* Pending summary line */}
      {(pending.length > 0 || warnings.length > 0) && (
        <div style={{
          marginTop: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 10,
          color: "var(--qn-txt4)", lineHeight: 1.5,
        }}>
          {warnings.length > 0 && (
            <span style={{ color: "var(--qn-gold)", marginRight: 10 }}>
              ⚠ {warnings.map(s => s.label).join(", ")} {warnings.length === 1 ? "needs" : "need"} more detail
            </span>
          )}
          {pending.length > 0 && (
            <span style={{ color: "rgba(255,107,107,.7)" }}>
              ✗ Pending: {pending.map(s => s.label).join(" · ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}