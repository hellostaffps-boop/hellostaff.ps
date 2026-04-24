import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/context/SettingsContext";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

export default function PublicFooter() {
  const { t } = useLanguage();
  const { settings } = useSettings();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={settings?.logo_url || "/logo.png"} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-semibold text-lg" style={{ fontFamily: settings?.font_family ? `"${settings.font_family}", sans-serif` : undefined }}>Hello Staff</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              {t("footer", "tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer", "forWorkers")}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/jobs" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "browseJobs")}</Link></li>
              <li><Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "howItWorks")}</Link></li>
              <li><Link to="/candidate" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "myDashboard")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer", "forEmployers")}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/employer/post-job" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "postJob")}</Link></li>
              <li><Link to="/employer" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "employerDashboard")}</Link></li>
              <li><Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "contactSales")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t("footer", "company")}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "about")}</Link></li>
              <li><Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "contact")}</Link></li>
              <li><Link to="/privacy" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "privacy")}</Link></li>
              <li><Link to="/terms" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">{t("footer", "terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/40">{t("footer", "copyright")}</p>
          <div className="flex gap-4">
            {(settings?.facebook_url || !settings) && (
              <a href={settings?.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-primary-foreground/5 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors text-primary-foreground/60">
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {(settings?.instagram_url || !settings) && (
              <a href={settings?.instagram_url || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-primary-foreground/5 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors text-primary-foreground/60">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {(settings?.whatsapp_url || !settings) && (
              <a href={settings?.whatsapp_url || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-primary-foreground/5 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors text-primary-foreground/60">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}