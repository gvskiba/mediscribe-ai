import React from "react";
import { PE_SYSTEMS } from "./npiData";

const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', coral:'#ff6b6b', orange:'#ff9f43',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes pe-fadein { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
.pe-card { display:flex; flex-direction:column; background:${S.card}; border:1px solid ${S.border}; border-radius:10px; overflow:hidden; transition:border-color .15s; }
.pe-card:hover { border-color:${S.borderHi}; }
.pe-card.s1 { border-color:rgba(0,229,192,0.35); background:rgba(0,229,192,0.04); }
.pe-card.s2 { border-color:rgba(255,107,107,0.35); background:rgba(255,107,107,0.04); }
.pe-card-header { display:flex; align-items:center; gap:8px; padding:10px 12px; }
.pe-state-btns { display:flex; gap:3px; margin-left:auto; }
.pe-btn { width:26px; height:22px; border-radius:4px; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; }
.pe-btn:hover { border-color:${S.borderHi}; color:${S.txt}; }
.pe-btn.norm.active { background:rgba(0,229,192,.15); border-color:${S.teal}; color:${S.teal}; }
.pe-btn.abn.active { background:rgba(255,107,107,.15); border-color:${S.coral}; color:${S.coral}; }
.pe-btn.na.active { background:${S.up}; border-color:${S.border}; color:${S.txt2}; }
.pe-normal { font-size:11px; color:${S.txt3}; font-style:italic; padding:0 12px 10px; line-height:1.5; animation:pe-fadein .2s ease; }
.pe-textarea { width:100%; background:rgba(0,0,0,0.2); border:none; border-top:1px solid rgba(255,107,107,0.2); padding:10px 12px; color:${S.txt}; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; resize:vertical; min-height:70px; line-height:1.5; animation:pe-fadein .2s ease; }
.pe-textarea::placeholder { color:${S.txt4}; }
`;

export default function PETab({ peState, setPeState, peFindings, setPeFindings }) {
  const setPE = (id, val) => {
    setPeState(prev => ({ ...prev, [id]: val }));
    if (val === 1) {
      const def = PE_SYSTEMS.find(s => s.id === id);
      if (def) setPeFindings(prev => ({ ...prev, [id]: def.normal }));
    }
  };

  const markAll = (val) => {
    const next = {};
    PE_SYSTEMS.forEach(s => { next[s.id] = val; });
    setPeState(next);
    if (val === 1) {
      const findings = {};
      PE_SYSTEMS.forEach(s => { findings[s.id] = s.normal; });
      setPeFindings(findings);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>🩺</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Physical Examination</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>✓ Normal · ✗ Abnormal · — Not assessed</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button
            onClick={() => markAll(1)}
            style={{ background:'rgba(0,229,192,.1)', border:`1px solid rgba(0,229,192,.3)`, borderRadius:6, padding:'5px 12px', fontSize:11, fontWeight:600, color:S.teal, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
          >✓ Normal Exam (All)</button>
          <button
            onClick={() => markAll(0)}
            style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'5px 12px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
          >↺ Reset All</button>
        </div>
      </div>

      {/* Summary bar */}
      {(() => {
        const normal = PE_SYSTEMS.filter(s => (peState[s.id] ?? 0) === 1).length;
        const abnormal = PE_SYSTEMS.filter(s => (peState[s.id] ?? 0) === 2).length;
        const total = PE_SYSTEMS.length;
        if (normal === 0 && abnormal === 0) return null;
        return (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:S.panel, border:`1px solid ${S.border}`, borderRadius:8, padding:'8px 14px' }}>
            <span style={{ fontSize:11, color:S.txt3 }}>Progress:</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.teal }}>{normal} Normal</span>
            {abnormal > 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.coral }}>{abnormal} Abnormal</span>}
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.txt4 }}>{total - normal - abnormal} Remaining</span>
            <div style={{ flex:1, height:4, background:S.border, borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${((normal + abnormal) / total) * 100}%`, background: abnormal > 0 ? S.orange : S.teal, borderRadius:2, transition:'width .3s' }} />
            </div>
          </div>
        );
      })()}

      {/* PE Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
        {PE_SYSTEMS.map(s => {
          const val = peState[s.id] ?? 0;
          return (
            <div key={s.id} className={`pe-card${val === 1 ? ' s1' : val === 2 ? ' s2' : ''}`}>
              <div className="pe-card-header">
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color:S.txt, flex:1 }}>{s.name}</span>
                <div className="pe-state-btns">
                  <button className={`pe-btn norm${val === 1 ? ' active' : ''}`} onClick={() => setPE(s.id, val === 1 ? 0 : 1)} title="Normal">✓</button>
                  <button className={`pe-btn abn${val === 2 ? ' active' : ''}`} onClick={() => setPE(s.id, val === 2 ? 0 : 2)} title="Abnormal">✗</button>
                  <button className={`pe-btn na${val === 0 ? ' active' : ''}`} onClick={() => setPE(s.id, 0)} title="Not assessed">—</button>
                </div>
              </div>
              {val === 1 && (
                <div className="pe-normal">{s.normal}</div>
              )}
              {val === 2 && (
                <textarea
                  className="pe-textarea"
                  value={peFindings[s.id] || s.normal}
                  onChange={e => setPeFindings(p => ({ ...p, [s.id]: e.target.value }))}
                  rows={3}
                  placeholder="Describe abnormal findings…"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}