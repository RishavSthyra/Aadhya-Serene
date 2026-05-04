'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useResponsiveViewport from '@/hooks/useResponsiveViewport';
import styles from '../../app/amenities/amenities.module.css';

const AMENITY_POSTERS = {
    rooftopLeisureDeck: '/assets/amenities/rooftopLeisureDeck.jpg',
    childrensPlayArea: '/assets/amenities/childrensPlayArea.jpg',
    swimmingPool: '/assets/amenities/swimmingPool.jpg',
    gymnasium: '/assets/amenities/gymnasium.jpg',
    indoorGames: '/assets/amenities/indoorGames.jpg',
    clubhouse: '/assets/amenities/clubhouse.jpg',
    basketball: '/assets/amenities/basketball.jpg',
    badminton: '/assets/amenities/badminton.jpg',
};

const AMENITY_FALLBACK = '/assets/amenities/rooftopLeisureDeck.jpg';

const AMENITIES_LIST = [
    { name: 'rooftop leisure deck', url: 'rooftopLeisureDeck' },
    { name: "children's play area", url: 'childrensPlayArea' },
    { name: 'swimming pool', url: 'swimmingPool' },
    { name: 'gymnasium', url: 'gymnasium' },
    { name: 'indoor games lounge', url: 'indoorGames' },
    { name: 'clubhouse', url: 'clubhouse' },
    { name: 'outdoor basketball court', url: 'basketball' },
    { name: 'outdoor badminton court', url: 'badminton' },
];

export default function Amenities({ initialAmenity = null }) {
    const router = useRouter();
    const { isTabletOrBelow } = useResponsiveViewport();
    const defaultAmenity = 'rooftopLeisureDeck';
    const isValidRequestedAmenity = AMENITIES_LIST.some((item) => item.url === initialAmenity);
    const selectedAmenityFromUrl = isValidRequestedAmenity ? initialAmenity : defaultAmenity;
    const [activeAmenity, setActiveAmenity] = useState(selectedAmenityFromUrl);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.style.opacity = '1';
        document.body.style.transition = '';
    }, []);

    useEffect(() => {
        setActiveAmenity(selectedAmenityFromUrl);
        window.dispatchEvent(new CustomEvent('bg-layout', { detail: `amenities-${selectedAmenityFromUrl}` }));
    }, [selectedAmenityFromUrl]);

    useEffect(() => {
        setIsSidebarOpen((current) => (isTabletOrBelow ? current : true));
    }, [isTabletOrBelow]);

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

        if (isTabletOrBelow) {
            setIsSidebarOpen(false);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    const sidebarClass = `${styles.sidebar} ${isSidebarOpen ? styles.mobileOpen : styles.mobileClosed}`;

    return (
        <main className={styles.container}>
            <div
                className={`${styles.mobileBackdrop} ${isSidebarOpen ? styles.visible : ''}`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />

            <button
                className={`${styles.hamburgerBtn} ${isSidebarOpen ? styles.open : ''}`}
                onClick={toggleSidebar}
                aria-label="Toggle amenities sidebar"
                aria-expanded={isSidebarOpen}
                aria-controls="amenities-sidebar"
                type="button"
            >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
            </button>

            <section
                id="amenities-sidebar"
                className={sidebarClass}
                role="complementary"
                aria-label="Amenities sidebar"
            >
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1>AMENITIES</h1>
                        <span className={styles.headerBadge}>8 Spaces</span>
                    </div>
                    <h2>We Give More</h2>
                    <p>
                        Embrace nature with landscaped gardens and walking trails.
                        Thoughtfully designed spaces bring serenity and freshness into your daily life.
                    </p>
                </header>

                <div className={styles.cardOverflowContainer}>
                    <ul className={styles.cardContainer} aria-label="Amenity list">
                        {AMENITIES_LIST.map((item) => {
                            const isActive = activeAmenity === item.url;
                            const posterSrc = AMENITY_POSTERS[item.url] || AMENITY_FALLBACK;

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
                                    aria-label={item.name}
                                >
                                    <div className={styles.cardButton}>
                                        <div className={styles.amenityImageContainer}>
                                            <img
                                                src={posterSrc}
                                                alt={item.name}
                                                className={styles.amenityImage}
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.currentTarget.src = AMENITY_FALLBACK;
                                                }}
                                            />
                                        </div>
                                        <div className={styles.cardInfoRow}>
                                            <span className={styles.amenityName}>
                                                {item.name}
                                            </span>
                                            <span className={`${styles.amenityPlayLabel} ${isActive ? styles.activeButton : styles.inactiveButton}`}>
                                                <svg
                                                    className={styles.playPauseIcon}
                                                    viewBox="0 0 10 10"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    {isActive ? (
                                                        <path d="M2 1.5h2.5v7H2z" />
                                                    ) : (
                                                        <path d="M2 1.5l6 3.5-6 3.5z" />
                                                    )}
                                                </svg>
                                                {isActive ? 'Playing' : 'Play'}
                                            </span>
                                        </div>
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
