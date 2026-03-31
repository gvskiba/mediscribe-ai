import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════
//  FONT INJECTION  (idempotent)
// ════════════════════════════════════════════════════════════
(() => {
  if (document.getElementById("notrya-ac-fonts")) return;
  const l = document.createElement("link");
  l.id = "notrya-ac-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";
  document.head.appendChild(l);
})();

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS — deep glass palette
// ════════════════════════════════════════════════════════════
const AC  = "#a78bfa";   // violet — primary accent

const T = {
  // Background & depth
  bg:      "#04080f",
  bgMid:   "#070d1a",
  // Glass surfaces (white-tinted, not navy-tinted)
  glass1:  "rgba(255,255,255,0.04)",   // subtle panel
  glass2:  "rgba(255,255,255,0.07)",   // card
  glass3:  "rgba(255,255,255,0.10)",   // hover / active
  glassD:  "rgba(255,255,255,0.02)",   // deep inner row
  // Borders
  border:  "rgba(255,255,255,0.08)",
  borderHi:"rgba(255,255,255,0.16)",
  borderGl:"rgba(255,255,255,0.22)",   // highlight border
  // Inset top-edge highlight (the glass "shine")
  shine:   "inset 0 1px 0 rgba(255,255,255,0.13)",
  shineHi: "inset 0 1px 0 rgba(255,255,255,0.22)",
  // Typography
  txt:  "#f0f4ff",
  txt2: "#a5b8d8",
  txt3: "#5a7490",
  txt4: "#2e4060",
  // Accent palette
  teal:   "#2dd4bf",
  gold:   "#fbbf24",
  coral:  "#f87171",
  blue:   "#60a5fa",
  purple: "#a78bfa",
  green:  "#34d399",
  pink:   "#f472b6",
};

// ── Glass helper functions ────────────────────────────────────
const G = {
  panel: (glow) => ({
    background: T.glass2,
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: `1px solid ${glow ? glow + "28" : T.border}`,
    borderRadius: 18,
    boxShadow: glow
      ? `0 8px 40px rgba(0,0,0,0.55), 0 0 30px ${glow}12, ${T.shine}, inset 0 0 60px rgba(255,255,255,0.01)`
      : `0 8px 32px rgba(0,0,0,0.5), ${T.shine}, inset 0 0 40px rgba(255,255,255,0.01)`,
  }),
  row: () => ({
    background: T.glassD,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${T.border}`,
    borderRadius: 11,
    boxShadow: T.shine,
  }),
  input: (accent) => ({
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    boxShadow: T.shine,
    color: T.txt,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  }),
  btn: (accent, filled) => ({
    background: filled
      ? `linear-gradient(135deg, ${accent}cc, ${accent}88)`
      : "rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${filled ? accent + "60" : T.borderHi}`,
    borderRadius: 10,
    boxShadow: filled
      ? `0 4px 18px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.25)`
      : T.shine,
    color: filled ? "#fff" : T.txt2,
    fontFamily: "'DM Sans',sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .2s",
  }),
};

// ════════════════════════════════════════════════════════════
//  DATABASES  (unchanged)
// ════════════════════════════════════════════════════════════
const ICD10_DB = [
  { code:"R07.9",    desc:"Chest pain, unspecified",                             cat:"Cardiovascular" },
  { code:"R07.1",    desc:"Chest pain on breathing",                             cat:"Cardiovascular" },
  { code:"I21.9",    desc:"Acute myocardial infarction, unspecified",            cat:"Cardiovascular" },
  { code:"I21.01",   desc:"STEMI involving left anterior descending artery",     cat:"Cardiovascular" },
  { code:"I20.9",    desc:"Angina pectoris, unspecified",                        cat:"Cardiovascular" },
  { code:"I10",      desc:"Essential (primary) hypertension",                    cat:"Cardiovascular" },
  { code:"I16.0",    desc:"Hypertensive urgency",                                cat:"Cardiovascular" },
  { code:"I16.1",    desc:"Hypertensive emergency",                              cat:"Cardiovascular" },
  { code:"I48.91",   desc:"Unspecified atrial fibrillation",                     cat:"Cardiovascular" },
  { code:"I47.2",    desc:"Ventricular tachycardia",                             cat:"Cardiovascular" },
  { code:"I46.9",    desc:"Cardiac arrest, cause unspecified",                   cat:"Cardiovascular" },
  { code:"R00.1",    desc:"Bradycardia, unspecified",                            cat:"Cardiovascular" },
  { code:"I63.9",    desc:"Cerebral infarction, unspecified (CVA/Stroke)",       cat:"Neurological"  },
  { code:"G45.9",    desc:"Transient ischemic attack (TIA), unspecified",        cat:"Neurological"  },
  { code:"R51.9",    desc:"Headache, unspecified",                               cat:"Neurological"  },
  { code:"G43.909",  desc:"Migraine, unspecified, not intractable",              cat:"Neurological"  },
  { code:"R55",      desc:"Syncope and collapse",                                cat:"Neurological"  },
  { code:"R56.9",    desc:"Unspecified convulsions",                             cat:"Neurological"  },
  { code:"G40.909",  desc:"Epilepsy, unspecified, not intractable",              cat:"Neurological"  },
  { code:"R42",      desc:"Dizziness and giddiness",                             cat:"Neurological"  },
  { code:"H81.10",   desc:"Benign paroxysmal vertigo, unspecified ear",          cat:"Neurological"  },
  { code:"S06.0X0A", desc:"Concussion without loss of consciousness, initial",   cat:"Neurological"  },
  { code:"S09.90XA", desc:"Unspecified injury of head, initial encounter",       cat:"Neurological"  },
  { code:"R06.00",   desc:"Dyspnea, unspecified",                                cat:"Respiratory"   },
  { code:"J18.9",    desc:"Pneumonia, unspecified organism",                     cat:"Respiratory"   },
  { code:"J44.1",    desc:"COPD with acute exacerbation",                        cat:"Respiratory"   },
  { code:"J45.901",  desc:"Unspecified asthma, uncomplicated",                   cat:"Respiratory"   },
  { code:"J96.00",   desc:"Acute respiratory failure, unspecified hypoxia",      cat:"Respiratory"   },
  { code:"J96.01",   desc:"Acute respiratory failure with hypoxia",              cat:"Respiratory"   },
  { code:"R05.9",    desc:"Cough, unspecified",                                  cat:"Respiratory"   },
  { code:"R10.9",    desc:"Unspecified abdominal pain",                          cat:"GI"            },
  { code:"R10.0",    desc:"Acute abdomen",                                       cat:"GI"            },
  { code:"K35.80",   desc:"Acute appendicitis without abscess",                  cat:"GI"            },
  { code:"K80.10",   desc:"Calculus of gallbladder with acute cholecystitis",    cat:"GI"            },
  { code:"K57.32",   desc:"Diverticulitis of large intestine without abscess",   cat:"GI"            },
  { code:"K92.1",    desc:"Melena",                                              cat:"GI"            },
  { code:"K92.0",    desc:"Hematemesis",                                         cat:"GI"            },
  { code:"A09",      desc:"Infectious gastroenteritis and colitis, unspecified", cat:"GI"            },
  { code:"N23",      desc:"Unspecified renal colic",                             cat:"GU"            },
  { code:"N10",      desc:"Acute pyelonephritis",                                cat:"GU"            },
  { code:"N39.0",    desc:"Urinary tract infection, site not specified",         cat:"GU"            },
  { code:"R31.9",    desc:"Hematuria, unspecified",                              cat:"GU"            },
  { code:"M54.50",   desc:"Low back pain, unspecified",                          cat:"MSK"           },
  { code:"M25.511",  desc:"Pain in right shoulder",                              cat:"MSK"           },
  { code:"M17.11",   desc:"Primary osteoarthritis, right knee",                  cat:"MSK"           },
  { code:"S93.401A", desc:"Sprain of right ankle ligament, initial encounter",   cat:"Trauma"        },
  { code:"S72.001A", desc:"Fracture of femoral neck, unspecified, initial",      cat:"Trauma"        },
  { code:"S52.501A", desc:"Unspecified fracture lower end of radius, initial",   cat:"Trauma"        },
  { code:"S01.00XA", desc:"Unspecified open wound of scalp, initial encounter",  cat:"Trauma"        },
  { code:"T14.90",   desc:"Injury, unspecified",                                 cat:"Trauma"        },
  { code:"L03.90",   desc:"Cellulitis, unspecified",                             cat:"Derm"          },
  { code:"R21",      desc:"Rash and other nonspecific skin eruption",            cat:"Derm"          },
  { code:"T78.2XXA", desc:"Anaphylactic shock, unspecified, initial encounter",  cat:"Allergy"       },
  { code:"R50.9",    desc:"Fever, unspecified",                                  cat:"Infectious"    },
  { code:"A41.9",    desc:"Sepsis, unspecified organism",                        cat:"Infectious"    },
  { code:"A41.01",   desc:"Sepsis due to Methicillin-resistant Staphylococcus",  cat:"Infectious"    },
  { code:"E11.65",   desc:"Type 2 diabetes mellitus with hyperglycemia",         cat:"Endocrine"     },
  { code:"E16.0",    desc:"Drug-induced hypoglycemia without coma",              cat:"Endocrine"     },
  { code:"E11.641",  desc:"Type 2 DM with hypoglycemia with coma",               cat:"Endocrine"     },
  { code:"R73.09",   desc:"Other abnormal glucose",                              cat:"Endocrine"     },
  { code:"F10.20",   desc:"Alcohol use disorder, moderate, uncomplicated",       cat:"Tox"           },
  { code:"T51.0X1A", desc:"Toxic effects of ethanol, accidental, initial",       cat:"Tox"           },
  { code:"R57.9",    desc:"Shock, unspecified",                                  cat:"Critical"      },
  { code:"R57.1",    desc:"Hypovolemic shock",                                   cat:"Critical"      },
];

const CPT_DB = [
  { code:"99281", desc:"ED visit — minimal severity, self-limited",              cat:"ED E&M",    rvu:0.80 },
  { code:"99282", desc:"ED visit — low to moderate severity",                    cat:"ED E&M",    rvu:1.48 },
  { code:"99283", desc:"ED visit — moderate severity",                           cat:"ED E&M",    rvu:2.60 },
  { code:"99284", desc:"ED visit — high severity, urgent evaluation required",   cat:"ED E&M",    rvu:4.00 },
  { code:"99285", desc:"ED visit — high severity, high complexity MDM",          cat:"ED E&M",    rvu:5.28 },
  { code:"99202", desc:"Office/outpatient, new pt — straightforward MDM",        cat:"Office",    rvu:1.60 },
  { code:"99203", desc:"Office/outpatient, new pt — low complexity MDM",         cat:"Office",    rvu:2.60 },
  { code:"99204", desc:"Office/outpatient, new pt — moderate complexity MDM",    cat:"Office",    rvu:3.82 },
  { code:"99205", desc:"Office/outpatient, new pt — high complexity MDM",        cat:"Office",    rvu:4.87 },
  { code:"99212", desc:"Office/outpatient, est pt — straightforward MDM",        cat:"Office",    rvu:1.30 },
  { code:"99213", desc:"Office/outpatient, est pt — low complexity MDM",         cat:"Office",    rvu:1.92 },
  { code:"99214", desc:"Office/outpatient, est pt — moderate complexity MDM",    cat:"Office",    rvu:2.92 },
  { code:"99215", desc:"Office/outpatient, est pt — high complexity MDM",        cat:"Office",    rvu:3.85 },
  { code:"99221", desc:"Initial hospital care — low complexity MDM",             cat:"Inpatient", rvu:2.65 },
  { code:"99222", desc:"Initial hospital care — moderate complexity MDM",        cat:"Inpatient", rvu:3.83 },
  { code:"99223", desc:"Initial hospital care — high complexity MDM",            cat:"Inpatient", rvu:5.25 },
  { code:"99231", desc:"Subsequent hospital care — low complexity MDM",          cat:"Inpatient", rvu:1.40 },
  { code:"99232", desc:"Subsequent hospital care — moderate complexity MDM",     cat:"Inpatient", rvu:2.26 },
  { code:"99233", desc:"Subsequent hospital care — high complexity MDM",         cat:"Inpatient", rvu:3.18 },
  { code:"10060", desc:"Incision & drainage of abscess, simple",                 cat:"Procedure", rvu:1.69 },
  { code:"10061", desc:"Incision & drainage of abscess, complicated",            cat:"Procedure", rvu:3.18 },
  { code:"12001", desc:"Simple repair of laceration ≤ 2.5 cm",                  cat:"Procedure", rvu:1.79 },
  { code:"12002", desc:"Simple repair of laceration 2.6–7.5 cm",                cat:"Procedure", rvu:2.09 },
  { code:"12011", desc:"Simple repair of face/ear/eyelid ≤ 2.5 cm",             cat:"Procedure", rvu:2.08 },
  { code:"20610", desc:"Arthrocentesis — large joint",                           cat:"Procedure", rvu:1.44 },
  { code:"29515", desc:"Application of short leg splint (static)",               cat:"Procedure", rvu:1.76 },
  { code:"29125", desc:"Application of short arm splint (static)",               cat:"Procedure", rvu:1.47 },
  { code:"36415", desc:"Collection of venous blood by venipuncture",             cat:"Procedure", rvu:0.17 },
  { code:"31500", desc:"Intubation, endotracheal, emergency procedure",          cat:"Procedure", rvu:2.91 },
  { code:"92950", desc:"Cardiopulmonary resuscitation (CPR)",                    cat:"Procedure", rvu:4.32 },
  { code:"71046", desc:"Radiologic exam, chest — 2 views",                       cat:"Imaging",   rvu:0.22 },
  { code:"70450", desc:"CT head/brain without contrast",                         cat:"Imaging",   rvu:0.87 },
  { code:"70553", desc:"MRI brain without contrast then with contrast",          cat:"Imaging",   rvu:1.52 },
  { code:"74177", desc:"CT abdomen and pelvis with contrast",                    cat:"Imaging",   rvu:1.29 },
  { code:"74178", desc:"CT abdomen and pelvis without then with contrast",       cat:"Imaging",   rvu:1.63 },
  { code:"73721", desc:"MRI joint lower extremity without contrast",             cat:"Imaging",   rvu:1.50 },
  { code:"93010", desc:"ECG, routine, 12+ leads — with interpretation",          cat:"Cardiac",   rvu:0.25 },
  { code:"93005", desc:"ECG, routine — tracing only, no interpretation",         cat:"Cardiac",   rvu:0.17 },
  { code:"94640", desc:"Pressurized or nonpressurized inhalation treatment",     cat:"Respiratory",rvu:0.35},
  { code:"94002", desc:"Ventilator management, hospital inpatient, initiation",  cat:"Respiratory",rvu:0.97},
];

const EM_GROUPS = [
  { label:"Emergency Department",         accent:T.coral,  levels:[
    { code:"99281", lvl:"1", severity:"Minimal / self-limited",         mdm:"Straightforward",    time:"—"       },
    { code:"99282", lvl:"2", severity:"Low to moderate",                mdm:"Straightforward",    time:"—"       },
    { code:"99283", lvl:"3", severity:"Moderate",                        mdm:"Low complexity",     time:"—"       },
    { code:"99284", lvl:"4", severity:"High — urgent evaluation",        mdm:"Moderate complexity",time:"—"       },
    { code:"99285", lvl:"5", severity:"High — threat to life/function",  mdm:"High complexity",    time:"—"       },
  ]},
  { label:"Office — New Patient",         accent:T.teal,  levels:[
    { code:"99202", lvl:"2", severity:"Low",      mdm:"Straightforward",    time:"15–29 min" },
    { code:"99203", lvl:"3", severity:"Low",      mdm:"Low complexity",     time:"30–44 min" },
    { code:"99204", lvl:"4", severity:"Moderate", mdm:"Moderate complexity",time:"45–59 min" },
    { code:"99205", lvl:"5", severity:"High",     mdm:"High complexity",    time:"60–74 min" },
  ]},
  { label:"Office — Established Patient", accent:T.gold,  levels:[
    { code:"99211", lvl:"1", severity:"Minimal",  mdm:"N/A (nurse only)",   time:"≤ 10 min"  },
    { code:"99212", lvl:"2", severity:"Low",      mdm:"Straightforward",    time:"10–19 min" },
    { code:"99213", lvl:"3", severity:"Low",      mdm:"Low complexity",     time:"20–29 min" },
    { code:"99214", lvl:"4", severity:"Moderate", mdm:"Moderate complexity",time:"30–39 min" },
    { code:"99215", lvl:"5", severity:"High",     mdm:"High complexity",    time:"40–54 min" },
  ]},
  { label:"Inpatient — Initial",          accent:T.blue,  levels:[
    { code:"99221", lvl:"1", severity:"Low",      mdm:"Straightforward / Low", time:"—" },
    { code:"99222", lvl:"2", severity:"Moderate", mdm:"Moderate complexity",   time:"—" },
    { code:"99223", lvl:"3", severity:"High",     mdm:"High complexity",        time:"—" },
  ]},
  { label:"Inpatient — Subsequent",       accent:"#c4b5fd", levels:[
    { code:"99231", lvl:"1", severity:"Stable / recovering",        mdm:"Straightforward / Low",time:"—" },
    { code:"99232", lvl:"2", severity:"Inadequate response",         mdm:"Moderate complexity",  time:"—" },
    { code:"99233", lvl:"3", severity:"Unstable / significant new",  mdm:"High complexity",      time:"—" },
  ]},
];

// ════════════════════════════════════════════════════════════
//  AMBIENT BACKGROUND  — large glowing orbs for glass to refract
// ════════════════════════════════════════════════════════════
function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {/* Primary large orbs */}
      <div style={{ position:"absolute", top:"-10%", left:"15%",  width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)", animation:"orb0 12s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"30%",  right:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(45,212,191,0.13) 0%, transparent 65%)", animation:"orb1 15s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", bottom:"-5%",left:"5%",  width:550, height:550, borderRadius:"50%", background:"radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 65%)", animation:"orb2 11s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"60%",  left:"45%",  width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(248,113,113,0.10) 0%, transparent 65%)", animation:"orb0 14s ease-in-out infinite reverse" }}/>
      <div style={{ position:"absolute", top:"5%",   right:"30%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 65%)", animation:"orb1 10s ease-in-out infinite reverse" }}/>
      {/* Fine noise grain overlay */}
      <div style={{
        position:"absolute", inset:0, opacity:0.025,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"200px 200px",
      }}/>
      {/* Subtle grid lines */}
      <svg width="100%" height="100%" style={{ position:"absolute", inset:0, opacity:0.018 }}>
        <defs>
          <pattern id="acgrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0L0 0 0 48" fill="none" stroke="rgba(167,139,250,1)" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#acgrid)"/>
      </svg>
      <style>{`
        @keyframes orb0{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.15) translate(2%,3%)}}
        @keyframes orb1{0%,100%{transform:scale(1.08) translate(0,0)}50%{transform:scale(0.9) translate(-3%,2%)}}
        @keyframes orb2{0%,100%{transform:scale(0.95) translate(0,0)}50%{transform:scale(1.1) translate(2%,-2%)}}
        @keyframes acFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(45,212,191,.5)}50%{opacity:.7;box-shadow:0 0 0 5px rgba(45,212,191,0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        button{outline:none} select option{background:#0d1829;color:#e0eaff}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.18)}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  GLASSMORPHISM PANEL
// ════════════════════════════════════════════════════════════
function GPanel({ children, style={}, glow=null, accent=null }) {
  const glowColor = glow || accent;
  return (
    <div style={{
      background: accent
        ? `linear-gradient(135deg, ${accent}0a 0%, rgba(255,255,255,0.05) 100%)`
        : T.glass2,
      backdropFilter: "blur(32px) saturate(160%)",
      WebkitBackdropFilter: "blur(32px) saturate(160%)",
      border: `1px solid ${glowColor ? glowColor + "30" : T.border}`,
      borderRadius: 18,
      boxShadow: glowColor
        ? `0 8px 40px rgba(0,0,0,0.55), 0 0 36px ${glowColor}14, inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 80px rgba(255,255,255,0.01)`
        : `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.11), inset 0 0 60px rgba(255,255,255,0.01)`,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Top edge refraction highlight */}
      <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:`linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)`, pointerEvents:"none" }}/>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CHIP / BADGE
// ════════════════════════════════════════════════════════════
function Chip({ label, color }) {
  const c = color || AC;
  return (
    <span style={{
      fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
      letterSpacing:".05em", padding:"2px 8px", borderRadius:20,
      background:`${c}18`, border:`1px solid ${c}35`, color:c,
      whiteSpace:"nowrap",
      boxShadow:`0 0 8px ${c}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
    }}>{label}</span>
  );
}

// ════════════════════════════════════════════════════════════
//  SECTION HEADER
// ════════════════════════════════════════════════════════════
function SectionHeader({ icon, title, sub, badge, accent }) {
  const c = accent || AC;
  return (
    <div style={{ marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: sub?4:0 }}>
        <div style={{
          width:32, height:32, borderRadius:9, flexShrink:0, display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:16,
          background:`${c}15`, border:`1px solid ${c}28`,
          boxShadow:`0 0 12px ${c}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.txt, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{title}</div>
        </div>
        <Chip label={badge || "Guideline-Based"} color={c}/>
      </div>
      {sub && <div style={{ fontSize:11, color:T.txt3, paddingLeft:42, lineHeight:1.5 }}>{sub}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CODE ROW  (glassmorphic)
// ════════════════════════════════════════════════════════════
function CodeRow({ item, accent, showRvu, onAdd }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...G.row(),
        display:"flex", alignItems:"center", gap:10, padding:"9px 13px", marginBottom:5,
        background: hov ? `${accent}0c` : T.glassD,
        borderColor: hov ? `${accent}30` : T.border,
        boxShadow: hov ? `0 4px 16px ${accent}14, inset 0 1px 0 rgba(255,255,255,0.1)` : T.shine,
        transition:"all .18s",
      }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:accent, minWidth:76, flexShrink:0, textShadow:`0 0 12px ${accent}60` }}>
        {item.code}
      </span>
      <span style={{ fontSize:12, color:T.txt2, flex:1, lineHeight:1.35 }}>{item.desc}</span>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        {item.cat  && <Chip label={item.cat}            color={accent}   />}
        {showRvu && item.rvu && <Chip label={`${item.rvu} RVU`} color={T.purple}/>}
      </div>
      <button onClick={() => onAdd(item)}
        style={{
          ...G.btn(accent, hov),
          padding:"4px 13px", fontSize:11, marginLeft:4, flexShrink:0,
        }}>+ Add</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODULE-LEVEL UI PRIMITIVES  (must be outside main component)
// ════════════════════════════════════════════════════════════
function SearchInput({ value, onChange, placeholder, onKeyDown, accent }) {
  return (
    <div style={{ position:"relative", flex:1 }}>
      <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"rgba(255,255,255,0.2)", pointerEvents:"none" }}>⌕</span>
      <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
        style={{
          ...G.input(accent),
          width:"100%", padding:"10px 14px 10px 40px",
        }}
        onFocus={e => { e.target.style.borderColor=`${accent||AC}55`; e.target.style.boxShadow=`0 0 0 3px ${accent||AC}14, inset 0 1px 0 rgba(255,255,255,0.12)`; }}
        onBlur={e  => { e.target.style.borderColor=T.border;           e.target.style.boxShadow=T.shine; }}/>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        ...G.input(),
        padding:"10px 14px", cursor:"pointer",
        background:"rgba(255,255,255,0.06)", color:T.txt2,
      }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FilterPill({ label, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 15px", borderRadius:24, fontSize:12, fontWeight: active?600:400,
      fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all .2s",
      background: active ? `${accent}18` : "rgba(255,255,255,0.04)",
      border:`1px solid ${active ? accent+"45" : "rgba(255,255,255,0.09)"}`,
      color: active ? accent : T.txt3,
      boxShadow: active ? `0 0 16px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.12)` : T.shine,
    }}>{label}</button>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"36px 20px" }}>
      <div style={{ fontSize:30, marginBottom:10, opacity:0.5 }}>{icon}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>{msg}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AutocoderHub() {
  const [nav, setNav]             = useState("icd10");
  const [toasts, setToasts]       = useState([]);
  const [cart, setCart]           = useState([]);
  const [icdQ, setIcdQ]           = useState("");
  const [icdCat, setIcdCat]       = useState("All");
  const [icdHits, setIcdHits]     = useState([]);
  const [aiCond, setAiCond]       = useState("");
  const [aiIcdBusy, setAiIcdBusy] = useState(false);
  const [aiIcdRecs, setAiIcdRecs] = useState([]);
  const [cptQ, setCptQ]           = useState("");
  const [cptCat, setCptCat]       = useState("All");
  const [cptHits, setCptHits]     = useState([]);
  const [emFilter, setEmFilter]   = useState("All");
  const [noteText, setNoteText]   = useState("");
  const [acBusy, setAcBusy]       = useState(false);
  const [acResult, setAcResult]   = useState(null);

  const toast = useCallback((msg, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
  }, []);

  useEffect(() => {
    if (!icdQ.trim()) { setIcdHits([]); return; }
    const q = icdQ.toLowerCase();
    setIcdHits(ICD10_DB.filter(r =>
      (r.code.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q)) &&
      (icdCat === "All" || r.cat === icdCat)
    ).slice(0, 16));
  }, [icdQ, icdCat]);

  useEffect(() => {
    if (!cptQ.trim()) { setCptHits([]); return; }
    const q = cptQ.toLowerCase();
    setCptHits(CPT_DB.filter(r =>
      (r.code.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q)) &&
      (cptCat === "All" || r.cat === cptCat)
    ).slice(0, 16));
  }, [cptQ, cptCat]);

  const addToCart = useCallback((item, type) => {
    if (cart.find(c => c.code === item.code)) { toast(`${item.code} already in cart`, "warn"); return; }
    setCart(p => [...p, { ...item, type }]);
    toast(`Added ${item.code}`, "success");
  }, [cart, toast]);

  const removeFromCart = (code) => setCart(p => p.filter(c => c.code !== code));

  const runAiIcd = async () => {
    if (!aiCond.trim() || aiIcdBusy) return;
    setAiIcdBusy(true); setAiIcdRecs([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are a board-certified clinical documentation specialist. Return the 5 most appropriate ICD-10 codes for the described condition. Respond ONLY with a valid JSON array, no markdown. Format: [{"code":"I21.9","desc":"Acute myocardial infarction, unspecified","specificity":"Medium","rationale":"Use when type/location not further specified"}]`,
          messages:[{ role:"user", content:`Clinical condition: ${aiCond}\nReturn top 5 ICD-10 codes as JSON array.` }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "[]").replace(/```json|```/g,"").trim();
      setAiIcdRecs(JSON.parse(raw));
      toast("AI recommendations ready", "success");
    } catch { toast("AI query failed — check connection", "error"); }
    setAiIcdBusy(false);
  };

  const runAutocoder = async () => {
    if (!noteText.trim() || acBusy) return;
    setAcBusy(true); setAcResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1800,
          system:`You are an expert emergency medicine clinical coder (CPC-certified). Analyze the note and extract all billable codes. Respond ONLY with valid JSON, no markdown. Format:
{"summary":"One-sentence encounter summary","icd10":[{"code":"I21.9","desc":"Acute MI, unspecified","role":"principal"}],"cpt":[{"code":"99285","desc":"ED visit, high complexity","cat":"E&M"}],"em_level":{"code":"99285","level":"5","rationale":"High complexity MDM: multiple chronic conditions, urgent new problem"},"coding_notes":"Any important coding flags or guidance"}`,
          messages:[{ role:"user", content:`Clinical Note:\n${noteText}` }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g,"").trim();
      setAcResult(JSON.parse(raw));
      toast("Autocoding complete", "success");
    } catch { toast("Autocoder failed — check note format", "error"); }
    setAcBusy(false);
  };

  const importAcToCart = () => {
    if (!acResult) return;
    const toAdd = [];
    (acResult.icd10||[]).forEach(r => {
      if (!cart.find(c => c.code===r.code) && !toAdd.find(c => c.code===r.code))
        toAdd.push({ ...r, type:"ICD-10" });
    });
    (acResult.cpt||[]).forEach(r => {
      if (!cart.find(c => c.code===r.code) && !toAdd.find(c => c.code===r.code))
        toAdd.push({ ...r, type:"CPT" });
    });
    if (toAdd.length > 0) setCart(p => [...p, ...toAdd]);
    toast(`Imported ${toAdd.length} code${toAdd.length!==1?"s":""} to cart`, "success");
  };

  const icdCats  = ["All", ...new Set(ICD10_DB.map(r => r.cat))];
  const cptCats  = ["All", ...new Set(CPT_DB.map(r => r.cat))];
  const emLabels = ["All", ...EM_GROUPS.map(g => g.label)];

  // ── Section renderers ─────────────────────────────────────

  const renderICD10 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"acFade .35s ease" }}>
      <GPanel style={{ padding:"22px 24px" }}>
        <SectionHeader icon="🧬" title="ICD-10 Code Search" badge="ICD-10-CM" accent={T.teal}
          sub={`${ICD10_DB.length} codes — search by condition, symptom, or code number`}/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={icdQ} onChange={e=>setIcdQ(e.target.value)} accent={T.teal}
            placeholder="Search conditions, symptoms, or ICD-10 code…"/>
          <FilterSelect value={icdCat} onChange={setIcdCat} options={icdCats}/>
        </div>
        <div style={{ maxHeight:340, overflowY:"auto", paddingRight:2 }}>
          {icdHits.length>0 ? icdHits.map(r=>(
            <CodeRow key={r.code} item={r} accent={T.teal} onAdd={i=>addToCart(i,"ICD-10")}/>
          )) : icdQ
            ? <EmptyState icon="🔍" msg={`No ICD-10 codes matched "${icdQ}"`}/>
            : <EmptyState icon="🧬" msg="Type a condition, symptom, or ICD-10 code above to search"/>}
        </div>
      </GPanel>

      {/* AI Recommender */}
      <GPanel style={{ padding:"22px 24px" }} accent={T.teal} glow={T.teal}>
        {/* Shimmer header bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"18px 18px 0 0",
          background:`linear-gradient(90deg, transparent, ${T.teal}80, transparent)`,
          backgroundSize:"200% 100%", animation:"shimmer 2.5s linear infinite" }}/>
        <SectionHeader icon="✨" title="AI ICD-10 Recommender" badge="AI-POWERED" accent={T.teal}
          sub="Describe the clinical presentation — AI returns 5 codes ranked by specificity"/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={aiCond} onChange={e=>setAiCond(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&runAiIcd()} accent={T.teal}
            placeholder="e.g. crushing substernal chest pain with diaphoresis radiating to left arm…"/>
          <button onClick={runAiIcd} disabled={aiIcdBusy||!aiCond.trim()}
            style={{
              ...G.btn(T.teal, !aiIcdBusy && !!aiCond.trim()),
              padding:"10px 18px", fontSize:12, flexShrink:0,
              opacity: aiIcdBusy||!aiCond.trim() ? 0.5 : 1,
            }}>
            {aiIcdBusy ? "⏳ Querying…" : "✨ Recommend"}
          </button>
        </div>
        {aiIcdRecs.length>0 && aiIcdRecs.map((r,i)=>(
          <div key={i} style={{
            ...G.row(), padding:"10px 13px", marginBottom:6,
            borderLeft:`2px solid ${T.teal}60`,
            background:`linear-gradient(90deg, ${T.teal}06, ${T.glassD})`,
            animation:`acFade .3s ease ${i*0.06}s both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:r.rationale?4:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:T.teal, textShadow:`0 0 10px ${T.teal}60` }}>{r.code}</span>
                <span style={{ fontSize:12, color:T.txt2 }}>{r.desc}</span>
                {r.specificity && <Chip label={r.specificity} color={r.specificity==="High"?T.green:r.specificity==="Medium"?T.gold:T.txt3}/>}
              </div>
              <button onClick={()=>addToCart(r,"ICD-10")}
                style={{ ...G.btn(T.teal,false), padding:"3px 12px", fontSize:11, flexShrink:0, marginLeft:10 }}>+ Add</button>
            </div>
            {r.rationale && <div style={{ fontSize:10, color:T.txt3, fontStyle:"italic", lineHeight:1.5 }}>{r.rationale}</div>}
          </div>
        ))}
      </GPanel>
    </div>
  );

  const renderCPT = () => (
    <div style={{ animation:"acFade .35s ease" }}>
      <GPanel style={{ padding:"22px 24px" }}>
        <SectionHeader icon="🏥" title="CPT Code Search" badge="CPT-4" accent={T.gold}
          sub={`${CPT_DB.length} codes — procedures, imaging, E&M with RVU values`}/>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <SearchInput value={cptQ} onChange={e=>setCptQ(e.target.value)} accent={T.gold}
            placeholder="Search procedures, imaging, or CPT code…"/>
          <FilterSelect value={cptCat} onChange={setCptCat} options={cptCats}/>
        </div>
        <div style={{ maxHeight:460, overflowY:"auto", paddingRight:2 }}>
          {cptHits.length>0 ? cptHits.map(r=>(
            <CodeRow key={r.code} item={r} accent={T.gold} onAdd={i=>addToCart(i,"CPT")} showRvu/>
          )) : cptQ ? (
            <EmptyState icon="🔍" msg={`No CPT codes matched "${cptQ}"`}/>
          ) : (
            <div style={{ padding:"20px 0" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3, textAlign:"center", marginBottom:16 }}>
                Type a procedure name, or click a category to browse
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center" }}>
                {cptCats.filter(c=>c!=="All").map(cat=>(
                  <FilterPill key={cat} label={cat} active={false} accent={T.gold}
                    onClick={()=>{setCptQ(cat);setCptCat(cat);}}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </GPanel>
    </div>
  );

  const renderEM = () => {
    const visible = emFilter==="All" ? EM_GROUPS : EM_GROUPS.filter(g=>g.label===emFilter);
    return (
      <div style={{ animation:"acFade .35s ease" }}>
        <div style={{ display:"flex", gap:7, marginBottom:16, flexWrap:"wrap" }}>
          {emLabels.map(lab=>{
            const grp = EM_GROUPS.find(g=>g.label===lab);
            return <FilterPill key={lab}
              label={lab==="All"?"All Categories":lab.split("—")[1]?.trim()||lab}
              active={emFilter===lab} accent={grp?.accent||AC} onClick={()=>setEmFilter(lab)}/>;
          })}
        </div>
        {visible.map(grp=>(
          <GPanel key={grp.label} style={{ padding:"18px 22px", marginBottom:12 }} accent={grp.accent}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"18px 18px 0 0",
              background:`linear-gradient(90deg, transparent, ${grp.accent}70, transparent)` }}/>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:grp.accent, textShadow:`0 0 16px ${grp.accent}40` }}>{grp.label}</span>
              <Chip label={`${grp.levels.length} LEVELS`} color={grp.accent}/>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {["Code","Level","Problem Severity","Medical Decision Making","Typical Time"].map(h=>(
                      <th key={h} style={{ padding:"7px 10px", textAlign:"left", color:T.txt3, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                    <th style={{ width:50 }}/>
                  </tr>
                </thead>
                <tbody>
                  {grp.levels.map((lv,i)=>(
                    <tr key={lv.code}
                      style={{ borderBottom:i<grp.levels.length-1?`1px solid ${T.border}`:"none", transition:"background .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=`${grp.accent}07`}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 10px" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:grp.accent, textShadow:`0 0 10px ${grp.accent}50` }}>{lv.code}</span>
                      </td>
                      <td style={{ padding:"10px 10px" }}><Chip label={`Lv ${lv.lvl}`} color={grp.accent}/></td>
                      <td style={{ padding:"10px 10px", color:T.txt,  fontSize:12 }}>{lv.severity}</td>
                      <td style={{ padding:"10px 10px", color:T.txt2, fontSize:11 }}>{lv.mdm}</td>
                      <td style={{ padding:"10px 10px", color:T.txt3, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>{lv.time}</td>
                      <td style={{ padding:"10px 10px" }}>
                        <button onClick={()=>addToCart({code:lv.code,desc:`${grp.label} — Level ${lv.lvl}`,cat:"E&M"},"CPT")}
                          style={{ ...G.btn(grp.accent,false), padding:"3px 11px", fontSize:11 }}>+</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GPanel>
        ))}
        <div style={{ marginTop:4, fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7,
          padding:"10px 15px", background:T.glass1, borderRadius:10, border:`1px solid ${T.border}`, boxShadow:T.shine }}>
          ⚕ 2021 AMA MDM-based guidelines · Time-based billing requires total time documentation
        </div>
      </div>
    );
  };

  const renderAutocoder = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14, animation:"acFade .35s ease" }}>
      <GPanel style={{ padding:"22px 24px" }} accent={T.purple} glow={T.purple}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, borderRadius:"18px 18px 0 0",
          background:`linear-gradient(90deg, transparent, ${T.purple}80, transparent)`,
          backgroundSize:"200% 100%", animation:"shimmer 3s linear infinite" }}/>
        <SectionHeader icon="🤖" title="AI Autocoder" badge="AI-POWERED" accent={T.purple}
          sub="Paste a clinical note — AI extracts all ICD-10 diagnoses, CPT procedures, and the correct E&M level"/>
        <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
          placeholder="Paste clinical note, HPI, assessment & plan, or procedure documentation here…" rows={8}
          style={{
            ...G.input(T.purple), width:"100%", padding:"13px 15px",
            lineHeight:1.65, resize:"vertical",
          }}
          onFocus={e=>{e.target.style.borderColor=`${T.purple}55`;e.target.style.boxShadow=`0 0 0 3px ${T.purple}14,inset 0 1px 0 rgba(255,255,255,0.12)`;}}
          onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow=T.shine;}}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4 }}>
            {noteText.length>0 ? `${noteText.length} chars · ${noteText.trim().split(/\s+/).length} words` : "Paste note to begin"}
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{setNoteText("");setAcResult(null);}}
              style={{ ...G.btn(null,false), padding:"8px 16px", fontSize:12 }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              Clear
            </button>
            <button onClick={runAutocoder} disabled={acBusy||!noteText.trim()}
              style={{ ...G.btn(T.purple, !acBusy && !!noteText.trim()), padding:"8px 22px", fontSize:12,
                opacity:acBusy||!noteText.trim()?0.5:1 }}>
              {acBusy ? "⏳ Autocoding…" : "🤖 Run Autocoder"}
            </button>
          </div>
        </div>
      </GPanel>

      {acResult && (
        <GPanel style={{ padding:"22px 24px", animation:"acFade .4s ease" }}>
          {acResult.summary && (
            <div style={{ ...G.row(), padding:"10px 14px", marginBottom:16,
              borderLeft:`2px solid ${T.purple}60`, background:`linear-gradient(90deg,${T.purple}08,${T.glassD})` }}>
              <span style={{ fontSize:10, color:T.txt3 }}>Summary: </span>
              <span style={{ fontSize:13, color:T.txt2, lineHeight:1.5 }}>{acResult.summary}</span>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:14 }}>
            {/* ICD-10 col */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.teal }}>ICD-10 Diagnoses</span>
                <Chip label={`${(acResult.icd10||[]).length}`} color={T.teal}/>
              </div>
              {(acResult.icd10||[]).map((r,i)=>(
                <div key={i} style={{ ...G.row(), padding:"9px 12px", marginBottom:6, borderLeft:`2px solid ${T.teal}50`,
                  background:`linear-gradient(90deg,${T.teal}06,${T.glassD})` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.teal, textShadow:`0 0 8px ${T.teal}50` }}>{r.code}</span>
                    {r.role==="principal" && <Chip label="Principal" color={T.coral}/>}
                    {r.role==="secondary" && <Chip label="Secondary" color={T.txt3}/>}
                  </div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.35 }}>{r.desc}</div>
                </div>
              ))}
            </div>
            {/* CPT col */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.gold }}>CPT / E&M Codes</span>
                <Chip label={`${(acResult.cpt||[]).length}`} color={T.gold}/>
              </div>
              {(acResult.cpt||[]).map((r,i)=>(
                <div key={i} style={{ ...G.row(), padding:"9px 12px", marginBottom:6, borderLeft:`2px solid ${T.gold}50`,
                  background:`linear-gradient(90deg,${T.gold}06,${T.glassD})` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.gold, textShadow:`0 0 8px ${T.gold}50` }}>{r.code}</span>
                    {r.cat && <Chip label={r.cat} color={T.gold}/>}
                  </div>
                  <div style={{ fontSize:12, color:T.txt2, lineHeight:1.35 }}>{r.desc}</div>
                </div>
              ))}
              {acResult.em_level && (
                <div style={{ ...G.row(), padding:"11px 13px", marginTop:8,
                  background:`linear-gradient(135deg,${T.purple}0e,${T.glassD})`,
                  borderColor:`${T.purple}30`, boxShadow:`0 0 20px ${T.purple}12,${T.shine}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:700, color:T.purple, textShadow:`0 0 10px ${T.purple}60` }}>{acResult.em_level.code}</span>
                    {acResult.em_level.level && <Chip label={`Level ${acResult.em_level.level}`} color={T.purple}/>}
                  </div>
                  {acResult.em_level.rationale && <div style={{ fontSize:11, color:T.txt3, fontStyle:"italic", lineHeight:1.4 }}>{acResult.em_level.rationale}</div>}
                </div>
              )}
            </div>
          </div>
          {acResult.coding_notes && (
            <div style={{ ...G.row(), padding:"9px 13px", marginBottom:14,
              borderLeft:`2px solid ${T.gold}60`, background:`linear-gradient(90deg,${T.gold}07,${T.glassD})` }}>
              <span style={{ fontSize:10, color:T.gold, fontWeight:700, marginRight:7 }}>⚠ Coding Note:</span>
              <span style={{ fontSize:12, color:T.txt3 }}>{acResult.coding_notes}</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>
              ⚕ Clinical decision support only — final decisions rest with the treating physician
            </span>
            <button onClick={importAcToCart}
              style={{ ...G.btn(T.purple,true), padding:"9px 22px", fontSize:12 }}>
              📦 Import All to Cart
            </button>
          </div>
        </GPanel>
      )}
    </div>
  );

  const renderCart = () => (
    <div style={{ animation:"acFade .35s ease" }}>
      {cart.length===0 ? (
        <GPanel style={{ padding:"60px 40px", textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:14, opacity:0.4 }}>🛒</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.txt2, marginBottom:6 }}>Your cart is empty</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt3 }}>Search ICD-10 or CPT codes, browse E&M levels, or run the AI Autocoder</div>
        </GPanel>
      ) : (
        <div>
          <GPanel style={{ padding:"22px 24px", marginBottom:12 }}>
            <SectionHeader icon="📦" title="Code Cart" badge={`${cart.length} CODES`} accent={T.coral}
              sub="Review collected codes for claim submission"/>
            {["ICD-10","CPT"].map(type=>{
              const items = cart.filter(c=>c.type===type);
              if (!items.length) return null;
              const accent = type==="ICD-10" ? T.teal : T.gold;
              return (
                <div key={type} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:accent }}>{type} Codes</span>
                    <Chip label={`${items.length}`} color={accent}/>
                  </div>
                  {items.map(item=>(
                    <div key={item.code} style={{ ...G.row(), display:"flex", alignItems:"center", gap:10, padding:"9px 13px", marginBottom:5 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:accent, minWidth:74, textShadow:`0 0 10px ${accent}50` }}>{item.code}</span>
                      <span style={{ fontSize:12, color:T.txt2, flex:1 }}>{item.desc}</span>
                      {item.cat && <Chip label={item.cat} color={accent}/>}
                      {item.rvu && <Chip label={`${item.rvu} RVU`} color={T.purple}/>}
                      <button onClick={()=>removeFromCart(item.code)}
                        style={{ ...G.btn(T.coral,false), padding:"3px 10px", fontSize:11, color:T.coral }}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </GPanel>
          {cart.some(c=>c.rvu) && (
            <div style={{ ...G.row(), display:"flex", alignItems:"center", gap:14, padding:"12px 20px", marginBottom:10, borderRadius:12 }}>
              <span style={{ fontSize:11, color:T.txt3 }}>Total wRVU (CPT)</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color:T.purple, textShadow:`0 0 16px ${T.purple}60` }}>
                {cart.filter(c=>c.rvu).reduce((s,c)=>s+(c.rvu||0),0).toFixed(2)}
              </span>
              <span style={{ fontSize:10, color:T.txt4 }}>work RVUs</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.txt4 }}>{cart.length} code{cart.length!==1?"s":""} collected</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{navigator.clipboard?.writeText(cart.map(c=>`${c.code}  ${c.desc}`).join("\n"));toast("Copied to clipboard","success");}}
                style={{ ...G.btn(null,false), padding:"8px 16px", fontSize:12 }}>📋 Copy All</button>
              <button onClick={()=>{setCart([]);toast("Cart cleared","info");}}
                style={{ ...G.btn(T.coral,false), padding:"8px 16px", fontSize:12, color:T.coral }}>🗑 Clear Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Navigation ────────────────────────────────────────────
  const NAV = [
    { id:"icd10",     icon:"🧬", label:"ICD-10",       accent:T.teal   },
    { id:"cpt",       icon:"🏥", label:"CPT Codes",    accent:T.gold   },
    { id:"em",        icon:"📋", label:"E&M Levels",   accent:T.blue   },
    { id:"autocoder", icon:"🤖", label:"AI Autocoder", accent:T.purple },
    { id:"cart",      icon:"📦", label:"Code Cart",    accent:T.coral, badge:cart.length||null },
  ];
  const SECTIONS = { icd10:renderICD10, cpt:renderCPT, em:renderEM, autocoder:renderAutocoder, cart:renderCart };
  const activeNav = NAV.find(n=>n.id===nav);

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:`linear-gradient(135deg, #04080f 0%, #07101e 50%, #04080f 100%)`, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>
      <AmbientBg/>

      {/* ── SIDEBAR — deep frosted glass ── */}
      <nav style={{
        width:224, minHeight:"100vh", position:"relative", zIndex:10, flexShrink:0,
        background:"rgba(255,255,255,0.04)",
        backdropFilter:"blur(40px) saturate(180%)",
        WebkitBackdropFilter:"blur(40px) saturate(180%)",
        borderRight:`1px solid rgba(255,255,255,0.09)`,
        boxShadow:`4px 0 40px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.03)`,
        display:"flex", flexDirection:"column", padding:"24px 14px", gap:3,
      }}>
        {/* Top edge shine */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", pointerEvents:"none" }}/>

        {/* Wordmark */}
        <div style={{ marginBottom:28, paddingLeft:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
              background:`linear-gradient(135deg,${AC}40,${T.teal}20)`,
              border:`1px solid ${AC}30`, boxShadow:`0 0 16px ${AC}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
              fontSize:16 }}>⚕️</div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.txt, letterSpacing:"-0.3px" }}>Notrya</span>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:AC, letterSpacing:".18em", textTransform:"uppercase", paddingLeft:42,
            textShadow:`0 0 12px ${AC}80` }}>Autocoder Hub</div>
        </div>

        {/* Nav buttons */}
        {NAV.map(item=>{
          const active = nav===item.id;
          return (
            <button key={item.id} onClick={()=>setNav(item.id)}
              style={{
                display:"flex", alignItems:"center", gap:9, padding:"10px 12px", borderRadius:11,
                border: active ? `1px solid ${item.accent}30` : "1px solid transparent",
                width:"100%", cursor:"pointer", textAlign:"left",
                fontFamily:"'DM Sans',sans-serif", fontSize:13,
                fontWeight:active?600:400, transition:"all .2s", position:"relative",
                background: active
                  ? `linear-gradient(135deg,${item.accent}18,${item.accent}08)`
                  : "transparent",
                color: active ? item.accent : T.txt3,
                boxShadow: active ? `0 0 20px ${item.accent}14, inset 0 1px 0 rgba(255,255,255,0.07)` : "none",
              }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color=T.txt2;}}}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=T.txt3;}}}>
              {active && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2.5, height:20, background:item.accent, borderRadius:"0 3px 3px 0", boxShadow:`0 0 8px ${item.accent}` }}/>}
              <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge>0 && (
                <span style={{ background:`linear-gradient(135deg,${item.accent},${item.accent}aa)`, color:"#fff", borderRadius:10,
                  minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:700, padding:"0 5px", boxShadow:`0 0 10px ${item.accent}60` }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ flex:1 }}/>

        {/* Cart tile */}
        <div style={{
          padding:"13px 14px", borderRadius:12, marginBottom:7,
          background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.09)`,
          boxShadow:`0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
          backdropFilter:"blur(12px)",
        }}>
          <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:T.txt4, textTransform:"uppercase", letterSpacing:".12em", marginBottom:5 }}>Cart</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color:T.coral, lineHeight:1, textShadow:`0 0 16px ${T.coral}60` }}>{cart.length}</div>
          <div style={{ fontSize:10, color:T.txt4, marginTop:3 }}>code{cart.length!==1?"s":""} collected</div>
        </div>

        {/* AI status pill */}
        <div style={{
          display:"flex", alignItems:"center", gap:7, padding:"8px 12px", borderRadius:9,
          background:"rgba(45,212,191,0.04)", border:"1px solid rgba(45,212,191,0.15)",
          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, animation:"pulse 2s ease-in-out infinite", boxShadow:`0 0 8px ${T.teal}` }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>AI Ready</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, padding:"30px 38px 52px", overflowY:"auto", position:"relative", zIndex:1 }}>
        {/* Section label strip */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
          <div style={{ height:1, width:24, background:`${activeNav?.accent||AC}60`, borderRadius:1, boxShadow:`0 0 6px ${activeNav?.accent||AC}` }}/>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:activeNav?.accent||AC,
            textTransform:"uppercase", letterSpacing:".14em", fontWeight:700,
            textShadow:`0 0 14px ${activeNav?.accent||AC}80` }}>
            {activeNav?.label}
          </span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${activeNav?.accent||AC}30,transparent)` }}/>
          <span style={{ fontSize:10, color:T.txt4, fontFamily:"'JetBrains Mono',monospace" }}>Notrya · Clinical Coding</span>
        </div>

        {(SECTIONS[nav]||(() => null))()}
      </main>

      {/* ── TOASTS — frosted glass ── */}
      <div style={{ position:"fixed", bottom:22, right:22, display:"flex", flexDirection:"column", gap:7, zIndex:200 }}>
        {toasts.map(t=>{
          const color = t.type==="success"?T.green:t.type==="error"?T.coral:t.type==="warn"?T.gold:T.blue;
          return (
            <div key={t.id} style={{
              padding:"10px 18px", borderRadius:12,
              background:"rgba(255,255,255,0.07)",
              backdropFilter:"blur(28px) saturate(160%)",
              WebkitBackdropFilter:"blur(28px) saturate(160%)",
              border:`1px solid ${color}30`,
              color, fontFamily:"'DM Sans',sans-serif", fontSize:13,
              boxShadow:`0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${color}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
              animation:"acFade .25s ease", whiteSpace:"nowrap",
              textShadow:`0 0 10px ${color}60`,
            }}>{t.msg}</div>
          );
        })}
      </div>
    </div>
  );
}