'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../app/amenities/amenities.module.css';

// React Icons
import { GiHut, GiKidSlide, GiShuttlecock } from 'react-icons/gi';
import { FaTableTennis, FaBasketballBall, FaPlay, FaPause } from 'react-icons/fa';
import { LuPartyPopper } from 'react-icons/lu';

// Custom SVG Icons from Original Source
const SwimmingPoolIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
        <path d="M11,13 C11.5,13.5 13.1299859,12.8876287 14.2620192,12.5 C15.7222222,12 17.5,12.5 17,12 C15.3609614,10.3609614 15,10 15,10 C15,10 10.5,12.5 11,13 Z M2,20 C4,20 5,19 7,19 C9,19 10,20 12,20 C14,20 15,19 17,19 C19,19 20,20 22,20 M2,16 C4,16 5,15 7,15 C9,15 10,16 12,16 C14,16 15,15 17,15 C19,15 20,16 22,16 M17.5,4 L12.2222222,7 L15.5,10.5 L12,12 M19.2222222,10 C19.774507,10 20.2222222,9.55228475 20.2222222,9 C20.2222222,8.44771525 19.774507,8 19.2222222,8 C18.6699375,8 18.2222222,8.44771525 18.2222222,9 C18.2222222,9.55228475 18.6699375,10 19.2222222,10 Z" />
    </svg>
);

const GymIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '1em', height: '1em' }}>
        <path d="M20.2739 9.86883L16.8325 4.95392L18.4708 3.80676L21.9122 8.72167L20.2739 9.86883Z" />
        <path d="M18.3901 12.4086L16.6694 9.95121L8.47783 15.687L10.1985 18.1444L8.56023 19.2916L3.97162 12.7383L5.60992 11.5912L7.33068 14.0487L15.5222 8.31291L13.8015 5.8554L15.4398 4.70825L20.0284 11.2615L18.3901 12.4086Z" />
        <path d="M20.7651 7.08331L22.4034 5.93616L21.2562 4.29785L19.6179 5.445L20.7651 7.08331Z" />
        <path d="M7.16753 19.046L3.72607 14.131L2.08777 15.2782L5.52923 20.1931L7.16753 19.046Z" />
        <path d="M4.38208 18.5549L2.74377 19.702L1.59662 18.0637L3.23492 16.9166L4.38208 18.5549Z" />
    </svg>
);

const AMENITIES_LIST = [
    { name: "rooftop leisure deck", icon: GiHut, url: "rooftopLeisureDeck" },
    { name: "children’s play area", icon: GiKidSlide, url: "childrensPlayArea" },
    { name: "swimming pool", icon: SwimmingPoolIcon, url: "swimmingPool" },
    { name: "gymnasium", icon: GymIcon, url: "gymnasium" },
    { name: "indoor games lounge", icon: FaTableTennis, url: "indoorGames" },
    { name: "clubhouse", icon: LuPartyPopper, url: "clubhouse" },
    { name: "outdoor basketball court", icon: FaBasketballBall, url: "basketball" },
    { name: "outdoor badminton court", icon: GiShuttlecock, url: "badminton" }
];

export default function Amenities({ initialAmenity = null }) {
    const router = useRouter();
    const defaultAmenity = 'rooftopLeisureDeck';
    const isValidRequestedAmenity = AMENITIES_LIST.some((item) => item.url === initialAmenity);
    const selectedAmenityFromUrl = isValidRequestedAmenity ? initialAmenity : defaultAmenity;
    const [activeAmenity, setActiveAmenity] = useState(selectedAmenityFromUrl);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);

    // When mounted, default to no active amenity, but listen for video triggers
    useEffect(() => {
        // Eagerly restore body opacity if navigated from elsewhere
        document.body.style.opacity = '1';
        document.body.style.transition = '';
    }, []);

    // Effect to observe background video state via events from GlobalBackground
    useEffect(() => {
        const handleStart = () => setIsVideoPlaying(true);
        const handleEnd = () => setIsVideoPlaying(false);

        window.addEventListener('bg-transition-started', handleStart);
        window.addEventListener('bg-transition-ended', handleEnd);

        return () => {
            window.removeEventListener('bg-transition-started', handleStart);
            window.removeEventListener('bg-transition-ended', handleEnd);
        };
    }, []);

    useEffect(() => {
        setActiveAmenity(selectedAmenityFromUrl);
        window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${selectedAmenityFromUrl}` }));
    }, [selectedAmenityFromUrl]);

    const handleAmenityClick = (amenityUrl) => {
        if (activeAmenity === amenityUrl) {
            setActiveAmenity(defaultAmenity);
            router.replace('/amenities');
            window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${defaultAmenity}` }));
        } else {
            setActiveAmenity(amenityUrl);
            router.replace(`/amenities?amenity=${amenityUrl}`);
            window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${amenityUrl}` }));
        }
    };

    return (
        <main className={styles.container}>
            <section className={styles.sidebar}>
                <header className={styles.header}>
                    <h1>AMENITIES</h1>
                    <h2>We Give More</h2>
                    <p>
                        Embrace nature with landscaped gardens and walking trails.
                        Thoughtfully designed spaces bring serenity and freshness into your daily life.
                    </p>
                </header>

                <div className={styles.cardOverflowContainer}>
                    <ul className={styles.cardContainer} aria-label="Amenity list">
                        {AMENITIES_LIST.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeAmenity === item.url;

                            return (
                                <li
                                    key={item.url}
                                    className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                                    onClick={() => handleAmenityClick(item.url)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleAmenityClick(item.url);
                                            e.preventDefault();
                                        }
                                    }}
                                    aria-pressed={isActive}
                                >
                                    <div className={styles.cardButton}>
                                        <span className={styles.amenityIconContainer} aria-hidden="true">
                                            <Icon />
                                        </span>
                                        <span className={styles.amenityName}>
                                            {item.name}
                                        </span>
                                        <span className={`${styles.amenityPlayLabel} ${isActive ? styles.activeButton : styles.inactiveButton}`}>
                                            {isActive ? (
                                                <>
                                                    {/* In the original, the icon toggled based on paused state of the entire cinematic. For simplicity, we show actively playing or pause depending on if it's selected. */}
                                                    <FaPlay className={styles.playPauseIcon} aria-hidden="true" />
                                                    <span className={styles.playPauseText}>Playing</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaPlay className={styles.playPauseIcon} aria-hidden="true" />
                                                    <span className={styles.playPauseText}>Play</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </section>
        </main>
    );
}
