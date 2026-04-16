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

function AnimatedHeroTitle() {
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
                initial={{ y: "112%", opacity: 0, filter: "blur(8px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
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
  const [showLoader, setShowLoader] = useState(true);
  const { isTabletOrBelow } = useResponsiveViewport();

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("luxuryHomeLoaderShown");
    const loaderDurationMs = isTabletOrBelow ? 1600 : 3200;

    if (hasSeenLoader) {
      setShowLoader(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoader(false);
      sessionStorage.setItem("luxuryHomeLoaderShown", "true");
    }, loaderDurationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [isTabletOrBelow]);

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
      {showLoader && <LuxuryPreloader />}

      <section id="home-inner" className={styles.heroInner}>
        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={styles.heroEyebrow}
          >
            {/* <span className={styles.heroEyebrowDot} /> */}
            Aadhya Serene, Thanisandra
          </motion.div>

          <h1 className={styles.heroTitle}>
            <AnimatedHeroTitle />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className={styles.heroSubtitle}
          >
            A calmer expression of premium living, with open skies, elevated leisure,
            and beautifully composed homes designed for a more serene daily rhythm.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.34, ease: [0.22, 1, 0.36, 1] }}
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
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
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
