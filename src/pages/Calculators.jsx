import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Activity } from "lucide-react";
import MedicationDosingLookup from "../components/calculators/MedicationDosingLookup";

export default function Calculators() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Calculators</h1>
          <p className="text-sm text-slate-600">Clinical calculators for dosing and assessment</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <MedicationDosingLookup type="pediatric" />
        <MedicationDosingLookup type="adult" />
        <BMICalculator />
        <CreatinineClearanceCalculator />
      </div>
    </div>
  );
}



function BMICalculator() {
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
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">BMI Calculator</h2>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Unit System</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (kg, cm)</SelectItem>
              <SelectItem value="imperial">Imperial (lbs, inches)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Height ({unit === "metric" ? "cm" : "inches"})</Label>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder={unit === "metric" ? "e.g., 170" : "e.g., 67"}
          />
        </div>

        <div>
          <Label>Weight ({unit === "metric" ? "kg" : "lbs"})</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === "metric" ? "e.g., 70" : "e.g., 154"}
          />
        </div>

        <Button onClick={calculateBMI} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 h-12 text-base font-semibold">
          Calculate BMI
        </Button>
      </div>

      {bmi && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center space-y-2">
          <p className="text-3xl font-bold text-slate-900">{bmi.value}</p>
          <p className={`text-lg font-semibold ${bmi.color}`}>{bmi.category}</p>
          <div className="text-xs text-slate-600 mt-3 text-left space-y-1">
            <p>• Underweight: &lt; 18.5</p>
            <p>• Normal: 18.5 - 24.9</p>
            <p>• Overweight: 25 - 29.9</p>
            <p>• Obese: ≥ 30</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function CreatinineClearanceCalculator() {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [sex, setSex] = useState("male");
  const [result, setResult] = useState(null);

  const calculateCrCl = () => {
    if (!age || !weight || !creatinine) return;

    // Cockcroft-Gault formula
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
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Creatinine Clearance</h2>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Age (years)</Label>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 65"
          />
        </div>

        <div>
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 70"
          />
        </div>

        <div>
          <Label>Serum Creatinine (mg/dL)</Label>
          <Input
            type="number"
            step="0.1"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
            placeholder="e.g., 1.2"
          />
        </div>

        <div>
          <Label>Sex</Label>
          <Select value={sex} onValueChange={setSex}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={calculateCrCl} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30 h-12 text-base font-semibold">
          Calculate CrCl
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center space-y-2">
          <p className="text-3xl font-bold text-slate-900">{result.value}</p>
          <p className="text-sm text-slate-600">mL/min</p>
          <p className={`text-lg font-semibold ${result.color}`}>{result.category}</p>
          <p className="text-xs text-slate-500 mt-3">Cockcroft-Gault formula</p>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        ⚠️ Use ideal body weight for obese patients. Consider eGFR for more accurate assessment.
      </p>
    </Card>
  );
}