import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Barista",
    text: "Found my dream job at a specialty coffee shop within a week. The process was incredibly smooth.",
  },
  {
    name: "James Chen",
    role: "Restaurant Owner",
    text: "Hello Staff has completely changed how we hire. We found three amazing chefs in under two weeks.",
  },
  {
    name: "Sarah Kim",
    role: "Cafe Manager",
    text: "The quality of candidates is outstanding. Every hire we've made through Hello Staff has been a great fit.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Loved by teams and talent
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Here's what our community has to say about Hello Staff.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-secondary/30 rounded-2xl p-8 border border-border"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}