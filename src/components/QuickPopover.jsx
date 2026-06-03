import { useEffect, useRef } from "react";

const CONFIG = {
  triage:    { title: "Nurse Triage Note", key: "t" },
  labs:      { title: "Labs",              key: "l" },
  imaging:   { title: "Imaging",           key: "i" },
  allergies: { title: "Allergies",         key: "a" },
  vitals:    { title: "Vitals",            key: "v" },
};

const SEV = {
  severe:   { g: "\u25B2", c: "var(--red)" },
  moderate: { g: "\u25C6", c: "var(--amber)" },
  mild:     { g: "\u25CF", c: "var(--muted)" },
};
const TREND = { up: "\u2191", down: "\u2193", flat: "\u2192" };
const flagColor = (s) => s === "critical" ? "var(--red)" : (s === "high" || s === "low") ? "var(--amber)" : "var(--text)";

const TRIAGE = {
  arrival: "16:38", mode: "EMS", esi: 2,
  cc: "Chest pain x2h, substernal, radiating to L arm", pain: "7/10",
  vitals: "BP 152/94 \u00B7 HR 110 \u00B7 RR 20 \u00B7 SpO2 95% RA \u00B7 T 37.0\u00B0C",
  nurse: "Roberts, RN",
  note: "54F with substernal chest pressure beginning ~2h ago at rest, radiating to the left arm, with diaphoresis and nausea. Denies SOB at rest. Hx HTN, T2DM. Took home ASA 81 mg en route. Placed on monitor, 12-lead ECG obtained, provider notified.",
};

const LABS = [
  { name: "Troponin (hs)", value: "48",     unit: "ng/L",     flag: "high",   time: "17:02" },
  { name: "WBC",           value: "11.2",   unit: "K/uL",     flag: "high",   time: "16:58" },
  { name: "Hgb",           value: "13.4",   unit: "g/dL",     flag: "normal", time: "16:58" },
  { name: "Potassium",     value: "4.1",    unit: "mmol/L",   flag: "normal", time: "16:58" },
  { name: "Creatinine",    value: "1.0",    unit: "mg/dL",    flag: "normal", time: "16:58" },
  { name: "Lactate",       value: "1.8",    unit: "mmol/L",   flag: "normal", time: "16:58" },
];

const IMAGING = [
  { study: "Chest X-ray (PA/Lat)",     status: "Final",       time: "16:55", impression: "No acute cardiopulmonary process. No effusion or pneumothorax." },
  { study: "CT chest \u2014 PE protocol", status: "Preliminary", time: "17:10", impression: "No central or segmental PE. Final read pending." },
];

const ALLERGY_DETAIL = [
  { name: "Penicillin",         reaction: "Anaphylaxis",      severity: "severe",   type: "Drug", noted: "2019" },
  { name: "Iodinated contrast", reaction: "Urticaria",        severity: "moderate", type: "Drug", noted: "2021" },
  { name: "Codeine",            reaction: "Nausea/Vomiting",  severity: "mild",     type: "Drug", noted: "2018" },
];

const VITALS_TREND = [
  { label: "HR",   series: ["110", "106", "104"],          unit: "bpm",   status: "high",   trend: "down" },
  { label: "BP",   series: ["152/94", "150/90", "148/92"], unit: "mmHg",  status: "high",   trend: "flat" },
  { label: "RR",   series: ["20", "18", "18"],             unit: "/min",  status: "normal", trend: "down" },
  { label: "Temp", series: ["100.4", "100.7", "100.9"],    unit: "\u00B0F", status: "high",  trend: "up" },
  { label: "SpO2", series: ["95", "96", "96"],             unit: "%",     status: "normal", trend: "flat" },
];

function Row({ children }) { return <div className="lkx-qp-row">{children}</div>; }

function renderBody(kind) {
  if (kind === "triage") {
    return (
      <div className="lkx-qp-stack">
        <div className="lkx-qp-grid">
          <div><span className="lkx-qp-k">Arrival</span><span className="lkx-qp-v">{TRIAGE.arrival} · {TRIAGE.mode}</span></div>
          <div><span className="lkx-qp-k">ESI</span><span className="lkx-qp-v">{TRIAGE.esi}</span></div>
          <div><span className="lkx-qp-k">Pain</span><span className="lkx-qp-v">{TRIAGE.pain}</span></div>
          <div><span className="lkx-qp-k">Triage nurse</span><span className="lkx-qp-v">{TRIAGE.nurse}</span></div>
        </div>
        <div><span className="lkx-qp-k">Chief complaint</span><span className="lkx-qp-v">{TRIAGE.cc}</span></div>
        <div><span className="lkx-qp-k">Triage vitals</span><span className="lkx-qp-mono">{TRIAGE.vitals}</span></div>
        <div><span className="lkx-qp-k">Nurse note</span><p className="lkx-qp-note">{TRIAGE.note}</p></div>
      </div>
    );
  }
  if (kind === "labs") {
    return (
      <div className="lkx-qp-list">
        {LABS.map(l => (
          <Row key={l.name}>
            <span className="lkx-qp-name">{l.name}</span>
            <span className="lkx-qp-num" style={{ color: flagColor(l.flag) }}>
              {l.value} <span className="lkx-qp-unit">{l.unit}</span>
              {l.flag !== "normal" && <span className="lkx-qp-flagtag"> {l.flag === "high" ? "H" : l.flag === "low" ? "L" : "!"}</span>}
            </span>
            <span className="lkx-qp-time">{l.time}</span>
          </Row>
        ))}
      </div>
    );
  }
  if (kind === "imaging") {
    return (
      <div className="lkx-qp-stack">
        {IMAGING.map(im => (
          <div className="lkx-qp-card" key={im.study}>
            <div className="lkx-qp-cardhead">
              <span className="lkx-qp-name">{im.study}</span>
              <span className={"lkx-qp-status" + (im.status === "Final" ? " final" : " prelim")}>{im.status}</span>
              <span className="lkx-qp-time">{im.time}</span>
            </div>
            <p className="lkx-qp-note">{im.impression}</p>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "allergies") {
    return (
      <div className="lkx-qp-list">
        {ALLERGY_DETAIL.map(a => {
          const sev = SEV[a.severity] || SEV.mild;
          return (
            <div className="lkx-qp-allergy" key={a.name}>
              <span className="lkx-qp-glyph" style={{ color: sev.c }} aria-hidden="true">{sev.g}</span>
              <div className="lkx-qp-allergy-main">
                <span className="lkx-qp-name">{a.name}</span>
                <span className="lkx-qp-sub">{a.reaction} · {a.severity[0].toUpperCase() + a.severity.slice(1)}</span>
              </div>
              <span className="lkx-qp-meta">{a.type} · {a.noted}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (kind === "vitals") {
    return (
      <div className="lkx-qp-list">
        {VITALS_TREND.map(v => {
          const cur = v.series[v.series.length - 1];
          return (
            <Row key={v.label}>
              <span className="lkx-qp-name">{v.label}</span>
              <span className="lkx-qp-num" style={{ color: flagColor(v.status) }}>
                {cur} <span className="lkx-qp-unit">{v.unit}</span>
                {v.status !== "normal" && <span className="lkx-qp-trend"> {TREND[v.trend]}</span>}
              </span>
              <span className="lkx-qp-series">{v.series.join("  \u2192  ")}</span>
            </Row>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function QuickPopover({ kind = "labs", onClose = () => {} }) {
  const cfg = CONFIG[kind] || { title: kind, key: "?" };
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);

  return (
    <div className="lkx-qp" role="dialog" aria-label={cfg.title}>
      <style>{CSS}</style>
      <div className="lkx-qp-head">
        <div className="lkx-qp-title">{cfg.title} <kbd className="lkx-qp-kbd">{cfg.key}</kbd></div>
        <button ref={closeRef} className="lkx-qp-close" onClick={onClose} title="Back to board (Esc)">✕ Esc</button>
      </div>
      <div className="lkx-qp-body">{renderBody(kind)}</div>
    </div>
  );
}

const CSS = `
.lkx-qp {
  --navy:#0b1a30; --navy-2:#081628; --glass:rgba(255,255,255,0.045);
  --stroke:rgba(255,255,255,0.10); --stroke-hi:rgba(255,255,255,0.2);
  --text:#e8eef7; --muted:#9fb3c8; --muted-2:#6b7f96;
  --teal:#5eead4; --gold:#e6c878; --red:#fb7185; --amber:#fbbf24; --green:#4ade80;
  position:fixed; top:14vh; left:50%; transform:translateX(-50%);
  width:clamp(360px, 90vw, 520px); max-height:72vh; z-index:55;
  display:flex; flex-direction:column;
  background:linear-gradient(180deg, var(--navy), var(--navy-2));
  border:1px solid var(--stroke); border-radius:14px;
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.85);
  font-family:'DM Sans', system-ui, sans-serif; color:var(--text);
  animation:lkx-qp-in 160ms cubic-bezier(0.2,0.7,0.2,1) both;
}
@keyframes lkx-qp-in { from{ opacity:0; transform:translateX(-50%) translateY(-8px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }

.lkx-qp-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--stroke); flex-shrink:0; }
.lkx-qp-title { font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px; }
.lkx-qp-kbd { font-family:'JetBrains Mono',monospace; font-size:10px; padding:1px 6px; border-radius:4px; background:var(--glass); border:1px solid var(--stroke); color:var(--muted); font-weight:500; }
.lkx-qp-close { background:transparent; border:1px solid var(--stroke); color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:10px; padding:3px 8px; border-radius:6px; cursor:pointer; transition:all .13s; }
.lkx-qp-close:hover { color:var(--text); border-color:var(--stroke-hi); }
.lkx-qp-close:focus-visible { outline:2px solid var(--teal); outline-offset:2px; }

.lkx-qp-body { padding:14px 16px; overflow-y:auto; }
.lkx-qp-body::-webkit-scrollbar { width:4px; }
.lkx-qp-body::-webkit-scrollbar-thumb { background:rgba(42,79,122,0.5); border-radius:2px; }

.lkx-qp-stack { display:flex; flex-direction:column; gap:12px; }
.lkx-qp-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 16px; }
.lkx-qp-grid > div, .lkx-qp-stack > div { display:flex; flex-direction:column; gap:2px; }
.lkx-qp-k { font-size:9px; letter-spacing:1.2px; text-transform:uppercase; color:var(--muted-2); }
.lkx-qp-v { font-size:13px; color:var(--text); }
.lkx-qp-mono { font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text); }
.lkx-qp-note { margin:0; font-size:13px; line-height:1.55; color:var(--muted); }

.lkx-qp-list { display:flex; flex-direction:column; gap:2px; }
.lkx-qp-row { display:flex; align-items:center; gap:12px; padding:8px 8px; border-radius:8px; }
.lkx-qp-row:nth-child(odd) { background:rgba(255,255,255,0.02); }
.lkx-qp-name { flex:1; font-size:13px; min-width:0; }
.lkx-qp-num { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:500; flex-shrink:0; }
.lkx-qp-unit { font-size:10px; color:var(--muted-2); }
.lkx-qp-flagtag { font-weight:700; }
.lkx-qp-trend { font-size:12px; }
.lkx-qp-time { font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--muted-2); flex-shrink:0; width:42px; text-align:right; }
.lkx-qp-series { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--muted-2); flex-shrink:0; }

.lkx-qp-card { padding:10px 12px; border:1px solid var(--stroke); border-radius:10px; background:var(--glass); }
.lkx-qp-cardhead { display:flex; align-items:center; gap:10px; margin-bottom:5px; }
.lkx-qp-status { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700; padding:2px 7px; border-radius:20px; letter-spacing:0.06em; }
.lkx-qp-status.final { color:var(--green); background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.3); }
.lkx-qp-status.prelim { color:var(--amber); background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.3); }

.lkx-qp-allergy { display:flex; align-items:center; gap:11px; padding:9px 8px; border-radius:8px; }
.lkx-qp-allergy:nth-child(odd) { background:rgba(255,255,255,0.02); }
.lkx-qp-glyph { font-size:12px; flex-shrink:0; }
.lkx-qp-allergy-main { flex:1; display:flex; flex-direction:column; gap:1px; min-width:0; }
.lkx-qp-sub { font-size:11px; color:var(--muted); }
.lkx-qp-meta { font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--muted-2); flex-shrink:0; }
`;