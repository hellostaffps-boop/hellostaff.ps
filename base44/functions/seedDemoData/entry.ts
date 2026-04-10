// ─── Firestore helpers ────────────────────────────────────────────────────────
const str = (v) => ({ stringValue: String(v) });
const int = (v) => ({ integerValue: String(v) });
const bool = (v) => ({ booleanValue: v });
const ts = (v) => ({ timestampValue: v });
const arr = (values) => ({ arrayValue: { values } });
const nul = () => ({ nullValue: "NULL_VALUE" });

function docName(projectId, col, id) {
  return `projects/${projectId}/databases/(default)/documents/${col}/${id}`;
}
function makeWrite(projectId, col, id, fields) {
  return { update: { name: docName(projectId, col, id), fields } };
}

async function batchWrite(projectId, idToken, writes) {
  const chunks = [];
  for (let i = 0; i < writes.length; i += 400) chunks.push(writes.slice(i, i + 400));
  for (const chunk of chunks) {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ writes: chunk }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`batchWrite failed: ${JSON.stringify(data.error || data)}`);
    const failed = (data.writeResults || []).filter((r, i) => data.status && data.status[i]?.code && data.status[i].code !== 0);
    if (failed.length > 0) throw new Error(`Some writes failed: ${JSON.stringify(data.status)}`);
  }
}

async function getFirebaseAdminIdToken() {
  const apiKey = Deno.env.get("VITE_FIREBASE_API_KEY");
  const email = Deno.env.get("FIREBASE_ADMIN_EMAIL");
  const password = Deno.env.get("FIREBASE_ADMIN_PASSWORD");
  if (!apiKey || !email || !password) throw new Error("Firebase admin credentials not configured (FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD).");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firebase auth failed: ${data.error?.message}`);
  return data.idToken;
}

async function queryDemoExists(projectId, idToken) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: { fieldFilter: { field: { fieldPath: "is_demo" }, op: "EQUAL", value: { booleanValue: true } } },
          limit: 1,
        },
      }),
    }
  );
  const data = await res.json();
  const docs = (Array.isArray(data) ? data : []).filter((r) => r.document);
  return docs.length > 0 ? docs[0].document.fields?.demo_batch_id?.stringValue : null;
}

// ─── Data definitions ─────────────────────────────────────────────────────────

const CANDIDATES = [
  { id: "demo_cand_01", name: "يوسف أحمد", email: "demo.yousuf@hellostafftest.com", headline: "باريستا محترف - 4 سنوات خبرة", location: "رام الله", jobTypes: ["barista"], experience: 4, availability: "full_time" },
  { id: "demo_cand_02", name: "مريم خالد", email: "demo.maryam@hellostafftest.com", headline: "ويترة ذات خبرة في مطاعم فاخرة", location: "نابلس", jobTypes: ["waiter"], experience: 3, availability: "part_time" },
  { id: "demo_cand_03", name: "عمر سليمان", email: "demo.omar@hellostafftest.com", headline: "شيف متخصص في المأكولات الشرقية", location: "الخليل", jobTypes: ["chef"], experience: 6, availability: "full_time" },
  { id: "demo_cand_04", name: "سارة نصر", email: "demo.sara@hellostafftest.com", headline: "كاشيرة سريعة ودقيقة", location: "البيرة", jobTypes: ["cashier"], experience: 2, availability: "flexible" },
  { id: "demo_cand_05", name: "علي محمود", email: "demo.ali@hellostafftest.com", headline: "مساعد مطبخ متحمس وسريع التعلم", location: "بيت لحم", jobTypes: ["kitchen_helper"], experience: 1, availability: "full_time" },
  { id: "demo_cand_06", name: "لينا عيسى", email: "demo.lina@hellostafftest.com", headline: "هوستس بأسلوب راقٍ وخبرة في الاستقبال", location: "رام الله", jobTypes: ["host"], experience: 3, availability: "weekends_only" },
  { id: "demo_cand_07", name: "خالد أبو علي", email: "demo.khaled@hellostafftest.com", headline: "مدير وردية - خبرة في الكافيهات الكبيرة", location: "نابلس", jobTypes: ["restaurant_manager"], experience: 5, availability: "full_time" },
  { id: "demo_cand_08", name: "نور الدين", email: "demo.nour@hellostafftest.com", headline: "باريستا معتمد - لاتيه آرت وسبشالتي", location: "البيرة", jobTypes: ["barista"], experience: 3, availability: "full_time" },
  { id: "demo_cand_09", name: "هبة منصور", email: "demo.heba@hellostafftest.com", headline: "ويترة بمهارات تواصل ممتازة", location: "رام الله", jobTypes: ["waiter"], experience: 2, availability: "part_time" },
  { id: "demo_cand_10", name: "أحمد زيدان", email: "demo.ahmad@hellostafftest.com", headline: "طاهٍ شاب متخصص في الحلويات", location: "الخليل", jobTypes: ["chef"], experience: 2, availability: "full_time" },
  { id: "demo_cand_11", name: "رنا البكر", email: "demo.rana@hellostafftest.com", headline: "كاشيرة وإدارة صندوق - خبرة 3 سنوات", location: "بيت لحم", jobTypes: ["cashier"], experience: 3, availability: "flexible" },
  { id: "demo_cand_12", name: "ماجد طه", email: "demo.majid@hellostafftest.com", headline: "مساعد مطبخ - شغوف بالطبخ الصحي", location: "نابلس", jobTypes: ["kitchen_helper"], experience: 1, availability: "full_time" },
];

const EMPLOYERS = [
  { id: "demo_emp_01", name: "فادي نجار", email: "demo.org1@hellostafftest.com", orgId: "demo_org_01" },
  { id: "demo_emp_02", name: "رانيا حمدان", email: "demo.org2@hellostafftest.com", orgId: "demo_org_02" },
  { id: "demo_emp_03", name: "سامي عرفة", email: "demo.org3@hellostafftest.com", orgId: "demo_org_03" },
  { id: "demo_emp_04", name: "منى الأشقر", email: "demo.org4@hellostafftest.com", orgId: "demo_org_04" },
];

const ORGS = [
  { id: "demo_org_01", name: "مقهى النخيل", description: "مقهى سبشالتي راقٍ في قلب رام الله، نقدم أجود أنواع القهوة المختصة والمشروبات الباردة في أجواء عصرية.", industry: "cafe", city: "رام الله", size: "11-50", website: "https://nakheelcafe.ps", phone: "+970591100001", status: "active", verified: true, empId: "demo_emp_01" },
  { id: "demo_org_02", name: "مطعم الزيتون", description: "مطعم متخصص في المأكولات الفلسطينية الأصيلة والمأكولات الشرقية المنزلية، يخدم عائلات نابلس منذ أكثر من 15 عاماً.", industry: "restaurant", city: "نابلس", size: "11-50", website: "https://zeitoun-rest.ps", phone: "+970591100002", status: "active", verified: true, empId: "demo_emp_02" },
  { id: "demo_org_03", name: "دار القمر - كافيه ومخبز", description: "مشروع ناشئ يجمع بين الكافيه والمخبز الحرفي، نقدم خبزاً طازجاً يومياً مع قهوة استثنائية في البيرة.", industry: "bakery", city: "البيرة", size: "1-10", website: "https://darqamar.ps", phone: "+970591100003", status: "active", verified: false, empId: "demo_emp_03" },
  { id: "demo_org_04", name: "مطعم السرايا", description: "مطعم شرقي فاخر في الخليل يقدم وجبات غداء وعشاء للعائلات والمجموعات، مع خيارات كيترينج.", industry: "restaurant", city: "الخليل", size: "51-200", website: "https://saraya-restaurant.ps", phone: "+970591100004", status: "active", verified: true, empId: "demo_emp_04" },
];

const JOBS = [
  // Org 1 - مقهى النخيل
  { id: "demo_job_01", title: "باريستا ذو خبرة", orgId: "demo_org_01", orgName: "مقهى النخيل", type: "barista", empType: "full_time", location: "رام الله", salMin: 2200, salMax: 2800, period: "monthly", exp: "2_years", status: "published", desc: "نبحث عن باريستا شغوف بالقهوة المختصة لديه خبرة في تحضير السبشالتي والكيميكس والإيروبريس. يُعدّ اللاتيه آرت ميزة إضافية.", reqs: "خبرة لا تقل عن سنتين - معرفة بأجهزة الإسبريسو - روح الفريق" },
  { id: "demo_job_02", title: "كاشيرة (دوام جزئي)", orgId: "demo_org_01", orgName: "مقهى النخيل", type: "cashier", empType: "part_time", location: "رام الله", salMin: 1100, salMax: 1400, period: "monthly", exp: "none", status: "published", desc: "نبحث عن كاشيرة للعمل في الدوام المسائي بين الساعة 3 و9 مساءً. التدريب على الكاشير متوفر.", reqs: "أمانة وسرعة - مهارات تواصل - منظمة" },
  { id: "demo_job_03", title: "مدير وردية", orgId: "demo_org_01", orgName: "مقهى النخيل", type: "restaurant_manager", empType: "full_time", location: "رام الله", salMin: 3000, salMax: 3800, period: "monthly", exp: "3_plus_years", status: "published", desc: "نبحث عن مدير وردية يتحمل مسؤولية إدارة الفريق وضمان تجربة عملاء استثنائية. الراتب قابل للنقاش.", reqs: "خبرة في إدارة كافيه أو مطعم - قيادة فريق - حل مشكلات" },
  { id: "demo_job_04", title: "ويتر للوردية الصباحية", orgId: "demo_org_01", orgName: "مقهى النخيل", type: "waiter", empType: "full_time", location: "رام الله", salMin: 1800, salMax: 2200, period: "monthly", exp: "1_year", status: "draft", desc: "فرصة للعمل في الفريق الصباحي المتميز. التطبيق مفتوح.", reqs: "مظهر لائق - اللغة العربية أساس - الإنجليزية ميزة" },
  // Org 2 - مطعم الزيتون
  { id: "demo_job_05", title: "شيف أول", orgId: "demo_org_02", orgName: "مطعم الزيتون", type: "chef", empType: "full_time", location: "نابلس", salMin: 3500, salMax: 4500, period: "monthly", exp: "3_plus_years", status: "published", desc: "نبحث عن شيف موهوب لقيادة مطبخنا وتطوير قائمة الطعام الفلسطيني الأصيل. الراتب حسب الكفاءة.", reqs: "خبرة في المطاعم الكبيرة - إبداع في الطبخ - إدارة مطبخ" },
  { id: "demo_job_06", title: "ويتر وويترة", orgId: "demo_org_02", orgName: "مطعم الزيتون", type: "waiter", empType: "full_time", location: "نابلس", salMin: 1900, salMax: 2400, period: "monthly", exp: "1_year", status: "published", desc: "نوفر فرص عمل لويتر وويترة بخبرة لتقديم خدمة راقية لضيوفنا الكرام.", reqs: "خبرة في تقديم الطعام - شخصية ودودة - الحضور في أوقات الذروة" },
  { id: "demo_job_07", title: "مساعد مطبخ", orgId: "demo_org_02", orgName: "مطعم الزيتون", type: "kitchen_helper", empType: "full_time", location: "نابلس", salMin: 1600, salMax: 2000, period: "monthly", exp: "none", status: "published", desc: "فرصة مناسبة لمن يرغب في دخول عالم المطاعم. التدريب الكامل متوفر.", reqs: "نظافة شخصية - سرعة في الحركة - التزام" },
  { id: "demo_job_08", title: "كاشير", orgId: "demo_org_02", orgName: "مطعم الزيتون", type: "cashier", empType: "full_time", location: "نابلس", salMin: 2000, salMax: 2500, period: "monthly", exp: "1_year", status: "closed", desc: "تم ملء هذه الوظيفة. نشكر جميع المتقدمين.", reqs: "دقة في الحساب - أمانة" },
  // Org 3 - دار القمر
  { id: "demo_job_09", title: "باريستا وبائع مخبوزات", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", type: "barista", empType: "full_time", location: "البيرة", salMin: 2000, salMax: 2600, period: "monthly", exp: "1_year", status: "published", desc: "دور مشترك بين تحضير القهوة وتقديم المخبوزات الطازجة. انضم لمشروع ناشئ بروح شبابية.", reqs: "اهتمام بالقهوة والمخبوزات - روح مرحة - مرونة في المواعيد" },
  { id: "demo_job_10", title: "خباز حرفي", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", type: "chef", empType: "full_time", location: "البيرة", salMin: 2500, salMax: 3200, period: "monthly", exp: "2_years", status: "published", desc: "نبحث عن خباز حرفي شغوف بصناعة الخبز التقليدي والحديث لينضم لمشروعنا.", reqs: "خبرة في الخبز الحرفي - إبداع - التزام بالجودة" },
  { id: "demo_job_11", title: "هوست ومرحب بالضيوف", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", type: "host", empType: "part_time", location: "البيرة", salMin: 1200, salMax: 1600, period: "monthly", exp: "none", status: "published", desc: "دور جزئي مثالي للطلاب. استقبال العملاء وإرشادهم وتقديم تجربة ترحيب مميزة.", reqs: "مظهر أنيق - ابتسامة دائمة - لغة عربية وإنجليزية" },
  { id: "demo_job_12", title: "عامل تنظيف وتحضير", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", type: "cleaner", empType: "full_time", location: "البيرة", salMin: 1400, salMax: 1700, period: "monthly", exp: "none", status: "draft", desc: "وظيفة تحضير وتنظيف المكان للمساعدة في تشغيل المقهى بأعلى معايير النظافة.", reqs: "التزام - نظافة - دوام كامل" },
  // Org 4 - مطعم السرايا
  { id: "demo_job_13", title: "شيف ثاني - المطبخ الحار", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "chef", empType: "full_time", location: "الخليل", salMin: 3000, salMax: 4000, period: "monthly", exp: "2_years", status: "published", desc: "نبحث عن شيف ثانٍ لقسم المطبخ الحار. العمل تحت إشراف شيف أول ذو خبرة عالية.", reqs: "خبرة في المطبخ الحار - سرعة في العمل تحت الضغط - تعاون" },
  { id: "demo_job_14", title: "ويتر رئيسي (هيد ويتر)", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "waiter", empType: "full_time", location: "الخليل", salMin: 2500, salMax: 3200, period: "monthly", exp: "3_plus_years", status: "published", desc: "قيادة فريق الخدمة وضمان تجربة عشاء لا تُنسى لضيوف مطعم السرايا الفاخر.", reqs: "خبرة قيادية في الخدمة - لغة إنجليزية - مظهر احترافي" },
  { id: "demo_job_15", title: "مدير عمليات الكيترينج", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "restaurant_manager", empType: "full_time", location: "الخليل", salMin: 4000, salMax: 5500, period: "monthly", exp: "3_plus_years", status: "published", desc: "إدارة عمليات الكيترينج والمناسبات الكبيرة. الراتب حسب الكفاءة مع حوافز.", reqs: "خبرة في الكيترينج - تنظيم ممتاز - تواصل مع العملاء" },
  { id: "demo_job_16", title: "باريستا للقسم الداخلي", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "barista", empType: "full_time", location: "الخليل", salMin: 2000, salMax: 2600, period: "monthly", exp: "1_year", status: "published", desc: "افتحنا قسماً للمشروبات الساخنة. نبحث عن باريستا لإدارته.", reqs: "خبرة في الإسبريسو - ذوق رفيع - التفاعل مع الضيوف" },
  { id: "demo_job_17", title: "هوست ومساعد استقبال", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "host", empType: "part_time", location: "الخليل", salMin: 1300, salMax: 1700, period: "monthly", exp: "none", status: "published", desc: "الترحيب بالضيوف وإدارة قوائم الانتظار في مطعمنا الراقي.", reqs: "مظهر فاخر - لغة إنجليزية - حضور مريح" },
  { id: "demo_job_18", title: "مساعد مطبخ - وردية مسائية", orgId: "demo_org_04", orgName: "مطعم السرايا", type: "kitchen_helper", empType: "full_time", location: "الخليل", salMin: 1700, salMax: 2100, period: "monthly", exp: "none", status: "closed", desc: "تم اختيار المرشح المناسب. شكراً للجميع.", reqs: "التزام - قدرة على العمل المسائي" },
];

// Applications: link candidates to published jobs
const APPLICATIONS = [
  // Job 01 - باريستا مقهى النخيل
  { id: "demo_app_001", jobId: "demo_job_01", candId: "demo_cand_01", candName: "يوسف أحمد", candEmail: "demo.yousuf@hellostafftest.com", orgId: "demo_org_01", orgName: "مقهى النخيل", jobTitle: "باريستا ذو خبرة", status: "shortlisted", cover: "أنا باريستا بخبرة 4 سنوات في القهوة المختصة. عملت في أبرز كافيهات رام الله وأتقن اللاتيه آرت." },
  { id: "demo_app_002", jobId: "demo_job_01", candId: "demo_cand_08", candName: "نور الدين", candEmail: "demo.nour@hellostafftest.com", orgId: "demo_org_01", orgName: "مقهى النخيل", jobTitle: "باريستا ذو خبرة", status: "reviewing", cover: "حاصل على شهادة SCA. متحمس جداً للانضمام لمقهى النخيل." },
  // Job 02 - كاشيرة مقهى النخيل
  { id: "demo_app_003", jobId: "demo_job_02", candId: "demo_cand_04", candName: "سارة نصر", candEmail: "demo.sara@hellostafftest.com", orgId: "demo_org_01", orgName: "مقهى النخيل", jobTitle: "كاشيرة (دوام جزئي)", status: "submitted", cover: "كاشيرة بخبرة سنتين، دقيقة في العمل وسريعة." },
  { id: "demo_app_004", jobId: "demo_job_02", candId: "demo_cand_11", candName: "رنا البكر", candEmail: "demo.rana@hellostafftest.com", orgId: "demo_org_01", orgName: "مقهى النخيل", jobTitle: "كاشيرة (دوام جزئي)", status: "hired", cover: "أملك خبرة 3 سنوات في إدارة الكاشير وأرغب في فرصة قريبة من البيت." },
  // Job 03 - مدير وردية
  { id: "demo_app_005", jobId: "demo_job_03", candId: "demo_cand_07", candName: "خالد أبو علي", candEmail: "demo.khaled@hellostafftest.com", orgId: "demo_org_01", orgName: "مقهى النخيل", jobTitle: "مدير وردية", status: "shortlisted", cover: "قدت فرق في كافيهات كبيرة لمدة 5 سنوات. أبحث عن تحدٍ جديد في مقهى النخيل." },
  // Job 05 - شيف أول مطعم الزيتون
  { id: "demo_app_006", jobId: "demo_job_05", candId: "demo_cand_03", candName: "عمر سليمان", candEmail: "demo.omar@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "شيف أول", status: "reviewing", cover: "شيف بخبرة 6 سنوات في المأكولات الشرقية والفلسطينية الأصيلة." },
  { id: "demo_app_007", jobId: "demo_job_05", candId: "demo_cand_10", candName: "أحمد زيدان", candEmail: "demo.ahmad@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "شيف أول", status: "rejected", cover: "طاهٍ شاب أرغب في التطور تحت إشراف شيف محترف." },
  // Job 06 - ويتر الزيتون
  { id: "demo_app_008", jobId: "demo_job_06", candId: "demo_cand_02", candName: "مريم خالد", candEmail: "demo.maryam@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "ويتر وويترة", status: "shortlisted", cover: "ويترة بخبرة 3 سنوات في المطاعم الفاخرة. أتقن الخدمة الراقية." },
  { id: "demo_app_009", jobId: "demo_job_06", candId: "demo_cand_09", candName: "هبة منصور", candEmail: "demo.heba@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "ويتر وويترة", status: "submitted", cover: "لديّ مهارات تواصل قوية وأحب العمل مع الناس." },
  // Job 07 - مساعد مطبخ الزيتون
  { id: "demo_app_010", jobId: "demo_job_07", candId: "demo_cand_05", candName: "علي محمود", candEmail: "demo.ali@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "مساعد مطبخ", status: "hired", cover: "أنا متحمس للعمل في بيئة احترافية وتعلم مهارات جديدة." },
  { id: "demo_app_011", jobId: "demo_job_07", candId: "demo_cand_12", candName: "ماجد طه", candEmail: "demo.majid@hellostafftest.com", orgId: "demo_org_02", orgName: "مطعم الزيتون", jobTitle: "مساعد مطبخ", status: "reviewing", cover: "مهتم بتطوير مهاراتي في الطبخ من الصفر." },
  // Job 09 - باريستا دار القمر
  { id: "demo_app_012", jobId: "demo_job_09", candId: "demo_cand_01", candName: "يوسف أحمد", candEmail: "demo.yousuf@hellostafftest.com", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", jobTitle: "باريستا وبائع مخبوزات", status: "submitted", cover: "أبحث عن فرصة في بيئة عمل شبابية ومبدعة." },
  { id: "demo_app_013", jobId: "demo_job_09", candId: "demo_cand_08", candName: "نور الدين", candEmail: "demo.nour@hellostafftest.com", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", jobTitle: "باريستا وبائع مخبوزات", status: "shortlisted", cover: "أحب المشاريع الناشئة وأريد المساهمة في بنائها." },
  // Job 10 - خباز حرفي
  { id: "demo_app_014", jobId: "demo_job_10", candId: "demo_cand_03", candName: "عمر سليمان", candEmail: "demo.omar@hellostafftest.com", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", jobTitle: "خباز حرفي", status: "reviewing", cover: "تخصصت في الحلويات والخبز الحرفي بجانب الطبخ الشرقي." },
  // Job 11 - هوست دار القمر
  { id: "demo_app_015", jobId: "demo_job_11", candId: "demo_cand_06", candName: "لينا عيسى", candEmail: "demo.lina@hellostafftest.com", orgId: "demo_org_03", orgName: "دار القمر - كافيه ومخبز", jobTitle: "هوست ومرحب بالضيوف", status: "hired", cover: "أتقن فن الاستقبال والإرشاد. دوام جزئي مثالي لجدولي." },
  // Job 13 - شيف ثاني السرايا
  { id: "demo_app_016", jobId: "demo_job_13", candId: "demo_cand_10", candName: "أحمد زيدان", candEmail: "demo.ahmad@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "شيف ثاني - المطبخ الحار", status: "shortlisted", cover: "بعد رفضي في الزيتون طورت مهاراتي وأنا مستعد لمطبخ السرايا." },
  { id: "demo_app_017", jobId: "demo_job_13", candId: "demo_cand_03", candName: "عمر سليمان", candEmail: "demo.omar@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "شيف ثاني - المطبخ الحار", status: "reviewing", cover: "أبحث عن منصب قيادي في مطعم راقٍ مثل السرايا." },
  // Job 14 - هيد ويتر السرايا
  { id: "demo_app_018", jobId: "demo_job_14", candId: "demo_cand_02", candName: "مريم خالد", candEmail: "demo.maryam@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "ويتر رئيسي (هيد ويتر)", status: "reviewing", cover: "مريم خالد - خبرة 3 سنوات في الخدمة الراقية مع لغة إنجليزية جيدة." },
  // Job 15 - مدير كيترينج
  { id: "demo_app_019", jobId: "demo_job_15", candId: "demo_cand_07", candName: "خالد أبو علي", candEmail: "demo.khaled@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "مدير عمليات الكيترينج", status: "submitted", cover: "خبرة واسعة في تنظيم الفعاليات وإدارة العمليات في الكافيهات الكبيرة." },
  // Job 16 - باريستا السرايا
  { id: "demo_app_020", jobId: "demo_job_16", candId: "demo_cand_08", candName: "نور الدين", candEmail: "demo.nour@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "باريستا للقسم الداخلي", status: "shortlisted", cover: "أنا مستعد لإدارة قسم القهوة في مطعم السرايا بمستوى عالٍ." },
  { id: "demo_app_021", jobId: "demo_job_16", candId: "demo_cand_04", candName: "سارة نصر", candEmail: "demo.sara@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "باريستا للقسم الداخلي", status: "submitted", cover: "أرغب في التحول لمجال القهوة بعد خبرتي في الكاشير." },
  // Job 17 - هوست السرايا
  { id: "demo_app_022", jobId: "demo_job_17", candId: "demo_cand_06", candName: "لينا عيسى", candEmail: "demo.lina@hellostafftest.com", orgId: "demo_org_04", orgName: "مطعم السرايا", jobTitle: "هوست ومساعد استقبال", status: "reviewing", cover: "أبحث عن عمل إضافي في مطعم راقٍ. لديّ خبرة جيدة في الاستقبال." },
];

const NOTES = [
  { id: "demo_note_01", appId: "demo_app_001", orgId: "demo_org_01", authorEmail: "demo.org1@hellostafftest.com", authorName: "فادي نجار", body: "يوسف مرشح قوي جداً. شهادة SCA موثقة. ننتظر المقابلة الشخصية." },
  { id: "demo_note_02", appId: "demo_app_001", orgId: "demo_org_01", authorEmail: "demo.org1@hellostafftest.com", authorName: "فادي نجار", body: "بعد مراجعة ملفه: لاتيه آرت ممتاز. نوصي بتقدم الى مرحلة التجربة العملية." },
  { id: "demo_note_03", appId: "demo_app_005", orgId: "demo_org_01", authorEmail: "demo.org1@hellostafftest.com", authorName: "فادي نجار", body: "خالد أبو علي - مرجعيات موثوقة من كافيه سابق. مناسب لمنصب مدير الوردية." },
  { id: "demo_note_04", appId: "demo_app_006", orgId: "demo_org_02", authorEmail: "demo.org2@hellostafftest.com", authorName: "رانيا حمدان", body: "عمر قدم أمثلة قوية من تجربته في الطهي الفلسطيني. سنحدد موعد مقابلة." },
  { id: "demo_note_05", appId: "demo_app_008", orgId: "demo_org_02", authorEmail: "demo.org2@hellostafftest.com", authorName: "رانيا حمدان", body: "مريم جاءت موصى بها من مطعم آخر في نابلس. مرشحة ممتازة للوظيفة." },
  { id: "demo_note_06", appId: "demo_app_016", orgId: "demo_org_04", authorEmail: "demo.org4@hellostafftest.com", authorName: "منى الأشقر", body: "أحمد تحسن كثيراً. نأخذه بجدية لمنصب الشيف الثاني." },
];

const EVALS = [
  { id: "demo_eval_01", appId: "demo_app_001", orgId: "demo_org_01", reviewer: "demo.org1@hellostafftest.com", reviewerName: "فادي نجار", score: 5, recommendation: "strong_yes", strengths: ["لاتيه آرت ممتاز", "خبرة واسعة", "شخصية ودية"], concerns: [], tags: ["experienced", "technical_skills"] },
  { id: "demo_eval_02", appId: "demo_app_005", orgId: "demo_org_01", reviewer: "demo.org1@hellostafftest.com", reviewerName: "فادي نجار", score: 4, recommendation: "yes", strengths: ["قيادة ممتازة", "خبرة 5 سنوات"], concerns: ["راتب مرتفع نسبياً"], tags: ["leadership", "experienced"] },
  { id: "demo_eval_03", appId: "demo_app_008", orgId: "demo_org_02", reviewer: "demo.org2@hellostafftest.com", reviewerName: "رانيا حمدان", score: 5, recommendation: "strong_yes", strengths: ["مهارة عالية في الخدمة", "مظهر احترافي"], concerns: [], tags: ["experienced", "communication"] },
  { id: "demo_eval_04", appId: "demo_app_007", orgId: "demo_org_02", reviewer: "demo.org2@hellostafftest.com", reviewerName: "رانيا حمدان", score: 2, recommendation: "no", strengths: ["متحمس"], concerns: ["خبرة غير كافية لدور شيف أول"], tags: ["quick_learner"] },
  { id: "demo_eval_05", appId: "demo_app_013", orgId: "demo_org_03", reviewer: "demo.org3@hellostafftest.com", reviewerName: "سامي عرفة", score: 4, recommendation: "yes", strengths: ["مهارة في القهوة", "يحب العمل في الستارتب"], concerns: ["لم نرَ نماذج سابقة من عمله"], tags: ["technical_skills", "team_player"] },
  { id: "demo_eval_06", appId: "demo_app_016", orgId: "demo_org_04", reviewer: "demo.org4@hellostafftest.com", reviewerName: "منى الأشقر", score: 4, recommendation: "yes", strengths: ["تحسّن واضح", "يتقبل النقد"], concerns: ["يحتاج مزيداً من الخبرة تحت الضغط"], tags: ["quick_learner", "team_player"] },
];

const NOTIFS = [
  { id: "demo_notif_01", userId: "demo_cand_01", userEmail: "demo.yousuf@hellostafftest.com", title: "تم استلام طلبك", message: "تم استلام طلبك لوظيفة باريستا ذو خبرة في مقهى النخيل. سيتم مراجعته قريباً.", type: "application" },
  { id: "demo_notif_02", userId: "demo_cand_01", userEmail: "demo.yousuf@hellostafftest.com", title: "طلبك قيد المراجعة", message: "انتقل طلبك لوظيفة باريستا إلى مرحلة المراجعة في مقهى النخيل.", type: "application" },
  { id: "demo_notif_03", userId: "demo_cand_01", userEmail: "demo.yousuf@hellostafftest.com", title: "تهانينا! أنت في قائمة المختصرة", message: "تمت إضافتك إلى القائمة المختصرة لوظيفة باريستا في مقهى النخيل. ترقب التواصل معك.", type: "application" },
  { id: "demo_notif_04", userId: "demo_cand_02", userEmail: "demo.maryam@hellostafftest.com", title: "تم استلام طلبك", message: "شكراً لتقدمك لوظيفة ويترة في مطعم الزيتون.", type: "application" },
  { id: "demo_notif_05", userId: "demo_cand_07", userEmail: "demo.khaled@hellostafftest.com", title: "مرحباً في Hello Staff!", message: "مرحباً خالد، ملفك جاهز. تصفح الوظائف المتاحة وابدأ رحلتك المهنية.", type: "welcome" },
  { id: "demo_notif_06", userId: "demo_emp_01", userEmail: "demo.org1@hellostafftest.com", title: "طلب جديد لوظيفة الباريستا", message: "وصل طلب جديد من يوسف أحمد لوظيفة باريستا ذو خبرة.", type: "application" },
  { id: "demo_notif_07", userId: "demo_emp_02", userEmail: "demo.org2@hellostafftest.com", title: "طلبان جديدان للشيف", message: "وصل طلبان لوظيفة شيف أول في مطعم الزيتون. راجعهما الآن.", type: "application" },
];

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token, force } = body;

    const adminPassword = Deno.env.get("ADMIN_PANEL_PASSWORD");
    if (!session_token || !adminPassword || session_token !== btoa(adminPassword)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Deno.env.get("VITE_FIREBASE_PROJECT_ID");
    const idToken = await getFirebaseAdminIdToken();

    // Check if demo data already exists
    const existingBatch = await queryDemoExists(projectId, idToken);
    if (existingBatch && !force) {
      return Response.json({ error: "DEMO_EXISTS", existing_batch_id: existingBatch }, { status: 409 });
    }

    const batchId = `demo_${Date.now()}`;
    const now = new Date().toISOString();
    const demoCols = { is_demo: bool(true), demo_batch_id: str(batchId), created_by_demo_seed: bool(true) };

    const writes = [];

    // ── Candidate users ──
    for (const c of CANDIDATES) {
      writes.push(makeWrite(projectId, "users", c.id, {
        ...demoCols,
        email: str(c.email), full_name: str(c.name), role: str("candidate"),
        uid: str(c.id), created_at: ts(now), status: str("active"),
        display_name: str(c.name),
      }));
      writes.push(makeWrite(projectId, "candidate_profiles", c.id, {
        ...demoCols,
        user_id: str(c.id), email: str(c.email), full_name: str(c.name),
        headline: str(c.headline), location: str(c.location),
        job_types: arr(c.jobTypes.map(str)),
        experience_years: int(c.experience),
        availability: str(c.availability),
        skills: arr([str("خدمة عملاء"), str("عمل فريق"), str("التزام")]),
        bio: str(`${c.name} - ${c.headline}`),
        status: str("active"), created_at: ts(now),
      }));
    }

    // ── Employer users + profiles ──
    for (const e of EMPLOYERS) {
      writes.push(makeWrite(projectId, "users", e.id, {
        ...demoCols,
        email: str(e.email), full_name: str(e.name), role: str("employer_owner"),
        uid: str(e.id), created_at: ts(now), status: str("active"),
        organization_id: str(e.orgId), display_name: str(e.name),
      }));
      writes.push(makeWrite(projectId, "employer_profiles", e.id, {
        ...demoCols,
        user_id: str(e.id), email: str(e.email), full_name: str(e.name),
        organization_id: str(e.orgId), created_at: ts(now),
      }));
    }

    // ── Organizations ──
    for (const o of ORGS) {
      writes.push(makeWrite(projectId, "organizations", o.id, {
        ...demoCols,
        name: str(o.name), description: str(o.description),
        industry: str(o.industry), city: str(o.city), size: str(o.size),
        website: str(o.website), phone: str(o.phone),
        status: str(o.status), verified: bool(o.verified),
        owner_user_id: str(o.empId),
        created_at: ts(now),
      }));
      writes.push(makeWrite(projectId, "organization_members", `${o.empId}_member`, {
        ...demoCols,
        user_id: str(o.empId), organization_id: str(o.id),
        role: str("owner"), status: str("active"), created_at: ts(now),
      }));
    }

    // ── Jobs ──
    const jobDates = ["2026-01-15T09:00:00Z","2026-01-22T10:00:00Z","2026-02-01T08:00:00Z","2026-02-10T11:00:00Z","2026-02-18T09:30:00Z","2026-03-01T10:00:00Z","2026-03-10T08:00:00Z","2026-03-15T09:00:00Z","2026-03-20T10:00:00Z","2026-03-25T11:00:00Z","2026-04-01T09:00:00Z","2026-04-05T10:00:00Z","2026-04-07T08:00:00Z","2026-04-08T09:30:00Z","2026-04-08T10:00:00Z","2026-04-09T09:00:00Z","2026-04-09T10:00:00Z","2026-04-09T11:00:00Z"];
    JOBS.forEach((j, i) => {
      writes.push(makeWrite(projectId, "jobs", j.id, {
        ...demoCols,
        title: str(j.title), organization_id: str(j.orgId), organization_name: str(j.orgName),
        job_type: str(j.type), employment_type: str(j.empType),
        location: str(j.location), salary_min: int(j.salMin), salary_max: int(j.salMax),
        salary_period: str(j.period), experience_required: str(j.exp),
        status: str(j.status), description: str(j.desc), requirements: str(j.reqs),
        created_by: str(EMPLOYERS.find(e => e.orgId === j.orgId)?.id || ""),
        applications_count: int(APPLICATIONS.filter(a => a.jobId === j.id).length),
        created_at: ts(jobDates[i] || now),
      }));
    });

    // ── Applications ──
    const appDates = ["2026-02-01T","2026-02-05T","2026-02-10T","2026-02-15T","2026-02-20T","2026-02-25T","2026-03-01T","2026-03-05T","2026-03-10T","2026-03-15T","2026-03-20T","2026-03-25T","2026-04-01T","2026-04-02T","2026-04-03T","2026-04-04T","2026-04-05T","2026-04-06T","2026-04-07T","2026-04-08T","2026-04-09T","2026-04-09T"];
    APPLICATIONS.forEach((a, i) => {
      writes.push(makeWrite(projectId, "applications", a.id, {
        ...demoCols,
        job_id: str(a.jobId), job_title: str(a.jobTitle),
        organization_id: str(a.orgId), organization_name: str(a.orgName),
        candidate_user_id: str(a.candId), candidate_name: str(a.candName),
        candidate_email: str(a.candEmail),
        cover_letter: str(a.cover),
        status: str(a.status),
        applied_at: ts(`${appDates[i] || "2026-04-09T"}10:00:00Z`),
        updated_at: ts(now),
      }));
    });

    // ── Notes ──
    for (const n of NOTES) {
      writes.push(makeWrite(projectId, "application_notes", n.id, {
        ...demoCols,
        application_id: str(n.appId), organization_id: str(n.orgId),
        author_email: str(n.authorEmail), author_name: str(n.authorName),
        body: str(n.body), visibility: str("internal"), created_at: ts(now),
      }));
    }

    // ── Evaluations ──
    for (const e of EVALS) {
      writes.push(makeWrite(projectId, "application_evaluations", e.id, {
        ...demoCols,
        application_id: str(e.appId), organization_id: str(e.orgId),
        reviewer_email: str(e.reviewer), reviewer_name: str(e.reviewerName),
        overall_score: int(e.score), recommendation: str(e.recommendation),
        strengths: arr(e.strengths.map(str)),
        concerns: arr(e.concerns.map(str)),
        tags: arr(e.tags.map(str)),
        created_at: ts(now),
      }));
    }

    // ── Notifications ──
    for (const n of NOTIFS) {
      writes.push(makeWrite(projectId, "notifications", n.id, {
        ...demoCols,
        user_id: str(n.userId), user_email: str(n.userEmail),
        title: str(n.title), message: str(n.message),
        type: str(n.type), is_read: bool(false),
        created_at: ts(now),
      }));
    }

    await batchWrite(projectId, idToken, writes);

    return Response.json({
      success: true,
      batch_id: batchId,
      counts: {
        users: CANDIDATES.length + EMPLOYERS.length,
        candidate_profiles: CANDIDATES.length,
        employer_profiles: EMPLOYERS.length,
        organizations: ORGS.length,
        organization_members: ORGS.length,
        jobs: JOBS.length,
        applications: APPLICATIONS.length,
        notes: NOTES.length,
        evaluations: EVALS.length,
        notifications: NOTIFS.length,
        total_writes: writes.length,
      },
    });
  } catch (error) {
    // Return 200 so the frontend can read the actual error message
    return Response.json({ success: false, error: error.message });
  }
});