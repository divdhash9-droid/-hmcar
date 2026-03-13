'use client';

/**
 * صفحة إدارة المستخدمين - لوحة تحكم HM CAR
 * ────────────────────────────────────────────
 * هذه الصفحة مسؤولة عن:
 * - عرض جميع المستخدمين (عملاء، مسؤولين، مدراء)
 * - إضافة مسؤولين جدد مع تحديد صلاحياتهم
 * - تعديل البيانات والصلاحيات وحالة الأجهزة
 * - حذف الحسابات
 *
 * المكونات المستخدمة (مجلد _components/):
 * - PermissionsGrid: شبكة تحديد الصلاحيات
 * - AddUserModal: نافذة إضافة مسؤول جديد
 * - UserDetailModal: نافذة تعديل تفاصيل المستخدم
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import AdminPageShell from '@/components/AdminPageShell';

const FILTER_ALL = 'all';
const ROLE_ADMIN = 'admin';
const ROLE_SUPER_ADMIN = 'super_admin';
const ROLE_MANAGER = 'manager';
const rawText = (value: string) => value;

// ── المكونات المقسمة ──
import { AddUserModal, UserDetailModal, type User } from './_components/UserModals';

// ── أنواع البيانات ──
interface RawUser {
    _id?: string; id?: string; name: string; email?: string;
    username?: string; phone?: string; role: string;
    status?: string; createdAt: string;
    boundDevices?: User['boundDevices']; isDeviceLocked?: boolean; permissions?: string[];
}

export default function AdminUsersPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    // ── حالات الصفحة ──
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState(FILTER_ALL);         // الفلتر الحالي (الكل / عملاء / مسؤولين...)
    const [searchTerm, setSearchTerm] = useState('');    // نص البحث
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);   // نافذة إضافة مسؤول
    const [selectedUser, setSelectedUser] = useState<User | null>(null); // المستخدم المحدد للتعديل

    // ── إحصائيات سريعة ──
    const [stats, setStats] = useState({ total: 0, buyers: 0, sellers: 0, admins: 0, active: 0 });

    // ── جلب المستخدمين من الـ API ──
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = {};
            if (filter !== FILTER_ALL) params.role = filter;
            if (searchTerm) params.search = searchTerm;
            params.limit = 100;

            const res = await api.users.list(params);
            const list: RawUser[] = Array.isArray(res?.data) ? res.data : [];

            // تحويل البيانات الخام إلى الصيغة المطلوبة
            setUsers(list.map(u => ({
                id: u._id || u.id || '',
                name: u.name, email: u.email, username: u.username, phone: u.phone,
                role: u.role,
                isActive: (u.status || 'active') === 'active',
                createdAt: u.createdAt,
                boundDevices: u.boundDevices,
                isDeviceLocked: u.isDeviceLocked,
                permissions: u.permissions
            })));

            // حساب الإحصائيات السريعة
            setStats({
                total: res?.pagination?.total || list.length,
                buyers: list.filter(u => u.role === 'buyer').length,
                sellers: list.filter(u => u.role === 'seller').length,
                admins: list.filter(u => [ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_MANAGER].includes(u.role)).length,
                active: list.filter(u => (u.status || 'active') === 'active').length,
            });
        } catch (err) {
            console.error('فشل تحميل المستخدمين:', err);
            showToast('فشل تحميل المستخدمين', 'error');
        } finally { setLoading(false); }
    }, [filter, searchTerm, showToast]);

    // إعادة التحميل عند تغيير الفلتر أو البحث
    useEffect(() => { loadUsers(); }, [loadUsers]);

    // ── دوال مساعدة لعرض الدور والألوان ──
    const getRoleLabel = (role: string) => {
        const map: Record<string, string> = {
            admin: 'مسؤول', super_admin: 'مسؤول عام',
            manager: 'مدير', buyer: 'عميل', seller: 'بائع'
        };
        return map[role] || role;
    };

    const getRoleColor = (role: string) => {
        if ([ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_MANAGER].includes(role))
            return 'bg-red-500/10 border-red-500/30 text-red-400';
        if (role === 'seller')
            return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    };

    // ── واجهة المستخدم ──
    return (
        <div className="relative min-h-screen text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            
            <AdminPageShell
                title={isRTL ? 'إدارة الأعضاء' : 'USER CTRL'}
                titleEn="USER MANAGEMENT SYSTEM"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <div className="flex items-center gap-2">
                            {/* زر تحديث القائمة */}
                            <button 
                                onClick={loadUsers} 
                                title={isRTL ? 'تحديث القائمة' : 'Refresh List'}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                            >
                                <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                            </button>
                            {/* زر إضافة مسؤول جديد */}
                            <button 
                                onClick={() => setShowAddModal(true)} 
                                title={isRTL ? 'إضافة مسؤول جديد' : 'Add New Admin'}
                                className="h-12 px-6 rounded-2xl bg-orange-500 text-black font-black text-xs uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'إضافة مسؤول' : 'ADD ADMIN'}
                            </button>
                    </div>
                }
            >

                {/* ─── الإحصائيات السريعة (قابلة للنقر كفلاتر) ─── */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: isRTL ? rawText('الكل') : rawText('ALL'), value: stats.total, key: FILTER_ALL, colorClass: rawText('text-white') },
                        { label: isRTL ? rawText('عملاء') : rawText('CLIENTS'), value: stats.buyers, key: rawText('buyer'), colorClass: rawText('text-blue-400') },
                        { label: isRTL ? rawText('بائعين') : rawText('SELLERS'), value: stats.sellers, key: rawText('seller'), colorClass: rawText('text-amber-400') },
                        { label: isRTL ? rawText('مسؤولين') : rawText('ADMINS'), value: stats.admins, key: ROLE_ADMIN, colorClass: rawText('text-orange-400') },
                        { label: isRTL ? rawText('نشطون') : rawText('ACTIVE'), value: stats.active, key: rawText('active'), colorClass: rawText('text-green-400') },
                    ].map((s, i) => (
                        <button key={s.key} onClick={() => setFilter(s.key)}
                            className={cn(
                                'ck-stat text-center ck-fade-up transition-all',
                                `ck-delay-${Math.min(i + 1, 4)}`,
                                // تمييز الفلتر المحدد
                                filter === s.key && 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                            )}>
                            <div className={cn('ck-stat-num', s.colorClass)}>{s.value}</div>
                            <div className="cockpit-mono text-[8px] text-white/30 uppercase tracking-widest mt-1">{s.label}</div>
                        </button>
                    ))}
                </div>

                {/* ─── حقل البحث ─── */}
                <div className="relative mb-6">
                    <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/30', isRTL ? 'right-4' : 'left-4')} />
                    <input type="text" placeholder={isRTL ? 'البحث عن عضو...' : 'Search members...'}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className={cn('ck-input', isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4')} />
                </div>

                {/* ─── جدول المستخدمين (للشاشات الكبيرة) ─── */}
                <div className="ck-card hidden md:block overflow-hidden">
                    <table className="ck-table">
                        <thead>
                            <tr>
                                <th>{isRTL ? rawText('العضو') : rawText('MEMBER')}</th>
                                <th>{isRTL ? rawText('الدور') : rawText('ROLE')}</th>
                                <th>{isRTL ? rawText('الصلاحيات') : rawText('PERMS')}</th>
                                <th>{isRTL ? rawText('الحالة') : rawText('STATUS')}</th>
                                <th>{isRTL ? rawText('إجراء') : rawText('ACTION')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // هيكل تحميل (skeleton)
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[1, 2, 3, 4, 5].map(k => <td key={k}><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5}>
                                    <div className="ck-empty">
                                        <div className="ck-empty-icon"><Users className="w-6 h-6" /></div>
                                        <p className="cockpit-mono text-sm">{isRTL ? rawText('لا توجد بيانات') : rawText('NO RECORDS')}</p>
                                    </div>
                                </td></tr>
                            ) : users.map(user => (
                                // صف المستخدم - قابل للنقر لفتح نافذة التعديل
                                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-orange-400/50" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{user.name}</div>
                                                <div className="cockpit-mono text-[10px] text-white/30">{user.email || user.username || user.phone || rawText('—')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={cn('ck-badge', getRoleColor(user.role))}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        {/* نعرض الصلاحيات فقط للمسؤولين */}
                                        {[ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_MANAGER].includes(user.role) ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="ck-badge ck-badge-info cockpit-mono">{user.permissions?.length || 0}</span>
                                                <span className="text-[9px] text-white/25">{isRTL ? rawText('صلاحية') : rawText('perms')}</span>
                                            </div>
                                        ) : <span className="text-white/20">{rawText('—')}</span>}
                                    </td>
                                    <td>
                                        <span className={cn('ck-badge ck-badge-live', user.isActive ? 'ck-badge-active' : 'ck-badge-danger')}>
                                            {user.isActive ? (isRTL ? rawText('نشط') : rawText('ACTIVE')) : (isRTL ? rawText('معطل') : rawText('OFF'))}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="ck-btn-ghost text-xs">{isRTL ? rawText('إدارة') : rawText('MANAGE')}</button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ─── بطاقات المستخدمين (للهاتف) ─── */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/2 animate-pulse border border-orange-500/10" />)
                    ) : users.map(user => (
                        <motion.div key={user.id} onClick={() => setSelectedUser(user)}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="ck-card p-4 cursor-pointer ck-hover-lift">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4 text-orange-400/50" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                        <div className="cockpit-mono text-[10px] text-white/30 truncate">{user.email || user.phone || rawText('—')}</div>
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
                        <div className="ck-empty">
                            <div className="ck-empty-icon"><Users className="w-6 h-6" /></div>
                            <p className="cockpit-mono">{isRTL ? rawText('لا توجد بيانات') : rawText('NO RECORDS')}</p>
                        </div>
                    )}
                </div>

            </AdminPageShell>

            {/* ─── النوافذ المنبثقة ─── */}
            <AnimatePresence>
                {/* نافذة إضافة مسؤول جديد */}
                {showAddModal && (
                    <AddUserModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={(u: User) => {
                            setUsers(prev => [u, ...prev]);
                            setShowAddModal(false);
                            showToast('✅ تم إنشاء الحساب بنجاح', 'success');
                        }}
                        isRTL={isRTL}
                    />
                )}

                {/* نافذة تفاصيل وتعديل المستخدم */}
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
