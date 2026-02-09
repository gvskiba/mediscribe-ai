import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const snippetCategories = [
  { value: "exam", label: "Physical Exam" },
  { value: "ros", label: "Review of Systems" },
  { value: "hpi", label: "HPI" },
  { value: "assessment", label: "Assessment" },
  { value: "plan", label: "Plan" },
];

const specialties = [
  "General Medicine",
  "Cardiology",
  "Pulmonology",
  "Gastroenterology",
  "Neurology",
  "Endocrinology",
  "Rheumatology",
  "Orthopedics",
];

const tones = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "concise", label: "Concise" },
];

const formats = [
  { value: "paragraph", label: "Paragraph" },
  { value: "bullets", label: "Bullet Points" },
];

export default function AISnippetGenerator({ onTemplatesGenerated, open, onOpenChange }) {
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("exam");
  const [selectedSpecialty, setSelectedSpecialty] = useState("General Medicine");
  const [selectedTone, setSelectedTone] = useState("formal");
  const [selectedFormat, setSelectedFormat] = useState("paragraph");

  const generateTags = async (content) => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this medical snippet and suggest 2-4 relevant tags for organization and filtering. Tags should be short, lowercase, and relevant to clinical practice.

Content: "${content}"

Return as JSON with structure: { "tags": ["tag1", "tag2", "tag3"] }`,
        response_json_schema: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      return response.data.tags || [];
    } catch {
      return [];
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const toneLabel = tones.find(t => t.value === selectedTone)?.label || "formal";
      const formatLabel = formats.find(f => f.value === selectedFormat)?.label || "paragraph";
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3-5 clinical snippet templates for ${selectedSpecialty} doctors in the "${snippetCategories.find(c => c.value === selectedCategory)?.label}" category.
        
        Requirements:
        - Tone: ${toneLabel}
        - Format: ${formatLabel}${selectedFormat === "bullets" ? "\n- Use bullet points instead of paragraphs" : ""}
        - A realistic, reusable clinical note snippet
        - Medical language appropriate for the tone
        ${selectedTone === "concise" ? "- Keep each snippet brief (1-2 sentences)" : "- 2-3 sentences each"}
        
        Return as JSON array with this structure:
        [
          { "name": "Snippet title", "content": "Clinical text content" },
          ...
        ]`,
        response_json_schema: {
          type: "object",
          properties: {
            snippets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  content: { type: "string" }
                }
              }
            }
          }
        }
      });

      const templates = await Promise.all(response.data.snippets.map(async (s) => ({
        name: s.name,
        content: s.content,
        category: selectedCategory,
        specialty: selectedSpecialty,
        tags: await generateTags(s.content)
      })));

      onTemplatesGenerated(templates);
      onOpenChange(false);
      toast.success(`Generated ${templates.length} snippet templates with auto-tags`);
    } catch (error) {
      toast.error("Failed to generate templates");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Template Generator
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Specialty</label>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snippetCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg flex-1 gap-2"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Templates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}