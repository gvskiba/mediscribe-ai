import React, { useState, useMemo } from "react";
import { DRUG_DB } from "../components/drugreference/drugData";
import { PROC_RULES } from "../components/drugreference/procRules";
import { calculateWeightBasedDose, ruleBasedScan, parseMedList } from "../components/drugreference/drugUtils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, AlertTriangle, ChevronDown, ChevronUp, Pill, Activity,
  Shield, FlaskConical, Stethoscope, BookOpen, Scale, X, Info,
  CheckCircle, XCircle, Clock
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Drugs" },
  { id: "anticoag", label: "Anticoagulants" },
  { id: "cardiac", label: "Cardiac" },
  { id: "abx", label: "Antibiotics" },
  { id: "analgesic", label: "Analgesics" },
  { id: "psych", label: "Psych/Neuro" },
  { id: "gi", label: "GI" },
  { id: "other", label: "Other" },
];

const TABS = ["overview", "dosing", "renal", "interactions", "monitoring", "pharmacokinetics"];

const PROC_OPTIONS = [
  { id: "colonoscopy", label: "Colonoscopy" },
  { id: "surgery_major", label: "Major Surgery" },
  { id: "cardiac_cath", label: "Cardiac Cath" },
  { id: "epidural", label: "Epidural / Neuraxial" },
  { id: "ct_contrast", label: "CT with Contrast" },
  { id: "dental", label: "Dental Procedure" },
];

function PregnancyBadge({ cat }) {
  const colors = { A: "bg-green-100 text-green-800", B: "bg-blue-100 text-blue-800", C: "bg-yellow-100 text-yellow-800", D: "bg-orange-100 text-orange-800", X: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors[cat] || "bg-gray-100 text-gray-700"}`}>Preg {cat}</span>;
}

function SeverityBadge({ severity }) {
  const map = {
    critical: "bg-red-100 text-red-800 border-red-300",
    major: "bg-orange-100 text-orange-800 border-orange-300",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    minor: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${map[severity] || "bg-gray-100 text-gray-700"}`}>{severity}</span>;
}

export default function DrugReference() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState("reference"); // reference | interactions | procedures
  const [medList, setMedList] = useState("");
  const [allergies, setAllergies] = useState("");
  const [scanResults, setScanResults] = useState(null);
  const [selectedProc, setSelectedProc] = useState("surgery_major");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DRUG_DB.filter(d =>
      (category === "all" || d.category === category) &&
      (!q || d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q) || d.drugClass.toLowerCase().includes(q))
    );
  }, [search, category]);

  function handleScan() {
    const meds = parseMedList(medList);
    const alrg = parseMedList(allergies);
    setScanResults(ruleBasedScan(meds, alrg));
  }

  const procData = PROC_RULES[selectedProc];

  return (
    <div className="h-full bg-[#050f1e] text-slate-200 flex flex-col" style={{minHeight: '100vh'}}>
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-[#071525] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Drug Reference</h1>
              <p className="text-xs text-slate-400">{DRUG_DB.length} medications · Clinical decision support</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { id: "reference", label: "Drug Database", icon: BookOpen },
              { id: "interactions", label: "Interaction Checker", icon: AlertTriangle },
              { id: "procedures", label: "Peri-Procedure", icon: Stethoscope },
            ].map(v => (
              <Button
                key={v.id}
                size="sm"
                variant={activeView === v.id ? "default" : "outline"}
                className={activeView === v.id ? "bg-blue-600 text-white border-blue-600" : "border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700"}
                onClick={() => setActiveView(v.id)}
              >
                <v.icon className="w-3.5 h-3.5 mr-1.5" />
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-5">

        {/* === DRUG REFERENCE VIEW === */}
        {activeView === "reference" && (
          <>
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search drugs..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-[#071525] border-slate-700 text-slate-200 placeholder:text-slate-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${category === c.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[calc(100vh-280px)] pr-1">
                {filtered.map(drug => (
                  <button
                    key={drug.id}
                    onClick={() => { setSelectedDrug(drug); setActiveTab("overview"); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${selectedDrug?.id === drug.id ? "bg-blue-600/20 border border-blue-500/40" : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{drug.name}</span>
                      {drug.highAlert && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{drug.drugClass}</p>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center text-slate-500 py-8 text-sm">No drugs found</div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 min-w-0">
              {!selectedDrug ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a drug to view details</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#071525] rounded-xl border border-slate-700/50 overflow-hidden">
                  {/* Drug Header */}
                  <div className="px-5 py-4 border-b border-slate-700/50" style={{ borderLeft: `4px solid ${selectedDrug.color}` }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-white">{selectedDrug.name}</h2>
                          {selectedDrug.highAlert && (
                            <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> High Alert
                            </span>
                          )}
                          <PregnancyBadge cat={selectedDrug.pregnancy} />
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">{selectedDrug.brand}</p>
                        <p className="text-blue-400 text-xs mt-1">{selectedDrug.drugClass}</p>
                      </div>
                      {/* Weight-based dose calc */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Weight"
                          value={weight}
                          onChange={e => setWeight(e.target.value)}
                          className="w-24 bg-slate-800 border-slate-600 text-white text-sm"
                        />
                        <select
                          value={weightUnit}
                          onChange={e => setWeightUnit(e.target.value)}
                          className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-700/50 overflow-x-auto">
                    {TABS.map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2.5 text-xs font-medium capitalize whitespace-nowrap transition-colors ${activeTab === t ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-5 overflow-y-auto max-h-[calc(100vh-380px)]">
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <Section title="Mechanism of Action" icon={<Activity className="w-4 h-4" />}>
                          <p className="text-slate-300 text-sm leading-relaxed">{selectedDrug.mechanism}</p>
                        </Section>
                        <Section title="Indications" icon={<CheckCircle className="w-4 h-4" />}>
                          <p className="text-slate-300 text-sm">{selectedDrug.indications}</p>
                        </Section>
                        <Section title="Contraindications" icon={<XCircle className="w-4 h-4 text-red-400" />}>
                          <ul className="space-y-1">
                            {selectedDrug.contraindications.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-red-400 mt-0.5">•</span>{c}
                              </li>
                            ))}
                          </ul>
                        </Section>
                        <Section title="Warnings" icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}>
                          <ul className="space-y-1">
                            {selectedDrug.warnings.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-orange-400 mt-0.5">⚠</span>{w}
                              </li>
                            ))}
                          </ul>
                        </Section>
                        <Section title="Hepatic Considerations" icon={<Info className="w-4 h-4" />}>
                          <p className="text-slate-300 text-sm">{selectedDrug.hepatic}</p>
                        </Section>
                      </div>
                    )}

                    {activeTab === "dosing" && (
                      <div className="space-y-3">
                        {selectedDrug.dosing.map((d, i) => {
                          const calc = weight ? calculateWeightBasedDose(d.dose, parseFloat(weight), weightUnit) : null;
                          return (
                            <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <span className="text-sm font-semibold text-blue-300">{d.indication}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{d.route}</Badge>
                                  {d.duration && <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{d.duration}</Badge>}
                                </div>
                              </div>
                              <p className="text-white font-medium text-sm">{d.dose}</p>
                              {calc && <p className="text-green-400 text-sm mt-1">Weight-based: {calc}</p>}
                              {d.notes && <p className="text-slate-400 text-xs mt-2">{d.notes}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {activeTab === "renal" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2 pr-4 text-slate-400 font-medium">CrCl / Stage</th>
                              <th className="text-left py-2 pr-4 text-slate-400 font-medium">Dose Adjustment</th>
                              <th className="text-left py-2 text-slate-400 font-medium">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDrug.renal.map((r, i) => (
                              <tr key={i} className="border-b border-slate-800">
                                <td className="py-2.5 pr-4 text-blue-300 font-medium whitespace-nowrap">{r.tier}</td>
                                <td className="py-2.5 pr-4 text-white">{r.dose}</td>
                                <td className="py-2.5 text-slate-400 text-xs">{r.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === "interactions" && (
                      <ul className="space-y-2">
                        {selectedDrug.interactions.map((ix, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/40 rounded px-3 py-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            {ix}
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeTab === "monitoring" && (
                      <div className="space-y-3">
                        <Section title="Monitoring Parameters" icon={<Activity className="w-4 h-4" />}>
                          <p className="text-slate-300 text-sm leading-relaxed">{selectedDrug.monitoring}</p>
                        </Section>
                      </div>
                    )}

                    {activeTab === "pharmacokinetics" && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Half-Life", value: selectedDrug.halfLife },
                          { label: "Protein Binding", value: selectedDrug.pb },
                          { label: "Renal Excretion", value: selectedDrug.renalExc },
                          { label: "Bioavailability", value: selectedDrug.ba },
                          { label: "Volume of Distribution", value: selectedDrug.vd },
                        ].map(pk => (
                          <div key={pk.label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-1">{pk.label}</p>
                            <p className="text-sm font-semibold text-white">{pk.value || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* === INTERACTION CHECKER VIEW === */}
        {activeView === "interactions" && (
          <div className="flex-1 max-w-3xl mx-auto">
            <div className="bg-[#071525] rounded-xl border border-slate-700/50 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" /> Medication Interaction Checker
              </h2>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Medication List (one per line or comma-separated)</label>
                <Textarea
                  value={medList}
                  onChange={e => setMedList(e.target.value)}
                  placeholder="e.g. warfarin, amiodarone, digoxin, furosemide..."
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 h-28"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Known Allergies (optional)</label>
                <Input
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. penicillin, sulfa..."
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Button onClick={handleScan} className="bg-blue-600 hover:bg-blue-700 text-white">
                <FlaskConical className="w-4 h-4 mr-2" /> Scan for Interactions
              </Button>

              {scanResults && (
                <div className="space-y-3 pt-2">
                  {scanResults.map((r, i) => (
                    <div key={i} className={`rounded-lg p-4 border ${
                      r.severity === "critical" ? "bg-red-950/30 border-red-700/40" :
                      r.severity === "major" ? "bg-orange-950/30 border-orange-700/40" :
                      r.severity === "moderate" ? "bg-yellow-950/30 border-yellow-700/40" :
                      "bg-slate-800/50 border-slate-700/50"
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-semibold text-white text-sm">{r.title}</span>
                        <SeverityBadge severity={r.severity} />
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{r.description}</p>
                      {r.recommendation && (
                        <div className="bg-slate-900/50 rounded p-2 text-xs text-blue-300">
                          <span className="font-semibold">Recommendation: </span>{r.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === PERI-PROCEDURE VIEW === */}
        {activeView === "procedures" && (
          <div className="flex-1 max-w-4xl mx-auto">
            <div className="bg-[#071525] rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-blue-400" /> Peri-Procedural Medication Management
              </h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {PROC_OPTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProc(p.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedProc === p.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {procData && (
                <div className="grid md:grid-cols-3 gap-4">
                  <ProcCard title="HOLD" icon={<XCircle className="w-4 h-4 text-red-400" />} color="red" items={procData.hold} />
                  <ProcCard title="CAUTION" icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />} color="yellow" items={procData.caution} />
                  <ProcCard title="CONTINUE" icon={<CheckCircle className="w-4 h-4 text-green-400" />} color="green" items={procData.cont} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}

function ProcCard({ title, icon, color, items = [] }) {
  const border = { red: "border-red-700/40", yellow: "border-yellow-700/40", green: "border-green-700/40" };
  const bg = { red: "bg-red-950/20", yellow: "bg-yellow-950/20", green: "bg-green-950/20" };
  const dot = { red: "text-red-400", yellow: "text-yellow-400", green: "text-green-400" };
  return (
    <div className={`rounded-lg border p-4 ${border[color]} ${bg[color]}`}>
      <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-white">{icon}{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`text-xs text-slate-300 flex items-start gap-1.5`}>
            <span className={`${dot[color]} mt-0.5 flex-shrink-0`}>•</span>{item}
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-slate-500 italic">None specified</li>}
      </ul>
    </div>
  );
}