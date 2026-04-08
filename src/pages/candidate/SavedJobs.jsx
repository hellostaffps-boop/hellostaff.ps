import { Bookmark } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

export default function SavedJobs() {
  return (
    <div>
      <PageHeader title="Saved Jobs" description="Jobs you've bookmarked for later" />
      <EmptyState
        icon={Bookmark}
        title="No saved jobs yet"
        description="When you find a job you're interested in, save it here to apply later."
        actionLabel="Browse Jobs"
        actionPath="/candidate/jobs"
      />
    </div>
  );
}