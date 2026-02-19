"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Float, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, ChevronDown } from "lucide-react";
import * as THREE from "three";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollytellingHeroProps {
  isRTL?: boolean;
}

// 3D Car Component (Placeholder for GLTF Model)
function Car3D({ scrollProgress }: { scrollProgress: number }) {
  const carRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (carRef.current) {
      // Smooth rotation based on scroll
      const targetRotationY = scrollProgress * Math.PI * 2;
      carRef.current.rotation.y = THREE.MathUtils.lerp(carRef.current.rotation.y, targetRotationY, 0.1);

      // Mouse interaction (Parallax/Rotation effect)
      // Allow user to slightly rotate the car with mouse hover
      const mouseX = state.pointer.x * 0.5;
      const mouseY = state.pointer.y * 0.2;

      // Add mouse influence to rotations
      carRef.current.rotation.x = THREE.MathUtils.lerp(carRef.current.rotation.x, mouseY, 0.1);
      carRef.current.rotation.y += mouseX * 0.05;

      // Floating animation
      carRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  // NOTE: To use a real 3D model:
  // const { scene } = useGLTF("/models/car.glb");
  // return <primitive object={scene} ... />

  return (
    <group
      ref={carRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Car Body - Abstract Luxury Shape */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 1.8]} />
        <meshStandardMaterial
          color="#050505"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={2.5}
        />
      </mesh>

      {/* Car Roof / Glass Cockpit */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.5, 0.6, 1.4]} />
        <meshPhysicalMaterial
          color="#000000"
          metalness={1}
          roughness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          transmission={0.2}
          opacity={0.9}
        />
      </mesh>

      {/* Headlights - Emissive Neon */}
      <mesh position={[1.9, 0.1, 0.6]}>
        <boxGeometry args={[0.1, 0.2, 0.5]} />
        <meshStandardMaterial
          color="#c9a96e"
          emissive="#c9a96e"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[1.9, 0.1, -0.6]}>
        <boxGeometry args={[0.1, 0.2, 0.5]} />
        <meshStandardMaterial
          color="#c9a96e"
          emissive="#c9a96e"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>

      {/* Taillights - Emissive Red */}
      <mesh position={[-1.95, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.15, 1.8]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Wheels (Abstract Cylinders) */}
      {[[-1.2, -0.4, 0.8], [-1.2, -0.4, -0.8], [1.2, -0.4, 0.8], [1.2, -0.4, -0.8]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
          {/* Wheel Rims */}
          <mesh position={[0, -0.16, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.2, 0.3, 16]} />
            <meshStandardMaterial color="#c9a96e" metalness={1} roughness={0.1} emissive="#c9a96e" emissiveIntensity={0.5} />
          </mesh>
        </mesh>
      ))}

      {/* Underglow (Fake) via Point Light */}
      <pointLight position={[0, -1, 0]} color="#c9a96e" intensity={1} distance={4} decay={2} />
    </group>
  );
}

// Camera Controller
function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    // Cinematic Camera Path
    // Calculate angle based on scroll
    const angle = state.clock.elapsedTime * 0.05 + (scrollProgress * Math.PI * 1.5);

    // Dynamic Radius
    const radius = 7 - (scrollProgress * 1.5); // Slight zoom in

    // Dynamic Height
    const height = 2 + (scrollProgress * 2) + Math.sin(state.clock.elapsedTime * 0.2) * 0.2;

    // Smooth lerp for camera position would be ideal, but for scroll sync we often want direct mapping
    // We add some mouse parallax here too
    const parallaxX = state.pointer.x * 0.5;
    const parallaxY = state.pointer.y * 0.5;

    camera.position.x = Math.sin(angle) * radius + parallaxX;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = height + parallaxY;

    // Look a bit ahead of the car or at the car center
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Main Scrollytelling Component
export default function ScrollytellingHero({ isRTL = true }: ScrollytellingHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const textContent = {
    subtitle: isRTL ? "منصة المزادات الفاخرة" : "Luxury Auction Platform",
    scrollPrompt: isRTL ? "مرر للاستكشاف" : "Scroll to Explore",
    discover: isRTL ? "اكتشف" : "Discover",
    luxury: isRTL ? "الفخامة" : "Luxury",
    performance: isRTL ? "الأداء" : "Performance",
    future: isRTL ? "المستقبل" : "The Future",
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Smoother scrubbing
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    }, containerRef);

    setIsLoaded(true);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      {/* Sticky 3D Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* 3D Scene */}
        <div className="absolute inset-0 z-0">
          <Canvas
            shadows
            dpr={[1, 2]} // High DPI
            gl={{
              antialias: false,
              alpha: true,
              toneMapping: THREE.ReinhardToneMapping,
              toneMappingExposure: 1.5
            }}
            style={{ background: "transparent" }}
          >
            <PerspectiveCamera makeDefault position={[5, 2, 5]} fov={50} />
            <CameraController scrollProgress={scrollProgress} />

            {/* High-end Lighting Setup */}
            <ambientLight intensity={0.2} />
            <spotLight
              position={[10, 10, 10]}
              angle={0.5}
              penumbra={1}
              intensity={2}
              castShadow
              color="#fff"
            />
            {/* Rim Light for that cinematic edge */}
            <spotLight
              position={[-10, 5, -5]}
              angle={0.5}
              penumbra={1}
              intensity={5}
              color="#c9a96e"
            />

            {/* Environment */}
            <Environment preset="city" />

            {/* Content */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
              <Car3D scrollProgress={scrollProgress} />
            </Float>

            {/* Floor Reflections */}
            <ContactShadows
              resolution={1024}
              scale={50}
              blur={2}
              opacity={0.5}
              far={10}
              color="#000"
            />

            {/* Post Processing Effects - Bloom for 'Glowy' feel */}
            <EffectComposer enableNormalPass={false}>
              <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
              <Vignette eskil={false} offset={0.1} darkness={0.5} />
            </EffectComposer>
          </Canvas>
        </div>

        {/* UI Overlay - "Glowy" & "Bold" */}
        <div className="absolute inset-0 z-10 pointer-events-none select-none">

          {/* Top Badge */}
          <motion.div
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-[#c9a96e]/50 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(201,169,110,0.3)]">
              <Sparkles className="w-5 h-5 text-[#c9a96e] animate-pulse" />
              <span className="text-sm font-bold text-[#c9a96e] tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(201,169,110,0.8)]">
                {textContent.subtitle}
              </span>
            </div>
          </motion.div>

          {/* Dynamic Text Overlay based on Scroll Progress */}

          {/* Section 1: Discover Luxury */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-4 md:px-16 flex flex-col items-start">
            <motion.div
              className="max-w-4xl"
              style={{
                opacity: Math.max(0, 1 - scrollProgress * 3),
                y: scrollProgress * -100
              }}
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e8dcb5] to-[#c9a96e] mb-4 font-display leading-[1.1] drop-shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                {textContent.discover}
              </h1>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white font-display leading-[1.1]" style={{ textShadow: "0 0 50px rgba(255,255,255,0.3)" }}>
                {textContent.luxury}
              </h1>
            </motion.div>
          </div>

          {/* Section 2: Performance (Appears mid-scroll) */}
          <motion.div
            className="absolute top-1/2 right-0 w-full -translate-y-1/2 px-4 md:px-16 flex flex-col items-end text-right"
            style={{
              opacity: Math.max(0, Math.min(1, (scrollProgress - 0.2) * 4) - (scrollProgress - 0.6) * 4),
            }}
          >
            <h2 className="text-5xl md:text-8xl font-black text-white font-display drop-shadow-[0_0_40px_rgba(201,169,110,0.5)]">
              {textContent.performance}
            </h2>
          </motion.div>

          {/* Section 3: The Future (Appears end-scroll) */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full"
            style={{
              opacity: Math.max(0, (scrollProgress - 0.7) * 4),
              scale: 0.8 + scrollProgress * 0.2
            }}
          >
            <h2 className="text-5xl md:text-8xl font-black text-[#c9a96e] font-display drop-shadow-[0_0_60px_rgba(201,169,110,0.8)]">
              {textContent.future}
            </h2>
          </motion.div>

          {/* Scroll Prompt */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            animate={{ opacity: scrollProgress > 0.1 ? 0 : 1 }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-white/70 font-bold drop-shadow-md">
              {textContent.scrollPrompt}
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-[#c9a96e] drop-shadow-[0_0_10px_rgba(201,169,110,1)]" />
            </motion.div>
          </motion.div>

          {/* Progress Bar (Vertical) */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 h-64 w-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="w-full bg-[#c9a96e] shadow-[0_0_20px_#c9a96e]"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

        </div>
      </div>

      {/* Invisible spacers to create scroll height */}
      <div className="h-screen" />
      <div className="h-screen" />
      <div className="h-screen" />
    </div>
  );
}
