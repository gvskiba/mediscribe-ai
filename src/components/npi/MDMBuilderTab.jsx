import { useState, useCallback } from "react";
import { computeEMLevel, EM_LEVEL_MAP, MDM_COPA_LEVELS, MDM_RISK_LEVELS, MDM_DATA_CATS, buildMDMNarrative, computeDataLevel } from "@/components/npi/npiData";

const FL = { fontSize: 10, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 };
const TA = { width: "100%", padding: "9px 12px", boxSizing: "border-box", background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.55)", borderRadius: 8, color: "var(--npi-txt)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.65, resize: "vertical", outline: "none" };

function showToast(setter, msg, type) {
  const id = Date.now() + Math.random();
  setter(p => [...p, { id, msg, type }]);
  setTimeout(() => setter(p => p.filter(t => t.id !== id)), 3000);
}

export default function MDMBuilderTab({
  demo = {}, cc = {}, vitals = {}, medications = [],
  pmhSelected = {}, consults = [],
  rosState = {}, peState = {}, peFindings = {},
  sdoh = {}, surgHx = "", allergies = [],
  mdmState, setMdmState,
  onAdvance,
}) {
  const [loading, setLoading] = useState(false);
  const [toasts,  setToasts]  = useState([]);

  const upd = (key, val) => setMdmState(p => ({ ...p, [key]: val }));

  const cat1Checked = mdmState.dataChecks?.cat1 || [];
  const cat2 = mdmState.dataChecks?.cat2 || false;
  const cat3 = mdmState.dataChecks?.cat3 || false;

  // Auto-compute data level from checkbox state
  const computedDataLevel = computeDataLevel(cat1Checked, cat2, cat3);
  if (computedDataLevel !== mdmState.dataLevel) {
    setMdmState(p => ({ ...p, dataLevel: computedDataLevel }));
  }

  const emRank  = computeEMLevel(mdmState.copa, mdmState.dataLevel, mdmState.risk);
  const emLevel = emRank ? EM_LEVEL_MAP[emRank] : null;

  const generateMDM = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).slice(0, 5).join(", ") || "none";
    const META_SKIP = ["_remainderNeg", "_remainderNormal", "_mode", "_visual"];
    const rosPos = Object.entries(rosState || {}).filter(([k, v]) => !META_SKIP.includes(k) && v === "has-positives").map(([k]) => k).join(", ") || "none";
    const peAbnLines = Object.entries(peState || {})
      .filter(([k, v]) => !META_SKIP.includes(k) && (v === "abnormal" || v === "mixed"))
      .map(([k]) => {
        const sf = peFindings?.[k];
        const findings = sf ? Object.entries(sf.findings || {}).filter(([, v]) => v === "abnormal").map(([f]) => f.replace(/-/g, " ")).join(", ") : "";
        return `${k}: ${findings || "abnormal"}`;
      }).join("; ") || "none";
    const sdohFlags = Object.entries(sdoh || {}).filter(([, v]) => v && v !== "unknown" && v !== false).map(([k]) => k).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: `Generate AMA 2023 MDM documentation for an ED encounter. Return ONLY valid JSON:
{"copa":"minimal|low|moderate|high","copaRationale":"...","risk":"minimal|low|moderate|high","riskRationale":"...","consideredNotOrdered":"..."}
- copa: complexity of problems addressed (minimal/low/moderate/high per AMA 2023)
- copaRationale: 1-2 sentence justification referencing specific findings
- risk: management risk level (minimal/low/moderate/high)
- riskRationale: 1-2 sentence justification with specific interventions
- consideredNotOrdered: tests or treatments considered but not ordered (optional)`,
          messages: [{ role: "user", content:
`Patient: ${[demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient"}, ${demo.age || "?"}y ${demo.sex || ""}
CC: ${cc.text || "unspecified"}
HPI: ${cc.hpi?.slice(0, 200) || "not documented"}
Vitals: BP ${vitals.bp || "—"} HR ${vitals.hr || "—"} SpO2 ${vitals.spo2 || "—"} T ${vitals.temp || "—"}
PMH: ${pmhList}
Surgical Hx: ${surgHx || "none"}
Meds: ${(medications || []).slice(0, 5).join(", ") || "none"}
Allergies: ${(allergies || []).join(", ") || "NKDA"}
ROS positives: ${rosPos}
PE abnormals: ${peAbnLines}${sdohFlags ? "\nSDOH factors: " + sdohFlags : ""}` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setMdmState(p => ({
        ...p,
        copa: parsed.copa || p.copa,
        copaRationale: parsed.copaRationale || p.copaRationale,
        risk: parsed.risk || p.risk,
        riskRationale: parsed.riskRationale || p.riskRationale,
        consideredNotOrdered: parsed.consideredNotOrdered || p.consideredNotOrdered || "",
      }));
      showToast(setToasts, "MDM domains generated", "success");
    } catch { showToast(setToasts, "MDM generation failed.", "error"); }
    finally  { setLoading(false); }
  }, [loading, demo, cc, vitals, pmhSelected, medications, allergies, rosState, peState, peFindings, surgHx, sdoh]);

  const buildNarrative = () => {
    const sdohFactors = Object.entries(sdoh || {}).filter(([, v]) => v && v !== "unknown" && v !== false).map(([k]) => k);
    const narrative = buildMDMNarrative({
      copa: mdmState.copa,
      copaRationale: mdmState.copaRationale,
      dataChecks: mdmState.dataChecks,
      dataLevel: mdmState.dataLevel,
      risk: mdmState.risk,
      riskRationale: mdmState.riskRationale,
      consideredNotOrdered: mdmState.consideredNotOrdered,
      sdohFactors,
    });
    setMdmState(p => ({ ...p, narrative }));
    showToast(setToasts, "Narrative built", "success");
  };

  const toggleCat1 = (key) => {
    const curr = cat1Checked.includes(key) ? cat1Checked.filter(k => k !== key) : [...cat1Checked, key];
    setMdmState(p => ({ ...p, dataChecks: { ...p.dataChecks, cat1: curr } }));
  };

  const cat1Items = MDM_DATA_CATS.filter(d => d.cat === 1);
  const cat2Item  = MDM_DATA_CATS.find(d => d.cat === 2 && d.key === "order_independent");
  const cat3Item  = MDM_DATA_CATS.find(d => d.cat === 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 60 }}>
      <style>{`.mdm-chip-btn{padding:7px 12px;borderRadius:8px;border:1px solid rgba(42,77,114,0.4);background:transparent;color:var(--npi-txt3);fontFamily:'DM Sans',sans-serif;fontSize:12;cursor:pointer;transition:all .14s;textAlign:left}`}</style>

      {/* E/M Estimate Banner */}
      {emLevel && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: `${emLevel.color}10`, border: `1px solid ${emLevel.color}30`, display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 900, color: emLevel.color }}>{emLevel.code}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--npi-txt3)", marginTop: 2 }}>{emLevel.label}</div>
          </div>
          <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--npi-txt4)", lineHeight: 1.5 }}>
            2-of-3 domain rule (AMA 2023). To support this code, document at least 2 of the 3 MDM domains below.
          </div>
        </div>
      )}

      {/* AI Generate */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={generateMDM} disabled={loading}
          style={{ padding: "7px 18px", borderRadius: 8, background: loading ? "transparent" : "rgba(0,229,192,.1)", border: "1px solid rgba(0,229,192,.3)", color: "var(--npi-teal)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {loading ? "⏳ Generating…" : "✦ AI Generate MDM"}
        </button>
      </div>

      {/* Domain 1 — COPA */}
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.5)" }}>
        <div style={FL}>Domain 1 — Number & Complexity of Problems Addressed (COPA)</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {MDM_COPA_LEVELS.map(l => (
            <button key={l.key} onClick={() => upd("copa", mdmState.copa === l.key ? "" : l.key)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${mdmState.copa === l.key ? l.color : "rgba(42,77,114,0.4)"}`, background: mdmState.copa === l.key ? l.color + "18" : "transparent", color: mdmState.copa === l.key ? l.color : "var(--npi-txt3)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", transition: "all .14s" }}>
              <div style={{ fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, maxWidth: 150, lineHeight: 1.3 }}>{l.desc}</div>
            </button>
          ))}
        </div>
        <div style={FL}>Rationale</div>
        <textarea value={mdmState.copaRationale || ""} onChange={e => upd("copaRationale", e.target.value)}
          placeholder="e.g., One new problem with additional workup — new-onset chest pain, hemodynamically stable, no prior cardiac history." rows={2} style={TA} />
      </div>

      {/* Domain 2 — Data */}
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.5)" }}>
        <div style={{ ...FL, marginBottom: 10 }}>Domain 2 — Amount & Complexity of Data Reviewed</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {cat1Items.map(item => (
            <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 10px", borderRadius: 7, background: cat1Checked.includes(item.key) ? "rgba(59,158,255,0.08)" : "transparent", border: `1px solid ${cat1Checked.includes(item.key) ? "rgba(59,158,255,0.25)" : "rgba(26,53,85,0.3)"}` }}>
              <input type="checkbox" checked={cat1Checked.includes(item.key)} onChange={() => toggleCat1(item.key)} style={{ accentColor: "#3b9eff" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--npi-txt3)" }}>{item.label}</span>
            </label>
          ))}
          {cat2Item && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 10px", borderRadius: 7, background: cat2 ? "rgba(59,158,255,0.08)" : "transparent", border: `1px solid ${cat2 ? "rgba(59,158,255,0.25)" : "rgba(26,53,85,0.3)"}` }}>
              <input type="checkbox" checked={cat2} onChange={e => setMdmState(p => ({ ...p, dataChecks: { ...p.dataChecks, cat2: e.target.checked } }))} style={{ accentColor: "#3b9eff" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--npi-txt3)" }}>{cat2Item.label}</span>
            </label>
          )}
          {cat3Item && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 10px", borderRadius: 7, background: cat3 ? "rgba(59,158,255,0.08)" : "transparent", border: `1px solid ${cat3 ? "rgba(59,158,255,0.25)" : "rgba(26,53,85,0.3)"}` }}>
              <input type="checkbox" checked={cat3} onChange={e => setMdmState(p => ({ ...p, dataChecks: { ...p.dataChecks, cat3: e.target.checked } }))} style={{ accentColor: "#3b9eff" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--npi-txt3)" }}>{cat3Item.label}</span>
            </label>
          )}
        </div>
        {computedDataLevel && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--npi-blue)", marginTop: 4 }}>
            Computed data complexity: <strong>{computedDataLevel}</strong>
          </div>
        )}
      </div>

      {/* Domain 3 — Risk */}
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.5)" }}>
        <div style={FL}>Domain 3 — Risk of Complications / Management</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {MDM_RISK_LEVELS.map(l => (
            <button key={l.key} onClick={() => upd("risk", mdmState.risk === l.key ? "" : l.key)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${mdmState.risk === l.key ? l.color : "rgba(42,77,114,0.4)"}`, background: mdmState.risk === l.key ? l.color + "18" : "transparent", color: mdmState.risk === l.key ? l.color : "var(--npi-txt3)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", transition: "all .14s" }}>
              <div style={{ fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, maxWidth: 150, lineHeight: 1.3 }}>{l.desc}</div>
            </button>
          ))}
        </div>
        <div style={FL}>Rationale</div>
        <textarea value={mdmState.riskRationale || ""} onChange={e => upd("riskRationale", e.target.value)}
          placeholder="e.g., Moderate risk — prescription anticoagulation, hospital admission required for monitoring." rows={2} style={TA} />
      </div>

      {/* Considered but not ordered */}
      <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.5)" }}>
        <div style={FL}>Tests / Treatments Considered But Not Ordered (optional)</div>
        <textarea value={mdmState.consideredNotOrdered || ""} onChange={e => upd("consideredNotOrdered", e.target.value)}
          placeholder="e.g., CT angiography considered — patient low-risk by PERC rule, deferred." rows={2} style={TA} />
      </div>

      {/* Build narrative */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={buildNarrative}
          style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(59,158,255,.12)", border: "1px solid rgba(59,158,255,.3)", color: "var(--npi-blue)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          📝 Build MDM Narrative
        </button>
        {onAdvance && (
          <button onClick={onAdvance}
            style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg,#00e5c0,#00b4d8)", border: "none", color: "#050f1e", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Continue ▶
          </button>
        )}
      </div>

      {/* Narrative preview */}
      {mdmState.narrative && (
        <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(8,22,40,0.6)", border: "1px solid rgba(26,53,85,0.4)" }}>
          <div style={FL}>MDM Narrative (editable)</div>
          <textarea value={mdmState.narrative} onChange={e => upd("narrative", e.target.value)}
            rows={8} style={{ ...TA, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.7 }} />
        </div>
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 6, zIndex: 300 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontFamily: "'DM Sans',sans-serif", background: "rgba(13,31,60,.95)", border: `1px solid ${t.type === "success" ? "rgba(0,229,192,.4)" : "rgba(255,107,107,.4)"}`, color: t.type === "success" ? "var(--npi-teal)" : "var(--npi-coral)" }}>
              {t.type === "success" ? "✓" : "✕"} {t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}