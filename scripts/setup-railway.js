#!/usr/bin/env node
// [[ARABIC_HEADER]] سكريبت مساعد للانتقال إلى Railway.app
// يقوم هذا السكريبت بإنشاء ملف إعدادات Railway وتوجيهك خطوة بخطوة

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     🚀 دليل الانتقال إلى Railway.app لمشروع HM CAR       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ---- توليد مفاتيح آمنة جديدة ----
const newSessionSecret = crypto.randomBytes(64).toString('hex');
const newJwtSecret = crypto.randomBytes(64).toString('hex');

// ---- إنشاء ملف .env.railway ----
const railwayEnv = `# ====================================================
# إعدادات Railway.app لمشروع HM CAR
# انسخ هذه القيم في متغيرات البيئة على Railway Dashboard
# Variables > Add Variable
# ====================================================

NODE_ENV=production
PORT=4000

# MongoDB Atlas (نفس رابط قاعدة البيانات الحالية)
MONGO_URI=your_mongodb_connection_string

# مفاتيح أمان قوية (تم توليدها تلقائياً)
SESSION_SECRET=${newSessionSecret}
JWT_SECRET=${newJwtSecret}

# Cloudinary (نفس الإعدادات الحالية)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# البريد الإلكتروني
EMAIL_SERVICE=gmail
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

# رابط الموقع - سيكون متاحاً بعد النشر على Railway
BASE_URL=https://YOUR-APP-NAME.railway.app

# إعدادات CORS - أضف رابط Frontend من Vercel
ALLOWED_ORIGINS=https://car-auction-sand.vercel.app,https://YOUR-APP-NAME.railway.app

# Redis - سيتم إضافته من Railway Dashboard (Add Plugin > Redis)
REDIS_URL=\${REDIS_URL}

# إعدادات أخرى
ENABLE_CACHE=true
ENABLE_DEV_ADMIN=false
BCRYPT_ROUNDS=12
`;

const railwayEnvPath = path.join(__dirname, '..', '.env.railway');
fs.writeFileSync(railwayEnvPath, railwayEnv);

// ---- إنشاء ملف railway.json لإعدادات النشر ----
const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "DOCKERFILE",
        "dockerfilePath": "Dockerfile"
    },
    "deploy": {
        "startCommand": "node server.js",
        "healthcheckPath": "/api/v2/health",
        "healthcheckTimeout": 300,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
    }
};

const railwayConfigPath = path.join(__dirname, '..', 'railway.json');
fs.writeFileSync(railwayConfigPath, JSON.stringify(railwayConfig, null, 2));

// ---- الإخراج للمستخدم ----
console.log('✅ تم إنشاء ملفات Railway بنجاح:\n');
console.log('   📄 .env.railway        - متغيرات البيئة لـ Railway');
console.log('   📄 railway.json        - إعدادات النشر\n');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              📋 خطوات الانتقال إلى Railway.app            ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log('║                                                            ║');
console.log('║  1️⃣  اذهب إلى: https://railway.app                        ║');
console.log('║      سجّل دخول بحساب GitHub                               ║');
console.log('║                                                            ║');
console.log('║  2️⃣  انقر "New Project" > "Deploy from GitHub repo"        ║');
console.log('║      اختر مستودع car-auction                              ║');
console.log('║                                                            ║');
console.log('║  3️⃣  أضف Redis Plugin:                                    ║');
console.log('║      في المشروع > "Add Plugin" > "Redis"                  ║');
console.log('║      Railway سيضيف REDIS_URL تلقائياً ✨                  ║');
console.log('║                                                            ║');
console.log('║  4️⃣  أضف متغيرات البيئة:                                  ║');
console.log('║      Variables > انسخ محتوى .env.railway                 ║');
console.log('║                                                            ║');
console.log('║  5️⃣  انتظر اكتمال النشر (3-5 دقائق)                      ║');
console.log('║      ستحصل على رابط مثل: xxx.railway.app                  ║');
console.log('║                                                            ║');
console.log('║  6️⃣  حدّث ALLOWED_ORIGINS في Vercel:                      ║');
console.log('║      أضف رابط Railway الجديد                              ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('💰 التكلفة المتوقعة: $5/شهر فقط (Hobby Plan)\n');
console.log('🎯 الفائدة: Socket.io يعمل 100% = المزادات المباشرة تعمل!\n');

console.log('─────────────────────────────────────────────────────────────');
console.log('📁 ملف .env.railway تم إنشاؤه في:');
console.log('   ' + railwayEnvPath);
console.log('─────────────────────────────────────────────────────────────\n');
