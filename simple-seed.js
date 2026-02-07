// [[ARABIC_HEADER]] هذا الملف (simple-seed.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function simpleSeed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await User.deleteMany({});
  console.log('🧹 Cleared existing Users');

  const admin = await User.create({
    name: 'أحمد الزمزمي',
    phone: '781007805',
    email: 'admin@localhost.com',
    password: 'Admin@123',
    role: 'admin'
  });

  const buyer = await User.create({
    name: 'عميل تجريبي',
    phone: '500000002',
    password: 'Buyer@123',
    role: 'buyer'
  });

  console.log('✨ Simple seed complete!');
  console.log('🧑‍💼 Admin login -> البريد: admin@localhost.com، كلمة المرور: Admin@123');
  console.log('👤 Buyer login -> الاسم: عميل تجريبي، الهاتف: 500000002');

  await mongoose.disconnect();
  console.log('👋 Disconnected.');
}

simpleSeed().catch(err => {
  console.error('❌ Seed error:', err);
  mongoose.disconnect();
});
