/**
 * pipelineNotifications.js
 * Sends auto-notifications to candidates when their application status changes in the pipeline.
 */
import { createNotification } from "@/lib/services/notificationService";

const STATUS_MESSAGES = {
  reviewing: {
    ar: {
      title: "🔍 طلبك قيد المراجعة",
      message: "قام صاحب العمل بمراجعة طلبك. ترقب التحديثات القادمة!",
    },
    en: {
      title: "🔍 Your application is under review",
      message: "The employer is reviewing your application. Stay tuned for updates!",
    },
  },
  shortlisted: {
    ar: {
      title: "⭐ تهانينا! تم اختيارك في القائمة المختصرة",
      message: "لقد تم اختيارك ضمن المرشحين المميزين. قد يتواصل معك صاحب العمل قريباً لتحديد موعد المقابلة أو التجربة.",
    },
    en: {
      title: "⭐ Congratulations! You've been shortlisted",
      message: "You've been selected as a top candidate! The employer may contact you soon for an interview or trial shift.",
    },
  },
  interview: {
    ar: {
      title: "📅 تمت دعوتك لمقابلة عمل",
      message: "يسعدنا إبلاغك بأنك مدعو لإجراء مقابلة. انتظر التواصل المباشر من صاحب العمل.",
    },
    en: {
      title: "📅 You've been invited for an interview",
      message: "You've been selected for an interview! Expect direct contact from the employer.",
    },
  },
  offered: {
    ar: {
      title: "🎉 تم تقديم عرض عمل لك!",
      message: "مبروك! قدم صاحب العمل عرض عمل لك. تواصل معه لإتمام التفاصيل.",
    },
    en: {
      title: "🎉 You've received a job offer!",
      message: "Congratulations! The employer has made you a job offer. Contact them to finalize the details.",
    },
  },
  hired: {
    ar: {
      title: "✅ تهانينا على قبولك!",
      message: "أبارك لك! لقد تم توظيفك بنجاح. نتمنى لك التوفيق في مسيرتك المهنية الجديدة.",
    },
    en: {
      title: "✅ Congratulations, you're hired!",
      message: "You've been successfully hired! We wish you the best in your new role.",
    },
  },
  rejected: {
    ar: {
      title: "📋 تحديث على طلبك",
      message: "شكراً على تقديمك. للأسف لم يتناسب طلبك مع المتطلبات في هذه المرة، لكن استمر في التقديم لفرص أخرى!",
    },
    en: {
      title: "📋 Update on your application",
      message: "Thank you for applying. Unfortunately, your application wasn't selected this time. Keep applying — the right opportunity is out there!",
    },
  },
};

export const sendPipelineStatusNotification = async ({
  candidateEmail,
  candidateName,
  jobTitle,
  newStatus,
  applicationId,
}) => {
  if (!candidateEmail || !newStatus) return;

  const msgs = STATUS_MESSAGES[newStatus];
  if (!msgs) return; // No notification for this status

  // Send in both Arabic and English (the candidate's preference is unknown, so we pick based on app default)
  // We use Arabic as the primary language since this is a Palestinian platform
  const { title, message } = msgs.ar;

  await createNotification({
    userEmail: candidateEmail,
    title,
    message: `${message} (${jobTitle})`,
    type: "application_update",
    link: `/candidate/applications`,
  });
};
