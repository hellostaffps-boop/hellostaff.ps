import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "../components/JobCard";
import EmptyState from "../components/EmptyState";

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

export default function BrowseJobs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", "published"],
    queryFn: () => base44.entities.Job.filter({ status: "published" }, "-created_date"),
  });

  const filtered = jobs.filter((job) => {
    const matchSearch = !search || job.title?.toLowerCase().includes(search.toLowerCase()) || job.organization_name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || job.job_type === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Browse Jobs</h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Find your next role in hospitality
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jobTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 sm:flex hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No jobs found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} showSave />
          ))}
        </div>
      )}
    </div>
  );
}