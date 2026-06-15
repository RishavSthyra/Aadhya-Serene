'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  FileText,
  IndianRupee,
  KeyRound,
  Landmark,
  LayoutGrid,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Trees,
  Trophy,
  X,
} from 'lucide-react';
import {
  PiArmchair,
  PiBuildings,
  PiCheckCircleFill,
  PiEye,
  PiFlowerLotus,
  PiHouseLine,
  PiKey,
  PiShieldCheckered,
  PiTreePalm,
  PiUsersThree,
} from 'react-icons/pi';

const PHONE_DISPLAY = '+91 96209 93333';
const PHONE_LINK = 'tel:+919620993333';
const FORM_IMAGE = '/landing%20page%20images/interiorimage7.avif';
const LANDING_IMAGES = {
  heroLeft: '/landing%20page%20images/image1.avif',
  heroCenter: '/landing%20page%20images/image2.avif',
  heroRight: '/landing%20page%20images/interiorimage7.avif',
  ready: '/landing%20page%20images/image4.avif',
  lifestyle: '/landing%20page%20images/image5.avif',
  delivered: '/landing%20page%20images/image3.avif',
  deliveredAlt: '/landing%20page%20images/iamge6.avif',
};

const FORM_STEPS = [
  {
    id: 'homeType',
    type: 'options',
    field: 'homeType',
    title: 'Which home are you exploring?',
    description: 'Pick the home type that matches your interest best.',
    options: ['2 BHK', '3 BHK', 'Premium Corner Home', 'Need Guidance'],
  },
  {
    id: 'purpose',
    type: 'options',
    field: 'purpose',
    title: 'What best describes your buying goal?',
    description: 'This helps us tailor the right recommendation for you.',
    options: ['Self use', 'Investment', 'Upgrade', 'Rental yield'],
  },
  {
    id: 'budget',
    type: 'options',
    field: 'budget',
    title: 'What budget range are you considering?',
    description: 'Choose the range that feels most comfortable for you.',
    options: ['Under 1.2 Cr', '1.2 Cr - 1.5 Cr', '1.5 Cr+', 'Need options'],
  },
  {
    id: 'timeline',
    type: 'options',
    field: 'timeline',
    title: 'How soon are you planning to move?',
    description: 'We will match the conversation to your timeline.',
    options: ['Immediate', 'Within 30 days', 'Within 3 months', 'Just exploring'],
  },
  {
    id: 'preferredTime',
    type: 'options',
    field: 'preferredTime',
    title: 'When would you like us to connect?',
    description: 'Choose the time that works best for a callback or visit.',
    options: ['This Weekend', 'Weekday Evening', 'Weekday Morning', 'Need a callback'],
  },
  {
    id: 'requestType',
    type: 'options',
    field: 'requestType',
    title: 'What would you like us to help with next?',
    description: 'Select the next action you want from our team.',
    options: [
      { label: 'Site Visit', value: 'site_visit' },
      { label: 'Book Unit', value: 'book_unit' },
      { label: 'Register Interest', value: 'register_interest' },
      { label: 'Request Brochure', value: 'brochure' },
    ],
  },
  {
    id: 'message',
    type: 'textarea',
    field: 'message',
    title: 'Any specific requirement you want us to know?',
    description: 'Share preferred facing, loan help, family needs, or anything else.',
    optional: true,
  },
  {
    id: 'contact',
    type: 'contact',
    title: 'Where should we send the details?',
    description: 'Share your details and we will get back quickly.',
  },
];

const FAQS = [
  {
    question: 'Why is North Bangalore such a strong location today?',
    answer:
      'North Bangalore continues to attract homebuyers because of fast access to Manyata Tech Park, the airport corridor, established social infrastructure, and long-term appreciation driven by ongoing public and private investment.',
  },
  {
    question: 'Is Aadhya Serene ready to move in?',
    answer:
      'Yes. Aadhya Serene is positioned as a ready-to-move community, so buyers can evaluate the finished project experience, common amenities, and overall quality before making a decision.',
  },
  {
    question: 'Who is this project ideal for?',
    answer:
      'It works well for end users who want immediate usability, working professionals needing quick access to North Bangalore employment hubs, and families who value a finished community over under-construction uncertainty.',
  },
  {
    question: 'What makes a ready-to-move project different from an under-construction one?',
    answer:
      'You can physically inspect the home, judge space and finish quality in person, understand the actual neighborhood, and reduce the waiting risk that often comes with delivery timelines.',
  },
];

const COMPARISON_ROWS = [
  {
    label: 'Project Status',
    serene: 'Ready to move in',
    other: 'Often under construction or delivery-led',
  },
  {
    label: 'Site Experience',
    serene: 'Visit the finished project and live amenities',
    other: 'Mostly sample-led or promise-led',
  },
  {
    label: 'Location Access',
    serene: 'Strong North Bangalore connectivity',
    other: 'Can vary widely by micro-market',
  },
  {
    label: 'Decision Confidence',
    serene: 'Evaluate what is already built',
    other: 'Depends more on plans and assumptions',
  },
  {
    label: 'Community Readiness',
    serene: 'Immediate use potential',
    other: 'Phased handover in many cases',
  },
];

const QUICK_FACTS = [
  {
    icon: KeyRound,
    title: 'Ready to Move',
    description: 'Finished homes, ready for you to move in without the wait.',
  },
  {
    icon: TrendingUp,
    title: 'Better Value',
    description: 'Competitive pricing with no hidden costs. More value for your money.',
  },
  {
    icon: MapPin,
    title: 'Prime Location',
    description: 'Minutes from Manyata Tech Park, with excellent connectivity.',
  },
  {
    icon: Users,
    title: 'Family-Centric Amenities',
    description: 'Clubhouse, landscaped spaces and amenities for every age.',
  },
  {
    icon: LayoutGrid,
    title: 'Thoughtful Planning',
    description: 'Smart layouts, efficient spaces and ample natural light.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Approvals',
    description: 'BBMP approved and RERA registered for complete peace of mind.',
  },
];

const NORTH_BLR_POINTS = [
  'Fast access to Manyata Tech Park and the airport corridor',
  'Growing social infrastructure with schools, hospitals, and retail nearby',
  'A practical choice for both self-use and long-term value-led buyers',
];

const TRUST_POINTS = [
  {
    icon: PiShieldCheckered,
    text: 'Delivered project legacy through Misty Woods',
  },
  {
    icon: PiKey,
    text: 'Ready-to-visit project experience instead of brochure-only selling',
  },
  {
    icon: PiEye,
    text: 'A clearer view of finish, scale, and actual liveability before booking',
  },
];

const LUXURY_POINTS = [
  {
    icon: PiUsersThree,
    text: 'Clubhouse and social spaces',
  },
  {
    icon: PiArmchair,
    text: 'Ready-to-use outdoor leisure zones',
  },
  {
    icon: PiHouseLine,
    text: 'Finished homes with real interior context',
  },
  {
    icon: PiTreePalm,
    text: 'A calmer project scale built for daily life',
  },
];

function FieldButton({ active, children, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? 'border-[#b58739] bg-[linear-gradient(180deg,#fff8ed_0%,#fff2dc_100%)] text-[#2c2111] shadow-[0_18px_38px_rgba(181,135,57,0.16)]'
          : 'border-black/10 bg-white/92 text-[#5a5147] shadow-[0_12px_28px_rgba(0,0,0,0.04)] hover:border-[#b58739]/40 hover:bg-[#fffaf2]'
      }`}
    >
      {children}
    </motion.button>
  );
}

export default function ReadyToMoveLandingPage() {
  const [activeFaq, setActiveFaq] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ type: '', message: '' });
  const timerRef = useRef(null);
  const openedRef = useRef(false);
  const scrollOpenRef = useRef(false);
  const [formData, setFormData] = useState({
    homeType: '2 BHK',
    timeline: 'Immediate',
    requestType: 'site_visit',
    budget: 'Under 1.2 Cr',
    purpose: 'Self use',
    preferredTime: 'This Weekend',
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const progress = useMemo(
    () => ((stepIndex + 1) / FORM_STEPS.length) * 100,
    [stepIndex],
  );
  const currentStep = FORM_STEPS[stepIndex];

  useEffect(() => {
    const openForm = () => {
      if (openedRef.current) {
        return;
      }

      openedRef.current = true;
      setHasAutoOpened(true);
      setIsFormOpen(true);
    };

    timerRef.current = window.setTimeout(openForm, 20000);

    const handleScroll = () => {
      if (scrollOpenRef.current || openedRef.current) {
        return;
      }

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
  }, []);

  useEffect(() => {
    document.body.style.overflow = isFormOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);

  const updateField = (key, value) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validateStep = () => {
    if (currentStep.type !== 'contact') {
      return true;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setSubmitState({
        type: 'error',
        message: 'Please complete your name, phone, and email.',
      });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    setSubmitState({ type: '', message: '' });
    setStepIndex((current) => Math.min(current + 1, FORM_STEPS.length - 1));
  };

  const prevStep = () => {
    setSubmitState({ type: '', message: '' });
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          requestType: formData.requestType,
          source: 'ready_to_move_landing',
          preferredTime: `${formData.preferredTime} | ${formData.timeline}`,
          message: [
            `Interested in: ${formData.homeType}`,
            `Budget: ${formData.budget}`,
            `Purpose: ${formData.purpose}`,
            `Booking timeline: ${formData.timeline}`,
            formData.message ? `Notes: ${formData.message}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Something went wrong.');
      }

      setSubmitState({
        type: 'success',
        message: payload?.message || 'Thanks. Our team will contact you shortly.',
      });
      setStepIndex(0);
      setFormData((current) => ({
        ...current,
        name: '',
        phone: '',
        email: '',
        message: '',
      }));
      window.setTimeout(() => {
        setIsFormOpen(false);
      }, 1400);
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.message || 'We could not submit your enquiry right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#f7f1e7] text-[#1f1a14]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(248,242,232,0.98)_56%,rgba(242,233,219,0.98)_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,162,100,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(199,162,100,0.08),transparent_22%)]" />
          <div className="absolute inset-0 opacity-35 [background:linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(214,182,129,0.12)_18%,rgba(255,255,255,0)_34%)]" />

          <div className="relative mx-auto w-full max-w-[1680px] px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-12">
            <div className="grid items-center gap-10 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="max-w-[42rem]">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b07a2d] sm:text-xs">
                  <MapPin className="h-4 w-4" />
                  North Bangalore Landmark
                </div>

                <h1 className="mt-4 font-[var(--font-hero)] text-[clamp(3.5rem,7vw,6.9rem)] leading-[0.84] tracking-[-0.055em] text-[#16254b]">
                  Ready to
                  <span className="block text-[#c68a37]">Move In</span>
                </h1>

                <p className="mt-3 text-[1.55rem] font-medium tracking-[-0.03em] text-[#22314f] sm:text-[2rem]">
                  2 & 3 BHK homes near Manyata Tech Park
                </p>

                <p className="mt-5 max-w-[36rem] text-[15px] leading-8 text-[#5f5a52] sm:text-lg">
                  Elegant finished homes near Manyata Tech Park, designed for buyers who want a real project experience, faster decisions with confidence, and immediate liveability.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex min-h-[58px] items-center gap-3 rounded-[1.25rem] bg-[#13244a] px-7 text-base font-semibold text-white shadow-[0_18px_40px_rgba(19,36,74,0.18)] transition hover:-translate-y-0.5"
                  >
                    <CalendarClock className="h-5 w-5 text-[#d9b16b]" />
                    <span>Book Site Visit</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <a
                    href={PHONE_LINK}
                    className="inline-flex min-h-[58px] items-center gap-3 rounded-[1.25rem] border border-[#ddb26f] bg-white px-7 text-base font-semibold text-[#c0872e] shadow-[0_16px_36px_rgba(188,140,58,0.1)] transition hover:-translate-y-0.5"
                  >
                    <Phone className="h-5 w-5" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[2.25rem] border border-[#ddb26f] bg-white shadow-[0_24px_68px_rgba(86,60,20,0.16)]">
                  <img
                    src={LANDING_IMAGES.ready}
                    alt="Aadhya Serene exterior facade"
                    className="h-full min-h-[22rem] w-full object-cover lg:min-h-[36rem]"
                  />
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-[#ddb26f] bg-white shadow-[0_22px_54px_rgba(86,60,20,0.14)] lg:absolute lg:-bottom-14 lg:right-0 lg:mt-0 lg:w-[36%]">
                  <img
                    src={LANDING_IMAGES.heroRight}
                    alt="Aadhya Serene bedroom interior"
                    className="h-[19rem] w-full object-cover"
                  />
                  <div className="bg-[#13244a] px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#d7b06b]" />
                      <p className="text-sm font-medium leading-6 text-white/90">
                        Thoughtfully designed homes, ready for you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6">
              {[
                { icon: BadgeCheck, label: 'BBMP Approved' },
                { icon: FileText, label: 'RERA Registered' },
                { icon: IndianRupee, label: 'Starts from Rs 99 Lakhs*' },
                { icon: Users, label: '136 Families' },
                { icon: Landmark, label: 'Clubhouse Amenities' },
                { icon: MapPin, label: 'Near Manyata Tech Park' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[1.4rem] border border-[#eadcc3] bg-white/86 px-4 py-4 shadow-[0_14px_34px_rgba(160,126,67,0.08)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbf2e5] text-[#c48a34]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#3f3327]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto w-full max-w-[1680px] rounded-[2.2rem] border border-[#eadcc2] bg-white/72 px-5 py-12 shadow-[0_26px_70px_rgba(173,137,76,0.08)] backdrop-blur-md sm:px-8 lg:px-10">
            <div className="text-center">
              <h2 className="font-[var(--font-hero)] text-[clamp(2.4rem,4vw,4.4rem)] leading-[0.96] tracking-[-0.045em] text-[#16254b]">
                Why Aadhya Serene Stands Out
              </h2>
              <div className="mx-auto mt-5 flex max-w-[32rem] items-center justify-center gap-4 text-[#d1a053]">
                <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,#dfc08b)]" />
                <Sparkles className="h-5 w-5" />
                <span className="h-px flex-1 bg-[linear-gradient(90deg,#dfc08b,transparent)]" />
              </div>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {QUICK_FACTS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-[#f0e3cf] bg-white px-5 py-6 shadow-[0_18px_42px_rgba(181,145,88,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#f0dfc0] bg-[#fff8ef] text-[#c48a34] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-[var(--font-hero)] text-[1.85rem] leading-none tracking-[-0.03em] text-[#213256]">
                        {title}
                      </h3>
                      <p className="mt-3 text-[15px] leading-7 text-[#5f574e]">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#e2d1b4]/65 bg-[linear-gradient(180deg,#fffaf2_0%,#f7efe2_100%)]">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-16 sm:px-6 lg:px-8 lg:py-18">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b07a2d]">
                  <PiFlowerLotus className="h-4 w-4" />
                  Why North Bangalore
                </div>
                <div className="mt-4 h-px w-28 bg-[linear-gradient(90deg,#d8aa61,transparent)]" />
                <h2 className="mt-5 max-w-[16ch] font-[var(--font-hero)] text-[clamp(2rem,3.1vw,3.55rem)] leading-[0.94] tracking-[-0.045em] text-[#16254b]">
                  <span className="block">Built For Buyers Who Want Access,</span>
                  <span className="block">Value, And Immediate Use.</span>
                </h2>

                <div className="mt-7 space-y-3">
                  {NORTH_BLR_POINTS.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 py-1"
                    >
                      <PiCheckCircleFill className="h-6 w-6 shrink-0 text-[#cf9739]" />
                      <p className="text-[15px] font-medium leading-7 text-[#4c4339]">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[2rem] border border-[#e6d3b5] bg-white/90 p-6 shadow-[0_18px_44px_rgba(181,145,88,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full border border-[#efdcbf] bg-[#fff8ee] text-[#c58a35]">
                      <PiBuildings className="h-9 w-9" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c39245]">
                        Delivered Project Legacy
                      </p>
                      <h3 className="mt-2 font-[var(--font-hero)] text-[clamp(2rem,3vw,3rem)] leading-[0.98] tracking-[-0.04em] text-[#253453]">
                        Misty Woods, Delivered With Trust
                      </h3>
                      <p className="mt-3 max-w-[42rem] text-[15px] leading-7 text-[#61584c]">
                        Misty Woods reflects the developer&apos;s delivered-project credibility. For Aadhya Serene buyers, that matters because trust grows stronger when delivery and finish quality already exist in the brand&apos;s story.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {TRUST_POINTS.map(({ icon: Icon, text }) => (
                      <div
                        key={text}
                        className="rounded-[1.2rem] border border-[#eee1cd] bg-[#fffaf3] px-4 py-4 shadow-[0_8px_20px_rgba(181,145,88,0.05)]"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#c58a35]" />
                          <p className="text-sm font-medium leading-6 text-[#5b5248]">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-rows-[auto_auto]">
                <div className="relative h-[19rem] overflow-hidden rounded-[2.2rem] border border-[#ddb26f] shadow-[0_24px_60px_rgba(150,114,54,0.12)] sm:h-[23rem] lg:h-[26rem]">
                  <img
                    src={LANDING_IMAGES.delivered}
                    alt="Aadhya Serene building elevation"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-[2rem] border border-[#e1c48f] bg-white shadow-[0_20px_48px_rgba(170,132,70,0.1)]">
                    <img
                      src="/assets/128homes%20iamge.png"
                      alt="128 homes delivered"
                      className="h-full min-h-[16rem] w-full object-cover"
                    />
                  </div>

                  <div className="overflow-hidden rounded-[2rem] border border-[#ddb26f] shadow-[0_20px_48px_rgba(150,114,54,0.1)]">
                    <img
                      src={LANDING_IMAGES.deliveredAlt}
                      alt="Aadhya Serene exterior side angle"
                      className="h-full min-h-[16rem] w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid w-full max-w-[1680px] items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative lg:min-h-[34rem]">
              <img
                src="/assets/leaf_nobg.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -left-10 hidden w-44 opacity-35 md:block"
              />
              <div className="h-full overflow-hidden rounded-[2.3rem] border border-[#ddb26f] bg-white shadow-[0_24px_60px_rgba(150,114,54,0.12)]">
                <img
                  src={LANDING_IMAGES.deliveredAlt}
                  alt="Aadhya Serene facade perspective"
                  className="h-full min-h-[26rem] w-full object-cover"
                />
              </div>
            </div>

            <div className="flex h-full flex-col justify-center lg:min-h-[34rem]">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b07a2d]">
                <PiFlowerLotus className="h-4 w-4" />
                Everyday Luxury
              </div>
              <h2 className="mt-4 max-w-[11ch] font-[var(--font-hero)] text-[clamp(1.9rem,2.8vw,3.2rem)] leading-[0.98] tracking-[-0.04em] text-[#191f32]">
                Spaces That Feel Finished,
                <span className="block">Useful, And Warm.</span>
              </h2>
              <div className="mt-4 h-1 w-16 rounded-full bg-[#d5a14f]" />
              <p className="mt-5 max-w-[42rem] text-[15px] leading-8 text-[#61584c] sm:text-base">
                This is not just a location-led story. Aadhya Serene brings a complete visual and physical environment, from the arrival experience to the finished interiors and amenity rhythm that modern families actually use.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {LUXURY_POINTS.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="rounded-[1.3rem] border border-[#eadbc3] bg-[#fffaf3] px-4 py-4 shadow-[0_10px_24px_rgba(181,145,88,0.05)]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-7 w-7 shrink-0 text-[#c58a35]" />
                      <p className="text-[15px] font-medium leading-6 text-[#51483d]">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#15120f] py-16 text-white sm:py-20">
          <div className="mx-auto grid w-full max-w-[1620px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.9fr] lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_58px_rgba(0,0,0,0.24)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c79d58]/35 bg-[#221b15] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8c98b]">
                <BadgeCheck className="h-4 w-4" />
                Smart Comparison
              </div>
              <h2 className="mt-6 font-[var(--font-hero)] text-[clamp(2.3rem,4vw,4rem)] leading-[0.95] tracking-[-0.045em] text-[#f8ead6]">
                Why Aadhya Serene Feels Different
              </h2>
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10">
                <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-[#1f1a15] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8ba84]">
                  <div className="px-4 py-4">Category</div>
                  <div className="border-l border-white/10 px-4 py-4">Aadhya Serene</div>
                  <div className="border-l border-white/10 px-4 py-4">Many Other Projects</div>
                </div>
                {COMPARISON_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1.1fr_1fr_1fr] border-t border-white/10 bg-[#120f0c] text-sm leading-6 text-white/82"
                  >
                    <div className="px-4 py-4 font-medium text-[#f6ebdb]">{row.label}</div>
                    <div className="border-l border-white/10 px-4 py-4 text-[#d9c7ac]">{row.serene}</div>
                    <div className="border-l border-white/10 px-4 py-4 text-white/64">{row.other}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_58px_rgba(0,0,0,0.24)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c79d58]/35 bg-[#221b15] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8c98b]">
                <MapPin className="h-4 w-4" />
                FAQ
              </div>
              <h2 className="mt-6 font-[var(--font-hero)] text-[clamp(2.1rem,3.6vw,3.5rem)] leading-[0.96] tracking-[-0.045em] text-[#f8ead6]">
                Buying Questions, Answered Clearly
              </h2>
              <div className="mt-8 space-y-3">
                {FAQS.map((item, index) => {
                  const open = activeFaq === index;

                  return (
                    <div key={item.question} className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#181410]">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(open ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-[#f8ead6] sm:text-[15px]">{item.question}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[#d8ba84] transition ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open ? (
                        <div className="border-t border-white/8 px-5 py-4 text-sm leading-7 text-white/72">
                          {item.answer}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#d5c09c]/55 bg-[#fbf6ee]">
          <div className="mx-auto flex w-full max-w-[1620px] flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a6f2d]">Ready To Explore Aadhya Serene?</p>
              <h2 className="mt-3 font-[var(--font-hero)] text-[clamp(2rem,3.4vw,3.4rem)] leading-[0.98] tracking-[-0.04em] text-[#2f2418]">
                Book your visit and experience the finished project in person.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex min-h-[52px] items-center gap-3 rounded-[1.15rem] bg-[#18253a] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#f2d395] shadow-[0_18px_36px_rgba(22,30,46,0.22)] transition hover:-translate-y-0.5"
              >
                Start Booking Form
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={PHONE_LINK}
                className="inline-flex min-h-[52px] items-center rounded-[1.15rem] border border-[#d8c4a5] bg-white px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[#2a2117] shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5"
              >
                Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isFormOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(17,11,6,0.62)] p-4 backdrop-blur-xl sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-auto max-h-[68vh] w-full max-w-5xl overflow-hidden rounded-[2.2rem] border border-[#d8bb85]/35 bg-[linear-gradient(180deg,rgba(252,247,239,0.98)_0%,rgba(248,241,230,0.98)_100%)] shadow-[0_36px_120px_rgba(0,0,0,0.34)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(226,195,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(24,37,58,0.08),transparent_26%)]" />

              <motion.button
                type="button"
                onClick={() => setIsFormOpen(false)}
                whileHover={{ scale: 1.06, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#92897f]/88 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition"
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <div className="relative hidden w-[30%] shrink-0 overflow-hidden md:block">
                <img
                  src={FORM_IMAGE}
                  alt="Aadhya Serene interior"
                  className="h-full w-full object-cover transition duration-700"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,8,6,0.08)_0%,rgba(9,8,6,0.24)_100%)]" />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.3rem] border border-white/15 bg-black/18 px-4 py-4 text-white backdrop-blur-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f1d6a4]">Signature Living</p>
                  <p className="mt-2 text-sm leading-6 text-white/88">
                    Answer a few quick questions and let our team tailor the right next step for you.
                  </p>
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="border-b border-[#e5d7c2] px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7234]">
                        {hasAutoOpened ? 'Priority Enquiry' : 'Book With Confidence'}
                      </p>
                      <h3 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-[#241c13]">
                        {currentStep.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-7 text-[#6c6154]">{currentStep.description}</p>
                    </div>
                    {/* <div className="rounded-full border border-[#e6d8bf] bg-white/70 px-4 py-2 text-right text-xs font-medium uppercase tracking-[0.18em] text-[#7d6b51] shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
                      Step {stepIndex + 1} / {FORM_STEPS.length}
                    </div> */}
                  </div>
                  <div className="mt-5 h-2.5 rounded-full bg-[#eadfce] shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#aa772a,#e2c381)] shadow-[0_8px_22px_rgba(210,167,86,0.26)]"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <form onSubmit={submitForm} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.26, ease: 'easeOut' }}
                      >
                        {currentStep.type === 'options' ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {currentStep.options.map((option, index) => {
                              const optionValue = typeof option === 'string' ? option : option.value;
                              const optionLabel = typeof option === 'string' ? option : option.label;

                              return (
                                <motion.div
                                  key={optionValue}
                                  initial={{ opacity: 0, y: 14 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.04, duration: 0.22 }}
                                  className="w-full"
                                >
                                  <FieldButton
                                    active={formData[currentStep.field] === optionValue}
                                    onClick={() => updateField(currentStep.field, optionValue)}
                                  >
                                    {optionLabel}
                                  </FieldButton>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : null}

                        {currentStep.type === 'textarea' ? (
                          <div className="grid gap-4">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-[#4d4338]" htmlFor="notes">
                                Optional Note
                              </label>
                              <textarea
                                id="notes"
                                rows={6}
                                value={formData.message}
                                onChange={(event) => updateField('message', event.target.value)}
                                className="w-full rounded-[1.6rem] border border-[#e0d3bf] bg-white/92 px-4 py-3 text-sm text-[#2b241b] shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#b58739] focus:ring-4 focus:ring-[#b58739]/12"
                                placeholder="Preferred facing, budget comfort, loan help, family needs, or anything else..."
                              />
                            </div>
                          </div>
                        ) : null}

                        {currentStep.type === 'contact' ? (
                          <div className="grid gap-4">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-[#4d4338]" htmlFor="name">
                                Full Name
                              </label>
                              <input
                                id="name"
                                value={formData.name}
                                onChange={(event) => updateField('name', event.target.value)}
                                className="h-12 w-full rounded-[1.4rem] border border-[#e0d3bf] bg-white/92 px-4 text-sm text-[#2b241b] shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#b58739] focus:ring-4 focus:ring-[#b58739]/12"
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-[#4d4338]" htmlFor="phone">
                                  Phone Number
                                </label>
                                <input
                                  id="phone"
                                  value={formData.phone}
                                  onChange={(event) => updateField('phone', event.target.value)}
                                  className="h-12 w-full rounded-[1.4rem] border border-[#e0d3bf] bg-white/92 px-4 text-sm text-[#2b241b] shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#b58739] focus:ring-4 focus:ring-[#b58739]/12"
                                  placeholder="+91"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-[#4d4338]" htmlFor="email">
                                  Email Address
                                </label>
                                <input
                                  id="email"
                                  type="email"
                                  value={formData.email}
                                  onChange={(event) => updateField('email', event.target.value)}
                                  className="h-12 w-full rounded-[1.4rem] border border-[#e0d3bf] bg-white/92 px-4 text-sm text-[#2b241b] shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#b58739] focus:ring-4 focus:ring-[#b58739]/12"
                                  placeholder="you@example.com"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    </AnimatePresence>

                    {submitState.message ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                          submitState.type === 'success'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        {submitState.message}
                      </motion.div>
                    ) : null}
                  </div>

                  <div className="border-t border-[#e5d7c2] px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <motion.button
                        type="button"
                        onClick={prevStep}
                        disabled={stepIndex === 0 || isSubmitting}
                        whileHover={stepIndex === 0 || isSubmitting ? undefined : { y: -1 }}
                        whileTap={stepIndex === 0 || isSubmitting ? undefined : { scale: 0.98 }}
                        className="inline-flex min-h-[48px] items-center rounded-[1.05rem] border border-black/8 bg-white/78 px-5 text-sm font-semibold text-[#493f35] shadow-[0_12px_24px_rgba(0,0,0,0.04)] transition hover:bg-[#faf5ee] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Back
                      </motion.button>

                      {stepIndex < FORM_STEPS.length - 1 ? (
                        <motion.button
                          type="button"
                          onClick={nextStep}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-[1.1rem] bg-[linear-gradient(180deg,#1d2d47_0%,#16253d_100%)] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#f2d395] shadow-[0_18px_36px_rgba(24,37,58,0.26)] transition"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          whileHover={isSubmitting ? undefined : { y: -2, scale: 1.01 }}
                          whileTap={isSubmitting ? undefined : { scale: 0.99 }}
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-[1.1rem] bg-[linear-gradient(180deg,#1d2d47_0%,#16253d_100%)] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#f2d395] shadow-[0_18px_36px_rgba(24,37,58,0.26)] transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                          <CalendarClock className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
