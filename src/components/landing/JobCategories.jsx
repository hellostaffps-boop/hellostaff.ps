import { Coffee, ChefHat, Utensils, Calculator, Smile, Sparkles, Soup, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { getJobCountsByType } from "@/lib/supabaseService";

const categoryData = [
  { key: "barista",    i18nKey: "barista",       icon: Coffee },
  { key: "chef",       i18nKey: "chef",          icon: ChefHat },
  { key: "waiter",     i18nKey: "waiter",        icon: Utensils },
  { key: "cashier",    i18nKey: "cashier",       icon: Calculator },
  { key: "host",       i18nKey: "host",          icon: Smile },
  { key: "cleaner",    i18nKey: "cleaner",       icon: Sparkles },
  { key: "kitchen_helper",      i18nKey: "kitchenHelper", icon: Soup },
  { key: "restaurant_manager",  i18nKey: "manager",       icon: Crown },
];

export default function JobCategories() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: counts = {} } = useQuery({
    queryKey: ["job-type-counts"],
    queryFn: getJobCountsByType,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const handleCategoryClick = (jobTypeKey) => {
    navigate(`/jobs?type=${jobTypeKey}`);
  };

  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("categories", "heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("categories", "subtext")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categoryData.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.key] || 0;
            return (
              <div
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className="group card-premium hover-lift rounded-xl p-6 cursor-pointer"
              >
                <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition-colors" />
                <h3 className="font-semibold text-sm">{t("categories", cat.i18nKey)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{count} {t("categories", "openPositions")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}