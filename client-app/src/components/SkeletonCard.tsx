'use client';

/**
 * [[ARABIC_COMMENT]] مكون شاشات الهيكل العظمي (Skeleton Screens)
 * يُعرض أثناء تحميل البيانات بدلاً من شاشة فارغة
 * يعطي المستخدم إحساساً بأن الموقع يعمل بسرعة
 */

// [[ARABIC_COMMENT]] Skeleton لبطاقة سيارة أو قطعة غيار
export function SkeletonCarCard() {
    return (
        <div className="glass-card bg-white/[0.01] border-white/5 overflow-hidden animate-pulse">
            {/* صورة وهمية */}
            <div className="h-56 bg-gradient-to-br from-white/5 to-white/[0.02]" />
            <div className="p-6 space-y-4">
                {/* ماركة */}
                <div className="h-2 w-16 bg-white/10 rounded-full" />
                {/* اسم */}
                <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                    <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                </div>
                {/* سعر */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="h-5 w-24 bg-white/10 rounded-full" />
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-white/5 rounded-lg" />
                        <div className="h-8 w-8 bg-white/5 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// [[ARABIC_COMMENT]] Skeleton لبطاقة الوكالة
export function SkeletonAgencyCard() {
    return (
        <div className="glass-card bg-white/[0.01] border-white/5 p-8 animate-pulse flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10" />
            <div className="space-y-2 text-center w-full">
                <div className="h-4 w-1/2 bg-white/10 rounded-full mx-auto" />
                <div className="h-2 w-2/3 bg-white/5 rounded-full mx-auto" />
            </div>
            <div className="h-9 w-full bg-white/5 rounded-xl" />
        </div>
    );
}

// [[ARABIC_COMMENT]] Skeleton لصف في الجدول (صفحة الأدمن)
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
    return (
        <tr className="border-b border-white/5 animate-pulse">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-6">
                    <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded-full w-3/4" />
                        {i === 0 && <div className="h-2 bg-white/5 rounded-full w-1/2" />}
                    </div>
                </td>
            ))}
        </tr>
    );
}

// [[ARABIC_COMMENT]] Skeleton لبطاقة إحصائية في الداشبورد
export function SkeletonStatCard() {
    return (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse space-y-4">
            <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="h-4 w-12 bg-white/5 rounded-full" />
            </div>
            <div className="h-7 w-20 bg-white/10 rounded-full" />
            <div className="h-2 w-28 bg-white/5 rounded-full" />
        </div>
    );
}

// [[ARABIC_COMMENT]] Skeleton لعناصر قائمة بسيطة
export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/5 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                <div className="h-2 w-1/3 bg-white/5 rounded-full" />
            </div>
            <div className="h-6 w-16 bg-white/5 rounded-full" />
        </div>
    );
}

// [[ARABIC_COMMENT]] Grid من skeleton cards
export function SkeletonGrid({ count = 6, type = 'car' }: { count?: number; type?: 'car' | 'agency' }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                type === 'car' ? <SkeletonCarCard key={i} /> : <SkeletonAgencyCard key={i} />
            ))}
        </div>
    );
}
