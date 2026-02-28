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
import TopBar from "./components/layout/TopBar";

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
          { name: "Saved Guidelines", icon: BookOpen, page: "SavedGuidelines" },
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
      <TopBar />
      <div className="flex flex-1">
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
        <div style={{ width: showSidebar ? '64px' : '0px', marginTop: showSidebar ? '52px' : '0px' }}>
          {showSidebar && <AppSidebar user={user} />}
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
        <main className={`flex-1 ${currentPageName === 'NoteDetail' ? 'bg-[#050f1e]' : currentPageName === 'Dashboard' ? 'bg-[#050f1e]' : currentPageName === 'Home' ? '' : 'pt-32 lg:pt-20'}`}>
          <div className={currentPageName === 'NoteDetail' || currentPageName === 'Dashboard' ? 'h-full' : 'p-4 md:p-8 max-w-7xl mx-auto'}>
            {children}
          </div>
          {/* Draggable Notification Buttons */}
          <DraggableNotificationButtons />
          {/* Medical AI Chatbot */}
          <MedicalChatbot />
        </main>
      </div>
    </div>);

}