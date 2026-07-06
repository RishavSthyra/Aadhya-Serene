'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AadhyaLogo from '@/components/Home/AadhyaLogo';
import WhatsAppLeadForm from '@/components/WhatsAppLeadForm';
import { spreadFloorplanHotspots } from '@/components/ProjectOverviewBook/floorplan-hotspots';
import { useApartmentsData } from '@/hooks/useApartmentsData';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Compass,
  Dumbbell,
  Flame,
  Gift,
  HardHat,
  IndianRupee,
  KeyRound,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  Wifi,
  X,
} from 'lucide-react';
import {
  PiArmchair,
  PiBasketball,
  PiHouseLine,
  PiKey,
  PiShieldCheckered,
  PiTreePalm,
  PiUsersThree,
} from 'react-icons/pi';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PHONE_DISPLAY = '+91 96209 93333';
const PHONE_LINK = 'tel:+919620993333';
const RERA_NUMBER = 'PRM/KA/RERA/1251/446/PR/190614/002604';
const WHATSAPP_IMAGE = '/landing%20page%20images/whatsapp.png';
const FORM_IMAGE = '/landing%20page%20images/interiorimage7.avif';

const LANDING_IMAGES = {
  heroMain: '/landing page images/HERO_1.avif',
  heroSecondary: '/landing page images/HERO_2.avif',
  heroInterior: '/landing page images/HERO_2_NEW.avif',
  homePageRoofImage: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya_Serene_Home_Page_6_First_Frame.avif',
  heroKitchen: '/landing page images/HERO_KITCHEN.avif',
  heroentrance: '/landing page images/HERO_1_NEW.avif',
  facade: '/landing%20page%20images/image4.avif',
  lifestyle: '/landing%20page%20images/image5.avif',
  delivered: '/landing%20page%20images/image3.avif',
  mistywoods: '/landing page images/ABMW.avif',
  deliveredAlt: '/landing%20page%20images/iamge6.avif',
  herobedroom: '/landing page images/HERO_3_NEW.avif',
  heroRoof: '/landing page images/ROOF.avif'
};

const HERO_SLIDES = [
  {
    src: LANDING_IMAGES.heroentrance,
    alt: 'Aadhya Serene terrace and pool at golden hour',
    eyebrow: 'Near-Possession 2 & 3 BHK',
    location: 'Thanisandra, North Bangalore',
    caption: 'Pool · Terrace · Clubhouse',
  },
  {
    src: LANDING_IMAGES.heroInterior,
    alt: 'Aadhya Serene finished bedroom interior',
    eyebrow: 'Near Possession Homes',
    location: 'Possession soon',
    caption: 'Vastu-compliant · Premium finishes',
  },
  {
    src: LANDING_IMAGES.herobedroom,
    alt: 'Aadhya Serene building facade',
    eyebrow: 'Boutique Community',
    location: '1.25 Acres · 136 Homes',
    caption: 'BBMP + K-RERA Approved',
  },
  {
    src: LANDING_IMAGES.heroKitchen,
    alt: 'Aadhya Serene building facade',
    eyebrow: 'Boutique Community',
    location: '1.25 Acres · 136 Homes',
    caption: 'BBMP + K-RERA Approved',
  },
  {
    src: LANDING_IMAGES.heroRoof,
    alt: 'Aadhya Serene building facade',
    eyebrow: 'Boutique Community',
    location: '1.25 Acres · 136 Homes',
    caption: 'BBMP + K-RERA Approved',
  },

];

const TRUST_STRIP = [
  { icon: Building2, label: '1.25-Acre Boutique Community' },
  { icon: PiHouseLine, label: 'Only 136 Homes' },
  { icon: KeyRound, label: 'Near Possession' },
  { icon: PiShieldCheckered, label: 'Vastu-Compliant Homes' },
];

const VALUE_CARDS = [
  {
    icon: KeyRound,
    eyebrow: 'Near Possession',
    title: 'Close to possession, not years away.',
    body:
      'Most projects near Manyata are still at an early stage. Aadhya Serene is well progressed and nearing handover, so you can buy with much more confidence and far less waiting.',
  },
  {
    icon: IndianRupee,
    eyebrow: 'Transparent Pricing',
    title: 'Rs 99L, all-inclusive. No hidden costs.',
    body:
      'Transparent pricing with no floor-rise games and no surprise add-ons. What you see is what you pay.',
  },
  {
    icon: MapPin,
    eyebrow: 'Walk to Work',
    title: 'Walk to Manyata. Reclaim your hours.',
    body:
      'Minutes from Manyata Tech Park and the airport corridor. Swap your commute and your rent for a home you own.',
  },
];

const CONFIGURATIONS = [
  {
    id: '2bhk',
    name: '2 BHK',
    sqft: '1119 sq.ft.',
    image:
      'https://cdn.sthyra.com/AADHYA%20SERENE/images/individual-floorplans/Second%20Floor/201-N.png',
    headline: 'Smart, efficient layouts.',
    sub: 'Starts Rs 99 L*',
    blurb:
      'Bright, well-ventilated homes designed for compact, modern living - perfect for first-time buyers and young families.',
  },
  {
    id: '3bhk',
    name: '3 BHK',
    sqft: '1373 sq.ft.',
    image:
      'https://cdn.sthyra.com/AADHYA%20SERENE/images/individual-floorplans/Second%20Floor/209-N.png',
    headline: 'More space for a growing family.',
    sub: 'Price on request',
    blurb:
      'Generous room dimensions, larger balconies and refined finishes - built for families who refuse to compromise on comfort.',
  },
];

const AMENITIES = [
  { icon: Waves, label: "Swimming Pool & Kids' Pool" },
  { icon: PiArmchair, label: 'Clubhouse & Party Hall' },
  { icon: Dumbbell, label: 'Gymnasium' },
  { icon: PiUsersThree, label: "Children's Play Area" },
  { icon: Compass, label: 'Jogging Track' },
  { icon: PiBasketball, label: 'Shuttle & Basketball Court' },
  { icon: PiTreePalm, label: 'Landscaped Open Spaces' },
  { icon: Sparkles, label: 'Rooftop Leisure' },
  { icon: Wifi, label: 'Co-work Space' },
  { icon: ShieldCheck, label: '24x7 CCTV Security' },
];

const LOCATION_POINTS = [
  { label: 'Nagavara Metro Station', eta: 'Proximity · 10 mins' },
  { label: 'Manyata Tech Park', eta: 'Tech park · 5 mins' },
  { label: 'Chirayu Hospital', eta: 'Healthcare · 3 mins' },
  { label: 'Phoenix Mall of Asia', eta: 'Shopping · 15 mins' },
  { label: 'Rashtrotthana Vidya Kendra', eta: 'Education · 2 mins' },
];

const SPEC_CHECKLIST = [
  'Schindler / OTIS lifts',
  'DG power backup (1 KVA per home)',
  'Fire-resistant Polycab / Havells wiring',
  'Modular kitchen provisions',
  'Vitrified flooring',
  'CERA / Jaquar-grade fittings',
  'Rainwater harvesting & STP',
  'Vastu-compliant layouts',
  '24x7 CCTV + manned security',
  'RCC framed structure designed as per Seismic Zone II requirements',
  'Internal walls: 100mm / 4 inch solid cement concrete blocks',
  'External walls: 150mm / 6 inch solid cement concrete blocks',
  'Roof slab with reinforced cement concrete and waterproofing with CC screed',
  'Internal walls finished with wall putty and Asian Premier Emulsion Paint',
  'External walls finished with exterior waterproof emulsion paint',
  'All internal walls smoothly plastered',
  'Staircase with MS hand rail and balcony with MS grill',
  'Anti-skid ceramic tiles for balcony, utility, and toilets',
  '4 inch skirting to all rooms',
  'Granite flooring in common areas',
  'Granite kitchen platform with stainless steel sink',
  '2 feet ceramic glazed dado tile above granite kitchen platform',
  'Provision for water purifier point in kitchen',
  'Provision for washing machine in utility area',
  'Provision for refrigerator, microwave / oven, mixer, and modular chimney',
  'Main door with engineered hard wood frame and veneer finished flush shutters',
  'Bedroom doors with engineered hard wood frames and veneer / laminate finished flush shutters',
  'Toilet and utility doors with laminate on the wet face',
  'French doors in UPVC with clear glass',
  'Ceramic glazed dado tiles up to 7 feet in toilets',
  'White colored CERA / American Standard or equal sanitary ware in all toilets',
  'Hot and cold mixture unit, shower, and bathroom fittings of GROHE or equal make',
  'Provision of points for geyser and exhaust fan',
  'UPVC toilet ventilators with louvers',
  'TV point in living room',
  'Elegant modular electrical switches of Legrand or equivalent make',
  'Earth leakage circuit breaker for safety',
  'MCB based main distribution box for each flat',
  'A/C power point in bedrooms',
  'Water supply system from borewell',
  'Rainwater harvesting system to recharge the water table',
  'STP sewage treatment plant',
  "Total 5 No's - 8 passenger lifts of Johnson / Schindler / OTIS or equivalent make",
  'Standby generator for lights in common areas, lifts, and pumps',
];
const SPEC_INITIAL_COUNT = 9;
const SPEC_BATCH_SIZE = 9;

const FAQS = [
  {
    question: 'Is Aadhya Serene near possession?',
    answer:
      'Aadhya Serene is in the near-possession stage. The project is well progressed, and our team can walk you through the current site status and expected handover details.',
  },
  {
    question: "What's the starting price?",
    answer:
      'From Rs 99 Lakhs* for a 2 BHK. WhatsApp us for the full price sheet and current inventory.',
  },
  {
    question: 'Is it RERA approved?',
    answer:
      `Yes. K-RERA: ${RERA_NUMBER}. BBMP approved.`,
  },
  {
    question: 'How far is Manyata Tech Park?',
    answer:
      'Just minutes away on Thanisandra Main Road - designed for buyers who want to walk or short-commute to work.',
  },
  {
    question: 'Who is the developer?',
    answer:
      'Abhigna - the team behind Misty Woods (128 homes delivered). Aadhya Serene is being built with the same delivery-first mindset.',
  },
];

function trackEvent(name, params) {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...(params || {}) });
  } catch (_) { }
  try {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', name, params || {});
    }
  } catch (_) { }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  } catch (_) { }
}

function useGsapReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-entry', {
        y: 70,
        opacity: 0,
        duration: 1.15,
        ease: 'power3.out',
        stagger: 0.09,
      });

      gsap.utils.toArray('.gsap-reveal').forEach((el) => {
        gsap.from(el, {
          y: 80,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray('.gsap-stagger').forEach((group) => {
        gsap.from(group.children, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.09,
          scrollTrigger: {
            trigger: group,
            start: 'top 84%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray('.gsap-from-left').forEach((el) => {
        gsap.from(el, {
          x: -80,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray('.gsap-from-right').forEach((el) => {
        gsap.from(el, {
          x: 80,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray('.gsap-scale').forEach((el) => {
        gsap.from(el, {
          scale: 0.9,
          opacity: 0,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.utils.toArray('.gsap-parallax').forEach((el) => {
        gsap.to(el, {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);
}

export default function ReadyToMoveLandingPage({ enableAutoPopup = false }) {
  const [activeFaq, setActiveFaq] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWhatsAppFormOpen, setIsWhatsAppFormOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [activeConfig, setActiveConfig] = useState('2bhk');
  const [floorplanFilters, setFloorplanFilters] = useState({
    balconies: 'all',
    area: 'all',
  });
  const [activeFloorplanIndex, setActiveFloorplanIndex] = useState(0);
  const [visibleSpecCount, setVisibleSpecCount] = useState(SPEC_INITIAL_COUNT);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    config: '2 BHK',
    budget: '99L - 1.2 Cr',
    message: '',
  });

  const timerRef = useRef(null);
  const openedRef = useRef(false);
  const scrollOpenRef = useRef(false);
  const slideTimerRef = useRef(null);
  const floorplanTrackRef = useRef(null);
  const floorplanScrollRafRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const heroSlidesRef = useRef([]);
  const heroCurtainLeftRef = useRef(null);
  const heroCurtainRightRef = useRef(null);

  useGsapReveal();

  const { allData: apartmentFloorplanData } = useApartmentsData();

  const openForm = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    setHasAutoOpened(true);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (!enableAutoPopup) {
      return undefined;
    }

    timerRef.current = window.setTimeout(openForm, 20000);

    const handleScroll = () => {
      if (scrollOpenRef.current || openedRef.current) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;

      if (total > 0 && scrolled / total >= 0.5) {
        scrollOpenRef.current = true;
        openForm();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timerRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableAutoPopup]);

  useEffect(() => {
    document.body.style.overflow = isFormOpen || isWhatsAppFormOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen, isWhatsAppFormOpen]);

  useEffect(() => {
    const leftCurtain = heroCurtainLeftRef.current;
    const rightCurtain = heroCurtainRightRef.current;

    if (!leftCurtain || !rightCurtain) return;

    gsap.set(leftCurtain, { xPercent: -72, yPercent: -118, autoAlpha: 0 });
    gsap.set(rightCurtain, { xPercent: 72, yPercent: 118, autoAlpha: 0 });
  }, []);

  useEffect(() => {
    slideTimerRef.current = window.setInterval(() => {
      goToSlide((activeSlide + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => window.clearInterval(slideTimerRef.current);
  }, [activeSlide]);

  const updateField = (key, value) =>
    setFormData((current) => ({ ...current, [key]: value }));

  const goToSlide = (nextIndex) => {
    if (nextIndex === activeSlide || isTransitioningRef.current) return;

    const currentSlide = heroSlidesRef.current[activeSlide];
    const nextSlide = heroSlidesRef.current[nextIndex];
    const leftCurtain = heroCurtainLeftRef.current;
    const rightCurtain = heroCurtainRightRef.current;

    if (!currentSlide || !nextSlide || !leftCurtain || !rightCurtain) return;

    isTransitioningRef.current = true;

    const tl = gsap.timeline({
      defaults: { ease: 'power4.inOut' },
      onComplete: () => {
        isTransitioningRef.current = false;
      },
    });

    tl.set([leftCurtain, rightCurtain], { autoAlpha: 1 })
      .fromTo(
        leftCurtain,
        { xPercent: -72, yPercent: -118 },
        { xPercent: 0, yPercent: 0, duration: 0.9 }
      )
      .fromTo(
        rightCurtain,
        { xPercent: 72, yPercent: 118 },
        { xPercent: 0, yPercent: 0, duration: 0.9 },
        '<'
      )
      .add(() => {
        currentSlide.style.opacity = '0';
        currentSlide.style.zIndex = '1';
        nextSlide.style.opacity = '1';
        nextSlide.style.zIndex = '2';
        setActiveSlide(nextIndex);
      })
      .to({}, { duration: 0.24 })
      .to(leftCurtain, { xPercent: -72, yPercent: -118, duration: 0.9 })
      .to(rightCurtain, { xPercent: 72, yPercent: 118, duration: 0.9 }, '<')
      .set([leftCurtain, rightCurtain], { autoAlpha: 0 });
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmitState({
        type: 'error',
        message: 'Please share your name and phone number.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          requestType: 'site_visit',
          source: 'ready_to_move_landing',
          preferredTime: `Config: ${formData.config} | Budget: ${formData.budget}`,
          message: formData.message
            ? `Notes: ${formData.message}`
            : 'Pricing & floor plan enquiry from landing page.',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Something went wrong.');
      }

      trackEvent('Lead', {
        location: 'landing_inline_form',
        config: formData.config,
      });

      setSubmitState({
        type: 'success',
        message: 'Thanks! Your enquiry has been sent to our team.',
      });

      window.setTimeout(() => {
        window.location.href = '/thank-you';
      }, 700);
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.message || 'We could not submit your enquiry right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroFormSubmit = (event) => {
    event.preventDefault();
    trackEvent('Lead', { location: 'hero_inline_form' });
    submitForm(event);
  };

  const openWhatsAppForm = (location) => {
    trackEvent('Contact', { location });
    setIsWhatsAppFormOpen(true);
  };

  const heroWhatsAppClick = () => openWhatsAppForm('hero_whatsapp');
  const heroCallClick = () => trackEvent('Call', { location: 'hero_call' });
  const stickyWhatsApp = () => openWhatsAppForm('sticky_whatsapp');
  const stickyCall = () => trackEvent('Call', { location: 'sticky_call' });

  const currentConfig = useMemo(
    () => CONFIGURATIONS.find((config) => config.id === activeConfig),
    [activeConfig]
  );

  const floorplanFlatById = useMemo(() => {
    return new Map(
      apartmentFloorplanData.map((flat) => [
        String(flat.flat || flat.id).trim(),
        flat,
      ])
    );
  }, [apartmentFloorplanData]);

  const currentConfigFloorplans = useMemo(() => {
    if (!currentConfig) return [];

    return spreadFloorplanHotspots
      .map((hotspot) => {
        const flatId = String(hotspot.displayUnitCode || hotspot.unitCode).split('-')[0];
        const flat = floorplanFlatById.get(flatId);

        if (!flat || flat.type !== currentConfig.name) {
          return null;
        }

        return {
          ...flat,
          flat: flat.flat || flat.id || flatId,
          image: hotspot.previewSrc,
          unitCode: hotspot.unitCode,
          sectionLabel: hotspot.sectionLabel,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aEastPriority = a.facing === 'east' ? 0 : 1;
        const bEastPriority = b.facing === 'east' ? 0 : 1;

        if (aEastPriority !== bEastPriority) {
          return aEastPriority - bEastPriority;
        }

        return Number(a.flat) - Number(b.flat);
      });
  }, [currentConfig, floorplanFlatById]);

  const balconyFilterOptions = useMemo(() => {
    return Array.from(
      new Set(currentConfigFloorplans.map((floorplan) => Number(floorplan.balconies)))
    ).sort((a, b) => a - b);
  }, [currentConfigFloorplans]);

  const areaFilterOptions = useMemo(() => {
    return Array.from(
      new Set(currentConfigFloorplans.map((floorplan) => Number(floorplan.area)))
    ).sort((a, b) => a - b);
  }, [currentConfigFloorplans]);

  const filteredFloorplans = useMemo(() => {
    return currentConfigFloorplans.filter((floorplan) => {
      if (
        floorplanFilters.balconies !== 'all' &&
        String(floorplan.balconies) !== floorplanFilters.balconies
      ) {
        return false;
      }

      if (
        floorplanFilters.area !== 'all' &&
        String(floorplan.area) !== floorplanFilters.area
      ) {
        return false;
      }

      return true;
    });
  }, [currentConfigFloorplans, floorplanFilters]);

  const activeFloorplan =
    filteredFloorplans[activeFloorplanIndex] || filteredFloorplans[0] || null;

  useEffect(() => {
    setActiveFloorplanIndex(0);
    floorplanTrackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [activeConfig, floorplanFilters.area, floorplanFilters.balconies]);

  useEffect(() => {
    if (activeFloorplanIndex >= filteredFloorplans.length) {
      setActiveFloorplanIndex(0);
      floorplanTrackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [activeFloorplanIndex, filteredFloorplans.length]);

  useEffect(() => {
    return () => {
      if (floorplanScrollRafRef.current) {
        window.cancelAnimationFrame(floorplanScrollRafRef.current);
      }
    };
  }, []);

  const updateFloorplanFilter = (key, value) => {
    setFloorplanFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const goToFloorplan = (index) => {
    if (!filteredFloorplans.length) return;

    const nextIndex = Math.min(Math.max(index, 0), filteredFloorplans.length - 1);
    setActiveFloorplanIndex(nextIndex);
    floorplanTrackRef.current?.scrollTo({
      left: floorplanTrackRef.current.clientWidth * nextIndex,
      behavior: 'smooth',
    });
  };

  const handleFloorplanScroll = () => {
    if (!floorplanTrackRef.current || filteredFloorplans.length <= 1) return;

    if (floorplanScrollRafRef.current) {
      window.cancelAnimationFrame(floorplanScrollRafRef.current);
    }

    floorplanScrollRafRef.current = window.requestAnimationFrame(() => {
      const track = floorplanTrackRef.current;
      if (!track) return;

      const nextIndex = Math.min(
        filteredFloorplans.length - 1,
        Math.max(0, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)))
      );
      setActiveFloorplanIndex(nextIndex);
    });
  };

  const visibleSpecs = SPEC_CHECKLIST.slice(0, visibleSpecCount);
  const hasMoreSpecs = visibleSpecCount < SPEC_CHECKLIST.length;
  const hasExpandedSpecs = visibleSpecCount > SPEC_INITIAL_COUNT;

  return (
    <>
      <ReraBadge className="fixed right-3 top-3 z-[95] max-w-[calc(100vw-1.5rem)] bg-white/90 shadow-[0_14px_34px_rgba(0,0,0,0.12)] sm:right-5 sm:top-5" />
      <main className="min-h-screen bg-[#f3efe6] text-[#111111]">
        <section className="relative h-[100svh] min-h-[760px] overflow-hidden bg-[#090a0d] text-white">
          <div className="absolute inset-0">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.src}
                ref={(element) => {
                  heroSlidesRef.current[index] = element;
                }}
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  opacity: index === activeSlide ? 1 : 0,
                  zIndex: index === activeSlide ? 2 : 1,
                }}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.42)_24%,rgba(0,0,0,0.18)_44%,transparent_68%)]"
                />
                {/* <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0.42)_0%,rgba(5,6,10,0.24)_28%,rgba(5,6,10,0.62)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_right,rgba(0,0,0,0.3),transparent_42%)]" /> */}
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 z-[30] overflow-hidden">
              <div
                ref={heroCurtainLeftRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{ willChange: 'transform, opacity' }}
              >
                <div
                  className="absolute"
                  style={{
                    top: '-38%',
                    left: '-42%',
                    width: '112%',
                    height: '212%',
                    background: '#000',
                    transform: 'rotate(-34deg)',
                    boxShadow: '28px 0 72px rgba(0,0,0,0.45)',
                  }}
                />
              </div>
              <div
                ref={heroCurtainRightRef}
                aria-hidden="true"
                className="absolute inset-0"
                style={{ willChange: 'transform, opacity' }}
              >
                <div
                  className="absolute"
                  style={{
                    bottom: '-38%',
                    right: '-42%',
                    width: '112%',
                    height: '212%',
                    background: '#000',
                    transform: 'rotate(-34deg)',
                    boxShadow: '-28px 0 72px rgba(0,0,0,0.45)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex h-[100svh] min-h-[760px] flex-col px-3 py-4 sm:px-4 sm:py-6 lg:px-5">
            <div className="gsap-entry flex w-full items-center justify-between gap-4 px-0.5 py-2 sm:px-1">
              <div className="flex min-w-0 items-center gap-5">
                <a
                  href="#"
                  aria-label="Aadhya Serene"
                  className="inline-flex shrink-0 items-center rounded-[2rem]  px-5 py-3"
                >
                  <AadhyaLogo className="h-10 w-auto md:h-11" />
                </a>
                <nav className="hidden items-center gap-1 rounded-full border border-white/18 bg-black/24 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/88 shadow-[0_14px_42px_rgba(0,0,0,0.16)] backdrop-blur-xl lg:flex xl:gap-2">
                  <a href="#why-us" className="rounded-full px-4 py-2.5 transition hover:bg-white/12 hover:text-white">
                    Advantages
                  </a>
                  <a href="#walkthrough" className="rounded-full px-4 py-2.5 transition hover:bg-white/12 hover:text-white">
                    Walkthrough
                  </a>
                  <a href="#amenities" className="rounded-full px-4 py-2.5 transition hover:bg-white/12 hover:text-white">
                    Amenities
                  </a>
                  <a href="#faq" className="rounded-full px-4 py-2.5 transition hover:bg-white/12 hover:text-white">
                    FAQ
                  </a>
                </nav>
              </div>
            </div>

            <div className="flex w-full flex-1 items-end py-8 sm:py-10 lg:py-12">
              <div className="grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
                <div className="gsap-entry self-end">
                  <div className="max-w-none">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.34em] text-white/58 sm:text-[11px]">
                      Ready-to-move homes beside the tech corridor
                    </p>
                    <h1 className="font-[var(--font-hero)] text-[clamp(3.2rem,5.8vw,6rem)] font-medium leading-[0.9] tracking-[-0.065em] text-white">
                      <span className="block whitespace-nowrap">Live Beside</span>
                      <span className="block whitespace-nowrap">Manyata Tech Park.</span>
                    </h1>
                    <div className="mt-6 flex max-w-[46rem] flex-wrap gap-3">
                      <span className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/18 bg-black/24 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        Site visits open today
                      </span>

                      <span className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/18 bg-black/24 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#e8d0a8]" />
                        Vastu compliant
                      </span>
                      <span className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/18 bg-black/24 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                        <BadgeCheck className="h-3.5 w-3.5 text-[#e8d0a8]" />
                        BBMP approved
                      </span>
                      <a
                        href={PHONE_LINK}
                        onClick={heroCallClick}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/18 bg-black/24 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88 shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl transition hover:bg-white hover:text-black"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {PHONE_DISPLAY}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="gsap-entry flex items-end justify-start lg:justify-end lg:pr-1">
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/18 p-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                    <button
                      type="button"
                      aria-label="Previous slide"
                      onClick={() =>
                        goToSlide(
                          (activeSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                        )
                      }
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-black"
                    >
                      <ArrowRight className="h-5 w-5 rotate-180" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next slide"
                      onClick={() => goToSlide((activeSlide + 1) % HERO_SLIDES.length)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_24px_rgba(255,255,255,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(255,255,255,0.24)]"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative space-y-8 px-3 pb-24 pt-8 sm:space-y-10 sm:px-5 sm:pb-28 sm:pt-10 lg:space-y-12 lg:px-6 lg:pb-32 lg:pt-12">
          <PanelShell id="lead-form" className="bg-[#f7f6f1]">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:p-10">
              <div className="gsap-from-left">
                <SectionHeading
                  eyebrow="Get the Price Sheet"
                  title="Talk to us in 30 seconds."
                  description="Drop your details and our team will reach out with the price sheet, floor plans, and site visit support by email or phone."
                />
                {/* <div className="mt-8 flex items-center gap-2 text-sm text-[#5d5d5a]">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  No spam. Aadhya Serene only.
                </div> */}
              </div>

              <form
                onSubmit={heroFormSubmit}
                className="gsap-from-right rounded-[1.7rem] border border-black/6 bg-white/82 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-sm sm:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Your name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(value) => updateField('name', value)}
                  />
                  <Field
                    label="Phone number"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(value) => updateField('phone', value)}
                  />
                  <SelectField
                    label="Configuration"
                    value={formData.config}
                    onChange={(value) => updateField('config', value)}
                    options={['2 BHK', '3 BHK']}
                  />
                  <SelectField
                    label="Budget"
                    value={formData.budget}
                    onChange={(value) => updateField('budget', value)}
                    options={['99L - 1.2 Cr', '1.2 Cr +']}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full bg-black px-6 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                {submitState.message ? (
                  <div
                    className={`mt-4 rounded-[1rem] px-4 py-3 text-sm ${submitState.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                      }`}
                  >
                    {submitState.message}
                  </div>
                ) : null}
              </form>
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="space-y-3">
              <div className="gsap-stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TRUST_STRIP.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-center gap-3 rounded-full border border-[#e7dece] bg-white/75 px-5 py-4 text-center text-[11px] uppercase tracking-[0.18em] text-[#2a2a28] shadow-[0_10px_24px_rgba(0,0,0,0.03)]"
                  >
                    <Icon className="h-5 w-5 text-[#d9aa53]" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </PanelShell>

          <PanelShell id="why-us" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="gsap-reveal grid gap-6 border-b border-black/8 pb-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[#9a7a45]">
                    Why Aadhya Serene
                  </p>
                  <h2 className="mt-3 max-w-[15.5ch] font-[var(--font-hero)] text-[clamp(2.2rem,4.2vw,4.2rem)] font-medium leading-[0.94] tracking-[-0.05em] text-black">
                    <span className="text-black/28">/</span> Three reasons buyers
                    choose us over every other project nearby.
                  </h2>
                </div>
                <div>
                  <p className="max-w-[30rem] text-[15px] leading-7 text-[#5c5c58]">
                    Ready now, priced clearly, and placed where daily life gets easier.
                    The content stays the same - the experience just feels sharper.
                  </p>
                </div>
              </div>

              <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {VALUE_CARDS.map(({ icon: Icon, eyebrow, title, body }, index) => (
                  <div
                    key={title}
                    className="gsap-reveal group relative h-full overflow-hidden border border-[#e7dfd1] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f1_100%)] p-7 shadow-[0_22px_50px_rgba(17,17,17,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#171717] hover:bg-[linear-gradient(180deg,#171717_0%,#1f1b16_100%)] hover:shadow-[0_32px_80px_rgba(17,17,17,0.16)]"
                  >
                    <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(169,119,47,0.42),transparent)] transition-opacity duration-300 group-hover:opacity-0" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center border border-[#efe4d2] bg-[#111111] text-white shadow-[0_10px_24px_rgba(17,17,17,0.12)] transition duration-300 group-hover:border-[#c89a54]/45 group-hover:bg-white group-hover:text-black">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="border border-[#eee3cf] bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-black/35 transition duration-300 group-hover:border-white/20 group-hover:bg-white/8 group-hover:text-white/55">
                        No.{index + 1}
                      </span>
                    </div>
                    <p className="relative z-10 mt-6 text-[10px] uppercase tracking-[0.26em] text-[#9a7a45] transition duration-300 group-hover:text-[#d3ad71]">
                      {eyebrow}
                    </p>
                    <h3 className="relative z-10 mt-3 max-w-[12ch] font-[var(--font-hero)] text-[clamp(1.6rem,2vw,2.1rem)] font-medium leading-[1.02] tracking-[-0.04em] text-black transition duration-300 group-hover:text-white">
                      {title}
                    </h3>
                    <p className="relative z-10 mt-4 max-w-[28ch] text-[14px] leading-7 text-[#5c5c58] transition duration-300 group-hover:text-white/72">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </PanelShell>

          <PanelShell id="walkthrough" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 border-b border-black/8 pb-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                <div className="gsap-from-left">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                    The Walkthrough
                  </p>
                  <h2 className="mt-3 font-[var(--font-hero)] text-[clamp(2.8rem,5.4vw,5.8rem)] leading-[0.9] tracking-[-0.06em] text-black">
                    <span className="text-black/28">/</span> This Home Is Real.
                    <span className="block text-[#a9772f]">Not a Render.</span>
                  </h2>
                </div>
                <div className="gsap-from-right">
                  <p className="max-w-[34rem] text-base leading-8 text-[#5c5c58]">
                    Tour a finished Aadhya Serene home - every other project shows
                    you a 3D model. We show you the actual flat, in actual light, on
                    an actual afternoon.
                  </p>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-black/45">
                    02 min 18 sec · Cinematic tour
                  </p>
                </div>
              </div>

              <div className="gsap-scale mt-10">
                <div className="relative overflow-hidden">
                  <img
                    src={LANDING_IMAGES.delivered}
                    alt="Aadhya Serene aerial walkthrough"
                    className="gsap-parallax h-[340px] w-full object-cover sm:h-[480px] lg:h-[640px]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.08)_30%,rgba(0,0,0,0.65)_100%)]" />

                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between text-white sm:left-8 sm:right-8 sm:top-8">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[#e6ceaa]">
                        Now Playing
                      </p>
                      <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/72">
                        Inside Aadhya Serene · Ep. 01
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/48">
                      02:18
                    </p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <motion.a
                      href="https://app.aadhyaserene.com/walkthrough"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Play walkthrough video"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        trackEvent('VideoPlay', { location: 'hero_walkthrough' })
                      }
                      className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/92 text-black shadow-[0_18px_46px_rgba(0,0,0,0.28)] backdrop-blur-sm transition sm:h-20 sm:w-20"
                    >
                      <Play
                        className="ml-1 h-7 w-7 fill-black text-black sm:h-8 sm:w-8"
                        strokeWidth={0.8}
                      />
                    </motion.a>
                  </div>

                  <div className="absolute inset-x-5 bottom-5 sm:inset-x-8 sm:bottom-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="font-[var(--font-hero)] text-[clamp(1.6rem,3vw,3rem)] leading-[0.96] tracking-[-0.04em] text-white">
                          Walk the finished 2 BHK.
                        </p>
                        <p className="mt-2 text-sm text-white/58">
                          Hosted by our sales lead · Thanisandra, North Bangalore
                        </p>
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                        4K · Drone + Walkthrough
                      </div>
                    </div>
                    <div className="mt-5 h-[2px] rounded-full bg-white/12">
                      <span className="block h-full w-[16%] rounded-full bg-[#e6ceaa]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-black/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[#5c5c58]">
                    Available for site visits today · Free cab pickup from Manyata
                    Tech Park
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('Lead', { location: 'video_visit_cta' });
                      setIsFormOpen(true);
                    }}
                    className="inline-flex min-h-[54px] items-center gap-3 bg-black px-7 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5"
                  >
                    Book a Visit to See It in Person
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </PanelShell>

          <PanelShell id="configurations" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 border-b border-black/8 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="gsap-from-left">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                    Configurations & Floor Plans
                  </p>
                  <h2 className="mt-3 max-w-[11ch] font-[var(--font-hero)] text-[clamp(2.2rem,4.1vw,4.2rem)] leading-[0.94] tracking-[-0.05em] text-black">
                    <span className="text-black/28">/</span>
                    <span className="block">Thoughtfully Designed</span>
                    <span className="block">2 & 3 BHK Homes</span>
                  </h2>
                </div>
                <div className="gsap-from-right flex items-center justify-start lg:justify-end lg:self-center">
                  <div className="inline-flex border border-black/10 bg-white/90 p-1 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
                    {CONFIGURATIONS.map((config) => (
                      <button
                        key={config.id}
                        type="button"
                        onClick={() => {
                          setActiveConfig(config.id);
                          trackEvent('ViewContent', {
                            content_type: 'floor_plan',
                            config: config.name,
                          });
                        }}
                        className={`px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${activeConfig === config.id
                            ? 'bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)]'
                            : 'text-black/55 hover:bg-black/[0.03] hover:text-black'
                          }`}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentConfig.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-10 grid items-stretch gap-8 lg:grid-cols-[1.06fr_0.94fr]"
                >
                  <div className="gsap-scale min-w-0">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8e8576]">
                          Balconies
                        </span>
                        <div className="relative">
                          <select
                            value={floorplanFilters.balconies}
                            onChange={(event) =>
                              updateFloorplanFilter('balconies', event.target.value)
                            }
                            className="h-14 w-full appearance-none rounded-full border border-black/10 bg-white/82 px-5 pr-14 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(0,0,0,0.04)] outline-none transition focus:border-black/30 focus:bg-white focus:ring-4 focus:ring-black/5"
                          >
                            <option value="all">All balconies</option>
                            {balconyFilterOptions.map((balconies) => (
                              <option key={balconies} value={String(balconies)}>
                                {balconies} {balconies === 1 ? 'balcony' : 'balconies'}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/64" />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8e8576]">
                          Sq Ft
                        </span>
                        <div className="relative">
                          <select
                            value={floorplanFilters.area}
                            onChange={(event) =>
                              updateFloorplanFilter('area', event.target.value)
                            }
                            className="h-14 w-full appearance-none rounded-full border border-black/10 bg-white/82 px-5 pr-14 text-sm font-semibold text-black shadow-[0_12px_28px_rgba(0,0,0,0.04)] outline-none transition focus:border-black/30 focus:bg-white focus:ring-4 focus:ring-black/5"
                          >
                            <option value="all">All sizes</option>
                            {areaFilterOptions.map((area) => (
                              <option key={area} value={String(area)}>
                                {area} sq.ft.
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/64" />
                        </div>
                      </label>
                    </div>

                    <div className="relative overflow-hidden">
                      {filteredFloorplans.length > 0 ? (
                        <>
                          <div
                            ref={floorplanTrackRef}
                            onScroll={handleFloorplanScroll}
                            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                            {filteredFloorplans.map((floorplan) => (
                              <div
                                key={`${floorplan.flat}-${floorplan.unitCode}`}
                                className="min-w-full snap-start"
                              >
                                <img
                                  src={floorplan.image}
                                  alt={`Aadhya Serene flat ${floorplan.flat} ${floorplan.type} floor plan`}
                                  className="h-[320px] w-full object-contain sm:h-[420px] lg:h-[520px]"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="absolute left-4 top-4 rounded-full border border-black/8 bg-white/92 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5548] shadow-[0_10px_24px_rgba(0,0,0,0.06)] backdrop-blur">
                            Flat {activeFloorplan?.flat} · {activeFloorplan?.facing} · {activeFloorplan?.area} sq.ft.
                          </div>

                          {filteredFloorplans.length > 1 ? (
                            <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 items-center justify-between sm:inset-x-7 lg:inset-x-8">
                              <button
                                type="button"
                                onClick={() => goToFloorplan(activeFloorplanIndex - 1)}
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/92 text-black shadow-[0_12px_26px_rgba(0,0,0,0.12)] backdrop-blur transition hover:-translate-x-0.5 hover:bg-black hover:text-white"
                                aria-label="Previous floor plan"
                              >
                                <ArrowRight className="h-4 w-4 rotate-180" />
                              </button>
                              <button
                                type="button"
                                onClick={() => goToFloorplan(activeFloorplanIndex + 1)}
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/92 pr-0.5 text-black shadow-[0_12px_26px_rgba(0,0,0,0.12)] backdrop-blur transition hover:translate-x-0.5 hover:bg-black hover:text-white"
                                aria-label="Next floor plan"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex h-[320px] flex-col items-center justify-center p-8 text-center sm:h-[420px] lg:h-[520px]">
                          <img
                            src={currentConfig.image}
                            alt={`${currentConfig.name} floor plan`}
                            className="max-h-full w-full object-contain opacity-70"
                          />
                          <p className="mt-5 max-w-sm text-sm leading-6 text-[#6a635a]">
                            No floor plans match the selected filters. Try another balcony
                            or sqft option.
                          </p>
                        </div>
                      )}
                    </div>

                    {filteredFloorplans.length > 0 ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-[#7b7164]">
                        <span>
                          {activeFloorplanIndex + 1} / {filteredFloorplans.length} plans
                        </span>
                        <span>{activeFloorplan?.sectionLabel}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="gsap-from-right flex flex-col justify-between border border-black/10 bg-[linear-gradient(180deg,#fffdf8_0%,#f8f2e7_100%)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.04)] sm:p-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[#9a7a45]">
                        {currentConfig.name} · {activeFloorplan ? `${activeFloorplan.area} sq.ft.` : currentConfig.sqft}
                      </p>
                      <h3 className="mt-3 max-w-[10ch] font-[var(--font-hero)] text-[clamp(2.2rem,3.4vw,3.8rem)] leading-[0.94] tracking-[-0.05em] text-black">
                        {currentConfig.headline}
                      </h3>
                      <p className="mt-5 max-w-[30rem] text-[15px] leading-8 text-[#5c5c58]">
                        {currentConfig.blurb}
                      </p>

                      <div className="mt-6 inline-flex items-center gap-2 border border-[#e5dac7] bg-white px-4 py-2 text-sm font-semibold text-[#8f7242] shadow-[0_8px_22px_rgba(0,0,0,0.03)]">
                        <IndianRupee className="h-4 w-4" />
                        {currentConfig.sub}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2">
                      <div className="bg-white/88 p-5">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e8576]">
                          Layout
                        </p>
                        <p className="mt-2 text-lg font-semibold text-black">
                          {currentConfig.name}
                        </p>
                      </div>
                      <div className="bg-white/88 p-5">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e8576]">
                          Availability
                        </p>
                        <p className="mt-2 text-lg font-semibold text-black">
                          {activeFloorplan ? `Flat ${activeFloorplan.flat}` : 'Ready to inspect'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openWhatsAppForm('config_whatsapp')}
                        className="inline-flex min-h-[54px] items-center gap-2 bg-[#1faf5a] px-6 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(31,175,90,0.2)] transition hover:-translate-y-0.5 hover:bg-[#16944a]"
                      >
                        <PiKey className="h-4 w-4" />
                        Get the Exact Price & Floor Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent('Lead', { location: 'config_visit_cta' });
                          setIsFormOpen(true);
                        }}
                        className="inline-flex min-h-[54px] items-center gap-2 border border-black/10 bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
                      >
                        Book a Free Site Visit
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </PanelShell>

          <PanelShell id="amenities" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 border-b border-black/8 pb-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
                <div className="gsap-from-left">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                    Amenities
                  </p>
                  <h2 className="mt-3 font-[var(--font-hero)] text-[clamp(2.8rem,5.2vw,5.2rem)] leading-[0.92] tracking-[-0.06em] text-black">
                    <span className="text-black/28">/</span> A Lifestyle
                    <span className="block text-[#a9772f]">Built In.</span>
                  </h2>
                </div>
                <div className="gsap-from-right">
                  <p className="max-w-[34rem] text-base leading-8 text-[#5c5c58]">
                    A 1.25-acre boutique community shaped around how you actually
                    live - not a checklist copied from every other brochure in North
                    Bangalore.
                  </p>
                </div>
              </div>

              <div className="gsap-reveal mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-black/10 bg-black/10 lg:grid-cols-3">
                {[
                  { src: LANDING_IMAGES.heroMain, label: "Entrance" },
                  { src: LANDING_IMAGES.heroKitchen, label: 'Luxury Interiors' },
                  { src: LANDING_IMAGES.heroSecondary, label: 'Premium Rooftop' },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="group relative aspect-[4/3] overflow-hidden bg-black"
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="gsap-parallax h-[116%] w-full object-cover opacity-92 transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_45%,rgba(0,0,0,0.74)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[#e6ceaa]">
                          0{index + 1}
                        </p>
                        <p className="mt-2 text-[15px] font-semibold">{item.label}</p>
                      </div>
                      {/* <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" /> */}
                    </div>
                  </div>
                ))}
              </div>

              <div className="gsap-stagger mt-4 grid gap-px overflow-hidden rounded-[2rem] border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-5">
                {AMENITIES.slice(3).map(({ icon: Icon, label }, index) => (
                  <div key={label} className="bg-white p-6">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#9a7a45]">
                      0{index + 4}
                    </span>
                    <Icon className="mt-5 h-9 w-9 text-black" strokeWidth={1.4} />
                    <p className="mt-5 text-[14px] leading-6 text-[#393935]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="gsap-reveal mt-8 flex flex-col gap-4 text-sm text-[#5c5c58] sm:flex-row sm:items-center sm:justify-between">
                <span>10 amenities · 1.25 acres · 136 homes</span>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('Lead', { location: 'amenities_visit_cta' });
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:text-[#a9772f]"
                >
                  See them in person
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </PanelShell>

          <PanelShell id="location" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 border-b border-black/8 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div className="gsap-from-left">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                    Location & Connectivity
                  </p>
                  <h2 className="mt-3 max-w-[13.5ch] font-[var(--font-hero)] text-[clamp(2.2rem,4.2vw,4.2rem)] leading-[0.94] tracking-[-0.05em] text-black">
                    <span className="text-black/28">/</span> Everything Around You,
                    Minutes Away
                  </h2>
                </div>
                <div className="gsap-from-right">
                  <p className="max-w-[30rem] text-[15px] leading-7 text-[#5c5c58]">
                    Thanisandra Main Road, beside Manyata Tech Park - North
                    Bangalore&apos;s most-appreciating micro-market.
                  </p>
                </div>
              </div>

              <div className="mt-10 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
                <div className="gsap-from-left self-start border-t border-black/10 pt-5">
                  <p className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[#6b675f]">
                    <MapPin className="h-4 w-4 text-[#a9772f]" />
                    Thanisandra Main Road, North Bangalore
                  </p>

                  <div className="gsap-stagger mt-6 border-t border-black/8">
                    {LOCATION_POINTS.map((point) => (
                      <div
                        key={point.label}
                        className="flex items-center justify-between gap-4 border-b border-black/8 py-4"
                      >
                        <span className="text-[15px] font-medium text-black">
                          {point.label}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b756b]">
                          {point.eta}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-5 border-t border-black/8 pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7a45]">
                        Daily Ease
                      </p>
                      <p className="mt-2 text-[14px] leading-6 text-[#5c5c58]">
                        Work, airport access, and city connectivity without sacrificing a residential setting.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7a45]">
                        Social Infra
                      </p>
                      <p className="mt-2 text-[14px] leading-6 text-[#5c5c58]">
                        Everyday convenience close by, with schools, hospitals, and retail all within easy reach.
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 border-t border-black/8 pt-5 text-[15px] leading-7 text-[#5c5c58]">
                    Hospitals, schools, malls - <span className="font-semibold text-black">all within a short drive</span>.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('Lead', { location: 'location_visit_cta' });
                      setIsFormOpen(true);
                    }}
                    className="mt-7 inline-flex min-h-[52px] items-center gap-3 border border-black bg-black px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-transparent hover:text-black"
                  >
                    Book a Site Visit
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="gsap-from-right border border-black/10 bg-white/60 p-2 sm:p-3">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5840338197117!2d77.630294475078!3d13.062128487261639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae19805217c9fb%3A0x4c11878c221b5d81!2sAadhya%20Serene!5e0!3m2!1sen!2sin!4v1782716091109!5m2!1sen!2sin"
                    title="Aadhya Serene location map"
                    className="h-[320px] w-full sm:h-[520px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="flex items-center justify-between gap-4 border-t border-black/8 px-3 py-3 sm:px-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7a45]">
                        Google Maps
                      </p>
                      <p className="mt-1 text-[14px] text-[#5c5c58]">
                        Aadhya Serene, Thanisandra Main Road, beside Manyata Tech Park.
                      </p>
                    </div>
                    <Compass className="h-4 w-4 shrink-0 text-[#a9772f]" />
                  </div>
                </div>
              </div>
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 border-b border-black/8 pb-8 lg:grid-cols-[1fr_0.95fr] lg:items-end">
                <div className="gsap-from-left">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                    Quality & Specifications
                  </p>
                  <h2 className="mt-3 font-[var(--font-hero)] text-[clamp(2.8rem,5vw,5rem)] leading-[0.92] tracking-[-0.06em] text-black">
                    <span className="text-black/28">/</span> Built to Last, Finished
                    to Move In
                  </h2>
                  <p className="mt-5 max-w-[36rem] text-[15px] leading-8 text-[#5c5c58]">
                    Every spec, every brand, every fitting - chosen for durability
                    and daily comfort. No compromises, no last-minute swaps.
                  </p>
                </div>
                <div className="gsap-from-right grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <SpecStat value="136" label="Homes" />
                  <SpecStat value="1.25" label="Acres" />
                  <SpecStat value="99L" label="STARTING PRICE" />
                </div>
              </div>

              <div className="gsap-stagger mt-10 grid gap-x-8 gap-y-0 border-t border-black/8 sm:grid-cols-2 lg:grid-cols-3">
                {visibleSpecs.map((spec) => (
                  <div
                    key={spec}
                    className="flex items-start gap-3 border-b border-black/8 py-4"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-[14px] leading-6 text-[#393935]">{spec}</span>
                  </div>
                ))}
              </div>

              {(hasMoreSpecs || hasExpandedSpecs) ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-black/8 pt-6">
                  {hasMoreSpecs ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleSpecCount((current) =>
                          Math.min(current + SPEC_BATCH_SIZE, SPEC_CHECKLIST.length)
                        )
                      }
                      className="inline-flex min-h-[52px] items-center gap-3 rounded-full bg-black px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-[#a9772f]"
                    >
                      View more specs
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}

                  {hasExpandedSpecs ? (
                    <button
                      type="button"
                      onClick={() => setVisibleSpecCount(SPEC_INITIAL_COUNT)}
                      className="inline-flex min-h-[52px] items-center gap-3 rounded-full border border-black/10 bg-white/80 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
                    >
                      View less
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="grid gap-8 border-t border-black/10 px-6 py-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-10">
              <div className="gsap-from-left">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                  Developer Trust
                </p>
                <h2 className="mt-3 max-w-[14ch] font-[var(--font-hero)] text-[clamp(2.2rem,4.2vw,4.2rem)] leading-[0.94] tracking-[-0.05em] text-black">
                  <span className="text-black/28">/</span> Built by Abhigna -
                  <span className="block text-[#a9772f]">Delivered, Not Promised.</span>
                </h2>
                <p className="mt-5 max-w-[38rem] text-[15px] leading-8 text-[#5c5c58]">
                  Aadhya Serene comes from the team behind <span className="font-semibold text-black">Misty Woods - 128 homes delivered with trust.</span> We don&apos;t sell distant promises; we build with visible progress and delivery confidence.
                </p>

                <div className="gsap-stagger mt-8 grid gap-5 border-t border-black/8 pt-5 sm:grid-cols-3">
                  {[
                    { icon: HardHat, label: 'In-house construction' },
                    { icon: ShieldCheck, label: 'Transparent paperwork' },
                    { icon: KeyRound, label: 'On-time handovers' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="border-t border-black/10 pt-4"
                    >
                      <Icon className="h-5 w-5 text-[#a9772f]" />
                      <p className="mt-4 text-sm leading-6 text-[#2f2f2c]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gsap-from-right border border-black/10 bg-white/60 p-2 sm:p-3">
                <div className="relative overflow-hidden">
                  <img
                    src={LANDING_IMAGES.mistywoods}
                    alt="Misty Woods - 128 homes delivered"
                    className="block gsap-parallax h-[320px] w-full object-cover object-top sm:h-[500px]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.55)_100%)]" />
                </div>
                <div className="border-t border-black/8 px-3 py-3 sm:px-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#9a7a45]">
                    Track Record
                  </p>
                  <p className="mt-1 text-[14px] leading-7 text-[#5c5c58]">
                    Misty Woods - 128 homes delivered with trust.
                  </p>
                </div>
              </div>
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="grid gap-8 border-y border-black/10 bg-white/40 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
              <div className="gsap-from-left">
                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#9a7a45]">
                  <Flame className="h-4 w-4" />
                  Limited-Period Offer
                </p>
                <h2 className="mt-5 max-w-[14ch] font-[var(--font-hero)] text-[clamp(2.2rem,4.2vw,4.2rem)] leading-[0.94] tracking-[-0.05em] text-black">
                  First 15 Homes -
                  <span className="block text-[#a9772f]">Special Booking Benefit</span>
                </h2>
                <p className="mt-5 max-w-[38rem] text-[15px] leading-8 text-[#5c5c58]">
                  Book among the first 15 and unlock an exclusive move-in benefit.
                  Only <span className="font-semibold text-black">136 homes</span> in
                  the community, and they&apos;re ready now.
                </p>
                <p className="mt-3 text-sm text-[#7b756a]">
                  *Limited-period offer. T&amp;C apply.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('Lead', { location: 'offer_visit_cta' });
                      setIsFormOpen(true);
                    }}
                    className="inline-flex min-h-[54px] items-center gap-3 bg-black px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5"
                  >
                    <Gift className="h-4 w-4" />
                    Claim Booking Benefit
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsAppForm('offer_whatsapp')}
                    className="inline-flex min-h-[54px] items-center gap-2 border border-black/12 bg-white px-6 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5"
                  >
                    <PiKey className="h-4 w-4" />
                    WhatsApp Us
                  </button>
                </div>
              </div>

              <div className="gsap-from-right grid grid-cols-2 gap-4 border-t border-black/8 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                {[
                  { value: '15', label: 'Homes in this offer' },
                  { value: '136', label: 'Total homes' },
                  { value: '99L*', label: 'Starting price' },
                  { value: '2/3', label: 'BHK options' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-black/8 bg-[#fbf8f2] px-5 py-6"
                  >
                    <p className="font-[var(--font-hero)] text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-[-0.06em] text-black">
                      {stat.value}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#6f6a60]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:p-10">
              <div className="gsap-from-left">
                <SectionHeading
                  eyebrow="Get the Details"
                  title="Get the Price Sheet, Floor Plans & a Free Site Visit"
                  description="Drop your details and our team will follow up by email or phone with the price sheet, floor plans, available inventory, and a site visit slot."
                />
                <div className="mt-7 inline-flex items-center gap-2 text-sm text-[#5c5c58]">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  We&apos;ll only contact you about Aadhya Serene. No spam.
                </div>
              </div>

              <form
                onSubmit={heroFormSubmit}
                className="gsap-from-right rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:p-6"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(value) => updateField('name', value)}
                  />
                  <Field
                    label="Phone"
                    placeholder="+91"
                    value={formData.phone}
                    onChange={(value) => updateField('phone', value)}
                  />
                  <SelectField
                    label="Configuration"
                    value={formData.config}
                    onChange={(value) => updateField('config', value)}
                    options={['2 BHK', '3 BHK']}
                  />
                  <SelectField
                    label="Budget (optional)"
                    value={formData.budget}
                    onChange={(value) => updateField('budget', value)}
                    options={['99L - 1.2 Cr', '1.2 Cr +']}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 inline-flex w-full min-h-[56px] items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                {submitState.message ? (
                  <div
                    className={`mt-4 rounded-[1.2rem] px-4 py-3 text-sm ${submitState.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                      }`}
                  >
                    {submitState.message}
                  </div>
                ) : null}

                <p className="mt-4 text-sm text-[#6a6a65]">
                  By submitting, you agree to be contacted by the Aadhya Serene
                  team regarding your enquiry.
                </p>
              </form>
            </div>
          </PanelShell>

          <PanelShell id="faq" className="">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="gsap-reveal border-b border-black/8 pb-8">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">
                  FAQ
                </p>
                <h2 className="mt-3 font-[var(--font-hero)] text-[clamp(2.8rem,5vw,5rem)] leading-[0.92] tracking-[-0.06em] text-black">
                  <span className="text-black/28">/</span> Buying Questions, Answered
                  Clearly
                </h2>
              </div>

              <div className="gsap-stagger mt-8 space-y-3">
                {FAQS.map((item, index) => {
                  const open = activeFaq === index;

                  return (
                    <div
                      key={item.question}
                      className="overflow-hidden rounded-[1.6rem] border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.04)]"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(open ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                      >
                        <span className="text-[15px] font-semibold tracking-[-0.01em] text-black sm:text-base">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#a9772f] transition ${open ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {open ? (
                        <div className="border-t border-black/8 px-5 py-5 text-[14px] leading-7 text-[#5c5c58] sm:px-6">
                          {item.answer}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </PanelShell>

          <PanelShell className="">
            <div className="gsap-reveal flex flex-col gap-6 rounded-[2rem] border border-[#e7dece] bg-white/86 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9a7a45]">
                  Ready to See the Progress Up Close?
                </p>
                <h2 className="mt-3 max-w-[13ch] font-[var(--font-hero)] text-[clamp(2rem,3.8vw,3.5rem)] leading-[0.96] tracking-[-0.05em] text-black">
                  Visit this weekend. See how close your home is to possession.
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={PHONE_LINK}
                  onClick={heroCallClick}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5"
                >
                  <Phone className="h-4 w-4 text-[#a9772f]" />
                  Call {PHONE_DISPLAY}
                </a>
                <button
                  type="button"
                  onClick={heroWhatsAppClick}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#1faf5a] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  <PiKey className="h-4 w-4" />
                  WhatsApp Us
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('Lead', { location: 'final_visit_cta' });
                    setIsFormOpen(true);
                  }}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5"
                >
                  Book Free Visit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </PanelShell>

        </div>

        <footer className="w-full bg-[#111111] text-[#f3efe6]">
          <div className="w-full px-5 pb-4 pt-8 sm:px-6 sm:pb-5 sm:pt-9 lg:px-8 lg:pb-6 lg:pt-10">
            <div className="grid gap-8 border-b border-white/10 pb-7 lg:grid-cols-[1.2fr_0.9fr_0.8fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-white/6 text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Aadhya Serene</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/42">
                      Near-possession 2 &amp; 3 BHK homes
                    </p>
                  </div>
                </div>

                <h3 className="mt-6 max-w-[10ch] font-[var(--font-hero)] text-[clamp(1.9rem,3.7vw,3.4rem)] leading-[0.94] tracking-[-0.055em] text-white">
                  Visit this weekend.
                  <span className="block text-[#d7b177]">See how close you are to possession.</span>
                </h3>

                <p className="mt-5 max-w-[30rem] text-[12px] leading-6 text-white/58">
                  Near-possession 2 &amp; 3 BHK homes on Thanisandra Main Road,
                  North Bangalore. By Abhigna.
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-white/48">
                  <MapPin className="h-3.5 w-3.5 text-[#d7b177]" />
                  Thanisandra Main Road, North Bangalore
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#d7b177]">
                  Contact
                </p>
                <div className="mt-4 space-y-2.5 text-[13px]">
                  <a
                    href={PHONE_LINK}
                    onClick={heroCallClick}
                    className="block font-medium text-white transition hover:text-[#d7b177]"
                  >
                    <Phone className="mr-2 inline h-4 w-4" />
                    {PHONE_DISPLAY}
                  </a>
                  <button
                    type="button"
                    onClick={() => openWhatsAppForm('footer_whatsapp')}
                    className="block w-full bg-transparent p-0 text-left font-medium text-white transition hover:text-[#d7b177]"
                  >
                    <PiKey className="mr-2 inline h-4 w-4" />
                    WhatsApp Us
                  </button>
                </div>

                <p className="mt-5 text-[10px] text-white/40">BBMP Approved</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#d7b177]">
                  Quick Links
                </p>
                <div className="mt-4 flex flex-col gap-2.5 text-[12px] text-white/62">
                  <a href="#lead-form" className="transition hover:text-white">
                    Get Price Sheet
                  </a>
                  <button
                    type="button"
                    onClick={() => openWhatsAppForm('footer_brochure_whatsapp')}
                    className="bg-transparent p-0 text-left transition hover:text-white"
                  >
                    Brochure on WhatsApp
                  </button>
                  <a href="#lead-form" className="transition hover:text-white">
                    Book a Site Visit
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 text-[10px] leading-5 text-white/38 lg:flex-row lg:items-center lg:justify-between">
              <p>
                Disclaimer: Prices, images, and specifications are indicative and
                subject to change. *Starting price for limited units. T&amp;C
                apply. This is not a legal offer.
              </p>
              <p className="uppercase tracking-[0.16em] text-white/24">
                Aadhya Serene · North Bangalore
              </p>
            </div>
          </div>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[85] grid grid-cols-2 border-t border-black/8 bg-white/96 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={stickyWhatsApp}
          className="inline-flex items-center justify-center gap-2 py-4 text-[14px] font-semibold text-white"
          style={{ background: 'linear-gradient(180deg,#26c66a,#1faf5a)' }}
        >
          <PiKey className="h-4 w-4" />
          WhatsApp
        </button>
        <a
          href={PHONE_LINK}
          onClick={stickyCall}
          className="inline-flex items-center justify-center gap-2 border-l border-white/30 bg-black py-4 text-[14px] font-semibold text-white"
        >
          <Phone className="h-4 w-4" />
          Call
        </a>
      </div>

      <motion.button
        type="button"
        onClick={stickyWhatsApp}
        whileHover={{ y: -2, scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-6 right-6 z-[90] hidden h-14 w-14 items-center justify-center border-0 bg-transparent p-0 lg:inline-flex"
        aria-label={`Start WhatsApp enquiry for ${PHONE_DISPLAY}`}
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[#25d366]/22"
          animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 rounded-full border border-[#25d366]/30"
          animate={{ scale: [0.94, 1.18, 0.94], opacity: [0.34, 0, 0.34] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.22,
          }}
        />
        <img
          src={WHATSAPP_IMAGE}
          alt=""
          aria-hidden="true"
          className="relative z-[1] h-full w-full shrink-0 object-contain"
        />
      </motion.button>

      <AnimatePresence>
        {isWhatsAppFormOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[1210] flex items-start justify-center overflow-y-auto overscroll-contain bg-[rgba(10,10,12,0.74)] px-3 py-4 backdrop-blur-xl sm:p-6 lg:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-w-4xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#f7f6f1] shadow-[0_36px_120px_rgba(0,0,0,0.34)]"
            >
              <motion.button
                type="button"
                onClick={() => setIsWhatsAppFormOpen(false)}
                whileHover={{ scale: 1.06, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition"
                aria-label="Close WhatsApp form"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <div className="relative hidden w-[40%] shrink-0 overflow-hidden md:block">
                <img
                  src={FORM_IMAGE}
                  alt="Aadhya Serene interior"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.54)_100%)]" />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.3rem] border border-white/15 bg-black/28 px-4 py-4 text-white backdrop-blur-lg">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#9df0ba]">
                    WhatsApp Flow
                  </p>
                  <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-white">
                    Start the Aadhya Serene enquiry on WhatsApp.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    We&apos;ll send the approved template first, then continue the
                    brochure, pricing, site visit, app link, or sales conversation
                    in chat.
                  </p>
                </div>
              </div>

              <div className="flex-1 px-5 py-6 sm:px-6 sm:py-7">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#0e8a45]">
                  Start on WhatsApp
                </p>
                <h3 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-black">
                  Get brochure, pricing, site visit help, and app access in chat
                </h3>
                <p className="mt-1.5 max-w-[36rem] text-[14px] leading-7 text-[#5c5c58]">
                  Enter your name and WhatsApp number. We&apos;ll send the
                  approved first message from the server and continue the flow in
                  WhatsApp.
                </p>
                <div className="mt-7">
                  <WhatsAppLeadForm />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto overscroll-contain bg-[rgba(10,10,12,0.7)] px-3 py-4 backdrop-blur-xl sm:p-6 lg:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-w-5xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#f7f6f1] shadow-[0_36px_120px_rgba(0,0,0,0.34)]"
            >
              <motion.button
                type="button"
                onClick={() => setIsFormOpen(false)}
                whileHover={{ scale: 1.06, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition"
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <div className="relative hidden w-[34%] shrink-0 overflow-hidden md:block">
                <img
                  src={FORM_IMAGE}
                  alt="Aadhya Serene interior"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.48)_100%)]" />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.3rem] border border-white/15 bg-black/28 px-4 py-4 text-white backdrop-blur-lg">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#f1d6a4]">
                    Aadhya Serene
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    Share a few details and our team will review your enquiry and
                    follow up with pricing, floor plans, and site visit assistance.
                  </p>
                </div>
              </div>

              <form onSubmit={submitForm} className="relative flex min-h-0 flex-1 flex-col">
                <div className="border-b border-black/8 px-5 py-5 sm:px-6">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#9b7234]">
                    {hasAutoOpened ? 'Priority Enquiry' : 'Book With Confidence'}
                  </p>
                  <h3 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-black">
                    Get the Price Sheet, Floor Plans &amp; a Free Site Visit
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-7 text-[#5c5c58]">
                    Takes 30 seconds. We&apos;ll only contact you about Aadhya
                    Serene.
                  </p>
                </div>

                <div className="min-h-0 flex-1 px-5 py-5 sm:px-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(value) => updateField('name', value)}
                    />
                    <Field
                      label="Phone Number"
                      placeholder="+91"
                      value={formData.phone}
                      onChange={(value) => updateField('phone', value)}
                    />
                    <SelectField
                      label="Configuration"
                      value={formData.config}
                      onChange={(value) => updateField('config', value)}
                      options={['2 BHK', '3 BHK']}
                    />
                    <SelectField
                      label="Budget (optional)"
                      value={formData.budget}
                      onChange={(value) => updateField('budget', value)}
                      options={['99L - 1.2 Cr', '1.2 Cr +']}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-[#4d4338]">
                      Anything specific? (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(event) => updateField('message', event.target.value)}
                      className="w-full rounded-[1.2rem] border border-black/8 bg-white px-4 py-3 text-sm text-black shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:border-black focus:ring-4 focus:ring-black/8"
                      placeholder="Preferred facing, family needs, loan help..."
                    />
                  </div>

                  {submitState.message ? (
                    <div
                      className={`mt-4 rounded-[1.2rem] px-4 py-3 text-[13px] font-medium ${submitState.type === 'success'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                      {submitState.message}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-black/8 px-5 py-4 sm:px-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          80% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        @media (max-width: 1023px) {
          body {
            padding-bottom: 64px;
          }
        }
      `}</style>
    </>
  );
}

function PanelShell({ id, className = '', children }) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a7a45]">{eyebrow}</p>
      <h2 className="mt-3 max-w-[11ch] font-[var(--font-hero)] text-[clamp(2.4rem,4.5vw,4.6rem)] leading-[0.94] tracking-[-0.055em] text-black">
        <span className="text-black/28">/</span> {title}
      </h2>
      <p className="mt-5 max-w-[36rem] text-[15px] leading-8 text-[#5c5c58]">
        {description}
      </p>
    </div>
  );
}

function ReraBadge({ className = '', theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border px-4 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.05)] backdrop-blur-sm ${isDark
          ? 'border-white/12 bg-black/24 text-white/72'
          : 'border-[#e5dac7] bg-white/86 text-[#6c624f]'
        } ${className}`}
    >
      <span
        className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-[#e9d2ae]' : 'text-[#9a7a45]'
          }`}
      >
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
        K-RERA
      </span>
      <span className={`hidden h-3.5 w-px sm:block ${isDark ? 'bg-white/16' : 'bg-black/10'}`} />
      <span
        className={`min-w-0 text-[10px] font-medium leading-5 [overflow-wrap:anywhere] sm:text-[11px] ${isDark ? 'text-white/78' : 'text-[#2f2b25]'
          }`}
      >
        {RERA_NUMBER}
      </span>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6d68]">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-[1.3rem] border border-black/8 bg-[#f7f6f1] px-4 text-sm text-black outline-none transition focus:border-black focus:ring-4 focus:ring-black/8"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6d68]">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-[1.3rem] border border-black/8 bg-[#f7f6f1] px-4 text-sm text-black outline-none transition focus:border-black focus:ring-4 focus:ring-black/8"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function SpecStat({ value, label }) {
  return (
    <div className="border-t border-black/10 pt-4 text-left">
      <p className="font-[var(--font-hero)] text-[2.4rem] leading-none tracking-[-0.05em] text-black">
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[#9a7a45]">
        {label}
      </p>
    </div>
  );
}
