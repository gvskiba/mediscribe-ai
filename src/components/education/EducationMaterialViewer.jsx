import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Printer, Heart, HeartOff, Globe, Copy, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LANGUAGES = ["English", "Spanish", "French", "Chinese", "Arabic", "Portuguese"];

const Section = ({ title, icon, items, text, color = "#3b82f6" }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "#f8fafc", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", flex: 1 }}>{icon} {title}</span>
        {open ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
      </button>
      {open && (
        <div style={{ padding: "12px 16px", background: "white" }}>
          {text && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{text}</p>}
          {items && items.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {items.map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default function EducationMaterialViewer({ material, onUpdate }) {
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState(material.language);

  const { sections = {} } = material;

  const handleFavorite = async () => {
    const updated = { ...material, is_favorite: !material.is_favorite };
    await base44.entities.PatientEducationMaterial.update(material.id, { is_favorite: updated.is_favorite });
    toast.success(updated.is_favorite ? "Saved to favorites" : "Removed from favorites");
    if (onUpdate) onUpdate(updated);
  };

  const handlePrint = () => {
    const printContent = buildPrintHTML(material);
    const w = window.open("", "_blank");
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  const handleTranslate = async () => {
    if (selectedLang === material.language) return;
    setTranslating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following patient education content from ${material.language} to ${selectedLang}. Keep the same JSON structure and tone. Write at a 6th-grade reading level.

Content to translate:
${JSON.stringify(sections, null, 2)}

Return valid JSON with the same keys: what_is_it, symptoms, causes, treatment, medications, lifestyle, when_to_call, follow_up`,
        response_json_schema: {
          type: "object",
          properties: {
            what_is_it: { type: "string" },
            symptoms: { type: "array", items: { type: "string" } },
            causes: { type: "array", items: { type: "string" } },
            treatment: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            lifestyle: { type: "array", items: { type: "string" } },
            when_to_call: { type: "array", items: { type: "string" } },
            follow_up: { type: "string" }
          }
        }
      });
      const saved = await base44.entities.PatientEducationMaterial.create({
        ...material,
        id: undefined,
        language: selectedLang,
        title: `${material.diagnosis} — Patient Guide (${selectedLang})`,
        sections: result
      });
      toast.success(`Translated to ${selectedLang} and saved!`);
      if (onUpdate) onUpdate(saved);
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    const text = buildPlainText(material);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>{material.title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 11, background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{material.language}</span>
            {material.patient_name && <span style={{ fontSize: 11, color: "#64748b" }}>For: {material.patient_name}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button onClick={handleCopy} size="sm" variant="outline" className="gap-1 text-xs"><Copy size={12} /> Copy</Button>
          <Button onClick={handlePrint} size="sm" variant="outline" className="gap-1 text-xs"><Printer size={12} /> Print</Button>
          <Button onClick={handleFavorite} size="sm" variant="outline" className="gap-1 text-xs">
            {material.is_favorite ? <HeartOff size={12} /> : <Heart size={12} />}
            {material.is_favorite ? "Unfave" : "Favorite"}
          </Button>
        </div>
      </div>

      {/* Translate */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", background: "#f1f5f9", borderRadius: 8 }}>
        <Globe size={14} color="#64748b" />
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Translate to:</span>
        <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", outline: "none" }}>
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <Button onClick={handleTranslate} disabled={translating || selectedLang === material.language} size="sm" className="bg-blue-600 text-white text-xs h-7 px-3 gap-1">
          {translating ? <><Loader2 size={11} className="animate-spin" /> Translating…</> : "Translate & Save"}
        </Button>
      </div>

      {/* Sections */}
      {sections.what_is_it && <Section title="What Is It?" icon="📖" text={sections.what_is_it} color="#3b82f6" />}
      {sections.symptoms?.length > 0 && <Section title="Symptoms to Watch For" icon="🔍" items={sections.symptoms} color="#f59e0b" />}
      {sections.causes?.length > 0 && <Section title="Common Causes" icon="🧬" items={sections.causes} color="#8b5cf6" />}
      {sections.treatment?.length > 0 && <Section title="Treatment Steps" icon="💊" items={sections.treatment} color="#10b981" />}
      {sections.medications?.length > 0 && <Section title="Your Medications" icon="💉" items={sections.medications} color="#06b6d4" />}
      {sections.lifestyle?.length > 0 && <Section title="Lifestyle Tips" icon="🌿" items={sections.lifestyle} color="#84cc16" />}
      {sections.when_to_call?.length > 0 && <Section title="When to Seek Immediate Help" icon="🚨" items={sections.when_to_call} color="#ef4444" />}
      {sections.follow_up && <Section title="Follow-Up Care" icon="📅" text={sections.follow_up} color="#6366f1" />}
    </div>
  );
}

function buildPlainText(material) {
  const s = material.sections || {};
  const lines = [`${material.title}\n${"=".repeat(50)}`];
  if (s.what_is_it) lines.push(`\nWHAT IS IT?\n${s.what_is_it}`);
  if (s.symptoms?.length) lines.push(`\nSYMPTOMS TO WATCH FOR:\n${s.symptoms.map(x => `• ${x}`).join("\n")}`);
  if (s.causes?.length) lines.push(`\nCOMMON CAUSES:\n${s.causes.map(x => `• ${x}`).join("\n")}`);
  if (s.treatment?.length) lines.push(`\nTREATMENT STEPS:\n${s.treatment.map(x => `• ${x}`).join("\n")}`);
  if (s.medications?.length) lines.push(`\nYOUR MEDICATIONS:\n${s.medications.map(x => `• ${x}`).join("\n")}`);
  if (s.lifestyle?.length) lines.push(`\nLIFESTYLE TIPS:\n${s.lifestyle.map(x => `• ${x}`).join("\n")}`);
  if (s.when_to_call?.length) lines.push(`\nWHEN TO SEEK HELP:\n${s.when_to_call.map(x => `⚠️ ${x}`).join("\n")}`);
  if (s.follow_up) lines.push(`\nFOLLOW-UP CARE:\n${s.follow_up}`);
  return lines.join("\n");
}

function buildPrintHTML(material) {
  const s = material.sections || {};
  const section = (title, items, text) => {
    if (!items?.length && !text) return "";
    return `<div style="margin-bottom:20px"><h3 style="color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;font-size:15px">${title}</h3>${text ? `<p style="color:#374151;line-height:1.6">${text}</p>` : `<ul>${items.map(i => `<li style="color:#374151;line-height:1.7">${i}</li>`).join("")}</ul>`}</div>`;
  };
  return `<!DOCTYPE html><html><head><title>${material.title}</title><style>body{font-family:sans-serif;max-width:700px;margin:40px auto;color:#1e293b}h1{color:#1e293b;font-size:22px}@media print{body{margin:20px}}</style></head><body>
    <h1>${material.title}</h1>
    <p style="color:#64748b;font-size:13px">Language: ${material.language}${material.patient_name ? ` | Patient: ${material.patient_name}` : ""}</p>
    <hr/>
    ${section("What Is It?", null, s.what_is_it)}
    ${section("Symptoms to Watch For", s.symptoms)}
    ${section("Common Causes", s.causes)}
    ${section("Treatment Steps", s.treatment)}
    ${section("Your Medications", s.medications)}
    ${section("Lifestyle Tips", s.lifestyle)}
    ${section("When to Seek Immediate Help", s.when_to_call)}
    ${section("Follow-Up Care", null, s.follow_up)}
    <p style="color:#94a3b8;font-size:11px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:10px">Generated: ${new Date().toLocaleDateString()}</p>
  </body></html>`;
}