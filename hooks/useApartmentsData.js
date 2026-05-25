/**
 * useApartmentsData - reads Mongo-backed inventory with a static fallback.
 */
import { useEffect, useMemo, useState } from 'react';
import { flatsData } from '../lib/flats';

const FLATS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFlatsPayload = flatsData;
let cachedFlatsAt = 0;
let flatsRequestPromise = null;

const INITIAL_FILTERS = {
    type: [],
    facing: [],
    floor: [],
    balconies: [],
    areaRange: [800, 1600],
    availableOnly: false,
    withBalcony: false,
};

export function useApartmentsData() {
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [allData, setAllData] = useState(cachedFlatsPayload);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let idleHandle = null;
        let timeoutHandle = null;

        async function fetchFlatsOnce() {
            if (flatsRequestPromise) {
                return flatsRequestPromise;
            }

            flatsRequestPromise = fetch('/api/flats', { cache: 'force-cache' })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Unable to load flats');
                    }

                    return response.json();
                })
                .then((payload) => {
                    if (Array.isArray(payload.flats)) {
                        cachedFlatsPayload = payload.flats;
                        cachedFlatsAt = Date.now();
                    }

                    return cachedFlatsPayload;
                })
                .finally(() => {
                    flatsRequestPromise = null;
                });

            return flatsRequestPromise;
        }

        async function loadFlats({ showLoading = false, force = false } = {}) {
            const hasFreshCache = cachedFlatsAt > 0
                && Date.now() - cachedFlatsAt < FLATS_CACHE_TTL_MS;

            if (!force && hasFreshCache) {
                setAllData(cachedFlatsPayload);
                setError(null);
                return;
            }

            if (showLoading) {
                setLoading(true);
            }

            try {
                const flats = await fetchFlatsOnce();
                if (!cancelled && Array.isArray(flats)) {
                    setAllData(flats);
                    setError(null);
                }
            } catch (nextError) {
                if (!cancelled) {
                    setError(nextError);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        setAllData(cachedFlatsPayload);
        void loadFlats({ showLoading: cachedFlatsPayload.length === 0 });

        const refreshWhenIdle = () => {
            void loadFlats({ force: true });
        };

        if (typeof window !== 'undefined') {
            if (typeof window.requestIdleCallback === 'function') {
                idleHandle = window.requestIdleCallback(refreshWhenIdle, { timeout: 5000 });
            } else {
                timeoutHandle = window.setTimeout(refreshWhenIdle, 2400);
            }
        }

        return () => {
            cancelled = true;
            if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleHandle);
            }
            if (timeoutHandle !== null) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, []);

    const filteredData = useMemo(() => {
        return allData.filter((flat) => {
            if (filters.type.length > 0 && !filters.type.includes(flat.type)) return false;
            if (filters.facing.length > 0 && !filters.facing.includes(flat.facing)) return false;
            if (filters.floor.length > 0 && !filters.floor.includes(flat.floor)) return false;
            if (
                filters.balconies.length > 0 &&
                !filters.balconies.includes(String(flat.balconies))
            ) {
                return false;
            }
            if (flat.area < filters.areaRange[0] || flat.area > filters.areaRange[1]) return false;
            if (filters.availableOnly && flat.status !== 'available') return false;
            if (filters.withBalcony && flat.balconies === 0) return false;
            return true;
        });
    }, [allData, filters]);

    const toggleFilter = (category, value) => {
        setFilters((prev) => {
            const current = prev[category];
            const alreadySelected = current.includes(value);

            return {
                ...prev,
                [category]: alreadySelected ? [] : [value],
            };
        });
    };

    const setAreaRange = (range) =>
        setFilters((prev) => ({ ...prev, areaRange: range }));

    const toggleBoolean = (key) =>
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

    const resetFilters = () => setFilters(INITIAL_FILTERS);

    return {
        data: filteredData,
        allData,
        totalCount: filteredData.length,
        totalUnfiltered: allData.length,
        loading,
        error,
        filters,
        toggleFilter,
        setAreaRange,
        toggleBoolean,
        resetFilters,
    };
}
