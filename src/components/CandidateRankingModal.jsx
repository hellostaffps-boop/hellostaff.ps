import { X, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

const SCORE_COLOR = (score) => {
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
};

const RANK_ICON = (rank) => {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `#${rank + 1}`;
};

export default function CandidateRankingModal({ job, applications, onClose }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" dir={ar ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{ar ? "الفرز الذكي للمتقدمين" : "AI Candidate Ranking"}</h2>
              <p className="text-xs text-muted-foreground">{job.title} · {applications.length} {ar ? "متقدم" : "applicants"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Trophy className="w-10 h-10 text-purple-300" />
          <p className="text-sm text-muted-foreground">
            {ar ? "ميزة الذكاء الاصطناعي ستتوفر قريباً" : "AI ranking feature coming soon"}
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            {ar ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}