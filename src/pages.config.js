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
import AppSettings from './pages/AppSettings';
import Calculators from './pages/Calculators';
import Calendar from './pages/Calendar';
import ClinicalGuidelines from './pages/ClinicalGuidelines';
import Customize from './pages/Customize';
import Dashboard from './pages/Dashboard';
import GuidelineDetail from './pages/GuidelineDetail';
import Guidelines from './pages/Guidelines';
import Home from './pages/Home';
import MedicalKnowledgeBase from './pages/MedicalKnowledgeBase';
import MedicalNews from './pages/MedicalNews';
import NewNote from './pages/NewNote';
import NoteDetail from './pages/NoteDetail';
import NoteTemplates from './pages/NoteTemplates';
import NotesLibrary from './pages/NotesLibrary';
import OrdersQueue from './pages/OrdersQueue';
import PatientDashboard from './pages/PatientDashboard';
import PatientEducation from './pages/PatientEducation';
import PatientHistory from './pages/PatientHistory';
import Procedures from './pages/Procedures';
import SavedGuidelines from './pages/SavedGuidelines';
import Search from './pages/Search';
import ShiftHours from './pages/ShiftHours';
import SmartTemplates from './pages/SmartTemplates';
import Snippets from './pages/Snippets';
import TemplateEditor from './pages/TemplateEditor';
import TemplateSections from './pages/TemplateSections';
import UserPreferences from './pages/UserPreferences';
import UserSettings from './pages/UserSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AppSettings": AppSettings,
    "Calculators": Calculators,
    "Calendar": Calendar,
    "ClinicalGuidelines": ClinicalGuidelines,
    "Customize": Customize,
    "Dashboard": Dashboard,
    "GuidelineDetail": GuidelineDetail,
    "Guidelines": Guidelines,
    "Home": Home,
    "MedicalKnowledgeBase": MedicalKnowledgeBase,
    "MedicalNews": MedicalNews,
    "NewNote": NewNote,
    "NoteDetail": NoteDetail,
    "NoteTemplates": NoteTemplates,
    "NotesLibrary": NotesLibrary,
    "OrdersQueue": OrdersQueue,
    "PatientDashboard": PatientDashboard,
    "PatientEducation": PatientEducation,
    "PatientHistory": PatientHistory,
    "Procedures": Procedures,
    "SavedGuidelines": SavedGuidelines,
    "Search": Search,
    "ShiftHours": ShiftHours,
    "SmartTemplates": SmartTemplates,
    "Snippets": Snippets,
    "TemplateEditor": TemplateEditor,
    "TemplateSections": TemplateSections,
    "UserPreferences": UserPreferences,
    "UserSettings": UserSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};