import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { base44 } from "@/api/base44Client";

export default function PrivacyPolicy() {
  const { t, lang } = useLanguage();

  const { data: policy, isLoading } = useQuery({
    queryKey: ["privacy-policy", lang],
    queryFn: async () => {
      const policies = await base44.entities.PrivacyPolicy.filter({ language: lang });
      return policies[0] || null;
    },
  });

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {policy?.title || t("footer", "privacy")}
          </h1>
          {policy?.lastUpdated && (
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "آخر تحديث: " : "Last updated: "} {policy.lastUpdated}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : policy?.content ? (
          <div
            className="prose prose-sm sm:prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        ) : (
          <div className="bg-secondary rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              {lang === "ar"
                ? "سياسة الخصوصية غير متاحة حالياً"
                : "Privacy Policy not available at the moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}