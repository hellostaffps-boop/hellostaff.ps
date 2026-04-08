import { Target, Heart, Users, Award } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const valueIcons = [Target, Heart, Users, Award];
const valueKeys = ["val1", "val2", "val3", "val4"];

export default function About() {
  const { t } = useLanguage();

  const values = valueKeys.map((key, i) => ({
    icon: valueIcons[i],
    title: t("about", `${key}Title`),
    desc: t("about", `${key}Desc`),
  }));

  return (
    <div>
      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            {t("about", "heading")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("about", "subtext")}
          </p>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">{t("about", "ourValues")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-accent">2026</div>
              <div className="text-sm text-muted-foreground mt-2">{t("about", "founded")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">25+</div>
              <div className="text-sm text-muted-foreground mt-2">{t("about", "teamMembers")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">3</div>
              <div className="text-sm text-muted-foreground mt-2">{t("about", "countries")}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}