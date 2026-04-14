'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from '../../app/home.module.css';

const DESKTOP_PARTICLES = 1500;
const MOBILE_PARTICLES = 850;
const GOLD = new THREE.Color('#d8b56a');

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function sampleTextTargets(count) {
  if (typeof document === 'undefined') {
    return {
      targets: new Float32Array(count * 3),
      starts: new Float32Array(count * 3),
      phases: new Float32Array(count),
    };
  }

  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 320;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 156px Georgia, Times New Roman, serif';
  context.fillText('AADHYA', width / 2, 108);
  context.font = '700 142px Georgia, Times New Roman, serif';
  context.fillText('SERENE', width / 2, 238);

  const imageData = context.getImageData(0, 0, width, height).data;
  const points = [];
  const step = 5;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = imageData[(y * width + x) * 4 + 3];
      if (alpha > 80) {
        points.push({
          x: (x / width - 0.5) * 9.2,
          y: -(y / height - 0.5) * 2.95,
          z: (Math.random() - 0.5) * 0.12,
        });
      }
    }
  }

  const targets = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const point = points[Math.floor((index / count) * points.length)] ?? { x: 0, y: 0, z: 0 };
    const offset = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.8 + Math.random() * 4.8;

    targets[offset] = point.x + (Math.random() - 0.5) * 0.025;
    targets[offset + 1] = point.y + (Math.random() - 0.5) * 0.025;
    targets[offset + 2] = point.z;

    starts[offset] = Math.cos(angle) * radius;
    starts[offset + 1] = (Math.random() - 0.5) * 4.4;
    starts[offset + 2] = Math.sin(angle) * radius - 1.2;

    phases[index] = Math.random() * Math.PI * 2;
  }

  return { targets, starts, phases };
}

function ParticleLetters({ reducedMotion }) {
  const pointsRef = useRef(null);
  const particleCount = typeof window !== 'undefined' && window.innerWidth < 700
    ? MOBILE_PARTICLES
    : DESKTOP_PARTICLES;

  const { geometry, targets, starts, phases } = useMemo(() => {
    const data = sampleTextTargets(particleCount);
    const positions = new Float32Array(data.starts);
    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: nextGeometry, ...data };
  }, [particleCount]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const progress = reducedMotion ? 1 : easeOutCubic(Math.min(elapsed / 2.35, 1));
    const position = geometry.attributes.position;
    const array = position.array;
    const floatStrength = reducedMotion ? 0 : (1 - progress) * 0.24;

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      const shimmer = Math.sin(elapsed * 1.4 + phases[index]) * floatStrength;

      array[offset] = THREE.MathUtils.lerp(starts[offset], targets[offset], progress);
      array[offset + 1] = THREE.MathUtils.lerp(starts[offset + 1], targets[offset + 1], progress) + shimmer;
      array[offset + 2] = THREE.MathUtils.lerp(starts[offset + 2], targets[offset + 2], progress);
    }

    position.needsUpdate = true;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = Math.sin(elapsed * 0.16) * 0.035;
    }
  });

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={GOLD}
        size={0.033}
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function LuxuryPreloader() {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(query.matches);

    updateMotion();
    query.addEventListener?.('change', updateMotion);
    return () => query.removeEventListener?.('change', updateMotion);
  }, []);

  useEffect(() => {
    let frameId;
    const startedAt = performance.now();
    const duration = 3600;

    const tick = () => {
      const nextProgress = Math.min(100, Math.round(((performance.now() - startedAt) / duration) * 100));
      setProgress(nextProgress);
      if (nextProgress < 100) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className={styles.luxuryLoader} aria-label="Loading Aadhya Serene">
      <div className={styles.loaderCanvasWrap} aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 7.2], fov: 48 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        >
          <ParticleLetters reducedMotion={reducedMotion} />
        </Canvas>
      </div>

      <div className={styles.loaderInterface}>
        <p className={styles.loaderEyebrow}>Aadhya Serene</p>
        <div className={styles.loaderTrack}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.loaderMeta}>
          <span>Loading</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
