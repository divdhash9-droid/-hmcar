"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hero3DProps {
  isRTL?: boolean;
}

export default function Hero3D({ isRTL = true }: Hero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  const textContent = {
    subtitle: isRTL ? "منصة المزادات الفاخرة" : "Luxury Auction Platform",
    title1: isRTL ? "اكتشف" : "Discover",
    title2: isRTL ? "التميز" : "Excellence",
    description: isRTL
      ? "أكبر منصة لمزادات السيارات الفاخرة وقطع الغيار الأصلية من كوريا الجنوبية مباشرة إلى بابك"
      : "The largest platform for luxury car auctions and genuine spare parts from South Korea, delivered to your door",
    searchPlaceholder: isRTL ? "ابحث عن سيارتك (مثال: كامري 2024)" : "Search your car (e.g. Camry 2024)",
    typewriterTexts: isRTL
      ? ["الفخامة...", "الأداء...", "المستقبل..."]
      : ["Luxury...", "Performance...", "The Future..."],
  };

  const [typewriterIndex, setTypewriterIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypewriterIndex((prev) => (prev + 1) % textContent.typewriterTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [textContent.typewriterTexts.length]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-transparent"
    >
      {/* 
        VIDEO BACKGROUND 
        User should replace '/videos/hero-car.mp4' with their actual video path.
      */}
      {/* Video removed - handled in HomeClient for global background */}


      {/* Main Content */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20"
        style={{ opacity, scale, y }}
      >
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 backdrop-blur-md shadow-[0_0_20px_rgba(201,169,110,0.2)]">
            <Sparkles className="w-4 h-4 text-[#c9a96e] animate-pulse" />
            <span className="text-sm font-bold text-[#c9a96e] tracking-widest uppercase">
              {textContent.subtitle}
            </span>
          </div>
        </motion.div>

        {/* Main Title with Typewriter */}
        <div className="text-center mb-6 md:mb-8 relative flex flex-col items-center w-full max-w-[90vw]">
          <motion.h1
            className="font-display text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight text-white mb-2 leading-[1.1]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {textContent.title1}
          </motion.h1>

          <div className="h-[1.2em] sm:h-[1.5em] overflow-visible flex items-center justify-center min-w-[200px] sm:min-w-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={typewriterIndex}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: "circOut" }}
                // Reduced font size for mobile
                className="font-display text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tight gradient-text-gold leading-[1.2] py-2"
              >
                {textContent.typewriterTexts[typewriterIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Glassmorphism Smart Search */}
        <motion.div
          className="w-full max-w-[90%] md:max-w-4xl mt-8 md:mt-12 relative z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="relative group perspective-1000">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#c9a96e] via-white/20 to-[#c9a96e] rounded-full opacity-30 group-hover:opacity-70 blur-lg transition duration-1000 group-hover:duration-200"></div>

            {/* Search Container */}
            <div className="relative p-1.5 md:p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center shadow-2xl transition-all duration-300 group-hover:shadow-[0_0_50px_rgba(201,169,110,0.2)] hover:bg-black/80">

              {/* Search Icon */}
              <div className="pl-4 pr-3 md:pl-6 md:pr-4">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-white/50 group-focus-within:text-[#c9a96e] transition-colors" />
              </div>

              {/* Input */}
              <input
                type="text"
                placeholder={textContent.searchPlaceholder}
                className="w-full bg-transparent border-none text-white text-base md:text-lg placeholder:text-white/30 focus:outline-none focus:ring-0 font-medium py-2.5 md:py-3"
              />

              {/* Action Button */}
              <button className="hidden sm:flex items-center gap-2 bg-[#c9a96e] text-black px-6 sm:px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#d4b57d] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(201,169,110,0.4)] whitespace-nowrap">
                <span className="text-xs sm:text-sm">{isRTL ? "بحث" : "Search"}</span>
                <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </button>

              {/* Mobile Button */}
              <div className="flex sm:hidden p-3 bg-[#c9a96e] rounded-full text-black items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
              </div>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs sm:text-sm text-white/40">
            <span className="hover:text-[#c9a96e] cursor-pointer transition-colors px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-[#c9a96e]/30">#Toyota</span>
            <span className="hover:text-[#c9a96e] cursor-pointer transition-colors px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-[#c9a96e]/30">#Hyundai</span>
            <span className="hover:text-[#c9a96e] cursor-pointer transition-colors px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-[#c9a96e]/30">#SpareParts</span>
            <span className="hover:text-[#c9a96e] cursor-pointer transition-colors px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-[#c9a96e]/30">#Engines</span>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-4 group"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold text-white/40 group-hover:text-[#c9a96e] transition-colors">
              {isRTL ? "التمرير للاكتشاف" : "Scroll to Explore"}
            </span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent relative overflow-hidden group-hover:via-[#c9a96e]/50 transition-colors">
              <motion.div
                className="absolute top-0 left-0 w-full h-1/2 bg-[#c9a96e] shadow-[0_0_10px_#c9a96e]"
                animate={{ top: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <style jsx global>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
}
