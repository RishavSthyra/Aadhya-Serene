"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AadhyaLogo from "@/components/Home/AadhyaLogo";
import AbhignaLogo from "@/components/Home/AbhignaLogo";
import styles from "./home.module.css";

const LuxuryPreloader = dynamic(() => import("@/components/Home/LuxuryPreloader"), {
  ssr: false,
});
const HomeScrollLottie = dynamic(() => import("@/components/Home/HomeScrollLottie"), {
  ssr: false,
  loading: () => null,
});

const COMPACT_DEVICE_QUERY = "(max-width: 1180px), (pointer: coarse)";

export default function HomePageClient() {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const [showLoader, setShowLoader] = useState(true);
  const [isCompactDevice, setIsCompactDevice] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_DEVICE_QUERY);
    const updateCompactMode = () => setIsCompactDevice(media.matches);

    updateCompactMode();
    media.addEventListener("change", updateCompactMode);

    return () => {
      media.removeEventListener("change", updateCompactMode);
    };
  }, []);

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("luxuryHomeLoaderShown");
    const loaderDurationMs = isCompactDevice ? 1600 : 3200;

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
  }, [isCompactDevice]);

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
        <div className={styles.heroLogoContainer}>
          <div className={styles.heroLogo1}>
            <AadhyaLogo />
          </div>
          <span className={styles.heroLogoSpacer}>by</span>
          <div className={styles.heroLogo2}>
            <a
              href="https://abhignaconstructions.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AbhignaLogo />
            </a>
          </div>
        </div>

        <h1 className={styles.heroTitle}>Your Haven of Harmony</h1>

        <div className={styles.heroButtonContainer}>
          <button
            type="button"
            onClick={() => navigateTo("/apartments")}
            className={styles.heroCtaButton}
          >
            <span className={styles.heroCtaIcon}>
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.1642 12L12.9571 5.79291L11.5429 7.20712L16.3358 12L11.5429 16.7929L12.9571 18.2071L19.1642 12ZM13.5143 12L7.30722 5.79291L5.89301 7.20712L10.6859 12L5.89301 16.7929L7.30722 18.2071L13.5143 12Z"></path>
              </svg>
            </span>
            <span>Step Inside Aadhya Serene </span>
          </button>

          <span className={styles.desktopScroll}>Scroll Down</span>
        </div>
      </section>
<HomeScrollLottie />
    </main>
  );
}
