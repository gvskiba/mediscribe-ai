import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Stethoscope,
  FileText,
  BookOpen,
  LayoutDashboard,
  Menu,
  LogOut,
  Activity,
  Sparkles,
  XCircle } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import GlobalSearchBar from "./components/search/GlobalSearchBar";
import RecentNotesDropdown from "./components/notes/RecentNotesDropdown";
import NotificationButtons from "./components/layout/NotificationButtons";
import AppSidebar from "./components/layout/AppSidebar";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  const showSidebar = currentPageName !== 'Home';

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
          transition: all 0.2s ease;
        }
        .nav-link:hover { 
          background: rgba(59, 130, 246, 0.08);
          color: #2563eb;
        }
        .nav-link.active { 
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          font-weight: 600;
          border-bottom: 2px solid #2563eb;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* App Sidebar */}
      {showSidebar && <AppSidebar user={user} />}

      {/* Desktop Header */}
      <header className={`hidden lg:block fixed top-0 right-0 bg-white border-b border-slate-200 z-40 ${currentPageName === 'Home' || currentPageName === 'NoteDetail' ? '!hidden' : ''}`} style={{ left: showSidebar ? 64 : 0, background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">MedNu. AI</h1>
                <p className="text-xs text-slate-600">Clinical AI Assistant</p>
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
                    "active text-blue-600 bg-blue-50" :
                    "text-slate-600 hover:text-slate-900"
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
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold text-sm transition-all shadow-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                New Note
              </button>
              <button
                onClick={() => base44.auth.logout()}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 text-slate-900 px-4 py-3 z-40 space-y-3 ${currentPageName === 'Home' || currentPageName === 'NoteDetail' ? '!hidden' : ''}`} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm truncate">MedNu. AI</span>
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
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 transition-all shadow-sm text-white">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="hover:bg-slate-100 rounded-lg p-1 transition-colors">
              {mobileOpen ? <XCircle className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <GlobalSearchBar />
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen &&
      <div className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
          className="absolute left-0 top-20 bottom-0 w-64 bg-white text-slate-900 p-4 space-y-2 border-r border-slate-200 overflow-y-auto"
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
      <main className={`flex-1 min-h-screen ${currentPageName === 'NoteDetail' ? 'bg-[#050f1e]' : currentPageName === 'Home' ? '' : 'bg-blue-100 pt-32 lg:pt-20'}`} style={{ marginLeft: showSidebar ? 64 : 0 }}>
        <div className={currentPageName === 'NoteDetail' ? '' : 'p-4 md:p-8 max-w-7xl mx-auto'}>
          {children}
        </div>
        {/* Draggable Notification Buttons */}
        <DraggableNotificationButtons />
        {/* Medical AI Chatbot */}
        <MedicalChatbot />
      </main>
    </div>);

}