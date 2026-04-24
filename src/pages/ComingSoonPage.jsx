import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComingSoonPage = ({ type = "academy" }) => {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  
  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Animation
    const tl = gsap.timeline();
    
    tl.fromTo(
      ".coming-soon-badge",
      { opacity: 0, scale: 0.8, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" }
    )
    .fromTo(
      ".coming-soon-title",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.4"
    )
    .fromTo(
      ".coming-soon-desc",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    )
    .fromTo(
      ".coming-soon-actions",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      "-=0.4"
    )
    .fromTo(
      ".floating-element",
      { opacity: 0, scale: 0.5 },
      { opacity: 0.6, scale: 1, duration: 1, stagger: 0.2, ease: "elastic.out(1, 0.7)" },
      "-=1"
    );

    // Continuous floating animation
    gsap.to(".floating-element", {
      y: "15px",
      rotation: "5deg",
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: {
        each: 0.5,
        from: "random"
      }
    });

  }, [type]);

  const titleKey = type === "academy" ? "academyTitle" : "storeTitle";
  
  return (
    <div className="min-h-screen bg-app-bg text-foreground flex flex-col items-center justify-center relative overflow-hidden pt-20 pb-16">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Decorative floating elements */}
      <div className="floating-element absolute top-1/4 left-1/4 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 backdrop-blur-md flex items-center justify-center hidden md:flex">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="floating-element absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-gradient-to-tr from-secondary/10 to-secondary/5 border border-secondary/10 backdrop-blur-md hidden md:flex"></div>
      
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center z-10">
        
        {/* Badge */}
        <div className="coming-soon-badge mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {t("comingSoon", "text")}
        </div>
        
        {/* Title */}
        <h1 className="coming-soon-title text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t("comingSoon", titleKey)}
          </span>
        </h1>
        
        {/* Description */}
        <p className="coming-soon-desc text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          {t("comingSoon", "description")}
        </p>
        
        {/* Actions */}
        <div className="coming-soon-actions flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] min-w-[200px] h-14"
            onClick={() => {
              alert("Thank you! We'll notify you when it's ready.");
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            {t("comingSoon", "notifyMe")}
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full h-14 min-w-[200px]"
            asChild
          >
            <Link to="/">
              {isRTL ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t("comingSoon", "backHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
