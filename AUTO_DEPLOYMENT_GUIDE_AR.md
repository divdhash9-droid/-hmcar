# إعداد النشر التلقائي على Vercel وGitHub Actions

هذه الخطوات تشرح كيفية ربط مشروعك بالنشر التلقائي عبر Vercel وGitHub Actions:

---

## 1. إعداد أسرار Vercel في GitHub

1. ادخل إلى حسابك في Vercel.
2. من القائمة الجانبية اختر Settings > Tokens.
3. أنشئ Token جديد وانسخه (VERCEL_TOKEN).
4. ادخل إلى مشروعك في Vercel، من الرابط أو من Settings > General ستجد:
   - orgId=... (VERCEL_ORG_ID)
   - projectId=... (VERCEL_PROJECT_ID)
5. اذهب إلى مستودعك على GitHub:
   - Settings > Secrets and variables > Actions.
   - أضف الأسرار الثلاثة:
     - VERCEL_TOKEN
     - VERCEL_ORG_ID
     - VERCEL_PROJECT_ID

---

## 2. كيف يعمل النشر التلقائي؟

- عند كل push أو pull request على فرع main:
  - يتم تثبيت الحزم
  - تشغيل الاختبارات (إن وجدت)
  - نشر المشروع تلقائياً على Vercel

---

## 3. تخصيص الإعدادات

- يمكنك تعديل ملف `.github/workflows/vercel-deploy.yml` لتغيير خطوات النشر أو إضافة خطوات أخرى.
- يمكنك تعديل ملف `vercel.json` لتخصيص إعدادات Vercel حسب حاجتك.

---

## 4. ملاحظات

- تأكد من ضبط متغيرات البيئة في Vercel (Environment Variables) بنفس القيم الموجودة في ملف `vercel.env.example` أو `.env`.
- راجع ملف `DEPLOYMENT_CHECKLIST_AR.md` قبل كل عملية نشر.

---

بالتوفيق! لأي استفسار راجع هذا الملف أو تواصل مع مسؤول المشروع.