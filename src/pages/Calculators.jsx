import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Pill, Baby, User, Activity } from "lucide-react";

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
        <PediatricDosingCalculator />
        <AdultDosingCalculator />
        <BMICalculator />
        <CreatinineClearanceCalculator />
      </div>
    </div>
  );
}

function PediatricDosingCalculator() {
  const [weight, setWeight] = useState("");
  const [medication, setMedication] = useState("");
  const [result, setResult] = useState(null);

  const medications = [
    { name: "Acetaminophen (15mg/kg/dose)", dose: 15, max: 1000, interval: "q4-6h", maxDaily: 75 },
    { name: "Ibuprofen (10mg/kg/dose)", dose: 10, max: 400, interval: "q6-8h", maxDaily: 40 },
    { name: "Amoxicillin (20mg/kg/dose)", dose: 20, max: 500, interval: "q8h", maxDaily: 50 },
    { name: "Azithromycin (10mg/kg on day 1)", dose: 10, max: 500, interval: "once daily", maxDaily: 10 },
    { name: "Ceftriaxone (50mg/kg/dose)", dose: 50, max: 2000, interval: "once daily", maxDaily: 100 },
    { name: "Ondansetron (0.15mg/kg/dose)", dose: 0.15, max: 8, interval: "q8h", maxDaily: 0.45 },
  ];

  const calculateDose = () => {
    if (!weight || !medication) return;
    
    const med = medications.find(m => m.name === medication);
    if (!med) return;

    const calculatedDose = parseFloat(weight) * med.dose;
    const actualDose = Math.min(calculatedDose, med.max);
    const maxDailyDose = parseFloat(weight) * med.maxDaily;

    setResult({
      dose: actualDose.toFixed(1),
      max: med.max,
      interval: med.interval,
      maxDaily: maxDailyDose.toFixed(1),
      capped: calculatedDose > med.max
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
          <Baby className="w-4 h-4 text-pink-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Pediatric Dosing</h2>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Patient Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight in kg"
          />
        </div>

        <div>
          <Label>Medication</Label>
          <Select value={medication} onValueChange={setMedication}>
            <SelectTrigger>
              <SelectValue placeholder="Select medication" />
            </SelectTrigger>
            <SelectContent>
              {medications.map((med) => (
                <SelectItem key={med.name} value={med.name}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={calculateDose} className="w-full">
          Calculate Dose
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-600" />
            <p className="font-semibold text-blue-900">Recommended Dose</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{result.dose} mg</p>
          <p className="text-sm text-blue-700">Give {result.interval}</p>
          {result.capped && (
            <p className="text-xs text-amber-700 font-medium">⚠️ Dose capped at adult maximum ({result.max} mg)</p>
          )}
          <p className="text-xs text-slate-600 mt-2">Max daily dose: {result.maxDaily} mg</p>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        ⚠️ Always verify doses with institutional protocols and consider clinical context.
      </p>
    </Card>
  );
}

function AdultDosingCalculator() {
  const [indication, setIndication] = useState("");
  const [renalFunction, setRenalFunction] = useState("normal");

  const medications = {
    "Acute Pain": [
      { drug: "Acetaminophen", dose: "650-1000 mg PO q6h", max: "4000 mg/day" },
      { drug: "Ibuprofen", dose: "400-800 mg PO q6-8h", max: "3200 mg/day" },
      { drug: "Ketorolac", dose: "10-30 mg IV/IM q6h", max: "120 mg/day x 5 days" },
    ],
    "Hypertension": [
      { drug: "Lisinopril", dose: "10-40 mg PO once daily", max: "80 mg/day" },
      { drug: "Amlodipine", dose: "5-10 mg PO once daily", max: "10 mg/day" },
      { drug: "Metoprolol", dose: "25-100 mg PO BID", max: "400 mg/day" },
    ],
    "Infection (UTI)": [
      { drug: "Nitrofurantoin", dose: "100 mg PO BID x 5-7 days", note: "Avoid if CrCl <30" },
      { drug: "Ciprofloxacin", dose: "500 mg PO BID x 3 days", note: "Dose adjust for renal" },
      { drug: "Ceftriaxone", dose: "1-2 g IV/IM once daily", note: "No renal adjustment needed" },
    ],
    "Diabetes": [
      { drug: "Metformin", dose: "500 mg PO BID, titrate to 2000 mg/day", note: "Avoid if eGFR <30" },
      { drug: "Glipizide", dose: "5 mg PO daily, max 40 mg/day", max: "40 mg/day" },
      { drug: "Insulin glargine", dose: "10 units SQ daily, titrate", note: "Individualize" },
    ],
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Adult Dosing Reference</h2>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Clinical Indication</Label>
          <Select value={indication} onValueChange={setIndication}>
            <SelectTrigger>
              <SelectValue placeholder="Select indication" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(medications).map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {indication && medications[indication] && (
        <div className="mt-4 space-y-3">
          <p className="font-semibold text-slate-900 text-sm">Common Medications:</p>
          {medications[indication].map((med, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900">{med.drug}</p>
              <p className="text-sm text-slate-700">{med.dose}</p>
              {med.max && <p className="text-xs text-slate-600 mt-1">Max: {med.max}</p>}
              {med.note && (
                <p className="text-xs text-amber-700 font-medium mt-1">⚠️ {med.note}</p>
              )}
              {renalFunction !== "normal" && med.note?.includes("renal") && (
                <p className="text-xs text-red-600 font-medium mt-1">⚠️ Requires dose adjustment</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">
        ⚠️ These are general guidelines. Always consult drug references and consider individual patient factors.
      </p>
    </Card>
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

        <Button onClick={calculateBMI} className="w-full">
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

        <Button onClick={calculateCrCl} className="w-full">
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