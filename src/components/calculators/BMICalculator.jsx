import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, FileText } from "lucide-react";

export default function BMICalculator({ onAddToNote }) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("metric");
  const [bmi, setBmi] = useState(null);

  const calculateBMI = () => {
    if (!height || !weight) return;

    let bmiValue;
    if (unit === "metric") {
      const heightM = parseFloat(height) / 100;
      bmiValue = parseFloat(weight) / (heightM * heightM);
    } else {
      const heightIn = parseFloat(height);
      bmiValue = (parseFloat(weight) * 703) / (heightIn * heightIn);
    }

    let category = "";
    let color = "";
    if (bmiValue < 18.5) {
      category = "Underweight";
      color = "text-blue-700";
    } else if (bmiValue < 25) {
      category = "Normal";
      color = "text-green-700";
    } else if (bmiValue < 30) {
      category = "Overweight";
      color = "text-amber-700";
    } else {
      category = "Obese";
      color = "text-red-700";
    }

    setBmi({ value: bmiValue.toFixed(1), category, color });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Unit System</label>
          <select 
            value={unit} 
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lbs, inches)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Height ({unit === "metric" ? "cm" : "inches"})</label>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={unit === "metric" ? "e.g., 170" : "e.g., 67"}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Weight ({unit === "metric" ? "kg" : "lbs"})</label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === "metric" ? "e.g., 70" : "e.g., 154"}
          />
        </div>

        <Button onClick={calculateBMI} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
          Calculate BMI
        </Button>
      </div>

      {bmi && (
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 text-center space-y-2">
          <p className="text-4xl font-bold text-slate-900">{bmi.value}</p>
          <p className={`text-lg font-semibold ${bmi.color}`}>{bmi.category}</p>
          <div className="text-xs text-slate-600 mt-3 text-left space-y-1 bg-white rounded-lg p-3 border border-slate-200">
            <p>• Underweight: &lt; 18.5</p>
            <p>• Normal: 18.5 - 24.9</p>
            <p>• Overweight: 25 - 29.9</p>
            <p>• Obese: ≥ 30</p>
          </div>
          {onAddToNote && (
            <Button
              onClick={() => onAddToNote({
                name: "BMI Calculator",
                inputs: { height: `${height} ${unit === 'metric' ? 'cm' : 'inches'}`, weight: `${weight} ${unit === 'metric' ? 'kg' : 'lbs'}` },
                result: `BMI: ${bmi.value}`,
                interpretation: `Category: ${bmi.category}`,
                category: "General",
                url: "https://www.mdcalc.com/calc/29/body-mass-index-bmi"
              })}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 mt-3"
            >
              <FileText className="w-4 h-4" />
              Add to Clinical Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}