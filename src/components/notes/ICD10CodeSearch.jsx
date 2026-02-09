import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ICD10CodeSearch({ suggestions, diagnoses, onAddDiagnoses }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for ICD-10 diagnosis codes related to: "${searchQuery}"
        
Return the most relevant ICD-10 codes (up to 5) that match this search term. For each code, provide:
1. ICD-10 code (e.g., E11.9, I10)
2. Full description of the diagnosis
3. Commonly associated conditions`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  associated_conditions: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSearchResults(result.codes || []);
      setSelectedCodes(new Set());
      if (result.codes?.length === 0) {
        toast.info("No ICD-10 codes found for that search");
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search ICD-10 codes");
    } finally {
      setLoading(false);
    }
  };

  const toggleCode = (idx) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedCodes(newSelected);
  };

  const handleAddSelected = () => {
    const selectedArray = Array.from(selectedCodes).map(idx => {
      const code = searchResults[idx];
      return `${code.code} - ${code.description}`;
    });

    if (selectedArray.length === 0) {
      toast.error("Please select at least one code");
      return;
    }

    onAddDiagnoses(selectedArray);
    setSelectedCodes(new Set());
    setSearchResults([]);
    setSearchQuery("");
    setShowSearch(false);
    toast.success(`Added ${selectedArray.length} diagnosis code(s)`);
  };

  return (
    <div className="space-y-3">
      {!showSearch && (
        <Button
          onClick={() => setShowSearch(true)}
          variant="outline"
          size="sm"
          className="w-full gap-2 text-slate-700"
        >
          <Search className="w-4 h-4" />
          Search ICD-10 Codes
        </Button>
      )}

      {showSearch && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by diagnosis or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white text-sm"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              size="sm"
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchResults([]);
                setSearchQuery("");
                setSelectedCodes(new Set());
              }}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((code, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-lg p-2.5 border-2 cursor-pointer transition-all ${
                    selectedCodes.has(idx) ? "border-blue-500 bg-blue-50" : "border-slate-200"
                  }`}
                  onClick={() => toggleCode(idx)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{code.code}</p>
                      <p className="text-xs text-slate-600 mt-1">{code.description}</p>
                      {code.associated_conditions && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-medium">Related:</span> {code.associated_conditions}
                        </p>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedCodes.has(idx) ? "bg-blue-500 border-blue-500" : "border-slate-300"
                    }`}>
                      {selectedCodes.has(idx) && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="flex gap-2 pt-2 border-t border-blue-200">
              <Button
                onClick={handleAddSelected}
                disabled={selectedCodes.size === 0}
                size="sm"
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Selected ({selectedCodes.size})
              </Button>
              {selectedCodes.size > 0 && (
                <Button
                  onClick={() => setSelectedCodes(new Set())}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}