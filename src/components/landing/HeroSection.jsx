import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-accent/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              {t("hero", "badge")}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {t("hero", "headline1")}
            <span className="text-accent">{t("hero", "headlineAccent1")}</span>{t("hero", "headline2")}
            <span className="text-accent">{t("hero", "headlineAccent2")}</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("hero", "subtext")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/jobs">
              <Button size="lg" className="h-12 px-8 text-base gap-2">
              {t("hero", "findJob")}
              <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/employer/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-2"
              >
                {t("hero", "postJob")}
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">2,400+</div>
              <div>{t("hero", "activeJobs")}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">8,500+</div>
              <div>{t("hero", "workers")}</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">1,200+</div>
              <div>{t("hero", "businesses")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}