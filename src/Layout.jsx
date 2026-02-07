import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Stethoscope,
  FileText,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Activity
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "New Note", icon: FileText, page: "NewNote" },
  { name: "Notes", icon: FileText, page: "NotesLibrary" },
  { name: "Templates", icon: FileText, page: "NoteTemplates" },
  { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
  { name: "Adherence", icon: Activity, page: "GuidelineAdherence" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <style>{`
        :root {
          --navy: #0f172a;
          --slate: #334155;
          --blue-accent: #3b82f6;
          --emerald: #10b981;
        }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .nav-link { transition: all 0.2s ease; }
        .nav-link:hover { background: rgba(255,255,255,0.08); }
        .nav-link.active { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] text-white fixed h-full z-30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">MedScribe</h1>
              <p className="text-xs text-slate-400">Clinical AI Assistant</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-white/10">
          <Link
            to={createPageUrl("NewNote")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            New Note
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                currentPageName === item.page
                  ? "active"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => base44.auth.logout()}
            className="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 z-40 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-semibold truncate">MedScribe</span>
        </div>
        <Link
          to={createPageUrl("NewNote")}
          className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 transition-colors flex-shrink-0"
        >
          <FileText className="w-5 h-5" />
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="flex-shrink-0">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-16 bottom-0 w-64 bg-[#0f172a] text-white p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  currentPageName === item.page
                    ? "active"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}