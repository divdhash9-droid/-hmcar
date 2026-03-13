'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToFulfillment() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/orders?tab=special');
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-pulse text-orange-500 cockpit-mono text-xs uppercase tracking-widest">
                Redirecting to Fulfillment Hub...
            </div>
        </div>
    );
}
