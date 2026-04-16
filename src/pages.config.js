import AddendumManager from './pages/AddendumManager';
import AppSettings from './pages/AppSettings';
import AutoCoder from './pages/AutoCoder';
import BillingDashboard from './pages/BillingDashboard';
import Calculators from './pages/Calculators';
import Calendar from './pages/Calendar';
import CustomTemplates from './pages/CustomTemplates';
import EDProcedureNotes from './pages/EDProcedureNotes';
import ERPlanBuilder from './pages/ERPlanBuilder';
import ERx from './pages/ERx';
import DrugsBugs from './pages/DrugsBugs';
import Home from './pages/Home';
import KnowledgeBaseV2 from './pages/KnowledgeBaseV2';
import MedicalNews from './pages/MedicalNews';
import MedicationReference from './pages/MedicationReference';
import NewPatientInput from './pages/NewPatientInput';
import NoteTemplates from './pages/NoteTemplates';
import NotesLibrary from './pages/NotesLibrary';
import OrderSetBuilder from './pages/OrderSetBuilder';
import PatientEducationGenerator from './pages/PatientEducationGenerator';
import Shift from './pages/Shift';
import Snippets from './pages/Snippets';
import UserSettings from './pages/UserSettings';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AddendumManager": AddendumManager,
    "AppSettings": AppSettings,
    "AutoCoder": AutoCoder,
    "BillingDashboard": BillingDashboard,
    "Calculators": Calculators,
    "Calendar": Calendar,
    "CustomTemplates": CustomTemplates,
    "EDProcedureNotes": EDProcedureNotes,
    "ERPlanBuilder": ERPlanBuilder,
    "ERx": ERx,
    "DrugsBugs": DrugsBugs,
    "Home": Home,
    "KnowledgeBaseV2": KnowledgeBaseV2,
    "MedicalNews": MedicalNews,
    "MedicationReference": MedicationReference,
    "NewPatientInput": NewPatientInput,
    "NoteTemplates": NoteTemplates,
    "NotesLibrary": NotesLibrary,
    "OrderSetBuilder": OrderSetBuilder,
    "PatientEducationGenerator": PatientEducationGenerator,
    "Shift": Shift,
    "Snippets": Snippets,
    "UserSettings": UserSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};