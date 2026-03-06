'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Users,
    Shield,
    Search,
    ChevronLeft,
    Plus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";

interface Device {
    deviceId: string;
    browser: string;
    os: string;
    ip: string;
    lastUsedAt: string;
    isActive: boolean;
}

interface User {
    id: string;
    name: string;
    email?: string;
    username?: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    boundDevices?: Device[];
    isDeviceLocked?: boolean;
    permissions?: string[];
}

export default function AdminUsersPage() {
    const { isRTL } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        buyers: 0,
        sellers: 0,
        admins: 0,
        active: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            const params: Record<string, string | number> = {};
            if (filter !== 'all') params.role = filter;
            if (searchTerm) params.search = searchTerm;
            params.limit = 50;
            const res = await api.users.list(params);
            const list = Array.isArray(res?.data) ? res.data : [];
            setUsers(list.map((u: Record<string, any>) => ({
                id: u._id || u.id,
                name: u.name,
                email: u.email,
                username: u.username,
                phone: u.phone,
                role: u.role,
                isActive: (u.status || 'active') === 'active',
                createdAt: u.createdAt,
                boundDevices: u.boundDevices,
                isDeviceLocked: u.isDeviceLocked,
                permissions: u.permissions
            })));
            setStats({
                total: res?.pagination?.total || list.length,
                buyers: list.filter((u: any) => u.role === 'buyer').length,
                sellers: list.filter((u: any) => u.role === 'seller').length,
                admins: list.filter((u: any) => u.role === 'admin' || u.role === 'super_admin').length,
                active: list.filter((u: any) => (u.status || 'active') === 'active').length,
            });
        } catch (err) {
            console.error('Failed to load users', err);
        }
    }, [filter, searchTerm]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden text-right rtl">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-16">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all group w-fit">
                        <ChevronLeft className={cn("w-5 h-5 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>

                    <div className="flex items-center gap-5 mb-8">
                        <div className="h-[3px] w-16 bg-cinematic-neon-blue shadow-[0_0_15px_rgba(0,240,255,1)]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">User Management</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] mb-6">
                        {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'المستخدمين' : 'USERS'}</span>
                    </h1>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
                    {[
                        { label: isRTL ? 'الكل' : 'TOTAL', value: stats.total, key: 'all', color: 'text-white' },
                        { label: isRTL ? 'مشترين' : 'BUYERS', value: stats.buyers, key: 'buyer', color: 'text-cinematic-neon-blue' },
                        { label: isRTL ? 'بائعين' : 'SELLERS', value: stats.sellers, key: 'seller', color: 'text-cinematic-neon-yellow' },
                        { label: isRTL ? 'مسؤولين' : 'ADMINS', value: stats.admins, key: 'admin', color: 'text-cinematic-neon-red' },
                        { label: isRTL ? 'نشط' : 'ACTIVE', value: stats.active, key: 'active', color: 'text-green-400' },
                    ].map((stat) => (
                        <motion.button
                            key={stat.key}
                            onClick={() => setFilter(stat.key)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "glass-card p-8 bg-white/[0.01] border-white/5 text-center transition-all",
                                filter === stat.key && "border-cinematic-neon-blue/40 bg-cinematic-neon-blue/5 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
                            )}
                        >
                            <div className={cn("text-4xl font-black tracking-tighter mb-3", stat.color)}>{stat.value}</div>
                            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
                        </motion.button>
                    ))}
                </div>

                <div className="flex justify-end mb-8">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-cinematic-neon-blue text-black font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        {isRTL ? 'إضافة مستخدم' : 'ADD NEW USER'}
                    </motion.button>
                </div>

                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                        type="text"
                        placeholder={isRTL ? 'بحث عن مستخدم...' : 'SEARCH USERS...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                    />
                </div>

                <div className="glass-card bg-white/[0.01] border-white/5 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{isRTL ? 'المستخدم' : 'USER'}</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{isRTL ? 'الدور' : 'ROLE'}</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{isRTL ? 'الحالة' : 'STATUS'}</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{isRTL ? 'الإجراءات' : 'ACTIONS'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-all cursor-pointer"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <td className="p-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-white/40" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{user.name}</div>
                                                <div className="text-[10px] text-white/40">{user.email || user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-left">
                                        <span className={cn(
                                            "px-3 py-1 rounded border text-[9px] font-black uppercase tracking-widest",
                                            user.role === 'admin' ? "bg-cinematic-neon-red/10 border-cinematic-neon-red/30 text-cinematic-neon-red" :
                                                user.role === 'seller' ? "bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30 text-cinematic-neon-yellow" :
                                                    "bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30 text-cinematic-neon-blue"
                                        )}>
                                            {isRTL ? (user.role === 'admin' ? 'مسؤول' : user.role === 'seller' ? 'بائع' : 'مشتري') : user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-6 text-left">
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", user.isActive ? "text-green-400" : "text-red-400")}>
                                            {isRTL ? (user.isActive ? "نشط" : "غير نشط") : (user.isActive ? "ACTIVE" : "INACTIVE")}
                                        </span>
                                    </td>
                                    <td className="p-6 text-left">
                                        <button className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white border border-white/10 px-4 py-2 rounded hover:bg-white/5 transition-all">
                                            {isRTL ? 'إدارة' : 'MANAGE'}
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <AnimatePresence>
                    {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onAdd={(u: User) => { setUsers([...users, u]); setShowAddModal(false); }} isRTL={isRTL} />}
                    {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={(updated: User) => {
                        setUsers(users.map((u: User) => u.id === updated.id ? updated : u));
                        setSelectedUser(null);
                    }} isRTL={isRTL} />}
                </AnimatePresence>
            </main>
        </div>
    );
}

function AddUserModal({ onClose, onAdd, isRTL }: { onClose: () => void, onAdd: (u: User) => void, isRTL: boolean }) {
    const [formData, setFormData] = useState({ name: '', email: '', username: '', phone: '', password: '', role: 'buyer', permissions: [] as string[] });

    const togglePerm = (p: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.users.create(formData);
            if (res.success) {
                onAdd(res.data);
            }
        } catch (err) {
            console.error('Failed to create user', err);
            alert(isRTL ? 'فشل إنشاء المستخدم' : 'Failed to create user');
        }
    };

    const permissionsList = ['manage_cars', 'manage_auctions', 'manage_users', 'manage_settings', 'manage_concierge', 'manage_parts', 'view_analytics'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black border border-white/10 p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-black uppercase italic mb-6 text-white">{isRTL ? 'إضافة مستخدم جديد' : 'ADD NEW USER'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Name</label>
                            <input required className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white placeholder:text-white/20"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Username</label>
                            <input required className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white placeholder:text-white/20"
                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="username" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Email</label>
                            <input type="email" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white placeholder:text-white/20"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Password</label>
                            <input required type="password" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white placeholder:text-white/20"
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="role-select" className="text-[9px] font-black text-white/40 uppercase tracking-widest">Role</label>
                            <select id="role-select" title="Select User Role" className="w-full bg-white/5 border border-white/10 p-3 rounded-lg text-white"
                                value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="buyer">Buyer / Client</option>
                                <option value="admin">Admin / Staff</option>
                                <option value="seller">Seller</option>
                            </select>
                        </div>
                    </div>

                    {formData.role === 'admin' && (
                        <div className="space-y-4 border-t border-white/10 pt-6 text-left">
                            <h3 className="text-sm font-bold text-cinematic-neon-red uppercase tracking-widest">Admin Permissions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {permissionsList.map(perm => (
                                    <div key={perm} onClick={() => togglePerm(perm)}
                                        className={cn("p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-all",
                                            formData.permissions.includes(perm) ? "bg-cinematic-neon-red/20 border-cinematic-neon-red text-white" : "border-white/10 text-white/40 hover:border-white/30")}>
                                        <div className={cn("w-3 h-3 rounded-sm border", formData.permissions.includes(perm) ? "bg-cinematic-neon-red border-cinematic-neon-red" : "border-white/40")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{perm.replace('manage_', '').replace('view_', '').replace('_', ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 border border-white/10 hover:bg-white/5 text-white/60 font-black uppercase tracking-widest rounded-xl">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-cinematic-neon-blue !text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">Create User</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function UserDetailModal({ user, onClose, onUpdate, isRTL }: { user: User, onClose: () => void, onUpdate: (u: User) => void, isRTL: boolean }) {
    const [devices, setDevices] = useState<Device[]>(user.boundDevices || []);
    const [isDeviceLocked, setIsDeviceLocked] = useState(user.isDeviceLocked ?? true);
    const [permissions, setPermissions] = useState(user.permissions || []);

    const toggleDevice = (id: string) => {
        setDevices(devices.map((d: Device) => d.deviceId === id ? { ...d, isActive: !d.isActive } : d));
    };

    const togglePermission = (perm: string) => {
        setPermissions(permissions.includes(perm) ? permissions.filter((p: string) => p !== perm) : [...permissions, perm]);
    };

    const handleSave = async () => {
        try {
            const res = await api.users.update(user.id, {
                boundDevices: devices,
                isDeviceLocked,
                permissions
            });
            if (res.success) {
                onUpdate(res.data);
            }
        } catch (err) {
            console.error('Failed to update user', err);
            alert(isRTL ? 'فشل تحديث المستخدم' : 'Failed to update user');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-white/10 p-0 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left">
                <div className="p-8 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
                    <div>
                        <h2 className="text-3xl font-black uppercase italic text-white mb-2">{user.name}</h2>
                        <div className="flex gap-3">
                            <span className="px-2 py-1 bg-white/10 rounded text-[9px] font-bold uppercase tracking-widest">
                                {isRTL ? (user.role === 'admin' ? 'مسؤول' : user.role === 'seller' ? 'بائع' : 'مشتري') : user.role}
                            </span>
                            <span className="text-white/40 text-xs">{user.email || user.phone}</span>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close" title="Close Modal" className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft className="w-6 h-6 rotate-180" /></button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    {user.role === 'buyer' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-cinematic-neon-blue uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> {isRTL ? 'أمان الأجهزة' : 'Device Security'}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-white/40 uppercase">{isRTL ? 'قفل على الأجهزة المرتبطة' : 'Lock to Bound Devices'}</span>
                                    <div onClick={() => setIsDeviceLocked(!isDeviceLocked)} className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", isDeviceLocked ? "bg-cinematic-neon-blue" : "bg-white/10")}>
                                        <div className={cn("absolute top-1 w-3 h-3 bg-black rounded-full transition-all", isDeviceLocked ? "left-6" : "left-1")} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                {devices.map((dev: Device) => (
                                    <div key={dev.deviceId} className="p-4 border-b border-white/5 last:border-0 flex justify-between items-center hover:bg-white/5 transition-colors">
                                        <div>
                                            <div className="text-sm font-bold text-white mb-1">{dev.browser} {isRTL ? 'على' : 'on'} {dev.os}</div>
                                            <div className="text-[10px] text-white/40 font-mono">IP: {dev.ip} • Last: {new Date(dev.lastUsedAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("text-[8px] font-black uppercase tracking-widest", dev.isActive ? "text-green-500" : "text-red-500")}>
                                                {isRTL ? (dev.isActive ? 'موثوق' : 'محظور') : (dev.isActive ? "Trusted" : "Blocked")}
                                            </span>
                                            <button onClick={() => toggleDevice(dev.deviceId)} className={cn("px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all", dev.isActive ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white")}>
                                                {isRTL ? (dev.isActive ? 'حظر' : 'إلغاء الحظر') : (dev.isActive ? "Block" : "Unblock")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {devices.length === 0 && <div className="p-8 text-center text-white/20 text-xs uppercase tracking-widest">{isRTL ? 'لا توجد أجهزة مربوطة' : 'No devices bound'}</div>}
                            </div>
                        </div>
                    )}

                    {user.role === 'admin' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-cinematic-neon-red uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4" /> {isRTL ? 'صلاحيات الوصول' : 'Access Control'}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {['manage_cars', 'manage_auctions', 'manage_users', 'manage_settings', 'manage_concierge', 'view_analytics'].map(perm => (
                                    <div key={perm} onClick={() => togglePermission(perm)}
                                        className={cn("p-4 border rounded-xl cursor-pointer transition-all",
                                            permissions.includes(perm) ? "bg-cinematic-neon-red/10 border-cinematic-neon-red text-white shadow-[0_0_10px_rgba(255,0,60,0.1)]" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                                        <div className="text-[10px] font-black uppercase tracking-widest mb-1">
                                            {isRTL
                                                ? (perm.includes('cars') ? 'السيارات' :
                                                    perm.includes('auctions') ? 'المزادات' :
                                                        perm.includes('users') ? 'المستخدمين' :
                                                            perm.includes('settings') ? 'الإعدادات' :
                                                                perm.includes('concierge') ? 'الكونسيرج' :
                                                                    'التحليلات')
                                                : perm.replace('manage_', '').replace('view_', '').replace('_', ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl border border-white/10 text-white/60 font-black uppercase tracking-widest hover:bg-white/5">
                        {isRTL ? 'إغلاق' : 'Close'}
                    </button>
                    <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-cinematic-neon-blue transition-colors">
                        {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
