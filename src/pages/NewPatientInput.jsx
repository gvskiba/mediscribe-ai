import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import AutoCoderTab from "@/components/npi/AutoCoderTab";
import DischargePlanning from "@/pages/DischargePlanning";
import EDProcedureNotes from "@/pages/EDProcedureNotes";
import MedicationReferencePage from "@/pages/MedicationReference";
import ERPlanBuilder from "@/pages/ERPlanBuilder";
import ResultsViewer from "@/pages/ResultsViewer";
import CDSAlertsSidebar from "@/components/npi/CDSAlertsSidebar";
import ERxHub from "@/pages/ERx";
import ClinicalNoteStudio from "@/components/npi/ClinicalNoteStudio";
import ReassessmentTab from "@/components/npi/ReassessmentTab";
import ClinicalTimeline from "@/components/npi/ClinicalTimeline";
import VitalSignsChart  from "@/components/npi/VitalSignsChart";
import InlineHPITab from "@/components/npi/InlineHPITab";
import OrdersPanel from "@/components/npi/OrdersPanel";
import { NPI_CSS } from "@/components/npi/npiStyles";

// ─── NAV DATA ─────────────────────────────────────────────────────────────────
const NAV_DATA = {
  intake: [
    { section: "triage",     icon: "🏷️", label: "Triage",           abbr: "Tr", dot: "empty" },
    { section: "demo",       icon: "👤", label: "Demographics",      abbr: "Dm", dot: "empty" },
    { section: "cc",         icon: "💬", label: "Chief Complaint",   abbr: "Cc", dot: "empty" },
    { section: "vit",        icon: "📈", label: "Vitals",            abbr: "Vt", dot: "empty" },
    { section: "meds",       icon: "💊", label: "Meds & PMH",        abbr: "Rx", dot: "empty" },
    { section: "sdoh",       icon: "🏘️", label: "SDOH Screening",    abbr: "Sd", dot: "empty" },
  ],
  assess: [
    { section: "summary",  icon: "📊", label: "Patient Summary",    abbr: "Sm", dot: "empty" },
    { section: "hpi",        icon: "📝", label: "HPI",               abbr: "Hp", dot: "empty" },
    { section: "ros",        icon: "🔍", label: "Review of Systems", abbr: "Rs", dot: "empty" },
    { section: "pe",         icon: "🩺", label: "Physical Exam",     abbr: "Pe", dot: "empty" },
    { section: "erplan",     icon: "🗺️", label: "ER Plan Builder",   abbr: "Ep", dot: "empty" },
  ],
  orders: [
    { section: "orders",     icon: "📋", label: "Orders",            abbr: "Or", dot: "empty" },
    { section: "erx",        icon: "💉", label: "eRx",               abbr: "Ex", dot: "empty" },
    { section: "procedures", icon: "✂️", label: "Procedures",        abbr: "Pr", dot: "empty" },
    { section: "consult",    icon: "👥", label: "Consults",          abbr: "Co", dot: "empty" },
  ],
  close: [
    { section: "chart",      icon: "📄", label: "Clinical Note",     abbr: "Cn", dot: "empty" },
    { section: "reassess",   icon: "🔄", label: "Reassessment",      abbr: "Ra", dot: "empty" },
    { section: "autocoder",  icon: "🤖", label: "AutoCoder",         abbr: "Ac", dot: "empty" },
    { section: "timeline",   icon: "⏱",  label: "Timeline",          abbr: "Tl", dot: "empty" },
    { section: "closeout",   icon: "✅", label: "Close-out",         abbr: "Cl", dot: "empty" },
    { section: "handoff",    icon: "🤝", label: "Handoff (I-PASS)",  abbr: "Ho", dot: "empty" },
    { section: "discharge",  icon: "🚪", label: "Discharge",         abbr: "Dc", dot: "empty" },
  ],
  tools: [
    { section: "sepsis",     icon: "🦠", label: "Sepsis Protocol",   abbr: "Sp", dot: "empty", href: "/SepsisHub"           },
    { section: "ecg",        icon: "❤️", label: "ECG Review",        abbr: "Eg", dot: "empty", href: "/ECGHub"              },
    { section: "psych",      icon: "🧠", label: "Psych Assessment",  abbr: "Px", dot: "empty", href: "/PsychHub"            },
    { section: "resus",      icon: "🫀", label: "Resus Hub",         abbr: "Rh", dot: "empty", href: "/ResusHub"            },
    { section: "labsint",    icon: "🔬", label: "Labs Interpreter",  abbr: "Li", dot: "empty", href: "/LabsInterpreter"     },
    { section: "knowledge",  icon: "📚", label: "Knowledge Base",    abbr: "Kb", dot: "empty", href: "/KnowledgeBaseV2"     },
    { section: "results",    icon: "🧪", label: "Results",           abbr: "Re", dot: "empty", href: "/Results"             },
    { section: "medref",     icon: "🧬", label: "ED Med Ref",        abbr: "Mr", dot: "empty", href: "/MedicationReference" },
    { section: "calc",       icon: "🧮", label: "Calculators",       abbr: "Ca", dot: "empty", href: "/Calculators"         },
    { section: "hub",        icon: "🏥", label: "Clinical Hub",      abbr: "Hb", dot: "empty", href: "/hub"                 },
  ],
};

const GROUP_META = [
  { key: "intake",  icon: "📋", label: "Intake"  },
  { key: "assess",  icon: "🔍", label: "Assess"  },
  { key: "orders",  icon: "📋", label: "Orders"  },
  { key: "close",   icon: "📝", label: "Close"   },
  { key: "tools",   icon: "🔧", label: "Tools"   },
];

const ALL_SECTIONS = Object.values(NAV_DATA).flat();

const SHORTCUT_MAP = {
  "1": "triage", "2": "demo",  "3": "cc",
  "4": "vit",    "5": "meds",  "6": "hpi",
  "7": "ros",    "8": "pe",    "9": "orders",
  "0": "discharge",
};
const SECTION_SHORTCUT = Object.fromEntries(
  Object.entries(SHORTCUT_MAP).map(([k, v]) => [v, k])
);

const QUICK_ACTIONS = [
  { icon: "📋", label: "Summarise", prompt: "Summarise what I have entered so far."                  },
  { icon: "🔍", label: "Check",     prompt: "What am I missing? Check my entries for completeness." },
  { icon: "📝", label: "Draft Note",prompt: "Generate a draft note from the data entered."           },
  { icon: "🧠", label: "DDx",       prompt: "Suggest differential diagnoses based on current data." },
  { icon: "⚖️",  label: "MDM",      prompt: "Draft a compliant AMA/CPT 2023 Medical Decision Making paragraph. Include: (1) Number & complexity of problems addressed (COPA), (2) Amount & complexity of data reviewed, (3) Risk level (Minimal/Low/Moderate/High) with specific table-of-risk elements. Note any diagnoses considered but not ordered, and any social risk factors (housing, food, transportation) that affect management." },
];

const ROS_RAIL_SYSTEMS = [
  { id: "const",   icon: "🌡️", label: "Constitutional"    },
  { id: "heent",   icon: "👁️", label: "HEENT"             },
  { id: "cv",      icon: "❤️", label: "Cardiovascular"    },
  { id: "resp",    icon: "🫁", label: "Respiratory"       },
  { id: "gi",      icon: "🫃", label: "GI / Abdomen"      },
  { id: "gu",      icon: "🔵", label: "Genitourinary"     },
  { id: "msk",     icon: "🦴", label: "MSK"               },
  { id: "neuro",   icon: "🧠", label: "Neurological"      },
  { id: "psych",   icon: "🧘", label: "Psychiatric"       },
  { id: "skin",    icon: "🩹", label: "Skin"              },
  { id: "endo",    icon: "⚗️", label: "Endocrine"         },
  { id: "heme",    icon: "🩸", label: "Heme / Lymph"      },
  { id: "allergy", icon: "🌿", label: "Allergic / Immuno" },
];
const PE_RAIL_SYSTEMS = [
  { id: "gen",   icon: "🧍", label: "General"        },
  { id: "heent", icon: "👁️", label: "HEENT"          },
  { id: "neck",  icon: "🔵", label: "Neck"           },
  { id: "cv",    icon: "❤️", label: "Cardiovascular" },
  { id: "resp",  icon: "🫁", label: "Respiratory"    },
  { id: "abd",   icon: "🫃", label: "Abdomen"        },
  { id: "msk",   icon: "🦴", label: "MSK"            },
  { id: "neuro", icon: "🧠", label: "Neurological"   },
  { id: "skin",  icon: "🩹", label: "Skin"           },
  { id: "psych", icon: "🧘", label: "Psychiatric"    },
];

const SYSTEM_PROMPT =
  "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2-4 concise, actionable sentences. Be direct. Never fabricate data.";

// ─── PATIENT CONTEXT BUILDER ──────────────────────────────────────────────────
function buildPatientCtx(demo, cc, vitals, allergies, pmhSelected, currentTab) {
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).join(", ") || "none";
  return [
    `Patient: ${name}, ${demo.age || "?"}${demo.sex ? " " + demo.sex : ""}.`,
    cc.text     ? `CC: ${cc.text}.`                                                                   : null,
    vitals.bp   ? `BP ${vitals.bp}  HR ${vitals.hr || "-"}  SpO2 ${vitals.spo2 || "-"}  T ${vitals.temp || "-"}.` : null,
    allergies.length ? `Allergies: ${allergies.join(", ")}.`                                          : "Allergies: NKDA.",
    pmhList !== "none" ? `PMH: ${pmhList}.`                                                           : null,
    cc.hpi      ? `HPI summary: ${cc.hpi.slice(0, 200)}.`                                             : null,
    `Active section: ${currentTab}.`,
  ].filter(Boolean).join(" ");
}

// ─── BEERS CRITERIA (AGE ≥ 65 DRUG SAFETY) ───────────────────────────────────
const BEERS_DRUGS = [
  "alprazolam","diazepam","lorazepam","clonazepam","temazepam","triazolam","oxazepam","chlordiazepoxide",
  "cyclobenzaprine","carisoprodol","methocarbamol","chlorzoxazone","orphenadrine",
  "diphenhydramine","hydroxyzine","promethazine","doxylamine","meclizine",
  "zolpidem","zaleplon","eszopiclone",
  "amitriptyline","imipramine","doxepin","nortriptyline",
  "indomethacin","ketorolac","piroxicam",
  "meperidine","pentazocine","butorphanol",
];

// ─── CC-TRIGGERED RISK SCORE HINTS ───────────────────────────────────────────
function getCCRiskHints(ccText) {
  const t = (ccText || "").toLowerCase();
  const h = [];
  if (/chest.?pain|cp\b|angina|acs|troponin/.test(t))
    h.push({ tier:"advisory", score:"HEART Pathway", use:"ACS risk stratification", action:"Score \u22643 \u2192 low risk (MACE <2%), consider discharge" });
  if (/short.?ness|sob\b|dyspnea|breath/.test(t))
    h.push({ tier:"advisory", score:"PERC Rule", use:"Rule out PE if pre-test probability <15%", action:"All 8 criteria negative \u2192 no workup needed" });
  if (/syncope|faint|passed.?out|black.?out/.test(t))
    h.push({ tier:"advisory", score:"SF Syncope Rule", use:"Short-term serious outcome prediction", action:"Any CHESS criterion positive \u2192 high risk" });
  if (/head|trauma|fall|collision|mvc|blow/.test(t))
    h.push({ tier:"info", score:"PECARN (age <18)", use:"Clinically important TBI, minimize CT", action:"Age-stratified algorithm \u2192 select imaging" });
  if (/ankle|knee/.test(t))
    h.push({ tier:"info", score:"Ottawa Rules", use:"Reduce unnecessary radiographs", action:"Bony-landmark tenderness \u2192 X-ray indicated" });
  if (/pneumonia|pna|cough.*fever|fever.*cough/.test(t))
    h.push({ tier:"info", score:"PSI / PORT Score", use:"CAP severity \u2014 discharge vs. admit", action:"Class I\u2013II \u2192 low-risk outpatient candidate" });
  if (/back.?pain|neck.?pain|c-spine|c.?spine/.test(t))
    h.push({ tier:"info", score:"Canadian C-Spine Rule", use:"Cervical spine imaging decision", action:"Low-risk criteria + range of motion \u2192 no CT" });
  return h;
}

// ─── SDOH WIDGET ──────────────────────────────────────────────────────────────
const SDOH_DOMAINS = [
  { key:"housing",   icon:"🏠", label:"Housing",     q:"Is housing stable?",         opts:["Stable","Unstable","Homeless / at risk"]      },
  { key:"food",      icon:"🍎", label:"Food",         q:"Food access adequate?",      opts:["Adequate","Inconsistent","Insecure / hungry"]  },
  { key:"transport", icon:"🚗", label:"Transport",    q:"Can get to appointments?",   opts:["No barrier","Occasional barrier","Major barrier"] },
  { key:"utilities", icon:"💡", label:"Utilities",    q:"Heat / water stable?",       opts:["Stable","At risk","Shut off / absent"]         },
  { key:"isolation", icon:"👥", label:"Social",       q:"Social support adequate?",   opts:["Connected","Limited","Isolated"]               },
  { key:"safety",    icon:"🛡️", label:"Safety",       q:"Feels safe at home?",        opts:["Safe","Unsure","Unsafe / IPV concern"]         },
];

const TIER_COLORS = { "0":"#00e5c0", "1":"#f5c842", "2":"#ff6b6b" };

function SDOHWidget({ sdoh, setSdoh, onAdvance }) {
  const positiveCount  = Object.values(sdoh).filter(v => v === "2").length;
  const concernCount   = Object.values(sdoh).filter(v => v === "1").length;
  const screenedCount  = Object.values(sdoh).filter(Boolean).length;
  const g0136Eligible  = screenedCount >= 4;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"var(--npi-txt)" }}>
            SDOH Screening
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", marginTop:2 }}>
            Social Determinants of Health — CMS Gravity Protocol
          </div>
        </div>
        {g0136Eligible && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5, textTransform:"uppercase",
            padding:"4px 10px", borderRadius:6, background:"rgba(0,229,192,0.1)",
            border:"1px solid rgba(0,229,192,0.35)", color:"var(--npi-teal)" }}>
            G0136 Billable
          </span>
        )}
      </div>

      {/* Positive summary strip */}
      {positiveCount > 0 && (
        <div style={{ padding:"10px 14px", borderRadius:9, background:"rgba(255,107,107,0.07)",
          border:"1px solid rgba(255,107,107,0.3)", fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"#ff8a8a", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14 }}>⚠</span>
          <span><strong>{positiveCount}</strong> positive screen{positiveCount>1?"s":""} — document social risk in MDM (counts as Moderate Risk, AMA CPT 2023)</span>
        </div>
      )}

      {/* Domain grid */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {SDOH_DOMAINS.map(d => (
          <div key={d.key} style={{ padding:"10px 12px", borderRadius:9,
            background:"rgba(14,37,68,0.6)", border:`1px solid ${
              sdoh[d.key]==="2"?"rgba(255,107,107,0.35)":sdoh[d.key]==="1"?"rgba(245,200,66,0.3)":"rgba(26,53,85,0.5)"}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"var(--npi-txt)", display:"flex", alignItems:"center", gap:6 }}>
                {d.icon} {d.label}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>{d.q}</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {d.opts.map((opt, i) => {
                const active = sdoh[d.key] === String(i);
                const col = TIER_COLORS[String(i)];
                return (
                  <button key={i} onClick={() => setSdoh(p => ({ ...p, [d.key]: active ? "" : String(i) }))}
                    style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer", fontSize:11,
                      fontFamily:"'DM Sans',sans-serif", fontWeight: active ? 600 : 400,
                      border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                      background: active ? col+"18" : "transparent",
                      color: active ? col : "var(--npi-txt4)", transition:"all .12s" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Progress summary */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1,
        display:"flex", gap:16, paddingTop:4 }}>
        <span>{screenedCount}/6 domains screened</span>
        {concernCount > 0 && <span style={{ color:"#f5c842" }}>{concernCount} at-risk</span>}
        {positiveCount > 0 && <span style={{ color:"#ff8a8a" }}>{positiveCount} positive</span>}
        {!g0136Eligible && screenedCount > 0 && <span>Screen {4-screenedCount} more for G0136</span>}
      </div>

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to HPI &#9654;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TRIAGE TAB ───────────────────────────────────────────────────────────────
const ESI_CFG = [
  { level:1, label:"Immediate",   color:"#ff6b6b", desc:"Life-threatening"     },
  { level:2, label:"Emergent",    color:"#ff9f43", desc:"High-risk / unstable" },
  { level:3, label:"Urgent",      color:"#f5c842", desc:"Stable, 2+ resources" },
  { level:4, label:"Less Urgent", color:"#00e5c0", desc:"1 resource expected"  },
  { level:5, label:"Non-urgent",  color:"#8892a4", desc:"No resources needed"  },
];

function TriageTab({ esiLevel, setEsiLevel, triage, setTriage, avpu, setAvpu, pain, setPain, onAdvance }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ESI Level */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          ESI Level — Emergency Severity Index
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {ESI_CFG.map(({ level, label, color, desc }) => {
            const active = esiLevel === String(level);
            return (
              <button key={level} onClick={() => setEsiLevel(String(level))}
                style={{ flex:1, padding:"12px 6px", borderRadius:10, cursor:"pointer", transition:"all .14s",
                  border:`2px solid ${active ? color : "rgba(42,77,114,0.4)"}`,
                  background: active ? `${color}18` : "rgba(14,37,68,0.5)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700,
                  color: active ? color : "var(--npi-txt3)" }}>{level}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, marginTop:2,
                  color: active ? color : "var(--npi-txt3)" }}>{label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:3 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Triage note */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Triage Assessment Note
        </div>
        <textarea value={triage} onChange={e => setTriage(e.target.value)} rows={4}
          placeholder="Document presenting complaint, initial appearance, chief concern..."
          style={{ width:"100%", background:"rgba(14,37,68,0.8)",
            border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.3)",
            borderRadius:9, padding:"9px 12px", color:"var(--npi-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
            resize:"none", boxSizing:"border-box" }} />
      </div>

      {/* AVPU */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Mental Status — AVPU
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["Alert","Verbal","Pain","Unresponsive"].map(v => {
            const active = avpu === v;
            return (
              <button key={v} onClick={() => setAvpu(v)}
                style={{ flex:1, padding:"9px 4px", borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? "rgba(59,158,255,0.5)" : "rgba(42,77,114,0.4)"}`,
                  background: active ? "rgba(59,158,255,0.1)" : "transparent",
                  color: active ? "#3b9eff" : "var(--npi-txt3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active ? 600 : 400 }}>
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pain scale */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Pain Score (0\u201310)
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Array.from({ length:11 }, (_, i) => i).map(i => {
            const col   = i <= 3 ? "#00e5c0" : i <= 6 ? "#f5c842" : "#ff6b6b";
            const active = pain === String(i);
            return (
              <button key={i} onClick={() => setPain(String(i))}
                style={{ width:38, height:38, borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                  background: active ? col+"18" : "transparent",
                  color: active ? col : "var(--npi-txt3)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight: active ? 700 : 400 }}>
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      {(esiLevel || triage || avpu) && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.2)",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, display:"flex", gap:12, flexWrap:"wrap" }}>
          {esiLevel && <span><span style={{ color:"var(--npi-teal)", fontWeight:700 }}>ESI {esiLevel}</span></span>}
          {avpu     && <span style={{ color:"var(--npi-txt3)" }}>AVPU: {avpu}</span>}
          {pain     && <span style={{ color:"var(--npi-txt3)" }}>Pain: {pain}/10</span>}
        </div>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to Demographics &#9654;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CONSULT TAB ──────────────────────────────────────────────────────────────
function ConsultTab({ consults, setConsults, onAdvance }) {
  const [svcIn,  setSvcIn]  = useState("");
  const [qIn,    setQIn]    = useState("");
  const [respIn, setRespIn] = useState({});

  const elapsed = ts => {
    const m = Math.floor((Date.now() - ts) / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  function addConsult(svc, q) {
    if (!svc.trim()) return;
    setConsults(prev => [...prev, {
      id: Date.now(), service: svc.trim(), question: q.trim(),
      requestedAt: Date.now(), status: "pending", response: "",
    }]);
    setSvcIn(""); setQIn("");
  }

  function markReceived(id, resp) {
    setConsults(prev => prev.map(c => c.id === id ? { ...c, status:"completed", response:resp } : c));
    setRespIn(p => { const n = { ...p }; delete n[id]; return n; });
  }

  const inputBase = {
    background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
    borderRadius:7, padding:"7px 10px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
    width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Add consult */}
      <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(14,37,68,0.7)",
        border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.35)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>
          Request New Consult
        </div>
        <input value={svcIn} onChange={e => setSvcIn(e.target.value)}
          placeholder="Consulting service (e.g. Cardiology, Surgery, Neurology)"
          style={{ ...inputBase, marginBottom:8 }} />
        <textarea value={qIn} onChange={e => setQIn(e.target.value)}
          placeholder="Clinical question / reason for consult..." rows={2}
          style={{ ...inputBase, resize:"none", marginBottom:10 }} />
        <button onClick={() => addConsult(svcIn, qIn)}
          style={{ padding:"7px 18px", borderRadius:7, border:"1px solid rgba(0,229,192,0.4)",
            background:"rgba(0,229,192,0.1)", color:"var(--npi-teal)",
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          + Add Consult
        </button>
      </div>

      {/* Active consults list */}
      {consults.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
            Active Consults ({consults.length})
          </div>
          {consults.map(c => (
            <div key={c.id} style={{ padding:"12px 14px", borderRadius:10,
              background:"rgba(14,37,68,0.7)",
              border:`1px solid ${c.status === "completed" ? "rgba(0,229,192,0.25)" : "rgba(245,200,66,0.25)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:"var(--npi-txt)" }}>
                  {c.service}
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-txt4)" }}>
                  {elapsed(c.requestedAt)} ago
                </span>
              </div>
              {c.question && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt3)", marginBottom:8 }}>
                  {c.question}
                </div>
              )}
              {c.status === "pending" ? (
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={respIn[c.id] || ""} onChange={e => setRespIn(p => ({ ...p, [c.id]:e.target.value }))}
                    placeholder="Consultant response / recommendations..."
                    style={{ flex:1, background:"rgba(8,24,48,0.6)", border:"1px solid rgba(26,53,85,0.55)",
                      borderRadius:6, padding:"5px 9px", color:"var(--npi-txt)",
                      fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }} />
                  <button onClick={() => markReceived(c.id, respIn[c.id] || "")}
                    style={{ padding:"5px 12px", borderRadius:6, border:"1px solid rgba(0,229,192,0.4)",
                      background:"rgba(0,229,192,0.08)", color:"var(--npi-teal)",
                      fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      cursor:"pointer", whiteSpace:"nowrap" }}>
                    Mark Received
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"var(--npi-teal)", fontSize:11 }}>\u2713 Received</span>
                  {c.response && (
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt3)" }}>
                      {c.response}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"28px 0" }}>
          No consults requested yet
        </div>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Continue to Clinical Note &#9654;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PARSE FAB ────────────────────────────────────────────────────────────────
function ParseFab({ parseText, setParseText, parsing, onParse, tabLabel }) {
  const [open, setOpen] = useState(false);
  const taRef = useRef(null);
  useEffect(() => { if (open) setTimeout(() => taRef.current?.focus(), 120); }, [open]);
  return (
    <div style={{ position:"fixed", bottom:72, right:18, zIndex:9990 }}>
      {open && (
        <div style={{ position:"absolute", bottom:56, right:0, width:318,
          background:"#081628", border:"1px solid #1a3555", borderRadius:12,
          padding:"14px 16px", boxShadow:"0 16px 56px rgba(0,0,0,.65)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Paste & Parse \u2192 {tabLabel}
          </div>
          <textarea ref={taRef} value={parseText} onChange={e => setParseText(e.target.value)} rows={5}
            placeholder="Paste triage note, EMS report, nursing note, or any clinical text..."
            style={{ width:"100%", background:"rgba(8,24,48,0.85)",
              border:"1px solid rgba(26,53,85,0.65)", borderRadius:8,
              padding:"8px 10px", color:"var(--npi-txt)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
              resize:"none", boxSizing:"border-box", marginBottom:10 }} />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button onClick={() => setOpen(false)}
              style={{ padding:"6px 12px", borderRadius:7,
                border:"1px solid rgba(42,77,114,0.5)", background:"transparent",
                color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif",
                fontSize:11, cursor:"pointer" }}>Cancel</button>
            <button onClick={() => { onParse(); setOpen(false); }}
              disabled={parsing || !parseText.trim()}
              style={{ padding:"6px 14px", borderRadius:7,
                border:"1px solid rgba(0,229,192,0.4)",
                background: parsing ? "transparent" : "rgba(0,229,192,0.1)",
                color: parsing ? "var(--npi-txt4)" : "var(--npi-teal)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                cursor: parsing ? "default" : "pointer" }}>
              {parsing ? "Parsing..." : "\u2728 Parse"}
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        title="Paste & Parse clinical text into current section"
        style={{ width:44, height:44, borderRadius:22,
          border:`1px solid ${open ? "rgba(0,229,192,0.6)" : "rgba(0,229,192,0.35)"}`,
          background: open ? "rgba(0,229,192,0.18)" : "rgba(8,22,46,0.95)",
          color:"var(--npi-teal)", fontSize:17, cursor:"pointer",
          boxShadow:"0 4px 20px rgba(0,0,0,.5)", display:"flex",
          alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(8px)" }}>
        {open ? "\u2715" : "\uD83D\uDCCB"}
      </button>
    </div>
  );
}

// ─── DISPOSITION / CLOSE-OUT TAB ──────────────────────────────────────────────
const DISPOSITION_OPTS = [
  { val:"discharge",   icon:"\uD83D\uDEAA", label:"Discharge",    color:"#00e5c0", desc:"Home or follow-up care"       },
  { val:"admit",       icon:"\uD83C\uDFE5", label:"Admit",         color:"#3b9eff", desc:"Inpatient admission"           },
  { val:"observation", icon:"\uD83D\uDD0D", label:"Observation",   color:"#f5c842", desc:"Outpatient obs status"         },
  { val:"transfer",    icon:"\uD83D\uDE91", label:"Transfer",       color:"#ff9f43", desc:"Transfer to another facility" },
  { val:"ama",         icon:"\u26A0\uFE0F", label:"AMA",            color:"#ff6b6b", desc:"Against medical advice"       },
  { val:"expired",     icon:"\u2020",       label:"Expired",        color:"#8892a4", desc:"Patient expired in ED"        },
];

function DispositionTab({ disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime, onAdvance }) {
  const sel = DISPOSITION_OPTS.find(o => o.val === disposition);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Selector grid */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          Disposition Decision — Required Before Sign &amp; Save
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {DISPOSITION_OPTS.map(({ val, icon, label, color, desc }) => {
            const active = disposition === val;
            return (
              <button key={val} onClick={() => setDisposition(active ? "" : val)}
                style={{ padding:"12px 8px", borderRadius:10, cursor:"pointer", textAlign:"center",
                  border:`2px solid ${active ? color : "rgba(42,77,114,0.4)"}`,
                  background: active ? `${color}18` : "rgba(14,37,68,0.5)",
                  transition:"all .14s" }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                  color: active ? color : "var(--npi-txt3)" }}>{label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--npi-txt4)", marginTop:2 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason + time — shown once a disposition is chosen */}
      {disposition && (
        <>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
              Disposition Reason / Instructions
            </div>
            <textarea value={dispReason} onChange={e => setDispReason(e.target.value)} rows={3}
              placeholder={`Document reason for ${disposition}, follow-up plan, return precautions...`}
              style={{ width:"100%", background:"rgba(14,37,68,0.8)",
                border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.3)",
                borderRadius:9, padding:"9px 12px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
                resize:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Departure Time</div>
              <input type="time" value={dispTime} onChange={e => setDispTime(e.target.value)}
                style={{ background:"rgba(14,37,68,0.8)", border:"1px solid rgba(26,53,85,0.55)",
                  borderRadius:8, padding:"7px 10px", color:"var(--npi-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:13, outline:"none" }} />
            </div>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:9,
              background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.2)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-teal)",
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{sel?.icon}</span>
              <span><strong>{sel?.label}</strong>{dispTime ? ` \u2014 ${dispTime}` : ""}</span>
            </div>
          </div>
        </>
      )}

      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            Proceed to Discharge &#9654;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SYSTEM PROGRESS HEADER (ROS + PE) ───────────────────────────────────────
// Replaces the per-system rail sub-items with a compact in-content header.
// Literature basis: NIST progressive disclosure + NCSU cascading-dialog preference.
function SystemProgressHeader({ systems, activeIdx, onSelect, getDot }) {
  const sys    = systems[activeIdx];
  const atStart = activeIdx === 0;
  const atEnd   = activeIdx === systems.length - 1;

  const btnBase = {
    display:"flex", alignItems:"center", justifyContent:"center",
    width:30, height:30, borderRadius:7, border:"none", cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14,
    transition:"all .15s", flexShrink:0,
  };

  return (
    <div style={{ flexShrink:0, borderBottom:"1px solid rgba(26,53,85,0.45)",
      background:"rgba(5,15,30,0.55)", padding:"10px 16px 8px",
      display:"flex", flexDirection:"column", gap:7 }}>

      {/* Prev / System label / Next */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={() => onSelect(activeIdx - 1)} disabled={atStart}
          style={{ ...btnBase,
            background: atStart ? "transparent" : "rgba(0,229,192,0.08)",
            color: atStart ? "rgba(42,77,114,0.4)" : "var(--npi-teal)",
            cursor: atStart ? "default" : "pointer" }}>
          &#9664;
        </button>
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          gap:6, padding:"4px 0" }}>
          <span style={{ fontSize:16 }}>{sys.icon}</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:13, color:"var(--npi-txt)" }}>
            {sys.label}
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--npi-txt4)", letterSpacing:1 }}>
            {activeIdx + 1}/{systems.length}
          </span>
        </div>
        <button onClick={() => onSelect(activeIdx + 1)} disabled={atEnd}
          style={{ ...btnBase,
            background: atEnd ? "transparent" : "rgba(0,229,192,0.08)",
            color: atEnd ? "rgba(42,77,114,0.4)" : "var(--npi-teal)",
            cursor: atEnd ? "default" : "pointer" }}>
          &#9654;
        </button>
      </div>

      {/* Dot progress strip — click any dot to jump */}
      <div style={{ display:"flex", gap:4, justifyContent:"center", alignItems:"center" }}>
        {systems.map((s, i) => {
          const dot     = getDot(s.id);
          const isActive = i === activeIdx;
          const bg = isActive
            ? "var(--npi-teal)"
            : dot === "done"    ? "rgba(0,229,192,0.45)"
            : dot === "partial" ? "rgba(245,200,66,0.6)"
            : "rgba(42,77,114,0.45)";
          return (
            <button key={s.id} onClick={() => onSelect(i)} title={s.label}
              style={{ height:7, width: isActive ? 22 : 7, borderRadius:4,
                border:"none", background:bg, cursor:"pointer", padding:0,
                transition:"all .18s ease", flexShrink:0 }} />
          );
        })}
      </div>
    </div>
  );
}

// ─── PATIENT SUMMARY TAB ─────────────────────────────────────────────────────
// Literature basis: JAMIA problem-oriented view study — 15% faster, 56% lower error rate
function PatientSummaryTab({ demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, pmhExtra, surgHx, famHx, socHx, rosState, rosSymptoms, peState,
  peFindings, esiLevel, registration, sdoh, consults, onAdvance }) {
  const [aiSummary,  setAiSummary]  = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);

  const patientName  = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList      = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);
  const sdohPos      = Object.entries(sdoh || {}).filter(([,v]) => v === "2").map(([k]) => k);
  const rosPos       = Object.entries(rosState || {}).filter(([,v]) => v === "has-positives").map(([k]) => k);
  const pePos        = Object.entries(peState  || {}).filter(([,v]) => v==="abnormal"||v==="has-positives"||v==="mixed").map(([k]) => k);
  const sympList     = Array.isArray(rosSymptoms) ? rosSymptoms : Object.keys(rosSymptoms||{}).filter(k=>rosSymptoms[k]);
  const esiCol       = esiLevel<=2 ? "var(--npi-coral)" : esiLevel===3 ? "var(--npi-orange)" : "var(--npi-teal)";
  let socParsed = {};
  try { socParsed = JSON.parse(socHx||"{}"); } catch(_) { socParsed = { notes:socHx }; }

  async function generateSummary() {
    setAiLoading(true);
    try {
      const prompt = [
        "Write a concise 2-3 sentence clinical handoff summary for a physician-to-physician handoff in an emergency department.",
        `Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}.`,
        `Chief complaint: ${cc.text||"not documented"}.`,
        `Vitals: BP ${vitals.bp||"-"} HR ${vitals.hr||"-"} RR ${vitals.rr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.`,
        `Allergies: ${allergies.length ? allergies.join(", ") : "NKDA"}.`,
        `Medications: ${medications.slice(0,5).join("; ")||"none documented"}.`,
        `PMH: ${pmhList.slice(0,5).join(", ")||"none"}.`,
        rosPos.length ? `ROS positives: ${rosPos.join(", ")}.` : "",
        pePos.length  ? `PE abnormals: ${pePos.join(", ")}.`   : "",
      ].filter(Boolean).join(" ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type:"object", properties:{ summary:{ type:"string" } } },
      });
      setAiSummary(res?.summary || "");
    } catch(_) { setAiSummary("AI summary unavailable — please enter manually."); }
    finally    { setAiLoading(false); }
  }

  function Card({ title, color, children }) {
    return (
      <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(14,37,68,0.7)",
        border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color,
          letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>{title}</div>
        {children}
      </div>
    );
  }

  function Chip({ label, color }) {
    return (
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
        padding:"2px 8px", borderRadius:20, background:`${color}15`,
        border:`1px solid ${color}30`, color, whiteSpace:"nowrap" }}>{label}</span>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      {/* Patient banner */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(26,53,85,0.4)",
        background:"rgba(5,15,30,0.6)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:17, color:"var(--npi-txt)" }}>{patientName}</span>
          {demo.age && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
            color:"var(--npi-txt3)" }}>{demo.age}y {demo.sex && `\xb7 ${demo.sex}`}</span>}
          {registration.mrn && <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, color:"var(--npi-txt4)" }}>MRN {registration.mrn}</span>}
          {registration.room && <Chip label={`Room ${registration.room}`} color="var(--npi-teal)" />}
          {esiLevel && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
              padding:"2px 8px", borderRadius:6, color:esiCol,
              background:`${esiCol}15`, border:`1px solid ${esiCol}40` }}>
              ESI {esiLevel}
            </span>
          )}
          {allergies.length > 0 && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
              color:"var(--npi-coral)", fontWeight:700 }}>
              \u26A0 {allergies.join(", ")}
            </span>
          )}
        </div>
        {cc.text && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--npi-txt)", marginTop:4 }}>
            <strong>CC:</strong> {cc.text}
            {cc.onset    && ` \xb7 onset: ${cc.onset}`}
            {cc.severity && ` \xb7 severity ${cc.severity}/10`}
          </div>
        )}
      </div>

      <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10, paddingBottom:80 }}>
        {/* Vitals + Allergies/Meds */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Card title="Vital Signs" color="var(--npi-blue)">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {[{l:"BP",v:vitals.bp},{l:"HR",v:vitals.hr},{l:"RR",v:vitals.rr},
                {l:"SpO\u2082",v:vitals.spo2},{l:"Temp",v:vitals.temp},{l:"GCS",v:vitals.gcs}].map(r=>(
                <div key={r.l}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--npi-txt4)", letterSpacing:1 }}>{r.l}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13,
                    fontWeight:700, color:r.v?"var(--npi-txt)":"var(--npi-txt4)" }}>{r.v||"\u2014"}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Medications & Allergies" color="var(--npi-coral)">
            {allergies.length===0
              ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-green)", fontWeight:600 }}>\u2713 NKDA</div>
              : allergies.map((a,i) => <div key={i} style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:12, color:"var(--npi-coral)" }}>\u26A0 {a}</div>)
            }
            {medications.length > 0 && (
              <div style={{ marginTop:6, borderTop:"1px solid rgba(26,53,85,0.3)", paddingTop:6 }}>
                {medications.slice(0,5).map((m,i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
                    color:"var(--npi-txt3)", lineHeight:1.5 }}>{m}</div>
                ))}
                {medications.length > 5 && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--npi-txt4)" }}>+{medications.length-5} more</div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* PMH + ROS + PE */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <Card title="Past Medical History" color="var(--npi-purple)">
            {pmhList.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>None documented</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {pmhList.slice(0,8).map(c=><Chip key={c} label={c} color="var(--npi-purple)" />)}
                  {pmhList.length>8 && <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:"var(--npi-txt4)" }}>+{pmhList.length-8}</span>}
                </div>
            }
            {(surgHx||famHx) && (
              <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:"var(--npi-txt4)" }}>
                {surgHx && <div>Surg: {surgHx.slice(0,60)}{surgHx.length>60?"...":""}</div>}
                {famHx  && <div>FHx: {famHx.slice(0,60)}{famHx.length>60?"...":""}</div>}
              </div>
            )}
          </Card>
          <Card title="ROS \u2014 Positives" color="var(--npi-gold)">
            {rosPos.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>No positives</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {rosPos.map(s=><Chip key={s} label={s} color="var(--npi-gold)" />)}
                </div>
            }
            {sympList.length > 0 && (
              <div style={{ marginTop:6, fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:"var(--npi-txt3)" }}>
                {sympList.slice(0,4).join(", ")}
              </div>
            )}
          </Card>
          <Card title="PE \u2014 Abnormal Findings" color="var(--npi-orange)">
            {pePos.length===0
              ? <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--npi-txt4)", fontStyle:"italic" }}>No abnormals</span>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {pePos.map(s=><Chip key={s} label={s} color="var(--npi-orange)" />)}
                </div>
            }
          </Card>
        </div>

        {/* SDOH + Consults row */}
        {(sdohPos.length > 0 || consults.length > 0) && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {sdohPos.length > 0 && (
              <Card title="SDOH \u2014 Positive Screens" color="var(--npi-coral)">
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {sdohPos.map(d=><Chip key={d} label={d} color="var(--npi-coral)" />)}
                </div>
              </Card>
            )}
            {consults.length > 0 && (
              <Card title="Active Consults" color="var(--npi-teal)">
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {consults.map((c,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                        color:"var(--npi-txt)", fontWeight:600 }}>{c.service}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:c.status==="completed"?"var(--npi-green)":"var(--npi-gold)" }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* AI Narrative */}
        <div style={{ padding:"14px 16px", borderRadius:10,
          background:"rgba(59,158,255,0.05)", border:"1px solid rgba(59,158,255,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--npi-blue)", letterSpacing:1.5, textTransform:"uppercase" }}>
              AI Clinical Narrative
            </div>
            <button onClick={generateSummary} disabled={aiLoading}
              style={{ padding:"5px 14px", borderRadius:7,
                border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)",
                color:"var(--npi-blue)", fontFamily:"'DM Sans',sans-serif",
                fontSize:11, fontWeight:600, cursor:aiLoading?"default":"pointer" }}>
              {aiLoading ? "Generating\u2026" : "\u2728 Generate Summary"}
            </button>
          </div>
          {aiSummary
            ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                color:"var(--npi-txt2)", lineHeight:1.8 }}>{aiSummary}</div>
            : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--npi-txt4)", fontStyle:"italic" }}>
                Click Generate for an AI-composed one-glance clinical narrative of this encounter
              </div>
          }
        </div>

        {onAdvance && (
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={onAdvance}
              style={{ padding:"9px 22px", borderRadius:9,
                background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Continue to HPI &#9654;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HANDOFF TAB (I-PASS) ─────────────────────────────────────────────────────
// Literature basis: I-PASS reduced information loss 75%→37.5% in pediatric ED (AHRQ 2023)
function HandoffTab({ demo, cc, vitals, medications, allergies, pmhSelected,
  rosState, peState, peFindings, esiLevel, registration, sdoh, consults,
  disposition, dispReason, onAdvance }) {
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList     = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);

  const [severity,       setSeverity]       = useState(esiLevel<=2?"Critical":esiLevel===3?"Serious":"Stable");
  const [patientSummary, setPatientSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actions,        setActions]        = useState([]);
  const [actionInput,    setActionInput]    = useState("");
  const [situation,      setSituation]      = useState("");
  const [synthesis,      setSynthesis]      = useState("");
  const [handoffDone,    setHandoffDone]    = useState(false);

  async function generatePatientSummary() {
    setSummaryLoading(true);
    try {
      const rosPos = Object.entries(rosState||{}).filter(([,v])=>v==="has-positives").map(([k])=>k);
      const pePos  = Object.entries(peState||{}).filter(([,v])=>v==="abnormal"||v==="has-positives"||v==="mixed").map(([k])=>k);
      const prompt = [
        "Write a 2-3 sentence physician-to-physician I-PASS patient summary for an ED handoff.",
        "Include: patient identity, chief complaint, key history, current clinical status, pertinent positives and negatives.",
        `Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}.`,
        `CC: ${cc.text||"not documented"}.`,
        `Vitals: BP ${vitals.bp||"-"} HR ${vitals.hr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.`,
        `Allergies: ${allergies.join(", ")||"NKDA"}. Meds: ${medications.slice(0,4).join("; ")||"none"}.`,
        `PMH: ${pmhList.slice(0,4).join(", ")||"none"}.`,
        rosPos.length ? `ROS positives: ${rosPos.join(", ")}.` : "",
        pePos.length  ? `PE abnormals: ${pePos.join(", ")}.`   : "",
        disposition ? `Disposition plan: ${disposition}${dispReason ? " — " + dispReason.slice(0,60) : ""}.` : "",
      ].filter(Boolean).join(" ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type:"object", properties:{ summary:{ type:"string" } } },
      });
      setPatientSummary(res?.summary || "");
    } catch(_) { setPatientSummary("AI unavailable \u2014 please enter patient summary manually."); }
    finally    { setSummaryLoading(false); }
  }

  function addAction() {
    if (!actionInput.trim()) return;
    setActions(p => [...p, { id:Date.now(), text:actionInput.trim(), done:false }]);
    setActionInput("");
  }

  function toggleAction(id) { setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a)); }
  function removeAction(id) { setActions(p => p.filter(a => a.id!==id)); }

  const sevColor = severity==="Critical"?"var(--npi-coral)":severity==="Serious"?"var(--npi-orange)":"var(--npi-teal)";
  const iaBase = {
    width:"100%", background:"rgba(14,37,68,0.8)",
    border:"1px solid rgba(26,53,85,0.55)", borderRadius:9,
    padding:"9px 12px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
    boxSizing:"border-box", resize:"vertical", lineHeight:1.6,
  };

  function IPassSection({ letter, label, color, children }) {
    return (
      <div style={{ padding:"14px 16px", borderRadius:10,
        background:"rgba(14,37,68,0.7)",
        border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:11, flexShrink:0,
            background:`${color}22`, border:`1px solid ${color}55`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'JetBrains Mono',monospace", fontSize:11,
            fontWeight:700, color }}>
            {letter}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color, letterSpacing:1.8, textTransform:"uppercase" }}>{label}</div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      {/* Header */}
      <div style={{ padding:"11px 20px", borderBottom:"1px solid rgba(26,53,85,0.4)",
        background:"rgba(5,15,30,0.6)", display:"flex", alignItems:"center",
        gap:12, flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:15, color:"var(--npi-txt)" }}>I-PASS Handoff</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--npi-txt4)" }}>{patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}</div>
        </div>
        <div style={{ flex:1 }}/>
        {handoffDone && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--npi-green)", background:"rgba(61,255,160,0.1)",
            padding:"4px 10px", borderRadius:6, border:"1px solid rgba(61,255,160,0.3)" }}>
            \u2713 HANDOFF COMPLETE
          </span>
        )}
      </div>

      <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column",
        gap:10, paddingBottom:80 }}>

        {/* I — Illness Severity */}
        <IPassSection letter="I" label="Illness Severity" color={sevColor}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {["Critical","Serious","Stable"].map(s => {
              const sc = s==="Critical"?"var(--npi-coral)":s==="Serious"?"var(--npi-orange)":"var(--npi-teal)";
              const act = severity===s;
              return (
                <button key={s} onClick={()=>setSeverity(s)}
                  style={{ padding:"7px 20px", borderRadius:8, cursor:"pointer",
                    background:act?`${sc}18`:"transparent",
                    border:`1px solid ${act?sc.replace("var(--","").replace(")","")+"40"||sc:"rgba(42,77,114,0.35)"}`,
                    borderColor:act?sc:"rgba(42,77,114,0.35)",
                    color:sc, fontFamily:"'DM Sans',sans-serif",
                    fontWeight:act?700:400, fontSize:13 }}>
                  {s}
                </button>
              );
            })}
            {esiLevel && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--npi-txt4)", marginLeft:4 }}>
                ESI {esiLevel} on arrival
              </span>
            )}
          </div>
        </IPassSection>

        {/* P — Patient Summary */}
        <IPassSection letter="P" label="Patient Summary" color="var(--npi-blue)">
          <button onClick={generatePatientSummary} disabled={summaryLoading}
            style={{ marginBottom:8, padding:"5px 14px", borderRadius:7,
              border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)",
              color:"var(--npi-blue)", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, fontWeight:600, cursor:summaryLoading?"default":"pointer" }}>
            {summaryLoading ? "Generating\u2026" : "\u2728 AI Generate"}
          </button>
          <textarea value={patientSummary} onChange={e=>setPatientSummary(e.target.value)}
            rows={4} style={iaBase}
            placeholder="2-3 sentences: patient identity, chief complaint, key PMH, current clinical status, pertinent findings\u2026" />
        </IPassSection>

        {/* A — Action List */}
        <IPassSection letter="A" label="Action List" color="var(--npi-gold)">
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
            {consults.filter(c=>c.status==="pending").map(c=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8,
                padding:"6px 10px", borderRadius:7,
                background:"rgba(245,200,66,0.06)", border:"1px solid rgba(245,200,66,0.2)" }}>
                <span style={{ color:"var(--npi-gold)", fontSize:11 }}>\u23f3</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                  color:"var(--npi-txt2)", flex:1 }}>
                  Awaiting {c.service} consult{c.question?`: ${c.question.slice(0,60)}`:""}
                </span>
              </div>
            ))}
            {actions.map(a=>(
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={()=>toggleAction(a.id)}
                  style={{ width:18, height:18, borderRadius:4, flexShrink:0, padding:0,
                    border:`1px solid ${a.done?"var(--npi-teal)":"rgba(42,77,114,0.5)"}`,
                    background:a.done?"rgba(0,229,192,0.15)":"transparent",
                    cursor:"pointer", color:"var(--npi-teal)", fontSize:10, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
                  {a.done?"\u2713":""}
                </button>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                  color:a.done?"var(--npi-txt4)":"var(--npi-txt2)", flex:1,
                  textDecoration:a.done?"line-through":"none" }}>{a.text}</span>
                <button onClick={()=>removeAction(a.id)}
                  style={{ background:"transparent", border:"none",
                    color:"var(--npi-txt4)", cursor:"pointer", fontSize:11 }}>\u2715</button>
              </div>
            ))}
            {actions.length===0 && consults.filter(c=>c.status==="pending").length===0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--npi-txt4)", fontStyle:"italic" }}>No pending actions</div>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={actionInput} onChange={e=>setActionInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&actionInput.trim())addAction();}}
              placeholder="Add item (e.g., Follow-up CBC at 6h, CT results pending)"
              style={{ ...iaBase, resize:"none", flex:1, lineHeight:1.4 }} />
            <button onClick={addAction}
              style={{ padding:"8px 16px", borderRadius:9,
                background:"rgba(245,200,66,0.12)", border:"1px solid rgba(245,200,66,0.35)",
                color:"var(--npi-gold)", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
              + Add
            </button>
          </div>
        </IPassSection>

        {/* S1 — Situation Awareness & Contingency */}
        <IPassSection letter="S" label="Situation Awareness & Contingency" color="var(--npi-purple)">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
            color:"var(--npi-txt4)", marginBottom:6 }}>
            Anticipated changes and if/then contingency plans for the receiving provider
          </div>
          <textarea value={situation} onChange={e=>setSituation(e.target.value)}
            rows={3} style={iaBase}
            placeholder={"If BP drops below 90 \u2192 NS bolus + call senior resident\nIf troponin elevated \u2192 activate cardiology consult\nIf patient deteriorates \u2192 reassess and upgrade acuity"} />
        </IPassSection>

        {/* S2 — Synthesis by Receiver */}
        <IPassSection letter="S" label="Synthesis by Receiver" color="var(--npi-teal)">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
            color:"var(--npi-txt4)", marginBottom:6 }}>
            Receiving provider read-back: summarize key points, active issues, and pending items
          </div>
          <textarea value={synthesis} onChange={e=>setSynthesis(e.target.value)}
            rows={3} style={iaBase}
            placeholder="Receiving provider confirms understanding of patient status, active issues, pending actions, and contingency plans\u2026" />
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginTop:10, flexWrap:"wrap", gap:8 }}>
            <button onClick={()=>setHandoffDone(h=>!h)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px",
                borderRadius:9, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:12,
                background:handoffDone?"rgba(61,255,160,0.15)":"rgba(26,53,85,0.4)",
                border:`1px solid ${handoffDone?"rgba(61,255,160,0.4)":"rgba(42,77,114,0.4)"}`,
                color:handoffDone?"var(--npi-green)":"var(--npi-txt4)" }}>
              {handoffDone?"\u2713 Handoff Complete":"\u25a1 Mark Handoff Complete"}
            </button>
            {onAdvance && (
              <button onClick={onAdvance}
                style={{ padding:"9px 22px", borderRadius:9,
                  background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                  color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                  fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Proceed to Discharge &#9654;
              </button>
            )}
          </div>
        </IPassSection>

      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function NewPatientInput() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTab, setCurrentTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "demo"
  );
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) setCurrentTab(tab);
  }, [location.search]);

  const [activeGroup, setActiveGroup] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") || "demo";
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === tab)) return group;
    }
    return "intake";
  });

  const [navDots, setNavDots] = useState(() => {
    const m = {}; ALL_SECTIONS.forEach(s => (m[s.section] = s.dot)); return m;
  });

  const arrivalTimeRef = useRef(Date.now());
  const [doorTime, setDoorTime] = useState("0m");
  useEffect(() => {
    const update = () => {
      const mins = Math.floor((Date.now() - arrivalTimeRef.current) / 60000);
      const h = Math.floor(mins / 60), m = mins % 60;
      setDoorTime(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const [demo, setDemo]               = useState({ firstName:"", lastName:"", age:"", dob:"", sex:"", mrn:"", insurance:"", insuranceId:"", address:"", city:"", phone:"", email:"", emerg:"", height:"", weight:"", lang:"", notes:"", pronouns:"" });
  const [cc, setCC]                   = useState({ text:"", onset:"", duration:"", severity:"", quality:"", radiation:"", aggravate:"", relieve:"", assoc:"", hpi:"" });
  const [vitals, setVitals]           = useState({});
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies]     = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra]       = useState("");
  const [surgHx, setSurgHx]           = useState("");
  const [famHx, setFamHx]             = useState("");
  const [socHx, setSocHx]             = useState("");
  const [rosState, setRosState]       = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes]       = useState({});
  const [peState, setPeState]         = useState({});
  const [peFindings, setPeFindings]   = useState({});
  const [selectedCC, setSelectedCC]   = useState(-1);
  const [parseText, setParseText]     = useState("");
  const [parsing, setParsing]         = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu]               = useState("");
  const [o2del, setO2del]             = useState("");
  const [pain, setPain]               = useState("");
  const [triage, setTriage]           = useState("");
  const [esiLevel, setEsiLevel]       = useState("");
  const [consults, setConsults]       = useState([]);
  const [sdoh, setSdoh]               = useState({ housing:"", food:"", transport:"", utilities:"", isolation:"", safety:"" });
  const [disposition, setDisposition] = useState("");
  const [dispReason, setDispReason]   = useState("");
  const [dispTime, setDispTime]       = useState("");
  const [railCompact, setRailCompact] = useState(false);
  const [registration, setRegistration] = useState({ mrn:"", room:"" });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cdsOpen,      setCdsOpen]      = useState(false);
  const [rosActiveSystem, setRosActiveSystem] = useState(0);
  const [peActiveSystem,  setPeActiveSystem]  = useState(0);
  const [reassessState,   setReassessState]   = useState({});
  const [clinicalTimeline, setClinicalTimeline] = useState({});

  const [providerName, setProviderName] = useState("Provider");
  const [providerRole, setProviderRole] = useState("ED");
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth?.me?.();
        if (me) {
          const full = [me.first_name, me.last_name].filter(Boolean).join(" ");
          if (full) setProviderName(full);
          if (me.role) setProviderRole(me.role);
        }
      } catch (_) {}
    })();
  }, []);

  const ASSESS_SECTIONS = ["hpi", "ros", "pe"];
  const prevTabRef = useRef(null);
  const [resumeSection, setResumeSection] = useState(null);
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev && ASSESS_SECTIONS.includes(prev) && !ASSESS_SECTIONS.includes(currentTab)) setResumeSection(prev);
    if (ASSESS_SECTIONS.includes(currentTab)) setResumeSection(null);
    prevTabRef.current = currentTab;
  }, [currentTab]); // eslint-disable-line

  const [aiOpen, setAiOpen]       = useState(false);
  const [aiMsgs, setAiMsgs]       = useState([{ role:"sys", text:"Notrya AI ready — select a quick action or ask a clinical question." }]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [history, setHistory]     = useState([]);
  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior:"smooth" }); }, [aiMsgs, aiLoading]);
  useEffect(() => { if (aiOpen) setTimeout(() => inputRef.current?.focus(), 280); }, [aiOpen]);
  useEffect(() => {
    const h = e => { if (e.key === "Escape" && aiOpen) setAiOpen(false); if (e.key === "Escape" && cdsOpen) setCdsOpen(false); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [aiOpen, cdsOpen]);

  useEffect(() => {
    setNavDots(prev => ({
      ...prev,
      demo:     (demo.firstName || demo.lastName || demo.age) ? "done"    : "empty",
      cc:       cc.text                                        ? "done"    : "empty",
      vit:      (vitals.bp || vitals.hr)                       ? "done"    : "empty",
      meds:     (medications.length || allergies.length)       ? "done"    : "empty",
      hpi:      cc.hpi ? "done" : cc.text                      ? "partial" : "empty",
      ros:      Object.keys(rosState).length > 3 ? "done" : Object.keys(rosState).length > 0 ? "partial" : "empty",
      pe:       Object.keys(peState).length  > 3 ? "done" : Object.keys(peState).length  > 0 ? "partial" : "empty",
      triage:   esiLevel                        ? "done"    : "empty",
      consult:  consults.length > 0               ? "done"    : "empty",
      closeout: disposition                        ? "done"    : "empty",
      sdoh:     Object.values(sdoh).filter(v => v === "2").length > 0 ? "partial"
                  : Object.values(sdoh).some(Boolean) ? "done" : "empty",
      reassess: reassessState.condition ? "done" : reassessState.note ? "partial" : "empty",
      timeline: clinicalTimeline?.times?.departed ? "done" : clinicalTimeline?.times?.disposition ? "partial" : "empty",
      summary:  (demo.firstName || cc.text || vitals.bp) ? "partial" : "empty",
      handoff:  "empty",
    }));
  }, [
    demo.firstName, demo.lastName, demo.age, cc.text, cc.hpi, vitals.bp, vitals.hr,
    medications.length, allergies.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.keys(rosState).length, Object.keys(peState).length,
    esiLevel, consults.length,
    disposition,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(sdoh).join(","),
    reassessState.condition, reassessState.note,
    clinicalTimeline?.times?.departed, clinicalTimeline?.times?.disposition,
  ]);

  const selectGroup = useCallback((group) => {
    // If already in this group, just keep it open — don't navigate away from current tab
    if (group === activeGroup) return;
    setActiveGroup(group);
    const items = NAV_DATA[group];
    if (items.every(i => i.href)) return;
    if (items.length === 1) { navigate(`/NewPatientInput?tab=${items[0].section}`); return; }
    const target = items.find(i => i.section === currentTab) ? currentTab : items[0].section;
    navigate(`/NewPatientInput?tab=${target}`);
  }, [currentTab, activeGroup, navigate]);

  const selectSection = useCallback((sectionId) => {
    navigate(`/NewPatientInput?tab=${sectionId}`);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find(i => i.section === sectionId)) { setActiveGroup(group); break; }
    }
  }, [navigate]);

  const getGroupBadge = useCallback((groupKey) => {
    const items = NAV_DATA[groupKey];
    if (items.every(i => navDots[i.section] === "done")) return "done";
    if (items.some(i => navDots[i.section] === "done" || navDots[i.section] === "partial")) return "partial";
    return "empty";
  }, [navDots]);

  const vitalClass = (key, raw) => {
    if (!raw || raw === "\u2014") return "";
    const src = key === "bp" ? String(raw).split("/")[0] : raw;
    const n = parseFloat(src); if (isNaN(n)) return "";
    if (key === "hr")   return n > 110 || n < 50  ? " abn" : n > 90  || n < 55 ? " warn" : "";
    if (key === "rr")   return n > 22  || n < 8   ? " abn" : n > 20  || n < 10 ? " warn" : "";
    if (key === "spo2") return n < 90              ? " abn" : n < 94            ? " warn" : "";
    if (key === "temp") return n > 39.5 || n < 35.5 ? " abn" : n > 38 || n < 36 ? " warn" : "";
    if (key === "bp")   return n > 180 || n < 80  ? " abn" : n > 140 || n < 90 ? " warn" : "";
    return "";
  };

  const getRosSysDot = (sysId) => {
    const st = rosState[sysId]; if (!st) return "empty";
    return st === "has-positives" ? "partial" : "done";
  };
  const getPeSysDot = (sysId) => {
    const st = peState[sysId]; if (!st) return "empty";
    return (st === "has-positives" || st === "abnormal" || st === "mixed") ? "partial" : "done";
  };

  const toggleAI = useCallback(() => { setAiOpen(o => { if (!o) setUnread(0); return !o; }); }, []);

  const addVitalsSnapshot = useCallback((label, overrideVitals) => {
    const v = overrideVitals || vitals;
    if (!v || (!v.hr && !v.bp)) return;
    setVitalsHistory(prev => [...prev, { t: Date.now(), label, ...v }]);
  }, [vitals]);

  const handleSaveChart = useCallback(async () => {
    try {
      const payload = {
        raw_note: parseText || `Patient ${[demo.firstName,demo.lastName].filter(Boolean).join(" ")||"New Patient"} presenting with ${cc.text||"unspecified complaint"}`,
        patient_name:    [demo.firstName,demo.lastName].filter(Boolean).join(" ")||"New Patient",
        patient_id:      registration.mrn||demo.mrn||"",
        patient_age:     demo.age||"",
        patient_gender:  demo.sex?.toLowerCase()==="male"?"male":demo.sex?.toLowerCase()==="female"?"female":"other",
        date_of_birth:   demo.dob||"",
        chief_complaint: cc.text||"",
        history_of_present_illness: cc.hpi||"",
        medications, allergies, status:"draft",
        registration_mrn: registration.mrn||"", registration_room: registration.room||"",
        triage_esi_level: esiLevel||"",
        sdoh_housing: sdoh.housing||"", sdoh_food: sdoh.food||"",
        sdoh_transport: sdoh.transport||"", sdoh_isolation: sdoh.isolation||"",
        sdoh_safety: sdoh.safety||"",
        disposition: disposition||"", disposition_reason: dispReason||"",
        consult_count: consults.length,
        consult_services: consults.map(c => c.service).join(", ")||"",
        ros_summary: Object.keys(rosState).filter(k => rosState[k]).join(", ")||"",
        pe_summary:  Object.keys(peState).filter(k => peState[k]).join(", ")||"",
      };
      if (!disposition) toast.warning("Disposition not set \u2014 chart saved as draft without close-out.");
      await base44.entities.ClinicalNote.create(payload);
      toast.success("Chart signed and saved.");
      navigate("/EDTrackingBoard");
    } catch (e) { toast.error("Failed to save: " + e.message); }
  }, [demo,cc,vitals,medications,allergies,parseText,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration,sdoh,consults,disposition,dispReason,navigate]);

  useEffect(() => {
    const handler = e => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && SHORTCUT_MAP[e.key]) { e.preventDefault(); selectSection(SHORTCUT_MAP[e.key]); return; }
      if (mod && e.shiftKey && e.key === "s") { e.preventDefault(); handleSaveChart(); return; }
      if (mod && e.shiftKey && e.key === "n") { e.preventDefault(); navigate("/NewPatientInput?tab=demo"); return; }
      if (e.key === "?" && !mod && !["INPUT","TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault(); setShowShortcuts(s => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection,navigate,handleSaveChart,demo,cc,vitals,medications,allergies,pmhSelected,pmhExtra,surgHx,famHx,socHx,rosState,rosNotes,rosSymptoms,peState,peFindings,esiLevel,registration]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs(m => [...m, { role:"user", text:text.trim() }]);
    setAiInput(""); setAiLoading(true);
    const ctx = buildPatientCtx(demo,cc,vitals,allergies,pmhSelected,currentTab);
    setHistory(h => [...h, { role:"user", content: ctx+"\n\n"+text.trim() }]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: SYSTEM_PROMPT+"\n\nPATIENT CONTEXT:\n"+ctx+"\n\nPHYSICIAN QUESTION:\n"+text.trim() });
      const reply = typeof res === "string" ? res : JSON.stringify(res);
      setHistory(h => [...h, { role:"assistant", content:reply }]);
      setAiMsgs(m => [...m, { role:"bot", text:reply }]);
      setAiOpen(open => { if (!open) setUnread(u => u+1); return open; });
    } catch {
      setAiMsgs(m => [...m, { role:"sys", text:"\u26a0 Connection error \u2014 please try again." }]);
    } finally { setAiLoading(false); }
  }, [aiLoading,history,currentTab,demo,cc,vitals,allergies,pmhSelected]);

  const handleAIKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput); } };

  const renderMsg = text =>
    text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,'<strong style="color:#00e5c0">$1</strong>');

  const smartParse = async () => {
    if (!parseText.trim()) { toast.error("Please enter some text to parse."); return; }
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON.\nText: ${parseText}`,
        response_json_schema: { type:"object", properties:{ firstName:{type:"string"},lastName:{type:"string"},age:{type:"string"},sex:{type:"string"},dob:{type:"string"},cc:{type:"string"},onset:{type:"string"},duration:{type:"string"},severity:{type:"string"},quality:{type:"string"},bp:{type:"string"},hr:{type:"string"},rr:{type:"string"},spo2:{type:"string"},temp:{type:"string"},gcs:{type:"string"},medications:{type:"array",items:{type:"string"}},allergies:{type:"array",items:{type:"string"}},pmh:{type:"array",items:{type:"string"}} } },
      });
      setDemo(prev => ({ ...prev, firstName:result.firstName||prev.firstName, lastName:result.lastName||prev.lastName, age:result.age||prev.age, sex:result.sex||prev.sex, dob:result.dob||prev.dob }));
      setCC(prev => ({ ...prev, text:result.cc||prev.text, onset:result.onset||prev.onset, duration:result.duration||prev.duration, severity:result.severity||prev.severity, quality:result.quality||prev.quality }));
      setVitals(prev => ({ ...prev, bp:result.bp||prev.bp||"", hr:result.hr||prev.hr||"", rr:result.rr||prev.rr||"", spo2:result.spo2||prev.spo2||"", temp:result.temp||prev.temp||"", gcs:result.gcs||prev.gcs||"" }));
      (result.medications||[]).forEach(m => { if (m) setMedications(p => p.includes(m)?p:[...p,m]); });
      (result.allergies||[]).forEach(a => { if (a) setAllergies(p => p.includes(a)?p:[...p,a]); });
      toast.success("Patient data extracted!");
    } catch { toast.error("Could not parse automatically."); }
    setParsing(false);
  };

  const patientName = [demo.firstName,demo.lastName].filter(Boolean).join(" ") || "New Patient";

  // ── Build the patientData bundle once so CNS always gets a consistent object
  const patientDataBundle = {
    demo,
    cc,
    vitals,
    medications,
    allergies,
    pmhSelected,
    pmhExtra,
    surgHx,
    famHx,
    socHx,
    rosState,
    rosNotes,
    rosSymptoms,
    peState,
    peFindings,
    esiLevel,
    registration,
    sdoh,
  };

  const renderContent = () => {
    switch (currentTab) {
      case "triage": return (
        <TriageTab
          esiLevel={esiLevel}   setEsiLevel={setEsiLevel}
          triage={triage}       setTriage={setTriage}
          avpu={avpu}           setAvpu={setAvpu}
          pain={pain}           setPain={setPain}
          onAdvance={() => selectSection("demo")}
        />
      );
      case "demo":       return <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} esiLevel={esiLevel} setEsiLevel={setEsiLevel} registration={registration} setRegistration={setRegistration} onAdvance={() => selectSection("cc")} />;
      case "cc":         return <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} onAdvance={() => selectSection("vit")} />;
      case "vit":        return <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} onAdvance={() => { addVitalsSnapshot("Triage"); selectSection("meds"); }} />;
      case "meds":       return <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} onAdvance={() => selectSection("sdoh")} />;
      case "sdoh":       return <SDOHWidget sdoh={sdoh} setSdoh={setSdoh} onAdvance={() => selectSection("summary")} />;
      case "summary":    return <PatientSummaryTab demo={demo} cc={cc} vitals={vitals} vitalsHistory={vitalsHistory} medications={medications} allergies={allergies} pmhSelected={pmhSelected} pmhExtra={pmhExtra} surgHx={surgHx} famHx={famHx} socHx={socHx} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} esiLevel={esiLevel} registration={registration} sdoh={sdoh} consults={consults} onAdvance={() => selectSection("hpi")} />;
      case "hpi":        return <InlineHPITab cc={cc} setCC={setCC} onAdvance={() => selectSection("ros")} />;
      case "ros": return (
        <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
          <SystemProgressHeader
            systems={ROS_RAIL_SYSTEMS}
            activeIdx={rosActiveSystem}
            onSelect={setRosActiveSystem}
            getDot={getRosSysDot}
          />
          <ROSTab onStateChange={setRosState} onSymptomsChange={setRosSymptoms} onNotesChange={setRosNotes} chiefComplaint={cc.text} onAdvance={() => selectSection("pe")} extSysIdx={rosActiveSystem} onSysChange={setRosActiveSystem} />
        </div>
      );
      case "pe": return (
        <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
          <SystemProgressHeader
            systems={PE_RAIL_SYSTEMS}
            activeIdx={peActiveSystem}
            onSelect={setPeActiveSystem}
            getDot={getPeSysDot}
          />
          <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} onAdvance={() => selectSection("chart")} extSysIdx={peActiveSystem} onSysChange={setPeActiveSystem} chiefComplaint={cc.text} />
        </div>
      );

      // ── FIX: pass a single patientData object, embedded flag, and correct callbacks
      case "chart": return (
        <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}>
          <ClinicalNoteStudio
            patientData={patientDataBundle}
            embedded={true}
            onBack={() => selectSection("pe")}
            onSave={handleSaveChart}
            onAdvance={() => selectSection("reassess")}
          />
        </div>
      );

      case "consult": return <ConsultTab consults={consults} setConsults={setConsults} onAdvance={() => selectSection("chart")} />;
      case "reassess":   return <ReassessmentTab initialVitals={vitals} onStateChange={setReassessState}
        onVitalsSnapshot={v => addVitalsSnapshot(
          `Reassessment ${vitalsHistory.filter(e => e.label.startsWith("Reassessment")).length + 1}`,
          v
        )}
        onAdvance={() => selectSection("timeline")} />;
      case "timeline":   return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <VitalSignsChart vitalsHistory={vitalsHistory}/>
          <ClinicalTimeline arrivalMs={arrivalTimeRef.current} onStateChange={setClinicalTimeline}/>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => selectSection("closeout")}
              style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
                border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              Continue to Close-out &#9654;
            </button>
          </div>
        </div>
      );
      case "discharge":  return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><DischargePlanning embedded patientName={patientName} patientAge={demo.age} patientSex={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} /></div>;
      case "closeout":   return (
        <DispositionTab
          disposition={disposition}   setDisposition={setDisposition}
          dispReason={dispReason}     setDispReason={setDispReason}
          dispTime={dispTime}         setDispTime={setDispTime}
          onAdvance={() => selectSection("handoff")}
        />
      );
      case "handoff":    return <HandoffTab demo={demo} cc={cc} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} peState={peState} peFindings={peFindings} esiLevel={esiLevel} registration={registration} sdoh={sdoh} consults={consults} disposition={disposition} dispReason={dispReason} onAdvance={() => selectSection("discharge")} />;
      );
      case "erx":        return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><ERxHub embedded navigate={navigate} patientAllergiesFromParent={allergies} patientWeightFromParent={vitals.weight||""} /></div>;
      case "orders":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden"  }}><OrdersPanel patientName={patientName} allergies={allergies} chiefComplaint={cc.text} patientAge={demo.age} patientSex={demo.sex} patientWeight={demo.weight||vitals.weight||""} /></div>;
      case "results":    return <ResultsViewer patientName={patientName} patientMrn={registration.mrn||demo.mrn} patientAge={demo.age} patientSex={demo.sex} allergies={allergies} chiefComplaint={cc.text} vitals={vitals} />;
      case "autocoder":  return <AutoCoderTab patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} onAdvance={() => selectSection("timeline")} />;
      case "procedures": return <EDProcedureNotes embedded patientName={patientName} patientAllergies={allergies.join(", ")} physicianName="" />;
      case "medref":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"auto"   }}><MedicationReferencePage embedded /></div>;
      case "erplan":     return <div style={{ margin:"-18px -28px", height:"calc(100% + 36px)", overflow:"hidden" }}><ERPlanBuilder embedded patientName={patientName} patientAge={demo.age} patientSex={demo.sex} patientCC={cc.text} patientVitals={vitals} patientAllergies={allergies} patientMedications={medications} /></div>;
      default:           return null;
    }
  };

  return (
    <div>
      <style>{NPI_CSS}</style>

      <header className="npi-top-bar">
        <div className="npi-top-row-1">
          <span className="npi-dr-label">
            {providerName.split(" ").length > 1 ? `Dr. ${providerName.split(" ").slice(-1)[0]}` : providerName}
            <span className="npi-dr-role">{providerRole}</span>
          </span>
          <div className="npi-vsep" />
          <div className="npi-stat"><span className="npi-stat-val">0</span><span className="npi-stat-lbl">Active</span></div>
          <div className="npi-stat"><span className="npi-stat-val alert">14</span><span className="npi-stat-lbl">Pending</span></div>
          <div className="npi-vsep" />
          <button className="npi-tb-link" onClick={() => navigate("/EDTrackingBoard")}>🏥 Track Board</button>
          <div className="npi-top-right">
            <button
              className={`npi-cds-btn${cdsOpen?" open":""}${allergies.length>0?" cds-alert":medications.length>0?" cds-warn":""}`}
              onClick={()=>setCdsOpen(o=>!o)} title="Clinical Decision Support">
              <div className="npi-cds-dot"/>
              CDS
            </button>
            <button className={`npi-ai-btn${aiOpen?" open":""}`} onClick={toggleAI} title="Notrya AI">
              <div className="npi-ai-dot" /> AI
              {unread > 0 && <span className="npi-ai-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
            <button className="npi-new-pt" onClick={() => navigate("/NewPatientInput?tab=demo")}>+ New Patient</button>
            <Link to="/AppSettings" className="npi-tb-settings" title="Settings">⚙️</Link>
          </div>
        </div>
        <div className="npi-top-row-2">
          <span className={`npi-chart-badge${registration.mrn ? " registered" : ""}`}>{registration.mrn || "PT-NEW"}</span>
          <span className="npi-pt-name">{patientName}</span>
          {demo.dob && <span className="npi-pt-dob" title="Date of birth — second patient identifier">DOB {demo.dob}</span>}
          <span className="npi-door-time" title="Time since intake started">⏱ {doorTime}</span>
          <div className={`npi-allergy-wrap${allergies.length > 0 ? " has-allergies" : ""}`}
               onClick={() => selectSection("meds")} title="Click to view/edit medications">
            {allergies.length === 0
              ? <span className="npi-allergy-nka">✓ NKA</span>
              : <span className="npi-allergy-alert">⚠ {allergies.slice(0, 2).join(" · ")}{allergies.length > 2 ? ` +${allergies.length - 2}` : ""}</span>
            }
          </div>
          {resumeSection && (
            <button className="npi-resume-chip"
              onClick={() => { selectSection(resumeSection); setResumeSection(null); }} title="Return to where you were">
              ↩ Resume {ALL_SECTIONS.find(s => s.section === resumeSection)?.label || resumeSection}
              <span className="npi-resume-dismiss" onClick={e => { e.stopPropagation(); setResumeSection(null); }}>✕</span>
            </button>
          )}
          <div className="npi-top-acts">
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")}>+ Order</button>
            <button className="npi-btn-ghost" onClick={() => selectSection("orders")} title="Request consultation">👥 Consult</button>
            <button className="npi-btn-coral" onClick={() => selectSection("discharge")}>🚪 Discharge</button>
            <button className="npi-btn-primary" onClick={handleSaveChart}>✍ Sign &amp; Save</button>
          </div>
        </div>
      </header>

      <div className="npi-main-wrap">
        <main className="npi-content">{renderContent()}</main>
      </div>

      <div className={`npi-scrim${aiOpen?" open":""}`} onClick={toggleAI} />
      <div className={`npi-overlay${aiOpen?" open":""}`}>
        <div className="npi-n-hdr">
          <div className="npi-n-hdr-top">
            <div className="npi-n-avatar">🤖</div>
            <div className="npi-n-hdr-info">
              <div className="npi-n-hdr-name">Notrya AI</div>
              <div className="npi-n-hdr-sub"><span className="dot" /> Clinical assistant · online</div>
            </div>
            <button className="npi-n-close" onClick={toggleAI}>✕</button>
          </div>
          <div className="npi-n-quick">
            {QUICK_ACTIONS.map(q => (
              <button key={q.label} className="npi-n-qbtn" onClick={() => sendMessage(q.prompt)} disabled={aiLoading}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>
        <div className="npi-n-msgs" ref={msgsRef}>
          {aiMsgs.map((m, i) => (
            <div key={i} className={`npi-n-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: renderMsg(m.text) }} />
          ))}
          {aiLoading && <div className="npi-n-dots"><span /><span /><span /></div>}
        </div>
        <div className="npi-n-input-bar">
          <textarea ref={inputRef} className="npi-n-ta" rows={1} placeholder="Ask anything…" value={aiInput}
            onChange={e => setAiInput(e.target.value)} onKeyDown={handleAIKey} disabled={aiLoading}
            onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,90)+"px"; }}
          />
          <button className="npi-n-send" onClick={() => sendMessage(aiInput)} disabled={aiLoading||!aiInput.trim()}>↑</button>
        </div>
      </div>

      {cdsOpen && (
        <div className="npi-cds-scrim" onClick={()=>setCdsOpen(false)}/>
      )}
      <div className={`npi-cds-overlay${cdsOpen?" open":""}`}>
        <div className="npi-cds-overlay-hdr">
          <span className="npi-cds-overlay-title">Clinical Decision Support</span>
          <button className="npi-cds-close" onClick={()=>setCdsOpen(false)}>✕</button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"0 0 16px" }}>

          {/* ── TIER 1: CRITICAL — Beers Criteria (age ≥65) ── */}
          {parseInt(demo.age) >= 65 && (() => {
            const age = parseInt(demo.age);
            const hits = medications.filter(m => BEERS_DRUGS.some(b => m.toLowerCase().includes(b)));
            if (!hits.length) return null;
            return (
              <div style={{ margin:"12px 12px 0", padding:"12px 14px", borderRadius:10,
                background:"rgba(255,107,107,0.09)", border:"1px solid rgba(255,107,107,0.45)",
                borderLeft:"3px solid #ff6b6b" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>🚨</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5, textTransform:"uppercase", color:"#ff8a8a" }}>Critical — Beers Criteria (Age {age})</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ffb3b3", marginBottom:8 }}>
                  Potentially Inappropriate Medications for adults \u226565 (AGS 2023 Beers List):
                </div>
                {hits.map(m => (
                  <div key={m} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ color:"#ff6b6b", fontSize:11 }}>⚠</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt)", fontWeight:600 }}>{m}</span>
                  </div>
                ))}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#ff8a8a", marginTop:8, borderTop:"1px solid rgba(255,107,107,0.2)", paddingTop:8 }}>
                  Review for: benzodiazepines, muscle relaxants, anticholinergics, Z-drugs. Consider dose reduction or safer alternative. Document rationale if continuing.
                </div>
              </div>
            );
          })()}

          {/* ── TIER 2: ADVISORY — CC-triggered risk scores ── */}
          {(() => {
            const hints = getCCRiskHints(cc.text);
            if (!hints.length) return null;
            return (
              <div style={{ margin:"12px 12px 0" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>
                  Risk Scores — Based on CC
                </div>
                {hints.map((h, i) => {
                  const isAdvisory = h.tier === "advisory";
                  const col = isAdvisory ? "#f5c842" : "var(--npi-teal)";
                  const bg  = isAdvisory ? "rgba(245,200,66,0.07)" : "rgba(0,229,192,0.05)";
                  const bd  = isAdvisory ? "rgba(245,200,66,0.3)"  : "rgba(0,229,192,0.2)";
                  const bl  = isAdvisory ? "rgba(245,200,66,0.7)"  : "rgba(0,229,192,0.5)";
                  return (
                    <div key={i} style={{ padding:"10px 12px", borderRadius:9, background:bg,
                      border:`1px solid ${bd}`, borderLeft:`3px solid ${bl}`, marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:col }}>{h.score}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)", letterSpacing:1, textTransform:"uppercase" }}>{h.tier}</span>
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", marginBottom:4 }}>{h.use}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:col }}>\u2192 {h.action}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── TIER 3: INFO — MDM documentation nudge ── */}
          {(cc.text || esiLevel) && (
            <div style={{ margin:"12px 12px 0", padding:"10px 12px", borderRadius:9,
              background:"rgba(59,158,255,0.06)", border:"1px solid rgba(59,158,255,0.2)",
              borderLeft:"3px solid rgba(59,158,255,0.5)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#3b9eff", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                MDM Documentation — AMA/CPT 2023
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)", lineHeight:1.6 }}>
                {["Document complexity of problems addressed (COPA).",
                  "List data reviewed: labs, imaging, external records.",
                  "State risk level with table-of-risk element.",
                  "Note diagnoses considered but NOT ordered.",
                  parseInt(demo.age) >= 65 ? "Age \u226565: document any Beers-listed med rationale." : null,
                  Object.values(sdoh).some(v => v === "2") ? "Positive SDOH screen = Moderate Risk — document in MDM." : null,
                ].filter(Boolean).map((tip, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:3 }}>
                    <span style={{ color:"#3b9eff", flexShrink:0 }}>{i+1}.</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setAiInput(""); sendMessage(QUICK_ACTIONS[4].prompt); setAiOpen(true); setCdsOpen(false); }}
                style={{ marginTop:8, padding:"5px 12px", borderRadius:6, border:"1px solid rgba(59,158,255,0.4)",
                  background:"rgba(59,158,255,0.1)", color:"#3b9eff",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                \u2728 Draft MDM with AI
              </button>
            </div>
          )}

          {/* ── Drug / Allergy interactions (CDSAlertsSidebar) ── */}
          {(medications.length > 0 || allergies.length > 0) && (
            <div style={{ margin:"12px 12px 0" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>
                Drug / Allergy Interactions
              </div>
              <CDSAlertsSidebar medications={medications} allergies={allergies} vitals={vitals} pmhSelected={pmhSelected} age={demo.age} cc={cc.text}/>
            </div>
          )}

          {/* Empty state */}
          {!cc.text && !demo.age && allergies.length === 0 && medications.length === 0 && (
            <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--npi-txt4)", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              Enter chief complaint, patient age, or medications to activate clinical decision support.
            </div>
          )}
        </div>
      </div>

      <button className="npi-sc-hint-fab" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(s=>!s)}>?</button>

      <ParseFab
        parseText={parseText} setParseText={setParseText}
        parsing={parsing} onParse={smartParse}
        tabLabel={ALL_SECTIONS.find(s => s.section === currentTab)?.label || currentTab}
      />

      {railCompact && (
        <style>{".npi-wf-gh-label,.npi-wf-item-label,.npi-wf-item-sc,.npi-wf-pt-meta,.npi-wf-vitals,.npi-wf-pt-cc{display:none!important}.npi-wf-rail{width:54px!important}.npi-wf-pt-name{font-size:9px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"}</style>
      )}

      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position:"fixed",inset:0,zIndex:99998,background:"rgba(3,8,16,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#081628",border:"1px solid #1a3555",borderRadius:16,padding:"24px 28px",width:520,maxWidth:"90vw",boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <span style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#fff" }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} style={{ background:"#0e2544",border:"1px solid #1a3555",borderRadius:6,width:28,height:28,color:"#7aa0c0",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>
            {[
              { section:"Navigate to section", rows:[["Cmd 1","Triage"],["Cmd 2","Demographics"],["Cmd 3","Chief Complaint"],["Cmd 4","Vitals"],["Cmd 5","Meds & PMH"],["Cmd 6","HPI"],["Cmd 7","ROS"],["Cmd 8","Physical Exam"],["Cmd 9","Orders"],["Cmd 0","Discharge"]] },
              { section:"HPI (scan mode)", rows:[["Y / Enter","Symptom present"],["N","Symptom absent"],["Space","Skip symptom"],["0-9","Pain scale or option #"],["Arrow Up/Down","Navigate rows"],["Backspace","Go back one row"],["Esc","Finish & build narrative"]] },
              { section:"Actions", rows:[["Cmd Shift S","Save Chart"],["Cmd Shift N","New Patient"],["?","Toggle shortcuts"]] },
              { section:"Note Studio (when in Clinical Note tab)", rows:[["Cmd G","AI generate focused section"],["Cmd Shift G","Generate all empty sections"],["Cmd R","Rebuild from patient data"],["Cmd S","Save note"],["Cmd P","Print note"],["Cmd Shift C","Copy full note"]] },
            ].map(({ section, rows }) => (
              <div key={section} style={{ marginBottom:16 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#5a82a8",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>{section}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px" }}>
                  {rows.map(([key,desc]) => (
                    <div key={key} style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#b8d4f0",background:"#0e2544",border:"1px solid #1a3555",borderRadius:4,padding:"1px 7px",flexShrink:0,whiteSpace:"nowrap" }}>{key}</span>
                      <span style={{ fontSize:11,color:"#82aece" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop:8,paddingTop:12,borderTop:"1px solid #1a3555",fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"#5a82a8",textAlign:"center" }}>press ? to dismiss</div>
          </div>
        </div>
      )}

      <aside className="npi-wf-rail">
        <button onClick={() => setRailCompact(c => !c)}
          title={railCompact ? "Expand sidebar" : "Collapse sidebar"}
          style={{ position:"absolute", top:8, right:railCompact?8:6, zIndex:10,
            width:22, height:22, borderRadius:11,
            border:"1px solid rgba(42,77,114,0.5)",
            background:"rgba(8,22,46,0.9)", color:"var(--npi-txt4)",
            fontSize:10, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center",
            lineHeight:1 }}>
          {railCompact ? "\u203A" : "\u2039"}
        </button>
        <div className="npi-wf-pt">
          <div className="npi-wf-pt-name">{patientName}</div>
          <div className="npi-wf-pt-meta">
            {demo.age && <span>{demo.age}y {demo.sex ? `· ${demo.sex}` : ""}</span>}
            {cc.text && <span className="npi-wf-pt-cc">{cc.text}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
            {esiLevel && (
              <span className="npi-wf-esi" style={{
                color: esiLevel<=2?"var(--npi-coral)":esiLevel===3?"var(--npi-orange)":"var(--npi-teal)",
                borderColor: `rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.3)`,
                background: `rgba(${esiLevel<=2?"255,107,107":esiLevel===3?"255,159,67":"0,229,192"},.08)`,
              }}>ESI {esiLevel}</span>
            )}
            {registration.room && (
              <span className="npi-wf-esi" style={{ color:"var(--npi-teal)", borderColor:"rgba(0,229,192,.3)", background:"rgba(0,229,192,.08)" }}>Rm {registration.room}</span>
            )}
            {parseInt(demo.age) >= 65 && (
              <span className="npi-wf-esi" title="Geriatric patient — Beers Criteria active" style={{ color:"#f5c842", borderColor:"rgba(245,200,66,.3)", background:"rgba(245,200,66,.08)" }}>65+</span>
            )}
          </div>
          <div className="npi-wf-vitals">
            {[
              { key:"bp",   lbl:"BP",   val: vitals.bp   || "\u2014" },
              { key:"hr",   lbl:"HR",   val: vitals.hr   || "\u2014" },
              { key:"rr",   lbl:"RR",   val: vitals.rr   || "\u2014" },
              { key:"spo2", lbl:"SpO\u2082", val: vitals.spo2 || "\u2014" },
              { key:"temp", lbl:"T",    val: vitals.temp || "\u2014" },
            ].map(v => (
              <div key={v.key} className="npi-wf-v-row">
                <span className="npi-wf-v-lbl">{v.lbl}</span>
                <span className={`npi-wf-v-val${vitalClass(v.key, v.val)}`}>{v.val}</span>
              </div>
            ))}
          </div>
        </div>

        {GROUP_META.map(g => {
          const isActive = g.key === activeGroup;
          const items    = NAV_DATA[g.key] || [];
          const badge    = getGroupBadge(g.key);
          return (
            <div key={g.key} className="npi-wf-group">
              <button className={`npi-wf-gh${isActive ? " active" : ""}`} onClick={() => selectGroup(g.key)}>
                <span className="npi-wf-gh-icon">{g.icon}</span>
                <span className="npi-wf-gh-label">{g.label}</span>
                <span className={`npi-wf-gh-badge ${badge}`} />
              </button>
              {isActive && (
                <div className="npi-wf-items">
                  {items.map(item => (
                      <div key={item.section} style={{display:"contents"}}>
                        <button className={`npi-wf-item${item.section === currentTab ? " active" : ""}`}
                          onClick={() => item.href ? navigate(item.href) : selectSection(item.section)}>
                          <span className="npi-wf-item-icon">{item.icon}</span>
                          <span className="npi-wf-item-label">{item.label}</span>
                          <span className={`npi-wf-item-dot ${navDots[item.section]||"empty"}`} />
                          {SECTION_SHORTCUT[item.section] && (
                            <span className="npi-wf-item-sc">&#8984;{SECTION_SHORTCUT[item.section]}</span>
                          )}
                        </button>
                      </div>
                  ))}
                  </div>
              )}
            </div>
          );
        })}
      </aside>
    </div>
  );
}