import { Zap, Shield, Clock, Globe, BarChart3, Heart, Users, Briefcase } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const { t } = useLanguage();

  const workerFeatures = [
    { icon: Zap, title: t("features", "quickApplyTitle"), desc: t("features", "quickApplyDesc") },
    { icon: Shield, title: t("features", "verifiedTitle"), desc: t("features", "verifiedDesc") },
    { icon: Clock, title: t("features", "flexibleTitle"), desc: t("features", "flexibleDesc") },
    { icon: Globe, title: t("features", "localTitle"), desc: t("features", "localDesc") },
  ];

  const employerFeatures = [
    { icon: Users, title: t("features", "talentTitle"), desc: t("features", "talentDesc") },
    { icon: Briefcase, title: t("features", "matchingTitle"), desc: t("features", "matchingDesc") },
    { icon: BarChart3, title: t("features", "analyticsTitle"), desc: t("features", "analyticsDesc") },
    { icon: Heart, title: t("features", "brandingTitle"), desc: t("features", "brandingDesc") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Worker features */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-accent mb-3">
              {t("features", "forWorkersLabel")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("features", "forWorkersHeading")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t("features", "forWorkersSubtext")}
            </p>
            <div className="space-y-6">
              {workerFeatures.map((f, i) => <FeatureCard key={i} {...f} />)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary to-accent/5 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{t("features", "workerPreview")}</span>
          </div>
        </div>

        {/* Employer features */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-gradient-to-br from-secondary to-primary/5 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{t("features", "employerPreview")}</span>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-accent mb-3">
              {t("features", "forEmployersLabel")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("features", "forEmployersHeading")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t("features", "forEmployersSubtext")}
            </p>
            <div className="space-y-6">
              {employerFeatures.map((f, i) => <FeatureCard key={i} {...f} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}