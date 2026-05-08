// QuickNoteGuidelines.jsx — P2: Guideline-Grounded MDM Sentence Inserts
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// ── Static guideline seed map (dx keyword → relevant guidelines) ─────────────
const GUIDE_SEEDS = {
  "chest pain":          ["ACEP 2022 Chest Pain Guideline","HEART score","ACC/AHA 2021 Chest Pain"],
  "acs":                 ["ACC/AHA 2023 ACS","TIMI risk score","GRACE score","dual antiplatelet therapy"],
  "nstemi":              ["ACC/AHA 2023 NSTEMI/UA","TIMI score","GRACE score","early invasive strategy"],
  "stemi":               ["ACC/AHA door-to-balloon ≤90 min","TIMI STEMI","antiplatelet loading","fibrinolytic criteria"],
  "heart failure":       ["AHA/ACC 2022 HF","BNP/NT-proBNP threshold","diuresis protocol","LVEF assessment"],
  "afib":                ["CHA2DS2-VASc score","HAS-BLED score","AHA/ACC 2023 Afib","rate vs rhythm control"],
  "pe":                  ["PERC rule","Wells PE criteria","PESI score","YEARS algorithm","anticoagulation initiation"],
  "pulmonary embolism":  ["PERC rule","Wells PE criteria","PESI score","YEARS algorithm"],
  "pneumonia":           ["PSI/PORT score","CURB-65","IDSA/ATS 2019 CAP","antibiotic selection by severity"],
  "copd":                ["GOLD 2023 AECOPD","NIV indications","systemic steroid dosing","antibiotic criteria"],
  "asthma":              ["GINA 2023 exacerbation","NAEPP guidelines","systemic corticosteroid dosing"],
  "stroke":              ["AHA/ASA 2019 Acute Stroke","tPA eligibility NIHSS","door-to-needle ≤60 min","ASPECTS score"],
  "tia":                 ["ABCD2 score","AHA/ASA 2009 TIA","24-hour observation criteria","dual antiplatelet initiation"],
  "seizure":             ["AES/Epilepsy Foundation status epilepticus","first unprovoked seizure workup","AED initiation criteria"],
  "meningitis":          ["IDSA 2004 Bacterial Meningitis","LP versus empirical antibiotics","dexamethasone indication"],
  "appendicitis":        ["Alvarado score","Pediatric Appendicitis Score","CT vs MRI vs ultrasound","antibiotic dosing"],
  "cholecystitis":       ["Tokyo Guidelines 2018 TG18","severity grading I-III","early laparoscopic cholecystectomy criteria"],
  "pancreatitis":        ["Revised Atlanta 2012","BISAP score","SIRS criteria","nutrition timing per ACG"],
  "gi bleed":            ["Glasgow-Blatchford Score","Rockall score","PPI dosing","reversal agents for anticoagulation"],
  "sepsis":              ["Sepsis-3 criteria","qSOFA","SOFA score","Hour-1 Bundle","SEP-1 CMS compliance"],
  "septic shock":        ["Surviving Sepsis Campaign 2021","vasopressor selection MAP ≥65","corticosteroid criteria","fluid resuscitation"],
  "dka":                 ["ADA 2009 DKA criteria","insulin drip protocol","K+ replacement thresholds","bicarbonate criteria"],
  "hyperglycemia":       ["ADA inpatient glycemic targets 140-180","insulin correction scale","DKA vs HHS differentiation"],
  "hypertensive emergency":["JNC 8","ACC/AHA 2017 Hypertension","10-25% MAP reduction/hour","end-organ damage workup"],
  "anaphylaxis":         ["ACAAI/JACI 2015 anaphylaxis","epinephrine IM 0.3mg dosing","biphasic reaction observation 4-8h"],
  "overdose":            ["AACT/ToxBase guidelines","specific antidote criteria","Poison Control Center consultation"],
  "ectopic":             ["ACOG 2018 Ectopic Pregnancy","methotrexate eligibility criteria","surgical indications"],
};

function matchSeeds(dx) {
  if (!dx) return [];
  const lower = dx.toLowerCase();
  for (const [key, seeds] of Object.entries(GUIDE_SEEDS)) {
    if (lower.includes(key)) return seeds;
  }
  return [];
}

const CAT_STYLES = {
  "Risk Stratification": { bg:"rgba(59,158,255,.09)",  bd:"rgba(59,158,255,.35)",  txt:"var(--qn-blue)"   },
  "Workup Rationale":    { bg:"rgba(0,229,192,.07)",   bd:"rgba(0,229,192,.28)",   txt:"var(--qn-teal)"   },
  "Treatment":           { bg:"rgba(61,255,160,.07)",  bd:"rgba(61,255,160,.28)",  txt:"var(--qn-green)"  },
  "Disposition":         { bg:"rgba(245,200,66,.08)",  bd:"rgba(245,200,66,.35)",  txt:"var(--qn-gold)"   },
  "Monitoring":          { bg:"rgba(155,109,255,.08)", bd:"rgba(155,109,255,.3)",  txt:"var(--qn-purple)" },
};
const getCat = cat => CAT_STYLES[cat] || CAT_STYLES["Workup Rationale"];

// ── Main component ─────────────────────────────────────────────────────────
export function GuidelineAssist({ workingDx, mdmNarrative, onInsertSentence }) {
  const [open,      setOpen]      = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [sentences, setSentences] = useState([]);
  const [inserted,  setInserted]  = useState({});

  const seeds = matchSeeds(workingDx);

  useEffect(() => {
    setSentences([]);
    setInserted({});
    setOpen(false);
  }, [workingDx]);

  const generate = async () => {
    if (!workingDx || busy) return;
    setBusy(true);
    try {
      const schema = {
        type:"object", required:["sentences"],
        properties:{
          sentences:{
            type:"array",
            items:{
              type:"object",
              required:["text","guideline","category"],
              properties:{
                text:      { type:"string" },
                guideline: { type:"string" },
                category:  { type:"string",
                  enum:["Risk Stratification","Workup Rationale","Treatment","Disposition","Monitoring"] },
              },
            },
          },
        },
      };
      const seedHint = seeds.length ? `\nRelevant guidelines: ${seeds.join(", ")}` : "";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are an ED physician documentation expert. Generate 6 guideline-grounded MDM sentence inserts for the following working diagnosis.

WORKING DIAGNOSIS: ${workingDx}
EXISTING MDM: ${mdmNarrative?.slice(0,400)||"(not yet written)"}${seedHint}

Generate exactly 6 sentences. Each must:
- Be first-person, past-tense, EMR-ready (40–75 words each)
- Reference a specific guideline, risk score, or evidence-based criteria by name
- Cover these categories (one sentence per category): Risk Stratification, Workup Rationale, Treatment, Disposition, Monitoring, and one additional from whichever best fits
- Be complete standalone sentences appropriate for direct EMR paste

Return category as one of: "Risk Stratification", "Workup Rationale", "Treatment", "Disposition", "Monitoring"`,
        response_json_schema: schema,
      });
      setSentences(res?.sentences || []);
      setOpen(true);
    } catch(e) { console.error("Guideline assist failed:", e); }
    finally { setBusy(false); }
  };

  const insert = (s, i) => {
    onInsertSentence?.(s.text);
    setInserted(p => ({ ...p, [i]:true }));
  };

  if (!workingDx) return null;

  return (
    <div style={{
      marginBottom:10, borderRadius:12, overflow:"hidden",
      border:"1px solid rgba(59,158,255,.22)",
      background:"rgba(59,158,255,.025)",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
        borderBottom: open && sentences.length ? "1px solid rgba(59,158,255,.14)" : "none",
      }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"var(--qn-blue)" }}>
          Guideline Assist
        </span>
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
          background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.2)",
          borderRadius:4, padding:"2px 7px",
        }}>
          {workingDx}
        </span>
        {seeds.length > 0 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-txt4)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {seeds.slice(0,3).join(" · ")}{seeds.length > 3 ? ` +${seeds.length-3}` : ""}
          </span>
        )}
        <div style={{ flex:1 }} />
        {sentences.length > 0 && (
          <button onClick={() => setOpen(p => !p)} style={{
            padding:"3px 9px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            border:"1px solid rgba(59,158,255,.3)", background:"transparent",
            color:"var(--qn-txt4)", transition:"all .14s",
          }}>
            {open ? "▲ Collapse" : "▼ Show"}
          </button>
        )}
        <button onClick={generate} disabled={busy} style={{
          padding:"5px 14px", borderRadius:7, cursor:busy?"not-allowed":"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:.5,
          border:`1px solid ${busy?"rgba(42,79,122,.3)":"rgba(59,158,255,.45)"}`,
          background:busy?"rgba(14,37,68,.4)":"rgba(59,158,255,.1)",
          color:busy?"var(--qn-txt4)":"var(--qn-blue)", transition:"all .14s",
        }}>
          {busy ? "● Generating…" : sentences.length ? "↺ Regenerate" : "✦ Generate Guideline Inserts"}
        </button>
      </div>

      {open && sentences.length > 0 && (
        <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase" }}>
            Click ↓ Insert to append sentence to MDM narrative
          </div>
          {sentences.map((s, i) => {
            const c = getCat(s.category);
            const done = inserted[i];
            return (
              <div key={i} style={{
                borderRadius:8, padding:"9px 12px",
                background: done ? "rgba(61,255,160,.07)" : c.bg,
                border:`1px solid ${done ? "rgba(61,255,160,.4)" : c.bd}`,
                transition:"all .15s",
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{
                      fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                      letterSpacing:.8, textTransform:"uppercase",
                      color: done ? "var(--qn-green)" : c.txt, marginBottom:4,
                    }}>
                      {s.category} · {s.guideline}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt1)", lineHeight:1.55 }}>
                      {s.text}
                    </div>
                  </div>
                  <button
                    onClick={() => insert(s, i)}
                    disabled={done}
                    style={{
                      flexShrink:0, padding:"4px 12px", borderRadius:7, cursor:done?"default":"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                      border:`1px solid ${done?"rgba(61,255,160,.4)":c.bd}`,
                      background:done?"rgba(61,255,160,.1)":c.bg,
                      color:done?"var(--qn-green)":c.txt, transition:"all .14s",
                    }}>
                    {done ? "✓ Inserted" : "↓ Insert"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}