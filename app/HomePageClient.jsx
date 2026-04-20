"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import usePerformanceProfile from "@/hooks/usePerformanceProfile";
import {
  markHomeRefreshLoaderSeen,
  setHomePreloaderComplete,
  shouldShowHomeRefreshLoader,
} from "@/lib/home-loader";
import styles from "./home.module.css";

const LuxuryPreloader = dynamic(() => import("@/components/Home/LuxuryPreloader"), {
  ssr: false,
});
const HomeScrollLottie = dynamic(() => import("@/components/Home/HomeScrollLottie"), {
  ssr: false,
  loading: () => null,
});

const HERO_TITLE_LINES = ["Quiet luxury,", "shaped for harmony."];
const HERO_MARKERS = [
  "132 curated residences",
  "Sky leisure amenities",
  "North Bengaluru address",
];

const heroRevealTransition = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1],
};

const heroRevealVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedHeroTitle({ isActive, disableAnimation = false }) {
  if (disableAnimation) {
    return (
      <span className={styles.heroTitleStack} aria-label={HERO_TITLE_LINES.join(" ")}>
        {HERO_TITLE_LINES.map((line) => (
          <span key={line} className={styles.heroTitleLine}>
            <span className={styles.heroTitleLetter}>{line}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={styles.heroTitleStack} aria-label={HERO_TITLE_LINES.join(" ")}>
      {HERO_TITLE_LINES.map((line, lineIndex) => (
        <span key={line} className={styles.heroTitleLine}>
          {Array.from(line).map((char, charIndex) => {
            const key = `${lineIndex}-${charIndex}-${char}`;
            const isSpace = char === " ";

            return (
              <motion.span
                key={key}
                className={
                  isSpace ? styles.heroTitleSpace : styles.heroTitleLetter
                }
                initial="hidden"
                animate={isActive ? "visible" : "hidden"}
                variants={{
                  hidden: { y: "112%", opacity: 0, filter: "blur(8px)" },
                  visible: { y: "0%", opacity: 1, filter: "blur(0px)" },
                }}
                transition={{
                  duration: 0.92,
                  delay: 0.36 + lineIndex * 0.24 + charIndex * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {isSpace ? "\u00A0" : char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

export default function HomePageClient() {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const [showLoader, setShowLoader] = useState(() => shouldShowHomeRefreshLoader());
  const [loaderCycleComplete, setLoaderCycleComplete] = useState(() => !shouldShowHomeRefreshLoader());
  const [heroAnimationActive, setHeroAnimationActive] = useState(false);
  const { isTabletOrBelow, isConstrainedDevice, shouldReduceMotion } = usePerformanceProfile();
  const shouldUseLightMotion = isConstrainedDevice || shouldReduceMotion;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const shouldUseRefreshLoader = shouldShowHomeRefreshLoader();
    markHomeRefreshLoaderSeen();

    if (!shouldUseRefreshLoader) {
      setHomePreloaderComplete(true);
      setLoaderCycleComplete(true);
      setShowLoader(false);
      return undefined;
    }

    let safetyTimeoutId = 0;
    setHomePreloaderComplete(false);

    // Safety fallback so the home screen never gets stuck behind the loader.
    safetyTimeoutId = window.setTimeout(() => {
      setLoaderCycleComplete(true);
      setHomePreloaderComplete(true);
    }, 12000);

    return () => {
      window.clearTimeout(safetyTimeoutId);
    };
  }, []);

  useEffect(() => {
    if (!showLoader || !loaderCycleComplete) {
      return;
    }

    setHomePreloaderComplete(true);
    setShowLoader(false);
  }, [loaderCycleComplete, showLoader]);

  useEffect(() => {
    if (showLoader) {
      setHeroAnimationActive(false);
      return undefined;
    }

    if (shouldUseLightMotion) {
      setHeroAnimationActive(true);
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setHeroAnimationActive(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shouldUseLightMotion, showLoader]);

  const navigateTo = useCallback(
    (path) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const targetLayout = path === "/apartments" ? "apartments" : "about";
      window.dispatchEvent(new CustomEvent("bg-layout", { detail: targetLayout }));

      const heroInner = document.getElementById("home-inner");
      if (heroInner) {
        heroInner.style.opacity = "0";
        heroInner.style.transition = "opacity 0.6s ease";
      } else {
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.6s ease";
      }

      const routePushDelay = path === "/apartments" && isTabletOrBelow ? 0 : 600;

      setTimeout(() => {
        router.push(path);
      }, routePushDelay);
    },
    [isTabletOrBelow, router],
  );

  useEffect(() => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    isNavigatingRef.current = false;

    const onWheel = (e) => {
      if (e.deltaY > 30 && !isNavigatingRef.current) {
        navigateTo("/about");
      }
    };

    let touchStartY = 0;

    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (dy > 60) navigateTo("/about");
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigateTo]);

  return (
    <main className={styles.heroSection}>
      {showLoader && <LuxuryPreloader onCycleComplete={() => setLoaderCycleComplete(true)} />}

      <section id="home-inner" className={styles.heroInner}>
        <div className={styles.heroContent}>
          <motion.div
            initial="hidden"
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 0.12 }}
            className={styles.heroEyebrow}
          >
            {/* <span className={styles.heroEyebrowDot} /> */}
            Aadhya Serene, Thanisandra
          </motion.div>

          <h1 className={styles.heroTitle}>
            <AnimatedHeroTitle
              isActive={heroAnimationActive}
              disableAnimation={shouldUseLightMotion}
            />
          </h1>

          <motion.p
            initial="hidden"
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 1.05 }}
            className={styles.heroSubtitle}
          >
            A calmer expression of premium living, with open skies, elevated leisure,
            and beautifully composed homes designed for a more serene daily rhythm.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ duration: 0.85, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className={styles.heroMarkerRow}
          >
            {HERO_MARKERS.map((marker) => (
              <span key={marker} className={styles.heroMarker}>
                {marker}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 1.34 }}
            className={styles.heroActions}
          >
            <button
              type="button"
              onClick={() => navigateTo("/apartments")}
              className={styles.heroPrimaryCta}
            >
              <span>Explore Residences</span>
              <span className={styles.heroCtaArrow}>↗</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/about")}
              className={styles.heroSecondaryCta}
            >
              View Project Story
            </button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ duration: 0.85, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className={styles.heroScrollRow}
          >
            {/* <span className={styles.desktopScroll}>Scroll to continue</span> */}
          </motion.div>
        </div>
      </section>
      {!isTabletOrBelow && !shouldUseLightMotion ? (
        <HomeScrollLottie className={styles.heroLottie} />
      ) : null}
    </main>
  );
}
