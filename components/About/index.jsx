'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Inter } from 'next/font/google';
import { ArrowDown, ArrowUpRight, CheckCircle2, MapPin, Ruler } from 'lucide-react';
import usePerformanceProfile from '@/hooks/usePerformanceProfile';
import { isBackgroundTransitionActive } from '@/lib/background-transition';

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
  disableAnimation = false,
}) {
  if (disableAnimation) {
    return <span className={`block ${className}`}>{text}</span>;
  }

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

function CountUpStat({ end, label, format, decimals = 0, delay = 0, disableAnimation = false }) {
  const [value, setValue] = React.useState(0);

  useEffect(() => {
    if (disableAnimation) {
      setValue(end);
      return undefined;
    }

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
  }, [delay, disableAnimation, end]);

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

function ProjectBriefContent({ disableAnimation = false }) {
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
            disableAnimation={disableAnimation}
          />
        ))}
      </div>
    </>
  );
}

function AboutMainCardContent({ navigateTo, disableAnimation = false }) {
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
            disableAnimation={disableAnimation}
            className={`${titleFont.className} text-[clamp(1.72rem,3.2vw,3.45rem)] font-light leading-[1.03] tracking-[-0.04em] text-[#f7f7fa] [text-shadow:0_12px_34px_rgba(0,0,0,0.18)] md:whitespace-nowrap`}
          />
        ))}
      </div>

      <motion.p className="mt-5 max-w-[405px] text-[13.5px] leading-[1.82] text-white/80 md:text-[14px]">
        <AnimatedLine
          text="Aadhya Serene is crafted for those who value clean architecture, generous light, and a more composed living experience in North Bengaluru. Every detail is shaped to feel elevated, elegant, and effortlessly comfortable."
          disableAnimation={disableAnimation}
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
  const mobileContentRef = useRef(null);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = React.useState(() =>
    isBackgroundTransitionActive('about'),
  );
  const { isTabletOrBelow, isConstrainedDevice, shouldReduceMotion } = usePerformanceProfile();
  const shouldUseLightMotion = isConstrainedDevice || shouldReduceMotion;

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

      const routePushDelay = path === '/apartments' && isTabletOrBelow ? 0 : 600;
      window.setTimeout(() => router.push(path), routePushDelay);
    },
    [isTabletOrBelow, router],
  );

  const scrollToMobileContent = useCallback(() => {
    mobileContentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  useEffect(() => {
    const handleStarted = () => {
      if (isBackgroundTransitionActive('about')) {
        setIsIntroVideoPlaying(true);
      }
    };
    const handleEnded = () => setIsIntroVideoPlaying(false);

    setIsIntroVideoPlaying(isBackgroundTransitionActive('about'));
    window.addEventListener('bg-transition-started', handleStarted);
    window.addEventListener('bg-transition-ended', handleEnded);

    return () => {
      window.removeEventListener('bg-transition-started', handleStarted);
      window.removeEventListener('bg-transition-ended', handleEnded);
    };
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

      {!isTabletOrBelow ? (
        <section className="relative z-[1] flex min-h-full items-start px-4 pb-36 pt-[4.5rem] md:px-8 md:pb-36 md:pt-[5.5rem] lg:items-end lg:px-12 lg:pb-16 lg:pt-28 xl:px-16">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] bg-[linear-gradient(180deg,transparent_0%,rgba(7,8,12,0.1)_16%,rgba(7,8,12,0.94)_100%)]" />

          <div className="relative z-[1] flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{
                opacity: isIntroVideoPlaying ? 0 : 1,
                y: isIntroVideoPlaying ? 28 : 0,
              }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[540px] overflow-hidden rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_100%)] px-6 py-7 shadow-[0_30px_70px_rgba(6,10,18,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[34px] md:px-7 md:py-8"
              style={{
                pointerEvents: isIntroVideoPlaying ? 'none' : 'auto',
              }}
            >
              <AboutMainCardContent
                navigateTo={navigateTo}
                disableAnimation={shouldUseLightMotion}
              />
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{
                opacity: isIntroVideoPlaying ? 0 : 1,
                y: isIntroVideoPlaying ? 28 : 0,
              }}
              transition={{ duration: 0.52, delay: isIntroVideoPlaying ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="hidden w-full max-w-[350px] self-start overflow-hidden rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_100%)] px-5 py-6 shadow-[0_30px_70px_rgba(6,10,18,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[34px] xl:ml-auto xl:block xl:self-end md:px-6 md:py-7"
              style={{
                pointerEvents: isIntroVideoPlaying ? 'none' : 'auto',
              }}
            >
              <ProjectBriefContent disableAnimation={shouldUseLightMotion} />
            </motion.aside>
          </div>
        </section>
      ) : (
        <>
          <section className="relative z-[1] min-h-[100dvh] px-4 pb-14 pt-[4.5rem] md:px-8 md:pt-[5.5rem]">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] bg-[linear-gradient(180deg,transparent_0%,rgba(7,8,12,0.12)_24%,rgba(7,8,12,0.9)_100%)]" />

            {!isIntroVideoPlaying ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 bottom-[max(22px,env(safe-area-inset-bottom,0px)+14px)] z-[1] flex justify-center"
              >
                <button
                  type="button"
                  onClick={scrollToMobileContent}
                  className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/18 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/68 backdrop-blur-[14px]"
                >
                  <span>Scroll Down</span>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : null}
          </section>

          <section ref={mobileContentRef} className="relative z-[1] px-4 pb-28 md:px-8">
            <div className="mx-auto flex w-full max-w-[780px] flex-col gap-4 md:gap-5">
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: isIntroVideoPlaying ? 0 : 1, y: isIntroVideoPlaying ? 32 : 0 }}
                transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-[28px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.07)_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(6,10,18,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[28px] md:px-7 md:py-8"
              >
                <AboutMainCardContent
                  navigateTo={navigateTo}
                  disableAnimation={shouldUseLightMotion}
                />
              </motion.article>

              <motion.aside
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isIntroVideoPlaying ? 0 : 1, y: isIntroVideoPlaying ? 34 : 0 }}
                transition={{ duration: 0.58, delay: isIntroVideoPlaying ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-[28px] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.07)_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(6,10,18,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[28px] md:px-7 md:py-8"
              >
                <ProjectBriefContent disableAnimation={shouldUseLightMotion} />
              </motion.aside>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
