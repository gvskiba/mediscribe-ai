import { useState, useRef, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { INITIAL_MDM_SCHEMA, buildInitialMDMPrompt, formatInitialMDMForCopy } from "@/pages/QuickNotePrompts";

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

export default function QuickNoteMDMHub({ cc, vitals, hpi, ros, exam, pmh, meds, allergies, onCCChange }) {
  const [initialMDMResult, setInitialMDMResult] = useState(null);
  const [initialMDMLoading, setInitialMDMLoading] = useState(false);
  const [copiedInitial, setCopiedInitial] = useState(false);
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

      {/* Section 2 — Final MDM placeholder */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#a8d4f0" }}>Section 2 — Final MDM</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: "rgba(200,223,240,0.4)", marginBottom: 10 }}>
          After results return · disposition reasoning · template pending
        </div>
        <div style={{
          background: "rgba(11,30,54,0.3)",
          border: "1px dashed rgba(0,184,154,0.15)",
          borderRadius: 8, padding: "20px 16px", textAlign: "center",
        }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(200,223,240,0.3)" }}>
            Final MDM template coming next session
          </span>
        </div>
      </div>
    </div>
  );
}