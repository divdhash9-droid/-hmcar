# [[ARABIC_HEADER]] Dockerfile محسّن لمشروع HM CAR ليدعم كافة المكتبات على Railway.app

# نصيحة: نستخدم نسخة slim من Node لتوفير المساحة مع دعم كامل للمكتبات
FROM node:24-bookworm-slim

# إعداد بيئة العمل
WORKDIR /app

# تثبيت المكتبات الضرورية (خاصة بـ Sharp و Puppeteer والمتطلبات الأخرى)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libvips-dev \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت الملحقات البرمجية (Production only)
RUN npm install --omit=dev --no-audit --no-fund

# نسخ كود المشروع بالكامل
COPY . .

# إنشاء المجلدات الضرورية بصلاحيات كاملة
RUN mkdir -p logs uploads/images public/images && chmod -R 777 logs uploads public

# إعدادات البيئة
ENV NODE_ENV=production
ENV PORT=4000

# فتح المنفذ
EXPOSE 4000

# بدء تشغيل السيرفر
CMD ["node", "server.js"]
