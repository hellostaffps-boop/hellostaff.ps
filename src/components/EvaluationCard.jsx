import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { saveApplicationEvaluation } from "@/lib/firestoreService";
import { useFirebaseAuth } from "@/lib/firebaseAuth";

const TAGS = [
  { id: "cultural_fit", label: { ar: "توافق ثقافي", en: "Cultural Fit" } },
  { id: "experienced", label: { ar: "ذو خبرة", en: "Experienced" } },
  { id: "quick_learner", label: { ar: "متعلم سريع", en: "Quick Learner" } },
  { id: "leadership", label: { ar: "قيادي", en: "Leadership" } },
  { id: "team_player", label: { ar: "روح فريق", en: "Team Player" } },
  { id: "technical_skills", label: { ar: "مهارات تقنية", en: "Technical Skills" } },
  { id: "communication", label: { ar: "التواصل", en: "Communication" } },
  { id: "reliability", label: { ar: "موثوقية", en: "Reliability" } },
];

const RECOMMENDATIONS = [
  { id: "strong_yes", label: { ar: "نعم بقوة", en: "Strong Yes" }, color: "bg-green-100 text-green-800" },
  { id: "yes", label: { ar: "نعم", en: "Yes" }, color: "bg-blue-100 text-blue-800" },
  { id: "maybe", label: { ar: "ربما", en: "Maybe" }, color: "bg-yellow-100 text-yellow-800" },
  { id: "no", label: { ar: "لا", en: "No" }, color: "bg-red-100 text-red-800" },
];

export default function EvaluationCard({ applicationId, organizationId, existingEval = null }) {
  const { t, lang } = useLanguage();
  const { firebaseUser } = useFirebaseAuth();
  const queryClient = useQueryClient();

  const [score, setScore] = useState(existingEval?.overall_score || 0);
  const [strengths, setStrengths] = useState(existingEval?.strengths?.join(", ") || "");
  const [concerns, setConcerns] = useState(existingEval?.concerns?.join(", ") || "");
  const [selectedTags, setSelectedTags] = useState(existingEval?.tags || []);
  const [recommendation, setRecommendation] = useState(existingEval?.recommendation || "maybe");

  const mutation = useMutation({
    mutationFn: async () => {
      await saveApplicationEvaluation(applicationId, organizationId, {
        reviewer_email: firebaseUser.email,
        reviewer_name: firebaseUser.displayName || firebaseUser.email,
        overall_score: score,
        strengths: strengths.split(",").map(s => s.trim()).filter(Boolean),
        concerns: concerns.split(",").map(c => c.trim()).filter(Boolean),
        tags: selectedTags,
        recommendation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-evaluations", applicationId] });
    },
  });

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="font-semibold text-sm mb-4">
        {lang === "ar" ? "تقييم المرشح" : "Candidate Evaluation"}
      </h4>

      {/* Overall Score */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2">
          {lang === "ar" ? "التقييم الإجمالي" : "Overall Score"}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className="p-1 transition-transform"
            >
              <Star
                className={`w-5 h-5 ${s <= score ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1">
          {lang === "ar" ? "نقاط القوة (مفصولة بفواصل)" : "Strengths (comma-separated)"}
        </label>
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder={lang === "ar" ? "مثال: مهارات قيادية، الموثوقية" : "e.g. Leadership, reliability"}
          className="w-full p-2 border border-input rounded text-xs"
          rows="2"
        />
      </div>

      {/* Concerns */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1">
          {lang === "ar" ? "المخاوف (مفصولة بفواصل)" : "Concerns (comma-separated)"}
        </label>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          placeholder={lang === "ar" ? "مثال: عدم وجود تجربة في المجال" : "e.g. Limited domain experience"}
          className="w-full p-2 border border-input rounded text-xs"
          rows="2"
        />
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2">
          {lang === "ar" ? "الصفات" : "Tags"}
        </label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <Badge
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`cursor-pointer ${selectedTags.includes(tag.id) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {tag.label[lang]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2">
          {lang === "ar" ? "التوصية" : "Recommendation"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RECOMMENDATIONS.map(rec => (
            <button
              key={rec.id}
              onClick={() => setRecommendation(rec.id)}
              className={`p-2 rounded text-xs font-medium transition-all ${
                recommendation === rec.id
                  ? rec.color + " ring-2 ring-accent"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {rec.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full"
      >
        {lang === "ar" ? "حفظ التقييم" : "Save Evaluation"}
      </Button>
    </div>
  );
}