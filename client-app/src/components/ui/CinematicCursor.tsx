'use client';

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CinematicCursor() {
    const [isVisible, setIsVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    const trailerX = useSpring(mouseX, { damping: 15, stiffness: 50 });
    const trailerY = useSpring(mouseY, { damping: 15, stiffness: 50 });

    useEffect(() => {
        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseDown = () => {
            // Add click effect if needed
        };

        window.addEventListener("mousemove", moveMouse);
        window.addEventListener("mousedown", handleMouseDown);

        return () => {
            window.removeEventListener("mousemove", moveMouse);
            window.removeEventListener("mousedown", handleMouseDown);
        };
    }, [isVisible, mouseX, mouseY]);

    if (typeof window === "undefined") return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-0 md:opacity-100">
            {/* Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 bg-luxury-gold rounded-full"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />

            {/* Glowing Trailer */}
            <motion.div
                className="fixed top-0 left-0 w-12 h-12 border border-luxury-gold/30 rounded-full"
                style={{
                    x: trailerX,
                    y: trailerY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            >
                <div className="absolute inset-0 bg-luxury-gold/5 blur-xl rounded-full" />
            </motion.div>
        </div>
    );
}
