// QuickNoteMDMPhrases.jsx  v11.5
// 48 clinical decision phrases across 10 categories
// Auto-suggests category from working diagnosis · full-text search
// Export: MDMPhraseLibrary

import React, { useState } from "react";

const MDM_PHRASES = {
  "Cardiac Risk": [
    { text:"Low-risk by HEART score (score ≤3); no further troponin indicated per pathway.", tool:"HEART" },
    { text:"Moderate-risk by HEART score (score 4–6); serial troponins and observation indicated.", tool:"HEART" },
    { text:"High-risk by HEART score (score ≥7); cardiology consultation warranted.", tool:"HEART" },
    { text:"TIMI score 0–1; low 30-day MACE risk supports discharge with close follow-up.", tool:"TIMI" },
    { text:"Troponin delta <0.04 ng/mL at 3h; ACS excluded per 0/3h high-sensitivity protocol.", tool:"Troponin" },
    { text:"EKG without ischemic changes; no ST elevation, depression, or T-wave inversions noted.", tool:"EKG" },
  ],
  "Head & Neuro": [
    { text:"Canadian CT Head Rule criteria not met; CT head not indicated for this low-risk presentation.", tool:"CCHR" },
    { text:"Canadian CT Head Rule criteria met; CT head obtained.", tool:"CCHR" },
    { text:"PECARN criteria — low-risk; CT head deferred per shared decision-making with family.", tool:"PECARN" },
    { text:"Ottawa SAH Rule: no high-risk features for subarachnoid hemorrhage on history and exam.", tool:"Ottawa SAH" },
    { text:"No focal neurologic deficits on exam; GCS 15; NIHSS 0.", tool:"Neuro Exam" },
    { text:"ABCD2 score calculated; low-risk TIA; outpatient neurology follow-up within 24h arranged.", tool:"ABCD2" },
  ],
  "Cervical Spine": [
    { text:"Canadian C-Spine Rule criteria met for imaging; CT cervical spine obtained.", tool:"CCR" },
    { text:"Canadian C-Spine Rule: low-risk criteria met; cervical spine clinically cleared without imaging.", tool:"CCR" },
    { text:"NEXUS criteria met for clinical clearance; no cervical spine imaging indicated.", tool:"NEXUS" },
    { text:"Cervical spine precautions maintained pending formal clearance.", tool:"C-Spine" },
  ],
  "Pulmonary / PE": [
    { text:"Wells score ≤4 (low probability); D-dimer obtained per PERC-negative pre-screening.", tool:"Wells" },
    { text:"PERC rule negative; PE excluded clinically without D-dimer or imaging.", tool:"PERC" },
    { text:"Wells score >4 (moderate-high probability); CT pulmonary angiography obtained.", tool:"Wells" },
    { text:"Age-adjusted D-dimer negative; PE excluded per validated threshold.", tool:"D-dimer" },
  ],
  "Orthopedic": [
    { text:"Ottawa Ankle Rules negative; no fracture expected; radiograph not indicated.", tool:"Ottawa Ankle" },
    { text:"Ottawa Ankle Rules positive; ankle radiographs obtained.", tool:"Ottawa Ankle" },
    { text:"Ottawa Foot Rules negative; foot radiograph deferred.", tool:"Ottawa Foot" },
    { text:"Ottawa Knee Rule negative; knee radiograph not indicated.", tool:"Ottawa Knee" },
    { text:"Pittsburgh Knee Rules applied; radiograph obtained.", tool:"Pittsburgh" },
  ],
  "Infectious / Sepsis": [
    { text:"qSOFA score ≥2; sepsis workup initiated per Surviving Sepsis Campaign guidelines.", tool:"qSOFA" },
    { text:"3-hour SEP-1 bundle initiated: blood cultures ×2, broad-spectrum antibiotics, lactate.", tool:"SEP-1" },
    { text:"CURB-65 score calculated; outpatient CAP treatment appropriate.", tool:"CURB-65" },
    { text:"CURB-65 score ≥3; inpatient admission for community-acquired pneumonia indicated.", tool:"CURB-65" },
    { text:"LRINEC score <6; low risk for necrotizing fasciitis; close monitoring and reassessment.", tool:"LRINEC" },
  ],
  "Abdominal": [
    { text:"Alvarado score calculated; low risk for appendicitis; CT abdomen obtained for clarification.", tool:"Alvarado" },
    { text:"STONE score low risk for ureteral calculus; alternative diagnosis considered.", tool:"STONE" },
    { text:"Rectal exam and pelvic exam performed; peritoneal signs absent.", tool:"Exam" },
    { text:"Beta-hCG negative; ectopic pregnancy excluded.", tool:"Pregnancy" },
    { text:"Point-of-care ultrasound performed; no free fluid; gallbladder without acute findings.", tool:"POCUS" },
  ],
  "Syncope": [
    { text:"ROSE rule applied; low-risk syncope; safe for discharge with outpatient workup.", tool:"ROSE" },
    { text:"San Francisco Syncope Rule: no high-risk features identified.", tool:"SFSR" },
    { text:"Orthostatic vitals obtained; positive orthostatic hypotension — >20 mmHg SBP drop.", tool:"Orthostatics" },
    { text:"Orthostatic vitals negative; vasovagal or situational syncope most consistent.", tool:"Orthostatics" },
  ],
  "Toxicology": [
    { text:"Acetaminophen level below treatment threshold per Rumack-Matthew nomogram.", tool:"Rumack-Matthew" },
    { text:"Poison Control consulted; no antidote indicated at current ingested dose.", tool:"Poison Control" },
    { text:"QTc prolongation noted; QT-prolonging agents held; cardiology notified.", tool:"QTc" },
  ],
  "General MDM": [
    { text:"Shared decision-making discussion held with patient regarding risks and benefits of discharge.", tool:"SDM" },
    { text:"Return precautions discussed and documented; patient verbalized understanding.", tool:"Discharge" },
    { text:"High-complexity MDM: multiple chronic conditions with acute exacerbation posing threat to life.", tool:"MDM" },
    { text:"Independent interpretation of diagnostic results performed by treating physician.", tool:"MDM" },
    { text:"Discussion with consulting physician documented as part of MDM data complexity.", tool:"MDM" },
    { text:"Prescription drug management initiated, constituting moderate risk per CMS 2023 guidelines.", tool:"MDM" },
  ],
};

const CAT_STYLE = {
  "Cardiac Risk":        { color:"var(--qn-coral)",  border:"rgba(255,107,107,.35)", bg:"rgba(255,107,107,.07)" },
  "Head & Neuro":        { color:"var(--qn-purple)", border:"rgba(155,109,255,.35)", bg:"rgba(155,109,255,.07)" },
  "Cervical Spine":      { color:"var(--qn-gold)",   border:"rgba(245,200,66,.35)",  bg:"rgba(245,200,66,.07)"  },
  "Pulmonary / PE":      { color:"var(--qn-blue)",   border:"rgba(59,158,255,.35)",  bg:"rgba(59,158,255,.07)"  },
  "Orthopedic":          { color:"var(--qn-teal)",   border:"rgba(0,229,192,.35)",   bg:"rgba(0,229,192,.07)"   },
  "Infectious / Sepsis": { color:"var(--qn-coral)",  border:"rgba(255,107,107,.35)", bg:"rgba(255,107,107,.07)" },
  "Abdominal":           { color:"var(--qn-gold)",   border:"rgba(245,200,66,.35)",  bg:"rgba(245,200,66,.07)"  },
  "Syncope":             { color:"var(--qn-blue)",   border:"rgba(59,158,255,.35)",  bg:"rgba(59,158,255,.07)"  },
  "Toxicology":          { color:"var(--qn-purple)", border:"rgba(155,109,255,.35)", bg:"rgba(155,109,255,.07)" },
  "General MDM":         { color:"var(--qn-teal)",   border:"rgba(0,229,192,.35)",   bg:"rgba(0,229,192,.07)"   },
};

function suggestCategory(dx) {
  if (!dx) return null;
  const d = dx.toLowerCase();
  if (d.match(/acs|chest|troponin|stemi|nstemi|angina|cardiac|coronary/)) return "Cardiac Risk";
  if (d.match(/head|neuro|stroke|tia|cva|hemorrhage|headache/))           return "Head & Neuro";
  if (d.match(/\bpe\b|pulmonary embolism|dvt/))                           return "Pulmonary / PE";
  if (d.match(/fracture|ankle|knee|ortho|sprain|disloc/))                 return "Orthopedic";
  if (d.match(/sepsis|pneumonia|infection|cellulitis|uti|bacteremia/))    return "Infectious / Sepsis";
  if (d.match(/abdomen|appendic|cholecystitis|pancreatitis|gallbladder/)) return "Abdominal";
  if (d.match(/syncope|faint|presyncope/))                                return "Syncope";
  if (d.match(/tox|overdose|ingestion|poison/))                           return "Toxicology";
  if (d.match(/cervical|c.spine|neck/))                                   return "Cervical Spine";
  return null;
}

export function MDMPhraseLibrary({ onInsert, workingDx }) {
  const [open,           setOpen]          = useState(false);
  const [activeCategory, setActiveCategory]= useState(null);
  const [search,         setSearch]        = useState("");
  const [inserted,       setInserted]      = useState({});

  const suggested  = suggestCategory(workingDx);
  const displayCat = activeCategory || suggested || "General MDM";
  const categories = Object.keys(MDM_PHRASES);
  const total      = categories.reduce((s, c) => s + MDM_PHRASES[c].length, 0);

  const filteredPhrases = search.trim()
    ? categories.flatMap(cat =>
        MDM_PHRASES[cat]
          .filter(p => p.text.toLowerCase().includes(search.toLowerCase()) ||
                       p.tool.toLowerCase().includes(search.toLowerCase()))
          .map(p => ({ ...p, cat }))
      )
    : (MDM_PHRASES[displayCat] || []).map(p => ({ ...p, cat: displayCat }));

  const handleInsert = (phrase) => {
    onInsert(phrase.text);
    setInserted(prev => ({ ...prev, [phrase.text]: true }));
    setTimeout(() => setInserted(prev => { const n={...prev}; delete n[phrase.text]; return n; }), 3000);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      marginTop:8, padding:"4px 13px", borderRadius:7, cursor:"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
      letterSpacing:.5, border:"1px solid rgba(59,158,255,.35)",
      background:"rgba(59,158,255,.06)", color:"var(--qn-blue)",
      display:"inline-flex", alignItems:"center", gap:7, transition:"all .15s",
    }}>
      📋 MDM Phrase Library
      {suggested && (
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:CAT_STYLE[suggested]?.color||"var(--qn-teal)",
          background:CAT_STYLE[suggested]?.bg||"rgba(0,229,192,.08)",
          border:`1px solid ${CAT_STYLE[suggested]?.border||"rgba(0,229,192,.2)"}`,
          borderRadius:3, padding:"1px 6px",
        }}>✦ {suggested}</span>
      )}
    </button>
  );

  return (
    <div className="qn-fade" style={{
      marginTop:10, borderRadius:12, overflow:"hidden",
      background:"rgba(8,22,40,.65)", border:"1px solid rgba(59,158,255,.3)",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        borderBottom:"1px solid rgba(42,79,122,.3)", background:"rgba(59,158,255,.05)",
      }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:"var(--qn-blue)", flex:1 }}>
          MDM Phrase Library
        </span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search phrases or tools…"
          style={{ padding:"4px 10px", borderRadius:6, width:190,
            background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }}
          onFocus={e => e.target.style.borderColor="rgba(59,158,255,.6)"}
          onBlur={e => e.target.style.borderColor="rgba(42,79,122,.5)"} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"rgba(107,158,200,.4)" }}>
          {total} phrases
        </span>
        <button onClick={() => { setOpen(false); setSearch(""); }} style={{
          padding:"3px 8px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          border:"1px solid rgba(42,79,122,.35)", background:"transparent", color:"var(--qn-txt4)",
        }}>✕</button>
      </div>

      {!search.trim() && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"8px 14px 6px", borderBottom:"1px solid rgba(42,79,122,.2)" }}>
          {categories.map(cat => {
            const cs = CAT_STYLE[cat]||{ color:"var(--qn-txt3)", border:"rgba(42,79,122,.3)", bg:"rgba(42,79,122,.1)" };
            const isActive = cat === displayCat;
            const isSug    = cat === suggested && !activeCategory;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding:"3px 9px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                fontWeight:isActive?700:600, letterSpacing:.4, transition:"all .12s",
                border:`1px solid ${isActive?cs.border:"rgba(42,79,122,.3)"}`,
                background:isActive?cs.bg:"transparent",
                color:isActive?cs.color:isSug?cs.color:"var(--qn-txt4)", opacity:isActive?1:.8,
              }}>
                {isSug && "✦ "}{cat}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ padding:"8px 14px", display:"flex", flexDirection:"column", gap:5 }}>
        {filteredPhrases.length === 0 && (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", padding:"10px 0", textAlign:"center" }}>
            No phrases match "{search}"
          </div>
        )}
        {filteredPhrases.map((phrase, i) => {
          const cs = CAT_STYLE[phrase.cat]||CAT_STYLE["General MDM"];
          const wasInserted = !!inserted[phrase.text];
          return (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px",
              borderRadius:7, transition:"all .14s",
              background:wasInserted?"rgba(61,255,160,.06)":cs.bg,
              border:`1px solid ${wasInserted?"rgba(61,255,160,.35)":cs.border}`,
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                {search.trim() && (
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:cs.color, marginBottom:3 }}>
                    {phrase.cat}
                  </div>
                )}
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:wasInserted?"var(--qn-green)":"var(--qn-txt2)", lineHeight:1.6 }}>
                  {phrase.text}
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                  color:cs.color, background:cs.bg, border:`1px solid ${cs.border}`, borderRadius:3, padding:"1px 6px" }}>
                  {phrase.tool}
                </span>
                <button onClick={() => handleInsert(phrase)} style={{
                  padding:"3px 10px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  letterSpacing:.4, transition:"all .14s",
                  border:`1px solid ${wasInserted?"rgba(61,255,160,.5)":cs.border}`,
                  background:wasInserted?"rgba(61,255,160,.12)":cs.bg,
                  color:wasInserted?"var(--qn-green)":cs.color, whiteSpace:"nowrap",
                }}>
                  {wasInserted?"✓ Added":"→ Insert"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding:"6px 14px 10px", fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"rgba(107,158,200,.4)", letterSpacing:.4 }}>
        ACEP / ACC-AHA / Ottawa Rules · → Insert appends to MDM narrative
      </div>
    </div>
  );
}