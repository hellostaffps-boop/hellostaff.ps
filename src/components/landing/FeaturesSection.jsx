import { Zap, Shield, Clock, Globe, BarChart3, Heart, Users, Briefcase } from "lucide-react";

const workerFeatures = [
  { icon: Zap, title: "Quick Apply", desc: "Apply to jobs with one click using your saved profile." },
  { icon: Shield, title: "Verified Employers", desc: "All businesses are verified for your safety and peace of mind." },
  { icon: Clock, title: "Flexible Scheduling", desc: "Find full-time, part-time, and weekend positions that fit your life." },
  { icon: Globe, title: "Local Opportunities", desc: "Discover jobs at cafes and restaurants near you." },
];

const employerFeatures = [
  { icon: Users, title: "Talent Pool", desc: "Access thousands of pre-screened hospitality professionals." },
  { icon: Briefcase, title: "Smart Matching", desc: "Our system suggests the best candidates for your roles." },
  { icon: BarChart3, title: "Hiring Analytics", desc: "Track applications, views, and hiring metrics in real time." },
  { icon: Heart, title: "Employer Branding", desc: "Showcase your company culture and attract top talent." },
];

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Worker features */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-accent mb-3">
              For Workers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Your next job is one click away
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Create your profile once and apply to hundreds of hospitality jobs instantly.
            </p>
            <div className="space-y-6">
              {workerFeatures.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary to-accent/5 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Worker Dashboard Preview</span>
          </div>
        </div>

        {/* Employer features */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-gradient-to-br from-secondary to-primary/5 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Employer Dashboard Preview</span>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-accent mb-3">
              For Employers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Hire the right people, faster
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Post jobs, review candidates, and manage your team — all from one platform.
            </p>
            <div className="space-y-6">
              {employerFeatures.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}