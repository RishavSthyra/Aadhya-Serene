import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../app/walkthrough/walkthrough.module.css';
import { EXTERIOR_DATA } from '../../utils/walkthroughConstants';
import useResponsiveViewport from '../../hooks/useResponsiveViewport';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.8;
const ZOOM_STEP = 0.24;

export default function Minimap({ navData, currentSceneId, yaw, onNavigate }) {
    const canvasRef = useRef(null);
    const { width: viewportWidth, isMobile, isTabletOrBelow } = useResponsiveViewport();
    const [aspectRatio, setAspectRatio] = useState(160 / EXTERIOR_DATA.MINIMAP_WIDTH_DESKTOP);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const zoomRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    // Store projected positions of nav nodes for click hit-testing
    const projectedNodesRef = useRef([]);
    const pointerStateRef = useRef({
        moved: false,
        mode: null,
        startDistance: 0,
        startZoom: 1,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
    });
    const activePointersRef = useRef(new Map());
    const {
        MINIMAP_BG_URL,
        MINIMAP_WIDTH_DESKTOP,
        MINIMAP_BOUNDS
    } = EXTERIOR_DATA;

    // Calculate height based on image aspect ratio
    useEffect(() => {
        const img = new Image();
        img.src = MINIMAP_BG_URL;
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            if (w && h) {
                setAspectRatio(h / w);
            }
        };
    }, [MINIMAP_BG_URL, MINIMAP_WIDTH_DESKTOP]);

    const minimapSize = useMemo(() => {
        const desktopWidth = MINIMAP_WIDTH_DESKTOP;
        const desktopHeight = Math.round(desktopWidth * aspectRatio);

        if (!isTabletOrBelow || typeof window === 'undefined') {
            return { width: desktopWidth, height: desktopHeight };
        }

        const viewportHeight = window.innerHeight || 900;
        const horizontalLimit = isMobile
            ? Math.min(viewportWidth * 0.4, 220)
            : Math.min(viewportWidth * 0.32, 300);
        const bottomDockReserve = isMobile ? 170 : 182;
        const upperControlsReserve = viewportHeight < 760 ? 188 : 150;
        const maxHeight = Math.max(110, viewportHeight - bottomDockReserve - upperControlsReserve);
        const widthFromHeight = maxHeight / aspectRatio;
        const resolvedWidth = Math.max(
            isMobile ? 148 : 176,
            Math.min(desktopWidth, horizontalLimit, widthFromHeight),
        );

        return {
            width: Math.round(resolvedWidth),
            height: Math.round(resolvedWidth * aspectRatio),
        };
    }, [MINIMAP_WIDTH_DESKTOP, aspectRatio, isMobile, isTabletOrBelow, viewportWidth]);

    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    const clampPan = useCallback((nextPan, nextZoom = zoomRef.current) => {
        const maxPanX = ((nextZoom - 1) * minimapSize.width) / 2;
        const maxPanY = ((nextZoom - 1) * minimapSize.height) / 2;

        return {
            x: Math.max(-maxPanX, Math.min(maxPanX, nextPan.x)),
            y: Math.max(-maxPanY, Math.min(maxPanY, nextPan.y)),
        };
    }, [minimapSize.height, minimapSize.width]);

    const updateZoom = useCallback((nextZoom, anchor = null) => {
        const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;

        if (boundedZoom === currentZoom) {
            return;
        }

        let nextPan;
        if (!anchor) {
            nextPan = clampPan(
                boundedZoom === MIN_ZOOM ? { x: 0, y: 0 } : currentPan,
                boundedZoom,
            );
        } else {
            const centerX = minimapSize.width / 2;
            const centerY = minimapSize.height / 2;
            const relativeX = anchor.x - centerX - currentPan.x;
            const relativeY = anchor.y - centerY - currentPan.y;
            const zoomRatio = boundedZoom / currentZoom;

            nextPan = clampPan(
                {
                    x: currentPan.x - relativeX * (zoomRatio - 1),
                    y: currentPan.y - relativeY * (zoomRatio - 1),
                },
                boundedZoom,
            );
        }

        panRef.current = nextPan;
        zoomRef.current = boundedZoom;
        setPan(nextPan);
        setZoom(boundedZoom);
    }, [clampPan, minimapSize.height, minimapSize.width]);

    const getPointerDistance = useCallback((points) => {
        if (points.length < 2) return 0;

        const [firstPoint, secondPoint] = points;
        return Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
    }, []);

    const getPointerMidpoint = useCallback((points) => {
        if (points.length < 2) return null;

        const [firstPoint, secondPoint] = points;
        return {
            x: (firstPoint.x + secondPoint.x) / 2,
            y: (firstPoint.y + secondPoint.y) / 2,
        };
    }, []);

    // Expose render/update method to parent via ref
    // We use a ref callback pattern or imperative handle but since the logic is 
    // closely tied to the canvas, we'll keep the rendering logic here and expose 
    // an update method.
    // However, in the refactor, we can make this reactive. 
    // If props change (yaw, currentSceneId), we re-render.
    // The previous implementation used requestAnimationFrame loop for smooth updates.
    // Let's implement the draw function and call it via useEffect when props change.

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !navData.length) return;
        const ctx = canvas.getContext('2d');
        const bgImage = new Image();
        bgImage.src = MINIMAP_BG_URL;

        let animationFrameId;

        const draw = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
            }

            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw Background
            if (bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, rect.width, rect.height);
            }

            // Project/Map Logic
            const { TOP_LEFT, BOTTOM_RIGHT } = MINIMAP_BOUNDS;
            const padding = 12;
            const drawW = (canvas.width / dpr) - 2 * padding;
            const drawH = (canvas.height / dpr) - 2 * padding;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const transformPoint = (point) => ({
                x: centerX + (point.x - centerX) * zoom + pan.x,
                y: centerY + (point.y - centerY) * zoom + pan.y,
            });

            const project = (pos) => {
                const nx = (pos.x - TOP_LEFT.x) / (BOTTOM_RIGHT.x - TOP_LEFT.x);
                const ny = (pos.y - TOP_LEFT.y) / (BOTTOM_RIGHT.y - TOP_LEFT.y);
                const basePoint = {
                    x: padding + nx * drawW,
                    y: padding + ny * drawH
                };

                return transformPoint(basePoint);
            };

            // Draw Background
            if (bgImage.complete) {
                const imageTopLeft = transformPoint({ x: 0, y: 0 });
                ctx.drawImage(
                    bgImage,
                    imageTopLeft.x,
                    imageTopLeft.y,
                    rect.width * zoom,
                    rect.height * zoom,
                );
            }

            // Draw Nodes + cache projected positions for click detection
            projectedNodesRef.current = [];
            for (const node of navData) {
                if (!node.pos) continue;
                const p = project(node.pos);
                projectedNodesRef.current.push({ id: node.id, x: p.x, y: p.y });
                const isActive = node.id === currentSceneId;

                ctx.beginPath();
                ctx.arc(p.x, p.y, isActive ? 6.5 : 4.5, 0, 2 * Math.PI);
                ctx.fillStyle = isActive ? '#00FFC6' : '#FFD166';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (isActive) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(yaw - Math.PI / 2);

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-10, -20);
                    ctx.arc(0, 0, 30, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4);
                    ctx.lineTo(10, -20);
                    ctx.closePath();

                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
                    grad.addColorStop(0, 'rgba(0, 255, 180, 0.4)');
                    grad.addColorStop(1, 'rgba(0, 255, 180, 0)');
                    ctx.fillStyle = grad;
                    ctx.fill();

                    ctx.restore();
                }
            }
        };

        // If bg image not loaded yet, wait for it
        if (!bgImage.complete) {
            bgImage.onload = draw;
        }

        // Draw immediately
        draw();

        // Also set up a mechanism to redraw if needed (like the imperative handle in the previous code)
        // For now, React's dependency array handles updates when currentSceneId or yaw changes.
        // If yaw updates frequently (e.g. during drag), this might be slightly less efficient than a RAF loop
        // but cleaner. If performance is an issue, we can revert to RAF.
        // Given React 18+ batching, this should be fine.

    }, [navData, currentSceneId, yaw, MINIMAP_BG_URL, MINIMAP_BOUNDS, zoom, pan]);

    // Click handler: find the closest node within a hit radius
    const handleCanvasClick = (e) => {
        if (pointerStateRef.current.moved) {
            pointerStateRef.current.moved = false;
            return;
        }

        if (!onNavigate) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const HIT_RADIUS = 14; // pixels

        let closest = null;
        let closestDist = Infinity;
        for (const proj of projectedNodesRef.current) {
            const dx = proj.x - clickX;
            const dy = proj.y - clickY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < HIT_RADIUS && d < closestDist) {
                closestDist = d;
                closest = proj;
            }
        }

        if (closest) {
            onNavigate(closest.id);
        }
    };

    const handleWheel = (event) => {
        event.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        const anchor = rect
            ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
            : null;
        const direction = event.deltaY < 0 ? 1 : -1;
        updateZoom(zoomRef.current + direction * ZOOM_STEP, anchor);
    };

    const handlePointerDown = (event) => {
        activePointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });

        pointerStateRef.current.moved = false;
        event.currentTarget.setPointerCapture?.(event.pointerId);

        const points = [...activePointersRef.current.values()];
        if (points.length >= 2) {
            pointerStateRef.current.mode = 'pinch';
            pointerStateRef.current.startDistance = getPointerDistance(points);
            pointerStateRef.current.startZoom = zoomRef.current;
            return;
        }

        if (zoomRef.current > MIN_ZOOM) {
            pointerStateRef.current.mode = 'drag';
            pointerStateRef.current.startX = event.clientX;
            pointerStateRef.current.startY = event.clientY;
            pointerStateRef.current.startPanX = panRef.current.x;
            pointerStateRef.current.startPanY = panRef.current.y;
        } else {
            pointerStateRef.current.mode = null;
        }
    };

    const handlePointerMove = (event) => {
        if (!activePointersRef.current.has(event.pointerId)) {
            return;
        }

        activePointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });

        const points = [...activePointersRef.current.values()];
        if (points.length >= 2) {
            const rect = canvasRef.current?.getBoundingClientRect();
            const midpoint = getPointerMidpoint(points);
            const distance = getPointerDistance(points);

            if (pointerStateRef.current.mode !== 'pinch' || pointerStateRef.current.startDistance <= 0) {
                pointerStateRef.current.mode = 'pinch';
                pointerStateRef.current.startDistance = distance;
                pointerStateRef.current.startZoom = zoomRef.current;
                return;
            }

            if (distance > 0) {
                pointerStateRef.current.moved = true;
                updateZoom(
                    pointerStateRef.current.startZoom * (distance / pointerStateRef.current.startDistance),
                    rect && midpoint
                        ? { x: midpoint.x - rect.left, y: midpoint.y - rect.top }
                        : null,
                );
            }

            return;
        }

        if (pointerStateRef.current.mode !== 'drag' || zoomRef.current <= MIN_ZOOM) {
            return;
        }

        const deltaX = event.clientX - pointerStateRef.current.startX;
        const deltaY = event.clientY - pointerStateRef.current.startY;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            pointerStateRef.current.moved = true;
        }

        const nextPan = clampPan({
                x: pointerStateRef.current.startPanX + deltaX,
                y: pointerStateRef.current.startPanY + deltaY,
        });

        panRef.current = nextPan;
        setPan(nextPan);
    };

    const handlePointerEnd = (event) => {
        activePointersRef.current.delete(event.pointerId);
        event.currentTarget.releasePointerCapture?.(event.pointerId);

        const remainingPoints = [...activePointersRef.current.values()];
        if (remainingPoints.length === 1 && zoomRef.current > MIN_ZOOM) {
            const [point] = remainingPoints;
            pointerStateRef.current.mode = 'drag';
            pointerStateRef.current.startX = point.x;
            pointerStateRef.current.startY = point.y;
            pointerStateRef.current.startPanX = panRef.current.x;
            pointerStateRef.current.startPanY = panRef.current.y;
            return;
        }

        pointerStateRef.current.mode = null;
    };

    return (
        <div
            className={styles.minimap}
            style={{ width: minimapSize.width, height: minimapSize.height }}
        >
            <canvas
                ref={canvasRef}
                className={styles.minimapCanvas}
                onClick={handleCanvasClick}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                style={{ cursor: zoom > MIN_ZOOM ? 'grab' : 'crosshair' }}
            />
        </div>
    );
}
