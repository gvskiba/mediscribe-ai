// ─────────────────────────────────────────────────────────────────────────────
//  PatientContextBar — Notrya shared component
//  Two-row patient header: Row1 = Identity, Row2 = Status + Actions
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";

const PCB_PREFIX = "pcb";

(() => {
  const id = `${PCB_PREFIX}-css`;
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
/* ── ROW 1: IDENTITY ─────────────────────────────────────────────────────── */
.pcb-row1 {
  height: 38px; flex-shrink: 0;
  background: rgba(5,12,24,0.95);
  border-bottom: 1px solid rgba(26,53,85,0.45);
  display: flex; align-items: center;
  padding: 0 16px; gap: 0;
  overflow: hidden; z-index: 30;
}
.pcb-room {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
  color: #5a82a8; padding: 2px 8px; border-radius: 4px;
  background: rgba(14,37,68,0.6); border: 1px solid #1a3555;
  margin-right: 10px; flex-shrink: 0; white-space: nowrap;
}
.pcb-mrn {
  font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #5a82a8;
  padding: 1px 8px; border-radius: 20px;
  background: rgba(14,37,68,0.4); border: 1px solid rgba(26,53,85,0.55);
  margin-right: 12px; flex-shrink: 0; white-space: nowrap;
}
.pcb-name {
  font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700;
  color: #f2f7ff; margin-right: 12px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; flex-shrink: 1; min-width: 0;
}
.pcb-demo {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #82aece;
  white-space: nowrap; flex-shrink: 0; margin-right: 6px;
}
.pcb-dob {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #5a82a8;
  white-space: nowrap; flex-shrink: 0;
}
.pcb-idiv {
  width: 1px; height: 15px; background: rgba(42,79,122,0.4);
  flex-shrink: 0; margin: 0 12px;
}
.pcb-prov {
  font-family: 'DM Sans', sans-serif; font-size: 11px; color: #5a82a8;
  white-space: nowrap; flex-shrink: 0;
}
.pcb-los {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
  flex-shrink: 0; margin-left: auto; white-space: nowrap; padding-left: 16px;
}

/* ── ROW 2: STATUS + ACTIONS ─────────────────────────────────────────────── */
.pcb-row2 {
  height: 50px; flex-shrink: 0;
  background: #081628;
  border-bottom: 1px solid #1a3555;
  display: flex; align-items: center;
  padding: 0 16px; gap: 0; overflow: hidden; z-index: 30;
}

/* Chief Complaint zone */
.pcb-cc-zone {
  display: flex; align-items: center; gap: 6px;
  padding-right: 14px;
  border-right: 1px solid rgba(42,79,122,0.35);
  margin-right: 14px; flex-shrink: 0;
}
.pcb-cc-lbl {
  font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase; color: #5a82a8;
}
.pcb-cc-val {
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  color: #ff9f43; white-space: nowrap; max-width: 180px;
  overflow: hidden; text-overflow: ellipsis;
}

/* Allergy zone */
.pcb-alg-zone {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 7px;
  background: rgba(255,68,68,0.07);
  border: 1px solid rgba(255,68,68,0.28);
  margin-right: 14px; flex-shrink: 0; cursor: default;
}
.pcb-alg-icon { width: 13px; height: 13px; flex-shrink: 0; }
.pcb-alg-lbl3 {
  font-size: 9px; color: #ff6b6b; text-transform: uppercase;
  letter-spacing: .05em; font-weight: 700;
}
.pcb-alg-pills { display: flex; gap: 4px; }
.pcb-alg-pill3 {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
  background: rgba(255,107,107,0.2); color: #ff6b6b; border-radius: 4px;
  padding: 1px 7px; white-space: nowrap;
}
.pcb-nkda {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: #3dffa0; padding: 1px 7px; border-radius: 4px;
  background: rgba(61,255,160,.08); border: 1px solid rgba(61,255,160,.2);
}

/* Vitals zone */
.pcb-vit-zone {
  display: flex; align-items: center; gap: 4px;
  padding-right: 14px;
  border-right: 1px solid rgba(42,79,122,0.35);
  margin-right: 14px; flex-shrink: 0;
}
.pcb-vcard {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 4px 10px; border-radius: 7px;
  background: rgba(14,37,68,0.55); border: 1px solid rgba(26,53,85,0.6);
  min-width: 54px; transition: border-color .15s;
}
.pcb-vcard.abn {
  background: rgba(255,107,107,0.07);
  border-color: rgba(255,107,107,0.35);
}
.pcb-vc-lbl {
  font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #5a82a8;
  letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; line-height: 1;
}
.pcb-vc-val {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700;
  color: #f2f7ff; line-height: 1; display: flex; align-items: baseline; gap: 1px;
}
.pcb-vcard.abn .pcb-vc-val { color: #ff6b6b; }
.pcb-trend { font-size: 10px; }

/* ESI zone */
.pcb-esi-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4px 12px; border-radius: 7px; margin-right: 14px; flex-shrink: 0;
}
.pcb-esi-lbl {
  font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 1px;
  text-transform: uppercase; line-height: 1; margin-bottom: 2px;
}
.pcb-esi-val {
  font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 700; line-height: 1;
}

/* Actions zone */
.pcb-acts {
  margin-left: auto; display: flex; align-items: center; gap: 5px; flex-shrink: 0;
}
.pcb-act-div {
  width: 1px; height: 24px; background: rgba(42,79,122,0.4);
  flex-shrink: 0; margin: 0 3px;
}
.pcb-btn {
  padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap;
  border: none; transition: all .13s; display: flex; align-items: center; gap: 5px;
}
.pcb-btn.ghost {
  background: rgba(14,37,68,0.6); border: 1px solid rgba(26,53,85,0.8) !important; color: #b8d4f0;
}
.pcb-btn.ghost:hover { border-color: #2a4f7a !important; color: #f2f7ff; }
.pcb-btn.teal  { background: #00e5c0; color: #050f1e; }
.pcb-btn.teal:hover  { filter: brightness(1.08); }
.pcb-btn.coral { background: rgba(255,107,107,.12); color: #ff6b6b; border: 1px solid rgba(255,107,107,.3) !important; }
.pcb-btn.coral:hover { background: rgba(255,107,107,.22); }
.pcb-btn.gold  { background: rgba(245,200,66,.12); color: #f5c842; border: 1px solid rgba(245,200,66,.3) !important; }
.pcb-btn.gold:hover  { background: rgba(245,200,66,.22); }
.pcb-btn.ghost-green { background: rgba(61,255,160,.08); color: #3dffa0; border: 1px solid rgba(61,255,160,.25) !important; }
.pcb-btn:disabled { opacity: .45; cursor: not-allowed; filter: none; }
`;
  document.head.appendChild(s);
})();

// ── Constants ────────────────────────────────────────────────────────────────

const ESI_STYLE = {
  1: { bg:"rgba(255,68,68,.18)",    border:"rgba(255,68,68,.5)",    color:"#ff4444", lbl:"rgba(255,68,68,.6)"    },
  2: { bg:"rgba(255,107,107,.14)",  border:"rgba(255,107,107,.45)", color:"#ff6b6b", lbl:"rgba(255,107,107,.6)"  },
  3: { bg:"rgba(245,200,66,.12)",   border:"rgba(245,200,66,.4)",   color:"#f5c842", lbl:"rgba(245,200,66,.6)"   },
  4: { bg:"rgba(61,255,160,.1)",    border:"rgba(61,255,160,.35)",  color:"#3dffa0", lbl:"rgba(61,255,160,.55)"  },
  5: { bg:"rgba(90,130,168,.12)",   border:"rgba(90,130,168,.35)",  color:"#82aece", lbl:"rgba(90,130,168,.6)"   },
};

function losDisplay(arrival) {
  if (!arrival) return { str: "—", color: "#5a82a8" };
  const mins = Math.floor((Date.now() - new Date(arrival).getTime()) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  const color = mins > 360 ? "#ff6b6b" : mins > 180 ? "#f5c842" : "#5a82a8";
  return { str: h > 0 ? `${h}h ${m}m` : `${m}m`, color };
}

function trendArrow(trend) {
  if (!trend || trend.length < 2) return null;
  const delta = trend[trend.length - 1] - trend[trend.length - 2];
  if (Math.abs(delta) < 2) return { symbol:"→", color:"#82aece" };
  return delta > 0 ? { symbol:"↑", color:"#ff9f43" } : { symbol:"↓", color:"#3dffa0" };
}

function isAbnormal(key, val) {
  const n = typeof val === "string" ? parseInt(val) : val;
  if (key === "hr")   return n > 100 || n < 50;
  if (key === "bp")   return parseInt(String(val)) > 160 || parseInt(String(val)) < 90;
  if (key === "spo2") return n < 94;
  if (key === "rr")   return n > 20 || n < 12;
  if (key === "temp") return n > 100.4 || n < 96.8;
  return false;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VitalCard({ label, value, unit, abnormal, trend }) {
  const arr = trend ? trendArrow(trend) : null;
  return (
    <div className={`pcb-vcard${abnormal ? " abn" : ""}`}>
      <span className="pcb-vc-lbl">{label}</span>
      <span className="pcb-vc-val">
        {value}
        {unit && <span style={{ fontSize:8, color:"#5a82a8", marginLeft:1 }}>{unit}</span>}
        {arr && <span className="pcb-trend" style={{ color: arr.color }}>{arr.symbol}</span>}
      </span>
    </div>
  );
}

function AllergyZone({ allergies }) {
  if (!allergies || allergies.length === 0) {
    return (
      <div className="pcb-alg-zone" style={{ background:"rgba(61,255,160,.04)", borderColor:"rgba(61,255,160,.2)" }}>
        <span className="pcb-nkda">NKDA</span>
      </div>
    );
  }
  return (
    <div className="pcb-alg-zone">
      <svg className="pcb-alg-icon" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L12.5 11.5H1.5L7 1.5Z" stroke="#ff4444" strokeWidth="1.3" strokeLinejoin="round"/>
        <line x1="7" y1="5.2" x2="7" y2="8.2" stroke="#ff4444" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="9.8" r=".7" fill="#ff4444"/>
      </svg>
      <span className="pcb-alg-lbl3">Allergy</span>
      <div className="pcb-alg-pills">
        {allergies.slice(0, 3).map(a => (
          <span key={a} className="pcb-alg-pill3">{a}</span>
        ))}
        {allergies.length > 3 && <span className="pcb-alg-pill3">+{allergies.length - 3}</span>}
      </div>
    </div>
  );
}

function EsiBadge({ esi }) {
  const s = ESI_STYLE[esi] || ESI_STYLE[5];
  return (
    <div className="pcb-esi-zone" style={{ background: s.bg, border:`1px solid ${s.border}` }}>
      <span className="pcb-esi-lbl" style={{ color: s.lbl }}>ESI</span>
      <span className="pcb-esi-val" style={{ color: s.color }}>{esi}</span>
    </div>
  );
}

function Btn({ label, icon, variant, onClick, disabled }) {
  return (
    <button className={`pcb-btn ${variant || "ghost"}`} onClick={onClick} disabled={disabled}>
      {icon && <span style={{ fontSize:13 }}>{icon}</span>}
      {label}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
//
//  Props:
//    pt           — patient object (mrn, room, first, last, age, sex, dob, cc,
//                   allergies, provider, arrival, vitals{hr,bp,spo2,temp?},
//                   vitalTrend?{hr[],bp[],spo2[]}, esi)
//    onBack       — fn() for ← back button
//    backLabel    — label for back button (default "Board")
//    signState    — "pending" | "ready" | "signed"
//    blockerCount — number of unresolved blockers
//    onSign       — fn() for sign button
//    onNoteStudio — fn() for Note Studio button
//    onDischarge  — fn() for Discharge button (omit to hide)
//    extraActions — [{ label, icon, variant, onClick }]
//    showSave     — bool (default true)
//    onSave       — fn() for Save Chart

export default function PatientContextBar({
  pt,
  onBack,
  backLabel    = "Board",
  signState    = "pending",
  blockerCount = 0,
  onSign,
  onNoteStudio,
  onDischarge,
  extraActions = [],
  showSave     = true,
  onSave,
}) {
  const signBtn = useMemo(() => {
    if (signState === "signed")  return { label:"✓ Signed",             variant:"ghost-green", disabled:true  };
    if (signState === "ready")   return { label:"✍ Sign & Complete",     variant:"teal",        disabled:false };
    return { label:`⚠ ${blockerCount} Required`,                         variant:"gold",        disabled:false };
  }, [signState, blockerCount]);

  if (!pt) return null;

  const los  = losDisplay(pt.arrival);
  const vt   = pt.vitalTrend || {};
  const v    = pt.vitals || {};
  const vitalCards = [
    { key:"hr",   label:"HR",   value: v.hr,    unit:"",   trend: vt.hr   },
    { key:"bp",   label:"BP",   value: v.bp,    unit:"",   trend: vt.bp   },
    { key:"spo2", label:"SpO₂", value: v.spo2,  unit:"%",  trend: vt.spo2 },
    ...(v.temp != null ? [{ key:"temp", label:"Temp", value: v.temp, unit:"°F", trend: null }] : []),
  ].filter(c => c.value != null);

  return (
    <>
      {/* ── Row 1: Identity ── */}
      <div className="pcb-row1">
        {pt.room && <span className="pcb-room">{pt.room}</span>}
        <span className="pcb-mrn">{pt.mrn}</span>
        <span className="pcb-name">{pt.last}, {pt.first}</span>
        {(pt.age || pt.sex) && <span className="pcb-demo">{pt.age}{pt.sex}</span>}
        {pt.dob && <span className="pcb-dob">DOB {pt.dob}</span>}
        {pt.provider && (
          <>
            <div className="pcb-idiv"/>
            <span className="pcb-prov">{pt.provider}</span>
          </>
        )}
        {pt.arrival && (
          <span className="pcb-los" style={{ color: los.color }}>⏱ {los.str}</span>
        )}
      </div>

      {/* ── Row 2: Status + Actions ── */}
      <div className="pcb-row2">
        {pt.cc && (
          <div className="pcb-cc-zone">
            <span className="pcb-cc-lbl">CC</span>
            <span className="pcb-cc-val">{pt.cc}</span>
          </div>
        )}

        <AllergyZone allergies={pt.allergies}/>

        {vitalCards.length > 0 && (
          <div className="pcb-vit-zone">
            {vitalCards.map(c => (
              <VitalCard
                key={c.key}
                label={c.label}
                value={c.value}
                unit={c.unit}
                abnormal={isAbnormal(c.key, c.value)}
                trend={c.trend}
              />
            ))}
          </div>
        )}

        {pt.esi && <EsiBadge esi={pt.esi}/>}

        <div className="pcb-acts">
          {onBack && <Btn label={`← ${backLabel}`} variant="ghost" onClick={onBack}/>}

          {onNoteStudio && (
            <Btn label="Note Studio" icon="📄" variant="ghost" onClick={onNoteStudio}/>
          )}

          {extraActions.map((a, i) => (
            <Btn key={i} label={a.label} icon={a.icon} variant={a.variant} onClick={a.onClick}/>
          ))}

          {onDischarge && (
            <Btn label="Discharge" icon="🚪" variant="coral" onClick={onDischarge}/>
          )}

          {showSave && (
            <Btn label="Save Chart" icon="💾" variant="teal" onClick={onSave}/>
          )}

          {onSign && (
            <>
              <div className="pcb-act-div"/>
              <Btn
                label={signBtn.label}
                variant={signBtn.variant}
                onClick={onSign}
                disabled={signBtn.disabled}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}