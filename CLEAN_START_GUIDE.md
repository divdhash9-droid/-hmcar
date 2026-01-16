# 🧹 دليل التنظيف والبدء من جديد

## 🎯 الهدف
تنظيف المشروع من جميع البيانات القديمة والبدء بمشروع نظيف جاهز للنشر.

---

## ⚡ البدء السريع (3 خطوات)

### على Windows (PowerShell):
```powershell
# 1. تنظيف المشروع
.\scripts\clean-project.ps1

# 2. تثبيت Dependencies
npm install

# 3. إعادة تعيين قاعدة البيانات وتشغيل المشروع
npm run clean:db
npm run dev
```

### على Linux/Mac:
```bash
# 1. تنظيف المشروع
chmod +x scripts/clean-project.sh
./scripts/clean-project.sh

# 2. تثبيت Dependencies
npm install

# 3. إعادة تعيين قاعدة البيانات وتشغيل المشروع
npm run clean:db
npm run dev
```

---

## 📋 ما الذي يتم تنظيفه؟

### ✅ الملفات والمجلدات:
- ✅ `node_modules/` - يتم حذفها وإعادة تثبيتها
- ✅ `logs/` - جميع ملفات السجلات القديمة
- ✅ `uploads/` - جميع الملفات المرفوعة
- ✅ `public/images/` - جميع الصور
- ✅ `coverage/` - تقارير الاختبارات
- ✅ `.nyc_output/` - ملفات التغطية المؤقتة
- ✅ `*.log` - جميع ملفات Log
- ✅ PM2 logs و processes

### ✅ قاعدة البيانات:
- ✅ جميع Collections في MongoDB
- ✅ جميع البيانات القديمة
- ✅ يبقى فارغة تماماً

### ✅ Docker (اختياري):
- ✅ Containers القديمة
- ✅ Volumes القديمة
- ✅ Images غير المستخدمة

---

## 🔧 الأوامر المتاحة

### تنظيف شامل:
```bash
# تنظيف الملفات فقط
npm run clean

# تنظيف قاعدة البيانات فقط
npm run clean:db

# تنظيف كامل + إعادة تثبيت + تشغيل
npm run fresh-start
```

### تنظيف Docker:
```bash
# إيقاف وحذف containers
docker-compose down -v

# حذف جميع Docker data
docker system prune -af --volumes

# بدء نظيف
docker-compose up -d --build
```

---

## 📦 البدء من الصفر - خطوة بخطوة

### 1️⃣ **تنظيف الملفات**
```powershell
# Windows
.\scripts\clean-project.ps1

# Linux/Mac
./scripts/clean-project.sh
```

**ماذا يحدث:**
- حذف node_modules
- حذف logs
- حذف uploads
- حذف public/images
- حذف ملفات PM2

### 2️⃣ **تنظيف قاعدة البيانات**
```bash
npm run clean:db
```

**ماذا يحدث:**
- الاتصال بـ MongoDB
- عرض قائمة Collections
- حذف جميع Collections
- قاعدة بيانات فارغة تماماً

⚠️ **تحذير**: لا يمكن التراجع عن هذه العملية!

### 3️⃣ **إعادة التثبيت**
```bash
npm install
```

**ماذا يحدث:**
- تثبيت جميع Dependencies
- إنشاء package-lock.json جديد
- Dependencies نظيفة

### 4️⃣ **إعداد البيئة**
```bash
# نسخ ملف البيئة
cp .env.example .env

# عدّل الإعدادات حسب الحاجة
notepad .env  # Windows
nano .env     # Linux/Mac
```

### 5️⃣ **تشغيل المشروع**
```bash
# تطوير
npm run dev

# إنتاج
npm start

# مع Docker
docker-compose up -d
```

---

## 🗄️ إعادة تعيين MongoDB فقط

إذا أردت تنظيف قاعدة البيانات فقط دون الملفات:

```bash
# طريقة 1: باستخدام Script
npm run clean:db

# طريقة 2: يدوياً من MongoDB
mongosh
> use car-auction
> db.dropDatabase()
> exit
```

---

## 🐳 Docker - البدء من الصفر

### تنظيف كامل:
```bash
# إيقاف containers
docker-compose down

# حذف volumes (البيانات)
docker-compose down -v

# حذف كل شيء
docker system prune -af --volumes

# بناء وتشغيل من جديد
docker-compose up -d --build
```

### فحص الحالة:
```bash
# عرض containers
docker-compose ps

# عرض logs
docker-compose logs -f

# الدخول للـ container
docker-compose exec app sh
```

---

## ✅ التحقق من النظافة

بعد التنظيف، تأكد من:

```bash
# 1. لا يوجد node_modules قديم
ls node_modules  # يجب أن يكون فارغاً أو غير موجود

# 2. لا توجد logs قديمة
ls logs  # فقط .gitkeep

# 3. لا توجد uploads قديمة
ls uploads  # فقط .gitkeep

# 4. قاعدة بيانات فارغة
mongosh car-auction --eval "db.getCollectionNames()"
# يجب أن يعرض: []

# 5. لا توجد PM2 processes قديمة
pm2 list  # يجب أن يكون فارغاً
```

---

## 🚀 البدء بعد التنظيف

### للتطوير المحلي:
```bash
# 1. تنظيف
npm run fresh-start

# 2. إضافة بيانات تجريبية (اختياري)
npm run seed

# 3. تحسين قاعدة البيانات
npm run optimize:db
```

### للنشر:
```bash
# 1. تنظيف
npm run clean && npm install

# 2. اختبار
npm test

# 3. بناء Docker
docker-compose up -d --build

# 4. Push للـ Git
git add .
git commit -m "Clean start - ready for production"
git push origin main
```

---

## 🔄 النشر التلقائي بعد التنظيف

بعد تنظيف المشروع، عند Push:

```
Local (نظيف) → Git Push → GitHub Actions → Deploy
```

**سيتم نشر:**
- ✅ الكود النظيف
- ✅ Dependencies الجديدة
- ✅ بدون بيانات قديمة
- ✅ بدون uploads قديمة
- ✅ قاعدة بيانات فارغة (أو seed data جديد)

---

## ⚠️ ملاحظات مهمة

### 1. النسخ الاحتياطية
قبل التنظيف، احفظ نسخة احتياطية من:
- قاعدة البيانات: `mongodump --db car-auction`
- الملفات المهمة: انسخ يدوياً

### 2. .env file
ملف `.env` **لن يُحذف** - يحتوي على إعدادات مهمة

### 3. Git History
التنظيف **لا يحذف** Git history - فقط الملفات المحلية

### 4. Production
**لا تشغل** scripts التنظيف على production server!
فقط على البيئة المحلية

---

## 🆘 حل المشاكل

### المشكلة: Permission denied
```bash
# Linux/Mac
chmod +x scripts/*.sh
sudo npm run clean

# Windows
# شغّل PowerShell كـ Administrator
```

### المشكلة: MongoDB لا يحذف
```bash
# تأكد من إيقاف جميع الاتصالات
mongosh
> use car-auction
> db.dropDatabase()
```

### المشكلة: Docker volumes لا تُحذف
```bash
docker-compose down -v --remove-orphans
docker volume prune -f
```

### المشكلة: PM2 لا يتوقف
```bash
pm2 kill
pm2 flush
```

---

## ✅ Checklist - البدء النظيف

قبل النشر، تأكد من:

- [ ] تم تشغيل `npm run clean`
- [ ] تم تشغيل `npm run clean:db`
- [ ] تم تشغيل `npm install`
- [ ] تم إعداد `.env` بشكل صحيح
- [ ] لا توجد ملفات قديمة في uploads/
- [ ] لا توجد logs قديمة
- [ ] قاعدة البيانات فارغة أو بها seed data جديد
- [ ] اختبار المشروع محلياً: `npm run dev`
- [ ] اختبار الاختبارات: `npm test`
- [ ] جاهز للـ Push: `git push origin main`

---

## 🎉 النتيجة

بعد التنظيف:
- ✅ مشروع نظيف 100%
- ✅ بدون بيانات قديمة
- ✅ بدون ملفات غير ضرورية
- ✅ جاهز للنشر التلقائي
- ✅ البيئة المحلية = البيئة المنشورة

**جاهز للانطلاق! 🚀**
