import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Plus, X, Image, Video, Star } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getEmployerProfile, getOrganization, saveOrganizationIfOwner } from "@/lib/supabaseService";
import { uploadFile } from "@/lib/storageService";
import { getOrgCompletion } from "@/lib/profileCompletion";
import { PALESTINE_CITIES } from "@/lib/constants";


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

const CULTURE_SUGGESTIONS = [
  "Fast-paced", "Team-oriented", "Innovation", "Work-life balance",
  "Customer-first", "Inclusive", "Learning culture", "Family-friendly",
  "Diversity", "Growth mindset", "عمل جماعي", "الإبداع", "التطوير المهني",
];

const PERK_SUGGESTIONS = [
  "Free meals", "Health insurance", "Flexible hours", "Transportation",
  "Training programs", "Performance bonuses", "Paid leave", "Uniform provided",
  "وجبات مجانية", "تأمين صحي", "مواصلات", "بدل تدريب",
];

const sectionClass = "bg-white rounded-2xl border border-border p-6 space-y-4";

function TagInput({ tags = [], onChange, suggestions = [], placeholder }) {
  const [input, setInput] = useState("");

  const add = (val) => {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
            {tag}
            <button onClick={() => remove(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => add(input)} className="h-8 px-3">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestions.filter((s) => !tags.includes(s)).slice(0, 8).map((s) => (
            <button key={s} onClick={() => add(s)}
              className="text-xs text-muted-foreground border border-dashed border-border rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamPhotosInput({ photos = [], onChange }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const addUrl = () => {
    const v = url.trim();
    if (v && !photos.includes(v)) onChange([...photos, v]);
    setUrl("");
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file, "team-photos");
      onChange([...photos, file_url]);
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
            <img src={p} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Image className="w-5 h-5 text-muted-foreground" />}
          <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste image URL..." className="h-8 text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={addUrl} className="h-8 px-3 shrink-0">Add URL</Button>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState({
    name: "", business_type: "", city: "", address: "",
    description: "", phone: "", email: "", website: "",
    logo_url: "", cover_image_url: "", video_url: "",
    slogan: "", map_url: "",
    founded_year: "", instagram_url: "", linkedin_url: "",
    culture_values: [], perks: [], team_photos: [],
  });

  const uid = user?.email;

  const { data: employerProfile } = useQuery({
    queryKey: ["employer-profile", uid],
    queryFn: () => getEmployerProfile(uid),
    enabled: !!uid,
  });

  const orgId = employerProfile?.organization_id;

  const { data: org, isSuccess } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isSuccess && !isInitialized.current) {
      if (org) {
        setForm({
          name: org.name || "",
          business_type: org.business_type || org.industry || "",
          city: org.city || "",
          address: org.address || "",
          description: org.description || "",
          phone: org.phone || "",
          email: org.email || "",
          website: org.website || "",
          logo_url: org.logo_url || "",
          cover_image_url: org.cover_image_url || "",
          video_url: org.video_url || "",
          slogan: org.slogan || "",
          map_url: org.map_url || "",
          founded_year: org.founded_year || "",
          instagram_url: org.instagram_url || "",
          linkedin_url: org.linkedin_url || "",
          culture_values: org.culture_values || [],
          perks: org.perks || [],
          team_photos: org.team_photos || [],
        });
      }
      isInitialized.current = true;
    }
  }, [org, isSuccess]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!orgId) { toast.error("Organization not found"); return; }
    if (!form.name) { toast.error("Company name is required"); return; }
    if (!form.email) { toast.error("Company email is required"); return; }
    setSaving(true);
    try {
      await saveOrganizationIfOwner(uid, orgId, form);
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Company profile saved!");
    } catch (err) {
      toast.error("Failed to save: " + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await uploadFile(file, "logos");
      set("logo_url", file_url);
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { file_url } = await uploadFile(file, "covers");
      set("cover_image_url", file_url);
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setCoverUploading(false);
    }
  };

  const completion = getOrgCompletion(org ? { ...org, ...form } : null);

  return (
    <div>
      <PageHeader title="Company Profile" description="Build your employer brand to attract top talent" />

      <div className="max-w-2xl space-y-4">

        {/* Verified badge banner */}
        {org?.verified && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Verified Employer</p>
              <p className="text-xs text-emerald-600">Your company profile is verified and will be highlighted to candidates. / شركتك موثقة وستُعرض بشكل بارز للمرشحين.</p>
            </div>
            <Badge className="ms-auto bg-emerald-600 text-white text-xs shrink-0">✓ Verified</Badge>
          </div>
        )}

        {/* Completion */}
        <ProfileCompletionCard score={completion.score} missing={completion.missing} editPath="/employer/company" type="org" />

        {/* Cover + Logo */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">Branding Media / الهوية البصرية</h3>

          {/* Cover image */}
          <div>
            <Label className="text-sm">Cover Image</Label>
            <div className="mt-1.5 relative h-32 rounded-xl border-2 border-dashed border-border overflow-hidden bg-secondary/30">
              {form.cover_image_url
                ? <img src={form.cover_image_url} alt="cover" className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Image className="w-6 h-6 mb-1" />
                    <span className="text-xs">Cover image (1200×400 recommended)</span>
                  </div>
              }
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                {coverUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-white text-xs font-medium">Change Cover</span>}
                <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} disabled={coverUploading} />
              </label>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden bg-secondary/30 shrink-0">
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
                : <div className="flex items-center justify-center h-full text-muted-foreground"><Image className="w-6 h-6" /></div>
              }
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                {logoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <span className="text-white text-[10px]">Change</span>}
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} disabled={logoUploading} />
              </label>
            </div>
            <div className="flex-1">
              <Label className="text-sm">Logo URL</Label>
              <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} className="mt-1.5 text-sm" placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">Company Identity / هوية الشركة</h3>
          <div>
            <Label className="text-sm">Company Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" placeholder="Your company name" />
          </div>
          <div>
            <Label className="text-sm">Slogan / الشعار اللفظي</Label>
            <Input value={form.slogan} onChange={(e) => set("slogan", e.target.value)} className="mt-1.5" placeholder="e.g. Delicious food, Great vibes" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Business Type <span className="text-destructive">*</span></Label>
              <Select value={form.business_type} onValueChange={(v) => set("business_type", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">City <span className="text-destructive">*</span></Label>
              <Select value={form.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {PALESTINE_CITIES.map((city) => (
                    <SelectItem key={city.value} value={city.label.split(" / ")[0]}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Address</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="mt-1.5" placeholder="Street address" />
            </div>
            <div>
              <Label className="text-sm">Founded Year</Label>
              <Input value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)} className="mt-1.5" placeholder="e.g. 2018" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">About the Company / عن الشركة</h3>
          <p className="text-xs text-muted-foreground -mt-1">Describe your company to attract the best candidates.</p>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="resize-none" placeholder="Tell candidates about your story, mission, and what makes you great..." />
        </div>

        {/* Culture */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Culture & Values / الثقافة والقيم</h3>
          </div>
          <p className="text-xs text-muted-foreground">Add keywords that describe your workplace culture.</p>
          <TagInput tags={form.culture_values} onChange={(v) => set("culture_values", v)} suggestions={CULTURE_SUGGESTIONS} placeholder="e.g. Team-oriented" />
        </div>

        {/* Perks */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">Perks & Benefits / المزايا والمكافآت</h3>
          <p className="text-xs text-muted-foreground">What do you offer your employees?</p>
          <TagInput tags={form.perks} onChange={(v) => set("perks", v)} suggestions={PERK_SUGGESTIONS} placeholder="e.g. Free meals" />
        </div>

        {/* Team Photos */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">Team Photos / صور الفريق</h3>
          <p className="text-xs text-muted-foreground">Show candidates what it's like to work with you.</p>
          <TeamPhotosInput photos={form.team_photos} onChange={(v) => set("team_photos", v)} />
        </div>

        {/* Video */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Culture Video / فيديو الشركة</h3>
          </div>
          <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo embed URL to showcase your workplace.</p>
          <Input value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.youtube.com/embed/..." className="text-sm" />
          {form.video_url && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border aspect-video">
              <iframe src={form.video_url} className="w-full h-full" allowFullScreen title="Company video" />
            </div>
          )}
        </div>

        {/* Contact */}
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm">Contact & Location / التواصل والموقع</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5" placeholder="hr@company.com" />
            </div>
            <div>
              <Label className="text-sm">Phone (Optional)</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" placeholder="+966 5X XXX XXXX" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Website</Label>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} className="mt-1.5" placeholder="https://yourcompany.com" />
            </div>
            <div>
              <Label className="text-sm">Google Maps URL</Label>
              <Input value={form.map_url} onChange={(e) => set("map_url", e.target.value)} className="mt-1.5" placeholder="https://maps.app.goo.gl/..." />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Instagram</Label>
              <Input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} className="mt-1.5" placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label className="text-sm">LinkedIn</Label>
              <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} className="mt-1.5" placeholder="https://linkedin.com/company/..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}