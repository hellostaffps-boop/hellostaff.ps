import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";
import { useLanguage } from "@/hooks/useLanguage";
import { getPublishedJobs } from "@/lib/firestoreService";

export default function CandidateJobs() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const jobTypes = [
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

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["published-jobs"],
    queryFn: getPublishedJobs,
  });

  const filtered = jobs.filter((job) => {
    const matchSearch = !search || job.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || job.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <PageHeader title={t("candidateJobs", "title")} description={t("candidateJobs", "subtext")} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("candidateJobs", "searchPlaceholder")} value={search}
            onChange={(e) => setSearch(e.target.value)} className="ps-10" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {jobTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("candidateJobs", "noJobsFound")} description={t("candidateJobs", "noJobsFoundDesc")} />
      ) : (
        <div className="grid gap-4">{filtered.map((j) => <JobCard key={j.id} job={j} showSave />)}</div>
      )}
    </div>
  );
}