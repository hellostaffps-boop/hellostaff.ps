import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/hooks/useLanguage';
import { SupabaseAuthProvider } from '@/lib/supabaseAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleCompletion from '@/components/RoleCompletion';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import PublicLayout from './components/PublicLayout';
import CandidateLayout from './components/CandidateLayout';
import EmployerLayout from './components/EmployerLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import BrowseJobs from './pages/BrowseJobs';
import JobDetails from './pages/JobDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import EditProfile from './pages/candidate/EditProfile';
import CandidateJobs from './pages/candidate/CandidateJobs';
import SavedJobs from './pages/candidate/SavedJobs';
import Applications from './pages/candidate/Applications';
import CandidateNotifications from './pages/candidate/Notifications';
import CandidateSettings from './pages/candidate/Settings';
import EmployerDashboard from './pages/employer/Dashboard';
import PostJob from './pages/employer/PostJob';
import ManageJobs from './pages/employer/ManageJobs';
import EmployerApplications from './pages/employer/EmployerApplications.jsx';
import EmployerApplicationDetail from './pages/employer/EmployerApplicationDetail';
import CompanyProfile from './pages/employer/CompanyProfile';
import EmployerNotifications from './pages/employer/Notifications';
import TeamMembers from './pages/employer/TeamMembers';
import ApplicationChat from './pages/ApplicationChat';
import AdminPage from './pages/admin/AdminPage';
import AdminDashboard from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import OrganizationsManagement from './pages/admin/OrganizationsManagement';
import JobsModeration from './pages/admin/JobsModeration';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import DemoTools from './pages/admin/DemoTools';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/complete-profile" element={<RoleCompletion />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<BrowseJobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Route>

      {/* Candidate routes */}
      <Route element={<ProtectedRoute allowedRoles={["candidate"]} />}>
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<CandidateDashboard />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="jobs" element={<CandidateJobs />} />
          <Route path="saved" element={<SavedJobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="notifications" element={<CandidateNotifications />} />
          <Route path="settings" element={<CandidateSettings />} />
        </Route>
      </Route>

      {/* Employer routes */}
      <Route element={<ProtectedRoute allowedRoles={["employer_owner", "employer_manager"]} />}>
        <Route path="/employer" element={<EmployerLayout />}>
          <Route index element={<EmployerDashboard />} />
          <Route path="company" element={<CompanyProfile />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="jobs" element={<ManageJobs />} />
          <Route path="applications" element={<EmployerApplications />} />
          <Route path="applications/:id" element={<EmployerApplicationDetail />} />
          <Route path="notifications" element={<EmployerNotifications />} />
          <Route path="team" element={<TeamMembers />} />
        </Route>
      </Route>

      {/* Shared application chat — accessible by candidate and employer */}
      <Route element={<ProtectedRoute allowedRoles={["candidate", "employer_owner", "employer_manager"]} />}>
        <Route path="/application/:id/chat" element={<ApplicationChat />} />
      </Route>

      {/* Admin routes — secure hidden access */}
      <Route path="/admin" element={<AdminPage />} />
      <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/organizations" element={<OrganizationsManagement />} />
        <Route path="/admin/jobs" element={<JobsModeration />} />
        <Route path="/admin/demo" element={<DemoTools />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <SupabaseAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </SupabaseAuthProvider>
    </LanguageProvider>
  );
}

export default App