// ChestPainDDx.jsx — Notrya ChestPainHub
// Differential diagnosis calculators and reference panels
// Wells PE + PERC + sPESI + PE Treatment + ADD-RS + Pericarditis + Pneumothorax + Boerhaave
// Constraints: no form, no localStorage, straight quotes only, single react import

import { useState } from "react";
import {
  T, FF, WELLS_ITEMS, PERC_ITEMS, wellsInterp, ADDRS_ITEMS, addrsInterp,
  DDX_REF, DDX_TABS, SPESI_ITEMS, spesiInterp,
} from "./ChestPainLogic";
import { Bul, InfoBox, CheckRow } from "./ChestPainCalculators";


// ═══ MASSIVE PE CHECKLIST ═════════════════════════════════════════════════

function MassivePEPanel() {
  const [items, setItems] = useState({});
  const steps = [
    "Activate massive PE response team (if available)",
    "UFH 80 units/kg IV bolus → 18 units/kg/hr infusion — start immediately",
    "Systemic thrombolysis: alteplase 100 mg IV over 2h (or 50 mg bolus during arrest)",
    "Norepinephrine for hypotension — avoid aggressive fluids",
    "Bedside echo: RV dilation, septal shift (D-sign), McConnell sign",
    "CTA-PE if hemodynamically stable enough — otherwise treat empirically",
    "Consider surgical embolectomy or catheter embolectomy if lysis fails/contraindicated",
    "Fibrinolysis checklist completed (absolute CIs ruled out)",
  ];
  const allDone = steps.every((_, i) => items[i]);
  return (
    <div style={{ marginTop:10, padding:"12px 13px", borderRadius:10,
      background:`${allDone ? T.teal : T.coral}0a`, border:`1px solid ${allDone ? T.teal : T.coral}33` }}>
      <div style={{ fontFamily:FF.mono, fontSize:10, color:allDone ? T.teal : T.coral,
        letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>
        Massive PE Checklist
      </div>
      {steps.map((step, i) => (
        <button key={i} onClick={() => setItems(p => ({ ...p, [i]:!p[i] }))}
          style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
            padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:5,
            border:`1px solid ${items[i] ? T.teal+"55" : "rgba(35,70,115,0.65)"}`,
            background:items[i] ? "rgba(0,229,192,0.07)" : "transparent" }}>
          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
            border:`2px solid ${items[i] ? T.teal : "rgba(42,79,122,0.55)"}`,
            background:items[i] ? T.teal : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {items[i] && <span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ fontFamily:FF.sans, fontSize:11, color:items[i] ? T.teal : T.txt2, flex:1, textAlign:"left" }}>{step}</span>
        </button>
      ))}
      {allDone && (
        <div style={{ marginTop:6, padding:"6px 10px", borderRadius:7,
          background:"rgba(0,229,192,0.12)", border:"1px solid rgba(0,229,192,0.4)",
          fontFamily:FF.sans, fontSize:11, fontWeight:700, color:T.teal }}>
          ✓ All massive PE steps completed
        </div>
      )}
    </div>
  );
}

// ═══ REF SECTION ══════════════════════════════════════════════════════════

export function RefSection({ data }) {
  return (
    <>
      <InfoBox color={data.color}>
        <div style={{ fontFamily:FF.sans, fontSize:11, color:data.introAlert?T.coral:T.txt3, fontWeight:data.introAlert?600:400, lineHeight:1.6 }}>{data.intro}</div>
      </InfoBox>
      {data.sections.map((sect,i) => (
        <div key={i} style={{ marginBottom:10 }}>
          <div style={{ fontFamily:FF.mono, fontSize:10, color:sect.c, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{sect.label}</div>
          {sect.items.map((item,j) => <Bul key={j} c={sect.c}>{item}</Bul>)}
        </div>
      ))}
    </>
  );
}

// ═══ DIFFERENTIALS TAB ════════════════════════════════════════════════════

export function DifferentialsTab({ ddxSub,setDdxSub,wells,setWells,perc,setPerc,addrs,setAddrs,hr,sbp,spesi,setSpesi }) {
  const wellsScore       = WELLS_ITEMS.reduce((s,i) => s + (wells[i.key] ? i.pts : 0), 0);
  const wellsInterResult = wellsInterp(wellsScore);
  const percAllMet       = PERC_ITEMS.every(i => perc[i.key]);
  const addrsScore       = ADDRS_ITEMS.reduce((s,i) => s + (addrs[i.key] ? 1 : 0), 0);
  const addrsResult      = addrsInterp(addrsScore);

  return (
    <div className="cph-fade">
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {DDX_TABS.map(t => (
          <button key={t.id} onClick={() => setDdxSub(t.id)}
            style={{ padding:"5px 11px", borderRadius:7, cursor:"pointer",
              fontFamily:FF.sans, fontWeight:600, fontSize:11,
              border:`1px solid ${ddxSub===t.id ? t.color+"66" : "rgba(35,70,115,0.68)"}`,
              background:ddxSub===t.id ? `${t.color}14` : "transparent", color:ddxSub===t.id ? t.color : T.txt4 }}>
            {t.label}
          </button>
        ))}
      </div>

      {ddxSub === "pe" && (
        <div>
          <InfoBox color={T.blue} title="Wells Criteria for PE">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Pre-test probability score. Apply PERC if low risk (Wells ≤ 1) in low-prevalence setting.
            </div>
          </InfoBox>
          {WELLS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} pts={it.pts} checked={!!wells[it.key]}
              color={T.blue} onChange={() => setWells(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${wellsInterResult.color}0c`, border:`1px solid ${wellsInterResult.color}44` }}>
            <div>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:wellsInterResult.color }}>{wellsInterResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5, maxWidth:280 }}>{wellsInterResult.sub}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:FF.mono, fontSize:32, fontWeight:900, color:wellsInterResult.color, lineHeight:1 }}>{wellsScore.toFixed(1)}</div>
              <div style={{ fontFamily:FF.mono, fontSize:10, color:wellsInterResult.color, letterSpacing:1 }}>{wellsInterResult.action}</div>
            </div>
          </div>
          {wellsScore <= 1 && (
            <>
              <div style={{ fontFamily:FF.mono, fontSize:10, color:T.teal,
                letterSpacing:1.5, textTransform:"uppercase", margin:"10px 0 6px" }}>
                PERC Rule — all 8 must be met to exclude PE
              </div>
              {PERC_ITEMS.map(it => (
                <CheckRow key={it.key} label={it.label} checked={!!perc[it.key]}
                  color={T.teal} onChange={() => setPerc(p => ({ ...p, [it.key]:!p[it.key] }))} />
              ))}
              {percAllMet && (
                <InfoBox color={T.teal} icon="✓" title="PERC Negative — PE Excluded">
                  <div style={{ fontFamily:FF.sans, fontSize:11, color:T.teal, lineHeight:1.5 }}>
                    All 8 PERC criteria met + Wells ≤ 1 — PE safely excluded without D-dimer or imaging.
                  </div>
                </InfoBox>
              )}
            </>
          )}
          <button onClick={() => { setWells({}); setPerc({}); }}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(35,70,115,0.72)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>

          {/* sPESI */}
          <div style={{ marginTop:14, padding:"12px 13px", borderRadius:10,
            background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.68)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2,
              textTransform:"uppercase", marginBottom:8 }}>
              sPESI
              <span style={{ fontFamily:FF.sans, color:T.txt3, fontWeight:400, fontSize:11,
                textTransform:"none", letterSpacing:0, marginLeft:4 }}>PE severity once diagnosed</span>
            </div>
            {SPESI_ITEMS.map(it => {
              const autoVal=(it.key==="sp_hr"&&parseInt(hr)>=110)||(it.key==="sp_sbp"&&parseInt(sbp)<100&&parseInt(sbp)>0);
              const checked=!!(spesi&&spesi[it.key])||autoVal;
              return (
                <button key={it.key} onClick={()=>setSpesi&&setSpesi(p=>({...p,[it.key]:!p[it.key]}))}
                  style={{ display:"flex", alignItems:"center", gap:9, width:"100%",
                    padding:"7px 10px", borderRadius:8, cursor:"pointer", marginBottom:5,
                    border:`1px solid ${checked?T.blue+"55":"rgba(35,70,115,0.65)"}`,
                    background:checked?"rgba(59,158,255,0.08)":"transparent" }}>
                  <div style={{ width:18, height:18, borderRadius:4, flexShrink:0,
                    border:`2px solid ${checked?T.blue:"rgba(42,79,122,0.55)"}`,
                    background:checked?T.blue:"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {checked&&<span style={{ color:"#050f1e", fontSize:11, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:FF.sans, fontSize:12, color:T.txt2, flex:1 }}>{it.label}</span>
                  {autoVal&&<span style={{ fontFamily:FF.mono, fontSize:10, color:T.orange }}>auto</span>}
                </button>
              );
            })}
            {(()=>{
              const score=SPESI_ITEMS.reduce((s,i)=>{
                const auto=(i.key==="sp_hr"&&parseInt(hr)>=110)||(i.key==="sp_sbp"&&parseInt(sbp)<100&&parseInt(sbp)>0);
                return s+((spesi&&spesi[i.key])||auto?1:0);
              },0);
              const r=spesiInterp(score);
              return (
                <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
                  background:`${r.color}0a`, border:`1px solid ${r.color}33` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:14, color:r.color }}>{r.label}</div>
                    <div style={{ fontFamily:FF.mono, fontSize:24, fontWeight:900, color:r.color }}>{score}/6</div>
                  </div>
                  <div style={{ fontFamily:FF.mono, fontSize:10, color:r.color, marginBottom:2 }}>30-day mortality: {r.mortality}</div>
                  <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt2, lineHeight:1.5 }}>{r.rec}</div>
                </div>
              );
            })()}
          </div>

          {/* PE Treatment Pathway */}
          <div style={{ marginTop:14, padding:"12px 13px", borderRadius:10,
            background:"rgba(14,28,58,0.94)", border:"1px solid rgba(35,70,115,0.68)" }}>
            <div style={{ fontFamily:FF.mono, fontSize:10, color:T.blue, letterSpacing:1.2,
              textTransform:"uppercase", marginBottom:8 }}>
              PE Treatment Algorithm
              <span style={{ fontFamily:FF.sans, color:T.txt3, fontWeight:400, fontSize:11,
                textTransform:"none", letterSpacing:0, marginLeft:4 }}>once diagnosis confirmed</span>
            </div>
            {[
              { color:T.coral, label:"Massive PE (High-Risk) — SBP < 90 mmHg", steps:[
                "UFH 80 units/kg IV bolus → 18 units/kg/hr — anticoagulate immediately",
                "Systemic thrombolysis if no CIs: alteplase 100 mg IV over 2h (FDA-approved)",
                "Arrest protocol: alteplase 50 mg IV bolus during CPR",
                "Surgical embolectomy or catheter-directed therapy if lysis fails or contraindicated",
                "Norepinephrine first-line vasopressor — avoid aggressive fluids (worsens RV dilation)",
                "Use Massive PE checklist below for full checklist",
              ]},
              { color:T.orange, label:"Submassive PE — sPESI ≥ 1, RV dysfunction", steps:[
                "LMWH preferred: enoxaparin 1 mg/kg SQ q12h (reduce to q24h if CrCl < 30)",
                "UFH if: hemodynamically borderline, renal failure, or may need urgent procedure",
                "Catheter-directed thrombolysis (CDT): consider if worsening despite anticoagulation",
                "Monitor closely q4h first 24h for hemodynamic deterioration",
                "DOAC (rivaroxaban, apixaban) if stable, no active cancer, renal function adequate",
              ]},
              { color:T.teal, label:"Low-Risk PE — sPESI = 0", steps:[
                "DOAC first-line: rivaroxaban 15 mg BID × 21d → 20 mg daily (Class 1, 2019 ESC/ACC)",
                "Apixaban 10 mg BID × 7d → 5 mg BID — good option if CrCl 25–50",
                "Outpatient treatment safe: sPESI = 0, SpO2 ≥ 90%, reliable follow-up, no social barriers",
                "Duration: unprovoked ≥ 3 months then reassess; provoked = 3 months",
                "Avoid DOACs in: antiphospholipid syndrome, active cancer (prefer LMWH or rivaroxaban per CARAVAGGIO)",
              ]},
            ].map((sect, i) => (
              <div key={i} style={{ marginBottom:7, padding:"8px 11px", borderRadius:8,
                background:`${sect.color}09`, borderLeft:`3px solid ${sect.color}` }}>
                <div style={{ fontFamily:FF.mono, fontSize:9, color:sect.color,
                  letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>
                  {sect.label}
                </div>
                {sect.steps.map((step, j) => <Bul key={j} c={sect.color}>{step}</Bul>)}
              </div>
            ))}
          </div>
          <MassivePEPanel />
        </div>
      )}

      {ddxSub === "dissect" && (
        <div>
          <InfoBox color={T.coral} title="ADD-RS — Aortic Dissection Detection Risk Score">
            <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, lineHeight:1.5 }}>
              Rogers et al, Circulation 2011. One point per category (max 3). Guides imaging threshold. Always order as <strong>CT Aortogram</strong> (arterial phase, chest+abdomen+pelvis) — not generic CT chest.
            </div>
          </InfoBox>
          {ADDRS_ITEMS.map(it => (
            <CheckRow key={it.key} label={it.label} sub={it.sub} checked={!!addrs[it.key]}
              color={T.coral} onChange={() => setAddrs(p => ({ ...p, [it.key]:!p[it.key] }))} />
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px", borderRadius:9, margin:"10px 0",
            background:`${addrsResult.color}0c`, border:`1px solid ${addrsResult.color}44` }}>
            <div style={{ flex:1, marginRight:12 }}>
              <div style={{ fontFamily:FF.serif, fontWeight:700, fontSize:15, color:addrsResult.color }}>{addrsResult.label}</div>
              <div style={{ fontFamily:FF.sans, fontSize:10.5, color:T.txt3, marginTop:3, lineHeight:1.5 }}>{addrsResult.rec}</div>
            </div>
            <div style={{ fontFamily:FF.mono, fontSize:36, fontWeight:900, color:addrsResult.color, lineHeight:1, flexShrink:0 }}>{addrsScore}</div>
          </div>
          <InfoBox color={T.gold} icon="💡" title="Critical Pearl">
            <div style={{ fontFamily:FF.sans, fontSize:11, color:T.txt3, lineHeight:1.6 }}>
              HTN + anterior chest pain + wide mediastinum on CXR = high suspicion. BP differential &gt;20 mmHg between arms is pathognomonic. D-dimer &gt;500 ng/mL has 97% sensitivity for type A dissection (IRAD 2009). Do NOT anticoagulate before dissection is excluded.
            </div>
          </InfoBox>
          <button onClick={() => setAddrs({})}
            style={{ marginTop:4, fontFamily:FF.sans, fontSize:11, fontWeight:600,
              padding:"5px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(35,70,115,0.72)", background:"transparent", color:T.txt4 }}>
            ↺ Reset
          </button>
        </div>
      )}

      {ddxSub === "peri"      && <RefSection data={DDX_REF.peri} />}
      {ddxSub === "pneumo"    && <RefSection data={DDX_REF.pneumo} />}
      {ddxSub === "boerhaave" && <RefSection data={DDX_REF.boerhaave} />}
    </div>
  );
}