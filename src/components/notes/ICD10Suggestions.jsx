import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

export default function ICD10Suggestions({ suggestions, loading, onAccept, onReject, onApplyToNote }) {
  const [acceptedCodes, setAcceptedCodes] = useState([]);
  const [rejectedCodes, setRejectedCodes] = useState([]);
  const [selectableMode, setSelectableMode] = useState(false);
  const [selectedForApply, setSelectedForApply] = useState([]);
  const [showApplyPanel, setShowApplyPanel] = useState(false);

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
      const codesWithDetails = suggestions.filter(s => selectedForApply.includes(s.code));
      onApplyToNote(codesWithDetails);
      setSelectedForApply([]);
      setShowApplyPanel(false);
    }
  };

  const isAccepted = (code) => acceptedCodes.includes(code);
  const isRejected = (code) => rejectedCodes.includes(code);

  if (loading) {
    return (
      <Card className="p-4 bg-purple-50 border-purple-100">
        <div className="flex items-center gap-2 text-purple-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Generating ICD-10 code suggestions...</span>
        </div>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="p-4 border-purple-200 bg-purple-50/50">
      <div className="flex items-center gap-2 mb-3">
        <Code className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-slate-900">Suggested ICD-10 Codes</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">AI-generated code suggestions based on diagnoses and assessment</p>

      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => {
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
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 font-mono">
                      {suggestion.code}
                    </Badge>
                    {accepted && (
                      <Badge className="bg-green-600 text-white">
                        <Check className="w-3 h-3 mr-1" /> Applied
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-900">{suggestion.description}</div>
                  <div className="text-xs text-slate-500 mt-1">For: {suggestion.diagnosis}</div>
                </div>
                {!accepted && !rejected && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAccept(suggestion)}
                      className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" />
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
    </Card>
  );
}