import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileText, Activity, Beaker, Code, Brain, Pill, Plus,
  Settings, RotateCcw, ArrowLeft, Sparkles
} from "lucide-react";

import SubjectiveTab from "./SubjectiveTab";
import PhysicalExamTab from "./PhysicalExamTab";
import LabsImagingTab from "./LabsImagingTab";
import DifferentialTab from "./DifferentialTab";
import MedicalDecisionMakingTab from "./MedicalDecisionMakingTab";
import TreatmentPlanTab from "./TreatmentPlanTab";
import MedicationsTab from "./MedicationsTab";
import ProceduresTabContent from "../procedures/ProceduresTabContent";
import ERDispositionTab from "./ERDispositionTab";
import DischargeSummaryTabNew from "./DischargeSummaryTab";
import ClinicalNoteComposer from "./ClinicalNoteComposer";
import VitalSignsTab from "./VitalSignsTab";
import NoteAbnormalFindingsAnalyzer from "./NoteAbnormalFindingsAnalyzer";
import NoteTopBar from "./NoteTopBar";
import NotePatientVitalsBar from "./NotePatientVitalsBar";
import BillingPanel from "../billing/BillingPanel";
import AISidebar from "../ai/AISidebar";
import AIStructuredNotePreview from "./AIStructuredNotePreview";
import CreateTemplateFromNote from "../templates/CreateTemplateFromNote";
import GuidelineReviewPrompt from "./GuidelineReviewPrompt";
import TabDataPreview from "./TabDataPreview";
import ClinicalNotePreviewButton from "./ClinicalNotePreviewButton";

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

export default function NoteEditorTabs({ note, noteId, initialTab = "patient_intake" }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
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

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list()
  });

  const { data: customTabGroups = [] } = useQuery({
    queryKey: ["customTabGroups"],
    queryFn: async () => {
      const groups = await base44.entities.TabGroup.list();
      return groups.sort((a, b) => a.order - b.order);
    }
  });

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

  const finalizeMutation = useMutation({
    mutationFn: async () => { await base44.entities.ClinicalNote.update(noteId, {status:"finalized"}); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey:["studioNote",noteId]});
      await queryClient.invalidateQueries({queryKey:["note",noteId]});
      await new Promise(r => setTimeout(r, 500));
    },
    onError: () => toast.error("Failed to finalize note"),
  });

  const exportNote = async (fmt) => {
    setExportingFormat(fmt);
    try {
      const response = await base44.functions.invoke('exportClinicalNote', {noteId:noteId,format:fmt});
      const blob = new Blob([response.data], {type:fmt==='pdf'?'application/pdf':'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${note.patient_name}_${note.date_of_visit||'Note'}.${fmt==='pdf'?'pdf':'txt'}`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    } catch (e) { alert(`Failed to export note as ${fmt}`); }
    finally { setExportingFormat(null); }
  };

  const generateDifferentialDiagnosis = async () => {
    if (!note?.chief_complaint) return;
    setLoadingDifferential(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive differential diagnosis list based on this clinical presentation. Rank by likelihood and provide reasoning for each.

CHIEF COMPLAINT:
${note.chief_complaint}

HISTORY OF PRESENT ILLNESS:
${note.history_of_present_illness || "N/A"}

PHYSICAL EXAM:
${note.physical_exam || "N/A"}

VITAL SIGNS & ASSESSMENT:
${note.assessment || "N/A"}

Provide results with: diagnosis, likelihood_rank (1-5, 5 being most likely), clinical_reasoning, red_flags_to_monitor.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            differentials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  likelihood_rank: { type: "number", minimum: 1, maximum: 5 },
                  clinical_reasoning: { type: "string" },
                  red_flags_to_monitor: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      const sorted = (result.differentials || []).sort((a, b) => b.likelihood_rank - a.likelihood_rank);
      setDifferentialDiagnosis(sorted);
    } catch (error) {
      console.error("Failed to generate differential diagnosis:", error);
    } finally {
      setLoadingDifferential(false);
    }
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

  const C = {navy:"#050f1e"};

  return (
    <>
      <NoteTopBar note={note} noteId={noteId} queryClient={queryClient} onNext={handleNext} autoSaveStatus={autoSaveStatus} />
      <NotePatientVitalsBar note={note} />

      {showGuidelinePrompt && note?.linked_guidelines && (
        <GuidelineReviewPrompt
          linkedGuidelines={note.linked_guidelines}
          onIncorporate={async (guideline) => {
            const updatedGuidelines = note.linked_guidelines.map(g =>
              g.guideline_query_id===guideline.guideline_query_id?{...g,incorporated:true,adherence_notes:"Incorporated into plan"}:g
            );
            await base44.entities.ClinicalNote.update(noteId,{linked_guidelines:updatedGuidelines});
            queryClient.invalidateQueries({queryKey:["studioNote",noteId]});
            queryClient.invalidateQueries({queryKey:["note",noteId]});
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
              <VitalSignsTab note={note} noteId={noteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis} vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis} vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="patient_intake" className="overflow-y-auto" style={{background:C.navy}}>
              <SubjectiveTab note={note} noteId={noteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} analyzingRawData={analyzingRawData} setAnalyzingRawData={setAnalyzingRawData} checkingGrammar={checkingGrammar} setCheckingGrammar={setCheckingGrammar} grammarSuggestions={grammarSuggestions} setGrammarSuggestions={setGrammarSuggestions} loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis} vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis} vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory} rosNormal={rosNormal} setRosNormal={setRosNormal} structuredPreview={structuredPreview} setStructuredPreview={setStructuredPreview} showStructuredPreview={showStructuredPreview} setShowStructuredPreview={setShowStructuredPreview} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="differential" className="overflow-y-auto" style={{background:C.navy}}>
              <DifferentialTab note={note} noteId={noteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingDifferential={loadingDifferential} generateDifferentialDiagnosis={generateDifferentialDiagnosis} differentialDiagnosis={differentialDiagnosis} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="labs_imaging" className="overflow-y-auto" style={{background:C.navy}}>
              <div style={{maxWidth:"900px",margin:"0 auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:"20px"}}>
                <NoteAbnormalFindingsAnalyzer note={note} noteId={noteId} queryClient={queryClient} />
                <LabsImagingTab note={note} noteId={noteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
              </div>
            </TabsContent>

            <TabsContent value="treatment_plan" className="overflow-y-auto" style={{background:C.navy}}>
              <TreatmentPlanTab note={note} noteId={noteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="mdm" className="overflow-y-auto">
              <MedicalDecisionMakingTab note={note} noteId={noteId} onUpdateNote={async(updates)=>{await base44.entities.ClinicalNote.update(noteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",noteId]});queryClient.invalidateQueries({queryKey:["note",noteId]});}} />
            </TabsContent>

            <TabsContent value="medications" className="overflow-y-auto" style={{background:C.navy}}>
              <MedicationsTab note={note} noteId={noteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="clinical_note" className="overflow-y-auto" style={{background:C.navy}}>
              <ClinicalNoteComposer note={note} noteId={noteId} queryClient={queryClient} />
              <div className="max-w-3xl mx-auto px-4 pb-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <BillingPanel note={note} noteId={noteId} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physical_exam" className="overflow-y-auto" style={{background:C.navy}}>
              <PhysicalExamTab note={note} noteId={noteId} queryClient={queryClient} physicalExamNormal={physicalExamNormal} setPhysicalExamNormal={setPhysicalExamNormal} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="disposition_plan" className="overflow-y-auto" style={{background:C.navy}}>
              <ERDispositionTab note={note} noteId={noteId} queryClient={queryClient} finalizeMutation={finalizeMutation} exportNote={exportNote} exportingFormat={exportingFormat} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
            </TabsContent>

            <TabsContent value="discharge_summary" className="overflow-y-auto" style={{background:C.navy}}>
              <DischargeSummaryTabNew note={note} noteId={noteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
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
                    <div className="p-4"><Textarea placeholder={`Add notes for ${tab.label}...`} className="w-full min-h-[300px] text-sm resize-none border-slate-200" /></div>
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

      <AISidebar isOpen={aiSidebarOpen} onClose={()=>setAiSidebarOpen(false)} note={note} noteId={noteId} activeTab={activeTab} onUpdateNote={async(updates)=>{await base44.entities.ClinicalNote.update(noteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",noteId]});queryClient.invalidateQueries({queryKey:["note",noteId]});}} />

      {showStructuredPreview && (
        <AIStructuredNotePreview structured={structuredPreview} activeTab={activeTab} onClose={()=>setShowStructuredPreview(false)}
          onApply={async()=>{
            if(!structuredPreview) return;
            const stripMd=t=>typeof t==='string'?t.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/^#{1,6}\s+/gm,''):t;
            const fields=['chief_complaint','history_of_present_illness','medical_history','review_of_systems','physical_exam','assessment','plan','summary','diagnoses','medications','allergies','lab_findings','imaging_findings'];
            const updates={};
            fields.forEach(f=>{const v=structuredPreview[f];if(v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&v.length===0)){updates[f]=Array.isArray(v)?v:stripMd(v);}});
            if(Object.keys(updates).length>0){await base44.entities.ClinicalNote.update(noteId,updates);queryClient.invalidateQueries({queryKey:["studioNote",noteId]});queryClient.invalidateQueries({queryKey:["note",noteId]});}
            toast.success(`Applied ${Object.keys(updates).length} fields to note`);
            setShowStructuredPreview(false);
          }}
        />
      )}

      <CreateTemplateFromNote open={templateDialogOpen} onClose={()=>setTemplateDialogOpen(false)} note={note} onSuccess={()=>setTemplateDialogOpen(false)} />
    </>
  );
}