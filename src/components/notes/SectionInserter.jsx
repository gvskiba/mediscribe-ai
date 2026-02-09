import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SectionInserter({ 
  onInsertSection, 
  sectionType = "all",
  specialty = null,
  visitType = null 
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(sectionType);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["reusableSections"],
    queryFn: () => base44.entities.ReusableSection.list(),
  });

  const filteredSections = sections.filter((section) => {
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || section.section_type === selectedType;
    const matchesSpecialty = !specialty || section.specialty?.includes(specialty);
    const matchesVisitType = !visitType || section.visit_types?.includes(visitType);
    return matchesSearch && matchesType && matchesSpecialty && matchesVisitType;
  });

  const favorites = filteredSections.filter(s => s.is_favorite).sort((a, b) => a.name.localeCompare(b.name));
  const others = filteredSections.filter(s => !s.is_favorite).sort((a, b) => a.name.localeCompare(b.name));

  const handleInsertSection = async (section) => {
    onInsertSection(section);
    toast.success(`"${section.name}" inserted`);
    setOpenDialog(false);

    // Update usage count
    await base44.entities.ReusableSection.update(section.id, {
      usage_count: (section.usage_count || 0) + 1,
      last_used: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-lg">
          <Plus className="w-4 h-4" /> Insert Template Section
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Template Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sections..."
              className="flex-1 rounded-lg"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="hpi">HPI</option>
              <option value="ros">ROS</option>
              <option value="physical_exam">Physical Exam</option>
              <option value="assessment">Assessment</option>
              <option value="plan">Plan</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No sections found. Create some in the Section Library.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Favorites */}
              {favorites.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">⭐ Favorites</h4>
                  <div className="space-y-2">
                    {favorites.map(section => (
                      <SectionPreview
                        key={section.id}
                        section={section}
                        onInsert={() => handleInsertSection(section)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Sections */}
              {others.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">All Sections</h4>
                  <div className="space-y-2">
                    {others.map(section => (
                      <SectionPreview
                        key={section.id}
                        section={section}
                        onInsert={() => handleInsertSection(section)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionPreview({ section, onInsert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h5 className="font-medium text-slate-900">{section.name}</h5>
          {section.description && (
            <p className="text-xs text-slate-600 mt-0.5">{section.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs h-6 flex items-center">
              {section.section_type.replace(/_/g, " ")}
            </Badge>
            {section.specialty?.map(spec => (
              <Badge key={spec} variant="secondary" className="text-xs h-6 flex items-center">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          onClick={onInsert}
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
        >
          <Copy className="w-3.5 h-3.5" /> Insert
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-300">
          <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border border-slate-200 max-h-[200px] overflow-y-auto">
            {section.content}
          </p>
        </div>
      )}
    </div>
  );
}