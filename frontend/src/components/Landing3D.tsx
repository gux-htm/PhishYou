import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function NeuralNode({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[0.4 * scale, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
      points.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <Points ref={points} positions={particlePositions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff4f6d"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function FloatingRing({ position, rotation, color, scale = 1 }: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <torusGeometry args={[1, 0.05, 16, 100]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
    </Float>
  );
}

export function Landing3D() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ff4f6d" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#43d6c5" />

        {/* Central agent node */}
        <NeuralNode position={[0, 0, 0]} color="#ff4f6d" scale={1.2} />

        {/* Surrounding intelligence nodes */}
        <NeuralNode position={[2, 1, 0.5]} color="#43d6c5" scale={0.8} />
        <NeuralNode position={[-2, -1, 0.5]} color="#43d6c5" scale={0.8} />
        <NeuralNode position={[1.5, -1.5, -0.5]} color="#ff4f6d" scale={0.6} />
        <NeuralNode position={[-1.5, 1.5, -0.5]} color="#ff4f6d" scale={0.6} />

        {/* Orbital rings */}
        <FloatingRing
          position={[0, 0, 0]}
          rotation={[Math.PI / 3, 0, 0]}
          color="#ff4f6d"
          scale={2.5}
        />
        <FloatingRing
          position={[0, 0, 0]}
          rotation={[Math.PI / 6, Math.PI / 4, 0]}
          color="#43d6c5"
          scale={3.2}
        />

        {/* Particle field background */}
        <ParticleField />
      </Canvas>
    </div>
  );
}
