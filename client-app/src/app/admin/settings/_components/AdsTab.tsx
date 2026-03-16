'use client';

/**
 * تبويب إدارة الإعلانات - لوحة تحكم HM CAR
 * ─────────────────────────────────────────
 * يتحكم الأدمن من هنا بما يظهر في الشريط الإعلاني المتحرك
 * بالصفحة الرئيسية، مع خيارين رئيسيين:
 *   1. المزاد المباشر - يظهر تلقائياً عند الإضافة (إظهار/إخفاء)
 *   2. معرض السيارات - الأدمن يختار المصدر (كوري / HM Car / كلاهما)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Megaphone, Radio, Car, Eye, EyeOff, Check,
    Save, Loader2, Globe, Zap, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from '@/lib/api';

// ── نوع إعدادات الإعلانات ──
interface AdvertisingSettings {
    showLiveAuction: boolean;        // إظهار/إخفاء المزاد المباشر في الشريط
    showroomSource: 'none' | 'korean' | 'hmcar' | 'both'; // مصدر سيارات المعرض
    bannerLabel: string;             // نص الشعار (عربي اختياري)
    bannerLabelEn: string;           // نص الشعار (إنجليزي اختياري)
}

// ── القيم الافتراضية ──
const DEFAULT_SETTINGS: AdvertisingSettings = {
    showLiveAuction: false,
    showroomSource: 'none',
    bannerLabel: '',
    bannerLabelEn: '',
};

interface AdsTabProps {
    isRTL: boolean;
}

export default function AdsTab({ isRTL }: AdsTabProps) {
    // ── الحالة الداخلية ──
    const [settings, setSettings] = useState<AdvertisingSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);         // تحميل البيانات
    const [saving, setSaving] = useState(false);           // حفظ البيانات
    const [savedOk, setSavedOk] = useState(false);         // رسالة النجاح
    const [error, setError] = useState('');               // رسالة الخطأ

    // ── جلب الإعدادات عند التحميل ──
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await api.settings.getAdvertising();
                if (res.success && res.data) {
                    setSettings({ ...DEFAULT_SETTINGS, ...res.data });
                }
            } catch (err) {
                console.error('فشل تحميل إعدادات الإعلانات:', err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    // ── حفظ الإعدادات ──
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await api.settings.updateAdvertising({ advertisingSettings: settings as any });
            if (res.success) {
                setSavedOk(true);
                // إخفاء رسالة النجاح بعد 3 ثوانٍ
                setTimeout(() => setSavedOk(false), 3000);
            }
        } catch (err: any) {
            setError(err.message || 'فشل الحفظ');
        } finally {
            setSaving(false);
        }
    };

    // ── خيارات مصدر المعرض ──
    const showroomOptions: { value: AdvertisingSettings['showroomSource']; labelAr: string; labelEn: string; icon: any; color: string }[] = [
        { value: 'none', labelAr: 'إيقاف المعرض', labelEn: 'Disabled', icon: EyeOff, color: 'border-white/10 text-white/30' },
        { value: 'korean', labelAr: 'المعرض الكوري', labelEn: 'Korean Showroom', icon: Globe, color: 'border-blue-500/40 text-blue-400' },
        { value: 'hmcar', labelAr: 'معرض HM Car', labelEn: 'HM Car Gallery', icon: Car, color: 'border-accent-gold/40 text-accent-gold' },
        { value: 'both', labelAr: 'كلا المعرضين', labelEn: 'Both Showrooms', icon: Zap, color: 'border-emerald-500/40 text-emerald-400' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* ── رأس القسم ── */}
            <div className="p-6 bg-gradient-to-br from-accent-gold/5 to-transparent border border-accent-gold/20 rounded-3xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
                        <Megaphone className="w-6 h-6 text-accent-gold" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-wider text-white">
                            {isRTL ? 'إدارة الإعلانات' : 'Ad Management'}
                        </h2>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            {isRTL
                                ? 'تحكم بما يظهر في الشريط الإعلاني المتحرك بالصفحة الرئيسية'
                                : 'Control what appears in the animated ad banner on the homepage'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── الخيار الأول: المزاد المباشر ── */}
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* أيقونة المزاد المباشر */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            settings.showLiveAuction
                                ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/30'
                                : 'bg-white/5 border border-white/10'
                        }`}>
                            <Radio className={`w-6 h-6 ${settings.showLiveAuction ? 'text-[#00f0ff]' : 'text-white/30'}`} />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-wider text-white">
                                {isRTL ? 'المزاد المباشر' : 'Live Auction'}
                            </h3>
                            <p className="text-[11px] text-white/40 mt-0.5">
                                {isRTL
                                    ? 'سيارات المزاد المباشر تظهر تلقائياً في الشريط عند إضافتها'
                                    : 'Live auction cars appear automatically in the banner'}
                            </p>
                        </div>
                    </div>
                    {/* مفتاح التبديل (إظهار / إخفاء) */}
                    <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, showLiveAuction: !prev.showLiveAuction }))}
                        title={settings.showLiveAuction ? (isRTL ? 'إخفاء المزاد' : 'Hide Auction') : (isRTL ? 'إظهار المزاد' : 'Show Auction')}
                        className="flex items-center gap-2 transition-all"
                    >
                        {settings.showLiveAuction ? (
                            <ToggleRight className="w-12 h-12 text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                        ) : (
                            <ToggleLeft className="w-12 h-12 text-white/20" />
                        )}
                    </button>
                </div>

                {/* حالة المزاد */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    settings.showLiveAuction
                        ? 'bg-[#00f0ff]/5 border-[#00f0ff]/20'
                        : 'bg-white/2 border-white/5'
                }`}>
                    {settings.showLiveAuction ? (
                        <Eye className="w-4 h-4 text-[#00f0ff] flex-shrink-0" />
                    ) : (
                        <EyeOff className="w-4 h-4 text-white/20 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${
                        settings.showLiveAuction ? 'text-[#00f0ff]' : 'text-white/20'
                    }`}>
                        {settings.showLiveAuction
                            ? (isRTL ? '● يظهر في الشريط الإعلاني' : '● Visible in the banner')
                            : (isRTL ? '○ مخفي من الشريط الإعلاني' : '○ Hidden from the banner')}
                    </span>
                </div>
            </div>

            {/* ── الخيار الثاني: معرض السيارات ── */}
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        settings.showroomSource !== 'none'
                            ? 'bg-accent-gold/10 border border-accent-gold/30'
                            : 'bg-white/5 border border-white/10'
                    }`}>
                        <Car className={`w-6 h-6 ${settings.showroomSource !== 'none' ? 'text-accent-gold' : 'text-white/30'}`} />
                    </div>
                    <div>
                        <h3 className="text-base font-black uppercase tracking-wider text-white">
                            {isRTL ? 'معرض السيارات' : 'Car Showroom'}
                        </h3>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            {isRTL
                                ? 'اختر المعرض الذي تريد عرض سياراته في الشريط الإعلاني'
                                : 'Choose which showroom to display cars from in the banner'}
                        </p>
                    </div>
                </div>

                {/* خيارات المصدر - شبكة 2×2 */}
                <div className="grid grid-cols-2 gap-3">
                    {showroomOptions.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = settings.showroomSource === opt.value;
                        return (
                            <motion.button
                                key={opt.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSettings(prev => ({ ...prev, showroomSource: opt.value }))}
                                className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                                    isSelected
                                        ? `${opt.color} bg-white/5 shadow-lg`
                                        : 'border-white/5 text-white/20 hover:border-white/15 hover:text-white/40'
                                }`}
                            >
                                {/* علامة الاختيار */}
                                {isSelected && (
                                    <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                                <Icon className="w-8 h-8" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-center leading-tight">
                                    {isRTL ? opt.labelAr : opt.labelEn}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* معاينة المصدر المختار */}
                {settings.showroomSource !== 'none' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-2xl bg-accent-gold/5 border border-accent-gold/20"
                    >
                        <p className="text-[11px] text-accent-gold font-bold">
                            ✅ {isRTL
                                ? `سيتم عرض سيارات ${showroomOptions.find(o => o.value === settings.showroomSource)?.labelAr} في الشريط الإعلاني`
                                : `Cars from ${showroomOptions.find(o => o.value === settings.showroomSource)?.labelEn} will appear in the banner`}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* ── إعدادات الشعار الإعلاني (اختياري) ── */}
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-white/30" />
                    {isRTL ? 'شعار الشريط الإعلاني' : 'Banner Label'}
                    <span className="text-[10px] text-white/20 font-normal normal-case">({isRTL ? 'اختياري' : 'optional'})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* الشعار بالعربي */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? 'النص العربي' : 'Arabic Text'}
                        </label>
                        <input
                            type="text"
                            value={settings.bannerLabel}
                            onChange={e => setSettings(prev => ({ ...prev, bannerLabel: e.target.value }))}
                            placeholder={isRTL ? '⚡ العروض الحصرية' : '⚡ العروض الحصرية'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-accent-gold/40 text-white placeholder:text-white/20"
                            dir="rtl"
                        />
                    </div>
                    {/* الشعار بالإنجليزي */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? 'النص الإنجليزي' : 'English Text'}
                        </label>
                        <input
                            type="text"
                            value={settings.bannerLabelEn}
                            onChange={e => setSettings(prev => ({ ...prev, bannerLabelEn: e.target.value }))}
                            placeholder="⚡ EXCLUSIVE DEALS"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-accent-gold/40 text-white placeholder:text-white/20"
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            {/* ── رسائل النجاح والخطأ ── */}
            {savedOk && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-sm font-bold"
                >
                    ✅ {isRTL ? 'تم حفظ إعدادات الإعلانات بنجاح' : 'Advertising settings saved successfully'}
                </motion.div>
            )}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center text-sm font-bold"
                >
                    ❌ {error}
                </motion.div>
            )}

            {/* ── زر الحفظ ── */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full py-5 font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition-all bg-accent-gold text-black shadow-[0_0_30px_rgba(201,169,110,0.3)] hover:shadow-[0_0_50px_rgba(201,169,110,0.5)] disabled:opacity-50"
            >
                {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Save className="w-5 h-5" />
                )}
                {saving
                    ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                    : (isRTL ? 'حفظ إعدادات الإعلانات' : 'Save Ad Settings')}
            </motion.button>
        </motion.div>
    );
}
