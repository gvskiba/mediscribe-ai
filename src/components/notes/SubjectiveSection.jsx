import React, { useState } from "react";
import { X } from "lucide-react";
import NoteSection from "./NoteSection";

const T = {
  bg: "#080b10",
  border_2: "#243048",
  text: "#dde2ef",
  muted: "#4e5a78",
  teal: "#00cca3",
  red: "#f87171",
};

export default function SubjectiveSection({ note, onUpdate }) {
  const [newPmh, setNewPmh] = useState("");
  const [newPsh, setNewPsh] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMed, setNewMed] = useState("");

  const updateField = (field, value) => {
    onUpdate({ [field]: value });
  };

  const addTag = (field, currentArray, newValue, resetFn) => {
    if (!newValue.trim()) return;
    const updated = [...(currentArray || []), newValue.trim()];
    updateField(field, updated);
    resetFn("");
  };

  const removeTag = (field, currentArray, index) => {
    const updated = currentArray.filter((_, i) => i !== index);
    updateField(field, updated);
  };

  const Textarea = ({ label, value, placeholder, onChange, minHeight = "80px" }) => (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: T.bg,
          border: `1px solid ${T.border_2}`,
          borderRadius: "6px",
          color: T.text,
          fontFamily: "Geist",
          fontSize: "13px",
          padding: "7px 11px",
          boxSizing: "border-box",
          outline: "none",
          minHeight,
          resize: "vertical",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.teal)}
        onBlur={(e) => (e.target.style.borderColor = T.border_2)}
      />
    </div>
  );

  const TagInput = ({ label, tags = [], value, placeholder, onChange, onAdd, tagColor = "blue" }) => {
    const tagBg = tagColor === "red" ? "rgba(248, 113, 113, 0.1)" : "rgba(59, 130, 246, 0.1)";
    const tagBorder = tagColor === "red" ? "rgba(248, 113, 113, 0.3)" : "rgba(59, 130, 246, 0.3)";
    const tagColor_ = tagColor === "red" ? T.red : "#3b82f6";

    return (
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontFamily: "Geist Mono", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: "5px" }}>
          {label}
        </label>
        <div style={{ background: T.bg, border: `1px solid ${T.border_2}`, borderRadius: "6px", padding: "8px", minHeight: "40px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "flex-start" }}>
          {tags.map((tag, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 7px",
                borderRadius: "4px",
                background: tagBg,
                border: `1px solid ${tagBorder}`,
                color: tagColor_,
                fontSize: "12px",
              }}
            >
              {tag}
              <button
                onClick={() => {
                  const idx_ = tags.indexOf(tag);
                  onAdd(idx_);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: tagColor_,
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd(value);
              }
            }}
            placeholder={placeholder}
            style={{
              flex: 1,
              minWidth: "100px",
              background: "transparent",
              border: "none",
              color: T.text,
              fontFamily: "Geist",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <NoteSection id="section-subjective" label="Subjective" icon="💬" accentColor="teal" defaultOpen={true}>
      <Textarea
        label="History of Present Illness (HPI)"
        value={note.history_of_present_illness}
        placeholder="Describe the onset, location, duration, character, alleviating/aggravating factors..."
        onChange={(value) => updateField("history_of_present_illness", value)}
        minHeight="100px"
      />

      <TagInput
        label="Past Medical History (PMH)"
        tags={note.medical_history ? note.medical_history.split(", ") : []}
        value={newPmh}
        placeholder="Add condition…"
        onChange={setNewPmh}
        onAdd={(idx) => {
          if (typeof idx === "number") {
            removeTag("medical_history", note.medical_history ? note.medical_history.split(", ") : [], idx);
          } else {
            addTag("medical_history", note.medical_history ? note.medical_history.split(", ") : [], newPmh, setNewPmh);
          }
        }}
      />

      <TagInput
        label="Past Surgical History (PSH)"
        tags={note.surgical_history ? note.surgical_history.split(", ") : []}
        value={newPsh}
        placeholder="Add procedure…"
        onChange={setNewPsh}
        onAdd={(idx) => {
          if (typeof idx === "number") {
            removeTag("surgical_history", note.surgical_history ? note.surgical_history.split(", ") : [], idx);
          } else {
            addTag("surgical_history", note.surgical_history ? note.surgical_history.split(", ") : [], newPsh, setNewPsh);
          }
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <TagInput
          label="Allergies"
          tags={note.allergies || []}
          value={newAllergy}
          placeholder="Add allergy…"
          onChange={setNewAllergy}
          onAdd={(idx) => {
            if (typeof idx === "number") {
              removeTag("allergies", note.allergies || [], idx);
            } else {
              addTag("allergies", note.allergies || [], newAllergy, setNewAllergy);
            }
          }}
          tagColor="red"
        />

        <TagInput
          label="Current Medications"
          tags={note.medications || []}
          value={newMed}
          placeholder="Add medication…"
          onChange={setNewMed}
          onAdd={(idx) => {
            if (typeof idx === "number") {
              removeTag("medications", note.medications || [], idx);
            } else {
              addTag("medications", note.medications || [], newMed, setNewMed);
            }
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Textarea
          label="Social History"
          value={note.social_history}
          placeholder="Smoking, alcohol, drugs, occupation…"
          onChange={(value) => updateField("social_history", value)}
          minHeight="60px"
        />
        <Textarea
          label="Family History"
          value={note.family_history}
          placeholder="Relevant family history…"
          onChange={(value) => updateField("family_history", value)}
          minHeight="60px"
        />
        <Textarea
          label="Review of Systems (ROS)"
          value={note.review_of_systems}
          placeholder="Pertinent positives and negatives…"
          onChange={(value) => updateField("review_of_systems", value)}
          minHeight="60px"
        />
      </div>
    </NoteSection>
  );
}