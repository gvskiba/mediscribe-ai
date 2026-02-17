import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, BookOpen, Calculator, Layers, FileCode, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const defaultLinks = [
  { title: "Notes", description: "View and manage clinical notes", icon: "FileText", page: "NotesLibrary", gradient: "from-blue-500 to-blue-600" },
  { title: "Templates", description: "Manage note templates", icon: "FileCode", page: "NoteTemplates", gradient: "from-purple-500 to-purple-600" },
  { title: "Snippets", description: "Quick text snippets", icon: "Layers", page: "Snippets", gradient: "from-emerald-500 to-emerald-600" },
  { title: "Guidelines", description: "Evidence-based clinical guidelines", icon: "BookOpen", page: "Guidelines", gradient: "from-indigo-500 to-indigo-600" },
  { title: "Calculators", description: "Medical calculators and tools", icon: "Calculator", page: "Calculators", gradient: "from-cyan-500 to-cyan-600" }
];

const iconMap = {
  FileText, BookOpen, Calculator, Layers, FileCode, ExternalLink
};

const colorGradients = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  emerald: "from-emerald-500 to-emerald-600",
  indigo: "from-indigo-500 to-indigo-600",
  cyan: "from-cyan-500 to-cyan-600",
  pink: "from-pink-500 to-pink-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600"
};

export default function QuickLinksWidget() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    category: "other",
    icon_name: "FileText",
    color: "blue",
    is_external: false
  });

  const queryClient = useQueryClient();

  const { data: customLinks = [] } = useQuery({
    queryKey: ['customLinks'],
    queryFn: () => base44.entities.CustomLink.list('-order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customLinks']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customLinks']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['customLinks'])
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      url: "",
      category: "other",
      icon_name: "FileText",
      color: "blue",
      is_external: false
    });
    setEditingLink(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      description: link.description || "",
      url: link.url,
      category: link.category,
      icon_name: link.icon_name || "FileText",
      color: link.color || "blue",
      is_external: link.is_external || false
    });
    setDialogOpen(true);
  };

  const allLinks = [...defaultLinks.map(l => ({ ...l, isDefault: true })), ...customLinks];
  const filteredLinks = filterCategory === "all" 
    ? allLinks 
    : allLinks.filter(l => l.category === filterCategory || (l.isDefault && filterCategory === "other"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="patient_care">Patient Care</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {filteredLinks.map((link, idx) => {
          const Icon = link.isDefault ? iconMap[link.icon] : iconMap[link.icon_name] || FileText;
          const gradient = link.isDefault ? link.gradient : colorGradients[link.color] || colorGradients.blue;
          
          return (
            <div key={link.id || idx} className="group relative">
              {link.is_external ? (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-300 flex items-center gap-4 group-hover:-translate-y-1">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors truncate">
                        {link.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </a>
              ) : (
                <Link to={createPageUrl(link.page || link.url)} className="block">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-300 flex items-center gap-4 group-hover:-translate-y-1">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors truncate">
                        {link.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              
              {!link.isDefault && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 bg-white hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEdit(link);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 bg-white hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Delete this link?')) {
                        deleteMutation.mutate(link.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Link' : 'Add Custom Link'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL / Page Name</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g., NotesLibrary or https://example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="patient_care">Patient Care</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="emerald">Emerald</SelectItem>
                    <SelectItem value="indigo">Indigo</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Icon</label>
              <Select value={formData.icon_name} onValueChange={(v) => setFormData({ ...formData, icon_name: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FileText">File Text</SelectItem>
                  <SelectItem value="BookOpen">Book Open</SelectItem>
                  <SelectItem value="Calculator">Calculator</SelectItem>
                  <SelectItem value="Layers">Layers</SelectItem>
                  <SelectItem value="FileCode">File Code</SelectItem>
                  <SelectItem value="ExternalLink">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_external"
                checked={formData.is_external}
                onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_external" className="text-sm">External URL</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingLink ? 'Update' : 'Add'} Link
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}