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
  Activity,
  Sparkles,
  Settings,
  ChevronRight,
  Beaker,
  ClipboardList,
  Microscope,
  Pill,
  HeartPulse,
  BookMarked,
  Calculator,
  Layers,
  User
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import GlobalSearchBar from "./components/search/GlobalSearchBar";
import RecentNotesDropdown from "./components/notes/RecentNotesDropdown";
import ReturnToNoteButton from "./components/notes/ReturnToNoteButton";

const soapSections = [
  {
    label: "S — Subjective",
    color: "blue",
    dotColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "My Notes", icon: FileText, page: "NotesLibrary" },
    ]
  },
  {
    label: "O — Objective",
    color: "purple",
    dotColor: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    items: [
      { name: "Calculators", icon: Calculator, page: "Calculators" },
    ]
  },
  {
    label: "A — Assessment",
    color: "emerald",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    items: [
      { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
    ]
  },
  {
    label: "P — Plan",
    color: "rose",
    dotColor: "bg-rose-500",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    items: [
      { name: "Templates", icon: Layers, page: "NoteTemplates" },
      { name: "Smart Templates", icon: Sparkles, page: "SmartTemplates" },
      { name: "Snippets", icon: ClipboardList, page: "Snippets" },
    ]
  },
  {
    label: "Settings",
    color: "slate",
    dotColor: "bg-slate-400",
    textColor: "text-slate-500",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    items: [
      { name: "Preferences", icon: Settings, page: "UserPreferences" },
    ]
  }
];

const allItems = soapSections.flatMap(s => s.items);

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <style>{`
        :root {
          --primary: #2563eb;
          --primary-dark: #1d4ed8;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1f2937;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .sidebar-link { transition: all 0.15s ease; }
        .sidebar-link:hover { background: rgba(0,0,0,0.04); }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-slate-200 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-100 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md flex-shrink-0">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 leading-tight">Notrya AI</p>
              <p className="text-xs text-slate-400 leading-tight">Clinical Assistant</p>
            </div>
          )}
        </div>

        {/* New Note Button */}
        <div className={`px-3 pt-3 pb-2 flex-shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={async () => {
              const newNote = await base44.entities.ClinicalNote.create({
                raw_note: "",
                patient_name: "New Patient",
                status: "draft"
              });
              window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
            }}
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-2 ${collapsed ? 'p-2' : 'w-full px-3 py-2'}`}
            title="New Note"
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>New Note</span>}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pb-2 flex-shrink-0">
            <GlobalSearchBar />
          </div>
        )}

        {/* SOAP Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-1 space-y-1">
          {soapSections.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              {!collapsed && (
                <div className={`flex items-center gap-2 px-2 pt-3 pb-1`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${section.dotColor}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${section.textColor}`}>
                    {section.label}
                  </span>
                </div>
              )}
              {collapsed && <div className="my-1 border-t border-slate-100" />}

              {/* Items */}
              <div className={collapsed ? '' : 'pl-1 space-y-0.5'}>
                {section.items.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      title={collapsed ? item.name : undefined}
                      className={`sidebar-link flex items-center gap-2.5 rounded-md text-xs font-medium transition-all
                        ${collapsed ? 'justify-center p-2 mx-auto w-10 h-10' : 'px-2.5 py-2'}
                        ${isActive
                          ? `bg-blue-50 text-blue-700 font-semibold`
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <item.icon className={`flex-shrink-0 ${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${isActive ? 'text-blue-600' : ''}`} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                      {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={`border-t border-slate-100 p-2 flex-shrink-0 ${collapsed ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1'}`}>
          {!collapsed && <ReturnToNoteButton currentPage={currentPageName} />}
          {!collapsed && <RecentNotesDropdown />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={() => base44.auth.logout()}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 z-40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">Notrya AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const newNote = await base44.entities.ClinicalNote.create({
                  raw_note: "",
                  patient_name: "New Patient",
                  status: "draft"
                });
                window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
              }}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 text-white"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="hover:bg-slate-100 rounded-lg p-1">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <GlobalSearchBar />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-[72px] bottom-0 w-60 bg-white p-3 overflow-y-auto border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
            {soapSections.map((section) => (
              <div key={section.label} className="mb-1">
                <div className="flex items-center gap-2 px-2 pt-3 pb-1">
                  <div className={`w-2 h-2 rounded-full ${section.dotColor}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${section.textColor}`}>{section.label}</span>
                </div>
                {section.items.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-slate-200 mt-3 pt-3">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-200 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'} pt-[72px] lg:pt-0`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}