'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CDN = 'https://du67w5n77drxm.cloudfront.net';

const PROJECT_METRICS = [
    { value: '1.2', label: 'Acre enclave' },
    { value: 'G + 6', label: 'Signature floors' },
    { value: '2 & 3', label: 'BHK residences' },
    { value: '136', label: 'Curated homes' },
    { value: '10+', label: 'Lifestyle amenities' },
    { value: '1-3', label: 'Private balconies' },
];

const PROJECT_BADGES = [
    { src: `${CDN}/images/badges/exclusive.png`, alt: 'Exclusive Terrace' },
    { src: `${CDN}/images/badges/bbmp.png`, alt: 'BBMP' },
    { src: `${CDN}/images/badges/rera.png`, alt: 'RERA' },
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

export default function About() {
    const router = useRouter();
    const isNavigatingRef = useRef(false);

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

        const onWheel = (e) => {
            if (isNavigatingRef.current) return;
            if (e.deltaY > 30) navigateTo('/apartments');
            if (e.deltaY < -30) navigateTo('/');
        };

        let touchStartY = 0;

        const onTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const onTouchEnd = (e) => {
            const dy = touchStartY - e.changedTouches[0].clientY;
            if (dy > 60) navigateTo('/apartments');
            if (dy < -60) navigateTo('/');
        };

        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [navigateTo]);

    return (
        <main
            id="about-container"
            className="pointer-events-none fixed inset-0 z-10 grid items-end gap-5 px-4 pb-7 pt-24 md:px-6 lg:justify-between lg:[grid-template-columns:minmax(470px,560px)_360px] lg:px-8 xl:px-10"
        >
            <section className="pointer-events-auto relative overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(17,17,19,0.84)_0%,rgba(11,11,13,0.74)_100%)] shadow-[0_32px_90px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[22px]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,184,126,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(123,92,52,0.14),transparent_28%)]" />

                <div className="relative z-[1] flex h-full flex-col gap-7 p-6 md:p-7 xl:p-8">
                    <div className="flex items-center gap-4">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d8bc83]">
                            About Aadhya Serene
                        </p>
                        <span className="h-px flex-1 bg-gradient-to-r from-[#d8bc83]/35 to-transparent" />
                    </div>

                    <div className="space-y-5">
                        <h1 className="max-w-full text-[clamp(2rem,3.3vw,3.75rem)] font-normal leading-[0.94] tracking-[-0.06em] text-[#f4ede2] [font-family:Georgia,Times_New_Roman,serif]">
                            Quiet luxury for a calmer way to live.
                        </h1>

                        <p className="max-w-full text-[clamp(0.94rem,0.95vw,1rem)] font-light leading-[1.82] text-white/72">
                            Aadhya Serene is crafted for those who value clean
                            architecture, generous light, and a more composed living
                            experience in North Bengaluru. Every detail is shaped to
                            feel elevated, elegant, and effortlessly comfortable.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {DESIGN_HIGHLIGHTS.map((item) => (
                            <span
                                key={item}
                                className="inline-flex min-h-9 items-center rounded-full bg-white/[0.04] px-4 text-[10px] uppercase tracking-[0.13em] text-[#eee1c7] shadow-[inset_0_0_0_1px_rgba(222,198,147,0.12)]"
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
                </div>
            </section>

            <section className="pointer-events-auto relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(16,16,18,0.86)_0%,rgba(10,10,12,0.76)_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[22px] md:p-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,126,0.14),transparent_34%)]" />

                <div className="relative z-[1] flex flex-col gap-5">
                    <div className="space-y-2">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d8bc83]">
                            Project Brief
                        </p>
                        <p className="m-0 max-w-[24ch] text-[13px] leading-[1.75] text-white/68">
                            Essential details with a quieter, more luxurious finish.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {PROJECT_METRICS.map((metric) => (
                            <div
                                key={metric.label}
                                className="flex min-h-[90px] flex-col justify-between rounded-[18px] bg-white/[0.04] px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(222,198,147,0.08)] transition-transform duration-200 hover:-translate-y-0.5"
                            >
                                <span className="text-[clamp(1.45rem,2vw,2rem)] leading-none tracking-[-0.05em] text-[#f4ead8] [font-family:Georgia,Times_New_Roman,serif]">
                                    {metric.value}
                                </span>
                                <span className="text-[10px] font-semibold uppercase leading-[1.45] tracking-[0.16em] text-white/52">
                                    {metric.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-1 pt-1">
                        {PROJECT_BADGES.map((badge) => (
                            <div key={badge.alt} className="flex flex-1 items-center justify-center">
                                <img
                                    src={badge.src}
                                    alt={badge.alt}
                                    width={56}
                                    height={56}
                                    className="h-14 w-14 object-contain [filter:saturate(1)_brightness(1.02)_drop-shadow(0_8px_18px_rgba(0,0,0,0.22))]"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#dec693]/45 to-transparent" />

                    <button
                        type="button"
                        onClick={() => navigateTo('/apartments')}
                        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#dbc08a] to-[#b69456] px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111214] shadow-[0_12px_28px_rgba(180,140,67,0.24),inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.03]"
                    >
                        <span>Explore Apartments</span>
                        <ChevronRight />
                    </button>

                    <p className="m-0 text-center text-[10px] leading-[1.7] text-white/42">
                        The images and walkthroughs shown are artistic representations
                        and may vary from the final delivered experience.
                    </p>
                </div>
            </section>
        </main>
    );
}
