const T = {
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
  txt3:"#82aece", txt4:"#5a82a8",
};

export const PAGES = [
  // Workflow
  { id:"command",       name:"Command Center",       icon:"⚡",  color:T.purple, cat:"Workflow",        desc:"Personalized shift cockpit",             route:"/command-center"       },
  { id:"tracking",      name:"Tracking Board",       icon:"📋",  color:T.teal,   cat:"Workflow",        desc:"Live ED census & orders",                route:"/EDTrackingBoard"      },
  { id:"disposition",   name:"Disposition Board",    icon:"🚪",  color:T.blue,   cat:"Workflow",        desc:"Boarding timers & bed status",           route:"/DispositionBoard"     },
  { id:"workspace",     name:"Patient Workspace",    icon:"🔬",  color:T.teal,   cat:"Workflow",        desc:"Single-patient bedside cockpit",         route:"/patient-workspace"    },
  { id:"narrative",     name:"Narrative Engine",     icon:"🧠",  color:T.purple, cat:"Workflow",        desc:"Living clinical stories",                route:"/narrative-engine"     },
  { id:"critical",      name:"Critical Inbox",       icon:"🚨",  color:T.red,    cat:"Workflow",        desc:"Cross-patient critical results",         route:"/critical-inbox"       },
  { id:"signout",       name:"Shift Sign-Out",       icon:"👋",  color:T.gold,   cat:"Workflow",        desc:"I-PASS handoff at shift change",         route:"/shift-signout"        },
  { id:"huddle",        name:"Huddle Board",         icon:"🏥",  color:T.teal,   cat:"Workflow",        desc:"Department acuity, clocks & tasks",      route:"/huddle-board"         },
  { id:"quicknote",     name:"QuickNote",            icon:"⚡",  color:T.teal,   cat:"Workflow",        desc:"Rapid MDM & disposition generator",      route:"/QuickNote"            },
  { id:"notehistory",   name:"Note History",         icon:"📂",  color:T.txt3,   cat:"Workflow",        desc:"Browse & copy past clinical notes",      route:"/notehistory"          },
  { id:"aiflag",        name:"AI Flag Review",       icon:"🚩",  color:T.red,    cat:"Workflow",        desc:"Review AI-flagged clinical findings",    route:"/AIFlagReview"         },
  { id:"templatestudio",name:"Template Studio",      icon:"✏️",  color:T.purple, cat:"Workflow",        desc:"Build custom HPI, ROS, PE templates",    route:"/TemplateStudio"       },
  // AI Tools
  { id:"ddx",           name:"DDx Engine",           icon:"🔍",  color:T.purple, cat:"AI Tools",        desc:"AI-weighted differential diagnosis",     route:"/ddx-engine"           },
  { id:"dosing",        name:"Smart Dosing",         icon:"💊",  color:T.green,  cat:"AI Tools",        desc:"Renal/hepatic/weight dosing",            route:"/smart-dosing"         },
  { id:"weightdose",    name:"Weight/Dose Hub",      icon:"⚖️",  color:T.green,  cat:"AI Tools",        desc:"Weight-based emergency drug dosing",     route:"/weight-dose"          },
  { id:"imaging",       name:"Imaging Interpreter",  icon:"🩻",  color:T.blue,   cat:"AI Tools",        desc:"AI radiology report interpretation",     route:"/imaging-interpreter"  },
  { id:"labinterp",     name:"Lab Interpreter",      icon:"📊",  color:T.blue,   cat:"AI Tools",        desc:"47 labs & imaging patterns",             route:"/lab-interpreter"      },
  { id:"scorehub",      name:"Score Hub",            icon:"🎯",  color:T.gold,   cat:"AI Tools",        desc:"Clinical scoring calculators",           route:"/score-hub"            },
  // Clinical Hubs — Cardiovascular & Resus
  { id:"resus",         name:"ResusHub",             icon:"🫀",  color:T.red,    cat:"Hubs",            desc:"ACLS algorithms & vasopressors",         route:"/resus-hub"            },
  { id:"ecg",           name:"ECGHub",               icon:"🩺",  color:T.gold,   cat:"Hubs",            desc:"Waveforms, STEMI, QTc",                  route:"/ecg-hub"              },
  { id:"cardiac",       name:"Cardiac Hub",          icon:"❤️",  color:T.red,    cat:"Hubs",            desc:"ACS, heart failure, arrhythmias",        route:"/cardiac-hub"          },
  { id:"shock",         name:"ShockHub",             icon:"💉",  color:T.red,    cat:"Hubs",            desc:"Hemodynamic profiles, pressors",         route:"/shock-hub"            },
  { id:"stroke",        name:"Stroke Hub",           icon:"🧠",  color:T.purple, cat:"Hubs",            desc:"NIHSS, tPA criteria, door-to-needle",    route:"/StrokeHub"            },
  // Clinical Hubs — Respiratory & Airway
  { id:"airway",        name:"AirwayHub",            icon:"🌬",  color:T.blue,   cat:"Hubs",            desc:"RSI, LEMON, CICO pathway",               route:"/airway-hub"           },
  { id:"surgairway",    name:"Surgical Airway Hub",  icon:"🔪",  color:T.orange, cat:"Hubs",            desc:"Cric, emergency airway algorithms",      route:"/surgical-airway-hub"  },
  { id:"dyspnea",       name:"Dyspnea Hub",          icon:"🫁",  color:T.blue,   cat:"Hubs",            desc:"Shortness of breath workup & mgmt",      route:"/DyspneaHub"           },
  // Clinical Hubs — Infection & Sepsis
  { id:"sepsis",        name:"SepsisHub",            icon:"🩸",  color:T.orange, cat:"Hubs",            desc:"Sepsis-3, antibiotics, qSOFA",           route:"/sepsis-hub"           },
  { id:"sepsisabx",     name:"Sepsis Abx Hub",       icon:"💊",  color:T.orange, cat:"Hubs",            desc:"Antibiotic selection & dosing",          route:"/sepsis-hub"           },
  { id:"idhub",         name:"Infectious Disease Hub",icon:"🦠", color:T.green,  cat:"Hubs",            desc:"Empiric abx, ID workup",                 route:"/id-hub"               },
  { id:"electrolytes",  name:"Electrolyte & Acid-Base Hub", icon:"⚗️", color:"#00bcd4", cat:"Hubs",    desc:"ABG/VBG · Osmolar gaps · Hyperkalemia",  route:"/ElectrolyteAcidBaseHub"},
  // Clinical Hubs — Neuro & Psych
  { id:"psych",         name:"PsychHub",             icon:"💭",  color:T.purple, cat:"Hubs",            desc:"Agitation, SI, intoxication",            route:"/psyche-hub"           },
  { id:"seizure",       name:"Seizure Hub",          icon:"⚡",  color:T.purple, cat:"Hubs",            desc:"Status epilepticus protocol",            route:"/seizure-hub"          },
  { id:"headache",      name:"Headache Hub",         icon:"🤕",  color:T.purple, cat:"Hubs",            desc:"SAH, meningitis, migraine workup",       route:"/HeadacheHub"          },
  { id:"ams",           name:"AMS Hub",              icon:"😵",  color:T.purple, cat:"Hubs",            desc:"Altered mental status evaluation",       route:"/AMSHub"               },
  { id:"syncope",       name:"Syncope Hub",          icon:"🫸",  color:T.purple, cat:"Hubs",            desc:"Syncope risk stratification",            route:"/SyncopeHub"           },
  // Clinical Hubs — GI, GU, OB
  { id:"abdominal",     name:"Abdominal Pain Hub",   icon:"🫃",  color:T.gold,   cat:"Hubs",            desc:"Abdominal pain differential & workup",  route:"/AbdominalPainHub"     },
  { id:"obgyn",         name:"OB/GYN Hub",           icon:"🤰",  color:T.teal,   cat:"Hubs",            desc:"OB emergencies, ectopic, preeclampsia",  route:"/OBGYNHub"             },
  // Clinical Hubs — MSK, Derm, Wound
  { id:"ortho",         name:"Ortho Hub",            icon:"🦴",  color:T.blue,   cat:"Hubs",            desc:"Fractures, dislocations, Ottawa rules",  route:"/OrthoHub"             },
  { id:"wound",         name:"Wound Hub",            icon:"🩹",  color:T.teal,   cat:"Hubs",            desc:"Laceration & wound management",          route:"/wound-hub"            },
  { id:"woundcare",     name:"Wound Care Hub",       icon:"🩼",  color:T.teal,   cat:"Hubs",            desc:"Advanced wound care protocols",          route:"/WoundCareHub"         },
  { id:"derm",          name:"Derm Hub",             icon:"🫁",  color:T.orange, cat:"Hubs",            desc:"Skin emergencies, rashes, SJS/TEN",      route:"/derm-hub"             },
  // Clinical Hubs — Tox, Trauma, Peds
  { id:"tox",           name:"Toxicology Hub",       icon:"☠️",  color:T.red,    cat:"Hubs",            desc:"Overdose management & antidotes",        route:"/tox-hub"              },
  { id:"antidote",      name:"AntidoteHub",          icon:"🧪",  color:T.teal,   cat:"Hubs",            desc:"20 antidotes with dosing",               route:"/antidote-hub"         },
  { id:"trauma",        name:"Trauma Hub",           icon:"🚑",  color:T.red,    cat:"Hubs",            desc:"Primary survey, massive transfusion",    route:"/trauma-hub"           },
  { id:"peds",          name:"Pediatrics Hub",       icon:"👶",  color:T.teal,   cat:"Hubs",            desc:"Pediatric emergencies & dosing",         route:"/peds-hub"             },
  // Clinical Hubs — Chest, Pain, DVT
  { id:"emtala",        name:"EMTALA Hub",           icon:"⚖️",  color:T.gold,   cat:"Hubs",            desc:"Regulatory compliance & transfer protocols", route:"/EMTALAHub"        },
  { id:"chestpain",     name:"Chest Pain Hub",       icon:"💔",  color:T.red,    cat:"Hubs",            desc:"ACS, PE, aortic dissection workup",      route:"/ChestPainHub"         },
  { id:"pain",          name:"Pain Hub",             icon:"🔥",  color:T.orange, cat:"Hubs",            desc:"Multimodal analgesia protocols",         route:"/pain-hub"             },
  { id:"dvt",           name:"DVT Hub",              icon:"🩺",  color:T.blue,   cat:"Hubs",            desc:"DVT/PE workup & anticoagulation",        route:"/dvt-hub"              },
  // Clinical Hubs — Procedures & Radiology
  { id:"procedure",     name:"Procedure Hub",        icon:"🔧",  color:T.blue,   cat:"Hubs",            desc:"Bedside procedure guides",               route:"/procedure-hub"        },
  { id:"edprocnotes",   name:"ED Procedure Notes",   icon:"📋",  color:T.blue,   cat:"Hubs",            desc:"Generate ED procedure documentation",    route:"/ed-procedure-notes"   },
  { id:"pocus",         name:"POCUS Hub",            icon:"🔊",  color:T.teal,   cat:"Hubs",            desc:"Bedside ultrasound protocols",           route:"/pocus-hub"            },
  { id:"radiology",     name:"Radiology Hub",        icon:"🩻",  color:T.blue,   cat:"Hubs",            desc:"X-ray & CT interpretation guides",       route:"/radiology-hub"        },
  // Clinical Hubs — Triage, Rapid, Discharge, Consult
  { id:"triage",        name:"Triage Hub",           icon:"🏃",  color:T.orange, cat:"Hubs",            desc:"ESI triage & acuity scoring",            route:"/triage-hub"           },
  { id:"rapidassess",   name:"Rapid Assessment Hub", icon:"⚡",  color:T.orange, cat:"Hubs",            desc:"Complaint-based rapid workup",           route:"/rapid-assessment-hub" },
  { id:"consult",       name:"Consult Hub",          icon:"📞",  color:T.txt3,   cat:"Hubs",            desc:"Specialty consult guides",               route:"/consult-hub"          },
  { id:"discharge",     name:"Discharge Hub",        icon:"🏠",  color:T.green,  cat:"Hubs",            desc:"Safe discharge planning & instructions", route:"/discharge-hub"        },
  // Tools & Reference
  { id:"ecg2",          name:"ECG Hub",              icon:"📈",  color:T.gold,   cat:"Reference",       desc:"Waveforms, STEMI, QTc",                  route:"/ecg-hub"              },
  { id:"erx",           name:"ERxHub",               icon:"📝",  color:T.teal,   cat:"Reference",       desc:"ED prescriptions & PDMP",                route:"/erx"                  },
  { id:"knowledge",     name:"Guidelines",           icon:"📚",  color:T.gold,   cat:"Reference",       desc:"Clinical guidelines & evidence",         route:"/KnowledgeBaseV2"      },
  { id:"hpi",           name:"HPI Builder",          icon:"✍️",  color:T.txt3,   cat:"Reference",       desc:"HPI documentation templates",            route:"/hpi"                  },
  { id:"billing",       name:"Provider Billing",     icon:"💵",  color:T.green,  cat:"Reference",       desc:"E&M coding & billing submissions",       route:"/provider-billing"     },
  { id:"ordergenerator",name:"ED Order Hub",          icon:"📋",  color:T.blue,   cat:"Reference",       desc:"Labs, meds, imaging & AI order sets",    route:"/EDOrderHub"           },
  { id:"dermref",       name:"Derm Morphology Ref",  icon:"🔎",  color:T.orange, cat:"Reference",       desc:"Skin morphology visual reference",       route:"/derm-morphology"      },
  // Platform
  { id:"resustimer",    name:"Resus Timer",          icon:"⏱",   color:T.red,    cat:"Platform",        desc:"Live code — CPR cycles & drugs",        route:"/resus-hub"            },
  { id:"calendar",      name:"Shift Calendar",       icon:"📅",  color:T.txt4,   cat:"Platform",        desc:"Provider schedule & shifts",             route:"/Calendar"             },
  { id:"landing",       name:"Platform Overview",    icon:"🏠",  color:T.txt4,   cat:"Platform",        desc:"About Notrya",                           route:"/landing"              },
];

export const CATS = ["Workflow", "AI Tools", "Hubs", "Reference", "Platform"];
export const CAT_COLOR = { "Workflow":T.teal, "AI Tools":T.purple, "Hubs":T.orange, "Reference":T.blue, "Platform":T.txt4 };