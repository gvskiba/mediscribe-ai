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
    <div className="min-h-screen bg-white flex">
      <style>{`
        :root {
          --primary: #2563eb;
          --primary-dark: #1d4ed8;
          --primary-light: #3b82f6;
          --accent: #0891b2;
          --bg-main: #ffffff;
          --bg-secondary: #f8fafc;
          --sidebar-bg: linear-gradient(165deg, #f8fafc 0%, #ffffff 100%);
          --card-bg: #ffffff;
          --border-subtle: rgba(15, 23, 42, 0.08);
        }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-main);
          color: #1f2937;
        }
        .nav-link { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%);
          transition: width 0.3s ease;
        }
        .nav-link:hover::before {
          width: 100%;
        }
        .nav-link:hover { 
          background: rgba(139, 92, 246, 0.08);
          transform: translateX(4px);
          color: #c4b5fd;
        }
        .nav-link.active { 
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%);
          color: #c4b5fd;
          border-left: 3px solid #8b5cf6;
          font-weight: 600;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-effect {
          background: rgba(26, 31, 46, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(139, 92, 246, 0.1);
        }
      `}</style>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full z-30 glass-effect border-r border-slate-200" style={{ background: 'linear-gradient(165deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 ring-2 ring-blue-100">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">MedScribe</h1>
              <p className="text-xs text-slate-600">Clinical AI Assistant</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 border-b border-slate-200">
          <Link
            to={createPageUrl("NewNote")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-4 py-3 font-semibold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            New Note
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                currentPageName === item.page
                  ? "active text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
              </Link>
              ))}
              </nav>
              <div className="p-4 border-t border-slate-200">
              <button
              onClick={() => base44.auth.logout()}
              className="nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-full"
              >
              <LogOut className="w-[18px] h-[18px]" />
              Sign Out
              </button>
              </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 text-slate-900 flex items-center justify-between px-4 z-40 gap-3 glass-effect border-b border-slate-200" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold truncate">MedScribe</span>
        </div>
        <Link
          to={createPageUrl("NewNote")}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl p-2.5 transition-all shadow-sm flex-shrink-0 text-white"
        >
          <FileText className="w-5 h-5" />
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="flex-shrink-0 hover:bg-white/10 rounded-lg p-1 transition-colors">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-16 bottom-0 w-64 text-white p-4 space-y-1.5 glass-effect border-r border-purple-500/10"
            style={{ background: 'linear-gradient(165deg, #1a1f2e 0%, #0f1419 100%)' }}
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
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)' }}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}