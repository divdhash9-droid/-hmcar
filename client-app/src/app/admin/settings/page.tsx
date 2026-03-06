'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    Phone,
    Lock,
    Shield,
    Globe,
    MessageCircle,
    Instagram,
    Youtube,
    Facebook,
    Camera,
    Send,
    Linkedin,
    DollarSign,
    LayoutDashboard,
    MapPin,
    Clock,
    Eye,
    EyeOff
} from 'lucide-react';
import Link from "next/link";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

type TabID = 'profile' | 'security' | 'social' | 'contact' | 'currency' | 'site' | 'home' | 'features';

export default function AdminSettings() {
    const { isRTL } = useLanguage();
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabID>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    // Profile data
    const [profileData, setProfileData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Social links
    const [socialLinks, setSocialLinks] = useState({
        whatsapp: '',
        instagram: '',
        twitter: '',
        facebook: '',
        youtube: '',
        tiktok: '',
        snapchat: '',
        telegram: '',
        linkedin: ''
    });

    // Contact info
    const [contactInfo, setContactInfo] = useState({
        phone: '',
        email: '',
        address: '',
        workingHours: ''
    });

    // Currency settings
    const [currencySettings, setCurrencySettings] = useState({
        usdToSar: 3.75,
        usdToKrw: 1300,
        activeCurrency: 'SAR'
    });

    // Site info
    const [siteInfo, setSiteInfo] = useState({
        siteName: 'HM CAR',
        siteDescription: '',
        logoUrl: '',
        faviconUrl: ''
    });

    const [homeContent, setHomeContent] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroVideoUrl: '',
    });

    interface Feature { icon: string; title: string; description: string; }
    const [features, setFeatures] = useState<Feature[]>([]);

    useEffect(() => {
        loadSettings();
        if (user) {
            setProfileData(prev => ({
                ...prev,
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const response = await api.settings.getAll();
            if (response.success) {
                setSocialLinks(response.data.socialLinks || {});
                setContactInfo(response.data.contactInfo || {});
                if (response.data.currencySettings) {
                    setCurrencySettings(response.data.currencySettings);
                }
                if (response.data.siteInfo) {
                    setSiteInfo(response.data.siteInfo);
                }
                if (response.data.features) {
                    setFeatures(response.data.features);
                }
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const handleSaveProfile = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }

        try {
            // 1. Update Profile (Name, Email, Phone, Username)
            const response = await api.users.updateProfile({
                name: profileData.name,
                username: profileData.username,
                email: profileData.email,
                phone: profileData.phone
            });

            if (response.success && response.data) {
                // Update local storage with new user data
                const currentUserStr = localStorage.getItem('hm_user');
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    const updatedUser = { ...currentUser, ...response.data };
                    localStorage.setItem('hm_user', JSON.stringify(updatedUser));
                    // Trigger state update in AuthContext
                    refreshUser();
                }
            }


            // 2. Update Password if provided
            if (profileData.newPassword) {
                if (profileData.newPassword !== profileData.confirmPassword) {
                    setMessage({ type: 'error', text: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
                    setLoading(false);
                    return;
                }
                if (!profileData.currentPassword) {
                    if (!silent) {
                        setMessage({ type: 'error', text: isRTL ? 'يجب إدخال كلمة المرور الحالية' : 'Current password required' });
                        setLoading(false);
                    }
                    return;
                }

                await api.auth.changePassword({
                    currentPassword: profileData.currentPassword,
                    newPassword: profileData.newPassword
                });

                // Clear password fields after success
                setProfileData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            }

            if (!silent) {
                setMessage({ type: 'success', text: isRTL ? 'تم حفظ البيانات بنجاح' : 'Profile saved successfully' });
            }
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving profile' });
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleSaveSocialLinks = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateSocialLinks({ socialLinks });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ روابط التواصل' : 'Social links saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveContactInfo = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateContactInfo({ contactInfo });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ معلومات الاتصال' : 'Contact info saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveCurrencySettings = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateCurrencySettings({ currencySettings });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ إعدادات العملة' : 'Currency settings saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveSiteInfo = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateSiteInfo({ siteInfo });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ معلومات الموقع' : 'Site info saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveHomeContent = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateHomeContent({ homeContent });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ محتوى الصفحة الرئيسية' : 'Home content saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveFeatures = async (silent = false) => {
        if (!silent) {
            setLoading(true);
            setMessage({ type: '', text: '' });
        }
        try {
            await api.settings.updateFeatures({ features });
            if (!silent) setMessage({ type: 'success', text: isRTL ? 'تم حفظ مميزات الموقع' : 'Features saved' });
        } catch (error) {
            if (!silent) {
                const err = error as Error;
                setMessage({ type: 'error', text: err.message || 'Error saving' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

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
            const err = error as Error;
            setMessage({ type: 'error', text: err.message || 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: isRTL ? 'الملف الشخصي' : 'Profile', icon: User },
        { id: 'site', label: isRTL ? 'هوية الموقع' : 'Site Identity', icon: Camera },
        { id: 'home', label: isRTL ? 'محتوى الصفحة الرئيسية' : 'Home Content', icon: LayoutDashboard },
        { id: 'social', label: isRTL ? 'التواصل الاجتماعي' : 'Social Links', icon: Globe },
        { id: 'contact', label: isRTL ? 'معلومات الاتصال' : 'Contact Info', icon: Phone },
        { id: 'currency', label: isRTL ? 'إعدادات العملة' : 'Currency', icon: DollarSign },
        { id: 'features', label: isRTL ? 'لماذا تختارنا' : 'Features', icon: Shield }
    ];

    const socialFields = [
        { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+966XXXXXXXXX', color: 'text-green-500' },
        { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...', color: 'text-pink-500' },
        { key: 'twitter', label: 'X (Twitter)', icon: Globe, placeholder: 'https://x.com/...', color: 'text-white' },
        { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...', color: 'text-blue-500' },
        { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...', color: 'text-red-500' },
        { key: 'tiktok', label: 'TikTok', icon: Camera, placeholder: 'https://tiktok.com/@...', color: 'text-white' },
        { key: 'snapchat', label: 'Snapchat', icon: Camera, placeholder: 'snapchat_username', color: 'text-yellow-400' },
        { key: 'telegram', label: 'Telegram', icon: Send, placeholder: 'https://t.me/...', color: 'text-blue-400' },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/...', color: 'text-blue-600' }
    ];

    return (
        <div className={cn("min-h-screen bg-black text-white", isRTL && "rtl")}>
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cinematic-neon-red/10 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 p-8">
                {/* Header with Back Button */}
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-6 mb-12">
                        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-cinematic-neon-red transition-colors group">
                            <ArrowLeft className={cn("w-5 h-5 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-[2px] w-8 bg-cinematic-neon-red shadow-[0_0_10px_rgba(255,0,60,1)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-cinematic-neon-red">
                                    {isRTL ? 'لوحة التحكم' : 'Admin Panel'}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                                {isRTL ? 'الإعدادات' : 'SETTINGS'}
                            </h1>
                        </div>
                    </div>

                    {/* Message */}
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "mb-8 p-4 rounded-xl border text-center",
                                message.type === 'success'
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-cinematic-neon-red/10 border-cinematic-neon-red/30 text-cinematic-neon-red"
                            )}
                        >
                            <span className="text-sm font-bold">{message.text}</span>
                        </motion.div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 p-2 bg-white/5 rounded-2xl border border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabID)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                                    activeTab === tab.id
                                        ? "bg-cinematic-neon-red text-white shadow-lg"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-8">
                                {/* Profile Card */}
                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                        <User className="w-5 h-5 text-cinematic-neon-red" />
                                        {isRTL ? 'البيانات الشخصية' : 'Personal Information'}
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'الاسم' : 'Name'}
                                            </label>
                                            <div className="relative">
                                                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="full-name"
                                                    autoComplete="name"
                                                    title={isRTL ? 'الاسم' : 'Name'}
                                                    type="text"
                                                    placeholder={isRTL ? 'الاسم' : 'Name'}
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    onBlur={() => handleSaveProfile(true)}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                            </label>
                                            <div className="relative">
                                                <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="email"
                                                    autoComplete="email"
                                                    title={isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                    type="email"
                                                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    onBlur={() => handleSaveProfile(true)}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'اسم المستخدم' : 'Username'}
                                            </label>
                                            <div className="relative">
                                                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="username"
                                                    autoComplete="username"
                                                    title={isRTL ? 'اسم المستخدم' : 'Username'}
                                                    type="text"
                                                    placeholder={isRTL ? 'اسم المستخدم' : 'Username'}
                                                    value={profileData.username}
                                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                                    onBlur={() => handleSaveProfile(true)}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'الهاتف' : 'Phone'}
                                            </label>
                                            <div className="relative">
                                                <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="phone"
                                                    autoComplete="tel"
                                                    title={isRTL ? 'الهاتف' : 'Phone'}
                                                    type="tel"
                                                    placeholder={isRTL ? 'الهاتف' : 'Phone'}
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    onBlur={() => handleSaveProfile(true)}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Card */}
                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-cinematic-neon-red" />
                                        {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                                            </label>
                                            <div className="relative">
                                                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="current-password"
                                                    autoComplete="current-password"
                                                    title={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                                                    type={showPass.current ? "text" : "password"}
                                                    placeholder={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                                                    value={profileData.currentPassword}
                                                    onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-12" : "pl-12 pr-12")}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                                                    className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors", isRTL ? "left-4" : "right-4")}
                                                >
                                                    {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                            </label>
                                            <div className="relative">
                                                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="new-password"
                                                    autoComplete="new-password"
                                                    title={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                                    type={showPass.new ? "text" : "password"}
                                                    placeholder={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                                    value={profileData.newPassword}
                                                    onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-12" : "pl-12 pr-12")}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                                                    className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors", isRTL ? "left-4" : "right-4")}
                                                >
                                                    {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                            </label>
                                            <div className="relative">
                                                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    name="confirm-password"
                                                    autoComplete="new-password"
                                                    title={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                                    type={showPass.confirm ? "text" : "password"}
                                                    placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                                    value={profileData.confirmPassword}
                                                    onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40", isRTL ? "pr-12 pl-12" : "pl-12 pr-12")}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                                                    className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors", isRTL ? "left-4" : "right-4")}
                                                >
                                                    {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)] transition-all flex items-center justify-center gap-3"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ البيانات' : 'Save Profile')}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* Social Links Tab */}
                    {activeTab === 'social' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <h2 className="text-lg font-black uppercase tracking-wider mb-2 flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-cinematic-neon-red" />
                                    {isRTL ? 'روابط التواصل الاجتماعي' : 'Social Media Links'}
                                </h2>
                                <p className="text-xs text-white/40 mb-8">
                                    {isRTL
                                        ? '✅ الروابط التي تضيفها فقط ستظهر في الصفحة الرئيسية — الروابط الفارغة لا تظهر أبداً'
                                        : '✅ Only links you add will appear on the homepage — empty links are hidden'}
                                </p>

                                {/* قائمة الروابط - كل رابط له عدل + حذف */}
                                <div className="space-y-3">
                                    {socialFields.map((field) => {
                                        const currentVal = (socialLinks as Record<string, string>)[field.key] || '';
                                        const hasValue = currentVal.trim() !== '';

                                        return (
                                            <div
                                                key={field.key}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${hasValue
                                                        ? 'bg-white/[0.04] border-white/15'
                                                        : 'bg-white/[0.01] border-white/5 opacity-60'
                                                    }`}
                                            >
                                                {/* أيقونة المنصة */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasValue ? 'bg-white/10' : 'bg-white/5'
                                                    }`}>
                                                    <field.icon className={`w-5 h-5 ${field.color}`} />
                                                </div>

                                                {/* اسم المنصة + الحقل */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                                                        {field.label}
                                                        {hasValue && (
                                                            <span className="mr-2 text-green-400">● موجود</span>
                                                        )}
                                                        {!hasValue && (
                                                            <span className="mr-2 text-white/20">○ فارغ - لن يظهر</span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={currentVal}
                                                        onChange={(e) => setSocialLinks({ ...socialLinks, [field.key]: e.target.value })}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-b border-white/10 pb-1 focus:border-cinematic-neon-red/40 transition-colors"
                                                        dir="ltr"
                                                    />
                                                </div>

                                                {/* أزرار الإجراءات */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {/* زر حفظ هذا الرابط منفرداً */}
                                                    {hasValue && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.settings.updateSocialLinks({ socialLinks });
                                                                    setMessage({ type: 'success', text: isRTL ? `✅ تم حفظ ${field.label}` : `✅ ${field.label} saved` });
                                                                    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                                                                } catch {
                                                                    setMessage({ type: 'error', text: isRTL ? 'فشل الحفظ' : 'Save failed' });
                                                                }
                                                            }}
                                                            title={isRTL ? 'حفظ' : 'Save'}
                                                            className="px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                                        >
                                                            {isRTL ? 'حفظ' : 'Save'}
                                                        </button>
                                                    )}

                                                    {/* زر الحذف - يمسح الرابط ويحفظ في قاعدة البيانات فوراً */}
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            // 1. امسح الرابط من الحالة المحلية
                                                            const updatedLinks = { ...socialLinks, [field.key]: '' };
                                                            setSocialLinks(updatedLinks as typeof socialLinks);

                                                            // 2. احفظ في قاعدة البيانات فوراً
                                                            try {
                                                                await api.settings.updateSocialLinks({ socialLinks: updatedLinks });
                                                                setMessage({ type: 'success', text: isRTL ? `🗑️ تم حذف رابط ${field.label}` : `🗑️ ${field.label} removed` });
                                                                setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                                                            } catch {
                                                                setMessage({ type: 'error', text: isRTL ? 'فشل الحذف' : 'Delete failed' });
                                                            }
                                                        }}
                                                        title={isRTL ? 'حذف الرابط' : 'Delete link'}
                                                        className="px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                                                    >
                                                        {isRTL ? 'حذف' : 'Del'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* زر حفظ الكل */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveSocialLinks()}
                                disabled={loading}
                                className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)] transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ جميع الروابط' : 'Save All Links')}
                            </motion.button>
                        </motion.div>
                    )}


                    {/* Contact Info Tab */}
                    {activeTab === 'contact' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-cinematic-neon-red" />
                                    {isRTL ? 'معلومات الاتصال' : 'Contact Information'}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                                        </label>
                                        <input
                                            type="tel"
                                            value={contactInfo.phone}
                                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                            onBlur={() => handleSaveContactInfo(true)}
                                            placeholder="+966XXXXXXXXX"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                        </label>
                                        <input
                                            type="email"
                                            value={contactInfo.email}
                                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                            onBlur={() => handleSaveContactInfo(true)}
                                            placeholder="info@hmcar.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {isRTL ? 'العنوان' : 'Address'}
                                        </label>
                                        <input
                                            type="text"
                                            value={contactInfo.address}
                                            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                                            onBlur={() => handleSaveContactInfo(true)}
                                            placeholder={isRTL ? "المملكة العربية السعودية، الرياض" : "Riyadh, Saudi Arabia"}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {isRTL ? 'ساعات العمل' : 'Working Hours'}
                                        </label>
                                        <input
                                            type="text"
                                            value={contactInfo.workingHours}
                                            onChange={(e) => setContactInfo({ ...contactInfo, workingHours: e.target.value })}
                                            onBlur={() => handleSaveContactInfo(true)}
                                            placeholder={isRTL ? "السبت - الخميس: 9 صباحاً - 9 مساءً" : "Sat - Thu: 9AM - 9PM"}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveContactInfo()}
                                disabled={loading}
                                className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)] transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ المعلومات' : 'Save Info')}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Currency Settings Tab */}
                    {activeTab === 'currency' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                    <DollarSign className="w-5 h-5 text-cinematic-neon-red" />
                                    {isRTL ? 'إعدادات العملة والصرف' : 'Currency & Exchange Settings'}
                                </h2>
                                <p className="text-sm text-white/40 mb-8">
                                    {isRTL
                                        ? 'قم بتعيين سعر صرف الدولار مقابل الريال السعودي لتحويل الأسعار تلقائياً'
                                        : 'Set the USD to SAR exchange rate for automatic price conversion'}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'سعر صرف الدولار (1 USD = ? SAR)' : 'USD Exchange Rate (1 USD = ? SAR)'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={currencySettings.usdToSar}
                                                onChange={(e) => setCurrencySettings({ ...currencySettings, usdToSar: parseFloat(e.target.value) || 0 })}
                                                onBlur={() => handleSaveCurrencySettings(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'العملة النشطة للعرض' : 'Active Display Currency'}
                                        </label>
                                        <select
                                            title={isRTL ? 'العملة النشطة' : 'Active Currency'}
                                            id="active-currency"
                                            value={currencySettings.activeCurrency}
                                            onChange={(e) => setCurrencySettings({ ...currencySettings, activeCurrency: e.target.value })}
                                            onBlur={() => handleSaveCurrencySettings(true)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40 appearance-none cursor-pointer"
                                        >
                                            <option value="SAR" className="bg-black">SAR (ريال سعودي)</option>
                                            <option value="USD" className="bg-black">USD (دولار أمريكي)</option>
                                            <option value="KRW" className="bg-black">KRW (وون كوري)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'سعر صرف الدولار مقابل الون الكوري (1 USD = ? KRW)' : 'USD to KRW Exchange Rate (1 USD = ? KRW)'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="1"
                                                value={currencySettings.usdToKrw}
                                                onChange={(e) => setCurrencySettings({ ...currencySettings, usdToKrw: parseFloat(e.target.value) || 0 })}
                                                onBlur={() => handleSaveCurrencySettings(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveCurrencySettings()}
                                disabled={loading}
                                className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)] transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ إعدادات العملة' : 'Save Currency Settings')}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Site Identity Tab */}
                    {activeTab === 'site' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                    <Camera className="w-5 h-5 text-cinematic-neon-red" />
                                    {isRTL ? 'هوية الشعار والموقع' : 'Site Identity & logo'}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Logo Upload */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                                            {isRTL ? 'شعار الموقع' : 'Site Logo'}
                                        </label>
                                        <div className="relative group">
                                            <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                                                {siteInfo.logoUrl ? (
                                                    <NextImage
                                                        src={siteInfo.logoUrl}
                                                        alt={isRTL ? "شعار الموقع" : "Site Logo"}
                                                        fill
                                                        className="max-h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <Camera className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                                        <span className="text-[10px] text-white/20 font-bold uppercase">{isRTL ? 'بدون شعار' : 'No Logo'}</span>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                    <input type="file" title={isRTL ? "رفع شعار جديد" : "Upload new logo"} className="hidden" accept="image/*" onChange={(e) => { handleLogoUpload(e); handleSaveSiteInfo(true); }} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'تغيير الشعار' : 'CHANGE LOGO'}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Site Info Fields */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'اسم الموقع' : 'Site Name'}
                                            </label>
                                            <input
                                                title={isRTL ? 'اسم الموقع' : 'Site Name'}
                                                type="text"
                                                value={siteInfo.siteName}
                                                onChange={(e) => setSiteInfo({ ...siteInfo, siteName: e.target.value })}
                                                onBlur={() => handleSaveSiteInfo(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                                {isRTL ? 'وصف الموقع' : 'Site Description'}
                                            </label>
                                            <textarea
                                                title={isRTL ? 'وصف الموقع' : 'Site Description'}
                                                value={siteInfo.siteDescription}
                                                onChange={(e) => setSiteInfo({ ...siteInfo, siteDescription: e.target.value })}
                                                onBlur={() => handleSaveSiteInfo(true)}
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveSiteInfo()}
                                disabled={loading}
                                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50"
                            >
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ هوية الموقع' : 'SAVE SITE IDENTITY')}
                            </motion.button>
                        </motion.div>
                    )}
                    {/* Home Content Tab */}
                    {activeTab === 'home' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                                    <LayoutDashboard className="w-5 h-5 text-cinematic-neon-red" />
                                    {isRTL ? 'محتوى الصفحة الرئيسية' : 'Home Page Content'}
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'عنوان البطولة (Hero Title)' : 'Hero Title'}
                                        </label>
                                        <input
                                            title={isRTL ? 'عنوان البطولة' : 'Hero Title'}
                                            type="text"
                                            value={homeContent.heroTitle}
                                            onChange={(e) => setHomeContent({ ...homeContent, heroTitle: e.target.value })}
                                            onBlur={() => handleSaveHomeContent(true)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            placeholder={isRTL ? 'أدخل العنوان الرئيسي...' : 'Enter main title...'}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'العنوان الفرعي' : 'Hero Subtitle'}
                                        </label>
                                        <input
                                            title={isRTL ? 'العنوان الفرعي' : 'Hero Subtitle'}
                                            type="text"
                                            value={homeContent.heroSubtitle}
                                            onChange={(e) => setHomeContent({ ...homeContent, heroSubtitle: e.target.value })}
                                            onBlur={() => handleSaveHomeContent(true)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            placeholder={isRTL ? 'أدخل العنوان الفرعي...' : 'Enter subtitle...'}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                                            {isRTL ? 'رابط الفيديو (Hero Video URL)' : 'Hero Video URL'}
                                        </label>
                                        <input
                                            title={isRTL ? 'رابط الفيديو' : 'Hero Video URL'}
                                            type="text"
                                            value={homeContent.heroVideoUrl}
                                            onChange={(e) => setHomeContent({ ...homeContent, heroVideoUrl: e.target.value })}
                                            onBlur={() => handleSaveHomeContent(true)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40"
                                            placeholder="/videos/hero.mp4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveHomeContent()}
                                disabled={loading}
                                className="w-full bg-cinematic-neon-red text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,10,60,0.2)] hover:shadow-[0_0_40px_rgba(255,10,60,0.4)] transition-all disabled:opacity-50"
                            >
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ محتوى الصفحة' : 'SAVE HOME CONTENT')}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-cinematic-neon-red" />
                                        {isRTL ? 'لماذا تختارنا' : 'Why Choose Us'}
                                    </h2>
                                    <button
                                        onClick={() => setFeatures([...features, { icon: 'Star', title: '', description: '' }])}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {isRTL ? '+ إضافة ميزة' : '+ ADD FEATURE'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {features.map((feature, idx) => (
                                        <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl relative group">
                                            <button
                                                onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                                                className="absolute top-4 right-4 text-white/20 hover:text-cinematic-neon-red transition-colors"
                                            >
                                                ✕
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">Icon Name (Lucide)</label>
                                                    <input
                                                        type="text"
                                                        value={feature.icon}
                                                        onChange={(e) => {
                                                            const newFeatures = [...features];
                                                            newFeatures[idx].icon = e.target.value;
                                                            setFeatures(newFeatures);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white"
                                                        placeholder="e.g. Shield, Star, Zap"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">Title</label>
                                                    <input
                                                        type="text"
                                                        value={feature.title}
                                                        onChange={(e) => {
                                                            const newFeatures = [...features];
                                                            newFeatures[idx].title = e.target.value;
                                                            setFeatures(newFeatures);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white"
                                                        placeholder="Feature Title"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">Description</label>
                                                    <input
                                                        type="text"
                                                        value={feature.description}
                                                        onChange={(e) => {
                                                            const newFeatures = [...features];
                                                            newFeatures[idx].description = e.target.value;
                                                            setFeatures(newFeatures);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white font-arabic"
                                                        placeholder="Feature Description"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSaveFeatures()}
                                disabled={loading}
                                className="w-full bg-cinematic-neon-red text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,10,60,0.2)] hover:shadow-[0_0_40px_rgba(255,10,60,0.4)] transition-all disabled:opacity-50"
                            >
                                {loading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ المميزات' : 'SAVE FEATURES')}
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
