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

    // 1. إنشاء اسم فريد بناءً على الرابط
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const filename = `${hash}_opt.webp`;
    const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
    const filepath = path.join(uploadsDir, filename);

    try {
        // 2. التحقق من وجود الملف مسبقاً (لتوفير الموارد)
        try {
            await fs.access(filepath);
            return `/uploads/${folder}/${filename}`;
        } catch {
            // الملف غير موجود، ننتقل للتحميل
        }

        // 3. تحميل الصورة
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.data) return url;

        // 4. ضغط وتحسين الصورة باستخدام Sharp
        const optimizedBuffer = await optimizeImage(Buffer.from(response.data), {
            width: 1000,
            height: 700,
            quality: 75,
            format: 'webp'
        });

        // 5. التأكد من وجود المجلد وحفظ الملف
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(filepath, optimizedBuffer);

        return `/uploads/${folder}/${filename}`;

    } catch (error) {
        console.warn(`[ExternalImage] Failed for ${url}:`, error.message);
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
