import AddendumManager from './pages/AddendumManager';
import UnifiedPharmacologyHub from './pages/UnifiedPharmacologyHub';
import FluidElectrolyteCalculator from './pages/FluidElectrolyteCalculator';
import AntibioticStewardshipHub from './pages/AntibioticStewardshipHub';
import CriticalCareDripHub from './pages/CriticalCareDripHub';
import AppSettings from './pages/AppSettings';
import AutoCoder from './pages/AutoCoder';
import EDProcedureNotes from './pages/EDProcedureNotes';
import ERPlanBuilder from './pages/ERPlanBuilder';
import Home from './pages/Home';
import KnowledgeBaseV2 from './pages/KnowledgeBaseV2';
import MedicalNews from './pages/MedicalNews';
import MedicationReference from './pages/MedicationReference';
import NewPatientInput from './pages/NewPatientInput';
import Calculators from './pages/Calculators';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AddendumManager": AddendumManager,
    "AppSettings": AppSettings,
    "AutoCoder": AutoCoder,
    "Calculators": Calculators,
    "EDProcedureNotes": EDProcedureNotes,
    "ERPlanBuilder": ERPlanBuilder,
    "Home": Home,
    "KnowledgeBaseV2": KnowledgeBaseV2,
    "MedicalNews": MedicalNews,
    "MedicationReference": MedicationReference,
    "NewPatientInput": NewPatientInput,
    "UnifiedPharmacologyHub": UnifiedPharmacologyHub,
    "FluidElectrolyteCalculator": FluidElectrolyteCalculator,
    "CriticalCareDripHub": CriticalCareDripHub,
    "AntibioticStewardshipHub": AntibioticStewardshipHub,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};