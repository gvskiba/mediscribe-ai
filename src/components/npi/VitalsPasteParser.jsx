import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function VitalsPasteParser({ vitals, setVitals, onToast }) {
  const [open, setOpen]   = useState(false);
  const [text, setText]   = useState('');
  const [loading, setLoading] = useState(false);

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract vital signs from this clinical text and return ONLY a JSON object with these keys (omit any you cannot find): hr, bp, rr, spo2, temp, gcs, weight, height.
- bp: "systolic/diastolic" string (e.g. "120/80")
- temp: in Fahrenheit as a number
- weight: in kg as a number
- height: in cm as a number
- all others: numbers

Clinical text:
${text}`,
      response_json_schema: {
        type: 'object',
        properties: {
          hr: { type: 'number' }, bp: { type: 'string' },
          rr: { type: 'number' }, spo2: { type: 'number' },
          temp: { type: 'number' }, gcs: { type: 'number' },
          weight: { type: 'number' }, height: { type: 'number' },
        }
      }
    });
    const extracted = {};
    Object.entries(result).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') extracted[k] = String(v);
    });
    setVitals(prev => ({ ...prev, ...extracted }));
    onToast?.('Vitals extracted from text', 'success');
    setOpen(false);
    setText('');
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding:'5px 14px', borderRadius:7, background:'rgba(59,158,255,.1)', border:'1px solid rgba(59,158,255,.3)', color:'var(--npi-blue)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
        📋 Paste Parse
      </button>

      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(3,8,18,.8)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background:'#081628', border:'1px solid rgba(42,79,122,.5)', borderRadius:14, padding:'24px 28px', width:520, maxWidth:'92vw', boxShadow:'0 24px 60px rgba(0,0,0,.6)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#f2f7ff', marginBottom:6 }}>Parse Vitals from Text</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#5a82a8', marginBottom:14 }}>Paste a triage note, nursing assessment, or any clinical text.</div>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. BP 138/88, HR 92, RR 18, SpO2 97% RA, Temp 98.6F, Wt 82kg..."
              style={{ width:'100%', height:120, padding:'10px 12px', background:'rgba(8,22,40,.9)', border:'1px solid rgba(42,79,122,.4)', borderRadius:9, color:'#f2f7ff', fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:'vertical', outline:'none' }}
            />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button onClick={() => { setOpen(false); setText(''); }}
                style={{ padding:'7px 16px', borderRadius:8, border:'1px solid rgba(42,79,122,.4)', background:'transparent', color:'#82aece', cursor:'pointer', fontSize:12 }}>
                Cancel
              </button>
              <button onClick={parse} disabled={loading || !text.trim()}
                style={{ padding:'7px 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#3b9eff,#00e5c0)', color:'#050f1e', fontWeight:700, fontSize:12, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>
                {loading ? 'Extracting…' : 'Extract Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}