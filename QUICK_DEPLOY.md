# ⚡ دليل النشر السريع - Quick Deploy

## 🚀 النشر في 3 خطوات

### 1️⃣ **إعداد Secrets في GitHub**

اذهب إلى: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

```bash
# الأساسية (مطلوبة)
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_token
VERCEL_TOKEN=your_vercel_token

# للسيرفر الخاص (اختياري)
SSH_PRIVATE_KEY=your_private_key
SERVER_HOST=your-server.com
SERVER_USER=deployer
SERVER_PATH=/var/www/car-auction
SERVER_URL=https://yourdomain.com

# للإشعارات (اختياري)
SLACK_WEBHOOK=https://hooks.slack.com/xxx
```

### 2️⃣ **Push الكود**

```bash
git add .
git commit -m "Enable auto deployment"
git push origin main
```

### 3️⃣ **تابع النشر**

اذهب إلى **Actions** tab في GitHub وشاهد progress النشر live!

---

## 📦 طرق النشر المتاحة

### A) النشر التلقائي (موصى به)
✅ **تلقائي عند Push على main**
- فقط اعمل push للكود
- GitHub Actions يتولى الباقي

### B) النشر المجدول
✅ **يومياً الساعة 2 صباحاً**
- يفحص التغييرات تلقائياً
- ينشر إذا وجد commits جديدة

### C) النشر اليدوي
✅ **من GitHub UI**
1. اذهب إلى Actions
2. اختر "Deploy to Production"
3. اضغط "Run workflow"

### D) النشر من Terminal
```bash
# PM2
npm run deploy:pm2

# Docker
npm run deploy:docker
```

---

## 🎯 أين سيتم النشر؟

عند Push على `main`:
1. ✅ **Docker Hub** - صورة Docker تلقائية
2. ✅ **Vercel** - نشر على Vercel
3. ✅ **VPS/Server** - إذا قمت بإعداد SSH secrets

---

## 🔍 التحقق من النشر

```bash
# فحص Health
curl https://yourdomain.com/health

# فحص Metrics
curl https://yourdomain.com/metrics

# فحص Docker Image
docker pull your-username/car-auction:latest
```

---

## ❌ حل المشاكل

### النشر يفشل؟
1. تحقق من الـ Secrets في GitHub
2. راجع logs في Actions tab
3. تأكد من اتصال SSH (للسيرفر الخاص)

### لا أرى التحديثات؟
1. انتظر 2-3 دقائق
2. امسح cache المتصفح (Ctrl+Shift+R)
3. تحقق من logs: `npm run pm2:logs`

---

## 📞 المساعدة

- 📘 دليل شامل: `AUTO_DEPLOYMENT_GUIDE.md`
- 🛠️ دليل التطوير: `DEVELOPMENT_GUIDE.md`
- 🐛 مشاكل GitHub Actions: راجع Actions logs

---

## ✅ Checklist

قبل النشر الأول:
- [ ] إضافة جميع Secrets المطلوبة
- [ ] تفعيل GitHub Actions
- [ ] اختبار على staging أولاً (إن وجد)
- [ ] نسخة احتياطية من قاعدة البيانات

**جاهز للنشر! 🎉**
