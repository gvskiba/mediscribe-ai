import { useState, useEffect, useRef, useMemo } from "react";

const COLORS = {
  teal:"#5eead4", gold:"#e6c878", blue:"#60a5fa", purple:"#a78bfa",
  orange:"#fb923c", coral:"#fb7185", green:"#4ade80", cyan:"#22d3ee",
};

const HUBS = [
  { icon:"CP",  name:"Chest Pain",        cat:"Cardiac",        badge:"HEART", color:COLORS.coral,  route:"CardiacRiskPage" },
  { icon:"ECG", name:"ECG",               cat:"Cardiac",        badge:"ACC",   color:COLORS.cyan,   route:"ECGHub" },
  { icon:"RES", name:"Resuscitation",     cat:"Cardiac",        badge:"AHA",   color:COLORS.coral,  route:"ResusHub" },
  { icon:"AIR", name:"Airway",            cat:"Pulmonary",      badge:"DAS",   color:COLORS.blue,   route:"AirwayHub" },
  { icon:"VEN", name:"Ventilator",        cat:"Pulmonary",      badge:"ARDS",  color:COLORS.blue,   route:"VentPage" },
  { icon:"DYS", name:"Dyspnea",           cat:"Pulmonary",      badge:"GUIDE", color:COLORS.blue,   route:"DyspneaHub" },
  { icon:"SEP", name:"Sepsis",            cat:"Critical Care",  badge:"SSC",   color:COLORS.orange, route:"SepsisHub" },
  { icon:"SHK", name:"Shock",             cat:"Critical Care",  badge:"UNI",   color:COLORS.orange, route:"ShockHub" },
  { icon:"STK", name:"Stroke",            cat:"Neurology",      badge:"AHA",   color:COLORS.purple, route:"StrokeHub" },
  { icon:"SZ",  name:"Seizure",           cat:"Neurology",      badge:"AES",   color:COLORS.purple, route:"SeizureHub" },
  { icon:"HA",  name:"Headache",          cat:"Neurology",      badge:"GUIDE", color:COLORS.purple, route:"HeadacheHub" },
  { icon:"TRA", name:"Trauma",            cat:"Trauma",         badge:"ATLS",  color:COLORS.orange, route:"TraumaHub" },
  { icon:"ORT", name:"Ortho",             cat:"Trauma",         badge:"REF",   color:COLORS.gold,   route:"OrthoHub" },
  { icon:"TOX", name:"Toxicology",        cat:"Toxicology",     badge:"ACMT",  color:COLORS.green,  route:"ToxicologyHub" },
  { icon:"IMG", name:"Imaging",           cat:"Diagnostics",    badge:"AI",    color:COLORS.cyan,   route:"ImagingInterpreter" },
  { icon:"US",  name:"POCUS",             cat:"Diagnostics",    badge:"ACEP",  color:COLORS.cyan,   route:"POCUSHub" },
  { icon:"LAB", name:"Lab Interpreter",   cat:"Diagnostics",    badge:"AI",    color:COLORS.green,  route:"LabHub" },
  { icon:"LYT", name:"Electrolytes",      cat:"Metabolic",      badge:"AB",    color:COLORS.teal,   route:"ElectrolyteAcidBaseHub" },
  { icon:"DRM", name:"Dermatology",       cat:"Dermatology",    badge:"LRINEC",color:COLORS.orange, route:"DermatologyHub" },
  { icon:"PED", name:"Pediatric",         cat:"Pediatrics",     badge:"PALS",  color:COLORS.blue,   route:"PedsHub" },
  { icon:"ANA", name:"Anamnesis",         cat:"FHIR",           badge:"TEFCA", color:COLORS.cyan,   route:"AnamnesisPage" },
  { icon:"RX",  name:"Pharmacology",      cat:"Pharmacology",   badge:"UNI",   color:COLORS.green,  route:"UnifiedPharmacologyHub" },
  { icon:"NPI", name:"New Patient Input", cat:"Documentation",  badge:"NPI",   color:COLORS.teal,   route:"NewPatientInput" },
  { icon:"ORD", name:"Order Generator",   cat:"Documentation",  badge:"CPOE",  color:COLORS.blue,   route:"OrderGeneratorHub" },
  { icon:"COD", name:"Autocoder",         cat:"Documentation",  badge:"ICD",   color:COLORS.gold,   route:"AutocoderHub" },
];

const CAT_ORDER = ["Cardiac","Pulmonary","Critical Care","Neurology","Trauma","Toxicology","Diagnostics","Metabolic","Dermatology","Pediatrics","FHIR","Pharmacology","Documentation"];

const DEFAULT_PATIENT = { name:"DOE, JANE", esi:2, age:54, sex:"F", cc:"Chest pain" };

function matches(h, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return h.name.toLowerCase().includes(s) || h.cat.toLowerCase().includes(s) || h.badge.toLowerCase().includes(s);
}

export default function HubTakeover({
  patient = DEFAULT_PATIENT,
  onClose = () => {},
  onOpenHub = () => {},
  renderHub = null,
  topOffset = 68,
}) {
  const [query, setQuery]   = useState("");
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [selected]);

  const flat = useMemo(() => HUBS.filter(h => matches(h, query)), [query]);
  useEffect(() => { setCursor(0); }, [query]);

  const open = (h) => { setSelected(h); onOpenHub(h.route); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && flat[cursor]) { e.preventDefault(); open(flat[cursor]); }
  };

  const grouped = CAT_ORDER
    .map(cat => ({ cat, items: flat.filter(h => h.cat === cat) }))
    .filter(g => g.items.length);

  return (
    <div className="lkx-ht" style={{ top: topOffset + 14, left: 16, right: 16, bottom: 16 }} role="dialog" aria-label="Clinical hubs">
      <style>{CSS}</style>

      <div className="lkx-ht-head">
        <div className="lkx-ht-title">
          {selected ? (
            <button className="lkx-ht-back" onClick={() => setSelected(null)}>‹ All hubs</button>
          ) : (
            <>Hubs <kbd className="lkx-ht-kbd">h</kbd></>
          )}
        </div>
        <div className="lkx-ht-scope">
          <span className="lkx-ht-scope-name">{patient.name}</span>
          {patient.esi != null && <span className="lkx-ht-scope-esi">ESI {patient.esi}</span>}
          {patient.cc && <span className="lkx-ht-scope-cc">{patient.cc}</span>}
        </div>
        <button className="lkx-ht-close" onClick={onClose} title="Back to board (Esc)">✕ Esc</button>
      </div>

      {selected ? (
        <div className="lkx-ht-pane">
          {renderHub ? renderHub(selected) : (
            <div className="lkx-ht-placeholder">
              <div className="lkx-ht-ph-icon" style={{ color: selected.color, background: selected.color + "16", borderColor: selected.color + "40" }}>{selected.icon}</div>
              <div className="lkx-ht-ph-name">{selected.name} Hub</div>
              <div className="lkx-ht-ph-sub">
                In the live app, the {selected.name} hub mounts here — scoped to {patient.name}, with the board still underneath. Pass a renderHub prop to wire the real component.
              </div>
              <button className="lkx-ht-ph-back" onClick={() => setSelected(null)}>‹ Back to all hubs</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            className="lkx-ht-search"
            type="text"
            spellCheck={false}
            autoComplete="off"
            placeholder="Search hubs by name, system, or guideline..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="lkx-ht-body">
            {flat.length === 0 && <div className="lkx-ht-empty">No hubs match "{query}"</div>}
            {grouped.map(g => (
              <div className="lkx-ht-group" key={g.cat}>
                <div className="lkx-ht-cat">{g.cat}</div>
                <div className="lkx-ht-grid">
                  {g.items.map(h => {
                    const idx = flat.indexOf(h);
                    return (
                      <button
                        key={h.route + h.name}
                        className={"lkx-ht-card" + (idx === cursor ? " sel" : "")}
                        style={{ borderLeftColor: h.color }}
                        onMouseEnter={() => setCursor(idx)}
                        onClick={() => open(h)}
                      >
                        <span className="lkx-ht-card-icon" style={{ color: h.color, background: h.color + "1a", borderColor: h.color + "40" }}>{h.icon}</span>
                        <span className="lkx-ht-card-name">{h.name}</span>
                        <span className="lkx-ht-card-badge" style={{ color: h.color, borderColor: h.color + "55", background: h.color + "14" }}>{h.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CSS = `
.lkx-ht {
  --navy:#0b1a30; --navy-2:#081628; --glass:rgba(255,255,255,0.045);
  --stroke:rgba(255,255,255,0.10); --stroke-hi:rgba(255,255,255,0.2);
  --text:#e8eef7; --muted:#9fb3c8; --muted-2:#6b7f96;
  --teal:#5eead4; --gold:#e6c878;
  position:fixed; z-index:56;
  display:flex; flex-direction:column;
  background:linear-gradient(180deg, var(--navy), var(--navy-2));
  border:1px solid var(--stroke); border-radius:16px;
  box-shadow:0 40px 120px -24px rgba(0,0,0,0.9);
  font-family:'DM Sans', system-ui, sans-serif; color:var(--text);
  overflow:hidden;
  animation:lkx-ht-in 200ms cubic-bezier(0.2,0.7,0.2,1) both;
}
@keyframes lkx-ht-in { from{ opacity:0; transform:scale(0.985); } to{ opacity:1; transform:none; } }

.lkx-ht-head { display:flex; align-items:center; gap:16px; padding:16px 20px; border-bottom:1px solid var(--stroke); flex-shrink:0; }
.lkx-ht-title { font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px; flex-shrink:0; }
.lkx-ht-kbd { font-family:'JetBrains Mono',monospace; font-size:11px; padding:1px 6px; border-radius:4px; background:var(--glass); border:1px solid var(--stroke); color:var(--muted); font-weight:500; }
.lkx-ht-back { background:transparent; border:1px solid var(--stroke); color:var(--text); font-size:13px; padding:5px 12px; border-radius:7px; cursor:pointer; transition:all .13s; }
.lkx-ht-back:hover { border-color:var(--stroke-hi); }
.lkx-ht-scope { flex:1; display:flex; align-items:center; gap:9px; justify-content:center; min-width:0; }
.lkx-ht-scope-name { font-size:13px; font-weight:600; white-space:nowrap; }
.lkx-ht-scope-esi { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; color:var(--gold); background:rgba(230,200,120,0.12); border:1px solid rgba(230,200,120,0.3); border-radius:4px; padding:1px 6px; }
.lkx-ht-scope-cc { font-size:12px; color:var(--teal); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lkx-ht-close { background:transparent; border:1px solid var(--stroke); color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:10px; padding:4px 9px; border-radius:6px; cursor:pointer; transition:all .13s; flex-shrink:0; }
.lkx-ht-close:hover { color:var(--text); border-color:var(--stroke-hi); }

.lkx-ht-search { margin:16px 20px 8px; padding:11px 14px; border-radius:10px; background:rgba(11,30,54,0.85); border:1.5px solid var(--stroke); color:var(--text); font-size:14px; outline:none; caret-color:var(--teal); transition:border-color .16s, box-shadow .16s; }
.lkx-ht-search::placeholder { color:var(--muted-2); }
.lkx-ht-search:focus { border-color:rgba(94,234,212,0.5); box-shadow:0 0 0 3px rgba(94,234,212,0.08); }

.lkx-ht-body { flex:1; overflow-y:auto; padding:6px 20px 20px; }
.lkx-ht-body::-webkit-scrollbar { width:5px; }
.lkx-ht-body::-webkit-scrollbar-thumb { background:rgba(42,79,122,0.5); border-radius:3px; }
.lkx-ht-empty { padding:40px; text-align:center; color:var(--muted-2); font-size:13px; }
.lkx-ht-group { margin-bottom:16px; }
.lkx-ht-cat { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--muted-2); margin:8px 2px; }
.lkx-ht-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:9px; }
.lkx-ht-card { display:flex; align-items:center; gap:9px; padding:11px 12px; border-radius:10px; cursor:pointer; text-align:left; color:var(--text); background:rgba(8,22,40,0.6); border:1px solid var(--stroke); border-left:3px solid var(--stroke); transition:transform .13s, border-color .13s, background .13s; }
.lkx-ht-card:hover, .lkx-ht-card.sel { transform:translateY(-2px); background:rgba(255,255,255,0.04); }
.lkx-ht-card.sel { box-shadow:0 0 0 1px var(--stroke-hi); }
.lkx-ht-card-icon { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; letter-spacing:0.03em; width:32px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid; flex-shrink:0; }
.lkx-ht-card-name { flex:1; font-size:13px; font-weight:600; min-width:0; }
.lkx-ht-card-badge { font-family:'JetBrains Mono',monospace; font-size:7.5px; font-weight:700; padding:2px 6px; border-radius:20px; border:1px solid; letter-spacing:0.05em; flex-shrink:0; }

.lkx-ht-pane { flex:1; overflow-y:auto; display:flex; }
.lkx-ht-placeholder { margin:auto; text-align:center; max-width:440px; padding:40px; }
.lkx-ht-ph-icon { font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:700; letter-spacing:0.04em; width:84px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:14px; border:1px solid; margin:0 auto 16px; }
.lkx-ht-ph-name { font-size:22px; font-weight:700; margin-bottom:10px; }
.lkx-ht-ph-sub { font-size:13px; line-height:1.6; color:var(--muted); margin-bottom:20px; }
.lkx-ht-ph-back { background:rgba(94,234,212,0.08); border:1px solid rgba(94,234,212,0.35); color:var(--teal); font-size:13px; font-weight:600; padding:8px 16px; border-radius:8px; cursor:pointer; transition:all .14s; }
.lkx-ht-ph-back:hover { background:rgba(94,234,212,0.16); }
`;