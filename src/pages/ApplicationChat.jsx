import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { getApplicationById } from "@/lib/supabaseService";
import { getInterviewSlot } from "@/lib/interviewSlotService";
import { Badge } from "@/components/ui/badge";
import MessageThread from "@/components/MessageThread";

const STATUS_COLORS = {
  pending:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewing:   "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered:     "bg-green-50 text-green-700 border-green-200",
  rejected:    "bg-red-50 text-red-700 border-red-200",
  withdrawn:   "bg-gray-50 text-gray-700 border-gray-200",
};

export default function ApplicationChat() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const { user, userProfile } = useAuth();

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id),
    enabled: !!id && !!user,
  });

  const { data: interviewSlot } = useQuery({
    queryKey: ["interview-slot", id],
    queryFn: () => getInterviewSlot(id),
    enabled: !!id,
  });

  const role = userProfile?.role;
  const isCandidate = role === "candidate";
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
        <p className="text-muted-foreground">{isAr ? "الطلب غير موجود" : "Application not found"}</p>
        <Link to={backPath} className="text-sm text-accent hover:underline mt-4 block">{isAr ? "رجوع" : "Go Back"}</Link>
      </div>
    );
  }

  if (isCandidate && application.candidate_email !== user?.email) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{isAr ? "غير مصرح" : "Access denied"}</p>
      </div>
    );
  }

  const otherParty = isCandidate
    ? application.organization_name
    : (application.candidate_name || application.candidate_email);

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col"
      style={{ height: "calc(100vh - 4rem)" }}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <Link to={backPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          {isAr ? "رجوع" : "Back"}
        </Link>

        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-semibold text-base">{application.job_title}</h1>
                <p className="text-sm text-muted-foreground">{otherParty}</p>
              </div>
            </div>
            <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[application.status] || "bg-secondary"}`}>
              {application.status}
            </Badge>
          </div>

          {/* Interview slot info if confirmed */}
          {interviewSlot?.status === "confirmed" && interviewSlot.selected_slot && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-green-700">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">
                {isAr ? "مقابلة مؤكدة: " : "Interview: "}
                {new Date(interviewSlot.selected_slot).toLocaleString(isAr ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {interviewSlot.location && (
                <span className="flex items-center gap-1 text-green-600">
                  <MapPin className="w-3 h-3" />{interviewSlot.location}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-border p-4 flex-1 flex flex-col min-h-0">
        {user ? (
          <MessageThread
            applicationId={id}
            currentUser={user}
            senderRole={role}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isAr ? "يجب تسجيل الدخول للدردشة" : "Please log in to chat"}
          </p>
        )}
      </div>
    </div>
  );
}