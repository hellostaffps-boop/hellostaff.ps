import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { getPublishedJobs } from "@/lib/firestoreService";

const DEFAULT_FILTERS = {
  search: "",
  location: "",
  jobType: "all",
  employmentType: "all",
  salaryMin: 0,
  salaryMax: 0,
};

export default function CandidateJobs() {
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [salaryRange, setSalaryRange] = useState([0, 10000]);

  const set = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const jobTypeOptions = [
    { value: "all", label: t("candidateJobs", "allCategories") },
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
    { value: "all", label: t("candidateJobs", "allTypes") || "All Types" },
    { value: "full_time", label: t("jobCard", "empFullTime") },
    { value: "part_time", label: t("jobCard", "empPartTime") },
    { value: "contract", label: t("jobCard", "empContract") },
    { value: "temporary", label: t("jobCard", "empTemporary") },
  ];

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const filtered = useMemo(() => {
    const kw = filters.search.toLowerCase();
    const loc = filters.location.toLowerCase();
    return jobs.filter((job) => {
      if (kw && !job.title?.toLowerCase().includes(kw) && !job.organization_name?.toLowerCase().includes(kw)) return false;
      if (loc && !job.location?.toLowerCase().includes(loc)) return false;
      if (filters.jobType !== "all" && job.job_type !== filters.jobType) return false;
      if (filters.employmentType !== "all" && job.employment_type !== filters.employmentType) return false;
      if (salaryRange[0] > 0 && (job.salary_min || 0) < salaryRange[0]) return false;
      if (salaryRange[1] < 10000 && (job.salary_max || job.salary_min || 0) > salaryRange[1]) return false;
      return true;
    });
  }, [jobs, filters, salaryRange]);

  const activeFiltersCount = [
    filters.search,
    filters.location,
    filters.jobType !== "all",
    filters.employmentType !== "all",
    salaryRange[0] > 0 || salaryRange[1] < 10000,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSalaryRange([0, 10000]);
  };

  return (
    <div>
      <PageHeader title={t("candidateJobs", "title")} description={t("candidateJobs", "subtext")} />

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("candidateJobs", "searchPlaceholder")}
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="ps-10"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("candidateJobs", "filters") || "Filters"}
          {activeFiltersCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            {t("candidateJobs", "clearAll") || "Clear"}
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-border rounded-2xl p-5 mb-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              {t("candidateJobs", "locationFilter") || "Location"}
            </Label>
            <Input
              placeholder={t("candidateJobs", "locationPlaceholder") || "City or area..."}
              value={filters.location}
              onChange={(e) => set("location", e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              {t("candidateJobs", "jobTypeFilter") || "Job Category"}
            </Label>
            <Select value={filters.jobType} onValueChange={(v) => set("jobType", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {jobTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              {t("candidateJobs", "employmentType") || "Employment Type"}
            </Label>
            <Select value={filters.employmentType} onValueChange={(v) => set("employmentType", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {employmentTypes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              {t("candidateJobs", "salaryRange") || "Salary Range"}
              <span className="text-muted-foreground ms-1 font-normal">
                {salaryRange[0]} – {salaryRange[1] >= 10000 ? "∞" : salaryRange[1]}
              </span>
            </Label>
            <div className="pt-2 px-1">
              <Slider
                min={0}
                max={10000}
                step={200}
                value={salaryRange}
                onValueChange={setSalaryRange}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>{t("candidateJobs", "anyAmount") || "Any"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.search && (
            <Badge variant="secondary" className="gap-1 pe-1">
              "{filters.search}"
              <button onClick={() => set("search", "")}><X className="w-3 h-3 ms-1 hover:text-destructive" /></button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="gap-1 pe-1">
              📍 {filters.location}
              <button onClick={() => set("location", "")}><X className="w-3 h-3 ms-1 hover:text-destructive" /></button>
            </Badge>
          )}
          {filters.jobType !== "all" && (
            <Badge variant="secondary" className="gap-1 pe-1">
              {jobTypeOptions.find(o => o.value === filters.jobType)?.label}
              <button onClick={() => set("jobType", "all")}><X className="w-3 h-3 ms-1 hover:text-destructive" /></button>
            </Badge>
          )}
          {filters.employmentType !== "all" && (
            <Badge variant="secondary" className="gap-1 pe-1">
              {employmentTypes.find(o => o.value === filters.employmentType)?.label}
              <button onClick={() => set("employmentType", "all")}><X className="w-3 h-3 ms-1 hover:text-destructive" /></button>
            </Badge>
          )}
          {(salaryRange[0] > 0 || salaryRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1 pe-1">
              💰 {salaryRange[0]}–{salaryRange[1] >= 10000 ? "∞" : salaryRange[1]}
              <button onClick={() => setSalaryRange([0, 10000])}><X className="w-3 h-3 ms-1 hover:text-destructive" /></button>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} {t("candidateJobs", "resultsFound") || "results found"}
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("candidateJobs", "noJobsFound")}
          description={t("candidateJobs", "noJobsFoundDesc")}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((j) => <JobCard key={j.id} job={j} showSave />)}
        </div>
      )}
    </div>
  );
}