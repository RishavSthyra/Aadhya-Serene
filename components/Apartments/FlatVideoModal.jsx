'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './FlatVideoModal.module.css';

const CDN_BASE = 'https://du67w5n77drxm.cloudfront.net/videos/flats';

function getFlatVideoUrl(flatId, quality = '1440p', codec = 'av1') {
    const name = `flat_${flatId}_exterior_1-1`;
    return `${CDN_BASE}/${name}/${quality}/${name}-${codec}.webm`;
}

export default function FlatVideoModal({ apartment, onClose }) {
    const videoRef = useRef(null);
    const [videoError, setVideoError] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const { id, type, area, facing, floor, balconies } = apartment;

    useEffect(() => {
        // Close on Escape key
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    // Try loading high-quality first, fall back to h264 mp4
    const webmUrl = getFlatVideoUrl(id, '1440p', 'av1');
    const mp4Url = `${CDN_BASE}/flat_${id}_exterior_1-1/1080p/flat_${id}_exterior_1-1-h264.mp4`;

    const floorLabel = floor === 'G' ? 'Ground' : `Floor ${floor}`;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>

                {/* Close Button */}
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close video">
                    ✕
                </button>

                {/* Video Container */}
                <div className={styles.videoWrap}>
                    {!videoError ? (
                        <>
                            {!videoLoaded && (
                                <div className={styles.loadingPlaceholder}>
                                    <div className={styles.spinner} />
                                    <span>Loading preview…</span>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                className={styles.video}
                                autoPlay
                                muted
                                loop
                                playsInline
                                onCanPlay={() => setVideoLoaded(true)}
                                onError={() => setVideoError(true)}
                                style={{ opacity: videoLoaded ? 1 : 0 }}
                            >
                                <source src={webmUrl} type="video/webm" />
                                <source src={mp4Url} type="video/mp4" />
                            </video>
                        </>
                    ) : (
                        <div className={styles.noVideo}>
                            <span className={styles.noVideoIcon}>🎬</span>
                            <span>Video preview not available for Flat {id}</span>
                        </div>
                    )}
                </div>

                {/* Flat Info Bar */}
                <div className={styles.infoBar}>
                    <div className={styles.infoLeft}>
                        <div className={styles.flatBadge}>
                            <span className={styles.flatLabel}>FLAT</span>
                            <span className={styles.flatNum}>{id}</span>
                        </div>
                        <div className={styles.flatMeta}>
                            <span className={styles.metaType}>{type}</span>
                            <span className={styles.metaDot}>·</span>
                            <span>{area} sqft</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.metaCap}>{facing} Facing</span>
                            <span className={styles.metaDot}>·</span>
                            <span>{floorLabel}</span>
                            {balconies > 0 && (
                                <>
                                    <span className={styles.metaDot}>·</span>
                                    <span>{balconies} Balcon{balconies > 1 ? 'ies' : 'y'}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={styles.infoRight}>
                        <span className={styles.availPill}>Available</span>
                        <a
                            href={`/apartments/${id}`}
                            className={styles.viewFloorBtn}
                        >
                            View Floor Plan <span>›</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
