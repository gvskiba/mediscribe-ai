import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Star, Plus, Edit } from "lucide-react";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: "", content: "", category: "general" });

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

  const createSnippetMutation = useMutation({
    mutationFn: (data) => 
      base44.entities.Snippet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      setShowCreateDialog(false);
      setCreateFormData({ name: "", content: "", category: "general" });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <FileText className="w-5 h-5 text-blue-600" />
             Insert Snippet
           </DialogTitle>
           <DialogDescription>
             Select or edit a snippet to insert into your note
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

          <div className="flex gap-2 flex-wrap items-center">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Badge>
            {getUniqueCategories().map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
            {!showCategoryInput && (
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-lg text-xs h-6"
                onClick={() => setShowCategoryInput(true)}
              >
                + Category
              </Button>
            )}
            {showCategoryInput && (
              <div className="flex gap-1">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category..."
                  className="h-6 text-xs rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button size="sm" onClick={handleAddCategory} className="h-6 text-xs rounded-lg">Add</Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {recentlyUsed.length > 0 && selectedCategory === "all" && !search && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Recently Used</h4>
              <div className="space-y-2">
                {recentlyUsed.map((snippet, i) => (
                  <motion.div
                    key={`recent-${snippet.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleInsert(snippet)}>
                        <h5 className="text-sm font-semibold text-slate-900">{snippet.name}</h5>
                        <p className="text-xs text-slate-600 line-clamp-1">{snippet.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSnippet(snippet);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="h-px bg-slate-200 my-3" />
            </div>
          )}

          <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">All Snippets</h4>
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
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleInsert(snippet)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 text-sm">{snippet.name}</h4>
                      {snippet.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{snippet.content}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{snippet.category}</Badge>
                      {snippet.usage_count > 0 && (
                        <Badge variant="outline" className="text-xs">{snippet.usage_count}x</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSnippet(snippet);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Snippet</DialogTitle>
            <DialogDescription>Make changes to your snippet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Name</label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
              <Input
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="rounded-lg"
                placeholder="e.g., exam, ros, custom..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Content</label>
              <Textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="min-h-[120px] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}