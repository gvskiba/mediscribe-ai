import "./notryaAccessibility.css";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PatientProvider } from '@/lib/PatientContext';
import { PatientDataProvider } from '@/lib/PatientDataContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PatientSidebar from '@/components/patient/PatientSidebar';
import GlobalNav from '@/components/GlobalNav';
import CommandPalette from '@/components/CommandPalette';
import LakonyxFloatingAI from '@/components/ai/NotryaFloatingAI';
import CommandKit from '@/components/CommandKit';
import PulseActivators from "@/components/PulseActivators";

// Pages
import PatientChart from '@/pages/PatientChart';
import ProviderStudio from '@/pages/ProviderStudio';
import NoteHistory from '@/pages/NoteHistory';
import NPIDemo from '@/pages/NPIDemo';
import BaseTemplate from '@/pages/BaseTemplate';
import PediatricDosingCalculator from '@/pages/PediatricDosingCalculator';
import StrokeHub from '@/pages/StrokeAssessment';
import EDOrderHub from '@/pages/EDOrderHub';
import OrderDashboard from '@/pages/OrderDashboard';
import CardiacHub from '@/pages/CardiacHub';
import TraumaHub from '@/pages/TraumaHub';
import HubSelectorPage from '@/pages/HubSelectorPage';
import OBGYNHub from '@/pages/OBGYNHub';
import AirwayHub from '@/pages/AirwayHub';
import ToxicologyHub from '@/pages/ToxicologyHub';
import LabHub from '@/pages/LabHub';
import PedsHub from '@/pages/PedsHub';
import ProviderBilling from '@/pages/ProviderBilling';
import HPI from '@/pages/HPI';
import HPITemplateAdmin from '@/pages/HPITemplateAdmin';
import TriageHub from '@/pages/TriageHub';
import SurgicalAirwayHub from '@/pages/SurgicalAirwayHub';
import RapidAssessmentHub from '@/pages/RapidAssessmentHub';
import ECGHub from '@/pages/ECGHub';
import PsycheHub from '@/pages/PsycheHub';
import ShockHub from '@/pages/ShockHub';
import POCUSHub from '@/pages/POCUSHub';
import OrthoHub from '@/pages/OrthoHub';
import ResusHub from '@/pages/ResusHub';
import AntidoteHub from '@/pages/AntidoteHub';
import RadiologyHub from '@/pages/RadiologyHub';
import ConsultHub from '@/pages/ConsultHub';
import ProcedureHub from '@/pages/ProcedureHub';
import InfectiousDiseaseHub from '@/pages/InfectiousDiseaseHub';
import DischargeHub from '@/pages/DischargeHub';
import BillingSubmissions from '@/pages/BillingSubmissions';
import WoundHub from '@/pages/WoundHub';
import DispositionBoard from '@/pages/DispositionBoard';
import DDxEngine from '@/pages/DDxEngine';
import CriticalResultsInbox from '@/pages/CriticalResultsInbox';
import ClinicalNarrativeEngine from '@/pages/ClinicalNarrativeEngine';
import LakonyxLanding from '@/pages/LakonyxLanding';
import CommandCenterWrapper from '@/pages/CommandCenterWrapper';
import PatientWorkspace from '@/pages/PatientWorkspace';
import ShiftSignout from '@/pages/ShiftSignout';
import AddendumManager from '@/pages/AddendumManager';
import ClinicalNoteV2 from '@/pages/ClinicalNoteV2';
import LakonyxNewTechnology from '@/pages/LakonyxNewTechnology';
import EDTrackingBoard from '@/pages/EDTrackingBoard';
import DischargeDisposition from '@/pages/DischargeDisposition';
import ScoreHub from '@/pages/ScoreHub';
import EDProcedureNotes from '@/pages/EDProcedureNotes';
import PainHub from '@/pages/PainHub';
import SyncopeHub from '@/pages/SyncopeHub';
import ImagingInterpreter from '@/pages/ImagingInterpreter';
import WoundCareHub from '@/pages/WoundCareHub';
import SeizureHub from '@/pages/SeizureHub';
import ChestPainHub from '@/pages/ChestPainHub';
import DentalHub from '@/pages/DentalHub';
import DyspneaHub from '@/pages/DyspneaHub';
import HeadacheHub from '@/pages/HeadacheHub';
import AbdominalPainHub from '@/pages/AbdominalPainHub';
import AMSHub from '@/pages/AMSHub';
import DVTHub from '@/pages/DVTHub';
import HuddleBoard from '@/pages/HuddleBoard';
import DermatologyHub from '@/pages/DermatologyHub';
import DermMorphologyRef from '@/pages/DermMorphologyRef';
import QuickNote from '@/pages/QuickNote';
import UnifiedPharmacologyHub from '@/pages/UnifiedPharmacologyHub';
import FluidElectrolyteCalculator from '@/pages/FluidElectrolyteCalculator';
import AntibioticStewardshipHub from '@/pages/AntibioticStewardshipHub';
import CriticalCareDripHub from '@/pages/CriticalCareDripHub';
import DrugFormularyAdmin from '@/pages/DrugFormularyAdmin';
import DrugComparisonHub from '@/pages/DrugComparisonHub';
import MedRecHub from '@/pages/MedRecHub';
import ClinicalPresentationHub from '@/pages/ClinicalPresentationHub';
import DischargeRxCard from '@/pages/DischargeRxCard';
import AIFlagReview from '@/pages/AIFlagReview';
import TemplateStudio from '@/pages/TemplateStudio';
import VitalsHub from '@/pages/VitalsHub';
import UserPreferences from '@/pages/UserPreferences';
import ShiftDashboard from '@/pages/ShiftDashboard';
import ClinicalDecisionHub from '@/pages/ClinicalDecisionHub';
import HubIndex from '@/pages/HubIndex';
import RSIPage from '@/pages/RsiPage';
import ElectrolyteAcidBaseHub from '@/pages/ElectrolyteAcidBaseHub';
import NIVPage from '@/pages/NIVPage';
import VentPage from '@/pages/VentPage';
import CriticalProtocolsPage from '@/pages/CriticalProtocolsPage';
import AnaphylaxisHub from '@/pages/AnaphylaxisHub';
import HyperkalemiaHub from '@/pages/HyperkalemiaHub';
import SepsisHub from '@/pages/SepsisHub';
import StatusEpilepticusHub from '@/pages/StatusEpilepticusHub';
import AirwayRSIHub from '@/pages/AirwayRSIHub';
import DKAHub from '@/pages/DKAHub';
import MassivePEHub from '@/pages/MassivePEHub';
import HypertensiveEmergencyHub from '@/pages/HypertensiveEmergencyHub';
import ADHFHub from '@/pages/ADHFHub';
import MeningitisHub from '@/pages/MeningitisHub';
import RhabdomyolysisHub from '@/pages/RhabdomyolysisHub';
import AdrenalCrisisHub from '@/pages/AdrenalCrisisHub';
import ThyroidStormHub from '@/pages/ThyroidStormHub';
import AcuteLiverFailureHub from '@/pages/AcuteLiverFailureHub';
import AcuteIschemicStrokeHub from '@/pages/AcuteIschemicStrokeHub';
import SAHHub from '@/pages/SAHHub';
import MyasthenicCrisisHub from '@/pages/MyasthenicCrisisHub';
import CardiogenicShockHub from '@/pages/CardiogenicShockHub';
import MassiveGIBleedHub from '@/pages/MassiveGIBleedHub';
import MTPHub from '@/pages/MTPHub';
import HeatStrokeHub from '@/pages/HeatStrokeHub';
import HyponatremiaHub from '@/pages/HyponatremiaHub';
import HypercalcemiaHub from '@/pages/HypercalcemiaHub';
import NMSHub from '@/pages/NMSHub';
import STEMIHub from '@/pages/STEMIHub';
import CardiacTamponadeHub from '@/pages/CardiacTamponadeHub';
import StatusAsthmaticusHub from '@/pages/StatusAsthmaticusHub';
import TensionPneumothoraxHub from '@/pages/TensionPneumothoraxHub';
import AlcoholWithdrawalHub from '@/pages/AlcoholWithdrawalHub';
import ToxicAlcoholHub from '@/pages/ToxicAlcoholHub';
import SympathomimeticHub from '@/pages/SympathomimeticHub';
import TTPHub from '@/pages/TTPHub';
import AnticoagulantReversalHub from '@/pages/AnticoagulantReversalHub';
import SickleCellHub from '@/pages/SickleCellHub';
import HELLPHub from '@/pages/HELLPHub';
import PostPartumHemorrhageHub from '@/pages/PostPartumHemorrhageHub';
import OpioidOverdoseHub from '@/pages/OpioidOverdoseHub';
import EMTALAHub from '@/pages/EMTALAHub';
import SpecialtyNoteHub from '@/pages/SpecialtyNoteHub';
import SpecialtyNoteHubT2 from '@/pages/SpecialtyNoteHubT2';
import LakonyxTechHub from '@/pages/LakonyxTechHub';
import CommandCenter from '@/pages/CommandCenter';
import CommandCenterSpine from '@/pages/CommandCenterSpine';
import AnamnesisPage from '@/pages/AnamnesisPage';
import AnamnesisAnalyticsDashboard from '@/pages/AnamnesisAnalyticsDashboard';
import FollowUpHub from '@/pages/FollowUpHub';
import PatientEncounter from '@/pages/PatientEncounter';
import LakonyxInvestorPitch from '@/pages/LakonyxInvestorPitch';
import LakonyxLandingPage from '@/pages/LakonyxLandingPage';


// Pages that have their own built-in AI floating button
const PAGES_WITH_OWN_AI = new Set(["/NewPatientInput", "/patientchart", "/CommandCenter"]);
// Pages that mount their own encounter-aware CommandPalette
const PAGES_WITH_OWN_PALETTE = new Set(["/NewPatientInput", "/CommandCenter"]);
// Pages that hide the global nav entirely
const PAGES_WITHOUT_NAV = new Set(["/CommandCenter"]);

function GlobalFloatingAI() {
  const location = useLocation();
  if (PAGES_WITH_OWN_AI.has(location.pathname)) return null;
  return <LakonyxFloatingAI />;
}

function GlobalCommandPalette({ navigate }) {
  const location = useLocation();
  if (PAGES_WITH_OWN_PALETTE.has(location.pathname)) return null;
  return <CommandPalette onNavigate={navigate} />;
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const AutocoderHubPage = Pages["AutoCoder"] || (() => null);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const hideNav = PAGES_WITHOUT_NAV.has(location.pathname);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      {!hideNav && <GlobalNav />}
      <GlobalCommandPalette navigate={routerNavigate} />
      {!hideNav && <PatientSidebar />}
      <GlobalFloatingAI />
      {!hideNav && <CommandKit />}
      {!hideNav && <PulseActivators />}
      <Routes>
        <Route path="/" element={<LakonyxLandingPage />} />
        <Route path="/CommandCenter" element={<CommandCenter />} />
        <Route path="/CommandCenterSpine" element={<CommandCenterSpine />} />
        <Route path="/PatientEncounter" element={<PatientEncounter />} />
        <Route path="/splash" element={<LakonyxInvestorPitch />} />

        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={
            path === "NewPatientInput" ? <Page /> :
            <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
          } />
        ))}

        {/* Core clinical tools */}
        <Route path="/patientchart" element={<PatientChart />} />
        <Route path="/ProviderStudio" element={<LayoutWrapper currentPageName="ProviderStudio"><ProviderStudio /></LayoutWrapper>} />
        <Route path="/notedetail"    element={<LayoutWrapper currentPageName="ProviderStudio"><ProviderStudio /></LayoutWrapper>} />
        <Route path="/notehistory"   element={<LayoutWrapper currentPageName="NoteHistory"><NoteHistory /></LayoutWrapper>} />
        <Route path="/npidemo"       element={<LayoutWrapper currentPageName="NPIDemo"><NPIDemo /></LayoutWrapper>} />
        <Route path="/basetemplate"  element={<LayoutWrapper currentPageName="BaseTemplate"><BaseTemplate /></LayoutWrapper>} />
        <Route path="/QuickNote"     element={<LayoutWrapper currentPageName="QuickNote"><QuickNote /></LayoutWrapper>} />
        <Route path="/AddendumManager"   element={<LayoutWrapper currentPageName="AddendumManager"><AddendumManager /></LayoutWrapper>} />
        <Route path="/ClinicalNoteV2"    element={<LayoutWrapper currentPageName="ClinicalNoteV2"><ClinicalNoteV2 /></LayoutWrapper>} />
        <Route path="/AIFlagReview"      element={<LayoutWrapper currentPageName="AIFlagReview"><AIFlagReview /></LayoutWrapper>} />
        <Route path="/TemplateStudio"    element={<LayoutWrapper currentPageName="TemplateStudio"><TemplateStudio /></LayoutWrapper>} />
        <Route path="/UserPreferences"   element={<LayoutWrapper currentPageName="UserPreferences"><UserPreferences /></LayoutWrapper>} />
        <Route path="/ShiftDashboard"    element={<LayoutWrapper currentPageName="ShiftDashboard"><ShiftDashboard /></LayoutWrapper>} />
        <Route path="/EDTrackingBoard"   element={<LayoutWrapper currentPageName="EDTrackingBoard"><EDTrackingBoard /></LayoutWrapper>} />
        <Route path="/DispositionBoard"  element={<LayoutWrapper currentPageName="DispositionBoard"><DispositionBoard /></LayoutWrapper>} />
        <Route path="/shift-signout"     element={<LayoutWrapper currentPageName="ShiftSignout"><ShiftSignout /></LayoutWrapper>} />
        <Route path="/command-center"    element={<LayoutWrapper currentPageName="CommandCenterWrapper"><CommandCenterWrapper /></LayoutWrapper>} />
        <Route path="/landing"           element={<LakonyxLanding />} />
        <Route path="/LakonyxLandingPage" element={<LakonyxLandingPage />} />

        <Route path="/new-technology"    element={<LayoutWrapper currentPageName="LakonyxNewTechnology"><LakonyxNewTechnology /></LayoutWrapper>} />
        <Route path="/huddle-board"        element={<LayoutWrapper currentPageName="HuddleBoard"><HuddleBoard /></LayoutWrapper>} />
        <Route path="/EDOrderHub"          element={<LayoutWrapper currentPageName="EDOrderHub"><EDOrderHub /></LayoutWrapper>} />
        <Route path="/patient-workspace" element={<LayoutWrapper currentPageName="PatientWorkspace"><PatientWorkspace /></LayoutWrapper>} />

        {/* Billing & coding */}
        <Route path="/provider-billing"    element={<LayoutWrapper currentPageName="ProviderBilling"><ProviderBilling /></LayoutWrapper>} />
        <Route path="/billing-submissions" element={<LayoutWrapper currentPageName="BillingSubmissions"><BillingSubmissions /></LayoutWrapper>} />
        <Route path="/DischargeRxCard"     element={<LayoutWrapper currentPageName="DischargeRxCard"><DischargeRxCard /></LayoutWrapper>} />

        {/* Documentation & notes */}
        <Route path="/hpi"       element={<LayoutWrapper currentPageName="HPI"><HPI /></LayoutWrapper>} />
        <Route path="/hpi-admin" element={<LayoutWrapper currentPageName="HPITemplateAdmin"><HPITemplateAdmin /></LayoutWrapper>} />
        <Route path="/discharge-disposition" element={<LayoutWrapper currentPageName="DischargeDisposition"><DischargeDisposition /></LayoutWrapper>} />
        <Route path="/ed-procedure-notes"    element={<LayoutWrapper currentPageName="EDProcedureNotes"><EDProcedureNotes /></LayoutWrapper>} />
        <Route path="/narrative-engine"      element={<LayoutWrapper currentPageName="ClinicalNarrativeEngine"><ClinicalNarrativeEngine /></LayoutWrapper>} />
        <Route path="/ddx-engine"            element={<LayoutWrapper currentPageName="DDxEngine"><DDxEngine /></LayoutWrapper>} />
        <Route path="/critical-inbox"        element={<LayoutWrapper currentPageName="CriticalResultsInbox"><CriticalResultsInbox /></LayoutWrapper>} />
        <Route path="/imaging-interpreter"   element={<LayoutWrapper currentPageName="ImagingInterpreter"><ImagingInterpreter /></LayoutWrapper>} />
        <Route path="/ClinicalDecisionHub"   element={<LayoutWrapper currentPageName="ClinicalDecisionHub"><ClinicalDecisionHub /></LayoutWrapper>} />
        <Route path="/hub-index"              element={<LayoutWrapper currentPageName="HubIndex"><HubIndex /></LayoutWrapper>} />
        <Route path="/RsiPage"                element={<LayoutWrapper currentPageName="RsiPage"><RSIPage /></LayoutWrapper>} />
        <Route path="/ElectrolyteAcidBaseHub" element={<LayoutWrapper currentPageName="ElectrolyteAcidBaseHub"><ElectrolyteAcidBaseHub /></LayoutWrapper>} />
        <Route path="/electrolyte-hub"        element={<LayoutWrapper currentPageName="ElectrolyteAcidBaseHub"><ElectrolyteAcidBaseHub /></LayoutWrapper>} />
        <Route path="/rsi-page"               element={<LayoutWrapper currentPageName="RsiPage"><RSIPage /></LayoutWrapper>} />
        <Route path="/NIVPage"                element={<LayoutWrapper currentPageName="NIVPage"><NIVPage /></LayoutWrapper>} />
        <Route path="/VentPage"               element={<LayoutWrapper currentPageName="VentPage"><VentPage /></LayoutWrapper>} />
        <Route path="/CriticalProtocolsPage"  element={<LayoutWrapper currentPageName="CriticalProtocolsPage"><CriticalProtocolsPage /></LayoutWrapper>} />
        <Route path="/critical-protocols"     element={<LayoutWrapper currentPageName="CriticalProtocolsPage"><CriticalProtocolsPage /></LayoutWrapper>} />
        <Route path="/AnaphylaxisHub"         element={<LayoutWrapper currentPageName="AnaphylaxisHub"><AnaphylaxisHub /></LayoutWrapper>} />
        <Route path="/HyperkalemiaHub"        element={<LayoutWrapper currentPageName="HyperkalemiaHub"><HyperkalemiaHub /></LayoutWrapper>} />
        <Route path="/StatusEpilepticusHub"   element={<LayoutWrapper currentPageName="StatusEpilepticusHub"><StatusEpilepticusHub /></LayoutWrapper>} />
        <Route path="/AirwayRSIHub"           element={<LayoutWrapper currentPageName="AirwayRSIHub"><AirwayRSIHub /></LayoutWrapper>} />
        <Route path="/DKAHub"                 element={<LayoutWrapper currentPageName="DKAHub"><DKAHub /></LayoutWrapper>} />
        <Route path="/MassivePEHub"           element={<LayoutWrapper currentPageName="MassivePEHub"><MassivePEHub /></LayoutWrapper>} />
        <Route path="/HypertensiveEmergencyHub" element={<LayoutWrapper currentPageName="HypertensiveEmergencyHub"><HypertensiveEmergencyHub /></LayoutWrapper>} />
        <Route path="/ADHFHub"                element={<LayoutWrapper currentPageName="ADHFHub"><ADHFHub /></LayoutWrapper>} />
        <Route path="/MeningitisHub"          element={<LayoutWrapper currentPageName="MeningitisHub"><MeningitisHub /></LayoutWrapper>} />
        <Route path="/RhabdomyolysisHub"      element={<LayoutWrapper currentPageName="RhabdomyolysisHub"><RhabdomyolysisHub /></LayoutWrapper>} />
        <Route path="/AdrenalCrisisHub"       element={<LayoutWrapper currentPageName="AdrenalCrisisHub"><AdrenalCrisisHub /></LayoutWrapper>} />
        <Route path="/ThyroidStormHub"        element={<LayoutWrapper currentPageName="ThyroidStormHub"><ThyroidStormHub /></LayoutWrapper>} />
        <Route path="/AcuteLiverFailureHub"      element={<LayoutWrapper currentPageName="AcuteLiverFailureHub"><AcuteLiverFailureHub /></LayoutWrapper>} />
        <Route path="/AcuteIschemicStrokeHub"    element={<LayoutWrapper currentPageName="AcuteIschemicStrokeHub"><AcuteIschemicStrokeHub /></LayoutWrapper>} />
        <Route path="/SAHHub"                    element={<LayoutWrapper currentPageName="SAHHub"><SAHHub /></LayoutWrapper>} />
        <Route path="/MyasthenicCrisisHub"       element={<LayoutWrapper currentPageName="MyasthenicCrisisHub"><MyasthenicCrisisHub /></LayoutWrapper>} />
        <Route path="/CardiogenicShockHub"       element={<LayoutWrapper currentPageName="CardiogenicShockHub"><CardiogenicShockHub /></LayoutWrapper>} />
        <Route path="/MassiveGIBleedHub"        element={<LayoutWrapper currentPageName="MassiveGIBleedHub"><MassiveGIBleedHub /></LayoutWrapper>} />
        <Route path="/MTPHub"                   element={<LayoutWrapper currentPageName="MTPHub"><MTPHub /></LayoutWrapper>} />
        <Route path="/HeatStrokeHub"            element={<LayoutWrapper currentPageName="HeatStrokeHub"><HeatStrokeHub /></LayoutWrapper>} />
        <Route path="/HyponatremiaHub"          element={<LayoutWrapper currentPageName="HyponatremiaHub"><HyponatremiaHub /></LayoutWrapper>} />
        <Route path="/HypercalcemiaHub"         element={<LayoutWrapper currentPageName="HypercalcemiaHub"><HypercalcemiaHub /></LayoutWrapper>} />
        <Route path="/NMSHub"                   element={<LayoutWrapper currentPageName="NMSHub"><NMSHub /></LayoutWrapper>} />
        <Route path="/STEMIHub"                 element={<LayoutWrapper currentPageName="STEMIHub"><STEMIHub /></LayoutWrapper>} />
        <Route path="/CardiacTamponadeHub"     element={<LayoutWrapper currentPageName="CardiacTamponadeHub"><CardiacTamponadeHub /></LayoutWrapper>} />
        <Route path="/StatusAsthmaticusHub"   element={<LayoutWrapper currentPageName="StatusAsthmaticusHub"><StatusAsthmaticusHub /></LayoutWrapper>} />
        <Route path="/TensionPneumothoraxHub" element={<LayoutWrapper currentPageName="TensionPneumothoraxHub"><TensionPneumothoraxHub /></LayoutWrapper>} />
        <Route path="/AlcoholWithdrawalHub"  element={<LayoutWrapper currentPageName="AlcoholWithdrawalHub"><AlcoholWithdrawalHub /></LayoutWrapper>} />
        <Route path="/ToxicAlcoholHub"      element={<LayoutWrapper currentPageName="ToxicAlcoholHub"><ToxicAlcoholHub /></LayoutWrapper>} />
        <Route path="/SympathomimeticHub"    element={<LayoutWrapper currentPageName="SympathomimeticHub"><SympathomimeticHub /></LayoutWrapper>} />
        <Route path="/TTPHub"                 element={<LayoutWrapper currentPageName="TTPHub"><TTPHub /></LayoutWrapper>} />
        <Route path="/AnticoagulantReversalHub" element={<LayoutWrapper currentPageName="AnticoagulantReversalHub"><AnticoagulantReversalHub /></LayoutWrapper>} />
        <Route path="/SickleCellHub"         element={<LayoutWrapper currentPageName="SickleCellHub"><SickleCellHub /></LayoutWrapper>} />
        <Route path="/HELLPHub"              element={<LayoutWrapper currentPageName="HELLPHub"><HELLPHub /></LayoutWrapper>} />
        <Route path="/PostPartumHemorrhageHub" element={<LayoutWrapper currentPageName="PostPartumHemorrhageHub"><PostPartumHemorrhageHub /></LayoutWrapper>} />
        <Route path="/OpioidOverdoseHub"      element={<LayoutWrapper currentPageName="OpioidOverdoseHub"><OpioidOverdoseHub /></LayoutWrapper>} />
        <Route path="/EMTALAHub"             element={<LayoutWrapper currentPageName="EMTALAHub"><EMTALAHub /></LayoutWrapper>} />
        <Route path="/SepsisHub"              element={<LayoutWrapper currentPageName="SepsisHub"><SepsisHub /></LayoutWrapper>} />
        <Route path="/ClinicalPresentationHub" element={<LayoutWrapper currentPageName="ClinicalPresentationHub"><ClinicalPresentationHub /></LayoutWrapper>} />

        {/* Pharmacology */}
        <Route path="/unified-pharma" element={<LayoutWrapper currentPageName="UnifiedPharmacologyHub"><UnifiedPharmacologyHub /></LayoutWrapper>} />
        <Route path="/MedRecHub"               element={<LayoutWrapper currentPageName="MedRecHub"><MedRecHub /></LayoutWrapper>} />
        <Route path="/DrugFormularyAdmin"      element={<LayoutWrapper currentPageName="DrugFormularyAdmin"><DrugFormularyAdmin /></LayoutWrapper>} />
        <Route path="/DrugComparisonHub"       element={<LayoutWrapper currentPageName="DrugComparisonHub"><DrugComparisonHub /></LayoutWrapper>} />
        <Route path="/AntibioticStewardshipHub" element={<LayoutWrapper currentPageName="AntibioticStewardshipHub"><AntibioticStewardshipHub /></LayoutWrapper>} />
        <Route path="/CriticalCareDripHub"     element={<LayoutWrapper currentPageName="CriticalCareDripHub"><CriticalCareDripHub /></LayoutWrapper>} />
        <Route path="/FluidElectrolyteCalculator" element={<LayoutWrapper currentPageName="FluidElectrolyteCalculator"><FluidElectrolyteCalculator /></LayoutWrapper>} />
        <Route path="/PediatricDosingCalculator" element={<LayoutWrapper currentPageName="PediatricDosing"><PediatricDosingCalculator /></LayoutWrapper>} />

        {/* Specialty hubs */}
        <Route path="/hub"             element={<LayoutWrapper currentPageName="HubSelectorPage"><HubSelectorPage /></LayoutWrapper>} />
        <Route path="/cardiac-hub"     element={<LayoutWrapper currentPageName="CardiacHub"><CardiacHub /></LayoutWrapper>} />
        <Route path="/trauma-hub"      element={<LayoutWrapper currentPageName="TraumaHub"><TraumaHub /></LayoutWrapper>} />
        <Route path="/ob-hub"          element={<LayoutWrapper currentPageName="OBGYNHub"><OBGYNHub /></LayoutWrapper>} />
        <Route path="/OBGYNHub"        element={<LayoutWrapper currentPageName="OBGYNHub"><OBGYNHub /></LayoutWrapper>} />
        <Route path="/airway-hub"      element={<LayoutWrapper currentPageName="AirwayHub"><AirwayHub /></LayoutWrapper>} />
        <Route path="/AirwayHub"       element={<LayoutWrapper currentPageName="AirwayHub"><AirwayHub /></LayoutWrapper>} />
        <Route path="/surgical-airway-hub" element={<LayoutWrapper currentPageName="SurgicalAirwayHub"><SurgicalAirwayHub /></LayoutWrapper>} />
        <Route path="/tox-hub"         element={<LayoutWrapper currentPageName="ToxicologyHub"><ToxicologyHub /></LayoutWrapper>} />
        <Route path="/ToxHub"          element={<LayoutWrapper currentPageName="ToxicologyHub"><ToxicologyHub /></LayoutWrapper>} />
        <Route path="/lab-interpreter" element={<LayoutWrapper currentPageName="LabHub"><LabHub /></LayoutWrapper>} />
        <Route path="/LabHub"          element={<LayoutWrapper currentPageName="LabHub"><LabHub /></LayoutWrapper>} />
        <Route path="/peds-hub"        element={<LayoutWrapper currentPageName="PedsHub"><PedsHub /></LayoutWrapper>} />
        <Route path="/PediatricHub"    element={<LayoutWrapper currentPageName="PedsHub"><PedsHub /></LayoutWrapper>} />
        <Route path="/triage-hub"      element={<LayoutWrapper currentPageName="TriageHub"><TriageHub /></LayoutWrapper>} />
        <Route path="/TriageHub"       element={<LayoutWrapper currentPageName="TriageHub"><TriageHub /></LayoutWrapper>} />
        <Route path="/rapid-assessment-hub" element={<LayoutWrapper currentPageName="RapidAssessmentHub"><RapidAssessmentHub /></LayoutWrapper>} />
        <Route path="/ecg-hub"         element={<LayoutWrapper currentPageName="ECGHub"><ECGHub /></LayoutWrapper>} />
        <Route path="/psyche-hub"      element={<LayoutWrapper currentPageName="PsycheHub"><PsycheHub /></LayoutWrapper>} />
        <Route path="/PsychHub"        element={<LayoutWrapper currentPageName="PsycheHub"><PsycheHub /></LayoutWrapper>} />
        <Route path="/shock-hub"       element={<LayoutWrapper currentPageName="ShockHub"><ShockHub /></LayoutWrapper>} />
        <Route path="/ShockHub"        element={<LayoutWrapper currentPageName="ShockHub"><ShockHub /></LayoutWrapper>} />
        <Route path="/pocus-hub"       element={<LayoutWrapper currentPageName="POCUSHub"><POCUSHub /></LayoutWrapper>} />
        <Route path="/POCUSHub"        element={<LayoutWrapper currentPageName="POCUSHub"><POCUSHub /></LayoutWrapper>} />
        <Route path="/ortho-hub"       element={<LayoutWrapper currentPageName="OrthoHub"><OrthoHub /></LayoutWrapper>} />
        <Route path="/OrthoHub"        element={<LayoutWrapper currentPageName="OrthoHub"><OrthoHub /></LayoutWrapper>} />
        <Route path="/resus-hub"       element={<LayoutWrapper currentPageName="ResusHub"><ResusHub /></LayoutWrapper>} />
        <Route path="/ResusHub"        element={<LayoutWrapper currentPageName="ResusHub"><ResusHub /></LayoutWrapper>} />
        <Route path="/antidote-hub"    element={<LayoutWrapper currentPageName="AntidoteHub"><AntidoteHub /></LayoutWrapper>} />
        <Route path="/radiology-hub"   element={<LayoutWrapper currentPageName="RadiologyHub"><RadiologyHub /></LayoutWrapper>} />
        <Route path="/consult-hub"     element={<LayoutWrapper currentPageName="ConsultHub"><ConsultHub /></LayoutWrapper>} />
        <Route path="/procedure-hub"   element={<LayoutWrapper currentPageName="ProcedureHub"><ProcedureHub /></LayoutWrapper>} />
        <Route path="/id-hub"          element={<LayoutWrapper currentPageName="InfectiousDiseaseHub"><InfectiousDiseaseHub /></LayoutWrapper>} />
        <Route path="/discharge-hub"   element={<LayoutWrapper currentPageName="DischargeHub"><DischargeHub /></LayoutWrapper>} />
        <Route path="/wound-hub"       element={<LayoutWrapper currentPageName="WoundHub"><WoundHub /></LayoutWrapper>} />
        <Route path="/wound-care-hub"  element={<LayoutWrapper currentPageName="WoundCareHub"><WoundCareHub /></LayoutWrapper>} />
        <Route path="/score-hub"       element={<LayoutWrapper currentPageName="ScoreHub"><ScoreHub /></LayoutWrapper>} />
        <Route path="/VitalsHub"       element={<LayoutWrapper currentPageName="VitalsHub"><VitalsHub /></LayoutWrapper>} />
        <Route path="/pain-hub"        element={<LayoutWrapper currentPageName="PainHub"><PainHub /></LayoutWrapper>} />
        <Route path="/syncope-hub"     element={<LayoutWrapper currentPageName="SyncopeHub"><SyncopeHub /></LayoutWrapper>} />
        <Route path="/seizure-hub"     element={<LayoutWrapper currentPageName="SeizureHub"><SeizureHub /></LayoutWrapper>} />
        <Route path="/ams-hub"         element={<LayoutWrapper currentPageName="AMSHub"><AMSHub /></LayoutWrapper>} />
        <Route path="/AMSHub"          element={<LayoutWrapper currentPageName="AMSHub"><AMSHub /></LayoutWrapper>} />
        <Route path="/dvt-hub"         element={<LayoutWrapper currentPageName="DVTHub"><DVTHub /></LayoutWrapper>} />
        <Route path="/derm-hub"        element={<LayoutWrapper currentPageName="DermatologyHub"><DermatologyHub /></LayoutWrapper>} />
        <Route path="/derm-morphology" element={<LayoutWrapper currentPageName="DermMorphologyRef"><DermMorphologyRef /></LayoutWrapper>} />
        <Route path="/stroke-hub"       element={<LayoutWrapper currentPageName="StrokeHub"><StrokeHub /></LayoutWrapper>} />
        <Route path="/StrokeHub"        element={<LayoutWrapper currentPageName="StrokeHub"><StrokeHub /></LayoutWrapper>} />

        {/* Presentation-based hubs */}
        <Route path="/ChestPainHub"     element={<LayoutWrapper currentPageName="ChestPainHub"><ChestPainHub /></LayoutWrapper>} />
        <Route path="/DentalHub"        element={<LayoutWrapper currentPageName="DentalHub"><DentalHub /></LayoutWrapper>} />
        <Route path="/DyspneaHub"       element={<LayoutWrapper currentPageName="DyspneaHub"><DyspneaHub /></LayoutWrapper>} />
        <Route path="/HeadacheHub"      element={<LayoutWrapper currentPageName="HeadacheHub"><HeadacheHub /></LayoutWrapper>} />
        <Route path="/AbdominalPainHub" element={<LayoutWrapper currentPageName="AbdominalPainHub"><AbdominalPainHub /></LayoutWrapper>} />

        {/* Legacy / misc */}
        <Route path="/OrderDashboard"  element={<LayoutWrapper currentPageName="OrderDashboard"><OrderDashboard /></LayoutWrapper>} />
        <Route path="/AutocoderHub" element={<LayoutWrapper currentPageName="AutoCoder"><AutocoderHubPage /></LayoutWrapper>} />
        <Route path="/specialty-note-hub" element={<LayoutWrapper currentPageName="SpecialtyNoteHub"><SpecialtyNoteHub /></LayoutWrapper>} />
        <Route path="/SpecialtyNoteHubT2" element={<LayoutWrapper currentPageName="SpecialtyNoteHubT2"><SpecialtyNoteHubT2 /></LayoutWrapper>} />
        <Route path="/tech-hub" element={<LayoutWrapper currentPageName="LakonyxTechHub"><LakonyxTechHub /></LayoutWrapper>} />
        <Route path="/follow-up-hub" element={<LayoutWrapper currentPageName="FollowUpHub"><FollowUpHub /></LayoutWrapper>} />
        <Route path="/EdNoteGenerator"  element={<LayoutWrapper currentPageName="QuickNote"><QuickNote /></LayoutWrapper>} />
        <Route path="/anamnesis"         element={<LayoutWrapper currentPageName="AnamnesisPage"><AnamnesisPage /></LayoutWrapper>} />
        <Route path="/anamnesis/analytics" element={<LayoutWrapper currentPageName="AnamnesisAnalyticsDashboard"><AnamnesisAnalyticsDashboard /></LayoutWrapper>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <PatientDataProvider>
          <PatientProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
          </PatientProvider>
        </PatientDataProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;