import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import AIJobAssistant from "../../components/AIJobAssistant";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getEmployerProfile, getOrganization, createJobForOwnedOrganization, notifyMatchingCandidatesForJob } from "@/lib/firestoreService";


export default function PostJob() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { firebaseUser } = useFirebaseAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", job_type: "barista", employment_type: "full_time",
    location: "", salary_min: "", salary_max: "", description: "",
    requirements: "", benefits: "", status: "draft",
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

  const categories = [
    { value: "barista", label: t("jobCard", "typeBarista") },
    { value: "chef", label: t("jobCard", "typeChef") },
    { value: "waiter", label: t("jobCard", "typeWaiter") },
    { value: "cashier", label: t("jobCard", "typeCashier") },
    { value: "host", label: t("jobCard", "typeHost") },
    { value: "cleaner", label: t("jobCard", "typeCleaner") },
    { value: "kitchen_helper", label: t("jobCard", "typeKitchenHelper") },
    { value: "restaurant_manager", label: t("jobCard", "typeManager") },
  ];

  const handleSave = async (publish = false) => {
    if (!form.title) { toast.error(t("common", "required")); return; }
    if (!employerProfile?.organization_id) { toast.error("Organization not found"); return; }
    setSaving(true);
    const jobRef = await createJobForOwnedOrganization(
      firebaseUser.uid,
      {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        status: publish ? "published" : "draft",
      },
      employerProfile.organization_id,
      org?.name || ""
    );
    // Notify matching candidates when job is published
    if (publish) {
      notifyMatchingCandidatesForJob({
        id: jobRef.id,
        title: form.title,
        job_type: form.job_type,
        organization_name: org?.name || "",
      }).catch(() => {});
    }
    toast.success(publish ? t("status", "published") : t("status", "draft"));
    setSaving(false);
    navigate("/employer/jobs");
  };

  return (
    <div>
      <PageHeader title={t("dashboard", "postJob")} />
      <div className="max-w-2xl space-y-5">
        <AIJobAssistant
          category={form.category}
          onApply={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
        />
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="space-y-5">
          <div>
            <Label className="text-sm">{t("jobDetails", "jobDescription").replace(" الوظيفة", "").replace(" Description", " Title")}</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" placeholder={t("jobCard", "typeBarista")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("categories", "heading") || "Category"}</Label>
              <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">{t("jobCard", "empFullTime")}</Label>
              <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{t("jobCard", "empFullTime")}</SelectItem>
                  <SelectItem value="part_time">{t("jobCard", "empPartTime")}</SelectItem>
                  <SelectItem value="contract">{t("jobCard", "empContract")}</SelectItem>
                  <SelectItem value="temporary">{t("jobCard", "empTemporary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("contact", "officeLabel")}</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("common", "month")} Min</Label>
              <Input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">{t("common", "month")} Max</Label>
              <Input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("jobDetails", "jobDescription")}</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1.5 resize-none" />
          </div>
          <div>
            <Label className="text-sm">{t("jobDetails", "requirements")}</Label>
            <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} className="mt-1.5 resize-none" />
          </div>
          <div>
            <Label className="text-sm">{t("jobDetails", "benefits")}</Label>
            <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={3} className="mt-1.5 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? t("common", "loading") : t("status", "published")}
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {t("status", "draft")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/employer/jobs")}>{t("editProfile", "cancel")}</Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}