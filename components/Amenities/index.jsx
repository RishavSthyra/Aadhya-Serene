'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import useResponsiveViewport from '@/hooks/useResponsiveViewport';
import styles from '../../app/amenities/amenities.module.css';

const AMENITY_POSTERS = {
    rooftopLeisureDeck: '/assets/amenities/rooftopLeisureDeck.jpg',
    childrensPlayArea: '/assets/amenities/childrensPlayArea.jpg',
    swimmingPool: '/assets/amenities/swimmingPool.jpg',
    gymnasium: '/assets/amenities/gymnasium.jpg',
    indoorGames: '/assets/amenities/indoorGames.jpg',
    clubhouse: '/assets/amenities/clubhouse.jpg',
    basketball: '/assets/amenities/basketball.jpg',
    badminton: '/assets/amenities/badminton.jpg',
};

const AMENITY_FALLBACK = '/assets/amenities/rooftopLeisureDeck.jpg';

const AMENITIES_LIST = [
    {
        title: 'Rooftop Leisure Deck',
        label: '01',
        url: 'rooftopLeisureDeck',
        eyebrow: 'Sky Retreat',
        description: 'Unwind above the city with serene green views and calm evening light.',
    },
    {
        title: "Children's Play Area",
        label: '02',
        url: 'childrensPlayArea',
        eyebrow: 'Family Spaces',
        description: 'Safe, engaging, and filled with joyful moments for everyday play.',
    },
    {
        title: 'Swimming Pool',
        label: '03',
        url: 'swimmingPool',
        eyebrow: 'Featured',
        description: 'Relax, refresh, and recharge in a resort-style pool setting.',
    },
    {
        title: 'Gymnasium',
        label: '04',
        url: 'gymnasium',
        eyebrow: 'Wellness',
        description: 'A focused fitness environment designed for strength, flow, and routine.',
    },
    {
        title: 'Indoor Games Lounge',
        label: '05',
        url: 'indoorGames',
        eyebrow: 'Social Leisure',
        description: 'Elegant interiors crafted for gathering, connection, and celebration.',
    },
    {
        title: 'Clubhouse',
        label: '06',
        url: 'clubhouse',
        eyebrow: 'Community',
        description: 'Thoughtfully composed indoor spaces for hosting, meeting, and relaxing.',
    },
    {
        title: 'Outdoor Basketball Court',
        label: '07',
        url: 'basketball',
        eyebrow: 'Active Living',
        description: 'Stay energized with premium outdoor recreation beneath open skies.',
    },
    {
        title: 'Outdoor Badminton Court',
        label: '08',
        url: 'badminton',
        eyebrow: 'Active Living',
        description: 'A bright, open court that keeps everyday movement dynamic and social.',
    },
];

const CAROUSEL_TRANSITION = {
    duration: 0.82,
    ease: [0.22, 1, 0.36, 1],
};
const UI_IDLE_HIDE_DELAY_MS = 2000;
const UI_REVEAL_LOCK_MS = 520;
const UI_HIDE_LOCK_MS = 760;

function normalizeIndex(index, length) {
    return ((index % length) + length) % length;
}

function getCircularDistance(index, activeIndex, total) {
    let distance = index - activeIndex;

    if (distance > total / 2) {
        distance -= total;
    }

    if (distance < -total / 2) {
        distance += total;
    }

    return distance;
}

function getCardMetrics(distance, isCompact, visibleDepth) {
    const direction = distance === 0 ? 0 : distance > 0 ? 1 : -1;
    const absDistance = Math.abs(distance);

    if (absDistance === 0) {
        return {
            x: 0,
            y: 0,
            rotateY: 0,
            scale: 1,
            opacity: 1,
            zIndex: 50,
            blur: 0,
            lift: 0,
        };
    }

    if (absDistance === 1) {
        return {
            x: direction * (isCompact ? 232 : 418),
            y: isCompact ? 24 : 28,
            rotateY: direction * -32,
            scale: isCompact ? 0.84 : 0.85,
            opacity: 0.95,
            zIndex: 32,
            blur: 0.05,
            lift: 18,
        };
    }

    if (absDistance === 2) {
        return {
            x: direction * (isCompact ? 378 : 734),
            y: isCompact ? 44 : 56,
            rotateY: direction * -50,
            scale: isCompact ? 0.71 : 0.73,
            opacity: 0.8,
            zIndex: 18,
            blur: 0.16,
            lift: 36,
        };
    }

    if (absDistance === 3 && visibleDepth >= 3) {
        return {
            x: direction * (isCompact ? 438 : 918),
            y: isCompact ? 58 : 74,
            rotateY: direction * -64,
            scale: isCompact ? 0.62 : 0.6,
            opacity: isCompact ? 0 : 0.58,
            zIndex: 8,
            blur: 0.22,
            lift: 52,
        };
    }

    return {
        x: direction * (isCompact ? 438 : 840),
        y: isCompact ? 58 : 72,
        rotateY: direction * -68,
        scale: isCompact ? 0.64 : 0.66,
        opacity: 0,
        zIndex: 0,
        blur: 0.6,
        lift: 40,
    };
}

export default function Amenities({ initialAmenity = null }) {
    const router = useRouter();
    const { isTabletOrBelow, width } = useResponsiveViewport();
    const activeIndexRef = useRef(0);
    const interactionLockRef = useRef(false);
    const wheelTimeoutRef = useRef(null);
    const uiHideTimeoutRef = useRef(null);
    const uiTransitionLockRef = useRef(false);
    const dragStateRef = useRef({
        pointerId: null,
        startX: 0,
        startY: 0,
        axis: null,
        moved: false,
    });
    const defaultAmenity = 'rooftopLeisureDeck';
    const isValidRequestedAmenity = AMENITIES_LIST.some((item) => item.url === initialAmenity);
    const selectedAmenityFromUrl = isValidRequestedAmenity ? initialAmenity : defaultAmenity;
    const [activeAmenity, setActiveAmenity] = useState(selectedAmenityFromUrl);
    const [isUiVisible, setIsUiVisible] = useState(true);

    const activeIndex = useMemo(() => {
        const index = AMENITIES_LIST.findIndex((item) => item.url === activeAmenity);
        return index === -1 ? 0 : index;
    }, [activeAmenity]);

    const visibleDepth = useMemo(() => {
        if (isTabletOrBelow) {
            return 2;
        }

        return width >= 1850 ? 3 : 2;
    }, [isTabletOrBelow, width]);

    const swipeThreshold = isTabletOrBelow ? 24 : 56;

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        document.body.style.opacity = '1';
        document.body.style.transition = '';
    }, []);

    useEffect(() => {
        setActiveAmenity(selectedAmenityFromUrl);
        window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${selectedAmenityFromUrl}` }));
    }, [selectedAmenityFromUrl]);

    const updateAmenity = useCallback((nextIndex) => {
        const normalizedIndex = normalizeIndex(nextIndex, AMENITIES_LIST.length);
        const nextAmenity = AMENITIES_LIST[normalizedIndex];

        setActiveAmenity(nextAmenity.url);
        router.replace(`/amenities?amenity=${nextAmenity.url}`, { scroll: false });
        window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${nextAmenity.url}` }));
    }, [router]);

    const queueMove = useCallback((direction) => {
        if (interactionLockRef.current) {
            return;
        }

        interactionLockRef.current = true;
        updateAmenity(activeIndexRef.current + direction);

        window.clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = window.setTimeout(() => {
            interactionLockRef.current = false;
        }, 340);
    }, [updateAmenity]);

    const handleWheel = useCallback((event) => {
        const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;

        if (Math.abs(dominantDelta) < 18) {
            return;
        }

        event.preventDefault();
        queueMove(dominantDelta > 0 ? 1 : -1);
    }, [queueMove]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowRight') {
                queueMove(1);
            }

            if (event.key === 'ArrowLeft') {
                queueMove(-1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [queueMove]);

    useEffect(() => () => {
        window.clearTimeout(wheelTimeoutRef.current);
    }, []);

    useEffect(() => {
        if (isTabletOrBelow) {
            window.clearTimeout(uiHideTimeoutRef.current);
            uiTransitionLockRef.current = false;
            setIsUiVisible(true);
            return undefined;
        }

        const lockUiTransitions = (duration) => {
            uiTransitionLockRef.current = true;
            window.setTimeout(() => {
                uiTransitionLockRef.current = false;
            }, duration);
        };

        const scheduleUiHide = () => {
            window.clearTimeout(uiHideTimeoutRef.current);
            uiHideTimeoutRef.current = window.setTimeout(() => {
                setIsUiVisible((current) => {
                    if (!current || uiTransitionLockRef.current) {
                        return current;
                    }

                    lockUiTransitions(UI_HIDE_LOCK_MS);
                    return false;
                });
            }, UI_IDLE_HIDE_DELAY_MS);
        };

        const revealUi = () => {
            setIsUiVisible((current) => {
                if (current || uiTransitionLockRef.current) {
                    return current;
                }

                lockUiTransitions(UI_REVEAL_LOCK_MS);
                return true;
            });

            scheduleUiHide();
        };

        const handlePointerMove = () => {
            revealUi();
        };

        const handlePointerDown = () => {
            revealUi();
        };

        scheduleUiHide();
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerdown', handlePointerDown, { passive: true });

        return () => {
            window.clearTimeout(uiHideTimeoutRef.current);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [isTabletOrBelow]);

    const handlePointerDown = useCallback((event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            axis: null,
            moved: false,
        };
    }, []);

    const handlePointerMove = useCallback((event) => {
        const { pointerId, startX, startY, axis, moved } = dragStateRef.current;

        if (pointerId !== event.pointerId || moved) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (!axis) {
            if (absDeltaX < 8 && absDeltaY < 8) {
                return;
            }

            dragStateRef.current.axis = absDeltaX > absDeltaY ? 'x' : 'y';
        }

        if (dragStateRef.current.axis !== 'x') {
            return;
        }

        if (absDeltaX < swipeThreshold || absDeltaX <= absDeltaY) {
            return;
        }

        dragStateRef.current.moved = true;
        queueMove(deltaX < 0 ? 1 : -1);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, [queueMove, swipeThreshold]);

    const finishPointerGesture = useCallback((event) => {
        const { pointerId, startX, startY, moved } = dragStateRef.current;

        if (pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            axis: null,
            moved: false,
        };

        if (moved || Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
            return;
        }

        queueMove(deltaX < 0 ? 1 : -1);
    }, [queueMove, swipeThreshold]);

    const cancelPointerGesture = useCallback((event) => {
        if (dragStateRef.current.pointerId !== event.pointerId) {
            return;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            axis: null,
            moved: false,
        };
    }, []);

    return (
        <main className={styles.container}>
            <div className={styles.sceneOverlay} aria-hidden="true" />

            <section
                className={`${styles.copyPanel} ${!isTabletOrBelow && !isUiVisible ? styles.copyPanelHidden : ''}`}
            >
                <div className={styles.copyEyebrow}>Amenities</div>
                <h1 className={styles.copyTitle}>
                    <span>Curated Spaces.</span>
                    <span>Elevated Living.</span>
                </h1>
                <div className={styles.copyDivider} aria-hidden="true" />
                <p className={styles.copyBody}>
                    <span>Thoughtfully designed amenities that bring comfort,</span>
                    <span>connection, and calm to your everyday rhythm.</span>
                </p>
                <button
                    type="button"
                    className={styles.copyAction}
                    onClick={() => updateAmenity(activeIndex)}
                >
                    <Play className={styles.copyActionIcon} aria-hidden="true" />
                    Experience Amenities
                </button>
            </section>

            <section
                className={`${styles.carouselDock} ${!isTabletOrBelow && !isUiVisible ? styles.carouselDockHidden : ''}`}
            >
                <div className={styles.carouselShell}>
                    <div
                        className={styles.carouselViewport}
                        onWheel={handleWheel}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={finishPointerGesture}
                        onPointerCancel={cancelPointerGesture}
                        onPointerLeave={cancelPointerGesture}
                    >
                        <div className={styles.carouselStage}>
                            {AMENITIES_LIST.map((item, index) => {
                                const distance = getCircularDistance(index, activeIndex, AMENITIES_LIST.length);
                                const metrics = getCardMetrics(distance, isTabletOrBelow, visibleDepth);
                                const isVisible = Math.abs(distance) <= visibleDepth;
                                const isActive = distance === 0;
                                const posterSrc = AMENITY_POSTERS[item.url] || AMENITY_FALLBACK;

                                return (
                                    <motion.button
                                        key={item.url}
                                        type="button"
                                        className={`${styles.carouselCard} ${isActive ? styles.carouselCardActive : ''}`}
                                        animate={{
                                            x: metrics.x,
                                            y: metrics.y,
                                            rotateY: metrics.rotateY,
                                            scale: metrics.scale,
                                            opacity: metrics.opacity,
                                            filter: `blur(${metrics.blur}px)`,
                                        }}
                                        transition={CAROUSEL_TRANSITION}
                                        style={{
                                            zIndex: metrics.zIndex,
                                            pointerEvents: isVisible ? 'auto' : 'none',
                                        }}
                                        onClick={() => updateAmenity(index)}
                                        aria-pressed={isActive}
                                        aria-label={item.title}
                                    >
                                        <div
                                            className={styles.cardChrome}
                                            style={{ marginTop: `${metrics.lift}px` }}
                                        >
                                            <div className={styles.cardTopRow}>
                                                <span className={styles.cardLabel}>{item.label}</span>
                                                <span className={styles.cardEyebrow}>{item.eyebrow}</span>
                                            </div>

                                            <div className={styles.cardImageWrap}>
                                                <img
                                                    src={posterSrc}
                                                    alt={item.title}
                                                    className={styles.cardImage}
                                                    loading="lazy"
                                                    decoding="async"
                                                    onError={(event) => {
                                                        event.currentTarget.src = AMENITY_FALLBACK;
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.cardContent}>
                                                <h2 className={styles.cardTitle}>{item.title}</h2>
                                                <p className={styles.cardDescription}>{item.description}</p>
                                            </div>

                                            {isActive ? (
                                                <div className={styles.cardProgressRow} aria-hidden="true">
                                                    <span className={`${styles.cardProgressSegment} ${styles.cardProgressSegmentActive}`} />
                                                    <span className={styles.cardProgressSegment} />
                                                    <span className={styles.cardProgressSegment} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.carouselFooter}>
                    <div className={styles.carouselButtons}>
                        <button
                            type="button"
                            className={styles.carouselButton}
                            onClick={() => queueMove(-1)}
                            aria-label="Previous amenity"
                        >
                            <ArrowLeft className={styles.carouselButtonIcon} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className={styles.carouselButton}
                            onClick={() => queueMove(1)}
                            aria-label="Next amenity"
                        >
                            <ArrowRight className={styles.carouselButtonIcon} aria-hidden="true" />
                        </button>
                    </div>
                    {/* <span className={styles.carouselHint}>Drag or scroll to explore</span> */}
                </div>
            </section>
        </main>
    );
}
