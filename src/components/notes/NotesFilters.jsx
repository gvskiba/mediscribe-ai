import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Archive, X, LayoutGrid, List, FileText, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeLabels = {
  progress_note: "Progress Note",
  h_and_p: "H&P",
  discharge_summary: "Discharge",
  consult: "Consult",
  procedure_note: "Procedure",
};

export default function NotesFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  patientFilter,
  onPatientFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  sortBy,
  onSortByChange,
  showArchived,
  onToggleArchived,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
  uniquePatients
}) {
  const clearFilter = (filterSetter) => filterSetter("all");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patients, complaints, diagnoses..."
              className="pl-10 rounded-xl border-slate-300 bg-slate-50"
            />
          </div>
          
          {/* View & Layout Toggles */}
          <div className="flex gap-2">
            <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
              <Button
                variant={viewMode === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("all")}
                className="rounded-lg gap-2 h-9"
              >
                <FileText className="w-4 h-4" /> All
              </Button>
              <Button
                variant={viewMode === "by-patient" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("by-patient")}
                className="rounded-lg gap-2 h-9"
              >
                <User className="w-4 h-4" /> Patients
              </Button>
            </div>
            
            <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
              <Button
                variant={layoutMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onLayoutModeChange("list")}
                className="rounded-lg h-9 w-9 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={layoutMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onLayoutModeChange("grid")}
                className="rounded-lg h-9 w-9 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={onToggleFilters}
              className="rounded-xl gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap pt-3 border-t border-slate-200">
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="w-full sm:w-40 rounded-xl border-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="amended">Amended</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="progress_note">Progress Note</SelectItem>
                    <SelectItem value="h_and_p">H&P</SelectItem>
                    <SelectItem value="discharge_summary">Discharge</SelectItem>
                    <SelectItem value="consult">Consult</SelectItem>
                    <SelectItem value="procedure_note">Procedure</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={patientFilter} onValueChange={onPatientFilterChange}>
                  <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
                    <SelectValue placeholder="Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    {uniquePatients.map(patient => (
                      <SelectItem key={patient} value={patient}>{patient}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={onDateRangeFilterChange}>
                  <SelectTrigger className="w-full sm:w-40 rounded-xl border-slate-300">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                    <SelectItem value="quarter">Past Quarter</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={onSortByChange}>
                  <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-300">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created_date">Newest First</SelectItem>
                    <SelectItem value="created_date">Oldest First</SelectItem>
                    <SelectItem value="-date_of_visit">Recent Visits</SelectItem>
                    <SelectItem value="patient_name">Patient A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showArchived ? "default" : "outline"}
                  onClick={onToggleArchived}
                  className="rounded-xl gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? "Hide" : "Show"} Archived
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Summary */}
        {(statusFilter !== "all" || typeFilter !== "all" || patientFilter !== "all" || dateRangeFilter !== "all" || search) && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Active filters:</span>
            {search && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                Search: {search}
                <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => onSearchChange("")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                {statusFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => clearFilter(onStatusFilterChange)} />
              </Badge>
            )}
            {typeFilter !== "all" && (
              <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                {typeLabels[typeFilter]}
                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => clearFilter(onTypeFilterChange)} />
              </Badge>
            )}
            {patientFilter !== "all" && (
              <Badge variant="outline" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                {patientFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => clearFilter(onPatientFilterChange)} />
              </Badge>
            )}
            {dateRangeFilter !== "all" && (
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                {dateRangeFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-amber-900" onClick={() => clearFilter(onDateRangeFilterChange)} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}