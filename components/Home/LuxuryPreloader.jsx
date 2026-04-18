'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import styles from '../../app/home.module.css';

const PRELOADER_SRC = 'https://lottie.host/7497b625-201f-466d-9410-c4b7c05b5897/mLFBWu3jem.lottie';

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
        autoplay
        className={styles.luxuryLoaderAnimation}
        dotLottieRefCallback={setDotLottie}
        renderConfig={{ autoResize: true }}
      />
    </div>
  );
}
