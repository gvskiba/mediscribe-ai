import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BUILTIN_TEMPLATES, SPECIALTY_CONFIG } from "../components/notetemplates/templateData";
import TemplateLibrarySidebar from "../components/notetemplates/TemplateLibrarySidebar";
import TemplateForm from "../components/notetemplates/TemplateForm";
import NoteOutputPanel from "../components/notetemplates/NoteOutputPanel";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0d2240", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc",
};

function WelcomeScreen({ onSelect }) {
  const quickLaunch = [
    "Emergency Medicine", "Critical Care/ICU", "Inpatient Medicine",
    "Cardiology", "Outpatient/Primary Care", "Procedures",
  ];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 40, gap: 24, background: T.navy,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.bright, marginBottom: 8, fontFamily: "Playfair Display, serif" }}>
          Note Templates Library
        </div>
        <div style={{ fontSize: 13, color: T.dim, maxWidth: 420, lineHeight: 1.6, fontFamily: "DM Sans, sans-serif" }}>
          50+ specialty-specific clinical note templates. Select a template, fill structured key fields,
          and Notrya AI completes the full narrative. Faster than free-text, more structured than macros.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%", maxWidth: 480 }}>
        {quickLaunch.map(spec => {
          const cfg = SPECIALTY_CONFIG[spec] || { icon: "📄", color: T.teal };
          const templates = BUILTIN_TEMPLATES.filter(t => t.specialty === spec);
          const first = templates[0];
          if (!first) return null;
          return (
            <button
              key={spec}
              type="button"
              onClick={() => onSelect(first)}
              style={{
                padding: "16px 10px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s", fontFamily: "DM Sans, sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${cfg.color}22`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${cfg.color}12`; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ fontSize: 24 }}>{cfg.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, lineHeight: 1.3 }}>{spec.split("/")[0]}</span>
              <span style={{ fontSize: 10, color: T.dim }}>{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: T.dim, fontFamily: "DM Sans, sans-serif" }}>
        ← Browse all {BUILTIN_TEMPLATES.length} templates in the library panel
      </div>
    </div>
  );
}

export default function NoteTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ntl_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("ntl_favorites", JSON.stringify(next));
    toast.success(favorites.includes(id) ? "Removed from favorites" : "Added to favorites");
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setGeneratedNote("");
  };

  const handleFieldChange = (fieldId, value) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const buildPrompt = () => {
    if (!selectedTemplate) return "";
    const isCustom = selectedTemplate._isCustom || (!selectedTemplate.template_key);
    let prompt = isCustom
      ? (selectedTemplate.ai_instructions || selectedTemplate.ai_prompt_template || "")
      : (selectedTemplate.ai_prompt_template || "");
    const fieldsToUse = isCustom
      ? (selectedTemplate.dynamic_fields || selectedTemplate.fields || [])
      : (selectedTemplate.fields || []);
    fieldsToUse.forEach(field => {
      const raw = fieldValues[field.id];
      let val = "";
      if (raw === undefined || raw === null || raw === "") {
        val = field.required ? "[not provided]" : "N/A";
      } else if (Array.isArray(raw)) {
        val = raw.join(", ");
      } else if (typeof raw === "object") {
        val = Object.entries(raw).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ");
      } else {
        val = String(raw);
      }
      prompt = prompt.replaceAll(`{{${field.id}}}`, val);
    });
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, "N/A");
    return prompt;
  };

  // Normalise custom template to built-in field shape for TemplateForm
  const normalisedTemplate = selectedTemplate
    ? {
        ...selectedTemplate,
        fields: selectedTemplate.fields || selectedTemplate.dynamic_fields || [],
      }
    : null;

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setGeneratedNote("");
    const prompt = buildPrompt();
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setGeneratedNote(typeof result === "string" ? result : JSON.stringify(result));
    } catch (err) {
      toast.error("AI generation unavailable. Please retry or complete the note manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      background: T.navy,
      fontFamily: "DM Sans, sans-serif",
      height: "calc(100vh - 80px)",
      display: "flex",
      overflow: "hidden",
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Left: Template Library Sidebar */}
      <TemplateLibrarySidebar
        selectedTemplate={selectedTemplate}
        onSelect={handleSelectTemplate}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* Center: Template Form or Welcome */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: T.navy }}>
        {selectedTemplate ? (
          <TemplateForm
            template={normalisedTemplate}
            fieldValues={fieldValues}
            onChange={handleFieldChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        ) : (
          <WelcomeScreen onSelect={handleSelectTemplate} />
        )}
      </div>

      {/* Right: Note Output Panel */}
      <NoteOutputPanel
        note={generatedNote}
        onNoteChange={setGeneratedNote}
        onRegenerate={handleGenerate}
        isGenerating={isGenerating}
        template={selectedTemplate}
      />
    </div>
  );
}