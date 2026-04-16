import { useState, useEffect, useCallback, useRef } from 'react';

// ─── SYSTEM & FINDING DATA ────────────────────────────────────────────────────
const PE_SYSTEMS = [
  {
    id: 'gen', key: 'G', label: 'General', icon: '🧍',
    normal: 'Well-appearing, in no acute distress',
    findings: [
      { id: 'well-app',    label: 'Well-appearing',       isNormal: true  },
      { id: 'nad',         label: 'No acute distress',    isNormal: true  },
      { id: 'ill',         label: 'Ill-appearing'                         },
      { id: 'toxic',       label: 'Toxic-appearing'                       },
      { id: 'diaphoretic', label: 'Diaphoretic'                           },
      { id: 'pale',        label: 'Pale'                                  },
      { id: 'cachectic',   label: 'Cachectic'                             },
      { id: 'agitated',    label: 'Agitated'                              },
      { id: 'obese',       label: 'Obese'                                 },
    ],
  },
  {
    id: 'heent', key: 'H', label: 'HEENT', icon: '👁️',
    normal: 'Normocephalic/atraumatic, PERRL, TMs clear, oropharynx clear',
    findings: [
      { id: 'nc-at',     label: 'NC/AT',                   isNormal: true },
      { id: 'perrl',     label: 'PERRL',                   isNormal: true },
      { id: 'tms-clear', label: 'TMs clear',               isNormal: true },
      { id: 'op-clear',  label: 'Oropharynx clear',        isNormal: true },
      { id: 'conj-inj',  label: 'Conjunctival injection'                  },
      { id: 'scleral',   label: 'Scleral icterus'                         },
      { id: 'nystagmus', label: 'Nystagmus'                               },
      { id: 'tm-ery',    label: 'TM erythema / bulging'                   },
      { id: 'tonsil',    label: 'Tonsillar exudates'                      },
      { id: 'dry-mm',    label: 'Dry mucous membranes'                    },
    ],
  },
  {
    id: 'neck', key: 'K', label: 'Neck', icon: '🔵',
    normal: 'Supple, no lymphadenopathy, no JVD',
    findings: [
      { id: 'supple',    label: 'Supple',              isNormal: true },
      { id: 'no-lad',    label: 'No lymphadenopathy',  isNormal: true },
      { id: 'no-jvd',    label: 'No JVD',              isNormal: true },
      { id: 'meningism', label: 'Meningismus'                          },
      { id: 'jvd',       label: 'JVD elevated'                        },
      { id: 'lad',       label: 'Lymphadenopathy'                     },
      { id: 'thyromeg',  label: 'Thyromegaly'                         },
      { id: 'trachdev',  label: 'Tracheal deviation'                  },
    ],
  },
  {
    id: 'cv', key: 'C', label: 'Cardiovascular', icon: '❤️',
    normal: 'Regular rate and rhythm, no murmurs, rubs, or gallops',
    findings: [
      { id: 'rrr',       label: 'Regular rate and rhythm',       isNormal: true },
      { id: 'no-mrg',    label: 'No murmurs / rubs / gallops',   isNormal: true },
      { id: 'murmur',    label: 'Murmur'                                        },
      { id: 'irregular', label: 'Irregular rhythm'                              },
      { id: 'tachy',     label: 'Tachycardic'                                   },
      { id: 'brady',     label: 'Bradycardic'                                   },
      { id: 'gallop',    label: 'S3 / S4 gallop'                               },
      { id: 'rub',       label: 'Pericardial rub'                               },
      { id: 'dim-pulses',label: 'Diminished pulses'                             },
    ],
  },
  {
    id: 'resp', key: 'R', label: 'Respiratory', icon: '🫁',
    normal: 'Clear to auscultation bilaterally, no wheezes, rales, or rhonchi',
    findings: [
      { id: 'ctab',       label: 'CTAB',                       isNormal: true },
      { id: 'wheezes',    label: 'Wheezes'                                    },
      { id: 'rales',      label: 'Rales / crackles'                          },
      { id: 'rhonchi',    label: 'Rhonchi'                                   },
      { id: 'dim-bs',     label: 'Diminished breath sounds'                  },
      { id: 'stridor',    label: 'Stridor'                                   },
      { id: 'retractions',label: 'Retractions'                               },
      { id: 'access-mm',  label: 'Accessory muscle use'                      },
      { id: 'pleural-rub',label: 'Pleural rub'                               },
    ],
  },
  {
    id: 'abd', key: 'A', label: 'Abdomen', icon: '🫃',
    normal: 'Soft, non-tender, non-distended, normal bowel sounds',
    findings: [
      { id: 'soft',      label: 'Soft',                       isNormal: true },
      { id: 'ntnd',      label: 'Non-tender / non-distended', isNormal: true },
      { id: 'nbs',       label: 'Normal bowel sounds',        isNormal: true },
      { id: 'tender',    label: 'Tenderness'                                 },
      { id: 'guarding',  label: 'Guarding'                                   },
      { id: 'rigidity',  label: 'Rigidity'                                   },
      { id: 'rebound',   label: 'Rebound tenderness'                         },
      { id: 'distended', label: 'Distended'                                  },
      { id: 'hsm',       label: 'Hepatosplenomegaly'                         },
      { id: 'mass',      label: 'Palpable mass'                              },
      { id: 'mcburney',  label: "McBurney's point tender"                    },
      { id: 'murphy',    label: "Murphy's sign"                              },
      { id: 'psoas',     label: 'Psoas sign'                                 },
      { id: 'hyper-bs',  label: 'Hyperactive bowel sounds'                   },
      { id: 'absent-bs', label: 'Absent bowel sounds'                        },
    ],
  },
  {
    id: 'msk', key: 'M', label: 'MSK', icon: '🦴',
    normal: 'Normal range of motion, no swelling or deformity',
    findings: [
      { id: 'full-rom',    label: 'Full ROM',             isNormal: true },
      { id: 'no-swelling', label: 'No swelling',          isNormal: true },
      { id: 'swelling',    label: 'Joint swelling'                       },
      { id: 'deformity',   label: 'Deformity'                            },
      { id: 'tenderness',  label: 'Bony / joint tenderness'              },
      { id: 'dec-rom',     label: 'Decreased ROM'                        },
      { id: 'crepitus',    label: 'Crepitus'                             },
      { id: 'effusion',    label: 'Joint effusion'                       },
    ],
  },
  {
    id: 'neuro', key: 'N', label: 'Neurological', icon: '🧠',
    normal: 'Alert and oriented ×4, CN II–XII intact, strength 5/5',
    findings: [
      { id: 'aox4',        label: 'A&O ×4',                  isNormal: true },
      { id: 'cn-intact',   label: 'CN II–XII intact',         isNormal: true },
      { id: 'strength-55', label: 'Strength 5/5',             isNormal: true },
      { id: 'focal',       label: 'Focal neurologic deficit'               },
      { id: 'weakness',    label: 'Weakness'                               },
      { id: 'ataxia',      label: 'Ataxia'                                 },
      { id: 'dysarthria',  label: 'Dysarthria'                             },
      { id: 'confusion',   label: 'Confusion / altered MS'                 },
      { id: 'drift',       label: 'Pronator drift'                         },
      { id: 'dec-sens',    label: 'Decreased sensation'                    },
      { id: 'abn-reflex',  label: 'Abnormal reflexes'                      },
    ],
  },
  {
    id: 'skin', key: 'S', label: 'Skin', icon: '🩹',
    normal: 'Warm, dry, intact — no rashes or lesions',
    findings: [
      { id: 'warm-dry',   label: 'Warm and dry',      isNormal: true },
      { id: 'intact',     label: 'Skin intact',       isNormal: true },
      { id: 'rash',       label: 'Rash'                              },
      { id: 'pallor',     label: 'Pallor'                            },
      { id: 'cyanosis',   label: 'Cyanosis'                          },
      { id: 'jaundice',   label: 'Jaundice'                          },
      { id: 'diaphoresis',label: 'Diaphoresis'                       },
      { id: 'edema',      label: 'Edema'                             },
      { id: 'petechiae',  label: 'Petechiae / purpura'               },
      { id: 'wound',      label: 'Wound / laceration'                },
    ],
  },
  {
    id: 'psych', key: 'P', label: 'Psychiatric', icon: '🧘',
    normal: 'Normal mood and affect, cooperative, appropriate judgment',
    findings: [
      { id: 'normal-ma',   label: 'Normal mood / affect', isNormal: true },
      { id: 'cooperative', label: 'Cooperative',           isNormal: true },
      { id: 'flat-affect', label: 'Flat / blunted affect'               },
      { id: 'anxious',     label: 'Anxious'                             },
      { id: 'depressed',   label: 'Depressed mood'                      },
      { id: 'agitated-p',  label: 'Agitated / combative'                },
      { id: 'si',          label: 'Suicidal ideation'                   },
      { id: 'hi',          label: 'Homicidal ideation'                  },
      { id: 'hallucin',    label: 'Hallucinations'                      },
      { id: 'disorg',      label: 'Disorganized thought'                },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getSysStatus(findings) {
  const vals = Object.values(findings || {}).filter(v => v !== null && v !== undefined);
  if (!vals.length) return 'empty';
  const hasAbn  = vals.some(v => v === 'abnormal');
  const hasNorm = vals.some(v => v === 'normal');
  if (hasAbn && hasNorm) return 'mixed';
  if (hasAbn)  return 'abnormal';
  if (hasNorm) return 'normal';
  return 'empty';
}

function initExamData() {
  const d = {};
  PE_SYSTEMS.forEach(s => {
    d[s.id] = {
      findings: Object.fromEntries(s.findings.map(f => [f.id, null])),
      note: '',
    };
  });
  return d;
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function SysItem({ sys, isActive, status, onClick }) {
  const dotBg = {
    normal:   '#00e5c0',
    abnormal: '#ff6b6b',
    mixed:    '#ff9f43',
    empty:    'transparent',
  }[status];
  const dotBorder = status === 'empty' ? '1.5px solid #2a4f7a' : 'none';
  return (
    <button className={`pe-sys-item${isActive ? ' pe-active' : ''}`} onClick={onClick}>
      <span className="pe-sys-key">{sys.key}</span>
      <span className="pe-sys-ico">{sys.icon}</span>
      <span className="pe-sys-lbl">{sys.label}</span>
      <span className="pe-sys-dot" style={{ background: dotBg, border: dotBorder }} />
    </button>
  );
}

function FindingChip({ finding, value, kbFocused, kbIndex, onClick }) {
  const isNormal   = value === 'normal';
  const isAbnormal = value === 'abnormal';
  const cls = ['pe-chip',
    isNormal   ? 'pe-chip-n' : '',
    isAbnormal ? 'pe-chip-a' : '',
    kbFocused  ? 'pe-chip-kb' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick}>
      {kbIndex != null && (
        <span className="pe-chip-num">{kbIndex}</span>
      )}
      <span className="pe-chip-ico">
        {isNormal ? '✓' : isAbnormal ? '✕' : '○'}
      </span>
      <span className="pe-chip-txt">{finding.label}</span>
      {kbFocused && <span className="pe-chip-hint">↵ · X</span>}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    normal:   { cls: 'pe-badge-n', txt: '✓ Normal'       },
    abnormal: { cls: 'pe-badge-a', txt: '✕ Abnormal'     },
    mixed:    { cls: 'pe-badge-m', txt: '⚠ Mixed'        },
    empty:    { cls: 'pe-badge-e', txt: '○ Not assessed' },
  };
  const { cls, txt } = map[status] || map.empty;
  return <span className={`pe-badge ${cls}`}>{txt}</span>;
}

function KbLegend({ isFocused }) {
  const keys = [
    ['↑↓', 'navigate'], ['←→', 'system'], ['letter', 'jump'],
    ['1–9', 'quick pick'], ['Space', 'toggle'], ['↵', 'normal'], ['X', 'abnormal'],
    ['⌘↵', 'sys normal'], ['⌘⇧N', 'all normal'], ['⌘F', 'mode'], ['⌘R', 'rest norm'], ['⌘V', 'visual'], ['Esc', 'exit'],
  ];
  return (
    <div className={`pe-kb-bar${isFocused ? ' pe-kb-on' : ''}`}>
      <span className="pe-kb-ico">⌨</span>
      {keys.map(([k, d]) => (
        <span key={k} className="pe-kb-item">
          <kbd>{k}</kbd>
          <span>{d}</span>
        </span>
      ))}
      {!isFocused && (
        <span className="pe-kb-prompt">Click panel to enable keyboard navigation</span>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ─── CC → FOCUSED PE SYSTEM MAPPING ─────────────────────────────────────────
const PE_CC_MAP = [
  { kws:['chest','palpitat','syncope'],  ids:['gen','cv','resp']              },
  { kws:['breath','cough','wheez'],      ids:['gen','resp','cv']              },
  { kws:['abdom','stomach','nausea'],    ids:['gen','abd','cv']               },
  { kws:['headache','dizzi','neuro'],    ids:['gen','neuro','heent']          },
  { kws:['back','lumbar'],              ids:['gen','msk','abd']              },
  { kws:['joint','arthr','msk'],         ids:['gen','msk','skin']             },
  { kws:['trauma','injur','fall'],       ids:['gen','msk','neuro','skin']     },
  { kws:['fever','infect','sepsis'],     ids:['gen','heent','cv','resp','abd']},
  { kws:['rash','skin'],                ids:['gen','skin']                   },
  { kws:['urin','dysuria'],             ids:['gen','abd']                    },
  { kws:['anxiet','panic','psych'],      ids:['gen','psych','cv']             },
  { kws:['weak','stroke','neuro'],       ids:['gen','neuro','cv']             },
];
function getFocusedPeIds(cc) {
  if (!cc) return ['gen','cv','resp','abd'];
  const lc = cc.toLowerCase();
  for (const { kws, ids } of PE_CC_MAP) {
    if (kws.some(kw => lc.includes(kw))) return ids;
  }
  return ['gen','cv','resp','abd'];
}

export default function PETab({ peState, setPeState, peFindings, setPeFindings, onAdvance, extSysIdx, onSysChange, chiefComplaint, onNarrative }) {
  const [examData, setExamData] = useState(initExamData);
  const [docMode,          setDocMode]          = useState('focused'); // 'focused'|'full'|'visual'
  const [remainderNormal,  setRemainderNormal]  = useState(false);
  const [visualAppearance, setVisualAppearance] = useState('');
  const [visualNotes,      setVisualNotes]      = useState('');
  // ── Narrative generator state ──────────────────────────────────────────
  const [peNarrative,   setPeNarrative]   = useState('');
  const [narrativeBusy, setNarrativeBusy] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);
  const [narrativeCopied, setNarrativeCopied] = useState(false);
  const mainRef = useRef(null);

  // ── PE narrative generator ──────────────────────────────────────────────
  const generatePENarrative = useCallback(async () => {
    // Build a structured summary of all documented findings
    const lines = [];
    PE_SYSTEMS.forEach(sys => {
      const data = examData[sys.id];
      if (!data) return;
      const normal   = sys.findings.filter(f => data.findings[f.id] === 'normal').map(f => f.label);
      const abnormal = sys.findings.filter(f => data.findings[f.id] === 'abnormal').map(f => f.label);
      const note     = data.note?.trim();
      if (!normal.length && !abnormal.length && !note) return;
      const parts = [];
      if (normal.length)   parts.push(`Normal: ${normal.join(', ')}`);
      if (abnormal.length) parts.push(`Abnormal: ${abnormal.join(', ')}`);
      if (note)            parts.push(`Note: ${note}`);
      lines.push(`${sys.label}: ${parts.join(' | ')}`);
    });

    if (remainderNormal) lines.push('Remaining systems: examined, all normal');

    if (!lines.length) return;

    setNarrativeBusy(true);
    setShowNarrative(true);
    setPeNarrative('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are an emergency physician writing a structured physical exam note.
Convert the provided structured findings into a concise, professional physical exam narrative.

Rules:
- One sentence per organ system, in this order: General, HEENT, Neck, Cardiovascular, Respiratory, Abdomen, MSK, Neurological, Skin, Psychiatric
- Use standard medical abbreviations (A&O x4, RRR, CTAB, S/NT/ND, etc.)
- Omit systems with no documented findings entirely
- Lead with normal findings, end with abnormals
- Write as a continuous paragraph, systems separated by a period and space
- Do not add headers, bullets, or explanations — only the exam text itself
- Keep it under 120 words`,
          messages: [{
            role: 'user',
            content: `Chief complaint: ${chiefComplaint || 'not specified'}\n\nFindings:\n${lines.join('\n')}`,
          }],
        }),
      });
      const data = await res.json();
      setPeNarrative(data.content?.[0]?.text?.trim() || 'Generation failed — please try again.');
      onNarrative?.(data.content?.[0]?.text?.trim() || '');
    } catch {
      setPeNarrative('⚠ Connection error — check network and retry.');
    } finally {
      setNarrativeBusy(false);
    }
  }, [examData, remainderNormal, chiefComplaint, onNarrative]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleFindingAction = useCallback((action, sysId, findingId) => {
    setExamData(prev => {
      const cur = prev[sysId]?.findings[findingId];
      const next =
        action === 'toggle'   ? (cur === null ? 'normal' : cur === 'normal' ? 'abnormal' : null)
        : action === 'normal'   ? (cur === 'normal' ? null : 'normal')
        : action === 'abnormal' ? (cur === 'abnormal' ? null : 'abnormal')
        : null;
      return {
        ...prev,
        [sysId]: {
          ...prev[sysId],
          findings: { ...prev[sysId].findings, [findingId]: next },
        },
      };
    });
  }, []);

  const markSystemNormal = useCallback((sysId) => {
    const sys = PE_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    setExamData(prev => ({
      ...prev,
      [sysId]: {
        ...prev[sysId],
        findings: Object.fromEntries(
          sys.findings.map(f => [f.id, f.isNormal ? 'normal' : null])
        ),
      },
    }));
  }, []);

  const markAllNormal = useCallback(() => {
    const updated = {};
    PE_SYSTEMS.forEach(s => {
      updated[s.id] = {
        findings: Object.fromEntries(s.findings.map(f => [f.id, f.isNormal ? 'normal' : null])),
        note: '',
      };
    });
    setExamData(updated);
  }, []);

  const clearSystem = useCallback((sysId) => {
    const sys = PE_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    setExamData(prev => ({
      ...prev,
      [sysId]: {
        ...prev[sysId],
        findings: Object.fromEntries(sys.findings.map(f => [f.id, null])),
      },
    }));
  }, []);

  const clearAll = useCallback(() => setExamData(initExamData()), []);

  // ── Visible systems (focused mode filter) ────────────────────────────────
  const focusedPeIds  = getFocusedPeIds(chiefComplaint);
  const visiblePeSys  = docMode === 'full' ? PE_SYSTEMS : PE_SYSTEMS.filter(s => focusedPeIds.includes(s.id));
  const hiddenPeCount = PE_SYSTEMS.length - visiblePeSys.length;

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
      const activeSysData = PE_SYSTEMS[activeSystemIdx];
      const symCount      = activeSysData?.findings.length ?? 0;

      // Esc: first press blurs, second press advances
      if (k === 'Escape') {
        if (isFocused) { el.blur(); }
        else if (onAdvance) { onAdvance(); }
        return;
      }

      // ⌘→ — advance to MDM
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
        e.preventDefault(); setRemainderNormal(r => !r); return;
      }
      if (cmd && (k === 'v' || k === 'V')) {
        e.preventDefault(); setDocMode(m => m === 'visual' ? 'focused' : 'visual'); return;
      }

      if (k === 'ArrowLeft') {
        e.preventDefault();
        const visCur = visiblePeSys.findIndex(s => s.id === activeSysData?.id);
        const prev   = visiblePeSys[Math.max(0, visCur - 1)];
        if (prev) setActiveSystemIdx(PE_SYSTEMS.findIndex(s => s.id === prev.id));
        setActiveFindingIdx(-1); return;
      }
      if (k === 'ArrowRight') {
        e.preventDefault();
        const visCur = visiblePeSys.findIndex(s => s.id === activeSysData?.id);
        const next   = visiblePeSys[Math.min(visiblePeSys.length - 1, visCur + 1)];
        if (next) setActiveSystemIdx(PE_SYSTEMS.findIndex(s => s.id === next.id));
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
          const f = activeSysData.findings[activeFindingIdx];
          if (f) handleFindingAction('toggle', activeSysData.id, f.id);
        }
        return;
      }
      if (k === 'Enter') {
        if (activeFindingIdx >= 0 && activeSysData) {
          const f = activeSysData.findings[activeFindingIdx];
          if (f) handleFindingAction('normal', activeSysData.id, f.id);
        }
        return;
      }
      if (k === 'x' || k === 'X') {
        if (activeFindingIdx >= 0 && activeSysData) {
          const f = activeSysData.findings[activeFindingIdx];
          if (f) handleFindingAction('abnormal', activeSysData.id, f.id);
        }
        return;
      }
      if (/^[A-Za-z]$/.test(k) && !cmd) {
        const sysIdx = visiblePeSys.findIndex(s => s.key === k.toUpperCase());
        if (sysIdx !== -1) {
          setActiveSystemIdx(PE_SYSTEMS.findIndex(s => s.id === visiblePeSys[sysIdx].id));
          setActiveFindingIdx(-1);
        }
      }
    }
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [activeSystemIdx, activeFindingIdx, isFocused, visiblePeSys, handleFindingAction, markSystemNormal, markAllNormal, onAdvance]); // eslint-disable-line

  // Auto-focus on mount — keyboard-first from the first render
  useEffect(() => {
    const t = setTimeout(focus, 60);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const activeSys  = PE_SYSTEMS[activeSystemIdx];
  const sysData    = examData[activeSys?.id] || { findings: {}, note: '' };
  const sysStatus  = getSysStatus(sysData.findings);

  // ── Sync to parent ───────────────────────────────────────────────────────
  useEffect(() => {
    const newState    = {};
    const newFindings = {};
    PE_SYSTEMS.forEach(s => {
      const st = getSysStatus(examData[s.id]?.findings || {});
      if (st !== 'empty') {
        newState[s.id]    = st;
        newFindings[s.id] = examData[s.id];
      }
    });
    if (remainderNormal)  newState._remainderNormal = true;
    if (docMode === 'visual' && (visualAppearance || visualNotes)) {
      newState._visual = { appearance: visualAppearance, notes: visualNotes };
    }
    setPeState(newState);
    setPeFindings(newFindings);
  }, [examData, remainderNormal, docMode, visualAppearance, visualNotes, setPeState, setPeFindings]);

  // ── Two-way sync with parent rail ────────────────────────────────────────
  useEffect(() => {
    if (extSysIdx !== undefined && extSysIdx !== activeSystemIdx) {
      setActiveSystemIdx(extSysIdx);
      setActiveFindingIdx(-1);
    }
  }, [extSysIdx]); // eslint-disable-line

  useEffect(() => {
    onSysChange?.(activeSystemIdx);
  }, [activeSystemIdx, onSysChange]);

  // ── Auto-scroll main area to focused chip ────────────────────────────────
  useEffect(() => {
    if (activeFindingIdx >= 0) {
      const el = mainRef.current?.querySelector(`[data-fidx='${activeFindingIdx}']`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeFindingIdx]);

  // ── Computed stats ───────────────────────────────────────────────────────
  const totalSystems    = PE_SYSTEMS.length;
  const assessedSystems = PE_SYSTEMS.filter(s => getSysStatus(examData[s.id]?.findings || {}) !== 'empty').length;
  const abnormalSystems = PE_SYSTEMS.filter(s => {
    const st = getSysStatus(examData[s.id]?.findings || {});
    return st === 'abnormal' || st === 'mixed';
  }).length;

  return (
    <>
      <style>{PE_CSS}</style>
      <div className={`pe-wrap${isFocused ? ' pe-focused' : ''}`} {...panelProps}>

        {/* ── HEADER BAR ───────────────────────────────────────────────── */}
        <div className="pe-hdr">
          <span className="pe-hdr-title">Physical Exam</span>
          {/* Mode toggle */}
          <div className="pe-mode-toggle">
            <button className={`pe-mode-btn${docMode==='focused'?' active':''}`} onClick={() => setDocMode('focused')}>
              Focused{docMode==='focused' ? ` (${visiblePeSys.length})` : ''}
            </button>
            <button className={`pe-mode-btn${docMode==='full'?' active':''}`} onClick={() => setDocMode('full')}>
              Full ({totalSystems})
            </button>
            <button className={`pe-mode-btn pe-mode-visual${docMode==='visual'?' active':''}`} onClick={() => setDocMode('visual')}>
              Visual
            </button>
          </div>
          <div className="pe-hdr-stats">
            {docMode !== 'visual' && (
              <span className="pe-hdr-badge pe-hdr-badge-blue">
                {assessedSystems} / {totalSystems} systems
              </span>
            )}
            {abnormalSystems > 0 && (
              <span className="pe-hdr-badge pe-hdr-badge-coral">
                {abnormalSystems} abnormal
              </span>
            )}
          </div>
          <div className="pe-hdr-acts">
            {docMode !== 'visual' && <button className="pe-btn-all-normal" onClick={markAllNormal}>✓ All Normal</button>}
            {docMode !== 'visual' && <button className="pe-btn-clear-all" onClick={() => { clearAll(); setRemainderNormal(false); }}>✕ Clear</button>}
            {/* ── Generate PE narrative button ── */}
            {docMode !== 'visual' && (() => {
              const hasFindings = PE_SYSTEMS.some(s => {
                const d = examData[s.id];
                return d && Object.values(d.findings).some(v => v !== null);
              });
              return (
                <button
                  onClick={generatePENarrative}
                  disabled={narrativeBusy || !hasFindings}
                  title={hasFindings ? 'Generate PE prose note from checked findings' : 'Document findings first'}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:7, cursor: narrativeBusy || !hasFindings ? 'not-allowed' : 'pointer', background: showNarrative ? 'rgba(155,109,255,.18)' : 'rgba(155,109,255,.1)', border:`1px solid ${showNarrative ? 'rgba(155,109,255,.5)' : 'rgba(155,109,255,.3)'}`, color: narrativeBusy || !hasFindings ? 'rgba(155,109,255,.4)' : 'var(--npi-purple)', fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, transition:'all .15s', opacity: !hasFindings ? 0.5 : 1 }}
                >
                  {narrativeBusy
                    ? <><span style={{ display:'inline-block', animation:'pe-spin .7s linear infinite' }}>⟳</span> Generating…</>
                    : <>✦ PE Note</>
                  }
                  <style>{`@keyframes pe-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                </button>
              );
            })()}
            {onAdvance && (
              <button
                onClick={onAdvance}
                style={{ padding:'5px 14px', borderRadius:7, background:'var(--npi-teal)', color:'#050f1e', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
              >
                MDM <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:'rgba(5,15,30,.3)', borderRadius:3, padding:'0 4px' }}>⌘ Esc</span> →
              </button>
            )}
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <div className="pe-body" style={{ gridTemplateColumns: docMode === 'visual' ? '1fr' : '160px 1fr' }}>

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          {docMode !== 'visual' && (
            <div className="pe-sidebar">
              {visiblePeSys.map(sys => {
                const status    = getSysStatus(examData[sys.id]?.findings || {});
                const globalIdx = PE_SYSTEMS.findIndex(s => s.id === sys.id);
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
          )}

          {/* ── VISUAL MODE ──────────────────────────────────────────────── */}
          {docMode === 'visual' && (
            <div className="pe-visual" ref={mainRef}>
              <div className="pe-visual-section">
                <div className="pe-visual-lbl">General appearance</div>
                <div className="pe-visual-chips">
                  {['Well-appearing','Ill-appearing','Toxic-appearing','Uncomfortable','Altered'].map(opt => (
                    <button key={opt}
                      className={`pe-visual-chip${visualAppearance===opt?' active':''}`}
                      onClick={() => setVisualAppearance(visualAppearance===opt ? '' : opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pe-visual-section">
                <div className="pe-visual-lbl">Exam notes / pertinent observations</div>
                <textarea
                  className="pe-note-ta"
                  rows={4}
                  placeholder="E.g. No acute distress. Moving all extremities. No obvious deformity. Abdomen soft and non-tender on visual inspection…"
                  value={visualNotes}
                  onChange={e => setVisualNotes(e.target.value)}
                  style={{ minHeight:90 }}
                />
              </div>
              <div className="pe-visual-note">
                Visual/observational exam only. Hands-on exam not performed. Document reason in HPI if clinically relevant.
              </div>
            </div>
          )}

          {/* ── STANDARD PANEL (focused or full) ─────────────────────────── */}
          {docMode !== 'visual' && (
            <div className="pe-main" ref={mainRef}>

              {/* System header */}
              <div className="pe-sys-hdr">
                <span className="pe-sys-hdr-ico">{activeSys?.icon}</span>
                <span className="pe-sys-hdr-name">{activeSys?.label}</span>
                <StatusBadge status={sysStatus} />
                <div className="pe-sys-hdr-acts">
                  <button className="pe-btn-sys-normal" onClick={() => markSystemNormal(activeSys?.id)}>
                    ✓ Mark Normal
                  </button>
                  <button className="pe-btn-sys-clear" onClick={() => clearSystem(activeSys?.id)}>
                    ✕ Clear
                  </button>
                </div>
              </div>

              {/* Normal statement — shown when system is fully normal */}
              {sysStatus === 'normal' && (
                <div className="pe-normal-stmt">
                  <span className="pe-normal-ico">✓</span>
                  <span className="pe-normal-txt">{activeSys?.normal}</span>
                </div>
              )}

              {/* Finding chips */}
              <div className="pe-chips-grid">
                {activeSys?.findings.map((f, fi) => (
                  <div key={f.id} data-fidx={fi}>
                    <FindingChip
                      finding={f}
                      value={sysData.findings[f.id]}
                      kbFocused={isFocused && fi === activeFindingIdx}
                      kbIndex={isFocused && fi < 9 ? fi + 1 : null}
                      onClick={() => {
                        handleFindingAction('toggle', activeSys.id, f.id);
                        setActiveFindingIdx(fi);
                        panelProps.ref.current?.focus();
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Free-text note */}
              <div className="pe-note-wrap">
                <label className="pe-note-lbl">📝 Additional findings</label>
                <textarea
                  className="pe-note-ta"
                  rows={2}
                  placeholder={`Additional ${activeSys?.label} findings or qualifications…`}
                  value={sysData.note}
                  onChange={e => setExamData(prev => ({
                    ...prev,
                    [activeSys.id]: { ...prev[activeSys.id], note: e.target.value },
                  }))}
                />
              </div>

              {/* Focused mode: remainder banner */}
              {docMode === 'focused' && hiddenPeCount > 0 && (
                <div className={`pe-remainder${remainderNormal ? ' pe-remainder-done' : ''}`}>
                  {remainderNormal ? (
                    <>
                      <span className="pe-remainder-ico">✓</span>
                      <span className="pe-remainder-txt">
                        Remaining {hiddenPeCount} systems examined — all normal
                      </span>
                      <button className="pe-remainder-undo" onClick={() => setRemainderNormal(false)}>undo</button>
                    </>
                  ) : (
                    <>
                      <span className="pe-remainder-txt pe-remainder-pending">
                        {hiddenPeCount} systems not yet documented
                      </span>
                      <button className="pe-remainder-btn" onClick={() => setRemainderNormal(true)}>
                        ✓ Mark all others normal
                      </button>
                      <button className="pe-remainder-expand" onClick={() => setDocMode('full')}>
                        or expand to full exam
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          )}{/* /pe-main */}
        </div>{/* /pe-body */}

        {/* ── PE NARRATIVE PANEL ─────────────────────────────────────── */}
        {showNarrative && (
          <div style={{ borderTop:'1px solid rgba(155,109,255,.25)', background:'rgba(155,109,255,.05)', flexShrink:0, padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, color:'var(--npi-txt)' }}>PE Narrative</span>
              {!narrativeBusy && peNarrative && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-purple)', background:'rgba(155,109,255,.1)', border:'1px solid rgba(155,109,255,.25)', borderRadius:3, padding:'1px 6px', letterSpacing:'0.05em' }}>AI generated</span>
              )}
              {narrativeBusy && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)' }}>generating…</span>
              )}
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                {peNarrative && !narrativeBusy && (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(peNarrative).then(() => {
                          setNarrativeCopied(true);
                          setTimeout(() => setNarrativeCopied(false), 2000);
                        });
                      }}
                      style={{ padding:'3px 10px', borderRadius:5, border:'1px solid rgba(155,109,255,.3)', background: narrativeCopied ? 'rgba(0,229,192,.1)' : 'rgba(155,109,255,.1)', color: narrativeCopied ? 'var(--npi-teal)' : 'var(--npi-purple)', fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
                      {narrativeCopied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    <button
                      onClick={() => { onNarrative?.(peNarrative); setShowNarrative(false); }}
                      style={{ padding:'3px 12px', borderRadius:5, border:'none', background:'var(--npi-purple)', color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, cursor:'pointer' }}>
                      Apply to Note →
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowNarrative(false)}
                  style={{ padding:'3px 8px', borderRadius:5, border:'1px solid var(--npi-bd)', background:'transparent', color:'var(--npi-txt4)', fontFamily:"'DM Sans',sans-serif", fontSize:10, cursor:'pointer' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Loading skeleton */}
            {narrativeBusy && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[90, 70, 55].map(w => (
                  <div key={w} style={{ height:10, borderRadius:4, background:`rgba(155,109,255,0.12)`, width:`${w}%`, animation:'pe-shimmer 1.4s ease-in-out infinite alternate' }} />
                ))}
                <style>{`@keyframes pe-shimmer{from{opacity:.4}to{opacity:.85}}`}</style>
              </div>
            )}

            {/* Editable narrative text */}
            {peNarrative && !narrativeBusy && (
              <textarea
                value={peNarrative}
                onChange={e => setPeNarrative(e.target.value)}
                rows={3}
                style={{ width:'100%', background:'rgba(14,37,68,.7)', border:'1px solid rgba(155,109,255,.28)', borderRadius:8, padding:'9px 12px', color:'var(--npi-txt)', fontFamily:"'DM Sans',sans-serif", fontSize:12.5, lineHeight:1.7, resize:'vertical', outline:'none', transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e  => { e.target.style.borderColor='rgba(155,109,255,.55)'; }}
                onBlur={e   => { e.target.style.borderColor='rgba(155,109,255,.28)'; }}
              />
            )}

            {/* Regenerate link */}
            {peNarrative && !narrativeBusy && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={generatePENarrative}
                  style={{ background:'none', border:'none', color:'var(--npi-txt4)', fontFamily:"'DM Sans',sans-serif", fontSize:10, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                  Regenerate
                </button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--npi-txt4)' }}>
                  Edit inline or regenerate — Apply to Note pushes text to Clinical Note Studio
                </span>
              </div>
            )}
          </div>
        )}

        <KbLegend isFocused={isFocused} />
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const PE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

/* Container */
.pe-wrap{display:flex;flex-direction:column;height:100%;background:var(--npi-bg);border-radius:12px;border:1px solid var(--npi-bd);overflow:hidden;transition:border-color .2s,box-shadow .2s}
.pe-wrap.pe-focused{border-color:rgba(59,158,255,.4);box-shadow:0 0 0 1px rgba(59,158,255,.12),0 0 40px rgba(59,158,255,.05)}

/* Header */
.pe-hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);flex-shrink:0}
.pe-hdr-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:var(--npi-txt);white-space:nowrap}
.pe-hdr-stats{display:flex;gap:6px;align-items:center}
.pe-hdr-badge{font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 9px;border-radius:20px;white-space:nowrap}
.pe-hdr-badge-blue{background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.25);color:var(--npi-blue)}
.pe-hdr-badge-coral{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.25);color:var(--npi-coral)}
.pe-hdr-acts{margin-left:auto;display:flex;gap:6px}
.pe-btn-all-normal{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;color:#00e5c0;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pe-btn-all-normal:hover{background:rgba(0,229,192,.22)}
.pe-btn-clear-all{background:transparent;border:1px solid var(--npi-bd);border-radius:6px;padding:4px 12px;font-size:11px;color:var(--npi-txt4);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pe-btn-clear-all:hover{border-color:rgba(255,107,107,.4);color:var(--npi-coral)}

/* Body layout */
.pe-body{display:grid;grid-template-columns:160px 1fr;flex:1;overflow:hidden;min-height:0}

/* Sidebar */
.pe-sidebar{border-right:1px solid var(--npi-bd);overflow-y:auto;background:var(--npi-panel);scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.pe-sidebar::-webkit-scrollbar{width:3px}
.pe-sidebar::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

.pe-sys-item{width:100%;display:flex;align-items:center;gap:7px;padding:9px 12px 9px 14px;border:none;border-left:2px solid transparent;background:transparent;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--npi-txt3)}
.pe-sys-item:hover{background:rgba(59,158,255,.04);color:var(--npi-txt2)}
.pe-sys-item.pe-active{background:rgba(59,158,255,.08);border-left-color:var(--npi-blue);color:var(--npi-blue)}
.pe-sys-key{font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;color:var(--npi-txt4);flex-shrink:0;min-width:18px;text-align:center;transition:all .15s}
.pe-sys-item.pe-active .pe-sys-key{background:rgba(59,158,255,.18);border-color:rgba(59,158,255,.45);color:var(--npi-blue)}
.pe-sys-ico{font-size:14px;flex-shrink:0;line-height:1}
.pe-sys-lbl{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}
.pe-sys-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s,box-shadow .2s}
.pe-sys-item.pe-active .pe-sys-dot[style*='#00e5c0']{box-shadow:0 0 6px rgba(0,229,192,.6)}
.pe-sys-item.pe-active .pe-sys-dot[style*='#ff6b6b']{box-shadow:0 0 6px rgba(255,107,107,.6)}

/* Main panel */
.pe-main{overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.pe-main::-webkit-scrollbar{width:3px}
.pe-main::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}

/* System header row */
.pe-sys-hdr{display:flex;align-items:center;gap:8px;padding-bottom:13px;border-bottom:1px solid rgba(26,53,85,.5)}
.pe-sys-hdr-ico{font-size:20px;line-height:1}
.pe-sys-hdr-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--npi-txt)}
.pe-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 9px;border-radius:4px}
.pe-badge-n{background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);color:#00e5c0}
.pe-badge-a{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:#ff6b6b}
.pe-badge-m{background:rgba(255,159,67,.1);border:1px solid rgba(255,159,67,.3);color:#ff9f43}
.pe-badge-e{background:rgba(122,160,192,.07);border:1px solid rgba(122,160,192,.18);color:var(--npi-txt4)}
.pe-sys-hdr-acts{margin-left:auto;display:flex;gap:5px;flex-shrink:0}
.pe-btn-sys-normal{background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.25);border-radius:5px;padding:3px 10px;font-size:11px;color:#00e5c0;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pe-btn-sys-normal:hover{background:rgba(0,229,192,.18)}
.pe-btn-sys-clear{background:transparent;border:1px solid var(--npi-bd);border-radius:5px;padding:3px 10px;font-size:11px;color:var(--npi-txt4);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pe-btn-sys-clear:hover{border-color:rgba(255,107,107,.35);color:var(--npi-coral)}

/* Normal statement */
.pe-normal-stmt{display:flex;align-items:flex-start;gap:9px;padding:10px 14px;background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.18);border-radius:8px}
.pe-normal-ico{color:#00e5c0;font-size:13px;flex-shrink:0;margin-top:2px}
.pe-normal-txt{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(0,229,192,.75);font-style:italic;line-height:1.65}

/* Findings grid */
.pe-chips-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}

/* Finding chip */
.pe-chip{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:8px;border:1px solid var(--npi-bd);background:rgba(14,37,68,.5);cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s,color .15s;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--npi-txt4);text-align:left;width:100%}
.pe-chip:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:rgba(14,37,68,.9)}
.pe-chip-n{background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.32);color:#00e5c0}
.pe-chip-a{background:rgba(255,107,107,.08);border-color:rgba(255,107,107,.32);color:#ff6b6b}
.pe-chip-kb{border-color:var(--npi-blue)!important;box-shadow:0 0 0 2px rgba(59,158,255,.18)!important;background:rgba(59,158,255,.06)!important;color:var(--npi-txt2)!important}
.pe-chip-n.pe-chip-kb{border-color:#00e5c0!important;box-shadow:0 0 0 2px rgba(0,229,192,.18)!important}
.pe-chip-a.pe-chip-kb{border-color:#ff6b6b!important;box-shadow:0 0 0 2px rgba(255,107,107,.18)!important}
.pe-chip-ico{font-size:11px;flex-shrink:0;width:14px;text-align:center;font-family:'JetBrains Mono',monospace}
.pe-chip-txt{flex:1;line-height:1.3;font-size:11.5px}
.pe-chip-hint{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-blue);background:rgba(59,158,255,.1);border:1px solid rgba(59,158,255,.25);border-radius:3px;padding:1px 5px;flex-shrink:0;white-space:nowrap}
.pe-chip-num{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;flex-shrink:0;min-width:16px;text-align:center}

/* Note area */
.pe-note-wrap{display:flex;flex-direction:column;gap:5px;margin-top:2px}
.pe-note-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);letter-spacing:.1em;text-transform:uppercase}
.pe-note-ta{width:100%;background:rgba(14,37,68,.6);border:1px solid var(--npi-bd);border-radius:8px;padding:9px 12px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:12px;resize:vertical;min-height:58px;outline:none;line-height:1.5;transition:border-color .15s;box-sizing:border-box}
.pe-note-ta:focus{border-color:var(--npi-teal)}
.pe-note-ta::placeholder{color:var(--npi-txt4)}

/* Keyboard legend */
.pe-kb-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 16px;background:rgba(8,22,40,.95);border-top:1px solid rgba(26,53,85,.4);flex-shrink:0;opacity:.5;transition:opacity .25s,border-color .25s}
.pe-kb-bar.pe-kb-on{opacity:1;border-top-color:rgba(59,158,255,.22)}
.pe-kb-ico{font-size:11px;color:var(--npi-txt4);flex-shrink:0}
.pe-kb-item{display:flex;align-items:center;gap:4px}
.pe-kb-item kbd{font-family:'JetBrains Mono',monospace;font-size:9px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px;color:var(--npi-txt2);white-space:nowrap}
.pe-kb-item span{font-size:10px;color:var(--npi-txt4);white-space:nowrap}
.pe-kb-prompt{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);font-style:italic}

/* Mode toggle */
.pe-mode-toggle{display:flex;gap:0;border:1px solid var(--npi-bd);border-radius:6px;overflow:hidden;flex-shrink:0}
.pe-mode-btn{padding:3px 10px;font-size:10px;font-weight:500;font-family:'DM Sans',sans-serif;background:transparent;border:none;color:var(--npi-txt4);cursor:pointer;transition:all .15s}
.pe-mode-btn:hover{color:var(--npi-txt2);background:var(--npi-up)}
.pe-mode-btn.active{background:rgba(59,158,255,.12);color:var(--npi-blue);font-weight:600}
.pe-mode-btn+.pe-mode-btn{border-left:1px solid var(--npi-bd)}
.pe-mode-visual.active{background:rgba(155,109,255,.12);color:var(--npi-purple)}

/* Visual mode */
.pe-visual{padding:16px 18px;display:flex;flex-direction:column;gap:16px;overflow-y:auto}
.pe-visual-section{display:flex;flex-direction:column;gap:8px}
.pe-visual-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);text-transform:uppercase;letter-spacing:.1em}
.pe-visual-chips{display:flex;flex-wrap:wrap;gap:6px}
.pe-visual-chip{padding:5px 13px;border-radius:20px;font-size:11px;font-weight:500;font-family:'DM Sans',sans-serif;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt3);cursor:pointer;transition:all .15s}
.pe-visual-chip:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.pe-visual-chip.active{background:rgba(155,109,255,.12);border-color:rgba(155,109,255,.35);color:var(--npi-purple);font-weight:600}
.pe-visual-note{font-size:10px;color:var(--npi-txt4);font-style:italic;line-height:1.5;padding:8px 12px;background:rgba(14,37,68,.4);border-radius:6px;border-left:2px solid var(--npi-bd)}

/* Remainder banner */
.pe-remainder{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;border:1px dashed rgba(26,53,85,.8);background:rgba(8,22,40,.4);flex-wrap:wrap;margin-top:4px}
.pe-remainder-done{border-color:rgba(0,229,192,.25);background:rgba(0,229,192,.05)}
.pe-remainder-ico{color:#00e5c0;font-size:12px;flex-shrink:0}
.pe-remainder-txt{font-size:11px;color:var(--npi-txt3);flex:1}
.pe-remainder-pending{color:var(--npi-txt4) !important}
.pe-remainder-btn{padding:4px 12px;border-radius:5px;font-size:10px;font-weight:600;font-family:'DM Sans',sans-serif;background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.3);color:#00e5c0;cursor:pointer;transition:all .15s;white-space:nowrap}
.pe-remainder-btn:hover{background:rgba(0,229,192,.2)}
.pe-remainder-expand{padding:4px 10px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;background:transparent;border:1px solid var(--npi-bd);color:var(--npi-txt4);cursor:pointer;transition:all .15s;white-space:nowrap}
.pe-remainder-expand:hover{color:var(--npi-txt2);border-color:var(--npi-bhi)}
.pe-remainder-undo{padding:2px 8px;border-radius:4px;font-size:9px;font-family:'JetBrains Mono',monospace;background:transparent;border:1px solid rgba(26,53,85,.6);color:var(--npi-txt4);cursor:pointer;margin-left:auto}
.pe-remainder-undo:hover{color:var(--npi-coral);border-color:rgba(255,107,107,.3)}
`;