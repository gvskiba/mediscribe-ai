import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, BookOpen, Calculator, Layers, FileCode, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                transition={{ delay: index * 0.1 }}
                className="relative bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${link.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 mb-4">
                    {link.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Open
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}