'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import trackingData from '../../public/data/unreal_tracking_data.json';
import { flatsData } from '../../lib/flats';

const BASE_OVERLAY_SCALE = 1.0035;
const HOVER_OVERLAY_SCALE = 1.008;

function makeAvailableOverlay(isHover) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(isHover ? '#8d7331' : '#6f7930'),
        emissive: new THREE.Color(isHover ? '#ffd65e' : '#c6de54'),
        emissiveIntensity: isHover ? 1.95 : 0.62,
        metalness: 0.04,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: isHover ? 0.46 : 0.32,
        transmission: 0.08,
        thickness: 0.45,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        side: THREE.DoubleSide,
    });
}

function makeSoldOverlay(isHover) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(isHover ? '#a03030' : '#7a2020'),
        emissive: new THREE.Color(isHover ? '#ff5555' : '#ff4a4a'),
        emissiveIntensity: isHover ? 1.4 : 0.3,
        metalness: 0.04,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: isHover ? 0.42 : 0.25,
        transmission: 0.08,
        thickness: 0.45,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        side: THREE.DoubleSide,
    });
}

function edgeMatAvailable() {
    return new THREE.LineBasicMaterial({
        color: '#f6ffaf',
        transparent: true,
        opacity: 0.98,
        depthTest: false,
        toneMapped: false,
    });
}

function edgeMatSold() {
    return new THREE.LineBasicMaterial({
        color: '#ff8888',
        transparent: true,
        opacity: 0.98,
        depthTest: false,
        toneMapped: false,
    });
}

function edgeMatHover(available) {
    return new THREE.LineBasicMaterial({
        color: available ? '#fff5c2' : '#ffffff',
        transparent: true,
        opacity: 1,
        depthTest: false,
        toneMapped: false,
    });
}

function applyStructureMat(mesh) {
    if (!mesh.material) return;

    if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => {
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
        });
        return;
    }

    mesh.material.side = THREE.DoubleSide;
    mesh.material.needsUpdate = true;
}

function isFlatAvailable(flatId) {
    const flat = flatsData.find((item) => item.id === flatId || item.flat === flatId);
    return flat ? flat.status === 'available' : true;
}

function makeEdgeLines(mesh, material) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
    const lines = new THREE.LineSegments(edges, material);
    lines.userData.isEdge = true;
    lines.renderOrder = 2;
    return lines;
}

function setOverlayScale(mesh, edgeLines, meshScale = 1) {
    mesh.scale.setScalar(meshScale);

    if (!edgeLines) return;

    const edgeScale = meshScale === 1 ? 1 : 1 / meshScale;
    edgeLines.scale.setScalar(edgeScale);
}

function parseFlatId(name) {
    if (!name?.toLowerCase().includes('flat')) return null;
    const match = name.match(/(\d{3,})/);
    return match ? match[1] : null;
}

function getMeshWorldCenter(mesh) {
    const center = new THREE.Vector3();

    if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        mesh.geometry.boundingBox.getCenter(center);
        mesh.localToWorld(center);
        return center;
    }

    mesh.getWorldPosition(center);
    return center;
}

function SceneWithCamera({ currentFrame, filteredFlatIds, onFlatHover, onFlatHoverStart, onFlatClick, shouldAllowFlatClick, meshInteractionEnabled }) {
    const { scene: sourceScene } = useGLTF('/assets/building.glb');
    const scene = useMemo(() => sourceScene.clone(true), [sourceScene]);
    const { size, gl, camera } = useThree();

    const [cameraPath, setCameraPath] = useState(null);
    const [pointVisibleIds, setPointVisibleIds] = useState(new Set());

    const flatRefs = useRef({});
    const hitboxRefs = useRef([]);
    const hoveredIdRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const pointerRef = useRef(new THREE.Vector2());

    useEffect(() => {
        const glbDummies = {};

        scene.updateMatrixWorld(true);

        scene.traverse((child) => {
            if (!child.isMesh && !child.isGroup) return;

            const lowerName = child.name?.toLowerCase() || '';
            if (!lowerName.includes('dummy')) return;

            const worldPosition = new THREE.Vector3();

            if (child.geometry) {
                child.geometry.computeBoundingBox();
                child.geometry.boundingBox.getCenter(worldPosition);
                child.localToWorld(worldPosition);
            } else {
                child.getWorldPosition(worldPosition);
            }

            ['1', '2', '3', '4'].forEach((index) => {
                if (
                    lowerName.includes(`dummy_${index}`)
                    || lowerName.includes(`dummy__${index}`)
                    || lowerName.includes(`dummy_0${index}`)
                ) {
                    glbDummies[`dummy_${index}`] = worldPosition.clone();
                }
            });

            child.visible = false;
        });

        if (!trackingData.A1 || !glbDummies.dummy_1) return;

        const ueD1 = trackingData.A1.dummies.dummy_1;
        const glbD1 = glbDummies.dummy_1;
        let scale = 0.0001;

        if (glbDummies.dummy_3 && trackingData.A1.dummies.dummy_3) {
            const ueD3 = trackingData.A1.dummies.dummy_3;
            const glbD3 = glbDummies.dummy_3;
            const unrealDistance = Math.hypot(ueD3.x - ueD1.x, ueD3.y - ueD1.y);
            const glbDistance = Math.hypot(glbD3.x - glbD1.x, glbD3.z - glbD1.z);

            if (unrealDistance > 0) {
                scale = glbDistance / unrealDistance;
            }
        }

        const positions = [];
        const rotations = [];
        const fovs = [];
        const aspect = size.width / size.height;
        const dummyKeys = ['dummy_1', 'dummy_2', 'dummy_3', 'dummy_4'];

        ['A1', 'A2', 'A3', 'A4'].forEach((key, index) => {
            const data = trackingData[key];
            if (!data) return;

            const uePosition = data.camera.position;
            const ueRotation = data.camera.rotation;
            const ueDummy = data.dummies[dummyKeys[index]];
            const glbDummy = glbDummies[dummyKeys[index]];
            const reference = ueDummy && glbDummy ? { ue: ueDummy, glb: glbDummy } : { ue: ueD1, glb: glbD1 };

            positions.push(new THREE.Vector3(
                reference.glb.x + (uePosition.x - reference.ue.x) * scale,
                reference.glb.y + (uePosition.z - reference.ue.z) * scale,
                reference.glb.z + (uePosition.y - reference.ue.y) * scale,
            ));

            const euler = new THREE.Euler(
                THREE.MathUtils.degToRad(ueRotation.pitch),
                -THREE.MathUtils.degToRad(ueRotation.yaw) - Math.PI / 2,
                -THREE.MathUtils.degToRad(ueRotation.roll),
                'YXZ',
            );

            rotations.push(new THREE.Quaternion().setFromEuler(euler));

            const horizontalFov = THREE.MathUtils.degToRad(data.camera.fov);
            fovs.push(
                THREE.MathUtils.radToDeg(
                    2 * Math.atan(Math.tan(horizontalFov / 2) / aspect),
                ),
            );
        });

        setCameraPath({ positions, rotations, fovs, dummies: glbDummies });
    }, [scene, size.height, size.width]);

    useEffect(() => {
        const refs = {};
        const hitboxes = [];
        const hiddenNamePattern = /^(Line\d+|nodes\d+)$/i;

        scene.updateMatrixWorld(true);

        scene.traverse((child) => {
            if (!child.isMesh) return;

            const name = child.name || '';
            const lowerName = name.toLowerCase();

            if (child.userData?.isHitbox || child.userData?.isEdge) return;

            if (hiddenNamePattern.test(name)) {
                child.visible = false;
                child.castShadow = false;
                child.receiveShadow = false;
                return;
            }

            if (lowerName.includes('dummy') || lowerName.includes('anchor_')) return;

            const flatId = parseFlatId(name);

            if (!flatId) {
                applyStructureMat(child);
                return;
            }

            child.userData.flatId = flatId;
            child.material = makeAvailableOverlay(false);
            child.visible = false;
            child.renderOrder = 1;
            child.raycast = () => null;

            const hitbox = new THREE.Mesh(
                child.geometry,
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                }),
            );

            hitbox.userData.flatId = flatId;
            hitbox.userData.isHitbox = true;
            hitbox.matrix.copy(child.matrix);
            hitbox.matrixAutoUpdate = false;
            hitbox.visible = false;
            hitbox.renderOrder = 0;
            child.parent?.add(hitbox);
            hitboxes.push(hitbox);

            const edges = makeEdgeLines(child, edgeMatAvailable());
            edges.visible = false;
            edges.renderOrder = 2;
            edges.raycast = () => null;
            child.add(edges);

            refs[flatId] = { mesh: child, edgeLines: edges, hitbox };
        });

        flatRefs.current = refs;
        hitboxRefs.current = hitboxes;
    }, [scene]);

    useEffect(() => {
        if (!cameraPath?.dummies) return;

        const entries = Object.entries(flatRefs.current);
        if (entries.length === 0) return;

        const normalizedFrame = ((currentFrame % 360) + 360) % 360;
        const index = Math.round(normalizedFrame / 90) % 4;

        const d1 = cameraPath.dummies.dummy_1;
        const d2 = cameraPath.dummies.dummy_2;
        const d3 = cameraPath.dummies.dummy_3;
        const d4 = cameraPath.dummies.dummy_4;

        if (!d1 || !d2 || !d3 || !d4) return;

        const mid12 = new THREE.Vector3().copy(d1).add(d2).multiplyScalar(0.5);
        const mid23 = new THREE.Vector3().copy(d2).add(d3).multiplyScalar(0.5);
        const mid34 = new THREE.Vector3().copy(d3).add(d4).multiplyScalar(0.5);
        const mid41 = new THREE.Vector3().copy(d4).add(d1).multiplyScalar(0.5);

        let activeFaceCenter;
        let oppositeFaceCenter;

        if (index === 0) {
            activeFaceCenter = mid12;
            oppositeFaceCenter = mid34;
        } else if (index === 1) {
            activeFaceCenter = mid23;
            oppositeFaceCenter = mid41;
        } else if (index === 2) {
            activeFaceCenter = mid34;
            oppositeFaceCenter = mid12;
        } else {
            activeFaceCenter = mid41;
            oppositeFaceCenter = mid23;
        }

        const buildingCenter = new THREE.Vector3()
            .copy(activeFaceCenter)
            .add(oppositeFaceCenter)
            .multiplyScalar(0.5);
        const faceNormal = new THREE.Vector3()
            .copy(activeFaceCenter)
            .sub(buildingCenter)
            .normalize();

        const visibleIds = new Set();

        for (const [flatId, { mesh }] of entries) {
            const flatCenter = getMeshWorldCenter(mesh);
            const directionFromCenter = flatCenter.sub(buildingCenter);

            if (directionFromCenter.dot(faceNormal) >= 0.05) {
                visibleIds.add(flatId);
            }
        }

        setPointVisibleIds(visibleIds);
    }, [cameraPath, currentFrame]);

    const isFlatHoverable = useCallback((flatId) => {
        if (!flatId) return false;
        return meshInteractionEnabled && pointVisibleIds.has(flatId);
    }, [meshInteractionEnabled, pointVisibleIds]);

    const shouldShowFlatFromFilter = useCallback((flatId) => {
        if (!flatId || filteredFlatIds == null || !meshInteractionEnabled) return false;
        return pointVisibleIds.has(flatId) && filteredFlatIds.has(flatId);
    }, [filteredFlatIds, meshInteractionEnabled, pointVisibleIds]);

    const applyHover = useCallback((flatId) => {
        if (!flatId || !flatRefs.current[flatId]) return;

        const { mesh, edgeLines } = flatRefs.current[flatId];
        const available = isFlatAvailable(flatId);

        mesh.material = available ? makeAvailableOverlay(true) : makeSoldOverlay(true);
        mesh.visible = true;

        edgeLines.material = edgeMatHover(available);
        edgeLines.visible = true;
        setOverlayScale(mesh, edgeLines, HOVER_OVERLAY_SCALE);
    }, []);

    const restoreState = useCallback((flatId) => {
        if (!flatId || !flatRefs.current[flatId]) return;

        const { mesh, edgeLines, hitbox } = flatRefs.current[flatId];
        const available = isFlatAvailable(flatId);
        const shouldShow = shouldShowFlatFromFilter(flatId);

        hitbox.visible = isFlatHoverable(flatId);

        if (!shouldShow) {
            mesh.visible = false;
            edgeLines.visible = false;
            setOverlayScale(mesh, edgeLines, 1);
            return;
        }

        mesh.material = available ? makeAvailableOverlay(false) : makeSoldOverlay(false);
        mesh.visible = true;

        edgeLines.material = available ? edgeMatAvailable() : edgeMatSold();
        edgeLines.visible = true;
        setOverlayScale(mesh, edgeLines, BASE_OVERLAY_SCALE);
    }, [isFlatHoverable, shouldShowFlatFromFilter]);

    const setHoveredFlat = useCallback((flatId, clientX = 0, clientY = 0) => {
        if (flatId === hoveredIdRef.current) {
            if (flatId) onFlatHover?.(flatId, clientX, clientY);
            return;
        }

        if (hoveredIdRef.current) {
            restoreState(hoveredIdRef.current);
        }

        hoveredIdRef.current = flatId;

        if (!flatId) {
            document.body.style.cursor = 'default';
            onFlatHover?.(null, 0, 0);
            return;
        }

        onFlatHoverStart?.(flatId);
        applyHover(flatId);
        document.body.style.cursor = 'pointer';
        onFlatHover?.(flatId, clientX, clientY);
    }, [applyHover, onFlatHover, onFlatHoverStart, restoreState]);

    useEffect(() => {
        Object.entries(flatRefs.current).forEach(([flatId, refs]) => {
            if (flatId === hoveredIdRef.current) return;

            const { mesh, edgeLines, hitbox } = refs;
            const available = isFlatAvailable(flatId);
            const shouldShow = shouldShowFlatFromFilter(flatId);

            hitbox.visible = isFlatHoverable(flatId);

            if (!shouldShow) {
                mesh.visible = false;
                edgeLines.visible = false;
                setOverlayScale(mesh, edgeLines, 1);
                return;
            }

            mesh.material = available ? makeAvailableOverlay(false) : makeSoldOverlay(false);
            mesh.visible = true;

            edgeLines.material = available ? edgeMatAvailable() : edgeMatSold();
            edgeLines.visible = true;
            setOverlayScale(mesh, edgeLines, BASE_OVERLAY_SCALE);
        });

        if (hoveredIdRef.current && !isFlatHoverable(hoveredIdRef.current)) {
            setHoveredFlat(null);
        }
    }, [isFlatHoverable, meshInteractionEnabled, setHoveredFlat, shouldShowFlatFromFilter]);

    useEffect(() => {
        if (!meshInteractionEnabled && hoveredIdRef.current) {
            setHoveredFlat(null);
        }
    }, [meshInteractionEnabled, setHoveredFlat]);

    useEffect(() => {
        const canvasElement = gl?.domElement;
        if (!canvasElement) return;

        const updateHoveredFlat = (event) => {
            if (!meshInteractionEnabled) {
                setHoveredFlat(null);
                return;
            }

            const rect = canvasElement.getBoundingClientRect();
            pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(pointerRef.current, camera);

            const intersections = raycasterRef.current.intersectObjects(hitboxRefs.current, false);
            const hit = intersections.find((intersection) => {
                const flatId = intersection.object?.userData?.flatId;
                return flatId && isFlatHoverable(flatId);
            });

            const flatId = hit?.object?.userData?.flatId ?? null;
            setHoveredFlat(flatId, event.clientX, event.clientY);
        };

        const clearHover = () => {
            setHoveredFlat(null);
        };

        const activateFlatFromEvent = (event) => {
            if (!meshInteractionEnabled) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (shouldAllowFlatClick && !shouldAllowFlatClick()) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            const rect = canvasElement.getBoundingClientRect();
            pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(pointerRef.current, camera);

            const intersections = raycasterRef.current.intersectObjects(hitboxRefs.current, false);
            const hit = intersections.find((intersection) => {
                const flatId = intersection.object?.userData?.flatId;
                return flatId && isFlatHoverable(flatId);
            });

            const flatId = hit?.object?.userData?.flatId ?? null;
            if (flatId) onFlatClick?.(flatId);
        };

        const handleCanvasClick = (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') {
                return;
            }

            activateFlatFromEvent(event);
        };

        const handleCanvasPointerUp = (event) => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
                return;
            }

            activateFlatFromEvent(event);
        };

        canvasElement.addEventListener('pointermove', updateHoveredFlat);
        canvasElement.addEventListener('pointerleave', clearHover);
        canvasElement.addEventListener('pointercancel', clearHover);
        canvasElement.addEventListener('pointerup', handleCanvasPointerUp);
        canvasElement.addEventListener('click', handleCanvasClick);
        window.addEventListener('blur', clearHover);

        return () => {
            canvasElement.removeEventListener('pointermove', updateHoveredFlat);
            canvasElement.removeEventListener('pointerleave', clearHover);
            canvasElement.removeEventListener('pointercancel', clearHover);
            canvasElement.removeEventListener('pointerup', handleCanvasPointerUp);
            canvasElement.removeEventListener('click', handleCanvasClick);
            window.removeEventListener('blur', clearHover);
        };
    }, [camera, gl, isFlatHoverable, meshInteractionEnabled, onFlatClick, setHoveredFlat, shouldAllowFlatClick]);

    let position = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let fov = 50;

    if (cameraPath) {
        const normalizedFrame = ((currentFrame % 360) + 360) % 360;
        const index = Math.round(normalizedFrame / 90) % 4;
        position = cameraPath.positions[index].clone();
        quaternion = cameraPath.rotations[index].clone();
        fov = cameraPath.fovs[index];
    }

    return (
        <>
            {cameraPath && (
                <PerspectiveCamera
                    makeDefault
                    near={0.01}
                    far={20000}
                    position={position}
                    quaternion={quaternion}
                    fov={fov}
                    onUpdate={(instance) => instance.updateProjectionMatrix()}
                />
            )}
            <primitive object={scene} />
        </>
    );
}

function FlatTooltip({ flatId, x, y }) {
    if (!flatId) return null;

    const available = isFlatAvailable(flatId);

    return (
        <div
            style={{
                position: 'fixed',
                left: x + 18,
                top: y - 44,
                zIndex: 600,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, rgba(6,12,30,0.96), rgba(10,20,48,0.98))',
                border: `1px solid ${available ? 'rgba(212,185,110,0.3)' : 'rgba(255,80,80,0.3)'}`,
                boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px ${available ? 'rgba(212,185,110,0.15)' : 'rgba(255,80,80,0.15)'}`,
                borderRadius: 999,
                padding: '9px 18px',
                backdropFilter: 'blur(16px)',
                fontSize: 11,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: '#fff',
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ opacity: 0.5, fontWeight: 500 }}>Flat</span>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{flatId}</span>
            <span
                style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: available ? '#d4b96e' : '#ff5555',
                    background: available
                        ? 'linear-gradient(135deg, rgba(212,185,110,0.18), rgba(212,185,110,0.08))'
                        : 'linear-gradient(135deg, rgba(255,80,80,0.18), rgba(255,80,80,0.08))',
                    border: `1px solid ${available ? 'rgba(212,185,110,0.3)' : 'rgba(255,80,80,0.3)'}`,
                    borderRadius: 999,
                    padding: '4px 12px',
                }}
            >
                {available ? 'AVAILABLE' : 'SOLD OUT'}
            </span>
        </div>
    );
}

export default function BuildingModel({
    currentFrame,
    filteredFlatIds,
    onFlatClick,
    onFlatHoverStart,
    shouldAllowFlatClick,
    isConstrainedDevice = false,
    meshInteractionEnabled = true,
}) {
    const [tooltip, setTooltip] = useState({ flatId: null, x: 0, y: 0 });

    const handleFlatHover = useCallback((flatId, x, y) => {
        setTooltip({ flatId, x, y });
    }, []);

    return (
        <>
            <Canvas
                dpr={isConstrainedDevice ? [1, 1.25] : [1, 1.75]}
                frameloop="demand"
                gl={{
                    antialias: !isConstrainedDevice,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
            >
                <ambientLight intensity={1.8} />
                <directionalLight position={[10, 20, 10]} intensity={2.8} />
                <directionalLight position={[-10, 10, -5]} intensity={1.0} color="#aaddff" />
                <Environment preset="city" />
                <SceneWithCamera
                    currentFrame={currentFrame}
                    filteredFlatIds={filteredFlatIds}
                    onFlatHover={handleFlatHover}
                    onFlatHoverStart={onFlatHoverStart}
                    onFlatClick={onFlatClick}
                    shouldAllowFlatClick={shouldAllowFlatClick}
                    meshInteractionEnabled={meshInteractionEnabled}
                />
            </Canvas>
            <FlatTooltip {...tooltip} />
        </>
    );
}

useGLTF.preload('/assets/building.glb');
