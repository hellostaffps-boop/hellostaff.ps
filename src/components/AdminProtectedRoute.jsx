import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/supabaseAuth';

/**
 * AdminProtectedRoute — Verifies platform_admin role via Supabase profile.
 * No more base44 functions or localStorage session tokens.
 */
export default function AdminProtectedRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (userProfile && userProfile.role !== 'platform_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Still loading profile — wait
  if (user && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return children ?? <Outlet />;
}