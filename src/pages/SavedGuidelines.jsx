import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, Trash2, ExternalLink, X } from "lucide-react";

export default function SavedGuidelines() {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      const saved = await base44.entities.SavedGuideline.list("-saved_date");
      setGuidelines(saved || []);
    } catch (error) {
      console.error("Failed to load guidelines:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGuideline = async (id) => {
    if (!window.confirm("Delete this guideline?")) return;
    try {
      await base44.entities.SavedGuideline.delete(id);
      setGuidelines(guidelines.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Failed to delete guideline:", error);
    }
  };

  const saveEdit = async (id, guideline) => {
    const tagArray = editTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await base44.entities.SavedGuideline.update(id, {
        tags: tagArray,
        notes: editNotes.trim(),
      });
      setGuidelines(
        guidelines.map((g) =>
          g.id === id ? { ...g, tags: tagArray, notes: editNotes.trim() } : g
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const allTags = Array.from(new Set(guidelines.flatMap((g) => g.tags || [])));

  const filteredGuidelines = guidelines.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => (g.tags || []).includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Bookmark className="w-8 h-8" style={{ color: "#2563eb" }} />
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#111827", margin: 0 }}>
              Saved Guidelines
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
            {guidelines.length} {guidelines.length === 1 ? "guideline" : "guidelines"} saved
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
          <input
            type="text"
            placeholder="Search guidelines by title or source…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {allTags.length > 0 && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Filter by tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTags(
                        selectedTags.includes(tag)
                          ? selectedTags.filter((t) => t !== tag)
                          : [...selectedTags, tag]
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      border: "1px solid #e5e7eb",
                      background: selectedTags.includes(tag) ? "#dbeafe" : "#fff",
                      color: selectedTags.includes(tag) ? "#1e40af" : "#6b7280",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guidelines List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>Loading...</div>
        ) : filteredGuidelines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 40px",
              background: "#fff",
              borderRadius: "12px",
              color: "#9ca3af",
              border: "1px solid #e5e7eb",
            }}
          >
            <Bookmark className="w-12 h-12" style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p style={{ fontSize: "16px", margin: 0 }}>
              {guidelines.length === 0 ? "No saved guidelines yet" : "No guidelines match your search"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredGuidelines.map((guideline) => (
              <div
                key={guideline.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.07)";
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                {editingId === guideline.id ? (
                  // Edit Mode
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
                      {guideline.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                      {guideline.source}
                    </p>

                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Tags
                      </label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                          boxSizing: "border-box",
                        }}
                        placeholder="comma-separated tags"
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          minHeight: "80px",
                        }}
                        placeholder="Your notes…"
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => saveEdit(guideline.id, guideline)}
                        style={{
                          padding: "8px 16px",
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: "8px 16px",
                          background: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
                        {guideline.title}
                      </h3>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => window.open(guideline.url, "_blank")}
                          style={{
                            background: "transparent",
                            border: "1px solid #e5e7eb",
                            color: "#2563eb",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(guideline.id);
                            setEditTags((guideline.tags || []).join(", "));
                            setEditNotes(guideline.notes || "");
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid #e5e7eb",
                            color: "#6b7280",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteGuideline(guideline.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #e5e7eb",
                            color: "#ef4444",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                      {guideline.source}
                    </p>

                    {guideline.description && (
                      <p style={{ fontSize: "13px", color: "#374151", marginBottom: "12px", lineHeight: 1.5 }}>
                        {guideline.description}
                      </p>
                    )}

                    {(guideline.tags || []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                        {guideline.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: "inline-block",
                              background: "#e0e7ff",
                              color: "#3730a3",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {guideline.notes && (
                      <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", borderLeft: "3px solid #2563eb" }}>
                        <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, margin: "0 0 4px 0" }}>NOTES</p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>
                          {guideline.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}