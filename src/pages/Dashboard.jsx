import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, BookOpen, Calculator, Layers, FileCode } from "lucide-react";
import { motion } from "framer-motion";
import MedicalNewsSection from "../components/dashboard/MedicalNewsSection";

const quickLinks = [
  {
    title: "Notes",
    description: "View and manage clinical notes",
    icon: FileText,
    page: "NotesLibrary",
    color: "blue",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "Templates",
    description: "Manage note templates",
    icon: FileCode,
    page: "NoteTemplates",
    color: "purple",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "Snippets",
    description: "Quick text snippets",
    icon: Layers,
    page: "Snippets",
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    title: "Guidelines",
    description: "Evidence-based clinical guidelines",
    icon: BookOpen,
    page: "Guidelines",
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600"
  },
  {
    title: "Calculators",
    description: "Medical calculators and tools",
    icon: Calculator,
    page: "Calculators",
    color: "cyan",
    gradient: "from-cyan-500 to-cyan-600"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Provider Dashboard</h1>
        <p className="text-slate-600 mt-1">Your clinical workspace - quick access to all tools</p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              className="group"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {link.title}
                </h3>
                
                <p className="text-xs text-slate-600 line-clamp-2">
                  {link.description}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Medical News Section */}
      <MedicalNewsSection />
    </div>
  );
}