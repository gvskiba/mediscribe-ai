import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { key:"hpi",   label:"HPI",         ph:"History of present illness..." },
  { key:"exam",  label:"Exam",        ph:"Physical exam findings..." },
  { key:"mdm",   label:"MDM",         ph:"Medical decision making — data reviewed, differential, risk..." },
  { key:"dispo", label:"Disposition", ph:"Disposition, follow-up, return precautions..." },
];

const EMPTY = { hpi:"", exam:"", mdm:"", dispo:"" };

function emEstimate(note) {
  const mdm = note.mdm || "";
  const filled = SECTIONS.filter(s => (note[s.key] || "").trim().length > 0).length;
  let level = 99281 + Math.max(0, filled - 1);
  if (/admit|critical|consult|sepsis|stemi|stroke|transfus|icu|surg/i.test(mdm)) level = Math.max(level, 99285);
  else if (mdm.length > 240 || /\bct\b|mri|troponin|imaging|ekg|ecg|labs/i.test(mdm)) level = Math.max(level, 99284);
  return Math.min(level, 99285);
}

export default function NoteDock({ open = false, onClose = () => {}, topOffset = 68 }) {
  const [note, setNote]     = useState(EMPTY);
  const [copied, setCopied] = useState(false);
  const firstRef = useRef(null);
  const copyTimer = useRef(null);

  useEffect(() => { if (open) firstRef.current?.focus(); }, [open]);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const set = (k, v) => setNote(n => ({ ...n, [k]: v }));

  const filled = SECTIONS.filter(s => (note[s.key] || "").trim()).length;
  const pct = Math.round((filled / SECTIONS.length) * 100);
  const em = emEstimate(note);
  const anyContent = filled > 0;

  const assemble = () =>
    SECTIONS.map(s => `${s.label.toUpperCase()}\n${(note[s.key] || "").trim()}`).join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(assemble());
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  return (
    <div className={"lkx-nd" + (open ? " open" : "")} style={{ top: topOffset }} aria-hidden={!open}>
      <style>{CSS}</style>

      <div className="lkx-nd-head">
        <div className="lkx-nd-title">Note <kbd className="lkx-nd-kbd">n</kbd></div>
        <div className="lkx-nd-headright">
          <span className="lkx-nd-em" title="E/M estimate — documentation aid, not billing advice">E/M est. {em}</span>
          <button className="lkx-nd-close" onClick={onClose} title="Back to board (Esc)">✕ Esc</button>
        </div>
      </div>

      <div className="lkx-nd-meter">
        <div className="lkx-nd-meter-track"><div className="lkx-nd-meter-fill" style={{ width: pct + "%" }} /></div>
        <span className="lkx-nd-meter-lbl">{filled}/{SECTIONS.length} sections</span>
      </div>

      <div className="lkx-nd-body">
        {SECTIONS.map((s, i) => (
          <div className="lkx-nd-section" key={s.key}>
            <label className="lkx-nd-label">{s.label}</label>
            <textarea
              ref={i === 0 ? firstRef : null}
              className="lkx-nd-ta"
              spellCheck={true}
              placeholder={s.ph}
              value={note[s.key]}
              onChange={(e) => set(s.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="lkx-nd-foot">
        <span className="lkx-nd-draft">{anyContent ? "Draft kept while open" : "Start typing — Tab moves sections"}</span>
        <button className="lkx-nd-copy" disabled={!anyContent} onClick={copy}>
          {copied ? "✓ Copied" : "Copy note"}
        </button>
      </div>
    </div>
  );
}

const CSS = `
.lkx-nd {
  --navy:#0b1a30; --navy-2:#081628; --glass:rgba(255,255,255,0.045);
  --stroke:rgba(255,255,255,0.10); --stroke-hi:rgba(255,255,255,0.2);
  --text:#e8eef7; --muted:#9fb3c8; --muted-2:#6b7f96;
  --teal:#5eead4; --teal-deep:#14b8a6; --gold:#e6c878;
  position:fixed; right:0; bottom:0; z-index:40;
  width:clamp(380px, 38%, 460px);
  display:flex; flex-direction:column;
  background:linear-gradient(180deg, var(--navy), var(--navy-2));
  border-left:1px solid var(--stroke);
  box-shadow:-24px 0 60px -20px rgba(0,0,0,0.8);
  font-family:'DM Sans', system-ui, sans-serif; color:var(--text);
  transform:translateX(100%); visibility:hidden; pointer-events:none;
  transition:transform .26s cubic-bezier(0.2,0.7,0.2,1), visibility 0s linear .26s;
}
.lkx-nd.open { transform:none; visibility:visible; pointer-events:auto; transition:transform .26s cubic-bezier(0.2,0.7,0.2,1); }

.lkx-nd-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px; }
.lkx-nd-title { font-size:17px; font-weight:700; display:flex; align-items:center; gap:8px; }
.lkx-nd-kbd { font-family:'JetBrains Mono',monospace; font-size:10px; padding:1px 6px; border-radius:4px; background:var(--glass); border:1px solid var(--stroke); color:var(--muted); font-weight:500; }
.lkx-nd-headright { display:flex; align-items:center; gap:10px; }
.lkx-nd-em { font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--gold); background:rgba(230,200,120,0.08); border:1px solid rgba(230,200,120,0.25); padding:3px 8px; border-radius:6px; }
.lkx-nd-close { background:transparent; border:1px solid var(--stroke); color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:10px; padding:3px 8px; border-radius:6px; cursor:pointer; transition:all .13s; }
.lkx-nd-close:hover { color:var(--text); border-color:var(--stroke-hi); }

.lkx-nd-meter { display:flex; align-items:center; gap:10px; padding:0 16px 10px; }
.lkx-nd-meter-track { flex:1; height:4px; border-radius:3px; background:rgba(255,255,255,0.07); overflow:hidden; }
.lkx-nd-meter-fill { height:100%; background:linear-gradient(90deg, var(--teal-deep), var(--teal)); border-radius:3px; transition:width .25s ease; }
.lkx-nd-meter-lbl { font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--muted-2); flex-shrink:0; }

.lkx-nd-body { flex:1; overflow-y:auto; padding:4px 16px 12px; display:flex; flex-direction:column; gap:14px; }
.lkx-nd-body::-webkit-scrollbar { width:4px; }
.lkx-nd-body::-webkit-scrollbar-thumb { background:rgba(42,79,122,0.5); border-radius:2px; }
.lkx-nd-section { display:flex; flex-direction:column; gap:5px; }
.lkx-nd-label { font-size:9.5px; letter-spacing:1.4px; color:var(--muted-2); text-transform:uppercase; }
.lkx-nd-ta {
  width:100%; min-height:74px; resize:vertical; box-sizing:border-box;
  padding:10px 12px; border-radius:9px;
  background:rgba(11,30,54,0.6); border:1.5px solid var(--stroke);
  color:var(--text); font-family:'DM Sans',sans-serif; font-size:13px; line-height:1.5;
  outline:none; caret-color:var(--teal); transition:border-color .16s, box-shadow .16s;
}
.lkx-nd-ta::placeholder { color:var(--muted-2); }
.lkx-nd-ta:focus { border-color:rgba(94,234,212,0.5); box-shadow:0 0 0 3px rgba(94,234,212,0.08); }

.lkx-nd-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:11px 16px; border-top:1px solid var(--stroke); background:rgba(6,12,25,0.5); }
.lkx-nd-draft { font-size:11px; color:var(--muted-2); }
.lkx-nd-copy { padding:8px 16px; border-radius:8px; border:1px solid rgba(94,234,212,0.35); background:rgba(94,234,212,0.08); color:var(--teal); font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .14s; }
.lkx-nd-copy:hover:not(:disabled) { background:rgba(94,234,212,0.16); }
.lkx-nd-copy:disabled { opacity:0.4; cursor:default; }
`;