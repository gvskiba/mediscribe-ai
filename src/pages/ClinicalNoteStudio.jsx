import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  FileText, Activity, Beaker, Code, Brain, Pill, Plus, Settings,
  RotateCcw, ArrowLeft, Sparkles
} from "lucide-react";
import { useAutoSave } from "../components/utils/useAutoSave";

// NoteDetail tab components
import SubjectiveTab from "../components/notes/SubjectiveTab";
import PhysicalExamTab from "../components/notes/PhysicalExamTab";
import LabsImagingTab from "../components/notes/LabsImagingTab";
import DifferentialTab from "../components/notes/DifferentialTab";
import MedicalDecisionMakingTab from "../components/notes/MedicalDecisionMakingTab";
import TreatmentPlanTab from "../components/notes/TreatmentPlanTab";
import MedicationsTab from "../components/notes/MedicationsTab";
import ProceduresTabContent from "../components/procedures/ProceduresTabContent";
import ERDispositionTab from "../components/notes/ERDispositionTab";
import DischargeSummaryTabNew from "../components/notes/DischargeSummaryTab";
import ClinicalNoteComposer from "../components/notes/ClinicalNoteComposer";
import VitalSignsTab from "../components/notes/VitalSignsTab";
import NoteAbnormalFindingsAnalyzer from "../components/notes/NoteAbnormalFindingsAnalyzer";
import NoteTopBar from "../components/notes/NoteTopBar";
import NotePatientVitalsBar from "../components/notes/NotePatientVitalsBar";
import NoteSOAPNav from "../components/notes/NoteSOAPNav";
import BillingPanel from "../components/billing/BillingPanel";
import AISidebar from "../components/ai/AISidebar";
import AIStructuredNotePreview from "../components/notes/AIStructuredNotePreview";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import GuidelineReviewPrompt from "../components/notes/GuidelineReviewPrompt";
import TabDataPreview from "../components/notes/TabDataPreview";
import ClinicalNotePreviewButton from "../components/notes/ClinicalNotePreviewButton";

// Studio section components (inline below)

const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6", gold:"#f0c040",
};

const STUDIO_SECTIONS = [
  {id:"overview",icon:"🏥",name:"Overview",sub:"Patient summary",group:"ENCOUNTER"},
  {id:"cc_hpi",icon:"📝",name:"CC & HPI",sub:"Chief complaint",group:"SUBJECTIVE"},
  {id:"pmh",icon:"📋",name:"History",sub:"PMH / Social / Family",group:"SUBJECTIVE"},
  {id:"meds",icon:"💊",name:"Medications",sub:"Active meds + allergies",group:"SUBJECTIVE"},
  {id:"ros",icon:"🔍",name:"Review of Systems",sub:"Systems review",group:"SUBJECTIVE"},
  {id:"vitals",icon:"📊",name:"Vital Signs",sub:"Current hemodynamics",group:"OBJECTIVE"},
  {id:"pe",icon:"🩺",name:"Physical Exam",sub:"Head-to-toe",group:"OBJECTIVE"},
  {id:"labs",icon:"🧪",name:"Lab Results",sub:"CBC, BMP, ABG...",group:"OBJECTIVE"},
  {id:"imaging",icon:"🔬",name:"Imaging & Dx",sub:"CXR, ECG, UA...",group:"OBJECTIVE"},
  {id:"assessment",icon:"⚕️",name:"Assessment & Plan",sub:"Diagnosis + management",group:"ASSESSMENT"},
  {id:"disposition",icon:"🚑",name:"Disposition",sub:"Admit / discharge",group:"ASSESSMENT"},
];
const STUDIO_GROUPS = ["ENCOUNTER","SUBJECTIVE","OBJECTIVE","ASSESSMENT"];

const EMPTY_PT = {
  name:"", mrn:"", dob:"", age:"", sex:"Male", encounter:"", type:"ED Visit", provider:"",
  allergies:[], meds:[],
  vitals:{hr:"",sbp:"",dbp:"",temp:"",rr:"",spo2:"",gcs:"",wt:"",ht:"",bmi:""},
  labs:[], cc:"", hpi:"", pmh:[], psh:[], social:"", family:"",
  ros:{
    constitutional:{pos:[],neg:["Weight loss"]},
    cardiovascular:{pos:[],neg:["Chest pain","Palpitations","Edema"]},
    respiratory:{pos:[],neg:["Shortness of breath","Cough","Wheezing"]},
    gastrointestinal:{pos:[],neg:["Nausea","Vomiting","Abdominal pain","Diarrhea"]},
    genitourinary:{pos:[],neg:["Dysuria","Frequency","Decreased UO","Hematuria"]},
    neurological:{pos:[],neg:["Altered mentation","Focal weakness","Headache"]},
    musculoskeletal:{pos:[],neg:["Myalgias","Joint pain"]},
    integumentary:{pos:[],neg:["Rash"]},
  },
  pe:{
    general:{f:[],n:"",abn:false},
    heent:{f:[],n:"",abn:false},
    cardiovascular:{f:[],n:"",abn:false},
    pulmonary:{f:[],n:"",abn:false},
    abdomen:{f:[],n:"",abn:false},
    neurological:{f:[],n:"",abn:false},
    extremities:{f:[],n:"",abn:false},
    skin:{f:[],n:"",abn:false},
  },
  imaging:[], assessment:[], disposition:"", dc:"",
};

// ── Tab Groups for the Notes Detail view ──
const TAB_GROUPS = [
  { id:'patient', label:'Patient', color:'blue',
    tabs:[{id:'clinical_note',label:'Clinical Note',icon:FileText},{id:'patient_intake',label:'Subjective',icon:Activity}]},
  { id:'examination', label:'Objective', color:'emerald',
    tabs:[{id:'physical_exam',label:'Physical Exam',icon:Activity},{id:'labs_imaging',label:'Labs & Imaging',icon:Beaker}]},
  { id:'assessment', label:'Assessment', color:'rose',
    tabs:[{id:'differential',label:'Diagnoses',icon:Code},{id:'mdm',label:'MDM',icon:Brain}]},
  { id:'plan', label:'Plan', color:'amber',
    tabs:[{id:'treatment_plan',label:'Treatment Plan',icon:FileText},{id:'medications',label:'Medications',icon:Pill},{id:'procedures',label:'Procedures',icon:Activity}]},
  { id:'disposition', label:'Disposition', color:'purple',
    tabs:[{id:'disposition_plan',label:'Disposition',icon:FileText},{id:'discharge_summary',label:'Discharge Summary',icon:FileText}]},
];

export default function ClinicalNoteStudio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("noteId") || urlParams.get("id");

  // Mode: "studio" = structured input, "notes" = NoteDetail tab view
  // Default to studio; switch to notes only after note has loaded
  const [mode, setMode] = useState("studio");
  const [clock, setClock] = useState("");

  // Studio state
  const [cur, setCur] = useState("overview");
  const [analyses, setAnalyses] = useState({});
  const [done, setDone] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [rpContent, setRpContent] = useState("default");
  const [rpData, setRpData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [pt, setPt] = useState({...EMPTY_PT});
  const [dxList, setDxList] = useState([]);
  const [completion, setCompletion] = useState(45);
  const [savedNoteId, setSavedNoteId] = useState(noteId || null);
  const [saving, setSaving] = useState(false);

  // NoteDetail state
  const [activeTab, setActiveTab] = useState("patient_intake");
  const [tabGroups, setTabGroups] = useState(TAB_GROUPS);
  const [customizing, setCustomizing] = useState(false);
  const [showCreateTabDialog, setShowCreateTabDialog] = useState(false);
  const [selectedGroupForNewTab, setSelectedGroupForNewTab] = useState(null);
  const [newTabName, setNewTabName] = useState("");
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("blue");
  const [physicalExamNormal, setPhysicalExamNormal] = useState(false);
  const [rosNormal, setRosNormal] = useState(false);
  const [autosaveEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const [vitalSignsAnalysis, setVitalSignsAnalysis] = useState(null);
  const [loadingVitalAnalysis, setLoadingVitalAnalysis] = useState(false);
  const [vitalSignsHistory, setVitalSignsHistory] = useState([]);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState(null);
  const [analyzingRawData, setAnalyzingRawData] = useState(false);
  const [structuredPreview, setStructuredPreview] = useState(null);
  const [showStructuredPreview, setShowStructuredPreview] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [showGuidelinePrompt, setShowGuidelinePrompt] = useState(false);
  const [loadingDifferential, setLoadingDifferential] = useState(false);
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  // Load the saved/existing note for NoteDetail view
  const { data: note, isLoading: noteLoading } = useQuery({
    queryKey: ["studioNote", savedNoteId],
    queryFn: async () => {
      const results = await base44.entities.ClinicalNote.filter({ id: savedNoteId });
      return results?.[0] || null;
    },
    enabled: !!savedNoteId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list(),
    enabled: mode === "notes",
  });

  const { data: customTabGroups = [] } = useQuery({
    queryKey: ["customTabGroups"],
    queryFn: async () => {
      const groups = await base44.entities.TabGroup.list();
      return groups.sort((a, b) => a.order - b.order);
    },
    enabled: mode === "notes",
  });

  // When URL has a noteId, switch to notes mode once note is loaded
  useEffect(() => {
    if (noteId && note) setMode("notes");
  }, [noteId, note?.id]);

  // Hydrate studio form when existing note loads
  useEffect(() => {
    if (!note) return;
    const n = note;
    const vs = n.vital_signs || {};
    setPt({
      name: n.patient_name || "",
      mrn: n.patient_id || "",
      dob: n.date_of_birth || "",
      age: n.patient_age || "",
      sex: n.patient_gender === "female" ? "Female" : n.patient_gender === "other" ? "Other" : "Male",
      encounter: n.date_of_visit || "",
      type: n.note_type || "ED Visit",
      provider: "",
      allergies: n.allergies || [],
      meds: [],
      vitals: {
        hr: vs.heart_rate?.value || "",
        sbp: vs.blood_pressure?.systolic || "",
        dbp: vs.blood_pressure?.diastolic || "",
        temp: vs.temperature?.value || "",
        rr: vs.respiratory_rate?.value || "",
        spo2: vs.oxygen_saturation?.value || "",
        gcs: "",
        wt: vs.weight?.value || "",
        ht: vs.height?.value || "",
        bmi: "",
      },
      labs: (n.lab_findings || []).map(l => ({n:l.test_name,v:l.result,ref:l.reference_range,u:l.unit,f:l.status==="abnormal"?"H":"N"})),
      cc: n.chief_complaint || "",
      hpi: n.history_of_present_illness || "",
      pmh: n.medical_history ? n.medical_history.split(", ").filter(Boolean) : [],
      psh: [], social: "", family: "",
      ros: EMPTY_PT.ros,
      pe: EMPTY_PT.pe,
      imaging: (n.imaging_findings || []).map(i => ({type:i.study_type,title:i.location||"",date:"Today",f:i.findings||"",imp:i.impression||"",abn:false})),
      assessment: [], disposition: "", dc: n.disposition_plan || "",
    });
    setDxList((n.diagnoses || []).map(d => ({dx:d,plan:""})));
    setSavedNoteId(n.id);
  }, [note?.id]);

  // Merge custom tab groups
  useEffect(() => {
    if (!customTabGroups?.length) return;
    const persistedMap = {};
    customTabGroups.forEach(g => { persistedMap[g.group_id] = g; });
    const defaultGroupsMerged = TAB_GROUPS.map(g => {
      const persisted = persistedMap[g.id];
      if (persisted) {
        const tabById = Object.fromEntries(g.tabs.map(t => [t.id, t]));
        const reorderedTabs = persisted.tabs.map(t => ({...tabById[t.id],...t,icon:tabById[t.id]?.icon||Plus,label:tabById[t.id]?.label||t.label}));
        const persistedIds = new Set(persisted.tabs.map(t => t.id));
        const extraTabs = g.tabs.filter(t => !persistedIds.has(t.id));
        return {...g, tabs:[...reorderedTabs,...extraTabs]};
      }
      return g;
    });
    const defaultIds = new Set(TAB_GROUPS.map(g => g.id));
    const customOnlyGroups = customTabGroups
      .filter(g => !defaultIds.has(g.group_id))
      .map(g => ({id:g.group_id,label:g.label,color:g.color,tabs:g.tabs.map(t=>({...t,icon:Plus}))}));
    const merged = [...defaultGroupsMerged, ...customOnlyGroups];
    setTabGroups(prev => {
      const prevStr = JSON.stringify(prev.map(g=>({id:g.id,tabs:g.tabs.map(t=>t.id)})));
      const nextStr = JSON.stringify(merged.map(g=>({id:g.id,tabs:g.tabs.map(t=>t.id)})));
      return prevStr === nextStr ? prev : merged;
    });
  }, [customTabGroups]);

  useEffect(() => {
    if (noteId) localStorage.setItem('currentOpenNote', noteId);
  }, [noteId]);

  useEffect(() => {
    const handler = () => setAiSidebarOpen(true);
    window.addEventListener('openAISidebar', handler);
    return () => window.removeEventListener('openAISidebar', handler);
  }, []);

  useEffect(() => {
    if (note) {
      setPhysicalExamNormal(note.physical_exam === "No abnormalities noted. All systems within normal limits on examination.");
      setRosNormal(note.review_of_systems?.includes("REVIEW OF SYSTEMS:") && note.review_of_systems?.includes("Denies fever, chills, weight loss"));
    }
  }, [note?.id]);

  useEffect(() => {
    const iv = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Auto-save is handled by individual tab components; this is just a status indicator
  const isSaving = false;

  const finalizeMutation = useMutation({
    mutationFn: async () => { await base44.entities.ClinicalNote.update(savedNoteId, {status:"finalized"}); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey:["studioNote",savedNoteId]});
      await new Promise(r => setTimeout(r, 500));
    },
    onError: () => toast.error("Failed to finalize note"),
  });

  const exportNote = async (fmt) => {
    setExportingFormat(fmt);
    try {
      const response = await base44.functions.invoke('exportClinicalNote', {noteId:savedNoteId,format:fmt});
      const blob = new Blob([response.data], {type:fmt==='pdf'?'application/pdf':'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${note.patient_name}_${note.date_of_visit||'Note'}.${fmt==='pdf'?'pdf':'txt'}`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    } catch (e) { alert(`Failed to export note as ${fmt}`); }
    finally { setExportingFormat(null); }
  };

  // Tab navigation helpers
  const allTabIds = tabGroups.flatMap(g => g.tabs.map(t => t.id));
  const handleNext = () => { const i = allTabIds.indexOf(activeTab); if (i < allTabIds.length-1) setActiveTab(allTabIds[i+1]); };
  const handleBack = () => { const i = allTabIds.indexOf(activeTab); if (i > 0) setActiveTab(allTabIds[i-1]); };
  const isFirstTab = () => allTabIds.indexOf(activeTab) === 0;
  const isLastTab = () => allTabIds.indexOf(activeTab) === allTabIds.length-1;

  // Tab management
  const handleCreateTab = (groupId) => { setSelectedGroupForNewTab(groupId); setNewTabName(""); setShowCreateTabDialog(true); };
  const handleSaveNewTab = async () => {
    if (!newTabName.trim()) { toast.error("Tab name required"); return; }
    const tabId = `custom_${selectedGroupForNewTab}_${Date.now()}`;
    const dbGroups = await base44.entities.TabGroup.filter({group_id:selectedGroupForNewTab});
    if (dbGroups.length > 0) {
      await base44.entities.TabGroup.update(dbGroups[0].id, {tabs:[...dbGroups[0].tabs,{id:tabId,label:newTabName}]});
      queryClient.invalidateQueries({queryKey:["customTabGroups"]});
    }
    setShowCreateTabDialog(false); setNewTabName(""); toast.success("Tab created");
  };
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.error("Group name required"); return; }
    const groupId = `custom_group_${Date.now()}`;
    await base44.entities.TabGroup.create({group_id:groupId,label:newGroupName,color:newGroupColor,tabs:[],order:tabGroups.length});
    queryClient.invalidateQueries({queryKey:["customTabGroups"]});
    setShowCreateGroupDialog(false); setNewGroupName(""); setNewGroupColor("blue"); toast.success("Group created");
  };
  const resetTabLayout = async () => {
    const all = await base44.entities.TabGroup.list();
    await Promise.all(all.map(g => base44.entities.TabGroup.delete(g.id)));
    queryClient.invalidateQueries({queryKey:["customTabGroups"]});
    setTabGroups(TAB_GROUPS); toast.success("Tab layout reset");
  };

  // Studio helpers
  const showToast = (msg, type="i") => {
    const id = Date.now();
    setToasts(t => [...t,{id,msg,type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 3000);
  };
  const updatePt = (path, val) => {
    setPt(prev => {
      const next = {...prev};
      const keys = path.split(".");
      let obj = next;
      for (let i=0;i<keys.length-1;i++) { obj[keys[i]]={...obj[keys[i]]}; obj=obj[keys[i]]; }
      obj[keys[keys.length-1]] = val;
      return next;
    });
  };
  const addDx = () => setDxList(prev => [...prev,{dx:"",plan:""}]);
  const removeDx = (i) => setDxList(prev => prev.filter((_,idx)=>idx!==i));
  const updateDx = (i,field,val) => setDxList(prev => prev.map((d,idx)=>idx===i?{...d,[field]:val}:d));

  const buildNotePayload = (status="draft") => ({
    patient_name:pt.name, patient_id:pt.mrn, patient_age:pt.age,
    patient_gender:pt.sex?.toLowerCase()||"male", date_of_birth:pt.dob,
    date_of_visit:pt.encounter||new Date().toISOString().split("T")[0],
    note_type:"progress_note", chief_complaint:pt.cc, history_of_present_illness:pt.hpi,
    medical_history:pt.pmh.join(", "), allergies:pt.allergies.filter(Boolean),
    diagnoses:dxList.map(d=>d.dx).filter(Boolean), disposition_plan:pt.dc,
    vital_signs:{
      heart_rate:pt.vitals.hr?{value:+pt.vitals.hr,unit:"bpm"}:undefined,
      blood_pressure:pt.vitals.sbp?{systolic:+pt.vitals.sbp,diastolic:+pt.vitals.dbp,unit:"mmHg"}:undefined,
      temperature:pt.vitals.temp?{value:+pt.vitals.temp,unit:"F"}:undefined,
      respiratory_rate:pt.vitals.rr?{value:+pt.vitals.rr,unit:"breaths/min"}:undefined,
      oxygen_saturation:pt.vitals.spo2?{value:+pt.vitals.spo2,unit:"%"}:undefined,
      weight:pt.vitals.wt?{value:+pt.vitals.wt,unit:"lbs"}:undefined,
      height:pt.vitals.ht?{value:+pt.vitals.ht,unit:"in"}:undefined,
    },
    lab_findings:pt.labs.filter(l=>l.n).map(l=>({test_name:l.n,result:l.v,reference_range:l.ref,unit:l.u,status:l.f==="H"||l.f==="L"?"abnormal":"normal"})),
    imaging_findings:pt.imaging.filter(i=>i.type).map(i=>({study_type:i.type,location:i.title,findings:i.f,impression:i.imp})),
    raw_note:`CC: ${pt.cc}\nHPI: ${pt.hpi}\nAssessment: ${dxList.map((d,i)=>`${i+1}. ${d.dx}: ${d.plan}`).join('; ')}`,
    status,
  });

  const saveNote = async () => {
    if (!pt.name && !pt.cc) { showToast("Enter patient name or chief complaint first","e"); return; }
    setSaving(true);
    try {
      const payload = buildNotePayload("draft");
      let id = savedNoteId;
      if (id) { await base44.entities.ClinicalNote.update(id, payload); }
      else {
        const created = await base44.entities.ClinicalNote.create(payload);
        id = created.id; setSavedNoteId(id);
        window.history.replaceState({},'',"?noteId="+id);
      }
      showToast("Note saved","s");
      queryClient.invalidateQueries({queryKey:["studioNote",id]});
    } catch(err) { showToast("Save failed: "+err.message,"e"); }
    finally { setSaving(false); }
  };

  const signNote = async () => {
    if (!pt.name && !pt.cc) { showToast("Enter patient info before signing","e"); return; }
    setSaving(true);
    try {
      const payload = buildNotePayload("finalized");
      let id = savedNoteId;
      if (id) { await base44.entities.ClinicalNote.update(id, payload); }
      else {
        const created = await base44.entities.ClinicalNote.create(payload);
        id = created.id; setSavedNoteId(id);
        window.history.replaceState({},'',"?noteId="+id);
      }
      showToast("Note signed and finalized","s");
      queryClient.invalidateQueries({queryKey:["studioNote",id]});
    } catch(err) { showToast("Sign failed: "+err.message,"e"); }
    finally { setSaving(false); }
  };

  const secContent = (id) => {
    const v = pt.vitals;
    const map = {
      overview:`Patient: ${pt.name}, ${pt.age} ${pt.sex}. CC: ${pt.cc}`,
      cc_hpi:`CC: ${pt.cc}\nHPI: ${pt.hpi}`,
      pmh:`PMH: ${pt.pmh.join(', ')}\nPSH: ${pt.psh.join(', ')}\nSocial: ${pt.social}\nFamily: ${pt.family}\nAllergies: ${pt.allergies.join(', ')}`,
      meds:`Medications: ${pt.meds.map(m=>m.n+' '+m.d).join('; ')}\nAllergies: ${pt.allergies.join(', ')}`,
      ros:Object.entries(pt.ros).map(([sys,d])=>`${sys}: POS: ${d.pos.join(',')||'none'} | NEG: ${d.neg.join(',')}`).join('\n'),
      vitals:`HR:${v.hr} BP:${v.sbp}/${v.dbp} Temp:${v.temp} RR:${v.rr} SpO2:${v.spo2}% GCS:${v.gcs}`,
      pe:Object.entries(pt.pe).map(([s,d])=>`${s}: ${d.n}`).join('\n'),
      labs:pt.labs.map(l=>`${l.n}: ${l.v} ${l.u} (ref ${l.ref}) [${l.f}]`).join('\n'),
      imaging:pt.imaging.map(i=>`${i.type}: ${i.f} Impression: ${i.imp}`).join('\n'),
      assessment:dxList.map((d,i)=>`${i+1}. ${d.dx}: ${d.plan}`).join('\n'),
      disposition:`Dispo: ${pt.disposition}. ${pt.dc}`,
    };
    return map[id] || '';
  };

  const analyzeSection = async (id) => {
    if (analyzing) { showToast('Analysis in progress','i'); return; }
    setAnalyzing(true); setRpContent("loading");
    const sec = STUDIO_SECTIONS.find(s=>s.id===id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt:`You are Notrya AI, a clinical documentation assistant. Analyze this ${sec?.name||id} section of a clinical note and provide structured insights.\n\nSection content:\n${secContent(id)}\n\nReturn a JSON object with: {"summary":"2-3 sentence clinical summary","abnormals":[{"finding":"string","severity":"critical|high|moderate","detail":"string"}],"insights":["string"],"recommendation":"string","tags":[{"text":"string","color":"red|amber|green|blue"}]}`,
        response_json_schema:{type:"object",properties:{summary:{type:"string"},abnormals:{type:"array",items:{type:"object"}},insights:{type:"array",items:{type:"string"}},recommendation:{type:"string"},tags:{type:"array",items:{type:"object"}}}},
      });
      setAnalyses(prev=>({...prev,[id]:result})); setDone(prev=>({...prev,[id]:true}));
      setRpContent("analysis"); setRpData(result); setCompletion(c=>Math.min(100,c+8));
      showToast(`${sec?.name||id} analyzed`,'s');
    } catch(err) { showToast('Analysis failed: '+err.message,'e'); setRpContent("default"); }
    finally { setAnalyzing(false); }
  };

  const analyzeAll = async () => {
    showToast('Analyzing all sections...','i');
    for (const id of ['vitals','labs','pe','assessment','cc_hpi','imaging']) {
      await analyzeSection(id);
      await new Promise(r=>setTimeout(r,300));
    }
    showToast('Complete note analysis done','s');
  };

  const generateSummary = async () => {
    showToast('Generating clinical summary...','i'); setRpContent("loading");
    const allContent = `Patient: ${pt.name} ${pt.age} ${pt.sex}\nCC: ${pt.cc}\nVitals: HR ${pt.vitals.hr} BP ${pt.vitals.sbp}/${pt.vitals.dbp} Temp ${pt.vitals.temp} RR ${pt.vitals.rr} SpO2 ${pt.vitals.spo2}%\nLabs: ${pt.labs.map(l=>l.n+' '+l.v).join(', ')}\nImaging: ${pt.imaging.map(i=>i.type+': '+i.imp).join('; ')}\nDx: ${dxList.map((d,i)=>i+1+'. '+d.dx).join('; ')}\nDisposition: ${pt.disposition}`;
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt:`Generate a comprehensive clinical note summary for this patient encounter.\n\n${allContent}\n\nReturn JSON: {"summary":"3-4 sentence overview","criticals":[{"item":"string","flag":"critical|high|moderate"}],"keyDx":["string"],"actions":["string"],"mdm":"string"}`,
        response_json_schema:{type:"object",properties:{summary:{type:"string"},criticals:{type:"array",items:{type:"object"}},keyDx:{type:"array",items:{type:"string"}},actions:{type:"array",items:{type:"string"}},mdm:{type:"string"}}},
      });
      setRpContent("summary"); setRpData(result); showToast('Summary generated','s');
    } catch(err) { showToast('Error: '+err.message,'e'); setRpContent("default"); }
  };

  const switchSec = (id) => {
    setCur(id);
    if (analyses[id]) { setRpContent("analysis"); setRpData(analyses[id]); }
    else setRpContent("default");
  };

  const totalAbn = pt.labs.filter(l=>l.f!=='N').length + Object.values(pt.pe).filter(p=>p.abn).length + pt.imaging.filter(i=>i.abn).length;
  const curSec = STUDIO_SECTIONS.find(s=>s.id===cur);

  const inputS = {width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 9px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none"};
  const textareaS = {...inputS,resize:"vertical",minHeight:65,lineHeight:1.65,display:"block"};
  const labelS = {fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:C.dim,letterSpacing:".1em",display:"block",marginBottom:4};

  const renderStudioSection = () => {
    switch(cur) {
      case "overview": return <SectionOverview pt={pt} totalAbn={totalAbn} dxList={dxList} />;
      case "cc_hpi": return <SectionCCHPI pt={pt} updatePt={updatePt} inputS={inputS} textareaS={textareaS} labelS={labelS} />;
      case "pmh": return <SectionPMH pt={pt} updatePt={updatePt} inputS={inputS} textareaS={textareaS} labelS={labelS} />;
      case "meds": return <SectionMeds pt={pt} updatePt={updatePt} inputS={inputS} labelS={labelS} />;
      case "ros": return <SectionROS pt={pt} updatePt={updatePt} />;
      case "vitals": return <SectionVitals pt={pt} updatePt={updatePt} />;
      case "pe": return <SectionPE pt={pt} updatePt={updatePt} />;
      case "labs": return <SectionLabs pt={pt} updatePt={updatePt} />;
      case "imaging": return <SectionImaging pt={pt} updatePt={updatePt} />;
      case "assessment": return <SectionAssessment dxList={dxList} addDx={addDx} removeDx={removeDx} updateDx={updateDx} inputS={inputS} textareaS={textareaS} />;
      case "disposition": return <SectionDisposition pt={pt} updatePt={updatePt} inputS={inputS} textareaS={textareaS} labelS={labelS} />;
      default: return null;
    }
  };

  // ── Shared Navbar ──
  const renderNavbar = () => (
    <nav style={{height:52,background:"rgba(11,29,53,.97)",borderBottom:`1px solid ${C.border}`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,zIndex:100}}>
      <span onClick={()=>navigate(createPageUrl("Home"))} style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:C.bright,cursor:"pointer",letterSpacing:"-.02em"}}>Notrya</span>
      <div style={{width:1,height:16,background:C.border}} />
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.teal,letterSpacing:".12em"}}>CLINICAL NOTE STUDIO</span>

      {/* Mode toggle */}
      <div style={{display:"flex",alignItems:"center",gap:2,padding:"3px",borderRadius:10,background:C.edge,border:`1px solid ${C.border}`}}>
        <button onClick={()=>setMode("studio")} style={{padding:"4px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:mode==="studio"?C.teal:"transparent",color:mode==="studio"?C.navy:C.dim,transition:"all .15s"}}>✦ Studio</button>
        <button onClick={()=>setMode("notes")} disabled={!savedNoteId} style={{padding:"4px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:savedNoteId?"pointer":"not-allowed",border:"none",background:mode==="notes"?C.blue:"transparent",color:mode==="notes"?C.bright:C.dim,transition:"all .15s",opacity:savedNoteId?1:.4}}>📋 Note Detail</button>
      </div>

      <div style={{flex:1}} />

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:10,background:C.panel,border:`1px solid ${C.border}`}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:C.bright}}>{pt.name||note?.patient_name||"New Patient"}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.dim}}>{[pt.mrn||note?.patient_id,pt.age||note?.patient_age].filter(Boolean).join(' · ')||"Enter patient info"}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6}}>
        {mode==="studio" && <>
          <button onClick={saveNote} disabled={saving} style={{padding:"5px 13px",borderRadius:9,fontSize:12,fontWeight:600,cursor:saving?"not-allowed":"pointer",border:`1px solid ${C.border}`,background:C.edge,color:C.dim,opacity:saving?.5:1}}>{saving?"Saving...":"💾 Save"}</button>
          <button onClick={signNote} disabled={saving} style={{padding:"5px 13px",borderRadius:9,fontSize:12,fontWeight:700,cursor:saving?"not-allowed":"pointer",border:"none",background:`linear-gradient(135deg,${C.teal},#00b8a5)`,color:C.navy,opacity:saving?.5:1}}>✍️ Sign Note</button>
        </>}
        {mode==="notes" && savedNoteId && (
          <button onClick={()=>{setMode("studio");}} style={{padding:"5px 13px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${C.border}`,background:C.edge,color:C.dim}}>✦ Switch to Studio</button>
        )}
      </div>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.dim}}>{clock}</span>
    </nav>
  );

  // ── STUDIO MODE ──
  if (mode === "studio") {
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif",background:C.navy,height:"100vh",color:C.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
          @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(255,92,108,0)}60%{box-shadow:0 0 14px 0 rgba(255,92,108,.3)}}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
          textarea,input,select{transition:border-color .15s}
          textarea:focus,input:focus,select:focus{border-color:#4a7299 !important;outline:none}
          textarea::placeholder,input::placeholder{color:#2a4d72}
          select option{background:#0b1d35}
        `}</style>

        {renderNavbar()}

        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          {/* Sidebar */}
          <div style={{width:230,flexShrink:0,background:C.panel,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,letterSpacing:".1em",marginBottom:4}}>PATIENT · ENCOUNTER</div>
              <input value={pt.name} onChange={e=>updatePt("name",e.target.value)} placeholder="Patient Name" style={{width:"100%",background:C.edge,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",color:C.bright,fontSize:13,fontWeight:700,outline:"none",marginBottom:5,fontFamily:"'Playfair Display',serif"}} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}>
                <input value={pt.mrn} onChange={e=>updatePt("mrn",e.target.value)} placeholder="MRN" style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",color:C.dim,fontSize:11,outline:"none",fontFamily:"'JetBrains Mono',monospace"}} />
                <input value={pt.age} onChange={e=>updatePt("age",e.target.value)} placeholder="Age" style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",color:C.dim,fontSize:11,outline:"none",fontFamily:"'JetBrains Mono',monospace"}} />
              </div>
              {totalAbn>0 && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:7,background:"rgba(255,92,108,.1)",border:"1px solid rgba(255,92,108,.3)",color:C.red,display:"inline-block"}}>⚠ {totalAbn} Abnormal</div>}
            </div>
            <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,letterSpacing:".1em",display:"flex",justifyContent:"space-between",marginBottom:5}}><span>COMPLETION</span><span>{completion}%</span></div>
              <div style={{height:4,borderRadius:2,background:C.edge,overflow:"hidden"}}>
                <div style={{height:"100%",background:`linear-gradient(90deg,${C.teal},#00b8a5)`,borderRadius:2,width:`${completion}%`,transition:"width .5s"}} />
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
              {STUDIO_GROUPS.map(g => (
                <div key={g}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,letterSpacing:".12em",padding:"6px 8px 3px",textTransform:"uppercase"}}>{g}</div>
                  {STUDIO_SECTIONS.filter(s=>s.group===g).map(sec => {
                    const isDone = done[sec.id];
                    const isActive = cur===sec.id;
                    return (
                      <div key={sec.id} onClick={()=>switchSec(sec.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:10,cursor:"pointer",marginBottom:1,transition:"all .15s",background:isActive?"rgba(0,212,188,.08)":"transparent",border:`1px solid ${isActive?"rgba(0,212,188,.3)":"transparent"}`}}>
                        <div style={{fontSize:14,width:20,textAlign:"center",flexShrink:0}}>{sec.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,color:isActive?C.teal:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sec.name}</div>
                          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,marginTop:1}}>{sec.sub}</div>
                        </div>
                        {isDone && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(46,204,113,.1)",color:C.green,border:"1px solid rgba(46,204,113,.25)",padding:"0 4px"}}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:5}}>
              <button onClick={analyzeAll} style={{padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:500,cursor:"pointer",background:"rgba(0,212,188,.07)",border:"1px solid rgba(0,212,188,.28)",color:C.teal,display:"flex",alignItems:"center",gap:7}}>✦ Analyze Entire Note</button>
              <button onClick={generateSummary} style={{padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:500,cursor:"pointer",background:C.edge,border:`1px solid ${C.border}`,color:C.dim,display:"flex",alignItems:"center",gap:7}}>📋 Generate Summary</button>
              {savedNoteId && <button onClick={()=>setMode("notes")} style={{padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:500,cursor:"pointer",background:"rgba(74,144,217,.08)",border:"1px solid rgba(74,144,217,.28)",color:C.blue,display:"flex",alignItems:"center",gap:7}}>📋 Open Note Detail View</button>}
            </div>
          </div>

          {/* Center */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            <div style={{padding:"14px 20px 12px",background:C.slate,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0,background:"rgba(0,212,188,.1)",border:"1px solid rgba(0,212,188,.28)"}}>{curSec?.icon}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:700,color:C.bright,letterSpacing:"-.02em"}}>{curSec?.name}</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:1}}>{curSec?.sub}</div>
                </div>
                <div style={{flex:1}} />
                <button onClick={()=>analyzeSection(cur)} disabled={analyzing} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:10,cursor:analyzing?"not-allowed":"pointer",background:"rgba(155,109,255,.1)",border:"1px solid rgba(155,109,255,.3)",color:C.purple,fontSize:12,fontWeight:600,opacity:analyzing?.45:1}}>
                  {analyzing?<div style={{width:13,height:13,border:"2px solid rgba(155,109,255,.3)",borderTopColor:C.purple,borderRadius:"50%",animation:"spin .6s linear infinite"}} />:"✦"}
                  {analyzing?"Analyzing...":"Analyze Section"}
                </button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>{renderStudioSection()}</div>
          </div>

          {/* Right AI Panel */}
          <div style={{width:310,flexShrink:0,background:C.panel,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${C.border}`,flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.purple,animation:"pulse .8s infinite"}} />
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.purple,letterSpacing:".12em",flex:1}}>✦ AI ANALYSIS</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
              {rpContent==="loading" && <AILoadingState />}
              {rpContent==="analysis" && rpData && <AIAnalysisPanel data={rpData} />}
              {rpContent==="summary" && rpData && <AISummaryPanel data={rpData} />}
              {rpContent==="default" && <AIDefaultState />}
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div style={{position:"fixed",bottom:18,right:18,display:"flex",flexDirection:"column",gap:6,zIndex:9999}}>
          {toasts.map(t=>(
            <div key={t.id} style={{padding:"10px 14px",borderRadius:10,fontSize:12,animation:"fadeUp .2s ease",backdropFilter:"blur(8px)",background:t.type==='s'?"rgba(46,204,113,.11)":t.type==='e'?"rgba(255,92,108,.11)":"rgba(74,144,217,.11)",border:`1px solid ${t.type==='s'?"rgba(46,204,113,.38)":t.type==='e'?"rgba(255,92,108,.38)":"rgba(74,144,217,.38)"}`,color:t.type==='s'?C.green:t.type==='e'?C.red:C.blue}}>{t.msg}</div>
          ))}
        </div>
      </div>
    );
  }

  // ── NOTE DETAIL MODE ──
  if (noteLoading && savedNoteId) {
    return (
      <div style={{background:C.navy,minHeight:"100vh",padding:40}}>
        <Skeleton className="h-10 w-48 rounded-xl mb-4" />
        <Skeleton className="h-64 rounded-2xl mb-4" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!note && savedNoteId) {
    return (
      <div style={{background:C.navy,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300">Note not found</h2>
          <button onClick={()=>setMode("studio")} className="text-blue-400 hover:underline text-sm mt-2 block">← Back to Studio</button>
        </div>
      </div>
    );
  }

  if (!savedNoteId) {
    return (
      <div style={{background:C.navy,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div className="text-center">
          <p className="text-slate-400 mb-4">Save a note in Studio mode first to view Note Detail.</p>
          <button onClick={()=>setMode("studio")} style={{padding:"8px 20px",borderRadius:10,background:C.teal,color:C.navy,fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>Go to Studio</button>
        </div>
      </div>
    );
  }

  // Full NoteDetail view
  return (
    <>
      <div style={{background:C.navy,fontFamily:"DM Sans,sans-serif",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        {/* Mode toggle bar */}
        <div style={{background:"rgba(11,29,53,.97)",borderBottom:`1px solid ${C.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0,zIndex:100}}>
          <span onClick={()=>navigate(createPageUrl("Home"))} style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:C.bright,cursor:"pointer",letterSpacing:"-.02em"}}>Notrya</span>
          <div style={{width:1,height:14,background:C.border}} />
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:C.teal,letterSpacing:".12em"}}>CLINICAL NOTE STUDIO</span>
          <div style={{display:"flex",alignItems:"center",gap:2,padding:"2px",borderRadius:9,background:C.edge,border:`1px solid ${C.border}`}}>
            <button onClick={()=>setMode("studio")} style={{padding:"3px 11px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:mode==="studio"?C.teal:"transparent",color:mode==="studio"?C.navy:C.dim,transition:"all .15s"}}>✦ Studio</button>
            <button onClick={()=>setMode("notes")} style={{padding:"3px 11px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:mode==="notes"?C.blue:"transparent",color:mode==="notes"?C.bright:C.dim,transition:"all .15s"}}>📋 Note Detail</button>
          </div>
          <div style={{flex:1}} />
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.dim}}>{clock}</span>
        </div>

        {/* NoteTopBar */}
        <NoteTopBar note={note} noteId={savedNoteId} queryClient={queryClient} onNext={handleNext} autoSaveStatus={autoSaveStatus} />
        <NotePatientVitalsBar note={note} />
        <NoteSOAPNav activeTab={activeTab} onTabChange={setActiveTab} />

        {showGuidelinePrompt && note?.linked_guidelines && (
          <GuidelineReviewPrompt
            linkedGuidelines={note.linked_guidelines}
            onIncorporate={async (guideline) => {
              const updatedGuidelines = note.linked_guidelines.map(g =>
                g.guideline_query_id===guideline.guideline_query_id?{...g,incorporated:true,adherence_notes:"Incorporated into plan"}:g
              );
              await base44.entities.ClinicalNote.update(savedNoteId,{linked_guidelines:updatedGuidelines});
              queryClient.invalidateQueries({queryKey:["studioNote",savedNoteId]});
            }}
            onDismiss={()=>setShowGuidelinePrompt(false)}
          />
        )}

        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{flex:1,minHeight:0,display:"flex",flexDirection:"column"}}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col" style={{flex:1,minHeight:0}}>
            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 shadow-2xl z-50 flex flex-col" style={{background:"#0b1d35",borderTop:"1px solid #1e3a5f"}}>
              {/* Sub-tabs */}
              {(() => {
                const activeGroup = tabGroups.find(g=>g.tabs.some(t=>t.id===activeTab));
                const activeTabBg = {blue:'bg-blue-600 text-white',purple:'bg-purple-600 text-white',emerald:'bg-emerald-600 text-white',rose:'bg-rose-600 text-white',amber:'bg-amber-600 text-white'};
                if (!activeGroup) return null;
                return (
                  <TabsList className="flex flex-row items-center justify-center py-1.5 gap-1 w-full flex-shrink-0 h-auto rounded-none p-0" style={{background:"#0b1d35",borderBottom:"1px solid #1e3a5f"}}>
                    {activeGroup.tabs.map(tab => {
                      const isActive = activeTab===tab.id;
                      return (
                        <TabsTrigger key={tab.id} value={tab.id} className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-md border transition-all whitespace-nowrap ${isActive?`${activeTabBg[activeGroup.color]} border-transparent shadow-sm`:`border-transparent bg-transparent`}`} style={!isActive?{color:"#4a7299"}:{}}>
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                    {customizing && (
                      <button onClick={()=>handleCreateTab(activeGroup.id)} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 rounded-md hover:bg-white transition-colors whitespace-nowrap">
                        <Plus className="w-3 h-3" /><span>Add tab</span>
                      </button>
                    )}
                  </TabsList>
                );
              })()}

              {/* Group nav row */}
              <div className="flex items-center px-2 justify-center gap-4" style={{background:"#0b1d35"}}>
                <div className="flex items-center gap-1 flex-shrink-0 py-1" style={{zIndex:10,position:'relative'}}>
                  <button type="button" onMouseDown={e=>{e.preventDefault();e.stopPropagation();setCustomizing(c=>!c);}} className="p-1.5 rounded-md transition-colors cursor-pointer" style={customizing?{background:"rgba(0,212,188,0.15)",color:"#00d4bc"}:{color:"#4a7299"}}><Settings className="w-3.5 h-3.5" /></button>
                  {customizing && <button type="button" onMouseDown={e=>{e.preventDefault();e.stopPropagation();resetTabLayout();}} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex items-center overflow-x-auto scrollbar-hide">
                  {tabGroups.map(group => {
                    const accentDot={blue:'bg-blue-500',purple:'bg-purple-500',emerald:'bg-emerald-500',rose:'bg-rose-500',amber:'bg-amber-500'};
                    const activeBorder={blue:'border-blue-500',purple:'border-purple-500',emerald:'border-emerald-500',rose:'border-rose-500',amber:'border-amber-500'};
                    const activeText={blue:'text-blue-600',purple:'text-purple-600',emerald:'text-emerald-600',rose:'text-rose-600',amber:'text-amber-600'};
                    const hasActive=group.tabs.some(t=>t.id===activeTab);
                    const firstTabId=group.tabs[0]?.id;
                    return (
                      <button key={group.id} onClick={()=>firstTabId&&setActiveTab(firstTabId)} className={`flex flex-col items-center gap-0.5 px-4 py-2 border-t-2 transition-all whitespace-nowrap flex-shrink-0 ${hasActive?`${activeBorder[group.color]} ${activeText[group.color]}`:'border-transparent'}`} style={!hasActive?{color:"#4a7299"}:{}}>
                        <div className={`w-2 h-2 rounded-full ${accentDot[group.color]}`} />
                        <span className="text-xs font-semibold">{group.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dialogs */}
              {showCreateTabDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Tab</h3>
                    <Input autoFocus value={newTabName} onChange={e=>setNewTabName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSaveNewTab();if(e.key==='Escape')setShowCreateTabDialog(false);}} placeholder="Enter tab name..." className="w-full mb-4" />
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={()=>setShowCreateTabDialog(false)}>Cancel</Button>
                      <Button onClick={handleSaveNewTab} className="bg-blue-600 hover:bg-blue-700 text-white">Create Tab</Button>
                    </div>
                  </div>
                </div>
              )}
              {showCreateGroupDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Group</h3>
                    <Input autoFocus value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleCreateGroup();if(e.key==='Escape')setShowCreateGroupDialog(false);}} placeholder="Enter group name..." className="w-full mb-4" />
                    <div className="flex gap-2 mb-4">
                      {['blue','purple','emerald','rose','amber'].map(color=>(
                        <button key={color} onClick={()=>setNewGroupColor(color)} className={`w-8 h-8 rounded-full border-2 ${newGroupColor===color?'border-slate-900 scale-110':'border-transparent'} ${color==='blue'?'bg-blue-500':color==='purple'?'bg-purple-500':color==='emerald'?'bg-emerald-500':color==='rose'?'bg-rose-500':'bg-amber-500'}`} />
                      ))}
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={()=>{setShowCreateGroupDialog(false);setNewGroupName("");setNewGroupColor("blue");}}>Cancel</Button>
                      <Button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700 text-white">Create Group</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div style={{flex:1,minHeight:0,overflow:"auto",paddingBottom:"120px"}}>
              <TabsContent value="vital_signs" className="overflow-y-auto" style={{background:C.navy}}>
                <VitalSignsTab note={note} noteId={savedNoteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis} vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis} vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="patient_intake" className="overflow-y-auto" style={{background:C.navy}}>
                <SubjectiveTab note={note} noteId={savedNoteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} analyzingRawData={analyzingRawData} setAnalyzingRawData={setAnalyzingRawData} checkingGrammar={checkingGrammar} setCheckingGrammar={setCheckingGrammar} grammarSuggestions={grammarSuggestions} setGrammarSuggestions={setGrammarSuggestions} loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis} vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis} vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory} rosNormal={rosNormal} setRosNormal={setRosNormal} structuredPreview={structuredPreview} setStructuredPreview={setStructuredPreview} showStructuredPreview={showStructuredPreview} setShowStructuredPreview={setShowStructuredPreview} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="differential" className="overflow-y-auto" style={{background:C.navy}}>
                <DifferentialTab note={note} noteId={savedNoteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingDifferential={loadingDifferential} generateDifferentialDiagnosis={async()=>{}} differentialDiagnosis={differentialDiagnosis} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="labs_imaging" className="overflow-y-auto" style={{background:C.navy}}>
                <div style={{maxWidth:"900px",margin:"0 auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:"20px"}}>
                  <NoteAbnormalFindingsAnalyzer note={note} noteId={savedNoteId} queryClient={queryClient} />
                  <LabsImagingTab note={note} noteId={savedNoteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
                </div>
              </TabsContent>

              <TabsContent value="treatment_plan" className="overflow-y-auto" style={{background:C.navy}}>
                <TreatmentPlanTab note={note} noteId={savedNoteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="mdm" className="overflow-y-auto">
                <MedicalDecisionMakingTab note={note} noteId={savedNoteId} onUpdateNote={async(updates)=>{await base44.entities.ClinicalNote.update(savedNoteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",savedNoteId]});}} />
              </TabsContent>

              <TabsContent value="medications" className="overflow-y-auto" style={{background:C.navy}}>
                <MedicationsTab note={note} noteId={savedNoteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="clinical_note" className="overflow-y-auto" style={{background:C.navy}}>
                <ClinicalNoteComposer note={note} noteId={savedNoteId} queryClient={queryClient} />
                <div className="max-w-3xl mx-auto px-4 pb-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <BillingPanel note={note} noteId={savedNoteId} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="physical_exam" className="overflow-y-auto" style={{background:C.navy}}>
                <PhysicalExamTab note={note} noteId={savedNoteId} queryClient={queryClient} physicalExamNormal={physicalExamNormal} setPhysicalExamNormal={setPhysicalExamNormal} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="disposition_plan" className="overflow-y-auto" style={{background:C.navy}}>
                <ERDispositionTab note={note} noteId={savedNoteId} queryClient={queryClient} finalizeMutation={finalizeMutation} exportNote={exportNote} exportingFormat={exportingFormat} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="discharge_summary" className="overflow-y-auto" style={{background:C.navy}}>
                <DischargeSummaryTabNew note={note} noteId={savedNoteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </TabsContent>

              <TabsContent value="procedures" className="overflow-y-auto" style={{background:C.navy}}>
                <ProceduresTabContent note={note} />
              </TabsContent>

              {/* Custom tabs */}
              {tabGroups.flatMap(g=>g.tabs).filter(t=>t.id.startsWith('custom_')).map(tab=>(
                <TabsContent key={tab.id} value={tab.id} className="overflow-y-auto" style={{background:C.navy}}>
                  <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">{tab.label}</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Notes</span></div>
                      <div className="p-4"><textarea placeholder={`Add notes for ${tab.label}...`} className="w-full min-h-[300px] text-sm resize-none border-slate-200 border rounded-lg p-2" /></div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                      <div className="flex gap-2"><TabDataPreview tabId={tab.id} note={note} /><ClinicalNotePreviewButton note={note} /></div>
                      <div className="flex items-center gap-1.5">{!isFirstTab()&&<button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5"/>Back</button>}{!isLastTab()&&<button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180"/></button>}</div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </motion.div>

        {/* Floating AI Button */}
        <motion.button onClick={()=>setAiSidebarOpen(true)} whileHover={{scale:1.08}} whileTap={{scale:0.95}} className="fixed left-5 bottom-28 z-40 w-14 h-14 rounded-full flex items-center justify-center" style={{background:"white",boxShadow:"0 4px 24px 0 rgba(168,85,247,0.25),0 1.5px 6px 0 rgba(99,102,241,0.15)"}} title="Open AI Assistant">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background:"linear-gradient(135deg, #f0abfc 0%, #a78bfa 50%, #818cf8 100%)"}}>
            <Sparkles className="w-6 h-6 text-white drop-shadow" />
          </div>
        </motion.button>

        <AISidebar isOpen={aiSidebarOpen} onClose={()=>setAiSidebarOpen(false)} note={note} noteId={savedNoteId} activeTab={activeTab} onUpdateNote={async(updates)=>{await base44.entities.ClinicalNote.update(savedNoteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",savedNoteId]});}} />

        {showStructuredPreview && (
          <AIStructuredNotePreview structured={structuredPreview} activeTab={activeTab} onClose={()=>setShowStructuredPreview(false)}
            onApply={async()=>{
              if(!structuredPreview) return;
              const stripMd=t=>typeof t==='string'?t.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/^#{1,6}\s+/gm,''):t;
              const fields=['chief_complaint','history_of_present_illness','medical_history','review_of_systems','physical_exam','assessment','plan','summary','diagnoses','medications','allergies','lab_findings','imaging_findings'];
              const updates={};
              fields.forEach(f=>{const v=structuredPreview[f];if(v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&v.length===0)){updates[f]=Array.isArray(v)?v:stripMd(v);}});
              if(Object.keys(updates).length>0){await base44.entities.ClinicalNote.update(savedNoteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",savedNoteId]});}
              toast.success(`Applied ${Object.keys(updates).length} fields to note`);
              setShowStructuredPreview(false);
            }}
          />
        )}

        <CreateTemplateFromNote open={templateDialogOpen} onClose={()=>setTemplateDialogOpen(false)} note={note} onSuccess={()=>setTemplateDialogOpen(false)} />
      </div>
    </>
  );
}

// ─── Studio Section Components ────────────────────────────────────

function FC({title,badge,badgeColor="b",abn,children}){
  const bk={a:"rgba(255,92,108,.16)",w:"rgba(245,166,35,.13)",g:"rgba(46,204,113,.1)",b:"rgba(74,144,217,.1)"};
  const bt={a:C.red,w:C.amber,g:C.green,b:C.blue};
  return(
    <div style={{background:C.panel,border:`1px solid ${abn?"rgba(255,92,108,.4)":C.border}`,borderRadius:12,marginBottom:11,overflow:"hidden"}}>
      <div style={{padding:"9px 14px",background:"rgba(0,0,0,.15)",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.dim,letterSpacing:".1em",flex:1}}>{title}</div>
        {badge&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:7,background:bk[badgeColor]||bk.b,border:`1px solid ${(bt[badgeColor]||bt.b)}55`,color:bt[badgeColor]||bt.b}}>{badge}</span>}
      </div>
      <div style={{padding:"12px 14px"}}>{children}</div>
    </div>
  );
}

function SectionOverview({pt,totalAbn,dxList}){
  const v=pt.vitals;
  const stats=[
    {lbl:"Heart Rate",val:v.hr,unit:"bpm",color:+v.hr>100||+v.hr<60?C.red:C.green},
    {lbl:"Blood Pressure",val:v.sbp&&v.dbp?`${v.sbp}/${v.dbp}`:v.sbp||"—",unit:"mmHg",color:+v.sbp<90?C.red:C.green},
    {lbl:"Temperature",val:v.temp,unit:"°C",color:+v.temp>38.3?C.red:C.green},
    {lbl:"SpO₂",val:v.spo2,unit:"%",color:+v.spo2<94?C.red:+v.spo2<96?C.amber:C.green},
    {lbl:"GCS",val:v.gcs,unit:"/15",color:+v.gcs<14?C.red:+v.gcs<15?C.amber:C.green},
    {lbl:"Resp Rate",val:v.rr,unit:"br/min",color:+v.rr>20?C.amber:C.green},
  ];
  return(
    <>
      {totalAbn>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>🔴</span>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>ABNORMAL FINDINGS — {totalAbn} TOTAL</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.65}}>Review flagged sections for abnormal labs, physical exam findings, and imaging results.</div>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:11}}>
        <FC title="PATIENT INFORMATION">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["Name",pt.name||"—"],["MRN",pt.mrn||"—"],["DOB",pt.dob||"—"],["Age/Sex",[pt.age,pt.sex].filter(Boolean).join(' ')||"—"],["Visit Type",pt.type||"—"],["Provider",pt.provider||"—"]].map(([l,v])=>(
              <div key={l}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted}}>{l}</div><div style={{fontSize:12,fontWeight:500,color:C.text}}>{v}</div></div>
            ))}
          </div>
        </FC>
        <FC title="CHIEF COMPLAINT" badge={pt.cc?"HPI":"EMPTY"} badgeColor={pt.cc?"b":"w"}>
          <div style={{fontSize:12,color:C.text,lineHeight:1.75}}>{pt.cc||<span style={{color:C.muted}}>No chief complaint entered yet.</span>}</div>
        </FC>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
        {stats.map(s=>(
          <div key={s.lbl} style={{background:C.edge,borderRadius:10,padding:"10px 12px",border:`1px solid ${s.val?s.color+"32":C.border}`}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,marginBottom:3}}>{s.lbl}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.val?s.color:C.muted}}>{s.val||"—"}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.muted}}>{s.unit}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function SectionCCHPI({pt,updatePt,inputS,textareaS,labelS}){
  return(
    <>
      <FC title="CHIEF COMPLAINT" badge="SUBJECTIVE" badgeColor="b">
        <textarea style={{...textareaS,minHeight:50}} value={pt.cc} onChange={e=>updatePt("cc",e.target.value)} placeholder="Enter chief complaint..." />
      </FC>
      <FC title="HISTORY OF PRESENT ILLNESS" badge="HPI" badgeColor="b">
        <textarea style={{...textareaS,minHeight:130}} value={pt.hpi} onChange={e=>updatePt("hpi",e.target.value)} placeholder="Enter HPI with OLDCARTS elements..." />
      </FC>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        {[["ONSET / TIMING","onset"],["SEVERITY / QUALITY","severity"],["MODIFYING FACTORS","modifying"],["ASSOCIATED SYMPTOMS","associated"]].map(([lbl,key])=>(
          <FC key={key} title={lbl}><textarea style={{...textareaS,minHeight:45}} value={pt[key]||""} onChange={e=>updatePt(key,e.target.value)} placeholder="..." /></FC>
        ))}
      </div>
    </>
  );
}

function SectionPMH({pt,updatePt,inputS,textareaS,labelS}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
      <div>
        <FC title="PAST MEDICAL HISTORY"><textarea style={{...textareaS,minHeight:80}} value={pt.pmh.join('\n')} onChange={e=>updatePt("pmh",e.target.value.split('\n'))} placeholder="One condition per line..." /></FC>
        <FC title="PAST SURGICAL HISTORY"><textarea style={{...textareaS,minHeight:60}} value={pt.psh.join('\n')} onChange={e=>updatePt("psh",e.target.value.split('\n'))} placeholder="One procedure per line..." /></FC>
        <FC title="FAMILY HISTORY"><textarea style={{...textareaS,minHeight:55}} value={pt.family} onChange={e=>updatePt("family",e.target.value)} placeholder="Family history..." /></FC>
      </div>
      <div>
        <FC title="SOCIAL HISTORY"><textarea style={{...textareaS,minHeight:70}} value={pt.social} onChange={e=>updatePt("social",e.target.value)} placeholder="Smoking, alcohol, drugs, occupation..." /></FC>
        <FC title="ALLERGIES" badge={pt.allergies.length>0?`⚠ ${pt.allergies.length} KNOWN`:"NONE"} badgeColor={pt.allergies.length>0?"a":"g"} abn={pt.allergies.length>0}>
          <textarea style={{...textareaS,minHeight:55}} value={pt.allergies.join('\n')} onChange={e=>updatePt("allergies",e.target.value.split('\n').filter(Boolean))} placeholder="One allergy per line (Drug — Reaction)..." />
          {pt.allergies.filter(Boolean).map((a,i)=><div key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:9,background:"rgba(255,92,108,.09)",border:"1px solid rgba(255,92,108,.28)",margin:3,fontSize:12,color:C.red}}>⚠ {a}</div>)}
        </FC>
      </div>
    </div>
  );
}

function SectionMeds({pt,updatePt,inputS,labelS}){
  return(
    <>
      <FC title="MEDICATIONS" badge={`${pt.meds.length} ACTIVE`} badgeColor="g">
        {pt.meds.length>0?(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["MEDICATION","DOSE","ROUTE","FREQ","STATUS"].map(h=><th key={h} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,padding:"7px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",textAlign:"left"}}>{h}</th>)}</tr></thead>
            <tbody>{pt.meds.map((m,i)=><tr key={i}><td style={{padding:"7px 12px",fontSize:12,fontWeight:500,color:C.bright,borderBottom:`1px solid rgba(255,255,255,.04)`}}>{m.n}</td><td style={{padding:"7px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.teal,borderBottom:`1px solid rgba(255,255,255,.04)`}}>{m.d}</td><td style={{padding:"7px 12px",fontSize:11,color:C.dim,borderBottom:`1px solid rgba(255,255,255,.04)`}}>{m.r}</td><td style={{padding:"7px 12px",fontSize:11,color:C.dim,borderBottom:`1px solid rgba(255,255,255,.04)`}}>{m.f}</td><td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 7px",borderRadius:7,background:"rgba(46,204,113,.11)",color:C.green,border:"1px solid rgba(46,204,113,.22)"}}>ACTIVE</span></td></tr>)}</tbody>
          </table>
        ):<div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:12}}>No medications added.</div>}
      </FC>
      <FC title="ALLERGIES" badge={pt.allergies.length>0?`⚠ ${pt.allergies.length} KNOWN`:"NONE KNOWN"} badgeColor={pt.allergies.length>0?"a":"g"} abn={pt.allergies.length>0}>
        {pt.allergies.filter(Boolean).length>0?pt.allergies.filter(Boolean).map((a,i)=><div key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:9,background:"rgba(255,92,108,.09)",border:"1px solid rgba(255,92,108,.28)",margin:3,fontSize:12,color:C.red}}>⚠ {a}</div>):<div style={{color:C.muted,fontSize:12}}>No known drug allergies</div>}
      </FC>
    </>
  );
}

function SectionROS({pt,updatePt}){
  const posSystems=Object.entries(pt.ros).filter(([_,v])=>v.pos.length>0);
  const sysNames={constitutional:"Constitutional",cardiovascular:"Cardiovascular",respiratory:"Respiratory",gastrointestinal:"Gastrointestinal",genitourinary:"Genitourinary",neurological:"Neurological",musculoskeletal:"Musculoskeletal",integumentary:"Integumentary"};
  const toggle=(sys,polarity,symptom)=>{
    const cur=pt.ros[sys][polarity];
    const opp=polarity==="pos"?"neg":"pos";
    const newCur=cur.includes(symptom)?cur.filter(s=>s!==symptom):[...cur,symptom];
    const newOpp=pt.ros[sys][opp].filter(s=>s!==symptom);
    updatePt("ros",{...pt.ros,[sys]:{...pt.ros[sys],[polarity]:newCur,[opp]:newOpp}});
  };
  return(
    <>
      {posSystems.length>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>⚠️</span>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>POSITIVE FINDINGS — {posSystems.length} SYSTEMS</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.65}}>{posSystems.map(([k,v])=><span key={k} style={{display:"inline-block",padding:"1px 8px",borderRadius:6,background:"rgba(255,92,108,.14)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:11,margin:"2px 3px"}}>{sysNames[k]||k}: {v.pos.join(', ')}</span>)}</div>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {Object.entries(pt.ros).map(([sys,data])=>{
          const hasPos=data.pos.length>0;
          const allSyms=[...new Set([...data.pos,...data.neg])];
          return(
            <div key={sys} style={{background:hasPos?"rgba(255,92,108,.05)":C.edge,border:`1px solid ${hasPos?"rgba(255,92,108,.4)":C.border}`,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {sysNames[sys]||sys}
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:hasPos?C.red:C.green}}>{hasPos?'POS':'NEG'}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {allSyms.map(s=>{
                  const isPos=data.pos.includes(s);
                  const isNeg=data.neg.includes(s);
                  return<span key={s} onClick={()=>toggle(sys,isPos?"pos":"neg",s)} style={{padding:"3px 9px",borderRadius:7,fontSize:11,cursor:"pointer",background:isPos?"rgba(255,92,108,.13)":isNeg?"rgba(46,204,113,.09)":"transparent",border:`1px solid ${isPos?"rgba(255,92,108,.38)":isNeg?"rgba(46,204,113,.28)":C.border}`,color:isPos?C.red:isNeg?C.green:C.dim}}>{s}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SectionVitals({pt,updatePt}){
  const vDefs=[
    {k:"hr",lbl:"HEART RATE",unit:"bpm",ref:"60-100",abn:v=>+v>100||+v<60,warn:()=>false},
    {k:"sbp",lbl:"SYS BP",unit:"mmHg",ref:"90-140",abn:v=>+v<90,warn:v=>+v>160},
    {k:"dbp",lbl:"DIA BP",unit:"mmHg",ref:"60-90",abn:v=>+v<60,warn:()=>false},
    {k:"temp",lbl:"TEMPERATURE",unit:"°C",ref:"36.1-37.2",abn:v=>+v>38.3||+v<35,warn:v=>+v>37.5},
    {k:"rr",lbl:"RESP RATE",unit:"br/min",ref:"12-20",abn:v=>+v>24||+v<10,warn:v=>+v>20},
    {k:"spo2",lbl:"SpO₂",unit:"%",ref:"≥96%",abn:v=>+v<94,warn:v=>+v<96},
    {k:"gcs",lbl:"GCS",unit:"/15",ref:"15",abn:v=>+v<14,warn:v=>+v<15},
    {k:"wt",lbl:"WEIGHT",unit:"kg",ref:"—",abn:()=>false,warn:()=>false},
    {k:"ht",lbl:"HEIGHT",unit:"cm",ref:"—",abn:()=>false,warn:()=>false},
    {k:"bmi",lbl:"BMI",unit:"kg/m²",ref:"18.5-24.9",abn:v=>+v>40,warn:v=>+v>29.9||+v<18.5},
  ];
  const abnDefs=vDefs.filter(d=>pt.vitals[d.k]&&d.abn(pt.vitals[d.k]));
  return(
    <>
      {abnDefs.length>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>🔴</span>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>CRITICAL VITAL ABNORMALITIES — {abnDefs.length} OUT OF RANGE</div>
          <div style={{fontSize:12,color:C.text}}>{abnDefs.map(d=><span key={d.k} style={{display:"inline-block",padding:"1px 8px",borderRadius:6,background:"rgba(255,92,108,.14)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:11,margin:"2px 3px"}}>{d.lbl}: {pt.vitals[d.k]} {d.unit}</span>)}</div>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {vDefs.map(d=>{
          const val=pt.vitals[d.k];
          const isAbn=val&&d.abn(val);
          const isWarn=val&&!isAbn&&d.warn(val);
          return(
            <div key={d.k} style={{background:isAbn?"rgba(255,92,108,.07)":isWarn?"rgba(245,166,35,.05)":C.edge,border:`1px solid ${isAbn?"rgba(255,92,108,.5)":isWarn?"rgba(245,166,35,.4)":C.border}`,borderRadius:11,padding:11}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.muted,letterSpacing:".07em",marginBottom:3}}>{d.lbl}</div>
              <input value={val} onChange={e=>updatePt(`vitals.${d.k}`,e.target.value)} style={{width:"100%",background:"transparent",border:"none",color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:21,fontWeight:700,outline:"none"}} placeholder="—" />
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.muted,marginTop:2}}>{d.unit}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,marginTop:3,color:isAbn?C.red:isWarn?C.amber:val?C.green:C.muted}}>{isAbn?"⚠":isWarn?"!":val?"✓":"—"} {d.ref}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SectionPE({pt,updatePt}){
  const syNames={general:"General",heent:"HEENT",cardiovascular:"Cardiovascular",pulmonary:"Pulmonary",abdomen:"Abdomen",neurological:"Neurological",extremities:"Extremities",skin:"Skin"};
  const abnSys=Object.entries(pt.pe).filter(([_,v])=>v.abn);
  const toggleAbn=sys=>updatePt("pe",{...pt.pe,[sys]:{...pt.pe[sys],abn:!pt.pe[sys].abn}});
  const updateNote=(sys,val)=>updatePt("pe",{...pt.pe,[sys]:{...pt.pe[sys],n:val}});
  return(
    <>
      {abnSys.length>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>🔴</span>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>ABNORMAL PHYSICAL FINDINGS — {abnSys.length} SYSTEMS</div>
          <div style={{fontSize:12,color:C.text}}>{abnSys.map(([k])=><span key={k} style={{display:"inline-block",padding:"1px 8px",borderRadius:6,background:"rgba(255,92,108,.14)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:11,margin:"2px 3px"}}>{syNames[k]||k}</span>)}</div>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {Object.entries(pt.pe).map(([sys,data])=>(
          <div key={sys} style={{background:data.abn?"rgba(255,92,108,.05)":C.edge,border:`1px solid ${data.abn?"rgba(255,92,108,.4)":C.border}`,borderRadius:11,padding:11}}>
            <div style={{fontSize:11,fontWeight:700,color:C.dim,letterSpacing:".06em",textTransform:"uppercase",marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {syNames[sys]||sys}
              <button onClick={()=>toggleAbn(sys)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:7,cursor:"pointer",background:data.abn?"rgba(255,92,108,.16)":"rgba(46,204,113,.1)",border:`1px solid ${data.abn?"rgba(255,92,108,.32)":"rgba(46,204,113,.22)"}`,color:data.abn?C.red:C.green}}>{data.abn?"ABNORMAL":"NORMAL"}</button>
            </div>
            <textarea value={data.n} onChange={e=>updateNote(sys,e.target.value)} rows={2} style={{width:"100%",background:"transparent",border:"none",borderTop:`1px solid ${C.border}`,paddingTop:7,color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",resize:"none",lineHeight:1.6}} placeholder={`${syNames[sys]||sys} examination findings...`} />
          </div>
        ))}
      </div>
    </>
  );
}

function SectionLabs({pt,updatePt}){
  const labs=pt.labs;
  const abnLabs=labs.filter(l=>l.f&&l.f!=='N');
  const addLab=()=>updatePt("labs",[...labs,{n:"",v:"",ref:"",u:"",f:"N"}]);
  const updateLab=(i,field,val)=>updatePt("labs",labs.map((l,idx)=>idx===i?{...l,[field]:val}:l));
  const removeLab=(i)=>updatePt("labs",labs.filter((_,idx)=>idx!==i));
  return(
    <>
      {abnLabs.length>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>🔴</span>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>CRITICAL LAB ABNORMALITIES — {abnLabs.length} VALUES OUT OF RANGE</div>
          <div style={{fontSize:12,color:C.text}}>{abnLabs.map((l,i)=><span key={i} style={{display:"inline-block",padding:"1px 8px",borderRadius:6,background:"rgba(255,92,108,.14)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:11,margin:"2px 3px"}}>{l.n}: {l.v} ({l.f==='H'?'HIGH':'LOW'})</span>)}</div>
        </div>
      </div>}
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",marginBottom:11}}>
        <div style={{padding:"9px 14px",background:"rgba(0,0,0,.15)",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.dim,flex:1}}>LAB RESULTS</div>
          {abnLabs.length>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:7,background:"rgba(255,92,108,.16)",color:C.red,border:"1px solid rgba(255,92,108,.32)"}}>{abnLabs.length} ABNORMAL</span>}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["TEST","RESULT","REFERENCE","UNITS","FLAG",""].map(h=><th key={h} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.dim,padding:"7px 12px",borderBottom:`1px solid ${C.border}`,textAlign:"left",background:C.edge}}>{h}</th>)}</tr></thead>
          <tbody>
            {labs.map((l,i)=>{
              const fg=l.f==='H'||l.f==='L'?C.red:C.text;
              const ar=l.f==='H'?'↑':l.f==='L'?'↓':'';
              return(
                <tr key={i}>
                  <td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><input value={l.n} onChange={e=>updateLab(i,'n',e.target.value)} style={{background:"transparent",border:"none",color:C.text,fontSize:12,outline:"none",width:"100%"}} placeholder="Test name" /></td>
                  <td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><input value={l.v} onChange={e=>updateLab(i,'v',e.target.value)} style={{background:"transparent",border:"none",color:fg,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:12,outline:"none",width:"80px"}} placeholder="—" />{ar&&<span style={{fontSize:10,color:C.red,marginLeft:2}}>{ar}</span>}</td>
                  <td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><input value={l.ref} onChange={e=>updateLab(i,'ref',e.target.value)} style={{background:"transparent",border:"none",color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10,outline:"none",width:"100%"}} placeholder="ref range" /></td>
                  <td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><input value={l.u} onChange={e=>updateLab(i,'u',e.target.value)} style={{background:"transparent",border:"none",color:C.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:10,outline:"none",width:"80px"}} placeholder="unit" /></td>
                  <td style={{padding:"7px 12px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><select value={l.f} onChange={e=>updateLab(i,'f',e.target.value)} style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 5px",color:l.f!=='N'?C.red:C.green,fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",outline:"none"}}><option value="N">N</option><option value="H">H</option><option value="L">L</option></select></td>
                  <td style={{padding:"7px 8px",borderBottom:`1px solid rgba(255,255,255,.04)`}}><button onClick={()=>removeLab(i)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"2px 5px"}}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{padding:"8px 14px"}}><button onClick={addLab} style={{padding:"7px 14px",borderRadius:9,background:"transparent",border:`1px dashed ${C.border}`,color:C.dim,fontSize:11,cursor:"pointer"}}>+ Add Lab Result</button></div>
      </div>
    </>
  );
}

function SectionImaging({pt,updatePt}){
  const imaging=pt.imaging;
  const abnImg=imaging.filter(i=>i.abn);
  const addImg=()=>updatePt("imaging",[...imaging,{type:"",title:"",date:"Today",f:"",imp:"",abn:false}]);
  const updateImg=(i,field,val)=>updatePt("imaging",imaging.map((img,idx)=>idx===i?{...img,[field]:val}:img));
  const removeImg=(i)=>updatePt("imaging",imaging.filter((_,idx)=>idx!==i));
  return(
    <>
      {abnImg.length>0&&<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:11,background:"rgba(255,92,108,.07)",border:"1px solid rgba(255,92,108,.32)",marginBottom:14}}>
        <span>🔴</span>
        <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:C.red,marginBottom:3}}>ABNORMAL DIAGNOSTIC FINDINGS</div>
        <div style={{fontSize:12,color:C.text}}>{abnImg.map((img,i)=><span key={i} style={{display:"inline-block",padding:"1px 8px",borderRadius:6,background:"rgba(255,92,108,.14)",border:"1px solid rgba(255,92,108,.28)",color:C.red,fontSize:11,margin:"2px 3px"}}>{img.type}: {img.imp}</span>)}</div></div>
      </div>}
      {imaging.map((img,i)=>(
        <div key={i} style={{background:C.edge,border:`1px solid ${img.abn?"rgba(255,92,108,.38)":C.border}`,borderRadius:11,padding:11,marginBottom:9}}>
          <div style={{display:"grid",gridTemplateColumns:"80px 1fr 80px auto",gap:8,marginBottom:8}}>
            <input value={img.type} onChange={e=>updateImg(i,'type',e.target.value)} placeholder="TYPE" style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",color:C.blue,fontFamily:"'JetBrains Mono',monospace",fontSize:10,outline:"none",fontWeight:700}} />
            <input value={img.title} onChange={e=>updateImg(i,'title',e.target.value)} placeholder="Study name / title" style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",color:C.bright,fontSize:13,fontWeight:600,outline:"none"}} />
            <input value={img.date} onChange={e=>updateImg(i,'date',e.target.value)} placeholder="Date" style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 7px",color:C.dim,fontSize:11,outline:"none"}} />
            <button onClick={()=>removeImg(i)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>×</button>
          </div>
          <textarea value={img.f} onChange={e=>updateImg(i,'f',e.target.value)} rows={2} placeholder="Findings..." style={{width:"100%",background:"transparent",border:"none",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",resize:"none",lineHeight:1.65,marginBottom:5}} />
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:7,display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.amber,fontWeight:700}}>IMPRESSION:</span>
            <input value={img.imp} onChange={e=>updateImg(i,'imp',e.target.value)} placeholder="Impression..." style={{flex:1,background:"transparent",border:"none",color:C.dim,fontSize:12,outline:"none"}} />
            <button onClick={()=>updateImg(i,'abn',!img.abn)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:7,cursor:"pointer",background:img.abn?"rgba(255,92,108,.16)":"rgba(46,204,113,.1)",border:`1px solid ${img.abn?"rgba(255,92,108,.32)":"rgba(46,204,113,.22)"}`,color:img.abn?C.red:C.green}}>{img.abn?"ABNORMAL":"NORMAL"}</button>
          </div>
        </div>
      ))}
      <button onClick={addImg} style={{width:"100%",padding:10,borderRadius:11,background:"transparent",border:`1px dashed ${C.border}`,color:C.dim,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>+ Add Imaging / Diagnostic Study</button>
    </>
  );
}

function SectionAssessment({dxList,addDx,removeDx,updateDx,inputS,textareaS}){
  return(
    <>
      {dxList.map((dx,i)=>(
        <div key={i} style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,padding:11,marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:C.teal,width:22,height:22,borderRadius:"50%",border:"1px solid rgba(0,212,188,.38)",background:"rgba(0,212,188,.09)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
            <input value={dx.dx} onChange={e=>updateDx(i,'dx',e.target.value)} placeholder="Enter diagnosis..." style={{flex:1,background:"transparent",border:"none",color:C.bright,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:600,outline:"none"}} />
            <button onClick={()=>removeDx(i)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"3px 6px"}}>×</button>
          </div>
          <textarea value={dx.plan} onChange={e=>updateDx(i,'plan',e.target.value)} rows={3} placeholder="Management plan..." style={{width:"100%",background:"transparent",border:"none",borderTop:`1px solid ${C.border}`,paddingTop:7,color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",resize:"none",lineHeight:1.65}} />
        </div>
      ))}
      <button onClick={addDx} style={{width:"100%",padding:10,borderRadius:11,background:"transparent",border:`1px dashed ${C.border}`,color:C.dim,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>+ Add Diagnosis</button>
    </>
  );
}

function SectionDisposition({pt,updatePt,inputS,textareaS,labelS}){
  const opts=[{id:"admit-icu",lbl:"Admit — ICU",icon:"🏥"},{id:"admit-floor",lbl:"Admit — Floor",icon:"🛏️"},{id:"obs",lbl:"Observation",icon:"👁️"},{id:"discharge",lbl:"Discharge Home",icon:"🏠"}];
  return(
    <>
      <FC title="DISPOSITION DECISION">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {opts.map(o=><div key={o.id} onClick={()=>updatePt("disposition",o.id)} style={{padding:12,borderRadius:11,border:`2px solid ${pt.disposition===o.id?C.teal:C.border}`,cursor:"pointer",textAlign:"center",transition:"all .15s",background:pt.disposition===o.id?"rgba(0,212,188,.07)":C.edge}}>
            <div style={{fontSize:22,marginBottom:4}}>{o.icon}</div>
            <div style={{fontSize:12,fontWeight:600,color:pt.disposition===o.id?C.teal:C.text}}>{o.lbl}</div>
          </div>)}
        </div>
      </FC>
      <FC title="DISPOSITION NOTES"><textarea style={{...textareaS,minHeight:65}} value={pt.dc} onChange={e=>updatePt("dc",e.target.value)} placeholder="Disposition notes, instructions, consultations..." /></FC>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <FC title="FOLLOW-UP INSTRUCTIONS"><textarea style={{...textareaS,minHeight:55}} value={pt.followup||""} onChange={e=>updatePt("followup",e.target.value)} placeholder="Follow-up instructions..." /></FC>
        <FC title="PATIENT EDUCATION"><textarea style={{...textareaS,minHeight:55}} value={pt.education||""} onChange={e=>updatePt("education",e.target.value)} placeholder="Patient education notes..." /></FC>
      </div>
    </>
  );
}

function AILoadingState(){
  const shimmer={background:"linear-gradient(90deg,#162d4f 0%,#2a4d7220 50%,#162d4f 100%)",backgroundSize:"600px 100%",animation:"shimmer 1.4s infinite",minHeight:55,borderRadius:"0 0 11px 11px"};
  return(
    <>
      <div style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>✦</span><span style={{fontSize:11,fontWeight:600,color:C.text,flex:1}}>Analyzing...</span></div>
        <div style={shimmer} />
      </div>
    </>
  );
}

function AIAnalysisPanel({data}){
  return(
    <>
      <div style={{background:"linear-gradient(135deg,rgba(0,212,188,.06),rgba(155,109,255,.03))",border:"1px solid rgba(0,212,188,.22)",borderRadius:12,padding:12,marginBottom:11}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:C.teal,letterSpacing:".12em",marginBottom:6}}>✦ AI ANALYSIS</div>
        <div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{data.summary||""}</div>
      </div>
      {data.abnormals?.length>0&&<div style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:6}}><span>⚠️</span><span style={{fontSize:11,fontWeight:600,color:C.text,flex:1}}>Abnormal Findings</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:7,background:"rgba(255,92,108,.13)",color:C.red,border:"1px solid rgba(255,92,108,.28)"}}>{data.abnormals.length}</span></div>
        <div style={{padding:"10px 12px"}}>{data.abnormals.map((a,i)=>{const dc=a.severity==='critical'?C.red:a.severity==='high'?C.amber:C.blue;return<div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<data.abnormals.length-1?"1px solid rgba(255,255,255,.04)":"none"}}><div style={{width:5,height:5,borderRadius:"50%",background:dc,flexShrink:0,marginTop:5}} /><div style={{fontSize:11,color:C.text,lineHeight:1.55,flex:1}}><strong style={{color:dc}}>{a.finding}</strong> — {a.detail}</div></div>;})}</div>
      </div>}
      {data.insights?.length>0&&<div style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:6}}><span>💡</span><span style={{fontSize:11,fontWeight:600,color:C.text}}>Clinical Insights</span></div>
        <div style={{padding:"10px 12px"}}>{data.insights.map((ins,i)=><div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<data.insights.length-1?"1px solid rgba(255,255,255,.04)":"none"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.purple,flexShrink:0,marginTop:5}} /><div style={{fontSize:11,color:C.text,lineHeight:1.55,flex:1}}>{ins}</div></div>)}</div>
      </div>}
      {data.recommendation&&<div style={{padding:"9px 12px",borderRadius:9,background:"rgba(0,212,188,.05)",border:"1px solid rgba(0,212,188,.22)",fontSize:12,color:C.teal,marginBottom:9}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:".1em",marginBottom:4}}>RECOMMENDATION</div>{data.recommendation}
      </div>}
      {data.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{data.tags.map((t,i)=>{const bc=t.color==='red'?"rgba(255,92,108,.14)":t.color==='amber'?"rgba(245,166,35,.11)":t.color==='green'?"rgba(46,204,113,.09)":"rgba(74,144,217,.1)";const tc=t.color==='red'?C.red:t.color==='amber'?C.amber:t.color==='green'?C.green:C.blue;return<span key={i} style={{padding:"2px 7px",borderRadius:7,fontSize:10,background:bc,color:tc,border:`1px solid ${tc}28`}}>{t.text}</span>;})}</div>}
    </>
  );
}

function AISummaryPanel({data}){
  return(
    <>
      <div style={{background:"linear-gradient(135deg,rgba(0,212,188,.06),rgba(155,109,255,.03))",border:"1px solid rgba(0,212,188,.22)",borderRadius:12,padding:12,marginBottom:11}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:C.teal,letterSpacing:".12em",marginBottom:6}}>✦ NOTE SUMMARY</div>
        <div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{data.summary||""}</div>
      </div>
      {data.criticals?.length>0&&<div style={{background:"rgba(255,92,108,.05)",border:"1px solid rgba(255,92,108,.22)",borderRadius:11,padding:"10px 12px",marginBottom:10}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:C.red,letterSpacing:".1em",marginBottom:7}}>⚠ CRITICAL FINDINGS</div>
        {data.criticals.map((c,i)=>{const dc=c.flag==='critical'?C.red:c.flag==='high'?C.amber:C.blue;return<div key={i} style={{fontSize:11,color:C.text,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",gap:5}}><span style={{color:dc}}>•</span><span>{c.item}</span></div>;})}
      </div>}
      {data.keyDx?.length>0&&<div style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:6}}><span>⚕️</span><span style={{fontSize:11,fontWeight:600,color:C.text}}>Key Diagnoses</span></div>
        <div style={{padding:"10px 12px"}}>{data.keyDx.map((d,i)=><div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<data.keyDx.length-1?"1px solid rgba(255,255,255,.04)":"none"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.teal,flexShrink:0,marginTop:5}} /><div style={{fontSize:11,color:C.text,lineHeight:1.55,flex:1}}>{i+1}. {d}</div></div>)}</div>
      </div>}
      {data.actions?.length>0&&<div style={{background:C.edge,border:`1px solid ${C.border}`,borderRadius:11,marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:6}}><span>⚡</span><span style={{fontSize:11,fontWeight:600,color:C.text}}>Recommended Actions</span></div>
        <div style={{padding:"10px 12px"}}>{data.actions.map((a,i)=><div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<data.actions.length-1?"1px solid rgba(255,255,255,.04)":"none"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.amber,flexShrink:0,marginTop:5}} /><div style={{fontSize:11,color:C.text,lineHeight:1.55,flex:1}}>{a}</div></div>)}</div>
      </div>}
      {data.mdm&&<div style={{padding:"8px 12px",borderRadius:9,background:"rgba(74,144,217,.07)",border:"1px solid rgba(74,144,217,.22)",fontSize:11,color:C.blue}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:".1em"}}>MDM LEVEL: </span>{data.mdm}</div>}
    </>
  );
}

function AIDefaultState(){
  return(
    <div style={{padding:"22px 14px",textAlign:"center",color:C.muted}}>
      <div style={{fontSize:30,marginBottom:9,opacity:.4}}>🤖</div>
      <div style={{fontSize:12,color:C.dim,lineHeight:1.7}}>Select a section and click <strong style={{color:C.purple}}>Analyze Section</strong> for AI insights, or use <strong style={{color:C.teal}}>Analyze Entire Note</strong> for a complete review.</div>
    </div>
  );
}