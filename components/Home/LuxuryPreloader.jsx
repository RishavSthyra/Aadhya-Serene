'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '../../app/home.module.css';

const PRELOADER_DURATION_MS = 4200;
const EASE_OUT_CUBIC = (value) => 1 - ((1 - value) ** 3);
const WORDMARK = 'AADHYA SERENE';

export default function LuxuryPreloader({ onCycleComplete }) {
  const completionReportedRef = useRef(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / PRELOADER_DURATION_MS, 1);
      const easedProgress = EASE_OUT_CUBIC(rawProgress);
      setProgress(easedProgress);

      if (rawProgress >= 1) {
        if (!completionReportedRef.current) {
          completionReportedRef.current = true;
          onCycleComplete?.();
        }
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [onCycleComplete]);

  const progressPercent = Math.round(progress * 100);

  return (
    <div
      className={styles.luxuryLoader}
      aria-label="Loading Aadhya Serene"
      style={{ '--loader-progress': `${progressPercent}%` }}
    >
      <div className={styles.luxuryLoaderBackdrop} />

      <div className={styles.luxuryLoaderInner}>
        <div className={styles.luxuryLoaderKicker}>Loading</div>

        <div className={styles.luxuryLoaderWordmarkWrap}>
          <div className={styles.luxuryLoaderWordmarkBase}>{WORDMARK}</div>
          <div className={styles.luxuryLoaderWordmarkFill} aria-hidden="true">
            {WORDMARK}
          </div>
          <div className={styles.luxuryLoaderWordmarkGlow} aria-hidden="true">
            {WORDMARK}
          </div>
        </div>

        <div className={styles.luxuryLoaderProgressMeta} aria-hidden="true">
          <span>Loading</span>
          <span>{progressPercent}%</span>
        </div>

        <div className={styles.luxuryLoaderProgressTrack} aria-hidden="true">
          <div className={styles.luxuryLoaderProgressBar} />
        </div>
      </div>
    </div>
  );
}
