/**
 * NCCI Edit & LCD Validation Engine
 * Checks selected ICD-10/CPT codes for common claim denial risks.
 */

// ── NCCI Mutually Exclusive / Bundled CPT Pairs ────────────────────────────
// Format: [col1, col2, modifier_allowed, reason]
const NCCI_BUNDLES = [
  ['99213', '99214', false, 'Only one E&M level may be billed per encounter'],
  ['99213', '99215', false, 'Only one E&M level may be billed per encounter'],
  ['99214', '99215', false, 'Only one E&M level may be billed per encounter'],
  ['99212', '99215', false, 'Only one E&M level may be billed per encounter'],
  ['93000', '93005', false, 'EKG tracing (93005) is bundled into complete EKG (93000)'],
  ['93000', '93010', false, 'EKG interpretation (93010) is bundled into complete EKG (93000)'],
  ['71046', '71045', false, 'PA chest (71045) is a component of 2-view chest X-ray (71046)'],
  ['80053', '80048', false, 'Basic metabolic panel (80048) is a component of CMP (80053)'],
  ['80053', '82565', false, 'Creatinine (82565) is bundled in CMP (80053)'],
  ['80053', '82947', false, 'Glucose (82947) is bundled in CMP (80053)'],
  ['85025', '85027', false, 'CBC without differential (85027) is a component of CBC with diff (85025)'],
  ['36415', '99213', true,  'Venipuncture (36415) requires modifier -25 on E&M if separately identifiable'],
  ['36415', '99214', true,  'Venipuncture (36415) requires modifier -25 on E&M if separately identifiable'],
  ['36415', '99215', true,  'Venipuncture (36415) requires modifier -25 on E&M if separately identifiable'],
  ['20610', '20600', false, 'Major joint injection (20610) cannot be billed with small joint (20600) same day'],
  ['27447', '27310', false, 'TKR (27447) bundles arthrotomy (27310)'],
  ['43239', '43235', false, 'Upper EGD with biopsy (43239) bundles diagnostic EGD (43235)'],
];

// ── Medically Unlikely Edits (MUEs) ───────────────────────────────────────
// Max units per day for selected CPT codes (Medicare)
const MUE_LIMITS = {
  '99211': 1, '99212': 1, '99213': 1, '99214': 1, '99215': 1,
  '93000': 1, '71046': 1, '36415': 1,
  '85025': 1, '80053': 1, '80048': 1,
  '99232': 1, '99233': 1, '99238': 1,
};

// ── LCD / Coverage Rules ───────────────────────────────────────────────────
// Format: { cpt, requiredIcdPrefixes[], description, payers[] }
const LCD_RULES = [
  {
    cpt: '93000',
    requiredIcdPrefixes: ['I', 'R00', 'R01', 'R06', 'Z13'],
    description: 'EKG (93000) requires a cardiac, respiratory, or screening diagnosis. Ensure a qualifying ICD-10 code (e.g., chest pain, arrhythmia, hypertension) is present.',
    payers: ['Medicare', 'Medicaid', 'Most commercial'],
  },
  {
    cpt: '71046',
    requiredIcdPrefixes: ['J', 'R', 'I', 'Z'],
    description: 'Chest X-ray (71046) requires a cardiopulmonary or screening diagnosis. Orthopedic-only diagnoses may result in denial.',
    payers: ['Medicare Part B'],
  },
  {
    cpt: '85025',
    requiredIcdPrefixes: ['D', 'Z', 'R', 'C', 'I', 'J', 'K'],
    description: 'CBC (85025) must be medically necessary. Ensure a qualifying diagnosis is linked (anemia, infection, malignancy, monitoring).',
    payers: ['Medicare', 'Medicaid'],
  },
  {
    cpt: '80053',
    requiredIcdPrefixes: ['E', 'N', 'Z', 'I', 'R', 'K'],
    description: 'CMP (80053) requires metabolic, renal, hepatic, or diabetes-related diagnosis. Isolated musculoskeletal diagnoses may not justify.',
    payers: ['Medicare Part B'],
  },
  {
    cpt: '99215',
    requiredIcdPrefixes: [],
    description: '99215 requires documented High Complexity MDM or ≥40 min total time. Ensure MDM documentation clearly supports complexity level.',
    payers: ['All payers'],
    alwaysShow: true,
  },
  {
    cpt: '99214',
    requiredIcdPrefixes: [],
    description: '99214 requires Moderate Complexity MDM or ≥30 min. Ensure documentation supports this level to avoid downcoding.',
    payers: ['All payers'],
    alwaysShow: true,
  },
];

// ── ICD-10 Specificity Rules ───────────────────────────────────────────────
const SPECIFICITY_RULES = [
  { prefix: 'I10', exact: true,  message: 'I10 (Essential hypertension) is appropriate. Avoid unspecified "hypertension" — I10 is already specific.' },
  { prefix: 'E11.9', exact: true, message: 'E11.9 (T2DM without complications) is less specific than E11.65 (with hyperglycemia) or E11.649 (with hypoglycemia). Consider a more specific code if documented.' },
  { prefix: 'J06.9', exact: true, message: 'J06.9 (Acute upper respiratory infection, unspecified) — consider more specific code if viral/bacterial etiology is documented.' },
  { prefix: 'R51',   exact: true, message: 'R51 (Headache) is a symptom code. If a definitive diagnosis (migraine, tension-type) is established, use that code instead.' },
  { prefix: 'R05',   exact: true, message: 'R05 (Cough) is a symptom code. Use only if no definitive diagnosis established.' },
  { prefix: 'Z',     exact: false, message: 'Z-codes (factors influencing health status) should generally be secondary diagnoses, not principal, unless encounter is specifically for that reason.' },
];

// ── Diagnosis-Procedure Medical Necessity ─────────────────────────────────
// Flags when a CPT has no plausible matching ICD prefix
const MED_NECESSITY = [
  { cpt: '93000', plausibleIcdPrefixes: ['I', 'R00', 'R01', 'R06', 'R07', 'Z82', 'Z13', 'T45', 'F17'] },
  { cpt: '71046', plausibleIcdPrefixes: ['J', 'R', 'I', 'C34', 'Z', 'S'] },
  { cpt: '85025', plausibleIcdPrefixes: ['D', 'Z', 'R', 'C', 'I', 'J', 'K', 'B', 'N'] },
  { cpt: '80053', plausibleIcdPrefixes: ['E', 'N', 'Z', 'I', 'R', 'K', 'D'] },
  { cpt: '84484', plausibleIcdPrefixes: ['I21', 'I22', 'I20', 'R07', 'Z03'] },
  { cpt: '82553', plausibleIcdPrefixes: ['I21', 'I22', 'I20', 'R07'] },
];

/**
 * Run all validation rules against selected codes.
 * @param {Array} selIcd - Selected ICD-10 code objects {code, description}
 * @param {Array} selCpt - Selected CPT code objects {code, description, modifier}
 * @returns {Array} findings - Array of finding objects
 */
export function runValidation(selIcd, selCpt) {
  const findings = [];
  const icdCodes = selIcd.map(c => c.code.toUpperCase());
  const cptCodes = selCpt.map(c => c.code);

  // 1. NCCI Bundle checks
  for (const [col1, col2, modAllowed, reason] of NCCI_BUNDLES) {
    if (cptCodes.includes(col1) && cptCodes.includes(col2)) {
      const col1HasMod = selCpt.find(c => c.code === col1)?.modifier;
      const col2HasMod = selCpt.find(c => c.code === col2)?.modifier;
      const modPresent = col1HasMod || col2HasMod;
      findings.push({
        type: modAllowed && modPresent ? 'warning' : 'denial',
        rule: 'NCCI Edit',
        codes: [col1, col2],
        message: reason,
        resolution: modAllowed
          ? modPresent
            ? 'Modifier present — verify it is appropriate (e.g., -25, -59, -XE).'
            : `These codes require a modifier (e.g., -25 or -59) to override the edit. Add a valid modifier if services were truly separate.`
          : `Remove one of these codes. ${col2} is typically bundled into ${col1} and cannot be separately billed.`,
      });
    }
  }

  // 2. LCD Coverage checks
  for (const rule of LCD_RULES) {
    if (!cptCodes.includes(rule.cpt)) continue;
    if (rule.alwaysShow) {
      findings.push({
        type: 'info',
        rule: 'LCD Documentation',
        codes: [rule.cpt],
        message: rule.description,
        resolution: `Ensure clinical documentation explicitly supports this code level. Payers: ${rule.payers.join(', ')}.`,
      });
      continue;
    }
    const hasQualifyingDx = icdCodes.some(icd =>
      rule.requiredIcdPrefixes.some(prefix => icd.startsWith(prefix))
    );
    if (!hasQualifyingDx && rule.requiredIcdPrefixes.length > 0) {
      findings.push({
        type: 'denial',
        rule: 'LCD Coverage',
        codes: [rule.cpt],
        message: rule.description,
        resolution: `Add a qualifying diagnosis code that justifies ${rule.cpt}, or remove the procedure if not medically supported. Payers: ${rule.payers.join(', ')}.`,
      });
    }
  }

  // 3. Medical Necessity cross-checks
  for (const rule of MED_NECESSITY) {
    if (!cptCodes.includes(rule.cpt)) continue;
    const hasPlausibleDx = icdCodes.some(icd =>
      rule.plausibleIcdPrefixes.some(prefix => icd.startsWith(prefix))
    );
    if (!hasPlausibleDx) {
      findings.push({
        type: 'warning',
        rule: 'Medical Necessity',
        codes: [rule.cpt],
        message: `${rule.cpt} may lack medical necessity support from current diagnosis codes. No plausible linking ICD-10 found.`,
        resolution: 'Ensure at least one ICD-10 code clinically justifies this procedure. Add or verify the appropriate diagnosis.',
      });
    }
  }

  // 4. ICD-10 Specificity warnings
  for (const rule of SPECIFICITY_RULES) {
    const matches = rule.exact
      ? icdCodes.filter(c => c === rule.prefix)
      : icdCodes.filter(c => c.startsWith(rule.prefix));
    if (matches.length > 0) {
      findings.push({
        type: 'info',
        rule: 'Specificity',
        codes: matches,
        message: rule.message,
        resolution: 'Review documentation to determine if a more specific code is available and supported.',
      });
    }
  }

  // 5. Duplicate ICD-10 detection
  const icdSeen = new Set();
  for (const code of icdCodes) {
    if (icdSeen.has(code)) {
      findings.push({
        type: 'warning',
        rule: 'Duplicate Code',
        codes: [code],
        message: `ICD-10 code ${code} appears more than once in the selected codes.`,
        resolution: 'Remove the duplicate. Each ICD-10 code should appear only once per claim.',
      });
    }
    icdSeen.add(code);
  }

  // 6. E&M + same-day procedure (modifier -25 check)
  const emCodes = ['99211','99212','99213','99214','99215'];
  const hasEM = cptCodes.some(c => emCodes.includes(c));
  const hasProcedure = selCpt.some(c => !emCodes.includes(c.code) && c.category !== 'Diagnostic');
  if (hasEM && hasProcedure) {
    const emCode = selCpt.find(c => emCodes.includes(c.code));
    const hasmod25 = emCode?.modifier?.includes('25');
    if (!hasmod25) {
      findings.push({
        type: 'warning',
        rule: 'Modifier -25',
        codes: [emCode?.code, ...selCpt.filter(c => !emCodes.includes(c.code)).map(c => c.code)],
        message: `E&M service (${emCode?.code}) billed same day as a procedure may require modifier -25 to demonstrate a separately identifiable E&M.`,
        resolution: 'Add modifier -25 to the E&M code if the E&M was significant and separately identifiable from the procedure on the same date.',
      });
    }
  }

  // 7. Place of service / telehealth flag for high E&M
  if (cptCodes.includes('99215') || cptCodes.includes('99214')) {
    findings.push({
      type: 'info',
      rule: 'Documentation Tip',
      codes: cptCodes.filter(c => ['99214','99215'].includes(c)),
      message: 'High-level E&M codes are frequently audited. Ensure MDM table is fully documented with: number/complexity of problems, data reviewed, and risk of complications.',
      resolution: 'Document specific data elements: reviewed external records, ordered tests, independent interpretation, prescription drug management, and undiagnosed new problem with uncertain prognosis.',
    });
  }

  return findings;
}