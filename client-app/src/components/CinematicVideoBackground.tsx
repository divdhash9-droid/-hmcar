"use client";

/**
 * مكون الخلفية السينمائية (Cinematic Video Background)
 * يعرض فيديو بدقة عالية كخلفية على أجهزة الكمبيوتر، وصورة ثابتة على الجوال لتوفير البيانات والبطارية.
 * يحتوي على طبقات مظلمة وتأثيرات سينمائية (Vignette) لإبراز المحتوى العلوي.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * مكون الخلفية السينمائية - يعرض فيديو على أجهزة الكمبيوتر وصورة على الجوال
 */
interface CinematicVideoBackgroundProps {
  videoSrc?: string;        // مسار الفيديو
  fallbackImage?: string;   // صورة احتياطية للكمبيوتر (تظهر أثناء تحميل الفيديو)
  mobileImage?: string;     // صورة مخصصة للجوال
  overlayOpacity?: number;  // درجة شفافية الطبقة المظلمة
  children?: React.ReactNode;
  height?: string;          // ارتفاع المكون
}

export default function CinematicVideoBackground({
  videoSrc = "/videos/hero.mp4",
  fallbackImage = "/images/photo_2026-02-07_22-24-18.jpg",
  mobileImage = "/images/mazad.jpg",
  overlayOpacity = 0.7,
  children,
  height,
}: CinematicVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null); // مرجع لعنصر الفيديو للتحكم البرمجي
  const [isDesktop, setIsDesktop] = useState(false); // حالة لتحديد ما إذا كان الجهاز كمبيوتر
  const [isLoaded, setIsLoaded] = useState(false); // هل تم تحميل المكون في المتصفح؟
  const [videoReady, setVideoReady] = useState(false); // هل الفيديو جاهز للتشغيل؟

  // التحقق من نوع الجهاز (كمبيوتر أم جوال) عند التحميل وتغير الحجم
  useEffect(() => {
    const checkViewport = () => setIsDesktop(window.innerWidth >= 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);

    // تأخير بسيط لضمان استقرار الواجهة قبل البدء
    const timer = setTimeout(() => setIsLoaded(true), 100);

    return () => {
      window.removeEventListener("resize", checkViewport);
      clearTimeout(timer);
    };
  }, []);

  // التحكم في تشغيل الفيديو وإعداده
  useEffect(() => {
    if (!isDesktop || !isLoaded) return;

    const video = videoRef.current;
    if (!video) return;

    // تقليل سرعة التشغيل لإضفاء لمسة سينمائية هادئة
    video.playbackRate = 0.75;

    const onPlay = () => setVideoReady(true);

    const play = () => {
      video.play()
        .then(() => setVideoReady(true))
        .catch(() => {
          // في حال فشل التشغيل التلقائي (بسبب قيود المتصفح)
          console.log("Video autoplay prevented");
        });
    };

    if (video.readyState >= 2) {
      play();
    } else {
      video.addEventListener("canplay", play, { once: true });
    }

    video.addEventListener("playing", onPlay);

    return () => {
      video.removeEventListener("playing", onPlay);
    };
  }, [isDesktop, isLoaded]);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0 bg-[#050505]"
      style={{ height: height || "100svh" }}
    >
      {/* ── صورة الخلفية للكمبيوتر (تظهر كاحتياط فقط) ── */}
      <AnimatePresence>
        {isDesktop && !videoReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{ zIndex: -2 }}
          >
            <Image
              src={fallbackImage}
              alt="Background"
              fill
              priority
              quality={75}
              className="object-cover opacity-50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── الفيديو: يظهر فقط على أجهزة الكمبيوتر ── */}
      {isDesktop && isLoaded && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{
            opacity: videoReady ? 0.85 : 0,
            zIndex: -1
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ── صورة الجوال: تظهر فقط عندما يكون العرض صغيراً ── */}
      {!isDesktop && (
        <div className="absolute inset-0 z-10">
          <Image
            src={mobileImage}
            alt="Mobile Background"
            fill
            priority
            quality={75}
            className="object-cover object-center"
          />
        </div>
      )}

      {/* ── الطبقة السينمائية المظلمة (Overlay) ── */}
      <motion.div
        className="absolute inset-0 z-20 bg-gradient-to-b from-black/50 via-black/20 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* ── تأثير التغطية الداكنة (Vignette) ── */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      {/* ── الخطوط السينمائية الدقيقة (للكمبيوتر فقط) ── */}
      {isDesktop && (
        <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.07]">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
        </div>
      )}

      {/* ── محتوى الصفحة (Children) ── */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}

