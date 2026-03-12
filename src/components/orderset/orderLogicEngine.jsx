// Conditional logic engine for smart order suggestions
// Maps trigger orders to their dependent/associated orders

export const ORDER_DEPENDENCIES = {
  // Antibiotic Monitoring
  vancomycin: {
    triggers: ["vancomycin", "vanc"],
    suggests: [
      {
        id: "vanc_trough",
        name: "Vancomycin Trough Level",
        detail: "Before 4th dose. Target 15-20 mcg/mL for serious infections",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "Vancomycin requires therapeutic drug monitoring"
      },
      {
        id: "vanc_renal",
        name: "BMP Daily",
        detail: "Monitor renal function while on vancomycin",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "Vancomycin is nephrotoxic - monitor creatinine"
      }
    ]
  },

  gentamicin: {
    triggers: ["gentamicin", "aminoglycoside", "tobramycin"],
    suggests: [
      {
        id: "gent_peak",
        name: "Gentamicin Peak & Trough",
        detail: "Peak: 30 min after infusion. Trough: before next dose",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "Aminoglycosides require therapeutic monitoring"
      },
      {
        id: "gent_audio",
        name: "Baseline Audiometry",
        detail: "If prolonged course (> 5 days)",
        cat: "consults",
        priority: "routine",
        required: false,
        reason: "Aminoglycosides are ototoxic"
      }
    ]
  },

  // Anticoagulation Monitoring
  heparin: {
    triggers: ["heparin infusion", "heparin drip", "unfractionated heparin"],
    suggests: [
      {
        id: "hep_ptt",
        name: "aPTT Q6h",
        detail: "Target 60-80 seconds. Adjust heparin per protocol",
        cat: "labs",
        priority: "urgent",
        required: true,
        reason: "Heparin infusion requires aPTT monitoring"
      },
      {
        id: "hep_cbc",
        name: "CBC Daily",
        detail: "Monitor platelets for HIT",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "Heparin-induced thrombocytopenia (HIT) surveillance"
      }
    ]
  },

  warfarin: {
    triggers: ["warfarin", "coumadin"],
    suggests: [
      {
        id: "warf_inr",
        name: "INR Daily → Weekly",
        detail: "Daily until therapeutic, then weekly. Target INR per indication",
        cat: "labs",
        priority: "routine",
        required: true,
        reason: "Warfarin requires INR monitoring"
      }
    ]
  },

  // Insulin & Diabetes
  insulin_infusion: {
    triggers: ["insulin infusion", "insulin drip", "regular insulin iv"],
    suggests: [
      {
        id: "ins_glucose",
        name: "POC Glucose Q1h",
        detail: "While on insulin infusion. Target 140-180 mg/dL",
        cat: "vitals",
        priority: "stat",
        required: true,
        reason: "Insulin infusion requires hourly glucose monitoring"
      },
      {
        id: "ins_k",
        name: "Potassium Q4h",
        detail: "Insulin shifts K+ intracellularly. Replete if < 3.3",
        cat: "labs",
        priority: "urgent",
        required: true,
        reason: "Insulin can cause hypokalemia"
      }
    ]
  },

  // Diuretics
  furosemide_iv: {
    triggers: ["furosemide iv", "lasix iv", "iv diuretic"],
    suggests: [
      {
        id: "lasix_bmp",
        name: "BMP Daily",
        detail: "Monitor K+, Na+, Cr while on IV diuretics",
        cat: "labs",
        priority: "urgent",
        required: true,
        reason: "IV diuretics cause electrolyte abnormalities"
      },
      {
        id: "lasix_io",
        name: "Strict Intake & Output",
        detail: "Q8h. Notify MD if UO < 0.5 mL/kg/hr × 2h",
        cat: "vitals",
        priority: "urgent",
        required: true,
        reason: "Monitor diuresis response"
      },
      {
        id: "lasix_weight",
        name: "Daily Weight",
        detail: "Same time, same scale. Notify if > 2 lbs/day change",
        cat: "vitals",
        priority: "routine",
        required: false,
        reason: "Track volume status"
      }
    ]
  },

  // Sedation & Analgesia
  propofol: {
    triggers: ["propofol"],
    suggests: [
      {
        id: "prop_trig",
        name: "Triglycerides",
        detail: "Baseline and Q48h if prolonged infusion",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "Propofol infusion syndrome - hypertriglyceridemia"
      }
    ]
  },

  // Mechanical Ventilation
  mechanical_ventilation: {
    triggers: ["intubation", "mechanical ventilation", "ventilator"],
    suggests: [
      {
        id: "vent_abg",
        name: "ABG",
        detail: "30 min post-intubation, then daily or PRN",
        cat: "labs",
        priority: "stat",
        required: true,
        reason: "Assess ventilation and oxygenation"
      },
      {
        id: "vent_cxr",
        name: "Chest X-ray Portable",
        detail: "Post-intubation to confirm ETT placement",
        cat: "imaging",
        priority: "stat",
        required: true,
        reason: "Confirm endotracheal tube position"
      },
      {
        id: "vent_hob",
        name: "HOB Elevation 30-45°",
        detail: "VAP prevention bundle",
        cat: "nursing",
        priority: "urgent",
        required: true,
        reason: "Ventilator-associated pneumonia prevention"
      },
      {
        id: "vent_peptic",
        name: "PPI (Pantoprazole 40mg IV daily)",
        detail: "Stress ulcer prophylaxis",
        cat: "meds",
        priority: "routine",
        required: false,
        reason: "GI bleed prophylaxis in ventilated patients"
      }
    ]
  },

  // TPN
  tpn: {
    triggers: ["tpn", "total parenteral nutrition", "parenteral nutrition"],
    suggests: [
      {
        id: "tpn_cmp",
        name: "CMP Daily",
        detail: "Monitor electrolytes, glucose, renal function",
        cat: "labs",
        priority: "routine",
        required: true,
        reason: "TPN causes electrolyte abnormalities"
      },
      {
        id: "tpn_trig",
        name: "Lipid Panel Weekly",
        detail: "Monitor triglycerides",
        cat: "labs",
        priority: "routine",
        required: false,
        reason: "TPN lipid component monitoring"
      }
    ]
  },

  // Blood Transfusion
  prbc_transfusion: {
    triggers: ["prbc", "packed red blood cells", "blood transfusion"],
    suggests: [
      {
        id: "trans_consent",
        name: "Transfusion Consent",
        detail: "Informed consent for blood product administration",
        cat: "nursing",
        priority: "stat",
        required: true,
        reason: "Required before transfusion"
      },
      {
        id: "trans_type",
        name: "Type & Cross",
        detail: "2 units pRBCs",
        cat: "labs",
        priority: "stat",
        required: true,
        reason: "Blood bank crossmatch required"
      },
      {
        id: "trans_vitals",
        name: "Vitals Q15min During Transfusion",
        detail: "Monitor for transfusion reaction",
        cat: "vitals",
        priority: "stat",
        required: true,
        reason: "Detect acute transfusion reactions"
      }
    ]
  },

  // Central Line
  central_line: {
    triggers: ["central line", "central venous catheter", "cvc"],
    suggests: [
      {
        id: "cvl_cxr",
        name: "Chest X-ray Post-Insertion",
        detail: "Confirm placement, rule out pneumothorax",
        cat: "imaging",
        priority: "stat",
        required: true,
        reason: "Confirm central line placement"
      },
      {
        id: "cvl_sterile",
        name: "Sterile Dressing Changes",
        detail: "Per institutional protocol",
        cat: "nursing",
        priority: "routine",
        required: true,
        reason: "CLABSI prevention"
      }
    ]
  },
};

// Check if an order name matches any triggers
export function checkOrderTriggers(orderName) {
  const lowerName = orderName.toLowerCase();
  const suggestions = [];

  for (const [key, config] of Object.entries(ORDER_DEPENDENCIES)) {
    const triggered = config.triggers.some(trigger => 
      lowerName.includes(trigger.toLowerCase())
    );

    if (triggered) {
      suggestions.push(...config.suggests.map(s => ({
        ...s,
        triggerKey: key,
        autoAdded: false,
      })));
    }
  }

  return suggestions;
}

// Get all dependent orders for a list of selected orders
export function getDependentOrders(selectedOrders) {
  const allSuggestions = [];
  const suggestionIds = new Set();

  selectedOrders.forEach(order => {
    const orderSuggestions = checkOrderTriggers(order.name);
    orderSuggestions.forEach(sug => {
      if (!suggestionIds.has(sug.id)) {
        suggestionIds.add(sug.id);
        allSuggestions.push(sug);
      }
    });
  });

  return allSuggestions;
}