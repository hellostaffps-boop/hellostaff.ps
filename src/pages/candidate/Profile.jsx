import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { User, MapPin, Phone, Mail, Briefcase, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

const typeLabels = {
  barista: "Barista", chef: "Chef", waiter: "Waiter", cashier: "Cashier",
  host: "Host", cleaner: "Cleaner", kitchen_helper: "Kitchen Helper", restaurant_manager: "Manager",
};

export default function Profile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.CandidateProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title="My Profile" />
        <EmptyState
          icon={User}
          title="No profile yet"
          description="Create your profile to start applying to jobs and get discovered by employers."
          actionLabel="Create Profile"
          actionPath="/candidate/profile/edit"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Profile">
        <Link to="/candidate/profile/edit">
          <Button size="sm" variant="outline" className="gap-2">
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.headline || "Hospitality Professional"}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>}
              {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone}</span>}
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.user_email}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.job_types?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-3">Job Categories</h3>
            <div className="flex flex-wrap gap-2">
              {profile.job_types.map((t) => (
                <Badge key={t} variant="secondary">{typeLabels[t] || t}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile.skills?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-sm mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8 text-sm">
          {profile.experience_years != null && (
            <div>
              <div className="text-muted-foreground">Experience</div>
              <div className="font-semibold">{profile.experience_years} years</div>
            </div>
          )}
          {profile.availability && (
            <div>
              <div className="text-muted-foreground">Availability</div>
              <div className="font-semibold capitalize">{profile.availability.replace(/_/g, " ")}</div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="font-semibold capitalize">{profile.status || "Active"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}