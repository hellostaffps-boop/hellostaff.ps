import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, Trash2, FlaskConical, CheckCircle2, Loader2, RefreshCw, Users, Briefcase, FileText, Building2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { seedDemoData, clearDemoData, getDemoDataStatus } from "@/lib/adminService";
import { toast } from "sonner";

function StatBadge({ icon: Icon, label, count, color = "bg-blue-50 text-blue-700 border-blue-200" }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
      <span className="ms-auto font-bold">{count}</span>
    </div>
  );
}

export default function DemoTools() {
  const { lang } = useLanguage();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const isAr = lang === "ar";
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["demo-data-status"],
    queryFn: () => getDemoDataStatus(userProfile),
    enabled: !!userProfile,
  });

  const hasDemoData = (status?.total || 0) > 0;

  const seedMutation = useMutation({
    mutationFn: () => seedDemoData(userProfile),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["demo-data-status"] });
      toast.success(
        isAr
          ? `✅ تم إنشاء البيانات التجريبية! (${result.orgs} منشأة، ${result.jobs} وظيفة، ${result.applications} طلب)`
          : `✅ Demo data created! (${result.orgs} orgs, ${result.jobs} jobs, ${result.applications} apps)`
      );
    },
    onError: (err) => {
      toast.error((isAr ? "فشل الإنشاء: " : "Seed failed: ") + err.message);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearDemoData(userProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-data-status"] });
      setConfirmClear(false);
      toast.success(isAr ? "✅ تم حذف جميع البيانات التجريبية بنجاح" : "✅ All demo data cleared successfully");
    },
    onError: (err) => {
      toast.error((isAr ? "فشل الحذف: " : "Clear failed: ") + err.message);
    },
  });

  const isSeeding = seedMutation.isPending;
  const isClearing = clearMutation.isPending;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{isAr ? "أدوات البيانات التجريبية" : "Demo Data Tools"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "إنشاء وحذف بيانات تجريبية لاختبار المنصة" : "Seed and remove demo data for platform testing"}</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">{isAr ? "تحذير: بيانات تجريبية مؤقتة" : "Warning: Temporary Demo Data"}</p>
          <p>{isAr ? "جميع السجلات مُعلَّمة بـ is_demo=true وتحمل demo_batch_id لسهولة الحذف لاحقاً. لا تنشر التطبيق أمام مستخدمين حقيقيين أثناء وجود هذه البيانات." : "All records are tagged with is_demo=true for easy removal. Do not expose to real users while demo data exists."}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">{isAr ? "حالة البيانات التجريبية" : "Demo Data Status"}</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["demo-data-status"] })}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={isAr ? "تحديث" : "Refresh"}
          >
            <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : hasDemoData ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {isAr ? `${status.total} سجل تجريبي موجود في النظام` : `${status.total} demo records exist in the system`}
              </span>
            </div>
            <StatBadge icon={Building2} label={isAr ? "المنشآت" : "Organizations"} count={status.orgs} color="bg-purple-50 text-purple-700 border-purple-200" />
            <StatBadge icon={Briefcase} label={isAr ? "الوظائف" : "Jobs"} count={status.jobs} color="bg-blue-50 text-blue-700 border-blue-200" />
            <StatBadge icon={FileText} label={isAr ? "الطلبات" : "Applications"} count={status.applications} color="bg-green-50 text-green-700 border-green-200" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Database className="w-4 h-4" />
            {isAr ? "لا توجد بيانات تجريبية حالياً في النظام." : "No demo data currently exists in the system."}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seed */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">{isAr ? "إنشاء بيانات تجريبية" : "Generate Demo Data"}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "ينشئ 4 منشآت، 16 وظيفة، و20 طلباً تجريبياً بحالات مختلفة."
              : "Creates 4 organizations, 16 jobs, and 20 applications with various statuses."}
          </p>
          <Button
            className="w-full"
            onClick={() => seedMutation.mutate()}
            disabled={isSeeding || hasDemoData}
          >
            {isSeeding ? (
              <><Loader2 className="w-4 h-4 me-2 animate-spin" />{isAr ? "جاري الإنشاء..." : "Seeding..."}</>
            ) : hasDemoData ? (
              <><CheckCircle2 className="w-4 h-4 me-2" />{isAr ? "البيانات موجودة مسبقاً" : "Data already exists"}</>
            ) : (
              <><Database className="w-4 h-4 me-2" />{isAr ? "إنشاء البيانات التجريبية" : "Seed Demo Data"}</>
            )}
          </Button>
          {hasDemoData && (
            <p className="text-[11px] text-muted-foreground text-center">
              {isAr ? "احذف البيانات الحالية أولاً لإنشاء دفعة جديدة" : "Clear existing data first to seed a new batch"}
            </p>
          )}
        </div>

        {/* Clear */}
        <div className={`bg-card border border-border rounded-xl p-5 space-y-3 ${!hasDemoData ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-sm">{isAr ? "حذف البيانات التجريبية" : "Clear Demo Data"}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "يحذف جميع السجلات التجريبية المُعلَّمة من المنشآت والوظائف والطلبات."
              : "Removes all demo-tagged organizations, jobs, and applications permanently."}
          </p>

          {!confirmClear ? (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/5"
              onClick={() => setConfirmClear(true)}
              disabled={!hasDemoData || isClearing}
            >
              <Trash2 className="w-4 h-4 me-2" />
              {isAr ? "حذف البيانات التجريبية" : "Clear Demo Data"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-destructive text-center">
                {isAr ? "⚠️ هل أنت متأكد؟ لا يمكن التراجع!" : "⚠️ Sure? This cannot be undone!"}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmClear(false)}
                  disabled={isClearing}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => clearMutation.mutate()}
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    isAr ? "تأكيد الحذف" : "Confirm"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo accounts info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{isAr ? "معلومات الحسابات التجريبية" : "Demo Account Details"}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {isAr
            ? "هذه الوظائف والمنشآت ستكون مرتبطة بأصحاب عمل تجريبيين. المرشحون التجريبيون هم مجرد بريد إلكتروني مدرج في الطلبات دون حسابات Auth."
            : "Demo jobs & orgs are linked to dummy employer emails. Demo candidates appear only in applications without real Auth accounts."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="font-semibold mb-2 text-muted-foreground">{isAr ? "مرشحون تجريبيون" : "Demo Candidates"}</p>
            {["demo.yousuf@hellostafftest.com","demo.maryam@hellostafftest.com","demo.ahmad@hellostafftest.com","demo.sara@hellostafftest.com","demo.khaled@hellostafftest.com"].map(e => (
              <p key={e} className="text-muted-foreground font-mono">{e}</p>
            ))}
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="font-semibold mb-2 text-muted-foreground">{isAr ? "أصحاب عمل تجريبيون" : "Demo Employers"}</p>
            {["demo.org1@hellostafftest.com","demo.org2@hellostafftest.com","demo.org3@hellostafftest.com","demo.org4@hellostafftest.com"].map(e => (
              <p key={e} className="text-muted-foreground font-mono">{e}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}