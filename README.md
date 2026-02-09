# 🚗 HM CAR - منصة مزادات السيارات الفاخرة

<div align="center">

![HM CAR Logo](public/images/logo.png)

**منصة متكاملة لمزادات وبيع السيارات الفاخرة**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

[العربية](#العربية) | [English](#english)

</div>

---

## العربية

### 📋 نظرة عامة

**HM CAR** هي منصة متطورة لمزادات وبيع السيارات الفاخرة، مبنية بأحدث التقنيات لتوفير تجربة مستخدم استثنائية.

### ⚡ المميزات الرئيسية

- 🏎️ **معرض السيارات** - عرض السيارات مع صور عالية الجودة ومواصفات تفصيلية
- 🔨 **نظام المزادات** - مزادات حية مع تحديثات فورية
- ❤️ **المفضلات** - حفظ السيارات المفضلة
- ⚖️ **مقارنة السيارات** - مقارنة مواصفات عدة سيارات
- 💬 **نظام الرسائل** - تواصل مباشر بين المستخدمين
- 🔧 **قطع الغيار** - متجر قطع الغيار الأصلية
- 👤 **لوحة تحكم العملاء** - إدارة الحساب والطلبات
- 🔐 **لوحة تحكم الإدارة** - إدارة كاملة للمنصة

### 🛠️ التقنيات المستخدمة

| التقنية | الوصف |
|---------|-------|
| **Backend** | Node.js + Express.js |
| **Frontend** | Next.js 16 + React 19 |
| **Database** | MongoDB |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Auth** | JWT + Sessions |

### 🚀 البدء السريع

```bash
# 1. تثبيت التبعيات
npm install
cd client-app && npm install

# 2. إعداد متغيرات البيئة
cp .env.example .env

# 3. تشغيل قاعدة البيانات
./start-database.bat  # Windows
# أو
mongod --dbpath ./database-data  # Linux/Mac

# 4. تشغيل السيرفر
npm run dev

# 5. تشغيل الواجهة الأمامية (في terminal آخر)
cd client-app && npm run dev
```

### 📁 هيكل المشروع

```
car-auction/
├── client-app/          # Next.js Frontend
│   ├── src/
│   │   ├── app/         # صفحات التطبيق
│   │   ├── components/  # المكونات
│   │   ├── hooks/       # React Hooks
│   │   └── lib/         # المكتبات والأدوات
│   └── public/          # الملفات الثابتة
├── modules/             # وحدات Backend المنظمة
├── routes/              # مسارات API
│   └── api/v2/          # API الإصدار 2
├── models/              # نماذج MongoDB
├── middleware/          # وسطاء Express
├── services/            # خدمات الأعمال
├── config/              # إعدادات التطبيق
└── server.js            # نقطة الدخول
```

### 🔗 الروابط

| الخدمة | الرابط |
|--------|--------|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:4001 |
| **API Docs** | http://localhost:4001/api/v2/docs |

---

## English

### 📋 Overview

**HM CAR** is a sophisticated luxury car auction and sales platform, built with cutting-edge technologies to provide an exceptional user experience.

### ⚡ Key Features

- 🏎️ **Car Showroom** - Display cars with HD images and detailed specs
- 🔨 **Auction System** - Live auctions with real-time updates
- ❤️ **Favorites** - Save favorite cars
- ⚖️ **Car Comparison** - Compare multiple car specifications
- 💬 **Messaging System** - Direct communication between users
- 🔧 **Spare Parts** - Original spare parts store
- 👤 **Client Dashboard** - Account and orders management
- 🔐 **Admin Dashboard** - Complete platform management

### 🛠️ Tech Stack

| Technology | Description |
|------------|-------------|
| **Backend** | Node.js + Express.js |
| **Frontend** | Next.js 16 + React 19 |
| **Database** | MongoDB |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Auth** | JWT + Sessions |

### 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
cd client-app && npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Start database
./start-database.bat  # Windows
# or
mongod --dbpath ./database-data  # Linux/Mac

# 4. Start backend server
npm run dev

# 5. Start frontend (in another terminal)
cd client-app && npm run dev
```

### 📁 Project Structure

```
car-auction/
├── client-app/          # Next.js Frontend
│   ├── src/
│   │   ├── app/         # App pages
│   │   ├── components/  # Components
│   │   ├── hooks/       # React Hooks
│   │   └── lib/         # Libraries & utilities
│   └── public/          # Static files
├── modules/             # Organized Backend modules
├── routes/              # API routes
│   └── api/v2/          # API Version 2
├── models/              # MongoDB models
├── middleware/          # Express middleware
├── services/            # Business services
├── config/              # App configuration
└── server.js            # Entry point
```

### 🔗 Links

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:4001 |
| **API Docs** | http://localhost:4001/api/v2/docs |

---

## 📄 License

This project is private and proprietary. All rights reserved.

## 👥 Team

Developed by **HM CAR Team**

---

<div align="center">

**© 2026 HM CAR. All Rights Reserved.**

</div>
