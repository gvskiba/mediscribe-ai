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
        Brain,
        Menu
      } from "lucide-react";
      import MedicationRecommendations from "../components/notes/MedicationRecommendations";
      import TreatmentPlanSelector from "../components/notes/TreatmentPlanSelector";
      import EditableSection from "../components/notes/EditableSection";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import StructuredNotePreview from "../components/notes/StructuredNotePreview";
import PatientSummary from "../components/notes/PatientSummary";
import EditableSummaryGenerator from "../components/notes/EditableSummaryGenerator";
import SmartGuidelinePanel from "../components/guidelines/SmartGuidelinePanel";
import CreateTemplateFromNote from "../components/templates/CreateTemplateFromNote";
import ICD10CodeSearch from "../components/notes/ICD10CodeSearch";
import GuidelineReviewPrompt from "../components/notes/GuidelineReviewPrompt";
import NoteRevisionHistory from "../components/notes/NoteRevisionHistory";
import DiagnosesTab from "../components/notes/DiagnosesTab";
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
import AIDocumentationAssistant from "../components/ai/AIDocumentationAssistant";
import ProceduresPanel from "../components/procedures/ProceduresPanel";
import ClinicalWorkflowAutomation from "../components/notes/ClinicalWorkflowAutomation";
import AIGuidelineSuggestions from "../components/notes/AIGuidelineSuggestions";
import AISidebar from "../components/ai/AISidebar";
import InlineSectionAI from "../components/ai/InlineSectionAI";
import NoteTypeAndTemplateSelector from "../components/notes/NoteTypeAndTemplateSelector";
import MedicalDecisionMakingTab from "../components/notes/MedicalDecisionMakingTab";
import VitalSignsPasteAnalyzer from "../components/notes/VitalSignsPasteAnalyzer";
import DispositionPlanner from "../components/notes/DispositionPlanner";
import AutosaveToggle from "../components/notes/AutosaveToggle";
import VitalSignsHistory from "../components/notes/VitalSignsHistory";
import AIStructuredNotePreview from "../components/notes/AIStructuredNotePreview";
import SubjectiveTab from "../components/notes/SubjectiveTab";
import VitalSignsTab from "../components/notes/VitalSignsTab";
import DifferentialTab from "../components/notes/DifferentialTab";
import LabsImagingTab from "../components/notes/LabsImagingTab";
import PhysicalExamTab from "../components/notes/PhysicalExamTab";

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
      { id: 'physical_exam', label: 'Physical Exam', icon: Activity },
    ]
  },
  {
    id: 'assessment',
    label: 'Assessment',
    color: 'rose',
    tabs: [
      { id: 'differential', label: 'Differential Dx', icon: Code },
      { id: 'labs_imaging', label: 'Labs & Imaging', icon: Beaker },
      { id: 'mdm', label: 'MDM', icon: Brain },
    ]
  },
  {
    id: 'plan',
    label: 'Plan',
    color: 'amber',
    tabs: [
      { id: 'treatment_plan', label: 'Treatment Plan', icon: FileText },
      { id: 'medications', label: 'Medications', icon: Pill },
      { id: 'procedures', label: 'Procedures', icon: Activity },
    ]
  },
  {
    id: 'finalize',
    label: 'Finalize',
    color: 'indigo',
    tabs: [
      { id: 'diagnoses', label: 'Final Diagnoses', icon: Code },
      { id: 'clinical_note', label: 'Clinical Note', icon: FileText },
      { id: 'finalize', label: 'Review & Export', icon: Check },
    ]
  },
  {
    id: 'disposition',
    label: 'Disposition',
    color: 'purple',
    tabs: [
      { id: 'disposition_plan', label: 'Disposition', icon: FileText },
      { id: 'discharge_summary', label: 'Discharge Summary', icon: FileText },
      { id: 'patient_education', label: 'Patient Education', icon: BookOpen },
    ]
  },
  {
    id: 'analysis',
    label: 'AI Analysis',
    color: 'orange',
    tabs: [
      { id: 'ai_analysis', label: 'AI Analysis', icon: Brain },
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
  const [physicalExamNormal, setPhysicalExamNormal] = useState(false);
  const [rosNormal, setRosNormal] = useState(false);
  const [loadingDischargeSummary, setLoadingDischargeSummary] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [vitalSignsAnalysis, setVitalSignsAnalysis] = useState(null);
  const [loadingVitalAnalysis, setLoadingVitalAnalysis] = useState(false);
  const [vitalSignsHistory, setVitalSignsHistory] = useState([]);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState(null);
  const [structuredPreview, setStructuredPreview] = useState(null);
  const [showStructuredPreview, setShowStructuredPreview] = useState(false);
  const [editTreatmentPlanOpen, setEditTreatmentPlanOpen] = useState(false);

  const handleNext = () => {
    const allTabs = tabGroups.flatMap(g => g.tabs.map(t => t.id));
    const currentIndex = allTabs.indexOf(activeTab);
    if (currentIndex < allTabs.length - 1) {
      setActiveTab(allTabs[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const allTabs = tabGroups.flatMap(g => g.tabs.map(t => t.id));
    const currentIndex = allTabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(allTabs[currentIndex - 1]);
    }
  };

  const isFirstTab = () => {
    const allTabs = tabGroups.flatMap(g => g.tabs.map(t => t.id));
    return allTabs.indexOf(activeTab) === 0;
  };

  const isLastTab = () => {
    const allTabs = tabGroups.flatMap(g => g.tabs.map(t => t.id));
    const currentIndex = allTabs.indexOf(activeTab);
    return currentIndex === allTabs.length - 1;
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
    queryFn: () => base44.entities.ClinicalNote.get(noteId),
    enabled: !!noteId,
  });

  // Track current open note
  useEffect(() => {
    if (noteId) {
      localStorage.setItem('currentOpenNote', noteId);
    }
  }, [noteId]);

  // Update button states when note loads
  useEffect(() => {
    if (note) {
      setPhysicalExamNormal(
        note.physical_exam === "No abnormalities noted. All systems within normal limits on examination."
      );
      setRosNormal(
        note.review_of_systems?.includes("REVIEW OF SYSTEMS:") && 
        note.review_of_systems?.includes("Denies fever, chills, weight loss")
      );
    }
  }, [note?.id]);

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
    enabled: autosaveEnabled,
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

      {/* Patient Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{(note.patient_name || "?")[0]?.toUpperCase()}</span></div>
          <input type="text" value={note.patient_name === "New Patient" ? (note.chief_complaint || "New Patient") : note.patient_name} onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, patient_name: e.target.value }))} onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { patient_name: e.target.value }); setLastSaved(new Date().toISOString()); }} className="flex-1 text-sm font-bold text-slate-900 bg-transparent border-0 outline-none focus:ring-0 min-w-0" />
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}</span>
            <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" />{note.time_of_visit || format(new Date(), "h:mm a")}</span>
            {note.patient_id && <span className="hidden sm:flex items-center gap-1"><Hash className="w-3 h-3" />{note.patient_id}</span>}
            <Badge className={`text-xs px-1.5 py-0 ${note.status === 'finalized' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>{(note.status || "draft")}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">CC</span>
          <div className="w-px h-3 bg-slate-200 flex-shrink-0" />
          <input type="text" value={note.chief_complaint || ""} onChange={(e) => queryClient.setQueryData(["note", noteId], (old) => ({ ...old, chief_complaint: e.target.value }))} onBlur={async (e) => { await base44.entities.ClinicalNote.update(noteId, { chief_complaint: e.target.value }); }} placeholder="Chief complaint — primary reason for visit..." className="flex-1 text-xs text-slate-700 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:ring-0" maxLength={200} />
          <InlineSectionAI type="chief_complaint" note={note} onApply={async (val) => { await base44.entities.ClinicalNote.update(noteId, { chief_complaint: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
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
                          <SubjectiveTab
                            note={note} noteId={noteId} queryClient={queryClient}
                            templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
                            analyzingRawData={analyzingRawData} setAnalyzingRawData={setAnalyzingRawData}
                            checkingGrammar={checkingGrammar} setCheckingGrammar={setCheckingGrammar}
                            grammarSuggestions={grammarSuggestions} setGrammarSuggestions={setGrammarSuggestions}
                            loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis}
                            vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis}
                            vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory}
                            rosNormal={rosNormal} setRosNormal={setRosNormal}
                            structuredPreview={structuredPreview} setStructuredPreview={setStructuredPreview}
                            showStructuredPreview={showStructuredPreview} setShowStructuredPreview={setShowStructuredPreview}
                            isFirstTab={isFirstTab} isLastTab={isLastTab}
                            handleBack={handleBack} handleNext={handleNext}
                          />
                        </TabsContent>

                              {/* Vital Signs Tab */}
                              <TabsContent value="vital_signs" className="overflow-y-auto bg-slate-50">
                              <VitalSignsTab note={note} noteId={noteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingVitalAnalysis={loadingVitalAnalysis} setLoadingVitalAnalysis={setLoadingVitalAnalysis} vitalSignsAnalysis={vitalSignsAnalysis} setVitalSignsAnalysis={setVitalSignsAnalysis} vitalSignsHistory={vitalSignsHistory} setVitalSignsHistory={setVitalSignsHistory} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
                              </TabsContent>

                              {/* Differential Diagnosis Tab */}
                              <TabsContent value="differential" className="overflow-y-auto bg-slate-50">
                              <DifferentialTab note={note} noteId={noteId} queryClient={queryClient} templates={templates} selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} loadingDifferential={loadingDifferential} generateDifferentialDiagnosis={generateDifferentialDiagnosis} differentialDiagnosis={differentialDiagnosis} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
                              </TabsContent>

                              {/* unused placeholder */}

                 {/* Labs & Imaging Tab */}
                 <TabsContent value="labs_imaging" className="overflow-y-auto bg-slate-50">
                 <LabsImagingTab note={note} noteId={noteId} queryClient={queryClient} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
                 </TabsContent>

           {/* Treatment Plan Tab */}
             <TabsContent value="treatment_plan" className="overflow-y-auto bg-slate-50">
               <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                 <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Treatment Plan</h2><p className="text-xs text-slate-400 mt-0.5">Review and edit the treatment approach</p></div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm font-semibold text-slate-800">Treatment Plan</span></div>
                     <Button onClick={() => setEditTreatmentPlanOpen(true)} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-slate-200"><Settings className="w-3 h-3" />Edit</Button>
                   </div>
                   <div className="p-4">
                     {note.plan ? (
                       <div className="prose prose-xs prose-slate max-w-none text-slate-700 text-xs">
                         <ReactMarkdown components={{ p: ({children})=><p className="mb-1.5 leading-relaxed">{children}</p>, ul: ({children})=><ul className="list-disc list-inside mb-1.5">{children}</ul>, li: ({children})=><li className="block">{children}</li> }}>{note.plan}</ReactMarkdown>
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-xs text-slate-400">No treatment plan yet.</p>
                         <Button onClick={() => setEditTreatmentPlanOpen(true)} size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-6"><Plus className="w-3 h-3" />Add Plan</Button>
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                   <div className="flex gap-2"><TabDataPreview tabId="treatment_plan" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                   <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                 </div>
               </div>

               {/* Edit Treatment Plan Modal */}
               {editTreatmentPlanOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                     <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
                       <span className="text-sm font-bold text-slate-800">Edit Treatment Plan</span>
                       <div className="flex items-center gap-2"><InlineSectionAI type="plan" note={note} onApply={async (val) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: val })); await base44.entities.ClinicalNote.update(noteId, { plan: val }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /><button onClick={() => setEditTreatmentPlanOpen(false)} className="p-1 rounded hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button></div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       <Textarea value={note.plan || ""} onChange={(e) => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: e.target.value })); }} placeholder="Document treatment plan..." className="min-h-[300px] text-sm resize-none" autoFocus />
                       <ClinicalWorkflowAutomation note={note} noteId={noteId} onUpdateNote={async (updates) => { await base44.entities.ClinicalNote.update(noteId, updates); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} />
                     </div>
                     <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
                       <Button variant="ghost" onClick={() => { queryClient.setQueryData(["note", noteId], (old) => ({ ...old, plan: "" })); }} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 h-7"><X className="w-3 h-3" />Clear</Button>
                       <div className="flex gap-2"><Button variant="outline" onClick={() => setEditTreatmentPlanOpen(false)} className="text-xs h-7">Cancel</Button><Button onClick={async () => { await base44.entities.ClinicalNote.update(noteId, { plan: note.plan }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); setEditTreatmentPlanOpen(false); toast.success("Saved"); }} className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs h-7"><Check className="w-3 h-3" />Save</Button></div>
                     </div>
                   </motion.div>
                 </div>
               )}
             </TabsContent>

           {/* Medical Decision Making Tab */}
             <TabsContent value="mdm" className="overflow-y-auto bg-slate-50">
               <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                 <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Medical Decision Making</h2><p className="text-xs text-slate-400 mt-0.5">Document clinical reasoning and decision complexity</p></div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-violet-500 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-violet-500" /><span className="text-sm font-semibold text-slate-800">MDM Documentation</span></div>
                   <div className="p-4"><MedicalDecisionMakingTab note={note} noteId={noteId} onUpdateNote={async (updates) => { await base44.entities.ClinicalNote.update(noteId, updates); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
                 </div>
                 <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                   <div className="flex gap-2"><TabDataPreview tabId="mdm" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                   <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                 </div>
               </div>
             </TabsContent>

           {/* Medications Tab */}
             <TabsContent value="medications" className="overflow-y-auto bg-slate-50">
               <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                 <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Medications</h2><p className="text-xs text-slate-400 mt-0.5">Prescriptions, recommendations, and interaction checks</p></div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">AI Recommendations</span></div>
                   <div className="p-4"><MedicationRecommendations note={note} onAddMedications={async (meds) => { const u = [...(note.medications || []), ...meds]; await base44.entities.ClinicalNote.update(noteId, { medications: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
                 </div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Current Medications</span><span className="text-xs text-slate-400">({note.medications?.length || 0})</span></div>
                   <div className="p-4">
                     {note.medications?.length > 0 ? (
                       <div className="space-y-1.5">
                         {note.medications.map((med, idx) => (
                           <div key={idx} className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                             <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx+1}</span>
                             <p className="text-xs text-slate-800 flex-1">{med}</p>
                             <button onClick={async () => { const u = note.medications.filter((_,i) => i !== idx); await base44.entities.ClinicalNote.update(noteId, { medications: u }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Removed"); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-0.5"><X className="w-3 h-3" /></button>
                           </div>
                         ))}
                       </div>
                     ) : <p className="text-xs text-slate-400 text-center py-4">No medications documented yet.</p>}
                   </div>
                 </div>
                 {note.medications?.length > 1 && (
                   <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
                     <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-sm font-semibold text-slate-800">Drug Interaction Check</span></div>
                     {!loadingInteractions && drugInteractions.length === 0 && <Button onClick={analyzeDrugInteractions} size="sm" variant="outline" className="text-xs h-6 px-2 gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"><Sparkles className="w-3 h-3" />Check</Button>}
                     {loadingInteractions && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                     </div>
                     {drugInteractions.length > 0 && <div className="p-4 space-y-2">{drugInteractions.map((i, idx) => (<div key={idx} className={`rounded-lg border px-3 py-2 flex items-center justify-between ${i.severity==='severe'?'bg-red-50 border-red-200':i.severity==='moderate'?'bg-yellow-50 border-yellow-200':'bg-blue-50 border-blue-200'}`}><div><p className="text-xs font-semibold text-slate-800">{i.drug_pair}</p><p className="text-xs text-slate-600">{i.recommendation}</p></div><Badge className={`text-xs ml-2 ${i.severity==='severe'?'bg-red-600 text-white':i.severity==='moderate'?'bg-yellow-600 text-white':'bg-blue-600 text-white'}`}>{i.severity}</Badge></div>))}</div>}
                   </div>
                 )}
                 <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                   <div className="flex gap-2"><TabDataPreview tabId="medications" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                   <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                 </div>
               </div>
             </TabsContent>

           {/* Clinical Note Tab */}
             <TabsContent value="clinical_note" className="overflow-y-auto bg-slate-50">
               <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                 <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Clinical Note</h2><p className="text-xs text-slate-400 mt-0.5">Templates, structured view, and note generation</p></div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Template & Type</span></div>
                   <div className="p-4">
                     <NoteTypeAndTemplateSelector note={note} templates={templates} selectedTemplate={selectedTemplate} onNoteTypeChange={async (t) => { await base44.entities.ClinicalNote.update(noteId, { note_type: t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Updated"); }} onTemplateSelect={setSelectedTemplate} onApplyTemplate={async (templateId) => { const s = templates.find(t => t.id === templateId); if (s) { const u = { note_type: s.note_type || note.note_type }; if (s.sections) s.sections.forEach(sec => { if (sec.content_template) { const fm = { chief_complaint:"chief_complaint", hpi:"history_of_present_illness", ros:"review_of_systems", physical_exam:"physical_exam", assessment:"assessment", plan:"plan" }; if (fm[sec.id]) u[fm[sec.id]] = sec.content_template; } }); await base44.entities.ClinicalNote.update(noteId, u); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Template applied"); } }} />
                   </div>
                 </div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">Structured Note View</span></div>
                   <div className="p-4"><ClinicalNoteView note={note} onUpdate={async (field, value) => { await base44.entities.ClinicalNote.update(noteId, { [field]: value }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Updated"); }} noteTypes={templates} differentialDiagnosis={differentialDiagnosis} /></div>
                 </div>
                 <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
                   <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-sm font-semibold text-slate-800">Generate Complete Note</span></div>
                   <div className="p-4"><AIDocumentationAssistant note={note} onUpdateNote={async (updates) => { await base44.entities.ClinicalNote.update(noteId, updates); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); }} /></div>
                 </div>
                 <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                   <div className="flex gap-2"><TabDataPreview tabId="clinical_note" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                   <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                 </div>
               </div>
             </TabsContent>

           {/* Old tabs removed - replaced by sidebar */}




           <TabsContent value="summary" className="hidden" />

             {/* Physical Exam Tab */}
             <TabsContent value="physical_exam" className="overflow-y-auto bg-slate-50">
               <PhysicalExamTab note={note} noteId={noteId} queryClient={queryClient} physicalExamNormal={physicalExamNormal} setPhysicalExamNormal={setPhysicalExamNormal} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
             </TabsContent>

                   {/* Diagnoses Tab */}
                     <TabsContent value="diagnoses" className="overflow-y-auto bg-slate-50">
                     <DiagnosesTab note={note} noteId={noteId} queryClient={queryClient} icd10Suggestions={icd10Suggestions} loadingInteractions={loadingInteractions} drugInteractions={drugInteractions} analyzeDrugInteractions={analyzeDrugInteractions} isFirstTab={isFirstTab} isLastTab={isLastTab} handleBack={handleBack} handleNext={handleNext} />
                   </TabsContent>

                     {/* Disposition Tab */}
                     <TabsContent value="disposition_plan" className="overflow-y-auto bg-slate-50">
                       <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                         <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Disposition Plan</h2><p className="text-xs text-slate-400 mt-0.5">Patient disposition, follow-up care, and discharge</p></div>
                         <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-500 shadow-sm overflow-hidden">
                           <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-sm font-semibold text-slate-800">Disposition Planner</span></div>
                           <div className="p-4">
                             <DispositionPlanner note={note} onSave={async (d) => { const t = `DISPOSITION PLAN\n\nTYPE: ${d.disposition_type.toUpperCase()}\nLOCATION: ${d.location}${d.accepting_provider ? `\nACCEPTING PROVIDER: ${d.accepting_provider}` : ""}${d.admission_time ? `\nADMISSION TIME: ${d.admission_time}` : ""}\n\nADDITIONAL INSTRUCTIONS:\n${d.additional_notes || "None"}`.trim(); await base44.entities.ClinicalNote.update(noteId, { disposition_plan: t }); queryClient.invalidateQueries({ queryKey: ["note", noteId] }); toast.success("Saved"); }} />
                           </div>
                         </div>
                         <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                           <div className="flex gap-2"><TabDataPreview tabId="disposition_plan" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                           <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                         </div>
                       </div>
                     </TabsContent>

                         {/* Discharge Summary Tab */}
                     <TabsContent value="discharge_summary" className="overflow-y-auto bg-slate-50">
                       <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                         <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Discharge Summary</h2><p className="text-xs text-slate-400 mt-0.5">AI-generated discharge instructions</p></div>

                         <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
                           <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-sm font-semibold text-slate-800">AI Discharge Instructions</span></div>
                           <div className="p-4">
                             <Button onClick={async () => { setLoadingDischargeSummary(true); try { const r = await base44.integrations.Core.InvokeLLM({ prompt: `Generate concise discharge instructions. PATIENT: ${note.patient_name}, DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}, PLAN: ${note.plan || "N/A"}. Format as clear actionable instructions only.`, add_context_from_internet: false }); queryClient.setQueryData(["note", noteId], o => ({ ...o, discharge_summary: r })); toast.success("Generated"); } catch { toast.error("Failed"); } finally { setLoadingDischargeSummary(false); } }} disabled={loadingDischargeSummary} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-7 px-3">
                               {loadingDischargeSummary ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate Instructions</>}
                             </Button>
                             </div>
                             </div>
                             {note.discharge_summary && (
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Edit Instructions</span></div>
                             <div className="p-4 space-y-3">
                               <Textarea value={note.discharge_summary || ""} onChange={(e) => queryClient.setQueryData(["note", noteId], o => ({ ...o, discharge_summary: e.target.value }))} placeholder="Edit discharge instructions..." className="min-h-[200px] text-sm resize-none border-slate-200" />
                               <Button onClick={async () => { await base44.entities.ClinicalNote.update(noteId, { discharge_summary: note.discharge_summary }); toast.success("Saved"); }} size="sm" className="bg-slate-700 hover:bg-slate-800 text-white gap-1 text-xs h-7"><Check className="w-3 h-3" />Save</Button>
                             </div>
                             </div>
                             )}
                             <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                             <div className="flex gap-2"><TabDataPreview tabId="discharge_summary" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                             <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                             </div>
                             </div>
                             </TabsContent>

                             {/* Patient Education Tab */}
                             <TabsContent value="patient_education" className="overflow-y-auto bg-slate-50">
                             <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                             <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Patient Education</h2><p className="text-xs text-slate-400 mt-0.5">Generate patient-friendly education materials</p></div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold text-slate-800">Generate Materials</span></div>
                             <Button onClick={generatePatientEducation} disabled={generatingEducation || !note.diagnoses?.length} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-7 px-3">{generatingEducation ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Generate</>}</Button>
                             </div>
                             {!note.diagnoses?.length && <p className="text-xs text-slate-400 px-4 py-2">Add diagnoses first to generate education materials.</p>}
                             </div>
                             {patientEducation?.length > 0 && patientEducation.map((m, i) => (
                             <div key={i} className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-cyan-500 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                               <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-sm font-semibold text-slate-800">{m.diagnosis}</span></div>
                               <Button onClick={() => downloadPatientEducation('txt')} size="sm" variant="outline" className="text-xs h-6 px-2"><Download className="w-3 h-3" /></Button>
                             </div>
                             <div className="p-4 space-y-3 text-xs text-slate-700">
                               {m.what_is_it && <div><p className="font-semibold text-slate-800 mb-1">What Is It?</p><p className="leading-relaxed">{m.what_is_it}</p></div>}
                               {m.symptoms_to_watch?.length > 0 && <div><p className="font-semibold text-slate-800 mb-1">Symptoms to Watch</p><ul className="space-y-0.5">{m.symptoms_to_watch.map((s, j) => <li key={j} className="flex gap-1.5"><span className="text-slate-400 flex-shrink-0">•</span>{s}</li>)}</ul></div>}
                               {m.when_to_seek_help?.length > 0 && <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2"><p className="font-semibold text-red-800 mb-1">⚠ When to Seek Help</p><ul className="space-y-0.5">{m.when_to_seek_help.map((h, j) => <li key={j} className="text-red-700">{h}</li>)}</ul></div>}
                             </div>
                             </div>
                             ))}
                             <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                             <div className="flex gap-2"><TabDataPreview tabId="patient_education" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                             <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                             </div>
                             </div>
                             </TabsContent>

                             {/* Procedures Tab */}
                             <TabsContent value="procedures" className="overflow-y-auto bg-slate-50">
                             <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                             <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Procedures</h2><p className="text-xs text-slate-400 mt-0.5">Recommendations, education, and logging</p></div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-sm font-semibold text-slate-800">Procedures Panel</span></div>
                             <div className="p-4"><ProceduresPanel note={note} noteId={noteId} /></div>
                             </div>
                             <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                             <div className="flex gap-2"><TabDataPreview tabId="procedures" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                             <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                             </div>
                             </div>
                             </TabsContent>

                             {/* Finalize Tab */}
                             <TabsContent value="finalize" className="overflow-y-auto bg-slate-50">
                             <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                             <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Review & Export</h2><p className="text-xs text-slate-400 mt-0.5">Finalize, review, and export your clinical note</p></div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-sm font-semibold text-slate-800">Note Status</span><Badge className={`text-xs ${statusColors[note.status || "draft"]}`}>{note.status || "draft"}</Badge></div>
                             <div className="flex gap-1.5">
                               <Button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending || note.status === "finalized"} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs h-7">{finalizeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}{note.status === "finalized" ? "Finalized" : "Finalize"}</Button>
                               <Button onClick={() => exportNote('pdf')} disabled={exportingFormat === 'pdf'} size="sm" variant="outline" className="gap-1 text-xs h-7">{exportingFormat === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}PDF</Button>
                               <Button onClick={() => exportNote('text')} disabled={exportingFormat === 'text'} size="sm" variant="outline" className="gap-1 text-xs h-7">{exportingFormat === 'text' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}Text</Button>
                             </div>
                             </div>
                             </div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Note Preview</span></div>
                             <div className="p-4 space-y-3">
                             {[{label:"CC",val:note.chief_complaint},{label:"HPI",val:note.history_of_present_illness},{label:"Assessment",val:note.assessment},{label:"Plan",val:note.plan}].filter(x=>x.val).map(({label,val}) => (
                               <div key={label}><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p><p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{val}</p></div>
                             ))}
                             {note.diagnoses?.length > 0 && <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Diagnoses</p><div className="flex flex-wrap gap-1.5">{note.diagnoses.map((d,i) => <Badge key={i} className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">{d}</Badge>)}</div></div>}
                             </div>
                             </div>
                             </div>
                             </TabsContent>

                             {/* AI Analysis Tab */}
                             <TabsContent value="ai_analysis" className="overflow-y-auto bg-slate-50">
                             <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                             <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">AI Analysis</h2><p className="text-xs text-slate-400 mt-0.5">Comprehensive AI-powered analysis and insights</p></div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm font-semibold text-slate-800">AI Analysis Tools</span></div>
                             <div className="p-4"><Button onClick={() => setAiSidebarOpen(true)} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-7 px-3"><Sparkles className="w-3 h-3" />Open AI Analysis</Button></div>
                             </div>
                             <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                             <div className="flex gap-2"><TabDataPreview tabId="ai_analysis" note={note} /><ClinicalNotePreviewButton note={note} /></div>
                             <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                             </div>
                             </div>
                             </TabsContent>

                             {/* Custom Tabs Content */}
                             {tabGroups.flatMap(g => g.tabs).filter(t => t.id.startsWith('custom_')).map(tab => (
                             <TabsContent key={tab.id} value={tab.id} className="overflow-y-auto bg-slate-50">
                             <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
                             <div><h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{tab.label}</h2></div>
                             <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-sm overflow-hidden">
                             <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-sm font-semibold text-slate-800">Notes</span></div>
                             <div className="p-4"><Textarea placeholder={`Add notes for ${tab.label}...`} className="w-full min-h-[300px] text-sm resize-none border-slate-200" /></div>
                             </div>
                             <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                             <div className="flex gap-2"><TabDataPreview tabId={tab.id} note={note} /><ClinicalNotePreviewButton note={note} /></div>
                             <div className="flex items-center gap-1.5">{!isFirstTab() && <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><ArrowLeft className="w-3.5 h-3.5" />Back</button>}{!isLastTab() && <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Next<ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>}</div>
                             </div>
                             </div>
                             </TabsContent>
                             ))}
                       </div>
                       </Tabs>
                       </motion.div>


       </div>

       {/* Autosave Toggle */}
       <AutosaveToggle enabled={autosaveEnabled} onChange={setAutosaveEnabled} />

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

       {/* AI Structured Note Preview */}
       {showStructuredPreview && (
         <AIStructuredNotePreview
           structured={structuredPreview}
           activeTab={activeTab}
           onClose={() => setShowStructuredPreview(false)}
           onApply={async () => {
             if (!structuredPreview) return;
             // Strip markdown from text fields before applying
             const stripMd = (text) => typeof text === 'string'
               ? text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/^#{1,6}\s+/gm, '')
               : text;
             const fieldsToApply = [
               'chief_complaint', 'history_of_present_illness', 'medical_history',
               'review_of_systems', 'physical_exam', 'assessment', 'plan',
               'summary', 'diagnoses', 'medications', 'allergies',
               'lab_findings', 'imaging_findings'
             ];
             const updates = {};
             fieldsToApply.forEach(field => {
               const val = structuredPreview[field];
               if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
                 updates[field] = Array.isArray(val) ? val : stripMd(val);
               }
             });
             if (Object.keys(updates).length > 0) {
               await base44.entities.ClinicalNote.update(noteId, updates);
               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
             }
             toast.success(`Applied ${Object.keys(updates).length} fields to note`);
             setShowStructuredPreview(false);
           }}
         />
       )}

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