import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Edit, Trash2, Star, Check, Sparkles, Loader2, BarChart3, Share2, History, Filter, TrendingUp, Wand2, Eye, Search, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import SectionEditor from "../components/templates/SectionEditor";
import SectionSuggestions from "../components/templates/SectionSuggestions";
import TemplateAnalytics from "../components/templates/TemplateAnalytics";
import TemplateSharing from "../components/templates/TemplateSharing";
import TemplateVersionHistory from "../components/templates/TemplateVersionHistory";
import AITemplateSuggestions from "../components/templates/AITemplateSuggestions";
import TemplateVersionComparison from "../components/templates/TemplateVersionComparison";
import TemplateSearch from "../components/templates/TemplateSearch";
import AITemplateCreator from "../components/templates/AITemplateCreator";
import { toast } from "sonner";

const noteTypes = [
  { value: "progress_note", label: "Progress Note" },
  { value: "h_and_p", label: "History & Physical" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consult", label: "Consultation" },
  { value: "procedure_note", label: "Procedure Note" },
];

export default function NoteTemplates() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedTemplateForAnalytics, setSelectedTemplateForAnalytics] = useState(null);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [noteTypeFilter, setNoteTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [versionComparisonOpen, setVersionComparisonOpen] = useState(false);
  const [sectionSuggestions, setSectionSuggestions] = useState([]);
  const [loadingSectionSuggestions, setLoadingSectionSuggestions] = useState(false);
  const [aiCreatorOpen, setAiCreatorOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [favorites, setFavorites] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    note_type: "progress_note",
    specialty: "",
    category: "general",
    sections: [],
    ai_instructions: "",
  });

  const { data: templates = [], isLoading, data: templatesData } = useQuery({
    queryKey: ["noteTemplates"],
    queryFn: async () => {
      const allTemplates = await base44.entities.NoteTemplate.list();
      const user = await base44.auth.me();
      
      // Return all templates with user info for ownership badges
      return allTemplates.map(t => ({
        ...t,
        isOwner: t.created_by === user.email
      }));
    },
  });

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favoriteTemplates");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (templateId) => {
    const newFavorites = favorites.includes(templateId)
      ? favorites.filter(id => id !== templateId)
      : [...favorites, templateId];
    setFavorites(newFavorites);
    localStorage.setItem("favoriteTemplates", JSON.stringify(newFavorites));
    toast.success(favorites.includes(templateId) ? "Removed from favorites" : "Added to favorites");
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Ensure sections have IDs and order
      const processedData = {
        ...data,
        version: 1,
        usage_count: 0,
        sections: data.sections?.map((section, idx) => ({
          ...section,
          id: section.id || `section_${Date.now()}_${idx}`,
          order: section.order ?? idx,
          enabled: section.enabled ?? true,
          conditional_logic: section.conditional_logic || {
            enabled: false,
            operator: "AND",
            conditions: []
          }
        })) || []
      };
      return base44.entities.NoteTemplate.create(processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      resetForm();
      toast.success("Template created successfully");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      // Ensure sections have IDs and order
      const processedData = {
        ...data,
        sections: data.sections?.map((section, idx) => ({
          ...section,
          id: section.id || `section_${Date.now()}_${idx}`,
          order: section.order ?? idx,
          enabled: section.enabled ?? true,
          conditional_logic: section.conditional_logic || {
            enabled: false,
            operator: "AND",
            conditions: []
          }
        })) || []
      };
      return base44.entities.NoteTemplate.update(id, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      resetForm();
      toast.success("Template updated successfully");
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: async ({ templateId, versionNotes }) => {
      const original = templates.find(t => t.id === templateId);
      const newVersion = {
        ...original,
        version: (original.version || 1) + 1,
        parent_template_id: original.parent_template_id || original.id,
        version_notes: versionNotes,
        usage_count: 0
      };
      delete newVersion.id;
      delete newVersion.created_date;
      delete newVersion.updated_date;
      return base44.entities.NoteTemplate.create(newVersion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      toast.success("New version created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NoteTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      toast.success("Template deleted");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      await Promise.all(
        templates.map(t => base44.entities.NoteTemplate.update(t.id, { is_default: t.id === id }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
      toast.success("Default template updated");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      note_type: "progress_note",
      specialty: "",
      category: "general",
      sections: [],
      ai_instructions: "",
    });
    setEditingTemplate(null);
    setDialogOpen(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    // Ensure sections have all required fields
    const processedSections = (template.sections || []).map((section, idx) => ({
      id: section.id || `section_${Date.now()}_${idx}`,
      name: section.name || "",
      description: section.description || "",
      ai_instructions: section.ai_instructions || "",
      enabled: section.enabled ?? true,
      order: section.order ?? idx,
      conditional_logic: section.conditional_logic || {
        enabled: false,
        operator: "AND",
        conditions: []
      }
    }));
    setFormData({
      name: template.name,
      description: template.description || "",
      note_type: template.note_type || "progress_note",
      specialty: template.specialty || "",
      category: template.category || "general",
      sections: processedSections,
      ai_instructions: template.ai_instructions || "",
    });
    setDialogOpen(true);
  };

  const handleShare = (template) => {
    setSelectedTemplate(template);
    setSharingDialogOpen(true);
  };

  const handleVersionHistory = (template) => {
    setSelectedTemplate(template);
    setVersionHistoryOpen(true);
  };

  const handleAISuggestions = (template) => {
    setSelectedTemplate(template);
    setAiSuggestionsOpen(true);
  };

  const handleRestoreVersion = async (version) => {
    const versionNotes = prompt("Enter notes for this new version:");
    if (versionNotes) {
      await createVersionMutation.mutateAsync({
        templateId: version.id,
        versionNotes
      });
      setVersionHistoryOpen(false);
    }
  };

  const handleApplySuggestion = async (suggestion) => {
    if (suggestion.type === "add_section" && suggestion.implementation) {
      const newSection = {
        id: Date.now().toString(),
        name: suggestion.implementation.section_name,
        description: suggestion.implementation.section_description,
        ai_instructions: suggestion.implementation.ai_instructions,
        enabled: true,
        order: selectedTemplate.sections?.length || 0,
        conditional_logic: {
          enabled: false,
          operator: "AND",
          conditions: []
        }
      };

      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: {
          ...selectedTemplate,
          sections: [...(selectedTemplate.sections || []), newSection]
        }
      });
    }
  };

  const getTemplateVersions = (template) => {
    const parentId = template.parent_template_id || template.id;
    return templates.filter(t => 
      t.id === parentId || t.parent_template_id === parentId
    );
  };

  const generateSectionSuggestions = async () => {
    setLoadingSectionSuggestions(true);
    
    try {
      const noteTypeLabel = noteTypes.find(t => t.value === formData.note_type)?.label || "Clinical Note";
      const specialtyContext = formData.specialty ? ` for ${formData.specialty}` : "";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Generate relevant sections for a ${noteTypeLabel}${specialtyContext}.

Suggest 5-7 practical sections that should be included. For each section, provide:
- A clear, concise name
- A brief description of what should be documented
- Specific AI extraction instructions to guide automated note structuring

Consider standard medical documentation practices and the specific requirements of this note type and specialty.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  ai_instructions: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSectionSuggestions(result.sections || []);
    } catch (error) {
      toast.error("Failed to generate section suggestions");
    } finally {
      setLoadingSectionSuggestions(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setGeneratingSuggestions(true);
    
    try {
      const noteTypeLabel = noteTypes.find(t => t.value === formData.note_type)?.label || "Clinical Note";
      const specialtyContext = formData.specialty ? ` for ${formData.specialty}` : "";
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation expert. Generate a comprehensive template structure for a ${noteTypeLabel}${specialtyContext}.

Based on best practices and standard medical documentation, suggest:
1. Relevant sections with clear names
2. A brief description for each section explaining what should be documented
3. Specific AI extraction instructions for each section to guide automated note structuring

Consider common clinical documentation standards like SOAP, HPI structure, ROS, physical exam organization, and assessment/plan formatting.

Return a JSON structure with:
- sections: array of {name, description, ai_instructions}
- overall_ai_instructions: general guidance for the entire template`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  ai_instructions: { type: "string" }
                }
              }
            },
            overall_ai_instructions: { type: "string" }
          }
        }
      });

      const sectionsWithMetadata = (result.sections || []).map((section, idx) => ({
        ...section,
        id: `section_${Date.now()}_${idx}`,
        enabled: true,
        order: idx,
        conditional_logic: {
          enabled: false,
          operator: "AND",
          conditions: []
        }
      }));
      
      setFormData({
        ...formData,
        sections: sectionsWithMetadata,
        ai_instructions: result.overall_ai_instructions || formData.ai_instructions
      });
      setSectionSuggestions([]);
      toast.success("AI suggestions generated");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || formData.sections.length === 0) {
      toast.error("Please provide a template name and at least one section");
      return;
    }

    const data = { ...formData };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter(t => {
      const matchesSearch = searchQuery.trim() === "" ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesQuickSearch = quickSearch.trim() === "" ||
        t.name?.toLowerCase().includes(quickSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(quickSearch.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesNoteType = noteTypeFilter === "all" || t.note_type === noteTypeFilter;
      const matchesTags = !tagFilter || t.tags?.includes(tagFilter);
      
      return matchesSearch && matchesQuickSearch && matchesCategory && matchesNoteType && matchesTags;
    });

    // Sort templates
    const sorted = [...filtered].sort((a, b) => {
      // Favorites always come first
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      switch (sortBy) {
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "usage_most":
          return (b.usage_count || 0) - (a.usage_count || 0);
        case "usage_least":
          return (a.usage_count || 0) - (b.usage_count || 0);
        case "date_newest":
          return new Date(b.created_date || 0) - new Date(a.created_date || 0);
        case "date_oldest":
          return new Date(a.created_date || 0) - new Date(b.created_date || 0);
        case "last_used":
          return new Date(b.last_used || 0) - new Date(a.last_used || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, searchQuery, quickSearch, categoryFilter, noteTypeFilter, tagFilter, sortBy, favorites]);

  const allTags = useMemo(() => {
    const tags = new Set();
    templates.forEach(t => {
      t.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [templates]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Note Templates</h1>
          <p className="text-slate-500 mt-1">AI-powered templates with versioning, sharing, and smart suggestions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAiCreatorOpen(true)}
            variant="outline"
            className="rounded-xl gap-2 bg-white"
          >
            <Wand2 className="w-4 h-4" /> AI Create
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl gap-2 shadow-lg shadow-cyan-500/30"
          >
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filter */}
      <Card className="p-4 mb-6 bg-white shadow-sm border-slate-200">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Quick search templates..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] rounded-xl border-slate-200">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="usage_most">Most Used</SelectItem>
                  <SelectItem value="usage_least">Least Used</SelectItem>
                  <SelectItem value="date_newest">Newest First</SelectItem>
                  <SelectItem value="date_oldest">Oldest First</SelectItem>
                  <SelectItem value="last_used">Recently Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TemplateSearch 
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            onSearchChange={setSearchQuery}
            onNoteTypeChange={setNoteTypeFilter}
          />
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={tagFilter === "" ? "default" : "outline"}
                className="cursor-pointer bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700"
                onClick={() => setTagFilter("")}
              >
                All Tags
              </Badge>
              {allTags.map(tag => (
                <Badge 
                  key={tag}
                  variant={tagFilter === tag ? "default" : "outline"}
                  className={`cursor-pointer ${tagFilter === tag ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white" : ""}`}
                  onClick={() => setTagFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
          <p className="text-slate-500 mb-4">Create your first note template with AI-powered sections</p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredAndSortedTemplates.map(template => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all relative bg-white border-slate-200">
                  <div className="absolute top-4 right-4 flex gap-2">
                    {favorites.includes(template.id) && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Favorite
                      </Badge>
                    )}
                    {template.is_default && (
                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200">
                        <Check className="w-3 h-3 mr-1" /> Default
                      </Badge>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                      {template.isOwner && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">My Template</Badge>
                      )}
                      {template.is_public && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                      {template.version > 1 && (
                        <Badge variant="outline" className="text-xs">v{template.version}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{template.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">{noteTypes.find(t => t.value === template.note_type)?.label}</Badge>
                    <Badge className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 border-0">{template.category}</Badge>
                    {template.specialty && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{template.specialty}</Badge>}
                    {template.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-slate-100">{tag}</Badge>
                    ))}
                    {template.sections?.length > 0 && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {template.sections.filter(s => s.enabled !== false).length}/{template.sections.length} sections
                      </Badge>
                    )}
                    {template.usage_count > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {template.usage_count} uses
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFavorite(template.id)}
                      className={`rounded-lg ${favorites.includes(template.id) ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : ""}`}
                      title="Favorite"
                    >
                      <Star className={`w-3 h-3 ${favorites.includes(template.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="rounded-lg gap-1"
                      title="Preview"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="rounded-lg gap-1"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(template)}
                      className="rounded-lg"
                      title="Share"
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setVersionComparisonOpen(true);
                      }}
                      className="rounded-lg"
                      title="Version History"
                    >
                      <History className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAISuggestions(template)}
                      className="rounded-lg"
                      title="AI Suggestions"
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        className="rounded-lg"
                        title="Set as default"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="sr-only">Create or edit a note template with sections and AI instructions</div>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cardiology Progress Note"
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Note Type</label>
                <Select value={formData.note_type} onValueChange={(v) => setFormData({ ...formData, note_type: v })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Specialty</label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g., Cardiology"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="pulmonology">Pulmonology</SelectItem>
                  <SelectItem value="endocrinology">Endocrinology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="psychiatry">Psychiatry</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">Note Sections</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSectionSuggestions}
                    disabled={loadingSectionSuggestions || sectionSuggestions.length > 0}
                    className="rounded-lg gap-2 text-xs"
                  >
                    {loadingSectionSuggestions ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Loading...</>
                    ) : sectionSuggestions.length > 0 ? (
                      <><Sparkles className="w-3 h-3" /> Suggestions Below</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Suggest Sections</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSuggestions}
                    disabled={generatingSuggestions}
                    className="rounded-lg gap-2 text-xs"
                  >
                    {generatingSuggestions ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Full Template</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Section Suggestions */}
              {sectionSuggestions.length > 0 && (
                <div className="mb-4">
                  <SectionSuggestions
                    suggestions={sectionSuggestions}
                    onApply={(sections) => {
                      setFormData({ ...formData, sections: [...formData.sections, ...sections] });
                      setSectionSuggestions([]);
                    }}
                  />
                </div>
              )}

              <SectionEditor
                sections={formData.sections}
                onChange={(sections) => setFormData({ ...formData, sections })}
                noteType={formData.note_type}
                specialty={formData.specialty}
              />
              <p className="text-xs text-slate-500 mt-2">Enable/disable sections with the eye icon, configure conditional logic, and use AI suggestions based on note type</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Global AI Instructions (Optional)</label>
              <Textarea
                value={formData.ai_instructions}
                onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
                placeholder="e.g., 'Be concise and use bullet points', 'Focus on patient safety concerns'"
                className="min-h-[100px] rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                These instructions apply to the entire template. For section-specific instructions, configure them in the sections above.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg gap-2"
                disabled={!formData.name || formData.sections.length === 0}
              >
                <Check className="w-4 h-4" />
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplateAnalytics
        template={selectedTemplateForAnalytics}
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setSelectedTemplateForAnalytics(null);
        }}
      />

      <TemplateSharing
        template={selectedTemplate}
        open={sharingDialogOpen}
        onClose={() => setSharingDialogOpen(false)}
        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
      />

      <TemplateVersionHistory
        template={selectedTemplate}
        versions={selectedTemplate ? getTemplateVersions(selectedTemplate) : []}
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        onRestore={handleRestoreVersion}
      />

      <AITemplateSuggestions
        template={selectedTemplate}
        usageData={{ templates }}
        open={aiSuggestionsOpen}
        onClose={() => setAiSuggestionsOpen(false)}
        onApplySuggestion={handleApplySuggestion}
      />

      <TemplateVersionComparison
        versions={selectedTemplate ? getTemplateVersions(selectedTemplate) : []}
        open={versionComparisonOpen}
        onClose={() => setVersionComparisonOpen(false)}
      />

      <AITemplateCreator
        open={aiCreatorOpen}
        onClose={() => setAiCreatorOpen(false)}
        onTemplateCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["noteTemplates"] });
          setAiCreatorOpen(false);
        }}
      />

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-600" />
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {previewTemplate?.description && (
              <div>
                <p className="text-sm text-slate-600">{previewTemplate.description}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                {noteTypes.find(t => t.value === previewTemplate?.note_type)?.label}
              </Badge>
              <Badge className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 border-0">
                {previewTemplate?.category}
              </Badge>
              {previewTemplate?.specialty && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {previewTemplate.specialty}
                </Badge>
              )}
              {previewTemplate?.version && (
                <Badge variant="outline">Version {previewTemplate.version}</Badge>
              )}
            </div>

            {previewTemplate?.ai_instructions && (
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Global AI Instructions
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{previewTemplate.ai_instructions}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Template Sections ({previewTemplate?.sections?.length || 0})</h4>
              {previewTemplate?.sections?.map((section, idx) => (
                <Card key={idx} className={`p-4 border ${section.enabled === false ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-slate-900">{section.name}</h5>
                      {section.enabled === false && (
                        <Badge variant="outline" className="text-xs">Disabled</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Order: {section.order ?? idx}
                    </Badge>
                  </div>
                  {section.description && (
                    <p className="text-sm text-slate-600 mb-2">{section.description}</p>
                  )}
                  {section.ai_instructions && (
                    <div className="bg-cyan-50 rounded-lg p-3 mt-2 border border-cyan-100">
                      <p className="text-xs font-medium text-cyan-900 mb-1">AI Instructions:</p>
                      <p className="text-xs text-cyan-700 leading-relaxed">{section.ai_instructions}</p>
                    </div>
                  )}
                  {section.conditional_logic?.enabled && (
                    <Badge variant="outline" className="mt-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Conditional Logic Enabled
                    </Badge>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-slate-500">
                {previewTemplate?.created_date && (
                  <span>Created {format(new Date(previewTemplate.created_date), "MMM d, yyyy")}</span>
                )}
                {previewTemplate?.usage_count > 0 && (
                  <span className="ml-3">• Used {previewTemplate.usage_count} times</span>
                )}
              </div>
              <Button
                onClick={() => {
                  handleEdit(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl gap-2"
              >
                <Edit className="w-4 h-4" /> Edit Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}