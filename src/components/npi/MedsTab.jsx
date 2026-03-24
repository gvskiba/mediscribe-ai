import React, { useState } from "react";
import { PMH_SYSTEMS } from "./npiData";

const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b', orange:'#ff9f43',
  purple:'#9b6dff', txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
.med-tag { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; background:rgba(59,158,255,0.12); border:1px solid rgba(59,158,255,0.3); color:${S.blue}; font-size:12px; font-family:'DM Sans',sans-serif; }
.allergy-tag { background:rgba(255,107,107,0.12); border-color:rgba(255,107,107,0.3); color:${S.coral}; }
.tag-x { cursor:pointer; opacity:0.6; font-size:14px; line-height:1; transition:opacity .15s; }
.tag-x:hover { opacity:1; }
.tag-input { background:transparent; border:none; outline:none; color:${S.txt}; font-size:12px; font-family:'DM Sans',sans-serif; min-width:140px; flex:1; }
.tag-input::placeholder { color:${S.txt4}; }
.tag-area { display:flex; flex-wrap:wrap; gap:5px; align-items:center; background:${S.up}; border:1px solid ${S.border}; border-radius:8px; padding:8px 12px; cursor:text; min-height:44px; transition:border-color .15s; }
.tag-area:focus-within { border-color:${S.blue}; }
.tag-area-allergy:focus-within { border-color:${S.coral}; }
.pmh-chip { display:inline-flex; align-items:center; gap:3px; padding:4px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt2}; transition:all .15s; user-select:none; font-family:'DM Sans',sans-serif; }
.pmh-chip:hover { border-color:${S.borderHi}; color:${S.txt}; }
.pmh-chip.present { background:rgba(59,158,255,0.12); border-color:rgba(59,158,255,0.35); color:${S.blue}; }
.pmh-chip.active-pmh { background:rgba(245,200,66,0.12); border-color:rgba(245,200,66,0.4); color:${S.gold}; }
.pmh-sys { background:${S.card}; border:1px solid ${S.border}; border-radius:10px; overflow:hidden; transition:border-color .2s; }
.pmh-sys.has-sel { border-color:rgba(59,158,255,0.25); }
.pmh-sys-hdr { display:flex; align-items:center; gap:8px; padding:10px 14px; cursor:pointer; user-select:none; transition:background .12s; }
.pmh-sys-hdr:hover { background:${S.up}; }
.pmh-sys-body { display:none; padding:8px 12px 12px; flex-wrap:wrap; gap:5px; border-top:1px solid ${S.border}; }
.pmh-sys-body.open { display:flex; }
.pmh-chevron { color:${S.txt4}; font-size:10px; transition:transform .2s; margin-left:auto; }
.pmh-chevron.open { transform:rotate(90deg); }
.hist-textarea { width:100%; background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:8px 10px; color:${S.txt}; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; resize:vertical; min-height:70px; line-height:1.5; transition:border-color .15s; }
.hist-textarea:focus { border-color:${S.blue}; }
.hist-textarea::placeholder { color:${S.txt4}; }
.quick-med { font-size:11px; padding:2px 8px; border-radius:10px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .12s; font-family:'JetBrains Mono',monospace; }
.quick-med:hover { border-color:${S.blue}; color:${S.blue}; }
`;

const COMMON_MEDS = ['Metoprolol 50mg','Aspirin 81mg','Atorvastatin 40mg','Metformin 1g','Lisinopril 10mg','Amlodipine 5mg','Furosemide 40mg','Warfarin 5mg','Eliquis 5mg','Insulin glargine'];
const COMMON_ALLERGIES = ['Penicillin','Sulfa','Aspirin','NSAIDs','Iodine contrast','Latex','Codeine','Morphine'];

export default function MedsTab({ medications, setMedications, allergies, setAllergies, pmhSelected, setPmhSelected, pmhExtra, setPmhExtra, surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx, pmhExpanded, setPmhExpanded }) {
  const [medInput, setMedInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const addMed = (name) => { if (name && !medications.includes(name)) setMedications(p => [...p, name]); };
  const removeMed = (i) => setMedications(p => p.filter((_, idx) => idx !== i));
  const handleMedKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = medInput.replace(/,/g, '').trim();
      if (v) { addMed(v); setMedInput(''); }
    }
  };

  const addAllergy = (name) => { if (name && !allergies.includes(name)) setAllergies(p => [...p, name]); };
  const removeAllergy = (i) => setAllergies(p => p.filter((_, idx) => idx !== i));
  const handleAllergyKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = allergyInput.replace(/,/g, '').trim();
      if (v) { addAllergy(v); setAllergyInput(''); }
    }
  };

  const togglePMH = (name) => setPmhSelected(prev => ({ ...prev, [name]: ((prev[name] || 0) + 1) % 3 }));
  const toggleSys = (id) => setPmhExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const sysCount = (conditions) => conditions.filter(c => (pmhSelected[c] || 0) > 0).length;

  const totalPMH = Object.values(pmhSelected).filter(v => v > 0).length;
  const activePMH = Object.values(pmhSelected).filter(v => v === 2).length;

  const box = { background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px' };
  const secH = { display:'flex', alignItems:'center', gap:10, marginBottom:14 };
  const lbl = { fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500, marginBottom:4, display:'block' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>💊</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Medications &amp; Medical History</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Current meds · Allergies · Past medical, surgical, family &amp; social history</div>
        </div>
        {totalPMH > 0 && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(59,158,255,0.12)', color:S.blue, border:'1px solid rgba(59,158,255,0.3)' }}>{totalPMH} CONDITIONS</span>
            {activePMH > 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(245,200,66,0.12)', color:S.gold, border:'1px solid rgba(245,200,66,0.3)' }}>{activePMH} ACTIVE</span>}
          </div>
        )}
      </div>

      {/* Medications + Allergies side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Medications */}
        <div style={box}>
          <div style={secH}>
            <span style={{ fontSize:16 }}>💊</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Current Medications</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Type name + Enter or comma to add</div>
            </div>
            {medications.length > 0 && (
              <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(59,158,255,0.12)', color:S.blue, border:'1px solid rgba(59,158,255,0.3)' }}>{medications.length}</span>
            )}
          </div>
          <div className="tag-area" onClick={() => document.getElementById('med-input').focus()}>
            {medications.map((m, i) => (
              <span key={i} className="med-tag">{m}<span className="tag-x" onClick={e => { e.stopPropagation(); removeMed(i); }}>×</span></span>
            ))}
            <input id="med-input" className="tag-input" value={medInput} onChange={e => setMedInput(e.target.value)} onKeyDown={handleMedKey} placeholder={medications.length === 0 ? "e.g. Metoprolol 50mg…" : "Add more…"} />
          </div>
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:5 }}>Quick Add</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {COMMON_MEDS.map(m => (
                <span key={m} className="quick-med" onClick={() => addMed(m)}>{m.split(' ')[0]}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div style={box}>
          <div style={secH}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Allergies &amp; Adverse Reactions</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Drug, food, or substance allergies</div>
            </div>
            {allergies.length > 0 && (
              <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background:'rgba(255,107,107,0.12)', color:S.coral, border:'1px solid rgba(255,107,107,0.3)' }}>{allergies.length}</span>
            )}
          </div>
          <div className="tag-area tag-area-allergy" style={{ borderColor: allergies.length ? 'rgba(255,107,107,0.3)' : S.border }} onClick={() => document.getElementById('allergy-input').focus()}>
            {allergies.map((a, i) => (
              <span key={i} className="med-tag allergy-tag">{a}<span className="tag-x" onClick={e => { e.stopPropagation(); removeAllergy(i); }}>×</span></span>
            ))}
            <input id="allergy-input" className="tag-input" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={handleAllergyKey} placeholder={allergies.length === 0 ? "e.g. Penicillin…" : "Add more…"} />
          </div>
          <div style={{ marginTop:10 }}>
            <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:5 }}>Common</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {COMMON_ALLERGIES.map(a => (
                <span key={a} className="quick-med" style={{ borderColor:'rgba(255,107,107,0.2)', color:S.coral }} onClick={() => addAllergy(a)}
                  onMouseEnter={e => { e.target.style.borderColor=S.coral; }}
                  onMouseLeave={e => { e.target.style.borderColor='rgba(255,107,107,0.2)'; }}
                >{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Past Medical History */}
      <div style={box}>
        <div style={{ ...secH, marginBottom:10 }}>
          <span style={{ fontSize:16 }}>🏥</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Past Medical History</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Tap once = <span style={{ color:S.blue, fontWeight:600 }}>present</span> · Tap again = <span style={{ color:S.gold, fontWeight:600 }}>active/significant</span> · Tap again = clear</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
            <button onClick={() => setPmhExpanded(PMH_SYSTEMS.reduce((a, s) => ({ ...a, [s.id]: true }), {}))}
              style={{ fontSize:10, padding:'3px 10px', borderRadius:6, border:`1px solid ${S.border}`, background:S.up, color:S.txt3, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Expand All</button>
            <button onClick={() => setPmhExpanded({})}
              style={{ fontSize:10, padding:'3px 10px', borderRadius:6, border:`1px solid ${S.border}`, background:S.up, color:S.txt3, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Collapse All</button>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {PMH_SYSTEMS.map(sys => {
            const count = sysCount(sys.conditions);
            const isOpen = pmhExpanded[sys.id] ?? false;
            return (
              <div key={sys.id} className={`pmh-sys${count > 0 ? ' has-sel' : ''}`}>
                <div className="pmh-sys-hdr" onClick={() => toggleSys(sys.id)}>
                  <span style={{ fontSize:14, width:20, textAlign:'center' }}>{sys.icon}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:S.txt, flex:1 }}>{sys.name}</span>
                  {count > 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'1px 8px', borderRadius:20, background:'rgba(59,158,255,0.12)', color:S.blue, border:'1px solid rgba(59,158,255,0.25)', marginRight:4 }}>{count}</span>
                  )}
                  {count === 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4, marginRight:4 }}>{sys.conditions.length} conditions</span>
                  )}
                  <span className={`pmh-chevron${isOpen ? ' open' : ''}`}>▶</span>
                </div>
                <div className={`pmh-sys-body${isOpen ? ' open' : ''}`}>
                  {sys.conditions.map(cond => {
                    const st = pmhSelected[cond] || 0;
                    return (
                      <span key={cond}
                        className={`pmh-chip${st === 1 ? ' present' : st === 2 ? ' active-pmh' : ''}`}
                        onClick={() => togglePMH(cond)}
                      >
                        {st === 2 ? '★ ' : st === 1 ? '✓ ' : ''}{cond}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:12 }}>
          <label style={{ fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500, marginBottom:4, display:'block' }}>Additional Medical History (free text)</label>
          <textarea className="hist-textarea" value={pmhExtra} onChange={e => setPmhExtra(e.target.value)} placeholder="Other conditions, notes, or context…" rows={3} />
        </div>
      </div>

      {/* Surgical / Family / Social History */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {[
          { label:'Surgical History', icon:'✂️', val:surgHx, set:setSurgHx, ph:'Previous operations, procedures…' },
          { label:'Family History', icon:'👨‍👩‍👧', val:famHx, set:setFamHx, ph:'Relevant family history (parents, siblings)…' },
          { label:'Social History', icon:'🌍', val:socHx, set:setSocHx, ph:'Smoking, alcohol, drugs, occupation, living situation…' },
        ].map(h => (
          <div key={h.label} style={box}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>{h.icon}</span>
              <div style={{ fontSize:13, fontWeight:600, color:S.txt }}>{h.label}</div>
            </div>
            <textarea className="hist-textarea" value={h.val} onChange={e => h.set(e.target.value)} placeholder={h.ph} rows={4} />
          </div>
        ))}
      </div>
    </div>
  );
}