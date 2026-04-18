'use client';

import React from 'react';
import styles from '../../app/home.module.css';

export default function LuxuryPreloader() {
  return (
    <div className={styles.luxuryLoader} aria-label="Loading Aadhya Serene">
      <div className={styles.minimalLoaderShell} aria-hidden="true">
        <span className={`${styles.minimalLoaderRing} ${styles.minimalLoaderRingOuter}`} />
        <span className={`${styles.minimalLoaderRing} ${styles.minimalLoaderRingMiddle}`} />
        <span className={styles.minimalLoaderCore} />
        <span className={styles.minimalLoaderDot} />
      </div>
    </div>
  );
}
