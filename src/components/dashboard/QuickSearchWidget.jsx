import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, FileText, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const T = {
  navy: "#0b1d35",
  slate: "#1a2f4f",
  border: "rgba(0, 212, 188, 0.15)",
  text: "#e0e6f2",
  dim: "#8899bb",
  teal: "#00d4bc",
};

export default function QuickSearchWidget() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Enter a search term");
      return;
    }

    setLoading(true);
    try {
      // Search both guidelines and notes
      const [guidelinesRes, notesRes] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Find clinical guidelines related to: "${query}".\nReturn 3-5 most relevant results with title and brief description.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    type: { type: "string", enum: ["guideline"] },
                  },
                },
              },
            },
          },
        }),
        base44.entities.ClinicalNote.filter(
          { patient_name: { $regex: query, $options: "i" } },
          "-updated_date",
          3
        ).catch(() => []),
      ]);

      const guidelineResults = (guidelinesRes.results || []).map((r) => ({
        ...r,
        type: "guideline",
      }));
      const noteResults = (notesRes || []).map((note) => ({
        title: `${note.patient_name} - ${note.date_of_visit || "No date"}`,
        description: note.chief_complaint || note.summary || "Clinical note",
        type: "note",
        id: note.id,
      }));

      setResults([...guidelineResults, ...noteResults]);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "16px", height: "100%" }}>
      <div style={{ marginBottom: "12px", fontSize: "12px", fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Quick Search
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <Input
          placeholder="Search guidelines or notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ background: T.slate, border: `1px solid ${T.border}`, color: T.text }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: T.teal,
            border: "none",
            borderRadius: "6px",
            color: T.navy,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
          }}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
        </button>
      </div>

      <div style={{ maxHeight: "200px", overflowY: "auto", space: "4px" }}>
        {results.length === 0 ? (
          <div style={{ color: T.dim, fontSize: "11px", textAlign: "center", padding: "20px 0" }}>
            {query ? "No results found" : "Enter search terms above"}
          </div>
        ) : (
          results.map((result, idx) => (
            <a
              key={idx}
              href={result.id ? `/NoteDetail?id=${result.id}` : "#"}
              style={{
                display: "block",
                padding: "8px 10px",
                background: "rgba(0, 212, 188, 0.08)",
                borderRadius: "6px",
                marginBottom: "6px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 212, 188, 0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 212, 188, 0.08)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                {result.type === "guideline" ? (
                  <BookOpen className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <FileText className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: T.text, fontWeight: 500, lineHeight: "1.3" }}>
                    {result.title}
                  </div>
                  <div style={{ fontSize: "10px", color: T.dim, lineHeight: "1.2", marginTop: "2px" }}>
                    {result.description}
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}