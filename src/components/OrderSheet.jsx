import { useState, useEffect, useRef, useMemo } from "react";

const CAT = ["Labs", "Imaging", "Meds", "Procedures"];

const CATALOG = [
  { id:"cbc",     name:"CBC",                       cat:"Labs" },
  { id:"bmp",     name:"BMP",                       cat:"Labs" },
  { id:"cmp",     name:"CMP",                       cat:"Labs" },
  { id:"trop",    name:"Troponin (hs)",             cat:"Labs" },
  { id:"bnp",     name:"BNP",                       cat:"Labs" },
  { id:"ddimer",  name:"D-dimer",                   cat:"Labs" },
  { id:"lactate", name:"Lactate",                   cat:"Labs" },
  { id:"lfts",    name:"LFTs",                      cat:"Labs" },
  { id:"lipase",  name:"Lipase",                    cat:"Labs" },
  { id:"coags",   name:"PT/INR + PTT",              cat:"Labs" },
  { id:"ts",      name:"Type & Screen",             cat:"Labs" },
  { id:"ua",      name:"Urinalysis",                cat:"Labs" },
  { id:"bcx",     name:"Blood cultures x2",         cat:"Labs" },
  { id:"vbg",     name:"VBG",                       cat:"Labs" },
  { id:"cxr",     name:"Chest X-ray",               cat:"Imaging" },
  { id:"cthead",  name:"CT head w/o contrast",      cat:"Imaging" },
  { id:"ctpe",    name:"CT chest (PE protocol)",    cat:"Imaging", allergyClass:"contrast" },
  { id:"ctap",    name:"CT abd/pelvis w/ contrast", cat:"Imaging", allergyClass:"contrast" },
  { id:"usruq",   name:"US RUQ",                    cat:"Imaging" },
  { id:"xrext",   name:"XR extremity",              cat:"Imaging" },
  { id:"asa",     name:"Aspirin 324 mg PO",         cat:"Meds" },
  { id:"ntg",     name:"Nitroglycerin 0.4 mg SL",   cat:"Meds" },
  { id:"heparin", name:"Heparin gtt",               cat:"Meds" },
  { id:"zofran",  name:"Ondansetron 4 mg IV",       cat:"Meds" },
  { id:"keto",    name:"Ketorolac 15 mg IV",        cat:"Meds" },
  { id:"morphine",name:"Morphine 4 mg IV",          cat:"Meds" },
  { id:"amox",    name:"Amoxicillin 875 mg PO",     cat:"Meds", allergyClass:"penicillin" },
  { id:"ctx",     name:"Ceftriaxone 1 g IV",        cat:"Meds" },
  { id:"apap",    name:"Acetaminophen 1 g PO",      cat:"Meds" },
  { id:"tyl3",    name:"Tylenol #3 (codeine)",      cat:"Meds", allergyClass:"codeine" },
  { id:"nsbolus", name:"NS 1 L bolus",              cat:"Meds" },
  { id:"ecg",     name:"ECG 12-lead",               cat:"Procedures" },
  { id:"iv",      name:"IV access",                 cat:"Procedures" },
  { id:"monitor", name:"Cardiac monitor",           cat:"Procedures" },
  { id:"foley",   name:"Foley catheter",            cat:"Procedures" },
];

const BY_ID = Object.fromEntries(CATALOG.map(o => [o.id, o]));

const QUICK_SETS = [
  { key:"chestpain", label:"Chest Pain", ids:["trop","ecg","cxr","bmp","cbc","asa","monitor"] },
  { key:"sepsis",    label:"Sepsis",     ids:["lactate","cbc","bmp","bcx","ua","nsbolus","ctx"] },
  { key:"abd",       label:"Abd Pain",   ids:["cbc","bmp","lipase","lfts","ua","ctap"] },
];

const DEFAULT_ALLERGIES = [
  { name:"Penicillin" }, { name:"Iodinated contrast" }, { name:"Codeine" },
];

function conflictFor(item, allergies) {
  if (!item.allergyClass) return null;
  const hit = allergies.find(a => (a.name || "").toLowerCase().includes(item.allergyClass));
  return hit ? hit.name : null;
}

export default function OrderSheet({
  allergies = DEFAULT_ALLERGIES,
  onClose = () => {},
  onSign = () => {},
  topOffset = 68,
}) {
  const [query, setQuery]   = useState("");
  const [cat, setCat]       = useState("All");
  const [queue, setQueue]   = useState([]);
  const [cursor, setCursor] = useState(0);
  const [signed, setSigned] = useState(0);
  const inputRef = useRef(null);
  const signTimer = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => () => { if (signTimer.current) clearTimeout(signTimer.current); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return CATALOG.filter(o =>
      (cat === "All" || o.cat === cat) &&
      (!q || o.name.toLowerCase().includes(q) || o.cat.toLowerCase().includes(q))
    );
  }, [query, cat]);

  useEffect(() => { setCursor(0); }, [query, cat]);

  const inQueue = (id) => queue.includes(id);
  const toggle  = (id) => setQueue(q => q.includes(id) ? q.filter(x => x !== id) : [...q, id]);
  const remove  = (id) => setQueue(q => q.filter(x => x !== id));
  const addSet  = (ids) => setQueue(q => Array.from(new Set([...q, ...ids])));

  const queueConflicts = queue
    .map(id => ({ id, name: BY_ID[id]?.name, conflict: conflictFor(BY_ID[id] || {}, allergies) }))
    .filter(x => x.conflict);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && filtered[cursor]) { e.preventDefault(); toggle(filtered[cursor].id); }
  };

  const sign = () => {
    if (!queue.length) return;
    onSign(queue.map(id => BY_ID[id]));
    setSigned(queue.length);
    setQueue([]);
    if (signTimer.current) clearTimeout(signTimer.current);
    signTimer.current = setTimeout(() => setSigned(0), 2600);
  };

  return (
    <div className="lkx-os" style={{ top: topOffset }}>
      <style>{CSS}</style>

      <div className="lkx-os-head">
        <div className="lkx-os-title">Orders <kbd className="lkx-os-kbd">o</kbd></div>
        <div className="lkx-os-headright">
          {queue.length > 0 && <span className="lkx-os-count">{queue.length} queued</span>}
          <button className="lkx-os-close" onClick={onClose} title="Back to board (Esc)">✕ Esc</button>
        </div>
      </div>

      <div className="lkx-os-allergies">
        <span className="lkx-os-allergies-lbl">CHECKING AGAINST</span>
        {allergies.map(a => <span key={a.name} className="lkx-os-allergy">▲ {a.name}</span>)}
      </div>

      <input
        ref={inputRef}
        className="lkx-os-search"
        type="text"
        spellCheck={false}
        autoComplete="off"
        placeholder="Search labs, meds, imaging, procedures..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKey}
      />

      <div className="lkx-os-quick">
        {QUICK_SETS.map(s => (
          <button key={s.key} className="lkx-os-quickchip" onClick={() => addSet(s.ids)}>+ {s.label}</button>
        ))}
      </div>

      <div className="lkx-os-cats">
        {["All", ...CAT].map(c => (
          <button key={c} className={"lkx-os-cat" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="lkx-os-list">
        {filtered.length === 0 && <div className="lkx-os-empty">No orders match "{query}"</div>}
        {filtered.map((o, i) => {
          const conflict = conflictFor(o, allergies);
          const added = inQueue(o.id);
          return (
            <button
              key={o.id}
              className={"lkx-os-row" + (i === cursor ? " sel" : "") + (added ? " added" : "")}
              onMouseEnter={() => setCursor(i)}
              onClick={() => toggle(o.id)}
            >
              <span className="lkx-os-row-name">
                {o.name}
                {conflict && <span className="lkx-os-flag" title={"Allergy conflict: " + conflict}>▲ {conflict}</span>}
              </span>
              <span className="lkx-os-row-cat">{o.cat}</span>
              <span className={"lkx-os-row-add" + (added ? " on" : "")}>{added ? "✓" : "+"}</span>
            </button>
          );
        })}
      </div>

      <div className="lkx-os-queue">
        {signed > 0 && <div className="lkx-os-signed">✓ Signed {signed} order{signed > 1 ? "s" : ""}</div>}
        {queueConflicts.length > 0 && (
          <div className="lkx-os-warn">
            ▲ {queueConflicts.length} allergy conflict{queueConflicts.length > 1 ? "s" : ""} in queue: {queueConflicts.map(c => c.name).join(", ")}
          </div>
        )}
        {queue.length === 0 && signed === 0 && <div className="lkx-os-queue-empty">Queue is empty — add orders above.</div>}
        {queue.length > 0 && (
          <div className="lkx-os-queue-list">
            {queue.map(id => {
              const o = BY_ID[id];
              const conflict = conflictFor(o, allergies);
              return (
                <div key={id} className={"lkx-os-q" + (conflict ? " conflict" : "")}>
                  <span className="lkx-os-q-name">{o.name}{conflict && <span className="lkx-os-flag">▲ {conflict}</span>}</span>
                  <button className="lkx-os-q-x" onClick={() => remove(id)} title="Remove">✕</button>
                </div>
              );
            })}
          </div>
        )}
        <button className="lkx-os-sign" disabled={!queue.length} onClick={sign}>
          {queue.length ? `Sign ${queue.length} order${queue.length > 1 ? "s" : ""}` : "Sign orders"}
        </button>
      </div>
    </div>
  );
}

const CSS = `
.lkx-os {
  --navy:#0b1a30; --navy-2:#081628; --glass:rgba(255,255,255,0.045);
  --stroke:rgba(255,255,255,0.10); --stroke-hi:rgba(255,255,255,0.2);
  --text:#e8eef7; --muted:#9fb3c8; --muted-2:#6b7f96;
  --teal:#5eead4; --teal-deep:#14b8a6; --gold:#e6c878;
  --red:#fb7185; --amber:#fbbf24;
  position:fixed; right:0; bottom:0; z-index:50;
  width:clamp(380px, 42%, 560px);
  display:flex; flex-direction:column;
  background:linear-gradient(180deg, var(--navy), var(--navy-2));
  border-left:1px solid var(--stroke);
  box-shadow:-24px 0 60px -20px rgba(0,0,0,0.8);
  font-family:'DM Sans', system-ui, sans-serif; color:var(--text);
  animation:lkx-os-in 220ms cubic-bezier(0.2,0.7,0.2,1) both;
}
@keyframes lkx-os-in { from{ transform:translateX(40px); opacity:0; } to{ transform:none; opacity:1; } }

.lkx-os-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
.lkx-os-title { font-size:17px; font-weight:700; display:flex; align-items:center; gap:8px; }
.lkx-os-kbd { font-family:'JetBrains Mono',monospace; font-size:10px; padding:1px 6px; border-radius:4px; background:var(--glass); border:1px solid var(--stroke); color:var(--muted); font-weight:500; }
.lkx-os-headright { display:flex; align-items:center; gap:10px; }
.lkx-os-count { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--teal); }
.lkx-os-close { background:transparent; border:1px solid var(--stroke); color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:10px; padding:3px 8px; border-radius:6px; cursor:pointer; transition:all .13s; }
.lkx-os-close:hover { color:var(--text); border-color:var(--stroke-hi); }

.lkx-os-allergies { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:0 16px 10px; }
.lkx-os-allergies-lbl { font-size:8.5px; letter-spacing:1.4px; color:var(--muted-2); }
.lkx-os-allergy { font-size:11px; color:var(--red); font-weight:500; }

.lkx-os-search { margin:0 16px; padding:9px 12px; border-radius:9px; background:rgba(11,30,54,0.85); border:1.5px solid var(--stroke); color:var(--text); font-size:13px; outline:none; caret-color:var(--teal); transition:border-color .16s, box-shadow .16s; }
.lkx-os-search::placeholder { color:var(--muted-2); }
.lkx-os-search:focus { border-color:rgba(94,234,212,0.5); box-shadow:0 0 0 3px rgba(94,234,212,0.08); }

.lkx-os-quick { display:flex; gap:7px; flex-wrap:wrap; padding:10px 16px 4px; }
.lkx-os-quickchip { background:rgba(94,234,212,0.07); border:1px solid rgba(94,234,212,0.25); color:var(--teal); font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:20px; cursor:pointer; transition:all .13s; }
.lkx-os-quickchip:hover { background:rgba(94,234,212,0.15); }

.lkx-os-cats { display:flex; gap:6px; padding:8px 16px; flex-wrap:wrap; }
.lkx-os-cat { background:transparent; border:1px solid var(--stroke); color:var(--muted); font-size:11px; padding:3px 11px; border-radius:7px; cursor:pointer; transition:all .12s; }
.lkx-os-cat:hover { color:var(--text); }
.lkx-os-cat.on { background:var(--glass); color:var(--text); border-color:var(--stroke-hi); }

.lkx-os-list { flex:1; overflow-y:auto; padding:4px 10px; min-height:80px; }
.lkx-os-list::-webkit-scrollbar { width:4px; }
.lkx-os-list::-webkit-scrollbar-thumb { background:rgba(42,79,122,0.5); border-radius:2px; }
.lkx-os-empty { padding:20px; text-align:center; font-size:12px; color:var(--muted-2); }
.lkx-os-row { width:100%; display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; border:1px solid transparent; background:transparent; color:var(--text); cursor:pointer; text-align:left; transition:background .1s; }
.lkx-os-row.sel { background:rgba(94,234,212,0.08); border-color:rgba(94,234,212,0.22); }
.lkx-os-row.added { background:rgba(94,234,212,0.05); }
.lkx-os-row-name { flex:1; font-size:13px; display:flex; align-items:center; gap:8px; min-width:0; }
.lkx-os-row-cat { font-family:'JetBrains Mono',monospace; font-size:8.5px; color:var(--muted-2); letter-spacing:0.5px; flex-shrink:0; }
.lkx-os-row-add { width:20px; height:20px; border-radius:6px; display:grid; place-items:center; font-size:13px; color:var(--muted); border:1px solid var(--stroke); flex-shrink:0; }
.lkx-os-row-add.on { color:var(--teal); border-color:rgba(94,234,212,0.4); }
.lkx-os-flag { font-size:10px; color:var(--red); font-weight:600; white-space:nowrap; }

.lkx-os-queue { border-top:1px solid var(--stroke); padding:12px 16px; background:rgba(6,12,25,0.5); }
.lkx-os-signed { font-size:12px; color:var(--teal); font-weight:600; margin-bottom:8px; }
.lkx-os-warn { font-size:11.5px; color:var(--red); font-weight:600; margin-bottom:8px; padding:6px 9px; background:rgba(251,113,133,0.1); border:1px solid rgba(251,113,133,0.3); border-radius:7px; }
.lkx-os-queue-empty { font-size:12px; color:var(--muted-2); margin-bottom:10px; }
.lkx-os-queue-list { display:flex; flex-direction:column; gap:5px; max-height:150px; overflow-y:auto; margin-bottom:10px; }
.lkx-os-q { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 9px; border-radius:7px; background:var(--glass); border:1px solid var(--stroke); }
.lkx-os-q.conflict { border-color:rgba(251,113,133,0.4); background:rgba(251,113,133,0.07); }
.lkx-os-q-name { font-size:12px; display:flex; align-items:center; gap:8px; min-width:0; }
.lkx-os-q-x { background:transparent; border:none; color:var(--muted-2); cursor:pointer; font-size:12px; padding:2px 4px; }
.lkx-os-q-x:hover { color:var(--red); }
.lkx-os-sign { width:100%; padding:11px; border-radius:9px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; color:#06241f; background:linear-gradient(180deg, var(--teal), var(--teal-deep)); transition:opacity .14s, filter .14s; }
.lkx-os-sign:hover:not(:disabled) { filter:brightness(1.08); }
.lkx-os-sign:disabled { opacity:0.4; cursor:default; background:var(--glass); color:var(--muted-2); }
`;