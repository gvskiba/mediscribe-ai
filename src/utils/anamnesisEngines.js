// anamnesisEngines.js
// Pure computation layer for Lakonyx Anamnesis.
// No React, no JSX. Safe to import in any context.
// Place at: @/utils/anamnesisEngines.js

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HG_SANDBOX    = "https://sandbox.healthgorilla.com";
export const RXNAV         = "https://rxnav.nlm.nih.gov/REST";
export const MAX_POLL_MS   = 90_000;
export const INIT_INTERVAL = 3_000;
export const MAX_INTERVAL  = 15_000;
export const BACKOFF       = 1.5;
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

const LOINC_TYPES = {
  "18842-5":{ label:"Discharge Summary",       priority:1, category:"summary"   },
  "18761-7":{ label:"Transfer Summary",        priority:1, category:"summary"   },
  "34111-5":{ label:"ED Note",                 priority:1, category:"ed"        },
  "28568-4":{ label:"ED Physician Note",       priority:1, category:"ed"        },
  "34878-9":{ label:"Emergency Medicine Note", priority:1, category:"ed"        },
  "11488-4":{ label:"Consult Note",            priority:2, category:"consult"   },
  "24611-6":{ label:"Outpatient Consult",      priority:2, category:"consult"   },
  "34117-2":{ label:"History & Physical",      priority:2, category:"hp"        },
  "18783-1":{ label:"Radiology Report",        priority:2, category:"radiology" },
  "79429-4":{ label:"Radiology Report",        priority:2, category:"radiology" },
  "11506-3":{ label:"Progress Note",           priority:3, category:"progress"  },
  "57017-6":{ label:"Operative Note",          priority:2, category:"procedure" },
  "11504-8":{ label:"Surgical Operation Note", priority:2, category:"procedure" },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED BRAND MAP (single source for DDI + RxNorm)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BRAND_MAP = {
  coumadin:"warfarin",jantoven:"warfarin",plavix:"clopidogrel",brilinta:"ticagrelor",
  eliquis:"apixaban",xarelto:"rivaroxaban",pradaxa:"dabigatran",savaysa:"edoxaban",
  lanoxin:"digoxin","toprol-xl":"metoprolol",toprol:"metoprolol",lopressor:"metoprolol",
  tenormin:"atenolol",coreg:"carvedilol",norvasc:"amlodipine",cardizem:"diltiazem",
  calan:"verapamil",lasix:"furosemide",aldactone:"spironolactone",
  zocor:"simvastatin",lipitor:"atorvastatin",crestor:"rosuvastatin",mevacor:"lovastatin",pravachol:"pravastatin",
  prilosec:"omeprazole",nexium:"esomeprazole",prevacid:"lansoprazole",protonix:"pantoprazole",aciphex:"rabeprazole",
  cipro:"ciprofloxacin",levaquin:"levofloxacin",avelox:"moxifloxacin",
  zithromax:"azithromycin",biaxin:"clarithromycin",eryc:"erythromycin",
  diflucan:"fluconazole",sporanox:"itraconazole",nizoral:"ketoconazole",
  flagyl:"metronidazole",bactrim:"trimethoprim",septra:"trimethoprim",
  nardil:"phenelzine",parnate:"tranylcypromine",emsam:"selegiline",marplan:"isocarboxazid",zyvox:"linezolid",
  prozac:"fluoxetine",zoloft:"sertraline",paxil:"paroxetine",lexapro:"escitalopram",celexa:"citalopram",
  effexor:"venlafaxine",cymbalta:"duloxetine",wellbutrin:"bupropion",
  depakote:"valproate",tegretol:"carbamazepine",dilantin:"phenytoin",
  neurontin:"gabapentin",lyrica:"pregabalin",lithobid:"lithium",
  haldol:"haloperidol",geodon:"ziprasidone",risperdal:"risperidone",seroquel:"quetiapine",
  abilify:"aripiprazole",zyprexa:"olanzapine",thorazine:"chlorpromazine",
  glucophage:"metformin",glucotrol:"glipizide",amaryl:"glimepiride",micronase:"glyburide",
  advil:"ibuprofen",motrin:"ibuprofen",aleve:"naproxen",indocin:"indomethacin",
  voltaren:"diclofenac",celebrex:"celecoxib",mobic:"meloxicam",
  theo:"theophylline",uniphyl:"theophylline",
  demerol:"meperidine",dilaudid:"hydromorphone",duragesic:"fentanyl",oxycontin:"oxycodone",
  vicodin:"hydrocodone",suboxone:"buprenorphine",
  ativan:"lorazepam",valium:"diazepam",xanax:"alprazolam",klonopin:"clonazepam",versed:"midazolam",
  rheumatrex:"methotrexate",imuran:"azathioprine",cellcept:"mycophenolate",
  cordarone:"amiodarone",pacerone:"amiodarone",tikosyn:"dofetilide",multaq:"dronedarone",
  imitrex:"sumatriptan",maxalt:"rizatriptan",zomig:"zolmitriptan",
  synthroid:"levothyroxine",zofran:"ondansetron",singulair:"montelukast",
  prinivil:"lisinopril",zestril:"lisinopril",vasotec:"enalapril",altace:"ramipril",
  cozaar:"losartan",diovan:"valsartan",avapro:"irbesartan",benicar:"olmesartan",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FHIR BUNDLE PARSER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function parseFHIRBundle(bundle) {
  const res = (bundle?.entry ?? []).map(e => e.resource).filter(Boolean);
  const by  = (t) => res.filter(r => r.resourceType === t);
  const pt  = by("Patient")[0] ?? {};

  const patient = {
    firstName: pt.name?.[0]?.given?.[0] ?? "",
    lastName:  pt.name?.[0]?.family    ?? "",
    dob:       pt.birthDate            ?? "",
    mrn:       pt.identifier?.find(i => i.type?.coding?.[0]?.code === "MR")?.value ?? "",
    id:        pt.id ?? "",
  };

  const visits = by("Encounter")
    .filter(e => ["EMER","IMP","AMB"].includes(e.class?.code))
    .map(e => ({
      fhirId: e.id ?? null, date: (e.period?.start ?? "").slice(0,10),
      cc: e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? "Visit",
      dx: e.diagnosis?.[0]?.condition?.display ?? "",
      dispo: e.hospitalization?.dischargeDisposition?.text ?? "DC home",
      src: e.serviceProvider?.display ?? "External",
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,10);

  const medications = by("MedicationRequest").filter(m => m.status==="active").map(m => ({
    fhirId: m.id ?? null,
    name: m.medicationCodeableConcept?.text ?? m.medicationReference?.display ?? "",
    dose: (() => { const d=m.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity; return d?`${d.value??""} ${d.unit??""}`.trim():""; })(),
    freq: m.dosageInstruction?.[0]?.timing?.code?.text ?? m.dosageInstruction?.[0]?.text ?? "",
    src:  m.requester?.display ?? m.performer?.[0]?.display ?? "",
  }));

  const allergies = by("AllergyIntolerance").map(a => ({
    fhirId: a.id ?? null,
    name: a.code?.text ?? a.code?.coding?.[0]?.display ?? "",
    sev:  a.reaction?.[0]?.severity ?? "unknown",
    rxn:  a.reaction?.[0]?.manifestation?.[0]?.text ?? "",
    src:  a.recorder?.display ?? a.asserter?.display ?? "",
  }));

  const problems = by("Condition").filter(c => c.clinicalStatus?.coding?.[0]?.code==="active").map(c => ({
    fhirId: c.id ?? null,
    name: c.code?.text ?? c.code?.coding?.[0]?.display ?? "",
    icd:  c.code?.coding?.find(cd => cd.system?.toLowerCase().includes("icd"))?.code ?? "",
    src:  c.recorder?.display ?? c.asserter?.display ?? "",
  }));

  const labs = by("Observation")
    .filter(o => o.category?.[0]?.coding?.[0]?.code==="laboratory" && o.valueQuantity)
    .map(o => ({
      fhirId: o.id ?? null,
      name: o.code?.text ?? o.code?.coding?.[0]?.display ?? "",
      val:  `${o.valueQuantity?.value??""} ${o.valueQuantity?.unit??""}`.trim(),
      ref:  o.referenceRange?.[0]?.text ?? "",
      flag: o.interpretation?.[0]?.coding?.[0]?.code ?? "N",
      date: (o.effectiveDateTime??"").slice(0,10),
      src:  o.performer?.[0]?.display ?? "",
    }))
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0,15);

  const documents = by("DocumentReference")
    .filter(d => ["current","superseded"].includes(d.status))
    .map(d => {
      const loincCode = d.type?.coding?.find(c => c.system?.toLowerCase().includes("loinc"))?.code ?? null;
      const typeInfo  = LOINC_TYPES[loincCode] ?? null;
      const att       = d.content?.[0]?.attachment ?? {};
      return {
        fhirId: d.id ?? null, loincCode,
        typeLabel:   typeInfo?.label ?? d.type?.coding?.[0]?.display ?? "Clinical Document",
        category:    typeInfo?.category ?? "other",
        priority:    typeInfo?.priority ?? 4,
        status:      d.status,
        date:        (d.date ?? d.context?.period?.start ?? "").slice(0,10),
        author:      d.author?.[0]?.display ?? "",
        description: d.description ?? att.title ?? "",
        contentType: att.contentType ?? "text/plain",
        url:         att.url ?? null,
        data:        att.data ?? null,
        size:        att.size ?? null,
        src:         d.custodian?.display ?? "",
        isCCDA:      (att.contentType??"").includes("xml")||(att.contentType??"").includes("cda"),
        isPDF:       (att.contentType??"").includes("pdf"),
        isRadiology: typeInfo?.category === "radiology",
      };
    })
    .sort((a,b) => a.priority - b.priority || b.date.localeCompare(a.date)).slice(0,20);

  return { patient, visits, medications, allergies, problems, labs, documents };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH GORILLA AUTH
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
// IDENTITY MATCHER (Fellegi-Sunter · Jaro-Winkler · Soundex · Nicknames)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function _jaro(a,b){if(a===b)return 1;const la=a.length,lb=b.length;if(!la||!lb)return 0;const md=Math.max(Math.floor(Math.max(la,lb)/2)-1,0);const aM=new Array(la).fill(false),bM=new Array(lb).fill(false);let m=0;for(let i=0;i<la;i++){for(let j=Math.max(0,i-md);j<Math.min(i+md+1,lb);j++){if(bM[j]||a[i]!==b[j])continue;aM[i]=bM[j]=true;m++;break;}}if(!m)return 0;let t=0,k=0;for(let i=0;i<la;i++){if(!aM[i])continue;while(!bM[k])k++;if(a[i]!==b[k])t++;k++;}return(m/la+m/lb+(m-t/2)/m)/3;}
function _jw(s1,s2){const a=(s1??"").toUpperCase().trim(),b=(s2??"").toUpperCase().trim();if(!a||!b)return 0;const j=_jaro(a,b);let p=0;for(let i=0;i<Math.min(4,Math.min(a.length,b.length));i++){if(a[i]===b[i])p++;else break;}return Math.min(j+p*0.1*(1-j),1);}
const _SDX={B:1,F:1,P:1,V:1,C:2,G:2,J:2,K:2,Q:2,S:2,X:2,Z:2,D:3,T:3,L:4,M:5,N:5,R:6};
function _sdx(r=""){const s=r.toUpperCase().replace(/[^A-Z]/g,"");if(!s)return"0000";let c=s[0],p=_SDX[s[0]]??0;for(let i=1;i<s.length&&c.length<4;i++){const v=_SDX[s[i]]??0;if(v&&v!==p)c+=v;p=v;}return c.padEnd(4,"0");}
const _NK={WILLIAM:["BILL","BILLY","WILL","LIAM"],ROBERT:["BOB","BOBBY","ROB"],JAMES:["JIM","JIMMY","JAMIE"],JOHN:["JOHNNY","JACK","JON"],CHARLES:["CHARLIE","CHUCK"],RICHARD:["RICK","RICH","DICK"],THOMAS:["TOM","TOMMY"],JOSEPH:["JOE","JOEY"],MICHAEL:["MIKE","MICK"],DAVID:["DAVE"],EDWARD:["ED","EDDIE","TED","NED"],HENRY:["HARRY","HANK"],SAMUEL:["SAM"],DANIEL:["DAN","DANNY"],MATTHEW:["MATT"],ANDREW:["ANDY","DREW"],CHRISTOPHER:["CHRIS"],ANTHONY:["TONY"],STEPHEN:["STEVE"],TIMOTHY:["TIM"],PATRICK:["PAT"],ELIZABETH:["BETH","BETTY","LIZ","LISA","ELLIE"],KATHERINE:["KATE","KATHY","KAT"],MARGARET:["MAGGIE","PEG","MEG"],MARY:["MOLLY","MAE"],PATRICIA:["PAT","TRISH"],BARBARA:["BARB"],JENNIFER:["JEN","JENNY"],JESSICA:["JESS"],MELISSA:["MEL"],DEBORAH:["DEB","DEBBIE"],ALEXANDER:["ALEX","ALEC"],NICHOLAS:["NICK","NICO"]};
const _NR={};for(const[l,ns]of Object.entries(_NK))for(const n of ns){if(!_NR[n])_NR[n]=[];_NR[n].push(l);}
function _nick(a,b){const A=(a??"").toUpperCase().trim(),B=(b??"").toUpperCase().trim();if(A===B)return true;if(_NK[A]?.includes(B))return true;if(_NK[B]?.includes(A))return true;if(_NR[A]?.some(l=>l===B||_NK[B]?.includes(l)))return true;if(_NR[B]?.some(l=>l===A||_NK[A]?.includes(l)))return true;return false;}

function _scoreLast(q,p){const a=(q??"").toUpperCase().trim(),b=(p??"").toUpperCase().trim();if(!a||!b)return{sim:0,label:"Missing",detail:"Last name absent",phonetic:false};const jw=_jw(a,b),ph=_sdx(a)===_sdx(b);const aP=a.split(/[-\s]+/),bP=b.split(/[-\s]+/);let pm=jw;for(const ap of aP)for(const bp of bP)pm=Math.max(pm,_jw(ap,bp));const sim=Math.min(pm+(ph&&pm<0.8?0.08:0),1);const label=sim>=0.95?"Exact":sim>=0.85?"Close match":sim>=0.70?"Partial":ph?"Phonetic only":"Poor match";const detail=ph&&sim<0.85?`Soundex match (${_sdx(a)}=${_sdx(b)}) — likely spelling variant`:sim<0.7?"Names differ significantly":`JW ${(sim*100).toFixed(0)}%`;return{sim,label,detail,phonetic:ph};}
function _scoreFirst(q,p){const a=(q??"").toUpperCase().trim(),b=(p??"").toUpperCase().trim();if(!a||!b)return{sim:0,label:"Missing",detail:"First name absent",phonetic:false};const jw=_jw(a,b),ph=_sdx(a)===_sdx(b),nick=_nick(a,b),init=a.length===1&&b.startsWith(a);let sim=jw;if(nick&&sim<0.9)sim=Math.max(sim,0.82);if(ph&&sim<0.8)sim=Math.max(sim,0.70);if(init)sim=Math.max(sim,0.65);sim=Math.min(sim,1);const label=sim>=0.95?"Exact":nick?"Nickname match":sim>=0.85?"Close match":sim>=0.70?"Partial":ph?"Phonetic only":"Poor match";const detail=nick?`Nickname (${a} ↔ ${b})`:ph&&sim<0.85?"Soundex match — possible variant":init?`Initial '${a}' matches '${b}'`:`JW ${(sim*100).toFixed(0)}%`;return{sim,label,detail,phonetic:ph,nickname:nick};}
function _scoreDOB(q,p){const a=(q??"").trim(),b=(p??"").trim();if(!a||!b)return{sim:0,label:"Missing",detail:"DOB absent",transposed:false};const pd=s=>{const c=s.replace(/\//g,"-"),pt=c.split("-");if(pt.length===3){if(pt[0].length===4)return{y:pt[0],m:pt[1].padStart(2,"0"),d:pt[2].padStart(2,"0")};if(pt[2].length===4)return{y:pt[2],m:pt[0].padStart(2,"0"),d:pt[1].padStart(2,"0")};}return null;};const da=pd(a),db=pd(b);if(!da||!db)return{sim:0.1,label:"Unparseable",detail:"Could not parse date",transposed:false};if(da.y===db.y&&da.m===db.m&&da.d===db.d)return{sim:1.0,label:"Exact",detail:"DOB matches exactly",transposed:false};if(da.y===db.y&&da.m===db.d&&da.d===db.m)return{sim:0.82,label:"Transposed",detail:"Month/day appear swapped — common entry error",transposed:true};const yd=Math.abs(parseInt(da.y)-parseInt(db.y));if(yd===1&&da.m===db.m&&da.d===db.d)return{sim:0.72,label:"±1 year",detail:`Year differs by 1 (${da.y} vs ${db.y})`,transposed:false};if(da.y===db.y&&da.m===db.m)return{sim:0.55,label:"Same year/month",detail:"Year and month match, day differs",transposed:false};if(da.y===db.y)return{sim:0.38,label:"Same year only",detail:"Only birth year matches",transposed:false};return{sim:0.0,label:"No match",detail:`DOB mismatch: ${a} vs ${b}`,transposed:false};}
function _scoreMRN(q,p){const a=(q??"").trim(),b=(p??"").trim();if(!a)return{sim:null,label:"Not provided",detail:"MRN not entered",provided:false};if(!b)return{sim:0.5,label:"No MRN in record",detail:"MRN provided but absent from record",provided:true};if(a===b)return{sim:1.0,label:"Exact",detail:"MRN matches exactly",provided:true};if(_jw(a,b)>=0.92)return{sim:0.6,label:"Near match",detail:`MRN similar but not exact (${a} vs ${b})`,provided:true};return{sim:0.0,label:"Mismatch",detail:`MRN does not match (${a} vs ${b}) — wrong-patient signal`,provided:true};}

export function scoreIdentity(query, fhirPt) {
  const last=_scoreLast(query.lastName,fhirPt.lastName);
  const first=_scoreFirst(query.firstName,fhirPt.firstName);
  const dob=_scoreDOB(query.dob,fhirPt.dob);
  const mrn=_scoreMRN(query.mrn,fhirPt.mrn);
  const mrnP=mrn.provided;
  const W=mrnP?{last:20,first:15,dob:25,mrn:40}:{last:32,first:26,dob:36,mrn:0};
  const tot=Object.values(W).reduce((a,b)=>a+b,0);
  let raw=(last.sim*W.last+first.sim*W.first+dob.sim*W.dob+(mrnP?(mrn.sim??0)*W.mrn:0))/tot*100;
  if(mrnP&&mrn.sim===1.0)raw=Math.min(raw+6,100);
  if(mrnP&&mrn.sim===0.0)raw=Math.max(raw-30,0);
  const score=Math.round(Math.min(raw,100));
  let level,canView,canImport,requiresAttestation,color,blockReason;
  if(score>=92){level="CONFIRMED";canView=true;canImport=true;requiresAttestation=false;color="#00d4a8";blockReason=null;}
  else if(score>=80){level="REVIEW";canView=true;canImport=true;requiresAttestation=false;color="#e8b84b";blockReason=null;}
  else if(score>=65){level="CAUTION";canView=true;canImport=false;requiresAttestation=true;color="#e8a838";blockReason="Identity confidence below threshold. Clinician attestation required before importing records.";}
  else{level="BLOCKED";canView=false;canImport=false;requiresAttestation=false;color="#f06060";blockReason="Identity match score below safe threshold (65). Records cannot be viewed or imported.";}
  const warnings=[];
  if(dob.transposed)warnings.push("⚠ Month/day transposition detected in DOB — verify with patient");
  if(mrnP&&mrn.sim===0.0)warnings.push("⚠ MRN mismatch — significant wrong-patient risk");
  if(last.phonetic&&last.sim<0.80)warnings.push("⚠ Last name matched phonetically only — possible spelling variant");
  if(first.nickname)warnings.push("ℹ First name matched as nickname/preferred name");
  if(!query.mrn)warnings.push("ℹ MRN not provided — adding MRN improves confidence");
  return{score,level,color,canView,canImport,requiresAttestation,blockReason,warnings,fields:{last,first,dob,mrn},weights:W,mrnProvided:mrnP};
}

export function extractFHIRDemog(pt) {
  return{firstName:pt?.name?.[0]?.given?.[0]??"",lastName:pt?.name?.[0]?.family??"",dob:pt?.birthDate??"",mrn:pt?.identifier?.find(i=>i.type?.coding?.[0]?.code==="MR")?.value??"",id:pt?.id??""};
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RXNORM NORMALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const _rxcuiCache=new Map(),_ingCache=new Map();
function _cleanMed(raw=""){let s=raw.toLowerCase().trim();s=s.replace(/\d+\.?\d*\s*(mg|mcg|g|ml|meq|iu|units?|%)/gi,"");s=s.replace(/\b(hfa|er|xr|xl|sr|ir|cr|la|dr|ds|ec|tablet|capsule|injection|topical|oral|nasal|inhaler|patch|spray|solution|suspension)\b/gi," ");s=s.replace(/\b(sodium|potassium|chloride|sulfate|succinate|tartrate|maleate|fumarate|acetate|phosphate|hydrochloride|bromide|citrate|anhydrous|besylate|mesylate)\b/gi," ");s=s.replace(/\b(daily|twice|bid|tid|prn|po|iv|im|sc|inh)\b/gi," ");s=s.replace(/\s+/g," ").trim().split(/[,/;(]/)[0].trim();const k=s.replace(/\s+/g,"-").toLowerCase();return BRAND_MAP[k]||BRAND_MAP[s.split(" ")[0].toLowerCase()]||s;}
async function _rxFetch(url){try{const r=await fetch(url,{signal:AbortSignal.timeout(6000)});if(!r.ok)return null;return await r.json();}catch{return null;}}
async function _lookupRxCUI(raw){const c=_cleanMed(raw);if(!c||c.length<2)return null;if(_rxcuiCache.has(c))return _rxcuiCache.get(c);const d=await _rxFetch(`${RXNAV}/rxcui.json?name=${encodeURIComponent(c)}&allsrc=0&search=1`);let cui=d?.idGroup?.rxnormId?.[0]??null;if(!cui){const a=await _rxFetch(`${RXNAV}/approximateTerm.json?term=${encodeURIComponent(c)}&maxEntries=1&option=1`);cui=a?.approximateGroup?.candidate?.[0]?.rxcui??null;}_rxcuiCache.set(c,cui);return cui;}
async function _resolveIng(rxcui){if(!rxcui)return null;if(_ingCache.has(rxcui))return _ingCache.get(rxcui);const d=await _rxFetch(`${RXNAV}/rxcui/${rxcui}/related.json?tty=IN`);const g=(d?.relatedGroup?.conceptGroup??[]).find(g=>g.tty==="IN");const c=g?.conceptProperties?.[0]??null;const r=c?{ingredientRxcui:c.rxcui,ingredientName:c.name.toLowerCase()}:null;_ingCache.set(rxcui,r);return r;}
async function _normOne(med){const raw=typeof med==="string"?med:(med?.name??"");const cleaned=_cleanMed(raw);const isNorm=cleaned!==raw.toLowerCase().trim();const rxcui=await _lookupRxCUI(raw);const ing=rxcui?await _resolveIng(rxcui):null;return{...(typeof med==="object"?med:{}),name:raw,cleanedName:cleaned,rxcui:rxcui??null,ingredientRxcui:ing?.ingredientRxcui??null,ingredientName:ing?.ingredientName??cleaned,isNormalized:isNorm,rxnormResolved:!!rxcui};}
export async function normalizeMedList(meds=[]){const items=meds.map(m=>typeof m==="string"?{name:m}:m);const res=await Promise.allSettled(items.map(m=>_normOne(m)));return res.map((r,i)=>r.status==="fulfilled"?r.value:{...items[i],cleanedName:_cleanMed(items[i].name??""),rxcui:null,ingredientRxcui:null,ingredientName:null,isNormalized:false,rxnormResolved:false});}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DDI ENGINE (ONCHigh / FDA Black Box / CredibleMeds)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function _nd(raw=""){let s=raw.toLowerCase().trim();s=s.replace(/\d+\.?\d*\s*(mg|mcg|g|ml|meq|iu|units?|%)/gi,"");s=s.replace(/\b(hfa|er|xr|xl|sr|tablet|capsule|oral|injection|patch|solution|sodium|potassium|chloride|sulfate|succinate|tartrate|hydrochloride|bromide|citrate)\b/gi," ");s=s.replace(/\s+/g," ").trim().split(/[,/;(]/)[0].trim();const k=s.replace(/\s+/g,"-").toLowerCase();return BRAND_MAP[k]||BRAND_MAP[s.split(" ")[0].toLowerCase()]||s;}

const _DDI=[
  {a:["maoi","phenelzine","tranylcypromine","isocarboxazid","selegiline"],b:["fluoxetine","sertraline","paroxetine","citalopram","escitalopram","venlafaxine","desvenlafaxine","duloxetine"],severity:"critical",class:"Serotonin Syndrome",effect:"Potentially fatal serotonin syndrome",mechanism:"Pharmacodynamic — combined serotonergic excess",management:"Contraindicated. Separate MAOI and SSRI/SNRI by ≥14 days (fluoxetine requires ≥5 weeks washout)."},
  {a:["maoi","phenelzine","tranylcypromine","isocarboxazid","selegiline"],b:["meperidine","demerol"],severity:"critical",class:"Serotonin Syndrome",effect:"Potentially fatal serotonin syndrome, hyperpyrexia, seizures",mechanism:"Pharmacodynamic",management:"Contraindicated."},
  {a:["maoi","phenelzine","tranylcypromine","isocarboxazid","selegiline"],b:["sumatriptan","rizatriptan","zolmitriptan","eletriptan"],severity:"critical",class:"Serotonin Syndrome",effect:"Potentially fatal serotonin syndrome",mechanism:"Pharmacodynamic",management:"Contraindicated. Do not use triptans within 14 days of MAOIs."},
  {a:["linezolid"],b:["fluoxetine","sertraline","paroxetine","citalopram","escitalopram","venlafaxine","duloxetine"],severity:"critical",class:"Serotonin Syndrome",effect:"Potentially fatal serotonin syndrome — linezolid is a weak MAOI",mechanism:"Pharmacodynamic",management:"Contraindicated. Discontinue SSRI/SNRI ≥2 weeks before linezolid if possible."},
  {a:["amiodarone","sotalol","dofetilide","dronedarone"],b:["azithromycin","clarithromycin","erythromycin","ciprofloxacin","levofloxacin","moxifloxacin","haloperidol","quetiapine","ziprasidone","chlorpromazine"],severity:"critical",class:"QT Prolongation / TdP",effect:"Additive QT prolongation → Torsades de Pointes",mechanism:"Pharmacodynamic — combined HERG channel blockade",management:"Contraindicated in most cases. ECG monitoring mandatory if unavoidable. Correct K⁺/Mg²⁺."},
  {a:["dofetilide"],b:["verapamil","diltiazem","cimetidine","trimethoprim","hydrochlorothiazide"],severity:"critical",class:"QT Prolongation / TdP",effect:"Dramatically elevated dofetilide levels → TdP",mechanism:"Pharmacokinetic — renal tubular secretion inhibition",management:"Contraindicated."},
  {a:["morphine","oxycodone","hydrocodone","fentanyl","hydromorphone","methadone","tramadol","meperidine","buprenorphine"],b:["lorazepam","diazepam","alprazolam","clonazepam","triazolam","midazolam","temazepam"],severity:"critical",class:"Opioid + Benzodiazepine (Black Box)",effect:"Profound CNS/respiratory depression → potentially fatal respiratory arrest",mechanism:"Pharmacodynamic — additive CNS depression",management:"FDA Black Box Warning. Use only when alternatives inadequate. Lowest effective doses. Have naloxone available."},
  {a:["warfarin"],b:["fluconazole","voriconazole","itraconazole","ketoconazole"],severity:"critical",class:"Anticoagulant — Azole Antifungal",effect:"Markedly elevated warfarin → severe bleeding",mechanism:"Pharmacokinetic — CYP2C9/3A4 inhibition",management:"Avoid if possible. Reduce warfarin 25–50%, monitor INR every 2–3 days."},
  {a:["warfarin"],b:["metronidazole","flagyl","tinidazole"],severity:"critical",class:"Anticoagulant — Antibiotic",effect:"INR increases 2–3× → major bleeding",mechanism:"Pharmacokinetic — CYP2C9 inhibition",management:"Avoid if possible. Monitor INR every 2–3 days."},
  {a:["methadone"],b:["ciprofloxacin","levofloxacin","moxifloxacin","azithromycin","clarithromycin","haloperidol","quetiapine"],severity:"critical",class:"Methadone — QT Prolongation",effect:"QT prolongation → Torsades de Pointes",mechanism:"Pharmacodynamic — additive QT prolongation",management:"Obtain baseline ECG. Avoid QT-prolonging drugs. Correct electrolytes."},
  {a:["warfarin"],b:["amiodarone"],severity:"major",class:"Anticoagulant — Antiarrhythmic",effect:"Markedly elevated warfarin effect; risk persists weeks after amiodarone stops",mechanism:"Pharmacokinetic — CYP2C9 inhibition (amiodarone t½ = 40–55 days)",management:"Reduce warfarin 30–50% when starting amiodarone. Monitor INR weekly × 4 weeks."},
  {a:["warfarin"],b:["aspirin","ibuprofen","naproxen","indomethacin","celecoxib","diclofenac","meloxicam"],severity:"major",class:"Anticoagulant — NSAID",effect:"Increased bleeding: antiplatelet + GI mucosal injury",mechanism:"Pharmacodynamic + pharmacokinetic",management:"Avoid regular NSAID use. If aspirin required (cardiac), use 81 mg with PPI."},
  {a:["warfarin"],b:["ciprofloxacin","levofloxacin","moxifloxacin","trimethoprim","sulfamethoxazole"],severity:"major",class:"Anticoagulant — Antibiotic",effect:"INR elevation → bleeding risk",mechanism:"Pharmacokinetic",management:"Monitor INR 2–3 days after antibiotic start. Anticipate 10–30% dose reduction."},
  {a:["warfarin"],b:["carbamazepine","rifampin","phenobarbital"],severity:"major",class:"Anticoagulant — Enzyme Inducer",effect:"Reduced warfarin effect → thrombosis risk",mechanism:"Pharmacokinetic — CYP induction",management:"Anticipate warfarin dose increase 30–50%+. Monitor INR frequently."},
  {a:["apixaban","rivaroxaban","edoxaban","dabigatran"],b:["aspirin","ibuprofen","naproxen","diclofenac","celecoxib"],severity:"major",class:"DOAC — NSAID",effect:"Significantly increased bleeding including GI hemorrhage",mechanism:"Pharmacodynamic",management:"Avoid concurrent use. Add PPI if required. Limit aspirin to 81 mg/day."},
  {a:["clopidogrel"],b:["omeprazole","esomeprazole"],severity:"major",class:"Antiplatelet — PPI",effect:"Reduced clopidogrel antiplatelet effect by up to 50%",mechanism:"Pharmacokinetic — CYP2C19 inhibition",management:"Avoid omeprazole/esomeprazole with clopidogrel. Use pantoprazole or rabeprazole."},
  {a:["digoxin"],b:["amiodarone","dronedarone"],severity:"major",class:"Digoxin — Antiarrhythmic",effect:"Digoxin toxicity — levels rise 70–100%",mechanism:"Pharmacokinetic — P-gp inhibition",management:"Reduce digoxin 50% when starting amiodarone. Monitor levels and ECG."},
  {a:["digoxin"],b:["verapamil","diltiazem"],severity:"major",class:"Digoxin — CCB",effect:"Elevated digoxin levels + additive AV nodal depression",mechanism:"Pharmacokinetic + pharmacodynamic",management:"Reduce digoxin dose. Monitor levels and ECG."},
  {a:["digoxin"],b:["clarithromycin","erythromycin","azithromycin"],severity:"major",class:"Digoxin — Macrolide",effect:"Digoxin toxicity from elevated levels",mechanism:"Pharmacokinetic — P-gp inhibition",management:"Monitor digoxin levels closely during and after macrolide course."},
  {a:["morphine","oxycodone","hydrocodone","fentanyl","hydromorphone","methadone","tramadol"],b:["gabapentin","pregabalin"],severity:"major",class:"Opioid + Gabapentinoid",effect:"Enhanced respiratory depression; associated with fatal overdose",mechanism:"Pharmacodynamic — additive CNS depression",management:"FDA warnings. Use lowest doses. Monitor respiratory status."},
  {a:["lisinopril","enalapril","captopril","ramipril","losartan","valsartan","irbesartan","olmesartan"],b:["spironolactone","eplerenone","triamterene","amiloride"],severity:"major",class:"RAAS — Hyperkalemia",effect:"Potentially fatal hyperkalemia",mechanism:"Pharmacodynamic — combined potassium retention",management:"Monitor potassium at baseline and 1–2 weeks. Avoid if K⁺ >5.0."},
  {a:["methotrexate"],b:["trimethoprim","sulfamethoxazole"],severity:"major",class:"Methotrexate — Antifolate",effect:"Severe, potentially fatal bone marrow suppression",mechanism:"Pharmacodynamic — additive antifolate toxicity",management:"Contraindicated in most cases."},
  {a:["methotrexate"],b:["aspirin","ibuprofen","naproxen","indomethacin","celecoxib"],severity:"major",class:"Methotrexate — NSAID",effect:"Methotrexate toxicity: myelosuppression, mucositis, renal failure",mechanism:"Pharmacokinetic — NSAIDs reduce renal clearance",management:"Avoid NSAIDs with methotrexate."},
  {a:["theophylline","aminophylline"],b:["ciprofloxacin","levofloxacin"],severity:"major",class:"Theophylline — Fluoroquinolone",effect:"Theophylline toxicity — levels increase 30–90%",mechanism:"Pharmacokinetic — CYP1A2 inhibition",management:"Reduce theophylline 30–50% with ciprofloxacin. Monitor levels."},
  {a:["lithium"],b:["lisinopril","enalapril","captopril","losartan","valsartan"],severity:"major",class:"Lithium — RAAS",effect:"Lithium toxicity from decreased renal clearance",mechanism:"Pharmacokinetic",management:"Monitor lithium levels closely."},
  {a:["lithium"],b:["ibuprofen","naproxen","indomethacin","celecoxib","diclofenac"],severity:"major",class:"Lithium — NSAID",effect:"Lithium toxicity — levels rise 25–60%",mechanism:"Pharmacokinetic",management:"Avoid NSAIDs with lithium. Use acetaminophen."},
  {a:["simvastatin","lovastatin"],b:["amiodarone"],severity:"major",class:"Statin — Myopathy",effect:"Rhabdomyolysis — simvastatin dose must not exceed 20 mg",mechanism:"Pharmacokinetic — CYP3A4 inhibition",management:"FDA limits simvastatin ≤20 mg/day with amiodarone. Switch to pravastatin/rosuvastatin."},
  {a:["simvastatin","lovastatin","atorvastatin"],b:["clarithromycin","erythromycin","itraconazole","ketoconazole"],severity:"major",class:"Statin — CYP3A4 Inhibitor",effect:"Rhabdomyolysis from elevated statin levels",mechanism:"Pharmacokinetic — CYP3A4 inhibition",management:"Suspend statin during macrolide/azole course or switch to pravastatin/rosuvastatin."},
  {a:["fluoxetine","sertraline","paroxetine","citalopram","escitalopram","venlafaxine","duloxetine"],b:["aspirin","ibuprofen","naproxen","celecoxib"],severity:"moderate",class:"SSRI + NSAID — GI Bleeding",effect:"3–15× increased GI bleeding risk",mechanism:"Pharmacodynamic — combined platelet and mucosal effects",management:"Add PPI for gastroprotection. Prefer acetaminophen."},
  {a:["metoprolol","atenolol","carvedilol","bisoprolol","propranolol"],b:["verapamil","diltiazem"],severity:"major",class:"Beta-Blocker — Non-DHP CCB",effect:"Severe bradycardia, AV block, hypotension",mechanism:"Pharmacodynamic — additive negative chronotropy",management:"Avoid IV verapamil/diltiazem with beta-blockers. Oral combination requires close monitoring."},
];

function _staticDDI(names){const ixs=[];const norm=names.map(n=>({raw:n,n:_nd(n)}));for(let i=0;i<norm.length;i++)for(let j=i+1;j<norm.length;j++){const nA=norm[i].n,nB=norm[j].n;for(const r of _DDI){const aA=r.a.some(t=>nA.includes(t)||t.includes(nA));const bB=r.b.some(t=>nB.includes(t)||t.includes(nB));const aB=r.b.some(t=>nA.includes(t)||t.includes(nA));const bA=r.a.some(t=>nB.includes(t)||t.includes(nB));if((aA&&bB)||(aB&&bA)){const key=[norm[i].raw,norm[j].raw].sort().join("|");if(!ixs.some(x=>x.key===key&&x.class===r.class))ixs.push({key,drugA:norm[i].raw,drugB:norm[j].raw,severity:r.severity,class:r.class,effect:r.effect,mechanism:r.mechanism,management:r.management,source:"ONCHigh / FDA Black Box / CredibleMeds"});break;}}}return ixs;}

const _fdaC=new Map();
async function _fdaLabel(n){if(_fdaC.has(n))return _fdaC.get(n);try{const r=await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(n)}"&limit=1`,{signal:AbortSignal.timeout(6000)});if(!r.ok){_fdaC.set(n,null);return null;}const d=await r.json();const l=d?.results?.[0]??null;_fdaC.set(n,l);return l;}catch{_fdaC.set(n,null);return null;}}
function _fdaMentions(label,n){if(!label)return false;const txt=[label.drug_interactions,label.warnings,label.boxed_warning].flat().filter(Boolean).join(" ").toLowerCase();const t=_nd(n);return t.length>3&&txt.includes(t);}

export async function runDDICheck(meds=[]) {
  const names=meds.map(m=>typeof m==="string"?m:m?.name??"").filter(Boolean);
  if(names.length<2)return{status:"ok",interactions:[],resolvedNames:names,fdaChecked:false,checkedAt:new Date().toISOString()};
  const staticHits=_staticDDI(names);
  const foundKeys=new Set(staticHits.map(x=>x.key));
  const norms=names.map(n=>({raw:n,n:_nd(n)}));
  const labels=await Promise.allSettled(norms.map(x=>_fdaLabel(x.n)));
  const fdaHits=[];
  for(let i=0;i<norms.length;i++)for(let j=i+1;j<norms.length;j++){const key=[norms[i].raw,norms[j].raw].sort().join("|");if(foundKeys.has(key))continue;const lA=labels[i].status==="fulfilled"?labels[i].value:null;const lB=labels[j].status==="fulfilled"?labels[j].value:null;const mA=_fdaMentions(lA,norms[j].n),mB=_fdaMentions(lB,norms[i].n);if(mA||mB)fdaHits.push({key,drugA:norms[i].raw,drugB:norms[j].raw,severity:"moderate",class:"FDA Label Mention",effect:`${mA?norms[i].raw:norms[j].raw} FDA label references ${mA?norms[j].raw:norms[i].raw}`,mechanism:"See FDA label",management:"Review FDA-approved label. Consult clinical pharmacist.",source:"OpenFDA (api.fda.gov)"});}
  const SEV={critical:0,major:1,moderate:2,minor:3};
  const all=[...staticHits,...fdaHits].sort((a,b)=>(SEV[a.severity]??9)-(SEV[b.severity]??9));
  const hC=all.some(i=>i.severity==="critical"),hM=all.some(i=>i.severity==="major");
  return{status:all.length===0?"clean":hC?"critical":hM?"major":"warn",interactions:all,resolvedNames:names,fdaChecked:true,checkedAt:new Date().toISOString()};
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MDM ENGINE (AMA 2023 E&M Guidelines)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MDM_LEVELS=["minimal","low","moderate","high"];
export const MDM_RANK={minimal:0,low:1,moderate:2,high:3};
export const MDM_CPT={new:{minimal:"99202",low:"99203",moderate:"99204",high:"99205"},established:{minimal:"99212",low:"99213",moderate:"99214",high:"99215"},ed:{minimal:"99281",low:"99282",moderate:"99283",high:"99285"}};
const _MDM_HR=["warfarin","heparin","enoxaparin","apixaban","rivaroxaban","dabigatran","edoxaban","insulin","glipizide","glimepiride","glyburide","digoxin","lithium","theophylline","phenytoin","carbamazepine","valproate","cyclosporine","tacrolimus","methotrexate","azathioprine","mycophenolate","amiodarone","sotalol","dofetilide","dronedarone","flecainide","clozapine","morphine","oxycodone","hydrocodone","fentanyl","methadone","buprenorphine","hydromorphone","tramadol"];
function _isHR(n=""){const s=n.toLowerCase();return _MDM_HR.some(h=>s.includes(h)||h.includes(s));}

export function d1Score({problems=[],presentingProblem=null}){const c=problems.length;if(presentingProblem){const m={self_limited:"low",stable_chronic:"low",new_undiagnosed:"moderate",acute_systemic:"moderate",acute_complicated:"moderate",chronic_exacerbation:"moderate",multiple_chronic:"moderate",severe_exacerbation:"high",threat_to_life:"high"};return{level:m[presentingProblem]??"low",chronicCount:c,presentingProblem};}let s="minimal";if(c>=3)s="moderate";else if(c>=1)s="low";return{level:s,chronicCount:c,presentingProblem:null,isSuggested:true};}
export function d2Score({visits=[],labs=[],medications=[],sources=[],hasCategory2=false,hasCategory3=false}){const cat1=visits.length>0||labs.length>0||medications.length>0;const cats=[];if(cat1)cats.push(1);if(hasCategory2)cats.push(2);if(hasCategory3)cats.push(3);const n=cats.length,h3=cats.includes(3),h2=cats.includes(2),h1=cats.includes(1);let level="minimal";if(h3&&(h2||h1))level="high";else if(h2&&h1)level="high";else if(h3||n>=2)level="moderate";else if(n>=1)level="low";return{level,category1:cat1,hasCategory2,hasCategory3,satisfiedCategories:cats,externalRecordCount:visits.length,externalLabCount:labs.length,sourceList:[...new Set(sources)].filter(Boolean),visitDates:visits.slice(0,3).map(v=>v.date).filter(Boolean)};}
export function d3Score({medications=[],medNorm=[],ddiState=null,riskOverride=null}){if(riskOverride)return{level:riskOverride,highRiskMeds:[],rationale:"Provider-specified",criticalDDIs:[]};const pool=medNorm.length>0?medNorm:medications;const hrM=pool.filter(m=>_isHR(m.ingredientName??m.cleanedName??(typeof m==="string"?m:m.name??"")));const uniq=[...new Map(hrM.map(m=>[m.ingredientName??m.cleanedName??m.name,m])).values()];const critDDIs=ddiState?.interactions?.filter(i=>i.severity==="critical")??[];let level="minimal",rationale="";if(uniq.length>0){level="high";rationale=`Patient prescribed ${uniq.length} high-risk medication(s) requiring intensive monitoring: ${uniq.map(m=>m.ingredientName??m.cleanedName??m.name).join(", ")}.`;}else if(medications.length>0){level="moderate";rationale=`Prescription drug management addressed for ${medications.length} active medication(s).`;}else{level="low";rationale="No high-risk medications identified.";}if(critDDIs.length>0&&level!=="high"){level="high";rationale+=` Critical DDI(s): ${critDDIs.map(i=>`${i.drugA} + ${i.drugB}`).join("; ")}.`;}return{level,highRiskMeds:uniq,rationale,criticalDDIs:critDDIs};}
export function overallMDM(d1,d2,d3){const ranks=[d1,d2,d3].map(l=>MDM_RANK[l]??0).sort((a,b)=>a-b);return MDM_LEVELS[ranks[1]]??"minimal";}

export function genMDMNote({d1,d2,d3,overall,data,sources=[],patientType="ed",checkedAt=new Date().toISOString()}){
  const date=new Date(checkedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const srcStr=d2.sourceList?.length?d2.sourceList.join(" and "):(sources.join(" and ")||"external health system");
  const probs=(data?.problems??[]).map(p=>p.name??p).filter(Boolean);
  const probSentence=probs.length?`The patient has ${probs.length} documented active chronic condition${probs.length!==1?"s":""}: ${probs.slice(0,5).join(", ")}${probs.length>5?`, and ${probs.length-5} more`:""}. `:"";
  const d1txt={minimal:"Minimal complexity. Self-limited or minor problem addressed.",low:`Low complexity. ${probSentence}Stable chronic illness addressed.`,moderate:`Moderate complexity. ${probSentence}${d1.presentingProblem==="new_undiagnosed"?"New problem with uncertain diagnosis.":d1.presentingProblem==="chronic_exacerbation"?"Chronic illness with exacerbation.":d1.presentingProblem==="acute_systemic"?"Acute illness with systemic symptoms.":"Multiple chronic conditions addressed."}`,high:`High complexity. ${probSentence}${d1.presentingProblem==="threat_to_life"?"Acute or chronic illness posing threat to life or bodily function.":"Chronic illness with severe exacerbation or side effects of treatment."}`};
  const recParts=[];
  if(d2.category1){const vS=d2.externalRecordCount>0?`${d2.externalRecordCount} prior encounter${d2.externalRecordCount!==1?"s":""}${d2.visitDates?.length?` (most recent: ${d2.visitDates[0]})`:""}`:"";const lS=d2.externalLabCount>0?`${d2.externalLabCount} external laboratory result${d2.externalLabCount!==1?"s":""}`:"";;const mS=(data?.medications?.length??0)>0?`${data.medications.length} active medication${data.medications.length!==1?"s":""}`:"";;const parts=[vS,lS,mS].filter(Boolean);recParts.push(`External medical records reviewed via FHIR network (Carequality/CommonWell) on ${date}. Records obtained from ${srcStr}.${parts.length?" Records reviewed included "+parts.join(", ")+".":" "}`);}
  if(d2.hasCategory2)recParts.push("Independent interpretation of external test result(s) performed.");
  if(d2.hasCategory3)recParts.push("Discussion with external physician or qualified health professional regarding patient management.");
  const d2txt={minimal:"Minimal data. No external records reviewed.",low:`Low complexity data. ${recParts.join(" ")}`,moderate:`Moderate complexity data. ${recParts.join(" ")}`,high:`High complexity data. ${recParts.join(" ")}`};
  const hrNames=d3.highRiskMeds?.map(m=>m.ingredientName??m.cleanedName??m.name).filter(Boolean)??[];
  const ddiStr=d3.criticalDDIs?.length?` Critical DDI${d3.criticalDDIs.length!==1?"s":""}: ${d3.criticalDDIs.map(i=>`${i.drugA} + ${i.drugB} (${i.class})`).join("; ")}.`:"";
  const d3txt={minimal:"Minimal risk. Over-the-counter medications only.",low:`Low risk. ${d3.rationale}`,moderate:`Moderate risk. Prescription drug management addressed. ${d3.rationale}`,high:`High risk. ${hrNames.length>0?`Patient prescribed drug therapy requiring intensive monitoring: ${hrNames.join(", ")}.`:""}${ddiStr} ${d3.rationale??""}`};
  const cpt=MDM_CPT[patientType]?.[overall]??MDM_CPT.ed[overall];
  const d1b=`DOMAIN 1 — NUMBER AND COMPLEXITY OF PROBLEMS\n${d1txt[d1.level]??d1txt.moderate}`;
  const d2b=`DOMAIN 2 — AMOUNT AND COMPLEXITY OF DATA\n${d2txt[d2.level]??d2txt.low}`;
  const d3b=`DOMAIN 3 — RISK OF COMPLICATIONS AND/OR MORBIDITY\n${d3txt[d3.level]??d3txt.moderate}`;
  const sum=`OVERALL MDM: ${overall.toUpperCase()}\nDomain 1 (Problems): ${d1.level.toUpperCase()} | Domain 2 (Data): ${d2.level.toUpperCase()} | Domain 3 (Risk): ${d3.level.toUpperCase()}\nSuggested E&M: ${cpt} (${patientType==="ed"?"Emergency Department":patientType==="new"?"New Patient":"Established Patient"})\nMDM level determined by ≥2 of 3 domains meeting ${overall.toUpperCase()} per AMA 2023 E&M Guidelines.`;
  return{d1Block:d1b,d2Block:d2b,d3Block:d3b,summaryBlock:sum,fullNote:[d1b,d2b,d3b,sum].join("\n\n"),cpt,date};
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVENANCE ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function _n6(){return Math.random().toString(36).slice(2,8).toUpperCase();}
function _newQID(){const d=new Date();return`ANM-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${_n6()}`;}
function _dHash(l="",dob=""){const s=`${l.toLowerCase().trim()}|${dob.trim()}`;let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return`H${Math.abs(h).toString(16).toUpperCase().padStart(8,"0")}`;}

export function createProvRecord({retrievalMethod="async-fhir",networkSources=["Carequality","CommonWell"],fhirEndpoint="sandbox.healthgorilla.com",encounterCtx=null}={}){
  const id=_newQID();
  return{queryId:id,patientDemogHash:encounterCtx?_dHash(encounterCtx.lastName,encounterCtx.dob):null,retrievalMethod,networkSources,fhirEndpoint,fhirVersion:"R4",identityMatchScore:null,identityMatchLevel:null,identityAttested:false,attestedAt:null,queryInitiatedAt:new Date().toISOString(),recordsReceivedAt:null,latencyMs:null,resourceCount:0,resourceSummary:{visits:0,medications:0,allergies:0,problems:0,labs:0},resources:{visits:[],medications:[],allergies:[],problems:[],labs:[]},importedToEncounter:false,importedAt:null,encounterID:encounterCtx?.encounterID??null,auditLog:[{ts:new Date().toISOString(),event:"QUERY_INITIATED",detail:`Method: ${retrievalMethod} · Sources: ${networkSources.join(", ")}`}]};
}
export function provLog(rec,event,detail){return{...rec,auditLog:[...(rec.auditLog??[]),{ts:new Date().toISOString(),event,detail}]};}
export function provAttachMatch(rec,mr){if(!mr)return rec;return provLog({...rec,identityMatchScore:mr.score,identityMatchLevel:mr.level},"IDENTITY_VERIFIED",`Score: ${mr.score}/100 · Level: ${mr.level}${mr.warnings?.filter(w=>w.startsWith("⚠")).length?` · ${mr.warnings.filter(w=>w.startsWith("⚠")).join("; ")}`:""}`  );}
export function provAttachAttest(rec){const ts=new Date().toISOString();return provLog({...rec,identityAttested:true,attestedAt:ts},"PROVIDER_ATTESTED","Provider confirmed patient identity and accepted clinical responsibility.");}
export function provAttachResources(rec,parsed,ts=new Date().toISOString()){const{visits=[],medications=[],allergies=[],problems=[],labs=[]}=parsed;const count=visits.length+medications.length+allergies.length+problems.length+labs.length;const map=(items,rt)=>items.map(x=>({fhirId:x.fhirId??null,resourceType:rt,name:x.name??x.cc??"",source:x.src??"",date:x.date??null}));return provLog({...rec,recordsReceivedAt:ts,latencyMs:rec.queryInitiatedAt?new Date(ts)-new Date(rec.queryInitiatedAt):null,resourceCount:count,resourceSummary:{visits:visits.length,medications:medications.length,allergies:allergies.length,problems:problems.length,labs:labs.length},resources:{visits:map(visits,"Encounter"),medications:map(medications,"MedicationRequest"),allergies:map(allergies,"AllergyIntolerance"),problems:map(problems,"Condition"),labs:map(labs,"Observation")}},"RECORDS_RECEIVED",`${count} FHIR resources · ${visits.length} encounters · ${medications.length} meds · ${allergies.length} allergies · ${problems.length} problems · ${labs.length} labs`);}
export function provAttachImport(rec,{encounterID=null,domains=[]}={}){const ts=new Date().toISOString();return provLog({...rec,importedToEncounter:true,importedAt:ts,encounterID:encounterID??rec.encounterID},"IMPORTED_TO_ENCOUNTER",`Records imported${encounterID?` to encounter #${encounterID}`:""}.${domains.length?` Domains: ${domains.join(", ")}.`:""}`);}
export function genHIPAA(rec){const ts=s=>s?new Date(s).toLocaleString("en-US",{dateStyle:"long",timeStyle:"short"}):"—";const method={"async-fhir":"Async FHIR R4 $everything","paste-ai":"AI-parsed clinical document","session-cache":"Session cache"}[rec.retrievalMethod]??rec.retrievalMethod;return["═══════════════════════════════════════════════════════════════","LAKONYX ANAMNESIS — FHIR RECORD RETRIEVAL AUDIT ATTESTATION","═══════════════════════════════════════════════════════════════","",`Query ID:           ${rec.queryId}`,`Retrieval Method:   ${method}`,`Network Sources:    ${rec.networkSources?.join(", ")??"—"}`,`FHIR Version:       ${rec.fhirVersion??"R4"}  Endpoint: ${rec.fhirEndpoint??"—"}`,"","── TIMING ──────────────────────────────────────────────────────",`Query Initiated:    ${ts(rec.queryInitiatedAt)}`,`Records Received:   ${ts(rec.recordsReceivedAt)}`,`Retrieval Latency:  ${rec.latencyMs!=null?`${(rec.latencyMs/1000).toFixed(1)}s`:"—"}`,"","── IDENTITY VERIFICATION ───────────────────────────────────────",`Match Score:        ${rec.identityMatchScore!=null?`${rec.identityMatchScore}/100`:"N/A (paste mode)"}`,`Match Level:        ${rec.identityMatchLevel??"N/A"}`,`Provider Attested:  ${rec.identityAttested?`YES — ${ts(rec.attestedAt)}`:"No"}`,"","── RESOURCES RETRIEVED ─────────────────────────────────────────",`Total:              ${rec.resourceCount}  (${rec.resourceSummary?.visits??0} encounters · ${rec.resourceSummary?.medications??0} meds · ${rec.resourceSummary?.allergies??0} allergies · ${rec.resourceSummary?.problems??0} problems · ${rec.resourceSummary?.labs??0} labs)`,"","── CHART IMPORT ────────────────────────────────────────────────",rec.importedToEncounter?`Records Imported:   YES — ${ts(rec.importedAt)}${rec.encounterID?`\nEncounter ID:       ${rec.encounterID}`:""}`:  "Records Imported:   NO — Records were viewed but not imported to the active encounter.","","── AUDIT TRAIL ─────────────────────────────────────────────────",...(rec.auditLog??[]).map(e=>`${new Date(e.ts).toLocaleTimeString("en-US",{hour12:false})} [${e.event.padEnd(22)}] ${e.detail}`),"","═══════════════════════════════════════════════════════════════","Generated by Lakonyx Anamnesis · FHIR Provenance Chain of Custody","═══════════════════════════════════════════════════════════════"].join("\n");}
export function genCOC(rec){const ts=s=>s?new Date(s).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";const src=rec.networkSources?.join(" and ")??"external network";return[`External medical records retrieved via FHIR R4 network (${src}) on ${ts(rec.queryInitiatedAt)}.`,rec.identityMatchScore!=null?`Patient identity verified: ${rec.identityMatchScore}/100 (${rec.identityMatchLevel}).`:null,rec.identityAttested?`Provider identity attestation recorded ${ts(rec.attestedAt)}.`:null,`${rec.resourceCount} resources retrieved (${rec.resourceSummary?.visits??0} encounters, ${rec.resourceSummary?.medications??0} medications, ${rec.resourceSummary?.labs??0} labs).`,rec.importedToEncounter?`Records imported to encounter at ${ts(rec.importedAt)}.`:`Records reviewed but not imported to this encounter.`,`Provenance Query ID: ${rec.queryId}.`].filter(Boolean).join(" ");}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION CACHE + URL PARAMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const AnamnesisCache = new Map(); // module-level: persists across re-renders
export const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 minutes

export function cacheKey(demog={}) {
  return[(demog.lastName??"").toLowerCase().trim(),(demog.firstName??"").toLowerCase().trim(),(demog.dob??"").trim()].join("|");
}

export function readURLParams() {
  try {
    const p=new URLSearchParams(window.location.search);
    const d={lastName:p.get("lastName")??p.get("family")??"",firstName:p.get("firstName")??p.get("given")??"",dob:p.get("dob")??p.get("birthdate")??"",mrn:p.get("mrn")??p.get("identifier")??"",encounterID:p.get("encounterID")??p.get("encounter")??""};
    return(d.lastName&&d.dob)?d:null;
  }catch{return null;}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT CONTENT FETCHERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fetchDocContent(url, token) {
  if (!url||!token) return null;
  try {
    const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:"*/*"},signal:AbortSignal.timeout(15_000)});
    if (!r.ok) return{type:"error",content:`HTTP ${r.status}: ${r.statusText}`};
    const ct=r.headers.get("content-type")??"";
    if (ct.includes("pdf")) { const blob=await r.blob(); return{type:"pdf",objectUrl:URL.createObjectURL(blob),size:blob.size}; }
    const text=await r.text();
    return{type:ct.includes("xml")||ct.includes("cda")?"xml":"text",content:text};
  }catch(e){return{type:"error",content:e.message??"Fetch failed"};}
}

export function decodeBase64Doc(data, contentType) {
  if (!data) return null;
  try { const d=atob(data); return{type:(contentType??"").includes("xml")||(contentType??"").includes("cda")?"xml":"text",content:d}; }
  catch { return{type:"error",content:"Could not decode base64 attachment"}; }
}

export function extractCCDAText(xml) {
  try {
    const doc=new DOMParser().parseFromString(xml,"application/xml");
    if (doc.querySelector("parsererror")) return xml;
    const sections=Array.from(doc.querySelectorAll("section"));
    if (!sections.length) return doc.body?.textContent??xml;
    return sections.map(s=>{const t=s.querySelector("title")?.textContent?.trim();const x=s.querySelector("text")?.textContent?.trim();return[t?`── ${t} ──`:null,x].filter(Boolean).join("\n");}).filter(Boolean).join("\n\n");
  }catch{return xml;}
}