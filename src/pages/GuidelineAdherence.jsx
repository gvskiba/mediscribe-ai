import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, TrendingUp, FileText, Activity, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function GuidelineAdherence() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["clinicalNotes"],
    queryFn: () => base44.entities.ClinicalNote.list("-date_of_visit"),
  });

  const { data: guidelines = [] } = useQuery({
    queryKey: ["guidelineQueries"],
    queryFn: () => base44.entities.GuidelineQuery.list("-created_date"),
  });

  // Filter notes by time range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
  
  const filteredNotes = notes.filter(note => 
    new Date(note.date_of_visit) >= cutoffDate && 
    note.linked_guidelines?.length > 0
  );

  // Calculate adherence metrics
  const totalGuidelines = filteredNotes.reduce((sum, note) => 
    sum + (note.linked_guidelines?.length || 0), 0
  );

  const incorporatedGuidelines = filteredNotes.reduce((sum, note) => 
    sum + (note.linked_guidelines?.filter(g => g.incorporated).length || 0), 0
  );

  const adherenceRate = totalGuidelines > 0 
    ? Math.round((incorporatedGuidelines / totalGuidelines) * 100) 
    : 0;

  // Group by condition
  const conditionStats = {};
  filteredNotes.forEach(note => {
    note.linked_guidelines?.forEach(guideline => {
      if (!conditionStats[guideline.condition]) {
        conditionStats[guideline.condition] = {
          total: 0,
          incorporated: 0,
        };
      }
      conditionStats[guideline.condition].total++;
      if (guideline.incorporated) {
        conditionStats[guideline.condition].incorporated++;
      }
    });
  });

  const topConditions = Object.entries(conditionStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Guideline Adherence Tracking</h1>
          <p className="text-slate-500 mt-1">Monitor evidence-based practice integration</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Notes with Guidelines</p>
                <p className="text-2xl font-bold text-slate-900">{filteredNotes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Guidelines</p>
                <p className="text-2xl font-bold text-slate-900">{totalGuidelines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Incorporated</p>
                <p className="text-2xl font-bold text-slate-900">{incorporatedGuidelines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Adherence Rate</p>
                <p className="text-2xl font-bold text-slate-900">{adherenceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Condition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Guideline Usage by Condition</CardTitle>
        </CardHeader>
        <CardContent>
          {topConditions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No guideline data available for the selected time range
            </p>
          ) : (
            <div className="space-y-3">
              {topConditions.map(([condition, stats]) => {
                const rate = Math.round((stats.incorporated / stats.total) * 100);
                return (
                  <div key={condition} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">{condition}</span>
                        <span className="text-xs text-slate-500">
                          {stats.incorporated}/{stats.total} incorporated
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <Badge className={rate >= 80 ? "bg-green-100 text-green-700" : rate >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                      {rate}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notes with Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notes with Linked Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No notes with linked guidelines in this time range
            </p>
          ) : (
            <div className="space-y-3">
              {filteredNotes.slice(0, 10).map(note => (
                <div key={note.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{note.patient_name || "Unknown Patient"}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {format(new Date(note.date_of_visit), "MMM d, yyyy")}
                        </span>
                        {note.chief_complaint && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{note.chief_complaint}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {note.linked_guidelines?.map((guideline, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={guideline.incorporated 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {guideline.incorporated ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {guideline.condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}