import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const TONES = [
  { value: "professional", label: "Professional & Formal" },
  { value: "friendly", label: "Friendly & Welcoming" },
  { value: "energetic", label: "Energetic & Dynamic" },
  { value: "concise", label: "Concise & Direct" },
];

export default function AIJobAssistant({ category, onApply }) {
  const [open, setOpen] = useState(false);
  const [outline, setOutline] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!outline.trim()) { toast.error("Please enter a brief role description or keywords."); return; }
    setLoading(true);
    setResult(null);
    const generated = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert HR copywriter specializing in hospitality and food service recruitment.

Generate a compelling job posting for the following role:
- Job category: ${category || "hospitality"}
- Brief outline / keywords: ${outline}
- Tone: ${tone}

Return ONLY a JSON object with these fields:
- title: A specific, attractive job title (string)
- description: A 2-3 paragraph job overview that sells the role and company culture (string)
- requirements: 5-7 bullet points of qualifications/skills, each on its own line starting with "• " (string)
- benefits: 4-6 bullet points of perks and benefits, each starting with "• " (string)

Tailor the language to attract the right candidates. Be specific and compelling. Do NOT include any markdown formatting or code blocks.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          requirements: { type: "string" },
          benefits: { type: "string" },
        },
      },
    });
    setResult(generated);
    setLoading(false);
  };

  const applyField = (field) => {
    onApply({ [field]: result[field] });
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} applied!`);
  };

  const applyAll = () => {
    onApply(result);
    toast.success("All suggestions applied to the form!");
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      {/* Header */}
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
        <div className="px-4 pb-5 space-y-4 border-t border-accent/20">
          <div className="pt-4 space-y-3">
            <div>
              <Label className="text-sm font-medium">Role outline or keywords</Label>
              <Textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                rows={3}
                className="mt-1.5 resize-none bg-white"
                placeholder="e.g. Head barista for a specialty coffee shop, 3 years experience, latte art, team lead skills, weekend shifts..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Tone & Style</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate with AI</>
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-3 pt-1">
              <div className="h-px bg-accent/20" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">AI Suggestions</span>
                <Button size="sm" onClick={applyAll} className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                  Apply All
                </Button>
              </div>

              {[
                { key: "title", label: "Job Title" },
                { key: "description", label: "Description" },
                { key: "requirements", label: "Requirements" },
                { key: "benefits", label: "Benefits" },
              ].map(({ key, label }) => (
                <div key={key} className="bg-white rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                    <button
                      onClick={() => applyField(key)}
                      className="text-xs text-accent font-medium hover:underline"
                    >
                      Use this →
                    </button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed line-clamp-4">
                    {result[key]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}