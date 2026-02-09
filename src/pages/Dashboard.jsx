import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, BookOpen, Activity, Clock, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import StatCard from "../components/dashboard/StatCard";
import RecentNoteCard from "../components/dashboard/RecentNoteCard";
import RecentQueryCard from "../components/dashboard/RecentQueryCard";
import MedicalNewsSection from "../components/dashboard/MedicalNewsSection";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => base44.entities.ClinicalNote.list("-created_date", 50),
  });

  const { data: queries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["queries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date", 50),
  });

  const isLoading = notesLoading || queriesLoading;

  const draftCount = notes.filter((n) => n.status === "draft").length;
  const recentNotes = notes.slice(0, 5);
  const recentQueries = queries.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-1">Your clinical workspace at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("NewNote")}>
            <Button className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white rounded-xl gap-2 shadow-lg shadow-purple-500/30 font-semibold">
              <Plus className="w-4 h-4" /> New Note
            </Button>
          </Link>
          <Link to={createPageUrl("Guidelines")}>
            <Button variant="outline" className="rounded-xl gap-2">
              <BookOpen className="w-4 h-4" /> Ask Guidelines
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Notes" value={notes.length} subtitle="All time" icon={FileText} color="blue" />
          <StatCard title="Drafts" value={draftCount} subtitle="Pending review" icon={Clock} color="amber" />
          <StatCard title="Queries" value={queries.length} subtitle="Evidence lookups" icon={BookOpen} color="purple" />
          <StatCard title="This Week" value={notes.filter(n => {
            const d = new Date(n.created_date);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return d >= weekAgo;
          }).length} subtitle="Notes created" icon={Activity} color="emerald" />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
         >
           <div className="flex items-center justify-between p-6 pb-2">
             <h2 className="text-lg font-semibold text-slate-900">Recent Notes</h2>
            <Link to={createPageUrl("NotesLibrary")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-2 pb-2">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-slate-100" />)}
              </div>
            ) : recentNotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm text-slate-600">No clinical notes yet</p>
                <Link to={createPageUrl("NewNote")} className="text-sm text-purple-300 hover:underline mt-1 inline-block">
                  Create your first note
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentNotes.map((note) => (
                  <RecentNoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Queries */}
        <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
         >
           <div className="flex items-center justify-between p-6 pb-2">
             <h2 className="text-lg font-semibold text-slate-900">Recent Queries</h2>
            <Link to={createPageUrl("Guidelines")} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Ask a question <ArrowRight className="w-3 h-3" />
            </Link>
            </div>
            <div className="px-2 pb-2">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-slate-100" />)}
              </div>
            ) : recentQueries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm text-slate-600">No guideline queries yet</p>
                <Link to={createPageUrl("Guidelines")} className="text-sm text-purple-300 hover:underline mt-1 inline-block">
                  Ask your first question
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-purple-500/10">
                {recentQueries.map((query) => (
                  <RecentQueryCard key={query.id} query={query} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Medical News Section */}
      <MedicalNewsSection />
    </div>
  );
}