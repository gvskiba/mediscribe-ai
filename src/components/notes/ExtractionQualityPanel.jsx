import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { TrendingUp, MessageSquare, AlertCircle } from "lucide-react";

export default function ExtractionQualityPanel({ noteId, feedback = [], isLoading = false }) {
  const [stats, setStats] = useState({
    averageConfidence: 0,
    lowConfidenceFields: [],
    feedbackCount: 0,
    averageAccuracy: 0
  });

  useEffect(() => {
    if (feedback.length > 0) {
      calculateStats();
    }
  }, [feedback]);

  const calculateStats = () => {
    if (feedback.length === 0) {
      setStats({
        averageConfidence: 0,
        lowConfidenceFields: [],
        feedbackCount: 0,
        averageAccuracy: 0
      });
      return;
    }

    const avgConfidence = 
      feedback.reduce((sum, f) => sum + (f.confidence_score || 0), 0) / feedback.length;
    
    const avgAccuracy = 
      feedback.reduce((sum, f) => sum + (f.accuracy_rating || 0), 0) / feedback.length;

    const lowConfidence = feedback
      .filter(f => (f.confidence_score || 0) < 0.6)
      .map(f => f.field_name);

    setStats({
      averageConfidence: avgConfidence,
      lowConfidenceFields: lowConfidence,
      feedbackCount: feedback.length,
      averageAccuracy: avgAccuracy
    });
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          Extraction Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Overall Confidence</p>
            <p className="text-xs text-gray-600 mt-1">Average AI confidence across extractions</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600">
              {Math.round(stats.averageConfidence * 100)}%
            </p>
          </div>
        </div>

        {/* Accuracy Rating */}
        {stats.feedbackCount > 0 && (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Your Accuracy Rating</p>
              <p className="text-xs text-gray-600 mt-1">Based on {stats.feedbackCount} feedback(s)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {stats.averageAccuracy.toFixed(1)}/5
              </p>
            </div>
          </div>
        )}

        {/* Low Confidence Fields */}
        {stats.lowConfidenceFields.length > 0 && (
          <div className="bg-white rounded p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Review needed</p>
                <p className="text-xs text-gray-600 mt-1">
                  These extractions have low confidence:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {stats.lowConfidenceFields.map((field) => (
                    <span
                      key={field}
                      className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded"
                    >
                      {field.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        {stats.feedbackCount === 0 && (
          <div className="bg-white rounded p-3 border border-amber-200 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Help improve extraction</p>
              <p className="text-xs text-gray-600 mt-1">
                Rate field accuracy to fine-tune future extractions
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}