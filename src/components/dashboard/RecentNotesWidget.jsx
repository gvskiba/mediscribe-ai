import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { FileText, Clock, User, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import moment from "moment";

export default function RecentNotesWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["recentNotes"],
    queryFn: () => base44.entities.ClinicalNote.list("-updated_date", 20),
  });

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.patient_name?.toLowerCase().includes(query) ||
        note.chief_complaint?.toLowerCase().includes(query) ||
        note.patient_id?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(note => note.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = moment();
      filtered = filtered.filter(note => {
        const noteDate = moment(note.updated_date);
        if (dateRange === "today") return noteDate.isSame(now, 'day');
        if (dateRange === "week") return noteDate.isAfter(now.clone().subtract(7, 'days'));
        if (dateRange === "month") return noteDate.isAfter(now.clone().subtract(30, 'days'));
        return true;
      });
    }

    return filtered.slice(0, 5);
  }, [notes, searchQuery, statusFilter, dateRange]);

  const statusColors = {
    draft: "bg-amber-100 text-amber-700 border-amber-200",
    finalized: "bg-green-100 text-green-700 border-green-200",
    amended: "bg-blue-100 text-blue-700 border-blue-200"
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by patient, complaint, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="amended">Amended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="flex-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">
            {searchQuery || statusFilter !== "all" || dateRange !== "all" 
              ? "No notes match your filters" 
              : "No recent notes"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note, idx) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={createPageUrl(`NoteDetail?id=${note.id}`)}>
                <Card className="p-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {note.patient_name || "Unnamed Patient"}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {note.chief_complaint || "No chief complaint"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusColors[note.status] || "bg-slate-100 text-slate-700"}`}>
                      {note.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(note.updated_date).fromNow()}
                    </div>
                    {note.created_by && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.created_by.split('@')[0]}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}