import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MedicationDosingLookup({ type = "pediatric" }) {
  const [medication, setMedication] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [indication, setIndication] = useState("");
  const [renalFunction, setRenalFunction] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isPediatric = type === "pediatric";

  const lookupDosing = async () => {
    if (!medication) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = isPediatric
        ? `Provide evidence-based dosing guidelines for ${medication} in pediatric patients.
        
Patient Information:
- Weight: ${weight || "Not specified"} kg
- Age: ${age || "Not specified"}
- Indication: ${indication || "General use"}

Provide the following in a structured format:
1. Standard pediatric dosing with mg per kg guidelines
2. Maximum single dose
3. Dosing interval and frequency
4. Maximum daily dose
5. Recommended duration of therapy in days
6. Important safety considerations
7. Age-specific considerations if applicable

Focus on current clinical practice guidelines and evidence-based recommendations.`
        : `Provide evidence-based dosing guidelines for ${medication} in adult patients.

Patient Information:
- Indication: ${indication || "General use"}
- Renal Function: ${renalFunction}
- Additional context: ${age ? `Age ${age} years` : ""}

Provide the following in a structured format:
1. Standard adult dosing regimen
2. Alternative dosing if applicable
3. Dosing interval and frequency
4. Maximum daily dose
5. Recommended duration of therapy in days
6. Renal dose adjustments if needed
7. Important safety considerations and contraindications

Focus on current clinical practice guidelines and evidence-based recommendations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            standard_dose: { type: "string" },
            max_single_dose: { type: "string" },
            frequency: { type: "string" },
            max_daily_dose: { type: "string" },
            duration_days: { type: "string" },
            safety_notes: { type: "string" },
            special_considerations: { type: "string" },
            renal_adjustment: { type: "string" }
          }
        }
      });

      setResult(response);
    } catch (err) {
      setError("Failed to retrieve dosing information. Please verify the medication name and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${isPediatric ? "bg-pink-500/10" : "bg-blue-500/10"} flex items-center justify-center`}>
          <Pill className={`w-4 h-4 ${isPediatric ? "text-pink-600" : "text-blue-600"}`} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {isPediatric ? "Pediatric" : "Adult"} Medication Dosing Lookup
        </h2>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Medication Name *</Label>
          <Input
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            placeholder="e.g., Amoxicillin, Acetaminophen"
          />
        </div>

        {isPediatric ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
              <div>
                <Label>Age</Label>
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 5 years"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Renal Function</Label>
              <Select value={renalFunction} onValueChange={setRenalFunction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (CrCl &gt;60)</SelectItem>
                  <SelectItem value="moderate">Moderate (CrCl 30-60)</SelectItem>
                  <SelectItem value="severe">Severe (CrCl &lt;30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age (optional)</Label>
              <Input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 65"
              />
            </div>
          </>
        )}

        <div>
          <Label>Indication (optional)</Label>
          <Input
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="e.g., Acute otitis media, Pneumonia"
          />
        </div>

        <Button 
          onClick={lookupDosing} 
          className="w-full"
          disabled={loading || !medication}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Looking up guidelines...
            </>
          ) : (
            "Look Up Dosing"
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Evidence-Based Guidelines
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-1">Standard Dose</p>
              <p className="text-sm text-blue-800">{result.standard_dose}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-1">Max Single Dose</p>
                <p className="text-sm text-slate-900">{result.max_single_dose}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-1">Frequency</p>
                <p className="text-sm text-slate-900">{result.frequency}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-1">Max Daily Dose</p>
                <p className="text-sm text-slate-900">{result.max_daily_dose}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-1">Duration</p>
                <p className="text-sm text-slate-900">{result.duration_days}</p>
              </div>
            </div>

            {result.renal_adjustment && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1">Renal Adjustment</p>
                <p className="text-sm text-amber-800">{result.renal_adjustment}</p>
              </div>
            )}

            {result.safety_notes && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-900 mb-1">Safety Considerations</p>
                <p className="text-sm text-red-800">{result.safety_notes}</p>
              </div>
            )}

            {result.special_considerations && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-semibold text-purple-900 mb-1">
                  {isPediatric ? "Age-Specific Notes" : "Special Considerations"}
                </p>
                <p className="text-sm text-purple-800">{result.special_considerations}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-4 italic">
            Guidelines retrieved from current clinical practice standards. Always verify with institutional protocols and consider individual patient factors.
          </p>
        </div>
      )}
    </Card>
  );
}