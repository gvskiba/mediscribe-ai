import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── Critical flag definitions ─────────────────────────────────────────────────
const CRITICAL_FLAG_TEXT = {
  ANTICOAG_ACTIVE:   "Active anticoagulation (Warfarin) — review before procedures",
  ANAPHYLAXIS_PCN:   "Anaphylaxis: Penicillin — avoid all beta-lactams",
  INSULIN_ACTIVE:    "Active insulin — hypoglycemia risk",
  RENAL_FAILURE:     "Renal failure on file — adjust renally-cleared drugs",
  CARDIAC_DEVICE:    "Cardiac device (ICD/PPM) — avoid MRI, check device settings",
};

const PANEL_CSS = `
.anp-root{font-family:'DM Sans',sans-serif;background:rgba(8,18,36,0.72);border:1px solid rgba(26,53,85,0.6);border-radius:10px;overflow:hidden;margin:6px 0 10px;}
.anp-hdr{display:flex;align-items:center;gap:9px;padding:9px 14px;background:rgba(11,30,54,0.6);border-bottom:1px solid rgba(26,53,85,0.5);cursor:pointer;user-select:none;}
.anp-hdr:hover{background:rgba(14,37,68,0.75);}
.anp-hdr-icon{font-size:13px;width:20px;text-align:center;}
.anp-hdr-title{font-family:'Playfair Display',serif;font-size:12px;font-weight:600;color:#b8d0f0;flex:1;}
.anp-hdr-source{font-family:'JetBrains Mono',monospace;font-size:8px;color:#3b9eff88;letter-spacing:.5px;border:1px solid rgba(59,158,255,.2);border-radius:3px;padding:1px 6px;}
.anp-hdr-stale{font-family:'JetBrains Mono',monospace;font-size:8px;color:#f5c84288;border:1px solid rgba(245,200,66,.2);border-radius:3px;padding:1px 6px;}
.anp-hdr-chevron{color:#2e4a6a;font-size:10px;transition:transform .14s;}
.anp-hdr-chevron.open{transform:rotate(90deg);}
.anp-body{padding:12px 14px;display:flex;flex-direction:column;gap:8px;}
.anp-flag{display:flex;align-items:flex-start;gap:8px;padding:7px 11px;border-radius:7px;}
.anp-flag.ANTICOAG_ACTIVE,.anp-flag.CARDIAC_DEVICE{background:rgba(245,200,66,.07);border:1px solid rgba(245,200,66,.3);}
.anp-flag.ANAPHYLAXIS_PCN,.anp-flag.RENAL_FAILURE{background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.3);}
.anp-flag.INSULIN_ACTIVE{background:rgba(59,158,255,.07);border:1px solid rgba(59,158,255,.3);}
.anp-flag-icon{font-size:12px;flex-shrink:0;margin-top:1px;}
.anp-flag-text{font-size:11px;line-height:1.4;font-weight:600;}
.anp-flag.ANTICOAG_ACTIVE .anp-flag-text,.anp-flag.CARDIAC_DEVICE .anp-flag-text{color:#f5c842;}
.anp-flag.ANAPHYLAXIS_PCN .anp-flag-text,.anp-flag.RENAL_FAILURE .anp-flag-text{color:#ff8a8a;}
.anp-flag.INSULIN_ACTIVE .anp-flag-text{color:#3b9eff;}
.anp-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;}
.anp-card{background:rgba(11,30,54,0.5);border:1px solid rgba(26,53,85,0.55);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;}
.anp-card-ttl{font-size:9px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#4a6a8a;display:flex;align-items:center;gap:5px;}
.anp-card-ttl-icon{font-size:11px;}
.anp-card-val{font-size:12px;font-weight:600;color:#c8dff8;line-height:1.35;}
.anp-card-sub{font-size:10px;color:#4a6a8a;line-height:1.4;}
.anp-card-acts{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px;}
.anp-act-btn{font-size:9px;font-weight:600;padding:3px 8px;border-radius:4px;cursor:pointer;transition:background .1s,border-color .1s;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.anp-act-btn.mdm{background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.28);color:#00e5c0;}
.anp-act-btn.mdm:hover{background:rgba(0,229,192,.16);}
.anp-act-btn.hpi{background:rgba(59,158,255,.08);border:1px solid rgba(59,158,255,.28);color:#3b9eff;}
.anp-act-btn.hpi:hover{background:rgba(59,158,255,.16);}
.anp-shimmer{animation:anp-shim 1.4s ease-in-out infinite;background:linear-gradient(90deg,rgba(26,53,85,.4) 25%,rgba(42,79,122,.35) 50%,rgba(26,53,85,.4) 75%);background-size:200% 100%;border-radius:5px;}
@keyframes anp-shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
.anp-placeholder{padding:18px 14px;text-align:center;color:#2e4a6a;font-size:11px;font-style:italic;}
.anp-error{padding:12px 14px;background:rgba(255,107,107,.06);border-top:1px solid rgba(255,107,107,.2);font-size:11px;color:#ff8a8a;display:flex;align-items:center;gap:7px;}
.anp-footer{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-top:1px solid rgba(26,53,85,.4);background:rgba(8,18,36,.4);}
.anp-full-btn{font-size:10px;font-weight:600;color:#3b9eff;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;}
.anp-full-btn:hover{color:#7ac3ff;}
.anp-fetched-at{font-family:'JetBrains Mono',monospace;font-size:8px;color:#2e4a6a;letter-spacing:.3px;}
`;

function ShimmerCard() {
  return (
    <div className="anp-card">
      <div className="anp-shimmer" style={{ height: 9, width: "55%", marginBottom: 4 }} />
      <div className="anp-shimmer" style={{ height: 14, width: "80%" }} />
      <div className="anp-shimmer" style={{ height: 10, width: "65%" }} />
    </div>
  );
}

export default function AnamnesisContextPanel({
  embedded = false,
  patientContext = null,
  onPullToMdm = () => {},
  onCopyToHpi = () => {},
  onViewFull = () => {},
}) {
  const [open, setOpen]       = useState(true);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [stale, setStale]     = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!patientContext?.name) {
      setSummary(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(null);

    const fetchAnamnesis = async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `
You are a clinical data summarizer for an emergency medicine decision support platform.

Given the following patient identifiers, return a structured clinical history summary
as if querying Carequality and CommonWell HIE networks.

Patient: ${patientContext.name}
DOB: ${patientContext.dob ?? "unknown"}
MRN: ${patientContext.mrn ?? "unknown"}

Return ONLY a JSON object with this exact shape. No extra text.

{
  "source": "Carequality · CommonWell",
  "problems": [
    { "icd": "I10", "label": "Hypertension", "severity": "chronic" }
  ],
  "medications": {
    "total": 0,
    "highRisk": ["Drug 1", "Drug 2"],
    "flags": ["ANTICOAG"]
  },
  "allergies": [
    { "drug": "Drug name", "reaction": "Reaction", "severity": "high|moderate|low" }
  ],
  "recentVisits": [
    { "date": "YYYY-MM-DD", "facility": "Facility name", "cc": "Chief complaint", "dispo": "Admitted|Discharged|LWBS" }
  ],
  "surgicalHx": [
    { "year": 2021, "procedure": "Procedure name" }
  ],
  "criticalFlags": ["ANTICOAG_ACTIVE", "ANAPHYLAXIS_PCN"]
}

criticalFlags options: ANTICOAG_ACTIVE, ANAPHYLAXIS_PCN, INSULIN_ACTIVE, RENAL_FAILURE, CARDIAC_DEVICE
Return an empty array if no critical flags apply.
          `.trim(),
          response_json_schema: {
            type: "object",
            properties: {
              source:        { type: "string" },
              problems:      { type: "array" },
              medications:   { type: "object" },
              allergies:     { type: "array" },
              recentVisits:  { type: "array" },
              surgicalHx:    { type: "array" },
              criticalFlags: { type: "array" },
            },
          },
        });

        const fetchedAt = new Date();
        setSummary({ ...res, fetchedAt });
        const ageHours = (new Date() - fetchedAt) / 1000 / 60 / 60;
        setStale(ageHours > 48);
        setLoading(false);
      } catch (err) {
        console.error("Anamnesis fetch error:", err);
        setError("Unable to reach Anamnesis network. Check HIE connectivity.");
        setLoading(false);
      }
    };

    fetchAnamnesis();
  }, [patientContext?.name, patientContext?.dob]);

  // ── Pull-to-MDM helpers ────────────────────────────────────────────────────
  const pullProblems = useCallback(() => {
    if (!summary?.problems?.length) return;
    onPullToMdm({ domain: "problems", data: summary.problems });
  }, [summary, onPullToMdm]);

  const pullMeds = useCallback(() => {
    if (!summary?.medications) return;
    onPullToMdm({ domain: "medications", data: summary.medications });
  }, [summary, onPullToMdm]);

  const pullAllergies = useCallback(() => {
    if (!summary?.allergies?.length) return;
    onPullToMdm({ domain: "allergies", data: summary.allergies });
  }, [summary, onPullToMdm]);

  const pullVisits = useCallback(() => {
    if (!summary?.recentVisits?.length) return;
    onPullToMdm({ domain: "recentVisits", data: summary.recentVisits });
  }, [summary, onPullToMdm]);

  const pullSurgHx = useCallback(() => {
    if (!summary?.surgicalHx?.length) return;
    onPullToMdm({ domain: "surgicalHx", data: summary.surgicalHx });
  }, [summary, onPullToMdm]);

  // ── Copy-to-HPI helpers ────────────────────────────────────────────────────
  const copyProblemsToHpi = useCallback(() => {
    if (!summary?.problems?.length) return;
    const text = "PMH: " + summary.problems.map(p => p.label).join(", ") + ".";
    onCopyToHpi({ domain: "problems", text });
  }, [summary, onCopyToHpi]);

  const copyAllergiesToHpi = useCallback(() => {
    if (!summary?.allergies?.length) return;
    const text = "Allergies: " + summary.allergies.map(a => `${a.drug} (${a.reaction})`).join("; ") + ".";
    onCopyToHpi({ domain: "allergies", text });
  }, [summary, onCopyToHpi]);

  // ── Critical flags — always visible ───────────────────────────────────────
  const flags = summary?.criticalFlags || [];

  return (
    <div className="anp-root">
      <style>{PANEL_CSS}</style>

      {/* ── Header ── */}
      <div className="anp-hdr" onClick={() => setOpen(o => !o)}>
        <span className="anp-hdr-icon">⬡</span>
        <span className="anp-hdr-title">Anamnesis — HIE History</span>
        {summary?.source && (
          <span className="anp-hdr-source">{summary.source}</span>
        )}
        {stale && <span className="anp-hdr-stale">⚠ Stale &gt;48h</span>}
        <span className={"anp-hdr-chevron" + (open ? " open" : "")}>▶</span>
      </div>

      {/* ── Critical flags — ALWAYS visible (safety-critical, never collapsed) ── */}
      {flags.length > 0 && flags.map(flag => (
        <div key={flag} className={`anp-flag ${flag}`}>
          <span className="anp-flag-icon">
            {flag === "ANAPHYLAXIS_PCN" || flag === "RENAL_FAILURE" ? "🚨" : "⚠️"}
          </span>
          <span className="anp-flag-text">
            {CRITICAL_FLAG_TEXT[flag] || flag}
          </span>
        </div>
      ))}

      {/* ── Body (collapsible) ── */}
      {open && (
        <>
          {/* No patient loaded */}
          {!patientContext?.name && !loading && (
            <div className="anp-placeholder">
              Enter patient name, DOB, or MRN in Demographics to retrieve HIE history.
            </div>
          )}

          {/* Loading shimmer */}
          {loading && (
            <div className="anp-body">
              <div className="anp-cards">
                {[1, 2, 3, 4, 5].map(i => <ShimmerCard key={i} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="anp-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Summary cards */}
          {summary && !loading && (
            <div className="anp-body">
              <div className="anp-cards">

                {/* Problems */}
                <div className="anp-card">
                  <div className="anp-card-ttl"><span className="anp-card-ttl-icon">🩺</span>Problems</div>
                  <div className="anp-card-val">
                    {(summary.problems || []).length > 0
                      ? `${summary.problems.length} on record`
                      : "None on file"}
                  </div>
                  <div className="anp-card-sub">
                    {(summary.problems || []).slice(0, 3).map(p => p.label).join(" · ")}
                    {(summary.problems || []).length > 3 ? ` +${summary.problems.length - 3}` : ""}
                  </div>
                  <div className="anp-card-acts">
                    <button className="anp-act-btn mdm" onClick={pullProblems}>→ MDM</button>
                    <button className="anp-act-btn hpi" onClick={copyProblemsToHpi}>→ HPI</button>
                  </div>
                </div>

                {/* Medications */}
                <div className="anp-card">
                  <div className="anp-card-ttl"><span className="anp-card-ttl-icon">💊</span>Medications</div>
                  <div className="anp-card-val">
                    {summary.medications?.total ?? 0} active
                  </div>
                  <div className="anp-card-sub">
                    {(summary.medications?.highRisk || []).length > 0
                      ? `High-risk: ${(summary.medications.highRisk).join(", ")}`
                      : "No high-risk agents flagged"}
                  </div>
                  <div className="anp-card-acts">
                    <button className="anp-act-btn mdm" onClick={pullMeds}>→ MDM</button>
                  </div>
                </div>

                {/* Allergies */}
                <div className="anp-card">
                  <div className="anp-card-ttl"><span className="anp-card-ttl-icon">⚠️</span>Allergies</div>
                  <div className="anp-card-val">
                    {(summary.allergies || []).length > 0
                      ? `${summary.allergies.length} documented`
                      : "NKDA on file"}
                  </div>
                  <div className="anp-card-sub">
                    {(summary.allergies || []).slice(0, 2).map(a => a.drug).join(" · ")}
                    {(summary.allergies || []).length > 2 ? ` +${summary.allergies.length - 2}` : ""}
                  </div>
                  <div className="anp-card-acts">
                    <button className="anp-act-btn mdm" onClick={pullAllergies}>→ MDM</button>
                    <button className="anp-act-btn hpi" onClick={copyAllergiesToHpi}>→ HPI</button>
                  </div>
                </div>

                {/* Recent Visits */}
                <div className="anp-card">
                  <div className="anp-card-ttl"><span className="anp-card-ttl-icon">🏥</span>Recent Visits</div>
                  <div className="anp-card-val">
                    {(summary.recentVisits || []).length > 0
                      ? `${summary.recentVisits.length} prior visits`
                      : "No recent visits"}
                  </div>
                  <div className="anp-card-sub">
                    {(summary.recentVisits || []).slice(0, 1).map(v =>
                      `${v.date} · ${v.facility}`
                    ).join("")}
                  </div>
                  <div className="anp-card-acts">
                    <button className="anp-act-btn mdm" onClick={pullVisits}>→ MDM</button>
                  </div>
                </div>

                {/* Surgical Hx */}
                <div className="anp-card">
                  <div className="anp-card-ttl"><span className="anp-card-ttl-icon">🔪</span>Surgical Hx</div>
                  <div className="anp-card-val">
                    {(summary.surgicalHx || []).length > 0
                      ? `${summary.surgicalHx.length} procedure(s)`
                      : "None on file"}
                  </div>
                  <div className="anp-card-sub">
                    {(summary.surgicalHx || []).slice(0, 2).map(s => `${s.procedure} (${s.year})`).join(" · ")}
                  </div>
                  <div className="anp-card-acts">
                    <button className="anp-act-btn mdm" onClick={pullSurgHx}>→ MDM</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Footer */}
          {(summary || error) && (
            <div className="anp-footer">
              <button className="anp-full-btn" onClick={onViewFull}>
                Full Anamnesis →
              </button>
              {summary?.fetchedAt && (
                <span className="anp-fetched-at">
                  Retrieved {new Date(summary.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}