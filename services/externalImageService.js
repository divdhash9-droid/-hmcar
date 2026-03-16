// [[ARABIC_HEADER]] خدمة معالجة الصور الخارجية - تحميل، ضغط، وتحسين الصور من مصادر خارجية (Encar, Autospare)
// يهدف هذا الملف لضمان خفة وسرعة النظام عبر تخزين نسخ محسنة من الصور بدلاً من الاعتماد الكلي على روابط خارجية كبيرة

const axios = require('axios');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { optimizeImage } = require('../utils/imageOptimizer');

/**
 * تحميل صورة من رابط خارجي ومعالجتها
 * @param {string} url رابط الصورة
 * @param {string} folder المجلد المستهدف (e.g., 'showroom', 'parts')
 * @returns {Promise<string|null>} المسار المحلي الجديد أو الرابط الأصلي في حالة الفشل
 */
async function downloadAndOptimize(url, folder = 'imported') {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;

    try {
        // 1. تحميل الصورة
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.data) return url;

        // 2. ضغط وتحسين الصورة باستخدام Sharp (عبر optimizeImage)
        const optimizedBuffer = await optimizeImage(Buffer.from(response.data), {
            width: 1000,
            height: 700,
            quality: 75,
            format: 'webp'
        });

        // 3. إنشاء اسم فريد وحفظ الملف محلياً
        const hash = crypto.createHash('md5').update(url).digest('hex');
        const filename = `${hash}_opt.webp`;
        const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
        
        // التأكد من وجود المجلد
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const filepath = path.join(uploadsDir, filename);
        await fs.writeFile(filepath, optimizedBuffer);

        // 4. إرجاع المسار النسبي (الذي يفهمه المتصفح عبر /uploads)
        return `/uploads/${folder}/${filename}`;

    } catch (error) {
        console.warn(`[ExternalImage] Failed for ${url}:`, error.message);
        // في حالة الفشل نكتفي بالرابط الأصلي لضمان بقاء الصورة متاحة للعميل
        return url;
    }
}

/**
 * معالجة مجموعة من الروابط
 */
async function processMany(urls = [], folder = 'imported') {
    if (!urls || !Array.isArray(urls)) return [];
    
    // نستخدم Promise.all مع حد أقصى للطلبات المتزامنة (اختياري، هنا نكتفي بالبساطة)
    const results = await Promise.all(
        urls.filter(Boolean).map(url => downloadAndOptimize(url, folder))
    );
    
    return results.filter(Boolean);
}

module.exports = {
    downloadAndOptimize,
    processMany
};
