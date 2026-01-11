# 🚗 هيكلة مشروع HM CAR Auction

> آخر تحديث: يناير 2026

---

## 📁 الهيكل العام للمشروع

```
car-auction/
├── 📄 server.js              # الملف الرئيسي للسيرفر
├── 📄 package.json           # إعدادات المشروع والاعتماديات
├── 📄 .env                   # متغيرات البيئة (سري)
├── 📄 .env.example           # مثال لمتغيرات البيئة
├── 📄 simple-seed.js         # سكربت إنشاء بيانات تجريبية
│
├── 📁 config/                # إعدادات التطبيق
│   ├── database.js           # إعدادات قاعدة البيانات MongoDB
│   ├── cloudinary.js         # إعدادات رفع الصور
│   ├── redis.js              # إعدادات التخزين المؤقت
│   └── serviceAccountKey.json # مفاتيح الخدمات (سري)
│
├── 📁 models/                # نماذج قاعدة البيانات (Mongoose)
│   ├── User.js               # نموذج المستخدم
│   ├── Car.js                # نموذج السيارة
│   ├── Auction.js            # نموذج المزاد
│   ├── Bid.js                # نموذج المزايدة
│   ├── Order.js              # نموذج الطلب
│   ├── Brand.js              # نموذج الشركة المصنعة
│   ├── SparePart.js          # نموذج قطعة الغيار
│   ├── SpareBrand.js         # نموذج شركة قطع الغيار
│   ├── Notification.js       # نموذج الإشعار
│   ├── Message.js            # نموذج الرسالة
│   ├── Conversation.js       # نموذج المحادثة
│   ├── ExchangeRate.js       # نموذج سعر الصرف
│   ├── Favorite.js           # نموذج المفضلة
│   ├── Comparison.js         # نموذج المقارنة
│   ├── Review.js             # نموذج التقييم
│   ├── Payment.js            # نموذج الدفع
│   ├── Settings.js           # نموذج الإعدادات
│   ├── SiteSetting.js        # نموذج إعدادات الموقع
│   ├── SupportMessage.js     # نموذج رسالة الدعم
│   ├── SearchHistory.js      # نموذج سجل البحث
│   ├── VehicleCategory.js    # نموذج فئة المركبة
│   ├── Report.js             # نموذج التقرير
│   ├── Role.js               # نموذج الصلاحية
│   ├── AuditLog.js           # نموذج سجل التدقيق
│   ├── Backup.js             # نموذج النسخ الاحتياطي
│   ├── Analytics.js          # نموذج التحليلات
│   ├── AdvancedNotification.js # نموذج الإشعارات المتقدمة
│   ├── AdvancedPermission.js # نموذج الصلاحيات المتقدمة
│   └── UserNotification.js   # نموذج إشعارات المستخدم
│
├── 📁 routes/                # مسارات API والصفحات
│   ├── auth.js               # مسارات المصادقة (تسجيل/دخول/خروج)
│   ├── cars.js               # مسارات السيارات
│   ├── auctions.js           # مسارات المزادات
│   ├── bids.js               # مسارات المزايدات
│   ├── admin.js              # مسارات لوحة الأدمن
│   ├── spareParts.js         # مسارات قطع الغيار
│   ├── orders.js             # مسارات الطلبات
│   ├── messages.js           # مسارات الرسائل
│   ├── notifications.js      # مسارات الإشعارات
│   ├── search.js             # مسارات البحث
│   ├── payments.js           # مسارات الدفع
│   ├── reports.js            # مسارات التقارير
│   ├── favorites.js          # مسارات المفضلة
│   ├── comparisons.js        # مسارات المقارنات
│   ├── support.js            # مسارات الدعم الفني
│   └── sitemap.js            # مسارات خريطة الموقع
│
├── 📁 middleware/            # الوسطاء (Middleware)
│   ├── auth.js               # التحقق من المصادقة
│   ├── adminAuth.js          # التحقق من صلاحية الأدمن
│   ├── roles.js              # التحقق من الأدوار
│   ├── permissions.js        # التحقق من الصلاحيات
│   ├── cache.js              # التخزين المؤقت
│   ├── cdn.js                # شبكة توصيل المحتوى
│   ├── jwt.js                # التحقق من JWT
│   └── seo.js                # تحسين محركات البحث
│
├── 📁 services/              # الخدمات
│   ├── CacheService.js       # خدمة التخزين المؤقت
│   ├── CDNService.js         # خدمة CDN
│   ├── NotificationService.js # خدمة الإشعارات
│   ├── PaymentService.js     # خدمة الدفع
│   ├── SEOService.js         # خدمة SEO
│   ├── WebSocketService.js   # خدمة WebSocket
│   └── lotteAuctionSync.js   # مزامنة مزادات Lotte
│
├── 📁 views/                 # قوالب العرض (EJS)
│   ├── layout.ejs            # القالب الرئيسي
│   ├── index.ejs             # الصفحة الرئيسية
│   │
│   ├── 📁 admin/             # صفحات الأدمن
│   │   ├── dashboard.ejs     # لوحة تحكم الأدمن
│   │   ├── unified-dashboard.ejs # لوحة التحكم الموحدة
│   │   ├── cars.ejs          # إدارة السيارات
│   │   ├── orders.ejs        # إدارة الطلبات
│   │   ├── users.ejs         # إدارة المستخدمين
│   │   ├── users-management.ejs # إدارة صلاحيات المستخدمين
│   │   ├── brands.ejs        # إدارة الشركات
│   │   ├── categories.ejs    # إدارة الفئات
│   │   ├── spare-parts.ejs   # إدارة قطع الغيار
│   │   ├── spare-brands.ejs  # إدارة شركات القطع
│   │   ├── auctions-unified.ejs # إدارة المزادات
│   │   ├── notifications.ejs # إدارة الإشعارات
│   │   ├── settings.ejs      # الإعدادات العامة
│   │   ├── exchange-rate.ejs # سعر الصرف
│   │   ├── support.ejs       # الدعم الفني
│   │   ├── confirm-sale.ejs  # تأكيد البيع
│   │   ├── live-auction.ejs  # المزاد المباشر
│   │   └── 📁 settings/      # إعدادات فرعية
│   │       ├── whatsapp.ejs  # إعدادات واتساب
│   │       └── footer.ejs    # إعدادات الفوتر
│   │
│   ├── 📁 auth/              # صفحات المصادقة
│   │   ├── login.ejs         # تسجيل الدخول
│   │   └── register.ejs      # التسجيل
│   │
│   ├── 📁 cars/              # صفحات السيارات
│   │   ├── list.ejs          # قائمة السيارات
│   │   ├── form.ejs          # نموذج إضافة/تعديل
│   │   ├── brands.ejs        # الشركات المصنعة
│   │   ├── buyer-dashboard.ejs # لوحة تحكم المشتري
│   │   └── my-cars.ejs       # سياراتي
│   │
│   ├── 📁 auctions/          # صفحات المزادات
│   │   ├── live.ejs          # المزاد المباشر
│   │   ├── detail.ejs        # تفاصيل المزاد
│   │   └── cars.ejs          # سيارات المزاد
│   │
│   ├── 📁 spare-parts/       # صفحات قطع الغيار
│   │   ├── list.ejs          # قائمة القطع
│   │   ├── detail.ejs        # تفاصيل القطعة
│   │   ├── brands.ejs        # شركات القطع
│   │   ├── cart.ejs          # سلة التسوق
│   │   └── index.ejs         # الصفحة الرئيسية
│   │
│   ├── 📁 client/            # صفحات العميل
│   │   └── dashboard.ejs     # لوحة تحكم العميل
│   │
│   └── 📁 partials/          # أجزاء مشتركة
│       ├── admin-sidebar.ejs # القائمة الجانبية للأدمن
│       ├── admin-dashboard.ejs # محتوى لوحة الأدمن
│       ├── footer.ejs        # الفوتر
│       ├── seo-head-fixed.ejs # رأس SEO
│       ├── chat-sidebar.ejs  # قائمة المحادثات
│       ├── chat-window.ejs   # نافذة المحادثة
│       ├── notification-center.ejs # مركز الإشعارات
│       ├── payment-form.ejs  # نموذج الدفع
│       ├── advanced-search.ejs # البحث المتقدم
│       ├── cdn-image.ejs     # صورة CDN
│       ├── auction_card.ejs  # بطاقة المزاد
│       └── seo-breadcrumbs.ejs # مسار التنقل
│
├── 📁 public/                # الملفات العامة
│   ├── manifest.json         # إعدادات PWA
│   ├── sw.js                 # Service Worker
│   │
│   ├── 📁 css/               # ملفات الأنماط
│   │   ├── unified-luxury.css # الأنماط الفخمة الموحدة
│   │   ├── dashboard-luxury.css # أنماط لوحة التحكم
│   │   ├── theme-enhancements.css # تحسينات الثيم
│   │   ├── advanced-animations.css # الرسوم المتحركة
│   │   └── accessibility.css # إمكانية الوصول
│   │
│   ├── 📁 js/                # ملفات JavaScript
│   │   ├── dashboard-luxury.js # تفاعلات لوحة التحكم
│   │   ├── theme-interactions.js # تفاعلات الثيم
│   │   ├── advanced-animations.js # الرسوم المتحركة
│   │   ├── auction-live.js   # المزاد المباشر
│   │   ├── countdown.js      # العد التنازلي
│   │   ├── voice-search.js   # البحث الصوتي
│   │   └── accessibility.js  # إمكانية الوصول
│   │
│   └── 📁 images/            # الصور
│       └── ...
│
├── 📁 scripts/               # سكربتات مساعدة
│   ├── initializeSystem.js   # تهيئة النظام
│   ├── addDatabaseIndexes.js # إضافة فهارس قاعدة البيانات
│   ├── check-ejs.js          # فحص ملفات EJS
│   └── install-mongodb.ps1   # تثبيت MongoDB
│
└── 📁 utils/                 # أدوات مساعدة
    └── imageOptimizer.js     # تحسين الصور
```

---

## 🗄️ نماذج قاعدة البيانات (Models)

| النموذج | الوصف | الحقول الرئيسية |
|---------|-------|-----------------|
| `User` | المستخدمين | name, email, phone, password, role |
| `Car` | السيارات | title, brand, model, year, price, images |
| `Auction` | المزادات | car, startPrice, currentPrice, status, endTime |
| `Bid` | المزايدات | auction, user, amount, timestamp |
| `Order` | الطلبات | buyer, car, status, totalPrice |
| `Brand` | الشركات | name, logo, country |
| `SparePart` | قطع الغيار | name, brand, price, quantity |
| `Notification` | الإشعارات | user, type, message, status |
| `ExchangeRate` | سعر الصرف | currency, rate, updatedAt |

---

## 🔐 الأدوار والصلاحيات

| الدور | الوصف | الصلاحيات |
|-------|-------|-----------|
| `admin` | المدير | كل الصلاحيات |
| `super_admin` | المدير الأعلى | كل الصلاحيات + إدارة المديرين |
| `manager` | المشرف | إدارة المحتوى |
| `buyer` | المشتري | التصفح والشراء والمزايدة |

---

## 🌐 المسارات الرئيسية

### مسارات العميل
- `/` - الصفحة الرئيسية
- `/cars` - قائمة السيارات
- `/auctions/live` - المزاد المباشر
- `/spare-parts` - قطع الغيار
- `/client/dashboard` - لوحة تحكم العميل

### مسارات الأدمن
- `/admin` - لوحة التحكم
- `/admin/cars` - إدارة السيارات
- `/admin/orders` - إدارة الطلبات
- `/admin/users` - إدارة المستخدمين
- `/admin/auctions` - إدارة المزادات
- `/admin/settings` - الإعدادات

### مسارات API
- `/auth/*` - المصادقة
- `/api/bids/*` - المزايدات
- `/api/notifications/*` - الإشعارات
- `/api/search/*` - البحث

---

## ⚙️ متغيرات البيئة (.env)

```env
# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/car-auction

# الجلسات
SESSION_SECRET=your-secret-key

# المنفذ
PORT=4000

# البيئة
NODE_ENV=development
```

---

## 🚀 تشغيل المشروع

```bash
# تثبيت الاعتماديات
npm install

# تشغيل في وضع التطوير
npm run dev

# تشغيل في وضع الإنتاج
npm start

# إنشاء بيانات تجريبية
node simple-seed.js
```

---

## 📝 ملاحظات مهمة

1. **قاعدة البيانات**: MongoDB يجب أن يكون يعمل على المنفذ 27017
2. **الجلسات**: تُخزن في MongoDB عبر connect-mongo
3. **الأمان**: CSRF protection مفعّل على جميع النماذج
4. **التخزين المؤقت**: Redis اختياري للأداء
5. **الصور**: تُرفع إلى Cloudinary أو تُخزن محلياً

