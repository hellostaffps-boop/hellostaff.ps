import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const TONES = [
  { value: "professional", label: "Professional & Formal" },
  { value: "friendly", label: "Friendly & Welcoming" },
  { value: "energetic", label: "Energetic & Dynamic" },
  { value: "concise", label: "Concise & Direct" },
];

export default function AIJobAssistant() {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="text-start">
            <div className="font-semibold text-sm">AI Job Description Assistant</div>
            <div className="text-xs text-muted-foreground">Generate compelling content in seconds</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-accent/20">
          <div className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {ar ? "ميزة الذكاء الاصطناعي ستتوفر قريباً" : "AI features coming soon"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}