import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";

const jobTypeOptions = [
  { value: "barista", label: "Barista" },
  { value: "chef", label: "Chef" },
  { value: "waiter", label: "Waiter" },
  { value: "cashier", label: "Cashier" },
  { value: "host", label: "Host" },
  { value: "cleaner", label: "Cleaner" },
  { value: "kitchen_helper", label: "Kitchen Helper" },
  { value: "restaurant_manager", label: "Manager" },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: "", bio: "", phone: "", location: "",
    job_types: [], experience_years: "", availability: "flexible", skills: "",
  });

  const { data: existing } = useQuery({
    queryKey: ["my-profile-edit"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.CandidateProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        headline: existing.headline || "",
        bio: existing.bio || "",
        phone: existing.phone || "",
        location: existing.location || "",
        job_types: existing.job_types || [],
        experience_years: existing.experience_years?.toString() || "",
        availability: existing.availability || "flexible",
        skills: existing.skills?.join(", ") || "",
      });
    }
  }, [existing]);

  const toggleJobType = (value) => {
    setForm((prev) => ({
      ...prev,
      job_types: prev.job_types.includes(value)
        ? prev.job_types.filter((t) => t !== value)
        : [...prev.job_types, value],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const data = {
      ...form,
      user_email: user.email,
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };

    if (existing) {
      await base44.entities.CandidateProfile.update(existing.id, data);
    } else {
      await base44.entities.CandidateProfile.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Profile saved!");
    setSaving(false);
    navigate("/candidate/profile");
  };

  return (
    <div>
      <PageHeader title={existing ? "Edit Profile" : "Create Profile"} description="Tell employers about yourself." />

      <div className="bg-white rounded-2xl border border-border p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <Label className="text-sm">Headline</Label>
            <Input placeholder="e.g. Experienced Barista & Coffee Enthusiast" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm">About Me</Label>
            <Textarea placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="mt-1.5 resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Phone</Label>
              <Input placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">Location</Label>
              <Input placeholder="San Francisco, CA" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Years of Experience</Label>
              <Input type="number" placeholder="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">Availability</Label>
              <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="weekends_only">Weekends Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm mb-3 block">Job Categories</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {jobTypeOptions.map((jt) => (
                <label key={jt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.job_types.includes(jt.value)} onCheckedChange={() => toggleJobType(jt.value)} />
                  <span className="text-sm">{jt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Skills</Label>
            <Input placeholder="Latte art, Customer service, POS systems..." value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/candidate/profile")}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}