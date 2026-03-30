import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Transform Medication entity to DRUGS format
export function transformDrugsFromDb(rows) {
  if (!rows || rows.length === 0) return [];
  return rows.map(r => ({
    id: r.med_id || r.id,
    name: r.name,
    brand: r.brand || "",
    cls: r.category || "Other",
    sub: r.subcategory || r.drugClass || "",
    sch: r.schedule || null,
    controlled: r.controlled || false,
    forms: r.forms || [],
    sigs: [],
    renal: r.renal || "No adjustment required",
    hepatic: r.hepatic || "No adjustment required",
    peds: r.ped?.notes || "Age/weight-based dosing per package insert",
    interactions: r.interactions || [],
    allergyFlags: r.allergyFlags || [],
    maxDose: r.dosing?.[0]?.dose || "See package insert",
    cost: "$",
    formulary: "Tier 1",
    note: r.notes || "",
  }));
}

// Minimal fallback for demo/testing if DB is empty
const FALLBACK_DRUGS = [
  {id:"amox",name:"Amoxicillin",brand:"Amoxil",cls:"Antibiotic",sub:"Penicillin",forms:["500mg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"3g/day",cost:"$",formulary:"Tier 1",note:"Common antibiotic"},
  {id:"cipro",name:"Ciprofloxacin",brand:"Cipro",cls:"Antibiotic",sub:"Fluoroquinolone",forms:["500mg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"750mg BID",cost:"$",formulary:"Tier 1",note:"Broad-spectrum"},
  {id:"metformin",name:"Metformin",brand:"Glucophage",cls:"Endocrine",sub:"Biguanide",forms:["1000mg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"2550mg/day",cost:"$",formulary:"Tier 1",note:"First-line diabetes"},
  {id:"lisinopril",name:"Lisinopril",brand:"Prinivil",cls:"Cardiovascular",sub:"ACE Inhibitor",forms:["10mg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"80mg/day",cost:"$",formulary:"Tier 1",note:"HTN/HF"},
  {id:"albuterol",name:"Albuterol",brand:"ProAir",cls:"Respiratory",sub:"SABA",forms:["MDI 90mcg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"No ceiling",cost:"$$",formulary:"Tier 1",note:"Asthma/COPD"},
  {id:"ondansetron",name:"Ondansetron",brand:"Zofran",cls:"GI",sub:"5-HT3 Antagonist",forms:["4mg"],sigs:[],renal:"",hepatic:"",peds:"",interactions:[],allergyFlags:[],maxDose:"24mg/day",cost:"$",formulary:"Tier 1",note:"Nausea/vomiting"},
];

export function useDrugsQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["erx-medications"],
    queryFn: async () => {
      const rows = await base44.entities.Medication.list("-created_date", 200);
      return transformDrugsFromDb(rows);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Return DB drugs if available, fallback to hardcoded sample
  return { drugs: (data && data.length > 0) ? data : FALLBACK_DRUGS, isLoading, error };
}