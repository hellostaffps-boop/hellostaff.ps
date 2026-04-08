import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "../../components/JobCard";
import EmptyState from "../../components/EmptyState";
import PageHeader from "../../components/PageHeader";

const jobTypes = [
  { value: "all", label: "All Categories" },
  { value: "barista", label: "Barista" },
  { value: "chef", label: "Chef" },
  { value: "waiter", label: "Waiter" },
  { value: "cashier", label: "Cashier" },
  { value: "host", label: "Host" },
  { value: "cleaner", label: "Cleaner" },
  { value: "kitchen_helper", label: "Kitchen Helper" },
  { value: "restaurant_manager", label: "Manager" },
];

export default function CandidateJobs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["candidate-jobs"],
    queryFn: () => base44.entities.Job.filter({ status: "published" }, "-created_date"),
  });

  const filtered = jobs.filter((job) => {
    const matchSearch = !search || job.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || job.job_type === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <PageHeader title="Browse Jobs" description="Find your next opportunity" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {jobTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No jobs found" description="Try adjusting your search or check back later." />
      ) : (
        <div className="grid gap-4">{filtered.map((j) => <JobCard key={j.id} job={j} showSave />)}</div>
      )}
    </div>
  );
}