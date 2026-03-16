const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// نموذج السيارة (Car) - تعريف مبسط للسكريبت
const CarSchema = new mongoose.Schema({
    title: String,
    make: String,
    model: String,
    year: Number,
    mileage: Number,
    price: Number,
    priceSar: Number,
    priceKrw: Number,
    fuelType: String,
    transmission: String,
    listingType: { type: String, default: 'showroom' },
    source: { type: String, default: 'korean_import' },
    externalUrl: { type: String, unique: true },
    images: [String],
    isActive: { type: Boolean, default: true },
    isSold: { type: Boolean, default: false },
    displayCurrency: { type: String, default: 'KRW' },
}, { timestamps: true });

const Car = mongoose.models.Car || mongoose.model('Car', CarSchema);

// قاموس الترجمة المبسط
const TRANSLATIONS = {
    manufacturers: {
        '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
        '삼성': 'سامسونج', '쌍용': 'سانغ يونغ', 'BMW': 'بي إم دبليو',
        '벤츠': 'مرسيدس', '아우دي': 'أودي', '폭스바겐': 'فولكس واغن',
    },
    fuelType: {
        '가솔린': 'بنزين', '디젤': 'ديزل', 'LPG': 'غاز (LPG)',
        '전기': 'كهربائي', '하이브리드': 'هايبرد',
    },
    transmission: {
        '오토': 'أوتوماتيك', '수동': 'يدوي', '자동': 'أوتوماتيك',
    }
};

/** تنظيف وتحسين روابط الصور من Encar */
function normalizeImage(value) {
    if (!value) return null;
    let raw = typeof value === 'string'
        ? value
        : (value.location || value.Location || value.url || value.Url || value.path || value.Path || value.PicUrl || '');
    
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('http')) return trimmed.endsWith('_') ? `${trimmed}001.jpg` : trimmed;
    if (trimmed.endsWith('_')) return `https://ci.encar.com${trimmed}001.jpg`;
    if (trimmed.startsWith('/carpicture')) return `https://ci.encar.com${trimmed}`;
    if (trimmed.startsWith('/')) return `https://ci.encar.com/carpicture${trimmed}`;
    return `https://ci.encar.com/carpicture${trimmed}`;
}

/** ترجمة بيانات السيارة واستخراج كافة الصور */
function translateCar(car) {
    const manufacturer = car.Manufacturer || '';
    const model = car.Model || '';
    const badge = car.Badge || '';
    const fuel = car.Fuel || '';
    const transmission = car.Transmission || '';
    
    const manuAr = TRANSLATIONS.manufacturers[manufacturer] || manufacturer;
    const fuelAr = TRANSLATIONS.fuelType[fuel] || fuel;
    const transAr = TRANSLATIONS.transmission[transmission] || transmission;

    const priceKrw = (car.Price || 0) * 10000;
    
    // [[ARABIC_COMMENT]] استخراج كافة الصور المتاحة لضمان قدرة العميل على التقليب بينها
    const allPhotos = [];
    [car.Photos, car.Images, car.PhotoList, car?.Photo?.매물사진].forEach(list => {
        if (Array.isArray(list)) list.forEach(p => allPhotos.push(normalizeImage(p)));
    });
    [car.Photo, car.PhotoUrl, car.MainImg].forEach(p => allPhotos.push(normalizeImage(p)));

    const uniqueImages = [...new Set(allPhotos.filter(Boolean))];

    return {
        title: `${manuAr} ${model} ${badge}`.trim(),
        make: manuAr,
        model: model,
        year: car.Year || 0,
        mileage: car.Mileage || 0,
        priceKrw: priceKrw,
        priceSar: Math.round(priceKrw * 0.0028), // معامل تحويل تقريبي
        fuelType: fuelAr,
        transmission: transAr,
        externalUrl: `https://car.encar.com/detail/car?carid=${car.Id}`,
        images: uniqueImages,
        source: 'korean_import',
        listingType: 'showroom'
    };
}

async function populate() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI missing in .env');
        return;
    }

    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        const apiUrl = `https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.(C.CarType.Y.))&sr=%7CMobileModifiedDate%7C0%7C40`;
        
        console.log('🌐 Fetching data from Encar.com...');
        const res = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const cars = res.data.SearchResults || [];
        console.log(`📦 Found ${cars.length} cars. Processing imports...`);

        let created = 0;
        let updated = 0;

        for (const rawCar of cars) {
            const data = translateCar(rawCar);
            const existing = await Car.findOne({ externalUrl: data.externalUrl });

            if (existing) {
                // [[ARABIC_COMMENT]] تحديث البيانات مع الحفاظ على القائمة الكاملة للصور
                await Car.updateOne({ _id: existing._id }, data);
                updated++;
            } else {
                await Car.create(data);
                created++;
            }
        }

        console.log(`✨ DONE! Created: ${created}, Updated: ${updated}`);
        console.log('💡 ملاحظة: الصور تم استيرادها كروابط خارجية. استخدم الـ API لتفعيل الضغط التلقائي.');

    } catch (err) {
        console.error('❌ Error during population:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

populate();

