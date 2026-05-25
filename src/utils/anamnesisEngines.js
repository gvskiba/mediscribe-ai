// anamnesisEngines.js
// Pure logic for Lakonyx Anamnesis — no React, no side effects.
// Place at: @/utils/anamnesisEngines.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HG_SANDBOX    = "https://sandbox.healthgorilla.com";
export const MAX_POLL_MS   = 90_000;
export const INIT_INTERVAL = 3_000;
export const MAX_INTERVAL  = 15_000;
export const BACKOFF       = 1.5;
export const CACHE_TTL_MS  = 15 * 60 * 1000; // 15 min

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FHIR BUNDLE PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function parseFHIRBundle(bundle) {
  const res = (bundle?.entry ?? []).map(e => e.resource).filter(Boolean);
  const by  = (t) => res.filter(r => r.resourceType === t);
  const pt  = by("Patient")[0] ?? {};

  const patient = {
    firstName: pt.name?.[0]?.given?.[0] ?? "",
    lastName:  pt.name?.[0]?.family ?? "",
    dob:       pt.birthDate ?? "",
    mrn:       pt.identifier?.find(i => i.type?.coding?.[0]?.code === "MR")?.value ?? "",
    id:        pt.id ?? "",
  };

  const visits = by("Encounter")
    .filter(e => ["EMER","IMP","AMB"].includes(e.class?.code))
    .map(e => ({
      date:  (e.period?.start ?? "").slice(0,10),
      cc:    e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? "Visit",
      dx:    e.diagnosis?.[0]?.condition?.display ?? "",
      dispo: e.hospitalization?.dischargeDisposition?.text ?? "DC home",
      src:   e.serviceProvider?.display ?? "External",
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,10);

  const medications = by("MedicationRequest").filter(m => m.status==="active").map(m => ({
    name: m.medicationCodeableConcept?.text ?? m.medicationReference?.display ?? "",
    dose: (() => { const d = m.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity; return d ? `${d.value??""} ${d.unit??""}`.trim() : ""; })(),
    freq: m.dosageInstruction?.[0]?.timing?.code?.text ?? m.dosageInstruction?.[0]?.text ?? "",
    src:  m.requester?.display ?? "",
  }));

  const allergies = by("AllergyIntolerance").map(a => ({
    name: a.code?.text ?? a.code?.coding?.[0]?.display ?? "",
    sev:  a.reaction?.[0]?.severity ?? "unknown",
    rxn:  a.reaction?.[0]?.manifestation?.[0]?.text ?? "",
    src:  a.recorder?.display ?? "",
  }));

  const problems = by("Condition").filter(c => c.clinicalStatus?.coding?.[0]?.code==="active").map(c => ({
    name: c.code?.text ?? c.code?.coding?.[0]?.display ?? "",
    icd:  c.code?.coding?.find(cd => cd.system?.toLowerCase().includes("icd"))?.code ?? "",
    src:  c.recorder?.display ?? "",
  }));

  const labs = by("Observation")
    .filter(o => o.category?.[0]?.coding?.[0]?.code==="laboratory" && o.valueQuantity)
    .map(o => ({
      name: o.code?.text ?? o.code?.coding?.[0]?.display ?? "",
      val:  `${o.valueQuantity?.value??""} ${o.valueQuantity?.unit??""}`.trim(),
      ref:  o.referenceRange?.[0]?.text ?? "",
      flag: o.interpretation?.[0]?.coding?.[0]?.code ?? "N",
      date: (o.effectiveDateTime??"").slice(0,10),
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,15);

  // DocumentReference parsing
  const DOC_TYPE_MAP = {
    "34133-9":"summary","11488-4":"consult","18842-5":"summary","11506-3":"progress",
    "11490-0":"summary","28570-0":"procedure","18726-0":"radiology","11504-8":"procedure",
    "34117-2":"hp","57133-1":"consult","51847-2":"ed","34112-3":"ed",
  };
  const documents = by("DocumentReference")
    .filter(d => d.status !== "entered-in-error")
    .map(d => {
      const loincCode = d.type?.coding?.find(c => c.system?.includes("loinc"))?.code ?? "";
      const cat = DOC_TYPE_MAP[loincCode] ?? "other";
      const att = d.content?.[0]?.attachment ?? {};
      const contentType = att.contentType ?? "";
      return {
        fhirId:      d.id ?? "",
        typeLabel:   d.type?.text ?? d.type?.coding?.[0]?.display ?? "Clinical Document",
        category:    cat,
        date:        (d.date ?? d.context?.period?.start ?? "").slice(0,10),
        author:      d.author?.[0]?.display ?? "",
        src:         d.custodian?.display ?? "",
        status:      d.status ?? "current",
        contentType,
        url:         att.url ?? null,
        data:        att.data ?? null,
        isCCDA:      contentType.includes("xml") || contentType.includes("cda"),
        isPDF:       contentType.includes("pdf"),
        priority:    cat==="summary"?0:cat==="ed"||cat==="hp"?1:cat==="consult"||cat==="radiology"?2:3,
      };
    })
    .sort((a,b) => a.priority - b.priority || b.date.localeCompare(a.date));

  return { patient, visits, medications, allergies, problems, labs, documents };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI PARSE SCHEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PARSE_SCHEMA = {
  type:"object", properties:{
    patient:     { type:"object", properties:{ firstName:{type:"string"},lastName:{type:"string"},dob:{type:"string"},mrn:{type:"string"} } },
    visits:      { type:"array", items:{ type:"object", properties:{ date:{type:"string"},cc:{type:"string"},diagnosis:{type:"string"},dispo:{type:"string"},source:{type:"string"} } } },
    medications: { type:"array", items:{ type:"object", properties:{ name:{type:"string"},dose:{type:"string"},frequency:{type:"string"},source:{type:"string"} } } },
    allergies:   { type:"array", items:{ type:"object", properties:{ name:{type:"string"},severity:{type:"string",enum:["mild","moderate","severe","unknown"]},reaction:{type:"string"},source:{type:"string"} } } },
    problems:    { type:"array", items:{ type:"object", properties:{ name:{type:"string"},icd10:{type:"string"},source:{type:"string"} } } },
    labs:        { type:"array", items:{ type:"object", properties:{ name:{type:"string"},value:{type:"string"},refRange:{type:"string"},flag:{type:"string",enum:["H","L","N","HH","LL"]},date:{type:"string"} } } },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HG AUTH HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function hgAuth(id, secret) {
  const r = await fetch(`${HG_SANDBOX}/oauth/token`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ client_id:id, client_secret:secret, grant_type:"client_credentials" }),
  });
  if (!r.ok) throw new Error(`Auth failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
}

export async function hgFindPatient(token, { lastName, firstName, dob }) {
  const p = new URLSearchParams({ family:lastName, given:firstName, birthdate:dob });
  const r = await fetch(`${HG_SANDBOX}/fhir/R4/Patient?${p}`, {
    headers:{ Authorization:`Bearer ${token}`, Accept:"application/fhir+json" },
  });
  if (!r.ok) throw new Error(`Patient search failed: HTTP ${r.status}`);
  return (await r.json())?.entry?.[0]?.resource ?? null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IDENTITY MATCHING (Fellegi-Sunter probabilistic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Common nicknames map
const NICKNAMES = {
  william:["bill","billy","will"],robert:["bob","rob","robby"],james:["jim","jimmy","jamie"],
  john:["jack","johnny"],richard:["rick","dick","rich"],charles:["charlie","chuck"],
  thomas:["tom","tommy"],christopher:["chris"],michael:["mike","mikey"],
  patricia:["pat","patty","tricia"],elizabeth:["liz","beth","betty","eliza","lisa"],
  jennifer:["jen","jenny"],margaret:["meg","peggy","maggie"],kathleen:["kathy","kate"],
  catherine:["cat","cathy","kate","katie"],joseph:["joe","joey"],george:["georgie"],
  anthony:["tony"],nicholas:["nick","nicky"],alexander:["alex","al","lex"],
  stephanie:["steph"],deborah:["deb","debbie"],susan:["sue","susie"],
};

function nicknameMatch(a, b) {
  const la=a.toLowerCase(), lb=b.toLowerCase();
  if (la===lb) return true;
  const check=(name,nick)=>{
    const nicks=NICKNAMES[name];
    return nicks ? nicks.includes(nick) : false;
  };
  return check(la,lb)||check(lb,la);
}

// Jaro-Winkler similarity
function jaroWinkler(s1, s2) {
  if (!s1||!s2) return 0;
  s1=s1.toLowerCase(); s2=s2.toLowerCase();
  if (s1===s2) return 1;
  const len1=s1.length, len2=s2.length;
  const matchDist=Math.floor(Math.max(len1,len2)/2)-1;
  const s1m=new Array(len1).fill(false), s2m=new Array(len2).fill(false);
  let matches=0, transpositions=0;
  for (let i=0;i<len1;i++) {
    const start=Math.max(0,i-matchDist), end=Math.min(i+matchDist+1,len2);
    for (let j=start;j<end;j++) {
      if (s2m[j]||s1[i]!==s2[j]) continue;
      s1m[i]=s2m[j]=true; matches++; break;
    }
  }
  if (!matches) return 0;
  let k=0;
  for (let i=0;i<len1;i++) {
    if (!s1m[i]) continue;
    while (!s2m[k]) k++;
    if (s1[i]!==s2[k]) transpositions++;
    k++;
  }
  const jaro=(matches/len1+matches/len2+(matches-transpositions/2)/matches)/3;
  let prefix=0;
  for (let i=0;i<Math.min(4,len1,len2);i++) { if (s1[i]===s2[i]) prefix++; else break; }
  return jaro+prefix*0.1*(1-jaro);
}

function dobSim(a, b) {
  if (!a||!b) return null;
  const da=a.replace(/\//g,"-"), db=b.replace(/\//g,"-");
  if (da===db) return 1;
  // Check year-month vs month-day transposition
  const pA=da.split("-"), pB=db.split("-");
  if (pA.length===3&&pB.length===3) {
    const [yA,mA,dA]=pA, [yB,mB,dB]=pB;
    if (yA===yB&&mA===dB&&dA===mB) return 0.5; // month/day swap
    if (yA===yB) return 0.6;
  }
  return 0;
}

function mrnSim(a, b) {
  if (!a||!b) return null;
  const la=a.toLowerCase().replace(/\s/g,""), lb=b.toLowerCase().replace(/\s/g,"");
  if (la===lb) return 1;
  if (la.includes(lb)||lb.includes(la)) return 0.8;
  return 0;
}

export function extractFHIRDemog(ptResource) {
  return {
    firstName: ptResource?.name?.[0]?.given?.[0] ?? "",
    lastName:  ptResource?.name?.[0]?.family ?? "",
    dob:       ptResource?.birthDate ?? "",
    mrn:       ptResource?.identifier?.find(i => i.type?.coding?.[0]?.code==="MR")?.value ?? "",
  };
}

export function scoreIdentity(query, fhir) {
  const WEIGHTS = { last:35, first:25, dob:30, mrn:20 };
  const mrnProvided = !!(query.mrn && query.mrn.trim());

  const lastSim  = jaroWinkler(query.lastName, fhir.lastName);
  const firstSim = (() => {
    const jw = jaroWinkler(query.firstName, fhir.firstName);
    if (jw >= 0.92) return jw;
    if (nicknameMatch(query.firstName, fhir.firstName)) return 0.95;
    return jw;
  })();
  const dobSim_  = dobSim(query.dob, fhir.dob);
  const mrnSim_  = mrnProvided ? mrnSim(query.mrn, fhir.mrn) : null;

  const fieldLabel = (sim, field) => {
    if (sim===null) return {label:"Not provided", detail:"No value submitted.", sim:null};
    if (sim>=0.97) return {label:"Exact match", detail:"Values are identical.", sim};
    if (sim>=0.90) return {label:"Near-exact match", detail:"Very high similarity — likely same value.", sim};
    if (sim>=0.75) return {label:"Partial match", detail:"Moderate similarity — possible typo or nickname.", sim};
    if (sim>=0.50) return {label:"Weak match", detail:"Low similarity — verify carefully.", sim};
    return {label:"No match", detail:"Values do not match. Verification required.", sim};
  };

  const fields = {
    last:  {...fieldLabel(lastSim,"last"),  sim:lastSim},
    first: {...fieldLabel(firstSim,"first"),sim:firstSim, nickname: nicknameMatch(query.firstName, fhir.firstName)},
    dob:   {...fieldLabel(dobSim_,"dob"),   sim:dobSim_},
    mrn:   {...fieldLabel(mrnSim_,"mrn"),   sim:mrnSim_},
  };

  // Weighted score
  const totalWeight = WEIGHTS.last + WEIGHTS.first + WEIGHTS.dob + (mrnProvided ? WEIGHTS.mrn : 0);
  const rawScore = (
    (lastSim??0)*WEIGHTS.last +
    (firstSim??0)*WEIGHTS.first +
    (dobSim_??0)*WEIGHTS.dob +
    (mrnProvided ? (mrnSim_??0)*WEIGHTS.mrn : 0)
  ) / totalWeight;
  const score = Math.round(rawScore * 100);

  // Hard block if last name is completely off
  const hardBlock = lastSim < 0.3 || dobSim_ === 0;

  let level, color, canView, canImport, requiresAttestation, blockReason;
  if (hardBlock || score < 65) {
    level="BLOCKED"; color="#f06060"; canView=false; canImport=false; requiresAttestation=false;
    blockReason = lastSim < 0.3
      ? `Last name similarity too low (${Math.round(lastSim*100)}%). The retrieved record does not appear to belong to this patient.`
      : `Date of birth does not match. Confirm patient identity before accessing records.`;
  } else if (score < 80) {
    level="CAUTION"; color="#e8a838"; canView=true; canImport=false; requiresAttestation=true;
  } else if (score < 92) {
    level="REVIEW"; color="#e8b84b"; canView=true; canImport=true; requiresAttestation=false;
  } else {
    level="CONFIRMED"; color="#00d4a8"; canView=true; canImport=true; requiresAttestation=false;
  }

  const warnings = [];
  if (fields.first.nickname) warnings.push("⚠ Nickname match detected for first name — verify with patient.");
  if (dobSim_ > 0 && dobSim_ < 1) warnings.push("⚠ Possible month/day transposition in date of birth — confirm with patient.");
  if (mrnProvided && mrnSim_ !== null && mrnSim_ < 0.8) warnings.push("⚠ MRN does not match the retrieved record's identifier.");

  return { score, level, color, canView, canImport, requiresAttestation, blockReason, warnings, fields, weights:WEIGHTS, mrnProvided };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RxNorm NORMALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function rxNormLookup(name) {
  const clean = name.replace(/\s+\d+.*$/,"").trim(); // strip dose
  try {
    const r = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(clean)}&search=2`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const d = await r.json();
    const rxcui = d?.idGroup?.rxnormId?.[0];
    if (!rxcui) return null;
    // Get ingredient
    const r2 = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN`, { signal: AbortSignal.timeout(4000) });
    if (!r2.ok) return { rxcui, ingredientRxcui:null, ingredientName:null };
    const d2 = await r2.json();
    const ing = d2?.relatedGroup?.conceptGroup?.find(g=>g.tty==="IN")?.conceptProperties?.[0];
    return { rxcui, ingredientRxcui: ing?.rxcui??null, ingredientName: ing?.name?.toLowerCase()??null };
  } catch { return null; }
}

export async function normalizeMedList(medications) {
  return Promise.all(medications.map(async (m) => {
    const lookup = await rxNormLookup(m.name);
    return {
      name:            m.name,
      cleanedName:     m.name.replace(/\s+\d+.*$/,"").trim().toLowerCase(),
      rxcui:           lookup?.rxcui ?? null,
      ingredientRxcui: lookup?.ingredientRxcui ?? null,
      ingredientName:  lookup?.ingredientName ?? null,
      rxnormResolved:  !!lookup?.rxcui,
      isNormalized:    !!lookup?.ingredientRxcui,
    };
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRUG-DRUG INTERACTION CHECK (ONCHigh + OpenFDA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Curated ONCHigh DDI pairs (subset — most critical)
const ONC_HIGH = [
  { a:"warfarin", b:"aspirin",         severity:"major",    class:"Anticoagulant + Antiplatelet", effect:"Increased bleeding risk", mechanism:"Additive anticoagulant effect", management:"Monitor INR closely; assess bleeding risk before co-prescribing.", source:"ONCHigh DDI" },
  { a:"warfarin", b:"ibuprofen",       severity:"critical", class:"Anticoagulant + NSAID",        effect:"Severe GI bleeding risk; potentiated anticoagulation", mechanism:"NSAIDs inhibit platelet aggregation and may displace warfarin from protein binding.", management:"Avoid combination. Use acetaminophen if analgesia needed. Monitor INR.", source:"ONCHigh DDI" },
  { a:"warfarin", b:"naproxen",        severity:"critical", class:"Anticoagulant + NSAID",        effect:"Severe GI bleeding risk", mechanism:"Additive platelet inhibition plus possible warfarin displacement.", management:"Avoid. Use acetaminophen instead.", source:"ONCHigh DDI" },
  { a:"warfarin", b:"fluconazole",     severity:"critical", class:"Anticoagulant + Azole",        effect:"INR elevation, bleeding", mechanism:"CYP2C9 inhibition increases warfarin exposure.", management:"Reduce warfarin dose 25–50%, monitor INR daily during antifungal course.", source:"ONCHigh DDI" },
  { a:"warfarin", b:"amiodarone",      severity:"critical", class:"Anticoagulant + Antiarrhythmic", effect:"Markedly elevated INR, major bleeding", mechanism:"Amiodarone inhibits CYP2C9 and CYP3A4.", management:"Reduce warfarin dose 30–50%. Monitor INR frequently.", source:"ONCHigh DDI" },
  { a:"clopidogrel", b:"omeprazole",   severity:"major",    class:"Antiplatelet + PPI",           effect:"Reduced antiplatelet effect of clopidogrel", mechanism:"Omeprazole inhibits CYP2C19, reducing clopidogrel activation.", management:"Use pantoprazole instead if PPI needed.", source:"ONCHigh DDI" },
  { a:"simvastatin", b:"amlodipine",   severity:"moderate", class:"Statin + CCB",                 effect:"Increased simvastatin exposure, myopathy risk", mechanism:"Amlodipine inhibits CYP3A4-mediated simvastatin metabolism.", management:"Limit simvastatin to 20 mg/day. Consider alternative statin.", source:"ONCHigh DDI" },
  { a:"simvastatin", b:"clarithromycin",severity:"critical",class:"Statin + Macrolide",           effect:"Rhabdomyolysis, severe myopathy", mechanism:"Clarithromycin is a potent CYP3A4 inhibitor.", management:"Hold simvastatin during clarithromycin course.", source:"ONCHigh DDI" },
  { a:"ssri",      b:"tramadol",       severity:"critical", class:"Serotonergic agents",          effect:"Serotonin syndrome", mechanism:"Additive serotonergic stimulation.", management:"Avoid combination. If necessary, monitor for agitation, hyperthermia, clonus.", source:"ONCHigh DDI" },
  { a:"metformin", b:"contrast",       severity:"major",    class:"Biguanide + Contrast media",   effect:"Lactic acidosis risk", mechanism:"Contrast-induced nephropathy can reduce metformin clearance.", management:"Hold metformin 48h before and after iodinated contrast in at-risk patients.", source:"ONCHigh DDI" },
  { a:"lisinopril", b:"spironolactone",severity:"major",    class:"ACEi + K-sparing diuretic",    effect:"Hyperkalemia", mechanism:"Both agents increase serum potassium.", management:"Monitor potassium closely. Avoid if baseline K+ > 5.0.", source:"ONCHigh DDI" },
  { a:"methotrexate", b:"nsaid",       severity:"critical", class:"DMARD + NSAID",                effect:"Methotrexate toxicity", mechanism:"NSAIDs reduce renal methotrexate clearance.", management:"Avoid combination. Use acetaminophen for pain.", source:"ONCHigh DDI" },
  { a:"ciprofloxacin", b:"theophylline",severity:"major",  class:"Fluoroquinolone + Xanthine",   effect:"Theophylline toxicity (seizures, arrhythmia)", mechanism:"Ciprofloxacin inhibits CYP1A2.", management:"Monitor theophylline levels; consider dose reduction.", source:"ONCHigh DDI" },
  { a:"digoxin", b:"amiodarone",       severity:"critical", class:"Cardiac glycoside + Antiarrhythmic", effect:"Digoxin toxicity (bradycardia, AV block)", mechanism:"Amiodarone reduces renal and non-renal digoxin clearance.", management:"Reduce digoxin dose by 50%. Monitor levels and ECG.", source:"ONCHigh DDI" },
  { a:"phenytoin", b:"fluconazole",    severity:"major",    class:"Anticonvulsant + Azole",       effect:"Phenytoin toxicity (nystagmus, ataxia)", mechanism:"Fluconazole inhibits CYP2C9.", management:"Monitor phenytoin levels. May need dose reduction.", source:"ONCHigh DDI" },
];

function normDrug(name) {
  return name.toLowerCase()
    .replace(/\s+\d+\s*(mg|mcg|g|ml|units?).*$/i,"")
    .replace(/-/g," ")
    .trim();
}

const DRUG_CLASSES = {
  ssri:["fluoxetine","sertraline","paroxetine","escitalopram","citalopram","fluvoxamine"],
  nsaid:["ibuprofen","naproxen","diclofenac","ketorolac","indomethacin","celecoxib","meloxicam"],
  statin:["simvastatin","atorvastatin","rosuvastatin","pravastatin","lovastatin","fluvastatin"],
};

function resolveClass(name) {
  const n = normDrug(name);
  for (const [cls, members] of Object.entries(DRUG_CLASSES)) {
    if (members.some(m => n.includes(m))) return cls;
  }
  return n;
}

export async function runDDICheck(medications) {
  if (!medications?.length) return { status:"clean", interactions:[], resolvedNames:[], fdaChecked:false, checkedAt:Date.now() };

  const resolved = medications.map(m => ({ orig:m.name, norm:resolveClass(m.name) }));
  const interactions = [];

  // Check ONCHigh pairs
  for (let i=0; i<resolved.length; i++) {
    for (let j=i+1; j<resolved.length; j++) {
      const a=resolved[i].norm, b=resolved[j].norm;
      for (const pair of ONC_HIGH) {
        const matchA = a.includes(pair.a)||pair.a.includes(a);
        const matchB = b.includes(pair.b)||pair.b.includes(b);
        const matchBA = b.includes(pair.a)||pair.a.includes(b);
        const matchAB = a.includes(pair.b)||pair.b.includes(a);
        if ((matchA&&matchB)||(matchBA&&matchAB)) {
          interactions.push({
            ...pair,
            drugA: resolved[i].orig,
            drugB: resolved[j].orig,
            key:   `${resolved[i].orig}+${resolved[j].orig}`,
          });
        }
      }
    }
  }

  const status = interactions.some(i=>i.severity==="critical") ? "critical"
               : interactions.some(i=>i.severity==="major")    ? "major"
               : interactions.length > 0                        ? "moderate"
               : "clean";

  return { status, interactions, resolvedNames:resolved.map(r=>r.orig), fdaChecked:false, checkedAt:Date.now() };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION CACHE (in-memory, tab-scoped)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const AnamnesisCache = new Map();

export function cacheKey(demog) {
  return `${(demog.lastName??"").toLowerCase()}_${(demog.dob??"").replace(/-/g,"")}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// URL PARAMS READER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function readURLParams() {
  const p = new URLSearchParams(window.location.search);
  const last = p.get("lastName")||p.get("last")||"";
  const first = p.get("firstName")||p.get("first")||"";
  const dob   = p.get("dob")||p.get("birthdate")||"";
  const mrn   = p.get("mrn")||"";
  const encounterID = p.get("encounterID")||p.get("encounterId")||"";
  if (!last && !dob) return null;
  return { lastName:last, firstName:first, dob, mrn, encounterID };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVENANCE RECORD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function genQueryId() {
  return `ANM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

export function createProvRecord({ retrievalMethod, networkSources, fhirEndpoint, encounterCtx }) {
  return {
    queryId:           genQueryId(),
    queryInitiatedAt:  new Date().toISOString(),
    retrievalMethod,
    networkSources:    networkSources ?? [],
    fhirEndpoint:      fhirEndpoint ?? "",
    encounterCtx:      encounterCtx ?? null,
    resourceSummary:   { visits:0, medications:0, allergies:0, problems:0, labs:0 },
    resourceCount:     0,
    resources:         { visits:[], medications:[], allergies:[], problems:[], labs:[], documents:[] },
    identityMatchScore: null,
    identityMatchLevel: null,
    identityAttested:  false,
    attestedAt:        null,
    importedToEncounter: false,
    importedAt:        null,
    latencyMs:         null,
    recordsReceivedAt: null,
    auditLog:          [{ event:"QUERY_INITIATED", ts:Date.now(), detail:`${retrievalMethod} query initiated via Lakonyx Anamnesis` }],
  };
}

export function provLog(record, event, detail) {
  if (!record) return record;
  return { ...record, auditLog:[...record.auditLog, { event, ts:Date.now(), detail }] };
}

export function provAttachMatch(record, matchResult) {
  if (!record) return record;
  return {
    ...record,
    identityMatchScore: matchResult.score,
    identityMatchLevel: matchResult.level,
    auditLog: [...record.auditLog, { event:"IDENTITY_VERIFIED", ts:Date.now(), detail:`Identity score: ${matchResult.score}% (${matchResult.level})` }],
  };
}

export function provAttachAttest(record) {
  if (!record) return record;
  return {
    ...record,
    identityAttested: true,
    attestedAt: new Date().toISOString(),
    auditLog: [...record.auditLog, { event:"PROVIDER_ATTESTED", ts:Date.now(), detail:"Clinician attested patient identity verbally." }],
  };
}

export function provAttachResources(record, parsed) {
  if (!record) return record;
  const summary = {
    visits:      parsed.visits?.length ?? 0,
    medications: parsed.medications?.length ?? 0,
    allergies:   parsed.allergies?.length ?? 0,
    problems:    parsed.problems?.length ?? 0,
    labs:        parsed.labs?.length ?? 0,
  };
  const total = Object.values(summary).reduce((a,b)=>a+b,0);
  return {
    ...record,
    resourceSummary:   summary,
    resourceCount:     total,
    recordsReceivedAt: new Date().toISOString(),
    latencyMs:         record.queryInitiatedAt ? Date.now()-new Date(record.queryInitiatedAt).getTime() : null,
    resources: {
      visits:      (parsed.visits??[]).map(v=>({name:`${v.cc} — ${v.date}`, resourceType:"Encounter"})),
      medications: (parsed.medications??[]).map(m=>({name:m.name, resourceType:"MedicationRequest"})),
      allergies:   (parsed.allergies??[]).map(a=>({name:a.name, resourceType:"AllergyIntolerance"})),
      problems:    (parsed.problems??[]).map(p=>({name:`${p.name} ${p.icd??""}`?.trim(), resourceType:"Condition"})),
      labs:        (parsed.labs??[]).map(l=>({name:`${l.name} — ${l.date}`, resourceType:"Observation"})),
      documents:   (parsed.documents??[]).map(d=>({name:d.typeLabel, fhirId:d.fhirId, resourceType:"DocumentReference"})),
    },
    auditLog: [...record.auditLog, { event:"RECORDS_RECEIVED", ts:Date.now(), detail:`${total} FHIR resources received: ${Object.entries(summary).map(([k,v])=>`${v} ${k}`).join(", ")}` }],
  };
}

export function provAttachImport(record, encounterRef) {
  if (!record) return record;
  return {
    ...record,
    importedToEncounter: true,
    importedAt:          new Date().toISOString(),
    auditLog: [...record.auditLog, { event:"IMPORTED_TO_ENCOUNTER", ts:Date.now(), detail:`Records imported to encounter: ${encounterRef}` }],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MDM SCORING (AMA 2023 E&M Guidelines)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LEVELS = ["minimal","low","moderate","high"];
const LEVEL_IDX = Object.fromEntries(LEVELS.map((l,i)=>[l,i]));

const PROB_LEVEL = {
  "":              "minimal",
  self_limited:    "low",
  stable_chronic:  "low",
  new_undiagnosed: "moderate",
  acute_systemic:  "moderate",
  acute_complicated:"moderate",
  chronic_exacerbation:"moderate",
  multiple_chronic:"moderate",
  severe_exacerbation:"high",
  threat_to_life:  "high",
};

export function d1Score({ problems=[], presentingProblem=null }) {
  const chronicCount = problems.filter(p => {
    const n=p.name.toLowerCase();
    return /diabetes|hypertension|htn|chf|copd|afib|cad|ckd|cirrhosis|hiv|cancer|malignancy|lupus|ra |crohn/.test(n);
  }).length;
  const probLevel = PROB_LEVEL[presentingProblem ?? ""] ?? "minimal";
  const fromImport = chronicCount>=3?"high":chronicCount>=2?"moderate":chronicCount>=1?"low":"minimal";
  const level = presentingProblem ? probLevel : fromImport;
  return { level, chronicCount, isSuggested: !presentingProblem, fromImport };
}

export function d2Score({ visits=[], labs=[], medications=[], sources=[], hasCategory2=false, hasCategory3=false }) {
  const externalVisits = visits.filter(v => v.src && !["","-","internal","local"].includes(v.src.toLowerCase())).length;
  const labCount = labs.length;
  const extSources = (sources??[]).filter(s => s.toLowerCase().includes("gorilla")||s.toLowerCase().includes("carequality")||s.toLowerCase().includes("commonwell")||s.toLowerCase().includes("external")||s.toLowerCase().includes("pasted")).length;

  let points = 0;
  if (labCount > 0) points++;
  if (externalVisits > 0 || extSources > 0) points++;
  if (hasCategory2) points++;
  if (hasCategory3) points++;

  const level = points >= 3 ? "high" : points >= 2 ? "moderate" : points >= 1 ? "low" : "minimal";
  return { level, labCount, externalVisits, extSources, cat2:hasCategory2, cat3:hasCategory3, points };
}

const HIGH_RISK_MEDS = ["warfarin","insulin","heparin","methotrexate","lithium","digoxin","phenytoin","carbamazepine","valproate","immunosuppressant","chemotherapy","clozapine","amiodarone","tacrolimus","cyclosporine","thrombolytic","tpa","alteplase"];
const MOD_RISK_MEDS  = ["opioid","opioid","morphine","oxycodone","hydrocodone","fentanyl","methadone","buprenorphine","anticoagulant","apixaban","rivaroxaban","dabigatran","enoxaparin","antiepileptic","antipsychotic","steroid","prednisone","dexamethasone"];

export function d3Score({ medications=[], medNorm=[], ddiState=null, riskOverride=null }) {
  if (riskOverride) return { level:riskOverride, highRiskMeds:[], modRiskMeds:[], ddiContrib:false, override:true };

  const names = medications.map(m => m.name.toLowerCase());
  const highRiskMeds = names.filter(n => HIGH_RISK_MEDS.some(h => n.includes(h)));
  const modRiskMeds  = names.filter(n => MOD_RISK_MEDS.some(h => n.includes(h)));
  const ddiContrib   = ddiState?.status === "critical" || ddiState?.status === "major";

  const level = highRiskMeds.length > 0 || ddiContrib ? "high"
              : modRiskMeds.length > 0              ? "moderate"
              : medications.length > 0              ? "low"
              : "minimal";
  return { level, highRiskMeds, modRiskMeds, ddiContrib, override:false };
}

export function overallMDM(d1, d2, d3) {
  const levels = [d1,d2,d3].map(l => LEVEL_IDX[l]??0).sort((a,b)=>a-b);
  // 2-of-3 rule: overall = second highest
  return LEVELS[levels[1]] ?? "minimal";
}

export const MDM_CPT = {
  ed:          { minimal:"99281",low:"99282",moderate:"99283",high:"99285" },
  new:         { minimal:"99202",low:"99203",moderate:"99204",high:"99205" },
  established: { minimal:"99212",low:"99213",moderate:"99214",high:"99215" },
};

export function genMDMNote({ d1, d2, d3, overall, data, sources, patientType="ed", checkedAt }) {
  const cptMap = MDM_CPT[patientType] ?? MDM_CPT.ed;
  const cpt = cptMap[overall] ?? "99283";
  const pt = data?.patient;
  const ptLine = pt ? `Patient: ${pt.firstName} ${pt.lastName}${pt.dob?`, DOB ${pt.dob}`:""}${pt.mrn?`, MRN ${pt.mrn}`:""}` : "";

  const d1Block = [
    `DOMAIN 1 — PROBLEMS AND MANAGEMENT (${d1.level.toUpperCase()})`,
    "",
    d1.chronicCount > 0 ? `Active chronic conditions (${d1.chronicCount}):` : "No imported chronic conditions.",
    ...(data?.problems??[]).slice(0,8).map(p => `  • ${p.name}${p.icd?` (${p.icd})`:""}`),
    "",
    `Assessment: ${d1.level==="high"?"Acute or chronic illness posing threat to life/function.":d1.level==="moderate"?"New problem with uncertain prognosis or acute illness with systemic symptoms.":d1.level==="low"?"Established stable chronic illness(es) managed without prescription drug management.":"Self-limited or minor problem."}`,
  ].join("\n");

  const d2Block = [
    `DOMAIN 2 — DATA REVIEWED (${d2.level.toUpperCase()})`,
    "",
    `External records sources: ${(sources??[]).join(", ")||"None documented"}`,
    d2.labCount > 0  ? `  ✓ Reviewed ${d2.labCount} laboratory result(s) from external/prior encounters` : "  – No external laboratory results reviewed",
    d2.externalVisits > 0 ? `  ✓ Reviewed ${d2.externalVisits} external visit(s) from care network` : "",
    d2.cat2 ? "  ✓ Category 2: Independently interpreted external diagnostic test (not separately billed)" : "",
    d2.cat3 ? "  ✓ Category 3: Discussion with external qualified health professional" : "",
    "",
    `Data complexity score: ${d2.points} of 4 criteria met.`,
  ].filter(l=>l!=="—").join("\n");

  const d3Block = [
    `DOMAIN 3 — RISK OF COMPLICATIONS (${d3.level.toUpperCase()})`,
    "",
    d3.highRiskMeds.length > 0 ? `High-risk medications identified:` : "",
    ...d3.highRiskMeds.map(m=>`  ⚠ ${m}`),
    d3.modRiskMeds.length > 0 ? `Moderate-risk medications:` : "",
    ...d3.modRiskMeds.slice(0,4).map(m=>`  ! ${m}`),
    d3.ddiContrib ? `  ⊘ Critical or major drug-drug interaction identified — additional monitoring required.` : "",
    d3.override ? `  Note: Risk level manually overridden to ${d3.level.toUpperCase()}.` : "",
    "",
    `Risk assessment: ${d3.level==="high"?"Drug therapy requiring intensive monitoring or major surgery with risk factors.":d3.level==="moderate"?"Prescription drug management.":d3.level==="low"?"Over-the-counter medications.":"No medications or minimal risk."}`,
  ].filter(Boolean).join("\n");

  const summaryBlock = [
    `MEDICAL DECISION MAKING SUMMARY`,
    "",
    ptLine,
    `Records source: ${(sources??[]).join(", ")||"Not specified"}`,
    `Generated: ${checkedAt ? new Date(checkedAt).toLocaleString() : new Date().toLocaleString()}`,
    "",
    `Domain 1 (Problems):  ${d1.level.toUpperCase()}`,
    `Domain 2 (Data):      ${d2.level.toUpperCase()}`,
    `Domain 3 (Risk):      ${d3.level.toUpperCase()}`,
    `──────────────────────────────`,
    `Overall MDM:          ${overall.toUpperCase()}`,
    `E&M Code (${patientType==="ed"?"ED":patientType==="new"?"New Pt":"Est Pt"}): ${cpt}`,
    "",
    "Provider attestation: I have reviewed the above medical decision making documentation and it accurately reflects the complexity of this encounter.",
    "",
    "Signature: _________________________  Date: _______________",
  ].join("\n");

  const fullNote = [d1Block,"",d2Block,"",d3Block,"",summaryBlock].join("\n");
  return { d1Block, d2Block, d3Block, summaryBlock, fullNote, cpt };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HIPAA AUDIT + CHAIN OF CUSTODY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function genHIPAA(provRecord) {
  if (!provRecord) return "";
  const lines = [
    "LAKONYX ANAMNESIS — HIPAA ACCESS AUDIT RECORD",
    "=" .repeat(56),
    `Query ID:        ${provRecord.queryId}`,
    `Access Date:     ${new Date(provRecord.queryInitiatedAt).toLocaleString()}`,
    `Retrieval Method:${provRecord.retrievalMethod}`,
    `Data Sources:    ${provRecord.networkSources?.join(", ")||"—"}`,
    `FHIR Endpoint:   ${provRecord.fhirEndpoint}`,
    "",
    "IDENTITY VERIFICATION",
    "-".repeat(30),
    `Match Score:     ${provRecord.identityMatchScore!=null?`${provRecord.identityMatchScore}%`:"N/A"}`,
    `Match Level:     ${provRecord.identityMatchLevel??"N/A"}`,
    `Attested:        ${provRecord.identityAttested?"YES":"NO"}`,
    provRecord.attestedAt ? `Attested At:     ${new Date(provRecord.attestedAt).toLocaleString()}` : "",
    "",
    "RESOURCES ACCESSED",
    "-".repeat(30),
    ...Object.entries(provRecord.resourceSummary??{}).map(([k,v])=>`  ${k.padEnd(14)}: ${v}`),
    `  TOTAL          : ${provRecord.resourceCount??0}`,
    "",
    "AUDIT TRAIL",
    "-".repeat(30),
    ...(provRecord.auditLog??[]).map(e=>`  ${new Date(e.ts).toLocaleString("en-US",{dateStyle:"short",timeStyle:"medium"})}  ${e.event.replace(/_/g," ")}  ${e.detail}`),
    "",
    "─".repeat(56),
    "This record was generated by Lakonyx Anamnesis per HIPAA",
    "45 CFR §164.312(b) audit control standards.",
    "Retain for minimum 7 years per HIPAA §164.530(j).",
  ].filter(l=>l!==null);
  return lines.join("\n");
}

export function genCOC(provRecord) {
  if (!provRecord) return "";
  return [
    `Chain of Custody — Lakonyx Anamnesis`,
    `Query ID: ${provRecord.queryId}`,
    `Date: ${new Date(provRecord.queryInitiatedAt).toLocaleString()}`,
    `Method: ${provRecord.retrievalMethod} via ${provRecord.networkSources?.join(", ")||"—"}`,
    `Identity: ${provRecord.identityMatchScore!=null?`${provRecord.identityMatchScore}% (${provRecord.identityMatchLevel})`:"Document paste"}${provRecord.identityAttested?" — Clinician attested":""}`,
    `Resources: ${provRecord.resourceCount??0} total (${Object.entries(provRecord.resourceSummary??{}).map(([k,v])=>`${v} ${k}`).join(", ")})`,
    `Received: ${provRecord.recordsReceivedAt?new Date(provRecord.recordsReceivedAt).toLocaleString():"—"}`,
    provRecord.latencyMs ? `Latency: ${(provRecord.latencyMs/1000).toFixed(1)}s` : "",
    provRecord.importedToEncounter ? `Imported to encounter: ${new Date(provRecord.importedAt).toLocaleString()}` : "",
  ].filter(Boolean).join("\n");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchDocContent(url, token) {
  try {
    const r = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined, Accept:"*/*" },
    });
    if (!r.ok) return { type:"error", content:`HTTP ${r.status}: ${r.statusText}` };
    const ct = r.headers.get("content-type")??"";
    if (ct.includes("pdf")) {
      const blob = await r.blob();
      return { type:"pdf", objectUrl:URL.createObjectURL(blob), content:"[PDF — download to view]" };
    }
    const text = await r.text();
    return { type: ct.includes("xml")||text.trimStart().startsWith("<") ? "xml" : "text", content:text };
  } catch(e) {
    return { type:"error", content:`Fetch failed: ${e.message}` };
  }
}

export function decodeBase64Doc(data, contentType) {
  try {
    const text = atob(data);
    if (contentType?.includes("pdf")) return { type:"pdf", content:text };
    if (contentType?.includes("xml")||text.trimStart().startsWith("<")) return { type:"xml", content:text };
    return { type:"text", content:text };
  } catch(e) {
    return { type:"error", content:`Base64 decode failed: ${e.message}` };
  }
}

export function extractCCDAText(xml) {
  if (!xml) return "";
  return xml
    .replace(/<styleCode[^>]*>[^<]*<\/styleCode>/gi,"")
    .replace(/<[^>]+>/g," ")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ")
    .replace(/\s{3,}/g,"\n").replace(/\n{4,}/g,"\n\n").trim();
}