import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getOrganization, saveOrganizationIfOwner } from "@/lib/firestoreService";
import { getOrgCompletion } from "@/lib/profileCompletion";

const BUSINESS_TYPES = [
  { value: "cafe", label: "Café / مقهى" },
  { value: "restaurant", label: "Restaurant / مطعم" },
  { value: "bar", label: "Bar / بار" },
  { value: "hotel", label: "Hotel / فندق" },
  { value: "catering", label: "Catering / تقديم طعام" },
  { value: "food_truck", label: "Food Truck / عربة طعام" },
  { value: "bakery", label: "Bakery / مخبز" },
  { value: "other", label: "Other / أخرى" },
];

export default function CompanyProfile() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", business_type: "", city: "", address: "",
    description: "", phone: "", email: "", website: "",
  });

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", firebaseUser?.uid],
    queryFn: () => getEmployerProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  const orgId = employerProfile?.organization_id;

  const { data: org } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        business_type: org.business_type || "",
        city: org.city || "",
        address: org.address || "",
        description: org.description || "",
        phone: org.phone || "",
        email: org.email || "",
        website: org.website || "",
      });
    }
  }, [org]);

  const handleSave = async () => {
    if (!orgId) { toast.error(t("companyProfile", "orgNotFound")); return; }
    if (!form.name) { toast.error(t("common", "required")); return; }
    setSaving(true);
    await saveOrganizationIfOwner(firebaseUser.uid, orgId, form);
    queryClient.invalidateQueries({ queryKey: ["organization"] });
    toast.success(t("companyProfile", "saveSuccess"));
    setSaving(false);
  };

  const completion = getOrgCompletion(org ? { ...org, ...form } : null);
  const sectionClass = "bg-white rounded-2xl border border-border p-6 space-y-4";

  return (
    <div>
      <PageHeader title={t("dashboard", "companyProfile")} description={t("companyProfile", "subtitle")} />

      <div className="max-w-2xl space-y-4">
        {/* Completion card */}
        <ProfileCompletionCard
          score={completion.score}
          missing={completion.missing}
          editPath="/employer/company"
          type="org"
        />

        {/* Identity */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("companyProfile", "identity")}</h3>
          <div>
            <Label className="text-sm">{t("companyProfile", "orgName")} <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5"
              placeholder={t("companyProfile", "orgNamePlaceholder")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("companyProfile", "businessType")} <span className="text-destructive">*</span></Label>
              <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder={t("companyProfile", "selectType")} /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">{t("companyProfile", "city")} <span className="text-destructive">*</span></Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5"
                placeholder={t("companyProfile", "cityPlaceholder")} />
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("companyProfile", "address")}</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5"
              placeholder={t("companyProfile", "addressPlaceholder")} />
          </div>
        </div>

        {/* Description */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("companyProfile", "aboutSection")}</h3>
          <p className="text-xs text-muted-foreground -mt-1">{t("companyProfile", "aboutHint")}</p>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="resize-none"
            placeholder={t("companyProfile", "descriptionPlaceholder")}
          />
        </div>

        {/* Contact */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("companyProfile", "contact")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("companyProfile", "phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5"
                placeholder="+966 5X XXX XXXX" />
            </div>
            <div>
              <Label className="text-sm">{t("companyProfile", "email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5"
                placeholder="hr@company.com" />
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("companyProfile", "website")}</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5"
              placeholder="https://yourcompany.com" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("common", "loading") : t("common", "save")}
          </Button>
        </div>
      </div>
    </div>
  );
}