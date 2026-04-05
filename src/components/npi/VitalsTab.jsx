import React, { useState, useEffect } from "react";

const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', cyan:'#00d4ff', teal:'#00e5c0', gold:'#f5c842',
  coral:'#ff6b6b', orange:'#ff9f43', txt:'#f4f9ff', txt2:'#c0d8f0',
  txt3:'#8aaccc', txt4:'#5a82a8',
};

const CSS = `
.vs-cell { background:${S.card}; border:1px solid ${S.border}; border-radius:10px; padding:8px 10px; display:flex; flex-direction:column; gap:4px; transition:all .2s; }
.vs-cell:focus-within { border-color:${S.blue}; box-shadow:0 0 0 2px rgba(59,158,255,.15); }
.vs-cell.abn { border-color:${S.coral}; box-shadow:0 0 8px rgba(255,107,107,.15); }
.vs-cell.low { border-color:${S.blue}; box-shadow:0 0 8px rgba(59,158,255,.15); }
.vs-cell.abn .vs-val { color:${S.coral}; }
.vs-cell.low .vs-val { color:${S.blue}; }
.vs-val { flex:1; background:transparent; border:none; outline:none; font-family:'JetBrains Mono',monospace; font-size:20px; font-weight:700; color:${S.txt}; text-align:center; width:100%; min-width:0; }
.vs-val::placeholder { color:${S.txt4}; font-weight:400; font-size:14px; }
.vs-val::-webkit-outer-spin-button, .vs-val::-webkit-inner-spin-button { -webkit-appearance:none; }
.vs-val[type=number] { -moz-appearance:textfield; }
.vs-stepper { width:20px; height:20px; border-radius:4px; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; font-weight:700; transition:all .12s; flex-shrink:0; }
.vs-stepper:hover { border-color:${S.blue}; color:${S.blue}; background:rgba(59,158,255,.08); }
.vs-stepper:active { transform:scale(.9); }
.esi-btn { width:52px; height:52px; border-radius:10px; cursor:pointer; border:2px solid ${S.border}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; background:${S.card}; transition:all .2s; user-select:none; }
.esi-btn:hover { border-color:${S.borderHi}; transform:translateY(-1px); }
.pain-btn { width:30px; height:30px; border-radius:6px; border:1px solid ${S.border}; background:${S.card}; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:${S.txt3}; transition:all .15s; user-select:none; }
.pain-btn:hover { border-color:${S.borderHi}; transform:translateY(-1px); }
.o2-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt2}; transition:all .15s; user-select:none; font-family:'DM Sans',sans-serif; }
.o2-chip:hover { border-color:${S.borderHi}; color:${S.txt}; }
.o2-chip.active { background:rgba(0,212,255,.12); border-color:${S.cyan}; color:${S.cyan}; }
.vs-chip-plain.active { background:rgba(0,212,255,.12); border-color:${S.cyan}; color:${S.cyan}; }
.vh-table { width:100%; border-collapse:collapse; }
.vh-table th { font-size:8px; color:${S.txt4}; text-transform:uppercase; letter-spacing:.06em; padding:4px 8px; text-align:center; font-weight:600; border-bottom:1px solid ${S.border}; }
.vh-table td { font-family:'JetBrains Mono',monospace; font-size:12px; padding:6px 8px; text-align:center; border-bottom:1px solid rgba(26,53,85,.3); color:${S.txt2}; }
.vh-table tr:hover td { background:${S.up}; }
.vh-table td.abn { color:${S.coral}; font-weight:600; }
.vh-table td.lo { color:${S.blue}; font-weight:600; }
.save-strip { display:flex; align-items:center; gap:10px; background:rgba(0,229,192,.04); border:1px solid rgba(0,229,192,.15); border-radius:12px; padding:12px 18px; }
`;

const RANGES = {
  sys:  { lo:90,  hi:140, min:40,  max:300, step:5   },
  dia:  { lo:60,  hi:90,  min:20,  max:200, step:5   },
  hr:   { lo:60,  hi:100, min:20,  max:250, step:5   },
  rr:   { lo:12,  hi:20,  min:4,   max:60,  step:1   },
  spo2: { lo:95,  hi:101, min:50,  max:100, step:1   },
  temp: { lo:36.1,hi:38.0,min:30,  max:45,  step:0.1 },
  gcs:  { lo:15,  hi:16,  min:3,   max:15,  step:1   },
  wt:   { lo:0,   hi:999, min:1,   max:400, step:1   },
  gluc: { lo:70,  hi:140, min:10,  max:800, step:10  },
};

const ESI_META = [
  { n:1, label:'Resus',   color:'#ff6b6b' },
  { n:2, label:'Emerg',   color:'#ff9f43' },
  { n:3, label:'Urgent',  color:'#f5c842' },
  { n:4, label:'Less Urg',color:'#00e5c0' },
  { n:5, label:'Non-Urg', color:'#3b9eff' },
];

const O2_OPTS = ['Room Air','Nasal Cannula','Simple Mask','Non-Rebreather','Venturi Mask','High-Flow NC','CPAP','BiPAP','BVM','Ventilator'];
const ARRIVAL_OPTS = [
  { label:'🚶 Walk-in', val:'Ambulatory' },
  { label:'🚑 EMS',      val:'Ambulance'  },
  { label:'♿ Wheelchair',val:'Wheelchair' },
  { label:'🛏 Stretcher', val:'Stretcher'  },
];
const PAIN_TYPES = ['Sharp','Dull','Pressure','Burning','Aching'];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function cellClass(id, vals) {
  const r = RANGES[id];
  if (!r) return '';
  const v = parseFloat(vals[id]);
  if (isNaN(v)) return '';
  if (id === 'spo2' || id === 'gcs') return v < r.lo ? 'low' : '';
  if (v > r.hi) return 'abn';
  if (v < r.lo) return 'low';
  return '';
}

export default function VitalsTab({ vitals, setVitals, avpu, setAvpu, o2del, setO2del, pain, setPain, triage, setTriage }) {
  const [esi, setEsi] = useState(null);
  const [arrival, setArrival] = useState('Ambulatory');
  const [localVals, setLocalVals] = useState({ sys:'', dia:'', hr:'', rr:'', spo2:'', temp:'', gcs:'', wt:'', gluc:'' });
  const [painScore, setPainScore] = useState(null);
  const [painType, setPainType] = useState('Sharp');
  const [o2Method, setO2Method] = useState('Room Air');
  const [o2Rate, setO2Rate] = useState('');
  const [o2Fio2, setO2Fio2] = useState('');
  const [sets, setSets] = useState([]);
  const [saveMsg, setSaveMsg] = useState('');
  const [entryTime, setEntryTime] = useState(nowTime());

  // sync parent vitals → local
  useEffect(() => {
    if (vitals) {
      setLocalVals(p => ({
        sys: vitals.sys || p.sys || '',
        dia: vitals.dia || p.dia || '',
        hr:  vitals.hr  || p.hr  || '',
        rr:  vitals.rr  || p.rr  || '',
        spo2:vitals.spo2|| p.spo2|| '',
        temp:vitals.temp|| p.temp|| '',
        gcs: vitals.gcs || p.gcs || '',
        wt:  vitals.wt  || p.wt  || '',
        gluc:vitals.gluc|| p.gluc|| '',
      }));
    }
  }, []);

  function updateVal(id, v) {
    setLocalVals(p => ({ ...p, [id]: v }));
    setVitals(p => ({ ...p, [id]: v }));
  }

  function step(id, delta) {
    const r = RANGES[id];
    let v = parseFloat(localVals[id]) || 0;
    v = Math.round((v + delta) * 10) / 10;
    v = Math.max(r.min, Math.min(r.max, v));
    const str = id === 'temp' ? v.toFixed(1) : String(v);
    updateVal(id, str);
  }

  function saveVitalSet() {
    const t = nowTime();
    const set = {
      time: t,
      sys: localVals.sys, dia: localVals.dia,
      hr: localVals.hr, rr: localVals.rr,
      spo2: localVals.spo2, temp: localVals.temp,
      gcs: localVals.gcs, pain: painScore,
      gluc: localVals.gluc,
      o2: o2Method + (o2Rate ? ` @ ${o2Rate}L` : ''),
    };
    setSets(p => [set, ...p]);
    setSaveMsg(`✅ Vital set saved at ${t}`);
    if (triage !== undefined && setTriage) setTriage(esi ? `ESI ${esi}` : triage);
    if (setPain && painScore !== null) setPain(String(painScore));
    if (setO2del) setO2del(o2Method + (o2Rate ? ` @ ${o2Rate}L` : ''));
  }

  function addNewSet() {
    setLocalVals({ sys:'', dia:'', hr:'', rr:'', spo2:'', temp:'', gcs:'', wt:'', gluc:'' });
    setPainScore(null);
    setO2Rate(''); setO2Fio2('');
    setSaveMsg('');
    setEntryTime(nowTime());
  }

  const box = { background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px' };
  const secH = { display:'flex', alignItems:'center', gap:10, marginBottom:14 };
  const inp = { width:48, background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'3px 6px', color:S.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:12, textAlign:'center', outline:'none' };

  const abnCount = Object.keys(RANGES).filter(id => {
    const r = RANGES[id]; const v = parseFloat(localVals[id]);
    if (isNaN(v)) return false;
    return v > r.hi || v < r.lo;
  }).length;

  function tdClass(id, val) {
    if (!val && val !== 0) return '';
    const r = RANGES[id]; if (!r) return '';
    const v = parseFloat(val);
    if (isNaN(v)) return '';
    if (id === 'spo2' || id === 'gcs') return v < r.lo ? 'lo' : '';
    if (v > r.hi) return 'abn';
    if (v < r.lo) return 'lo';
    return '';
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>📈</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Vital Signs</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Triage acuity · Rapid entry with +/− steppers · O₂ delivery · Trending timeline</div>
        </div>
        {abnCount > 0 && (
          <div style={{ marginLeft:'auto', background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:8, padding:'4px 12px', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.coral, fontWeight:600 }}>⚠ {abnCount} ABNORMAL</span>
          </div>
        )}
        {abnCount === 0 && sets.length > 0 && (
          <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(0,229,192,0.12)', color:S.teal, border:'1px solid rgba(0,229,192,0.3)' }}>{sets.length} SET{sets.length > 1 ? 'S' : ''} RECORDED</span>
        )}
      </div>

      {/* ESI Triage */}
      <div style={box}>
        <div style={secH}>
          <span style={{ fontSize:16 }}>🚨</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Triage Acuity — ESI Level</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Emergency Severity Index · Select level at triage</div>
          </div>
          {esi && (
            <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600,
              background: esi <= 2 ? 'rgba(255,107,107,0.15)' : esi === 3 ? 'rgba(245,200,66,0.12)' : 'rgba(0,229,192,0.12)',
              color: esi <= 2 ? S.coral : esi === 3 ? S.gold : S.teal,
              border: `1px solid ${esi <= 2 ? 'rgba(255,107,107,0.3)' : esi === 3 ? 'rgba(245,200,66,0.3)' : 'rgba(0,229,192,0.3)'}`,
            }}>ESI {esi}</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {ESI_META.map(e => (
            <button key={e.n} className="esi-btn" onClick={() => setEsi(esi === e.n ? null : e.n)}
              style={{ border:`2px solid ${esi === e.n ? e.color : S.border}`, background: esi === e.n ? `${e.color}18` : S.card, boxShadow: esi === e.n ? `0 0 16px ${e.color}40` : 'none' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color: esi === e.n ? e.color : S.txt3 }}>{e.n}</span>
              <span style={{ fontSize:7, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, color: esi === e.n ? e.color : S.txt4 }}>{e.label}</span>
            </button>
          ))}
          <div style={{ width:1, height:36, background:S.border, margin:'0 6px', flexShrink:0 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Arrival Mode</div>
            <div style={{ display:'flex', gap:4 }}>
              {ARRIVAL_OPTS.map(a => (
                <span key={a.val} className={`o2-chip${arrival === a.val ? ' active' : ''}`} onClick={() => setArrival(a.val)}>{a.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rapid Vital Entry */}
      <div style={box}>
        <div style={secH}>
          <span style={{ fontSize:16 }}>⚡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Rapid Vital Entry</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Tab through fields · Click +/− to nudge · Abnormals highlight automatically</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Entry Time</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:S.txt }}>{entryTime}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
          {/* BP — spans a bit wider */}
          <div className={`vs-cell ${cellClass('sys', localVals) === 'abn' || cellClass('dia', localVals) === 'abn' ? 'abn' : cellClass('sys', localVals) === 'low' ? 'low' : ''}`} style={{ gridColumn:'span 2' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Blood Pressure</span>
              <span style={{ fontSize:8, color:S.txt4 }}>mmHg</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                <button className="vs-stepper" onClick={() => step('sys', -5)}>−</button>
                <input type="number" className="vs-val" style={{ fontSize:18 }} placeholder="SYS" value={localVals.sys} onChange={e => updateVal('sys', e.target.value)} />
                <button className="vs-stepper" onClick={() => step('sys', 5)}>+</button>
              </div>
              <span style={{ color:S.txt3, fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700 }}>/</span>
              <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                <button className="vs-stepper" onClick={() => step('dia', -5)}>−</button>
                <input type="number" className="vs-val" style={{ fontSize:18 }} placeholder="DIA" value={localVals.dia} onChange={e => updateVal('dia', e.target.value)} />
                <button className="vs-stepper" onClick={() => step('dia', 5)}>+</button>
              </div>
            </div>
            <div style={{ fontSize:7, color:S.txt4, textAlign:'center', fontFamily:"'JetBrains Mono',monospace" }}>90-140 / 60-90</div>
          </div>

          {/* Other vitals */}
          {[
            { id:'hr',   label:'Heart Rate', unit:'bpm',     range:'60 – 100',   d:5   },
            { id:'rr',   label:'Resp Rate',  unit:'/min',    range:'12 – 20',    d:1   },
            { id:'spo2', label:'SpO₂',       unit:'%',       range:'≥ 95',       d:1   },
            { id:'temp', label:'Temp',        unit:'°C',      range:'36.1 – 38.0',d:0.1 },
            { id:'gcs',  label:'GCS',         unit:'/15',     range:'15 = alert', d:1   },
            { id:'wt',   label:'Weight',      unit:'kg',      range:'for dosing', d:1   },
            { id:'gluc', label:'Glucose',     unit:'mg/dL',   range:'70 – 140',   d:10  },
          ].map(v => (
            <div key={v.id} className={`vs-cell ${cellClass(v.id, localVals)}`}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{v.label}</span>
                <span style={{ fontSize:8, color:S.txt4 }}>{v.unit}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                <button className="vs-stepper" onClick={() => step(v.id, -v.d)}>−</button>
                <input type="number" className="vs-val" placeholder="—"
                  step={v.d} value={localVals[v.id]}
                  onChange={e => updateVal(v.id, e.target.value)} />
                <button className="vs-stepper" onClick={() => step(v.id, v.d)}>+</button>
              </div>
              <div style={{ fontSize:7, color:S.txt4, textAlign:'center', fontFamily:"'JetBrains Mono',monospace" }}>{v.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Score */}
      <div style={box}>
        <div style={secH}>
          <span style={{ fontSize:16 }}>😣</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Pain Score</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Tap a number · Color-coded by severity</div>
          </div>
          {painScore !== null && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600,
              background: painScore <= 3 ? 'rgba(0,229,192,0.12)' : painScore <= 6 ? 'rgba(245,200,66,0.12)' : 'rgba(255,107,107,0.15)',
              color: painScore <= 3 ? S.teal : painScore <= 6 ? S.gold : S.coral,
              border: `1px solid ${painScore <= 3 ? 'rgba(0,229,192,0.3)' : painScore <= 6 ? 'rgba(245,200,66,0.3)' : 'rgba(255,107,107,0.3)'}`,
            }}>{painScore}/10</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => {
              const active = painScore === n;
              let bc = S.border, cc = S.txt3, bg = S.card, shadow = 'none';
              if (active) {
                if (n <= 3)      { bc=S.teal;   cc=S.teal;   bg='rgba(0,229,192,0.12)';   shadow=`0 2px 8px rgba(0,229,192,.2)`; }
                else if (n <= 6) { bc=S.gold;   cc=S.gold;   bg='rgba(245,200,66,0.12)';   shadow=`0 2px 8px rgba(245,200,66,.2)`; }
                else if (n <= 8) { bc=S.orange; cc=S.orange; bg='rgba(255,159,67,0.12)';   shadow=`0 2px 8px rgba(255,159,67,.2)`; }
                else             { bc=S.coral;  cc=S.coral;  bg='rgba(255,107,107,0.15)';  shadow=`0 2px 8px rgba(255,107,107,.25)`; }
              }
              return (
                <button key={n} className="pain-btn" onClick={() => setPainScore(painScore === n ? null : n)}
                  style={{ border:`1px solid ${bc}`, color:cc, background:bg, boxShadow:shadow, transform: active ? 'translateY(-2px)' : 'none' }}>
                  {n}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Type</div>
            <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
              {PAIN_TYPES.map(t => (
                <span key={t} className={`o2-chip${painType === t ? ' active' : ''}`} onClick={() => setPainType(t)}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* O2 Delivery */}
      <div style={box}>
        <div style={secH}>
          <span style={{ fontSize:16 }}>💨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Oxygen Delivery</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Select delivery method and flow rate</div>
          </div>
          {o2Method !== 'Room Air' && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(59,158,255,0.12)', color:S.blue, border:'1px solid rgba(59,158,255,0.3)' }}>{o2Method}</span>
          )}
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {O2_OPTS.map(o => (
            <span key={o} className={`o2-chip${o2Method === o ? ' active' : ''}`} onClick={() => setO2Method(o)}>{o}</span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>Flow Rate</div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <input type="number" style={{ ...inp }} placeholder="—" min={0} max={100} value={o2Rate} onChange={e => setO2Rate(e.target.value)} />
              <span style={{ fontSize:11, color:S.txt3 }}>L/min</span>
            </div>
          </div>
          {o2Method !== 'Room Air' && (
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>FiO₂</div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <input type="number" style={{ ...inp }} placeholder="—" min={21} max={100} value={o2Fio2} onChange={e => setO2Fio2(e.target.value)} />
                <span style={{ fontSize:11, color:S.txt3 }}>%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Strip */}
      <div className="save-strip">
        <button onClick={saveVitalSet}
          style={{ padding:'10px 28px', background:'linear-gradient(135deg,#00e5c0,#00b4a0)', color:S.bg, border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>
          💾 Save Vital Set
        </button>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, marginLeft:8 }}>
          {saveMsg && <span style={{ fontSize:11, color:S.teal, fontWeight:600 }}>{saveMsg}</span>}
          <span style={{ fontSize:10, color:S.txt3 }}>All fields are auto-timestamped on save</span>
        </div>
        <button onClick={addNewSet}
          style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          + Add Another Set
        </button>
      </div>

      {/* Timeline */}
      <div style={box}>
        <div style={secH}>
          <span style={{ fontSize:16 }}>📊</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Vitals Timeline</div>
            <div style={{ fontSize:11, color:S.txt3 }}>All recorded vital sets — most recent first</div>
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(0,229,192,0.12)', color:S.teal, border:'1px solid rgba(0,229,192,0.3)' }}>{sets.length} SET{sets.length !== 1 ? 'S' : ''}</span>
        </div>
        {sets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:S.txt4, fontSize:12, fontStyle:'italic' }}>No vital sets recorded yet. Fill in the fields above and click Save.</div>
        ) : (
          <div style={{ maxHeight:240, overflowY:'auto' }}>
            <table className="vh-table">
              <thead>
                <tr>
                  <th>Time</th><th>BP</th><th>HR</th><th>RR</th><th>SpO₂</th><th>Temp</th><th>GCS</th><th>Pain</th><th>Gluc</th><th>O₂</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:10, color:S.txt3, whiteSpace:'nowrap' }}>{s.time}</td>
                    <td className={s.sys && (parseFloat(s.sys) > 140 || parseFloat(s.dia) > 90) ? 'abn' : s.sys && parseFloat(s.sys) < 90 ? 'lo' : ''}>{s.sys ? `${s.sys}/${s.dia}` : '—'}</td>
                    <td className={tdClass('hr', { hr:s.hr })}>{s.hr || '—'}</td>
                    <td className={tdClass('rr', { rr:s.rr })}>{s.rr || '—'}</td>
                    <td className={tdClass('spo2', { spo2:s.spo2 })}>{s.spo2 ? `${s.spo2}%` : '—'}</td>
                    <td className={tdClass('temp', { temp:s.temp })}>{s.temp || '—'}</td>
                    <td className={tdClass('gcs', { gcs:s.gcs })}>{s.gcs || '—'}</td>
                    <td>{s.pain !== null && s.pain !== '' ? `${s.pain}/10` : '—'}</td>
                    <td className={tdClass('gluc', { gluc:s.gluc })}>{s.gluc || '—'}</td>
                    <td style={{ fontSize:10 }}>{s.o2 || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}