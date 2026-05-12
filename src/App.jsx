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
import NotryaFloatingAI from '@/components/ai/NotryaFloatingAI';

// Pages
import PatientChart from '@/pages/PatientChart';
import ProviderStudio from '@/pages/ProviderStudio';
import NoteHistory from '@/pages/NoteHistory';
import NPIDemo from '@/pages/NPIDemo';
import BaseTemplate from '@/pages/BaseTemplate';
import PediatricDosingCalculator from '@/pages/PediatricDosingCalculator';
import StrokeHub from '@/pages/StrokeAssessment';
import EDOrders from '@/pages/EDOrders';
import NotryaApp from '@/pages/NotryaApp';
import NotryaACS from '@/pages/NotryaACS';
import OrderDashboard from '@/pages/OrderDashboard';
import CardiacHub from '@/pages/CardiacHub';
import TraumaHub from '@/pages/TraumaHub';
import HubSelectorPage from '@/pages/HubSelectorPage';
import OBGYNHub from '@/pages/OBGYNHub';
import SepsisAbxHub from '@/pages/SepsisAbxHub';
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
import NotryaLanding from '@/pages/NotryaLanding';
import CommandCenterWrapper from '@/pages/CommandCenterWrapper';
import PatientWorkspace from '@/pages/PatientWorkspace';
import ShiftSignout from '@/pages/ShiftSignout';
import AddendumManager from '@/pages/AddendumManager';
import ClinicalNoteV2 from '@/pages/ClinicalNoteV2';
import NotryaNewTechnology from '@/pages/NotryaNewTechnology';
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
import OrderGeneratorHub from '@/pages/OrderGeneratorHub';
import DermatologyHub from '@/pages/DermatologyHub';
import DermMorphologyRef from '@/pages/DermMorphologyRef';
import QuickNote from '@/pages/QuickNote';
import UnifiedPharmacologyHub from '@/pages/UnifiedPharmacologyHub';
import FluidElectrolyteCalculator from '@/pages/FluidElectrolyteCalculator';
import AntibioticStewardshipHub from '@/pages/AntibioticStewardshipHub';
import CriticalCareDripHub from '@/pages/CriticalCareDripHub';
import DrugFormularyAdmin from '@/pages/DrugFormularyAdmin';
import DrugComparisonHub from '@/pages/DrugComparisonHub';
import SepsisBundleTracker from '@/pages/SepsisBundleTracker';
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
import Sepsis1HourBundleHub from '@/pages/Sepsis1HourBundleHub';
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

// Pages that have their own built-in AI floating button
const PAGES_WITH_OWN_AI = new Set(["/NewPatientInput", "/NotryaApp", "/patientchart"]);
// Pages that mount their own encounter-aware CommandPalette
const PAGES_WITH_OWN_PALETTE = new Set(["/NewPatientInput"]);

function GlobalFloatingAI() {
  const location = useLocation();
  if (PAGES_WITH_OWN_AI.has(location.pathname)) return null;
  return <NotryaFloatingAI />;
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
      <GlobalNav />
      <GlobalCommandPalette navigate={routerNavigate} />
      <PatientSidebar />
      <GlobalFloatingAI />
      <Routes>
        <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />

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
        <Route path="/notehistory"   element={<NoteHistory />} />
        <Route path="/npidemo"       element={<NPIDemo />} />
        <Route path="/basetemplate"  element={<BaseTemplate />} />
        <Route path="/QuickNote"     element={<QuickNote />} />
        <Route path="/AddendumManager"   element={<AddendumManager />} />
        <Route path="/ClinicalNoteV2"    element={<ClinicalNoteV2 />} />
        <Route path="/AIFlagReview"      element={<AIFlagReview />} />
        <Route path="/TemplateStudio"    element={<TemplateStudio />} />
        <Route path="/UserPreferences"   element={<UserPreferences />} />
        <Route path="/ShiftDashboard"    element={<ShiftDashboard />} />
        <Route path="/EDTrackingBoard"   element={<EDTrackingBoard />} />
        <Route path="/DispositionBoard"  element={<DispositionBoard />} />
        <Route path="/shift-signout"     element={<ShiftSignout />} />
        <Route path="/command-center"    element={<CommandCenterWrapper />} />
        <Route path="/landing"           element={<NotryaLanding />} />
        <Route path="/new-technology"    element={<NotryaNewTechnology />} />
        <Route path="/huddle-board"      element={<HuddleBoard />} />
        <Route path="/order-generator"   element={<OrderGeneratorHub />} />
        <Route path="/patient-workspace" element={<LayoutWrapper currentPageName="PatientWorkspace"><PatientWorkspace /></LayoutWrapper>} />

        {/* Billing & coding */}
        <Route path="/provider-billing"    element={<LayoutWrapper currentPageName="ProviderBilling"><ProviderBilling /></LayoutWrapper>} />
        <Route path="/billing-submissions" element={<BillingSubmissions />} />
        <Route path="/DischargeRxCard"     element={<DischargeRxCard />} />

        {/* Documentation & notes */}
        <Route path="/hpi"       element={<LayoutWrapper currentPageName="HPI"><HPI /></LayoutWrapper>} />
        <Route path="/hpi-admin" element={<LayoutWrapper currentPageName="HPITemplateAdmin"><HPITemplateAdmin /></LayoutWrapper>} />
        <Route path="/discharge-disposition" element={<DischargeDisposition />} />
        <Route path="/ed-procedure-notes"    element={<EDProcedureNotes />} />
        <Route path="/narrative-engine"      element={<ClinicalNarrativeEngine />} />
        <Route path="/ddx-engine"            element={<DDxEngine />} />
        <Route path="/critical-inbox"        element={<CriticalResultsInbox />} />
        <Route path="/imaging-interpreter"   element={<ImagingInterpreter />} />
        <Route path="/ClinicalDecisionHub"   element={<ClinicalDecisionHub />} />
        <Route path="/hub-index"              element={<HubIndex />} />
        <Route path="/RsiPage"                element={<RSIPage />} />
        <Route path="/ElectrolyteAcidBaseHub" element={<ElectrolyteAcidBaseHub />} />
        <Route path="/electrolyte-hub"        element={<ElectrolyteAcidBaseHub />} />
        <Route path="/rsi-page"               element={<RSIPage />} />
        <Route path="/NIVPage"                element={<NIVPage />} />
        <Route path="/VentPage"               element={<VentPage />} />
        <Route path="/CriticalProtocolsPage"  element={<CriticalProtocolsPage />} />
        <Route path="/critical-protocols"     element={<CriticalProtocolsPage />} />
        <Route path="/AnaphylaxisHub"         element={<AnaphylaxisHub />} />
        <Route path="/HyperkalemiaHub"        element={<HyperkalemiaHub />} />
        <Route path="/StatusEpilepticusHub"   element={<StatusEpilepticusHub />} />
        <Route path="/AirwayRSIHub"           element={<AirwayRSIHub />} />
        <Route path="/DKAHub"                 element={<DKAHub />} />
        <Route path="/MassivePEHub"           element={<MassivePEHub />} />
        <Route path="/HypertensiveEmergencyHub" element={<HypertensiveEmergencyHub />} />
        <Route path="/ADHFHub"                element={<ADHFHub />} />
        <Route path="/MeningitisHub"          element={<MeningitisHub />} />
        <Route path="/RhabdomyolysisHub"      element={<RhabdomyolysisHub />} />
        <Route path="/AdrenalCrisisHub"       element={<AdrenalCrisisHub />} />
        <Route path="/ThyroidStormHub"        element={<ThyroidStormHub />} />
        <Route path="/AcuteLiverFailureHub"      element={<AcuteLiverFailureHub />} />
        <Route path="/AcuteIschemicStrokeHub"    element={<AcuteIschemicStrokeHub />} />
        <Route path="/SAHHub"                    element={<SAHHub />} />
        <Route path="/MyasthenicCrisisHub"       element={<MyasthenicCrisisHub />} />
        <Route path="/CardiogenicShockHub"       element={<CardiogenicShockHub />} />
        <Route path="/MassiveGIBleedHub"        element={<MassiveGIBleedHub />} />
        <Route path="/MTPHub"                   element={<MTPHub />} />
        <Route path="/HeatStrokeHub"            element={<HeatStrokeHub />} />
        <Route path="/HyponatremiaHub"          element={<HyponatremiaHub />} />
        <Route path="/HypercalcemiaHub"         element={<HypercalcemiaHub />} />
        <Route path="/NMSHub"                   element={<NMSHub />} />
        <Route path="/STEMIHub"                 element={<STEMIHub />} />
        <Route path="/CardiacTamponadeHub"     element={<CardiacTamponadeHub />} />
        <Route path="/StatusAsthmaticusHub"   element={<StatusAsthmaticusHub />} />
        <Route path="/TensionPneumothoraxHub" element={<TensionPneumothoraxHub />} />
        <Route path="/AlcoholWithdrawalHub"  element={<AlcoholWithdrawalHub />} />
        <Route path="/ToxicAlcoholHub"      element={<ToxicAlcoholHub />} />
        <Route path="/SympathomimeticHub"    element={<SympathomimeticHub />} />
        <Route path="/TTPHub"                 element={<TTPHub />} />
        <Route path="/SepsisHub"              element={<SepsisHub />} />
        <Route path="/Sepsis1HourBundleHub"   element={<Sepsis1HourBundleHub />} />
        <Route path="/ClinicalPresentationHub" element={<ClinicalPresentationHub />} />

        {/* Pharmacology */}
        <Route path="/erx"            element={<UnifiedPharmacologyHub />} />
        <Route path="/ERx"            element={<UnifiedPharmacologyHub />} />
        <Route path="/smart-dosing"   element={<UnifiedPharmacologyHub />} />
        <Route path="/weight-dose"    element={<UnifiedPharmacologyHub />} />
        <Route path="/unified-pharma" element={<UnifiedPharmacologyHub />} />
        <Route path="/WeightDoseHub"  element={<UnifiedPharmacologyHub />} />
        <Route path="/SmartDosingHub" element={<UnifiedPharmacologyHub />} />
        <Route path="/MedRecHub"               element={<MedRecHub />} />
        <Route path="/DrugFormularyAdmin"      element={<DrugFormularyAdmin />} />
        <Route path="/DrugComparisonHub"       element={<DrugComparisonHub />} />
        <Route path="/AntibioticStewardshipHub" element={<AntibioticStewardshipHub />} />
        <Route path="/CriticalCareDripHub"     element={<CriticalCareDripHub />} />
        <Route path="/FluidElectrolyteCalculator" element={<FluidElectrolyteCalculator />} />
        <Route path="/PediatricDosingCalculator" element={<LayoutWrapper currentPageName="PediatricDosing"><PediatricDosingCalculator /></LayoutWrapper>} />

        {/* Specialty hubs */}
        <Route path="/hub"             element={<HubSelectorPage />} />
        <Route path="/cardiac-hub"     element={<CardiacHub />} />
        <Route path="/trauma-hub"      element={<TraumaHub />} />
        <Route path="/ob-hub"          element={<OBGYNHub />} />
        <Route path="/OBGYNHub"        element={<OBGYNHub />} />
        <Route path="/sepsis-hub"      element={<SepsisAbxHub />} />
        <Route path="/SepsisBundleTracker" element={<SepsisBundleTracker />} />
        <Route path="/airway-hub"      element={<AirwayHub />} />
        <Route path="/AirwayHub"       element={<AirwayHub />} />
        <Route path="/surgical-airway-hub" element={<SurgicalAirwayHub />} />
        <Route path="/tox-hub"         element={<ToxicologyHub />} />
        <Route path="/ToxHub"          element={<ToxicologyHub />} />
        <Route path="/lab-interpreter" element={<LabHub />} />
        <Route path="/LabHub"          element={<LabHub />} />
        <Route path="/LabInterpreter"  element={<LabHub />} />
        <Route path="/LabTrendHub"     element={<LabHub />} />
        <Route path="/peds-hub"        element={<PedsHub />} />
        <Route path="/PediatricHub"    element={<PedsHub />} />
        <Route path="/triage-hub"      element={<TriageHub />} />
        <Route path="/TriageHub"       element={<TriageHub />} />
        <Route path="/rapid-assessment-hub" element={<RapidAssessmentHub />} />
        <Route path="/ecg-hub"         element={<ECGHub />} />
        <Route path="/ECGHub"          element={<ECGHub />} />
        <Route path="/psyche-hub"      element={<PsycheHub />} />
        <Route path="/PsychHub"        element={<PsycheHub />} />
        <Route path="/shock-hub"       element={<ShockHub />} />
        <Route path="/ShockHub"        element={<ShockHub />} />
        <Route path="/pocus-hub"       element={<POCUSHub />} />
        <Route path="/POCUSHub"        element={<POCUSHub />} />
        <Route path="/ortho-hub"       element={<OrthoHub />} />
        <Route path="/OrthoHub"        element={<OrthoHub />} />
        <Route path="/resus-hub"       element={<ResusHub />} />
        <Route path="/ResusHub"        element={<ResusHub />} />
        <Route path="/antidote-hub"    element={<AntidoteHub />} />
        <Route path="/radiology-hub"   element={<RadiologyHub />} />
        <Route path="/consult-hub"     element={<ConsultHub />} />
        <Route path="/procedure-hub"   element={<ProcedureHub />} />
        <Route path="/id-hub"          element={<InfectiousDiseaseHub />} />
        <Route path="/discharge-hub"   element={<DischargeHub />} />
        <Route path="/SmartDischargeHub" element={<DischargeHub />} />
        <Route path="/wound-hub"       element={<LayoutWrapper currentPageName="WoundHub"><WoundHub /></LayoutWrapper>} />
        <Route path="/wound-care-hub"  element={<WoundCareHub />} />
        <Route path="/WoundCareHub"    element={<WoundCareHub />} />
        <Route path="/score-hub"       element={<ScoreHub />} />
        <Route path="/ScoreHub"        element={<ScoreHub />} />
        <Route path="/VitalsHub"       element={<VitalsHub />} />
        <Route path="/pain-hub"        element={<PainHub />} />
        <Route path="/syncope-hub"     element={<SyncopeHub />} />
        <Route path="/SyncopeHub"      element={<SyncopeHub />} />
        <Route path="/seizure-hub"     element={<SeizureHub />} />
        <Route path="/ams-hub"         element={<AMSHub />} />
        <Route path="/AMSHub"          element={<AMSHub />} />
        <Route path="/dvt-hub"         element={<DVTHub />} />
        <Route path="/derm-hub"        element={<DermatologyHub />} />
        <Route path="/derm-morphology" element={<DermMorphologyRef />} />
        <Route path="/stroke-hub"       element={<StrokeHub />} />
        <Route path="/StrokeHub"        element={<StrokeHub />} />
        <Route path="/StrokeAssessment" element={<StrokeHub />} />

        {/* Presentation-based hubs */}
        <Route path="/ChestPainHub"     element={<LayoutWrapper currentPageName="ChestPainHub"><ChestPainHub /></LayoutWrapper>} />
        <Route path="/DentalHub"        element={<LayoutWrapper currentPageName="DentalHub"><DentalHub /></LayoutWrapper>} />
        <Route path="/DyspneaHub"       element={<LayoutWrapper currentPageName="DyspneaHub"><DyspneaHub /></LayoutWrapper>} />
        <Route path="/HeadacheHub"      element={<LayoutWrapper currentPageName="HeadacheHub"><HeadacheHub /></LayoutWrapper>} />
        <Route path="/AbdominalPainHub" element={<LayoutWrapper currentPageName="AbdominalPainHub"><AbdominalPainHub /></LayoutWrapper>} />

        {/* Legacy / misc */}
        <Route path="/EDOrders"   element={<LayoutWrapper currentPageName="EDOrders"><EDOrders /></LayoutWrapper>} />
        <Route path="/NotryaApp"  element={<NotryaApp />} />
        <Route path="/NotryaACS"  element={<NotryaACS />} />
        <Route path="/OrderDashboard" element={<LayoutWrapper currentPageName="OrderDashboard"><OrderDashboard /></LayoutWrapper>} />
        <Route path="/AutocoderHub" element={<LayoutWrapper currentPageName="AutoCoder"><AutocoderHubPage /></LayoutWrapper>} />

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