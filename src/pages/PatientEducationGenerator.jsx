import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const TABS = ['setup', 'content', 'preview', 'export'];

const LEVEL_DESCS = {
  '3rd': '<strong style={{color:"#8aacc6"}}>3rd Grade:</strong> Very simple words only. Short sentences. No medical terms. Uses everyday analogies (like comparing a heart to a pump). Best for low-literacy or pediatric caregivers.',
  '5th': '<strong>5th Grade:</strong> Simple common words. Avoids most jargon. Uses comparisons and examples. Good for patients with limited health literacy.',
  '8th': '<strong>8th Grade:</strong> Standard health literacy. Uses common medical terms with brief explanations. Recommended for most adult patients.',
  'HS': '<strong>High School:</strong> Includes medical terminology with context. More detail. Good for engaged patients who want to understand their care.',
  'College': '<strong>College Level:</strong> Full clinical language. Minimal simplification. Suited for patients with medical/science backgrounds or who prefer detailed information.'
};

const SECTIONS_CONFIG = [
  { id: 'diagnosis', icon: '🔍', name: 'Your Diagnosis', desc: 'Plain-language explanation of the condition', on: true },
  { id: 'medications', icon: '💊', name: 'Your Medications', desc: 'What to take, when, and why', on: true },
  { id: 'activity', icon: '🏃', name: 'Activity & Rest', desc: 'What you can and cannot do', on: true },
  { id: 'diet', icon: '🥗', name: 'Diet & Nutrition', desc: 'Foods to eat, avoid, or limit', on: true },
  { id: 'followup', icon: '📅', name: 'Follow-Up Care', desc: 'Appointments, labs, who to call', on: true },
  { id: 'warning', icon: '⚠️', name: 'Warning Signs', desc: 'Symptoms that need urgent attention', on: true },
  { id: 'emergency', icon: '🚨', name: 'When to Call 911', desc: 'Life-threatening emergency signs', on: true },
  { id: 'resources', icon: '📚', name: 'Resources & Support', desc: 'Websites, support groups, phone numbers', on: false },
];

const SAMPLE_NOTE = `ASSESSMENT & PLAN:

1. UNSTABLE ANGINA / RULE OUT NSTEMI
   - 12-lead EKG obtained: non-specific ST changes in V4-V6
   - Troponin I, BMP, CBC ordered — pending
   - Aspirin 81mg daily initiated TODAY
   - Emergent cardiology referral placed (Dr. Chen)
   - Patient counseled on chest pain symptoms, activity restriction
   - AVOID strenuous activity until cardiology clears

2. HYPERTENSION, STAGE 2 — poorly controlled BP 158/96
   - Increase lisinopril from 10mg to 20mg daily
   - Low-sodium diet (<2g sodium/day) emphasized
   - Blood pressure log at home recommended
   - Recheck BP at cardiology appointment

3. TYPE 2 DIABETES MELLITUS — A1c 8.4%
   - Continue metformin 1000mg BID with meals
   - Refer to diabetes education program
   - Check blood sugar before meals and at bedtime
   - Target fasting glucose 80-130 mg/dL

4. HYPERLIPIDEMIA
   - Continue atorvastatin 20mg at bedtime
   - Heart-healthy diet reinforced

MEDICATIONS PRESCRIBED/CHANGED:
- Aspirin 81mg — 1 tablet daily (NEW)
- Lisinopril 20mg — 1 tablet daily (INCREASED from 10mg)
- Metformin 1000mg — 1 tablet twice daily with meals (unchanged)
- Atorvastatin 20mg — 1 tablet at bedtime (unchanged)

FOLLOW-UP:
- Cardiology (Dr. Chen): within 1 week — URGENT
- Primary care: 2 weeks for BP recheck
- Labs: repeat troponin at 6 hours (or go to ED if worsening)

EMERGENCY INSTRUCTIONS:
- Call 911 IMMEDIATELY if: chest pain worsens, pain spreads to arm/jaw, severe shortness of breath, loss of consciousness, or sweating with chest pain
- Do NOT drive yourself to the emergency room`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

.peg-root {
  --bg:#050f1e;--bg2:#0a1929;--bg3:#0d2035;--bg4:#102840;--bg5:#152f4a;
  --border:#1a3550;--border2:#1e4060;--border3:#254d75;
  --text:#e4eef8;--text2:#8aacc6;--text3:#4a7a9b;
  --accent:#00c6ff;--accent2:#0096d6;--accent3:#006fa0;
  --green:#00e5a0;--green2:#00b880;--amber:#f5a623;--amber2:#c07d10;
  --red:#ff4757;--purple:#a78bfa;--teal:#2dd4bf;
  --sidebar:220px;--ai-panel:295px;--navbar:50px;--vitals:38px;--bottom:76px;
  --mono:'JetBrains Mono',monospace;--serif:'Playfair Display',Georgia,serif;
  --sans:'Outfit',sans-serif;--doc-serif:'Lora',Georgia,serif;
  background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;
  position:fixed;top:48px;left:72px;right:0;bottom:0;overflow:hidden;display:flex;flex-direction:column;z-index:10;
}
.peg-navbar{height:var(--navbar);background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:12px;flex-shrink:0;}
.peg-nav-logo{font-family:var(--serif);font-size:20px;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px;}
.peg-nav-div{width:1px;height:24px;background:var(--border2);margin:0 4px;}
.peg-nav-title{font-family:var(--serif);font-size:15px;color:var(--text2);font-weight:400;}
.peg-nav-sp{flex:1;}
.peg-nav-pill{font-family:var(--mono);font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid var(--border2);color:var(--text3);background:var(--bg3);letter-spacing:.04em;}
.peg-nav-pill.live{border-color:var(--green);color:var(--green);}
.peg-nav-back{display:flex;align-items:center;gap:5px;padding:5px 12px;border:1px solid var(--border2);border-radius:6px;background:transparent;color:var(--text2);cursor:pointer;font-family:var(--sans);font-size:12px;text-decoration:none;transition:.15s;}
.peg-nav-back:hover{background:var(--bg3);color:var(--text);border-color:var(--accent);}
.peg-vitals-bar{height:var(--vitals);background:var(--bg3);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px 0 calc(var(--sidebar) + 16px);gap:22px;flex-shrink:0;font-family:var(--mono);font-size:11px;}
.peg-vit{display:flex;align-items:center;gap:6px;}
.peg-vit-lbl{color:var(--text3);}
.peg-vit-val{color:var(--text);}
.peg-vit-val.abn{color:var(--red);animation:peg-glow-red 1.8s ease-in-out infinite;}
@keyframes peg-glow-red{0%,100%{text-shadow:0 0 4px rgba(255,71,87,.4);}50%{text-shadow:0 0 12px rgba(255,71,87,.9),0 0 20px rgba(255,71,87,.4);}}
.peg-vit-sep{color:var(--border2);}
.peg-vit-patient{font-family:var(--serif);font-size:13px;color:var(--text);margin-right:4px;}
.peg-body{display:flex;flex:1;overflow:hidden;min-height:0;}
.peg-sidebar{width:var(--sidebar);flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);overflow-y:auto;padding:12px 0;display:flex;flex-direction:column;gap:2px;min-height:0;}
.peg-sidebar::-webkit-scrollbar{width:3px;}
.peg-sidebar::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.peg-sb-sec{padding:6px 14px 4px;font-size:10px;font-weight:600;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;}
.peg-sb-item{display:flex;align-items:center;gap:9px;padding:8px 14px;cursor:pointer;border-left:2px solid transparent;transition:.15s;color:var(--text2);font-size:13px;}
.peg-sb-item:hover{background:var(--bg3);color:var(--text);}
.peg-sb-item.active{background:var(--bg3);color:var(--accent);border-left-color:var(--accent);}
.peg-sb-ico{font-size:14px;width:18px;text-align:center;}
.peg-sb-badge{margin-left:auto;font-family:var(--mono);font-size:10px;padding:1px 6px;border-radius:10px;min-width:20px;text-align:center;}
.peg-sb-badge.n{background:var(--bg4);color:var(--text3);}
.peg-sb-badge.ok{background:rgba(0,229,160,.12);color:var(--green);}
.peg-sb-badge.warn{background:rgba(245,166,35,.15);color:var(--amber);animation:peg-glow-red 1.8s infinite;}
.peg-main{flex:1;overflow:hidden;background:var(--bg);display:flex;flex-direction:column;min-width:0;min-height:0;}
.peg-main::-webkit-scrollbar{width:5px;}
.peg-main::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.peg-ai-panel{width:var(--ai-panel);flex-shrink:0;background:var(--bg2);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;min-height:0;}
.peg-ai-hdr{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-shrink:0;}
.peg-ai-hdr-title{font-size:12px;font-weight:600;color:var(--text);letter-spacing:.04em;}
.peg-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:peg-pulse-g 2s infinite;}
@keyframes peg-pulse-g{0%,100%{box-shadow:0 0 4px var(--green2);}50%{box-shadow:0 0 12px var(--green),0 0 20px rgba(0,229,160,.3);}}
.peg-ai-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;}
.peg-ai-body::-webkit-scrollbar{width:3px;}
.peg-ai-body::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.peg-ai-msg{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;color:var(--text2);line-height:1.65;animation:peg-fadeUp .3s ease;}
@keyframes peg-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.peg-ai-sec-lbl{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin:8px 0 4px;}
.peg-ai-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text3);text-align:center;padding:20px;}
.peg-ai-progress-bar{height:3px;background:var(--border);border-radius:2px;overflow:hidden;margin:8px 0;}
.peg-ai-progress-fill{height:100%;background:linear-gradient(90deg,var(--accent2),var(--green));border-radius:2px;transition:width .4s ease;}
.peg-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--accent);margin:0 2px;animation:peg-blink 1.2s infinite;}
.peg-dots span:nth-child(2){animation-delay:.2s;}
.peg-dots span:nth-child(3){animation-delay:.4s;}
@keyframes peg-blink{0%,80%,100%{opacity:.2}40%{opacity:1}}
.peg-ai-think{display:flex;align-items:center;gap:8px;padding:8px;font-size:12px;color:var(--text3);}
.peg-bottom-nav{flex-shrink:0;background:var(--bg2);border-top:1px solid var(--border);height:var(--bottom);display:flex;flex-direction:column;}
.peg-btabs-row{display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border);height:38px;gap:2px;}
.peg-btab{padding:0 16px;height:38px;display:flex;align-items:center;gap:6px;cursor:pointer;border-bottom:2px solid transparent;color:var(--text3);font-size:12px;font-weight:500;transition:.15s;white-space:nowrap;background:transparent;border-top:none;border-left:none;border-right:none;}
.peg-btab:hover{color:var(--text2);}
.peg-btab.active{color:var(--accent);border-bottom-color:var(--accent);}
.peg-btab .tc{font-family:var(--mono);font-size:10px;padding:1px 5px;border-radius:8px;background:var(--bg4);color:var(--text3);}
.peg-btab.active .tc{background:rgba(0,198,255,.15);color:var(--accent);}
.peg-brow2{display:flex;align-items:center;padding:0 16px;height:38px;gap:8px;}
.peg-btn{padding:5px 14px;border-radius:5px;font-size:12px;font-weight:500;cursor:pointer;transition:.15s;border:1px solid var(--border2);background:transparent;color:var(--text2);font-family:var(--sans);}
.peg-btn:hover{background:var(--bg3);color:var(--text);}
.peg-btn.primary{background:var(--accent2);color:#fff;border-color:var(--accent2);}
.peg-btn.primary:hover{background:var(--accent);border-color:var(--accent);}
.peg-btn.success{background:rgba(0,229,160,.12);color:var(--green);border-color:var(--green2);}
.peg-btn.success:hover{background:rgba(0,229,160,.2);}
.peg-btn.amber{background:rgba(245,166,35,.12);color:var(--amber);border-color:var(--amber2);}
.peg-btn.amber:hover{background:rgba(245,166,35,.2);}
.peg-btn:disabled{opacity:.4;pointer-events:none;}
.peg-bsp{flex:1;}
.peg-step-info{font-size:11px;color:var(--text3);font-family:var(--mono);}
.peg-tab-panel{display:none;flex:1;flex-direction:column;padding:20px;padding-bottom:20px;gap:16px;overflow-y:auto;min-height:0;}
.peg-tab-panel.active{display:flex;}
.peg-tab-panel::-webkit-scrollbar{width:5px;}
.peg-tab-panel::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.peg-sec-hdr{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;}
.peg-sec-title{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--text);}
.peg-sec-sub{font-size:12px;color:var(--text3);margin-top:4px;}
.peg-sec-sp{flex:1;}
.peg-card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
.peg-card-hdr{padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;background:var(--bg3);}
.peg-card-title{font-size:11px;font-weight:600;color:var(--text);letter-spacing:.06em;text-transform:uppercase;}
.peg-card-body{padding:24px;}
.peg-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.peg-form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.peg-form-group{display:flex;flex-direction:column;gap:5px;}
.peg-form-label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;}
.peg-form-input,.peg-form-select,.peg-form-textarea{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:var(--sans);font-size:13px;padding:8px 10px;outline:none;transition:.2s;width:100%;}
.peg-form-input:focus,.peg-form-select:focus,.peg-form-textarea:focus{border-color:var(--accent2);box-shadow:0 0 0 2px rgba(0,150,214,.12);}
.peg-form-select{cursor:pointer;}
.peg-form-select option{background:var(--bg2);}
.peg-form-textarea{resize:vertical;min-height:130px;line-height:1.65;}
.peg-level-rail{display:flex;gap:8px;}
.peg-level-opt{flex:1;padding:14px 8px;text-align:center;cursor:pointer;transition:.15s;border:1px solid var(--border2);border-radius:8px;font-size:11px;color:var(--text3);font-weight:500;line-height:1.5;background:var(--bg3);}
.peg-level-opt:hover{background:var(--bg4);color:var(--text2);border-color:var(--border3);}
.peg-level-opt.sel{background:rgba(0,198,255,.15);color:var(--accent);font-weight:600;border-color:var(--accent2);}
.peg-level-grade{font-family:var(--mono);font-size:16px;font-weight:700;display:block;margin-bottom:4px;}
.peg-tip{background:rgba(0,198,255,.06);border:1px solid rgba(0,198,255,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text2);display:flex;align-items:flex-start;gap:8px;line-height:1.6;}
.peg-tip-ico{font-size:14px;flex-shrink:0;margin-top:1px;}
.peg-section-toggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.peg-sec-toggle{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border2);border-radius:8px;cursor:pointer;transition:.15s;background:transparent;}
.peg-sec-toggle:hover{border-color:var(--border3);background:var(--bg3);}
.peg-sec-toggle.on{border-color:var(--accent2);background:rgba(0,198,255,.06);}
.peg-sec-toggle-ico{font-size:18px;}
.peg-sec-toggle-info{flex:1;}
.peg-sec-toggle-name{font-size:13px;font-weight:500;color:var(--text);}
.peg-sec-toggle-desc{font-size:11px;color:var(--text3);margin-top:2px;}
.peg-toggle-sw{width:32px;height:18px;border-radius:9px;background:var(--border2);position:relative;flex-shrink:0;transition:.2s;}
.peg-toggle-sw.on{background:var(--accent2);}
.peg-toggle-sw::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:.2s;}
.peg-toggle-sw.on::after{left:16px;}
.peg-loader-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text3);}
.peg-spin{width:16px;height:16px;border-radius:50%;border:2px solid var(--border2);border-top-color:var(--accent);animation:peg-spin .8s linear infinite;flex-shrink:0;}
@keyframes peg-spin{to{transform:rotate(360deg)}}
.peg-gen-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;background:linear-gradient(135deg,var(--accent2),var(--green2));color:#fff;border:none;cursor:pointer;font-family:var(--sans);transition:.2s;letter-spacing:.02em;}
.peg-gen-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,198,255,.25);}
.peg-gen-btn:disabled{opacity:.5;pointer-events:none;transform:none;box-shadow:none;}
.peg-doc-toolbar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:10px 10px 0 0;border-bottom:none;}
.peg-doc-toolbar-title{font-size:12px;color:var(--text2);font-weight:500;}
.peg-doc-sp{flex:1;}
.peg-doc-preview-wrap{background:var(--bg2);border:1px solid var(--border);border-radius:0 0 10px 10px;overflow:auto;max-height:600px;}
.peg-doc-preview-wrap::-webkit-scrollbar{width:5px;}
.peg-doc-preview-wrap::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.peg-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px;text-align:center;color:var(--text3);border:1px dashed var(--border);border-radius:10px;flex:1;}
.peg-empty-ico{font-size:40px;opacity:.3;}
.peg-empty-ttl{font-size:14px;font-weight:500;color:var(--text2);}
.peg-empty-sub{font-size:12px;line-height:1.6;max-width:280px;}
.peg-toast{position:fixed;bottom:90px;right:20px;background:var(--green2);color:#fff;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;opacity:0;transform:translateY(10px);transition:.3s;pointer-events:none;z-index:200;}
.peg-toast.show{opacity:1;transform:none;}
/* Patient doc styles */
.patient-doc{background:#fff;color:#1a1a1a;max-width:720px;margin:20px auto;border-radius:6px;font-family:'Lora',Georgia,serif;line-height:1.7;box-shadow:0 2px 20px rgba(0,0,0,.3);overflow:hidden;}
.pdoc-header{background:linear-gradient(135deg,#0a3d62,#1e6f9f);color:#fff;padding:28px 36px 24px;}
.pdoc-logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;opacity:.7;letter-spacing:-.3px;}
.pdoc-patient-name{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin:8px 0 4px;letter-spacing:-.5px;}
.pdoc-meta{font-size:13px;opacity:.8;font-family:'Outfit',sans-serif;}
.pdoc-meta span{margin-right:18px;}
.pdoc-body{padding:28px 36px;}
.pdoc-section{margin-bottom:28px;}
.pdoc-section-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#0a3d62;border-bottom:2px solid #1e6f9f;padding-bottom:6px;margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.pdoc-section-icon{font-size:18px;}
.pdoc-p{font-size:14px;color:#2c2c2c;margin-bottom:10px;line-height:1.75;}
.pdoc-ul{padding-left:20px;margin-bottom:10px;}
.pdoc-ul li{font-size:14px;color:#2c2c2c;margin-bottom:6px;line-height:1.65;}
.pdoc-warning-box{background:#fff8e7;border:2px solid #f5a623;border-radius:8px;padding:14px 16px;margin:10px 0;}
.pdoc-warning-title{font-weight:700;color:#b86c00;margin-bottom:8px;font-family:'Outfit',sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;}
.pdoc-emergency-box{background:#fff0f0;border:2px solid #e53e3e;border-radius:8px;padding:14px 16px;margin:10px 0;}
.pdoc-emergency-title{font-weight:700;color:#c53030;margin-bottom:8px;font-family:'Outfit',sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;}
.pdoc-footer{background:#f7fafc;border-top:1px solid #e2e8f0;padding:18px 36px;font-size:12px;color:#718096;font-family:'Outfit',sans-serif;display:flex;justify-content:space-between;align-items:center;}
.pdoc-footer-logo{font-family:'Playfair Display',serif;font-size:14px;color:#4a5568;font-weight:700;}
.pdoc-table{width:100%;border-collapse:collapse;margin:10px 0;}
.pdoc-table th{text-align:left;font-size:12px;font-weight:700;color:#4a5568;padding:6px 8px;background:#f7fafc;border:1px solid #e2e8f0;font-family:'Outfit',sans-serif;}
.pdoc-table td{font-size:13px;color:#2d3748;padding:8px;border:1px solid #e2e8f0;vertical-align:top;}
.pdoc-table tr:nth-child(even) td{background:#f7fafc;}
@media print{
  .peg-navbar,.peg-vitals-bar,.peg-sidebar,.peg-ai-panel,.peg-bottom-nav,.peg-doc-toolbar{display:none!important;}
  .patient-doc{box-shadow:none!important;margin:0!important;border-radius:0!important;}
}
`;

export default function PatientEducationGenerator() {
  const [currentTab, setCurrentTab] = useState('setup');
  const [selectedLevel, setSelectedLevel] = useState('8th');
  const [sections, setSections] = useState(SECTIONS_CONFIG.map(s => ({ ...s })));
  const [clinicalNote, setClinicalNote] = useState('');
  const [ptName, setPtName] = useState('');
  const [ptDob, setPtDob] = useState('');
  const [ptPref, setPtPref] = useState('');
  const [ptLang, setPtLang] = useState('English');
  const [ptTone, setPtTone] = useState('clear and direct');
  const [ptFormat, setPtFormat] = useState('bullet points with brief explanations');
  const [ptSpecial, setPtSpecial] = useState('');
  const [condition, setCondition] = useState('');
  const [followupProvider, setFollowupProvider] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [providerName, setProviderName] = useState('');
  const [generatedDocHTML, setGeneratedDocHTML] = useState('');
  const [generatedDocText, setGeneratedDocText] = useState('');
  const [documentGenerated, setDocumentGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewBadge, setPreviewBadge] = useState('—');
  const [exportBadge, setExportBadge] = useState('—');
  const [docMetaLabel, setDocMetaLabel] = useState('');
  const [expInfo, setExpInfo] = useState({});
  const [aiPanel, setAiPanel] = useState({ type: 'empty' });
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState('');
  const [showToast, setShowToast] = useState(false);
  const progTimer = useRef(null);

  const switchTab = (tab) => setCurrentTab(tab);
  const navIdx = TABS.indexOf(currentTab);

  const toggleSection = (id) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, on: !s.on } : s));
  };

  const startAIThinking = () => {
    setAiPanel({ type: 'thinking' });
    setAiProgress(0);
    const steps = ['Analyzing clinical note…', 'Adapting vocabulary to reading level…', 'Translating content…', 'Formatting sections…', 'Finalizing document…'];
    let i = 0;
    if (progTimer.current) clearInterval(progTimer.current);
    progTimer.current = setInterval(() => {
      if (i >= steps.length) { clearInterval(progTimer.current); return; }
      setAiProgress(Math.round((i + 1) / steps.length * 90));
      setAiProgressLabel(steps[i]);
      i++;
    }, 600);
  };

  const generateDocument = async () => {
    if (!clinicalNote.trim()) {
      alert('Please paste a clinical note in the Content & Note tab first.');
      setCurrentTab('content');
      return;
    }
    setGenerating(true);
    startAIThinking();
    const enabledSections = sections.filter(s => s.on);
    const sectionList = enabledSections.map(s => s.id).join(', ');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `You are a clinical health educator specializing in patient-centered discharge instructions.

Create a comprehensive, personalized patient education document based on the clinical note below.

PATIENT: ${ptPref || ptName}
READING LEVEL: ${selectedLevel} grade level — strictly calibrate ALL vocabulary and sentence complexity to this level
LANGUAGE: Write the ENTIRE document in ${ptLang}
TONE: ${ptTone}
FORMAT: Use ${ptFormat}
SECTIONS TO INCLUDE: ${sectionList}
CONDITION/TITLE: ${condition}
FOLLOW-UP PROVIDER: ${followupProvider}
FOLLOW-UP DATE: ${followupDate}
SIGNING PROVIDER: ${providerName}
${ptSpecial ? 'SPECIAL INSTRUCTIONS: ' + ptSpecial : ''}

CLINICAL NOTE:
${clinicalNote}

Return ONLY a valid JSON object — no markdown fences, no text before or after. Use this exact structure:

{
  "title": "Document title (patient-friendly)",
  "date": "${today}",
  "sections": [
    {
      "id": "diagnosis",
      "heading": "Section heading in ${ptLang}",
      "icon": "emoji",
      "type": "text|bullets|table|warning|emergency",
      "content": "Main content as HTML — use <p>, <ul><li>, <strong>, <table class='pdoc-table'> as appropriate. For medication tables include columns: Medication, Dose, When to Take, Why.",
      "subtype": null
    }
  ],
  "readability_score": "Flesch-Kincaid grade estimate",
  "word_count": 0,
  "key_messages": ["3 most important takeaways in ${ptLang}"],
  "provider_note": "Short note from provider to patient in ${ptLang} (1-2 sentences, warm closing)",
  "ai_notes": "Brief English note for the clinician about any terminology adaptations made (always in English)"
}

CRITICAL RULES:
- ALL patient-facing text MUST be in ${ptLang}
- ai_notes is ALWAYS in English
- Reading level ${selectedLevel}: ${selectedLevel === '3rd' ? 'Only use words a 3rd grader knows. Very short sentences. No medical jargon at all.' : selectedLevel === '5th' ? 'Simple common words. Avoid jargon. Short sentences.' : selectedLevel === '8th' ? 'Plain language with brief explanations of medical terms.' : selectedLevel === 'HS' ? 'Includes medical terms with context. More detailed.' : 'Full medical vocabulary. Detailed explanations for educated audience.'}
- Warning sections must use type "warning", Emergency sections use type "emergency"
- Make content specific to THIS patient's clinical note — not generic`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: null
      });

      let parsed;
      const raw = typeof result === 'string' ? result : JSON.stringify(result);
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch (e) {
        throw new Error('Could not parse AI response. Please try again.');
      }

      clearInterval(progTimer.current);

      // Build doc HTML
      const ptAge = ptDob ? Math.floor((Date.now() - new Date(ptDob)) / (365.25 * 24 * 3600 * 1000)) : '';
      let sectionsHTML = '';
      for (const sec of (parsed.sections || [])) {
        const isWarn = sec.type === 'warning';
        const isEmrg = sec.type === 'emergency';
        let inner = '';
        if (isWarn) inner = `<div class="pdoc-warning-box"><div class="pdoc-warning-title">⚠️ Warning Signs</div>${sec.content}</div>`;
        else if (isEmrg) inner = `<div class="pdoc-emergency-box"><div class="pdoc-emergency-title">🚨 Call 911 Immediately</div>${sec.content}</div>`;
        else inner = sec.content || '';
        sectionsHTML += `<div class="pdoc-section"><div class="pdoc-section-title"><span class="pdoc-section-icon">${sec.icon || '📌'}</span>${sec.heading}</div>${inner}</div>`;
      }
      const keyMsgs = (parsed.key_messages || []).map(m => `<li>${m}</li>`).join('');
      const html = `<div class="patient-doc"><div class="pdoc-header"><div class="pdoc-logo">Notrya Clinical</div><div class="pdoc-patient-name">${ptPref || ptName}</div><div class="pdoc-meta"><span>📅 ${parsed.date || today}</span><span>🏥 ${condition}</span>${ptAge ? `<span>👤 Age ${ptAge}</span>` : ''}${ptLang !== 'English' ? `<span>🌐 ${ptLang}</span>` : ''}</div></div><div class="pdoc-body">${keyMsgs ? `<div class="pdoc-section"><div class="pdoc-section-title"><span class="pdoc-section-icon">⭐</span>Key Takeaways</div><ul class="pdoc-ul">${keyMsgs}</ul></div>` : ''}${sectionsHTML}${parsed.provider_note ? `<div class="pdoc-section"><div class="pdoc-section-title"><span class="pdoc-section-icon">✍️</span>A Note from Your Care Team</div><p class="pdoc-p" style="font-style:italic;">${parsed.provider_note}</p></div>` : ''}</div><div class="pdoc-footer"><div><div class="pdoc-footer-logo">Notrya</div><div>Generated by: ${providerName || 'Your Care Team'} | ${today}</div></div><div style="text-align:right;"><div><strong>Questions?</strong></div><div>${followupProvider ? 'Contact: ' + followupProvider : 'Contact your care team'}</div>${followupDate ? `<div>Follow-up: ${followupDate}</div>` : ''}</div></div></div>`;

      setGeneratedDocHTML(html);
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      setGeneratedDocText(tmp.innerText);
      setDocumentGenerated(true);
      setPreviewBadge('✓');
      setExportBadge('✓');
      setDocMetaLabel(`${ptLang} · ${selectedLevel} Grade · ${(parsed.word_count || 0).toLocaleString()} words`);
      setExpInfo({ ptName, level: selectedLevel + ' Grade', lang: ptLang, sections: enabledSections.length, condition, time: new Date().toLocaleTimeString() });
      setAiPanel({ type: 'result', parsed, lang: ptLang, sectionCount: enabledSections.length });
      setCurrentTab('preview');
    } catch (err) {
      clearInterval(progTimer.current);
      setAiPanel({ type: 'error', msg: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const copyDocText = () => {
    if (!generatedDocText) return;
    navigator.clipboard.writeText(generatedDocText).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    });
  };

  const printDoc = () => window.print();

  const downloadHTML = () => {
    if (!generatedDocHTML) return;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Patient Education</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Outfit:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"><style>body{margin:0;padding:20px;background:#f0f4f8;}.patient-doc{background:#fff;max-width:720px;margin:0 auto;font-family:'Lora',Georgia,serif;line-height:1.7;}.pdoc-header{background:linear-gradient(135deg,#0a3d62,#1e6f9f);color:#fff;padding:28px 36px 24px;}.pdoc-patient-name{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;}.pdoc-body{padding:28px 36px;}.pdoc-section{margin-bottom:28px;}.pdoc-section-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#0a3d62;border-bottom:2px solid #1e6f9f;padding-bottom:6px;margin-bottom:14px;display:flex;align-items:center;gap:10px;}.pdoc-p{font-size:14px;color:#2c2c2c;margin-bottom:10px;line-height:1.75;}.pdoc-ul{padding-left:20px;}.pdoc-ul li{font-size:14px;color:#2c2c2c;margin-bottom:6px;}.pdoc-warning-box{background:#fff8e7;border:2px solid #f5a623;border-radius:8px;padding:14px 16px;margin:10px 0;}.pdoc-emergency-box{background:#fff0f0;border:2px solid #e53e3e;border-radius:8px;padding:14px 16px;margin:10px 0;}.pdoc-footer{background:#f7fafc;border-top:1px solid #e2e8f0;padding:18px 36px;font-size:12px;color:#718096;display:flex;justify-content:space-between;}.pdoc-table{width:100%;border-collapse:collapse;margin:10px 0;}.pdoc-table th,.pdoc-table td{padding:8px;border:1px solid #e2e8f0;font-size:13px;}</style></head><body>${generatedDocHTML}</body></html>`;
    const blob = new Blob([full], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `patient-education-${Date.now()}.html`;
    a.click();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="peg-root">
        {/* Navbar */}
        <nav className="peg-navbar">
          <span className="peg-nav-logo">Notrya</span>
          <div className="peg-nav-div" />
          <span className="peg-nav-title">Patient Education Generator</span>
          <div className="peg-nav-sp" />
          <span className="peg-nav-pill">Encounter: {new Date().toISOString().slice(0, 10)}</span>
          <span className="peg-nav-pill live">● AI Ready</span>
          <Link to="/Home" className="peg-nav-back">← Home</Link>
        </nav>

        {/* Vitals Bar */}
        <div className="peg-vitals-bar">
          {ptName ? (
            <>
              <span className="peg-vit-patient">{ptPref || ptName}</span>
              {ptDob && <><span className="peg-vit-sep">|</span><div className="peg-vit"><span className="peg-vit-lbl">DOB</span><span className="peg-vit-val">{ptDob}</span></div></>}
              {condition && <><span className="peg-vit-sep">|</span><div className="peg-vit"><span className="peg-vit-lbl">Condition</span><span className="peg-vit-val">{condition}</span></div></>}
              {selectedLevel && <><span className="peg-vit-sep">|</span><div className="peg-vit"><span className="peg-vit-lbl">Reading Level</span><span className="peg-vit-val">{selectedLevel} Grade</span></div></>}
              <span className="peg-vit-sep">|</span><div className="peg-vit"><span className="peg-vit-lbl">Language</span><span className="peg-vit-val">{ptLang}</span></div>
            </>
          ) : (
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>No patient configured — fill in Patient Setup to begin</span>
          )}
        </div>

        {/* Body */}
        <div className="peg-body">
          {/* Sidebar */}
          <aside className="peg-sidebar">
            <div className="peg-sb-sec">Education</div>
            {[['setup','👤','Patient Setup'], ['content','📋','Content & Note'], ['preview','📄','Document Preview'], ['export','📤','Print / Export']].map(([tab, ico, label], i) => (
              <div key={tab} className={`peg-sb-item ${currentTab === tab ? 'active' : ''}`} onClick={() => switchTab(tab)}>
                <span className="peg-sb-ico">{ico}</span> {label}
                <span className={`peg-sb-badge ${tab === 'preview' || tab === 'export' ? (documentGenerated ? 'ok' : 'n') : 'n'}`}>
                  {tab === 'preview' ? previewBadge : tab === 'export' ? exportBadge : '—'}
                </span>
              </div>
            ))}
            <div className="peg-sb-sec" style={{ marginTop: 12 }}>Navigate To</div>
            <Link to="/AutoCoder" className="peg-sb-item" style={{ textDecoration: 'none' }}><span className="peg-sb-ico">🏥</span>Auto-Coder</Link>
            <Link to="/ClinicalNoteStudio" className="peg-sb-item" style={{ textDecoration: 'none' }}><span className="peg-sb-ico">🩺</span>Note Studio</Link>
            <Link to="/NoteCreationHub" className="peg-sb-item" style={{ textDecoration: 'none' }}><span className="peg-sb-ico">✨</span>Note Hub</Link>
            <Link to="/PatientDashboard" className="peg-sb-item" style={{ textDecoration: 'none' }}><span className="peg-sb-ico">👤</span>Patients</Link>
            <Link to="/BillingDashboard" className="peg-sb-item" style={{ textDecoration: 'none' }}><span className="peg-sb-ico">💳</span>Billing</Link>
          </aside>

          {/* Main */}
          <main className="peg-main">
            {/* TAB: SETUP */}
            <div className={`peg-tab-panel ${currentTab === 'setup' ? 'active' : ''}`}>
              <div className="peg-sec-hdr">
                <div>
                  <div className="peg-sec-title">Patient Setup</div>
                  <div className="peg-sec-sub">Configure personalization — language, reading level, demographics</div>
                </div>
              </div>
              <div className="peg-tip">
                <span className="peg-tip-ico">🌟</span>
                <span>The AI tailors vocabulary, sentence length, examples, and tone to match the patient's reading level and language.</span>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr"><span className="peg-card-title">Patient Information</span></div>
                <div className="peg-card-body">
                   <div className="peg-form-grid-3">
                     <div className="peg-form-group"><label className="peg-form-label">Patient Name</label><input className="peg-form-input" value={ptName} onChange={e => setPtName(e.target.value)} /></div>
                     <div className="peg-form-group"><label className="peg-form-label">Date of Birth</label><input className="peg-form-input" type="date" value={ptDob} onChange={e => setPtDob(e.target.value)} /></div>
                     <div className="peg-form-group"><label className="peg-form-label">Preferred Name / Salutation</label><input className="peg-form-input" value={ptPref} onChange={e => setPtPref(e.target.value)} /></div>
                   </div>
                 </div>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr"><span className="peg-card-title">Reading Level</span></div>
                <div className="peg-card-body">
                  <div className="peg-level-rail">
                    {[['3rd','3rd','Grade'], ['5th','5th','Grade'], ['8th','8th','Grade'], ['HS','HS','High School'], ['College','Col','College']].map(([val, grade, label]) => (
                      <div key={val} className={`peg-level-opt ${selectedLevel === val ? 'sel' : ''}`} onClick={() => setSelectedLevel(val)}>
                        <span className="peg-level-grade">{grade}</span>{label}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }} dangerouslySetInnerHTML={{ __html: LEVEL_DESCS[selectedLevel] }} />
                </div>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr"><span className="peg-card-title">Language & Tone</span></div>
                <div className="peg-card-body">
                  <div className="peg-form-grid-3" style={{ marginBottom: 14 }}>
                    <div className="peg-form-group">
                      <label className="peg-form-label">Output Language</label>
                      <select className="peg-form-select" value={ptLang} onChange={e => setPtLang(e.target.value)}>
                        {['English','Spanish','Mandarin Chinese','French','Arabic','Portuguese','Hindi','Tagalog','Vietnamese','Russian'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="peg-form-group">
                      <label className="peg-form-label">Tone</label>
                      <select className="peg-form-select" value={ptTone} onChange={e => setPtTone(e.target.value)}>
                        <option value="warm and encouraging">Warm & Encouraging</option>
                        <option value="clear and direct">Clear & Direct</option>
                        <option value="clinical and precise">Clinical & Precise</option>
                        <option value="friendly and conversational">Friendly & Conversational</option>
                      </select>
                    </div>
                    <div className="peg-form-group">
                      <label className="peg-form-label">Format</label>
                      <select className="peg-form-select" value={ptFormat} onChange={e => setPtFormat(e.target.value)}>
                        <option value="bullet points with brief explanations">Bullets + Explanations</option>
                        <option value="paragraph narrative">Paragraph Narrative</option>
                        <option value="numbered steps">Numbered Steps</option>
                        <option value="mixed bullets and short paragraphs">Mixed Format</option>
                      </select>
                    </div>
                  </div>
                  <div className="peg-form-group">
                    <label className="peg-form-label">Special Instructions (optional)</label>
                    <textarea className="peg-form-textarea" rows={2} style={{ minHeight: 64 }} value={ptSpecial} onChange={e => setPtSpecial(e.target.value)} placeholder="e.g. Patient is visually impaired. Patient lives alone." />
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: CONTENT */}
            <div className={`peg-tab-panel ${currentTab === 'content' ? 'active' : ''}`}>
              <div className="peg-sec-hdr">
                <div>
                  <div className="peg-sec-title">Content & Clinical Note</div>
                  <div className="peg-sec-sub">Select sections to include and paste the clinical note for AI context</div>
                </div>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr"><span className="peg-card-title">Sections to Include</span></div>
                <div className="peg-card-body">
                  <div className="peg-section-toggle-grid">
                    {sections.map(s => (
                      <div key={s.id} className={`peg-sec-toggle ${s.on ? 'on' : ''}`} onClick={() => toggleSection(s.id)}>
                        <span className="peg-sec-toggle-ico">{s.icon}</span>
                        <div className="peg-sec-toggle-info">
                          <div className="peg-sec-toggle-name">{s.name}</div>
                          <div className="peg-sec-toggle-desc">{s.desc}</div>
                        </div>
                        <div className={`peg-toggle-sw ${s.on ? 'on' : ''}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr">
                  <span className="peg-card-title">Clinical Note / Diagnosis Context</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="peg-btn" onClick={() => setClinicalNote(SAMPLE_NOTE)}>Load Sample</button>
                    <button className="peg-btn" onClick={() => setClinicalNote('')}>Clear</button>
                  </div>
                </div>
                <div className="peg-card-body">
                  <textarea className="peg-form-textarea" rows={12} style={{ minHeight: 220 }} value={clinicalNote} onChange={e => setClinicalNote(e.target.value)} placeholder="Paste the clinical note, discharge summary, or assessment/plan here..." />
                </div>
              </div>
              <div className="peg-card">
                <div className="peg-card-hdr"><span className="peg-card-title">Additional Patient Context</span></div>
                <div className="peg-card-body">
                  <div className="peg-form-grid">
                    <div className="peg-form-group"><label className="peg-form-label">Primary Condition</label><input className="peg-form-input" value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. Unstable Angina" /></div>
                    <div className="peg-form-group"><label className="peg-form-label">Follow-up Provider</label><input className="peg-form-input" value={followupProvider} onChange={e => setFollowupProvider(e.target.value)} /></div>
                    <div className="peg-form-group"><label className="peg-form-label">Follow-up Date / Timeframe</label><input className="peg-form-input" value={followupDate} onChange={e => setFollowupDate(e.target.value)} /></div>
                    <div className="peg-form-group"><label className="peg-form-label">Provider Name (signing)</label><input className="peg-form-input" value={providerName} onChange={e => setProviderName(e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button className="peg-gen-btn" onClick={generateDocument} disabled={generating}>
                  {generating ? '⏳ Generating…' : '✦ Generate Patient Education Document'}
                </button>
                {generating && (
                  <div className="peg-loader-row">
                    <div className="peg-spin" />
                    <span>AI is crafting your document…</span>
                  </div>
                )}
              </div>
            </div>

            {/* TAB: PREVIEW */}
            <div className={`peg-tab-panel ${currentTab === 'preview' ? 'active' : ''}`}>
              <div className="peg-sec-hdr">
                <div>
                  <div className="peg-sec-title">Document Preview</div>
                  <div className="peg-sec-sub">Review before printing or sharing with the patient</div>
                </div>
                <div className="peg-sec-sp" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="peg-btn" onClick={generateDocument} disabled={generating}>↺ Regenerate</button>
                  <button className="peg-btn success" onClick={printDoc}>🖨 Print</button>
                </div>
              </div>
              {!documentGenerated ? (
                <div className="peg-empty-state">
                  <div className="peg-empty-ico">📄</div>
                  <div className="peg-empty-ttl">No document generated yet</div>
                  <div className="peg-empty-sub">Configure patient settings and content, then click Generate.</div>
                  <button className="peg-btn primary" onClick={() => switchTab('content')}>← Go to Content</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div className="peg-doc-toolbar">
                    <span className="peg-doc-toolbar-title">📄 Patient Education Document</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', marginLeft: 8 }}>{docMetaLabel}</span>
                    <div className="peg-doc-sp" />
                    <button className="peg-btn" onClick={copyDocText} style={{ fontSize: 11 }}>📋 Copy Text</button>
                    <button className="peg-btn amber" onClick={() => switchTab('export')} style={{ fontSize: 11 }}>Export Options →</button>
                  </div>
                  <div className="peg-doc-preview-wrap">
                    <div dangerouslySetInnerHTML={{ __html: generatedDocHTML }} />
                  </div>
                </div>
              )}
            </div>

            {/* TAB: EXPORT */}
            <div className={`peg-tab-panel ${currentTab === 'export' ? 'active' : ''}`}>
              <div className="peg-sec-hdr">
                <div>
                  <div className="peg-sec-title">Print & Export</div>
                  <div className="peg-sec-sub">Share the education document with your patient</div>
                </div>
              </div>
              {!documentGenerated ? (
                <div className="peg-empty-state">
                  <div className="peg-empty-ico">📤</div>
                  <div className="peg-empty-ttl">Generate a document first</div>
                  <div className="peg-empty-sub">Go to Content & Note, configure the document, then generate it.</div>
                  <button className="peg-btn primary" onClick={() => switchTab('content')}>← Go to Content</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="peg-tip" style={{ background: 'rgba(0,229,160,.06)', borderColor: 'rgba(0,229,160,.25)' }}>
                    <span className="peg-tip-ico">✅</span>
                    <span>Document generated successfully — ready to share with <strong style={{ color: 'var(--green)' }}>{expInfo.ptName}</strong>.</span>
                  </div>
                  <div className="peg-form-grid">
                    {[
                      { icon: '🖨️', title: 'Print Document', desc: 'Opens print dialog — formatted for letter paper.', action: printDoc, btnClass: 'primary', btnLabel: 'Print Now' },
                      { icon: '⬇️', title: 'Download HTML', desc: 'Save as a standalone HTML file. Can be emailed or printed later.', action: downloadHTML, btnClass: 'amber', btnLabel: 'Download' },
                      { icon: '📋', title: 'Copy Plain Text', desc: 'Copies formatted plain text. Paste into Epic or any EHR.', action: copyDocText, btnClass: '', btnLabel: 'Copy to Clipboard' },
                      { icon: '🌐', title: 'Patient Portal', desc: 'Send directly to patient portal inbox (requires EHR integration).', action: null, btnClass: '', btnLabel: 'Send (EHR Required)', disabled: true },
                    ].map(({ icon, title, desc, action, btnClass, btnLabel, disabled }) => (
                      <div key={title} className="peg-card" style={{ cursor: action ? 'pointer' : 'default' }} onClick={action || undefined}>
                        <div className="peg-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28 }}>
                          <div style={{ fontSize: 40 }}>{icon}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>{desc}</div>
                          <button className={`peg-btn ${btnClass}`} style={{ width: '100%', opacity: disabled ? 0.5 : 1 }} disabled={disabled} onClick={e => { e.stopPropagation(); if (action) action(); }}>{btnLabel}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="peg-card">
                    <div className="peg-card-hdr"><span className="peg-card-title">Document Summary</span></div>
                    <div className="peg-card-body">
                      <div className="peg-form-grid-3">
                        {[['Patient', expInfo.ptName], ['Reading Level', expInfo.level], ['Language', expInfo.lang], ['Sections', expInfo.sections], ['Condition', expInfo.condition], ['Generated', expInfo.time]].map(([label, val]) => (
                          <div key={label}>
                            <div className="peg-form-label" style={{ marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: label === 'Sections' ? 'var(--mono)' : undefined }}>{val || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* AI Panel */}
          <aside className="peg-ai-panel">
            <div className="peg-ai-hdr">
              <div className="peg-ai-dot" />
              <span className="peg-ai-hdr-title">AI EDUCATION ASSISTANT</span>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>claude-sonnet</div>
            </div>
            <div className="peg-ai-body">
              {aiPanel.type === 'empty' && (
                <div className="peg-ai-empty">
                  <div style={{ fontSize: 36, opacity: 0.35 }}>📚</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.7 }}>
                    Configure patient settings and generate a document to see AI analysis here.
                  </div>
                </div>
              )}
              {aiPanel.type === 'thinking' && (
                <>
                  <div className="peg-ai-think">
                    <div className="peg-dots"><span /><span /><span /></div>
                    <span>Crafting {selectedLevel}-grade {ptLang} document…</span>
                  </div>
                  <div className="peg-ai-msg">
                    <div className="peg-ai-sec-lbl">Progress</div>
                    <div className="peg-ai-progress-bar"><div className="peg-ai-progress-fill" style={{ width: aiProgress + '%' }} /></div>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{aiProgressLabel}</span>
                  </div>
                </>
              )}
              {aiPanel.type === 'result' && aiPanel.parsed && (
                <>
                  <div className="peg-ai-msg">
                    <div className="peg-ai-sec-lbl">Document Stats</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['READING LEVEL', aiPanel.parsed.readability_score || selectedLevel, 'var(--accent)'], ['WORD COUNT', (aiPanel.parsed.word_count || 0).toLocaleString(), 'var(--green)'], ['LANGUAGE', aiPanel.lang, 'var(--text)'], ['SECTIONS', aiPanel.sectionCount, 'var(--amber)']].map(([lbl, val, color]) => (
                        <div key={lbl} style={{ background: 'var(--bg4)', borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{lbl}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(aiPanel.parsed.key_messages || []).length > 0 && (
                    <div className="peg-ai-msg">
                      <div className="peg-ai-sec-lbl">Key Patient Messages</div>
                      {aiPanel.parsed.key_messages.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 11 }}>
                          <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                          <span style={{ color: 'var(--text2)' }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiPanel.parsed.ai_notes && (
                    <div className="peg-ai-msg">
                      <div className="peg-ai-sec-lbl">Clinician Notes</div>
                      <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65 }}>{aiPanel.parsed.ai_notes}</span>
                    </div>
                  )}
                </>
              )}
              {aiPanel.type === 'error' && (
                <div className="peg-ai-msg">
                  <b style={{ color: 'var(--red)' }}>Generation Error</b><br />
                  <span style={{ fontSize: 12 }}>{aiPanel.msg}</span>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Bottom Nav */}
        <div className="peg-bottom-nav">
          <div className="peg-btabs-row">
            {[['setup', '👤 Setup'], ['content', '📋 Content'], ['preview', '📄 Preview'], ['export', '📤 Export']].map(([tab, label]) => (
              <button key={tab} className={`peg-btab ${currentTab === tab ? 'active' : ''}`} onClick={() => switchTab(tab)}>
                {label} <span className="tc">{tab === 'preview' ? previewBadge : tab === 'export' ? exportBadge : '—'}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <span className="peg-step-info">Step {navIdx + 1} of 4</span>
          </div>
          <div className="peg-brow2">
            <button className="peg-btn" onClick={() => navIdx > 0 && switchTab(TABS[navIdx - 1])} disabled={navIdx === 0}>← Back</button>
            <div className="peg-bsp" />
            <button className="peg-btn primary" onClick={() => navIdx < TABS.length - 1 && switchTab(TABS[navIdx + 1])} disabled={navIdx === TABS.length - 1}>Next →</button>
          </div>
        </div>

        <div className={`peg-toast ${showToast ? 'show' : ''}`}>Copied to clipboard!</div>
      </div>
    </>
  );
}