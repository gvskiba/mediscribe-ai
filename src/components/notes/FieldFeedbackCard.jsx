import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, X } from "lucide-react";
import ExtractionConfidenceIndicator from "./ExtractionConfidenceIndicator";

export default function FieldFeedbackCard({ 
  fieldName, 
  extractedText, 
  confidence,
  onSubmitFeedback,
  onClose,
  isSubmitting
}) {
  const [rating, setRating] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [correction, setCorrection] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!rating) {
      alert("Please select an accuracy rating");
      return;
    }

    onSubmitFeedback({
      fieldName,
      accuracyRating: rating,
      originalExtraction: extractedText,
      correctedExtraction: correction || null,
      feedbackComment: comment || null,
      confidenceScore: confidence
    });

    // Reset form
    setRating(null);
    setCorrection("");
    setComment("");
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-gray-900">Rate extraction accuracy</h4>
            <p className="text-sm text-gray-600 mt-1">{fieldName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confidence Indicator */}
        <ExtractionConfidenceIndicator confidence={confidence} fieldName={fieldName} />

        {/* Original Extraction */}
        <div className="bg-white rounded p-3 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">AI Extracted:</p>
          <p className="text-sm text-gray-700 line-clamp-3">{extractedText}</p>
        </div>

        {/* Rating Stars */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">How accurate is this extraction?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    (hoveredRating || rating) >= value
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating && (
            <p className="text-xs text-gray-600 mt-1">
              {["Very Inaccurate", "Inaccurate", "Neutral", "Accurate", "Very Accurate"][rating - 1]}
            </p>
          )}
        </div>

        {/* Correction */}
        {rating && rating < 4 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Provide correct version (optional)
            </label>
            <Textarea
              placeholder="Enter the corrected extraction..."
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              className="h-20 text-sm"
            />
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Additional feedback (optional)
          </label>
          <Textarea
            placeholder="What could be improved? Any missing information?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-16 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </div>
    </Card>
  );
}