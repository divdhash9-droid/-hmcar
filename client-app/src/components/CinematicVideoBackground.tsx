"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface CinematicVideoBackgroundProps {
  videoSrc?: string;
  fallbackImage?: string;
  mobileImage?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  height?: string;
}

export default function CinematicVideoBackground({
  videoSrc = "/videos/hero.mp4",
  fallbackImage = "/images/photo_2026-02-07_22-24-18.jpg",
  mobileImage = "/images/mazad.jpg",
  overlayOpacity = 0.7,
  children,
  height,
}: CinematicVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsDesktop(window.innerWidth >= 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);

    // نستخدم timeout لتجنب التحميل المتزامن الذي قد يبطئ الواجهة
    const timer = setTimeout(() => setIsLoaded(true), 100);

    return () => {
      window.removeEventListener("resize", checkViewport);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || !isLoaded) return;

    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.75;

    const play = () => video.play().catch(() => { });

    if (video.readyState >= 2) {
      play();
    } else {
      video.addEventListener("canplay", play, { once: true });
    }
  }, [isDesktop, isLoaded]);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0 bg-[#050505]"
      style={{ height: height || "100svh" }}
    >
      {/* ── Base Fallback Image (Desktop) ── */}
      <Image
        src={fallbackImage}
        alt="Background"
        fill
        priority
        quality={75}
        className="object-cover object-top"
        style={{ zIndex: -2 }}
      />

      {/* ── Video: Desktop only ── */}
      {isDesktop && isLoaded && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: 0.85 }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ── Mobile image overlay ── */}
      <div className="absolute inset-0 z-10 md:hidden">
        <Image
          src={mobileImage}
          alt="Mobile Background"
          fill
          priority
          quality={75}
          className="object-cover object-center"
        />
      </div>

      {/* ── Dark cinematic overlay ── */}
      <motion.div
        className="absolute inset-0 z-20 bg-gradient-to-b from-black/50 via-black/20 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Vignette ── */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      {/* ── Cinematic grid lines (desktop only) ── */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.07] hidden md:block">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}
