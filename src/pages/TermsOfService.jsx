import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { base44 } from "@/api/base44Client";

const DEFAULT_AR = `
<h2>1. قبول الشروط</h2>
<p>باستخدامك لمنصة Hello Staff، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة.</p>
<h2>2. وصف الخدمة</h2>
<p>Hello Staff هي منصة توظيف تربط بين الباحثين عن عمل في قطاع الضيافة وأصحاب العمل. نقدم خدمات نشر الوظائف والتقديم عليها وإدارة المقابلات.</p>
<h2>3. حسابات المستخدمين</h2>
<p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تتم من خلاله. يجب إخطارنا فوراً بأي استخدام غير مصرح به لحسابك.</p>
<h2>4. المحتوى المقبول</h2>
<p>يُحظر نشر معلومات كاذبة أو مضللة، أو انتهاك حقوق الملكية الفكرية، أو إرسال رسائل غير مرغوب فيها، أو أي محتوى ينتهك القوانين المعمول بها.</p>
<h2>5. المسؤولية</h2>
<p>Hello Staff وسيط بين أصحاب العمل والمرشحين ولا تتحمل مسؤولية قرارات التوظيف أو الاتفاقيات المبرمة بين الطرفين.</p>
<h2>6. إنهاء الخدمة</h2>
<p>يحق لنا تعليق أو إنهاء حسابك في حال انتهاك هذه الشروط، مع الإخطار المسبق عندما يكون ذلك ممكناً.</p>
<h2>7. التعديلات</h2>
<p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو عبر المنصة.</p>
<h2>8. التواصل معنا</h2>
<p>لأي استفسارات، يرجى التواصل معنا عبر صفحة <a href="/contact">اتصل بنا</a>.</p>
`;

const DEFAULT_EN = `
<h2>1. Acceptance of Terms</h2>
<p>By using Hello Staff, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use the platform.</p>
<h2>2. Description of Service</h2>
<p>Hello Staff is a recruitment platform connecting job seekers in the hospitality industry with employers. We provide job posting, application management, and interview scheduling services.</p>
<h2>3. User Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>
<h2>4. Acceptable Use</h2>
<p>You may not post false or misleading information, infringe on intellectual property rights, send spam, or engage in any activity that violates applicable laws.</p>
<h2>5. Liability</h2>
<p>Hello Staff acts as an intermediary between employers and candidates and is not responsible for hiring decisions or agreements made between parties.</p>
<h2>6. Termination</h2>
<p>We reserve the right to suspend or terminate your account for violations of these terms, with prior notice when reasonably possible.</p>
<h2>7. Modifications</h2>
<p>We reserve the right to modify these terms at any time. You will be notified of material changes via email or through the platform.</p>
<h2>8. Contact Us</h2>
<p>For any questions, please reach out via our <a href="/contact">Contact</a> page.</p>
`;

export default function TermsOfService() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: terms, isLoading } = useQuery({
    queryKey: ["terms-of-service", lang],
    queryFn: async () => {
      const termsList = await base44.entities.TermsOfService.filter({ language: lang });
      return termsList[0] || null;
    },
  });

  const title = terms?.title || (isAr ? "شروط الخدمة" : "Terms of Service");
  const content = terms?.content || (isAr ? DEFAULT_AR : DEFAULT_EN);

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          {isAr ? "العودة للرئيسية" : "Back to Home"}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
        {terms?.lastUpdated ? (
          <p className="text-sm text-muted-foreground mb-8">
            {isAr ? "آخر تحديث: " : "Last updated: "}{terms.lastUpdated}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-8">
            {isAr ? "آخر تحديث: أبريل 2025" : "Last updated: April 2025"}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className="prose prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_a]:text-accent [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
}