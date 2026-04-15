'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Inter } from 'next/font/google';
import { ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, MapPin, Ruler } from 'lucide-react';

const titleFont = Inter({
  subsets: ['latin'],
  weight: ['200', '300'],
  display: 'swap',
});

const TITLE_LINES = ['Quiet luxury for a', 'calmer way to live.'];
const FEATURE_PILLS = [
  'Thoughtfully Planned Residences',
  'Contemporary Architecture',
  'Landscaped Open Surroundings',
];

const PROJECT_STATS = [
  {
    label: 'Acre Enclave',
    end: 1.2,
    decimals: 1,
    format: (value) => value.toFixed(1),
  },
  {
    label: 'Signature Floors',
    end: 6,
    format: (value) => `G+${Math.round(value)}`,
  },
  {
    label: 'BHK Residences',
    end: 3,
    format: (value) => `${Math.max(2, Math.round(value))} & 3`,
  },
  {
    label: 'Curated Homes',
    end: 136,
    format: (value) => `${Math.round(value)}`,
  },
  {
    label: 'Lifestyle Amenities',
    end: 10,
    format: (value) => `${Math.round(value)}+`,
  },
  {
    label: 'Private Balconies',
    end: 3,
    format: (value) => `1-${Math.max(1, Math.round(value))}`,
  },
];

const DETAIL_ROWS = [
  {
    icon: MapPin,
    title: 'Thanisandra, Bengaluru',
    description: 'An address connected to the best of North Bengaluru.',
  },
  {
    icon: Ruler,
    title: '1001 sqft - 1498 sqft',
    description: 'Well-proportioned 2 and 3 BHK residences.',
  },
  {
    icon: CheckCircle2,
    title: 'RERA registered',
    description: 'PRM / KA / RERA / 1251 / 446 / PR / 190614 / 002604',
  },
];

const titleContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.38,
    },
  },
};

const titleCharacter = {
  hidden: {
    y: '110%',
    opacity: 0,
  },
  show: {
    y: '0%',
    opacity: 1,
    transition: {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const paragraphContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.016,
      delayChildren: 0.86,
    },
  },
};

const paragraphCharacter = {
  hidden: {
    y: '105%',
    opacity: 0,
  },
  show: {
    y: '0%',
    opacity: 1,
    transition: {
      duration: 0.95,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

function AnimatedLine({
  text,
  className = '',
  containerVariants = titleContainer,
  characterVariants = titleCharacter,
}) {
  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`block ${className}`}
      aria-label={text}
    >
      {Array.from(text).map((character, index) => (
        <span
          key={`${character}-${index}`}
          className="inline-block overflow-hidden align-top"
        >
          <motion.span
            variants={characterVariants}
            className="inline-block will-change-transform"
          >
            {character === ' ' ? '\u00A0' : character}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

function CountUpStat({ end, label, format, decimals = 0, delay = 0 }) {
  const [value, setValue] = React.useState(0);

  useEffect(() => {
    let frameId;
    let timeoutId;
    const duration = 1500;

    const startAnimation = () => {
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = end * eased;

        setValue(progress >= 1 ? end : nextValue);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(startAnimation, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [delay, end]);

  const renderedValue = format ? format(value) : value.toFixed(decimals);

  return (
    <article className="h-full rounded-[22px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.1)_100%)] px-4 py-4 shadow-[0_20px_40px_rgba(6,10,18,0.16),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-[24px] md:px-4 md:py-4">
      <div className="text-[1.85rem] font-light leading-none tracking-[-0.05em] text-[#f7f8fb] md:text-[1.95rem]">
        {renderedValue}
      </div>
      <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/62 md:text-[9.5px]">
        {label}
      </p>
    </article>
  );
}

function ProjectBriefContent() {
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
          Project Brief
        </span>
        <span className="h-px flex-1 bg-white/18" />
      </div>

      <p className="mt-4 max-w-[28ch] text-[14px] leading-[1.8] text-white/72">
        Essential details with a quieter, more luxurious finish and a more
        composed residential rhythm.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
        {PROJECT_STATS.map((stat, index) => (
          <CountUpStat
            key={stat.label}
            end={stat.end}
            label={stat.label}
            format={stat.format}
            decimals={stat.decimals}
            delay={860 + index * 110}
          />
        ))}
      </div>
    </>
  );
}

function AboutMainCardContent({ navigateTo }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
          About Aadhya Serene
        </span>
        <span className="h-px flex-1 bg-white/18" />
      </div>

      <div className="mt-5 space-y-1">
        {TITLE_LINES.map((line) => (
          <AnimatedLine
            key={line}
            text={line}
            className={`${titleFont.className} text-[clamp(1.72rem,3.2vw,3.45rem)] font-light leading-[1.03] tracking-[-0.04em] text-[#f7f7fa] [text-shadow:0_12px_34px_rgba(0,0,0,0.18)] md:whitespace-nowrap`}
          />
        ))}
      </div>

      <motion.p className="mt-5 max-w-[405px] text-[13.5px] leading-[1.82] text-white/80 md:text-[14px]">
        <AnimatedLine
          text="Aadhya Serene is crafted for those who value clean architecture, generous light, and a more composed living experience in North Bengaluru. Every detail is shaped to feel elevated, elegant, and effortlessly comfortable."
          containerVariants={paragraphContainer}
          characterVariants={paragraphCharacter}
          className="max-w-[405px]"
        />
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.78, delay: 0.98, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex flex-wrap gap-2.5"
      >
        {FEATURE_PILLS.map((pill) => (
          <span
            key={pill}
            className="inline-flex min-h-[38px] items-center rounded-full border border-white/18 bg-white/8 px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px]"
          >
            {pill}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.82, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 space-y-0"
      >
        {DETAIL_ROWS.map(({ icon: Icon, title, description }, index) => (
          <div
            key={title}
            className={`flex items-start gap-4 py-5 ${
              index !== DETAIL_ROWS.length - 1 ? 'border-b border-white/12' : ''
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px]">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="m-0 text-[1.05rem] font-medium tracking-[-0.02em] text-[#f4f5f8]">
                {title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.75] text-white/62">
                {description}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.84, delay: 1.18, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <button
          type="button"
          onClick={() => navigateTo('/apartments')}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(241,244,248,0.84)_100%)] px-6 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#101114] shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5"
        >
          Explore Apartments
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </motion.div>
    </>
  );
}

export default function About() {
  const router = useRouter();
  const isNavigatingRef = useRef(false);
  const [isCompactLayout, setIsCompactLayout] = React.useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = React.useState(true);

  const navigateTo = useCallback(
    (path) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (path === '/') {
        window.dispatchEvent(new CustomEvent('bg-layout', { detail: 'home' }));
      } else if (path === '/apartments') {
        window.dispatchEvent(
          new CustomEvent('bg-layout', { detail: 'apartments' }),
        );
      }

      const container = document.getElementById('about-container');

      if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.6s ease';
      } else {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease';
      }

      window.setTimeout(() => router.push(path), 600);
    },
    [router],
  );

  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth < 1024;
      setIsCompactLayout(compact);
      setIsMobileAboutOpen((current) => (compact ? current : true));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const container = document.getElementById('about-container');

    if (container) {
      container.style.opacity = '1';
      container.style.transition = '';
    }

    document.body.style.opacity = '1';
    document.body.style.transition = '';
    isNavigatingRef.current = false;

    const canWheelNavigate = window.matchMedia('(pointer: fine)').matches;

    const onWheel = (event) => {
      if (isNavigatingRef.current) return;

      if (event.deltaY > 36) navigateTo('/apartments');
      if (event.deltaY < -36) navigateTo('/');
    };

    if (canWheelNavigate) {
      window.addEventListener('wheel', onWheel, { passive: true });
    }

    return () => {
      if (canWheelNavigate) {
        window.removeEventListener('wheel', onWheel);
      }
    };
  }, [navigateTo]);

  return (
    <main id="about-container" className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,12,0.04)_0%,rgba(6,8,12,0.08)_42%,rgba(6,8,12,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(218,189,133,0.16),transparent_30%),radial-gradient(circle_at_70%_78%,rgba(255,255,255,0.07),transparent_24%)]" />

      <section className="relative z-[1] flex min-h-full items-start px-4 pb-36 pt-[4.5rem] md:px-8 md:pb-36 md:pt-[5.5rem] lg:items-end lg:px-12 lg:pb-16 lg:pt-28 xl:px-16">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] bg-[linear-gradient(180deg,transparent_0%,rgba(7,8,12,0.1)_16%,rgba(7,8,12,0.94)_100%)]" />

        <div className="relative z-[1] flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-[540px] overflow-hidden rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_100%)] px-6 py-7 shadow-[0_30px_70px_rgba(6,10,18,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[34px] md:px-7 md:py-8 ${isCompactLayout ? 'hidden' : ''}`}
          >
            <AboutMainCardContent navigateTo={navigateTo} />
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.92, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="hidden w-full max-w-[350px] self-start overflow-hidden rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_100%)] px-5 py-6 shadow-[0_30px_70px_rgba(6,10,18,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[34px] lg:ml-auto lg:block lg:self-end md:px-6 md:py-7"
          >
            <ProjectBriefContent />
          </motion.aside>
        </div>
      </section>

      {isCompactLayout ? (
        <>
          <motion.aside
            initial={false}
            animate={{
              x: isMobileAboutOpen ? 0 : 'calc(100% + 1rem)',
              opacity: isMobileAboutOpen ? 1 : 0.98,
            }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-3 top-4 bottom-28 z-[30] w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-[30px] border border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-5 shadow-[0_24px_60px_rgba(6,10,18,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-[30px] sm:w-[360px]"
            style={{
              pointerEvents: isMobileAboutOpen ? 'auto' : 'none',
            }}
          >
            <div className="h-full overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/16">
              <AboutMainCardContent navigateTo={navigateTo} />
            </div>
          </motion.aside>

          <button
            type="button"
            onClick={() => setIsMobileAboutOpen((current) => !current)}
            aria-label={isMobileAboutOpen ? 'Hide about panel' : 'Show about panel'}
            className="fixed right-3 top-5 z-[31] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.12)_100%)] text-white shadow-[0_18px_40px_rgba(6,10,18,0.2)] backdrop-blur-[24px] transition duration-300 hover:bg-white/20"
          >
            {isMobileAboutOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </>
      ) : null}
    </main>
  );
}
