"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import useResponsiveViewport from "@/hooks/useResponsiveViewport";
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
const HOME_REFRESH_LOADER_FLAG = "__aadhyaHomeRefreshLoaderShownInDocument";

function shouldShowHomeRefreshLoader() {
  if (typeof window === "undefined") {
    return true;
  }

  return !window[HOME_REFRESH_LOADER_FLAG];
}

function AnimatedHeroTitle({ isActive }) {
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
  const [loaderBackgroundReady, setLoaderBackgroundReady] = useState(() => !shouldShowHomeRefreshLoader());
  const [heroAnimationActive, setHeroAnimationActive] = useState(false);
  const { isTabletOrBelow } = useResponsiveViewport();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const shouldUseRefreshLoader = !window[HOME_REFRESH_LOADER_FLAG];
    window[HOME_REFRESH_LOADER_FLAG] = true;

    if (!shouldUseRefreshLoader) {
      setLoaderCycleComplete(true);
      setLoaderBackgroundReady(true);
      setShowLoader(false);
      return undefined;
    }

    let rafId = 0;
    let safetyTimeoutId = 0;
    let trackedVideo = null;

    const markBackgroundReady = () => {
      setLoaderBackgroundReady(true);
    };

    const handleBackgroundStarted = () => {
      markBackgroundReady();
    };

    const attachVideoListener = () => {
      const transitionVideo = document.getElementById("bg-video-transition");

      if (!transitionVideo) {
        rafId = window.requestAnimationFrame(attachVideoListener);
        return;
      }

      trackedVideo = transitionVideo;

      if (!transitionVideo.paused && transitionVideo.readyState >= 2) {
        markBackgroundReady();
        return;
      }

      transitionVideo.addEventListener("playing", markBackgroundReady, { once: true });
    };

    window.addEventListener("bg-transition-started", handleBackgroundStarted);
    attachVideoListener();

    // Safety fallback so the page never gets stuck if media startup fails.
    safetyTimeoutId = window.setTimeout(() => {
      setLoaderCycleComplete(true);
      setLoaderBackgroundReady(true);
    }, 12000);

    return () => {
      window.removeEventListener("bg-transition-started", handleBackgroundStarted);
      window.clearTimeout(safetyTimeoutId);

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      if (trackedVideo) {
        trackedVideo.removeEventListener("playing", markBackgroundReady);
      }
    };
  }, []);

  useEffect(() => {
    if (!showLoader) {
      return;
    }

    if (loaderCycleComplete && loaderBackgroundReady) {
      setShowLoader(false);
    }
  }, [loaderBackgroundReady, loaderCycleComplete, showLoader]);

  useEffect(() => {
    if (showLoader) {
      setHeroAnimationActive(false);
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setHeroAnimationActive(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [showLoader]);

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

      setTimeout(() => {
        router.push(path);
      }, 600);
    },
    [router],
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
            <AnimatedHeroTitle isActive={heroAnimationActive} />
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
      {!isTabletOrBelow ? <HomeScrollLottie className={styles.heroLottie} /> : null}
    </main>
  );
}
