import { Coffee, ChefHat, Utensils, Calculator, Smile, Sparkles, Soup, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const categoryData = [
  { key: "barista",    i18nKey: "barista",       icon: Coffee,     count: 340 },
  { key: "chef",       i18nKey: "chef",          icon: ChefHat,    count: 280 },
  { key: "waiter",     i18nKey: "waiter",        icon: Utensils,   count: 520 },
  { key: "cashier",    i18nKey: "cashier",       icon: Calculator, count: 190 },
  { key: "host",       i18nKey: "host",          icon: Smile,      count: 150 },
  { key: "cleaner",    i18nKey: "cleaner",       icon: Sparkles,   count: 210 },
  { key: "kitchen_helper",      i18nKey: "kitchenHelper", icon: Soup,   count: 310 },
  { key: "restaurant_manager",  i18nKey: "manager",       icon: Crown,  count: 120 },
];

export default function JobCategories() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleCategoryClick = (jobTypeKey) => {
    // Navigate to jobs page with category filter for all users
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
            return (
              <div
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className="group card-premium hover-lift rounded-xl p-6 cursor-pointer"
              >
                <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition-colors" />
                <h3 className="font-semibold text-sm">{t("categories", cat.i18nKey)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} {t("categories", "openPositions")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}