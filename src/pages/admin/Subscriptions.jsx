import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, CreditCard, Loader2, Search, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getAllSubscriptions, activateSubscription, cancelSubscription, PLANS } from "@/lib/subscriptionService";

const STATUS_STYLES = {
  pending: { icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  active: { icon: CheckCircle2, color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  expired: { icon: XCircle, color: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400" },
  cancelled: { icon: XCircle, color: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-400" },
};

export default function AdminSubscriptions() {
  const { lang } = useLanguage();
  const { userProfile } = useAuth();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: getAllSubscriptions,
    enabled: userProfile?.role === "platform_admin",
  });

  const activateMut = useMutation({
    mutationFn: (id) => activateSubscription(id, userProfile.email),
    onSuccess: () => {
      toast.success(isAr ? "تم تفعيل الاشتراك بنجاح!" : "Subscription activated!");
      queryClient.invalidateQueries(["admin-subscriptions"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMut = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success(isAr ? "تم إلغاء الاشتراك" : "Subscription cancelled");
      queryClient.invalidateQueries(["admin-subscriptions"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = subs.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search && !s.owner_email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: subs.length,
    pending: subs.filter(s => s.status === "pending").length,
    active: subs.filter(s => s.status === "active").length,
    expired: subs.filter(s => s.status === "expired").length,
    cancelled: subs.filter(s => s.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAr ? "إدارة الاشتراكات" : "Subscriptions Management"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "تفعيل وإدارة اشتراكات أصحاب العمل" : "Activate and manage employer subscriptions"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`p-3 rounded-xl border text-center transition-all ${
              filterStatus === key ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/30"
            }`}
          >
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {key === "all" ? (isAr ? "الكل" : "All") :
               key === "pending" ? (isAr ? "معلّق" : "Pending") :
               key === "active" ? (isAr ? "نشط" : "Active") :
               key === "expired" ? (isAr ? "منتهي" : "Expired") :
               (isAr ? "ملغي" : "Cancelled")}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? "بحث بالبريد الإلكتروني..." : "Search by email..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{isAr ? "لا توجد اشتراكات" : "No subscriptions found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const plan = PLANS[sub.plan];
            const st = STATUS_STYLES[sub.status] || STATUS_STYLES.pending;
            return (
              <div key={sub.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {sub.status}
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {isAr ? plan?.label_ar : plan?.label_en} — {plan?.price}₪
                      </span>
                    </div>
                    <p className="text-sm font-medium">{sub.owner_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr ? "تاريخ الطلب: " : "Requested: "}{new Date(sub.created_at).toLocaleDateString(isAr ? "ar" : "en")}
                      {sub.payment_reference && ` · ${isAr ? "مرجع: " : "Ref: "}${sub.payment_reference}`}
                    </p>
                    {sub.status === "active" && sub.expires_at && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {isAr ? "ينتهي: " : "Expires: "}{new Date(sub.expires_at).toLocaleDateString(isAr ? "ar" : "en")}
                        {` · ${isAr ? "وظائف: " : "Jobs: "}${sub.jobs_used}/${sub.jobs_limit === -1 ? "∞" : sub.jobs_limit}`}
                      </p>
                    )}
                    {sub.activated_by && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr ? "فُعّل بواسطة: " : "Activated by: "}{sub.activated_by}
                      </p>
                    )}
                    {sub.receipt_url && (
                      <a 
                        href={sub.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent font-medium mt-2 hover:underline bg-accent/5 px-2 py-1 rounded-md"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isAr ? "عرض وصل الدفع" : "View Payment Receipt"}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {sub.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => activateMut.mutate(sub.id)}
                          disabled={activateMut.isPending}
                          className="h-8 text-xs"
                        >
                          {activateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> {isAr ? "تفعيل" : "Activate"}</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelMut.mutate(sub.id)}
                          disabled={cancelMut.isPending}
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {isAr ? "رفض" : "Reject"}
                        </Button>
                      </>
                    )}
                    {sub.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMut.mutate(sub.id)}
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
