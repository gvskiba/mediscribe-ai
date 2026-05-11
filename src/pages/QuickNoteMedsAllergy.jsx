// QuickNoteMedsAllergy.jsx
// Med Rec & Allergy Review — v11.4
// Export: MedsAllergyZone

import React, { useState, useCallback } from "react";

const COMMON_ALLERGENS = [
  { name: "Penicillin",        reaction: "rash / anaphylaxis"              },
  { name: "Cephalosporins",    reaction: "cross-reactivity / rash"         },
  { name: "Sulfa",             reaction: "rash / Stevens-Johnson"          },
  { name: "NSAIDs",            reaction: "GI bleed / bronchospasm"         },
  { name: "Aspirin",           reaction: "bronchospasm / urticaria"        },
  { name: "Codeine / Opioids", reaction: "nausea / pruritis"              },
  { name: "Contrast dye",      reaction: "anaphylactoid reaction"          },
  { name: "Latex",             reaction: "contact dermatitis / anaphylaxis"},
];

const CHIP = (active) => ({
  padding: "3px 10px", borderRadius: 6, cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
  transition: "all .14s",
  border: `1px solid ${active ? "rgba(61,255,160,.5)" : "rgba(255,107,107,.35)"}`,
  background: active ? "rgba(61,255,160,.1)" : "rgba(255,107,107,.06)",
  color: active ? "var(--qn-green)" : "var(--qn-coral)",
});

const FIELD_INPUT = {
  padding: "4px 7px", borderRadius: 5,
  background: "rgba(14,37,68,.7)", border: "1px solid rgba(42,79,122,.5)",
  color: "var(--qn-txt)", fontFamily: "'DM Sans',sans-serif", fontSize: 11,
  outline: "none", width: "100%", boxSizing: "border-box",
  transition: "border-color .14s",
};

// ─── Inline editable Med row ──────────────────────────────────────────────────
function MedRow({ med, idx, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        title="Click to edit"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 9px", borderRadius: 6, cursor: "pointer",
          background: "rgba(59,158,255,.06)", border: "1px solid rgba(59,158,255,.15)",
          transition: "border-color .14s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(59,158,255,.4)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(59,158,255,.15)"}
      >
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
          color: "var(--qn-txt)", fontWeight: 600, flex: 1 }}>
          {med.name}
        </span>
        {med.dose && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            color: "var(--qn-txt3)" }}>{med.dose}</span>
        )}
        {med.route && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: "var(--qn-blue)", background: "rgba(59,158,255,.1)",
            border: "1px solid rgba(59,158,255,.2)", borderRadius: 4, padding: "1px 6px" }}>
            {med.route}
          </span>
        )}
        {med.frequency && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: "var(--qn-txt4)" }}>{med.frequency}</span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
          color: "rgba(59,158,255,.4)", marginLeft: 2 }}>✎</span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(idx); }}
          style={{ padding: "1px 6px", borderRadius: 4, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
            border: "1px solid rgba(255,107,107,.25)", background: "transparent",
            color: "rgba(255,107,107,.5)", transition: "all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--qn-coral)"; e.currentTarget.style.borderColor = "rgba(255,107,107,.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,107,107,.5)"; e.currentTarget.style.borderColor = "rgba(255,107,107,.25)"; }}
        >✕</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "7px 9px", borderRadius: 6,
      background: "rgba(59,158,255,.08)", border: "1px solid rgba(59,158,255,.4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 1fr auto", gap: 6, alignItems: "center" }}>
        {[
          { field: "name",      placeholder: "Generic name",         value: med.name      },
          { field: "dose",      placeholder: "Dose (e.g. 10mg)",     value: med.dose      },
          { field: "route",     placeholder: "Route",                value: med.route     },
          { field: "frequency", placeholder: "Frequency (e.g. BID)", value: med.frequency },
        ].map(({ field, placeholder, value }) => (
          <input key={field} type="text" value={value || ""}
            onChange={e => onEdit(idx, field, e.target.value)}
            placeholder={placeholder}
            style={{ ...FIELD_INPUT }}
            onFocus={e => e.target.style.borderColor = "rgba(59,158,255,.6)"}
            onBlur={e => e.target.style.borderColor = "rgba(42,79,122,.5)"}
          />
        ))}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setEditing(false)}
            style={{ padding: "3px 8px", borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
              border: "1px solid rgba(0,229,192,.4)", background: "rgba(0,229,192,.08)",
              color: "var(--qn-teal)" }}>✓</button>
          <button onClick={() => onRemove(idx)}
            style={{ padding: "3px 7px", borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              border: "1px solid rgba(255,107,107,.3)", background: "transparent",
              color: "var(--qn-coral)" }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline editable Allergy row ──────────────────────────────────────────────
function AllergyRow({ allergy, idx, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        title="Click to edit"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 9px", borderRadius: 6, cursor: "pointer",
          background: "rgba(255,107,107,.06)", border: "1px solid rgba(255,107,107,.2)",
          transition: "border-color .14s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,107,107,.45)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,107,107,.2)"}
      >
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
          color: "var(--qn-coral)", fontWeight: 700, flex: 1 }}>
          ⚠ {allergy.allergen}
        </span>
        {allergy.reaction && (
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10,
            color: "var(--qn-txt3)" }}>{allergy.reaction}</span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
          color: "rgba(255,107,107,.4)", marginLeft: 2 }}>✎</span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(idx); }}
          style={{ padding: "1px 6px", borderRadius: 4, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
            border: "1px solid rgba(255,107,107,.25)", background: "transparent",
            color: "rgba(255,107,107,.5)", transition: "all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--qn-coral)"; e.currentTarget.style.borderColor = "rgba(255,107,107,.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,107,107,.5)"; e.currentTarget.style.borderColor = "rgba(255,107,107,.25)"; }}
        >✕</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "7px 9px", borderRadius: 6,
      background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.45)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, alignItems: "center" }}>
        <input type="text" value={allergy.allergen || ""}
          onChange={e => onEdit(idx, "allergen", e.target.value)}
          placeholder="Allergen"
          style={{ ...FIELD_INPUT }}
          onFocus={e => e.target.style.borderColor = "rgba(255,107,107,.6)"}
          onBlur={e => e.target.style.borderColor = "rgba(42,79,122,.5)"}
        />
        <input type="text" value={allergy.reaction || ""}
          onChange={e => onEdit(idx, "reaction", e.target.value)}
          placeholder="Reaction"
          style={{ ...FIELD_INPUT }}
          onFocus={e => e.target.style.borderColor = "rgba(255,107,107,.6)"}
          onBlur={e => e.target.style.borderColor = "rgba(42,79,122,.5)"}
        />
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setEditing(false)}
            style={{ padding: "3px 8px", borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
              border: "1px solid rgba(0,229,192,.4)", background: "rgba(0,229,192,.08)",
              color: "var(--qn-teal)" }}>✓</button>
          <button onClick={() => onRemove(idx)}
            style={{ padding: "3px 7px", borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              border: "1px solid rgba(255,107,107,.3)", background: "transparent",
              color: "var(--qn-coral)" }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function MedsAllergyZone({
  medsRaw, setMedsRaw,
  allergiesRaw, setAllergiesRaw,
  parsedMeds, parsedAllergies,
  onParse, parsing, parseError,
  onEditMed, onRemoveMed,
  onEditAllergy, onRemoveAllergy,
  medsFromHpi, allergiesFromHpi,
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [nkda,        setNkda]        = useState(false);
  const [hpiImported, setHpiImported] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);

  const hasMeds      = parsedMeds?.length > 0;
  const hasAllergies = parsedAllergies?.length > 0 || nkda;
  const hasAny       = hasMeds || hasAllergies || medsRaw.trim() || allergiesRaw.trim();

  const handleAllergenChip = useCallback((allergen) => {
    const idx = parsedAllergies?.findIndex(
      a => a.allergen?.toLowerCase() === allergen.name.toLowerCase()
    );
    if (idx >= 0) {
      onRemoveAllergy(idx);
    } else {
      const newRaw = allergiesRaw.trim()
        ? allergiesRaw.trim() + "\n" + allergen.name + " — " + allergen.reaction
        : allergen.name + " — " + allergen.reaction;
      setAllergiesRaw(newRaw);
    }
  }, [parsedAllergies, allergiesRaw, setAllergiesRaw, onRemoveAllergy]);

  const importFromHpi = useCallback(() => {
    if (medsFromHpi?.length) {
      setMedsRaw(medsFromHpi.map(m =>
        [m.name, m.dose, m.route, m.frequency].filter(Boolean).join(" ")
      ).join("\n"));
    }
    if (allergiesFromHpi?.length) {
      setAllergiesRaw(allergiesFromHpi.map(a =>
        a.allergen + (a.reaction ? " — " + a.reaction : "")
      ).join("\n"));
    }
    setHpiImported(true);
    setExpanded(true);
  }, [medsFromHpi, allergiesFromHpi, setMedsRaw, setAllergiesRaw]);

  const copyAllergyList = useCallback(() => {
    if (!parsedAllergies?.length && !nkda) return;
    const text = nkda ? "Allergies: NKDA"
      : "Allergies: " + parsedAllergies.map(a =>
          `${a.allergen}${a.reaction ? " (" + a.reaction + ")" : ""}`
        ).join(", ");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAlert(true); setTimeout(() => setCopiedAlert(false), 2000);
    });
  }, [parsedAllergies, nkda]);

  const handleNKDA = () => {
    const next = !nkda;
    setNkda(next);
    if (next) {
      setAllergiesRaw("NKDA");
      parsedAllergies?.slice().reverse().forEach((_, i) => {
        onRemoveAllergy?.(parsedAllergies.length - 1 - i);
      });
    } else {
      setAllergiesRaw("");
    }
  };

  const clearAll = () => {
    setMedsRaw(""); setAllergiesRaw(""); setNkda(false);
    parsedMeds?.slice().reverse().forEach((_, i) => onRemoveMed?.(parsedMeds.length - 1 - i));
    parsedAllergies?.slice().reverse().forEach((_, i) => onRemoveAllergy?.(parsedAllergies.length - 1 - i));
  };

  const hpiAvailable = (medsFromHpi?.length > 0 || allergiesFromHpi?.length > 0) && !hpiImported;

  // ─── COLLAPSED ───────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div style={{ marginBottom: 10, borderRadius: 10,
        background: "rgba(8,22,40,.5)",
        border: `1px solid ${hasAny ? "rgba(59,158,255,.3)" : "rgba(42,79,122,.3)"}`,
        transition: "border-color .2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10,
          padding: "9px 14px", cursor: "pointer" }}
          onClick={() => setExpanded(true)}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
              color: hasAny ? "var(--qn-blue)" : "var(--qn-txt4)",
              letterSpacing: 1, textTransform: "uppercase" }}>
              Med Rec &amp; Allergy Review
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
              color: "rgba(107,158,200,.45)", letterSpacing: .3, marginTop: 2 }}>
              AI structures for dosing safety checks
            </div>
          </div>

          {hasAny && (
            <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
              {hasMeds && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: "var(--qn-blue)", background: "rgba(59,158,255,.1)",
                  border: "1px solid rgba(59,158,255,.25)", borderRadius: 4, padding: "2px 8px" }}>
                  {parsedMeds.length} med{parsedMeds.length !== 1 ? "s" : ""}
                </span>
              )}
              {nkda && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: "var(--qn-green)", background: "rgba(61,255,160,.1)",
                  border: "1px solid rgba(61,255,160,.3)", borderRadius: 4, padding: "2px 8px" }}>NKDA</span>
              )}
              {!nkda && hasAllergies && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: "var(--qn-coral)", background: "rgba(255,107,107,.1)",
                  border: "1px solid rgba(255,107,107,.3)", borderRadius: 4, padding: "2px 8px" }}>
                  ⚠ {parsedAllergies.length} allerg{parsedAllergies.length !== 1 ? "ies" : "y"}
                </span>
              )}
              {!hasMeds && !hasAllergies && medsRaw.trim() && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
                  color: "var(--qn-gold)", background: "rgba(245,200,66,.1)",
                  border: "1px solid rgba(245,200,66,.25)", borderRadius: 4, padding: "2px 7px" }}>
                  Unparsed
                </span>
              )}
            </div>
          )}

          {hpiAvailable && (
            <button onClick={e => { e.stopPropagation(); importFromHpi(); }}
              style={{ padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
                border: "1px solid rgba(0,229,192,.4)", background: "rgba(0,229,192,.08)",
                color: "var(--qn-teal)", letterSpacing: .4, flexShrink: 0 }}>
              ↓ Import from HPI
            </button>
          )}

          {!hasAny && !hpiAvailable && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
              color: "rgba(42,79,122,.5)", fontStyle: "italic" }}>Not entered — tap to expand</span>
          )}

          <span style={{ color: "var(--qn-txt4)", fontSize: 11, flexShrink: 0 }}>▼</span>
        </div>
      </div>
    );
  }

  // ─── EXPANDED ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 10, borderRadius: 10,
      background: "rgba(8,22,40,.55)", border: "1px solid rgba(59,158,255,.35)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
        borderBottom: "1px solid rgba(42,79,122,.3)", cursor: "pointer" }}
        onClick={() => setExpanded(false)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
            color: "var(--qn-blue)", letterSpacing: 1, textTransform: "uppercase" }}>
            Med Rec &amp; Allergy Review
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
            color: "rgba(107,158,200,.45)", letterSpacing: .3, marginTop: 2 }}>
            AI structures for dosing safety checks · click to collapse
          </div>
        </div>
        {hpiAvailable && (
          <button onClick={e => { e.stopPropagation(); importFromHpi(); }}
            style={{ padding: "4px 12px", borderRadius: 7, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
              border: "1px solid rgba(0,229,192,.45)", background: "rgba(0,229,192,.1)",
              color: "var(--qn-teal)", transition: "all .15s" }}>
            ↓ Import from HPI
          </button>
        )}
        {hpiImported && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
            color: "var(--qn-teal)", background: "rgba(0,229,192,.1)",
            border: "1px solid rgba(0,229,192,.25)", borderRadius: 4, padding: "2px 8px" }}>
            ✓ HPI imported
          </span>
        )}
        <span style={{ color: "var(--qn-txt4)", fontSize: 11, flexShrink: 0 }}>▲</span>
      </div>

      <div style={{ padding: "12px 14px" }}>

        {/* ── Allergies (safety-first) ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
            color: "var(--qn-coral)", letterSpacing: 1, textTransform: "uppercase",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠ Allergies
            {(parsedAllergies?.length > 0 || nkda) && (
              <button onClick={copyAllergyList}
                style={{ padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fontWeight: 700,
                  border: `1px solid ${copiedAlert ? "rgba(61,255,160,.5)" : "rgba(255,107,107,.3)"}`,
                  background: copiedAlert ? "rgba(61,255,160,.1)" : "transparent",
                  color: copiedAlert ? "var(--qn-green)" : "rgba(255,107,107,.6)" }}>
                {copiedAlert ? "✓ Copied" : "Copy"}
              </button>
            )}
          </div>

          {/* NKDA button */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <button onClick={handleNKDA}
              style={{ padding: "5px 16px", borderRadius: 7, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                letterSpacing: .3, transition: "all .15s",
                border: `1px solid ${nkda ? "rgba(61,255,160,.6)" : "rgba(61,255,160,.35)"}`,
                background: nkda ? "rgba(61,255,160,.15)" : "rgba(61,255,160,.06)",
                color: nkda ? "var(--qn-green)" : "rgba(61,255,160,.7)",
                boxShadow: nkda ? "0 0 10px rgba(61,255,160,.15)" : "none" }}>
              {nkda ? "✓ NKDA" : "NKDA"}
            </button>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
              color: "rgba(107,158,200,.4)", alignSelf: "center" }}>
              — or tap allergens below
            </span>
          </div>

          {/* Common allergen chips */}
          {!nkda && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {COMMON_ALLERGENS.map(allergen => {
                const active = parsedAllergies?.some(
                  a => a.allergen?.toLowerCase() === allergen.name.toLowerCase()
                );
                return (
                  <button key={allergen.name} onClick={() => handleAllergenChip(allergen)}
                    title={allergen.reaction} style={{ ...CHIP(active) }}>
                    {active && "✓ "}{allergen.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Parsed allergies */}
          {!nkda && parsedAllergies?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {parsedAllergies.map((a, i) => (
                <AllergyRow key={i} allergy={a} idx={i} onEdit={onEditAllergy} onRemove={onRemoveAllergy} />
              ))}
            </div>
          )}

          {/* Raw allergy textarea — only when no parsed results */}
          {!nkda && !parsedAllergies?.length && (
            <textarea
              rows={2} value={allergiesRaw}
              onChange={e => setAllergiesRaw(e.target.value)}
              placeholder="Or type / paste allergy list here…"
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical",
                padding: "8px 10px", borderRadius: 7,
                background: "rgba(14,37,68,.5)", border: "1px solid rgba(255,107,107,.3)",
                color: "var(--qn-txt)", fontFamily: "'DM Sans',sans-serif",
                fontSize: 12, lineHeight: 1.5, outline: "none", transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,107,107,.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,107,107,.3)"}
            />
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(42,79,122,.3)", marginBottom: 14 }} />

        {/* ── Medications ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
            color: "var(--qn-blue)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            Current Medications
          </div>

          {parsedMeds?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {parsedMeds.map((m, i) => (
                <MedRow key={i} med={m} idx={i} onEdit={onEditMed} onRemove={onRemoveMed} />
              ))}
              <button
                onClick={() => onEditMed?.(parsedMeds.length, "name", "")}
                style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
                  border: "1px solid rgba(59,158,255,.3)", background: "transparent",
                  color: "var(--qn-blue)", letterSpacing: .4, alignSelf: "flex-start", marginTop: 2 }}>
                + Add medication
              </button>
            </div>
          )}

          <textarea
            rows={parsedMeds?.length ? 2 : 4}
            value={medsRaw}
            onChange={e => setMedsRaw(e.target.value)}
            placeholder={parsedMeds?.length
              ? "Paste additional meds to add…"
              : "Paste full med rec here — AI separates medications and allergies automatically…\n\nExample: Metoprolol 25mg PO daily, Lisinopril 10mg PO daily\nAllergies: Penicillin (rash), Sulfa (anaphylaxis)"}
            style={{ width: "100%", boxSizing: "border-box", resize: "vertical",
              padding: "8px 10px", borderRadius: 7,
              background: "rgba(14,37,68,.5)", border: "1px solid rgba(42,79,122,.4)",
              color: "var(--qn-txt)", fontFamily: "'DM Sans',sans-serif",
              fontSize: 12, lineHeight: 1.55, outline: "none", transition: "border-color .15s" }}
            onFocus={e => e.target.style.borderColor = "rgba(59,158,255,.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(42,79,122,.4)"}
          />

          {parseError && (
            <div style={{ padding: "5px 10px", borderRadius: 6, marginTop: 6,
              background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.3)",
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--qn-coral)" }}>
              {parseError}
            </div>
          )}
        </div>

        {/* ── Action row ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={onParse}
            disabled={parsing || (!medsRaw.trim() && !allergiesRaw.trim())}
            style={{ padding: "6px 16px", borderRadius: 8, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12,
              transition: "all .15s",
              border: `1px solid ${parsing ? "rgba(42,79,122,.3)" : "rgba(59,158,255,.5)"}`,
              background: parsing ? "rgba(14,37,68,.4)" : "rgba(59,158,255,.12)",
              color: parsing ? "var(--qn-txt4)" : "var(--qn-blue)",
              opacity: (!medsRaw.trim() && !allergiesRaw.trim()) ? .4 : 1 }}>
            {parsing ? "● Parsing…" : parsedMeds?.length ? "↻ Re-parse" : "✦ Parse Med Rec"}
          </button>

          {(hasMeds || hasAllergies || medsRaw.trim()) && (
            <button onClick={clearAll}
              style={{ padding: "6px 12px", borderRadius: 7, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
                border: "1px solid rgba(42,79,122,.4)", background: "transparent",
                color: "var(--qn-txt4)", letterSpacing: .4 }}>
              Clear all
            </button>
          )}

          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
            color: "rgba(107,158,200,.45)", marginLeft: "auto" }}>
            {parsedMeds?.length > 0 || hasAllergies
              ? `${parsedMeds?.length || 0} med${parsedMeds?.length !== 1 ? "s" : ""} · ${nkda ? "NKDA" : `${parsedAllergies?.length || 0} allerg${parsedAllergies?.length !== 1 ? "ies" : "y"}`} · click rows to edit`
              : "Paste above and click Parse — or use chips for common allergens"}
          </span>
        </div>
      </div>
    </div>
  );
}