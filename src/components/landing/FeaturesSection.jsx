import { Zap, Shield, Clock, Globe, BarChart3, Heart, Users, Briefcase } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import WorkerPreview from "./WorkerPreview";
import DashboardPreview from "./DashboardPreview";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <motion.div variants={fadeUp} className="flex gap-4 p-4 rounded-xl card-premium hover-lift">
      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1.5">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
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
    <section className="py-20 sm:py-28 bg-white relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Worker features */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-24 lg:mb-32"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="order-1">
            <motion.div variants={fadeUp} className="text-xs font-bold tracking-wider uppercase text-accent mb-3">
              {t("features", "forWorkersLabel")}
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("features", "forWorkersHeading")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8 max-w-xl">
              {t("features", "forWorkersSubtext")}
            </motion.p>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 -mx-4">
              {workerFeatures.map((f, i) => <FeatureCard key={i} {...f} />)}
            </div>
          </div>
          <motion.div variants={fadeUp} className="order-2 bg-gradient-to-br from-secondary to-accent/5 rounded-[2rem] min-h-[350px] sm:min-h-[400px] flex items-center justify-center border border-accent/10 shadow-lg shadow-accent/5 overflow-hidden">
            <WorkerPreview />
          </motion.div>
        </motion.div>

        {/* Employer features */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeUp} className="order-2 lg:order-1 bg-white rounded-[2rem] min-h-[350px] sm:min-h-[400px] flex items-center justify-center border border-border/60 shadow-xl overflow-hidden relative">
            <DashboardPreview />
          </motion.div>
          <div className="order-1 lg:order-2">
            <motion.div variants={fadeUp} className="text-xs font-bold tracking-wider uppercase text-accent mb-3">
              {t("features", "forEmployersLabel")}
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("features", "forEmployersHeading")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8 max-w-xl">
              {t("features", "forEmployersSubtext")}
            </motion.p>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 -mx-4">
              {employerFeatures.map((f, i) => <FeatureCard key={i} {...f} />)}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}