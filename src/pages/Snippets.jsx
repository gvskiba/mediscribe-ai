import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { FileText, Plus, Edit, Trash2, Star, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const categories = [
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
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    category: "custom",
    content: "",
    specialty: "",
    tags: [],
  });

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ["snippets"],
    queryFn: () => base44.entities.Snippet.list("-usage_count", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Snippet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      resetForm();
      toast.success("Snippet created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Snippet.update(id, data),
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
      s.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Snippets</h1>
          <p className="text-slate-500 mt-1">Reusable text snippets for faster documentation</p>
        </div>
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
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Badge>
          {categories.map(cat => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((snippet, i) => (
              <motion.div
                key={snippet.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{snippet.name}</h3>
                      {snippet.is_favorite && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleFavoriteMutation.mutate({ id: snippet.id, isFavorite: snippet.is_favorite })}
                    >
                      <Star className={`w-4 h-4 ${snippet.is_favorite ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-3">{snippet.content}</p>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge variant="outline">{snippet.category}</Badge>
                    {snippet.usage_count > 0 && (
                      <Badge variant="outline" className="text-xs">{snippet.usage_count} uses</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(snippet)}
                      className="rounded-lg gap-1 flex-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
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
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? "Edit Snippet" : "Create Snippet"}</DialogTitle>
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
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the snippet text..."
                className="min-h-[150px] rounded-xl"
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
    </div>
  );
}