import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PublicLayout from './components/PublicLayout';
import CandidateLayout from './components/CandidateLayout';
import EmployerLayout from './components/EmployerLayout';
import Home from './pages/Home';
import BrowseJobs from './pages/BrowseJobs';
import JobDetails from './pages/JobDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import EditProfile from './pages/candidate/EditProfile';
import CandidateJobs from './pages/candidate/CandidateJobs';
import SavedJobs from './pages/candidate/SavedJobs';
import Applications from './pages/candidate/Applications';
import CandidateNotifications from './pages/candidate/Notifications';
import CandidateSettings from './pages/candidate/Settings';
import EmployerDashboard from './pages/employer/Dashboard';

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
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<BrowseJobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
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
      <Route path="/employer" element={<EmployerLayout />}>
        <Route index element={<EmployerDashboard />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App