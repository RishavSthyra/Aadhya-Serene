/**
 * useApartmentsData - reads Mongo-backed inventory with a static fallback.
 */
import { useEffect, useMemo, useState } from 'react';
import { flatsData } from '../lib/flats';

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
    const [allData, setAllData] = useState(flatsData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadFlats({ showLoading = false } = {}) {
            if (showLoading) {
                setLoading(true);
            }

            try {
                const response = await fetch('/api/flats', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('Unable to load flats');
                }

                const payload = await response.json();
                if (!cancelled && Array.isArray(payload.flats)) {
                    setAllData(payload.flats);
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

        void loadFlats({ showLoading: allData.length === 0 });
        const intervalId = window.setInterval(() => {
            void loadFlats();
        }, 30000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [allData.length]);

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
