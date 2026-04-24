import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Check, Crown, Zap, Building2, Copy, ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, ShieldCheck, TrendingUp, Upload, FileCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile, getOrganization } from "@/lib/supabaseService";
import { PLANS, getActiveSubscription, getOrgSubscriptions, createSubscriptionRequest, getPaymentSettings, uploadPaymentReceipt } from "@/lib/subscriptionService";

function PlanCard({ plan, isAr, isActive, isBest, onSelect, selected }) {
  const isPremium = plan.id === "premium";
  const isAnnual = plan.id === "annual";

  return (
    <div className={`relative bg-card rounded-2xl border-2 p-6 transition-all duration-300 ${
      selected === plan.id ? "border-accent shadow-lg scale-[1.02]" :
      isBest ? "border-accent/40 shadow-md" : "border-border hover:border-accent/30 hover:shadow-sm"
    }`}>
      {isBest && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
            {isAr ? "الأفضل قيمة" : "Best Value"}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
          isPremium ? "bg-amber-100" : isAnnual ? "bg-accent/10" : "bg-secondary"
        }`}>
          {isPremium ? <Crown className="w-6 h-6 text-amber-600" /> :
           isAnnual ? <Zap className="w-6 h-6 text-accent" /> :
           <Building2 className="w-6 h-6 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-bold">{isAr ? plan.label_ar : plan.label_en}</h3>
        <p className="text-xs text-muted-foreground mt-1">{isAr ? plan.desc_ar : plan.desc_en}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold">{plan.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">₪</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {plan.duration_days === 30 ? (isAr ? "/ شهر" : "/ month") : (isAr ? "/ سنة" : "/ year")}
        </p>
      </div>

      <ul className="space-y-2.5 mb-6">
        <Feature isAr={isAr} text={plan.jobs_limit === -1 ? (isAr ? "عدد غير محدود من الوظائف" : "Unlimited job posts") : `${plan.jobs_limit} ${isAr ? "وظيفة" : "job posts"}`} />
        <Feature isAr={isAr} text={isAr ? "إدارة الطلبات" : "Application management"} />
        <Feature isAr={isAr} text={isAr ? "رسائل مع المرشحين" : "Candidate messaging"} />
        <Feature isAr={isAr} text={isAr ? "جدولة المقابلات" : "Interview scheduling"} />
        {(isAnnual || isPremium) && <Feature isAr={isAr} text={isAr ? "ملف شركة مميز" : "Featured company profile"} accent />}
        {isPremium && <Feature isAr={isAr} text={isAr ? "دعم فني أولوي" : "Priority support"} accent />}
        {isPremium && <Feature isAr={isAr} text={isAr ? "تحليلات متقدمة" : "Advanced analytics"} accent />}
      </ul>

      {isActive ? (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200">
          <CheckCircle2 className="w-4 h-4" />
          {isAr ? "اشتراكك الحالي" : "Current Plan"}
        </div>
      ) : (
        <Button
          onClick={() => onSelect(plan.id)}
          className={`w-full h-11 ${selected === plan.id ? "bg-accent hover:bg-accent/90" : ""}`}
          variant={selected === plan.id ? "default" : "outline"}
        >
          {isAr ? "اختيار الخطة" : "Choose Plan"}
        </Button>
      )}
    </div>
  );
}

function Feature({ text, accent }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className={`w-4 h-4 flex-shrink-0 ${accent ? "text-accent" : "text-green-500"}`} />
      <span className={accent ? "text-foreground font-medium" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}

export default function Pricing() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planFromUrl = params.get("plan");
    if (planFromUrl && PLANS[planFromUrl]) {
      setSelectedPlan(planFromUrl);
      setShowPayment(true);
    }
  }, [location.search]);

  const { data: profile } = useQuery({
    queryKey: ["employer-profile", user?.email],
    queryFn: () => getEmployerProfile(user.email),
    enabled: !!user,
  });

  const orgId = profile?.organization_id;

  const { data: org } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  const { data: activeSub } = useQuery({
    queryKey: ["active-subscription", orgId],
    queryFn: () => getActiveSubscription(orgId),
    enabled: !!orgId,
  });

  const { data: allSubs = [] } = useQuery({
    queryKey: ["org-subscriptions", orgId],
    queryFn: () => getOrgSubscriptions(orgId),
    enabled: !!orgId,
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: getPaymentSettings,
  });

  const hasPending = allSubs.some(s => s.status === "pending");

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadPaymentReceipt(receiptFile, orgId);
      }
      return createSubscriptionRequest({
        orgId,
        ownerEmail: user.email,
        planId: selectedPlan,
        paymentMethod: "bank_transfer",
        paymentReference: paymentRef,
        receiptUrl
      });
    },
    onSuccess: () => {
      toast.success(isAr ? "تم إرسال طلب الاشتراك! سيتم تفعيله بعد تأكيد الدفع." : "Subscription request sent! It will be activated after payment confirmation.");
      queryClient.invalidateQueries(["org-subscriptions"]);
      setShowPayment(false);
      setSelectedPlan(null);
      setPaymentRef("");
      setReceiptFile(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const plans = Object.values(PLANS);

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/employer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {isAr ? "خطط الاشتراك" : "Subscription Plans"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isAr ? "اختر الخطة المناسبة لمنشأتك وابدأ بنشر الوظائف واستقطاب أفضل الكفاءات." : "Choose the right plan for your business and start posting jobs to attract top talent."}
          </p>
        </div>

        {/* Why Subscribe Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/50 border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold mb-2">{t("pricingValue", "pillar1Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("pricingValue", "pillar1Desc")}</p>
          </div>
          <div className="bg-white/50 border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold mb-2">{t("pricingValue", "pillar2Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("pricingValue", "pillar2Desc")}</p>
          </div>
          <div className="bg-white/50 border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-bold mb-2">{t("pricingValue", "pillar3Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("pricingValue", "pillar3Desc")}</p>
          </div>
        </div>

        {/* Active Subscription Banner */}
        {activeSub && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {isAr ? `اشتراكك نشط — خطة ${PLANS[activeSub.plan]?.label_ar}` : `Active subscription — ${PLANS[activeSub.plan]?.label_en} plan`}
              </p>
              <p className="text-xs text-green-600">
                {isAr ? `الوظائف المستخدمة: ${activeSub.jobs_used} / ${activeSub.jobs_limit === -1 ? "∞" : activeSub.jobs_limit}` : `Jobs used: ${activeSub.jobs_used} / ${activeSub.jobs_limit === -1 ? "∞" : activeSub.jobs_limit}`}
                {" · "}
                {isAr ? "ينتهي: " : "Expires: "}{new Date(activeSub.expires_at).toLocaleDateString(isAr ? "ar" : "en")}
              </p>
            </div>
          </div>
        )}

        {/* Pending Banner */}
        {hasPending && !activeSub && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {isAr ? "لديك طلب اشتراك قيد المراجعة. سيتم تفعيله بعد تأكيد الدفع." : "You have a pending subscription request. It will be activated after payment confirmation."}
              </p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isAr={isAr}
              isActive={activeSub?.plan === plan.id}
              isBest={plan.id === "annual"}
              onSelect={handleSelectPlan}
              selected={selectedPlan}
            />
          ))}
        </div>

        {/* Payment Instructions Modal */}
        {showPayment && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-1">
                {isAr ? "تعليمات الدفع" : "Payment Instructions"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isAr ? `خطة ${PLANS[selectedPlan]?.label_ar} — ${PLANS[selectedPlan]?.price} ₪` : `${PLANS[selectedPlan]?.label_en} Plan — ${PLANS[selectedPlan]?.price} ₪`}
              </p>

              {/* QR Code */}
              {paymentSettings?.qr_code_url && (
                <div className="text-center mb-6">
                  <div className="inline-block bg-white p-4 rounded-xl border border-border">
                    <img src={paymentSettings.qr_code_url} alt="QR Code" className="w-40 h-40 mx-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isAr ? "امسح الـ QR للدفع" : "Scan QR to pay"}
                  </p>
                </div>
              )}

              {/* Bank Details */}
              <div className="space-y-3 mb-6">
                {paymentSettings?.bank_name && (
                  <InfoRow label={isAr ? "اسم البنك" : "Bank"} value={paymentSettings.bank_name} />
                )}
                {paymentSettings?.account_holder && (
                  <InfoRow label={isAr ? "صاحب الحساب" : "Account Holder"} value={paymentSettings.account_holder} />
                )}
                {paymentSettings?.account_number && (
                  <InfoRow label={isAr ? "رقم الحساب" : "Account Number"} value={paymentSettings.account_number} copyable />
                )}
                {paymentSettings?.iban && (
                  <InfoRow label="IBAN" value={paymentSettings.iban} copyable />
                )}
                {paymentSettings?.wallet_provider && (
                  <InfoRow label={isAr ? "المحفظة" : "Wallet"} value={`${paymentSettings.wallet_provider}: ${paymentSettings.wallet_number}`} copyable />
                )}
                {!paymentSettings && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                    {isAr ? "بيانات الدفع غير متوفرة حالياً. تواصل مع الإدارة." : "Payment details not available. Contact admin."}
                  </div>
                )}
              </div>

              {paymentSettings?.notes_ar && isAr && (
                <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-4">{paymentSettings.notes_ar}</p>
              )}
              {paymentSettings?.notes_en && !isAr && (
                <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-4">{paymentSettings.notes_en}</p>
              )}

              {/* Payment Reference */}
              <div className="mb-6">
                <Label className="text-sm font-medium">
                  {isAr ? "رقم الحوالة / مرجع الدفع (اختياري)" : "Transfer reference (optional)"}
                </Label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={isAr ? "رقم الحوالة البنكية أو إيصال الدفع" : "Bank transfer number or payment receipt"}
                  className="mt-1.5"
                />
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <Label className="text-sm font-medium">
                  {isAr ? "وصل الدفع (صورة أو PDF)" : "Payment receipt (Image or PDF)"}
                </Label>
                {!receiptFile ? (
                  <div className="mt-1.5 flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {isAr ? "اضغط لرفع الملف" : "Click to upload file"}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => setReceiptFile(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => subscribeMutation.mutate()}
                  disabled={subscribeMutation.isPending}
                  className="flex-1 h-11"
                >
                  {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تأكيد طلب الاشتراك" : "Confirm Subscription")}
                </Button>
                <Button variant="outline" onClick={() => { setShowPayment(false); setSelectedPlan(null); }} className="h-11">
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, copyable }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copied!");
  };
  return (
    <div className="flex items-center justify-between bg-secondary/30 px-3 py-2 rounded-lg">
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium">{value}</p>
      </div>
      {copyable && (
        <button onClick={handleCopy} className="p-1.5 hover:bg-secondary rounded-md transition-colors">
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
