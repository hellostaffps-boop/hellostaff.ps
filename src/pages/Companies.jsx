import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/hooks/useLanguage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { MapPin, Briefcase, ShieldCheck, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

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

export default function Companies() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const [searchTerm, setSearchTerm] = useState("");

  usePageMeta({
    title: isAr ? "المنشآت | هيلو ستاف" : "Companies | Hello Staff",
    description: isAr ? "تصفح أفضل المطاعم والمقاهي واكتشف الفرص الوظيفية المتاحة." : "Browse top restaurants and cafes and discover job opportunities.",
  });

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "active")
        .order("verified", { ascending: false })
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: jobCounts = {} } = useQuery({
    queryKey: ["all-org-job-counts", orgs.map(o => o.id).join(",")],
    enabled: orgs.length > 0,
    queryFn: async () => {
      const { data: jobs } = await supabase.from("jobs").select("organization_id").eq("status", "published");
      const counts = {};
      (jobs || []).forEach(j => { counts[j.organization_id] = (counts[j.organization_id] || 0) + 1; });
      return counts;
    },
  });

  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return orgs;
    const lower = searchTerm.toLowerCase();
    return orgs.filter(org => 
      org.name?.toLowerCase().includes(lower) || 
      org.city?.toLowerCase().includes(lower) ||
      org.industry?.toLowerCase().includes(lower)
    );
  }, [orgs, searchTerm]);

  return (
    <div className="min-h-screen bg-secondary/30 pb-16" dir={isAr ? "rtl" : "ltr"}>
      {/* Header section */}
      <div className="bg-primary pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Building2 className="w-12 h-12 text-primary-foreground/80 mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight mb-4">
            {isAr ? "المنشآت المشاركة" : "Our Companies"}
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            {isAr 
              ? "استكشف أفضل المطاعم والمقاهي في المنطقة وابحث عن وظيفتك القادمة."
              : "Discover the top restaurants and cafes in the region and find your next job."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Search & Filter */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
            <Input 
              placeholder={isAr ? "ابحث عن مطعم، مقهى، أو مدينة..." : "Search by company or city..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isAr ? "لم يتم العثور على منشآت" : "No companies found"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isAr ? "حاول تعديل كلمات البحث الخاصة بك" : "Try adjusting your search terms"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrgs.map((org) => (
              <Link
                key={org.id}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate group-hover:text-accent transition-colors">
                        {org.name}
                      </h3>
                      {org.verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {INDUSTRY_LABELS[org.industry] || org.industry || ""}
                    </span>
                  </div>
                </div>

                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  {org.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {org.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {jobCounts[org.id] || 0} {isAr ? "وظيفة" : "jobs"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
