// components/npi/CommandPalette.jsx
// Encounter-aware command palette for NewPatientInput (NPI).
// Identical command index to the global CommandPalette but:
//   - Triggers onSelectSection(section) for section-type commands
//   - Defaults to encounter sections in suggestions (not resus/stroke)
//   - Designed to be mounted inside the NPI context
//
// Props:
//   onSelectSection  fn(section)  — called to jump to an NPI section
//   onNavigate       fn(path)     — called to navigate to a hub page
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const T = {
  bg:"#050f1e",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const COMMANDS = [
  // ── NPI Encounter sections ──────────────────────────────────────────────────
  { id:"s_demo",     type:"section", icon:"👤", label:"Demographics",          desc:"Patient registration, demographics, SDOH",              section:"demo",      tags:["demo","registration","patient","sdoh"] },
  { id:"s_triage",   type:"section", icon:"📊", label:"Triage & Vitals",       desc:"ESI level, vital signs, triage notes",                  section:"triage",    tags:["triage","vitals","esi","bp","hr","temp","spo2"] },
  { id:"s_hpi",      type:"section", icon:"📝", label:"History of Present Illness", desc:"HPI entry, AI-assisted, chief complaint",          section:"hpi",       tags:["hpi","history","chief","complaint","onset","duration"] },
  { id:"s_diff",     type:"section", icon:"🧠", label:"Smart Differential",    desc:"AI-generated differential diagnosis, must-not-miss",    section:"diff",      tags:["differential","diagnosis","ddx","must","miss"] },
  { id:"s_ros",      type:"section", icon:"🔍", label:"Review of Systems",     desc:"Structured ROS by system",                              section:"ros",       tags:["ros","review","systems","symptoms"] },
  { id:"s_pe",       type:"section", icon:"🩺", label:"Physical Exam",         desc:"Structured physical examination",                        section:"pe",        tags:["exam","physical","pe","auscultation","palpation"] },
  { id:"s_mdm",      type:"section", icon:"📋", label:"Medical Decision Making",desc:"MDM narrative, AI assist, complexity",                 section:"mdm",       tags:["mdm","decision","making","complexity","narrative"] },
  { id:"s_scores",   type:"section", icon:"🧮", label:"Clinical Scores",       desc:"HEART, Wells, PERC embedded in encounter",              section:"scores",    tags:["scores","heart","wells","perc","score"] },
  { id:"s_labs",     type:"section", icon:"🔬", label:"Lab Interpreter",       desc:"Lab interpretation embedded in encounter",               section:"labs",      tags:["labs","bmp","cbc","interpreter"] },
  { id:"s_dosing",   type:"section", icon:"⚖️", label:"Drug Dosing",           desc:"Weight-based drug dosing in encounter",                  section:"dosing",    tags:["dosing","drugs","weight","dose"] },
  { id:"s_orders",   type:"section", icon:"📋", label:"Orders",                desc:"Order entry and management",                             section:"orders",    tags:["orders","medications","labs","imaging"] },
  { id:"s_sepsis",   type:"section", icon:"🦠", label:"Sepsis Bundle",         desc:"Sepsis screening and bundle tracking",                   section:"sepsis",    tags:["sepsis","bundle","qsofa","lactate"] },
  { id:"s_erx",      type:"section", icon:"💊", label:"Prescribing",           desc:"E-prescribing, medication management",                   section:"erx",       tags:["erx","prescribe","medications"] },
  { id:"s_consult",  type:"section", icon:"📞", label:"Consult",               desc:"Consult preparation, specialty call, NPI lookup",        section:"consult",   tags:["consult","specialty","call","cardiology"] },
  { id:"s_autocoder",type:"section", icon:"🏷️", label:"Auto-Coder",            desc:"Visit coding, E/M level, ICD-10",                        section:"autocoder", tags:["coding","icd","cpt","billing"] },
  { id:"s_capacity", type:"section", icon:"⚖️", label:"Capacity / AMA",        desc:"Appelbaum capacity assessment, AMA documentation",       section:"capacity",  tags:["capacity","ama","appelbaum","refusal"] },
  { id:"s_closeout", type:"section", icon:"🚪", label:"Disposition",           desc:"Patient disposition, admit/discharge/transfer",          section:"closeout",  tags:["disposition","discharge","admit","transfer","ama","lwbs"] },
  { id:"s_handoff",  type:"section", icon:"🤝", label:"Shift Handoff",         desc:"I-PASS AI shift handoff generator",                      section:"handoff",   tags:["handoff","ipass","shift","transfer","care"] },
  { id:"s_discharge",type:"section", icon:"🏠", label:"Discharge Instructions", desc:"AI discharge instructions, Beers flags, follow-up",     section:"discharge", tags:["discharge","instructions","medications","follow","up"] },
  { id:"s_audit",    type:"section", icon:"🔒", label:"Audit & Lock Note",     desc:"SHA-256 note lock, completeness checklist",              section:"audit",     tags:["audit","lock","note","hash","sign"] },

  // ── Hubs ───────────────────────────────────────────────────────────────────
  { id:"ecg",       type:"hub", icon:"💓", label:"ECG Hub",         desc:"ECG interpretation, rhythms, QTc, STEMI equivalents",  path:"/ecg-hub",          tags:["ecg","ekg","rhythm","qt","lbbb","stemi","afib"] },
  { id:"airway",    type:"hub", icon:"😮", label:"Airway Hub",      desc:"RSI, intubation, surgical airway, difficult airway",   path:"/airway-hub",       tags:["rsi","intubation","airway","cric","video","bvm"] },
  { id:"shock",     type:"hub", icon:"⚡", label:"Shock Hub",       desc:"Shock classification, vasopressors, hemodynamic targets",path:"/shock-hub",       tags:["shock","vasopressor","pressors","hypotension","MAP"] },
  { id:"psych",     type:"hub", icon:"🧠", label:"Psych Hub",       desc:"Agitation, psychiatric emergencies, capacity",         path:"/psyche-hub",       tags:["psych","agitation","droperidol","haldol"] },
  { id:"sepsis",    type:"hub", icon:"🦠", label:"Sepsis Hub",      desc:"Sepsis bundle, qSOFA, lactate, vasopressors",          path:"/sepsis-hub",       tags:["sepsis","bundle","lactate","qsofa","sofa"] },
  { id:"resus",     type:"hub", icon:"❤️", label:"Resus Hub",       desc:"ACLS, PALS, CPR timer, epinephrine tracker, Hs & Ts",  path:"/resus-hub",        tags:["resus","acls","pals","cpr","vf","pea","asystole"] },
  { id:"stroke",    type:"hub", icon:"🧠", label:"Stroke Hub",      desc:"tPA eligibility, door-to-needle timer, NIHSS",         path:"/stroke-hub",       tags:["stroke","tpa","nihss","lvo","dtn","alteplase"] },
  { id:"score",     type:"hub", icon:"🧮", label:"Score Hub",       desc:"HEART, Wells, PERC, CURB-65, Ottawa, GCS, ABCD2",      path:"/score-hub",        tags:["score","heart","wells","perc","curb","nexus","ottawa","gcs"] },
  { id:"dose",      type:"hub", icon:"⚖️", label:"Weight Dose Hub", desc:"Weight-based drug dosing, RSI, vasopressors, reversal", path:"/weight-dose",      tags:["dose","dosing","weight","rsi","epinephrine","ketamine"] },
  { id:"tox",       type:"hub", icon:"☠️", label:"Tox Hub",         desc:"Antidotes, ingestion protocols, Rumack-Matthew",       path:"/tox-hub",          tags:["tox","poison","antidote","overdose","nac","naloxone"] },
  { id:"lab",       type:"hub", icon:"🔬", label:"Lab Interpreter", desc:"BMP, CBC, LFT, coag, ABG interpretation, AI analysis", path:"/lab-interpreter",  tags:["lab","bmp","cbc","lft","abg","anion","gap"] },
  { id:"chestpain", type:"hub", icon:"💓", label:"Chest Pain Hub",  desc:"HEART score, serial troponin, EDACS, ACS protocol",    path:"/ChestPainHub",     tags:["chest","pain","heart","acs","stemi","nstemi","troponin"] },
  { id:"dyspnea",   type:"hub", icon:"💨", label:"Dyspnea Hub",     desc:"BLUE protocol, PE pathway, CHF, COPD, asthma",         path:"/DyspneaHub",       tags:["dyspnea","sob","chf","copd","asthma","pe","blue","bnp"] },
  { id:"headache",  type:"hub", icon:"🧠", label:"Headache Hub",    desc:"Ottawa SAH Rule, LP, migraine cocktail, cluster, GCA", path:"/HeadacheHub",      tags:["headache","sah","migraine","cluster","ottawa","snoop","lp"] },
  { id:"abdpain",   type:"hub", icon:"🫘", label:"Abdominal Pain Hub",desc:"Alvarado, BISAP, GI bleed, cholangitis, ectopic",    path:"/AbdominalPainHub", tags:["abdomen","pain","alvarado","appendix","bisap","pancreatitis","gibleed"] },
  { id:"trauma",    type:"hub", icon:"🚨", label:"Trauma Hub",      desc:"ATLS primary survey, MTP, TXA, GCS, NEXUS",           path:"/trauma-hub",       tags:["trauma","atls","mtp","txa","gcs","shock","hemorrhage"] },
  { id:"peds",      type:"hub", icon:"🧒", label:"Pediatric Hub",   desc:"Broselow, PECARN, fever workup, PALS dosing, croup",   path:"/peds-hub",         tags:["pediatric","peds","broselow","pecarn","fever","rochester","croup"] },
  { id:"ams",       type:"hub", icon:"🔆", label:"AMS Hub",         desc:"AEIOU-TIPS, CAM-ICU, RASS, Wernicke, NCSE, PRES",     path:"/ams-hub",          tags:["ams","altered mental status","delirium","cam-icu","wernicke"] },
  { id:"dvt",       type:"hub", icon:"🩸", label:"DVT / VTE Hub",   desc:"Wells DVT score, DOAC selection, renal dosing, APS",   path:"/dvt-hub",          tags:["dvt","vte","wells","doac","apixaban","rivaroxaban","anticoagulation"] },
  { id:"syncope",   type:"hub", icon:"😵", label:"Syncope Hub",     desc:"ROSE, SFSR, CSRS, OESIL, disposition matrix",         path:"/syncope-hub",      tags:["syncope","rose","sfsr","csrs","oesil","faint"] },
  { id:"pain",      type:"hub", icon:"💊", label:"Pain Hub",        desc:"MME calculator, opioid rotation, adjuncts, PDMP",     path:"/pain-hub",         tags:["pain","mme","opioid","ketamine","ketorolac","pdmp"] },
  { id:"seizure",   type:"hub", icon:"⚡", label:"Seizure Hub",     desc:"SE protocol, BZD dosing, levetiracetam, ACEP 2024",   path:"/seizure-hub",      tags:["seizure","status","epilepticus","benzo","levetiracetam","keppra"] },
];

const TYPE_META = {
  hub:     { label:"Hub",     color:T.teal,   bg:"rgba(0,229,192,0.12)" },
  section: { label:"Section", color:T.blue,   bg:"rgba(59,158,255,0.12)" },
  score:   { label:"Score",   color:T.purple, bg:"rgba(155,109,255,0.12)" },
  drug:    { label:"Drug",    color:T.orange, bg:"rgba(255,159,67,0.12)" },
  protocol:{ label:"Protocol",color:T.coral,  bg:"rgba(255,107,107,0.12)" },
};

const DEFAULT_SECTIONS = ["s_hpi","s_pe","s_mdm","s_discharge","s_scores","s_labs","s_dosing","s_sepsis"];

function scoreMatch(cmd, query) {
  if (!query) return 1;
  const q     = query.toLowerCase();
  const label = cmd.label.toLowerCase();
  const desc  = (cmd.desc || "").toLowerCase();
  const tags  = (cmd.tags || []).join(" ").toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q))   return 80;
  if (cmd.tags?.some(t => t === q)) return 70;
  if (tags.includes(q))    return 60;
  if (desc.includes(q))    return 40;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every(w => `${label} ${desc} ${tags}`.includes(w))) return 50;
  return 0;
}

const recentIds = [];
function addRecent(id) {
  const idx = recentIds.indexOf(id);
  if (idx >= 0) recentIds.splice(idx, 1);
  recentIds.unshift(id);
  if (recentIds.length > 5) recentIds.pop();
}

function ResultItem({ cmd, active, onSelect, query }) {
  const tm  = TYPE_META[cmd.type] || TYPE_META.hub;
  const ref = useRef(null);

  useEffect(() => {
    if (active && ref.current) ref.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [active]);

  const highlighted = useMemo(() => {
    if (!query) return cmd.label;
    const re    = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
    const parts = cmd.label.split(re);
    return parts.map((p, i) =>
      re.test(p)
        ? <mark key={i} style={{ background:`${tm.color}30`, color:tm.color, borderRadius:2, padding:"0 1px" }}>{p}</mark>
        : p
    );
  }, [cmd.label, query, tm.color]);

  return (
    <button ref={ref} onClick={() => onSelect(cmd)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
        padding:"8px 14px", cursor:"pointer", textAlign:"left",
        transition:"background .1s", border:"none",
        background:active ? `linear-gradient(135deg,${tm.color}14,${tm.color}06)` : "transparent",
        borderLeft:`3px solid ${active ? tm.color : "transparent"}` }}>
      <div style={{ width:30, height:30, borderRadius:8, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:active ? tm.bg : "rgba(14,37,68,0.5)", fontSize:15 }}>
        {cmd.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12.5, color:active ? T.txt : T.txt2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {highlighted}
        </div>
        {cmd.desc && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9.5, color:T.txt4, marginTop:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {cmd.desc}
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5, fontWeight:700,
          letterSpacing:1, textTransform:"uppercase", padding:"2px 6px", borderRadius:4,
          background:tm.bg, color:tm.color, border:`1px solid ${tm.color}30` }}>
          {tm.label}
        </span>
        {active && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>↵</span>}
      </div>
    </button>
  );
}

export default function NPICommandPalette({ onSelectSection, onNavigate }) {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open ? handleClose() : handleOpen();
      }
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recent  = recentIds.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
      const defaults = COMMANDS.filter(c => DEFAULT_SECTIONS.includes(c.id));
      const combined = [...recent];
      defaults.forEach(d => { if (!combined.find(c => c.id === d.id)) combined.push(d); });
      return combined.slice(0, 9);
    }
    let filtered = COMMANDS;
    let searchQ  = q;
    const typePrefix = q.match(/^(hub|section|score|drug|protocol):/);
    if (typePrefix) {
      filtered = COMMANDS.filter(c => c.type === typePrefix[1]);
      searchQ  = q.slice(typePrefix[1].length + 1).trim();
    }
    return filtered
      .map(c => ({ ...c, _score:scoreMatch(c, searchQ) }))
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);
  }, [query]);

  useEffect(() => {
    setActiveIdx(p => Math.min(p, Math.max(0, results.length - 1)));
  }, [results.length]);

  const handleSelect = useCallback((cmd) => {
    addRecent(cmd.id);
    handleClose();
    if (cmd.section && onSelectSection) {
      onSelectSection(cmd.section);
    } else if (cmd.path && onNavigate) {
      onNavigate(cmd.path);
    }
  }, [handleClose, onSelectSection, onNavigate]);

  const onKeyDown = useCallback(e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(p => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(p => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const cmd = results[activeIdx]; if (cmd) handleSelect(cmd); }
    else if (e.key === "Escape") handleClose();
  }, [results, activeIdx, handleSelect, handleClose]);

  const grouped = useMemo(() => {
    if (!query.trim()) return [{ label:null, items:results }];
    const groups = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return Object.entries(groups).map(([type, items]) => ({
      label: TYPE_META[type]?.label || type,
      color: TYPE_META[type]?.color || T.txt4,
      items,
    }));
  }, [results, query]);

  if (!open) {
    return (
      <button onClick={handleOpen}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
          borderRadius:20, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
          fontWeight:600, fontSize:11, transition:"all .15s",
          border:"1px solid rgba(42,79,122,0.45)",
          background:"rgba(42,79,122,0.1)", color:T.txt4 }}>
        <span style={{ fontSize:12 }}>🔍</span>
        <span>Jump to section</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, marginLeft:2 }}>⌘K</span>
      </button>
    );
  }

  let globalIdx = 0;

  return (
    <>
      <div onClick={handleClose}
        style={{ position:"fixed", inset:0, zIndex:9000,
          background:"rgba(5,15,30,0.65)",
          backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }} />

      <div style={{ position:"fixed", top:"10vh", left:"50%",
        transform:"translateX(-50%)", width:"min(620px, 94vw)", zIndex:9001,
        background:"rgba(8,18,40,0.98)",
        border:"1px solid rgba(42,79,122,0.7)", borderRadius:14,
        boxShadow:"0 20px 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,229,192,0.07)",
        overflow:"hidden" }}>

        {/* Search input */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 15px",
          borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🔍</span>
          <input ref={inputRef} value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Jump to section, search hubs, scores, drugs..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500,
              color:T.txt, caretColor:T.teal }} />
          <button onClick={handleClose}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              padding:"3px 8px", borderRadius:5, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",
              background:"rgba(42,79,122,0.15)", color:T.txt4, letterSpacing:1 }}>
            Esc
          </button>
        </div>

        {/* Filter hints */}
        {!query && (
          <div style={{ display:"flex", gap:4, padding:"7px 13px",
            borderBottom:"1px solid rgba(26,53,85,0.3)" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4 }}>Filter: </span>
            {["section:","hub:","score:","protocol:"].map(prefix => (
              <button key={prefix}
                onClick={() => { setQuery(prefix); inputRef.current?.focus(); }}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
                  padding:"2px 6px", borderRadius:4, cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.35)",
                  background:"transparent", color:T.txt4, letterSpacing:0.5 }}>
                {prefix}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div style={{ maxHeight:"55vh", overflowY:"auto" }}>
          {results.length === 0 ? (
            <div style={{ padding:"24px", textAlign:"center",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
              No results for "{query}"
              <div style={{ fontSize:10, marginTop:5, color:T.txt4 }}>
                Try: section: · hub: · score:
              </div>
            </div>
          ) : (
            grouped.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div style={{ padding:"6px 13px 2px",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
                    fontWeight:700, color:group.color || T.txt4,
                    letterSpacing:1.5, textTransform:"uppercase",
                    borderTop:gi > 0 ? "1px solid rgba(26,53,85,0.3)" : "none" }}>
                    {group.label}
                  </div>
                )}
                {group.items.map(cmd => {
                  const idx = globalIdx++;
                  return (
                    <ResultItem key={cmd.id} cmd={cmd}
                      active={idx === activeIdx}
                      onSelect={handleSelect}
                      query={query.trim().toLowerCase()} />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"7px 15px",
          borderTop:"1px solid rgba(26,53,85,0.35)" }}>
          {[
            { key:"↑↓", desc:"navigate" },
            { key:"↵",  desc:"select"   },
            { key:"Esc",desc:"close"    },
          ].map(h => (
            <div key={h.key} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal,
                background:"rgba(0,229,192,0.1)", border:"1px solid rgba(0,229,192,0.3)",
                borderRadius:4, padding:"1px 5px" }}>{h.key}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4 }}>{h.desc}</span>
            </div>
          ))}
          <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace",
            fontSize:7.5, color:T.txt4, letterSpacing:1 }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </>
  );
}