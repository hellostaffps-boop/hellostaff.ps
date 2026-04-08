import { CheckCircle } from "lucide-react";

const reasons = [
  "Purpose-built for the hospitality industry",
  "Trusted by 1,200+ restaurants and cafes",
  "Verified profiles and employer backgrounds",
  "Lightning-fast hiring process",
  "Free for job seekers — always",
  "Dedicated support team for employers",
];

export default function WhySection() {
  return (
    <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why Hello Staff?
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-8 leading-relaxed">
              We built Hello Staff because hiring in hospitality shouldn't be complicated. 
              Our platform is designed specifically for the unique needs of cafes, restaurants, 
              and food service businesses.
            </p>
            <div className="space-y-4">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">{reason}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary-foreground/5 rounded-2xl h-80 flex items-center justify-center border border-primary-foreground/10">
            <span className="text-primary-foreground/40 text-sm">Platform Stats Visualization</span>
          </div>
        </div>
      </div>
    </section>
  );
}