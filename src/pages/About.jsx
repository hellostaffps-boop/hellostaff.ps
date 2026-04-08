import { Target, Heart, Users, Award } from "lucide-react";

const values = [
  { icon: Target, title: "Mission-Driven", desc: "We exist to make hiring in hospitality simple, fast, and fair for everyone." },
  { icon: Heart, title: "People-First", desc: "Every feature we build starts with the question: how does this help our users?" },
  { icon: Users, title: "Community", desc: "We're building a community of hospitality professionals who support each other." },
  { icon: Award, title: "Excellence", desc: "We hold ourselves to the highest standards in everything we do." },
];

export default function About() {
  return (
    <div>
      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            About Hello Staff
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Hello Staff was founded with a simple belief: hiring in the hospitality 
            industry should be as straightforward as ordering a coffee. We connect 
            talented workers with great businesses, making the hiring process seamless 
            for everyone involved.
          </p>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-accent">2026</div>
              <div className="text-sm text-muted-foreground mt-2">Founded</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">25+</div>
              <div className="text-sm text-muted-foreground mt-2">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent">3</div>
              <div className="text-sm text-muted-foreground mt-2">Countries</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}