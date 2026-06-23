'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import usePerformanceProfile from '@/hooks/usePerformanceProfile';
import { Box3, MathUtils, Vector3 } from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

const MODEL_URL = '/models/animated_butterfly.glb';
const BUTTERFLY_SIZE_MULTIPLIER = 0.5;
const BOX = new Box3();
const SIZE = new Vector3();

const DESKTOP_FLIGHT_PLANS = [
  { anchorX: -0.78, anchorY: 0.62, orbitX: 0.13, orbitY: 0.08, depth: -1.3, speed: 0.72, drift: 0.28, bank: 0.28, tilt: 0.16, size: 0.42, flapSpeed: 1.08, phase: 0.4 },
  { anchorX: 0.82, anchorY: 0.58, orbitX: 0.11, orbitY: 0.07, depth: -0.9, speed: 0.88, drift: 0.24, bank: -0.26, tilt: 0.14, size: 0.37, flapSpeed: 1.16, phase: 1.7 },
  { anchorX: -0.9, anchorY: -0.1, orbitX: 0.16, orbitY: 0.12, depth: -1.1, speed: 0.64, drift: 0.32, bank: 0.22, tilt: -0.08, size: 0.34, flapSpeed: 0.94, phase: 2.8 },
  { anchorX: 0.92, anchorY: -0.18, orbitX: 0.14, orbitY: 0.1, depth: -0.8, speed: 0.78, drift: 0.26, bank: -0.24, tilt: -0.06, size: 0.39, flapSpeed: 1.03, phase: 4.1 },
  { anchorX: -0.38, anchorY: 0.82, orbitX: 0.1, orbitY: 0.06, depth: -1.4, speed: 0.58, drift: 0.18, bank: 0.18, tilt: 0.2, size: 0.31, flapSpeed: 1.22, phase: 5.2 },
  { anchorX: 0.34, anchorY: 0.78, orbitX: 0.1, orbitY: 0.05, depth: -1.2, speed: 0.69, drift: 0.2, bank: -0.18, tilt: 0.18, size: 0.29, flapSpeed: 1.11, phase: 6.4 },
];

const MOBILE_FLIGHT_PLANS = [
  { anchorX: -0.86, anchorY: 0.72, orbitX: 0.1, orbitY: 0.06, depth: -1, speed: 0.66, drift: 0.2, bank: 0.18, tilt: 0.14, size: 0.34, flapSpeed: 1.02, phase: 0.8 },
  { anchorX: 0.88, anchorY: 0.54, orbitX: 0.1, orbitY: 0.07, depth: -0.9, speed: 0.82, drift: 0.2, bank: -0.2, tilt: 0.12, size: 0.3, flapSpeed: 1.14, phase: 2.7 },
  { anchorX: -0.9, anchorY: -0.06, orbitX: 0.12, orbitY: 0.08, depth: -1.15, speed: 0.61, drift: 0.24, bank: 0.16, tilt: -0.08, size: 0.28, flapSpeed: 0.95, phase: 4.3 },
  { anchorX: 0.92, anchorY: -0.12, orbitX: 0.11, orbitY: 0.08, depth: -0.85, speed: 0.74, drift: 0.18, bank: -0.16, tilt: -0.04, size: 0.32, flapSpeed: 1.05, phase: 5.6 },
];

function getFlightPlans({ isTabletOrBelow, isConstrainedDevice }) {
  const basePlans = isTabletOrBelow ? MOBILE_FLIGHT_PLANS : DESKTOP_FLIGHT_PLANS;
  return isConstrainedDevice ? basePlans.slice(0, Math.min(3, basePlans.length)) : basePlans;
}

function Butterfly({ animations, plan, scene, viewportScale }) {
  const containerRef = useRef(null);
  const modelGroupRef = useRef(null);
  const hasPositionRef = useRef(false);
  const previousPositionRef = useRef(new Vector3());
  const velocityRef = useRef(new Vector3());
  const horizontalDirectionRef = useRef(1);
  const clone = useMemo(() => cloneSkeleton(scene), [scene]);
  const { actions } = useAnimations(animations, clone);

  const normalizedScale = useMemo(() => {
    clone.updateMatrixWorld(true);
    BOX.setFromObject(clone);
    BOX.getSize(SIZE);
    const longestSide = Math.max(SIZE.x, SIZE.y, SIZE.z, 0.001);
    return 1 / longestSide;
  }, [clone]);

  useEffect(() => {
    const clipName = actions.Flying ? 'Flying' : Object.keys(actions)[0];
    const action = clipName ? actions[clipName] : null;

    if (!action) {
      return undefined;
    }

    action.reset();
    action.fadeIn(0.2);
    action.setEffectiveTimeScale(plan.flapSpeed);
    action.play();

    return () => {
      action.fadeOut(0.15);
      action.stop();
    };
  }, [actions, plan.flapSpeed]);

  useFrame((state, delta) => {
    if (!containerRef.current || !modelGroupRef.current) {
      return;
    }

    const elapsed = state.clock.getElapsedTime() * plan.speed + plan.phase;
    const width = state.viewport.width * viewportScale;
    const height = state.viewport.height * viewportScale;

    const x =
      (plan.anchorX * width * 0.48)
      + (Math.sin(elapsed) * width * plan.orbitX)
      + (Math.cos(elapsed * 0.57) * width * 0.03);
    const y =
      (plan.anchorY * height * 0.38)
      + (Math.sin(elapsed * 1.36) * height * plan.orbitY)
      + (Math.cos(elapsed * 0.71) * plan.drift);
    const z = plan.depth + (Math.sin(elapsed * 0.85) * 0.45);

    if (!hasPositionRef.current) {
      containerRef.current.position.set(x, y, z);
      previousPositionRef.current.set(x, y, z);
      hasPositionRef.current = true;
      return;
    }

    velocityRef.current.set(
      x - previousPositionRef.current.x,
      y - previousPositionRef.current.y,
      z - previousPositionRef.current.z,
    );

    if (Math.abs(velocityRef.current.x) > 0.0005) {
      horizontalDirectionRef.current = Math.sign(velocityRef.current.x);
    }

    containerRef.current.position.set(x, y, z);
    previousPositionRef.current.set(x, y, z);

    const verticalPitch = MathUtils.clamp(-velocityRef.current.y * 5, -0.3, 0.3);
    const dynamicBank = MathUtils.clamp(-velocityRef.current.x * 6, -0.26, 0.26);
    const targetPitch = plan.tilt + verticalPitch + (Math.sin(elapsed * 1.5) * 0.08);
    const targetRoll = plan.bank + dynamicBank + (Math.cos(elapsed * 1.8) * 0.12);
    const directionScale = horizontalDirectionRef.current >= 0 ? -1 : 1;

    modelGroupRef.current.scale.set(
      normalizedScale * plan.size * BUTTERFLY_SIZE_MULTIPLIER * directionScale,
      normalizedScale * plan.size * BUTTERFLY_SIZE_MULTIPLIER,
      normalizedScale * plan.size * BUTTERFLY_SIZE_MULTIPLIER,
    );

    modelGroupRef.current.rotation.x = MathUtils.damp(
      modelGroupRef.current.rotation.x,
      targetPitch,
      5,
      delta,
    );
    modelGroupRef.current.rotation.y = MathUtils.damp(modelGroupRef.current.rotation.y, 0, 5, delta);
    modelGroupRef.current.rotation.z = MathUtils.damp(
      modelGroupRef.current.rotation.z,
      targetRoll,
      5.5,
      delta,
    );
  });

  return (
    <group ref={containerRef}>
      <group ref={modelGroupRef}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

function ButterflyField({ plans, viewportScale }) {
  const { scene, animations } = useGLTF(MODEL_URL);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 6]} intensity={1.3} />
      <directionalLight position={[-4, 2, 5]} intensity={0.55} color="#fff2df" />

      {plans.map((plan, index) => (
        <Butterfly
          animations={animations}
          key={`${index}-${plan.phase}`}
          plan={plan}
          scene={scene}
          viewportScale={viewportScale}
        />
      ))}
    </>
  );
}

export default function ButterflyOverlay() {
  const { isTabletOrBelow, isConstrainedDevice } = usePerformanceProfile();
  const plans = useMemo(
    () => getFlightPlans({ isTabletOrBelow, isConstrainedDevice }),
    [isConstrainedDevice, isTabletOrBelow],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[20] overflow-hidden">
      <Canvas
        className="pointer-events-none"
        dpr={isConstrainedDevice ? [1, 1] : [1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 8], fov: 38 }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 80 } }}
      >
        <Suspense fallback={null}>
          <ButterflyField
            plans={plans}
            viewportScale={isTabletOrBelow ? 0.9 : 1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
