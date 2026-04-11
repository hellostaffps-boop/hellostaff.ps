import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, MapPin, Users, ChevronRight, ChevronLeft,
  Check, Briefcase, Loader2, Star, Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { base44 } from "@/api/base44Client";
import { saveOrganizationIfOwner, getEmployerProfile } from "@/lib/firestoreService";

const STEPS = [
  { id: 1, label: "Business Info", icon: Building2 },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "About", icon: Star },
  { id: 4, label: "Done!", icon: Check },
];

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

const SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "200+", label: "200+ employees" },
];

const CULTURE_SUGGESTIONS = [
  "Team-oriented", "Fast-paced", "Customer-first", "Inclusive",
  "Work-life balance", "Growth mindset", "عمل جماعي", "التطوير المهني",
];

const PERK_SUGGESTIONS = [
  "Free meals", "Health insurance", "Flexible hours",
  "Transportation", "Training programs", "Performance bonuses",
];

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all text-sm font-semibold",
              done ? "bg-accent border-accent text-accent-foreground" :
              active ? "bg-primary border-primary text-primary-foreground" :
              "bg-white border-border text-muted-foreground"
            )}>
              {done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("w-12 h-0.5 transition-colors", done ? "bg-accent" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TagPicker({ selected, options, onChange }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-all",
            selected.includes(o)
              ? "bg-accent/10 border-accent text-accent font-medium"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}>
          {selected.includes(o) && <span className="me-1">✓</span>}
          {o}
        </button>
      ))}
    </div>
  );
}

export default function EmployerOnboarding() {
  const navigate = useNavigate();
  const { firebaseUser } = useFirebaseAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    business_type: "",
    size: "",
    city: "",
    address: "",
    phone: "",
    website: "",
    description: "",
    culture_values: [],
    perks: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.business_type;
    if (step === 2) return form.city.trim();
    return true;
  };

  const handleNext = () => {
    if (step < 3) { setStep((s) => s + 1); return; }
    handleSave();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profile = await getEmployerProfile(firebaseUser.email);
      if (profile?.organization_id) {
        await saveOrganizationIfOwner(firebaseUser.email, profile.organization_id, {
          ...form,
          industry: form.business_type,
          status: "active",
        });
      }
      setStep(4);
    } catch (e) {
      toast.error("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const skip = () => navigate("/employer", { replace: true });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-8 pt-8 pb-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="w-5 h-5 text-accent" />
            <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">Employer Setup</span>
          </div>
          <h1 className="text-xl font-bold">Set up your company profile</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Attract the best hospitality talent — takes 2 minutes</p>
        </div>

        <div className="px-8 py-6">
          {step < 4 && <StepIndicator current={step} steps={STEPS.slice(0, 3)} />}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-base mb-0.5">Tell us about your business</h2>
                <p className="text-sm text-muted-foreground mb-4">Basic information visible to job seekers.</p>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Company Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. The Blue Café" className="h-10" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Business Type <span className="text-destructive">*</span></Label>
                <Select value={form.business_type} onValueChange={(v) => set("business_type", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select your business type" /></SelectTrigger>
                  <SelectContent>{BUSINESS_TYPES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Company Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button key={s.value} type="button" onClick={() => set("size", s.value)}
                      className={cn("text-sm px-3 py-2.5 rounded-lg border text-start transition-all",
                        form.size === s.value ? "border-accent bg-accent/5 text-accent font-medium" : "border-border hover:border-muted-foreground/30")}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-base mb-0.5">Where are you located?</h2>
                <p className="text-sm text-muted-foreground mb-4">Helps candidates find you nearby.</p>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">City <span className="text-destructive">*</span></Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Riyadh" className="h-10" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Street Address</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. King Fahd Road, Al Olaya" className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1.5 block">Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+966 5X XXX" className="h-10" />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Website</Label>
                  <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." className="h-10" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Culture & About */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold text-base mb-0.5">What makes you a great employer?</h2>
                <p className="text-sm text-muted-foreground mb-4">Stand out to top candidates.</p>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">About your company</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="resize-none text-sm" placeholder="Briefly describe your place, vibe, and what makes working there special..." />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Culture & Values <span className="text-xs text-muted-foreground font-normal">(pick all that apply)</span></Label>
                <TagPicker selected={form.culture_values} options={CULTURE_SUGGESTIONS} onChange={(v) => set("culture_values", v)} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Perks & Benefits <span className="text-xs text-muted-foreground font-normal">(pick all that apply)</span></Label>
                <TagPicker selected={form.perks} options={PERK_SUGGESTIONS} onChange={(v) => set("perks", v)} />
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold">You're all set, {form.name}!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your company profile is ready. Now post your first job and start receiving applications.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11" onClick={() => navigate("/employer/post-job", { replace: true })}>
                  <Briefcase className="w-4 h-4 me-2" /> Post Your First Job
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/employer", { replace: true })}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
              <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                Skip for now
              </button>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="gap-1 h-9">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={!canNext() || saving}
                  onClick={handleNext}
                  className="gap-1 h-9 bg-accent text-accent-foreground hover:bg-accent/90 min-w-24"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 3 ? "Finish" : "Next"}
                  {!saving && step < 3 && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}