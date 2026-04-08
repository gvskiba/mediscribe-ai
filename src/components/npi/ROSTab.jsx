import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodySystemKeyboard } from '@/hooks/useBodySystemKeyboard';

// ─── SYSTEM & SYMPTOM DATA ────────────────────────────────────────────────────
const ROS_SYSTEMS = [
  {
    id: 'const', key: 'O', label: 'Constitutional', icon: '🌡️',
    denyAll: 'Denies fever, chills, fatigue, weight loss, night sweats, appetite changes',
    symptoms: [
      { id: 'fever',         label: 'Fever'                  },
      { id: 'chills',        label: 'Chills / rigors'        },
      { id: 'fatigue',       label: 'Fatigue / malaise'      },
      { id: 'wt-loss',       label: 'Weight loss'            },
      { id: 'wt-gain',       label: 'Weight gain'            },
      { id: 'night-sweat',   label: 'Night sweats'           },
      { id: 'anorexia',      label: 'Anorexia / poor appetite'},
      { id: 'dehydration',   label: 'Signs of dehydration'   },
      { id: 'generalized-weak', label: 'Generalized weakness'},
    ],
  },
  {
    id: 'heent', key: 'H', label: 'HEENT', icon: '👁️',
    denyAll: 'Denies headache, vision changes, ear pain, hearing loss, nasal congestion, sore throat',
    symptoms: [
      { id: 'headache',      label: 'Headache'               },
      { id: 'vision-chg',    label: 'Vision changes'         },
      { id: 'diplopia',      label: 'Diplopia'               },
      { id: 'eye-pain',      label: 'Eye pain / redness'     },
      { id: 'photophobia',   label: 'Photophobia'            },
      { id: 'eye-discharge', label: 'Eye discharge'          },
      { id: 'ear-pain',      label: 'Ear pain / otalgia'     },
      { id: 'hearing-loss',  label: 'Hearing loss'           },
      { id: 'tinnitus',      label: 'Tinnitus'               },
      { id: 'nasal-cong',    label: 'Nasal congestion'       },
      { id: 'rhinorrhea',    label: 'Rhinorrhea'             },
      { id: 'epistaxis',     label: 'Epistaxis'              },
      { id: 'sore-throat',   label: 'Sore throat'            },
      { id: 'hoarseness',    label: 'Hoarseness'             },
      { id: 'dental-pain',   label: 'Dental / jaw pain'      },
      { id: 'facial-pain',   label: 'Facial pain / pressure' },
      { id: 'mouth-sores',   label: 'Mouth sores / lesions'  },
    ],
  },
  {
    id: 'cv', key: 'C', label: 'Cardiovascular', icon: '❤️',
    denyAll: 'Denies chest pain, palpitations, dyspnea on exertion, syncope, leg swelling',
    symptoms: [
      { id: 'cp',             label: 'Chest pain / pressure'  },
      { id: 'chest-tight',    label: 'Chest tightness'        },
      { id: 'palpitations',   label: 'Palpitations'           },
      { id: 'doe',            label: 'Dyspnea on exertion'    },
      { id: 'orthopnea',      label: 'Orthopnea'              },
      { id: 'pnd',            label: 'PND'                    },
      { id: 'syncope',        label: 'Syncope'                },
      { id: 'presyncope',     label: 'Pre-syncope / near-faint'},
      { id: 'leg-swell',      label: 'Leg swelling / edema'   },
      { id: 'claudication',   label: 'Claudication'           },
      { id: 'cold-extremities',label: 'Cold extremities'      },
    ],
  },
  {
    id: 'resp', key: 'R', label: 'Respiratory', icon: '🫁',
    denyAll: 'Denies shortness of breath, cough, hemoptysis, wheezing, chest pain with breathing',
    symptoms: [
      { id: 'sob',            label: 'Shortness of breath'    },
      { id: 'dyspnea-rest',   label: 'Dyspnea at rest'        },
      { id: 'cough',          label: 'Cough (dry)'            },
      { id: 'prod-cough',     label: 'Productive cough'       },
      { id: 'hemoptysis',     label: 'Hemoptysis'             },
      { id: 'wheezing',       label: 'Wheezing'               },
      { id: 'pleuritic-cp',   label: 'Pleuritic chest pain'   },
      { id: 'apnea',          label: 'Apnea / snoring'        },
      { id: 'stridor',        label: 'Stridor'                },
    ],
  },
  {
    id: 'gi', key: 'G', label: 'GI / Abdomen', icon: '🫃',
    denyAll: 'Denies abdominal pain, nausea, vomiting, diarrhea, blood in stool',
    symptoms: [
      { id: 'abd-pain',       label: 'Abdominal pain'         },
      { id: 'nausea',         label: 'Nausea'                 },
      { id: 'vomiting',       label: 'Vomiting'               },
      { id: 'diarrhea',       label: 'Diarrhea'               },
      { id: 'constipation',   label: 'Constipation'           },
      { id: 'hematochezia',   label: 'Hematochezia'           },
      { id: 'melena',         label: 'Melena'                 },
      { id: 'hematemesis',    label: 'Hematemesis'            },
      { id: 'dysphagia',      label: 'Dysphagia'              },
      { id: 'odynophagia',    label: 'Odynophagia'            },
      { id: 'heartburn',      label: 'Heartburn / GERD'       },
      { id: 'bloating',       label: 'Bloating / distension'  },
      { id: 'flatulence',     label: 'Excessive flatulence'   },
      { id: 'jaundice',       label: 'Jaundice'               },
      { id: 'rectal-pain',    label: 'Rectal pain'            },
      { id: 'appetite-chg',   label: 'Appetite changes'       },
    ],
  },
  {
    id: 'gu', key: 'U', label: 'Genitourinary', icon: '🔵',
    denyAll: 'Denies dysuria, hematuria, urinary frequency, urgency, discharge',
    symptoms: [
      { id: 'dysuria',        label: 'Dysuria'                },
      { id: 'hematuria',      label: 'Hematuria'              },
      { id: 'frequency',      label: 'Urinary frequency'      },
      { id: 'urgency',        label: 'Urinary urgency'        },
      { id: 'nocturia',       label: 'Nocturia'               },
      { id: 'incontinence',   label: 'Incontinence'           },
      { id: 'retention',      label: 'Urinary retention'      },
      { id: 'discharge',      label: 'Urethral / vaginal discharge'},
      { id: 'pelvic-pain',    label: 'Pelvic pain'            },
      { id: 'vag-bleed',      label: 'Vaginal bleeding'       },
      { id: 'amenorrhea',     label: 'Amenorrhea'             },
      { id: 'testicular-pain',label: 'Testicular pain'        },
      { id: 'erectile',       label: 'Erectile dysfunction'   },
      { id: 'flank-pain',     label: 'Flank pain'             },
    ],
  },
  {
    id: 'msk', key: 'M', label: 'Musculoskeletal', icon: '🦴',
    denyAll: 'Denies joint pain, back pain, myalgia, joint swelling, morning stiffness',
    symptoms: [
      { id: 'joint-pain',     label: 'Joint pain / arthralgia'},
      { id: 'back-pain',      label: 'Back pain'              },
      { id: 'neck-pain',      label: 'Neck pain'              },
      { id: 'hip-pain',       label: 'Hip pain'               },
      { id: 'knee-pain',      label: 'Knee pain'              },
      { id: 'shoulder-pain',  label: 'Shoulder pain'          },
      { id: 'myalgia',        label: 'Myalgia'                },
      { id: 'muscle-cramps',  label: 'Muscle cramps'          },
      { id: 'weakness',       label: 'Focal weakness'         },
      { id: 'joint-swell',    label: 'Joint swelling'         },
      { id: 'stiffness',      label: 'Morning stiffness'      },
      { id: 'gait-chg',       label: 'Gait changes'           },
      { id: 'fracture',       label: 'Recent fracture'        },
    ],
  },
  {
    id: 'neuro', key: 'N', label: 'Neurological', icon: '🧠',
    denyAll: 'Denies dizziness, syncope, seizures, numbness, focal weakness, speech changes',
    symptoms: [
      { id: 'dizziness',      label: 'Dizziness / vertigo'    },
      { id: 'lightheaded',    label: 'Lightheadedness'        },
      { id: 'neuro-syncope',  label: 'Syncope / blackout'     },
      { id: 'seizure',        label: 'Seizure activity'       },
      { id: 'numbness',       label: 'Numbness / tingling'    },
      { id: 'focal-weak',     label: 'Focal weakness'         },
      { id: 'speech-chg',     label: 'Speech changes'         },
      { id: 'aphasia',        label: 'Difficulty finding words'},
      { id: 'memory-chg',     label: 'Memory / cognitive changes'},
      { id: 'vision-n',       label: 'Vision changes / loss'  },
      { id: 'tremor',         label: 'Tremor'                 },
      { id: 'coordination',   label: 'Balance / coordination issues'},
      { id: 'headache-n',     label: 'Headache'               },
      { id: 'facial-numb',    label: 'Facial numbness / droop'},
    ],
  },
  {
    id: 'psych', key: 'P', label: 'Psychiatric', icon: '🧘',
    denyAll: 'Denies depression, anxiety, suicidal/homicidal ideation, hallucinations, sleep disturbance',
    symptoms: [
      { id: 'depression',     label: 'Depression / hopelessness'},
      { id: 'anxiety',        label: 'Anxiety / excessive worry'},
      { id: 'panic',          label: 'Panic attacks'           },
      { id: 'si',             label: 'Suicidal ideation'       },
      { id: 'hi',             label: 'Homicidal ideation'      },
      { id: 'hallucin',       label: 'Hallucinations'          },
      { id: 'paranoia',       label: 'Paranoia / delusions'    },
      { id: 'sleep-dist',     label: 'Sleep disturbance'       },
      { id: 'insomnia',       label: 'Insomnia'                },
      { id: 'mood-chg',       label: 'Mood changes'            },
      { id: 'ptsd',           label: 'PTSD / trauma symptoms'  },
      { id: 'eating-dist',    label: 'Eating disturbance'      },
      { id: 'substance',      label: 'Substance use concerns'  },
    ],
  },
  {
    id: 'skin', key: 'S', label: 'Skin', icon: '🩹',
    denyAll: 'Denies rash, pruritus, new skin lesions, hair loss, nail changes',
    symptoms: [
      { id: 'rash',           label: 'Rash'                   },
      { id: 'pruritus',       label: 'Pruritus / itching'     },
      { id: 'new-lesion',     label: 'New skin lesion'        },
      { id: 'hair-loss',      label: 'Hair loss / alopecia'   },
      { id: 'nail-chg',       label: 'Nail changes'           },
      { id: 'nh-wound',       label: 'Non-healing wound'      },
      { id: 'skin-dryness',   label: 'Skin dryness / scaling' },
      { id: 'urticaria',      label: 'Hives / urticaria'      },
      { id: 'acne',           label: 'Acne / comedones'       },
      { id: 'petechiae-s',    label: 'Petechiae / purpura'    },
    ],
  },
  {
    id: 'endo', key: 'E', label: 'Endocrine', icon: '⚗️',
    denyAll: 'Denies polydipsia, polyuria, heat/cold intolerance, excessive sweating',
    symptoms: [
      { id: 'polydipsia',     label: 'Polydipsia'             },
      { id: 'polyuria',       label: 'Polyuria'               },
      { id: 'polyphagia',     label: 'Polyphagia'             },
      { id: 'heat-intol',     label: 'Heat intolerance'       },
      { id: 'cold-intol',     label: 'Cold intolerance'       },
      { id: 'thyroid-sx',     label: 'Thyroid symptoms'       },
      { id: 'exc-sweating',   label: 'Excessive sweating'     },
      { id: 'menstrual-irr',  label: 'Menstrual irregularity' },
      { id: 'hirsutism',      label: 'Hirsutism'              },
      { id: 'galactorrhea',   label: 'Galactorrhea'           },
    ],
  },
  {
    id: 'heme', key: 'B', label: 'Heme / Lymph', icon: '🩸',
    denyAll: 'Denies easy bruising, easy bleeding, lymphadenopathy, anemia symptoms',
    symptoms: [
      { id: 'bruising',       label: 'Easy bruising'          },
      { id: 'bleeding',       label: 'Easy / abnormal bleeding'},
      { id: 'lad',            label: 'Lymphadenopathy'        },
      { id: 'anemia-sx',      label: 'Anemia symptoms'        },
      { id: 'clot-hx',        label: 'Clotting / DVT history' },
      { id: 'petechiae-h',    label: 'Petechiae'              },
      { id: 'splenomeg',      label: 'Splenomegaly symptoms'  },
      { id: 'blood-tx',       label: 'Prior blood transfusion'},
    ],
  },
  {
    id: 'allergy', key: 'L', label: 'Allergic / Immuno', icon: '🌿',
    denyAll: 'Denies seasonal allergies, recurrent infections, asthma symptoms, food allergies',
    symptoms: [
      { id: 'seasonal',       label: 'Seasonal allergies'     },
      { id: 'food-allergy',   label: 'Food allergies'         },
      { id: 'asthma-sx',      label: 'Asthma symptoms'        },
      { id: 'recur-infx',     label: 'Recurrent infections'   },
      { id: 'drug-react',     label: 'Drug reactions'         },
      { id: 'anaphylaxis',    label: 'Anaphylaxis history'    },
      { id: 'autoimmune',     label: 'Autoimmune symptoms'    },
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

let _rosCustomIdCounter = 0;
function genCustomId() { return `ros-custom-${++_rosCustomIdCounter}-${Date.now()}`; }

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function SysItem({ sys, isActive, status, onClick }) {
  const dotBg = {
    reviewed:        '#00e5c0',
    'has-positives': '#ff6b6b',
    partial:         '#ff9f43',
    empty:           'transparent',
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

function SymptomChip({ symptom, value, kbFocused, onClick, onRemove }) {
  const isAbsent  = value === 'absent';
  const isPresent = value === 'present';
  const cls = ['ros-chip',
    isAbsent  ? 'ros-chip-a' : '',
    isPresent ? 'ros-chip-p' : '',
    kbFocused ? 'ros-chip-kb' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick}>
      <span className="ros-chip-ico">
        {isAbsent ? '✓' : isPresent ? '✕' : '○'}
      </span>
      <span className="ros-chip-txt">
        {isAbsent  ? <span className="ros-denies">Denies</span>   : null}
        {isPresent ? <span className="ros-reports">Reports</span> : null}
        {' '}{symptom.label}
      </span>
      {kbFocused && <span className="ros-chip-hint">↵ · X</span>}
      {onRemove && (
        <span className="ros-chip-remove" onClick={e => { e.stopPropagation(); onRemove(); }} title="Remove">×</span>
      )}
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

function KbLegend({ isFocused }) {
  const keys = [
    ['↑↓', 'navigate'], ['←→', 'system'], ['letter', 'jump'],
    ['Space', 'toggle'], ['↵', 'absent'], ['X', 'present'],
    ['⌘↵', 'deny all'], ['⌘⇧N', 'deny all sys'], ['Esc', 'exit'],
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
        <span className="ros-kb-prompt">Click panel to enable keyboard navigation</span>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ROSTab({ onStateChange, chiefComplaint }) {
  const [rosData, setRosData]               = useState(initRosData);
  const [customSymptoms, setCustomSymptoms] = useState({});  // { sysId: [{id, label}] }
  const [addingFor, setAddingFor]           = useState(null);
  const [customInput, setCustomInput]       = useState('');
  const sidebarRef  = useRef(null);
  const mainRef     = useRef(null);
  const addInputRef = useRef(null);

  // ── Action handlers ──────────────────────────────────────────────────────
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
        symptoms: Object.fromEntries([
          ...sys.symptoms.map(sym => [sym.id, 'absent']),
          ...(customSymptoms[sysId] || []).map(cs => [cs.id, 'absent']),
        ]),
      },
    }));
  }, [customSymptoms]);

  const markAllNormal = useCallback(() => {
    const updated = {};
    ROS_SYSTEMS.forEach(s => {
      updated[s.id] = {
        symptoms: Object.fromEntries([
          ...s.symptoms.map(sym => [sym.id, 'absent']),
          ...(customSymptoms[s.id] || []).map(cs => [cs.id, 'absent']),
        ]),
      };
    });
    setRosData(updated);
  }, [customSymptoms]);

  const clearSystem = useCallback((sysId) => {
    const sys = ROS_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    setRosData(prev => ({
      ...prev,
      [sysId]: {
        symptoms: Object.fromEntries([
          ...sys.symptoms.map(sym => [sym.id, null]),
          ...(customSymptoms[sysId] || []).map(cs => [cs.id, null]),
        ]),
      },
    }));
  }, [customSymptoms]);

  const clearAll = useCallback(() => setRosData(initRosData()), []);

  // ── Custom symptom handlers ──────────────────────────────────────────────
  const handleAddCustomSymptom = useCallback((sysId, label) => {
    if (!label.trim()) return;
    const id = genCustomId();
    setCustomSymptoms(prev => ({
      ...prev,
      [sysId]: [...(prev[sysId] || []), { id, label: label.trim() }],
    }));
    setRosData(prev => ({
      ...prev,
      [sysId]: {
        ...prev[sysId],
        symptoms: { ...prev[sysId]?.symptoms, [id]: null },
      },
    }));
    setCustomInput('');
    setAddingFor(null);
  }, []);

  const handleRemoveCustomSymptom = useCallback((sysId, symId) => {
    setCustomSymptoms(prev => ({
      ...prev,
      [sysId]: (prev[sysId] || []).filter(cs => cs.id !== symId),
    }));
    setRosData(prev => {
      const newSym = { ...prev[sysId]?.symptoms };
      delete newSym[symId];
      return { ...prev, [sysId]: { ...prev[sysId], symptoms: newSym } };
    });
  }, []);

  const startAdding = useCallback((sysId) => {
    setAddingFor(sysId);
    setCustomInput('');
    setTimeout(() => addInputRef.current?.focus(), 50);
  }, []);

  // ── Keyboard hook ────────────────────────────────────────────────────────
  const {
    activeSystemIdx, setActiveSystemIdx,
    activeFindingIdx, setActiveFindingIdx,
    isFocused, panelProps, goToSystem,
  } = useBodySystemKeyboard({
    systems: ROS_SYSTEMS,
    onFindingAction: handleFindingAction,
    onSystemNormal:  markSystemNormal,
    onAllNormal:     markAllNormal,
  });

  const activeSys  = ROS_SYSTEMS[activeSystemIdx];
  const sysData    = rosData[activeSys?.id] || { symptoms: {} };
  const sysStatus  = getSysStatus(sysData.symptoms);
  const sysCustoms = customSymptoms[activeSys?.id] || [];

  // ── Sync to parent ───────────────────────────────────────────────────────
  useEffect(() => {
    const newState = {};
    ROS_SYSTEMS.forEach(s => {
      const st = getSysStatus(rosData[s.id]?.symptoms || {});
      if (st !== 'empty') newState[s.id] = st;
    });
    onStateChange?.(newState);
  }, [rosData, onStateChange]);

  useEffect(() => {
    const el = sidebarRef.current?.querySelector(`[data-sysid='${activeSys?.id}']`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSystemIdx, activeSys?.id]);

  useEffect(() => {
    if (activeFindingIdx >= 0) {
      const el = mainRef.current?.querySelector(`[data-sidx='${activeFindingIdx}']`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeFindingIdx]);

  const totalSystems    = ROS_SYSTEMS.length;
  const reviewedSystems = ROS_SYSTEMS.filter(s => getSysStatus(rosData[s.id]?.symptoms || {}) !== 'empty').length;
  const positiveSystems = ROS_SYSTEMS.filter(s => getSysStatus(rosData[s.id]?.symptoms || {}) === 'has-positives').length;
  const showDenyAll     = sysStatus === 'reviewed';

  return (
    <>
      <style>{ROS_CSS}</style>
      <div className={`ros-wrap${isFocused ? ' ros-focused' : ''}`} {...panelProps}>

        {/* ── HEADER BAR ───────────────────────────────────────────────── */}
        <div className="ros-hdr">
          <span className="ros-hdr-title">Review of Systems</span>
          {chiefComplaint && (
            <span className="ros-hdr-cc">CC: {chiefComplaint}</span>
          )}
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
            <button className="ros-btn-clear-all" onClick={clearAll}>✕ Clear All</button>
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="ros-body">

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <div className="ros-sidebar" ref={sidebarRef}>
            {ROS_SYSTEMS.map((s, i) => (
              <div key={s.id} data-sysid={s.id}>
                <SysItem
                  sys={s}
                  isActive={i === activeSystemIdx}
                  status={getSysStatus(rosData[s.id]?.symptoms || {})}
                  onClick={() => {
                    setActiveSystemIdx(i);
                    setActiveFindingIdx(-1);
                    setAddingFor(null);
                    panelProps.ref.current?.focus();
                  }}
                />
              </div>
            ))}
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
                    onClick={() => {
                      handleFindingAction('toggle', activeSys.id, sym.id);
                      setActiveFindingIdx(si);
                      panelProps.ref.current?.focus();
                    }}
                  />
                </div>
              ))}

              {/* Custom symptom chips */}
              {sysCustoms.map(cs => (
                <SymptomChip
                  key={cs.id}
                  symptom={cs}
                  value={sysData.symptoms[cs.id]}
                  kbFocused={false}
                  onClick={() => handleFindingAction('toggle', activeSys.id, cs.id)}
                  onRemove={() => handleRemoveCustomSymptom(activeSys.id, cs.id)}
                />
              ))}
            </div>

            {/* Add Custom Symptom */}
            <div className="ros-add-custom">
              {addingFor === activeSys?.id ? (
                <div className="ros-add-input-row">
                  <input
                    ref={addInputRef}
                    className="ros-add-input"
                    placeholder="Custom symptom label…"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCustomSymptom(activeSys.id, customInput);
                      if (e.key === 'Escape') { setAddingFor(null); setCustomInput(''); }
                    }}
                  />
                  <button
                    className="ros-add-confirm"
                    onClick={() => handleAddCustomSymptom(activeSys.id, customInput)}
                  >Add</button>
                  <button
                    className="ros-add-cancel"
                    onClick={() => { setAddingFor(null); setCustomInput(''); }}
                  >✕</button>
                </div>
              ) : (
                <button
                  className="ros-add-btn"
                  onClick={() => startAdding(activeSys?.id)}
                >+ Add Custom Symptom</button>
              )}
            </div>

            {/* Positive findings summary strip */}
            {sysStatus === 'has-positives' && (
              <div className="ros-pos-strip">
                <span className="ros-pos-label">Reported:</span>
                {[...( activeSys?.symptoms || []), ...sysCustoms]
                  .filter(sym => sysData.symptoms[sym.id] === 'present')
                  .map(sym => (
                    <span key={sym.id} className="ros-pos-pill">{sym.label}</span>
                  ))
                }
              </div>
            )}

          </div>{/* /ros-main */}
        </div>{/* /ros-body */}

        <KbLegend isFocused={isFocused} />
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const ROS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

.ros-wrap{display:flex;flex-direction:column;height:100%;background:var(--npi-bg);border-radius:12px;border:1px solid var(--npi-bd);overflow:hidden;transition:border-color .2s,box-shadow .2s}
.ros-wrap.ros-focused{border-color:rgba(0,229,192,.35);box-shadow:0 0 0 1px rgba(0,229,192,.1),0 0 40px rgba(0,229,192,.04)}

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

.ros-body{display:grid;grid-template-columns:208px 1fr;flex:1;overflow:hidden;min-height:0}

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

.ros-main{overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.ros-main::-webkit-scrollbar{width:3px}
.ros-main::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

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

.ros-deny-stmt{display:flex;align-items:flex-start;gap:9px;padding:10px 14px;background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.18);border-radius:8px}
.ros-deny-ico{color:#00e5c0;font-size:13px;flex-shrink:0;margin-top:2px}
.ros-deny-txt{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(0,229,192,.75);font-style:italic;line-height:1.65}

.ros-chips-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}

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
.ros-chip-remove{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--npi-txt4);background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);border-radius:3px;padding:0 5px;flex-shrink:0;line-height:1.4;transition:all .12s}
.ros-chip-remove:hover{background:rgba(255,107,107,.22);color:#ff6b6b;border-color:rgba(255,107,107,.5)}

/* Add custom symptom */
.ros-add-custom{margin-top:2px}
.ros-add-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;font-size:11px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;background:transparent;border:1px dashed rgba(0,229,192,.25);color:var(--npi-teal);transition:all .15s;opacity:.6}
.ros-add-btn:hover{opacity:1;background:rgba(0,229,192,.06);border-color:rgba(0,229,192,.45)}
.ros-add-input-row{display:flex;align-items:center;gap:6px}
.ros-add-input{flex:1;background:rgba(14,37,68,.7);border:1px solid rgba(0,229,192,.3);border-radius:7px;padding:6px 10px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;transition:border-color .15s}
.ros-add-input:focus{border-color:var(--npi-teal)}
.ros-add-input::placeholder{color:var(--npi-txt4)}
.ros-add-confirm{background:rgba(0,229,192,.12);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:5px 11px;font-size:11px;font-weight:600;color:var(--npi-teal);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.ros-add-confirm:hover{background:rgba(0,229,192,.24)}
.ros-add-cancel{background:transparent;border:1px solid var(--npi-bd);border-radius:6px;padding:5px 9px;font-size:11px;color:var(--npi-txt4);cursor:pointer;transition:all .15s;font-family:'JetBrains Mono',monospace}
.ros-add-cancel:hover{border-color:rgba(255,107,107,.35);color:var(--npi-coral)}

.ros-pos-strip{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:10px 14px;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.18);border-radius:8px}
.ros-pos-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:#ff6b6b;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
.ros-pos-pill{font-family:'DM Sans',sans-serif;font-size:11px;color:#ff6b6b;background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.25);border-radius:20px;padding:2px 9px;white-space:nowrap}

.ros-kb-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 16px;background:rgba(8,22,40,.95);border-top:1px solid rgba(26,53,85,.4);flex-shrink:0;opacity:.5;transition:opacity .25s,border-color .25s}
.ros-kb-bar.ros-kb-on{opacity:1;border-top-color:rgba(0,229,192,.2)}
.ros-kb-ico{font-size:11px;color:var(--npi-txt4);flex-shrink:0}
.ros-kb-item{display:flex;align-items:center;gap:4px}
.ros-kb-item kbd{font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;color:var(--npi-txt2);white-space:nowrap}
.ros-kb-item span{font-size:10px;color:var(--npi-txt4);white-space:nowrap}
.ros-kb-prompt{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);font-style:italic}
`;