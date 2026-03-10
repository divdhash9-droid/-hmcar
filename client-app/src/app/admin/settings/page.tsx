'use client';

/**
 * صفحة الإعدادات - لوحة تحكم HM CAR
 * ──────────────────────────────────────
 * هذه الصفحة مقسمة إلى 8 تبويبات:
 * 1. profile   - الملف الشخصي وكلمة المرور
 * 2. site      - هوية الموقع (الشعار والوصف)
 * 3. home      - محتوى الصفحة الرئيسية (Hero)
 * 4. social    - روابط التواصل الاجتماعي
 * 5. contact   - معلومات الاتصال
 * 6. currency  - إعدادات أسعار الصرف
 * 7. features  - قسم "لماذا تختارنا"
 *
 * المكونات المستخدمة (مجلد _components/):
 * - ProfileTab : تبويب الملف الشخصي
 * - SettingsTabs: باقي التبويبات (Social, Contact, Currency, Site, Home, Features)
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Globe, Phone, DollarSign, Camera, LayoutDashboard, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';

// ── المكونات المقسمة ──
import ProfileTab from './_components/ProfileTab';
import { SocialTab, ContactTab, CurrencyTab, SiteTab, HomeTab, FeaturesTab, ShowroomTab } from './_components/SettingsTabs';

// ── أنواع التبويبات ──
type TabID = 'profile' | 'security' | 'social' | 'contact' | 'currency' | 'site' | 'home' | 'features' | 'showroom';

// ── أنواع البيانات ──
interface SocialLinks { whatsapp: string; instagram: string; twitter: string; facebook: string; youtube: string; tiktok: string; snapchat: string; telegram: string; linkedin: string; }
interface ContactInfo { phone: string; email: string; address: string; workingHours: string; }
interface CurrencySettings { usdToSar: number; usdToKrw: number; activeCurrency: string; }
interface SiteInfo { siteName: string; siteDescription: string; logoUrl: string; faviconUrl: string; }
interface HomeContent { heroTitle: string; heroSubtitle: string; heroVideoUrl: string; }
interface Feature { icon: string; title: string; desc: string;[key: string]: string; }

export default function AdminSettings() {
    const { isRTL } = useLanguage();
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabID>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ── بيانات الملف الشخصي ──
    const [profileData, setProfileData] = useState({
        name: '', username: '', email: '', phone: '',
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    // ── بيانات التبويبات الأخرى ──
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({ whatsapp: '', instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', snapchat: '', telegram: '', linkedin: '' });
    const [contactInfo, setContactInfo] = useState<ContactInfo>({ phone: '', email: '', address: '', workingHours: '' });
    const [currencySettings, setCurrencySettings] = useState<CurrencySettings>({ usdToSar: 3.75, usdToKrw: 1300, activeCurrency: 'SAR' });
    const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: 'HM CAR', siteDescription: '', logoUrl: '', faviconUrl: '' });
    const [homeContent, setHomeContent] = useState<HomeContent>({ heroTitle: '', heroSubtitle: '', heroVideoUrl: '' });
    const [features, setFeatures] = useState<Feature[]>([]);

    // ── تحميل البيانات عند الفتح ──
    useEffect(() => {
        loadSettings();
        if (user) {
            setProfileData(prev => ({ ...prev, name: user.name || '', username: user.username || '', email: user.email || '', phone: user.phone || '' }));
        }
    }, [user]);

    // ── جلب إعدادات النظام من الـ API ──
    const loadSettings = async () => {
        try {
            const response = await api.settings.getAll();
            if (response.success) {
                setSocialLinks(response.data.socialLinks || {});
                setContactInfo(response.data.contactInfo || {});
                if (response.data.currencySettings) setCurrencySettings(response.data.currencySettings);
                if (response.data.siteInfo) setSiteInfo(response.data.siteInfo);
                if (response.data.homeContent) setHomeContent(response.data.homeContent);
                if (response.data.features) setFeatures(response.data.features);
            }
        } catch (error) { console.error('فشل تحميل الإعدادات:', error); }
    };

    // ── دوال الحفظ لكل قسم ──

    const handleSaveProfile = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            const response = await api.users.updateProfile({ name: profileData.name, username: profileData.username, email: profileData.email, phone: profileData.phone });
            if (response.success && response.data) {
                const currentUserStr = localStorage.getItem('hm_user');
                if (currentUserStr) {
                    localStorage.setItem('hm_user', JSON.stringify({ ...JSON.parse(currentUserStr), ...response.data }));
                    refreshUser();
                }
            }
            // تغيير كلمة المرور إن وُجدت
            if (profileData.newPassword) {
                if (profileData.newPassword !== profileData.confirmPassword) {
                    setMessage({ type: 'error', text: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
                    setLoading(false); return;
                }
                if (!profileData.currentPassword) {
                    if (!silent) setMessage({ type: 'error', text: isRTL ? 'يجب إدخال كلمة المرور الحالية' : 'Current password required' });
                    setLoading(false); return;
                }
                await api.auth.changePassword({ currentPassword: profileData.currentPassword, newPassword: profileData.newPassword });
                setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            }
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ البيانات بنجاح' : 'Profile saved successfully' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving profile' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveSocialLinks = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.settings.updateSocialLinks({ socialLinks: socialLinks as any });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ روابط التواصل' : 'Social links saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveContactInfo = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.settings.updateContactInfo({ contactInfo: contactInfo as any });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ معلومات الاتصال' : 'Contact info saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveCurrencySettings = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.settings.updateCurrencySettings({ currencySettings: currencySettings as any });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ إعدادات العملة' : 'Currency settings saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveSiteInfo = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.settings.updateSiteInfo({ siteInfo: siteInfo as any });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ معلومات الموقع' : 'Site info saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveHomeContent = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.settings.updateHomeContent({ homeContent: homeContent as any });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ محتوى الصفحة الرئيسية' : 'Home content saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    const handleSaveFeatures = async (silent = false) => {
        if (!silent) { setLoading(true); setMessage({ type: '', text: '' }); }
        try {
            await api.settings.updateFeatures({ features });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ مميزات الموقع' : 'Features saved' });
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: (error as Error).message || 'Error saving' });
        } finally { if (!silent) setLoading(false); }
    };

    // ── رفع الشعار ──
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.upload.image(formData);
            if (res.success) {
                setSiteInfo(prev => ({ ...prev, logoUrl: res.url }));
                setMessage({ type: 'success', text: isRTL ? 'تم رفع الشعار بنجاح' : 'Logo uploaded successfully' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: (error as Error).message || 'Upload failed' });
        } finally { setLoading(false); }
    };

    // ── قائمة التبويبات ──
    const tabs = [
        { id: 'profile', label: isRTL ? 'الملف الشخصي' : 'Profile', icon: User },
        { id: 'site', label: isRTL ? 'هوية الموقع' : 'Site Identity', icon: Camera },
        { id: 'home', label: isRTL ? 'الصفحة الرئيسية' : 'Home Content', icon: LayoutDashboard },
        { id: 'social', label: isRTL ? 'التواصل الاجتماعي' : 'Social Links', icon: Globe },
        { id: 'contact', label: isRTL ? 'معلومات الاتصال' : 'Contact Info', icon: Phone },
        { id: 'currency', label: isRTL ? 'إعدادات العملة' : 'Currency', icon: DollarSign },
        { id: 'features', label: isRTL ? 'لماذا تختارنا' : 'Features', icon: Shield },
        { id: 'showroom', label: isRTL ? 'المعرض الكوري' : 'Korean Showroom', icon: Globe },
    ];

    return (
        <div className={cn('min-h-screen bg-black text-white', isRTL && 'rtl')}>
            {/* الخلفية */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cinematic-neon-red/10 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-5xl mx-auto">

                    {/* ─── رأس الصفحة ─── */}
                    <div className="flex items-center gap-6 mb-12">
                        <Link href="/admin/dashboard"
                            className="inline-flex items-center gap-2 text-white/40 hover:text-cinematic-neon-red transition-colors group">
                            <ArrowLeft className={cn('w-5 h-5 transition-transform group-hover:-translate-x-1', isRTL && 'rotate-180 group-hover:translate-x-1')} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-[2px] w-8 bg-cinematic-neon-red shadow-[0_0_10px_rgba(255,0,60,1)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-cinematic-neon-red">{isRTL ? 'لوحة التحكم' : 'Admin Panel'}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                                {isRTL ? 'الإعدادات' : 'SETTINGS'}
                            </h1>
                        </div>
                    </div>

                    {/* رسالة النجاح / الخطأ */}
                    {message.text && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className={cn('mb-8 p-4 rounded-xl border text-center',
                                message.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-cinematic-neon-red/10 border-cinematic-neon-red/30 text-cinematic-neon-red')}>
                            <span className="text-sm font-bold">{message.text}</span>
                        </motion.div>
                    )}

                    {/* ─── شريط التبويبات ─── */}
                    <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white/5 rounded-2xl border border-white/5">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabID)}
                                    className={cn(
                                        'flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all',
                                        activeTab === tab.id
                                            ? 'bg-cinematic-neon-red text-white shadow-lg'
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                    )}>
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ─── محتوى التبويب المحدد ─── */}

                    {activeTab === 'profile' && (
                        <ProfileTab
                            profileData={profileData}
                            loading={loading}
                            isRTL={isRTL}
                            onProfileChange={setProfileData}
                            onSave={handleSaveProfile}
                            onSilentSave={() => handleSaveProfile(true)}
                        />
                    )}

                    {activeTab === 'social' && (
                        <SocialTab
                            socialLinks={socialLinks}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveSocialLinks}
                            onLinkChange={setSocialLinks}
                            setMessage={setMessage}
                        />
                    )}

                    {activeTab === 'contact' && (
                        <ContactTab
                            contactInfo={contactInfo}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveContactInfo}
                            onSilentSave={() => handleSaveContactInfo(true)}
                            onContactChange={setContactInfo}
                        />
                    )}

                    {activeTab === 'currency' && (
                        <CurrencyTab
                            currencySettings={currencySettings}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveCurrencySettings}
                            onSilentSave={() => handleSaveCurrencySettings(true)}
                            onCurrencyChange={setCurrencySettings}
                        />
                    )}

                    {activeTab === 'site' && (
                        <SiteTab
                            siteInfo={siteInfo}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveSiteInfo}
                            onSilentSave={() => handleSaveSiteInfo(true)}
                            onSiteChange={setSiteInfo}
                            onLogoUpload={handleLogoUpload}
                        />
                    )}

                    {activeTab === 'home' && (
                        <HomeTab
                            homeContent={homeContent}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveHomeContent}
                            onSilentSave={() => handleSaveHomeContent(true)}
                            onHomeChange={setHomeContent}
                        />
                    )}

                    {activeTab === 'features' && (
                        <FeaturesTab
                            features={features}
                            loading={loading}
                            isRTL={isRTL}
                            onSave={handleSaveFeatures}
                            onFeaturesChange={setFeatures}
                        />
                    )}

                    {/* ─── تبويب المعرض الكوري ─── */}
                    {activeTab === 'showroom' && (
                        <ShowroomTab isRTL={isRTL} />
                    )}

                </div>
            </div>
        </div>
    );
}
