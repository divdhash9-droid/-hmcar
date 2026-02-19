'use client';

import { Html, useProgress } from '@react-three/drei';
import { motion } from 'framer-motion';

export default function CinematicLoader() {
    const { progress } = useProgress();

    return (
        <Html center>
            <div className="flex flex-col items-center justify-center w-64 p-8 pointer-events-none">
                {/* Animated Rings */}
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-t-2 border-[#c5a059] rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-2 border-[#c5a059]/50 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-0 bg-[#c5a059]/10 rounded-full filter blur-xl animate-pulse"></div>
                </div>

                {/* Text and Progress */}
                <div className="text-center font-mono">
                    <h2 className="text-[#c5a059] text-sm tracking-[0.3em] font-bold mb-2 uppercase">
                        Loading Assets
                    </h2>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                            className="h-full bg-[#c5a059]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="text-white/40 text-xs">
                        {progress.toFixed(0)}% COMPLETE
                    </div>
                </div>
            </div>
        </Html>
    );
}
