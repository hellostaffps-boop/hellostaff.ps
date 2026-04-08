import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

export default function Contact() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(t("contact", "successMessage"));
      e.target.reset();
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight">{t("contact", "heading")}</h1>
        <p className="mt-4 text-muted-foreground text-lg">{t("contact", "subtext")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
        <div>
          <h2 className="text-xl font-semibold mb-6">{t("contact", "getInTouch")}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm">{t("contact", "name")}</Label>
                <Input id="name" placeholder={t("contact", "namePlaceholder")} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">{t("contact", "email")}</Label>
                <Input id="email" type="email" placeholder={t("contact", "emailPlaceholder")} className="mt-1.5" required />
              </div>
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm">{t("contact", "subject")}</Label>
              <Input id="subject" placeholder={t("contact", "subjectPlaceholder")} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm">{t("contact", "message")}</Label>
              <Textarea id="message" placeholder={t("contact", "messagePlaceholder")} rows={5} className="mt-1.5 resize-none" required />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={sending}>
              {sending ? t("contact", "sending") : t("contact", "sendMessage")}
            </Button>
          </form>
        </div>

        <div className="space-y-8">
          <h2 className="text-xl font-semibold mb-6">{t("contact", "contactInfo")}</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-medium text-sm">{t("contact", "emailLabel")}</div>
                <div className="text-sm text-muted-foreground">hello@hellostaff.com</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-medium text-sm">{t("contact", "phoneLabel")}</div>
                <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-medium text-sm">{t("contact", "officeLabel")}</div>
                <div className="text-sm text-muted-foreground">San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}