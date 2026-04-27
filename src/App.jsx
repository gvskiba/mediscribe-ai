import "./notryaAccessibility.css";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PatientProvider } from '@/lib/PatientContext';
import { PatientDataProvider } from '@/lib/PatientDataContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PatientSidebar from '@/components/patient/PatientSidebar';
import AWSPharmacySection from '@/pages/AWSPharmacySection';
import PatientChart from '@/pages/PatientChart';
import ProviderStudio from '@/pages/ProviderStudio';
import NoteHistory from '@/pages/NoteHistory';
import NPIDemo from '@/pages/NPIDemo';
import BaseTemplate from '@/pages/BaseTemplate';
import EDProcedureNotesNew from '@/pages/EDProcedureNotes';
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
import LabInterpreter from '@/pages/LabInterpreter';
import PedsHub from '@/pages/PedsHub';
import ProviderBilling from '@/pages/ProviderBilling';
import HPI from '@/pages/HPI';
import HPITemplateAdmin from '@/pages/HPITemplateAdmin';
import ERx from '@/pages/ERx';
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
import SmartDosingHub from '@/pages/SmartDosingHub';
import DDxEngine from '@/pages/DDxEngine';
import CriticalResultsInbox from '@/pages/CriticalResultsInbox';
import ClinicalNarrativeEngine from '@/pages/ClinicalNarrativeEngine';
import NotryaLanding from '@/pages/NotryaLanding';
import ProviderCommandCenter from '@/pages/ProviderCommandCenter';
import CommandCenterWrapper from '@/pages/CommandCenterWrapper';
import PatientWorkspace from '@/pages/PatientWorkspace';
import ShiftSignout from '@/pages/ShiftSignout';
import GlobalNav from '@/components/GlobalNav';
import CommandPalette from '@/components/CommandPalette';
import NotryaFloatingAI from '@/components/ai/NotryaFloatingAI';
import { useLocation } from 'react-router-dom';
import AddendumManager from '@/pages/AddendumManager';
import ClinicalNoteV2 from '@/pages/ClinicalNoteV2';
import NotryaNewTechnology from '@/pages/NotryaNewTechnology';
import EDTrackingBoard from '@/pages/EDTrackingBoard';
import DischargeDisposition from '@/pages/DischargeDisposition';
import ScoreHub from '@/pages/ScoreHub';
import WeightDoseHub from '@/pages/WeightDoseHub';
import EDProcedureNotesStandalone from '@/pages/EDProcedureNotes';
import PainHub from '@/pages/PainHub';
import SyncopeHub from '@/pages/SyncopeHub';
import ImagingInterpreter from '@/pages/ImagingInterpreter';
import WoundCareHub from '@/pages/WoundCareHub';
import SeizureHub from '@/pages/SeizureHub';
import ChestPainHub from '@/pages/ChestPainHub';
import DyspneaHub from '@/pages/DyspneaHub';
import HeadacheHub from '@/pages/HeadacheHub';
import AbdominalPainHub from '@/pages/AbdominalPainHub';
import AMSHub from '@/pages/AMSHub';
import DVTHub from '@/pages/DVTHub';
import SepsisHub from '@/pages/SepsisHub';
import HuddleBoard from '@/pages/HuddleBoard';
import OrderGeneratorHub from '@/pages/OrderGeneratorHub';
import DermatologyHub from '@/pages/DermatologyHub';
import DermMorphologyRef from '@/pages/DermMorphologyRef';
import QuickNote from '@/pages/QuickNote';
import AIFlagReview from '@/pages/AIFlagReview';
import TemplateStudio from '@/pages/TemplateStudio';
import LabTrendHub from '@/pages/LabTrendHub';
import VitalsHub from '@/pages/VitalsHub';
import UserPreferences from '@/pages/UserPreferences';
import ShiftDashboard from '@/pages/ShiftDashboard';



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
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            path === "NewPatientInput" ? <Page /> :
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/awspharmacysection" element={
        <LayoutWrapper currentPageName="AWSPharmacySection">
          <AWSPharmacySection />
        </LayoutWrapper>
      } />
      <Route path="/patientchart" element={<PatientChart />} />
      <Route path="/ProviderStudio" element={<LayoutWrapper currentPageName="ProviderStudio"><ProviderStudio /></LayoutWrapper>} />
      <Route path="/notedetail" element={<LayoutWrapper currentPageName="ProviderStudio"><ProviderStudio /></LayoutWrapper>} />
      <Route path="/notehistory" element={<NoteHistory />} />
      <Route path="/npidemo" element={<NPIDemo />} />
      <Route path="/basetemplate" element={<BaseTemplate />} />
      <Route path="/PediatricDosingCalculator" element={<LayoutWrapper currentPageName="PediatricDosing"><PediatricDosingCalculator /></LayoutWrapper>} />
      <Route path="/StrokeAssessment" element={<StrokeHub />} />
      <Route path="/EDOrders" element={<LayoutWrapper currentPageName="EDOrders"><EDOrders /></LayoutWrapper>} />
      <Route path="/NotryaApp" element={<NotryaApp />} />
      <Route path="/NotryaACS" element={<NotryaACS />} />
      <Route path="/OrderDashboard" element={<LayoutWrapper currentPageName="OrderDashboard"><OrderDashboard /></LayoutWrapper>} />
      <Route path="/cardiac-hub" element={<CardiacHub />} />
      <Route path="/trauma-hub" element={<TraumaHub />} />
      <Route path="/hub" element={<HubSelectorPage />} />
      <Route path="/ob-hub" element={<OBGYNHub />} />
      <Route path="/OBGYNHub" element={<OBGYNHub />} />
      <Route path="/sepsis-hub" element={<SepsisAbxHub />} />
      <Route path="/airway-hub" element={<AirwayHub />} />
      <Route path="/tox-hub" element={<ToxicologyHub />} />
      <Route path="/lab-interpreter" element={<LabInterpreter />} />
      <Route path="/peds-hub" element={<PedsHub />} />
      <Route path="/provider-billing" element={<LayoutWrapper currentPageName="ProviderBilling"><ProviderBilling /></LayoutWrapper>} />
      <Route path="/hpi" element={<LayoutWrapper currentPageName="HPI"><HPI /></LayoutWrapper>} />
      <Route path="/hpi-admin" element={<LayoutWrapper currentPageName="HPITemplateAdmin"><HPITemplateAdmin /></LayoutWrapper>} />
      <Route path="/erx" element={<LayoutWrapper currentPageName="ERx"><ERx /></LayoutWrapper>} />
      <Route path="/triage-hub" element={<TriageHub />} />
      <Route path="/rapid-assessment-hub" element={<RapidAssessmentHub />} />
      <Route path="/ecg-hub" element={<ECGHub />} />
      <Route path="/psyche-hub" element={<PsycheHub />} />
      <Route path="/surgical-airway-hub" element={<SurgicalAirwayHub />} />
      <Route path="/shock-hub" element={<ShockHub />} />
      <Route path="/pocus-hub" element={<POCUSHub />} />
      <Route path="/ortho-hub" element={<OrthoHub />} />
      <Route path="/resus-hub" element={<ResusHub />} />
      <Route path="/antidote-hub" element={<AntidoteHub />} />
      <Route path="/radiology-hub" element={<RadiologyHub />} />
      <Route path="/consult-hub" element={<ConsultHub />} />
      <Route path="/procedure-hub" element={<ProcedureHub />} />
      <Route path="/id-hub" element={<InfectiousDiseaseHub />} />
      <Route path="/discharge-hub" element={<DischargeHub />} />
      <Route path="/billing-submissions" element={<BillingSubmissions />} />
      <Route path="/wound-hub" element={<LayoutWrapper currentPageName="WoundHub"><WoundHub /></LayoutWrapper>} />
      <Route path="/EDTrackingBoard" element={<EDTrackingBoard />} />
      <Route path="/DispositionBoard" element={<DispositionBoard />} />
      <Route path="/smart-dosing" element={<SmartDosingHub />} />
      <Route path="/ddx-engine" element={<DDxEngine />} />
      <Route path="/critical-inbox" element={<CriticalResultsInbox />} />
      <Route path="/narrative-engine" element={<ClinicalNarrativeEngine />} />
      <Route path="/landing" element={<NotryaLanding />} />
      <Route path="/command-center" element={<CommandCenterWrapper />} />
      <Route path="/patient-workspace" element={<LayoutWrapper currentPageName="PatientWorkspace"><PatientWorkspace /></LayoutWrapper>} />
      <Route path="/shift-signout" element={<ShiftSignout />} />
      <Route path="/AddendumManager" element={<AddendumManager />} />
      <Route path="/discharge-disposition" element={<DischargeDisposition />} />
      <Route path="/ClinicalNoteV2" element={<ClinicalNoteV2 />} />
      <Route path="/new-technology" element={<NotryaNewTechnology />} />
      <Route path="/score-hub" element={<ScoreHub />} />
      <Route path="/weight-dose" element={<WeightDoseHub />} />
      <Route path="/stroke-hub" element={<StrokeHub />} />
      <Route path="/StrokeHub" element={<StrokeHub />} />
      <Route path="/ed-procedure-notes" element={<EDProcedureNotesStandalone />} />
      <Route path="/pain-hub" element={<PainHub />} />
      <Route path="/syncope-hub" element={<SyncopeHub />} />
      <Route path="/imaging-interpreter" element={<ImagingInterpreter />} />
      <Route path="/wound-care-hub" element={<WoundCareHub />} />
      <Route path="/seizure-hub" element={<SeizureHub />} />
      <Route path="/ChestPainHub" element={<LayoutWrapper currentPageName="ChestPainHub"><ChestPainHub /></LayoutWrapper>} />
      <Route path="/DyspneaHub" element={<LayoutWrapper currentPageName="DyspneaHub"><DyspneaHub /></LayoutWrapper>} />
      <Route path="/HeadacheHub" element={<LayoutWrapper currentPageName="HeadacheHub"><HeadacheHub /></LayoutWrapper>} />
      <Route path="/AbdominalPainHub" element={<LayoutWrapper currentPageName="AbdominalPainHub"><AbdominalPainHub /></LayoutWrapper>} />
      <Route path="/ams-hub" element={<AMSHub />} />
      <Route path="/dvt-hub" element={<DVTHub />} />

      {/* ── Alias routes for updated Home.jsx hub catalog ── */}
      <Route path="/PediatricHub" element={<PedsHub />} />
      <Route path="/ResusHub" element={<ResusHub />} />
      <Route path="/StrokeHub" element={<StrokeHub />} />
      <Route path="/ECGHub" element={<ECGHub />} />
      <Route path="/LabInterpreter" element={<LabInterpreter />} />
      <Route path="/ScoreHub" element={<ScoreHub />} />
      <Route path="/POCUSHub" element={<POCUSHub />} />
      <Route path="/WeightDoseHub" element={<WeightDoseHub />} />
      <Route path="/ToxHub" element={<ToxicologyHub />} />
      <Route path="/PsychHub" element={<PsycheHub />} />
      <Route path="/TriageHub" element={<TriageHub />} />
      <Route path="/AutocoderHub" element={<LayoutWrapper currentPageName="AutoCoder"><AutocoderHubPage /></LayoutWrapper>} />
      <Route path="/SmartDischargeHub" element={<DischargeHub />} />
      <Route path="/SepsisHub" element={<SepsisHub />} />
      <Route path="/huddle-board" element={<HuddleBoard />} />
      <Route path="/order-generator" element={<OrderGeneratorHub />} />
      <Route path="/derm-hub" element={<DermatologyHub />} />
      <Route path="/derm-morphology" element={<DermMorphologyRef />} />
      <Route path="/AMSHub" element={<AMSHub />} />
      <Route path="/OrthoHub" element={<OrthoHub />} />
      <Route path="/ERx" element={<LayoutWrapper currentPageName="ERx"><ERx /></LayoutWrapper>} />
      <Route path="/WoundCareHub" element={<WoundCareHub />} />
      <Route path="/AirwayHub" element={<AirwayHub />} />
      <Route path="/ShockHub" element={<ShockHub />} />
      <Route path="/SyncopeHub" element={<SyncopeHub />} />
      <Route path="/QuickNote" element={<QuickNote />} />
      <Route path="/AIFlagReview" element={<AIFlagReview />} />
      <Route path="/TemplateStudio" element={<TemplateStudio />} />
      <Route path="/LabTrendHub" element={<LabTrendHub />} />
      <Route path="/VitalsHub" element={<VitalsHub />} />
      <Route path="/UserPreferences" element={<UserPreferences />} />
      <Route path="/ShiftDashboard" element={<ShiftDashboard />} />

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
  )
}

export default App