import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUBCATEGORY_MAP = {
  cardiac:       { htn: ['antihypertensive','hypertension','labetalol','hydralazine','nicardipine','clevidipine','nitroprusside','ace inhibitor','arb','angiotensin','calcium channel blocker','amlodipine','nifedipine','diltiazem','verapamil','lisinopril','enalapril','losartan','metoprolol','carvedilol','atenolol','bisoprolol','clonidine','furosemide','hydrochlorothiazide','spironolactone'], arr: ['antiarrhythmic','arrhythmia','atrial fibrillation','afib','svt','supraventricular','ventricular tachycardia','amiodarone','dronedarone','flecainide','propafenone','sotalol','adenosine','procainamide','quinidine','lidocaine antiarrhythmic','ibutilide','dofetilide'], hf: ['heart failure','chf','cardiomyopathy','ejection fraction','dobutamine','milrinone','nesiritide','sacubitril','entresto','digoxin','cardiac glycoside'], acs: ['acute coronary','stemi','nstemi','unstable angina','myocardial infarction','antiplatelet','clopidogrel','ticagrelor','prasugrel','alteplase','tenecteplase','thrombolytic'], rate: ['rate control','rate-control','negative chronotrope'] },
  analgesic:     { opioid: ['opiate','narcotic','mu receptor','mu agonist','opioid agonist','morphine','fentanyl','hydromorphone','dilaudid','oxycodone','oxymorphone','hydrocodone','codeine','tramadol','methadone','buprenorphine','meperidine','tapentadol','remifentanil','sufentanil'], nsaid: ['nsaid','non-steroidal','nonsteroidal','cox inhibitor','cox-1','cox-2','ibuprofen','ketorolac','toradol','naproxen','indomethacin','diclofenac','celecoxib','meloxicam'], nonopioid: ['acetaminophen','tylenol','paracetamol','subanesthetic ketamine','gabapentin','pregabalin','nerve block','local anesthetic','muscle relaxant','cyclobenzaprine','baclofen','methocarbamol','multimodal'] },
  abx:           { gramp: ['gram-positive','gram positive','mrsa','mssa','staph','streptococ','vancomycin','linezolid','daptomycin','oxacillin','nafcillin','clindamycin','cephalexin','cefazolin'], gramn: ['gram-negative','gram negative','pseudomonas','klebsiella','e. coli','ceftriaxone','cefepime','ceftazidime','piperacillin','meropenem','imipenem','ciprofloxacin','gentamicin','tobramycin','amikacin','aztreonam'], resp: ['pneumonia','community-acquired','respiratory infection','azithromycin','clarithromycin','doxycycline','amoxicillin','moxifloxacin','levofloxacin respiratory'], uti: ['urinary tract infection','uti','cystitis','pyelonephritis','nitrofurantoin','fosfomycin','trimethoprim'], skin: ['skin infection','soft tissue','cellulitis','abscess','necrotizing','ssti'] },
  antibiotics:   { gramp: ['gram-positive','mrsa','staph','vancomycin','linezolid','daptomycin','clindamycin','cephalexin','cefazolin'], gramn: ['gram-negative','pseudomonas','klebsiella','ceftriaxone','cefepime','piperacillin','meropenem','ciprofloxacin','gentamicin','aztreonam'], resp: ['pneumonia','respiratory','azithromycin','amoxicillin','moxifloxacin'], uti: ['urinary','cystitis','pyelonephritis','nitrofurantoin','fosfomycin'], skin: ['skin','cellulitis','abscess','wound infection'] },
  psych:         { antipsych: ['antipsychotic','typical antipsychotic','atypical antipsychotic','haloperidol','droperidol','olanzapine','quetiapine','risperidone','ziprasidone','aripiprazole','clozapine'], anxio: ['anxiolytic','benzodiazepine','lorazepam','diazepam','midazolam','alprazolam','clonazepam','buspirone','hydroxyzine'], agit: ['agitation','excited delirium','chemical restraint','acute agitation','behavioral emergency'] },
  resuscitation: { arrest: ['cardiac arrest','acls','pulseless','ventricular fibrillation','epinephrine 1mg','vasopressin','cpr','defibrillation'], vaso: ['vasopressor','pressor','inotrope','shock','norepinephrine','levophed','epinephrine drip','dopamine','phenylephrine','dobutamine','milrinone'], reversal: ['reversal agent','antidote','naloxone','narcan','flumazenil','sugammadex','protamine','andexanet','idarucizumab','vitamin k','acetylcysteine'] },
  gi:            { antiemetic: ['antiemetic','nausea','vomiting','ondansetron','zofran','promethazine','prochlorperazine','metoclopramide','droperidol antiemetic','scopolamine'], antacid: ['antacid','acid suppression','gerd','peptic ulcer','proton pump inhibitor','ppi','omeprazole','pantoprazole','esomeprazole','h2 blocker','famotidine','sucralfate'], motility: ['constipation','diarrhea','ileus','motility','lactulose','polyethylene glycol','loperamide','bisacodyl','senna','neostigmine'] },
  respiratory:   { broncho: ['bronchodilator','bronchospasm','asthma','copd','albuterol','ipratropium','salmeterol','tiotropium','beta-2 agonist','aminophylline','terbutaline'], steroid: ['corticosteroid','glucocorticoid','methylprednisolone','dexamethasone','prednisone','budesonide','fluticasone','croup steroid'], pulm: ['pulmonary hypertension','sildenafil','bosentan','epoprostenol','nitric oxide'] },
  rsi:           { induct: ['induction agent','rsi induction','ketamine','etomidate','propofol','thiopental'], paralytic: ['neuromuscular blockade','nmb','paralytic','succinylcholine','rocuronium','vecuronium','pancuronium','cisatracurium'], pretreat: ['pretreatment','defasciculation','preoxygenation','fentanyl for intubation','lidocaine for intubation'] },
  anticoag:      { direct: ['doac','direct oral anticoagulant','factor xa inhibitor','direct thrombin inhibitor','apixaban','rivaroxaban','edoxaban','dabigatran','argatroban','bivalirudin'], heparin: ['unfractionated heparin','ufh','lmwh','low molecular weight heparin','enoxaparin','fondaparinux','dalteparin'], thrombo: ['thrombolytic','fibrinolytic','alteplase','tpa','tenecteplase','reteplase','streptokinase'], reversal: ['anticoagulant reversal','protamine','andexanet','idarucizumab','vitamin k','prothrombin complex','kcentra'] },
  sedation:      { benzo: ['benzodiazepine','midazolam','lorazepam','diazepam','clonazepam'], dex: ['dexmedetomidine','precedex','alpha-2 agonist','alpha2 agonist'], gen: ['propofol','diprivan','ketamine sedation','procedural sedation','pentobarbital','phenobarbital'] },
  seizure:       { benzo: ['benzodiazepine','lorazepam','diazepam','midazolam','clonazepam'], antiepilep: ['antiepileptic','anticonvulsant','phenytoin','fosphenytoin','levetiracetam','keppra','valproate','valproic acid','lacosamide','phenobarbital','carbamazepine','lamotrigine'], emerg: ['status epilepticus','refractory seizure','propofol for seizure','pentobarbital for seizure','ketamine for seizure'] },
};

function assignSubcategory(med) {
  const haystack = [
    med.name || '',
    med.drugClass || '',
    med.indications || '',
    med.mechanism || '',
    med.brand || '',
  ].join(' ').toLowerCase();

  const catMap = SUBCATEGORY_MAP[med.category];
  if (!catMap) return null;

  for (const [subcatId, keywords] of Object.entries(catMap)) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return subcatId;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  // Fetch all medications
  const meds = await base44.asServiceRole.entities.Medication.list('name', 1000);

  let updated = 0;
  let skipped = 0;
  const results = [];

  for (const med of meds) {
    const subcategory = assignSubcategory(med);
    if (subcategory && subcategory !== med.subcategory) {
      await base44.asServiceRole.entities.Medication.update(med.id, { subcategory });
      updated++;
      results.push({ name: med.name, category: med.category, subcategory });
    } else {
      skipped++;
    }
  }

  return Response.json({
    total: meds.length,
    updated,
    skipped,
    assignments: results,
  });
});