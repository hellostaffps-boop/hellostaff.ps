/**
 * EmployerWelcomeBanner.jsx
 * Shown to new employers who haven't posted any jobs yet.
 * Provides a warm, guided onboarding experience with clear CTAs.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, PlayCircle, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

const STEPS = (ar) => [
  {
    icon: Briefcase,
    title: ar ? "انشر وظيفتك الأولى مجاناً" : "Post your first job for free",
    desc: ar ? "أضف تفاصيل الوظيفة وانشرها في أقل من 3 دقائق" : "Add job details and publish in under 3 minutes",
    cta: ar ? "انشر الآن" : "Post Now",
    path: "/employer/post-job",
    color: "from-primary/10 to-primary/5 border-primary/20",
    btnClass: "bg-primary text-white hover:bg-primary/90",
  },
  {
    icon: Users,
    title: ar ? "راجع المتقدمين في لوحة Kanban" : "Review applicants in Kanban board",
    desc: ar ? "تتبع المرشحين من التقديم حتى التوظيف بسحب وإفلت" : "Track candidates from application to hire with drag & drop",
    cta: ar ? "عرض اللوحة" : "View Pipeline",
    path: "/employer/pipeline",
    color: "from-accent/10 to-accent/5 border-accent/20",
    btnClass: "bg-accent text-accent-foreground hover:bg-accent/90",
  },
];

export default function EmployerWelcomeBanner({ orgName }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-6 text-white mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.07),transparent)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">👋</span>
            <h2 className="font-bold text-xl">
              {ar
                ? `مرحباً بك في Hello Staff${orgName ? ` — ${orgName}` : ""}!`
                : `Welcome to Hello Staff${orgName ? ` — ${orgName}` : ""}!`}
            </h2>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-xl">
            {ar
              ? "أنت على بُعد خطوات قليلة من الوصول إلى أفضل كوادر الضيافة في فلسطين. ابدأ بنشر وظيفتك الأولى مجاناً الآن."
              : "You're just a few steps away from reaching Palestine's top hospitality talent. Start by posting your first job for free."}
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            {[
              ar ? "وظيفة مجانية لتجربة المنصة" : "1 free job to try the platform",
              ar ? "وصول لآلاف المرشحين المحليين" : "Access thousands of local candidates",
              ar ? "نظام إدارة متكامل" : "Full hiring management system",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-white/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-2 gap-3">
        {STEPS(ar).map((step) => (
          <div
            key={step.path}
            className={`bg-gradient-to-br ${step.color} border rounded-xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm">{step.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>
              </div>
            </div>
            <Link to={step.path}>
              <Button size="sm" className={`w-full gap-2 ${step.btnClass}`}>
                {step.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
