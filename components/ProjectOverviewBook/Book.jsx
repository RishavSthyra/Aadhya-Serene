'use client';

import { useCursor, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useAtom } from 'jotai';
import { easing } from 'maath';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bone,
  BoxGeometry,
  ClampToEdgeWrapping,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import { pageAtom, pages, pageTextureSources } from './book-data';

const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;
const interiorPageRoughness = 0.72;

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2,
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let index = 0; index < position.count; index += 1) {
  vertex.fromBufferAttribute(position, index);

  const x = vertex.x;
  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  'skinIndex',
  new Uint16BufferAttribute(skinIndexes, 4),
);
pageGeometry.setAttribute(
  'skinWeight',
  new Float32BufferAttribute(skinWeights, 4),
);

const whiteColor = new Color('white');
const emissiveColor = new Color('orange');

const pageMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: '#111' }),
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
];

if (typeof window !== 'undefined') {
  pageTextureSources.forEach((texturePath) => {
    useTexture.preload(texturePath);
  });
  useTexture.preload('/project-overview-book/textures/book-cover-roughness.jpg');
}

function usePageTexture(side) {
  const sourceTexture = useTexture(side.src);

  const texture = useMemo(() => {
    const nextTexture = sourceTexture.clone();
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.wrapS = ClampToEdgeWrapping;
    nextTexture.wrapT = ClampToEdgeWrapping;
    nextTexture.repeat.set(side.half ? 0.5 : 1, 1);
    nextTexture.offset.set(side.half === 'right' ? 0.5 : 0, 0);
    nextTexture.needsUpdate = true;

    return nextTexture;
  }, [side.half, sourceTexture]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return texture;
}

function Page({ number, front, back, page, opened, bookClosed, ...props }) {
  const frontTexture = usePageTexture(front);
  const backTexture = usePageTexture(back);
  const coverRoughnessTexture = useTexture(
    '/project-overview-book/textures/book-cover-roughness.jpg',
  );

  const groupRef = useRef(null);
  const turnedAtRef = useRef(0);
  const lastOpenedRef = useRef(opened);
  const skinnedMeshRef = useRef(null);
  const [, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);

  useCursor(highlighted);

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];

    for (let index = 0; index <= PAGE_SEGMENTS; index += 1) {
      const bone = new Bone();
      bones.push(bone);
      bone.position.x = index === 0 ? 0 : SEGMENT_WIDTH;

      if (index > 0) {
        bones[index - 1].add(bone);
      }
    }

    const skeleton = new Skeleton(bones);
    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: frontTexture,
        ...(number === 0
          ? { roughnessMap: coverRoughnessTexture }
          : { roughness: interiorPageRoughness }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: backTexture,
        ...(number === pages.length - 1
          ? { roughnessMap: coverRoughnessTexture }
          : { roughness: interiorPageRoughness }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];

    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);

    return mesh;
  }, [backTexture, coverRoughnessTexture, frontTexture, number]);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current || !groupRef.current) {
      return;
    }

    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1,
      );

    if (lastOpenedRef.current !== opened) {
      turnedAtRef.current = Date.now();
      lastOpenedRef.current = opened;
    }

    let turningTime = Math.min(400, Date.now() - turnedAtRef.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += MathUtils.degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;

    for (let index = 0; index < bones.length; index += 1) {
      const target = index === 0 ? groupRef.current : bones[index];
      const insideCurveIntensity = index < 8 ? Math.sin(index * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = index >= 8 ? Math.cos(index * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(index * Math.PI * (1 / bones.length)) * turningTime;

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;

      let foldRotationAngle = MathUtils.degToRad(Math.sign(targetRotation) * 2);

      if (bookClosed) {
        if (index === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      easing.dampAngle(
        target.rotation,
        'y',
        rotationAngle,
        easingFactor,
        delta,
      );

      const foldIntensity =
        index > 8
          ? Math.sin(index * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;

      easing.dampAngle(
        target.rotation,
        'x',
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta,
      );
    }
  });

  return (
    <group
      {...props}
      ref={groupRef}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHighlighted(false);
      }}
      onClick={(event) => {
        event.stopPropagation();
        setPage(opened ? number : number + 1);
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
}

export function Book(props) {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);

  useEffect(() => {
    let timeoutId;

    const goToPage = () => {
      setDelayedPage((currentPage) => {
        if (page === currentPage) {
          return currentPage;
        }

        timeoutId = window.setTimeout(
          goToPage,
          Math.abs(page - currentPage) > 2 ? 50 : 150,
        );

        if (page > currentPage) {
          return currentPage + 1;
        }

        return currentPage - 1;
      });
    };

    goToPage();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [page]);

  const isFrontClosed = delayedPage === 0;
  const isBackClosed = delayedPage === pages.length;
  const closedDisplayAngle = MathUtils.degToRad(18);
  const displayRotationY = isFrontClosed
    ? -Math.PI / 2 + closedDisplayAngle
    : isBackClosed
      ? -Math.PI / 2 - closedDisplayAngle
      : -Math.PI / 2;
  const displayPositionX = isFrontClosed ? -0.1 : isBackClosed ? 0.1 : 0;

  return (
    <group {...props} rotation-y={displayRotationY} position-x={displayPositionX}>
      {pages.map((pageData, index) => (
        <Page
          key={index}
          page={delayedPage}
          number={index}
          opened={delayedPage > index}
          bookClosed={isFrontClosed || isBackClosed}
          {...pageData}
        />
      ))}
    </group>
  );
}
