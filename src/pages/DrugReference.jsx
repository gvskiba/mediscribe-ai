import { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DRUG_DB } from "@/components/drugreference/drugData";
import { PROC_RULES } from "@/components/drugreference/procRules";
import { calculateWeightBasedDose, ruleBasedScan, parseMedList } from "@/components/drugreference/drugUtils";

// ── STYLES ────────────────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
};

const CAT_COLORS = {
  cardiac:"#ef4444", anticoag:"#3b82f6", abx:"#10b981",
  analgesic:"#f97316", psych:"#ec4899", gi:"#0ea5e9", other:"#a855f7",
};
const CAT_LABELS = {
  all:"All", cardiac:"❤️ Cardiac", anticoag:"🩸 Anticoag",
  abx:"🧬 Antibiotics", analgesic:"💊 Analgesic", psych:"🧠 Psych",
  gi:"🫃 GI", other:"⚙️ Other",
};

const SEV = {
  critical:{ color:G.red,   label:"Critical" },
  major:   { color:G.amber, label:"Major"    },
  moderate:{ color:G.blue,  label:"Moderate" },
  minor:   { color:G.green, label:"Minor"    },
};
const TYPE_STYLE = {
  interaction:{ bg:"rgba(255,92,108,.12)", border:"rgba(255,92,108,.3)", color:G.red },
  allergy:    { bg:"rgba(244,114,182,.12)",border:"rgba(244,114,182,.3)",color:G.rose },
  guideline:  { bg:"rgba(155,109,255,.12)",border:"rgba(155,109,255,.3)",color:G.purple },
  duplicate:  { bg:"rgba(74,144,217,.1)",  border:"rgba(74,144,217,.3)", color:G.blue },
  renal:      { bg:"rgba(245,166,35,.1)",  border:"rgba(245,166,35,.3)", color:G.amber },
};

export default function DrugReference() {
  const [selectedDrug, setSelectedDrug]   = useState(null);
  const [searchQ, setSearchQ]             = useState("");
  const [activeCat, setActiveCat]         = useState("all");
  const [recentDrugs, setRecentDrugs]     = useState([]);
  const [activeTab, setActiveTab]         = useState("scanner");
  const [medListText, setMedListText]     = useState("");
  const [allergies, setAllergies]         = useState([]);
  const [allergyInput, setAllergyInput]   = useState("");
  const [scanResults, setScanResults]     = useState(null);
  const [scanning, setScanning]           = useState(false);
  const [procType, setProcType]           = useState("");
  const [procMeds, setProcMeds]           = useState("");
  const [procResults, setProcResults]     = useState(null);
  const [detailModal, setDetailModal]     = useState(null);
  const [procNoteModal, setProcNoteModal] = useState(false);
  const [procNote, setProcNote]           = useState("");
  const [patientWeight, setPatientWeight] = useState("");
  const [weightUnit, setWeightUnit]       = useState("kg");
  const [toast, setToast]                 = useState(null);

  const toastTimer = useRef(null);

  const showToast = useCallback((msg, color = G.teal) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, color });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Fuzzy search engine ────────────────────────────────────────────────────
  function fuzzyScore(drug, q) {
    if (!q) return { match: true, score: 0, fields: [] };
    const ql = q.toLowerCase().trim();
    const tokens = ql.split(/\s+/).filter(Boolean);
    const fields = [
      { key: "name",        weight: 100, val: drug.name },
      { key: "brand",       weight: 80,  val: drug.brand },
      { key: "drugClass",   weight: 60,  val: drug.drugClass },
      { key: "indications", weight: 40,  val: drug.indications },
      { key: "mechanism",   weight: 20,  val: drug.mechanism },
      { key: "monitoring",  weight: 15,  val: drug.monitoring || "" },
      { key: "interactions",weight: 10,  val: (drug.interactions || []).join(" ") },
    ];

    let totalScore = 0;
    const matchedFields = [];

    for (const token of tokens) {
      let tokenMatched = false;
      for (const f of fields) {
        const vl = f.val.toLowerCase();
        if (vl.includes(token)) {
          const wordBoundary = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'i').test(f.val);
          const bonus = wordBoundary ? 2 : 1;
          const startBonus = vl.startsWith(token) ? 3 : 1;
          totalScore += f.weight * bonus * startBonus;
          if (!matchedFields.includes(f.key)) matchedFields.push(f.key);
          tokenMatched = true;
        }
      }
      if (!tokenMatched) {
        const nameL = drug.name.toLowerCase();
        const brandL = drug.brand.toLowerCase();
        let ni = 0, bi = 0;
        for (const ch of token) { if (nameL.indexOf(ch, ni) !== -1) { ni = nameL.indexOf(ch, ni) + 1; } }
        for (const ch of token) { if (brandL.indexOf(ch, bi) !== -1) { bi = brandL.indexOf(ch, bi) + 1; } }
        if (ni >= token.length) { totalScore += 10; if (!matchedFields.includes("name")) matchedFields.push("name"); }
        else if (bi >= token.length) { totalScore += 8; if (!matchedFields.includes("brand")) matchedFields.push("brand"); }
        else return { match: false, score: 0, fields: [] };
      }
    }
    return { match: totalScore > 0, score: totalScore, fields: matchedFields };
  }

  const filteredDrugs = (() => {
    const matchCat = d => activeCat === "all" || d.category === activeCat;
    if (!searchQ.trim()) return DRUG_DB.filter(matchCat);
    return DRUG_DB
      .map(d => ({ drug: d, ...fuzzyScore(d, searchQ) }))
      .filter(r => r.match && matchCat(r.drug))
      .sort((a, b) => b.score - a.score)
      .map(r => r.drug);
  })();

  const parsedMeds = parseMedList(medListText);

  function selectDrug(drug) {
    setSelectedDrug(drug);
    setRecentDrugs(prev => [drug, ...prev.filter(d => d.id !== drug.id)].slice(0, 6));
  }

  function addToScanner(name) {
    setMedListText(prev => prev.trim() ? prev.trim() + "\n" + name : name);
    setActiveTab("scanner");
    showToast(name + " added to scanner", G.purple);
  }

  function addAllergy() {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) { setAllergies(prev => [...prev, v]); }
    setAllergyInput("");
  }

  async function runScan() {
    if (parsedMeds.length < 2) { showToast("Enter at least 2 medications", G.amber); return; }
    setScanning(true);
    setScanResults(null);

    const allergyStr = allergies.length ? `\nKnown Allergies: ${allergies.join(", ")}` : "";
    const prompt = `You are Notrya AI, a clinical pharmacology expert. Analyze this patient medication list for: drug-drug interactions, allergy conflicts, guideline deviations, duplicate classes, and renal/hepatic concerns.

Medication List:
${parsedMeds.join("\n")}${allergyStr}

Return ONLY a valid JSON array. Each object must have exactly these fields:
- type: "interaction" | "allergy" | "guideline" | "duplicate" | "renal"
- severity: "critical" | "major" | "moderate" | "minor"
- title: string (e.g., "Warfarin + Amiodarone")
- drugs: string array of involved drugs
- description: string (1–2 sentences on the clinical problem)
- mechanism: string (brief mechanism)
- recommendation: string (clear clinical action)

No markdown, no code fences, raw JSON array only.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  drugs: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  mechanism: { type: "string" },
                  recommendation: { type: "string" },
                }
              }
            }
          }
        }
      });
      setScanResults({ meds: parsedMeds, findings: res.findings || [] });
    } catch {
      setScanResults({ meds: parsedMeds, findings: ruleBasedScan(parsedMeds, allergies) });
      showToast("AI unavailable — rule-based scan applied", G.amber);
    }
    setScanning(false);
  }

  function runProcRecon() {
    const rules = PROC_RULES[procType];
    if (!rules) { setProcResults(null); return; }
    const meds = parseMedList(procMeds || medListText);
    const match = (list) => meds.length
      ? list.filter(r => meds.some(m => r.toLowerCase().includes(m.toLowerCase().split(" ")[0])))
      : list;
    const hold    = match(rules.hold);
    const caution = match(rules.caution);
    const cont    = match(rules.cont);
    setProcResults({ hold, caution, cont, meds, procType });
    const names = { colonoscopy:"Colonoscopy / Endoscopy", surgery_major:"Major Surgery (General Anesthesia)", cardiac_cath:"Cardiac Catheterization", epidural:"Neuraxial / Epidural Block", ct_contrast:"CT with Contrast", dental:"Dental Procedure" };
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    setProcNote(`PRE-PROCEDURE MEDICATION RECONCILIATION
Procedure: ${names[procType] || procType}
Date: ${today}

CURRENT MEDICATION LIST:
${procMeds || medListText || "See medication reconciliation in chart"}

MEDICATION MANAGEMENT PLAN:

HOLD BEFORE PROCEDURE:
${hold.length ? hold.map(r => "• " + r).join("\n") : "• No medications held"}

DISCUSS / CAUTION:
${caution.length ? caution.map(r => "• " + r).join("\n") : "• None identified"}

CONTINUE AS SCHEDULED:
${cont.length ? cont.map(r => "• " + r).join("\n") : "• All other medications — continue as prescribed"}

NOTES:
Generated by Notrya AI Pre-Procedure Reconciliation. Confirm with proceduralist and anesthesiologist as appropriate.`);
  }

  async function copyNote() {
    try { await navigator.clipboard.writeText(procNote); showToast("Note copied to clipboard ✓"); }
    catch { showToast("Copy failed — select text manually", G.red); }
  }

  const S = {
    root:{ fontFamily:"'DM Sans',system-ui,sans-serif", background:G.navy, color:G.text },
    ph:{ position:"relative", zIndex:1, padding:"16px 28px 12px", borderBottom:`1px solid rgba(30,58,95,.6)`, background:"rgba(11,29,53,.4)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" },
    phIcon:{ width:46, height:46, background:"rgba(74,144,217,.1)", border:`1px solid rgba(74,144,217,.25)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 },
    phTitle:{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright },
    btn:(bg,color="#fff",border="transparent")=>({ padding:"8px 16px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, border:`1px solid ${border}`, background:bg, color, whiteSpace:"nowrap" }),
    mainLayout:{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"280px 1fr 360px", flex:1, minHeight:0 },
    leftPanel:{ borderRight:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" },
    centerPanel:{ overflowY:"auto", background:"rgba(5,10,20,.3)", display:"flex", flexDirection:"column", minHeight:0 },
    rightPanel:{ borderLeft:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 },
    panelHeading:{ padding:"10px 16px 8px", fontFamily:"'Playfair Display',Georgia,serif", fontSize:13, fontWeight:700, color:G.bright, borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(11,29,53,.5)", display:"flex", alignItems:"center", gap:7, flexShrink:0 },
    searchInput:{ width:"100%", background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:9, padding:"9px 11px 9px 34px", fontFamily:"inherit", fontSize:13, color:G.bright, outline:"none" },
    catPillsRow:{ display:"flex", flexWrap:"wrap", gap:5, padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)` },
    catPill:(active)=>({ fontSize:10.5, fontWeight:700, padding:"4px 10px", borderRadius:20, border:`1px solid ${active ? G.teal : G.border}`, background:active ? "rgba(0,212,188,.08)" : "transparent", color:active ? G.bright : G.dim, cursor:"pointer", fontFamily:"inherit" }),
    drugList:{ flex:1, overflowY:"auto", padding:8 },
    dli:(active)=>({ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:9, cursor:"pointer", border:`1px solid ${active ? "rgba(0,212,188,.25)" : "transparent"}`, background:active ? "rgba(0,212,188,.07)" : "transparent", marginBottom:2 }),
    recentSection:{ borderTop:`1px solid ${G.border}`, flexShrink:0 },
    recentChip:{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20, background:"rgba(22,45,79,.6)", border:`1px solid ${G.border}`, color:G.dim, cursor:"pointer", fontFamily:"inherit" },
    emptyState:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:40, textAlign:"center", opacity:.6 },
    ddSection:{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden" },
    ddSectionHeader:{ padding:"11px 16px", background:"rgba(22,45,79,.4)", borderBottom:`1px solid rgba(30,58,95,.5)`, display:"flex", alignItems:"center", gap:8 },
    ddSectionTitle:{ fontWeight:800, fontSize:12.5, color:G.bright, textTransform:"uppercase", letterSpacing:".05em" },
    infoBlock:{ background:"rgba(11,29,53,.5)", borderRadius:9, padding:"11px 13px", border:`1px solid rgba(30,58,95,.5)` },
    infoBlockLabel:{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 },
    table:{ width:"100%", borderCollapse:"collapse", fontSize:12.5 },
    th:{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim, background:"rgba(22,45,79,.5)", borderBottom:`1px solid ${G.border}` },
    td:{ padding:"9px 12px", borderBottom:`1px solid rgba(30,58,95,.35)`, verticalAlign:"top", color:G.text, fontSize:12.5 },
    intBadge:(major)=>({ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:8, border:`1px solid ${major ? "rgba(255,92,108,.4)" : "rgba(245,166,35,.35)"}`, background:major ? "rgba(255,92,108,.12)" : "rgba(245,166,35,.1)", color:major ? G.red : G.amber, cursor:"pointer", fontFamily:"inherit", marginRight:5, marginBottom:5, display:"inline-block" }),
    checkerTabs:{ display:"flex", borderBottom:`1px solid ${G.border}`, background:"rgba(11,29,53,.7)" },
    checkerTab:(active)=>({ flex:1, padding:"11px 6px", fontSize:11.5, fontWeight:700, textAlign:"center", cursor:"pointer", border:"none", background:"transparent", color:active ? G.bright : G.dim, fontFamily:"inherit", borderBottom:`2px solid ${active ? G.purple : "transparent"}` }),
    ciTextarea:{ width:"100%", background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:9, padding:"10px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none", resize:"none", lineHeight:1.7 },
    resultCard:{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:11, overflow:"hidden", marginBottom:8, cursor:"pointer" },
    rcHeader:{ padding:"10px 13px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8 },
    typeBadge:(type)=>({ fontSize:9.5, fontWeight:800, padding:"3px 8px", borderRadius:8, border:`1px solid ${TYPE_STYLE[type]?.border||G.border}`, background:TYPE_STYLE[type]?.bg||"transparent", color:TYPE_STYLE[type]?.color||G.dim, textTransform:"uppercase", letterSpacing:".05em" }),
    allergyChip:{ fontSize:10.5, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"rgba(255,92,108,.12)", border:`1px solid rgba(255,92,108,.3)`, color:G.red, display:"inline-flex", alignItems:"center", gap:5 },
    procItem:(type)=>({ padding:"10px 12px", borderRadius:9, fontSize:12, lineHeight:1.6, display:"flex", gap:8, marginBottom:5, background:type==="hold"?"rgba(255,92,108,.08)":type==="caution"?"rgba(245,166,35,.08)":"rgba(46,204,113,.07)", border:`1px solid ${type==="hold"?"rgba(255,92,108,.2)":type==="caution"?"rgba(245,166,35,.2)":"rgba(46,204,113,.2)"}`, color:type==="hold"?G.red:type==="caution"?G.amber:G.green }),
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:(wide)=>({ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:wide?760:580, maxHeight:"88vh", overflowY:"auto" }),
    modalHeader:{ padding:"18px 22px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 },
    modalTitle:{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, flex:1 },
    modalFooter:{ padding:"14px 22px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" },
    actionBar:{ position:"sticky", bottom:0, zIndex:10, height:60, background:"rgba(11,29,53,.97)", borderTop:`1px solid ${G.border}`, backdropFilter:"blur(16px)", padding:"0 28px", display:"flex", alignItems:"center", gap:12 },
    summaryBar:{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 14px", marginBottom:10, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" },
    statNum:(color)=>({ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color, lineHeight:1 }),
    statLabel:{ fontSize:9.5, textTransform:"uppercase", letterSpacing:".06em", color:G.dim, fontWeight:700, marginTop:2 },
    shimmer:{ height:14, borderRadius:4, background:`linear-gradient(90deg,${G.edge} 25%,${G.muted} 50%,${G.edge} 75%)`, backgroundSize:"200% 100%", animation:"shimmerMove 1.4s infinite", marginBottom:8 },
    toastEl:(color)=>({ background:G.panel, border:`1px solid ${G.border}`, borderLeft:`3px solid ${color}`, borderRadius:10, padding:"11px 16px", fontSize:12.5, fontWeight:600, color:G.bright, boxShadow:"0 8px 24px rgba(0,0,0,.3)" }),
  };

  function DrugDetail({ drug }) {
    const color = drug.color || CAT_COLORS[drug.category] || G.dim;
    const wt = weightUnit === "lbs" ? parseFloat(patientWeight) / 2.205 : parseFloat(patientWeight);
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        {patientWeight && (
          <div style={{ background:"rgba(0,212,188,.12)", border:"1px solid rgba(0,212,188,.3)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.teal, marginBottom:6 }}>⚖️ Weight-Based Dosing</div>
            <div style={{ fontSize:13, color:G.bright }}>Patient Weight: {patientWeight} {weightUnit} ({wt.toFixed(1)} kg)</div>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${color}18`, border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>💊</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:26, fontWeight:700, color:G.bright, lineHeight:1.1 }}>{drug.name}</div>
            <div style={{ fontSize:13, color:G.dim, marginTop:3 }}>{drug.brand}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
              <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>{drug.drugClass}</span>
              {drug.highAlert && <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(255,92,108,.12)", border:"1px solid rgba(255,92,108,.3)", color:G.red }}>⚡ High Alert</span>}
              {drug.pregnancy && <span style={{ fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:8, background:"rgba(244,114,182,.1)", border:"1px solid rgba(244,114,182,.3)", color:G.rose }}>Pregnancy {drug.pregnancy}</span>}
            </div>
          </div>
          <button style={S.btn("rgba(155,109,255,.1)",G.purple,"rgba(155,109,255,.3)")} onClick={() => addToScanner(drug.name)}>＋ Add to Scanner</button>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>⚗️</span><span style={S.ddSectionTitle}>Mechanism of Action</span></div>
          <div style={{ padding:"14px 16px", fontSize:13, color:G.text, lineHeight:1.8 }}>{drug.mechanism}</div>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>💊</span><span style={S.ddSectionTitle}>Dosing by Indication</span></div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Indication</th><th style={S.th}>Dose</th>{patientWeight && <th style={S.th}>Calculated</th>}<th style={S.th}>Route</th><th style={S.th}>Duration</th><th style={S.th}>Notes</th></tr></thead>
            <tbody>{drug.dosing.map((d,i) => {
              const calcDose = patientWeight ? calculateWeightBasedDose(d.dose, parseFloat(patientWeight), weightUnit) : null;
              return (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight:700, color:G.bright }}>{d.indication}</td>
                <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", color:G.teal, fontSize:12 }}>{d.dose}</td>
                {patientWeight && <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", color:G.green, fontSize:12, fontWeight:600 }}>{calcDose || "—"}</td>}
                <td style={{ ...S.td, fontSize:11 }}>{d.route}</td>
                <td style={{ ...S.td, fontSize:11, color:G.dim }}>{d.duration}</td>
                <td style={{ ...S.td, fontSize:11, color:G.muted }}>{d.notes}</td>
              </tr>
            )})}
            </tbody>
          </table>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>🫘</span><span style={S.ddSectionTitle}>Renal Dose Adjustments</span></div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Renal Function</th><th style={S.th}>Adjustment</th><th style={S.th}>Notes</th></tr></thead>
            <tbody>{drug.renal.map((r,i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight:700, color:G.bright, fontSize:12 }}>{r.tier}</td>
                <td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:r.dose.toLowerCase().includes("contraindicated")||r.dose.toLowerCase().includes("avoid")?G.red:r.dose.toLowerCase().includes("reduce")||r.dose.toLowerCase().includes("caution")?G.amber:G.teal, fontWeight:600 }}>{r.dose}</td>
                <td style={{ ...S.td, fontSize:11, color:G.dim }}>{r.note}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>🍋</span><span style={S.ddSectionTitle}>Hepatic Considerations</span></div>
          <div style={{ padding:"14px 16px", fontSize:12.5, color:G.text, lineHeight:1.75 }}>{drug.hepatic}</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>🚫</span><span style={S.ddSectionTitle}>Contraindications &amp; Warnings</span></div>
            <div style={{ padding:"14px 16px" }}>
              {drug.contraindications.map((c,i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:12.5, color:G.text, lineHeight:1.5, marginBottom:5 }}>
                  <span style={{ color:G.red, fontWeight:800, flexShrink:0, fontSize:11, marginTop:2 }}>✕</span>{c}
                </div>
              ))}
              {drug.warnings.map((w,i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:12.5, color:G.text, lineHeight:1.5, marginBottom:5 }}>
                  <span style={{ color:G.amber, flexShrink:0, fontSize:11, marginTop:2 }}>⚠</span>{w}
                </div>
              ))}
            </div>
          </div>
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>⚡</span><span style={S.ddSectionTitle}>Key Interactions</span></div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {drug.interactions.map((inter,i) => {
                  const isMajor = inter.includes("⚠") || inter.toLowerCase().includes("major") || inter.toLowerCase().includes("critical");
                  return (
                    <button key={i} style={S.intBadge(isMajor)} onClick={() => setDetailModal({ type:"interaction", severity:isMajor?"major":"moderate", title:`${drug.name} + ${inter.split("(")[0].trim()}`, drugs:[drug.name, inter.split("(")[0].trim()], description:`See AI Scanner for a full analysis of this interaction with ${inter.split("(")[0].trim()}.`, mechanism:inter.includes("(") ? inter.split("(")[1].replace(")","") : "", recommendation:`Add both drugs to the AI Scanner tab for a comprehensive real-time interaction analysis.` })}>
                      {inter.split("(")[0].trim()}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:G.muted, marginTop:8 }}>Click any drug to view detail</div>
            </div>
          </div>
        </div>

        <div style={S.ddSection}>
          <div style={S.ddSectionHeader}><span>📊</span><span style={S.ddSectionTitle}>Pharmacokinetics</span></div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Half-life",drug.halfLife],["Protein Binding",drug.pb],["Bioavailability",drug.ba],["Volume of Dist.",drug.vd],["Renal Excretion",drug.renalExc,"span"]].map(([label,val,span]) => (
                <div key={label} style={{ ...S.infoBlock, ...(span?{gridColumn:"span 2"}:{}) }}>
                  <div style={S.infoBlockLabel}>{label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", color:G.teal, fontSize:12 }}>{val||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {drug.monitoring && (
          <div style={S.ddSection}>
            <div style={S.ddSectionHeader}><span>🔬</span><span style={S.ddSectionTitle}>Monitoring Parameters</span></div>
            <div style={{ padding:"14px 16px", fontSize:12.5, color:G.text, lineHeight:1.75 }}>{drug.monitoring}</div>
          </div>
        )}
      </div>
    );
  }

  function ScanResults({ data }) {
    const sortOrder = { critical:0, major:1, moderate:2, minor:3 };
    const sorted = [...data.findings].sort((a,b) => (sortOrder[a.severity]||3)-(sortOrder[b.severity]||3));
    const crit = data.findings.filter(f=>f.severity==="critical").length;
    const maj  = data.findings.filter(f=>f.severity==="major").length;
    const mod  = data.findings.filter(f=>f.severity==="moderate"||f.severity==="minor").length;

    return (
      <div>
        <div style={S.summaryBar}>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.teal)}>{data.meds.length}</div><div style={S.statLabel}>Meds Scanned</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.red)}>{crit}</div><div style={S.statLabel}>Critical</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.amber)}>{maj}</div><div style={S.statLabel}>Major</div></div>
          <div style={{ textAlign:"center" }}><div style={S.statNum(G.blue)}>{mod}</div><div style={S.statLabel}>Moderate</div></div>
        </div>
        {sorted.map((f,i) => (
          <div key={i} style={S.resultCard} onClick={() => setDetailModal(f)}>
            <div style={S.rcHeader}>
              <div style={{ width:4, height:32, borderRadius:2, background:SEV[f.severity]?.color||G.dim, flexShrink:0 }}/>
              <div style={{ fontWeight:700, fontSize:13, color:G.bright, flex:1 }}>{f.title}</div>
              <span style={S.typeBadge(f.type)}>{f.type}</span>
            </div>
            <div style={{ padding:"10px 13px", fontSize:12, color:G.text, lineHeight:1.65 }}>
              <div>{f.description}</div>
              {f.mechanism && <div style={{ fontSize:11.5, color:G.dim, marginTop:5, paddingTop:5, borderTop:`1px solid rgba(30,58,95,.3)` }}>⚗️ {f.mechanism}</div>}
              {f.recommendation && <div style={{ fontSize:11.5, color:G.green, fontWeight:600, marginTop:6, display:"flex", gap:6 }}><span>→</span><span>{f.recommendation}</span></div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        textarea:focus,input:focus,select:focus{outline:none;border-color:#00d4bc!important}
        @keyframes shimmerMove{to{background-position:-200% 0}}
        .drug-list-item:hover{background:rgba(22,45,79,.6)!important;border-color:rgba(30,58,95,.6)!important}
        .action-btn:hover{opacity:.85}
        .recent-chip:hover{color:#e8f4ff;border-color:#2a4d72}
        select option{background:#0d2240;color:#c8ddf0}
      `}</style>

      {/* PAGE HEADER */}
      <div style={S.ph}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={() => window.location.href = window.location.href.replace(/\/[^/]*$/, '/DrugsBugs')} style={{ padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${G.border}`, color:G.dim, display:"flex", alignItems:"center", gap:6 }}>← Back to Drugs & Bugs</button>
          <div style={S.phIcon}>💊</div>
          <div>
            <div style={S.phTitle}>Drug Reference &amp; Interactions</div>
            <div style={{ fontSize:12, color:G.dim, marginTop:2 }}>Dosing · Mechanism · Contraindications · Renal/Hepatic · AI Bulk Interaction Scan · Procedure Reconciliation</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ padding:"6px 14px", borderRadius:20, fontSize:11.5, fontWeight:700, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>📚 {DRUG_DB.length} Drugs</span>
          <span style={{ padding:"6px 14px", borderRadius:20, fontSize:11.5, fontWeight:700, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.25)", color:G.purple }}>✦ AI-Powered Scan</span>
          <button className="action-btn" style={{ ...S.btn("transparent",G.text,G.border) }} onClick={()=>{setActiveTab("proc");setProcMeds(medListText);}}>🔗 Pre-Procedure</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ ...S.mainLayout, flex:1, overflowY:"auto" }}>

        {/* LEFT: DRUG LIST */}
        <div style={S.leftPanel}>
          <div style={{ padding:"10px 12px 8px", borderBottom:`1px solid rgba(30,58,95,.5)` }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:G.dim, pointerEvents:"none" }}>🔍</span>
              <input
                style={{ ...S.searchInput, paddingRight: searchQ ? 56 : 12 }}
                placeholder="Search name, class, indication…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "ArrowDown" && filteredDrugs.length > 0) { selectDrug(filteredDrugs[0]); e.currentTarget.blur(); }
                  if (e.key === "Escape") setSearchQ("");
                }}
                autoComplete="off"
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"rgba(74,144,217,.15)", border:"none", borderRadius:6, color:G.dim, cursor:"pointer", fontSize:11, padding:"2px 7px", fontFamily:"inherit", fontWeight:700 }}
                >✕ Clear</button>
              )}
            </div>
            {searchQ && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:7, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: filteredDrugs.length > 0 ? G.teal : G.red, fontWeight:700 }}>
                  {filteredDrugs.length} result{filteredDrugs.length !== 1 ? "s" : ""}
                </span>
                {["name","brand","drugClass","indications","mechanism"].map(f => {
                  const labels = { name:"Name", brand:"Brand", drugClass:"Class", indications:"Indication", mechanism:"Mechanism" };
                  const hitCount = DRUG_DB.filter(d => d[f]?.toLowerCase().includes(searchQ.toLowerCase())).length;
                  if (!hitCount) return null;
                  return (
                    <span key={f} style={{ fontSize:9.5, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(74,144,217,.1)", border:`1px solid rgba(74,144,217,.25)`, color:G.blue }}>
                      {labels[f]}
                    </span>
                  );
                })}
              </div>
            )}
            {!searchQ && (
              <div style={{ marginTop:7, display:"flex", gap:5, flexWrap:"wrap" }}>
                {["sepsis","QT","HF","COPD","pain","seizure","anticoag"].map(hint => (
                  <button key={hint} onClick={() => setSearchQ(hint)} style={{ fontSize:10, padding:"2px 8px", borderRadius:12, background:"rgba(22,45,79,.6)", border:`1px solid ${G.border}`, color:G.dim, cursor:"pointer", fontFamily:"inherit" }}>{hint}</button>
                ))}
              </div>
            )}
          </div>
          <div style={S.catPillsRow}>
            {Object.entries(CAT_LABELS).map(([k,label])=>(
              <button key={k} style={S.catPill(activeCat===k)} onClick={()=>setActiveCat(k)}>{label}</button>
            ))}
          </div>
          <div style={S.drugList}>
            {filteredDrugs.length === 0 && (
              <div style={{ padding:24, textAlign:"center", color:G.muted, fontSize:12.5 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
                <div>No results for <strong style={{ color:G.dim }}>"{searchQ}"</strong></div>
                <div style={{ fontSize:11, marginTop:6, color:G.muted }}>Try a brand name, drug class, or condition (e.g. "afib", "SSRI", "pain")</div>
                <button onClick={() => setSearchQ("")} style={{ marginTop:10, fontSize:11, padding:"4px 12px", borderRadius:8, background:"rgba(74,144,217,.1)", border:`1px solid ${G.border}`, color:G.blue, cursor:"pointer", fontFamily:"inherit" }}>Clear search</button>
              </div>
            )}
            {filteredDrugs.map((drug, idx) => {
              const ql = searchQ.toLowerCase();
              const nameMatch = ql && drug.name.toLowerCase().includes(ql);
              const classMatch = ql && drug.drugClass.toLowerCase().includes(ql);
              const indicationMatch = ql && drug.indications.toLowerCase().includes(ql);
              const brandMatch = ql && drug.brand.toLowerCase().includes(ql);

              function highlight(text, q) {
                if (!q) return text;
                const idx2 = text.toLowerCase().indexOf(q.toLowerCase());
                if (idx2 === -1) return text;
                return (
                  <>
                    {text.slice(0, idx2)}
                    <span style={{ background:"rgba(0,212,188,.25)", color:G.teal, borderRadius:2, padding:"0 1px" }}>{text.slice(idx2, idx2 + q.length)}</span>
                    {text.slice(idx2 + q.length)}
                  </>
                );
              }

              return (
                <div key={drug.id} style={S.dli(selectedDrug?.id===drug.id)} className="drug-list-item" onClick={()=>selectDrug(drug)}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:drug.color||CAT_COLORS[drug.category]||G.dim, flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12.5, color:G.bright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {nameMatch ? highlight(drug.name, ql) : drug.name}
                    </div>
                    <div style={{ fontSize:10.5, color:classMatch ? G.teal : G.dim, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {classMatch ? highlight(drug.drugClass.split("(")[0].trim(), ql) : drug.drugClass.split("(")[0].trim()}
                    </div>
                    {(indicationMatch || brandMatch) && (
                      <div style={{ fontSize:9.5, color:G.amber, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {indicationMatch ? "→ " + drug.indications.slice(Math.max(0, drug.indications.toLowerCase().indexOf(ql) - 10), drug.indications.toLowerCase().indexOf(ql) + 40) + "…"
                          : brandMatch ? `Brand: ${drug.brand.split(",")[0]}` : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
                    {drug.highAlert && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:6, background:"rgba(255,92,108,.15)", border:"1px solid rgba(255,92,108,.3)", color:G.red }}>High Alert</span>}
                    {searchQ && idx < 3 && <span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:5, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.25)", color:G.teal }}>#{idx+1}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={S.recentSection}>
            <div style={S.panelHeading}>🕐 Recent</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, padding:"8px 12px 10px" }}>
              {recentDrugs.length === 0 && <span style={{ fontSize:11, color:G.muted }}>No recent searches</span>}
              {recentDrugs.map(d=>(
                <button key={d.id} className="recent-chip" style={S.recentChip} onClick={()=>selectDrug(d)}>{d.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: DRUG DETAIL */}
        <div style={S.centerPanel}>
          {!selectedDrug && (
            <div style={S.emptyState}>
              <div style={{ fontSize:52 }}>💊</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, color:G.dim }}>Select a medication</div>
              <div style={{ fontSize:13, color:G.muted, maxWidth:320, lineHeight:1.7 }}>Search or browse the drug list to view full reference including dosing, mechanism, contraindications, and renal/hepatic adjustments.</div>
            </div>
          )}
          {selectedDrug && <DrugDetail drug={selectedDrug}/>}
        </div>

        {/* RIGHT: INTERACTION CHECKER */}
        <div style={S.rightPanel}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>⚖️ Weight:</span>
            <input style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 9px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none", width:70 }} type="number" placeholder="Weight" value={patientWeight} onChange={e=>setPatientWeight(e.target.value)}/>
            <select style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 6px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none" }} value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
            {patientWeight && <button onClick={()=>{setPatientWeight("");setWeightUnit("kg");}} style={{ background:"rgba(255,92,108,.1)", border:`1px solid rgba(255,92,108,.3)`, borderRadius:6, padding:"4px 8px", color:G.red, fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer" }}>Clear</button>}
          </div>
          <div style={S.checkerTabs}>
            <button style={S.checkerTab(activeTab==="scanner")} onClick={()=>setActiveTab("scanner")}>✦ AI Scanner</button>
            <button style={S.checkerTab(activeTab==="proc")} onClick={()=>{setActiveTab("proc");if(!procMeds)setProcMeds(medListText);}}>🔗 Pre-Procedure</button>
          </div>

          {/* AI SCANNER */}
          {activeTab==="scanner" && (
            <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden", minHeight:0 }}>
              <div style={{ padding:"10px 12px", borderBottom:`1px solid rgba(30,58,95,.4)`, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Allergies:</span>
                <input style={{ background:"rgba(22,45,79,.7)", border:`1px solid ${G.border}`, borderRadius:7, padding:"5px 9px", fontFamily:"inherit", fontSize:11.5, color:G.bright, outline:"none", width:110 }} placeholder="Add allergy…" value={allergyInput} onChange={e=>setAllergyInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAllergy();}}}/>
                {allergies.map((a,i)=>(
                  <span key={i} style={S.allergyChip}>{a}<button onClick={()=>setAllergies(prev=>prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:"rgba(255,92,108,.6)", cursor:"pointer", fontSize:13, fontFamily:"inherit", padding:0, lineHeight:1 }}>✕</button></span>
                ))}
              </div>
              <div style={{ padding:12, borderBottom:`1px solid rgba(30,58,95,.5)`, flexShrink:0 }}>
                <textarea style={S.ciTextarea} rows={7} value={medListText} onChange={e=>setMedListText(e.target.value)} placeholder={`Paste patient's medication list here — one per line or comma-separated.\n\nExample:\nWarfarin 5mg daily\nAmiodarone 200mg\nMetformin 1000mg BID\nDigoxin 0.125mg daily`}/>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <span style={{ flex:1, fontSize:11, fontWeight:700, color:G.dim, fontFamily:"'JetBrains Mono',monospace" }}>{parsedMeds.length} med{parsedMeds.length!==1?"s":""} detected</span>
                  <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setMedListText(`Warfarin 5mg daily\nAmiodarone 200mg daily\nMetformin 1000mg BID\nLisinopril 10mg\nFurosemide 40mg\nDigoxin 0.125mg\nAtorvastatin 40mg\nAspirin 81mg\nLorazepam 1mg TID PRN`)}>Load Sample</button>
                  <button className="action-btn" disabled={scanning} style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)"), opacity:scanning?.6:1 }} onClick={runScan}>
                    {scanning ? "⏳ Scanning…" : "✦ Scan Now"}
                  </button>
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:10 }}>
                {scanning && (
                  <div>
                    {[...Array(4)].map((_,i)=>(
                      <div key={i} style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:12, marginBottom:10 }}>
                        {[40,100,88,72].map((w,j)=>(<div key={j} style={{ ...S.shimmer, width:w+"%" }}/>))}
                      </div>
                    ))}
                  </div>
                )}
                {!scanning && !scanResults && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:200, gap:10, textAlign:"center", opacity:.5 }}>
                    <div style={{ fontSize:36 }}>🔬</div>
                    <div style={{ fontSize:12.5, color:G.muted, maxWidth:240, lineHeight:1.6 }}>Paste a medication list above and click Scan Now. Notrya AI will check for interactions, allergy conflicts, and guideline deviations.</div>
                  </div>
                )}
                {!scanning && scanResults && <ScanResults data={scanResults}/>}
              </div>
            </div>
          )}

          {/* PRE-PROCEDURE */}
          {activeTab==="proc" && (
            <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Procedure Type</span>
                <select style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none", width:"100%" }} value={procType} onChange={e=>setProcType(e.target.value)}>
                  <option value="">— Select Procedure —</option>
                  <option value="colonoscopy">Colonoscopy / Endoscopy</option>
                  <option value="surgery_major">Major Surgery (General Anesthesia)</option>
                  <option value="cardiac_cath">Cardiac Catheterization</option>
                  <option value="epidural">Neuraxial / Epidural Block</option>
                  <option value="ct_contrast">CT with Contrast / Angiogram</option>
                  <option value="dental">Dental Procedure</option>
                </select>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Patient Medications</span>
                <textarea style={{ ...S.ciTextarea, resize:"vertical" }} rows={5} value={procMeds} onChange={e=>setProcMeds(e.target.value)} placeholder="Paste medication list or auto-filled from AI Scanner…"/>
              </div>
              <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)"), width:"100%", justifyContent:"center" }} onClick={runProcRecon}>🔗 Generate Reconciliation</button>
              {procResults && (
                <div>
                  {procResults.hold.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.red, margin:"4px 0 3px" }}>🛑 Hold Before Procedure</div>
                      {procResults.hold.map((r,i)=><div key={i} style={S.procItem("hold")}><span style={{ flexShrink:0 }}>🛑</span><div>{r}</div></div>)}
                    </div>
                  )}
                  {procResults.caution.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.amber, margin:"8px 0 3px" }}>⚠️ Discuss / Caution</div>
                      {procResults.caution.map((r,i)=><div key={i} style={S.procItem("caution")}><span style={{ flexShrink:0 }}>⚠️</span><div>{r}</div></div>)}
                    </div>
                  )}
                  {procResults.cont.length>0 && (
                    <div>
                      <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.green, margin:"8px 0 3px" }}>✅ Continue</div>
                      {procResults.cont.slice(0,4).map((r,i)=><div key={i} style={S.procItem("cont")}><span style={{ flexShrink:0 }}>✅</span><div>{r}</div></div>)}
                    </div>
                  )}
                  <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#4a90d9,#2f6db5)"), width:"100%", justifyContent:"center", marginTop:8 }} onClick={()=>setProcNoteModal(true)}>📝 Generate Procedure Note</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={S.actionBar}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:G.dim }}>{DRUG_DB.length} medications in reference database</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.25)", color:G.purple }}>✦ AI-Powered Scanning</span>
        </div>
        <button className="action-btn" style={{ ...S.btn("transparent",G.text,G.border) }} onClick={()=>{setActiveTab("proc");if(!procMeds)setProcMeds(medListText);}}>🔗 Pre-Procedure Recon</button>
        <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#9b6dff,#7c5cd6)") }} onClick={()=>{if(parsedMeds.length>=2)runScan();else showToast("Enter at least 2 medications",G.amber);}}>✦ Quick Scan</button>
      </div>

      {/* FINDING DETAIL MODAL */}
      {detailModal && (
        <div style={S.overlay} onClick={()=>setDetailModal(null)}>
          <div style={S.modal(false)} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontSize:20 }}>⚡</span>
              <div style={S.modalTitle}>{detailModal.title}</div>
              <button onClick={()=>setDetailModal(null)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:SEV[detailModal.severity]?.color||G.dim }}/>
                <span style={{ fontWeight:700, color:SEV[detailModal.severity]?.color||G.dim }}>{(detailModal.severity||"").toUpperCase()}</span>
                <span style={{ fontSize:11, color:G.dim }}>· {detailModal.type}</span>
              </div>
              <div style={{ fontSize:13, color:G.text, lineHeight:1.75, marginBottom:12 }}>{detailModal.description}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {detailModal.mechanism && (
                  <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12 }}>
                    <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Mechanism</div>
                    <div style={{ fontSize:12.5, color:G.text, lineHeight:1.6 }}>{detailModal.mechanism}</div>
                  </div>
                )}
                <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12, ...(!detailModal.mechanism?{gridColumn:"span 2"}:{}) }}>
                  <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Clinical Recommendation</div>
                  <div style={{ fontSize:12.5, color:G.green, lineHeight:1.6 }}>{detailModal.recommendation}</div>
                </div>
                {detailModal.drugs?.length>0 && (
                  <div style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:12, gridColumn:"span 2" }}>
                    <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:5 }}>Drugs Involved</div>
                    <div>{detailModal.drugs.map((d,i)=>(<span key={i} style={{ background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", borderRadius:6, padding:"2px 8px", fontSize:12, marginRight:5 }}>{d}</span>))}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PROCEDURE NOTE MODAL */}
      {procNoteModal && (
        <div style={S.overlay} onClick={()=>setProcNoteModal(false)}>
          <div style={{ ...S.modal(true), width:760 }} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={{ fontSize:20 }}>📝</span>
              <div style={S.modalTitle}>Pre-Procedure Medication Reconciliation Note</div>
              <button onClick={()=>setProcNoteModal(false)} style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <div style={{ fontSize:11.5, color:G.dim, marginBottom:10 }}>Edit as needed before copying.</div>
              <textarea value={procNote} onChange={e=>setProcNote(e.target.value)} style={{ background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:10, padding:16, fontSize:13, lineHeight:1.85, color:G.bright, outline:"none", minHeight:280, width:"100%", resize:"vertical", fontFamily:"'DM Sans',system-ui,sans-serif", whiteSpace:"pre-wrap" }}/>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btn("transparent",G.text,G.border)} onClick={()=>setProcNoteModal(false)}>Close</button>
              <button className="action-btn" style={{ ...S.btn("linear-gradient(135deg,#00d4bc,#00a896)") }} onClick={copyNote}>📋 Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999 }}>
          <div style={S.toastEl(toast.color)}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}