import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const reasonKeys = ["reason1", "reason2", "reason3", "reason4", "reason5", "reason6"];

export default function WhySection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("why", "heading")}
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-8 leading-relaxed">
              {t("why", "subtext")}
            </p>
            <div className="space-y-4">
              {reasonKeys.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">{t("why", key)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary-foreground/5 rounded-2xl h-80 flex items-center justify-center border border-primary-foreground/10">
            <span className="text-primary-foreground/40 text-sm">{t("why", "statsLabel")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}