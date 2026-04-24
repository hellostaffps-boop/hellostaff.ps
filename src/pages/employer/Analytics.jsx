import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Eye, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/supabaseAuth";
import { getApplicationsByOrg } from "@/lib/supabaseService";

export default function Analytics() {
  const { lang: language } = useLanguage();
  const { user } = useAuth();
  const { isSubscribed, isPremium } = useSubscription();
  const isAr = language === "ar";

  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications-analytics", user?.email],
    queryFn: async () => {
      // In a real app, we'd fetch actual metrics. For now, we use application count.
      return []; 
    },
    enabled: !!user && isSubscribed,
  });

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      <PageHeader 
        title={isAr ? "تحليلات التوظيف" : "Hiring Analytics"} 
        description={isAr ? "تابع أداء وظائفك ومعدل استجابة المرشحين." : "Track your job performance and candidate engagement."}
      />

      {!isSubscribed ? (
        <div className="relative">
          {/* Blur Overlay for Free Users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 pointer-events-none select-none">
            <MetricCard label={isAr ? "مشاهدات الوظائف" : "Job Views"} value="1,240" icon={Eye} />
            <MetricCard label={isAr ? "معدل التقديم" : "Application Rate"} value="12.5%" icon={TrendingUp} />
            <MetricCard label={isAr ? "وقت التوظيف" : "Time to Hire"} value="8 days" icon={Users} />
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-card/95 border border-border p-8 rounded-3xl shadow-2xl max-w-md text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {isAr ? "خاصية بريميوم فقط" : "Premium Feature Only"}
              </h2>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                {isAr 
                  ? "احصل على رؤية كاملة لأداء وظائفك. اعرف عدد الأشخاص الذين شاهدوا إعلانك، ومن أين أتوا، وكيف يمكنك تحسين نتائجك." 
                  : "Get full visibility into your hiring performance. See how many people viewed your jobs, where they came from, and how to optimize your results."}
              </p>
              <Link to="/employer/pricing">
                <Button className="w-full h-12 gap-2 text-base bg-amber-600 hover:bg-amber-700">
                  {isAr ? "اشترك الآن للفتح" : "Subscribe to Unlock"}
                  <ArrowRight className={`w-5 h-5 ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard label={isAr ? "مشاهدات الوظائف" : "Job Views"} value="428" icon={Eye} trend="+12%" />
            <MetricCard label={isAr ? "معدل التقديم" : "Application Rate"} value="8.4%" icon={TrendingUp} trend="+2%" />
            <MetricCard label={isAr ? "مرشحين موثقين" : "Verified Candidates"} value="12" icon={ShieldCheck} />
          </div>

          <div className="bg-white rounded-3xl border border-border p-8 text-center">
             <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-accent" />
             </div>
             <h3 className="text-lg font-bold mb-2">
                {isAr ? "قريباً: تحليلات تفصيلية" : "Coming Soon: Detailed Analytics"}
             </h3>
             <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {isAr 
                  ? "نحن نعمل على بناء لوحة تحكم متقدمة تظهر لك مصادر المرشحين وأوقات الذروة للتقديم." 
                  : "We are building an advanced dashboard showing candidate sources and peak application times."}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
