'use client';

/**
 * نوافذ إدارة المستخدمين - UserModals
 * ────────────────────────────────────
 * يحتوي على نافذتين منبثقتين:
 * 1. AddUserModal   - إضافة مسؤول/مدير جديد
 * 2. UserDetailModal - عرض وتعديل تفاصيل مستخدم موجود
 */

'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Eye, EyeOff, ChevronDown, Shield, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import PermissionsGrid from './PermissionsGrid';

// ── أنواع البيانات ──
interface Device { deviceId: string; browser: string; os: string; ip: string; lastUsedAt: string; isActive: boolean; }
export interface User {
    id: string; name: string; email?: string; username?: string; phone?: string;
    role: string; isActive: boolean; createdAt: string;
    boundDevices?: Device[]; isDeviceLocked?: boolean; permissions?: string[];
}

// ════════════════════════════════════════════
// نافذة إضافة مسؤول جديد
// ════════════════════════════════════════════
export function AddUserModal({ onClose, onAdd, isRTL }: {
    onClose: () => void;
    onAdd: (u: User) => void;
    isRTL: boolean;
}) {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'admin', permissions: [] as string[]
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // التحقق من صحة البيانات قبل الإرسال
        if (!formData.name.trim()) { setError('الاسم مطلوب'); return; }
        if (!formData.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
        if (!formData.password || formData.password.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); return; }
        if (formData.role === 'admin' && formData.permissions.length === 0) { setError('يجب تحديد صلاحية واحدة على الأقل'); return; }

        try {
            setLoading(true);
            const res = await api.users.create({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
                // لا نرسل صلاحيات للعملاء العاديين
                permissions: formData.role === 'admin' ? formData.permissions : [],
                status: 'active',
                createdVia: 'admin-created'
            });
            if (res.success) { onAdd(res.data); }
            else { setError(res.message || 'فشل إنشاء الحساب'); }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-[#080808] border border-white/10 rounded-3xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden">

                {/* رأس النافذة */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-400" />
                        {isRTL ? 'إضافة مسؤول جديد' : 'Add New Admin'}
                    </h2>
                    <button onClick={onClose} title="إغلاق"
                        className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X className="w-4 h-4 text-white/50" />
                    </button>
                </div>

                {/* محتوى النموذج */}
                <div className="overflow-y-auto flex-1 p-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* رسالة خطأ */}
                        {error && (
                            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* ── الحقول الأساسية ── */}
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">المعلومات الأساسية</h3>

                            {/* الاسم */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">الاسم الكامل *</label>
                                <input required type="text" placeholder="مثال: محمد العمري"
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            {/* البريد الإلكتروني */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">البريد الإلكتروني *</label>
                                <input required type="email" placeholder="admin@example.com"
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            {/* كلمة المرور مع زر إظهار/إخفاء */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">كلمة المرور *</label>
                                <div className="relative">
                                    <input required type={showPass ? 'text' : 'password'} placeholder="••••••••" minLength={6}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all pr-10"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* نوع الحساب (دور المستخدم) */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">نوع الحساب</label>
                                <div className="relative">
                                    <select value={formData.role} title="نوع الحساب"
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="admin" className="bg-zinc-900">🛡️ مسؤول (Admin)</option>
                                        <option value="manager" className="bg-zinc-900">👔 مدير (Manager)</option>
                                        <option value="buyer" className="bg-zinc-900">👤 عميل</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* ── الصلاحيات (للمسؤولين والمدراء فقط) ── */}
                        {['admin', 'manager'].includes(formData.role) && (
                            <div className="space-y-3 border-t border-white/8 pt-5">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-400">صلاحيات النظام</h3>
                                </div>
                                <PermissionsGrid
                                    permissions={formData.permissions}
                                    onChange={p => setFormData({ ...formData, permissions: p })}
                                />
                            </div>
                        )}

                        {/* أزرار الإجراءات */}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading}
                                className="flex-1 py-3.5 bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                {loading ? '⏳ جاري الإنشاء...' : '✅ إنشاء الحساب'}
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

// ════════════════════════════════════════════
// نافذة تفاصيل وتعديل المستخدم
// ════════════════════════════════════════════
export function UserDetailModal({ user, onClose, onUpdate, onDelete, isRTL }: {
    user: User;
    onClose: () => void;
    onUpdate: (u: User) => void;
    onDelete: (id: string) => void;
    isRTL: boolean;
}) {
    // بيانات التعديل - نبدأ ببيانات المستخدم الحالية
    const [editData, setEditData] = useState({
        name: user.name, email: user.email || '',
        username: user.username || '', phone: user.phone || '',
        password: '', role: user.role, isActive: user.isActive
    });
    const [permissions, setPermissions] = useState<string[]>(user.permissions || []);
    const [devices, setDevices] = useState<Device[]>(user.boundDevices || []);
    const [isDeviceLocked, setIsDeviceLocked] = useState(user.isDeviceLocked ?? true);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [saveError, setSaveError] = useState('');
    // تبويبات: معلومات / صلاحيات / أجهزة
    const [activeTab, setActiveTab] = useState<'info' | 'perms' | 'devices'>('info');

    // ── حفظ التغييرات ──
    const handleSave = async () => {
        try {
            setLoading(true);
            setSaveError('');

            // بناء payload - لا نُرسل الحقول الفارغة لتجنب تعارض الـ unique indexes
            const payload: Record<string, unknown> = {
                name: editData.name.trim(),
                role: editData.role,
                status: editData.isActive ? 'active' : 'suspended',
                // الصلاحيات فقط للمسؤولين والمدراء
                permissions: ['admin', 'manager', 'super_admin'].includes(editData.role) ? permissions : [],
                boundDevices: devices,
                isDeviceLocked,
            };

            // أضف الحقل فقط إذا لم يكن فارغاً
            if (editData.email.trim()) payload.email = editData.email.trim().toLowerCase();
            if (editData.username.trim()) payload.username = editData.username.trim();
            if (editData.phone.trim()) payload.phone = editData.phone.trim();
            if (editData.password.trim()) payload.password = editData.password;

            const res = await api.users.update(user.id, payload);
            if (res.success) {
                onUpdate({ ...user, ...res.data, id: user.id });
            } else {
                setSaveError(res.message || 'فشل تحديث المستخدم');
            }
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'فشل تحديث المستخدم');
        } finally { setLoading(false); }
    };

    // ── حذف المستخدم ──
    const handleDelete = async () => {
        if (!confirm(`حذف "${user.name}"? لا يمكن التراجع.`)) return;
        try {
            await api.users.delete(user.id);
            onDelete(user.id);
        } catch { alert('فشل الحذف'); }
    };

    // إنشاء قائمة التبويبات ديناميكياً حسب دور المستخدم
    const tabs = [
        { id: 'info', label: 'المعلومات' },
        ...(['admin', 'manager'].includes(editData.role) ? [{ id: 'perms', label: `الصلاحيات (${permissions.length})` }] : []),
        ...(editData.role === 'buyer' ? [{ id: 'devices', label: 'الأجهزة' }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-[#080808] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">

                {/* ── رأس النافذة ── */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <div>
                        <div className="text-lg font-black text-white">{user.name}</div>
                        <div className="text-[10px] text-white/30">{user.email || user.phone || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* زر حذف المستخدم */}
                        <button onClick={handleDelete} title="حذف"
                            className="w-8 h-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {/* زر إغلاق الnافذة */}
                        <button onClick={onClose} title="إغلاق"
                            className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    </div>
                </div>

                {/* ── التبويبات ── */}
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

                    {/* ─ تبويب: المعلومات ─ */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {/* حقول البيانات الأساسية */}
                            {[
                                { key: 'name', label: 'الاسم', placeholder: 'الاسم الكامل' },
                                { key: 'email', label: 'البريد الإلكتروني', placeholder: 'email@...' },
                                { key: 'username', label: 'اسم المستخدم', placeholder: 'username' },
                                { key: 'phone', label: 'رقم الهاتف', placeholder: '+966...' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">{f.label}</label>
                                    <input type="text" placeholder={f.placeholder}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-blue-500/40 outline-none transition-all"
                                        value={editData[f.key as keyof typeof editData] as string}
                                        onChange={e => setEditData({ ...editData, [f.key]: e.target.value })} />
                                </div>
                            ))}

                            {/* الدور */}
                            <div>
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">الدور</label>
                                <div className="relative">
                                    <select value={editData.role} title="الدور"
                                        onChange={e => setEditData({ ...editData, role: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/40 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="admin" className="bg-zinc-900">🛡️ مسؤول</option>
                                        <option value="manager" className="bg-zinc-900">👔 مدير</option>
                                        <option value="buyer" className="bg-zinc-900">👤 عميل</option>
                                        <option value="seller" className="bg-zinc-900">💼 بائع</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>

                            {/* كلمة مرور جديدة (اختياري) */}
                            <div>
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">كلمة مرور جديدة (اتركها فارغة للإبقاء)</label>
                                <div className="relative">
                                    <input type={showPass ? 'text' : 'password'} placeholder="••••••"
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/40 outline-none transition-all pr-10"
                                        value={editData.password}
                                        onChange={e => setEditData({ ...editData, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* مفتاح تشغيل/إيقاف الحساب */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <span className="text-sm font-bold text-white">حالة الحساب</span>
                                <div onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors', editData.isActive ? 'bg-green-500' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', editData.isActive ? 'right-1' : 'right-7')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─ تبويب: الصلاحيات ─ */}
                    {activeTab === 'perms' && (
                        <PermissionsGrid permissions={permissions} onChange={setPermissions} />
                    )}

                    {/* ─ تبويب: الأجهزة المرتبطة ─ */}
                    {activeTab === 'devices' && (
                        <div className="space-y-4">
                            {/* مفتاح قفل الأجهزة */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <span className="text-sm font-bold text-white">قفل على الأجهزة المرتبطة</span>
                                <div onClick={() => setIsDeviceLocked(!isDeviceLocked)}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors', isDeviceLocked ? 'bg-blue-500' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', isDeviceLocked ? 'right-1' : 'right-7')} />
                                </div>
                            </div>

                            {/* قائمة الأجهزة المرتبطة بالحساب */}
                            <div className="space-y-2">
                                {devices.map(dev => (
                                    <div key={dev.deviceId} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                        <div>
                                            <div className="text-sm font-bold text-white">{dev.browser} على {dev.os}</div>
                                            <div className="text-[10px] text-white/30 font-mono">IP: {dev.ip}</div>
                                        </div>
                                        {/* زر حظر / رفع حظر الجهاز */}
                                        <button
                                            onClick={() => setDevices(d => d.map(x => x.deviceId === dev.deviceId ? { ...x, isActive: !x.isActive } : x))}
                                            className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all',
                                                dev.isActive
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                    : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20')}>
                                            {dev.isActive ? 'حظر' : 'رفع الحظر'}
                                        </button>
                                    </div>
                                ))}
                                {/* رسالة إذا لم توجد أجهزة */}
                                {devices.length === 0 && (
                                    <p className="text-center text-white/20 text-sm py-8">لا توجد أجهزة مربوطة</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── تذييل النافذة: زر الحفظ ── */}
                <div className="p-5 border-t border-white/8 flex-shrink-0 space-y-3">
                    {saveError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                            ⚠️ {saveError}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={loading}
                            className="flex-1 py-3.5 bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            {loading ? '⏳ جاري الحفظ...' : '✅ حفظ التغييرات'}
                        </button>
                        <button onClick={onClose}
                            className="px-6 py-3.5 border border-white/10 text-white/50 font-black uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all text-sm">
                            إلغاء
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
