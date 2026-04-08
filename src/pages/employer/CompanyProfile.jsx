import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getOrganization, saveOrganization, saveEmployerProfile } from "@/lib/firestoreService";

export default function CompanyProfile() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", business_type: "", city: "", address: "" });

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
      setForm({ name: org.name || "", business_type: org.business_type || "", city: org.city || "", address: org.address || "" });
    }
  }, [org]);

  const handleSave = async () => {
    setSaving(true);
    await saveOrganization(orgId, form);
    queryClient.invalidateQueries({ queryKey: ["organization"] });
    toast.success(t("common", "save"));
    setSaving(false);
  };

  const businessTypes = ["cafe", "restaurant", "bar", "hotel", "catering", "food_truck", "bakery", "other"];

  return (
    <div>
      <PageHeader title={t("dashboard", "companyProfile")} />
      <div className="bg-white rounded-2xl border border-border p-8 max-w-2xl">
        <div className="space-y-5">
          <div>
            <Label className="text-sm">{t("about", "heading")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm">{t("categories", "heading") || "Business Type"}</Label>
            <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{businessTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">{t("editProfile", "location")}</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm">{t("contact", "officeLabel")}</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common", "loading") : t("common", "save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}