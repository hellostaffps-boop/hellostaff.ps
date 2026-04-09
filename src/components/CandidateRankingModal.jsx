import { useState } from "react";
import { X, Sparkles, Loader2, Trophy, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
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
  const [loading, setLoading] = useState(false);
  const [ranked, setRanked] = useState(null);
  const [error, setError] = useState(null);

  const runRanking = async () => {
    setLoading(true);
    setError(null);
    try {
      const candidateList = applications.map((app) => ({
        id: app.id,
        name: app.candidate_name || app.candidate_email,
        cover_letter: app.cover_letter || "",
        status: app.status,
      }));

      const prompt = `
You are an expert recruiter. Rank the following candidates for the job below.

JOB DETAILS:
- Title: ${job.title}
- Type: ${job.job_type}
- Requirements: ${job.requirements || "Not specified"}
- Description: ${job.description || "Not specified"}
- Experience required: ${job.experience_required || "Not specified"}

CANDIDATES:
${candidateList.map((c, i) => `
Candidate ${i + 1}:
- ID: ${c.id}
- Name: ${c.name}
- Cover letter / notes: ${c.cover_letter || "None provided"}
`).join("\n")}

For each candidate, provide:
1. A match score from 0 to 100
2. 2-3 bullet points explaining why they are or aren't a good fit
3. A short recommendation label: "Strong Match", "Good Match", "Weak Match"

Return a JSON array sorted from highest to lowest score.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            rankings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  candidate_id: { type: "string" },
                  candidate_name: { type: "string" },
                  score: { type: "number" },
                  label: { type: "string" },
                  reasons: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });

      setRanked(result.rankings || []);
    } catch (e) {
      setError(ar ? "حدث خطأ أثناء التحليل، حاول مجدداً." : "Analysis failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" dir={ar ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {ar ? "الفرز الذكي للمتقدمين" : "AI Candidate Ranking"}
              </h2>
              <p className="text-xs text-muted-foreground">{job.title} · {applications.length} {ar ? "متقدم" : "applicants"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!ranked && !loading && (
            <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">
                  {ar ? "ترتيب المرشحين بالذكاء الاصطناعي" : "Rank candidates with AI"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {ar
                    ? "سيقوم الذكاء الاصطناعي بتحليل خطابات التقديم ومطابقتها مع متطلبات الوظيفة لاقتراح أفضل المرشحين."
                    : "AI will analyze cover letters and match them against job requirements to suggest the best candidates."}
                </p>
              </div>
              <Button onClick={runRanking} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {ar ? "ابدأ التحليل" : "Start Analysis"}
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {ar ? "جارٍ تحليل المرشحين..." : "Analysing candidates..."}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {ranked && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-4">
                {ar ? "الترتيب من الأنسب إلى الأقل ملاءمة" : "Ranked from best to least suitable match"}
              </p>
              {ranked.map((r, idx) => (
                <div key={r.candidate_id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{RANK_ICON(idx)}</span>
                      <div>
                        <p className="font-semibold text-sm">{r.candidate_name}</p>
                        <Badge className={`text-xs border mt-0.5 ${SCORE_COLOR(r.score)}`}>
                          {r.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-2xl font-bold text-foreground">{r.score}</span>
                      <span className="text-xs text-muted-foreground">{ar ? "/ 100" : "/ 100"}</span>
                    </div>
                  </div>
                  {r.reasons?.length > 0 && (
                    <ul className="space-y-1">
                      {r.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-purple-400" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={runRanking} className="gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  {ar ? "إعادة التحليل" : "Re-run analysis"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}