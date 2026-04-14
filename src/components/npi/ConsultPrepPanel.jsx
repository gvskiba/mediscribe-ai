// ConsultPrepPanel.jsx
// Embedded consult preparation panel for NPI encounter flow.
// Renders above ConsultTab — inline pre-call checklist + AI coach
// pre-populated from live patient data.
//
// Props:
//   demo, cc, vitals, medications, pmhSelected  — patient data from NPI state
//   consults                                     — existing consults on encounter
//   onToast(msg, type)                           — toast bridge (no sonner)
//   selectedSpecialty   string|null              — lifted to NewPatientInput
//   onSpecialtyChange   (id) => void             — lifts state to parent
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   finally { setBusy(false) }, single react import, border before borderTop

import { useState, useEffect, useRef, useCallback } from "react";
import { CONSULT_SPECIALTIES, CONSULT_CATS, buildConsultScenario } from "@/components/npi/consultData";

// ── Design tokens (mirrors T in npiStyles) ───────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
  red:"#ff4444", rose:"#f472b6",
};

// ── Urgency color helper ─────────────────────────────────────────────────────
function urgColor(u) {
  if (!u) return T.blue;
  if (u.includes("Immediate")) return T.coral;
  if (u.includes("30 min"))    return T.orange;
  if (u.includes("Urgent"))    return T.gold;
  return T.blue;
}

// ── Small primitives ─────────────────────────────────────────────────────────
function Bullet({ text, color }) {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
      <span style={{ color:color||T.teal, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function SectionBadge({ label, color }) {
  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      color, letterSpacing:1.5, textTransform:"uppercase",
      marginBottom:6, paddingBottom:4,
      borderBottom:`1px solid ${color}28` }}>
      {label}
    </div>
  );
}

function CollapseBtn({ open, onToggle, label, accent }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
        padding:"10px 14px",
        background: open
          ? `linear-gradient(135deg,${accent}12,rgba(8,22,40,0.9))`
          : "rgba(8,22,40,0.6)",
        border:"1px solid rgba(26,53,85,0.5)",
        borderRadius: open ? "10px 10px 0 0" : 10,
        cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13,
        fontWeight:700, color:open ? accent : T.txt3, flex:1 }}>{label}</span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:open ? accent : T.txt4, letterSpacing:1 }}>
        {open ? "▲ COLLAPSE" : "▼ EXPAND"}
      </span>
    </button>
  );
}

// ── SpecialtyPicker ──────────────────────────────────────────────────────────
function SpecialtyPicker({ selectedId, onChange }) {
  const [cat, setCat] = useState("all");
  const filtered = CONSULT_SPECIALTIES.filter(
    sp => cat === "all" || sp.cat === cat
  );

  return (
    <div style={{ padding:"12px 14px",
      background:"rgba(8,22,40,0.7)",
      border:"1px solid rgba(26,53,85,0.45)",
      borderRadius:10, marginBottom:8 }}>

      {/* Header */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:8 }}>Select Specialty</div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
        {CONSULT_CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              fontWeight:700, padding:"2px 9px", borderRadius:20,
              cursor:"pointer", textTransform:"uppercase", letterSpacing:1,
              transition:"all .12s",
              border:`1px solid ${cat===c.id?c.color+"88":c.color+"33"}`,
              background:cat===c.id?`${c.color}20`:"transparent",
              color:cat===c.id?c.color:T.txt4 }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Specialty pills */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {filtered.map(sp => {
          const active = selectedId === sp.id;
          return (
            <button key={sp.id} onClick={() => onChange(sp.id)}
              style={{ display:"flex", alignItems:"center", gap:5,
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                padding:"4px 11px", borderRadius:20, cursor:"pointer",
                transition:"all .12s",
                border:`1px solid ${active?sp.color+"88":sp.color+"30"}`,
                background:active?`${sp.color}22`:`${sp.color}08`,
                color:active?sp.color:T.txt4 }}>
              <span style={{ fontSize:13 }}>{sp.icon}</span>
              {sp.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Pre-call checklist ───────────────────────────────────────────────────────
function PreCallChecklist({ sp }) {
  if (!sp) return null;
  return (
    <div style={{ padding:"14px 14px 10px",
      background:"rgba(8,22,40,0.65)",
      border:"1px solid rgba(26,53,85,0.45)",
      borderTop:"none", borderRadius:"0 0 10px 10px",
      marginBottom:8 }}>

      {/* Hook line */}
      <div style={{ padding:"7px 11px", borderRadius:7, marginBottom:12,
        background:`${sp.color}0d`, border:`1px solid ${sp.color}28` }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:sp.color, letterSpacing:1, textTransform:"uppercase" }}>
          {sp.icon} CALL HOOK: </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt2, fontStyle:"italic" }}>{sp.hook}</span>
      </div>

      {/* 6-section 2-col grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        {sp.sections.map((sec, i) => (
          <div key={i} style={{ padding:"9px 10px",
            background:`${sec.col}0a`, border:`1px solid ${sec.col}25`,
            borderRadius:8 }}>
            <SectionBadge label={sec.label} color={sec.col} />
            {sec.items.map((item, j) => (
              <Bullet key={j} text={item} color={sec.col} />
            ))}
          </div>
        ))}
      </div>

      {/* Pearl */}
      <div style={{ padding:"8px 11px",
        background:`${T.gold}0a`, border:`1px solid ${T.gold}25`,
        borderRadius:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
          💎 Pearl: </span>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt2, lineHeight:1.6 }}>{sp.pearl}</span>
      </div>
    </div>
  );
}

// ── AI Coach panel ───────────────────────────────────────────────────────────
function AICoachPanel({ sp, scenario, setScenario, coaching, coachResult, coachErr, onGenerate, onRetry }) {
  if (!sp) return null;

  const urg = coachResult?.urgency;
  const uc  = urgColor(urg);

  return (
    <div style={{ padding:"14px 14px 10px",
      background:"rgba(8,22,40,0.65)",
      border:"1px solid rgba(26,53,85,0.45)",
      borderTop:"none", borderRadius:"0 0 10px 10px",
      marginBottom:8 }}>

      {/* Info strip */}
      <div style={{ padding:"8px 11px", borderRadius:7, marginBottom:10,
        background:"rgba(155,109,255,0.07)",
        border:"1px solid rgba(155,109,255,0.22)" }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt2 }}>
          <strong style={{ color:T.purple }}>AI Consult Coach</strong>
          {" — "}patient context auto-loaded from this encounter. Edit below, then generate your pre-call script.
        </span>
      </div>

      {/* Scenario textarea */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
          Clinical Context
        </div>
        <textarea
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          rows={4}
          style={{ width:"100%", resize:"vertical",
            background:"rgba(14,37,68,0.7)",
            border:`1px solid ${scenario ? "rgba(155,109,255,0.4)" : "rgba(42,79,122,0.3)"}`,
            borderRadius:8, padding:"9px 11px", outline:"none",
            fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt2, lineHeight:1.65 }} />
      </div>

      {/* Generate button */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        <button onClick={onGenerate}
          disabled={coaching || !scenario.trim()}
          style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
            padding:"8px 22px", borderRadius:10, cursor: coaching||!scenario.trim() ? "not-allowed" : "pointer",
            border:`1px solid ${!scenario.trim() ? "rgba(42,79,122,0.3)" : "rgba(155,109,255,0.55)"}`,
            background:!scenario.trim()
              ? "rgba(42,79,122,0.15)"
              : "linear-gradient(135deg,rgba(155,109,255,0.22),rgba(155,109,255,0.08))",
            color:!scenario.trim() ? T.txt4 : T.purple,
            transition:"all .15s" }}>
          {coaching
            ? <span>⚙ Generating...</span>
            : <span>🤖 Generate {sp.name} Script</span>}
        </button>
      </div>

      {/* Error */}
      {coachErr && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(255,107,107,0.09)",
          border:"1px solid rgba(255,107,107,0.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.coral }}>
          {coachErr}
        </div>
      )}

      {/* Loading state */}
      {coaching && (
        <div style={{ padding:"22px", textAlign:"center",
          background:"rgba(155,109,255,0.05)",
          border:"1px solid rgba(155,109,255,0.15)", borderRadius:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt3 }}>
            Building your {sp.name} pre-call brief...
          </div>
        </div>
      )}

      {/* Results */}
      {coachResult && !coaching && (
        <div>
          {/* Urgency badge */}
          {urg && (
            <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:8,
              background:`${uc}09`, border:`1px solid ${uc}38` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1, textTransform:"uppercase" }}>
                Urgency: </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                fontWeight:700, color:uc }}>{urg}</span>
            </div>
          )}

          {/* Opening statement */}
          {coachResult.opening && (
            <div style={{ padding:"11px 13px", borderRadius:8, marginBottom:8,
              background:"rgba(155,109,255,0.07)",
              border:"1px solid rgba(155,109,255,0.28)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.purple, letterSpacing:2, textTransform:"uppercase",
                marginBottom:6 }}>📞 Opening Statement</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                color:T.txt, lineHeight:1.75, fontStyle:"italic" }}>
                "{coachResult.opening}"
              </div>
            </div>
          )}

          {/* Lead with */}
          {coachResult.leadWith?.length > 0 && (
            <div style={{ padding:"11px 13px", borderRadius:8, marginBottom:8,
              background:"rgba(0,229,192,0.05)",
              border:"1px solid rgba(0,229,192,0.22)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.teal, letterSpacing:2, textTransform:"uppercase",
                marginBottom:8 }}>Lead With — In This Order</div>
              {coachResult.leadWith.map((f, i) => (
                <div key={i} style={{ display:"flex", gap:8,
                  alignItems:"flex-start", marginBottom:5 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                    fontWeight:700, color:T.teal, flexShrink:0, minWidth:16 }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:T.txt2, lineHeight:1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Q&A */}
          {coachResult.anticipatedQA?.length > 0 && (
            <div style={{ padding:"11px 13px", borderRadius:8, marginBottom:8,
              background:"rgba(245,200,66,0.05)",
              border:"1px solid rgba(245,200,66,0.2)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.gold, letterSpacing:2, textTransform:"uppercase",
                marginBottom:8 }}>Anticipated Questions</div>
              {coachResult.anticipatedQA.map((qa, i) => (
                <div key={i} style={{ marginBottom:i < coachResult.anticipatedQA.length-1 ? 9 : 0,
                  padding:"7px 10px", background:"rgba(42,79,122,0.12)",
                  borderRadius:7 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:700, color:T.gold, marginBottom:3 }}>{qa.q}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.txt2, lineHeight:1.5 }}>
                    <span style={{ color:T.txt4, fontWeight:700 }}>→ </span>{qa.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ask + Pushback */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {coachResult.ask && (
              <div style={{ padding:"10px 12px", borderRadius:8,
                background:"rgba(61,255,160,0.05)",
                border:"1px solid rgba(61,255,160,0.22)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.green, letterSpacing:2, textTransform:"uppercase",
                  marginBottom:7 }}>How to Frame the Ask</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.txt, lineHeight:1.65, fontStyle:"italic" }}>
                  "{coachResult.ask}"
                </div>
              </div>
            )}
            {coachResult.pushback?.length > 0 && (
              <div style={{ padding:"10px 12px", borderRadius:8,
                background:"rgba(255,107,107,0.05)",
                border:"1px solid rgba(255,107,107,0.22)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.coral, letterSpacing:2, textTransform:"uppercase",
                  marginBottom:7 }}>Handling Pushback</div>
                {coachResult.pushback.map((pb, i) => (
                  <div key={i} style={{ marginBottom: i < coachResult.pushback.length-1 ? 7 : 0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      fontWeight:700, color:T.coral, marginBottom:2 }}>{pb.concern}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:T.txt2, lineHeight:1.5 }}>→ {pb.response}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insider tip */}
          {coachResult.insider && (
            <div style={{ padding:"8px 12px", borderRadius:8,
              background:`${T.gold}08`, border:`1px solid ${T.gold}22` }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.gold, letterSpacing:1, textTransform:"uppercase" }}>
                💎 Insider Tip: </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt2 }}>{coachResult.insider}</span>
            </div>
          )}

          {/* Re-generate */}
          <div style={{ textAlign:"right", marginTop:10 }}>
            <button onClick={onRetry}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                padding:"5px 14px", borderRadius:8, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent", color:T.txt4 }}>
              ↺ Re-generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function ConsultPrepPanel({
  demo, cc, vitals, medications, pmhSelected, consults,
  onToast,
  selectedSpecialty, onSpecialtyChange,
}) {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [coachOpen,     setCoachOpen]     = useState(false);
  const [scenario,      setScenario]      = useState("");
  const [coaching,      setCoaching]      = useState(false);
  const [coachResult,   setCoachResult]   = useState(null);
  const [coachErr,      setCoachErr]      = useState(null);

  const sp = CONSULT_SPECIALTIES.find(s => s.id === selectedSpecialty) || null;

  // ── Auto-build scenario whenever specialty or patient data changes ──────────
  const prevSpId = useRef(null);
  useEffect(() => {
    if (!sp) return;
    // Only auto-rebuild when specialty changes (not on every keystroke)
    if (sp.id === prevSpId.current) return;
    prevSpId.current = sp.id;

    const built = buildConsultScenario(demo, cc, vitals, medications, pmhSelected);
    if (built) {
      setScenario(built);
    }
    // Clear prior result when switching specialty
    setCoachResult(null);
    setCoachErr(null);
  }, [sp, demo, cc, vitals, medications, pmhSelected]);

  // ── Open checklist automatically when specialty selected ───────────────────
  useEffect(() => {
    if (sp) {
      setChecklistOpen(true);
    }
  }, [sp?.id]);

  // ── AI generate ────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!scenario.trim() || !sp) return;
    setCoaching(true);
    setCoachErr(null);
    setCoachResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1400,
          system:`You are a consult preparation coach for emergency medicine physicians. Generate a tailored consultation pre-call brief for calling ${sp.name}. Respond ONLY in valid JSON with no markdown fences:
{
  "urgency": "Phone only | Urgent phone call | Bedside within 30 min | Immediate bedside — page attending",
  "opening": "Exact suggested 2-sentence opening for this phone call",
  "leadWith": ["most critical specific fact first", "second key fact", "third key fact"],
  "anticipatedQA": [
    {"q": "They will ask about X", "a": "Have ready: Y"}
  ],
  "ask": "How to frame the specific clinical request — the actual ask sentence",
  "pushback": [
    {"concern": "Likely pushback", "response": "Professional effective response"}
  ],
  "insider": "One insider cultural tip specific to this specialty and this clinical scenario"
}`,
          messages:[{
            role:"user",
            content:`Specialty: ${sp.name}\n\nClinical context:\n${scenario}`,
          }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setCoachResult(parsed);
      setCoachOpen(true);
      onToast?.("Consult script ready", "success");
    } catch (e) {
      setCoachErr("Error: " + (e.message || "Check API connectivity"));
      onToast?.("Failed to generate script", "error");
    } finally {
      setCoaching(false);
    }
  }, [scenario, sp, onToast]);

  // ── No specialty selected state ────────────────────────────────────────────
  if (!sp) {
    return (
      <div>
        <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:8,
          background:"rgba(155,109,255,0.07)",
          border:"1px solid rgba(155,109,255,0.2)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.purple, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:4 }}>Consult Prep</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt3 }}>
            Select a specialty below to load the pre-call checklist and generate an
            AI consult script from this patient's chart.
          </div>
        </div>
        <SpecialtyPicker selectedId={selectedSpecialty} onChange={onSpecialtyChange} />
      </div>
    );
  }

  // ── Selected specialty view ────────────────────────────────────────────────
  return (
    <div>
      {/* Selected specialty header */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 13px", borderRadius:9, marginBottom:8,
        background:`linear-gradient(135deg,${sp.color}0e,rgba(8,22,40,0.9))`,
        border:`1px solid ${sp.color}38` }}>
        <span style={{ fontSize:20 }}>{sp.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14,
            fontWeight:700, color:sp.color }}>{sp.name}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>{sp.hook}</div>
        </div>
        <button onClick={() => onSpecialtyChange(null)}
          style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, background:"transparent",
            border:"1px solid rgba(42,79,122,0.35)",
            borderRadius:6, padding:"3px 8px", cursor:"pointer",
            letterSpacing:1, textTransform:"uppercase" }}>
          Change
        </button>
      </div>

      {/* ── Section 1: Pre-call checklist ──────────────────────────────────── */}
      <CollapseBtn
        open={checklistOpen}
        onToggle={() => setChecklistOpen(p => !p)}
        label={`${sp.icon}  Pre-Call Checklist — ${sp.name}`}
        accent={sp.color}
      />
      {checklistOpen && <PreCallChecklist sp={sp} />}

      {/* ── Section 2: AI Consult Script ───────────────────────────────────── */}
      <CollapseBtn
        open={coachOpen}
        onToggle={() => setCoachOpen(p => !p)}
        label={"🤖  AI Consult Script Generator"}
        accent={T.purple}
      />
      {coachOpen && (
        <AICoachPanel
          sp={sp}
          scenario={scenario}
          setScenario={setScenario}
          coaching={coaching}
          coachResult={coachResult}
          coachErr={coachErr}
          onGenerate={handleGenerate}
          onRetry={handleGenerate}
        />
      )}

      {/* ── Change specialty (collapsed view) ──────────────────────────────── */}
      <div style={{ marginTop:8 }}>
        <SpecialtyPicker selectedId={selectedSpecialty} onChange={onSpecialtyChange} />
      </div>
    </div>
  );
}