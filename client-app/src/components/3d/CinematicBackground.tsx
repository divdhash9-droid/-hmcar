"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles, Float, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function MovingGrid() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      // Move grid towards camera to simulate speed
      gridRef.current.position.z = (state.clock.elapsedTime * 2) % 10;
    }
  });

  return (
    <group ref={gridRef} position={[0, -2, 0]}>
      <gridHelper args={[100, 50, 0x333333, 0x111111]} position={[0, 0, 0]} />
      <gridHelper args={[100, 50, 0x333333, 0x111111]} position={[0, 0, -100]} />
    </group>
  );
}

function FloatingParticles() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sparkles 
        count={200} 
        scale={20} 
        size={4} 
        speed={0.4} 
        opacity={0.6}
        color="#c9a96e"
      />
      <Sparkles 
        count={100} 
        scale={15} 
        size={6} 
        speed={0.3} 
        opacity={0.4}
        color="#ffffff"
      />
    </Float>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#c9a96e" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <MovingGrid />
      <FloatingParticles />
      
      {/* Fog to hide the end of the grid */}
      <fog attach="fog" args={['#000000', 5, 30]} />
    </>
  );
}

export default function CinematicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
        <Scene />
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
