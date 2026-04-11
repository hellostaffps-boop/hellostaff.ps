import { Coffee, ChefHat, Utensils, Calculator, Smile, Sparkles, Soup, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";

const categoryIcons = [Coffee, ChefHat, Utensils, Calculator, Smile, Sparkles, Soup, Crown];
const categoryCounts = [340, 280, 520, 190, 150, 210, 310, 120];
const categoryKeys = ["barista", "chef", "waiter", "cashier", "host", "cleaner", "kitchen_helper", "restaurant_manager"];

export default function JobCategories() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isCandidate = userProfile?.role === "candidate";

  const handleCategoryClick = (key) => {
    if (isCandidate) {
      navigate(`/jobs?category=${key}`);
    }
  };

  const categories = categoryKeys.map((key, i) => ({
    icon: categoryIcons[i],
    label: t("categories", key),
    count: categoryCounts[i],
  }));

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
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                onClick={() => handleCategoryClick(categoryKeys[i])}
                className={`group bg-white rounded-xl p-6 border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all ${isCandidate ? "cursor-pointer" : "cursor-default"}`}
              >
                <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition-colors" />
                <h3 className="font-semibold text-sm">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} {t("categories", "openPositions")}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}