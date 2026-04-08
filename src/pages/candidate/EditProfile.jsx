import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getCandidateProfile, saveCandidateProfile } from "@/lib/firestoreService";

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: "", bio: "", phone: "", city: "",
    preferred_roles: [], years_experience: "", availability: "flexible", skills: "",
  });

  const { data: existing } = useQuery({
    queryKey: ["my-candidate-profile", firebaseUser?.uid],
    queryFn: () => getCandidateProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        headline: existing.headline || "",
        bio: existing.bio || "",
        phone: existing.phone || "",
        city: existing.city || "",
        preferred_roles: existing.preferred_roles || [],
        years_experience: existing.years_experience?.toString() || "",
        availability: existing.availability || "flexible",
        skills: existing.skills?.join(", ") || "",
      });
    }
  }, [existing]);

  const jobTypeOptions = [
    { value: "barista", label: t("jobCard", "typeBarista") },
    { value: "chef", label: t("jobCard", "typeChef") },
    { value: "waiter", label: t("jobCard", "typeWaiter") },
    { value: "cashier", label: t("jobCard", "typeCashier") },
    { value: "host", label: t("jobCard", "typeHost") },
    { value: "cleaner", label: t("jobCard", "typeCleaner") },
    { value: "kitchen_helper", label: t("jobCard", "typeKitchenHelper") },
    { value: "restaurant_manager", label: t("jobCard", "typeManager") },
  ];

  const toggleRole = (value) => {
    setForm((prev) => ({
      ...prev,
      preferred_roles: prev.preferred_roles.includes(value)
        ? prev.preferred_roles.filter((r) => r !== value)
        : [...prev.preferred_roles, value],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      user_id: firebaseUser.uid,
      years_experience: form.years_experience ? Number(form.years_experience) : 0,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    await saveCandidateProfile(firebaseUser.uid, data);
    queryClient.invalidateQueries({ queryKey: ["my-candidate-profile"] });
    toast.success(t("editProfile", "saveSuccess"));
    setSaving(false);
    navigate("/candidate/profile");
  };

  return (
    <div>
      <PageHeader
        title={existing ? t("editProfile", "editTitle") : t("editProfile", "createTitle")}
        description={t("editProfile", "description")}
      />

      <div className="bg-white rounded-2xl border border-border p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <Label className="text-sm">{t("editProfile", "headline")}</Label>
            <Input placeholder={t("editProfile", "headlinePlaceholder")} value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })} className="mt-1.5" />
          </div>

          <div>
            <Label className="text-sm">{t("editProfile", "aboutMe")}</Label>
            <Textarea placeholder={t("editProfile", "aboutMePlaceholder")} value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="mt-1.5 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("editProfile", "phone")}</Label>
              <Input placeholder={t("editProfile", "phonePlaceholder")} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">{t("editProfile", "location")}</Label>
              <Input placeholder={t("editProfile", "locationPlaceholder")} value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("editProfile", "yearsExp")}</Label>
              <Input type="number" placeholder="0" value={form.years_experience}
                onChange={(e) => setForm({ ...form, years_experience: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">{t("editProfile", "availability")}</Label>
              <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{t("editProfile", "fullTime")}</SelectItem>
                  <SelectItem value="part_time">{t("editProfile", "partTime")}</SelectItem>
                  <SelectItem value="flexible">{t("editProfile", "flexible")}</SelectItem>
                  <SelectItem value="weekends_only">{t("editProfile", "weekendsOnly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm mb-3 block">{t("editProfile", "jobCategories")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {jobTypeOptions.map((jt) => (
                <label key={jt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.preferred_roles.includes(jt.value)}
                    onCheckedChange={() => toggleRole(jt.value)} />
                  <span className="text-sm">{jt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">{t("editProfile", "skills")}</Label>
            <Input placeholder={t("editProfile", "skillsPlaceholder")} value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })} className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{t("editProfile", "skillsHint")}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("editProfile", "saving") : t("editProfile", "saveProfile")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/candidate/profile")}>
              {t("editProfile", "cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}