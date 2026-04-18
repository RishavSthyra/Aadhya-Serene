'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import styles from '../../app/home.module.css';

const PRELOADER_SRC = 'https://lottie.host/bd9e38e5-a392-4ce2-aaa8-977831de5904/yOJKXKHlCk.lottie';

export default function LuxuryPreloader({ onCycleComplete }) {
  const completionReportedRef = useRef(false);
  const [dotLottie, setDotLottie] = useState(null);

  useEffect(() => {
    if (!dotLottie) {
      return undefined;
    }

    const handleComplete = () => {
      if (completionReportedRef.current) {
        return;
      }

      completionReportedRef.current = true;
      onCycleComplete?.();
    };

    dotLottie.addEventListener('complete', handleComplete);

    return () => {
      dotLottie.removeEventListener('complete', handleComplete);
    };
  }, [dotLottie, onCycleComplete]);

  return (
    <div className={styles.luxuryLoader} aria-label="Loading Aadhya Serene">
      <DotLottieReact
        src={PRELOADER_SRC}
        loop
        autoplay
        className={styles.luxuryLoaderAnimation}
        dotLottieRefCallback={setDotLottie}
        renderConfig={{ autoResize: true }}
      />
    </div>
  );
}