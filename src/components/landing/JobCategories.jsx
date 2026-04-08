import { Coffee, ChefHat, Utensils, Calculator, Smile, Sparkles, Soup, Crown } from "lucide-react";

const categories = [
  { icon: Coffee, label: "Barista", count: 340 },
  { icon: ChefHat, label: "Chef", count: 280 },
  { icon: Utensils, label: "Waiter", count: 520 },
  { icon: Calculator, label: "Cashier", count: 190 },
  { icon: Smile, label: "Host", count: 150 },
  { icon: Sparkles, label: "Cleaner", count: 210 },
  { icon: Soup, label: "Kitchen Helper", count: 310 },
  { icon: Crown, label: "Manager", count: 120 },
];

export default function JobCategories() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Explore by category
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Find roles that match your skills and experience in the hospitality industry.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.label}
                className="group bg-white rounded-xl p-6 border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer"
              >
                <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition-colors" />
                <h3 className="font-semibold text-sm">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} open positions</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}