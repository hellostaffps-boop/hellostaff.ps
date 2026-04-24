import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';

/**
 * AdminLogin — Uses Supabase email/password login.
 * After login, ProtectedRoute checks role === 'platform_admin'.
 */
export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const { lang } = useLanguage();
  const { signInEmail, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  useEffect(() => {
    if (!authLoading && userProfile?.role === 'platform_admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authLoading, userProfile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { profile } = await signInEmail(email, password);
      if (!profile || profile.role !== 'platform_admin') {
        setError(ar ? 'ليس لديك صلاحيات الوصول للوحة الإدارة' : 'You do not have admin access');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(ar ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
          <h1 className="text-2xl font-bold mb-2">Super Admin</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {ar ? 'تسجيل الدخول للوحة الإدارة' : 'Login to admin dashboard'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                {ar ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ar ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                disabled={loading}
                required
              />
            </div>
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
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || !email || !password} className="w-full">
              {loading
                ? ar ? 'جاري التحقق...' : 'Verifying...'
                : ar ? 'الدخول' : 'Login'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {ar
              ? 'الوصول متاح فقط لحسابات platform_admin.'
              : 'Access restricted to platform_admin accounts only.'}
          </p>
        </div>
      </div>
    </div>
  );
}