import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Share2, Lock, UserCheck, Mail, Globe, Cookie, RefreshCw } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const sections = {
  en: [
    {
      icon: Eye,
      title: "1. Information We Collect",
      content: `We collect information you provide directly when creating an account, filling out forms, or contacting us. This includes:
      
• **Personal Information:** Full name, email address, phone number, date of birth, and location.
• **Professional Information:** Resume/CV, work experience, skills, education, and job preferences.
• **Employer Information:** Company name, business type, address, and team member details.
• **Usage Data:** Browser type, IP address, pages visited, and interaction patterns to improve our services.
• **Communications:** Messages exchanged through the platform between candidates and employers.`
    },
    {
      icon: Shield,
      title: "2. How We Use Your Information",
      content: `We use the information we collect to:

• Operate and maintain the Hello Staff platform.
• Match candidates with relevant job opportunities.
• Enable employers to review applications and manage hiring.
• Send notifications about application status updates, interviews, and new job matches.
• Improve our services, develop new features, and personalize your experience.
• Prevent fraud, enforce our terms, and ensure platform security.
• Comply with legal obligations and respond to lawful requests.`
    },
    {
      icon: Share2,
      title: "3. Information Sharing",
      content: `We do not sell or rent your personal information. We may share your data in the following cases:

• **Employers:** When you apply for a job, your profile and application are shared with the relevant employer.
• **Service Providers:** We work with trusted third-party services (hosting, analytics, email delivery) that process data on our behalf under strict confidentiality agreements.
• **Legal Requirements:** We may disclose information when required by law, court order, or to protect the rights and safety of Hello Staff and its users.
• **Business Transfers:** In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of the transaction.`
    },
    {
      icon: Lock,
      title: "4. Data Security",
      content: `We take the security of your data seriously and implement industry-standard measures:

• All data is encrypted in transit using TLS/SSL.
• Database access is restricted through Row Level Security (RLS) policies.
• Authentication is handled through secure, industry-standard protocols.
• Regular security audits and monitoring for unauthorized access.
• Employee access to personal data is limited to those who need it to perform their duties.`
    },
    {
      icon: Cookie,
      title: "5. Cookies & Tracking",
      content: `We use essential cookies to maintain your session and preferences (such as language selection). We may also use analytics cookies to understand how our platform is used.

• **Essential Cookies:** Required for authentication and basic platform functionality.
• **Preference Cookies:** Store your language and display settings.
• **Analytics Cookies:** Help us understand usage patterns to improve our platform.

You can configure your browser to reject cookies, but some features may not work properly.`
    },
    {
      icon: UserCheck,
      title: "6. Your Rights",
      content: `You have the following rights regarding your personal data:

• **Access:** Request a copy of the personal data we hold about you.
• **Correction:** Update or correct inaccurate personal information.
• **Deletion:** Request deletion of your account and associated data.
• **Portability:** Request your data in a portable, machine-readable format.
• **Withdrawal of Consent:** Withdraw consent for data processing at any time.
• **Objection:** Object to processing of your data for certain purposes.

To exercise any of these rights, visit your account Settings or contact us.`
    },
    {
      icon: Globe,
      title: "7. Data Retention",
      content: `We retain your personal data for as long as your account is active or as needed to provide our services. When you delete your account:

• Profile data is permanently removed within 30 days.
• Application history is anonymized for statistical purposes.
• Messages are deleted from our systems.
• Backup copies are purged according to our retention schedule.`
    },
    {
      icon: RefreshCw,
      title: "8. Changes to This Policy",
      content: `We may update this Privacy Policy periodically. When we make significant changes, we will:

• Notify you via email or an in-platform notification.
• Update the "Last Updated" date at the top of this page.
• Provide a summary of key changes.

Your continued use of Hello Staff after changes constitutes acceptance of the updated policy.`
    },
    {
      icon: Mail,
      title: "9. Contact Us",
      content: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:

• **Email:** privacy@hellostaff.ps
• **Contact Page:** [Contact Us](/contact)
• **Address:** Ramallah, Palestine

We aim to respond to all privacy-related inquiries within 48 business hours.`
    }
  ],
  ar: [
    {
      icon: Eye,
      title: "1. المعلومات التي نجمعها",
      content: `نجمع المعلومات التي تقدمها مباشرةً عند إنشاء حساب أو ملء نماذج أو التواصل معنا، وتشمل:

• **المعلومات الشخصية:** الاسم الكامل، البريد الإلكتروني، رقم الهاتف، تاريخ الميلاد، والموقع.
• **المعلومات المهنية:** السيرة الذاتية، الخبرة العملية، المهارات، التعليم، وتفضيلات العمل.
• **معلومات صاحب العمل:** اسم الشركة، نوع النشاط، العنوان، وتفاصيل أعضاء الفريق.
• **بيانات الاستخدام:** نوع المتصفح، عنوان IP، الصفحات المزارة، وأنماط التفاعل لتحسين خدماتنا.
• **المراسلات:** الرسائل المتبادلة عبر المنصة بين المرشحين وأصحاب العمل.`
    },
    {
      icon: Shield,
      title: "2. كيف نستخدم معلوماتك",
      content: `نستخدم المعلومات التي نجمعها لأجل:

• تشغيل وصيانة منصة هيلو ستاف.
• مطابقة المرشحين بفرص العمل المناسبة.
• تمكين أصحاب العمل من مراجعة الطلبات وإدارة التوظيف.
• إرسال إشعارات حول تحديثات حالة الطلبات والمقابلات وفرص العمل الجديدة.
• تحسين خدماتنا وتطوير ميزات جديدة وتخصيص تجربتك.
• منع الاحتيال وتطبيق شروطنا وضمان أمان المنصة.
• الامتثال للالتزامات القانونية والاستجابة للطلبات المشروعة.`
    },
    {
      icon: Share2,
      title: "3. مشاركة المعلومات",
      content: `لا نبيع أو نؤجّر معلوماتك الشخصية. قد نشارك بياناتك في الحالات التالية:

• **أصحاب العمل:** عند تقديمك على وظيفة، يتم مشاركة ملفك الشخصي وطلبك مع صاحب العمل المعني.
• **مزودو الخدمة:** نتعاون مع خدمات طرف ثالث موثوقة (الاستضافة، التحليلات، البريد الإلكتروني) تعالج البيانات نيابةً عنا بموجب اتفاقيات سرية صارمة.
• **المتطلبات القانونية:** قد نكشف عن المعلومات عند اقتضاء القانون أو أمر المحكمة أو لحماية حقوق وسلامة هيلو ستاف ومستخدميها.
• **نقل الأعمال:** في حالة الاندماج أو الاستحواذ أو بيع الأصول، قد تُنقل بياناتك كجزء من العملية.`
    },
    {
      icon: Lock,
      title: "4. أمان البيانات",
      content: `نأخذ أمان بياناتك على محمل الجد ونطبّق معايير الصناعة:

• جميع البيانات مشفرة أثناء النقل باستخدام TLS/SSL.
• الوصول لقاعدة البيانات محدود عبر سياسات أمان على مستوى الصفوف (RLS).
• المصادقة تتم عبر بروتوكولات آمنة ومعتمدة عالمياً.
• مراجعات أمنية دورية ومراقبة مستمرة لمحاولات الوصول غير المصرح به.
• وصول الموظفين للبيانات الشخصية مقيّد بمن يحتاجونها لأداء مهامهم.`
    },
    {
      icon: Cookie,
      title: "5. ملفات تعريف الارتباط والتتبع",
      content: `نستخدم ملفات تعريف الارتباط الأساسية للحفاظ على جلستك وتفضيلاتك (مثل اختيار اللغة). قد نستخدم أيضاً ملفات تحليلية لفهم استخدام المنصة.

• **ملفات أساسية:** مطلوبة للمصادقة والوظائف الأساسية للمنصة.
• **ملفات التفضيلات:** تخزّن إعدادات اللغة والعرض الخاصة بك.
• **ملفات تحليلية:** تساعدنا في فهم أنماط الاستخدام لتحسين المنصة.

يمكنك ضبط متصفحك لرفض ملفات تعريف الارتباط، لكن بعض الميزات قد لا تعمل بشكل صحيح.`
    },
    {
      icon: UserCheck,
      title: "6. حقوقك",
      content: `لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:

• **الوصول:** طلب نسخة من البيانات الشخصية التي نحتفظ بها عنك.
• **التصحيح:** تحديث أو تصحيح المعلومات الشخصية غير الدقيقة.
• **الحذف:** طلب حذف حسابك والبيانات المرتبطة به.
• **قابلية النقل:** طلب بياناتك بتنسيق قابل للنقل والقراءة الآلية.
• **سحب الموافقة:** سحب موافقتك على معالجة البيانات في أي وقت.
• **الاعتراض:** الاعتراض على معالجة بياناتك لأغراض معينة.

لممارسة أي من هذه الحقوق، قم بزيارة صفحة الإعدادات أو تواصل معنا.`
    },
    {
      icon: Globe,
      title: "7. الاحتفاظ بالبيانات",
      content: `نحتفظ ببياناتك الشخصية طالما حسابك نشط أو حسب الحاجة لتقديم خدماتنا. عند حذف حسابك:

• تُحذف بيانات الملف الشخصي نهائياً خلال 30 يوماً.
• يتم إخفاء هوية سجل الطلبات لأغراض إحصائية.
• تُحذف الرسائل من أنظمتنا.
• تُمسح النسخ الاحتياطية وفقاً لجدول الاحتفاظ لدينا.`
    },
    {
      icon: RefreshCw,
      title: "8. تغييرات على هذه السياسة",
      content: `قد نقوم بتحديث سياسة الخصوصية هذه بشكل دوري. عند إجراء تغييرات جوهرية، سنقوم بـ:

• إخطارك عبر البريد الإلكتروني أو إشعار داخل المنصة.
• تحديث تاريخ "آخر تحديث" أعلى هذه الصفحة.
• تقديم ملخص للتغييرات الرئيسية.

استمرارك في استخدام هيلو ستاف بعد التغييرات يُعتبر قبولاً للسياسة المحدّثة.`
    },
    {
      icon: Mail,
      title: "9. تواصل معنا",
      content: `إذا كانت لديك أسئلة أو استفسارات حول سياسة الخصوصية أو بياناتك الشخصية، يرجى التواصل معنا:

• **البريد الإلكتروني:** privacy@hellostaff.ps
• **صفحة التواصل:** [تواصل معنا](/contact)
• **العنوان:** رام الله، فلسطين

نسعى للرد على جميع الاستفسارات المتعلقة بالخصوصية خلال 48 ساعة عمل.`
    }
  ]
};

function renderMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent underline hover:text-accent/80">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const data = isAr ? sections.ar : sections.en;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {isAr
              ? "نحن في هيلو ستاف نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك."
              : "At Hello Staff, we are committed to protecting your privacy and the security of your personal data. This policy explains how we collect, use, and protect your information."}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {isAr ? "آخر تحديث: أبريل 2026" : "Last updated: April 2026"}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-8">
          {data.map((section, i) => {
            const Icon = section.icon;
            return (
              <section key={i} className="bg-card rounded-2xl border border-border p-6 sm:p-8 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <div
                  className="text-muted-foreground leading-relaxed text-sm [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-accent [&_a]:underline"
                  style={{ paddingInlineStart: '2.75rem' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                />
              </section>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center text-sm text-muted-foreground border-t border-border pt-8">
          <p>
            {isAr ? "هل لديك أسئلة حول ممارسات الخصوصية لدينا؟" : "Have questions about our privacy practices?"}
          </p>
          <Link to="/contact" className="text-accent underline hover:text-accent/80 font-medium">
            {isAr ? "تواصل مع فريق الخصوصية" : "Contact our Privacy Team"}
          </Link>
        </div>
      </div>
    </div>
  );
}