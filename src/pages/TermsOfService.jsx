import { Link } from "react-router-dom";
import { ArrowLeft, FileText, AlertCircle, UserCog, ShieldAlert, Ban, Gavel, RefreshCw, Mail, Handshake, CreditCard } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const sections = {
  en: [
    {
      icon: Handshake,
      title: "1. Acceptance of Terms",
      content: `By accessing or using the Hello Staff platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all terms, you must not use the Service.

These Terms apply to all users, including candidates (job seekers), employers (businesses posting jobs), and administrators. By creating an account, you confirm that you are at least 16 years of age and have the legal capacity to enter into binding agreements.`
    },
    {
      icon: FileText,
      title: "2. Description of Service",
      content: `Hello Staff is a recruitment platform connecting job seekers in the hospitality industry with employers in Palestine and the region. Our services include:

• **Job Posting:** Employers can create and manage job listings.
• **Job Search & Application:** Candidates can browse jobs, apply, and track applications.
• **Messaging:** Secure communication between candidates and employers.
• **Interview Scheduling:** Tools to propose, select, and manage interview slots.
• **Profile Management:** Create and maintain professional profiles and company pages.
• **Team Management:** Employers can invite and manage team members.

Hello Staff acts as a facilitator and is not a party to any employment contract between users.`
    },
    {
      icon: UserCog,
      title: "3. User Accounts & Responsibilities",
      content: `When creating an account, you agree to:

• Provide accurate, current, and complete information.
• Maintain the security and confidentiality of your login credentials.
• Notify us immediately of any unauthorized access or use of your account.
• Accept responsibility for all activities that occur under your account.
• Use only one account per person (duplicate accounts may be suspended).

**For Employers:**
• You represent that you have authority to post jobs on behalf of your organization.
• All job postings must reflect real, currently available positions.
• You are responsible for compliance with applicable labor laws.

**For Candidates:**
• All information in your profile and applications must be truthful and accurate.
• You may not misrepresent your qualifications, experience, or identity.`
    },
    {
      icon: Ban,
      title: "4. Prohibited Conduct",
      content: `You agree NOT to:

• Post false, misleading, or fraudulent job listings or profile information.
• Discriminate based on race, gender, religion, nationality, or disability.
• Collect, harvest, or scrape personal data of other users.
• Send spam, unsolicited messages, or promotional content through the platform.
• Attempt to circumvent security features or access unauthorized areas.
• Use the platform for any illegal or unauthorized purpose.
• Reverse engineer, decompile, or attempt to extract source code from the platform.
• Impersonate another person, company, or entity.
• Post content that is defamatory, abusive, obscene, or violates intellectual property rights.

Violation of these rules may result in immediate account suspension or termination.`
    },
    {
      icon: ShieldAlert,
      title: "5. Intellectual Property",
      content: `**Platform Content:** The Hello Staff platform, including its design, logos, text, graphics, and software, is the intellectual property of Hello Staff and is protected by applicable copyright and trademark laws.

**User Content:** You retain ownership of content you post (job listings, profiles, messages). By posting content, you grant Hello Staff a non-exclusive, worldwide license to display and distribute that content as needed to operate the Service.

**Restrictions:** You may not reproduce, modify, distribute, or create derivative works from any Hello Staff content without prior written consent.`
    },
    {
      icon: AlertCircle,
      title: "6. Limitation of Liability",
      content: `Hello Staff provides the Service "as is" and "as available." We do not guarantee:

• The accuracy or completeness of any job listing or user profile.
• That the Service will be uninterrupted, error-free, or secure.
• The outcome of any hiring decision or employment relationship.

**Hello Staff shall not be liable for:**
• Any direct, indirect, incidental, or consequential damages arising from your use of the Service.
• Actions or decisions made by employers or candidates as a result of using the platform.
• Loss of data, revenue, or business opportunities.

Our total liability shall not exceed the amount paid by you (if any) to Hello Staff in the 12 months preceding the claim.`
    },
    {
      icon: Gavel,
      title: "7. Termination & Suspension",
      content: `**By You:** You may delete your account at any time through your account Settings. Upon deletion, your profile and personal data will be removed according to our Privacy Policy.

**By Us:** We reserve the right to suspend or terminate your account if:
• You violate these Terms of Service.
• Your account is involved in fraudulent or illegal activity.
• You have been inactive for an extended period (12+ months).
• We receive credible complaints about your conduct.

We will provide notice before termination when reasonably possible, except in cases of severe violations or fraud.`
    },
    {
      icon: RefreshCw,
      title: "8. Modifications to Terms",
      content: `We may modify these Terms at any time. When we make material changes:

• We will notify you via email or an in-platform notification at least 14 days before the changes take effect.
• We will update the "Last Updated" date at the top of this page.
• Continued use of the Service after changes constitutes acceptance of the updated Terms.

If you disagree with any changes, you may terminate your account before the new terms take effect.`
    },
    {
      icon: CreditCard,
      title: "9. Subscription Cancellation & Refunds",
      content: `In accordance with Palestinian commercial regulations regarding digital services:

• **Non-Refundable Services:** Once a subscription is activated and the service is utilized (e.g., a job listing is posted, or candidate data is accessed), the fees are strictly non-refundable.
• **Refund Exceptions:** Refunds may only be issued if a subscription was purchased but remains completely unused, provided a refund request is submitted within 3 business days of the transaction.
• **Cancellation:** You may cancel your subscription at any time to prevent future renewals. Active subscriptions will remain valid until the end of the current billing cycle. No pro-rated refunds are provided for partial use.`
    },
    {
      icon: FileText,
      title: "10. Governing Law & Disputes",
      content: `These Terms shall be governed by and construed in accordance with the laws of the State of Palestine. Any disputes arising from these Terms or the use of the Service shall be resolved through:

1. **Negotiation:** Good-faith discussion between the parties.
2. **Mediation:** If negotiation fails, through a mutually agreed-upon mediator.
3. **Arbitration:** As a final resort, binding arbitration under applicable rules.

The language of proceedings shall be Arabic or English, as agreed by the parties.`
    },
    {
      icon: Mail,
      title: "11. Contact Information",
      content: `For questions or concerns about these Terms of Service:

• **Email:** legal@staffps.com
• **Contact Page:** [Contact Us](/contact)
• **Address:** Ramallah, Palestine

We aim to respond to all inquiries within 48 business hours.`
    }
  ],
  ar: [
    {
      icon: Handshake,
      title: "1. قبول الشروط",
      content: `باستخدامك لمنصة هيلو ستاف ("الخدمة")، فإنك توافق على الالتزام بشروط الخدمة هذه ("الشروط"). إذا كنت لا توافق على جميع الشروط، يجب عليك عدم استخدام الخدمة.

تنطبق هذه الشروط على جميع المستخدمين، بما في ذلك المرشحين (الباحثين عن عمل) وأصحاب العمل (المنشآت التي تنشر وظائف) والمشرفين. بإنشاء حساب، تؤكد أن عمرك 16 عاماً على الأقل ولديك الأهلية القانونية لإبرام اتفاقيات ملزمة.`
    },
    {
      icon: FileText,
      title: "2. وصف الخدمة",
      content: `هيلو ستاف هي منصة توظيف تربط الباحثين عن عمل في قطاع الضيافة بأصحاب العمل في فلسطين والمنطقة. تشمل خدماتنا:

• **نشر الوظائف:** يمكن لأصحاب العمل إنشاء وإدارة إعلانات الوظائف.
• **البحث عن الوظائف والتقديم:** يمكن للمرشحين تصفح الوظائف والتقديم وتتبع الطلبات.
• **المراسلة:** تواصل آمن بين المرشحين وأصحاب العمل.
• **جدولة المقابلات:** أدوات لاقتراح واختيار وإدارة مواعيد المقابلات.
• **إدارة الملفات الشخصية:** إنشاء وصيانة ملفات مهنية وصفحات شركات.
• **إدارة الفريق:** يمكن لأصحاب العمل دعوة وإدارة أعضاء الفريق.

تعمل هيلو ستاف كوسيط وليست طرفاً في أي عقد عمل بين المستخدمين.`
    },
    {
      icon: UserCog,
      title: "3. حسابات المستخدمين والمسؤوليات",
      content: `عند إنشاء حساب، توافق على:

• تقديم معلومات دقيقة وحديثة وكاملة.
• الحفاظ على أمان وسرية بيانات تسجيل الدخول الخاصة بك.
• إخطارنا فوراً بأي وصول أو استخدام غير مصرح به لحسابك.
• تحمّل المسؤولية عن جميع الأنشطة التي تتم من خلال حسابك.
• استخدام حساب واحد فقط لكل شخص (قد يتم تعليق الحسابات المكررة).

**لأصحاب العمل:**
• تُقرّ بأن لديك الصلاحية لنشر وظائف نيابةً عن مؤسستك.
• يجب أن تعكس جميع إعلانات الوظائف فرصاً حقيقية ومتاحة حالياً.
• أنت مسؤول عن الامتثال لقوانين العمل المعمول بها.

**للمرشحين:**
• يجب أن تكون جميع المعلومات في ملفك الشخصي وطلباتك صادقة ودقيقة.
• لا يجوز لك تزييف مؤهلاتك أو خبرتك أو هويتك.`
    },
    {
      icon: Ban,
      title: "4. السلوك المحظور",
      content: `توافق على عدم القيام بـ:

• نشر إعلانات وظائف أو معلومات ملف شخصي كاذبة أو مضللة أو احتيالية.
• التمييز على أساس العرق أو الجنس أو الدين أو الجنسية أو الإعاقة.
• جمع أو حصاد أو استخراج البيانات الشخصية لمستخدمين آخرين.
• إرسال رسائل غير مرغوب فيها أو محتوى ترويجي عبر المنصة.
• محاولة تجاوز ميزات الأمان أو الوصول لمناطق غير مصرح بها.
• استخدام المنصة لأي غرض غير قانوني أو غير مصرح به.
• الهندسة العكسية أو تفكيك أو محاولة استخراج الكود المصدري للمنصة.
• انتحال شخصية شخص آخر أو شركة أو كيان.
• نشر محتوى تشهيري أو مسيء أو فاحش أو ينتهك حقوق الملكية الفكرية.

قد يؤدي انتهاك هذه القواعد إلى تعليق الحساب أو إنهائه فوراً.`
    },
    {
      icon: ShieldAlert,
      title: "5. الملكية الفكرية",
      content: `**محتوى المنصة:** منصة هيلو ستاف، بما في ذلك تصميمها وشعاراتها ونصوصها ورسوماتها وبرامجها، هي ملكية فكرية لهيلو ستاف ومحمية بموجب قوانين حقوق النشر والعلامات التجارية المعمول بها.

**محتوى المستخدم:** تحتفظ بملكية المحتوى الذي تنشره (إعلانات الوظائف، الملفات الشخصية، الرسائل). بنشر المحتوى، تمنح هيلو ستاف ترخيصاً غير حصري وعالمياً لعرض وتوزيع ذلك المحتوى حسب الحاجة لتشغيل الخدمة.

**القيود:** لا يجوز لك إعادة إنتاج أو تعديل أو توزيع أو إنشاء أعمال مشتقة من أي محتوى لهيلو ستاف دون موافقة كتابية مسبقة.`
    },
    {
      icon: AlertCircle,
      title: "6. تحديد المسؤولية",
      content: `تقدم هيلو ستاف الخدمة "كما هي" و"حسب توفرها". لا نضمن:

• دقة أو اكتمال أي إعلان وظيفة أو ملف مستخدم.
• أن الخدمة ستكون متواصلة أو خالية من الأخطاء أو آمنة.
• نتيجة أي قرار توظيف أو علاقة عمل.

**لا تتحمل هيلو ستاف المسؤولية عن:**
• أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناشئة عن استخدامك للخدمة.
• إجراءات أو قرارات يتخذها أصحاب العمل أو المرشحون نتيجة استخدام المنصة.
• فقدان البيانات أو الإيرادات أو فرص العمل.

لا تتجاوز مسؤوليتنا الإجمالية المبلغ المدفوع من قِبلك (إن وُجد) لهيلو ستاف في الـ 12 شهراً السابقة للمطالبة.`
    },
    {
      icon: Gavel,
      title: "7. الإنهاء والتعليق",
      content: `**من قِبلك:** يمكنك حذف حسابك في أي وقت من خلال صفحة الإعدادات. عند الحذف، ستتم إزالة بياناتك الشخصية وفقاً لسياسة الخصوصية الخاصة بنا.

**من قِبلنا:** نحتفظ بالحق في تعليق أو إنهاء حسابك إذا:
• انتهكت شروط الخدمة هذه.
• كان حسابك متورطاً في نشاط احتيالي أو غير قانوني.
• كنت غير نشط لفترة طويلة (12+ شهراً).
• تلقينا شكاوى موثوقة حول سلوكك.

سنقدم إشعاراً قبل الإنهاء عندما يكون ذلك ممكناً بشكل معقول، باستثناء حالات الانتهاكات الجسيمة أو الاحتيال.`
    },
    {
      icon: RefreshCw,
      title: "8. تعديل الشروط",
      content: `قد نعدّل هذه الشروط في أي وقت. عند إجراء تغييرات جوهرية:

• سنُخطرك عبر البريد الإلكتروني أو إشعار داخل المنصة قبل 14 يوماً على الأقل من دخول التغييرات حيز التنفيذ.
• سنحدّث تاريخ "آخر تحديث" أعلى هذه الصفحة.
• يُعتبر استمرارك في استخدام الخدمة بعد التغييرات قبولاً للشروط المحدّثة.

إذا لم توافق على أي تغييرات، يمكنك إنهاء حسابك قبل دخول الشروط الجديدة حيز التنفيذ.`
    },
    {
      icon: CreditCard,
      title: "9. سياسة الإلغاء واسترجاع الأموال",
      content: `بما يتوافق مع القوانين واللوائح التجارية في دولة فلسطين الخاصة بالخدمات الرقمية:

• **الخدمات غير القابلة للاسترجاع:** بمجرد تفعيل الاشتراك واستخدام الخدمة (مثل نشر إعلان وظيفي أو الوصول إلى بيانات المرشحين)، تصبح الرسوم غير قابلة للاسترجاع نهائياً.
• **استثناءات الاسترجاع:** يمكن إصدار المبالغ المستردة فقط في حال تم شراء الاشتراك ولم يتم استخدامه مطلقاً، شريطة تقديم طلب الاسترجاع (إلكترونياً) خلال 3 أيام عمل من تاريخ المعاملة.
• **الإلغاء:** يمكنك إلغاء اشتراكك القادم في أي وقت لمنع التجديد المستقبلي. سيظل الاشتراك النشط صالحاً حتى نهاية دورة الفوترة الحالية. لا يتم تقديم مبالغ مستردة جزئية (Pro-rated) عن فترات الاستخدام غير المكتملة.`
    },
    {
      icon: FileText,
      title: "10. القانون الحاكم وحل النزاعات",
      content: `تخضع هذه الشروط وتُفسَّر وفقاً لقوانين دولة فلسطين. تُحلّ أي نزاعات ناشئة عن هذه الشروط أو استخدام الخدمة من خلال:

1. **التفاوض:** مناقشة بحسن نية بين الأطراف.
2. **الوساطة:** في حال فشل التفاوض، من خلال وسيط يتفق عليه الطرفان.
3. **التحكيم:** كملاذ أخير، تحكيم ملزم وفقاً للقواعد المعمول بها.

تكون لغة الإجراءات العربية أو الإنجليزية، حسب اتفاق الأطراف.`
    },
    {
      icon: Mail,
      title: "11. معلومات التواصل",
      content: `لأي أسئلة أو استفسارات حول شروط الخدمة:

• **البريد الإلكتروني:** legal@hellostaff.ps
• **صفحة التواصل:** [تواصل معنا](/contact)
• **العنوان:** رام الله، فلسطين

نسعى للرد على جميع الاستفسارات خلال 48 ساعة عمل.`
    }
  ]
};

import { sanitizeMarkdownHtml } from "@/lib/sanitizeHtml";

function renderMarkdown(text) {
  const rawHtml = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent underline hover:text-accent/80">$1</a>')
    .replace(/\n/g, '<br/>');
  return sanitizeMarkdownHtml(rawHtml);
}

export default function TermsOfService() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const data = isAr ? sections.ar : sections.en;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-accent/5 via-background to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isAr ? "شروط الخدمة" : "Terms of Service"}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {isAr
              ? "يرجى قراءة هذه الشروط بعناية قبل استخدام منصة هيلو ستاف. باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام."
              : "Please read these terms carefully before using the Hello Staff platform. By using the platform, you agree to be bound by these terms and conditions."}
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
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
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

        {/* Bottom Links */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {isAr ? "بالتسجيل في هيلو ستاف، فإنك توافق على هذه الشروط و" : "By signing up for Hello Staff, you agree to these Terms and our "}
            <Link to="/privacy" className="text-accent underline hover:text-accent/80">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>.
          </p>
          <Link to="/contact" className="text-accent underline hover:text-accent/80 font-medium flex-shrink-0">
            {isAr ? "تواصل معنا" : "Contact Us"}
          </Link>
        </div>
      </div>
    </div>
  );
}