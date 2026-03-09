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
              { name: "Billing Assistant", icon: FileText, page: "BillingDashboard" },
              { name: "Diagnostic Stewardship", icon: Activity, page: "DiagnosticStewardship" },
              ]
            },
      {
        title: "Resources",
        items: [
          { name: "Drugs & Bugs", icon: BookOpen, page: "DrugsBugs" },
          { name: "Antibiotic Guide", icon: BookOpen, page: "AntibioticStewardship" },
          { name: "Drug Reference", icon: BookOpen, page: "DrugReference" },
          { name: "CME & Learning", icon: BookOpen, page: "CMELearningCenter" },
          { name: "Pediatric Dosing", icon: Activity, page: "PediatricDosing" },
          { name: "Guidelines", icon: BookOpen, page: "Guidelines" },
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
              { name: "User Account", icon: Settings, page: "UserPreferences" },
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
    <div className="bg-white flex flex-col h-screen">
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
      {currentPageName !== 'Home' && currentPageName !== 'ClinicalNoteStudio' && currentPageName !== 'NoteDetail' && currentPageName !== 'NoteTemplates' && currentPageName !== 'CustomTemplates' && currentPageName !== 'PatientDashboard' && currentPageName !== 'DischargePlanning' && currentPageName !== 'UserPreferences' && currentPageName !== 'DiagnosticStewardship' && <DashboardTopBar user={user} />}



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
      {(() => {
        const darkPages = ['NoteDetail','ClinicalNoteStudio','Dashboard','Calendar','NotesLibrary','PatientDashboard','ClinicalGuidelines','Calculators','MedicalNews','AppSettings','Procedures','Shift','SoapCompiler','SoapCompilerStandalone','AntibioticStewardship','PediatricDosing','DrugReference','CMELearningCenter','DischargePlanning','OrderSetBuilder','NoteTemplates','CustomTemplates','AddendumManager','LiveTranscription','CantMissDiagnoses','BillingDashboard','DrugsBugs','UserPreferences','DiagnosticStewardship'];
        const isDark = darkPages.includes(currentPageName);
        const isHome = currentPageName === 'Home';
        const isNote = currentPageName === 'NoteDetail';
        return (
          <main
            className={isDark ? 'bg-[#050f1e]' : isHome ? '' : 'pt-32 lg:pt-20'}
            style={{ marginLeft: (showSidebar && !isHome) ? 72 : 0, paddingTop: (currentPageName !== 'Home' && currentPageName !== 'ClinicalNoteStudio' && currentPageName !== 'NoteDetail' && currentPageName !== 'NoteTemplates' && currentPageName !== 'CustomTemplates' && currentPageName !== 'PatientDashboard' && currentPageName !== 'DischargePlanning' && currentPageName !== 'UserPreferences' && currentPageName !== 'DiagnosticStewardship') ? '48px' : '0', flex: 1, overflowY: 'auto' }}
          >
            <div className={isHome || isDark ? 'w-full' : 'p-4 md:p-8 max-w-7xl mx-auto'}>
              {children}
            </div>
            {/* Medical AI Chatbot */}
            <MedicalChatbot />
          </main>
        );
      })()}
    </div>);

}