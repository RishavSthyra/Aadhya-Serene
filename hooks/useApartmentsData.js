/**
 * useApartmentsData - pulls flat list directly from lib/flats.js
 * (the single source of truth, covering all 7 floors G-6)
 */
import { useMemo, useState } from 'react';
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

    const filteredData = useMemo(() => {
        return flatsData.filter((flat) => {
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
    }, [filters]);

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
        allData: flatsData,
        totalCount: filteredData.length,
        totalUnfiltered: flatsData.length,
        loading: false,
        error: null,
        filters,
        toggleFilter,
        setAreaRange,
        toggleBoolean,
        resetFilters,
    };
}
