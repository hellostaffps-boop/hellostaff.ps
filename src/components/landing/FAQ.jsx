import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/hooks/useLanguage";

const faqKeys = ["1", "2", "3", "4", "5", "6"];

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("faq", "heading")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("faq", "subtext")}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqKeys.map((key) => (
            <AccordionItem
              key={key}
              value={`faq-${key}`}
              className="bg-white rounded-xl border border-border px-6 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="text-sm font-semibold text-start hover:no-underline py-5">
                {t("faq", `q${key}`)}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {t("faq", `a${key}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}