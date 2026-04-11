import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Trash2, Download, Eye, EyeOff, Loader2,
  User, Briefcase, GraduationCap, Wrench, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getCandidateProfile } from "@/lib/firestoreService";
import { base44 } from "@/api/base44Client";

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const EMPTY_CV = {
  personalInfo: { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, onAdd, addLabel }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-accent" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {children}
          {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
              <Plus className="w-3.5 h-3.5" /> {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── CV Preview ────────────────────────────────────────────────────────────────
function CVPreview({ cv }) {
  const { personalInfo, summary, experience, education, skills, languages } = cv;
  return (
    <div id="cv-preview" className="bg-white text-foreground font-inter p-8 min-h-[800px] text-sm leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-primary pb-5 mb-5">
        <h1 className="text-2xl font-bold tracking-tight">{personalInfo.fullName || "Your Name"}</h1>
        {personalInfo.jobTitle && <p className="text-accent font-medium mt-0.5">{personalInfo.jobTitle}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Professional Summary</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{exp.jobTitle || "Job Title"}</p>
                    <p className="text-accent text-xs">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ms-4">
                    {exp.startDate}{exp.startDate && exp.endDate ? " – " : ""}{exp.endDate || (exp.current ? "Present" : "")}
                  </span>
                </div>
                {exp.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Education</h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{edu.degree || "Degree"}</p>
                  <p className="text-xs text-muted-foreground">{edu.school}{edu.field ? ` · ${edu.field}` : ""}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ms-4">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills + Languages */}
      <div className="grid grid-cols-2 gap-5">
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        {languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Languages</h2>
            <div className="space-y-1">
              {languages.map((l, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{l.language}</span>
                  <span className="text-muted-foreground">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CVBuilder() {
  const { firebaseUser, userProfile } = useFirebaseAuth();
  const [cv, setCv] = useState(null);
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState({ language: "", level: "Fluent" });

  // Pre-fill from candidate profile
  useQuery({
    queryKey: ["cv-prefill", firebaseUser?.email],
    queryFn: async () => {
      const profile = await getCandidateProfile(firebaseUser.email);
      setCv({
        ...EMPTY_CV,
        personalInfo: {
          ...EMPTY_CV.personalInfo,
          fullName: userProfile?.full_name || "",
          email: firebaseUser.email || "",
          phone: profile?.phone || "",
          location: profile?.location || "",
          jobTitle: profile?.headline || "",
        },
        summary: profile?.bio || "",
        skills: profile?.skills || [],
      });
      return profile;
    },
    enabled: !!firebaseUser && !cv,
  });

  if (!cv) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const set = (section, field, val) =>
    setCv((prev) => ({ ...prev, [section]: { ...prev[section], [field]: val } }));

  const setTop = (field, val) => setCv((prev) => ({ ...prev, [field]: val }));

  // Experience
  const addExp = () => setCv((prev) => ({ ...prev, experience: [...prev.experience, { id: uid(), jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" }] }));
  const updateExp = (id, field, val) => setCv((prev) => ({ ...prev, experience: prev.experience.map((e) => e.id === id ? { ...e, [field]: val } : e) }));
  const removeExp = (id) => setCv((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));

  // Education
  const addEdu = () => setCv((prev) => ({ ...prev, education: [...prev.education, { id: uid(), degree: "", school: "", field: "", year: "" }] }));
  const updateEdu = (id, field, val) => setCv((prev) => ({ ...prev, education: prev.education.map((e) => e.id === id ? { ...e, [field]: val } : e) }));
  const removeEdu = (id) => setCv((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));

  // Skills
  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !cv.skills.includes(v)) setTop("skills", [...cv.skills, v]);
    setSkillInput("");
  };
  const removeSkill = (s) => setTop("skills", cv.skills.filter((x) => x !== s));

  // Languages
  const addLang = () => {
    if (!langInput.language.trim()) return;
    setTop("languages", [...cv.languages, { ...langInput }]);
    setLangInput({ language: "", level: "Fluent" });
  };
  const removeLang = (i) => setTop("languages", cv.languages.filter((_, idx) => idx !== i));

  // Export PDF via LLM-generated HTML
  const handleExport = async () => {
    setExporting(true);
    try {
      const htmlContent = document.getElementById("cv-preview")?.innerHTML || "";
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1a1a1a;font-size:13px;}
        h1{margin:0 0 4px;font-size:22px;} h2{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#1e3a5f;margin:0 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
        .accent{color:#f59e0b;} .muted{color:#6b7280;} .section{margin-bottom:20px;}
        .flex-between{display:flex;justify-content:space-between;}
        span.badge{background:#f3f4f6;padding:2px 8px;border-radius:9999px;font-size:11px;margin:2px;}
      </style></head><body>${htmlContent}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.personalInfo.fullName || "CV"}_Resume.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CV downloaded! Open the file in a browser and print as PDF.");
    } catch {
      toast.error("Export failed. Please try again.");
    }
    setExporting(false);
  };

  return (
    <div>
      <PageHeader
        title="CV Builder"
        description="Build a professional CV to attach with your applications"
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreview((p) => !p)}>
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {preview ? "Edit" : "Preview"}
        </Button>
        <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download CV
        </Button>
      </PageHeader>

      {preview ? (
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border border-border shadow-lg">
          <CVPreview cv={cv} />
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">

          {/* Personal Info */}
          <Section icon={User} title="Personal Information">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["fullName", "Full Name *"],
                ["jobTitle", "Job Title / Headline"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["location", "Location / City"],
                ["website", "Website (optional)"],
                ["linkedin", "LinkedIn URL (optional)"],
              ].map(([field, label]) => (
                <div key={field} className={field === "linkedin" || field === "website" ? "sm:col-span-2" : ""}>
                  <Label className="text-xs mb-1 block">{label}</Label>
                  <Input
                    value={cv.personalInfo[field]}
                    onChange={(e) => set("personalInfo", field, e.target.value)}
                    className="h-8 text-sm"
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Summary */}
          <Section icon={FileText} title="Professional Summary">
            <Textarea
              value={cv.summary}
              onChange={(e) => setTop("summary", e.target.value)}
              rows={4}
              className="resize-none text-sm"
              placeholder="A brief professional summary that highlights your key strengths, experience, and what you bring to a team..."
            />
            <p className="text-xs text-muted-foreground">{cv.summary.length} / 500 characters recommended</p>
          </Section>

          {/* Experience */}
          <Section icon={Briefcase} title="Work Experience" onAdd={addExp} addLabel="Add Experience">
            {cv.experience.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">No experience added yet. Click below to add.</p>
            )}
            {cv.experience.map((exp) => (
              <div key={exp.id} className="border border-border rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeExp(exp.id)} className="absolute top-3 end-3 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Job Title *</Label>
                    <Input value={exp.jobTitle} onChange={(e) => updateExp(exp.id, "jobTitle", e.target.value)} className="h-8 text-sm" placeholder="e.g. Head Barista" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Company *</Label>
                    <Input value={exp.company} onChange={(e) => updateExp(exp.id, "company", e.target.value)} className="h-8 text-sm" placeholder="Company name" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Location</Label>
                    <Input value={exp.location} onChange={(e) => updateExp(exp.id, "location", e.target.value)} className="h-8 text-sm" placeholder="City, Country" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs mb-1 block">Start Date</Label>
                      <Input value={exp.startDate} onChange={(e) => updateExp(exp.id, "startDate", e.target.value)} className="h-8 text-sm" placeholder="Jan 2022" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">End Date</Label>
                      <Input value={exp.endDate} onChange={(e) => updateExp(exp.id, "endDate", e.target.value)} className="h-8 text-sm" placeholder="Present" disabled={exp.current} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`cur-${exp.id}`} checked={exp.current} onChange={(e) => updateExp(exp.id, "current", e.target.checked)} className="w-3.5 h-3.5" />
                  <label htmlFor={`cur-${exp.id}`} className="text-xs text-muted-foreground">Currently working here</label>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Description</Label>
                  <Textarea value={exp.description} onChange={(e) => updateExp(exp.id, "description", e.target.value)} rows={3} className="resize-none text-sm" placeholder="Key responsibilities and achievements..." />
                </div>
              </div>
            ))}
          </Section>

          {/* Education */}
          <Section icon={GraduationCap} title="Education" onAdd={addEdu} addLabel="Add Education">
            {cv.education.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">No education added yet.</p>
            )}
            {cv.education.map((edu) => (
              <div key={edu.id} className="border border-border rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeEdu(edu.id)} className="absolute top-3 end-3 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Degree / Certificate *</Label>
                    <Input value={edu.degree} onChange={(e) => updateEdu(edu.id, "degree", e.target.value)} className="h-8 text-sm" placeholder="e.g. Bachelor of Science" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">School / University *</Label>
                    <Input value={edu.school} onChange={(e) => updateEdu(edu.id, "school", e.target.value)} className="h-8 text-sm" placeholder="Institution name" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Field of Study</Label>
                    <Input value={edu.field} onChange={(e) => updateEdu(edu.id, "field", e.target.value)} className="h-8 text-sm" placeholder="e.g. Hospitality Management" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Graduation Year</Label>
                    <Input value={edu.year} onChange={(e) => updateEdu(edu.id, "year", e.target.value)} className="h-8 text-sm" placeholder="e.g. 2021" />
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Skills */}
          <Section icon={Wrench} title="Skills">
            <div className="flex flex-wrap gap-2 min-h-8">
              {cv.skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 text-xs pr-1.5">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                className="h-8 text-sm"
                placeholder="Type a skill and press Enter..."
              />
              <Button type="button" size="sm" variant="outline" onClick={addSkill} className="h-8 px-3 shrink-0">Add</Button>
            </div>
          </Section>

          {/* Languages */}
          <Section icon={FileText} title="Languages">
            {cv.languages.length > 0 && (
              <div className="space-y-2">
                {cv.languages.map((l, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/40 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium">{l.language}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{l.level}</span>
                      <button onClick={() => removeLang(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input value={langInput.language} onChange={(e) => setLangInput((l) => ({ ...l, language: e.target.value }))} className="h-8 text-sm" placeholder="Language (e.g. Arabic)" />
              <select
                value={langInput.level}
                onChange={(e) => setLangInput((l) => ({ ...l, level: e.target.value }))}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {["Native", "Fluent", "Advanced", "Intermediate", "Basic"].map((lv) => (
                  <option key={lv}>{lv}</option>
                ))}
              </select>
              <Button type="button" size="sm" variant="outline" onClick={addLang} className="h-8 px-3 shrink-0">Add</Button>
            </div>
          </Section>

          {/* Export CTA */}
          <div className="flex gap-3 pb-10">
            <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download CV
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setPreview(true)}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}