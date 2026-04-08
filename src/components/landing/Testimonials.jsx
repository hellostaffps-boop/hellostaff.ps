import { Star } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function Testimonials() {
  const { t } = useLanguage();

  const testimonials = [
    { name: t("testimonials", "t1Name"), role: t("testimonials", "t1Role"), text: t("testimonials", "t1Text") },
    { name: t("testimonials", "t2Name"), role: t("testimonials", "t2Role"), text: t("testimonials", "t2Text") },
    { name: t("testimonials", "t3Name"), role: t("testimonials", "t3Role"), text: t("testimonials", "t3Text") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("testimonials", "heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("testimonials", "subtext")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div key={i} className="bg-secondary/30 rounded-2xl p-8 border border-border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-6">"{item.text}"</p>
              <div>
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}