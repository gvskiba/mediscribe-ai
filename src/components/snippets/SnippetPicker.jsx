import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, FileText, Star, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function SnippetPicker({ open, onClose, onInsert, category = null }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", content: "", category: "", tags: [] });
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const { data: snippets = [] } = useQuery({
    queryKey: ["snippets"],
    queryFn: () => base44.entities.Snippet.list("-last_used", 100),
  });

  const updateSnippetMutation = useMutation({
    mutationFn: ({ id, data }) => 
      base44.entities.Snippet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      setShowEditDialog(false);
      setEditingSnippet(null);
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: ({ id, count }) => 
      base44.entities.Snippet.update(id, { usage_count: count + 1, last_used: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });

  const getUniqueCategories = () => {
    const cats = new Set(snippets.map(s => s.category).filter(Boolean));
    return Array.from(cats).sort();
  };

  const recentlyUsed = snippets.filter(s => s.last_used).sort((a, b) => 
    new Date(b.last_used) - new Date(a.last_used)
  ).slice(0, 5);

  const filtered = snippets.filter(s => {
    const matchSearch = !search || 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.content?.toLowerCase().includes(search.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleInsert = (snippet) => {
    onInsert(snippet.content);
    updateUsageMutation.mutate({ id: snippet.id, count: snippet.usage_count || 0 });
    onClose();
  };

  const handleEditSnippet = (snippet) => {
    setEditingSnippet(snippet);
    setEditFormData({ 
      name: snippet.name, 
      content: snippet.content, 
      category: snippet.category || "custom",
      tags: snippet.tags || []
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.name || !editFormData.content) return;
    updateSnippetMutation.mutate({ 
      id: editingSnippet.id, 
      data: editFormData 
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setSelectedCategory(newCategory.trim());
      setNewCategory("");
      setShowCategoryInput(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Insert Snippet
            </DialogTitle>
            <DialogDescription>
              Select a snippet to insert into your note
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-3">
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
            {categories.map(cat => (
              <Badge
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No snippets found</p>
            </div>
          ) : (
            filtered.map((snippet, i) => (
              <motion.div
                key={snippet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleInsert(snippet)}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{snippet.name}</h4>
                    {snippet.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">{snippet.category}</Badge>
                    {snippet.usage_count > 0 && (
                      <Badge variant="outline" className="text-xs">{snippet.usage_count} uses</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{snippet.content}</p>
                {snippet.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {snippet.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}