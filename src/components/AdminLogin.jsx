import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { setAdminSession } from '@/lib/adminSessionManager';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticating, setAuthenticating] = useState(true);
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const ar = lang === 'ar';

  useEffect(() => {
    // Check if user is already admin
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await base44.functions.invoke('getAdminAccessState', {});
      if (response.data?.is_admin) {
        navigate('/admin/dashboard');
      }
    } catch {
      // User not authenticated or not admin
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate password via backend
      const validateResponse = await base44.functions.invoke('validateAdminPassword', {
        password,
      });

      if (!validateResponse.data?.success) {
        setError(ar ? 'كلمة مرور غير صحيحة' : 'Invalid password');
        setLoading(false);
        return;
      }

      // Bootstrap admin access
      const bootstrapResponse = await base44.functions.invoke('bootstrapAdminAccess', {});

      if (bootstrapResponse.data?.success) {
        // Set session
        setAdminSession({
          admin_id: validateResponse.data.user_id,
          admin_email: validateResponse.data.user_email,
        });

        // Navigate to dashboard
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(
        ar
          ? 'حدث خطأ. يرجى المحاولة لاحقا.'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background px-4 ${ar ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8">
          <h1 className="text-2xl font-bold mb-2">
            {ar ? 'Super Admin' : 'Super Admin'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ar ? 'أدخل كلمة المرور للدخول' : 'Enter password to access'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                {ar ? 'كلمة المرور' : 'Password'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={ar ? 'أدخل كلمة المرور' : 'Enter password'}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full"
            >
              {loading
                ? ar
                  ? 'جاري التحقق...'
                  : 'Verifying...'
                : ar
                  ? 'الدخول'
                  : 'Login'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {ar
              ? 'الوصول محمي بكلمة المرور. يتم التحقق الآمن من خلال الخادم.'
              : 'Access is password protected. Validation is secure server-side.'}
          </p>
        </div>
      </div>
    </div>
  );
}