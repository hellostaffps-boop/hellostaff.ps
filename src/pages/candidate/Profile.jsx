import { useQuery } from "@tanstack/react-query";
import { User, MapPin, Phone, Mail, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getCandidateProfile } from "@/lib/firestoreService";

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

  return (
    <div>
      <PageHeader title={t("profile", "title")}>
        <Link to="/candidate/profile/edit">
          <Button size="sm" variant="outline" className="gap-2">
            <Edit className="w-4 h-4" /> {t("profile", "editProfile")}
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.headline || t("profile", "defaultHeadline")}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>}
              {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone}</span>}
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {firebaseUser?.email}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-2">{t("profile", "about")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.preferred_roles?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-3">{t("profile", "jobCategories")}</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_roles.map((type) => (
                <Badge key={type} variant="secondary">{typeLabels[type] || type}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile.skills?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-3">{t("profile", "skills")}</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          </div>
        )}

        <div className="flex gap-8 text-sm">
          {profile.years_experience != null && (
            <div>
              <div className="text-muted-foreground">{t("profile", "experience")}</div>
              <div className="font-semibold">{profile.years_experience} {t("profile", "experienceYears")}</div>
            </div>
          )}
          {profile.availability && (
            <div>
              <div className="text-muted-foreground">{t("profile", "availability")}</div>
              <div className="font-semibold">{t("status", profile.availability) || profile.availability}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}