import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { INITIAL_MDM_SCHEMA, buildInitialMDMPrompt, formatInitialMDMForCopy, FINAL_MDM_SCHEMA, buildFinalMDMPrompt, formatFinalMDMForCopy } from "@/pages/QuickNotePrompts";

const MONO = "'JetBrains Mono',monospace";
const SERIF = "'Playfair Display',serif";
const SANS = "'DM Sans',sans-serif";

const CC_LIST = [
  "Abdominal pain","Altered mental status","Allergic reaction / anaphylaxis","Ankle injury",
  "Back pain","Chest pain","Chest tightness","Cough","Dizziness / vertigo",
  "Dyspnea / shortness of breath","DVT / leg swelling","Eye pain / redness","Facial pain",
  "Falls / trauma","Fever","Flank pain","Headache","Hemoptysis","Hypertensive urgency",
  "Hypoglycemia","Laceration / wound","Leg pain / swelling","Loss of consciousness / syncope",
  "Low back pain","Nausea / vomiting","Neck pain","Overdose / ingestion","Palpitations",
  "Pelvic pain","Rectal bleeding / hematochezia","Seizure / new onset","Shoulder pain",
  "Skin infection / cellulitis","Sore throat","Stroke / facial droop / weakness",
  "Suicidal ideation","Swelling / edema","Toothache","Upper GI bleed / hematemesis",
  "Urinary symptoms / UTI","Vaginal bleeding","Vision change","Wrist / hand pain",
];

// ─── PART 1: CCSearch ────────────────────────────────────────────────────────

function CCSearch({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const blurTimer = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  const filtered = query.length > 1
    ? CC_LIST.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const select = useCallback((item) => {
    setQuery(item);
    onChange(item);
    setOpen(false);
  }, [onChange]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
    setHighlightIdx(0);
  };

  const handleKeyDown = (e) => {
    if (!open || !filtered.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); select(filtered[highlightIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length > 1 && setOpen(true)}
        onBlur={handleBlur}
        placeholder="e.g. Chest pain"
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(11,30,54,0.7)",
          border: `1px solid ${open && filtered.length ? "#00e5c0" : "rgba(0,184,154,0.25)"}`,
          borderRadius: open && filtered.length ? "6px 6px 0 0" : "6px",
          color: "#c8dff0", fontFamily: MONO, fontSize: 12.5,
          padding: "8px 12px", outline: "none",
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "#0a1e38",
          border: "1px solid rgba(0,229,192,0.3)", borderTop: "none",
          borderRadius: "0 0 8px 8px", overflow: "hidden",
        }}>
          {filtered.map((item, i) => (
            <div
              key={item}
              onMouseDown={() => { clearTimeout(blurTimer.current); select(item); }}
              onMouseEnter={() => setHighlightIdx(i)}
              style={{
                padding: "8px 12px", cursor: "pointer", fontFamily: SANS, fontSize: 12.5,
                background: i === highlightIdx ? "rgba(0,229,192,0.1)" : "transparent",
                color: i === highlightIdx ? "#00e5c0" : "rgba(200,223,240,0.6)",
                borderLeft: i === highlightIdx ? "2px solid #00e5c0" : "2px solid transparent",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PART 2: InitialMDMDisplay ───────────────────────────────────────────────

function WorkupSubsection({ label, items, renderItem }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#a8d4f0" }}>{label}</span>
      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}

function BulletList({ items, bullet = "▸" }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 7 }}>
          <span style={{ color: "#00b89a", fontFamily: MONO, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{bullet}</span>
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(200,223,240,0.75)", lineHeight: 1.5 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function SectionDivider() {
  return <div style={{ borderTop: "1px solid rgba(0,184,154,0.1)", margin: "12px 0" }} />;
}

function SectionHeader({ title }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: "rgba(200,223,240,0.4)", letterSpacing: "0.09em", marginBottom: 8 }}>
      {title}
    </div>
  );
}

function InitialMDMDisplay({ result, onCopy, copied }) {
  if (!result) return null;

  return (
    <div style={{
      background: "rgba(11,30,54,0.55)",
      border: "1px solid rgba(0,184,154,0.18)",
      borderRadius: 10, padding: "18px 20px", marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: SERIF, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#00e5c0" }}>
          Initial MDM — Meditech Format
        </span>
        <button
          onClick={onCopy}
          style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.05em", padding: "4px 12px", borderRadius: 5, cursor: "pointer",
            border: `1px solid ${copied ? "rgba(0,229,192,0.5)" : "rgba(0,184,154,0.3)"}`,
            background: copied ? "rgba(0,229,192,0.1)" : "transparent",
            color: copied ? "#00e5c0" : "rgba(200,223,240,0.5)",
          }}
        >
          {copied ? "✓ Copied" : "Copy for Meditech"}
        </button>
      </div>

      {/* Clinical Presentation Summary */}
      <SectionHeader title="Clinical Presentation Summary" />
      <p style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0", lineHeight: 1.7, margin: 0 }}>
        {result.clinical_presentation_summary}
      </p>

      <SectionDivider />

      {/* Initial Differential */}
      <SectionHeader title="Initial Differential Diagnosis (in order of clinical concern)" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(result.initial_differential || []).map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#00b89a", minWidth: 18, flexShrink: 0 }}>{d.rank}.</span>
            <div>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#a8d4f0" }}>{d.diagnosis}</span>
              {d.reasoning && (
                <span style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "rgba(200,223,240,0.65)", marginLeft: 6 }}>— {d.reasoning}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Acute Threats */}
      <SectionHeader title="Acute Threats to Life Considered" />
      <BulletList items={result.acute_threats} bullet="▸" />

      <SectionDivider />

      {/* Risk Factors */}
      <SectionHeader title="Risk Factors Considered" />
      <BulletList items={result.risk_factors} bullet="–" />

      <SectionDivider />

      {/* Workup */}
      <SectionHeader title="Initial Workup Ordered & Rationale" />
      <WorkupSubsection
        label="Labs Ordered"
        items={result.workup?.labs}
        renderItem={(l, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#00b89a", fontFamily: MONO, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(200,223,240,0.75)" }}>
              <strong style={{ color: "#a8d4f0" }}>{l.test}</strong> — {l.rationale}
            </span>
          </div>
        )}
      />
      <WorkupSubsection
        label="Imaging Ordered"
        items={result.workup?.imaging}
        renderItem={(img, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#00b89a", fontFamily: MONO, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(200,223,240,0.75)" }}>
              <strong style={{ color: "#a8d4f0" }}>{img.study}</strong> — {img.rationale}
            </span>
          </div>
        )}
      />
      {result.workup?.ecg && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#a8d4f0" }}>ECG</span>
          <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, padding: "2px 8px", borderRadius: 4,
              border: `1px solid ${result.workup.ecg.ordered === "Yes" ? "rgba(0,229,192,0.4)" : "rgba(200,223,240,0.15)"}`,
              background: result.workup.ecg.ordered === "Yes" ? "rgba(0,229,192,0.08)" : "transparent",
              color: result.workup.ecg.ordered === "Yes" ? "#00e5c0" : "rgba(200,223,240,0.4)",
            }}>
              {result.workup.ecg.ordered}
            </span>
            {result.workup.ecg.rationale && (
              <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.6)" }}>{result.workup.ecg.rationale}</span>
            )}
          </div>
        </div>
      )}
      {result.workup?.other?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#a8d4f0" }}>Other</span>
          <div style={{ marginTop: 4 }}><BulletList items={result.workup.other} /></div>
        </div>
      )}

      {/* Decision Tools */}
      {result.decision_tools?.length > 0 && (
        <>
          <SectionDivider />
          <SectionHeader title="Decision Tools / Clinical Scores Applied" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.decision_tools.map((dt, i) => (
              <div key={i}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: "#f5c842" }}>{dt.tool}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "#00b89a" }}>{dt.result}</span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "rgba(200,223,240,0.6)", marginTop: 2 }}>
                  {dt.interpretation}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionDivider />

      {/* Clinical Reasoning */}
      <SectionHeader title="Initial Clinical Reasoning" />
      <p style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0", lineHeight: 1.7, margin: 0 }}>
        {result.initial_clinical_reasoning}
      </p>

      <SectionDivider />

      {/* Management */}
      <SectionHeader title="Initial Management Initiated" />
      <BulletList items={result.initial_management?.interventions} />
      {result.initial_management?.consultations?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#a8d4f0" }}>Consultations Requested</span>
          <div style={{ marginTop: 4 }}><BulletList items={result.initial_management.consultations} bullet="▸" /></div>
        </div>
      )}
      {result.initial_management?.reassessment_plan?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "#a8d4f0" }}>Reassessment Plan</span>
          <div style={{ marginTop: 4 }}><BulletList items={result.initial_management.reassessment_plan} bullet="▸" /></div>
        </div>
      )}
    </div>
  );
}

// ─── PART 3: QuickNoteMDMHub (default export) ────────────────────────────────

function FinalMDMDisplay({ result, onCopy, copied }) {
  if (!result) return null;

  const DISP_COLORS = { Discharge: "#00e5c0", Observation: "#7ec8f7", Admission: "#f5c842", Transfer: "#f5a623" };
  const COND_COLORS = { Improved: "#00b89a", Stable: "#7ec8f7", Unchanged: "#f5a623", Worsening: "#ff7a45", Critical: "#ff4d4f" };
  const MDM_COLORS = { Straightforward: "#00b89a", Minimal: "#00b89a", Low: "#7ec8f7", Moderate: "#f5c842", High: "#ff7a45" };

  const dispColor = DISP_COLORS[result.disposition?.decision] || "#a8d4f0";
  const condColor = COND_COLORS[result.disposition?.patient_condition] || "#a8d4f0";
  const overallColor = MDM_COLORS[result.mdm_complexity?.overall_level] || "#a8d4f0";

  return (
    <div style={{ background: "rgba(11,30,54,0.55)", border: "1px solid rgba(0,184,154,0.18)", borderRadius: 10, padding: "18px 20px", marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: SERIF, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#00e5c0" }}>Final MDM — Meditech Format</span>
        <button onClick={onCopy} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 12px", borderRadius: 5, cursor: "pointer", border: `1px solid ${copied ? "rgba(0,229,192,0.5)" : "rgba(0,184,154,0.3)"}`, background: copied ? "rgba(0,229,192,0.1)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.5)" }}>
          {copied ? "✓ Copied" : "Copy for Meditech"}
        </button>
      </div>

      {/* Results Reviewed */}
      <SectionHeader title="Results Reviewed" />

      {/* Labs */}
      {result.results_reviewed?.labs?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {result.results_reviewed.labs.map((lab, i) => {
            const isCrit = lab.is_critical;
            const valColor = isCrit ? "#ff4d4f" : lab.status === "Abnormal" ? "#f5c842" : lab.status === "Normal" ? "#00b89a" : "rgba(200,223,240,0.5)";
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 6px", marginBottom: 2, background: isCrit ? "rgba(255,77,79,0.06)" : "transparent", borderLeft: isCrit ? "2px solid #ff4d4f" : "2px solid transparent", borderRadius: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#a8d4f0", minWidth: 120, flexShrink: 0 }}>{isCrit ? "⚠ " : ""}{lab.test}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: valColor, minWidth: 60, flexShrink: 0 }}>{lab.value}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: valColor, border: `1px solid ${valColor}`, borderRadius: 3, padding: "1px 5px", flexShrink: 0, alignSelf: "center" }}>{lab.status}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.6)", lineHeight: 1.4 }}>{lab.interpretation}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Imaging */}
      {result.results_reviewed?.imaging?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {result.results_reviewed.imaging.map((img, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: "#a8d4f0" }}>{img.study}</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0", lineHeight: 1.5, marginTop: 2 }}>{img.findings}</div>
              {img.physician_review && <div style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: "rgba(200,223,240,0.45)", marginTop: 3, paddingLeft: 8 }}>{img.physician_review}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ECG */}
      {result.results_reviewed?.ecg && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: "rgba(200,223,240,0.4)", letterSpacing: "0.07em" }}>ECG</span>
          {result.results_reviewed.ecg.performed === false || result.results_reviewed.ecg.performed === "No" ? (
            <div style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "rgba(200,223,240,0.35)", marginTop: 4 }}>Not performed</div>
          ) : (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              {["rate","rhythm","intervals","st_t_changes","interpretation"].map(key => result.results_reviewed.ecg[key] && (
                <div key={key} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(200,223,240,0.4)", minWidth: 90, textTransform: "capitalize" }}>{key.replace(/_/g," ")}</span>
                  <span style={{ fontFamily: SANS, fontSize: 12.5, color: "#c8dff0" }}>{result.results_reviewed.ecg[key]}</span>
                </div>
              ))}
              {result.results_reviewed.ecg.attestation && <div style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: "rgba(200,223,240,0.45)", marginTop: 2 }}>{result.results_reviewed.ecg.attestation}</div>}
            </div>
          )}
        </div>
      )}

      {/* Prior records */}
      {result.results_reviewed?.prior_records?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <BulletList items={result.results_reviewed.prior_records} />
        </div>
      )}

      <SectionDivider />

      {/* Reassessment */}
      <SectionHeader title="Reassessment" />
      {result.reassessment?.working_diagnosis && (
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#f5c842", marginBottom: 8 }}>{result.reassessment.working_diagnosis}</div>
      )}
      {result.reassessment?.confirmed?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {result.reassessment.confirmed.map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#00b89a", flexShrink: 0 }}>✓</span>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#a8d4f0" }}>{d.diagnosis}</span>
              <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.6)", marginLeft: 4 }}>— supported by {d.supporting_data}</span>
            </div>
          ))}
        </div>
      )}
      {result.reassessment?.excluded?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {result.reassessment.excluded.map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(200,223,240,0.35)", flexShrink: 0 }}>✕</span>
              <span style={{ fontFamily: SANS, fontSize: 13, color: "rgba(200,223,240,0.45)", textDecoration: "line-through" }}>{d.diagnosis}</span>
              <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.45)", fontStyle: "italic", marginLeft: 4 }}>{d.exclusion_data}</span>
            </div>
          ))}
        </div>
      )}
      {result.reassessment?.uncertain?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {result.reassessment.uncertain.map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#f5a623", flexShrink: 0 }}>?</span>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#f5a623" }}>{d.diagnosis}</span>
              <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.55)", marginLeft: 4 }}>{d.unresolved} {d.further_plan}</span>
            </div>
          ))}
        </div>
      )}

      <SectionDivider />

      {/* Final Clinical Reasoning */}
      <SectionHeader title="Final Clinical Reasoning" />
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: "#c8dff0", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
        {result.final_clinical_reasoning}
      </p>

      <SectionDivider />

      {/* Final Management */}
      {(result.final_management?.treatments?.length > 0 || result.final_management?.consultations?.length > 0) && (
        <>
          <SectionHeader title="Final Management" />
          {result.final_management?.treatments?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {result.final_management.treatments.map((t, i) => (
                <div key={i} style={{ marginBottom: 5 }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: "#a8d4f0" }}>{t.intervention}</span>
                  {t.response && <span style={{ fontFamily: SANS, fontSize: 11, color: "rgba(200,223,240,0.5)", marginLeft: 6 }}>Response: {t.response}</span>}
                </div>
              ))}
            </div>
          )}
          {result.final_management?.consultations?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {result.final_management.consultations.map((c, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: "#a8d4f0" }}>{c.specialty}</span>
                  {c.recommendations && <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.65)", marginLeft: 6 }}>{c.recommendations}</span>}
                </div>
              ))}
            </div>
          )}
          <SectionDivider />
        </>
      )}

      {/* Disposition */}
      {result.disposition && (
        <>
          <SectionHeader title="Disposition" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ display: "inline-flex", fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", padding: "4px 14px", borderRadius: 5, border: `1px solid ${dispColor}`, color: dispColor }}>
              {result.disposition.decision}
            </span>
            {result.disposition.admit_location && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(200,223,240,0.5)" }}>{result.disposition.admit_location}</span>
            )}
            {result.disposition.patient_condition && (
              <span style={{ display: "inline-flex", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 3, border: `1px solid ${condColor}`, color: condColor }}>
                {result.disposition.patient_condition}
              </span>
            )}
          </div>
          {result.disposition.rationale && (
            <div style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0", marginTop: 4, marginBottom: 8 }}>{result.disposition.rationale}</div>
          )}
        </>
      )}

      {/* Discharge Plan */}
      {result.discharge_plan && (
        <>
          <SectionHeader title="Discharge Plan" />
          {result.discharge_plan.return_precautions?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {result.discharge_plan.return_precautions.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                  <span style={{ color: "#f5c842", fontFamily: MONO, fontSize: 11, flexShrink: 0 }}>▸</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: "#c8dff0" }}>{r}</span>
                </div>
              ))}
            </div>
          )}
          {result.discharge_plan.followup?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {result.discharge_plan.followup.map((f, i) => (
                <div key={i} style={{ fontFamily: SANS, fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: "#a8d4f0" }}>{f.provider}</span>
                  <span style={{ color: "rgba(200,223,240,0.65)" }}> — {f.timeframe}</span>
                </div>
              ))}
            </div>
          )}
          {result.discharge_plan.prescriptions?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {result.discharge_plan.prescriptions.map((rx, i) => (
                <div key={i} style={{ fontFamily: SANS, fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: "#a8d4f0" }}>{rx.medication}</span>
                  <span style={{ color: "rgba(200,223,240,0.6)" }}> — {rx.rationale}</span>
                </div>
              ))}
            </div>
          )}
          {result.discharge_plan.patient_understanding && (
            <div style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "rgba(200,223,240,0.45)", paddingTop: 8, borderTop: "1px solid rgba(0,184,154,0.08)", width: "100%", display: "block" }}>
              {result.discharge_plan.patient_understanding}
            </div>
          )}
          <SectionDivider />
        </>
      )}

      {/* MDM Complexity */}
      {result.mdm_complexity && (
        <>
          <SectionHeader title="MDM Complexity" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[
              { label: "Problems", val: result.mdm_complexity.problems },
              { label: "Data", val: result.mdm_complexity.data },
              { label: "Risk", val: result.mdm_complexity.risk },
              { label: "Overall", val: result.mdm_complexity.overall_level },
            ].map(({ label, val }) => {
              const c = MDM_COLORS[val] || "#a8d4f0";
              return (
                <div key={label} style={{ background: "rgba(11,30,54,0.4)", border: "1px solid rgba(0,184,154,0.1)", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: "rgba(200,223,240,0.4)", marginBottom: 4 }}>{label}</div>
                  <span style={{ display: "inline-block", fontFamily: MONO, fontSize: 11, fontWeight: 700, borderRadius: 3, padding: "2px 8px", border: `1px solid ${c}`, color: c }}>{val || "—"}</span>
                </div>
              );
            })}
          </div>
          {result.mdm_complexity.em_code && (
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#00e5c0", marginTop: 8 }}>{result.mdm_complexity.em_code}</div>
          )}
          {result.mdm_complexity.coding_note && (
            <div style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: "rgba(200,223,240,0.45)", marginTop: 4 }}>{result.mdm_complexity.coding_note}</div>
          )}
        </>
      )}

      {/* Attending Attestation */}
      {result.attending_attestation && (
        <div style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "rgba(200,223,240,0.4)", textAlign: "center", paddingTop: 10, borderTop: "1px solid rgba(0,184,154,0.08)", marginTop: 14 }}>
          "{result.attending_attestation}"
        </div>
      )}
    </div>
  );
}

export default function QuickNoteMDMHub({ cc, vitals, hpi, ros, exam, pmh, meds, allergies, onCCChange, labs, imaging, newVitals, labSummaryResult, finalImpressionResult, confirmedRanks }) {
  const [initialMDMResult, setInitialMDMResult] = useState(null);
  const [initialMDMLoading, setInitialMDMLoading] = useState(false);
  const [copiedInitial, setCopiedInitial] = useState(false);
  const [finalMDMResult, setFinalMDMResult] = useState(null);
  const [finalMDMLoading, setFinalMDMLoading] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const copyTimer = useRef(null);

  const canGenerate = !!(cc || hpi);

  const generateInitialMDM = useCallback(async () => {
    if (!canGenerate || initialMDMLoading) return;
    setInitialMDMLoading(true);
    const prompt = buildInitialMDMPrompt(cc, vitals, hpi, ros, exam, pmh, meds, allergies);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: INITIAL_MDM_SCHEMA,
      model: "claude_sonnet_4_6",
    });
    setInitialMDMResult(result);
    setInitialMDMLoading(false);
  }, [canGenerate, initialMDMLoading, cc, vitals, hpi, ros, exam, pmh, meds, allergies]);

  const generateFinalMDM = useCallback(async () => {
    setFinalMDMLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildFinalMDMPrompt(
          cc, vitals, hpi, ros, exam, pmh, meds, allergies,
          labs, imaging, newVitals,
          initialMDMResult, labSummaryResult,
          finalImpressionResult, confirmedRanks
        ),
        response_json_schema: FINAL_MDM_SCHEMA,
      });
      setFinalMDMResult(res);
    } catch (e) { console.error("Final MDM failed:", e); }
    finally { setFinalMDMLoading(false); }
  }, [cc, vitals, hpi, ros, exam, pmh, meds, allergies,
      labs, imaging, newVitals, initialMDMResult, labSummaryResult,
      finalImpressionResult, confirmedRanks]);

  const copyFinalMDM = useCallback(async () => {
    if (!finalMDMResult) return;
    await navigator.clipboard.writeText(formatFinalMDMForCopy(finalMDMResult));
    setCopiedFinal(true);
    setTimeout(() => setCopiedFinal(false), 2500);
  }, [finalMDMResult]);

  const copyInitialMDM = useCallback(() => {
    if (!initialMDMResult) return;
    const text = formatInitialMDMForCopy(initialMDMResult);
    navigator.clipboard.writeText(text);
    setCopiedInitial(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedInitial(false), 2500);
  }, [initialMDMResult]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  return (
    <div style={{
      background: "rgba(11,30,54,0.4)",
      border: "1px solid rgba(0,184,154,0.15)",
      borderRadius: 10, padding: "16px 18px",
    }}>
      {/* Header */}
      <div style={{ fontFamily: SERIF, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#00e5c0", marginBottom: 4 }}>
        Meditech MDM
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.45)", marginBottom: 16 }}>
        Generate Initial and Final MDM sections formatted for Meditech documentation.
      </div>

      {/* CC Search */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", color: "rgba(200,223,240,0.4)", letterSpacing: "0.07em", marginBottom: 5 }}>
          Chief Complaint
        </div>
        <CCSearch value={cc} onChange={onCCChange} />
      </div>

      <div style={{ borderTop: "1px solid rgba(0,184,154,0.1)", margin: "14px 0" }} />

      {/* Section 1 — Initial MDM */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#a8d4f0" }}>Section 1 — Initial MDM</span>
          <span style={{ fontFamily: SANS, fontSize: 11, color: "rgba(200,223,240,0.4)", flex: 1 }}>
            At time of initial evaluation · before results return
          </span>
          <button
            onClick={generateInitialMDM}
            disabled={!canGenerate || initialMDMLoading}
            style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.05em", padding: "5px 14px", borderRadius: 6, cursor: canGenerate && !initialMDMLoading ? "pointer" : "not-allowed",
              border: "1px solid rgba(0,229,192,0.4)", background: "rgba(0,229,192,0.08)", color: "#00e5c0",
              opacity: !canGenerate || initialMDMLoading ? 0.5 : 1,
            }}
          >
            {initialMDMLoading ? "Generating…" : "Generate Initial MDM"}
          </button>
        </div>

        {initialMDMLoading && (
          <div style={{ fontFamily: MONO, fontSize: 12, color: "#00b89a", padding: "8px 0" }}>
            Analyzing clinical data and generating MDM...
          </div>
        )}

        <InitialMDMDisplay
          result={initialMDMResult}
          onCopy={copyInitialMDM}
          copied={copiedInitial}
        />
      </div>

      <div style={{ borderTop: "1px solid rgba(0,184,154,0.1)", margin: "16px 0" }} />

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a8d4f0" }}>Section 2 — Final MDM</div>
            <div style={{ fontSize: 11, color: "rgba(200,223,240,0.4)", marginTop: 2 }}>After results return · disposition reasoning · MDM coding</div>
          </div>
          <button
            style={{ marginTop: 10, padding: "9px 20px", borderRadius: 6, cursor: finalMDMLoading ? "not-allowed" : "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid #00e5c0", background: "rgba(0,229,192,0.1)", color: "#00e5c0", opacity: finalMDMLoading ? 0.5 : 1 }}
            onClick={generateFinalMDM}
            disabled={finalMDMLoading || (!labs && !imaging)}
          >
            {finalMDMLoading ? "Generating..." : "Generate Final MDM"}
          </button>
        </div>
        {finalMDMLoading && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#00b89a", fontFamily: "'JetBrains Mono',monospace" }}>
            Synthesizing results and generating final MDM...
          </div>
        )}
        {finalMDMResult && <FinalMDMDisplay result={finalMDMResult} onCopy={copyFinalMDM} copied={copiedFinal} />}
      </div>
    </div>
  );
}