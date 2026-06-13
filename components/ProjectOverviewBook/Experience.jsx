'use client';

import { Environment } from '@react-three/drei';
import { Book } from './Book';

export function Experience({ isMobile = false }) {
  return (
    <>
      <group
        rotation-x={isMobile ? -0.08 : -0.14}
        rotation-y={isMobile ? -0.02 : -0.05}
      >
        <Book
          position={[isMobile ? 0.02 : 0.08, isMobile ? -0.32 : -0.22, 0]}
          scale={isMobile ? 1.58 : 2.18}
        />
      </group>

      <ambientLight intensity={0.95} />

      <Environment preset="apartment" />

      <directionalLight
        position={[1.5, 3.75, 2]}
        intensity={1.45}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <mesh position-y={-2.62} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.14} />
      </mesh>
    </>
  );
}
