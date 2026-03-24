import React, { useState } from 'react';

const T = {
  bg:'#050f1e',panel:'#081628',card:'#0b1e36',up:'#0e2544',
  border:'#1a3555',borderHi:'#2a4f7a',
  blue:'#3b9eff',teal:'#00e5c0',gold:'#f5c842',coral:'#ff6b6b',
  txt:'#e8f0fe',txt2:'#8aaccc',txt3:'#4a6a8a',txt4:'#2e4a6a',
};

// Map each clickable region to procedure keys
const REGION_PROCS = {
  head:     { label: 'Head & Face',    procs: ['lac','epi','cantho','dental','lp'], icon: '🧠' },
  neck:     { label: 'Neck',           procs: ['lac','cl','intub','cryo'],          icon: '🫁' },
  chest:    { label: 'Chest / Thorax', procs: ['ct','thorac','pericardio','cv','cl','fast'], icon: '🫁' },
  abdomen:  { label: 'Abdomen',        procs: ['par','fast','ngt','foley'],         icon: '🫀' },
  pelvis:   { label: 'Pelvis / Groin', procs: ['foley','paraph','detors','femblk','fascblk'], icon: '🔵' },
  rarm:     { label: 'Right Arm',      procs: ['lac','iand','fb','piv','art','digblk','sp_proc','red','wc'], icon: '💪' },
  larm:     { label: 'Left Arm',       procs: ['lac','iand','fb','piv','art','digblk','sp_proc','red','wc'], icon: '💪' },
  rhand:    { label: 'Right Hand',     procs: ['lac','fb','nail','digblk','sp_proc','wc'], icon: '🖐️' },
  lhand:    { label: 'Left Hand',      procs: ['lac','fb','nail','digblk','sp_proc','wc'], icon: '🖐️' },
  rleg:     { label: 'Right Leg',      procs: ['lac','iand','fb','sp_proc','red','femblk','fascblk','wc'], icon: '🦵' },
  lleg:     { label: 'Left Leg',       procs: ['lac','iand','fb','sp_proc','red','femblk','fascblk','wc'], icon: '🦵' },
  rfoot:    { label: 'Right Foot',     procs: ['lac','fb','nail','digblk','wc','sp_proc'], icon: '🦶' },
  lfoot:    { label: 'Left Foot',      procs: ['lac','fb','nail','digblk','wc','sp_proc'], icon: '🦶' },
  back:     { label: 'Back / Spine',   procs: ['lp','lac','iand','wc'],             icon: '🦴' },
  trauma:   { label: 'Multi-trauma',   procs: ['fast','burn','dth','io','cl','ct','intub'], icon: '⚡' },
};

const RISK_COLOR = { high: T.coral, mod: '#ff9f43', low: T.teal };

// Procedure display names (subset)
const PNAMES = {
  lac:'Laceration Repair', iand:'I&D / Abscess', fb:'Foreign Body', wc:'Wound Irrigation',
  nail:'Nail Trephination', intub:'Intubation/RSI', cryo:'Cricothyrotomy', sed:'Procedural Sedation',
  cl:'Central Line', piv:'Peripheral IV', io:'IO Access', art:'Arterial Line',
  ct:'Chest Tube', thorac:'Thoracentesis', pericardio:'Pericardiocentesis',
  sp_proc:'Splint Application', red:'Fracture Reduction',
  cv:'Cardioversion', lp:'Lumbar Puncture', fast:'FAST Exam',
  par:'Paracentesis', arth:'Arthrocentesis', foley:'Foley Catheter', ngt:'NGT',
  epi:'Epistaxis Packing', cantho:'Lateral Canthotomy', dental:'Dental Block',
  digblk:'Digital Block', femblk:'Femoral Block', fascblk:'Fascia Iliaca Block',
  paraph:'Paraphimosis', detors:'Testicular Detorsion',
  burn:'Burn Assessment', dth:'Death Pronouncement',
};
const RISK = {
  lac:'low',iand:'low',fb:'low',wc:'low',nail:'low',
  intub:'high',cryo:'high',sed:'mod',
  cl:'high',piv:'low',io:'high',art:'mod',
  ct:'high',thorac:'mod',pericardio:'high',
  sp_proc:'low',red:'mod',cv:'high',lp:'mod',fast:'low',
  par:'mod',arth:'mod',foley:'low',ngt:'low',
  epi:'low',cantho:'high',dental:'low',
  digblk:'low',femblk:'low',fascblk:'low',
  paraph:'mod',detors:'high',burn:'mod',dth:'low',
};

const CSS = `
.amap-wrap{display:flex;gap:16px;font-family:'DM Sans',sans-serif}
.amap-left{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.amap-right{flex:1;display:flex;flex-direction:column;gap:10px}
.amap-region{cursor:pointer;transition:all .18s;outline:none}
.amap-region:hover path,.amap-region:hover ellipse,.amap-region:hover rect,.amap-region:hover circle{opacity:.85;filter:brightness(1.3)}
.amap-region.active path,.amap-region.active ellipse,.amap-region.active rect,.amap-region.active circle{filter:drop-shadow(0 0 8px ${T.teal})}
.amap-view-toggle{display:flex;gap:5px;background:${T.up};border:1px solid ${T.border};border-radius:8px;padding:3px}
.amap-vbtn{padding:4px 12px;border-radius:5px;font-size:11px;cursor:pointer;border:none;background:transparent;color:${T.txt3};font-family:'DM Sans',sans-serif;transition:all .15s}
.amap-vbtn.active{background:${T.card};color:${T.txt};border:1px solid ${T.border}}
.amap-proc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:7px}
.amap-proc-card{display:flex;align-items:center;gap:8px;padding:8px 10px;background:${T.card};border:1px solid ${T.border};border-radius:8px;cursor:pointer;transition:all .18s}
.amap-proc-card:hover{border-color:${T.borderHi};background:${T.up};transform:translateY(-1px)}
.amap-proc-card.highlighted{border-color:${T.teal};background:rgba(0,229,192,.07)}
.amap-hint{font-size:11px;color:${T.txt3};text-align:center;padding:24px 0}
.amap-region-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:${T.up};border:1px solid ${T.border};border-radius:20px;font-size:11px;color:${T.txt2};cursor:pointer;transition:all .15s;white-space:nowrap}
.amap-region-btn:hover{border-color:${T.borderHi};color:${T.txt}}
.amap-region-btn.active{background:rgba(0,229,192,.12);border-color:${T.teal};color:${T.teal}}
`;

// SVG body regions - front view
function BodySVG({ activeRegion, onRegion, side }) {
  const fill = (r) => activeRegion === r ? T.teal : '#1a3a5c';
  const stroke = (r) => activeRegion === r ? T.teal : '#2a5580';

  if (side === 'back') {
    return (
      <svg viewBox="0 0 160 400" width="130" height="320" style={{ overflow: 'visible' }}>
        {/* Head */}
        <g className={`amap-region${activeRegion==='head'?' active':''}`} onClick={() => onRegion('head')}>
          <ellipse cx="80" cy="32" rx="26" ry="30" fill={fill('head')} stroke={stroke('head')} strokeWidth="1.5"/>
        </g>
        {/* Neck */}
        <g className={`amap-region${activeRegion==='neck'?' active':''}`} onClick={() => onRegion('neck')}>
          <rect x="68" y="62" width="24" height="20" rx="5" fill={fill('neck')} stroke={stroke('neck')} strokeWidth="1.5"/>
        </g>
        {/* Back/Torso */}
        <g className={`amap-region${activeRegion==='back'?' active':''}`} onClick={() => onRegion('back')}>
          <rect x="46" y="84" width="68" height="110" rx="10" fill={fill('back')} stroke={stroke('back')} strokeWidth="1.5"/>
        </g>
        {/* Pelvis */}
        <g className={`amap-region${activeRegion==='pelvis'?' active':''}`} onClick={() => onRegion('pelvis')}>
          <rect x="48" y="198" width="64" height="42" rx="8" fill={fill('pelvis')} stroke={stroke('pelvis')} strokeWidth="1.5"/>
        </g>
        {/* L Arm */}
        <g className={`amap-region${activeRegion==='larm'?' active':''}`} onClick={() => onRegion('larm')}>
          <rect x="14" y="86" width="28" height="100" rx="10" fill={fill('larm')} stroke={stroke('larm')} strokeWidth="1.5"/>
        </g>
        {/* R Arm */}
        <g className={`amap-region${activeRegion==='rarm'?' active':''}`} onClick={() => onRegion('rarm')}>
          <rect x="118" y="86" width="28" height="100" rx="10" fill={fill('rarm')} stroke={stroke('rarm')} strokeWidth="1.5"/>
        </g>
        {/* L Hand */}
        <g className={`amap-region${activeRegion==='lhand'?' active':''}`} onClick={() => onRegion('lhand')}>
          <ellipse cx="28" cy="198" rx="14" ry="16" fill={fill('lhand')} stroke={stroke('lhand')} strokeWidth="1.5"/>
        </g>
        {/* R Hand */}
        <g className={`amap-region${activeRegion==='rhand'?' active':''}`} onClick={() => onRegion('rhand')}>
          <ellipse cx="132" cy="198" rx="14" ry="16" fill={fill('rhand')} stroke={stroke('rhand')} strokeWidth="1.5"/>
        </g>
        {/* L Leg */}
        <g className={`amap-region${activeRegion==='lleg'?' active':''}`} onClick={() => onRegion('lleg')}>
          <rect x="49" y="244" width="28" height="100" rx="10" fill={fill('lleg')} stroke={stroke('lleg')} strokeWidth="1.5"/>
        </g>
        {/* R Leg */}
        <g className={`amap-region${activeRegion==='rleg'?' active':''}`} onClick={() => onRegion('rleg')}>
          <rect x="83" y="244" width="28" height="100" rx="10" fill={fill('rleg')} stroke={stroke('rleg')} strokeWidth="1.5"/>
        </g>
        {/* L Foot */}
        <g className={`amap-region${activeRegion==='lfoot'?' active':''}`} onClick={() => onRegion('lfoot')}>
          <ellipse cx="63" cy="356" rx="16" ry="11" fill={fill('lfoot')} stroke={stroke('lfoot')} strokeWidth="1.5"/>
        </g>
        {/* R Foot */}
        <g className={`amap-region${activeRegion==='rfoot'?' active':''}`} onClick={() => onRegion('rfoot')}>
          <ellipse cx="97" cy="356" rx="16" ry="11" fill={fill('rfoot')} stroke={stroke('rfoot')} strokeWidth="1.5"/>
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 400" width="130" height="320" style={{ overflow: 'visible' }}>
      {/* Head */}
      <g className={`amap-region${activeRegion==='head'?' active':''}`} onClick={() => onRegion('head')}>
        <ellipse cx="80" cy="32" rx="26" ry="30" fill={fill('head')} stroke={stroke('head')} strokeWidth="1.5"/>
        {/* Face features hint */}
        <circle cx="72" cy="27" r="3" fill={activeRegion==='head'?'rgba(0,229,192,.4)':'rgba(255,255,255,.07)'}/>
        <circle cx="88" cy="27" r="3" fill={activeRegion==='head'?'rgba(0,229,192,.4)':'rgba(255,255,255,.07)'}/>
        <path d="M73 40 Q80 45 87 40" stroke={activeRegion==='head'?'rgba(0,229,192,.5)':'rgba(255,255,255,.07)'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </g>
      {/* Neck */}
      <g className={`amap-region${activeRegion==='neck'?' active':''}`} onClick={() => onRegion('neck')}>
        <rect x="68" y="62" width="24" height="20" rx="5" fill={fill('neck')} stroke={stroke('neck')} strokeWidth="1.5"/>
      </g>
      {/* Chest */}
      <g className={`amap-region${activeRegion==='chest'?' active':''}`} onClick={() => onRegion('chest')}>
        <rect x="46" y="84" width="68" height="72" rx="10" fill={fill('chest')} stroke={stroke('chest')} strokeWidth="1.5"/>
        {/* ribs hint */}
        {[98,108,118,128].map(y => (
          <line key={y} x1="55" y1={y} x2="105" y2={y} stroke={activeRegion==='chest'?'rgba(0,229,192,.2)':'rgba(255,255,255,.04)'} strokeWidth="1"/>
        ))}
      </g>
      {/* Abdomen */}
      <g className={`amap-region${activeRegion==='abdomen'?' active':''}`} onClick={() => onRegion('abdomen')}>
        <rect x="48" y="158" width="64" height="50" rx="8" fill={fill('abdomen')} stroke={stroke('abdomen')} strokeWidth="1.5"/>
      </g>
      {/* Pelvis */}
      <g className={`amap-region${activeRegion==='pelvis'?' active':''}`} onClick={() => onRegion('pelvis')}>
        <rect x="50" y="210" width="60" height="36" rx="8" fill={fill('pelvis')} stroke={stroke('pelvis')} strokeWidth="1.5"/>
      </g>
      {/* L Arm */}
      <g className={`amap-region${activeRegion==='larm'?' active':''}`} onClick={() => onRegion('larm')}>
        <rect x="14" y="86" width="28" height="100" rx="10" fill={fill('larm')} stroke={stroke('larm')} strokeWidth="1.5"/>
      </g>
      {/* R Arm */}
      <g className={`amap-region${activeRegion==='rarm'?' active':''}`} onClick={() => onRegion('rarm')}>
        <rect x="118" y="86" width="28" height="100" rx="10" fill={fill('rarm')} stroke={stroke('rarm')} strokeWidth="1.5"/>
      </g>
      {/* L Hand */}
      <g className={`amap-region${activeRegion==='lhand'?' active':''}`} onClick={() => onRegion('lhand')}>
        <ellipse cx="28" cy="198" rx="14" ry="16" fill={fill('lhand')} stroke={stroke('lhand')} strokeWidth="1.5"/>
      </g>
      {/* R Hand */}
      <g className={`amap-region${activeRegion==='rhand'?' active':''}`} onClick={() => onRegion('rhand')}>
        <ellipse cx="132" cy="198" rx="14" ry="16" fill={fill('rhand')} stroke={stroke('rhand')} strokeWidth="1.5"/>
      </g>
      {/* L Leg */}
      <g className={`amap-region${activeRegion==='lleg'?' active':''}`} onClick={() => onRegion('lleg')}>
        <rect x="49" y="250" width="28" height="100" rx="10" fill={fill('lleg')} stroke={stroke('lleg')} strokeWidth="1.5"/>
      </g>
      {/* R Leg */}
      <g className={`amap-region${activeRegion==='rleg'?' active':''}`} onClick={() => onRegion('rleg')}>
        <rect x="83" y="250" width="28" height="100" rx="10" fill={fill('rleg')} stroke={stroke('rleg')} strokeWidth="1.5"/>
      </g>
      {/* L Foot */}
      <g className={`amap-region${activeRegion==='lfoot'?' active':''}`} onClick={() => onRegion('lfoot')}>
        <ellipse cx="63" cy="362" rx="16" ry="11" fill={fill('lfoot')} stroke={stroke('lfoot')} strokeWidth="1.5"/>
      </g>
      {/* R Foot */}
      <g className={`amap-region${activeRegion==='rfoot'?' active':''}`} onClick={() => onRegion('rfoot')}>
        <ellipse cx="97" cy="362" rx="16" ry="11" fill={fill('rfoot')} stroke={stroke('rfoot')} strokeWidth="1.5"/>
      </g>
      {/* Trauma overlay button area */}
      <g className={`amap-region${activeRegion==='trauma'?' active':''}`} onClick={() => onRegion('trauma')}>
        <rect x="46" y="84" width="68" height="196" rx="10" fill="transparent" stroke="transparent" strokeWidth="0"/>
      </g>
    </svg>
  );
}

export default function AnatomicMap({ onSelectProc }) {
  const [activeRegion, setActiveRegion] = useState(null);
  const [side, setSide] = useState('front');

  const region = activeRegion ? REGION_PROCS[activeRegion] : null;
  const highlightedProcs = region?.procs || [];

  const handleRegion = (r) => {
    setActiveRegion(prev => prev === r ? null : r);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="amap-wrap">
        {/* Body diagram */}
        <div className="amap-left">
          <div style={{ fontSize: 11, color: T.txt3, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Click a region</div>
          <div className="amap-view-toggle">
            <button className={`amap-vbtn${side==='front'?' active':''}`} onClick={() => setSide('front')}>Front</button>
            <button className={`amap-vbtn${side==='back'?' active':''}`} onClick={() => setSide('back')}>Back</button>
          </div>
          <BodySVG activeRegion={activeRegion} onRegion={handleRegion} side={side} />

          {/* Quick region buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {[['trauma','⚡','Multi-Trauma'],['back','🦴','Back/Spine']].map(([id, icon, label]) => (
              <button key={id} className={`amap-region-btn${activeRegion===id?' active':''}`} onClick={() => handleRegion(id)}>
                <span>{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Procedure list */}
        <div className="amap-right">
          {!activeRegion ? (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.txt2, marginBottom: 6 }}>Anatomic Procedure Map</div>
              <div style={{ fontSize: 12, color: T.txt3, lineHeight: 1.6 }}>
                Click any body region on the diagram to see relevant procedure templates for that area.
                Highlighted procedures will be pre-selected when you click them.
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(REGION_PROCS).map(([id, r]) => (
                  <button key={id} className="amap-region-btn" onClick={() => handleRegion(id)}>
                    <span>{r.icon}</span><span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{region.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>{region.label}</div>
                  <div style={{ fontSize: 11, color: T.txt3 }}>{highlightedProcs.length} procedures · click to open</div>
                </div>
                <button onClick={() => setActiveRegion(null)} style={{ marginLeft: 'auto', background: T.up, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 10px', color: T.txt3, cursor: 'pointer', fontSize: 11 }}>✕ Clear</button>
              </div>
              <div className="amap-proc-grid">
                {highlightedProcs.filter(k => PNAMES[k]).map(k => (
                  <div key={k} className="amap-proc-card highlighted" onClick={() => onSelectProc(k)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{PNAMES[k]}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                      padding: '2px 6px', borderRadius: 10,
                      background: RISK[k] === 'high' ? 'rgba(255,107,107,.15)' : RISK[k] === 'mod' ? 'rgba(255,159,67,.15)' : 'rgba(0,229,192,.1)',
                      color: RISK_COLOR[RISK[k] || 'low'],
                      border: `1px solid ${RISK[k] === 'high' ? 'rgba(255,107,107,.3)' : RISK[k] === 'mod' ? 'rgba(255,159,67,.3)' : 'rgba(0,229,192,.2)'}`,
                    }}>{(RISK[k] || 'low').toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}