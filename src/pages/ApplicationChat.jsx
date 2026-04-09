import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationById } from "@/lib/firestoreService";
import { Badge } from "@/components/ui/badge";
import MessageThread from "@/components/MessageThread";

const STATUS_COLORS = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-green-50 text-green-700 border-green-200",
};

export default function ApplicationChat() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { firebaseUser, userProfile } = useFirebaseAuth();

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id),
    enabled: !!id && !!firebaseUser,
  });

  const role = userProfile?.role;
  const isCandidate = role === "candidate";
  const isEmployer = role === "employer_owner" || role === "employer_manager";

  // Security: candidate can only view their own app; employer scoping handled server-side via message ownership
  const backPath = isCandidate ? "/candidate/applications" : "/employer/applications";

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{t("messaging", "notFound")}</p>
        <Link to={backPath} className="text-sm text-accent hover:underline mt-4 block">{t("messaging", "back")}</Link>
      </div>
    );
  }

  // Guard: candidate can only see their own application chat
  if (isCandidate && application.candidate_user_id !== firebaseUser?.uid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{t("messaging", "forbidden")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-5 flex-shrink-0">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t("messaging", "back")}
        </Link>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-base">{application.job_title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isCandidate ? application.organization_name : application.candidate_name || application.candidate_email}
                </p>
              </div>
            </div>
            <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[application.status] || "bg-secondary"}`}>
              {t("status", application.status) || application.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-border p-5 flex-1 flex flex-col min-h-0">
        {firebaseUser ? (
          <MessageThread
            applicationId={id}
            currentUser={firebaseUser}
            senderRole={role}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("messaging", "loginRequired")}</p>
        )}
      </div>
    </div>
  );
}