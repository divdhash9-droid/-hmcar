"use client";

import { useEffect, useRef, useState } from "react";
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
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.75;

    // Try to play — browsers need a user gesture or autoPlay attr
    const tryPlay = () => {
      video.play().catch(() => {
        setVideoFailed(true);
      });
    };

    // If video data already loaded, play immediately
    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
      video.addEventListener("error", () => setVideoFailed(true), { once: true });
    }

    return () => {
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0"
      style={{ height: height || "55vh" }}
    >
      {/* ── Mobile image (only < md) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${mobileImage})`, backgroundColor: "#050505" }}
      />

      {/* ── Desktop fallback image (shown on md+ under video) ── */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat hidden md:block"
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundColor: "#050505" }}
      />

      {/* ── Desktop video ── */}
      {!videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={fallbackImage}
          className="absolute inset-0 w-full h-full object-cover hidden md:block"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ── Animated gradient shimmer fallback (shows if video fails on desktop) ── */}
      {videoFailed && (
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1008] to-[#0a0a0a] animate-gradient-xy" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(ellipse at 20% 50%, rgba(201,169,110,0.15) 0%, transparent 60%)",
                "radial-gradient(ellipse at 80% 20%, rgba(201,169,110,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 80%, rgba(201,169,110,0.18) 0%, transparent 60%)",
                "radial-gradient(ellipse at 20% 50%, rgba(201,169,110,0.15) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* ── Dark cinematic overlay ── */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* ── Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* ── Grid lines (desktop only) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08] hidden md:block">
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/30 to-transparent" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a96e]/30 to-transparent" />
      </div>

      {children}
    </div>
  );
}
