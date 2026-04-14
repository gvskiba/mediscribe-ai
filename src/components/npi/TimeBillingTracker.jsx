// TimeBillingTracker.jsx
// 2023 CMS time-based E/M billing tracker for ED encounters.
// Covers 99281–99285 time-based alternative to MDM.
// Integrates with MDMBuilderTab via setMdmState attestation append.
//
// Props:
//   doorTime      string   — arrival time (e.g. "14:32") from NPI state
//   demo, cc      objects  — patient context for attestation
//   providerName  string
//   mdmState      object   — to read existing narrative
//   setMdmState   fn       — to append attestation sentence
//   onToast       fn       — toast bridge
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on async functions

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── 2023 E/M thresholds for ED (99281–99285) ─────────────────────────────────
const EM_LEVELS = [
  { code:"99281", min:0,  max:15,  label:"Level 1", color:T.teal,   desc:"Self-limited or minor" },
  { code:"99282", min:16, max:29,  label:"Level 2", color:T.green,  desc:"Low complexity" },
  { code:"99283", min:30, max:44,  label:"Level 3", color:T.gold,   desc:"Moderate complexity" },
  { code:"99284", min:45, max:59,  label:"Level 4", color:T.orange, desc:"High complexity" },
  { code:"99285", min:60, max:999, label:"Level 5", color:T.coral,  desc:"High complexity — 60+ min" },
];

function getLevel(totalMin) {
  return EM_LEVELS.find(l => totalMin >= l.min && totalMin <= l.max) || EM_LEVELS[0];
}

// ── Activity definitions ──────────────────────────────────────────────────────
const ACTIVITIES = [
  { id:"face",    label:"Face-to-Face Time",             sub:"Direct patient and/or family contact",                          color:T.teal,   required:true },
  { id:"records", label:"Record / Chart Review",         sub:"External records, prior notes, imaging reports",               color:T.blue   },
  { id:"tests",   label:"Test Ordering & Review",        sub:"Reviewing labs, imaging, EKG, point-of-care results",          color:T.purple },
  { id:"doc",     label:"Documentation",                 sub:"Writing the note, MDM, orders",                                color:T.gold   },
  { id:"coord",   label:"Care Coordination & Counseling",sub:"Consult calls, disposition planning, family counseling",       color:T.orange },
  { id:"other",   label:"Other Billable Time",           sub:"Procedure supervision, team communication, care transitions",  color:T.green  },
];

// ── Parse doorTime string into today's Date ───────────────────────────────────
function parseDoorTime(doorTime) {
  if (!doorTime) return null;
  const today = new Date();
  const parts = doorTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
  if (!parts) return null;
  let h = parseInt(parts[1]);
  const m = parseInt(parts[2]);
  const ampm = parts[4];
  if (ampm) {
    if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
  }
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d;
}

function elapsedMinutes(doorDate) {
  if (!doorDate) return 0;
  const diff = Date.now() - doorDate.getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

function formatTime(totalMin) {
  if (totalMin < 60) return `${totalMin}m`;
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

// ── Attestation sentence builder ──────────────────────────────────────────────
function buildAttestation(totalMin, level, activities, providerName, splitShared, npName) {
  const breakdown = ACTIVITIES
    .filter(a => (activities[a.id] || 0) > 0)
    .map(a => `${a.label.toLowerCase()} (${activities[a.id]} min)`)
    .join(", ");

  const provider = providerName || "the treating physician";

  let base = `Total time spent by ${provider} on the date of this encounter, including ${breakdown || "face-to-face time, documentation, and care coordination"}, was ${totalMin} minutes, supporting a ${level.code} (${level.label}) level of service per 2023 CMS time-based E/M guidelines.`;

  if (splitShared && npName) {
    base += ` This is a split/shared visit. The substantive portion of this encounter was performed by the billing provider. ${npName} also participated in the care of this patient (-FS modifier applies).`;
  }

  return base;
}

// ── Mini number stepper ───────────────────────────────────────────────────────
function TimeStepper({ value, onChange, color, max }) {
  const step5 = (dir) => {
    const next = Math.max(0, Math.min(max || 999, value + dir * 5));
    onChange(next);
  };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <button onClick={() => step5(-1)}
        style={{ width:26, height:26, borderRadius:6, cursor:"pointer",
          border:`1px solid ${color}44`,
          background:`${color}10`, color, fontWeight:700,
          fontSize:13, lineHeight:1, flexShrink:0 }}>-</button>
      <input
        type="number" min="0" max={max || 999}
        value={value}
        onChange={e => onChange(Math.max(0, Math.min(max || 999, parseInt(e.target.value) || 0)))}
        style={{ width:52, textAlign:"center", padding:"4px 4px",
          background:"rgba(14,37,68,0.75)",
          border:`1px solid ${value > 0 ? color + "66" : "rgba(26,53,85,0.4)"}`,
          borderRadius:6, outline:"none",
          fontFamily:"'JetBrains Mono',monospace", fontSize:13,
          fontWeight:700, color: value > 0 ? color : T.txt4 }} />
      <button onClick={() => step5(1)}
        style={{ width:26, height:26, borderRadius:6, cursor:"pointer",
          border:`1px solid ${color}44`,
          background:`${color}10`, color, fontWeight:700,
          fontSize:13, lineHeight:1, flexShrink:0 }}>+</button>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:T.txt4, letterSpacing:1 }}>min</span>
    </div>
  );
}

// ── Threshold bar ─────────────────────────────────────────────────────────────
function ThresholdBar({ totalMin }) {
  const MAX_DISPLAY = 75;
  const pct = Math.min(100, (totalMin / MAX_DISPLAY) * 100);
  const level = getLevel(totalMin);

  return (
    <div>
      <div style={{ display:"flex", gap:3, marginBottom:8, flexWrap:"wrap" }}>
        {EM_LEVELS.map(l => {
          const active = level.code === l.code;
          return (
            <div key={l.code}
              style={{ padding:"4px 10px", borderRadius:20,
                border:`1px solid ${active ? l.color + "88" : l.color + "30"}`,
                background:active ? `${l.color}20` : `${l.color}06`,
                transition:"all .2s" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                fontWeight:700, color:active ? l.color : T.txt4,
                letterSpacing:1 }}>{l.code}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:active ? l.color : T.txt4, marginLeft:5 }}>
                {l.min === 0 ? `up to ${l.max}m` : l.max > 99 ? `${l.min}m+` : `${l.min}-${l.max}m`}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ height:8, background:"rgba(26,53,85,0.4)",
        borderRadius:4, overflow:"hidden", position:"relative" }}>
        {[15, 29, 44, 59].map(m => (
          <div key={m} style={{ position:"absolute",
            left:`${(m / MAX_DISPLAY) * 100}%`,
            top:0, bottom:0, width:1,
            background:"rgba(42,79,122,0.6)", zIndex:1 }} />
        ))}
        <div style={{ height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg,${T.teal},${level.color})`,
          borderRadius:4, transition:"width .3s ease" }} />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between",
        marginTop:3, position:"relative" }}>
        {[0,15,29,44,59,75].map(m => (
          <span key={m} style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:7, color:T.txt4 }}>{m}m</span>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TimeBillingTracker({
  doorTime, demo, cc, providerName,
  mdmState, setMdmState, onToast,
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const doorDate    = useMemo(() => parseDoorTime(doorTime), [doorTime]);
  const autoElapsed = useMemo(() => elapsedMinutes(doorDate), [doorDate, now]);

  const [activities,   setActivities]   = useState(Object.fromEntries(ACTIVITIES.map(a => [a.id, 0])));
  const [useManual,    setUseManual]    = useState(false);
  const [manualTotal,  setManualTotal]  = useState(0);

  const setActivity = useCallback((id, val) =>
    setActivities(p => ({ ...p, [id]:val })), []);

  const activitySum = useMemo(() =>
    ACTIVITIES.reduce((s, a) => s + (activities[a.id] || 0), 0), [activities]);

  const totalMin = useManual
    ? manualTotal
    : activitySum > 0 ? activitySum : autoElapsed;

  const level = useMemo(() => getLevel(totalMin), [totalMin]);

  const [splitShared, setSplitShared] = useState(false);
  const [npName,      setNpName]      = useState("");

  const [attestCopied,  setAttestCopied]  = useState(false);
  const [insertConfirm, setInsertConfirm] = useState(false);
  const insertTimer = useRef(null);

  const attestation = useMemo(() =>
    buildAttestation(totalMin, level, activities, providerName, splitShared, npName),
    [totalMin, level, activities, providerName, splitShared, npName]);

  const copyAttestation = useCallback(() => {
    navigator.clipboard.writeText(attestation).then(() => {
      setAttestCopied(true);
      setTimeout(() => setAttestCopied(false), 2500);
    });
    onToast?.("Attestation copied", "success");
  }, [attestation, onToast]);

  const insertIntoNarrative = useCallback(() => {
    if (!setMdmState) return;
    if (!insertConfirm) {
      setInsertConfirm(true);
      insertTimer.current = setTimeout(() => setInsertConfirm(false), 4000);
      return;
    }
    clearTimeout(insertTimer.current);
    setInsertConfirm(false);
    setMdmState(prev => ({
      ...prev,
      narrative: prev.narrative
        ? prev.narrative + "\n\n" + attestation
        : attestation,
    }));
    onToast?.("Attestation appended to MDM narrative", "success");
  }, [insertConfirm, attestation, setMdmState, onToast]);

  const nowStr = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", flexWrap:"wrap", gap:10,
        marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:16, color:T.gold }}>
            Time-Based E/M Billing
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>
            2023 CMS guidelines · 99281–99285 · Total time on date of encounter
          </div>
        </div>
        <div style={{ padding:"8px 16px", borderRadius:10,
          background:`${level.color}15`,
          border:`1px solid ${level.color}55` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:level.color, letterSpacing:1.5, textTransform:"uppercase",
            marginBottom:2 }}>E/M Code</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:22, fontWeight:700, color:level.color, lineHeight:1 }}>
            {level.code}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:level.color, marginTop:2 }}>{level.desc}</div>
        </div>
      </div>

      {/* Door / elapsed time strip */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[
          { label:"Arrival Time",  val:doorTime || "—",                              color:T.teal   },
          { label:"Current Time",  val:nowStr,                                       color:T.blue   },
          { label:"Auto Elapsed",  val:doorDate ? formatTime(autoElapsed) : "—",    color:T.purple },
          { label:"Billed Total",  val:formatTime(totalMin),                        color:level.color },
        ].map(b => (
          <div key={b.label} style={{ flex:"1 1 100px",
            padding:"9px 12px", borderRadius:9,
            background:`${b.color}0d`,
            border:`1px solid ${b.color}28` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:3 }}>{b.label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:18, fontWeight:700, color:b.color, lineHeight:1 }}>
              {b.val}
            </div>
          </div>
        ))}
      </div>

      {/* Threshold bar */}
      <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:12,
        background:"rgba(8,22,40,0.7)",
        border:"1px solid rgba(26,53,85,0.4)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:10 }}>E/M Level Thresholds — 2023 AMA/CMS</div>
        <ThresholdBar totalMin={totalMin} />
      </div>

      {/* Activity time log */}
      <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:12,
        background:"rgba(8,22,40,0.7)",
        border:"1px solid rgba(26,53,85,0.4)" }}>

        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:T.txt }}>
            Activity Time Log
          </div>
          <button onClick={() => setUseManual(p => !p)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              padding:"3px 10px", borderRadius:20, cursor:"pointer",
              letterSpacing:1, textTransform:"uppercase", transition:"all .12s",
              border:`1px solid ${useManual ? T.gold+"66" : "rgba(42,79,122,0.35)"}`,
              background:useManual ? "rgba(245,200,66,0.12)" : "transparent",
              color:useManual ? T.gold : T.txt4 }}>
            {useManual ? "Manual Total Active" : "Manual Override"}
          </button>
        </div>

        {useManual ? (
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.gold, letterSpacing:1, textTransform:"uppercase",
              marginBottom:6 }}>
              Enter total time manually (minutes)
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <TimeStepper value={manualTotal} onChange={setManualTotal} color={T.gold} max={999} />
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4 }}>
                = {formatTime(manualTotal)} · {getLevel(manualTotal).code}
              </span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:7, lineHeight:1.5 }}>
              Per 2023 CMS: total time includes all physician time on date of encounter —
              face-to-face, documentation, test review, and care coordination.
            </div>
          </div>
        ) : (
          <div>
            {ACTIVITIES.map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center",
                gap:12, marginBottom:10, padding:"8px 10px",
                borderRadius:8,
                background:`${a.color}07`,
                border:`1px solid ${activities[a.id] > 0 ? a.color + "33" : "rgba(26,53,85,0.25)"}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                      fontWeight:600, color: activities[a.id] > 0 ? a.color : T.txt3 }}>
                      {a.label}
                    </span>
                    {a.required && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:7, color:T.coral, letterSpacing:1 }}>REQUIRED</span>
                    )}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    color:T.txt4, marginTop:1 }}>{a.sub}</div>
                </div>
                <TimeStepper
                  value={activities[a.id] || 0}
                  onChange={v => setActivity(a.id, v)}
                  color={a.color} max={240} />
              </div>
            ))}

            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", paddingTop:8,
              borderTop:"1px solid rgba(26,53,85,0.35)", marginTop:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>
                Activity Total
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:16, fontWeight:700,
                color: activitySum > 0 ? level.color : T.txt4 }}>
                {activitySum > 0 ? formatTime(activitySum) : "—"}
              </span>
            </div>

            {activitySum === 0 && doorDate && (
              <div style={{ marginTop:6, padding:"6px 10px", borderRadius:6,
                background:"rgba(42,79,122,0.1)",
                border:"1px solid rgba(42,79,122,0.25)",
                fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
                No activity times entered — using elapsed clock time ({formatTime(autoElapsed)}) as estimate.
                Enter activity breakdown for precise documentation.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split / Shared */}
      <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:12,
        background:"rgba(8,22,40,0.65)",
        border:`1px solid ${splitShared ? T.purple+"44" : "rgba(26,53,85,0.35)"}` }}>

        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13,
              color: splitShared ? T.purple : T.txt3 }}>
              Split / Shared Visit (-FS Modifier)
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginTop:1 }}>
              2024 CMS Final Rule — physician and NPP jointly provide substantive care
            </div>
          </div>
          <button onClick={() => setSplitShared(p => !p)}
            style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
              transition:"all .15s",
              border:`1px solid ${splitShared ? T.purple+"66" : "rgba(42,79,122,0.35)"}`,
              background:splitShared ? "rgba(155,109,255,0.15)" : "transparent",
              color:splitShared ? T.purple : T.txt4,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11 }}>
            {splitShared ? "Split/Shared Active" : "Enable"}
          </button>
        </div>

        {splitShared && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>NPP / PA / NP Name</div>
            <input value={npName} onChange={e => setNpName(e.target.value)}
              placeholder="Name of participating non-physician provider"
              style={{ width:"100%", padding:"7px 10px",
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(155,109,255,0.4)",
                borderRadius:7, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          </div>
        )}
      </div>

      {/* Attestation */}
      <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:12,
        background:`${level.color}08`,
        border:`1px solid ${level.color}38` }}>

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:level.color, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:8 }}>
          Attestation Statement — {level.code} · {formatTime(totalMin)}
        </div>

        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:T.txt2, lineHeight:1.75, padding:"10px 12px",
          background:"rgba(5,15,30,0.6)",
          border:`1px solid ${level.color}28`,
          borderRadius:8, marginBottom:10,
          fontStyle:"italic" }}>
          {attestation}
        </div>

        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          <button onClick={copyAttestation}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:12, padding:"8px 18px", borderRadius:8,
              cursor:"pointer", transition:"all .15s",
              border:`1px solid ${attestCopied ? T.green+"66" : level.color+"55"}`,
              background:attestCopied ? "rgba(61,255,160,0.12)" : `${level.color}12`,
              color:attestCopied ? T.green : level.color }}>
            {attestCopied ? "Copied!" : "Copy Attestation"}
          </button>

          <button onClick={insertIntoNarrative}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:12, padding:"8px 18px", borderRadius:8,
              cursor:"pointer", transition:"all .15s",
              border:`1px solid ${insertConfirm ? T.coral+"66" : "rgba(42,79,122,0.4)"}`,
              background:insertConfirm ? "rgba(255,107,107,0.1)" : "rgba(42,79,122,0.15)",
              color:insertConfirm ? T.coral : T.txt3 }}>
            {insertConfirm ? "Confirm — Append to Narrative?" : "Insert into MDM Narrative"}
          </button>
        </div>
      </div>

      {/* Guidelines reference */}
      <div style={{ padding:"10px 13px", borderRadius:9,
        background:"rgba(8,22,40,0.5)",
        border:"1px solid rgba(26,53,85,0.3)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.blue, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:7 }}>
          2023 CMS Time-Based Billing — Key Rules
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
          {[
            "Total time on date of encounter — not face-to-face only",
            "Does not need to be continuous — aggregate time counts",
            "Must personally perform or supervise all counted activities",
            "Documentation must support time claim with activity detail",
            "Independent of MDM — choose the higher-yielding method",
            "Split/Shared: billing provider must perform substantive portion",
          ].map((r, i) => (
            <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
              <span style={{ color:T.blue, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, lineHeight:1.5 }}>{r}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8,
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(42,79,122,0.5)", letterSpacing:1 }}>
          SOURCE: 2023 AMA CPT GUIDELINES · CMS PHYSICIAN FEE SCHEDULE FINAL RULE · ACEP CODING FAQ 2023 · VERIFY WITH YOUR COMPLIANCE TEAM
        </div>
      </div>
    </div>
  );
}