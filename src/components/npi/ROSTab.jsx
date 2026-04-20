import { useState, useEffect, useCallback, useRef } from 'react';

// ─── SYSTEM & SYMPTOM DATA ────────────────────────────────────────────────────
const ROS_SYSTEMS = [
  {
    id: 'const', key: 'O', label: 'Constitutional', icon: '🌡️',
    denyAll: 'Denies fever, chills, fatigue, weight loss, night sweats',
    symptoms: [
      { id: 'fever',       label: 'Fever'           },
      { id: 'chills',      label: 'Chills'          },
      { id: 'fatigue',     label: 'Fatigue / malaise'},
      { id: 'wt-loss',     label: 'Weight loss'     },
      { id: 'wt-gain',     label: 'Weight gain'     },
      { id: 'night-sweat', label: 'Night sweats'    },
      { id: 'anorexia',    label: 'Anorexia'        },
    ],
  },
  {
    id: 'heent', key: 'H', label: 'HEENT', icon: '👁️',
    denyAll: 'Denies headache, vision changes, ear pain, hearing loss, sore throat',
    symptoms: [
      { id: 'headache',     label: 'Headache'          },
      { id: 'vision-chg',   label: 'Vision changes'    },
      { id: 'ear-pain',     label: 'Ear pain'          },
      { id: 'hearing-loss', label: 'Hearing loss'      },
      { id: 'tinnitus',     label: 'Tinnitus'          },
      { id: 'nasal-cong',   label: 'Nasal congestion'  },
      { id: 'rhinorrhea',   label: 'Rhinorrhea'        },
      { id: 'sore-throat',  label: 'Sore throat'       },
      { id: 'dental-pain',  label: 'Dental pain'       },
    ],
  },
  {
    id: 'cv', key: 'C', label: 'Cardiovascular', icon: '❤️',
    denyAll: 'Denies chest pain, palpitations, dyspnea on exertion, syncope, leg swelling',
    symptoms: [
      { id: 'cp',          label: 'Chest pain'         },
      { id: 'palpitations',label: 'Palpitations'       },
      { id: 'doe',         label: 'Dyspnea on exertion'},
      { id: 'orthopnea',   label: 'Orthopnea'          },
      { id: 'pnd',         label: 'PND'                },
      { id: 'syncope',     label: 'Syncope'            },
      { id: 'presyncope',  label: 'Pre-syncope'        },
      { id: 'leg-swell',   label: 'Leg swelling'       },
    ],
  },
  {
    id: 'resp', key: 'R', label: 'Respiratory', icon: '🫁',
    denyAll: 'Denies shortness of breath, cough, hemoptysis, wheezing',
    symptoms: [
      { id: 'sob',          label: 'Shortness of breath' },
      { id: 'cough',        label: 'Cough'                },
      { id: 'prod-cough',   label: 'Productive cough'     },
      { id: 'hemoptysis',   label: 'Hemoptysis'           },
      { id: 'wheezing',     label: 'Wheezing'             },
      { id: 'pleuritic-cp', label: 'Pleuritic chest pain' },
    ],
  },
  {
    id: 'gi', key: 'G', label: 'GI / Abdomen', icon: '🫃',
    denyAll: 'Denies abdominal pain, nausea, vomiting, diarrhea, blood in stool',
    symptoms: [
      { id: 'abd-pain',     label: 'Abdominal pain'   },
      { id: 'nausea',       label: 'Nausea'           },
      { id: 'vomiting',     label: 'Vomiting'         },
      { id: 'diarrhea',     label: 'Diarrhea'         },
      { id: 'constipation', label: 'Constipation'     },
      { id: 'hematochezia', label: 'Hematochezia'     },
      { id: 'melena',       label: 'Melena'           },
      { id: 'hematemesis',  label: 'Hematemesis'      },
      { id: 'dysphagia',    label: 'Dysphagia'        },
      { id: 'heartburn',    label: 'Heartburn / GERD' },
      { id: 'jaundice',     label: 'Jaundice'         },
    ],
  },
  {
    id: 'gu', key: 'U', label: 'Genitourinary', icon: '🔵',
    denyAll: 'Denies dysuria, hematuria, urinary frequency, discharge',
    symptoms: [
      { id: 'dysuria',     label: 'Dysuria'           },
      { id: 'hematuria',   label: 'Hematuria'         },
      { id: 'frequency',   label: 'Urinary frequency' },
      { id: 'urgency',     label: 'Urinary urgency'   },
      { id: 'retention',   label: 'Urinary retention' },
      { id: 'discharge',   label: 'Discharge'         },
      { id: 'pelvic-pain', label: 'Pelvic pain'       },
      { id: 'vag-bleed',   label: 'Vaginal bleeding'  },
    ],
  },
  {
    id: 'msk', key: 'M', label: 'MSK', icon: '🦴',
    denyAll: 'Denies joint pain, back pain, myalgia, joint swelling',
    symptoms: [
      { id: 'joint-pain',  label: 'Joint pain'         },
      { id: 'back-pain',   label: 'Back pain'          },
      { id: 'neck-pain',   label: 'Neck pain'          },
      { id: 'myalgia',     label: 'Myalgia'            },
      { id: 'weakness',    label: 'Weakness'           },
      { id: 'joint-swell', label: 'Joint swelling'     },
      { id: 'stiffness',   label: 'Morning stiffness'  },
    ],
  },
  {
    id: 'neuro', key: 'N', label: 'Neurological', icon: '🧠',
    denyAll: 'Denies dizziness, syncope, seizures, numbness, focal weakness',
    symptoms: [
      { id: 'dizziness',    label: 'Dizziness / vertigo' },
      { id: 'neuro-syncope',label: 'Syncope'              },
      { id: 'seizure',      label: 'Seizure activity'     },
      { id: 'numbness',     label: 'Numbness / tingling'  },
      { id: 'focal-weak',   label: 'Focal weakness'       },
      { id: 'speech-chg',   label: 'Speech changes'       },
      { id: 'memory-chg',   label: 'Memory changes'       },
      { id: 'vision-n',     label: 'Vision changes'       },
      { id: 'tremor',       label: 'Tremor'               },
    ],
  },
  {
    id: 'psych', key: 'P', label: 'Psychiatric', icon: '🧘',
    denyAll: 'Denies depression, anxiety, suicidal/homicidal ideation, hallucinations',
    symptoms: [
      { id: 'depression',  label: 'Depression'         },
      { id: 'anxiety',     label: 'Anxiety'            },
      { id: 'si',          label: 'Suicidal ideation'  },
      { id: 'hi',          label: 'Homicidal ideation' },
      { id: 'hallucin',    label: 'Hallucinations'     },
      { id: 'sleep-dist',  label: 'Sleep disturbance'  },
      { id: 'mood-chg',    label: 'Mood changes'       },
    ],
  },
  {
    id: 'skin', key: 'S', label: 'Skin', icon: '🩹',
    denyAll: 'Denies rash, pruritus, new skin lesions',
    symptoms: [
      { id: 'rash',        label: 'Rash'              },
      { id: 'pruritus',    label: 'Pruritus'          },
      { id: 'new-lesion',  label: 'New skin lesion'   },
      { id: 'hair-loss',   label: 'Hair loss'         },
      { id: 'nail-chg',    label: 'Nail changes'      },
      { id: 'nh-wound',    label: 'Non-healing wound' },
    ],
  },
  {
    id: 'endo', key: 'E', label: 'Endocrine', icon: '⚗️',
    denyAll: 'Denies polydipsia, polyuria, heat/cold intolerance',
    symptoms: [
      { id: 'polydipsia',  label: 'Polydipsia'         },
      { id: 'polyuria',    label: 'Polyuria'           },
      { id: 'heat-intol',  label: 'Heat intolerance'   },
      { id: 'cold-intol',  label: 'Cold intolerance'   },
      { id: 'thyroid-sx',  label: 'Thyroid symptoms'   },
    ],
  },
  {
    id: 'heme', key: 'B', label: 'Heme / Lymph', icon: '🩸',
    denyAll: 'Denies easy bruising, easy bleeding, lymphadenopathy',
    symptoms: [
      { id: 'bruising',    label: 'Easy bruising'      },
      { id: 'bleeding',    label: 'Easy bleeding'      },
      { id: 'lad',         label: 'Lymphadenopathy'    },
      { id: 'anemia-sx',   label: 'Anemia symptoms'    },
      { id: 'clot-hx',     label: 'Clotting history'   },
    ],
  },
  {
    id: 'allergy', key: 'L', label: 'Allergic / Immuno', icon: '🌿',
    denyAll: 'Denies seasonal allergies, recurrent infections, asthma symptoms',
    symptoms: [
      { id: 'seasonal',    label: 'Seasonal allergies'   },
      { id: 'food-allergy',label: 'Food allergies'       },
      { id: 'asthma-sx',   label: 'Asthma symptoms'      },
      { id: 'recur-infx',  label: 'Recurrent infections' },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getSysStatus(symptoms) {
  const vals = Object.values(symptoms || {}).filter(v => v !== null && v !== undefined);
  if (!vals.length) return 'empty';
  if (vals.some(v => v === 'present'))  return 'has-positives';
  if (vals.every(v => v === 'absent'))  return 'reviewed';
  return 'partial';
}

function initRosData() {
  const d = {};
  ROS_SYSTEMS.forEach(s => {
    d[s.id] = {
      symptoms: Object.fromEntries(s.symptoms.map(sym => [sym.id, null])),
    };
  });
  return d;
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function SysItem({ sys, isActive, status, onClick }) {
  const dotBg = {
    reviewed:     '#00e5c0',
    'has-positives': '#ff6b6b',
    partial:      '#ff9f43',
    empty:        'transparent',
  }[status];
  const dotBorder = status === 'empty' ? '1.5px solid #2a4f7a' : 'none';
  return (
    <button className={`ros-sys-item${isActive ? ' ros-active' : ''}`} onClick={onClick}>
      <span className="ros-sys-key">{sys.key}</span>
      <span className="ros-sys-ico">{sys.icon}</span>
      <span className="ros-sys-lbl">{sys.label}</span>
      <span className="ros-sys-dot" style={{ background: dotBg, border: dotBorder }} />
    </button>
  );
}

function SymptomChip({ symptom, value, kbFocused, kbIndex, onClick }) {
  const isAbsent  = value === 'absent';
  const isPresent = value === 'present';
  const cls = ['ros-chip',
    isAbsent  ? 'ros-chip-a' : '',
    isPresent ? 'ros-chip-p' : '',
    kbFocused ? 'ros-chip-kb' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick}>
      {kbIndex != null && (
        <span className="ros-chip-num">{kbIndex}</span>
      )}
      <span className="ros-chip-ico">
        {isAbsent ? '✓' : isPresent ? '✕' : '○'}
      </span>
      <span className="ros-chip-txt">
        {isAbsent  ? <span className="ros-denies">Denies</span>   : null}
        {isPresent ? <span className="ros-reports">Reports</span> : null}
        {' '}{symptom.label}
      </span>
      {kbFocused && <span className="ros-chip-hint">↵ · X</span>}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    reviewed:        { cls: 'ros-badge-r', txt: '✓ Reviewed'      },
    'has-positives': { cls: 'ros-badge-p', txt: '✕ Positives'     },
    partial:         { cls: 'ros-badge-m', txt: '◑ Partial'       },
    empty:           { cls: 'ros-badge-e', txt: '○ Not reviewed'  },
  };
  const { cls, txt } = map[status] || map.empty;
  return <span className={`ros-badge ${cls}`}>{txt}</span>;
}

function KbLegend({ isFocused, docMode }) {
  const keys = [
    ['↑↓',   'symptom'],
    ['←→',   'system'],
    ['letter','jump sys'],
    ['1–9',  'quick pick'],
    ['Space', 'toggle'],
    ['↵',    'absent'],
    ['X',    'present'],
    ['⌘↵',   'deny sys'],
    ['⌘⇧N',  'deny all'],
    ['⌘F',   docMode === 'full' ? '→ focused' : '→ full'],
    ['⌘R',   'rest denied'],
    ['⌘→',   '→ PE'],
    ['Esc',  isFocused ? 'exit' : '→ PE'],
  ];
  return (
    <div className={`ros-kb-bar${isFocused ? ' ros-kb-on' : ''}`}>
      <span className="ros-kb-ico">⌨</span>
      {keys.map(([k, d]) => (
        <span key={k} className="ros-kb-item">
          <kbd>{k}</kbd>
          <span>{d}</span>
        </span>
      ))}
      {!isFocused && (
        <span className="ros-kb-prompt">Click or Tab to panel to enable keyboard navigation</span>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─── CC → FOCUSED SYSTEM MAPPING ─────────────────────────────────────────────
const CC_SYS_MAP = [
  { kws:['chest'],           ids:['cv','resp','gi','msk']           },
  { kws:['palpitat'],        ids:['cv','neuro']                     },
  { kws:['syncope','faint'], ids:['cv','neuro','const']             },
  { kws:['breath','dyspn'],  ids:['resp','cv','psych']              },
  { kws:['cough','wheez'],   ids:['resp','allergy','gi']            },
  { kws:['abdom','stomach'], ids:['gi','gu','msk','const']          },
  { kws:['nausea','vomit'],  ids:['gi','const','neuro']             },
  { kws:['diarrhea'],        ids:['gi','const']                     },
  { kws:['headache','head'], ids:['neuro','heent','cv']             },
  { kws:['dizzi','vertigo'], ids:['neuro','cv','heent']             },
  { kws:['weak','fatigue'],  ids:['const','neuro','cv','endo']      },
  { kws:['back','lumbar'],   ids:['msk','gi','gu','neuro']          },
  { kws:['joint','arthr'],   ids:['msk','skin','allergy']           },
  { kws:['trauma','injur'],  ids:['msk','neuro','skin']             },
  { kws:['fever','infect'],  ids:['const','heent','resp','gi','gu'] },
  { kws:['rash','skin'],     ids:['skin','allergy','const']         },
  { kws:['urin','dysuria'],  ids:['gu','gi']                        },
  { kws:['anxiet','panic'],  ids:['psych','cv','resp']              },
];
function getFocusedIds(cc) {
  if (!cc) return ['const','cv','resp','gi','msk'];
  const lc = cc.toLowerCase();
  for (const { kws, ids } of CC_SYS_MAP) {
    if (kws.some(kw => lc.includes(kw))) return ids;
  }
  return ['const','cv','resp','gi','msk'];
}

export default function ROSTab({ onStateChange, onSymptomsChange, chiefComplaint, onAdvance, extSysIdx, onSysChange }) {
  const [rosData, setRosData] = useState(initRosData);
  const [docMode,      setDocMode]      = useState('focused'); // 'focused' | 'full'
  const [remainderNeg, setRemainderNeg] = useState(false);
  const mainRef    = useRef(null);

  // ── Action handlers ──────────────────────────────────────────────────────
  // For ROS: 'normal' = 'absent' (patient denies), 'abnormal' = 'present' (patient reports)
  const handleFindingAction = useCallback((action, sysId, symId) => {
    setRosData(prev => {
      const cur = prev[sysId]?.symptoms[symId];
      const next =
        action === 'toggle'   ? (cur === null ? 'absent' : cur === 'absent' ? 'present' : null)
        : action === 'normal'   ? (cur === 'absent' ? null : 'absent')
        : action === 'abnormal' ? (cur === 'present' ? null : 'present')
        : null;
      return {
        ...prev,
        [sysId]: {
          ...prev[sysId],
          symptoms: { ...prev[sysId].symptoms, [symId]: next },
        },
      };
    });
  }, []);

  const markSystemNormal = useCallback((sysId) => {
    const sys = ROS_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    setRosData(prev => ({
      ...prev,
      [sysId]: {
        ...prev[sysId],
        symptoms: Object.fromEntries(sys.symptoms.map(sym => [sym.id, 'absent'])),
      },
    }));
  }, []);

  const markAllNormal = useCallback(() => {
    const updated = {};
    ROS_SYSTEMS.forEach(s => {
      updated[s.id] = {
        symptoms: Object.fromEntries(s.symptoms.map(sym => [sym.id, 'absent'])),
      };
    });
    setRosData(updated);
  }, []);

  const clearSystem = useCallback((sysId) => {
    const sys = ROS_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    setRosData(prev => ({
      ...prev,
      [sysId]: { symptoms: Object.fromEntries(sys.symptoms.map(sym => [sym.id, null])) },
    }));
  }, []);

  const clearAll = useCallback(() => setRosData(initRosData()), []);

  // ── Visible systems (focused mode filter) ────────────────────────────────
  const focusedIds  = getFocusedIds(chiefComplaint);
  const visibleSys  = docMode === 'full' ? ROS_SYSTEMS : ROS_SYSTEMS.filter(s => focusedIds.includes(s.id));
  const hiddenCount = ROS_SYSTEMS.length - visibleSys.length;

  // ── Keyboard navigation state (useBodySystemKeyboard inlined) ─────────────
  const [activeSystemIdx,  setActiveSystemIdx]  = useState(0);
  const [activeFindingIdx, setActiveFindingIdx] = useState(-1);
  const [isFocused,        setIsFocused]        = useState(false);
  const panelRef = useRef(null);

  const focus = useCallback(() => panelRef.current?.focus(), []);

  const panelProps = {
    ref:      panelRef,
    tabIndex: 0,
    onFocus:  () => setIsFocused(true),
    onBlur:   () => { setIsFocused(false); setActiveFindingIdx(-1); },
    style:    { outline: 'none' },
  };

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    function handleKey(e) {
      const cmd = e.metaKey || e.ctrlKey;
      const k   = e.key;
      const activeSysData = ROS_SYSTEMS[activeSystemIdx];
      const symCount      = activeSysData?.symptoms.length ?? 0;

      // Esc: first press blurs, second press advances to PE
      if (k === 'Escape') {
        if (isFocused) { el.blur(); }
        else if (onAdvance) { onAdvance(); }
        return;
      }

      // ⌘→ — advance to PE
      if (cmd && k === 'ArrowRight') {
        e.preventDefault(); if (onAdvance) onAdvance(); return;
      }

      if (cmd && e.shiftKey && (k === 'N' || k === 'n')) {
        e.preventDefault(); markAllNormal(); return;
      }
      if (cmd && k === 'Enter') {
        e.preventDefault(); markSystemNormal(activeSysData?.id); return;
      }
      if (cmd && (k === 'f' || k === 'F')) {
        e.preventDefault(); setDocMode(m => m === 'focused' ? 'full' : 'focused'); return;
      }
      if (cmd && (k === 'r' || k === 'R')) {
        e.preventDefault(); setRemainderNeg(r => !r); return;
      }
      if (k === 'ArrowLeft') {
        e.preventDefault();
        const visCur = visibleSys.findIndex(s => s.id === activeSysData?.id);
        const prev   = visibleSys[Math.max(0, visCur - 1)];
        if (prev) setActiveSystemIdx(ROS_SYSTEMS.findIndex(s => s.id === prev.id));
        setActiveFindingIdx(-1); return;
      }
      if (k === 'ArrowRight') {
        e.preventDefault();
        const visCur = visibleSys.findIndex(s => s.id === activeSysData?.id);
        const next   = visibleSys[Math.min(visibleSys.length - 1, visCur + 1)];
        if (next) setActiveSystemIdx(ROS_SYSTEMS.findIndex(s => s.id === next.id));
        setActiveFindingIdx(-1); return;
      }
      if (k === 'ArrowUp') {
        e.preventDefault();
        setActiveFindingIdx(i => i <= 0 ? symCount - 1 : i - 1); return;
      }
      if (k === 'ArrowDown') {
        e.preventDefault();
        setActiveFindingIdx(i => i < symCount - 1 ? i + 1 : 0); return;
      }
      if (/^[1-9]$/.test(k)) {
        const idx = parseInt(k) - 1;
        if (idx < symCount) setActiveFindingIdx(idx);
        return;
      }
      if (k === ' ') {
        e.preventDefault();
        if (activeFindingIdx >= 0 && activeSysData) {
          const sym = activeSysData.symptoms[activeFindingIdx];
          if (sym) handleFindingAction('toggle', activeSysData.id, sym.id);
        }
        return;
      }
      if (k === 'Enter') {
        if (activeFindingIdx >= 0 && activeSysData) {
          const sym = activeSysData.symptoms[activeFindingIdx];
          if (sym) handleFindingAction('normal', activeSysData.id, sym.id);
        }
        return;
      }
      if (k === 'x' || k === 'X') {
        if (activeFindingIdx >= 0 && activeSysData) {
          const sym = activeSysData.symptoms[activeFindingIdx];
          if (sym) handleFindingAction('abnormal', activeSysData.id, sym.id);
        }
        return;
      }
      if (/^[A-Za-z]$/.test(k) && !cmd) {
        const sysIdx = visibleSys.findIndex(s => s.key === k.toUpperCase());
        if (sysIdx !== -1) {
          setActiveSystemIdx(ROS_SYSTEMS.findIndex(s => s.id === visibleSys[sysIdx].id));
          setActiveFindingIdx(-1);
        }
      }
    }
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [activeSystemIdx, activeFindingIdx, isFocused,
      visibleSys, handleFindingAction, markSystemNormal, markAllNormal,
      onAdvance]);

  // Auto-focus on mount — keyboard-first from the first render
  useEffect(() => {
    const t = setTimeout(focus, 60);
    return () => clearTimeout(t);
  }, [focus]); // focus is a stable useCallback([], []) — safe as dep

  const activeSys = ROS_SYSTEMS[activeSystemIdx];
  const sysData   = rosData[activeSys?.id] || { symptoms: {} };
  const sysStatus = getSysStatus(sysData.symptoms);

  // ── Sync to parent ───────────────────────────────────────────────────────
  useEffect(() => {
    const newState = {};
    ROS_SYSTEMS.forEach(s => {
      const st = getSysStatus(rosData[s.id]?.symptoms || {});
      if (st !== 'empty') newState[s.id] = st;
    });
    if (remainderNeg) newState._remainderNeg = true;
    if (docMode !== 'full') newState._mode = docMode;
    onStateChange?.(newState);
    onSymptomsChange?.(rosData);
  }, [rosData, remainderNeg, docMode, onStateChange, onSymptomsChange]);

  // ── Two-way sync with parent rail ────────────────────────────────────────
  // Rail → tab: when rail clicks a system, update internal keyboard state
  useEffect(() => {
    if (extSysIdx !== undefined && extSysIdx !== activeSystemIdx) {
      setActiveSystemIdx(extSysIdx);
      setActiveFindingIdx(-1);
    }
  }, [extSysIdx, activeSystemIdx]);

  // Tab → rail: when keyboard changes system, notify parent
  useEffect(() => {
    onSysChange?.(activeSystemIdx);
  }, [activeSystemIdx, onSysChange]);

  // ── Auto-scroll chips ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeFindingIdx >= 0) {
      const el = mainRef.current?.querySelector(`[data-sidx='${activeFindingIdx}']`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeFindingIdx]);

  // ── Computed stats ───────────────────────────────────────────────────────
  const totalSystems    = ROS_SYSTEMS.length;
  const reviewedSystems = ROS_SYSTEMS.filter(s => getSysStatus(rosData[s.id]?.symptoms || {}) !== 'empty').length;
  const positiveSystems = ROS_SYSTEMS.filter(s => getSysStatus(rosData[s.id]?.symptoms || {}) === 'has-positives').length;

  // ── Deny-all statement ───────────────────────────────────────────────────
  const showDenyAll = sysStatus === 'reviewed';

  return (
    <>
      <style>{ROS_CSS}</style>
      <div className={`ros-wrap${isFocused ? ' ros-focused' : ''}`} {...panelProps}>

        {/* ── HEADER BAR ───────────────────────────────────────────────── */}
        <div className="ros-hdr">
          <span className="ros-hdr-title">Review of Systems</span>
          {/* Mode toggle */}
          <div className="ros-mode-toggle">
            <button className={`ros-mode-btn${docMode==='focused'?' active':''}`} onClick={() => setDocMode('focused')}>
              Focused{docMode==='focused' && chiefComplaint ? ` (${visibleSys.length})` : ''}
            </button>
            <button className={`ros-mode-btn${docMode==='full'?' active':''}`} onClick={() => setDocMode('full')}>
              Full ({totalSystems})
            </button>
          </div>
          <div className="ros-hdr-stats">
            <span className="ros-hdr-badge ros-hdr-badge-blue">
              {reviewedSystems} / {totalSystems} reviewed
            </span>
            {positiveSystems > 0 && (
              <span className="ros-hdr-badge ros-hdr-badge-coral">
                {positiveSystems} positive
              </span>
            )}
          </div>
          <div className="ros-hdr-acts">
            <button className="ros-btn-deny-all" onClick={markAllNormal}>✓ Deny All</button>
            <button className="ros-btn-clear-all" onClick={() => { clearAll(); setRemainderNeg(false); }}>✕ Clear</button>
            {onAdvance && (
              <button onClick={onAdvance} style={{ background:'rgba(0,229,192,.15)', border:'1px solid rgba(0,229,192,.4)', borderRadius:6, padding:'4px 14px', fontSize:11, fontWeight:700, color:'#00e5c0', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                → PE
              </button>
            )}
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="ros-body">

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <div className="ros-sidebar">
            {visibleSys.map(sys => {
              const status    = getSysStatus(rosData[sys.id]?.symptoms || {});
              const globalIdx = ROS_SYSTEMS.findIndex(s => s.id === sys.id);
              return (
                <SysItem
                  key={sys.id}
                  sys={sys}
                  isActive={globalIdx === activeSystemIdx}
                  status={status}
                  onClick={() => { setActiveSystemIdx(globalIdx); setActiveFindingIdx(-1); focus(); }}
                />
              );
            })}
          </div>

          {/* ── MAIN PANEL ───────────────────────────────────────────── */}
          <div className="ros-main" ref={mainRef}>

            {/* System header */}
            <div className="ros-sys-hdr">
              <span className="ros-sys-hdr-ico">{activeSys?.icon}</span>
              <span className="ros-sys-hdr-name">{activeSys?.label}</span>
              <StatusBadge status={sysStatus} />
              <div className="ros-sys-hdr-acts">
                <button className="ros-btn-sys-deny" onClick={() => markSystemNormal(activeSys?.id)}>
                  ✓ Deny All
                </button>
                <button className="ros-btn-sys-clear" onClick={() => clearSystem(activeSys?.id)}>
                  ✕ Clear
                </button>
              </div>
            </div>

            {/* Deny-all statement */}
            {showDenyAll && (
              <div className="ros-deny-stmt">
                <span className="ros-deny-ico">✓</span>
                <span className="ros-deny-txt">{activeSys?.denyAll}</span>
              </div>
            )}

            {/* Symptom chips */}
            <div className="ros-chips-grid">
              {activeSys?.symptoms.map((sym, si) => (
                <div key={sym.id} data-sidx={si}>
                  <SymptomChip
                    symptom={sym}
                    value={sysData.symptoms[sym.id]}
                    kbFocused={isFocused && si === activeFindingIdx}
                    kbIndex={isFocused && si < 9 ? si + 1 : null}
                    onClick={() => {
                      handleFindingAction('toggle', activeSys.id, sym.id);
                      setActiveFindingIdx(si);
                      panelProps.ref.current?.focus();
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Positive findings summary strip */}
            {sysStatus === 'has-positives' && (
              <div className="ros-pos-strip">
                <span className="ros-pos-label">Reported:</span>
                {activeSys?.symptoms
                  .filter(sym => sysData.symptoms[sym.id] === 'present')
                  .map(sym => (
                    <span key={sym.id} className="ros-pos-pill">{sym.label}</span>
                  ))
                }
              </div>
            )}

            {/* ── FOCUSED MODE: Remainder banner ───────────────────────── */}
            {docMode === 'focused' && hiddenCount > 0 && (
              <div className={`ros-remainder${remainderNeg ? ' ros-remainder-done' : ''}`}>
                {remainderNeg ? (
                  <>
                    <span className="ros-remainder-ico">✓</span>
                    <span className="ros-remainder-txt">
                      Remaining {hiddenCount} systems reviewed — all negative
                    </span>
                    <button className="ros-remainder-undo" onClick={() => setRemainderNeg(false)}>undo</button>
                  </>
                ) : (
                  <>
                    <span className="ros-remainder-txt ros-remainder-pending">
                      {hiddenCount} systems not yet reviewed
                    </span>
                    <button className="ros-remainder-btn" onClick={() => setRemainderNeg(true)}>
                      ✓ Mark all others negative
                    </button>
                    <button className="ros-remainder-expand" onClick={() => setDocMode('full')}>
                      or expand to full ROS
                    </button>
                  </>
                )}
              </div>
            )}

          </div>{/* /ros-main */}
        </div>{/* /ros-body */}

        <KbLegend isFocused={isFocused} docMode={docMode} />
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const ROS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

/* Container */
.ros-wrap{display:flex;flex-direction:column;height:100%;background:var(--npi-bg);border-radius:12px;border:1px solid var(--npi-bd);overflow:hidden;transition:border-color .2s,box-shadow .2s}
.ros-wrap.ros-focused{border-color:rgba(0,229,192,.35);box-shadow:0 0 0 1px rgba(0,229,192,.1),0 0 40px rgba(0,229,192,.04)}

/* Header */
.ros-hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);flex-shrink:0;flex-wrap:wrap}
.ros-hdr-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:var(--npi-txt);white-space:nowrap}
.ros-hdr-cc{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-orange);background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.25);border-radius:4px;padding:2px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.ros-hdr-stats{display:flex;gap:6px;align-items:center}
.ros-hdr-badge{font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 9px;border-radius:20px;white-space:nowrap}
.ros-hdr-badge-blue{background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.25);color:var(--npi-blue)}
.ros-hdr-badge-coral{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.25);color:var(--npi-coral)}
.ros-hdr-acts{margin-left:auto;display:flex;gap:6px;flex-shrink:0}
.ros-btn-deny-all{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;color:#00e5c0;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.ros-btn-deny-all:hover{background:rgba(0,229,192,.22)}
.ros-btn-clear-all{background:transparent;border:1px solid var(--npi-bd);border-radius:6px;padding:4px 12px;font-size:11px;color:var(--npi-txt4);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.ros-btn-clear-all:hover{border-color:rgba(255,107,107,.4);color:var(--npi-coral)}

/* Body layout */
.ros-body{display:grid;grid-template-columns:160px 1fr;flex:1;overflow:hidden;min-height:0}

/* Sidebar */
.ros-sidebar{border-right:1px solid var(--npi-bd);overflow-y:auto;background:var(--npi-panel);scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.ros-sidebar::-webkit-scrollbar{width:3px}
.ros-sidebar::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.ros-sys-item{width:100%;display:flex;align-items:center;gap:7px;padding:9px 12px 9px 14px;border:none;border-left:2px solid transparent;background:transparent;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--npi-txt3)}
.ros-sys-item:hover{background:rgba(0,229,192,.03);color:var(--npi-txt2)}
.ros-sys-item.ros-active{background:rgba(0,229,192,.07);border-left-color:var(--npi-teal);color:var(--npi-teal)}
.ros-sys-key{font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;color:var(--npi-txt4);flex-shrink:0;min-width:18px;text-align:center;transition:all .15s}
.ros-sys-item.ros-active .ros-sys-key{background:rgba(0,229,192,.15);border-color:rgba(0,229,192,.4);color:var(--npi-teal)}
.ros-sys-ico{font-size:14px;flex-shrink:0;line-height:1}
.ros-sys-lbl{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}
.ros-sys-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s}

/* Main panel */
.ros-main{overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.ros-main::-webkit-scrollbar{width:3px}
.ros-main::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

/* System header */
.ros-sys-hdr{display:flex;align-items:center;gap:8px;padding-bottom:13px;border-bottom:1px solid rgba(26,53,85,.5)}
.ros-sys-hdr-ico{font-size:20px;line-height:1}
.ros-sys-hdr-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--npi-txt)}
.ros-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 9px;border-radius:4px}
.ros-badge-r{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);color:#00e5c0}
.ros-badge-p{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:#ff6b6b}
.ros-badge-m{background:rgba(255,159,67,.1);border:1px solid rgba(255,159,67,.3);color:#ff9f43}
.ros-badge-e{background:rgba(122,160,192,.07);border:1px solid rgba(122,160,192,.18);color:var(--npi-txt4)}
.ros-sys-hdr-acts{margin-left:auto;display:flex;gap:5px;flex-shrink:0}
.ros-btn-sys-deny{background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.25);border-radius:5px;padding:3px 10px;font-size:11px;color:#00e5c0;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.ros-btn-sys-deny:hover{background:rgba(0,229,192,.18)}
.ros-btn-sys-clear{background:transparent;border:1px solid var(--npi-bd);border-radius:5px;padding:3px 10px;font-size:11px;color:var(--npi-txt4);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.ros-btn-sys-clear:hover{border-color:rgba(255,107,107,.35);color:var(--npi-coral)}

/* Deny-all statement */
.ros-deny-stmt{display:flex;align-items:flex-start;gap:9px;padding:10px 14px;background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.18);border-radius:8px}
.ros-deny-ico{color:#00e5c0;font-size:13px;flex-shrink:0;margin-top:2px}
.ros-deny-txt{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(0,229,192,.75);font-style:italic;line-height:1.65}

/* Chips grid */
.ros-chips-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}

/* Symptom chip */
.ros-chip{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:8px;border:1px solid var(--npi-bd);background:rgba(14,37,68,.5);cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s,color .15s;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--npi-txt4);text-align:left;width:100%}
.ros-chip:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:rgba(14,37,68,.9)}
.ros-chip-a{background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.32);color:var(--npi-txt2)}
.ros-chip-p{background:rgba(255,107,107,.08);border-color:rgba(255,107,107,.32);color:#ff6b6b}
.ros-chip-kb{border-color:var(--npi-teal)!important;box-shadow:0 0 0 2px rgba(0,229,192,.16)!important;background:rgba(0,229,192,.05)!important;color:var(--npi-txt2)!important}
.ros-chip-p.ros-chip-kb{border-color:#ff6b6b!important;box-shadow:0 0 0 2px rgba(255,107,107,.16)!important}
.ros-chip-ico{font-size:11px;flex-shrink:0;width:14px;text-align:center;font-family:'JetBrains Mono',monospace}
.ros-chip-txt{flex:1;line-height:1.3;font-size:11.5px}
.ros-denies{font-family:'JetBrains Mono',monospace;font-size:9px;color:#00e5c0;margin-right:3px}
.ros-reports{font-family:'JetBrains Mono',monospace;font-size:9px;color:#ff6b6b;margin-right:3px}
.ros-chip-hint{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-teal);background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.25);border-radius:3px;padding:1px 5px;flex-shrink:0;white-space:nowrap}
.ros-chip-num{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;flex-shrink:0;min-width:16px;text-align:center}

/* Positive findings summary */
.ros-pos-strip{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:10px 14px;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.18);border-radius:8px}
.ros-pos-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:#ff6b6b;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.ros-pos-pill{font-family:'DM Sans',sans-serif;font-size:11px;color:#ff6b6b;background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.25);border-radius:20px;padding:2px 9px;white-space:nowrap}

/* Keyboard legend */
.ros-kb-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 16px;background:rgba(8,22,40,.95);border-top:1px solid rgba(26,53,85,.4);flex-shrink:0;opacity:.5;transition:opacity .25s,border-color .25s}
.ros-kb-bar.ros-kb-on{opacity:1;border-top-color:rgba(0,229,192,.2)}
.ros-kb-ico{font-size:11px;color:var(--npi-txt4);flex-shrink:0}
.ros-kb-item{display:flex;align-items:center;gap:4px}
.ros-kb-item kbd{font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;color:var(--npi-txt2);white-space:nowrap}
.ros-kb-item span{font-size:10px;color:var(--npi-txt4);white-space:nowrap}
.ros-kb-prompt{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);font-style:italic}

/* Mode toggle */
.ros-mode-toggle{display:flex;gap:0;border:1px solid var(--npi-bd);border-radius:6px;overflow:hidden;flex-shrink:0}
.ros-mode-btn{padding:3px 10px;font-size:10px;font-weight:500;font-family:'DM Sans',sans-serif;background:transparent;border:none;color:var(--npi-txt4);cursor:pointer;transition:all .15s}
.ros-mode-btn:hover{color:var(--npi-txt2);background:var(--npi-up)}
.ros-mode-btn.active{background:rgba(0,229,192,.12);color:var(--npi-teal);font-weight:600}
.ros-mode-btn+.ros-mode-btn{border-left:1px solid var(--npi-bd)}

/* Remainder banner */
.ros-remainder{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;border:1px dashed rgba(26,53,85,.8);background:rgba(8,22,40,.4);flex-wrap:wrap;margin-top:4px}
.ros-remainder-done{border-color:rgba(0,229,192,.25);background:rgba(0,229,192,.05)}
.ros-remainder-ico{color:#00e5c0;font-size:12px;flex-shrink:0}
.ros-remainder-txt{font-size:11px;color:var(--npi-txt3);flex:1}
.ros-remainder-pending{color:var(--npi-txt4) !important}
.ros-remainder-btn{padding:4px 12px;border-radius:5px;font-size:10px;font-weight:600;font-family:'DM Sans',sans-serif;background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);color:#00e5c0;cursor:pointer;transition:all .15s;white-space:nowrap}
.ros-remainder-btn:hover{background:rgba(0,229,192,.2)}
.ros-remainder-expand{padding:4px 10px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;background:transparent;border:1px solid var(--npi-bd);color:var(--npi-txt4);cursor:pointer;transition:all .15s;white-space:nowrap}
.ros-remainder-expand:hover{color:var(--npi-txt2);border-color:var(--npi-bhi)}
.ros-remainder-undo{padding:2px 8px;border-radius:4px;font-size:9px;font-family:'JetBrains Mono',monospace;background:transparent;border:1px solid rgba(26,53,85,.6);color:var(--npi-txt4);cursor:pointer;margin-left:auto}
.ros-remainder-undo:hover{color:var(--npi-coral);border-color:rgba(255,107,107,.3)}
`;