import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, BookOpen, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function QuickStatsWidget() {
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notesCount"],
    queryFn: () => base44.entities.ClinicalNote.list(),
  });

  const { data: guidelines, isLoading: guidelinesLoading } = useQuery({
    queryKey: ["guidelinesCount"],
    queryFn: () => base44.entities.GuidelineQuery.list(),
  });

  const isLoading = notesLoading || guidelinesLoading;

  const stats = [
    {
      label: "Total Notes",
      value: notes?.length || 0,
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      label: "Draft Notes",
      value: notes?.filter(n => n.status === "draft").length || 0,
      icon: Clock,
      color: "bg-amber-500"
    },
    {
      label: "Finalized",
      value: notes?.filter(n => n.status === "finalized").length || 0,
      icon: CheckCircle,
      color: "bg-green-500"
    },
    {
      label: "Guidelines",
      value: guidelines?.length || 0,
      icon: BookOpen,
      color: "bg-purple-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-12" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}