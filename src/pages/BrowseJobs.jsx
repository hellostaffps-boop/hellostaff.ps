import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "../components/JobCard";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getPublishedJobs, getCandidateProfile, getCurrentCandidateApplications } from "@/lib/firestoreService";
import { useSavedJobs } from "@/hooks/useSavedJobs";

const INITIAL_FILTERS = { search: "", category: "all", employment: "all", location: "", sort: "newest" };

export default function BrowseJobs() {
  const { t } = useLanguage();
  const { firebaseUser, userProfile } = useFirebaseAuth();
  const isCandidate = userProfile?.role === "candidate";
  const { savedJobIds, toggleSave } = useSavedJobs();
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const hasActiveFilters = filters.search || filters.category !== "all" || filters.employment !== "all" || filters.location || filters.sort !== "newest";
  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const categories = [
    { value: "all", label: t("browseJobs", "allCategories") },
    { value: "barista", label: t("jobCard", "typeBarista") },
    { value: "chef", label: t("jobCard", "typeChef") },
    { value: "waiter", label: t("jobCard", "typeWaiter") },
    { value: "cashier", label: t("jobCard", "typeCashier") },
    { value: "host", label: t("jobCard", "typeHost") },
    { value: "cleaner", label: t("jobCard", "typeCleaner") },
    { value: "kitchen_helper", label: t("jobCard", "typeKitchenHelper") },
    { value: "restaurant_manager", label: t("jobCard", "typeManager") },
  ];

  const employmentTypes = [
    { value: "all", label: t("browseJobs", "allTypes") },
    { value: "full_time", label: t("jobCard", "empFullTime") },
    { value: "part_time", label: t("jobCard", "empPartTime") },
    { value: "contract", label: t("jobCard", "empContract") },
    { value: "temporary", label: t("jobCard", "empTemporary") },
  ];

  const sortOptions = [
    { value: "recommended", label: t("browseJobs", "sortRecommended") },
    { value: "newest", label: t("browseJobs", "sortNewest") },
    { value: "oldest", label: t("browseJobs", "sortOldest") },
    { value: "salary_high", label: t("browseJobs", "sortSalaryHigh") },
    { value: "salary_low", label: t("browseJobs", "sortSalaryLow") },
  ];

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const { data: candidateProfile } = useQuery({
    queryKey: ["my-candidate-profile", firebaseUser?.uid],
    queryFn: () => getCandidateProfile(firebaseUser.uid),
    enabled: !!firebaseUser && isCandidate,
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ["my-applications", firebaseUser?.uid],
    queryFn: () => getCurrentCandidateApplications(firebaseUser.uid),
    enabled: !!firebaseUser && isCandidate,
  });

  const appliedJobIds = useMemo(() => new Set(myApplications.map((a) => a.job_id)), [myApplications]);

  const filtered = useMemo(() => {
    let list = [...jobs];
    const q = filters.search.toLowerCase();
    if (q) {
      list = list.filter((j) =>
        j.title?.toLowerCase().includes(q) ||
        j.organization_name?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    if (filters.category !== "all") list = list.filter((j) => j.job_type === filters.category);
    if (filters.employment !== "all") list = list.filter((j) => j.employment_type === filters.employment);
    if (filters.location) list = list.filter((j) => j.location?.toLowerCase().includes(filters.location.toLowerCase()));

    list.sort((a, b) => {
      if (filters.sort === "oldest") return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
      if (filters.sort === "salary_high") return (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0);
      if (filters.sort === "salary_low") return (a.salary_min || 0) - (b.salary_min || 0);
      if (filters.sort === "recommended" && candidateProfile) {
        const score = (j) => {
          let s = 0;
          if (candidateProfile.preferred_roles?.includes(j.job_type)) s += 3;
          if (candidateProfile.city && j.location?.toLowerCase().includes(candidateProfile.city.toLowerCase())) s += 2;
          s += Math.max(0, 1 - ((Date.now() / 1000 - (j.created_at?.seconds || 0)) / (86400 * 30)));
          return s;
        };
        return score(b) - score(a);
      }
      return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0); // newest
    });
    return list;
  }, [jobs, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("browseJobs", "heading")}</h1>
        <p className="mt-3 text-muted-foreground text-lg">{t("browseJobs", "subtext")}</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("browseJobs", "searchPlaceholder")}
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="ps-10 h-11"
        />
        {filters.search && (
          <button onClick={() => set("search", "")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filters.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.employment} onValueChange={(v) => set("employment", v)}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{employmentTypes.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative flex-1 min-w-32">
          <Input
            placeholder={t("browseJobs", "locationPlaceholder")}
            value={filters.location}
            onChange={(e) => set("location", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <Select value={filters.sort} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <ArrowUpDown className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{sortOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" /> {t("browseJobs", "clearFilters")}
          </Button>
        )}
      </div>

      {/* Results meta */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground mb-5">
          {filtered.length} {t("browseJobs", "resultsCount")}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        jobs.length === 0 ? (
          <EmptyState icon={Search} title={t("browseJobs", "noJobsFound")} description={t("browseJobs", "noJobsFoundDesc")} />
        ) : (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-2">{t("browseJobs", "noResultsTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("browseJobs", "noResultsDesc")}</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>{t("browseJobs", "clearFilters")}</Button>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showSave={isCandidate}
              saved={savedJobIds.has(job.id)}
              applied={appliedJobIds.has(job.id)}
              onSave={(j) => toggleSave(j)}
            />
          ))}
        </div>
      )}
    </div>
  );
}