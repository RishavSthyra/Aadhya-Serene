"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import usePerformanceProfile from "@/hooks/usePerformanceProfile";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  MapPin,
  Phone,
  PlayCircle,
  Sparkles,
} from "lucide-react";

const AMENITIES_VISIBLE_COUNT = 5;
const AMENITIES_CAROUSEL_GAP_PX = 10;

const NAV_LINKS = [
  { href: "/about", label: "About", icon: Info },
  { href: "/apartments", label: "Apartments", icon: Building2 },
  { href: "/amenities", label: "Amenities", icon: Sparkles, menuKey: "amenities" },
  { href: "/walkthrough", label: "Walkthrough", icon: PlayCircle },
  { href: "/location", label: "Location", icon: MapPin },
];

const AMENITIES_DROPDOWN_ITEMS = [
  {
    label: "Rooftop Leisure Deck",
    url: "rooftopLeisureDeck",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/Are%20Rooftops%20The%20New%20Backyards_.jpg",
  },
  {
    label: "Children's Play Area",
    url: "childrensPlayArea",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/ground-red-outdoor-child-complex-colorful%20(1).jpg",
  },
  {
    label: "Swimming Pool",
    url: "swimmingPool",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/umbrella-chair2.jpg",
  },
  {
    label: "Gymnasium",
    url: "gymnasium",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/3d-rendering-modern-loft-gym-fitness%20(1).jpg",
  },
  {
    label: "Indoor Games Lounge",
    url: "indoorGames",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/close-up-foosball-table-play-football-game-empty-office-table-used-soccer-game-after-work-space-celebrate-party-with-drinks-entertainment-workplace-have-fun%20(1).jpg",
  },
  {
    label: "Clubhouse",
    url: "clubhouse",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/download.jpg",
  },
  {
    label: "Outdoor Basketball Court",
    url: "basketball",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/basketball-player-attempting-distance-throw%20(1).jpg",
  },
  {
    label: "Outdoor Badminton Court",
    url: "badminton",
    sublabel: "Aadhya Serene",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/side-view-people-playing-badminton%20(1).jpg",
  },
];

function getContainerId(pathname) {
  if (pathname === "/") return "home-inner";
  if (pathname.startsWith("/about")) return "about-container";
  return null;
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isTabletOrBelow, isConstrainedDevice, shouldReduceMotion } = usePerformanceProfile();
  const isInteriorPanosRoute = pathname.startsWith("/interior-panos");
  const [openMenu, setOpenMenu] = useState(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [amenitiesCarouselIndex, setAmenitiesCarouselIndex] = useState(0);
  const hideTimeoutRef = useRef(null);

  const shouldAutoHideNav =
    pathname === "/location" ||
    pathname === "/amenities" ||
    pathname.startsWith("/apartments") ||
    isInteriorPanosRoute;

  const maxAmenitiesStartIndex = Math.max(
    0,
    AMENITIES_DROPDOWN_ITEMS.length - AMENITIES_VISIBLE_COUNT,
  );
  const amenitiesCardBasis = `calc((100% - ${
    (AMENITIES_VISIBLE_COUNT - 1) * AMENITIES_CAROUSEL_GAP_PX
  }px) / ${AMENITIES_VISIBLE_COUNT})`;
  const amenitiesTrackOffset = `calc(-${amenitiesCarouselIndex} * ((${amenitiesCardBasis}) + ${AMENITIES_CAROUSEL_GAP_PX}px))`;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
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
      setOpenMenu(null);
      setIsNavVisible(false);
    }, 1800);
  };

  useEffect(() => {
    clearHideTimeout();

    if (shouldAutoHideNav) {
      setOpenMenu(null);
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
    if (openMenu !== "amenities") {
      setAmenitiesCarouselIndex(0);
    }
  }, [openMenu]);

  useEffect(() => {
    if (isTabletOrBelow) {
      setOpenMenu(null);
    }
  }, [isTabletOrBelow]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-nav-shell]")) return;
      setOpenMenu(null);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const navigateWithTransition = (href, layoutKey, options = {}) => {
    if (pathname === href) {
      setOpenMenu(null);
      return;
    }

    const { eagerLayout = true } = options;
    if (layoutKey && eagerLayout) {
      window.dispatchEvent(new CustomEvent("bg-layout", { detail: layoutKey }));
    }

    const containerId = getContainerId(pathname);
    const container = containerId ? document.getElementById(containerId) : null;

    setOpenMenu(null);

    if (!container) {
      router.push(href);
      return;
    }

    container.style.opacity = "0";
    container.style.transition = "opacity 0.6s ease";

    const routePushDelay = href === "/apartments" && isTabletOrBelow ? 0 : 600;

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

  const handlePrevAmenities = () => {
    setAmenitiesCarouselIndex((current) => Math.max(0, current - 1));
  };

  const handleNextAmenities = () => {
    setAmenitiesCarouselIndex((current) =>
      Math.min(maxAmenitiesStartIndex, current + 1),
    );
  };

  if (isInteriorPanosRoute) {
    return null;
  }

  return (
    <>
      {shouldAutoHideNav ? (
        <div
          className={`fixed left-1/2 top-0 z-[490] hidden h-[88px] w-[min(100%,1820px)]  -translate-x-1/2 xl:block ${
            isNavVisible ? "pointer-events-none" : "pointer-events-auto"
          }`}
          onMouseEnter={showNav}
          aria-hidden="true"
        />
      ) : null}

      <header
        className={`fixed left-1/2 top-0 z-[500] hidden w-[min(100%,1820px)] -translate-x-1/2 will-change-transform transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] xl:block ${
          shouldAutoHideNav && !isNavVisible
            ? "pointer-events-none -translate-y-[calc(100%+14px)] opacity-0 blur-[1px]"
            : "translate-y-0 opacity-100 blur-0"
        }`}
        onMouseEnter={showNav}
        onMouseLeave={() => {
          setOpenMenu(null);
          scheduleHideNav();
        }}
      >
        <div className="relative w-full px-4 pb-2 pt-4 xl:px-8 xl:pb-3 xl:pt-5">
          <div
            data-nav-shell
            className="rounded-full border border-white/42 bg-[linear-gradient(180deg,rgba(249,245,236,0.76)_0%,rgba(242,236,226,0.62)_100%)] px-4 py-3 text-[#17191f] shadow-[0_18px_42px_rgba(10,12,18,0.12),inset_0_1px_0_rgba(255,255,255,0.56)] backdrop-blur-[28px] supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(249,245,236,0.64)_0%,rgba(242,236,226,0.48)_100%)] md:px-6 xl:px-8"
          >
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="flex min-w-[210px] items-center text-left text-[#121319] no-underline"
              >
                <img
                  src="https://cdn.sthyra.com/AADHYA%20SERENE/images/generated-svg-image.svg"
                  alt="Aadhya Serene"
                  className="h-[34px] w-auto object-contain md:h-[38px]"
                  loading="eager"
                  decoding="async"
                />
              </Link>

              <nav className="hidden items-center gap-1 lg:flex">
                {NAV_LINKS.map(({ href, label, menuKey }) => {
                  const active = pathname === href;
                  const isMenuOpen = openMenu === menuKey;

                  return (
                    <button
                      key={href}
                      type="button"
                      onMouseEnter={() => {
                        if (menuKey) {
                          setOpenMenu(menuKey);
                        } else {
                          setOpenMenu(null);
                        }
                      }}
                      onFocus={() => {
                        if (menuKey) {
                          setOpenMenu(menuKey);
                        } else {
                          setOpenMenu(null);
                        }
                      }}
                      onClick={() => {
                        if (menuKey) {
                          setOpenMenu((current) =>
                            current === menuKey ? null : menuKey,
                          );
                          return;
                        }

                        handleRouteNavigation(href);
                      }}
                      className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-full px-4 transition ${
                        active || isMenuOpen
                          ? "bg-[#17191f] text-[#f7f3eb] shadow-[0_10px_18px_rgba(10,12,18,0.16)]"
                          : "text-[#343740] hover:bg-black/[0.045]"
                      }`}
                    >
                      <span className="text-[12px] font-medium uppercase tracking-[0.12em]">
                        {label}
                      </span>
                      {menuKey ? (
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            isMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <div className="hidden min-w-[210px] items-center justify-end gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => router.push("/contact")}
                  className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-full bg-[#17191f] px-4 text-[#f7f3eb] shadow-[0_10px_18px_rgba(10,12,18,0.16)] transition hover:-translate-y-0.5"
                >
                  <Phone className="h-3 w-3" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em]">
                    Contact Us
                  </span>
                </button>
                <Link href={'https://aadhya-serene-assets-v2.s3.ap-south-1.amazonaws.com/brochure/Aadhya_Serene_brochure.pdf'} target="_blank">
                <button
                  type="button"
                  className="inline-flex cursor-pointer min-h-[42px] items-center gap-1.5 rounded-full border border-black/7 bg-white/74 px-4 text-[#20232b] transition hover:bg-white"
                >
                  <FileText className="h-3 w-3" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em]">
                    Brochure
                  </span>
                </button>
                </Link>
              </div>
            </div>
          </div>

          <motion.div
            data-nav-shell
            initial={false}
            animate={
              openMenu === "amenities"
                ? {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                  }
                : {
                    opacity: 0,
                    y: isConstrainedDevice ? -6 : -12,
                    scale: isConstrainedDevice ? 1 : 0.992,
                    filter: shouldReduceMotion ? "blur(0px)" : "blur(3px)",
                  }
            }
            transition={{
              duration: isConstrainedDevice ? 0.18 : 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`absolute inset-x-4 top-full mt-0.5 rounded-[30px] border border-white/38 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.22)_100%)] p-5 shadow-[0_22px_58px_rgba(9,12,20,0.18),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[34px] xl:inset-x-8 ${
              openMenu === "amenities" ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ transformOrigin: "top center" }}
          >
                <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-6">
                  <div className="pt-1">
                    <h3 className="font-display m-0 text-[2.2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#17191f]">
                      Amenities
                    </h3>
                    <p className="mt-4 max-w-[24ch] text-[14px] leading-[1.85] text-[#2a2e37]/72">
                      Discover the signature spaces at Aadhya Serene, from rooftop
                      leisure and poolside relaxation to fitness and recreation.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/amenities")}
                      className="mt-6 inline-flex min-h-[40px] items-center rounded-full border border-white/45 bg-white/36 px-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#17191f] backdrop-blur-xl transition hover:bg-white/52"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2a2e37]/48">
                        Signature Spaces
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevAmenities}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/30 text-[#17191f]/78 transition hover:bg-white/45 disabled:opacity-35"
                          disabled={amenitiesCarouselIndex === 0}
                          aria-label="Previous amenities"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextAmenities}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/30 text-[#17191f]/78 transition hover:bg-white/45 disabled:opacity-35"
                          disabled={amenitiesCarouselIndex === maxAmenitiesStartIndex}
                          aria-label="Next amenities"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[22px]">
                      <motion.div
                        animate={{ x: amenitiesTrackOffset }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-[10px] will-change-transform"
                      >
                        {AMENITIES_DROPDOWN_ITEMS.map((item) => (
                          <Link
                            key={item.label}
                            href={{
                              pathname: "/amenities",
                              query: { amenity: item.url },
                            }}
                            style={{ flex: `0 0 ${amenitiesCardBasis}` }}
                            className="group block overflow-hidden rounded-[18px] border border-white/18 bg-black/18 transition duration-300 hover:-translate-y-0.5 hover:bg-black/24"
                            onClick={() => {
                              setOpenMenu(null);
                              scheduleHideNav();
                            }}
                          >
                            <div className="relative h-[274px] overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.label}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(12,14,18,0.92)_100%)] px-3.5 pb-3.5 pt-14">
                                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/58">
                                  {item.sublabel}
                                </p>
                                <p className="font-display mt-2 text-[1.22rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
                                  {item.label}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </div>
          </motion.div>
        </div>
      </header>

      <div className="fixed bottom-[max(10px,env(safe-area-inset-bottom,0px)+6px)] left-1/2 z-[160] w-[min(95vw,680px)] -translate-x-1/2 rounded-full border border-black/6 bg-[#f7f3eb]/92 px-2 py-1.5 shadow-[0_14px_32px_rgba(10,12,18,0.16)] backdrop-blur-2xl xl:hidden md:px-4 md:py-2">
        <nav className="flex items-center justify-between gap-0">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <button
                key={href}
                type="button"
                onClick={() => handleRouteNavigation(href)}
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
      </div>
    </>
  );
}
