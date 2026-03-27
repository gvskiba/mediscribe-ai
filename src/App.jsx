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
import NotryaCardiacHub from '@/pages/NotryaCardiacHub';
import NoteHistory from '@/pages/NoteHistory';
import NPIDemo from '@/pages/NPIDemo';
import BaseTemplate from '@/pages/BaseTemplate';
import EDProcedureNotesNew from '@/pages/EDProcedureNotes';
import PediatricDosingCalculator from '@/pages/PediatricDosingCalculator';
import StrokeAssessment from '@/pages/StrokeAssessment';
import EDOrders from '@/pages/EDOrders';
import NotryaApp from '@/pages/NotryaApp';
import NotryaACS from '@/pages/NotryaACS';


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
      <PatientSidebar />
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
      <Route path="/NotryaCardiacHub" element={<LayoutWrapper currentPageName="NotryaCardiacHub"><NotryaCardiacHub /></LayoutWrapper>} />
      <Route path="/notedetail" element={<LayoutWrapper currentPageName="ProviderStudio"><ProviderStudio /></LayoutWrapper>} />
      <Route path="/notehistory" element={<NoteHistory />} />
      <Route path="/npidemo" element={<NPIDemo />} />
      <Route path="/basetemplate" element={<BaseTemplate />} />
      <Route path="/PediatricDosingCalculator" element={<LayoutWrapper currentPageName="PediatricDosing"><PediatricDosingCalculator /></LayoutWrapper>} />
      <Route path="/StrokeAssessment" element={<LayoutWrapper currentPageName="StrokeAssessment"><StrokeAssessment /></LayoutWrapper>} />
      <Route path="/EDOrders" element={<LayoutWrapper currentPageName="EDOrders"><EDOrders /></LayoutWrapper>} />
      <Route path="/NotryaApp" element={<NotryaApp />} />
      <Route path="/NotryaACS" element={<NotryaACS />} />

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