import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import NursingFlowsheet from './pages/NursingFlowsheet';
import AutoCoder from './pages/AutoCoder';
import ClinicalDecisionSupport from './pages/ClinicalDecisionSupport';
import NoteEditorTabsPage from './pages/NoteEditorTabs';
import ClinicalNoteStudio from './pages/ClinicalNoteStudio';
import DrugReference from './pages/DrugReference.jsx';
import MedicationReference from './pages/MedicationReference.jsx';
import SmartTemplates from './pages/SmartTemplates.jsx';
import KnowledgeBaseV2 from './pages/KnowledgeBaseV2.jsx';
import NewPatientInput from './pages/NewPatientInput.jsx';
import PatientEducationGenerator from './pages/PatientEducationGenerator.jsx';
import EDProcedureNotes from './pages/EDProcedureNotes.jsx';
import MedicalDecisionMaking from './pages/MedicalDecisionMaking.jsx';

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
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route path="/NursingFlowsheet" element={
        <LayoutWrapper currentPageName="NursingFlowsheet">
          <NursingFlowsheet />
        </LayoutWrapper>
      } />
      <Route path="/AutoCoder" element={
        <LayoutWrapper currentPageName="AutoCoder">
          <AutoCoder />
        </LayoutWrapper>
      } />
      <Route path="/ClinicalDecisionSupport" element={
        <LayoutWrapper currentPageName="ClinicalDecisionSupport">
          <ClinicalDecisionSupport />
        </LayoutWrapper>
      } />
      <Route path="/NoteEditorTabs" element={
        <LayoutWrapper currentPageName="NoteEditorTabs">
          <NoteEditorTabsPage />
        </LayoutWrapper>
      } />
      <Route path="/ClinicalNoteStudio" element={
        <LayoutWrapper currentPageName="ClinicalNoteStudio">
          <ClinicalNoteStudio />
        </LayoutWrapper>
      } />
      <Route path="/DrugReference" element={<DrugReference />} />
      <Route path="/MedicationReference" element={
        <LayoutWrapper currentPageName="MedicationReference">
          <MedicationReference />
        </LayoutWrapper>
      } />
      <Route path="/SmartTemplates" element={
        <LayoutWrapper currentPageName="SmartTemplates">
          <SmartTemplates />
        </LayoutWrapper>
      } />
      <Route path="/KnowledgeBaseV2" element={
        <LayoutWrapper currentPageName="KnowledgeBaseV2">
          <KnowledgeBaseV2 />
        </LayoutWrapper>
      } />
      <Route path="/NewPatientInput" element={
        <LayoutWrapper currentPageName="NewPatientInput">
          <NewPatientInput />
        </LayoutWrapper>
      } />
      <Route path="/PatientEducationGenerator" element={
        <LayoutWrapper currentPageName="PatientEducationGenerator">
          <PatientEducationGenerator />
        </LayoutWrapper>
      } />
      <Route path="/EDProcedureNotes" element={
        <LayoutWrapper currentPageName="EDProcedureNotes">
          <EDProcedureNotes />
        </LayoutWrapper>
      } />
      <Route path="/MedicalDecisionMaking" element={
        <LayoutWrapper currentPageName="MedicalDecisionMaking">
          <MedicalDecisionMaking />
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App