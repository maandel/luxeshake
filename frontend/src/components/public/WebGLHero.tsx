"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PresentationControls, ContactShadows, Lightformer } from "@react-three/drei";
import * as THREE from "three";

// A placeholder for our realistic 3D beverage model
const CupModel = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Gentle constant rotation
      meshRef.current.rotation.y -= delta * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Cup Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1.2, 0.9, 3, 32]} />
        <meshPhysicalMaterial 
          color="#1a1a1a"
          metalness={0.1}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>
      
      {/* Golden Rim */}
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[1.2, 0.05, 16, 100]} />
        <meshStandardMaterial color="#f2ca50" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Coffee/Liquid Top */}
      <mesh position={[0, 1.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 32]} />
        <meshStandardMaterial color="#3c2f00" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const WebGLHero: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        <color attach="background" args={["#16130b"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <PresentationControls 
          global 
          config={{ mass: 2, tension: 500 }} 
          snap={{ mass: 4, tension: 1500 }} 
          rotation={[0, 0.3, 0]} 
          polar={[-Math.PI / 3, Math.PI / 3]} 
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
            <CupModel />
          </Float>
        </PresentationControls>

        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 4, -0.3, 0]}>
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
            <Lightformer rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[20, 0.5, 1]} />
            <Lightformer rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
          </group>
        </Environment>
      </Canvas>
    </div>
  );
};
