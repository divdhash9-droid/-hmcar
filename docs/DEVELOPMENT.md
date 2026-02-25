> [[ARABIC_HEADER]] هذا الملف (docs/DEVELOPMENT.md) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

# 🔧 دليل التطوير - HM CAR

## المتطلبات الأساسية

- **Node.js** v18 أو أحدث
- **MongoDB** v7 أو أحدث
- **npm** أو **yarn**

## إعداد بيئة التطوير

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-repo/car-auction.git
cd car-auction
```

### 2. تثبيت التبعيات

```bash
# Backend
npm install

# Frontend
cd client-app
npm install
```

### 3. إعداد متغيرات البيئة

```bash
# نسخ ملف المثال
cp .env.example .env
```

#### متغيرات البيئة المطلوبة:

```env
# قاعدة البيانات
MONGODB_URI=mongodb://127.0.0.1:27017/car-auction
DATABASE_NAME=car-auction

# السيرفر
PORT=4001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# الجلسات
SESSION_SECRET=your-session-secret
```

### 4. تشغيل قاعدة البيانات

```bash
# Windows
./start-database.bat

# Linux/Mac
mongod --dbpath ./database-data
```

### 5. تشغيل السيرفرات

```bash
# Backend (Terminal 1)
npm run dev

# Frontend (Terminal 2)
cd client-app
npm run dev
```

## 🔗 الروابط

| الخدمة | الرابط |
|--------|--------|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:4001 |

---

## 📝 إرشادات الكود

### Backend (Node.js/Express)

#### 1. إنشاء مسار API جديد

```javascript
// routes/api/v2/example.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../../../middleware/auth');

// GET - جلب البيانات
router.get('/', async (req, res) => {
  try {
    const data = await Model.find();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - إضافة بيانات (يتطلب مصادقة)
router.post('/', requireAuth, async (req, res) => {
  // ...
});

// DELETE - حذف (يتطلب صلاحيات إدارة)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  // ...
});

module.exports = router;
```

#### 2. إضافة المسار للتطبيق

```javascript
// modules/app.js - في setupApiRoutes()
const exampleRoutes = require('../routes/api/v2/example');
this.app.use('/api/v2/example', exampleRoutes);
```

### Frontend (Next.js/React)

#### 1. إنشاء صفحة جديدة

```tsx
// client-app/src/app/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function ExamplePage() {
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.example.list();
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      {/* محتوى الصفحة */}
    </div>
  );
}
```

#### 2. إضافة دالة API

```typescript
// client-app/src/lib/api.ts
export const api = {
  // ... existing APIs
  
  example: {
    list: () => fetchAPI('/api/v2/example'),
    getById: (id: string) => fetchAPI(`/api/v2/example/${id}`),
    create: (data: any) => fetchAPI('/api/v2/example', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
};
```

---

## 🎨 إرشادات التصميم

### نظام الألوان

```css
/* الألوان الأساسية */
--color-primary: #c5a059;      /* الذهبي */
--color-background: #000000;   /* الأسود */
--color-text: #ffffff;         /* الأبيض */
--color-text-muted: rgba(255, 255, 255, 0.6);

/* ألوان الحالة */
--color-success: #22c55e;
--color-error: #ef4444;
--color-warning: #f59e0b;
```

### أنماط المكونات

```tsx
// زر أساسي
<button className="px-8 py-4 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-all">

// كارت
<div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">

// حقل إدخال
<input className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059]" />
```

---

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات النماذج فقط
npm run test:models

# اختبارات API
npm run test:api

# تغطية الكود
npm run test:coverage
```

---

## 📦 النشر

### Vercel (Frontend)

```bash
cd client-app
vercel --prod
```

### Server (Backend)

```bash
npm run build
npm start
```

---

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من تشغيل MongoDB
   - تحقق من `MONGODB_URI` في `.env`

2. **خطأ CORS**
   - تأكد من إعداد cors في `modules/app.js`

3. **خطأ في تحميل الصور**
   - تأكد من وجود مجلد `uploads`
   - تحقق من صلاحيات الكتابة

---

**آخر تحديث:** فبراير 2026
