'use client';

/**
 * نوافذ إدارة المستخدمين - UserModals
 * ────────────────────────────────────
 * يحتوي على نافذتين منبثقتين:
 * 1. AddUserModal   - إضافة مسؤول/مدير/عميل جديد
 * 2. UserDetailModal - عرض وتعديل تفاصيل مستخدم موجود
 *
 * ✅ تم إصلاح:
 * - معالجة _id من الـ backend بشكل صحيح
 * - عرض رسائل الخطأ التفصيلية
 * - التحقق من صحة البيانات قبل الإرسال
 * - دعم تغيير كلمة المرور عند التعديل
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, X, Eye, EyeOff, ChevronDown, Shield,
    Trash2, Save, AlertCircle, CheckCircle2, User, Mail, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import PermissionsGrid from './PermissionsGrid';

// ─────────────────────────────────
// أنواع البيانات
// ─────────────────────────────────
interface Device {
    deviceId: string; browser: string; os: string;
    ip: string; lastUsedAt: string; isActive: boolean;
}

export interface User {
    id: string; name: string; email?: string; username?: string; phone?: string;
    role: string; isActive: boolean; createdAt: string; lastLoginAt?: string;
    boundDevices?: Device[]; isDeviceLocked?: boolean; permissions?: string[];
}

// ─────────────────────────────────
// مكوّن مساعد: حقل إدخال مع أيقونة
// ─────────────────────────────────
function InputField({ label, type = 'text', value, onChange, placeholder, icon: Icon, required = false, hint }: {
    label: string; type?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; icon?: React.ComponentType<{ className?: string }>; required?: boolean; hint?: string;
}) {
    return (
        <div>
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />}
                <input
                    type={type} value={value} onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm',
                        'placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all',
                        Icon && 'pr-9'
                    )}
                />
            </div>
            {hint && <p className="text-[9px] text-white/25 mt-1">{hint}</p>}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// نافذة إضافة مستخدم جديد (مسؤول / مدير / عميل)
// ═══════════════════════════════════════════════════════
export function AddUserModal({ onClose, onAdd, isRTL }: {
    onClose: () => void;
    onAdd: (u: User) => void;
    isRTL: boolean;
}) {
    // ── بيانات النموذج ──
    const [formData, setFormData] = useState({
        name: '', email: '', username: '', phone: '',
        password: '', confirmPassword: '',
        role: 'admin', permissions: [] as string[]
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const update = (field: string, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const isAdminRole = ['admin', 'manager', 'super_admin'].includes(formData.role);

    // ── التحقق من صحة البيانات ──
    const validate = (): string => {
        if (!formData.name.trim()) return 'الاسم الكامل مطلوب';
        if (formData.name.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
        if (!formData.password) return 'كلمة المرور مطلوبة';
        if (formData.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        if (formData.password !== formData.confirmPassword) return 'كلمات المرور غير متطابقة';

        // للمسؤولين: البريد إلزامي لتسجيل الدخول لاحقاً
        if (isAdminRole && !formData.email.trim()) {
            return 'البريد الإلكتروني إلزامي لحسابات المسؤولين (يُستخدم لتسجيل الدخول)';
        }

        // للعملاء: يجب وجود طريقة تعريف واحدة على الأقل
        if (!isAdminRole && !formData.email.trim() && !formData.phone.trim() && !formData.username.trim()) {
            return 'يجب إدخال البريد الإلكتروني أو رقم الهاتف أو اسم المستخدم';
        }

        if (isAdminRole && formData.permissions.length === 0) {
            return 'يجب تحديد صلاحية واحدة على الأقل للمسؤولين';
        }

        return '';
    };

    // ── إرسال النموذج ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        try {
            setLoading(true);

            // بناء payload - فقط الحقول غير الفارغة
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                password: formData.password,
                role: formData.role,
                status: 'active',
                createdVia: 'admin-created',
                // الصلاحيات فقط للمسؤولين
                permissions: isAdminRole ? formData.permissions : [],
            };

            if (formData.email.trim()) payload.email = formData.email.trim().toLowerCase();
            if (formData.phone.trim()) payload.phone = formData.phone.trim();
            if (formData.username.trim()) payload.username = formData.username.trim();

            const res = await api.users.create(payload);

            if (res.success) {
                setSuccess(`✅ تم إنشاء حساب "${formData.name}" بنجاح`);
                // تحويل البيانات المُرجعة للنوع User الصحيح
                const newUser: User = {
                    id: res.data._id || res.data.id || '',
                    name: res.data.name,
                    email: res.data.email,
                    username: res.data.username,
                    phone: res.data.phone,
                    role: res.data.role,
                    isActive: res.data.status === 'active',
                    createdAt: res.data.createdAt || new Date().toISOString(),
                    permissions: res.data.permissions || [],
                };
                setTimeout(() => onAdd(newUser), 800);
            } else {
                setError(res.message || 'فشل إنشاء الحساب - تحقق من البيانات');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'فشل الاتصال بالخادم';
            setError(msg);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
            dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#080808] border border-white/10 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

                {/* ── رأس النافذة ── */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-400" />
                        إضافة مستخدم جديد
                    </h2>
                    <button onClick={onClose} title="إغلاق"
                        className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X className="w-4 h-4 text-white/50" />
                    </button>
                </div>

                {/* ── محتوى النموذج ── */}
                <div className="overflow-y-auto flex-1 p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* رسالة خطأ */}
                        {error && (
                            <div className="flex items-start gap-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}
                        {/* رسالة نجاح */}
                        {success && (
                            <div className="flex items-center gap-2 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* ── المعلومات الأساسية ── */}
                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2 mb-3">
                                المعلومات الأساسية
                            </h3>
                            <div className="space-y-3">
                                <InputField label="الاسم الكامل" value={formData.name} icon={User}
                                    onChange={v => update('name', v)} placeholder="مثال: محمد العمري" required />

                                <InputField label="البريد الإلكتروني" type="email" value={formData.email} icon={Mail}
                                    onChange={v => update('email', v)} placeholder="admin@example.com"
                                    required={isAdminRole}
                                    hint={isAdminRole ? '⚠️ إلزامي للمسؤولين - يُستخدم لتسجيل الدخول' : 'اختياري للعملاء'} />

                                {!isAdminRole && (
                                    <>
                                        <InputField label="رقم الهاتف" type="tel" value={formData.phone} icon={Phone}
                                            onChange={v => update('phone', v)} placeholder="+966XXXXXXXXX"
                                            hint="بديل للبريد الإلكتروني" />
                                        <InputField label="اسم المستخدم" value={formData.username} icon={User}
                                            onChange={v => update('username', v)} placeholder="username123"
                                            hint="بديل للبريد الإلكتروني" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── كلمة المرور ── */}
                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2 mb-3">
                                كلمة المرور
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                                        كلمة المرور <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input required type={showPass ? 'text' : 'password'}
                                            placeholder="6 أحرف على الأقل" minLength={6}
                                            className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all pr-10"
                                            value={formData.password}
                                            onChange={e => update('password', e.target.value)} />
                                        <button type="button" onClick={() => setShowPass(!showPass)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                                        تأكيد كلمة المرور <span className="text-red-400">*</span>
                                    </label>
                                    <input type={showPass ? 'text' : 'password'}
                                        placeholder="أعد كتابة كلمة المرور"
                                        className={cn(
                                            'w-full bg-white/5 border p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all',
                                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? 'border-red-500/50' : 'border-white/10'
                                        )}
                                        value={formData.confirmPassword}
                                        onChange={e => update('confirmPassword', e.target.value)} />
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="text-[9px] text-red-400 mt-1">⚠️ كلمات المرور غير متطابقة</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── نوع الحساب ── */}
                        <div>
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                                نوع الحساب
                            </label>
                            <div className="relative">
                                <select value={formData.role} title="نوع الحساب"
                                    onChange={e => update('role', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                                    <option value="admin" className="bg-zinc-900">🛡️ مسؤول - Admin (صلاحيات كاملة)</option>
                                    <option value="manager" className="bg-zinc-900">👔 مدير - Manager (صلاحيات محددة)</option>
                                    <option value="buyer" className="bg-zinc-900">👤 عميل - Buyer</option>
                                </select>
                                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                            {isAdminRole && (
                                <p className="text-[9px] text-blue-400/70 mt-1.5">
                                    💡 الأدمن يدخل بالبريد الإلكتروني وكلمة المرور عبر صفحة تسجيل دخول الأدمن
                                </p>
                            )}
                        </div>

                        {/* ── الصلاحيات (للمسؤولين والمدراء فقط) ── */}
                        {isAdminRole && (
                            <div className="space-y-3 border-t border-white/8 pt-4">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                                        صلاحيات النظام {formData.permissions.length > 0 && `(${formData.permissions.length} محددة)`}
                                    </h3>
                                </div>
                                <PermissionsGrid
                                    permissions={formData.permissions}
                                    onChange={p => setFormData(prev => ({ ...prev, permissions: p }))}
                                />
                            </div>
                        )}

                        {/* ── أزرار الإجراءات ── */}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading || !!success}
                                className="flex-1 py-3.5 bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2">
                                {loading ? (
                                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> جاري الإنشاء...</>
                                ) : '✅ إنشاء الحساب'}
                            </button>
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3.5 border border-white/10 text-white/50 font-black uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all text-sm">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// نافذة تفاصيل وتعديل المستخدم
// ═══════════════════════════════════════════════════════
export function UserDetailModal({ user, onClose, onUpdate, onDelete, isRTL }: {
    user: User;
    onClose: () => void;
    onUpdate: (u: User) => void;
    onDelete: (id: string) => void;
    isRTL: boolean;
}) {
    // بيانات التعديل - نبدأ ببيانات المستخدم الحالية
    const [editData, setEditData] = useState({
        name: user.name,
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        password: '',
        role: user.role,
        isActive: user.isActive,
        isBanned: (user as any).isBanned ?? false
    });
    const [permissions, setPermissions] = useState<string[]>(user.permissions || []);
    const [devices, setDevices] = useState<Device[]>(user.boundDevices || []);
    const [isDeviceLocked, setIsDeviceLocked] = useState(user.isDeviceLocked ?? true);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'info' | 'perms' | 'devices'>('info');

    const isAdminRole = ['admin', 'manager', 'super_admin'].includes(editData.role);

    // ── حفظ التغييرات ──
    const handleSave = async () => {
        try {
            setLoading(true);
            setSaveError('');
            setSaveSuccess('');

            if (!editData.name.trim()) { setSaveError('الاسم مطلوب'); setLoading(false); return; }

            // بناء payload - نُرسل فقط الحقول المطلوبة
            const payload: Record<string, unknown> = {
                name: editData.name.trim(),
                role: editData.role,
                status: editData.isActive ? 'active' : 'suspended',
                // الصلاحيات فقط للمسؤولين والمدراء
                permissions: isAdminRole ? permissions : [],
                boundDevices: devices,
                isDeviceLocked,
            };

            // أضف الحقول فقط إذا لم تكن فارغة (لتجنب تعارض Unique indexes)
            if (editData.email.trim()) payload.email = editData.email.trim().toLowerCase();
            if (editData.username.trim()) payload.username = editData.username.trim();
            if (editData.phone.trim()) payload.phone = editData.phone.trim();
            // كلمة المرور الجديدة - اختيارية
            if (editData.password.trim() && editData.password.length >= 6) {
                payload.password = editData.password;
            } else if (editData.password.trim() && editData.password.length < 6) {
                setSaveError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
                setLoading(false);
                return;
            }

            const res = await api.users.update(user.id, payload);

            // Handle banning separately if it changed
            if (editData.isBanned !== (user as any).isBanned) {
                await api.users.ban(user.id, editData.isBanned).catch(err => {
                    console.error("Ban update failed", err);
                });
            }

            if (res.success) {
                setSaveSuccess('✅ تم حفظ التغييرات بنجاح');
                // دمج البيانات المحدثة مع بيانات المستخدم الأصلية
                const updatedUser: User = {
                    ...user,
                    name: editData.name,
                    email: editData.email || user.email,
                    username: editData.username || user.username,
                    phone: editData.phone || user.phone,
                    role: editData.role,
                    isActive: editData.isActive,
                    isBanned: editData.isBanned,
                    permissions: isAdminRole ? permissions : [],
                    boundDevices: devices,
                    isDeviceLocked,
                } as User;
                setTimeout(() => onUpdate(updatedUser), 800);
            } else {
                setSaveError(res.message || 'فشل تحديث البيانات');
            }
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'فشل الاتصال بالخادم');
        } finally { setLoading(false); }
    };

    // ── حذف المستخدم ──
    const handleDelete = async () => {
        const confirmed = window.confirm(
            `⚠️ تأكيد الحذف\n\nهل تريد حذف حساب "${user.name}"؟\nلا يمكن التراجع عن هذا الإجراء.`
        );
        if (!confirmed) return;

        try {
            setLoading(true);
            await api.users.delete(user.id);
            onDelete(user.id);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'فشل حذف المستخدم';
            setSaveError(msg);
            setLoading(false);
        }
    };

    // قائمة التبويبات حسب دور المستخدم
    const tabs = [
        { id: 'info', label: 'المعلومات' },
        ...(isAdminRole ? [{ id: 'perms', label: `الصلاحيات (${permissions.length})` }] : []),
        ...(editData.role === 'buyer' ? [{ id: 'devices', label: `الأجهزة (${devices.length})` }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md"
            dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-[#080808] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">

                {/* ── رأس النافذة ── */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <div>
                        <div className="text-base font-black text-white flex items-center gap-2">
                            <span>{user.name}</span>
                            <span className={cn('text-[9px] px-2 py-0.5 rounded-full border font-black uppercase',
                                isAdminRole
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            )}>
                                {editData.role}
                            </span>
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">
                            {user.email || user.username || user.phone || 'لا يوجد معرّف'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* زر حذف المستخدم */}
                        <button onClick={handleDelete} disabled={loading} title="حذف المستخدم"
                            className="w-8 h-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all disabled:opacity-40">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {/* زر إغلاق النافذة */}
                        <button onClick={onClose} title="إغلاق"
                            className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    </div>
                </div>

                {/* ── شريط التبويبات ── */}
                <div className="flex border-b border-white/8 flex-shrink-0">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all',
                                activeTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-500'
                                    : 'text-white/30 hover:text-white/60')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── محتوى التبويبات ── */}
                <div className="overflow-y-auto flex-1 p-5">

                    {/* ─ تبويب: المعلومات الأساسية ─ */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {/* حقول البيانات */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InputField label="الاسم الكامل" value={editData.name}
                                    onChange={v => setEditData(p => ({ ...p, name: v }))}
                                    placeholder="الاسم الكامل" icon={User} required />

                                <InputField label="البريد الإلكتروني" type="email" value={editData.email}
                                    onChange={v => setEditData(p => ({ ...p, email: v }))}
                                    placeholder="email@..." icon={Mail}
                                    hint={isAdminRole ? 'يُستخدم لتسجيل الدخول' : ''} />

                                <InputField label="اسم المستخدم" value={editData.username}
                                    onChange={v => setEditData(p => ({ ...p, username: v }))}
                                    placeholder="username" icon={User} />

                                <InputField label="رقم الهاتف" type="tel" value={editData.phone}
                                    onChange={v => setEditData(p => ({ ...p, phone: v }))}
                                    placeholder="+966..." icon={Phone} />
                            </div>

                            {/* الدور */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">الدور</label>
                                <div className="relative">
                                    <select value={editData.role} title="الدور"
                                        onChange={e => setEditData(p => ({ ...p, role: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/40 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="super_admin" className="bg-zinc-900">👑 مسؤول عام - Super Admin</option>
                                        <option value="admin" className="bg-zinc-900">🛡️ مسؤول - Admin</option>
                                        <option value="manager" className="bg-zinc-900">👔 مدير - Manager</option>
                                        <option value="buyer" className="bg-zinc-900">👤 عميل - Buyer</option>
                                        <option value="seller" className="bg-zinc-900">💼 بائع - Seller</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>

                            {/* كلمة مرور جديدة (اختياري) */}
                            <div>
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
                                    كلمة مرور جديدة <span className="text-white/20 normal-case">(اتركها فارغة للإبقاء على الحالية)</span>
                                </label>
                                <div className="relative">
                                    <input type={showPass ? 'text' : 'password'} placeholder="••••••"
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/40 outline-none transition-all pr-10"
                                        value={editData.password}
                                        onChange={e => setEditData(p => ({ ...p, password: e.target.value }))} />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {editData.password && editData.password.length < 6 && (
                                    <p className="text-[9px] text-red-400 mt-1">⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                                )}
                            </div>

                            {/* مفتاح تشغيل/إيقاف الحساب */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <div>
                                    <div className="text-sm font-bold text-white">حالة الحساب</div>
                                    <div className={cn('text-[10px] mt-0.5', editData.isActive ? 'text-green-400' : 'text-red-400')}>
                                        {editData.isActive ? '● نشط ومفعّل' : '● معطّل / موقوف'}
                                    </div>
                                </div>
                                <div onClick={() => setEditData(p => ({ ...p, isActive: !p.isActive }))}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300',
                                        editData.isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
                                        editData.isActive ? 'right-1' : 'right-7')} />
                                </div>
                            </div>

                            {/* Ban Status */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-red-500/20 p-4 rounded-xl">
                                <div>
                                    <div className="text-sm font-bold text-red-400">{isRTL ? "حظر شامل للحساب" : "Global Account Ban"}</div>
                                    <div className="text-[10px] text-white/30 mt-0.5">
                                        {editData.isBanned ? (isRTL ? "🚫 المستخدم محظور تماماً من النظام" : "🚫 User is completely banned from system") : (isRTL ? "✅ المستخدم غير محظور" : "✅ User is not banned")}
                                    </div>
                                </div>
                                <div onClick={() => setEditData(p => ({ ...p, isBanned: !p.isBanned }))}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300',
                                        editData.isBanned ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
                                        editData.isBanned ? 'right-1' : 'right-7')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─ تبويب: الصلاحيات ─ */}
                    {activeTab === 'perms' && (
                        <div>
                            <p className="text-[9px] text-white/30 mb-4">
                                صلاحيات هذا المستخدم في النظام. تنطبق فقط على المسؤولين والمدراء.
                            </p>
                            <PermissionsGrid permissions={permissions} onChange={setPermissions} />
                        </div>
                    )}

                    {/* ─ تبويب: الأجهزة المرتبطة ─ */}
                    {activeTab === 'devices' && (
                        <div className="space-y-4">
                            {/* مفتاح قفل الأجهزة */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <div>
                                    <div className="text-sm font-bold text-white">قفل الحساب على الأجهزة المرتبطة</div>
                                    <div className="text-[10px] text-white/30 mt-0.5">
                                        {isDeviceLocked ? 'مُفعّل - لا يمكن الدخول من جهاز جديد' : 'معطّل - يمكن الدخول من أي جهاز'}
                                    </div>
                                </div>
                                <div onClick={() => setIsDeviceLocked(!isDeviceLocked)}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300',
                                        isDeviceLocked ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
                                        isDeviceLocked ? 'right-1' : 'right-7')} />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setDevices([]);
                                    setIsDeviceLocked(false);
                                    setSaveSuccess(isRTL ? "✅ تم تصفير الأجهزة وفتح المتصفح" : "✅ Devices reset & lock disabled");
                                }}
                                className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all mb-4"
                            >
                                {isRTL ? "تصفير ارتباط الأجهزة وفتح القفل" : "RESET DEVICE BINDING & UNLOCK"}
                            </button>

                            {/* قائمة الأجهزة */}
                            <div className="space-y-2">
                                {devices.length === 0 ? (
                                    <p className="text-center text-white/20 text-sm py-8">لا توجد أجهزة مربوطة بهذا الحساب</p>
                                ) : devices.map(dev => (
                                    <div key={dev.deviceId}
                                        className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                        <div>
                                            <div className="text-sm font-bold text-white">{dev.browser} على {dev.os}</div>
                                            <div className="text-[10px] text-white/30 font-mono">IP: {dev.ip}</div>
                                            <div className={cn('text-[9px] mt-0.5', dev.isActive ? 'text-green-400' : 'text-red-400')}>
                                                {dev.isActive ? '● نشط' : '● محظور'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDevices(d => d.map(x =>
                                                x.deviceId === dev.deviceId ? { ...x, isActive: !x.isActive } : x
                                            ))}
                                            className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all',
                                                dev.isActive
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20')}>
                                            {dev.isActive ? 'حظر' : 'رفع الحظر'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── تذييل النافذة: رسائل + زر الحفظ ── */}
                <div className="p-5 border-t border-white/8 flex-shrink-0 space-y-3">
                    {saveError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{saveError}</span>
                        </div>
                    )}
                    {saveSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{saveSuccess}</span>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={loading || !!saveSuccess}
                            className="flex-1 py-3.5 bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2">
                            {loading ? (
                                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> جاري الحفظ...</>
                            ) : (
                                <><Save className="w-4 h-4" /> حفظ التغييرات</>
                            )}
                        </button>
                        <button onClick={onClose}
                            className="px-6 py-3.5 border border-white/10 text-white/50 font-black uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all text-sm">
                            إغلاق
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
