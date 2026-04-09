import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { getApplicationEvaluation, saveApplicationEvaluation } from "@/lib/firestoreService";

const TAGS = [
  { value: "cultural_fit", en: "Cultural Fit", ar: "التوافق الثقافي" },
  { value: "experienced", en: "Experienced", ar: "ذو خبرة" },
  { value: "quick_learner", en: "Quick Learner", ar: "متعلم سريع" },
  { value: "leadership", en: "Leadership", ar: "قيادة" },
  { value: "team_player", en: "Team Player", ar: "لاعب جماعي" },
  { value: "technical_skills", en: "Technical Skills", ar: "مهارات تقنية" },
  { value: "communication", en: "Communication", ar: "التواصل" },
  { value: "reliability", en: "Reliability", ar: "الموثوقية" },
];

const RECOMMENDATIONS = [
  { value: "strong_yes", en: "Strong Yes", ar: "نعم بقوة", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "yes", en: "Yes", ar: "نعم", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "maybe", en: "Maybe", ar: "ربما", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "no", en: "No", ar: "لا", color: "bg-red-100 text-red-800 border-red-300" },
];

export default function EvaluationCard({ applicationId, organizationId }) {
  const { t } = useLanguage();
  const { lang } = useLanguage();
  const { firebaseUser, userProfile } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const isArabic = lang === "ar";

  const [score, setScore] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");

  const { data: evaluations = [] } = useQuery({
    queryKey: ["app-evaluation", applicationId],
    queryFn: () => getApplicationEvaluation(applicationId),
    enabled: !!applicationId,
  });

  // Load own evaluation if it exists
  const ownEvaluation = useMemo(() => {
    return evaluations.find(e => e.reviewer_email === firebaseUser?.email);
  }, [evaluations, firebaseUser?.email]);

  // Populate form with own evaluation
  useEffect(() => {
    if (ownEvaluation) {
      setScore(ownEvaluation.overall_score || 0);
      setRecommendation(ownEvaluation.recommendation || "");
      setSelectedTags(ownEvaluation.tags || []);
      setStrengths(ownEvaluation.strengths?.join("\n") || "");
      setConcerns(ownEvaluation.concerns?.join("\n") || "");
    }
  }, [ownEvaluation]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveApplicationEvaluation(applicationId, organizationId, {
        reviewer_email: firebaseUser.email,
        reviewer_name: userProfile?.full_name || firebaseUser.email,
        overall_score: score,
        strengths: strengths.split("\n").filter(s => s.trim()),
        concerns: concerns.split("\n").filter(c => c.trim()),
        tags: selectedTags,
        recommendation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-evaluation", applicationId] });
    },
  });

  const toggleTag = (tagValue) => {
    setSelectedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-border p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-accent" />
        <h3 className="font-semibold text-sm">{isArabic ? "تقييم المرشح" : "Candidate Evaluation"}</h3>
      </div>

      {/* Show existing evaluations */}
      {evaluations.length > 0 && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg text-xs space-y-2 mb-4">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="text-muted-foreground">
              <div className="font-medium text-foreground">{evaluation.reviewer_name}</div>
              <div className="flex gap-2 mt-1">
                <span>{evaluation.overall_score}/5 •</span>
                <span className={`px-2 py-0.5 rounded-full border ${RECOMMENDATIONS.find(r => r.value === evaluation.recommendation)?.color || ""}`}>
                  {isArabic
                    ? RECOMMENDATIONS.find(r => r.value === evaluation.recommendation)?.ar
                    : RECOMMENDATIONS.find(r => r.value === evaluation.recommendation)?.en}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* Score */}
        <div>
          <label className="text-xs font-medium block mb-2">
            {isArabic ? "التقييم العام (1-5)" : "Overall Score (1-5)"}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setScore(s)}
                className="p-1"
              >
                <Star
                  className={`w-5 h-5 ${s <= score ? "fill-accent text-accent" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div>
          <label className="text-xs font-medium block mb-2">
            {isArabic ? "نقاط القوة (سطر واحد لكل نقطة)" : "Strengths (one per line)"}
          </label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="w-full min-h-16 p-2 border border-border rounded-md text-xs resize-none"
            placeholder={isArabic ? "مثال: مهارات تقنية قوية" : "Example: Strong technical skills"}
          />
        </div>

        {/* Concerns */}
        <div>
          <label className="text-xs font-medium block mb-2">
            {isArabic ? "المخاوف (سطر واحد لكل مخوف)" : "Concerns (one per line)"}
          </label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            className="w-full min-h-16 p-2 border border-border rounded-md text-xs resize-none"
            placeholder={isArabic ? "مثال: خبرة محدودة في المجال" : "Example: Limited field experience"}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-medium block mb-2">
            {isArabic ? "الوسوم" : "Tags"}
          </label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => toggleTag(tag.value)}
                className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                  selectedTags.includes(tag.value)
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-secondary text-foreground border-border hover:border-accent"
                }`}
              >
                {isArabic ? tag.ar : tag.en}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <label className="text-xs font-medium block mb-2">
            {isArabic ? "التوصية" : "Recommendation"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RECOMMENDATIONS.map((rec) => (
              <button
                key={rec.value}
                onClick={() => setRecommendation(rec.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  recommendation === rec.value
                    ? `${rec.color} ring-2 ring-offset-1 ring-accent`
                    : `${rec.color} opacity-50 hover:opacity-75`
                }`}
              >
                {isArabic ? rec.ar : rec.en}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!recommendation || saveMutation.isPending}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saveMutation.isPending
            ? (isArabic ? "جارٍ الحفظ..." : "Saving...")
            : (isArabic ? "حفظ التقييم" : "Save Evaluation")}
        </Button>
      </div>
    </div>
  );
}