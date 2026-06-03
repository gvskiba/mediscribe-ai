import { useState, useEffect, useRef } from "react";
import HubCatalog from "@/components/HubCatalog";
// Note: search/grid/card CSS lives in HubCatalog.jsx — HubTakeover only provides the overlay shell.

// ─────────────────────────────────────────────────────────────────────────────
// HubTakeover — the clinical hub launcher as a takeover overlay (key: h).
//
// Now consumes hubRegistry.js as the single source of truth. Its old embedded
// HUBS array (a fourth diverging catalog with PascalCase routes that 404'd) is
// gone. Routes are canonical, dead (live:false) hubs never surface, and when a
// patient chief-complaint is present a "Suggested" rail leads using suggestHubs().
//
// Adjust the import path to wherever hubRegistry.js lives in your tree.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PATIENT = { name:"DOE, JANE", esi:2, age:54, sex:"F", cc:"Chest pain" };

export default function HubTakeover({
  patient = DEFAULT_PATIENT,
  onClose = () => {},
  onOpenHub = () => {},
  renderHub = null,
  topOffset = 68,
}) {
  const [selected, setSelected] = useState(null);
  const catalogRef = useRef(null);

  useEffect(() => { if (!selected) catalogRef.current?.querySelector("input")?.focus(); }, [selected]);

  const open = (h) => { setSelected(h); onOpenHub(h.route); };

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
              <div className="lkx-ht-ph-name">{selected.title}</div>
              <div className="lkx-ht-ph-sub">
                In the live app, the {selected.title} hub mounts here — scoped to {patient.name}, with the board still underneath. Pass a renderHub prop to wire the real component.
              </div>
              <button className="lkx-ht-ph-back" onClick={() => setSelected(null)}>&#8249; Back to all hubs</button>
            </div>
          )}
        </div>
      ) : (
        <div ref={catalogRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <HubCatalog
            patientContext={patient}
            onSelect={open}
            autoFocus={true}
          />
        </div>
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


.lkx-ht-pane { flex:1; overflow-y:auto; display:flex; }
.lkx-ht-placeholder { margin:auto; text-align:center; max-width:440px; padding:40px; }
.lkx-ht-ph-icon { font-size:30px; line-height:1; width:84px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:14px; border:1px solid; margin:0 auto 16px; }
.lkx-ht-ph-name { font-size:22px; font-weight:700; margin-bottom:10px; }
.lkx-ht-ph-sub { font-size:13px; line-height:1.6; color:var(--muted); margin-bottom:20px; }
.lkx-ht-ph-back { background:rgba(94,234,212,0.08); border:1px solid rgba(94,234,212,0.35); color:var(--teal); font-size:13px; font-weight:600; padding:8px 16px; border-radius:8px; cursor:pointer; transition:all .14s; }
.lkx-ht-ph-back:hover { background:rgba(94,234,212,0.16); }
`;