#!/usr/bin/env node
/**
 * [[ARABIC_COMMENT]] سكريبت النشر الذكي لـ HM CAR
 * [[ARABIC_COMMENT]] يتحقق من صحة الكود قبل النشر ثم ينشر بأمان
 *
 * الاستخدام:
 *   node deploy.js           ← نشر عادي
 *   node deploy.js --check   ← فحص فقط بدون نشر
 *   node deploy.js --force   ← نشر بدون أسئلة
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] ألوان للطرفية
// ──────────────────────────────────────────────────────────────
const c = {
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    blue: (s) => `\x1b[34m${s}\x1b[0m`,
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    bold: (s) => `\x1b[1m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const log = {
    info: (msg) => console.log(c.blue('ℹ') + '  ' + msg),
    ok: (msg) => console.log(c.green('✅') + ' ' + msg),
    warn: (msg) => console.log(c.yellow('⚠️') + '  ' + msg),
    error: (msg) => console.log(c.red('❌') + ' ' + msg),
    step: (n, msg) => console.log(`\n${c.cyan(c.bold(`[${n}]`))} ${c.bold(msg)}`),
    divider: () => console.log(c.dim('─'.repeat(55))),
};

const checkOnly = process.argv.includes('--check');
const forceMode = process.argv.includes('--force');

// ──────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] تحديث رقم الإصدار في Service Worker
// ──────────────────────────────────────────────────────────────
function updateSWVersion() {
    const swPath = path.join(__dirname, 'client-app', 'public', 'sw.js');
    if (!fs.existsSync(swPath)) {
        log.warn('لا يوجد ملف sw.js - سيعمل بدون PWA');
        return;
    }
    const timestamp = Date.now().toString(36); // مثل: "lv1q5s8"
    let content = fs.readFileSync(swPath, 'utf-8');
    content = content.replace(/const SW_VERSION = '.*';/, `const SW_VERSION = '${timestamp}';`);
    fs.writeFileSync(swPath, content);
    log.ok(`تم تحديث إصدار Service Worker إلى: ${timestamp}`);
}

// ──────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] تشغيل أمر وإرجاع النتيجة
// ──────────────────────────────────────────────────────────────
function run(cmd, cwd, label) {
    try {
        execSync(cmd, { cwd, stdio: 'inherit', encoding: 'utf-8' });
        return true;
    } catch (err) {
        log.error(`فشل: ${label}`);
        return false;
    }
}

// ──────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] الدالة الرئيسية
// ──────────────────────────────────────────────────────────────
async function main() {
    console.log('\n' + c.bold(c.yellow('🚀 HM CAR - نظام النشر الذكي')));
    console.log(c.dim(new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })));
    log.divider();

    const clientDir = path.join(__dirname, 'client-app');
    let hasErrors = false;

    // ─── الخطوة 1: فحص السكريبت نفسه ───────────────────────
    log.step(1, 'فحص الملفات الأساسية...');

    const requiredFiles = [
        'client-app/package.json',
        'client-app/next.config.ts',
        'vercel.json',
    ];

    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            log.ok(`موجود: ${file}`);
        } else {
            log.error(`مفقود: ${file}`);
            hasErrors = true;
        }
    }

    if (hasErrors) {
        log.error('يوجد ملفات مطلوبة ناقصة. أوقف النشر.');
        process.exit(1);
    }

    // ─── الخطوة 2: تحديث Service Worker ────────────────────
    log.step(2, 'تحديث Service Worker...');
    updateSWVersion();

    // ─── الخطوة 3: بناء المشروع ──────────────────────────────
    log.step(3, 'بناء المشروع (next build)...');
    log.info('هذا يستغرق دقيقة واحدة تقريباً...');

    const buildOk = run('npm run build', clientDir, 'next build');

    if (!buildOk) {
        log.error('فشل البناء! لا يمكن النشر حتى تُحل الأخطاء.');
        log.warn('راجع رسائل الخطأ أعلاه وأصلحها ثم أعد المحاولة.');
        process.exit(1);
    }

    log.ok('البناء نجح بدون أخطاء! ✨');

    if (checkOnly) {
        log.ok('وضع الفحص فقط - لن يتم النشر.');
        process.exit(0);
    }

    log.divider();

    // ─── الخطوة 4: Git Commit ────────────────────────────────
    log.step(4, 'حفظ التغييرات (Git)...');

    const timestamp = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
    const commitMsg = `🚀 نشر تلقائي - ${timestamp}`;

    try {
        execSync('git add .', { cwd: __dirname, stdio: 'pipe' });
        const statusOut = execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf-8' });

        if (statusOut.trim() === '') {
            log.info('لا توجد تغييرات جديدة للحفظ.');
        } else {
            execSync(`git commit -m "${commitMsg}"`, { cwd: __dirname, stdio: 'inherit' });
            log.ok('تم حفظ التغييرات بنجاح!');
        }
    } catch (e) {
        log.warn('لم يُحفظ Git: ' + e.message);
    }

    // ─── الخطوة 5: النشر على Vercel ─────────────────────────
    log.step(5, 'النشر على Vercel...');
    log.info('جاري الرفع والنشر...');

    const deployOk = run(
        `vercel --prod --yes`,
        __dirname,
        'vercel deploy'
    );

    log.divider();

    if (deployOk) {
        console.log('\n' + c.green(c.bold('🎉 تم النشر بنجاح!')));
        console.log(c.cyan('🌐 الموقع: https://car-auction-sand.vercel.app'));
        console.log(c.dim('التغييرات ستظهر فوراً عند تحديث الصفحة.'));
    } else {
        console.log('\n' + c.red(c.bold('⚠️ فشل النشر على Vercel')));
        log.warn('جرب تشغيل: vercel --prod --yes   مباشرة لرؤية تفاصيل الخطأ.');
        process.exit(1);
    }
}

main().catch((err) => {
    log.error('خطأ غير متوقع: ' + err.message);
    process.exit(1);
});
