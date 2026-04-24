import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import StatsPreview from "./StatsPreview";

const reasonKeys = ["reason1", "reason2", "reason3", "reason4", "reason5", "reason6"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function WhySection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="lg:col-span-7">
            <motion.h2 variants={itemVariants} className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              {t("why", "heading")}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-primary-foreground/70 text-lg mb-10 leading-relaxed font-light max-w-2xl">
              {t("why", "subtext")}
            </motion.p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {reasonKeys.map((key) => (
                <motion.div key={key} variants={itemVariants} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-base font-medium">{t("why", key)}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5 bg-primary-foreground/[0.03] rounded-[2rem] min-h-[350px] sm:min-h-[400px] lg:h-[450px] flex items-center justify-center border border-primary-foreground/10 backdrop-blur-md shadow-2xl overflow-hidden relative group"
          >
            <StatsPreview />
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}