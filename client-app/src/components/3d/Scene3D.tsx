'use client';

import { Canvas } from '@react-three/fiber';
import {
    Environment,
    OrbitControls,
    PerspectiveCamera,
    SpotLight,
    Float,
    Stars,
    MeshReflectorMaterial
} from '@react-three/drei';
import {
    EffectComposer,
    Bloom,
    ChromaticAberration,
    Noise,
    Vignette
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';
import CinematicLoader from './CinematicLoader';
import { useFrame } from '@react-three/fiber';

// --- Components ---

function HeroCarPlaceholder() {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group ref={meshRef}>
            {/* Abstract Car Shape - Using geometric primitives with high-quality materials */}

            {/* Main Body */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.5, 4.5]} />
                <meshPhysicalMaterial
                    color="#111"
                    metalness={0.9}
                    roughness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    envMapIntensity={1.5}
                />
            </mesh>

            {/* Top Cabin */}
            <mesh position={[0, 1.1, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[1.8, 0.7, 2.5]} />
                <meshPhysicalMaterial
                    color="#000"
                    metalness={1}
                    roughness={0}
                    transmission={0.5}
                    thickness={1}
                />
            </mesh>

            {/* Glowing Accents (Headlights/Taillights) */}
            <mesh position={[0, 0.5, 2.26]}>
                <boxGeometry args={[1.8, 0.1, 0.05]} />
                <meshBasicMaterial color="#c5a059" toneMapped={false} />
            </mesh>

            <mesh position={[0, 0.5, -2.26]}>
                <boxGeometry args={[1.8, 0.1, 0.05]} />
                <meshBasicMaterial color="#ff0000" toneMapped={false} />
            </mesh>

            {/* Wheels */}
            {[[-1.1, 0.4, 1.5], [1.1, 0.4, 1.5], [-1.1, 0.4, -1.5], [1.1, 0.4, -1.5]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                    <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={2048}
                mixBlur={1}
                mixStrength={40}
                roughness={1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#080808"
                metalness={0.5}
                mirror={0}
            />
        </mesh>
    );
}

function FloatingParticles() {
    const count = 100;

    // Generate deterministic particles to satisfy React purity rules
    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => {
            const t = i / count;
            const angle = t * Math.PI * 2 * 20; // Spiral pattern
            const radius = 5 + Math.sin(t * Math.PI * 5) * 5;
            return {
                position: [
                    Math.cos(angle) * radius,
                    (i % 10) * 0.5, // Spread in height
                    Math.sin(angle) * radius
                ] as [number, number, number],
                key: i
            };
        });
    }, []);

    return (
        <group>
            {particles.map((particle, i) => (
                <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
                    <mesh position={particle.position}>
                        <sphereGeometry args={[0.02, 8, 8]} />
                        <meshBasicMaterial color="#c5a059" transparent opacity={0.6} />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

// --- Main Scene Component ---

export default function Scene3D() {
    return (
        <div className="w-full h-full absolute inset-0 -z-10">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: false }}>
                <Suspense fallback={<CinematicLoader />}>

                    {/* Camera */}
                    <PerspectiveCamera makeDefault position={[5, 3, 6]} fov={50} />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        maxPolarAngle={Math.PI / 2 - 0.1}
                        autoRotate
                        autoRotateSpeed={0.5}
                    />

                    {/* Environment & Lighting (Studio Setup) */}
                    <ambientLight intensity={0.5} />

                    {/* Key Light */}
                    <SpotLight
                        position={[10, 10, 10]}
                        angle={0.5}
                        penumbra={1}
                        intensity={2}
                        castShadow
                        shadow-bias={-0.0001}
                        color="#ffffff"
                    />

                    {/* Fill Light (Gold) */}
                    <SpotLight
                        position={[-10, 5, -10]}
                        angle={0.5}
                        penumbra={1}
                        intensity={2}
                        color="#c5a059"
                    />

                    {/* Rim Light (Blue) */}
                    <SpotLight
                        position={[0, 5, -10]}
                        angle={0.5}
                        penumbra={1}
                        intensity={1.5}
                        color="#00f0ff"
                    />

                    {/* Scene Objects */}
                    <HeroCarPlaceholder />
                    <Floor />
                    <FloatingParticles />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    {/* Post Processing Effects */}
                    <EffectComposer>
                        <Bloom
                            luminanceThreshold={1}
                            mipmapBlur
                            intensity={1.5}
                            radius={0.6}
                        />
                        <ChromaticAberration
                            blendFunction={BlendFunction.NORMAL}
                            offset={new THREE.Vector2(0.002, 0.002)}
                        />
                        <Noise opacity={0.05} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>

                </Suspense>
            </Canvas>
        </div>
    );
}
