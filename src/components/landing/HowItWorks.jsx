import { UserPlus, Search, Send, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const stepIcons = [UserPlus, Search, Send, CheckCircle];

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { icon: stepIcons[0], title: t("howItWorks", "step1Title"), description: t("howItWorks", "step1Desc") },
    { icon: stepIcons[1], title: t("howItWorks", "step2Title"), description: t("howItWorks", "step2Desc") },
    { icon: stepIcons[2], title: t("howItWorks", "step3Title"), description: t("howItWorks", "step3Desc") },
    { icon: stepIcons[3], title: t("howItWorks", "step4Title"), description: t("howItWorks", "step4Desc") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("howItWorks", "heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("howItWorks", "subtext")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}