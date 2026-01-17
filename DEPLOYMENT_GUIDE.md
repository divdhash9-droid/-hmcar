> [[ARABIC_HEADER]] هذا الملف (DEPLOYMENT_GUIDE.md) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# دليل النشر الكامل لمشروع HM CAR

## 🚀 خطوات النشر على Vercel

### 1. تسجيل الدخول إلى Vercel
```bash
vercel login
```
- افتح الرابط الذي يظهر في المتصفح
- قم بتسجيل الدخول بحساب GitHub/GitLab

### 2. إعداد متغيرات البيئة الإنتاجية
في لوحة تحكم Vercel، أضف هذه المتغيرات في Environment Variables:

```
MONGO_URI=mongodb+srv://<zz7310430_db_user>:<QtDSn1S3V4Z8OfNL>@cluster0.mongodb.net/car-auction?retryWrites=true&w=majority
SESSION_SECRET=super_secret_key_firebase
NODE_ENV=production
FIREBASE_STORAGE_BUCKET=myapplication-9c116dfa.appspot.com
JWT_SECRET=your_jwt_secret_key_change_in_production_12345
JWT_EXPIRES_IN=7d
ADMIN_NAME=أحمد الزمزمي
ADMIN_PHONE=781007805
```

### 3. نشر المشروع
```bash
vercel --prod
```

### 4. التحقق من النشر
بعد النشر، تحقق من:
- https://-hmcar.vercel.app
- أن الموقع يعمل بشكل صحيح
- قم بتنفيذ قائمة التحقق في DEPLOYMENT_CHECKLIST.md

## 🔧 متغيرات البيئة المطلوبة

### للإنتاج (Production)
- `MONGO_URI`: رابط MongoDB Atlas
- `SESSION_SECRET`: مفتاح الجلسة السري
- `NODE_ENV`: production
- `JWT_SECRET`: مفتاح JWT السري
- `JWT_EXPIRES_IN`: 7d
- `ADMIN_NAME`: اسم المدير
- `ADMIN_PHONE`: هاتف المدير

### اختيارية
- `FIREBASE_STORAGE_BUCKET`: لتخزين الملفات
- `REDIS_URL`: للكاشينغ
- `EMAIL_*`: للإشعارات البريدية

## 📋 قائمة التحقق بعد النشر

### 1. الموقع الأساسي
- [ ] يفتح الرابط: https://-hmcar.vercel.app
- [ ] يظهر شعار HM CAR
- [ ] الألوان صحيحة (ذهبي وأسود)
- [ ] النصوص واضحة بالعربية RTL

### 2. التطبيق (PWA)
- [ ] يظهر زر "تثبيت التطبيق"
- [ ] التثبيت يعمل على الهاتف
- [ ] الأيقونة تظهر على الشاشة الرئيسية
- [ ] يفتح كتطبيق حقيقي

### 3. الصفحات الرئيسية
- [ ] أزرار "استكشف المزادات" تعمل
- [ ] أزرار "تسجيل الدخول" تعمل
- [ ] البحث يعمل
- [ ] الإحصائيات تظهر

### 4. التصميم
- [ ] متجاوب على جميع الأجهزة
- [ ] الألوان ذهبية فاخرة
- [ ] الخطوط واضحة
- [ ] الحركات سلسة

### 5. الأداء
- [ ] الموقع سريع (<3 ثواني)
- [ ] يعمل بدون إنترنت (جزئياً)
- [ ] لا يوجد أخطاء في الكونسول

## 🛠️ حل المشاكل الشائعة

### مشاكل الاتصال بقاعدة البيانات
- تحقق من رابط MONGO_URI
- تأكد من أن IP الخاص بـ Vercel مضاف في MongoDB Atlas whitelist

### مشاكل الجلسات
- تحقق من SESSION_SECRET
- تأكد من NODE_ENV=production

### مشاكل الصور
- تحقق من FIREBASE_STORAGE_BUCKET
- تأكد من إعدادات Firebase

## 📞 الدعم الفني
إذا واجهت أي مشاكل، تحقق من:
1. سجلات الأخطاء في Vercel Dashboard
2. متغيرات البيئة
3. إعدادات قاعدة البيانات
