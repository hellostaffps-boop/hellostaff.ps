import { useQuery } from "@tanstack/react-query";
import { User, MapPin, Phone, Mail, Edit, Briefcase, GraduationCap, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import ProfileCompletionCard from "../../components/ProfileCompletionCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getCandidateProfile } from "@/lib/firestoreService";
import { getCandidateCompletion } from "@/lib/profileCompletion";

export default function Profile() {
  const { t } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();

  const typeLabels = {
    barista: t("jobCard", "typeBarista"),
    chef: t("jobCard", "typeChef"),
    waiter: t("jobCard", "typeWaiter"),
    cashier: t("jobCard", "typeCashier"),
    host: t("jobCard", "typeHost"),
    cleaner: t("jobCard", "typeCleaner"),
    kitchen_helper: t("jobCard", "typeKitchenHelper"),
    restaurant_manager: t("jobCard", "typeManager"),
  };

  const availabilityLabel = {
    full_time: t("editProfile", "fullTime"),
    part_time: t("editProfile", "partTime"),
    flexible: t("editProfile", "flexible"),
    weekends_only: t("editProfile", "weekendsOnly"),
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-candidate-profile", firebaseUser?.uid],
    queryFn: () => getCandidateProfile(firebaseUser.uid),
    enabled: !!firebaseUser,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || !profile.headline) {
    return (
      <div>
        <PageHeader title={t("profile", "title")} />
        <EmptyState icon={User} title={t("profile", "noProfile")} description={t("profile", "noProfileDesc")}
          actionLabel={t("profile", "createProfile")} actionPath="/candidate/profile/edit" />
      </div>
    );
  }

  const completion = getCandidateCompletion(profile);
  const sectionClass = "bg-white rounded-2xl border border-border p-6 mb-4";

  return (
    <div>
      <PageHeader title={t("profile", "title")}>
        <Link to="/candidate/profile/edit">
          <Button size="sm" variant="outline" className="gap-2">
            <Edit className="w-4 h-4" /> {t("profile", "editProfile")}
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-4">
        <ProfileCompletionCard
          score={completion.score}
          missing={completion.missing}
          editPath="/candidate/profile/edit"
          type="candidate"
        />
      </div>

      {/* Header card */}
      <div className={sectionClass}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{profile.headline}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>}
              {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone}</span>}
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {firebaseUser?.email}</span>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              {profile.years_experience != null && (
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{profile.years_experience}</span>{" "}
                  {t("profile", "experienceYears")}
                </span>
              )}
              {profile.availability && (
                <span className="text-muted-foreground">
                  {availabilityLabel[profile.availability] || profile.availability}
                </span>
              )}
            </div>
          </div>
          {profile.cv_url && (
            <a href={profile.cv_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-2 shrink-0">
                <FileText className="w-4 h-4" />
                {t("editProfile", "viewCV") || "View CV"}
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          )}
        </div>

        {profile.bio && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">{t("profile", "about")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm mb-3">{t("profile", "skills")}</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
          </div>
        </div>
      )}

      {/* Job Preferences */}
      {profile.preferred_roles?.length > 0 && (
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm mb-3">{t("profile", "jobCategories")}</h3>
          <div className="flex flex-wrap gap-2">
            {profile.preferred_roles.map((type) => (
              <Badge key={type} variant="secondary">{typeLabels[type] || type}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {profile.work_experience?.length > 0 && (
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> {t("editProfile", "workExperience") || "Work Experience"}
          </h3>
          <div className="space-y-4">
            {profile.work_experience.map((exp, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{exp.title}</div>
                  <div className="text-sm text-muted-foreground">{exp.company}</div>
                  {(exp.from || exp.to) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {exp.from} {exp.to || exp.current ? "—" : ""} {exp.current ? (t("editProfile", "present") || "Present") : exp.to}
                    </div>
                  )}
                  {exp.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education?.length > 0 && (
        <div className={sectionClass}>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> {t("editProfile", "education") || "Education"}
          </h3>
          <div className="space-y-4">
            {profile.education.map((edu, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{edu.degree}</div>
                  <div className="text-sm text-muted-foreground">{edu.institution}</div>
                  {edu.year && <div className="text-xs text-muted-foreground mt-0.5">{edu.year}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}