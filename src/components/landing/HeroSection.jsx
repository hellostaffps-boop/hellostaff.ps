import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { useQuery } from "@tanstack/react-query";
import { getPlatformStats } from "@/lib/supabaseService";
import { IS_DEMO, DEMO_STATS } from "@/lib/demoData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function HeroSection() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const isEmployer = role === "employer_owner" || role === "employer_manager";
  const isCandidate = role === "candidate";

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: getPlatformStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: IS_DEMO ? DEMO_STATS : undefined,
  });
  
  const displayStats = IS_DEMO ? DEMO_STATS : (stats || { jobs: 0, candidates: 0, organizations: 0 });
  
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-accent/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              {t("hero", "badge")}
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            {t("hero", "headline1")}
            <span className="text-gradient relative inline-block mx-2">
              {t("hero", "headlineAccent1")}
            </span>
            {t("hero", "headline2")}
            <span className="text-gradient relative inline-block mx-2">
              {t("hero", "headlineAccent2")}
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("hero", "subtext")}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isEmployer && (
              <Link to={isCandidate ? "/candidate" : "/jobs"}>
                <Button size="lg" className="h-14 px-8 text-base gap-2 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">
                  {isCandidate ? t("nav", "dashboard") || "لوحة التحكم" : t("hero", "findJob")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {!isCandidate && (
              <Link to={isEmployer ? "/employer" : "/auth/signup"}>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 rounded-xl transition-transform hover:scale-105 active:scale-95">
                  {isEmployer ? (t("nav", "dashboard") || "لوحة التحكم") : t("hero", "postJob")}
                </Button>
              </Link>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-20 flex items-center justify-center gap-8 text-sm text-muted-foreground border-t border-border/50 pt-10 px-4 flex-wrap">
            <div className="text-center min-w-[120px]">
              <div className="text-3xl font-bold text-foreground mb-1 flex justify-center items-center">
                <AnimatedCounter value={displayStats.jobs} />+
              </div>
              <div className="font-medium text-xs tracking-wider uppercase">{t("hero", "activeJobs")}</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/80" />
            <div className="text-center min-w-[120px]">
              <div className="text-3xl font-bold text-foreground mb-1 flex justify-center items-center">
                <AnimatedCounter value={displayStats.candidates} />+
              </div>
              <div className="font-medium text-xs tracking-wider uppercase">{t("hero", "workers")}</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/80" />
            <div className="text-center min-w-[120px]">
              <div className="text-3xl font-bold text-foreground mb-1 flex justify-center items-center">
                <AnimatedCounter value={displayStats.organizations} />+
              </div>
              <div className="font-medium text-xs tracking-wider uppercase">{t("hero", "businesses")}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}