import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Code, Check, X, Loader2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function ICD10Suggestions({ suggestions, loading, onAccept, onReject, onApplyToNote, readOnly = false }) {
  const [acceptedCodes, setAcceptedCodes] = useState([]);
  const [rejectedCodes, setRejectedCodes] = useState([]);
  const [selectableMode, setSelectableMode] = useState(false);
  const [selectedForApply, setSelectedForApply] = useState([]);
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAccept = (code) => {
    setAcceptedCodes([...acceptedCodes, code.code]);
    if (onAccept) onAccept(code);
  };

  const handleReject = (code) => {
    setRejectedCodes([...rejectedCodes, code.code]);
    if (onReject) onReject(code);
  };

  const toggleCodeSelection = (code) => {
    if (selectedForApply.includes(code)) {
      setSelectedForApply(selectedForApply.filter(c => c !== code));
    } else {
      setSelectedForApply([...selectedForApply, code]);
    }
  };

  const handleApplySelected = () => {
    if (onApplyToNote && selectedForApply.length > 0) {
      const codesWithDetails = scoredSuggestions.filter(s => selectedForApply.includes(s.code));
      onApplyToNote(codesWithDetails);
      setSelectedForApply([]);
      setShowApplyPanel(false);
    }
  };

  const isAccepted = (code) => acceptedCodes.includes(code);
  const isRejected = (code) => rejectedCodes.includes(code);

  // Score and rank suggestions by confidence, specificity, and relevance
  const scoredSuggestions = suggestions.map((s, idx) => {
    const confidenceScore = s.confidence === "high" ? 3 : s.confidence === "moderate" ? 2 : 1;
    const specificityScore = (s.code?.length || 0) >= 5 ? 2 : 1;
    const recencyScore = (suggestions.length - idx) * 0.5;
    const totalScore = (confidenceScore * 4) + (specificityScore * 2) + recencyScore;
    return { ...s, score: totalScore };
  }).sort((a, b) => b.score - a.score);

  // Filter by search term
  const filteredSuggestions = searchTerm.trim() === ""
    ? scoredSuggestions
    : scoredSuggestions.filter(s =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return (
      <Card className="p-4 bg-white border-slate-200">
        <div className="flex items-center gap-2 text-slate-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating ICD-10 code suggestions...</span>
        </div>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="p-4 border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Suggested ICD-10 Codes</h3>
          <Badge variant="secondary" className="text-xs">{filteredSuggestions.length}</Badge>
        </div>
        {!readOnly && suggestions.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowApplyPanel(!showApplyPanel)}
            className="text-xs gap-1"
          >
            {showApplyPanel ? (
              <><ChevronUp className="w-3 h-3" /> Hide</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Bulk Apply</>
            )}
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-700 mb-4">AI-ranked codes based on diagnoses and assessment — high confidence codes appear first</p>

      {/* Search Box */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          placeholder="Search by code, description, or diagnosis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-sm border-slate-200"
        />
      </div>

      {showApplyPanel && !readOnly && (
       <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4"
       >
         <div className="text-sm font-medium text-slate-900 mb-2">Select codes to add to diagnoses:</div>
          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <label key={suggestion.code} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedForApply.includes(suggestion.code)}
                  onChange={() => toggleCodeSelection(suggestion.code)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-900">{suggestion.code} - {suggestion.description}</span>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleApplySelected}
            disabled={selectedForApply.length === 0}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white"
          >
            Apply {selectedForApply.length > 0 && `(${selectedForApply.length})`} Selected Codes
          </Button>
        </motion.div>
      )}

      {filteredSuggestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No codes match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSuggestions.map((suggestion, idx) => {
            const accepted = isAccepted(suggestion.code);
            const rejected = isRejected(suggestion.code);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-lg border p-3 transition-all ${
                  accepted ? "border-green-300 bg-green-50" :
                  rejected ? "border-slate-200 bg-slate-50 opacity-50" :
                  "border-purple-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="bg-slate-100 text-slate-900 border-slate-200 font-mono">
                        {suggestion.code}
                      </Badge>
                      {suggestion.confidence && (
                        <Badge 
                          className={`text-xs ${
                            suggestion.confidence === "high" ? "bg-green-600 text-white" :
                            suggestion.confidence === "moderate" ? "bg-yellow-600 text-white" :
                            "bg-slate-400 text-white"
                          }`}
                        >
                          {suggestion.confidence} confidence
                        </Badge>
                      )}
                      {accepted && (
                        <Badge className="bg-emerald-600 text-white">
                          <Check className="w-3 h-3 mr-1" /> Applied
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900">{suggestion.description}</div>
                    <div className="text-xs text-slate-500 mt-1">For: {suggestion.diagnosis}</div>
                  </div>
                  {!readOnly && !accepted && !rejected && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onApplyToNote) {
                            onApplyToNote([suggestion]);
                          }
                          handleAccept(suggestion);
                        }}
                        className="h-8 px-2 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                        title="Add this code to the clinical note"
                      >
                        <Check className="w-4 h-4" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(suggestion)}
                        className="h-8 px-2 text-slate-400 border-slate-200 hover:bg-slate-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}