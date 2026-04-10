import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getAdminToken } from "@/lib/adminSessionManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, Trash2, RefreshCw, CheckCircle2, XCircle, Loader2, FlaskConical } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const COLLECTIONS_AR = {
  users: "المستخدمون",
  candidate_profiles: "ملفات المرشحين",
  employer_profiles: "ملفات أصحاب العمل",
  organizations: "المؤسسات",
  organization_members: "أعضاء المؤسسات",
  jobs: "الوظائف",
  applications: "الطلبات",
  application_notes: "الملاحظات الداخلية",
  application_evaluations: "التقييمات",
  notifications: "الإشعارات",
};

function StatusRow({ label, count }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={count > 0 ? "default" : "secondary"} className="min-w-[2rem] justify-center">
        {count}
      </Badge>
    </div>
  );
}

export default function DemoTools() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const token = getAdminToken();

  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error'|'warn', text }
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmForce, setConfirmForce] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setMessage(null);
    try {
      const res = await base44.functions.invoke("getDemoStatus", { session_token: token });
      setStatus(res.data);
    } catch (e) {
      setMessage({ type: "error", text: isAr ? `خطأ في جلب الحالة: ${e.message}` : `Status fetch error: ${e.message}` });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSeed = async (force = false) => {
    setSeeding(true);
    setMessage(null);
    setConfirmForce(false);
    try {
      const res = await base44.functions.invoke("seedDemoData", { session_token: token, force });
      const d = res.data;
      if (d.error === "DEMO_EXISTS") {
        setConfirmForce(true);
        setMessage({ type: "warn", text: isAr ? `توجد بيانات تجريبية بالفعل (${d.existing_batch_id}). هل تريد إنشاء دفعة جديدة؟` : `Demo data already exists (${d.existing_batch_id}). Create a new batch anyway?` });
      } else if (d.success) {
        setMessage({ type: "success", text: isAr ? `✓ تم إنشاء البيانات التجريبية بنجاح (${d.batch_id}). إجمالي: ${d.counts.total_writes} سجل.` : `✓ Demo data seeded successfully (${d.batch_id}). Total: ${d.counts.total_writes} records.` });
        await fetchStatus();
      } else {
        setMessage({ type: "error", text: d.error || (isAr ? "حدث خطأ" : "An error occurred") });
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setConfirmClear(false);
    setMessage(null);
    try {
      const res = await base44.functions.invoke("clearDemoData", { session_token: token });
      const d = res.data;
      if (d.success) {
        setMessage({ type: "success", text: isAr ? `✓ تم حذف ${d.deleted} سجل تجريبي بنجاح.` : `✓ Successfully deleted ${d.deleted} demo records.` });
        await fetchStatus();
      } else {
        setMessage({ type: "error", text: d.error || (isAr ? "فشل الحذف" : "Deletion failed") });
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{isAr ? "أدوات البيانات التجريبية" : "Demo Data Tools"}</h1>
          <p className="text-sm text-muted-foreground">{isAr ? "للاختبار والمراجعة فقط — لا تؤثر على البيانات الحقيقية" : "For testing & review only — does not affect real data"}</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">{isAr ? "تحذير: بيانات تجريبية مؤقتة" : "Warning: Temporary Demo Data"}</p>
          <p>{isAr ? "جميع السجلات مُعلَّمة بـ is_demo: true وتحمل demo_batch_id لسهولة الحذف لاحقاً. لا تنشر التطبيق أمام مستخدمين حقيقيين أثناء وجود هذه البيانات." : "All records are tagged with is_demo: true and a demo_batch_id for easy removal. Do not expose the app to real users while demo data exists."}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">{isAr ? "حالة البيانات التجريبية" : "Demo Data Status"}</h2>
          <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loadingStatus}>
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{isAr ? "جارٍ التحقق..." : "Checking..."}</span>
          </div>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {status.has_demo_data ? (
                <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="font-medium text-sm text-green-700">{isAr ? "توجد بيانات تجريبية" : "Demo data exists"}</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-muted-foreground" /><span className="font-medium text-sm text-muted-foreground">{isAr ? "لا توجد بيانات تجريبية" : "No demo data"}</span></>
              )}
            </div>
            {status.has_demo_data && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>{isAr ? "رقم الدفعة:" : "Batch ID:"} <span className="font-mono font-medium text-foreground">{status.batch_id}</span></div>
                {status.created_at && <div>{isAr ? "تاريخ الإنشاء:" : "Created:"} {new Date(status.created_at).toLocaleString(isAr ? "ar" : "en")}</div>}
                <div className="font-medium mt-1">{isAr ? `الإجمالي: ${status.total_records} سجل` : `Total: ${status.total_records} records`}</div>
              </div>
            )}
            {status.has_demo_data && (
              <div className="mt-3 pt-3 border-t border-border">
                {Object.entries(status.counts || {}).map(([col, count]) => (
                  <StatusRow key={col} label={COLLECTIONS_AR[col] || col} count={count} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{isAr ? "تعذر جلب الحالة" : "Could not fetch status"}</p>
        )}
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
          message.type === "warn" ? "bg-amber-50 border-amber-200 text-amber-800" :
          "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Force seed confirmation */}
      {confirmForce && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-orange-800">{isAr ? "هل أنت متأكد من إنشاء دفعة جديدة؟ ستُضاف إلى البيانات الموجودة." : "Are you sure you want to create a new batch? It will be added alongside existing demo data."}</p>
          <div className="flex gap-2">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleSeed(true)} disabled={seeding}>
              {isAr ? "نعم، أنشئ دفعة جديدة" : "Yes, create new batch"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setConfirmForce(false); setMessage(null); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      )}

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
              ? "ينشئ 16 مستخدماً، 4 مؤسسات، 18 وظيفة، 22 طلباً، ملاحظات، تقييمات وإشعارات."
              : "Creates 16 users, 4 organizations, 18 jobs, 22 applications, notes, evaluations & notifications."}
          </p>
          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={() => handleSeed(false)}
            disabled={seeding || clearing}
          >
            {seeding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isAr ? "جارٍ الإنشاء..." : "Seeding..."}</> : <><Database className="w-4 h-4 mr-2" />{isAr ? "إنشاء البيانات التجريبية" : "Generate Demo Data"}</>}
          </Button>
        </div>

        {/* Clear */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-sm">{isAr ? "حذف البيانات التجريبية" : "Clear Demo Data"}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "يحذف جميع السجلات المعلَّمة بـ is_demo: true. لن تُحذف أي بيانات حقيقية."
              : "Deletes all records tagged with is_demo: true. No real data will be affected."}
          </p>
          {!confirmClear ? (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmClear(true)}
              disabled={seeding || clearing || !status?.has_demo_data}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isAr ? "حذف البيانات التجريبية" : "Clear Demo Data"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-destructive">{isAr ? "هل أنت متأكد؟ لا يمكن التراجع." : "Are you sure? This cannot be undone."}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleClear} disabled={clearing}>
                  {clearing ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />{isAr ? "جارٍ الحذف..." : "Clearing..."}</> : (isAr ? "نعم، احذف" : "Yes, clear")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo accounts info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3">{isAr ? "معلومات الحسابات التجريبية" : "Demo Account Details"}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {isAr
            ? "الحسابات التجريبية موجودة فقط في Firestore وليس لها كلمات مرور حقيقية في Firebase Auth. يمكن الاطلاع على بياناتها من لوحة المشرف."
            : "Demo accounts exist in Firestore only and do not have real Firebase Auth passwords. View their data from the admin panel."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="font-semibold mb-1">{isAr ? "مرشحون (12)" : "Candidates (12)"}</p>
            <p className="text-muted-foreground">demo.yousuf@hellostafftest.com</p>
            <p className="text-muted-foreground">demo.maryam@hellostafftest.com</p>
            <p className="text-muted-foreground text-xs mt-1 italic">{isAr ? "...و10 آخرين" : "...and 10 more"}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="font-semibold mb-1">{isAr ? "أصحاب عمل (4)" : "Employers (4)"}</p>
            <p className="text-muted-foreground">demo.org1@hellostafftest.com</p>
            <p className="text-muted-foreground">demo.org2@hellostafftest.com</p>
            <p className="text-muted-foreground">demo.org3@hellostafftest.com</p>
            <p className="text-muted-foreground">demo.org4@hellostafftest.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}