import React from 'react';
import styles from '../../app/location/location.module.css';

const CATEGORIES = {
    Transport: { color: '#f97316' },
    Shopping: { color: '#22c55e' },
    Work: { color: '#3b82f6' },
    Education: { color: '#a855f7' },
    Healthcare: { color: '#ef4444' }
};

export default function Sidebar({
    places,
    filters,
    onToggleFilter,
    onSelectAll,
    onClearAll,
    onPlaceClick
}) {
    const filteredPlaces = places.filter(place => filters[place.category]);

    return (
        <aside className={styles.sidebar} aria-label="Filters and results">
            <div>
                <h1 className={styles.title}>AADHYASERENE</h1>
                <p className={styles.subtitle}>A curated lifestyle radius around your home.</p>
            </div>

            <div>
                <div className={styles.filtersHeader}>
                    <span>Filters</span>
                    <div className={styles.filterActions}>
                        <button type="button" className={styles.actionBtn} onClick={onSelectAll}>Select all</button>
                        <button type="button" className={styles.actionBtn} onClick={onClearAll}>Clear</button>
                    </div>
                </div>

                <div className={styles.filters} role="group" aria-label="Categories">
                    {Object.keys(CATEGORIES).map(category => (
                        <label key={category} className={styles.filterRow}>
                            <input
                                type="checkbox"
                                className={styles.filterCheckbox}
                                checked={!!filters[category]}
                                onChange={() => onToggleFilter(category)}
                            />
                            <span
                                className={styles.filterDot}
                                style={{ backgroundColor: CATEGORIES[category].color }}
                                aria-hidden="true"
                            ></span>
                            <span className={styles.filterLabel}>{category}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className={styles.list}>
                <div className={styles.listHeader}>
                    <span>Nearby Highlights</span>
                    <span>{filteredPlaces.length} results</span>
                </div>
                {filteredPlaces.map((place, index) => (
                    <button
                        key={index}
                        type="button"
                        className={styles.listItemButton}
                        onClick={() => onPlaceClick(place)}
                    >
                        <div className={styles.listItem}>
                            <div className={styles.placeName}>{place.name}</div>
                            <div className={styles.placeMeta}>
                                <span
                                    className={styles.placeCategoryDot}
                                    style={{ backgroundColor: CATEGORIES[place.category].color }}
                                ></span>
                                <span>{place.category}</span>
                                <span>•</span>
                                <span>{place.distance}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}
