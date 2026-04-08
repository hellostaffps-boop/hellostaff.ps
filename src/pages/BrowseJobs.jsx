import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "../components/JobCard";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { getPublishedJobs } from "@/lib/firestoreService";

export default function BrowseJobs() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const jobTypes = [
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

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const filtered = jobs.filter((job) => {
    const matchSearch = !search ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.organization_name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || job.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("browseJobs", "heading")}</h1>
        <p className="mt-3 text-muted-foreground text-lg">{t("browseJobs", "subtext")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("browseJobs", "searchPlaceholder")} value={search}
            onChange={(e) => setSearch(e.target.value)} className="ps-10 h-11" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {jobTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-11 w-11 sm:flex hidden">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("browseJobs", "noJobsFound")} description={t("browseJobs", "noJobsFoundDesc")} />
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => <JobCard key={job.id} job={job} showSave />)}
        </div>
      )}
    </div>
  );
}