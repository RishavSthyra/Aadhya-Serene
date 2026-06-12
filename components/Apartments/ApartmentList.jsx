import React from 'react';
import ApartmentCard from './ApartmentCard';

export default function ApartmentList({ apartments, onSelect, compactMode = false }) {
    if (!apartments || apartments.length === 0) {
        return (
            <div className={`border border-[#eee4f7] bg-[linear-gradient(145deg,rgba(255,254,252,0.96)_0%,rgba(251,245,255,0.92)_100%)] text-center shadow-[0_20px_52px_rgba(194,175,221,0.12),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-[18px] ${compactMode ? 'rounded-[18px] px-4 py-10' : 'rounded-[20px] px-6 py-12'}`}>
                <p className={`${compactMode ? 'text-[9px] tracking-[0.2em]' : 'text-[10px] tracking-[0.24em]'} font-semibold uppercase text-[#ad9cb6]`}>
                    No Matches
                </p>
                <p className={`${compactMode ? 'mt-3 text-[12px] leading-6' : 'mt-4 text-sm leading-7'} text-[#7d718a]`}>
                    No apartments match the current selection. Try widening the
                    area range or clearing one of the active filters.
                </p>
            </div>
        );
    }

    return (
        <div className={compactMode ? "space-y-1.5" : "space-y-1.5"}>
            {apartments.map((apartment) => (
                <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    compactMode={compactMode}
                    onSelect={onSelect}
                />
            ))}
            {/* <div className="rounded-[24px] border border-white/16 bg-white/[0.1] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/48">
                    Collection note
                </p>
                <p className="mt-2 text-[11px] leading-5 text-white/62">
                    Adjust the filters to reveal lighter, larger, or more
                    balcony-oriented residences across the collection.
                </p>
            </div> */}
        </div>
    );
}
