import { createContext, useContext, useState, useCallback } from "react";

// ─── PATIENT DATA CONTEXT ─────────────────────────
const PatientDataContext = createContext();

// ─── PROVIDER COMPONENT ───────────────────────────
export function PatientDataProvider({ children }) {
  // Patient demographics
  const [patientData, setPatientData] = useState({
    // Demographics
    firstName: "",
    lastName: "",
    age: "",
    dob: "",
    sex: "",
    mrn: "",
    insurance: "",
    insuranceId: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    emerg: "",
    height: "",
    weight: "",
    lang: "",
    notes: "",
    pronouns: "",

    // Chief Complaint
    cc_text: "",
    cc_onset: "",
    cc_duration: "",
    cc_severity: "",
    cc_quality: "",
    cc_radiation: "",
    cc_aggravate: "",
    cc_relieve: "",
    cc_assoc: "",
    cc_hpi: "",

    // Vitals
    bp: "",
    hr: "",
    rr: "",
    spo2: "",
    temp: "",
    gcs: "",
    avpu: "",
    o2del: "",
    pain: "",
    triage: "",

    // Meds & PMH
    medications: [],
    allergies: [],
    pmhSelected: {},
    pmhExtra: "",
    surgHx: "",
    famHx: "",
    socHx: "",

    // ROS
    rosState: {},
    rosSymptoms: {},
    rosNotes: {},

    // Physical Exam
    peState: {},
    peFindings: {},

    // MDM
    mdm_assessment: "",
    mdm_plan: "",

    // Orders
    orders: [],

    // Discharge
    discharge_plan: "",
  });

  // Navigation dot progress
  const [navDots, setNavDots] = useState({
    chart: "done",
    demographics: "empty",
    cc: "empty",
    vitals: "empty",
    meds: "empty",
    ros: "empty",
    exam: "empty",
    mdm: "empty",
    orders: "empty",
    discharge: "empty",
    erplan: "empty",
  });

  // ─── UPDATE PATIENT DATA ───
  const updatePatientData = useCallback((updates) => {
    setPatientData((prev) => ({ ...prev, ...updates }));
  }, []);

  // ─── UPDATE SPECIFIC SECTION ───
  const updateSection = useCallback((section, data) => {
    setPatientData((prev) => {
      const sectionPrefix = `${section}_`;
      const updates = {};
      Object.keys(data).forEach((key) => {
        updates[`${sectionPrefix}${key}`] = data[key];
      });
      return { ...prev, ...updates };
    });
  }, []);

  // ─── UPDATE NAV DOT ───
  const updateNavDot = useCallback((section, status) => {
    setNavDots((prev) => ({ ...prev, [section]: status }));
  }, []);

  // ─── GET SECTION DATA ───
  const getSectionData = useCallback((section) => {
    const sectionPrefix = `${section}_`;
    const sectionData = {};
    Object.keys(patientData).forEach((key) => {
      if (key.startsWith(sectionPrefix)) {
        const dataKey = key.replace(sectionPrefix, "");
        sectionData[dataKey] = patientData[key];
      }
    });
    return sectionData;
  }, [patientData]);

  // ─── RESET ALL DATA ───
  const resetPatientData = useCallback(() => {
    setPatientData({
      firstName: "",
      lastName: "",
      age: "",
      dob: "",
      sex: "",
      mrn: "",
      insurance: "",
      insuranceId: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      emerg: "",
      height: "",
      weight: "",
      lang: "",
      notes: "",
      pronouns: "",
      cc_text: "",
      cc_onset: "",
      cc_duration: "",
      cc_severity: "",
      cc_quality: "",
      cc_radiation: "",
      cc_aggravate: "",
      cc_relieve: "",
      cc_assoc: "",
      cc_hpi: "",
      bp: "",
      hr: "",
      rr: "",
      spo2: "",
      temp: "",
      gcs: "",
      avpu: "",
      o2del: "",
      pain: "",
      triage: "",
      medications: [],
      allergies: [],
      pmhSelected: {},
      pmhExtra: "",
      surgHx: "",
      famHx: "",
      socHx: "",
      rosState: {},
      rosSymptoms: {},
      rosNotes: {},
      peState: {},
      peFindings: {},
      mdm_assessment: "",
      mdm_plan: "",
      orders: [],
      discharge_plan: "",
    });
    setNavDots({
      chart: "done",
      demographics: "empty",
      cc: "empty",
      vitals: "empty",
      meds: "empty",
      ros: "empty",
      exam: "empty",
      mdm: "empty",
      orders: "empty",
      discharge: "empty",
      erplan: "empty",
    });
  }, []);

  return (
    <PatientDataContext.Provider
      value={{
        patientData,
        updatePatientData,
        updateSection,
        getSectionData,
        navDots,
        updateNavDot,
        resetPatientData,
      }}
    >
      {children}
    </PatientDataContext.Provider>
  );
}

// ─── HOOK TO USE CONTEXT ──────────────────────────
export function usePatientData() {
  const context = useContext(PatientDataContext);
  if (!context) {
    throw new Error("usePatientData must be used within PatientDataProvider");
  }
  return context;
}