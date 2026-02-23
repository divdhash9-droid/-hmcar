"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface CinematicVideoBackgroundProps {
  videoSrc?: string;
  fallbackImage?: string; // desktop image (under video)
  mobileImage?: string;   // mobile-only image
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
      videoRef.current.play().catch(() => { });
    }
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0"
      style={{ height: height || "55vh" }}
    >
      {/* ── Mobile background image (hidden on md+) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${mobileImage})`, backgroundColor: "#050505" }}
      />

      {/* ── Desktop: fallback image behind video (hidden on mobile) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundColor: "#050505" }}
      />

      {/* ── Desktop: video plays on top of fallback image (hidden on mobile) ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={fallbackImage}
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
        style={{ opacity: 0.85 }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* ── Dark cinematic overlay ── */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* ── Grid lines (desktop only) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-10 hidden md:block">
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
      </div>

      {children}
    </div>
  );
}
