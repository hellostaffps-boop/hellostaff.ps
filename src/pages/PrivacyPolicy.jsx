import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { base44 } from "@/api/base44Client";

const DEFAULT_AR = `
<h2>1. المعلومات التي نجمعها</h2>
<p>نجمع المعلومات التي تقدمها مباشرةً عند إنشاء حساب، أو ملء نموذج، أو التواصل معنا، وتشمل: الاسم، البريد الإلكتروني، رقم الهاتف، والسيرة الذاتية.</p>
<h2>2. كيف نستخدم معلوماتك</h2>
<p>نستخدم المعلومات التي نجمعها لتشغيل المنصة، ومطابقة المرشحين بأصحاب العمل، وإرسال الإشعارات المتعلقة بطلباتك، وتحسين خدماتنا.</p>
<h2>3. مشاركة المعلومات</h2>
<p>لا نبيع أو نؤجّر معلوماتك الشخصية لأطراف ثالثة. نشارك المعلومات فقط مع أصحاب العمل الذين تقدمت لديهم، ومزودي الخدمة الذين يساعدوننا في تشغيل المنصة.</p>
<h2>4. أمان البيانات</h2>
<p>نتخذ تدابير أمنية معقولة لحماية معلوماتك من الوصول غير المصرح به، بما في ذلك التشفير وضوابط الوصول.</p>
<h2>5. حقوقك</h2>
<p>يحق لك الوصول إلى بياناتك الشخصية وتصحيحها أو حذفها في أي وقت عبر صفحة إعدادات حسابك، أو بالتواصل معنا مباشرةً.</p>
<h2>6. التواصل معنا</h2>
<p>إذا كانت لديك أي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر صفحة <a href="/contact">اتصل بنا</a>.</p>
`;

const DEFAULT_EN = `
<h2>1. Information We Collect</h2>
<p>We collect information you provide directly when creating an account, filling out a form, or contacting us — including name, email, phone number, and resume.</p>
<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to operate the platform, match candidates with employers, send notifications about your applications, and improve our services.</p>
<h2>3. Information Sharing</h2>
<p>We do not sell or rent your personal information to third parties. We share information only with employers you apply to and service providers who help us operate the platform.</p>
<h2>4. Data Security</h2>
<p>We take reasonable security measures to protect your information from unauthorized access, including encryption and access controls.</p>
<h2>5. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data at any time through your account settings or by contacting us directly.</p>
<h2>6. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please reach out via our <a href="/contact">Contact</a> page.</p>
`;

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: policy, isLoading } = useQuery({
    queryKey: ["privacy-policy", lang],
    queryFn: async () => {
      const policies = await base44.entities.PrivacyPolicy.filter({ language: lang });
      return policies[0] || null;
    },
  });

  const title = policy?.title || (isAr ? "سياسة الخصوصية" : "Privacy Policy");
  const content = policy?.content || (isAr ? DEFAULT_AR : DEFAULT_EN);

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          {isAr ? "العودة للرئيسية" : "Back to Home"}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
        {policy?.lastUpdated && (
          <p className="text-sm text-muted-foreground mb-8">
            {isAr ? "آخر تحديث: " : "Last updated: "}{policy.lastUpdated}
          </p>
        )}
        {!policy?.lastUpdated && (
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