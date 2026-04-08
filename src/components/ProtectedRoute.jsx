import { Navigate, Outlet } from "react-router-dom";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { useLanguage } from "@/hooks/useLanguage";

// allowedRoles: array of role strings. Empty = any authenticated user.
export default function ProtectedRoute({ allowedRoles = [], redirectTo = "/auth/login" }) {
  const { firebaseUser, userProfile, loading, needsRoleSetup } = useFirebaseAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (needsRoleSetup) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile?.role)) {
    // Redirect to their own dashboard
    const role = userProfile?.role;
    if (role === "candidate") return <Navigate to="/candidate" replace />;
    if (role === "employer_owner" || role === "employer_manager") return <Navigate to="/employer" replace />;
    if (role === "platform_admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}