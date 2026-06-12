"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import usePerformanceProfile from "@/hooks/usePerformanceProfile";
import AadhyaLogo from "@/components/Home/AadhyaLogo";
import {
  Building2,
  FileText,
  Info,
  MapPin,
  PlayCircle,
  Sparkles,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/about", label: "About", icon: Info },
  { href: "/apartments", label: "Apartments", icon: Building2 },
  { href: "/amenities", label: "Amenities", icon: Sparkles },
  { href: "/walkthrough", label: "Walkthrough", icon: PlayCircle },
  { href: "/location", label: "Location", icon: MapPin },
];

const HOME_DESKTOP_NAV_LINKS = [
  { href: "/apartments", label: "Residences" },
  { href: "/amenities", label: "Amenities" },
  { href: "/walkthrough", label: "Gallery" },
  { href: "/location", label: "Location" },
  { href: "/about", label: "About" },
];

const PREFETCH_ROUTES = [
  "/",
  "/about",
  "/apartments",
  "/amenities",
  "/walkthrough",
  "/location",
  "/contact",
];

const BROCHURE_URL =
  "https://aadhya-serene-assets-v2.s3.ap-south-1.amazonaws.com/brochure/Aadhya_Serene_brochure.pdf";

function getContainerId(pathname) {
  if (pathname === "/") return "home-inner";
  if (pathname.startsWith("/about")) return "about-container";
  return null;
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isTabletOrBelow, shouldReduceMotion } = usePerformanceProfile();
  const isInteriorPanosRoute = pathname.startsWith("/interior-panos");
  const isApartmentsRoute = pathname.startsWith("/apartments");
  const [isNavVisible, setIsNavVisible] = useState(true);
  const hideTimeoutRef = useRef(null);

  const shouldAutoHideNav =
    pathname === "/location" ||
    pathname === "/amenities" ||
    isApartmentsRoute ||
    isInteriorPanosRoute;

  const desktopNavLinks = HOME_DESKTOP_NAV_LINKS;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const primeRoute = (href) => {
    router.prefetch(href);

    if (href === "/apartments") {
      router.prefetch("/apartments");
    }
  };

  const showNav = () => {
    clearHideTimeout();
    setIsNavVisible(true);
  };

  const scheduleHideNav = () => {
    if (!shouldAutoHideNav) return;

    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsNavVisible(false);
    }, 1800);
  };

  useEffect(() => {
    clearHideTimeout();

    if (shouldAutoHideNav) {
      setIsNavVisible(false);
      return;
    }

    setIsNavVisible(true);
  }, [shouldAutoHideNav]);

  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, []);

  useEffect(() => {
    PREFETCH_ROUTES.forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  const navigateWithTransition = (href, layoutKey, options = {}) => {
    if (pathname === href) {
      return;
    }

    const { eagerLayout = true } = options;
    if (layoutKey && eagerLayout) {
      window.dispatchEvent(new CustomEvent("bg-layout", { detail: layoutKey }));
    }

    const containerId = getContainerId(pathname);
    const container = containerId ? document.getElementById(containerId) : null;

    if (!container) {
      router.push(href);
      return;
    }

    container.style.opacity = "0";
    container.style.transition = "opacity 0.42s cubic-bezier(0.22,1,0.36,1)";

    if (href === "/apartments") {
      router.prefetch("/apartments");
    }

    const routePushDelay = href === "/apartments" && isTabletOrBelow ? 80 : 120;

    window.setTimeout(() => {
      router.push(href);
    }, routePushDelay);
  };

  const handleRouteNavigation = (href) => {
    if (href === "/about") {
      navigateWithTransition("/about", "about");
      return;
    }

    if (href === "/apartments") {
      navigateWithTransition("/apartments", "apartments");
      return;
    }

    if (href === "/location") {
      navigateWithTransition("/location", "location", { eagerLayout: false });
      return;
    }

    router.push(href);
  };

  if (isInteriorPanosRoute) {
    return null;
  }

  return (
    <>
      {shouldAutoHideNav ? (
        <div
          className={`fixed left-1/2 top-0 z-[490] hidden h-[88px] w-[min(100%,1560px)] -translate-x-1/2 xl:block ${
            isNavVisible ? "pointer-events-none" : "pointer-events-auto"
          }`}
          onMouseEnter={showNav}
          aria-hidden="true"
        />
      ) : null}

      <motion.header
        className={`fixed left-1/2 top-0 z-[500] hidden w-[min(100%,1560px)] will-change-transform xl:block ${
          shouldAutoHideNav && !isNavVisible ? "pointer-events-none" : "pointer-events-auto"
        }`}
        initial={false}
        animate={
          shouldAutoHideNav && !isNavVisible
            ? {
                x: "-50%",
                y: "-112%",
                opacity: 0,
                filter: shouldReduceMotion ? "blur(0px)" : "blur(1px)",
              }
            : {
                x: "-50%",
                y: "0%",
                opacity: 1,
                filter: "blur(0px)",
              }
        }
        transition={{
          duration: shouldReduceMotion ? 0.01 : 0.62,
          ease: [0.19, 1, 0.22, 1],
        }}
        onMouseEnter={showNav}
        onMouseLeave={scheduleHideNav}
      >
        <div className="relative w-full px-4 pb-2 pt-4 xl:px-6 xl:pb-3 xl:pt-5">
          <div className="relative px-2 py-2 text-white md:px-3 xl:px-4">
            <div className="relative z-[1] flex min-h-[88px] items-center justify-between gap-4">
              <Link
                href="/"
                className="flex min-w-[160px] items-center justify-start text-left text-white no-underline"
              >
                <AadhyaLogo
                  aria-label="Aadhya Serene"
                  className="h-[44px] w-auto object-contain md:h-[48px]"
                />
              </Link>

              <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
                {desktopNavLinks.map(({ href, label }) => {
                  const active = pathname === href;

                  return (
                    <button
                      key={href}
                      type="button"
                      onMouseEnter={() => primeRoute(href)}
                      onFocus={() => primeRoute(href)}
                      onClick={() => handleRouteNavigation(href)}
                      className={`inline-flex min-h-[42px] items-center gap-1.5 px-0 text-white/78 transition hover:text-white ${
                        active ? "text-white" : ""
                      }`}
                    >
                      <span className="text-[13px] font-medium uppercase tracking-[0.16em]">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="hidden min-w-[160px] items-center justify-end gap-2 md:flex">
                <Link
                  href={BROCHURE_URL}
                  target="_blank"
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-[18px] border border-[#86b7ff]/45 bg-[linear-gradient(90deg,rgba(112,73,255,0.2)_0%,rgba(74,154,255,0.42)_50%,rgba(255,69,168,0.24)_100%)] px-5 text-white shadow-[0_10px_26px_rgba(29,52,110,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#9ec4ff]/70 hover:bg-[linear-gradient(90deg,rgba(112,73,255,0.28)_0%,rgba(74,154,255,0.52)_50%,rgba(255,69,168,0.3)_100%)]"
                >
                  <FileText className="h-3 w-3" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.14em]">
                    Brochure
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => router.push("/contact")}
                  onPointerEnter={() => primeRoute("/contact")}
                  onFocus={() => primeRoute("/contact")}
                  className="inline-flex min-h-[42px] cursor-pointer items-center rounded-[18px] border border-white/44 bg-white/[0.03] px-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <span className="text-[12px] font-medium uppercase tracking-[0.14em]">
                    Contact Us
                  </span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.header>

      <motion.div
        className={`fixed inset-x-0 bottom-0 z-[160] xl:hidden ${
          isApartmentsRoute
            ? "border-t border-[#211827]/8 bg-[#f7f3eb] px-4 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-10px_26px_rgba(68,38,88,0.08)]"
            : "px-3 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
        }`}
        initial={false}
        animate={{
          y: pathname === "/" ? 0 : shouldAutoHideNav ? 4 : 0,
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : 0.42,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        <nav
          className={`mx-auto flex w-[min(100%,680px)] items-center justify-between gap-0 rounded-full border px-2 py-1.5 md:px-4 md:py-2 ${
            isApartmentsRoute
              ? "border-[#211827]/8 bg-[#f7f3eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              : "border-black/6 bg-[#f7f3eb]/92 shadow-[0_14px_32px_rgba(10,12,18,0.16)] backdrop-blur-2xl"
          }`}
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <button
                key={href}
                type="button"
                onClick={() => handleRouteNavigation(href)}
                onPointerDown={() => primeRoute(href)}
                className={`flex min-h-[42px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 text-center transition md:min-h-[46px] md:gap-1 ${
                  active ? "text-[#17191f]" : "text-[#5f636c]"
                }`}
              >
                {Icon ? <Icon className="h-[15px] w-[15px] md:h-4 md:w-4" /> : null}
                <span className="truncate text-[7px] font-semibold uppercase tracking-[0.11em] md:text-[8px]">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
}
