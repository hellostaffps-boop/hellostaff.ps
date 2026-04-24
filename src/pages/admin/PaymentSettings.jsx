import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, QrCode, Building2, Wallet, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getPaymentSettings, savePaymentSettings } from "@/lib/subscriptionService";
import { uploadFile } from "@/lib/storageService";

export default function PaymentSettings() {
  const { lang } = useLanguage();
  const { userProfile } = useAuth();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: getPaymentSettings,
    enabled: userProfile?.role === "platform_admin",
  });

  const [form, setForm] = useState(null);
  const [uploadingQR, setUploadingQR] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize form when settings load
  if (settings && !form) {
    setForm({
      bank_name: settings.bank_name || "",
      account_number: settings.account_number || "",
      account_holder: settings.account_holder || "",
      iban: settings.iban || "",
      wallet_number: settings.wallet_number || "",
      wallet_provider: settings.wallet_provider || "",
      qr_code_url: settings.qr_code_url || "",
      notes_ar: settings.notes_ar || "",
      notes_en: settings.notes_en || "",
    });
  }

  if (!form && !isLoading) {
    setForm({
      bank_name: "", account_number: "", account_holder: "", iban: "",
      wallet_number: "", wallet_provider: "", qr_code_url: "",
      notes_ar: "", notes_en: "",
    });
  }

  const saveMut = useMutation({
    mutationFn: () => savePaymentSettings(form),
    onSuccess: () => {
      toast.success(isAr ? "تم حفظ إعدادات الدفع" : "Payment settings saved");
      queryClient.invalidateQueries(["payment-settings"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQR(true);
    try {
      const { file_url } = await uploadFile(file, "qrcodes");
      update("qr_code_url", file_url);
      toast.success(isAr ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (err) {
      toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image");
    } finally {
      setUploadingQR(false);
    }
  };

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold">{isAr ? "إعدادات الدفع" : "Payment Settings"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "أدخل بيانات الحساب البنكي والمحفظة التي ستظهر لأصحاب العمل عند الاشتراك." : "Enter bank account and wallet details shown to employers during subscription."}
        </p>
      </div>

      {/* Bank Details */}
      <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">{isAr ? "بيانات الحساب البنكي" : "Bank Account Details"}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={isAr ? "اسم البنك" : "Bank Name"} value={form.bank_name} onChange={v => update("bank_name", v)} placeholder="Bank of Palestine" />
          <Field label={isAr ? "صاحب الحساب" : "Account Holder"} value={form.account_holder} onChange={v => update("account_holder", v)} placeholder="Hello Staff LLC" />
          <Field label={isAr ? "رقم الحساب" : "Account Number"} value={form.account_number} onChange={v => update("account_number", v)} placeholder="1234567890" />
          <Field label="IBAN" value={form.iban} onChange={v => update("iban", v)} placeholder="PS92PALS000000001234567890" />
        </div>
      </section>

      {/* Wallet */}
      <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">{isAr ? "المحفظة الإلكترونية" : "Digital Wallet"}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={isAr ? "اسم المحفظة" : "Wallet Provider"} value={form.wallet_provider} onChange={v => update("wallet_provider", v)} placeholder="Jawwal Pay / PalPay" />
          <Field label={isAr ? "رقم المحفظة" : "Wallet Number"} value={form.wallet_number} onChange={v => update("wallet_number", v)} placeholder="059XXXXXXX" />
        </div>
      </section>

      {/* QR Code */}
      <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">{isAr ? "رمز QR للدفع" : "Payment QR Code"}</h2>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Field label={isAr ? "رابط صورة QR" : "QR Code Image URL"} value={form.qr_code_url} onChange={v => update("qr_code_url", v)} placeholder="https://..." />
          </div>
          <Button type="button" variant="outline" className="h-10 px-4" disabled={uploadingQR} onClick={() => fileInputRef.current?.click()}>
            {uploadingQR ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {isAr ? "رفع صورة" : "Upload"}
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
        {form.qr_code_url && (
          <div className="text-center mt-4">
            <img src={form.qr_code_url} alt="QR Preview" className="w-32 h-32 mx-auto rounded-lg border border-border object-contain bg-white" />
            <p className="text-xs text-muted-foreground mt-2">{isAr ? "معاينة الرمز" : "Preview"}</p>
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">{isAr ? "ملاحظات للعملاء" : "Customer Notes"}</h2>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{isAr ? "ملاحظات بالعربية" : "Notes (Arabic)"}</Label>
          <Textarea value={form.notes_ar} onChange={e => update("notes_ar", e.target.value)} placeholder="مثال: يرجى كتابة اسم الشركة في وصف الحوالة" rows={2} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{isAr ? "ملاحظات بالإنجليزية" : "Notes (English)"}</Label>
          <Textarea value={form.notes_en} onChange={e => update("notes_en", e.target.value)} placeholder="e.g., Please include your company name in the transfer description" rows={2} className="mt-1" />
        </div>
      </section>

      {/* Save */}
      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="h-11 px-8">
        {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {isAr ? "حفظ الإعدادات" : "Save Settings"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}
