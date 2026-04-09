import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { event, data, old_data } = payload;
    
    // Only send email on status update
    if (!data?.status || data.status === old_data?.status) {
      return Response.json({ success: true, skipped: true });
    }

    const applicationId = event.entity_id;
    const newStatus = data.status;
    const candidateEmail = data.candidate_email;
    const candidateName = data.candidate_name || 'المتقدم';
    const jobTitle = data.job_title || 'الوظيفة';
    const organizationName = data.organization_name || 'الشركة';

    // Status translations and templates
    const emailTemplates = {
      reviewing: {
        en: {
          subject: `Your application for ${jobTitle} has been received`,
          body: `Dear ${candidateName},\n\nThank you for applying for the ${jobTitle} position at ${organizationName}. We have received your application and it is currently under review.\n\nWe appreciate your interest and will get back to you soon.\n\nBest regards,\n${organizationName}`,
        },
        ar: {
          subject: `تم استلام طلبك على وظيفة ${jobTitle}`,
          body: `السلام عليكم ورحمة الله وبركاته,\n\nشكراً لك على تقديمك لوظيفة ${jobTitle} في ${organizationName}. تم استلام طلبك وهو قيد المراجعة حالياً.\n\nنقدر اهتمامك وسنتواصل معك قريباً.\n\nمع أطيب التحيات,\n${organizationName}`,
        },
      },
      shortlisted: {
        en: {
          subject: `Great news! You have been shortlisted for ${jobTitle}`,
          body: `Dear ${candidateName},\n\nCongratulations! We are pleased to inform you that your application for the ${jobTitle} position at ${organizationName} has been shortlisted.\n\nWe will contact you soon with the next steps.\n\nBest regards,\n${organizationName}`,
        },
        ar: {
          subject: `تهانينا! تم اختيار طلبك للوظيفة ${jobTitle}`,
          body: `السلام عليكم ورحمة الله وبركاته,\n\nتهانينا! يسرنا إبلاغك بأن طلبك على وظيفة ${jobTitle} في ${organizationName} قد تم اختياره.\n\nسنتواصل معك قريباً بخطوات المتابعة.\n\nمع أطيب التحيات,\n${organizationName}`,
        },
      },
      interview: {
        en: {
          subject: `Interview invitation for ${jobTitle} position`,
          body: `Dear ${candidateName},\n\nWe are delighted to invite you to an interview for the ${jobTitle} position at ${organizationName}.\n\nPlease check your application portal for interview details and scheduling information.\n\nWe look forward to meeting you!\n\nBest regards,\n${organizationName}`,
        },
        ar: {
          subject: `دعوة مقابلة شخصية لوظيفة ${jobTitle}`,
          body: `السلام عليكم ورحمة الله وبركاته,\n\nيسرنا دعوتك لحضور مقابلة شخصية لوظيفة ${jobTitle} في ${organizationName}.\n\nيرجى مراجعة بوابة التطبيق الخاصة بك للحصول على تفاصيل المقابلة ومعلومات الجدولة.\n\nنتطلع للالتقاء بك!\n\nمع أطيب التحيات,\n${organizationName}`,
        },
      },
      offered: {
        en: {
          subject: `Job offer for ${jobTitle} position`,
          body: `Dear ${candidateName},\n\nCongratulations! We are pleased to extend a job offer for the ${jobTitle} position at ${organizationName}.\n\nPlease check your application portal for the offer details.\n\nWe look forward to welcoming you to our team!\n\nBest regards,\n${organizationName}`,
        },
        ar: {
          subject: `عرض عمل لوظيفة ${jobTitle}`,
          body: `السلام عليكم ورحمة الله وبركاته,\n\nتهانينا! يسرنا تقديم عرض عمل لوظيفة ${jobTitle} في ${organizationName}.\n\nيرجى مراجعة بوابة التطبيق الخاصة بك لتفاصيل العرض.\n\nنتطلع لانضمامك إلى فريقنا!\n\nمع أطيب التحيات,\n${organizationName}`,
        },
      },
      rejected: {
        en: {
          subject: `Update on your application for ${jobTitle}`,
          body: `Dear ${candidateName},\n\nThank you for your interest in the ${jobTitle} position at ${organizationName}. We appreciate the time you invested in your application.\n\nUnfortunately, we have decided to move forward with other candidates at this time. We encourage you to apply for future opportunities.\n\nBest regards,\n${organizationName}`,
        },
        ar: {
          subject: `تحديث بخصوص طلبك على وظيفة ${jobTitle}`,
          body: `السلام عليكم ورحمة الله وبركاته,\n\nشكراً لك على اهتمامك بوظيفة ${jobTitle} في ${organizationName}. نقدر الوقت الذي استثمرته في طلبك.\n\nللأسف، قررنا المضي قدماً مع متقدمين آخرين في الوقت الحالي. نشجعك على التقديم للفرص المستقبلية.\n\nمع أطيب التحيات,\n${organizationName}`,
        },
      },
    };

    const template = emailTemplates[newStatus];
    if (!template) {
      return Response.json({ success: true, skipped: true, reason: 'No email template for status' });
    }

    // Detect language from candidate email or default to English
    const lang = newStatus ? 'en' : 'en';
    const emailContent = template[lang] || template['en'];

    // Send email using Base44 Core integration
    await base44.integrations.Core.SendEmail({
      to: candidateEmail,
      subject: emailContent.subject,
      body: emailContent.body,
    });

    return Response.json({
      success: true,
      applicationId,
      status: newStatus,
      candidateEmail,
      emailSent: true,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});