"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

    // Disable floating back button
    const showBackButton = false;

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Floating Back Button Container */}
            {showBackButton && null}

            {/* Main Content with Cinematic Transition */}
            <main className="flex-grow">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "linear" }}
                        className="min-h-screen"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
