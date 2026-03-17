import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SaveCaseModal from "../components/medicationreference/SaveCaseModal";
import SavedCasesPanel from "../components/medicationreference/SavedCasesPanel";
import WeightWidget from "../components/medicationreference/WeightWidget";
import DrugInteractionChecker from "../components/medicationreference/DrugInteractionChecker";
import ERConditions from "../components/medicationreference/ERConditions";
import SepsisProtocol from "../components/medicationreference/SepsisProtocol";
import MedRow from "../components/medicationreference/MedRow";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "all",      label: "All",            icon: "💊", color: "#00c4a0" },
  { id: "anticoag", label: "Anticoagulants", icon: "🩸", color: "#ef4444" },
  { id: "cardiac",  label: "Cardiac",        icon: "🫀", color: "#f97316" },
  { id: "psych",    label: "Psychiatric",    icon: "🧠", color: "#8b5cf6" },
  { id: "analgesic",label: "Analgesics",     icon: "🩹", color: "#fb7185" },
  { id: "abx",      label: "Antibiotics",    icon: "🦠", color: "#22c55e" },
  { id: "gi",       label: "GI",             icon: "💊", color: "#f59e0b" },
  { id: "other",    label: "Other",          icon: "⚗️", color: "#06b6d4" },
];
const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]));

function estimateWeight(mo) {
  if (mo < 3) return 3.5 + mo * 0.9;
  if (mo < 12) return 6 + (mo - 3) * 0.5;
  const y = mo / 12;
  if (y <= 2) return 10 + (y - 1) * 2.5;
  return y * 3 + 7;
}
function getBroselow(w) {
  if (w < 5)  return { zone: "Grey",   hex: "#9ca3af" };
  if (w < 7)  return { zone: "Pink",   hex: "#ec4899" };
  if (w < 9)  return { zone: "Red",    hex: "#ef4444" };
  if (w < 11) return { zone: "Purple", hex: "#8b5cf6" };
  if (w < 14) return { zone: "Yellow", hex: "#eab308" };
  if (w < 18) return { zone: "White",  hex: "#e2e8f0" };
  if (w < 23) return { zone: "Blue",   hex: "#3b82f6" };
  if (w < 29) return { zone: "Orange", hex: "#f97316" };
  if (w < 36) return { zone: "Green",  hex: "#22c55e" };
  return { zone: "Adult", hex: "#6b7280" };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
:root{
  --bg:#080e1a;--c1:#0d1628;--c2:#111e33;--c3:#162240;
  --br:rgba(0,196,160,0.12);--br2:rgba(0,196,160,0.22);
  --teal:#00c4a0;--teal2:#00e5bb;--tdim:rgba(0,196,160,0.08);
  --tx:#e2e8f0;--tx2:#94a3b8;--tx3:#4a6080;
  --red:#ef4444;--yel:#f59e0b;--grn:#22c55e;--pur:#8b5cf6;--blu:#3b82f6;
  --r:10px;--r2:14px;--f:'Inter',sans-serif;
}
.medref-root{background:var(--bg);color:var(--tx);min-height:100vh;padding:16px 20px;font-family:var(--f);}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.sh-l{display:flex;align-items:center;gap:10px;}
.sh-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--tdim);}
.sh-ttl{font-size:11px;font-weight:600;letter-spacing:.1em;color:var(--tx2);text-transform:uppercase;}
.sh-m{font-size:11px;color:var(--tx3);}
.ntabs{display:flex;gap:2px;margin-bottom:16px;flex-wrap:wrap;}
.ntab{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid transparent;color:var(--tx2);background:transparent;font-family:var(--f);transition:all .15s;}
.ntab:hover{background:var(--tdim);color:var(--tx);}
.ntab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.sw{flex:1;display:flex;align-items:center;gap:8px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);padding:0 12px;transition:border-color .15s;}
.sw:focus-within{border-color:var(--br2);}
.sw input{flex:1;background:transparent;border:none;outline:none;color:var(--tx);font-size:13px;padding:9px 0;font-family:var(--f);}
.sw input::placeholder{color:var(--tx3);}
.fps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.fp{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;}
.fp:hover{border-color:var(--br2);color:var(--tx);}
.fp.on{color:#080e1a;border-color:transparent;font-weight:600;}
.card{background:var(--c1);border:1px solid var(--br);border-radius:var(--r2);overflow:hidden;}
.chdr{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--br);background:var(--c2);}
.cbdy{padding:14px 16px;}
.mlist{display:flex;flex-direction:column;gap:3px;}
.mrow{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);cursor:pointer;transition:all .15s;}
.mrow:hover{background:var(--c2);border-color:var(--br2);}
.mrow.ex{background:var(--c2);border-color:var(--br2);border-radius:var(--r) var(--r) 0 0;border-bottom-color:transparent;}
.mdot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.mrm{flex:1;min-width:0;}
.mrn{font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.mrs{font-size:11px;color:var(--tx2);margin-top:2px;}
.mcod{font-size:10px;font-family:monospace;padding:2px 6px;border-radius:4px;background:var(--c3);border:1px solid var(--br2);color:var(--tx2);font-weight:600;letter-spacing:.05em;}
.mlb{font-size:9px;padding:2px 6px;border-radius:3px;font-weight:700;letter-spacing:.06em;}
.mrr{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.obtn{font-size:11px;color:var(--teal);background:transparent;border:none;cursor:pointer;font-family:var(--f);font-weight:500;white-space:nowrap;padding:4px 0;}
.obtn:hover{text-decoration:underline;}
.dpill{font-size:10px;background:var(--c3);border:1px solid var(--br);border-radius:4px;padding:2px 8px;color:var(--tx2);font-family:monospace;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mdet{background:var(--c2);border:1px solid var(--br2);border-top:none;border-radius:0 0 var(--r) var(--r);padding:13px 13px 13px 36px;margin-bottom:3px;}
.dgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-bottom:11px;}
.dlbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.dval{font-size:12px;color:var(--tx);line-height:1.5;}
.dval.tl{color:var(--teal);font-weight:600;font-family:monospace;font-size:13px;}
.cir{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--red);padding:2px 0;}
.wr{display:flex;gap:6px;align-items:flex-start;font-size:11px;color:var(--tx2);padding:2px 0;}
.rtags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;padding-top:9px;border-top:1px solid var(--br);}
.rtag{font-size:10px;padding:2px 8px;border-radius:4px;letter-spacing:.04em;background:rgba(0,196,160,.06);border:1px solid rgba(0,196,160,.2);color:var(--teal);}
.rvtag{font-size:10px;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);color:var(--pur);}
.aip{background:var(--c2);border:1px solid rgba(0,196,160,.2);border-radius:var(--r2);padding:13px 15px;margin-bottom:16px;}
.aih{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.aitag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);background:rgba(0,196,160,.1);border:1px solid rgba(0,196,160,.25);padding:3px 8px;border-radius:4px;}
.aim{font-size:11px;color:var(--tx3);margin-left:auto;}
.air{display:flex;gap:8px;}
.aii{flex:1;background:var(--c3);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:8px 12px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.aii:focus{border-color:var(--br2);}
.aib{padding:8px 15px;background:var(--teal);border:none;border-radius:var(--r);color:#080e1a;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--f);transition:opacity .15s;white-space:nowrap;}
.aib:hover{opacity:.85;}
.aib:disabled{opacity:.4;cursor:not-allowed;}
.airesp{margin-top:11px;padding:11px 13px;background:var(--c3);border-radius:var(--r);border:1px solid var(--br);font-size:12px;line-height:1.7;color:var(--tx2);white-space:pre-wrap;}
.cinps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
.ilbl{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-bottom:5px;}
.inp,.sel{width:100%;background:var(--c3);border:1px solid var(--br);border-radius:var(--r);padding:8px 11px;color:var(--tx);font-size:13px;font-family:var(--f);outline:none;transition:border-color .15s;}
.inp:focus,.sel:focus{border-color:var(--br2);}
.sel option{background:var(--c3);}
.wbar{display:flex;align-items:center;gap:18px;padding:11px 15px;background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);margin-bottom:13px;}
.wv{font-size:30px;font-weight:700;color:var(--teal);font-family:monospace;}
.wu{font-size:13px;color:var(--tx2);}
.west{font-size:10px;color:var(--tx3);letter-spacing:.05em;}
.bzb{padding:4px 11px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;margin-left:auto;}
.cstat{background:var(--c3);border-radius:var(--r);padding:7px 12px;text-align:center;}
.csv{font-size:15px;font-weight:700;font-family:monospace;}
.csl{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);margin-top:2px;}
.rtbl{width:100%;border-collapse:collapse;}
.rtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 7px;}
.rtbl td{padding:7px 10px;border-top:1px solid var(--br);font-size:12px;vertical-align:top;}
.rtbl tr:hover td{background:rgba(255,255,255,.015);}
.rdose{font-family:monospace;color:var(--teal);font-weight:700;font-size:13px;}
.rmax{font-size:9px;padding:2px 6px;border-radius:3px;background:rgba(245,158,11,.1);color:var(--yel);font-weight:700;}
.rcap{color:var(--yel)!important;}
.cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:18px;}
.cc{background:var(--c1);border-radius:var(--r2);overflow:hidden;border:1px solid var(--br);}
.cct{padding:10px 13px;}
.ccb{font-size:9px;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:3px;display:inline-block;margin-bottom:5px;}
.ccl{font-size:12px;font-weight:700;}
.ccd{font-size:11px;color:var(--tx2);margin-top:3px;line-height:1.4;}
.ccp{border-top:1px solid var(--br);}
.cprow{display:flex;justify-content:space-between;gap:8px;padding:5px 13px;border-bottom:1px solid var(--br);font-size:11px;}
.cprow:last-child{border-bottom:none;}
.cpn{color:var(--tx2);flex-shrink:0;}
.cpv{color:var(--tx);text-align:right;font-family:monospace;font-size:10px;}
.blist{display:flex;flex-direction:column;gap:6px;}
.bstep{display:flex;gap:11px;align-items:flex-start;padding:9px 13px;background:var(--c1);border:1px solid var(--br);border-radius:var(--r);border-left:3px solid transparent;}
.bstep.critical{border-left-color:var(--red);}
.bstep.high{border-left-color:var(--yel);}
.snum{width:23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;font-family:monospace;}
.critical .snum{background:rgba(239,68,68,.12);color:var(--red);}
.high .snum{background:rgba(245,158,11,.12);color:var(--yel);}
.sact{font-size:13px;font-weight:600;}
.sdet{font-size:11px;color:var(--tx2);margin-top:2px;line-height:1.4;}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:18px;}
.fn{font-size:12px;font-weight:600;color:var(--teal);font-family:monospace;}
.fd{font-size:11px;color:var(--tx2);margin-top:2px;}
.ft{width:100%;border-collapse:collapse;}
.ft th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 8px 6px;}
.ft td{padding:6px 8px;border-top:1px solid var(--br);font-size:11px;vertical-align:top;}
.mtbl{width:100%;border-collapse:collapse;}
.mtbl th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);text-align:left;padding:0 10px 5px;}
.mtbl td{padding:5px 10px;border-top:1px solid var(--br);font-size:11px;}
.arow{background:var(--c1);border:1px solid var(--br);border-radius:var(--r);overflow:hidden;margin-bottom:6px;}
.asev{font-size:11px;font-weight:700;padding:8px 13px;background:var(--c2);border-bottom:1px solid var(--br);display:flex;align-items:center;gap:8px;}
.abdy{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;padding:11px 13px;}
.al{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-bottom:4px;}
.ad{font-size:12px;font-family:monospace;color:var(--grn);font-weight:600;line-height:1.4;}
.aa{font-size:11px;color:var(--tx2);line-height:1.4;}
.an{font-size:11px;color:var(--tx3);line-height:1.4;}
.stabs{display:flex;gap:6px;margin-bottom:13px;}
.stab{padding:5px 13px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--br);background:var(--c1);color:var(--tx2);transition:all .15s;font-family:var(--f);}
.stab:hover{border-color:var(--br2);color:var(--tx);}
.stab.on{background:var(--tdim);border-color:var(--br2);color:var(--teal);}
.ibox{background:rgba(0,196,160,.05);border:1px solid rgba(0,196,160,.15);border-radius:var(--r);padding:9px 12px;font-size:11px;color:var(--tx2);line-height:1.6;margin-bottom:12px;}
.ibox strong{color:var(--teal);}
.empty{text-align:center;padding:44px;color:var(--tx3);}
.empty-i{font-size:34px;margin-bottom:9px;}
.empty-t{font-size:13px;}
.saved-panel{position:fixed;top:72px;left:72px;width:280px;bottom:0;z-index:150;background:#060b15;border-right:1px solid rgba(0,196,160,0.18);display:flex;flex-direction:column;}
@media(max-width:1100px){.cgrid{grid-template-columns:1fr 1fr;}.dgrid{grid-template-columns:1fr 1fr;}.abdy{grid-template-columns:1fr;}.cinps{grid-template-columns:1fr 1fr;}}
@media(max-width:768px){.medref-root{padding:10px;}.cgrid,.fgrid,.cinps{grid-template-columns:1fr;}.dgrid{grid-template-columns:1fr;}}
`;

export default function MedicationReferencePage() {
  const [medications, setMedications]     = useState([]);
  const [loadingMeds, setLoadingMeds]     = useState(true);
  const [tab, setTab]                     = useState("medications");
  const [cat, setCat]                     = useState("all");
  const [search, setSearch]               = useState("");
  const [expanded, setExpanded]           = useState(null);
  const [pedAge, setPedAge]               = useState("");
  const [pedUnit, setPedUnit]             = useState("months");
  const [pedWt, setPedWt]                 = useState("");
  const [pedCat, setPedCat]               = useState("all");
  const [complaint, setComplaint]         = useState("");
  const [aiText, setAiText]               = useState("");
  const [aiLoading, setAiLoading]         = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [savedCasesKey, setSavedCasesKey] = useState(0);
  const [globalWeight, setGlobalWeight]   = useState(null);
  const [globalWeightUnit, setGlobalWeightUnit] = useState("kg");
  const [selectedMeds, setSelectedMeds]   = useState([]);

  useEffect(() => {
    base44.entities.Medication.list().then(data => {
      setMedications(data);
      setLoadingMeds(false);
    });
  }, []);

  const weight = useMemo(() => {
    if (pedWt) return parseFloat(pedWt) || null;
    if (!pedAge) return null;
    const mo = pedUnit === "years" ? parseFloat(pedAge) * 12 : parseFloat(pedAge);
    if (isNaN(mo) || mo < 0) return null;
    return Math.round(estimateWeight(mo) * 10) / 10;
  }, [pedAge, pedUnit, pedWt]);

  const bz = weight ? getBroselow(weight) : null;

  const filtered = useMemo(() => medications.filter(m => {
    if (cat !== "all" && m.category !== cat) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const indicStr = typeof m.indications === "string" ? m.indications : "";
    return m.name.toLowerCase().includes(q) || indicStr.toLowerCase().includes(q) || m.drugClass.toLowerCase().includes(q) || (m.brand && m.brand.toLowerCase().includes(q));
  }), [cat, search]);

  const pedResults = useMemo(() => {
    if (!weight) return [];
    return medications.filter(m => (pedCat === "all" || m.category === pedCat) && m.ped?.mgkg).map(m => {
      const raw = weight * m.ped.mgkg;
      const capped = m.ped.max !== null && raw > m.ped.max;
      const dose = capped ? m.ped.max : Math.round(raw * 10) / 10;
      return { ...m, calcDose: `${dose} ${m.ped.unit}`, capped };
    });
  }, [weight, pedCat]);

  const handleAI = async () => {
    if (!complaint.trim()) return;
    setAiLoading(true); setAiText("");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an ER physician AI following ACEP guidelines. Given this presenting complaint, provide concise clinical medication recommendations.\n\nPresenting Complaint: ${complaint}\n\nProvide:\n1. Immediate medications (with ER doses)\n2. Key monitoring parameters\n3. Critical contraindications to assess\n4. Disposition considerations\n\nBe concise and clinical.`
      });
      setAiText(typeof result === "string" ? result : JSON.stringify(result));
    } catch (e) {
      setAiText("⚠ Unable to reach AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  const weightKg = globalWeight ? (globalWeightUnit === "lbs" ? Math.round(globalWeight / 2.205 * 10) / 10 : globalWeight) : null;

  return (
    <>
      <style>{CSS}</style>

      {showSaveModal && weight && (
        <SaveCaseModal
          weight={weight} pedAge={pedAge} pedUnit={pedUnit} pedWt={pedWt} pedCat={pedCat} bz={bz}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => setSavedCasesKey(k => k + 1)}
        />
      )}

      {/* Saved Cases Slide-over Panel */}
      {showSavedCases && (
        <div className="saved-panel">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,196,160,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#94a3b8" }}>SAVED CASES</div>
              <div style={{ fontSize: 10, color: "#4a6080", marginTop: 2 }}>Ped calculator scenarios</div>
            </div>
            <button onClick={() => setShowSavedCases(false)} style={{ background: "transparent", border: "none", color: "#4a6080", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
          <SavedCasesPanel
            key={savedCasesKey}
            onLoadCase={(c) => {
              setTab("calculator");
              if (c.patient_age) {
                const parts = c.patient_age.split(" ");
                if (parts[0]) setPedAge(parts[0]);
                if (parts[1]) setPedUnit(parts[1]);
              }
              if (c.weight_source === "measured") setPedWt(String(c.weight_kg));
              if (c.category_filter) setPedCat(c.category_filter);
              setShowSavedCases(false);
            }}
          />
        </div>
      )}

      <div className="medref-root" style={showSavedCases ? { marginLeft: 280 } : {}}>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", margin: 0 }}>Medication Reference</h1>
            <div style={{ fontSize: 12, color: "var(--tx3)", marginTop: 3 }}>Emergency Department · ACEP Guidelines · {MEDICATIONS.length} medications</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: "rgba(0,196,160,.12)", border: "1px solid rgba(0,196,160,.3)", color: "var(--teal)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
              AI ACTIVE
            </div>
            <button
              onClick={() => setShowSavedCases(!showSavedCases)}
              style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", border: "1px solid rgba(0,196,160,0.3)", background: showSavedCases ? "rgba(0,196,160,0.12)" : "transparent", color: "var(--teal)", fontFamily: "inherit" }}
            >
              📋 Saved Cases
            </button>
          </div>
        </div>

        {/* AI Panel */}
        <div className="aip">
          <div className="aih">
            <span style={{ fontSize: 15 }}>⚡</span>
            <span className="aitag">AI CLINICAL INSIGHT</span>
            <span className="aim">Evidence-based · Real-time</span>
          </div>
          <div className="air">
            <input className="aii" placeholder="Enter presenting complaint for AI medication recommendations (e.g. 'septic shock, HR 125, temp 39.2°C, BP 82/54, lactate 4.8')..." value={complaint} onChange={e => setComplaint(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAI()} />
            <button className="aib" onClick={handleAI} disabled={aiLoading}>{aiLoading ? "Consulting..." : "Analyze →"}</button>
          </div>
          {aiText && <div className="airesp">{aiText}</div>}
        </div>

        {/* Main Tabs */}
        <div className="ntabs">
          {[["medications", "💊 MEDICATIONS"], ["calculator", "⚖️ PED CALCULATOR"], ["sepsis", "🔴 SEPSIS PROTOCOL"], ["conditions", "🏥 ER CONDITIONS"]].map(([id, label]) => (
            <button key={id} className={`ntab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── MEDICATIONS TAB ── */}
        {tab === "medications" && (
          <>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">💊</div><span className="sh-ttl">ER MEDICATION REFERENCE</span></div>
              <span className="sh-m">ACEP Guidelines · {filtered.length} medications{selectedMeds.length > 0 ? ` · ${selectedMeds.length} selected` : ""}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 13, alignItems: "center", flexWrap: "wrap" }}>
              <div className="sw" style={{ flex: 1, minWidth: 200 }}>
                <span style={{ color: "var(--tx3)", fontSize: 14 }}>🔍</span>
                <input placeholder="Search medications, indications, drug codes..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <span onClick={() => setSearch("")} style={{ cursor: "pointer", color: "var(--tx3)", fontSize: 14 }}>✕</span>}
              </div>
              <WeightWidget weight={globalWeight} weightUnit={globalWeightUnit} onWeightChange={setGlobalWeight} onUnitChange={setGlobalWeightUnit} onClear={() => setGlobalWeight(null)} />
            </div>
            <div className="fps">
              {CATEGORIES.map(c => (
                <div key={c.id} className={`fp ${cat === c.id ? "on" : ""}`} style={cat === c.id ? { background: c.color, color: "#080e1a" } : {}} onClick={() => setCat(c.id)}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>
            <DrugInteractionChecker selectedMeds={selectedMeds} medications={MEDICATIONS} />
            {selectedMeds.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <button onClick={() => setSelectedMeds([])} style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 7, background: "transparent", border: "1px solid rgba(0,196,160,0.3)", color: "var(--teal)", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear Selection ({selectedMeds.length})
                </button>
              </div>
            )}
            <div className="card">
              <div className="chdr">
                <div className="sh-l"><span className="sh-ttl">CLINICAL RECOMMENDATIONS</span></div>
                <span className="sh-m">Evidence-based · Tap row for full details</span>
              </div>
              <div style={{ padding: "10px 13px" }}>
                {filtered.length === 0 ? (
                  <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">No medications match your search</div></div>
                ) : (
                  <div className="mlist">
                    {filtered.map(med => (
                      <MedRow
                        key={med.id}
                        med={med}
                        isExpanded={expanded === med.id}
                        onToggle={() => setExpanded(expanded === med.id ? null : med.id)}
                        weightKg={weightKg}
                        isSelected={selectedMeds.some(m => m.id === med.id)}
                        onSelect={(checked) => {
                          if (checked) setSelectedMeds([...selectedMeds, med]);
                          else setSelectedMeds(selectedMeds.filter(m => m.id !== med.id));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── PEDIATRIC CALCULATOR TAB ── */}
        {tab === "calculator" && (
          <>
            <div className="sh">
              <div className="sh-l"><div className="sh-ico">⚖️</div><span className="sh-ttl">PEDIATRIC MEDICATION CALCULATOR</span></div>
              <span className="sh-m">Weight-based dosing · Broselow · Max dose capping</span>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="chdr"><span className="sh-ttl">PATIENT PARAMETERS</span><span className="sh-m">Enter age or override with actual weight</span></div>
              <div className="cbdy">
                <div className="cinps">
                  <div>
                    <label className="ilbl">Age</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="inp" type="number" min="0" placeholder="0" value={pedAge} onChange={e => setPedAge(e.target.value)} style={{ flex: 1 }} />
                      <select className="sel" value={pedUnit} onChange={e => setPedUnit(e.target.value)} style={{ width: 90 }}>
                        <option value="months">months</option>
                        <option value="years">years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="ilbl">Weight (kg) — optional override</label>
                    <input className="inp" type="number" min="0" step="0.1" placeholder="Auto-estimated from age" value={pedWt} onChange={e => setPedWt(e.target.value)} />
                  </div>
                  <div>
                    <label className="ilbl">Filter Drug Category</label>
                    <select className="sel" value={pedCat} onChange={e => setPedCat(e.target.value)}>
                      <option value="all">All Categories</option>
                      {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                {weight && bz && (
                  <>
                    <div className="wbar">
                      <div>
                        <div style={{ fontSize: 10, color: "var(--tx3)", letterSpacing: ".08em", marginBottom: 2 }}>ESTIMATED WEIGHT</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span className="wv">{weight}</span><span className="wu">kg</span>
                          {!pedWt && <span className="west">(age-estimated)</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                        <div className="cstat"><div className="csv" style={{ color: "var(--teal)" }}>{weight < 3 ? "2.5" : weight < 5 ? "3.0" : (Math.round((weight / 4 + 4) * 2) / 2).toFixed(1)} mm</div><div className="csl">ET TUBE</div></div>
                        <div className="cstat"><div className="csv" style={{ color: "var(--yel)" }}>{Math.min(weight * 2, 120)} J</div><div className="csl">DEFIB 2 J/kg</div></div>
                        <div className="cstat"><div className="csv" style={{ color: "var(--pur)" }}>{(weight * 0.01).toFixed(2)} mg</div><div className="csl">EPI ARREST</div></div>
                      </div>
                      <div className="bzb" style={{ background: bz.hex + "20", color: bz.hex, border: `1px solid ${bz.hex}40` }}>● {bz.zone}</div>
                      <button onClick={() => setShowSaveModal(true)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(0,196,160,0.12)", border: "1px solid rgba(0,196,160,0.3)", color: "#00c4a0", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        💾 Save Case
                      </button>
                    </div>
                    <div className="card" style={{ background: "var(--c2)" }}>
                      <div className="chdr"><span className="sh-ttl">CALCULATED DOSES — {weight} kg PATIENT</span><span className="sh-m">{pedResults.length} medications</span></div>
                      <div style={{ padding: "0 0 8px" }}>
                        <table className="rtbl">
                          <thead><tr><th>MEDICATION</th><th>CATEGORY</th><th>CALCULATED DOSE</th><th>ROUTE</th><th>NOTES</th></tr></thead>
                          <tbody>
                            {pedResults.map(m => (
                              <tr key={m.id}>
                                <td><div style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</div><div style={{ fontSize: 10, color: "var(--tx3)" }}>{m.code}</div></td>
                                <td><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${CAT_COLOR[m.category]}15`, color: CAT_COLOR[m.category], border: `1px solid ${CAT_COLOR[m.category]}30` }}>{m.category}</span></td>
                                <td><span className={`rdose ${m.capped ? "rcap" : ""}`}>{m.calcDose}</span>{m.capped && <span className="rmax"> MAX</span>}</td>
                                <td><span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--tx2)" }}>{m.ped.route}</span></td>
                                <td style={{ fontSize: 11, color: "var(--tx2)" }}>{m.ped.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                {!weight && <div className="empty"><div className="empty-i">⚖️</div><div className="empty-t">Enter patient age or weight to calculate doses</div></div>}
              </div>
            </div>
          </>
        )}

        {/* ── SEPSIS PROTOCOL TAB ── */}
        {tab === "sepsis" && <SepsisProtocol />}

        {/* ── ER CONDITIONS TAB ── */}
        {tab === "conditions" && <ERConditions />}

      </div>
    </>
  );
}