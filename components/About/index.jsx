'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const ASSET_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com';

const PROJECT_METRICS = [
    { value: '1.2', label: 'Acre enclave' },
    { value: 'G + 6', label: 'Signature floors' },
    { value: '2 & 3', label: 'BHK residences' },
    { value: '136', label: 'Curated homes' },
    { value: '10+', label: 'Lifestyle amenities' },
    { value: '1-3', label: 'Private balconies' },
];

const PROJECT_BADGES = [
    { src: `${ASSET_BUCKET}/images/badges/exclusive.png`, alt: 'Exclusive Terrace', label: 'Exclusive Terrace' },
    { src: `${ASSET_BUCKET}/images/badges/bbmp.png`, alt: 'BBMP', label: 'BBMP Approved' },
    { src: `${ASSET_BUCKET}/images/badges/rera.png`, alt: 'RERA', label: 'RERA Registered' },
];

const DESIGN_HIGHLIGHTS = [
    'Thoughtfully planned residences',
    'Contemporary architecture',
    'Landscaped open surroundings',
];

const INFO_ITEMS = [
    {
        icon: 'location',
        title: 'Thanisandra, Bengaluru',
        detail: 'An address connected to the best of North Bengaluru.',
        href: 'https://maps.app.goo.gl/RDCEzLdhqbDhoMWR8',
    },
    {
        icon: 'size',
        title: '1001 sqft - 1498 sqft',
        detail: 'Well-proportioned 2 and 3 BHK residences.',
    },
    {
        icon: 'rera',
        title: 'RERA registered',
        detail: 'PRM / KA / RERA / 1251 / 446 / PR / 190614 / 002604',
    },
];

function LocationIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function SizeIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
        </svg>
    );
}

function ReraIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function ChevronRight() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13.1 12L8 6.9 9.4 5.5 16 12l-6.6 6.5L8 17.1z" />
            <path d="M7.1 12L2 6.9 3.4 5.5 10 12l-6.6 6.5L2 17.1z" opacity=".5" />
        </svg>
    );
}

function PanelChevron({ open }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
            aria-hidden="true"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

function InfoIcon({ type }) {
    const baseClass = 'flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-[#dfbf82] shadow-[inset_0_0_0_1px_rgba(223,191,130,0.15)]';

    if (type === 'location') {
        return (
            <span className={baseClass}>
                <LocationIcon />
            </span>
        );
    }

    if (type === 'size') {
        return (
            <span className={baseClass}>
                <SizeIcon />
            </span>
        );
    }

    return (
        <span className={baseClass}>
            <ReraIcon />
        </span>
    );
}

function InfoRow({ item }) {
    const content = (
        <>
            <InfoIcon type={item.icon} />
            <span className="flex min-w-0 flex-col gap-1">
                <strong className="text-[13px] font-medium tracking-[0.03em] text-[#f3ebdf]">
                    {item.title}
                </strong>
                <small className="text-[11.5px] leading-[1.7] tracking-[0.02em] text-white/58">
                    {item.detail}
                </small>
            </span>
        </>
    );

    if (item.href) {
        return (
            <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-4 py-4 text-left transition-transform duration-200 hover:translate-x-0.5"
            >
                {content}
            </a>
        );
    }

    return (
        <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-4 py-4">
            {content}
        </div>
    );
}

function OverviewPanelContent({ compact = false }) {
    return (
        <>
            <div className={compact ? 'space-y-4' : 'space-y-5'}>
                <h1 className={`max-w-full font-normal leading-[0.94] tracking-[-0.06em] text-[#f4ede2] [font-family:Georgia,Times_New_Roman,serif] ${compact ? 'text-[clamp(1.8rem,8vw,2.5rem)]' : 'text-[clamp(2rem,3.3vw,3.75rem)]'}`}>
                    Quiet luxury for a calmer way to live.
                </h1>

                <p className={`max-w-full font-light text-white/72 ${compact ? 'text-[0.93rem] leading-[1.74]' : 'text-[clamp(0.94rem,0.95vw,1rem)] leading-[1.82]'}`}>
                    Aadhya Serene is crafted for those who value clean architecture,
                    generous light, and a more composed living experience in North
                    Bengaluru. Every detail is shaped to feel elevated, elegant, and
                    effortlessly comfortable.
                </p>
            </div>

            <div className={`flex flex-wrap ${compact ? 'gap-2.5' : 'gap-3'}`}>
                {DESIGN_HIGHLIGHTS.map((item) => (
                    <span
                        key={item}
                        className={`inline-flex items-center rounded-full bg-white/[0.04] text-[#eee1c7] shadow-[inset_0_0_0_1px_rgba(222,198,147,0.12)] ${compact ? 'min-h-8 px-3 text-[9px] tracking-[0.12em]' : 'min-h-9 px-4 text-[10px] tracking-[0.13em]'} uppercase`}
                    >
                        {item}
                    </span>
                ))}
            </div>

            <div className="divide-y divide-white/8">
                {INFO_ITEMS.map((item) => (
                    <InfoRow key={item.title} item={item} />
                ))}
            </div>
        </>
    );
}

function ProjectBriefContent({ failedBadges, onBadgeError, compact = false, onExplore }) {
    return (
        <>
            <div className={compact ? 'space-y-2' : 'space-y-2'}>
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d8bc83]">
                    Project Brief
                </p>
                <p className={`m-0 text-white/68 ${compact ? 'max-w-full text-[12.5px] leading-[1.7]' : 'max-w-[24ch] text-[13px] leading-[1.75]'}`}>
                    Essential details with a quieter, more luxurious finish.
                </p>
            </div>

            <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-2.5'}`}>
                {PROJECT_METRICS.map((metric) => (
                    <div
                        key={metric.label}
                        className={`flex flex-col justify-between rounded-[18px] bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(222,198,147,0.08)] transition-transform duration-200 hover:-translate-y-0.5 ${compact ? 'min-h-[82px] px-3.5 py-3' : 'min-h-[90px] px-4 py-3.5'}`}
                    >
                        <span className={`leading-none tracking-[-0.05em] text-[#f4ead8] [font-family:Georgia,Times_New_Roman,serif] ${compact ? 'text-[1.35rem]' : 'text-[clamp(1.45rem,2vw,2rem)]'}`}>
                            {metric.value}
                        </span>
                        <span className={`font-semibold uppercase leading-[1.45] text-white/52 ${compact ? 'text-[9px] tracking-[0.14em]' : 'text-[10px] tracking-[0.16em]'}`}>
                            {metric.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className={`grid grid-cols-3 ${compact ? 'gap-2 pt-1' : 'gap-3 px-1 pt-1'}`}>
                {PROJECT_BADGES.map((badge, index) => {
                    const hasFailed = failedBadges[index];

                    return (
                        <div
                            key={badge.alt}
                            className="flex min-w-0 flex-col items-center gap-2 rounded-[16px] bg-white/[0.03] px-2 py-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        >
                            {hasFailed ? (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#f0dfb6]">
                                    {badge.alt}
                                </div>
                            ) : (
                                <img
                                    src={badge.src}
                                    alt={badge.alt}
                                    width={48}
                                    height={48}
                                    loading="lazy"
                                    decoding="async"
                                    onError={() => onBadgeError(index)}
                                    className="h-12 w-12 object-contain [filter:saturate(1)_brightness(1.02)_drop-shadow(0_8px_18px_rgba(0,0,0,0.22))]"
                                />
                            )}
                            <span className="text-[9px] font-semibold uppercase leading-[1.45] tracking-[0.12em] text-white/66">
                                {badge.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#dec693]/45 to-transparent" />

            <button
                type="button"
                onClick={onExplore}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#dbc08a] to-[#b69456] px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111214] shadow-[0_12px_28px_rgba(180,140,67,0.24),inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.03]"
            >
                <span>Explore Apartments</span>
                <ChevronRight />
            </button>

            <p className={`m-0 text-center text-white/42 ${compact ? 'text-[9px] leading-[1.6]' : 'text-[10px] leading-[1.7]'}`}>
                The images and walkthroughs shown are artistic representations and
                may vary from the final delivered experience.
            </p>
        </>
    );
}

export default function About() {
    const router = useRouter();
    const isNavigatingRef = useRef(false);
    const [mobilePanel, setMobilePanel] = useState('overview');
    const [isMobileCardOpen, setIsMobileCardOpen] = useState(true);
    const [failedBadges, setFailedBadges] = useState({});

    const navigateTo = useCallback((path) => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;

        if (path === '/') {
            window.dispatchEvent(new CustomEvent('bg-layout', { detail: 'home' }));
        }

        const container = document.getElementById('about-container');

        if (container) {
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.6s ease';
        } else {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.6s ease';
        }

        setTimeout(() => router.push(path), 600);
    }, [router]);

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

        const onWheel = (e) => {
            if (isNavigatingRef.current) return;
            if (e.deltaY > 30) navigateTo('/apartments');
            if (e.deltaY < -30) navigateTo('/');
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

    const handleBadgeError = useCallback((index) => {
        setFailedBadges((current) => {
            if (current[index]) return current;
            return { ...current, [index]: true };
        });
    }, []);

    return (
        <main
            id="about-container"
            className="fixed inset-0 z-10 px-4 pb-24 pt-20 md:px-6 md:pb-7 md:pt-24 lg:px-8 xl:px-10"
        >
            <div className="pointer-events-none h-full overflow-y-auto overscroll-contain md:hidden">
                <button
                    type="button"
                    onClick={() => setIsMobileCardOpen((current) => !current)}
                    className={`pointer-events-auto fixed right-2 top-1/2 z-[22] flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-full border shadow-[0_14px_34px_rgba(0,0,0,0.26)] backdrop-blur-xl transition-colors duration-300 ${isMobileCardOpen ? 'border-white/35 bg-[#e1c07d] text-[#161616]' : 'border-white/18 bg-[#121316]/92 text-[#f0dfb6]'}`}
                    aria-label={isMobileCardOpen ? 'Hide about panel' : 'Show about panel'}
                >
                    <PanelChevron open={isMobileCardOpen} />
                </button>

                <div className="flex min-h-full items-end justify-end overflow-x-hidden pb-2 pr-1">
                    <section
                        className="pointer-events-auto relative w-full max-w-[430px] overflow-visible transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                            transform: isMobileCardOpen
                                ? 'translateX(0)'
                                : 'translateX(calc(100% + 2rem))',
                        }}
                    >
                        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(17,17,19,0.88)_0%,rgba(10,10,12,0.8)_100%)] shadow-[0_28px_84px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[22px]">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,184,126,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(123,92,52,0.14),transparent_28%)]" />

                            <div className="relative z-[1] flex flex-col gap-5 p-5">
                                <div className="flex items-center gap-3">
                                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d8bc83]">
                                        About Aadhya Serene
                                    </p>
                                    <span className="h-px flex-1 bg-gradient-to-r from-[#d8bc83]/35 to-transparent" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-black/15 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                                    {['overview', 'details'].map((panel) => {
                                        const active = mobilePanel === panel;

                                        return (
                                            <button
                                                key={panel}
                                                type="button"
                                                onClick={() => setMobilePanel(panel)}
                                                className={`min-h-10 rounded-[14px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${active ? 'bg-[#dbc08a] text-[#151515] shadow-[0_10px_24px_rgba(180,140,67,0.2)]' : 'text-white/70'}`}
                                            >
                                                {panel === 'overview' ? 'Overview' : 'Project Brief'}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-col gap-5">
                                    {mobilePanel === 'overview' ? (
                                        <OverviewPanelContent compact />
                                    ) : (
                                        <ProjectBriefContent
                                            compact
                                            failedBadges={failedBadges}
                                            onBadgeError={handleBadgeError}
                                            onExplore={() => navigateTo('/apartments')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <div className="pointer-events-none hidden h-full items-end gap-5 md:grid lg:justify-between lg:[grid-template-columns:minmax(470px,560px)_360px]">
                <section className="pointer-events-auto relative overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(17,17,19,0.84)_0%,rgba(11,11,13,0.74)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[22px]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,184,126,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(123,92,52,0.14),transparent_28%)]" />

                    <div className="relative z-[1] flex h-full flex-col gap-7 p-6 md:p-7 xl:p-8">
                        <div className="flex items-center gap-4">
                            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d8bc83]">
                                About Aadhya Serene
                            </p>
                            <span className="h-px flex-1 bg-gradient-to-r from-[#d8bc83]/35 to-transparent" />
                        </div>

                        <OverviewPanelContent />
                    </div>
                </section>

                <section className="pointer-events-auto relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(16,16,18,0.86)_0%,rgba(10,10,12,0.76)_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[22px] md:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,126,0.14),transparent_34%)]" />

                    <div className="relative z-[1] flex flex-col gap-5">
                        <ProjectBriefContent
                            failedBadges={failedBadges}
                            onBadgeError={handleBadgeError}
                            onExplore={() => navigateTo('/apartments')}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
