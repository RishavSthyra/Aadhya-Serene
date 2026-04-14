'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import BuildingModel from './BuildingModel';
import styles from './viewer.module.css';

const TOTAL_FRAMES = 360;
const SNAP_POINTS = [1, 90, 180, 270, 360];

export default function Apartment360Viewer({ onFlatClick, filteredFlatIds }) {
    const [currentFrame, setCurrentFrame] = useState(1);
    const [snappedFrame, setSnappedFrame] = useState(1);
    const [isSettled, setIsSettled] = useState(true);

    const frameMotion = useMotionValue(1);
    const smoothFrame = useSpring(frameMotion, { stiffness: 100, damping: 20 });

    const isDragging = useRef(false);
    const startX = useRef(0);
    const lastFrame = useRef(1);
    const targetFrameRef = useRef(1);

    useEffect(() => {
        return smoothFrame.on('change', (latest) => {
            let wrapped = Math.round(latest);
            if (wrapped <= 0) wrapped += TOTAL_FRAMES;
            if (wrapped > TOTAL_FRAMES) wrapped -= TOTAL_FRAMES;
            setCurrentFrame(wrapped);

            if (!isDragging.current && !isSettled) {
                if (Math.abs(latest - targetFrameRef.current) <= 1.5) {
                    setIsSettled(true);
                    let targetWrapped = Math.round(targetFrameRef.current);
                    if (targetWrapped <= 0) targetWrapped += TOTAL_FRAMES;
                    if (targetWrapped > TOTAL_FRAMES) targetWrapped -= TOTAL_FRAMES;
                    let finalSnap = 1;
                    let minDist = Infinity;
                    for (const pt of SNAP_POINTS) {
                        const dist = Math.min(
                            Math.abs(targetWrapped - pt),
                            Math.abs(targetWrapped - (pt + TOTAL_FRAMES)),
                            Math.abs(targetWrapped - (pt - TOTAL_FRAMES))
                        );
                        if (dist < minDist) { minDist = dist; finalSnap = pt; }
                    }
                    setSnappedFrame(finalSnap);
                }
            }
        });
    }, [smoothFrame, isSettled]);

    const handlePointerDown = (e) => {
        isDragging.current = true;
        setIsSettled(false);
        startX.current = e.clientX;
        lastFrame.current = smoothFrame.get();
        frameMotion.stop();
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - startX.current;
        frameMotion.set(lastFrame.current - deltaX * 0.5);
    };

    const handlePointerUp = (e) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        let finalFrame = frameMotion.get();
        let normalized = finalFrame % TOTAL_FRAMES;
        if (normalized <= 0) normalized += TOTAL_FRAMES;
        let closestDist = Infinity, bestTargetNorm = 1;
        for (const pt of SNAP_POINTS) {
            const dist = Math.min(
                Math.abs(normalized - pt),
                Math.abs(normalized - (pt + TOTAL_FRAMES)),
                Math.abs(normalized - (pt - TOTAL_FRAMES))
            );
            if (dist < closestDist) { closestDist = dist; bestTargetNorm = pt; }
        }
        let diff = bestTargetNorm - normalized;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const snapTarget = finalFrame + diff;
        targetFrameRef.current = snapTarget;
        frameMotion.set(snapTarget);
    };

    const formattedFrame = String(currentFrame).padStart(4, '0');
    const imagePath = `/images/rot360/frame_${formattedFrame}.avif`;

    return (
        <div
            className={styles.viewerContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <img
                src={imagePath}
                alt="360 View"
                className={styles.backgroundImage}
                draggable="false"
            />

            <div
                className={styles.canvasOverlay}
                style={{
                    opacity: isSettled ? 1 : 0,
                    transition: 'opacity 0.2s ease-in-out',
                    pointerEvents: isSettled ? 'auto' : 'none'
                }}
            >
                <BuildingModel
                    currentFrame={snappedFrame}
                    filteredFlatIds={filteredFlatIds}
                    onFlatClick={onFlatClick}
                />
            </div>

            <div className={styles.instruction}>
                Drag to rotate · Click a flat to explore
            </div>

            <div className={styles.pointIndicator}>
                {snappedFrame === 1 || snappedFrame === 360 ? 'A1 Point' :
                    snappedFrame === 90 ? 'A2 Point' :
                        snappedFrame === 180 ? 'A3 Point' :
                            snappedFrame === 270 ? 'A4 Point' : ''}
            </div>
        </div>
    );
}
