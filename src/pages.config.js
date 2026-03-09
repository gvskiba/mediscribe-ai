/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddendumManager from './pages/AddendumManager';
import AntibioticStewardship from './pages/AntibioticStewardship';
import AppSettings from './pages/AppSettings';
import BillingDashboard from './pages/BillingDashboard';
import CMELearningCenter from './pages/CMELearningCenter';
import Calculators from './pages/Calculators';
import Calendar from './pages/Calendar';
import CantMissDiagnoses from './pages/CantMissDiagnoses';
import ClinicalGuidelines from './pages/ClinicalGuidelines';
import ClinicalNoteStudio from './pages/ClinicalNoteStudio';
import CustomTemplates from './pages/CustomTemplates';
import Customize from './pages/Customize';
import Dashboard from './pages/Dashboard';
import DiagnosticStewardship from './pages/DiagnosticStewardship';
import DischargePlanning from './pages/DischargePlanning';
import DrugReference from './pages/DrugReference';
import DrugsBugs from './pages/DrugsBugs';
import Guidelines from './pages/Guidelines';
import Home from './pages/Home';
import LiveTranscription from './pages/LiveTranscription';
import MedicalKnowledgeBase from './pages/MedicalKnowledgeBase';
import MedicalNews from './pages/MedicalNews';
import NewNote from './pages/NewNote';
import NoteDetail from './pages/NoteDetail';
import NoteTemplates from './pages/NoteTemplates';
import NotesLibrary from './pages/NotesLibrary';
import OrderSetBuilder from './pages/OrderSetBuilder';
import OrdersQueue from './pages/OrdersQueue';
import PatientDashboard from './pages/PatientDashboard';
import PatientEducation from './pages/PatientEducation';
import PatientHistory from './pages/PatientHistory';
import PediatricDosing from './pages/PediatricDosing';
import Procedures from './pages/Procedures';
import Search from './pages/Search';
import Shift from './pages/Shift';
import ShiftHours from './pages/ShiftHours';
import SmartTemplates from './pages/SmartTemplates';
import Snippets from './pages/Snippets';
import SoapCompiler from './pages/SoapCompiler';
import SoapCompilerStandalone from './pages/SoapCompilerStandalone';
import UserPreferences from './pages/UserPreferences';
import UserSettings from './pages/UserSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddendumManager": AddendumManager,
    "AntibioticStewardship": AntibioticStewardship,
    "AppSettings": AppSettings,
    "BillingDashboard": BillingDashboard,
    "CMELearningCenter": CMELearningCenter,
    "Calculators": Calculators,
    "Calendar": Calendar,
    "CantMissDiagnoses": CantMissDiagnoses,
    "ClinicalGuidelines": ClinicalGuidelines,
    "ClinicalNoteStudio": ClinicalNoteStudio,
    "CustomTemplates": CustomTemplates,
    "Customize": Customize,
    "Dashboard": Dashboard,
    "DiagnosticStewardship": DiagnosticStewardship,
    "DischargePlanning": DischargePlanning,
    "DrugReference": DrugReference,
    "DrugsBugs": DrugsBugs,
    "Guidelines": Guidelines,
    "Home": Home,
    "LiveTranscription": LiveTranscription,
    "MedicalKnowledgeBase": MedicalKnowledgeBase,
    "MedicalNews": MedicalNews,
    "NewNote": NewNote,
    "NoteDetail": NoteDetail,
    "NoteTemplates": NoteTemplates,
    "NotesLibrary": NotesLibrary,
    "OrderSetBuilder": OrderSetBuilder,
    "OrdersQueue": OrdersQueue,
    "PatientDashboard": PatientDashboard,
    "PatientEducation": PatientEducation,
    "PatientHistory": PatientHistory,
    "PediatricDosing": PediatricDosing,
    "Procedures": Procedures,
    "Search": Search,
    "Shift": Shift,
    "ShiftHours": ShiftHours,
    "SmartTemplates": SmartTemplates,
    "Snippets": Snippets,
    "SoapCompiler": SoapCompiler,
    "SoapCompilerStandalone": SoapCompilerStandalone,
    "UserPreferences": UserPreferences,
    "UserSettings": UserSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};