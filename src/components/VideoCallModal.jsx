import { useState } from "react";
import { X, Copy, Check, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function VideoCallModal({ application, onClose }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);

  const roomName = `cafejobs-interview-${application.id}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  const copyLink = () => {
    navigator.clipboard.writeText(jitsiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" dir={ar ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Video className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {ar ? "مكالمة فيديو للمقابلة" : "Interview Video Call"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {application.candidate_name || application.candidate_email} · {application.job_title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share link bar */}
        <div className="px-5 py-3 bg-secondary/40 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{jitsiUrl}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5" />{ar ? "تم النسخ" : "Copied"}</>
              : <><Copy className="w-3.5 h-3.5" />{ar ? "نسخ الرابط" : "Copy link"}</>
            }
          </button>
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {ar ? "فتح في تبويب جديد" : "Open in new tab"}
          </a>
        </div>

        {/* Jitsi iframe */}
        {joined ? (
          <div className="flex-1 min-h-0">
            <iframe
              src={jitsiUrl}
              className="w-full h-full rounded-b-2xl"
              style={{ minHeight: "480px", border: "none" }}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              title="Jitsi Video Call"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <Video className="w-9 h-9 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">
                {ar ? "جاهز لبدء المقابلة؟" : "Ready to start the interview?"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {ar
                  ? "انسخ الرابط وشاركه مع المرشح قبل البدء، ثم انضم للغرفة."
                  : "Copy the link and share it with the candidate before joining the room."}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button variant="outline" onClick={copyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {ar ? "نسخ رابط المرشح" : "Copy candidate link"}
              </Button>
              <Button onClick={() => setJoined(true)} className="gap-2">
                <Video className="w-4 h-4" />
                {ar ? "ابدأ المكالمة" : "Start call"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}