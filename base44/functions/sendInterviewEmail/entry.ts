import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, to, candidateName, employerName, jobTitle, organizationName, slots, selectedSlot, location, interviewType, notes } = await req.json();

    const typeLabel = { in_person: "حضوري", online: "عبر الإنترنت", phone: "هاتفي" }[interviewType] || interviewType;

    const formatDate = (iso) => new Date(iso).toLocaleString("ar-SA", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

    let subject, body;

    if (type === "slots_proposed") {
      // Email to candidate
      subject = `دعوة لاختيار موعد مقابلة — ${jobTitle} في ${organizationName}`;
      body = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#333">
  <h2 style="color:#1a1a2e">مرحباً ${candidateName}،</h2>
  <p>تهانينا! لقد دعاك <strong>${organizationName}</strong> لإجراء مقابلة عمل لوظيفة <strong>${jobTitle}</strong>.</p>
  <p>يرجى الدخول إلى حسابك واختيار الموعد الأنسب لك من المواعيد التالية:</p>
  <ul style="line-height:2;background:#f8f9fa;padding:16px;border-radius:8px;border-right:4px solid #f59e0b">
    ${slots.map(s => `<li><strong>${formatDate(s)}</strong></li>`).join("")}
  </ul>
  <p>نوع المقابلة: <strong>${typeLabel}</strong></p>
  ${location ? `<p>الموقع: <strong>${location}</strong></p>` : ""}
  ${notes ? `<p>ملاحظات: ${notes}</p>` : ""}
  <div style="margin-top:24px;text-align:center">
    <a href="${Deno.env.get("VITE_APP_URL") || "https://app.base44.com"}/candidate/applications"
       style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
      اختر موعدك الآن
    </a>
  </div>
  <p style="margin-top:24px;color:#888;font-size:12px">إذا كنت بحاجة للمساعدة، يرجى التواصل مع صاحب العمل مباشرة.</p>
</div>`;
    } else if (type === "slot_selected_employer") {
      // Email to employer confirming candidate selection
      subject = `✅ ${candidateName} اختار موعد المقابلة — ${jobTitle}`;
      body = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#333">
  <h2 style="color:#1a1a2e">مرحباً ${employerName}،</h2>
  <p>قام المرشح <strong>${candidateName}</strong> باختيار موعد المقابلة لوظيفة <strong>${jobTitle}</strong>.</p>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:0;font-size:16px;color:#166534">📅 <strong>${formatDate(selectedSlot)}</strong></p>
    ${location ? `<p style="margin:8px 0 0;color:#166534">📍 ${location}</p>` : ""}
    <p style="margin:8px 0 0;color:#166534">نوع المقابلة: ${typeLabel}</p>
  </div>
  <p>يرجى التأكد من الاستعداد للمقابلة في الوقت المحدد.</p>
  <div style="margin-top:24px;text-align:center">
    <a href="${Deno.env.get("VITE_APP_URL") || "https://app.base44.com"}/employer/applications"
       style="background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
      عرض الطلبات
    </a>
  </div>
</div>`;
    } else if (type === "slot_selected_candidate") {
      // Confirmation email to candidate
      subject = `تأكيد موعد مقابلتك — ${jobTitle} في ${organizationName}`;
      body = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#333">
  <h2 style="color:#1a1a2e">مرحباً ${candidateName}،</h2>
  <p>تم تأكيد موعد مقابلتك مع <strong>${organizationName}</strong> لوظيفة <strong>${jobTitle}</strong>.</p>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:0;font-size:16px;color:#166534">📅 <strong>${formatDate(selectedSlot)}</strong></p>
    ${location ? `<p style="margin:8px 0 0;color:#166534">📍 ${location}</p>` : ""}
    <p style="margin:8px 0 0;color:#166534">نوع المقابلة: ${typeLabel}</p>
  </div>
  ${notes ? `<p>ملاحظات من صاحب العمل: ${notes}</p>` : ""}
  <p>نتمنى لك التوفيق! 🎯</p>
</div>`;
    } else {
      return Response.json({ error: "Unknown email type" }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});