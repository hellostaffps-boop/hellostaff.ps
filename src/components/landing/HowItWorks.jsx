import { UserPlus, Search, Send, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

const stepIcons = [UserPlus, Search, Send, CheckCircle];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { icon: stepIcons[0], title: t("howItWorks", "step1Title"), description: t("howItWorks", "step1Desc") },
    { icon: stepIcons[1], title: t("howItWorks", "step2Title"), description: t("howItWorks", "step2Desc") },
    { icon: stepIcons[2], title: t("howItWorks", "step3Title"), description: t("howItWorks", "step3Desc") },
    { icon: stepIcons[3], title: t("howItWorks", "step4Title"), description: t("howItWorks", "step4Desc") },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("howItWorks", "heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("howItWorks", "subtext")}
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i} variants={itemVariants} className="relative text-center group card-premium p-6 hover-lift rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110 group-hover:bg-accent/20">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg border-4 border-background">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2 mt-4">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}