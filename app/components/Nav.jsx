"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  Sparkles,
  PlayCircle,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";

const MEGA_MENU_IMAGES = [
  {
    src: "https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg",
    title: "Our Vision",
  },
  {
    src: "https://cdn.sthyra.com/AADHYA%20SERENE/images/3d-rendering-loft-luxury-living-room-with-shelf-near-dining-table%20(1).jpg",
    title: "Luxury Interiors",
  },
  {
    src: "https://cdn.sthyra.com/AADHYA%20SERENE/images/rooftop-sunset-city-view%20(1).jpg",
    title: "Skyline Evenings",
  },
];

const AMENITIES_DROPDOWN_ITEMS = [
  {
    label: "Rooftop Leisure Deck",
    sublabel: "Aadhya Serene",
    description: "Sky lounge and open-air leisure space.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg",
  },
  {
    label: "Children's Play Area",
    sublabel: "Aadhya Serene",
    description: "Safe, playful, and family-friendly zone.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/3d-rendering-loft-luxury-living-room-with-shelf-near-dining-table%20(1).jpg",
  },
  {
    label: "Swimming Pool",
    sublabel: "Aadhya Serene",
    description: "Resort-style relaxation and daily refresh.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/rooftop-sunset-city-view%20(1).jpg",
  },
  {
    label: "Gymnasium",
    sublabel: "Aadhya Serene",
    description: "Fitness-focused everyday wellness space.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg",
  },
  {
    label: "Indoor Games Lounge",
    sublabel: "Aadhya Serene",
    description: "Recreation and social indoor activities.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/3d-rendering-loft-luxury-living-room-with-shelf-near-dining-table%20(1).jpg",
  },
  {
    label: "Clubhouse",
    sublabel: "Aadhya Serene",
    description: "A central social and celebration hub.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/rooftop-sunset-city-view%20(1).jpg",
  },
  {
    label: "Outdoor Basketball Court",
    sublabel: "Aadhya Serene",
    description: "Active outdoor sports and play.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg",
  },
  {
    label: "Outdoor Badminton Court",
    sublabel: "Aadhya Serene",
    description: "Open-air court for quick matches.",
    image:
      "https://cdn.sthyra.com/AADHYA%20SERENE/images/3d-rendering-loft-luxury-living-room-with-shelf-near-dining-table%20(1).jpg",
  },
];

const AMENITIES_VISIBLE_COUNT = 5;
const AMENITIES_CAROUSEL_GAP_PX = 12;

const links = [
  { href: "/about", label: "ABOUT", icon: Info, hasMegaMenu: true, menuKey: "about" },
  { href: "/apartments", label: "APARTMENTS", icon: Building2 },
  { href: "/amenities", label: "AMENITIES", icon: Sparkles, hasMegaMenu: true, menuKey: "amenities" },
  { href: "/walkthrough", label: "WALKTHROUGH", icon: PlayCircle },
  { href: "/location", label: "LOCATION", icon: MapPin },
];

const actionButtons = [
  {
    label: "Contact Us",
    icon: Phone,
    className:
      "bg-gradient-to-r from-[#f6d86b] via-[#ffe89c] to-[#f0c954] text-[#111214] shadow-[0_10px_24px_rgba(240,201,84,0.24)]",
  },
  {
    label: "Brochure",
    icon: FileText,
    className:
      "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] backdrop-blur-xl",
  },
];

const megaMenuVariants = {
  hidden: {
    opacity: 0,
    y: -18,
    clipPath: "inset(0% 0% 16% 0% round 28px)",
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0% round 28px)",
    filter: "blur(0px)",
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    clipPath: "inset(0% 0% 12% 0% round 28px)",
    filter: "blur(8px)",
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const megaItemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 10,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Nav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(null);
  const [amenitiesCarouselIndex, setAmenitiesCarouselIndex] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const hideTimeoutRef = useRef(null);
  const shouldAutoHideNav =
    pathname === "/location" ||
    pathname === "/amenities" ||
    pathname.startsWith("/apartments") ||
    pathname.startsWith("/interior-panos");
  const maxAmenitiesStartIndex = Math.max(
    0,
    AMENITIES_DROPDOWN_ITEMS.length - AMENITIES_VISIBLE_COUNT
  );
  const amenitiesCardBasis = `calc((100% - ${(AMENITIES_VISIBLE_COUNT - 1) * AMENITIES_CAROUSEL_GAP_PX}px) / ${AMENITIES_VISIBLE_COUNT})`;
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
    }, 2000);
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

  const handlePrevAmenities = () => {
    setAmenitiesCarouselIndex((current) => Math.max(0, current - 1));
  };

  const handleNextAmenities = () => {
    setAmenitiesCarouselIndex((current) =>
      Math.min(maxAmenitiesStartIndex, current + 1)
    );
  };

  return (
    <>
      {shouldAutoHideNav ? (
        <div
          className={`fixed inset-x-0 top-0 z-[490] hidden h-[116px] md:block ${
            isNavVisible ? "pointer-events-none" : "pointer-events-auto"
          }`}
          onMouseEnter={showNav}
          aria-hidden="true"
        />
      ) : null}

      <header
        className={`fixed inset-x-0 top-0 z-[500] hidden will-change-transform transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] md:block ${
          shouldAutoHideNav && !isNavVisible
            ? "pointer-events-none -translate-y-[calc(100%+12px)] opacity-0 blur-[1px]"
            : "translate-y-0 opacity-100 blur-0"
        }`}
        onMouseEnter={showNav}
        onMouseLeave={() => {
          setOpenMenu(null);
          scheduleHideNav();
        }}
      >
        <div className="relative overflow-hidden border-b border-white/15 bg-[linear-gradient(180deg,rgba(132,149,165,0.48)_0%,rgba(113,128,142,0.3)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-[22px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),transparent_16%,transparent_84%,rgba(255,255,255,0.08))]" />

          <div className="relative flex h-[88px] w-full items-center justify-between px-8 xl:px-10">
            <div className="min-w-[180px] text-lg font-semibold text-white">
              <Link href="/">Aadhya Serene</Link>
            </div>

            <nav className="flex items-center gap-7 text-[13px]">
              {links.map(({ href, label, hasMegaMenu, menuKey }) => {
                const active = pathname === href;
                const isMenuOpen = openMenu === menuKey;

                if (hasMegaMenu) {
                  return (
                    <div
                      key={href}
                      className="relative"
                      onMouseEnter={() => setOpenMenu(menuKey)}
                    >
                      <Link
                        href={href}
                        className={`relative flex items-center gap-1.5 pb-1 text-sm transition ${
                          active || isMenuOpen
                            ? "text-[#f3d056]"
                            : "text-white/82 hover:text-white"
                        }`}
                      >
                        <span>{label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                        {active || isMenuOpen ? (
                          <span className="absolute inset-x-0 -bottom-0.5 h-px bg-[#f3d056]" />
                        ) : null}
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative pb-1 text-sm transition ${
                      active
                        ? "text-[#f3d056]"
                        : "text-white/82 hover:text-white"
                    }`}
                  >
                    {label}
                    {active ? (
                      <span className="absolute inset-x-0 -bottom-0.5 h-px bg-[#f3d056]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="flex min-w-[220px] items-center justify-end gap-3">
              {actionButtons.map(({ label, icon: Icon, className }) => (
                <button
                  key={label}
                  className={`flex min-h-[42px] items-center gap-2 rounded-full px-5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 ${className}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {openMenu === "about" ? (
              <motion.div
                key="about-mega-menu"
                variants={megaMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative border-t border-white/12 px-8 pb-8 pt-6 xl:px-10 xl:pb-9 xl:pt-7"
                onMouseEnter={() => setOpenMenu("about")}
              >
                <div className="relative grid grid-cols-[280px_minmax(0,1fr)] items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-7">
                  <motion.div
                    variants={megaItemVariants}
                    className="pr-4"
                  >
                    <h3 className="m-0 text-[3rem] font-normal leading-[0.98] tracking-[-0.05em] text-[#f4efe4] [font-family:Georgia,Times_New_Roman,serif]">
                      About Us
                    </h3>
                    <p className="mt-6 max-w-full text-[15px] leading-[2.05] text-white/82">
                      Placeholder copy for the About section. We can add the
                      brand story, philosophy, legacy, project vision, or a more
                      refined introduction once you finalize the content.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-3 gap-4">
                    {MEGA_MENU_IMAGES.map((image) => (
                      <motion.div
                        key={image.title}
                        variants={megaItemVariants}
                        className="group overflow-hidden rounded-[18px] bg-black/20"
                      >
                        <div className="relative h-[455px] overflow-hidden">
                          <img
                            src={image.src}
                            alt={image.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(15,15,16,1)_100%)] px-6 pb-5 pt-16">
                            <p className="m-0 text-[1.1rem] font-normal text-white [font-family:Georgia,Times_New_Roman,serif]">
                              {image.title}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : openMenu === "amenities" ? (
              <motion.div
                key="amenities-mega-menu"
                variants={megaMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative border-t border-white/12 px-8 pb-8 pt-6 xl:px-10 xl:pb-9 xl:pt-7"
                onMouseEnter={() => setOpenMenu("amenities")}
              >
                <div className="relative grid grid-cols-[250px_minmax(0,1fr)] items-start gap-8 xl:grid-cols-[370px_minmax(0,1fr)] xl:gap-9">
                  <motion.div
                    variants={megaItemVariants}
                    className="pt-1"
                  >
                    <h3 className="m-0 text-[3rem] font-normal leading-[0.98] tracking-[-0.05em] text-[#f4efe4] [font-family:Georgia,Times_New_Roman,serif]">
                      Amenities
                    </h3>
                    <p className="mt-6 max-w-full text-[15px] leading-[2.05] text-white/82">
                      Discover the signature spaces at Aadhya Serene, from
                      rooftop leisure and poolside relaxation to indoor games,
                      fitness, and outdoor recreation.
                    </p>
                    <Link
                      href="/amenities"
                      className="mt-7 inline-flex min-h-[42px] items-center rounded-full border border-white/30 px-5 text-sm font-medium text-white transition duration-200 hover:bg-white/10"
                    >
                      View All
                    </Link>
                  </motion.div>

                  <motion.div variants={megaItemVariants} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/48">
                        Signature Spaces
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevAmenities}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/[0.05] text-white/80 transition duration-200 hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Previous amenities"
                          disabled={amenitiesCarouselIndex === 0}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextAmenities}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/[0.05] text-white/80 transition duration-200 hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Next amenities"
                          disabled={amenitiesCarouselIndex === maxAmenitiesStartIndex}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="relative min-h-[302px] overflow-hidden">
                      <div className="overflow-hidden">
                        <motion.div
                          animate={{ x: amenitiesTrackOffset }}
                          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                          className="flex gap-3"
                        >
                          {AMENITIES_DROPDOWN_ITEMS.map((item) => (
                            <div
                              key={item.label}
                              style={{ flex: `0 0 ${amenitiesCardBasis}` }}
                              className="overflow-hidden rounded-[12px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                            >
                              <div className="relative h-[300px] overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.label}
                                  className="h-full w-full object-cover"
                                />
                                 <div className="px-4 absolute bottom-0 bg-white/5 backdrop-blur-sm w-full pb-4 pt-3">
                                <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/55">
                                  {item.sublabel}
                                </p>
                                <p className="mt-2 text-[1.02rem] font-normal leading-[1.15] text-white [font-family:Georgia,Times_New_Roman,serif]">
                                  {item.label}
                                </p>
                                {/* <p className="mt-2 text-[11px] leading-[1.55] text-white/62">
                                  {item.description}
                                </p> */}
                              </div>
                              </div>
                             
                            </div>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <div className="fixed bottom-4 left-1/2 z-50 w-[92%] -translate-x-1/2 rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl md:hidden">
        <nav className="flex items-center justify-around py-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center text-[9px] ${
                  active ? "text-[#f3d056]" : "text-white/80"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
