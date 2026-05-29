import { useState, useEffect, useCallback, useRef } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap";
const SHIFT_WINDOW_MS = 14 * 3600 * 1000;

const PROVIDER  = { name: "Dr. Gabriel Skiba, DO", role: "Emergency Medicine", shiftStart: "19:00", shiftEnd: "07:00" };
const CENSUS    = { total: 28, capacity: 34, waiting: 6, inProgress: 18, pendingDispo: 4, longestWait: "1h 42m" };
const ESI = [
  { level: 1, count: 1,  label: "Immediate",  color: "#ef4444" },
  { level: 2, count: 4,  label: "Emergent",   color: "#f97316" },
  { level: 3, count: 11, label: "Urgent",     color: "#eab308" },
  { level: 4, count: 9,  label: "Less Urgent",color: "#22c55e" },
  { level: 5, count: 3,  label: "Non-Urgent", color: "#60a5fa" },
];
const CRITICAL = [
  { id: "c1", type: "Troponin \u0394", patient: "Bed 4",  note: "T+3h \u2014 result pending" },
  { id: "c2", type: "CT Head",         patient: "Bed 11", note: "Prelim read outstanding" },
  { id: "c3", type: "Lactate",         patient: "Bed 2",  note: "Critical 4.2 mmol/L" },
];
const HANDOFF = {
  provider: "Dr. M. Torres, DO",
  overlapWindow: "19:00 \u2013 19:30",
  notes: [
    "Bed 2 \u2014 Sepsis protocol active, 2L in, repeat lactate pending",
    "Bed 4 \u2014 NSTEMI rule-out, cardiology notified, troponin \u0394 at 2200",
    "Bed 11 \u2014 New focal neuro deficit, CT ordered, stroke team on standby",
    "Hallway board full \u2014 4-hr hold advisory in effect",
  ],
  forecast: "High volume expected \u2014 14 in waiting room",
};
const DELTA = [
  { id: "d1", type: "critical", text: "New critical K\u207a 6.1 \u2014 Bed 7" },
  { id: "d2", type: "info",     text: "3 new arrivals while away" },
  { id: "d3", type: "success",  text: "Bed 12 admitted \u2014 room open" },
];
const HUBS = [
  { label: "Quick Note",       route: "/QuickNote" },
  { label: "Track Board",      route: "/EDTrackingBoard" },
  { label: "New Patient",      route: "/NewPatientInput" },
  { label: "All Hubs",         route: "/hub-index" },
  { label: "Command Center",   route: "/CommandCenter" },
  { label: "Shift Dashboard",  route: "/ShiftDashboard" },
];
const UNSIGNED_NOTES = [
  { id: "un1", patient: "Bed 4",  type: "Progress note" },
  { id: "un2", patient: "Bed 11", type: "H&P" },
];
const UNSIGNED_ORDERS = [
  { id: "uo1", patient: "Bed 2", type: "Lactate repeat" },
  { id: "uo2", patient: "Bed 7", type: "K⁺ replacement" },
  { id: "uo3", patient: "Bed 9", type: "Discharge order" },
];

const store = {
  async get(k, s = false) { try { return await window.storage.get(k, s); } catch { return null; } },
  async set(k, v, s = false) { try { return await window.storage.set(k, v, s); } catch { return null; } },
};

const css = `
@import url('${FONTS}');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#070d1a;}
.sb{
  min-height:100%;
  background:radial-gradient(ellipse 80% 55% at 50% -5%,#0d2040 0%,#070d1a 68%);
  font-family:'DM Sans',sans-serif;color:#e2e8f0;
  display:flex;flex-direction:column;position:relative;
}
.bg-grid{
  position:absolute;inset:0;pointer-events:none;
  background-image:
    linear-gradient(rgba(13,148,136,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(13,148,136,.035) 1px,transparent 1px);
  background-size:44px 44px;
}
.hdr{
  flex-shrink:0;
  padding:.9rem 2rem .5rem;
  display:flex;justify-content:space-between;align-items:center;
  position:relative;z-index:2;
}
.brand{font-family:'Playfair Display',serif;font-size:.88rem;letter-spacing:.14em;color:rgba(13,200,170,.55);text-transform:uppercase;}
.clock{font-family:'JetBrains Mono',monospace;font-size:.88rem;color:rgba(226,232,240,.38);}
.body{
  flex:1;
  display:grid;grid-template-columns:1fr 1.18fr 1fr;
  gap:.85rem;padding:.35rem 1.75rem .5rem;
  position:relative;z-index:2;
}
.col{
  display:flex;flex-direction:column;
  background:rgba(13,25,50,.56);
  border:0.5px solid rgba(13,200,170,.14);
  border-radius:11px;backdrop-filter:blur(12px);
  padding:.85rem 1.1rem;gap:.7rem;
}
.col-mid{
  display:flex;flex-direction:column;
  background:rgba(13,30,60,.66);
  border:0.5px solid rgba(13,200,170,.26);
  border-radius:12px;backdrop-filter:blur(14px);
  padding:.9rem 1.2rem;gap:.65rem;
  box-shadow:0 0 36px rgba(13,148,136,.07);
}
.sec{display:flex;flex-direction:column;gap:.28rem;flex-shrink:0;}
.sec-inline{display:flex;align-items:center;gap:.5rem;margin-bottom:.1rem;}
.sec-label{
  font-size:.58rem;letter-spacing:.18em;color:rgba(13,200,170,.48);
  text-transform:uppercase;font-weight:500;white-space:nowrap;
}
.div{border:none;border-top:0.5px solid rgba(13,200,170,.09);flex-shrink:0;}

.cg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.cg-cell{
  background:rgba(13,200,170,.05);border:0.5px solid rgba(13,200,170,.1);
  border-radius:7px;padding:.42rem .35rem .38rem;text-align:center;
}
.cg-num{font-family:'JetBrains Mono',monospace;font-size:1.05rem;font-weight:500;line-height:1;}
.cg-lbl{font-size:.58rem;color:rgba(226,232,240,.38);margin-top:3px;line-height:1;}
.teal{color:#0dc8aa;}.warn{color:#f97316;}

.esi-wrap{position:relative;}
.esi-bar{display:flex;gap:3px;height:10px;border-radius:5px;overflow:visible;}
.esi-seg{border-radius:4px;cursor:pointer;position:relative;transition:filter .15s;flex-shrink:0;}
.esi-seg:hover{filter:brightness(1.3);}
.esi-tip{
  display:none;position:absolute;bottom:calc(100% + 6px);left:50%;
  transform:translateX(-50%);
  background:rgba(10,20,40,.95);border:0.5px solid rgba(13,200,170,.25);
  border-radius:6px;padding:4px 8px;white-space:nowrap;z-index:10;
  font-size:.65rem;color:#e2e8f0;pointer-events:none;
}
.esi-seg:hover .esi-tip{display:block;}
.esi-counts{display:flex;gap:3px;margin-top:4px;}
.esi-count{flex-shrink:0;text-align:center;font-family:'JetBrains Mono',monospace;font-size:.6rem;color:rgba(226,232,240,.38);}

.crit-item{
  display:flex;align-items:center;gap:.55rem;
  padding:.3rem .4rem;border-radius:7px;cursor:pointer;transition:all .15s;
}
.crit-item.pending{background:rgba(239,68,68,.07);border:0.5px solid rgba(239,68,68,.2);}
.crit-item.acked{background:rgba(13,200,170,.05);border:0.5px solid rgba(13,200,170,.15);opacity:.65;}
.crit-chk{
  width:16px;height:16px;border-radius:3px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:.62rem;font-weight:600;transition:all .15s;
}
.crit-item.pending .crit-chk{background:rgba(239,68,68,.12);border:0.5px solid rgba(239,68,68,.3);color:transparent;}
.crit-item.acked .crit-chk{background:rgba(13,200,170,.18);border:0.5px solid rgba(13,200,170,.35);color:#0dc8aa;}
.crit-body{flex:1;min-width:0;}
.crit-top{display:flex;align-items:baseline;gap:.35rem;}
.crit-type{font-family:'JetBrains Mono',monospace;font-size:.67rem;font-weight:500;}
.crit-item.pending .crit-type{color:#fca5a5;}
.crit-item.acked .crit-type{color:rgba(13,200,170,.6);}
.crit-sep{font-size:.6rem;color:rgba(226,232,240,.2);}
.crit-patient{font-size:.67rem;color:rgba(226,232,240,.5);}
.crit-note{font-size:.63rem;color:rgba(226,232,240,.32);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.crit-gate{
  font-size:.64rem;color:rgba(239,68,68,.5);text-align:center;
  padding:.28rem .5rem;background:rgba(239,68,68,.04);
  border:0.5px solid rgba(239,68,68,.1);border-radius:6px;flex-shrink:0;
}
.crit-gate.ok{color:rgba(13,200,170,.5);background:rgba(13,200,170,.04);border-color:rgba(13,200,170,.1);}
.pulse-ring{animation:pring 1.9s ease-in-out infinite;}
@keyframes pring{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.28);}55%{box-shadow:0 0 0 4px rgba(239,68,68,0);}}

.h-title{font-family:'Playfair Display',serif;font-size:1.1rem;color:#e2e8f0;line-height:1.2;}
.h-sub{font-size:.68rem;color:rgba(13,200,170,.55);}
.hn{display:flex;gap:.45rem;align-items:flex-start;}
.hn-dot{width:4px;height:4px;border-radius:50%;background:rgba(13,200,170,.45);margin-top:5px;flex-shrink:0;}
.hn-txt{font-size:.75rem;color:rgba(226,232,240,.68);line-height:1.45;}
.forecast{
  display:flex;align-items:center;gap:.45rem;
  background:rgba(249,115,22,.07);border:0.5px solid rgba(249,115,22,.18);
  border-radius:7px;padding:.35rem .65rem;flex-shrink:0;
}
.forecast-dot{width:5px;height:5px;border-radius:50%;background:#f97316;flex-shrink:0;}
.forecast-txt{font-size:.69rem;color:rgba(249,115,22,.8);}
.ack-badge{
  background:rgba(13,200,170,.07);border:0.5px solid rgba(13,200,170,.18);
  border-radius:6px;padding:.25rem .6rem;
  font-size:.63rem;color:rgba(13,200,170,.6);text-align:center;flex-shrink:0;
}
.begin-btn{
  flex-shrink:0;width:100%;
  background:rgba(13,200,170,.12);border:0.5px solid rgba(13,200,170,.35);
  border-radius:8px;color:#0dc8aa;font-size:.75rem;
  font-family:'DM Sans',sans-serif;font-weight:500;letter-spacing:.08em;
  padding:.55rem 1.2rem;cursor:pointer;text-transform:uppercase;transition:all .18s;
}
.begin-btn:hover:not(:disabled){background:rgba(13,200,170,.2);}
.begin-btn:disabled{opacity:.28;cursor:not-allowed;}

.p-name{font-family:'Playfair Display',serif;font-size:.98rem;color:#e2e8f0;}
.p-role{font-size:.63rem;color:rgba(13,200,170,.48);text-transform:uppercase;letter-spacing:.09em;}
.sblock{
  background:rgba(13,200,170,.06);border:0.5px solid rgba(13,200,170,.15);
  border-radius:8px;padding:.5rem .75rem;
}
.sblock-lbl{font-size:.58rem;color:rgba(13,200,170,.45);letter-spacing:.1em;text-transform:uppercase;}
.sblock-val{font-family:'JetBrains Mono',monospace;font-size:.88rem;color:#e2e8f0;font-weight:500;margin-top:2px;}
.uns-item{display:flex;align-items:center;gap:.45rem;padding:.28rem .4rem;border-radius:6px;}
.uns-note{background:rgba(234,179,8,.06);border:0.5px solid rgba(234,179,8,.18);}
.uns-order{background:rgba(96,165,250,.06);border:0.5px solid rgba(96,165,250,.18);}
.uns-badge{
  font-family:'JetBrains Mono',monospace;font-size:.58rem;font-weight:500;
  padding:1px 5px;border-radius:3px;flex-shrink:0;
}
.uns-note .uns-badge{color:rgba(234,179,8,.8);background:rgba(234,179,8,.1);}
.uns-order .uns-badge{color:rgba(96,165,250,.75);background:rgba(96,165,250,.1);}
.uns-type{font-size:.68rem;color:rgba(226,232,240,.6);flex:1;}
.uns-patient{font-family:'JetBrains Mono',monospace;font-size:.62rem;color:rgba(226,232,240,.32);}
.hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
.hub-pill{
  background:rgba(13,200,170,.05);border:0.5px solid rgba(13,200,170,.11);
  border-radius:6px;padding:.32rem .5rem;cursor:pointer;
  font-family:'JetBrains Mono',monospace;font-size:.61rem;
  color:rgba(226,232,240,.5);transition:all .14s;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;
}
.hub-pill:hover{background:rgba(13,200,170,.1);color:#0dc8aa;border-color:rgba(13,200,170,.25);}

.ftr{flex-shrink:0;padding:0 1.75rem .75rem;position:relative;z-index:2;}
.cta{text-align:center;font-size:.65rem;color:rgba(226,232,240,.2);letter-spacing:.11em;text-transform:uppercase;}
kbd{
  background:rgba(13,200,170,.09);border:0.5px solid rgba(13,200,170,.22);
  border-radius:3px;padding:1px 5px;font-family:'JetBrains Mono',monospace;
  font-size:.62rem;color:rgba(13,200,170,.6);
}

.fade-in{animation:fup .5s ease both;}
@keyframes fup{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.s1{animation-delay:.07s;}.s2{animation-delay:.16s;}.s3{animation-delay:.25s;}.s4{animation-delay:.34s;}
.flash-out{animation:fout .42s ease forwards;}
@keyframes fout{0%{opacity:1;filter:brightness(1);}55%{opacity:1;filter:brightness(5);}100%{opacity:0;}}

.full-center{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.7rem;background:#070d1a;font-family:'DM Sans',sans-serif;}
.ldot{width:8px;height:8px;border-radius:50%;background:#0dc8aa;animation:ldot 1.1s ease-in-out infinite;}
@keyframes ldot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.6);}}
.full-title{font-family:'Playfair Display',serif;color:#0dc8aa;}
.full-sub{font-size:.8rem;color:rgba(226,232,240,.32);}
.re-card{
  width:100%;max-width:520px;background:rgba(13,30,60,.72);
  border:0.5px solid rgba(13,200,170,.24);border-radius:14px;
  backdrop-filter:blur(14px);padding:1.6rem 1.8rem;
}
.re-title{font-family:'Playfair Display',serif;font-size:1.25rem;color:#e2e8f0;margin-bottom:.18rem;}
.re-sub{font-size:.71rem;color:rgba(13,200,170,.5);margin-bottom:1rem;}
.delta-item{display:flex;align-items:flex-start;gap:.55rem;padding:.45rem .6rem;border-radius:7px;margin-bottom:.42rem;}
.delta-item.critical{background:rgba(239,68,68,.06);border:0.5px solid rgba(239,68,68,.16);}
.delta-item.info{background:rgba(13,200,170,.05);border:0.5px solid rgba(13,200,170,.12);}
.delta-item.success{background:rgba(34,197,94,.05);border:0.5px solid rgba(34,197,94,.12);}
.delta-icon{font-size:.72rem;margin-top:1px;flex-shrink:0;}
.delta-item.critical .delta-icon{color:#fca5a5;}
.delta-item.info .delta-icon{color:rgba(13,200,170,.65);}
.delta-item.success .delta-icon{color:rgba(34,197,94,.65);}
.delta-txt{font-size:.76rem;color:rgba(226,232,240,.65);line-height:1.4;}
.resume-btn{
  width:100%;background:rgba(13,200,170,.11);border:0.5px solid rgba(13,200,170,.32);
  border-radius:8px;color:#0dc8aa;font-size:.76rem;font-family:'DM Sans',sans-serif;
  font-weight:500;letter-spacing:.08em;padding:.58rem 1.2rem;cursor:pointer;
  text-transform:uppercase;transition:all .18s;margin-top:.9rem;
}
.resume-btn:hover{background:rgba(13,200,170,.2);}

@media(max-width:860px){
  .body{grid-template-columns:1fr;overflow-y:auto;}
  .hdr,.body,.ftr{padding-left:1rem;padding-right:1rem;}
}
`;

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = n => n.toString().padStart(2, "0");
  return <span>{t.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} &nbsp; {p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}</span>;
}

function ShiftRemaining() {
  const [h, setH] = useState(11);
  const [m, setM] = useState(57);
  useEffect(() => {
    const id = setInterval(() => setM(v => { if (v === 0) { setH(x => Math.max(0, x - 1)); return 59; } return v - 1; }), 60000);
    return () => clearInterval(id);
  }, []);
  return <span>{h}h {m.toString().padStart(2, "0")}m</span>;
}

function CensusGrid() {
  const occ = Math.round((CENSUS.total / CENSUS.capacity) * 100);
  const cells = [
    { num: `${CENSUS.total}/${CENSUS.capacity}`, lbl: "Census",       cls: "teal" },
    { num: `${occ}%`,                             lbl: "Occupancy",    cls: occ > 85 ? "warn" : "" },
    { num: CENSUS.waiting,                         lbl: "Waiting",      cls: "warn" },
    { num: CENSUS.inProgress,                      lbl: "In progress",  cls: "" },
    { num: CENSUS.pendingDispo,                    lbl: "Pend dispo",   cls: "" },
    { num: CENSUS.longestWait,                     lbl: "Longest wait", cls: "warn" },
  ];
  return (
    <div className="cg">
      {cells.map((c, i) => (
        <div className="cg-cell" key={i}>
          <div className={`cg-num ${c.cls}`}>{c.num}</div>
          <div className="cg-lbl">{c.lbl}</div>
        </div>
      ))}
    </div>
  );
}

function ESIBar() {
  const total = ESI.reduce((s, e) => s + e.count, 0);
  return (
    <div className="esi-wrap">
      <div className="esi-bar">
        {ESI.map(e => (
          <div
            key={e.level}
            className="esi-seg"
            style={{ background: e.color, width: `${(e.count / total) * 100}%` }}
          >
            <div className="esi-tip">ESI {e.level} &middot; {e.label} &middot; {e.count}</div>
          </div>
        ))}
      </div>
      <div className="esi-counts">
        {ESI.map(e => (
          <div key={e.level} className="esi-count" style={{ width: `${(e.count / total) * 100}%`, color: e.color }}>
            {e.count}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftBriefPage() {
  const [phase, setPhase]         = useState("loading");
  const [acked, setAcked]         = useState(new Set());
  const [handoff, setHandoff]     = useState(HANDOFF);
  const [ackRecord, setAckRecord] = useState(null);

  useEffect(() => {
    async function init() {
      const last = await store.get("shift:lastStart");
      if (last) {
        try {
          if (Date.now() - JSON.parse(last.value).timestamp < SHIFT_WINDOW_MS) {
            setPhase("reentry"); return;
          }
        } catch {}
      }
      const hd = await store.get("shift:handoff", true);
      if (hd) { try { setHandoff(JSON.parse(hd.value)); } catch {} }
      const ar = await store.get("shift:acknowledgment", true);
      if (ar) { try { setAckRecord(JSON.parse(ar.value)); } catch {} }
      setPhase("brief");
    }
    init();
  }, []);

  const allAcked = CRITICAL.every(c => acked.has(c.id));

  const doAdvance = useCallback(async () => {
    if (phase !== "brief") return;
    const rec = {
      provider: PROVIDER.name,
      timestamp: Date.now(),
      isoTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    await store.set("shift:lastStart", JSON.stringify({ timestamp: Date.now() }));
    await store.set("shift:acknowledgment", JSON.stringify(rec), true);
    setPhase("exiting");
    setTimeout(() => { window.location.href = "/CommandCenter"; }, 460);
  }, [phase]);


  useEffect(() => {
    const h = e => {
      if ((e.code === "Space" || e.code === "Enter") && phase === "brief") { e.preventDefault(); doAdvance(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, doAdvance]);

  const toggleAck = useCallback(id => {
    setAcked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  if (phase === "loading") return (
    <>
      <style>{css}</style>
      <div className="full-center">
        <div className="full-title" style={{ fontSize: "1.3rem", letterSpacing: ".15em", textTransform: "uppercase" }}>Lakonyx</div>
        <div className="ldot" />
      </div>
    </>
  );

  if (phase === "reentry") return (
    <>
      <style>{css}</style>
      <div className="sb">
        <div className="bg-grid" />
        <div className="hdr fade-in">
          <div className="brand">Lakonyx &mdash; Welcome Back</div>
          <div className="clock"><Clock /></div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative", zIndex: 2 }}>
          <div className="re-card fade-in">
            <div className="re-title">While you were away&hellip;</div>
            <div className="re-sub">Last check-in approx. 47 min ago &mdash; here&rsquo;s what changed</div>
            {DELTA.map(d => (
              <div key={d.id} className={`delta-item ${d.type}`}>
                <span className="delta-icon">{d.type === "critical" ? "\u26a0" : d.type === "success" ? "\u2191" : "\u2193"}</span>
                <span className="delta-txt">{d.text}</span>
              </div>
            ))}
            <div className="div" style={{ margin: ".75rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: ".72rem", color: "rgba(226,232,240,.4)" }}>Census</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem", color: "#0dc8aa" }}>
                {CENSUS.total} / {CENSUS.capacity}
              </span>
            </div>
            <button className="resume-btn" onClick={() => { setPhase("exiting"); setTimeout(() => { window.location.href = "/CommandCenter"; }, 460); }}>
              Resume Shift &rarr;
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className={`sb${phase === "exiting" ? " flash-out" : ""}`}>
        <div className="bg-grid" />

        <div style={{ flex: 0, padding: "1.75rem 1.75rem 0.5rem", color: "#0dc8aa", fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 600, letterSpacing: ".08em" }} className="fade-in">
          Shift Brief
        </div>

        <main className="body">

          {/* LEFT */}
          <div className="col fade-in s1">
            <div className="sec">
              <div className="sec-label">Situational awareness</div>
              <CensusGrid />
            </div>

            <div className="div" />

            <div className="sec">
              <div className="sec-inline">
                <div className="sec-label">Acuity distribution</div>
                <span style={{ fontSize: ".55rem", color: "rgba(226,232,240,.2)" }}>hover for detail</span>
              </div>
              <ESIBar />
            </div>

            <div className="div" />

            <div className="sec" style={{ flex: 1 }}>
              <div className="sec-inline">
                <div className="sec-label">Critical pending</div>
                <span style={{ fontSize: ".55rem", color: "rgba(226,232,240,.2)" }}>click to acknowledge</span>
              </div>
              {CRITICAL.map(c => {
                const isAcked = acked.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`crit-item ${isAcked ? "acked" : "pending pulse-ring"}`}
                    onClick={() => toggleAck(c.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && toggleAck(c.id)}
                  >
                    <div className="crit-chk">{isAcked ? "\u2713" : ""}</div>
                    <div className="crit-body">
                      <div className="crit-top">
                        <span className="crit-type">{c.type}</span>
                        <span className="crit-sep">&middot;</span>
                        <span className="crit-patient">{c.patient}</span>
                      </div>
                      <div className="crit-note">{c.note}</div>
                    </div>
                  </div>
                );
              })}
              <div className={`crit-gate${allAcked ? " ok" : ""}`}>
                {allAcked ? "\u2713 All critical results acknowledged" : `${CRITICAL.filter(c => !acked.has(c.id)).length} of ${CRITICAL.length} pending acknowledgment`}
              </div>
            </div>
          </div>

          {/* CENTER */}
          <div className="col-mid fade-in s2">
            <div className="sec">
              <div className="sec-label">Incoming handoff</div>
              <div className="h-title">State of the Department</div>
              <div className="h-sub">From {handoff.provider} &nbsp;&bull;&nbsp; Overlap {handoff.overlapWindow}</div>
            </div>

            <div className="div" />

            <div className="sec" style={{ flex: 1, gap: ".5rem" }}>
              {handoff.notes.map((n, i) => (
                <div className="hn" key={i}>
                  <div className="hn-dot" />
                  <span className="hn-txt">{n}</span>
                </div>
              ))}
            </div>

            <div className="div" />

            <div className="forecast">
              <div className="forecast-dot" />
              <span className="forecast-txt">{handoff.forecast}</span>
            </div>

            {ackRecord && (
              <div className="ack-badge">
                Previously reviewed by {ackRecord.provider} at {ackRecord.isoTime}
              </div>
            )}

            <button className="begin-btn" onClick={doAdvance}>
              Begin Shift →
            </button>
          </div>

          {/* RIGHT */}
          <div className="col fade-in s3">
            <div className="sec">
              <div className="sec-label">Your shift</div>
              <div className="p-name">{PROVIDER.name}</div>
              <div className="p-role">{PROVIDER.role}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div className="sblock">
                <div className="sblock-lbl">Hours</div>
                <div className="sblock-val" style={{ fontSize: ".78rem" }}>{PROVIDER.shiftStart} &mdash; {PROVIDER.shiftEnd}</div>
              </div>
              <div className="sblock">
                <div className="sblock-lbl">Remaining</div>
                <div className="sblock-val"><ShiftRemaining /></div>
              </div>
            </div>

            <div className="div" />

            <div className="sec">
              <div className="sec-inline">
                <div className="sec-label">Unsigned notes</div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", color: "rgba(234,179,8,.65)", marginLeft: "auto" }}>
                  {UNSIGNED_NOTES.length}
                </span>
              </div>
              {UNSIGNED_NOTES.map(n => (
                <div className="uns-item uns-note" key={n.id}>
                  <span className="uns-badge">NOTE</span>
                  <span className="uns-type">{n.type}</span>
                  <span className="uns-patient">{n.patient}</span>
                </div>
              ))}
            </div>

            <div className="div" />

            <div className="sec">
              <div className="sec-inline">
                <div className="sec-label">Unsigned orders</div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", color: "rgba(96,165,250,.65)", marginLeft: "auto" }}>
                  {UNSIGNED_ORDERS.length}
                </span>
              </div>
              {UNSIGNED_ORDERS.map(o => (
                <div className="uns-item uns-order" key={o.id}>
                  <span className="uns-badge">ORDER</span>
                  <span className="uns-type">{o.type}</span>
                  <span className="uns-patient">{o.patient}</span>
                </div>
              ))}
            </div>

            <div className="div" />

            <div className="sec">
              <div className="sec-label">Quick access</div>
              <div className="hub-grid">
                {HUBS.map(hub => (
                  <div className="hub-pill" key={hub.route} title={hub.label} onClick={() => { window.location.href = hub.route; }} style={{ cursor: "pointer" }}>{hub.label}</div>
                ))}
              </div>
            </div>

          </div>

        </main>

        <footer className="ftr fade-in s4">
          <div className="cta"><kbd>Space</kbd> or <kbd>Enter</kbd> to begin your shift</div>
        </footer>

      </div>
    </>
  );
}