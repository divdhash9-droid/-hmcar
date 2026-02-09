"use client";

import { usePathname } from "next/navigation";
import CinematicBackButton from "@/components/ui/CinematicBackButton";

interface ClientLayoutWrapperProps {
    children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
    const pathname = usePathname();

    // Show back button on all pages EXCEPT:
    // - The home page ('/')
    // - Login/Register pages if we want them clean (optional, but requested 'all client pages')
    // - Admin pages (they have their own navigation usually, but let's stick to client request "all client pages")

    // Let's hide it on home page only as that's the entry point
    const showBackButton = pathname !== "/";

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Floating Back Button Container */}
            {showBackButton && (
                <div className="fixed top-24 right-4 z-40 md:top-28 md:right-8 animate-fade-in print:hidden">
                    <CinematicBackButton />
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}
