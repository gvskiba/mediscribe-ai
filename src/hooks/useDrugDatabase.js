import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Drug name aliases mapped to drug_id
const DRUG_ALIASES = {
  'vancomycin': 'vanc', 'vanc': 'vanc',
  'fentanyl': 'fent', 'fent': 'fent',
  'propofol': 'prop', 'prop': 'prop',
  'rocuronium': 'roc', 'roc': 'roc',
  'succinylcholine': 'sux', 'sux': 'sux',
  'midazolam': 'midaz', 'midaz': 'midaz',
  'lorazepam': 'lora', 'lora': 'lora',
  'morphine': 'morph', 'morph': 'morph',
  'hydromorphone': 'hydro', 'hydro': 'hydro',
  'epinephrine': 'epi', 'epi': 'epi',
  'norepinephrine': 'norepi', 'norepi': 'norepi', 'levophed': 'norepi',
  'dopamine': 'dopa', 'dopa': 'dopa',
  'dobutamine': 'dobu', 'dobu': 'dobu',
  'naloxone': 'nalox', 'nalox': 'nalox', 'narcan': 'nalox',
  'flumazenil': 'flum', 'flum': 'flum',
  'ceftriaxone': 'ceftri', 'ceftri': 'ceftri',
  'meropenem': 'mero', 'mero': 'mero',
  'piperacillin': 'pip', 'pip': 'pip',
  'gentamicin': 'gent', 'gent': 'gent',
  'amoxicillin': 'amox', 'amox': 'amox',
  'metoprolol': 'meto', 'meto': 'meto',
  'labetalol': 'labe', 'labe': 'labe',
  'nicardipine': 'nica', 'nica': 'nica',
  'diltiazem': 'dilt', 'dilt': 'dilt',
  'furosemide': 'furo', 'furo': 'furo', 'lasix': 'furo',
  'spironolactone': 'spiro', 'spiro': 'spiro',
  'lisinopril': 'lisi', 'lisi': 'lisi',
  'enalapril': 'ena', 'ena': 'ena',
  'insulin': 'insulin',
};

export function useDrugDatabase() {
  const [drugs, setDrugs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const allDrugs = await base44.entities.DrugDosing.list();
        const drugMap = {};
        allDrugs.forEach(d => {
          drugMap[d.drug_id] = d;
          if (d.generic_name) drugMap[d.generic_name.toLowerCase()] = d;
          if (d.name) drugMap[d.name.toLowerCase()] = d;
        });
        setDrugs(drugMap);
      } catch (err) {
        console.error('Failed to load drug database:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDrugs();
  }, []);

  const findDrug = (drugName) => {
    if (!drugs || !drugName) return null;
    const normalized = drugName.toLowerCase().trim();
    const drugId = DRUG_ALIASES[normalized];
    return drugs[drugId] || drugs[normalized] || null;
  };

  return { drugs, loading, findDrug };
}