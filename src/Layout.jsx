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
  { name: "Snippets", icon: FileText, page: "Snippets" },
  { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
  { name: "Calculators", icon: Activity, page: "Calculators" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <style>{`
        :root {
          --primary: #0891b2;
          --primary-dark: #0e7490;
          --primary-light: #06b6d4;
          --accent: #6366f1;
          --bg-main: #fafbfc;
          --sidebar-bg: linear-gradient(180deg, #0c4a6e 0%, #075985 100%);
        }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-main);
        }
        .nav-link { 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .nav-link:hover { 
          background: rgba(255,255,255,0.1);
          transform: translateX(2px);
        }
        .nav-link.active { 
          background: rgba(99,102,241,0.15);
          color: #e0e7ff;
          border-left: 3px solid #6366f1;
        }
        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: #6366f1;
          border-radius: 0 2px 2px 0;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full z-30" style={{ background: 'linear-gradient(180deg, #0c4a6e 0%, #075985 100%)' }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">MedScribe</h1>
              <p className="text-xs text-cyan-200">Clinical AI Assistant</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-white/10">
          <Link
            to={createPageUrl("NewNote")}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
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
                  ? "active text-white"
                  : "text-cyan-100 hover:text-white"
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
            className="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cyan-200 hover:text-white w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 text-white flex items-center justify-between px-4 z-40 gap-3" style={{ background: 'linear-gradient(90deg, #0c4a6e 0%, #075985 100%)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold truncate">MedScribe</span>
        </div>
        <Link
          to={createPageUrl("NewNote")}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg p-2 transition-all shadow-lg flex-shrink-0"
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
            className="absolute left-0 top-16 bottom-0 w-64 text-white p-4 space-y-1"
            style={{ background: 'linear-gradient(180deg, #0c4a6e 0%, #075985 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  currentPageName === item.page
                    ? "active text-white"
                    : "text-cyan-100 hover:text-white"
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
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen" style={{ background: 'linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)' }}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}