import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ─── HUB REGISTRY ─────────────────────────────────────────────────────────────
const HUBS = [
  {
    id: "cardiac",
    route: "/cardiac-hub",
    icon: "🫀",
    abbr: "CARD",
    title: "Cardiac",
    // CHANGED: reflects expanded hub — ECG + Chest Pain now live inside CardiacHub
    subtitle: "ACS · ECG · Chest Pain · Tachycardia · Bradycardia · PALS · OB Arrest",
    color: "#ff6b6b",
    glow: "rgba(255,107,107,0.4)",
    glass: "rgba(255,107,107,0.07)",
    border: "rgba(255,107,107,0.28)",
    accent: "#ff9999",
    category: "Critical Care",
    // CHANGED: 8 protocols, updated stats
    stats: ["8 Protocols", "2025 ACC/AHA", "ECG · HEART · TNK"],
    badge: "2025 ACC/AHA",
    priority: 1,
    essential: true,
  },
  {
    id: "neuro",
    route: "/StrokeAssessment",
    icon: "🧠",
    abbr: "NEURO",
    title: "Neuro",
    subtitle: "Stroke · TIA · Seizure · Altered Mental Status",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Critical Care",
    stats: ["AHA Stroke", "NIHSS", "tPA Tool"],
    badge: "AHA 2023",
    priority: 2,
    essential: true,
  },
  {
    id: "trauma",
    route: "/trauma-hub",
    icon: "🩹",
    abbr: "TRAUMA",
    title: "Trauma",
    subtitle: "ATLS · Primary Survey · Haemorrhage Control",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.4)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    accent: "#ffb76b",
    category: "Critical Care",
    stats: ["ATLS Protocol", "Damage Control", "Transfusion"],
    badge: "ATLS 11th Ed",
    priority: 3,
    essential: true,
  },
  {
    id: "airway",
    route: "/airway-hub",
    icon: "🌬️",
    abbr: "AIRWAY",
    title: "Airway",
    subtitle: "RSI · Difficult Airway · Ventilator Management",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Procedures",
    stats: ["RSI Protocol", "ARDS Net", "Difficult Airway"],
    badge: "Clinical Tools",
    priority: 4,
    essential: true,
  },
  {
    id: "quicknote",
    route: "/QuickNote",
    icon: "📋",
    abbr: "QUICKNOTE",
    title: "QuickNote",
    subtitle: "Paste-to-MDM · ACEP Disposition · Discharge Rx · 2-phase AI workflow",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["MDM · 2023 E&M", "ACEP Disposition", "Discharge Rx"],
    badge: "AI-Powered",
    priority: 4.5,
    essential: true,
  },
  {
    id: "autocoder",
    route: "/AutoCoder",
    icon: "🤖",
    abbr: "CODE",
    title: "AutoCoder",
    subtitle: "AI-powered ICD-10 · CPT · E/M coding",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Tools",
    stats: ["ICD-10", "CPT", "E/M Levels"],
    badge: "AI-Powered",
    priority: 5,
  },
  {
    id: "calculator",
    route: "/Calculators",
    icon: "🧮",
    abbr: "CALC",
    title: "Calculator",
    subtitle: "Clinical scores, dosing, risk stratification",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["40+ Calculators", "Weight-based", "GRACE · TIMI"],
    badge: "Clinical Tools",
    priority: 6,
  },
  {
    id: "erx",
    route: "/erx",
    icon: "💊",
    abbr: "eRx",
    title: "ePrescribing",
    subtitle: "Formulary · Drug interactions · DEA schedules",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.35)",
    glass: "rgba(255,159,67,0.06)",
    border: "rgba(255,159,67,0.25)",
    accent: "#ffb76b",
    category: "Tools",
    stats: ["Drug DB", "Interactions", "Controlled Rx"],
    badge: "Live",
    priority: 7,
  },
  {
    id: "guidelines",
    route: "/KnowledgeBaseV2",
    icon: "📚",
    abbr: "GUIDE",
    title: "Medical Guidelines",
    subtitle: "Evidence-based clinical guidelines · Best practices",
    color: "#6b63ff",
    glow: "rgba(107,99,255,0.4)",
    glass: "rgba(107,99,255,0.07)",
    border: "rgba(107,99,255,0.28)",
    accent: "#8b83ff",
    category: "Tools",
    stats: ["ACC/AHA", "ACCP", "CDC"],
    badge: "Coming Soon",
    priority: 8,
  },
  {
    id: "ob",
    route: "/ob-hub",
    icon: "🤰",
    abbr: "OB/GYN",
    title: "OB/GYN",
    subtitle: "Obstetric Emergencies · Pre-eclampsia · PPH",
    color: "#ff6b9d",
    glow: "rgba(255,107,157,0.4)",
    glass: "rgba(255,107,157,0.07)",
    border: "rgba(255,107,157,0.28)",
    accent: "#ff9ec0",
    category: "Specialty",
    stats: ["HELLP", "Pre-eclampsia", "PPH Protocol"],
    badge: "ACOG",
    priority: 9,
  },
  {
    id: "peds",
    route: "/peds-hub",
    icon: "👶",
    abbr: "PEDS",
    title: "Pediatric",
    subtitle: "PALS · Broselow · Weight-based Dosing",
    color: "#b99bff",
    glow: "rgba(185,155,255,0.4)",
    glass: "rgba(185,155,255,0.07)",
    border: "rgba(185,155,255,0.28)",
    accent: "#ccb8ff",
    category: "Specialty",
    stats: ["PALS 2025", "Broselow", "Neonatal"],
    badge: "AHA/AAP 2025",
    priority: 10,
  },
  {
    id: "procedures",
    route: "/Procedures",
    icon: "✂️",
    abbr: "PROC",
    title: "Procedures",
    subtitle: "Bedside procedures, consent, documentation",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.35)",
    glass: "rgba(0,212,255,0.06)",
    border: "rgba(0,212,255,0.25)",
    accent: "#33deff",
    category: "Procedures",
    stats: ["LP · Thoraco", "Central Line", "Pericardio"],
    badge: "Clinical Tools",
    priority: 11,
  },
  {
    id: "sepsis",
    route: "/sepsis-hub",
    icon: "🦠",
    abbr: "SEPSIS",
    title: "Sepsis",
    subtitle: "Sepsis-3 · Bundles · Antibiotic Stewardship",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.4)",
    glass: "rgba(245,200,66,0.07)",
    border: "rgba(245,200,66,0.28)",
    accent: "#f7d875",
    category: "Critical Care",
    stats: ["Sepsis-3 Criteria", "Hour-1 Bundle", "SOFA Score"],
    badge: "SSC 2021",
    priority: 12,
  },
  {
    id: "tox",
    route: "/tox-hub",
    icon: "☠️",
    abbr: "TOX",
    title: "Toxicology",
    subtitle: "Overdose · Antidotes · Toxidromes",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.35)",
    glass: "rgba(61,255,160,0.06)",
    border: "rgba(61,255,160,0.25)",
    accent: "#6fffbb",
    category: "Critical Care",
    stats: ["Toxidromes", "Antidotes", "Poison Control"],
    badge: "Clinical Tools",
    priority: 13,
  },
  {
    id: "calendar",
    route: "/Calendar",
    icon: "📅",
    abbr: "CAL",
    title: "Provider Schedule",
    subtitle: "Shift calendar · Day, night, on-call · Monthly tracking",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["Month View", "Week View", "Shift Tracking"],
    badge: "Live",
    priority: 7.5,
  },
  {
    id: "newpatient",
    route: "/NewPatientInput",
    icon: "🆕",
    abbr: "NEW PT",
    title: "New Patient Input",
    subtitle: "Patient intake · Chart · Documentation · Disposition",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["Demographics", "Vitals", "Full Chart"],
    badge: "Clinical Workflow",
    priority: 14,
    essential: true,
  },
  {
    id: "labs-imaging",
    route: "/LabsImaging",
    icon: "🧪",
    abbr: "LABS",
    title: "Labs & Imaging",
    subtitle: "Critical value reference · CXR/CT pattern recognition · Result interpretation",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Tools",
    stats: ["Critical Values", "CXR Patterns", "CT Findings"],
    badge: "Coming Soon",
    priority: 15,
  },
  {
    id: "triage",
    route: "/triage-hub",
    icon: "🏷️",
    abbr: "TRIAGE",
    title: "Triage Hub",
    subtitle: "ESI Calculator · START/SALT MCI · Danger Vitals · CC Quick Sort",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.4)",
    glass: "rgba(251,146,60,0.07)",
    border: "rgba(251,146,60,0.28)",
    accent: "#fdba74",
    category: "Tools",
    stats: ["ESI v4", "START / SALT", "AI Assistant"],
    badge: "Live",
    priority: 16,
    essential: true,
  },
  {
    id: "rapid-assessment",
    route: "/rapid-assessment-hub",
    icon: "⚡",
    abbr: "RAPID",
    title: "Rapid Assessment",
    subtitle: "10-minute workup templates · Time-phased by chief complaint · Checkable steps",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    glass: "rgba(6,182,212,0.07)",
    border: "rgba(6,182,212,0.28)",
    accent: "#22d3ee",
    category: "Tools",
    stats: ["10 Templates", "Time-Phased", "Step Tracker"],
    badge: "Live",
    priority: 17,
    essential: true,
  },
  {
    id: "psyche-hub",
    route: "/psyche-hub",
    icon: "🧠",
    abbr: "PSYCH",
    title: "Psychiatry",
    subtitle: "Agitation · NMS · Serotonin Syndrome · Bipolar · Suicide Risk",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Specialty",
    stats: ["8 Protocols", "Screening Tools", "NMS/SS"],
    badge: "Live",
    priority: 19,
    essential: false,
  },
  // REMOVED: ecg-hub (id: "ecg-hub", route: "/ecg-hub")
  // ECG Hub now lives inside CardiacHub — accessed via /cardiac-hub → ECG tab
  {
    id: "surgical-airway",
    route: "/surgical-airway-hub",
    icon: "🔪",
    abbr: "SURG AIR",
    title: "Surgical Airway",
    subtitle: "CICO · Cricothyrotomy · RSI · Difficult Airway · Vent Settings",
    color: "#ff4444",
    glow: "rgba(255,68,68,0.4)",
    glass: "rgba(255,68,68,0.07)",
    border: "rgba(255,68,68,0.28)",
    accent: "#ff7777",
    category: "Procedures",
    stats: ["RSI Calculator", "LEMON Score", "CICO Protocol"],
    badge: "Live",
    priority: 20,
    essential: false,
  },
  {
    id: "shock",
    route: "/shock-hub",
    icon: "🚨",
    abbr: "SHOCK",
    title: "Shock Hub",
    subtitle: "Classification · Septic · Cardiogenic · Hypovolemic · Lactate-directed",
    color: "#ff6b6b",
    glow: "rgba(255,107,107,0.4)",
    glass: "rgba(255,107,107,0.07)",
    border: "rgba(255,107,107,0.28)",
    accent: "#ff9999",
    category: "Critical Care",
    stats: ["5 Shock Types", "Management Protocol", "Monitoring"],
    badge: "Live",
    priority: 21,
    essential: true,
  },
  {
    id: "pocus",
    route: "/pocus-hub",
    icon: "🔬",
    abbr: "POCUS",
    title: "POCUS Hub",
    subtitle: "RUSH · BLUE · eFAST protocols · Annotated findings · Documentation template",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Procedures",
    stats: ["RUSH Exam", "BLUE Protocol", "eFAST"],
    badge: "Live",
    priority: 22,
    essential: true,
  },
  {
    id: "ortho",
    route: "/ortho-hub",
    icon: "🦴",
    abbr: "ORTHO",
    title: "Orthopaedic Hub",
    subtitle: "Fractures · Dislocations · Compartment Syndrome · Ottawa Rules",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
    glass: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.28)",
    accent: "#c4b5fd",
    category: "Specialty",
    stats: ["5 Fracture Types", "4 Dislocations", "Ottawa Rules"],
    badge: "Live",
    priority: 23,
    essential: false,
  },
  {
    id: "resus",
    route: "/resus-hub",
    icon: "💓",
    abbr: "RESUS",
    title: "Resuscitation Hub",
    subtitle: "ACLS Algorithms · Resus Meds · Defib · Airway · 5H5T · Post-ROSC",
    color: "#ff4444",
    glow: "rgba(255,68,68,0.4)",
    glass: "rgba(255,68,68,0.07)",
    border: "rgba(255,68,68,0.28)",
    accent: "#ff7777",
    category: "Critical Care",
    stats: ["4 ACLS Algorithms", "10 Resus Meds", "5H5T Guide"],
    badge: "Live",
    priority: 24,
    essential: true,
  },
  {
    id: "antidote",
    route: "/antidote-hub",
    icon: "🧬",
    abbr: "ANTIDOTE",
    title: "Antidote Hub",
    subtitle: "Antidote Reference · NOAC Reversal · Toxidromes · Dosing · Monitoring",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.4)",
    glass: "rgba(61,255,160,0.07)",
    border: "rgba(61,255,160,0.28)",
    accent: "#6fffbb",
    category: "Critical Care",
    stats: ["12 Antidotes", "NOAC Reversal", "7 Toxidromes"],
    badge: "Live",
    priority: 25,
    essential: false,
  },
  {
    id: "radiology",
    route: "/radiology-hub",
    icon: "🩻",
    abbr: "RADIOLOGY",
    title: "Radiology Hub",
    subtitle: "CXR · CT Head · CT Abdomen — Systematic Approach · Classic Patterns · Don't-Miss Dx",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Tools",
    stats: ["CXR A-F System", "CT Head Patterns", "CT Abd Patterns"],
    badge: "Live",
    priority: 26,
    essential: false,
  },
  {
    id: "procedure-hub",
    route: "/procedure-hub",
    icon: "✂️",
    abbr: "PROC",
    title: "Procedure Hub",
    subtitle: "Step-by-step guides · Equipment checklists · Complications · AI Scrub-In",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Procedures",
    stats: ["8 Procedures", "Step-by-Step", "AI Scrub-In"],
    badge: "Live",
    priority: 11,
    essential: false,
  },
  {
    id: "id-hub",
    route: "/id-hub",
    icon: "🦠",
    abbr: "ID",
    title: "Infectious Disease",
    subtitle: "Antibiotics · Resistant Organisms · HIV/OI · Travel Medicine · Isolation Precautions · AI ID Coach",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.4)",
    glass: "rgba(61,255,160,0.07)",
    border: "rgba(61,255,160,0.28)",
    accent: "#6fffbb",
    category: "Tools",
    stats: ["Antibiotic Guides", "Resistant Orgs", "AI ID Coach"],
    badge: "Live",
    priority: 29,
    essential: false,
  },
  {
    id: "discharge",
    route: "/discharge-hub",
    icon: "🏠",
    abbr: "D/C",
    title: "Discharge Hub",
    subtitle: "Disposition Criteria · Discharge Checklist · Return Precautions · AI Discharge Note Generator",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Tools",
    stats: ["5 Disposition Guides", "26 Checklist Items", "AI Note Generator"],
    badge: "Live",
    priority: 30,
    essential: false,
  },
  {
    id: "consult",
    route: "/consult-hub",
    icon: "📡",
    abbr: "CONSULT",
    title: "Consult Hub",
    subtitle: "16 Specialties · Pre-Call Prep · Escalation Criteria · AI Consult Coach",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Tools",
    stats: ["16 Specialties", "Pre-Call Checklists", "AI Coach"],
    badge: "Live",
    priority: 28,
    essential: false,
  },
  {
    id: "results",
    route: "/Results",
    icon: "🧪",
    abbr: "RESULTS",
    title: "Results Hub",
    subtitle: "Labs · Vitals · EKG · Imaging · EMR Paste Import · AI Integrated Synthesis",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Tools",
    stats: ["Critical Value Flags", "EMR Paste Import", "AI Synthesis"],
    badge: "Live",
    priority: 27,
    essential: false,
  },
  {
    id: "wound",
    route: "/wound-hub",
    icon: "🩹",
    abbr: "WOUND",
    title: "Wound Hub",
    subtitle: "Wound Assessment · Dressing Selection · Management Protocols",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.4)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    accent: "#ffb76b",
    category: "Tools",
    stats: ["Assessment Framework", "Dressing Guide", "Clinical Reference"],
    badge: "Live",
    priority: 31,
    essential: false,
  },
  {
    id: "command-center",
    route: "/command-center",
    icon: "⚕️",
    abbr: "CMD",
    title: "Command Center",
    subtitle: "Provider dashboard · AI shift briefing · Attention queue · Smart hub launcher",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.45)",
    glass: "rgba(0,229,192,0.08)",
    border: "rgba(0,229,192,0.3)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["AI Briefing", "Attention Queue", "Smart Hubs"],
    badge: "Live",
    priority: 0.5,
    essential: true,
  },
  {
    id: "dispo-board",
    route: "/DispositionBoard",
    icon: "\uD83D\uDEAA",
    abbr: "DISPO",
    title: "Disposition Board",
    subtitle: "Admit \u00b7 Discharge \u00b7 Transfer \u00b7 Boarding Timers \u00b7 Bed Status",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["Boarding Timers", "Bed Requests", "Status Tracker"],
    badge: "Live",
    priority: 32,
    essential: false,
  },
  {
    id: "critical-inbox",
    route: "/critical-inbox",
    icon: "🔴",
    abbr: "CRITICAL",
    title: "Critical Results Inbox",
    subtitle: "Critical & panic value alerts · Acknowledge · Audit trail · Escalation timers",
    color: "#ff4444",
    glow: "rgba(255,68,68,0.45)",
    glass: "rgba(255,68,68,0.08)",
    border: "rgba(255,68,68,0.3)",
    accent: "#ff7777",
    category: "Tools",
    stats: ["Critical Values", "Ack Audit Trail", "Escalation Timers"],
    badge: "Live",
    priority: 1.5,
    essential: true,
  },
  // REMOVED: chestpain (id: "chestpain", route: "/ChestPainHub")
  // Chest Pain Hub now lives inside CardiacHub — accessed via /cardiac-hub → Chest Pain tab
  {
    id: "dyspnea",
    route: "/DyspneaHub",
    icon: "💨",
    abbr: "DYSPNEA",
    title: "Dyspnea Hub",
    subtitle: "BLUE Protocol · PE Pathway · CHF / ADHF · COPD / Pneumonia",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Chief Complaint",
    stats: ["BLUE Protocol", "PE Pathway", "CHF / ADHF"],
    badge: "BLUE·PE",
    priority: 34,
  },
  {
    id: "headache",
    route: "/HeadacheHub",
    icon: "🤕",
    abbr: "HEADACHE",
    title: "Headache Hub",
    subtitle: "SNOOP4 Red Flags · Ottawa SAH Rule · LP Interpretation · Treatment",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Chief Complaint",
    stats: ["SNOOP4 Flags", "Ottawa SAH", "LP Interpretation"],
    badge: "OTTAWA·SAH",
    priority: 35,
  },
  {
    id: "abdpain",
    route: "/AbdominalPainHub",
    icon: "🔴",
    abbr: "ABD PAIN",
    title: "Abdominal Pain Hub",
    subtitle: "Alvarado · BISAP · Glasgow-Blatchford · Tokyo 2018",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.4)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    accent: "#ffb76b",
    category: "Chief Complaint",
    stats: ["Alvarado Score", "BISAP", "GI Bleed"],
    badge: "ALVARADO",
    priority: 36,
  },
  {
    id: "ams",
    route: "/ams-hub",
    icon: "😵",
    abbr: "AMS",
    title: "AMS Hub",
    subtitle: "AEIOU-TIPS · CAM-ICU · RASS Scale · Specific Syndromes",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Chief Complaint",
    stats: ["AEIOU-TIPS", "CAM-ICU", "RASS Scale"],
    badge: "AEIOU-TIPS",
    priority: 37,
  },
  {
    id: "syncope",
    route: "/syncope-hub",
    icon: "💫",
    abbr: "SYNCOPE",
    title: "Syncope Hub",
    subtitle: "SFSR + CSRS · High-Risk Features · Ottawa ECG · Disposition",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.4)",
    glass: "rgba(245,200,66,0.07)",
    border: "rgba(245,200,66,0.28)",
    accent: "#f7d875",
    category: "Chief Complaint",
    stats: ["SFSR + CSRS", "High-Risk Features", "Disposition"],
    badge: "SFSR·CSRS",
    priority: 38,
  },
  {
    id: "dvt",
    route: "/dvt-hub",
    icon: "🩸",
    abbr: "DVT/VTE",
    title: "DVT / VTE Hub",
    subtitle: "Wells DVT Score · DOAC Selection · Renal Dosing · IVC Filter",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Specialty",
    stats: ["Wells DVT Score", "DOAC Selection", "Renal Dosing"],
    badge: "DOAC·WELLS",
    priority: 39,
  },
  {
    id: "scores",
    route: "/score-hub",
    icon: "🎯",
    abbr: "SCORES",
    title: "Score Hub",
    subtitle: "12+ Validated Scores · HEART · Wells · Ottawa · GCS · ABCD2",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Tools",
    stats: ["HEART / Wells", "Ottawa / NEXUS", "CURB-65 / GCS"],
    badge: "12+ TOOLS",
    priority: 40,
  },
  {
    id: "pain",
    route: "/pain-hub",
    icon: "🩺",
    abbr: "PAIN",
    title: "Pain Hub",
    subtitle: "Acute Pain Ladder · Opioid Dosing · Nerve Blocks · Adjuncts",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.4)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    accent: "#ffb76b",
    category: "Pharmacology",
    stats: ["Pain Ladder", "Opioid Dosing", "Nerve Blocks"],
    badge: "MULTIMODAL",
    priority: 41,
  },
  {
    id: "weightdose",
    route: "/weight-dose",
    icon: "⚖️",
    abbr: "WT DOSE",
    title: "Weight Dose Hub",
    subtitle: "30 Critical Drugs · RSI · Vasopressors · Live Infusion Rates",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Pharmacology",
    stats: ["RSI / Vasopressors", "Live Infusion Calc", "Reversal Agents"],
    badge: "30 DRUGS",
    priority: 42,
  },
  {
    id: "sepsisabx",
    route: "/SepsisHub",
    icon: "💉",
    abbr: "SEPSIS ABX",
    title: "Sepsis ABX Hub",
    subtitle: "7 Source-Based Empiric Antibiotic Sets · Resistance · De-escalation",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.4)",
    glass: "rgba(61,255,160,0.07)",
    border: "rgba(61,255,160,0.28)",
    accent: "#6fffbb",
    category: "Critical Care",
    stats: ["7 Source Sets", "Empiric Tiers", "De-escalation"],
    badge: "SOURCE-BASED",
    priority: 43,
  },
  {
    id: "labinterpreter",
    route: "/LabInterpreter",
    icon: "🧪",
    abbr: "LABS",
    title: "Lab Interpreter",
    subtitle: "BMP / CBC / LFTs · Anion Gap · AI Interpretation · Critical Values",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.4)",
    glass: "rgba(61,255,160,0.07)",
    border: "rgba(61,255,160,0.28)",
    accent: "#6fffbb",
    category: "Diagnostics",
    stats: ["BMP / CBC / LFTs", "Anion Gap / P/F", "AI Interpretation"],
    badge: "AI·PASTE",
    priority: 44,
  },
  {
    id: "imaging",
    route: "/imaging-interpreter",
    icon: "🩻",
    abbr: "IMAGING",
    title: "Imaging Interpreter",
    subtitle: "CXR · CT Head · CT Chest/PE · CT Abdomen — AI Interpretation",
    color: "#82aece",
    glow: "rgba(130,174,206,0.4)",
    glass: "rgba(130,174,206,0.07)",
    border: "rgba(130,174,206,0.28)",
    accent: "#aacde0",
    category: "Diagnostics",
    stats: ["CXR Patterns", "CT Head", "CT Abdomen"],
    badge: "IMAGING",
    priority: 45,
  },
  {
    id: "woundcare",
    route: "/wound-care-hub",
    icon: "🩹",
    abbr: "WOUND CARE",
    title: "Wound Care Hub",
    subtitle: "Laceration Management · Closure Type · Suture Sizing · Wound Care",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.4)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    accent: "#ffb76b",
    category: "Procedures",
    stats: ["Closure Selection", "Suture Sizing", "Irrigation"],
    badge: "CLOSURE",
    priority: 46,
  },
  {
    id: "seizure",
    route: "/seizure-hub",
    icon: "⚡",
    abbr: "SEIZURE",
    title: "Seizure Hub",
    subtitle: "Status Epilepticus · BZD Dosing · NCSE · Post-ictal Management",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Specialty",
    stats: ["Status Epilepticus", "BZD Protocol", "NCSE"],
    badge: "Live",
    priority: 47,
  },
  {
    id: "smartdosing",
    route: "/smart-dosing",
    icon: "💡",
    abbr: "SMART DOSE",
    title: "Smart Dosing Hub",
    subtitle: "AI-Assisted Drug Dosing · Renal Adjustments · Interactions",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Pharmacology",
    stats: ["AI Dosing", "Renal Adjust", "Interactions"],
    badge: "AI-Powered",
    priority: 48,
  },
  {
    id: "stroke",
    route: "/stroke-hub",
    icon: "🧠",
    abbr: "STROKE",
    title: "Stroke Hub",
    subtitle: "Stroke Protocols · tPA · Thrombectomy · Post-Stroke Care",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Critical Care",
    stats: ["tPA Protocol", "Thrombectomy", "NIHSS"],
    badge: "Live",
    priority: 49,
    essential: false,
  },
  {
    id: "ddx",
    route: "/ddx-engine",
    icon: "🔎",
    abbr: "DDx",
    title: "DDx Engine",
    subtitle: "AI Differential Diagnosis · Symptom Matching · Probability Ranking",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Tools",
    stats: ["AI-Powered", "Symptom Match", "Probability"],
    badge: "AI-Powered",
    priority: 50,
    essential: false,
  },
  {
    id: "ed-tracking",
    route: "/EDTrackingBoard",
    icon: "📋",
    abbr: "TRACK",
    title: "ED Tracking Board",
    subtitle: "Patient Flow · Status Board · Acuity Tracking · Department Overview",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.4)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    accent: "#33eccc",
    category: "Tools",
    stats: ["Patient Flow", "Status Board", "Acuity Track"],
    badge: "Live",
    priority: 51,
    essential: false,
  },
  {
    id: "order-generator",
    route: "/order-generator",
    icon: "📋",
    abbr: "ORDERS",
    title: "Order Generator",
    subtitle: "Weight-based dosing · Copy-paste order text · Bundles · CPOE bridge",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.4)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    accent: "#6ab8ff",
    category: "Pharmacology",
    stats: ["30+ Drugs", "Weight-Based", "Bundle Launch"],
    badge: "CPOE BRIDGE",
    priority: 41.5,
  },
  {
    id: "narrative",
    route: "/narrative-engine",
    icon: "✍️",
    abbr: "NARRATIVE",
    title: "Clinical Narrative",
    subtitle: "AI Note Generation · HPI Builder · Clinical Narrative Engine",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.4)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    accent: "#b99bff",
    category: "Tools",
    stats: ["AI Notes", "HPI Builder", "Narrative Engine"],
    badge: "AI-Powered",
    priority: 52,
    essential: false,
  },
  {
    id: "ed-procedure-notes",
    route: "/ed-procedure-notes",
    icon: "📝",
    abbr: "PROC NOTES",
    title: "ED Procedure Notes",
    subtitle: "Procedure Documentation · Templates · Consent · Complication Tracking",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.4)",
    glass: "rgba(0,212,255,0.07)",
    border: "rgba(0,212,255,0.28)",
    accent: "#33deff",
    category: "Procedures",
    stats: ["Note Templates", "Consent Forms", "Documentation"],
    badge: "Live",
    priority: 53,
    essential: false,
  },
];
const ESSENTIAL_IDS = new Set(HUBS.filter(h => h.essential).map(h => h.id));

const CATEGORIES = ["All", "Essential", "Critical Care", "Chief Complaint", "Specialty", "Procedures", "Diagnostics", "Pharmacology", "Tools"];

// Routes that are actually implemented in App.jsx
// REMOVED: "/ecg-hub" and "/ChestPainHub" — both now live inside /cardiac-hub
const LIVE_ROUTES = new Set([
  "/cardiac-hub", "/trauma-hub", "/ob-hub", "/sepsis-hub",
  "/airway-hub", "/tox-hub", "/StrokeAssessment", "/Calculators",
  "/peds-hub", "/Procedures", "/erx", "/AutoCoder", "/NewPatientInput",
  "/KnowledgeBaseV2", "/Calendar", "/LabsImaging", "/triage-hub", "/rapid-assessment-hub",
  "/psyche-hub", "/surgical-airway-hub", "/shock-hub", "/pocus-hub",
  "/ortho-hub", "/resus-hub", "/antidote-hub", "/radiology-hub", "/Results",
  "/consult-hub", "/procedure-hub", "/id-hub", "/discharge-hub", "/wound-hub",
  "/DispositionBoard", "/critical-inbox", "/command-center",
  "/DyspneaHub", "/HeadacheHub", "/AbdominalPainHub",
  "/ams-hub", "/syncope-hub", "/dvt-hub", "/score-hub", "/pain-hub",
  "/weight-dose", "/SepsisHub", "/LabInterpreter", "/imaging-interpreter",
  "/wound-care-hub", "/seizure-hub", "/smart-dosing",
  "/stroke-hub", "/ddx-engine", "/EDTrackingBoard", "/narrative-engine", "/ed-procedure-notes",
  "/order-generator", "/QuickNote",
]);

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {[
        { x: "8%",  y: "15%", r: 320, c: "rgba(255,107,107,0.055)" },
        { x: "88%", y: "10%", r: 260, c: "rgba(155,109,255,0.055)" },
        { x: "80%", y: "80%", r: 340, c: "rgba(0,229,192,0.05)"    },
        { x: "15%", y: "82%", r: 220, c: "rgba(245,200,66,0.045)"  },
        { x: "50%", y: "48%", r: 400, c: "rgba(59,158,255,0.035)"  },
        { x: "35%", y: "28%", r: 180, c: "rgba(255,107,157,0.04)"  },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", left: o.x, top: o.y,
          width: o.r * 2, height: o.r * 2, borderRadius: "50%",
          background: `radial-gradient(circle, ${o.c} 0%, transparent 68%)`,
          transform: "translate(-50%,-50%)",
          animation: `hov-orb-${i % 3} ${8 + i * 1.3}s ease-in-out infinite`,
        }} />
      ))}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
        <defs>
          <pattern id="smg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="#3b9eff" strokeWidth="0.5" />
          </pattern>
          <pattern id="lgg" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M200 0L0 0 0 200" fill="none" stroke="#3b9eff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#smg)" />
        <rect width="100%" height="100%" fill="url(#lgg)" />
      </svg>
      <style>{`
        @keyframes hov-orb-0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.14)}}
        @keyframes hov-orb-1{0%,100%{transform:translate(-50%,-50%) scale(1.08)}50%{transform:translate(-50%,-50%) scale(0.9)}}
        @keyframes hov-orb-2{0%,100%{transform:translate(-50%,-50%) scale(0.94)}50%{transform:translate(-50%,-50%) scale(1.1)}}
      `}</style>
    </div>
  );
}

function HubCard({ hub, onNavigate, index, size = "normal", isEssential = false, onToggleEssential }) {
  const [hov, setHov] = useState(false);
  const isLarge = size === "large";
  const isLive = LIVE_ROUTES.has(hub.route);

  return (
    <div
      onClick={() => isLive && onNavigate(hub.route)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        borderRadius: 20,
        padding: isLarge ? "26px 24px 22px" : "20px 20px 16px",
        cursor: isLive ? "pointer" : "default",
        opacity: isLive ? 1 : 0.55,
        overflow: "hidden",
        transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hov ? "translateY(-7px) scale(1.025)" : "translateY(0) scale(1)",
        animation: `hub-appear 0.55s ease both ${index * 0.055}s`,
        background: hov
          ? `linear-gradient(135deg, ${hub.glass.replace("0.07","0.24")}, ${hub.glass})`
          : "rgba(8,22,40,0.68)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1px solid ${hov ? hub.border : "rgba(26,53,85,0.75)"}`,
        boxShadow: hov
          ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${hub.border}, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px ${hub.glow.replace("0.4","0.18")}`
          : "0 4px 18px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.025)",
      }}
    >
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${hub.glow.replace("0.4","0.22")} 0%, transparent 70%)`, opacity: hov ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "linear-gradient(108deg, transparent 38%, rgba(255,255,255,0.045) 50%, transparent 62%)", opacity: hov ? 1 : 0, transition: "opacity 0.4s", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "20px 20px 0 0", background: `linear-gradient(90deg, ${hub.color}, transparent)`, opacity: hov ? 1 : 0.3, transition: "opacity 0.3s" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isLarge ? 14 : 12 }}>
        <div style={{ width: isLarge ? 56 : 48, height: isLarge ? 56 : 48, borderRadius: isLarge ? 16 : 13, flexShrink: 0, background: `linear-gradient(135deg, ${hub.glass.replace("0.07","0.3")}, ${hub.glass})`, border: `1px solid ${hub.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isLarge ? 26 : 22, boxShadow: hov ? `0 0 22px ${hub.glow.replace("0.4","0.3")}` : "none", transition: "box-shadow 0.3s" }}>
          {hub.icon}
        </div>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: hub.glass.replace("0.07","0.2"), border: `1px solid ${hub.border}`, color: isLive ? hub.color : "#8aaccc", letterSpacing: ".05em", backdropFilter: "blur(6px)", whiteSpace: "nowrap" }}>
          {isLive ? hub.badge : "Coming Soon"}
        </span>
      </div>

      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: hub.accent, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 3, opacity: 0.85 }}>{hub.abbr}</div>
      <div style={{ fontSize: isLarge ? 16 : 14, fontFamily: "'Playfair Display',serif", fontWeight: 600, color: "#ffffff", lineHeight: 1.25, marginBottom: 4 }}>{hub.title}</div>
      <div style={{ fontSize: 11, color: "#d0e8ff", lineHeight: 1.4, marginBottom: isLarge ? 14 : 12 }}>{hub.subtitle}</div>

      <div style={{ height: 1, background: `linear-gradient(90deg, ${hub.border}, transparent)`, marginBottom: isLarge ? 12 : 10 }} />

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {hub.stats.map((s, i) => (
          <span key={i} style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", padding: "2px 8px", borderRadius: 20, background: hub.glass, border: `1px solid ${hub.border.replace("0.28","0.16")}`, color: "#d0e8ff" }}>{s}</span>
        ))}
      </div>

      <div
        onClick={e => { e.stopPropagation(); onToggleEssential && onToggleEssential(hub.id); }}
        title={isEssential ? "Remove from Essential" : "Add to Essential"}
        style={{ position: "absolute", top: 12, left: 12, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", opacity: hov || isEssential ? 1 : 0, transition: "all 0.2s", background: isEssential ? "rgba(245,200,66,0.15)" : "rgba(14,37,68,0.6)", border: `1px solid ${isEssential ? "rgba(245,200,66,0.4)" : "rgba(42,79,122,0.4)"}`, color: isEssential ? "#f5c842" : "#8aaccc", zIndex: 2 }}
      >
        {isEssential ? "★" : "☆"}
      </div>

      <div style={{ position: "absolute", bottom: 16, right: 16, width: 28, height: 28, borderRadius: "50%", background: hub.glass.replace("0.07","0.18"), border: `1px solid ${hub.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: hub.color, opacity: hov ? 1 : 0, transform: hov ? "scale(1) translateX(0)" : "scale(0.6) translateX(-6px)", transition: "all 0.22s ease" }}>→</div>
    </div>
  );
}

function SearchBar({ value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔍</span>
      <input
        ref={ref}
        type="text"
        placeholder="Search hubs…"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(8,22,40,0.8)", border: "1px solid rgba(42,79,122,0.6)", borderRadius: 12, padding: "10px 46px 10px 42px", color: "#ffffff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = "rgba(0,229,192,0.5)"}
        onBlur={e => e.target.style.borderColor = "rgba(42,79,122,0.6)"}
      />
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#8aaccc", fontFamily: "'JetBrains Mono',monospace" }}>⌘K</span>
    </div>
  );
}

function RecentStrip({ recents, onNavigate }) {
  if (!recents.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#8aaccc", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>↩ Recently Used</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {recents.map(hub => (
          <button key={hub.id} onClick={() => onNavigate(hub.route)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 24, background: "rgba(8,22,40,0.75)", border: `1px solid ${hub.border}`, color: hub.accent, fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: "pointer", backdropFilter: "blur(12px)", transition: "all 0.2s", boxShadow: `0 0 12px ${hub.glow.replace("0.4","0.1")}` }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: 16 }}>{hub.icon}</span>
            {hub.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HubSelectorPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState(() => {
    try { return localStorage.getItem("notrya_hub_sort") || "priority"; } catch { return "priority"; }
  });
  const [userEssentials, setUserEssentials] = useState(new Set(HUBS.filter(h => h.essential).map(h => h.id)));

  useEffect(() => {
    try { localStorage.setItem("notrya_hub_sort", sortBy); } catch {}
  }, [sortBy]);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.hub_essentials?.length) {
        setUserEssentials(new Set(user.hub_essentials));
      }
    }).catch(() => {});
  }, []);
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notrya_recent_hubs") || "[]").slice(0, 4).map(id => HUBS.find(h => h.id === id)).filter(Boolean); }
    catch { return []; }
  });

  const handleNavigate = (route) => {
    if (!LIVE_ROUTES.has(route)) return;
    const hub = HUBS.find(h => h.route === route);
    if (hub) {
      const updated = [hub.id, ...recents.map(r => r.id).filter(id => id !== hub.id)].slice(0, 4);
      try { localStorage.setItem("notrya_recent_hubs", JSON.stringify(updated)); } catch {}
      setRecents(updated.map(id => HUBS.find(h => h.id === id)).filter(Boolean));
    }
    navigate(route);
  };

  const toggleEssential = (id) => {
    setUserEssentials(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      base44.auth.updateMe({ hub_essentials: [...next] }).catch(() => {});
      return next;
    });
  };

  const essentials = HUBS.filter(h => userEssentials.has(h.id)).sort((a, b) => a.priority - b.priority);

  const filteredBase = HUBS
    .filter(h => {
      if (activeCategory === "Essential") return userEssentials.has(h.id);
      return activeCategory === "All" || h.category === activeCategory;
    })
    .filter(h =>
      !search ||
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      h.abbr.toLowerCase().includes(search.toLowerCase()) ||
      h.stats.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

  const filtered = [...filteredBase].sort((a, b) => {
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      if (sortBy === "category") return a.category.localeCompare(b.category) || a.priority - b.priority;
      if (sortBy === "live") {
        const aLive = LIVE_ROUTES.has(a.route) ? 0 : 1;
        const bLive = LIVE_ROUTES.has(b.route) ? 0 : 1;
        return aLive - bLive || a.priority - b.priority;
      }
      return a.priority - b.priority;
    });

  const featuredBase = filteredBase.sort((a, b) => a.priority - b.priority).slice(0, 3);
  const featuredIds = new Set(featuredBase.map(h => h.id));
  const featured = featuredBase;
  const rest = filtered.filter(h => !featuredIds.has(h.id));

  const sidebarItems = [
    { icon: "🏠", label: "Home", to: "/" },
    { icon: "📊", label: "Dash", to: "/Dashboard" },
    { icon: "👥", label: "Patients", to: "/PatientDashboard" },
    { icon: "🔄", label: "Shift", to: "/Shift" },
    { icon: "💊", label: "Drugs", to: "/DrugsBugs" },
    { icon: "🧮", label: "Calc", to: "/Calculators" },
    { icon: "🏥", label: "Hub", to: "/hub" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050f1e", fontFamily: "'DM Sans',sans-serif", position: "relative", display: "flex" }}>
      <div style={{ width: 80, flexShrink: 0, background: "#040d19", borderRight: "1px solid rgba(26,53,85,0.6)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 2 }}>
        {sidebarItems.map(item => {
          const isActive = window.location.pathname === item.to;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              style={{
                width: 56, height: 56, borderRadius: 12,
                border: isActive ? "1px solid rgba(0,229,192,0.4)" : "1px solid transparent",
                background: isActive ? "rgba(0,229,192,0.1)" : "transparent",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4, cursor: "pointer",
                transition: "all 0.2s ease",
                color: isActive ? "#00e5c0" : "#d0e8ff",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(14,37,68,0.5)"; e.currentTarget.style.borderColor = "rgba(26,53,85,0.8)"; e.currentTarget.style.color = "#ffffff"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#d0e8ff"; } }}
              title={item.label}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".05em", color: "inherit" }}>{item.label}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate("/AppSettings")}
          style={{ width: 56, height: 56, borderRadius: 12, border: "1px solid transparent", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", transition: "all 0.2s ease", color: "#8aaccc" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,37,68,0.5)"; e.currentTarget.style.borderColor = "rgba(26,53,85,0.8)"; e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#d0e8ff"; }}
          title="Settings"
        >
          <span style={{ fontSize: 24 }}>⚙️</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".05em" }}>Settings</span>
        </button>
      </div>

      <Background />

      <div style={{ position: "relative", zIndex: 1, padding: "32px 36px 48px", flex: 1 }}>

        <div style={{ borderRadius: 22, padding: "28px 32px 24px", background: "rgba(5,15,30,0.82)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(42,79,122,0.5)", marginBottom: 24, position: "relative", overflow: "hidden", animation: "hub-appear 0.5s ease both", boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg,#ff6b6b,#ff9f43,#f5c842,#00e5c0,#3b9eff,#9b6dff,#ff6b9d)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg, rgba(0,229,192,0.04) 0%, transparent 55%, rgba(155,109,255,0.04) 100%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, flexShrink: 0, background: "linear-gradient(135deg, rgba(0,229,192,0.18), rgba(59,158,255,0.12))", border: "1px solid rgba(0,229,192,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", boxShadow: "0 0 24px rgba(0,229,192,0.2)", animation: "hb 2.2s ease-in-out infinite" }}>
              ⚕
              <span style={{ position: "absolute", inset: -5, borderRadius: 22, border: "1.5px solid rgba(0,229,192,0.15)", animation: "pr 2.2s ease-in-out infinite" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#e8f0fe", letterSpacing: "-0.01em", lineHeight: 1 }}>Notrya Clinical Suite</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(0,229,192,0.1)", color: "#00e5c0", border: "1px solid rgba(0,229,192,0.3)", letterSpacing: ".06em" }}>{HUBS.length} HUBS</span>
              </div>
              <p style={{ fontSize: 13, color: "#c8d8ee", margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
                Your clinical intelligence platform. Select a hub to access evidence-based protocols, decision tools, and AI-assisted documentation.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {[{v:"2025",l:"Guidelines"},{v:"AI",l:"Powered"},{v:"ER",l:"Optimised"},{v:"24/7",l:"Available"}].map((s,i)=>(
                <div key={i} style={{ textAlign: "center", background: "rgba(14,37,68,0.6)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(26,53,85,0.8)" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ["#00e5c0","#3b9eff","#f5c842","#ff6b6b"][i], fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: "#8aaccc", marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap", animation: "hub-appear 0.5s ease both 0.1s" }}>
          <SearchBar value={search} onChange={setSearch} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: "8px 16px", borderRadius: 24, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all 0.2s", background: activeCategory === cat ? "rgba(0,229,192,0.15)" : "rgba(8,22,40,0.75)", border: `1px solid ${activeCategory === cat ? "rgba(0,229,192,0.45)" : "rgba(42,79,122,0.5)"}`, color: activeCategory === cat ? "#00e5c0" : "#c8d8ee", backdropFilter: "blur(12px)", boxShadow: activeCategory === cat ? "0 0 12px rgba(0,229,192,0.15)" : "none" }}>
                {cat}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#8aaccc", fontFamily: "'JetBrains Mono',monospace", marginLeft: "auto", whiteSpace: "nowrap" }}>
            {filtered.length} hub{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ animation: "hub-appear 0.5s ease both 0.12s" }}>
          <RecentStrip recents={recents} onNavigate={handleNavigate} />
        </div>

        {!search && activeCategory === "All" && (
          <div style={{ marginBottom: 24, animation: "hub-appear 0.5s ease both 0.13s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, width: 24, background: "rgba(245,200,66,0.5)", borderRadius: 1 }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#f5c842", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>⭐ Essential</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(245,200,66,0.2), transparent)" }} />
              <span style={{ fontSize: 10, color: "#8aaccc", fontFamily: "'JetBrains Mono',monospace" }}>{essentials.length} hubs</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {essentials.map((hub, i) => <HubCard key={hub.id} hub={hub} onNavigate={handleNavigate} index={i} size="normal" isEssential={true} onToggleEssential={toggleEssential} />)}
            </div>
          </div>
        )}

        {!search && activeCategory === "All" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, animation: "hub-appear 0.5s ease both 0.14s" }}>
              <div style={{ height: 1, width: 24, background: "rgba(0,229,192,0.4)", borderRadius: 1 }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#00e5c0", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>Featured</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(0,229,192,0.2), transparent)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              {featured.map((hub, i) => <HubCard key={hub.id} hub={hub} onNavigate={handleNavigate} index={i} size="large" isEssential={userEssentials.has(hub.id)} onToggleEssential={toggleEssential} />)}
            </div>
            {rest.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ height: 1, width: 24, background: "rgba(42,79,122,0.6)", borderRadius: 1 }} />
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#8aaccc", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>All</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(42,79,122,0.4), transparent)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, color: "#8aaccc", fontFamily: "'JetBrains Mono',monospace" }}>Sort:</span>
                    {[{id:"priority",label:"Default"},{id:"alpha",label:"A-Z"},{id:"category",label:"Category"},{id:"live",label:"Live First"}].map(opt => (
                      <button key={opt.id} onClick={() => setSortBy(opt.id)}
                        style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all 0.2s", background: sortBy === opt.id ? "rgba(155,109,255,0.15)" : "rgba(8,22,40,0.75)", border: `1px solid ${sortBy === opt.id ? "rgba(155,109,255,0.45)" : "rgba(42,79,122,0.5)"}`, color: sortBy === opt.id ? "#9b6dff" : "#c8d8ee", backdropFilter: "blur(12px)" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {rest.map((hub, i) => <HubCard key={hub.id} hub={hub} onNavigate={handleNavigate} index={i + 3} size="normal" isEssential={userEssentials.has(hub.id)} onToggleEssential={toggleEssential} />)}
                </div>
              </>
            )}
          </>
        )}

        {(search || activeCategory !== "All") && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, width: 24, background: "rgba(42,79,122,0.6)", borderRadius: 1 }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#8aaccc", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>
                {search ? `Results for "${search}"` : activeCategory}
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(42,79,122,0.4), transparent)" }} />
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8aaccc" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontFamily: "'Playfair Display',serif", color: "#ffffff" }}>No hubs found</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Try a different search or category</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {filtered.map((hub, i) => <HubCard key={hub.id} hub={hub} onNavigate={handleNavigate} index={i} size="normal" isEssential={userEssentials.has(hub.id)} onToggleEssential={toggleEssential} />)}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 32, textAlign: "center", animation: "hub-appear 0.55s ease both 0.5s" }}>
          <span style={{ fontSize: 10, color: "#8aaccc", fontFamily: "'JetBrains Mono',monospace" }}>
            Press <kbd style={{ background: "rgba(42,79,122,0.3)", border: "1px solid rgba(42,79,122,0.5)", borderRadius: 4, padding: "1px 6px", color: "#c8d8ee" }}>⌘K</kbd> to focus search · Click any card to open the hub
          </span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes hub-appear { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes hb  { 0%,100%{transform:scale(1)} 40%{transform:scale(1.12)} 70%{transform:scale(1)} }
        @keyframes pr  { 0%{opacity:.55;transform:scale(1)} 100%{opacity:0;transform:scale(1.55)} }
        * { box-sizing: border-box; }
        input::placeholder { color: #2e4a6a; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a4f7a; }
      `}</style>
    </div>
  );
}