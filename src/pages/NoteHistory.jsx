import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function NoteHistory() {
  const navigate = useNavigate();
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(2); // March = 2 (0-indexed)
  const [selectedDate, setSelectedDate] = useState('2026-03-20');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('time-desc');
  const [currentUser, setCurrentUser] = useState(null);

  const NOTES = [
    { id:'n001', date:'2026-03-20', time:'07:14', patient:'Eleanor Vance', age:67, mrn:'MRN-4421', type:'ED Note', status:'Signed', cc:'Acute chest pain with diaphoresis', summary:'67F presenting with substernal chest pain radiating to left arm, onset 2hr prior. EKG showed ST elevation in V2-V4. Troponin elevated. Activated cath lab. Patient transferred for primary PCI.' },
    { id:'n002', date:'2026-03-20', time:'08:52', patient:'Marcus Okafor', age:34, mrn:'MRN-3309', type:'SOAP', status:'Signed', cc:'Lacerations to right hand', summary:'34M with 3 lacerations to right dorsal hand after workplace injury. Wounds irrigated, foreign body excluded via imaging. Repaired with 4-0 nylon. Tetanus updated. Wound care instructions given.' },
    { id:'n003', date:'2026-03-20', time:'10:30', patient:'Diane Whitmore', age:52, mrn:'MRN-7761', type:'Procedure', status:'Signed', cc:'Abscess L forearm requiring I&D', summary:'Procedure note: Incision and drainage of 3cm fluctuant abscess left forearm. Elliptical excision, copious irrigation, wound packed with iodoform gauze. Patient tolerated well. F/U in 48hr.' },
    { id:'n004', date:'2026-03-20', time:'13:05', patient:'James Horton', age:78, mrn:'MRN-1145', type:'ED Note', status:'Pending', cc:'Altered mental status and fever', summary:'78M with nursing home transfer for AMS and fever 39.4°C. Suspected sepsis from UTI source. Pan-cultured, IV antibiotics started per sepsis protocol. Urine cloudy, UA positive for infection.' },
    { id:'n005', date:'2026-03-20', time:'14:22', patient:'Sofia Reyes', age:28, mrn:'MRN-9087', type:'SOAP', status:'Signed', cc:'Migraine with aura, unresponsive to home meds', summary:'28F with known migraine history, current episode day 2 with visual aura. IV ketorolac and Compazine administered with good effect. Oral hydration tolerated. Discharged with refill script.' },
    { id:'n006', date:'2026-03-20', time:'16:48', patient:'Thomas Nguyen', age:45, mrn:'MRN-6634', type:'Discharge', status:'Signed', cc:'Ankle fracture — discharge', summary:'45M with displaced lateral malleolus fracture. Ortho reviewed, conservative management elected. Air cast applied. NWB instructions, crutches provided. Follow-up with Ortho clinic in 5 days.' },
    { id:'n007', date:'2026-03-20', time:'18:10', patient:'Patricia Lund', age:61, mrn:'MRN-2288', type:'Addendum', status:'Draft', cc:'Addendum — chest pain workup', summary:'Addendum to note n001: Final troponin at 6hr returned 2.1 ng/mL (elevated). Repeat EKG unchanged. Cardiology accepted patient for admission. Full heparinization initiated per ACS protocol.' },
    { id:'n008', date:'2026-03-19', time:'08:20', patient:'Carl Brandt', age:55, mrn:'MRN-5512', type:'ED Note', status:'Signed', cc:'COPD exacerbation', summary:'55M with known COPD, presenting with worsening dyspnea and productive cough. SpO2 82% on room air. Nebulized albuterol and ipratropium initiated. Systemic steroids started. BiPAP trialled.' },
    { id:'n009', date:'2026-03-19', time:'11:35', patient:'Grace Kim', age:22, mrn:'MRN-8834', type:'SOAP', status:'Signed', cc:'Urinary tract infection', summary:'22F with dysuria and frequency x 3 days, no fever, no flank pain. UA positive for nitrites and leukocyte esterase. Treated with 5-day nitrofurantoin. Counselled on prevention strategies.' },
    { id:'n010', date:'2026-03-19', time:'15:00', patient:'Harold Simms', age:70, mrn:'MRN-3301', type:'Procedure', status:'Signed', cc:'Central line placement', summary:'Procedure note: Right internal jugular central venous catheter placed under ultrasound guidance. Triple lumen, 7Fr catheter placed without complication. Confirmed with CXR — no pneumothorax.' },
    { id:'n011', date:'2026-03-19', time:'17:45', patient:'Anita Patel', age:40, mrn:'MRN-4490', type:'Discharge', status:'Pending', cc:'Acute appendicitis — discharge instructions', summary:'40F with confirmed acute appendicitis. Surgery performed uncomplicated laparoscopic appendectomy. Day 1 post-op, tolerating liquids. Antibiotics completed. Discharged with oral pain meds.' },
    { id:'n012', date:'2026-03-18', time:'09:10', patient:'Oliver Grant', age:5, mrn:'MRN-7723', type:'ED Note', status:'Signed', cc:'Febrile seizure — first episode', summary:'5M with first febrile seizure, 2 min duration, self-terminating. T 39.8°C. No post-ictal deficit. LP deferred per ACEP criteria. Viral URI suspected. Family counselled on febrile seizure management.' },
    { id:'n013', date:'2026-03-18', time:'12:40', patient:'Helen Foster', age:82, mrn:'MRN-1190', type:'SOAP', status:'Signed', cc:'Fall with hip pain', summary:'82F post-fall, unable to bear weight on right hip. XR demonstrates displaced femoral neck fracture. Ortho urgently consulted. NPO, IV access, pain managed with low-dose morphine. Surgery planned.' },
    { id:'n014', date:'2026-03-18', time:'16:00', patient:'Ryan Steele', age:31, mrn:'MRN-6609', type:'SOAP', status:'Draft', cc:'Knee laceration from cycling injury', summary:'31M with 4cm irregular laceration to left knee following bicycle fall. Wound explored, no tendon involvement. Irrigated 200mL NS. Closed with 3-0 nylon interrupted sutures. Advised no cycling for 2 weeks.' },
    { id:'n015', date:'2026-03-17', time:'07:30', patient:'Dorothy Chase', age:73, mrn:'MRN-8820', type:'ED Note', status:'Signed', cc:'Acute PE — hemodynamically stable', summary:'73F with pleuritic chest pain and dyspnea. CTA confirmed bilateral PE, RV strain on echo. Hemodynamically stable. Started anticoagulation with heparin drip. Admitted to telemetry.' },
    { id:'n016', date:'2026-03-17', time:'11:15', patient:'Xavier Moreau', age:38, mrn:'MRN-3348', type:'Procedure', status:'Signed', cc:'Lumbar puncture', summary:'Procedure note: LP performed in seated position at L3-L4 interspace. Opening pressure 22cmH2O. CSF clear and colorless. 4 tubes collected for cell count, glucose, protein, culture. No complications.' },
    { id:'n017', date:'2026-03-17', time:'14:50', patient:'Linda Cho', age:49, mrn:'MRN-5577', type:'Discharge', status:'Signed', cc:'Diverticulitis discharge', summary:'49F admitted for complicated diverticulitis, now afebrile x 48hr, tolerating full diet. CT follow-up in 6 weeks to exclude underlying malignancy. Outpatient antibiotics completed course.' },
    { id:'n018', date:'2026-03-17', time:'18:20', patient:'Frank Russo', age:60, mrn:'MRN-2267', type:'Addendum', status:'Signed', cc:'Addendum — PE case review', summary:'Addendum to n015: Hematology reviewed. Factor V Leiden workup ordered. Patient declined thrombolytics given hemodynamic stability. Repeat echo at 24hr showed improved RV strain.' },
    { id:'n019', date:'2026-03-15', time:'09:00', patient:'Nora Walsh', age:26, mrn:'MRN-9910', type:'SOAP', status:'Signed', cc:'Palpitations and near-syncope', summary:'26F with episodic palpitations and near-syncope. EKG sinus rhythm, prolonged QTc 490ms. Electrolytes drawn — hypokalemia 3.1. Replete and monitor. Cardiology follow-up arranged. Reviewed medication interactions.' },
    { id:'n020', date:'2026-03-15', time:'13:30', patient:'George Adler', age:44, mrn:'MRN-4456', type:'ED Note', status:'Signed', cc:'Diabetic ketoacidosis', summary:'44M with Type 1 DM presenting with vomiting, polyuria, lethargy. BS 412, bicarb 10, anion gap 24. DKA protocol initiated — insulin drip, aggressive IV fluids. Trigger: missed insulin doses.' },
  ];

  const noteDates = new Set(NOTES.map(n => n.date));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const renderCalendarDays = () => {
    const today = new Date();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();

    const days = [];

    // Day names
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      days.push(<div key={`name-${d}`} className="nh-cal-day-name">{d}</div>);
    });

    // Prev month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="nh-cal-day nh-other-month">{prevDays - i}</div>);
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===day;
      const hasNotes = noteDates.has(dateStr);
      const isSelected = selectedDate === dateStr;

      let cls = 'nh-cal-day';
      if (isToday) cls += ' nh-today';
      if (hasNotes) cls += ' nh-has-notes';
      if (isSelected) cls += ' nh-selected';

      days.push(<div key={`day-${day}`} className={cls} onClick={() => setSelectedDate(dateStr)}>{day}</div>);
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      days.push(<div key={`next-${i}`} className="nh-cal-day nh-other-month">{i}</div>);
    }

    return days;
  };

  const getFilteredNotes = () => {
    let notes = NOTES.filter(n => n.date === selectedDate);
    if (activeTypeFilter !== 'all') notes = notes.filter(n => n.type === activeTypeFilter);
    if (activeStatusFilter !== 'all') notes = notes.filter(n => n.status === activeStatusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(n =>
        n.patient.toLowerCase().includes(q) ||
        n.cc.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === 'time-asc') notes.sort((a,b) => a.time.localeCompare(b.time));
    else if (sortMode === 'time-desc') notes.sort((a,b) => b.time.localeCompare(a.time));
    else if (sortMode === 'patient') notes.sort((a,b) => a.patient.localeCompare(b.patient));
    else if (sortMode === 'type') notes.sort((a,b) => a.type.localeCompare(b.type));

    return notes;
  };

  const filteredNotes = getFilteredNotes();
  const allForDay = NOTES.filter(n => n.date === selectedDate);

  const TYPE_META = {
    'SOAP':      { color: '#3b9eff', badge: 'nh-badge-blue', icon: '📄' },
    'ED Note':   { color: '#ff9f43', badge: 'nh-badge-orange', icon: '🚨' },
    'Procedure': { color: '#9b6dff', badge: 'nh-badge-purple', icon: '🔬' },
    'Discharge': { color: '#00e5c0', badge: 'nh-badge-teal', icon: '🚪' },
    'Addendum':  { color: '#f5c842', badge: 'nh-badge-gold', icon: '📎' },
  };
  const STATUS_META = { 'Signed': 'nh-badge-teal', 'Pending': 'nh-badge-gold', 'Draft': 'nh-badge-muted' };

  const formatDateLong = (dateStr) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    return d.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .nh-body{background:#050f1e;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:14px;margin:0;padding:0;height:100vh;overflow:hidden;position:fixed;inset:0;}
        .nh-icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:65px;background:#040d19;border-right:1px solid #1a3555;display:flex;flex-direction:column;align-items:center;z-index:200;overflow:hidden;}
        .nh-isb-logo{width:100%;height:50px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #1a3555;}
        .nh-isb-logo-box{width:34px;height:34px;background:#3b9eff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:white;cursor:pointer;transition:filter 0.15s;}
        .nh-isb-scroll{overflow-y:auto;width:100%;flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 0 10px;gap:1px;}
        .nh-isb-group-label{font-size:8px;color:#2e4a6a;text-transform:uppercase;letter-spacing:0.08em;text-align:center;padding:6px 4px 2px;width:100%;}
        .nh-isb-btn{width:48px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:8px;cursor:pointer;transition:all 0.15s;color:#4a6a8a;border:1px solid transparent;}
        .nh-isb-btn:hover{background:#0e2544;border-color:#1a3555;color:#8aaccc;}
        .nh-isb-btn.nh-active{background:rgba(59,158,255,0.1);border-color:rgba(59,158,255,0.3);color:#3b9eff;}
        .nh-isb-icon{font-size:16px;line-height:1;} .nh-isb-lbl{font-size:8.5px;line-height:1;white-space:nowrap;}
        .nh-isb-sep{width:36px;height:1px;background:#1a3555;margin:4px 0;flex-shrink:0;}
        .nh-navbar{position:fixed;top:0;left:65px;right:0;height:50px;background:#081628;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;z-index:100;}
        .nh-nav-welcome{font-size:13px;color:#8aaccc;font-weight:500;white-space:nowrap;}
        .nh-nav-welcome strong{color:#e8f0fe;font-weight:600;}
        .nh-nav-sep{width:1px;height:22px;background:#1a3555;flex-shrink:0;}
        .nh-nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:4px 12px;min-width:70px;cursor:pointer;transition:border-color 0.15s;}
        .nh-nav-stat:hover{border-color:#2a4f7a;}
        .nh-nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#e8f0fe;line-height:1.2;}
        .nh-nav-stat-val.nh-alert{color:#f5c842;}
        .nh-nav-stat-lbl{font-size:9px;color:#4a6a8a;text-transform:uppercase;letter-spacing:0.04em;}
        .nh-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px;}
        .nh-sub-navbar{position:fixed;top:50px;left:65px;right:0;height:42px;background:#0b1e36;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 16px;gap:10px;z-index:99;}
        .nh-sub-nav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#00d4ff;letter-spacing:-0.5px;}
        .nh-sub-nav-title{font-size:13px;color:#8aaccc;font-weight:500;}
        .nh-sub-nav-badge{background:#0e2544;border:1px solid #1a3555;border-radius:20px;padding:2px 10px;font-size:11px;color:#00e5c0;font-family:'JetBrains Mono',monospace;}
        .nh-vitals-bar{position:fixed;top:92px;left:65px;right:0;height:38px;background:#081628;border-bottom:1px solid #1a3555;display:flex;align-items:center;padding:0 14px;gap:10px;z-index:98;overflow:hidden;}
        .nh-vb-stat{display:flex;align-items:center;gap:5px;}
        .nh-vb-label{font-size:10px;color:#4a6a8a;text-transform:uppercase;letter-spacing:0.07em;}
        .nh-vb-val{font-family:'JetBrains Mono',monospace;font-size:12px;color:#8aaccc;}
        .nh-vb-val.nh-hi{color:#00e5c0;}
        .nh-vb-div{width:1px;height:20px;background:#1a3555;flex-shrink:0;}
        .nh-main-wrap{position:fixed;top:130px;left:65px;right:0;bottom:60px;display:flex;}
        .nh-sidebar{width:235px;flex-shrink:0;background:#081628;border-right:1px solid #1a3555;overflow-y:auto;display:flex;flex-direction:column;gap:0;}
        .nh-cal-wrap{padding:14px 12px;border-bottom:1px solid #1a3555;}
        .nh-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .nh-cal-month-label{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:#e8f0fe;}
        .nh-cal-nav-btn{width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:#0e2544;border:1px solid #1a3555;border-radius:6px;cursor:pointer;color:#8aaccc;font-size:13px;transition:all 0.15s;user-select:none;}
        .nh-cal-nav-btn:hover{border-color:#2a4f7a;color:#e8f0fe;}
        .nh-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
        .nh-cal-day-name{text-align:center;font-size:9px;color:#2e4a6a;text-transform:uppercase;letter-spacing:0.05em;padding:3px 0 5px;}
        .nh-cal-day{text-align:center;font-size:12px;font-family:'JetBrains Mono',monospace;color:#4a6a8a;padding:5px 2px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;line-height:1;}
        .nh-cal-day:hover{background:#0e2544;color:#8aaccc;border-color:#1a3555;}
        .nh-cal-day.nh-other-month{color:#2e4a6a;opacity:0.4;}
        .nh-cal-day.nh-has-notes{color:#3b9eff;position:relative;}
        .nh-cal-day.nh-has-notes::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#3b9eff;}
        .nh-cal-day.nh-selected{background:rgba(59,158,255,0.15);border-color:#3b9eff;color:#3b9eff;font-weight:600;}
        .nh-cal-day.nh-today{border-color:rgba(0,229,192,0.3);color:#00e5c0;}
        .nh-cal-day.nh-today.nh-selected{background:rgba(0,229,192,0.12);border-color:#00e5c0;}
        .nh-sb-section{padding:12px 12px 8px;border-bottom:1px solid #1a3555;}
        .nh-sb-label{font-size:10px;color:#4a6a8a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:block;}
        .nh-filter-chip-row{display:flex;flex-wrap:wrap;gap:5px;}
        .nh-filter-chip{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid #1a3555;background:#0e2544;color:#8aaccc;transition:all 0.15s;user-select:none;}
        .nh-filter-chip:hover{border-color:#2a4f7a;color:#e8f0fe;}
        .nh-filter-chip.nh-active{background:rgba(59,158,255,0.15);border-color:#3b9eff;color:#3b9eff;}
        .nh-filter-chip.nh-active-teal{background:rgba(0,229,192,0.1);border-color:rgba(0,229,192,0.4);color:#00e5c0;}
        .nh-sb-stats{padding:12px;display:flex;flex-direction:column;gap:8px;}
        .nh-sb-stat-row{display:flex;align-items:center;justify-content:space-between;}
        .nh-sb-stat-label{font-size:12px;color:#4a6a8a;}
        .nh-sb-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;color:#8aaccc;font-weight:600;}
        .nh-sb-stat-val.nh-hi{color:#00e5c0;}
        .nh-content{flex:1;overflow-y:auto;padding:18px 20px 30px;display:flex;flex-direction:column;gap:16px;}
        .nh-search-bar-wrap{display:flex;gap:10px;align-items:center;}
        .nh-search-input-wrap{flex:1;position:relative;}
        .nh-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;color:#4a6a8a;pointer-events:none;}
        .nh-search-input{width:100%;background:#081628;border:1px solid #1a3555;border-radius:8px;padding:9px 12px 9px 34px;color:#e8f0fe;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.2s;}
        .nh-search-input:focus{border-color:#3b9eff;box-shadow:0 0 0 3px rgba(59,158,255,0.08);}
        .nh-search-input::placeholder{color:#2e4a6a;}
        .nh-sort-select{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:8px 12px;color:#8aaccc;font-family:'DM Sans',sans-serif;font-size:12px;outline:none;cursor:pointer;}
        .nh-date-heading{display:flex;align-items:center;gap:12px;}
        .nh-date-heading-label{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#e8f0fe;}
        .nh-date-heading-sub{font-size:12px;color:#4a6a8a;}
        .nh-notes-grid{display:flex;flex-direction:column;gap:10px;}
        .nh-note-card{background:#081628;border:1px solid #1a3555;border-radius:12px;padding:0;overflow:hidden;cursor:pointer;transition:all 0.18s;position:relative;}
        .nh-note-card:hover{border-color:#2a4f7a;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3);}
        .nh-note-card-accent{position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:12px 0 0 12px;}
        .nh-note-card-inner{padding:14px 16px 14px 20px;}
        .nh-note-card-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:8px;}
        .nh-note-card-icon{font-size:20px;flex-shrink:0;margin-top:1px;}
        .nh-note-card-meta{flex:1;min-width:0;}
        .nh-note-card-patient{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#e8f0fe;line-height:1.2;}
        .nh-note-card-sub{font-size:11px;color:#4a6a8a;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .nh-note-detail-row{display:grid;grid-template-columns:120px 1fr;gap:6px;align-items:baseline;}
        .nh-note-detail-key{font-size:10px;color:#2e4a6a;text-transform:uppercase;letter-spacing:0.05em;}
        .nh-note-detail-val{font-size:13px;color:#8aaccc;}
        .nh-note-detail-val.nh-cc{color:#ff9f43;font-weight:500;}
        .nh-note-summary{font-size:12px;color:#4a6a8a;line-height:1.6;margin-top:8px;padding-top:8px;border-top:1px solid #1a3555;font-style:italic;}
        .nh-note-card-footer{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #1a3555;}
        .nh-note-footer-pill{font-size:11px;color:#4a6a8a;display:flex;align-items:center;gap:4px;}
        .nh-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;text-align:center;}
        .nh-empty-icon{font-size:40px;opacity:0.3;}
        .nh-empty-title{font-family:'Playfair Display',serif;font-size:18px;color:#4a6a8a;font-weight:600;}
        .nh-empty-sub{font-size:13px;color:#2e4a6a;max-width:260px;line-height:1.6;}
        .nh-bottom-nav{position:fixed;bottom:0;left:65px;right:0;height:60px;background:#081628;border-top:1px solid #1a3555;display:flex;align-items:center;padding:0 20px;gap:10px;z-index:100;}
        .nh-bot-info{font-size:12px;color:#4a6a8a;display:flex;align-items:center;gap:8px;}
        .nh-bot-info strong{color:#8aaccc;font-weight:600;}
        .nh-badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap;}
        .nh-badge-teal{background:rgba(0,229,192,0.12);color:#00e5c0;border:1px solid rgba(0,229,192,0.3);}
        .nh-badge-blue{background:rgba(59,158,255,0.12);color:#3b9eff;border:1px solid rgba(59,158,255,0.3);}
        .nh-badge-gold{background:rgba(245,200,66,0.12);color:#f5c842;border:1px solid rgba(245,200,66,0.3);}
        .nh-badge-coral{background:rgba(255,107,107,0.15);color:#ff6b6b;border:1px solid rgba(255,107,107,0.3);}
        .nh-badge-orange{background:rgba(255,159,67,0.12);color:#ff9f43;border:1px solid rgba(255,159,67,0.3);}
        .nh-badge-purple{background:rgba(155,109,255,0.12);color:#9b6dff;border:1px solid rgba(155,109,255,0.3);}
        .nh-badge-muted{background:rgba(74,106,138,0.2);color:#4a6a8a;}
        .nh-btn-ghost{background:#0e2544;border:1px solid #1a3555;border-radius:8px;padding:5px 12px;font-size:12px;color:#8aaccc;cursor:pointer;text-decoration:none;transition:all 0.15s;display:inline-flex;align-items:center;gap:5px;}
        .nh-btn-ghost:hover{border-color:#2a4f7a;color:#e8f0fe;}
        .nh-btn-primary{background:#00e5c0;color:#050f1e;border:none;border-radius:8px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:filter 0.15s;display:inline-flex;align-items:center;gap:5px;}
        .nh-btn-primary:hover{filter:brightness(1.15);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .nh-note-card{animation:fadeUp 0.2s ease both;}
      `}</style>

      <div className="nh-body">
        {/* ICON SIDEBAR */}
        <aside className="nh-icon-sidebar">
          <div className="nh-isb-logo"><div className="nh-isb-logo-box">N.</div></div>
          <div className="nh-isb-scroll">
            <span className="nh-isb-group-label">CORE</span>
            <div className="nh-isb-btn"><span className="nh-isb-icon">🏠</span><span className="nh-isb-lbl">Home</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">📊</span><span className="nh-isb-lbl">Dashboard</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">🔄</span><span className="nh-isb-lbl">Shift</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">👥</span><span className="nh-isb-lbl">Patients</span></div>
            <div className="nh-isb-sep"></div>
            <span className="nh-isb-group-label">DOCUMENTATION</span>
            <div className="nh-isb-btn"><span className="nh-isb-icon">✨</span><span className="nh-isb-lbl">Note Hub</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">🎙️</span><span className="nh-isb-lbl">Transcription</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">📄</span><span className="nh-isb-lbl">SOAP</span></div>
            <div className="nh-isb-btn"><span className="nh-isb-icon">📝</span><span className="nh-isb-lbl">Note Studio</span></div>
            <div className="nh-isb-btn nh-active"><span className="nh-isb-icon">🗒️</span><span className="nh-isb-lbl">Notes</span></div>
          </div>
        </aside>

        {/* TOP NAVBAR */}
        <nav className="nh-navbar">
          <span className="nh-nav-welcome">Welcome, <strong>{currentUser?.full_name || 'Dr. Gabriel Skiba'}</strong></span>
          <div className="nh-nav-sep"></div>
          <div className="nh-nav-stat"><span className="nh-nav-stat-val">8</span><span className="nh-nav-stat-lbl">Active Patients</span></div>
          <div className="nh-nav-stat"><span className="nh-nav-stat-val nh-alert">14</span><span className="nh-nav-stat-lbl">Notes Pending</span></div>
          <div className="nh-nav-stat"><span className="nh-nav-stat-val">3</span><span className="nh-nav-stat-lbl">Orders Queue</span></div>
          <div className="nh-nav-stat"><span className="nh-nav-stat-val">11.6</span><span className="nh-nav-stat-lbl">Shift Hours</span></div>
        </nav>

        {/* SUB-NAVBAR */}
        <div className="nh-sub-navbar">
          <span className="nh-sub-nav-logo">notrya</span>
          <span style={{ color: '#2e4a6a', fontSize: '14px' }}>|</span>
          <span className="nh-sub-nav-title">Note History</span>
          <span className="nh-sub-nav-badge">NH-001</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="nh-btn-ghost">⬇ Export</button>
            <button className="nh-btn-ghost">🖨 Print</button>
            <button className="nh-btn-primary">+ New Note</button>
          </div>
        </div>

        {/* VITALS BAR */}
        <div className="nh-vitals-bar">
          <div className="nh-vb-stat"><span className="nh-vb-label">Showing</span><span className="nh-vb-val nh-hi">{filteredNotes.length}</span><span className="nh-vb-label">notes</span></div>
          <div className="nh-vb-div"></div>
          <div className="nh-vb-stat"><span className="nh-vb-label">Total This Month</span><span className="nh-vb-val">47</span></div>
          <div className="nh-vb-div"></div>
          <div className="nh-vb-stat"><span className="nh-vb-label">Signed</span><span className="nh-vb-val nh-hi">38</span></div>
          <div className="nh-vb-div"></div>
          <div className="nh-vb-stat"><span className="nh-vb-label">Pending Signature</span><span className="nh-vb-val" style={{ color: '#f5c842' }}>9</span></div>
          <div className="nh-vb-div"></div>
          <div className="nh-vb-stat"><span className="nh-vb-label">Provider</span><span className="nh-vb-val">Dr. G. Skiba</span></div>
          <div style={{ marginLeft: 'auto' }}><span className="nh-badge nh-badge-teal">HISTORY VIEW</span></div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="nh-main-wrap">
          {/* SIDEBAR */}
          <aside className="nh-sidebar">
            {/* Calendar */}
            <div className="nh-cal-wrap">
              <div className="nh-cal-header">
                <div className="nh-cal-nav-btn" onClick={() => {
                  let m = calMonth - 1;
                  let y = calYear;
                  if (m < 0) { m = 11; y--; }
                  setCalMonth(m);
                  setCalYear(y);
                }}>‹</div>
                <span className="nh-cal-month-label">{MONTHS[calMonth]} {calYear}</span>
                <div className="nh-cal-nav-btn" onClick={() => {
                  let m = calMonth + 1;
                  let y = calYear;
                  if (m > 11) { m = 0; y++; }
                  setCalMonth(m);
                  setCalYear(y);
                }}>›</div>
              </div>
              <div className="nh-cal-grid">{renderCalendarDays()}</div>
            </div>

            {/* Note Type Filter */}
            <div className="nh-sb-section">
              <span className="nh-sb-label">Note Type</span>
              <div className="nh-filter-chip-row">
                {['all', 'SOAP', 'ED Note', 'Procedure', 'Addendum', 'Discharge'].map(t => (
                  <div key={t} className={`nh-filter-chip ${activeTypeFilter === t ? 'nh-active' : ''}`} onClick={() => setActiveTypeFilter(t)}>{t === 'all' ? 'All' : t}</div>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="nh-sb-section">
              <span className="nh-sb-label">Status</span>
              <div className="nh-filter-chip-row">
                {['all', 'Signed', 'Pending', 'Draft'].map(s => (
                  <div key={s} className={`nh-filter-chip ${activeStatusFilter === s ? 'nh-active-teal' : ''}`} onClick={() => setActiveStatusFilter(s)}>{s === 'all' ? 'All' : s}</div>
                ))}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="nh-sb-stats">
              <span className="nh-sb-label" style={{ marginBottom: '4px' }}>Selected Day Stats</span>
              <div className="nh-sb-stat-row"><span className="nh-sb-stat-label">Total Notes</span><span className="nh-sb-stat-val nh-hi">{allForDay.length}</span></div>
              <div style={{ height: '1px', background: '#1a3555', margin: '4px 0' }}></div>
              <div className="nh-sb-stat-row"><span className="nh-sb-stat-label">SOAP</span><span className="nh-sb-stat-val">{allForDay.filter(n => n.type === 'SOAP').length}</span></div>
              <div className="nh-sb-stat-row"><span className="nh-sb-stat-label">ED Note</span><span className="nh-sb-stat-val">{allForDay.filter(n => n.type === 'ED Note').length}</span></div>
              <div className="nh-sb-stat-row"><span className="nh-sb-stat-label">Procedure</span><span className="nh-sb-stat-val">{allForDay.filter(n => n.type === 'Procedure').length}</span></div>
              <div className="nh-sb-stat-row"><span className="nh-sb-stat-label">Discharge</span><span className="nh-sb-stat-val">{allForDay.filter(n => n.type === 'Discharge').length}</span></div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="nh-content">
            {/* Search bar */}
            <div className="nh-search-bar-wrap">
              <div className="nh-search-input-wrap">
                <span className="nh-search-icon">🔍</span>
                <input className="nh-search-input" type="text" placeholder="Search by patient name, chief complaint, note content…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <select className="nh-sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                <option value="time-desc">Newest First</option>
                <option value="time-asc">Oldest First</option>
                <option value="patient">Patient A–Z</option>
                <option value="type">Note Type</option>
              </select>
            </div>

            {/* Date heading */}
            <div className="nh-date-heading">
              <div className="nh-date-heading-label">{formatDateLong(selectedDate)}</div>
              <div className="nh-date-heading-sub">{filteredNotes.length === 0 ? 'No notes match current filters' : ''}</div>
              <div style={{ marginLeft: 'auto' }}><span className="nh-badge nh-badge-blue">{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</span></div>
            </div>

            {/* Notes list */}
            <div className="nh-notes-grid">
              {filteredNotes.length === 0 ? (
                <div className="nh-empty-state"><div className="nh-empty-icon">🔍</div><div className="nh-empty-title">No notes found</div><div className="nh-empty-sub">Try adjusting your filters or search query.</div></div>
              ) : (
                filteredNotes.map((note, idx) => {
                  const tm = TYPE_META[note.type] || { color: '#4a6a8a', badge: 'nh-badge-muted', icon: '📄' };
                  const sm = STATUS_META[note.status] || 'nh-badge-muted';
                  return (
                    <div key={note.id} className="nh-note-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <div className="nh-note-card-accent" style={{ background: tm.color }}></div>
                      <div className="nh-note-card-inner">
                        <div className="nh-note-card-top">
                          <div className="nh-note-card-icon">{tm.icon}</div>
                          <div className="nh-note-card-meta">
                            <div className="nh-note-card-patient">{note.patient}</div>
                            <div className="nh-note-card-sub">
                              <span>{note.age}yo</span>
                              <span style={{ color: '#2e4a6a' }}>·</span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#2e4a6a' }}>{note.mrn}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span className={`nh-badge ${sm}`}>{note.status}</span>
                            <span className={`nh-badge ${tm.badge}`}>{note.type}</span>
                          </div>
                        </div>
                        <div className="nh-note-detail-row">
                          <span className="nh-note-detail-key">Chief Complaint</span>
                          <span className="nh-note-detail-val nh-cc">{note.cc}</span>
                        </div>
                        <div className="nh-note-summary">{note.summary}</div>
                        <div className="nh-note-card-footer">
                          <span className="nh-note-footer-pill">🕐 {note.time}</span>
                          <span style={{ color: '#2e4a6a', fontSize: '11px' }}>·</span>
                          <span className="nh-note-footer-pill">📅 {note.date}</span>
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                            <button className="nh-btn-ghost" style={{ padding: '3px 10px', fontSize: '11px' }}>👁 View</button>
                            <button className="nh-btn-ghost" style={{ padding: '3px 10px', fontSize: '11px' }}>✏️ Edit</button>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>

        {/* BOTTOM NAV */}
        <div className="nh-bottom-nav">
          <div className="nh-bot-info"><span>📅</span><span>Selected: <strong>{formatDateLong(selectedDate)}</strong></span></div>
          <div className="nh-bot-info" style={{ marginLeft: '24px' }}><span>🔍</span><span>Showing <strong>{filteredNotes.length}</strong> of <strong>{allForDay.length}</strong> notes</span></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="nh-btn-ghost" onClick={() => { setSearchQuery(''); setActiveTypeFilter('all'); setActiveStatusFilter('all'); setSortMode('time-desc'); }}>↺ Reset Filters</button>
          </div>
        </div>
      </div>
    </>
  );
}