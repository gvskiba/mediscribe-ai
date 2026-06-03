import { useState, useEffect, useRef, useMemo } from "react";
import { CATEGORIES, liveHubs, suggestHubs, getHubById } from "@/components/hubRegistry";

// ─────────────────────────────────────────────────────────────────────────────
// HubCatalog — reusable catalog surface shared by HubTakeover (overlay) and
// HubLauncherPage (standalone full-page). All hub data comes from hubRegistry.js.
//
// Props:
//   patientContext  — { name, esi, cc, age, sex } | null
//                     When present: "Suggested" rail shown above category groups.
//                     When null:    full catalog only, no patient rail.
//   onSelect        — (hub) => void  — called when user picks a hub
//   autoFocus       — boolean        — whether to focus the search input on mount
// ─────────────────────────────────────────────────────────────────────────────

const CAT_ORDER = CATEGORIES.filter((c) => c !== "All" && c !== "Essential");

function matches(h, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    h.title.toLowerCase().includes(s) ||
    h.category.toLowerCase().includes(s) ||
    h.badge.toLowerCase().includes(s) ||
    h.abbr.toLowerCase().includes(s) ||
    h.subtitle.toLowerCase().includes(s)
  );
}

export default function HubCatalog({ patientContext = null, onSelect, autoFocus = false }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const live = useMemo(() => liveHubs(), []);

  const suggested = useMemo(() => {
    if (!patientContext?.cc) return [];
    return suggestHubs(patientContext.cc)
      .map(getHubById)
      .filter((h) => h && h.live);
  }, [patientContext?.cc]);

  const filtered = useMemo(
    () => (query ? live.filter((h) => matches(h, query)) : live),
    [query, live]
  );

  useEffect(() => { setCursor(0); }, [query]);

  const groups = useMemo(() => {
    if (query) {
      return CAT_ORDER
        .map((cat) => ({ cat, items: filtered.filter((h) => h.category === cat) }))
        .filter((g) => g.items.length);
    }
    const suggestedSet = new Set(suggested.map((h) => h.id));
    const rest = live.filter((h) => !suggestedSet.has(h.id));
    const catGroups = CAT_ORDER
      .map((cat) => ({ cat, items: rest.filter((h) => h.category === cat) }))
      .filter((g) => g.items.length);
    return suggested.length && patientContext?.cc
      ? [{ cat: `Suggested \u00b7 ${patientContext.cc}`, items: suggested, hot: true }, ...catGroups]
      : catGroups;
  }, [query, filtered, live, suggested, patientContext?.cc]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const open = (h) => { onSelect && onSelect(h); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && flat[cursor]) { e.preventDefault(); open(flat[cursor]); }
  };

  return (
    <div className="lkx-hc-root">
      <style>{CSS}</style>
      <input
        ref={inputRef}
        className="lkx-hc-search"
        type="text"
        spellCheck={false}
        autoComplete="off"
        placeholder="Search hubs by name, system, or guideline..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
      />
      <div className="lkx-hc-body">
        {flat.length === 0 && (
          <div className="lkx-hc-empty">No hubs match "{query}"</div>
        )}
        {groups.map((g) => (
          <div className="lkx-hc-group" key={g.cat}>
            <div className={"lkx-hc-cat" + (g.hot ? " hot" : "")}>{g.cat}</div>
            <div className="lkx-hc-grid">
              {g.items.map((h) => {
                const idx = flat.indexOf(h);
                return (
                  <button
                    key={h.id}
                    className={"lkx-hc-card" + (idx === cursor ? " sel" : "")}
                    style={{ borderLeftColor: h.color }}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => open(h)}
                  >
                    <span
                      className="lkx-hc-card-icon"
                      style={{ color: h.color, background: h.color + "1a", borderColor: h.color + "40" }}
                    >
                      {h.icon}
                    </span>
                    <span className="lkx-hc-card-name">{h.title}</span>
                    <span
                      className="lkx-hc-card-badge"
                      style={{ color: h.color, borderColor: h.color + "55", background: h.color + "14" }}
                    >
                      {h.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.lkx-hc-root {
  --navy:#0b1a30; --navy-2:#081628; --glass:rgba(255,255,255,0.045);
  --stroke:rgba(255,255,255,0.10); --stroke-hi:rgba(255,255,255,0.2);
  --text:#e8eef7; --muted:#9fb3c8; --muted-2:#6b7f96;
  --teal:#5eead4; --gold:#e6c878;
  display:flex; flex-direction:column; height:100%; overflow:hidden;
  font-family:"DM Sans", system-ui, sans-serif; color:var(--text);
}
.lkx-hc-search {
  flex-shrink:0; margin:16px 20px 8px;
  padding:11px 14px; border-radius:10px;
  background:rgba(11,30,54,0.85); border:1.5px solid var(--stroke);
  color:var(--text); font-size:14px; outline:none; caret-color:var(--teal);
  transition:border-color .16s, box-shadow .16s;
}
.lkx-hc-search::placeholder { color:var(--muted-2); }
.lkx-hc-search:focus { border-color:rgba(94,234,212,0.5); box-shadow:0 0 0 3px rgba(94,234,212,0.08); }

.lkx-hc-body { flex:1; overflow-y:auto; padding:6px 20px 20px; }
.lkx-hc-body::-webkit-scrollbar { width:5px; }
.lkx-hc-body::-webkit-scrollbar-thumb { background:rgba(42,79,122,0.5); border-radius:3px; }
.lkx-hc-empty { padding:40px; text-align:center; color:var(--muted-2); font-size:13px; }
.lkx-hc-group { margin-bottom:16px; }
.lkx-hc-cat { font-family:"JetBrains Mono",monospace; font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--muted-2); margin:8px 2px; }
.lkx-hc-cat.hot { color:var(--teal); }
.lkx-hc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:9px; }
.lkx-hc-card { display:flex; align-items:center; gap:9px; padding:11px 12px; border-radius:10px; cursor:pointer; text-align:left; color:var(--text); background:rgba(8,22,40,0.6); border:1px solid var(--stroke); border-left:3px solid var(--stroke); transition:transform .13s, border-color .13s, background .13s; }
.lkx-hc-card:hover, .lkx-hc-card.sel { transform:translateY(-2px); background:rgba(255,255,255,0.04); }
.lkx-hc-card.sel { box-shadow:0 0 0 1px var(--stroke-hi); }
.lkx-hc-card-icon { font-size:15px; line-height:1; width:32px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid; flex-shrink:0; }
.lkx-hc-card-name { flex:1; font-size:13px; font-weight:600; min-width:0; }
.lkx-hc-card-badge { font-family:"JetBrains Mono",monospace; font-size:7.5px; font-weight:700; padding:2px 6px; border-radius:20px; border:1px solid; letter-spacing:0.05em; flex-shrink:0; }
`;