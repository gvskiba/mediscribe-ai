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
import DashboardTopBar from "./components/dashboard/DashboardTopBar";

const navSections = [
            {
              title: "Primary",
              items: [
                { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
                { name: "Shift Dashboard", icon: Activity, page: "Shift" },
                { name: "Patient Dashboard", icon: Activity, page: "PatientDashboard" },
                { name: "SOAP Compiler", icon: FileText, page: "SoapCompiler" },
                { name: "SOAP Compiler (Standalone)", icon: FileText, page: "SoapCompilerStandalone" },
              { name: "Clinical Note Studio", icon: FileText, page: "ClinicalNoteStudio" },
                { name: "My Notes", icon: FileText, page: "NotesLibrary" },
                { name: "Discharge Planning", icon: FileText, page: "DischargePlanning" },
              { name: "Order Set Builder", icon: FileText, page: "OrderSetBuilder" },
              ]
            },
      {
        title: "Resources",
        items: [
          { name: "Antibiotic Guide", icon: BookOpen, page: "AntibioticStewardship" },
          { name: "Drug Reference", icon: BookOpen, page: "DrugReference" },
          { name: "CME & Learning", icon: BookOpen, page: "CMELearningCenter" },
          { name: "Pediatric Dosing", icon: Activity, page: "PediatricDosing" },
          { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
          { name: "Saved Guidelines", icon: BookOpen, page: "SavedGuidelines" },
          { name: "Knowledge Base", icon: BookOpen, page: "MedicalKnowledgeBase" },
          { name: "Patient Education", icon: BookOpen, page: "PatientEducation" },
          { name: "Calculators", icon: Activity, page: "Calculators" },
          { name: "Templates", icon: FileText, page: "NoteTemplates" },
          { name: "Custom Templates", icon: FileText, page: "CustomTemplates" },
          { name: "Smart Templates", icon: Sparkles, page: "SmartTemplates" },
          { name: "Snippets", icon: FileText, page: "Snippets" },
          { name: "Addendum Manager", icon: FileText, page: "AddendumManager" },
        ]
      },
      {
              title: "Settings",
              items: [
                { name: "App Settings", icon: Settings, page: "AppSettings" },
                { name: "User Settings", icon: Settings, page: "UserSettings" },
              ]
            }
    ];


export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (error) {
        setUser(null);
        console.error("Authentication check failed in Layout:", error);
      }
    };
    checkAuth();
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

      {/* Dashboard Top Bar */}
      {currentPageName !== 'Home' && <DashboardTopBar user={user} />}



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
      <main className={`flex-1 ${currentPageName === 'NoteDetail' || currentPageName === 'Dashboard' || currentPageName === 'Calendar' || currentPageName === 'NotesLibrary' || currentPageName === 'PatientDashboard' || currentPageName === 'ClinicalGuidelines' || currentPageName === 'Calculators' || currentPageName === 'MedicalNews' || currentPageName === 'AppSettings' || currentPageName === 'Procedures' || currentPageName === 'Shift' || currentPageName === 'SoapCompiler' || currentPageName === 'SoapCompilerStandalone' || currentPageName === 'AntibioticStewardship' || currentPageName === 'PediatricDosing' || currentPageName === 'DrugReference' || currentPageName === 'CMELearningCenter' || currentPageName === 'DischargePlanning' || currentPageName === 'OrderSetBuilder' || currentPageName === 'NoteTemplates' || currentPageName === 'CustomTemplates' || currentPageName === 'AddendumManager' || currentPageName === 'LiveTranscription' || currentPageName === 'CantMissDiagnoses' || currentPageName === 'ClinicalNoteStudio' ? 'bg-[#050f1e] pt-0' : currentPageName === 'Home' ? 'p-0 m-0' : 'pt-32 lg:pt-20'}`}
 style={{ marginLeft: (showSidebar && currentPageName !== 'Home') ? 72 : 0, minHeight: '100vh' }}>
        <div className={currentPageName === 'NoteDetail' || currentPageName === 'Dashboard' || currentPageName === 'Calendar' || currentPageName === 'NotesLibrary' || currentPageName === 'PatientDashboard' || currentPageName === 'ClinicalGuidelines' || currentPageName === 'Calculators' || currentPageName === 'MedicalNews' || currentPageName === 'AppSettings' || currentPageName === 'Procedures' || currentPageName === 'Shift' || currentPageName === 'SoapCompiler' || currentPageName === 'SoapCompilerStandalone' || currentPageName === 'AntibioticStewardship' || currentPageName === 'PediatricDosing' || currentPageName === 'DrugReference' || currentPageName === 'CMELearningCenter' || currentPageName === 'DischargePlanning' || currentPageName === 'OrderSetBuilder' || currentPageName === 'NoteTemplates' || currentPageName === 'CustomTemplates' || currentPageName === 'AddendumManager' || currentPageName === 'LiveTranscription' || currentPageName === 'CantMissDiagnoses' || currentPageName === 'Home' ? 'h-full w-full p-0 m-0' : 'p-4 md:p-8 max-w-7xl mx-auto'}>
          {children}
        </div>
        {/* Medical AI Chatbot */}
        <MedicalChatbot />
      </main>
    </div>);

}