// SmartDifferential.jsx
// AI-powered differential diagnosis generator.
// Fires early in the encounter — embedded above InlineHPITab or as case "diff".
// Three-tier output: Must Not Miss / Most Likely / Consider Also.

import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

function buildContext(cc, demo, vitals, medications, pmhSelected, rosSymptoms) {
  const lines = [];

  if (demo?.age || demo?.sex)
    lines.push(`Patient: ${demo.age ? demo.age + "yo" : ""} ${demo.sex || ""}`.trim());

  if (cc?.text) lines.push(`Chief Complaint: ${cc.text}`);

  const vSeg = [];
  if (vitals?.hr)   vSeg.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vSeg.push(`BP ${vitals.bp}`);
  if (vitals?.rr)   vSeg.push(`RR ${vitals.rr}`);
  if (vitals?.spo2) vSeg.push(`SpO2 ${vitals.spo2}%`);
  if (vitals?.temp) vSeg.push(`T ${vitals.temp}`);
  if (vSeg.length)  lines.push(`Vitals: ${vSeg.join("  ")}`);

  const pmhArr = Array.isArray(pmhSelected)
    ? pmhSelected
    : Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);
  if (pmhArr.length) lines.push(`PMH: ${pmhArr.slice(0,8).join(", ")}`);

  const meds = (medications || [])
    .map(m => typeof m === "string" ? m : m.name || "")
    .filter(Boolean).slice(0, 6);
  if (meds.length) lines.push(`Medications: ${meds.join(", ")}`);

  try {
    const pos = [];
    if (Array.isArray(rosSymptoms)) {
      pos.push(...rosSymptoms.slice(0, 8));
    } else if (rosSymptoms && typeof rosSymptoms === "object") {
      Object.entries(rosSymptoms).forEach(([sys, data]) => {
        if (Array.isArray(data?.positive)) pos.push(...data.positive.map(d => `${sys}: ${d}`));
        else if (Array.isArray(data)) pos.push(...data.map(d => `${sys}: ${d}`));
      });
    }
    if (pos.length) lines.push(`ROS Positives: ${pos.slice(0, 8).join("; ")}`);
  } catch { /* ignore */ }

  return lines.join("\n");
}

const URGENCY = {
  immediate: { label:"Immediate", color:T.red,    bg:"rgba(255,68,68,0.12)",  icon:"🚨" },
  urgent:    { label:"Urgent",    color:T.orange,  bg:"rgba(255,159,67,0.1)", icon:"⚡" },
  monitor:   { label:"Monitor",   color:T.gold,    bg:"rgba(245,200,66,0.09)",icon:"👁" },
  consider:  { label:"Consider",  color:T.blue,    bg:"rgba(59,158,255,0.08)",icon:"🔍" },
};

function DxCard({ dx, tier, onSelect, selected }) {
  const [open, setOpen] = useState(tier === "must_not_miss");
  const u = URGENCY[dx.urgency] || URGENCY.consider;
  const isSelected = selected === dx.diagnosis;

  return (
    <div style={{
      border:`1px solid ${isSelected ? T.teal+"77" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`3px solid ${u.color}`,
      borderRadius:9, overflow:"hidden",
      background:isSelected ? "rgba(0,229,192,0.06)" : "rgba(8,22,40,0.65)",
      transition:"all .15s", marginBottom:6 }}>

      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"9px 12px", cursor:"pointer" }}
        onClick={() => setOpen(p => !p)}>

        <span style={{ fontSize:14, flexShrink:0 }}>{u.icon}</span>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13,
              color:isSelected ? T.teal : T.txt }}>
              {dx.diagnosis}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, fontWeight:700, letterSpacing:1,
              textTransform:"uppercase", padding:"1px 7px", borderRadius:4,
              background:u.bg, border:`1px solid ${u.color}40`, color:u.color }}>
              {u.label}
            </span>
            {dx.probability && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.txt4, letterSpacing:0.5 }}>
                {dx.probability} probability
              </span>
            )}
          </div>
          {!open && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:2,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {dx.rationale}
            </div>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
          {onSelect && (
            <button onClick={e => { e.stopPropagation(); onSelect(dx.diagnosis); }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:10, padding:"3px 9px", borderRadius:6,
                cursor:"pointer", transition:"all .12s",
                border:`1px solid ${isSelected ? T.teal+"66" : "rgba(0,229,192,0.35)"}`,
                background:isSelected ? "rgba(0,229,192,0.14)" : "rgba(0,229,192,0.06)",
                color:isSelected ? T.teal : T.txt4 }}>
              {isSelected ? "Working Dx" : "Set as Dx"}
            </button>
          )}
          <span style={{ color:T.txt4, fontSize:10 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding:"0 12px 10px",
          borderTop:"1px solid rgba(26,53,85,0.3)" }}>
          <div style={{ paddingTop:8 }}>
            {dx.rationale && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                color:T.txt2, lineHeight:1.65, marginBottom:8 }}>
                {dx.rationale}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {(dx.red_flags || dx.supporting || []).length > 0 && (
                <div style={{ padding:"7px 9px", borderRadius:7,
                  background:`${u.color}08`,
                  border:`1px solid ${u.color}25` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:u.color, letterSpacing:1,
                    textTransform:"uppercase", marginBottom:5 }}>
                    {tier === "must_not_miss" ? "Red Flags" : "Supporting Features"}
                  </div>
                  {(dx.red_flags || dx.supporting || []).map((f, i) => (
                    <div key={i} style={{ display:"flex", gap:5, marginBottom:2 }}>
                      <span style={{ color:u.color, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:10, color:T.txt3, lineHeight:1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {(dx.immediate_action || dx.key_workup || dx.differentiating) && (
                <div style={{ padding:"7px 9px", borderRadius:7,
                  background:"rgba(59,158,255,0.07)",
                  border:"1px solid rgba(59,158,255,0.22)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, color:T.blue, letterSpacing:1,
                    textTransform:"uppercase", marginBottom:5 }}>
                    {tier === "must_not_miss" ? "Immediate Action" :
                     tier === "most_likely"   ? "Key Workup" : "How to Distinguish"}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:10, color:T.txt3, lineHeight:1.6 }}>
                    {dx.immediate_action || dx.key_workup || dx.differentiating}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TierSection({ title, icon, color, items, tier, onSelect, selectedDx }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:14, color }}>
          {title}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",
          fontSize:9, color:T.txt4, letterSpacing:1,
          background:"rgba(42,79,122,0.2)",
          border:"1px solid rgba(42,79,122,0.3)",
          borderRadius:4, padding:"1px 6px" }}>
          {items.length}
        </span>
        <div style={{ flex:1, height:1,
          background:`linear-gradient(90deg,${color}44,transparent)` }} />
      </div>
      {items.map((dx, i) => (
        <DxCard key={i} dx={dx} tier={tier} onSelect={onSelect} selected={selectedDx} />
      ))}
    </div>
  );
}

function ContextStrip({ contextText, hasData }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10,
      background:"rgba(8,22,40,0.6)",
      border:`1px solid ${hasData ? "rgba(0,229,192,0.25)" : "rgba(42,79,122,0.3)"}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:hasData ? T.teal : T.txt4 }}>
          {hasData
            ? "Context auto-loaded from encounter"
            : "Limited context — add CC, vitals, and PMH for best results"}
        </div>
        <button onClick={() => setShow(p => !p)}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, background:"transparent", border:"none",
            cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
          {show ? "hide" : "view context"}
        </button>
      </div>
      {show && (
        <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.txt3, lineHeight:1.65, marginTop:7,
          whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {contextText || "No context available"}
        </pre>
      )}
    </div>
  );
}

export default function SmartDifferential({
  cc, demo, vitals, medications, pmhSelected,
  rosSymptoms, embedded = false,
  onToast, onSelectDx,
}) {
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [selectedDx, setSelectedDx] = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [extraCtx,   setExtraCtx]   = useState("");

  const contextText = useMemo(() =>
    buildContext(cc, demo, vitals, medications, pmhSelected, rosSymptoms),
    [cc, demo, vitals, medications, pmhSelected, rosSymptoms]
  );

  const hasData = Boolean(cc?.text || vitals?.hr || (Array.isArray(pmhSelected) ? pmhSelected.length : Object.keys(pmhSelected || {}).some(k => pmhSelected[k])));

  const handleGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fullContext = contextText
        + (extraCtx.trim() ? "\n\nAdditional context: " + extraCtx.trim() : "");

      const raw = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a senior emergency medicine physician generating a prioritized differential diagnosis. Be specific, clinically rigorous, and focus on diagnoses relevant to an emergency department setting.

Respond ONLY with valid JSON — no markdown fences, no preamble:
{
  "clinical_summary": "One concise sentence summarizing the presentation",
  "must_not_miss": [
    {
      "diagnosis": "Diagnosis name",
      "urgency": "immediate",
      "rationale": "Why this cannot be missed in this specific patient",
      "red_flags": ["specific feature 1", "specific feature 2"],
      "immediate_action": "Specific immediate action to take"
    }
  ],
  "most_likely": [
    {
      "diagnosis": "Diagnosis name",
      "urgency": "urgent",
      "probability": "high",
      "rationale": "Why this is most likely given the presentation",
      "supporting": ["feature 1", "feature 2"],
      "key_workup": "Specific key workup steps"
    }
  ],
  "consider_also": [
    {
      "diagnosis": "Diagnosis name",
      "urgency": "consider",
      "rationale": "Why to include on the differential",
      "differentiating": "Key test or finding that distinguishes this"
    }
  ],
  "immediate_orders": ["Specific order 1", "Specific order 2", "Specific order 3"]
}

Rules:
- must_not_miss: 2-4 diagnoses. Only truly life-threatening conditions that are plausible given this specific presentation.
- most_likely: 2-4 diagnoses. Highest probability given the data. Be specific to this patient.
- consider_also: 2-4 diagnoses. Reasonable alternatives worth keeping on the differential.
- immediate_orders: 3-6 specific actionable orders relevant to this presentation.
- urgency values: "immediate" for must_not_miss, "urgent" for most_likely, "monitor" for concerning-but-stable, "consider" for consider_also.

Generate emergency differential for:

${fullContext || "No specific context provided — generate a general approach"}`,
        response_json_schema: {
          type: "object",
          properties: {
            clinical_summary: { type: "string" },
            must_not_miss:    { type: "array", items: { type: "object" } },
            most_likely:      { type: "array", items: { type: "object" } },
            consider_also:    { type: "array", items: { type: "object" } },
            immediate_orders: { type: "array", items: { type: "string" } },
          }
        }
      });

      setResult(raw);
      onToast?.("Differential generated", "success");
    } catch (e) {
      setError("Error: " + (e.message || "Check connectivity"));
      onToast?.("Differential generation failed", "error");
    } finally {
      setBusy(false);
    }
  }, [contextText, extraCtx, onToast]);

  const handleSelect = useCallback((dx) => {
    setSelectedDx(p => p === dx ? null : dx);
    if (dx !== selectedDx) onSelectDx?.(dx);
    onToast?.(dx + " set as working diagnosis", "success");
  }, [selectedDx, onSelectDx, onToast]);

  const copyDiff = useCallback(() => {
    if (!result) return;
    const lines = [
      `DIFFERENTIAL DIAGNOSIS — ${new Date().toLocaleString()}`,
      `Presentation: ${result.clinical_summary || ""}`,
      "",
      "MUST NOT MISS:",
      ...(result.must_not_miss||[]).map(d => `  - ${d.diagnosis} — ${d.immediate_action||""}`),
      "",
      "MOST LIKELY:",
      ...(result.most_likely||[]).map(d => `  - ${d.diagnosis} (${d.probability||""} probability)`),
      "",
      "CONSIDER ALSO:",
      ...(result.consider_also||[]).map(d => `  - ${d.diagnosis}`),
      "",
      "IMMEDIATE ORDERS:",
      ...(result.immediate_orders||[]).map(o => `  - ${o}`),
    ].join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast?.("Differential copied", "success");
    });
  }, [result, onToast]);

  const totalDx = result
    ? (result.must_not_miss?.length||0) + (result.most_likely?.length||0) + (result.consider_also?.length||0)
    : 0;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        gap:10, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          {!embedded ? (
            <>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:17, color:T.purple }}>
                Smart Differential Generator
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, marginTop:1 }}>
                AI-prioritized · Must-not-miss flagged · Immediate actions
              </div>
            </>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:14, color:T.purple }}>
                Smart Differential
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                background:"rgba(155,109,255,0.1)",
                border:"1px solid rgba(155,109,255,0.25)",
                borderRadius:4, padding:"2px 7px" }}>AI · must-not-miss</span>
            </div>
          )}
        </div>

        {result && (
          <div style={{ display:"flex", gap:7 }}>
            <button onClick={copyDiff}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"5px 12px", borderRadius:7,
                cursor:"pointer", transition:"all .15s",
                border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                color:copied ? T.green : T.txt4 }}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => setResult(null)}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"5px 10px", borderRadius:7, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.35)",
                background:"transparent", color:T.txt4,
                letterSpacing:1, textTransform:"uppercase" }}>
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Context strip */}
      <ContextStrip contextText={contextText} hasData={hasData} />

      {/* Additional context */}
      {!result && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
            Additional Clinical Details (optional)
          </div>
          <textarea value={extraCtx} onChange={e => setExtraCtx(e.target.value)}
            rows={2}
            placeholder="e.g. sudden onset, worst headache of life, fever x3 days, recent travel..."
            style={{ width:"100%", resize:"vertical",
              background:"rgba(14,37,68,0.7)",
              border:`1px solid ${extraCtx ? "rgba(155,109,255,0.45)" : "rgba(42,79,122,0.3)"}`,
              borderRadius:8, padding:"8px 10px", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt, lineHeight:1.55 }} />
        </div>
      )}

      {/* Generate button */}
      {!result && (
        <button onClick={handleGenerate} disabled={busy}
          style={{ width:"100%", padding:"11px 0", borderRadius:10,
            cursor:busy ? "not-allowed" : "pointer",
            border:`1px solid ${busy ? "rgba(42,79,122,0.3)" : "rgba(155,109,255,0.55)"}`,
            background:busy
              ? "rgba(42,79,122,0.15)"
              : "linear-gradient(135deg,rgba(155,109,255,0.2),rgba(155,109,255,0.07))",
            color:busy ? T.txt4 : T.purple,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700,
            fontSize:13, marginBottom:14, transition:"all .15s" }}>
          {busy ? "Generating differential..." : "Generate Differential Diagnosis"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(255,107,107,0.08)",
          border:"1px solid rgba(255,107,107,0.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Summary bar */}
          <div style={{ padding:"9px 13px", borderRadius:9, marginBottom:14,
            background:"rgba(155,109,255,0.07)",
            border:"1px solid rgba(155,109,255,0.25)",
            display:"flex", alignItems:"center",
            justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt2, flex:1 }}>
              <strong style={{ color:T.purple }}>{totalDx} diagnoses</strong>
              {" — "}
              {result.clinical_summary}
            </div>
            {selectedDx && (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"3px 10px", borderRadius:20,
                background:"rgba(0,229,192,0.1)",
                border:"1px solid rgba(0,229,192,0.35)" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:T.teal, letterSpacing:0.5 }}>
                  Working Dx: {selectedDx}
                </span>
              </div>
            )}
          </div>

          {/* Immediate orders */}
          {result.immediate_orders?.length > 0 && (
            <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:14,
              background:"rgba(255,68,68,0.06)",
              border:"1px solid rgba(255,68,68,0.28)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.red, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
                Immediate Orders
              </div>
              {result.immediate_orders.map((o, i) => (
                <div key={i} style={{ display:"flex", gap:5,
                  alignItems:"flex-start", marginBottom:3 }}>
                  <span style={{ color:T.red, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2, lineHeight:1.55 }}>{o}</span>
                </div>
              ))}
            </div>
          )}

          <TierSection
            title="Must Not Miss" icon="🚨" color={T.red}
            items={result.must_not_miss} tier="must_not_miss"
            onSelect={handleSelect} selectedDx={selectedDx} />

          <TierSection
            title="Most Likely" icon="🎯" color={T.orange}
            items={result.most_likely} tier="most_likely"
            onSelect={handleSelect} selectedDx={selectedDx} />

          <TierSection
            title="Consider Also" icon="🔍" color={T.blue}
            items={result.consider_also} tier="consider_also"
            onSelect={handleSelect} selectedDx={selectedDx} />

          <div style={{ textAlign:"center", marginTop:10 }}>
            <button onClick={() => { setResult(null); setSelectedDx(null); }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"6px 18px", borderRadius:8,
                cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent", color:T.txt4 }}>
              New Differential
            </button>
          </div>
        </div>
      )}
    </div>
  );
}