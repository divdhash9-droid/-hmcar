"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CinematicVideoBackgroundProps {
  videoSrc?: string;
  fallbackImage?: string;   // desktop fallback if video fails
  mobileImage?: string;     // dedicated mobile background image
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
  const [videoReady, setVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // default true for SSR safety

  useEffect(() => {
    const mobile =
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;

    setIsMobile(mobile);

    if (!mobile && videoRef.current) {
      const video = videoRef.current;
      video.playbackRate = 0.7;
      video
        .play()
        .then(() => setVideoReady(true))
        .catch(() => {
          /* keep fallback image */
        });
      video.addEventListener("loadeddata", () => setVideoReady(true));
    }
  }, []);

  // Choose background: mobile gets its own image, desktop gets fallback (under video)
  const bgImage = isMobile ? mobileImage : fallbackImage;

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0"
      style={{ height: height || "55vh" }}
    >
      {/* ── Background image — always visible ── */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: isMobile ? "center center" : "center top",
          backgroundColor: "#050505",
        }}
      />

      {/* ── Desktop: video fades in over the image ── */}
      {!isMobile && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={fallbackImage}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"
            }`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ── Mobile: subtle shimmer on top of image ── */}
      {isMobile && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a96e]/5 via-transparent to-black/30" />
      )}

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

      {/* ── Cinematic grid lines (desktop only) ── */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        </div>
      )}

      {/* ── Light rays (desktop only for performance) ── */}
      {!isMobile && <LightRays />}

      {children}
    </div>
  );
}

function LightRays() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full w-32 bg-gradient-to-b from-transparent via-[#c9a96e]/5 to-transparent"
          initial={{ left: `${20 + i * 30}%`, transform: "rotate(15deg)" }}
          animate={{ x: [-100, 100], opacity: [0, 0.3, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
