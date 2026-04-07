import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import StrokeAssessment from '@/pages/StrokeAssessment';
import EDOrders from '@/pages/EDOrders';
import NotryaApp from '@/pages/NotryaApp';
import NotryaACS from '@/pages/NotryaACS';
import OrderDashboard from '@/pages/OrderDashboard';
import CardiacHub from '@/pages/CardiacHub';
import TraumaHub from '@/pages/TraumaHub';
import HubSelectorPage from '@/pages/HubSelectorPage';
import OBGYNHub from '@/pages/OBGYNHub';
import SepsisHub from '@/pages/SepsisHub';
import AirwayHub from '@/pages/AirwayHub';
import ToxicologyHub from '@/pages/ToxicologyHub';
import PedsHub from '@/pages/PedsHub';
import ProviderBilling from '@/pages/ProviderBilling';
import HPI from '@/pages/HPI';
import HPITemplateAdmin from '@/pages/HPITemplateAdmin';
import ERx from '@/pages/ERx';
import LabsImaging from '@/pages/LabsImaging';
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
import ClinicalNoteStudio from '@/pages/ClinicalNoteStudio';
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
import NotryaFloatingAI from '@/components/ai/NotryaFloatingAI';
import { useLocation } from 'react-router-dom';
import AddendumManager from '@/pages/AddendumManager';
import EDTrackingBoard from '@/pages/EDTrackingBoard';
import DischargeDisposition from '@/pages/DischargeDisposition';



// Pages that have their own built-in AI floating button
const PAGES_WITH_OWN_AI = new Set(["/NewPatientInput", "/NotryaApp", "/patientchart"]);

function GlobalFloatingAI() {
  const location = useLocation();
  if (PAGES_WITH_OWN_AI.has(location.pathname)) return null;
  return <NotryaFloatingAI />;
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <GlobalNav />
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
      <Route path="/StrokeAssessment" element={<LayoutWrapper currentPageName="StrokeAssessment"><StrokeAssessment /></LayoutWrapper>} />
      <Route path="/EDOrders" element={<LayoutWrapper currentPageName="EDOrders"><EDOrders /></LayoutWrapper>} />
      <Route path="/NotryaApp" element={<NotryaApp />} />
      <Route path="/NotryaACS" element={<NotryaACS />} />
      <Route path="/OrderDashboard" element={<LayoutWrapper currentPageName="OrderDashboard"><OrderDashboard /></LayoutWrapper>} />
      <Route path="/cardiac-hub" element={<CardiacHub />} />
      <Route path="/trauma-hub" element={<TraumaHub />} />
      <Route path="/hub" element={<HubSelectorPage />} />
      <Route path="/ob-hub" element={<OBGYNHub />} />
      <Route path="/sepsis-hub" element={<SepsisHub />} />
      <Route path="/airway-hub" element={<AirwayHub />} />
      <Route path="/tox-hub" element={<ToxicologyHub />} />
      <Route path="/peds-hub" element={<PedsHub />} />
      <Route path="/provider-billing" element={<LayoutWrapper currentPageName="ProviderBilling"><ProviderBilling /></LayoutWrapper>} />
      <Route path="/hpi" element={<LayoutWrapper currentPageName="HPI"><HPI /></LayoutWrapper>} />
      <Route path="/hpi-admin" element={<LayoutWrapper currentPageName="HPITemplateAdmin"><HPITemplateAdmin /></LayoutWrapper>} />
      <Route path="/erx" element={<LayoutWrapper currentPageName="ERx"><ERx /></LayoutWrapper>} />
      <Route path="/LabsImaging" element={<LayoutWrapper currentPageName="LabsImaging"><LabsImaging /></LayoutWrapper>} />
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
      <Route path="/ClinicalNoteStudio" element={<ClinicalNoteStudio />} />
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