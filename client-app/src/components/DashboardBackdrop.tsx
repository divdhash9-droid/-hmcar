"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function DashboardBackdrop() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for mouse movement
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }; // Snappy but smooth
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -1 to 1
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Parallax transforms based on mouse spring values
  const bgX = useTransform(x, [-1, 1], ["-2%", "2%"]);
  const bgY = useTransform(y, [-1, 1], ["-2%", "2%"]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Main Background Video with parallax drift */}
      <motion.div
        className="absolute inset-[-5%] w-[110%] h-[110%]"
        style={{
          filter: "brightness(0.9) contrast(1.08)",
          x: bgX,
          y: bgY,
          scale: 1.05,
        }}
      >
        <video
          className="w-full h-full object-cover"
          src="/videos/carz.mp4"
          poster="/images/hmcar.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Fallback tint in case the video fails to load */}
        <div className="absolute inset-0 bg-[url('/images/hmcar.jpg')] bg-cover bg-center opacity-0" aria-hidden />
      </motion.div>
      
      {/* Overlay Gradient for UI readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
    </div>
  );
}
