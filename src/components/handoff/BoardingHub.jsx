import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/*
  BoardingHub.jsx  -  Lakonyx
  Optimize care for the admitted-but-boarding patient.
*/

/* ----------------------------------------------------------------- module scope */

const _go = (page) => { try { window.location.href = page; } catch (e) {} };

const QLOG_KEY = "lakonyx_boarding_quality_log";

const BENCHMARK_MIN = 240;

const G = { check: "✓", up: "▲", dot: "●", warn: "⚠", open: "○", half: "◐", dash: "—" };

const C = {
  bg0: "#08111f", bg1: "#0c1a2e",
  panel: "rgba(18, 34, 58, 0.55)", panelSolid: "#13243c",
  border: "rgba(120, 160, 205, 0.20)", borderStrong: "rgba(120, 160, 205, 0.38)",
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

const LEVELS = ["Floor", "Telemetry", "Step-down", "ICU"];

const PADUA = [
  { id: "cancer",        label: "Active cancer",                                      pts: 3 },
  { id: "prevVte",       label: "Previous VTE (excl. superficial)",                   pts: 3 },
  { id: "mobility",      label: "Reduced mobility / bedrest 3+ days",                 pts: 3 },
  { id: "thrombophilia", label: "Known thrombophilic condition",                       pts: 3 },
  { id: "trauma",        label: "Recent trauma or surgery (1 month or less)",         pts: 2 },
  { id: "age70",         label: "Age 70+",                                             pts: 1 },
  { id: "cardioResp",    label: "Heart and/or respiratory failure",                    pts: 1 },
  { id: "miStroke",      label: "Acute MI or ischemic stroke",                         pts: 1 },
  { id: "infection",     label: "Acute infection / rheumatologic disorder",            pts: 1 },
  { id: "obesity",       label: "Obesity (BMI 30+)",                                   pts: 1 },
  { id: "hormonal",      label: "Ongoing hormonal treatment",                          pts: 1 },
];

const CAPRINI = [
  { id: "age4160",       label: "Age 41-60",                                           pts: 1 },
  { id: "minorSurg",     label: "Minor surgery",                                       pts: 1 },
  { id: "bmi25",         label: "BMI over 25",                                         pts: 1 },
  { id: "legEdema",      label: "Swollen legs",                                        pts: 1 },
  { id: "varicose",      label: "Varicose veins",                                      pts: 1 },
  { id: "sepsis1mo",     label: "Sepsis (under 1 month)",                              pts: 1 },
  { id: "lungDz",        label: "Serious lung disease incl. pneumonia (under 1 month)",pts: 1 },
  { id: "ocp",           label: "Oral contraceptives / HRT",                           pts: 1 },
  { id: "pregPp",        label: "Pregnancy or postpartum (under 1 month)",             pts: 1 },
  { id: "chf1mo",        label: "CHF (under 1 month)",                                 pts: 1 },
  { id: "ibd",           label: "History of inflammatory bowel disease",               pts: 1 },
  { id: "medBed",        label: "Medical patient at bed rest",                         pts: 1 },
  { id: "age6174",       label: "Age 61-74",                                           pts: 2 },
  { id: "arthro",        label: "Arthroscopic surgery",                                pts: 2 },
  { id: "majorOpen",     label: "Major open surgery (over 45 min)",                   pts: 2 },
  { id: "lap",           label: "Laparoscopic surgery (over 45 min)",                  pts: 2 },
  { id: "malignancy",    label: "Malignancy",                                          pts: 2 },
  { id: "confined",      label: "Confined to bed over 72 h",                          pts: 2 },
  { id: "cast",          label: "Immobilizing plaster cast",                           pts: 2 },
  { id: "cvc",           label: "Central venous access",                               pts: 2 },
  { id: "age75",         label: "Age 75+",                                             pts: 3 },
  { id: "hxVte",         label: "History of VTE",                                      pts: 3 },
  { id: "famVte",        label: "Family history of VTE",                               pts: 3 },
  { id: "factorV",       label: "Factor V Leiden",                                     pts: 3 },
  { id: "prothrombin",   label: "Prothrombin 20210A",                                  pts: 3 },
  { id: "lupus",         label: "Lupus anticoagulant",                                 pts: 3 },
  { id: "anticardio",    label: "Anticardiolipin antibodies",                          pts: 3 },
  { id: "homocyst",      label: "Elevated homocysteine",                               pts: 3 },
  { id: "hit",           label: "Heparin-induced thrombocytopenia",                    pts: 3 },
  { id: "thromboOther",  label: "Other congenital/acquired thrombophilia",             pts: 3 },
  { id: "stroke1mo",     label: "Stroke (under 1 month)",                              pts: 5 },
  { id: "arthroplasty",  label: "Elective lower-extremity arthroplasty",               pts: 5 },
  { id: "hipFx",         label: "Hip, pelvis, or leg fracture",                        pts: 5 },
  { id: "sci",           label: "Acute spinal cord injury (under 1 month)",            pts: 5 },
];

const BLEED = [
  { id: "activeBleed", label: "Active bleeding" },
  { id: "lowPlt",      label: "Platelets under 50k" },
  { id: "ich",         label: "Recent intracranial hemorrhage" },
  { id: "coag",        label: "Coagulopathy (INR over 1.5 / aPTT prolonged)" },
  { id: "cnsSurg",     label: "Recent CNS / spinal surgery or trauma" },
  { id: "epidural",    label: "Epidural / spinal catheter in place" },
  { id: "procSoon",    label: "High-bleed-risk procedure under 12 h" },
];

const CONTINUATION = [
  { id: "vteOrdered",  label: "VTE prophylaxis ordered (pharm or mechanical)" },
  { id: "medRec",      label: "Home medication reconciliation completed" },
  { id: "homeMedsDue", label: "Time-critical home meds given / scheduled" },
  { id: "diet",        label: "Diet order placed (NPO status confirmed)" },
  { id: "tele",        label: "Telemetry indication documented / continued" },
  { id: "glucose",     label: "Glucose management addressed" },
  { id: "pain",        label: "Pain regimen ordered" },
  { id: "bowel",       label: "Bowel regimen ordered (if on opioids)" },
  { id: "lines",       label: "Lines / tubes reviewed for ongoing necessity" },
  { id: "code",        label: "Code status confirmed and documented" },
];

const GERI = [
  { id: "delirium",  label: "Delirium screen (CAM) + prevention bundle" },
  { id: "orient",    label: "Reorientation; glasses / hearing aids; day-night cues" },
  { id: "mobility",  label: "Early mobility / out-of-bed plan" },
  { id: "fall",      label: "Fall-risk precautions in place" },
  { id: "pressure",  label: "Pressure-injury risk assessed; repositioning" },
  { id: "foley",     label: "Avoid / remove unnecessary urinary catheter" },
  { id: "beers",     label: "Reviewed for high-risk (Beers) medications" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "vte",      label: "VTE" },
  { id: "orders",   label: "Orders & Med Rec" },
  { id: "geri",     label: "Geriatric & Pending" },
  { id: "quality",  label: "Quality Log" },
];

/* ----------------------------------------------------------------- helpers */

function fmtClock(totalMin) {
  const m = Math.max(0, Math.floor(totalMin));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return (h > 0 ? h + "h " : "") + r + "m";
}

function minutesBetween(fromMs, toMs) {
  if (!fromMs || !toMs) return 0;
  return Math.max(0, (toMs - fromMs) / 60000);
}

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

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
  } catch (e) {}
  return record;
}

async function readQualityLog() {
  try {
    if (window.storage && typeof window.storage.get === "function") {
      const raw = await window.storage.get(QLOG_KEY);
      if (raw && raw.value) return JSON.parse(raw.value);
    }
  } catch (e) {}
  return [];
}

function deriveCmsTimeliness(events) {
  const completed = events.filter((e) => e.type === "encounter" && e.departureTs);
  if (!completed.length) return { n: 0, withinPct: 0, medianMin: 0, mean: 0 };
  const intervals = completed.map((e) => minutesBetween(e.admitDecisionTs, e.departureTs));
  const within = intervals.filter((m) => m <= BENCHMARK_MIN).length;
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return {
    n: completed.length,
    withinPct: Math.round((within / completed.length) * 100),
    medianMin: Math.round(median),
    mean: Math.round(mean),
  };
}

/* ----------------------------------------------------------------- primitives */

function Panel({ title, accent, children, style }) {
  return (
    <div style={{
      background: C.panel, border: "1px solid " + (accent || C.border),
      borderRadius: 14, padding: 16, backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)", ...style,
    }}>
      {title ? (
        <div style={{ fontFamily: FONT_HEAD, fontSize: 17, color: C.txt, marginBottom: 12, letterSpacing: 0.2 }}>{title}</div>
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
      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_MONO,
      fontSize: 12, color: fg, background: bg, border: "1px solid " + fg + "55",
      borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Check({ on, label, onToggle, danger }) {
  const fg = on ? (danger ? C.crit : C.teal) : C.txt2;
  return (
    <div role="checkbox" aria-checked={on} tabIndex={0} onClick={onToggle}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
        cursor: "pointer", userSelect: "none",
        background: on ? (danger ? C.critDim : C.tealDim) : "transparent",
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

function Stat({ value, unit, label, tone }) {
  const fg = tone === "crit" ? C.crit : tone === "warn" ? C.warn : tone === "ok" ? C.ok : C.teal;
  return (
    <div style={{ minWidth: 96 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 24, color: fg, lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 13, color: C.txt2, marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt2, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Btn({ children, onClick, kind, disabled }) {
  const base = {
    fontFamily: FONT_BODY, fontSize: 14, borderRadius: 10, padding: "10px 16px",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    border: "1px solid " + C.borderStrong, transition: "transform 0.12s ease",
  };
  const kinds = {
    primary: { background: C.teal, color: "#04141a", border: "1px solid " + C.teal, fontWeight: 600 },
    gold:    { background: C.gold, color: "#1c1402", border: "1px solid " + C.gold, fontWeight: 600 },
    ghost:   { background: "transparent", color: C.txt },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      className="lk-btn" style={{ ...base, ...(kinds[kind] || kinds.ghost) }}>
      {children}
    </button>
  );
}

function SummaryCell({ label, on, partial, alt }) {
  const tone = on ? C.ok : partial ? C.warn : C.txt3;
  const glyph = on ? G.check : partial ? G.half : G.open;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      border: "1px solid " + tone + "44",
      background: on ? C.okDim : partial ? C.warnDim : "rgba(255,255,255,0.03)",
    }}>
      <span aria-hidden="true" style={{ color: tone, fontSize: 15 }}>{glyph}</span>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt }}>{label}</span>
        {alt ? <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.txt2 }}>{alt}</span> : null}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- main */

export default function BoardingHub({ embedded = false, patient = null, onLaunchHandoff = null }) {
  const [tab, setTab] = useState("overview");

  const initialAdmit = useRef(Date.now()).current;
  const [admitTs,   setAdmitTs]   = useState(initialAdmit);
  const [departed,  setDeparted]  = useState(false);
  const [departTs,  setDepartTs]  = useState(null);
  const [level,     setLevel]     = useState("Floor");
  const [ageYears,  setAgeYears]  = useState(patient && patient.ageYears ? patient.ageYears : "");
  const [now,       setNow]       = useState(Date.now());

  const [vteMode,        setVteMode]        = useState("padua");
  const [padua,          setPadua]          = useState({});
  const [caprini,        setCaprini]        = useState({});
  const [bleed,          setBleed]          = useState({});
  const [vteReassessAck, setVteReassessAck] = useState(false);

  const [cont, setCont] = useState({});
  const [geri, setGeri] = useState({});

  const [pending,   setPending]   = useState([]);
  const [pendDraft, setPendDraft] = useState("");

  const [handoffDone, setHandoffDone] = useState(false);
  const [logMsg,      setLogMsg]      = useState("");
  const [cms,         setCms]         = useState({ n: 0, withinPct: 0, medianMin: 0, mean: 0 });

  const rootRef = useRef(null);

  useEffect(() => {
    if (departed) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [departed]);

  useEffect(() => {
    try {
      if (window.__lakonyxHandoffComplete && window.__lakonyxHandoffComplete.closedLoop) {
        setHandoffDone(true);
      }
    } catch (e) {}
  }, []);

  const refreshCms = useCallback(async () => {
    const events = await readQualityLog();
    setCms(deriveCmsTimeliness(events));
  }, []);

  useEffect(() => { refreshCms(); }, [refreshCms]);

  const ageNum    = parseInt(ageYears, 10);
  const isElderly = !isNaN(ageNum) && ageNum >= 65;
  const isIcu     = level === "ICU";
  const highRisk  = isElderly || isIcu;

  const elapsedMin    = departed && departTs
    ? minutesBetween(admitTs, departTs)
    : minutesBetween(admitTs, now);
  const overBenchmark = elapsedMin > BENCHMARK_MIN;

  const sumPts = (obj, items) => items.reduce((a, i) => a + (obj[i.id] ? i.pts : 0), 0);
  const pauduScore = sumPts(padua, PADUA);
  const caprScore  = sumPts(caprini, CAPRINI);
  const bleedFlags = BLEED.filter((b) => bleed[b.id]);
  const hasBleed   = bleedFlags.length > 0;

  const vteRec = useMemo(() => {
    const high     = vteMode === "padua" ? pauduScore >= 4 : caprScore >= 5;
    const moderate = vteMode === "caprini" && caprScore >= 3 && caprScore < 5;
    if (hasBleed) {
      return { tone: "warn", text: "Bleeding risk present " + G.dash + " use MECHANICAL prophylaxis (intermittent pneumatic compression). Reassess pharmacologic when bleeding risk resolves." };
    }
    if (high) {
      return { tone: "crit", text: "High VTE risk " + G.dash + " pharmacologic prophylaxis indicated (LMWH preferred; UFH if CrCl under 30). Document order before departure." };
    }
    if (moderate) {
      return { tone: "warn", text: "Moderate VTE risk " + G.dash + " pharmacologic prophylaxis suggested; mechanical if pharmacologic contraindicated." };
    }
    return { tone: "ok", text: "Low VTE risk " + G.dash + " early ambulation; pharmacologic prophylaxis generally not required. Reassess if status changes." };
  }, [vteMode, pauduScore, caprScore, hasBleed]);

  const contDone    = CONTINUATION.filter((i) => cont[i.id]).length;
  const geriDone    = GERI.filter((i) => geri[i.id]).length;
  const vteAssessed = pauduScore > 0 || caprScore > 0 || hasBleed || vteReassessAck;
  const bundleItems = CONTINUATION.length + (isElderly ? GERI.length : 0) + 1;
  const bundleDone  = contDone + (isElderly ? geriDone : 0) + (vteAssessed ? 1 : 0);
  const bundlePct   = pct(bundleDone, bundleItems);
  const pendingOpen = pending.filter((p) => !p.back).length;

  const toggle = (setter) => (id) => setter((s) => ({ ...s, [id]: !s[id] }));

  const addPending = () => {
    const v = pendDraft.trim();
    if (!v) return;
    setPending((p) => [...p, { id: Date.now(), label: v, back: false }]);
    setPendDraft("");
  };

  const buildIpassPayload = useCallback(() => ({
    illnessSeverity: isIcu ? "unstable" : highRisk ? "watcher" : "stable",
    levelOfCare: level,
    actionList: [
      ...CONTINUATION.filter((i) => !cont[i.id]).map((i) => i.label),
      ...(isElderly ? GERI.filter((i) => !geri[i.id]).map((i) => i.label) : []),
      ...pending.filter((p) => !p.back).map((p) => "Pending: " + p.label),
    ],
    vte: { mode: vteMode, score: vteMode === "padua" ? pauduScore : caprScore, bleedingRisk: hasBleed, recommendation: vteRec.text },
    contingency: highRisk
      ? "High-risk boarder " + G.dash + " escalate on any deterioration; reassess VTE/lines each shift."
      : "Reassess if vitals change.",
    boardingMinutes: Math.round(elapsedMin),
    source: "BoardingHub",
  }), [isIcu, highRisk, level, cont, isElderly, geri, pending, vteMode, pauduScore, caprScore, hasBleed, vteRec.text, elapsedMin]);

  const launchHandoff = useCallback(() => {
    const payload = buildIpassPayload();
    if (typeof onLaunchHandoff === "function") { onLaunchHandoff(payload); return; }
    try { window.__lakonyxHandoffDraft = payload; } catch (e) {}
    _go("/ClinicalNoteStudio?mode=handoff&from=BoardingHub");
  }, [buildIpassPayload, onLaunchHandoff]);

  const logEncounter = useCallback(async (markDeparted) => {
    const depMs = markDeparted ? Date.now() : (departed ? departTs : null);
    if (markDeparted) { setDeparted(true); setDepartTs(depMs); }
    await appendQualityEvent({
      type: "encounter",
      admitDecisionTs: admitTs,
      departureTs: depMs,
      levelOfCare: level,
      ageBand: isElderly ? "65+" : (!isNaN(ageNum) ? "under65" : "unknown"),
      icu: isIcu,
      vteAssessed,
      vtePharmIndicated: vteRec.tone === "crit",
      vteBleedingRisk: hasBleed,
      medRecDone: !!cont.medRec,
      bundlePct,
      pendingOpen,
      handoffCompleted: handoffDone,
    });
    await refreshCms();
    setLogMsg("Encounter logged (de-identified) at " + new Date().toLocaleTimeString());
    setTimeout(() => setLogMsg(""), 4000);
  }, [departed, departTs, admitTs, level, isElderly, ageNum, isIcu, vteAssessed, vteRec.tone, hasBleed, cont.medRec, bundlePct, pendingOpen, handoffDone, refreshCms]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key >= "1" && e.key <= "5") { setTab(TABS[parseInt(e.key, 10) - 1].id); }
      else if (e.key.toLowerCase() === "h") { launchHandoff(); }
      else if (e.key.toLowerCase() === "l") { logEncounter(false); }
    };
    const node = rootRef.current || window;
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [launchHandoff, logEncounter]);

  /* --------------------------------------------------------------- render */

  const clockTone = departed ? "ok" : overBenchmark ? "crit" : elapsedMin > BENCHMARK_MIN * 0.75 ? "warn" : "teal";

  const BoardingClock = (
    <Panel accent={overBenchmark && !departed ? C.crit : C.border}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
          <Stat value={fmtClock(elapsedMin)} unit="" label={departed ? "Boarding interval (final)" : "Boarding so far"} tone={clockTone} />
          <Stat value={BENCHMARK_MIN / 60} unit="h" label="ACEP target" tone="gold" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {departed
              ? <Pill tone="ok">{G.check} Departed ED</Pill>
              : overBenchmark
                ? <Pill tone="crit">{G.up} Over target</Pill>
                : <Pill tone="teal">{G.dot} Within target</Pill>}
            {highRisk ? <Pill tone="warn">{G.warn} High-risk boarder ({isIcu ? "ICU" : "age 65+"})</Pill> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt2, display: "flex", flexDirection: "column", gap: 4 }}>
            Admit decision time
            <input type="datetime-local" className="lk-in"
              value={new Date(admitTs - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              onChange={(e) => { const v = e.target.value ? new Date(e.target.value).getTime() : admitTs; setAdmitTs(v); }} />
          </label>
          <label style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt2, display: "flex", flexDirection: "column", gap: 4 }}>
            Level of care
            <select className="lk-in" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt2, display: "flex", flexDirection: "column", gap: 4 }}>
            Age (yrs)
            <input type="number" min="0" className="lk-in" style={{ width: 72 }}
              value={ageYears} onChange={(e) => setAgeYears(e.target.value)} />
          </label>
        </div>
      </div>
    </Panel>
  );

  const OverviewTab = (
    <div style={{ display: "grid", gap: 14 }}>
      {BoardingClock}
      <Panel title="While-you-board bundle">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div className="lk-bar" style={{ width: bundlePct + "%", height: "100%", background: bundlePct === 100 ? C.ok : C.teal }} />
            </div>
          </div>
          <Pill tone={bundlePct === 100 ? "ok" : "teal"}>{bundleDone}/{bundleItems} complete ({bundlePct}%)</Pill>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <SummaryCell label="VTE assessed" on={vteAssessed} />
          <SummaryCell label="Med rec done" on={!!cont.medRec} />
          <SummaryCell label="Continuation orders" on={contDone === CONTINUATION.length} partial={contDone > 0} />
          {isElderly ? <SummaryCell label="Geriatric overlay" on={geriDone === GERI.length} partial={geriDone > 0} /> : null}
          <SummaryCell label="Pending tracked" on={pendingOpen === 0 && pending.length > 0} partial={pending.length > 0} alt={pendingOpen + " open"} />
          <SummaryCell label="Handoff" on={handoffDone} />
        </div>
      </Panel>
      <Panel title="Transition of care">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2, marginBottom: 12 }}>
          The synthesis / read-back step that completes a handoff lives in the I-PASS generator. This button hands the assembled context over to it.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Btn kind="gold" onClick={launchHandoff}>Launch I-PASS handoff &nbsp;<span style={{ opacity: 0.6 }}>(h)</span></Btn>
          <Check on={handoffDone} label="Read-back / synthesis confirmed by receiver" onToggle={() => setHandoffDone((v) => !v)} />
        </div>
      </Panel>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Btn kind="primary" onClick={() => logEncounter(false)}>Log encounter &nbsp;<span style={{ opacity: 0.6 }}>(l)</span></Btn>
        <Btn kind="ghost" onClick={() => logEncounter(true)}>Mark departed + log</Btn>
        {logMsg ? <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.ok }}>{logMsg}</span> : null}
      </div>
    </div>
  );

  const VteTab = (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel title="VTE prophylaxis">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Btn kind={vteMode === "padua"   ? "primary" : "ghost"} onClick={() => setVteMode("padua")}>Padua (medical)</Btn>
          <Btn kind={vteMode === "caprini" ? "primary" : "ghost"} onClick={() => setVteMode("caprini")}>Caprini (surgical)</Btn>
          <div style={{ marginLeft: "auto" }}>
            <Pill tone={vteRec.tone}>{vteMode === "padua" ? "Padua " + pauduScore : "Caprini " + caprScore}</Pill>
          </div>
        </div>
        <div style={{
          background: vteRec.tone === "crit" ? C.critDim : vteRec.tone === "warn" ? C.warnDim : C.okDim,
          border: "1px solid " + (vteRec.tone === "crit" ? C.crit : vteRec.tone === "warn" ? C.warn : C.ok) + "66",
          borderRadius: 10, padding: 12, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span aria-hidden="true" style={{ fontSize: 16, color: vteRec.tone === "crit" ? C.crit : vteRec.tone === "warn" ? C.warn : C.ok }}>
            {vteRec.tone === "crit" ? G.up : vteRec.tone === "warn" ? G.warn : G.check}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.txt, lineHeight: 1.45 }}>{vteRec.text}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8 }}>
          {(vteMode === "padua" ? PADUA : CAPRINI).map((i) => (
            <Check key={i.id}
              on={vteMode === "padua" ? !!padua[i.id] : !!caprini[i.id]}
              label={i.label + " (" + i.pts + ")"}
              onToggle={() => (vteMode === "padua" ? toggle(setPadua)(i.id) : toggle(setCaprini)(i.id))} />
          ))}
        </div>
      </Panel>
      <Panel title="Bleeding-risk gate (pharmacologic prophylaxis)" accent={hasBleed ? C.warn : C.border}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 8 }}>
          {BLEED.map((b) => (
            <Check key={b.id} danger on={!!bleed[b.id]} label={b.label} onToggle={() => toggle(setBleed)(b.id)} />
          ))}
        </div>
      </Panel>
      <Panel>
        <Check on={vteReassessAck} label="Daily VTE reassessment scheduled (reassess at 48-72 h or on status change)" onToggle={() => setVteReassessAck((v) => !v)} />
      </Panel>
    </div>
  );

  const OrdersTab = (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel title="Continuation orders & medication reconciliation">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8 }}>
          {CONTINUATION.map((i) => (
            <Check key={i.id} on={!!cont[i.id]} label={i.label} onToggle={() => toggle(setCont)(i.id)} />
          ))}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt3, marginTop: 12 }}>
          Med rec is a Joint Commission admission requirement; for boarders, time-critical home meds frequently must be given in the ED.
        </div>
      </Panel>
    </div>
  );

  const GeriTab = (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel title="Geriatric overlay" accent={isElderly ? C.gold : C.border}>
        {!isElderly ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2, marginBottom: 12 }}>
            Patient is not flagged age 65+. These items do not count toward bundle completion but remain available.
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 8 }}>
          {GERI.map((i) => (
            <Check key={i.id} on={!!geri[i.id]} label={i.label} onToggle={() => toggle(setGeri)(i.id)} />
          ))}
        </div>
      </Panel>
      <Panel title={"Pending results tracker" + (pendingOpen ? "  " + G.dash + "  " + pendingOpen + " open" : "")}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="lk-in" style={{ flex: 1 }} placeholder="e.g. blood cultures, final CT read, repeat troponin"
            value={pendDraft} onChange={(e) => setPendDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPending(); }} />
          <Btn kind="primary" onClick={addPending}>Add</Btn>
        </div>
        {pending.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt3 }}>No pending items tracked.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {pending.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
                border: "1px solid " + (p.back ? C.ok + "55" : C.warn + "55"),
                background: p.back ? C.okDim : C.warnDim,
              }}>
                <span aria-hidden="true" style={{ color: p.back ? C.ok : C.warn }}>{p.back ? G.check : G.open}</span>
                <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: C.txt, textDecoration: p.back ? "line-through" : "none" }}>{p.label}</span>
                <Btn kind="ghost" onClick={() => setPending((arr) => arr.map((x) => x.id === p.id ? { ...x, back: !x.back } : x))}>
                  {p.back ? "Reopen" : "Resulted"}
                </Btn>
                <Btn kind="ghost" onClick={() => setPending((arr) => arr.filter((x) => x.id !== p.id))}>Remove</Btn>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  const QualityTab = (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel title="Generic capture">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2, lineHeight: 1.5 }}>
          Each logged encounter stores clean, de-identified events to shared storage: admit-decision and departure
          timestamps, level of care, age band, and bundle completion booleans. No PHI and no measure logic are stored here.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Btn kind="primary" onClick={() => logEncounter(false)}>Log current encounter</Btn>
          <Btn kind="ghost" onClick={() => logEncounter(true)}>Mark departed + log</Btn>
          <Btn kind="ghost" onClick={refreshCms}>Refresh derived view</Btn>
        </div>
        {logMsg ? <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.ok, marginTop: 10 }}>{logMsg}</div> : null}
      </Panel>
      <Panel title="Derived view: CMS Emergency Care Access & Timeliness" accent={C.gold}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <Stat value={cms.n}          unit=""  label="Logged encounters"                                         tone="teal" />
          <Stat value={cms.withinPct}  unit="%" label={"Within " + (BENCHMARK_MIN / 60) + "h target"}            tone={cms.withinPct >= 80 ? "ok" : "warn"} />
          <Stat value={cms.medianMin}  unit="m" label="Median boarding"                                           tone="teal" />
          <Stat value={cms.mean}       unit="m" label="Mean boarding"                                             tone="teal" />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.txt3, marginTop: 14, lineHeight: 1.5 }}>
          This is computed on top of the generic events and is intentionally swappable. Confirm the exact
          numerator, denominator, and exclusions against the CY2026 OPPS final rule before operational use;
          update deriveCmsTimeliness() only, not the stored schema.
        </div>
      </Panel>
    </div>
  );

  const body = { overview: OverviewTab, vte: VteTab, orders: OrdersTab, geri: GeriTab, quality: QualityTab }[tab];

  const shell = (
    <div ref={rootRef} tabIndex={-1} style={{ outline: "none", fontFamily: FONT_BODY, color: C.txt }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;600&display=swap');
        .lk-in{background:rgba(255,255,255,0.04);border:1px solid ${C.border};color:${C.txt};
          font-family:${FONT_MONO};font-size:13px;border-radius:8px;padding:7px 9px;outline:none;min-height:34px;}
        .lk-in:focus{border-color:${C.teal};box-shadow:0 0 0 2px ${C.tealDim};}
        .lk-btn:hover{transform:translateY(-1px);}
        .lk-btn:focus-visible{outline:2px solid ${C.teal};outline-offset:2px;}
        .lk-tab:focus-visible{outline:2px solid ${C.teal};outline-offset:2px;}
        @media (prefers-reduced-motion: reduce){
          .lk-btn{transition:none!important;} .lk-bar{transition:none!important;}
        }
        .lk-bar{transition:width 0.3s ease;}
      `}</style>

      {!embedded ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 26, letterSpacing: 0.3 }}>Boarding Hub</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.txt2, marginTop: 4 }}>
            Optimize care for the admitted-but-boarding patient.
          </div>
        </div>
      ) : null}

      <div role="tablist" style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t, i) => {
          const active = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={active} className="lk-tab"
              onClick={() => setTab(t.id)}
              style={{
                fontFamily: FONT_BODY, fontSize: 13, padding: "8px 14px", borderRadius: 9, cursor: "pointer",
                border: "1px solid " + (active ? C.teal : C.border),
                background: active ? C.tealDim : "transparent",
                color: active ? C.txt : C.txt2,
              }}>
              <span style={{ fontFamily: FONT_MONO, color: C.txt3, marginRight: 6 }}>{i + 1}</span>{t.label}
            </button>
          );
        })}
      </div>

      {body}
    </div>
  );

  if (embedded) return <div style={{ padding: 4 }}>{shell}</div>;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(1200px 600px at 20% -10%, " + C.bg1 + " 0%, " + C.bg0 + " 60%)",
      padding: "28px 22px",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>{shell}</div>
    </div>
  );
}