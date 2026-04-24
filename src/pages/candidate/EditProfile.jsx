import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getCandidateProfile, saveCandidateProfile } from "@/lib/supabaseService";
import { uploadFile } from "@/lib/storageService";


const emptyExp = () => ({ title: "", company: "", from: "", to: "", current: false, description: "" });
const emptyEdu = () => ({ degree: "", institution: "", year: "" });

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef(null);


  const [saving, setSaving] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    headline: "", bio: "", phone: "", city: "",
    preferred_roles: [], years_experience: "", availability: "flexible",
    skills: [], cv_url: "",
    work_experience: [],
    education: [],
  });

  const { data: existing } = useQuery({
    queryKey: ["my-candidate-profile", user?.email],
    queryFn: () => getCandidateProfile(user.email),
    enabled: !!user,
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
        skills: existing.skills || [],
        cv_url: existing.cv_url || "",
        work_experience: existing.work_experience || [],
        education: existing.education || [],
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

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput("");
  };

  const removeSkill = (s) => setForm((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== s) }));

  // Work Experience
  const addExp = () => setForm((p) => ({ ...p, work_experience: [...p.work_experience, emptyExp()] }));
  const updateExp = (i, field, val) => setForm((p) => {
    const arr = [...p.work_experience];
    arr[i] = { ...arr[i], [field]: val };
    return { ...p, work_experience: arr };
  });
  const removeExp = (i) => setForm((p) => ({ ...p, work_experience: p.work_experience.filter((_, idx) => idx !== i) }));

  // Education
  const addEdu = () => setForm((p) => ({ ...p, education: [...p.education, emptyEdu()] }));
  const updateEdu = (i, field, val) => setForm((p) => {
    const arr = [...p.education];
    arr[i] = { ...arr[i], [field]: val };
    return { ...p, education: arr };
  });
  const removeEdu = (i) => setForm((p) => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));

  // CV Upload
  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCV(true);
    try {
      const { file_url } = await uploadFile(file, "resumes");
      setForm((p) => ({ ...p, cv_url: file_url }));
      toast.success(t("editProfile", "cvUploaded") || "CV uploaded successfully");
    } catch {
      toast.error(t("editProfile", "cvUploadError") || "Upload failed");
    } finally {
      setUploadingCV(false);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      years_experience: form.years_experience ? Number(form.years_experience) : 0,
    };
    await saveCandidateProfile(user.email, data);
    queryClient.invalidateQueries({ queryKey: ["my-candidate-profile"] });
    toast.success(t("editProfile", "saveSuccess"));
    setSaving(false);
    navigate("/candidate/profile");
  };


  const sectionClass = "bg-white rounded-2xl border border-border p-6 space-y-4";

  return (
    <div>
      <PageHeader
        title={existing?.headline ? t("editProfile", "editTitle") : t("editProfile", "createTitle")}
        description={t("editProfile", "description")}
      />

      <div className="max-w-2xl space-y-4">

        {/* Personal Info */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("editProfile", "personalInfo") || "Personal Information"}</h3>
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
        </div>

        {/* CV Upload */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("editProfile", "cvSection") || "CV / Resume"}</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="gap-2" disabled={uploadingCV}
              onClick={() => fileInputRef.current?.click()}>
              {uploadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingCV ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading...") : (t("editProfile", "uploadCV") || "Upload CV")}
            </Button>
            {form.cv_url && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lang === "ar" ? "تم رفع السيرة الذاتية بنجاح" : "CV uploaded successfully"}
                <span className="mx-1 text-muted-foreground">•</span>
                <a href={form.cv_url} target="_blank" rel="noreferrer"
                  className="font-medium hover:underline truncate max-w-[100px]">
                  {t("editProfile", "viewCV") || "View"}
                </a>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} />
          </div>
          <p className="text-xs text-muted-foreground">{lang === "ar" ? "الصيغ المدعومة: PDF, DOC, DOCX (حجم أقصى 20 ميجابايت)" : "Supported formats: PDF, DOC, DOCX (Max 20MB)"}</p>
        </div>

        {/* Skills */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("editProfile", "skills")}</h3>
          <div className="flex gap-2">
            <Input
              placeholder={t("editProfile", "addSkillPlaceholder") || "Add a skill..."}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pe-1">
                  {s}
                  <button onClick={() => removeSkill(s)} className="ms-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("editProfile", "skillsHint")}</p>
        </div>

        {/* Work Experience */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("editProfile", "workExperience") || "Work Experience"}</h3>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addExp}>
              <Plus className="w-4 h-4" /> {t("editProfile", "addExperience") || "Add"}
            </Button>
          </div>
          {form.work_experience.map((exp, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeExp(i)}
                className="absolute top-3 end-3 text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("editProfile", "jobTitle") || "Job Title"}</Label>
                  <Input value={exp.title} onChange={(e) => updateExp(i, "title", e.target.value)}
                    placeholder={t("editProfile", "jobTitlePlaceholder") || "e.g. Head Barista"} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("editProfile", "company") || "Company"}</Label>
                  <Input value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)}
                    placeholder={t("editProfile", "companyPlaceholder") || "Company name"} className="mt-1 h-9 text-sm" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("editProfile", "from") || "From"}</Label>
                  <Input type="month" value={exp.from} onChange={(e) => updateExp(i, "from", e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("editProfile", "to") || "To"}</Label>
                  <Input type="month" value={exp.to} disabled={exp.current} onChange={(e) => updateExp(i, "to", e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={exp.current} onCheckedChange={(v) => updateExp(i, "current", v)} />
                {t("editProfile", "currentRole") || "I currently work here"}
              </label>
              <div>
                <Label className="text-xs">{t("editProfile", "description") || "Description"}</Label>
                <Textarea value={exp.description} onChange={(e) => updateExp(i, "description", e.target.value)}
                  rows={2} className="mt-1 resize-none text-sm" placeholder={t("editProfile", "expDescPlaceholder") || "Describe your responsibilities..."} />
              </div>
            </div>
          ))}
          {form.work_experience.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("editProfile", "noExperience") || "No experience added yet."}</p>
          )}
        </div>

        {/* Education */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("editProfile", "education") || "Education"}</h3>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addEdu}>
              <Plus className="w-4 h-4" /> {t("editProfile", "addEducation") || "Add"}
            </Button>
          </div>
          {form.education.map((edu, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeEdu(i)}
                className="absolute top-3 end-3 text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("editProfile", "degree") || "Degree / Qualification"}</Label>
                  <Input value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)}
                    placeholder={t("editProfile", "degreePlaceholder") || "e.g. Bachelor of Hospitality"} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">{t("editProfile", "institution") || "Institution"}</Label>
                  <Input value={edu.institution} onChange={(e) => updateEdu(i, "institution", e.target.value)}
                    placeholder={t("editProfile", "institutionPlaceholder") || "School / University"} className="mt-1 h-9 text-sm" />
                </div>
              </div>
              <div className="w-32">
                <Label className="text-xs">{t("editProfile", "graduationYear") || "Year"}</Label>
                <Input type="number" value={edu.year} onChange={(e) => updateEdu(i, "year", e.target.value)}
                  placeholder="2024" className="mt-1 h-9 text-sm" />
              </div>
            </div>
          ))}
          {form.education.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("editProfile", "noEducation") || "No education added yet."}</p>
          )}
        </div>

        {/* Job Preferences */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">{t("editProfile", "jobPreferences") || "Job Preferences"}</h3>
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
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("editProfile", "saving") : t("editProfile", "saveProfile")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/candidate/profile")}>
            {t("editProfile", "cancel")}
          </Button>
        </div>

      </div>
    </div>
  );
}