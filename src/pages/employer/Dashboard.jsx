import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Briefcase, FileText, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatsCard from "../../components/StatsCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Job.filter({ posted_by: user.email }, "-created_date", 5);
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const orgMembers = await base44.entities.OrganizationMember.filter({ user_email: user.email });
      if (orgMembers.length === 0) return [];
      return base44.entities.Application.filter({ organization_id: orgMembers[0].organization_id }, "-created_date", 10);
    },
  });

  const stats = [
    { icon: Briefcase, label: "Active Jobs", value: jobs.filter((j) => j.status === "published").length, trend: 5 },
    { icon: FileText, label: "Total Applications", value: applications.length, trend: 18 },
    { icon: Users, label: "Candidates Reviewed", value: 0 },
    { icon: Eye, label: "Job Views", value: 0 },
  ];

  return (
    <div>
      <PageHeader title="Employer Dashboard" description="Manage your jobs and candidates.">
        <Link to="/employer/post-job">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Post a Job
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-base mb-4">Recent Jobs</h2>
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs yet" description="Post your first job to start hiring." actionLabel="Post a Job" actionPath="/employer/post-job" />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">{job.status} · {job.applications_count || 0} applications</div>
                  </div>
                  <Link to="/employer/jobs" className="text-xs text-accent font-medium hover:underline">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-base mb-4">Recent Applications</h2>
          {applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" description="Applications will appear here once candidates apply to your jobs." />
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{app.candidate_name || app.candidate_email}</div>
                    <div className="text-xs text-muted-foreground mt-1">{app.job_title} · {app.status}</div>
                  </div>
                  <Link to="/employer/applications" className="text-xs text-accent font-medium hover:underline">Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}