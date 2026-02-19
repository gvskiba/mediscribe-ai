import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
        ArrowLeft,
        FileText,
        Calendar,
        Hash,
        Sparkles,
        Loader2,
        Check,
        Plus,
        Code,
        Download,
        BookOpen,
        FileCode,
        Clock,
        AlertCircle,
        ImageIcon,
        Beaker,
        Activity,
        Pill,
        X,
        ChevronDown,
        ChevronUp,
        GripVertical,
        RotateCcw,
        Settings,
        ExternalLink,
        Brain
      } from "lucide-react";
      import MedicationRecommendations from "../components/notes/MedicationRecommendations";
      import TreatmentPlanSelector from "../components/notes/TreatmentPlanSelector";
      import EditableSection from "../components/notes/EditableSection";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import PatientSummary from "../components/notes/PatientSummary";
import EditableSummaryGenerator from "../components/notes/EditableSummaryGenerator";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import ICD10Suggestions from "../components/notes/ICD10Suggestions";
import ICD10CodeSearch from "../components/notes/ICD10CodeSearch";
import GuidelineReviewPrompt from "../components/notes/GuidelineReviewPrompt";
import NoteRevisionHistory from "../components/notes/NoteRevisionHistory";
import ImagingAnalysis from "../components/notes/ImagingAnalysis";
import LabsAnalysis from "../components/notes/LabsAnalysis";
import EKGAnalysis from "../components/notes/EKGAnalysis";
import DiagnosisICD10Matcher from "../components/notes/DiagnosisICD10Matcher";
import DiagnosisRecommendations from "../components/notes/DiagnosisRecommendations";
import MedicalLiteratureSearch from "../components/research/MedicalLiteratureSearch";
import VitalSignsInput from "../components/notes/VitalSignsInput";
import { useAutoSave } from "../components/utils/useAutoSave";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ClinicalDecisionSupport from "../components/notes/ClinicalDecisionSupport";
import RichTextNoteEditor from "../components/notes/RichTextNoteEditor";
import AIComprehensiveSummary from "../components/notes/AIComprehensiveSummary";
import ClinicalNotePreviewButton from "../components/notes/ClinicalNotePreviewButton";
import TabDataPreview from "../components/notes/TabDataPreview";
import AITreatmentPlanAnalyzer from "../components/notes/AITreatmentPlanAnalyzer";
import ClinicalNoteView from "../components/notes/ClinicalNoteView";
import SmartTemplateApplicator from "../components/templates/SmartTemplateApplicator";
import AIDocumentationAssistant from "../components/ai/AIDocumentationAssistant";
import AIMDMAnalyzer from "../components/notes/AIMDMAnalyzer";
import PhysicalExamEditor from "../components/notes/PhysicalExamEditor";
import ReviewOfSystemsEditor from "../components/notes/ReviewOfSystemsEditor";
import BMICalculator from "../components/calculators/BMICalculator";
import CreatinineClearanceCalculator from "../components/calculators/CreatinineClearanceCalculator";
import MedicationDosingLookup from "../components/calculators/MedicationDosingLookup";
import ProceduresPanel from "../components/procedures/ProceduresPanel";
import ClinicalWorkflowAutomation from "../components/notes/ClinicalWorkflowAutomation";
import AIGuidelineSuggestions from "../components/notes/AIGuidelineSuggestions";
import AISidebar from "../components/ai/AISidebar";
import InlineSectionAI from "../components/ai/InlineSectionAI";
import NoteTypeAndTemplateSelector from "../components/notes/NoteTypeAndTemplateSelector";
import MedicalDecisionMakingTab from "../components/notes/MedicalDecisionMakingTab";

const TAB_GROUPS = [
  {
    id: 'patient',
    label: 'Patient',
    color: 'blue',
    tabs: [
      { id: 'patient_intake', label: 'Subjective', icon: Activity },
    ]
  },
  {
    id: 'examination',
    label: 'Objective',
    color: 'emerald',
    tabs: [
      { id: 'review_of_systems', label: 'Review of Systems', icon: Activity },
      { id: 'physical_exam', label: 'Physical Exam', icon: Activity },
      { id: 'vital_signs', label: 'Vital Signs', icon: Activity },
    ]
  },
  {
    id: 'assessment',
    label: 'Assessment',
    color: 'rose',
    tabs: [
      { id: 'differential', label: 'Differential Dx', icon: Code },
      { id: 'labs_imaging', label: 'Labs & Imaging', icon: Beaker },
      { id: 'diagnoses', label: 'Final Diagnoses', icon: Code },
    ]
  },
  {
    id: 'plan',
    label: 'Plan',
    color: 'amber',
    tabs: [
      { id: 'treatment_plan', label: 'Treatment Plan', icon: FileText },
      { id: 'mdm', label: 'MDM', icon: Brain },
      { id: 'medications', label: 'Medications', icon: Pill },
      { id: 'procedures', label: 'Procedures', icon: Activity },
    ]
  },
  {
    id: 'finalize',
    label: 'Finalize',
    color: 'indigo',
    tabs: [
      { id: 'clinical_note', label: 'Clinical Note', icon: FileText },
      { id: 'finalize', label: 'Review & Export', icon: Check },
    ]
  }
];

const TAB_CONFIGS = TAB_GROUPS.flatMap(group => group.tabs);

const statusColors = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amended: "bg-blue-50 text-blue-700 border-blue-200",
};

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "History & Physical",
  discharge_summary: "Discharge Summary",
  consult: "Consultation",
  procedure_note: "Procedure Note",
};

export default function NoteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const noteId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [patientSummary, setPatientSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [icd10Suggestions, setIcd10Suggestions] = useState([]);
  const [loadingIcd10, setLoadingIcd10] = useState(false);
  const [guidelineRecommendations, setGuidelineRecommendations] = useState([]);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [followUpTests, setFollowUpTests] = useState([]);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState([]);
  const [loadingDifferential, setLoadingDifferential] = useState(false);
  const [patientEducation, setPatientEducation] = useState(null);
  const [generatingEducation, setGeneratingEducation] = useState(false);
  const [labRecommendations, setLabRecommendations] = useState([]);
  const [loadingLabRecommendations, setLoadingLabRecommendations] = useState(false);
  const [imagingRecommendations, setImagingRecommendations] = useState([]);
  const [loadingImagingRecommendations, setLoadingImagingRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [analyzingRawData, setAnalyzingRawData] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [extractingData, setExtractingData] = useState(false);
  const [linkingGuidelines, setLinkingGuidelines] = useState(false);
  const [showGuidelinePrompt, setShowGuidelinePrompt] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const [tabGroups, setTabGroups] = useState(TAB_GROUPS);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [customizing, setCustomizing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState("patient_intake");
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [showCreateTabDialog, setShowCreateTabDialog] = useState(false);
  const [selectedGroupForNewTab, setSelectedGroupForNewTab] = useState(null);
  const [newTabName, setNewTabName] = useState("");
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("blue");
  const [physicalExamNormal, setPhysicalExamNormal] = useState(
    note?.physical_exam === "No abnormalities noted. All systems within normal limits on examination."
  );
  const [rosNormal, setRosNormal] = useState(
    note?.review_of_systems?.includes("REVIEW OF SYSTEMS:") && 
    note?.review_of_systems?.includes("Denies fever, chills, weight loss")
  );

  const handleNext = () => {
    const allTabs = tabGroups.flatMap(g => g.tabs.map(t => t.id));
    const currentIndex = allTabs.indexOf(activeTab);
    if (currentIndex < allTabs.length - 1) {
      setActiveTab(allTabs[currentIndex + 1]);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'GROUP') {
      // Reorder groups locally first
      const newGroups = Array.from(tabGroups);
      const [removed] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, removed);
      setTabGroups(newGroups);
      
      // Update order in database for custom groups
      try {
        for (let i = 0; i < newGroups.length; i++) {
          const group = newGroups[i];
          if (group.id.startsWith('custom_group_')) {
            const dbGroups = await base44.entities.TabGroup.filter({ group_id: group.id });
            if (dbGroups.length > 0) {
              await base44.entities.TabGroup.update(dbGroups[0].id, { order: i });
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      } catch (error) {
        console.error("Failed to reorder groups:", error);
        toast.error("Failed to reorder groups");
      }
      return;
    }

    const sourceGroup = tabGroups.find(g => g.id === source.droppableId);
    const destGroup = tabGroups.find(g => g.id === destination.droppableId);

    if (!sourceGroup || !destGroup) return;

    // Handle tab reordering within same group or between groups
    try {
      const persistTabsForGroup = async (group, tabs) => {
        const dbGroups = await base44.entities.TabGroup.filter({ group_id: group.id });
        // Store only id+label (no React icon functions)
        const tabsToStore = tabs.map(({ id, label }) => ({ id, label }));
        if (dbGroups.length > 0) {
          await base44.entities.TabGroup.update(dbGroups[0].id, { tabs: tabsToStore });
        } else {
          // Create a new record for default groups to persist their tab order
          await base44.entities.TabGroup.create({
            group_id: group.id,
            label: group.label,
            color: group.color,
            tabs: tabsToStore,
            order: tabGroups.findIndex(g => g.id === group.id)
          });
        }
      };

      if (source.droppableId === destination.droppableId) {
        const newTabs = Array.from(sourceGroup.tabs);
        const [removed] = newTabs.splice(source.index, 1);
        newTabs.splice(destination.index, 0, removed);

        // Update local state immediately
        const updatedGroups = tabGroups.map(g =>
          g.id === sourceGroup.id ? { ...g, tabs: newTabs } : g
        );
        setTabGroups(updatedGroups);

        await persistTabsForGroup(sourceGroup, newTabs);
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      } else {
        const sourceTabs = Array.from(sourceGroup.tabs);
        const destTabs = Array.from(destGroup.tabs);
        const [removed] = sourceTabs.splice(source.index, 1);
        destTabs.splice(destination.index, 0, removed);

        // Update local state immediately
        const updatedGroups = tabGroups.map(g => {
          if (g.id === sourceGroup.id) return { ...g, tabs: sourceTabs };
          if (g.id === destGroup.id) return { ...g, tabs: destTabs };
          return g;
        });
        setTabGroups(updatedGroups);

        await Promise.all([
          persistTabsForGroup(sourceGroup, sourceTabs),
          persistTabsForGroup(destGroup, destTabs),
        ]);
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      }
    } catch (error) {
      console.error("Failed to update tabs:", error);
      toast.error("Failed to update tab order");
    }
  };

  const resetTabLayout = async () => {
    try {
      // Delete all custom groups
      const allCustomGroups = await base44.entities.TabGroup.list();
      await Promise.all(
        allCustomGroups.map(g => base44.entities.TabGroup.delete(g.id))
      );
      queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      setTabGroups(TAB_GROUPS);
      toast.success('Tab layout reset to default');
    } catch (error) {
      console.error("Failed to reset layout:", error);
      toast.error("Failed to reset layout");
    }
  };

  const handleCreateTab = (groupId) => {
    setSelectedGroupForNewTab(groupId);
    setNewTabName("");
    setShowCreateTabDialog(true);
  };

  const handleSaveNewTab = async () => {
    if (!newTabName.trim() || !selectedGroupForNewTab) {
      toast.error("Tab name is required");
      return;
    }

    const tabId = `custom_${selectedGroupForNewTab}_${Date.now()}`;
    
    try {
      const dbGroups = await base44.entities.TabGroup.filter({ group_id: selectedGroupForNewTab });
      if (dbGroups.length > 0) {
        const updatedTabs = [
          ...dbGroups[0].tabs,
          { id: tabId, label: newTabName }
        ];
        await base44.entities.TabGroup.update(dbGroups[0].id, { tabs: updatedTabs });
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      }
      setShowCreateTabDialog(false);
      setNewTabName("");
      toast.success("Tab created successfully");
    } catch (error) {
      console.error("Failed to create tab:", error);
      toast.error("Failed to create tab");
    }
  };

  const handleRenameTab = async (tabId, newName) => {
    if (!newName.trim()) {
      toast.error("Tab name is required");
      return;
    }

    try {
      // Find which group contains this tab
      for (const group of customTabGroups) {
        const tabIndex = group.tabs.findIndex(t => t.id === tabId);
        if (tabIndex !== -1) {
          const updatedTabs = [...group.tabs];
          updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], label: newName };
          await base44.entities.TabGroup.update(group.id, { tabs: updatedTabs });
          queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
          break;
        }
      }
      setEditingTabId(null);
      setEditingTabName("");
      toast.success("Tab renamed successfully");
    } catch (error) {
      console.error("Failed to rename tab:", error);
      toast.error("Failed to rename tab");
    }
  };

  const handleDeleteTab = async (groupId, tabId) => {
    try {
      const dbGroups = await base44.entities.TabGroup.filter({ group_id: groupId });
      if (dbGroups.length > 0) {
        const updatedTabs = dbGroups[0].tabs.filter(tab => tab.id !== tabId);
        await base44.entities.TabGroup.update(dbGroups[0].id, { tabs: updatedTabs });
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      }
      toast.success("Tab deleted successfully");
    } catch (error) {
      console.error("Failed to delete tab:", error);
      toast.error("Failed to delete tab");
    }
  };

  const handleRenameGroup = async (groupId, newName) => {
    if (!newName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      const dbGroups = await base44.entities.TabGroup.filter({ group_id: groupId });
      if (dbGroups.length > 0) {
        await base44.entities.TabGroup.update(dbGroups[0].id, { label: newName });
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      }
      setEditingGroupId(null);
      setEditingGroupName("");
      toast.success("Group renamed successfully");
    } catch (error) {
      console.error("Failed to rename group:", error);
      toast.error("Failed to rename group");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (tabGroups.length <= 1) {
      toast.error("Cannot delete the last group");
      return;
    }

    try {
      const dbGroups = await base44.entities.TabGroup.filter({ group_id: groupId });
      if (dbGroups.length > 0) {
        await base44.entities.TabGroup.delete(dbGroups[0].id);
        queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      }
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    const groupId = `custom_group_${Date.now()}`;
    
    try {
      await base44.entities.TabGroup.create({
        group_id: groupId,
        label: newGroupName,
        color: newGroupColor,
        tabs: [],
        order: tabGroups.length
      });

      queryClient.invalidateQueries({ queryKey: ["customTabGroups"] });
      setShowCreateGroupDialog(false);
      setNewGroupName("");
      setNewGroupColor("blue");
      toast.success("Group created successfully");
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    }
  };

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => base44.entities.ClinicalNote.list().then(
      (notes) => notes.find((n) => n.id === noteId)
    ),
    enabled: !!noteId,
  });

  // Track current open note
  useEffect(() => {
    if (noteId) {
      localStorage.setItem('currentOpenNote', noteId);
    }
  }, [noteId]);

  const { data: templates = [] } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: () => base44.entities.NoteTemplate.list()
  });

  // Load custom tab groups from database
  const { data: customTabGroups = [] } = useQuery({
    queryKey: ["customTabGroups"],
    queryFn: async () => {
      const groups = await base44.entities.TabGroup.list();
      return groups.sort((a, b) => a.order - b.order);
    }
  });

  // Merge default and custom groups
  useEffect(() => {
    if (!customTabGroups) return;

    // Build a map of persisted tab layouts (keyed by group_id)
    const persistedMap = {};
    customTabGroups.forEach(g => {
      persistedMap[g.group_id] = g;
    });

    // For each default group, use persisted tab order if available
    const defaultGroupsMerged = TAB_GROUPS.map(g => {
      const persisted = persistedMap[g.id];
      if (persisted) {
        const tabById = Object.fromEntries(g.tabs.map(t => [t.id, t]));
        const reorderedTabs = persisted.tabs.map(t => ({
          ...tabById[t.id],
          ...t,
          icon: tabById[t.id]?.icon || Plus,
          label: tabById[t.id]?.label || t.label,
        }));
        const persistedIds = new Set(persisted.tabs.map(t => t.id));
        const extraTabs = g.tabs.filter(t => !persistedIds.has(t.id));
        return { ...g, tabs: [...reorderedTabs, ...extraTabs] };
      }
      return g;
    });

    // Append purely custom groups
    const defaultIds = new Set(TAB_GROUPS.map(g => g.id));
    const customOnlyGroups = customTabGroups
      .filter(g => !defaultIds.has(g.group_id))
      .map(g => ({
        id: g.group_id,
        label: g.label,
        color: g.color,
        tabs: g.tabs.map(t => ({ ...t, icon: Plus }))
      }));

    const merged = [...defaultGroupsMerged, ...customOnlyGroups];
    // Only update if something actually changed (by JSON comparison)
    setTabGroups(prev => {
      const prevStr = JSON.stringify(prev.map(g => ({ id: g.id, label: g.label, tabs: g.tabs.map(t => t.id) })));
      const nextStr = JSON.stringify(merged.map(g => ({ id: g.id, label: g.label, tabs: g.tabs.map(t => t.id) })));
      return prevStr === nextStr ? prev : merged;
    });
  }, [customTabGroups]);

  // Auto-save functionality
  const { isSaving } = useAutoSave({
    data: noteData || note,
    entityName: "ClinicalNote",
    entityId: noteId,
    onSave: async (data) => {
      if (noteId) {
        await base44.entities.ClinicalNote.update(noteId, data);
        toast.success("Auto-saved at " + format(new Date(), "h:mm:ss a"));
      }
    },
    interval: 30000,
    enabled: true,
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ClinicalNote.update(noteId, { status: "finalized" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      // Wait for query to refetch updated note
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onError: (error) => {
      console.error("Finalization failed:", error);
      toast.error("Failed to finalize note");
    }
  });

  const linkGuidelinesToNote = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) return;
    setLinkingGuidelines(true);
    
    try {
      const response = await base44.functions.invoke('autoLinkGuidelines', {
        noteId: noteId
      });

      if (response.data.linked_guidelines?.length > 0) {
        setShowGuidelinePrompt(true);
        queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      }
    } catch (error) {
      console.error("Failed to link guidelines:", error);
    } finally {
      setLinkingGuidelines(false);
    }
  };

  // Auto-generate summary, guidelines, and ICD-10 suggestions for all notes
  useEffect(() => {
    // Listen for the custom event to add ER protocol to plan
    const handleAddERProtocol = async (event) => {
      const protocolText = event.detail;
      const updatedPlan = (note.plan || "") + protocolText;
      await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      toast.success("ER protocol added to treatment plan");
    };

    window.addEventListener('addERProtocolToPlan', handleAddERProtocol);

    return () => {
      window.removeEventListener('addERProtocolToPlan', handleAddERProtocol);
    };
  }, [note, noteId, queryClient]);

  useEffect(() => {
    if (note) {
      if (!patientSummary && !generatingSummary) {
        generateSummary();
      }
      if (!icd10Suggestions.length && !loadingIcd10) {
        generateICD10Suggestions();
      }
      if (!guidelineRecommendations.length && !loadingGuidelines) {
        fetchGuidelineRecommendations();
      }
      if (!drugInteractions.length && !loadingInteractions && note.medications?.length > 0) {
        analyzeDrugInteractions();
      }
      if (!followUpTests.length && !loadingFollowUp && note.diagnoses?.length > 0) {
        suggestFollowUpTests();
      }
      if (!differentialDiagnosis.length && !loadingDifferential && note.chief_complaint) {
        generateDifferentialDiagnosis();
      }
      if (!patientEducation && !generatingEducation && note.diagnoses?.length > 0 && note.status === "finalized") {
        generatePatientEducation();
      }
    }
  }, [note?.id, note?.status, patientSummary, generatingSummary, icd10Suggestions.length, loadingIcd10, guidelineRecommendations.length, loadingGuidelines, drugInteractions.length, loadingInteractions, followUpTests.length, loadingFollowUp, differentialDiagnosis.length, loadingDifferential, patientEducation, generatingEducation]);

  const generateSummary = async () => {
    if (!note) return;
    setGeneratingSummary(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a concise patient summary from this clinical note. Focus on actionable information for continuity of care.

Patient: ${note.patient_name}
Date: ${note.date_of_visit}

Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${note.assessment || "N/A"}
Plan: ${note.plan || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Medications: ${note.medications?.join(", ") || "N/A"}

Provide:
1. Overview - 2-3 sentence summary of visit
2. Key Diagnoses - List of primary diagnoses
3. Current Medications - All medications with dosages
4. Follow-up Plans - Next steps, appointments, tests ordered
5. Critical Alerts - Any urgent items requiring attention (empty array if none)`,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          key_diagnoses: { type: "array", items: { type: "string" } },
          current_medications: { type: "array", items: { type: "string" } },
          follow_up_plans: { type: "array", items: { type: "string" } },
          critical_alerts: { type: "array", items: { type: "string" } },
        },
      },
      });

      setPatientSummary(result);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const fetchGuidelineRecommendations = async () => {
    if (!note) return;
    setLoadingGuidelines(true);
    try {
      const conditions = [];
      if (Array.isArray(note.diagnoses) && note.diagnoses.length > 0) {
        const validDiagnoses = note.diagnoses.filter(d => d && typeof d === 'string' && d.trim().length > 1);
        conditions.push(...validDiagnoses.slice(0, 3));
      }

      if (conditions.length === 0) {
        console.warn("No diagnoses available for guidelines");
        setLoadingGuidelines(false);
        return;
      }

      const recommendations = await Promise.all(
        conditions.slice(0, 2).map(async (condition) => {
          const cleanCondition = condition.replace(/\(.*?\)/g, "").trim();
          try {
            const result = await base44.integrations.Core.InvokeLLM({
              prompt: `Provide comprehensive evidence-based guideline treatment plan for: ${cleanCondition}

Include detailed, actionable recommendations with:

1. DIAGNOSTIC WORKUP
   - Initial laboratory tests (with normal ranges and clinical significance)
   - Imaging studies (with indications)
   - Specialist referrals if needed

2. MEDICATIONS
   - First-line medications with specific dosing (dose, frequency, route)
   - Alternative medications with dosing
   - Duration of therapy
   - Monitoring requirements for each medication

3. KEY RECOMMENDATIONS
   - Provide 4-6 concise, actionable recommendations
   - Include lifestyle modifications, patient education, and follow-up guidance
   - Write as clear bullet points WITHOUT any inline citations, reference numbers, or bracketed numbers
   - Make each recommendation specific and immediately actionable

4. MONITORING & FOLLOW-UP
   - Follow-up timing
   - What to monitor and when
   - Red flags requiring urgent evaluation

Keep recommendations specific, actionable, and evidence-based.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  diagnostic_workup: { 
                    type: "array", 
                    items: { 
                      type: "object",
                      properties: {
                        test: { type: "string" },
                        indication: { type: "string" },
                        timing: { type: "string" }
                      }
                    }
                  },
                  medications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        dosing: { type: "string" },
                        indication: { type: "string" },
                        duration: { type: "string" },
                        monitoring: { type: "string" }
                      }
                    }
                  },
                  key_recommendations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Concise, actionable recommendations as bullet points without any inline citations or reference numbers"
                  },
                  followup: {
                    type: "object",
                    properties: {
                      timing: { type: "string" },
                      parameters: { type: "array", items: { type: "string" } },
                      red_flags: { type: "array", items: { type: "string" } }
                    }
                  },
                  sources: { type: "array", items: { type: "string" } }
                }
              }
            });

            return { 
              condition: cleanCondition, 
              guideline_id: `guideline_${Date.now()}_${Math.random()}`,
              ...result 
            };
          } catch (err) {
            console.error(`Failed to fetch guideline for ${cleanCondition}:`, err);
            return null;
          }
        })
      );

      const validRecommendations = recommendations.filter(r => r !== null);
      setGuidelineRecommendations(validRecommendations);
      
      if (validRecommendations.length === 0) {
        console.warn("No valid guideline recommendations returned");
      }
    } catch (error) {
      console.error("Failed to fetch guidelines:", error);
      toast.error("Failed to fetch guidelines");
    } finally {
      setLoadingGuidelines(false);
    }
  };

  const analyzeDrugInteractions = async () => {
    if (!note?.medications || note.medications.length === 0) return;
    setLoadingInteractions(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze potential drug-drug interactions in this medication list. For each significant interaction, provide severity, mechanism, and clinical recommendation.

  MEDICATIONS:
  ${note.medications.join('\n')}

  Provide results as a JSON array with objects containing: drug_pair, severity (mild/moderate/severe), mechanism, recommendation.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug_pair: { type: "string" },
                  severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                  mechanism: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setDrugInteractions(result.interactions || []);
    } catch (error) {
      console.error("Failed to analyze drug interactions:", error);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const suggestFollowUpTests = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) return;
    setLoadingFollowUp(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these diagnoses, suggest relevant follow-up tests, labs, imaging, or specialist consultations needed for comprehensive evaluation and management.

  DIAGNOSES:
  ${note.diagnoses.join('\n')}

  CURRENT ASSESSMENT:
  ${note.assessment || "N/A"}

  Provide results with: test_name, type (lab/imaging/consult), timing, clinical_rationale.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            follow_ups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  type: { type: "string", enum: ["lab", "imaging", "consult", "other"] },
                  timing: { type: "string" },
                  clinical_rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setFollowUpTests(result.follow_ups || []);
    } catch (error) {
      console.error("Failed to suggest follow-up tests:", error);
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const generatePatientEducation = async () => {
    if (!note?.diagnoses || note.diagnoses.length === 0) {
      toast.error("No diagnoses available for patient education");
      return;
    }

    setGeneratingEducation(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create comprehensive, easy-to-understand patient education materials based on this clinical note. Use simple, clear language that a non-medical person can understand. Avoid medical jargon and use everyday terms.

    PATIENT CONTEXT:
    Chief Complaint: ${note.chief_complaint || "N/A"}

    DIAGNOSES:
    ${note.diagnoses.join('\n')}

    TREATMENT PLAN:
    ${note.plan || "N/A"}

    MEDICATIONS:
    ${note.medications?.join('\n') || "None prescribed"}

    Create sections for each diagnosis with:
    1. WHAT IS IT: Simple explanation in 2-3 sentences using everyday language (e.g., "Your heart" instead of "cardiac", "sugar levels" instead of "glucose")
    2. SYMPTOMS TO WATCH FOR: 3-5 specific signs to monitor at home
    3. WHAT YOU CAN DO: 4-6 practical self-care steps including lifestyle changes, diet, exercise, and medication adherence
    4. YOUR MEDICATIONS: If medications are prescribed for this condition, explain what they do in simple terms
    5. WHEN TO SEEK HELP: 3-5 red flag symptoms requiring immediate medical attention
    6. QUESTIONS FOR YOUR DOCTOR: 3-4 suggested questions to discuss at follow-up visits
    7. FOLLOW-UP: When and why to return for care

    Keep each explanation under 100 words. Use analogies and examples. Write at a 6th-grade reading level.`,
        response_json_schema: {
          type: "object",
          properties: {
            education_materials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  what_is_it: { type: "string" },
                  symptoms_to_watch: { type: "array", items: { type: "string" } },
                  self_care: { type: "array", items: { type: "string" } },
                  medications_explained: { type: "array", items: { type: "string" } },
                  when_to_seek_help: { type: "array", items: { type: "string" } },
                  questions_for_doctor: { type: "array", items: { type: "string" } },
                  follow_up: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPatientEducation(result.education_materials || []);
      toast.success("Patient education generated");
    } catch (error) {
      console.error("Failed to generate patient education:", error);
      toast.error("Failed to generate patient education");
    } finally {
      setGeneratingEducation(false);
    }
  };

  const downloadPatientEducation = (format) => {
    if (!patientEducation || patientEducation.length === 0) return;

    let content = `PATIENT EDUCATION MATERIALS\n`;
    content += `Patient: ${note.patient_name}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `${"=".repeat(60)}\n\n`;

    patientEducation.forEach((material, idx) => {
      content += `${idx + 1}. ${material.diagnosis.toUpperCase()}\n`;
      content += `${"-".repeat(60)}\n\n`;

      content += `WHAT IS IT?\n${material.what_is_it}\n\n`;

      if (material.symptoms_to_watch && material.symptoms_to_watch.length > 0) {
        content += `SYMPTOMS TO WATCH FOR:\n`;
        material.symptoms_to_watch.forEach(s => {
          content += `• ${s}\n`;
        });
        content += `\n`;
      }

      if (material.self_care && material.self_care.length > 0) {
        content += `WHAT YOU CAN DO:\n`;
        material.self_care.forEach(s => {
          content += `• ${s}\n`;
        });
        content += `\n`;
      }

      if (material.when_to_seek_help && material.when_to_seek_help.length > 0) {
        content += `WHEN TO SEEK HELP:\n`;
        material.when_to_seek_help.forEach(h => {
          content += `⚠️ ${h}\n`;
        });
        content += `\n`;
      }

      if (material.questions_for_doctor && material.questions_for_doctor.length > 0) {
        content += `QUESTIONS FOR YOUR DOCTOR:\n`;
        material.questions_for_doctor.forEach(q => {
          content += `? ${q}\n`;
        });
        content += `\n`;
      }

      content += `\n`;
    });

    const blob = new Blob([content], { type: format === 'pdf' ? 'text/plain' : 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.patient_name}_PatientEducation_${new Date().toISOString().split("T")[0]}.${format === 'pdf' ? 'pdf' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
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

  const generateICD10Suggestions = async () => {
    if (!note) return;
    setLoadingIcd10(true);

    try {
      const diagnosesList = note.diagnoses?.join(", ") || "";
      const assessment = note.assessment || "";

      if (!diagnosesList && !assessment) {
        console.warn("No diagnoses or assessment found for ICD-10 suggestions");
        setLoadingIcd10(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert medical coder. Analyze the following clinical information and suggest the most appropriate ICD-10 codes. Rank codes by specificity and clinical relevance.

PATIENT CONTEXT:
Chief Complaint: ${note.chief_complaint || "N/A"}
Assessment: ${assessment}
History of Present Illness: ${note.history_of_present_illness || "N/A"}

DIAGNOSES TO CODE:
${diagnosesList}

CODING STANDARDS:
- Use the most specific 5-7 character ICD-10 codes available
- Include laterality (left/right) when relevant
- Include severity or stage when documented
- Consider combination codes that capture the complete clinical picture
- Return 5-8 ranked codes with highest confidence first

For each code, provide:
1. The specific ICD-10 code (e.g., I10, E11.9231)
2. The complete description
3. Which diagnosis this code addresses
4. Your confidence level (high, moderate, low) based on documentation completeness`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  diagnosis: { type: "string" },
                  confidence: { type: "string", enum: ["high", "moderate", "low"] }
                }
              }
            }
          }
        }
      });

      setIcd10Suggestions(result.suggestions || []);
    } catch (error) {
      console.error("Failed to generate ICD-10 suggestions:", error);
    } finally {
      setLoadingIcd10(false);
    }
  };

  const extractStructuredData = async () => {
    if (!note?.raw_note) return;
    setExtractingData(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract key medical information from this clinical note. Be thorough and accurate.

CLINICAL NOTE:
${note.raw_note}

Extract and return the following fields:
1. chief_complaint: The primary reason for visit (string)
2. diagnoses: ALL diagnoses, suspected conditions, and clinical impressions from the note (array of strings). If chief complaint or assessment suggests a condition, include it.
3. medications: All medications mentioned with dosages and frequency (array of strings)
4. allergies: All drug and environmental allergies (array of strings)
5. medical_history: Significant past medical history items (string)
6. review_of_systems: Key ROS findings (string)
7. physical_exam: Important physical exam findings (string)

CRITICAL: The diagnoses field MUST always contain at least one entry. If no diagnosis is explicitly stated, infer from the chief complaint and clinical presentation.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint: { type: "string" },
            diagnoses: { 
              type: "array", 
              items: { type: "string" },
              description: "ALL diagnoses, suspected conditions, and impressions" 
            },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            medical_history: { type: "string" },
            review_of_systems: { type: "string" },
            physical_exam: { type: "string" }
          },
          required: ["chief_complaint", "diagnoses"]
        }
      });

      console.log("Extracted data:", result);
      console.log("Diagnoses from LLM:", result.diagnoses, "Type:", Array.isArray(result.diagnoses));

      // Update note with extracted data
      const updateData = {
        status: "finalized"
      };

      // Filter diagnoses to only include ICD-10 coded ones (format: CODE - Description)
            if (result.diagnoses) {
        const diagnosisArray = Array.isArray(result.diagnoses) ? result.diagnoses : [result.diagnoses];
        const filteredDiagnoses = diagnosisArray.filter(d => 
          d && typeof d === 'string' && /^[A-Z0-9]{1,}.*-/.test(d.trim())
        );
        if (filteredDiagnoses.length > 0) {
          updateData.diagnoses = filteredDiagnoses;
        }
      }
      if (result.chief_complaint) updateData.chief_complaint = result.chief_complaint;
      if (result.medications?.length > 0) updateData.medications = result.medications;
      if (result.allergies?.length > 0) updateData.allergies = result.allergies;
      if (result.medical_history) updateData.medical_history = result.medical_history;
      if (result.review_of_systems) updateData.review_of_systems = result.review_of_systems;
      if (result.physical_exam) updateData.physical_exam = result.physical_exam;

      console.log("Updating note with:", updateData);
      await base44.entities.ClinicalNote.update(noteId, updateData);
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      toast.success("Note processed and finalized");
    } catch (error) {
      console.error("Failed to extract data:", error);
      toast.error("Failed to extract data from note");
    } finally {
      setExtractingData(false);
    }
  };

  const downloadResultsAnalysis = (format) => {
    // This would ideally pull imaging and labs data, but since they're in separate components,
    // we'll provide a template for the user to add their specific data
    const content = `RESULT ANALYSIS REPORT
  Patient: ${note.patient_name}
  Date: ${note.date_of_visit ? format(new Date(note.date_of_visit), "MMMM d, yyyy") : "N/A"}
  ${note.patient_id ? `MRN: ${note.patient_id}` : ""}

  IMAGING ANALYSIS
  [Imaging results will be populated here based on uploaded files]

  LABORATORY ANALYSIS
  [Lab results will be populated here based on uploaded data]

  Generated: ${new Date().toLocaleString()}
    `.trim();

    if (format === 'pdf') {
      // For PDF, we'd need jsPDF - using text export for now
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_ResultsAnalysis_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_ResultsAnalysis_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  };

  const downloadSummary = () => {
    if (!patientSummary) return;

    const content = `
PATIENT SUMMARY
Patient: ${note.patient_name}
Date: ${note.date_of_visit ? format(new Date(note.date_of_visit), "MMMM d, yyyy") : "N/A"}
${note.patient_id ? `MRN: ${note.patient_id}` : ""}

OVERVIEW
${patientSummary.overview}

KEY DIAGNOSES
${patientSummary.key_diagnoses?.map(d => `• ${d}`).join("\n") || "None"}

CURRENT MEDICATIONS
${patientSummary.current_medications?.map(m => `• ${m}`).join("\n") || "None"}

FOLLOW-UP PLANS
${patientSummary.follow_up_plans?.map(p => `• ${p}`).join("\n") || "None"}

${patientSummary.critical_alerts && patientSummary.critical_alerts.length > 0 ? `CRITICAL ALERTS\n${patientSummary.critical_alerts.map(a => `⚠️ ${a}`).join("\n")}` : ""}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.patient_name}_Summary_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportNote = async (exportFormat) => {
    setExportingFormat(exportFormat);
    try {
      const response = await base44.functions.invoke('exportClinicalNote', {
        noteId: note.id,
        format: exportFormat
      });

      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.patient_name}_${note.date_of_visit || 'Note'}.${exportFormat === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(`Failed to export as ${exportFormat}:`, error);
      alert(`Failed to export note as ${exportFormat}`);
    } finally {
      setExportingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Note not found</h2>
        <Link to={createPageUrl("NotesLibrary")} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to Notes Library
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Nav */}
        <Link
        to={createPageUrl("NotesLibrary")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Notes
      </Link>

      {/* Header Card */}
      {/* Guideline Review Prompt */}
      {showGuidelinePrompt && note?.linked_guidelines && (
        <GuidelineReviewPrompt
          linkedGuidelines={note.linked_guidelines}
          onIncorporate={async (guideline) => {
            // Update guideline as incorporated
            const updatedGuidelines = note.linked_guidelines.map(g =>
              g.guideline_query_id === guideline.guideline_query_id
                ? { ...g, incorporated: true, adherence_notes: "Incorporated into plan" }
                : g
            );
            await base44.entities.ClinicalNote.update(noteId, {
              linked_guidelines: updatedGuidelines
            });
            queryClient.invalidateQueries({ queryKey: ["note", noteId] });
          }}
          onDismiss={() => setShowGuidelinePrompt(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 px-5 py-4"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: patient name + meta */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={note.patient_name === "New Patient" ? (note.chief_complaint || "New Patient") : note.patient_name}
              onChange={(e) => {
                queryClient.setQueryData(["note", noteId], (old) => ({
                  ...old,
                  patient_name: e.target.value
                }));
              }}
              onBlur={async (e) => {
                await base44.entities.ClinicalNote.update(noteId, { patient_name: e.target.value });
                setLastSaved(new Date().toISOString());
                toast.success("Note saved at " + format(new Date(), "h:mm:ss a"));
              }}
              className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors w-full"
            />
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {note.time_of_visit || format(new Date(), "h:mm a")}
              </span>
              {note.patient_id && (
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {note.patient_id}</span>
              )}
            </div>
            {note.chief_complaint && (
              <p className="mt-2 text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <span className="font-semibold text-blue-800">CC:</span> {note.chief_complaint}
              </p>
            )}
          </div>


        </div>
      </motion.div>



      {/* Tabbed Interface */}
       <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden pb-16"
       >
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
               {/* ── Bottom Navigation Bar ── */}
               <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 flex flex-col">
                 {/* Row 1: Sub-tabs for the active group (scrollable) */}
                 {(() => {
                   const activeGroup = tabGroups.find(g => g.tabs.some(t => t.id === activeTab));
                   const activeTabBg = {
                     blue: 'bg-blue-600 text-white',
                     purple: 'bg-purple-600 text-white',
                     emerald: 'bg-emerald-600 text-white',
                     rose: 'bg-rose-600 text-white',
                     amber: 'bg-amber-600 text-white',
                   };
                   const borderColors = {
                     blue: 'border-blue-200', purple: 'border-purple-200',
                     emerald: 'border-emerald-200', rose: 'border-rose-200', amber: 'border-amber-200',
                   };
                   if (!activeGroup) return null;
                   return (
                     <TabsList className="flex flex-row items-center justify-center bg-slate-50 border-b border-slate-200 py-1.5 gap-1 w-full flex-shrink-0 h-auto rounded-none p-0">
                       {activeGroup.tabs.map((tab) => {
                         const isActive = activeTab === tab.id;
                         return (
                           <TabsTrigger
                             key={tab.id}
                             value={tab.id}
                             className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-md border transition-all whitespace-nowrap ${
                               isActive
                                 ? `${activeTabBg[activeGroup.color]} border-transparent shadow-sm`
                                 : `text-slate-600 border-transparent hover:bg-white hover:text-slate-900 hover:border-slate-200 bg-transparent`
                             }`}
                           >
                             {tab.label}
                           </TabsTrigger>
                         );
                       })}
                       {customizing && (
                         <button onClick={() => handleCreateTab(activeGroup.id)} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 rounded-md hover:bg-white transition-colors whitespace-nowrap">
                           <Plus className="w-3 h-3" /><span>Add tab</span>
                         </button>
                       )}
                     </TabsList>
                   );
                 })()}

                 {/* Row 2: Group tabs — main navigation */}
                 <div className="flex items-center bg-white px-2 justify-center gap-4">
                   {/* Customize button on left */}
                   <div className="flex items-center gap-1 flex-shrink-0 py-1" style={{ pointerEvents: 'auto', zIndex: 10, position: 'relative' }}>
                     <button
                       type="button"
                       onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setCustomizing(c => !c); }}
                       title={customizing ? "Done" : "Customize"}
                       className={`p-1.5 rounded-md transition-colors cursor-pointer ${customizing ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                     >
                       <Settings className="w-3.5 h-3.5" />
                     </button>
                     {customizing && (
                       <button
                         type="button"
                         onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); resetTabLayout(); }}
                         title="Reset"
                         className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                       >
                         <RotateCcw className="w-3.5 h-3.5" />
                       </button>
                     )}
                   </div>

                   {/* Centered group tabs */}
                   <div className="flex items-center overflow-x-auto scrollbar-hide">
                     {tabGroups.map((group) => {
                       const accentDot = { blue:'bg-blue-500', purple:'bg-purple-500', emerald:'bg-emerald-500', rose:'bg-rose-500', amber:'bg-amber-500' };
                       const activeBorder = { blue:'border-blue-500', purple:'border-purple-500', emerald:'border-emerald-500', rose:'border-rose-500', amber:'border-amber-500' };
                       const activeText = { blue:'text-blue-600', purple:'text-purple-600', emerald:'text-emerald-600', rose:'text-rose-600', amber:'text-amber-600' };
                       const hasActive = group.tabs.some(t => t.id === activeTab);
                       const firstTabId = group.tabs[0]?.id;
                       return (
                         <button
                           key={group.id}
                           onClick={() => firstTabId && setActiveTab(firstTabId)}
                           className={`flex flex-col items-center gap-0.5 px-4 py-2 border-t-2 transition-all whitespace-nowrap flex-shrink-0 ${
                             hasActive
                               ? `${activeBorder[group.color]} ${activeText[group.color]}`
                               : 'border-transparent text-slate-500 hover:text-slate-700'
                           }`}
                         >
                           <div className={`w-2 h-2 rounded-full ${accentDot[group.color]}`} />
                           <span className={`text-xs font-semibold`}>{group.label}</span>
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
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Tab Name</label>
                           <Input autoFocus value={newTabName} onChange={(e) => setNewTabName(e.target.value)} onKeyDown={(e) => { if (e.key==='Enter') handleSaveNewTab(); if (e.key==='Escape') setShowCreateTabDialog(false); }} placeholder="Enter tab name..." className="w-full" />
                         </div>
                         <div className="flex gap-3 justify-end">
                           <Button variant="outline" onClick={() => setShowCreateTabDialog(false)}>Cancel</Button>
                           <Button onClick={handleSaveNewTab} className="bg-blue-600 hover:bg-blue-700 text-white">Create Tab</Button>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {showCreateGroupDialog && (
                   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                       <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Group</h3>
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Group Name</label>
                           <Input autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => { if (e.key==='Enter') handleCreateGroup(); if (e.key==='Escape') setShowCreateGroupDialog(false); }} placeholder="Enter group name..." className="w-full" />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                           <div className="flex gap-2">
                             {['blue','purple','emerald','rose','amber'].map(color => (
                               <button key={color} onClick={() => setNewGroupColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all ${newGroupColor===color ? 'border-slate-900 scale-110' : 'border-transparent'} ${ color==='blue' ? 'bg-blue-500' : color==='purple' ? 'bg-purple-500' : color==='emerald' ? 'bg-emerald-500' : color==='rose' ? 'bg-rose-500' : 'bg-amber-500' }`} />
                             ))}
                           </div>
                         </div>
                         <div className="flex gap-3 justify-end">
                           <Button variant="outline" onClick={() => { setShowCreateGroupDialog(false); setNewGroupName(""); setNewGroupColor("blue"); }}>Cancel</Button>
                           <Button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700 text-white">Create Group</Button>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

                        <div className="flex-1 overflow-hidden min-h-0">

                        {/* Subjective Tab */}
                        <TabsContent value="patient_intake" className="overflow-y-auto bg-slate-50">
                          <div className="max-w-4xl mx-auto px-6 py-5 space-y-4">

                            {/* Page Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-lg font-bold text-slate-900">Subjective</h2>
                                <p className="text-xs text-slate-500">Chief complaint, history, and AI documentation</p>
                              </div>
                              <Button
                                onClick={async () => {
                                  if (!note.raw_note && !note.chief_complaint) { toast.error("Please enter some patient data first"); return; }
                                  setAnalyzingRawData(true);
                                  try {
                                    const result = await base44.integrations.Core.InvokeLLM({
                                      prompt: `Analyze this raw patient encounter data and extract structured clinical information:\n\nRAW PATIENT DATA:\n${note.raw_note || note.chief_complaint}\n\nExtract: chief_complaint, history_of_present_illness (OLDCARTS), review_of_systems, initial_assessment, suggested_diagnoses, recommended_tests.`,
                                      add_context_from_internet: false,
                                      response_json_schema: {
                                        type: "object",
                                        properties: {
                                          chief_complaint: { type: "string" },
                                          history_of_present_illness: { type: "string" },
                                          review_of_systems: { type: "string" },
                                          initial_assessment: { type: "string" },
                                          suggested_diagnoses: { type: "array", items: { type: "string" } },
                                          recommended_tests: { type: "array", items: { type: "string" } }
                                        }
                                      }
                                    });
                                    await base44.entities.ClinicalNote.update(noteId, {
                                      chief_complaint: result.chief_complaint,
                                      history_of_present_illness: result.history_of_present_illness,
                                      review_of_systems: result.review_of_systems,
                                      assessment: result.initial_assessment
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                    toast.success("AI analysis complete — fields populated");
                                  } catch (error) {
                                    toast.error("Failed to analyze patient data");
                                  } finally {
                                    setAnalyzingRawData(false);
                                  }
                                }}
                                disabled={analyzingRawData}
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
                              >
                                {analyzingRawData ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Auto-Fill</>}
                              </Button>
                            </div>

                            {/* Chief Complaint — compact single-line */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                                  <span className="text-sm font-semibold">Chief Complaint</span>
                                  <span className="text-blue-200 text-xs">· primary reason for visit</span>
                                </div>
                                <InlineSectionAI type="chief_complaint" note={note} onApply={async (val) => { await base44.entities.ClinicalNote.update(noteId, { chief_complaint: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
                              </div>
                              <div className="px-4 py-3">
                                <input
                                  type="text"
                                  value={note.chief_complaint || ""}
                                  onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, chief_complaint: e.target.value }))}
                                  onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { chief_complaint: e.target.value }); toast.success("Saved"); }}
                                  placeholder="e.g., Chest pain for 2 hours..."
                                  className="w-full text-sm text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:ring-0 bg-transparent"
                                  maxLength={200}
                                />
                              </div>
                            </div>

                            {/* AI Documentation Assistant */}
                            <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                                <span className="text-sm font-semibold">AI Documentation Assistant</span>
                              </div>
                              <div className="p-4">
                                <AIDocumentationAssistant note={note} onUpdateNote={async (updates) => {
                                  await base44.entities.ClinicalNote.update(noteId, updates);
                                  queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                }} />
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                              <div className="flex gap-2">
                                <TabDataPreview tabId="patient_intake" note={note} />
                                <ClinicalNotePreviewButton note={note} />
                              </div>
                              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                Next <ArrowLeft className="w-4 h-4 rotate-180" />
                              </Button>
                            </div>
                          </div>
                        </TabsContent>

           {/* Vital Signs Tab */}
           <TabsContent value="vital_signs" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
             <div className="max-w-4xl mx-auto space-y-8">
               {/* Header */}
               <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
                   <Activity className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-900 mb-2">Vital Signs</h2>
                 <p className="text-slate-600 max-w-2xl mx-auto">Record patient vital signs and measurements</p>
               </div>

               {/* Vital Signs Input */}
               <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Activity className="w-6 h-6" />
                     Vital Signs
                   </h3>
                   <p className="text-emerald-100 text-sm mt-1">Temperature, BP, HR, RR, O2 Sat, Height, Weight</p>
                 </div>
                 <div className="p-6">
                   <VitalSignsInput
                     vitalSigns={note.vital_signs || {}}
                     onChange={async (newVitalSigns) => {
                       await base44.entities.ClinicalNote.update(noteId, { vital_signs: newVitalSigns });
                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     }}
                   />
                 </div>
               </div>
             </div>

             {/* Next Button */}
             <div className="flex justify-between items-center pt-4 border-t border-slate-200">
               <div className="flex gap-2">
                 <TabDataPreview tabId="vital_signs" note={note} />
                 <ClinicalNotePreviewButton note={note} />
               </div>
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
           </TabsContent>

           {/* Differential Diagnosis Tab */}
           <TabsContent value="differential" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
             <div className="max-w-5xl mx-auto space-y-8">
               {/* Header */}
               <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 mb-4 shadow-lg">
                   <Code className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-900 mb-2">Differential Diagnosis</h2>
                 <p className="text-slate-600 max-w-2xl mx-auto">AI-powered differential diagnosis generator</p>
               </div>

               {/* Clinical Context */}
               {note.chief_complaint && (
                 <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-blue-600" />
                     Clinical Context
                   </h3>
                   <div className="grid md:grid-cols-2 gap-4">
                     <div className="bg-white rounded-lg p-4 border border-blue-200">
                       <p className="text-xs font-semibold text-blue-900 mb-2">Chief Complaint</p>
                       <p className="text-sm text-slate-700">{note.chief_complaint}</p>
                     </div>
                     {note.vital_signs && Object.keys(note.vital_signs).length > 0 && (
                       <div className="bg-white rounded-lg p-4 border border-blue-200">
                         <p className="text-xs font-semibold text-blue-900 mb-2">Vital Signs</p>
                         <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                           {note.vital_signs.temperature?.value && (
                             <div>Temp: {note.vital_signs.temperature.value}°{note.vital_signs.temperature.unit}</div>
                           )}
                           {note.vital_signs.heart_rate?.value && (
                             <div>HR: {note.vital_signs.heart_rate.value} bpm</div>
                           )}
                           {note.vital_signs.blood_pressure?.systolic && (
                             <div>BP: {note.vital_signs.blood_pressure.systolic}/{note.vital_signs.blood_pressure.diastolic}</div>
                           )}
                           {note.vital_signs.oxygen_saturation?.value && (
                             <div>SpO2: {note.vital_signs.oxygen_saturation.value}%</div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Generate Button */}
               <div className="bg-white rounded-xl border-2 border-rose-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-5 text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Sparkles className="w-6 h-6" />
                     AI Differential Diagnosis Generator
                   </h3>
                   <p className="text-rose-100 text-sm mt-1">Analyze symptoms and generate ranked differential diagnoses</p>
                 </div>
                 <div className="p-6">
                   {!note.chief_complaint ? (
                     <div className="text-center py-12">
                       <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                       <p className="text-slate-600 font-medium">Chief Complaint Required</p>
                       <p className="text-sm text-slate-500 mt-1">Add a chief complaint to generate differential diagnoses</p>
                     </div>
                   ) : (
                     <Button
                       onClick={generateDifferentialDiagnosis}
                       disabled={loadingDifferential}
                       className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white gap-2 shadow-lg py-6 text-base"
                     >
                       {loadingDifferential ? (
                         <><Loader2 className="w-5 h-5 animate-spin" /> Generating Differential Diagnoses...</>
                       ) : (
                         <><Sparkles className="w-5 h-5" /> Generate Differential Diagnoses</>
                       )}
                       </Button>
                       )}
                       </div>
                       </div>

                       {/* Differential Diagnosis Results */}
                       {differentialDiagnosis.length > 0 && (
                   <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                     <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-rose-600" />
                       Differential Diagnoses
                     </h3>
                     <Badge className="bg-rose-100 text-rose-800">
                       {differentialDiagnosis.length} diagnoses
                     </Badge>
                   </div>
                   <div className="p-6 space-y-4">
                     {differentialDiagnosis.map((diff, idx) => (
                       <motion.div
                         key={idx}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-5">
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 text-white font-bold shadow-md">
                                 {idx + 1}
                               </div>
                               <h4 className="text-lg font-bold text-slate-900">{diff.diagnosis}</h4>
                             </div>
                             <div className="flex items-center gap-3 ml-11">
                               <span className="text-xs font-semibold text-rose-700">Likelihood:</span>
                               <div className="flex-1 max-w-xs h-3 bg-rose-100 rounded-full overflow-hidden border border-rose-200">
                                 <div 
                                   className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500" 
                                   style={{ width: `${(diff.likelihood_rank / 5) * 100}%` }} 
                                 />
                               </div>
                               <Badge className="bg-rose-600 text-white font-bold">
                                 {diff.likelihood_rank}/5
                               </Badge>
                             </div>
                           </div>
                         </div>

                         <div className="ml-11 space-y-3">
                           <div className="bg-white rounded-lg p-4 border border-rose-200">
                             <p className="text-xs font-bold text-slate-700 mb-2">Clinical Reasoning:</p>
                             <p className="text-sm text-slate-600 leading-relaxed">{diff.clinical_reasoning}</p>
                           </div>

                           {diff.red_flags_to_monitor?.length > 0 && (
                             <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                               <p className="text-xs font-bold text-red-900 mb-2 flex items-center gap-2">
                                 <AlertCircle className="w-4 h-4" />
                                 Red Flags to Monitor:
                               </p>
                               <ul className="space-y-1.5">
                                 {diff.red_flags_to_monitor.map((flag, i) => (
                                   <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                     <span className="text-red-600 mt-0.5 font-bold">⚠️</span>
                                     <span>{flag}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}

                           <Button
                             size="sm"
                             onClick={async () => {
                               try {
                                 const updatedDiagnoses = [...(note.diagnoses || []), diff.diagnosis];
                                 await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Diagnosis added");
                               } catch (error) {
                                 console.error("Failed to add diagnosis:", error);
                                 toast.error("Failed to add diagnosis");
                               }
                             }}
                             className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white mt-3"
                           >
                             <Plus className="w-3.5 h-3.5" /> Add Diagnosis
                           </Button>
                             </div>
                             </motion.div>
                             ))}

                             <Button
                             onClick={async () => {
                             try {
                             const diffText = differentialDiagnosis.map((diff, idx) => 
                             `${idx + 1}. ${diff.diagnosis} (Likelihood: ${diff.likelihood_rank}/5)\n   ${diff.clinical_reasoning}`
                             ).join('\n\n');

                             const updatedAssessment = (note.assessment || "") + "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDIFFERENTIAL DIAGNOSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" + diffText;
                             await base44.entities.ClinicalNote.update(noteId, { assessment: updatedAssessment });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             toast.success("Differential diagnosis added to assessment");
                             } catch (error) {
                             console.error("Failed to add differential:", error);
                             toast.error("Failed to add differential diagnosis");
                             }
                             }}
                             className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white gap-2 shadow-lg"
                             >
                             <Plus className="w-4 h-4" /> Add All to Assessment
                             </Button>
                             </div>
                             </div>
                             )}
                             </div>

                             {/* Next Button */}
                             <div className="flex justify-between items-center pt-4 border-t border-slate-200">
               <div className="flex gap-2">
                 <TabDataPreview tabId="differential" note={note} />
                 <ClinicalNotePreviewButton note={note} />
               </div>
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
             </TabsContent>

           {/* Labs & Imaging Tab */}
             <TabsContent value="labs_imaging" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-lg">
                     <Beaker className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Labs & Imaging</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">Upload and analyze laboratory results and imaging studies</p>
                 </div>

                 {/* Imaging Analysis */}
                 <ImagingAnalysis
                   noteId={noteId}
                   onAddToNote={async (imagingText, linkedFindings) => {
                     const updates = { assessment: (note.assessment || "") + imagingText };
                     if (linkedFindings && Object.keys(linkedFindings).length > 0) {
                       Object.entries(linkedFindings).forEach(([findingKey, sections]) => {
                         sections.forEach((sectionId) => {
                           const fieldMap = { assessment: "assessment", plan: "plan", history_of_present_illness: "history_of_present_illness" };
                           if (fieldMap[sectionId]) {
                             const sectionText = `\n\n[Imaging Finding] ${imagingText.split("\n")[0]}`;
                             updates[fieldMap[sectionId]] = (updates[fieldMap[sectionId]] || note[fieldMap[sectionId]] || "") + sectionText;
                           }
                         });
                       });
                     }
                     await base44.entities.ClinicalNote.update(noteId, updates);
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("Imaging summary added to clinical note");
                   }}
                 />

                 {/* Laboratory Analysis */}
                 <LabsAnalysis
                   noteId={noteId}
                   onAddToNote={async (labsText) => {
                     const updatedAssessment = (note.assessment || "") + labsText;
                     await base44.entities.ClinicalNote.update(noteId, { assessment: updatedAssessment });
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("Lab summary added to clinical note");
                   }}
                 />

                 {/* EKG Analysis */}
                 <EKGAnalysis
                   noteId={noteId}
                   onAddToNote={async (ekgText) => {
                     const updatedAssessment = (note.assessment || "") + ekgText;
                     await base44.entities.ClinicalNote.update(noteId, { assessment: updatedAssessment });
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("EKG analysis added to clinical note");
                   }}
                 />
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="labs_imaging" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

           {/* Treatment Plan Tab */}
             <TabsContent value="treatment_plan" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg">
                     <FileText className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Treatment Plan</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">Document comprehensive treatment approach and care plan</p>
                 </div>

                 {/* Treatment Plan Editor */}
                 <div className="bg-white rounded-xl border-2 border-amber-300 shadow-lg overflow-hidden">
                   <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
                     <div className="flex items-center justify-between">
                       <div>
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <FileText className="w-6 h-6" />
                           Treatment Plan
                         </h3>
                         <p className="text-amber-100 text-sm mt-1">Document detailed treatment approach, follow-up, and patient instructions</p>
                       </div>
                       <InlineSectionAI
                         type="plan"
                         note={note}
                         onApply={async (val) => {
                           await base44.entities.ClinicalNote.update(noteId, { plan: val });
                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         }}
                       />
                     </div>
                   </div>
                   <div className="p-6">
                     <Textarea
                       value={note.plan || ""}
                       onChange={(e) => {
                         queryClient.setQueryData(["note", noteId], (old) => ({
                           ...old,
                           plan: e.target.value
                         }));
                       }}
                       onBlur={async (e) => {
                         await base44.entities.ClinicalNote.update(noteId, { plan: e.target.value });
                         toast.success("Treatment plan saved");
                       }}
                       placeholder="Document treatment plan, follow-up instructions, patient education..."
                       className="min-h-[400px] text-base"
                     />
                   </div>
                 </div>

                 {/* Workflow Automation */}
                 <ClinicalWorkflowAutomation
                   note={note}
                   noteId={noteId}
                   onUpdateNote={async (updates) => {
                     await base44.entities.ClinicalNote.update(noteId, updates);
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                   }}
                 />
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="treatment_plan" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

           {/* Medical Decision Making Tab */}
             <TabsContent value="mdm" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 <MedicalDecisionMakingTab
                   note={note}
                   noteId={noteId}
                   onUpdateNote={async (updates) => {
                     await base44.entities.ClinicalNote.update(noteId, updates);
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                   }}
                 />
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="mdm" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

           {/* Medications Tab */}
             <TabsContent value="medications" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4 shadow-lg">
                     <Pill className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Medications</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">Manage prescribed medications and safety checks</p>
                 </div>

                 {/* AI Recommendations */}
                 <div className="bg-white rounded-xl border-2 border-blue-300 shadow-lg overflow-hidden">
                   <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 text-white">
                     <h3 className="font-bold text-lg flex items-center gap-2">
                       <Sparkles className="w-6 h-6" />
                       AI Medication Recommendations
                     </h3>
                     <p className="text-blue-100 text-sm mt-1">Get evidence-based medication suggestions</p>
                   </div>
                   <div className="p-6">
                     <MedicationRecommendations
                       note={note}
                       onAddMedications={async (meds) => {
                         const updatedMeds = [...(note.medications || []), ...meds];
                         await base44.entities.ClinicalNote.update(noteId, { medications: updatedMeds });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       }}
                     />
                   </div>
                 </div>

                 {/* Current Medications */}
                 <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                     <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Pill className="w-5 h-5 text-blue-600" />
                       Current Medications ({note.medications?.length || 0})
                     </h3>
                   </div>
                   <div className="p-6">
                     {note.medications && note.medications.length > 0 ? (
                       <div className="space-y-3">
                         {note.medications.map((med, idx) => (
                           <motion.div
                             key={idx}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
                           >
                             <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex-shrink-0 shadow-sm">
                               {idx + 1}
                             </div>
                             <div className="flex-1">
                               <p className="text-sm font-semibold text-slate-900">{med}</p>
                             </div>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={async () => {
                                 const updatedMeds = note.medications.filter((_, i) => i !== idx);
                                 await base44.entities.ClinicalNote.update(noteId, { medications: updatedMeds });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Medication removed");
                               }}
                               className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50"
                             >
                               <X className="w-4 h-4" />
                             </Button>
                           </motion.div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                         <Pill className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                         <p className="text-slate-600">No medications documented</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Drug Interactions */}
                 {note.medications && note.medications.length > 1 && (
                   <div className="bg-white rounded-xl border-2 border-orange-300 shadow-lg overflow-hidden">
                     <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white">
                       <h3 className="font-bold text-lg flex items-center gap-2">
                         <AlertCircle className="w-6 h-6" />
                         Drug Interaction Check
                       </h3>
                       <p className="text-orange-100 text-sm mt-1">AI-powered safety screening</p>
                     </div>
                     <div className="p-6">
                       {!loadingInteractions && drugInteractions.length === 0 && (
                         <Button
                           onClick={analyzeDrugInteractions}
                           className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white gap-2"
                         >
                           <Sparkles className="w-4 h-4" /> Check Drug Interactions
                         </Button>
                       )}
                       {loadingInteractions && (
                         <div className="flex items-center justify-center py-8">
                           <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                         </div>
                       )}
                       {drugInteractions.length > 0 && (
                         <div className="space-y-3">
                           {drugInteractions.map((interaction, idx) => (
                             <div key={idx} className={`rounded-lg border-2 p-4 ${
                               interaction.severity === 'severe' ? 'bg-red-50 border-red-300' :
                               interaction.severity === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
                               'bg-blue-50 border-blue-300'
                             }`}>
                               <div className="flex items-start justify-between mb-2">
                                 <p className="font-bold text-sm text-slate-900">{interaction.drug_pair}</p>
                                 <Badge className={interaction.severity === 'severe' ? 'bg-red-600 text-white' : interaction.severity === 'moderate' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}>
                                   {interaction.severity.toUpperCase()}
                                 </Badge>
                               </div>
                               <p className="text-xs text-slate-700 mt-2"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                               <p className="text-xs text-slate-700 mt-1"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="medications" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

           {/* Clinical Note Tab */}
             <TabsContent value="clinical_note" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 <NoteTypeAndTemplateSelector
                   note={note}
                   templates={templates}
                   selectedTemplate={selectedTemplate}
                   onNoteTypeChange={async (noteType) => {
                     await base44.entities.ClinicalNote.update(noteId, { note_type: noteType });
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("Note type updated");
                   }}
                   onTemplateSelect={setSelectedTemplate}
                   onApplyTemplate={async (templateId) => {
                     const selected = templates.find(t => t.id === templateId);
                     if (selected) {
                       try {
                         // Apply template sections to note
                         const updates = {
                           note_type: selected.note_type || note.note_type,
                         };

                         if (selected.sections) {
                           selected.sections.forEach(section => {
                             if (section.content_template) {
                               const fieldMap = {
                                 "chief_complaint": "chief_complaint",
                                 "hpi": "history_of_present_illness",
                                 "ros": "review_of_systems",
                                 "physical_exam": "physical_exam",
                                 "assessment": "assessment",
                                 "plan": "plan"
                               };
                               const field = fieldMap[section.id];
                               if (field) {
                                 updates[field] = section.content_template;
                               }
                             }
                           });
                         }

                         await base44.entities.ClinicalNote.update(noteId, updates);
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         toast.success("Template applied successfully");
                       } catch (error) {
                         console.error("Failed to apply template:", error);
                         toast.error("Failed to apply template");
                       }
                     }
                   }}
                 />

                 <ClinicalNoteView
                   note={note}
                   onUpdate={async (field, value) => {
                     await base44.entities.ClinicalNote.update(noteId, { [field]: value });
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("Updated successfully");
                   }}
                   noteTypes={templates}
                 />
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="clinical_note" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

           {/* Old tabs removed - replaced by sidebar */}




           {/* Removed duplicate/old tabs - cleanup */}
           <TabsContent value="summary" className="hidden">
             <div className="flex gap-3 mb-4">
               <NoteRevisionHistory
                 noteId={noteId}
                 onRestore={(revision) => {
                   const restoredData = {
                     chief_complaint: revision.chief_complaint,
                     history_of_present_illness: revision.history_of_present_illness,
                     assessment: revision.assessment,
                     plan: revision.plan,
                     diagnoses: revision.diagnoses,
                     medications: revision.medications,
                   };
                   setNoteData(restoredData);
                   queryClient.setQueryData(["note", noteId], (old) => ({
                     ...old,
                     ...restoredData,
                   }));
                 }}
               />
               {patientSummary && (
                 <Button
                   variant="outline"
                   onClick={generateSummary}
                   disabled={generatingSummary}
                   className="flex-1 rounded-xl gap-2 border-cyan-300 hover:bg-cyan-50 disabled:opacity-50"
                 >
                   {generatingSummary ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                   ) : (
                     <><Sparkles className="w-4 h-4" /> Regenerate</>
                   )}
                 </Button>
               )}
             </div>
             {generatingSummary && !patientSummary && (
               <div className="flex items-center gap-3 text-slate-500 py-8">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span className="text-sm">Generating AI summary...</span>
               </div>
             )}
             {patientSummary ? (
               <>
                 <PatientSummary 
                   summary={patientSummary} 
                   patientName={note.patient_name}
                   onDownload={downloadSummary}
                 />
                 <Button
                   onClick={async () => {
                     try {
                       await base44.entities.ClinicalNote.update(noteId, { 
                         summary: patientSummary.overview 
                       });
                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       toast.success("Summary added to clinical note");
                     } catch (error) {
                       console.error("Failed to add summary:", error);
                       toast.error("Failed to add summary");
                     }
                   }}
                   className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white gap-2 mt-4"
                 >
                   <Plus className="w-4 h-4" /> Add Summary to Clinical Note
                 </Button>
               </>
             ) : !generatingSummary && (
               <p className="text-sm text-slate-500 text-center py-8">No summary available yet</p>
             )}

             {/* Next Button */}
             <div className="flex justify-end pt-4 border-t border-slate-200">
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
             </TabsContent>

             {/* Physical Exam Tab */}
             <TabsContent value="physical_exam" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
                     <Activity className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Physical Examination</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">Document detailed physical examination findings</p>
                 </div>

                 <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-bold text-lg flex items-center gap-2">
                       <Activity className="w-6 h-6" />
                       Physical Exam Editor
                     </h3>
                     <p className="text-emerald-100 text-sm mt-1">Structured examination documentation</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button
                       size="sm"
                       onClick={async () => {
                         try {
                           await base44.entities.ClinicalNote.update(noteId, { physical_exam: "No abnormalities noted. All systems within normal limits on examination." });
                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           setPhysicalExamNormal(true);
                           toast.success("Physical exam set to normal");
                         } catch (error) {
                           console.error("Error updating physical exam:", error);
                           toast.error("Failed to update physical exam");
                         }
                       }}
                       className={`gap-2 ${physicalExamNormal ? "bg-white text-emerald-600 border-white" : "bg-white/20 hover:bg-white/30 border-white/30 text-white"} border`}
                     >
                       <Check className="w-4 h-4" /> Set Normal
                     </Button>
                     <InlineSectionAI
                       type="physical_exam"
                       note={note}
                       onApply={async (val) => {
                         await base44.entities.ClinicalNote.update(noteId, { physical_exam: val });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       }}
                     />
                   </div>
                 </div>
                 </div>
                   <div className="p-6 space-y-6 overflow-y-auto">
                     <PhysicalExamEditor
                       examData={note.physical_exam}
                       onUpdate={async (examData) => {
                         const examString = typeof examData === 'string' ? examData : JSON.stringify(examData);
                         await base44.entities.ClinicalNote.update(noteId, { physical_exam: examString });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         toast.success("Physical exam updated");
                       }}
                       onAddToNote={async (examText) => {
                         const updatedNote = (note.physical_exam || "") + examText;
                         await base44.entities.ClinicalNote.update(noteId, { physical_exam: updatedNote });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         toast.success("Physical exam findings added to clinical note");
                       }}
                     />
                   </div>
                 </div>
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="physical_exam" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

             {/* Review of Systems Tab */}
             <TabsContent value="review_of_systems" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Header */}
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
                     <Activity className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-2">Review of Systems</h2>
                   <p className="text-slate-600 max-w-2xl mx-auto">Systematic review of symptoms by body system</p>
                 </div>

                 <div className="bg-white rounded-xl border-2 border-purple-300 shadow-lg overflow-hidden">
                   <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-5 text-white">
                     <div className="flex items-center justify-between">
                       <div>
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Activity className="w-6 h-6" />
                           Review of Systems Editor
                         </h3>
                         <p className="text-purple-100 text-sm mt-1">Comprehensive system-based symptom review</p>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button
                           size="sm"
                           onClick={async () => {
                             try {
                               await base44.entities.ClinicalNote.update(noteId, { review_of_systems: "REVIEW OF SYSTEMS:\nGeneral: Denies fever, chills, weight loss.\nHeadache: Denies headache or dizziness.\nEyes, Ears, Nose, Throat: Denies vision changes, hearing loss, rhinorrhea, or sore throat.\nCardiovascular: Denies chest pain, palpitations, orthopnea, PND.\nRespiratory: Denies dyspnea, cough, or wheezing.\nGastrointestinal: Denies nausea, vomiting, diarrhea, constipation, or abdominal pain.\nGenitourinary: Denies dysuria, frequency, or urgency.\nMusculoskeletal: Denies joint pain, swelling, or stiffness.\nNeurological: Denies numbness, tingling, weakness, or tremor.\nPsychiatric: Denies depression, anxiety, or sleep disturbance.\nSkin: No rashes or lesions noted." });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               setRosNormal(true);
                               toast.success("ROS set to normal");
                             } catch (error) {
                               console.error("Error updating ROS:", error);
                               toast.error("Failed to update ROS");
                             }
                           }}
                           className={`gap-2 ${rosNormal ? "bg-white text-purple-600 border-white" : "bg-white/20 hover:bg-white/30 border-white/30 text-white"} border`}
                         >
                           <Check className="w-4 h-4" /> Set Normal
                         </Button>
                         <InlineSectionAI
                           type="review_of_systems"
                           note={note}
                           onApply={async (val) => {
                             await base44.entities.ClinicalNote.update(noteId, { review_of_systems: val });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           }}
                         />
                       </div>
                     </div>
                   </div>
                   <div className="p-6 space-y-6 overflow-y-auto">
                     <ReviewOfSystemsEditor
                       rosData={note.review_of_systems}
                       onUpdate={async (rosData) => {
                         const rosString = typeof rosData === 'string' ? rosData : JSON.stringify(rosData);
                         await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosString });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         toast.success("Review of systems updated");
                       }}
                       onAddToNote={async (rosText) => {
                         const updatedNote = (note.review_of_systems || "") + rosText;
                         await base44.entities.ClinicalNote.update(noteId, { review_of_systems: updatedNote });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                         toast.success("Review of systems findings added to clinical note");
                       }}
                     />
                   </div>
                 </div>
               </div>

               {/* Next Button */}
               <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <div className="flex gap-2">
                   <TabDataPreview tabId="review_of_systems" note={note} />
                   <ClinicalNotePreviewButton note={note} />
                 </div>
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

             <TabsContent value="research" className="hidden">
                       </TabsContent>

                   {/* Diagnoses Tab */}
                     <TabsContent value="diagnoses" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                   <div className="max-w-6xl mx-auto space-y-8">
                     {/* Header Section */}
                     <div className="text-center mb-8">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
                         <Beaker className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">Diagnoses & ICD-10 Coding</h2>
                       <p className="text-slate-600 max-w-2xl mx-auto">AI-powered diagnostic support with intelligent code suggestions and validation</p>
                     </div>

                     {/* AI Suggestion Cards - Side by Side */}
                     <div className="grid md:grid-cols-2 gap-6">
                       {/* Diagnostic Suggestions */}
                       <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                         <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
                           <h3 className="font-bold flex items-center gap-2">
                             <Sparkles className="w-5 h-5" />
                             AI Diagnostic Suggestions
                           </h3>
                           <p className="text-purple-100 text-xs mt-1">Real-time clinical decision support</p>
                         </div>
                         <div className="p-6">
                           <ClinicalDecisionSupport
                             type="diagnostic"
                             note={note}
                             onAddToNote={async (diagnosis) => {
                               const updatedDiagnoses = [...(note.diagnoses || []), diagnosis];
                               await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             }}
                           />
                         </div>
                       </div>

                       {/* AI Recommendations */}
                       <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                         <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 text-white">
                           <h3 className="font-bold flex items-center gap-2">
                             <Activity className="w-5 h-5" />
                             Evidence-Based Recommendations
                           </h3>
                           <p className="text-indigo-100 text-xs mt-1">Clinical pattern recognition</p>
                         </div>
                         <div className="p-6">
                           <DiagnosisRecommendations
                             note={note}
                             onAddDiagnoses={async (newDiagnoses) => {
                               const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                               await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             }}
                           />
                         </div>
                       </div>
                     </div>

                     {/* Current Diagnoses - Enhanced Design */}
                     <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                       <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 text-white">
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <Code className="w-6 h-6" />
                               Current Diagnoses
                             </h3>
                             <p className="text-blue-50 text-sm mt-1">
                               {note.diagnoses?.length || 0} {note.diagnoses?.length === 1 ? 'diagnosis' : 'diagnoses'} documented
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <Button
                               variant="outline"
                               onClick={() => setTemplateDialogOpen(true)}
                               size="sm"
                               className="gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30"
                             >
                               <Sparkles className="w-4 h-4" /> Template
                             </Button>
                           </div>
                         </div>
                       </div>

                       <div className="p-8">
                         {note.diagnoses && Array.isArray(note.diagnoses) && note.diagnoses.length > 0 ? (
                           <div className="space-y-3">
                             {note.diagnoses.map((diag, i) => {
                               const icd10Match = diag.match(/^([A-Z0-9.]+)\s*-\s*(.+)$/);
                               const code = icd10Match ? icd10Match[1] : null;
                               const description = icd10Match ? icd10Match[2] : diag;

                               return (
                                 <motion.div
                                   key={i}
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: i * 0.05 }}
                                   className="group relative flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                                 >
                                   <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-md flex-shrink-0">
                                     {i + 1}
                                   </div>
                                   <div className="flex-1 min-w-0 py-1">
                                     {code ? (
                                       <>
                                         <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-mono text-sm px-3 py-1 mb-2 shadow-sm">
                                           {code}
                                         </Badge>
                                         <p className="text-base font-semibold text-slate-900 leading-relaxed">{description}</p>
                                       </>
                                     ) : (
                                       <p className="text-base font-semibold text-slate-900 leading-relaxed">{diag}</p>
                                     )}
                                   </div>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={async () => {
                                       const updatedDiagnoses = note.diagnoses.filter((_, idx) => idx !== i);
                                       await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                       toast.success("Diagnosis removed");
                                     }}
                                     className="opacity-0 group-hover:opacity-100 transition-all text-red-600 hover:bg-red-50 hover:text-red-700"
                                   >
                                     <X className="w-5 h-5" />
                                   </Button>
                                 </motion.div>
                               );
                             })}
                           </div>
                         ) : (
                           <div className="text-center py-16">
                             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                               <Code className="w-10 h-10 text-slate-400" />
                             </div>
                             <p className="text-lg font-semibold text-slate-700 mb-2">No diagnoses documented yet</p>
                             <p className="text-slate-500 max-w-md mx-auto">Start by using AI suggestions above or search for ICD-10 codes below</p>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* ICD-10 Code Search - Enhanced */}
                     <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                       <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Sparkles className="w-6 h-6" />
                           ICD-10 Code Search & Mapper
                         </h3>
                         <p className="text-indigo-50 text-sm mt-1">Search thousands of codes or let AI suggest the best match</p>
                       </div>
                       <div className="p-8">
                         <ICD10CodeSearch
                           suggestions={icd10Suggestions}
                           diagnoses={note.diagnoses}
                           onAddDiagnoses={async (newDiagnoses) => {
                             const updatedDiagnoses = [...(note.diagnoses || []), ...newDiagnoses];
                             await base44.entities.ClinicalNote.update(noteId, { diagnoses: updatedDiagnoses });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           }}
                         />
                       </div>
                     </div>

                     {/* Quick Actions Bar */}
                     <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-200">
                       <div className="flex-1">
                         <p className="text-sm font-semibold text-slate-700">Quick Actions</p>
                         <p className="text-xs text-slate-500">Export or save your diagnoses</p>
                       </div>
                       <div className="flex gap-3">
                         <Button
                           variant="outline"
                           onClick={() => exportNote('pdf')}
                           disabled={exportingFormat === 'pdf'}
                           className="gap-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                         >
                           {exportingFormat === 'pdf' ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                             <Download className="w-4 h-4" />
                           )}
                           Export PDF
                         </Button>
                         <Button
                           variant="outline"
                           onClick={() => exportNote('text')}
                           disabled={exportingFormat === 'text'}
                           className="gap-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                         >
                           {exportingFormat === 'text' ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                             <Download className="w-4 h-4" />
                           )}
                           Export Text
                         </Button>
                       </div>
                     </div>

                     {/* Next Button */}
                     <div className="flex justify-between items-center pt-4">
                       <div className="flex gap-2">
                         <TabDataPreview tabId="research" note={note} />
                         <ClinicalNotePreviewButton note={note} />
                       </div>
                       <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg gap-2 px-6 py-3 text-base">
                         Continue <ArrowLeft className="w-5 h-5 rotate-180" />
                       </Button>
                     </div>
                     </div>
                     </TabsContent>

                     {/* Procedures Tab */}
                     <TabsContent value="procedures" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                     <div className="max-w-5xl mx-auto space-y-8">
                     {/* Header */}
                     <div className="text-center mb-8">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 mb-4 shadow-lg">
                         <Activity className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">Procedures</h2>
                       <p className="text-slate-600 max-w-2xl mx-auto">AI-powered procedure recommendations, educational resources, and procedure logging</p>
                     </div>

                     <ProceduresPanel note={note} noteId={noteId} />
                     </div>

                     {/* Next Button */}
                     <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                       <div className="flex gap-2">
                         <TabDataPreview tabId="procedures" note={note} />
                         <ClinicalNotePreviewButton note={note} />
                       </div>
                       <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                         Next <ArrowLeft className="w-4 h-4 rotate-180" />
                       </Button>
                     </div>
                     </TabsContent>

                     {/* Finalize Tab */}
                     <TabsContent value="finalize" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                       <div className="max-w-5xl mx-auto space-y-8">
                         {/* Header */}
                         <div className="text-center mb-8">
                           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
                             <Check className="w-8 h-8 text-white" />
                           </div>
                           <h2 className="text-3xl font-bold text-slate-900 mb-2">Review & Export</h2>
                           <p className="text-slate-600 max-w-2xl mx-auto">Finalize, review, and export your clinical note</p>
                         </div>

                         {/* Note Status */}
                         <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-lg p-6">
                           <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-slate-900">Note Status</h3>
                             <Badge className={statusColors[note.status || "draft"]}>
                               {note.status?.toUpperCase() || "DRAFT"}
                             </Badge>
                           </div>
                           <div className="flex gap-3 flex-wrap">
                             <Button
                               onClick={() => finalizeMutation.mutate()}
                               disabled={finalizeMutation.isPending || note.status === "finalized"}
                               className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                             >
                               {finalizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                               {note.status === "finalized" ? "Finalized" : "Finalize Note"}
                             </Button>
                             <Button
                               onClick={() => exportNote('pdf')}
                               disabled={exportingFormat === 'pdf'}
                               variant="outline"
                               className="gap-2"
                             >
                               {exportingFormat === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                               Export PDF
                             </Button>
                             <Button
                               onClick={() => exportNote('text')}
                               disabled={exportingFormat === 'text'}
                               variant="outline"
                               className="gap-2"
                             >
                               {exportingFormat === 'text' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                               Export Text
                             </Button>
                           </div>
                         </div>

                         {/* Note Preview */}
                         <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                           <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <FileText className="w-6 h-6" />
                               Note Preview
                             </h3>
                           </div>
                           <div className="p-6 space-y-4">
                             {[
                               { label: "Chief Complaint", value: note.chief_complaint },
                               { label: "History of Present Illness", value: note.history_of_present_illness },
                               { label: "Assessment", value: note.assessment },
                               { label: "Plan", value: note.plan },
                             ].map(({ label, value }) => value ? (
                               <div key={label}>
                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                                 <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3 border border-slate-200">{value}</p>
                               </div>
                             ) : null)}
                             {note.diagnoses?.length > 0 && (
                               <div>
                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Diagnoses</p>
                                 <div className="flex flex-wrap gap-2">
                                   {note.diagnoses.map((d, i) => <Badge key={i} className="bg-blue-100 text-blue-700 border border-blue-200">{d}</Badge>)}
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </TabsContent>

                     {/* Custom Tabs Content */}
                     {tabGroups.flatMap(g => g.tabs).filter(t => t.id.startsWith('custom_')).map(tab => (
                       <TabsContent key={tab.id} value={tab.id} className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                         <div className="max-w-5xl mx-auto space-y-8">
                           <div className="text-center mb-8">
                             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 mb-4 shadow-lg">
                               <Plus className="w-8 h-8 text-white" />
                             </div>
                             <h2 className="text-3xl font-bold text-slate-900 mb-2">{tab.label}</h2>
                             <p className="text-slate-600 max-w-2xl mx-auto">Custom section for your clinical documentation</p>
                           </div>

                           <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                               <h3 className="text-lg font-bold text-slate-900">Notes</h3>
                             </div>
                             <div className="p-6">
                               <Textarea
                                 placeholder={`Add notes for ${tab.label}...`}
                                 className="w-full min-h-[400px] bg-slate-50"
                               />
                             </div>
                           </div>
                         </div>

                         <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                           <div className="flex gap-2">
                             <TabDataPreview tabId={tab.id} note={note} />
                             <ClinicalNotePreviewButton note={note} />
                           </div>
                           <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                             Next <ArrowLeft className="w-4 h-4 rotate-180" />
                           </Button>
                         </div>
                       </TabsContent>
                       ))}
                       </div>
                       </Tabs>
                       </motion.div>


       </div>

       {/* Floating AI Assistant Button */}
       <motion.button
         onClick={() => setAiSidebarOpen(true)}
         whileHover={{ scale: 1.08 }}
         whileTap={{ scale: 0.95 }}
         className="fixed left-5 bottom-28 z-40 w-14 h-14 rounded-full bg-white shadow-xl border-2 border-transparent flex items-center justify-center"
         style={{
           background: "white",
           boxShadow: "0 4px 24px 0 rgba(168,85,247,0.25), 0 1.5px 6px 0 rgba(99,102,241,0.15)",
         }}
         title="Open AI Assistant"
       >
         <div
           className="w-12 h-12 rounded-full flex items-center justify-center"
           style={{
             background: "linear-gradient(135deg, #f0abfc 0%, #a78bfa 50%, #818cf8 100%)",
             boxShadow: "inset 0 1px 3px rgba(255,255,255,0.5), 0 0 0 2px rgba(167,139,250,0.4)",
           }}
         >
           <Sparkles className="w-6 h-6 text-white drop-shadow" />
         </div>
       </motion.button>

       {/* AI Sidebar */}
       <AISidebar
         isOpen={aiSidebarOpen}
         onClose={() => setAiSidebarOpen(false)}
         note={note}
         noteId={noteId}
         activeTab={activeTab}
         onUpdateNote={async (updates) => {
           await base44.entities.ClinicalNote.update(noteId, updates);
           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
         }}
       />

       {/* Create Template Dialog */}
      <CreateTemplateFromNote
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        note={note}
        onSuccess={() => setTemplateDialogOpen(false)}
      />
    </>
  );
}