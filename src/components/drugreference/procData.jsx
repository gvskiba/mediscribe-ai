export const PROC_RULES = {
  colonoscopy:{
    hold:["Metformin — hold day before (dehydration + bowel prep → lactic acidosis risk)","Anticoagulants (warfarin, apixaban, rivaroxaban) — hold per proceduralist based on VTE risk","Iron supplements — interfere with bowel prep","Fiber supplements / psyllium","GLP-1 agonists (semaglutide, liraglutide) — delay gastric emptying, ↑ aspiration risk"],
    caution:["Aspirin 81mg — discuss; typically continue for low polyp risk","NSAIDs — hold 5–7 days if high bleed concern","Diuretics — monitor hydration during prep"],
    cont:["Antihypertensives (ACEi, ARBs, beta-blockers, CCBs)","Statins","Thyroid medications","Antidepressants (SSRIs, SNRIs)"],
  },
  surgery_major:{
    hold:["Anticoagulants (warfarin, DOACs) — hold 3–7 days; bridge if high VTE risk","Antiplatelet agents (clopidogrel — hold 5–7 days)","Metformin — hold day of surgery and 48h after if contrast used","SGLT2 inhibitors — hold 3–4 days (DKA risk)","NSAIDs — hold 7 days","MAOIs — hold 2 weeks (serotonin/hypertensive crisis)","GLP-1 agonists — hold 1 week (daily) or 2 weeks (weekly) — aspiration risk"],
    caution:["ACE inhibitors / ARBs — some anesthesiologists hold morning of (hypotension risk)","Diuretics — hold morning of if concern for hypovolemia","Insulin / oral hypoglycemics — dose adjustment required day of surgery"],
    cont:["Cardiac medications (digoxin, amiodarone, statins)","Antiepileptics (continue — seizure risk)","SSRIs (continue)","Corticosteroids (continue + stress dosing if chronic)","Thyroid medications","Beta-blockers (continue — do NOT hold)"],
  },
  cardiac_cath:{
    hold:["Metformin — hold 48h before if contrast; restart when SCr stable","NSAIDs — hold 7 days"],
    caution:["Anticoagulants — discuss with interventionalist","P2Y12 inhibitors — discuss hold/continue based on indication","Diuretics — hold morning of if volume depletion concern"],
    cont:["Antihypertensives","Statins (especially if ACS)","Aspirin (usually continue for PCI)","Beta-blockers (do NOT hold)","Nitroglycerin / nitrates"],
  },
  epidural:{
    hold:["LMWH — hold 12–24h before","UFH IV — hold 4–6h","DOACs — hold 2–5 days","Clopidogrel — hold 7 days","Ticagrelor — hold 5 days","NSAIDs — hold 7 days for high-dose"],
    caution:["Aspirin 81mg — discuss with anesthesiologist (many continue for neuraxial)","SSRIs — mild antiplatelet effect; generally continue but note"],
    cont:["Antihypertensives","Cardiac medications","Antiepileptics","Opioids (taper plan if chronic)"],
  },
  ct_contrast:{
    hold:["Metformin — hold 48h before contrast (lactic acidosis risk if contrast causes AKI)","NSAIDs same day (nephrotoxicity)"],
    caution:["Renally cleared drugs in CKD — consider dose timing","Nephrotoxic combinations (aminoglycosides, vancomycin)"],
    cont:["Most medications","Hydration — encourage adequate fluids before and after"],
  },
  dental:{
    hold:["Anticoagulants — confirm INR ≤3.0 (warfarin); DOACs may hold 1 dose for invasive procedures"],
    caution:["Bisphosphonates — risk of osteonecrosis of jaw; inform dentist","Anticoagulants for simple extractions — often continue with local hemostasis"],
    cont:["Most medications (dental procedures have low systemic bleed risk)","Antihypertensives","Diabetes medications (take with normal meals)"],
  },
};