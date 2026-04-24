import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';
import { getAdminDashboardDataSafe } from '@/lib/adminService';
import {
  BarChart3, Users, Briefcase, FileText, Building2,
  TrendingUp, Activity, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { userProfile } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats-reports'],
    queryFn: () => getAdminDashboardDataSafe(userProfile),
    enabled: !!userProfile && userProfile.role === 'platform_admin',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAr ? "التقارير والإحصائيات" : "Reports & Analytics"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "نظرة شاملة على أداء المنصة والنمو" : "Platform performance and growth overview"}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <Activity className="w-4 h-4" />
          {isAr ? "تحديث البيانات" : "Refresh Data"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title={isAr ? "إجمالي المستخدمين" : "Total Users"}
              value={stats?.totalUsers || 0}
              icon={Users}
              color="blue"
            />
            <ReportCard
              title={isAr ? "الوظائف المنشورة" : "Published Jobs"}
              value={stats?.publishedJobs || 0}
              icon={Briefcase}
              color="amber"
            />
            <ReportCard
              title={isAr ? "الطلبات المقدمة" : "Total Applications"}
              value={stats?.totalApplications || 0}
              icon={FileText}
              color="green"
            />
            <ReportCard
              title={isAr ? "الشركات النشطة" : "Active Companies"}
              value={stats?.activeOrganizations || 0}
              icon={Building2}
              color="purple"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-accent" />
                {isAr ? "تركيبة المستخدمين" : "User Demographics"}
              </h2>
              <div className="space-y-4">
                <DemographicBar label={isAr ? "الباحثون عن عمل" : "Candidates"} value={stats?.totalCandidates} total={stats?.totalUsers} color="bg-blue-500" />
                <DemographicBar label={isAr ? "أصحاب العمل" : "Employers"} value={stats?.totalEmployers} total={stats?.totalUsers} color="bg-amber-500" />
                <DemographicBar label={isAr ? "المشرفون" : "Admins"} value={stats?.totalAdmins} total={stats?.totalUsers} color="bg-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                {isAr ? "معدلات التحويل والنشاط" : "Conversion & Activity"}
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{isAr ? "متوسط الطلبات للوظيفة الواحدة" : "Avg. Applications per Job"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? "مؤشر جاذبية الوظائف" : "Indicator of job attractiveness"}
                    </p>
                  </div>
                  <div className="text-xl font-bold bg-secondary/50 px-3 py-1 rounded-lg">
                    {stats?.publishedJobs ? (stats.totalApplications / stats.publishedJobs).toFixed(1) : 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{isAr ? "معدل نشر الشركات" : "Company Posting Rate"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? "متوسط الوظائف لكل شركة" : "Average jobs per company"}
                    </p>
                  </div>
                  <div className="text-xl font-bold bg-secondary/50 px-3 py-1 rounded-lg">
                    {stats?.totalOrganizations ? (stats.totalJobs / stats.totalOrganizations).toFixed(1) : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DemographicBar({ label, value = 0, total = 0, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value} ({percentage}%)</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
