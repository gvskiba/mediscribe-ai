import { useState, useEffect } from "react";

const SEVERITY = {
  severe: { glyph: "\u25B2", label: "Severe", varName: "--lkx-red" },
  moderate: { glyph: "\u25C6", label: "Moderate", varName: "--lkx-amber" },
  mild: { glyph: "\u25CF", label: "Mild", varName: "--lkx-muted" },
};
const SEVERITY_RANK = { severe: 3, moderate: 2, mild: 1 };

const ESI = {
  1: { color: "--lkx-red", label: "Resuscitation" },
  2: { color: "--lkx-orange", label: "Emergent" },
  3: { color: "--lkx-amber", label: "Urgent" },
  4: { color: "--lkx-green", label: "Less urgent" },
  5: { color: "--lkx-blue", label: "Non-urgent" },
};

const TREND = { up: "\u2191", down: "\u2193", flat: "\u2192" };

function vitalVar(status) {
  if (status === "critical") return "--lkx-red";
  if (status === "high" || status === "low") return "--lkx-amber";
  return "--lkx-text";
}

function formatLos(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

const DEFAULT_PATIENT = {
  name: "DOE, JANE",
  age: 54,
  sex: "F",
  mrn: "0042318",
  room: "B-12",
  esi: 2,
  chiefComplaint: "Chest pain",
  arrivalEpochMs: Date.now() - 192 * 60000,
};

const DEFAULT_VITALS = [
  { key: "hr", label: "HR", value: "104", unit: "bpm", status: "high", trend: "up" },
  { key: "bp", label: "BP", value: "148/92", unit: "mmHg", status: "high", trend: "up" },
  { key: "rr", label: "RR", value: "18", unit: "/min", status: "normal", trend: "flat" },
  { key: "temp", label: "Temp", value: "100.9", unit: "\u00B0F", status: "high", trend: "up" },
  { key: "spo2", label: "SpO2", value: "96", unit: "%", status: "normal", trend: "flat" },
];

const DEFAULT_ALLERGIES = [
  { name: "Penicillin", reaction: "Anaphylaxis", severity: "severe" },
  { name: "Iodinated contrast", reaction: "Urticaria", severity: "moderate" },
  { name: "Codeine", reaction: "Nausea/Vomiting", severity: "mild" },
];

const DEFAULT_FLAGS = { codeStatus: "Full Code", isolation: null };

function AcuityPip({ esi }) {
  const meta = ESI[esi] || ESI[3];
  const crit = esi === 1;
  return (
    <span
      className={"lkx-pb-pip" + (crit ? " lkx-pb-pip--crit" : "")}
      style={{ color: "var(" + meta.color + ")", borderColor: "var(" + meta.color + ")" }}
      title={"ESI " + esi + " \u2014 " + meta.label}
      aria-label={"Acuity ESI " + esi + ", " + meta.label}
    >
      {esi}
    </span>
  );
}

function AllergyChip({ a }) {
  const meta = SEVERITY[a.severity] || SEVERITY.mild;
  return (
    <span className="lkx-pb-allergy" title={a.name + " \u2014 " + a.reaction + " (" + meta.label + ")"}>
      <span className="lkx-pb-allergy-glyph" style={{ color: "var(" + meta.varName + ")" }} aria-hidden="true">
        {meta.glyph}
      </span>
      <span className="lkx-pb-allergy-name">{a.name}</span>
    </span>
  );
}

function VitalStat({ v }) {
  const varName = vitalVar(v.status);
  const abnormal = v.status !== "normal";
  return (
    <span className="lkx-pb-vital" title={v.label + " " + v.value + " " + v.unit + (abnormal ? " (" + v.status + ")" : "")}>
      <span className="lkx-pb-vital-label">{v.label}</span>
      <span className="lkx-pb-vital-value" style={{ color: "var(" + varName + ")" }}>
        {v.value}
        {abnormal && <span className="lkx-pb-vital-trend" aria-hidden="true">{TREND[v.trend] || ""}</span>}
      </span>
    </span>
  );
}

export default function PatientBanner({
  patient = DEFAULT_PATIENT,
  vitals = DEFAULT_VITALS,
  allergies = DEFAULT_ALLERGIES,
  flags = DEFAULT_FLAGS,
  embedded = false,
  onOpenAllergies = () => {},
  onOpenVitals = () => {},
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const los = formatLos(now - (patient.arrivalEpochMs || now));
  const worstSeverity = allergies.reduce(
    (acc, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[acc] ? a.severity : acc),
    "mild"
  );
  const hasSevere = allergies.length > 0 && worstSeverity === "severe";

  return (
    <div className={"lkx-pb-root" + (embedded ? " lkx-pb-root--embedded" : "")} role="region" aria-label="Patient banner">
      <style>{CSS}</style>

      <div className="lkx-pb-zone lkx-pb-identity">
        <AcuityPip esi={patient.esi} />
        <div className="lkx-pb-id-text">
          <div className="lkx-pb-name">{patient.name}</div>
          <div className="lkx-pb-id-meta">
            <span>{patient.age}{patient.sex}</span>
            <span className="lkx-pb-dot">&middot;</span>
            <span className="lkx-pb-mono">MRN {patient.mrn}</span>
            <span className="lkx-pb-dot">&middot;</span>
            <span className="lkx-pb-room">{patient.room}</span>
          </div>
        </div>
      </div>

      <div className="lkx-pb-div" />

      <div className="lkx-pb-zone lkx-pb-context">
        <div className="lkx-pb-cc">{patient.chiefComplaint}</div>
        <div className="lkx-pb-los">
          <span className="lkx-pb-los-label">LOS</span>
          <span className="lkx-pb-mono">{los}</span>
        </div>
      </div>

      <div className="lkx-pb-div" />

      <button
        type="button"
        className={"lkx-pb-zone lkx-pb-allergies lkx-pb-interactive" + (hasSevere ? " lkx-pb-allergies--severe" : "")}
        onClick={onOpenAllergies}
        title="Open allergy detail (a)"
      >
        <span className="lkx-pb-zone-label">ALLERGIES <kbd className="lkx-pb-kbd">a</kbd></span>
        <span className="lkx-pb-allergy-list">
          {allergies.length === 0 ? (
            <span className="lkx-pb-nka">NKDA</span>
          ) : (
            allergies.map((a) => <AllergyChip key={a.name} a={a} />)
          )}
        </span>
        <span className="lkx-pb-flags">
          <span className="lkx-pb-flag">{flags.codeStatus}</span>
          {flags.isolation && <span className="lkx-pb-flag lkx-pb-flag--iso">{flags.isolation} precautions</span>}
        </span>
      </button>

      <div className="lkx-pb-div" />

      <button
        type="button"
        className="lkx-pb-zone lkx-pb-vitals lkx-pb-interactive"
        onClick={onOpenVitals}
        title="Open vitals trend (v)"
      >
        <span className="lkx-pb-zone-label">VITALS <kbd className="lkx-pb-kbd">v</kbd></span>
        <span className="lkx-pb-vital-list">
          {vitals.map((v) => <VitalStat key={v.key} v={v} />)}
        </span>
      </button>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.lkx-pb-root {
  --lkx-navy-900:#08111f; --lkx-navy-800:#0b1a30; --lkx-navy-700:#102443;
  --lkx-glass:rgba(255,255,255,0.045); --lkx-glass-2:rgba(255,255,255,0.07);
  --lkx-stroke:rgba(255,255,255,0.10); --lkx-stroke-hi:rgba(255,255,255,0.20);
  --lkx-text:#e8eef7; --lkx-muted:#9fb3c8; --lkx-muted-2:#6b7f96;
  --lkx-teal:#5eead4; --lkx-gold:#e6c878;
  --lkx-red:#fb7185; --lkx-amber:#fbbf24; --lkx-orange:#fb923c;
  --lkx-green:#4ade80; --lkx-blue:#60a5fa;

  position: fixed; top: 0; left: 0; right: 0; z-index: 60;
  display: flex; align-items: stretch; gap: 0;
  height: 68px; padding: 0 16px;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--lkx-text);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0)) ,
    linear-gradient(180deg, var(--lkx-navy-800), var(--lkx-navy-900));
  border-bottom: 1px solid var(--lkx-stroke);
  box-shadow: 0 10px 30px -12px rgba(0,0,0,0.7);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  animation: lkx-pb-in 360ms cubic-bezier(0.2,0.7,0.2,1) both;
}
.lkx-pb-root--embedded { position: sticky; }

@keyframes lkx-pb-in { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform:none; } }

.lkx-pb-zone { display:flex; align-items:center; gap:12px; padding:0 16px; }
.lkx-pb-div { width:1px; align-self:center; height:38px; background:linear-gradient(180deg,transparent,var(--lkx-stroke),transparent); }

.lkx-pb-interactive {
  border:0; background:transparent; color:inherit; cursor:pointer; text-align:left;
  border-radius:10px; transition: background 140ms ease, box-shadow 140ms ease;
}
.lkx-pb-interactive:hover { background: var(--lkx-glass); box-shadow: inset 0 0 0 1px var(--lkx-stroke); }
.lkx-pb-interactive:focus-visible { outline:2px solid var(--lkx-teal); outline-offset:2px; }

.lkx-pb-pip {
  flex:0 0 auto; width:30px; height:30px; border-radius:9px;
  display:grid; place-items:center; font-family:'JetBrains Mono',monospace;
  font-weight:500; font-size:15px; border:1.5px solid; background:rgba(255,255,255,0.03);
}
.lkx-pb-pip--crit { animation: lkx-pb-pulse 1.6s ease-in-out infinite; }
@keyframes lkx-pb-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(251,113,133,0.5);} 50%{ box-shadow:0 0 0 6px rgba(251,113,133,0);} }

.lkx-pb-id-text { display:flex; flex-direction:column; gap:2px; }
.lkx-pb-name { font-family:'Playfair Display',Georgia,serif; font-weight:700; font-size:18px; letter-spacing:0.2px; line-height:1; color:var(--lkx-text); }
.lkx-pb-id-meta { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--lkx-muted); }
.lkx-pb-mono { font-family:'JetBrains Mono',monospace; font-size:11.5px; }
.lkx-pb-dot { color:var(--lkx-muted-2); }
.lkx-pb-room { color:var(--lkx-teal); font-weight:600; }

.lkx-pb-context { flex-direction:column; align-items:flex-start; gap:3px; }
.lkx-pb-cc { font-size:14px; font-weight:600; color:var(--lkx-text); }
.lkx-pb-los { display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--lkx-muted); }
.lkx-pb-los-label { letter-spacing:1px; color:var(--lkx-muted-2); }

.lkx-pb-zone-label { font-size:9.5px; letter-spacing:1.4px; color:var(--lkx-muted-2); display:flex; align-items:center; gap:6px; }
.lkx-pb-kbd { font-family:'JetBrains Mono',monospace; font-size:9.5px; padding:1px 5px; border-radius:4px; background:var(--lkx-glass-2); border:1px solid var(--lkx-stroke); color:var(--lkx-muted); }

.lkx-pb-allergies { flex-direction:column; align-items:flex-start; gap:5px; min-width:0; }
.lkx-pb-allergies--severe { box-shadow: inset 3px 0 0 var(--lkx-red); background: linear-gradient(90deg, rgba(251,113,133,0.10), transparent 60%); }
.lkx-pb-allergy-list { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.lkx-pb-allergy { display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:500; }
.lkx-pb-allergy-glyph { font-size:11px; line-height:1; }
.lkx-pb-allergy-name { color:var(--lkx-text); }
.lkx-pb-nka { font-size:13px; color:var(--lkx-green); font-weight:600; }
.lkx-pb-flags { display:flex; gap:8px; margin-top:1px; }
.lkx-pb-flag { font-size:10.5px; color:var(--lkx-muted); border:1px solid var(--lkx-stroke); border-radius:5px; padding:1px 6px; }
.lkx-pb-flag--iso { color:var(--lkx-amber); border-color:rgba(251,191,36,0.4); }

.lkx-pb-vitals { flex-direction:column; align-items:flex-start; gap:5px; margin-left:auto; }
.lkx-pb-vital-list { display:flex; align-items:center; gap:16px; }
.lkx-pb-vital { display:flex; flex-direction:column; align-items:flex-start; gap:1px; }
.lkx-pb-vital-label { font-size:9.5px; letter-spacing:0.5px; color:var(--lkx-muted-2); }
.lkx-pb-vital-value { font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:500; display:flex; align-items:baseline; gap:3px; }
.lkx-pb-vital-trend { font-size:11px; }

@media (max-width: 1100px) {
  .lkx-pb-context, .lkx-pb-context + .lkx-pb-div { display:none; }
  .lkx-pb-vital:nth-child(n+4) { display:none; }
}
@media (max-width: 820px) {
  .lkx-pb-flags { display:none; }
  .lkx-pb-vital:nth-child(n+3) { display:none; }
}
`;