"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.75;

    const play = () => video.play().catch(() => { });

    if (video.readyState >= 2) {
      play();
    } else {
      video.addEventListener("canplay", play, { once: true });
    }
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0"
      style={{ height: height || "100svh" }}
    >
      {/* ── Desktop fallback image (always rendered, under video) ── */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundColor: "#050505" }}
      />

      {/* ── Video: ALWAYS rendered so browser loads & plays it ──
           On desktop it's visible. Mobile image covers it via z-index below. ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={fallbackImage}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.85 }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* ── Mobile image overlay: covers the video only on small screens ──
           Uses z-10 to appear ABOVE the video, hidden on md+ ── */}
      <div
        className="absolute inset-0 z-10 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${mobileImage})`,
          backgroundColor: "#050505",
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      />

      {/* ── Dark cinematic overlay (above video, below mobile image) ── */}
      <motion.div
        className="absolute inset-0 z-20 bg-gradient-to-b from-black/50 via-black/20 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Vignette ── */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* ── Cinematic grid lines (desktop only via opacity) ── */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.07] hidden md:block">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/25 to-transparent" />
      </div>

      {/* ── Content sits above everything ── */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}
