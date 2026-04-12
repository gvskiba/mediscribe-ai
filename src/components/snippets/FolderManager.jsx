import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Folder, Plus, Trash2, Edit, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const colors = ["blue", "purple", "pink", "red", "orange", "green", "cyan"];

export default function FolderManager({ selectedFolder, onSelectFolder, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");

  const { data: folders = [] } = useQuery({
    queryKey: ["snippetFolders"],
    queryFn: () => base44.entities.SnippetFolder.list("-created_date", 100)
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.SnippetFolder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippetFolders"] });
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("Folder created");
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id) => base44.entities.SnippetFolder.delete(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["snippetFolders"] });
      if (selectedFolder?.id === id) {
        onSelectFolder(null);
      }
      toast.success("Folder deleted");
    }
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    createFolderMutation.mutate({ name: newFolderName, color: selectedColor });
  };

  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    pink: "bg-pink-100 text-pink-700 border-pink-300",
    red: "bg-red-100 text-red-700 border-red-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
    green: "bg-green-100 text-green-700 border-green-300",
    cyan: "bg-cyan-100 text-cyan-700 border-cyan-300"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Snippet Folders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => onSelectFolder(null)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                !selectedFolder
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                All Snippets
              </div>
            </button>

            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                  selectedFolder?.id === folder.id
                    ? `${colorClasses[folder.color]} font-medium`
                    : "hover:bg-slate-50 text-slate-600"
                }`}
                onClick={() => onSelectFolder(folder)}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{folder.name}</p>
                  {folder.description && (
                    <p className="text-xs opacity-70 truncate">{folder.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${folder.name}"?`)) {
                      deleteFolderMutation.mutate(folder.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {showNewFolder ? (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <div className="flex gap-1 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? `${colorClasses[color]} border-current`
                        : colorClasses[color]
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="rounded-lg flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg flex-1"
                >
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowNewFolder(true)}
              variant="outline"
              className="w-full rounded-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}