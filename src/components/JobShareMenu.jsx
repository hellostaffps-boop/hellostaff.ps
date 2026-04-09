import { useState, useRef, useEffect } from "react";
import { Share2, Link2, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

// Simple WhatsApp & LinkedIn SVG icons
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.541 4.064 1.487 5.779L0 24l6.374-1.467A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.375l-.36-.214-3.727.857.875-3.62-.234-.374A9.818 9.818 0 1112 21.818z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function JobShareMenu({ job, ar }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const jobUrl = `${window.location.origin}/jobs/${job.id}`;
  const text = ar
    ? `فرصة عمل: ${job.title} في ${job.organization_name || ""}\n${jobUrl}`
    : `Job opportunity: ${job.title} at ${job.organization_name || ""}\n${jobUrl}`;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(ar ? "تم نسخ الرابط!" : "Link copied!");
    setOpen(false);
  };

  const shareActions = [
    {
      label: ar ? "نسخ الرابط" : "Copy link",
      icon: copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Link2 className="w-3.5 h-3.5" />,
      onClick: copyLink,
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      color: "text-green-600",
      onClick: () => { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"); setOpen(false); },
    },
    {
      label: "LinkedIn",
      icon: <LinkedInIcon />,
      color: "text-blue-600",
      onClick: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, "_blank"); setOpen(false); },
    },
    {
      label: ar ? "بريد إلكتروني" : "Email",
      icon: <Mail className="w-3.5 h-3.5" />,
      color: "text-muted-foreground",
      onClick: () => {
        const subject = ar ? `فرصة عمل: ${job.title}` : `Job opportunity: ${job.title}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        setOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 h-8 px-2 text-xs text-muted-foreground hover:text-accent border border-border hover:border-accent/30 rounded-md transition-colors"
        title={ar ? "مشاركة الوظيفة" : "Share job"}
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{ar ? "مشاركة" : "Share"}</span>
      </button>

      {open && (
        <div className={`absolute z-50 top-full mt-1 w-44 bg-white rounded-xl border border-border shadow-lg overflow-hidden ${ar ? "right-0" : "left-0"}`}>
          {shareActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-secondary transition-colors ${action.color || "text-foreground"}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}