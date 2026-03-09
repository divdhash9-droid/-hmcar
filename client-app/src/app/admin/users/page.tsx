'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Users, Shield, Search, ChevronLeft, Plus, Eye, EyeOff,
    ChevronDown, Check, X, Car, Settings, Gavel, ShoppingCart,
    BarChart2, MessageSquare, FileText, Bell, Link2, Phone, Layers,
    Briefcase, Star, Trash2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import NextLink from "next/link";
import { useToast } from "@/lib/ToastContext";

// ── واجهات البيانات ──
interface Device { deviceId: string; browser: string; os: string; ip: string; lastUsedAt: string; isActive: boolean; }
interface User {
    id: string; name: string; email?: string; username?: string; phone?: string;
    role: string; isActive: boolean; createdAt: string;
    boundDevices?: Device[]; isDeviceLocked?: boolean; permissions?: string[];
}
interface RawUser {
    _id?: string; id?: string; name: string; email?: string; username?: string; phone?: string;
    role: string; status?: string; createdAt: string; boundDevices?: Device[];
    isDeviceLocked?: boolean; permissions?: string[];
}

// ── قائمة الصلاحيات الكاملة للنظام ──
const ALL_SYSTEM_PERMISSIONS = [
    { id: 'manage_cars', icon: Car, label: 'إدارة السيارات', desc: 'إضافة وتعديل وحذف السيارات', color: 'blue' },
    { id: 'manage_parts', icon: Layers, label: 'إدارة قطع الغيار', desc: 'إضافة وتعديل وحذف القطع', color: 'orange' },
    { id: 'manage_auctions', icon: Gavel, label: 'إدارة المزادات', desc: 'إنشاء وإدارة المزادات المباشرة', color: 'red' },
    { id: 'manage_orders', icon: ShoppingCart, label: 'إدارة الطلبيات', desc: 'متابعة وتحديث الطلبيات', color: 'green' },
    { id: 'manage_users', icon: Users, label: 'إدارة المستخدمين', desc: 'عرض وتعديل وحذف المستخدمين', color: 'purple' },
    { id: 'manage_concierge', icon: Briefcase, label: 'إدارة الطلبات الخاصة', desc: 'طلبات سيارات وقطع الغيار', color: 'amber' },
    { id: 'manage_settings', icon: Settings, label: 'إعدادات النظام', desc: 'تغيير إعدادات وكلمات المرور', color: 'gray' },
    { id: 'manage_content', icon: FileText, label: 'إدارة المحتوى', desc: 'الصفحة الرئيسية والمحتوى العام', color: 'teal' },
    { id: 'manage_footer', icon: Link2, label: 'روابط التواصل', desc: 'روابط التواصل الاجتماعي والفوتر', color: 'cyan' },
    { id: 'manage_whatsapp', icon: Phone, label: 'إدارة واتساب', desc: 'رقم واتساب التواصل مع العملاء', color: 'green' },
    { id: 'view_analytics', icon: BarChart2, label: 'عرض الإحصائيات', desc: 'تقارير وإحصائيات النظام', color: 'yellow' },
    { id: 'manage_messages', icon: MessageSquare, label: 'إدارة المحادثات', desc: 'الرد على رسائل ومحادثات العملاء', color: 'indigo' },
    { id: 'manage_brands', icon: Star, label: 'إدارة الوكالات', desc: 'إضافة وتعديل وكالات السيارات', color: 'pink' },
    { id: 'manage_notifications', icon: Bell, label: 'إدارة الإشعارات', desc: 'إرسال وإدارة إشعارات المستخدمين', color: 'violet' },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; check: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-400', check: 'bg-blue-500' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-400', check: 'bg-orange-500' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', check: 'bg-red-500' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', check: 'bg-green-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400', check: 'bg-purple-500' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', check: 'bg-amber-500' },
    gray: { bg: 'bg-white/5', border: 'border-white/20', text: 'text-white/60', check: 'bg-white/80' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/40', text: 'text-teal-400', check: 'bg-teal-500' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-400', check: 'bg-cyan-500' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', check: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', text: 'text-indigo-400', check: 'bg-indigo-500' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/40', text: 'text-pink-400', check: 'bg-pink-500' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-400', check: 'bg-violet-500' },
};

// ── مكوّن الصلاحيات المشترك ──
function PermissionsGrid({ permissions, onChange }: { permissions: string[]; onChange: (p: string[]) => void }) {
    const togglePerm = (id: string) => {
        onChange(permissions.includes(id) ? permissions.filter(x => x !== id) : [...permissions, id]);
    };
    const allSelected = ALL_SYSTEM_PERMISSIONS.every(p => permissions.includes(p.id));
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                    {permissions.length} / {ALL_SYSTEM_PERMISSIONS.length} صلاحية محددة
                </span>
                <div className="flex gap-2">
                    <button type="button" onClick={() => onChange(ALL_SYSTEM_PERMISSIONS.map(p => p.id))}
                        className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
                        تحديد الكل
                    </button>
                    <button type="button" onClick={() => onChange([])}
                        className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                        إلغاء الكل
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SYSTEM_PERMISSIONS.map(perm => {
                    const isSelected = permissions.includes(perm.id);
                    const colors = COLOR_MAP[perm.color] || COLOR_MAP.gray;
                    const Icon = perm.icon;
                    return (
                        <button
                            type="button"
                            key={perm.id}
                            onClick={() => togglePerm(perm.id)}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border text-right transition-all',
                                isSelected ? `${colors.bg} ${colors.border}` : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                            )}
                        >
                            <div className={cn(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                isSelected ? `${colors.check} border-transparent` : 'border-white/25 bg-transparent'
                            )}>
                                {isSelected && <Check className="w-3 h-3 text-black font-black" />}
                            </div>
                            <div className={cn('flex-shrink-0', isSelected ? colors.text : 'text-white/30')}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <div className={cn('text-xs font-black', isSelected ? 'text-white' : 'text-white/50')}>{perm.label}</div>
                                <div className="text-[9px] text-white/25 truncate">{perm.desc}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
            {!allSelected && permissions.length === 0 && (
                <p className="text-[10px] text-amber-400/70 text-center py-2">
                    ⚠️ لم يتم تحديد أي صلاحية - لن يتمكن من إدارة أي شيء
                </p>
            )}
        </div>
    );
}

// ── الصفحة الرئيسية ──
export default function AdminUsersPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, buyers: 0, sellers: 0, admins: 0, active: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = {};
            if (filter !== 'all') params.role = filter;
            if (searchTerm) params.search = searchTerm;
            params.limit = 100;
            const res = await api.users.list(params);
            const list = Array.isArray(res?.data) ? res.data : [];
            setUsers(list.map((u: RawUser) => ({
                id: u._id || u.id || '',
                name: u.name, email: u.email, username: u.username, phone: u.phone,
                role: u.role,
                isActive: (u.status || 'active') === 'active',
                createdAt: u.createdAt,
                boundDevices: u.boundDevices, isDeviceLocked: u.isDeviceLocked,
                permissions: u.permissions
            })));
            setStats({
                total: res?.pagination?.total || list.length,
                buyers: list.filter((u: RawUser) => u.role === 'buyer').length,
                sellers: list.filter((u: RawUser) => u.role === 'seller').length,
                admins: list.filter((u: RawUser) => ['admin', 'super_admin', 'manager'].includes(u.role)).length,
                active: list.filter((u: RawUser) => (u.status || 'active') === 'active').length,
            });
        } catch (err) {
            console.error('Failed to load users', err);
            showToast('فشل تحميل المستخدمين', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter, searchTerm, showToast]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const getRoleLabel = (role: string) => {
        const map: Record<string, string> = { admin: 'مسؤول', super_admin: 'مسؤول عام', manager: 'مدير', buyer: 'عميل', seller: 'بائع' };
        return map[role] || role;
    };
    const getRoleColor = (role: string) => {
        if (['admin', 'super_admin', 'manager'].includes(role)) return 'bg-red-500/10 border-red-500/30 text-red-400';
        if (role === 'seller') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    };

    return (
        <div className="relative min-h-screen text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 pt-6 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* ── HUD Header ── */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <NextLink href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</NextLink>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'الأعضاء' : 'USERS'}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">USER MANAGEMENT SYSTEM</p>
                            <h1 className="ck-page-title">{isRTL ? 'إدارة الأعضاء' : 'USER CTRL'}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={loadUsers} className="ck-btn-ghost flex items-center gap-2" data-cockpit-tip={isRTL ? 'تحديث' : 'Refresh'}>
                                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                                <span className="hidden sm:inline">{isRTL ? 'تحديث' : 'REFRESH'}</span>
                            </button>
                            <button onClick={() => setShowAddModal(true)} className="ck-btn-primary flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                {isRTL ? 'إضافة مسؤول' : 'ADD ADMIN'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: isRTL ? 'الكل' : 'ALL', value: stats.total, key: 'all', colorClass: 'text-white' },
                        { label: isRTL ? 'عملاء' : 'CLIENTS', value: stats.buyers, key: 'buyer', colorClass: 'text-blue-400' },
                        { label: isRTL ? 'بائعين' : 'SELLERS', value: stats.sellers, key: 'seller', colorClass: 'text-amber-400' },
                        { label: isRTL ? 'مسؤولين' : 'ADMINS', value: stats.admins, key: 'admin', colorClass: 'text-orange-400' },
                        { label: isRTL ? 'نشطون' : 'ACTIVE', value: stats.active, key: 'active', colorClass: 'text-green-400' },
                    ].map((s, i) => (
                        <button key={s.key} onClick={() => setFilter(s.key)}
                            className={cn(
                                'ck-stat text-center ck-fade-up transition-all',
                                `ck-delay-${Math.min(i + 1, 4)}`,
                                filter === s.key && 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                            )}>
                            <div className={cn('ck-stat-num', s.colorClass)}>{s.value}</div>
                            <div className="cockpit-mono text-[8px] text-white/30 uppercase tracking-widest mt-1">{s.label}</div>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/30', isRTL ? 'right-4' : 'left-4')} />
                    <input type="text" placeholder={isRTL ? 'البحث عن عضو...' : 'Search members...'}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className={cn('ck-input', isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4')}
                    />
                </div>

                {/* Users Table */}
                <div className="ck-card hidden md:block overflow-hidden">
                    <table className="ck-table">
                        <thead>
                            <tr>
                                <th>{isRTL ? 'العضو' : 'MEMBER'}</th>
                                <th>{isRTL ? 'الدور' : 'ROLE'}</th>
                                <th>{isRTL ? 'الصلاحيات' : 'PERMS'}</th>
                                <th>{isRTL ? 'الحالة' : 'STATUS'}</th>
                                <th>{isRTL ? 'إجراء' : 'ACTION'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[1, 2, 3, 4, 5].map(k => <td key={k}><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5}>
                                    <div className="ck-empty">
                                        <div className="ck-empty-icon"><Users className="w-6 h-6" /></div>
                                        <p className="cockpit-mono text-sm">{isRTL ? 'لا توجد بيانات' : 'NO RECORDS'}</p>
                                    </div>
                                </td></tr>
                            ) : users.map(user => (
                                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-orange-400/50" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{user.name}</div>
                                                <div className="cockpit-mono text-[10px] text-white/30">{user.email || user.username || user.phone || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={cn('ck-badge', getRoleColor(user.role))}>{getRoleLabel(user.role)}</span>
                                    </td>
                                    <td>
                                        {['admin', 'super_admin', 'manager'].includes(user.role) ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="ck-badge ck-badge-info cockpit-mono">{user.permissions?.length || 0}</span>
                                                <span className="text-[9px] text-white/25">{isRTL ? 'صلاحية' : 'perms'}</span>
                                            </div>
                                        ) : <span className="text-white/20">—</span>}
                                    </td>
                                    <td>
                                        <span className={cn('ck-badge ck-badge-live', user.isActive ? 'ck-badge-active' : 'ck-badge-danger')}>
                                            {user.isActive ? (isRTL ? 'نشط' : 'ACTIVE') : (isRTL ? 'معطل' : 'OFF')}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="ck-btn-ghost text-xs">{isRTL ? 'إدارة' : 'MANAGE'}</button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.02] animate-pulse border border-orange-500/10" />)
                    ) : users.map(user => (
                        <motion.div key={user.id} onClick={() => setSelectedUser(user)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="ck-card p-4 cursor-pointer ck-hover-lift">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-orange-400/50" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                        <div className="cockpit-mono text-[10px] text-white/30 truncate">{user.email || user.phone || '—'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={cn('ck-badge text-[8px]', getRoleColor(user.role))}>{getRoleLabel(user.role)}</span>
                                    <span className={cn('w-2 h-2 rounded-full', user.isActive ? 'bg-green-400 shadow-[0_0_5px_#22c55e]' : 'bg-red-400')} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {!loading && users.length === 0 && (
                        <div className="ck-empty"><div className="ck-empty-icon"><Users className="w-6 h-6" /></div>
                            <p className="cockpit-mono">{isRTL ? 'لا توجد بيانات' : 'NO RECORDS'}</p>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={(u: User) => { setUsers(prev => [u, ...prev]); setShowAddModal(false); showToast('✅ تم إنشاء الحساب بنجاح', 'success'); }}
                        isRTL={isRTL}
                    />
                )}
                {selectedUser && (
                    <UserDetailModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        onUpdate={(updated: User) => {
                            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                            setSelectedUser(null);
                            showToast('✅ تم حفظ التغييرات', 'success');
                        }}
                        onDelete={(id: string) => {
                            setUsers(prev => prev.filter(u => u.id !== id));
                            setSelectedUser(null);
                            showToast('🗑️ تم حذف العضو', 'success');
                        }}
                        isRTL={isRTL}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Modal إضافة مستخدم ──
function AddUserModal({ onClose, onAdd, isRTL }: { onClose: () => void; onAdd: (u: User) => void; isRTL: boolean }) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin', permissions: [] as string[] });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-400" />
                        {isRTL ? 'إضافة مسؤول جديد' : 'Add New Admin'}
                    </h2>
                    <button onClick={onClose} title="إغلاق" className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <X className="w-4 h-4 text-white/50" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* الحقول الأساسية */}
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">المعلومات الأساسية</h3>
                            {[
                                { key: 'name', label: 'الاسم الكامل *', placeholder: 'مثال: محمد العمري', type: 'text' },
                                { key: 'email', label: 'البريد الإلكتروني *', placeholder: 'admin@example.com', type: 'email' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">{field.label}</label>
                                    <input required type={field.type} placeholder={field.placeholder}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all"
                                        value={formData[field.key as 'name' | 'email']}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                            {/* كلمة المرور */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">كلمة المرور *</label>
                                <div className="relative">
                                    <input required type={showPass ? 'text' : 'password'} placeholder="••••••••" minLength={6}
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all pr-10"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            {/* الدور */}
                            <div>
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">نوع الحساب</label>
                                <div className="relative">
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        title="نوع الحساب"
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="admin" className="bg-zinc-900">🛡️ مسؤول (Admin)</option>
                                        <option value="manager" className="bg-zinc-900">👔 مدير (Manager)</option>
                                        <option value="buyer" className="bg-zinc-900">👤 عميل</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* الصلاحيات */}
                        {['admin', 'manager'].includes(formData.role) && (
                            <div className="space-y-3 border-t border-white/8 pt-5">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-400">صلاحيات النظام الكاملة</h3>
                                </div>
                                <PermissionsGrid
                                    permissions={formData.permissions}
                                    onChange={p => setFormData({ ...formData, permissions: p })}
                                />
                            </div>
                        )}

                        {/* أزرار */}
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

// ── Modal تفاصيل وتعديل المستخدم ──
function UserDetailModal({ user, onClose, onUpdate, onDelete, isRTL }: {
    user: User; onClose: () => void; onUpdate: (u: User) => void; onDelete: (id: string) => void; isRTL: boolean;
}) {
    const [editData, setEditData] = useState({
        name: user.name, email: user.email || '', username: user.username || '',
        phone: user.phone || '', password: '', role: user.role, isActive: user.isActive
    });
    const [permissions, setPermissions] = useState<string[]>(user.permissions || []);
    const [devices, setDevices] = useState<Device[]>(user.boundDevices || []);
    const [isDeviceLocked, setIsDeviceLocked] = useState(user.isDeviceLocked ?? true);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'perms' | 'devices'>('info');

    const [saveError, setSaveError] = useState('');

    const handleSave = async () => {
        try {
            setLoading(true);
            setSaveError('');

            // ── مهم: لا نُرسل الحقول الفارغة لتجنب تعارض الـ unique indexes ──
            const payload: Record<string, unknown> = {
                name: editData.name.trim(),
                role: editData.role,
                status: editData.isActive ? 'active' : 'suspended',
                permissions: ['admin', 'manager', 'super_admin'].includes(editData.role) ? permissions : [],
                boundDevices: devices,
                isDeviceLocked,
            };

            // فقط أضف الحقل إذا كان غير فارغ
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
            const msg = err instanceof Error ? err.message : 'فشل تحديث المستخدم';
            setSaveError(msg);
        } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!confirm(`حذف "${user.name}"? لا يمكن التراجع.`)) return;
        try {
            await api.users.delete(user.id);
            onDelete(user.id);
        } catch { alert('فشل الحذف'); }
    };

    const tabs = [
        { id: 'info', label: 'المعلومات' },
        ...(['admin', 'manager'].includes(editData.role) ? [{ id: 'perms', label: `الصلاحيات (${permissions.length})` }] : []),
        ...(editData.role === 'buyer' ? [{ id: 'devices', label: 'الأجهزة' }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-[#080808] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                    <div>
                        <div className="text-lg font-black text-white">{user.name}</div>
                        <div className="text-[10px] text-white/30">{user.email || user.phone || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDelete} title="حذف" className="w-8 h-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onClose} title="إغلاق" className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/8 flex-shrink-0">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all',
                                activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-500' : 'text-white/30 hover:text-white/60')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5">
                    {/* Tab: المعلومات */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
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
                                    <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} title="الدور"
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500/40 outline-none transition-all appearance-none cursor-pointer">
                                        <option value="admin" className="bg-zinc-900">🛡️ مسؤول</option>
                                        <option value="manager" className="bg-zinc-900">👔 مدير</option>
                                        <option value="buyer" className="bg-zinc-900">👤 عميل</option>
                                        <option value="seller" className="bg-zinc-900">💼 بائع</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                            {/* كلمة المرور */}
                            <div>
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">كلمة مرور جديدة (اتركها فارغة للإبقاء)</label>
                                <div className="relative">
                                    <input type={showPass ? 'text' : 'password'} placeholder="••••••"
                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/20 focus:border-blue-500/40 outline-none transition-all pr-10"
                                        value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            {/* حالة الحساب */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <span className="text-sm font-bold text-white">حالة الحساب</span>
                                <div onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors', editData.isActive ? 'bg-green-500' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', editData.isActive ? 'right-1' : 'right-7')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: الصلاحيات */}
                    {activeTab === 'perms' && (
                        <PermissionsGrid permissions={permissions} onChange={setPermissions} />
                    )}

                    {/* Tab: الأجهزة */}
                    {activeTab === 'devices' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                <span className="text-sm font-bold text-white">قفل على الأجهزة المرتبطة</span>
                                <div onClick={() => setIsDeviceLocked(!isDeviceLocked)}
                                    className={cn('w-12 h-6 rounded-full relative cursor-pointer transition-colors', isDeviceLocked ? 'bg-blue-500' : 'bg-white/10')}>
                                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', isDeviceLocked ? 'right-1' : 'right-7')} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {devices.map(dev => (
                                    <div key={dev.deviceId} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/8 p-4 rounded-xl">
                                        <div>
                                            <div className="text-sm font-bold text-white">{dev.browser} على {dev.os}</div>
                                            <div className="text-[10px] text-white/30 font-mono">IP: {dev.ip}</div>
                                        </div>
                                        <button onClick={() => setDevices(d => d.map(x => x.deviceId === dev.deviceId ? { ...x, isActive: !x.isActive } : x))}
                                            className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all',
                                                dev.isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20')}>
                                            {dev.isActive ? 'حظر' : 'رفع الحظر'}
                                        </button>
                                    </div>
                                ))}
                                {devices.length === 0 && <p className="text-center text-white/20 text-sm py-8">لا توجد أجهزة مربوطة</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
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
