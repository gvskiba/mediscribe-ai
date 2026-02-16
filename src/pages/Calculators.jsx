import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Search, 
  Star, 
  Sparkles, 
  ExternalLink, 
  Loader2,
  Heart,
  Activity,
  Stethoscope,
  AlertCircle,
  TrendingUp,
  Grid3x3,
  Droplet,
  Brain,
  Baby,
  Apple
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MedicationDosingLookup from "../components/calculators/MedicationDosingLookup";
import AddToNoteDialog from "../components/calculators/AddToNoteDialog";
import BMICalculator from "../components/calculators/BMICalculator";
import CreatinineClearanceCalculator from "../components/calculators/CreatinineClearanceCalculator";
import { FileText } from "lucide-react";

// Built-in calculators library
const CALCULATOR_LIBRARY = [
  { id: "bmi", name: "BMI Calculator", category: "General", component: "BMICalculator", mdcalc_url: "https://www.mdcalc.com/calc/29/body-mass-index-bmi" },
  { id: "crcl", name: "Creatinine Clearance (Cockcroft-Gault)", category: "Nephrology", component: "CreatinineClearanceCalculator", mdcalc_url: "https://www.mdcalc.com/calc/43/creatinine-clearance-cockcroft-gault-equation" },
  { id: "chads2vasc", name: "CHA2DS2-VASc Score", category: "Cardiology", mdcalc_url: "https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk" },
  { id: "wells_dvt", name: "Wells' Criteria for DVT", category: "Cardiology", mdcalc_url: "https://www.mdcalc.com/calc/362/wells-criteria-dvt" },
  { id: "wells_pe", name: "Wells' Criteria for PE", category: "Pulmonology", mdcalc_url: "https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism" },
  { id: "perc", name: "PERC Rule for PE", category: "Pulmonology", mdcalc_url: "https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism" },
  { id: "cha2ds2", name: "CHADS2 Score", category: "Cardiology", mdcalc_url: "https://www.mdcalc.com/calc/40/chads2-score-atrial-fibrillation-stroke-risk" },
  { id: "hasbled", name: "HAS-BLED Score", category: "Cardiology", mdcalc_url: "https://www.mdcalc.com/calc/807/has-bled-score-major-bleeding-risk" },
  { id: "curb65", name: "CURB-65 Score for Pneumonia", category: "Pulmonology", mdcalc_url: "https://www.mdcalc.com/calc/33/curb-65-score-pneumonia-severity" },
  { id: "gcs", name: "Glasgow Coma Scale", category: "Neurology", mdcalc_url: "https://www.mdcalc.com/calc/64/glasgow-coma-scale-score-gcs" },
  { id: "nihss", name: "NIH Stroke Scale", category: "Neurology", mdcalc_url: "https://www.mdcalc.com/calc/715/nih-stroke-scale-score-nihss" },
  { id: "apgar", name: "APGAR Score", category: "Pediatrics", mdcalc_url: "https://www.mdcalc.com/calc/3948/apgar-score" },
  { id: "meld", name: "MELD Score", category: "Gastroenterology", mdcalc_url: "https://www.mdcalc.com/calc/78/meld-score-model-end-stage-liver-disease-12-older" },
  { id: "gfr", name: "eGFR (CKD-EPI)", category: "Nephrology", mdcalc_url: "https://www.mdcalc.com/calc/3939/ckd-epi-equations-glomerular-filtration-rate-gfr" },
  { id: "framingham", name: "Framingham Risk Score", category: "Cardiology", mdcalc_url: "https://www.mdcalc.com/calc/38/framingham-risk-score-hard-coronary-heart-disease" },
  { id: "apache", name: "APACHE II Score", category: "Critical Care", mdcalc_url: "https://www.mdcalc.com/calc/1867/apache-ii-score" },
  { id: "sofa", name: "SOFA Score", category: "Critical Care", mdcalc_url: "https://www.mdcalc.com/calc/691/sequential-organ-failure-assessment-sofa-score" },
  { id: "psi", name: "Pneumonia Severity Index (PSI)", category: "Pulmonology", mdcalc_url: "https://www.mdcalc.com/calc/33/pneumonia-severity-index-psi" }
];

export default function Calculators() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [addToNoteDialog, setAddToNoteDialog] = useState({ open: false, data: null });

  const { data: favorites = [] } = useQuery({
    queryKey: ["calculator-favorites"],
    queryFn: () => base44.entities.CalculatorFavorite.list(),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (calculator) => {
      const existing = favorites.find(f => f.calculator_id === calculator.id);
      if (existing) {
        await base44.entities.CalculatorFavorite.delete(existing.id);
      } else {
        await base44.entities.CalculatorFavorite.create({
          calculator_name: calculator.name,
          calculator_id: calculator.id,
          category: calculator.category,
          url: calculator.mdcalc_url
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-favorites"] });
    },
  });

  const getAIRecommendations = async () => {
    if (!chiefComplaint) {
      toast.error("Please enter a chief complaint");
      return;
    }

    setLoadingRecommendations(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical decision support expert. Based on this chief complaint, recommend the most relevant medical calculators and clinical decision tools.

CHIEF COMPLAINT: ${chiefComplaint}

Search evidence-based resources like MDCalc, and recommend 5-8 specific medical calculators that would be most clinically useful for this presentation.

For each calculator, provide:
1. calculator_name: Full official name
2. category: Medical specialty (Cardiology, Pulmonology, Neurology, etc.)
3. clinical_use: Why this calculator is relevant for this chief complaint (1-2 sentences)
4. priority: high, medium, or low based on clinical relevance
5. mdcalc_id: The MDCalc calculator ID if available (from the URL path, e.g., "801" from mdcalc.com/calc/801/)

Prioritize calculators that directly aid in diagnosis, risk stratification, or treatment decisions for this presentation.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  calculator_name: { type: "string" },
                  category: { type: "string" },
                  clinical_use: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  mdcalc_id: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiRecommendations(result.recommendations || []);
      toast.success("AI recommendations generated");
    } catch (error) {
      console.error("Failed to get AI recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const filteredCalculators = CALCULATOR_LIBRARY.filter(calc => {
    const matchSearch = !searchQuery || 
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "favorites") {
      return matchSearch && favorites.some(f => f.calculator_id === calc.id);
    }
    if (activeTab === "all") return matchSearch;
    return matchSearch && calc.category === activeTab;
  });

  const isFavorite = (calcId) => favorites.some(f => f.calculator_id === calcId);

  const categories = ["all", ...new Set(CALCULATOR_LIBRARY.map(c => c.category))];

  const categoryIcons = {
    all: Grid3x3,
    favorites: Star,
    General: Activity,
    Nephrology: Droplet,
    Cardiology: Heart,
    Pulmonology: Activity,
    Neurology: Brain,
    Pediatrics: Baby,
    Gastroenterology: Apple,
    "Critical Care": AlertCircle
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Medical Calculators</h1>
              <p className="text-sm text-slate-600">Evidence-based clinical decision tools and calculators</p>
              <div className="flex gap-3 mt-3">
                <Badge className="bg-white text-slate-700 border-slate-300">
                  {CALCULATOR_LIBRARY.length} Calculators
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Star className="w-3 h-3 mr-1" />
                  {favorites.length} Favorites
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="bg-white rounded-2xl border-2 border-indigo-300 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            AI Calculator Recommendations
          </h3>
          <p className="text-indigo-100 text-sm mt-1">Get personalized calculator suggestions based on clinical presentation</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter chief complaint (e.g., 'Chest pain', 'Shortness of breath')..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  getAIRecommendations();
                }
              }}
            />
            <Button
              onClick={getAIRecommendations}
              disabled={loadingRecommendations || !chiefComplaint}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 px-6"
            >
              {loadingRecommendations ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Get Recommendations</>
              )}
            </Button>
          </div>

          {/* AI Recommendations Results */}
          {aiRecommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Recommended for: {chiefComplaint}</h4>
              </div>
              {aiRecommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-lg border-2 p-4 ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-300' :
                    rec.priority === 'medium' ? 'bg-amber-50 border-amber-300' :
                    'bg-blue-50 border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${
                          rec.priority === 'high' ? 'bg-red-600' :
                          rec.priority === 'medium' ? 'bg-amber-600' :
                          'bg-blue-600'
                        } text-white`}>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <h5 className="font-bold text-slate-900 mb-2">{rec.calculator_name}</h5>
                      <p className="text-sm text-slate-700 mb-3">{rec.clinical_use}</p>
                      {rec.mdcalc_id && (
                        <a
                          href={`https://www.mdcalc.com/calc/${rec.mdcalc_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on MDCalc
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const calcData = {
                          id: rec.mdcalc_id || rec.calculator_name.toLowerCase().replace(/\s+/g, '_'),
                          name: rec.calculator_name,
                          category: rec.category,
                          mdcalc_url: rec.mdcalc_id ? `https://www.mdcalc.com/calc/${rec.mdcalc_id}` : null
                        };
                        toggleFavoriteMutation.mutate(calcData);
                      }}
                      className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Star className={`w-5 h-5 ${isFavorite(rec.mdcalc_id || rec.calculator_name.toLowerCase().replace(/\s+/g, '_')) ? 'fill-amber-500' : ''}`} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search calculators by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 focus-visible:ring-0 text-base"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
          <TabsTrigger value="all" className="rounded-lg group flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">All Calculators</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="rounded-lg group flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Favorites</span>
          </TabsTrigger>
          {categories.filter(c => c !== "all").map(category => {
            const Icon = categoryIcons[category] || Activity;
            return (
              <TabsTrigger key={category} value={category} className="rounded-lg group flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">{category}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Built-in Calculators */}
          {filteredCalculators.some(c => c.component) && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {filteredCalculators.filter(c => c.component === "BMICalculator").map(calc => (
                <div key={calc.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavoriteMutation.mutate(calc)}
                    className="absolute top-4 right-4 z-10 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Star className={`w-5 h-5 ${isFavorite(calc.id) ? 'fill-amber-500' : ''}`} />
                  </Button>
                  <BMICalculator onAddToNote={(data) => setAddToNoteDialog({ open: true, data })} />
                </div>
              ))}
              {filteredCalculators.filter(c => c.component === "CreatinineClearanceCalculator").map(calc => (
                <div key={calc.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavoriteMutation.mutate(calc)}
                    className="absolute top-4 right-4 z-10 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Star className={`w-5 h-5 ${isFavorite(calc.id) ? 'fill-amber-500' : ''}`} />
                  </Button>
                  <CreatinineClearanceCalculator onAddToNote={(data) => setAddToNoteDialog({ open: true, data })} />
                </div>
              ))}
            </div>
          )}

          {/* External Calculator Links */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalculators.filter(c => !c.component).map((calc, idx) => (
              <motion.div
                key={calc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="p-5 hover:shadow-lg transition-all border-2 border-slate-200 hover:border-purple-300 group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                        {calc.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {calc.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavoriteMutation.mutate(calc)}
                      className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 -mt-1 -mr-1"
                    >
                      <Star className={`w-5 h-5 ${isFavorite(calc.id) ? 'fill-amber-500' : ''}`} />
                    </Button>
                  </div>
                  <a
                    href={calc.mdcalc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Calculator
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredCalculators.length === 0 && (
            <div className="text-center py-16">
              <Calculator className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No calculators found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add to Note Dialog */}
      <AddToNoteDialog
        open={addToNoteDialog.open}
        onClose={() => setAddToNoteDialog({ open: false, data: null })}
        calculatorData={addToNoteDialog.data}
      />
    </div>
  );
}