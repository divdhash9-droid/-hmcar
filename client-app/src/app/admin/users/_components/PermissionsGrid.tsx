'use client';

/**
 * مكوّن شبكة الصلاحيات - PermissionsGrid
 * يعرض جميع صلاحيات النظام مع إمكانية تحديدها أو إلغائها
 * يُستخدم في: نموذج إضافة مسؤول جديد + تعديل مستخدم موجود
 */

import { Check, Car, Layers, Gavel, ShoppingCart, Users, Briefcase, Settings, FileText, Link2, Phone, BarChart2, MessageSquare, Star, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── قائمة جميع صلاحيات النظام ──
export const ALL_SYSTEM_PERMISSIONS = [
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
    { id: 'manage_messages', icon: MessageSquare, label: 'إدارة المحادثات', desc: 'الرد على رسائل العملاء', color: 'indigo' },
    { id: 'manage_brands', icon: Star, label: 'إدارة الوكالات', desc: 'إضافة وتعديل وكالات السيارات', color: 'pink' },
    { id: 'manage_notifications', icon: Bell, label: 'إدارة الإشعارات', desc: 'إرسال وإدارة إشعارات المستخدمين', color: 'violet' },
];

// ── خريطة الألوان لكل صلاحية ──
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

// ── خصائص المكوّن ──
interface PermissionsGridProps {
    permissions: string[];
    onChange: (perms: string[]) => void;
}

export default function PermissionsGrid({ permissions, onChange }: PermissionsGridProps) {
    // تبديل اختيار صلاحية (تحديد / إلغاء تحديد)
    const toggle = (id: string) =>
        onChange(permissions.includes(id)
            ? permissions.filter(x => x !== id)
            : [...permissions, id]
        );

    return (
        <div className="space-y-3">
            {/* رأس القسم: عداد + أزرار تحديد الكل / إلغاء الكل */}
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                    {permissions.length} / {ALL_SYSTEM_PERMISSIONS.length} صلاحية محددة
                </span>
                <div className="flex gap-2">
                    {/* زر تحديد الكل */}
                    <button type="button"
                        onClick={() => onChange(ALL_SYSTEM_PERMISSIONS.map(p => p.id))}
                        className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
                        تحديد الكل
                    </button>
                    {/* زر إلغاء الكل */}
                    <button type="button"
                        onClick={() => onChange([])}
                        className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                        إلغاء الكل
                    </button>
                </div>
            </div>

            {/* شبكة الصلاحيات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SYSTEM_PERMISSIONS.map(perm => {
                    const isSelected = permissions.includes(perm.id);
                    const colors = COLOR_MAP[perm.color] || COLOR_MAP.gray;
                    const Icon = perm.icon;
                    return (
                        <button
                            type="button"
                            key={perm.id}
                            onClick={() => toggle(perm.id)}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border text-right transition-all',
                                isSelected
                                    ? `${colors.bg} ${colors.border}`
                                    : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                            )}
                        >
                            {/* مربع الاختيار */}
                            <div className={cn(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                isSelected ? `${colors.check} border-transparent` : 'border-white/25 bg-transparent'
                            )}>
                                {isSelected && <Check className="w-3 h-3 text-black font-black" />}
                            </div>
                            {/* أيقونة الصلاحية */}
                            <div className={cn('flex-shrink-0', isSelected ? colors.text : 'text-white/30')}>
                                <Icon className="w-4 h-4" />
                            </div>
                            {/* اسم ووصف الصلاحية */}
                            <div className="flex-1 min-w-0 text-right">
                                <div className={cn('text-xs font-black', isSelected ? 'text-white' : 'text-white/50')}>{perm.label}</div>
                                <div className="text-[9px] text-white/25 truncate">{perm.desc}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* تحذير عند عدم تحديد أي صلاحية */}
            {permissions.length === 0 && (
                <p className="text-[10px] text-amber-400/70 text-center py-2">
                    ⚠️ لم يتم تحديد أي صلاحية - لن يتمكن من إدارة أي شيء
                </p>
            )}
        </div>
    );
}
