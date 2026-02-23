"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CinematicVideoBackgroundProps {
  videoSrc?: string;
  fallbackImage?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  height?: string;
}

export default function CinematicVideoBackground({
  videoSrc = "/videos/hero.mp4",
  fallbackImage = "/images/photo_2026-02-07_22-24-18.jpg",
  overlayOpacity = 0.7,
  children,
  height
}: CinematicVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // default true for SSR safety

  useEffect(() => {
    // Detect mobile/tablet
    const mobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
    setIsMobile(mobile);

    if (!mobile && videoRef.current) {
      const video = videoRef.current;
      video.playbackRate = 0.7;
      video.play().then(() => {
        setVideoReady(true);
      }).catch(() => {
        // Video failed, keep fallback image
      });
      video.addEventListener("loadeddata", () => setVideoReady(true));
    }
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 overflow-hidden z-0"
      style={{ height: height || "55vh" }}
    >
      {/* Always visible fallback image — shows instantly on mobile */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />

      {/* Video — only rendered on non-mobile, fades in when ready */}
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

      {/* Dark cinematic overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 1.5 }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.8) 100%)"
        }}
      />

      {/* Cinematic grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
      </div>

      {/* Animated light rays — desktop only for performance */}
      {!isMobile && <LightRays />}

      {children}
    </div>
  );
}

// Animated Light Rays
function LightRays() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full w-32 bg-gradient-to-b from-transparent via-[#c9a96e]/5 to-transparent"
          initial={{ left: `${20 + i * 30}%`, transform: "rotate(15deg)" }}
          animate={{ x: [-100, 100], opacity: [0, 0.3, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: i * 3, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

