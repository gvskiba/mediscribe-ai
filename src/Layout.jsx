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
  Sparkles } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import GlobalSearchBar from "./components/search/GlobalSearchBar";
import RecentNotesDropdown from "./components/notes/RecentNotesDropdown";
import NotificationButtons from "./components/layout/NotificationButtons";

import { Settings } from "lucide-react";
import ReturnToNoteButton from "./components/notes/ReturnToNoteButton";
import DraggableNotificationButtons from "./components/layout/DraggableNotificationButtons";
import MedicalChatbot from "./components/ai/MedicalChatbot";

const navSections = [
            {
              title: "Primary",
              items: [
                { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
                { name: "Patient Dashboard", icon: Activity, page: "PatientDashboard" },
                { name: "My Notes", icon: FileText, page: "NotesLibrary" },
              ]
            },
      {
        title: "Resources",
        items: [
          { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
          { name: "Knowledge Base", icon: BookOpen, page: "MedicalKnowledgeBase" },
          { name: "Calculators", icon: Activity, page: "Calculators" },
          { name: "Templates", icon: FileText, page: "NoteTemplates" },
          { name: "Smart Templates", icon: Sparkles, page: "SmartTemplates" },
          { name: "Snippets", icon: FileText, page: "Snippets" },
        ]
      },
      {
              title: "Settings",
              items: [
                { name: "Settings", icon: Settings, page: "UserSettings" },
              ]
            }
    ];


export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`
        :root {
          --primary: #6d28d9;
          --primary-dark: #5b21b6;
          --primary-light: #7c3aed;
          --accent: #0891b2;
          --bg-main: #0f0f1a;
          --bg-secondary: #1a1a2e;
          --card-bg: #16213e;
          --border-subtle: rgba(139, 92, 246, 0.15);
        }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0f0f1a;
          color: #e2e8f0;
        }
        .nav-link { 
          transition: all 0.2s ease;
          color: #94a3b8;
        }
        .nav-link:hover { 
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }
        .nav-link.active { 
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          font-weight: 600;
          border-bottom: 2px solid #7c3aed;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        /* Global dark theme overrides */
        main, .bg-white { background-color: #0f0f1a !important; }
        .bg-slate-50 { background-color: #1a1a2e !important; }
        .bg-slate-100 { background-color: #1e1e35 !important; }
        .bg-gray-50 { background-color: #1a1a2e !important; }
        .bg-gray-100 { background-color: #1e1e35 !important; }
        .text-slate-900, .text-gray-900 { color: #f1f5f9 !important; }
        .text-slate-800, .text-gray-800 { color: #e2e8f0 !important; }
        .text-slate-700, .text-gray-700 { color: #cbd5e1 !important; }
        .text-slate-600, .text-gray-600 { color: #94a3b8 !important; }
        .text-slate-500, .text-gray-500 { color: #64748b !important; }
        .border-slate-200, .border-gray-200 { border-color: rgba(139,92,246,0.2) !important; }
        .border-slate-300, .border-gray-300 { border-color: rgba(139,92,246,0.25) !important; }
        /* Card styling */
        .rounded-xl, .rounded-2xl, .rounded-lg {
          background-color: #16213e;
          border-color: rgba(139,92,246,0.2);
        }
        /* Input fields */
        input, textarea, select {
          background-color: #1e1e35 !important;
          color: #e2e8f0 !important;
          border-color: rgba(139,92,246,0.3) !important;
        }
        input::placeholder, textarea::placeholder {
          color: #475569 !important;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 2px rgba(124,58,237,0.2) !important;
        }
        /* Button pop color */
        .bg-blue-600 { background-color: #7c3aed !important; }
        .bg-blue-700, .hover\\:bg-blue-700:hover { background-color: #6d28d9 !important; }
        .bg-indigo-600 { background-color: #4f46e5 !important; }
        .text-blue-600 { color: #a78bfa !important; }
        .border-blue-500 { border-color: #7c3aed !important; }
        /* Gradient headers */
        header, .header-gradient {
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%) !important;
          border-bottom-color: rgba(139,92,246,0.3) !important;
        }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 border-b z-40" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', borderBottomColor: 'rgba(139,92,246,0.3)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">Notrya AI</h1>
                <p className="text-xs text-violet-300">Clinical AI Assistant</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <GlobalSearchBar />
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              {navSections.flatMap(section => section.items).map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`nav-link group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPageName === item.page ?
                    "active text-violet-300 bg-violet-900/30" :
                    "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ReturnToNoteButton currentPage={currentPageName} />
              <RecentNotesDropdown />
              <button
                onClick={async () => {
                  const newNote = await base44.entities.ClinicalNote.create({
                    raw_note: "",
                    patient_name: "New Patient",
                    status: "draft"
                  });
                  window.location.href = createPageUrl(`NoteDetail?id=${newNote.id}`);
                }}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg px-4 py-2 font-semibold text-sm transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                New Note
              </button>
              <button
                onClick={() => base44.auth.logout()}
                className="text-slate-400 hover:text-violet-300 hover:bg-violet-900/30 rounded-lg p-2 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 border-b px-4 py-3 z-40 space-y-3" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', borderBottomColor: 'rgba(139,92,246,0.3)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/50">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm truncate text-white">Notrya AI</span>
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
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg p-2 transition-all shadow-sm text-white">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <GlobalSearchBar />
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen &&
      <div className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
          className="absolute left-0 top-20 bottom-0 w-64 p-4 space-y-2 border-r overflow-y-auto" style={{ background: '#1a1a2e', borderColor: 'rgba(139,92,246,0.3)' }}
          onClick={(e) => e.stopPropagation()}>
            {navSections.flatMap(section => section.items).map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  currentPageName === item.page ?
                  "active text-blue-600 bg-blue-50" :
                  "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                </Link>
                ))}
                <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-full"
                >
                <LogOut className="w-5 h-5" />
                Sign Out
                </button>
                </div>
        </div>
      }

      {/* Main Content */}
      <main className="bg-blue-100 pt-32 lg:pt-20 flex-1 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
        {/* Draggable Notification Buttons */}
        <DraggableNotificationButtons />
        {/* Medical AI Chatbot */}
        <MedicalChatbot />
      </main>
    </div>);

}