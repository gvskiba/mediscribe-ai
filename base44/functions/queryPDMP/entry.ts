import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Query PDMP (Prescription Drug Monitoring Program) for controlled substance history
 * Analyzes for doctor shopping patterns, opioid interactions, and benzodiazepine-opioid combos
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { patientName, patientDob, patientId, state } = payload;

    if (!patientName || !state) {
      return Response.json({ error: 'Missing required fields: patientName, state' }, { status: 400 });
    }

    // Simulated PDMP data lookup (in production, integrate with actual state PDMP APIs)
    const pdmpData = await simulatePDMPLookup({ patientName, patientDob, patientId, state });

    // Analyze for doctor shopping patterns
    const doctorShoppingAnalysis = analyzeDoctorShopping(pdmpData.prescriptions);
    
    // Analyze for opioid interactions
    const opioidAnalysis = analyzeOpioidConcurrency(pdmpData.prescriptions);
    
    // Check for benzodiazepine-opioid combo (high-risk)
    const hasBenzoOpioidCombo = pdmpData.prescriptions.some(p => isOpioid(p.drugName)) &&
                                 pdmpData.prescriptions.some(p => isBenzodiazepine(p.drugName));

    // Calculate total MME for opioids in past 30 days
    const totalMME = calculateTotalMME(pdmpData.prescriptions);

    // Create PDMP query record
    const query = {
      patient_name: patientName,
      patient_dob: patientDob || '',
      patient_id: patientId || '',
      state: state.toUpperCase(),
      controlled_prescriptions: pdmpData.prescriptions,
      doctor_shopping_risk: doctorShoppingAnalysis.riskLevel,
      doctor_shopping_details: doctorShoppingAnalysis.details,
      opioid_overlap_risk: opioidAnalysis.riskLevel,
      opioid_overlap_details: opioidAnalysis.details,
      benzodiazepine_opioid_combo: hasBenzoOpioidCombo,
      total_mme_past_30_days: totalMME,
      flagged_for_review: doctorShoppingAnalysis.riskLevel === 'high' || 
                         opioidAnalysis.riskLevel === 'high' || 
                         hasBenzoOpioidCombo,
      queried_at: new Date().toISOString(),
    };

    // Save PDMP query
    const savedQuery = await base44.entities.PDMPQuery.create(query);

    return Response.json({
      success: true,
      pdmpQuery: savedQuery,
      analysis: {
        doctorShopping: doctorShoppingAnalysis,
        opioidConcurrency: opioidAnalysis,
        benzoOpioidCombo: hasBenzoOpioidCombo,
        totalMME: totalMME,
      }
    });
  } catch (error) {
    console.error('PDMP Query Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Simulate PDMP lookup - in production, call actual state PDMP APIs
 */
async function simulatePDMPLookup({ patientName, patientDob, patientId, state }) {
  // Mock data simulating realistic PDMP responses
  const mockPrescriptions = [
    {
      drugName: 'Oxycodone 5mg',
      prescriberName: 'Dr. Smith',
      prescriberNpi: '1234567890',
      quantity: 30,
      dateFilled: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy: 'CVS #1234',
      daysSupply: 7,
    },
    {
      drugName: 'Alprazolam 1mg',
      prescriberName: 'Dr. Johnson',
      prescriberNpi: '0987654321',
      quantity: 60,
      dateFilled: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy: 'Walgreens #5678',
      daysSupply: 30,
    },
    {
      drugName: 'Hydrocodone 5mg/500mg',
      prescriberName: 'Dr. Williams',
      prescriberNpi: '1122334455',
      quantity: 20,
      dateFilled: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy: 'Rite Aid #9999',
      daysSupply: 5,
    },
    {
      drugName: 'Oxycodone 10mg',
      prescriberName: 'Dr. Smith',
      prescriberNpi: '1234567890',
      quantity: 20,
      dateFilled: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy: 'CVS #1234',
      daysSupply: 5,
    },
  ];

  return {
    state: state.toUpperCase(),
    prescriptions: mockPrescriptions,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Detect doctor shopping patterns (multiple prescribers for same drug class)
 */
function analyzeDoctorShopping(prescriptions) {
  const opioidPrescribers = prescriptions
    .filter(p => isOpioid(p.drugName))
    .map(p => p.prescriberNpi);
  
  const benzoPrescribers = prescriptions
    .filter(p => isBenzodiazepine(p.drugName))
    .map(p => p.prescriberNpi);

  const opioidUniqueCount = new Set(opioidPrescribers).size;
  const benzoUniqueCount = new Set(benzoPrescribers).size;

  let riskLevel = 'none';
  let details = 'No doctor shopping indicators detected.';

  if (opioidUniqueCount >= 3 || benzoUniqueCount >= 3) {
    riskLevel = 'high';
    details = `Patient has ${opioidUniqueCount} opioid prescribers and ${benzoUniqueCount} benzodiazepine prescribers in the past 90 days. Strong doctor shopping pattern.`;
  } else if (opioidUniqueCount === 2 || benzoUniqueCount === 2) {
    riskLevel = 'moderate';
    details = `Patient has multiple prescribers for controlled substances (${opioidUniqueCount} opioid, ${benzoUniqueCount} benzo). Monitor for splitting.`;
  } else if (opioidUniqueCount === 1 && opioidPrescribers.length >= 2) {
    riskLevel = 'low';
    details = `Same opioid prescriber but multiple fills in short timeframe.`;
  }

  return { riskLevel, details };
}

/**
 * Detect concurrent opioid prescriptions (overlapping dates)
 */
function analyzeOpioidConcurrency(prescriptions) {
  const opioidRxs = prescriptions.filter(p => isOpioid(p.drugName));
  
  if (opioidRxs.length <= 1) {
    return { riskLevel: 'none', details: 'No concurrent opioid prescriptions.' };
  }

  let concurrentCount = 0;
  const now = new Date();
  
  for (let i = 0; i < opioidRxs.length; i++) {
    for (let j = i + 1; j < opioidRxs.length; j++) {
      const rx1 = opioidRxs[i];
      const rx2 = opioidRxs[j];
      
      const date1 = new Date(rx1.dateFilled);
      const date2 = new Date(rx2.dateFilled);
      const days1 = rx1.daysSupply || 7;
      const days2 = rx2.daysSupply || 7;
      
      const endDate1 = new Date(date1.getTime() + days1 * 24 * 60 * 60 * 1000);
      const endDate2 = new Date(date2.getTime() + days2 * 24 * 60 * 60 * 1000);
      
      // Check overlap
      if ((date1 <= endDate2 && date2 <= endDate1) && now < endDate1 && now < endDate2) {
        concurrentCount++;
      }
    }
  }

  let riskLevel = 'none';
  let details = 'No concurrent opioid prescriptions detected.';

  if (concurrentCount > 0) {
    riskLevel = 'high';
    details = `Patient has ${concurrentCount} overlapping opioid prescription(s). Severe overdose risk.`;
  } else if (opioidRxs.length >= 3 && opioidRxs[0].daysSupply + opioidRxs[1].daysSupply > 30) {
    riskLevel = 'moderate';
    details = `Multiple opioid prescriptions with significant total supply. Monitor for cumulative overdose risk.`;
  }

  return { riskLevel, details };
}

/**
 * Calculate total MME (Morphine Milligram Equivalent) for opioids in past 30 days
 */
function calculateTotalMME(prescriptions) {
  const MME_FACTORS = {
    'morphine': 1,
    'codeine': 0.15,
    'hydrocodone': 1,
    'oxycodone': 1.5,
    'tramadol': 0.1,
    'fentanyl': 2, // per mcg patch = ~2.4 MME/day
    'methadone': 3,
    'buprenorphine': 30,
  };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOpioids = prescriptions.filter(p => isOpioid(p.drugName) && new Date(p.dateFilled) > thirtyDaysAgo);

  let totalMME = 0;
  recentOpioids.forEach(rx => {
    const match = Object.keys(MME_FACTORS).find(drug => rx.drugName.toLowerCase().includes(drug));
    if (match) {
      const doseMatcher = rx.drugName.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (doseMatcher) {
        const dosePerUnit = parseFloat(doseMatcher[1]);
        const factor = MME_FACTORS[match];
        totalMME += dosePerUnit * rx.quantity * factor;
      }
    }
  });

  return Math.round(totalMME);
}

/**
 * Check if drug is an opioid
 */
function isOpioid(drugName) {
  const opioids = ['oxycodone', 'hydrocodone', 'codeine', 'morphine', 'tramadol', 'fentanyl', 'methadone', 'buprenorphine'];
  return opioids.some(o => drugName.toLowerCase().includes(o));
}

/**
 * Check if drug is a benzodiazepine
 */
function isBenzodiazepine(drugName) {
  const benzos = ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'midazolam', 'triazolam', 'xanax', 'ativan', 'valium'];
  return benzos.some(b => drugName.toLowerCase().includes(b));
}