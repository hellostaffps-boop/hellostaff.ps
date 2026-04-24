import { Navigate } from 'react-router-dom';
import AdminLogin from '@/components/AdminLogin';
import { useAuth } from '@/lib/supabaseAuth';

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user && userProfile?.role === 'platform_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLogin />;
}