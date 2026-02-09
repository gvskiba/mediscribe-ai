import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Star,
  Trash2,
  Edit2,
  Copy,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const SECTION_TYPES = ["hpi", "ros", "physical_exam", "assessment", "plan", "custom"];
const SPECIALTIES = ["cardiology", "pulmonology", "endocrinology", "neurology", "orthopedics", "pediatrics", "general"];
const VISIT_TYPES = ["progress_note", "h_and_p", "discharge_summary", "consult", "procedure_note"];

export default function SectionLibrary() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    section_type: "hpi",
    content: "",
    specialty: [],
    visit_types: [],
    tags: [],
    description: "",
  });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["reusableSections"],
    queryFn: () => base44.entities.ReusableSection.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReusableSection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reusableSections"] });
      toast.success("Section created successfully");
      resetForm();
      setOpenDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ReusableSection.update(editingSection.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reusableSections"] });
      toast.success("Section updated successfully");
      resetForm();
      setOpenDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReusableSection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reusableSections"] });
      toast.success("Section deleted");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (section) =>
      base44.entities.ReusableSection.update(section.id, {
        is_favorite: !section.is_favorite,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reusableSections"] });
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.content) {
      toast.error("Name and content are required");
      return;
    }

    if (editingSection) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      section_type: "hpi",
      content: "",
      specialty: [],
      visit_types: [],
      tags: [],
      description: "",
    });
    setEditingSection(null);
  };

  const handleEditSection = (section) => {
    setFormData(section);
    setEditingSection(section);
    setOpenDialog(true);
  };

  const filteredSections = sections.filter((section) => {
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === "all" || section.section_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const favorites = filteredSections.filter(s => s.is_favorite);
  const others = filteredSections.filter(s => !s.is_favorite);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Template Section Library</h2>
          <p className="text-sm text-slate-600 mt-1">Create and manage reusable clinical note sections</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? "Edit Section" : "Create New Section"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Section Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Chest Pain HPI"
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Section Type *
                </label>
                <select
                  value={formData.section_type}
                  onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SECTION_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this section"
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Section Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the template content..."
                  className="min-h-[200px] rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          specialty: formData.specialty.includes(specialty)
                            ? formData.specialty.filter(s => s !== specialty)
                            : [...formData.specialty, specialty],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.specialty.includes(specialty)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 mb-1.5 block">
                  Visit Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {VISIT_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          visit_types: formData.visit_types.includes(type)
                            ? formData.visit_types.filter(t => t !== type)
                            : [...formData.visit_types, type],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.visit_types.includes(type)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {type.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {editingSection ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sections..."
            className="rounded-lg"
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {SECTION_TYPES.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No sections found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Favorites
              </h3>
              <div className="grid gap-3">
                {favorites.map(section => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onEdit={() => handleEditSection(section)}
                    onDelete={() => deleteMutation.mutate(section.id)}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate(section)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Sections */}
          {others.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">All Sections</h3>
              <div className="grid gap-3">
                {others.map(section => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onEdit={() => handleEditSection(section)}
                    onDelete={() => deleteMutation.mutate(section.id)}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate(section)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, onEdit, onDelete, onToggleFavorite }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{section.name}</h4>
          <p className="text-sm text-slate-600 mt-1">{section.description}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggleFavorite}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Star className={`w-4 h-4 ${section.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'}`} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Badge variant="outline" className="bg-blue-50">
          {section.section_type.replace(/_/g, " ")}
        </Badge>
        {section.specialty?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {section.specialty.map(spec => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        )}
        {section.visit_types?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {section.visit_types.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Used {section.usage_count || 0} times
        {section.last_used && ` • Last used ${new Date(section.last_used).toLocaleDateString()}`}
      </p>
    </div>
  );
}