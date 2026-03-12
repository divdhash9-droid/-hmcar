const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Mock Models to avoid full project import issue if files are buried
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
    externalUrl: { type: String, unique: true },
    images: [String],
    isActive: { type: Boolean, default: true },
    isSold: { type: Boolean, default: false },
    displayCurrency: { type: String, default: 'KRW' },
}, { timestamps: true });

const Car = mongoose.models.Car || mongoose.model('Car', CarSchema);

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
    
    let imageUrl = null;
    if (typeof car.Photo === 'string' && car.Photo.length > 0) {
        imageUrl = car.Photo.startsWith('http') ? car.Photo : `https://ci.encar.com/carpicture${car.Photo}`;
    } else if (car.Photo?.매물사진?.[0]?.PicFileNo) {
        const photoId = car.Photo.매물사진[0].PicFileNo;
        imageUrl = `https://ci.encar.com/carpicture/carpicture${photoId.substring(0, 2)}/pic${photoId.substring(0, 4)}/${photoId}_001.jpg`;
    }

    return {
        title: `${manuAr} ${model} ${badge}`.trim(),
        make: manuAr,
        model: model,
        year: car.Year || 0,
        mileage: car.Mileage || 0,
        priceKrw: priceKrw,
        priceSar: Math.round(priceKrw * 0.0028),
        fuelType: fuelAr,
        transmission: transAr,
        externalUrl: `https://car.encar.com/detail/car?carid=${car.Id}`,
        images: imageUrl ? [imageUrl] : [],
    };
}

async function populate() {
    if (!MONGO_URI) {
        console.error('❌ No MONGO_URI found');
        return;
    }

    try {
        console.log('🔄 Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        const apiUrl = `https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.(C.CarType.Y.))&sr=%7CMobileModifiedDate%7C0%7C40`;
        
        console.log('🌐 Fetching from Encar...');
        const res = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const cars = res.data.SearchResults || [];
        console.log(`📦 Found ${cars.length} cars. Processing...`);

        let created = 0;
        let updated = 0;

        for (const rawCar of cars) {
            const data = translateCar(rawCar);
            const existing = await Car.findOne({ externalUrl: data.externalUrl });

            if (existing) {
                await Car.updateOne({ _id: existing._id }, data);
                updated++;
            } else {
                await Car.create(data);
                created++;
            }
        }

        console.log(`✨ Success! Created: ${created}, Updated: ${updated}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

populate();
