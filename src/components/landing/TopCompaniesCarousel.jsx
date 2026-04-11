import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Briefcase } from "lucide-react";

const INDUSTRY_LABELS = {
  cafe: "☕ كافيه",
  restaurant: "🍽️ مطعم",
  bar: "🍹 بار",
  hotel: "🏨 فندق",
  catering: "🍱 تموين",
  food_truck: "🚚 فود تراك",
  bakery: "🥐 مخبز",
  other: "🏢 أخرى",
};

export default function TopCompaniesCarousel() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["top-companies"],
    queryFn: async () => {
      const all = await base44.entities.Organization.filter({ status: "active", verified: true });
      // fallback: if no verified ones, get any active
      if (all.length === 0) {
        return await base44.entities.Organization.filter({ status: "active" });
      }
      return all.slice(0, 12);
    },
  });

  const { data: jobCounts = {} } = useQuery({
    queryKey: ["org-job-counts", orgs.map(o => o.id).join(",")],
    enabled: orgs.length > 0,
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ status: "published" });
      const counts = {};
      jobs.forEach(j => { counts[j.organization_id] = (counts[j.organization_id] || 0) + 1; });
      return counts;
    },
  });

  const items = orgs;
  const total = items.length;

  // visible cards based on screen (we'll handle via CSS)
  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  useEffect(() => {
    if (total < 2) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  const resetTimer = (fn) => {
    clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(next, 4000);
  };

  if (isLoading) return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="h-8 bg-secondary rounded w-64 mx-auto mb-3" />
          <div className="h-4 bg-secondary rounded w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-secondary rounded w-full" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (total === 0) return (
    <section className="py-16 bg-secondary/30" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          {isAr ? "أبرز المنشآت على المنصة" : "Top Companies on Hello Staff"}
        </h2>
        <p className="text-muted-foreground">
          {isAr ? "ستظهر أفضل المنشآت هنا قريباً" : "Top companies will appear here soon"}
        </p>
      </div>
    </section>
  );

  // Show 3 cards on desktop, 1 on mobile
  const getVisible = () => {
    const visible = [];
    for (let i = 0; i < Math.min(3, total); i++) {
      visible.push(items[(current + i) % total]);
    }
    return visible;
  };

  return (
    <section className="py-16 bg-secondary/30" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isAr ? "أبرز المنشآت على المنصة" : "Top Companies on Hello Staff"}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            {isAr ? "انضم لأفضل بيئات العمل في قطاع الضيافة" : "Join the best hospitality workplaces"}
          </p>
        </div>

        <div className="relative">
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getVisible().map((org, idx) => (
              <Link
                key={org.id + idx}
                to={`/company/${org.id}`}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-accent/40 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-14 h-14 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-accent transition-colors">
                      {org.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {INDUSTRY_LABELS[org.industry] || org.industry || ""}
                    </span>
                  </div>
                  {org.verified && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium shrink-0">
                      {isAr ? "موثّق" : "Verified"}
                    </span>
                  )}
                </div>

                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
                  {org.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {org.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {jobCounts[org.id] || 0} {isAr ? "وظيفة" : "jobs"}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation */}
          {total > 3 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => resetTimer(prev)}
                className="w-9 h-9 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => resetTimer(() => setCurrent(i))}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-6 bg-accent" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => resetTimer(next)}
                className="w-9 h-9 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}