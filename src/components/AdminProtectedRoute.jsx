import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getAdminSession, getSessionExpirationStatus } from '@/lib/adminSessionManager';

export default function AdminProtectedRoute({ children }) {
  const [accessState, setAccessState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const session = getAdminSession();
      const timeoutMinutes = 30; // default timeout

      // Check if session expired
      const expStatus = getSessionExpirationStatus(timeoutMinutes);
      if (expStatus.expired && session) {
        setAccessState({ authenticated: false, reason: 'session_expired' });
        setLoading(false);
        return;
      }

      // Check Firebase auth + admin role
      const response = await base44.functions.invoke('getAdminAccessState', {});

      if (response.data?.is_admin) {
        setAccessState({ authenticated: true, is_admin: true });
      } else {
        setAccessState({ authenticated: false, reason: 'not_admin' });
      }
    } catch {
      setAccessState({ authenticated: false, reason: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!accessState?.authenticated || !accessState?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}