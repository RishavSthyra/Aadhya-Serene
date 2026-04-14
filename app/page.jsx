"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AadhyaLogo from "@/components/Home/AadhyaLogo";
import AbhignaLogo from "@/components/Home/AbhignaLogo";
import styles from "./home.module.css";

export default function Page() {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const lastScrollY = useRef(0);
  const [showLoader, setShowLoader] = useState(true);

  // Changed the useEffect to show the loader only once when the page mounts

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("homeLoaderShown");

    if (hasSeenLoader) {
      setShowLoader(false);
      return;
    }

    window.dispatchEvent(new Event("bg-pause"));

    const timer = setTimeout(() => {
      setShowLoader(false);
      sessionStorage.setItem("homeLoaderShown", "true"); // I am adding it to session storage
      window.dispatchEvent(new Event("bg-play"));
    }, 3500);

    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new Event("bg-play"));
    };
  }, []);

  /* Scroll down → navigate to /about (fade out first, like ASW reference) */
  const navigateTo = useCallback(
    (path) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      // Trigger video transition eagerly before push
      window.dispatchEvent(new CustomEvent("bg-layout", { detail: "about" }));

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
    // Reset opacity on mount
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    isNavigatingRef.current = false;

    const onWheel = (e) => {
      if (e.deltaY > 30 && !isNavigatingRef.current) {
        navigateTo("/about");
      }
    };

    // Touch swipe support
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
      {showLoader && (
        <div className={styles.awardLoader}>
          <div className={styles.awardContent}>
            <h1 className={styles.awardTitle}>Aadhya Serene</h1>
            <p className={styles.awardSubtitle}>An Award-Winning Project</p>
          </div>
        </div>
      )}

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
          <Link href="/apartments" className={styles.heroCtaButton}>
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
          </Link>

          <span className={styles.desktopScroll}>Scroll Down</span>
        </div>
      </section>
    </main>
  );
}
