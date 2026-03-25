import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b',
  orange:'#ff9f43', purple:'#9b6dff',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CATEGORY_META = {
  resuscitation: { label: 'Resuscitation / ACLS', icon: '⚡' },
  cardiac:       { label: 'Cardiac',               icon: '🫀' },
  seizure:       { label: 'Seizures',              icon: '🧠' },
  respiratory:   { label: 'Respiratory',           icon: '🫁' },
  analgesic:     { label: 'Pain Management',       icon: '💊' },
  rsi:           { label: 'RSI / Intubation',      icon: '🫁' },
  sedation:      { label: 'Sedation',              icon: '😴' },
  psych:         { label: 'Agitation / Psych',     icon: '🧘' },
  anticoag:      { label: 'Anticoagulants',        icon: '🩸' },
  abx:           { label: 'Antibiotics',           icon: '🦠' },
  antibiotics:   { label: 'Antibiotics',           icon: '🦠' },
  gi:            { label: 'GI',                    icon: '🩺' },
  other:         { label: 'Other',                 icon: '💉' },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
.mrp{color:${T.txt};font-family:'DM Sans',sans-serif;font-size:14px;display:flex;flex-direction:column;overflow:hidden;height:100%}
.mrp *,.mrp *::before,.mrp *::after{box-sizing:border-box}
.mrp-hdr{height:52px;background:${T.panel};border-bottom:1px solid ${T.border};display:flex;align-items:center;gap:10px;padding:0 16px;flex-shrink:0;flex-wrap:wrap}
.mrp-title-wrap{display:flex;align-items:center;gap:8px}
.mrp-logo{width:28px;height:28px;background:${T.teal};border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:${T.bg};flex-shrink:0}
.mrp-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${T.txt};white-space:nowrap}
.mrp-search{flex:1;max-width:320px;display:flex;align-items:center;gap:8px;background:${T.up};border:1px solid ${T.border};border-radius:7px;padding:0 12px;transition:border-color .15s}
.mrp-search:focus-within{border-color:${T.borderHi}}
.mrp-search input{flex:1;background:transparent;border:none;outline:none;color:${T.txt};font-size:13px;padding:7px 0;font-family:'DM Sans',sans-serif}
.mrp-search input::placeholder{color:${T.txt3}}
.mrp-tabs{display:flex;gap:2px;margin-left:auto;flex-shrink:0}
.mrp-tab{padding:6px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:${T.txt3};letter-spacing:.8px;text-transform:uppercase;cursor:pointer;border:1px solid transparent;transition:all .15s;white-space:nowrap}
.mrp-tab:hover{color:${T.txt2};background:${T.up}}
.mrp-tab.on{background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.25);color:${T.teal}}
.mrp-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.cat-rail{flex-shrink:0;border-bottom:1px solid ${T.border};overflow-x:auto;overflow-y:hidden;padding:8px 12px;display:flex;flex-direction:row;gap:6px;background:${T.panel}}
.cat-btn{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:6px;padding:6px 14px;border-radius:20px;cursor:pointer;border:1px solid ${T.border};transition:all .18s;text-align:center;white-space:nowrap;flex-shrink:0}
.cat-btn:hover{background:${T.up};border-color:${T.borderHi}}
.cat-btn.on{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.5)}
.cat-ico{font-size:14px;line-height:1}
.cat-nm{font-size:11px;font-weight:600;color:${T.txt2};line-height:1.2}
.cat-btn.on .cat-nm{color:${T.teal};font-weight:700}
.cat-ct{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt4};background:${T.up};border-radius:10px;padding:1px 6px}
.drug-list{flex:1;overflow-y:auto;padding:12px 16px;min-height:0}
.dlh{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(26,53,85,.4)}
.dlh-ico{font-size:18px}
.dlh-nm{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${T.txt}}
.dlh-ct{font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.txt3}}
.dr{padding:10px 14px;border-radius:8px;margin-bottom:5px;background:${T.up};border:1px solid rgba(26,53,85,.4);cursor:pointer;transition:all .12s}
.dr:hover{border-color:${T.border};background:${T.card}}
.dr.ex{border-color:${T.borderHi};background:${T.card}}
.dr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.dr-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.dr-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px}
.dr-info{flex:1;min-width:0}
.dr-nm{font-weight:600;color:${T.txt};font-size:13px}
.dr-brand{font-size:10px;color:${T.txt3};margin-top:1px}
.dr-ds{margin-top:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:${T.teal};font-weight:600}
.dr-badges{display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0}
.dr-det{margin-top:10px;padding-top:10px;border-top:1px solid rgba(26,53,85,.4);display:flex;flex-direction:column;gap:10px}
.b{display:inline-block;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.4px}
.b-t{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.2);color:${T.teal}}
.b-g{background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.2);color:${T.gold}}
.b-b{background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.2);color:${T.blue}}
.b-o{background:rgba(255,159,67,.1);border:1px solid rgba(255,159,67,.2);color:${T.orange}}
.b-hi{background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.25);color:${T.coral}}
.b-p{background:rgba(155,109,255,.12);border:1px solid rgba(155,109,255,.25);color:${T.purple}}
.section-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:${T.txt4};letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px;font-weight:600}
.detail-box{background:${T.bg};border-radius:8px;padding:10px 12px;border:1px solid rgba(26,53,85,.3)}
.full-pane{flex:1;overflow-y:auto;padding:16px 20px}
.section-box{background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:14px 16px;margin-bottom:12px}
.field-input{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:8px 12px;color:${T.txt};font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%;transition:border-color .15s}
.field-input:focus{border-color:${T.blue}}
.field-input::placeholder{color:${T.txt4}}
.field-select{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:8px 12px;color:${T.txt};font-size:12px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;width:100%}
.wbar{display:flex;align-items:center;gap:14px;padding:10px 14px;background:rgba(0,229,192,.04);border:1px solid rgba(0,229,192,.12);border-radius:12px;margin-bottom:12px;flex-wrap:wrap}
.cstat{background:${T.up};border-radius:6px;padding:5px 10px;text-align:center;border:1px solid ${T.border}}
.csv{font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace}
.csl{font-size:7px;letter-spacing:.08em;text-transform:uppercase;color:${T.txt3};margin-top:1px}
.sol-card{background:${T.panel};border:1px solid ${T.border};border-radius:12px;padding:14px 16px;margin-bottom:8px}
.sol-vol{padding:8px 12px;border-radius:8px;margin-top:6px;background:rgba(59,158,255,.06);border:1px solid rgba(59,158,255,.2);display:flex;align-items:baseline;gap:8px}
.rmax{font-size:8px;padding:1px 6px;border-radius:3px;background:rgba(245,200,66,.1);color:${T.gold};font-weight:700;margin-left:4px}
.bzb{padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-left:auto}
.sep-chk{display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:6px;margin-bottom:3px;font-size:12px;cursor:pointer;transition:all .12s;user-select:none}
.sep-chk.crit{background:rgba(255,107,107,.04);border:1px solid rgba(255,107,107,.1)}
.sep-chk.norm{background:${T.up};border:1px solid rgba(26,53,85,.4)}
.sep-chk.done-chk .stxt{text-decoration:line-through;color:${T.txt3} !important}
.ai-resp{padding:14px 16px;background:${T.card};border-radius:12px;border:1px solid ${T.border};font-size:12px;line-height:1.75;color:${T.txt2}}
.ai-resp h2{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:${T.txt};margin:14px 0 6px;padding-bottom:4px;border-bottom:1px solid ${T.border}}
.ai-resp h3{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:${T.teal};letter-spacing:1.5px;text-transform:uppercase;margin:12px 0 4px}
.ai-resp li{margin-left:16px;margin-bottom:3px;color:${T.txt2}}
.ai-resp strong{color:${T.txt}}
.ai-resp-warn{padding:8px 12px;border-radius:6px;font-size:10px;line-height:1.5;background:rgba(255,107,107,.04);border-left:3px solid ${T.coral};color:rgba(255,107,107,.65);margin-top:8px}
.btn-ghost{background:${T.up};border:1px solid ${T.border};border-radius:6px;padding:4px 10px;font-size:11px;color:${T.txt2};cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-family:'DM Sans',sans-serif}
.btn-ghost:hover{border-color:${T.borderHi};color:${T.txt}}
.btn-primary{background:${T.teal};color:${T.bg};border:none;border-radius:6px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:filter .15s}
.btn-primary:hover{filter:brightness(1.1)}
.btn-primary:disabled{opacity:.4;cursor:default}
.btn-coral{background:rgba(255,107,107,.15);color:${T.coral};border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-coral:hover{background:rgba(255,107,107,.25)}
.btn-coral:disabled{opacity:.4;cursor:default}
.ai-loader{display:flex;gap:5px;padding:12px 0;align-items:center}
.ai-loader span{width:7px;height:7px;border-radius:50%;background:${T.teal};animation:mrpbounce 1.2s ease-in-out infinite}
.ai-loader span:nth-child(2){animation-delay:.2s}
.ai-loader span:nth-child(3){animation-delay:.4s}
@keyframes mrpbounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
.ai-loader-txt{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt3};letter-spacing:2px;text-transform:uppercase;margin-left:10px}
.no-data{text-align:center;padding:40px;color:${T.txt3}}
.no-data-i{font-size:32px;margin-bottom:8px}
.no-data-t{font-size:13px}
.high-alert-badge{background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.3);color:${T.coral};padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace}
.mrp ::-webkit-scrollbar{width:4px}
.mrp ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
@media(max-width:900px){.cat-nm{display:none}}
`;

const PEDS_STATIC = [
  {name:"Acetaminophen",mpk:15,mx:1000,route:"PO/PR",freq:"q4-6h",notes:"Avoid hepatic impairment.",sols:[{l:"Infant 100mg/mL",c:100,u:"mg/mL"},{l:"Children's 32mg/mL",c:32,u:"mg/mL"}]},
  {name:"Ibuprofen",mpk:10,mx:400,route:"PO",freq:"q6-8h",notes:"Avoid <6 months.",sols:[{l:"Infant 40mg/mL",c:40,u:"mg/mL"},{l:"Children's 20mg/mL",c:20,u:"mg/mL"}]},
  {name:"Epinephrine (IM)",mpk:0.01,mx:0.3,route:"IM",freq:"q5-15min PRN",notes:"Always anterolateral thigh.",sols:[{l:"1:1000 1mg/mL",c:1,u:"mg/mL"}]},
  {name:"Albuterol Neb",mpk:0.15,mx:5,route:"Neb",freq:"q20min x3",notes:"Continuous 0.5 mg/kg/hr severe.",sols:[{l:"5mg/mL",c:5,u:"mg/mL"}]},
  {name:"Midazolam (Seizure)",mpk:0.2,mx:10,route:"IN/IM/IV",freq:"x1, may repeat",notes:"IN: split between nares.",sols:[{l:"5mg/mL",c:5,u:"mg/mL"},{l:"1mg/mL IV",c:1,u:"mg/mL"}]},
  {name:"Ondansetron",mpk:0.15,mx:4,route:"IV/PO",freq:"q6-8h",notes:"Safe >6 months.",sols:[{l:"ODT 4mg",c:4,u:"mg/tab"},{l:"IV 2mg/mL",c:2,u:"mg/mL"}]},
];

const H1 = [
  {a:"Measure lactate level",crit:true},
  {a:"Obtain blood cultures before antibiotics",crit:true},
  {a:"Administer broad-spectrum antibiotics",crit:true},
  {a:"Begin 30 mL/kg crystalloid (hypotension or lactate >= 4)",crit:true},
  {a:"Apply vasopressors if hypotensive during/after resuscitation (MAP >= 65)",crit:false},
];
const REASSES = [
  {a:"Reassess volume status and tissue perfusion",crit:true},
  {a:"Re-measure lactate if initial lactate elevated",crit:false},
  {a:"Assess for organ dysfunction (SOFA score)",crit:false},
];

function estWt(mo) {
  if (mo < 3) return 3.5 + mo * 0.9;
  if (mo < 12) return 6 + (mo - 3) * 0.5;
  const y = mo / 12;
  return y <= 2 ? 10 + (y - 1) * 2.5 : y * 3 + 7;
}
function getBroselow(w) {
  const zones=[{mx:5,z:'Grey',h:'#9ca3af'},{mx:7,z:'Pink',h:'#ec4899'},{mx:9,z:'Red',h:'#ef4444'},{mx:11,z:'Purple',h:'#8b5cf6'},{mx:14,z:'Yellow',h:'#eab308'},{mx:18,z:'White',h:'#e2e8f0'},{mx:23,z:'Blue',h:'#3b82f6'},{mx:29,z:'Orange',h:'#f97316'},{mx:36,z:'Green',h:'#22c55e'},{mx:999,z:'Adult',h:'#6b7280'}];
  return zones.find(z=>w<z.mx) || zones[zones.length-1];
}
function etTube(w) {
  if(w<3) return '2.5'; if(w<5) return '3.0';
  return (Math.round((w/4+4)*2)/2).toFixed(1);
}

function renderAiText(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ') || line.startsWith('# ')) return <h2 key={i}>{line.replace(/^#+\s/,'')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i}>{line.replace(/^###\s/,'')}</h3>;
    if (line.match(/^[-*]\s/)) return <li key={i} dangerouslySetInnerHTML={{__html: line.replace(/^[-*]\s/,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}} />;
    if (line.trim() === '') return <div key={i} style={{height:6}} />;
    return <div key={i} dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}} />;
  });
}

function DrugRow({ drug, isX, onToggle }) {
  const primaryDose = drug.dosing?.[0];
  const doseDisplay = primaryDose ? `${primaryDose.dose} ${primaryDose.route || ''}`.trim() : (drug.route || '—');

  return (
    <div className={`dr${isX?' ex':''}`} onClick={onToggle}>
      <div className="dr-top">
        <div className="dr-left">
          <span className="dr-dot" style={{background:isX?T.teal:T.txt4,boxShadow:isX?`0 0 6px ${T.teal}`:'none'}} />
          <div className="dr-info">
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span className="dr-nm">{drug.name}</span>
              {drug.highAlert && <span className="high-alert-badge">HIGH ALERT</span>}
            </div>
            {drug.brand && <div className="dr-brand">{drug.brand}</div>}
            <div className="dr-ds">{doseDisplay}</div>
          </div>
        </div>
        <div className="dr-badges">
          {drug.route && <span className="b b-t">{drug.route}</span>}
          {drug.schedule && <span className="b b-hi">C-{drug.schedule}</span>}
          {drug.pregnancy && <span className="b b-g">Preg {drug.pregnancy}</span>}
        </div>
      </div>

      {isX && (
        <div className="dr-det">
          <div style={{background:'rgba(59,158,255,0.05)',border:'1px solid rgba(59,158,255,0.15)',borderRadius:8,padding:'10px 12px'}}>
            <div className="section-lbl">Drug Class</div>
            <div style={{fontSize:13,fontWeight:600,color:T.blue,marginBottom:drug.mechanism?6:0}}>{drug.drugClass}</div>
            {drug.mechanism && <>
              <div className="section-lbl" style={{marginTop:4}}>Mechanism</div>
              <div style={{fontSize:12,color:T.txt2}}>{drug.mechanism}</div>
            </>}
          </div>

          {drug.indications && (
            <div className="detail-box">
              <div className="section-lbl">Indications</div>
              <div style={{fontSize:12,color:T.txt2,lineHeight:1.65}}>{drug.indications}</div>
            </div>
          )}

          {drug.dosing?.length > 0 && (
            <div style={{background:'rgba(0,229,192,0.04)',border:'1px solid rgba(0,229,192,0.15)',borderRadius:10,padding:'10px 12px'}}>
              <div className="section-lbl">Dosing</div>
              {drug.dosing.map((d, i) => (
                <div key={i} style={{borderBottom:i<drug.dosing.length-1?'1px solid rgba(26,53,85,0.4)':'none',paddingBottom:i<drug.dosing.length-1?8:0,marginBottom:i<drug.dosing.length-1?8:0}}>
                  {d.indication && <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:T.txt3,marginBottom:2,textTransform:'uppercase',letterSpacing:'1px'}}>{d.indication}</div>}
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:14,fontWeight:800,color:T.teal}}>{d.dose}</div>
                  <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
                    {d.route && <span className="b b-t">{d.route}</span>}
                    {d.duration && <span className="b b-g">{d.duration}</span>}
                  </div>
                  {d.notes && <div style={{fontSize:11,color:T.txt3,marginTop:4,fontStyle:'italic'}}>{d.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {(drug.contraindications?.length > 0 || drug.warnings?.length > 0) && (
            <div style={{background:'rgba(255,107,107,0.04)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:8,padding:'10px 12px'}}>
              {drug.contraindications?.length > 0 && <>
                <div className="section-lbl">Contraindications</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:drug.warnings?.length>0?8:0}}>
                  {drug.contraindications.map((c,i) => <span key={i} className="b b-hi">{c}</span>)}
                </div>
              </>}
              {drug.warnings?.length > 0 && <>
                <div className="section-lbl">Warnings</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {drug.warnings.map((w,i) => <span key={i} className="b b-o">{w}</span>)}
                </div>
              </>}
            </div>
          )}

          {drug.interactions?.length > 0 && (
            <div className="detail-box">
              <div className="section-lbl">Drug Interactions</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {drug.interactions.map((x,i) => <span key={i} className="b b-p">{x}</span>)}
              </div>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:drug.renal?.length>0?'1fr 1fr':'1fr',gap:8}}>
            {drug.monitoring && (
              <div className="detail-box">
                <div className="section-lbl">Monitoring</div>
                <div style={{fontSize:12,color:T.txt2}}>{drug.monitoring}</div>
              </div>
            )}
            {drug.renal?.length > 0 && (
              <div className="detail-box">
                <div className="section-lbl">Renal Dosing</div>
                {drug.renal.map((r,i) => (
                  <div key={i} style={{marginBottom:4}}>
                    <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:T.gold}}>{r.tier}</span>
                    <div style={{fontSize:11,color:T.txt2}}>{r.dose}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(drug.halfLife || drug.pb || drug.ba || drug.vd) && (
            <div className="detail-box">
              <div className="section-lbl">Pharmacokinetics</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {drug.halfLife && <div><div style={{fontSize:8,color:T.txt4,textTransform:'uppercase',letterSpacing:'1.5px'}}>Half-Life</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:T.teal}}>{drug.halfLife}</div></div>}
                {drug.pb && <div><div style={{fontSize:8,color:T.txt4,textTransform:'uppercase',letterSpacing:'1.5px'}}>Protein Binding</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:T.teal}}>{drug.pb}</div></div>}
                {drug.ba && <div><div style={{fontSize:8,color:T.txt4,textTransform:'uppercase',letterSpacing:'1.5px'}}>Bioavailability</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:T.teal}}>{drug.ba}</div></div>}
                {drug.vd && <div><div style={{fontSize:8,color:T.txt4,textTransform:'uppercase',letterSpacing:'1.5px'}}>Vd</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:T.teal}}>{drug.vd}</div></div>}
              </div>
            </div>
          )}

          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <button className="btn-ghost" style={{fontSize:10}} onClick={e=>{e.stopPropagation();const txt=drug.dosing?.[0]?`${drug.name}: ${drug.dosing[0].dose} ${drug.dosing[0].route||''}`.trim():`${drug.name} - ${drug.route||''}`;navigator.clipboard?.writeText(txt);}}>
              Copy Dose
            </button>
            {drug.monitoring && (
              <button className="btn-ghost" style={{fontSize:10}} onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(`${drug.name} monitoring: ${drug.monitoring}`);}}>
                Copy Monitoring
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MedicationReference() {
  const [tab, setTab] = useState('drugs');
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [pedAge, setPedAge] = useState('');
  const [pedUnit, setPedUnit] = useState('months');
  const [pedWt, setPedWt] = useState('');
  const [pedSols, setPedSols] = useState({});

  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [sepWt, setSepWt] = useState('');
  const [sepQuery, setSepQuery] = useState('');
  const [sepResult, setSepResult] = useState('');
  const [sepLoading, setSepLoading] = useState(false);
  const [sepChecked, setSepChecked] = useState({});

  useEffect(() => {
    base44.entities.Medication.list('name', 500).then(data => {
      setMeds(data || []);
      if (data?.length > 0) {
        const cats = [...new Set(data.map(m => m.category).filter(Boolean))];
        setActiveCat(cats[0] || null);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const byCategory = useMemo(() => {
    const map = {};
    meds.forEach(m => {
      const c = m.category || 'other';
      if (!map[c]) map[c] = [];
      map[c].push(m);
    });
    return map;
  }, [meds]);

  const catOrder = ['resuscitation','cardiac','seizure','respiratory','analgesic','rsi','sedation','psych','anticoag','abx','antibiotics','gi','other'];
  const categories = useMemo(() => {
    const present = Object.keys(byCategory);
    const ordered = catOrder.filter(c => present.includes(c));
    present.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [byCategory]);

  const displayedDrugs = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return meds.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q) ||
        m.drugClass?.toLowerCase().includes(q) ||
        m.indications?.toLowerCase().includes(q)
      );
    }
    if (activeCat) return byCategory[activeCat] || [];
    return meds;
  }, [meds, byCategory, activeCat, search]);

  const weight = useMemo(() => {
    if (pedWt) return parseFloat(pedWt) || null;
    if (!pedAge) return null;
    const mo = pedUnit === 'years' ? parseFloat(pedAge) * 12 : parseFloat(pedAge);
    if (isNaN(mo) || mo < 0) return null;
    return Math.round(estWt(mo) * 10) / 10;
  }, [pedAge, pedUnit, pedWt]);
  const bz = weight ? getBroselow(weight) : null;

  const handleAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI. Follow ACEP/AHA/SSC guidelines.\n\nED Complaint: ${aiQuery}\n\nProvide evidence-based medication recommendations with:\n## First-Line\n- Drug name, dose, route\n## Second-Line\n- Alternatives\n## Key Monitoring\n## Critical Safety\n- Contraindications\n\nClinical judgment should always prevail.`
      });
      setAiResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setAiResult('AI Engine offline. Please try again.');
    }
    setAiLoading(false);
  };

  const handleSepsis = async () => {
    const w = parseFloat(sepWt);
    if (!w) return;
    setSepLoading(true); setSepResult('');
    const bolus = (w * 30).toFixed(0);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Sepsis Protocol AI. Surviving Sepsis Campaign 2021.\n\nPatient Weight: ${w} kg, Fluid Bolus: ${bolus} mL${sepQuery?`\nSuspected Source: ${sepQuery}`:''}\n\nProvide:\n## Fluid Resuscitation\n## Antibiotic Recommendations\n## Vasopressors\n## Monitoring\n## Critical Warnings`
      });
      setSepResult(typeof res === 'string' ? res : JSON.stringify(res));
    } catch {
      setSepResult(`AI offline.\n\n## Manual Protocol\n- Fluid Bolus: ${bolus} mL\n- Vancomycin: 25-30 mg/kg IV\n- Pip-Tazo: 4.5 g IV q6h\n- Norepinephrine: 0.1-0.5 mcg/kg/min if MAP <65`);
    }
    setSepLoading(false);
  };

  const toggleSep = (k) => setSepChecked(p => ({...p,[k]:!p[k]}));
  const TABS = [['drugs','Drug Database'],['peds','Peds Dosing'],['ai','AI Search'],['sepsis','Sepsis Protocol']];
  const activeCatMeta = activeCat ? (CATEGORY_META[activeCat] || { label: activeCat, icon: '💊' }) : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="mrp">
        <div className="mrp-hdr">
          <div className="mrp-title-wrap">
            <div className="mrp-logo">Mr</div>
            <div className="mrp-title">ED Medication Reference</div>
          </div>
          {tab === 'drugs' && (
            <div className="mrp-search" style={{marginLeft:16}}>
              <span style={{color:T.txt3,fontSize:14}}>🔍</span>
              <input placeholder="Search drugs, class, indication..." value={search} onChange={e=>{setSearch(e.target.value);setExpanded(null);}} />
              {search && <span style={{cursor:'pointer',color:T.txt3,fontSize:13}} onClick={()=>setSearch('')}>x</span>}
            </div>
          )}
          <div className="mrp-tabs">
            {TABS.map(([id,lbl])=>(
              <div key={id} className={`mrp-tab${tab===id?' on':''}`} onClick={()=>setTab(id)}>{lbl}</div>
            ))}
          </div>
        </div>

        <div className="mrp-body">

          {tab === 'drugs' && (
            <>
              {!search && (
                <div className="cat-rail">
                  {categories.map(cat=>{
                    const meta = CATEGORY_META[cat] || {label:cat,icon:'💊'};
                    return (
                      <div key={cat} className={`cat-btn${activeCat===cat?' on':''}`} onClick={()=>{setActiveCat(cat);setExpanded(null);}}>
                        <div className="cat-ico">{meta.icon}</div>
                        <div className="cat-nm">{meta.label}</div>
                        <div className="cat-ct">{byCategory[cat]?.length||0}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="drug-list">
                {loading ? (
                  <div className="no-data">
                    <div className="ai-loader" style={{justifyContent:'center'}}><span/><span/><span/><span className="ai-loader-txt">LOADING DRUGS_DB</span></div>
                  </div>
                ) : displayedDrugs.length === 0 ? (
                  <div className="no-data"><div className="no-data-i">🔍</div><div className="no-data-t">No drugs found</div></div>
                ) : (
                  <>
                    <div className="dlh">
                      <span className="dlh-ico">{search?'🔍':(activeCatMeta?.icon||'💊')}</span>
                      <span className="dlh-nm">{search?'Search Results':(activeCatMeta?.label||'All Drugs')}</span>
                      <span className="dlh-ct">{displayedDrugs.length} drug{displayedDrugs.length!==1?'s':''}</span>
                    </div>
                    {displayedDrugs.map(drug=>(
                      <DrugRow key={drug.id} drug={drug} isX={expanded===drug.id} onToggle={()=>setExpanded(expanded===drug.id?null:drug.id)} />
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {tab === 'peds' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="section-lbl">Patient Parameters</div>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <input className="field-input" type="number" min="0" placeholder="Age..." value={pedAge} onChange={e=>setPedAge(e.target.value)} style={{width:90}} />
                  <select className="field-select" value={pedUnit} onChange={e=>setPedUnit(e.target.value)} style={{width:100}}>
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                  <input className="field-input" type="number" min="0" step="0.1" placeholder="Override weight (kg)" value={pedWt} onChange={e=>setPedWt(e.target.value)} style={{flex:1,minWidth:170}} />
                </div>
              </div>
              {weight && bz ? (
                <>
                  <div className="wbar">
                    <div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px',marginBottom:2}}>WEIGHT</div>
                      <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:26,fontWeight:800,color:T.teal}}>{weight}</span>
                        <span style={{fontSize:12,color:T.txt2}}>kg</span>
                        {!pedWt && <span style={{fontSize:9,color:T.txt3}}>(est.)</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <div className="cstat"><div className="csv" style={{color:T.teal}}>{etTube(weight)} mm</div><div className="csl">ET Tube</div></div>
                      <div className="cstat"><div className="csv" style={{color:T.gold}}>{Math.min(weight*2,120)} J</div><div className="csl">Defib 2J/kg</div></div>
                      <div className="cstat"><div className="csv" style={{color:'#9b6dff'}}>{(weight*0.01).toFixed(2)} mg</div><div className="csl">Epi Arrest</div></div>
                      <div className="cstat"><div className="csv" style={{color:T.blue}}>{(weight*0.1).toFixed(1)} mg</div><div className="csl">Atropine</div></div>
                    </div>
                    <div className="bzb" style={{background:bz.h+'22',color:bz.h,border:`1px solid ${bz.h}44`}}>{bz.z}</div>
                  </div>
                  {PEDS_STATIC.map((d,idx)=>{
                    const raw=weight*d.mpk, fin=Math.min(raw,d.mx), cap=raw>d.mx;
                    const si=pedSols[d.name];
                    let vol=null;
                    if(si!==undefined&&d.sols[si]){const s=d.sols[si];const isTab=s.u==='mg/tab'||s.u==='mg/dose';vol={v:(fin/s.c).toFixed(2),u:isTab?(s.u==='mg/tab'?'tab(s)':'dose(s)'):'mL'};}
                    return (
                      <div key={idx} className="sol-card">
                        <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                          <div>
                            <div style={{fontFamily:'Playfair Display,serif',fontSize:13,fontWeight:700,color:T.txt}}>{d.name}</div>
                            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:T.txt3,marginTop:2}}>{d.mpk} mg/kg · {d.route} · {d.freq}</div>
                          </div>
                          <div style={{display:'flex',gap:4}}><span className="b b-t">{d.route}</span><span className="b b-o">Max {d.mx}mg</span></div>
                        </div>
                        <div style={{padding:'8px 12px',borderRadius:8,marginTop:8,background:cap?'rgba(245,200,66,.06)':'rgba(0,229,192,.06)',border:`1px solid ${cap?'rgba(245,200,66,.18)':'rgba(0,229,192,.18)'}`}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px'}}>DOSE</span>
                            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:20,fontWeight:800,color:cap?T.gold:T.teal}}>{fin.toFixed(1)} mg</span>
                            {cap&&<span className="rmax">MAX</span>}
                          </div>
                        </div>
                        <div style={{marginTop:10}}>
                          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px',marginBottom:4}}>FORMULATION</div>
                          <select className="field-select" value={si!==undefined?si:''} onChange={e=>setPedSols(p=>({...p,[d.name]:e.target.value===''?undefined:parseInt(e.target.value)}))}>
                            <option value="">Select Strength</option>
                            {d.sols.map((s,si)=><option key={si} value={si}>{s.l}</option>)}
                          </select>
                          {vol&&<div className="sol-vol"><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:T.txt4,letterSpacing:'2px'}}>VOLUME</span><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:18,fontWeight:800,color:T.blue}}>{vol.v} {vol.u}</span></div>}
                        </div>
                        <div style={{marginTop:8,fontSize:10,color:T.txt3,fontStyle:'italic',background:T.bg,padding:'6px 8px',borderRadius:4}}>{d.notes}</div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="no-data"><div className="no-data-i">⚖️</div><div className="no-data-t">Enter patient age or weight above</div></div>
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="full-pane">
              <div className="section-box">
                <div className="section-lbl">AI Clinical Decision Support</div>
                <div style={{fontSize:12,color:T.txt2,marginBottom:12,lineHeight:1.6}}>Enter a chief complaint for evidence-based medication recommendations.</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input className="field-input" placeholder="e.g. SVT, DKA, Croup, AFib with RVR..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAI()} style={{flex:1,minWidth:200}} />
                  <button className="btn-primary" onClick={handleAI} disabled={aiLoading||!aiQuery.trim()}>{aiLoading?'...':'Analyze'}</button>
                </div>
                <div style={{marginTop:10,display:'flex',gap:5,flexWrap:'wrap'}}>
                  {['SVT','Migraine','DKA','Hyperkalemia','PE','Croup','RSI','NSTEMI'].map(q=>(
                    <button key={q} className="btn-ghost" style={{fontSize:9,padding:'2px 10px'}} onClick={()=>setAiQuery(q)}>{q}</button>
                  ))}
                </div>
              </div>
              {aiLoading&&<div className="section-box"><div className="ai-loader"><span/><span/><span/><span className="ai-loader-txt">PROCESSING</span></div></div>}
              {aiResult&&!aiLoading&&(
                <div className="section-box">
                  <div className="section-lbl" style={{marginBottom:10}}>Recommendations - {aiQuery}</div>
                  <div className="ai-resp">{renderAiText(aiResult)}</div>
                  <div className="ai-resp-warn">AI-generated recommendations. Clinical judgment should always prevail.</div>
                </div>
              )}
            </div>
          )}

          {tab === 'sepsis' && (
            <div className="full-pane">
              <div className="section-box" style={{borderColor:'rgba(255,107,107,.2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:24}}>🦠</span>
                  <div>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:700,color:T.coral}}>Sepsis Protocol</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'rgba(255,107,107,.4)',letterSpacing:'2px',marginTop:2}}>SURVIVING SEPSIS CAMPAIGN 2021</div>
                  </div>
                </div>
              </div>
              <div className="section-box">
                <div className="section-lbl">Weight and Fluid Calculation</div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                  <input className="field-input" type="number" placeholder="Patient weight (kg)..." value={sepWt} onChange={e=>setSepWt(e.target.value)} style={{flex:1}} />
                  <span style={{color:T.txt3,fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>kg</span>
                </div>
                {parseFloat(sepWt)>0&&(
                  <div style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,107,107,.04)',border:'1px solid rgba(255,107,107,.15)'}}>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:8,color:'rgba(255,107,107,.5)',letterSpacing:'2px',marginBottom:4}}>30 ML/KG BOLUS</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:30,fontWeight:800,color:T.coral}}>{(parseFloat(sepWt)*30).toFixed(0)} mL</div>
                  </div>
                )}
              </div>
              <div className="section-box">
                <div className="section-lbl">Hour-1 Bundle</div>
                {H1.map((s,i)=>{const k=`h1-${i}`,done=sepChecked[k];return(
                  <div key={i} className={`sep-chk ${s.crit?'crit':'norm'}${done?' done-chk':''}`} onClick={()=>toggleSep(k)}>
                    <span style={{fontSize:14,fontWeight:700,width:20,textAlign:'center',color:done?T.teal:s.crit?T.coral:T.txt3,flexShrink:0}}>{done?'V':s.crit?'!':'o'}</span>
                    <span className="stxt" style={{color:done?T.txt3:s.crit?T.txt:T.txt2}}>{s.a}</span>
                  </div>
                );})}
              </div>
              {parseFloat(sepWt)>0&&(()=>{const w=parseFloat(sepWt);return(
                <div className="section-box">
                  <div className="section-lbl">Weight-Based Medications</div>
                  {[
                    {n:'Vancomycin',v:`${(w*25).toFixed(0)}-${(w*30).toFixed(0)} mg`,r:'IV',t:'Infuse over 1-2h'},
                    {n:'Norepinephrine',v:'0.1-0.5 mcg/kg/min',r:'IV drip',t:'First-line vasopressor'},
                    {n:'Hydrocortisone',v:'100 mg',r:'IV q8h',t:'Refractory shock only'},
                    {n:'Piperacillin-Tazobactam',v:'4.5 g',r:'IV q6h',t:'Extended infusion 4h'},
                  ].map((m,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.up,border:`1px solid ${T.border}`,borderRadius:6,marginBottom:4,flexWrap:'wrap',gap:6}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{m.n}</div>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:T.txt3}}>{m.r} - {m.t}</div>
                      </div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:16,fontWeight:800,color:T.teal}}>{m.v}</div>
                    </div>
                  ))}
                </div>
              );})()}
              <div className="section-box">
                <div className="section-lbl" style={{marginBottom:8}}>AI Sepsis Advisor</div>
                <input className="field-input" placeholder="Suspected infection source..." value={sepQuery} onChange={e=>setSepQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSepsis()} style={{marginBottom:8}} />
                <button className="btn-coral" onClick={handleSepsis} disabled={sepLoading||!sepWt}>{sepLoading?'...':'Generate Protocol'}</button>
                {!sepWt&&<div style={{fontSize:10,color:'rgba(255,107,107,.5)',marginTop:6}}>Enter patient weight above first</div>}
                {sepLoading&&<div className="ai-loader" style={{marginTop:10}}><span/><span/><span/><span className="ai-loader-txt">SEPSIS ENGINE</span></div>}
                {sepResult&&!sepLoading&&(<>
                  <div className="ai-resp" style={{marginTop:12}}>{renderAiText(sepResult)}</div>
                  <div className="ai-resp-warn">AI-generated protocol. Follow institutional sepsis protocols.</div>
                </>)}
              </div>
              <div className="section-box">
                <div className="section-lbl">Reassessment Checklist</div>
                {REASSES.map((s,i)=>{const k=`re-${i}`,done=sepChecked[k];return(
                  <div key={i} className={`sep-chk ${s.crit?'crit':'norm'}${done?' done-chk':''}`} onClick={()=>toggleSep(k)}>
                    <span style={{fontSize:14,fontWeight:700,width:20,textAlign:'center',color:done?T.teal:s.crit?T.coral:T.txt3,flexShrink:0}}>{done?'V':s.crit?'!':'o'}</span>
                    <span className="stxt" style={{color:done?T.txt3:s.crit?T.txt:T.txt2}}>{s.a}</span>
                  </div>
                );})}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}