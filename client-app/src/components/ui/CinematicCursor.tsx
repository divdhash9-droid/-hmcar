'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CinematicCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
        if (!visible) setVisible(true);
    }, [visible]);

    const handleMouseLeave = useCallback(() => setVisible(false), []);
    const handleMouseEnter = useCallback(() => setVisible(true), []);

    useEffect(() => {
        // Skip on mobile/touch
        if (window.matchMedia('(hover: none)').matches) return;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [handleMouseMove, handleMouseLeave, handleMouseEnter]);

    if (!visible) return null;

    return (
        <div
            className="pointer-events-none fixed z-[9999] rounded-full mix-blend-screen"
            style={{
                left: position.x - 200,
                top: position.y - 200,
                width: 400,
                height: 400,
                background: 'radial-gradient(circle, rgba(201, 169, 110, 0.03) 0%, transparent 70%)',
                transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1), top 0.3s cubic-bezier(0.16,1,0.3,1)',
                willChange: 'left, top',
            }}
        />
    );
}
