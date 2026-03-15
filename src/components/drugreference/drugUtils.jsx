import { DRUG_DB } from "./drugData";

// Given a drug name, find alternatives from the same class in DRUG_DB that are NOT in the current med list
function findAlternatives(drugName, conflictingDrugName, currentMeds) {
  const drug = DRUG_DB.find(d => d.name.toLowerCase() === drugName.toLowerCase());
  if (!drug) return [];
  const ml = currentMeds.map(m => m.toLowerCase());
  return DRUG_DB
    .filter(d =>
      d.drugClass === drug.drugClass &&
      d.id !== drug.id &&
      !ml.some(m => m.includes(d.name.toLowerCase())) &&
      // exclude the conflicting drug's class overlap
      d.name.toLowerCase() !== conflictingDrugName.toLowerCase()
    )
    .slice(0, 3)
    .map(d => ({ name: d.name, brand: d.brand, drugClass: d.drugClass }));
}

export function calculateWeightBasedDose(doseString, weight, unit) {
  if (!weight || weight <= 0) return null;
  const wt = unit === "lbs" ? weight / 2.205 : weight;
  const match = doseString.match(/(\d+(?:\.\d+)?)\s*(?:mg|mcg|g)?\/\s*kg/i);
  if (!match) return null;
  const dosePerKg = parseFloat(match[1]);
  const calculatedDose = (dosePerKg * wt).toFixed(1);
  return `${calculatedDose} ${doseString.match(/(mg|mcg|g)\//i)?.[1] || "mg"}`;
}

export function ruleBasedScan(meds, allergies) {
  const ml = meds.map(m => m.toLowerCase());
  const has = n => ml.some(m => m.includes(n.toLowerCase()));
  const findings = [];

  if (has("warfarin") && has("amiodarone")) findings.push({ type:"interaction", severity:"critical", title:"Warfarin + Amiodarone", drugs:["Warfarin","Amiodarone"], description:"Amiodarone inhibits CYP2C9 and CYP3A4, significantly increasing warfarin levels and INR. Can double the INR within 1–2 weeks.", mechanism:"CYP2C9 and CYP3A4 inhibition reduces warfarin metabolism.", recommendation:"Reduce warfarin 30–50% when starting amiodarone. Monitor INR every 3–5 days until stable. Effect persists months after stopping amiodarone." });
  if (has("warfarin") && has("aspirin")) findings.push({ type:"interaction", severity:"major", title:"Warfarin + Aspirin", drugs:["Warfarin","Aspirin"], description:"Combined anticoagulant/antiplatelet use increases bleeding risk. Aspirin irritates GI mucosa.", mechanism:"Additive hemorrhagic risk; antiplatelet effect + mucosal damage.", recommendation:"Avoid unless specifically indicated (e.g., mechanical heart valve). If necessary, use lowest aspirin dose + PPI." });
  if (has("digoxin") && has("amiodarone")) findings.push({ type:"interaction", severity:"critical", title:"Digoxin + Amiodarone", drugs:["Digoxin","Amiodarone"], description:"Amiodarone doubles digoxin serum levels via P-gp inhibition and reduced renal clearance. Risk of digoxin toxicity.", mechanism:"P-gp inhibition + reduced renal clearance.", recommendation:"Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels and for signs of toxicity." });
  if (has("digoxin") && has("furosemide")) findings.push({ type:"interaction", severity:"major", title:"Digoxin + Furosemide (Hypokalemia)", drugs:["Digoxin","Furosemide"], description:"Loop diuretics cause K+/Mg2+ wasting, dramatically increasing digoxin toxicity risk even at normal levels.", mechanism:"Hypokalemia/hypomagnesemia increases myocardial digoxin binding.", recommendation:"Monitor electrolytes regularly. Supplement K+ to keep ≥3.5 mEq/L. Check digoxin levels periodically." });
  if (has("amiodarone") && (has("atorvastatin") || has("statin") || has("simvastatin"))) findings.push({ type:"interaction", severity:"major", title:"Amiodarone + Statin (Myopathy)", drugs:["Amiodarone","Statin"], description:"Amiodarone inhibits CYP3A4, increasing statin blood levels and risk of myopathy/rhabdomyolysis.", mechanism:"CYP3A4 inhibition increases statin AUC.", recommendation:"Cap atorvastatin at 20mg/day with amiodarone. Avoid simvastatin >10mg. Switch to rosuvastatin if higher doses needed." });
  if (has("lorazepam") && (has("morphine") || has("oxycodone") || has("fentanyl") || has("hydromorphone") || has("opioid"))) findings.push({ type:"interaction", severity:"critical", title:"Benzodiazepine + Opioid", drugs:["Lorazepam","Opioid"], description:"Combined CNS depression significantly increases risk of respiratory depression, sedation, and death. FDA black box warning.", mechanism:"Additive CNS/respiratory depression via GABA-A and mu-opioid receptors.", recommendation:"Avoid unless clearly indicated. Use lowest doses. Monitor O2 sat continuously. Have naloxone available." });
  if (has("lithium") && (has("ibuprofen") || has("naproxen") || has("nsaid"))) findings.push({ type:"interaction", severity:"major", title:"Lithium + NSAID (Toxicity Risk)", drugs:["Lithium","NSAID"], description:"NSAIDs reduce renal lithium clearance, increasing levels and risk of toxicity.", mechanism:"NSAID inhibition of prostaglandins reduces renal lithium excretion.", recommendation:"Avoid NSAIDs with lithium. Use acetaminophen for pain. Monitor lithium levels if NSAID unavoidable." });
  if (has("metformin")) findings.push({ type:"guideline", severity:"moderate", title:"Metformin — Hold Before Contrast / Surgery", drugs:["Metformin"], description:"Must be held before IV contrast and major surgery to prevent lactic acidosis.", mechanism:"AKI impairs metformin renal clearance → lactic acidosis.", recommendation:"Hold 48h before IV contrast. Hold day of surgery. Restart when SCr confirmed stable and patient eating." });

  allergies.forEach(allergy => {
    const al = allergy.toLowerCase();
    if (al.includes("pcn") || al.includes("penicillin")) {
      meds.forEach(med => {
        if (med.toLowerCase().includes("amoxicillin") || med.toLowerCase().includes("ampicillin")) {
          findings.push({ type:"allergy", severity:"critical", title:`PCN Allergy — ${med}`, drugs:[med], description:`Patient has documented penicillin allergy. ${med} is a penicillin antibiotic.`, mechanism:"IgE or T-cell mediated hypersensitivity.", recommendation:"Contraindicated. Use alternative based on indication (azithromycin, cephalosporin with caution, or FQ depending on indication)." });
        }
      });
    }
    if (al.includes("sulfa") || al.includes("sulfonamide")) {
      meds.forEach(med => {
        if (med.toLowerCase().includes("trimethoprim") || med.toLowerCase().includes("bactrim") || med.toLowerCase().includes("tmp")) {
          findings.push({ type:"allergy", severity:"critical", title:`Sulfa Allergy — ${med}`, drugs:[med], description:`Patient has documented sulfonamide allergy. ${med} contains a sulfonamide.`, mechanism:"Sulfonamide IgE or T-cell hypersensitivity.", recommendation:"Contraindicated. Consider nitrofurantoin or fosfomycin for UTI." });
        }
      });
    }
  });

  if (!findings.length) findings.push({ type:"guideline", severity:"minor", title:"No Major Interactions Detected", drugs:[], description:"No clinically significant interactions identified in this medication list using built-in rule-based checks.", mechanism:"", recommendation:"This does not replace full pharmacy review. Consider pharmacist consultation for complex regimens." });
  return findings;
}

export function parseMedList(text) {
  if (!text.trim()) return [];
  return [...new Set(
    text.split(/[\n,;]+/)
      .map(m => m.trim())
      .filter(m => m.length > 1)
      .map(m => m.replace(/\s+\d+(\.\d+)?\s*(mg|mcg|g|mEq|units?|iu|ml|tablet|tab|cap|puff|patch).*$/i, "").trim())
      .filter(Boolean)
  )];
}