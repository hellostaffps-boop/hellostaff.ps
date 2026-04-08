import { Bookmark } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";

export default function SavedJobs() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader title={t("savedJobs", "title")} description={t("savedJobs", "subtext")} />
      <EmptyState
        icon={Bookmark}
        title={t("savedJobs", "noSaved")}
        description={t("savedJobs", "noSavedDesc")}
        actionLabel={t("savedJobs", "browseJobs")}
        actionPath="/candidate/jobs"
      />
    </div>
  );
}