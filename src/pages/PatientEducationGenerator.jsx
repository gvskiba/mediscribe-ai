import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const TABS = ['setup', 'content', 'preview', 'export'];

const LEVEL_DESCS = {
  '3rd':    '<strong style="color:#8aacc6">3rd Grade:</strong> Only use words a 3rd grader knows. Very short sentences. No medical jargon at all.',
  '5th':    '<strong style="color:#8aacc6">5th Grade:</strong> Simple common words. Avoids most jargon. Short sentences. Good for patients with limited health literacy.',
  '8th':    '<strong style="color:#8aacc6">8th Grade:</strong> Standard health literacy. Uses common medical terms with brief explanations. Recommended for most adult patients.',
  'HS':     '<strong style="color:#8aacc6">High School:</strong> Includes medical terminology with context. More detail. Good for engaged patients.',
  'College':'<strong style="color:#8aacc6">College Level:</strong> Full clinical language. Minimal simplification. Suited for patients with medical/science backgrounds.',
};

const SECTIONS_CONFIG = [
  { id:'diagnosis',   icon:'🔍', name:'Your Diagnosis',     desc:'Plain-language explanation of the condition', on:true  },
  { id:'medications', icon:'💊', name:'Your Medications',    desc:'What to take, when, and why',                on:true  },
  { id:'activity',    icon:'🏃', name:'Activity & Rest',     desc:'What you can and cannot do',                 on:true  },
  { id:'diet',        icon:'🥗', name:'Diet & Nutrition',    desc:'Foods to eat, avoid, or limit',              on:true  },
  { id:'followup',    icon:'📅', name:'Follow-Up Care',      desc:'Appointments, labs, who to call',            on:true  },
  { id:'warning',     icon:'⚠️', name:'Warning Signs',       desc:'Symptoms that need urgent attention',        on:true  },
  { id:'emergency',   icon:'🚨', name:'When to Call 911',    desc:'Life-threatening emergency signs',           on:true  },
  { id:'resources',   icon:'📚', name:'Resources & Support', desc:'Websites, support groups, phone numbers',    on:false },
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

3. TYPE 2 DIABETES MELLITUS — A1c 8.4%
   - Continue metformin 1000mg BID with meals
   - Refer to diabetes education program
   - Target fasting glucose 80-130 mg/dL

4. HYPERLIPIDEMIA
   - Continue atorvastatin 20mg at bedtime

MEDICATIONS PRESCRIBED/CHANGED:
- Aspirin 81mg — 1 tablet daily (NEW)
- Lisinopril 20mg — 1 tablet daily (INCREASED from 10mg)
- Metformin 1000mg — 1 tablet twice daily with meals (unchanged)
- Atorvastatin 20mg — 1 tablet at bedtime (unchanged)

FOLLOW-UP:
- Cardiology (Dr. Chen): within 1 week — URGENT
- Primary care: 2 weeks for BP recheck

EMERGENCY INSTRUCTIONS:
- Call 911 IMMEDIATELY if: chest pain worsens, pain spreads to arm/jaw, severe shortness of breath, loss of consciousness, or sweating with chest pain`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
  :root {
    --bg:#050f1e; --bg2:#0a1929; --bg3:#0d2035; --bg4:#102840; --bg5:#152f4a;
    --border:#1a3550; --border2:#1e4060; --border3:#254d75;
    --text:#e4eef8; --text2:#8aacc6; --text3:#4a7a9b;
    --accent:#00c6ff; --accent2:#0096d6; --accent3:#006fa0;
    --green:#00e5a0; --green2:#00b880; --amber:#f5a623; --amber2:#c07d10;
    --red:#ff4757; --purple:#a78bfa; --teal:#2dd4bf;
    --mono:'JetBrains Mono',monospace; --serif:'Playfair Display',Georgia,serif;
    --sans:'Outfit',sans-serif; --doc-serif:'Lora',Georgia,serif;
  }
  .peg-root { background:var(--bg); color:var(--text); font-family:var(--sans); font-size:14px; height:100vh; overflow:hidden; display:flex; flex-direction:column; }
  .peg-navbar { height:50px; background:var(--bg2); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 16px; gap:12px; flex-shrink:0; }
  .peg-logo { font-family:var(--serif); font-size:20px; font-weight:700; background:linear-gradient(135deg,var(--accent),var(--green)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-.5px; }
  .peg-divider { width:1px; height:24px; background:var(--border2); }
  .peg-title { font-family:var(--serif); font-size:15px; color:var(--text2); font-weight:400; }
  .peg-pill { font-family:var(--mono); font-size:11px; padding:3px 10px; border-radius:20px; border:1px solid var(--border2); color:var(--text3); background:var(--bg3); }
  .peg-pill.live { border-color:var(--green); color:var(--green); }
  .peg-vitals { height:38px; background:var(--bg3); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 16px 0 calc(220px + 16px); gap:20px; font-family:var(--mono); font-size:11px; flex-shrink:0; }
  .peg-layout { display:grid; grid-template-columns:220px 1fr 295px; flex:1; overflow:hidden; }
  .peg-sidebar { background:var(--bg2); border-right:1px solid var(--border); overflow-y:auto; padding:12px 0; display:flex; flex-direction:column; gap:2px; }
  .peg-sidebar::-webkit-scrollbar { width:3px; } .peg-sidebar::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  .sb-sec { padding:6px 14px 4px; font-size:10px; font-weight:600; color:var(--text3); letter-spacing:.1em; text-transform:uppercase; }
  .sb-item { display:flex; align-items:center; gap:9px; padding:8px 14px; cursor:pointer; border-left:2px solid transparent; transition:.15s; color:var(--text2); font-size:13px; }
  .sb-item:hover { background:var(--bg3); color:var(--text); }
  .sb-item.on { background:var(--bg3); color:var(--accent); border-left-color:var(--accent); }
  .sb-badge { margin-left:auto; font-family:var(--mono); font-size:10px; padding:1px 6px; border-radius:10px; min-width:20px; text-align:center; }
  .sb-badge.n { background:var(--bg4); color:var(--text3); }
  .sb-badge.ok { background:rgba(0,229,160,.12); color:var(--green); }
  .sb-badge.warn { background:rgba(245,166,35,.15); color:var(--amber); }
  .peg-main { overflow-y:auto; background:var(--bg); }
  .peg-main::-webkit-scrollbar { width:5px; } .peg-main::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  .peg-ai { background:var(--bg2); border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
  .ai-hdr { padding:12px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .ai-dot { width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 6px var(--green); animation:pulse-g 2s infinite; }
  @keyframes pulse-g { 0%,100%{box-shadow:0 0 4px var(--green2);}50%{box-shadow:0 0 12px var(--green),0 0 20px rgba(0,229,160,.3);} }
  .ai-body-peg { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .ai-body-peg::-webkit-scrollbar { width:3px; } .ai-body-peg::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  .ai-msg { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:12px; color:var(--text2); line-height:1.65; }
  .ai-sec-lbl { font-size:10px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin:8px 0 4px; }
  .peg-bottom { height:76px; background:var(--bg2); border-top:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; }
  .btabs-row { display:flex; align-items:center; padding:0 16px; border-bottom:1px solid var(--border); height:38px; gap:2px; }
  .btab { padding:0 16px; height:38px; display:flex; align-items:center; gap:6px; cursor:pointer; border-bottom:2px solid transparent; color:var(--text3); font-size:12px; font-weight:500; background:transparent; border-top:none; border-left:none; border-right:none; transition:.15s; white-space:nowrap; font-family:var(--sans); }
  .btab:hover { color:var(--text2); }
  .btab.on { color:var(--accent); border-bottom-color:var(--accent); }
  .brow2 { display:flex; align-items:center; padding:0 16px; height:38px; gap:8px; }
  .nbtn { padding:5px 14px; border-radius:5px; font-size:12px; font-weight:500; cursor:pointer; transition:.15s; border:1px solid var(--border2); background:transparent; color:var(--text2); font-family:var(--sans); }
  .nbtn:hover { background:var(--bg3); color:var(--text); }
  .nbtn.primary { background:var(--accent2); color:#fff; border-color:var(--accent2); }
  .nbtn.primary:hover { background:var(--accent); border-color:var(--accent); }
  .nbtn.success { background:rgba(0,229,160,.12); color:var(--green); border-color:var(--green2); }
  .nbtn.success:hover { background:rgba(0,229,160,.2); }
  .nbtn.amber { background:rgba(245,166,35,.12); color:var(--amber); border-color:var(--amber2); }
  .nbtn:disabled { opacity:.4; pointer-events:none; }
  .panel { display:none; flex:1; flex-direction:column; padding:20px; gap:16px; overflow-y:auto; }
  .panel.on { display:flex; }
  .panel::-webkit-scrollbar { width:5px; } .panel::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
  .sec-title { font-family:var(--serif); font-size:22px; font-weight:600; color:var(--text); }
  .sec-sub { font-size:12px; color:var(--text3); margin-top:4px; }
  .card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .card-hdr { padding:10px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; background:var(--bg3); }
  .card-title { font-size:11px; font-weight:600; color:var(--text); letter-spacing:.06em; text-transform:uppercase; }
  .card-body { padding:16px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .form-group { display:flex; flex-direction:column; gap:5px; }
  .form-label { font-size:11px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; }
  .form-input,.form-select,.form-textarea { background:var(--bg3); border:1px solid var(--border2); border-radius:6px; color:var(--text); font-family:var(--sans); font-size:13px; padding:8px 10px; outline:none; transition:.2s; width:100%; }
  .form-input:focus,.form-select:focus,.form-textarea:focus { border-color:var(--accent2); box-shadow:0 0 0 2px rgba(0,150,214,.12); }
  .form-select option { background:var(--bg2); }
  .form-textarea { resize:vertical; min-height:130px; line-height:1.65; }
  .level-rail { display:grid; grid-template-columns:repeat(5,1fr); background:var(--bg3); border:1px solid var(--border2); border-radius:8px; overflow:hidden; }
  .level-opt { padding:8px 4px; text-align:center; cursor:pointer; transition:.15s; border-right:1px solid var(--border2); font-size:11px; color:var(--text3); font-weight:500; }
  .level-opt:last-child { border-right:none; }
  .level-opt:hover { background:var(--bg4); color:var(--text2); }
  .level-opt.on { background:rgba(0,198,255,.15); color:var(--accent); font-weight:600; }
  .level-opt .grade { font-family:var(--mono); font-size:14px; font-weight:600; display:block; margin-bottom:2px; }
  .tip-bar { background:rgba(0,198,255,.06); border:1px solid rgba(0,198,255,.2); border-radius:8px; padding:10px 14px; font-size:12px; color:var(--text2); display:flex; align-items:flex-start; gap:8px; line-height:1.6; }
  .sec-toggle-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .sec-toggle { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border2); border-radius:8px; cursor:pointer; transition:.15s; background:transparent; }
  .sec-toggle:hover { border-color:var(--border3); background:var(--bg3); }
  .sec-toggle.on { border-color:var(--accent2); background:rgba(0,198,255,.06); }
  .sec-toggle-ico { font-size:18px; }
  .sec-toggle-name { font-size:13px; font-weight:500; color:var(--text); }
  .sec-toggle-desc { font-size:11px; color:var(--text3); margin-top:2px; }
  .toggle-sw { width:32px; height:18px; border-radius:9px; background:var(--border2); position:relative; flex-shrink:0; transition:.2s; }
  .toggle-sw.on { background:var(--accent2); }
  .toggle-sw::after { content:''; position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:.2s; }
  .toggle-sw.on::after { left:16px; }
  .gen-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:600; background:linear-gradient(135deg,var(--accent2),var(--green2)); color:#fff; border:none; cursor:pointer; font-family:var(--sans); transition:.2s; }
  .gen-btn:hover { transform:translateY(-1px); box-shadow:0 4px 20px rgba(0,198,255,.25); }
  .gen-btn:disabled { opacity:.5; pointer-events:none; transform:none; }
  .spin { width:16px; height:16px; border-radius:50%; border:2px solid var(--border2); border-top-color:var(--accent); animation:spin .8s linear infinite; flex-shrink:0; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:48px; text-align:center; color:var(--text3); border:1px dashed var(--border); border-radius:10px; }
  .doc-toolbar { display:flex; align-items:center; gap:8px; padding:10px 16px; background:var(--bg3); border:1px solid var(--border); border-radius:10px 10px 0 0; border-bottom:none; }
  .doc-preview-wrap { background:var(--bg2); border:1px solid var(--border); border-radius:0 0 10px 10px; overflow:auto; max-height:100%; }
  .copy-toast { position:fixed; bottom:90px; right:20px; background:var(--green2); color:#fff; padding:8px 16px; border-radius:6px; font-size:12px; font-weight:600; opacity:0; transform:translateY(10px); transition:.3s; pointer-events:none; z-index:200; }
  .copy-toast.show { opacity:1; transform:none; }
  .abn { color:var(--red); }
  .dots span { display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--accent); margin:0 2px; animation:blink 1.2s infinite; }
  .dots span:nth-child(2){animation-delay:.2s;} .dots span:nth-child(3){animation-delay:.4s;}
  @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
  .ai-progress-bar { height:3px; background:var(--border); border-radius:2px; overflow:hidden; margin:8px 0; }
  .ai-progress-fill { height:100%; background:linear-gradient(90deg,var(--accent2),var(--green)); border-radius:2px; transition:width .4s ease; }
`;

const DOC_CSS = `
  .patient-doc { background:#fff; color:#1a1a1a; max-width:720px; margin:20px auto; border-radius:6px; font-family:'Lora',Georgia,serif; line-height:1.7; box-shadow:0 2px 20px rgba(0,0,0,.3); overflow:hidden; }
  .pdoc-header { background:linear-gradient(135deg,#0a3d62,#1e6f9f); color:#fff; padding:28px 36px 24px; }
  .pdoc-logo { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; opacity:.7; }
  .pdoc-patient-name { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; margin:8px 0 4px; }
  .pdoc-meta { font-size:13px; opacity:.8; font-family:'Outfit',sans-serif; }
  .pdoc-meta span { margin-right:18px; }
  .pdoc-body { padding:28px 36px; }
  .pdoc-section { margin-bottom:28px; }
  .pdoc-section-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:#0a3d62; border-bottom:2px solid #1e6f9f; padding-bottom:6px; margin-bottom:14px; display:flex; align-items:center; gap:10px; }
  .pdoc-p { font-size:14px; color:#2c2c2c; margin-bottom:10px; line-height:1.75; }
  .pdoc-ul { padding-left:20px; margin-bottom:10px; }
  .pdoc-ul li { font-size:14px; color:#2c2c2c; margin-bottom:6px; }
  .pdoc-warning-box { background:#fff8e7; border:2px solid #f5a623; border-radius:8px; padding:14px 16px; margin:10px 0; }
  .pdoc-warning-title { font-weight:700; color:#b86c00; margin-bottom:8px; font-family:'Outfit',sans-serif; font-size:13px; text-transform:uppercase; }
  .pdoc-emergency-box { background:#fff0f0; border:2px solid #e53e3e; border-radius:8px; padding:14px 16px; margin:10px 0; }
  .pdoc-emergency-title { font-weight:700; color:#c53030; margin-bottom:8px; font-family:'Outfit',sans-serif; font-size:13px; text-transform:uppercase; }
  .pdoc-footer { background:#f7fafc; border-top:1px solid #e2e8f0; padding:18px 36px; font-size:12px; color:#718096; font-family:'Outfit',sans-serif; display:flex; justify-content:space-between; align-items:center; }
  .pdoc-footer-logo { font-family:'Playfair Display',serif; font-size:14px; color:#4a5568; font-weight:700; }
  .pdoc-table { width:100%; border-collapse:collapse; margin:10px 0; }
  .pdoc-table th { text-align:left; font-size:12px; font-weight:700; color:#4a5568; padding:6px 8px; background:#f7fafc; border:1px solid #e2e8f0; font-family:'Outfit',sans-serif; }
  .pdoc-table td { font-size:13px; color:#2d3748; padding:8px; border:1px solid #e2e8f0; }
  .pdoc-table tr:nth-child(even) td { background:#f7fafc; }
`;

export default function PatientEducationGenerator() {
  const [tab, setTab] = useState('setup');
  const [selectedLevel, setSelectedLevel] = useState('8th');
  const [sections, setSections] = useState(SECTIONS_CONFIG.map(s => ({ ...s })));
  const [clinicalNote, setClinicalNote] = useState('');
  const [ptName, setPtName] = useState('James A. Hartwell');
  const [ptDob, setPtDob] = useState('1958-07-14');
  const [ptSex, setPtSex] = useState('male');
  const [ptPref, setPtPref] = useState('Mr. Hartwell');
  const [lang, setLang] = useState('English');
  const [tone, setTone] = useState('clear and direct');
  const [format, setFormat] = useState('bullet points with brief explanations');
  const [special, setSpecial] = useState('');
  const [condition, setCondition] = useState('Unstable Angina & Hypertension');
  const [followupProvider, setFollowupProvider] = useState('Dr. Chen, Cardiology');
  const [followupDate, setFollowupDate] = useState('Within 1 week');
  const [providerName, setProviderName] = useState('Dr. Sarah Reyes, MD');
  const [loading, setLoading] = useState(false);
  const [docHTML, setDocHTML] = useState('');
  const [docText, setDocText] = useState('');
  const [docGenerated, setDocGenerated] = useState(false);
  const [aiState, setAiState] = useState('empty'); // empty | thinking | result | error
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState('');
  const [toast, setToast] = useState(false);
  const [exportInfo, setExportInfo] = useState({});
  const progTimerRef = useRef(null);

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  const toggleSection = (id) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, on: !s.on } : s));
  };

  const generateDocument = async () => {
    if (!clinicalNote.trim()) {
      alert('Please paste a clinical note in the Content & Note tab first.');
      setTab('content');
      return;
    }
    setLoading(true);
    setAiState('thinking');
    setAiProgress(0);

    const steps = ['Analyzing clinical note…', 'Adapting vocabulary to reading level…', 'Translating content…', 'Formatting sections…', 'Finalizing document…'];
    let step = 0;
    progTimerRef.current = setInterval(() => {
      if (step >= steps.length) { clearInterval(progTimerRef.current); return; }
      setAiProgress(((step + 1) / steps.length) * 90);
      setAiProgressLabel(steps[step]);
      step++;
    }, 600);

    const enabledSections = sections.filter(s => s.on);
    const sectionList = enabledSections.map(s => s.id).join(', ');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const levelInstructions = {
      '3rd': 'Only use words a 3rd grader knows. Very short sentences. No medical jargon at all.',
      '5th': 'Simple common words. Avoid jargon. Short sentences.',
      '8th': 'Plain language with brief explanations of medical terms.',
      'HS': 'Includes medical terms with context. More detailed.',
      'College': 'Full medical vocabulary. Detailed explanations for educated audience.',
    }[selectedLevel];

    const prompt = `You are a clinical health educator specializing in patient-centered discharge instructions.

Create a comprehensive, personalized patient education document based on the clinical note below.

PATIENT: ${ptPref}
READING LEVEL: ${selectedLevel} grade level — strictly calibrate ALL vocabulary and sentence complexity to this level
LANGUAGE: Write the ENTIRE document in ${lang}
TONE: ${tone}
FORMAT: Use ${format}
SECTIONS TO INCLUDE: ${sectionList}
CONDITION/TITLE: ${condition}
FOLLOW-UP PROVIDER: ${followupProvider}
FOLLOW-UP DATE: ${followupDate}
SIGNING PROVIDER: ${providerName}
${special ? 'SPECIAL INSTRUCTIONS: ' + special : ''}

CLINICAL NOTE:
${clinicalNote}

Return ONLY a valid JSON object — no markdown fences, no text before or after. Use this exact structure:

{
  "title": "Document title (patient-friendly)",
  "date": "${today}",
  "sections": [
    {
      "id": "diagnosis",
      "heading": "Section heading in ${lang}",
      "icon": "emoji",
      "type": "text|bullets|table|warning|emergency",
      "content": "Main content as HTML — use <p class='pdoc-p'>, <ul class='pdoc-ul'><li>, <strong>. For medication tables use <table class='pdoc-table'><tr><th>/<td>. Keep ${lang} throughout."
    }
  ],
  "readability_score": "Flesch-Kincaid grade estimate",
  "word_count": 0,
  "key_messages": ["3 most important takeaways in ${lang}"],
  "provider_note": "Short warm closing note from provider in ${lang}",
  "ai_notes": "Brief English clinician note about terminology adaptations (always in English)"
}

CRITICAL RULES:
- ALL patient-facing text MUST be in ${lang}
- ai_notes is ALWAYS in English
- Reading level ${selectedLevel}: ${levelInstructions}
- Warning sections use type "warning", Emergency sections use type "emergency"
- Make content specific to THIS patient's clinical note — not generic
- word_count = approximate word count of all section content`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
      clearInterval(progTimerRef.current);
      setAiProgress(100);

      let parsed;
      try {
        const clean = (typeof result === 'string' ? result : JSON.stringify(result)).replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        throw new Error('Could not parse AI response. Please try again.');
      }

      const html = buildDocHTML(parsed);
      setDocHTML(html);
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      setDocText(tmp.innerText);
      setDocGenerated(true);
      setAiState('result');
      setAiData(parsed);

      const info = {
        ptName, level: selectedLevel + ' Grade', lang,
        sections: enabledSections.length, condition,
        time: new Date().toLocaleTimeString(),
      };
      setExportInfo(info);
      setTab('preview');
    } catch (err) {
      clearInterval(progTimerRef.current);
      setAiState('error');
      setAiError(err.message);
    }
    setLoading(false);
  };

  const buildDocHTML = (parsed) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const ptAge = ptDob ? Math.floor((Date.now() - new Date(ptDob)) / (365.25 * 24 * 3600 * 1000)) : '';

    let sectionsHTML = '';
    for (const sec of (parsed.sections || [])) {
      let innerHTML = '';
      if (sec.type === 'warning') {
        innerHTML = `<div class="pdoc-warning-box"><div class="pdoc-warning-title">⚠️ Warning Signs</div>${sec.content}</div>`;
      } else if (sec.type === 'emergency') {
        innerHTML = `<div class="pdoc-emergency-box"><div class="pdoc-emergency-title">🚨 Call 911 Immediately</div>${sec.content}</div>`;
      } else {
        innerHTML = sec.content || '';
      }
      sectionsHTML += `<div class="pdoc-section"><div class="pdoc-section-title"><span>${sec.icon || '📌'}</span>${sec.heading}</div>${innerHTML}</div>`;
    }

    const keyMsgs = (parsed.key_messages || []).map(m => `<li>${m}</li>`).join('');

    return `<div class="patient-doc">
      <div class="pdoc-header">
        <div class="pdoc-logo">Notrya Clinical</div>
        <div class="pdoc-patient-name">${ptPref}</div>
        <div class="pdoc-meta">
          <span>📅 ${parsed.date || today}</span>
          <span>🏥 ${condition}</span>
          ${ptAge ? `<span>👤 Age ${ptAge}</span>` : ''}
          ${lang !== 'English' ? `<span>🌐 ${lang}</span>` : ''}
        </div>
      </div>
      <div class="pdoc-body">
        ${keyMsgs ? `<div class="pdoc-section"><div class="pdoc-section-title"><span>⭐</span>Key Takeaways</div><ul class="pdoc-ul">${keyMsgs}</ul></div>` : ''}
        ${sectionsHTML}
        ${parsed.provider_note ? `<div class="pdoc-section"><div class="pdoc-section-title"><span>✍️</span>A Note from Your Care Team</div><p class="pdoc-p" style="font-style:italic;">${parsed.provider_note}</p></div>` : ''}
      </div>
      <div class="pdoc-footer">
        <div><div class="pdoc-footer-logo">Notrya</div><div>Generated by: ${providerName || 'Your Care Team'} &nbsp;|&nbsp; ${today}</div></div>
        <div style="text-align:right;"><div><strong>Questions?</strong></div><div>${followupProvider ? 'Contact: ' + followupProvider : ''}</div>${followupDate ? '<div>Follow-up: ' + followupDate + '</div>' : ''}</div>
      </div>
    </div>`;
  };

  const printDoc = () => window.print();

  const downloadHTML = () => {
    if (!docHTML) return;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Patient Education</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Outfit:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>body{margin:0;padding:20px;background:#f0f4f8;}${DOC_CSS}</style>
</head><body>${docHTML}</body></html>`;
    const blob = new Blob([full], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `patient-education-${Date.now()}.html`;
    a.click();
  };

  const copyDocText = () => {
    if (!docText) return;
    navigator.clipboard.writeText(docText).then(showToast);
  };

  useEffect(() => () => clearInterval(progTimerRef.current), []);

  return (
    <div className="peg-root">
      <style>{CSS + DOC_CSS}</style>

      {/* Navbar */}
      <nav className="peg-navbar">
        <span className="peg-logo">Notrya</span>
        <div className="peg-divider" />
        <span className="peg-title">Patient Education Generator</span>
        <div style={{ flex: 1 }} />
        <span className="peg-pill">Encounter: {new Date().toISOString().slice(0, 10)}</span>
        <span className="peg-pill live">● AI Ready</span>
      </nav>

      {/* Vitals Bar */}
      <div className="peg-vitals">
        <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--text)', marginRight: 8 }}>Hartwell, James A.</span>
        <span style={{ color: 'var(--border2)' }}>|</span>
        <span style={{ color: 'var(--text3)' }}>MRN</span><span>47-291-004</span>
        <span style={{ color: 'var(--text3)' }}>DOB</span><span>1958-07-14</span>
        <span style={{ color: 'var(--text3)' }}>Payer</span><span>Medicare Part B</span>
        <span style={{ color: 'var(--text3)' }}>BP</span><span className="abn">158/96</span>
        <span style={{ color: 'var(--text3)' }}>HR</span><span>88</span>
        <span style={{ color: 'var(--text3)' }}>SpO₂</span><span>96%</span>
      </div>

      {/* Layout */}
      <div className="peg-layout">

        {/* Sidebar */}
        <aside className="peg-sidebar">
          <div className="sb-sec">Education</div>
          {[
            { id: 'setup',   icon: '👤', label: 'Patient Setup',    badge: '—',  bc: 'n' },
            { id: 'content', icon: '📋', label: 'Content & Note',   badge: '—',  bc: 'n' },
            { id: 'preview', icon: '📄', label: 'Document Preview', badge: docGenerated ? '✓' : '—', bc: docGenerated ? 'ok' : 'n' },
            { id: 'export',  icon: '📤', label: 'Print / Export',   badge: docGenerated ? '✓' : '—', bc: docGenerated ? 'ok' : 'n' },
          ].map(s => (
            <div key={s.id} className={`sb-item${tab === s.id ? ' on' : ''}`} onClick={() => setTab(s.id)}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}
              <span className={`sb-badge ${s.bc}`}>{s.badge}</span>
            </div>
          ))}
          <div className="sb-sec" style={{ marginTop: 12 }}>Patient</div>
          {[['💊','Medications','7','n'],['⚠️','Allergies','2','warn'],['📁','Past Encounters','14','n']].map(([icon,label,badge,bc]) => (
            <div key={label} className="sb-item"><span style={{fontSize:14}}>{icon}</span>{label}<span className={`sb-badge ${bc}`}>{badge}</span></div>
          ))}
          <div className="sb-sec" style={{ marginTop: 12 }}>Tools</div>
          {[['🏥','ICD-10 / CPT Coder'],['🧬','DDx Engine'],['📝','Clinical Note'],['🤝','SBAR Handoff']].map(([icon,label]) => (
            <div key={label} className="sb-item"><span style={{fontSize:14}}>{icon}</span>{label}</div>
          ))}
        </aside>

        {/* Main */}
        <main className="peg-main">

          {/* Setup Panel */}
          <div className={`panel${tab === 'setup' ? ' on' : ''}`}>
            <div><div className="sec-title">Patient Setup</div><div className="sec-sub">Configure personalization — language, reading level, demographics</div></div>
            <div className="tip-bar">
              <span style={{ fontSize: 14 }}>🌟</span>
              <span>The AI tailors vocabulary, sentence length, examples, and tone to match the patient's reading level and language. A 3rd-grade level uses everyday words; 8th-grade uses standard medical terminology with explanations.</span>
            </div>
            <div className="card">
              <div className="card-hdr"><span className="card-title">Patient Information</span></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Patient Name</label><input className="form-input" value={ptName} onChange={e => setPtName(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={ptDob} onChange={e => setPtDob(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Sex</label>
                    <select className="form-select" value={ptSex} onChange={e => setPtSex(e.target.value)}>
                      <option value="male">Male</option><option value="female">Female</option><option value="nonbinary">Non-binary</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Preferred Name / Salutation</label><input className="form-input" value={ptPref} onChange={e => setPtPref(e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-hdr"><span className="card-title">Reading Level</span></div>
              <div className="card-body">
                <div className="level-rail">
                  {['3rd','5th','8th','HS','College'].map(lvl => (
                    <div key={lvl} className={`level-opt${selectedLevel === lvl ? ' on' : ''}`} onClick={() => setSelectedLevel(lvl)}>
                      <span className="grade">{lvl === 'HS' ? 'HS' : lvl === 'College' ? 'Col' : lvl}</span>
                      {lvl === 'HS' ? 'High School' : lvl === 'College' ? 'College' : 'Grade'}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }} dangerouslySetInnerHTML={{ __html: LEVEL_DESCS[selectedLevel] }} />
              </div>
            </div>
            <div className="card">
              <div className="card-hdr"><span className="card-title">Language & Tone</span></div>
              <div className="card-body">
                <div className="form-grid-3" style={{ marginBottom: 14 }}>
                  <div className="form-group"><label className="form-label">Output Language</label>
                    <select className="form-select" value={lang} onChange={e => setLang(e.target.value)}>
                      <option>English</option><option value="Spanish">Spanish (Español)</option>
                      <option value="Mandarin Chinese">Mandarin (中文)</option><option value="French">French (Français)</option>
                      <option value="Arabic">Arabic (العربية)</option><option value="Portuguese">Portuguese (Português)</option>
                      <option value="Hindi">Hindi (हिन्दी)</option><option>Tagalog</option>
                      <option value="Vietnamese">Vietnamese (Tiếng Việt)</option><option value="Russian">Russian (Русский)</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Tone</label>
                    <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                      <option value="warm and encouraging">Warm & Encouraging</option>
                      <option value="clear and direct">Clear & Direct</option>
                      <option value="clinical and precise">Clinical & Precise</option>
                      <option value="friendly and conversational">Friendly & Conversational</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Format</label>
                    <select className="form-select" value={format} onChange={e => setFormat(e.target.value)}>
                      <option value="bullet points with brief explanations">Bullets + Explanations</option>
                      <option value="paragraph narrative">Paragraph Narrative</option>
                      <option value="numbered steps">Numbered Steps</option>
                      <option value="mixed bullets and short paragraphs">Mixed Format</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Special Instructions (optional)</label>
                  <textarea className="form-textarea" rows={2} style={{ minHeight: 64 }} placeholder="e.g. Patient lives alone. Patient is a retired nurse who prefers detailed explanations." value={special} onChange={e => setSpecial(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Content Panel */}
          <div className={`panel${tab === 'content' ? ' on' : ''}`}>
            <div><div className="sec-title">Content & Clinical Note</div><div className="sec-sub">Select sections to include and paste the clinical note for AI context</div></div>
            <div className="card">
              <div className="card-hdr"><span className="card-title">Sections to Include</span></div>
              <div className="card-body">
                <div className="sec-toggle-grid">
                  {sections.map(s => (
                    <div key={s.id} className={`sec-toggle${s.on ? ' on' : ''}`} onClick={() => toggleSection(s.id)}>
                      <span className="sec-toggle-ico">{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="sec-toggle-name">{s.name}</div>
                        <div className="sec-toggle-desc">{s.desc}</div>
                      </div>
                      <div className={`toggle-sw${s.on ? ' on' : ''}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-hdr">
                <span className="card-title">Clinical Note / Diagnosis Context</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button className="nbtn" onClick={() => setClinicalNote(SAMPLE_NOTE)}>Load Sample</button>
                  <button className="nbtn" onClick={() => setClinicalNote('')}>Clear</button>
                </div>
              </div>
              <div className="card-body">
                <textarea className="form-textarea" rows={12} style={{ minHeight: 220 }}
                  placeholder="Paste the clinical note, discharge summary, or assessment/plan here…"
                  value={clinicalNote} onChange={e => setClinicalNote(e.target.value)} />
              </div>
            </div>
            <div className="card">
              <div className="card-hdr"><span className="card-title">Additional Patient Context</span></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Primary Condition (for document title)</label><input className="form-input" value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. Unstable Angina / Chest Pain" /></div>
                  <div className="form-group"><label className="form-label">Follow-up Provider</label><input className="form-input" value={followupProvider} onChange={e => setFollowupProvider(e.target.value)} placeholder="e.g. Dr. Chen, Cardiology" /></div>
                  <div className="form-group"><label className="form-label">Follow-up Date / Timeframe</label><input className="form-input" value={followupDate} onChange={e => setFollowupDate(e.target.value)} placeholder="e.g. Within 1 week" /></div>
                  <div className="form-group"><label className="form-label">Provider Name (signing)</label><input className="form-input" value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="e.g. Dr. Sarah Reyes, MD" /></div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button className="gen-btn" onClick={generateDocument} disabled={loading}>
                ✦ Generate Patient Education Document
              </button>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text3)' }}>
                  <div className="spin" /><span>AI is crafting your document…</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className={`panel${tab === 'preview' ? ' on' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div><div className="sec-title">Document Preview</div><div className="sec-sub">Review before printing or sharing with the patient</div></div>
              <div style={{ flex: 1 }} />
              <button className="nbtn" onClick={generateDocument} disabled={loading}>↺ Regenerate</button>
              <button className="nbtn success" onClick={printDoc}>🖨 Print</button>
            </div>
            {!docGenerated ? (
              <div className="empty-state">
                <div style={{ fontSize: 40, opacity: .3 }}>📄</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>No document generated yet</div>
                <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>Configure patient settings and content, then click Generate.</div>
                <button className="nbtn primary" onClick={() => setTab('content')}>← Go to Content</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="doc-toolbar">
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>📄 Patient Education Document</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', marginLeft: 8 }}>{lang} · {selectedLevel} Grade</span>
                  <div style={{ flex: 1 }} />
                  <button className="nbtn" onClick={copyDocText} style={{ fontSize: 11 }}>📋 Copy Text</button>
                  <button className="nbtn amber" onClick={() => setTab('export')} style={{ fontSize: 11 }}>Export Options →</button>
                </div>
                <div className="doc-preview-wrap">
                  <div dangerouslySetInnerHTML={{ __html: docHTML }} />
                </div>
              </div>
            )}
          </div>

          {/* Export Panel */}
          <div className={`panel${tab === 'export' ? ' on' : ''}`}>
            <div><div className="sec-title">Print & Export</div><div className="sec-sub">Share the education document with your patient</div></div>
            {!docGenerated ? (
              <div className="empty-state">
                <div style={{ fontSize: 40, opacity: .3 }}>📤</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Generate a document first</div>
                <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>Go to Content & Note, configure the document, then generate it.</div>
                <button className="nbtn primary" onClick={() => setTab('content')}>← Go to Content</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="tip-bar" style={{ background: 'rgba(0,229,160,.06)', borderColor: 'rgba(0,229,160,.25)' }}>
                  <span>✅</span>
                  <span>Document generated successfully — ready to share with <strong style={{ color: 'var(--green)' }}>{exportInfo.ptName}</strong>.</span>
                </div>
                <div className="form-grid">
                  {[
                    { icon: '🖨️', title: 'Print Document', desc: 'Opens print dialog — formatted for letter paper with patient-facing layout.', action: printDoc, btnLabel: 'Print Now', btnCls: 'primary' },
                    { icon: '⬇️', title: 'Download HTML', desc: 'Save as a standalone HTML file. Can be emailed to the patient or opened in any browser.', action: downloadHTML, btnLabel: 'Download', btnCls: 'amber' },
                    { icon: '📋', title: 'Copy Plain Text', desc: 'Copies formatted plain text to clipboard. Paste into Epic, patient portal, or any EHR.', action: copyDocText, btnLabel: 'Copy to Clipboard', btnCls: '' },
                    { icon: '🌐', title: 'Patient Portal', desc: 'Send directly to MyChart / patient portal inbox (requires EHR integration).', action: null, btnLabel: 'Send (EHR Required)', btnCls: '', disabled: true },
                  ].map(item => (
                    <div key={item.title} className="card" style={{ cursor: item.action ? 'pointer' : 'default' }} onClick={item.action || undefined}>
                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28 }}>
                        <div style={{ fontSize: 40 }}>{item.icon}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>{item.desc}</div>
                        <button className={`nbtn ${item.btnCls}`} style={{ width: '100%', opacity: item.disabled ? .5 : 1 }} disabled={item.disabled} onClick={e => { e.stopPropagation(); if (item.action) item.action(); }}>{item.btnLabel}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-hdr"><span className="card-title">Document Summary</span></div>
                  <div className="card-body">
                    <div className="form-grid-3">
                      {[['Patient', exportInfo.ptName], ['Reading Level', exportInfo.level], ['Language', exportInfo.lang], ['Sections', exportInfo.sections], ['Condition', exportInfo.condition], ['Generated', exportInfo.time]].map(([lbl, val]) => (
                        <div key={lbl}>
                          <div className="form-label" style={{ marginBottom: 4 }}>{lbl}</div>
                          <div style={{ fontSize: 14, color: 'var(--text)' }}>{val || '—'}</div>
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
        <aside className="peg-ai">
          <div className="ai-hdr">
            <div className="ai-dot" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '.04em' }}>AI EDUCATION ASSISTANT</span>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>claude-sonnet</div>
          </div>
          <div className="ai-body-peg">
            {aiState === 'empty' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 36, opacity: .35 }}>📚</div>
                <div style={{ fontSize: 12, lineHeight: 1.7 }}>Configure patient settings and generate a document to see AI analysis here.</div>
              </div>
            )}
            {aiState === 'thinking' && (
              <div className="ai-msg">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: 'var(--text3)' }}>
                  <div className="dots"><span /><span /><span /></div>
                  <span>Crafting {selectedLevel}-grade {lang} document…</span>
                </div>
                <div className="ai-sec-lbl">Progress</div>
                <div className="ai-progress-bar"><div className="ai-progress-fill" style={{ width: aiProgress + '%' }} /></div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{aiProgressLabel}</span>
              </div>
            )}
            {aiState === 'error' && (
              <div className="ai-msg" style={{ color: 'var(--red)' }}><strong>Generation Error</strong><br /><span style={{ fontSize: 12 }}>{aiError}</span></div>
            )}
            {aiState === 'result' && aiData && (
              <>
                <div className="ai-msg">
                  <div className="ai-sec-lbl">Document Stats</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['READING LEVEL', aiData.readability_score || selectedLevel, 'var(--accent)'],
                      ['WORD COUNT', (aiData.word_count || 0).toLocaleString(), 'var(--green)'],
                      ['LANGUAGE', lang, 'var(--text)'],
                      ['SECTIONS', sections.filter(s=>s.on).length, 'var(--amber)'],
                    ].map(([lbl, val, color]) => (
                      <div key={lbl} style={{ background: 'var(--bg4)', borderRadius: 6, padding: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{lbl}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(aiData.key_messages || []).length > 0 && (
                  <div className="ai-msg">
                    <div className="ai-sec-lbl">Key Patient Messages</div>
                    {(aiData.key_messages || []).map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 11 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                        <span style={{ color: 'var(--text2)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiData.ai_notes && (
                  <div className="ai-msg">
                    <div className="ai-sec-lbl">Clinician Notes</div>
                    <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65 }}>{aiData.ai_notes}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Nav */}
      <div className="peg-bottom">
        <div className="btabs-row">
          {[['setup','👤 Setup'],['content','📋 Content'],['preview','📄 Preview'],['export','📤 Export']].map(([id,label]) => (
            <button key={id} className={`btab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>Step {TABS.indexOf(tab) + 1} of 4</span>
        </div>
        <div className="brow2">
          <button className="nbtn" onClick={() => { const i = TABS.indexOf(tab); if (i > 0) setTab(TABS[i-1]); }} style={{ opacity: tab === 'setup' ? .4 : 1 }}>← Back</button>
          <div style={{ flex: 1 }} />
          <button className="nbtn primary" onClick={() => { const i = TABS.indexOf(tab); if (i < TABS.length-1) setTab(TABS[i+1]); }} style={{ opacity: tab === 'export' ? .4 : 1 }}>Next →</button>
        </div>
      </div>

      <div className={`copy-toast${toast ? ' show' : ''}`}>Copied to clipboard!</div>
    </div>
  );
}