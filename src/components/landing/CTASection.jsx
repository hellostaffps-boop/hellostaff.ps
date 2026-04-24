import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

export default function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
          {t("cta", "heading")}
        </h2>
        <p className="text-primary-foreground/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
          {t("cta", "subtext")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/jobs">
            <Button size="lg" className="h-14 px-8 text-base gap-2 rounded-xl transition-transform hover:scale-105 active:scale-95 bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_30px_-5px_rgba(255,193,7,0.4)]">
              {t("cta", "findJob")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/employer">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-primary-foreground/20 rounded-xl transition-transform hover:scale-105 active:scale-95 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              {t("cta", "postJob")}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}