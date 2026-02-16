import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, FileText } from "lucide-react";

export default function CreatinineClearanceCalculator({ onAddToNote }) {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [sex, setSex] = useState("male");
  const [result, setResult] = useState(null);

  const calculateCrCl = () => {
    if (!age || !weight || !creatinine) return;

    const ageNum = parseFloat(age);
    const weightNum = parseFloat(weight);
    const crNum = parseFloat(creatinine);

    let crCl = ((140 - ageNum) * weightNum) / (72 * crNum);
    if (sex === "female") {
      crCl *= 0.85;
    }

    let category = "";
    let color = "";
    if (crCl >= 90) {
      category = "Normal";
      color = "text-green-700";
    } else if (crCl >= 60) {
      category = "Mild CKD (Stage 2)";
      color = "text-green-700";
    } else if (crCl >= 30) {
      category = "Moderate CKD (Stage 3)";
      color = "text-amber-700";
    } else if (crCl >= 15) {
      category = "Severe CKD (Stage 4)";
      color = "text-red-700";
    } else {
      category = "ESRD (Stage 5)";
      color = "text-red-700";
    }

    setResult({ value: crCl.toFixed(1), category, color });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Age (years)</label>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 65"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Weight (kg)</label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 70"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Serum Creatinine (mg/dL)</label>
          <Input
            type="number"
            step="0.1"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
            placeholder="e.g., 1.2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Sex</label>
          <select 
            value={sex} 
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <Button onClick={calculateCrCl} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
          Calculate CrCl
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 text-center space-y-2">
          <p className="text-4xl font-bold text-slate-900">{result.value}</p>
          <p className="text-sm text-slate-600 font-medium">mL/min</p>
          <p className={`text-lg font-semibold ${result.color}`}>{result.category}</p>
          <p className="text-xs text-slate-500 mt-3">Cockcroft-Gault formula</p>
          {onAddToNote && (
            <Button
              onClick={() => onAddToNote({
                name: "Creatinine Clearance (Cockcroft-Gault)",
                inputs: { age: `${age} years`, weight: `${weight} kg`, creatinine: `${creatinine} mg/dL`, sex },
                result: `CrCl: ${result.value} mL/min`,
                interpretation: `${result.category}. Note: Use ideal body weight for obese patients. Consider eGFR for more accurate assessment.`,
                category: "Nephrology",
                url: "https://www.mdcalc.com/calc/43/creatinine-clearance-cockcroft-gault-equation"
              })}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white gap-2 mt-3"
            >
              <FileText className="w-4 h-4" />
              Add to Clinical Note
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
        ⚠️ Use ideal body weight for obese patients. Consider eGFR for more accurate assessment.
      </p>
    </div>
  );
}