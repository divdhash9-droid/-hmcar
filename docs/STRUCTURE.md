> [[ARABIC_HEADER]] هذا الملف (docs/STRUCTURE.md) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# 📁 هيكل مشروع HM CAR

## نظرة عامة

هذا المستند يوضح الهيكل الكامل للمشروع بعد التحديث إلى النظام الجديد.

```
car-auction/
│
├── 📄 server.js                 # نقطة الدخول الرئيسية
├── 📄 package.json              # تبعيات المشروع
├── 📄 .env                      # متغيرات البيئة
│
├── 📁 client-app/               # تطبيق Next.js (Frontend)
│   ├── 📁 src/
│   │   ├── 📁 app/              # صفحات التطبيق (App Router)
│   │   │   ├── 📄 page.tsx      # الصفحة الرئيسية
│   │   │   ├── 📄 layout.tsx    # التخطيط الرئيسي
│   │   │   ├── 📄 globals.css   # الأنماط العامة
│   │   │   │
│   │   │   ├── 📁 login/        # صفحة تسجيل الدخول
│   │   │   ├── 📁 register/     # صفحة التسجيل
│   │   │   ├── 📁 showroom/     # معرض السيارات
│   │   │   ├── 📁 cars/[id]/    # تفاصيل السيارة
│   │   │   ├── 📁 auctions/     # صفحة المزادات
│   │   │   ├── 📁 auctions/[id]/ # تفاصيل المزاد
│   │   │   ├── 📁 parts/        # قطع الغيار
│   │   │   ├── 📁 favorites/    # المفضلات
│   │   │   ├── 📁 comparisons/  # مقارنة السيارات
│   │   │   ├── 📁 messages/     # الرسائل
│   │   │   ├── 📁 contact/      # اتصل بنا
│   │   │   ├── 📁 search/       # البحث
│   │   │   ├── 📁 concierge/    # خدمة الكونسيرج
│   │   │   │
│   │   │   ├── 📁 client/       # لوحة تحكم العميل
│   │   │   │   └── 📁 dashboard/
│   │   │   │
│   │   │   └── 📁 admin/        # لوحة تحكم الإدارة
│   │   │       ├── 📁 cars/
│   │   │       ├── 📁 users/
│   │   │       ├── 📁 orders/
│   │   │       ├── 📁 auctions/
│   │   │       ├── 📁 parts/
│   │   │       └── 📁 settings/
│   │   │
│   │   ├── 📁 components/       # المكونات القابلة لإعادة الاستخدام
│   │   │   ├── 📄 Navbar.tsx
│   │   │   ├── 📄 Footer.tsx
│   │   │   ├── 📄 ClientPageHeader.tsx
│   │   │   └── 📄 LoadingScreen.tsx
│   │   │
│   │   ├── 📁 hooks/            # React Hooks مخصصة
│   │   │   └── 📄 useLocale.ts
│   │   │
│   │   └── 📁 lib/              # المكتبات والأدوات
│   │       ├── 📄 api.ts        # API Client
│   │       ├── 📄 utils.ts
│   │       └── 📄 LanguageContext.tsx
│   │
│   ├── 📁 public/               # الملفات الثابتة
│   └── 📄 package.json
│
├── 📁 modules/                  # وحدات Backend المنظمة
│   ├── 📄 app.js                # تطبيق Express الرئيسي
│   ├── 📄 database.js           # اتصال قاعدة البيانات
│   ├── 📄 cron.js               # المهام المجدولة
│   └── 📄 logger.js             # نظام التسجيل
│
├── 📁 routes/                   # مسارات API
│   └── 📁 api/v2/               # API الإصدار 2
│       ├── 📄 index.js          # نقطة الدخول للـ API
│       ├── 📄 auth.js           # المصادقة
│       ├── 📄 cars.js           # السيارات
│       ├── 📄 auctions.js       # المزادات
│       ├── 📄 users.js          # المستخدمين
│       ├── 📄 orders.js         # الطلبات
│       ├── 📄 parts.js          # قطع الغيار
│       ├── 📄 favorites.js      # المفضلات
│       ├── 📄 bids.js           # المزايدات
│       ├── 📄 reviews.js        # التقييمات
│       ├── 📄 messages.js       # الرسائل
│       ├── 📄 comparisons.js    # المقارنات
│       ├── 📄 contact.js        # التواصل
│       ├── 📄 settings.js       # الإعدادات
│       ├── 📄 dashboard.js      # لوحة التحكم
│       ├── 📄 analytics.js      # التحليلات
│       └── 📄 notifications.js  # الإشعارات
│
├── 📁 models/                   # نماذج MongoDB
│   ├── 📄 User.js
│   ├── 📄 Car.js
│   ├── 📄 Auction.js
│   ├── 📄 Bid.js
│   ├── 📄 Order.js
│   ├── 📄 Favorite.js
│   ├── 📄 Message.js
│   ├── 📄 Review.js
│   ├── 📄 Comparison.js
│   ├── 📄 Contact.js
│   ├── 📄 SparePart.js
│   └── 📄 Settings.js
│
├── 📁 middleware/               # وسطاء Express
│   ├── 📄 auth.js               # التحقق من المصادقة
│   ├── 📄 admin.js              # التحقق من صلاحيات الإدارة
│   ├── 📄 errorHandler.js       # معالجة الأخطاء
│   ├── 📄 rateLimiter.js        # تحديد معدل الطلبات
│   └── 📄 validation.js         # التحقق من البيانات
│
├── 📁 services/                 # خدمات الأعمال
│   ├── 📄 AuctionService.js
│   ├── 📄 NotificationService.js
│   ├── 📄 EmailService.js
│   └── 📄 UploadService.js
│
├── 📁 config/                   # الإعدادات
│   ├── 📄 database.js
│   ├── 📄 passport.js
│   └── 📄 cors.js
│
├── 📁 locales/                  # ملفات الترجمة
│   ├── 📄 ar.json               # العربية
│   └── 📄 en.json               # الإنجليزية
│
├── 📁 public/                   # الملفات الثابتة للـ Backend
│   ├── 📁 images/
│   ├── 📁 css/
│   └── 📁 js/
│
├── 📁 uploads/                  # الملفات المرفوعة
│
├── 📁 scripts/                  # سكريبتات المساعدة
│
└── 📁 test/                     # اختبارات
```

## 📡 API Endpoints (v2)

### المصادقة `/api/v2/auth`
- `POST /login` - تسجيل الدخول
- `POST /register` - تسجيل جديد
- `GET /verify` - التحقق من الجلسة
- `POST /logout` - تسجيل الخروج

### السيارات `/api/v2/cars`
- `GET /` - قائمة السيارات
- `GET /:id` - تفاصيل سيارة
- `POST /` - إضافة سيارة (Admin)
- `PUT /:id` - تعديل سيارة (Admin)
- `DELETE /:id` - حذف سيارة (Admin)

### المزادات `/api/v2/auctions`
- `GET /` - قائمة المزادات
- `GET /:id` - تفاصيل مزاد
- `POST /` - إنشاء مزاد (Admin)
- `POST /:id/bid` - تقديم مزايدة

### المفضلات `/api/v2/favorites`
- `GET /` - المفضلات
- `POST /` - إضافة للمفضلة
- `DELETE /:carId` - إزالة من المفضلة
- `GET /check/:carId` - التحقق

### الرسائل `/api/v2/messages`
- `GET /conversations` - المحادثات
- `GET /conversation/:userId` - رسائل محادثة
- `POST /` - إرسال رسالة
- `GET /unread-count` - عدد غير المقروء

### المقارنات `/api/v2/comparisons`
- `GET /` - المقارنات المحفوظة
- `POST /add` - إضافة سيارة
- `DELETE /remove/:carId` - إزالة سيارة
- `POST /compare` - مقارنة سيارات

### التواصل `/api/v2/contact`
- `POST /` - إرسال رسالة

### الإعدادات `/api/v2/settings`
- `GET /public` - الإعدادات العامة

---

**آخر تحديث:** فبراير 2026
