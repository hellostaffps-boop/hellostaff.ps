import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLogin from '@/components/AdminLogin';
import { base44 } from '@/api/base44Client';

export default function AdminPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await base44.functions.invoke('getAdminAccessState', {});
      if (response.data?.is_admin) {
        setIsAdmin(true);
      }
    } catch {
      // Not admin or not authenticated
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AdminLogin />;
}