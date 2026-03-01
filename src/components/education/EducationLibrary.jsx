import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Heart, Trash2, Globe, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import EducationMaterialViewer from "./EducationMaterialViewer";

const LANG_FLAGS = { English: "🇺🇸", Spanish: "🇪🇸", French: "🇫🇷", Chinese: "🇨🇳", Arabic: "🇸🇦", Portuguese: "🇧🇷" };

export default function EducationLibrary({ onCreateNew }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("All");
  const [filterFav, setFilterFav] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["educationMaterials"],
    queryFn: () => base44.entities.PatientEducationMaterial.list("-created_date", 100)
  });

  const filtered = materials.filter(m => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === "All" || m.language === filterLang;
    const matchFav = !filterFav || m.is_favorite;
    return matchSearch && matchLang && matchFav;
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.PatientEducationMaterial.delete(id);
    queryClient.invalidateQueries({ queryKey: ["educationMaterials"] });
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted");
  };

  const handleUpdate = (updated) => {
    queryClient.invalidateQueries({ queryKey: ["educationMaterials"] });
    setSelected(updated);
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to Library
        </button>
        <EducationMaterialViewer material={selected} onUpdate={handleUpdate} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." style={{ paddingLeft: 32 }} />
        </div>
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ fontSize: 12, padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", outline: "none" }}>
          <option>All</option>
          {["English", "Spanish", "French", "Chinese", "Arabic", "Portuguese"].map(l => <option key={l}>{l}</option>)}
        </select>
        <Button onClick={() => setFilterFav(f => !f)} size="sm" variant={filterFav ? "default" : "outline"} className="gap-1 text-xs">
          <Heart size={12} /> Favorites
        </Button>
        {onCreateNew && (
          <Button onClick={onCreateNew} size="sm" className="bg-blue-600 text-white gap-1 text-xs">
            <Plus size={12} /> New
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>Loading library…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <BookOpen size={32} style={{ color: "#cbd5e1", margin: "0 auto 10px" }} />
          <p style={{ color: "#94a3b8", fontSize: 13 }}>No materials found. Generate one to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(m => (
            <div
              key={m.id}
              onClick={() => setSelected(m)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", background: "white", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            >
              <div style={{ fontSize: 20, flexShrink: 0 }}>{LANG_FLAGS[m.language] || "🌐"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {m.language} · {m.diagnosis} {m.patient_name ? `· ${m.patient_name}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {m.is_favorite && <Heart size={13} color="#ef4444" fill="#ef4444" />}
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(m.created_date).toLocaleDateString()}</span>
                <button
                  onClick={e => handleDelete(m.id, e)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 3, borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}