import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { base44 } from "@/api/base44Client";

export default function TermsOfService() {
  const { t, lang } = useLanguage();

  const { data: terms, isLoading } = useQuery({
    queryKey: ["terms-of-service", lang],
    queryFn: async () => {
      const termsList = await base44.entities.TermsOfService.filter({ language: lang });
      return termsList[0] || null;
    },
  });

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {terms?.title || t("footer", "terms")}
          </h1>
          {terms?.lastUpdated && (
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "آخر تحديث: " : "Last updated: "} {terms.lastUpdated}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : terms?.content ? (
          <div
            className="prose prose-sm sm:prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: terms.content }}
          />
        ) : (
          <div className="bg-secondary rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "شروط الخدمة غير متاحة حالياً"
                : "Terms of Service not available at the moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}