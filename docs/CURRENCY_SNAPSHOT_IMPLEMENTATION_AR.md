# توثيق التنفيذ - نظام الأسعار وسعر الصرف (USD Base + Snapshot)

## ملخص تنفيذي (للإدارة)
- تم توحيد منطق الأسعار بحيث يكون الأصل USD والعرض حسب العملة المختارة.
- تم تثبيت قيمة الطلبات تاريخياً عبر حفظ Snapshot لسعر الصرف وقت إنشاء الطلب.
- تم تحديث التقارير لتعرض إيرادات متعددة العملات بشكل أدق، مع دعم فلترة الفترة الزمنية فعلياً.
- تم استبدال البيانات الثابتة في التقارير (Top Cars) ببيانات مباشرة من النظام.

الأثر التجاري المباشر:
- تقليل التباين المحاسبي عند تغير سعر الصرف.
- رفع موثوقية الفواتير والتقارير التاريخية.
- تحسين جودة القرار الإداري عبر بيانات أدق حسب الفترة والعملة.

## 1) الهدف من التنفيذ
تم تطوير النظام ليعتمد أفضل ممارسة محاسبية وتسعيرية:
- السعر الأساسي للبيانات = USD.
- العرض للعميل/الأدمن = حسب العملة المختارة (SAR / USD / KRW).
- حفظ Snapshot لسعر الصرف داخل الطلب لحظة الإنشاء لضمان الثبات التاريخي.

النتيجة: تغير سعر الصرف لاحقاً لا يغيّر قيمة الطلبات القديمة أو الفواتير القديمة.

---

## 2) ما تم على الباكند

### 2.1 إعدادات الصرف
تم تحسين endpoint إعدادات الصرف مع التحقق من المدخلات:
- التحقق من usdToSar > 0
- التحقق من usdToKrw > 0
- التحقق من activeCurrency ضمن العملات المدعومة

ملف:
- routes/api/v2/settings.js

### 2.2 توحيد التسعير على USD Base
تم إضافة/استخدام الحقول التالية:
- basePriceUsd
- priceUsd
- priceSar
- priceKrw

وتطبيع الأسعار عند create/update للسيارات وفق أسعار الصرف الحالية.

ملفات:
- models/Car.js
- models/SparePart.js
- routes/api/v2/cars.js
- routes/api/v2/parts.js
- routes/api/v2/showroom.js

### 2.3 Snapshot داخل الطلبات
تم إضافة exchangeSnapshot داخل pricing في الطلب:
- usdToSar
- usdToKrw
- activeCurrency
- capturedAt

كما تم تطبيع unitPriceSar/unitPriceUsd داخل عناصر الطلب.

ملفات:
- models/Order.js
- routes/api/v2/orders.js

---

## 3) ما تم على الواجهة (Frontend)

### 3.1 تنسيق العملة المركزي
تم دعم تنسيق الأسعار من:
- SAR base: formatPrice
- USD base: formatPriceFromUsd

ملف:
- client-app/src/lib/SettingsContext.tsx

### 3.2 ربط صفحات العميل بالعملة الديناميكية
تم تحديث عدة صفحات لإزالة SAR الثابت، واستخدام التحويل المركزي/أو Snapshot الطلب:
- السلة + مشاركة السلة
- تفاصيل سيارات HM CAR
- تفاصيل سيارات المعرض الكوري
- الطلبات + تفاصيل الطلب + الفاتورة
- البحث
- مزاداتي
- المقارنات
- لوحة العميل

ملفات رئيسية:
- client-app/src/app/cart/page.tsx
- client-app/src/app/cart/share/page.tsx
- client-app/src/app/cars/[id]/page.tsx
- client-app/src/app/showroom/[id]/page.tsx
- client-app/src/app/orders/page.tsx
- client-app/src/app/orders/[id]/page.tsx
- client-app/src/app/orders/[id]/invoice/page.tsx
- client-app/src/app/search/page.tsx
- client-app/src/app/auctions/my-bids/page.tsx
- client-app/src/app/comparisons/page.tsx
- client-app/src/app/client/dashboard/page.tsx

### 3.3 Helper موحد لأسعار الطلبات
تم إنشاء helper لاستخدام Snapshot الطلب في العرض:
- resolveOrderSnapshot
- formatAmountWithSnapshot
- getOrderGrandTotalSar
- getOrderItemUnitSar

ملف:
- client-app/src/lib/orderCurrency.ts

---

## 4) التقارير والتحليلات (Analytics)

### 4.1 التحليلات مبنية على Snapshot
تم تحويل تجميع الإيرادات ليعتمد:
- pricing.grandTotalSar
- pricing.exchangeSnapshot.usdToSar/usdToKrw
- fallback إلى totalAmount عند الطلبات القديمة

ويتم الآن إرجاع:
- totalRevenue / totalRevenueUsd / totalRevenueKrw
- revenueLast7 / revenueLast7Usd / revenueLast7Krw
- monthlyRevenue مع revenue/revenueUsd/revenueKrw
- topCars مع revenueSar/revenueUsd/revenueKrw

ملف:
- services/AnalyticsService.js

### 4.2 فلترة الفترة (Period) فعلياً من API
تم دعم period في endpoints:
- /api/v2/analytics?period=...
- /api/v2/analytics/detailed?period=...

القيم المدعومة:
- all
- week
- month
- year

ملف:
- routes/api/v2/analytics.js

### 4.3 توصيل period من الواجهة
تم تمرير period من صفحة التقارير إلى API فعلياً.

ملفات:
- client-app/src/lib/api.ts
- client-app/src/app/admin/reports/page.tsx

### 4.4 Top Cars من الباكند مباشرة
تم إزالة الاعتماد على بيانات ثابتة في التقارير، وأصبح Top Cars live من endpoint التفصيلي.

ملف:
- client-app/src/app/admin/reports/page.tsx

---

## 5) أثر التنفيذ
- ثبات مالي تاريخي للفواتير والطلبات القديمة.
- دقة أعلى في التقارير عند تغيير سعر الصرف مستقبلاً.
- تجربة عرض موحدة بين العميل والأدمن.
- مرونة تشغيلية عبر period filtering الفعلي.

---

## 6) ملاحظات مهمة
- بعض تحذيرات lint الحالية في المشروع موجودة من قبل ولا تؤثر على منطق الصرف الجديد.
- تم إضافة تعليقات عربية في الأجزاء التي تم تطويرها لتسهيل الصيانة لاحقاً.

---

## 7) توصيات لاحقة
- إضافة endpoint خاص لتاريخ حركة أسعار الصرف (audit trail).
- إضافة اختبارات تكاملية تتحقق من ثبات الفاتورة بعد تغيير سعر الصرف العام.
- إضافة توثيق Postman/Swagger يوضح period params وقيم الاستجابة متعددة العملات.

---

## 8) Checklist اختبار يدوي بعد النشر

### A) إعدادات الصرف
- افتح إعدادات الصرف في الأدمن وعدل usdToSar و usdToKrw.
- تحقق أن الحفظ ينجح فقط للقيم الموجبة.
- تحقق أن activeCurrency يقبل فقط العملات المدعومة.

### B) إنشاء طلب جديد والتحقق من Snapshot
- أنشئ طلباً جديداً بعد تعديل سعر الصرف.
- راجع الطلب في قاعدة البيانات وتأكد من وجود pricing.exchangeSnapshot.
- تأكد أن الحقول usdToSar و usdToKrw و capturedAt محفوظة داخل الطلب.

### C) ثبات تاريخي للطلبات القديمة
- غيّر سعر الصرف مرة أخرى في الإعدادات.
- افتح طلباً قديماً وفاتورته.
- تأكد أن القيم المعروضة للطلب القديم لم تتغير نتيجة سعر الصرف الجديد.

### D) صفحات العرض للعميل
- تحقق من صفحات: السيارات، المعرض، السلة، الطلبات، الفاتورة.
- غيّر العملة النشطة ثم راقب تغير العرض فوراً.
- تأكد أن الأرقام منسقة وفق العملة المختارة بدون كسر في الواجهة.

### E) تقارير الأدمن
- انتقل لصفحة التقارير.
- جرّب period: week ثم month ثم year ثم all.
- تأكد أن الأرقام تتغير فعلياً حسب الفترة.
- تأكد أن Top Cars ليست ثابتة وتتغير حسب بيانات النظام.
- غيّر عملة العرض وتأكد أن revenue والرسوم البيانية تتبع العملة المختارة.

### F) تصدير CSV
- صدّر التقرير بصيغة CSV.
- تحقق أن قيم الإيرادات داخل الملف تتبع نفس عملة العرض الحالية.

### G) توافق البيانات القديمة
- اختبر وجود طلبات قديمة بلا snapshot.
- تأكد أن النظام يطبق fallback بدون فشل في التقارير أو الواجهات.

معيار نجاح نهائي:
- نجاح البنود A إلى G بدون أخطاء وظيفية يعني أن منظومة الصرف وSnapshot تعمل كما هو متوقع في الإنتاج.
