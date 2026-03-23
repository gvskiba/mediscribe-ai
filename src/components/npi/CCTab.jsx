import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

/* ─── DATA ──────────────────────────────────────── */
const SYSTEMS = [
  { id:'neuro', label:'Neuro', icon:'🧠', complaints:[
    { id:'headache', label:'Headache', sub:['Migraine','Tension','Cluster','Thunderclap','New onset','Worst of life'] },
    { id:'dizziness', label:'Dizziness', sub:['Vertigo','Lightheadedness','Presyncope','Syncope'] },
    { id:'seizure', label:'Seizure', sub:['First-time','Breakthrough','Status epilepticus','Witnessed'] },
    { id:'weakness', label:'Weakness', sub:['Unilateral','Bilateral','Focal','Generalized'] },
    { id:'numbness', label:'Numbness/Tingling', sub:['Facial','Upper extremity','Lower extremity','Perioral'] },
    { id:'ams', label:'Altered Mental Status', sub:['Acute confusion','Lethargy','Obtunded','Dementia exacerbation'] },
  ]},
  { id:'cardiac', label:'Cardiac', icon:'❤️', complaints:[
    { id:'chest_pain', label:'Chest Pain', sub:['Substernal','Pleuritic','Sharp','Pressure','Exertional','At rest'] },
    { id:'palpitations', label:'Palpitations', sub:['Intermittent','Sustained','With syncope','With dyspnea'] },
    { id:'dyspnea_c', label:'Dyspnea', sub:['Exertional','At rest','Orthopnea','PND','Acute onset'] },
    { id:'edema', label:'Edema', sub:['Lower extremity','Bilateral','Unilateral','Facial'] },
    { id:'htn_emergency', label:'Hypertensive Emergency', sub:['Asymptomatic','With headache','With vision changes'] },
  ]},
  { id:'pulm', label:'Pulmonary', icon:'🫁', complaints:[
    { id:'cough', label:'Cough', sub:['Productive','Dry','Hemoptysis','Chronic','Acute'] },
    { id:'sob', label:'Shortness of Breath', sub:['Acute','Chronic exacerbation','Wheezing','Stridor'] },
    { id:'asthma_copd', label:'Asthma/COPD Exacerbation', sub:['Mild','Moderate','Severe','Not responding to home tx'] },
    { id:'pna_sx', label:'Pneumonia Symptoms', sub:['Fever + cough','Productive sputum','Pleuritic pain'] },
  ]},
  { id:'gi', label:'GI', icon:'🔥', complaints:[
    { id:'abd_pain', label:'Abdominal Pain', sub:['RUQ','LUQ','RLQ','LLQ','Epigastric','Periumbilical','Diffuse','Suprapubic'] },
    { id:'nv', label:'Nausea/Vomiting', sub:['With diarrhea','Hematemesis','Bilious','Post-prandial','Intractable'] },
    { id:'diarrhea', label:'Diarrhea', sub:['Bloody','Watery','Chronic','Acute','With fever'] },
    { id:'gi_bleed', label:'GI Bleeding', sub:['Hematemesis','Melena','Hematochezia','Coffee-ground emesis'] },
    { id:'constipation', label:'Constipation', sub:['Acute','Chronic','Obstipation','With distension'] },
  ]},
  { id:'msk', label:'MSK', icon:'🦴', complaints:[
    { id:'back_pain', label:'Back Pain', sub:['Lumbar','Thoracic','Cervical','With radiculopathy','Trauma-related'] },
    { id:'joint_pain', label:'Joint Pain', sub:['Monoarticular','Polyarticular','With swelling','Post-trauma'] },
    { id:'fracture', label:'Fracture/Injury', sub:['Fall','MVA','Sports injury','Crush injury','Open fracture'] },
    { id:'extremity', label:'Extremity Pain', sub:['Upper','Lower','With swelling','With deformity'] },
  ]},
  { id:'psych', label:'Psych', icon:'🧩', complaints:[
    { id:'si', label:'Suicidal Ideation', sub:['Active with plan','Active without plan','Passive','Attempt'] },
    { id:'anxiety', label:'Anxiety/Panic', sub:['Panic attack','Acute anxiety','Generalized','With somatic sx'] },
    { id:'psychosis', label:'Psychosis', sub:['Acute','Chronic exacerbation','Hallucinations','Paranoia'] },
    { id:'agitation', label:'Agitation', sub:['Combative','Verbal','EtOH related','Substance related'] },
  ]},
  { id:'derm', label:'Skin', icon:'🩹', complaints:[
    { id:'rash', label:'Rash', sub:['Urticarial','Maculopapular','Vesicular','Petechial','With fever'] },
    { id:'laceration', label:'Laceration', sub:['Simple','Complex','With tendon injury','Facial','Hand'] },
    { id:'abscess', label:'Abscess', sub:['Cutaneous','Perianal','Pilonidal',"Bartholin's"] },
    { id:'cellulitis', label:'Cellulitis', sub:['Extremity','Facial','Periorbital','With abscess'] },
    { id:'burn', label:'Burn', sub:['Superficial','Partial thickness','Full thickness','Chemical','Electrical'] },
  ]},
  { id:'gu', label:'GU/Renal', icon:'🫘', complaints:[
    { id:'uti', label:'UTI Symptoms', sub:['Dysuria','Frequency','Urgency','Hematuria','Flank pain'] },
    { id:'kidney_stone', label:'Kidney Stone', sub:['First episode','Recurrent','With infection','Obstructing'] },
    { id:'retention', label:'Urinary Retention', sub:['Acute','Chronic','Post-operative','With infection'] },
    { id:'hematuria', label:'Hematuria', sub:['Gross','Microscopic','With clots','Painless'] },
  ]},
];

const ALL_CC = SYSTEMS.flatMap(s => s.complaints.map(c => ({ ...c, sysId: s.id, sysLabel: s.label, sysIcon: s.icon })));

const OLDCARTS = [
  { key:'onset', label:'Onset', icon:'⏱', ph:'When did it start?', opts:['Minutes ago','Hours ago','Today','Yesterday','Days ago','Weeks ago','Gradual','Sudden'] },
  { key:'location', label:'Location', icon:'📍', ph:'Where is the symptom?', opts:['Head','Neck','Chest','Abdomen','Back','Left arm','Right arm','Left leg','Right leg','Diffuse','Bilateral'] },
  { key:'duration', label:'Duration', icon:'⏳', ph:'How long?', opts:['Seconds','Minutes','Hours','Constant','Intermittent','Waxing/waning','Getting worse','Getting better'] },
  { key:'character', label:'Character', icon:'💢', ph:'Quality?', opts:['Sharp','Dull','Burning','Pressure','Stabbing','Throbbing','Aching','Cramping','Tearing','Squeezing','Colicky'] },
  { key:'aggravating', label:'Aggravating', icon:'📈', ph:'Worse with?', opts:['Movement','Exertion','Eating','Breathing','Lying flat','Palpation','Coughing','Walking','Stress','Nothing'] },
  { key:'relieving', label:'Relieving', icon:'📉', ph:'Better with?', opts:['Rest','Medications','Position change','Ice','Heat','Elevation','Nothing tried','Nothing helps'] },
  { key:'timing', label:'Timing', icon:'🔄', ph:'Pattern?', opts:['Constant','Intermittent','Morning','Night','Post-prandial','With activity','At rest','Worsening','Improving','Episodic'] },
  { key:'severity', label:'Severity', icon:'🔥', ph:'0–10?', opts:['0','1','2','3','4','5','6','7','8','9','10'] },
];

const ASSOC_MAP = {
  neuro: ['Headache','Vision changes','Nausea/vomiting','Photophobia','Neck stiffness','Focal weakness','Speech difficulty','Gait abnormality','LOC','Confusion'],
  cardiac: ['Chest pain','Dyspnea','Diaphoresis','Nausea','Jaw pain','Arm pain','Palpitations','Syncope','Edema','Orthopnea'],
  pulm: ['Cough','Dyspnea','Wheezing','Hemoptysis','Chest pain','Fever','Sputum production','Night sweats','Weight loss'],
  gi: ['Nausea','Vomiting','Diarrhea','Constipation','Fever','Anorexia','Weight loss','Jaundice','Hematemesis','Melena','Hematochezia'],
  msk: ['Swelling','Bruising','Deformity','Numbness','Weakness','Limited ROM','Instability','Crepitus','Fever'],
  psych: ['Insomnia','Appetite changes','Hopelessness','Anhedonia','Racing thoughts','Hallucinations','Paranoia','Agitation','Self-harm'],
  derm: ['Fever','Pain','Itching','Swelling','Drainage','Spreading','Warmth','Tenderness'],
  gu: ['Dysuria','Frequency','Urgency','Hematuria','Fever','Flank pain','Nausea','Retention','Discharge'],
};

/* ─── STYLES ─────────────────────────────────────── */
const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b', orange:'#ff9f43',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes cc-fadeslide { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
.cc-animate { animation: cc-fadeslide .2s ease; }
.cc-dropdown-open { display:block !important; }
`;

/* ─── COMPONENT ──────────────────────────────────── */
export default function CCTab({ cc, setCC, selectedCC, setSelectedCC }) {
  const [selSys, setSelSys] = useState(null);
  const [selCC, setSelCC] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [oc, setOc] = useState({});
  const [openOcField, setOpenOcField] = useState(null);
  const [posAssoc, setPosAssoc] = useState([]);
  const [negAssoc, setNegAssoc] = useState([]);
  const [hpiMode, setHpiMode] = useState('smart');
  const [hpiText, setHpiText] = useState('');
  const [nurseNotes, setNurseNotes] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [pasteNotes, setPasteNotes] = useState('');
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  // Sync to parent cc state
  useEffect(() => {
    if (selCC) {
      setCC(p => ({ ...p, text: selCC.label + (selSub ? ' — ' + selSub : '') }));
      if (hpiText) setCC(p => ({ ...p, hpi: hpiText }));
    }
  }, [selCC, selSub, hpiText]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (!dropRef.current?.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Search results ── */
  const searchResults = searchQ.length >= 1
    ? ALL_CC.filter(c => c.label.toLowerCase().includes(searchQ.toLowerCase()) || c.sub.some(s => s.toLowerCase().includes(searchQ.toLowerCase()))).slice(0, 8)
    : [];

  function doSelectCC(sysId, ccId, sub = null) {
    const sys = SYSTEMS.find(s => s.id === sysId);
    const comp = ALL_CC.find(c => c.id === ccId && c.sysId === sysId);
    setSelSys(sysId);
    setSelCC(comp);
    setSelSub(sub);
    setOc({});
    setPosAssoc([]);
    setNegAssoc([]);
    setHpiText('');
    setSearchQ('');
    setDropdownOpen(false);
    if (selectedCC !== undefined && setSelectedCC) setSelectedCC(comp?.id);
  }

  /* ── Progress ── */
  const ocFilled = Object.values(oc).filter(Boolean).length;
  const assocFilled = (posAssoc.length > 0 ? 1 : 0) + (negAssoc.length > 0 ? 1 : 0);
  const progress = selCC ? Math.round(((ocFilled + assocFilled) / (OLDCARTS.length + 2)) * 100) : 0;

  /* ── OLDCARTS ── */
  function toggleOcChip(k, v, isSev) {
    setOc(prev => {
      if (isSev) return { ...prev, [k]: v };
      const cur = prev[k] || '';
      const parts = cur ? cur.split(', ').filter(Boolean) : [];
      const idx = parts.indexOf(v);
      if (idx >= 0) parts.splice(idx, 1); else parts.push(v);
      return { ...prev, [k]: parts.join(', ') };
    });
  }

  /* ── Associated ── */
  function togglePos(sx) {
    if (posAssoc.includes(sx)) setPosAssoc(p => p.filter(s => s !== sx));
    else { setPosAssoc(p => [...p.filter(s => s !== sx), sx]); setNegAssoc(p => p.filter(s => s !== sx)); }
  }
  function toggleNeg(sx) {
    if (negAssoc.includes(sx)) setNegAssoc(p => p.filter(s => s !== sx));
    else { setNegAssoc(p => [...p.filter(s => s !== sx), sx]); setPosAssoc(p => p.filter(s => s !== sx)); }
  }

  /* ── HPI Generation ── */
  function buildHPIText() {
    if (!selCC) return '';
    const p = [];
    p.push(`This is a patient who presents with ${selCC.label}${selSub ? ' (' + selSub + ')' : ''}.`);
    if (oc.onset) p.push(`Symptom onset was ${oc.onset}.`);
    if (oc.location) p.push(`The symptom is located in the ${oc.location}.`);
    if (oc.duration) p.push(`Duration: ${oc.duration}.`);
    if (oc.character) p.push(`The patient describes the quality as ${oc.character}.`);
    if (oc.severity) p.push(`Severity is rated ${oc.severity}/10.`);
    if (oc.aggravating) p.push(`Aggravating factors include ${oc.aggravating}.`);
    if (oc.relieving) p.push(`Relieving factors include ${oc.relieving}.`);
    if (oc.timing) p.push(`Timing: ${oc.timing}.`);
    if (posAssoc.length) p.push(`Associated symptoms include ${posAssoc.join(', ')}.`);
    if (negAssoc.length) p.push(`The patient denies ${negAssoc.join(', ')}.`);
    if (nurseNotes.trim()) p.push(`\nAdditional context from nursing: ${nurseNotes.trim()}`);
    return p.join(' ');
  }

  function generateHPI() {
    setGenerating(true);
    setTimeout(() => {
      const t = buildHPIText();
      setHpiText(t);
      setCC(p => ({ ...p, hpi: t }));
      setGenerating(false);
      setHpiMode('preview');
      toast.success('HPI generated');
    }, 600);
  }

  async function parsePasted() {
    if (!pasteNotes.trim()) return;
    setParsing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Convert this nurse triage note into a clinical HPI paragraph in professional medical documentation style. Chief complaint: ${selCC?.label || 'unspecified'}.\n\nNurse note:\n${pasteNotes}`,
      });
      const t = typeof res === 'string' ? res : JSON.stringify(res);
      setHpiText(t);
      setCC(p => ({ ...p, hpi: t }));
      setHpiMode('preview');
      toast.success('Parsed successfully');
    } catch {
      toast.error('Failed to parse');
    }
    setParsing(false);
  }

  function clearAll() {
    setSelSys(null); setSelCC(null); setSelSub(null);
    setOc({}); setPosAssoc([]); setNegAssoc([]);
    setHpiText(''); setNurseNotes(''); setPasteNotes('');
    setSearchQ(''); setHpiMode('smart');
    setCC(p => ({ ...p, text: '', hpi: '' }));
    if (setSelectedCC) setSelectedCC(-1);
  }

  /* ─── RENDER ─────────────────────────────────── */
  const sys = SYSTEMS.find(s => s.id === selSys);
  const assocList = ASSOC_MAP[selCC?.sysId] || [];

  const box = { background: S.panel, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px 18px' };
  const secHeader = { display:'flex', alignItems:'center', gap:10, marginBottom:14 };
  const lbl = { fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500, marginBottom:4, display:'block' };
  const inp = { width:'100%', background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'7px 10px', color:S.txt, fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>💬</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Chief Complaint &amp; HPI</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Search or select body system · Build history of present illness</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600,
            background: progress >= 80 ? 'rgba(0,229,192,0.12)' : 'rgba(255,159,67,0.12)',
            color: progress >= 80 ? S.teal : S.orange,
            border: `1px solid ${progress >= 80 ? 'rgba(0,229,192,0.3)' : 'rgba(255,159,67,0.3)'}`,
          }}>{progress >= 80 ? 'COMPLETE' : 'IN PROGRESS'}</span>
          <button onClick={clearAll} style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>↻ Clear All</button>
        </div>
      </div>

      {/* Active CC Banner */}
      {selCC && (
        <div className="cc-animate" style={{ background:'rgba(255,159,67,0.06)', border:'1px solid rgba(255,159,67,0.25)', borderRadius:12, padding:'10px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:26 }}>{selCC.sysIcon}</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:S.txt }}>{selCC.label}</div>
            {selSub && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.orange, marginTop:1 }}>{selSub}</div>}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em' }}>HPI Progress</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:S.orange }}>{progress}%</div>
            </div>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`conic-gradient(${S.orange} ${progress*3.6}deg, ${S.border} ${progress*3.6}deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:S.panel, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:S.orange, fontWeight:600 }}>{progress}%</div>
            </div>
            <button onClick={clearAll} style={{ background:'none', border:`1px solid ${S.border}`, borderRadius:6, padding:'3px 10px', fontSize:10, color:S.txt3, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>✕ Clear</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={box}>
        <div style={secHeader}>
          <span style={{ fontSize:16 }}>🔍</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Search Chief Complaint</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Type 2+ characters · select a sub-type from results</div>
          </div>
        </div>
        <div style={{ position:'relative' }} ref={dropRef}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:S.txt3, fontSize:14, pointerEvents:'none' }}>⌕</span>
          <input
            ref={searchRef}
            style={{ ...inp, paddingLeft:38 }}
            placeholder="Type 'chest', 'head', 'abd', 'back', 'rash'…"
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setDropdownOpen(e.target.value.length >= 1); }}
            onFocus={() => { if (searchQ.length >= 1) setDropdownOpen(true); }}
            autoComplete="off"
          />
          {dropdownOpen && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:S.card, border:`1px solid ${S.borderHi}`, borderRadius:8, maxHeight:300, overflowY:'auto', zIndex:50, boxShadow:'0 12px 40px rgba(0,0,0,0.5)' }}>
              {searchResults.map(c => (
                <div key={c.sysId+c.id} onClick={() => doSelectCC(c.sysId, c.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', cursor:'pointer', borderBottom:`1px solid ${S.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = S.up}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize:20, width:28, textAlign:'center' }}>{c.sysIcon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:S.txt }}>{c.label}</div>
                    <div style={{ fontSize:10, color:S.txt3 }}>{c.sysLabel}</div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:240, justifyContent:'flex-end' }}>
                    {c.sub.slice(0, 4).map(s => (
                      <span key={s} onClick={e => { e.stopPropagation(); doSelectCC(c.sysId, c.id, s); }}
                        style={{ fontSize:10, padding:'1px 7px', borderRadius:10, cursor:'pointer', border:'1px solid rgba(255,159,67,0.3)', color:S.orange, background:'rgba(255,159,67,0.06)', fontFamily:"'JetBrains Mono',monospace" }}
                        onMouseEnter={e => { e.target.style.background='rgba(255,159,67,0.18)'; e.target.style.borderColor=S.orange; }}
                        onMouseLeave={e => { e.target.style.background='rgba(255,159,67,0.06)'; e.target.style.borderColor='rgba(255,159,67,0.3)'; }}
                      >{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body System Grid */}
      <div style={box}>
        <div style={secHeader}>
          <span style={{ fontSize:16 }}>🫀</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Quick Select — Body System</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Select a system, then choose a complaint and narrow with sub-type</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:6 }}>
          {SYSTEMS.map(s => (
            <div key={s.id} onClick={() => { setSelSys(selSys === s.id ? null : s.id); setSelCC(null); setSelSub(null); }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', borderRadius:8, cursor:'pointer',
                border: `1px solid ${selSys === s.id ? S.orange : S.border}`,
                background: selSys === s.id ? 'rgba(255,159,67,0.08)' : S.card,
                transition:'all 0.2s',
              }}
            >
              <span style={{ fontSize:24 }}>{s.icon}</span>
              <span style={{ fontSize:10, fontWeight:600, color: selSys === s.id ? S.orange : S.txt3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* System Expand */}
        {selSys && sys && (
          <div className="cc-animate" style={{ marginTop:14, borderTop:`1px solid ${S.border}`, paddingTop:14 }}>
            <div style={{ fontSize:10, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:8 }}>
              {sys.icon} {sys.label} — Select Complaint
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:6 }}>
              {sys.complaints.map(c => (
                <button key={c.id} onClick={() => doSelectCC(sys.id, c.id)}
                  style={{ background: selCC?.id === c.id ? 'rgba(255,159,67,0.08)' : S.up, border:`1px solid ${selCC?.id === c.id ? S.orange : S.border}`, borderRadius:6, padding:'7px 12px', cursor:'pointer', textAlign:'left', fontSize:12, color: selCC?.id === c.id ? S.orange : S.txt2, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}
                >{c.label}</button>
              ))}
            </div>

            {/* Sub-types */}
            {selCC && sys.complaints.find(c => c.id === selCC.id) && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10, paddingTop:10, borderTop:`1px solid ${S.border}` }}>
                {selCC.sub.map(s => (
                  <button key={s} onClick={() => setSelSub(selSub === s ? null : s)}
                    style={{ fontSize:11, padding:'3px 12px', borderRadius:20, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", background: selSub === s ? S.orange : S.card, color: selSub === s ? S.bg : S.txt2, border:`1px solid ${selSub === s ? S.orange : S.border}`, transition:'all 0.15s' }}
                  >{s}</button>
                ))}
                <button onClick={() => setSelSub(null)} style={{ fontSize:11, padding:'3px 12px', borderRadius:20, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", background:'transparent', color:S.txt4, border:`1px solid ${S.txt4}` }}>Skip →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HPI Builder */}
      {selCC && (
        <div className="cc-animate">
          {/* Mode Tabs */}
          <div style={{ display:'flex', gap:2, background:S.card, borderRadius:8, padding:2, width:'fit-content', border:`1px solid ${S.border}`, marginBottom:14 }}>
            {[['smart','⚡ Smart Build'],['paste','📋 Paste & Parse'],['preview','📄 Preview HPI']].map(([m, lbl2]) => (
              <button key={m} onClick={() => setHpiMode(m)}
                style={{ padding:'5px 14px', borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500, transition:'all 0.15s', border: hpiMode === m ? `1px solid ${S.border}` : '1px solid transparent', background: hpiMode === m ? S.up : 'transparent', color: hpiMode === m ? S.txt : S.txt3 }}
              >{lbl2}</button>
            ))}
          </div>

          {/* Smart Build */}
          {hpiMode === 'smart' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {/* OLDCARTS */}
              <div style={box}>
                <div style={secHeader}>
                  <span style={{ fontSize:16 }}>📐</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'1px 7px', borderRadius:20, background:'rgba(255,159,67,0.12)', color:S.orange, border:'1px solid rgba(255,159,67,0.3)', marginRight:6 }}>OLDCARTS</span>
                      History Builder
                    </div>
                    <div style={{ fontSize:11, color:S.txt3 }}>Tap chips or type free-text</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {OLDCARTS.map(f => {
                    const val = oc[f.key] || '';
                    const isOpen = openOcField === f.key;
                    const isSev = f.key === 'severity';
                    return (
                      <div key={f.key} style={{ background:S.card, border:`1px solid ${val ? 'rgba(255,159,67,0.3)' : S.border}`, borderRadius:8, overflow:'hidden' }}>
                        <div onClick={() => setOpenOcField(isOpen ? null : f.key)}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', cursor:'pointer' }}
                        >
                          <span style={{ fontSize:14, width:20, textAlign:'center' }}>{f.icon}</span>
                          <span style={{ fontSize:12, fontWeight:500, color:S.txt }}>{f.label}</span>
                          {val && <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.orange, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</span>}
                          <span style={{ color:S.txt4, fontSize:10, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', marginLeft: val ? 6 : 'auto', flexShrink:0 }}>▾</span>
                        </div>
                        {isOpen && (
                          <div style={{ padding:'0 12px 10px' }}>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                              {f.opts.map(o => {
                                const sel = isSev ? val === o : val.split(', ').includes(o);
                                const n = parseInt(o);
                                let chipColor = S.orange;
                                if (isSev) { if (n <= 3) chipColor = S.teal; else if (n <= 6) chipColor = S.gold; else chipColor = S.coral; }
                                return (
                                  <span key={o} onClick={() => toggleOcChip(f.key, o, isSev)}
                                    style={{ fontSize:11, padding:'2px 9px', borderRadius:14, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", background: sel ? `rgba(${isSev ? (n<=3?'0,229,192':(n<=6?'245,200,66':'255,107,107')):'255,159,67'},0.15)` : S.up, border:`1px solid ${sel ? chipColor : S.border}`, color: sel ? chipColor : S.txt2, transition:'all 0.12s' }}
                                  >{o}</span>
                                );
                              })}
                            </div>
                            <input style={{ ...inp, borderRadius:6, padding:'6px 10px', fontSize:12 }} value={val} onChange={e => setOc(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Associated Symptoms */}
                <div style={box}>
                  <div style={secHeader}>
                    <span style={{ fontSize:16 }}>🔗</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Associated Symptoms</div>
                      <div style={{ fontSize:11, color:S.txt3 }}>Click = present · Right-click = denies</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {assocList.map(sx => {
                      const isP = posAssoc.includes(sx), isN = negAssoc.includes(sx);
                      return (
                        <span key={sx}
                          onClick={() => togglePos(sx)}
                          onContextMenu={e => { e.preventDefault(); toggleNeg(sx); }}
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:14, fontSize:11, cursor:'pointer', userSelect:'none', transition:'all 0.12s',
                            border: isP ? `1px solid ${S.teal}` : isN ? `1px solid ${S.coral}` : `1px solid ${S.border}`,
                            background: isP ? 'rgba(0,229,192,0.08)' : isN ? 'rgba(255,107,107,0.08)' : S.up,
                            color: isP ? S.teal : isN ? S.coral : S.txt2,
                          }}
                        >{isP ? '✓ ' : isN ? '✗ ' : ''}{sx}</span>
                      );
                    })}
                  </div>
                  {(posAssoc.length > 0 || negAssoc.length > 0) && (
                    <div style={{ marginTop:10, background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 14px' }}>
                      {posAssoc.length > 0 && <div style={{ fontSize:11, color:S.teal, marginBottom:3 }}><strong>+</strong> {posAssoc.join(', ')}</div>}
                      {negAssoc.length > 0 && <div style={{ fontSize:11, color:S.coral }}><strong>−</strong> Denies: {negAssoc.join(', ')}</div>}
                    </div>
                  )}
                </div>

                {/* Nurse Notes */}
                <div style={box}>
                  <div style={secHeader}>
                    <span style={{ fontSize:16 }}>📝</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Additional Context</div>
                      <div style={{ fontSize:11, color:S.txt3 }}>Paste nurse triage summary or relevant history</div>
                    </div>
                  </div>
                  <textarea style={{ ...inp, minHeight:80, resize:'vertical' }} rows={3} value={nurseNotes} onChange={e => setNurseNotes(e.target.value)} placeholder="Paste nurse's triage summary, additional history, or relevant context here…" />
                </div>

                {/* Generate Button */}
                <button onClick={generateHPI} disabled={generating}
                  style={{ width:'100%', padding:10, border:'none', borderRadius:8, background: generating ? S.up : 'linear-gradient(135deg,#ff9f43,#e88a30)', color: generating ? S.txt2 : S.bg, fontSize:13, fontWeight:700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                >{generating ? '⚙ Composing HPI…' : '⚡ Generate HPI'}</button>
              </div>
            </div>
          )}

          {/* Paste & Parse */}
          {hpiMode === 'paste' && (
            <div style={box}>
              <div style={secHeader}>
                <span style={{ fontSize:16 }}>📋</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Paste Nurse's Summary</div>
                  <div style={{ fontSize:11, color:S.txt3 }}>AI will restructure notes into clinical HPI format</div>
                </div>
              </div>
              <textarea style={{ ...inp, minHeight:180, resize:'vertical' }} rows={8} value={pasteNotes} onChange={e => setPasteNotes(e.target.value)} placeholder={`Example: Pt is a 52 yo M presenting with 3 days of worsening chest pain. States it started gradually and is now 7/10 severity. Located substernally. Worse with exertion. Associated with diaphoresis and SOB. Denies N/V, fever, cough.`} />
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button onClick={parsePasted} disabled={parsing}
                  style={{ flex:1, padding:'8px 16px', border:'none', borderRadius:6, background: parsing ? S.up : S.blue, color: parsing ? S.txt2 : 'white', fontSize:12, fontWeight:600, cursor: parsing ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif" }}
                >{parsing ? '⏳ Processing…' : '🤖 Parse & Structure with AI'}</button>
                <button onClick={() => setHpiMode('smart')} style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'8px 14px', fontSize:12, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>← Smart Build</button>
              </div>
            </div>
          )}

          {/* Preview */}
          {hpiMode === 'preview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={box}>
                <div style={{ ...secHeader, marginBottom:14 }}>
                  <span style={{ fontSize:16 }}>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'1px 7px', borderRadius:20, background:'rgba(0,229,192,0.12)', color:S.teal, border:'1px solid rgba(0,229,192,0.3)' }}>GENERATED</span>
                      <span style={{ fontSize:14, fontWeight:600, color:S.txt }}>History of Present Illness</span>
                    </div>
                    <div style={{ fontSize:11, color:S.txt3 }}>Editable — modify the text directly below</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => navigator.clipboard?.writeText(hpiText).then(() => toast.success('Copied!'))} style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>📋 Copy</button>
                    <button onClick={() => setHpiMode('smart')} style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>✏️ Edit Fields</button>
                  </div>
                </div>
                <textarea
                  style={{ width:'100%', background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'14px 16px', fontFamily:"'Playfair Display',serif", fontSize:13, lineHeight:1.8, color:S.txt, outline:'none', resize:'vertical', minHeight:160, boxSizing:'border-box' }}
                  value={hpiText}
                  onChange={e => { setHpiText(e.target.value); setCC(p => ({ ...p, hpi: e.target.value })); }}
                />
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button onClick={() => { setCC(p => ({ ...p, hpi: hpiText })); toast.success('HPI saved to chart'); }}
                    style={{ flex:1, padding:'10px', border:'none', borderRadius:8, background:S.teal, color:S.bg, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
                  >✓ Accept & Save to Chart</button>
                  <button onClick={generateHPI} style={{ background:S.up, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 16px', fontSize:12, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>🔄 Regenerate</button>
                </div>
              </div>

              {/* OLDCARTS Summary */}
              <div style={box}>
                <div style={{ ...secHeader, marginBottom:10 }}>
                  <span style={{ fontSize:16 }}>📊</span>
                  <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>OLDCARTS Summary</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:6 }}>
                  {OLDCARTS.map(f => (
                    <div key={f.key} style={{ background:S.card, border:`1px solid ${oc[f.key] ? 'rgba(255,159,67,0.2)' : S.border}`, borderRadius:6, padding:'6px 8px' }}>
                      <div style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{f.icon} {f.label}</div>
                      <div style={{ fontSize:11, color: oc[f.key] ? S.txt : S.txt4, marginTop:2, fontFamily:"'JetBrains Mono',monospace" }}>{oc[f.key] || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}