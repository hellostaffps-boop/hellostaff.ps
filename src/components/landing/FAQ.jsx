import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is Hello Staff free for job seekers?",
    a: "Yes! Hello Staff is completely free for candidates. You can create a profile, browse jobs, and apply without any charges.",
  },
  {
    q: "How long does it take to get hired?",
    a: "Most candidates receive responses within 48 hours. Many of our users find jobs within their first week on the platform.",
  },
  {
    q: "What types of businesses use Hello Staff?",
    a: "We work with cafes, restaurants, bars, hotels, catering companies, bakeries, food trucks, and other hospitality businesses.",
  },
  {
    q: "How does pricing work for employers?",
    a: "We offer flexible plans for employers starting from a free tier. Post jobs, access candidate profiles, and manage applications with plans that scale with your needs.",
  },
  {
    q: "Can I hire for multiple locations?",
    a: "Absolutely. Our platform supports multi-location businesses with team management features built right in.",
  },
  {
    q: "How are candidates verified?",
    a: "We verify candidate profiles through identity checks and work history verification to ensure quality for employers.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Everything you need to know about Hello Staff.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-white rounded-xl border border-border px-6 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}