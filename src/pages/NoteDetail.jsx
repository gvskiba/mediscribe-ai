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
        ExternalLink
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

const TAB_GROUPS = [
  {
    id: 'history',
    label: 'History',
    color: 'blue',
    tabs: [
      { id: 'hpi_intake', label: 'HPI & Intake', icon: Activity },
      { id: 'chief_complaint', label: 'Chief Complaint', icon: Activity },
      { id: 'review_of_systems', label: 'Review of Systems', icon: Activity },
    ]
  },
  {
    id: 'examination',
    label: 'Physical Exam',
    color: 'purple',
    tabs: [
      { id: 'physical_exam', label: 'Physical Exam', icon: Activity },
    ]
  },
  {
    id: 'assessment',
    label: 'Assessment',
    color: 'emerald',
    tabs: [
      { id: 'analysis', label: 'Analysis', icon: Sparkles },
      { id: 'initial_impression', label: 'Initial Impression', icon: Sparkles },
      { id: 'calculators', label: 'Calculators', icon: Activity },
      { id: 'laboratory', label: 'Laboratory', icon: Beaker },
      { id: 'imaging_recommendations', label: 'Imaging', icon: ImageIcon },
      { id: 'imaging', label: 'Result Analysis', icon: ImageIcon },
      { id: 'mdm', label: 'MDM', icon: AlertCircle },
      { id: 'diagnoses', label: 'Diagnoses', icon: Code },
    ]
  },
  {
    id: 'plan',
    label: 'Plan',
    color: 'rose',
    tabs: [
      { id: 'plan', label: 'Treatment Plan', icon: FileText },
      { id: 'treatments', label: 'Medications', icon: Pill },
      { id: 'procedures', label: 'Procedures', icon: Activity },
      { id: 'guidelines', label: 'Guidelines', icon: BookOpen },
    ]
  },
  {
    id: 'finalization',
    label: 'Finalization',
    color: 'amber',
    tabs: [
      { id: 'final_impression', label: 'Final Impression', icon: FileText },
      { id: 'clinical', label: 'Clinical Note', icon: FileText },
      { id: 'summary', label: 'Summary', icon: FileText },
      { id: 'patient_education', label: 'Patient Education', icon: BookOpen },
      { id: 'research', label: 'Research', icon: BookOpen },
      { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
      { id: 'finalize', label: 'Finalize', icon: Check },
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
  const [activeTab, setActiveTab] = useState("clinical");
  const [openDropdown, setOpenDropdown] = useState(null);
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
    // Build a map of persisted tab layouts (keyed by group_id)
    const persistedMap = {};
    customTabGroups.forEach(g => {
      persistedMap[g.group_id] = g;
    });

    // For each default group, use persisted tab order if available
    const defaultGroupsMerged = TAB_GROUPS.map(g => {
      const persisted = persistedMap[g.id];
      if (persisted) {
        // Reconstruct tabs: persisted defines order, but we keep original icon/label for default tabs
        const tabById = Object.fromEntries(g.tabs.map(t => [t.id, t]));
        const reorderedTabs = persisted.tabs.map(t => ({
          ...tabById[t.id],
          ...t,
          icon: tabById[t.id]?.icon || Plus,
          label: tabById[t.id]?.label || t.label,
        }));
        // Append any default tabs not in persisted (newly added defaults)
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

    setTabGroups([...defaultGroupsMerged, ...customOnlyGroups]);
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
        className="bg-white rounded-2xl border border-slate-200 p-6"
      >
        {/* Patient Info */}
        <div className="mb-6">
          <div className="mb-3">
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
              className="text-3xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors px-1 -ml-1 w-full"
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {note.date_of_visit ? format(new Date(note.date_of_visit), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {note.time_of_visit || format(new Date(), "h:mm a")}
              </span>
            </div>
          </div>

          {note.chief_complaint && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Chief Complaint:</p>
              <p className="text-sm text-slate-700">{note.chief_complaint}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
            {note.patient_id && (
              <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" /> {note.patient_id}</span>
            )}
            {note.date_of_visit && (
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {format(new Date(note.date_of_visit), "MMM d, yyyy")}</span>
            )}
            {note.specialty && (
              <span className="text-slate-600">{note.specialty}</span>
            )}
          </div>
          {note.summary && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-700 leading-relaxed">{note.summary}</p>
            </div>
          )}
        </div>



        {/* Quick Actions */}
        <div className="border-t border-slate-200 pt-6 flex gap-3">
          <Button 
            onClick={async () => {
              setExtractingData(true);
              try {
                // Collect all available data from the note
                const contextData = {
                  raw_note: note.raw_note || "",
                  chief_complaint: note.chief_complaint || "",
                  history_of_present_illness: note.history_of_present_illness || "",
                  medical_history: note.medical_history || "",
                  review_of_systems: note.review_of_systems || "",
                  physical_exam: note.physical_exam || "",
                  assessment: note.assessment || "",
                  plan: note.plan || "",
                  clinical_impression: note.clinical_impression || "",
                  diagnoses: note.diagnoses || [],
                  medications: note.medications || [],
                  allergies: note.allergies || []
                };

                const result = await base44.integrations.Core.InvokeLLM({
                  prompt: `Analyze ALL the following clinical data and create a comprehensive, well-structured clinical note. Review each section carefully and extract/organize all relevant information into the appropriate fields.

        AVAILABLE CLINICAL DATA:
        ${JSON.stringify(contextData, null, 2)}

        Your task is to:
        1. Review ALL sections thoroughly
        2. Extract and organize information appropriately
        3. Fill in any missing sections based on available context
        4. Ensure clinical coherence across all fields
        5. Maintain professional medical documentation standards

        Return a complete clinical note with ALL fields populated based on the available data:`,
                  response_json_schema: {
                    type: "object",
                    properties: {
                      chief_complaint: { type: "string" },
                      history_of_present_illness: { type: "string" },
                      medical_history: { type: "string" },
                      review_of_systems: { type: "string" },
                      physical_exam: { type: "string" },
                      assessment: { type: "string" },
                      plan: { type: "string" },
                      clinical_impression: { type: "string" },
                      diagnoses: { type: "array", items: { type: "string" } },
                      medications: { type: "array", items: { type: "string" } },
                      allergies: { type: "array", items: { type: "string" } }
                    }
                  }
                });

                // Update the note with all extracted data
                await base44.entities.ClinicalNote.update(noteId, result);
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                toast.success("Clinical note fields populated from AI analysis");
              } catch (error) {
                console.error("Failed to analyze and populate:", error);
                toast.error("Failed to analyze note data");
              } finally {
                setExtractingData(false);
              }
            }}
            disabled={extractingData}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl gap-2 shadow-lg shadow-purple-500/30 font-semibold transition-all"
          >
            {extractingData ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> AI Review & Fill</>
            )}
          </Button>
          <Button 
            onClick={async () => {
              const newNote = await base44.entities.ClinicalNote.create({
                raw_note: "",
                patient_name: "New Patient",
                status: "draft"
              });
              window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl gap-2 shadow-lg shadow-blue-500/30 font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> New Note
          </Button>
          <Link to={createPageUrl("NotesLibrary")} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl gap-2 border-slate-300 hover:bg-slate-50">
              <FileText className="w-4 h-4" /> All Notes
            </Button>
          </Link>
        </div>
      </motion.div>



      {/* Tabbed Interface */}
       <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
       >
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               {/* ── Header Navigation ── */}
               <div className="bg-white border-b border-slate-200 px-4" onClick={() => openDropdown && setOpenDropdown(null)}>
                 <TabsList className="flex items-center gap-0 bg-transparent h-auto py-0 w-full justify-start overflow-x-auto scrollbar-hide">
                   {/* Clinical Note - Primary prominent tab */}
                   <TabsTrigger
                     value="clinical"
                     className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 rounded-none transition-all flex-shrink-0 ${
                       activeTab === 'clinical'
                         ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                         : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                     }`}
                   >
                     <FileText className="w-4 h-4" />
                     Clinical Note
                   </TabsTrigger>

                   <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

                   {/* Group dropdowns */}
                   {tabGroups.map((group) => {
                     const groupTabs = group.tabs.filter(t => t.id !== 'clinical');
                     if (groupTabs.length === 0) return null;
                     const isOpen = openDropdown === group.id;
                     const hasActiveTab = groupTabs.some(t => t.id === activeTab);
                     const accentBorder = {
                       blue: 'border-blue-500', purple: 'border-purple-500',
                       emerald: 'border-emerald-500', rose: 'border-rose-500', amber: 'border-amber-500',
                     };
                     const accentText = {
                       blue: 'text-blue-600', purple: 'text-purple-600',
                       emerald: 'text-emerald-600', rose: 'text-rose-600', amber: 'text-amber-600',
                     };
                     const activeTabLabel = groupTabs.find(t => t.id === activeTab)?.label;

                     return (
                       <div key={group.id} className="relative flex-shrink-0">
                         <button
                           onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : group.id); }}
                           className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 rounded-none transition-all ${
                             hasActiveTab
                               ? `${accentBorder[group.color] || 'border-blue-500'} ${accentText[group.color] || 'text-blue-600'} bg-slate-50/50`
                               : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                           }`}
                         >
                           <span>{hasActiveTab ? activeTabLabel : group.label}</span>
                           <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                         </button>

                         <AnimatePresence>
                           {isOpen && (
                             <motion.div
                               initial={{ opacity: 0, y: -4, scale: 0.97 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: -4, scale: 0.97 }}
                               transition={{ duration: 0.12 }}
                               className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[180px] py-1.5 overflow-hidden"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <div className="px-3 py-1.5 mb-1 border-b border-slate-100">
                                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.label}</span>
                               </div>
                               {groupTabs.map((tab) => (
                                 <TabsTrigger
                                   key={tab.id}
                                   value={tab.id}
                                   onClick={() => setOpenDropdown(null)}
                                   className={`w-full justify-start px-3 py-2 text-sm rounded-none transition-all ${
                                     activeTab === tab.id
                                       ? `bg-slate-100 font-semibold ${accentText[group.color] || 'text-blue-600'}`
                                       : 'text-slate-700 hover:bg-slate-50'
                                   }`}
                                 >
                                   {tab.label}
                                 </TabsTrigger>
                               ))}
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     );
                   })}

                   {/* Spacer + AI Review button */}
                   <div className="flex-1" />
                   <div className="flex items-center gap-1 py-2 flex-shrink-0">
                     <TabDataPreview tabId={activeTab} note={note} />
                     <ClinicalNotePreviewButton note={note} />
                   </div>
                 </TabsList>
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

               <div>

           {/* HPI & Intake Tab */}
           <TabsContent value="hpi_intake" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
             <div className="max-w-5xl mx-auto space-y-8">
               {/* Header */}
               <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                   <Activity className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-900 mb-2">HPI & Patient Intake</h2>
                 <p className="text-slate-600 max-w-2xl mx-auto">Voice transcription and AI analysis of patient data</p>
               </div>

               {/* Voice Recording Section */}
               <div className="bg-white rounded-xl border-2 border-blue-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-5 text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Activity className="w-6 h-6" />
                     Voice Transcription
                   </h3>
                   <p className="text-blue-100 text-sm mt-1">Record patient encounter or dictate notes</p>
                 </div>
                 <div className="p-6">
                   <div className="flex items-center justify-center gap-4 mb-4">
                     <Button
                       onClick={async () => {
                         if (isRecording) {
                           // Stop recording
                           if (mediaRecorder) {
                             mediaRecorder.stop();
                             setIsRecording(false);
                             setRecordingTime(0);
                           }
                         } else {
                           // Start recording
                           try {
                             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                             const recorder = new MediaRecorder(stream);
                             const audioChunks = [];

                             recorder.ondataavailable = (event) => {
                               audioChunks.push(event.data);
                             };

                             recorder.onstop = async () => {
                               const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                               const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });

                               // Upload and transcribe
                               toast.info("Transcribing audio...");
                               try {
                                 const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
                                 const transcription = await base44.integrations.Core.InvokeLLM({
                                   prompt: "Transcribe this medical audio recording accurately. Include all patient statements, symptoms, and medical details.",
                                   file_urls: [file_url]
                                 });

                                 const updatedRawNote = (note.raw_note || "") + "\n\n" + transcription;
                                 await base44.entities.ClinicalNote.update(noteId, { raw_note: updatedRawNote });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Audio transcribed and added to raw notes");
                               } catch (error) {
                                 console.error("Transcription failed:", error);
                                 toast.error("Failed to transcribe audio");
                               }

                               stream.getTracks().forEach(track => track.stop());
                             };

                             recorder.start();
                             setMediaRecorder(recorder);
                             setIsRecording(true);

                             // Start timer
                             const interval = setInterval(() => {
                               setRecordingTime(prev => prev + 1);
                             }, 1000);

                             recorder.onstop = async () => {
                               clearInterval(interval);
                               const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                               const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });

                               toast.info("Transcribing audio...");
                               try {
                                 const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
                                 const transcription = await base44.integrations.Core.InvokeLLM({
                                   prompt: "Transcribe this medical audio recording accurately. Include all patient statements, symptoms, and medical details.",
                                   file_urls: [file_url]
                                 });

                                 const updatedRawNote = (note.raw_note || "") + "\n\n" + transcription;
                                 await base44.entities.ClinicalNote.update(noteId, { raw_note: updatedRawNote });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Audio transcribed and added to raw notes");
                               } catch (error) {
                                 console.error("Transcription failed:", error);
                                 toast.error("Failed to transcribe audio");
                               }

                               stream.getTracks().forEach(track => track.stop());
                             };
                           } catch (error) {
                             console.error("Failed to access microphone:", error);
                             toast.error("Failed to access microphone");
                           }
                         }
                       }}
                       className={`gap-2 shadow-lg py-6 text-base ${
                         isRecording 
                           ? 'bg-red-600 hover:bg-red-700 text-white' 
                           : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                       }`}
                     >
                       {isRecording ? (
                         <><X className="w-5 h-5" /> Stop Recording ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})</>
                       ) : (
                         <><Activity className="w-5 h-5" /> Start Voice Recording</>
                       )}
                     </Button>
                   </div>
                   {isRecording && (
                     <div className="flex items-center justify-center gap-2 text-red-600 animate-pulse">
                       <div className="w-3 h-3 rounded-full bg-red-600"></div>
                       <span className="text-sm font-medium">Recording in progress...</span>
                     </div>
                   )}
                 </div>
               </div>

               {/* Raw Patient Data */}
               <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                 <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-slate-600" />
                     Raw Patient Data / Notes
                   </h3>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={async () => {
                       await navigator.clipboard.writeText(note.raw_note || "");
                       toast.success("Copied to clipboard");
                     }}
                     className="gap-2"
                   >
                     <FileCode className="w-4 h-4" /> Copy
                   </Button>
                 </div>
                 <div className="p-6">
                   <RichTextNoteEditor
                     value={note.raw_note || ""}
                     onChange={(content) => {
                       queryClient.setQueryData(["note", noteId], (old) => ({
                         ...old,
                         raw_note: content
                       }));
                     }}
                     onBlur={async () => {
                       const currentNote = queryClient.getQueryData(["note", noteId]);
                       await base44.entities.ClinicalNote.update(noteId, { raw_note: currentNote.raw_note });
                       setLastSaved(new Date().toISOString());
                       toast.success("Note saved at " + format(new Date(), "h:mm:ss a"));
                     }}
                     placeholder="Type or paste raw patient data, encounter notes, or transcription here... Use the toolbar for formatting, code blocks, and images."
                   />
                   <div className="flex gap-3 mt-4">
                     <Button
                       onClick={async () => {
                         const currentNote = queryClient.getQueryData(["note", noteId]);
                         const currentRawNote = currentNote?.raw_note || "";
                         const plainText = new DOMParser().parseFromString(currentRawNote, "text/html").body.innerText || "";
                         const updatedHPI = (currentNote?.history_of_present_illness || "") + "\n\n" + plainText;
                         // Save both raw_note (in case unsaved) and updated HPI together
                         await base44.entities.ClinicalNote.update(noteId, { 
                           raw_note: currentRawNote,
                           history_of_present_illness: updatedHPI 
                         });
                         queryClient.setQueryData(["note", noteId], (old) => ({
                           ...old,
                           history_of_present_illness: updatedHPI
                         }));
                         toast.success("Raw data added to Clinical Note");
                       }}
                       variant="outline"
                       className="flex-1 gap-2"
                     >
                       <Plus className="w-4 h-4" /> Add to Clinical Note
                     </Button>
                   </div>
                 </div>
               </div>

               {/* AI Analysis */}
               <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Sparkles className="w-6 h-6" />
                     AI Initial Impression Analysis
                   </h3>
                   <p className="text-indigo-100 text-sm mt-1">Generate structured clinical data from raw notes</p>
                 </div>
                 <div className="p-6">
                   <Button
                     onClick={async () => {
                       if (!note.raw_note) {
                         toast.error("Please enter raw patient data first");
                         return;
                       }

                       setAnalyzingRawData(true);
                       try {
                         const result = await base44.integrations.Core.InvokeLLM({
                           prompt: `Analyze this raw patient encounter data and extract structured clinical information:

           RAW PATIENT DATA:
           ${note.raw_note}

           Extract and structure the following:
           1. Chief Complaint - primary reason for visit
           2. History of Present Illness - detailed OLDCARTS analysis
           3. Review of Systems - systematic review
           4. Initial Assessment - preliminary clinical impression
           5. Suggested Diagnoses - potential diagnoses to consider
           6. Recommended Tests - suggested labs, imaging, etc.

           Provide comprehensive, clinically accurate analysis.`,
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

                         // Update note with extracted data
                         await base44.entities.ClinicalNote.update(noteId, {
                           chief_complaint: result.chief_complaint,
                           history_of_present_illness: result.history_of_present_illness,
                           review_of_systems: result.review_of_systems,
                           assessment: result.initial_assessment
                         });

                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });

                         // Show results
                         const analysisDiv = document.getElementById('analysis-results');
                         if (analysisDiv) {
                           analysisDiv.innerHTML = `
                             <div class="space-y-4 mt-6">
                               <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                 <h4 class="font-bold text-blue-900 mb-2">Chief Complaint</h4>
                                 <p class="text-sm text-slate-700">${result.chief_complaint}</p>
                               </div>

                               <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                 <h4 class="font-bold text-purple-900 mb-2">History of Present Illness</h4>
                                 <p class="text-sm text-slate-700 whitespace-pre-wrap">${result.history_of_present_illness}</p>
                               </div>

                               <div class="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                                 <h4 class="font-bold text-amber-900 mb-2">Review of Systems</h4>
                                 <p class="text-sm text-slate-700 whitespace-pre-wrap">${result.review_of_systems}</p>
                               </div>

                               <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                 <h4 class="font-bold text-green-900 mb-2">Initial Assessment</h4>
                                 <p class="text-sm text-slate-700 whitespace-pre-wrap">${result.initial_assessment}</p>
                               </div>

                               ${result.suggested_diagnoses?.length > 0 ? `
                                 <div class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                                   <h4 class="font-bold text-indigo-900 mb-2">Suggested Diagnoses</h4>
                                   <ul class="space-y-1">
                                     ${result.suggested_diagnoses.map(dx => `
                                       <li class="text-sm text-slate-700 flex items-center gap-2">
                                         <span class="text-indigo-600">•</span> ${dx}
                                       </li>
                                     `).join('')}
                                   </ul>
                                 </div>
                               ` : ''}

                               ${result.recommended_tests?.length > 0 ? `
                                 <div class="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                                   <h4 class="font-bold text-teal-900 mb-2">Recommended Tests</h4>
                                   <ul class="space-y-1">
                                     ${result.recommended_tests.map(test => `
                                       <li class="text-sm text-slate-700 flex items-center gap-2">
                                         <span class="text-teal-600">•</span> ${test}
                                       </li>
                                     `).join('')}
                                   </ul>
                                 </div>
                               ` : ''}
                             </div>
                           `;
                         }

                         toast.success("Analysis complete - data integrated into all tabs");
                       } catch (error) {
                         console.error("Analysis failed:", error);
                         toast.error("Failed to analyze patient data");
                       } finally {
                         setAnalyzingRawData(false);
                       }
                     }}
                     disabled={analyzingRawData || !note.raw_note}
                     className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg py-6 text-base"
                   >
                     {analyzingRawData ? (
                       <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Patient Data...</>
                     ) : (
                       <><Sparkles className="w-5 h-5" /> Analyze & Extract Clinical Data</>
                     )}
                   </Button>

                   <div id="analysis-results"></div>
                 </div>
               </div>
             </div>

             {/* Next Button */}
             <div className="flex justify-end pt-4 border-t border-slate-200">
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
             </TabsContent>

             {/* Analysis Tab */}
           <TabsContent value="analysis" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Clinical Analysis</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">Comprehensive AI-powered analysis of the clinical note</p>
              </div>

              {/* AI Comprehensive Summary */}
              <AIComprehensiveSummary
                note={note}
                onApply={async (field, value) => {
                  await base44.entities.ClinicalNote.update(noteId, { [field]: value });
                  queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                }}
              />

               {/* AI Comprehensive Analysis */}
               <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Sparkles className="w-6 h-6" />
                     Generate Comprehensive Analysis
                   </h3>
                   <p className="text-emerald-100 text-sm mt-1">AI reviews all sections and provides clinical insights</p>
                 </div>
                 <div className="p-6">
                   <Button
                     onClick={async () => {
                       setAnalyzingRawData(true);
                       try {
                         const result = await base44.integrations.Core.InvokeLLM({
                           prompt: `Perform a comprehensive clinical analysis of this patient case:

PATIENT INFORMATION:
Name: ${note.patient_name}
Age: ${note.patient_age || "Not specified"}
Gender: ${note.patient_gender || "Not specified"}

CHIEF COMPLAINT:
${note.chief_complaint || "Not documented"}

HISTORY OF PRESENT ILLNESS:
${note.history_of_present_illness || "Not documented"}

VITAL SIGNS:
${note.vital_signs ? JSON.stringify(note.vital_signs, null, 2) : "Not documented"}

REVIEW OF SYSTEMS:
${note.review_of_systems || "Not documented"}

PHYSICAL EXAM:
${note.physical_exam || "Not documented"}

CURRENT ASSESSMENT:
${note.assessment || "Not documented"}

DIAGNOSES:
${note.diagnoses?.join(", ") || "Not documented"}

MEDICATIONS:
${note.medications?.join(", ") || "Not documented"}

TREATMENT PLAN:
${note.plan || "Not documented"}

Provide a comprehensive clinical analysis including:

1. **Clinical Summary**: Brief overview of the case (2-3 sentences)

2. **Key Findings**: Most important clinical findings from history, exam, and data

3. **Diagnostic Certainty**: Assessment of diagnostic confidence and what additional information would be helpful

4. **Risk Stratification**: Identify any high-risk features or red flags

5. **Gaps in Documentation**: What information is missing or needs clarification

6. **Recommended Next Steps**: Prioritized list of immediate actions needed

7. **Clinical Pearls**: Evidence-based insights or considerations for this presentation

Format as clear, actionable clinical guidance.`,
                           add_context_from_internet: true,
                           response_json_schema: {
                             type: "object",
                             properties: {
                               clinical_summary: { type: "string" },
                               key_findings: { type: "array", items: { type: "string" } },
                               diagnostic_certainty: { type: "string" },
                               risk_stratification: { type: "array", items: { type: "string" } },
                               documentation_gaps: { type: "array", items: { type: "string" } },
                               recommended_next_steps: { type: "array", items: { type: "string" } },
                               clinical_pearls: { type: "array", items: { type: "string" } }
                             }
                           }
                         });

                         // Display the analysis
                         const analysisDiv = document.getElementById('comprehensive-analysis');
                         if (analysisDiv) {
                           analysisDiv.innerHTML = `
                             <div class="space-y-6 mt-6">
                               <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                                 <h4 class="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                                   📋 Clinical Summary
                                 </h4>
                                 <p class="text-base text-slate-700 leading-relaxed">${result.clinical_summary}</p>
                               </div>

                               <div class="bg-white border-2 border-emerald-200 rounded-xl p-6">
                                 <h4 class="font-bold text-emerald-900 mb-3 flex items-center gap-2 text-lg">
                                   ✓ Key Findings
                                 </h4>
                                 <ul class="space-y-2">
                                   ${result.key_findings.map(finding => `
                                     <li class="text-sm text-slate-700 flex items-start gap-3">
                                       <span class="text-emerald-600 font-bold mt-0.5">•</span>
                                       <span>${finding}</span>
                                     </li>
                                   `).join('')}
                                 </ul>
                               </div>

                               <div class="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                 <h4 class="font-bold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                                   🎯 Diagnostic Certainty
                                 </h4>
                                 <p class="text-sm text-slate-700 leading-relaxed">${result.diagnostic_certainty}</p>
                               </div>

                               ${result.risk_stratification?.length > 0 ? `
                                 <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                                   <h4 class="font-bold text-red-900 mb-3 flex items-center gap-2 text-lg">
                                     ⚠️ Risk Stratification
                                   </h4>
                                   <ul class="space-y-2">
                                     ${result.risk_stratification.map(risk => `
                                       <li class="text-sm text-red-800 flex items-start gap-3">
                                         <span class="text-red-600 font-bold mt-0.5">⚠️</span>
                                         <span>${risk}</span>
                                       </li>
                                     `).join('')}
                                   </ul>
                                 </div>
                               ` : ''}

                               ${result.documentation_gaps?.length > 0 ? `
                                 <div class="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                   <h4 class="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">
                                     📝 Documentation Gaps
                                   </h4>
                                   <ul class="space-y-2">
                                     ${result.documentation_gaps.map(gap => `
                                       <li class="text-sm text-amber-800 flex items-start gap-3">
                                         <span class="text-amber-600 font-bold mt-0.5">•</span>
                                         <span>${gap}</span>
                                       </li>
                                     `).join('')}
                                   </ul>
                                 </div>
                               ` : ''}

                               <div class="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
                                 <h4 class="font-bold text-cyan-900 mb-3 flex items-center gap-2 text-lg">
                                   🎯 Recommended Next Steps
                                 </h4>
                                 <ol class="space-y-2">
                                   ${result.recommended_next_steps.map((step, i) => `
                                     <li class="text-sm text-slate-700 flex items-start gap-3">
                                       <span class="font-bold text-cyan-600 bg-cyan-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">${i + 1}</span>
                                       <span>${step}</span>
                                     </li>
                                   `).join('')}
                                 </ol>
                               </div>

                               ${result.clinical_pearls?.length > 0 ? `
                                 <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                                   <h4 class="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-lg">
                                     💡 Clinical Pearls
                                   </h4>
                                   <ul class="space-y-2">
                                     ${result.clinical_pearls.map(pearl => `
                                       <li class="text-sm text-indigo-800 flex items-start gap-3">
                                         <span class="text-indigo-600 font-bold mt-0.5">💡</span>
                                         <span>${pearl}</span>
                                       </li>
                                     `).join('')}
                                   </ul>
                                 </div>
                               ` : ''}
                             </div>
                           `;
                         }

                         toast.success("Comprehensive analysis complete");
                       } catch (error) {
                         console.error("Analysis failed:", error);
                         toast.error("Failed to analyze clinical note");
                       } finally {
                         setAnalyzingRawData(false);
                       }
                     }}
                     disabled={analyzingRawData || !note.chief_complaint}
                     className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-lg py-6 text-base"
                   >
                     {analyzingRawData ? (
                       <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                     ) : (
                       <><Sparkles className="w-5 h-5" /> Analyze Clinical Note</>
                     )}
                   </Button>

                   <div id="comprehensive-analysis"></div>
                 </div>
               </div>
             </div>

             {/* Next Button */}
             <div className="flex justify-end pt-4 border-t border-slate-200">
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
           </TabsContent>

           {/* AI Assistant Tab */}
             <TabsContent value="ai_assistant" className="p-6 space-y-6 overflow-y-auto">
                <AIDocumentationAssistant
                  note={note}
                  onUpdateNote={async (updates) => {
                    await base44.entities.ClinicalNote.update(noteId, updates);
                    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                  }}
                />

                {/* Next Button */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    Next <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </TabsContent>

           {/* Chief Complaint Tab */}
              <TabsContent value="chief_complaint" className="p-6 space-y-6 overflow-y-auto">
                {/* Chief Complaint Input */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
               <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-blue-600" />
                 Chief Complaint
               </label>
               <textarea
                 value={note.chief_complaint || ""}
                 onChange={(e) => {
                   queryClient.setQueryData(["note", noteId], (old) => ({
                     ...old,
                     chief_complaint: e.target.value
                   }));
                 }}
                 onBlur={async (e) => {
                   await base44.entities.ClinicalNote.update(noteId, { chief_complaint: e.target.value });
                   setLastSaved(new Date().toISOString());
                   toast.success("Note saved at " + format(new Date(), "h:mm:ss a"));
                 }}
                 placeholder="Enter the patient's chief complaint (e.g., 'Chest pain for 2 hours', 'Persistent cough for 1 week')..."
                 className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                 rows="3"
               />
               <Button
                 onClick={async () => {
                   if (!note.chief_complaint) {
                     toast.error("Please enter a chief complaint first");
                     return;
                   }

                   setExtractingData(true);
                   try {
                     const result = await base44.integrations.Core.InvokeLLM({
                       prompt: `Based on this chief complaint, generate a comprehensive clinical note structure with detailed, clinically relevant content for each section.

           CHIEF COMPLAINT: ${note.chief_complaint}

           PATIENT CONTEXT:
           - Name: ${note.patient_name}
           - Age: ${note.patient_age || "Not specified"}
           - Gender: ${note.patient_gender || "Not specified"}

           Generate detailed content for each section as if you're documenting a real patient encounter. Include:
           1. History of Present Illness: Detailed OLDCARTS analysis (Onset, Location, Duration, Character, Aggravating/Alleviating factors, Radiation, Timing, Severity)
           2. Review of Systems: Systematic review covering all relevant systems
           3. Physical Exam: Expected findings based on the chief complaint
           4. Assessment: Clinical interpretation and likely diagnoses
           5. Plan: Evidence-based diagnostic workup and treatment recommendations
           6. Clinical Impression: Overall clinical picture
           7. Diagnoses: List of primary and differential diagnoses
           8. Medications: Recommended medications with dosing if applicable
           9. Medical History: Relevant past medical history considerations

           Make everything clinically realistic and professionally documented.`,
                       add_context_from_internet: true,
                       response_json_schema: {
                         type: "object",
                         properties: {
                           history_of_present_illness: { type: "string" },
                           medical_history: { type: "string" },
                           review_of_systems: { type: "string" },
                           physical_exam: { type: "string" },
                           assessment: { type: "string" },
                           plan: { type: "string" },
                           clinical_impression: { type: "string" },
                           diagnoses: { type: "array", items: { type: "string" } },
                           medications: { type: "array", items: { type: "string" } }
                         }
                       }
                     });

                     await base44.entities.ClinicalNote.update(noteId, result);
                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                     toast.success("Clinical note generated from chief complaint");
                   } catch (error) {
                     console.error("Failed to generate from chief complaint:", error);
                     toast.error("Failed to generate clinical note");
                   } finally {
                     setExtractingData(false);
                   }
                 }}
                 disabled={extractingData || !note.chief_complaint}
                 className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl gap-2 shadow-lg"
               >
                 {extractingData ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> Generating Clinical Note...</>
                 ) : (
                   <><Sparkles className="w-4 h-4" /> Generate Complete Note from Chief Complaint</>
                 )}
               </Button>
             </div>

             {/* Vital Signs Section */}
             <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5">
               <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-emerald-600" />
                 Vital Signs
               </label>
               <VitalSignsInput
                 vitalSigns={note.vital_signs || {}}
                 onChange={async (newVitalSigns) => {
                   await base44.entities.ClinicalNote.update(noteId, { vital_signs: newVitalSigns });
                   queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                 }}
               />
             </div>

             {/* Next Button */}
             <div className="flex justify-end pt-4 border-t border-slate-200">
               <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                 Next <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
             </div>
           </TabsContent>

           {/* Summary Tab */}
           <TabsContent value="summary" className="p-6 space-y-4 overflow-y-auto">
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
             <TabsContent value="physical_exam" className="p-6 space-y-6 overflow-y-auto">
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

               {/* Next Button */}
               <div className="flex justify-end pt-4 border-t border-slate-200">
                 <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                   Next <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Button>
               </div>
             </TabsContent>

             {/* Review of Systems Tab */}
             <TabsContent value="review_of_systems" className="p-6 space-y-6 overflow-y-auto">
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

             {/* Clinical Note Tab */}
             <TabsContent value="clinical" className="p-6 overflow-y-auto space-y-6">
             {/* Smart Template Applicator */}
             <SmartTemplateApplicator
              noteId={noteId}
              note={note}
              templates={templates}
              onTemplateApplied={() => {
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
              }}
             />

             {/* Clinical Note View */}
             <ClinicalNoteView
              note={note}
              onUpdate={async (field, value) => {
                await base44.entities.ClinicalNote.update(noteId, { [field]: value });
                queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                toast.success("Updated successfully");
              }}
              noteTypes={templates}
             />

                     {/* Next Button */}
                     <div className="flex justify-end pt-4 border-t border-slate-200">
                       <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                         Next <ArrowLeft className="w-4 h-4 rotate-180" />
                       </Button>
                     </div>
                     </TabsContent>

                     {/* Guidelines & Codes Tab */}
           <TabsContent value="guidelines" className="p-6 space-y-6 overflow-y-auto">
             {/* Clinical Guidelines Panel */}
             <div>
               <SmartGuidelinePanel
                 noteContent={note.raw_note}
                 diagnoses={note.diagnoses || []}
                 medications={note.medications || []}
               />
             </div>

             {/* AI Institution Guidelines Search */}
             <div className="bg-white rounded-2xl border-2 border-indigo-300 shadow-lg overflow-hidden">
               <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <BookOpen className="w-6 h-6" />
                   Specialty Association Guidelines
                 </h3>
                 <p className="text-indigo-100 text-sm mt-1">Evidence-based guidelines from ACEP, AAFP, ACC/AHA, and other major organizations</p>
               </div>
               <div className="p-6 space-y-4">
                 <Button
                   onClick={async () => {
                     if (!note.chief_complaint && (!note.diagnoses || note.diagnoses.length === 0)) {
                       toast.error("Add a chief complaint or diagnosis first");
                       return;
                     }

                     setLoadingGuidelines(true);
                     setGuidelineRecommendations([]);
                     
                     try {
                       const searchQuery = note.chief_complaint || note.diagnoses[0];
                       
                       const result = await base44.integrations.Core.InvokeLLM({
                         prompt: `You are a medical research expert with access to the internet. Analyze and search for clinical guidelines from major medical specialty organizations for this clinical presentation.

CLINICAL CONTEXT:
Chief Complaint: ${note.chief_complaint || "N/A"}
Diagnoses: ${note.diagnoses?.join(", ") || "N/A"}
Assessment: ${note.assessment || "N/A"}

REQUIRED TASKS:
1. Search OpenEvidence.com for evidence-based guidelines on this condition
2. Search the following medical specialty organizations for relevant clinical practice guidelines:
   - ACEP (American College of Emergency Physicians) - emergency medicine
   - AAFP (American Academy of Family Physicians) - primary care
   - ACC/AHA (American College of Cardiology/American Heart Association) - cardiology
   - ADA (American Diabetes Association) - diabetes/endocrine
   - IDSA (Infectious Diseases Society of America) - infectious disease
   - ATS/CHEST (American Thoracic Society/CHEST) - pulmonary
   - AAN (American Academy of Neurology) - neurology
   - AAP (American Academy of Pediatrics) - pediatrics
   - ACOG (American College of Obstetricians and Gynecologists) - OB/GYN
   - AGA (American Gastroenterological Association) - GI
   - NICE (National Institute for Health and Care Excellence) - UK guidelines
   - ESC (European Society of Cardiology) - European cardiology

3. For EACH relevant guideline found, provide:
   - organization: The medical association (use abbreviation)
   - guideline_title: The full official title
   - summary: 2-3 sentence clinical summary of key recommendations
   - key_points: Array of 3-5 most important actionable recommendations
   - url: Direct URL to the guideline (must be real, working links)
   - year: Year of publication or last update
   - relevance: Why this guideline applies to this case (1-2 sentences)

Return 5-10 of the most relevant and current guidelines.`,
                         add_context_from_internet: true,
                         response_json_schema: {
                           type: "object",
                           properties: {
                             guidelines: {
                               type: "array",
                               items: {
                                 type: "object",
                                 properties: {
                                   organization: { type: "string" },
                                   guideline_title: { type: "string" },
                                   summary: { type: "string" },
                                   key_points: { type: "array", items: { type: "string" } },
                                   url: { type: "string" },
                                   year: { type: "string" },
                                   relevance: { type: "string" }
                                 }
                               }
                             }
                           }
                         }
                       });

                       const guidelines = result.guidelines || [];
                       setGuidelineRecommendations(guidelines.map(g => ({ ...g, isInstitutional: true })));
                       toast.success(`Found ${guidelines.length} guidelines`);
                     } catch (error) {
                       console.error("Failed to fetch guidelines:", error);
                       toast.error("Failed to fetch guidelines");
                     } finally {
                       setLoadingGuidelines(false);
                     }
                   }}
                   disabled={loadingGuidelines || (!note.chief_complaint && (!note.diagnoses || note.diagnoses.length === 0))}
                   className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg py-6 text-base"
                 >
                   {loadingGuidelines ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Searching Guidelines...</>
                   ) : (
                     <><Sparkles className="w-5 h-5" /> Search Specialty Guidelines</>
                   )}
                 </Button>

                 {/* Guidelines Results */}
                 {guidelineRecommendations.filter(g => g.isInstitutional).length > 0 && (
                   <div className="space-y-3 border-t border-slate-200 pt-4">
                     <div className="flex items-center gap-2 mb-3">
                       <Sparkles className="w-4 h-4 text-indigo-600" />
                       <h4 className="text-sm font-bold text-slate-900">
                         {guidelineRecommendations.filter(g => g.isInstitutional).length} Relevant Guidelines Found
                       </h4>
                     </div>
                     {guidelineRecommendations.filter(g => g.isInstitutional).map((guideline, idx) => (
                       <motion.div
                         key={idx}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         className="bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                       >
                         <div className="flex items-start justify-between gap-3 mb-3">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge className="bg-indigo-600 text-white font-semibold">
                                 {guideline.organization}
                               </Badge>
                               <Badge variant="outline" className="text-xs">
                                 {guideline.year}
                               </Badge>
                             </div>
                             <h5 className="font-bold text-slate-900 mb-2 text-base">
                               {guideline.guideline_title}
                             </h5>
                             <p className="text-sm text-slate-700 mb-3">
                               {guideline.summary}
                             </p>
                             
                             {/* Relevance */}
                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                               <p className="text-xs font-semibold text-blue-900 mb-1">Clinical Relevance:</p>
                               <p className="text-xs text-blue-800">{guideline.relevance}</p>
                             </div>

                             {/* Key Points */}
                             {guideline.key_points?.length > 0 && (
                               <div className="space-y-1 mb-3">
                                 <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Key Recommendations:</p>
                                 {guideline.key_points.map((point, pidx) => (
                                   <div key={pidx} className="flex items-start gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                                     <p className="text-sm text-slate-700">{point}</p>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         </div>
                         
                         <div className="flex gap-2">
                           {guideline.url && (
                             <a
                               href={guideline.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all"
                             >
                               <BookOpen className="w-4 h-4" />
                               View Guideline
                             </a>
                           )}
                           <Button
                             size="sm"
                             onClick={async () => {
                               try {
                                 let guidelineText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                                 guidelineText += `CLINICAL GUIDELINE: ${guideline.organization} - ${guideline.year}\n`;
                                 guidelineText += `${guideline.guideline_title}\n`;
                                 guidelineText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                                 guidelineText += `${guideline.summary}\n\n`;
                                 
                                 if (guideline.key_points?.length > 0) {
                                   guidelineText += `KEY RECOMMENDATIONS:\n`;
                                   guideline.key_points.forEach((point, i) => {
                                     guidelineText += `  ${i + 1}. ${point}\n`;
                                   });
                                   guidelineText += `\n`;
                                 }
                                 
                                 guidelineText += `Reference: ${guideline.url}\n`;

                                 const updatedPlan = (note.plan || "") + guidelineText;
                                 await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Guideline added to treatment plan");
                               } catch (error) {
                                 console.error("Failed to add guideline:", error);
                                 toast.error("Failed to add guideline");
                               }
                             }}
                             className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                           >
                             <Plus className="w-3.5 h-3.5" /> Add to Plan
                           </Button>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 )}
               </div>
             </div>

             {note.status === "finalized" && (
               <>
                 {/* Drug-Drug Interactions */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-red-600" />
                       Drug-Drug Interactions
                     </h3>
                   </div>

                   {loadingInteractions ? (
                     <div className="flex items-center gap-3 text-slate-500 py-8">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       <span className="text-sm">Analyzing medications...</span>
                     </div>
                   ) : drugInteractions.length > 0 ? (
                     <div className="space-y-3">
                       {drugInteractions.map((interaction, idx) => (
                         <div key={idx} className={`rounded-lg border p-4 ${
                           interaction.severity === 'severe' ? 'bg-red-50 border-red-200' :
                           interaction.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                           'bg-blue-50 border-blue-200'
                         }`}>
                           <p className="font-semibold text-sm text-slate-900">{interaction.drug_pair}</p>
                           <p className={`text-xs font-medium mt-1 ${
                             interaction.severity === 'severe' ? 'text-red-700' :
                             interaction.severity === 'moderate' ? 'text-yellow-700' :
                             'text-blue-700'
                           }`}>Severity: {interaction.severity.toUpperCase()}</p>
                           <p className="text-xs text-slate-600 mt-2"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                           <p className="text-xs text-slate-600 mt-1"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No significant drug-drug interactions detected</p>
                   )}
                 </div>





                 {/* Clinical Guidelines */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-purple-600" />
                       Evidence-Based Guidelines
                     </h3>
                     {!loadingGuidelines && guidelineRecommendations.length > 0 && (
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={fetchGuidelineRecommendations}
                         className="text-xs text-purple-600 hover:bg-purple-50 h-6"
                       >
                         Refresh
                       </Button>
                     )}
                   </div>

                   {loadingGuidelines ? (
                     <div className="flex flex-col items-center justify-center py-8 text-center">
                       <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                       <p className="text-sm font-medium text-slate-900">Fetching guidelines</p>
                       <p className="text-xs text-slate-500 mt-1">Analyzing diagnoses for relevant recommendations...</p>
                     </div>
                   ) : guidelineRecommendations.length > 0 ? (
                     <div className="space-y-4">
                       {guidelineRecommendations.map((rec, idx) => (
                         <div key={idx} className="bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200 p-5 hover:border-purple-300 transition-all">
                           <div className="flex items-start justify-between mb-3">
                             <div className="flex-1">
                               <h4 className="font-bold text-slate-900 text-base mb-2">{rec.condition}</h4>
                               <p className="text-sm text-slate-600 leading-relaxed">{rec.summary}</p>
                             </div>
                           </div>

                           {/* Diagnostic Workup */}
                           {rec.diagnostic_workup && rec.diagnostic_workup.length > 0 && (
                             <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
                               <h5 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                 <Code className="w-4 h-4" />
                                 Diagnostic Workup
                               </h5>
                               <div className="space-y-2">
                                 {rec.diagnostic_workup.map((test, i) => (
                                   <div key={i} className="bg-white rounded-lg p-3 border border-blue-100">
                                     <p className="text-sm font-semibold text-slate-900">{test.test}</p>
                                     <p className="text-xs text-slate-600 mt-1"><strong>Indication:</strong> {test.indication}</p>
                                     <p className="text-xs text-slate-600"><strong>Timing:</strong> {test.timing}</p>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Medications */}
                           {rec.medications && rec.medications.length > 0 && (
                             <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
                               <h5 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                                 <Plus className="w-4 h-4" />
                                 Medications
                               </h5>
                               <div className="space-y-3">
                                 {rec.medications.map((med, i) => (
                                   <div key={i} className="bg-white rounded-lg p-3 border border-green-100">
                                     <p className="text-sm font-semibold text-slate-900">{med.name}</p>
                                     <div className="mt-2 space-y-1">
                                       <p className="text-xs text-slate-700"><strong className="text-green-700">Dosing:</strong> {med.dosing}</p>
                                       <p className="text-xs text-slate-700"><strong className="text-green-700">Indication:</strong> {med.indication}</p>
                                       <p className="text-xs text-slate-700"><strong className="text-green-700">Duration:</strong> {med.duration}</p>
                                       {med.monitoring && (
                                         <p className="text-xs text-slate-700"><strong className="text-green-700">Monitoring:</strong> {med.monitoring}</p>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Key Recommendations */}
                           {rec.key_recommendations && rec.key_recommendations.length > 0 && (
                             <div className="mt-4 bg-amber-50 rounded-lg border border-amber-200 p-4">
                               <h5 className="text-sm font-bold text-amber-900 mb-2">Key Recommendations</h5>
                               <ul className="space-y-1">
                                 {rec.key_recommendations.map((item, i) => (
                                   <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                     <span className="text-amber-600 mt-0.5">•</span>
                                     <span>{item}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}

                           {/* Follow-up */}
                           {rec.followup && (
                             <div className="mt-4 bg-purple-50 rounded-lg border border-purple-200 p-4">
                               <h5 className="text-sm font-bold text-purple-900 mb-2">Monitoring & Follow-up</h5>
                               <div className="space-y-2">
                                 <p className="text-xs text-slate-700"><strong>Timing:</strong> {rec.followup.timing}</p>
                                 {rec.followup.parameters && rec.followup.parameters.length > 0 && (
                                   <div>
                                     <p className="text-xs font-semibold text-purple-900 mb-1">Monitor:</p>
                                     <ul className="space-y-1">
                                       {rec.followup.parameters.map((param, i) => (
                                         <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                           <span className="text-purple-600">•</span>
                                           <span>{param}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                 {rec.followup.red_flags && rec.followup.red_flags.length > 0 && (
                                   <div>
                                     <p className="text-xs font-semibold text-red-900 mb-1">Red Flags:</p>
                                     <ul className="space-y-1">
                                       {rec.followup.red_flags.map((flag, i) => (
                                         <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                                           <span className="text-red-600">⚠️</span>
                                           <span>{flag}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}

                           {rec.sources && rec.sources.length > 0 && (
                             <div className="mt-4 pt-4 border-t border-slate-200">
                               <p className="text-xs font-semibold text-slate-700 mb-2">References:</p>
                               <div className="space-y-1">
                                 {rec.sources.map((source, i) => (
                                   <p key={i} className="text-xs text-slate-600">{i + 1}. {source}</p>
                                 ))}
                               </div>
                             </div>
                           )}

                           <div className="mt-4 pt-4 border-t border-slate-200">
                             <Button
                               size="sm"
                               onClick={async () => {
                                 try {
                                   let planText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                                   planText += `GUIDELINE-BASED TREATMENT PLAN: ${rec.condition}\n`;
                                   planText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                                   if (rec.diagnostic_workup && rec.diagnostic_workup.length > 0) {
                                     planText += `DIAGNOSTIC WORKUP:\n`;
                                     rec.diagnostic_workup.forEach((test, i) => {
                                       planText += `  ${i + 1}. ${test.test}\n`;
                                       planText += `     • Indication: ${test.indication}\n`;
                                       planText += `     • Timing: ${test.timing}\n`;
                                     });
                                     planText += `\n`;
                                   }

                                   if (rec.medications && rec.medications.length > 0) {
                                     planText += `MEDICATIONS:\n`;
                                     rec.medications.forEach((med, i) => {
                                       planText += `  ${i + 1}. ${med.name}\n`;
                                       planText += `     • Dosing: ${med.dosing}\n`;
                                       planText += `     • Indication: ${med.indication}\n`;
                                       planText += `     • Duration: ${med.duration}\n`;
                                       if (med.monitoring) planText += `     • Monitoring: ${med.monitoring}\n`;
                                     });
                                     planText += `\n`;
                                   }

                                   if (rec.key_recommendations && rec.key_recommendations.length > 0) {
                                     planText += `KEY RECOMMENDATIONS:\n`;
                                     rec.key_recommendations.forEach((item, i) => {
                                       const cleanedItem = item.replace(/[*_~`]/g, '').trim();
                                       planText += `  • ${cleanedItem}\n`;
                                     });
                                     planText += `\n`;
                                   }

                                   if (rec.followup) {
                                     planText += `MONITORING & FOLLOW-UP:\n`;
                                     planText += `  • Follow-up: ${rec.followup.timing}\n`;
                                     if (rec.followup.parameters && rec.followup.parameters.length > 0) {
                                       planText += `  • Monitor: ${rec.followup.parameters.join(', ')}\n`;
                                     }
                                     if (rec.followup.red_flags && rec.followup.red_flags.length > 0) {
                                       planText += `  • Red Flags: ${rec.followup.red_flags.join('; ')}\n`;
                                     }
                                   }

                                   const updatedPlan = (note.plan || "") + planText;
                                   await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                   await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                   toast.success("Guideline added to plan");
                                   } catch (error) {
                                   console.error("Failed to add to plan:", error);
                                   toast.error("Failed to add to plan. Please try again.");
                                   }
                               }}
                               className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                             >
                               <Check className="w-3.5 h-3.5" /> Add to Plan
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 text-center py-8">No guideline recommendations available</p>
                   )}
                 </div>
                 </>
                 )}
                 </TabsContent>

                 {/* Result Analysis Tab */}
                 <TabsContent value="imaging" className="p-6 space-y-6 overflow-y-auto">
                   <div className="flex gap-3">
                     <Button
                       variant="outline"
                       onClick={() => downloadResultsAnalysis('pdf')}
                       className="flex-1 rounded-xl gap-2 border-blue-300 hover:bg-blue-50"
                     >
                       <Download className="w-4 h-4" />
                       Download PDF
                     </Button>
                     <Button
                       variant="outline"
                       onClick={() => downloadResultsAnalysis('text')}
                       className="flex-1 rounded-xl gap-2 border-slate-300 hover:bg-slate-50"
                     >
                       <Download className="w-4 h-4" />
                       Download Text
                     </Button>
                   </div>
                   <div className="space-y-6">
                     {/* Left Column - Imaging Analysis */}
                     <div>
                       <ImagingAnalysis
                         noteId={noteId}
                         onAddToNote={async (imagingText, linkedFindings) => {
                           try {
                             const updates = {};
                             updates.assessment = (note.assessment || "") + imagingText;

                             if (linkedFindings && Object.keys(linkedFindings).length > 0) {
                               Object.entries(linkedFindings).forEach(([findingKey, sections]) => {
                                 sections.forEach((sectionId) => {
                                   const fieldMap = {
                                     assessment: "assessment",
                                     plan: "plan",
                                     history_of_present_illness: "history_of_present_illness",
                                   };

                                   if (fieldMap[sectionId]) {
                                     const sectionText = `\n\n[Imaging Finding] ${imagingText.split("\n")[0]}`;
                                     updates[fieldMap[sectionId]] =
                                       (updates[fieldMap[sectionId]] || note[fieldMap[sectionId]] || "") +
                                       sectionText;
                                   }
                                 });
                               });
                             }

                             await base44.entities.ClinicalNote.update(noteId, updates);
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               toast.success("Imaging summary added to clinical note");
                           } catch (error) {
                             console.error("Failed to add imaging to note:", error);
                             alert("Failed to add imaging. Please try again.");
                           }
                         }}
                       />
                     </div>

                     {/* Right Column - Laboratory Analysis */}
                     <div>
                       <LabsAnalysis
                         noteId={noteId}
                         onAddToNote={async (labsText) => {
                           try {
                             const updatedAssessment = (note.assessment || "") + labsText;
                             await base44.entities.ClinicalNote.update(noteId, { 
                               assessment: updatedAssessment
                             });
                             queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             toast.success("Lab summary added to clinical note");
                           } catch (error) {
                             console.error("Failed to add labs to note:", error);
                             alert("Failed to add labs. Please try again.");
                           }
                         }}
                       />
                     </div>
                     </div>

                     {/* EKG Analysis Section */}
                     <div className="mt-6">
                     <EKGAnalysis
                       noteId={noteId}
                       onAddToNote={async (ekgText) => {
                         try {
                           const updatedAssessment = (note.assessment || "") + ekgText;
                           await base44.entities.ClinicalNote.update(noteId, { 
                             assessment: updatedAssessment
                           });
                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                           toast.success("EKG analysis added to clinical note");
                         } catch (error) {
                           console.error("Failed to add EKG to note:", error);
                           alert("Failed to add EKG. Please try again.");
                         }
                       }}
                     />
                     </div>

                     {/* Next Button */}
                     <div className="flex justify-end pt-4 border-t border-slate-200">
                       <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                         Next <ArrowLeft className="w-4 h-4 rotate-180" />
                       </Button>
                     </div>
                     </TabsContent>



                     {/* Initial Impression Tab */}
                     <TabsContent value="initial_impression" className="p-6 space-y-6 overflow-y-auto">
                     <div className="max-w-4xl mx-auto space-y-6">
                     {/* Header */}
                     <div className="text-center mb-8">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
                         <Sparkles className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">Initial Impression</h2>
                       <p className="text-slate-600">AI-powered analysis of presenting symptoms and differential diagnoses</p>
                     </div>

                     {/* Clinical Context Summary */}
                     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                       <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                         <Activity className="w-5 h-5 text-blue-600" />
                         Clinical Context
                       </h3>
                       <div className="grid md:grid-cols-2 gap-4">
                         {note.chief_complaint && (
                           <div className="bg-white rounded-lg p-4 border border-blue-200">
                             <p className="text-xs font-semibold text-blue-900 mb-2">Chief Complaint</p>
                             <p className="text-sm text-slate-700">{note.chief_complaint}</p>
                           </div>
                         )}
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

                     {/* Generate Differential Diagnosis */}
                     <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
                       <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Sparkles className="w-6 h-6" />
                           AI Differential Diagnosis Generator
                         </h3>
                         <p className="text-indigo-100 text-sm mt-1">Analyze presenting symptoms and generate ranked differential diagnoses</p>
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
                             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg py-6 text-base"
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
                             <Activity className="w-5 h-5 text-indigo-600" />
                             Differential Diagnoses
                           </h3>
                           <Badge className="bg-indigo-100 text-indigo-800">
                             {differentialDiagnosis.length} diagnoses
                           </Badge>
                         </div>
                         <div className="p-6 space-y-4">
                           {differentialDiagnosis.map((diff, idx) => (
                             <motion.div
                               key={idx}
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 hover:border-indigo-300 transition-all"
                             >
                               <div className="flex items-start justify-between mb-3">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-2">
                                     <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-md">
                                       {idx + 1}
                                     </div>
                                     <h4 className="text-lg font-bold text-slate-900">{diff.diagnosis}</h4>
                                   </div>
                                   <div className="flex items-center gap-3 ml-11">
                                     <span className="text-xs font-semibold text-indigo-700">Likelihood:</span>
                                     <div className="flex-1 max-w-xs h-3 bg-indigo-100 rounded-full overflow-hidden border border-indigo-200">
                                       <div 
                                         className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                                         style={{ width: `${(diff.likelihood_rank / 5) * 100}%` }} 
                                       />
                                     </div>
                                     <Badge className="bg-indigo-600 text-white font-bold">
                                       {diff.likelihood_rank}/5
                                     </Badge>
                                   </div>
                                 </div>
                               </div>

                               <div className="ml-11 space-y-3">
                                 <div className="bg-white rounded-lg p-4 border border-indigo-200">
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
                                   className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white mt-3"
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

                                 const updatedAssessment = (note.assessment || "") + "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nINITIAL IMPRESSION - DIFFERENTIAL DIAGNOSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" + diffText;
                                 await base44.entities.ClinicalNote.update(noteId, { assessment: updatedAssessment });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Differential diagnosis added to assessment");
                                 } catch (error) {
                                 console.error("Failed to add differential:", error);
                                 toast.error("Failed to add differential diagnosis");
                                 }
                                 }}
                                 className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg"
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
                         <TabDataPreview tabId="imaging" note={note} />
                         <ClinicalNotePreviewButton note={note} />
                       </div>
                       <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                         Next <ArrowLeft className="w-4 h-4 rotate-180" />
                       </Button>
                     </div>
                     </TabsContent>

                     {/* Calculators Tab */}
                     <TabsContent value="calculators" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                       <div className="max-w-5xl mx-auto space-y-8">
                         {/* Header */}
                         <div className="text-center mb-8">
                           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
                             <Activity className="w-8 h-8 text-white" />
                           </div>
                           <h2 className="text-3xl font-bold text-slate-900 mb-2">Medical Calculators</h2>
                           <p className="text-slate-600 max-w-2xl mx-auto">Evidence-based clinical decision tools integrated with your note</p>
                         </div>

                         {/* Quick Access Calculators */}
                         <div className="grid md:grid-cols-2 gap-6">
                           {/* BMI Calculator */}
                           <div className="bg-white rounded-xl border-2 border-green-300 shadow-lg overflow-hidden">
                             <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white">
                               <h3 className="font-bold flex items-center gap-2">
                                 <Activity className="w-5 h-5" />
                                 BMI Calculator
                               </h3>
                             </div>
                             <div className="p-6">
                               <BMICalculator 
                                 onAddToNote={async (data) => {
                                   const mdmText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCALCULATOR: ${data.name}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nInputs: ${JSON.stringify(data.inputs)}\n\nResult: ${data.result}\n\nInterpretation: ${data.interpretation}\n\nReference: ${data.url}\n`;
                                   await base44.entities.ClinicalNote.update(noteId, { 
                                     mdm: (note.mdm || "") + mdmText 
                                   });
                                   queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                   toast.success("Calculator result added to MDM");
                                 }} 
                               />
                             </div>
                           </div>

                           {/* Creatinine Clearance Calculator */}
                           <div className="bg-white rounded-xl border-2 border-purple-300 shadow-lg overflow-hidden">
                             <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
                               <h3 className="font-bold flex items-center gap-2">
                                 <Activity className="w-5 h-5" />
                                 Creatinine Clearance
                               </h3>
                             </div>
                             <div className="p-6">
                               <CreatinineClearanceCalculator 
                                 onAddToNote={async (data) => {
                                   const mdmText = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCALCULATOR: ${data.name}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nInputs: ${JSON.stringify(data.inputs)}\n\nResult: ${data.result}\n\nInterpretation: ${data.interpretation}\n\nReference: ${data.url}\n`;
                                   await base44.entities.ClinicalNote.update(noteId, { 
                                     mdm: (note.mdm || "") + mdmText 
                                   });
                                   queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                   toast.success("Calculator result added to MDM");
                                 }} 
                               />
                             </div>
                           </div>
                         </div>

                         {/* AI Calculator Recommendations */}
                         <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-lg overflow-hidden">
                           <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <Sparkles className="w-6 h-6" />
                               AI Recommended Calculators
                             </h3>
                             <p className="text-indigo-100 text-sm mt-1">Get personalized calculator suggestions based on this clinical note</p>
                           </div>
                           <div className="p-6">
                             <Button
                               onClick={async () => {
                                 setLoadingRecommendations(true);
                                 try {
                                   const result = await base44.integrations.Core.InvokeLLM({
                                     prompt: `Based on this clinical presentation, recommend the most relevant medical calculators:

                     CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}
                     DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}
                     ASSESSMENT: ${note.assessment || "N/A"}
                     VITAL SIGNS: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "N/A"}

                     Recommend 5-8 specific medical calculators from MDCalc that would be most clinically useful. For each:
                     1. calculator_name: Full official name
                     2. category: Medical specialty
                     3. clinical_use: Why this is relevant (1-2 sentences)
                     4. priority: high, medium, or low
                     5. mdcalc_id: The MDCalc ID (from URL path)`,
                                     add_context_from_internet: true,
                                     response_json_schema: {
                                       type: "object",
                                       properties: {
                                         recommendations: {
                                           type: "array",
                                           items: {
                                             type: "object",
                                             properties: {
                                               calculator_name: { type: "string" },
                                               category: { type: "string" },
                                               clinical_use: { type: "string" },
                                               priority: { type: "string", enum: ["high", "medium", "low"] },
                                               mdcalc_id: { type: "string" }
                                             }
                                           }
                                         }
                                       }
                                     }
                                   });

                                   const recommendationsDiv = document.getElementById('calculator-recommendations');
                                   if (recommendationsDiv && result.recommendations) {
                                     recommendationsDiv.innerHTML = `
                                       <div class="space-y-3 mt-6">
                                         ${result.recommendations.map((rec, idx) => `
                                           <div class="rounded-lg border-2 p-4 ${
                                             rec.priority === 'high' ? 'bg-red-50 border-red-300' :
                                             rec.priority === 'medium' ? 'bg-amber-50 border-amber-300' :
                                             'bg-blue-50 border-blue-300'
                                           }">
                                             <div class="flex items-start justify-between gap-3">
                                               <div class="flex-1">
                                                 <div class="flex items-center gap-2 mb-2">
                                                   <span class="inline-flex px-2 py-1 rounded text-xs font-bold ${
                                                     rec.priority === 'high' ? 'bg-red-600 text-white' :
                                                     rec.priority === 'medium' ? 'bg-amber-600 text-white' :
                                                     'bg-blue-600 text-white'
                                                   }">${rec.priority.toUpperCase()}</span>
                                                   <span class="text-xs text-slate-600">${rec.category}</span>
                                                 </div>
                                                 <h5 class="font-bold text-slate-900 mb-2">${rec.calculator_name}</h5>
                                                 <p class="text-sm text-slate-700 mb-3">${rec.clinical_use}</p>
                                                 ${rec.mdcalc_id ? `
                                                   <a href="https://www.mdcalc.com/calc/${rec.mdcalc_id}" target="_blank" rel="noopener noreferrer" 
                                                      class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                                     Open Calculator →
                                                   </a>
                                                 ` : ''}
                                               </div>
                                             </div>
                                           </div>
                                         `).join('')}
                                       </div>
                                     `;
                                   }
                                   toast.success("Calculator recommendations generated");
                                 } catch (error) {
                                   console.error("Failed to get recommendations:", error);
                                   toast.error("Failed to generate recommendations");
                                 } finally {
                                   setLoadingRecommendations(false);
                                 }
                               }}
                               disabled={loadingRecommendations || !note.chief_complaint}
                               className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 shadow-lg py-6 text-base"
                             >
                               {loadingRecommendations ? (
                                 <><Loader2 className="w-5 h-5 animate-spin" /> Getting Recommendations...</>
                               ) : (
                                 <><Sparkles className="w-5 h-5" /> Get Calculator Recommendations</>
                               )}
                             </Button>

                             <div id="calculator-recommendations"></div>
                           </div>
                         </div>

                         {/* Medication Dosing Lookup */}
                         <div className="bg-white rounded-xl border-2 border-blue-300 shadow-lg overflow-hidden">
                           <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <Pill className="w-6 h-6" />
                               Medication Dosing Lookup
                             </h3>
                             <p className="text-blue-100 text-sm mt-1">Quick reference for medication dosing and administration</p>
                           </div>
                           <div className="p-6">
                             <MedicationDosingLookup />
                           </div>
                         </div>
                       </div>

                       {/* Next Button */}
                       <div className="flex justify-end pt-4 border-t border-slate-200">
                         <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                           Next <ArrowLeft className="w-4 h-4 rotate-180" />
                         </Button>
                       </div>
                     </TabsContent>

                     {/* MDM Tab */}
                     <TabsContent value="mdm" className="p-6 space-y-6 overflow-y-auto">
                     <AIMDMAnalyzer
                     note={note}
                     onAddToNote={async (mdmText) => {
                       const updatedNote = {
                         medical_history: (note.medical_history || "") + mdmText
                       };
                       await base44.entities.ClinicalNote.update(noteId, updatedNote);
                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       toast.success("Medical Decision Making added to clinical note");
                     }}
                     />

                     {/* Next Button */}
                     <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                       <div className="flex gap-2">
                         <TabDataPreview tabId="calculators" note={note} />
                         <ClinicalNotePreviewButton note={note} />
                       </div>
                       <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                         Next <ArrowLeft className="w-4 h-4 rotate-180" />
                       </Button>
                     </div>
                     </TabsContent>

                     {/* Plan Tab */}
                                     <TabsContent value="plan" className="p-6 space-y-6 overflow-y-auto">
                                       {/* AI Treatment Plan Analyzer */}
                                       <AITreatmentPlanAnalyzer
                                         note={note}
                                         onAddToPlan={async (planText) => {
                                           const updatedPlan = (note.plan || "") + planText;
                                           await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                         }}
                                       />

                                       {/* AI Guideline Suggestions */}
                                       <AIGuidelineSuggestions
                                         note={note}
                                         onAddToPlan={async (text) => {
                                           await base44.entities.ClinicalNote.update(noteId, { plan: (note.plan || "") + text });
                                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                         }}
                                       />

                                       {/* Workflow Automation */}
                                       <ClinicalWorkflowAutomation
                                         note={note}
                                         noteId={noteId}
                                         onUpdateNote={async (updates) => {
                                           await base44.entities.ClinicalNote.update(noteId, updates);
                                           queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                         }}
                                       />

                       <>
                     {/* Follow-up Tests */}
                       <div>
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                             <Beaker className="w-4 h-4 text-emerald-600" />
                             Suggested Follow-up Tests & Consultations
                           </h3>
                         </div>

                         {loadingFollowUp ? (
                           <div className="flex items-center gap-3 text-slate-500 py-8">
                             <Loader2 className="w-5 h-5 animate-spin" />
                             <span className="text-sm">Generating suggestions...</span>
                           </div>
                         ) : followUpTests.length > 0 ? (
                           <div className="space-y-3">
                             {followUpTests.map((test, idx) => (
                               <div key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                 <p className="font-semibold text-sm text-slate-900">{test.test_name}</p>
                                 <div className="mt-2 flex gap-4 flex-wrap">
                                   <span className={`text-xs px-2 py-1 rounded font-medium ${
                                     test.type === 'lab' ? 'bg-blue-100 text-blue-700' :
                                     test.type === 'imaging' ? 'bg-purple-100 text-purple-700' :
                                     test.type === 'consult' ? 'bg-orange-100 text-orange-700' :
                                     'bg-slate-100 text-slate-700'
                                   }`}>{test.type.charAt(0).toUpperCase() + test.type.slice(1)}</span>
                                   <span className="text-xs text-slate-600"><strong>Timing:</strong> {test.timing}</span>
                                 </div>
                                 <p className="text-xs text-slate-600 mt-3">{test.clinical_rationale}</p>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <p className="text-sm text-slate-500 text-center py-8">No follow-up tests suggested</p>
                         )}
                       </div>
                       </>
                       </TabsContent>

                 {/* Treatments Tab */}
                 <TabsContent value="treatments" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                   <div className="max-w-6xl mx-auto space-y-8">
                     {/* Header Section */}
                     <div className="text-center mb-8">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
                         <Pill className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">Treatment & Medications</h2>
                       <p className="text-slate-600 max-w-2xl mx-auto">Evidence-based treatment protocols and medication management</p>
                     </div>
                     {/* AI Initial ER Treatment Recommendations */}
                     <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-xl overflow-hidden">
                       <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Activity className="w-6 h-6" />
                           Initial ER Treatment Protocol
                         </h3>
                         <p className="text-emerald-50 text-sm mt-1">AI-generated evidence-based emergency interventions</p>
                       </div>
                       <div className="p-8">
                         {note.chief_complaint ? (
                           <Button
                             onClick={async () => {
                               try {
                                 const result = await base44.integrations.Core.InvokeLLM({
                                   prompt: `Generate comprehensive Initial ER Treatment Protocol for the following patient presentation:

                 CHIEF COMPLAINT: ${note.chief_complaint}
                 HISTORY: ${note.history_of_present_illness || "Not documented"}
                 VITAL SIGNS: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "Not documented"}
                 ASSESSMENT: ${note.assessment || "Not documented"}

                 Provide immediate ER treatment recommendations including:
                 1. IMMEDIATE INTERVENTIONS (within 5 minutes)
                 - Critical stabilization measures
                 - Oxygen therapy if needed
                 - IV access and fluids
                 - Monitoring requirements

                 2. MEDICATIONS
                 - Emergency medications with specific dosing
                 - Route, dose, frequency
                 - Clinical indication for each

                 3. DIAGNOSTIC WORKUP
                 - Urgent labs and tests
                 - Imaging studies
                 - Priority order

                 4. MONITORING & REASSESSMENT
                 - Vital signs frequency
                 - Clinical parameters to track
                 - Reassessment intervals

                 5. DISPOSITION CONSIDERATIONS
                 - Admission criteria
                 - Observation vs discharge
                 - Specialist consultation triggers

                 Base recommendations on current emergency medicine guidelines and best practices.`,
                                   add_context_from_internet: true,
                                   response_json_schema: {
                                     type: "object",
                                     properties: {
                                       immediate_interventions: {
                                         type: "array",
                                         items: {
                                           type: "object",
                                           properties: {
                                             intervention: { type: "string" },
                                             timing: { type: "string" },
                                             rationale: { type: "string" }
                                           }
                                         }
                                       },
                                       emergency_medications: {
                                         type: "array",
                                         items: {
                                           type: "object",
                                           properties: {
                                             medication: { type: "string" },
                                             dose: { type: "string" },
                                             route: { type: "string" },
                                             indication: { type: "string" }
                                           }
                                         }
                                       },
                                       diagnostic_workup: {
                                         type: "array",
                                         items: {
                                           type: "object",
                                           properties: {
                                             test: { type: "string" },
                                             priority: { type: "string" },
                                             rationale: { type: "string" }
                                           }
                                         }
                                       },
                                       monitoring: {
                                         type: "object",
                                         properties: {
                                           vital_signs_frequency: { type: "string" },
                                           parameters_to_track: { type: "array", items: { type: "string" } },
                                           reassessment_interval: { type: "string" }
                                         }
                                       },
                                       disposition: {
                                         type: "object",
                                         properties: {
                                           admission_criteria: { type: "array", items: { type: "string" } },
                                           observation_criteria: { type: "array", items: { type: "string" } },
                                           consultation_triggers: { type: "array", items: { type: "string" } }
                                         }
                                       }
                                     }
                                   }
                                 });

                                 // Display the recommendations
                                 const recommendationsDiv = document.getElementById('er-treatment-recommendations');
                                 if (recommendationsDiv) {
                                   recommendationsDiv.innerHTML = `
                                     <div class="space-y-4 mt-4">
                                       ${result.immediate_interventions?.length > 0 ? `
                                         <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                           <h4 class="font-bold text-red-900 mb-3 flex items-center gap-2">
                                             <span class="text-xl">🚨</span>
                                             Immediate Interventions
                                           </h4>
                                           <div class="space-y-2">
                                             ${result.immediate_interventions.map(item => `
                                               <div class="bg-white rounded p-3 border border-red-100">
                                                 <p class="font-semibold text-sm text-slate-900">${item.intervention}</p>
                                                 <p class="text-xs text-red-700 mt-1"><strong>Timing:</strong> ${item.timing}</p>
                                                 <p class="text-xs text-slate-600 mt-1">${item.rationale}</p>
                                               </div>
                                             `).join('')}
                                           </div>
                                         </div>
                                       ` : ''}

                                       ${result.emergency_medications?.length > 0 ? `
                                         <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                           <h4 class="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                             <span class="text-xl">💊</span>
                                             Emergency Medications
                                           </h4>
                                           <div class="space-y-2">
                                             ${result.emergency_medications.map(med => `
                                               <div class="bg-white rounded p-3 border border-blue-100">
                                                 <p class="font-semibold text-sm text-slate-900">${med.medication}</p>
                                                 <div class="grid grid-cols-2 gap-2 mt-2">
                                                   <p class="text-xs text-slate-600"><strong>Dose:</strong> ${med.dose}</p>
                                                   <p class="text-xs text-slate-600"><strong>Route:</strong> ${med.route}</p>
                                                 </div>
                                                 <p class="text-xs text-blue-700 mt-1"><strong>Indication:</strong> ${med.indication}</p>
                                               </div>
                                             `).join('')}
                                           </div>
                                         </div>
                                       ` : ''}

                                       ${result.diagnostic_workup?.length > 0 ? `
                                         <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                           <h4 class="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                             <span class="text-xl">🔬</span>
                                             Diagnostic Workup
                                           </h4>
                                           <div class="space-y-2">
                                             ${result.diagnostic_workup.map(test => `
                                               <div class="bg-white rounded p-3 border border-purple-100">
                                                 <div class="flex items-start justify-between">
                                                   <p class="font-semibold text-sm text-slate-900">${test.test}</p>
                                                   <span class="text-xs px-2 py-1 rounded ${
                                                     test.priority?.toLowerCase() === 'stat' ? 'bg-red-100 text-red-700' :
                                                     test.priority?.toLowerCase() === 'urgent' ? 'bg-orange-100 text-orange-700' :
                                                     'bg-slate-100 text-slate-700'
                                                   }">${test.priority}</span>
                                                 </div>
                                                 <p class="text-xs text-slate-600 mt-1">${test.rationale}</p>
                                               </div>
                                             `).join('')}
                                           </div>
                                         </div>
                                       ` : ''}

                                       ${result.monitoring ? `
                                         <div class="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                                           <h4 class="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                             <span class="text-xl">📊</span>
                                             Monitoring & Reassessment
                                           </h4>
                                           <div class="bg-white rounded p-3 border border-amber-100 space-y-2">
                                             <p class="text-xs text-slate-700"><strong>Vital Signs:</strong> ${result.monitoring.vital_signs_frequency}</p>
                                             <p class="text-xs text-slate-700"><strong>Reassessment:</strong> ${result.monitoring.reassessment_interval}</p>
                                             ${result.monitoring.parameters_to_track?.length > 0 ? `
                                               <div class="mt-2">
                                                 <p class="text-xs font-semibold text-amber-900 mb-1">Parameters to Track:</p>
                                                 <ul class="space-y-1">
                                                   ${result.monitoring.parameters_to_track.map(param => `
                                                     <li class="text-xs text-slate-600 flex items-center gap-1">
                                                       <span>•</span> ${param}
                                                     </li>
                                                   `).join('')}
                                                 </ul>
                                               </div>
                                             ` : ''}
                                           </div>
                                         </div>
                                       ` : ''}

                                       ${result.disposition ? `
                                         <div class="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
                                           <h4 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                             <span class="text-xl">🏥</span>
                                             Disposition Considerations
                                           </h4>
                                           <div class="space-y-3">
                                             ${result.disposition.admission_criteria?.length > 0 ? `
                                               <div>
                                                 <p class="text-xs font-semibold text-slate-700 mb-1">Admission Criteria:</p>
                                                 <ul class="space-y-1">
                                                   ${result.disposition.admission_criteria.map(criteria => `
                                                     <li class="text-xs text-slate-600">• ${criteria}</li>
                                                   `).join('')}
                                                 </ul>
                                               </div>
                                             ` : ''}
                                             ${result.disposition.consultation_triggers?.length > 0 ? `
                                               <div>
                                                 <p class="text-xs font-semibold text-slate-700 mb-1">Consultation Triggers:</p>
                                                 <ul class="space-y-1">
                                                   ${result.disposition.consultation_triggers.map(trigger => `
                                                     <li class="text-xs text-slate-600">• ${trigger}</li>
                                                   `).join('')}
                                                 </ul>
                                               </div>
                                             ` : ''}
                                           </div>
                                         </div>
                                       ` : ''}

                                       <button onclick="
                                         const protocol = ${JSON.stringify(result).replace(/"/g, '&quot;')};
                                         let protocolText = '\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\nINITIAL ER TREATMENT PROTOCOL\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n';

                                         if (protocol.immediate_interventions?.length > 0) {
                                           protocolText += 'IMMEDIATE INTERVENTIONS:\\n';
                                           protocol.immediate_interventions.forEach((item, i) => {
                                             protocolText += \`  \${i + 1}. \${item.intervention} (\${item.timing})\\n     \${item.rationale}\\n\`;
                                           });
                                           protocolText += '\\n';
                                         }

                                         if (protocol.emergency_medications?.length > 0) {
                                           protocolText += 'EMERGENCY MEDICATIONS:\\n';
                                           protocol.emergency_medications.forEach((med, i) => {
                                             protocolText += \`  \${i + 1}. \${med.medication}\\n     Dose: \${med.dose}\\n     Route: \${med.route}\\n     Indication: \${med.indication}\\n\`;
                                           });
                                           protocolText += '\\n';
                                         }

                                         if (protocol.diagnostic_workup?.length > 0) {
                                           protocolText += 'DIAGNOSTIC WORKUP:\\n';
                                           protocol.diagnostic_workup.forEach((test, i) => {
                                             protocolText += \`  \${i + 1}. \${test.test} (\${test.priority})\\n     \${test.rationale}\\n\`;
                                           });
                                           protocolText += '\\n';
                                         }

                                         window.dispatchEvent(new CustomEvent('addERProtocolToPlan', { detail: protocolText }));
                                       " class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                         <span>✓</span>
                                         Add Protocol to Treatment Plan
                                       </button>
                                     </div>
                                   `;
                                 }

                                 toast.success("ER treatment protocol generated");
                               } catch (error) {
                                 console.error("Failed to generate ER treatment:", error);
                                 toast.error("Failed to generate treatment recommendations");
                               }
                             }}
                             className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold gap-2"
                           >
                             <Sparkles className="w-4 h-4" />
                             Generate Initial ER Treatment Protocol
                           </Button>
                         ) : (
                           <div className="text-center py-12">
                             <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                               <AlertCircle className="w-10 h-10 text-slate-400" />
                             </div>
                             <p className="text-slate-600 font-medium mb-1">Chief Complaint Required</p>
                             <p className="text-sm text-slate-500">Add a chief complaint to generate ER treatment recommendations</p>
                           </div>
                         )}
                         <div id="er-treatment-recommendations"></div>
                         </div>
                         </div>

                         {/* Two Column Layout */}
                         <div className="grid lg:grid-cols-2 gap-6">
                         {/* Left Column - Medication Safety */}
                         <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xl overflow-hidden">
                         <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-white">
                           <h3 className="font-bold text-lg flex items-center gap-2">
                             <AlertCircle className="w-6 h-6" />
                             Medication Safety Alerts
                           </h3>
                           <p className="text-red-50 text-sm mt-1">Real-time contraindication screening</p>
                         </div>
                         <div className="p-6">
                           <ClinicalDecisionSupport
                             type="contraindications"
                             note={note}
                             onAddToNote={async (warning) => {
                               const updatedPlan = (note.plan || "") + "\n\n⚠️ MEDICATION ALERT: " + warning;
                               await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             }}
                           />
                         </div>
                         </div>

                         {/* Right Column - Treatment Plan Selector */}
                         <div className="bg-white rounded-2xl border-2 border-green-200 shadow-xl overflow-hidden">
                         <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5 text-white">
                           <h3 className="font-bold text-lg flex items-center gap-2">
                             <FileText className="w-6 h-6" />
                             Treatment Plan Builder
                           </h3>
                           <p className="text-green-50 text-sm mt-1">Structured treatment planning</p>
                         </div>
                         <div className="p-6">
                           <TreatmentPlanSelector
                             plan={note.plan || ""}
                             onAddToNote={async (selectedPlan) => {
                               await base44.entities.ClinicalNote.update(noteId, { plan: selectedPlan });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               toast.success("Plan sections updated");
                             }}
                           />
                         </div>
                         </div>
                         </div>

                         {/* Medications Section */}
                         <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xl overflow-hidden">
                         <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-5 text-white">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Pill className="w-6 h-6" />
                           Current Medications
                         </h3>
                         <p className="text-blue-50 text-sm mt-1">
                           {note.medications?.length || 0} {note.medications?.length === 1 ? 'medication' : 'medications'} prescribed
                         </p>
                         </div>
                         <div className="p-8 space-y-6">
                         {/* AI Recommendations */}
                         <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
                           <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                             <Sparkles className="w-4 h-4" />
                             AI Medication Recommendations
                           </h4>
                           <MedicationRecommendations
                             note={note}
                             onAddMedications={async (meds) => {
                               const updatedMeds = [...(note.medications || []), ...meds];
                               await base44.entities.ClinicalNote.update(noteId, { medications: updatedMeds });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                             }}
                           />
                         </div>

                         {/* Current Medications List */}
                         <div>
                           <h4 className="text-sm font-bold text-slate-900 mb-4">Prescribed Medications</h4>
                           {note.medications && note.medications.length > 0 ? (
                             <div className="space-y-3">
                               {note.medications.map((med, idx) => (
                                 <motion.div
                                   key={idx}
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.05 }}
                                   className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 bg-gradient-to-r from-white to-blue-50 hover:border-blue-300 hover:shadow-md transition-all"
                                 >
                                   <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                     {idx + 1}
                                   </div>
                                   <div className="flex-1">
                                     <p className="text-sm font-semibold text-slate-900 leading-relaxed">{med}</p>
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
                               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                 <Pill className="w-8 h-8 text-slate-400" />
                               </div>
                               <p className="text-sm font-medium text-slate-600">No medications documented</p>
                               <p className="text-xs text-slate-500 mt-1">Add medications using AI recommendations above</p>
                             </div>
                           )}
                         </div>
                         </div>
                         </div>

                     {note.medications && note.medications.length > 0 && (
                       <>
                         {/* Drug Interactions Analysis */}
                         <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-xl overflow-hidden">
                           <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <AlertCircle className="w-6 h-6" />
                               Drug-Drug Interactions
                             </h3>
                             <p className="text-orange-50 text-sm mt-1">Automated safety screening</p>
                           </div>

                           <div className="p-8">
                             {loadingInteractions ? (
                               <div className="flex flex-col items-center justify-center py-12">
                                 <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                                 <p className="text-slate-600 font-medium">Analyzing medication interactions...</p>
                               </div>
                             ) : drugInteractions.length > 0 ? (
                               <div className="space-y-4">
                                 {drugInteractions.map((interaction, idx) => (
                                   <motion.div
                                     key={idx}
                                     initial={{ opacity: 0, y: 10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ delay: idx * 0.05 }}
                                     className={`rounded-xl border-2 p-5 ${
                                       interaction.severity === 'severe' ? 'bg-red-50 border-red-300' :
                                       interaction.severity === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
                                       'bg-blue-50 border-blue-300'
                                     }`}
                                   >
                                     <div className="flex items-start justify-between mb-3">
                                       <p className="font-bold text-slate-900">{interaction.drug_pair}</p>
                                       <Badge className={`${
                                         interaction.severity === 'severe' ? 'bg-red-600' :
                                         interaction.severity === 'moderate' ? 'bg-yellow-600' :
                                         'bg-blue-600'
                                       } text-white`}>
                                         {interaction.severity.toUpperCase()}
                                       </Badge>
                                     </div>
                                     <div className="space-y-2">
                                       <p className="text-sm text-slate-700"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                                       <p className="text-sm text-slate-700"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                                     </div>
                                   </motion.div>
                                 ))}
                                 <Button
                                   onClick={async () => {
                                     try {
                                       const interactionText = drugInteractions.map((int, idx) => 
                                         `${idx + 1}. ${int.drug_pair} (${int.severity.toUpperCase()})\n   Mechanism: ${int.mechanism}\n   Recommendation: ${int.recommendation}`
                                       ).join('\n\n');

                                       const updatedPlan = (note.plan || "") + "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDRUG INTERACTION ALERTS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" + interactionText;
                                       await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                       queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                       toast.success("Drug interactions added to plan");
                                     } catch (error) {
                                       console.error("Failed to add interactions:", error);
                                       toast.error("Failed to add drug interactions");
                                     }
                                   }}
                                   className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg gap-2"
                                 >
                                   <Plus className="w-4 h-4" /> Add Interactions to Treatment Plan
                                 </Button>
                               </div>
                             ) : (
                               <div className="text-center py-12 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                                 <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                   <Check className="w-8 h-8 text-emerald-600" />
                                 </div>
                                 <p className="text-lg font-semibold text-emerald-900 mb-1">All Clear</p>
                                 <p className="text-sm text-emerald-700">No significant drug interactions detected</p>
                               </div>
                             )}
                           </div>
                         </div>

                         {/* Current Treatment Plan */}
                         {note.plan && (
                           <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                             <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white">
                               <h3 className="font-bold text-lg flex items-center gap-2">
                                 <FileText className="w-6 h-6" />
                                 Current Treatment Plan
                               </h3>
                               <p className="text-slate-200 text-sm mt-1">Documented treatment approach</p>
                             </div>
                             <div className="p-8">
                               <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-xl p-6 border border-slate-200">
                                 {note.plan.split('\n').map((para, i) => (
                                   <p key={i} className="mb-3 leading-relaxed">{para}</p>
                                 ))}
                               </div>
                             </div>
                           </div>
                         )}
                       </>
                     )}

                     {/* Next Button */}
                     <div className="flex justify-between items-center pt-4">
                       <div className="flex gap-2">
                         <TabDataPreview tabId="plan" note={note} />
                         <ClinicalNotePreviewButton note={note} />
                       </div>
                       <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg gap-2 px-6 py-3 text-base">
                         Continue <ArrowLeft className="w-5 h-5 rotate-180" />
                       </Button>
                     </div>
                     </div>
                     </TabsContent>

                     {/* Laboratory Tab */}
                     <TabsContent value="laboratory" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                       <div className="max-w-5xl mx-auto space-y-8">
                         {/* Header Section */}
                         <div className="text-center mb-8">
                           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-lg">
                             <Beaker className="w-8 h-8 text-white" />
                           </div>
                           <h2 className="text-3xl font-bold text-slate-900 mb-2">Laboratory Workup</h2>
                           <p className="text-slate-600 max-w-2xl mx-auto">AI-generated lab recommendations based on clinical presentation</p>
                         </div>

                         {/* Generate Lab Recommendations */}
                         <div className="bg-white rounded-xl border-2 border-teal-300 shadow-lg overflow-hidden">
                           <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-5 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <Sparkles className="w-6 h-6" />
                               AI Lab Recommendations
                             </h3>
                             <p className="text-teal-100 text-sm mt-1">Evidence-based laboratory testing based on clinical context</p>
                           </div>
                           <div className="p-6">
                             {!note.chief_complaint && !note.diagnoses?.length ? (
                               <div className="text-center py-12">
                                 <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                 <p className="text-slate-600 font-medium">Clinical Information Required</p>
                                 <p className="text-sm text-slate-500 mt-1">Add a chief complaint or differential diagnoses to generate lab recommendations</p>
                               </div>
                             ) : (
                               <Button
                                 onClick={async () => {
                                   setLoadingLabRecommendations(true);
                                   try {
                                     const result = await base44.integrations.Core.InvokeLLM({
                                       prompt: `Generate comprehensive laboratory test recommendations based on this clinical presentation:

                     CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}

                     DIFFERENTIAL DIAGNOSES: ${differentialDiagnosis.map(d => d.diagnosis).join(", ") || "N/A"}

                     CURRENT DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}

                     HISTORY: ${note.history_of_present_illness || "N/A"}

                     VITAL SIGNS: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "N/A"}

                     Provide specific laboratory testing recommendations including:
                     1. Test name (e.g., "Complete Blood Count", "Basic Metabolic Panel")
                     2. Category (routine, urgent, stat)
                     3. Clinical indication - why this test is needed
                     4. Expected findings - what you're looking for
                     5. Timing - when should this be done
                     6. Follow-up considerations

                     Order tests by priority and clinical relevance.`,
                                       add_context_from_internet: true,
                                       response_json_schema: {
                                         type: "object",
                                         properties: {
                                           lab_recommendations: {
                                             type: "array",
                                             items: {
                                               type: "object",
                                               properties: {
                                                 test_name: { type: "string" },
                                                 category: { type: "string", enum: ["routine", "urgent", "stat"] },
                                                 clinical_indication: { type: "string" },
                                                 expected_findings: { type: "string" },
                                                 timing: { type: "string" },
                                                 follow_up: { type: "string" }
                                               }
                                             }
                                           }
                                         }
                                       }
                                     });

                                     setLabRecommendations(result.lab_recommendations || []);
                                     toast.success("Lab recommendations generated");
                                   } catch (error) {
                                     console.error("Failed to generate lab recommendations:", error);
                                     toast.error("Failed to generate lab recommendations");
                                   } finally {
                                     setLoadingLabRecommendations(false);
                                   }
                                 }}
                                 disabled={loadingLabRecommendations}
                                 className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white gap-2 shadow-lg py-6 text-base"
                               >
                                 {loadingLabRecommendations ? (
                                   <><Loader2 className="w-5 h-5 animate-spin" /> Generating Lab Recommendations...</>
                                 ) : (
                                   <><Sparkles className="w-5 h-5" /> Generate Lab Recommendations</>
                                 )}
                               </Button>
                             )}
                           </div>
                         </div>

                         {/* Lab Recommendations Results */}
                         {labRecommendations.length > 0 && (
                           <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                 <Beaker className="w-5 h-5 text-teal-600" />
                                 Recommended Laboratory Tests
                               </h3>
                               <Badge className="bg-teal-100 text-teal-800">
                                 {labRecommendations.length} tests
                               </Badge>
                             </div>
                             <div className="p-6 space-y-4">
                               {labRecommendations.map((lab, idx) => (
                                 <motion.div
                                   key={idx}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: idx * 0.1 }}
                                   className="rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 hover:border-teal-300 transition-all"
                                 >
                                   <div className="flex items-start justify-between mb-3">
                                     <div className="flex-1">
                                       <div className="flex items-center gap-3 mb-2">
                                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white font-bold shadow-md">
                                           {idx + 1}
                                         </div>
                                         <h4 className="text-lg font-bold text-slate-900">{lab.test_name}</h4>
                                       </div>
                                       <div className="flex items-center gap-2 ml-11">
                                         <Badge className={`${
                                           lab.category === 'stat' ? 'bg-red-600' :
                                           lab.category === 'urgent' ? 'bg-orange-600' :
                                           'bg-blue-600'
                                         } text-white`}>
                                           {lab.category?.toUpperCase()}
                                         </Badge>
                                         <span className="text-xs text-slate-600">{lab.timing}</span>
                                       </div>
                                     </div>
                                   </div>

                                   <div className="ml-11 space-y-3">
                                     <div className="bg-white rounded-lg p-4 border border-teal-200">
                                       <p className="text-xs font-bold text-slate-700 mb-2">Clinical Indication:</p>
                                       <p className="text-sm text-slate-600 leading-relaxed">{lab.clinical_indication}</p>
                                     </div>

                                     <div className="bg-white rounded-lg p-4 border border-teal-200">
                                       <p className="text-xs font-bold text-slate-700 mb-2">Expected Findings:</p>
                                       <p className="text-sm text-slate-600 leading-relaxed">{lab.expected_findings}</p>
                                     </div>

                                     {lab.follow_up && (
                                       <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                         <p className="text-xs font-bold text-blue-900 mb-2">Follow-up:</p>
                                         <p className="text-sm text-blue-800 leading-relaxed">{lab.follow_up}</p>
                                       </div>
                                     )}
                                   </div>
                                 </motion.div>
                               ))}

                               <Button
                                 onClick={async () => {
                                   try {
                                     let labText = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nLABORATORY WORKUP\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

                                     labRecommendations.forEach((lab, idx) => {
                                       labText += `${idx + 1}. ${lab.test_name} (${lab.category?.toUpperCase()})\n`;
                                       labText += `   Indication: ${lab.clinical_indication}\n`;
                                       labText += `   Timing: ${lab.timing}\n`;
                                       labText += `   Expected Findings: ${lab.expected_findings}\n`;
                                       if (lab.follow_up) {
                                         labText += `   Follow-up: ${lab.follow_up}\n`;
                                       }
                                       labText += '\n';
                                     });

                                     const updatedPlan = (note.plan || "") + labText;
                                     await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                     toast.success("Lab recommendations added to treatment plan");
                                   } catch (error) {
                                     console.error("Failed to add labs to plan:", error);
                                     toast.error("Failed to add lab recommendations");
                                   }
                                 }}
                                 className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white gap-2 shadow-lg"
                               >
                                 <Plus className="w-4 h-4" /> Add to Treatment Plan
                               </Button>
                             </div>
                           </div>
                         )}
                       </div>

                       {/* Next Button */}
                       <div className="flex justify-between items-center pt-4">
                         <div className="flex gap-2">
                           <TabDataPreview tabId="treatments" note={note} />
                           <ClinicalNotePreviewButton note={note} />
                         </div>
                         <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg gap-2 px-6 py-3 text-base">
                           Continue <ArrowLeft className="w-5 h-5 rotate-180" />
                         </Button>
                       </div>
                     </TabsContent>

                     {/* Imaging Recommendations Tab */}
                     <TabsContent value="imaging_recommendations" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                       <div className="max-w-5xl mx-auto space-y-8">
                         {/* Header Section */}
                         <div className="text-center mb-8">
                           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
                             <ImageIcon className="w-8 h-8 text-white" />
                           </div>
                           <h2 className="text-3xl font-bold text-slate-900 mb-2">Imaging Recommendations</h2>
                           <p className="text-slate-600 max-w-2xl mx-auto">AI-powered imaging study recommendations based on clinical presentation</p>
                         </div>

                         {/* Generate Imaging Recommendations */}
                         <div className="bg-white rounded-xl border-2 border-purple-300 shadow-lg overflow-hidden">
                           <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-5 text-white">
                             <h3 className="font-bold text-lg flex items-center gap-2">
                               <Sparkles className="w-6 h-6" />
                               AI Imaging Recommendations
                             </h3>
                             <p className="text-purple-100 text-sm mt-1">Evidence-based imaging studies tailored to clinical context</p>
                           </div>
                           <div className="p-6">
                             {!note.chief_complaint && !note.history_of_present_illness ? (
                               <div className="text-center py-12">
                                 <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                 <p className="text-slate-600 font-medium">Clinical Information Required</p>
                                 <p className="text-sm text-slate-500 mt-1">Add a chief complaint or history to generate imaging recommendations</p>
                               </div>
                             ) : (
                               <Button
                                 onClick={async () => {
                                   setLoadingImagingRecommendations(true);
                                   try {
                                     const result = await base44.integrations.Core.InvokeLLM({
                                       prompt: `Generate comprehensive imaging study recommendations based on this clinical presentation:

                     CHIEF COMPLAINT: ${note.chief_complaint || "N/A"}

                     HISTORY OF PRESENT ILLNESS: ${note.history_of_present_illness || "N/A"}

                     PHYSICAL EXAMINATION: ${note.physical_exam || "N/A"}

                     VITAL SIGNS: ${note.vital_signs ? JSON.stringify(note.vital_signs) : "N/A"}

                     DIFFERENTIAL DIAGNOSES: ${differentialDiagnosis.map(d => d.diagnosis).join(", ") || "N/A"}

                     CURRENT DIAGNOSES: ${note.diagnoses?.join(", ") || "N/A"}

                     Provide specific imaging study recommendations including:
                     1. Study name (e.g., "Chest X-Ray PA and Lateral", "CT Head without contrast")
                     2. Modality (X-ray, CT, MRI, Ultrasound)
                     3. Priority level (routine, urgent, stat)
                     4. Clinical indication - why this study is needed
                     5. What to look for - specific findings expected
                     6. Timing - when should this be performed
                     7. Special considerations (contrast, prep, contraindications)

                     Order studies by clinical priority and appropriateness criteria.`,
                                       add_context_from_internet: true,
                                       response_json_schema: {
                                         type: "object",
                                         properties: {
                                           imaging_recommendations: {
                                             type: "array",
                                             items: {
                                               type: "object",
                                               properties: {
                                                 study_name: { type: "string" },
                                                 modality: { type: "string", enum: ["X-ray", "CT", "MRI", "Ultrasound", "Nuclear Medicine", "Other"] },
                                                 priority: { type: "string", enum: ["routine", "urgent", "stat"] },
                                                 clinical_indication: { type: "string" },
                                                 expected_findings: { type: "string" },
                                                 timing: { type: "string" },
                                                 special_considerations: { type: "string" }
                                               }
                                             }
                                           }
                                         }
                                       }
                                     });

                                     setImagingRecommendations(result.imaging_recommendations || []);
                                     toast.success("Imaging recommendations generated");
                                   } catch (error) {
                                     console.error("Failed to generate imaging recommendations:", error);
                                     toast.error("Failed to generate imaging recommendations");
                                   } finally {
                                     setLoadingImagingRecommendations(false);
                                   }
                                 }}
                                 disabled={loadingImagingRecommendations}
                                 className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 shadow-lg py-6 text-base"
                               >
                                 {loadingImagingRecommendations ? (
                                   <><Loader2 className="w-5 h-5 animate-spin" /> Generating Imaging Recommendations...</>
                                 ) : (
                                   <><Sparkles className="w-5 h-5" /> Generate Imaging Recommendations</>
                                 )}
                               </Button>
                             )}
                           </div>
                         </div>

                         {/* Imaging Recommendations Results */}
                         {imagingRecommendations.length > 0 && (
                           <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                 <ImageIcon className="w-5 h-5 text-purple-600" />
                                 Recommended Imaging Studies
                               </h3>
                               <Badge className="bg-purple-100 text-purple-800">
                                 {imagingRecommendations.length} studies
                               </Badge>
                             </div>
                             <div className="p-6 space-y-4">
                               {imagingRecommendations.map((imaging, idx) => (
                                 <motion.div
                                   key={idx}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: idx * 0.1 }}
                                   className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 hover:border-purple-300 transition-all"
                                 >
                                   <div className="flex items-start justify-between mb-3">
                                     <div className="flex-1">
                                       <div className="flex items-center gap-3 mb-2">
                                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold shadow-md">
                                           {idx + 1}
                                         </div>
                                         <h4 className="text-lg font-bold text-slate-900">{imaging.study_name}</h4>
                                       </div>
                                       <div className="flex items-center gap-2 ml-11">
                                         <Badge className={`${
                                           imaging.priority === 'stat' ? 'bg-red-600' :
                                           imaging.priority === 'urgent' ? 'bg-orange-600' :
                                           'bg-blue-600'
                                         } text-white`}>
                                           {imaging.priority?.toUpperCase()}
                                         </Badge>
                                         <Badge className="bg-indigo-100 text-indigo-800">
                                           {imaging.modality}
                                         </Badge>
                                         <span className="text-xs text-slate-600">{imaging.timing}</span>
                                       </div>
                                     </div>
                                   </div>

                                   <div className="ml-11 space-y-3">
                                     <div className="bg-white rounded-lg p-4 border border-purple-200">
                                       <p className="text-xs font-bold text-slate-700 mb-2">Clinical Indication:</p>
                                       <p className="text-sm text-slate-600 leading-relaxed">{imaging.clinical_indication}</p>
                                     </div>

                                     <div className="bg-white rounded-lg p-4 border border-purple-200">
                                       <p className="text-xs font-bold text-slate-700 mb-2">Expected Findings:</p>
                                       <p className="text-sm text-slate-600 leading-relaxed">{imaging.expected_findings}</p>
                                     </div>

                                     {imaging.special_considerations && (
                                       <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                         <p className="text-xs font-bold text-amber-900 mb-2">Special Considerations:</p>
                                         <p className="text-sm text-amber-800 leading-relaxed">{imaging.special_considerations}</p>
                                       </div>
                                     )}
                                   </div>
                                 </motion.div>
                               ))}

                               <Button
                                 onClick={async () => {
                                   try {
                                     let imagingText = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nIMAGING STUDIES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

                                     imagingRecommendations.forEach((imaging, idx) => {
                                       imagingText += `${idx + 1}. ${imaging.study_name} (${imaging.modality} - ${imaging.priority?.toUpperCase()})\n`;
                                       imagingText += `   Indication: ${imaging.clinical_indication}\n`;
                                       imagingText += `   Timing: ${imaging.timing}\n`;
                                       imagingText += `   Expected Findings: ${imaging.expected_findings}\n`;
                                       if (imaging.special_considerations) {
                                         imagingText += `   Special Considerations: ${imaging.special_considerations}\n`;
                                       }
                                       imagingText += '\n';
                                     });

                                     const updatedPlan = (note.plan || "") + imagingText;
                                     await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                                     queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                     toast.success("Imaging recommendations added to treatment plan");
                                   } catch (error) {
                                     console.error("Failed to add imaging to plan:", error);
                                     toast.error("Failed to add imaging recommendations");
                                   }
                                 }}
                                 className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 shadow-lg"
                               >
                                 <Plus className="w-4 h-4" /> Add to Treatment Plan
                               </Button>
                             </div>
                           </div>
                         )}
                       </div>

                       {/* Next Button */}
                       <div className="flex justify-between items-center pt-4">
                         <div className="flex gap-2">
                           <TabDataPreview tabId="laboratory" note={note} />
                           <ClinicalNotePreviewButton note={note} />
                         </div>
                         <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg gap-2 px-6 py-3 text-base">
                           Continue <ArrowLeft className="w-5 h-5 rotate-180" />
                         </Button>
                       </div>
                     </TabsContent>

                       {/* Final Impression Tab */}
                       <TabsContent value="final_impression" className="p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                       <div className="max-w-5xl mx-auto space-y-8">
                       {/* Header Section */}
                       <div className="text-center mb-8">
                       <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                         <FileText className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-3xl font-bold text-slate-900 mb-2">Final Clinical Impression</h2>
                       <p className="text-slate-600 max-w-2xl mx-auto">Comprehensive AI analysis synthesizing all clinical findings</p>
                       </div>

                       {/* Generate Final Impression */}
                       <div className="bg-white rounded-xl border-2 border-blue-300 shadow-lg overflow-hidden">
                       <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-5 text-white">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                           <Sparkles className="w-6 h-6" />
                           AI Final Impression Generator
                         </h3>
                         <p className="text-blue-100 text-sm mt-1">Synthesizes all clinical data, lab results, and imaging findings</p>
                       </div>
                       <div className="p-6">
                         {!note.chief_complaint && !note.assessment ? (
                           <div className="text-center py-12">
                             <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                             <p className="text-slate-600 font-medium">Clinical Data Required</p>
                             <p className="text-sm text-slate-500 mt-1">Complete the clinical note sections to generate final impression</p>
                           </div>
                         ) : (
                           <Button
                             onClick={async () => {
                               setExtractingData(true);
                               try {
                                 const result = await base44.integrations.Core.InvokeLLM({
                                   prompt: `Generate a comprehensive Final Clinical Impression based on ALL available clinical data:

                       PATIENT INFORMATION:
                       - Name: ${note.patient_name}
                       - Age: ${note.patient_age || "Not specified"}
                       - Gender: ${note.patient_gender || "Not specified"}

                       CHIEF COMPLAINT:
                       ${note.chief_complaint || "Not documented"}

                       HISTORY OF PRESENT ILLNESS:
                       ${note.history_of_present_illness || "Not documented"}

                       REVIEW OF SYSTEMS:
                       ${note.review_of_systems || "Not documented"}

                       PHYSICAL EXAMINATION:
                       ${note.physical_exam || "Not documented"}

                       VITAL SIGNS:
                       ${note.vital_signs ? JSON.stringify(note.vital_signs, null, 2) : "Not documented"}

                       ASSESSMENT:
                       ${note.assessment || "Not documented"}

                       DIFFERENTIAL DIAGNOSES:
                       ${differentialDiagnosis.map(d => `${d.diagnosis} (Likelihood: ${d.likelihood_rank}/5) - ${d.clinical_reasoning}`).join("\n") || "Not documented"}

                       LABORATORY FINDINGS:
                       ${labRecommendations.length > 0 ? labRecommendations.map(lab => `${lab.test_name} (${lab.category}) - ${lab.clinical_indication}`).join("\n") : "No lab recommendations generated"}

                       IMAGING STUDIES:
                       ${imagingRecommendations.length > 0 ? imagingRecommendations.map(img => `${img.study_name} (${img.modality}) - ${img.clinical_indication}`).join("\n") : "No imaging recommendations generated"}

                       CURRENT DIAGNOSES:
                       ${note.diagnoses?.join(", ") || "Not documented"}

                       TREATMENT PLAN:
                       ${note.plan || "Not documented"}

                       Generate a comprehensive final clinical impression that includes:

                       1. **Summary Statement**: One-paragraph synthesis of the clinical presentation and key findings

                       2. **Primary Diagnoses with ICD-10 Codes**: List the most likely diagnoses with specific ICD-10 codes based on the clinical data. Include code and full description.

                       3. **Supporting Evidence**: Key clinical findings, lab results, and imaging that support each diagnosis

                       4. **Clinical Significance**: Brief explanation of the implications and severity

                       5. **Recommended Follow-up**: Key follow-up actions, monitoring, or specialist referrals needed

                       Format as clear, professional medical documentation.`,
                                   add_context_from_internet: true,
                                   response_json_schema: {
                                     type: "object",
                                     properties: {
                                       summary_statement: { type: "string" },
                                       primary_diagnoses: {
                                         type: "array",
                                         items: {
                                           type: "object",
                                           properties: {
                                             diagnosis: { type: "string" },
                                             icd10_code: { type: "string" },
                                             icd10_description: { type: "string" },
                                             supporting_evidence: { type: "array", items: { type: "string" } },
                                             clinical_significance: { type: "string" }
                                           }
                                         }
                                       },
                                       recommended_followup: { type: "array", items: { type: "string" } }
                                     }
                                   }
                                 });

                                 // Store in a temporary state or display directly
                                 const impressionText = `FINAL CLINICAL IMPRESSION

                       SUMMARY:
                       ${result.summary_statement}

                       PRIMARY DIAGNOSES:
                       ${result.primary_diagnoses.map((dx, i) => `
                       ${i + 1}. ${dx.diagnosis}
                       ICD-10: ${dx.icd10_code} - ${dx.icd10_description}

                       Supporting Evidence:
                       ${dx.supporting_evidence.map(ev => `   • ${ev}`).join('\n')}

                       Clinical Significance:
                       ${dx.clinical_significance}
                       `).join('\n')}

                       RECOMMENDED FOLLOW-UP:
                       ${result.recommended_followup.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;

                                 await base44.entities.ClinicalNote.update(noteId, { 
                                   clinical_impression: impressionText,
                                   diagnoses: result.primary_diagnoses.map(dx => `${dx.icd10_code} - ${dx.icd10_description}`)
                                 });
                                 queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                 toast.success("Final impression generated and added to note");
                               } catch (error) {
                                 console.error("Failed to generate final impression:", error);
                                 toast.error("Failed to generate final impression");
                               } finally {
                                 setExtractingData(false);
                               }
                             }}
                             disabled={extractingData}
                             className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-lg py-6 text-base"
                           >
                             {extractingData ? (
                               <><Loader2 className="w-5 h-5 animate-spin" /> Generating Final Impression...</>
                             ) : (
                               <><Sparkles className="w-5 h-5" /> Generate Comprehensive Final Impression</>
                             )}
                           </Button>
                         )}
                       </div>
                       </div>

                       {/* Display Final Impression */}
                       {note.clinical_impression && (
                       <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                         <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                             <FileText className="w-5 h-5 text-blue-600" />
                             Final Clinical Impression
                           </h3>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={async () => {
                               await base44.entities.ClinicalNote.update(noteId, { clinical_impression: "" });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               toast.success("Final impression cleared");
                             }}
                             className="gap-2 text-slate-600 hover:text-slate-900"
                           >
                             <X className="w-4 h-4" /> Clear
                           </Button>
                         </div>
                         <div className="p-6">
                           <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                             <pre className="text-sm text-slate-900 whitespace-pre-wrap font-sans leading-relaxed">
                               {note.clinical_impression}
                             </pre>
                           </div>

                           <div className="mt-6 grid grid-cols-2 gap-4">
                             <Button
                               onClick={async () => {
                                 try {
                                   // Copy to clipboard
                                   await navigator.clipboard.writeText(note.clinical_impression);
                                   toast.success("Final impression copied to clipboard");
                                 } catch (error) {
                                   console.error("Failed to copy:", error);
                                   toast.error("Failed to copy to clipboard");
                                 }
                               }}
                               variant="outline"
                               className="gap-2"
                             >
                               <FileCode className="w-4 h-4" /> Copy to Clipboard
                             </Button>

                             <Button
                               onClick={async () => {
                                 try {
                                   const fullNote = `${note.summary || ""}\n\n${note.assessment || ""}\n\n${note.clinical_impression}`;
                                   await base44.entities.ClinicalNote.update(noteId, { 
                                     assessment: fullNote 
                                   });
                                   queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                                   toast.success("Final impression added to clinical note assessment");
                                 } catch (error) {
                                   console.error("Failed to add to note:", error);
                                   toast.error("Failed to add to clinical note");
                                 }
                               }}
                               className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
                             >
                               <Plus className="w-4 h-4" /> Add to Clinical Note
                             </Button>
                           </div>
                         </div>
                       </div>
                       )}

                       {/* Current Diagnoses with ICD-10 */}
                       {note.diagnoses && note.diagnoses.length > 0 && (
                       <div className="bg-white rounded-xl border-2 border-green-200 shadow-lg overflow-hidden">
                         <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white">
                           <h3 className="font-bold text-lg flex items-center gap-2">
                             <Code className="w-5 h-5" />
                             Final Diagnoses with ICD-10 Codes
                           </h3>
                           <p className="text-green-50 text-sm mt-1">{note.diagnoses.length} {note.diagnoses.length === 1 ? 'diagnosis' : 'diagnoses'} documented</p>
                         </div>
                         <div className="p-6 space-y-3">
                           {note.diagnoses.map((diag, idx) => {
                             const icd10Match = diag.match(/^([A-Z0-9.]+)\s*-\s*(.+)$/);
                             const code = icd10Match ? icd10Match[1] : null;
                             const description = icd10Match ? icd10Match[2] : diag;

                             return (
                               <motion.div
                                 key={idx}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                                 className="flex items-start gap-4 p-5 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                               >
                                 <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white font-bold shadow-md flex-shrink-0">
                                   {idx + 1}
                                 </div>
                                 <div className="flex-1">
                                   {code ? (
                                     <>
                                       <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-mono text-sm px-3 py-1 mb-2 shadow-sm">
                                         {code}
                                       </Badge>
                                       <p className="text-base font-semibold text-slate-900 leading-relaxed">{description}</p>
                                     </>
                                   ) : (
                                     <p className="text-base font-semibold text-slate-900 leading-relaxed">{diag}</p>
                                   )}
                                 </div>
                               </motion.div>
                             );
                           })}
                         </div>
                       </div>
                       )}
                       </div>

                       {/* Next Button */}
                       <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                         <div className="flex gap-2">
                           <TabDataPreview tabId="final_impression" note={note} />
                           <ClinicalNotePreviewButton note={note} />
                         </div>
                         <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                           Next <ArrowLeft className="w-4 h-4 rotate-180" />
                         </Button>
                       </div>
                       </TabsContent>

                     {/* Finalize Note Tab */}
                 <TabsContent value="finalize" className="p-6 space-y-6 overflow-y-auto">
                   <div className="max-w-2xl mx-auto space-y-6">
                     <div className="text-center mb-8">
                       <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                         <Check className="w-8 h-8 text-emerald-600" />
                       </div>
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">Finalize Clinical Note</h2>
                       <p className="text-slate-600">Review and finalize your clinical documentation</p>
                     </div>

                     {/* Process Clinical Note Button */}
                     <Button
                       onClick={extractStructuredData}
                       disabled={extractingData || !note.raw_note}
                       className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 shadow-lg rounded-xl py-6 text-base"
                     >
                       {extractingData ? (
                         <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                       ) : (
                         <><Sparkles className="w-5 h-5" /> Process Clinical Note</>
                       )}
                     </Button>

                     <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                       <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                         <AlertCircle className="w-5 h-5 text-blue-600" />
                         Before Finalizing
                       </h3>
                       <ul className="space-y-3 text-sm text-slate-700">
                         <li className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                           <span>Review all clinical sections for accuracy and completeness</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                           <span>Verify patient demographics and visit information</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                           <span>Confirm diagnoses and ICD-10 codes are accurate</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                           <span>Review assessment and treatment plan</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                           <span>Ensure all required fields are complete</span>
                         </li>
                       </ul>
                     </div>

                     {note.status !== "finalized" && (
                       <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                         <h3 className="font-semibold text-slate-900 mb-4">Note Status</h3>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                           <div>
                             <p className="text-xs text-slate-500 mb-1">Current Status</p>
                             <Badge className={statusColors[note.status] || statusColors.draft}>{note.status || "draft"}</Badge>
                           </div>
                           <div>
                             <p className="text-xs text-slate-500 mb-1">Last Modified</p>
                             <p className="text-sm text-slate-900">{note.updated_date ? format(new Date(note.updated_date), "MMM d, h:mm a") : "N/A"}</p>
                           </div>
                         </div>

                         <p className="text-sm text-slate-600 text-center mb-4">
                           Click "Process Clinical Note" above to extract data and finalize
                         </p>
                       </div>
                     )}

                     <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-8 text-center">
                       <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                         <Check className="w-10 h-10 text-emerald-600" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-2">Clinical Note</h3>
                       <p className="text-slate-700 mb-4">
                         Created on {note.created_date ? format(new Date(note.created_date), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
                       </p>
                     </div>
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

                     {/* Patient Education Tab */}
                 <TabsContent value="patient_education" className="p-6 space-y-6 overflow-y-auto">
                   <div className="max-w-3xl mx-auto space-y-6">
                     {/* Generate Education Button */}
                     <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                           <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                             <BookOpen className="w-5 h-5 text-green-600" />
                             Patient Education Materials
                           </h3>
                           <p className="text-sm text-slate-600 mb-4">
                             Generate easy-to-understand patient education based on diagnoses
                           </p>
                           <Button
                             onClick={generatePatientEducation}
                             disabled={generatingEducation || !note.diagnoses || note.diagnoses.length === 0}
                             className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2 shadow-lg"
                           >
                             {generatingEducation ? (
                               <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                             ) : (
                               <><Sparkles className="w-4 h-4" /> Generate Patient Education</>
                             )}
                           </Button>
                         </div>
                       </div>
                     </div>

                     {/* Patient Education Content */}
                     {patientEducation && patientEducation.length > 0 && (
                       <>
                         <div className="flex gap-3">
                           <Button
                             onClick={() => downloadPatientEducation('pdf')}
                             variant="outline"
                             className="flex-1 rounded-xl gap-2 border-green-300 hover:bg-green-50"
                           >
                             <Download className="w-4 h-4" />
                             Download PDF
                           </Button>
                           <Button
                             onClick={() => downloadPatientEducation('text')}
                             variant="outline"
                             className="flex-1 rounded-xl gap-2 border-slate-300 hover:bg-slate-50"
                           >
                             <Download className="w-4 h-4" />
                             Download Text
                           </Button>
                         </div>

                         <div className="space-y-6">
                           {patientEducation.map((material, idx) => (
                             <div key={idx} className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
                               <div className="bg-green-50 px-5 py-4 border-b border-green-200">
                                 <h3 className="text-lg font-bold text-slate-900">{material.diagnosis}</h3>
                               </div>
                               <div className="p-5 space-y-5">
                                 {/* What Is It */}
                                 <div>
                                   <h4 className="text-sm font-bold text-slate-900 mb-2 text-green-700">What Is It?</h4>
                                   <p className="text-sm text-slate-700 leading-relaxed">{material.what_is_it}</p>
                                 </div>

                                 {/* Symptoms to Watch */}
                                 {material.symptoms_to_watch && material.symptoms_to_watch.length > 0 && (
                                   <div>
                                     <h4 className="text-sm font-bold text-slate-900 mb-2 text-amber-700">Symptoms to Watch For</h4>
                                     <ul className="space-y-1">
                                       {material.symptoms_to_watch.map((symptom, i) => (
                                         <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                           <span className="text-amber-600 mt-0.5">•</span>
                                           <span>{symptom}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}

                                 {/* Self Care */}
                                 {material.self_care && material.self_care.length > 0 && (
                                   <div>
                                     <h4 className="text-sm font-bold text-slate-900 mb-2 text-blue-700">What You Can Do</h4>
                                     <ul className="space-y-1">
                                       {material.self_care.map((care, i) => (
                                         <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                           <span className="text-blue-600 mt-0.5">•</span>
                                           <span>{care}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                   )}

                                   {/* Medications Explained */}
                                   {material.medications_explained && material.medications_explained.length > 0 && (
                                   <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
                                     <h4 className="text-sm font-bold text-purple-900 mb-2">Your Medications</h4>
                                     <ul className="space-y-1">
                                       {material.medications_explained.map((med, i) => (
                                         <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                                           <span className="text-purple-600 mt-0.5">💊</span>
                                           <span>{med}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                   )}

                                   {/* When to Seek Help */}
                                 {material.when_to_seek_help && material.when_to_seek_help.length > 0 && (
                                   <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                                     <h4 className="text-sm font-bold text-red-900 mb-2">When to Seek Help</h4>
                                     <ul className="space-y-1">
                                       {material.when_to_seek_help.map((warning, i) => (
                                         <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                           <span className="text-red-600 mt-0.5">⚠️</span>
                                           <span>{warning}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}

                                 {/* Questions for Doctor */}
                                 {material.questions_for_doctor && material.questions_for_doctor.length > 0 && (
                                   <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                                     <h4 className="text-sm font-bold text-blue-900 mb-2">Questions for Your Doctor</h4>
                                     <ul className="space-y-1">
                                       {material.questions_for_doctor.map((question, i) => (
                                         <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                           <span className="text-blue-600 mt-0.5">?</span>
                                           <span>{question}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}

                                 {/* Follow-up Care */}
                                 {material.follow_up && (
                                   <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                                     <h4 className="text-sm font-bold text-slate-900 mb-2">Follow-up Care</h4>
                                     <p className="text-sm text-slate-700">{material.follow_up}</p>
                                   </div>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       <div className="flex gap-3 mt-6">
                         <Button
                           onClick={async () => {
                             try {
                               let educationText = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPATIENT EDUCATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
                               patientEducation.forEach((material) => {
                                 educationText += `${material.diagnosis}:\n`;
                                 educationText += `${material.what_is_it}\n\n`;
                                 if (material.self_care?.length > 0) {
                                   educationText += `What You Can Do:\n${material.self_care.map(c => `• ${c}`).join('\n')}\n\n`;
                                 }
                                 if (material.when_to_seek_help?.length > 0) {
                                   educationText += `When to Seek Help:\n${material.when_to_seek_help.map(h => `⚠️ ${h}`).join('\n')}\n\n`;
                                 }
                               });

                               const updatedPlan = (note.plan || "") + educationText;
                               await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                               queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                               toast.success("Patient education added to plan");
                             } catch (error) {
                               console.error("Failed to add education:", error);
                               toast.error("Failed to add patient education");
                             }
                           }}
                           className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
                         >
                           <Plus className="w-4 h-4" /> Add to Plan
                         </Button>
                       </div>
                       </>
                       )}

                       {!patientEducation && !generatingEducation && (
                       <div className="text-center py-12">
                       <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                       <p className="text-slate-500">Patient education will appear here after generation</p>
                       </div>
                       )}
                       </div>
                       </TabsContent>

                       {/* Research Tab */}
                 <TabsContent value="research" className="p-6 overflow-y-auto">
                   <MedicalLiteratureSearch
                     noteContext={{
                       chief_complaint: note.chief_complaint,
                       diagnoses: note.diagnoses,
                       assessment: note.assessment,
                       plan: note.plan
                     }}
                     onAddToNote={async (citationText) => {
                       try {
                         const updatedPlan = (note.plan || "") + "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nREFERENCES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + citationText;
                         await base44.entities.ClinicalNote.update(noteId, { plan: updatedPlan });
                         queryClient.invalidateQueries({ queryKey: ["note", noteId] });
                       } catch (error) {
                         console.error("Failed to add citations:", error);
                         toast.error("Failed to add citations to note");
                       }
                     }}
                   />

                   {/* Next Button */}
                   <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                     <div className="flex gap-2">
                       <TabDataPreview tabId="patient_education" note={note} />
                       <ClinicalNotePreviewButton note={note} />
                     </div>
                     <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 gap-2">
                       Next <ArrowLeft className="w-4 h-4 rotate-180" />
                     </Button>
                   </div>
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
                     </Tabs>
                     </motion.div>


       </div>

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