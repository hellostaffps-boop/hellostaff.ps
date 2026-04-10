import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { updateLastActivity, getAdminToken } from '@/lib/adminSessionManager';
import PageHeader from '@/components/PageHeader';
import { Users, Building2, Briefcase, FileText, AlertCircle, BarChart3, Lock, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

export default function AdminDashboard() {
  const { lang, t } = useLanguage();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const ar = lang === 'ar';

  useEffect(() => {
    // Update activity on every interaction
    const handleActivity = () => updateLastActivity();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const token = getAdminToken();
      const response = await base44.functions.invoke('getAuditLogs', { session_token: token });
      setAuditLogs(response.data?.logs || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminStats = [
    { icon: Users, label: ar ? 'جميع المستخدمين' : 'Total Users', value: '—' },
    { icon: Building2, label: ar ? 'المنظمات' : 'Organizations', value: '—' },
    { icon: Briefcase, label: ar ? 'الوظائف' : 'Jobs', value: '—' },
    { icon: FileText, label: ar ? 'الطلبات' : 'Applications', value: '—' },
  ];

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <PageHeader
        title={ar ? 'لوحة تحكم Super Admin' : 'Super Admin Dashboard'}
        description={ar ? 'إدارة المنصة الكاملة' : 'Complete platform management'}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {adminStats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Admin Sections */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-lg mb-4">
            {ar ? 'الإجراءات' : 'Actions'}
          </h2>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-secondary/50 text-muted-foreground text-sm">
              {ar ? 'إدارة المستخدمين' : 'User Management'}
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-muted-foreground text-sm">
              {ar ? 'إدارة المنظمات' : 'Organization Management'}
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-muted-foreground text-sm">
              {ar ? 'الإجراءات الحساسة' : 'Sensitive Actions'}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {ar ? 'جلسة الإدارة' : 'Admin Session'}
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">{ar ? 'الحالة: ' : 'Status: '}</span>
              <span className="text-green-600 font-medium">{ar ? 'نشط' : 'Active'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{ar ? 'المهلة الزمنية: ' : 'Timeout: '}</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ar ? '30 دقيقة' : '30 minutes'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-lg mb-4">
          {ar ? 'سجل الأحداث الأخير' : 'Recent Audit Log'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {ar ? 'لا توجد سجلات بعد' : 'No audit logs yet'}
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{log.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.actor_email} · {new Date(log.created_date).toLocaleString()}
                  </div>
                  {log.payload_summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {log.payload_summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}