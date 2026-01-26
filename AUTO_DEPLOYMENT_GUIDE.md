> [[ARABIC_HEADER]] هذا الملف (AUTO_DEPLOYMENT_GUIDE.md) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# 🚀 دليل النشر التلقائي - Auto Deployment Guide

## 📋 نظرة عامة

تم إعداد المشروع للنشر التلقائي الكامل باستخدام عدة طرق:

---

## ✅ 1. النشر التلقائي عبر GitHub Actions

### الـ Workflows المتاحة:

#### A) **deploy.yml** - النشر الرئيسي
- ✅ ينشر تلقائياً عند Push على `main` أو `production`
- ✅ ينشر على Docker Hub + Vercel
- ✅ يدعم النشر اليدوي عبر GitHub UI

#### B) **deploy-server.yml** - النشر على VPS/Server
- ✅ ينشر على السيرفر الخاص عبر SSH
- ✅ يدعم النشر بـ PM2 أو Docker
- ✅ Rollback تلقائي عند الفشل
- ✅ Health check بعد النشر

#### C) **scheduled-deploy.yml** - النشر المجدول
- ✅ يفحص التغييرات كل يوم الساعة 2 صباحاً
- ✅ ينشر تلقائياً إذا وجد commits جديدة
- ✅ يمكن تشغيله يدوياً

#### D) **auto-merge.yml** - دمج تلقائي
- ✅ يدمج تحديثات Dependabot تلقائياً
- ✅ فقط للتحديثات الصغيرة (minor/patch)

---

## 🔧 2. إعداد الـ Secrets

لتفعيل النشر التلقائي، أضف هذه الـ Secrets في GitHub:

### للنشر على Docker Hub:
```
DOCKER_USERNAME=your_username
DOCKER_PASSWORD=your_password_or_token
```

### للنشر على Vercel:
```
VERCEL_TOKEN=your_vercel_token
```

### للنشر على VPS/Server:
```
SSH_PRIVATE_KEY=your_ssh_private_key
SERVER_USER=deployer
SERVER_HOST=your-server.com
SERVER_PATH=/var/www/car-auction
SERVER_URL=https://your-domain.com
```

### للإشعارات:
```
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
NOTIFICATION_EMAIL=admin@example.com
MAIL_USERNAME=smtp_username
MAIL_PASSWORD=smtp_password
```

---

## 📦 3. النشر على VPS باستخدام PM2

### أ) تثبيت PM2 على السيرفر:
```bash
npm install -g pm2
```

### ب) النشر الأول:
```bash
# على السيرفر
cd /var/www
git clone https://github.com/your-username/car-auction.git
cd car-auction
npm ci --production
cp .env.example .env
# عدل .env بالإعدادات الصحيحة

# تشغيل التطبيق
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### ج) النشر التلقائي باستخدام PM2 Deploy:
```bash
# من جهازك المحلي
pm2 deploy production setup
pm2 deploy production
```

---

## 🐳 4. النشر على VPS باستخدام Docker

### أ) على السيرفر:
```bash
# تثبيت Docker و Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone المشروع
git clone https://github.com/your-username/car-auction.git
cd car-auction

# إعداد البيئة
cp .env.example .env
# عدل .env

# تشغيل
docker-compose up -d
```

### ب) النشر التلقائي:
سيقوم GitHub Actions تلقائياً بـ:
1. بناء صورة Docker
2. رفعها على Docker Hub
3. الاتصال بالسيرفر عبر SSH
4. سحب الصورة الجديدة
5. إعادة تشغيل الـ containers

---

## ⏰ 5. النشر المجدول التلقائي

### الإعداد الحالي:
- يفحص التغييرات كل يوم الساعة **2 صباحاً UTC** (5 صباحاً بتوقيت السعودية)
- ينشر تلقائياً إذا وجد commits جديدة

### تغيير الجدول الزمني:
عدل الملف `.github/workflows/scheduled-deploy.yml`:
```yaml
schedule:
  # كل 6 ساعات
  - cron: '0 */6 * * *'
  
  # كل ساعة
  - cron: '0 * * * *'
  
  # كل يوم الساعة 3 صباحاً
  - cron: '0 3 * * *'
```

---

## 🔄 6. النشر اليدوي

### عبر GitHub UI:
1. اذهب إلى **Actions** في GitHub
2. اختر **Deploy to Production**
3. اضغط **Run workflow**
4. اختر البيئة (production/staging)

### عبر Script على السيرفر:
```bash
cd /var/www/car-auction
chmod +x scripts/auto-deploy.sh
./scripts/auto-deploy.sh
```

### باستخدام webhook:
يمكن إضافة webhook في GitHub يستدعي script النشر عند كل push.

---

## 🔔 7. الإشعارات

### Slack:
سيتم إرسال إشعار تلقائي عند:
- ✅ نجاح النشر
- ❌ فشل النشر
- 🔄 بدء النشر

### Email:
يتم إرسال email فقط عند **فشل النشر**.

---

## 🛡️ 8. الأمان والـ Rollback

### Rollback تلقائي:
- إذا فشل health check، يتم الرجوع للإصدار السابق تلقائياً
- يعمل مع PM2 و Docker

### Health Check:
يتم فحص `/health` endpoint بعد كل نشر للتأكد من عمل التطبيق.

---

## 📊 9. المراقبة بعد النشر

### التحقق من الحالة:
```bash
# PM2
pm2 status
pm2 logs car-auction

# Docker
docker-compose ps
docker-compose logs -f

# Health check
curl http://localhost:4000/health
curl http://localhost:4000/metrics
```

### Logs:
```bash
# Application logs
tail -f logs/combined-*.log
tail -f logs/error-*.log

# PM2 logs
pm2 logs car-auction --lines 100
```

---

## 🎯 10. سير العمل الكامل

### عند Push على main:
```
1. Git Push
   ↓
2. CI Tests (اختبارات تلقائية)
   ↓
3. Build Docker Image
   ↓
4. Push to Docker Hub
   ↓
5. Deploy to Vercel
   ↓
6. Deploy to VPS (إذا مُفعّل)
   ↓
7. Health Check
   ↓
8. Send Notifications
   ↓
9. ✅ Deployment Complete
```

---

## 🚀 البدء السريع

### 1. إعداد GitHub Secrets:
أضف جميع الـ secrets المطلوبة في Settings → Secrets and variables → Actions

### 2. تفعيل GitHub Actions:
- Actions → Enable workflows
- اختر الـ workflows المطلوبة

### 3. Push أول commit:
```bash
git add .
git commit -m "Enable auto deployment"
git push origin main
```

### 4. مراقبة النشر:
- اذهب إلى **Actions** tab في GitHub
- شاهد progress النشر live

---

## 📝 ملاحظات مهمة

1. **البيئة الأولى**: تأكد من إعداد السيرفر/VPS بشكل صحيح قبل التفعيل
2. **Secrets**: لا تشارك الـ secrets أبداً في الكود
3. **Testing**: جرّب على staging قبل production
4. **Monitoring**: راقب الـ logs بعد كل نشر
5. **Backup**: احتفظ بنسخة احتياطية من قاعدة البيانات

---

## 🆘 حل المشاكل

### النشر يفشل:
1. تحقق من الـ logs في GitHub Actions
2. تحقق من الـ secrets
3. تحقق من SSH connection للسيرفر

### التطبيق لا يعمل بعد النشر:
1. فحص logs: `pm2 logs` أو `docker-compose logs`
2. فحص health: `curl localhost:4000/health`
3. إعادة تشغيل: `pm2 restart car-auction` أو `docker-compose restart`

---

## 🎉 النتيجة

**المشروع الآن يدعم نشر تلقائي كامل!**

- ✅ Push تلقائي على Docker Hub
- ✅ Deploy تلقائي على Vercel
- ✅ Deploy تلقائي على VPS
- ✅ Scheduled deployments
- ✅ Health checks
- ✅ Auto rollback
- ✅ Notifications
- ✅ Zero-downtime deployment
