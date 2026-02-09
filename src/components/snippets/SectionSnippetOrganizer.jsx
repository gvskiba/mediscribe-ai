import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SECTION_MAPPINGS = {
  hpi: {
    label: "History of Present Illness",
    keywords: ["hpi", "chief complaint", "onset", "duration", "severity"],
    icon: "📋"
  },
  ros: {
    label: "Review of Systems",
    keywords: ["ros", "system review", "symptoms", "systemic"],
    icon: "🔍"
  },
  exam: {
    label: "Physical Exam",
    keywords: ["exam", "physical examination", "vital", "inspection", "palpation"],
    icon: "🩺"
  },
  assessment: {
    label: "Assessment",
    keywords: ["assessment", "impression", "diagnosis", "differential"],
    icon: "📊"
  },
  plan: {
    label: "Plan",
    keywords: ["plan", "treatment", "medication", "follow-up", "disposition"],
    icon: "📝"
  },
  pmh: {
    label: "Past Medical History",
    keywords: ["pmh", "history", "past medical", "chronic", "previous"],
    icon: "📚"
  },
  medications: {
    label: "Medications",
    keywords: ["medication", "drug", "prescription", "dose", "dosage"],
    icon: "💊"
  },
  allergies: {
    label: "Allergies",
    keywords: ["allergy", "allergic", "reaction", "intolerance"],
    icon: "⚠️"
  }
};

export default function SectionSnippetOrganizer() {
  const [selectedSection, setSelectedSection] = useState("hpi");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ["snippets"],
    queryFn: () => base44.entities.Snippet.list()
  });

  const filterSnippetsBySection = () => {
    const section = SECTION_MAPPINGS[selectedSection];
    if (!section) return snippets;

    return snippets.filter(snippet => {
      const text = `${snippet.name} ${snippet.content} ${snippet.category || ""}`.toLowerCase();
      return section.keywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
  };

  const filtered = filterSnippetsBySection().filter(snippet =>
    snippet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopySnippet = (snippet) => {
    navigator.clipboard.writeText(snippet.content);
    setCopiedId(snippet.id);
    toast.success("Snippet copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Section Buttons */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Filter by Note Section</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(SECTION_MAPPINGS).map(([key, section]) => (
            <Button
              key={key}
              variant={selectedSection === key ? "default" : "outline"}
              onClick={() => setSelectedSection(key)}
              className="text-left justify-start gap-2"
            >
              <span>{section.icon}</span>
              <span className="text-xs">{section.label.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search snippets in this section..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Section Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{SECTION_MAPPINGS[selectedSection].icon}</span>
            {SECTION_MAPPINGS[selectedSection].label}
          </CardTitle>
          <CardDescription>
            {filtered.length} snippet{filtered.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Snippets List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-slate-500 text-sm">Loading snippets...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm">No snippets found for this section. Try searching or select a different section.</p>
        ) : (
          filtered.map((snippet) => (
            <Card key={snippet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">{snippet.name}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{snippet.content}</p>
                    <div className="flex gap-2 flex-wrap">
                      {snippet.category && (
                        <Badge variant="outline" className="text-xs">
                          {snippet.category}
                        </Badge>
                      )}
                      {snippet.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {snippet.is_favorite && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">⭐ Favorite</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySnippet(snippet)}
                    className="flex-shrink-0"
                  >
                    {copiedId === snippet.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}