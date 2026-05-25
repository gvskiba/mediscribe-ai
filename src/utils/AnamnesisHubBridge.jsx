// AnamnesisHubBridge.jsx
// Cross-hub data push layer for Lakonyx Anamnesis.
// Place at: @/utils/AnamnesisHubBridge.jsx
import { useState } from "react";

const PATTERNS = {
  ecg: {
    problems: ["atrial fibrillation","afib","atrial flutter","ventricular tachycardia","vtach","svt","wpw","heart block","long qt","brugada","hocm","heart failure","chf","cardiomyopathy","pacemaker","icd","defibrillator","stemi","nstemi","myocardial infarction","coronary artery disease","cad"],
    meds:     ["amiodarone","sotalol","dofetilide","flecainide","propafenone","dronedarone","digoxin","metoprolol","atenolol","carvedilol","bisoprolol","verapamil","diltiazem","adenosine"],
    visits:   ["chest pain","palpitation","syncope","cardiac","arrhythmia","irregular heart","tachycardia","bradycardia","stemi","nstemi"],
  },
  stroke: {
    problems: ["stroke","cva","tia","transient ischemic","cerebrovascular","atrial fibrillation","afib","carotid","intracranial","subarachnoid"],
    meds:     ["warfarin","apixaban","rivaroxaban","dabigatran","edoxaban","aspirin","clopidogrel","ticagrelor","alteplase","tpa"],
    visits:   ["stroke","tia","facial droop","arm weakness","speech","vision loss","severe headache","worst headache","thunderclap"],
  },
  tox: {
    problems: ["substance use","alcohol use disorder","opioid use","substance abuse","overdose","drug abuse","addiction","naltrexone","suboxone","methadone program"],
    meds:     ["methadone","buprenorphine","naltrexone","naloxone","disulfiram","acamprosate"],
    visits:   ["overdose","ingestion","intoxication","withdrawal","altered mental","suicidal","intentional","toxicity","poisoning","substance"],
  },
  cardiac: {
    problems: ["diabetes","hypertension","hyperlipidemia","dyslipidemia","obesity","smoking","tobacco","coronary artery disease","peripheral artery disease","renal disease","chronic kidney"],
    meds:     ["aspirin","statin","atorvastatin","simvastatin","rosuvastatin","lisinopril","enalapril","metformin","insulin"],
    visits:   ["chest pain","chest pressure","exertional","dyspnea","edema","diaphoresis"],
  },
  sepsis: {
    problems: ["immunocompromised","transplant","hiv","cancer","chemotherapy","chronic kidney disease","cirrhosis","diabetes","asplenia","splenectomy"],
    meds:     ["prednisone","methylprednisolone","cyclosporine","tacrolimus","mycophenolate","azathioprine","methotrexate","rituximab","infliximab"],
    visits:   ["fever","infection","sepsis","bacteremia","pneumonia","uti","cellulitis","abscess","meningitis"],
  },
};

function matchesPatterns(data={}, medNorm=[], patterns={}) {
  const { problems=[], meds=[], visits=[] } = patterns;
  const normStr = s => (s??"").toLowerCase();
  const probMatch = (data.problems??[]).some(p => problems.some(pat => normStr(p.name).includes(pat)));
  const medPool = medNorm.length ? medNorm : (data.medications??[]);
  const medMatch = medPool.some(m => meds.some(pat => normStr(m.ingredientName??m.cleanedName??m.name).includes(pat)));
  const visitMatch = (data.visits??[]).some(v => visits.some(pat => normStr(v.cc).includes(pat) || normStr(v.dx).includes(pat)));
  return { matched: probMatch||medMatch||visitMatch, probMatch, medMatch, visitMatch };
}

function buildECGContext(data, medNorm, ddiState) {
  const meds  = medNorm.length ? medNorm : (data.medications??[]);
  const normN = m => (m.ingredientName??m.cleanedName??m.name??"").toLowerCase();
  const antiarrhythmics = meds.filter(m => ["amiodarone","sotalol","dofetilide","flecainide","propafenone","dronedarone","digoxin"].some(d=>normN(m).includes(d))).map(m => m.name);
  const betablockers = meds.filter(m => ["metoprolol","atenolol","carvedilol","bisoprolol","propranolol","labetalol"].some(d=>normN(m).includes(d))).map(m => m.name);
  const priorAFib = (data.problems??[]).some(p=>/afib|atrial fib/i.test(p.name));
  const priorHF   = (data.problems??[]).some(p=>/heart failure|chf|cardiomyopathy/i.test(p.name));
  const priorMI   = (data.problems??[]).some(p=>/myocardial infarction|stemi|nstemi|mi\b/i.test(p.name));
  const priorCAD  = (data.problems??[]).some(p=>/coronary artery|cad|angina/i.test(p.name));
  const pacerICD  = (data.problems??[]).some(p=>/pacemaker|defibrillator|icd|aicd/i.test(p.name));
  const longQT    = (data.problems??[]).some(p=>/long qt|lqts/i.test(p.name));
  const qtDDI     = (ddiState?.interactions??[]).some(i=>i.class?.toLowerCase().includes("qt"));
  const qtMeds    = meds.filter(m=>["amiodarone","sotalol","dofetilide","azithromycin","haloperidol","quetiapine","ziprasidone"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const priorCardiacVisit = (data.visits??[]).find(v=>/chest pain|palpitation|syncope|arrhythmia|cardiac arrest/i.test(v.cc));
  return {
    priorAFib, priorHF, priorMI, priorCAD, pacerICD, longQT,
    antiarrhythmics, betablockers, qtMeds, qtRisk:qtDDI||longQT||qtMeds.length>1,
    lastCardiacVisit: priorCardiacVisit?.date??null,
    summary: [priorAFib&&"Prior AFib", priorMI&&"Prior MI/STEMI", priorHF&&"Heart failure", pacerICD&&"Pacemaker/ICD", qtDDI&&"QT-prolonging DDI", antiarrhythmics.length&&`On antiarrhythmics: ${antiarrhythmics.slice(0,2).join(", ")}`].filter(Boolean).join(" · ") || "Cardiac history present",
  };
}

function buildStrokeContext(data, medNorm) {
  const meds  = medNorm.length ? medNorm : (data.medications??[]);
  const normN = m => (m.ingredientName??m.cleanedName??m.name??"").toLowerCase();
  const anticoag = meds.filter(m=>["warfarin","apixaban","rivaroxaban","dabigatran","edoxaban","heparin","enoxaparin"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const antiplatelet = meds.filter(m=>["aspirin","clopidogrel","ticagrelor","prasugrel"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const priorStroke = (data.problems??[]).some(p=>/stroke|cva|cerebrovascular/i.test(p.name));
  const priorTIA    = (data.problems??[]).some(p=>/tia|transient ischemic/i.test(p.name));
  const afib        = (data.problems??[]).some(p=>/afib|atrial fib/i.test(p.name));
  const htn         = (data.problems??[]).some(p=>/hypertension|htn/i.test(p.name));
  const dm          = (data.problems??[]).some(p=>/diabetes/i.test(p.name));
  const carotid     = (data.problems??[]).some(p=>/carotid/i.test(p.name));
  const onAnticoag  = anticoag.length > 0;
  const priorStrokeVisit = (data.visits??[]).find(v=>/stroke|tia|facial|arm weak|speech|vision|headache/i.test(v.cc));
  return {
    priorStroke, priorTIA, afib, htn, dm, carotid, onAnticoag, anticoag, antiplatelet,
    cha2ds2Score: [afib,priorStroke||priorTIA,htn,dm,(data.patient?.dob&&new Date().getFullYear()-parseInt(data.patient.dob)>=75)].filter(Boolean).length,
    lastStrokeVisit: priorStrokeVisit?.date??null,
    summary: [priorStroke&&"Prior stroke/CVA", priorTIA&&"Prior TIA", afib&&"Known AFib", onAnticoag&&`Anticoagulated: ${anticoag.slice(0,2).join(", ")}`, carotid&&"Carotid disease"].filter(Boolean).join(" · ") || "Stroke risk factors present",
  };
}

function buildToxContext(data, medNorm, visits=[]) {
  const meds  = medNorm.length ? medNorm : (data.medications??[]);
  const normN = m => (m.ingredientName??m.cleanedName??m.name??"").toLowerCase();
  const matp     = meds.filter(m=>["methadone","buprenorphine","naltrexone","suboxone"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const naloxone = meds.some(m=>normN(m).includes("naloxone"));
  const opioids  = meds.filter(m=>["morphine","oxycodone","hydrocodone","fentanyl","hydromorphone","tramadol","codeine","meperidine"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const benzos   = meds.filter(m=>["lorazepam","diazepam","alprazolam","clonazepam","midazolam","temazepam"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const odVisits   = visits.filter(v=>/overdose|ingestion|intoxication|ods|intentional|toxic/i.test(v.cc??"")||/overdose|toxic|ingestion/i.test(v.dx??""));
  const etohVisits = visits.filter(v=>/alcohol|etoh|intoxicat|withdrawal/i.test(v.cc??"")||/alcohol|etoh/i.test(v.dx??""));
  const sudProb    = (data.problems??[]).some(p=>/substance use|alcohol use|opioid use|abuse|addiction/i.test(p.name));
  return {
    matMeds:matp, naloxone, opioids, benzos,
    odHistory: odVisits.length > 0, odCount: odVisits.length,
    etohHistory: etohVisits.length > 0, sudDiagnosis: sudProb, matTreatment: matp.length > 0,
    opioidBenzoCombination: opioids.length>0 && benzos.length>0,
    summary: [odVisits.length>0&&`${odVisits.length} prior OD visit${odVisits.length>1?"s":""}`, matp.length>0&&`MAT: ${matp.slice(0,2).join(", ")}`, naloxone&&"On naloxone", opioids.length>0&&benzos.length>0&&"⚠ Opioid + benzo combo"].filter(Boolean).join(" · ") || "Substance-related history present",
  };
}

function buildCardiacRiskContext(data, medNorm) {
  const meds  = medNorm.length ? medNorm : (data.medications??[]);
  const normN = m => (m.ingredientName??m.cleanedName??m.name??"").toLowerCase();
  const statins  = meds.filter(m=>["atorvastatin","simvastatin","rosuvastatin","pravastatin","lovastatin","fluvastatin"].some(d=>normN(m).includes(d))).map(m=>m.name);
  const probs    = (data.problems??[]).map(p=>(p.name??"").toLowerCase());
  const dm       = probs.some(p=>/diabetes/i.test(p));
  const htn      = probs.some(p=>/hypertension|htn/i.test(p));
  const hld      = probs.some(p=>/hyperlipidemia|dyslipidemia|cholesterol/i.test(p));
  const smoking  = probs.some(p=>/smok|tobacco|nicotine/i.test(p));
  const obesity  = probs.some(p=>/obes|bmi/i.test(p));
  const priorMI  = probs.some(p=>/infarction|stemi|nstemi|mi\b/i.test(p));
  const priorCAD = probs.some(p=>/coronary|cad|angina/i.test(p));
  const ckd      = probs.some(p=>/kidney disease|ckd|renal/i.test(p));
  return {
    dm, htn, hld, smoking, obesity, priorMI, priorCAD, ckd, statins,
    timi: [dm,htn,hld,smoking,priorMI||priorCAD,dm].filter(Boolean).length,
    riskFactorCount: [dm,htn,hld,smoking,obesity,priorMI,priorCAD].filter(Boolean).length,
    summary: [dm&&"DM", htn&&"HTN", hld&&"Hyperlipidemia", smoking&&"Tobacco", priorMI&&"Prior MI", priorCAD&&"CAD", ckd&&"CKD", statins.length>0&&`On statin: ${statins[0]}`].filter(Boolean).join(" · ") || "Cardiac risk factors present",
  };
}

export function detectHubRelevance(data={}, medNorm=[], ddiState=null) {
  const visits = data.visits ?? [];
  return {
    ecg:    { ...matchesPatterns(data, medNorm, PATTERNS.ecg),    context: buildECGContext(data, medNorm, ddiState) },
    stroke: { ...matchesPatterns(data, medNorm, PATTERNS.stroke), context: buildStrokeContext(data, medNorm) },
    tox:    { ...matchesPatterns(data, medNorm, PATTERNS.tox),    context: buildToxContext(data, medNorm, visits) },
    cardiac:{ ...matchesPatterns(data, medNorm, PATTERNS.cardiac),context: buildCardiacRiskContext(data, medNorm) },
    sepsis: { ...matchesPatterns(data, medNorm, PATTERNS.sepsis), context: { summary: "Immunocompromised risk factors detected" } },
  };
}

const HUB_PATHS = {
  ecg:"/ecg", stroke:"/stroke", tox:"/toxicology",
  cardiac:"/cardiac", sepsis:"/sepsis", mdm:"/mdm", orders:"/orders",
};

export function buildHubParams(patient={}, context={}) {
  const p = new URLSearchParams();
  if (patient.lastName)  p.set("lastName",  patient.lastName);
  if (patient.firstName) p.set("firstName", patient.firstName);
  if (patient.dob)       p.set("dob",       patient.dob);
  if (patient.mrn)       p.set("mrn",       patient.mrn);
  if (context.summary)   p.set("anamnesisContext", encodeURIComponent(context.summary));
  return p.toString();
}

export function navigateToHub(hubId, context={}, patient={}) {
  const path = HUB_PATHS[hubId];
  if (!path) return;
  const params = buildHubParams(patient, context);
  const url = `${path}${params?"?"+params:""}`;
  try { window.history.pushState({}, "", url); window.dispatchEvent(new PopStateEvent("popstate")); }
  catch { window.location.href = url; }
}

const HUB_META = {
  ecg:     { label:"ECG Hub",      icon:"♥", color:"#f06060" },
  stroke:  { label:"Stroke Hub",   icon:"🧠", color:"#9b7de8" },
  tox:     { label:"Tox Hub",      icon:"☣", color:"#e8a838" },
  cardiac: { label:"Cardiac Risk", icon:"📊", color:"#e8b84b" },
  sepsis:  { label:"Sepsis Hub",   icon:"🦠", color:"#4a9eff" },
};

export function HubBridgePanel({ data, medNorm, ddiState }) {
  const [hovered, setHovered] = useState(null);
  if (!data) return null;
  const relevance = detectHubRelevance(data, medNorm??[], ddiState);
  const relevant = Object.entries(relevance).filter(([,v]) => v.matched);
  if (!relevant.length) return null;
  return (
    <div>
      <div style={{ fontSize:9, fontWeight:700, color:"#3a5f80", letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:6 }}>Open in Lakonyx Hub</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {relevant.map(([hubId, info]) => {
          const meta = HUB_META[hubId];
          if (!meta) return null;
          return (
            <div key={hubId}
              onClick={() => navigateToHub(hubId, info.context, data.patient??{})}
              onMouseEnter={() => setHovered(hubId)}
              onMouseLeave={() => setHovered(null)}
              title={info.context?.summary ?? meta.label}
              style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:600, transition:"all .15s", background:hovered===hubId?`${meta.color}20`:"rgba(255,255,255,0.04)", border:`1px solid ${hovered===hubId?meta.color+"50":"rgba(255,255,255,0.08)"}`, color:hovered===hubId?meta.color:"#5e88b0" }}>
              <span style={{ fontSize:12 }}>{meta.icon}</span>
              {meta.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}