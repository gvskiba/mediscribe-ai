import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { FileText, Plus, Edit, Trash2, Star, Search, Sparkles, Clock, RotateCcw, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AISnippetGenerator from "@/components/snippets/AISnippetGenerator";
import RichTextEditor from "@/components/snippets/RichTextEditor";
import SnippetVersionHistory from "@/components/snippets/SnippetVersionHistory";
import FolderManager from "@/components/snippets/FolderManager";
import SectionSnippetOrganizer from "@/components/snippets/SectionSnippetOrganizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultCategories = [
  { value: "exam", label: "Physical Exam" },
  { value: "ros", label: "Review of Systems" },
  { value: "hpi", label: "HPI" },
  { value: "assessment", label: "Assessment" },
  { value: "plan", label: "Plan" },
  { value: "custom", label: "Custom" },
];

export default function Snippets() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiGeneratorOpen, setAIGeneratorOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [versionHistoryId, setVersionHistoryId] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedSnippets, setSelectedSnippets] = useState(new Set());
  const [formData, setFormData] = useState({
    name: "",
    category: "custom",
    content: "",
    specialty: "",
    tags: [],
  });

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ["snippets"],
    queryFn: () => base44.entities.Snippet.list("-last_used", 200),
  });

  const getUniqueCategories = () => {
    const cats = new Set(snippets.map(s => s.category).filter(Boolean));
    return Array.from(cats).sort();
  };

  const getCategories = () => {
    const custom = getUniqueCategories();
    const all = [...defaultCategories.map(c => c.value), ...custom.filter(c => !defaultCategories.find(d => d.value === c))];
    return all.map(val => {
      const defaults = defaultCategories.find(c => c.value === val);
      return { value: val, label: defaults?.label || val };
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Snippet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      resetForm();
      toast.success("Snippet created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Save current version to history before updating
      const existing = snippets.find(s => s.id === id);
      if (existing) {
        const versions = await base44.entities.SnippetVersion.filter({ snippet_id: id });
        const newVersion = Math.max(...versions.map(v => v.version_number || 0), 0) + 1;
        await base44.entities.SnippetVersion.create({
          snippet_id: id,
          version_number: newVersion,
          content: existing.content,
          name: existing.name,
          category: existing.category,
          tags: existing.tags
        });
      }
      return base44.entities.Snippet.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      resetForm();
      toast.success("Snippet updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Snippet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      toast.success("Snippet deleted");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(Array.from(selectedSnippets).map(id => base44.entities.Snippet.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      setSelectedSnippets(new Set());
      setBulkSelectMode(false);
      toast.success("Snippets deleted");
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: async (folderId) => {
      await Promise.all(Array.from(selectedSnippets).map(id => 
        base44.entities.Snippet.update(id, { folder_id: folderId })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      setSelectedSnippets(new Set());
      setBulkSelectMode(false);
      toast.success("Snippets moved");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      base44.entities.Snippet.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "custom",
      content: "",
      specialty: "",
      tags: [],
    });
    setEditingSnippet(null);
    setDialogOpen(false);
  };

  const handleEdit = (snippet) => {
    setEditingSnippet(snippet);
    setFormData({
      name: snippet.name,
      category: snippet.category || "custom",
      content: snippet.content,
      specialty: snippet.specialty || "",
      tags: snippet.tags || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.content) {
      toast.error("Name and content are required");
      return;
    }

    if (editingSnippet) {
      updateMutation.mutate({ id: editingSnippet.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = snippets.filter(s => {
    const matchSearch = !search || 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.content?.toLowerCase().includes(search.toLowerCase()) ||
      (s.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    const matchTags = selectedTags.length === 0 || selectedTags.some(tag => (s.tags || []).includes(tag));
    const matchFolder = !selectedFolder || s.folder_id === selectedFolder.id;
    return matchSearch && matchCategory && matchTags && matchFolder;
  });

  const allTags = Array.from(new Set(snippets.flatMap(s => s.tags || []))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clinical Snippets</h1>
            <p className="text-slate-500 mt-1">Reusable text snippets for faster documentation</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFolderManagerOpen(true)}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Folder className="w-4 h-4" /> Folders
            </Button>
            <Button
              onClick={() => setAIGeneratorOpen(true)}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Sparkles className="w-4 h-4" /> AI Generate
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" /> New Snippet
            </Button>
          </div>
        </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="pl-10 rounded-xl"
          />
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-2 font-medium">Categories</p>
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge
              variant={categoryFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Badge>
            {getCategories().map(cat => (
              <Badge
                key={cat.value}
                variant={categoryFilter === cat.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
          {allTags.length > 0 && (
            <>
              <p className="text-xs text-slate-600 mb-2 font-medium">Tags</p>
              <div className="flex gap-2 flex-wrap">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setSelectedTags(selectedTags.includes(tag) 
                        ? selectedTags.filter(t => t !== tag)
                        : [...selectedTags, tag]
                      );
                    }}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No snippets found</h3>
          <p className="text-slate-500 mb-4">Create reusable text snippets for faster documentation</p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Create Snippet
          </Button>
        </Card>
      ) : (
        <>
          {bulkSelectMode && selectedSnippets.size > 0 && (
            <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">{selectedSnippets.size} selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSnippets(new Set());
                    setBulkSelectMode(false);
                  }}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg gap-1"
                  onClick={() => {
                    if (confirm("Move selected snippets to folder?")) {
                      setFolderManagerOpen(true);
                    }
                  }}
                >
                  <Folder className="w-3 h-3" /> Move
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedSnippets.size} snippets?`)) {
                      bulkDeleteMutation.mutate();
                    }
                  }}
                  className="rounded-lg"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {filtered.map((snippet, i) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className={`p-4 hover:shadow-md transition-all ${bulkSelectMode ? "cursor-pointer" : ""}`}>
                    {bulkSelectMode && (
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          checked={selectedSnippets.has(snippet.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedSnippets);
                            if (checked) {
                              newSet.add(snippet.id);
                            } else {
                              newSet.delete(snippet.id);
                            }
                            setSelectedSnippets(newSet);
                          }}
                        />
                      </div>
                    )}
                  {inlineEditingId === snippet.id ? (
                    <div className="space-y-3">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Snippet name"
                        className="rounded-lg font-semibold"
                      />
                      <RichTextEditor
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder="Snippet content"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            updateMutation.mutate({ id: snippet.id, data: formData });
                            setInlineEditingId(null);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setInlineEditingId(null)}
                          className="rounded-lg text-sm flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{snippet.name}</h3>
                          <div className="text-sm text-slate-600 mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: snippet.content }} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => toggleFavoriteMutation.mutate({ id: snippet.id, isFavorite: snippet.is_favorite })}
                        >
                          <Star className={`w-4 h-4 ${snippet.is_favorite ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                        </Button>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">{snippet.category}</Badge>
                        {snippet.specialty && <Badge variant="outline" className="text-xs">{snippet.specialty}</Badge>}
                        {(snippet.tags || []).map(tag => (
                          <Badge key={tag} className="text-xs bg-blue-50 text-blue-700 border-blue-200">#{tag}</Badge>
                        ))}
                        {snippet.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">{snippet.usage_count} uses</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkSelectMode(!bulkSelectMode)}
                          className="rounded-lg gap-1"
                        >
                          {bulkSelectMode ? "Cancel" : "Select"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSnippet(snippet);
                            setFormData({
                              name: snippet.name,
                              category: snippet.category || "custom",
                              content: snippet.content,
                              specialty: snippet.specialty || "",
                              tags: snippet.tags || [],
                            });
                            setInlineEditingId(snippet.id);
                          }}
                          className="rounded-lg gap-1 flex-1"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVersionHistoryId(snippet.id)}
                          className="rounded-lg gap-1"
                        >
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this snippet?")) {
                              deleteMutation.mutate(snippet.id);
                            }
                          }}
                          className="rounded-lg text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                  </Card>
                  </motion.div>
                  ))}
                  </AnimatePresence>
                  </div>
                  </>
                  )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{editingSnippet ? "Edit Snippet" : "Create Snippet"}</DialogTitle>
             <DialogDescription>{editingSnippet ? "Update your snippet details" : "Create a new reusable snippet"}</DialogDescription>
           </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Snippet Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Normal Cardiovascular Exam"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {getCategories().map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter the snippet text..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Specialty (Optional)</label>
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g., Cardiology"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Folder (Optional)</label>
              <Button
                variant="outline"
                onClick={() => setFolderManagerOpen(true)}
                className="w-full rounded-xl justify-start text-left gap-2"
              >
                <Folder className="w-4 h-4" />
                {selectedFolder ? selectedFolder.name : "Select folder"}
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tags (Optional)</label>
              <Input
                value={formData.tags.join(", ")}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="e.g., cardio, urgent, template"
                className="rounded-xl"
              />
              <p className="text-xs text-slate-500 mt-1">Separate tags with commas</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                {editingSnippet ? "Update" : "Create"} Snippet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AISnippetGenerator 
        open={aiGeneratorOpen}
        onOpenChange={setAIGeneratorOpen}
        onTemplatesGenerated={(templates) => {
          templates.forEach(template => {
            createMutation.mutate(template);
          });
        }}
      />

      <SnippetVersionHistory 
        snippetId={versionHistoryId}
        open={!!versionHistoryId}
        onClose={() => setVersionHistoryId(null)}
        onRevert={async (version) => {
          await base44.entities.Snippet.update(versionHistoryId, {
            name: version.name,
            content: version.content,
            category: version.category,
            tags: version.tags
          });
          queryClient.invalidateQueries({ queryKey: ["snippets"] });
          setVersionHistoryId(null);
        }}
      />

      <FolderManager
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        isOpen={folderManagerOpen}
        onClose={() => setFolderManagerOpen(false)}
      />
    </div>
  );
}