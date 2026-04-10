import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import {
  updateLastActivity, getAdminToken, getAdminSession,
  clearAdminSession, getSessionExpirationStatus
} from '@/lib/adminSessionManager';
import {
  Users, Building2, Briefcase, FileText, AlertCircle,
  CheckCircle, Clock, LogOut, RefreshCw, ChevronRight,
  ShieldAlert, BarChart3, Settings, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIMEOUT_MINUTES = 30;

function StatCard({ icon: Icon, label, value, sub, color = 'primary', loading }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          color === 'amber' ? 'bg-amber-100' :
          color === 'green' ? 'bg-green-100' :
          color === 'blue' ? 'bg-blue-100' :
          color === 'red' ? 'bg-red-100' : 'bg-secondary'
        }`}>
          <Icon className={`w-3.5 h-3.5 ${
            color === 'amber' ? 'text-amber-600' :
            color === 'green' ? 'text-green-600' :
            color === 'blue' ? 'text-blue-600' :
            color === 'red' ? 'text-red-600' : 'text-muted-foreground'
          }`} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-secondary rounded animate-pulse" />
      ) : (
        <div className="text-2xl font-bold">{value ?? 0}</div>
      )}
      {sub && !loading && (
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      )}
    </div>
  );
}

const ACTION_CARDS = (ar) => [
  { label: ar ? 'إدارة المستخدمين' : 'Manage Users', icon: Users, path: '/admin/users', color: 'blue' },
  { label: ar ? 'إدارة المنظمات' : 'Organizations', icon: Building2, path: '/admin/organizations', color: 'green' },
  { label: ar ? 'إشراف الوظائف' : 'Jobs & Applications', icon: Briefcase, path: '/admin/jobs', color: 'amber' },
  { label: ar ? 'سجل الأحداث' : 'Audit Logs', icon: BarChart3, path: '/admin/audit', color: 'default' },
];

const ACTION_LABEL = {
  admin_password_validation_success: { ar: 'دخول ناجح', en: 'Login Success' },
  admin_password_validation_failure: { ar: 'محاولة دخول فاشلة', en: 'Failed Login' },
  admin_dashboard_access: { ar: 'دخول لوحة التحكم', en: 'Dashboard Access' },
  admin_bootstrap_role_assigned: { ar: 'تعيين دور المشرف', en: 'Admin Role Assigned' },
};

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState({ remaining: TIMEOUT_MINUTES, warning: false });
  const [now, setNow] = useState(Date.now());

  // Activity tracking
  useEffect(() => {
    const handle = () => updateLastActivity();
    window.addEventListener('click', handle);
    window.addEventListener('keydown', handle);
    return () => { window.removeEventListener('click', handle); window.removeEventListener('keydown', handle); };
  }, []);

  // Session countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      const exp = getSessionExpirationStatus(TIMEOUT_MINUTES);
      if (exp.expired) { handleLogout(); return; }
      const remaining = Math.max(0, TIMEOUT_MINUTES - (exp.elapsed_minutes || 0));
      setSessionInfo({ remaining, warning: remaining <= 5 });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    const token = getAdminToken();
    setMetricsLoading(true);
    setAuditLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        base44.functions.invoke('getAdminMetrics', { session_token: token }),
        base44.functions.invoke('getAuditLogs', { session_token: token }),
      ]);
      setMetrics(mRes.data);
      setAuditLogs(aRes.data?.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMetricsLoading(false);
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin');
  };

  const session = getAdminSession();

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{ar ? 'لوحة تحكم المشرف' : 'Super Admin Dashboard'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ar ? 'مركز إدارة المنصة' : 'Platform command center'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ar ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ar ? 'إنهاء الجلسة' : 'End Session'}</span>
          </Button>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label={ar ? 'إجمالي المستخدمين' : 'Total Users'} value={metrics?.totalUsers} loading={metricsLoading} color="blue" sub={metrics ? `${metrics.totalCandidates ?? 0} ${ar ? 'مرشح' : 'candidates'} · ${metrics.totalEmployers ?? 0} ${ar ? 'صاحب عمل' : 'employers'}` : null} />
        <StatCard icon={Building2} label={ar ? 'المنظمات' : 'Organizations'} value={metrics?.totalOrganizations} loading={metricsLoading} color="green" sub={metrics ? `${metrics.verifiedOrganizations ?? 0} ${ar ? 'موثقة' : 'verified'}` : null} />
        <StatCard icon={Briefcase} label={ar ? 'الوظائف' : 'Jobs'} value={metrics?.totalJobs} loading={metricsLoading} color="amber" sub={metrics ? `${metrics.publishedJobs ?? 0} ${ar ? 'منشورة' : 'published'}` : null} />
        <StatCard icon={FileText} label={ar ? 'الطلبات' : 'Applications'} value={metrics?.totalApplications} loading={metricsLoading} sub={metrics ? `${metrics.pendingApplications ?? 0} ${ar ? 'معلقة' : 'pending'}` : null} />
      </div>

      {/* Secondary stats row */}
      {metrics && !metricsLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label={ar ? 'المرشحون النشطون' : 'Candidates'} value={metrics.totalCandidates} color="blue" />
          <StatCard icon={Building2} label={ar ? 'منظمات معلقة' : 'Pending Orgs'} value={metrics.pendingOrganizations} color={metrics.pendingOrganizations > 0 ? 'amber' : 'default'} />
          <StatCard icon={Briefcase} label={ar ? 'وظائف مسودة' : 'Draft Jobs'} value={metrics.draftJobs} />
          <StatCard icon={Briefcase} label={ar ? 'وظائف مغلقة' : 'Closed Jobs'} value={metrics.closedJobs} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Action cards */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-sm mb-3">{ar ? 'أدوات الإدارة' : 'Admin Tools'}</h2>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_CARDS(ar).map(({ label, icon: Icon, path, color }) => (
              <Link key={path} to={path}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 hover:border-accent/30 transition-all cursor-pointer group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' :
                    color === 'amber' ? 'bg-amber-100' : 'bg-secondary'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' :
                      color === 'amber' ? 'text-amber-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ${ar ? 'rotate-180' : ''}`} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Session panel */}
        <div className={`bg-card rounded-xl border p-4 ${sessionInfo.warning ? 'border-amber-300 bg-amber-50/30' : 'border-border'}`}>
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            {sessionInfo.warning
              ? <ShieldAlert className="w-4 h-4 text-amber-500" />
              : <CheckCircle className="w-4 h-4 text-green-500" />}
            {ar ? 'الجلسة الحالية' : 'Current Session'}
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{ar ? 'الحالة' : 'Status'}</span>
              <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${sessionInfo.warning ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {sessionInfo.warning ? (ar ? 'تحذير' : 'Warning') : (ar ? 'نشط' : 'Active')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{ar ? 'الوقت المتبقي' : 'Remaining'}</span>
              <span className={`font-bold ${sessionInfo.warning ? 'text-amber-600' : ''}`}>{sessionInfo.remaining}{ar ? ' د' : 'm'}</span>
            </div>
            {session?.started_at && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{ar ? 'بدأت' : 'Started'}</span>
                <span className="text-xs">{new Date(session.started_at).toLocaleTimeString(ar ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {sessionInfo.warning && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-1">
                {ar ? 'ستنتهي الجلسة قريباً. تفاعل مع الصفحة لتجديدها.' : 'Session expiring soon. Interact to renew.'}
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full mt-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5 me-1.5" />
              {ar ? 'إنهاء الجلسة' : 'End Session'}
            </Button>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">{ar ? 'سجل الأحداث الأخيرة' : 'Recent Audit Events'}</h2>
          <span className="text-xs text-muted-foreground">{auditLogs.length} {ar ? 'حدث' : 'events'}</span>
        </div>
        {auditLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{ar ? 'لا توجد أحداث مسجلة بعد' : 'No audit events yet'}</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {auditLogs.slice(0, 20).map((log) => {
              const label = ACTION_LABEL[log.action];
              const isFailure = log.status === 'failure';
              return (
                <div key={log.id} className={`flex items-start gap-3 p-2.5 rounded-lg text-xs ${isFailure ? 'bg-red-50 border border-red-100' : 'bg-secondary/30 border border-border/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isFailure ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{label ? label[ar ? 'ar' : 'en'] : log.action}</div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                      {log.actor_email && <span>{log.actor_email}</span>}
                      <span>{new Date(log.created_date).toLocaleString(ar ? 'ar-SA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${isFailure ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {isFailure ? (ar ? 'فشل' : 'Failed') : (ar ? 'نجح' : 'OK')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}