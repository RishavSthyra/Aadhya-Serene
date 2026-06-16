"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Montserrat } from "next/font/google";
import {
  ArrowRight,
  Building2,
  MapPin,
  Sparkles,
  Trees,
} from "lucide-react";
import usePerformanceProfile from "@/hooks/usePerformanceProfile";
import LuxuryPreloader from "@/components/Home/LuxuryPreloader";
import {
  markHomeRefreshLoaderSeen,
  setHomePreloaderComplete,
  shouldShowHomeRefreshLoader,
} from "@/lib/home-loader";
import styles from "./home.module.css";

const statsFont = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  display: "swap",
});

const HERO_TITLE_LINES = ["THE ART OF", "THOUGHTFUL LIVING"];
const HERO_STATS = [
  { icon: Building2, value: "136", label: "Flats" },
  { icon: Sparkles, value: "20+", label: "World Class Amenities" },
  { icon: Trees, value: "1.2", label: "Acres" },
  { icon: MapPin, value: "1", label: "Prestige Address" },
];
const WHEEL_NAV_THRESHOLD = 4;

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
                className={isSpace ? styles.heroTitleSpace : styles.heroTitleLetter}
                initial={false}
                animate={isActive ? "visible" : "hidden"}
                variants={{
                  hidden: { y: "112%", opacity: 0, filter: "blur(8px)" },
                  visible: { y: "0%", opacity: 1, filter: "blur(0px)" },
                }}
                transition={{
                  duration: 0.92,
                  delay: 0.32 + lineIndex * 0.2 + charIndex * 0.04,
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
  const [heroAnimationActive, setHeroAnimationActive] = useState(true);
  const [showPreloader, setShowPreloader] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return shouldShowHomeRefreshLoader();
  });
  const { isTabletOrBelow, preferLightExperience } = usePerformanceProfile();
  const shouldUseLightMotion = preferLightExperience;

  const primeApartmentsRoute = useCallback(() => {
    router.prefetch("/apartments");
  }, [router]);

  const handlePreloaderRevealStart = useCallback(() => {
    markHomeRefreshLoaderSeen();
    setHomePreloaderComplete(true);
  }, []);

  const handlePreloaderCycleComplete = useCallback(() => {
    setShowPreloader(false);
  }, []);

  useEffect(() => {
    router.prefetch("/project-overview");
    router.prefetch("/apartments");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (showPreloader) {
      setHomePreloaderComplete(false);
      return undefined;
    }

    markHomeRefreshLoaderSeen();
    setHomePreloaderComplete(true);
    return undefined;
  }, [showPreloader]);

  useEffect(() => {
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
  }, [shouldUseLightMotion]);

  const navigateTo = useCallback(
    (path) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (path === "/apartments") {
        window.dispatchEvent(new CustomEvent("bg-layout", { detail: "apartments" }));
      }

      if (path === "/apartments") {
        primeApartmentsRoute();
      }

      const heroInner = document.getElementById("home-inner");
      if (heroInner) {
        heroInner.style.opacity = "0";
        heroInner.style.transition = "opacity 0.42s cubic-bezier(0.22,1,0.36,1)";
      } else {
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.42s cubic-bezier(0.22,1,0.36,1)";
      }

      const routePushDelay = path === "/apartments" && isTabletOrBelow ? 80 : 120;

      setTimeout(() => {
        router.push(path);
      }, routePushDelay);
    },
    [isTabletOrBelow, primeApartmentsRoute, router],
  );

  useEffect(() => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    const heroInner = document.getElementById("home-inner");
    if (heroInner) {
      heroInner.style.opacity = "1";
      heroInner.style.transition = "";
      heroInner.style.pointerEvents = "auto";
    }
    isNavigatingRef.current = false;

    let accumulatedWheelY = 0;
    let wheelResetTimeoutId = 0;

    const onWheel = (event) => {
      if (isNavigatingRef.current) return;

      accumulatedWheelY += event.deltaY;
      window.clearTimeout(wheelResetTimeoutId);
      wheelResetTimeoutId = window.setTimeout(() => {
        accumulatedWheelY = 0;
      }, 120);

      if (accumulatedWheelY > WHEEL_NAV_THRESHOLD) {
        accumulatedWheelY = 0;
        navigateTo("/project-overview");
      }
    };

    let touchStartY = 0;

    const onTouchStart = (event) => {
      touchStartY = event.touches[0].clientY;
    };

    const onTouchEnd = (event) => {
      const deltaY = touchStartY - event.changedTouches[0].clientY;
      if (deltaY > 60) {
        navigateTo("/project-overview");
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(wheelResetTimeoutId);
    };
  }, [navigateTo]);

  return (
    <main className={styles.heroSection}>
      {showPreloader ? (
        <LuxuryPreloader
          onRevealStart={handlePreloaderRevealStart}
          onCycleComplete={handlePreloaderCycleComplete}
        />
      ) : null}

      <section id="home-inner" className={styles.heroInner}>
        <div className={styles.heroContent}>
          <motion.div
            initial={false}
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 0.12 }}
            className={styles.heroEyebrow}
          >
            Aadhya Serene
          </motion.div>

          <motion.p
            initial={false}
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 0.2 }}
            className={styles.heroIntro}
          >
            Ready residences in Thanisandra, Bengaluru
          </motion.p>

          <h1 className={styles.heroTitle}>
            <AnimatedHeroTitle
              isActive={heroAnimationActive}
              disableAnimation={shouldUseLightMotion}
            />
          </h1>

          <motion.p
            initial={false}
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 0.94 }}
            className={styles.heroSubtitle}
          >
            Premium residences, curated amenities, and a more balanced rhythm of living in North Bengaluru, designed for families who want calm surroundings, thoughtful planning, and everyday comfort without compromise.
          </motion.p>

          <motion.div
            initial={false}
            animate={heroAnimationActive ? "visible" : "hidden"}
            variants={heroRevealVariants}
            transition={{ ...heroRevealTransition, delay: 1.12 }}
            className={styles.heroActions}
          >
            <button
              type="button"
              onClick={() => navigateTo("/apartments")}
              onMouseEnter={primeApartmentsRoute}
              onTouchStart={primeApartmentsRoute}
              className={styles.heroPrimaryCta}
            >
              <span>Explore Residences</span>
              <ArrowRight className={styles.heroCtaArrow} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/project-overview")}
              className={styles.heroSecondaryCta}
            >
              View Project Story
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={false}
          animate={heroAnimationActive ? "visible" : "hidden"}
          variants={heroRevealVariants}
          transition={{ duration: 0.85, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className={styles.heroStatsDock}
        >
          <div className={styles.heroStatsPanel}>
            {HERO_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className={styles.heroStat}>
                <span className={styles.heroStatIconWrap}>
                  <Icon className={styles.heroStatIcon} aria-hidden="true" />
                </span>
                <div className={styles.heroStatText}>
                  <span className={`${styles.heroStatValue} ${statsFont.className}`}>{value}</span>
                  <span className={`${styles.heroStatLabel} ${statsFont.className}`}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
