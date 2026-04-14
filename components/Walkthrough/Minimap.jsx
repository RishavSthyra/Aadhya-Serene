import React, { useEffect, useRef, useState } from 'react';
import styles from '../../app/walkthrough/walkthrough.module.css';
import { EXTERIOR_DATA } from '../../utils/walkthroughConstants';

export default function Minimap({ navData, currentSceneId, yaw, onNavigate }) {
    const canvasRef = useRef(null);
    const [height, setHeight] = useState(160);
    // Store projected positions of nav nodes for click hit-testing
    const projectedNodesRef = useRef([]);
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
                setHeight(Math.round(MINIMAP_WIDTH_DESKTOP * h / w));
            }
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

            const project = (pos) => {
                const nx = (pos.x - TOP_LEFT.x) / (BOTTOM_RIGHT.x - TOP_LEFT.x);
                const ny = (pos.y - TOP_LEFT.y) / (BOTTOM_RIGHT.y - TOP_LEFT.y);
                return {
                    x: padding + nx * drawW,
                    y: padding + ny * drawH
                };
            };

            // Draw Nodes + cache projected positions for click detection
            projectedNodesRef.current = [];
            for (const node of navData) {
                if (!node.pos) continue;
                const p = project(node.pos);
                projectedNodesRef.current.push({ id: node.id, x: p.x, y: p.y });
                const isActive = node.id === currentSceneId;

                ctx.beginPath();
                ctx.arc(p.x, p.y, isActive ? 6 : 4, 0, 2 * Math.PI);
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

    }, [navData, currentSceneId, yaw, MINIMAP_BG_URL]);

    // Click handler: find the closest node within a hit radius
    const handleCanvasClick = (e) => {
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

    return (
        <div
            className={styles.minimap}
            style={{ width: MINIMAP_WIDTH_DESKTOP, height: height }}
        >
            <canvas
                ref={canvasRef}
                className={styles.minimapCanvas}
                onClick={handleCanvasClick}
                style={{ cursor: 'crosshair' }}
            />
        </div>
    );
}
