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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.7; // Slow cinematic speed
      // Ensure video plays
      video.play().catch(e => console.error("Video play error:", e));
      video.addEventListener("loadeddata", () => setIsLoaded(true));
      video.addEventListener("error", () => setHasError(true));
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 overflow-hidden z-0" style={{ height: height || "55vh" }}>
      {/* Video Layer */}
      <div className="absolute inset-0">
        {!hasError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            poster={fallbackImage}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${fallbackImage})` }}
          />
        )}
      </div>

      {/* Cinematic Dust/Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <CinematicDust />
      </div>

      {/* Dark Cinematic Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        style={{ opacity: overlayOpacity }}
      />

      {/* Vignette Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.8) 100%)"
        }}
      />

      {/* Cinematic Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
      </div>

      {/* Animated Light Rays */}
      <LightRays />

      {/* Children content */}
      {children}
    </div>
  );
}

// Cinematic Dust Particles Component
function CinematicDust() {
  // Use a fixed seed or simple deterministic generation to avoid hydration mismatch
  // However, Math.random() in render is the cause. We need to move it to useEffect.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#c9a96e]/30"
          initial={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated Light Rays Component
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
          initial={{
            left: `${20 + i * 30}%`,
            transform: "rotate(15deg)",
          }}
          animate={{
            x: [-100, 100],
            opacity: [0, 0.3, 0],
          }}
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
