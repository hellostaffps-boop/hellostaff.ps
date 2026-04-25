import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/hooks/useLanguage';
import { SupabaseAuthProvider } from '@/lib/supabaseAuth';
import { CartProvider } from '@/hooks/useCart';
import { SettingsProvider } from '@/context/SettingsContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AppErrorBoundary from '@/components/AppErrorBoundary';

// ─── Lazy Imports — Auth ──────────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/auth/Login'));
const SignUp         = lazy(() => import('./pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const AuthCallback   = lazy(() => import('./pages/auth/AuthCallback'));
const RoleCompletion = lazy(() => import('./components/RoleCompletion'));

// ─── Lazy Imports — Public ────────────────────────────────────────────────────
const PublicLayout        = lazy(() => import('./components/PublicLayout'));
const Home                = lazy(() => import('./pages/Home'));
const BrowseJobs          = lazy(() => import('./pages/BrowseJobs'));
const JobDetails          = lazy(() => import('./pages/JobDetails'));
const Companies           = lazy(() => import('./pages/Companies'));
const CompanyPublicPage   = lazy(() => import('./pages/CompanyPublicPage'));
const About               = lazy(() => import('./pages/About'));
const Contact             = lazy(() => import('./pages/Contact'));
const PrivacyPolicy       = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService      = lazy(() => import('./pages/TermsOfService'));
const LatestNews          = lazy(() => import('./pages/LatestNews'));
const NewsArticle         = lazy(() => import('./pages/NewsArticle'));
const Store               = lazy(() => import('./pages/Store'));
const Academy             = lazy(() => import('./pages/Academy'));
const MyOrders            = lazy(() => import('./pages/MyOrders'));

// ─── Lazy Imports — Candidate ─────────────────────────────────────────────────
const CandidateLayout       = lazy(() => import('./components/CandidateLayout'));
const CandidateDashboard    = lazy(() => import('./pages/candidate/Dashboard'));
const CandidateProfile      = lazy(() => import('./pages/candidate/Profile'));
const EditProfile           = lazy(() => import('./pages/candidate/EditProfile'));
const CandidateJobs         = lazy(() => import('./pages/candidate/CandidateJobs'));
const SavedJobs             = lazy(() => import('./pages/candidate/SavedJobs'));
const Applications          = lazy(() => import('./pages/candidate/Applications'));
const CandidateNotifications = lazy(() => import('./pages/candidate/Notifications'));
const CandidateSettings     = lazy(() => import('./pages/candidate/Settings'));
const CVBuilder             = lazy(() => import('./pages/candidate/CVBuilder'));

// ─── Lazy Imports — Employer ──────────────────────────────────────────────────
const EmployerLayout            = lazy(() => import('./components/EmployerLayout'));
const EmployerOnboarding        = lazy(() => import('./pages/employer/EmployerOnboarding'));
const EmployerDashboard         = lazy(() => import('./pages/employer/Dashboard'));
const PostJob                   = lazy(() => import('./pages/employer/PostJob'));
const ManageJobs                = lazy(() => import('./pages/employer/ManageJobs'));
const EmployerApplications      = lazy(() => import('./pages/employer/EmployerApplications'));
const EmployerApplicationDetail = lazy(() => import('./pages/employer/EmployerApplicationDetail'));
const CompanyProfile            = lazy(() => import('./pages/employer/CompanyProfile'));
const EmployerNotifications     = lazy(() => import('./pages/employer/Notifications'));
const TeamMembers               = lazy(() => import('./pages/employer/TeamMembers'));
const ApplicationChat           = lazy(() => import('./pages/ApplicationChat'));
const Pricing                   = lazy(() => import('./pages/employer/Pricing'));
const EmployerSettings          = lazy(() => import('./pages/employer/Settings'));
const Analytics                 = lazy(() => import('./pages/employer/Analytics'));

// ─── Lazy Imports — Admin ─────────────────────────────────────────────────────
const AdminLayout              = lazy(() => import('./components/AdminLayout'));
const AdminPage                = lazy(() => import('./pages/admin/AdminPage'));
const AdminDashboard           = lazy(() => import('./pages/admin/Dashboard'));
const UsersManagement          = lazy(() => import('./pages/admin/UsersManagement'));
const OrganizationsManagement  = lazy(() => import('./pages/admin/OrganizationsManagement'));
const JobsModeration           = lazy(() => import('./pages/admin/JobsModeration'));
const DemoTools                = lazy(() => import('./pages/admin/DemoTools'));
const AdminSubscriptions       = lazy(() => import('./pages/admin/Subscriptions'));
const AdminPaymentSettings     = lazy(() => import('./pages/admin/PaymentSettings'));
const AdminReports             = lazy(() => import('./pages/admin/Reports'));
const AdminTestimonials        = lazy(() => import('./pages/admin/TestimonialsManagement'));
const AdminNotifications       = lazy(() => import('./pages/candidate/Notifications'));
const AdminBroadcast           = lazy(() => import('./pages/admin/AdminBroadcast'));
const AdminAcademy             = lazy(() => import('./pages/admin/AdminAcademy'));
const AdminStore               = lazy(() => import('./pages/admin/AdminStore'));
const AdminNews                = lazy(() => import('./pages/admin/AdminNews'));

// Global loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
    </div>
  );
}

const AuthenticatedApp = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/complete-profile" element={<RoleCompletion />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<BrowseJobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/company/:id" element={<CompanyPublicPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/news" element={<LatestNews />} />
          <Route path="/news/:slugOrId" element={<NewsArticle />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/store" element={<Store />} />
          <Route element={<ProtectedRoute allowedRoles={["candidate", "employer_owner", "employer_manager"]} />}>
            <Route path="/my-orders" element={<MyOrders />} />
          </Route>
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
            <Route path="cv-builder" element={<CVBuilder />} />
          </Route>
        </Route>

        {/* Employer routes */}
        <Route element={<ProtectedRoute allowedRoles={["employer_owner", "employer_manager"]} />}>
          <Route path="/employer/onboarding" element={<EmployerOnboarding />} />
          <Route path="/employer" element={<EmployerLayout />}>
            <Route index element={<EmployerDashboard />} />
            <Route path="company" element={<CompanyProfile />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="applications" element={<EmployerApplications />} />
            <Route path="applications/:id" element={<EmployerApplicationDetail />} />
            <Route path="notifications" element={<EmployerNotifications />} />
            <Route path="team" element={<TeamMembers />} />
            <Route path="settings" element={<EmployerSettings />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route path="/employer/pricing" element={<Pricing />} />
        </Route>

        {/* Shared application chat */}
        <Route element={<ProtectedRoute allowedRoles={["candidate", "employer_owner", "employer_manager"]} />}>
          <Route path="/application/:id/chat" element={<ApplicationChat />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/organizations" element={<OrganizationsManagement />} />
          <Route path="/admin/admins" element={<AdminsManagement />} />
          <Route path="/admin/jobs" element={<JobsModeration />} />
          <Route path="/admin/demo" element={<DemoTools />} />
          <Route path="/admin/testimonials" element={<AdminTestimonials />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/broadcast" element={<AdminBroadcast />} />
          <Route path="/admin/academy" element={<AdminAcademy />} />
          <Route path="/admin/store" element={<AdminStore />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/branding" element={<AdminBranding />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

const AdminsManagement         = lazy(() => import('./pages/admin/AdminsManagement'));
const AdminBranding            = lazy(() => import('./pages/admin/AdminBranding'));
import InstallPrompt from '@/components/pwa/InstallPrompt';

function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <SupabaseAuthProvider>
          <CartProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <AppErrorBoundary>
                  <AuthenticatedApp />
                  <InstallPrompt />
                </AppErrorBoundary>
              </Router>
              <Toaster />
              <SonnerToaster position="top-center" />
            </QueryClientProvider>
          </CartProvider>
        </SupabaseAuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App