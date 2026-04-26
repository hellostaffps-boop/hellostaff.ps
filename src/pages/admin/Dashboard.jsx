import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';
import { getAdminDashboardDataSafe, getAuditLogsSafe } from '@/lib/adminService';
import {
  Users, Building2, Briefcase, FileText, AlertCircle,
  CheckCircle, LogOut, RefreshCw, ChevronRight, BarChart3, Send,
  TrendingUp, CreditCard, Award, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

// ─── Sparkline Bar Chart ─────────────────────────────────────────────────────
function MiniBarChart({ data = [], color = "bg-primary" }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-80 transition-all`}
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'primary', loading, trend, sparkData, sparkColor }) {
  const colorMap = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-100', spark: 'bg-amber-400' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-100', spark: 'bg-green-400' },
    blue:  { bg: 'bg-blue-100',  text: 'text-blue-600',  border: 'border-blue-100',  spark: 'bg-blue-400' },
    red:   { bg: 'bg-red-100',   text: 'text-red-600',   border: 'border-red-100',   spark: 'bg-red-400' },
    purple:{ bg: 'bg-purple-100',text: 'text-purple-600',border: 'border-purple-100',spark: 'bg-purple-400' },
  };
  const c = colorMap[color] || { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border', spark: 'bg-primary' };

  return (
    <div className={`bg-card rounded-xl border ${c.border} p-4 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${c.text}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-secondary rounded animate-pulse" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value ?? 0}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          {trend !== undefined && (
            <div className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {trend >= 0 ? '+' : ''}{trend}% هذا الأسبوع
            </div>
          )}
          {sparkData && (
            <div className="mt-2">
              <MiniBarChart data={sparkData} color={sparkColor || c.spark} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const ACTION_CARDS = (ar) => [
  { label: ar ? 'إدارة المستخدمين' : 'Manage Users', icon: Users, path: '/admin/users', color: 'blue' },
  { label: ar ? 'إدارة المنظمات' : 'Organizations', icon: Building2, path: '/admin/organizations', color: 'green' },
  { label: ar ? 'إشراف الوظائف' : 'Jobs & Applications', icon: Briefcase, path: '/admin/jobs', color: 'amber' },
  { label: ar ? 'رسالة جماعية' : 'Broadcast', icon: Send, path: '/admin/broadcast', color: 'blue' },
  { label: ar ? 'إدارة الاشتراكات' : 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions', color: 'purple' },
  { label: ar ? 'الشارات والمؤهلات' : 'Badges', icon: Award, path: '/admin/badges', color: 'amber' },
];

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const ar = lang === 'ar';

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState(null);

  const loadData = useCallback(async () => {
    if (!userProfile) return;
    setMetricsLoading(true);
    setAuditLoading(true);
    try {
      const [metricsData, logsData] = await Promise.all([
        getAdminDashboardDataSafe(userProfile),
        getAuditLogsSafe(userProfile, 20),
      ]);
      setMetrics(metricsData);
      setAuditLogs(logsData);

      // Fetch weekly registrations for sparkline
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const from = d.toISOString().split('T')[0];
        const to = new Date(d.getTime() + 86400000).toISOString().split('T')[0];
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', from)
          .lt('created_at', to);
        days.push(count || 0);
      }
      setWeeklyStats(days);
    } catch (e) {
      console.error('[AdminDashboard]', e);
    } finally {
      setMetricsLoading(false);
      setAuditLoading(false);
    }
  }, [userProfile]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  // Subscription stats derived from metrics
  const activeSubs = metrics?.activeSubscriptions ?? 0;
  const totalRevenue = metrics?.totalRevenue ?? 0;

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{ar ? 'لوحة تحكم المشرف' : 'Super Admin Dashboard'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ar ? 'مركز إدارة المنصة — نظرة عامة حية' : 'Platform command center — live overview'}</p>
          {userProfile?.email && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {userProfile.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ar ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ar ? 'خروج' : 'Sign Out'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats — Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard icon={Users} label={ar ? 'إجمالي المستخدمين' : 'Total Users'} value={metrics?.totalUsers}
          loading={metricsLoading} color="blue"
          sub={metrics ? `${metrics.totalCandidates ?? 0} ${ar ? 'مرشح' : 'candidates'} · ${metrics.totalEmployers ?? 0} ${ar ? 'صاحب عمل' : 'employers'}` : null}
          sparkData={weeklyStats} sparkColor="bg-blue-400"
        />
        <StatCard icon={Building2} label={ar ? 'المنظمات' : 'Organizations'} value={metrics?.totalOrganizations}
          loading={metricsLoading} color="green"
          sub={metrics ? `${metrics.activeOrganizations ?? 0} ${ar ? 'نشطة' : 'active'}` : null}
        />
        <StatCard icon={Briefcase} label={ar ? 'الوظائف' : 'Jobs'} value={metrics?.totalJobs}
          loading={metricsLoading} color="amber"
          sub={metrics ? `${metrics.publishedJobs ?? 0} ${ar ? 'منشورة' : 'published'}` : null}
        />
        <StatCard icon={FileText} label={ar ? 'الطلبات' : 'Applications'} value={metrics?.totalApplications}
          loading={metricsLoading}
        />
      </div>

      {/* KPI Stats — Row 2 (SaaS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={CreditCard} label={ar ? 'اشتراكات فعالة' : 'Active Subscriptions'} value={activeSubs}
          loading={metricsLoading} color="purple"
          sub={ar ? 'خطط شهرية وسنوية' : 'Monthly & annual plans'}
        />
        <StatCard icon={Zap} label={ar ? 'إجمالي الإيرادات' : 'Total Revenue'} value={totalRevenue ? `${totalRevenue} ₪` : '—'}
          loading={metricsLoading} color="green"
          sub={ar ? 'من الاشتراكات المدفوعة' : 'From paid subscriptions'}
        />
        <StatCard icon={TrendingUp} label={ar ? 'تسجيلات هذا الأسبوع' : 'This Week Signups'} value={weeklyStats ? weeklyStats.reduce((a, b) => a + b, 0) : '—'}
          loading={metricsLoading || !weeklyStats} color="blue"
          sub={ar ? 'آخر 7 أيام' : 'Last 7 days'}
          sparkData={weeklyStats}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Action cards */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-sm mb-3">{ar ? 'أدوات الإدارة' : 'Admin Tools'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACTION_CARDS(ar).map(({ label, icon: Icon, path, color }) => {
              const colorMap = {
                blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                green: { bg: 'bg-green-100', text: 'text-green-600' },
                amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
                purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
              };
              const c = colorMap[color] || { bg: 'bg-secondary', text: 'text-muted-foreground' };
              return (
                <Link key={path} to={path}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 hover:border-accent/30 transition-all cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
                      <Icon className={`w-4 h-4 ${c.text}`} />
                    </div>
                    <span className="text-sm font-medium flex-1">{label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ${ar ? 'rotate-180' : ''}`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-sm mb-1">{ar ? 'التسجيلات — آخر 7 أيام' : 'Signups — Last 7 Days'}</h2>
          <p className="text-xs text-muted-foreground mb-4">{ar ? 'عدد المستخدمين الجدد يومياً' : 'Daily new user registrations'}</p>
          {weeklyStats ? (
            <div className="flex items-end gap-1 h-24">
              {weeklyStats.map((v, i) => {
                const max = Math.max(...weeklyStats, 1);
                const days_ar = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
                const days_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dayLabel = (ar ? days_ar : days_en)[d.getDay()];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-primary/70 transition-all hover:bg-primary"
                      style={{ height: `${Math.max(4, (v / max) * 80)}px` }}
                      title={`${v} ${ar ? 'مستخدم' : 'users'}`}
                    />
                    <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 bg-secondary/40 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">{ar ? 'سجل الأحداث الأخيرة' : 'Recent Audit Events'}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{auditLogs.length} {ar ? 'حدث' : 'events'}</span>
            <Link to="/admin/logs" className="text-xs text-accent hover:underline">{ar ? 'عرض الكل' : 'View all'}</Link>
          </div>
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
            {auditLogs.map((log) => {
              const isFailure = log.status === 'failed';
              return (
                <div key={log.id} className={`flex items-start gap-3 p-2.5 rounded-lg text-xs ${isFailure ? 'bg-red-50 border border-red-100' : 'bg-secondary/30 border border-border/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isFailure ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                      {log.actor_email && <span>{log.actor_email}</span>}
                      <span>{new Date(log.created_at).toLocaleString(ar ? 'ar-SA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>
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