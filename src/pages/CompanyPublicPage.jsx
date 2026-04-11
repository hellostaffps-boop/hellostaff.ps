import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Globe, Phone, Mail, Instagram, Linkedin, MapPin, Calendar,
  ShieldCheck, Briefcase, ArrowLeft, Users, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/hooks/useLanguage";

const INDUSTRY_LABELS = {
  cafe: "Café", restaurant: "Restaurant", bar: "Bar", hotel: "Hotel",
  catering: "Catering", food_truck: "Food Truck", bakery: "Bakery", other: "Other",
};

const SIZE_LABELS = {
  "1-10": "1–10 employees", "11-50": "11–50 employees",
  "51-200": "51–200 employees", "200+": "200+ employees",
};

const EMP_TYPE = {
  full_time: "Full-time", part_time: "Part-time",
  contract: "Contract", temporary: "Temporary",
};

export default function CompanyPublicPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: org, isLoading } = useQuery({
    queryKey: ["public-org", id],
    queryFn: () => base44.entities.Organization.filter({ id }),
    select: (res) => res?.[0] || null,
    enabled: !!id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["public-org-jobs", id],
    queryFn: () => base44.entities.Job.filter({ organization_id: id, status: "published" }, "-created_date"),
    enabled: !!id,
  });

  usePageMeta(org ? {
    title: `${org.name} — ${INDUSTRY_LABELS[org.industry] || "Company"} Jobs`,
    description: org.description
      ? org.description.slice(0, 155)
      : `${jobs.length} open position${jobs.length !== 1 ? "s" : ""} at ${org.name}. Browse and apply today.`,
    image: org.logo_url || org.cover_image_url,
    url: window.location.href,
  } : {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Company not found</h2>
        <p className="text-muted-foreground mb-6">This company profile does not exist or has been removed.</p>
        <Link to="/jobs"><Button variant="outline">Browse Jobs</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          {isAr ? "العودة للوظائف" : "Back to Jobs"}
        </Link>
      </div>

      {/* Cover Image */}
      <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
        {org.cover_image_url
          ? <img src={org.cover_image_url} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary/30" />
              </div>
            </div>
        }
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 pb-16">
        {/* Logo + Identity */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-white shadow-sm bg-secondary/20 overflow-hidden shrink-0 -mt-12 ring-4 ring-white">
              {org.logo_url
                ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain p-1" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {org.name?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold truncate">{org.name}</h1>
                {org.verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3 h-3" /> {isAr ? "موثق" : "Verified"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {org.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {INDUSTRY_LABELS[org.industry] || org.industry}
                  </span>
                )}
                {org.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {org.city}
                  </span>
                )}
                {org.size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {SIZE_LABELS[org.size] || org.size}
                  </span>
                )}
                {org.founded_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {isAr ? `تأسست ${org.founded_year}` : `Est. ${org.founded_year}`}
                  </span>
                )}
              </div>

              {/* Social + Contact */}
              <div className="flex flex-wrap gap-2 mt-3">
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                    <Globe className="w-3.5 h-3.5" /> {isAr ? "الموقع" : "Website"}
                  </a>
                )}
                {org.instagram_url && (
                  <a href={org.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-pink-600 hover:underline">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {org.linkedin_url && (
                  <a href={org.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {org.phone && (
                  <a href={`tel:${org.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Phone className="w-3.5 h-3.5" /> {org.phone}
                  </a>
                )}
                {org.email && (
                  <a href={`mailto:${org.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Mail className="w-3.5 h-3.5" /> {org.email}
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 hidden sm:block">
              <Link to={`/jobs?company=${id}`}>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {isAr ? `${jobs.length} وظيفة` : `${jobs.length} Job${jobs.length !== 1 ? "s" : ""}`}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* About */}
            {org.description && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-base mb-3">{isAr ? "عن الشركة" : "About"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{org.description}</p>
              </div>
            )}

            {/* Culture Video */}
            {org.video_url && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-base mb-3">{isAr ? "فيديو الشركة" : "Culture Video"}</h2>
                <div className="rounded-xl overflow-hidden border border-border aspect-video">
                  <iframe src={org.video_url} className="w-full h-full" allowFullScreen title="Company video" />
                </div>
              </div>
            )}

            {/* Team Photos */}
            {org.team_photos?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-base mb-3">{isAr ? "صور الفريق" : "Team Photos"}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {org.team_photos.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-secondary/20">
                      <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Positions */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-base mb-4">
                {isAr ? "الوظائف المتاحة" : "Open Positions"}
                <span className="ms-2 text-xs text-muted-foreground font-normal">({jobs.length})</span>
              </h2>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد وظائف متاحة حالياً" : "No open positions at the moment"}
                </p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Link key={job.id} to={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors group">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-accent transition-colors">{job.title}</div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {job.employment_type && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {EMP_TYPE[job.employment_type] || job.employment_type}
                            </Badge>
                          )}
                          {job.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {job.location}
                            </span>
                          )}
                          {(job.salary_min || job.salary_max) && (
                            <span className="text-xs text-muted-foreground">
                              {job.salary_min && `${job.salary_min}`}
                              {job.salary_min && job.salary_max && "–"}
                              {job.salary_max && `${job.salary_max}`}
                              {job.salary_period && ` / ${job.salary_period}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ms-3 group-hover:text-accent transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Culture Values */}
            {org.culture_values?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-5">
                <h2 className="font-semibold text-sm mb-3">{isAr ? "قيم العمل" : "Culture & Values"}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {org.culture_values.map((v) => (
                    <span key={v} className="text-xs bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Perks */}
            {org.perks?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-5">
                <h2 className="font-semibold text-sm mb-3">{isAr ? "المزايا والمكافآت" : "Perks & Benefits"}</h2>
                <ul className="space-y-2">
                  {org.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-sm">{isAr ? "معلومات سريعة" : "Quick Info"}</h2>
              {org.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{org.address}{org.city && `, ${org.city}`}</span>
                </div>
              )}
              {org.size && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{SIZE_LABELS[org.size]}</span>
                </div>
              )}
              {org.founded_year && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{isAr ? `تأسست عام ${org.founded_year}` : `Founded ${org.founded_year}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}