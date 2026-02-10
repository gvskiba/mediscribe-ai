import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Sparkles, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuidelinesFilters({
  searchTerm,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  filterConfidence,
  onFilterConfidenceChange,
  filterDateRange,
  onFilterDateRangeChange,
  showFilters,
  onToggleFilters,
  onClearAll,
  semanticSearching,
  resultsCount
}) {
  const activeFiltersCount = [
    filterCategory !== "all",
    filterConfidence !== "all",
    filterDateRange !== "all",
    searchTerm.trim() !== ""
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {semanticSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
            )}
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="AI-powered search: 'heart failure', 'diabetes', 'anticoagulation'..."
              className="pl-10 pr-10 rounded-xl border-slate-300 bg-slate-50"
            />
          </div>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={onToggleFilters}
            className="rounded-xl gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200 h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Semantic Search Indicator */}
        {searchTerm && resultsCount !== null && (
          <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
            <Sparkles className="w-3 h-3" />
            AI semantic search found {resultsCount} related {resultsCount === 1 ? 'query' : 'queries'}
          </div>
        )}

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Specialty</label>
                  <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
                    <SelectTrigger className="rounded-xl bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="pulmonology">Pulmonology</SelectItem>
                      <SelectItem value="endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="infectious_disease">Infectious Disease</SelectItem>
                      <SelectItem value="neurology">Neurology</SelectItem>
                      <SelectItem value="oncology">Oncology</SelectItem>
                      <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                      <SelectItem value="nephrology">Nephrology</SelectItem>
                      <SelectItem value="rheumatology">Rheumatology</SelectItem>
                      <SelectItem value="general">General Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Confidence</label>
                  <Select value={filterConfidence} onValueChange={onFilterConfidenceChange}>
                    <SelectTrigger className="rounded-xl bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="high">High Confidence</SelectItem>
                      <SelectItem value="moderate">Moderate Confidence</SelectItem>
                      <SelectItem value="low">Low Confidence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Time Period</label>
                  <Select value={filterDateRange} onValueChange={onFilterDateRangeChange}>
                    <SelectTrigger className="rounded-xl bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                      <SelectItem value="quarter">Past 3 Months</SelectItem>
                      <SelectItem value="year">Past Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearAll}
                    className="rounded-lg gap-2"
                  >
                    <X className="w-3 h-3" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && !showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600">Active filters:</span>
            {searchTerm && (
              <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                Search: {searchTerm.substring(0, 20)}{searchTerm.length > 20 ? "..." : ""}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => onSearchChange("")} />
              </Badge>
            )}
            {filterCategory !== "all" && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                {filterCategory}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => onFilterCategoryChange("all")} />
              </Badge>
            )}
            {filterConfidence !== "all" && (
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                {filterConfidence}
                <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => onFilterConfidenceChange("all")} />
              </Badge>
            )}
            {filterDateRange !== "all" && (
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                {filterDateRange}
                <X className="w-3 h-3 cursor-pointer hover:text-amber-900" onClick={() => onFilterDateRangeChange("all")} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}