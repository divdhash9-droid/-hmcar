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
    Megaphone, Radio, Car, Check, EyeOff,
    Save, Loader2, Globe, Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
            <div className="group p-8 bg-linear-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[2.5rem] space-y-6 hover:border-white/10 transition-all duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        {/* أيقونة المزاد المباشر */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            settings.showLiveAuction
                                ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                                : 'bg-white/5 border border-white/10'
                        }`}>
                            <Radio className={`w-7 h-7 ${settings.showLiveAuction ? 'text-[#00f0ff] animate-pulse' : 'text-white/20'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-wider text-white">
                                {isRTL ? 'المزاد المباشر' : 'Live Auction'}
                            </h3>
                            <p className="text-[11px] text-white/40 mt-1 max-w-xs leading-relaxed">
                                {isRTL
                                    ? 'تفعيل هذا الخيار سيقوم بإظهار جميع سيارات المزاد الجارية حالياً في الشريط المتحرك تلقائياً'
                                    : 'Enabling this will auto-display all active live auction cars in the homepage banner'}
                            </p>
                        </div>
                    </div>
                    {/* مفتاح التبديل (إظهار / إخفاء) */}
                    <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, showLiveAuction: !prev.showLiveAuction }))}
                        title={settings.showLiveAuction ? (isRTL ? 'إيقاف المزاد' : 'Disable Auction') : (isRTL ? 'تفعيل المزاد' : 'Enable Auction')}
                        className="relative w-16 h-8 rounded-full bg-white/5 border border-white/10 transition-all"
                    >
                        <motion.div
                            animate={{ x: settings.showLiveAuction ? (isRTL ? -32 : 32) : 0 }}
                            className={cn(
                                "absolute top-1 w-6 h-6 rounded-full transition-colors",
                                isRTL ? "right-1" : "left-1",
                                settings.showLiveAuction ? "bg-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.8)]" : "bg-white/20"
                            )}
                        />
                    </button>
                </div>

                {/* حالة المزاد */}
                <div className={`flex items-center gap-3 p-5 rounded-2xl border transition-all duration-700 ${
                    settings.showLiveAuction
                        ? 'bg-[#00f0ff]/5 border-[#00f0ff]/10'
                        : 'bg-white/[0.01] border-white/5'
                }`}>
                    <div className={cn("w-2 h-2 rounded-full", settings.showLiveAuction ? "bg-[#00f0ff] animate-ping" : "bg-white/10")} />
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                        settings.showLiveAuction ? 'text-[#00f0ff]' : 'text-white/20'
                    }`}>
                        {settings.showLiveAuction
                            ? (isRTL ? 'النظام يراقب المزادات النشطة ويعرضها' : 'SYSTEM MONITORING ACTIVE AUCTIONS')
                            : (isRTL ? 'إخفاء تام لنتائج المزادات من الشريط' : 'AUCTION RESULTS FULLY HIDDEN')}
                    </span>
                </div>
            </div>

            {/* ── الخيار الثاني: معرض السيارات ── */}
            <div className="p-8 bg-linear-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[2.5rem] space-y-8 hover:border-white/10 transition-all duration-500">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        settings.showroomSource !== 'none'
                            ? 'bg-accent-gold/10 border border-accent-gold/30 shadow-[0_0_20px_rgba(201,169,110,0.1)]'
                            : 'bg-white/5 border border-white/10'
                    }`}>
                        <Car className={`w-7 h-7 ${settings.showroomSource !== 'none' ? 'text-accent-gold' : 'text-white/20'}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wider text-white">
                            {isRTL ? 'معرض السيارات' : 'Car Showroom'}
                        </h3>
                        <p className="text-[11px] text-white/40 mt-1">
                            {isRTL
                                ? 'تحكم في مصادر السيارات التي تظهر كإعلانات ثابتة'
                                : 'Control the car sources for static ad displays'}
                        </p>
                    </div>
                </div>

                {/* خيارات المصدر - شبكة 2×2 */}
                <div className="grid grid-cols-2 gap-4">
                    {showroomOptions.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = settings.showroomSource === opt.value;
                        return (
                            <motion.button
                                key={opt.value}
                                type="button"
                                whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSettings(prev => ({ ...prev, showroomSource: opt.value }))}
                                className={cn(
                                    "relative flex flex-col items-start gap-4 p-6 rounded-[2rem] border-2 transition-all duration-300",
                                    isSelected
                                        ? `${opt.color} bg-white/[0.03] shadow-2xl`
                                        : 'border-white/5 text-white/20 hover:border-white/10'
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                                    isSelected ? "bg-current/10 border-current/20" : "bg-white/5 border-white/10"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                
                                <div className="text-right">
                                    <span className="text-xs font-black uppercase tracking-widest block mb-1">
                                        {isRTL ? opt.labelAr : opt.labelEn}
                                    </span>
                                    {isSelected && (
                                        <motion.div layoutId="srcCheck" className="flex items-center gap-1.5 text-[9px] font-bold opacity-60">
                                            <Check className="w-3 h-3" />
                                            {isRTL ? 'مفعل حالياً' : 'ACTIVE'}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* معاينة المصدر المختار */}
                {settings.showroomSource !== 'none' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3"
                    >
                        <Zap className="w-4 h-4 text-orange-400" />
                        <p className="text-[11px] text-orange-400 font-black tracking-wide">
                            {isRTL
                                ? `جاهز للعرض: سيتم سحب أحدث سيارات ${showroomOptions.find(o => o.value === settings.showroomSource)?.labelAr} تلقائياً`
                                : `READY: Auto-fetching latest cars from ${showroomOptions.find(o => o.value === settings.showroomSource)?.labelEn}`}
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
            <div className="flex items-center justify-center pt-8 border-t border-white/5">
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative min-w-[280px] px-10 py-4 font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] disabled:opacity-50 overflow-hidden"
                >
                    {/* تأثير لمعان خلفي */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    
                    <span className="relative z-10 text-sm">
                        {saving
                            ? (isRTL ? 'جاري التثبيت...' : 'Applying...')
                            : (isRTL ? 'حفظ التغييرات الآن' : 'Save Changes Now')}
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
