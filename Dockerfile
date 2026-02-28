# [[ARABIC_HEADER]] Dockerfile محسّن لمشروع HM CAR ليدعم كافة المكتبات على Railway.app

# نصيحة: نستخدم نسخة slim من Node لتوفير المساحة مع دعم كامل للمكتبات
FROM node:20-bookworm-slim

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
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت الملحقات البرمجية (Production only)
# ملاحظة: نستخدم --legacy-peer-deps إذا كان هناك تعارض في النسخ
RUN npm ci --only=production

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
